import { useMemo, useState } from 'react';
import { BookHeart, Check, Flame, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { messageOf, rpcOk } from '@/lib/db';
import { dayNumber, formatDay } from '@/lib/couple-time';
import { LESSON_COUNT, lessonDayNumber, lessonForDay } from '@/lib/lessons';
import { currentStreak } from '@/lib/streak';
import { useCouple, useLessonCheckins, useRefresh, useToday } from './data';
import { Notice } from './ui';

function useLessonState() {
  const { relId, userId } = useCouple();
  const today = useToday();
  const checkins = useLessonCheckins(relId);
  const rows = checkins.data ?? [];
  const mineToday = rows.some(row => row.user_id === userId && row.lesson_day === today);
  const theirsToday = rows.some(row => row.user_id !== userId && row.lesson_day === today);
  const streak = currentStreak(
    rows.map(row => ({ user_id: row.user_id, question_day: row.lesson_day })),
    userId,
    today,
  );
  return { checkins, rows, today, mineToday, theirsToday, streak };
}

/** The small card on Home. */
export function LessonCard({ onOpen }: { onOpen: () => void }) {
  const { today, mineToday, theirsToday, checkins, streak } = useLessonState();
  const lesson = lessonForDay(dayNumber(today));
  const status = !checkins.isSuccess ? 'Today’s lesson' : mineToday && theirsToday ? 'You both tried it' : mineToday ? 'You tried it. Waiting for them' : theirsToday ? 'They tried it. Your turn' : 'A minute to read, a moment to try';
  return (
    <section className="lesson-card">
      <span className="lesson-watermark" aria-hidden="true">
        {lessonDayNumber(dayNumber(today))}
      </span>
      <div className="question-top">
        <span className="icon-tile">
          <BookHeart size={21} />
        </span>
        <span className="small-label">LITTLE LESSON · {lesson.theme.toUpperCase()}</span>
        {streak > 0 ? (
          <span className="streak-pill">
            <Flame size={13} /> {streak}
          </span>
        ) : null}
      </div>
      <h2>{lesson.title}</h2>
      <div className="question-bottom">
        <span>{status}</span>
        <Button variant="soft" onClick={onOpen}>
          Read today’s lesson
        </Button>
      </div>
    </section>
  );
}

/** The full lesson (shown in a sheet). */
export function LessonPanel() {
  const { partner } = useCouple();
  const refresh = useRefresh();
  const { today, mineToday, theirsToday, streak, rows, checkins } = useLessonState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const partnerName = partner?.name || 'Your partner';
  const todayNo = dayNumber(today);
  const lesson = lessonForDay(todayNo);

  const earlier = useMemo(() => [1, 2, 3, 4, 5, 6].map(back => ({ day: back, lesson: lessonForDay(todayNo - back) })), [todayNo]);
  const triedDays = useMemo(() => new Set(rows.map(row => row.lesson_day)), [rows]);
  const totalBoth = useMemo(() => {
    const byDay = new Map<string, Set<string>>();
    for (const row of rows) byDay.set(row.lesson_day, (byDay.get(row.lesson_day) ?? new Set()).add(row.user_id));
    return [...byDay.values()].filter(users => users.size >= 2).length;
  }, [rows]);

  const mark = async () => {
    setBusy(true);
    setError('');
    try {
      await rpcOk('mark_lesson_tried');
      await refresh('lessons', 'growth');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lesson-panel">
      <article className="lesson-body">
        <div className="lesson-head">
          <span className="lesson-numeral">{lessonDayNumber(todayNo)}</span>
          <span className="small-label">
            {lesson.theme.toUpperCase()}
            <br />
            LESSON {lessonDayNumber(todayNo)} OF {LESSON_COUNT}
          </span>
        </div>
        <h2>{lesson.title}</h2>
        <p className="lesson-text">{lesson.text}</p>
        <div className="lesson-action">
          <span className="small-label">TODAY, TRY THIS</span>
          <p>{lesson.action}</p>
        </div>
      </article>

      {checkins.error ? <Notice>We couldn’t load your check-ins. Please try again in a moment.</Notice> : null}

      <div className="lesson-status">
        <span className={`lesson-dot${mineToday ? ' is-done' : ''}`}>{mineToday ? <Check size={13} /> : null} You</span>
        <span className={`lesson-dot${theirsToday ? ' is-done' : ''}`}>{theirsToday ? <Check size={13} /> : null} {partnerName}</span>
      </div>
      {!mineToday ? (
        <Button variant="romantic" size="roomy" disabled={busy || !checkins.isSuccess} onClick={mark}>
          {busy ? 'Saving…' : 'We tried it'} <Heart size={16} />
        </Button>
      ) : (
        <p className="pulse-feedback">{theirsToday ? 'You both tried it today. That’s how closeness grows.' : `Lovely. Once ${partnerName} tries it too, it counts for both of you.`}</p>
      )}
      {error ? <Notice>{error}</Notice> : null}

      <div className="lesson-meta">
        <span>
          <Flame size={13} /> {streak} day{streak === 1 ? '' : 's'} in a row
        </span>
        <span>{totalBoth} lesson{totalBoth === 1 ? '' : 's'} tried together</span>
      </div>

      <section className="lesson-earlier">
        <div className="section-heading">
          <h2>The last few days</h2>
        </div>
        {earlier.map(item => (
          <details key={item.day} className="lesson-old">
            <summary>
              <span>{item.lesson.title}</span>
              <span className="small-label">{item.lesson.theme}</span>
            </summary>
            <p>{item.lesson.text}</p>
            <p className="lesson-old-action">Try: {item.lesson.action}</p>
          </details>
        ))}
      </section>
      {triedDays.size > 0 ? <p className="preview-notice">Last tried on {formatDay([...triedDays].sort().slice(-1)[0] as string)}.</p> : null}
    </div>
  );
}
