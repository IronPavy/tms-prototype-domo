import { useState } from "react";
import { Icon, type IconName } from "../atoms/Icon";
import { ProgressBar } from "../atoms/ProgressBar";
import { Tooltip } from "../atoms/Tooltip";
import { FileDropZone } from "../molecules/FileDropZone";
import { TextHint } from "../molecules/TextHint";
import { TONES, cssVar } from "../utils/tones";
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
}

const ACTION: Record<"check" | "photo" | "attachment", { icon: IconName; open: string; noun: string; hint?: string }> = {
  check: { icon: "check_circle", open: "Als erledigt markieren", noun: "" },
  photo: { icon: "camera", open: "Foto hinzufügen", noun: "Fotos", hint: "Nur Bilder, mehrere möglich" },
  attachment: { icon: "attachment", open: "Datei hinzufügen", noun: "Dateien", hint: "Mehrere möglich" },
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

/** Step number: 24px circle, neutral (open) or success (done). */
function StepNumber({ n, done }: { n: number; done: boolean }) {
  const tone = TONES[done ? "success" : "default"];
  return (
    <span
      aria-hidden
      className="flex items-center justify-center shrink-0 size-6 rounded-full border border-solid sp-text-small-medium tabular-nums text-sp-text"
      style={{ background: cssVar(tone.bg), borderColor: cssVar(tone.border) }}
    >
      {n}
    </span>
  );
}

/** File chip under the subtask text: Badge-Chip look (neutral light fill + border, radius 2x, 24px) — thumbnail (photo) or document icon
    + name cut with "…"; click opens the viewer on this file. */
function FileChip({ file, onClick }: { file: TaskFile; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${file.name} öffnen`}
      title={file.name}
      className="inline-flex items-center gap-[var(--sp-space-1x)] shrink min-w-0 max-w-[200px] h-6 pl-[var(--sp-space-1x)] pr-[var(--tms-space-6px)] bg-sp-neutral-fill-light border border-solid border-sp-neutral-border-light rounded-[var(--sp-radius-2x)] cursor-pointer text-left outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
    >
      {file.kind === "image" ? (
        <img src={file.url} alt="" className="shrink-0 size-4 rounded-[var(--sp-radius-1x)] object-cover" />
      ) : (
        <Icon name="page_document" color="var(--sp-icon)" />
      )}
      <span className="min-w-0 truncate sp-text-small-medium text-sp-text">{file.name}</span>
    </button>
  );
}

/** Subtasks section of the task detail: header "Unteraufgaben · n von m" + SP3 Progress Bar, one raised card (surface/raised · 1px border
    line · radius 2x) with one-line rows. Each row: title (line-through + label colour when done) and, at the right end, the resolve icon:
    check → toggles done · camera → photo drop area (images only) · paper clip → file drop area (SP3 "Upload with Drag & Drop", several files).
    The first file completes the subtask. Rows are numbered; every file is a small chip under the subtask text
    (thumbnail / icon + name, click = viewer on that file, which pages through all files of the subtask). 
    The master cannot remove files. */
export function SubtaskList({ items, done, files, onToggle, onAddFiles, onOpenFile }: SubtaskListProps) {
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
          const list = files[s.id] ?? [];
                    const open = openId === s.id && kind !== "check";
          return (
            <li key={s.id} className={`flex flex-col gap-[var(--sp-space-2x)] py-0 pl-[var(--sp-space-3x)] pr-[var(--sp-space-2x)] ${i ? "border-0 border-t border-solid border-sp-neutral-fill-light" : ""}`}>
              <div className="flex items-center gap-[var(--sp-space-3x)] h-16">
                <StepNumber n={i + 1} done={isDone} />
                <div className="flex flex-col justify-center gap-[var(--sp-space-2x)] flex-1 min-w-0">
                  <TextHint text={s.title} className={`sp-text-standard ${isDone ? "line-through text-sp-text-label" : "text-sp-text"}`} />
                  {!!list.length && (
                    <span className="flex gap-[var(--sp-space-2x)] min-w-0">
                      {list.map((f, k) => <FileChip key={f.id} file={f} onClick={() => onOpenFile?.(s.id, k)} />)}
                    </span>
                  )}
                </div>
                {isDone ? (
                  <IconAction
                    label={kind === "check" ? "Erledigt – klicken zum Wiederöffnen" : `Erledigt · ${a.noun}`}
                    icon={kind === "check" ? "check_circle_filled" : a.icon}
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

              {open && (
                <FileDropZone
                  accept={kind === "photo" ? "image/*" : undefined}
                  noun={a.noun}
                  hint={a.hint}
                  multiple
                  onFiles={(f) => { onAddFiles(s.id, f); setOpenId(null); }}
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
