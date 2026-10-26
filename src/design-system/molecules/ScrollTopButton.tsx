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

/** Floating "Nach oben" pill, centred at the bottom of the scrolling content area (above the review bar). Appears after scrolling down
    ~one screen part, scrolls the page smoothly to the top and hides again. `anchorRef` = any element inside the scrolling area. */
export function ScrollTopButton({ anchorRef }: { anchorRef: RefObject<HTMLElement | null> }) {
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

  if (!state.show) return null;
  return (
    <button
      type="button"
      aria-label="Nach oben"
      onClick={() => scrollParent(anchorRef.current)?.scrollTo({ top: 0, behavior: "smooth" })}
      style={{ left: state.left }}
      className="fixed bottom-[72px] -translate-x-1/2 z-40 inline-flex items-center gap-[var(--sp-space-1x)] h-10 px-[var(--sp-space-4x)] bg-sp-brand-fill-normal text-sp-brand-on-normal border-0 rounded-[var(--sp-radius-pill)] shadow-[var(--sp-shadow-m)] cursor-pointer sp-text-medium sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      <Icon name="up_end" color="currentColor" />
      Nach oben
    </button>
  );
}
