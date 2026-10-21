import { Icon } from "../atoms/Icon";
import { Button } from "../atoms/Button";

export interface ToastProps {
  message: string;
  /** text buttons on the right, e.g. View / Undo */
  actions?: { label: string; onClick: () => void }[];
  onClose: () => void;
}

/** Notification toast: surface/raised · radius 3x · shadow M · success icon + Roboto Standard message · plain Buttons · close.
    role=status (polite). Placed bottom-centre by the host. */
export function Toast({ message, actions, onClose }: ToastProps) {
  return (
    <div
      role="status"
      className="flex items-center min-w-[var(--tms-toast-min-width)] max-w-[var(--tms-toast-max-width)] gap-[var(--sp-space-3x)] min-h-12 py-[var(--sp-space-2x)] pl-[var(--sp-space-4x)] pr-[var(--sp-space-2x)] bg-sp-surface-raised border border-solid border-sp-success-border-light rounded-[var(--sp-radius-3x)] shadow-[var(--sp-shadow-m)]"
    >
      <Icon name="check_circle_filled" size={20} color="var(--sp-success-on-surface)" />
      <span className="flex-1 min-w-0 sp-text-standard text-sp-text">{message}</span>
      <span className="flex items-center gap-[var(--sp-space-1x)]">
        {actions?.map((a) => <Button key={a.label} variant="tertiary" label={a.label} onClick={a.onClick} />)}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          className="flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
        >
          <Icon name="close" color="var(--sp-icon)" />
        </button>
      </span>
    </div>
  );
}
