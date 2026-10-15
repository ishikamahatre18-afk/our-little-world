export function relationshipDates(anniversary: string, today = new Date()) {
  const [year, month, day] = anniversary.split('-').map(Number);
  const start = Date.UTC(year, month - 1, day);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const occurrence = (y: number) => Date.UTC(y, month - 1, Math.min(day, new Date(Date.UTC(y, month, 0)).getUTCDate()));
  let next = occurrence(today.getFullYear());
  if (next < now) next = occurrence(today.getFullYear() + 1);
  return { daysTogether: Math.max(0, Math.round((now - start) / 86400000)), daysUntil: Math.round((next - now) / 86400000) };
}
