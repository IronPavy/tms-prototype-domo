import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "../atoms/Icon";
import { MenuListItem } from "./MenuListItem";
import { Popover } from "./Popover";
import type { TaskRowData } from "./TaskRow";

export type TaskAction = "copy" | "edit" | "delete";

const ITEMS: Record<TaskAction, { label: string; icon: IconName }> = {
  copy: { label: "Kopieren", icon: "copy" },
  edit: { label: "Bearbeiten", icon: "edit" },
  delete: { label: "Löschen", icon: "delete" },
};

/** actions per status: open / overdue = copy · edit · delete; completed = copy · delete */
export const actionsFor = (status: TaskRowData["status"]): TaskAction[] => (status === "done" ? ["copy", "delete"] : ["copy", "edit", "delete"]);

/** Three-dot button at the end of a task row (32px, icon `more`) that opens a menu (SP3 Dropdown Items with Sophis icons).
    Closes on pick, Esc (only the menu) and outside click; clicks never open the task detail behind it. */
export function TaskRowMenu({ task, onAction, actions }: { task: TaskRowData; onAction: (action: TaskAction) => void; actions?: TaskAction[] }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!btn.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <span
      className="flex justify-end"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" && open) { setOpen(false); btn.current?.focus(); }
      }}
    >
      <button
        ref={btn}
        type="button"
        aria-label={`Aktionen für ${task.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-center size-8 p-0 border-0 rounded-[var(--sp-radius-2x)] cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${open ? "bg-sp-selected" : "bg-transparent sp-interactive"}`}
      >
        <Icon name="more" size={20} color={open ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />
      </button>
      <Popover
        anchorRef={btn}
        panelRef={panel}
        open={open}
        placement="bottom-end"
        minWidth={176}
        role="menu"
        aria-label="Aufgabenaktionen"
        className="p-[var(--sp-space-1x)] bg-sp-surface-raised rounded-[var(--sp-radius-3x)] shadow-[var(--sp-shadow-m)] border border-solid border-sp-border-line"
      >
        {(actions ?? actionsFor(task.status)).map((a) => (
          <MenuListItem key={a} menu inset icon={ITEMS[a].icon} label={ITEMS[a].label} onClick={() => { setOpen(false); onAction(a); }} />
        ))}
      </Popover>
    </span>
  );
}
