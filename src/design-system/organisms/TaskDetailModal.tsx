import { useState } from "react";
import { Avatar } from "../atoms/Avatar";
import { Button } from "../atoms/Button";
import { Checkbox } from "../atoms/Checkbox";
import { Icon } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { TextField } from "../atoms/TextField";
import { DetailRow } from "../molecules/DetailRow";
import { HistoryTimeline, type HistoryEntry } from "../molecules/HistoryTimeline";
import { Modal } from "../molecules/Modal";
import { PriorityIndicator } from "../molecules/PriorityIndicator";
import { SOLUTION, TASK_STATUS, type TaskRowData } from "../molecules/TaskRow";
import { TabBar } from "./TabBar";

export interface TaskComment { id: string; author: string; time: string; text: string }

export interface TaskDetailModalProps {
  task: TaskRowData;
  /** ids of the ticked subtasks */
  subtaskDone: string[];
  onToggleSubtask: (id: string) => void;
  comments: TaskComment[];
  onComment: (text: string) => void;
  /** events added in this session (ticked subtasks …), oldest first — shown after "Created by" */
  extraHistory?: HistoryEntry[];
  onEdit: () => void;
  onClose: () => void;
}

const WD = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
/** "18.09.26" + "22:00" → "Fri, 18.09.2026, 22:00" */
function dueText(due: { date: string; time: string }, noDue?: boolean) {
  if (noDue) return "Keine Fälligkeit";
  const [d, m, y] = due.date.split(".").map(Number);
  if (!d || !m || !y) return `${due.date}, ${due.time}`;
  const date = new Date(2000 + y, m - 1, d);
  return `${WD.format(date)}, ${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${2000 + y}, ${due.time}`;
}

/** Task detail on the SP3 Modal (centred, focus trap, Esc): title + chips (status · solution type · tags · priority),
    TabBar Details / Discussion (n). Details = key-value rows, Subtasks card (Checkbox rows, "n of m"), History timeline.
    Discussion = comments + reply field. Footer: secondary "Edit task". */
export function TaskDetailModal({ task, subtaskDone, onToggleSubtask, comments, onComment, extraHistory = [], onEdit, onClose }: TaskDetailModalProps) {
  const [tab, setTab] = useState("details");
  const [text, setText] = useState("");
  const st = TASK_STATUS[task.status];
  const subs = task.subtaskItems ?? [];
  const sol = SOLUTION[task.proof];

  const history: HistoryEntry[] = [
    { id: "created", title: `Created by ${task.createdBy ?? "—"}`, meta: task.createdAt, state: "done" },
    ...extraHistory,
    task.status === "done"
      ? { id: "state", title: task.doneBy ? `Completed by ${task.doneBy}` : "Completed", meta: `${task.due.date}, ${task.doneAt ?? task.due.time}`, state: "done" as const }
      : task.status === "overdue"
        ? { id: "state", title: "Not completed yet", meta: `Overdue since ${task.due.date}, ${task.due.time}`, state: "danger" as const }
        : { id: "state", title: "Not completed yet", meta: task.noDue ? undefined : `Due ${task.due.date}, ${task.due.time}`, state: "pending" as const },
  ];
  const post = () => { const t = text.trim(); if (t) { onComment(t); setText(""); } };

  return (
    <Modal
      title={task.title}
      onClose={onClose}
      minWidth={360}
      subtitle={
        <span className="flex flex-wrap items-center gap-[var(--sp-space-2x)]">
          <StatusChip tone={st.tone} icon={st.icon} label={st.label} />
          {!subs.length && <StatusChip tone="default" icon={sol.icon} label={sol.label} />}
          {task.tags.map((t) => <StatusChip key={t} tone="default" label={t} />)}
          {task.high && <span className="inline-flex items-center gap-[var(--sp-space-1x)] sp-text-small text-sp-text-label"><PriorityIndicator />High priority</span>}
        </span>
      }
      footer={<Button variant="secondary" icon="edit" label="Edit task" onClick={onEdit} />}
    >
      <TabBar
        label="Task detail"
        value={tab}
        onChange={setTab}
        tabs={[{ id: "details", label: "Details" }, { id: "discussion", label: "Discussion", count: comments.length }]}
      />

      {tab === "details" ? (
        <div className="flex flex-col gap-[var(--sp-space-5x)] pb-[var(--sp-space-2x)]">
          <dl className="m-0 flex flex-col gap-[var(--sp-space-2x)]">
            <DetailRow label="Assigned to">
              <span className="flex items-center gap-[var(--sp-space-2x)]">
                <Avatar name={task.person} size={24} />
                <span className="flex flex-col min-w-0">
                  <span className="truncate">{task.person}</span>
                  {task.team && <span className="sp-text-small text-sp-text-label truncate">{task.team}</span>}
                </span>
              </span>
            </DetailRow>
            <DetailRow label="Due">
              <span className={task.status === "overdue" ? "sp-text-medium text-sp-danger-on-surface" : ""}>{dueText(task.due, task.noDue)}</span>
            </DetailRow>
            <DetailRow label="Schedule">
              <span className="inline-flex items-center gap-[var(--sp-space-1x)]">
                {task.recurring && <Icon name="repeat" color="var(--sp-icon)" />}
                {task.schedule}
              </span>
            </DetailRow>
            {task.location && <DetailRow label="Location">{task.location}</DetailRow>}
            {task.description && <DetailRow label="Description">{task.description}</DetailRow>}
          </dl>

          {!!subs.length && (
            <section aria-label="Subtasks" className="flex flex-col gap-[var(--sp-space-2x)]">
              <h3 className="m-0 flex items-baseline gap-[var(--sp-space-2x)] sp-text-medium text-sp-text">
                Subtasks <span className="sp-text-small text-sp-text-label tabular-nums">{subtaskDone.length} of {subs.length}</span>
              </h3>
              <ul className="m-0 p-0 list-none border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] bg-sp-surface-raised">
                {subs.map((s, i) => (
                  <li key={s.id} className={`px-[var(--sp-space-2x)] ${i ? "border-0 border-t border-solid border-sp-neutral-fill-light" : ""}`}>
                    <Checkbox checked={subtaskDone.includes(s.id)} onChange={() => onToggleSubtask(s.id)} label={s.title} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-label="History" className="flex flex-col gap-[var(--sp-space-3x)]">
            <h3 className="m-0 sp-text-medium text-sp-text">History</h3>
            <HistoryTimeline entries={history} />
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-[var(--sp-space-4x)] pb-[var(--sp-space-2x)]">
          {comments.length ? (
            <ul className="m-0 p-0 list-none flex flex-col gap-[var(--sp-space-4x)]">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-[var(--sp-space-2x)]">
                  <Avatar name={c.author} size={32} />
                  <div className="flex flex-col gap-[var(--sp-space-1x)] min-w-0">
                    <span className="flex items-baseline gap-[var(--sp-space-2x)]">
                      <span className="sp-text-medium text-sp-text">{c.author}</span>
                      <span className="sp-text-small text-sp-text-label">{c.time}</span>
                    </span>
                    <span className="sp-text-standard text-sp-text whitespace-pre-wrap break-words">{c.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 sp-text-standard text-sp-text-label">No comments yet.</p>
          )}
          <div className="flex flex-col gap-[var(--sp-space-2x)]">
            <TextField multiline rows={3} aria-label="Comment" value={text} onChange={setText} placeholder="Write a comment…" maxLength={1000} />
            <div className="flex justify-end"><Button variant="primary" icon="send" label="Comment" disabled={!text.trim()} onClick={post} /></div>
          </div>
        </div>
      )}
    </Modal>
  );
}
