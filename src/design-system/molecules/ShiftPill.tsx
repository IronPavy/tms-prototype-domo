import { TONES, cssVar } from "../utils/tones";

/** colour of a shift — comes from the backend per shift; without one the pill uses the info tone */
export type ShiftColor = "amber" | "violet" | "green" | "blue" | "rose";
const HUE: Record<ShiftColor, string> = { amber: "#E9A13B", violet: "#8E72DA", green: "#3FAE7A", blue: "#3B8FD9", rose: "#D95D80" };

/** Shift pill: the first 3 letters of the shift in capitals ("FRÜ", "SPÄ", "ABS") — Badge-Chip look (light fill + border, radius 2x,
    20px, Small Medium) in the colour of the shift. The shift name and working hours are plain text beside it, not inside the pill. */
export function ShiftPill({ code, color }: { code: string; color?: ShiftColor }) {
  const t = TONES.info;
  const style = color
    ? { background: `color-mix(in srgb, ${HUE[color]} 20%, var(--sp-surface-raised))`, borderColor: `color-mix(in srgb, ${HUE[color]} 55%, var(--sp-surface-raised))` }
    : { background: cssVar(t.bg), borderColor: cssVar(t.border) };
  return (
    <span
      className="inline-flex items-center shrink-0 h-5 px-[var(--tms-space-6px)] border border-solid rounded-[var(--sp-radius-2x)] whitespace-nowrap uppercase sp-text-small-medium text-sp-text"
      style={style}
    >
      {code}
    </span>
  );
}
