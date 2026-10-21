import type { ReactNode } from "react";

export interface PanelProps {
  title: string;
  /** small meta text next to the title, e.g. "8 items · 05.10. – 11.10.2026" */
  meta?: string;
  /** right side of the header (filters, links) */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Content panel on Sophi's Pet 3 "Card" (497:3227), Filled=Yes, Outlined=true, not interactive:
    surface/raised · radius 3x · 1px border (line) · padding 4x top/bottom, 5x left/right · section gap 4x.
    Header: Title/H3 Group Title + Roboto Small meta in text label. */
export function Panel({ title, meta, actions, children, className = "" }: PanelProps) {
  return (
    <section className={`flex flex-col gap-[var(--sp-space-4x)] min-w-0 py-[var(--sp-space-4x)] px-[var(--sp-space-5x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-3x)] ${className}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-[var(--sp-space-2x)]">
        <div className="flex flex-wrap items-baseline gap-x-[var(--sp-space-2x)] gap-y-[var(--sp-space-1x)] min-w-0">
          <h2 className="sp-title-h3 m-0 text-sp-text-title">{title}</h2>
          {meta && <span className="sp-text-small text-sp-text-label">{meta}</span>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
