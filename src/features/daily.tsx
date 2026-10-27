import { useMemo, useState } from 'react';
import { Flame, Heart, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rpcOk, messageOf } from '@/lib/db';
import { dayNumber, formatDay } from '@/lib/couple-time';
import { questionForDay } from '@/lib/questions';
import { currentStreak, sharedDays } from '@/lib/streak';
import { useAnswers, useCouple, usePartnerAnswered, useRefresh, useToday } from './data';
import { Notice } from './ui';

const MAX = 1000;

/** The shared daily question: both answer privately, then both are revealed. */
export function DailyPanel({ onAnswered }: { onAnswered?: () => void }) {
  const { relId, userId, me, partner } = useCouple();
  const today = useToday();
  const answers = useAnswers(relId);
  const partnerAnswered = usePartnerAnswered(relId);
  const refresh = useRefresh();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  const rows = answers.data ?? [];
  const question = questionForDay(dayNumber(today));
  const partnerName = partner?.name || 'Your partner';
  const myToday = rows.find(row => row.user_id === userId && row.question_day === today);
  const theirToday = rows.find(row => row.user_id !== userId && row.question_day === today);
  const theyAnswered = !!theirToday || partnerAnswered.data === true;
  const streak = currentStreak(rows, userId, today);

  const history = useMemo(() => {
    const days = new Set(rows.filter(row => row.question_day !== today).map(row => row.question_day));
    const both = sharedDays(rows, userId);
    return [...days]
      .sort((a, b) => b.localeCompare(a))
      .map(day => ({
        day,
        mine: rows.find(row => row.user_id === userId && row.question_day === day),
        theirs: rows.find(row => row.user_id !== userId && row.question_day === day),
        both: both.has(day),
      }));
  }, [rows, today, userId]);
  const shownHistory = showAll ? history : history.slice(0, 5);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await rpcOk('submit_daily_answer', { p_answer: text });
      setText('');
      await refresh('answers', 'partner-answered');
      onAnswered?.();
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="daily-panel">
      <section className="daily-card">
        <div className="daily-top">
          <span className="small-label">TODAY’S QUESTION · {question.tag.toUpperCase()}</span>
          {streak > 0 ? (
            <span className="streak-pill" title="Days in a row you both answered">
              <Flame size={13} /> {streak} day{streak === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
        <h2 className="daily-question">{question.text}</h2>

        {answers.isPending ? <p className="preview-notice">Opening today’s question…</p> : null}
        {answers.error ? <Notice>We couldn’t load your answers. Please try again in a moment.</Notice> : null}

        {answers.isSuccess && !myToday ? (
          <div className="daily-form">
            <textarea
              aria-label="Your answer"
              placeholder="Take your time. Say it the way you’d say it to them…"
              rows={5}
              maxLength={MAX}
              value={text}
              onChange={event => setText(event.target.value)}
            />
            <div className="daily-form-foot">
              <span className="char-count">
                {text.length}/{MAX}
              </span>
              <span className="daily-lock">
                <Lock size={12} /> {theyAnswered ? `${partnerName} has answered` : 'Hidden until you both answer'}
              </span>
            </div>
            <Button variant="romantic" size="roomy" disabled={busy || text.trim().length === 0} onClick={submit}>
              {busy ? 'Sealing…' : theyAnswered ? 'Reveal together' : 'Seal my answer'} <Heart size={16} />
            </Button>
            {error ? <Notice>{error}</Notice> : null}
          </div>
        ) : null}

        {answers.isSuccess && myToday ? (
          <div className="answer-pair">
            <article className="answer-bubble mine">
              <span className="small-label">{me?.name || 'You'}</span>
              <p>{myToday.answer}</p>
            </article>
            {theirToday ? (
              <article className="answer-bubble theirs">
                <span className="small-label">{partnerName}</span>
                <p>{theirToday.answer}</p>
              </article>
            ) : (
              <article className="answer-bubble waiting">
                <Lock size={16} />
                <p>Waiting for {partnerName}. Their answer appears here the moment they write it.</p>
              </article>
            )}
          </div>
        ) : null}
      </section>

      {history.length > 0 ? (
        <section className="daily-history">
          <div className="section-heading">
            <h2>Our answers so far</h2>
            <Sparkles size={16} />
          </div>
          {shownHistory.map(item => (
            <article className="history-item" key={item.day}>
              <span className="small-label">{formatDay(item.day)}</span>
              <h3>{questionForDay(dayNumber(item.day)).text}</h3>
              {item.mine ? (
                <p>
                  <strong>{me?.name || 'You'}:</strong> {item.mine.answer}
                </p>
              ) : null}
              {item.theirs ? (
                <p>
                  <strong>{partnerName}:</strong> {item.theirs.answer}
                </p>
              ) : item.mine ? (
                <p className="history-missing">{partnerName} didn’t answer this one.</p>
              ) : null}
            </article>
          ))}
          {history.length > 5 ? (
            <Button variant="link" onClick={() => setShowAll(value => !value)}>
              {showAll ? 'Show fewer' : `Show all ${history.length}`}
            </Button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
