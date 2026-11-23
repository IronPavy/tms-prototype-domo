import {
  addDays, addMonths, clampRange, diffDays, endOfMonth, sameDay, sameRange, startOfDay, startOfMonth, startOfWeek, type DateRange,
} from "./date";

export type PresetId = "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth";

export type RangeKind = "day" | "week" | "month";

export interface DatePreset {
  id: PresetId;
  label: string;
  kind: RangeKind;
  range: (today: Date) => DateRange;
}

/** Quick ranges shown on the left of the date range picker (weeks start on Monday).
    "Alle Tage" (no date filter) is not a range — the picker adds it on top when `allowAll` is set. */
export const DATE_PRESETS: DatePreset[] = [
  { id: "today",     label: "Heute",        kind: "day",   range: (t) => ({ start: startOfDay(t), end: startOfDay(t) }) },
  { id: "yesterday", label: "Gestern",      kind: "day",   range: (t) => ({ start: addDays(t, -1), end: addDays(t, -1) }) },
  { id: "thisWeek",  label: "Diese Woche",  kind: "week",  range: (t) => ({ start: startOfWeek(t), end: addDays(startOfWeek(t), 6) }) },
  { id: "lastWeek",  label: "Letzte Woche", kind: "week",  range: (t) => ({ start: addDays(startOfWeek(t), -7), end: addDays(startOfWeek(t), -1) }) },
  { id: "thisMonth", label: "Dieser Monat", kind: "month", range: (t) => ({ start: startOfMonth(t), end: endOfMonth(t) }) },
];

export const ALL_DAYS_LABEL = "Alle Tage";

/** preset whose range equals `range` today, if any */
export const matchPreset = (range: DateRange, today: Date) =>
  DATE_PRESETS.find((p) => sameRange(p.range(today), range));

/** How ‹ › step, by the kind of range:
    single day → 1 day · a week (Mon–Sun, or Mon until `max` = "Diese Woche") → one whole week Mon–Sun ·
    whole month(s) (or the 1st until `max` = "Dieser Monat") → as many whole months, 1st to last day ·
    anything else → its own length. With `max`, the result never reaches past it (it ends on `max`).
    `kind` (from the preset picked) wins over the guess — e.g. on a Monday "Diese Woche" is one day but still steps a week. */
export function shiftRange(range: DateRange, dir: 1 | -1, max?: Date, kind?: RangeKind): DateRange {
  const { start, end } = range;
  const clamp = (r: DateRange) => (max ? clampRange(r, max) : r);
  const endsAtMax = !!max && sameDay(end, max);
  const len = diffDays(start, end) + 1;

  if ((len === 1 && !kind) || kind === "day") return clamp({ start: addDays(start, dir), end: addDays(end, dir) });

  const monday = start.getDay() === 1;
  if (kind === "week" || (!kind && monday && (len === 7 || (endsAtMax && len < 7)))) {
    const s = addDays(start, dir * 7);
    return clamp({ start: s, end: addDays(s, 6) });
  }

  const firstOfMonth = start.getDate() === 1;
  const wholeMonths = firstOfMonth && diffDays(end, endOfMonth(end)) === 0;
  const monthToMax = firstOfMonth && endsAtMax && start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (kind === "month" || (!kind && (wholeMonths || monthToMax))) {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;
    const s = addMonths(start, dir * months);
    return clamp({ start: s, end: endOfMonth(addMonths(s, months - 1)) });
  }

  return clamp({ start: addDays(start, dir * len), end: addDays(end, dir * len) });
}
