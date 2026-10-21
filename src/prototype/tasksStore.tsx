import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { NewTaskModal, TaskDetailModal, Toast, dueClock, emptyTask, scheduleLabel, type HistoryEntry, type NewTaskValues, type TaskComment, type TaskGroup, type TaskRowData } from "@/design-system";
import { addDays, sameDay, startOfDay } from "@/design-system/utils/date";
import { ALL_SCOPE, LOCATIONS, PEOPLE, TODAY, compareDue, recipientsForScope, resolveRecipient, type CreatedStat } from "./data";
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
  seedDraft("d1", 1, { title: "Notausgänge prüfen", recipients: ["team-house"], proof: "check", subtasks: ["Ausgang 1", "Ausgang 2"] }),
  seedDraft("d2", 2, { title: "Allergene der Speisekarte prüfen", recipients: ["p1", "p4"], proof: "form", priority: true }),
  seedDraft("d3", 4, { title: "Terrasse grundreinigen", recipients: ["p6"], proof: "photo" }),
];

/** Task row from the modal values — due in the past = overdue, else open */
function buildTask(v: NewTaskValues, id: string): CreatedTask {
  const picked = v.recipients.flatMap((r) => resolveRecipient(r) ?? []);
  const first = picked[0];
  const dd = v.due;
  const due = new Date(`${dd.start}T${dueClock(dd)}`);
  const day = startOfDay(due);
  const now = new Date();
  const subtasks = v.subtasks.filter((s) => s.trim()).length;
  return {
    day,
    task: {
      id, title: v.title.trim(), high: v.priority, recurring: dd.repeat !== "none", schedule: scheduleLabel(dd), tags: [],
      person: first ? `${first.label}${picked.length > 1 ? ` +${picked.length - 1}` : ""}` : "—",
      team: first?.team ?? "", location: LOCATIONS.find((l) => l.id === first?.location)?.label,
      subtasks: subtasks || undefined, description: v.description.trim() || undefined, createdBy: ME, createdAt: stamp(now),
      due: { date: `${pad(due.getDate())}.${pad(due.getMonth() + 1)}.${String(due.getFullYear()).slice(2)}`, time: dd.timeMode === "allday" ? "ganztägig" : dd.timeMode === "range" ? `${dd.from}–${dd.to}` : dd.time },
      proof: v.proof, status: due < now ? "overdue" : "open", comments: undefined,
    },
  };
}

/** New task form values of an existing task (Edit task) */
function valuesFromTask(t: TaskRowData): NewTaskValues {
  const base = emptyTask(TODAY);
  const person = PEOPLE.find((p) => t.person.startsWith(p.label));
  const [d, m, y] = t.due.date.split(".").map(Number);
  const repeat = !t.recurring ? "none" : t.schedule.startsWith("Täglich") ? "daily" : t.schedule.startsWith("Wöchentlich") ? "weekly" : t.schedule.startsWith("Monatlich") ? "monthly" : "yearly";
  const clock = /^\d{2}:\d{2}$/.test(t.due.time) ? t.due.time : "17:00";
  return {
    ...base,
    recipients: person ? [person.id] : [],
    title: t.title,
    description: t.description ?? "",
    due: { ...base.due, repeat, start: `${2000 + y}-${pad(m)}-${pad(d)}`, timeMode: /ganz|all day/i.test(t.due.time) ? "allday" : "time", time: clock },
    subtasks: (t.subtaskItems ?? []).map((x) => x.title),
    proof: t.proof,
    priority: !!t.high,
  };
}

const DISCUSSION_SEED: Omit<TaskComment, "id">[] = [
  { author: "Anna Müller", time: "15.10.26, 11:02 Uhr", text: "Please make sure this is done before the evening shift." },
  { author: "Tobias Aurenz", time: "15.10.26, 13:40 Uhr", text: "On it — waiting for the delivery first." },
  { author: "Kristina Barac", time: "16.10.26, 08:15 Uhr", text: "Delivery arrived, you can start." },
  { author: "Michael Potsch", time: "16.10.26, 09:30 Uhr", text: "Thanks, keep me posted." },
];

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
  const [modal, setModal] = useState<{ draftId?: string } | null>(null);
  const [toast, setToast] = useState<{ id: string; message: string; undo?: () => void } | null>(null);
  const [counter, setCounter] = useState(1);
  // task detail modal
  const [detail, setDetail] = useState<TaskRowData | null>(null);
  const [editing, setEditing] = useState(false);
  const [subDone, setSubDone] = useState<Record<string, string[]>>({});
  const [discussion, setDiscussion] = useState<Record<string, TaskComment[]>>({});
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
    openDetail: (task) => { setEditing(false); setDetail(task); },
    withEdits: (groups) => groups.map((g) => ({
      ...g,
      tasks: g.tasks.map((t0) => {
        const t = edits[t0.id] ? { ...t0, ...edits[t0.id] } : t0;
        // ticked subtasks (task detail) show live in the row as "2/5"
        const done = subDone[t.id];
        return done && t.subtaskItems ? { ...t, subtaskItems: t.subtaskItems.map((s) => ({ ...s, done: done.includes(s.id) })) } : t;
      }),
    })),
    recipientNames: (ids) => ids.flatMap((i) => resolveRecipient(i)?.label ?? []).join(", "),
  }), [created, drafts, edits, subDone]);

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
  const doneIds = cur ? (subDone[cur.id] ?? (cur.subtaskItems ?? []).filter((x) => x.done).map((x) => x.id)) : [];
  const comments = cur ? (discussion[cur.id] ?? DISCUSSION_SEED.slice(0, cur.comments ?? 0).map((c, i) => ({ ...c, id: `seed-${i}` }))) : [];

  const toggleSubtask = (id: string) => {
    if (!cur) return;
    const on = !doneIds.includes(id);
    const title = cur.subtaskItems?.find((x) => x.id === id)?.title ?? "";
    setSubDone((m) => ({ ...m, [cur.id]: on ? [...doneIds, id] : doneIds.filter((x) => x !== id) }));
    setEvents((m) => ({ ...m, [cur.id]: [...(m[cur.id] ?? []), { id: `e-${Date.now()}`, title: `Subtask “${title}” ${on ? "completed" : "reopened"}`, meta: stamp(new Date()), state: on ? "done" : "pending" }] }));
  };
  const addComment = (text: string) => {
    if (!cur) return;
    setDiscussion((m) => ({ ...m, [cur.id]: [...comments, { id: `c-${Date.now()}`, author: ME, time: stamp(new Date()), text }] }));
  };
  const saveEdit = (v: NewTaskValues) => {
    if (!cur) return;
    const picked = v.recipients.flatMap((r) => resolveRecipient(r) ?? []);
    const first = picked[0];
    const [y, m, d] = v.due.start.split("-");
    const old = cur.subtaskItems ?? [];
    const items = v.subtasks.filter((x) => x.trim()).map((title, i) => ({ id: old.find((o) => o.title === title)?.id ?? `${cur.id}-e${i}`, title }));
    setEdits((e) => ({
      ...e,
      [cur.id]: {
        ...e[cur.id],
        title: v.title.trim(), description: v.description.trim() || undefined, high: v.priority, proof: v.proof,
        ...(first ? { person: `${first.label}${picked.length > 1 ? ` +${picked.length - 1}` : ""}`, team: first.team } : {}),
        recurring: v.due.repeat !== "none", schedule: scheduleLabel(v.due),
        due: { date: `${d}.${m}.${y.slice(2)}`, time: v.due.timeMode === "allday" ? "ganztägig" : v.due.timeMode === "range" ? `${v.due.from}–${v.due.to}` : v.due.time },
        subtasks: items.length || undefined, subtaskItems: items.length ? items : undefined,
      },
    }));
    setEditing(false);
    setToast({ id: `edit-${cur.id}`, message: "Task updated." });
  };

  // recipients inside the page scope (a continued draft keeps everyone it already picked)
  const options = recipientsForScope(draft ? ALL_SCOPE : scope);

  return (
    <Ctx.Provider value={store}>
      {children}
      {modal && (
        <NewTaskModal
          key={modal.draftId ?? "new"}
          recipients={options}
          initial={draft?.values ?? emptyTask(TODAY)}
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
          onToggleSubtask={toggleSubtask}
          comments={comments}
          onComment={addComment}
          extraHistory={events[cur.id]}
          onEdit={() => setEditing(true)}
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
          onClose={() => setEditing(false)}
        />
      )}
      {toast && (
        <div className="fixed bottom-[var(--sp-space-6x)] left-1/2 -translate-x-1/2 z-[60]">
          <Toast
            message={toast.message}
            onClose={() => setToast(null)}
            actions={toast.undo
              ? [{ label: "View", onClick: () => { onView(); setToast(null); } }, { label: "Undo", onClick: toast.undo }]
              : undefined}
          />
        </div>
      )}
    </Ctx.Provider>
  );
}
