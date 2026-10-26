import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import type { TaskFile } from "../molecules/TaskRow";

export interface FilePreviewProps {
  files: TaskFile[];
  /** index of the file shown first */
  start: number;
  onClose: () => void;
}

/** Full-screen viewer for the files of a task: image or PDF (iframe), "2 von 3", previous / next (arrow keys), Herunterladen, Schließen (Esc).
    Sits above the task detail; Esc closes only the viewer (captured before the detail's own handler). */
export function FilePreview({ files, start, onClose }: FilePreviewProps) {
  const [i, setI] = useState(Math.min(start, files.length - 1));
  const root = useRef<HTMLDivElement>(null);
  const f = files[i];
  const go = (d: number) => setI((n) => (n + d + files.length) % files.length);
  const goRef = useRef(go); goRef.current = go;
  const closeRef = useRef(onClose); closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); }
      else if (e.key === "ArrowRight" && files.length > 1) { e.stopPropagation(); goRef.current(1); }
      else if (e.key === "ArrowLeft" && files.length > 1) { e.stopPropagation(); goRef.current(-1); }
      else if (e.key === "Tab") {
        const items = [...(root.current?.querySelectorAll<HTMLElement>("button, a[href]") ?? [])];
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => { document.removeEventListener("keydown", onKey, true); opener?.focus?.(); };
  }, [files.length]);

  if (!f) return null;
  const nav = "absolute top-1/2 -translate-y-1/2 flex items-center justify-center size-10 rounded-full border-0 bg-sp-surface-default cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]";
  return createPortal(
    <div ref={root} role="dialog" aria-modal="true" aria-label={`Vorschau: ${f.name}`} className="fixed inset-0 z-[70] flex flex-col bg-black/80">
      <div className="flex items-center gap-[var(--sp-space-3x)] px-[var(--sp-space-4x)] py-[var(--sp-space-3x)] bg-sp-surface-default">
        <Icon name={f.kind === "image" ? "image" : "page_document"} color="var(--sp-icon)" />
        <span className="flex flex-col min-w-0 flex-1">
          <span className="sp-text-medium text-sp-text truncate">{f.name}</span>
          <span className="sp-text-small text-sp-text-label truncate">{f.by} · {f.at}{files.length > 1 ? ` · ${i + 1} von ${files.length}` : ""}</span>
        </span>
        <a
          href={f.url}
          download={f.name}
          className="inline-flex items-center gap-[var(--sp-space-1x)] h-8 px-[var(--sp-space-2x)] rounded-[var(--sp-radius-2x)] no-underline sp-text-medium text-sp-brand-on-surface sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
        >
          <Icon name="download" color="var(--sp-brand-on-surface)" />Herunterladen
        </a>
        <Button variant="tertiary" icon="close" label="Schließen" onClick={onClose} />
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center p-[var(--sp-space-4x)]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {f.kind === "image" ? (
          <img src={f.url} alt={f.name} className="max-w-full max-h-full object-contain rounded-[var(--sp-radius-2x)] bg-white" />
        ) : f.kind === "pdf" ? (
          <iframe src={f.url} title={f.name} className="w-full max-w-[900px] h-full border-0 rounded-[var(--sp-radius-2x)] bg-white" />
        ) : (
          <div className="flex flex-col items-center gap-[var(--sp-space-3x)] p-[var(--sp-space-8x)] rounded-[var(--sp-radius-3x)] bg-sp-surface-default">
            <Icon name="file" size={24} color="var(--sp-icon)" />
            <span className="sp-text-standard text-sp-text">Für diesen Dateityp gibt es keine Vorschau.</span>
          </div>
        )}
        {files.length > 1 && (
          <>
            <button type="button" aria-label="Vorherige Datei" onClick={() => go(-1)} className={`${nav} left-[var(--sp-space-4x)]`}><Icon name="previous" size={20} color="var(--sp-icon)" /></button>
            <button type="button" aria-label="Nächste Datei" onClick={() => go(1)} className={`${nav} right-[var(--sp-space-4x)]`}><Icon name="next" size={20} color="var(--sp-icon)" /></button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
