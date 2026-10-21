import { useEffect, useRef, useState } from "react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Switch } from "../atoms/Switch";
import { TextField } from "../atoms/TextField";
import { FormField } from "../molecules/FormField";
import { Modal } from "../molecules/Modal";
import { RecipientSelect, type RecipientSelectProps } from "../molecules/RecipientSelect";
import { MenuListItem } from "../molecules/MenuListItem";
import { Popover } from "../molecules/Popover";
import { SOLUTION, type TaskProof } from "../molecules/TaskRow";
import { TONES, cssVar } from "../utils/tones";
import { DueDateModal } from "./DueDateModal";
import { defaultDue, dueLabel, type DueSettings } from "../utils/due";

export interface NewTaskValues {
  /** person / team / shift ids */
  recipients: string[];
  title: string;
  description: string;
  /** file names */
  attachments: string[];
  /** date, repetition and time — edited in the "Set date and time" dialog */
  due: DueSettings;
  subtasks: string[];
  /** solution type per subtask (same index); missing = "check". Once a task has subtasks, only these apply */
  subtaskProofs?: TaskProof[];
  proof: TaskProof;
  approval: boolean;
  priority: boolean;
}

export const emptyTask = (today: Date): NewTaskValues => ({
  recipients: [], title: "", description: "", attachments: [], due: defaultDue(today),
  subtasks: [], subtaskProofs: [], proof: "check", approval: false, priority: false,
});

export interface NewTaskModalProps {
  recipients: Pick<RecipientSelectProps, "people" | "teams" | "shifts">;
  initial: NewTaskValues;
  /** true when a saved draft is being continued */
  isDraft?: boolean;
  /** "edit" = changing an existing task: title "Edit task", primary "Save", no draft button */
  mode?: "create" | "edit";
  onSend: (values: NewTaskValues) => void;
  onSaveDraft: (values: NewTaskValues) => void;
  onClose: () => void;
}

type Panel = "sub" | null;

/** Icon-only Solution type dropdown for one subtask (right of its field). */
function SubtaskSolution({ index, value, onChange }: { index: number; value: TaskProof; onChange: (p: TaskProof) => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={wrap} onKeyDown={(e) => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); } }}>
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Solution type of subtask ${index + 1}: ${SOLUTION[value].label}`}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center justify-center h-8 px-[var(--sp-space-1x)] gap-[var(--tms-space-2px)] border-0 rounded-[var(--sp-radius-2x)] cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)] ${open ? "bg-sp-selected" : "bg-transparent"}`}
      >
        <Icon name={SOLUTION[value].icon} color="var(--sp-brand-on-surface)" />
        <Icon name="expanded" color="var(--sp-icon)" className={open ? "rotate-180" : ""} />
      </button>
      <Popover
        open={open}
        anchorRef={btn}
        panelRef={panel}
        placement="bottom-end"
        minWidth={176}
        maxWidth={280}
        maxHeight={240}
        role="menu"
        aria-label="Solution type"
        className="flex flex-col overflow-y-auto p-[var(--sp-space-1x)] bg-sp-form-control-background-color border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] shadow-[var(--sp-shadow-m)]"
      >
        {(Object.keys(SOLUTION) as TaskProof[]).map((k) => (
          <MenuListItem key={k} inset icon={SOLUTION[k].icon} label={SOLUTION[k].label} selected={value === k} onClick={() => { onChange(k); setOpen(false); }} />
        ))}
      </Popover>
    </div>
  );
}

/** "New task" dialog — Figma "submarine task new" (83:1854) in Sophi's Pet 3, English labels.
    Recipient* · Title* · Description (+ attachment) · action row Due date / Subtasks / Solution type (each opens an inline panel and
    shows its value on the button) · toggles (approval, priority with helper text) · collapsible Summary · footer
    Cancel · Save as draft · Send. Inline errors on blur / on Send, "N required fields missing" hint, discard confirmation. */
export function NewTaskModal({ recipients, initial, isDraft, mode = "create", onSend, onSaveDraft, onClose }: NewTaskModalProps) {
  const [v, setV] = useState<NewTaskValues>(initial);
  const [panel, setPanel] = useState<Panel>(null);
  /** "due" = the Set date and time dialog replaces the form (the arrow there comes back) */
  const [view, setView] = useState<"form" | "due">("form");
  const [summary, setSummary] = useState(false);
  const [touched, setTouched] = useState({ recipients: false, title: false });
  /** a field only shows its error after the user has changed it (or pressed Send) — never just because focus passed through it */
  const edited = useRef({ recipients: false, title: false });
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  /** Solution type dropdown */
  const [solOpen, setSolOpen] = useState(false);
  const solRef = useRef<HTMLDivElement>(null);
  const solBtnRef = useRef<HTMLButtonElement>(null);
  const solPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!solOpen) return;
    const close = (e: MouseEvent) => { if (!solRef.current?.contains(e.target as Node) && !solPanelRef.current?.contains(e.target as Node)) setSolOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [solOpen]);

  const set = <K extends keyof NewTaskValues>(k: K, val: NewTaskValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  const errors = {
    recipients: v.recipients.length ? "" : "Select at least one recipient.",
    title: v.title.trim() ? "" : "Enter a title.",
  };
  const missing = Object.values(errors).filter(Boolean).length;
  const send = () => {
    if (missing) { setTouched({ recipients: true, title: true }); return; }
    onSend(v);
  };
  const requestClose = () => (dirty ? setConfirm(true) : onClose());
  const subProof = (i: number): TaskProof => v.subtaskProofs?.[i] ?? "check";
  const setSubProof = (i: number, p: TaskProof) => setV((s) => {
    const arr = s.subtasks.map((_, j) => s.subtaskProofs?.[j] ?? "check");
    arr[i] = p;
    return { ...s, subtaskProofs: arr };
  });
  /** with subtasks, the solution type is chosen per subtask — the task-level one is disabled */
  const hasSubs = v.subtasks.length > 0;
  const togglePanel = (p: Exclude<Panel, null>) => {
    // opening Subtasks with none yet starts the first one, focused, so you can type right away
    if (p === "sub" && panel !== "sub" && !v.subtasks.length) set("subtasks", [""]);
    setPanel((cur) => (cur === p ? null : p));
  };

  if (view === "due") {
    return <DueDateModal value={v.due} onSave={(d) => { set("due", d); setView("form"); }} onCancel={() => setView("form")} />;
  }

  if (confirm) {
    return (
      <Modal
        title={mode === "edit" ? "Discard changes?" : "Discard this task?"}
        width={440}
        minWidth={320}
        onClose={() => setConfirm(false)}
        footer={
          <>
            <Button variant="tertiary" label="Keep editing" onClick={() => setConfirm(false)} />
            {mode !== "edit" && <Button variant="secondary" label="Save as draft" onClick={() => onSaveDraft(v)} />}
            <Button variant="primary" label="Discard" onClick={onClose} />
          </>
        }
      >
        <p className="m-0 sp-text-standard text-sp-text">{mode === "edit" ? "Your changes have not been saved. Discard them or keep editing." : "Your changes have not been sent. Discard them or keep them as a draft."}</p>
      </Modal>
    );
  }

  const chipBtn = (p: Exclude<Panel, null> | "due", icon: Parameters<typeof Icon>[0]["name"], label: string, value?: string) => (
    <button
      type="button"
      aria-expanded={p === "due" ? undefined : panel === p}
      aria-haspopup={p === "due" ? "dialog" : undefined}
      onClick={() => (p === "due" ? setView("due") : togglePanel(p))}
      className={`inline-flex items-center h-8 p-[var(--sp-space-2x)] gap-[var(--sp-space-1x)] border-0 rounded-[var(--sp-radius-2x)] cursor-pointer sp-text-medium whitespace-nowrap outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)] ${panel === p ? "bg-sp-selected text-sp-text-selected" : "bg-transparent text-sp-brand-on-surface"}`}
    >
      <Icon name={icon} />
      <span className="leading-none">{label}</span>
      {value && (
        <span className="inline-flex items-center h-5 px-[var(--tms-space-6px)] rounded-[var(--sp-radius-2x)] bg-sp-neutral-fill-light border border-solid border-sp-neutral-border-light sp-text-small-medium text-sp-text tabular-nums">{value}</span>
      )}
      <Icon name="expanded" className={panel === p ? "rotate-180" : ""} />
    </button>
  );

  const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <div className="flex gap-[var(--sp-space-3x)]">
      <span className="w-28 shrink-0 sp-text-small text-sp-text-label">{k}</span>
      <span className="flex-1 min-w-0 sp-text-standard text-sp-text">{children}</span>
    </div>
  );
  const labelOf = (id: string) => recipients.people.find((x) => x.id === id)?.label ?? recipients.teams.find((x) => x.id === id)?.label ?? recipients.shifts.find((x) => x.id === id)?.label;
  const names = v.recipients.map(labelOf).filter(Boolean) as string[];
  const info = TONES.info;

  return (
    <Modal
      title={mode === "edit" ? "Edit task" : "New task"}
      onClose={requestClose}
      footer={
        <>
          {!!missing && <span className="mr-auto sp-text-small text-sp-text-label">{missing} required {missing === 1 ? "field" : "fields"} missing</span>}
          <Button variant="tertiary" label="Cancel" onClick={requestClose} />
          {mode !== "edit" && <Button variant="secondary" icon="edit" label={isDraft ? "Update draft" : "Save as draft"} disabled={!dirty} onClick={() => onSaveDraft(v)} />}
          <Button variant="primary" icon={mode === "edit" ? "check" : "send"} label={mode === "edit" ? "Save" : "Send"} onClick={send} />
        </>
      }
    >
      <FormField label="Recipient" required htmlFor="nt-recipient" error={touched.recipients ? errors.recipients : ""}>
        <RecipientSelect
          id="nt-recipient"
          {...recipients}
          value={v.recipients}
          onChange={(r) => { edited.current.recipients = true; set("recipients", r); }}
          invalid={touched.recipients && !!errors.recipients}
          onBlur={() => { if (edited.current.recipients) setTouched((t) => ({ ...t, recipients: true })); }}
        />
      </FormField>

      <FormField label="Title" required htmlFor="nt-title" error={touched.title ? errors.title : ""}>
        <TextField
          id="nt-title"
          value={v.title}
          onChange={(t) => { edited.current.title = true; set("title", t); }}
          placeholder="Describe the title…"
          maxLength={80}
          invalid={touched.title && !!errors.title}
          onBlur={() => { if (edited.current.title) setTouched((t) => ({ ...t, title: true })); }}
        />
      </FormField>

      <FormField label="Description" htmlFor="nt-desc">
        <TextField
          id="nt-desc"
          multiline
          rows={3}
          value={v.description}
          onChange={(d) => set("description", d)}
          placeholder="Describe the task…"
          end={
            <>
              <input
                ref={fileRef}
                type="file"
                multiple
                hidden
                onChange={(e) => { set("attachments", [...v.attachments, ...[...(e.target.files ?? [])].map((f) => f.name)]); e.target.value = ""; }}
              />
              <button
                type="button"
                aria-label="Attach file"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center size-6 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
              >
                <Icon name="attachment" color="var(--sp-icon)" />
              </button>
            </>
          }
        />
        {!!v.attachments.length && (
          <span className="flex flex-wrap gap-[var(--sp-space-1x)]">
            {v.attachments.map((a, i) => (
              <span key={`${a}-${i}`} className="inline-flex items-center h-6 pl-[var(--sp-space-2x)] pr-[var(--sp-space-1x)] gap-[var(--sp-space-1x)] rounded-[var(--sp-radius-2x)] bg-sp-neutral-fill-light border border-solid border-sp-neutral-border-light sp-text-small-medium text-sp-text">
                <Icon name="attachment" size={12} color="var(--sp-icon)" />{a}
                <button type="button" aria-label={`Remove ${a}`} onClick={() => set("attachments", v.attachments.filter((_, j) => j !== i))} className="flex p-0 border-0 bg-transparent cursor-pointer rounded-[var(--sp-radius-pill)] outline-none focus-visible:shadow-[var(--sp-focus-brand)]">
                  <Icon name="close" size={12} color="var(--sp-icon)" />
                </button>
              </span>
            ))}
          </span>
        )}
      </FormField>

      {/* due date · subtasks · solution type — each shows its value once set */}
      <div className="flex flex-col gap-[var(--sp-space-2x)]">
        <div className="flex flex-wrap items-center gap-x-[var(--sp-space-3x)] gap-y-[var(--sp-space-1x)]">
          {chipBtn("due", "cal", "Due date")}
          {chipBtn("sub", "unordered_list", "Subtasks", v.subtasks.some((s) => s.trim()) ? String(v.subtasks.filter((s) => s.trim()).length) : undefined)}
          {/* Solution type — pushed to the right, opens a dropdown to choose one */}
          <div
            ref={solRef}
            className="relative ml-auto"
            onKeyDown={(e) => { if (e.key === "Escape" && solOpen) { e.stopPropagation(); setSolOpen(false); } }}
          >
            <button
              ref={solBtnRef}
              type="button"
              aria-label={`Solution type: ${hasSubs ? "per subtask" : SOLUTION[v.proof].label}`}
              aria-haspopup="menu"
              aria-expanded={solOpen}
              disabled={hasSubs}
              title={hasSubs ? "With subtasks, choose the solution type on each subtask" : undefined}
              onClick={() => setSolOpen((o) => !o)}
              className={`inline-flex items-center h-8 p-[var(--sp-space-2x)] gap-[var(--sp-space-1x)] border-0 rounded-[var(--sp-radius-2x)] sp-text-medium whitespace-nowrap outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)] ${hasSubs ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${solOpen ? "bg-sp-selected text-sp-text-selected" : "bg-transparent text-sp-brand-on-surface"}`}
            >
              <Icon name={SOLUTION[v.proof].icon} />
              <span className="leading-none">Solution type</span>
              <Icon name="expanded" className={solOpen ? "rotate-180" : ""} />
            </button>
            <Popover
              open={solOpen}
              anchorRef={solBtnRef}
              panelRef={solPanelRef}
              placement="bottom-end"
              minWidth={176}
              maxWidth={280}
              maxHeight={240}
              role="menu"
              aria-label="Solution type"
              className="flex flex-col overflow-y-auto p-[var(--sp-space-1x)] bg-sp-form-control-background-color border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] shadow-[var(--sp-shadow-m)]"
            >
                {(Object.keys(SOLUTION) as TaskProof[]).map((k) => (
                  <MenuListItem key={k} inset icon={SOLUTION[k].icon} label={SOLUTION[k].label} selected={v.proof === k} onClick={() => { set("proof", k); setSolOpen(false); }} />
                ))}
            </Popover>
          </div>
        </div>

        {panel === "sub" && (
          <div className="flex flex-col gap-[var(--sp-space-2x)] p-[var(--sp-space-3x)] bg-sp-surface-raised rounded-[var(--sp-radius-2x)]">
            {v.subtasks.map((s, i) => (
              <div key={i} className="flex items-center gap-[var(--sp-space-2x)]">
                <TextField
                  aria-label={`Subtask ${i + 1}`}
                  value={s}
                  autoFocus={i === v.subtasks.length - 1 && !s}
                  onChange={(t) => set("subtasks", v.subtasks.map((x, j) => (j === i ? t : x)))}
                  placeholder={`Subtask ${i + 1}`}
                  onEnter={() => { if (s.trim()) set("subtasks", [...v.subtasks, ""]); }}
                  className="flex-1"
                />
                <SubtaskSolution index={i} value={subProof(i)} onChange={(p) => setSubProof(i, p)} />
                <button type="button" aria-label={`Remove subtask ${i + 1}`} onClick={() => setV((s) => ({ ...s, subtasks: s.subtasks.filter((_, j) => j !== i), subtaskProofs: (s.subtaskProofs ?? []).filter((_, j) => j !== i) }))} className="flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)] [--del:var(--sp-icon)] hover:[--del:var(--sp-danger-on-surface)] focus-visible:[--del:var(--sp-danger-on-surface)]">
                  <Icon name="delete" color="var(--del)" />
                </button>
              </div>
            ))}
            <div><Button variant="tertiary" icon="plus" label="Add subtask" onClick={() => set("subtasks", [...v.subtasks, ""])} /></div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-[var(--sp-space-3x)]">
        <Switch checked={v.approval} onChange={(a) => set("approval", a)} label="Send to me for approval after completion" />
        <Switch checked={v.priority} onChange={(p) => set("priority", p)} label="Priority" />
      </div>

      {/* Summary — collapsible review */}
      <div className="border border-solid rounded-[var(--sp-radius-2x)]" style={{ background: cssVar(info.bg), borderColor: cssVar(info.border) }}>
        <button
          type="button"
          aria-expanded={summary}
          onClick={() => setSummary((s) => !s)}
          className="flex items-center w-full h-10 px-[var(--sp-space-3x)] gap-[var(--sp-space-2x)] border-0 bg-transparent text-left cursor-pointer rounded-[var(--sp-radius-2x)] outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
        >
          <Icon name="sum" color={cssVar(info.fg)} />
          <span className="flex-1 sp-text-medium text-sp-text">Summary</span>
          <Icon name="expanded" color="var(--sp-text)" className={summary ? "rotate-180" : ""} />
        </button>
        {summary && (
          <div className="flex flex-col gap-[var(--sp-space-2x)] px-[var(--sp-space-3x)] pb-[var(--sp-space-3x)]">
            <Row k="Recipient">{names.length ? names.join(", ") : <span className="text-sp-text-label">—</span>}</Row>
            <Row k="Title">{v.title.trim() || <span className="text-sp-text-label">—</span>}</Row>
            <Row k="Due">{dueLabel(v.due)}</Row>
            <Row k="Subtasks">{v.subtasks.filter((s) => s.trim()).length || "None"}</Row>
            <Row k="Solution type">{hasSubs ? "Per subtask" : SOLUTION[v.proof].label}</Row>
            <Row k="Options">{[v.priority && "Priority", v.approval && "Approval after completion"].filter(Boolean).join(", ") || "None"}</Row>
            {!!v.attachments.length && <Row k="Attachments">{v.attachments.length}</Row>}
          </div>
        )}
      </div>
    </Modal>
  );
}
