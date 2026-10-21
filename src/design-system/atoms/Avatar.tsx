import { TONES, cssVar, type Tone } from "../utils/tones";

export interface AvatarProps {
  /** full name — initials are taken from the first two words */
  name: string;
  /** colour variant (SP3 "Colored Avatar" Variant) — default Neutral */
  tone?: Tone;
  /** px — SP3 default is 48; lists use 32 */
  size?: 24 | 32 | 48;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/** Sophi's Pet 3 "Colored Avatar" (3065:16016) on ".Avatar Base" Content=Text, Shape=Circle:
    <variant>/fill/light circle · initials in <variant>/fill/normal, Roboto Medium (Small Medium at 24/32px, Large Medium at 48px). */
export function Avatar({ name, tone = "default", size = 32 }: AvatarProps) {
  const t = TONES[tone];
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={`inline-flex items-center justify-center shrink-0 rounded-[var(--sp-radius-pill)] ${size === 48 ? "sp-text-large-medium" : size === 32 ? "sp-text-small-medium" : "sp-text-extra-small font-medium"}`}
      style={{ width: size, height: size, background: cssVar(t.bg), color: cssVar(t.accent) }}
    >
      {initials(name)}
    </span>
  );
}
