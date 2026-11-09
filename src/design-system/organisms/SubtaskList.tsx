import { useState } from "react";
import { Icon, type IconName } from "../atoms/Icon";
import { ProgressBar } from "../atoms/ProgressBar";
import { Tooltip } from "../atoms/Tooltip";
import { FileDropZone } from "../molecules/FileDropZone";
import { TextHint } from "../molecules/TextHint";
import { UploadFileList } from "../molecules/UploadFileRow";
import type { SubtaskItem, TaskFile } from "../molecules/TaskRow";

/** a file added to a camera / attachment subtask in this session */
export type SubFile = Pick<TaskFile, "name" | "size" | "kind" | "url">;

export interface SubtaskListProps {
  items: SubtaskItem[];
  /** ids of the done subtasks */
  done: string[];
  /** files of every subtask (handed in + added), by subtask id */
  files: Record<string, TaskFile[]>;
  onToggle: (id: string) => void;
  /** one or more files dropped / chosen for a subtask (appended) */
  onAddFiles: (id: string, files: File[]) => void;
  /** open file `index` of a subtask in the viewer (the viewer shows all files of that subtask) */
  onOpenFile?: (id: string, index: number) => void;
  /** library template: no status, no actions */
  readOnly?: boolean;
}

const ACTION: Record<"check" | "photo" | "attachment", { icon: IconName; open: string; noun: string; hint?: string }> = {
  check: { icon: "check_circle", open: "Als erledigt markieren", noun: "" },
  photo: { icon: "camera", open: "Foto hinzufügen", noun: "Fotos", hint: "Nur Bilder, mehrere möglich" },
  attachment: { icon: "attachment", open: "Datei hinzufügen", noun: "Dateien", hint: "Mehrere möglich" },
};

/** Solution-type icon button (no frame) with an SP3 Tooltip (fixed, so scrolling containers never clip it):
    open = grey icon, done = green icon. */
function IconAction({ label, icon, done, onClick, disabled }: { label: string; icon: IconName; done?: boolean; onClick: () => void; disabled?: boolean }) {
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
      className={`relative flex items-center justify-center shrink-0 size-6 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${disabled ? "cursor-default" : "cursor-pointer sp-interactive"}`}
    >
      <Icon name={icon} size={20} color={done ? "var(--sp-success-on-surface)" : "var(--sp-icon)"} />
      {pos && (
        <span className="fixed z-[80] -translate-x-1/2 -translate-y-full" style={{ left: pos.x, top: pos.y - 4 }}>
          <Tooltip>{label}</Tooltip>
        </span>
      )}
    </button>
  );
}

/** Subtasks section of the task detail: heading "Unteraufgaben" + SP3 Progress Bar and "n / m", then one card per
    subtask — SP3 List Item look (surface/raised · 1px border line · radius 3x · padding 2x / 4x · gap 4x · min height 12x): number (no circle),
    title (Roboto Medium) and, at the right end, the resolve icon: grey while open, green when done — check → toggles done · camera → photo
    drop area (images only) · paper clip → file drop area (SP3 "Upload with Drag & Drop", several files). The first file completes the subtask.
    Handed-in files sit under the title as SP3 "Upload File Row"s (icon · name · size · date · view · download); view = viewer on that file.
    `readOnly` (library template): icons only, no actions. The master cannot remove files. */
export function SubtaskList({ items, done, files, onToggle, onAddFiles, onOpenFile, readOnly }: SubtaskListProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const count = items.filter((s) => done.includes(s.id)).length;

  return (
    <section aria-label="Unteraufgaben" className="flex flex-col gap-[var(--sp-space-2x)]">
      <div className="flex items-center justify-between gap-[var(--sp-space-2x)]">
        <h3 className="m-0 sp-text-medium text-sp-text">Unteraufgaben</h3>
        {!readOnly && (
          <span className="flex items-center gap-[var(--sp-space-2x)]" aria-label={`${count} von ${items.length} erledigt`}>
            <ProgressBar value={count} max={items.length} className="w-[120px]" />
            <span className="sp-text-medium text-sp-text tabular-nums">{count} / {items.length}</span>
          </span>
        )}
      </div>

      <ol className="m-0 p-0 list-none flex flex-col gap-[var(--sp-space-2x)]">
        {items.map((s, i) => {
          const kind = s.proof ?? "check";
          const a = ACTION[kind];
          const isDone = done.includes(s.id);
          const list = files[s.id] ?? [];
          const open = openId === s.id && kind !== "check";
          return (
            <li key={s.id} className="flex flex-col gap-[var(--sp-space-3x)] py-[var(--sp-space-2x)] px-[var(--sp-space-4x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-3x)]">
              <div className="flex items-center gap-[var(--sp-space-4x)] min-h-[var(--sp-space-8x)]">
                <span aria-hidden className="shrink-0 sp-text-medium text-sp-text-label tabular-nums">{i + 1}</span>
                <TextHint text={s.title} className="flex-1 sp-text-medium text-sp-text" />
                {readOnly ? (
                  <Icon name={a.icon} size={20} color="var(--sp-icon)" />
                ) : isDone ? (
                  <IconAction
                    label={kind === "check" ? "Erledigt – klicken zum Wiederöffnen" : `Erledigt · ${a.noun}`}
                    icon={a.icon}
                    done
                    disabled={kind !== "check"}
                    onClick={() => onToggle(s.id)}
                  />
                ) : (
                  <IconAction
                    label={a.open}
                    icon={a.icon}
                    onClick={() => (kind === "check" ? onToggle(s.id) : setOpenId(open ? null : s.id))}
                  />
                )}
              </div>

              {/* results, aligned with the title (number column 4x + gap) */}
              {!!list.length && (
                <div className="pl-[var(--sp-space-8x)] pb-[var(--sp-space-2x)]">
                  <UploadFileList files={list} onOpen={(k) => onOpenFile?.(s.id, k)} />
                </div>
              )}

              {open && (
                <div className="pb-[var(--sp-space-2x)]">
                  <FileDropZone
                    accept={kind === "photo" ? "image/*" : undefined}
                    noun={a.noun}
                    hint={a.hint}
                    multiple
                    onFiles={(f) => { onAddFiles(s.id, f); setOpenId(null); }}
                    onCancel={() => setOpenId(null)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
