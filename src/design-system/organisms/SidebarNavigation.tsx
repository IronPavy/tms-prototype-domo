import { useState } from "react";
import type { IconName } from "../atoms/Icon";
import { SearchField } from "../atoms/SearchField";
import { SidebarNavItem } from "../molecules/SidebarNavItem";

export interface NavChild {
  id: string;
  label: string;
}

export interface NavSection {
  id: string;
  label: string;
  icon: IconName;
  children?: NavChild[];
}

export interface SidebarNavigationProps {
  sections: NavSection[];
  /** id of the selected section or child */
  selectedId: string;
  onSelect: (id: string) => void;
  /** sections expanded on first render (defaults to the one holding selectedId) */
  defaultExpanded?: string[];
  promoLabel?: string;
  helpLabel?: string;
  onPromoClick?: () => void;
  onHelpClick?: () => void;
  /** placeholder of the menu search ("Suchen" in SP3) */
  searchPlaceholder?: string;
}

const norm = (s: string) => s.toLocaleLowerCase("de");

/** Sophi's Pet 3 "Side Menu" (621:12085), Density=Default — 270px · surface/raised · 1px border (line) on the right.
    Inside: padding 2x (top / sides) · gap 2x · library Search on top · Items: Side Menu Items and
    "Side Menu Item Folder"s (children behind an indent guide: 21px column with a 2px border (line) on its right,
    bottom padding 3x) · Divider · "Jetzt kaufen" / "Hilfe" pinned to the bottom.
    Search filters items and children; matching folders open while searching. */
export function SidebarNavigation({
  sections, selectedId, onSelect, defaultExpanded,
  promoLabel = "Jetzt kaufen", helpLabel = "Hilfe", onPromoClick, onHelpClick, searchPlaceholder = "Suchen",
}: SidebarNavigationProps) {
  const owner = sections.find((s) => s.children?.some((c) => c.id === selectedId));
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(defaultExpanded ?? (owner ? [owner.id] : [])),
  );
  const [query, setQuery] = useState("");

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const q = norm(query.trim());
  const visible = sections
    .map((s) => {
      if (!q || norm(s.label).includes(q)) return s;
      const children = s.children?.filter((c) => norm(c.label).includes(q));
      return children?.length ? { ...s, children } : null;
    })
    .filter((s): s is NavSection => !!s);

  return (
    <nav
      aria-label="Hauptnavigation"
      className="flex flex-col w-[var(--tms-sidebar-width)] h-full shrink-0 bg-sp-surface-raised border-0 border-r border-solid border-sp-border-line"
    >
      <div className="flex flex-col gap-[var(--sp-space-2x)] flex-1 min-h-0 pt-[var(--sp-space-2x)] px-[var(--sp-space-2x)]">
        <SearchField value={query} onChange={setQuery} placeholder={searchPlaceholder} />

        <ul className="flex-1 min-h-0 m-0 p-0 list-none overflow-y-auto overflow-x-hidden">
          {visible.map((s) => {
            // an empty `children` array still marks a folder (sub-pages not designed yet)
            const hasChildren = s.children !== undefined;
            const isOpen = hasChildren && (expanded.has(s.id) || (!!q && !!s.children!.length));
            return (
              <li key={s.id}>
                <SidebarNavItem
                  label={s.label}
                  icon={s.icon}
                  hasChildren={hasChildren}
                  expanded={isOpen}
                  selected={s.id === selectedId}
                  active={owner?.id === s.id}
                  onClick={() => (hasChildren ? toggle(s.id) : onSelect(s.id))}
                />
                {isOpen && s.children!.length > 0 && (
                  <div className="flex">
                    {/* Side Menu Indent: 21px column, 2px guide line, ends 3x above the last child's bottom */}
                    <span aria-hidden className="shrink-0 w-[21px] mb-[var(--sp-space-3x)] border-0 border-r-2 border-solid border-sp-border-line" />
                    <ul className="flex-1 min-w-0 m-0 p-0 list-none">
                      {s.children!.map((c) => (
                        <li key={c.id}>
                          <SidebarNavItem label={c.label} level={1} selected={c.id === selectedId} onClick={() => onSelect(c.id)} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
          {!visible.length && (
            <li className="px-[var(--sp-space-3x)] py-[var(--sp-space-3x)] sp-text-small text-sp-text-placeholder">Keine Treffer</li>
          )}
        </ul>
      </div>

      <div className="px-[var(--sp-space-2x)]">
        <hr className="my-[var(--sp-space-2x)] mx-0 border-0 border-t border-solid border-sp-border-line" />
        <SidebarNavItem label={promoLabel} icon="help_circle" tone="promo" onClick={onPromoClick} />
      </div>
      <SidebarNavItem label={helpLabel} icon="help_circle" tone="promo-filled" onClick={onHelpClick} />
    </nav>
  );
}
