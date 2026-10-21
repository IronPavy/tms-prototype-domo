import { useState } from "react";
import { StatusChip } from "../atoms/StatusChip";
import { EmptyTasks } from "../molecules/EmptyTasks";
import { TaskCard } from "./TaskCard";
import type { TaskRowData } from "../molecules/TaskRow";
import type { TaskGroup } from "./TaskList";

export interface TaskCardGridProps {
  groups: TaskGroup[];
  /** a card was clicked */
  onOpen?: (task: TaskRowData) => void;
  emptyText?: string;
}

/** Cards view — the same day groups as TaskList (header: label · TODAY badge · count), cards in a responsive grid
    (max 4 per row, min 300px per card, gap 4x). One card can be selected at a time. */
export function TaskCardGrid({ groups, onOpen, emptyText = "No tasks match the current filters." }: TaskCardGridProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const visible = groups.filter((g) => g.tasks.length);
  if (!visible.length) {
    return (
      <div className="flex justify-center py-[var(--sp-space-6x)]">
        <EmptyTasks />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-[var(--sp-space-6x)]">
      {visible.map((g) => (
        <section key={g.id} aria-label={g.label} className="flex flex-col gap-[var(--sp-space-2x)]">
          <h3 className="flex items-center gap-[var(--sp-space-2x)] m-0 px-[var(--sp-space-1x)]">
            <span className={`sp-text-medium ${g.kind === "overdue" ? "text-sp-danger-on-surface" : "text-sp-text-title"}`}>{g.label}</span>
            {g.kind === "today" && (
              <span className="inline-flex items-center h-5 px-[var(--tms-space-6px)] rounded-[var(--sp-radius-2x)] bg-sp-brand-fill-normal border border-solid border-sp-brand-border-dark sp-text-small-medium text-sp-brand-on-normal">HEUTE</span>
            )}
            <StatusChip tone={g.kind === "overdue" ? "error" : "default"} label={String(g.tasks.length)} />
          </h3>
          {/* at most 4 per row (column min = a quarter of the row), never narrower than 300px — wraps to 3 / 2 / 1 */}
          <div
            className="grid gap-[var(--sp-space-4x)]"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, max(300px, calc((100% - 3 * var(--sp-space-4x)) / 4))), 1fr))" }}
          >
            {g.tasks.map((t) => (
              <TaskCard key={t.id} task={t} selected={selected === t.id} onSelect={() => { setSelected(t.id); onOpen?.(t); }} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
