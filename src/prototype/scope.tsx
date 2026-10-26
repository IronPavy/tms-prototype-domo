import { createContext, useContext, useState, type ReactNode } from "react";
import { MultiSelectDropdown } from "@/design-system";
import { DATE_PRESETS } from "@/design-system/utils/datePresets";
import { type DateRange } from "@/design-system/utils/date";
import { ALL_SCOPE, ORG_GROUPS, TODAY, locationsInGroups, type Scope, type StatKey } from "./data";

const ScopeContext = createContext<{ scope: Scope; setScope: (s: Scope) => void }>({ scope: ALL_SCOPE, setScope: () => {} });

const THIS_WEEK = DATE_PRESETS.find((p) => p.id === "thisWeek")!;
interface PeriodValue { range: DateRange; setRange: (r: DateRange) => void; pendingStatus: StatKey | null; setPendingStatus: (k: StatKey | null) => void }
const PeriodContext = createContext<PeriodValue>({ range: THIS_WEEK.range(TODAY), setRange: () => {}, pendingStatus: null, setPendingStatus: () => {} });

/** The selected period is shared by Dashboard and Tasks. `pendingStatus` carries a Dashboard KPI click to the Tasks page
    (which reads it once when it opens and pre-selects that status filter). */
export const usePeriod = () => useContext(PeriodContext);

/** One scope (Groups + Locations) for the whole prototype — stays when switching between Dashboard and Tasks. */
export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<Scope>(ALL_SCOPE);
  const [range, setRange] = useState<DateRange>(() => THIS_WEEK.range(TODAY));
  const [pendingStatus, setPendingStatus] = useState<StatKey | null>(null);
  return (
    <ScopeContext.Provider value={{ scope, setScope }}>
      <PeriodContext.Provider value={{ range, setRange, pendingStatus, setPendingStatus }}>{children}</PeriodContext.Provider>
    </ScopeContext.Provider>
  );
}

export const useScope = () => useContext(ScopeContext).scope;

/** Groups + Location dropdowns for the page header (left of the period picker): multi-select lists that filter the page.
    Locations offered = those of the selected groups; picks outside them are dropped when the groups change. */
export function ScopeFilters() {
  const { scope, setScope } = useContext(ScopeContext);
  return (
    <div className="flex items-center gap-[var(--sp-space-2x)]">
      <MultiSelectDropdown
        label="Gruppen"
        icon="user_group"
        allLabel="Alle Gruppen"
        options={ORG_GROUPS}
        value={scope.groups}
        onChange={(groups) => setScope({
          groups,
          locations: scope.locations.filter((id) => locationsInGroups(groups).some((l) => l.id === id)),
        })}
      />
      <MultiSelectDropdown
        label="Standort"
        icon="marker"
        allLabel="Alle Standorte"
        options={locationsInGroups(scope.groups).map(({ id, label }) => ({ id, label }))}
        value={scope.locations}
        onChange={(locations) => setScope({ ...scope, locations })}
      />
    </div>
  );
}
