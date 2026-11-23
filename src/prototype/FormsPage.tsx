import { useEffect, useState } from "react";
import { FormsList } from "./FormsList";
import { Breadcrumb, Button, Checkbox, Icon, SegmentedControl, SelectField, StatusChip, TextField, Toast, SOLUTION, type IconName, type TaskProof } from "@/design-system";

/* Aufgaben Management › Formulare — create a form ("one list" builder).
   Every field is one row: title · answer type · unit · required. Rules sit directly under their field:
   "Wenn … dann diese Unteraufgaben erstellen" (old TMS model: Nummer = größer / kleiner / außerhalb von–bis,
   Kontrollkästchen = angehakt / nicht angehakt, Textbereich = no rules). Only the open field shows its rules,
   closed fields show a one-line summary. */

type FieldType = "text" | "number" | "checkbox";
type Cond = "gt" | "lt" | "outside" | "checked" | "unchecked";
interface Subtask { id: string; title: string; proof: TaskProof }
interface Rule { id: string; cond: Cond; a: string; b: string; subtasks: Subtask[] }
interface Field { id: string; type: FieldType; title: string; unit: string; required: boolean; rules: Rule[] }

const TYPES: Record<FieldType, { label: string; icon: IconName }> = {
  text: { label: "Textbereich", icon: "paragraph" },
  number: { label: "Nummer", icon: "number" },
  checkbox: { label: "Kontrollkästchen", icon: "checkbox_active" },
};
const TYPE_OPTIONS = (Object.keys(TYPES) as FieldType[]).map((id) => ({ id, label: TYPES[id].label }));
const NUM_CONDS: { id: Cond; label: string }[] = [
  { id: "gt", label: "größer als" },
  { id: "lt", label: "kleiner als" },
  { id: "outside", label: "außerhalb von – bis" },
];
const CHECK_CONDS: { id: Cond; label: string }[] = [
  { id: "unchecked", label: "nicht angehakt" },
  { id: "checked", label: "angehakt" },
];
const PROOF_OPTIONS = (Object.keys(SOLUTION) as TaskProof[]).map((id) => ({ id, label: SOLUTION[id].label }));

let seq = 0;
const uid = (p: string) => `${p}${++seq}`;
const newRule = (type: FieldType): Rule => ({
  id: uid("r"), cond: type === "checkbox" ? "unchecked" : "gt", a: "", b: "", subtasks: [{ id: uid("s"), title: "", proof: "check" }],
});
const newField = (type: FieldType): Field => ({ id: uid("f"), type, title: "", unit: "", required: true, rules: [] });

const condLabel = (r: Rule, unit: string) => {
  const u = unit ? ` ${unit}` : "";
  switch (r.cond) {
    case "gt": return `größer als ${r.a || "…"}${u}`;
    case "lt": return `kleiner als ${r.a || "…"}${u}`;
    case "outside": return `außerhalb von ${r.a || "…"} – ${r.b || "…"}${u}`;
    case "checked": return "angehakt";
    default: return "nicht angehakt";
  }
};
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/* does the rule fire for the answer given in the preview? */
const num = (s: string) => Number(s.replace(",", "."));
const fires = (r: Rule, answer: string | boolean | undefined) => {
  if (r.cond === "checked") return answer === true;
  if (r.cond === "unchecked") return answer !== true && answer !== undefined;
  if (typeof answer !== "string" || !answer.trim() || isNaN(num(answer))) return false;
  const v = num(answer);
  if (r.cond === "gt") return !!r.a && v > num(r.a);
  if (r.cond === "lt") return !!r.a && v < num(r.a);
  return !!r.a && !!r.b && (v < num(r.a) || v > num(r.b));
};

/* Vorschau: the form on the employee's phone (mobile app). The screen inside the frame is a placeholder until the
   mobile designers' screens arrive — then it is rebuilt to match them. Answers are not saved. */
function FormPreview({ name, description, fields }: { name: string; description: string; fields: Field[] }) {
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const set = (id: string, v: string | boolean) => setAnswers((a) => ({ ...a, [id]: v }));

  return (
    <div className="flex flex-col items-center gap-[var(--sp-space-4x)]">
      <div className="flex items-center gap-[var(--sp-space-2x)] sp-text-standard text-sp-text-label">
        <Icon name="eye" color="var(--sp-icon)" />
        So sehen Mitarbeitende das Formular in der App. Eingaben werden nicht gespeichert.
        <Button variant="tertiary" label="Zurücksetzen" onClick={() => setAnswers({})} />
      </div>

      {/* phone frame — 390 × 844 screen (iPhone size) */}
      <div className="p-[var(--sp-space-3x)] bg-sp-text-title rounded-[56px] shadow-[var(--sp-shadow-m)]">
        <div className="relative flex flex-col w-[390px] h-[844px] overflow-hidden bg-sp-surface-default rounded-[44px]">
          {/* status bar */}
          <div className="flex items-center justify-between h-12 px-[var(--sp-space-8x)] shrink-0 bg-sp-surface-raised sp-text-small-medium text-sp-text">
            <span>9:41</span>
            <span aria-hidden className="w-[120px] h-[30px] rounded-[var(--sp-radius-pill)] bg-sp-text-title" />
            <span className="flex items-center gap-[var(--sp-space-1x)]"><Icon name="battery" size={16} /></span>
          </div>
          {/* app bar */}
          <div className="flex items-center gap-[var(--sp-space-2x)] h-14 px-[var(--sp-space-3x)] shrink-0 bg-sp-surface-raised border-0 border-b border-solid border-sp-border-line">
            <Icon name="left" size={20} color="var(--sp-text)" />
            <span className="flex-1 min-w-0 truncate sp-text-large-medium text-sp-text-title">{name.trim() || "Neues Formular"}</span>
          </div>

          {/* screen content — placeholder until the designers' screens arrive */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-[var(--sp-space-4x)] p-[var(--sp-space-4x)]">
            {description.trim() && <p className="m-0 sp-text-standard text-sp-text-label">{description}</p>}
            {!fields.length && <span className="sp-text-standard text-sp-text-label">Das Formular hat noch keine Felder.</span>}
            {fields.map((f, i) => {
              const title = f.title.trim() || `Feld ${i + 1}`;
              const a = answers[f.id];
              return (
                <div key={f.id} className="flex flex-col gap-[var(--sp-space-2x)] p-[var(--sp-space-4x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-3x)]">
                  {f.type === "checkbox" ? (
                    <Checkbox checked={a === true} onChange={(v) => set(f.id, v)} label={title} />
                  ) : (
                    <>
                      <span className="sp-text-medium text-sp-text">{title}{f.required && <span className="text-sp-danger-on-surface"> *</span>}</span>
                      {f.type === "number" ? (
                        <TextField value={String(a ?? "")} onChange={(v) => set(f.id, v.replace(/[^\d,.-]/g, ""))} placeholder="Zahl eingeben" end={f.unit ? <span className="sp-text-standard text-sp-text-label">{f.unit}</span> : undefined} aria-label={title} />
                      ) : (
                        <TextField multiline rows={3} value={String(a ?? "")} onChange={(v) => set(f.id, v)} placeholder="Text eingeben" aria-label={title} />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* bottom action */}
          <div className="shrink-0 p-[var(--sp-space-4x)] pb-[var(--sp-space-8x)] bg-sp-surface-raised border-0 border-t border-solid border-sp-border-line">
            <Button variant="primary" label="Formular senden" className="w-full h-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* grid of a field row: drag · Nr. · title · type · unit · required · actions */
const GRID = "grid grid-cols-[16px_24px_minmax(160px,1fr)_minmax(150px,200px)_88px_56px_72px] items-center gap-x-[var(--sp-space-3x)] px-[var(--sp-space-4x)]";

const IconBtn = ({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
  >
    <Icon name={icon} color={danger ? "var(--sp-danger-on-surface)" : "var(--sp-icon)"} />
  </button>
);

export default function FormsPage({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const [open, setOpen] = useState<string | null | undefined>(undefined);
  const onHome = () => onNavigate?.("tasks/dashboard"); // breadcrumb "Aufgaben Management" → its Übersicht
  return open === undefined ? <FormsList onOpen={setOpen} onHome={onHome} /> : <FormBuilder key={open ?? "new"} onBack={() => setOpen(undefined)} onHome={onHome} />;
}

function FormBuilder({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>(() => [newField("checkbox")]);
  const [openId, setOpenId] = useState<string | null>(() => fields[0]?.id ?? null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [mode, setMode] = useState("edit");

  // every change is saved as a draft ("Gespeichert hh:mm")
  const touch = () => { setSavedAt(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })); setPublished(false); };
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const update = (id: string, patch: Partial<Field>) => { setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f))); touch(); };
  const updateRule = (fid: string, rid: string, patch: Partial<Rule>) =>
    setFields((fs) => fs.map((f) => (f.id !== fid ? f : { ...f, rules: f.rules.map((r) => (r.id === rid ? { ...r, ...patch } : r)) })));
  const changeRule = (f: Field, rid: string, patch: Partial<Rule>) => { updateRule(f.id, rid, patch); touch(); };

  const addField = (type: FieldType) => { const f = newField(type); setFields((fs) => [...fs, f]); setOpenId(f.id); touch(); };
  const copyField = (f: Field) => {
    const c: Field = { ...f, id: uid("f"), title: f.title ? `${f.title} (Kopie)` : "", rules: f.rules.map((r) => ({ ...r, id: uid("r"), subtasks: r.subtasks.map((s) => ({ ...s, id: uid("s") })) })) };
    setFields((fs) => { const i = fs.findIndex((x) => x.id === f.id); return [...fs.slice(0, i + 1), c, ...fs.slice(i + 1)]; });
    setOpenId(c.id); touch();
  };
  const deleteField = (id: string) => { setFields((fs) => fs.filter((f) => f.id !== id)); if (openId === id) setOpenId(null); touch(); };
  const changeType = (f: Field, type: FieldType) =>
    // rules depend on the type: a new type starts without rules
    update(f.id, { type, unit: type === "number" ? f.unit : "", rules: [] });
  const move = (from: string, to: string) => {
    if (from === to) return;
    // dropped on a row: the dragged field takes that row's place
    setFields((fs) => {
      const to_ = fs.findIndex((f) => f.id === to);
      const a = fs.filter((f) => f.id !== from);
      a.splice(to_, 0, fs.find((f) => f.id === from)!);
      return a;
    });
    touch();
  };

  // publish: name and every field title are required, a number rule needs its value(s), a subtask its title
  const ruleInvalid = (f: Field, r: Rule) =>
    (f.type === "number" && (!r.a.trim() || (r.cond === "outside" && !r.b.trim()))) || r.subtasks.some((s) => !s.title.trim()) || !r.subtasks.length;
  const errors = [
    !name.trim(),
    !fields.length,
    ...fields.map((f) => !f.title.trim() || f.rules.some((r) => ruleInvalid(f, r))),
  ].filter(Boolean).length;
  const publish = () => {
    setTried(true);
    if (errors) {
      setMode("edit");
      const bad = fields.find((f) => !f.title.trim() || f.rules.some((r) => ruleInvalid(f, r)));
      if (bad) setOpenId(bad.id);
      return;
    }
    setPublished(true);
    setToast(`Formular „${name.trim()}“ wurde veröffentlicht.`);
  };

  const rulesCount = fields.reduce((n, f) => n + f.rules.length, 0);
  const subCount = fields.reduce((n, f) => n + f.rules.reduce((m, r) => m + r.subtasks.length, 0), 0);

  return (
    <div className="flex flex-col gap-[var(--sp-space-5x)] p-[var(--sp-space-6x)] pb-[var(--sp-space-12x)]">
      {/* header on the plain page background: breadcrumb (SP3 Inline) above the title row */}
      <div className="flex flex-col gap-[var(--sp-space-2x)]">
      <Breadcrumb items={[{ label: "Aufgaben Management", onClick: onHome }, { label: "Formulare", onClick: onBack }, { label: name.trim() || "Neues Formular" }]} />
      <div className="flex flex-wrap items-center gap-[var(--sp-space-3x)] min-h-8">
        <h1 className="sp-title-h1 m-0 text-sp-text-title truncate">{name.trim() || "Neues Formular"}</h1>
        {published ? <StatusChip tone="success" label="Veröffentlicht" /> : <StatusChip tone="info" label="Entwurf" />}
        <span className="flex-1" />
        <SegmentedControl
          label="Ansicht"
          options={[{ id: "edit", label: "Bearbeiten", icon: "edit" }, { id: "preview", label: "Vorschau", icon: "eye" }]}
          value={mode}
          onChange={setMode}
        />
        {savedAt && <span className="sp-text-small text-sp-text-label">Gespeichert {savedAt}</span>}
        <Button variant="primary" label="Veröffentlichen" onClick={publish} />
      </div>
      </div>

      {mode === "preview" ? <FormPreview name={name} description={description} fields={fields} /> : (<>
      {tried && errors > 0 && (
        <div role="alert" className="flex items-center gap-[var(--sp-space-2x)] p-[var(--sp-space-3x)] bg-sp-danger-fill-light border border-solid border-sp-danger-border-light rounded-[var(--sp-radius-3x)] sp-text-standard text-sp-text">
          <Icon name="warning" color="var(--sp-danger-on-surface)" />
          Bitte füllen Sie alle markierten Pflichtfelder aus.
        </div>
      )}

      {/* name + description */}
      <section className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-[var(--sp-space-4x)] p-[var(--sp-space-5x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-4x)]">
        <label className="flex flex-col gap-[var(--sp-space-1x)]">
          <span className="sp-text-small-medium text-sp-text">Name des Formulars <span className="text-sp-danger-on-surface">*</span></span>
          <TextField value={name} onChange={(v) => { setName(v); touch(); }} placeholder="z. B. Kühlraum-Temperatur prüfen" invalid={tried && !name.trim()} maxLength={80} aria-label="Name des Formulars" />
        </label>
        <label className="flex flex-col gap-[var(--sp-space-1x)]">
          <span className="sp-text-small-medium text-sp-text">Beschreibung</span>
          <TextField value={description} onChange={(v) => { setDescription(v); touch(); }} placeholder="Wofür ist das Formular? (optional)" maxLength={200} aria-label="Beschreibung" />
        </label>
      </section>

      {/* the form as one list */}
      <section className="flex flex-col bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-4x)]">
        <div className={`${GRID} h-10 border-0 border-b border-solid border-sp-border-line sp-text-small-medium text-sp-text-label`}>
          <span /><span>Nr.</span><span>Was soll ausgefüllt werden?</span><span>Antworttyp</span><span>Einheit</span><span className="text-center">Pflicht</span>
          <span className="text-right">{fields.length ? `${plural(rulesCount, "Regel", "Regeln")}` : ""}</span>
        </div>

        {fields.map((f, i) => {
          const open = openId === f.id;
          const canRule = f.type !== "text";
          return (
            <div
              key={f.id}
              onDragOver={(e) => { if (dragId) e.preventDefault(); }}
              onDrop={() => { if (dragId) move(dragId, f.id); setDragId(null); }}
              className={`flex flex-col border-0 border-b border-solid border-sp-neutral-fill-light ${open ? "bg-sp-surface-default" : ""} ${dragId === f.id ? "opacity-50" : ""}`}
            >
              <div className={`${GRID} min-h-[60px] cursor-pointer`} onClick={() => setOpenId(f.id)}>
                <span
                  draggable
                  onDragStart={() => setDragId(f.id)}
                  onDragEnd={() => setDragId(null)}
                  title="Ziehen zum Sortieren"
                  className="flex cursor-grab"
                >
                  <Icon name="dragger" color="var(--sp-icon)" />
                </span>
                <span className="sp-text-medium text-sp-text-label tabular-nums">{i + 1}</span>
                <TextField
                  value={f.title}
                  onChange={(v) => update(f.id, { title: v })}
                  placeholder={f.type === "checkbox" ? "z. B. Tür richtig geschlossen" : f.type === "number" ? "z. B. Temperatur Kühlraum 1" : "z. B. Bemerkung"}
                  invalid={tried && !f.title.trim()}
                  maxLength={120}
                  aria-label={`Feld ${i + 1}: Titel`}
                />
                <div onClick={(e) => e.stopPropagation()}>
                  <SelectField options={TYPE_OPTIONS} value={f.type} onChange={(t) => { changeType(f, t); setOpenId(f.id); }} aria-label={`Feld ${i + 1}: Antworttyp`} />
                </div>
                {f.type === "number"
                  ? <TextField value={f.unit} onChange={(v) => update(f.id, { unit: v })} placeholder="°C" maxLength={10} className="!min-w-0" aria-label={`Feld ${i + 1}: Einheit`} />
                  : <span className="sp-text-standard text-sp-text-placeholder pl-[var(--sp-space-2x)]">–</span>}
                <span className="flex justify-center">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={f.required}
                    aria-label={`Feld ${i + 1}: Pflichtfeld`}
                    onClick={(e) => { e.stopPropagation(); update(f.id, { required: !f.required }); }}
                    className="flex items-center justify-center size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
                  >
                    <Icon size={24} name={f.required ? "checkbox_active_filled" : "checkbox"} color={f.required ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />
                  </button>
                </span>
                <span className="flex justify-end">
                  <IconBtn icon="copy" label="Feld kopieren" onClick={() => copyField(f)} />
                  <IconBtn icon="delete" label="Feld löschen" onClick={() => deleteField(f.id)} />
                </span>
              </div>

              {/* closed: one-line rule summary */}
              {!open && f.rules.length > 0 && (
                <div className="ml-[88px] mb-[var(--sp-space-3x)]">
                  <button
                    type="button"
                    onClick={() => setOpenId(f.id)}
                    className="inline-flex items-center gap-[var(--sp-space-1x)] h-7 px-[var(--sp-space-2x)] border-0 bg-sp-info-fill-light rounded-[var(--sp-radius-pill)] cursor-pointer sp-interactive sp-text-small-medium text-sp-info-on-surface"
                  >
                    <Icon name="lightning" color="var(--sp-info-on-surface)" />
                    {plural(f.rules.length, "Regel", "Regeln")} · Wenn {condLabel(f.rules[0], f.unit)} → {plural(f.rules[0].subtasks.length, "Unteraufgabe", "Unteraufgaben")}{f.rules.length > 1 ? " …" : ""}
                    <Icon name="expanded" color="var(--sp-info-on-surface)" />
                  </button>
                </div>
              )}

              {/* open: the rules of this field */}
              {open && canRule && (
                <div className="flex flex-col gap-[var(--sp-space-3x)] ml-[88px] mr-[var(--sp-space-4x)] mb-[var(--sp-space-4x)]">
                  {f.rules.map((r) => {
                    const bad = tried && ruleInvalid(f, r);
                    return (
                      <div key={r.id} className={`flex flex-col gap-[var(--sp-space-3x)] p-[var(--sp-space-4x)] bg-sp-surface-raised border border-solid ${bad ? "border-sp-danger-on-surface" : "border-sp-border-line"} border-l-4 border-l-sp-info-border-normal rounded-[var(--sp-radius-3x)]`}>
                        <div className="flex flex-wrap items-center gap-[var(--sp-space-2x)] sp-text-standard text-sp-text">
                          <span className="sp-text-medium">Wenn</span>
                          {f.type === "number" ? (
                            <>
                              <span>der Wert</span>
                              <div className="w-[180px]"><SelectField options={NUM_CONDS} value={r.cond} onChange={(c) => changeRule(f, r.id, { cond: c })} aria-label="Bedingung" /></div>
                              <TextField value={r.a} onChange={(v) => changeRule(f, r.id, { a: v.replace(/[^\d,.-]/g, "") })} placeholder={r.cond === "outside" ? "von" : "Wert"} invalid={tried && !r.a.trim()} className="!min-w-0 w-[72px]" aria-label="Wert" />
                              {r.cond === "outside" && <>
                                <span>–</span>
                                <TextField value={r.b} onChange={(v) => changeRule(f, r.id, { b: v.replace(/[^\d,.-]/g, "") })} placeholder="bis" invalid={tried && !r.b.trim()} className="!min-w-0 w-[72px]" aria-label="Wert bis" />
                              </>}
                              <span>{f.unit ? `${f.unit} ist,` : "ist,"}</span>
                            </>
                          ) : (
                            <>
                              <span>das Kästchen</span>
                              <div className="w-[180px]"><SelectField options={CHECK_CONDS} value={r.cond} onChange={(c) => changeRule(f, r.id, { cond: c })} aria-label="Bedingung" /></div>
                              <span>ist,</span>
                            </>
                          )}
                          <span className="sp-text-medium">dann diese Unteraufgaben erstellen:</span>
                          <span className="flex-1" />
                          <IconBtn icon="delete" label="Regel löschen" onClick={() => update(f.id, { rules: f.rules.filter((x) => x.id !== r.id) })} />
                        </div>
                        <div className="flex flex-col gap-[var(--sp-space-2x)]">
                          {r.subtasks.map((s) => (
                            <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_160px_32px] items-center gap-[var(--sp-space-2x)]">
                              <TextField
                                value={s.title}
                                onChange={(v) => changeRule(f, r.id, { subtasks: r.subtasks.map((x) => (x.id === s.id ? { ...x, title: v } : x)) })}
                                placeholder="z. B. Tür prüfen"
                                invalid={tried && !s.title.trim()}
                                maxLength={120}
                                aria-label="Unteraufgabe"
                              />
                              <SelectField options={PROOF_OPTIONS} value={s.proof} onChange={(p) => changeRule(f, r.id, { subtasks: r.subtasks.map((x) => (x.id === s.id ? { ...x, proof: p } : x)) })} aria-label="Lösungsart" />
                              <IconBtn icon="close" label="Unteraufgabe entfernen" onClick={() => changeRule(f, r.id, { subtasks: r.subtasks.filter((x) => x.id !== s.id) })} />
                            </div>
                          ))}
                        </div>
                        <span>
                          <Button variant="tertiary" icon="plus" label="Unteraufgabe hinzufügen" onClick={() => changeRule(f, r.id, { subtasks: [...r.subtasks, { id: uid("s"), title: "", proof: "check" }] })} />
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-[var(--sp-space-2x)]">
                    <Button variant="tertiary" icon="plus" label="Regel hinzufügen" onClick={() => update(f.id, { rules: [...f.rules, newRule(f.type)] })} />
                    <span className="sp-text-standard text-sp-text-label">
                      {f.type === "number" ? "Was soll passieren, wenn der Wert nicht passt?" : "Was soll passieren, wenn das Kästchen (nicht) angehakt ist?"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!fields.length && (
          <div className="flex flex-col items-center gap-[var(--sp-space-1x)] p-[var(--sp-space-8x)] text-center">
            <span className="sp-text-medium text-sp-text">Noch keine Felder</span>
            <span className={`sp-text-standard ${tried ? "text-sp-danger-on-surface" : "text-sp-text-label"}`}>Fügen Sie unten das erste Feld hinzu.</span>
          </div>
        )}

        {/* one click per type */}
        <div className="flex flex-wrap items-center gap-[var(--sp-space-3x)] p-[var(--sp-space-4x)]">
          <span className="sp-text-medium text-sp-text">Feld hinzufügen:</span>
          {(Object.keys(TYPES) as FieldType[]).map((t) => (
            <Button key={t} variant="secondary" icon={TYPES[t].icon} label={TYPES[t].label} onClick={() => addField(t)} />
          ))}
          <span className="flex-1" />
          {subCount > 0 && <span className="sp-text-small text-sp-text-label">{plural(fields.length, "Feld", "Felder")} · {plural(rulesCount, "Regel", "Regeln")} · {plural(subCount, "Unteraufgabe", "Unteraufgaben")}</span>}
        </div>
      </section>
      </>)}

      {toast && (
        <div className="fixed bottom-[var(--sp-space-6x)] left-1/2 -translate-x-1/2 z-50">
          <Toast message={toast} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
