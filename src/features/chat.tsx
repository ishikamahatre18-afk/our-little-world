import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUp, Check, CheckCheck, Lock } from 'lucide-react';
import { db, messageOf, rpcOk } from '@/lib/db';
import { formatDay } from '@/lib/couple-time';
import { useCouple, useMessages, useRefresh, useToday, type ChatRow } from './data';
import { Avatar } from './shell';
import { Notice } from './ui';

const IST = 'Asia/Kolkata';
const dayKey = (timestamp: string) => new Date(timestamp).toLocaleDateString('en-CA', { timeZone: IST });
const clock = (timestamp: string) => new Date(timestamp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST }).toLowerCase();
const GAP = 5 * 60 * 1000;
const ms = (timestamp: string) => new Date(timestamp).getTime();

const STARTERS = ['Thinking of you', 'How was your day?', 'I miss you', 'Call me when you’re free'];

type Row = { message: ChatRow; mine: boolean; first: boolean; last: boolean };
type Group = { key: string; label: string; rows: Row[] };

function yesterdayOf(today: string): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function ChatPanel() {
  const { relId, userId, partner } = useCouple();
  const today = useToday();
  const messages = useMessages(relId);
  const client = useQueryClient();
  const refresh = useRefresh();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string>();
  const [typing, setTyping] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const channel = useRef<{ send: (message: unknown) => unknown } | null>(null);
  const ready = useRef(false);
  const lastTyping = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const name = partner?.name || 'Your person';
  const rows = messages.data ?? [];

  // Live "is writing…" through a tiny broadcast channel (nothing is stored).
  useEffect(() => {
    if (!relId || !userId) return;
    let made: { unsubscribe?: () => unknown } | undefined;
    try {
      const next = db
        .channel(`typing-${relId}`)
        .on('broadcast', { event: 'typing' }, (payload: { payload?: { userId?: string } }) => {
          if (payload.payload?.userId === userId) return;
          setTyping(true);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping(false), 3500);
        })
        .subscribe((status: string) => {
          ready.current = status === 'SUBSCRIBED';
        });
      made = next;
      channel.current = next;
    } catch {
      // the "is writing" hint is a bonus
    }
    return () => {
      ready.current = false;
      channel.current = null;
      if (typingTimer.current) clearTimeout(typingTimer.current);
      try {
        if (made) void db.removeChannel(made);
      } catch {
        // nothing to clean up
      }
    };
  }, [relId, userId]);

  // Opening the chat marks your partner's messages as seen.
  const unreadFromPartner = rows.some(row => row.sender_id !== userId && !row.read_at);
  useEffect(() => {
    if (!unreadFromPartner || document.visibilityState !== 'visible') return;
    let cancelled = false;
    void (async () => {
      try {
        await db.rpc('mark_chat_read');
        if (!cancelled) await refresh('chat', 'chat-unread');
      } catch {
        // seen-marks are not worth interrupting anyone
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadFromPartner, rows.length]);

  useLayoutEffect(() => {
    const element = list.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [rows.length, typing]);

  const groups = useMemo<Group[]>(() => {
    const yesterday = yesterdayOf(today);
    const out: Group[] = [];
    rows.forEach((message, index) => {
      const key = dayKey(message.created_at);
      let group = out[out.length - 1];
      if (!group || group.key !== key) {
        group = { key, label: key === today ? 'Today' : key === yesterday ? 'Yesterday' : formatDay(key), rows: [] };
        out.push(group);
      }
      const previous = rows[index - 1];
      const next = rows[index + 1];
      const first = !previous || previous.sender_id !== message.sender_id || dayKey(previous.created_at) !== key || ms(message.created_at) - ms(previous.created_at) > GAP;
      const last = !next || next.sender_id !== message.sender_id || dayKey(next.created_at) !== key || ms(next.created_at) - ms(message.created_at) > GAP;
      group.rows.push({ message, mine: message.sender_id === userId, first, last });
    });
    return out;
  }, [rows, today, userId]);

  const lastMine = [...rows].reverse().find(row => row.sender_id === userId);

  const grow = () => {
    const element = box.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  };

  const onType = (value: string) => {
    setDraft(value);
    window.requestAnimationFrame(grow);
    const now = Date.now();
    if (value && ready.current && now - lastTyping.current > 2500) {
      lastTyping.current = now;
      try {
        void channel.current?.send({ type: 'broadcast', event: 'typing', payload: { userId } });
      } catch {
        // ignore
      }
    }
  };

  const send = async (text?: string) => {
    const body = (text ?? draft).trim();
    if (!body || busy || !relId || !userId) return;
    setBusy(true);
    setError('');
    const temp: ChatRow = { id: `temp-${Date.now()}`, sender_id: userId, body, created_at: new Date().toISOString(), read_at: null };
    setDraft('');
    window.requestAnimationFrame(grow);
    client.setQueryData<ChatRow[]>(['chat', relId], old => [...(old ?? []), temp]);
    try {
      await rpcOk('send_message', { p_body: body });
      await refresh('chat');
    } catch (problem) {
      client.setQueryData<ChatRow[]>(['chat', relId], old => (old ?? []).filter(row => row.id !== temp.id));
      setDraft(body);
      setError(messageOf(problem));
    } finally {
      setBusy(false);
    }
  };

  const unsend = async (id: string) => {
    if (!window.confirm('Unsend this message for both of you?')) return;
    setOpenId(undefined);
    try {
      await rpcOk('delete_message', { p_id: id });
      await refresh('chat');
    } catch (problem) {
      setError(messageOf(problem));
    }
  };

  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <section className="chat">
      <header className="chat-head">
        <Avatar profile={partner} partner />
        <div>
          <strong>{name}</strong>
          <span className={typing ? 'is-typing' : ''}>
            {typing ? (
              <>
                <i className="typing-dots" aria-hidden="true">
                  <b />
                  <b />
                  <b />
                </i>{' '}
                writing…
              </>
            ) : (
              <>
                <Lock size={11} /> Private, just the two of you
              </>
            )}
          </span>
        </div>
      </header>

      <div className="chat-list" ref={list} aria-live="polite">
        {messages.isPending ? <p className="preview-notice">Opening your chat…</p> : null}
        {messages.error ? <Notice>We couldn’t load your chat. Please try again in a moment.</Notice> : null}
        {messages.isSuccess && rows.length === 0 ? (
          <div className="chat-empty">
            <span className="chat-empty-mark" aria-hidden="true">
              <i />
              <i />
            </span>
            <h3>Say hello to {name}.</h3>
            <p>This is your private space. Nobody else can read it.</p>
            <div className="chat-starters">
              {STARTERS.map(text => (
                <button key={text} type="button" onClick={() => send(text)}>
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {groups.map(group => (
          <div key={group.key} className="chat-day">
            <span className="chat-day-label">{group.label}</span>
            {group.rows.map(({ message, mine, first, last }) => {
              const pending = message.id.startsWith('temp-');
              return (
                <div key={message.id} className={`chat-row ${mine ? 'is-mine' : 'is-theirs'}${first ? ' is-first' : ''}${last ? ' is-last' : ''}`}>
                  <button
                    type="button"
                    className={`chat-bubble${pending ? ' is-pending' : ''}`}
                    disabled={!mine || pending}
                    aria-label={mine ? 'Your message. Tap for options' : undefined}
                    onClick={() => setOpenId(openId === message.id ? undefined : message.id)}
                  >
                    {message.body}
                  </button>
                  {last ? (
                    <span className="chat-meta">
                      {clock(message.created_at)}
                      {mine && lastMine?.message.id === message.id && !pending ? (
                        <>
                          {' · '}
                          {message.read_at ? (
                            <>
                              <CheckCheck size={12} /> Seen
                            </>
                          ) : (
                            <>
                              <Check size={12} /> Sent
                            </>
                          )}
                        </>
                      ) : null}
                    </span>
                  ) : null}
                  {mine && openId === message.id ? (
                    <button type="button" className="chat-unsend" onClick={() => unsend(message.id)}>
                      Unsend
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
        {typing ? (
          <div className="chat-row is-theirs is-first is-last">
            <span className="chat-bubble chat-bubble-typing" aria-hidden="true">
              <i className="typing-dots">
                <b />
                <b />
                <b />
              </i>
            </span>
          </div>
        ) : null}
      </div>

      {error ? <Notice>{error}</Notice> : null}
      <form
        className="chat-composer"
        onSubmit={event => {
          event.preventDefault();
          void send();
        }}
      >
        <textarea ref={box} rows={1} aria-label={`Message ${name}`} placeholder={`Say something to ${name}…`} maxLength={2000} value={draft} onChange={event => onType(event.target.value)} onKeyDown={onKey} />
        <button type="submit" className="chat-send" aria-label="Send message" disabled={busy || draft.trim().length === 0}>
          <ArrowUp size={19} />
        </button>
      </form>
    </section>
  );
}
