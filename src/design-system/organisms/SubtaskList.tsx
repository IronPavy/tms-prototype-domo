import { useState } from "react";
import { Icon, type IconName } from "../atoms/Icon";
import { ProgressBar } from "../atoms/ProgressBar";
import { Tooltip } from "../atoms/Tooltip";
import { FileDropZone } from "../molecules/FileDropZone";
import { TextHint } from "../molecules/TextHint";
import type { SubtaskItem, TaskFile } from "../molecules/TaskRow";
import { fileSize } from "./TaskFiles";

/** a file added to a camera / attachment subtask */
export type SubFile = Pick<TaskFile, "name" | "size" | "kind" | "url">;

export interface SubtaskListProps {
  items: SubtaskItem[];
  /** ids of the done subtasks */
  done: string[];
  files: Record<string, SubFile>;
  onToggle: (id: string) => void;
  onAddFile: (id: string, file: File) => void;
  onRemoveFile: (id: string) => void;
  /** open the file of a subtask in the viewer */
  onOpenFile?: (id: string) => void;
}

const ACTION: Record<"check" | "photo" | "attachment", { icon: IconName; open: string; noun: string; hint?: string }> = {
  check: { icon: "check_circle", open: "Als erledigt markieren", noun: "" },
  photo: { icon: "camera", open: "Foto hinzufügen", noun: "Foto", hint: "Nur Bilder" },
  attachment: { icon: "attachment", open: "Datei hinzufügen", noun: "Datei" },
};

/** Icon-sized action button with an SP3 Tooltip (fixed, so scrolling containers never clip it). */
function IconAction({ label, icon, color, onClick, disabled }: { label: string; icon: IconName; color: string; onClick: () => void; disabled?: boolean }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const show = (el: HTMLElement) => { const r = el.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top }); };
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={() => { if (!disabled) onClick(); }}
      onMouseEnter={(e) => show(e.currentTarget)}
      onMouseLeave={() => setPos(null)}
      onFocus={(e) => show(e.currentTarget)}
      onBlur={() => setPos(null)}
      className={`relative flex items-center justify-center shrink-0 size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${disabled ? "cursor-default" : "cursor-pointer sp-interactive"}`}
    >
      <Icon name={icon} size={20} color={color} />
      {pos && (
        <span className="fixed z-[80] -translate-x-1/2 -translate-y-full" style={{ left: pos.x, top: pos.y - 4 }}>
          <Tooltip>{label}</Tooltip>
        </span>
      )}
    </button>
  );
}

/** Subtasks section of the task detail: header "Unteraufgaben · n von m" + SP3 Progress Bar, one raised card (surface/raised · 1px border
    line · radius 2x) with rows. Each row: title (line-through + label colour when done) and, at the right end, the resolve icon:
    check → toggles done · camera → photo drop area (images only) · paper clip → file drop area (SP3 "Upload with Drag & Drop").
    Adding a file marks the subtask done; the file shows as a chip (thumbnail / icon · name · size, click = viewer · ×) and removing it
    reopens the subtask. */
export function SubtaskList({ items, done, files, onToggle, onAddFile, onRemoveFile, onOpenFile }: SubtaskListProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const count = items.filter((s) => done.includes(s.id)).length;

  return (
    <section aria-label="Unteraufgaben" className="flex flex-col gap-[var(--sp-space-2x)]">
      <div className="flex flex-col gap-[var(--sp-space-2x)]">
        <h3 className="m-0 flex items-baseline gap-[var(--sp-space-2x)] sp-text-medium text-sp-text">
          Unteraufgaben <span className="sp-text-small text-sp-text-label tabular-nums">{count} von {items.length}</span>
        </h3>
        <ProgressBar value={count} max={items.length} tone={count === items.length ? "success" : undefined} />
      </div>

      <ul className="m-0 p-0 list-none bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)]">
        {items.map((s, i) => {
          const kind = s.proof ?? "check";
          const a = ACTION[kind];
          const isDone = done.includes(s.id);
          const file = files[s.id];
          const open = openId === s.id && !isDone && kind !== "check";
          return (
            <li key={s.id} className={`flex flex-col gap-[var(--sp-space-2x)] py-[var(--sp-space-2x)] pl-[var(--sp-space-3x)] pr-[var(--sp-space-2x)] ${i ? "border-0 border-t border-solid border-sp-neutral-fill-light" : ""}`}>
              <div className="flex items-center gap-[var(--sp-space-3x)] min-h-8">
                <TextHint text={s.title} className={`flex-1 sp-text-standard ${isDone ? "line-through text-sp-text-label" : "text-sp-text"}`} />
                {isDone ? (
                  <IconAction
                    label={kind === "check" ? "Erledigt – klicken zum Wiederöffnen" : "Erledigt"}
                    icon="check_circle_filled"
                    color="var(--sp-success-on-surface)"
                    disabled={kind !== "check"}
                    onClick={() => onToggle(s.id)}
                  />
                ) : (
                  <IconAction
                    label={a.open}
                    icon={a.icon}
                    color={kind === "check" ? "var(--sp-icon)" : "var(--sp-brand-on-surface)"}
                    onClick={() => (kind === "check" ? onToggle(s.id) : setOpenId(open ? null : s.id))}
                  />
                )}
              </div>

              {file && (
                <span className="flex items-center self-start max-w-full h-10 pr-[var(--sp-space-1x)] bg-sp-neutral-fill-light border border-solid border-sp-neutral-border-light rounded-[var(--sp-radius-2x)]">
                  <button
                    type="button"
                    onClick={() => onOpenFile?.(s.id)}
                    aria-label={`${file.name} öffnen`}
                    className="flex items-center gap-[var(--sp-space-2x)] min-w-0 h-full pl-[var(--sp-space-1x)] pr-[var(--sp-space-2x)] border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer text-left outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
                  >
                    {file.kind === "image" ? (
                      <img src={file.url} alt="" className="shrink-0 size-8 rounded-[var(--sp-radius-1x)] object-cover" />
                    ) : (
                      <Icon name="attachment" color="var(--sp-icon)" className="mx-[var(--sp-space-1x)]" />
                    )}
                    <TextHint text={file.name} max={28} className="sp-text-small-medium text-sp-text" />
                    <span className="sp-text-small text-sp-text-label whitespace-nowrap">{fileSize(file.size)}</span>
                  </button>
                  <IconAction label="Datei entfernen und Unteraufgabe wieder öffnen" icon="close" color="var(--sp-icon)" onClick={() => onRemoveFile(s.id)} />
                </span>
              )}

              {open && (
                <FileDropZone
                  accept={kind === "photo" ? "image/*" : undefined}
                  noun={a.noun}
                  hint={a.hint}
                  onFile={(f) => { onAddFile(s.id, f); setOpenId(null); }}
                  onCancel={() => setOpenId(null)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
