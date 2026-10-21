import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "tertiary";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  /** 16px leading icon */
  icon?: IconName;
  label?: string;
  /** trailing "expanded" chevron (Show Dropdown=yes) */
  dropdown?: boolean;
}

/* SP3 "Button" Appearance → our variant: primary = accent, secondary = outlined, tertiary = plain (Variant brand). */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-sp-brand-fill-normal text-sp-brand-on-normal sp-interactive",
  secondary:
    "bg-transparent border border-solid border-sp-brand-border-normal text-sp-brand-on-surface sp-interactive",
  tertiary:
    "bg-transparent text-sp-brand-on-surface sp-interactive",
};

/** Sophi's Pet 3 "Button" (1:586), Density=Default, Variant=brand.
    32px · padding density/padding-inline 8 · radius 2x · gap 1x · Roboto Standard/Medium.
    accent = fill/normal + on/normal · outlined = border/normal + on/surface · plain = on/surface.
    hover / pressed = hover 7% / active 11% overlay (sp-interactive) · focus = Focus Brand · disabled 35%. */
export function Button({ variant = "primary", icon, label, dropdown, className = "", type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center shrink-0 h-8 p-[var(--sp-space-2x)] gap-[var(--sp-space-1x)] rounded-[var(--sp-radius-2x)] border-0 cursor-pointer sp-text-medium whitespace-nowrap outline-none focus-visible:shadow-[var(--sp-focus-brand)] disabled:cursor-default disabled:opacity-35 disabled:pointer-events-none ${VARIANT[variant]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {label && <span className="leading-none">{label}</span>}
      {dropdown && <Icon name="expanded" />}
    </button>
  );
}
