import { Icon } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { TONES, cssVar } from "../utils/tones";

export type SubmissionResult = "ok" | "deviation";

export interface SubmissionRowProps {
  /** form name */
  title: string;
  person: string;
  /** "Today 07:42" */
  when: string;
  result: SubmissionResult;
  onOpen?: () => void;
}

const RESULT = {
  ok:        { tile: "info",  chip: "success", label: "OK" },
  deviation: { tile: "error", chip: "error",   label: "Deviation" },
} as const;

/** Latest form submission: form icon tile (info tone; error tone on deviation) · form name (Standard Medium)
    · "Person · time" (Small, text font/label) · library Status Chip OK (success) / Deviation (error). */
export function SubmissionRow({ title, person, when, result, onOpen }: SubmissionRowProps) {
  const r = RESULT[result];
  const t = TONES[r.tile];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className="flex items-center gap-[var(--sp-space-3x)] px-[var(--sp-space-2x)] py-[var(--sp-space-3x)] rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      <span className="flex items-center justify-center shrink-0 size-8 rounded-[var(--sp-radius-2x)]" style={{ background: cssVar(t.bg) }}>
        <Icon name="form" color={cssVar(t.fg)} />
      </span>
      <span className="flex flex-col gap-[var(--sp-space-2x)] flex-1 min-w-0">
        <span className="sp-text-medium text-sp-text truncate">{title}</span>
        <span className="sp-text-small text-sp-text-label truncate">{person} · {when}</span>
      </span>
      <StatusChip tone={r.chip} label={r.label} />
    </div>
  );
}
