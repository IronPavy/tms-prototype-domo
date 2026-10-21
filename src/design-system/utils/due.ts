/* Due date + repetition of a task ("Set date and time" dialog). Dates are ISO strings (yyyy-mm-dd), times "hh:mm". */

export type Repeat = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type TimeMode = "time" | "range" | "allday";

export interface DueSettings {
  repeat: Repeat;
  /** first day (the day itself for "No repetition") */
  start: string;
  /** last day of a series — "" = no end */
  end: string;
  /** daily: Mon … Sun */
  days: boolean[];
  /** weekly: one Mon … Sun row per week of the cycle */
  weeks: boolean[][];
  timeMode: TimeMode;
  time: string;
  from: string;
  to: string;
}

export const REPEATS: { id: Repeat; label: string }[] = [
  { id: "none", label: "No repetition" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad = (n: number) => String(n).padStart(2, "0");
export const toInputDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromInputDate = (iso: string) => new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
/** "2026-10-08" → "08.10." */
export const shortDate = (iso: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.` : "—");
/** "2026-10-08" → "08.10.2026" */
export const longDate = (iso: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "");

export const defaultDue = (today: Date): DueSettings => ({
  repeat: "none", start: toInputDate(today), end: "",
  days: Array(7).fill(true), weeks: [Array(7).fill(true)],
  timeMode: "time", time: "17:00", from: "16:00", to: "17:00",
});

/** "17:00" · "16:00–17:00" · "All day" */
export const timeText = (d: DueSettings) => (d.timeMode === "time" ? d.time : d.timeMode === "range" ? `${d.from}–${d.to}` : "All day");
/** clock time the task is due at (end of day for all-day tasks) */
export const dueClock = (d: DueSettings) => (d.timeMode === "time" ? d.time : d.timeMode === "range" ? d.from : "23:59");

const REPEAT_WORD: Record<Exclude<Repeat, "none">, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };
const dayNames = (flags: boolean[]) => (flags.every(Boolean) ? "" : flags.flatMap((on, i) => (on ? [DAY_LABELS[i]] : [])).join(", "));

/** value shown on the "Due date" button / summary — "12.10., 17:00" or "Weekly, 17:00" */
export function dueLabel(d: DueSettings) {
  return d.repeat === "none" ? `${shortDate(d.start)}, ${timeText(d)}` : `${REPEAT_WORD[d.repeat]}, ${timeText(d)}`;
}

/** schedule text of the task row — "One-time" · "Daily 17:00" · "Weekly · Mon, Wed 17:00" */
export function scheduleLabel(d: DueSettings) {
  if (d.repeat === "none") return "Einmalig";
  const t = d.timeMode === "allday" ? "ganztägig" : d.timeMode === "range" ? `${d.from}–${d.to}` : d.time;
  const DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const days = (flags: boolean[]) => (flags.every(Boolean) ? "" : flags.flatMap((on, i) => (on ? [DE[i]] : [])).join(", "));
  if (d.repeat === "daily") return `Täglich ${days(d.days) ? `${days(d.days)} ` : ""}${t}`;
  if (d.repeat === "weekly") return `Wöchentlich${days(d.weeks[0]) ? ` · ${days(d.weeks[0])}` : ""} ${t}`;
  if (d.repeat === "monthly") return `Monatlich · am ${Number(d.start.slice(8, 10)) || 1}. ${t}`;
  return `Jährlich ${t}`;
}

export interface DueErrors { start?: string; end?: string; days?: string; weeks?: string; time?: string }

export function dueErrors(d: DueSettings): DueErrors {
  const e: DueErrors = {};
  if (!d.start) e.start = "Choose a date.";
  if (d.repeat !== "none" && d.end && d.start && d.end < d.start) e.end = "The end must be after the start.";
  if (d.repeat === "daily" && !d.days.some(Boolean)) e.days = "Select at least one day.";
  if (d.repeat === "weekly" && d.weeks.some((w) => !w.some(Boolean))) e.weeks = "Select at least one day in every week.";
  if (d.timeMode === "time" && !d.time) e.time = "Enter a time.";
  if (d.timeMode === "range" && (!d.from || !d.to || d.to <= d.from)) e.time = "The end time must be after the start time.";
  return e;
}
