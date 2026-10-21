import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  /** right-aligned controls (pickers, filters) */
  actions?: ReactNode;
  /** main action under the title, left-aligned (e.g. "Neue Aufgabe") */
  primaryAction?: ReactNode;
  /** above the title, e.g. <Breadcrumb /> */
  breadcrumb?: ReactNode;
  /** one line under the title (Roboto Standard, text font/label) */
  description?: string;
}

/** Page title block (title · optional description · primary action, gap 3x) on the left, filters / pickers on the right — Sophi's Pet "Title/H1 Page Title" (Roboto Medium 24, text font/title),
    optional breadcrumb above and description below (gap Margin&Size/0,5). */
export function PageHeader({ title, actions, primaryAction, breadcrumb, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-[var(--sp-space-2x)]">
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-[var(--sp-space-4x)]">
        <div className="flex flex-col items-start gap-[var(--sp-space-3x)] min-w-0">
          <h1 className="sp-title-h1 m-0 text-sp-text-title">{title}</h1>
          {description && <p className="m-0 sp-text-standard text-sp-text-label">{description}</p>}
          {primaryAction}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-[var(--sp-space-4x)]">{actions}</div>}
      </div>
    </div>
  );
}
