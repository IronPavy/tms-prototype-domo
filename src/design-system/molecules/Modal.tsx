import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../atoms/Icon";

export interface ModalProps {
  title: string;
  /** Esc, X and backdrop all call this */
  onClose: () => void;
  /** sticky button toolbar */
  footer?: ReactNode;
  children: ReactNode;
  /** max width, px — default `--tms-modal-max-width` (672); the dialog hugs its content up to this width */
  width?: number;
  /** min width, px — default `--tms-modal-min-width` (360); never wider than the screen */
  minWidth?: number;
  /** arrow button left of the title (a dialog opened from another dialog) */
  onBack?: () => void;
  /** heading under the title (Roboto Medium, text label) */
  subtitle?: ReactNode;
  /** title size: "h1" (SP3 Title/H1, default) or "h3" (Title/H3 Group Title — smaller, e.g. task detail) */
  titleSize?: "h1" | "h3";
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Dialog on a dimmed backdrop: surface/default · radius 3x · shadow M · padding 5x · gap 4x.
    Header = Title H1 (text title) + close button; body scrolls; footer sticks to the bottom.
    aria-modal, focus trap, Esc closes, focus returns to the opener. Full width on narrow screens. */
export function Modal({ title, onClose, footer, children, width, minWidth, onBack, subtitle, titleSize = "h1" }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = ref.current!;
    // first empty field, else first focusable control
    const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((e) => e.getAttribute("aria-label") !== "Close");
    (items.find((e) => (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) && !e.value) ?? items[0])?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== "Tab") return;
      const f = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); opener?.focus?.(); };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[var(--sp-space-4x)] bg-black/50"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          maxWidth: `min(${width ? width + "px" : "var(--tms-modal-max-width)"}, 100%)`,
          minWidth: `min(${minWidth ?? "var(--tms-modal-min-width)"}${minWidth ? "px" : ""}, 100%)`,
        }}
        className="flex flex-col w-fit max-h-full bg-sp-surface-default rounded-[var(--sp-radius-3x)] shadow-[var(--sp-shadow-m)] overflow-hidden"
      >
        <div className="flex items-start justify-between gap-[var(--sp-space-4x)] px-[var(--sp-space-5x)] pt-[var(--sp-space-5x)] pb-[var(--sp-space-3x)]">
          <div className="flex flex-col gap-[var(--sp-space-3x)] min-w-0">
            <div className="flex items-center gap-[var(--sp-space-2x)]">
              {onBack && (
                <button
                  type="button"
                  aria-label="Back"
                  onClick={onBack}
                  className="flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
                >
                  <Icon name="left" size={24} color="var(--sp-icon)" />
                </button>
              )}
              <h2 className={`${titleSize === "h3" ? "sp-title-h3" : "sp-title-h1"} m-0 text-sp-text-title`}>{title}</h2>
            </div>
            {subtitle && <div className="flex items-center gap-[var(--sp-space-2x)] sp-text-medium text-sp-text-label">{subtitle}</div>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
          >
            <Icon name="close" color="var(--sp-brand-on-surface)" />
          </button>
        </div>
        <div className="flex flex-col gap-[var(--sp-space-4x)] px-[var(--sp-space-5x)] py-[var(--sp-space-2x)] overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-[var(--sp-space-2x)] px-[var(--sp-space-5x)] py-[var(--sp-space-4x)]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
