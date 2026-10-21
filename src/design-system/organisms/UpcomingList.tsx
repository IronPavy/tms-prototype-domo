import { Fragment } from "react";
import { EmptyState } from "../molecules/EmptyState";
import { UpcomingRow, type UpcomingRowProps } from "../molecules/UpcomingRow";
import { addDays, sameDay } from "../utils/date";

export interface UpcomingItem extends Omit<UpcomingRowProps, "onOpen" | "sameDayAsPrevious" | "highlight"> { id: string }

export interface UpcomingListProps {
  /** sorted by date */
  items: UpcomingItem[];
  /** reference day — the tile of the next day is highlighted */
  today?: Date;
  onOpen?: (item: UpcomingItem) => void;
}

/** Upcoming rows grouped by day: the date tile is shown once per day, the library Divider
    runs between days only (rows of the same day sit together). Wrap in ScrollArea for long lists. */
export function UpcomingList({ items, today, onOpen }: UpcomingListProps) {
  if (!items.length) {
    return <EmptyState icon="cal" title="Nothing planned for the next days" />;
  }
  const tomorrow = today && addDays(today, 1);
  return (
    <div className="flex flex-col">
      {items.map((it, i) => {
        const same = i > 0 && sameDay(items[i - 1].date, it.date);
        return (
          <Fragment key={it.id}>
            {i > 0 && !same && <hr className="m-0 mx-[var(--sp-space-2x)] border-0 border-t border-solid border-sp-border-line" />}
            <UpcomingRow
              {...it}
              sameDayAsPrevious={same}
              highlight={!!tomorrow && sameDay(it.date, tomorrow)}
              onOpen={() => onOpen?.(it)}
            />
          </Fragment>
        );
      })}
    </div>
  );
}
