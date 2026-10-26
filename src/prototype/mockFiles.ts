import type { TaskFile } from "@/design-system";

/** Files the "employees" attached in the mock data — real viewable files in `public/mock/` (PDFs + illustrated photos). */
interface FileDef { url: string; kind: TaskFile["kind"]; label: string; size: number }

const pdf = (id: string, label: string, kb: number): [string, FileDef] => [id, { url: `/mock/${id}.pdf`, kind: "pdf", label, size: kb * 1024 }];
const img = (id: string, mb: number): [string, FileDef] => [id, { url: `/mock/${id}.svg`, kind: "image", label: "IMG", size: Math.round(mb * 1048576) }];

export const FILE_DEFS: Record<string, FileDef> = Object.fromEntries([
  pdf("z-bon", "Z-Bon_Tagesabschluss", 86),
  pdf("lieferschein-backwaren", "Lieferschein_Backwaren", 142),
  pdf("lieferschein-getraenke", "Lieferschein_Getränke", 118),
  pdf("lieferschein-milch", "Lieferschein_Milch", 97),
  pdf("temperaturprotokoll", "Temperaturprotokoll_Kühlhaus", 64),
  pdf("inventur-bar", "Inventurliste_Bar", 73),
  pdf("teilnahmebescheinigung", "Teilnahmebescheinigung_Hygiene", 58),
  pdf("unterschriftenliste", "Unterschriftenliste_Fluchtwege", 201),
  pdf("oel-testprotokoll", "Öl-Testprotokoll", 52),
  pdf("messprotokoll", "Messprotokoll_Thermostat", 47),
  pdf("probelauf", "Probelauf_Kaffeemaschine", 44),
  pdf("speisekarte", "Speisekarte_Herbst_Entwurf", 312),
  pdf("notfallplan", "Notfallplan_aktuell", 267),
  img("foto-zapfsaeulen", 2.4), img("foto-wc", 1.9), img("foto-gastraum", 2.2), img("foto-vitrine", 2.7), img("foto-waschstrasse", 2.1),
  img("foto-bar", 2.5), img("foto-allergen", 1.8), img("foto-lager", 2.3), img("foto-fritteuse", 2.6), img("foto-siebtraeger", 2.0),
]);

/** which file(s) a done task of this template has */
export const TASK_FILES: Record<string, string[]> = {
  zap: ["foto-zapfsaeulen"], bak: ["lieferschein-backwaren"], wsh: ["foto-waschstrasse"], kas: ["z-bon"],
  kk1: ["temperaturprotokoll"], kk2: ["temperaturprotokoll"], all: ["foto-allergen"], gas: ["foto-gastraum"], get: ["lieferschein-getraenke"],
  vit: ["foto-vitrine"], mil: ["lieferschein-milch"], bar: ["foto-bar"], oel: ["oel-testprotokoll"],
  ht: ["teilnahmebescheinigung"], bic: ["inventur-bar"], erb: ["unterschriftenliste"], nd1: ["foto-lager"], nd2: ["speisekarte"], nd3: ["notfallplan"],
};

/** file of the subtasks that need a photo / attachment: template key → subtask index → file id */
export const SUBTASK_FILES: Record<string, Record<number, string>> = {
  wcf: { 3: "foto-wc" },
  ccm: { 1: "foto-siebtraeger", 4: "probelauf" },
  dcf: { 1: "foto-fritteuse", 2: "foto-fritteuse", 5: "messprotokoll" },
};

const pad = (n: number) => String(n).padStart(2, "0");

/** The TaskFile of a file id, taken by `by` on the day `d` at `time` ("06:34") */
export function makeFile(fileId: string, d: Date, time: string, by: string, n = 0): TaskFile {
  const def = FILE_DEFS[fileId];
  const hhmm = time.replace(":", "");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const name = def.kind === "pdf" ? `${def.label}_${pad(d.getDate())}-${pad(d.getMonth() + 1)}.pdf` : `IMG_${stamp}_${hhmm}${n ? `_${n}` : ""}.jpg`;
  return {
    id: `${fileId}-${stamp}-${n}`, name, size: def.size, kind: def.kind, url: def.url, by,
    at: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}, ${time}`,
  };
}
