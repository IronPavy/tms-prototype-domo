/* Small date helpers for calendars and date pickers (ISO weeks, Monday first). */

export interface DateRange {
  start: Date;
  /** inclusive; equal to `start` for a single day */
  end: Date;
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

/** Monday of the week containing `d` */
export function startOfWeek(d: Date) {
  const day = (d.getDay() + 6) % 7; // Mon = 0 … Sun = 6
  return addDays(startOfDay(d), -day);
}

/** ISO-8601 week number ("KW") */
export function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const sameRange = (a: DateRange, b: DateRange) => sameDay(a.start, b.start) && sameDay(a.end, b.end);

/** whole days from a to b (b - a) */
export const diffDays = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);

/** a ≤ d ≤ b (by day) */
export const isBetween = (d: Date, a: Date, b: Date) => diffDays(a, d) >= 0 && diffDays(d, b) >= 0;

/** ordered range from two picked days */
export const toRange = (a: Date, b: Date): DateRange =>
  diffDays(a, b) >= 0 ? { start: startOfDay(a), end: startOfDay(b) } : { start: startOfDay(b), end: startOfDay(a) };

const pad = (n: number) => String(n).padStart(2, "0");

/** "05.10.2026" */
export const formatDate = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;

/** "21.09. – 27.09.2026" · "05.10.2026" for a single day · full dates across years */
export function formatRange({ start, end }: DateRange) {
  if (sameDay(start, end)) return formatDate(start);
  if (start.getFullYear() !== end.getFullYear()) return `${formatDate(start)} – ${formatDate(end)}`;
  return `${pad(start.getDate())}.${pad(start.getMonth() + 1)}. – ${formatDate(end)}`;
}

/** "21.09. – 27.09.2026" for the week starting on `monday` */
export const formatWeekRange = (monday: Date) => formatRange({ start: monday, end: addDays(monday, 6) });

/** 6 rows × 7 days covering the month of `month` (Monday first) */
export function monthGrid(month: Date) {
  const start = startOfWeek(startOfMonth(month));
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
}
