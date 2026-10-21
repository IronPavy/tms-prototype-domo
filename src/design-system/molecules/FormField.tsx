import type { ReactNode } from "react";
import { Icon } from "../atoms/Icon";

export interface FormFieldProps {
  label: string;
  required?: boolean;
  /** inline error (danger) — replaces the hint */
  error?: string;
  hint?: string;
  /** id of the control, links the label */
  htmlFor?: string;
  children: ReactNode;
}

/** Label (Roboto Standard, text) + required "*" above the control, hint (Small, text label) or inline error
    (Small, danger on/surface with warning icon) below. gap 1x. */
export function FormField({ label, required, error, hint, htmlFor, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-[var(--sp-space-1x)]">
      <label htmlFor={htmlFor} className="sp-text-standard text-sp-text">
        {label}{required && <span aria-hidden> *</span>}
      </label>
      {children}
      {error ? (
        <span role="alert" className="flex items-center gap-[var(--sp-space-1x)] sp-text-small text-sp-danger-on-surface">
          <Icon name="warning" color="var(--sp-danger-on-surface)" />{error}
        </span>
      ) : hint ? (
        <span className="sp-text-small text-sp-text-label">{hint}</span>
      ) : null}
    </div>
  );
}
