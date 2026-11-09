import { useState } from "react";
import { Icon } from "../atoms/Icon";
import { Tooltip } from "../atoms/Tooltip";

export interface RowSelectBoxProps {
  checked: boolean;
  onChange: () => void;
  /** accessible name, e.g. "Aufgabe „…“ auswählen" */
  label: string;
  /** not selectable — 35% opacity, the tooltip says why */
  disabled?: boolean;
  disabledHint?: string;
}

/** Select checkbox at the end of a task row (replaces the delete icon): 32px button with the SP3 Checkbox box (Sophis `checkbox` /
    `checkbox_active_filled`, brand when checked) · hover overlay · Focus Brand · disabled = 35% + SP3 Tooltip with the reason.
    Clicks never open the task behind it. */
export function RowSelectBox({ checked, onChange, label, disabled, disabledHint }: RowSelectBoxProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const show = (el: HTMLElement) => { if (!disabled || !disabledHint) return; const r = el.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top }); };
  return (
    <span className="flex justify-end" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={() => { if (!disabled) onChange(); }}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={() => setPos(null)}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setPos(null)}
        className={`relative flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${disabled ? "cursor-default" : "cursor-pointer sp-interactive"}`}
      >
        <span className={`flex ${disabled ? "opacity-35" : ""}`}>
          <Icon name={checked ? "checkbox_active_filled" : "checkbox"} size={24} color={checked ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />
        </span>
        {pos && (
          <span className="fixed z-50 -translate-x-1/2 -translate-y-full" style={{ left: pos.x, top: pos.y - 4 }}>
            <Tooltip>{disabledHint}</Tooltip>
          </span>
        )}
      </button>
    </span>
  );
}
