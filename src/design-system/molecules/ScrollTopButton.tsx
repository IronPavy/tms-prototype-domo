import { useEffect, useState, type RefObject } from "react";
import { Icon } from "../atoms/Icon";

/** nearest ancestor that scrolls */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement ?? null; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

/** Centre of the scrolling content area (for things floating at its bottom) and whether it is scrolled down ~one screen part. */
export function useScrollArea(anchorRef: RefObject<HTMLElement | null>) {
  const [state, setState] = useState<{ show: boolean; left: number }>({ show: false, left: 0 });

  useEffect(() => {
    const host = scrollParent(anchorRef.current);
    if (!host) return;
    const update = () => {
      const r = host.getBoundingClientRect();
      setState({ show: host.scrollTop > 320, left: r.left + r.width / 2 });
    };
    update();
    host.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { host.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [anchorRef]);
  return state;
}

/** Floating "Nach oben" pill, centred at the bottom of the scrolling content area. Appears after scrolling down
    ~one screen part, scrolls the page smoothly to the top and hides again. `anchorRef` = any element inside the scrolling area.
    `raised` lifts it above a floating action bar at the bottom (e.g. the selection bar of the task list). */
export function ScrollTopButton({ anchorRef, raised }: { anchorRef: RefObject<HTMLElement | null>; raised?: boolean }) {
  const state = useScrollArea(anchorRef);
  if (!state.show) return null;
  return (
    <button
      type="button"
      aria-label="Nach oben"
      onClick={() => scrollParent(anchorRef.current)?.scrollTo({ top: 0, behavior: "smooth" })}
      style={{ left: state.left }}
      className={`fixed ${raised ? "bottom-[calc(var(--sp-space-6x)+var(--sp-space-16x))]" : "bottom-[var(--sp-space-6x)]"} -translate-x-1/2 z-40 inline-flex items-center gap-[var(--sp-space-1x)] h-10 px-[var(--sp-space-4x)] bg-sp-brand-fill-normal text-sp-brand-on-normal border-0 rounded-[var(--sp-radius-pill)] shadow-[var(--sp-shadow-m)] cursor-pointer sp-text-medium sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]`}
    >
      <Icon name="up_end" color="currentColor" />
      Nach oben
    </button>
  );
}
