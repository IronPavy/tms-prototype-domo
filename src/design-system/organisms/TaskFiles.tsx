import { Icon } from "../atoms/Icon";
import { TextHint } from "../molecules/TextHint";
import type { TaskFile } from "../molecules/TaskRow";

export interface TaskFilesProps {
  /** attachment or camera task */
  kind: "photo" | "attachment";
  files: TaskFile[];
  /** employee the task is assigned to — named in the empty text */
  person: string;
  onOpen: (index: number) => void;
}

export const fileSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** "Anhänge" / "Fotos" of an attachment or camera task: what the employee handed in. One raised card (surface/raised · 1px border line ·
    radius 2x), a row per file in the "Upload File Row" style — thumbnail (photo) or document tile · name · "Person · time" · size ·
    eye icon. A click opens the viewer. No file yet = muted waiting text. */
export function TaskFiles({ kind, files, person, onOpen }: TaskFilesProps) {
  const title = kind === "photo" ? "Fotos" : "Anhänge";
  return (
    <section aria-label={title} className="flex flex-col gap-[var(--sp-space-2x)]">
      <h3 className="m-0 flex items-baseline gap-[var(--sp-space-2x)] sp-text-medium text-sp-text">
        {title} {!!files.length && <span className="sp-text-small text-sp-text-label tabular-nums">{files.length}</span>}
      </h3>
      {files.length ? (
        <ul className="m-0 p-0 list-none bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] overflow-hidden">
          {files.map((f, i) => (
            <li key={f.id} className={i ? "border-0 border-t border-solid border-sp-neutral-fill-light" : ""}>
              <button
                type="button"
                onClick={() => onOpen(i)}
                aria-label={`${f.name} öffnen`}
                className="flex items-center gap-[var(--sp-space-3x)] w-full p-[var(--sp-space-2x)] pl-[var(--sp-space-3x)] border-0 bg-transparent text-left cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
              >
                {f.kind === "image" ? (
                  <img src={f.url} alt="" className="shrink-0 size-12 rounded-[var(--sp-radius-2x)] object-cover bg-sp-neutral-fill-light" />
                ) : (
                  <span className="flex items-center justify-center shrink-0 size-12 rounded-[var(--sp-radius-2x)] bg-sp-neutral-fill-light">
                    <Icon name="page_document" size={24} color="var(--sp-icon)" />
                  </span>
                )}
                <span className="flex flex-col gap-[var(--sp-space-1x)] flex-1 min-w-0">
                  <TextHint text={f.name} className="sp-text-medium text-sp-text" />
                  <span className="sp-text-small text-sp-text-label truncate">{f.by} · {f.at}</span>
                </span>
                <span className="shrink-0 sp-text-small text-sp-text-label tabular-nums">{fileSize(f.size)}</span>
                <Icon name="eye" color="var(--sp-brand-on-surface)" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 flex items-center gap-[var(--sp-space-2x)] p-[var(--sp-space-3x)] sp-text-standard text-sp-text-label border border-dashed border-sp-border-line rounded-[var(--sp-radius-2x)]">
          <Icon name={kind === "photo" ? "camera" : "attachment"} color="var(--sp-icon)" />
          {kind === "photo" ? "Noch kein Foto" : "Noch kein Anhang"} – {person} hat noch nichts abgegeben.
        </p>
      )}
    </section>
  );
}
