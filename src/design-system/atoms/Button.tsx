import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "tertiary";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  /** 16px leading icon (SP3 "Start Icon") */
  icon?: IconName;
  /** 16px trailing icon (SP3 "End Icon"), e.g. the arrow of "Nächste" */
  endIcon?: IconName;
  label?: string;
  /** SP3 "Colored Button" Variant=Danger — red, for deleting */
  danger?: boolean;
  /** trailing "expanded" chevron (Show Dropdown=yes) */
  dropdown?: boolean;
}

/* SP3 "Button" Appearance → our variant: primary = accent, secondary = outlined, tertiary = plain (Variant brand). */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-0 bg-sp-brand-fill-normal text-sp-brand-on-normal sp-interactive",
  secondary:
    "bg-transparent border border-solid border-sp-brand-border-normal text-sp-brand-on-surface sp-interactive",
  tertiary:
    "border-0 bg-transparent text-sp-brand-on-surface sp-interactive",
};

/* Variant=Danger: fill/normal + on/normal · border/normal + on/surface · on/surface */
const DANGER: Record<ButtonVariant, string> = {
  primary: "border-0 bg-sp-danger-fill-normal text-sp-danger-on-normal sp-interactive",
  secondary: "bg-transparent border border-solid border-sp-danger-border-normal text-sp-danger-on-surface sp-interactive",
  tertiary: "border-0 bg-transparent text-sp-danger-on-surface sp-interactive",
};

/** Sophi's Pet 3 "Button" (1:586), Density=Default, Variant=brand.
    32px · padding density/padding-inline 8 · radius 2x · gap 1x · Roboto Standard/Medium.
    accent = fill/normal + on/normal · outlined = border/normal + on/surface · plain = on/surface.
    hover / pressed = hover 7% / active 11% overlay (sp-interactive) · focus = Focus Brand · disabled 35%. */
export function Button({ variant = "primary", icon, endIcon, label, dropdown, danger, className = "", type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center shrink-0 h-8 p-[var(--sp-space-2x)] gap-[var(--sp-space-1x)] rounded-[var(--sp-radius-2x)] cursor-pointer sp-text-medium whitespace-nowrap outline-none focus-visible:shadow-[var(--sp-focus-brand)] disabled:cursor-default disabled:opacity-35 disabled:pointer-events-none ${(danger ? DANGER : VARIANT)[variant]} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {label && <span className="leading-none">{label}</span>}
      {endIcon && <Icon name={endIcon} />}
      {dropdown && <Icon name="expanded" />}
    </button>
  );
}
