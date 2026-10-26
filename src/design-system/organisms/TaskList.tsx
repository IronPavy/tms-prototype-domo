import { Fragment } from "react";
import { StatusChip } from "../atoms/StatusChip";
import { EmptyTasks } from "../molecules/EmptyTasks";
import { TaskRow, type TaskRowData } from "../molecules/TaskRow";
import type { TaskAction } from "../molecules/TaskRowMenu";

export interface TaskGroup {
  id: string;
  /** "Mon 21.09." · "Overdue – still open" */
  label: string;
  /** "overdue" = danger label · "today" = TODAY badge */
  kind?: "overdue" | "today" | "nodue";
  /** the day of a day group (calendar view) */
  date?: Date;
  tasks: TaskRowData[];
}

export interface TaskListProps {
  groups: TaskGroup[];
  onOpen?: (task: TaskRowData) => void;
  onAction?: (action: TaskAction, task: TaskRowData) => void;
  emptyText?: string;
}

/** Task list grouped by day. Group header: label (Roboto Medium, text title; danger on/surface for the overdue group)
    · "TODAY" = Badge Notification (brand/fill/normal + on/normal, Small Medium) · count = neutral Badge Chip.
    Each group = SP3 "Card" Filled, not outlined (surface/raised, radius 3x — no border) holding TaskRows
    separated by a light 1px neutral/fill/light line, inset 4x. Scrolls horizontally inside the card below ~900px. */
export function TaskList({ groups, onOpen, onAction, emptyText = "No tasks match the current filters." }: TaskListProps) {
  const visible = groups.filter((g) => g.tasks.length);
  if (!visible.length) {
    return (
      <div className="flex justify-center py-[var(--sp-space-6x)]">
        <EmptyTasks />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-[var(--sp-space-4x)]">
      {visible.map((g) => (
        <section key={g.id} aria-label={g.label} className="flex flex-col gap-[var(--sp-space-2x)]">
          <h3 className="flex items-center gap-[var(--sp-space-2x)] m-0 px-[var(--sp-space-1x)]">
            <span className={`sp-text-medium ${g.kind === "overdue" ? "text-sp-danger-on-surface" : "text-sp-text-title"}`}>{g.label}</span>
            {g.kind === "today" && (
              <span className="inline-flex items-center h-5 px-[var(--tms-space-6px)] rounded-[var(--sp-radius-2x)] bg-sp-brand-fill-normal border border-solid border-sp-brand-border-dark sp-text-small-medium text-sp-brand-on-normal">HEUTE</span>
            )}
            <StatusChip tone={g.kind === "overdue" ? "error" : "default"} label={String(g.tasks.length)} />
          </h3>
          <div className="overflow-x-auto bg-sp-surface-raised rounded-[var(--sp-radius-3x)]">
            <div className="min-w-[1000px]">
              {g.tasks.map((t, i) => (
                <Fragment key={t.id}>
                  {i > 0 && <hr className="m-0 mx-[var(--sp-space-4x)] border-0 border-t border-solid border-sp-neutral-fill-light" />}
                  <TaskRow task={t} onOpen={() => onOpen?.(t)} onAction={onAction && ((a) => onAction(a, t))} />
                </Fragment>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
