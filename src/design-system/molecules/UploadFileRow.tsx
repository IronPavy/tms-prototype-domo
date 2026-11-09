import { Icon, type IconName } from "../atoms/Icon";
import { TextHint } from "./TextHint";
import type { TaskFile } from "./TaskRow";

export const fileSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const FILE_ICON: Record<TaskFile["kind"], IconName> = { image: "page_image", pdf: "page_pdf", other: "page_document" };

/** Icon button of a file row: 32px, transparent, overlay on hover, Focus Brand. */
const ACTION = "flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]";

/** Sophi's Pet 3 "Upload File Row" (State=Uploaded) — one handed-in file as a row of "Table DataGrid Cell"s (Density Default:
    height / padding = density tokens, gap 1x, bottom border line): file-type icon + name (…+ tooltip) · size · date · eye (opens the viewer)
    · download. Stack several rows in an `UploadFileList`. */
export function UploadFileRow({ file, onOpen }: { file: TaskFile; onOpen: () => void }) {
  const cell = "flex items-center gap-[var(--sp-space-1x)] min-w-0 min-h-[var(--sp-density-height)] py-[var(--sp-density-padding-block)] px-[var(--sp-density-padding-inline)] border-0 border-b border-solid border-sp-border-line";
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_88px_120px_var(--sp-space-12x)_var(--sp-space-12x)] sp-text-standard">
      <span className={cell}>
        <Icon name={FILE_ICON[file.kind]} color="var(--sp-icon)" />
        <TextHint text={file.name} className="sp-text-standard text-sp-text" />
      </span>
      <span className={`${cell} text-sp-text-label tabular-nums`}>{fileSize(file.size)}</span>
      <span className={`${cell} text-sp-text-label tabular-nums`}>{file.at}</span>
      <span className={`${cell} justify-center`}>
        <button type="button" aria-label={`${file.name} ansehen`} title="Ansehen" onClick={onOpen} className={ACTION}>
          <Icon name="eye" color="var(--sp-icon)" />
        </button>
      </span>
      <span className={`${cell} justify-center`}>
        <a href={file.url} download={file.name} aria-label={`${file.name} herunterladen`} title="Herunterladen" className={ACTION}>
          <Icon name="download" color="var(--sp-icon)" />
        </a>
      </span>
    </li>
  );
}

/** Rows of `UploadFileRow`, with the top border line of the table. */
export function UploadFileList({ files, onOpen }: { files: TaskFile[]; onOpen: (index: number) => void }) {
  return (
    <ul aria-label="Dateien" className="m-0 p-0 list-none border-0 border-t border-solid border-sp-border-line">
      {files.map((f, i) => <UploadFileRow key={f.id} file={f} onOpen={() => onOpen(i)} />)}
    </ul>
  );
}
