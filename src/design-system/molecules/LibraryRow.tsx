import { Avatar } from "../atoms/Avatar";
import { Icon, type IconName } from "../atoms/Icon";
import { IconHint } from "./IconHint";
import { PriorityIndicator } from "./PriorityIndicator";
import { ShiftPill } from "./ShiftPill";
import { SOLUTION, Tags, type TaskRowData } from "./TaskRow";
import { TaskRowMenu, type TaskAction } from "./TaskRowMenu";
import { TextHint } from "./TextHint";

/** grid of a Bibliothek row — task (title · repeat icon + schedule + tags) · receiver · solution / subtasks · menu */
export const LIBRARY_GRID = "grid grid-cols-[minmax(240px,1fr)_minmax(300px,360px)_56px_32px] items-center gap-x-[var(--sp-space-4x)]";

const KIND_ICON: Record<"shift" | "team", IconName> = { shift: "user_clock", team: "user_group" };

/** The receiver of a task: person = Avatar + name + "Gruppe · Standort"; shift = tile + shift name + "Gruppe · Standort";
    group = tile + "Gruppe X" + Standort. Used by the Bibliothek row. */
export function Receiver({ task }: { task: TaskRowData }) {
  const r = task.receiver;
  const sub = [r?.kind === "team" ? null : task.team, task.location].filter(Boolean).join(" · ");
  return (
    <span className="flex items-center gap-[var(--sp-space-2x)] min-w-0">
      {r && r.kind !== "person" ? (
        <span className="flex items-center justify-center shrink-0 size-8 rounded-[var(--sp-radius-2x)] bg-sp-neutral-fill-light"><Icon name={KIND_ICON[r.kind]} color="var(--sp-icon)" /></span>
      ) : (
        <Avatar name={task.person} />
      )}
      <span className="flex flex-col gap-[var(--sp-space-1x)] min-w-0">
        <span className="flex items-center gap-[var(--sp-space-2x)] min-w-0">
          <TextHint text={task.person} max={34} className="sp-text-standard text-sp-text" />
          {r?.kind === "shift" && r.code && <ShiftPill code={r.code} />}
          {r?.kind === "shift" && r.time && <span className="shrink-0 sp-text-small text-sp-text-label tabular-nums">{r.time}</span>}
        </span>
        <TextHint text={sub} className="sp-text-small text-sp-text-label" />
      </span>
    </span>
  );
}

/** One template in the Bibliothek (same 76px row as the task list): title + PriorityIndicator / repeat icon + schedule + tags (like the task list) · receiver (shift name,
    group, location) · solution icon / subtask count · three-dot menu with copy · edit · delete. */
export function LibraryRow({ task, onOpen, onAction }: { task: TaskRowData; onOpen?: () => void; onAction?: (a: TaskAction) => void }) {
  const sol = SOLUTION[task.proof];
  const subs = task.subtaskItems ?? [];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className={`${LIBRARY_GRID} relative h-[76px] px-[var(--sp-space-4x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]`}
    >
      <span className="flex flex-col gap-[var(--sp-space-1x)] min-w-0">
        <span className="flex items-center gap-[var(--sp-space-2x)] min-w-0">
          <TextHint text={task.title} className="sp-text-medium text-sp-text" />
          {task.high && <PriorityIndicator />}
        </span>
        <span className="flex items-center gap-[var(--sp-space-2x)] min-w-0">
          <span className="flex items-center gap-[var(--sp-space-1x)] shrink-0 sp-text-small text-sp-text-label">
            {task.recurring && <Icon name="repeat" color="var(--sp-icon)" />}
            {task.schedule}
          </span>
          <Tags tags={task.tags} />
        </span>
      </span>

      <Receiver task={task} />

      <span className="flex flex-col items-start justify-center gap-[var(--sp-space-1x)]">
        {!subs.length ? (
          <IconHint label={sol.label} className="size-8 rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]">
            <Icon name={sol.icon} size={20} color="var(--sp-icon)" />
          </IconHint>
        ) : (
          <span className="sp-text-small text-sp-text-label tabular-nums">{subs.length} Schritte</span>
        )}
      </span>

      {onAction ? <TaskRowMenu task={task} actions={["copy", "edit", "delete"]} onAction={onAction} /> : <span />}
    </div>
  );
}
