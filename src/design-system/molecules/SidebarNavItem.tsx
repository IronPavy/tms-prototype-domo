import { Icon, type IconName } from "../atoms/Icon";

export interface SidebarNavItemProps {
  label: string;
  /** 16px leading icon */
  icon?: IconName;
  /** 0 = top level, 1 = child inside a folder (the folder's indent guide sits to its left) */
  level?: 0 | 1;
  /** State=Selected — the current page */
  selected?: boolean;
  /** folder that contains the current page: Medium text-selected label */
  active?: boolean;
  /** "Side Menu Item Folder" — shows the caret (down = closed, up = open) */
  hasChildren?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  /** orange text + icon ("Jetzt kaufen", "Hilfe"); `promo-filled` adds the cream background */
  tone?: "default" | "promo" | "promo-filled";
  onClick?: () => void;
}

/** Sophi's Pet 3 "Side Menu Item" (424:2194) / "Side Menu Item Folder" (2004:18517) header, Density=Default:
    40px (density/navigation-item-height) · padding 3x · gap 2x · 16px icon in icon colour · Roboto Standard in text.
    hover / pressed overlay · Selected = selected background + 2px brand/fill/normal left border,
    text-selected Medium, icon brand/on/surface · folder holding the current page = text-selected Medium · Disabled 35%.
    Folder caret = "expanded" icon, rotated up when open. */
export function SidebarNavItem({
  label, icon, selected, active, hasChildren, expanded, disabled, tone = "default", onClick,
}: SidebarNavItemProps) {
  const promo = tone !== "default";
  const emphasized = selected || active;

  const bg = selected
    ? "bg-sp-selected border-sp-brand-fill-normal"
    : tone === "promo-filled"
      ? "bg-tms-help-background border-transparent"
      : "bg-sp-surface-raised border-transparent sp-interactive";

  const text = promo
    ? "text-tms-promo sp-text-bold"
    : emphasized
      ? "text-sp-text-selected sp-text-medium"
      : "text-sp-text sp-text-standard";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={selected ? "page" : undefined}
      aria-expanded={hasChildren ? !!expanded : undefined}
      className={`flex items-center w-full h-[var(--sp-density-navigation-item-height)] gap-[var(--sp-space-2x)] pl-[calc(var(--sp-space-3x)-2px)] pr-[var(--sp-space-3x)] border-0 border-l-2 border-solid text-left cursor-pointer outline-none disabled:cursor-default disabled:opacity-35 focus-visible:shadow-[var(--sp-focus-brand)] ${bg}`}
    >
      {icon && <Icon name={icon} size={16} color={promo ? "var(--tms-promo)" : selected ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />}
      <span className={`flex-1 min-w-0 truncate leading-none ${text}`}>{label}</span>
      {hasChildren && (
        <span className={`flex transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>
          <Icon name="expanded" color="var(--sp-icon)" />
        </span>
      )}
    </button>
  );
}
