import { useState } from "react";
import { FORMS } from "./formsData";
import { useTasks } from "./tasksStore";
import { Breadcrumb, Button, EmptyTasks, Icon, PageHeader, SearchField, StatusChip, TabBar, TaskRowMenu, type TaskRowData } from "@/design-system";

/* Formulare — first screen: all form templates as one list. A row opens the builder; "Neues Formular" starts an empty one. */


const GRID = "grid grid-cols-[minmax(240px,1fr)_72px_72px_120px_128px_112px_200px_40px] items-center gap-[var(--sp-space-4x)] px-[var(--sp-space-5x)]";
const n = (v: number) => (v ? String(v) : "–");

export function FormsList({ onOpen, onHome }: { onOpen: (id: string | null) => void; onHome?: () => void }) {
  const { openNewTask } = useTasks();
  // new task with this form as solution type (title + description taken from the form)
  const assign = (f: (typeof FORMS)[number]) => openNewTask(undefined, { title: f.name, description: f.description, form: { id: f.id, name: f.name } });
  // search works like on Aufgaben: type, press Enter (min. 3 characters), × clears
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [tooShort, setTooShort] = useState(false);
  const [tab, setTab] = useState("all");

  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").toLocaleLowerCase("de");
  const q = norm(query.trim());
  const applySearch = () => {
    const v = draft.trim();
    if (!v) { setQuery(""); setTooShort(false); return; }
    if (v.length < 3) { setTooShort(true); return; }
    setTooShort(false);
    setQuery(v);
  };
  const clearSearch = () => { setDraft(""); setQuery(""); setTooShort(false); };
  const shownQuery = query.trim().length > 40 ? `${query.trim().slice(0, 40)}…` : query.trim();

  // tab counts follow the search
  const found = FORMS.filter((f) => !q || [f.name, f.description].some((t) => norm(t).includes(q)));
  const pub = found.filter((f) => f.published).length;
  const shown = found.filter((f) => tab === "all" || (tab === "published") === f.published);

  return (
    <div className="flex flex-col gap-[var(--sp-space-5x)] p-[var(--sp-space-6x)] pb-[var(--sp-space-12x)]">
      <PageHeader
        title="Formulare"
        breadcrumb={<Breadcrumb items={[{ label: "Aufgaben Management", onClick: onHome }, { label: "Formulare" }]} />}
        description="Vorlagen, die Mitarbeitende in der App ausfüllen. Ein Formular wird als Lösungsart einer Aufgabe gewählt."
        primaryAction={<Button variant="primary" icon="plus" label="Neues Formular" onClick={() => onOpen(null)} />}
      />

      <TabBar
        label="Formulare nach Status"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: "Alle", count: found.length },
          { id: "published", label: "Veröffentlicht", count: pub },
          { id: "draft", label: "Entwurf", count: found.length - pub },
        ]}
      />

      {/* search field with its hint directly below it (same as Aufgaben) */}
      <div className="flex flex-col gap-[var(--sp-space-1x)] w-full min-w-[200px] max-w-[300px]">
        <SearchField
          value={draft}
          onChange={(v) => { setDraft(v); setTooShort(false); if (!v) setQuery(""); }}
          onEnter={applySearch}
          onClear={clearSearch}
          maxLength={40}
          clearLabel="Suche zurücksetzen"
          placeholder="Formulare durchsuchen"
          className="w-full"
        />
        {tooShort && <span role="alert" className="sp-text-small text-sp-danger-on-surface">Bitte mindestens 3 Zeichen eingeben und Enter drücken.</span>}
      </div>

      {!shown.length ? (
        <div className="flex justify-center py-[var(--sp-space-6x)]">
          <EmptyTasks
            title="Keine Formulare"
            text={q ? `Keine Formulare für „${shownQuery}“ gefunden.` : tab === "draft" ? "Es gibt keine Entwürfe." : "Keine Formulare gefunden."}
            action={q ? <Button variant="primary" label="Zurücksetzen" onClick={clearSearch} /> : undefined}
          />
        </div>
      ) : (
      <section className="flex flex-col bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-4x)]">
        <div className={`${GRID} h-10 border-0 border-b border-solid border-sp-border-line sp-text-small-medium text-sp-text-label`}>
          <span>Formular</span><span>Felder</span><span>Regeln</span><span>In Aufgaben</span><span>Status</span><span>Geändert</span><span /><span />
        </div>
        {shown.map((f) => (
          <div
            key={f.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(f.id)}
            onKeyDown={(e) => e.key === "Enter" && onOpen(f.id)}
            className={`${GRID} min-h-16 py-[var(--sp-space-3x)] cursor-pointer hover:bg-sp-surface-default border-0 border-b last:border-b-0 border-solid border-sp-border-line`}
          >
            <span className="flex items-center gap-[var(--sp-space-3x)] min-w-0">
              <span className="flex items-center justify-center shrink-0 w-9 h-9 rounded-[var(--sp-radius-3x)] bg-sp-info-fill-light">
                <Icon name="form" color="var(--sp-info-on-surface)" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="sp-text-medium text-sp-text-title truncate">{f.name}</span>
                <span className="sp-text-small text-sp-text-label truncate">{f.description || "Keine Beschreibung"}</span>
              </span>
            </span>
            <span className="sp-text-standard text-sp-text">{f.fields}</span>
            <span className="sp-text-standard text-sp-text">{n(f.rules)}</span>
            <span className="sp-text-standard text-sp-text">{f.tasks ? `${f.tasks} ${f.tasks === 1 ? "Aufgabe" : "Aufgaben"}` : "–"}</span>
            <span>{f.published ? <StatusChip tone="success" label="Veröffentlicht" /> : <StatusChip tone="info" label="Entwurf" />}</span>
            <span className="sp-text-standard text-sp-text-label">{f.changed}</span>
            <span onClick={(e) => e.stopPropagation()} className="flex justify-end">
              {f.published
                ? <Button variant="secondary" icon="checklist" label="Als Aufgabe zuweisen" onClick={() => assign(f)} />
                : <span className="sp-text-small text-sp-text-label">Erst veröffentlichen</span>}
            </span>
            <span onClick={(e) => e.stopPropagation()}>
              <TaskRowMenu task={{ title: f.name, status: "open" } as TaskRowData} actions={["edit", "copy", "delete"]} onAction={(a) => a === "edit" && onOpen(f.id)} />
            </span>
          </div>
        ))}
      </section>
      )}
    </div>
  );
}
