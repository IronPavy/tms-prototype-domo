/* Status colour families — Sophi's Pet 3 "Variants" (neutral · info · success · warning · danger · new · ai)
   and the "Badge Chip / Pill" Expired variant. One source for KPI cards, badges, filter pills, rows and charts.
   Tone names stay as before (default = SP3 neutral, error = SP3 danger) so screens don't change. */

export type Tone = "default" | "info" | "success" | "warning" | "error" | "new" | "expired" | "ai";

export interface ToneTokens {
  /** tile / badge background — <variant>/fill/light */
  bg: string;
  /** icon + coloured text on a light surface — <variant>/on/surface */
  fg: string;
  /** badge stroke, card hover stroke — <variant>/border/light */
  border: string;
  /** saturated colour for chart segments, dots, bars — <variant>/fill/normal */
  accent: string;
}

const variant = (v: string): ToneTokens => ({
  bg: `--sp-${v}-fill-light`,
  fg: `--sp-${v}-on-surface`,
  border: `--sp-${v}-border-light`,
  accent: `--sp-${v}-fill-normal`,
});

export const TONES: Record<Tone, ToneTokens> = {
  default: variant("neutral"),
  info: variant("info"),
  success: variant("success"),
  warning: variant("warning"),
  error: variant("danger"),
  new: variant("new"),
  ai: variant("ai"),
  // SP3 Badge "Expired": surface background + badge-expired-border-color
  expired: { bg: "--sp-surface-default", fg: "--sp-badge-expired-border-color", border: "--sp-badge-expired-border-color", accent: "--sp-badge-expired-border-color" },
};

/** `var(--token)` helper */
export const cssVar = (token: string) => `var(${token})`;
