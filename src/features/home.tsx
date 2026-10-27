import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Camera, CalendarHeart, Coffee, Flame, Flower2, Gem, Heart, Mail, Plane, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { messageOf, rpcOk } from '@/lib/db';
import { daysAwayText, daysBetween, daysUntilAnniversary, dayNumber, formatDay, milestoneSummary, timeAgo } from '@/lib/couple-time';
import { LOVE_NOTES } from '@/lib/ideas';
import { questionForDay } from '@/lib/questions';
import { currentStreak } from '@/lib/streak';
import { DailyPanel } from './daily';
import { PULSE_TEXT, useAnswers, useCouple, usePartnerAnswered, usePulses, useRefresh, useToday, type PulseKind } from './data';
import { AccountPrompt, Avatar, AppShell, WorldStatus } from './shell';
import { Notice, Sheet } from './ui';

const PULSES: PulseKind[] = ['heart', 'miss', 'kiss', 'hug'];

function PulseCard() {
  const { relId, userId, partner } = useCouple();
  const pulses = usePulses(relId);
  const refresh = useRefresh();
  const [busy, setBusy] = useState<PulseKind>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const partnerName = partner?.name || 'your partner';
  const theirs = (pulses.data ?? []).find(pulse => pulse.sender_id !== userId);

  const send = async (kind: PulseKind) => {
    setBusy(kind);
    setError('');
    setMessage('');
    try {
      await rpcOk('send_pulse', { p_kind: kind });
      setMessage(`Sent. ${partnerName} will feel it.`);
      await refresh('pulses');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <section className="pulse-card">
      <span className="small-label">A LITTLE MOMENT, JUST FOR THEM</span>
      <h2>Let {partnerName} know you care.</h2>
      <div className="pulse-buttons">
        {PULSES.map(kind => (
          <button key={kind} type="button" className="pulse-button" disabled={!!busy} onClick={() => send(kind)}>
            <Heart size={15} fill={kind === 'heart' ? 'currentColor' : 'none'} />
            {PULSE_TEXT[kind].send}
          </button>
        ))}
      </div>
      {message ? <p className="pulse-feedback">{message}</p> : null}
      {error ? <Notice>{error}</Notice> : null}
      {theirs ? (
        <p className="pulse-last">
          {partnerName} {PULSE_TEXT[theirs.kind]?.received ?? 'was thinking of you'} · {timeAgo(theirs.created_at)}
        </p>
      ) : null}
    </section>
  );
}

function MeetupCard() {
  const { relationship } = useCouple();
  const today = useToday();
  const refresh = useRefresh();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const next = relationship?.next_meetup && relationship.next_meetup >= today ? relationship.next_meetup : undefined;
  const away = next ? daysBetween(today, next) : undefined;

  const open = () => {
    setDate(next ?? '');
    setLabel(relationship?.meetup_label ?? '');
    setError('');
    setEditing(true);
  };

  const save = async (clear: boolean) => {
    setBusy(true);
    setError('');
    try {
      await rpcOk('set_next_meetup', { p_date: clear ? null : date || null, p_label: clear ? null : label });
      await refresh('world');
      setEditing(false);
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="meetup-card">
      <span className="icon-tile">{next ? <Plane size={21} /> : <CalendarHeart size={21} />}</span>
      <div className="meetup-text">
        <span className="small-label">{next ? (relationship?.meetup_label || 'UNTIL WE’RE TOGETHER').toUpperCase() : 'APART FOR A WHILE?'}</span>
        {next && away !== undefined ? (
          <>
            <strong className="meetup-count">
              {away === 0 ? 'Today!' : away}
              {away !== 0 ? <span> {away === 1 ? 'day' : 'days'}</span> : null}
            </strong>
            <p>
              {formatDay(next)} · {daysAwayText(away)}
            </p>
          </>
        ) : (
          <p>Set the day you’ll see each other next and count down together.</p>
        )}
      </div>
      <Button variant="soft" size="sm" onClick={open}>
        {next ? 'Change' : 'Set date'}
      </Button>
      {editing ? (
        <Sheet title="Next time together" onClose={() => setEditing(false)}>
          <label className="seal-field">
            <span>The day</span>
            <input type="date" min={today} value={date} onChange={event => setDate(event.target.value)} />
          </label>
          <input className="letter-title" aria-label="What is it?" placeholder="Weekend in Goa, Diwali at home…" maxLength={60} value={label} onChange={event => setLabel(event.target.value)} />
          {error ? <Notice>{error}</Notice> : null}
          <Button variant="romantic" size="roomy" disabled={busy || !date} onClick={() => save(false)}>
            {busy ? 'Saving…' : 'Start the countdown'} <Heart size={16} />
          </Button>
          {next ? (
            <Button variant="ghost" disabled={busy} onClick={() => save(true)}>
              Clear countdown
            </Button>
          ) : null}
        </Sheet>
      ) : null}
    </section>
  );
}

function MilestoneStrip({ anniversary, today }: { anniversary: string; today: string }) {
  const summary = milestoneSummary(anniversary, today);
  const next = summary.next;
  if (!next) return null;
  const away = daysBetween(today, next.date);
  return (
    <section className="milestone-strip">
      <span className="icon-tile">
        <Gem size={20} />
      </span>
      <div>
        <span className="small-label">NEXT MILESTONE</span>
        <h3>{next.label}</h3>
        <p>
          {formatDay(next.date)} · {daysAwayText(away)}
        </p>
      </div>
      {summary.previous ? <span className="milestone-prev">Last: {summary.previous.label}</span> : null}
    </section>
  );
}

function QuestionCard({ onOpen }: { onOpen: () => void }) {
  const { relId, userId } = useCouple();
  const today = useToday();
  const answers = useAnswers(relId);
  const partnerAnswered = usePartnerAnswered(relId);
  const rows = answers.data ?? [];
  const question = questionForDay(dayNumber(today));
  const mine = rows.some(row => row.user_id === userId && row.question_day === today);
  const theirs = rows.some(row => row.user_id !== userId && row.question_day === today) || partnerAnswered.data === true;
  const streak = currentStreak(rows, userId, today);
  const status = !answers.isSuccess ? 'Today’s question' : mine && theirs ? 'You both answered. See together' : mine ? 'Waiting for them' : theirs ? 'They answered. Your turn' : 'Today’s question';
  return (
    <section className="question-card">
      <div className="question-top">
        <span className="icon-tile">
          <Coffee size={21} />
        </span>
        <span className="small-label">A MOMENT FOR US</span>
        {streak > 0 ? <span className="streak-pill"><Flame size={13} /> {streak}</span> : null}
      </div>
      <h2>{question.text}</h2>
      <div className="question-bottom">
        <span>{status}</span>
        <Button variant="soft" onClick={onOpen}>
          {mine ? 'See answers' : 'Let’s talk'} <ArrowRight size={14} />
        </Button>
      </div>
    </section>
  );
}

export function HomeScreen() {
  const { world, user, me, partner, relationship } = useCouple();
  const today = useToday();
  const [question, setQuestion] = useState(false);
  const anniversary = relationship?.anniversary || me?.anniversary || undefined;
  const together = anniversary ? daysBetween(anniversary, today) : undefined;
  const untilAnniversary = anniversary ? daysUntilAnniversary(anniversary, today) : undefined;
  const note = LOVE_NOTES[((dayNumber(today) % LOVE_NOTES.length) + LOVE_NOTES.length) % LOVE_NOTES.length];

  return (
    <AppShell>
      <div className="page-heading">
        <div>
          <span className="eyebrow">OUR LITTLE WORLD</span>
          <h1>
            Home is <em>with you.</em>
          </h1>
          <p>A little love, a little closer, every day.</p>
        </div>
        <span className="heading-flower">
          <Flower2 size={35} strokeWidth={1} />
        </span>
      </div>
      <WorldStatus world={world} />
      <section className="couple-band">
        {!world.accountLoading && !user ? (
          <AccountPrompt />
        ) : (
          world.data && (
            <>
              <div className="couple-avatars">
                <Avatar profile={me} />
                <span className="avatar-heart">
                  <Heart size={15} fill="currentColor" />
                </span>
                <Avatar profile={partner} partner />
              </div>
              <h2>
                {me?.name || 'Your story'} <span>&</span> {partner?.name || 'Your other half'}
              </h2>
              <span className="example-caption">{relationship ? 'TOGETHER, AND CONNECTED' : 'NO PARTNER CONNECTED YET'}</span>
              {together !== undefined && untilAnniversary !== undefined && together >= 0 ? (
                <div className="relationship-stats">
                  <div>
                    <strong>
                      {together.toLocaleString('en-IN')}
                      <span>days</span>
                    </strong>
                    <p>of choosing each other</p>
                  </div>
                  <span className="stat-divider" />
                  <div>
                    <strong>
                      {untilAnniversary}
                      <span>days</span>
                    </strong>
                    <p>{untilAnniversary === 0 ? 'your anniversary is today' : 'until your anniversary'}</p>
                  </div>
                </div>
              ) : (
                <p className="preview-notice">Save your anniversary to begin your story.</p>
              )}
              {!relationship && (
                <Link to={me?.name ? '/connect' : '/setup'} className="preview-link">
                  {me?.name ? 'Invite your partner' : 'Set up your profile'} <ArrowRight size={14} />
                </Link>
              )}
              <span className="couple-since">
                <Heart size={11} /> A love worth celebrating
              </span>
            </>
          )
        )}
      </section>

      {relationship ? (
        <>
          <PulseCard />
          <QuestionCard onOpen={() => setQuestion(true)} />
          <MeetupCard />
          {anniversary ? <MilestoneStrip anniversary={anniversary} today={today} /> : null}
        </>
      ) : null}

      <section className="quote-section">
        <span className="eyebrow">
          <Sparkles size={13} /> A LITTLE LOVE NOTE
        </span>
        <blockquote>“{note}”</blockquote>
        <span className="quote-bottom">
          TODAY & EVERY DAY <Heart size={13} />
        </span>
      </section>

      <div className="section-heading">
        <h2>Little things, big feelings.</h2>
        <Heart size={16} />
      </div>
      <div className="quick-grid">
        <Link to="/our-space" className="quick-card letter-card">
          <span className="quick-icon">
            <Mail size={26} strokeWidth={1.2} />
          </span>
          <div>
            <h3>Love letters</h3>
            <p>Words from the heart</p>
          </div>
          <ArrowRight size={18} />
        </Link>
        <Link to="/memories" className="quick-card memory-card">
          <span className="quick-icon">
            <Camera size={26} strokeWidth={1.2} />
          </span>
          <div>
            <h3>Our memories</h3>
            <p>Moments to keep forever</p>
          </div>
          <ArrowRight size={18} />
        </Link>
      </div>
      <p className="home-footnote">
        Just us. Just love. <Heart size={11} />
      </p>

      {question ? (
        <Sheet title="A moment for us" onClose={() => setQuestion(false)}>
          <DailyPanel />
        </Sheet>
      ) : null}
    </AppShell>
  );
}
