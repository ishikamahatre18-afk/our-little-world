import { useState } from 'react';
import { Clock, Cookie, Ear, HandHeart, HandHelping, Heart, HeartHandshake, Hourglass, MessageCircleHeart, MessagesSquare, Smile, Wind, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { messageOf, rpcOk } from '@/lib/db';
import { NEEDS, needInfo, type NeedKind } from '@/lib/needs';
import { useCouple, useNeeds, useRefresh, useToday } from './data';
import { Notice } from './ui';

const ICONS: Record<NeedKind, LucideIcon> = {
  hug: HeartHandshake,
  listen: Ear,
  space: Wind,
  laugh: Smile,
  help: HandHelping,
  words: MessageCircleHeart,
  together: Clock,
  treat: Cookie,
  patience: Hourglass,
  talk: MessagesSquare,
};

export function NeedIcon({ kind, size = 24 }: { kind: string; size?: number }) {
  const Icon = ICONS[kind as NeedKind] ?? Heart;
  return <Icon size={size} strokeWidth={1.25} />;
}

/** "What I need today": a five-second card your partner sees. */
export function NeedsCard() {
  const { relId, userId, partner } = useCouple();
  const today = useToday();
  const needs = useNeeds(relId);
  const refresh = useRefresh();
  const [picked, setPicked] = useState<NeedKind>();
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const partnerName = partner?.name || 'Your partner';

  const rows = needs.data ?? [];
  const mine = rows.find(row => row.user_id === userId && row.need_day === today);
  const theirs = rows.find(row => row.user_id !== userId && row.need_day === today);
  const showPicker = !mine || editing;

  const run = async (name: string, args?: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      await rpcOk(name, args);
      await refresh('needs', 'growth');
      return true;
    } catch (problem) {
      setError(messageOf(problem));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!picked) return;
    const ok = await run('set_need', { p_kind: picked, p_note: note });
    if (ok) {
      setPicked(undefined);
      setNote('');
      setEditing(false);
    }
  };

  return (
    <section className="needs-card">
      {theirs ? (
        <div className="need-partner">
          <span className="need-partner-icon">
            <NeedIcon kind={theirs.kind} size={30} />
          </span>
          <span className="small-label">{partnerName.toUpperCase()} NEEDS TODAY</span>
          <h2>{needInfo(theirs.kind).label}</h2>
          {theirs.note ? <p className="need-note">“{theirs.note}”</p> : null}
          <p className="need-tip">{needInfo(theirs.kind).respond}</p>
          {theirs.acked_at ? (
            <p className="pulse-feedback">You let them know you’ve got them.</p>
          ) : (
            <Button variant="romantic" disabled={busy} onClick={() => run('ack_need')}>
              I’ve got you <HandHeart size={16} />
            </Button>
          )}
        </div>
      ) : null}

      <div className="need-mine">
        <div className="question-top">
          <span className="icon-tile">
            <Heart size={20} />
          </span>
          <span className="small-label">WHAT I NEED TODAY</span>
        </div>
        {!showPicker && mine ? (
          <>
            <span className="need-mine-icon">
              <NeedIcon kind={mine.kind} size={26} />
            </span>
            <h3>Today I need {needInfo(mine.kind).need}.</h3>
            {mine.note ? <p className="need-note">“{mine.note}”</p> : null}
            <p className="need-tip">{mine.acked_at ? `${partnerName} has got you.` : `${partnerName} can see this.`}</p>
            <div className="need-actions">
              <Button variant="soft" size="sm" disabled={busy} onClick={() => setEditing(true)}>
                Change
              </Button>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => run('clear_need')}>
                <X size={14} /> Remove
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="need-intro">Tap one. {partnerName} will see it and know how to help.</p>
            <div className="need-deck" role="listbox" aria-label="Choose what you need today">
              {NEEDS.map(info => (
                <button key={info.kind} type="button" role="option" aria-selected={picked === info.kind} className={`need-tile${picked === info.kind ? ' is-picked' : ''}`} onClick={() => setPicked(info.kind)}>
                  <NeedIcon kind={info.kind} />
                  <span>{info.label}</span>
                </button>
              ))}
            </div>
            {picked ? (
              <div className="need-form">
                <input aria-label="Optional note" placeholder="Add a few words (optional)" maxLength={80} value={note} onChange={event => setNote(event.target.value)} />
                <Button variant="romantic" disabled={busy} onClick={share}>
                  {busy ? 'Sharing…' : `Share with ${partnerName}`}
                </Button>
              </div>
            ) : null}
            {editing ? (
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            ) : null}
          </>
        )}
        {needs.error ? <Notice>We couldn’t load your cards. Please try again in a moment.</Notice> : null}
        {error ? <Notice>{error}</Notice> : null}
      </div>
    </section>
  );
}
