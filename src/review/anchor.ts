/* Where a comment sits. The pin is tied to the element that was clicked (stable child-index path from <body>) plus the
   click position as a fraction of that element, so it follows the design when the window is resized.
   If the element is gone (list filtered, page re-rendered) the pin falls back to the viewport fraction. */
export interface Anchor {
  path: string;
  fx: number;
  fy: number;
  px: number;
  py: number;
}

export const REVIEW_UI = "[data-review-ui]";

function cssPath(el: Element): string {
  const parts: string[] = [];
  for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
    const i = n.parentElement ? [...n.parentElement.children].indexOf(n) + 1 : 1;
    parts.unshift(`${n.tagName.toLowerCase()}:nth-child(${i})`);
  }
  return ["body", ...parts].join(">");
}

export function makeAnchor(target: Element, x: number, y: number): Anchor {
  const r = target.getBoundingClientRect();
  return {
    path: cssPath(target),
    fx: r.width ? (x - r.left) / r.width : 0,
    fy: r.height ? (y - r.top) / r.height : 0,
    px: x / window.innerWidth,
    py: y / window.innerHeight,
  };
}

/** viewport position of a pin, or null when it is scrolled out of view / hidden */
export function resolveAnchor(a: Anchor): { x: number; y: number } | null {
  let x = a.px * window.innerWidth;
  let y = a.py * window.innerHeight;
  let el: Element | null = null;
  try { el = document.querySelector(a.path); } catch { el = null; }
  if (el) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    x = r.left + a.fx * r.width;
    y = r.top + a.fy * r.height;
  }
  return x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight ? null : { x, y };
}
