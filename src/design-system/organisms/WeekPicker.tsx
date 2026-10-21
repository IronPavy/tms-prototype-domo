import { useEffect, useRef, useState } from "react";
import { Icon } from "../atoms/Icon";
import { CalendarWeek } from "./CalendarWeek";
import { addDays, formatWeekRange, isoWeek, sameDay, startOfWeek } from "../utils/date";

export interface WeekPickerProps {
  /** Monday of the selected week */
  value: Date;
  onChange: (monday: Date) => void;
  today?: Date;
}

const box =
  "flex items-center h-8 bg-sp-form-control-background-color border border-solid border-sp-form-control-border-color rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]";

/** Week spinner: ‹ [cal  This week  21.09. – 27.09.2026  ⌄] ›
    Structure of Sophi's Pet "Header Date Spinner" (864:2326) in the light
    "Input Dropdown Datepicker Textfield" style (8986:1489, "use Cal icon").
    The field opens the "Calendar" Type=Week. */
export function WeekPicker({ value, onChange, today = new Date() }: WeekPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const monday = startOfWeek(value);
  const isCurrent = sameDay(monday, startOfWeek(today));

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center gap-[var(--sp-space-1x)]">
      <button type="button" aria-label="Vorherige Woche" className={`${box} justify-center w-8`} onClick={() => onChange(addDays(monday, -7))}>
        <Icon name="previous" color="var(--sp-text)" />
      </button>

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${box} gap-[var(--sp-space-2x)] px-[var(--sp-space-2x)]`}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="cal" color="var(--sp-text)" />
        <span className="sp-text-medium text-sp-text whitespace-nowrap">
          {isCurrent ? "This week" : `KW ${isoWeek(monday)}`}
        </span>
        <span className="sp-text-standard text-sp-text-label whitespace-nowrap">{formatWeekRange(monday)}</span>
        <Icon name="expanded" color="var(--sp-text)" />
      </button>

      <button type="button" aria-label="Nächste Woche" className={`${box} justify-center w-8`} onClick={() => onChange(addDays(monday, 7))}>
        <Icon name="next" color="var(--sp-text)" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+var(--sp-space-1x))] z-20">
          <CalendarWeek value={monday} today={today} onChange={(m) => { onChange(m); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}
