import { useRef, useState } from "react";
import { Tooltip } from "../atoms/Tooltip";

export interface TextHintProps {
  text: string;
  /** cut after this many characters with "…" (the full text is the tooltip) */
  max?: number;
  className?: string;
}

/** One-line text that ends with "…" when it does not fit (or is longer than `max`) and then shows the full text
    as an SP3 Tooltip on hover — the tooltip is positioned `fixed` from the text's rect so clipping rows never cut it. */
export function TextHint({ text, max, className = "" }: TextHintProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const shown = max && text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
  const show = () => {
    const el = ref.current;
    if (!el) return;
    if (shown === text && el.scrollWidth <= el.clientWidth) return;
    const r = el.getBoundingClientRect();
    setPos({ x: r.left + Math.min(r.width, 160) / 2, y: r.top });
  };
  return (
    <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)} className={`block min-w-0 truncate ${className}`}>
      {shown}
      {pos && (
        <span className="fixed z-50 -translate-x-1/2 -translate-y-full" style={{ left: pos.x, top: pos.y - 4 }}>
          <Tooltip>{text}</Tooltip>
        </span>
      )}
    </span>
  );
}
