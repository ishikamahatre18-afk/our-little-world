import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Bell, BellRing, BookOpen, Camera, Coffee, HandHeart, Heart, HeartHandshake, ListChecks, Mail, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/couple-time';
import { needInfo } from '@/lib/needs';
import { PULSE_TEXT, useBucket, useCouple, useInbox, useJournal, useLessonCheckins, useMemoryFeed, useNeeds, usePulses, useRepairs } from './data';
import { Sheet } from './sheet';

export type AppEvent = { id: string; at: string; icon: LucideIcon; text: string; detail?: string | undefined; to: string; hash?: string | undefined };

const ms = (timestamp: string) => new Date(timestamp).getTime();
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
const SEEN_KEY = 'between-us-notifications-seen';
const ALERT_KEY = 'between-us-alerts-from';
const ALERT_ON = 'between-us-alerts-on';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // private windows can refuse storage; alerts then simply stay off
  }
}

/** Everything your partner has done lately, newest first. Built from data the app already loads. */
export function useEvents(): AppEvent[] {
  const { relId, userId, partner } = useCouple();
  const pulses = usePulses(relId);
  const inbox = useInbox(relId);
  const needs = useNeeds(relId);
  const repairs = useRepairs(relId);
  const lessons = useLessonCheckins(relId);
  const journal = useJournal(relId);
  const memories = useMemoryFeed(relId);
  const bucket = useBucket(relId);
  const name = partner?.name || 'Your partner';

  return useMemo(() => {
    if (!relId || !userId) return [];
    const events: AppEvent[] = [];
    for (const pulse of pulses.data ?? []) {
      if (pulse.sender_id !== userId) events.push({ id: `pulse-${pulse.id}`, at: pulse.created_at, icon: Heart, text: `${name} ${PULSE_TEXT[pulse.kind]?.received ?? 'is thinking of you'}`, to: '/home' });
    }
    for (const letter of inbox.data ?? []) {
      if (letter.author_id === userId) continue;
      events.push({ id: `letter-${letter.id}`, at: letter.created_at, icon: Mail, text: letter.sealed ? `${name} sealed a letter for you` : `${name} wrote you a letter`, to: '/our-space' });
    }
    for (const need of needs.data ?? []) {
      if (need.user_id !== userId) events.push({ id: `need-${need.id}`, at: need.created_at, icon: HandHeart, text: `${name} needs ${needInfo(need.kind).need} today`, to: '/home' });
      else if (need.acked_at) events.push({ id: `acked-${need.id}`, at: need.acked_at, icon: HeartHandshake, text: `${name} has got you`, to: '/home' });
    }
    for (const repair of repairs.data?.repairs ?? []) {
      if (repair.started_by !== userId) events.push({ id: `repair-${repair.id}`, at: repair.started_at, icon: HeartHandshake, text: `${name} would like to talk things through, gently`, to: '/our-space', hash: 'repair' });
    }
    for (const checkin of lessons.data ?? []) {
      if (checkin.user_id !== userId) events.push({ id: `lesson-${checkin.id}`, at: checkin.created_at, icon: Sparkles, text: `${name} tried today’s little lesson`, to: '/home' });
    }
    for (const entry of journal.data ?? []) {
      if (entry.author_id !== userId && entry.visibility === 'shared') events.push({ id: `diary-${entry.id}`, at: entry.created_at, icon: BookOpen, text: `${name} wrote in your diary`, detail: entry.title || undefined, to: '/memories', hash: 'journey' });
    }
    for (const memory of memories.data ?? []) {
      if (memory.author_id !== userId) events.push({ id: `memory-${memory.id}`, at: memory.created_at, icon: Camera, text: `${name} added a memory`, detail: memory.title, to: '/memories' });
    }
    for (const item of bucket.data ?? []) {
      if (item.added_by !== userId) events.push({ id: `bucket-${item.id}`, at: item.created_at, icon: ListChecks, text: `${name} added to your list`, detail: item.title, to: '/activities' });
    }
    const cutoff = Date.now() - FOURTEEN_DAYS;
    return events
      .filter(event => ms(event.at) > cutoff)
      .sort((a, b) => ms(b.at) - ms(a.at))
      .slice(0, 40);
  }, [relId, userId, name, pulses.data, inbox.data, needs.data, repairs.data, lessons.data, journal.data, memories.data, bucket.data]);
}

/** Remembers when you last looked, on this device only. */
function useSeen(userId: string | undefined) {
  const key = `${SEEN_KEY}-${userId ?? 'none'}`;
  const [seen, setSeen] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) return;
    const stored = read(key);
    if (stored) setSeen(stored);
    else {
      const now = new Date().toISOString();
      write(key, now);
      setSeen(now);
    }
  }, [key, userId]);
  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    write(key, now);
    setSeen(now);
  }, [key]);
  return { seen, markSeen };
}

async function showAlert(event: AppEvent) {
  const options = { body: event.detail ?? 'Tap to open Between Us', icon: '/app-icon-192.png', tag: event.id, data: { url: event.hash ? `${event.to}#${event.hash}` : event.to } };
  try {
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (registration) await registration.showNotification(event.text, options);
    else new Notification(event.text, options);
  } catch {
    // some browsers refuse; the bell inside the app still works
  }
}

/** Device alerts: a notification when something new arrives while the app is open in the background. */
function useDeviceAlerts(events: AppEvent[]) {
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || read(ALERT_ON) !== 'yes' || events.length === 0) return;
    const from = read(ALERT_KEY) ?? new Date().toISOString();
    const fresh = events.filter(event => ms(event.at) > ms(from));
    if (fresh.length === 0) return;
    write(ALERT_KEY, new Date(ms(fresh[0]?.at ?? from)).toISOString());
    if (document.visibilityState === 'visible') return;
    void showAlert(fresh[0] as AppEvent);
  }, [events]);
}

export function NotificationBell() {
  const { userId, relId } = useCouple();
  const events = useEvents();
  const navigate = useNavigate();
  const { seen, markSeen } = useSeen(userId);
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [alertsOn, setAlertsOn] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  useDeviceAlerts(events);

  useEffect(() => {
    setAlertsOn(read(ALERT_ON) === 'yes');
    if (typeof Notification !== 'undefined') setPermission(Notification.permission);
  }, [open]);

  if (!relId) return null;
  const unread = seen ? events.filter(event => ms(event.at) > ms(seen)).length : 0;
  const supported = typeof Notification !== 'undefined';

  const openSheet = () => {
    setSnapshot(seen);
    setOpen(true);
    markSeen();
  };

  const toggleAlerts = async () => {
    if (!supported) return;
    if (alertsOn) {
      write(ALERT_ON, 'no');
      setAlertsOn(false);
      return;
    }
    const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      write(ALERT_ON, 'yes');
      write(ALERT_KEY, new Date().toISOString());
      setAlertsOn(true);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" aria-label={unread ? `${unread} new updates` : 'Updates'} onClick={openSheet} className="bell-button">
        {unread > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {unread > 0 ? <span className="bell-dot">{unread > 9 ? '9+' : unread}</span> : null}
      </Button>
      {open ? (
        <Sheet title="Little updates" onClose={() => setOpen(false)}>
          {events.length === 0 ? (
            <div className="empty-state">
              <Coffee size={25} strokeWidth={1} />
              <h3>All quiet for now.</h3>
              <p>When your partner sends a heart, writes a letter or shares a card, it appears here.</p>
            </div>
          ) : (
            <ul className="event-list">
              {events.map(event => {
                const Icon = event.icon;
                const fresh = !snapshot || ms(event.at) > ms(snapshot);
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      className={`event-item${fresh ? ' is-new' : ''}`}
                      onClick={() => {
                        setOpen(false);
                        void navigate({ to: event.to, ...(event.hash ? { hash: event.hash } : {}) } as never);
                      }}
                    >
                      <span className="event-icon">
                        <Icon size={16} />
                      </span>
                      <span className="event-text">
                        <strong>{event.text}</strong>
                        {event.detail ? <em>{event.detail}</em> : null}
                        <small>{timeAgo(event.at)}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="alert-setting">
            <div>
              <strong>Alerts on this device</strong>
              <p>
                {!supported
                  ? 'This browser can’t show alerts.'
                  : permission === 'denied'
                    ? 'Alerts are blocked in your browser settings for this site.'
                    : 'Get a notification when something new arrives while the app is open in the background. Fully closed-app alerts need an extra setup step.'}
              </p>
            </div>
            <Button variant={alertsOn ? 'soft' : 'romantic'} size="sm" disabled={!supported || permission === 'denied'} onClick={toggleAlerts}>
              {alertsOn ? 'Turn off' : 'Turn on'}
            </Button>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}
