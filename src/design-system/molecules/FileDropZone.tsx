import { useRef, useState } from "react";
import { Button } from "../atoms/Button";

export interface FileDropZoneProps {
  /** `<input accept>` — "image/*" for photos, undefined = any document */
  accept?: string;
  /** what the user is asked for in the title: "Foto" / "Datei" */
  noun: string;
  /** small hint line under the button ("Nur Bilder") */
  hint?: string;
  onFile: (file: File) => void;
  onCancel?: () => void;
}

/** Sophi's Pet 3 "Upload with Drag & Drop" (Empty / Dragging): frame with a 2px dashed border (border/line), radius 2x, padding 8x,
    Title "… hier ablegen" + "oder" + tertiary icon+text button (opens the file explorer). Dragging = selected background + brand border.
    With accept="image/*" other file types are refused with an inline hint. */
export function FileDropZone({ accept, noun, hint, onFile, onCancel }: FileDropZoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");

  const take = (files: FileList | null | undefined) => {
    const f = files?.[0];
    if (!f) return;
    if (accept === "image/*" && !f.type.startsWith("image/")) { setError("Nur Bilder sind erlaubt."); return; }
    setError("");
    onFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      onKeyDown={(e) => { if (e.key === "Escape" && onCancel) { e.stopPropagation(); onCancel(); } }}
      className={`flex flex-col items-center gap-[var(--sp-space-2x)] p-[var(--sp-space-8x)] border-2 border-dashed rounded-[var(--sp-radius-2x)] text-center transition-colors ${
        over ? "bg-sp-selected border-sp-brand-border-normal" : "bg-transparent border-sp-border-line"
      }`}
    >
      <span className="sp-text-medium text-sp-text">{noun} hier ablegen</span>
      <span className="sp-text-standard text-sp-text-label">oder</span>
      <div className="flex items-center gap-[var(--sp-space-2x)]">
        <Button variant="tertiary" icon="attachment" label={`${noun} auswählen`} onClick={() => input.current?.click()} />
        {onCancel && <Button variant="tertiary" label="Abbrechen" onClick={onCancel} />}
      </div>
      {hint && <span className="sp-text-small text-sp-text-label">{hint}</span>}
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        aria-label={`${noun} auswählen`}
        onChange={(e) => { take(e.target.files); e.target.value = ""; }}
      />
      {error && <span role="alert" className="sp-text-small text-sp-danger-on-surface">{error}</span>}
    </div>
  );
}
