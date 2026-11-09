import { useState } from "react";
import { Icon } from "../atoms/Icon";
import { Tooltip } from "../atoms/Tooltip";

export type CheckState = "none" | "some" | "all";

export interface RowSelectBoxProps {
  checked: boolean;
  /** half-filled box (day / "select all" with only some of its tasks ticked) */
  partial?: boolean;
  onChange: () => void;
  /** accessible name, e.g. "Aufgabe „…“ auswählen" */
  label: string;
  /** not selectable — 35% opacity, the tooltip says why */
  disabled?: boolean;
  disabledHint?: string;
  /** normal list: show the delete icon (red on hover) — a click starts the selection mode with this row ticked */
  trash?: boolean;
}

/** Selection control at the end of a task row / day header (32px, clicks never open the task behind it):
    `trash` = Sophis `delete` icon (red on hover / focus, Tooltip "Aufgabe löschen") · otherwise the SP3 Checkbox box (Sophis `checkbox` /
    `checkbox_tristate` / `checkbox_active_filled`, brand when (partly) checked) · hover overlay · Focus Brand ·
    disabled = 35% + SP3 Tooltip with the reason. */
export function RowSelectBox({ checked, partial, onChange, label, disabled, disabledHint, trash }: RowSelectBoxProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [hot, setHot] = useState(false);
  const tip = disabled ? disabledHint : trash ? "Aufgabe löschen" : undefined;
  const show = (el: HTMLElement) => { setHot(true); if (!tip) return; const r = el.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top }); };
  const hide = () => { setPos(null); setHot(false); };
  const on = checked || partial;
  return (
    <span className="flex justify-end" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        {...(trash ? {} : { role: "checkbox", "aria-checked": partial && !checked ? ("mixed" as const) : checked })}
        aria-label={label}
        aria-disabled={disabled || undefined}
        onClick={() => { if (!disabled) onChange(); }}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={hide}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={hide}
        className={`relative flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${disabled ? "cursor-default" : "cursor-pointer sp-interactive"}`}
      >
        <span className={`flex ${disabled ? "opacity-35" : ""}`}>
          {trash ? (
            <Icon name="delete" size={20} color={hot && !disabled ? "var(--sp-danger-on-surface)" : "var(--sp-icon)"} />
          ) : (
            <Icon name={checked ? "checkbox_active_filled" : partial ? "checkbox_tristate" : "checkbox"} size={24} color={on ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />
          )}
        </span>
        {pos && tip && (
          <span className="fixed z-50 -translate-x-1/2 -translate-y-full" style={{ left: pos.x, top: pos.y - 4 }}>
            <Tooltip>{tip}</Tooltip>
          </span>
        )}
      </button>
    </span>
  );
}
