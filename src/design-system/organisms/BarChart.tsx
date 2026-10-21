import { useState } from "react";
import { Tooltip } from "../atoms/Tooltip";

export interface BarDatum {
  key: string;
  /** axis label, e.g. "Mo" / "KW 41" / "Oct" */
  label: string;
  /** second axis line, e.g. "05.10." */
  sublabel?: string;
  done: number;
  total: number;
  /** highlight (e.g. today) */
  current?: boolean;
  /** upcoming bucket — `total` = planned tasks (dashed bar); a dash when nothing is planned */
  future?: boolean;
}

export interface BarChartProps {
  data: BarDatum[];
  /** small heading left of the legend, e.g. "Done per day" */
  title?: string;
  /** chart area height in px */
  height?: number;
}

const Swatch = ({ className }: { className: string }) => <span className={`size-3 shrink-0 rounded-[var(--sp-radius-1x)] ${className}`} />;

/** Round the axis maximum up to a "nice" whole number (1 · 2 · 5 · 10 × 10ⁿ per step), 4 steps. */
function niceScale(max: number, steps = 4) {
  const raw = Math.max(1, max) / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? Math.ceil(raw));
  return { top: step * steps, ticks: Array.from({ length: steps + 1 }, (_, i) => step * (steps - i)) };
}

/** Stacked bars: done (notification/success/accent) on top of not-done (basics/slider-background);
    upcoming buckets = planned workload as a dashed bar (basics/hover + dashed basics/icons stroke).
    Left y-axis with nice ticks + dashed grid (basics/lines-and-borders), so values read without hovering.
    Hover / keyboard focus on a bar → library Tooltip (Position=top) with the exact numbers.
    Axis labels Roboto Small in text font/label; the current bucket in Small Medium + text font/primary. */
export function BarChart({ data, title, height = 168 }: BarChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const { top, ticks } = niceScale(Math.max(0, ...data.map((d) => d.total)));
  const dense = data.length > 12;
  const gap = data.length <= 12 ? "gap-[var(--sp-space-3x)]" : "gap-[var(--sp-space-1x)]";
  const y = (v: number) => `${(1 - v / top) * 100}%`;

  const legend = (
    <div className="flex flex-wrap items-center gap-x-[var(--sp-space-4x)] gap-y-[var(--sp-space-1x)] sp-text-small text-sp-text-label">
      <span className="flex items-center gap-[var(--sp-space-1x)]"><Swatch className="bg-sp-success-fill-normal" />Done</span>
      <span className="flex items-center gap-[var(--sp-space-1x)]"><Swatch className="bg-sp-border-line" />Not done</span>
      {data.some((d) => d.future && d.total > 0) && (
        <span className="flex items-center gap-[var(--sp-space-1x)]"><Swatch className="bg-sp-hover border border-dashed border-sp-icon" />Planned</span>
      )}
      {data.some((d) => d.current) && (
        <span className="flex items-center gap-[var(--sp-space-1x)]"><Swatch className="outline-2 outline-solid outline-sp-brand-fill-normal" />Today</span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-[var(--sp-space-4x)]">
      <div className="flex flex-wrap items-center justify-between gap-[var(--sp-space-2x)]">
        {title && <span className="sp-text-medium text-sp-text">{title}</span>}
        {legend}
      </div>

      <div className="flex gap-[var(--sp-space-2x)]">
        {/* Y axis */}
        <div className="relative shrink-0 w-7" style={{ height }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 sp-text-small text-sp-text-label tabular-nums" style={{ top: y(t) }}>
              {t}
            </span>
          ))}
        </div>

        <div className="flex flex-col flex-1 min-w-0 gap-[var(--sp-space-2x)]">
          {/* Plot */}
          <div className={`relative flex items-end ${gap}`} style={{ height }} onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <span
                key={t}
                aria-hidden
                className={`absolute inset-x-0 border-0 border-t border-sp-border-line ${t === 0 ? "border-solid" : "border-dashed"}`}
                style={{ top: y(t) }}
              />
            ))}

            {data.map((d, i) => {
              const barH = (d.total / top) * 100;
              const doneShare = d.total ? (d.done / d.total) * 100 : 0;
              const active = hover === i;
              const summary = d.future
                ? `${d.label} ${d.sublabel ?? ""}: ${d.total} planned`
                : `${d.label} ${d.sublabel ?? ""}: ${d.done} of ${d.total} done`;
              return (
                <div
                  key={d.key}
                  tabIndex={0}
                  role="img"
                  aria-label={summary}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="relative flex flex-1 min-w-0 h-full items-end justify-center outline-none rounded-[var(--sp-radius-1x)] focus-visible:shadow-[var(--sp-focus-brand)]"
                >
                  {d.future && d.total > 0 ? (
                    <span
                      className={`w-full max-w-12 rounded-t-[var(--sp-radius-1x)] bg-sp-hover border border-b-0 border-dashed border-sp-icon ${active ? "brightness-95" : ""}`}
                      style={{ height: `${barH}%` }}
                    />
                  ) : d.future ? (
                    <span className="mb-1 sp-text-small text-sp-text-placeholder">–</span>
                  ) : d.total === 0 ? (
                    <span className="w-full max-w-12 h-0.5 bg-sp-border-line rounded-[var(--sp-radius-1x)]" />
                  ) : (
                    <span
                      className={`flex flex-col justify-end w-full max-w-12 overflow-hidden rounded-t-[var(--sp-radius-1x)] bg-sp-border-line ${active ? "brightness-95" : ""} ${d.current ? "outline-2 outline-offset-1 outline-solid outline-sp-brand-fill-normal" : ""}`}
                      style={{ height: `${barH}%` }}
                    >
                      <span className="w-full bg-sp-success-fill-normal" style={{ height: `${doneShare}%` }} />
                    </span>
                  )}

                  {/* Library tooltip, tail pointing at the top of the bar */}
                  {active && (
                    <Tooltip
                      align={i === 0 ? "start" : i === data.length - 1 ? "end" : "center"}
                      className={`absolute z-10 ${i === 0 ? "left-1/2 -translate-x-[23px]" : i === data.length - 1 ? "right-1/2 translate-x-[23px]" : "left-1/2 -translate-x-1/2"}`}
                      style={{ bottom: `calc(${barH}% + var(--sp-space-1x))` }}
                    >
                      <span className="flex flex-col gap-[var(--sp-space-1x)]">
                        <span className="sp-text-medium">{d.label}{d.sublabel ? ` · ${d.sublabel}` : ""}</span>
                        {d.future ? (
                          <span>Planned: {d.total}</span>
                        ) : (
                          <>
                            <span>Done: {d.done} of {d.total}</span>
                            <span>Not done: {d.total - d.done}</span>
                            <span className="sp-text-small">{d.total ? Math.round((d.done / d.total) * 100) : 0}% completed</span>
                          </>
                        )}
                      </span>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>

          {/* X axis */}
          <div className={`flex ${gap}`}>
            {data.map((d, i) => {
              const show = !dense || i % Math.ceil(data.length / 8) === 0 || d.current;
              return (
                <div key={d.key} className="flex flex-col items-center flex-1 min-w-0 gap-0.5 text-center">
                  <span className={`sp-text-small truncate max-w-full ${d.current ? "font-medium text-sp-text-link" : "text-sp-text-label"} ${show ? "" : "invisible"}`}>{d.label}</span>
                  {!dense && d.sublabel && <span className="sp-text-extra-small text-sp-text-placeholder truncate max-w-full">{d.sublabel}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
