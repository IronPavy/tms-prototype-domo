import { TONES, cssVar } from "../utils/tones";

/** Shift pill: the first 3 letters of the shift ("Frü", "Spä", "Abs") — Badge-Chip look in the info tone (light fill + border, radius 2x,
    20px, Small Medium). The working hours are shown as plain text beside it, not inside the pill. */
export function ShiftPill({ code }: { code: string }) {
  const t = TONES.info;
  return (
    <span
      className="inline-flex items-center shrink-0 h-5 px-[var(--tms-space-6px)] border border-solid rounded-[var(--sp-radius-2x)] whitespace-nowrap sp-text-small-medium text-sp-text"
      style={{ background: cssVar(t.bg), borderColor: cssVar(t.border) }}
    >
      {code}
    </span>
  );
}
