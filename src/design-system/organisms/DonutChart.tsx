import { TONES, cssVar, type Tone } from "../utils/tones";

export interface DonutSegment {
  key: string;
  label: string;
  value: number;
  tone: Tone;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  /** big number in the middle, e.g. "21%" */
  centerValue: string;
  /** small line under it, e.g. "13 of 63 done" */
  centerLabel: string;
  /** highlighted segment (others fade) — e.g. the active KPI filter */
  activeKey?: string | null;
  onSegmentClick?: (key: string) => void;
}

const SIZE = 168;
const STROKE = 20;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2; // px gap between segments

/** Donut + legend table. Segment colours = notification accent tokens of each tone (utils/tones),
    empty track = basics/slider-background (library progress bar background).
    Centre: Title/H1 value + Roboto Small label.
    Legend rows (32px, Menu-List-like hover): swatch · label (Standard) · count (Medium) · share (Small, label colour). */
export function DonutChart({ segments, centerValue, centerLabel, activeKey, onSegmentClick }: DonutChartProps) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  let offset = 0;
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-[var(--sp-space-8x)] gap-y-[var(--sp-space-6x)]">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--sp-border-line)" strokeWidth={STROKE} />
          {total > 0 && visible.map((s) => {
            const len = (s.value / total) * C;
            const dash = Math.max(len - (visible.length > 1 ? GAP : 0), 0.001);
            const el = (
              <circle
                key={s.key}
                cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
                stroke={cssVar(TONES[s.tone].accent)}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                opacity={activeKey && activeKey !== s.key ? 0.25 : 1}
                className={`transition-opacity duration-150 ${onSegmentClick ? "cursor-pointer" : ""}`}
                onClick={() => onSegmentClick?.(s.key)}
              >
                <title>{`${s.label}: ${s.value} (${Math.round((s.value / total) * 100)}%)`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[var(--sp-space-1x)] pointer-events-none">
          <span className="sp-title-h1 text-sp-text">{centerValue}</span>
          <span className="sp-text-small text-sp-text-label">{centerLabel}</span>
        </div>
      </div>

      <ul className="m-0 p-0 list-none flex flex-col gap-[var(--sp-space-1x)] flex-1 min-w-[220px] max-w-[320px]">
        {segments.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => onSegmentClick?.(s.key)}
              aria-pressed={activeKey === s.key}
              className={`grid grid-cols-[auto_1fr_auto_3rem] items-center gap-[var(--sp-space-3x)] w-full h-8 px-[var(--sp-space-2x)] border-0 rounded-[var(--sp-radius-2x)] text-left cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)] transition-opacity ${activeKey === s.key ? "bg-sp-selected" : "bg-transparent"} ${activeKey && activeKey !== s.key ? "opacity-50" : ""}`}
            >
              <span className="size-3 rounded-[var(--sp-radius-1x)]" style={{ background: cssVar(TONES[s.tone].accent) }} />
              <span className="sp-text-standard text-sp-text truncate">{s.label}</span>
              <span className="sp-text-medium text-sp-text text-right">{s.value}</span>
              <span className="sp-text-small text-sp-text-label text-right">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
