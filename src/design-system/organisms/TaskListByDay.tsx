import { Fragment, useState, type ReactNode } from "react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { StatusChip } from "../atoms/StatusChip";
import { EmptyState } from "../molecules/EmptyState";
import { TaskRow, type TaskRowData } from "../molecules/TaskRow";
import { sameDay } from "../utils/date";

export interface DayGroup {
  id: string;
  date: Date;
  /** "Do 08.10." */
  label: string;
  /** already in display order (due time, then title) */
  tasks: TaskRowData[];
}

export interface TaskListByDayProps {
  /** pinned section 1 — overdue tasks (shown with an empty state when there are none); null = section hidden by the filters */
  overdue: TaskRowData[] | null;
  /** pinned section 2 — tasks without a due date; null = hidden */
  noDue: TaskRowData[] | null;
  /** every day of the period, oldest → newest */
  days: DayGroup[];
  today: Date;
  /** past days folded into "Vergangene Tage" — open / closed (kept by the host until the period changes) */
  pastOpen: boolean;
  onTogglePast: () => void;
  onOpen?: (task: TaskRowData) => void;
  /** fold past days into "Vergangene Tage" (default true; off for the Handlungsbedarf tab) */
  foldPast?: boolean;
  /** show days without tasks ("Keine Aufgaben"); default: only for periods of 7 days or less */
  showEmptyDays?: boolean;
}

const PAGE = 10;
const pad = (n: number) => String(n).padStart(2, "0");
const short = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;

const ROWS_CARD = "overflow-x-auto bg-sp-surface-raised rounded-[var(--sp-radius-3x)]";

/** List view grouped by day — pinned sections "Überfällig" and "Ohne Fälligkeit" first, then the days oldest → newest.
    · day header: label (Roboto Medium) · "HEUTE" Badge Notification on today · count = neutral Badge Chip (full number of the day)
    · period of 7 days or less: every day, empty ones with "Keine Aufgaben" in grey; longer: only days with tasks
    · past days (period contains today): ONE line "Vergangene Tage" (arrow, dates, count) right above today — click opens them
    · at most 10 tasks per day: "Weitere 10 laden ({n} übrig)" / "Restliche {n} laden" and "Weniger anzeigen".
    Cards = SP3 "Card" Filled (surface/raised, radius 3x); empty pinned sections use the SP3 Empty State (Small). */
export function TaskListByDay({ overdue, noDue, days, today, pastOpen, onTogglePast, onOpen, foldPast = true, showEmptyDays: showEmpty }: TaskListByDayProps) {
  const [shown, setShown] = useState<Record<string, number>>({});
  const showEmptyDays = showEmpty ?? days.length <= 7;
  const hasToday = foldPast && days.some((d) => sameDay(d.date, today));
  const past = hasToday ? days.filter((d) => d.date < today && !sameDay(d.date, today)) : [];
  const rest = hasToday ? days.filter((d) => !past.includes(d)) : days;
  const visibleDays = (list: DayGroup[]) => list.filter((d) => showEmptyDays || d.tasks.length);

  const Header = ({ children, tone = "default", count, badge }: { children: ReactNode; tone?: "default" | "error"; count: number; badge?: string }) => (
    <h3 className="flex items-center gap-[var(--sp-space-2x)] m-0 px-[var(--sp-space-1x)]">
      <span className={`sp-text-medium ${tone === "error" ? "text-sp-danger-on-surface" : "text-sp-text-title"}`}>{children}</span>
      {badge && (
        <span className="inline-flex items-center h-5 px-[var(--tms-space-6px)] rounded-[var(--sp-radius-2x)] bg-sp-brand-fill-normal border border-solid border-sp-brand-border-dark sp-text-small-medium text-sp-brand-on-normal">{badge}</span>
      )}
      <StatusChip tone={tone} label={String(count)} />
    </h3>
  );

  const rowsOf = (tasks: TaskRowData[]) => (
    <div className="min-w-[900px]">
      {tasks.map((t, i) => (
        <Fragment key={t.id}>
          {i > 0 && <hr className="m-0 mx-[var(--sp-space-4x)] border-0 border-t border-solid border-sp-neutral-fill-light" />}
          <TaskRow task={t} onOpen={() => onOpen?.(t)} />
        </Fragment>
      ))}
    </div>
  );

  const pinned = (title: string, tone: "default" | "error", tasks: TaskRowData[], emptyTitle: string, icon: "check" | "cal") => (
    <section aria-label={title} className="flex flex-col gap-[var(--sp-space-2x)]">
      <Header tone={tone} count={tasks.length}>{title}</Header>
      <div className={ROWS_CARD}>
        {tasks.length ? rowsOf(tasks) : <div className="flex justify-center py-[var(--sp-space-2x)]"><EmptyState icon={icon} title={emptyTitle} /></div>}
      </div>
    </section>
  );

  const day = (d: DayGroup) => {
    const limit = shown[d.id] ?? PAGE;
    const list = d.tasks.slice(0, limit);
    const left = d.tasks.length - list.length;
    const next = Math.min(PAGE, left);
    return (
      <section key={d.id} aria-label={d.label} className="flex flex-col gap-[var(--sp-space-2x)]">
        <Header count={d.tasks.length} badge={sameDay(d.date, today) ? "HEUTE" : undefined}>{d.label}</Header>
        {d.tasks.length ? (
          <div className={ROWS_CARD}>
            {rowsOf(list)}
            {(left > 0 || limit > PAGE) && (
              <div className="flex flex-wrap items-center gap-[var(--sp-space-2x)] px-[var(--sp-space-4x)] py-[var(--sp-space-2x)] border-0 border-t border-solid border-sp-neutral-fill-light">
                {left > 0 && (
                  <Button
                    variant="tertiary"
                    label={left > PAGE ? `Weitere ${PAGE} laden (${left} übrig)` : `Restliche ${left} laden`}
                    onClick={() => setShown((s) => ({ ...s, [d.id]: limit + next }))}
                  />
                )}
                {limit > PAGE && <Button variant="tertiary" label="Weniger anzeigen" onClick={() => setShown((s) => ({ ...s, [d.id]: PAGE }))} />}
              </div>
            )}
          </div>
        ) : (
          <p className="m-0 px-[var(--sp-space-1x)] sp-text-standard text-sp-text-placeholder">Keine Aufgaben</p>
        )}
      </section>
    );
  };

  const pastCount = past.reduce((n, d) => n + d.tasks.length, 0);

  return (
    <div className="flex flex-col gap-[var(--sp-space-4x)]">
      {overdue && pinned("Überfällig", "error", overdue, "Keine überfälligen Aufgaben", "check")}
      {noDue && pinned("Ohne Fälligkeit", "default", noDue, "Keine Aufgaben ohne Fälligkeit", "cal")}

      {past.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={pastOpen}
            onClick={onTogglePast}
            className="flex items-center gap-[var(--sp-space-2x)] w-full h-10 px-[var(--sp-space-3x)] border-0 bg-sp-surface-raised rounded-[var(--sp-radius-3x)] text-left cursor-pointer outline-none sp-interactive focus-visible:shadow-[var(--sp-focus-brand)]"
          >
            <Icon name="expanded" color="var(--sp-icon)" className={pastOpen ? "" : "-rotate-90"} />
            <span className="sp-text-medium text-sp-text-title">Vergangene Tage</span>
            <span className="sp-text-small text-sp-text-label">{short(past[0].date)} – {short(past[past.length - 1].date)}</span>
            <StatusChip tone="default" label={String(pastCount)} />
          </button>
          {pastOpen && visibleDays(past).map(day)}
        </>
      )}

      {visibleDays(rest).map(day)}
    </div>
  );
}
