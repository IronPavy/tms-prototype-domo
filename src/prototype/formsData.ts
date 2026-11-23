/* Form templates of the prototype (Formulare list + the "Formular" solution type of a task). */

export interface FormItem { id: string; name: string; description: string; fields: number; rules: number; tasks: number; published: boolean; changed: string }

export const FORMS: FormItem[] = [
  { id: "f1", name: "Kühlraum-Temperatur prüfen", description: "Beide Kühlräume prüfen – bei falscher Temperatur entstehen Unteraufgaben.", fields: 4, rules: 3, tasks: 3, published: true, changed: "12.11.2026" },
  { id: "f2", name: "Kaffeemaschine reinigen", description: "Brühgruppe, Milchsystem, Entkalken", fields: 5, rules: 2, tasks: 1, published: true, changed: "10.11.2026" },
  { id: "f3", name: "Wareneingang prüfen", description: "Lieferschein, Temperatur und Zustand der Ware", fields: 6, rules: 2, tasks: 2, published: true, changed: "04.11.2026" },
  { id: "f4", name: "Schadensmeldung", description: "Defekte Geräte oder Schäden melden", fields: 3, rules: 0, tasks: 0, published: true, changed: "28.10.2026" },
  { id: "f5", name: "Kassenabschluss", description: "", fields: 4, rules: 0, tasks: 0, published: false, changed: "16.11.2026" },
  { id: "f6", name: "Hygienekontrolle Küche", description: "Arbeitsflächen, Böden, Abfall", fields: 2, rules: 1, tasks: 0, published: false, changed: "15.11.2026" },
];

