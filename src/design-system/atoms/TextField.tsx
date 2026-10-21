import type { ReactNode, Ref } from "react";

export interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** textarea instead of a single line */
  multiline?: boolean;
  rows?: number;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  type?: "text" | "date" | "time";
  maxLength?: number;
  autoFocus?: boolean;
  onBlur?: () => void;
  /** Enter pressed in a single-line field */
  onEnter?: () => void;
  inputRef?: Ref<HTMLInputElement & HTMLTextAreaElement>;
  /** trailing slot (icon button, e.g. attachment) */
  end?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** Sophi's Pet 3 "Input" (text field / text area): form-control background + 1px form-control-border-color
    (danger border when invalid) · radius 2x · padding 2x · Roboto Standard, placeholder in italic text/placeholder ·
    32px high (text area: rows) · hover overlay · focus = Focus Brand. */
export function TextField({ value, onChange, placeholder, multiline, rows = 3, invalid, disabled, id, type = "text", maxLength, autoFocus, onBlur, onEnter, inputRef, end, className = "", ...rest }: TextFieldProps) {
  const shared = {
    id,
    disabled,
    value,
    placeholder,
    maxLength,
    autoFocus,
    onBlur,
    onKeyDown: onEnter ? (e: { key: string; preventDefault: () => void }) => { if (e.key === "Enter") { e.preventDefault(); onEnter(); } } : undefined,
    "aria-invalid": invalid || undefined,
    "aria-label": rest["aria-label"],
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    className: `flex-1 min-w-0 w-full p-0 border-0 bg-transparent outline-none resize-none sp-text-standard text-sp-text placeholder:italic placeholder:text-sp-text-placeholder`,
  };
  return (
    <div
      className={`flex gap-[var(--sp-space-2x)] ${multiline ? "items-start py-[var(--sp-space-2x)]" : "items-center h-8"} px-[var(--sp-space-2x)] bg-sp-form-control-background-color sp-interactive border border-solid rounded-[var(--sp-radius-2x)] focus-within:shadow-[var(--sp-focus-brand)] cursor-text min-w-[var(--tms-field-min-width)] ${disabled ? "opacity-35 pointer-events-none" : ""} ${
        invalid ? "border-sp-danger-on-surface" : "border-sp-form-control-border-color"
      } ${className}`}
    >
      {multiline
        ? <textarea rows={rows} ref={inputRef} {...shared} style={{ minHeight: "var(--tms-textarea-min-height)", maxHeight: "var(--tms-textarea-max-height)", overflowY: "auto", fieldSizing: "content" } as React.CSSProperties} />
        : <input type={type} ref={inputRef} {...shared} />}
      {end}
    </div>
  );
}
