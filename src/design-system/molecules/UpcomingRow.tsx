import { Icon } from "../atoms/Icon";
import { ProgressBar } from "../atoms/ProgressBar";
import { DateTile } from "./DateTile";

export interface UpcomingRowProps {
  date: Date;
  title: string;
  /** "Kristina Barac · 17:00" / "All staff · 18:00" */
  meta: string;
  /** "One-time", "Weekly", "Monthly" … */
  repeat: string;
  /** recurring tasks get the Sophis "repeat" icon */
  recurring?: boolean;
  /** multi-person task already in progress → library Progress Bar + "n of m done" in the meta line */
  progress?: { done: number; total: number };
  /** same day as the row above → no tile (an empty 40px slot keeps the columns aligned) */
  sameDayAsPrevious?: boolean;
  /** highlight the date tile (next day) */
  highlight?: boolean;
  onOpen?: () => void;
}

/** Upcoming task: DateTile · title (Standard Medium) · meta (Small, text font/label, optional progress)
    · right: recurrence (Small, text font/label; repeat icon in basics/icons when recurring, empty slot when not).
    Hover / press = basics/hover · basics/pressed. */
export function UpcomingRow({ date, title, meta, repeat, recurring, progress, sameDayAsPrevious, highlight, onOpen }: UpcomingRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className="flex items-center gap-[var(--sp-space-3x)] px-[var(--sp-space-2x)] py-[var(--sp-space-2x)] rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      {sameDayAsPrevious ? <span className="w-10 shrink-0" aria-hidden /> : <DateTile date={date} highlight={highlight} />}
      <span className="flex flex-col gap-[var(--sp-space-2x)] flex-1 min-w-0">
        <span className="sp-text-medium text-sp-text truncate">{title}</span>
        <span className="flex items-center gap-[var(--sp-space-2x)] min-w-0">
          {progress && (
            <>
              <ProgressBar value={progress.done} max={progress.total} className="w-12 shrink-0" />
              <span className="sp-text-small-medium text-sp-text tabular-nums shrink-0">{progress.done} of {progress.total} done</span>
              <span className="sp-text-small text-sp-text-label">·</span>
            </>
          )}
          <span className="sp-text-small text-sp-text-label truncate">{meta}</span>
        </span>
      </span>
      <span className="flex items-center justify-end gap-[var(--sp-space-1x)] shrink-0 w-24 sp-text-small text-sp-text-label">
        {recurring && <Icon name="repeat" color="var(--sp-icon)" />}
        {repeat}
      </span>
    </div>
  );
}
