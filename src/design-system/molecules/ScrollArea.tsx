import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  /** classes for the scrolling content box (padding etc.) */
  contentClassName?: string;
  /** accessible name of the scroll region */
  label?: string;
}

const MIN_THUMB = 24;

/** Vertical scroll container with Sophi's Pet "Scrollbar" (2303:4485) drawn as an overlay
    (native scrollbar hidden, so expanding on hover never shifts the content):
    normal  — track 8px  basics/scrollbar @20%, thumb 6px  @50%, radius 3
    hover   — track 20px,                        thumb 12px @65%, radius 6
    pressed — thumb @80%. Drag the thumb, click the track to jump a page, or wheel/keyboard scroll. */
export function ScrollArea({ children, className = "", contentClassName = "", label }: ScrollAreaProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ size: 0, offset: 0, visible: false });
  const [state, setState] = useState<"normal" | "hover" | "pressed">("normal");
  const drag = useRef<{ startY: number; startScroll: number } | null>(null);

  const measure = useCallback(() => {
    const v = viewport.current, t = track.current;
    if (!v || !t) return;
    const { scrollHeight, clientHeight, scrollTop } = v;
    const visible = scrollHeight > clientHeight + 1;
    const trackH = t.clientHeight;
    const size = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * trackH);
    const offset = visible ? (scrollTop / (scrollHeight - clientHeight)) * (trackH - size) : 0;
    setThumb({ size, offset, visible });
  }, []);

  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(v);
    Array.from(v.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [measure, children]);

  const onThumbDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startScroll: viewport.current!.scrollTop };
    setState("pressed");
  };
  const onThumbMove = (e: React.PointerEvent) => {
    const v = viewport.current, t = track.current;
    if (!drag.current || !v || !t) return;
    const ratio = (v.scrollHeight - v.clientHeight) / (t.clientHeight - thumb.size);
    v.scrollTop = drag.current.startScroll + (e.clientY - drag.current.startY) * ratio;
  };
  // on release, fall back to hover only if the pointer is still over the scrollbar
  const onThumbUp = () => {
    drag.current = null;
    setState(track.current?.matches(":hover") ? "hover" : "normal");
  };

  const onTrackDown = (e: React.PointerEvent) => {
    const v = viewport.current;
    if (!v) return;
    const above = e.nativeEvent.offsetY < thumb.offset;
    v.scrollBy({ top: (above ? -1 : 1) * v.clientHeight * 0.9, behavior: "smooth" });
  };

  const wide = state !== "normal";

  return (
    <div className={`relative min-h-0 ${className}`}>
      <div
        ref={viewport}
        onScroll={measure}
        tabIndex={0}
        role="region"
        aria-label={label}
        className={`h-full max-h-[inherit] overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:shadow-[var(--sp-focus-brand)] ${contentClassName}`}
      >
        {children}
      </div>

      <div
        ref={track}
        aria-hidden
        onPointerEnter={() => setState((s) => (s === "pressed" ? s : "hover"))}
        onPointerLeave={() => setState((s) => (s === "pressed" ? s : "normal"))}
        onPointerDown={onTrackDown}
        className={`absolute top-0 right-0 bottom-0 transition-[width] duration-100 ${thumb.visible ? "" : "invisible"}`}
        style={{ width: wide ? 20 : 8 }}
      >
        <span className="absolute inset-0 bg-sp-text-subtitle opacity-20" />
        <span
          onPointerDown={onThumbDown}
          onPointerMove={onThumbMove}
          onPointerUp={onThumbUp}
          onPointerCancel={onThumbUp}
          className="absolute left-1/2 -translate-x-1/2 bg-sp-text-subtitle cursor-pointer transition-[width,opacity] duration-100"
          style={{
            top: thumb.offset,
            height: thumb.size,
            width: wide ? 12 : 6,
            borderRadius: wide ? 6 : 3,
            opacity: state === "pressed" ? 0.8 : state === "hover" ? 0.65 : 0.5,
          }}
        />
      </div>
    </div>
  );
}
