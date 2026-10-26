import { Icon, type IconName } from "../atoms/Icon";

export interface MenuListItemProps {
  label: string;
  /** optional 16px leading icon */
  icon?: IconName;
  /** State=selected — basics/selected background, medium "selected" text, trailing check */
  selected?: boolean;
  disabled?: boolean;
  /** rounded highlight (radius standard) — for lists with inner padding, e.g. date presets */
  inset?: boolean;
  /** item of an action menu (role menuitem) instead of a selectable option */
  menu?: boolean;
  onClick?: () => void;
}

/** Sophi's Pet 3 "Dropdown Item" (2033:5720), Type=normal.
    32px · padding 2x · gap 2x · Roboto Standard, icon in icon colour;
    normal form-control background · hover / pressed overlay · selected = selected + text-selected Medium,
    icon brand/on/surface · disabled 35%. */
export function MenuListItem({ label, icon, selected, disabled, inset, menu, onClick }: MenuListItemProps) {
  return (
    <button
      type="button"
      role={menu ? "menuitem" : "menuitemradio"}
      aria-checked={menu ? undefined : !!selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center w-full h-8 min-h-8 p-[var(--sp-space-2x)] gap-[var(--sp-space-2x)] border-0 text-left cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)] disabled:cursor-default ${inset ? "rounded-[var(--sp-radius-2x)]" : ""} ${
        selected
          ? "bg-sp-selected"
          : "bg-sp-form-control-background-color sp-interactive"
      }`}
    >
      {icon && <Icon name={icon} color={selected ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />}
      <span
        className={`flex-1 min-w-0 truncate leading-none ${
          selected ? "sp-text-medium text-sp-text-selected" : "sp-text-standard text-sp-text"
        } ${disabled ? "opacity-35" : ""}`}
      >
        {label}
      </span>
      {selected && <Icon name="check" color="var(--sp-brand-on-surface)" />}
    </button>
  );
}
