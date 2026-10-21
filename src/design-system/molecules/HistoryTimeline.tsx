export interface HistoryEntry {
  id: string;
  title: string;
  /** timestamp / detail line, Roboto Small in text label */
  meta?: string;
  /** done = success dot · pending = grey dot · danger = overdue */
  state: "done" | "pending" | "danger";
}

const DOT = { done: "bg-sp-success-fill-normal", pending: "bg-sp-border-line", danger: "bg-sp-danger-fill-normal" } as const;

/** Vertical timeline: 8px dot per event on a 2px guide line (border/line, like the sidebar indent guide) ·
    title Roboto Standard in text · meta Roboto Small in text label. */
export function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ol className="m-0 p-0 list-none flex flex-col">
      {entries.map((e, i) => (
        <li key={e.id} className="flex gap-[var(--sp-space-3x)]">
          <span aria-hidden className="flex flex-col items-center w-2 shrink-0">
            <span className={`mt-[6px] size-2 shrink-0 rounded-[var(--sp-radius-pill)] ${DOT[e.state]}`} />
            {i < entries.length - 1 && <span className="flex-1 w-0.5 bg-sp-border-line" />}
          </span>
          <div className={`flex flex-col gap-[var(--sp-space-1x)] min-w-0 ${i < entries.length - 1 ? "pb-[var(--sp-space-4x)]" : ""}`}>
            <span className="sp-text-standard text-sp-text">{e.title}</span>
            {e.meta && <span className="sp-text-small text-sp-text-label">{e.meta}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
