import { StatusChip } from "../atoms/StatusChip";
import { EmptyTasks } from "../molecules/EmptyTasks";
import { CalendarTaskItem } from "../molecules/CalendarTaskItem";
import { addDays, diffDays, sameDay, startOfWeek } from "../utils/date";
import type { TaskRowData } from "../molecules/TaskRow";
import type { TaskGroup } from "./TaskList";

export interface TaskCalendarProps {
  /** groups from the task data — only day groups (with `date`) are shown; the overdue group is ignored */
  groups: TaskGroup[];
  today: Date;
  onOpen?: (task: TaskRowData) => void;
}

const WD = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar view — one row of 7 day columns (Mon–Sun) per week of the period. Days outside the period stay empty and faded.
    Column = SP3 "Card" (surface/raised, 1px border (line), radius 3x): header "Mon 21.09." (Medium + Standard) · task count
    (Small, text label), body = CalendarTaskItems sorted by time (gap 2x, padding 2x).
    Today: header on selected background, card border brand/border/normal. */
export function TaskCalendar({ groups, today, onOpen }: TaskCalendarProps) {
  const days = groups.filter((g) => g.date);
  const noDue = groups.find((g) => g.kind === "nodue" && g.tasks.length);
  if (!days.length && !noDue) return null;

  const first = days[0]?.date ?? today, last = days[days.length - 1]?.date ?? today;
  const byDay = new Map(days.map((g) => [g.date!.toDateString(), g]));
  const weeks: Date[][] = [];
  for (let w = startOfWeek(first); diffDays(w, last) >= 0; w = addDays(w, 7)) weeks.push(Array.from({ length: 7 }, (_, i) => addDays(w, i)));
  const empty = days.every((g) => !g.tasks.length);

  return (
    <div className="flex flex-col gap-[var(--sp-space-4x)]">
      {empty ? (
        noDue ? null : (
        <div className="flex justify-center py-[var(--sp-space-6x)]">
          <EmptyTasks />
        </div>
        )
      ) : (
        weeks.map((week) => (
          <div key={week[0].toDateString()} className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-[var(--sp-space-2x)] min-w-[1008px] items-stretch">
              {week.map((d) => {
                const g = byDay.get(d.toDateString());
                const isToday = sameDay(d, today);
                return (
                  <section
                    key={d.toDateString()}
                    aria-label={g?.label ?? `${WD.format(d)} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`}
                    className={`flex flex-col min-w-0 border border-solid rounded-[var(--sp-radius-3x)] overflow-hidden ${
                      g ? "bg-sp-surface-raised" : "bg-transparent opacity-50"
                    } ${isToday ? "border-sp-brand-border-normal" : "border-sp-border-line"}`}
                  >
                    <header className={`flex items-baseline gap-[var(--sp-space-1x)] py-[var(--sp-space-2x)] px-[var(--sp-space-3x)] border-0 border-b border-solid border-sp-border-line ${isToday ? "bg-sp-selected" : ""}`}>
                      <span className={`sp-text-bold ${isToday ? "text-sp-text-selected" : "text-sp-text"}`}>{WD.format(d)}</span>
                      <span className="sp-text-standard text-sp-text-label">{pad(d.getDate())}.{pad(d.getMonth() + 1)}.</span>
                      {g && <span className="ml-auto sp-text-small text-sp-text-label tabular-nums">{g.tasks.length}</span>}
                    </header>
                    <div className="flex flex-col gap-[var(--sp-space-2x)] p-[var(--sp-space-2x)] min-h-[120px]">
                      {g?.tasks.map((t) => <CalendarTaskItem key={t.id} task={t} onOpen={() => onOpen?.(t)} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* tasks without a due date have no day — their own section under the weeks */}
      {noDue && (
        <section aria-label="Ohne Fälligkeit" className="flex flex-col gap-[var(--sp-space-2x)]">
          <h3 className="flex items-center gap-[var(--sp-space-2x)] m-0 px-[var(--sp-space-1x)]">
            <span className="sp-text-medium text-sp-text-title">Ohne Fälligkeit</span>
            <StatusChip tone="default" label={String(noDue.tasks.length)} />
          </h3>
          <div className="grid gap-[var(--sp-space-2x)] p-[var(--sp-space-2x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-3x)]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {noDue.tasks.map((t) => <CalendarTaskItem key={t.id} task={t} onOpen={() => onOpen?.(t)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
