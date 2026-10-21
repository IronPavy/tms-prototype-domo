import { Fragment } from "react";
import { Icon } from "../atoms/Icon";
import { Link } from "../atoms/Link";

export interface BreadcrumbItem { label: string; onClick?: () => void }

/** Sophi's Pet 3 "Breadcrumb" (497:2927), Variant=Inline: "Breadcrumb Item"s (library Link + 16px "next" icon
    in icon colour), gap 1x · last item = current page (Roboto Standard/Medium, text title, not a link). */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-[var(--sp-space-1x)]">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={it.label}>
            {i > 0 && <Icon name="next" color="var(--sp-icon)" />}
            {last
              ? <span aria-current="page" className="sp-text-medium text-sp-text-title">{it.label}</span>
              : <Link role="button" tabIndex={0} onClick={it.onClick}>{it.label}</Link>}
          </Fragment>
        );
      })}
    </nav>
  );
}
