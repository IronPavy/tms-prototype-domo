import { useEffect, useRef, useState } from "react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { MenuListItem } from "../molecules/MenuListItem";
import { CalendarRange } from "./CalendarRange";
import { clampRange, diffDays, formatRange, sameRange, type DateRange } from "../utils/date";
import { ALL_DAYS_LABEL, DATE_PRESETS, shiftRange, type RangeKind } from "../utils/datePresets";

export interface DateRangePickerProps {
  /** `null` = "Alle Tage" (no date filter) — only with `allowAll` */
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  today?: Date;
  /** last selectable day (e.g. today: the future is disabled) — presets end there, ‹ › and the calendar stop there */
  maxDate?: Date;
  /** offers "Alle Tage" on top of the presets (value `null`): no days highlighted, both arrows disabled */
  allowAll?: boolean;
  /** the chip shows only the dates ("02.10. – 16.10.2026"), not the preset name */
  dateOnly?: boolean;
}

const box =
  "flex items-center h-8 bg-sp-form-control-background-color border border-solid border-sp-form-control-border-color rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]";

/** ‹ [cal  This week  05.10. – 11.10.2026  ⌄] ›
    Field: "Header Date Spinner" (864:2326) structure in "Input Dropdown Datepicker Textfield" style (8986:1489).
    Popover: preset "Menu List" (253:10890) on the left + "Calendar" Type=Range (884:2259) on the right.
    Presets and the calendar only change a draft (one click = single day, second click = range); "Bestätigen" (bottom right
    under the calendar) applies it and closes, "Abbrechen" / Esc / click outside discards it.
    A preset click shows its month in the calendar. ‹ › apply at once and step by the range kind (see `shiftRange`). */
export function DateRangePicker({ value, onChange, today = new Date(), maxDate, allowAll, dateOnly }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  /** range being edited in the popover — applied by Bestätigen */
  const [draft, setDraft] = useState<DateRange | null>(value);
  /** remounts the calendar (fresh month + selection) on open and on a preset click */
  const [calKey, setCalKey] = useState(0);
  /** step unit of the applied / draft range, set by a preset (day / week / month); a calendar pick clears it */
  const [kind, setKind] = useState<RangeKind | undefined>();
  const [draftKind, setDraftKind] = useState<RangeKind | undefined>();
  const presetRange = (p: (typeof DATE_PRESETS)[number]) => (maxDate ? clampRange(p.range(today), maxDate) : p.range(today));
  // several presets can give the same range (on a Monday "Diese Woche" = "Heute") — prefer the one of the same kind
  const find = (r: DateRange | null, k?: RangeKind) => {
    if (!r) return undefined;
    const hits = DATE_PRESETS.filter((p) => sameRange(presetRange(p), r));
    return hits.find((p) => p.kind === k) ?? hits[0];
  };
  const preset = find(value, kind);
  const draftPreset = find(draft, draftKind);
  const all = !value;
  const atEnd = all || (!!maxDate && diffDays(maxDate, value.end) >= 0);
  const step = (dir: 1 | -1) => { if (value) onChange(shiftRange(value, dir, maxDate, kind)); };
  const openPicker = () => { setDraft(value); setDraftKind(kind); setCalKey((k) => k + 1); setOpen(true); };
  const pickDraft = (r: DateRange | null, k?: RangeKind) => { setDraft(r); setDraftKind(k); setCalKey((c) => c + 1); };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  const arrow = (disabled: boolean) => `${box} justify-center w-8 ${disabled ? "opacity-40 cursor-not-allowed" : ""}`;

  return (
    <div ref={ref} className="relative flex items-center gap-[var(--sp-space-1x)]">
      <button type="button" aria-label="Vorheriger Zeitraum" disabled={all} className={arrow(all)} onClick={() => step(-1)}>
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
        {all ? (
          <span className="sp-text-medium text-sp-text whitespace-nowrap">{ALL_DAYS_LABEL}</span>
        ) : (
          <>
            {preset && !dateOnly && <span className="sp-text-medium text-sp-text whitespace-nowrap">{preset.label}</span>}
            <span className={`whitespace-nowrap ${preset && !dateOnly ? "sp-text-standard text-sp-text-label" : "sp-text-medium text-sp-text"}`}>
              {formatRange(value)}
            </span>
          </>
        )}
        <Icon name="expanded" color="var(--sp-text)" />
      </button>

      <button type="button" aria-label="Nächster Zeitraum" disabled={atEnd} className={arrow(atEnd)} onClick={() => step(1)}>
        <Icon name="next" color="var(--sp-text)" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Zeitraum wählen"
          className="absolute right-0 top-[calc(100%+var(--sp-space-1x))] z-20 flex bg-sp-form-control-background-color border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] shadow-[var(--sp-shadow-m)] overflow-hidden"
        >
          {/* Presets — Menu List ("Alle Tage" on top) */}
          <div role="menu" className="flex flex-col w-44 p-[var(--sp-space-2x)] border-0 border-r border-solid border-sp-border-line">
            {allowAll && <MenuListItem label={ALL_DAYS_LABEL} inset selected={!draft} onClick={() => pickDraft(null)} />}
            {DATE_PRESETS.map((p) => (
              <MenuListItem
                key={p.id}
                label={p.label}
                inset
                selected={draftPreset?.id === p.id}
                onClick={() => pickDraft(presetRange(p), p.kind)}
              />
            ))}
          </div>

          <div className="flex flex-col">
            {/* Calendar — Range */}
            <CalendarRange key={calKey} bare lang="de" value={draft} today={today} maxDate={maxDate} onChange={(r) => { setDraft(r); setDraftKind(undefined); }} />
            <div className="flex items-center justify-end gap-[var(--sp-space-2x)] p-[var(--sp-space-3x)] border-0 border-t border-solid border-sp-border-line">
              <Button variant="tertiary" label="Abbrechen" onClick={() => setOpen(false)} />
              <Button variant="primary" label="Bestätigen" onClick={() => { onChange(draft); setKind(draftKind); setOpen(false); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
