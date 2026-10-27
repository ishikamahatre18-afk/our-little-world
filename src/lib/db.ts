import { supabase } from '@/integrations/supabase/client';

// The generated Supabase types were created before the newer tables and functions existed,
// so the newer features talk to the database through this untyped handle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = supabase;

/** Calls a database function that answers with a short text ("ok" or a friendly message). */
export async function rpcText(name: string, args: Record<string, unknown> = {}): Promise<string> {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(error.message);
  return typeof data === 'string' ? data : 'ok';
}

/** Same as rpcText, but anything other than "ok" becomes an error with the friendly message. */
export async function rpcOk(name: string, args: Record<string, unknown> = {}): Promise<void> {
  const result = await rpcText(name, args);
  if (result !== 'ok') throw new Error(result);
}

export function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
