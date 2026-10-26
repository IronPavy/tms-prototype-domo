import { useState } from "react";
import {
  AttentionList, BarChart, Button, DateRangePicker, DonutChart, Link, PageHeader, Panel, ScrollArea, ShiftGroup,
  StatCard, CompletedTaskList, TeamBreakdown, UpcomingList,
} from "@/design-system";
import { diffDays, formatRange } from "@/design-system/utils/date";
import {
  ATTENTION_ITEMS, RECENT_DONE, TEAM_SEGMENTS, TODAY, TODAY_SHIFTS, UPCOMING, completionSeries, inScope, statsForRange, taskFromAttention,
  taskFromRecent, taskFromShift, taskFromUpcoming, teamsForRange,
  type StatKey,
} from "./data";
import { ScopeFilters, usePeriod, useScope } from "./scope";
import { useTasks } from "./tasksStore";

/** "Thu, 08.10.2026" and "11:40" */
const TODAY_LABEL = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(TODAY)
  + ", " + new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(TODAY);
const NOW_LABEL = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(TODAY);

/* Aufgaben Management › Dashboard.
   One filter (StatKey) is shared by the KPI cards, the donut legend and the attention list. */
export default function DashboardPage({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { range, setRange, setPendingStatus } = usePeriod();
  const [filter, setFilter] = useState<StatKey | null>(null);
  const toggle = (key: StatKey) => setFilter((f) => (f === key || key === "all" ? null : key));

  const scope = useScope();
  const { createdStats, openNewTask, openDetail } = useTasks();
  const stats = statsForRange(range, scope, createdStats);
  const all = stats.find((s) => s.key === "all")!.value;
  const done = stats.find((s) => s.key === "done")!.value;
  const statuses = stats.filter((s) => s.key !== "all");

  const scoped = ATTENTION_ITEMS.filter((i) => inScope(scope, i.location));
  const attention = filter && filter !== "all" ? scoped.filter((i) => i.kpi === filter) : scoped;
  const shifts = TODAY_SHIFTS.map((g) => ({ ...g, tasks: g.tasks.filter((t) => inScope(scope, t.location)) })).filter((g) => g.tasks.length);
  const recent = RECENT_DONE.filter((s) => inScope(scope, s.location));
  const upcoming = UPCOMING.filter((u) => inScope(scope, u.location));
  const filterLabel = stats.find((s) => s.key === filter)?.label;
  /** By team shows only due statuses — the "Open" filter does not apply there */
  const teamFilter = TEAM_SEGMENTS.some((s) => s.key === filter) ? filter : null;

  const days = diffDays(range.start, range.end) + 1;
  const perUnit = days <= 31 ? "day" : days <= 120 ? "week" : "month";

  return (
    <div className="flex flex-col gap-[var(--sp-space-6x)] p-[var(--sp-space-6x)]">
      <PageHeader
        title="Übersicht"
        primaryAction={<Button variant="primary" icon="plus" label="Neue Aufgabe" onClick={() => openNewTask()} />}
        actions={
          <>
            <ScopeFilters />
            <DateRangePicker value={range} onChange={setRange} today={TODAY} />
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-[var(--sp-space-4x)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(176px, 100%), 1fr))" }}>
        {stats.map((s) => (
          <StatCard
            key={s.key}
            icon={s.icon}
            tone={s.tone}
            value={s.value}
            label={s.label}
            people={s.people}
            onClick={() => { setPendingStatus(s.key); onNavigate?.("tasks/tasks"); }}
          />
        ))}
      </div>

      {/* Attention + completion */}
      <div className="grid gap-[var(--sp-space-4x)] items-stretch grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(440px,2fr)]">
        <Panel
          title="Kritische Aufgaben"
          meta={`${attention.length} ${attention.length === 1 ? "task" : "tasks"} · now${filterLabel ? ` · ${filterLabel}` : ""}`}
          actions={filter && <Button variant="tertiary" icon="close" label="Clear filter" onClick={() => setFilter(null)} />}
        >
          {/* Fills the row height set by the Completion panel (xl) and scrolls; stacked: max 480px */}
          <div className="relative flex-1 min-h-[280px] max-xl:min-h-0">
            <ScrollArea
              label="Kritische Aufgaben"
              className="xl:absolute xl:inset-0 max-xl:max-h-[480px]"
              contentClassName="pr-[var(--sp-space-6x)]"
            >
              <AttentionList
                items={attention}
                onOpen={(i) => openDetail(taskFromAttention(i as (typeof attention)[number]))}
                onAction={(i) => openDetail(taskFromAttention(i as (typeof attention)[number]))}
                emptyText={filterLabel ? `No “${filterLabel}” tasks need your attention right now.` : undefined}
              />
            </ScrollArea>
          </div>
        </Panel>

        <Panel title="Completion" meta={formatRange(range)}>
          <DonutChart
            segments={statuses.map((s) => ({ key: s.key, label: s.label, value: s.value, tone: s.tone }))}
            centerValue={`${all ? Math.round((done / all) * 100) : 0}%`}
            centerLabel={`${done} of ${all} done`}
            activeKey={filter}
            onSegmentClick={(k) => toggle(k as StatKey)}
          />
          <hr className="m-0 border-0 border-t border-solid border-sp-border-line" />
          <BarChart title={`Done per ${perUnit}`} data={completionSeries(range, done, all)} />
        </Panel>
      </div>

      {/* Today + recently completed — both lists scroll inside a fixed-height card */}
      <div className="grid gap-[var(--sp-space-4x)] grid-cols-1 xl:grid-cols-2">
        <Panel
          title="Today"
          meta={`${TODAY_LABEL} · now ${NOW_LABEL}`}
          actions={<Link role="button" tabIndex={0}>All of today</Link>}
        >
          <ScrollArea label="Today" className="h-[400px]" contentClassName="flex flex-col gap-[var(--sp-space-3x)] pr-[var(--sp-space-6x)]">
            {shifts.map((g) => <ShiftGroup key={g.id} title={g.title} tasks={g.tasks} onOpenTask={(t) => openDetail(taskFromShift(t as (typeof g.tasks)[number]))} />)}
          </ScrollArea>
        </Panel>

        <Panel title="Zuletzt erledigt" meta="Was die Mitarbeitenden abgegeben haben" actions={<Link role="button" tabIndex={0}>Alle Aufgaben</Link>}>
          <ScrollArea label="Zuletzt erledigt" className="h-[400px]" contentClassName="pr-[var(--sp-space-6x)]">
            <CompletedTaskList
              items={recent.map((s) => ({ id: s.id, title: s.title, person: s.person, proof: s.proof, when: `${s.day === 0 ? "Heute" : "Gestern"} ${s.time}` }))}
              onOpen={(i) => openDetail(taskFromRecent(RECENT_DONE.find((x) => x.id === i.id)!))}
            />
          </ScrollArea>
        </Panel>
      </div>

      {/* By team + coming up */}
      <div className="grid gap-[var(--sp-space-4x)] grid-cols-1 xl:grid-cols-2">
        <Panel
          title="By team"
          meta={`${formatRange(range)} · share done of what was due`}
          actions={teamFilter && <Button variant="tertiary" icon="close" label="Clear filter" onClick={() => setFilter(null)} />}
        >
          <TeamBreakdown rows={teamsForRange(range, scope)} segments={TEAM_SEGMENTS} activeKey={teamFilter} onSegmentClick={(k) => toggle(k as StatKey)} />
        </Panel>

        <Panel title="Coming up" meta="Next 7 days · without daily routines" actions={<Link role="button" tabIndex={0}>Planning</Link>}>
          {/* Fills the row height set by By team (xl) and scrolls; stacked: max 360px */}
          <div className="relative flex-1 min-h-[240px] max-xl:min-h-0">
            <ScrollArea label="Coming up" className="xl:absolute xl:inset-0 max-xl:max-h-[360px]" contentClassName="pr-[var(--sp-space-6x)]">
              <UpcomingList items={upcoming} today={TODAY} onOpen={(u) => openDetail(taskFromUpcoming(u as (typeof upcoming)[number]))} />
            </ScrollArea>
          </div>
        </Panel>
      </div>
    </div>
  );
}
