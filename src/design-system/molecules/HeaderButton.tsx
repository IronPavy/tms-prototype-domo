import { Icon, type IconName } from "../atoms/Icon";

export interface HeaderButtonProps {
  icon: IconName;
  /** optional text label next to the icon */
  label?: string;
  /** shows the dropdown chevron */
  dropdown?: boolean;
  /** 24px icon — the ".Header Menu Button" (52 × 52) */
  largeIcon?: boolean;
  /** State=active — e.g. an open dropdown or the current tool */
  active?: boolean;
  disabled?: boolean;
  /** accessible name when there is no visible label */
  ariaLabel?: string;
  onClick?: () => void;
}

/** Sophi's Pet 3 "Header Button" (401:1597) / ".Header Menu Button" (401:2014): 52px · padding density/padding-inline (2x) ·
    gap 1x · 16px icons + Roboto Standard/Medium label in white (brand/on/normal) · caret when it opens a menu.
    normal header-background · hover brand/fill/normal (palette brand/90) · active brand/80 · disabled 35%. */
export function HeaderButton({ icon, label, dropdown, largeIcon, active, disabled, ariaLabel, onClick }: HeaderButtonProps) {
  const state = active
    ? "bg-tms-header-active"
    : "bg-sp-header-background hover:bg-sp-brand-fill-normal active:bg-tms-header-active";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label ? undefined : ariaLabel}
      title={label ? undefined : ariaLabel}
      aria-haspopup={dropdown || undefined}
      aria-pressed={active || undefined}
      className={`flex items-center shrink-0 h-[var(--tms-header-height)] px-[var(--sp-density-padding-inline)] gap-[var(--sp-space-1x)] border-0 cursor-pointer text-sp-brand-on-normal disabled:cursor-default disabled:opacity-35 disabled:hover:bg-sp-header-background focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sp-brand-on-normal ${state}`}
    >
      <Icon name={icon} size={largeIcon ? 24 : 16} />
      {label && (
        <span className="whitespace-nowrap sp-text-medium">{label}</span>
      )}
      {dropdown && <Icon name="expanded" />}
    </button>
  );
}
