const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

export interface DateTileProps {
  date: Date;
  /** next working day — card/selected background + info stroke, number in text font/primary */
  highlight?: boolean;
}

/** Small calendar tile: day number (Roboto Large Medium) over the weekday (Extra Small, uppercase,
    text font/hint) · 1px basics/lines-and-borders · radius standard · 40 × 44px. */
export function DateTile({ date, highlight }: DateTileProps) {
  return (
    <span
      className={`flex flex-col items-center justify-center gap-[var(--sp-space-1x)] shrink-0 w-10 h-11 border border-solid rounded-[var(--sp-radius-2x)] ${
        highlight
          ? "bg-sp-selected border-sp-info-border-light"
          : "bg-sp-surface-raised border-sp-border-line"
      }`}
    >
      <span className={`sp-text-large-medium tabular-nums ${highlight ? "text-sp-text-link" : "text-sp-text"}`}>{date.getDate()}</span>
      <span className="sp-text-extra-small text-sp-text-placeholder uppercase">{WEEKDAY.format(date)}</span>
    </span>
  );
}
