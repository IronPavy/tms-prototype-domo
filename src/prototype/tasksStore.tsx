import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Modal, NewTaskModal, TaskDetailModal, Toast, type TaskAction, dueClock, emptyTask, scheduleLabel, type HistoryEntry, type NewTaskValues, type SubFile, type TaskGroup, type TaskRowData } from "@/design-system";
import { addDays, sameDay, startOfDay } from "@/design-system/utils/date";
import { ALL_SCOPE, TODAY, assignment, compareDue, recipientIds, recipientsForScope, resolveRecipient, type CreatedStat } from "./data";
import { useScope } from "./scope";

export interface CreatedTask { task: TaskRowData; day: Date }
export interface Draft { id: string; values: NewTaskValues; savedAt: string }

interface TasksStore {
  created: CreatedTask[];
  /** created tasks as KPI input */
  createdStats: CreatedStat[];
  drafts: Draft[];
  openNewTask: (draftId?: string) => void;
  deleteDraft: (id: string) => void;
  /** open the task detail modal (centred) */
  openDetail: (task: TaskRowData) => void;
  /** apply edits made in the detail modal to the groups of the Tasks page */
  withEdits: (groups: TaskGroup[]) => TaskGroup[];
  /** edits + deletions applied to a flat list (Bibliothek) */
  withEditsList: (tasks: TaskRowData[]) => TaskRowData[];
  /** three-dot menu of a list row: copy (new task from this one) · edit · delete (asks first) */
  taskAction: (action: TaskAction, task: TaskRowData) => void;
  /** recipients as names, for the Drafts list */
  recipientNames: (ids: string[]) => string;
}

const Ctx = createContext<TasksStore | null>(null);
export const useTasks = () => useContext(Ctx)!;

const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}, ${pad(d.getHours())}:${pad(d.getMinutes())} Uhr`;
const ME = "Michael Potsch";

const seedDraft = (id: string, daysAgo: number, v: Partial<NewTaskValues>): Draft => ({
  id, savedAt: stamp(new Date(startOfDay(addDays(TODAY, -daysAgo)).getTime() + (9 + daysAgo) * 3600e3 + 17 * 60e3)), values: { ...emptyTask(TODAY), ...v },
});
const SEED_DRAFTS: Draft[] = [
  seedDraft("d1", 1, { title: "Notausgänge prüfen", recipients: ["p9", "p14", "p15"], proof: "check", subtasks: ["Ausgang 1", "Ausgang 2"] }),
  seedDraft("d2", 2, { title: "Allergene der Speisekarte prüfen", recipients: ["p1", "p4"], proof: "attachment", priority: true }),
  seedDraft("d3", 4, { title: "Terrasse grundreinigen", recipients: ["p6"], proof: "photo" }),
];

/** Task row from the modal values — due in the past = overdue, else open */
function buildTask(v: NewTaskValues, id: string): CreatedTask {
  const dd = v.due;
  const due = new Date(`${dd.start}T${dueClock(dd)}`);
  const day = startOfDay(due);
  const now = new Date();
  const named = v.subtasks.map((title, i) => ({ title: title.trim(), proof: v.subtaskProofs?.[i] })).filter((s) => s.title);
  const subtasks = named.length;
  const subtaskItems = named.map((s, i) => ({ id: `${id}-s${i}`, title: s.title, proof: s.proof === "photo" || s.proof === "attachment" ? s.proof : ("check" as const) }));
  return {
    day,
    task: {
      id, title: v.title.trim(), high: v.priority, recurring: dd.repeat !== "none", schedule: scheduleLabel(dd), tags: [],
      ...assignment(v.recipients),
      subtasks: subtasks || undefined, subtaskItems: subtasks ? subtaskItems : undefined, description: v.description.trim() || undefined, createdBy: ME, createdAt: stamp(now),
      due: { date: `${pad(due.getDate())}.${pad(due.getMonth() + 1)}.${String(due.getFullYear()).slice(2)}`, time: dd.timeMode === "allday" ? "ganztägig" : dd.timeMode === "range" ? `${dd.from}–${dd.to}` : dd.time },
      proof: v.proof, status: due < now ? "overdue" : "open", comments: undefined,
    },
  };
}

/** New task form values of an existing task (Edit task) */
function valuesFromTask(t: TaskRowData): NewTaskValues {
  const base = emptyTask(TODAY);
  const [d, m, y] = t.due.date.split(".").map(Number);
  const repeat = !t.recurring ? "none" : t.schedule.startsWith("Täglich") ? "daily" : t.schedule.startsWith("Wöchentlich") ? "weekly" : t.schedule.startsWith("Monatlich") ? "monthly" : "yearly";
  const clock = /^\d{2}:\d{2}$/.test(t.due.time) ? t.due.time : "17:00";
  return {
    ...base,
    recipients: recipientIds(t),
    title: t.title,
    description: t.description ?? "",
    due: { ...base.due, repeat, start: `${2000 + y}-${pad(m)}-${pad(d)}`, timeMode: /ganz|all day/i.test(t.due.time) ? "allday" : "time", time: clock },
    subtasks: (t.subtaskItems ?? []).map((x) => x.title),
    proof: t.proof,
    priority: !!t.high,
  };
}

/** Put the created tasks into the groups of the Tasks page: overdue → "Overdue – still open", else the day of their due date. */
export function withCreatedTasks(groups: TaskGroup[], created: CreatedTask[]): TaskGroup[] {
  const out = groups.map((g) => ({ ...g, tasks: [...g.tasks] }));
  for (const { task, day } of created) {
    let g = task.status === "overdue" ? out.find((x) => x.kind === "overdue") : out.find((x) => x.date && sameDay(x.date, day));
    if (!g && task.status === "overdue") {
      g = { id: "overdue", label: "Overdue – still open", kind: "overdue", tasks: [] };
      out.unshift(g);
    }
    g?.tasks.push(task);
  }
  out.forEach((g) => { if (g.kind !== "overdue") g.tasks.sort(compareDue); });
  return out;
}

/** Holds created tasks + drafts and renders the New task modal and its toast. `onView` opens the Tasks page. */
export function TasksProvider({ children, onView }: { children: ReactNode; onView: () => void }) {
  const scope = useScope();
  const [created, setCreated] = useState<CreatedTask[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>(SEED_DRAFTS);
  const [modal, setModal] = useState<{ draftId?: string; copy?: NewTaskValues } | null>(null);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<TaskRowData | null>(null);
  const [toast, setToast] = useState<{ id: string; message: string; undo?: () => void; noView?: boolean } | null>(null);
  const [counter, setCounter] = useState(1);
  // task detail modal
  const [detail, setDetail] = useState<TaskRowData | null>(null);
  const [editing, setEditing] = useState(false);
  /** edit opened from the list menu (not from the detail) — closing it returns to the list */
  const [editFromList, setEditFromList] = useState(false);
  const [subState, setSubState] = useState<Record<string, Record<string, { done: boolean; files?: SubFile[] }>>>({});
  const [events, setEvents] = useState<Record<string, HistoryEntry[]>>({});
  const [edits, setEdits] = useState<Record<string, Partial<TaskRowData>>>({});

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const draft = modal?.draftId ? drafts.find((d) => d.id === modal.draftId) : undefined;

  const store = useMemo<TasksStore>(() => ({
    created,
    createdStats: created.map((c) => ({ status: c.task.status, location: c.task.location, day: c.day })),
    drafts,
    openNewTask: (draftId) => setModal({ draftId }),
    deleteDraft: (id) => setDrafts((d) => d.filter((x) => x.id !== id)),
    openDetail: (task) => { setEditing(false); setEditFromList(false); setDetail(task); },
    taskAction: (action, task) => {
      if (action === "copy") setModal({ copy: { ...valuesFromTask({ ...task, ...edits[task.id] }), title: `${(edits[task.id]?.title ?? task.title)} (Kopie)` } });
      else if (action === "edit") { setDetail(task); setEditFromList(true); setEditing(true); }
      else setConfirmDelete(task);
    },
    withEditsList: (tasks) => tasks.filter((t) => !deleted.includes(t.id)).map((t) => (edits[t.id] ? { ...t, ...edits[t.id] } : t)),
    withEdits: (groups) => groups.map((g) => ({
      ...g,
      tasks: g.tasks.filter((t0) => !deleted.includes(t0.id)).map((t0) => {
        const t = edits[t0.id] ? { ...t0, ...edits[t0.id] } : t0;
        // ticked subtasks (task detail) show live in the row as "2/5"
        const st = subState[t.id];
        return st && t.subtaskItems ? { ...t, subtaskItems: t.subtaskItems.map((s) => ({ ...s, done: st[s.id]?.done ?? s.done })) } : t;
      }),
    })),
    recipientNames: (ids) => ids.flatMap((i) => resolveRecipient(i)?.label ?? []).join(", "),
  }), [created, drafts, edits, subState, deleted]);

  const send = (v: NewTaskValues) => {
    const built = buildTask(v, `new-${counter}`);
    setCounter((c) => c + 1);
    setCreated((c) => [...c, built]);
    if (modal?.draftId) setDrafts((d) => d.filter((x) => x.id !== modal.draftId));
    setModal(null);
    setToast({ id: built.task.id, message: `Task “${built.task.title}” created.`, undo: () => { setCreated((c) => c.filter((x) => x.task.id !== built.task.id)); setToast(null); } });
  };
  const saveDraft = (v: NewTaskValues) => {
    const id = modal?.draftId ?? `d-${Date.now()}`;
    const next: Draft = { id, values: v, savedAt: stamp(new Date()) };
    setDrafts((d) => (d.some((x) => x.id === id) ? d.map((x) => (x.id === id ? next : x)) : [next, ...d]));
    setModal(null);
    setToast({ id, message: "Draft saved." });
  };

  const cur = detail ? { ...detail, ...edits[detail.id] } : null;
  const doneIds = cur ? (cur.subtaskItems ?? []).filter((x) => subState[cur.id]?.[x.id]?.done ?? x.done).map((x) => x.id) : [];
  const subFiles: Record<string, SubFile[]> = {};
  Object.entries(cur ? subState[cur.id] ?? {} : {}).forEach(([k, v]) => { if (v.files?.length) subFiles[k] = v.files; });

  /** one subtask changes state (check toggled / file added / file removed) + a history entry */
  const setSub = (id: string, done: boolean, files?: SubFile[], added?: SubFile[]) => {
    if (!cur) return;
    const title = cur.subtaskItems?.find((x) => x.id === id)?.title ?? "";
    setSubState((m) => ({ ...m, [cur.id]: { ...m[cur.id], [id]: { done, files } } }));
    const names = files && files.length > 1 ? `${files.length} Dateien` : files?.[0]?.name;
    const text = done ? (added ? `Unteraufgabe „${title}“ – ${added.length > 1 ? `${added.length} Dateien` : "Datei"} hinzugefügt: ${added.map((f) => f.name).join(", ")}` : names ? `Unteraufgabe „${title}“ erledigt – ${names}` : `Unteraufgabe „${title}“ erledigt`) : `Unteraufgabe „${title}“ wieder geöffnet`;
    setEvents((m) => ({ ...m, [cur.id]: [...(m[cur.id] ?? []), { id: `e-${Date.now()}`, title: text, meta: stamp(new Date()), state: done ? "done" : "pending" }] }));
  };
  const toggleSubtask = (id: string) => setSub(id, !doneIds.includes(id));
  const addSubtaskFiles = (id: string, list: File[]) => {
    const fresh: SubFile[] = list.map((f) => ({ name: f.name, size: f.size, kind: f.type.startsWith("image/") ? "image" : f.type === "application/pdf" ? "pdf" : "other", url: URL.createObjectURL(f) }));
    const had = subState[cur?.id ?? ""]?.[id]?.files ?? [];
    setSub(id, true, [...had, ...fresh], had.length > 0 || doneIds.includes(id) ? fresh : undefined);
  };
  const saveEdit = (v: NewTaskValues) => {
    if (!cur) return;
    const [y, m, d] = v.due.start.split("-");
    const old = cur.subtaskItems ?? [];
    const items = v.subtasks.filter((x) => x.trim()).map((title, i) => ({ id: old.find((o) => o.title === title)?.id ?? `${cur.id}-e${i}`, title }));
    setEdits((e) => ({
      ...e,
      [cur.id]: {
        ...e[cur.id],
        title: v.title.trim(), description: v.description.trim() || undefined, high: v.priority, proof: v.proof,
        ...(v.recipients.length ? (({ person, team, others, shifts }) => ({ person, team, others, shifts }))(assignment(v.recipients)) : {}),
        recurring: v.due.repeat !== "none", schedule: scheduleLabel(v.due),
        due: { date: `${d}.${m}.${y.slice(2)}`, time: v.due.timeMode === "allday" ? "ganztägig" : v.due.timeMode === "range" ? `${v.due.from}–${v.due.to}` : v.due.time },
        subtasks: items.length || undefined, subtaskItems: items.length ? items : undefined,
      },
    }));
    setEditing(false);
    if (editFromList) setDetail(null);
    setToast({ id: `edit-${cur.id}`, message: "Task updated." });
  };

  // recipients inside the page scope (a continued draft keeps everyone it already picked)
  const options = recipientsForScope(draft ? ALL_SCOPE : scope);

  return (
    <Ctx.Provider value={store}>
      {children}
      {modal && (
        <NewTaskModal
          key={modal.draftId ?? (modal.copy ? "copy" : "new")}
          recipients={options}
          initial={draft?.values ?? modal.copy ?? emptyTask(TODAY)}
          isDraft={!!draft}
          onSend={send}
          onSaveDraft={saveDraft}
          onClose={() => setModal(null)}
        />
      )}
      {cur && !editing && (
        <TaskDetailModal
          key={cur.id}
          task={cur}
          subtaskDone={doneIds}
          subtaskFiles={subFiles}
          onToggleSubtask={toggleSubtask}
          onAddSubtaskFiles={addSubtaskFiles}
          extraHistory={events[cur.id]}
          onClose={() => setDetail(null)}
        />
      )}
      {cur && editing && (
        <NewTaskModal
          key={`edit-${cur.id}`}
          mode="edit"
          recipients={recipientsForScope(ALL_SCOPE)}
          initial={valuesFromTask(cur)}
          onSend={saveEdit}
          onSaveDraft={() => {}}
          onClose={() => { setEditing(false); if (editFromList) setDetail(null); }}
        />
      )}
      {confirmDelete && (
        <Modal
          title="Aufgabe löschen?"
          titleSize="h3"
          width={440}
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <Button variant="tertiary" label="Abbrechen" onClick={() => setConfirmDelete(null)} />
              <Button
                variant="primary"
                icon="delete"
                label="Löschen"
                onClick={() => {
                  const id = confirmDelete.id;
                  setDeleted((d) => [...d, id]);
                  setConfirmDelete(null);
                  setToast({ id: `del-${id}`, message: `Aufgabe „${confirmDelete.title}“ gelöscht.`, noView: true, undo: () => { setDeleted((d) => d.filter((x) => x !== id)); setToast(null); } });
                }}
              />
            </>
          }
        >
          <p className="m-0 sp-text-body-standard text-sp-text">
            Möchten Sie die Aufgabe „{confirmDelete.title}“ wirklich löschen? Sie wird aus der Liste entfernt{confirmDelete.status === "done" ? " – einschließlich der abgegebenen Nachweise" : ""}. Direkt danach können Sie das Löschen noch rückgängig machen.
          </p>
        </Modal>
      )}
      {toast && (
        <div className="fixed bottom-[var(--sp-space-6x)] left-1/2 -translate-x-1/2 z-[60]">
          <Toast
            message={toast.message}
            onClose={() => setToast(null)}
            actions={toast.undo
              ? [...(toast.noView ? [] : [{ label: "View", onClick: () => { onView(); setToast(null); } }]), { label: "Undo", onClick: toast.undo }]
              : undefined}
          />
        </div>
      )}
    </Ctx.Provider>
  );
}
