import type { ShiftColor, TaskRowData, TreeLocation } from "@/design-system";
import { LOCATIONS, PEOPLE, SHIFTS, SUBTASK_NAMES, TODAY } from "./data";

/** Bibliothek = every task template that was ever created (not a day's occurrence). */
export type Frequency = "daily" | "weekly" | "monthly" | "yearly" | "once";

export const FREQUENCIES: { id: Exclude<Frequency, "once">; label: string }[] = [
  { id: "daily", label: "Täglich" },
  { id: "weekly", label: "Wöchentlich" },
  { id: "monthly", label: "Monatlich" },
  { id: "yearly", label: "Jährlich" },
];
export const FREQ_LABEL: Record<Frequency, string> = { daily: "Täglich", weekly: "Wöchentlich", monthly: "Monatlich", yearly: "Jährlich", once: "Einmalig" };

/* ─── filter tree: Standort → Gruppe → Schicht / Mitarbeiter ─── */

/** keys — shifts tree: `loc:<id>` · `grp:<loc>:<group>` · `shift:<id>`; employees tree: `eloc:<id>` · `egrp:<loc>:<group>` · `emp:<id>` */
export function buildTree(kind: "shift" | "employee"): TreeLocation[] {
  const p = kind === "shift" ? "" : "e";
  return LOCATIONS.map((l) => {
    const entries = kind === "shift"
      ? SHIFTS.filter((s) => s.location === l.id).map((s) => ({ group: s.group, item: { key: `shift:${s.id}`, label: s.label, shift: { code: s.code, time: s.time, color: s.color } } }))
      : PEOPLE.filter((x) => x.location === l.id).map((x) => ({ group: x.team, item: { key: `emp:${x.id}`, label: x.label } }));
    const groups = [...new Set(entries.map((e) => e.group))].sort((a, b) => a.localeCompare(b, "de"));
    return {
      key: `${p}loc:${l.id}`, label: l.label,
      groups: groups.map((g) => ({ key: `${p}grp:${l.id}:${g}`, label: g, items: entries.filter((e) => e.group === g).map((e) => e.item) })),
    };
  }).filter((l) => l.groups.length);
}

/* ─── the templates ─── */

type Recv = ["person", string] | ["shift", string] | ["team", string, string]; // team: location id, group
interface LibDef {
  key: string; title: string; freq: Frequency; when: string; recv: Recv; proof: TaskRowData["proof"];
  tags: string[]; high?: boolean; description: string; subtasks?: number; by: string; created: string;
}

const DEFS: LibDef[] = [
  { key: "l1", title: "Shop öffnen & Kasse einrichten", freq: "daily", when: "05:30", recv: ["shift", "s3"], proof: "check", tags: ["Kasse", "Service"], by: "Michael Potsch", created: "12.01.26, 09:10",
    description: "Shop aufschließen, Kasse mit Wechselgeld einrichten, Kaffeemaschine und Backstation einschalten." },
  { key: "l2", title: "Kassenabschluss (Z-Bon)", freq: "daily", when: "22:00", recv: ["shift", "s5"], proof: "attachment", tags: ["Kasse"], high: true, by: "Anna Müller", created: "12.01.26, 09:25",
    description: "Tagesabschluss der Kasse erstellen und den Z-Bon hochladen. Kassendifferenzen sofort melden." },
  { key: "l3", title: "Zapfsäulen & Tankplatz kontrollieren", freq: "daily", when: "06:30", recv: ["shift", "s6"], proof: "photo", tags: ["Sicherheit", "Reinigung"], high: true, by: "Michael Potsch", created: "14.01.26, 08:40",
    description: "Zapfsäulen, Tankplatz und Ölbinder kontrollieren und ein Foto der Zapfsäulen machen." },
  { key: "l4", title: "Kühlhaus-Temperatur prüfen – morgens", freq: "daily", when: "06:30", recv: ["shift", "s1"], proof: "attachment", tags: ["HACCP"], high: true, by: "Kristina Barac", created: "20.01.26, 10:05",
    description: "Temperatur im Kühlhaus messen und das Protokoll hochladen. Abweichungen über 7 °C sofort melden." },
  { key: "l5", title: "Terrasse öffnen", freq: "daily", when: "10:30", recv: ["shift", "s7"], proof: "check", tags: ["Service"], by: "Kristina Barac", created: "03.02.26, 11:30",
    description: "Terrasse aufschließen, Tische und Stühle stellen, Sonnenschirme öffnen und Heizpilze prüfen." },
  { key: "l6", title: "Milchlieferung: Lieferschein ablegen", freq: "daily", when: "07:00", recv: ["person", "p3"], proof: "attachment", tags: ["Wareneingang"], by: "Anna Müller", created: "10.02.26, 15:20",
    description: "Milchlieferung kontrollieren (Kühlkette) und den Lieferschein ablegen." },
  { key: "l7", title: "Kaffeemaschine entkalken", freq: "weekly", when: "Mo 22:30", recv: ["person", "p6"], proof: "check", tags: ["Reinigung", "HACCP", "Pflicht", "Wartung", "Technik"], subtasks: 5, by: "Michael Potsch", created: "17.02.26, 16:45",
    description: "Kaffeemaschine entkalken, Brühgruppe reinigen und einen Probelauf durchführen." },
  { key: "l8", title: "Frittieröl prüfen (Testprotokoll)", freq: "weekly", when: "Fr 14:30", recv: ["person", "p4"], proof: "attachment", tags: ["HACCP"], by: "Anna Müller", created: "24.02.26, 08:15",
    description: "Ölqualität der Fritteusen messen und das Testprotokoll hochladen." },
  { key: "l9", title: "Wochenend-Grundreinigung Restaurant", freq: "weekly", when: "So 06:15", recv: ["team", "muenchen", "Reinigung"], proof: "check", tags: ["Reinigung", "HACCP"], subtasks: 5, by: "Kristina Barac", created: "02.03.26, 12:00",
    description: "Gastraum und Küche gründlich reinigen, mit Fotos und Reinigungsnachweis dokumentieren." },
  { key: "l10", title: "Getränke-Inventur Bar", freq: "monthly", when: "letzter Tag 22:00", recv: ["person", "p3"], proof: "attachment", tags: ["Inventur"], by: "Michael Potsch", created: "09.03.26, 17:30",
    description: "Bestand an der Bar zählen und die Inventurliste hochladen." },
  { key: "l11", title: "Feuerlöscher-Prüfung", freq: "monthly", when: "1. des Monats 09:00", recv: ["team", "frankfurt", "Reinigung"], proof: "photo", tags: ["Sicherheit"], by: "Anna Müller", created: "16.03.26, 09:50",
    description: "Alle Feuerlöscher auf Plombe und Prüfplakette kontrollieren und ein Foto der Plakette machen." },
  { key: "l12", title: "Monatliche Grundreinigung Lager", freq: "monthly", when: "15. des Monats 15:00", recv: ["shift", "s8"], proof: "photo", tags: ["Reinigung"], by: "Kristina Barac", created: "23.03.26, 13:10",
    description: "Lagerraum aufräumen, Regale beschriften und abgelaufene Ware aussortieren. Foto vom aufgeräumten Lager." },
  { key: "l13", title: "Hygieneschulung: Teilnahmebescheinigung hochladen", freq: "yearly", when: "1. März", recv: ["team", "hamburg", "Küche"], proof: "attachment", tags: ["Schulung"], by: "Michael Potsch", created: "30.03.26, 10:00",
    description: "Hygieneschulung abschließen und die Teilnahmebescheinigung hochladen." },
  { key: "l14", title: "Notfallplan aktualisieren", freq: "yearly", when: "1. Januar", recv: ["person", "p2"], proof: "attachment", tags: ["Schulung", "Sicherheit"], high: true, by: "Anna Müller", created: "06.04.26, 14:35",
    description: "Notfallplan auf Aktualität prüfen, Kontaktliste erneuern und den neuen Plan hochladen." },
  { key: "l15", title: "Speisekarte Herbst aktualisieren", freq: "once", when: "ohne Wiederholung", recv: ["person", "p7"], proof: "attachment", tags: ["Service"], by: "Kristina Barac", created: "13.04.26, 11:05",
    description: "Speisekarte für den Herbst aktualisieren und neue Preise eintragen. Entwurf hochladen." },
  { key: "l16", title: "Einweisung Fluchtwege: Unterschriftenliste", freq: "once", when: "ohne Wiederholung", recv: ["shift", "s7"], proof: "attachment", tags: ["Schulung"], by: "Michael Potsch", created: "20.04.26, 16:00",
    description: "Mitarbeitende über Fluchtwege und Sammelplätze einweisen und die Unterschriftenliste hochladen." },
];

const pad = (n: number) => String(n).padStart(2, "0");
const label = (id: string) => LOCATIONS.find((l) => l.id === id)?.label ?? id;

/** library entries as TaskRowData (library = true: the detail shows no status / due date) */
export function libraryTasks(): TaskRowData[] {
  const today = `${pad(TODAY.getDate())}.${pad(TODAY.getMonth() + 1)}.${String(TODAY.getFullYear()).slice(2)}`;
  return DEFS.map((d) => {
    let name = "", group = "", locationId = "", id = "", code: string | undefined, time: string | undefined, color: ShiftColor | undefined;
    let kind: "person" | "shift" | "team" = d.recv[0];
    if (d.recv[0] === "person") { const p = PEOPLE.find((x) => x.id === d.recv[1])!; name = p.label; group = p.team; locationId = p.location; id = p.id; }
    else if (d.recv[0] === "shift") { const s = SHIFTS.find((x) => x.id === d.recv[1])!; name = s.label; group = s.group; locationId = s.location; id = s.id; code = s.code; time = s.time; color = s.color; }
    else { locationId = d.recv[1]; group = d.recv[2]; name = `Gruppe ${group}`; id = `${locationId}:${group}`; kind = "team"; }
    const names = SUBTASK_NAMES[d.key === "l7" ? "ccm" : "wgr"];
    const subtaskItems = d.subtasks ? Array.from({ length: d.subtasks }, (_, i) => ({ id: `${d.key}-s${i}`, title: names?.[i]?.[0] ?? `Schritt ${i + 1}`, proof: names?.[i]?.[1] ?? ("check" as const) })) : undefined;
    return {
      id: `lib-${d.key}`, title: d.title, high: d.high, tags: d.tags, proof: d.proof,
      person: name, team: group, location: label(locationId),
      receiver: { kind, id, group, locationId, code, time, color },
      library: true, frequency: d.freq,
      recurring: d.freq !== "once", schedule: d.freq === "once" ? "Einmalig" : `${FREQ_LABEL[d.freq]} · ${d.when}`,
      description: d.description, createdBy: d.by, createdAt: d.created, subtasks: d.subtasks, subtaskItems,
      due: { date: today, time: /^\d{2}:\d{2}/.test(d.when) ? d.when.slice(0, 5) : /\d{2}:\d{2}$/.test(d.when) ? d.when.slice(-5) : "09:00" },
      status: "open",
    } satisfies TaskRowData;
  });
}

/** keys of a library task in the filter tree */
/** shift / employee selection + frequencies → does the template pass? (empty selection = no filter) */
export function matchesLibraryFilter(t: TaskRowData, sel: ReadonlySet<string>, freq: ReadonlySet<string>) {
  if (freq.size && !(t.frequency && freq.has(t.frequency))) return false;
  const people = [...sel].some((k) => /^(shift|emp):/.test(k));
  if (!people) return true;
  const r = t.receiver;
  if (!r) return false;
  if (r.kind === "shift") return sel.has(`shift:${r.id}`);
  if (r.kind === "person") return sel.has(`emp:${r.id}`);
  return sel.has(`grp:${r.locationId}:${r.group}`) || sel.has(`egrp:${r.locationId}:${r.group}`);
}
