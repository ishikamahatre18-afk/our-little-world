import { useState } from 'react';
import { Heart, Lock, Mail, MailOpen, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db, messageOf, rpcOk } from '@/lib/db';
import { addDays, formatTimestampDay } from '@/lib/couple-time';
import { OPEN_WHEN_PROMPTS } from '@/lib/ideas';
import { useCouple, useInbox, useRefresh, useSentLetters, useToday, type InboxLetter, type SentLetter } from './data';
import { Notice, Segmented, Sheet } from './ui';

type Mode = 'letter' | 'open_when';

function Composer({ onClose, partnerName }: { onClose: () => void; partnerName: string }) {
  const today = useToday();
  const refresh = useRefresh();
  const [mode, setMode] = useState<Mode>('letter');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [openWhen, setOpenWhen] = useState('');
  const [sealDate, setSealDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      // Sealed letters unlock at 9 in the morning, India time.
      const unlock = sealDate ? `${sealDate}T09:00:00+05:30` : null;
      await rpcOk('send_letter', {
        p_kind: mode,
        p_title: title,
        p_body: body,
        p_open_when: mode === 'open_when' ? openWhen : null,
        p_unlock_at: unlock,
      });
      await refresh('sent', 'inbox');
      setSent(true);
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Sheet title="On its way" onClose={onClose}>
        <div className="sent-state">
          <span className="sent-heart">
            <Heart size={26} fill="currentColor" />
          </span>
          <p className="modal-question">Your words are waiting for {partnerName}.</p>
          <p className="preview-notice">{sealDate ? 'They’ll see a sealed envelope until the day arrives.' : 'They’ll see it the next time they open the app.'}</p>
          <Button variant="romantic" size="roomy" onClick={onClose}>
            Done <Heart size={16} />
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title={mode === 'letter' ? `Dear ${partnerName},` : 'Open when…'} onClose={onClose}>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'letter', label: 'A letter' },
          { value: 'open_when', label: 'Open when…' },
        ]}
      />
      {mode === 'open_when' ? (
        <div className="chip-field">
          <input aria-label="Open when" placeholder="Open when you miss me" maxLength={60} value={openWhen} onChange={event => setOpenWhen(event.target.value)} />
          <div className="chip-row">
            {OPEN_WHEN_PROMPTS.map(prompt => (
              <button type="button" key={prompt} className={`chip${openWhen === prompt ? ' is-active' : ''}`} onClick={() => setOpenWhen(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <input className="letter-title" aria-label="Letter title" placeholder="A little note for you…" maxLength={80} value={title} onChange={event => setTitle(event.target.value)} />
      <textarea aria-label="Love letter" placeholder="If I could tell you one thing today…" rows={8} maxLength={5000} value={body} onChange={event => setBody(event.target.value)} />
      <label className="seal-field">
        <span>
          <Lock size={14} /> Seal until a special day <em>(optional)</em>
        </span>
        <input type="date" min={addDays(today, 1)} value={sealDate} onChange={event => setSealDate(event.target.value)} />
      </label>
      {error ? <Notice>{error}</Notice> : null}
      <Button variant="romantic" size="roomy" disabled={busy} onClick={send}>
        {busy ? 'Sending…' : 'Send with love'} <Heart size={16} />
      </Button>
    </Sheet>
  );
}

function InboxCard({ letter, partnerName }: { letter: InboxLetter; partnerName: string }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = letter.kind === 'open_when' && letter.open_when ? `Open when ${letter.open_when}` : letter.title || 'A letter';

  if (letter.sealed) {
    return (
      <article className="letter-entry sealed">
        <span className="icon-tile">
          <Lock size={20} />
        </span>
        <div>
          <span className="small-label">SEALED BY {partnerName.toUpperCase()}</span>
          <h3>{letter.kind === 'open_when' && letter.open_when ? `Open when ${letter.open_when}` : 'A letter, saved for later'}</h3>
          <p>{letter.unlock_at ? `Opens on ${formatTimestampDay(letter.unlock_at)}` : ''}</p>
        </div>
      </article>
    );
  }

  if (letter.opened_at && letter.body) {
    return (
      <article className="letter-entry opened">
        <span className="icon-tile">
          <MailOpen size={20} />
        </span>
        <div>
          <span className="small-label">FROM {partnerName.toUpperCase()} · {formatTimestampDay(letter.created_at)}</span>
          <h3>{heading}</h3>
          {letter.kind === 'open_when' ? <p className="letter-sub">{letter.title}</p> : null}
          <p className="letter-body">{letter.body}</p>
        </div>
      </article>
    );
  }

  const open = async () => {
    setBusy(true);
    setError('');
    try {
      const { error: problem } = await db.rpc('open_letter', { p_id: letter.id });
      if (problem) throw new Error(problem.message);
      await refresh('inbox', 'sent');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="letter-entry fresh">
      <span className="icon-tile">
        <Mail size={20} />
      </span>
      <div>
        <span className="small-label">NEW FROM {partnerName.toUpperCase()}</span>
        <h3>{heading}</h3>
        <p>A letter is waiting for you.</p>
        <Button variant="soft" size="sm" disabled={busy} onClick={open}>
          {busy ? 'Opening…' : 'Open letter'} <MailOpen size={14} />
        </Button>
        {error ? <p className="form-notice">{error}</p> : null}
      </div>
    </article>
  );
}

function SentCard({ letter }: { letter: SentLetter }) {
  const refresh = useRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const sealed = !!letter.unlock_at && new Date(letter.unlock_at).getTime() > Date.now();
  const status = letter.opened_at ? `Opened ${formatTimestampDay(letter.opened_at)}` : sealed ? `Sealed until ${formatTimestampDay(letter.unlock_at as string)}` : 'Not opened yet';
  const heading = letter.kind === 'open_when' && letter.open_when ? `Open when ${letter.open_when}` : letter.title;

  const remove = async () => {
    if (!window.confirm('Take this letter back? It hasn’t been opened yet.')) return;
    setBusy(true);
    setError('');
    try {
      await rpcOk('delete_letter', { p_id: letter.id });
      await refresh('sent', 'inbox');
    } catch (problem) {
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="letter-entry sent">
      <span className="icon-tile">
        <Mail size={20} />
      </span>
      <div>
        <span className="small-label">{status.toUpperCase()}</span>
        <h3>{heading}</h3>
        <p className={`letter-body${expanded ? '' : ' is-clamped'}`}>{letter.body}</p>
        <div className="letter-actions">
          <Button variant="link" onClick={() => setExpanded(value => !value)}>
            {expanded ? 'Show less' : 'Read again'}
          </Button>
          {!letter.opened_at ? (
            <Button variant="ghost" size="sm" disabled={busy} onClick={remove} aria-label="Take this letter back">
              <Trash2 size={14} /> Take back
            </Button>
          ) : null}
        </div>
        {error ? <p className="form-notice">{error}</p> : null}
      </div>
    </article>
  );
}

export function LettersPanel() {
  const { relId, partner } = useCouple();
  const inbox = useInbox(relId);
  const sent = useSentLetters(relId);
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [writing, setWriting] = useState(false);
  const partnerName = partner?.name || 'your partner';
  const received = inbox.data ?? [];
  const written = sent.data ?? [];
  const waiting = received.filter(letter => !letter.sealed && !letter.opened_at).length;
  const list = tab === 'inbox' ? received : written;
  const query = tab === 'inbox' ? inbox : sent;

  return (
    <div className="letters-panel">
      <section className="space-feature">
        <Mail size={40} strokeWidth={1} />
        <span className="eyebrow">WORDS FROM THE HEART</span>
        <h2>
          Some things are better
          <br />
          written with love.
        </h2>
        <Button variant="romantic" size="roomy" onClick={() => setWriting(true)}>
          Write a love letter <Plus size={16} />
        </Button>
      </section>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'inbox', label: 'For you', badge: waiting },
          { value: 'sent', label: 'From you' },
        ]}
      />

      {query.isPending ? <p className="preview-notice">Opening your letters…</p> : null}
      {query.error ? <Notice>We couldn’t load your letters. Please try again in a moment.</Notice> : null}

      {query.isSuccess && list.length === 0 ? (
        <div className="empty-state">
          <Heart size={25} strokeWidth={1} />
          <h3>{tab === 'inbox' ? 'No letters yet.' : 'The first page is yours.'}</h3>
          <p>{tab === 'inbox' ? `When ${partnerName} writes to you, it will wait here.` : 'Write something small. It will mean more than you think.'}</p>
        </div>
      ) : null}

      <div className="letter-list">
        {tab === 'inbox'
          ? received.map(letter => <InboxCard key={letter.id} letter={letter} partnerName={partnerName} />)
          : written.map(letter => <SentCard key={letter.id} letter={letter} />)}
      </div>

      {writing ? <Composer partnerName={partnerName} onClose={() => setWriting(false)} /> : null}
    </div>
  );
}
