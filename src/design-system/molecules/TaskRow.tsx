import { Avatar } from "../atoms/Avatar";
import { Icon, type IconName } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { DueDateChip } from "./DueDateChip";
import { PriorityIndicator } from "./PriorityIndicator";
import { RowDeleteButton } from "./RowDeleteButton";
import type { TaskAction } from "./TaskRowMenu";
import { TextHint } from "./TextHint";
import { IconHint } from "./IconHint";
import type { Tone } from "../utils/tones";

export type TaskStatus = "done" | "open" | "overdue";
/** solution type — how the task is completed */
export type TaskProof = "check" | "photo" | "attachment";

/** a file the employee attached to a task or subtask (photo or document) */
export interface TaskFile {
  id: string;
  name: string;
  /** bytes */
  size: number;
  kind: "image" | "pdf" | "other";
  url: string;
  /** who attached it + when ("25.10.26, 14:20") */
  by: string;
  at: string;
}

export interface SubtaskItem { id: string; title: string; done?: boolean; /** how it is solved (default check) */ proof?: "check" | "photo" | "attachment"; /** files of a done photo / attachment subtask (one or more) */ files?: TaskFile[] }

export interface TaskRowData {
  id: string;
  title: string;
  high?: boolean;
  /** recurring tasks show the repeat icon before the schedule text */
  recurring?: boolean;
  /** "Daily 06:30" · "Weekly · Mon 22:30" · "One-time" */
  schedule: string;
  tags: string[];
  person: string;
  /** shift / team under the name, "Morning shift · Kitchen" */
  team: string;
  /** location (Cards view header) */
  location?: string;
  /** sub-steps of the task — shown in the DueDateChip on cards */
  subtasks?: number;
  /** the sub-steps themselves (task detail) — `subtasks` is their count */
  subtaskItems?: SubtaskItem[];
  /** creator + creation timestamp ("12.12.24, 17:15 Uhr") — card footer */
  createdBy?: string;
  createdAt?: string;
  /** due date + time → DueDateChip */
  due: { date: string; time: string };
  /** task description (searchable) */
  description?: string;
  /** who completed the task (done tasks, searchable) */
  doneBy?: string;
  /** task without a due date — no chip, never listed under a day (own section "Ohne Fälligkeit") */
  noDue?: boolean;
  /** completion time for done tasks — "done 06:37" under the chip */
  doneAt?: string;
  proof: TaskProof;
  /** Bibliothek entry (template): the detail shows no status / due date */
  library?: boolean;
  /** how often a template repeats */
  frequency?: "daily" | "weekly" | "monthly" | "yearly" | "once";
  /** who the task goes to: a person, a shift (name · group · location) or a whole group */
  receiver?: { kind: "person" | "shift" | "team"; id: string; group: string; locationId: string; /** shift: starting letters + working hours */ code?: string; time?: string };
  /** files the employee attached (attachment / camera tasks) */
  files?: TaskFile[];
  status: TaskStatus;
  comments?: number;
}

/** same labels / icons / tones as the Dashboard KPI cards */
export const TASK_STATUS: Record<TaskStatus, { label: string; icon: IconName; tone: Tone }> = {
  done: { label: "Erledigt", icon: "check", tone: "success" },
  open: { label: "Offen", icon: "folder", tone: "info" },
  overdue: { label: "Überfällig", icon: "warning", tone: "error" },
};

/** solution type → Sophis icon (same set as the task cards) */
export const SOLUTION: Record<TaskProof, { label: string; icon: IconName }> = {
  check: { label: "Abhaken", icon: "check_circle" },
  photo: { label: "Kamera", icon: "camera" },
  attachment: { label: "Anhang", icon: "attachment" },
};

/** grid shared by the rows (and any header) — task · assignee · due · subtasks · solution */
export const TASK_GRID = "grid grid-cols-[minmax(220px,1fr)_minmax(180px,240px)_172px_56px_minmax(24px,120px)_1px_32px] items-center gap-x-[var(--sp-space-4x)]";

export const STATUS_ICON: Record<TaskStatus, IconName> = { done: "check", open: "folder", overdue: "warning" };

/** The due-date pill of a task: status colour + status icon (check · folder · warning) — open = blue, overdue = red, done = green; text is never red;
    tooltip with the status in words (done: "Erledigt am … von …"). Used by the list row and the task detail. */
export function TaskDueChip({ task }: { task: TaskRowData }) {
  const st = TASK_STATUS[task.status];
  const tip = task.status === "done" && task.doneAt && task.doneBy
    ? `Erledigt am ${task.due.date}, ${task.doneAt} von ${task.doneBy}`
    : st.label;
  return (
    <IconHint label={tip} className="rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]">
      <DueDateChip date={task.due.date} time={task.due.time} tone={st.tone} icon={STATUS_ICON[task.status]} />
    </IconHint>
  );
}

/** up to 2 label tags (each cut at 30 characters, full name as tooltip when cut); more → "+N" with all names as tooltip */
export function Tags({ tags }: { tags: string[] }) {
  const cut = (s: string) => (s.length > 30 ? `${s.slice(0, 30).trimEnd()}…` : s);
  const more = tags.slice(2);
  return (
    <>
      {tags.slice(0, 2).map((t) => (
        <span key={t} title={t.length > 30 ? t : undefined} className="inline-flex"><StatusChip tone="default" label={cut(t)} /></span>
      ))}
      {!!more.length && (
        <IconHint label={tags.join(", ")} className="rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]">
          <StatusChip tone="default" label={`+${more.length}`} />
        </IconHint>
      )}
    </>
  );
}

/** One task in the list — Sophi's Pet 3 "Row" (478:2811) built from "Table Cell"s, Density=Default:
    fixed height 76 · padding-inline 4x · rows separated by a light 1px neutral/fill/light line · hover / pressed overlay ·
    overdue = 4px red bar on the left edge.
    Cells: title (Medium, one line, "…" + tooltip) + PriorityIndicator / schedule (repeat icon + Small label) + up to 2 label chips (+N) ·
    Colored Avatar + name (30 characters) / shift or group (Small label) ·
    DueDateChip: status colour + status icon (check · folder · warning), tooltip with the status in words
    (done: "Erledigt am … von …") · subtasks "2/5" with tooltip · solution type icon (20px) with Tooltip. */
export function TaskRow({ task, onOpen, onAction }: { task: TaskRowData; onOpen?: () => void; onAction?: (action: TaskAction) => void }) {
  const st = TASK_STATUS[task.status];
  const sol = SOLUTION[task.proof];
  const subs = task.subtaskItems ?? [];
  const subsDone = subs.filter((s) => s.done).length;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className={`${TASK_GRID} relative h-[76px] px-[var(--sp-space-4x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]`}
    >
      {task.status === "overdue" && <span aria-hidden className="absolute left-0 inset-y-0 w-1 bg-sp-danger-fill-normal" />}

      {/* task */}
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

      {/* assignee */}
      <span className="flex items-center gap-[var(--sp-space-2x)] min-w-0">
        <Avatar name={task.person} />
        <span className="flex flex-col gap-[var(--sp-space-1x)] min-w-0">
          <TextHint text={task.person} max={30} className="sp-text-standard text-sp-text" />
          <TextHint text={task.team} className="sp-text-small text-sp-text-label" />
        </span>
      </span>

      {/* due — pill in the status colour with the status icon; tooltip = status in words */}
      <span className="flex">
        {task.noDue ? (
          <span className="sp-text-standard text-sp-text-placeholder" aria-label="Ohne Fälligkeit">—</span>
        ) : (
          <TaskDueChip task={task} />
        )}
      </span>

      {/* last column, one under another: solution type icon · subtask count "0/4" (left-aligned) */}
      <span className="flex flex-col items-start justify-center gap-[var(--sp-space-1x)]">
        {!subs.length && (
          <IconHint
            label={sol.label}
            className="size-8 rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]"
          >
            <Icon name={sol.icon} size={20} color="var(--sp-icon)" />
          </IconHint>
        )}
        {!!subs.length && (
          <IconHint label={`${subsDone} von ${subs.length} Unteraufgaben erledigt`} className="rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]">
            <span className="sp-text-small text-sp-text-label tabular-nums">{subsDone}/{subs.length}</span>
          </IconHint>
        )}
      </span>

      {/* divider: the delete icon is set apart from the data */}
      <span aria-hidden />
      <span aria-hidden className="w-px h-8 bg-sp-border-line" />

      {/* delete icon (red on hover, tooltip, the host asks for confirmation) */}
      {onAction ? <RowDeleteButton title={task.title} onClick={() => onAction("delete")} /> : <span />}
    </div>
  );
}
