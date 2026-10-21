import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export interface PopoverProps {
  /** element the panel hangs under (the trigger / field) */
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  /** forwarded so the host can treat clicks inside the panel as "inside" */
  panelRef?: RefObject<HTMLDivElement | null>;
  placement?: "bottom-start" | "bottom-end";
  /** panel is exactly as wide as the anchor (minWidth still applies) */
  matchWidth?: boolean;
  /** px */
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** px between anchor and panel */
  offset?: number;
  className?: string;
  role?: string;
  "aria-label"?: string;
  children: ReactNode;
}

const MARGIN = 8;

/** Floating panel for dropdowns: rendered in a portal at `position: fixed` from the anchor's rect (like IconHint's tooltip),
    so a dialog body / scroll area can never clip it or grow a scrollbar because of it. z-70 (above Modal 50, Toast 60).
    Flips above the anchor when there is no room below, stays inside the viewport, follows scroll + resize.
    Sizing: matchWidth / minWidth / maxWidth / maxHeight (the panel scrolls vertically past maxHeight). */
export function Popover({ anchorRef, open, panelRef, placement = "bottom-start", matchWidth, minWidth, maxWidth, maxHeight, offset = 4, className = "", children, ...rest }: PopoverProps) {
  const own = useRef<HTMLDivElement>(null);
  const ref = (panelRef ?? own) as RefObject<HTMLDivElement>;
  const [pos, setPos] = useState<{ left: number; top: number; width?: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      const p = ref.current;
      if (!a || !p) return;
      const width = matchWidth ? a.width : undefined;
      const w = width !== undefined ? Math.max(width, minWidth ?? 0) : p.offsetWidth;
      const h = p.offsetHeight;
      let left = placement === "bottom-end" ? a.right - w : a.left;
      left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, window.innerWidth - w - MARGIN));
      const below = a.bottom + offset;
      const fitsBelow = below + h <= window.innerHeight - MARGIN;
      const fitsAbove = a.top - offset - h >= MARGIN;
      const top = fitsBelow || !fitsAbove ? below : a.top - offset - h;
      setPos((cur) => (cur && cur.left === left && cur.top === top && cur.width === width ? cur : { left, top, width }));
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, anchorRef, ref, placement, matchWidth, minWidth, offset, children]);

  if (!open) return null;
  const style: CSSProperties = {
    position: "fixed", left: pos?.left ?? 0, top: pos?.top ?? 0, width: pos?.width, minWidth, maxWidth, maxHeight,
    visibility: pos ? "visible" : "hidden",
  };
  return createPortal(
    <div ref={ref} style={style} className={`z-[70] ${className}`} {...rest}>{children}</div>,
    document.body,
  );
}
