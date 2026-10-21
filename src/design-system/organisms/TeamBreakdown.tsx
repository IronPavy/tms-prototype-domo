import { useState } from "react";
import { Tooltip } from "../atoms/Tooltip";
import { TONES, cssVar, type Tone } from "../utils/tones";

export interface TeamSegmentDef { key: string; label: string; tone: Tone }

export interface TeamRow {
  id: string;
  team: string;
  /** count per segment key, e.g. { done: 9, open: 2, overdue: 1 } */
  counts: Record<string, number>;
}

export interface TeamBreakdownProps {
  rows: TeamRow[];
  /** stacking order + colours; the first one is "done" and drives the % */
  segments: TeamSegmentDef[];
  /** highlighted segment (shared dashboard filter) — the others fade */
  activeKey?: string | null;
  /** legend / segment click */
  onSegmentClick?: (key: string) => void;
}

/** Share done per team. Legend on top (same toggle rows as the DonutChart legend: hover basics/hover,
    selected basics/selected) · per team: name (Standard Medium) + "n of total done" (Small, text font/label),
    stacked 10px bar (segments = tone accents, radius circular, 2px gaps) and % done (Large Medium).
    Hover a segment → library Tooltip; with `activeKey` the other segments fade like the donut. */
export function TeamBreakdown({ rows, segments, activeKey, onSegmentClick }: TeamBreakdownProps) {
  const [hover, setHover] = useState<{ row: string; seg: string; x: number } | null>(null);
  const doneKey = segments[0].key;

  return (
    <div className="flex flex-col gap-[var(--sp-space-4x)]">
      {/* legend = filter toggles */}
      <div className="flex flex-wrap gap-[var(--sp-space-1x)] -mx-[var(--sp-space-2x)]">
        {segments.map((s) => {
          const n = rows.reduce((sum, r) => sum + (r.counts[s.key] ?? 0), 0);
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={activeKey === s.key}
              onClick={() => onSegmentClick?.(s.key)}
              className={`flex items-center gap-[var(--sp-space-2x)] h-7 px-[var(--sp-space-2x)] border-0 rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)] transition-opacity ${activeKey === s.key ? "bg-sp-selected" : "bg-transparent"} ${activeKey && activeKey !== s.key ? "opacity-50" : ""}`}
            >
              <span className="size-3 shrink-0 rounded-[var(--sp-radius-1x)]" style={{ background: cssVar(TONES[s.tone].accent) }} />
              <span className="sp-text-small text-sp-text">{s.label}</span>
              <span className="sp-text-small-medium text-sp-text-label tabular-nums">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col">
        {rows.map((r, i) => {
          const total = segments.reduce((sum, s) => sum + (r.counts[s.key] ?? 0), 0);
          const done = r.counts[doneKey] ?? 0;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const visible = segments.filter((s) => (r.counts[s.key] ?? 0) > 0);
          let start = 0;
          return (
            <div
              key={r.id}
              className={`grid grid-cols-[minmax(96px,28%)_1fr_3rem] items-center gap-[var(--sp-space-4x)] py-[var(--sp-space-3x)] ${i > 0 ? "border-0 border-t border-solid border-sp-border-line" : ""}`}
            >
              <span className="flex flex-col gap-[var(--sp-space-1x)] min-w-0">
                <span className="sp-text-medium text-sp-text truncate">{r.team}</span>
                <span className="sp-text-small text-sp-text-label truncate">
                  {done} of {total} done
                  {activeKey && activeKey !== doneKey && ` · ${r.counts[activeKey] ?? 0} ${segments.find((s) => s.key === activeKey)?.label.toLowerCase()}`}
                </span>
              </span>

              <div
                className="relative"
                role="img"
                aria-label={`${r.team}: ${segments.map((s) => `${s.label} ${r.counts[s.key] ?? 0}`).join(", ")}`}
                onMouseLeave={() => setHover(null)}
              >
                <div className="flex gap-0.5 h-2.5 rounded-[var(--sp-radius-pill)] overflow-hidden bg-sp-border-line">
                  {visible.map((s) => {
                    const n = r.counts[s.key];
                    const w = (n / total) * 100;
                    const x = start + w / 2;
                    start += w;
                    const faded = (activeKey && activeKey !== s.key) || (hover?.row === r.id && hover.seg !== s.key);
                    return (
                      <span
                        key={s.key}
                        onMouseEnter={() => setHover({ row: r.id, seg: s.key, x })}
                        onClick={() => onSegmentClick?.(s.key)}
                        className={`h-full min-w-1 transition-opacity duration-150 ${onSegmentClick ? "cursor-pointer" : ""} ${faded ? "opacity-25" : ""}`}
                        style={{ flex: `${n} 1 0`, background: cssVar(TONES[s.tone].accent) }}
                      />
                    );
                  })}
                </div>
                {hover?.row === r.id && (() => {
                  const s = segments.find((x) => x.key === hover.seg)!;
                  const align = hover.x < 15 ? "start" : hover.x > 85 ? "end" : "center";
                  return (
                    <Tooltip
                      type={s.tone === "error" ? "error" : s.tone === "warning" ? "warning" : "normal"}
                      align={align}
                      className={`absolute bottom-full mb-1 z-10 ${align === "center" ? "-translate-x-1/2" : align === "end" ? "-translate-x-full" : ""}`}
                      style={{ left: `${hover.x}%` }}
                    >
                      {r.team} · {s.label}: {r.counts[s.key]} of {total}
                    </Tooltip>
                  );
                })()}
              </div>

              <span className="sp-text-large-medium text-sp-text tabular-nums text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
