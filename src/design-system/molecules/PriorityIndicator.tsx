import { Icon } from "../atoms/Icon";
import { IconHint } from "./IconHint";

export interface PriorityIndicatorProps {
  /** tooltip text */
  label?: string;
}

/** High-priority marker next to a task title: Sophis "priority" icon (exclamation mark, 12px, danger/on/surface)
    in a 20px circle — danger/fill/light + 1px danger/border/light, radius pill; hover = danger/border/light fill.
    Hover or keyboard focus shows a danger Tooltip (IconHint). */
export function PriorityIndicator({ label = "Priorität" }: PriorityIndicatorProps) {
  return (
    <IconHint
      label={label}
      type="error"
      className="size-5 rounded-[var(--sp-radius-pill)] bg-sp-danger-fill-light border border-solid border-sp-danger-border-light focus-visible:shadow-[var(--sp-focus-danger)] transition-[background-color] duration-100 hover:bg-sp-danger-border-light"
    >
      <Icon name="priority" size={12} color="var(--sp-danger-on-surface)" />
    </IconHint>
  );
}
