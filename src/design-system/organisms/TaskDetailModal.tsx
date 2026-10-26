import { useState } from "react";
import { Avatar } from "../atoms/Avatar";
import { Icon } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { DetailRow } from "../molecules/DetailRow";
import { HistoryTimeline, type HistoryEntry } from "../molecules/HistoryTimeline";
import { Modal } from "../molecules/Modal";
import { PriorityIndicator } from "../molecules/PriorityIndicator";
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
    task.status === "done"
      ? { id: "state", title: task.doneBy ? `Erledigt von ${task.doneBy}` : "Erledigt", meta: `${task.due.date}, ${task.doneAt ?? task.due.time}`, state: "done" as const }
      : task.status === "overdue"
        ? { id: "state", title: "Noch nicht erledigt", meta: `Überfällig seit ${task.due.date}, ${task.due.time}`, state: "danger" as const }
        : { id: "state", title: "Noch nicht erledigt", meta: task.noDue ? undefined : `Fällig ${task.due.date}, ${task.due.time}`, state: "pending" as const },
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
            <StatusChip tone={st.tone} icon={st.icon} label={st.label} />
          </span>
        }
      >
      <TabBar label="Aufgabe" value={tab} onChange={setTab} tabs={[{ id: "details", label: "Details" }, { id: "history", label: "Verlauf", count: history.length }]} />

      {tab === "details" && (
        <div className="flex flex-col gap-[var(--sp-space-5x)] pb-[var(--sp-space-2x)]">
          <dl className="m-0 flex flex-col gap-[var(--sp-space-2x)]">
            <DetailRow label="Zugewiesen an">
              <span className="flex items-center gap-[var(--sp-space-2x)]">
                <Avatar name={task.person} size={24} />
                <span className="flex flex-col min-w-0">
                  <span className="truncate">{task.person}</span>
                  {task.team && <span className="sp-text-small text-sp-text-label truncate">{task.team}</span>}
                </span>
              </span>
            </DetailRow>
            <DetailRow label="Fällig">
              {task.noDue ? <span className="text-sp-text-label">Keine Fälligkeit</span> : <TaskDueChip task={task} />}
            </DetailRow>
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
          {!subs.length && task.proof !== "check" && (
            <TaskFiles kind={task.proof} files={task.files ?? []} person={task.person} onOpen={(i) => setViewer({ files: task.files ?? [], start: i })} />
          )}
          {!!subs.length && (
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

      {tab === "history" && (
        <div className="pb-[var(--sp-space-2x)]">
          <HistoryTimeline entries={history} />
        </div>
      )}
      </Modal>
      {viewer && <FilePreview files={viewer.files} start={viewer.start} onClose={() => setViewer(null)} />}
    </>
  );
}
