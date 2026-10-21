import { Icon, type IconName } from "./Icon";
import { TONES, cssVar, type Tone } from "../utils/tones";

export interface FilterPillProps {
  tone: Tone;
  label: string;
  icon?: IconName;
  count?: number;
  /** on = tone colours (library "normal"); off = default grey, label in text font/label */
  selected: boolean;
  /** "All" pill: when selected it is filled with the brand colour (like the selected Type segment) instead of a tone tint */
  solid?: boolean;
  onClick?: () => void;
}

/** Filter toggle = Sophi's Pet 3 "Badge Pill" (101:3441) styling at the SP3 Density control size, so it lines up
    with the other 32px toolbar controls (the 20px badge is too small as a click target):
    density/height 32 · padding-inline density (2x) · gap 1x · radius pill · <variant>/fill/light + 1px <variant>/border/light ·
    label Roboto Standard/Medium in on/light · hover / pressed overlay. Off = Variant Neutral.
    Icon (16px) in the variant on/surface colour, count Medium in the same colour. */
export function FilterPill({ tone, label, icon, count, selected, solid, onClick }: FilterPillProps) {
  const t = TONES[selected ? tone : "default"];
  const filled = !!solid && selected;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="inline-flex items-center shrink-0 h-[var(--sp-density-height)] px-[var(--sp-density-padding-inline)] gap-[var(--sp-space-1x)] border border-solid rounded-[var(--sp-radius-pill)] cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)] whitespace-nowrap sp-interactive"
      style={filled ? { background: "var(--sp-brand-fill-normal)", borderColor: "var(--sp-brand-fill-normal)" } : { background: cssVar(t.bg), borderColor: cssVar(t.border) }}
    >
      {icon && <Icon name={icon} color={filled ? "var(--sp-brand-on-normal)" : cssVar(t.fg)} />}
      <span className={`sp-text-medium ${filled ? "text-sp-brand-on-normal" : selected ? "text-sp-text" : "text-sp-text-label"}`}>{label}</span>
      {count !== undefined && <span className="sp-text-medium tabular-nums" style={{ color: filled ? "var(--sp-brand-on-normal)" : cssVar(t.fg) }}>{count}</span>}
    </button>
  );
}
