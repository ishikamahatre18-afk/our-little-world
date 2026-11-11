import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWorld } from '@/components/account-context';
import { db } from '@/lib/db';
import { appToday } from '@/lib/couple-time';
import type { BucketCategory } from '@/lib/ideas';

export type Relationship = { id: string; anniversary: string; next_meetup?: string | null; meetup_label?: string | null };

/** Who am I, who is my partner, and which relationship are we in. */
export function useCouple() {
  const world = useWorld();
  const data = world.data;
  const relationship = data?.relationship as unknown as Relationship | undefined;
  return {
    world,
    user: world.user,
    userId: world.user?.id as string | undefined,
    me: data?.profile,
    partner: data?.partner,
    relationship,
    relId: relationship?.id as string | undefined,
  };
}

/** "Today" in India time, refreshed while the app is open. */
export function useToday(): string {
  const [today, setToday] = useState(() => appToday());
  useEffect(() => {
    const timer = setInterval(() => setToday(appToday()), 30000);
    return () => clearInterval(timer);
  }, []);
  return today;
}

export function useRefresh() {
  const client = useQueryClient();
  return (...keys: string[]) => Promise.all(keys.map(key => client.invalidateQueries({ queryKey: [key] })));
}

function failure(error: { message: string } | null): never {
  throw new Error(error?.message ?? 'Something went wrong');
}

// ---------------------------------------------------------------------
// Daily question
// ---------------------------------------------------------------------
export type AnswerRow = { id: string; relationship_id: string; user_id: string; question_day: string; answer: string; created_at: string };

export function useAnswers(relId?: string) {
  return useQuery({
    queryKey: ['answers', relId],
    enabled: !!relId,
    staleTime: 15000,
    refetchInterval: 30000,
    queryFn: async (): Promise<AnswerRow[]> => {
      const { data, error } = await db.from('question_answers').select('*').order('question_day', { ascending: false }).limit(400);
      if (error) failure(error);
      return data ?? [];
    },
  });
}

/** True when your partner has answered today (the answer itself stays hidden until you answer too). */
export function usePartnerAnswered(relId?: string) {
  return useQuery({
    queryKey: ['partner-answered', relId],
    enabled: !!relId,
    staleTime: 15000,
    refetchInterval: 30000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await db.rpc('partner_answered_today');
      if (error) failure(error);
      return data === true;
    },
  });
}

// ---------------------------------------------------------------------
// Love letters
// ---------------------------------------------------------------------
export type SentLetter = {
  id: string;
  kind: 'letter' | 'open_when';
  title: string;
  body: string;
  open_when: string | null;
  unlock_at: string | null;
  opened_at: string | null;
  created_at: string;
};

export type InboxLetter = {
  id: string;
  author_id: string;
  kind: 'letter' | 'open_when';
  title: string | null;
  open_when: string | null;
  unlock_at: string | null;
  opened_at: string | null;
  created_at: string;
  body: string | null;
  sealed: boolean;
};

export function useInbox(relId?: string) {
  return useQuery({
    queryKey: ['inbox', relId],
    enabled: !!relId,
    staleTime: 15000,
    refetchInterval: 60000,
    queryFn: async (): Promise<InboxLetter[]> => {
      const { data, error } = await db.rpc('letter_inbox');
      if (error) failure(error);
      return data ?? [];
    },
  });
}

export function useSentLetters(relId?: string) {
  return useQuery({
    queryKey: ['sent', relId],
    enabled: !!relId,
    staleTime: 15000,
    refetchInterval: 60000,
    queryFn: async (): Promise<SentLetter[]> => {
      const { data, error } = await db.from('love_letters').select('*').order('created_at', { ascending: false });
      if (error) failure(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------
export type MemoryRow = {
  id: string;
  author_id: string;
  title: string;
  note: string | null;
  memory_date: string;
  photo_paths: string[];
  created_at: string;
  photoUrls: string[];
};

export function useMemories(relId?: string) {
  return useQuery({
    queryKey: ['memories', relId],
    enabled: !!relId,
    staleTime: 60000,
    refetchInterval: 60000,
    queryFn: async (): Promise<MemoryRow[]> => {
      const { data, error } = await db.from('memories').select('*').order('memory_date', { ascending: false }).order('created_at', { ascending: false });
      if (error) failure(error);
      const rows: Omit<MemoryRow, 'photoUrls'>[] = data ?? [];
      const paths = rows.flatMap(row => row.photo_paths);
      const urls = new Map<string, string>();
      if (paths.length > 0) {
        const signed = await db.storage.from('memory-photos').createSignedUrls(paths, 3600);
        if (signed.error) failure(signed.error);
        for (const item of (signed.data ?? []) as { path: string; signedUrl: string | null }[]) {
          if (item.signedUrl) urls.set(item.path, item.signedUrl);
        }
      }
      return rows.map(row => ({ ...row, photoUrls: row.photo_paths.map(path => urls.get(path)).filter((url): url is string => !!url) }));
    },
  });
}

/** Just titles and dates, for the notification feed (no photo links). */
export type MemoryNote = { id: string; author_id: string; title: string; created_at: string };

export function useMemoryFeed(relId?: string) {
  return useQuery({
    queryKey: ['memory-feed', relId],
    enabled: !!relId,
    staleTime: 60000,
    refetchInterval: 60000,
    queryFn: async (): Promise<MemoryNote[]> => {
      const { data, error } = await db.from('memories').select('id, author_id, title, created_at').order('created_at', { ascending: false }).limit(20);
      if (error) failure(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------
// Bucket list
// ---------------------------------------------------------------------
export type BucketRow = { id: string; added_by: string; title: string; category: BucketCategory; done: boolean; done_on: string | null; created_at: string };

export function useBucket(relId?: string) {
  return useQuery({
    queryKey: ['bucket', relId],
    enabled: !!relId,
    staleTime: 15000,
    refetchInterval: 60000,
    queryFn: async (): Promise<BucketRow[]> => {
      const { data, error } = await db.from('bucket_items').select('*').order('created_at', { ascending: false });
      if (error) failure(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------
// Thinking of you
// ---------------------------------------------------------------------
export type PulseKind = 'heart' | 'miss' | 'kiss' | 'hug';
export type PulseRow = { id: string; sender_id: string; kind: PulseKind; created_at: string; seen_at: string | null };

export const PULSE_TEXT: Record<PulseKind, { send: string; received: string }> = {
  heart: { send: 'Thinking of you', received: 'is thinking of you' },
  miss: { send: 'I miss you', received: 'misses you' },
  kiss: { send: 'Send a kiss', received: 'sent you a kiss' },
  hug: { send: 'Big hug', received: 'sent you a big hug' },
};

export function usePulses(relId?: string) {
  return useQuery({
    queryKey: ['pulses', relId],
    enabled: !!relId,
    staleTime: 10000,
    refetchInterval: 20000,
    queryFn: async (): Promise<PulseRow[]> => {
      const { data, error } = await db.from('pulses').select('id, sender_id, kind, created_at, seen_at').order('created_at', { ascending: false }).limit(60);
      if (error) failure(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------
// Little Lesson check-ins
// ---------------------------------------------------------------------
export type LessonCheckin = { id: string; user_id: string; lesson_day: string; created_at: string };

export function useLessonCheckins(relId?: string) {
  return useQuery({
    queryKey: ['lessons', relId],
    enabled: !!relId,
    staleTime: 15000,
    refetchInterval: 30000,
    queryFn: async (): Promise<LessonCheckin[]> => {
      const { data, error } = await db.from('lesson_checkins').select('id, user_id, lesson_day, created_at').order('lesson_day', { ascending: false }).limit(800);
      if (error) failure(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------
// Need cards
// ---------------------------------------------------------------------
export type NeedRow = { id: string; user_id: string; need_day: string; kind: string; note: string | null; acked_at: string | null; created_at: string };

export function useNeeds(relId?: string) {
  return useQuery({
    queryKey: ['needs', relId],
    enabled: !!relId,
    staleTime: 10000,
    refetchInterval: 30000,
    queryFn: async (): Promise<NeedRow[]> => {
      const { data, error } = await db.from('need_cards').select('id, user_id, need_day, kind, note, acked_at, created_at').order('need_day', { ascending: false }).limit(120);
      if (error) failure(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------
// Repair
// ---------------------------------------------------------------------
export type RepairRow = { id: string; started_by: string; status: 'open' | 'closed'; started_at: string; closed_at: string | null };
export type RepairEntry = { id: string; repair_id: string; user_id: string; felt: string; need: string; sorry: string | null; created_at: string };

export function useRepairs(relId?: string) {
  return useQuery({
    queryKey: ['repairs', relId],
    enabled: !!relId,
    staleTime: 10000,
    refetchInterval: 20000,
    queryFn: async (): Promise<{ repairs: RepairRow[]; entries: RepairEntry[] }> => {
      const [repairs, entries] = await Promise.all([
        db.from('repairs').select('id, started_by, status, started_at, closed_at').order('started_at', { ascending: false }).limit(30),
        db.from('repair_entries').select('id, repair_id, user_id, felt, need, sorry, created_at').order('created_at', { ascending: true }).limit(120),
      ]);
      if (repairs.error) failure(repairs.error);
      if (entries.error) failure(entries.error);
      return { repairs: repairs.data ?? [], entries: entries.data ?? [] };
    },
  });
}

// ---------------------------------------------------------------------
// Journey diary
// ---------------------------------------------------------------------
export type JournalRow = {
  id: string;
  author_id: string;
  entry_date: string;
  title: string;
  body: string;
  mood: number | null;
  visibility: 'shared' | 'private';
  created_at: string;
};

export function useJournal(relId?: string) {
  return useQuery({
    queryKey: ['journal', relId],
    enabled: !!relId,
    staleTime: 30000,
    refetchInterval: 60000,
    queryFn: async (): Promise<JournalRow[]> => {
      const { data, error } = await db.from('journal_entries').select('*').order('entry_date', { ascending: false }).order('created_at', { ascending: false }).limit(600);
      if (error) failure(error);
      return data ?? [];
    },
  });
}

// ---------------------------------------------------------------------
// Appreciation jar
// ---------------------------------------------------------------------
export type JarNote = { id: string; author_id: string; body: string; created_at: string };
export type JarMonth = { month: string; mine: number; theirs: number };

export function useJarNotes(relId?: string) {
  return useQuery({
    queryKey: ['jar', relId],
    enabled: !!relId,
    staleTime: 30000,
    refetchInterval: 60000,
    queryFn: async (): Promise<JarNote[]> => {
      const { data, error } = await db.from('appreciations').select('id, author_id, body, created_at').order('created_at', { ascending: false }).limit(600);
      if (error) failure(error);
      return data ?? [];
    },
  });
}

export function useJarCounts(relId?: string) {
  return useQuery({
    queryKey: ['jar-counts', relId],
    enabled: !!relId,
    staleTime: 30000,
    refetchInterval: 60000,
    queryFn: async (): Promise<JarMonth[]> => {
      const { data, error } = await db.rpc('jar_counts');
      if (error) failure(error);
      return Array.isArray(data) ? (data as JarMonth[]) : [];
    },
  });
}

// ---------------------------------------------------------------------
// Growth (counts per month)
// ---------------------------------------------------------------------
export type GrowthMonth = { month: string; answers: number; lessons: number; journal: number; repairs: number; memories: number; letters: number; cared: number };

export function useGrowth(relId?: string) {
  return useQuery({
    queryKey: ['growth', relId],
    enabled: !!relId,
    staleTime: 60000,
    queryFn: async (): Promise<GrowthMonth[]> => {
      const { data, error } = await db.rpc('growth_stats');
      if (error) failure(error);
      return Array.isArray(data) ? (data as GrowthMonth[]) : [];
    },
  });
}

// ---------------------------------------------------------------------
// Private chat
// ---------------------------------------------------------------------
export type ChatRow = { id: string; sender_id: string; body: string; created_at: string; read_at: string | null };

export function useMessages(relId?: string) {
  return useQuery({
    queryKey: ['chat', relId],
    enabled: !!relId,
    staleTime: 3000,
    refetchInterval: 8000,
    queryFn: async (): Promise<ChatRow[]> => {
      const { data, error } = await db.from('chat_messages').select('id, sender_id, body, created_at, read_at').order('created_at', { ascending: false }).limit(200);
      if (error) failure(error);
      return ((data ?? []) as ChatRow[]).slice().reverse();
    },
  });
}

export function useChatUnread(relId?: string) {
  return useQuery({
    queryKey: ['chat-unread', relId],
    enabled: !!relId,
    staleTime: 5000,
    refetchInterval: 20000,
    queryFn: async (): Promise<number> => {
      const { data, error } = await db.rpc('chat_unread');
      if (error) failure(error);
      return typeof data === 'number' ? data : 0;
    },
  });
}

/** Live updates: new messages show up instantly while the app is open. (If realtime is off, the polling above still works.) */
export function useChatRealtime(relId?: string) {
  const client = useQueryClient();
  useEffect(() => {
    if (!relId) return;
    let channel: unknown;
    try {
      channel = db
        .channel(`chat-${relId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `relationship_id=eq.${relId}` }, () => {
          void client.invalidateQueries({ queryKey: ['chat'] });
          void client.invalidateQueries({ queryKey: ['chat-unread'] });
        })
        .subscribe();
    } catch {
      // realtime is a bonus; polling keeps the chat fresh
    }
    return () => {
      try {
        if (channel) void db.removeChannel(channel);
      } catch {
        // nothing to clean up
      }
    };
  }, [relId, client]);
}

// ---------------------------------------------------------------------
// Little red dots for the tab bar
// ---------------------------------------------------------------------
export function useBadges(): Record<string, number> {
  const { relId, userId } = useCouple();
  const today = useToday();
  const inbox = useInbox(relId);
  const answers = useAnswers(relId);
  const repairs = useRepairs(relId);
  const needs = useNeeds(relId);
  const unread = useChatUnread(relId);
  if (!relId) return {};
  const waitingLetters = (inbox.data ?? []).filter(letter => !letter.sealed && !letter.opened_at).length;
  const answeredToday = (answers.data ?? []).some(row => row.user_id === userId && row.question_day === today);
  const openRepair = (repairs.data?.repairs ?? []).find(repair => repair.status === 'open');
  const repairWaiting = openRepair && !(repairs.data?.entries ?? []).some(entry => entry.repair_id === openRepair.id && entry.user_id === userId) ? 1 : 0;
  const space = waitingLetters + (answers.isSuccess && !answeredToday ? 1 : 0) + repairWaiting;
  const needWaiting = (needs.data ?? []).some(row => row.user_id !== userId && row.need_day === today && !row.acked_at) ? 1 : 0;
  const badges: Record<string, number> = {};
  if (space > 0) badges['/our-space'] = space;
  if (needWaiting > 0) badges['/home'] = needWaiting;
  if ((unread.data ?? 0) > 0) badges['/chat'] = unread.data ?? 0;
  return badges;
}
