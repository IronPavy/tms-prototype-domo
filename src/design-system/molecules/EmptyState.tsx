import type { ReactNode } from "react";
import { Icon, type IconName } from "../atoms/Icon";

export interface EmptyStateProps {
  title: string;
  text?: string;
  /** Sophis icon shown in the framed illustration slot */
  icon?: IconName;
  /** image URL (e.g. the clipboard illustration) shown instead of the framed icon, 120px */
  illustration?: string;
  /** "Small" (64px graphic, Medium title) or "Medium" (80px graphic, H3 title) */
  size?: "small" | "medium";
  /** Button toolbar, e.g. <Button variant="secondary" … /> */
  action?: ReactNode;
}

/** Sophi's Pet 3 "Empty State" (512:4561), Alignment=vertical:
    padding 4x · gap 3x (Small) / 4x (Medium) · framed graphic (2px neutral/border/light, radius 3x, icon in icon colour)
    · title in text title (Roboto Medium / Title H3) · text Body Standard in text label · optional button toolbar. */
export function EmptyState({ title, text, icon = "search", illustration, size = "small", action }: EmptyStateProps) {
  const box = size === "medium" ? "size-20" : "size-16";
  return (
    <div className={`flex flex-col items-center text-center p-[var(--sp-space-4x)] ${size === "medium" ? "gap-[var(--sp-space-4x)]" : "gap-[var(--sp-space-3x)]"}`}>
      {illustration ? (
        <img src={illustration} alt="" width={120} height={120} className="block shrink-0 size-[120px] max-w-full object-contain" />
      ) : (
        <span className={`flex items-center justify-center ${box} border-2 border-solid border-sp-neutral-border-light rounded-[var(--sp-radius-3x)] bg-sp-surface-raised`}>
          <Icon name={icon} size={size === "medium" ? 48 : 24} color="var(--sp-icon)" />
        </span>
      )}
      <div className="flex flex-col items-center gap-[var(--sp-space-2x)]">
        <span className={`${size === "medium" ? "sp-title-h3" : "sp-text-medium"} text-sp-text-title`}>{title}</span>
        {text && <p className="m-0 max-w-[480px] sp-text-body-standard text-sp-text-label">{text}</p>}
        {action && <div className="flex gap-[var(--sp-space-2x)]">{action}</div>}
      </div>
    </div>
  );
}
