import { useEffect, useRef, useState } from "react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { MenuListItem } from "../molecules/MenuListItem";
import { CalendarRange } from "./CalendarRange";
import { formatRange, type DateRange } from "../utils/date";
import { DATE_PRESETS, matchPreset, shiftRange } from "../utils/datePresets";

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  today?: Date;
}

const box =
  "flex items-center h-8 bg-sp-form-control-background-color border border-solid border-sp-form-control-border-color rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]";

/** ‹ [cal  This week  05.10. – 11.10.2026  ⌄] ›
    Field: "Header Date Spinner" (864:2326) structure in "Input Dropdown Datepicker Textfield" style (8986:1489).
    Popover: preset "Menu List" (253:10890) on the left + "Calendar" Type=Range (884:2259) on the right.
    Presets and the calendar only change a draft (one click = single day, second click = range); "Confirm" (bottom right
    under the calendar) applies it and closes, "Cancel" / Esc / click outside discards it.
    ‹ › step by the range: a day, a week, whole months, or the range length. */
export function DateRangePicker({ value, onChange, today = new Date() }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  /** range being edited in the popover — applied by Confirm */
  const [draft, setDraft] = useState<DateRange>(value);
  const preset = matchPreset(value, today);
  const draftPreset = matchPreset(draft, today);
  const openPicker = () => { setDraft(value); setOpen(true); };

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
      <button type="button" aria-label="Vorheriger Zeitraum" className={`${box} justify-center w-8`} onClick={() => onChange(shiftRange(value, -1))}>
        <Icon name="previous" color="var(--sp-text)" />
      </button>

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${box} gap-[var(--sp-space-2x)] px-[var(--sp-space-2x)]`}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <Icon name="cal" color="var(--sp-text)" />
        {preset && <span className="sp-text-medium text-sp-text whitespace-nowrap">{preset.label}</span>}
        <span className={`whitespace-nowrap ${preset ? "sp-text-standard text-sp-text-label" : "sp-text-medium text-sp-text"}`}>
          {formatRange(value)}
        </span>
        <Icon name="expanded" color="var(--sp-text)" />
      </button>

      <button type="button" aria-label="Nächster Zeitraum" className={`${box} justify-center w-8`} onClick={() => onChange(shiftRange(value, 1))}>
        <Icon name="next" color="var(--sp-text)" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Zeitraum wählen"
          className="absolute right-0 top-[calc(100%+var(--sp-space-1x))] z-20 flex bg-sp-form-control-background-color border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] shadow-[var(--sp-shadow-m)] overflow-hidden"
        >
          {/* Presets — Menu List */}
          <div role="menu" className="flex flex-col w-44 p-[var(--sp-space-2x)] border-0 border-r border-solid border-sp-border-line">
            {DATE_PRESETS.map((p) => (
              <MenuListItem
                key={p.id}
                label={p.label}
                inset
                selected={draftPreset?.id === p.id}
                onClick={() => setDraft(p.range(today))}
              />
            ))}
          </div>

          <div className="flex flex-col">
            {/* Calendar — Range */}
            <CalendarRange bare lang="de" value={draft} today={today} onChange={(r) => setDraft(r)} />
            <div className="flex items-center justify-end gap-[var(--sp-space-2x)] p-[var(--sp-space-3x)] border-0 border-t border-solid border-sp-border-line">
              <Button variant="tertiary" label="Abbrechen" onClick={() => setOpen(false)} />
              <Button variant="primary" label="Bestätigen" onClick={() => { onChange(draft); setOpen(false); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
