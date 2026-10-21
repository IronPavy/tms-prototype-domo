import { TONES, cssVar, type Tone } from "../utils/tones";

export interface ProgressBarProps {
  value: number;
  max: number;
  /** fill colour — omit for the library default (primary/standard); a tone uses its accent */
  tone?: Tone;
  /** optional label above the bar (library "Label", Roboto Small · text font/label) */
  label?: string;
  className?: string;
}

/** Sophi's Pet "Progress Bar" (21744:2489): 6px track basics/slider-background ·
    fill primary/standard · radius circular · optional Small label above (gap 4). */
export function ProgressBar({ value, max, tone, label, className = "" }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <span className={`flex flex-col gap-[var(--sp-space-1x)] ${className}`}>
      {label && <span className="sp-text-small text-sp-text-label">{label}</span>}
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label ?? `${value} of ${max}`}
        className="relative block h-1.5 w-full overflow-hidden rounded-[var(--sp-radius-pill)] bg-sp-border-line"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-[var(--sp-radius-pill)] transition-[width] duration-300"
          style={{ width: `${pct}%`, background: tone ? cssVar(TONES[tone].accent) : "var(--sp-brand-fill-normal)" }}
        />
      </span>
    </span>
  );
}
