import type { AttentionItem, BarDatum, IconName, NavSection, ShiftTask, StatTone, TaskGroup, TaskRowData, TeamRow, TeamSegmentDef, UpcomingItem,
} from "@/design-system";
import {
  addDays, addMonths, diffDays, isoWeek, sameDay, sameRange, startOfDay, startOfWeek, type DateRange,
} from "@/design-system/utils/date";
import { SUBTASK_FILES, TASK_FILES, makeFile } from "./mockFiles";

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
  { id: "frankfurt", label: "Frankfurt", group: "a", weight: 0.4 },
  { id: "muenchen",  label: "München",   group: "a", weight: 0.3 },
  { id: "hamburg",   label: "Hamburg",   group: "b", weight: 0.2 },
  { id: "koeln",     label: "Köln",      group: "b", weight: 0.1 },
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
  { id: "p1",  label: "Ana Grgic",         team: "Küche",     location: "muenchen" },
  { id: "p2",  label: "Tobias Aurenz",     team: "Küche",     location: "muenchen" },
  { id: "p3",  label: "Marija Vrdoljak",   team: "Küche",     location: "hamburg" },
  { id: "p4",  label: "Florian Ade",       team: "Küche",     location: "koeln" },
  { id: "p5",  label: "Josipa Maksimovic", team: "Shop",      location: "frankfurt" },
  { id: "p6",  label: "Ruzica Vucic",      team: "Service",   location: "hamburg" },
  { id: "p7",  label: "Kristina Barac",    team: "Service",   location: "muenchen" },
  { id: "p8",  label: "Celine Wagner",     team: "Shop",      location: "frankfurt" },
  { id: "p9",  label: "Kim Fehrmann",      team: "Reinigung", location: "frankfurt" },
  { id: "p10", label: "Selin Erden",       team: "Reinigung", location: "muenchen" },
];

/** shifts from the duty roster, with the person on duty today */
export const SHIFTS = [
  { id: "s1", label: "Frühschicht · Küche", person: "Tobias Aurenz",     location: "muenchen" },
  { id: "s2", label: "Spätschicht · Küche", person: "Tobias Aurenz",     location: "muenchen" },
  { id: "s3", label: "Frühschicht · Shop", person: "Josipa Maksimovic", location: "frankfurt" },
  { id: "s4", label: "Abschlussschicht · Service", person: "Ruzica Vucic", location: "hamburg" },
];

const TEAM_LIST = [
  { id: "team-all", label: "Alle Mitarbeitende" }, { id: "team-kitchen", label: "Küche" },
  { id: "team-service", label: "Service" }, { id: "team-shop", label: "Shop" }, { id: "team-house", label: "Reinigung" },
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
    Overdue = red / warning. */
function attention(kpi: "overdue", item: Omit<DashboardAttentionItem, "kpi" | "tone" | "icon">): DashboardAttentionItem {
  const card = STATUSES.find((s) => s.key === kpi)!;
  return { ...item, kpi, tone: card.tone, icon: card.icon };
}

/** Sorted by urgency: overdue, oldest first. Status text = card label. */
export const ATTENTION_ITEMS: DashboardAttentionItem[] = [
  attention("overdue", { id: "a1", location: "koeln",     status: "Überfällig", title: "Fritteuse grundreinigen",                           meta: `Überfällig seit ${at(-3, "22:00")} · Florian Ade`,      actionLabel: "Öffnen" }),
  attention("overdue", { id: "a2", location: "muenchen",  status: "Überfällig", title: "Hygieneschulung: Teilnahmebescheinigung hochladen", meta: `Überfällig seit ${at(-1, "18:00")} · Selin Erden`,      actionLabel: "Öffnen" }),
  attention("overdue", { id: "a3", location: "frankfurt", status: "Überfällig", title: "Zapfsäulen & Tankplatz kontrollieren",              meta: `Überfällig seit ${at(0, "06:30")} · Kim Fehrmann`,      actionLabel: "Öffnen" }),
  attention("overdue", { id: "a4", location: "muenchen",  status: "Überfällig", title: "Kühlhaus-Temperatur prüfen – morgens",              meta: `Überfällig seit ${at(0, "06:30")} · Tobias Aurenz`,     actionLabel: "Öffnen" }),
  attention("overdue", { id: "a5", location: "hamburg",   status: "Überfällig", title: "Kuchenvitrine: Temperatur & Etiketten prüfen",      meta: `Überfällig seit ${at(0, "08:00")} · Marija Vrdoljak`,   actionLabel: "Öffnen" }),
  attention("overdue", { id: "a6", location: "muenchen",  status: "Überfällig", title: "Terrasse öffnen",                                   meta: `Überfällig seit ${at(0, "10:30")} · Kristina Barac`,    actionLabel: "Öffnen" }),
];

/* ─── Today (shift plan) ─────────────────────────────────────── */

export interface ShiftGroupData { id: string; title: string; tasks: (ShiftTask & { location: string })[] }

/** Today's tasks grouped by shift. */
export const TODAY_SHIFTS: ShiftGroupData[] = [
  { id: "s1", title: "Frühschicht · Küche", tasks: [
    { id: "t1", location: "muenchen", state: "done", time: "06:30", title: "Kühlhaus-Temperatur prüfen – morgens", person: "Tobias Aurenz", doneAt: "06:34" },
  ] },
  { id: "s2", title: "Spätschicht · Küche", tasks: [
    { id: "t2", location: "muenchen", state: "upcoming", time: "21:00", title: "Kühlhaus-Temperatur prüfen – abends", person: "Tobias Aurenz" },
  ] },
  { id: "s3", title: "Frühschicht · Shop", tasks: [
    { id: "t3", location: "frankfurt", state: "done", time: "05:30", title: "Shop öffnen & Kasse einrichten", person: "Josipa Maksimovic", doneAt: "05:41" },
    { id: "t4", location: "frankfurt", state: "done", time: "07:30", title: "Lieferschein Backwaren prüfen", person: "Josipa Maksimovic", doneAt: "07:52" },
  ] },
  { id: "s4", title: "Einzeln", tasks: [
    { id: "t5", location: "frankfurt", state: "late", time: "06:30", title: "Zapfsäulen & Tankplatz kontrollieren", person: "Kim Fehrmann" },
    { id: "t6", location: "hamburg", state: "late", time: "08:00", title: "Kuchenvitrine: Temperatur & Etiketten prüfen", person: "Marija Vrdoljak" },
    { id: "t7", location: "muenchen", state: "late", time: "10:30", title: "Terrasse öffnen", person: "Kristina Barac" },
    { id: "t8", location: "frankfurt", state: "upcoming", time: "14:00", title: "Waschstraße & Staubsaugerplätze reinigen", person: "Kim Fehrmann" },
    { id: "t9", location: "frankfurt", state: "upcoming", time: "22:00", title: "Kassenabschluss (Z-Bon)", person: "Celine Wagner" },
  ] },
];

/* ─── Recently completed ─────────────────────────────────────── */

export interface RecentDone { id: string; location: string; title: string; person: string; day: 0 | -1; time: string; proof: TaskRowData["proof"] }

/** Latest completed tasks (what the employees handed in), newest first. */
export const RECENT_DONE: RecentDone[] = [
  { id: "r1", location: "frankfurt", title: "Lieferschein Backwaren prüfen",        person: "Josipa Maksimovic", day: 0,  time: "07:52", proof: "attachment" },
  { id: "r2", location: "hamburg",   title: "Milchlieferung: Lieferschein ablegen", person: "Marija Vrdoljak",   day: 0,  time: "07:12", proof: "attachment" },
  { id: "r3", location: "muenchen",  title: "Kühlhaus-Temperatur prüfen – morgens", person: "Tobias Aurenz",     day: 0,  time: "06:34", proof: "attachment" },
  { id: "r4", location: "frankfurt", title: "Shop öffnen & Kasse einrichten",       person: "Josipa Maksimovic", day: 0,  time: "05:41", proof: "check" },
  { id: "r5", location: "frankfurt", title: "Kassenabschluss (Z-Bon)",              person: "Celine Wagner",     day: -1, time: "22:14", proof: "attachment" },
  { id: "r6", location: "hamburg",   title: "Getränke-Inventur Bar",                person: "Marija Vrdoljak",   day: -1, time: "22:48", proof: "attachment" },
  { id: "r7", location: "muenchen",  title: "Gastraum & Eingang reinigen",          person: "Selin Erden",       day: -1, time: "09:48", proof: "photo" },
  { id: "r8", location: "frankfurt", title: "Waschstraße & Staubsaugerplätze reinigen", person: "Kim Fehrmann",  day: -1, time: "14:22", proof: "photo" },
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
  { id: "service", team: "Service",    w: { done: 0.25, overdue: 0.2 } },
  { id: "house",   team: "Reinigung",  w: { done: 0.2,  overdue: 0.5 } },
  { id: "shop",    team: "Shop",       w: { done: 0.15, overdue: 0.15 } },
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
  { id: "u1", location: "hamburg",   date: addDays(TODAY, 1), title: "Ersatzdichtung für Siebträger bestellen",           meta: "Ruzica Vucic · 17:00",              repeat: "Einmalig" },
  { id: "u2", location: "muenchen",  date: addDays(TODAY, 2), title: "Einweisung Fluchtwege: Unterschriftenliste",         meta: "Alle Mitarbeitende · 18:00",        repeat: "Einmalig", progress: { done: 5, total: 10 } },
  { id: "u3", location: "koeln",     date: addDays(TODAY, 5), title: "Monatliche Grundreinigung Lager",                    meta: "Küche · 15:00",                     repeat: "Monatlich", recurring: true },
  { id: "u4", location: "hamburg",   date: addDays(TODAY, 5), title: "Kaffeemaschine entkalken",                           meta: "Ruzica Vucic · 22:30",              repeat: "Wöchentlich",  recurring: true },
  { id: "u5", location: "frankfurt", date: addDays(TODAY, 6), title: "Feuerlöscher-Prüfung",                               meta: "Reinigung · 09:00",                 repeat: "Monatlich", recurring: true },
  { id: "u6", location: "muenchen",  date: addDays(TODAY, 7), title: "Menüverkostung – Herbst",                            meta: "Küche, Service · 16:00",            repeat: "Einmalig" },
];

/* ─── Tasks list ─────────────────────────────────────────────── */

interface TaskTemplate {
  key: string; title: string; high?: boolean; time: string; tags: string[]; proof: TaskRowData["proof"];
  people: [string, string][]; // [person, team] rotated per day
  /** sub-steps (checklist items / form fields) — shown on cards */
  subtasks?: number;
  /** weekday (0 = Sun) for weekly tasks */
  weekday?: number;
  /** fixed location label — otherwise the location of the first person */
  loc?: string;
}

/* Sample operator: Tankstelle + Shop (Frankfurt), Restaurants (München, Köln), Café & Bar (Hamburg).
   Every task has ONE solution type for the employee: check · attachment (document) · camera (photo) — or subtasks (a normal task). */
const DAILY: TaskTemplate[] = [
  // Frankfurt · Tankstelle & Shop
  { key: "sho", title: "Shop öffnen & Kasse einrichten", time: "05:30", tags: ["Kasse", "Service"], proof: "check",
    people: [["Josipa Maksimovic", "Frühschicht · Shop"], ["Celine Wagner", "Frühschicht · Shop"]] },
  { key: "zap", title: "Zapfsäulen & Tankplatz kontrollieren", high: true, time: "06:30", tags: ["Sicherheit", "Reinigung"], proof: "photo", people: [["Kim Fehrmann", "Reinigung"]] },
  { key: "bak", title: "Lieferschein Backwaren prüfen", time: "07:30", tags: ["Wareneingang"], proof: "attachment", people: [["Josipa Maksimovic", "Frühschicht · Shop"]] },
  { key: "prc", title: "Preisauszeichnung an den Zapfsäulen abgleichen", time: "08:30", tags: ["Kasse"], proof: "check", people: [["Celine Wagner", "Frühschicht · Shop"]] },
  { key: "wcf", subtasks: 4, title: "WC-Kontrolle Tankstelle", time: "10:00", tags: ["Reinigung"], proof: "check", people: [["Kim Fehrmann", "Reinigung"]] },
  { key: "wsh", title: "Waschstraße & Staubsaugerplätze reinigen", time: "14:00", tags: ["Reinigung"], proof: "photo", people: [["Kim Fehrmann", "Reinigung"]] },
  { key: "kas", title: "Kassenabschluss (Z-Bon)", time: "22:00", tags: ["Kasse"], proof: "attachment", people: [["Celine Wagner", "Spätschicht · Shop"], ["Josipa Maksimovic", "Spätschicht · Shop"]] },
  // München · Restaurant
  { key: "kk1", title: "Kühlhaus-Temperatur prüfen – morgens", high: true, time: "06:30", tags: ["HACCP"], proof: "attachment",
    people: [["Tobias Aurenz", "Frühschicht · Küche"], ["Ana Grgic", "Frühschicht · Küche"]] },
  { key: "gas", title: "Gastraum & Eingang reinigen", time: "09:30", tags: ["Reinigung"], proof: "photo", people: [["Selin Erden", "Reinigung"]] },
  { key: "mue", title: "Müll entsorgen", time: "09:00", tags: ["Reinigung"], proof: "check", people: [["Selin Erden", "Reinigung"]] },
  { key: "ter", title: "Terrasse öffnen", time: "10:30", tags: ["Service"], proof: "check", people: [["Kristina Barac", "Frühschicht · Service"]] },
  { key: "all", title: "Allergen-Aushang der Tageskarte prüfen", time: "11:00", tags: ["HACCP"], proof: "photo", people: [["Ana Grgic", "Küche"]] },
  { key: "bev", title: "Getränkelager auffüllen", time: "11:30", tags: ["Service"], proof: "check", people: [["Kristina Barac", "Frühschicht · Service"]] },
  { key: "get", title: "Getränkelieferung annehmen & Lieferschein ablegen", time: "12:30", tags: ["Wareneingang"], proof: "attachment", people: [["Kristina Barac", "Frühschicht · Service"]] },
  { key: "kk2", title: "Kühlhaus-Temperatur prüfen – abends", high: true, time: "21:00", tags: ["HACCP"], proof: "attachment",
    people: [["Tobias Aurenz", "Spätschicht · Küche"], ["Ana Grgic", "Spätschicht · Küche"]] },
  // Hamburg · Café & Bar
  { key: "mil", title: "Milchlieferung: Lieferschein ablegen", time: "07:00", tags: ["Wareneingang"], proof: "attachment", people: [["Marija Vrdoljak", "Küche"]] },
  { key: "vit", title: "Kuchenvitrine: Temperatur & Etiketten prüfen", time: "08:00", tags: ["HACCP"], proof: "photo", people: [["Marija Vrdoljak", "Küche"]] },
  { key: "zp2", title: "Zapfanlage spülen", time: "22:30", tags: ["Reinigung"], proof: "check", people: [["Ruzica Vucic", "Abschlussschicht · Service"]] },
  { key: "bar", title: "Bar & Theke für den Abschluss reinigen", time: "23:00", tags: ["Reinigung"], proof: "photo", people: [["Ruzica Vucic", "Abschlussschicht · Service"]] },
  // Köln · Restaurant
  { key: "oel", title: "Frittieröl prüfen (Testprotokoll)", time: "14:30", tags: ["HACCP"], proof: "attachment", people: [["Florian Ade", "Küche"]] },
];
const WEEKLY: TaskTemplate[] = [
  { key: "ccm", subtasks: 5, title: "Kaffeemaschine entkalken", time: "22:30", weekday: 1, tags: ["Reinigung", "HACCP", "Pflicht"], proof: "check", people: [["Ruzica Vucic", "Abschlussschicht · Service"]] },
];
/** one-time tasks, placed relative to TODAY */
const ONE_TIME: (TaskTemplate & { day: number; status?: TaskRowData["status"]; comments?: number })[] = [
  { key: "dcf", subtasks: 6, title: "Fritteuse grundreinigen", high: true, day: -3, time: "22:00", tags: ["Reinigung"], proof: "check", people: [["Florian Ade", "Küche"]], status: "overdue", comments: 4 },
  { key: "ht", title: "Hygieneschulung: Teilnahmebescheinigung hochladen", day: -1, time: "18:00", tags: ["Schulung"], proof: "attachment", people: [["Selin Erden", "Reinigung"]], status: "overdue" },
  { key: "bic", title: "Getränke-Inventur Bar", day: -1, time: "22:00", tags: ["Inventur"], proof: "attachment", people: [["Marija Vrdoljak", "Küche"]], status: "done", comments: 1 },
  { key: "obs", title: "Ersatzdichtung für Siebträger bestellen", day: 1, time: "17:00", tags: ["Service"], proof: "check", people: [["Ruzica Vucic", "Service"]] },
  // erledigte Aufgaben mit Unteraufgaben (Check · Foto · Anhang gemischt)
  { key: "sue", subtasks: 4, title: "Schichtübergabe Tankstelle", high: true, day: 0, time: "05:45", tags: ["Kasse", "Sicherheit"], proof: "check", people: [["Josipa Maksimovic", "Frühschicht · Shop"]], status: "done" },
  { key: "wgr", subtasks: 5, title: "Wochenend-Grundreinigung Restaurant", day: 0, time: "06:15", tags: ["Reinigung", "HACCP"], proof: "check", people: [["Selin Erden", "Reinigung"]], status: "done" },
  { key: "caf", subtasks: 5, title: "Eröffnungs-Check Café & Bar", high: true, day: 0, time: "06:00", tags: ["Service", "HACCP"], proof: "check", people: [["Marija Vrdoljak", "Küche"]], status: "done" },
  { key: "erb", title: "Einweisung Fluchtwege: Unterschriftenliste", day: 2, time: "18:00", tags: ["Schulung"], proof: "attachment", people: [["Kristina Barac", "Alle Mitarbeitende"]], loc: "München" },
];

const WD_FMT = new Intl.DateTimeFormat("de-DE", { weekday: "short" });
const WD = { format: (d: Date) => WD_FMT.format(d).replace(".", "") };
const ddmm = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const plus = (t: string, n: number) => { const v = mins(t) + n; return `${pad(Math.floor(v / 60) % 24)}:${pad(v % 60)}`; };

/** status of one occurrence: past days done, today by the clock, future open */
function occurrence(t: TaskTemplate, d: Date, seed: number): Pick<TaskRowData, "status" | "doneAt"> {
  const offset = diffDays(TODAY, d);
  const now = TODAY.getHours() * 60 + TODAY.getMinutes();
  if (offset > 0 || (offset === 0 && mins(t.time) > now)) return { status: "open" };
  if (offset < 0 && !t.high && (seed * 3) % 11 === 0) return { status: "overdue" }; // missed on an earlier day, still open
  if (offset === 0 && !t.high && seed % 2 === 0) return { status: "overdue" }; // missed today
  if (offset === 0 && seed % 3 === 0) return { status: "open" }; // late: time passed, day not over
  const late = (seed * 7) % 13;
  return {
    status: "done",
    doneAt: plus(t.time, late),
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
  sho: "Shop aufschließen, Kasse mit Wechselgeld einrichten, Kaffeemaschine und Backstation einschalten.",
  zap: "Zapfsäulen, Tankplatz und Ölbinder kontrollieren und ein Foto der Zapfsäulen machen. Auffälligkeiten sofort melden.",
  bak: "Lieferschein der Backwaren mit der Lieferung abgleichen und als Dokument hochladen.",
  prc: "Preise an den Zapfsäulen mit dem Preismast und dem Kassensystem abgleichen.",
  wcf: "Tankstellen-WC kontrollieren, nachfüllen und reinigen. Danach alle Schritte erledigen.",
  wsh: "Waschplatz und Staubsaugerplätze reinigen und ein Foto machen.",
  kas: "Tagesabschluss der Kasse erstellen und den Z-Bon hochladen. Kassendifferenzen sofort melden.",
  kk1: "Temperatur im Kühlhaus messen und das Protokoll hochladen. Abweichungen über 7 °C sofort melden.",
  kk2: "Abendliche Temperaturkontrolle der Kühlräume. Protokoll als Dokument hochladen.",
  gas: "Gastraum und Eingangsbereich reinigen, Tische abwischen und ein Foto nach der Reinigung machen.",
  mue: "Müllbehälter leeren und die Entsorgungsstelle säubern.",
  ter: "Terrasse aufschließen, Tische und Stühle stellen, Sonnenschirme öffnen und Heizpilze prüfen.",
  all: "Aushang mit den Allergenen der Tageskarte prüfen und ein Foto des Aushangs machen.",
  bev: "Getränkelager kontrollieren und fehlende Getränke nachfüllen.",
  get: "Getränkelieferung annehmen, auf Vollständigkeit prüfen und den Lieferschein hochladen.",
  mil: "Milchlieferung kontrollieren (Kühlkette) und den Lieferschein ablegen.",
  vit: "Temperatur und Preisschilder der Kuchenvitrine prüfen und ein Foto machen.",
  zp2: "Zapfanlage mit Reinigungslösung spülen und mit klarem Wasser nachspülen.",
  bar: "Bar und Theke für den Abschluss reinigen und ein Foto der sauberen Theke machen.",
  oel: "Ölqualität der Fritteusen messen und das Testprotokoll hochladen.",
  ccm: "Kaffeemaschine entkalken, Brühgruppe reinigen und einen Probelauf durchführen.",
  dcf: "Fritteuse vollständig entleeren, reinigen und mit frischem Öl befüllen.",
  ht: "Hygieneschulung abschließen und die Teilnahmebescheinigung hochladen.",
  bic: "Bestand an der Bar zählen und die Inventurliste hochladen.",
  obs: "Neue Dichtung für den Siebträger bestellen.",
  sue: "Kasse zählen, Zwischenabschluss erstellen und die Tankstelle an die Spätschicht übergeben. Foto und Protokolle hochladen.",
  wgr: "Gastraum und Küche gründlich reinigen, mit Fotos und Reinigungsnachweis dokumentieren.",
  caf: "Café und Bar für den Tag vorbereiten: Maschine, Vitrine, Temperaturprotokoll und Kasse.",
  erb: "Mitarbeitende über Fluchtwege und Sammelplätze einweisen und die Unterschriftenliste hochladen.",
  nd1: "Lagerraum aufräumen, Regale beschriften und abgelaufene Ware aussortieren. Foto vom aufgeräumten Lager.",
  nd2: "Speisekarte für den Herbst aktualisieren und neue Preise eintragen. Entwurf hochladen.",
  nd3: "Notfallplan auf Aktualität prüfen, Kontaktliste erneuern und den neuen Plan hochladen.",
};

type SubProof = NonNullable<NonNullable<TaskRowData["subtaskItems"]>[number]["proof"]>;
/** names of the sub-steps (+ how each is solved) of the templates that have subtasks */
const SUBTASK_NAMES: Record<string, [string, SubProof][]> = {
  wcf: [["Seife auffüllen", "check"], ["Papier auffüllen", "check"], ["Mülleimer leeren", "check"], ["Waschbecken & Boden reinigen (Foto)", "photo"]],
  ccm: [["Entkalker ansetzen", "check"], ["Brühgruppe reinigen (Foto)", "photo"], ["Auffangschale spülen", "check"], ["Dampflanze reinigen", "check"], ["Probelauf-Protokoll hochladen", "attachment"]],
  sue: [["Kassenstand zählen", "check"], ["Zwischenabschluss (Z-Bon) hochladen", "attachment"], ["Zapfsäulen und Tankplatz (Foto)", "photo"], ["Übergabeprotokoll hochladen", "attachment"]],
  wgr: [["Boden gewischt und desinfiziert", "check"], ["Gastraum nach der Reinigung (Foto)", "photo"], ["Küche und Arbeitsflächen (Foto)", "photo"], ["Reinigungsnachweis hochladen", "attachment"], ["Müll und Altglas entsorgt", "check"]],
  caf: [["Maschine einschalten und spülen", "check"], ["Siebträger und Brühgruppe (Foto)", "photo"], ["Kühlvitrine einräumen (Foto)", "photo"], ["Temperaturprotokoll hochladen", "attachment"], ["Kasse öffnen", "check"]],
  dcf: [["Öl ablassen", "check"], ["Becken reinigen (Foto)", "photo"], ["Filter wechseln (Foto)", "photo"], ["Frisches Öl einfüllen", "check"], ["Flächen abwischen", "check"], ["Thermostat messen (Messprotokoll)", "attachment"]],
};
function subtaskItemsFor(t: TaskTemplate, status: TaskRowData["status"], d: Date, person: string, time: string): TaskRowData["subtaskItems"] {
  if (!t.subtasks) return undefined;
  const names = SUBTASK_NAMES[t.key] ?? Array.from({ length: t.subtasks }, (_, i): [string, "check"] => [`Schritt ${i + 1}`, "check"]);
  return names.slice(0, t.subtasks).map(([title, proof], i) => {
    const fileIds = SUBTASK_FILES[t.key]?.[i] ?? [];
    return {
      id: `${t.key}-s${i}`, title, proof, done: status === "done",
      files: status === "done" && fileIds.length && proof !== "check" ? fileIds.map((id, k) => makeFile(id, d, plus(time, k), person, i * 10 + k)) : undefined,
    };
  });
}

const locOf = (person: string) => LOCATIONS.find((l) => l.id === PEOPLE.find((p) => p.label === person)?.location)?.label;

function makeRow(t: TaskTemplate, d: Date, extra: Partial<TaskRowData>, seed: number): TaskRowData {
  const [person, team] = t.people[seed % t.people.length];
  const status = extra.status ?? "open";
  const doneTime = extra.doneAt ?? plus(t.time || "12:00", 12);
  const fileIds = status === "done" && t.proof !== "check" && !t.subtasks ? TASK_FILES[t.key] ?? [] : [];
  return {
    id: `${t.key}-${d.toDateString()}`, title: t.title, high: t.high, tags: t.tags, proof: t.proof, person, team,
    location: t.loc ?? locOf(person), subtasks: t.subtasks,
    ...created(t),
    description: DESCRIPTIONS[t.key],
    doneBy: status === "done" ? person : undefined,
    subtaskItems: subtaskItemsFor(t, status, d, person, doneTime),
    files: fileIds.length ? fileIds.map((id, i) => makeFile(id, d, plus(doneTime, i * 2), person, i)) : undefined,
    recurring: t.weekday !== undefined || DAILY.includes(t),
    schedule: t.weekday !== undefined ? `Wöchentlich · ${WD.format(d)} ${t.time}` : DAILY.includes(t) ? `Täglich ${t.time}` : "Einmalig",
    due: { date: `${ddmm(d)}${String(d.getFullYear()).slice(2)}`, time: t.time }, status: "open", ...extra,
  };
}

/** tasks without a due date — never listed under a day, always in their own section "Ohne Fälligkeit" */
const NO_DUE: TaskTemplate[] = [
  { key: "nd1", title: "Lagerraum aufräumen", time: "", tags: ["Reinigung"], proof: "photo", people: [["Ana Grgic", "Küche"]] },
  { key: "nd2", title: "Speisekarte Herbst aktualisieren", time: "", tags: ["Service"], proof: "attachment", people: [["Kristina Barac", "Service"]] },
  { key: "nd3", title: "Notfallplan aktualisieren", high: true, time: "", tags: ["Schulung"], proof: "attachment", people: [["Florian Ade", "Küche"]] },
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
  const row = makeRow;

  for (let d = startOfDay(range.start); diffDays(d, range.end) >= 0; d = addDays(d, 1)) {
    const seed = d.getDate() + d.getMonth() * 31;
    const tasks: TaskRowData[] = [];
    DAILY.forEach((t, i) => tasks.push(row(t, d, occurrence(t, d, seed + i), seed + i)));
    for (const t of WEEKLY) if (d.getDay() === t.weekday) tasks.push(row(t, d, occurrence(t, d, seed), seed));
    for (const o of ONE_TIME) {
      if (!sameDay(addDays(startOfDay(TODAY), o.day), d)) continue;
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


export function taskFromRecent(r: RecentDone): TaskRowData {
  return detailTask({ title: r.title, date: addDays(startOfDay(TODAY), r.day), person: r.person, location: locLabel(r.location), status: "done", doneAt: r.time });
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

