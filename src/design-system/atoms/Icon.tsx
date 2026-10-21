/* Sophis Icons — the full Figma icon library (627 icons, 24px grid),
   exported as SVG into assets/sophis-icons. Rendered as a CSS mask so the
   colour comes from any token via `color` (defaults to currentColor). */
import type { IconName } from "./iconNames";

export { ICON_NAMES, ICON_SECTIONS, type IconName } from "./iconNames";

const files = import.meta.glob("../assets/sophis-icons/*.svg", {
  eager: true, query: "?url", import: "default",
}) as Record<string, string>;

/** 12 · 16 (SP3 Icon Size/M) · 20 (SP3 Icon Size/L) · 24 · 48 */
export type IconSize = 12 | 16 | 20 | 24 | 48;

export interface IconProps {
  name: IconName;
  size?: IconSize;
  /** any CSS colour, e.g. "var(--sp-brand-fill-normal)"; defaults to the text colour */
  color?: string;
  className?: string;
}

export function Icon({ name, size = 16, color = "currentColor", className = "" }: IconProps) {
  const src = `url("${files[`../assets/sophis-icons/${name}.svg`]}")`;
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: src,
        maskImage: src,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }}
    />
  );
}
