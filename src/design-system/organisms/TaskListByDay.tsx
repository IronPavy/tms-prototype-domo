import { Fragment, type ReactNode } from "react";
import { StatusChip } from "../atoms/StatusChip";
import { EmptyState } from "../molecules/EmptyState";
import { TaskRow, type TaskRowData } from "../molecules/TaskRow";
import type { TaskAction } from "../molecules/TaskRowMenu";
import { sameDay } from "../utils/date";

export interface DayGroup {
  id: string;
  date: Date;
  /** "Do 08.10." */
  label: string;
  /** already in display order (due time, then title) */
  tasks: TaskRowData[];
}

export interface TaskListByDayProps {
  /** pinned section 1 — overdue tasks (the section is not shown at all when there are none) */
  overdue: TaskRowData[] | null;
  /** pinned section 2 — tasks without a due date; null = hidden */
  noDue: TaskRowData[] | null;
  /** every day of the period, oldest → newest */
  days: DayGroup[];
  today: Date;
  onOpen?: (task: TaskRowData) => void;
  /** three-dot menu of a row */
  onAction?: (action: TaskAction, task: TaskRowData) => void;
}

const ROWS_CARD = "overflow-x-auto bg-sp-surface-raised rounded-[var(--sp-radius-3x)]";

/** List view grouped by day — pinned sections "Überfällig" and "Ohne Fälligkeit" first, then the days oldest → newest.
    · day header: label (Roboto Medium) · "HEUTE" Badge Notification on today · count = neutral Badge Chip (full number of the day)
    · only days that have tasks are shown (no empty days, no "Keine Aufgaben")
    · all days of the period are listed in order, from the first selected day to the last (no folding of past days)
    · every task of a day is listed (no "load more" — the page scrolls)
    Cards = SP3 "Card" Filled (surface/raised, radius 3x); empty pinned sections use the SP3 Empty State (Small). */
export function TaskListByDay({ overdue, noDue, days, today, onOpen, onAction }: TaskListByDayProps) {
  // days without tasks are never shown (filters / search leave only what has data)
  const filled = days.filter((d) => d.tasks.length);

  const Header = ({ children, tone = "default", count, badge }: { children: ReactNode; tone?: "default" | "error"; count: number; badge?: string }) => (
    <h3 className="flex items-center gap-[var(--sp-space-2x)] m-0 px-[var(--sp-space-1x)]">
      <span className={`sp-text-medium ${tone === "error" ? "text-sp-danger-on-surface" : "text-sp-text-title"}`}>{children}</span>
      {badge && (
        <span className="inline-flex items-center h-5 px-[var(--tms-space-6px)] rounded-[var(--sp-radius-2x)] bg-sp-brand-fill-normal border border-solid border-sp-brand-border-dark sp-text-small-medium text-sp-brand-on-normal">{badge}</span>
      )}
      <StatusChip tone={tone} label={String(count)} />
    </h3>
  );

  const rowsOf = (tasks: TaskRowData[]) => (
    <div className="min-w-[1000px]">
      {tasks.map((t, i) => (
        <Fragment key={t.id}>
          {i > 0 && <hr className="m-0 mx-[var(--sp-space-4x)] border-0 border-t border-solid border-sp-neutral-fill-light" />}
          <TaskRow task={t} onOpen={() => onOpen?.(t)} onAction={onAction && ((a) => onAction(a, t))} />
        </Fragment>
      ))}
    </div>
  );

  const pinned = (title: string, tone: "default" | "error", tasks: TaskRowData[], emptyTitle: string, icon: "check" | "cal") => (
    <section aria-label={title} className="flex flex-col gap-[var(--sp-space-2x)]">
      <Header tone={tone} count={tasks.length}>{title}</Header>
      <div className={ROWS_CARD}>
        {tasks.length ? rowsOf(tasks) : <div className="flex justify-center py-[var(--sp-space-2x)]"><EmptyState icon={icon} title={emptyTitle} /></div>}
      </div>
    </section>
  );

  const day = (d: DayGroup) => {
    return (
      <section key={d.id} aria-label={d.label} className="flex flex-col gap-[var(--sp-space-2x)]">
        <Header count={d.tasks.length} badge={sameDay(d.date, today) ? "HEUTE" : undefined}>{d.label}</Header>
        <div className={ROWS_CARD}>
          {rowsOf(d.tasks)}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-[var(--sp-space-4x)]">
      {!!overdue?.length && pinned("Überfällig", "error", overdue, "Keine überfälligen Aufgaben", "check")}
      {!!noDue?.length && pinned("Ohne Fälligkeit", "default", noDue, "Keine Aufgaben ohne Fälligkeit", "cal")}

      {filled.map(day)}
    </div>
  );
}
