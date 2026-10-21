import { Icon, type IconName } from "../atoms/Icon";
import { TONES, cssVar, type Tone } from "../utils/tones";

export interface DueDateChipProps {
  /** "08.10." */
  date: string;
  /** "06:30" */
  time: string;
  /** colour variant — the task list passes the status tone */
  tone?: Tone;
  /** leading icon (default calendar) — the task list passes the status icon */
  icon?: IconName;
  /** late: red text + red icon */
  late?: boolean;
  /** optional list icon + count (as on the first Task Card) */
  subtaskCount?: number;
}

/** Due-date pill — the "DateChip" of the first Task Card rebuilt as a Sophi's Pet 3 "Badge Chip" (39:5407) with icon:
    <variant>/fill/light + 1px <variant>/border/light · radius 2x · padding 2 / 6 · gap 1x ·
    calendar icon in <variant>/on/surface · "08.10., 06:30" in Roboto Small Medium (on/light) · optional subtask count. */
export function DueDateChip({ date, time, tone = "default", icon = "cal", late, subtaskCount }: DueDateChipProps) {
  const t = TONES[tone];
  return (
    <span
      aria-label={`Fällig ${date}, ${time}${subtaskCount !== undefined ? `, ${subtaskCount} Unteraufgaben` : ""}`}
      className={`inline-flex items-center self-start shrink-0 h-5 py-[var(--tms-space-2px)] px-[var(--tms-space-6px)] gap-[var(--sp-space-1x)] border border-solid rounded-[var(--sp-radius-2x)] sp-text-small-medium ${late ? "text-sp-danger-on-surface" : "text-sp-text"} tabular-nums whitespace-nowrap`}
      style={{ background: cssVar(t.bg), borderColor: cssVar(t.border) }}
    >
      <Icon name={icon} color={late ? "var(--sp-danger-on-surface)" : cssVar(t.fg)} />
      {date}, {time}
      {subtaskCount !== undefined && (
        <>
          <Icon name="unordered_list" color={cssVar(t.fg)} />
          {subtaskCount}
        </>
      )}
    </span>
  );
}
