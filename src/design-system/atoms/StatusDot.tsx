import { TONES, cssVar, type Tone } from "../utils/tones";

export interface StatusDotProps {
  /** a tone uses its accent; omit = not started (basics/slider-background) */
  tone?: Tone;
  /** screen-reader + hover text, e.g. "Done" */
  label: string;
}

/** 8px status dot — not a library component, built from tokens:
    done = success accent · late = warning accent · upcoming = basics/slider-background. */
export function StatusDot({ tone, label }: StatusDotProps) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-block shrink-0 size-2 rounded-[var(--sp-radius-pill)]"
      style={{ background: tone ? cssVar(TONES[tone].accent) : "var(--sp-border-line)" }}
    />
  );
}
