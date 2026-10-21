import { useEffect, useRef, useState } from "react";
import { Icon } from "../atoms/Icon";
import { MenuListItem } from "./MenuListItem";
import { Popover } from "./Popover";

export interface SelectFieldProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  id?: string;
  "aria-label"?: string;
}

/** Single-select "Input Dropdown": 32px field (form-control background / border, radius 2x, chevron) with a popover of
    "Dropdown Item"s (selected = selected background + check) — as wide as the field (min 176, max height 240, then it scrolls),
    floating above dialogs so it never adds a scrollbar. Closes on pick, Esc (only the popover) and outside click. */
export function SelectField<T extends string>({ options, value, onChange, id, ...rest }: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
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

  return (
    <div ref={ref} className="relative" onKeyDown={(e) => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); } }}>
      <button
        ref={btnRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest["aria-label"]}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center w-full min-w-[var(--tms-field-min-width)] h-8 gap-[var(--sp-space-2x)] px-[var(--sp-space-2x)] bg-sp-form-control-background-color sp-interactive border border-solid rounded-[var(--sp-radius-2x)] text-left cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${
          open ? "border-sp-brand-border-normal" : "border-sp-form-control-border-color"
        }`}
      >
        <span className="flex-1 min-w-0 truncate sp-text-standard text-sp-text">{options.find((o) => o.id === value)?.label}</span>
        <Icon name="expanded" color="var(--sp-text)" className={open ? "rotate-180" : ""} />
      </button>
      <Popover
        open={open}
        anchorRef={btnRef}
        panelRef={panelRef}
        matchWidth
        minWidth={176}
        maxHeight={240}
        role="listbox"
        className="flex flex-col overflow-y-auto p-[var(--sp-space-1x)] bg-sp-form-control-background-color border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] shadow-[var(--sp-shadow-m)]"
      >
        {options.map((o) => (
          <MenuListItem key={o.id} inset label={o.label} selected={o.id === value} onClick={() => { onChange(o.id); setOpen(false); }} />
        ))}
      </Popover>
    </div>
  );
}
