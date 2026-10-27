import { addDays } from './couple-time';

export type AnswerLike = { user_id: string; question_day: string };

/** Days on which BOTH partners answered. */
export function sharedDays(rows: AnswerLike[], userId: string | undefined): Set<string> {
  const mine = new Set<string>();
  const theirs = new Set<string>();
  for (const row of rows) {
    if (row.user_id === userId) mine.add(row.question_day);
    else theirs.add(row.question_day);
  }
  const both = new Set<string>();
  for (const day of mine) if (theirs.has(day)) both.add(day);
  return both;
}

/**
 * Consecutive days (ending today, or yesterday if today is still open) on which both of you answered.
 * Today does not break the streak until the day is over.
 */
export function currentStreak(rows: AnswerLike[], userId: string | undefined, today: string): number {
  const both = sharedDays(rows, userId);
  let cursor = both.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (both.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}
