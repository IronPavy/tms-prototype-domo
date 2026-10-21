import { useEffect, useState } from "react";
import {
  Button, DateRangePicker, EmptyTasks, FilterPill, PageHeader, SearchField, SegmentedControl, TabBar, TaskCalendar, TaskCardGrid, TaskListByDay,
  type TaskRowData,
} from "@/design-system";
import { TODAY, compareDue, dueDateKey, inScope, statsForRange, taskGroupsForRange, type StatKey } from "./data";
import { ScopeFilters, usePeriod, useScope } from "./scope";
import { useTasks, withCreatedTasks } from "./tasksStore";


const TYPES = [
  { id: "all", label: "Alle" },
  { id: "one-time", label: "Einmalig" },
  { id: "recurring", label: "Wiederkehrend" },
];
const DUE_OPTIONS = [
  { id: "all", label: "Alle" },
  { id: "with", label: "Mit Fälligkeit" },
  { id: "without", label: "Ohne Fälligkeit" },
];
const VIEWS = [
  { id: "list", label: "Liste", icon: "unordered_list" as const },
  // Cards and Calendar are introduced later: greyed out, tooltip says so
  { id: "cards", label: "Karten", icon: "grid" as const, disabled: true, hint: "Demnächst verfügbar" },
  { id: "calendar", label: "Kalender", icon: "cal" as const, disabled: true, hint: "Demnächst verfügbar" },
];

/* Aufgaben Management › Tasks — header, tabs and the filter / toolbar rows.
   Status pills use the same numbers, labels, icons and tones as the Dashboard KPI cards. */
// `onNavigate` (in-app navigation) is passed by PrototypePage; unused since the breadcrumb was removed
export default function TasksPage(_props: { onNavigate?: (id: string) => void }) {
  const [tab, setTab] = useState("status");
  const { range, setRange, pendingStatus, setPendingStatus } = usePeriod();
  // search: `draft` is what is typed, `query` the applied search (Enter, at least 3 characters)
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [tooShort, setTooShort] = useState(false);
  const [type, setType] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  // past days folded into one line "Vergangene Tage" — stays open until the period changes or the page is left
  const [pastOpen, setPastOpen] = useState(false);
  useEffect(() => { setPastOpen(false); }, [range.start.getTime(), range.end.getTime()]);
  // the chosen view is remembered (default: list)
  const [view, setViewState] = useState(() => { try { return localStorage.getItem("aufgaben-view") ?? "list"; } catch { return "list"; } });
  const setView = (v: string) => { setViewState(v); try { localStorage.setItem("aufgaben-view", v); } catch { /* storage blocked */ } };
  // Library and Drafts have no Calendar view (a draft has no due day); fall back to List if it was selected
  const views = tab === "status" ? VIEWS : VIEWS.filter((v) => v.id !== "calendar");
  const shownView = views.some((v) => v.id === view && !v.disabled) ? view : "list";

  const scope = useScope();
  const { created, createdStats, drafts, openNewTask, deleteDraft, recipientNames, openDetail, withEdits } = useTasks();
  const stats = statsForRange(range, scope, createdStats);
  const statuses = stats.filter((s) => s.key !== "all");
  // coming from a Dashboard KPI card: only that status is selected (Total / none = all); read once, then cleared
  const [active, setActive] = useState<Set<StatKey>>(() => new Set(pendingStatus && pendingStatus !== "all" ? [pendingStatus] : statuses.map((s) => s.key)));
  useEffect(() => { if (pendingStatus) setPendingStatus(null); }, [pendingStatus, setPendingStatus]);
  const toggle = (k: StatKey) => setActive((a) => { const n = new Set(a); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const all = stats.find((s) => s.key === "all")!.value;

  // search: lower case, accents and umlauts ignored ("muller" finds "Müller")
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").toLocaleLowerCase("de");
  const q = norm(query.trim());
  const searchMatch = (t: TaskRowData) =>
    !q || [t.title, t.person, t.doneBy ?? "", t.team, ...t.tags, t.description ?? ""].some((s) => norm(s).includes(q));
  const applySearch = () => {
    const v = draft.trim();
    if (!v) { setQuery(""); setTooShort(false); return; }
    if (v.length < 3) { setTooShort(true); return; }
    setTooShort(false);
    setQuery(v);
  };
  const clearSearch = () => { setDraft(""); setQuery(""); setTooShort(false); };
  const resetAll = () => { setActive(new Set(statuses.map((s) => s.key))); setType("all"); setDueFilter("all"); clearSearch(); };

  // list: status pills · type · due · search applied to every group
  const matches = (t: TaskRowData) =>
    active.has(t.status) &&
    inScope(scope, t.location) &&
    (dueFilter === "all" || (dueFilter === "with" && !t.noDue) || (dueFilter === "without" && !!t.noDue)) &&
    (type === "all" || (type === "one-time" && !t.recurring) || (type === "recurring" && !!t.recurring)) &&
    searchMatch(t);
  const allGroups = withEdits(withCreatedTasks(taskGroupsForRange(range), created));
  const groups = allGroups.map((g) => ({ ...g, tasks: g.tasks.filter(matches) }));
  const noResults = groups.every((g) => !g.tasks.length);
  // list view: pinned sections (Überfällig, Ohne Fälligkeit) + days oldest → newest; a task is listed in one place only
  const dayGroups = groups.filter((g) => g.date);
  const overdueTasks = [
    ...groups.filter((g) => g.kind === "overdue").flatMap((g) => g.tasks),
    ...dayGroups.flatMap((g) => g.tasks.filter((t) => t.status === "overdue")),
  ].filter((t, i, a) => a.findIndex((x) => x.id === t.id) === i).sort((a, b) => dueDateKey(a) - dueDateKey(b) || compareDue(a, b));
  const noDueTasks = groups.find((g) => g.kind === "nodue")?.tasks ?? [];
  const listDays = dayGroups.map((g) => ({ id: g.id, date: g.date!, label: g.label, tasks: g.tasks.filter((t) => t.status !== "overdue").sort(compareDue) }));
  // with an applied search the status chips and the Status tab count only the tasks that match the search text
  const found = allGroups.flatMap((g) => g.tasks).filter((t) => inScope(scope, t.location) && searchMatch(t));
  const countOf = (key: StatKey, fallback: number) => (q ? found.filter((t) => t.status === key).length : fallback);
  const totalShown = q ? found.length : all;
  const shownQuery = query.trim().length > 40 ? `${query.trim().slice(0, 40)}…` : query.trim();

  return (
    <div className="flex flex-col gap-[var(--sp-space-6x)] p-[var(--sp-space-6x)]">
      <PageHeader
        title="Aufgaben"
        primaryAction={<Button variant="primary" icon="plus" label="Neue Aufgabe" onClick={() => openNewTask()} />}
        actions={
          <>
            <ScopeFilters />
            <DateRangePicker value={range} onChange={setRange} today={TODAY} />
          </>
        }
      />

      <div className="flex flex-col gap-[var(--sp-space-4x)]">
        <TabBar
          label="Aufgabenansichten"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "status", label: "Status", count: totalShown },
            { id: "library", label: "Bibliothek", count: 15 },
            { id: "drafts", label: "Entwürfe", count: drafts.length, countTone: "error" },
          ]}
        />

        {/* status filter (toggles, all on by default) · type · view */}
        <div className="flex flex-wrap items-center gap-x-[var(--sp-space-3x)] gap-y-[var(--sp-space-2x)]">
          {/* status pills belong to the Status tab only — Library and Drafts have none */}
          {tab === "status" && (
          <div className="flex flex-wrap items-center gap-[var(--sp-space-2x)]">
            <span className="sp-text-medium text-sp-text">Filter ({active.size}):</span>
            {/* "Alle" switches every status on */}
            <FilterPill
              tone="default"
              label="Alle"
              count={q ? found.length : statuses.reduce((n, s) => n + s.value, 0)}
              solid
              selected={active.size === statuses.length}
              onClick={() => setActive(new Set(statuses.map((s) => s.key)))}
            />
            {statuses.map((s) => (
              <FilterPill
                key={s.key}
                tone={s.tone}
                icon={s.icon}
                label={s.label}
                count={countOf(s.key, s.value)}
                selected={active.has(s.key)}
                onClick={() => toggle(s.key)}
              />
            ))}
          </div>
          )}
          <div className="flex items-center gap-[var(--sp-space-1x)]">
            <span className="sp-text-medium text-sp-text-label">Typ</span>
            <SegmentedControl label="Aufgabentyp" options={TYPES} value={type} onChange={setType} />
          </div>
          <div className="flex items-center gap-[var(--sp-space-1x)]">
            <span className="sp-text-medium text-sp-text-label">Fälligkeit</span>
            <SegmentedControl label="Fälligkeit" options={DUE_OPTIONS} value={dueFilter} onChange={setDueFilter} />
          </div>
          {/* view switch pushed to the right end of the row */}
          <div className="ml-auto">
            <SegmentedControl label="Ansicht" iconOnly options={views} value={shownView} onChange={setView} />
          </div>
        </div>

        {/* search (shrinks) */}
        <div className="flex flex-wrap items-center gap-x-[var(--sp-space-3x)] gap-y-[var(--sp-space-1x)]">
          <SearchField
            value={draft}
            onChange={(v) => { setDraft(v); setTooShort(false); if (!v) setQuery(""); }}
            onEnter={applySearch}
            onClear={clearSearch}
            maxLength={40}
            clearLabel="Suche zurücksetzen"
            placeholder="Aufgaben durchsuchen"
            className="w-full min-w-[200px] max-w-[300px]"
          />
          {tooShort && <span role="alert" className="sp-text-small text-sp-danger-on-surface">Bitte mindestens 3 Zeichen eingeben und Enter drücken.</span>}
        </div>
      </div>

      {tab === "status" && active.size === 0 ? (
        /* every filter switched off: ask to pick one, or reset them all */
        <div className="flex justify-center py-[var(--sp-space-6x)]">
          <EmptyTasks
            text="Wählen Sie einen der Filter aus."
            action={<Button variant="primary" label="Zurücksetzen" onClick={() => setActive(new Set(statuses.map((s) => s.key)))} />}
          />
        </div>
      ) : tab === "status" && noResults ? (
        /* nothing matches the search / filters: say so and offer a reset of search + filters */
        <div className="flex justify-center py-[var(--sp-space-6x)]">
          <EmptyTasks
            text={q ? `Keine Aufgaben für „${shownQuery}“ gefunden.` : "Keine Aufgaben gefunden."}
            action={<Button variant="primary" label="Zurücksetzen" onClick={resetAll} />}
          />
        </div>
      ) : tab === "status" && shownView === "list" ? (
        <TaskListByDay
          overdue={active.has("overdue") && dueFilter !== "without" ? overdueTasks : null}
          noDue={dueFilter !== "with" ? noDueTasks : null}
          days={listDays}
          today={TODAY}
          pastOpen={pastOpen}
          onTogglePast={() => setPastOpen((o) => !o)}
          onOpen={openDetail}
        />
      ) : tab === "status" && shownView === "cards" ? (
        <TaskCardGrid groups={groups} onOpen={openDetail} />
      ) : tab === "status" && shownView === "calendar" ? (
        <TaskCalendar groups={groups} today={TODAY} onOpen={openDetail} />
      ) : tab === "drafts" && !drafts.length ? (
        <div className="flex justify-center py-[var(--sp-space-6x)]"><EmptyTasks /></div>
      ) : tab === "drafts" && shownView === "cards" ? (
        /* Drafts as cards — same grid as the task cards (max 4 per row, min 300px) */
        <div
          className="grid gap-[var(--sp-space-4x)]"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, max(300px, calc((100% - 3 * var(--sp-space-4x)) / 4))), 1fr))" }}
        >
          {drafts.map((d) => (
            <article key={d.id} className="flex flex-col gap-[var(--sp-space-4x)] p-[var(--sp-space-4x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-3x)]">
              <div className="flex flex-col gap-[var(--sp-space-1x)] min-w-0">
                <span className="sp-text-medium text-sp-text truncate">{d.values.title || "Entwurf ohne Titel"}</span>
                <span className="sp-text-small text-sp-text-label truncate">{recipientNames(d.values.recipients) || "Kein Empfänger"}</span>
                <span className="sp-text-small text-sp-text-label truncate">Gespeichert {d.savedAt}</span>
              </div>
              <div className="flex items-center justify-between gap-[var(--sp-space-2x)] mt-auto">
                <Button variant="primary" icon="edit" label="Fortsetzen" onClick={() => openNewTask(d.id)} />
                <Button variant="tertiary" icon="delete" label="Löschen" onClick={() => deleteDraft(d.id)} />
              </div>
            </article>
          ))}
        </div>
      ) : tab === "drafts" ? (
        <div className="flex flex-col bg-sp-surface-raised rounded-[var(--sp-radius-3x)]">
          {drafts.length ? drafts.map((d, i) => (
            <div key={d.id} className={`flex items-center gap-[var(--sp-space-4x)] p-[var(--sp-space-4x)] ${i ? "border-0 border-t border-solid border-sp-neutral-fill-light" : ""}`}>
              <div className="flex flex-col gap-[var(--sp-space-1x)] flex-1 min-w-0">
                <span className="sp-text-medium text-sp-text truncate">{d.values.title || "Entwurf ohne Titel"}</span>
                <span className="sp-text-small text-sp-text-label truncate">{recipientNames(d.values.recipients) || "Kein Empfänger"} · Gespeichert {d.savedAt}</span>
              </div>
              <Button variant="primary" icon="edit" label="Fortsetzen" onClick={() => openNewTask(d.id)} />
              <Button variant="tertiary" icon="delete" label="Löschen" onClick={() => deleteDraft(d.id)} />
            </div>
          )) : <div className="flex justify-center py-[var(--sp-space-6x)]"><EmptyTasks /></div>}
        </div>
      ) : (
        /* Library — no content designed yet */
        <div className="flex justify-center py-[var(--sp-space-6x)]">
          <EmptyTasks />
        </div>
      )}
    </div>
  );
}
