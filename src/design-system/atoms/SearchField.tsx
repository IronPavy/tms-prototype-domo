import { Icon } from "./Icon";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Enter pressed */
  onEnter?: () => void;
  /** the X was clicked (default: onChange("")) */
  onClear?: () => void;
  maxLength?: number;
  clearLabel?: string;
  className?: string;
}

/** Sophi's Pet 3 "Search" (172:2309), Density=Default: 32px · padding-inline 2x · gap 1x · radius pill ·
    form-control background + 1px form-control-border-color · hover overlay · focus = Focus Brand.
    Search icon (icon) · Roboto Standard text, placeholder colour for the placeholder · clear button when filled. */
export function SearchField({ value, onChange, placeholder = "Search", onEnter, onClear, maxLength, clearLabel = "Clear search", className = "" }: SearchFieldProps) {
  return (
    <label className={`flex items-center h-8 gap-[var(--sp-space-1x)] px-[var(--sp-space-2x)] bg-sp-form-control-background-color sp-interactive border border-solid border-sp-form-control-border-color rounded-[var(--sp-radius-pill)] focus-within:shadow-[var(--sp-focus-brand)] cursor-text ${className}`}>
      <Icon name="search" color="var(--sp-icon)" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-0 h-full p-0 border-0 bg-transparent outline-none sp-text-standard text-sp-text placeholder:text-sp-text-placeholder [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" aria-label={clearLabel} onClick={() => (onClear ? onClear() : onChange(""))} className="flex p-0 border-0 bg-transparent cursor-pointer rounded-[var(--sp-radius-pill)] outline-none focus-visible:shadow-[var(--sp-focus-brand)]">
          <Icon name="close" color="var(--sp-icon)" />
        </button>
      )}
    </label>
  );
}
