import { useState, type ReactNode } from "react";
import { Button } from "../atoms/Button";
import { Icon, type IconName } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { DetailRow } from "../molecules/DetailRow";
import { HistoryTimeline, type HistoryEntry } from "../molecules/HistoryTimeline";
import { Modal } from "../molecules/Modal";
import { PriorityIndicator } from "../molecules/PriorityIndicator";
import { ShiftPill } from "../molecules/ShiftPill";
import { SOLUTION, TASK_STATUS, type TaskFile, type TaskRowData } from "../molecules/TaskRow";
import { UploadFileList } from "../molecules/UploadFileRow";
import { TONES, cssVar } from "../utils/tones";
import { FilePreview } from "./FilePreview";
import { SubtaskList, type SubFile } from "./SubtaskList";
import { TabBar } from "./TabBar";

export interface TaskDetailModalProps {
  task: TaskRowData;
  /** ids of the ticked subtasks */
  subtaskDone: string[];
  /** files added to photo / attachment subtasks in this session, by subtask id */
  subtaskFiles?: Record<string, SubFile[]>;
  onToggleSubtask: (id: string) => void;
  onAddSubtaskFiles: (id: string, files: File[]) => void;
  /** events added in this session (ticked subtasks …), oldest first — shown after "Erstellt von" */
  extraHistory?: HistoryEntry[];
  /** previous / next task of the list the detail was opened from — no handler = button disabled */
  onPrev?: () => void;
  onNext?: () => void;
  /** place of this task in that list ("3 von 24") — omitted = no counter */
  position?: { index: number; total: number };
  onClose: () => void;
}

/** fixed size of the task detail, whatever the task holds — width = the widest case (long title, Upload File Rows with
    name · size · date · 2 actions, strip with chip + receiver) = --tms-modal-max-width (672px); taller content scrolls inside. */
export const TASK_DETAIL_WIDTH = 672;
export const TASK_DETAIL_MAX_HEIGHT = 800;

const WEEKDAY = new Intl.DateTimeFormat("de-DE", { weekday: "short" });

/** "03.11.26" → "Di 03.11.26" */
function withWeekday(date: string) {
  const [d, m, y] = date.split(".").map(Number);
  return d && m && y !== undefined ? `${WEEKDAY.format(new Date(2000 + y, m - 1, d)).replace(".", "")} ${date}` : date;
}

/** what the employee does to complete a task without subtasks */
const ACTION_LABEL: Record<TaskRowData["proof"], string> = { check: "Abhaken", photo: "Foto aufnehmen", attachment: "Datei anhängen" };

/** One fact of the key-facts strip: small label (16px icon + Roboto Small in text label) above its value, gap 2x. */
function Fact({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-[var(--sp-space-2x)] min-w-0">
      <span className="inline-flex items-center gap-[var(--sp-space-1x)] sp-text-small text-sp-text-label"><Icon name={icon} color="var(--sp-icon)" />{label}</span>
      {children}
    </div>
  );
}

/** Task detail on the SP3 Modal (centred, focus trap, Esc), fixed 672px wide, max 800px high. Header: status icon (status colour) + title
    (Title/H3) + priority marker, below "Status · ↻ schedule". Tabs Details / Verlauf. Details:
    key-facts strip (no frame): Fällig as a Badge Chip in the status colour | Zuständig — name · group · location, and below what the receiver
    did (only they can complete the task): "Erledigt am …" / "Noch nicht erledigt" · Details rows (Kategorie, Erstellt) · Beschreibung ·
    then how it is completed: subtasks as separate cards, or one solution card "Erledigt per" in the same look (action · solution icon,
    green when done · handed-in files as SP3 Upload File Rows). Toolbar (SP3 Dialog): Schließen left, "3 von 24" + Vorherige / Nächste right. */
export function TaskDetailModal({ task, subtaskDone, subtaskFiles = {}, onToggleSubtask, onAddSubtaskFiles, extraHistory = [], onPrev, onNext, position, onClose }: TaskDetailModalProps) {
  const [tab, setTab] = useState("details");
  const [viewer, setViewer] = useState<{ files: TaskFile[]; start: number } | null>(null);
  const st = TASK_STATUS[task.status];
  const fg = cssVar(TONES[st.tone].fg);
  const subs = task.subtaskItems ?? [];
  const sol = SOLUTION[task.proof];
  const isDone = task.status === "done";

  // files of every subtask: handed in by the employee (only while the subtask is done) + added in this session
  const subFiles: Record<string, TaskFile[]> = {};
  for (const s of subs) {
    const seeded = subtaskDone.includes(s.id) ? s.files ?? [] : [];
    const added = (subtaskFiles[s.id] ?? []).map((f, i): TaskFile => ({ id: `${s.id}-new-${i}`, ...f, by: task.person, at: "gerade eben" }));
    const all = [...seeded, ...added];
    if (all.length) subFiles[s.id] = all;
  }

  const history: HistoryEntry[] = [
    { id: "created", title: `Erstellt von ${task.createdBy ?? "—"}`, meta: task.createdAt, state: "done" },
    ...extraHistory,
    ...(task.library ? [] : [isDone
      ? { id: "state", title: task.doneBy ? `Erledigt von ${task.doneBy}` : "Erledigt", meta: `${task.due.date}, ${task.doneAt ?? task.due.time}`, state: "done" as const }
      : task.status === "overdue"
        ? { id: "state", title: "Noch nicht erledigt", meta: `Überfällig seit ${task.due.date}, ${task.due.time}`, state: "danger" as const }
        : { id: "state", title: "Noch nicht erledigt", meta: task.noDue ? undefined : `Fällig ${task.due.date}, ${task.due.time}`, state: "pending" as const }]),
  ];

  const shiftOnly = !!task.shifts?.length && task.person === task.shifts[0].name;
  const group = task.receiver?.kind === "person" || !task.receiver ? task.team : task.receiver.group;
  const shift = task.receiver?.kind === "shift" ? task.receiver : shiftOnly ? task.shifts![0] : null;

  return (
    <>
      <Modal
        title={task.title}
        titleSize="h3"
        onClose={onClose}
        width={TASK_DETAIL_WIDTH}
        minWidth={TASK_DETAIL_WIDTH}
        maxHeight={TASK_DETAIL_MAX_HEIGHT}
        titleStart={task.library ? undefined : <Icon name={st.icon} size={20} color={fg} />}
        titleEnd={task.high ? <PriorityIndicator label="Hohe Priorität" /> : undefined}
        subtitle={
          <span className="flex flex-wrap items-center gap-[var(--sp-space-1x)] sp-text-standard text-sp-text-label">
            {!task.library && <><span className="sp-text-medium" style={{ color: fg }}>{st.label}</span><span aria-hidden>·</span></>}
            {task.recurring && <Icon name="repeat" color="var(--sp-icon)" />}
            {task.schedule}
          </span>
        }
        footerStart={<Button variant="secondary" label="Schließen" onClick={onClose} />}
        footer={
          <>
            {position && <span className="mr-[var(--sp-space-2x)] sp-text-standard text-sp-text-label tabular-nums">{position.index} von {position.total}</span>}
            <Button variant="secondary" icon="left" label="Vorherige" disabled={!onPrev} onClick={onPrev} />
            <Button variant="primary" endIcon="right" label="Nächste" disabled={!onNext} onClick={onNext} />
          </>
        }
      >
      <div className="pt-[var(--sp-space-3x)]">
        <TabBar label="Aufgabe" value={tab} onChange={setTab} tabs={[{ id: "details", label: "Details" }, { id: "history", label: "Verlauf", count: history.length }]} />
      </div>

      {/* both tabs share one grid cell, so the dialog keeps the height of the taller one when switching */}
      <div className="grid">
        <div aria-hidden={tab !== "details"} {...(tab !== "details" ? ({ inert: "" } as object) : {})} className={`col-start-1 row-start-1 flex flex-col gap-[var(--sp-space-6x)] ${tab === "details" ? "" : "invisible"}`}>
          {/* key facts (no frame): Fällig | Zuständig + what the receiver did — only the receiver can complete the task */}
          <div className="flex items-stretch gap-[var(--sp-space-5x)] pb-[var(--sp-space-4x)] border-0 border-b border-solid border-sp-border-line">
            {!task.library && (
              <>
                <Fact icon="cal_clock" label="Fällig">
                  {task.noDue
                    ? <span className="sp-text-medium text-sp-text-label">Keine Fälligkeit</span>
                    : <StatusChip tone={st.tone} icon={st.icon} label={`${withWeekday(task.due.date)} – ${task.due.time}`} />}
                </Fact>
                <span aria-hidden className="w-px shrink-0 bg-sp-border-line" />
              </>
            )}
            <Fact icon={shift ? "user_clock" : task.receiver?.kind === "team" ? "user_group" : "user"} label="Zuständig">
              <span className="flex flex-col gap-[var(--sp-space-1x)] min-w-0">
                <span className="flex flex-wrap items-center gap-x-[var(--sp-space-3x)] gap-y-[var(--sp-space-1x)] min-w-0">
                  <span className="sp-text-medium text-sp-text">{task.person}</span>
                  {shift?.code && <ShiftPill code={shift.code} color={shift.color} />}
                  {task.receiver?.kind === "shift" && task.receiver.time && <span className="sp-text-small text-sp-text-label tabular-nums">{task.receiver.time}</span>}
                  <span className="inline-flex flex-wrap items-center gap-x-[var(--sp-space-3x)] gap-y-[var(--sp-space-1x)] sp-text-small text-sp-text-label">
                    {group && <span className="inline-flex items-center gap-[var(--sp-space-1x)]"><Icon name="user_group" color="var(--sp-icon)" />{group}</span>}
                    {task.location && <span className="inline-flex items-center gap-[var(--sp-space-1x)]"><Icon name="marker" color="var(--sp-icon)" />{task.location}</span>}
                  </span>
                </span>
                {!task.library && (
                  <span className="inline-flex items-center gap-[var(--sp-space-1x)] sp-text-small" style={{ color: task.status === "open" ? "var(--sp-text-label)" : fg }}>
                    <Icon name={st.icon} color={fg} />
                    {isDone ? `Erledigt am ${withWeekday(task.due.date)}, ${task.doneAt ?? task.due.time}` : "Noch nicht erledigt"}
                  </span>
                )}
              </span>
            </Fact>
          </div>

          {(!!task.tags.length || task.createdBy) && (
            <section aria-label="Details" className="flex flex-col gap-[var(--sp-space-2x)]">
              <h3 className="m-0 sp-text-medium text-sp-text">Details</h3>
              <dl className="m-0 flex flex-col gap-[var(--sp-space-2x)]">
                {!!task.tags.length && (
                  <DetailRow label="Kategorie">
                    <span className="flex flex-wrap gap-[var(--sp-space-1x)]">{task.tags.map((t) => <StatusChip key={t} tone="default" label={t} />)}</span>
                  </DetailRow>
                )}
                {task.createdBy && <DetailRow label="Erstellt">{[task.createdBy, task.createdAt].filter(Boolean).join(" · ")}</DetailRow>}
              </dl>
            </section>
          )}

          <section aria-label="Beschreibung" className="flex flex-col gap-[var(--sp-space-2x)]">
            <h3 className="m-0 sp-text-medium text-sp-text">Beschreibung</h3>
            {task.description
              ? <p className="m-0 sp-text-body-standard text-sp-text whitespace-pre-wrap break-words">{task.description}</p>
              : <p className="m-0 sp-text-standard text-sp-text-placeholder">Keine Beschreibung</p>}
          </section>

          {/* how it is completed: subtasks — or one solution card in the same look */}
          {subs.length ? (
            <SubtaskList
              items={subs}
              done={subtaskDone}
              files={subFiles}
              readOnly={task.library}
              onToggle={onToggleSubtask}
              onAddFiles={onAddSubtaskFiles}
              onOpenFile={(id, i) => setViewer({ files: subFiles[id], start: i })}
            />
          ) : (
            <section aria-label="Erledigt per" className="flex flex-col gap-[var(--sp-space-2x)]">
              <h3 className="m-0 sp-text-medium text-sp-text">Erledigt per</h3>
              <div className="flex flex-col gap-[var(--sp-space-3x)] py-[var(--sp-space-2x)] px-[var(--sp-space-4x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-3x)]">
                <div className="flex items-center gap-[var(--sp-space-4x)] min-h-[var(--sp-space-8x)]">
                  <span className="flex-1 min-w-0 sp-text-medium text-sp-text">{ACTION_LABEL[task.proof]}</span>
                  <span role="img" aria-label={`${sol.label}${isDone ? " · erledigt" : ""}`} className="flex">
                    <Icon name={sol.icon} size={20} color={isDone ? "var(--sp-success-on-surface)" : "var(--sp-icon)"} />
                  </span>
                </div>
                {!task.library && task.proof !== "check" && (
                  <div className="pb-[var(--sp-space-2x)]">
                    {task.files?.length ? (
                      <UploadFileList files={task.files} onOpen={(i) => setViewer({ files: task.files ?? [], start: i })} />
                    ) : (
                      <p className="m-0 sp-text-standard text-sp-text-label">{task.proof === "photo" ? "Noch kein Foto" : "Noch keine Datei"} – {task.person} hat noch nichts abgegeben.</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div aria-hidden={tab !== "history"} {...(tab !== "history" ? ({ inert: "" } as object) : {})} className={`col-start-1 row-start-1 ${tab === "history" ? "" : "invisible"}`}>
          <HistoryTimeline entries={history} />
        </div>
      </div>
      </Modal>
      {viewer && <FilePreview files={viewer.files} start={viewer.start} onClose={() => setViewer(null)} />}
    </>
  );
}
