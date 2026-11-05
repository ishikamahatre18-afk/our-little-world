import { useMemo } from 'react';
import { Sprout } from 'lucide-react';
import { formatDay, formatMonth } from '@/lib/couple-time';
import { MOODS } from '@/lib/needs';
import { useCouple, useGrowth, useJournal, type GrowthMonth, type JournalRow } from './data';
import { Notice } from './ui';

const sum = (rows: GrowthMonth[], key: Exclude<keyof GrowthMonth, 'month'>) => rows.reduce((total, row) => total + row[key], 0);
const monthTotal = (row: GrowthMonth) => row.answers + row.lessons + row.journal + row.repairs + row.memories + row.letters + row.cared;
const shortMonth = (month: string) => formatMonth(`${month}-01`).replace(/ \d{4}$/, '');
const snippet = (text: string) => (text.length > 170 ? `${text.slice(0, 170)}…` : text);

const PETALS: { key: Exclude<keyof GrowthMonth, 'month'>; label: string; fill: string }[] = [
  { key: 'answers', label: 'Questions answered together', fill: 'var(--rose)' },
  { key: 'lessons', label: 'Lessons tried together', fill: 'var(--lavender)' },
  { key: 'cared', label: 'Times you were there for each other', fill: 'var(--primary)' },
  { key: 'repairs', label: 'Hard moments talked through', fill: 'var(--blush)' },
  { key: 'journal', label: 'Diary entries', fill: 'var(--rose)' },
  { key: 'memories', label: 'Memories kept', fill: 'var(--lavender)' },
  { key: 'letters', label: 'Letters written', fill: 'var(--blush)' },
];

/** Every petal is one part of your life together. The more you do, the longer it grows. */
function Bloom({ rows }: { rows: GrowthMonth[] }) {
  const values = PETALS.map(petal => sum(rows, petal.key));
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className="bloom">
      <svg viewBox="-110 -110 220 220" role="img" aria-label={`${total} moments together`}>
        <circle r="104" fill="none" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="2 5" />
        <circle r="70" fill="none" stroke="var(--border)" strokeWidth="0.6" strokeDasharray="2 5" />
        {PETALS.map((petal, index) => {
          const value = values[index] ?? 0;
          const length = 26 + 70 * Math.sqrt(value / max);
          const angle = (360 / PETALS.length) * index;
          return (
            <g key={petal.key} transform={`rotate(${angle})`}>
              <ellipse cx="0" cy={-(length / 2) - 8} rx="15" ry={length / 2} fill={petal.fill} opacity={value > 0 ? 0.78 : 0.28} stroke="var(--card)" strokeWidth="1.5" />
            </g>
          );
        })}
        <circle r="23" fill="var(--card)" stroke="var(--primary)" strokeWidth="1" />
        <text y="5" textAnchor="middle" fontFamily="var(--font-display)" fontSize="19" fill="var(--primary)">
          {total.toLocaleString('en-IN')}
        </text>
      </svg>
      <ul className="bloom-legend">
        {PETALS.map((petal, index) => (
          <li key={petal.key}>
            <span className="bloom-dot" style={{ background: petal.fill }} />
            <span>{petal.label}</span>
            <strong>{(values[index] ?? 0).toLocaleString('en-IN')}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThenNow({ first, latest }: { first: JournalRow; latest: JournalRow }) {
  return (
    <section className="then-now">
      <div className="section-heading">
        <h2>Then and now</h2>
      </div>
      <div className="then-now-grid">
        <article>
          <span className="small-label">THEN · {formatDay(first.entry_date).toUpperCase()}</span>
          <p>{snippet(first.body)}</p>
        </article>
        <article>
          <span className="small-label">NOW · {formatDay(latest.entry_date).toUpperCase()}</span>
          <p>{snippet(latest.body)}</p>
        </article>
      </div>
    </section>
  );
}

/** Watch how you've grown: counts per month, mood over time, then and now. */
export function GrowthPanel() {
  const { relId } = useCouple();
  const growth = useGrowth(relId);
  const journal = useJournal(relId);
  const rows = growth.data ?? [];

  const recent = rows.slice(-6);
  const maxTotal = Math.max(1, ...recent.map(monthTotal));

  const shared = useMemo(() => (journal.data ?? []).filter(entry => entry.visibility === 'shared'), [journal.data]);
  const moods = useMemo(() => {
    const byMonth = new Map<string, number[]>();
    for (const entry of shared) {
      if (entry.mood === null) continue;
      const key = entry.entry_date.slice(0, 7);
      byMonth.set(key, [...(byMonth.get(key) ?? []), entry.mood]);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, values]) => ({ month, average: values.reduce((total, value) => total + value, 0) / values.length }));
  }, [shared]);

  const first = shared[shared.length - 1];
  const latest = shared[0];
  const hasAnything = rows.length > 0;

  return (
    <div className="growth-panel">
      <section className="space-feature">
        <Sprout size={40} strokeWidth={1} />
        <span className="eyebrow">HOW WE’VE GROWN</span>
        <h2>
          Small things, every day,
          <br />
          add up to a lot.
        </h2>
      </section>

      {growth.isPending ? <p className="preview-notice">Looking back over your journey…</p> : null}
      {growth.error ? <Notice>We couldn’t load this. Please try again in a moment.</Notice> : null}

      {growth.isSuccess && !hasAnything ? (
        <div className="empty-state">
          <Sprout size={25} strokeWidth={1} />
          <h3>Your story starts today.</h3>
          <p>Answer a question, try a lesson, write in your journal. Everything you do together shows up here, month by month.</p>
        </div>
      ) : null}

      {hasAnything ? (
        <>
          <Bloom rows={rows} />

          <section className="growth-months">
            <div className="section-heading">
              <h2>Month by month</h2>
            </div>
            {recent.map(row => (
              <div className="growth-row" key={row.month}>
                <span className="growth-month">{shortMonth(row.month)}</span>
                <div className="growth-bar" role="img" aria-label={`${monthTotal(row)} moments together in ${formatMonth(`${row.month}-01`)}`}>
                  <span style={{ width: `${Math.max(4, Math.round((monthTotal(row) / maxTotal) * 100))}%` }} />
                </div>
                <span className="growth-count">{monthTotal(row)}</span>
              </div>
            ))}
            <p className="preview-notice">Each bar counts the little moments you shared that month.</p>
          </section>
        </>
      ) : null}

      <section className="growth-mood">
        <div className="section-heading">
          <h2>How it has felt</h2>
        </div>
        {moods.length >= 2 ? (
          <div className="mood-columns">
            {moods.map(item => (
              <div className="mood-col" key={item.month}>
                <div className="mood-track">
                  <span style={{ height: `${Math.round((item.average / 5) * 100)}%` }} />
                </div>
                <span className="small-label">{shortMonth(item.month)}</span>
                <span className="mood-word">{MOODS[Math.min(4, Math.max(0, Math.round(item.average) - 1))]?.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="preview-notice">Add a mood to your shared journal entries, and you’ll see how your months have felt.</p>
        )}
      </section>

      {first && latest && first.id !== latest.id ? <ThenNow first={first} latest={latest} /> : null}
    </div>
  );
}
