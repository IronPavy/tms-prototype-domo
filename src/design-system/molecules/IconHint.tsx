import { useId, useRef, useState, type ReactNode } from "react";
import { Tooltip, type TooltipType } from "../atoms/Tooltip";

export interface IconHintProps {
  /** tooltip text (also the accessible name) */
  label: string;
  /** tooltip colour */
  type?: TooltipType;
  className?: string;
  children: ReactNode;
}

/** Focusable icon that shows a Sophi's Pet 3 Tooltip above it on hover / keyboard focus.
    The tooltip is positioned `fixed` from the icon's rect, so scrolling / clipping containers never cut it off.
    Clicks don't bubble (the icon sits inside clickable rows / cards). */
export function IconHint({ label, type = "normal", className = "", children }: IconHintProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const id = useId();
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ x: r.left + r.width / 2, y: r.top });
  };
  const hide = () => setPos(null);

  return (
    <span
      ref={ref}
      tabIndex={0}
      role="img"
      aria-label={label}
      aria-describedby={pos ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-center shrink-0 outline-none cursor-default ${className}`}
    >
      {children}
      {pos && (
        <span id={id} className="fixed z-50 -translate-x-1/2 -translate-y-full" style={{ left: pos.x, top: pos.y - 4 }}>
          <Tooltip type={type}>{label}</Tooltip>
        </span>
      )}
    </span>
  );
}
