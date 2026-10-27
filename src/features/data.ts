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
// Little red dots for the tab bar
// ---------------------------------------------------------------------
export function useBadges(): Record<string, number> {
  const { relId, userId } = useCouple();
  const today = useToday();
  const inbox = useInbox(relId);
  const answers = useAnswers(relId);
  if (!relId) return {};
  const waitingLetters = (inbox.data ?? []).filter(letter => !letter.sealed && !letter.opened_at).length;
  const answeredToday = (answers.data ?? []).some(row => row.user_id === userId && row.question_day === today);
  const space = waitingLetters + (answers.isSuccess && !answeredToday ? 1 : 0);
  return space > 0 ? { '/our-space': space } : {};
}
