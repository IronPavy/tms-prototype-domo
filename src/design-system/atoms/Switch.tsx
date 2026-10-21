export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** one line under the label */
  hint?: string;
}

/** Sophi's Pet 3 "Switch basic": 30×16 track (on = brand/fill/normal, off = form-control border outline) with a 12px thumb,
    label in Roboto Standard text to the right · hover overlay · focus = Focus Brand. */
export function Switch({ checked, onChange, label, hint }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-[var(--sp-space-2x)] p-0 border-0 bg-transparent text-left cursor-pointer rounded-[var(--sp-radius-2x)] outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      <span
        className={`relative shrink-0 w-[30px] h-4 mt-px rounded-[var(--sp-radius-pill)] border border-solid transition-colors ${
          checked ? "bg-sp-brand-fill-normal border-sp-brand-fill-normal" : "bg-sp-form-control-background-color border-sp-form-control-border-color"
        }`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 size-[10px] rounded-full transition-all ${checked ? "left-[17px] bg-sp-brand-on-normal" : "left-[2px] bg-sp-icon"}`}
        />
      </span>
      <span className="flex flex-col gap-[var(--sp-space-1x)]">
        <span className="sp-text-standard text-sp-text">{label}</span>
        {hint && <span className="sp-text-small text-sp-text-label">{hint}</span>}
      </span>
    </button>
  );
}
