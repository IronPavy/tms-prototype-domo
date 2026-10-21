import type { AttentionItem, BarDatum, IconName, NavSection, ShiftTask, StatTone, Submission, TaskGroup, TaskRowData, TeamRow, TeamSegmentDef, UpcomingItem,
} from "@/design-system";
import {
  addDays, addMonths, diffDays, isoWeek, sameDay, sameRange, startOfDay, startOfWeek, type DateRange,
} from "@/design-system/utils/date";

/** Prototype "today" — real date, so the period picker starts on the current week. */
export const TODAY = new Date();

export const HEADER = {
  location: "Propep Test 1",
  group: "Gruppe A",
  userEmail: "m.potsch@gmail.com",
};

/* ─── Scope: groups → locations ──────────────────────────────── */

export const ORG_GROUPS = [
  { id: "a", label: "Gruppe A" },
  { id: "b", label: "Gruppe B" },
];

/** `weight` = share of the company's tasks (sums to 1) — scales the KPI numbers when a scope is selected */
export const LOCATIONS = [
  { id: "makarska", label: "Makarska", group: "a", weight: 0.4 },
  { id: "split",    label: "Split",    group: "a", weight: 0.3 },
  { id: "zagreb",   label: "Zagreb",   group: "b", weight: 0.2 },
  { id: "rijeka",   label: "Rijeka",   group: "b", weight: 0.1 },
];

/** Page scope picked in the header dropdowns — an empty list = all */
export interface Scope { groups: string[]; locations: string[] }
export const ALL_SCOPE: Scope = { groups: [], locations: [] };

/** locations of the selected groups (all when no group is selected) — the Location dropdown options */
export const locationsInGroups = (groups: string[]) => LOCATIONS.filter((l) => !groups.length || groups.includes(l.group));
/** locations the page currently shows */
export const scopedLocations = (s: Scope) => locationsInGroups(s.groups).filter((l) => !s.locations.length || s.locations.includes(l.id));
/** is the item (location id or label) inside the scope? */
export const inScope = (s: Scope, location?: string) =>
  !location || scopedLocations(s).some((l) => l.id === location || l.label === location);
const scopeShare = (s: Scope) => scopedLocations(s).reduce((n, l) => n + l.weight, 0);

export const NAV_SECTIONS: NavSection[] = [
  { id: "overview", label: "Übersicht", icon: "home" },
  { id: "absences", label: "Abwesenheiten", icon: "cal", children: [] },
  { id: "personnel", label: "Personal", icon: "personnel", children: [] },
  { id: "deductions", label: "Be- und Abzüge", icon: "euro_user", children: [] },
  { id: "rosters", label: "Dienstpläne", icon: "user_clock", children: [] },
  { id: "archive", label: "Archiv", icon: "save", children: [] },
  { id: "documents", label: "Dokumenten Manager", icon: "page_document", children: [] },
  {
    id: "tasks", label: "Aufgaben Management", icon: "checklist",
    children: [
      { id: "tasks/dashboard", label: "Übersicht" },
      { id: "tasks/tasks", label: "Aufgaben" },
      { id: "tasks/forms", label: "Formulare" },
      { id: "tasks/reports", label: "Berichte" },
    ],
  },
  { id: "contacts", label: "Kontakte", icon: "contacts" },
];

/** Flat id → label lookup, used for the content placeholder. */
export const NAV_LABELS: Record<string, string> = Object.fromEntries(
  NAV_SECTIONS.flatMap((s) => [[s.id, s.label], ...(s.children ?? []).map((c) => [c.id, c.label])]),
);

/* ─── Dashboard KPIs ─────────────────────────────────────────── */

export type StatKey = "all" | "done" | "open" | "overdue";

interface StatDef { key: StatKey; label: string; icon: IconName; tone: StatTone; value: number; people: number }

/** Status cards — values of the reference screenshot, shown for the current week. */
const STATUSES: StatDef[] = [
  { key: "done",    label: "Erledigt",             icon: "check",   tone: "success", value: 13, people: 8 },
  { key: "open",    label: "Offen",                 icon: "folder",  tone: "info",    value: 42, people: 10 },
  { key: "overdue", label: "Überfällig",            icon: "warning", tone: "error",   value: 6,  people: 5 },
];

/** "All tasks" = sum of the status cards; people = everyone involved (overlaps, so not a plain sum). */
function withAllTasks(statuses: StatDef[]): StatDef[] {
  const value = statuses.reduce((n, s) => n + s.value, 0);
  const people = Math.min(value, Math.max(0, ...statuses.map((s) => s.people)) + 4);
  return [{ key: "all", label: "Alle Aufgaben", icon: "checklist", tone: "default", value, people }, ...statuses];
}

/** Mock numbers per period: the current week shows the reference values; other periods
    scale with their length (vs. 7 days) and vary deterministically with the start date. */
/** tasks created in the prototype (New task modal) — counted in the KPIs */
export interface CreatedStat { status: TaskRowData["status"]; location?: string; day: Date }

export function statsForRange(range: DateRange, scope: Scope = ALL_SCOPE, created: CreatedStat[] = []): StatDef[] {
  const monday = startOfWeek(TODAY);
  const thisWeek = sameRange(range, { start: monday, end: addDays(monday, 6) });
  const days = diffDays(range.start, range.end) + 1;
  const seed = range.start.getDate() + range.start.getMonth() * 31 + days;
  const share = scopeShare(scope);

  const base = STATUSES.map((s, i) => {
    let { value, people } = s;
    if (!thisWeek) {
      const jitter = 0.7 + ((seed * (i + 3)) % 7) / 10; // 0.7 … 1.3
      value = Math.round((s.value * days * jitter) / 7);
      people = Math.min(value, Math.max(value ? 1 : 0, Math.round(s.people * Math.min(jitter, 1) * Math.sqrt(days / 7))));
    }
    if (share >= 1) return { ...s, value, people };
    // current week: Overdue is exactly the attention items of the scope, so card and list agree
    const items = thisWeek && s.key === "overdue"
      ? ATTENTION_ITEMS.filter((a) => a.kpi === s.key && inScope(scope, a.location)) : null;
    const scaled = items ? items.length : Math.round(value * share);
    return { ...s, value: scaled, people: items ? new Set(items.map((a) => a.meta.split(" · ").pop())).size : Math.min(scaled, Math.max(scaled ? 1 : 0, Math.round(people * Math.sqrt(share)))) };
  });
  // tasks created in the prototype count too
  const mine = created.filter((c) => inScope(scope, c.location) && diffDays(startOfDay(range.start), c.day) >= 0 && diffDays(c.day, range.end) >= 0);
  return withAllTasks(base.map((s) => {
    const n = mine.filter((c) => c.status === s.key).length;
    return n ? { ...s, value: s.value + n, people: s.people + 1 } : s;
  }));
}

/* ─── New task recipients ────────────────────────────────────── */

export interface Person { id: string; label: string; team: string; location: string }

export const PEOPLE: Person[] = [
  { id: "p1",  label: "Ana Grgic",         team: "Küche",      location: "makarska" },
  { id: "p2",  label: "Tobias Aurenz",     team: "Küche",      location: "makarska" },
  { id: "p3",  label: "Marija Vrdoljak",   team: "Küche",      location: "makarska" },
  { id: "p4",  label: "Florian Ade",       team: "Küche",      location: "split" },
  { id: "p5",  label: "Josipa Maksimovic", team: "Service",      location: "zagreb" },
  { id: "p6",  label: "Ruzica Vucic",      team: "Service",      location: "split" },
  { id: "p7",  label: "Kristina Barac",    team: "Service",      location: "rijeka" },
  { id: "p8",  label: "Celine Wagner",     team: "Service",      location: "zagreb" },
  { id: "p9",  label: "Kim Fehrmann",      team: "Housekeeping", location: "rijeka" },
  { id: "p10", label: "Selin Erden",       team: "Housekeeping", location: "split" },
];

/** shifts from the duty roster, with the person on duty today */
export const SHIFTS = [
  { id: "s1", label: "Frühschicht · Küche", person: "Tobias Aurenz",     location: "makarska" },
  { id: "s2", label: "Spätschicht · Küche", person: "Tobias Aurenz",     location: "makarska" },
  { id: "s3", label: "Frühschicht · Service", person: "Josipa Maksimovic", location: "zagreb" },
  { id: "s4", label: "Abschlussschicht · Service", person: "Kristina Barac",    location: "rijeka" },
];

const TEAM_LIST = [
  { id: "team-all", label: "Alle Mitarbeitende" }, { id: "team-kitchen", label: "Küche" },
  { id: "team-service", label: "Service" }, { id: "team-house", label: "Housekeeping" },
];

/** People, teams (with head count) and shifts inside the page scope — the Recipient picker options */
export function recipientsForScope(scope: Scope) {
  const people = PEOPLE.filter((p) => inScope(scope, p.location));
  const teams = TEAM_LIST
    .map((t) => ({ id: t.id, label: t.label, count: t.id === "team-all" ? people.length : people.filter((p) => p.team === t.label).length }))
    .filter((t) => t.count);
  const shifts = SHIFTS.filter((s) => inScope(scope, s.location)).map((s) => ({ id: s.id, label: s.label, sub: `Aus dem Dienstplan · heute: ${s.person}` }));
  return { people: people.map((p) => ({ id: p.id, label: p.label, group: p.team })), teams, shifts };
}

/** any recipient id (person / team / shift) → what the new task needs */
export function resolveRecipient(id: string): { kind: "person" | "team" | "shift"; label: string; team: string; location?: string } | undefined {
  const p = PEOPLE.find((x) => x.id === id);
  if (p) return { kind: "person", label: p.label, team: p.team, location: p.location };
  const t = TEAM_LIST.find((x) => x.id === id);
  if (t) return { kind: "team", label: t.label, team: t.label };
  const sh = SHIFTS.find((x) => x.id === id);
  if (sh) return { kind: "shift", label: sh.label, team: "Dienstplan", location: sh.location };
}

/* ─── Needs your attention ───────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");
/** "05.10. 06:34" relative to TODAY */
const at = (dayOffset: number, time: string) => {
  const d = addDays(TODAY, dayOffset);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}. ${time}`;
};

export interface DashboardAttentionItem extends AttentionItem {
  /** KPI card this item belongs to — selecting that card filters the list */
  kpi: StatKey;
  /** location id */
  location: string;
}

/** Colour + icon come from the KPI card the item belongs to, so rows always match the cards:
    Overdue (incl. deviations) = red / warning. */
function attention(kpi: "overdue", item: Omit<DashboardAttentionItem, "kpi" | "tone" | "icon">): DashboardAttentionItem {
  const card = STATUSES.find((s) => s.key === kpi)!;
  return { ...item, kpi, tone: card.tone, icon: card.icon };
}

/** Sorted by urgency: deviations → overdue (oldest first).
    Status text = card label; deviations keep their own text but belong to the red Overdue card. */
export const ATTENTION_ITEMS: DashboardAttentionItem[] = [
  attention("overdue", { id: "a1", location: "makarska", status: "Abweichung, keine Maßnahme", title: "Kühlraumkontrolle – morgens", meta: `Kühlraum 2: 7,6 °C · ${at(0, "06:34")} · Tobias Aurenz`, actionLabel: "Maßnahme" }),
  attention("overdue", { id: "a2", location: "makarska", status: "Überfällig",              title: "Fritteuse grundreinigen",          meta: `Überfällig seit ${at(-3, "22:00")} · Florian Ade`,        actionLabel: "Öffnen" }),
  attention("overdue", { id: "a3", location: "split", status: "Überfällig",              title: "Hygieneschulung (Video)",  meta: `Überfällig seit ${at(-1, "18:00")} · Selin Erden`,        actionLabel: "Öffnen" }),
  attention("overdue", { id: "a4", location: "zagreb", status: "Überfällig",              title: "Kühlschrank-Temperaturprotokoll",    meta: `Überfällig seit ${at(0, "08:00")} · Tobias Aurenz`,       actionLabel: "Öffnen" }),
  attention("overdue", { id: "a5", location: "split", status: "Überfällig",              title: "Terrasse öffnen – Split",   meta: `Überfällig seit ${at(0, "10:00")} · Ruzica Vucic`,        actionLabel: "Öffnen" }),
  attention("overdue", { id: "a6", location: "zagreb", status: "Überfällig",              title: "Terrasse öffnen",           meta: `Überfällig seit ${at(0, "10:30")} · Josipa Maksimovic`,   actionLabel: "Öffnen" }),
];

/* ─── Today (shift plan) ─────────────────────────────────────── */

export interface ShiftGroupData { id: string; title: string; tasks: (ShiftTask & { location: string })[] }

/** Today's tasks grouped by shift (reference screenshot). */
export const TODAY_SHIFTS: ShiftGroupData[] = [
  { id: "s1", title: "Frühschicht · Küche", tasks: [
    { id: "t1", location: "makarska", state: "done", time: "06:30", title: "Kühlraumkontrolle – morgens", person: "Tobias Aurenz", doneAt: "06:34" },
  ] },
  { id: "s2", title: "Spätschicht · Küche", tasks: [
    { id: "t2", location: "makarska", state: "upcoming", time: "21:00", title: "Kühlraumkontrolle – abends", person: "Tobias Aurenz" },
  ] },
  { id: "s3", title: "Frühschicht · Service", tasks: [
    { id: "t3", location: "zagreb", state: "late", time: "10:30", title: "Terrasse öffnen", person: "Josipa Maksimovic" },
  ] },
  { id: "s4", title: "Einzeln", tasks: [
    { id: "t4", location: "split", state: "done", time: "07:30", title: "Kühlraumkontrolle – Split", person: "Florian Ade", doneAt: "07:42" },
    { id: "t5", location: "split", state: "late", time: "10:00", title: "Terrasse öffnen – Split", person: "Ruzica Vucic" },
    { id: "t6", location: "rijeka", state: "upcoming", time: "14:00", title: "WC auffüllen", person: "Kim Fehrmann" },
    { id: "t7", location: "split", state: "upcoming", time: "15:00", title: "WC auffüllen – Split", person: "Selin Erden" },
  ] },
];

/* ─── Latest form submissions ────────────────────────────────── */

export const SUBMISSIONS: (Submission & { location: string })[] = [
  { id: "f1", location: "split", title: "Kühlraumtemperatur-Kontrolle", person: "Florian Ade",     when: "Today 07:42",     result: "ok" },
  { id: "f2", location: "makarska", title: "Kühlraumtemperatur-Kontrolle", person: "Tobias Aurenz",   when: "Today 06:34",     result: "deviation" },
  { id: "f3", location: "makarska", title: "Kaffeemaschinen-Reinigung",     person: "Ruzica Vucic",    when: "Yesterday 22:31", result: "deviation" },
  { id: "f4", location: "makarska", title: "Kühlraumtemperatur-Kontrolle", person: "Marija Vrdoljak", when: "Yesterday 21:21", result: "ok" },
  { id: "f5", location: "split", title: "Kühlraumtemperatur-Kontrolle", person: "Florian Ade",     when: "Yesterday 07:57", result: "ok" },
  { id: "f6", location: "zagreb", title: "Kühlraumtemperatur-Kontrolle", person: "Ana Grgic",       when: "Yesterday 06:56", result: "ok" },
  { id: "f7", location: "rijeka", title: "Bar-Inventur",         person: "Ana Grgic",       when: "Yesterday 01:12", result: "ok" },
  { id: "f8", location: "makarska", title: "Fritteusenöl-Kontrolle",             person: "Kim Fehrmann",    when: "Mon 20:05",       result: "ok" },
];

/* ─── By team ────────────────────────────────────────────────── */

/** Only tasks that were due count ("Open" = not due yet, left out). Segments = the matching KPI cards,
    so labels + colours are identical to the cards and the donut (no "Missed" — it has no card). */
const DUE_KEYS = ["done", "overdue"] as const;
export const TEAM_SEGMENTS: TeamSegmentDef[] = DUE_KEYS.map((k) => {
  const s = STATUSES.find((x) => x.key === k)!;
  return { key: k, label: s.label, tone: s.tone };
});

/** share of each status per team */
const TEAM_WEIGHTS: { id: string; team: string; w: Record<(typeof DUE_KEYS)[number], number> }[] = [
  { id: "kitchen", team: "Küche",      w: { done: 0.4,  overdue: 0.15 } },
  { id: "service", team: "Service",      w: { done: 0.25, overdue: 0.2 } },
  { id: "house",   team: "Housekeeping", w: { done: 0.2,  overdue: 0.5 } },
  { id: "bar",     team: "Bar",          w: { done: 0.15, overdue: 0.15 } },
];

/** split n by weights, largest remainder — the parts always sum to n */
function split(n: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (n * w) / sum);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => [r - out[i], i] as const).sort((a, b) => b[0] - a[0]);
  const left = n - out.reduce((a, b) => a + b, 0);
  for (let k = 0; k < left; k++) out[order[k][1]]++;
  return out;
}

/** Teams for the period: the KPI numbers (done / overdue) split across the teams,
    so By team always adds up to the cards. Sorted lowest share done first (needs attention on top). */
export function teamsForRange(range: DateRange, scope: Scope = ALL_SCOPE): TeamRow[] {
  const stats = statsForRange(range, scope);
  const rows: TeamRow[] = TEAM_WEIGHTS.map((t) => ({ id: t.id, team: t.team, counts: {} }));
  for (const k of DUE_KEYS) {
    const parts = split(stats.find((s) => s.key === k)!.value, TEAM_WEIGHTS.map((t) => t.w[k]));
    parts.forEach((n, i) => { rows[i].counts[k] = n; });
  }
  const share = (r: TeamRow) => {
    const due = DUE_KEYS.reduce((n, k) => n + (r.counts[k] ?? 0), 0);
    return due ? (r.counts.done ?? 0) / due : 1;
  };
  return rows.sort((a, b) => share(a) - share(b));
}

/* ─── Coming up (next 7 days, without daily routines) ────────── */

export const UPCOMING: (UpcomingItem & { location: string })[] = [
  { id: "u1", location: "makarska", date: addDays(TODAY, 1), title: "Brühgruppendichtung bestellen",     meta: "Kristina Barac · 17:00",            repeat: "Einmalig" },
  { id: "u2", location: "split", date: addDays(TODAY, 2), title: "Einweisung Fluchtwege",     meta: "Alle Mitarbeitende · 18:00",                 repeat: "Einmalig", progress: { done: 5, total: 10 } },
  { id: "u3", location: "zagreb", date: addDays(TODAY, 5), title: "Monatliche Grundreinigung Lager", meta: "Küche · 15:00",                  repeat: "Monatlich", recurring: true },
  { id: "u4", location: "makarska", date: addDays(TODAY, 5), title: "Kaffeemaschine reinigen",      meta: "Kristina Barac · 22:30",            repeat: "Wöchentlich",  recurring: true },
  { id: "u5", location: "rijeka", date: addDays(TODAY, 6), title: "Feuerlöscher-Prüfung",   meta: "Housekeeping · 09:00",              repeat: "Monatlich", recurring: true },
  { id: "u6", location: "split", date: addDays(TODAY, 7), title: "Menüverkostung – Herbst",     meta: "Küche, Service · 16:00",          repeat: "Einmalig" },
];

/* ─── Tasks list ─────────────────────────────────────────────── */

interface TaskTemplate {
  key: string; title: string; high?: boolean; time: string; tags: string[]; proof: TaskRowData["proof"];
  people: [string, string][]; // [person, team] rotated per day
  /** sub-steps (checklist items / form fields) — shown on cards */
  subtasks?: number;
  /** weekday (0 = Sun) for weekly tasks */
  weekday?: number;
  /** fixed location label — otherwise by title ("… Split") or rotated per day */
  loc?: string;
}

const DAILY: TaskTemplate[] = [
  { key: "crm", title: "Kühlraumkontrolle – morgens", high: true, time: "06:30", tags: ["HACCP"], proof: "form",
    people: [["Tobias Aurenz", "Frühschicht · Küche"], ["Ana Grgic", "Frühschicht · Küche"], ["Marija Vrdoljak", "Frühschicht · Küche"]] },
  { key: "crs", title: "Kühlraumkontrolle – Split", high: true, time: "07:30", tags: ["HACCP"], proof: "form", people: [["Florian Ade", "Küche"]] },
  { key: "tos", title: "Terrasse öffnen – Split", time: "10:00", tags: ["Service"], proof: "check", people: [["Ruzica Vucic", "Service"]] },
  { key: "to", title: "Terrasse öffnen", time: "10:30", tags: ["Service"], proof: "check",
    people: [["Josipa Maksimovic", "Frühschicht · Service"], ["Celine Wagner", "Frühschicht · Service"]] },
  { key: "rr", title: "WC auffüllen", time: "14:00", tags: ["Reinigung"], proof: "photo", people: [["Kim Fehrmann", "Housekeeping"]] },
  { key: "rrs", subtasks: 4, title: "WC auffüllen – Split", time: "15:00", tags: ["Reinigung"], proof: "check", people: [["Selin Erden", "Housekeeping"]] },
  { key: "cre", title: "Kühlraumkontrolle – abends", high: true, time: "21:00", tags: ["HACCP"], proof: "form",
    people: [["Tobias Aurenz", "Spätschicht · Küche"], ["Marija Vrdoljak", "Spätschicht · Küche"]] },
];
DAILY.push(
  { key: "ent", title: "Eingangsbereich reinigen", time: "08:00", tags: ["Reinigung"], proof: "photo", people: [["Kim Fehrmann", "Housekeeping"]] },
  { key: "bev", title: "Getränkelager auffüllen", time: "11:00", tags: ["Service"], proof: "check", people: [["Kristina Barac", "Service"]] },
  { key: "all", title: "Allergenliste prüfen", time: "12:00", tags: ["HACCP"], proof: "form", people: [["Ana Grgic", "Küche"]] },
  { key: "kas", title: "Kassenabschluss", time: "23:00", tags: ["Service"], proof: "attachment", people: [["Josipa Maksimovic", "Service"]] },
  { key: "mue", title: "Müll entsorgen", time: "09:00", tags: ["Reinigung"], proof: "check", people: [["Selin Erden", "Housekeeping"]] },
  { key: "kue", title: "Kühlschrank ordnen", time: "13:00", tags: ["HACCP"], proof: "photo", people: [["Florian Ade", "Küche"]] },
  { key: "ter", title: "Terrasse reinigen", time: "16:00", tags: ["Reinigung"], proof: "photo", people: [["Celine Wagner", "Service"]] },
  { key: "bes", title: "Bestellung prüfen", time: "17:30", tags: ["Service"], proof: "check", people: [["Kristina Barac", "Service"]] },
);
const WEEKLY: TaskTemplate[] = [
  { key: "ccm", subtasks: 5, title: "Kaffeemaschine reinigen", time: "22:30", weekday: 1, tags: ["Reinigung", "HACCP", "Pflicht"], proof: "form", people: [["Ruzica Vucic", "Abschlussschicht · Service"]] },
];
/** one-time tasks, placed relative to TODAY */
const ONE_TIME: (TaskTemplate & { day: number; status?: TaskRowData["status"]; comments?: number })[] = [
  { key: "dcf", subtasks: 6, title: "Fritteuse grundreinigen", high: true, day: -3, time: "22:00", tags: ["Reinigung"], proof: "check", people: [["Florian Ade", "Küche"]], loc: "Makarska", status: "overdue", comments: 4 },
  { key: "ht", title: "Hygieneschulung (Video)", day: -1, time: "18:00", tags: ["Schulung"], proof: "attachment", people: [["Selin Erden", "Housekeeping"]], loc: "Split", status: "overdue" },
  { key: "bic", title: "Bar-Inventur", day: -1, time: "22:00", tags: ["Inventur"], proof: "check", people: [["Ana Grgic", "Küche"]], loc: "Rijeka", status: "done", comments: 1 },
  { key: "obs", title: "Brühgruppendichtung bestellen", day: 1, time: "17:00", tags: ["Service"], proof: "check", people: [["Kristina Barac", "Service"]] },
  { key: "erb", title: "Einweisung Fluchtwege", day: 2, time: "18:00", tags: ["Schulung"], proof: "attachment", people: [["Kristina Barac", "Alle Mitarbeitende"]] },
];

/** locations rotated over the days for tasks without a fixed one */
const LOC_CYCLE = ["Makarska", "Makarska", "Zagreb", "Makarska", "Rijeka", "Zagreb"];

const WD_FMT = new Intl.DateTimeFormat("de-DE", { weekday: "short" });
const WD = { format: (d: Date) => WD_FMT.format(d).replace(".", "") };
const ddmm = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const plus = (t: string, n: number) => { const v = mins(t) + n; return `${pad(Math.floor(v / 60) % 24)}:${pad(v % 60)}`; };

/** status of one occurrence: past days done (one deviation each), today by the clock, future open */
function occurrence(t: TaskTemplate, d: Date, seed: number): Pick<TaskRowData, "status" | "doneAt" | "deviation"> {
  const offset = diffDays(TODAY, d);
  const now = TODAY.getHours() * 60 + TODAY.getMinutes();
  if (offset > 0 || (offset === 0 && mins(t.time) > now)) return { status: "open" };
  if (offset === 0 && !t.high && seed % 2 === 0) return { status: "overdue" }; // missed today
  if (offset === 0 && seed % 3 === 0) return { status: "open" }; // late: time passed, day not over
  const late = (seed * 7) % 13;
  return {
    status: "done",
    doneAt: plus(t.time, late),
    deviation: t.proof === "form" && seed % 5 === 0,
  };
}

const CREATORS = ["Michael Potsch", "Anna Müller", "Kristina Barac"];
/** who created the task and when — recurring templates were set up weeks ago, one-time tasks shortly before their day */
function created(t: TaskTemplate & { day?: number }): Pick<TaskRowData, "createdBy" | "createdAt"> {
  const h = [...t.key].reduce((n, c) => n + c.charCodeAt(0), 0);
  const d = addDays(startOfDay(TODAY), (t.day ?? -30) - 2 - (h % 5));
  return {
    createdBy: CREATORS[h % CREATORS.length],
    createdAt: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}, ${pad(8 + (h % 10))}:${pad((h * 7) % 60)} Uhr`,
  };
}

/** short descriptions of the sample tasks (searchable) */
const DESCRIPTIONS: Record<string, string> = {
  crm: "Temperatur im Kühlraum 1 prüfen und im Formular protokollieren. Abweichungen sofort melden.",
  crs: "Kühlraum im Standort Split kontrollieren und Temperatur eintragen.",
  tos: "Terrasse aufschließen, Tische und Stühle stellen, Sonnenschirme öffnen.",
  to: "Terrasse öffnen: Möbel stellen, Heizpilze prüfen, Speisekarten auslegen.",
  rr: "Toiletten kontrollieren, Seife und Papier auffüllen und ein Foto machen.",
  rrs: "Sanitärräume auffüllen und reinigen, danach alle Schritte abhaken.",
  cre: "Abendliche Temperaturkontrolle des Kühlraums und Protokoll im Formular.",
  ccm: "Kaffeemaschine entkalken, Brühgruppe reinigen und Probelauf durchführen.",
  dcf: "Fritteuse vollständig entleeren, reinigen und mit frischem Öl befüllen.",
  ht: "Hygieneschulung als Video ansehen und die Teilnahme bestätigen.",
  bic: "Bestand an der Bar zählen und die Liste hochladen.",
  obs: "Neue Dichtung für die Brühgruppe bestellen.",
  erb: "Mitarbeitende über die Fluchtwege und Sammelplätze informieren.",
  ent: "Eingangsbereich, Fußmatten und Glastüren reinigen und ein Foto machen.",
  bev: "Getränkelager kontrollieren und fehlende Getränke nachfüllen.",
  mue: "Müllbehälter leeren und die Entsorgungsstelle säubern.",
  kue: "Kühlschrank ordnen und Etiketten kontrollieren.",
  ter: "Terrasse kehren und Tische abwischen.",
  bes: "Eingegangene Bestellung auf Vollständigkeit prüfen.",
  all: "Allergenliste mit der aktuellen Speisekarte abgleichen.",
  kas: "Tagesabschluss der Kasse erstellen und den Beleg hochladen.",
  nd1: "Lagerraum aufräumen, Regale beschriften und abgelaufene Ware aussortieren.",
  nd2: "Speisekarte für den Herbst aktualisieren und neue Preise eintragen.",
  nd3: "Notfallplan auf Aktualität prüfen und Kontaktliste erneuern.",
};
const DONE_BY = ["Ana Grgic", "Tobias Aurenz", "Marija Vrdoljak", "Florian Ade"];

/** names of the sub-steps of the templates that have subtasks */
const SUBTASK_NAMES: Record<string, string[]> = {
  dcf: ["Drain oil", "Clean basin", "Replace filter", "Refill oil", "Wipe surfaces", "Check thermostat"],
  ccm: ["Descale boiler", "Clean brew group", "Wash drip tray", "Wipe steam wand", "Test run"],
  rrs: ["Restock soap", "Restock paper towels", "Empty bins", "Wipe sinks"],
};
function subtaskItemsFor(t: TaskTemplate, status: TaskRowData["status"]): TaskRowData["subtaskItems"] {
  if (!t.subtasks) return undefined;
  const names = SUBTASK_NAMES[t.key] ?? Array.from({ length: t.subtasks }, (_, i) => `Step ${i + 1}`);
  return names.slice(0, t.subtasks).map((title, i) => ({ id: `${t.key}-s${i}`, title, done: status === "done" }));
}

function makeRow(t: TaskTemplate, d: Date, extra: Partial<TaskRowData>, seed: number): TaskRowData {
  const [person, team] = t.people[seed % t.people.length];
  return {
    id: `${t.key}-${d.toDateString()}`, title: t.title, high: t.high, tags: t.tags, proof: t.proof, person, team,
    location: t.loc ?? (t.title.includes("Split") ? "Split" : LOC_CYCLE[seed % LOC_CYCLE.length]), subtasks: t.subtasks,
    ...created(t),
    description: DESCRIPTIONS[t.key],
    doneBy: (extra.status ?? "open") === "done" ? DONE_BY[(seed + t.key.length) % DONE_BY.length] : undefined,
    subtaskItems: subtaskItemsFor(t, extra.status ?? "open"),
    recurring: t.weekday !== undefined || DAILY.includes(t),
    schedule: t.weekday !== undefined ? `Wöchentlich · ${WD.format(d)} ${t.time}` : DAILY.includes(t) ? `Täglich ${t.time}` : "Einmalig",
    due: { date: `${ddmm(d)}${String(d.getFullYear()).slice(2)}`, time: t.time }, status: "open", ...extra,
  };
}

/** tasks without a due date — never listed under a day, always in their own section "Ohne Fälligkeit" */
const NO_DUE: TaskTemplate[] = [
  { key: "nd1", title: "Lagerraum aufräumen", time: "", tags: ["Reinigung"], proof: "check", loc: "Makarska", people: [["Ana Grgic", "Küche"]] },
  { key: "nd2", title: "Speisekarte aktualisieren", time: "", tags: ["Service"], proof: "attachment", loc: "Split", people: [["Kristina Barac", "Service"]] },
  { key: "nd3", title: "Notfallplan prüfen", high: true, time: "", tags: ["Schulung"], proof: "form", loc: "Rijeka", people: [["Florian Ade", "Küche"]] },
];
const noDueTasks = (): TaskRowData[] => NO_DUE.map((t) => ({
  ...makeRow(t, startOfDay(TODAY), { status: "open" }, 0), id: `nodue-${t.key}`, noDue: true, recurring: false, schedule: "Einmalig · ohne Fälligkeit", due: { date: "", time: "" }, status: "open",
}));

/** sort key of a due time: "10:00" → 10:00 · range "16:00–17:00" → 17:00 (due at the end) · "All day" → end of the day */
export const dueSortKey = (t: TaskRowData) => {
  const s = t.due.time;
  if (/ganz|all day/i.test(s)) return "99:99";
  const m = s.match(/(\d{2}:\d{2})\D+(\d{2}:\d{2})/);
  return m ? m[2] : s;
};
/** inside a day: earliest due time first, same time → title A–Z */
export const compareDue = (a: TaskRowData, b: TaskRowData) => dueSortKey(a).localeCompare(dueSortKey(b)) || a.title.localeCompare(b.title, "de");
/** "08.10.26" → comparable number (older = smaller) */
export const dueDateKey = (t: TaskRowData) => { const [d, m, y] = t.due.date.split(".").map(Number); return (y || 0) * 10000 + (m || 0) * 100 + (d || 0); };

/** Task groups for the period: "Overdue – still open" (before today) first, then one group per day. */
export function taskGroupsForRange(range: DateRange): TaskGroup[] {
  const groups: TaskGroup[] = [];
  const overdue: TaskRowData[] = [];
  const row = makeRow;

  for (const o of ONE_TIME) {
    const d = addDays(startOfDay(TODAY), o.day);
    if (o.status === "overdue") overdue.push(row(o, d, { status: "overdue", comments: o.comments }, 0));
  }
  if (overdue.length) groups.push({ id: "overdue", label: "Überfällig – noch offen", kind: "overdue", tasks: overdue });

  for (let d = startOfDay(range.start); diffDays(d, range.end) >= 0; d = addDays(d, 1)) {
    const seed = d.getDate() + d.getMonth() * 31;
    const tasks: TaskRowData[] = [];
    DAILY.forEach((t, i) => tasks.push(row(t, d, occurrence(t, d, seed + i), seed + i)));
    for (const t of WEEKLY) if (d.getDay() === t.weekday) tasks.push(row(t, d, occurrence(t, d, seed), seed));
    for (const o of ONE_TIME) {
      if (o.status === "overdue" || !sameDay(addDays(startOfDay(TODAY), o.day), d)) continue;
      tasks.push(row(o, d, { status: o.status ?? "open", doneAt: o.status === "done" ? plus(o.time, 48) : undefined, comments: o.comments }, 0));
    }
    tasks.sort(compareDue);
    groups.push({ id: d.toDateString(), date: d, label: `${WD.format(d)} ${ddmm(d)}`, kind: sameDay(d, TODAY) ? "today" : undefined, tasks });
  }
  // no due date = no day: always their own section at the end, whatever period is selected
  groups.push({ id: "nodue", label: "Ohne Fälligkeit", kind: "nodue", tasks: noDueTasks() });
  return groups;
}

/* ─── Task detail: Dashboard rows → TaskRowData ─────────────── */

interface DetailSource {
  title: string; date?: Date; person?: string; team?: string; time?: string; location?: string;
  status?: TaskRowData["status"]; doneAt?: string; schedule?: string; recurring?: boolean;
}

/** The task behind a Dashboard row: the matching template when there is one (type, tags, subtasks), else built from the row. */
export function detailTask(src: DetailSource): TaskRowData {
  const tpl = [...DAILY, ...WEEKLY, ...ONE_TIME].find((t) => t.title === src.title);
  const one = ONE_TIME.find((t) => t.title === src.title);
  const d = src.date ?? (one ? addDays(startOfDay(TODAY), one.day) : startOfDay(TODAY));
  if (tpl) {
    const r = makeRow(tpl, d, { status: src.status ?? one?.status ?? "open", doneAt: src.doneAt, comments: one?.comments }, 0);
    return { ...r, person: src.person ?? r.person, team: src.team ?? r.team, location: src.location ?? r.location };
  }
  const time = src.time ?? "12:00";
  const t: TaskTemplate = { key: src.title, title: src.title, time, tags: [], proof: "check", people: [[src.person ?? "—", src.team ?? ""]] };
  return {
    id: `dash-${src.title}-${d.toDateString()}`, title: src.title, tags: [], proof: "check", person: src.person ?? "—", team: src.team ?? "",
    location: src.location, ...created(t), recurring: !!src.recurring, schedule: src.schedule ?? "Einmalig",
    due: { date: `${ddmm(d)}${String(d.getFullYear()).slice(2)}`, time }, status: src.status ?? "open", doneAt: src.doneAt,
  };
}

const locLabel = (id: string) => LOCATIONS.find((l) => l.id === id)?.label;

export function taskFromAttention(i: DashboardAttentionItem): TaskRowData {
  const m = i.meta.match(/(\d{2})\.(\d{2})\.\s(\d{2}:\d{2})/);
  const date = m ? new Date(TODAY.getFullYear(), Number(m[2]) - 1, Number(m[1])) : undefined;
  return detailTask({ title: i.title, date, time: m?.[3], person: i.meta.split(" · ").pop(), status: "overdue", location: locLabel(i.location) });
}

export function taskFromShift(t: ShiftTask & { location: string }): TaskRowData {
  return detailTask({
    title: t.title, date: startOfDay(TODAY), time: t.time, person: t.person, location: locLabel(t.location),
    status: t.state === "done" ? "done" : t.state === "late" ? "overdue" : "open", doneAt: t.doneAt,
  });
}

export function taskFromUpcoming(u: UpcomingItem & { location: string }): TaskRowData {
  const parts = u.meta.split(" · ");
  return detailTask({
    title: u.title, date: startOfDay(u.date), person: parts[0], time: parts[parts.length - 1], location: locLabel(u.location),
    schedule: u.repeat, recurring: u.repeat !== "Einmalig",
  });
}


/* ─── Completion over time ───────────────────────────────────── */

const WEEKDAY = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short" });

/** deterministic mock workload for one day; future days have planned tasks but nothing done */
function dayLoad(d: Date) {
  const seed = d.getDate() * 7 + d.getMonth() * 13 + d.getDay();
  const total = d.getDay() === 0 ? 2 : 6 + (seed % 7);
  if (diffDays(TODAY, d) > 0) return { total, done: 0 };
  const ratio = sameDay(d, TODAY) ? 0.4 : 0.55 + ((seed * 3) % 45) / 100;
  return { total, done: Math.round(total * ratio) };
}

/** Bars for the period: per day (≤ 31 days), per week (≤ 120 days) or per month.
    Buckets are scaled so their sums match the KPI cards (done / all tasks);
    future buckets carry only planned tasks (done = 0). */
export function completionSeries(range: DateRange, done: number, all: number): BarDatum[] {
  const len = diffDays(range.start, range.end) + 1;
  const unit = len <= 31 ? "day" : len <= 120 ? "week" : "month";

  const buckets: { start: Date; end: Date }[] = [];
  let cur = startOfDay(range.start);
  while (diffDays(cur, range.end) >= 0) {
    const next = unit === "day" ? addDays(cur, 1) : unit === "week" ? addDays(startOfWeek(cur), 7) : addMonths(cur, 1);
    const end = addDays(next, -1);
    buckets.push({ start: cur, end: diffDays(end, range.end) < 0 ? range.end : end });
    cur = next;
  }

  const raw = buckets.map((b) => {
    let total = 0, d = 0;
    for (let x = b.start; diffDays(x, b.end) >= 0; x = addDays(x, 1)) {
      const l = dayLoad(x); total += l.total; d += l.done;
    }
    return { ...b, total, done: d, future: diffDays(TODAY, b.start) > 0 };
  });

  const rawTotal = raw.reduce((n, b) => n + b.total, 0) || 1;
  const rawDone = raw.reduce((n, b) => n + b.done, 0) || 1;

  return raw.map((b) => {
    const total = Math.round((b.total * all) / rawTotal);
    const doneScaled = Math.min(total, Math.round((b.done * done) / rawDone));
    const current = diffDays(b.start, TODAY) >= 0 && diffDays(TODAY, b.end) >= 0;
    const label =
      unit === "day" ? (len <= 7 ? WEEKDAY[b.start.getDay()] : `${pad(b.start.getDate())}.`)
      : unit === "week" ? `KW ${isoWeek(b.start)}`
      : MONTH.format(b.start);
    const sublabel = unit === "day" && len <= 7 ? `${pad(b.start.getDate())}.${pad(b.start.getMonth() + 1)}.` : undefined;
    return {
      key: b.start.toISOString(), label, sublabel, current, future: b.future,
      done: b.future ? 0 : doneScaled, total,
    };
  });
}

