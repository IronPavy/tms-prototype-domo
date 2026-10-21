import { Avatar } from "../atoms/Avatar";
import { Icon, type IconName } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { DueDateChip } from "./DueDateChip";
import { PriorityIndicator } from "./PriorityIndicator";
import { TextHint } from "./TextHint";
import { IconHint } from "./IconHint";
import type { Tone } from "../utils/tones";

export type TaskStatus = "done" | "open" | "overdue";
/** solution type — how the task is completed */
export type TaskProof = "form" | "check" | "photo" | "attachment";

export interface SubtaskItem { id: string; title: string; done?: boolean }

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
  /** submitted form reported a deviation */
  deviation?: boolean;
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
  form: { label: "Formular", icon: "form" },
  check: { label: "Abhaken", icon: "check_circle" },
  photo: { label: "Kamera", icon: "camera" },
  attachment: { label: "Anhang", icon: "attachment" },
};

/** grid shared by the rows (and any header) — task · assignee · due · subtasks · solution */
export const TASK_GRID = "grid grid-cols-[minmax(220px,1fr)_minmax(160px,200px)_172px_48px_40px] items-center gap-x-[var(--sp-space-4x)]";

const pad = (n: number) => String(n).padStart(2, "0");
/** "08.10.26" + "06:30" / "16:00–17:00" → when the task is due (a range is due at its end); all-day → null */
function dueMoment(due: { date: string; time: string }): Date | null {
  const [d, m, y] = due.date.split(".").map(Number);
  const t = due.time.match(/(\d{2}):(\d{2})\D*$/);
  if (!d || !m || !y || !t) return null;
  return new Date(2000 + y, m - 1, d, Number(t[1]), Number(t[2]));
}
/** late = recurring, still open, due time passed, but the day is not over yet */
export function isLate(task: TaskRowData, now = new Date()) {
  if (task.status !== "open" || !task.recurring || task.noDue) return false;
  const at = dueMoment(task.due);
  return !!at && now > at && at.toDateString() === now.toDateString();
}

const STATUS_ICON: Record<TaskStatus, IconName> = { done: "check", open: "folder", overdue: "warning" };

/** up to 2 label tags (each cut at 30 characters, full name as tooltip when cut); more → "+N" with all names as tooltip */
function Tags({ tags }: { tags: string[] }) {
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
    DueDateChip: status colour + status icon (check · folder · warning), late = red text + clock icon, tooltip with the status in words
    (done: "Erledigt am … von …") · subtasks "2/5" with tooltip · solution type icon (20px) with Tooltip. */
export function TaskRow({ task, onOpen }: { task: TaskRowData; onOpen?: () => void }) {
  const st = TASK_STATUS[task.status];
  const sol = SOLUTION[task.proof];
  const late = isLate(task);
  const subs = task.subtaskItems ?? [];
  const subsDone = subs.filter((s) => s.done).length;
  const statusTip = late
    ? "Verspätet"
    : task.status === "done" && task.doneAt && task.doneBy
      ? `Erledigt am ${task.due.date}, ${task.doneAt} von ${task.doneBy}`
      : st.label;
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

      {/* due — pill in the status colour with the status icon; late = red text + clock; tooltip = status in words */}
      <span className="flex">
        {task.noDue ? (
          <span className="sp-text-standard text-sp-text-placeholder" aria-label="Ohne Fälligkeit">—</span>
        ) : (
          <IconHint label={statusTip} type={late ? "error" : "normal"} className="rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]">
            <DueDateChip date={task.due.date} time={task.due.time} tone={st.tone} icon={late ? "clock" : STATUS_ICON[task.status]} late={late} />
          </IconHint>
        )}
      </span>

      {/* subtasks "2/5" */}
      <span className="flex justify-end">
        {!!subs.length && (
          <IconHint label={`${subsDone} von ${subs.length} Unteraufgaben erledigt`} className="rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]">
            <span className="sp-text-small text-sp-text-label tabular-nums">{subsDone}/{subs.length}</span>
          </IconHint>
        )}
      </span>

      {/* solution type — icon only, name in the tooltip */}
      <span className="flex">
        <IconHint
          label={task.deviation ? `${sol.label} · Abweichung` : sol.label}
          type={task.deviation ? "error" : "normal"}
          className="size-8 rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]"
        >
          <Icon name={sol.icon} size={20} color={task.deviation ? "var(--sp-danger-on-surface)" : "var(--sp-icon)"} />
        </IconHint>
      </span>
    </div>
  );
}
