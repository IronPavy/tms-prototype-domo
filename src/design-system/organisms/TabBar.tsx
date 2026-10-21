import { StatusChip } from "../atoms/StatusChip";
import type { Tone } from "../utils/tones";

export interface TabDef {
  id: string;
  label: string;
  /** badge chip (library "Show Badge Chip") */
  count?: number;
  /** chip tone — default grey; e.g. "error" for drafts that need finishing */
  countTone?: Tone;
}

export interface TabBarProps {
  tabs: TabDef[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}

/** Sophi's Pet 3 "Tab Item" (2101:6940), Appearance=Plain, Placement=Top (36px · padding 6 / 2x · gap 2x · 2px bottom stroke):
    normal  — Roboto Standard in text, stroke border (line)
    hover / pressed — overlay
    active  — selected background, brand/fill/normal stroke, Roboto Medium in text-selected.
    The bar draws the 1px border (line) base line the tabs sit on. */
export function TabBar({ tabs, value, onChange, label }: TabBarProps) {
  const move = (dir: 1 | -1) => {
    const i = tabs.findIndex((t) => t.id === value);
    onChange(tabs[(i + dir + tabs.length) % tabs.length].id);
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={(e) => { if (e.key === "ArrowRight") move(1); if (e.key === "ArrowLeft") move(-1); }}
      className="flex items-end border-0 border-b border-solid border-sp-border-line"
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-[var(--sp-space-2x)] h-9 -mb-px py-[var(--tms-space-6px)] px-[var(--sp-space-2x)] border-0 border-b-2 border-solid rounded-t-[var(--sp-radius-2x)] cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${
              active
                ? "bg-sp-selected border-sp-brand-fill-normal sp-text-medium text-sp-text-selected"
                : "bg-transparent border-sp-border-line sp-text-standard text-sp-text sp-interactive"
            }`}
          >
            {t.label}
            {t.count !== undefined && <StatusChip tone={t.countTone ?? "default"} label={String(t.count)} />}
          </button>
        );
      })}
    </div>
  );
}
