import { useState } from "react";
import { Button } from "../atoms/Button";
import { Tooltip } from "../atoms/Tooltip";
import {
  addMonths, diffDays, isBetween, monthGrid, sameDay, startOfMonth, toRange, type DateRange,
} from "../utils/date";

const TEXT = {
  en: { weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], month: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }), prev: "Previous month", next: "Next month", future: "Future days can't be selected" },
  de: { weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], month: new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }), prev: "Vorheriger Monat", next: "Nächster Monat", future: "Zukünftige Tage nicht wählbar" },
};

export interface CalendarRangeProps {
  value: DateRange;
  /** called on every pick: first click = single day, second click = range */
  onChange: (range: DateRange, complete: boolean) => void;
  today?: Date;
  /** no own border/background — when embedded in a picker panel */
  bare?: boolean;
  /** one day instead of a range: a click selects that day and completes straight away */
  single?: boolean;
  /** weekday / month names and button labels (default English) */
  lang?: "en" | "de";
  /** last selectable day — every later day is greyed out and disabled */
  maxDate?: Date;
}

/** Sophi's Pet "Calendar" Type=Range (884:2259) with "Calendar / Day" states (388:145).
    Click a day → that single day is selected; click a second day → range between both.
    Start/end = primary circle · days between = basics/selected band (other-month days: app-background band)
    · today = primary ring · hover = basics/hover · pressed = basics/pressed. */
export function CalendarRange({ value, onChange, today = new Date(), bare, single: singleDay, lang = "en", maxDate }: CalendarRangeProps) {
  const T = TEXT[lang];
  const [month, setMonth] = useState(() => startOfMonth(value.end));
  const [anchor, setAnchor] = useState<Date | null>(null); // first click of a new range
  const [hover, setHover] = useState<Date | null>(null);

  // while picking the second day, preview the range anchor → hovered day
  const shown: DateRange = anchor ? toRange(anchor, hover ?? anchor) : value;
  const previewing = !!anchor;

  const pick = (d: Date) => {
    if (singleDay) { onChange({ start: d, end: d }, true); return; }
    if (!anchor) {
      setAnchor(d);
      onChange({ start: d, end: d }, false);
    } else {
      setAnchor(null);
      onChange(toRange(anchor, d), true);
    }
  };

  return (
    <div
      className={`flex flex-col gap-[var(--sp-space-4x)] w-[280px] p-[var(--sp-space-4x)] ${
        bare ? "" : "bg-sp-form-control-background-color border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <Button variant="tertiary" icon="previous" aria-label={T.prev} onClick={() => setMonth((m) => addMonths(m, -1))} />
        <span className="sp-text-medium text-sp-text-link">{T.month.format(month)}</span>
        <Button variant="tertiary" icon="next" aria-label={T.next} onClick={() => setMonth((m) => addMonths(m, 1))} />
      </div>

      <div className="flex flex-col gap-[var(--sp-space-2x)]">
        <div className="flex justify-between text-center sp-text-standard text-sp-text-placeholder">
          {T.weekdays.map((d) => <span key={d} className="w-8">{d}</span>)}
        </div>

        <div className="flex flex-col gap-[var(--sp-space-1x)]" onMouseLeave={() => setHover(null)}>
          {monthGrid(month).map((week) => (
            <div key={week[0].toISOString()} className="flex justify-between">
              {week.map((d, i) => {
                const inMonth = d.getMonth() === month.getMonth();
                const isStart = sameDay(d, shown.start);
                const isEnd = sameDay(d, shown.end);
                const single = isStart && isEnd;
                const inside = isBetween(d, shown.start, shown.end);
                const edge = isStart || isEnd;
                const isToday = sameDay(d, today);
                const future = !!maxDate && diffDays(maxDate, d) > 0;

                // band: from centre of start to centre of end; rounded at row edges (Mon / Sun)
                const band = inside && !single && (
                  <span
                    aria-hidden
                    className={`absolute inset-y-1 ${previewing ? "bg-sp-hover" : inMonth ? "bg-sp-selected" : "bg-sp-surface-default"} ${
                      isStart ? "left-1/2" : i === 0 ? "left-0 rounded-l-[var(--sp-radius-pill)]" : "-left-0.5"
                    } ${isEnd ? "right-1/2" : i === 6 ? "right-0 rounded-r-[var(--sp-radius-pill)]" : "-right-0.5"}`}
                  />
                );

                const dayClass = future
                  ? "bg-transparent text-sp-text-placeholder opacity-40"
                  : edge
                  ? "bg-sp-brand-fill-normal text-sp-brand-on-normal"
                  : inside
                    ? `bg-transparent ${inMonth ? "text-sp-text-selected" : "text-sp-text-placeholder"}`
                    : `bg-transparent ${inMonth ? "text-sp-text" : "text-sp-text-placeholder"} sp-interactive`;

                return (
                  <span key={d.toISOString()} className="group relative size-8">
                    {band}
                    {future && (
                      <Tooltip align={i < 2 ? "start" : i > 4 ? "end" : "center"} className={`absolute bottom-full z-10 mb-1 opacity-0 group-hover:opacity-100 ${i < 2 ? "left-0" : i > 4 ? "right-0" : "left-1/2 -translate-x-1/2"}`}>
                        {T.future}
                      </Tooltip>
                    )}
                    <button
                      type="button"
                      disabled={future}
                      onClick={() => pick(d)}
                      onMouseEnter={() => !future && setHover(d)}
                      aria-pressed={edge}
                      aria-label={d.toDateString()}
                      className={`relative flex items-center justify-center size-8 p-0 rounded-[var(--sp-radius-pill)] ${future ? "cursor-not-allowed" : "cursor-pointer"} sp-text-medium outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${dayClass} ${
                        isToday && !edge ? "border border-solid border-sp-brand-fill-normal !text-sp-text-link" : "border-0"
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
