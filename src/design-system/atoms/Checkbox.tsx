import { Icon } from "./Icon";

export interface CheckboxProps {
  checked: boolean;
  /** some but not all children checked */
  partial?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

/** Sophi's Pet 3 "Checkbox" with label: 16px box icon (brand when checked) · Roboto Standard label in text ·
    hover overlay · focus = Focus Brand. */
export function Checkbox({ checked, partial, onChange, label }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partial && !checked ? "mixed" : checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-[var(--sp-space-1x)] h-8 pr-[var(--sp-space-2x)] border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      <Icon
        size={24}
        name={checked ? "checkbox_active_filled" : partial ? "checkbox_tristate" : "checkbox"}
        color={checked || partial ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"}
      />
      <span className="sp-text-medium text-sp-text">{label}</span>
    </button>
  );
}
