import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "../atoms/Icon";
import { Popover } from "./Popover";

export interface MultiSelectOption { id: string; label: string }

export interface MultiSelectDropdownProps {
  /** accessible name of the dropdown, "Location" */
  label: string;
  /** 16px leading icon */
  icon: IconName;
  options: MultiSelectOption[];
  /** selected ids — empty = nothing narrowed down ("All") */
  value: string[];
  onChange: (value: string[]) => void;
  /** text for the empty selection and the first menu row, "All locations" */
  allLabel: string;
  className?: string;
}

/** Compact multi-select dropdown (fixed 160px wide — never resizes with the selection), "Input Dropdown" style (same 32px box as the Date Range Picker field):
    [icon  All locations ⌄] — shows the first pick + "+N" when several are selected.
    Popover: "Dropdown Item"s (32px, 2x padding) — first row = all (selected while nothing is narrowed down),
    then one row per option with a checkbox (brand when checked). Stays open while ticking; closes on Esc / outside click. */
export function MultiSelectDropdown({ label, icon, options, value, onChange, allLabel, className = "" }: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  const picked = options.filter((o) => value.includes(o.id));
  const text = !picked.length ? allLabel : picked[0].label;
  const toggle = (id: string) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(next.length >= options.length ? [] : next);
  };

  const row =
    "flex items-center w-full h-8 min-h-8 p-[var(--sp-space-2x)] gap-[var(--sp-space-2x)] border-0 rounded-[var(--sp-radius-2x)] text-left cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)]";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        aria-label={`${label}: ${text}${picked.length > 1 ? ` +${picked.length - 1}` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-[var(--sp-space-2x)] h-8 w-40 px-[var(--sp-space-2x)] bg-sp-form-control-background-color border border-solid border-sp-form-control-border-color rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
      >
        <Icon name={icon} color="var(--sp-text)" />
        <span className={`flex-1 min-w-0 text-left truncate whitespace-nowrap ${picked.length ? "sp-text-medium" : "sp-text-standard"} text-sp-text`}>{text}</span>
        {picked.length > 1 && (
          <span className="shrink-0 inline-flex items-center h-5 px-[var(--tms-space-6px)] rounded-[var(--sp-radius-pill)] bg-sp-brand-fill-normal sp-text-small-medium text-sp-brand-on-normal">
            +{picked.length - 1}
          </span>
        )}
        <Icon name="expanded" color="var(--sp-text)" />
      </button>

      <Popover
        open={open}
        anchorRef={btnRef}
        panelRef={panelRef}
        minWidth={192}
        maxHeight={320}
        role="menu"
        aria-label={label}
        className="flex flex-col overflow-y-auto p-[var(--sp-space-2x)] bg-sp-form-control-background-color border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] shadow-[var(--sp-shadow-m)]"
      >
          <button
            type="button"
            role="menuitemradio"
            aria-checked={!picked.length}
            onClick={() => onChange([])}
            className={`${row} ${!picked.length ? "bg-sp-selected" : "bg-transparent sp-interactive"}`}
          >
            <span className={`flex-1 min-w-0 truncate leading-none ${!picked.length ? "sp-text-medium text-sp-text-selected" : "sp-text-standard text-sp-text"}`}>{allLabel}</span>
            {!picked.length && <Icon name="check" color="var(--sp-brand-on-surface)" />}
          </button>
          <hr className="my-[var(--sp-space-1x)] border-0 border-t border-solid border-sp-border-line" />
          {options.map((o) => {
            const on = value.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => toggle(o.id)}
                className={`${row} bg-transparent sp-interactive`}
              >
                <Icon name={on ? "checkbox_active_filled" : "checkbox"} color={on ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />
                <span className={`flex-1 min-w-0 truncate leading-none text-sp-text ${on ? "sp-text-medium" : "sp-text-standard"}`}>{o.label}</span>
              </button>
            );
          })}
      </Popover>
    </div>
  );
}
