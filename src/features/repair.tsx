import { useState } from 'react';
import { ArrowRight, HeartHandshake, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { messageOf, rpcOk } from '@/lib/db';
import { formatDay } from '@/lib/couple-time';
import { RECONNECT_IDEAS, REPAIR_STEPS } from '@/lib/needs';
import { useCouple, useRefresh, useRepairs, type RepairEntry, type RepairRow } from './data';
import { Notice } from './ui';

type Side = { felt: string; need: string; sorry: string };

function SideCard({ name, entry, mine }: { name: string; entry: RepairEntry; mine: boolean }) {
  return (
    <article className={`repair-side${mine ? ' mine' : ''}`}>
      <span className="small-label">{mine ? 'YOU' : name.toUpperCase()}</span>
      <p>
        <strong>I felt</strong> {entry.felt}
      </p>
      <p>
        <strong>What I need</strong> {entry.need}
      </p>
      {entry.sorry ? (
        <p>
          <strong>I’m sorry for</strong> {entry.sorry}
        </p>
      ) : null}
    </article>
  );
}

function Writer() {
  const refresh = useRefresh();
  const [step, setStep] = useState(0);
  const [side, setSide] = useState<Side>({ felt: '', need: '', sorry: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = REPAIR_STEPS[step] as (typeof REPAIR_STEPS)[number];
  const value = side[current.key];
  const last = step === REPAIR_STEPS.length - 1;
  const required = current.key !== 'sorry';

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await rpcOk('submit_repair', { p_felt: side.felt, p_need: side.need, p_sorry: side.sorry });
      await refresh('repairs', 'growth');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="repair-card">
      <div className="repair-dots" aria-label={`Step ${step + 1} of ${REPAIR_STEPS.length}`}>
        {REPAIR_STEPS.map((item, index) => (
          <span key={item.key} className={index === step ? 'is-current' : index < step ? 'is-done' : ''} />
        ))}
      </div>
      <h2>{current.title}</h2>
      <p className="repair-hint">{current.hint}</p>
      <textarea
        aria-label={current.title}
        rows={5}
        maxLength={600}
        placeholder={current.placeholder}
        value={value}
        onChange={event => setSide(previous => ({ ...previous, [current.key]: event.target.value }))}
      />
      <p className="repair-lock">
        <Lock size={12} /> Your partner can’t see this until you have both shared.
      </p>
      {error ? <Notice>{error}</Notice> : null}
      <div className="repair-nav">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {last ? (
          <Button variant="romantic" disabled={busy} onClick={submit}>
            {busy ? 'Sharing…' : 'Share my side'}
          </Button>
        ) : (
          <Button variant="romantic" disabled={required && value.trim().length === 0} onClick={() => setStep(step + 1)}>
            Next <ArrowRight size={15} />
          </Button>
        )}
      </div>
    </section>
  );
}

function PastRepair({ repair, entries, userId, partnerName }: { repair: RepairRow; entries: RepairEntry[]; userId: string | undefined; partnerName: string }) {
  const mine = entries.find(entry => entry.user_id === userId);
  const theirs = entries.find(entry => entry.user_id !== userId);
  return (
    <details className="lesson-old">
      <summary>
        <span>{formatDay(repair.started_at.slice(0, 10))}</span>
        <span className="small-label">{repair.status === 'closed' ? 'TALKED THROUGH' : 'OPEN'}</span>
      </summary>
      {mine ? <SideCard name="You" entry={mine} mine /> : <p className="preview-notice">You didn’t share a side this time.</p>}
      {theirs ? <SideCard name={partnerName} entry={theirs} mine={false} /> : null}
    </details>
  );
}

export function RepairPanel() {
  const { relId, userId, partner } = useCouple();
  const repairs = useRepairs(relId);
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const partnerName = partner?.name || 'Your partner';

  const all = repairs.data?.repairs ?? [];
  const entries = repairs.data?.entries ?? [];
  const open = all.find(repair => repair.status === 'open');
  const past = all.filter(repair => repair.status === 'closed');
  const openEntries = open ? entries.filter(entry => entry.repair_id === open.id) : [];
  const mine = openEntries.find(entry => entry.user_id === userId);
  const theirs = openEntries.find(entry => entry.user_id !== userId);

  const run = async (name: string, args?: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      await rpcOk(name, args);
      await refresh('repairs', 'growth');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="repair-panel">
      <section className="space-feature">
        <HeartHandshake size={40} strokeWidth={1} />
        <span className="eyebrow">A GENTLE WAY BACK</span>
        <h2>
          Hard moments happen.
          <br />
          Finding each other again is the point.
        </h2>
        {!open && repairs.isSuccess ? (
          <Button variant="romantic" size="roomy" disabled={busy} onClick={() => run('start_repair')}>
            {busy ? 'Starting…' : 'We need to talk gently'} <ArrowRight size={16} />
          </Button>
        ) : null}
      </section>

      {repairs.isPending ? <p className="preview-notice">Opening…</p> : null}
      {repairs.error ? <Notice>We couldn’t load this. Please try again in a moment.</Notice> : null}
      {error ? <Notice>{error}</Notice> : null}

      {open && !mine ? (
        <>
          {open.started_by !== userId ? <p className="repair-from">{partnerName} would like to talk things through, gently.</p> : null}
          <Writer />
        </>
      ) : null}

      {open && mine && !theirs ? (
        <section className="repair-card">
          <span className="small-label">YOU’VE SHARED YOUR SIDE</span>
          <h2>Now we wait for {partnerName}.</h2>
          <p className="repair-hint">Their side stays hidden until they’ve written theirs. Take a breath. A kind message can help while you wait.</p>
          <SideCard name="You" entry={mine} mine />
          <Button variant="ghost" disabled={busy} onClick={() => run('close_repair', { p_id: open.id })}>
            We’ve sorted it out. Close this
          </Button>
        </section>
      ) : null}

      {open && mine && theirs ? (
        <section className="repair-card">
          <span className="small-label">BOTH SIDES SHARED</span>
          <h2>Read each other slowly.</h2>
          <SideCard name={partnerName} entry={theirs} mine={false} />
          <SideCard name="You" entry={mine} mine />
          <div className="reconnect">
            <span className="small-label">TO COME BACK TOGETHER</span>
            <ul>
              {RECONNECT_IDEAS.map(idea => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </div>
          <Button variant="romantic" size="roomy" disabled={busy} onClick={() => run('close_repair', { p_id: open.id })}>
            We’ve talked it through <ShieldCheck size={16} />
          </Button>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="lesson-earlier">
          <div className="section-heading">
            <h2>Past conversations</h2>
            <span className="small-label">{past.length}</span>
          </div>
          {past.map(repair => (
            <PastRepair key={repair.id} repair={repair} entries={entries.filter(entry => entry.repair_id === repair.id)} userId={userId} partnerName={partnerName} />
          ))}
        </section>
      ) : null}

      <p className="repair-safety">This is general guidance, not therapy. If things ever feel unsafe or deeply hurtful, please reach out to someone you trust or a counsellor.</p>
    </div>
  );
}
