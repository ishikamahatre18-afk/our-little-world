import { useMemo, useState } from 'react';
import { BookOpen, EyeOff, Heart, Lightbulb, PenLine, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { messageOf, rpcOk } from '@/lib/db';
import { dayNumber, formatDay, formatMonth } from '@/lib/couple-time';
import { MOODS } from '@/lib/needs';
import { DIARY_TOPICS } from '@/lib/topics';
import { useCouple, useJournal, useRefresh, useToday, type JournalRow } from './data';
import { Notice, Segmented, Sheet } from './ui';

const moodLabel = (mood: number | null) => MOODS.find(item => item.value === mood)?.label;
const topicAt = (index: number) => DIARY_TOPICS[((index % DIARY_TOPICS.length) + DIARY_TOPICS.length) % DIARY_TOPICS.length] as string;

function Composer({ onClose, initialTopic }: { onClose: () => void; initialTopic?: string | undefined }) {
  const today = useToday();
  const refresh = useRefresh();
  const { partner } = useCouple();
  const [title, setTitle] = useState(initialTopic ?? '');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState<number>();
  const [visibility, setVisibility] = useState<'shared' | 'private'>('shared');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shuffle, setShuffle] = useState(0);
  const partnerName = partner?.name || 'your partner';
  const ideas = useMemo(() => [0, 1, 2].map(offset => topicAt(dayNumber(today) * 3 + shuffle * 3 + offset + 7)), [today, shuffle]);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await rpcOk('add_journal_entry', { p_title: title, p_body: body, p_date: date, p_mood: mood ?? null, p_visibility: visibility });
      await refresh('journal', 'growth');
      onClose();
    } catch (problem) {
      setError(messageOf(problem));
      setBusy(false);
    }
  };

  return (
    <Sheet title="Our diary" onClose={onClose}>
      <Segmented
        value={visibility}
        onChange={setVisibility}
        options={[
          { value: 'shared', label: 'Share with us' },
          { value: 'private', label: 'Just for me' },
        ]}
      />
      <p className="preview-notice">{visibility === 'shared' ? `${partnerName} will see this on the same page as theirs, and it becomes part of how you’ve grown.` : 'Only you can ever read this. It stays out of your shared pages.'}</p>

      <div className="topic-box">
        <span className="small-label">
          <Lightbulb size={12} /> NOT SURE WHAT TO WRITE? PICK A TOPIC
        </span>
        <div className="topic-list">
          {ideas.map(topic => (
            <button type="button" key={topic} className={`topic-chip${title === topic ? ' is-active' : ''}`} onClick={() => setTitle(topic)}>
              {topic}
            </button>
          ))}
        </div>
        <button type="button" className="topic-more" onClick={() => setShuffle(value => value + 1)}>
          <RefreshCw size={12} /> Different ideas
        </button>
      </div>

      <input className="letter-title" aria-label="Topic or title" placeholder="A title or topic (optional)" maxLength={80} value={title} onChange={event => setTitle(event.target.value)} />
      <label className="seal-field">
        <span>Which day is this page?</span>
        <input type="date" max={today} min="1990-01-01" value={date} onChange={event => setDate(event.target.value)} />
      </label>
      <div className="chip-field">
        <span className="small-label">HOW DID IT FEEL? (OPTIONAL)</span>
        <div className="chip-row">
          {MOODS.map(item => (
            <button type="button" key={item.value} className={`chip${mood === item.value ? ' is-active' : ''}`} onClick={() => setMood(mood === item.value ? undefined : item.value)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <textarea className="diary-text" aria-label="Diary entry" placeholder="Write it the way you’d say it to them…" rows={8} maxLength={4000} value={body} onChange={event => setBody(event.target.value)} />
      {error ? <Notice>{error}</Notice> : null}
      <Button variant="romantic" size="roomy" disabled={busy || body.trim().length === 0 || !date} onClick={save}>
        {busy ? 'Saving…' : 'Add to our diary'} <Heart size={16} />
      </Button>
    </Sheet>
  );
}

function Entry({ entry, mine }: { entry: JournalRow; mine: boolean }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const remove = async () => {
    if (!window.confirm('Delete this entry? This can’t be undone.')) return;
    setBusy(true);
    setError('');
    try {
      await rpcOk('delete_journal_entry', { p_id: entry.id });
      await refresh('journal', 'growth');
    } catch (problem) {
      setError(messageOf(problem));
      setBusy(false);
    }
  };
  return (
    <div className="diary-entry">
      <div className="diary-tags">
        {moodLabel(entry.mood) ? <span className="mood-tag">{moodLabel(entry.mood)}</span> : null}
        {entry.visibility === 'private' ? (
          <span className="mood-tag private">
            <EyeOff size={11} /> Only you
          </span>
        ) : null}
      </div>
      {entry.title ? <h4>{entry.title}</h4> : null}
      <p className="diary-body">{entry.body}</p>
      {mine ? (
        <button type="button" className="diary-delete" disabled={busy} onClick={remove}>
          <Trash2 size={12} /> Delete
        </button>
      ) : null}
      {error ? <p className="form-notice">{error}</p> : null}
    </div>
  );
}

type Page = { date: string; mine: JournalRow[]; theirs: JournalRow[] };

function Spread({ page, userId, meName, partnerName }: { page: Page; userId: string | undefined; meName: string; partnerName: string }) {
  const both = page.mine.some(entry => entry.visibility === 'shared') && page.theirs.length > 0;
  const day = Number(page.date.slice(8, 10));
  const month = formatMonth(page.date).split(' ')[0] ?? '';
  return (
    <article className={`diary-spread${both ? ' is-both' : ''}`}>
      <div className="diary-date">
        <strong>{day}</strong>
        <span>{month.slice(0, 3).toUpperCase()}</span>
        <em>{page.date.slice(0, 4)}</em>
      </div>
      <div className="diary-columns">
        <section>
          <span className="small-label">{meName.toUpperCase()}</span>
          {page.mine.length > 0 ? page.mine.map(entry => <Entry key={entry.id} entry={entry} mine={entry.author_id === userId} />) : <p className="diary-empty">Nothing written yet.</p>}
        </section>
        <section>
          <span className="small-label">{partnerName.toUpperCase()}</span>
          {page.theirs.length > 0 ? page.theirs.map(entry => <Entry key={entry.id} entry={entry} mine={false} />) : <p className="diary-empty">{page.mine.length > 0 ? 'Their side of this page is still blank.' : 'Nothing written yet.'}</p>}
        </section>
      </div>
    </article>
  );
}

export function JournalPanel() {
  const { relId, userId, me, partner } = useCouple();
  const today = useToday();
  const journal = useJournal(relId);
  const [writing, setWriting] = useState<{ topic?: string | undefined } | null>(null);
  const [skip, setSkip] = useState(0);
  const entries = journal.data ?? [];
  const meName = me?.name || 'You';
  const partnerName = partner?.name || 'Your partner';
  const topic = topicAt(dayNumber(today) + skip);

  const pages = useMemo(() => {
    const byDate = new Map<string, Page>();
    for (const entry of entries) {
      const page = byDate.get(entry.entry_date) ?? { date: entry.entry_date, mine: [], theirs: [] };
      if (entry.author_id === userId) page.mine.push(entry);
      else page.theirs.push(entry);
      byDate.set(entry.entry_date, page);
    }
    return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, userId]);

  const months = useMemo(() => {
    const groups: { month: string; pages: Page[] }[] = [];
    for (const page of pages) {
      const month = formatMonth(page.date);
      const last = groups[groups.length - 1];
      if (last && last.month === month) last.pages.push(page);
      else groups.push({ month, pages: [page] });
    }
    return groups;
  }, [pages]);

  return (
    <div className="journal-panel">
      <section className="diary-hero">
        <BookOpen size={34} strokeWidth={1} />
        <span className="eyebrow">OUR SHARED DIARY</span>
        <h2>
          Two people, one page,
          <br />
          the same day.
        </h2>
        <div className="topic-today">
          <span className="small-label">
            <Lightbulb size={12} /> A TOPIC TO START WITH
          </span>
          <p>{topic}</p>
          <button type="button" className="topic-more" onClick={() => setSkip(value => value + 1)}>
            <RefreshCw size={12} /> Another topic
          </button>
        </div>
        <div className="diary-actions">
          <Button variant="romantic" size="roomy" onClick={() => setWriting({ topic })}>
            <PenLine size={16} /> Write about this
          </Button>
          <Button variant="ghost" onClick={() => setWriting({})}>
            Write freely
          </Button>
        </div>
        <p className="diary-note">When you both write about the same day, you’ll see your pages side by side. Share what you like, and keep the rest just for you.</p>
      </section>

      {journal.isPending ? <p className="preview-notice">Opening your diary…</p> : null}
      {journal.error ? <Notice>We couldn’t load your diary. Please try again in a moment.</Notice> : null}

      {journal.isSuccess && entries.length === 0 ? (
        <div className="empty-state">
          <Heart size={25} strokeWidth={1} />
          <h3>Your first page is waiting.</h3>
          <p>Pick a topic or write whatever is on your mind. Later, you can look back and see how far you’ve come.</p>
        </div>
      ) : null}

      <div className="timeline">
        {months.map(group => (
          <section key={group.month}>
            <h2 className="timeline-month">{group.month}</h2>
            {group.pages.map(page => (
              <Spread key={page.date} page={page} userId={userId} meName={meName} partnerName={partnerName} />
            ))}
          </section>
        ))}
      </div>

      {writing ? <Composer initialTopic={writing.topic} onClose={() => setWriting(null)} /> : null}
    </div>
  );
}
