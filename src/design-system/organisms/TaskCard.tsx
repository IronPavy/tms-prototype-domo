import { Icon, type IconName } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { DueDateChip } from "../molecules/DueDateChip";
import { IconHint } from "../molecules/IconHint";
import { PriorityIndicator } from "../molecules/PriorityIndicator";
import { TASK_STATUS, type TaskRowData } from "../molecules/TaskRow";

/** solution type → Sophis icon (top-right of the card) */
const SOLUTION: Record<TaskRowData["proof"], { label: string; icon: IconName }> = {
  form: { label: "Form", icon: "form" },
  photo: { label: "Camera", icon: "camera" },
  attachment: { label: "Attachment", icon: "attachment" },
  check: { label: "Check", icon: "check_circle" },
};

export interface TaskCardProps {
  task: TaskRowData;
  selected?: boolean;
  onSelect?: () => void;
  onMenu?: () => void;
}

/** Task card for the Cards view — structure of the first Task Card (reference project "TaskCard"), rebuilt on Sophi's Pet 3:
    · header: "Assigned to:" Small label + name Small Medium
    · title Title/H3 in text title + PriorityIndicator
    · DueDateChip (status colour, subtask count) — the old DateChip — + schedule icon (repeat = recurring, cal_1 = one-time)
      whose Tooltip shows "Daily 15:00" / "Weekly · Mon 22:30" / "One-time"
    · footer (old MetaRow): user icon + creator · clock icon + created "12.12.24, 17:15 Uhr" — Roboto Small in text subtitle,
      icons in icon colour; wraps the timestamp onto a second line when narrow
    · solution type icon top-right (form · camera · attachment · check_circle, 16px brand/on/surface, Tooltip "Solution: …");
      tasks with subtasks show no icon (their solution is per subtask)
    · "more_vert" menu button pinned bottom-right.
    Card = SP3 "Card" (497:3227) Filled, Outlined, Interactive: surface/raised · 1px border (line) · radius 3x ·
    padding 4x / 5x · hover Shadow M + overlay · selected = selected background + brand/border/normal. */
export function TaskCard({ task, selected, onSelect, onMenu }: TaskCardProps) {
  const st = TASK_STATUS[task.status];

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${task.title} — ${st.label}`}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(); } }}
      className={`flex gap-[var(--sp-space-2x)] min-w-0 py-[var(--sp-space-4x)] px-[var(--sp-space-5x)] border border-solid rounded-[var(--sp-radius-3x)] cursor-pointer outline-none sp-interactive transition-shadow duration-150 hover:shadow-[var(--sp-shadow-m)] focus-visible:shadow-[var(--sp-focus-brand)] ${
        selected ? "bg-sp-selected border-sp-brand-border-normal" : "bg-sp-surface-raised border-sp-border-line"
      }`}
    >
      <div className="flex flex-col flex-1 min-w-0">
        {/* header: assigned to */}
        <div className="sp-text-small text-sp-text-label truncate">
          Assigned to: <span className="sp-text-small-medium text-sp-text">{task.person}</span>
        </div>

        {/* title + priority */}
        <div className="flex items-center gap-[var(--sp-space-2x)] mt-[var(--sp-space-2x)] min-w-0">
          <h4 className="m-0 sp-title-h3 text-sp-text-title truncate">{task.title}</h4>
          {task.high && <PriorityIndicator />}
        </div>

        {/* due date pill (old DateChip) + schedule icon — hover shows "Daily 15:00" / "One-time" */}
        <div className="flex items-center gap-[var(--sp-space-2x)] mt-[var(--sp-space-2x)]">
          {task.noDue ? <StatusChip tone="default" icon="cal" label="Ohne Fälligkeit" /> : <DueDateChip date={task.due.date} time={task.due.time} tone={st.tone} subtaskCount={task.subtasks} />}
          <IconHint label={task.schedule} className="size-5 rounded-[var(--sp-radius-pill)] sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]">
            <Icon name={task.recurring ? "repeat" : "cal_1"} color="var(--sp-icon)" />
          </IconHint>
        </div>

        {/* footer (old MetaRow): creator · created at */}
        {task.createdBy && (
          <div className="flex flex-wrap items-center gap-x-[var(--sp-space-3x)] gap-y-[var(--sp-space-1x)] mt-[var(--sp-space-3x)] min-w-0 sp-text-small text-sp-text-subtitle">
            <span className="flex items-center gap-[var(--sp-space-1x)] min-w-0" title="Created by">
              <Icon name="user" color="var(--sp-icon)" />
              <span className="truncate">{task.createdBy}</span>
            </span>
            {task.createdAt && (
              <span className="flex items-center gap-[var(--sp-space-1x)] shrink-0 whitespace-nowrap" title="Created">
                <Icon name="clock" color="var(--sp-icon)" />
                {task.createdAt}
              </span>
            )}
          </div>
        )}
      </div>

      {/* right column: solution type icon on top (none for tasks with subtasks) · menu trigger at the bottom */}
      <div className="flex flex-col justify-between items-center shrink-0">
        {task.subtasks ? <span aria-hidden /> : (
          <IconHint label={`Solution: ${SOLUTION[task.proof].label}`} className="size-6 rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]">
            <Icon name={SOLUTION[task.proof].icon} color="var(--sp-brand-on-surface)" />
          </IconHint>
        )}
        <button
          type="button"
          aria-label="More actions"
          title="More actions"
          onClick={(e) => { e.stopPropagation(); onMenu?.(); }}
          className="flex items-center justify-center size-6 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
        >
          <Icon name="more_vert" color="var(--sp-icon)" />
        </button>
      </div>
    </article>
  );
}
