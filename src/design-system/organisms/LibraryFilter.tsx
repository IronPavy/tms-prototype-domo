import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "../atoms/Button";
import { Checkbox } from "../atoms/Checkbox";
import { Icon } from "../atoms/Icon";
import { Popover } from "../molecules/Popover";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { ShiftPill, type ShiftColor } from "../molecules/ShiftPill";

export interface TreeItem { key: string; label: string; /** shift: starting letters + working hours → pill */ shift?: { code: string; time: string; color?: ShiftColor } }
export interface TreeGroup { key: string; label: string; items: TreeItem[] }
export interface TreeLocation { key: string; label: string; groups: TreeGroup[] }

export interface LibraryFilterValue {
  /** ticked keys of both trees (shifts / employees) */
  selected: string[];
  /** ticked frequencies ("daily" …) */
  freq: string[];
}

export interface LibraryFilterProps {
  shifts: TreeLocation[];
  employees: TreeLocation[];
  frequencies: { id: string; label: string }[];
  value: LibraryFilterValue;
  /** "Anwenden" */
  onApply: (value: LibraryFilterValue) => void;
}

/** every key at or below a node (the node itself first) */
const below = (n: TreeLocation | TreeGroup | TreeItem): string[] =>
  "groups" in n ? [n.key, ...n.groups.flatMap(below)] : "items" in n ? [n.key, ...n.items.map((i) => i.key)] : [n.key];

/** group / location keys are ticked exactly when everything below them is ticked */
function normalize(sel: Set<string>, tree: TreeLocation[]) {
  for (const l of tree) {
    for (const g of l.groups) (g.items.every((i) => sel.has(i.key)) ? sel.add(g.key) : sel.delete(g.key));
    (l.groups.every((g) => sel.has(g.key)) ? sel.add(l.key) : sel.delete(l.key));
  }
  return sel;
}

function Tree({ tree, sel, onToggle }: { tree: TreeLocation[]; sel: Set<string>; onToggle: (node: TreeLocation | TreeGroup | TreeItem, tree: TreeLocation[]) => void }) {
  // one flat list (one row below another, no indentation — icons show the level); every Standort is its own card, groups are separated by a light divider; everything starts CLOSED, the user unfolds what he needs; a click on a row's text, white space or arrow folds / unfolds it
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const flip = (k: string) => setOpened((o) => { const n = new Set(o); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const state = (n: TreeLocation | TreeGroup | TreeItem) => {
    const keys = below(n);
    const checked = sel.has(n.key);
    return { checked, partial: !checked && keys.some((k) => k !== n.key && sel.has(k)) };
  };
  const row = (n: TreeLocation | TreeGroup | TreeItem, level: number, expandable: boolean, children?: React.ReactNode) => {
    const s = state(n);
    const isOpen = opened.has(n.key);
    const shift = "shift" in n ? n.shift : undefined;
    return (
      <Fragment key={n.key}>
      <li className={`list-none ${level === 1 ? "border-0 border-t border-solid border-sp-neutral-fill-light" : ""}`}>
        <div className={`flex items-center pr-[var(--sp-space-1x)] ${level === 0 && isOpen ? "bg-sp-neutral-fill-light" : ""}`}>
          {/* only the checkbox selects */}
          <button
            type="button"
            role="checkbox"
            aria-checked={s.partial && !s.checked ? "mixed" : s.checked}
            aria-label={`${n.label} auswählen`}
            onClick={() => onToggle(n, tree)}
            className="flex items-center justify-center shrink-0 size-8 p-0 border-0 bg-transparent rounded-[var(--sp-radius-2x)] cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
          >
            <Icon size={24} name={s.checked ? "checkbox_active_filled" : s.partial ? "checkbox_tristate" : "checkbox"} color={s.checked || s.partial ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />
          </button>
          {/* the rest of the row: text, white space and arrow fold / unfold (leaves select instead) */}
          <button
            type="button"
            aria-label={expandable ? `${n.label} ${isOpen ? "einklappen" : "aufklappen"}` : undefined}
            aria-expanded={expandable ? isOpen : undefined}
            onClick={() => (expandable ? flip(n.key) : onToggle(n, tree))}
            className="flex items-center flex-1 min-w-0 h-8 gap-[var(--sp-space-2x)] pl-[var(--sp-space-1x)] pr-[var(--sp-space-1x)] border-0 bg-transparent rounded-[var(--sp-radius-2x)] text-left cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
          >
            <Icon name={level === 0 ? "marker" : level === 1 ? "user_group" : shift ? "user_clock" : "user"} color="var(--sp-icon)" />
            <span className={`truncate ${level === 2 ? "sp-text-standard" : "sp-text-medium"} text-sp-text`}>{n.label}</span>
            {shift && <ShiftPill code={shift.code} color={shift.color} />}
            <span className="flex-1" />
            {shift && <span className="shrink-0 sp-text-small text-sp-text-label tabular-nums">{shift.time}</span>}
            {expandable && <Icon name="expanded" color="var(--sp-icon)" className={isOpen ? "rotate-180" : ""} />}
          </button>
        </div>
      </li>
      {expandable && isOpen && children}
      </Fragment>
    );
  };
  return (
    <ul className="m-0 p-0 flex flex-col">
      {tree.map((l) => (
        <li key={l.key} className="list-none mb-[var(--sp-space-2x)] bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] overflow-hidden">
          <ul className="m-0 p-0">
            {row(l, 0, true, l.groups.map((g) =>
              row(g, 1, true, g.items.map((i) => row(i, 2, false))),
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** Bibliothek filter: a "Filter" button that opens a panel "Filtern nach": tabs Schicht · Mitarbeiter · Häufigkeit.
    Schicht: Standorte, Gruppen and Schichten in ONE flat list (starts closed, one flat list, no indentation; a click on a row's text / white space / arrow folds it, only the checkbox selects); Mitarbeiter: Standorte → Gruppen → Mitarbeiter. Any level can be ticked
    (a parent ticks everything below it, partly ticked = tri-state). Häufigkeit: Täglich · Wöchentlich · Monatlich · Jährlich.
    Nothing changes until "Anwenden"; "Abbrechen" (or Esc / click outside) discards, "Zurücksetzen" clears the panel. */
export function LibraryFilter({ shifts, employees, frequencies, value, onApply }: LibraryFilterProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("shift");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [freq, setFreq] = useState<Set<string>>(new Set());
  const btn = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // the number of ticked leaves (shifts / employees) + frequencies
  const count = (v: LibraryFilterValue) => v.selected.filter((k) => k.startsWith("shift:") || k.startsWith("emp:")).length + v.freq.length;
  const applied = count(value);

  const show = () => { setSel(new Set(value.selected)); setFreq(new Set(value.freq)); setTab("shift"); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!btn.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = (node: TreeLocation | TreeGroup | TreeItem, tree: TreeLocation[]) => {
    setSel((s) => {
      const n = new Set(s);
      const keys = below(node);
      if (n.has(node.key)) keys.forEach((k) => n.delete(k)); else keys.forEach((k) => n.add(k));
      return normalize(n, tree);
    });
  };
  const draft: LibraryFilterValue = { selected: [...sel], freq: [...freq] };

  return (
    <div
      className="relative"
      onKeyDown={(e) => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); btn.current?.querySelector("button")?.focus(); } }}
    >
      <span ref={btn} className="inline-flex">
      <Button
        variant="secondary"
        icon={applied ? "filter_filled" : "filter"}
        label={applied ? `Filter (${applied})` : "Filter"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : show())}
      />
      </span>
      <Popover
        anchorRef={btn}
        panelRef={panel}
        open={open}
        minWidth={400}
        maxWidth={460}
        role="dialog"
        aria-label="Bibliothek filtern"
        className="flex flex-col bg-sp-surface-raised rounded-[var(--sp-radius-3x)] shadow-[var(--sp-shadow-m)] border border-solid border-sp-border-line"
      >
        <div className="flex flex-col gap-[var(--sp-space-3x)] p-[var(--sp-space-4x)]">
          <span className="sp-text-medium text-sp-text">Filtern nach</span>
          <div className="self-start">
          <SegmentedControl
            label="Filterart"
            value={tab}
            onChange={setTab}
            options={[
              { id: "shift", label: "Schicht", icon: "user_clock" },
              { id: "employee", label: "Mitarbeiter", icon: "user" },
              { id: "freq", label: "Häufigkeit", icon: "repeat" },
            ]}
          />
          </div>
          <div className="max-h-[320px] min-h-[200px] overflow-y-auto pr-[var(--sp-space-1x)]">
            {tab === "shift" && <Tree tree={shifts} sel={sel} onToggle={toggle} />}
            {tab === "employee" && <Tree tree={employees} sel={sel} onToggle={toggle} />}
            {tab === "freq" && (
              <ul className="m-0 p-0 flex flex-col">
                {frequencies.map((f) => (
                  <li key={f.id} className="list-none">
                    <Checkbox
                      checked={freq.has(f.id)}
                      label={f.label}
                      onChange={() => setFreq((s) => { const n = new Set(s); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n; })}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex items-center gap-[var(--sp-space-2x)] px-[var(--sp-space-4x)] py-[var(--sp-space-3x)] border-0 border-t border-solid border-sp-border-line">
          <Button variant="tertiary" label="Zurücksetzen" onClick={() => { setSel(new Set()); setFreq(new Set()); }} disabled={!sel.size && !freq.size} />
          <span className="flex-1" />
          <Button variant="secondary" label="Abbrechen" onClick={() => setOpen(false)} />
          <Button variant="primary" label="Anwenden" onClick={() => { onApply(draft); setOpen(false); }} />
        </div>
      </Popover>
    </div>
  );
}
