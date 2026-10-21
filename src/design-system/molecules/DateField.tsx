import { useEffect, useRef, useState } from "react";
import { Icon } from "../atoms/Icon";
import { CalendarRange } from "../organisms/CalendarRange";
import { fromInputDate, longDate, toInputDate } from "../utils/due";
import { Popover } from "./Popover";

export interface DateFieldProps {
  /** yyyy-mm-dd, "" = empty */
  value: string;
  onChange: (value: string) => void;
  /** shown when empty, e.g. "no end" */
  placeholder?: string;
  /** × button that empties the field */
  clearable?: boolean;
  invalid?: boolean;
  id?: string;
  today?: Date;
  "aria-label"?: string;
}

/** Date input: 32px field (form-control style, min 120) showing "12.10.2026" + calendar icon; click opens the single-day
    Calendar (fixed 280 wide) in a floating popover below it — it never adds a scrollbar to the dialog. */
export function DateField({ value, onChange, placeholder = "Choose date", clearable, invalid, id, today = new Date(), ...rest }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const day = value ? fromInputDate(value) : today;
  return (
    <div ref={ref} className="relative min-w-[var(--tms-field-min-width)]" onKeyDown={(e) => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); } }}>
      <div
        ref={fieldRef}
        className={`flex items-center h-8 gap-[var(--sp-space-1x)] pl-[var(--sp-space-2x)] pr-[var(--sp-space-1x)] bg-sp-form-control-background-color sp-interactive border border-solid rounded-[var(--sp-radius-2x)] focus-within:shadow-[var(--sp-focus-brand)] ${
          invalid ? "border-sp-danger-on-surface" : open ? "border-sp-brand-border-normal" : "border-sp-form-control-border-color"
        }`}
      >
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={rest["aria-label"]}
          onClick={() => setOpen((o) => !o)}
          className={`flex-1 min-w-0 h-full p-0 border-0 bg-transparent text-left cursor-pointer outline-none sp-text-standard ${value ? "text-sp-text" : "italic text-sp-text-placeholder"}`}
        >
          {value ? longDate(value) : placeholder}
        </button>
        {clearable && value && (
          <button type="button" aria-label="Clear date" onClick={() => onChange("")} className="flex items-center justify-center size-6 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]">
            <Icon name="close" color="var(--sp-icon)" />
          </button>
        )}
        <Icon name="cal" color="var(--sp-icon)" className="mr-[var(--sp-space-1x)]" />
      </div>
      <Popover
        open={open}
        anchorRef={fieldRef}
        panelRef={panelRef}
        role="dialog"
        aria-label="Choose date"
        className="shadow-[var(--sp-shadow-m)] rounded-[var(--sp-radius-2x)]"
      >
        <CalendarRange single value={{ start: day, end: day }} today={today} onChange={(r) => { onChange(toInputDate(r.start)); setOpen(false); }} />
      </Popover>
    </div>
  );
}
