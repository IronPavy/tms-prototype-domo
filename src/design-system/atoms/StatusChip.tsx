import { Icon, type IconName } from "./Icon";
import { TONES, cssVar, type Tone } from "../utils/tones";

export interface StatusChipProps {
  tone: Tone;
  label: string;
  /** optional 16px leading icon, coloured in the tone */
  icon?: IconName;
}

/** Sophi's Pet 3 "Badge Chip" (39:5407) on ".Badge Base" — <variant>/fill/light + border/light, on/light label.
    20px · padding 2 / Margin&Size/6px · gap 0,25 · radius standard ·
    tone background + tone "hover" stroke · label Roboto Small Medium in text font/standard. */
export function StatusChip({ tone, label, icon }: StatusChipProps) {
  const t = TONES[tone];
  return (
    <span
      className="inline-flex items-center shrink-0 h-5 py-0.5 px-[var(--tms-space-6px)] gap-[var(--sp-space-1x)] border border-solid rounded-[var(--sp-radius-2x)] sp-text-small-medium text-sp-text whitespace-nowrap"
      style={{ background: cssVar(t.bg), borderColor: cssVar(t.border) }}
    >
      {icon && <Icon name={icon} color={cssVar(t.fg)} />}
      {label}
    </span>
  );
}
