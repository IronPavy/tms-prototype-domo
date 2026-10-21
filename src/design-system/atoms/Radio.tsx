import { Icon } from "./Icon";

export interface RadioProps {
  checked: boolean;
  onChange: () => void;
  /** accessible name (shown as text when `showLabel`) */
  label: string;
  showLabel?: boolean;
}

/** Sophi's Pet 3 "Radio Button": 16px circle (brand when selected) · optional Roboto Standard label ·
    hover overlay · focus = Focus Brand. */
export function Radio({ checked, onChange, label, showLabel = true }: RadioProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      onClick={onChange}
      className="inline-flex items-center gap-[var(--sp-space-1x)] h-8 pr-[var(--sp-space-2x)] border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      <Icon size={24} name={checked ? "radio_active" : "radio"} color={checked ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />
      {showLabel && <span className="sp-text-medium text-sp-text">{label}</span>}
    </button>
  );
}
