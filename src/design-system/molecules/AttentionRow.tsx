import { Icon, type IconName } from "../atoms/Icon";
import { Button } from "../atoms/Button";
import { TONES, cssVar, type Tone } from "../utils/tones";

export interface AttentionRowProps {
  tone: Tone;
  icon: IconName;
  /** status text, e.g. "Overdue" — not shown as a chip; used as hover hint + screen-reader label of the icon tile */
  status: string;
  title: string;
  /** secondary line, e.g. "Overdue since 18.09. 22:00 · Florian Ade" */
  meta: string;
  actionLabel: string;
  onAction?: () => void;
  /** whole row opens the task */
  onOpen?: () => void;
}

/** One "needs attention" item: tone icon tile (colour + icon = status) · title (Roboto Standard Medium)
    · meta (Roboto Small, text font/label) · secondary Button. No status chip.
    Row hover / press use basics/hover · basics/pressed like the library Menu List Item. */
export function AttentionRow({ tone, icon, status, title, meta, actionLabel, onAction, onOpen }: AttentionRowProps) {
  const t = TONES[tone];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
      className="flex items-center gap-[var(--sp-space-3x)] px-[var(--sp-space-2x)] py-[var(--sp-space-3x)] rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      <span
        role="img"
        aria-label={status}
        title={status}
        className="flex items-center justify-center shrink-0 size-8 rounded-[var(--sp-radius-2x)]"
        style={{ background: cssVar(t.bg) }}
      >
        <Icon name={icon} color={cssVar(t.fg)} />
      </span>

      <span className="flex flex-col gap-[var(--sp-space-2x)] flex-1 min-w-0">
        <span className="sp-text-medium text-sp-text truncate">{title}</span>
        <span className="sp-text-small text-sp-text-label truncate">{meta}</span>
      </span>

      <Button
        variant="secondary"
        label={actionLabel}
        onClick={(e) => { e.stopPropagation(); onAction?.(); }}
      />
    </div>
  );
}
