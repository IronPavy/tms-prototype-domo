import type { CSSProperties, ReactNode } from "react";

export type TooltipType = "normal" | "error" | "warning";

/* box + tail colour and text colour per type — SP3 tooltip-background, or the variant fill/normal + on/normal */
const STYLE: Record<TooltipType, { bg: string; fg: string }> = {
  normal: { bg: "var(--sp-tooltip-background)", fg: "var(--sp-brand-on-normal)" },
  error: { bg: "var(--sp-danger-fill-normal)", fg: "var(--sp-danger-on-normal)" },
  warning: { bg: "var(--sp-warning-fill-normal)", fg: "var(--sp-warning-on-normal)" },
};

export interface TooltipProps {
  children: ReactNode;
  type?: TooltipType;
  className?: string;
  /** positioning (e.g. absolute bottom offset) */
  style?: CSSProperties;
  /** where the tail sits under the box — "start"/"end" for anchors near an edge */
  align?: "center" | "start" | "end";
}

/** Sophi's Pet 3 "Tooltip" (507:20447), Position=top: padding 2x / 3x · radius 2x · Roboto Standard/Body Standard ·
    tail 14 × 6 (Tooltip Tail Width/Height), inset 2x from the box edge when aligned start / end.
    normal = tooltip-background + white · coloured (project addition): error = danger fill/normal + on/normal,
    warning = warning fill/normal + on/normal (dark text). */
export function Tooltip({ children, type = "normal", className = "", style, align = "center" }: TooltipProps) {
  const s = STYLE[type];
  return (
    <div role="tooltip" className={`flex flex-col pointer-events-none ${align === "start" ? "items-start" : align === "end" ? "items-end" : "items-center"} ${className}`} style={style}>
      <div
        className="px-[var(--sp-space-3x)] py-[var(--sp-space-2x)] rounded-[var(--sp-radius-2x)] sp-text-body-standard whitespace-nowrap"
        style={{ background: s.bg, color: s.fg }}
      >
        {children}
      </div>
      <span
        aria-hidden
        className={`block w-[var(--sp-space-tooltip-tail-width)] h-[var(--sp-space-tooltip-tail-height)] -mt-px [clip-path:polygon(0_0,100%_0,50%_100%)] ${align === "start" ? "ml-[var(--sp-space-2x)]" : align === "end" ? "mr-[var(--sp-space-2x)]" : ""}`}
        style={{ background: s.bg }}
      />
    </div>
  );
}
