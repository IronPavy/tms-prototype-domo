import { useState } from "react";
import { Button } from "../atoms/Button";
import { isoWeek, monthGrid, sameDay, startOfWeek } from "../utils/date";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_FMT = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

export interface CalendarWeekProps {
  /** Monday of the selected week */
  value: Date;
  onChange: (monday: Date) => void;
  today?: Date;
}

/** Sophi's Pet "Calendar" Type=Week (3002:5848) with "Calendar / Day" states (388:145).
    324px · padding Margin&Size/1 · white input background + frosty-blue border · radius standard.
    Selected week = KW in a primary circle + basics/selected band; today = primary ring. */
export function CalendarWeek({ value, onChange, today = new Date() }: CalendarWeekProps) {
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const weeks = monthGrid(month);
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <div
      role="dialog"
      aria-label="Woche wählen"
      className="flex flex-col gap-[var(--sp-space-4x)] w-[324px] p-[var(--sp-space-4x)] bg-sp-form-control-background-color border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] shadow-[var(--sp-shadow-m)]"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="tertiary" icon="previous" aria-label="Vorheriger Monat" onClick={() => shift(-1)} />
        <span className="sp-text-medium text-sp-text-link">{MONTH_FMT.format(month)}</span>
        <Button variant="tertiary" icon="next" aria-label="Nächster Monat" onClick={() => shift(1)} />
      </div>

      <div className="flex flex-col gap-[var(--sp-space-2x)]">
        {/* Weekday header */}
        <div className="flex items-center gap-[var(--sp-space-3x)] text-sp-text-placeholder text-center">
          <span className="w-8 sp-text-medium">KW</span>
          <div className="flex flex-1 justify-between">
            {WEEKDAYS.map((d) => <span key={d} className="w-8 sp-text-standard">{d}</span>)}
          </div>
        </div>

        {/* Weeks */}
        <div className="flex flex-col gap-[var(--sp-space-1x)]">
          {weeks.map((days) => {
            const monday = days[0];
            const selected = sameDay(startOfWeek(value), monday);
            return (
              <button
                key={monday.toISOString()}
                type="button"
                onClick={() => onChange(monday)}
                aria-pressed={selected}
                aria-label={`KW ${isoWeek(monday)}`}
                className="group flex items-center gap-[var(--sp-space-3x)] p-0 border-0 bg-transparent cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)] rounded-[var(--sp-radius-pill)]"
              >
                {/* KW cell */}
                <span
                  className={`flex items-center justify-center size-8 rounded-[var(--sp-radius-pill)] sp-text-medium ${
                    selected ? "bg-sp-brand-fill-normal text-sp-brand-on-normal" : "text-sp-text"
                  }`}
                >
                  {isoWeek(monday)}
                </span>

                {/* Day cells on a range band */}
                <span className="relative flex flex-1 justify-between">
                  <span
                    aria-hidden
                    className={`absolute inset-y-1 inset-x-0 rounded-[var(--sp-radius-pill)] ${
                      selected ? "bg-sp-selected" : "group-hover:bg-sp-hover group-active:bg-sp-active"
                    }`}
                  />
                  {days.map((d) => {
                    const inMonth = d.getMonth() === month.getMonth();
                    const isToday = sameDay(d, today);
                    const color = isToday
                      ? "text-sp-text-link"
                      : selected && inMonth
                        ? "text-sp-text-selected"
                        : inMonth ? "text-sp-text" : "text-sp-text-placeholder";
                    return (
                      <span
                        key={d.toISOString()}
                        className={`relative flex items-center justify-center size-8 rounded-[var(--sp-radius-pill)] ${isToday ? "sp-text-medium border border-solid border-sp-brand-fill-normal" : "sp-text-standard"} ${color}`}
                      >
                        {d.getDate()}
                      </span>
                    );
                  })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
