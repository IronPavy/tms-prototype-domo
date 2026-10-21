import { Icon, type IconName } from "../atoms/Icon";

export interface ReadOnlyDropdownProps {
  /** what the value is, e.g. "Gruppe" — screen-reader label */
  label: string;
  /** the value shown, e.g. "Group A" */
  value: string;
  icon: IconName;
  className?: string;
}

/** Read-only counterpart of the header dropdowns: same 32px / 160px field (radius 2x · 1px border · icon + Roboto Standard value,
    truncated) but no chevron, no hover and no focus — it only shows the value taken from the main header. */
export function ReadOnlyDropdown({ label, value, icon, className = "" }: ReadOnlyDropdownProps) {
  return (
    <div
      role="group"
      aria-label={`${label}: ${value}`}
      title={`${label}: ${value}`}
      className={`flex items-center gap-[var(--sp-space-2x)] h-8 w-40 px-[var(--sp-space-2x)] bg-sp-surface-default border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] cursor-default select-none ${className}`}
    >
      <Icon name={icon} color="var(--sp-icon)" />
      <span className="flex-1 min-w-0 truncate whitespace-nowrap sp-text-standard text-sp-text">{value}</span>
    </div>
  );
}
