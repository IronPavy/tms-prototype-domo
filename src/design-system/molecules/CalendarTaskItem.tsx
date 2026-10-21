import { Icon } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { IconHint } from "./IconHint";
import { SOLUTION, TASK_STATUS, type TaskRowData } from "./TaskRow";

/** group assignees (no single person) — shown with the user_group icon */
const isGroup = (t: TaskRowData) => /alle mitarbeitende/i.test(t.team);

/** One task in the Calendar view: due time in a Badge Chip coloured by status (clock icon) ·
    solution type as an icon at the right end of that row (tooltip = name; danger on a form deviation; none for tasks with subtasks —
    their type is per subtask) ·
    title Roboto Standard/Medium in text · assignee (person = user icon, group = user_group icon; Small, text label).
    Item = surface/default · radius 2x · padding 3x · gap 2x · hover / pressed overlay · focus = Focus Brand. */
export function CalendarTaskItem({ task, onOpen }: { task: TaskRowData; onOpen?: () => void }) {
  const st = TASK_STATUS[task.status];
  const group = isGroup(task);
  const sol = SOLUTION[task.proof];
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${task.due.time} ${task.title} — ${group ? task.team : task.person} — ${st.label}`}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className="flex flex-col items-start gap-[var(--sp-space-2x)] p-[var(--sp-space-3x)] rounded-[var(--sp-radius-2x)] bg-sp-surface-default cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      <span className="flex items-center justify-between gap-[var(--sp-space-2x)] w-full">
        <span title={st.label} className="flex"><StatusChip tone={st.tone} icon="clock" label={task.noDue ? "Ohne Fälligkeit" : task.due.time} /></span>
        {!task.subtasks && (
          <IconHint
            label={task.deviation ? `${sol.label} · Abweichung` : sol.label}
            type={task.deviation ? "error" : "normal"}
            className="size-6 rounded-[var(--sp-radius-2x)] focus-visible:shadow-[var(--sp-focus-brand)]"
          >
            <Icon name={sol.icon} color={task.deviation ? "var(--sp-danger-on-surface)" : "var(--sp-icon)"} />
          </IconHint>
        )}
      </span>
      <span className="sp-text-medium text-sp-text leading-snug break-words">{task.title}</span>
      <span className="flex items-center gap-[var(--sp-space-1x)] w-full min-w-0 sp-text-small text-sp-text-label">
        <Icon name={group ? "user_group" : "user"} color="var(--sp-icon)" />
        <span className="truncate">{group ? task.team : task.person}</span>
      </span>
    </div>
  );
}
