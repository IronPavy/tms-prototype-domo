import {
  addDays, addMonths, diffDays, endOfMonth, sameRange, startOfDay, startOfMonth, startOfWeek, type DateRange,
} from "./date";

export type PresetId =
  | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "last30" | "last90";

export interface DatePreset {
  id: PresetId;
  label: string;
  range: (today: Date) => DateRange;
}

/** Quick ranges shown on the left of the date range picker. */
export const DATE_PRESETS: DatePreset[] = [
  { id: "today",     label: "Heute",        range: (t) => ({ start: startOfDay(t), end: startOfDay(t) }) },
  { id: "yesterday", label: "Gestern",      range: (t) => ({ start: addDays(t, -1), end: addDays(t, -1) }) },
  { id: "thisWeek",  label: "Diese Woche",  range: (t) => ({ start: startOfWeek(t), end: addDays(startOfWeek(t), 6) }) },
  { id: "lastWeek",  label: "Letzte Woche", range: (t) => ({ start: addDays(startOfWeek(t), -7), end: addDays(startOfWeek(t), -1) }) },
  { id: "thisMonth", label: "Dieser Monat", range: (t) => ({ start: startOfMonth(t), end: endOfMonth(t) }) },
];

/** preset whose range equals `range` today, if any */
export const matchPreset = (range: DateRange, today: Date) =>
  DATE_PRESETS.find((p) => sameRange(p.range(today), range));

/** Range kind decides how ‹ › step: whole month(s) / year step by calendar unit, otherwise by length. */
export function shiftRange(range: DateRange, dir: 1 | -1): DateRange {
  const { start, end } = range;
  const wholeMonths = start.getDate() === 1 && diffDays(end, endOfMonth(end)) === 0;
  if (wholeMonths) {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;
    const s = addMonths(start, dir * months);
    return { start: s, end: endOfMonth(addMonths(s, months - 1)) };
  }
  const len = diffDays(start, end) + 1;
  return { start: addDays(start, dir * len), end: addDays(end, dir * len) };
}
