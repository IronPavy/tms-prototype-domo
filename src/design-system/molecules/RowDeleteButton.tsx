import { useState } from "react";
import { Icon } from "../atoms/Icon";
import { Tooltip } from "../atoms/Tooltip";

/** Delete icon at the end of a task row (32px, Sophis `delete`): normal icon colour, red on hover / focus, SP3 Tooltip "Aufgabe löschen".
    Clicks never open the task behind it; the host asks for confirmation. */
export function RowDeleteButton({ title, onClick }: { title: string; onClick: () => void }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [hot, setHot] = useState(false);
  const show = (el: HTMLElement) => { const r = el.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top }); setHot(true); };
  const hide = () => { setPos(null); setHot(false); };
  return (
    <span className="flex justify-end" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={`Aufgabe „${title}“ löschen`}
        onClick={onClick}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={hide}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={hide}
        className="relative flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
      >
        <Icon name="delete" size={20} color={hot ? "var(--sp-danger-on-surface)" : "var(--sp-icon)"} />
        {pos && (
          <span className="fixed z-50 -translate-x-1/2 -translate-y-full" style={{ left: pos.x, top: pos.y - 4 }}>
            <Tooltip>Aufgabe löschen</Tooltip>
          </span>
        )}
      </button>
    </span>
  );
}
