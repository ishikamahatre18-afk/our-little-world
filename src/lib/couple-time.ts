// Date helpers shared by the couple features. Dates travel as "YYYY-MM-DD" text.
// "Today" is always India time, so both partners see the same daily question.

const MS_DAY = 86400000;
export const APP_TIME_ZONE = 'Asia/Kolkata';

export function toUtc(iso: string): number {
  const [year = 1970, month = 1, day = 1] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function isoFromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function appToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const pick = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / MS_DAY);
}

export function addDays(iso: string, days: number): string {
  return isoFromUtc(toUtc(iso) + days * MS_DAY);
}

/** A running day number (days since 1 Jan 2025) used to pick the daily question. */
export function dayNumber(iso: string): number {
  return daysBetween('2025-01-01', iso);
}

export function formatDay(iso: string): string {
  return new Date(toUtc(iso)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatMonth(iso: string): string {
  return new Date(toUtc(iso)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function formatTimestampDay(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: APP_TIME_ZONE });
}

export function timeAgo(timestamp: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(timestamp).getTime()) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}

/** "in 5 days", "tomorrow", "today" for a future (or past) calendar date. */
export function daysAwayText(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

// ---------------------------------------------------------------------
// Milestones (calculated from the anniversary, nothing is stored)
// ---------------------------------------------------------------------
export type Milestone = { key: string; label: string; date: string; days: number; kind: 'days' | 'years' };

const DAY_MARKS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000];

function anniversaryInYear(anniversary: string, year: number): string {
  const [, month = 1, day = 1] = anniversary.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return isoFromUtc(Date.UTC(year, month - 1, Math.min(day, lastDay)));
}

export function allMilestones(anniversary: string): Milestone[] {
  const startYear = Number(anniversary.slice(0, 4));
  const list: Milestone[] = [];
  for (const days of DAY_MARKS) {
    list.push({ key: `d${days}`, label: `${days.toLocaleString('en-IN')} days together`, date: addDays(anniversary, days), days, kind: 'days' });
  }
  for (let years = 1; years <= 60; years += 1) {
    const date = anniversaryInYear(anniversary, startYear + years);
    list.push({ key: `y${years}`, label: years === 1 ? 'One year together' : `${years} years together`, date, days: daysBetween(anniversary, date), kind: 'years' });
  }
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

export function milestoneSummary(anniversary: string, today: string) {
  const all = allMilestones(anniversary);
  const passed = all.filter(item => item.date <= today);
  const upcoming = all.filter(item => item.date > today);
  return { passed, previous: passed[passed.length - 1], next: upcoming[0], upcoming: upcoming.slice(0, 3) };
}

/** Days until the next anniversary (0 if it is today). */
export function daysUntilAnniversary(anniversary: string, today: string): number {
  const year = Number(today.slice(0, 4));
  let next = anniversaryInYear(anniversary, year);
  if (next < today) next = anniversaryInYear(anniversary, year + 1);
  return daysBetween(today, next);
}
