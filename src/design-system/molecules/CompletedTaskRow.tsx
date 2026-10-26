import { Icon } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { TONES, cssVar } from "../utils/tones";
import { SOLUTION, type TaskProof } from "./TaskRow";

export interface CompletedTaskRowProps {
  title: string;
  person: string;
  /** "Heute 07:42" */
  when: string;
  /** how the employee solved it — icon tile + chip */
  proof: TaskProof;
  onOpen?: () => void;
}

/** Recently completed task: success tile with the solution-type icon · task name (Standard Medium) · "Person · time"
    (Small, text label) · Status Chip with the solution type (Abhaken / Anhang / Kamera). */
export function CompletedTaskRow({ title, person, when, proof, onOpen }: CompletedTaskRowProps) {
  const t = TONES.success;
  const sol = SOLUTION[proof];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className="flex items-center gap-[var(--sp-space-3x)] px-[var(--sp-space-2x)] py-[var(--sp-space-3x)] rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      <span className="flex items-center justify-center shrink-0 size-8 rounded-[var(--sp-radius-2x)]" style={{ background: cssVar(t.bg) }}>
        <Icon name={sol.icon} color={cssVar(t.fg)} />
      </span>
      <span className="flex flex-col gap-[var(--sp-space-2x)] flex-1 min-w-0">
        <span className="sp-text-medium text-sp-text truncate">{title}</span>
        <span className="sp-text-small text-sp-text-label truncate">{person} · {when}</span>
      </span>
      <StatusChip tone="default" label={sol.label} />
    </div>
  );
}
