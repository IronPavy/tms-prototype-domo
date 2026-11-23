import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { MultiSelectDropdown } from "@/design-system";
import { addDays, startOfDay, type DateRange } from "@/design-system/utils/date";
import { ALL_SCOPE, ORG_GROUPS, TODAY, locationsInGroups, type Scope, type StatKey } from "./data";

const ScopeContext = createContext<{ scope: Scope; setScope: (s: Scope) => void }>({ scope: ALL_SCOPE, setScope: () => {} });

/** "Alle Tage" (no date filter) — the prototype generates its tasks per day, so it shows the last 30 days until today */
const ALL_DAYS_RANGE: DateRange = { start: addDays(TODAY, -29), end: startOfDay(TODAY) };
interface PeriodValue {
  /** picked period · `null` = "Alle Tage" (default) */
  period: DateRange | null;
  setPeriod: (r: DateRange | null) => void;
  /** the days the data is built for (`period`, or the "Alle Tage" range) */
  range: DateRange;
  pendingStatus: StatKey | null;
  setPendingStatus: (k: StatKey | null) => void;
}
const PeriodContext = createContext<PeriodValue>({ period: null, setPeriod: () => {}, range: ALL_DAYS_RANGE, pendingStatus: null, setPendingStatus: () => {} });

/** The selected period is shared by Dashboard and Tasks (default "Alle Tage"; future days can't be picked). `pendingStatus` carries a Dashboard KPI click to the Tasks page
    (which reads it once when it opens and pre-selects that status filter). */
export const usePeriod = () => useContext(PeriodContext);

/** One scope (Groups + Locations) for the whole prototype — stays when switching between Dashboard and Tasks. */
export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<Scope>(ALL_SCOPE);
  const [period, setPeriod] = useState<DateRange | null>(null);
  const range = useMemo(() => period ?? ALL_DAYS_RANGE, [period]);
  const [pendingStatus, setPendingStatus] = useState<StatKey | null>(null);
  return (
    <ScopeContext.Provider value={{ scope, setScope }}>
      <PeriodContext.Provider value={{ period, setPeriod, range, pendingStatus, setPendingStatus }}>{children}</PeriodContext.Provider>
    </ScopeContext.Provider>
  );
}

export const useScope = () => useContext(ScopeContext).scope;

/** Groups + Location dropdowns for the page header (left of the period picker): multi-select lists that filter the page.
    Locations offered = those of the selected groups; picks outside them are dropped when the groups change.
    `groupsOnly` (Aufgaben): no Location dropdown; all groups start ticked and at least one stays selected. */
export function ScopeFilters({ groupsOnly = false }: { groupsOnly?: boolean } = {}) {
  const { scope, setScope } = useContext(ScopeContext);
  return (
    <div className="flex items-center gap-[var(--sp-space-2x)]">
      {!groupsOnly && <MultiSelectDropdown
        label="Standort"
        icon="marker"
        allLabel="Alle Standorte"
        options={locationsInGroups(scope.groups).map(({ id, label }) => ({ id, label }))}
        value={scope.locations}
        onChange={(locations) => setScope({ ...scope, locations })}
      />}
      <MultiSelectDropdown
        label="Gruppen"
        icon="user_group"
        allLabel="Alle Gruppen"
        preselectAll={groupsOnly}
        options={ORG_GROUPS}
        value={scope.groups}
        onChange={(groups) => setScope({
          groups,
          locations: scope.locations.filter((id) => locationsInGroups(groups).some((l) => l.id === id)),
        })}
      />
    </div>
  );
}
