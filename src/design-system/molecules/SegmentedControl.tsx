import { useState } from "react";
import { Icon, type IconName } from "../atoms/Icon";
import { Tooltip } from "../atoms/Tooltip";

export interface SegmentOption {
  id: string;
  label?: string;
  icon?: IconName;
  /** greyed out, not selectable (keeps its tooltip) */
  disabled?: boolean;
  /** second tooltip line, e.g. "Demnächst verfügbar" */
  hint?: string;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (id: string) => void;
  /** accessible group name */
  label: string;
  /** SP3 "Show Label" off: icons only — option labels become the tooltip + accessible name */
  iconOnly?: boolean;
}

/** Sophi's Pet 3 "Radio Button Group (Segmented Control)" (2087:6675) + "Radio Button Group Item" (575:4286):
    group 32px · form-control background · 1px form-control-border-color · radius pill · padding 1x · gap 2x.
    Item 24px · padding-inline 2x · radius pill · gap 1x · Roboto Standard/Medium in text
    hover / pressed overlay · selected = brand/fill/normal + brand/on/normal · focus = Focus Brand.
    iconOnly: each icon shows an SP3 Tooltip (label, optional hint line) on hover / focus; disabled items are greyed out (35 %). */
export function SegmentedControl({ options, value, onChange, label, iconOnly }: SegmentedControlProps) {
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  const show = (id: string, el: HTMLElement) => { const r = el.getBoundingClientRect(); setTip({ id, x: r.left + r.width / 2, y: r.top }); };
  const tipOption = tip ? options.find((o) => o.id === tip.id) : undefined;
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center h-8 p-[var(--sp-space-1x)] gap-[var(--sp-space-2x)] bg-sp-form-control-background-color border border-solid border-sp-form-control-border-color rounded-[var(--sp-radius-pill)]">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label && !iconOnly ? undefined : `${o.label ?? o.id}${o.hint ? ` — ${o.hint}` : ""}`}
            aria-disabled={o.disabled || undefined}
            onMouseEnter={iconOnly ? (e) => show(o.id, e.currentTarget) : undefined}
            onMouseLeave={iconOnly ? () => setTip(null) : undefined}
            onFocus={iconOnly ? (e) => show(o.id, e.currentTarget) : undefined}
            onBlur={iconOnly ? () => setTip(null) : undefined}
            onClick={() => { if (!o.disabled) onChange(o.id); }}
            className={`inline-flex items-center gap-[var(--sp-space-1x)] h-6 px-[var(--sp-space-2x)] border-0 rounded-[var(--sp-radius-pill)] ${o.disabled ? "cursor-default opacity-35" : "cursor-pointer"} sp-text-medium whitespace-nowrap outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${
              on ? "bg-sp-brand-fill-normal text-sp-brand-on-normal" : `bg-transparent text-sp-text ${o.disabled ? "" : "sp-interactive"}`
            }`}
          >
            {o.icon && <Icon name={o.icon} color={on ? "var(--sp-brand-on-normal)" : "var(--sp-icon)"} />}
            {!iconOnly && o.label}
          </button>
        );
      })}
      {iconOnly && tip && tipOption && (
        <span className="fixed z-50 -translate-x-1/2 -translate-y-full" style={{ left: tip.x, top: tip.y - 4 }}>
          <Tooltip>
            {tipOption.label}
            {tipOption.hint && <><br />{tipOption.hint}</>}
          </Tooltip>
        </span>
      )}
    </div>
  );
}
