import { StatusDot } from "../atoms/StatusDot";

export type ShiftTaskState = "done" | "late" | "upcoming";

export interface ShiftTaskRowProps {
  state: ShiftTaskState;
  /** planned time, "06:30" */
  time: string;
  title: string;
  /** assignee */
  person: string;
  /** completion time when done, "06:34" */
  doneAt?: string;
  onOpen?: () => void;
}

const DOT = {
  done: { tone: "success", label: "Erledigt" },
  late: { tone: "warning", label: "Verspätet" },
  upcoming: { tone: undefined, label: "Anstehend" },
} as const;

/** Task inside a shift group: status dot · time · title · right side
    = "Person · done time" (done) / "Late" in warning text (late) / person (upcoming).
    Hover / press = basics/hover · basics/pressed like the library Menu List Item. */
export function ShiftTaskRow({ state, time, title, person, doneAt, onOpen }: ShiftTaskRowProps) {
  const dot = DOT[state];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className="flex items-center gap-[var(--sp-space-3x)] h-9 px-[var(--sp-space-3x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      <StatusDot tone={dot.tone} label={dot.label} />
      <span className="sp-text-standard text-sp-text tabular-nums w-10 shrink-0">{time}</span>
      <span className="sp-text-standard text-sp-text flex-1 min-w-0 truncate">{title}</span>
      {state === "late" ? (
        <span className="sp-text-small-medium text-sp-warning-on-surface shrink-0" title={person}>Late</span>
      ) : (
        <span className="sp-text-small text-sp-text-placeholder truncate shrink-0 max-w-[45%]">
          {person}{state === "done" && doneAt ? ` · ${doneAt}` : ""}
        </span>
      )}
    </div>
  );
}
