import { useMemo, useState } from 'react';
import { Heart, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { messageOf, rpcOk } from '@/lib/db';
import { dayNumber, formatDay, formatMonth } from '@/lib/couple-time';
import { JAR_PROMPTS } from '@/lib/topics';
import { useCouple, useJarCounts, useJarNotes, useRefresh, useToday, type JarNote } from './data';
import { Notice } from './ui';

const monthOf = (timestamp: string) => new Date(timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7);

function nextMonthStart(today: string): string {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  return next;
}

// Where each slip sits inside the jar (x, y, rotation, colour).
const SLIPS: [number, number, number, number][] = [
  [38, 112, -14, 0], [62, 114, 10, 1], [82, 111, -6, 2], [50, 100, 18, 2], [74, 99, -20, 0], [36, 97, 6, 1],
  [60, 88, -9, 1], [84, 90, 15, 0], [44, 82, -17, 2], [70, 80, 8, 2], [56, 72, 20, 0], [80, 72, -12, 1],
];
const SLIP_FILL = ['var(--blush)', 'var(--lavender)', 'var(--rose)'];

export function JarArt({ count }: { count: number }) {
  const shown = Math.min(count, SLIPS.length);
  return (
    <svg className="jar-art" viewBox="0 0 120 150" role="img" aria-label={`A jar holding ${count} notes`}>
      <defs>
        <clipPath id="jar-clip">
          <path d="M26 46 C20 52 18 60 18 72 L18 118 C18 130 26 136 38 136 L82 136 C94 136 102 130 102 118 L102 72 C102 60 100 52 94 46 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#jar-clip)">
        <rect x="14" y="40" width="92" height="100" fill="var(--card)" />
        {SLIPS.slice(0, shown).map(([x, y, rotate, tone], index) => (
          <rect key={index} x={x - 11} y={y - 6} width="22" height="12" rx="2.5" transform={`rotate(${rotate} ${x} ${y})`} fill={SLIP_FILL[tone]} opacity={tone === 2 ? 0.75 : 0.95} />
        ))}
      </g>
      <path d="M26 46 C20 52 18 60 18 72 L18 118 C18 130 26 136 38 136 L82 136 C94 136 102 130 102 118 L102 72 C102 60 100 52 94 46 Z" fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M30 24 h60 a4 4 0 0 1 4 4 v10 a4 4 0 0 1 -4 4 h-60 a4 4 0 0 1 -4 -4 v-10 a4 4 0 0 1 4 -4 z" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.6" />
      <path d="M36 46 h48" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M60 64 c-5 -6 -13 -2 -10 5 c2 4 10 9 10 9 s8 -5 10 -9 c3 -7 -5 -11 -10 -5 z" transform="translate(0 -2)" fill="var(--rose)" opacity={count > 0 ? 0.95 : 0.45} />
      <path d="M32 58 c-3 8 -3 20 -2 30" stroke="var(--card)" strokeWidth="3" strokeLinecap="round" opacity="0.8" fill="none" />
    </svg>
  );
}

function NoteSlip({ note, name, mine, onDelete, busy }: { note: JarNote; name: string; mine: boolean; onDelete?: (() => void) | undefined; busy?: boolean }) {
  return (
    <article className={`jar-slip${mine ? ' mine' : ''}`}>
      <p>{note.body}</p>
      <div className="jar-slip-foot">
        <span className="small-label">{name.toUpperCase()}</span>
        {onDelete ? (
          <button type="button" className="slip-delete" disabled={busy} onClick={onDelete} aria-label="Take this note back">
            <Trash2 size={13} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function JarPanel() {
  const { relId, userId, me, partner } = useCouple();
  const today = useToday();
  const notes = useJarNotes(relId);
  const counts = useJarCounts(relId);
  const refresh = useRefresh();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shuffle, setShuffle] = useState(0);
  const partnerName = partner?.name || 'Your partner';
  const thisMonth = today.slice(0, 7);

  const current = (counts.data ?? []).find(item => item.month === thisMonth);
  const inJar = (current?.mine ?? 0) + (current?.theirs ?? 0);
  const opens = nextMonthStart(today);

  const prompts = useMemo(() => {
    const start = (dayNumber(today) + shuffle * 3) % JAR_PROMPTS.length;
    return [0, 1, 2].map(offset => JAR_PROMPTS[(start + offset) % JAR_PROMPTS.length] as string);
  }, [today, shuffle]);

  const all = notes.data ?? [];
  const mineNow = all.filter(note => note.author_id === userId && monthOf(note.created_at) === thisMonth);
  const opened = useMemo(() => {
    const byMonth = new Map<string, JarNote[]>();
    for (const note of all) {
      const key = monthOf(note.created_at);
      if (key >= thisMonth) continue;
      byMonth.set(key, [...(byMonth.get(key) ?? []), note]);
    }
    return [...byMonth.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [all, thisMonth]);

  const drop = async () => {
    setBusy(true);
    setError('');
    try {
      await rpcOk('add_appreciation', { p_body: text });
      setText('');
      await refresh('jar', 'jar-counts');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  const take = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      await rpcOk('delete_appreciation', { p_id: id });
      await refresh('jar', 'jar-counts');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="jar-panel">
      <section className="jar-hero">
        <JarArt count={inJar} />
        <span className="eyebrow">OUR APPRECIATION JAR</span>
        <h2>{formatMonth(`${thisMonth}-01`)}</h2>
        <p className="jar-count">
          {inJar} {inJar === 1 ? 'note' : 'notes'} so far · {current?.mine ?? 0} from you, {current?.theirs ?? 0} from {partnerName}
        </p>
        <p className="jar-opens">Sealed until {formatDay(opens)}. Then you’ll read each other’s.</p>
      </section>

      <section className="jar-writer">
        <span className="small-label">DROP A THANK-YOU IN THE JAR</span>
        <textarea aria-label="Appreciation note" rows={4} maxLength={280} placeholder={`Something you appreciate about ${partnerName}…`} value={text} onChange={event => setText(event.target.value)} />
        <div className="chip-row">
          {prompts.map(prompt => (
            <button type="button" key={prompt} className="chip" onClick={() => setText(current => (current.trim() ? current : `${prompt} `))}>
              {prompt}
            </button>
          ))}
          <button type="button" className="chip" aria-label="More ideas" onClick={() => setShuffle(value => value + 1)}>
            <RefreshCw size={11} /> More ideas
          </button>
        </div>
        <div className="daily-form-foot">
          <span className="char-count">{text.length}/280</span>
          <span>Private until the jar opens</span>
        </div>
        <Button variant="romantic" size="roomy" disabled={busy || text.trim().length === 0} onClick={drop}>
          {busy ? 'Dropping…' : 'Drop it in the jar'} <Heart size={16} />
        </Button>
        {error ? <Notice>{error}</Notice> : null}
      </section>

      {notes.error || counts.error ? <Notice>We couldn’t load the jar. Please try again in a moment.</Notice> : null}

      {mineNow.length > 0 ? (
        <section className="jar-section">
          <div className="section-heading">
            <h2>Your notes this month</h2>
            <span className="small-label">{mineNow.length}</span>
          </div>
          <div className="jar-slips">
            {mineNow.map(note => (
              <NoteSlip key={note.id} note={note} name={me?.name || 'You'} mine onDelete={() => take(note.id)} busy={busy} />
            ))}
          </div>
        </section>
      ) : null}

      {opened.length > 0 ? (
        <section className="jar-section">
          <div className="section-heading">
            <h2>Jars we’ve opened</h2>
          </div>
          {opened.map(([month, list]) => (
            <details className="opened-jar" key={month}>
              <summary>
                <span>{formatMonth(`${month}-01`)}</span>
                <span className="small-label">{list.length} {list.length === 1 ? 'note' : 'notes'}</span>
              </summary>
              <div className="jar-slips">
                {list.map(note => (
                  <NoteSlip key={note.id} note={note} name={note.author_id === userId ? me?.name || 'You' : partnerName} mine={note.author_id === userId} />
                ))}
              </div>
            </details>
          ))}
        </section>
      ) : (
        <p className="preview-notice">Your first jar opens on {formatDay(opens)}.</p>
      )}
    </div>
  );
}
