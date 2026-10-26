import { useState } from "react";
import { Icon } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { DetailRow } from "../molecules/DetailRow";
import { HistoryTimeline, type HistoryEntry } from "../molecules/HistoryTimeline";
import { Modal } from "../molecules/Modal";
import { PriorityIndicator } from "../molecules/PriorityIndicator";
import { ShiftPill } from "../molecules/ShiftPill";
import { SOLUTION, TASK_STATUS, TaskDueChip, type TaskFile, type TaskRowData } from "../molecules/TaskRow";
import { FilePreview } from "./FilePreview";
import { SubtaskList, type SubFile } from "./SubtaskList";
import { TabBar } from "./TabBar";
import { TaskFiles } from "./TaskFiles";

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
  onClose: () => void;
}

/** Task detail on the SP3 Modal (centred, focus trap, Esc): small title (Title/H3) + status chip (type, priority and tags are rows below),
    key-value rows (Zugewiesen an · Fällig as the same due pill as the list · Wiederholung · Standort), then the plain Beschreibung,
    then what the employee handed in: Fotos / Anhänge (attachment + camera tasks, click = viewer) or Unteraufgaben (SubtaskList: progress +
    a resolve icon per row — check / photo / attachment), all under the tab "Details"; the tab "Verlauf" holds the history timeline. */
export function TaskDetailModal({ task, subtaskDone, subtaskFiles = {}, onToggleSubtask, onAddSubtaskFiles, extraHistory = [], onClose }: TaskDetailModalProps) {
  const [tab, setTab] = useState("details");
  const [viewer, setViewer] = useState<{ files: TaskFile[]; start: number } | null>(null);
  const st = TASK_STATUS[task.status];
  const subs = task.subtaskItems ?? [];
  const sol = SOLUTION[task.proof];

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
    ...(task.library ? [] : [task.status === "done"
      ? { id: "state", title: task.doneBy ? `Erledigt von ${task.doneBy}` : "Erledigt", meta: `${task.due.date}, ${task.doneAt ?? task.due.time}`, state: "done" as const }
      : task.status === "overdue"
        ? { id: "state", title: "Noch nicht erledigt", meta: `Überfällig seit ${task.due.date}, ${task.due.time}`, state: "danger" as const }
        : { id: "state", title: "Noch nicht erledigt", meta: task.noDue ? undefined : `Fällig ${task.due.date}, ${task.due.time}`, state: "pending" as const }]),
  ];

  return (
    <>
      <Modal
        title={task.title}
        titleSize="h3"
        onClose={onClose}
        minWidth={360}
        subtitle={
          <span className="flex flex-wrap items-center gap-[var(--sp-space-2x)]">
            {task.library
              ? <StatusChip tone="default" icon={task.recurring ? "repeat" : undefined} label={task.schedule.split(" · ")[0]} />
              : <StatusChip tone={st.tone} icon={st.icon} label={st.label} />}
          </span>
        }
      >
      <TabBar label="Aufgabe" value={tab} onChange={setTab} tabs={[{ id: "details", label: "Details" }, { id: "history", label: "Verlauf", count: history.length }]} />

      {/* both tabs share one grid cell, so the dialog keeps the height of the taller one when switching */}
      <div className="grid">
      {(
        <div aria-hidden={tab !== "details"} {...(tab !== "details" ? ({ inert: "" } as object) : {})} className={`col-start-1 row-start-1 flex flex-col gap-[var(--sp-space-5x)] pb-[var(--sp-space-2x)] ${tab === "details" ? "" : "invisible"}`}>
          <dl className="m-0 flex flex-col gap-[var(--sp-space-2x)]">
            {task.receiver && task.receiver.kind !== "person" ? (
              <>
                <DetailRow label={task.receiver.kind === "shift" ? "Schicht" : "Zugewiesen an"}>
                  <span className="flex items-center gap-[var(--sp-space-2x)]">
                    <span className="flex items-center justify-center shrink-0 size-6 rounded-[var(--sp-radius-2x)] bg-sp-neutral-fill-light"><Icon name={task.receiver.kind === "shift" ? "user_clock" : "user_group"} color="var(--sp-icon)" /></span>
                    <span className="truncate">{task.person}</span>
                    {task.receiver.kind === "shift" && task.receiver.code && <ShiftPill code={task.receiver.code} color={task.receiver.color} />}
                    {task.receiver.kind === "shift" && task.receiver.time && <span className="sp-text-small text-sp-text-label tabular-nums">{task.receiver.time}</span>}
                  </span>
                </DetailRow>
                <DetailRow label="Gruppe">{task.team}</DetailRow>
              </>
            ) : (
              <DetailRow label="Zugewiesen an">
                <span className="flex items-center gap-[var(--sp-space-2x)]">
                  <span className="flex flex-col min-w-0">
                    <span className="truncate">{task.person}</span>
                    {task.team && <span className="sp-text-small text-sp-text-label truncate">{task.team}</span>}
                  </span>
                </span>
              </DetailRow>
            )}
            {!task.library && (
              <DetailRow label="Fällig">
                {task.noDue ? <span className="text-sp-text-label">Keine Fälligkeit</span> : <TaskDueChip task={task} />}
              </DetailRow>
            )}
            <DetailRow label="Wiederholung">
              <span className="inline-flex items-center gap-[var(--sp-space-1x)]">
                {task.recurring && <Icon name="repeat" color="var(--sp-icon)" />}
                {task.schedule}
              </span>
            </DetailRow>
            {task.location && <DetailRow label="Standort">{task.location}</DetailRow>}
            {!subs.length && (
              <DetailRow label="Erledigt per">
                <span className="inline-flex items-center gap-[var(--sp-space-1x)]"><Icon name={sol.icon} color="var(--sp-icon)" />{sol.label}</span>
              </DetailRow>
            )}
            {task.high && (
              <DetailRow label="Priorität">
                <span className="inline-flex items-center gap-[var(--sp-space-2x)]"><PriorityIndicator />Hoch</span>
              </DetailRow>
            )}
            {!!task.tags.length && (
              <DetailRow label="Kategorie">
                <span className="flex flex-wrap gap-[var(--sp-space-1x)]">{task.tags.map((t) => <StatusChip key={t} tone="default" label={t} />)}</span>
              </DetailRow>
            )}
          </dl>

          {/* description — one light card (same surface as the subtask card), large readable text (older users) */}
          <section aria-label="Beschreibung" className="flex flex-col gap-[var(--sp-space-2x)]">
            <h3 className="m-0 sp-text-medium text-sp-text">Beschreibung</h3>
            <div className="p-[var(--sp-space-4x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)]">
              {task.description ? (
                <p className="m-0 sp-text-body-standard text-sp-text whitespace-pre-wrap break-words">{task.description}</p>
              ) : (
                <p className="m-0 sp-text-standard text-sp-text-placeholder">Keine Beschreibung</p>
              )}
            </div>
          </section>

          {/* what the employee handed in */}
          {!task.library && !subs.length && task.proof !== "check" && (
            <TaskFiles kind={task.proof} files={task.files ?? []} person={task.person} onOpen={(i) => setViewer({ files: task.files ?? [], start: i })} />
          )}
          {!!subs.length && task.library && (
            <section aria-label="Unteraufgaben" className="flex flex-col gap-[var(--sp-space-2x)]">
              <h3 className="m-0 sp-text-medium text-sp-text">Unteraufgaben <span className="sp-text-small text-sp-text-label tabular-nums">{subs.length}</span></h3>
              <ol className="m-0 p-0 list-none bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)]">
                {subs.map((s, i) => (
                  <li key={s.id} className={`flex items-center gap-[var(--sp-space-3x)] h-12 px-[var(--sp-space-3x)] ${i ? "border-0 border-t border-solid border-sp-neutral-fill-light" : ""}`}>
                    <span aria-hidden className="flex items-center justify-center shrink-0 size-6 rounded-full border border-solid border-sp-neutral-border-light bg-sp-neutral-fill-light sp-text-small-medium tabular-nums text-sp-text">{i + 1}</span>
                    <span className="flex-1 min-w-0 truncate sp-text-standard text-sp-text">{s.title}</span>
                    <Icon name={SOLUTION[s.proof ?? "check"].icon} color="var(--sp-icon)" />
                  </li>
                ))}
              </ol>
            </section>
          )}
          {!!subs.length && !task.library && (
            <SubtaskList
              items={subs}
              done={subtaskDone}
              files={subFiles}
              onToggle={onToggleSubtask}
              onAddFiles={onAddSubtaskFiles}
              onOpenFile={(id, i) => setViewer({ files: subFiles[id], start: i })}
            />
          )}
        </div>
      )}

      <div aria-hidden={tab !== "history"} {...(tab !== "history" ? ({ inert: "" } as object) : {})} className={`col-start-1 row-start-1 pb-[var(--sp-space-2x)] ${tab === "history" ? "" : "invisible"}`}>
        <HistoryTimeline entries={history} />
      </div>
      </div>
      </Modal>
      {viewer && <FilePreview files={viewer.files} start={viewer.start} onClose={() => setViewer(null)} />}
    </>
  );
}
