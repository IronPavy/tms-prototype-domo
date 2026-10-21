import { Icon, type IconName } from "../atoms/Icon";
import { TONES, type Tone } from "../utils/tones";

/** Colour family of the card — see utils/tones.ts */
export type StatTone = Tone;
const TONE = TONES;

export interface StatCardProps {
  icon: IconName;
  tone: StatTone;
  value: number;
  label: string;
  /** number of people — shown with the user_group icon */
  people?: number;
  /** Card Tile State=selected (e.g. active filter) */
  selected?: boolean;
  onClick?: () => void;
}

/** States: normal · hover (Shadow M + tone stroke) · pressed (selected fill, no shadow). In the prototype a click opens Tasks filtered by this status.
    KPI card on Sophi's Pet 3 "Card" (497:3227), Filled=Yes, Outlined=true, Interactive:
    surface/raised · radius 3x · padding 4x · 1px border (line), switching to the tone border/light on hover / selected.
    Hover = Shadow M + tone stroke (project choice: no hover overlay on KPI cards); selected = selected.
    Icon tile + value (Title/H1) + label (Roboto Standard, text label) + people (Roboto Small). */
export function StatCard({ icon, tone, value, label, people, selected, onClick }: StatCardProps) {
  const t = TONE[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected === undefined ? undefined : selected}
      className={`flex items-center gap-[var(--sp-space-4x)] w-full min-w-0 p-[var(--sp-space-4x)] border border-solid text-left rounded-[var(--sp-radius-3x)] cursor-pointer outline-none transition-[box-shadow,border-color] duration-150 hover:shadow-[var(--sp-shadow-m)] hover:border-[var(--stat-tone-border)] focus-visible:shadow-[var(--sp-focus-brand)] active:bg-sp-selected active:shadow-none ${selected ? "bg-sp-selected border-[var(--stat-tone-border)]" : "bg-sp-surface-raised border-sp-border-line"}`}
      style={{ ["--stat-tone-border" as string]: `var(${t.border})` }}
    >
      <span
        className="flex items-center justify-center shrink-0 size-12 rounded-[var(--sp-radius-3x)]"
        style={{ background: `var(${t.bg})` }}
      >
        <Icon name={icon} size={24} color={`var(${t.fg})`} />
      </span>

      <span className="flex flex-col gap-[var(--sp-space-2x)] min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-[var(--sp-space-2x)] gap-y-[var(--sp-space-1x)] min-w-0">
          <span className="sp-title-h1 text-sp-text">{value}</span>
          <span className="sp-text-standard text-sp-text-label">{label}</span>
        </span>
        {people !== undefined && (
          <span className="flex items-center gap-[var(--sp-space-1x)] sp-text-small text-sp-text-label" title={`${people} people`}>
            <Icon name="user_group" color="var(--sp-text-label)" />
            {people}
          </span>
        )}
      </span>
    </button>
  );
}
