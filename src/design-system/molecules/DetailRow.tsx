import type { ReactNode } from "react";

/** Label / value row of the task detail: label Roboto Standard in text label (fixed 120px column) · value Roboto Standard in text.
    Rows stack with gap 2x; the value column may wrap. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-x-[var(--sp-space-3x)] min-h-6">
      <dt className="sp-text-standard text-sp-text-label">{label}</dt>
      <dd className="m-0 sp-text-standard text-sp-text min-w-0">{children}</dd>
    </div>
  );
}
