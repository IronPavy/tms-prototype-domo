import type { ReactNode } from "react";
import clipboard from "../assets/clipboard.svg";
import { EmptyState } from "./EmptyState";

/** Empty state for every task area (Library, Drafts, list / cards / calendar views):
    the clipboard illustration (assets/clipboard.svg) on SP3 "Empty State" (512:4561), Medium —
    title "Keine Aufgaben", text "Keine Aufgaben gefunden." — no card behind it, optional action button (e.g. "Zurücksetzen"). */
export function EmptyTasks({ title = "Keine Aufgaben", text = "Keine Aufgaben gefunden.", action }: { title?: string; text?: string; action?: ReactNode }) {
  return <EmptyState size="medium" illustration={clipboard} title={title} text={text} action={action} />;
}
