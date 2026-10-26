import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { SearchField } from "../atoms/SearchField";
import { Popover } from "./Popover";
import { SegmentedControl } from "./SegmentedControl";
import { ShiftPill, type ShiftColor } from "./ShiftPill";

export interface RecipientLocation { id: string; label: string }
export interface RecipientPerson { id: string; label: string; /** group (team) the person belongs to */ group: string; /** location id */ location: string; /** "VZ" / "AZ" */ contract?: string }
export interface RecipientShift { id: string; /** shift name, e.g. "Frühschicht" */ label: string; group: string; location: string; /** first letters of the shift */ code: string; /** working hours */ time: string; color?: ShiftColor }

export interface RecipientSelectProps {
  locations: RecipientLocation[];
  people: RecipientPerson[];
  shifts: RecipientShift[];
  /** selected person / shift ids — a group or location is never a recipient, ticking one adds everyone below it */
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
  onBlur?: () => void;
}

type Tab = "people" | "shifts";

interface Leaf { id: string; label: string; group: string; location: string; shift?: RecipientShift; contract?: string }

const btn = "flex items-center border-0 bg-transparent cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]";

function Check({ state }: { state: "on" | "partial" | "off" }) {
  return <Icon size={24} name={state === "on" ? "checkbox_active_filled" : state === "partial" ? "checkbox_tristate" : "checkbox"} color={state === "off" ? "var(--sp-icon)" : "var(--sp-brand-on-surface)"} />;
}

/** Recipient picker. Field = "Input Dropdown" (chips with only the person / shift name, chevron flips up while open, brand border).
    Popover under the field: segmented control Mitarbeiter · Schicht, a search, then ONE flat list Standort → Gruppe → Mitarbeiter / Schicht
    (starts closed; a click on the row's text or arrow folds it, only the checkbox selects). Ticking a Standort or Gruppe selects every person /
    shift below it — the recipients are always the individual people / shifts, never a group. Shifts: name · pill (3 capital letters in the
    shift's colour) · working hours on the right; people: name · VZ / AZ on the right. Picks accumulate across both tabs. */
export function RecipientSelect({ locations, people, shifts, value, onChange, placeholder = "Empfänger wählen", invalid, id, onBlur }: RecipientSelectProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("people");
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !panelRef.current?.contains(t)) { setOpen(false); onBlur?.(); }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onBlur]);

  const picked = new Set(value);
  const setIds = (ids: string[], on: boolean) => onChange(on ? [...value, ...ids.filter((i) => !picked.has(i))] : value.filter((v) => !ids.includes(v)));
  const toggle = (rid: string) => setIds([rid], !picked.has(rid));
  const flip = (k: string) => setOpened((o) => { const n = new Set(o); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const stateOf = (ids: string[]): "on" | "partial" | "off" => {
    const n = ids.filter((i) => picked.has(i)).length;
    return n === 0 ? "off" : n === ids.length ? "on" : "partial";
  };

  // chips in the field, in the order picked — only the name
  const chips = value.flatMap((v): { id: string; label: string; hint: string }[] => {
    const p = people.find((x) => x.id === v);
    if (p) return [{ id: v, label: p.label, hint: `${p.group} · ${locations.find((l) => l.id === p.location)?.label ?? ""}` }];
    const s = shifts.find((x) => x.id === v);
    if (s) return [{ id: v, label: s.label, hint: `${s.group} · ${locations.find((l) => l.id === s.location)?.label ?? ""} · ${s.time}` }];
    return [];
  });

  const leaves: Leaf[] = useMemo(
    () => (tab === "people"
      ? people.map((p) => ({ id: p.id, label: p.label, group: p.group, location: p.location, contract: p.contract }))
      : shifts.map((s) => ({ id: s.id, label: s.label, group: s.group, location: s.location, shift: s }))),
    [tab, people, shifts],
  );
  const q = query.trim().toLowerCase();
  const visible = q ? leaves.filter((l) => l.label.toLowerCase().includes(q)) : leaves;
  const tree = locations
    .map((l) => {
      const inLoc = visible.filter((x) => x.location === l.id);
      const groups = [...new Set(inLoc.map((x) => x.group))].sort((a, b) => a.localeCompare(b, "de"));
      return { loc: l, ids: inLoc.map((x) => x.id), groups: groups.map((g) => ({ name: g, items: inLoc.filter((x) => x.group === g) })) };
    })
    .filter((l) => l.groups.length);

  const header = (key: string, level: 0 | 1, label: string, ids: string[], count: number) => {
    const isOpen = !!q || opened.has(key);
    return (
      <div className={`flex items-center pr-[var(--sp-space-1x)] ${level === 0 ? (isOpen ? "bg-sp-neutral-fill-light" : "") : "border-0 border-t border-solid border-sp-neutral-fill-light"}`}>
        <button type="button" role="checkbox" aria-checked={stateOf(ids) === "partial" ? "mixed" : stateOf(ids) === "on"} aria-label={`${label} auswählen`} onClick={() => setIds(ids, stateOf(ids) !== "on")} className={`${btn} justify-center shrink-0 size-8 p-0 rounded-[var(--sp-radius-2x)]`}>
          <Check state={stateOf(ids)} />
        </button>
        <button type="button" aria-expanded={isOpen} aria-label={`${label} ${isOpen ? "einklappen" : "aufklappen"}`} onClick={() => flip(key)} className={`${btn} flex-1 min-w-0 h-8 gap-[var(--sp-space-2x)] px-[var(--sp-space-1x)] rounded-[var(--sp-radius-2x)] text-left`}>
          <Icon name={level === 0 ? "marker" : "user_group"} color="var(--sp-icon)" />
          <span className="truncate sp-text-medium text-sp-text">{label}</span>
          <span className="inline-flex items-center h-5 px-[var(--tms-space-6px)] rounded-[var(--sp-radius-2x)] bg-sp-neutral-fill-light border border-solid border-sp-neutral-border-light sp-text-small-medium text-sp-text tabular-nums">{count}</span>
          <span className="flex-1" />
          <Icon name="expanded" color="var(--sp-icon)" className={isOpen ? "rotate-180" : ""} />
        </button>
      </div>
    );
  };

  const leaf = (l: Leaf) => (
    <button key={l.id} type="button" role="checkbox" aria-checked={picked.has(l.id)} onClick={() => toggle(l.id)} className={`${btn} w-full h-8 gap-[var(--sp-space-2x)] pl-10 pr-[var(--sp-space-2x)] border-0 border-t border-solid border-sp-neutral-fill-light text-left`}>
      <Check state={picked.has(l.id) ? "on" : "off"} />
      {l.shift && <ShiftPill code={l.shift.code} color={l.shift.color} />}
      <span className={`truncate text-sp-text ${picked.has(l.id) ? "sp-text-medium" : "sp-text-standard"}`}>{l.label}</span>
      <span className="flex-1" />
      <span className="shrink-0 sp-text-small-medium text-sp-text-label tabular-nums">{l.shift ? l.shift.time : l.contract}</span>
    </button>
  );

  return (
    <div
      ref={ref}
      className="relative min-w-[var(--tms-recipient-min-width)]"
      onKeyDown={(e) => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); onBlur?.(); } }}
    >
      <div
        ref={fieldRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-invalid={invalid || undefined}
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); setOpen(true); } }}
        className={`flex items-center gap-[var(--sp-space-2x)] min-h-8 px-[var(--sp-space-2x)] py-[var(--tms-space-2px)] bg-sp-form-control-background-color sp-interactive border border-solid cursor-pointer outline-none focus-visible:shadow-[var(--sp-focus-brand)] ${
          open ? "rounded-t-[var(--sp-radius-2x)] border-sp-brand-border-normal" : "rounded-[var(--sp-radius-2x)]"
        } ${!open && (invalid ? "border-sp-danger-on-surface" : "border-sp-form-control-border-color")}`}
      >
        <span className="flex flex-wrap items-center flex-1 min-w-0 max-h-[var(--tms-recipient-max-height)] overflow-y-auto gap-[var(--sp-space-1x)]">
          {chips.length ? chips.map((c) => (
            <span key={c.id} title={c.hint} className="inline-flex items-center h-6 pl-[var(--sp-space-2x)] pr-[var(--sp-space-1x)] gap-[var(--sp-space-1x)] rounded-[var(--sp-radius-2x)] bg-sp-neutral-fill-light border border-solid border-sp-neutral-border-light sp-text-small-medium text-sp-text">
              {c.label}
              <button
                type="button"
                aria-label={`${c.label} entfernen`}
                onClick={(e) => { e.stopPropagation(); toggle(c.id); }}
                className="flex p-0 border-0 bg-transparent cursor-pointer rounded-[var(--sp-radius-pill)] outline-none focus-visible:shadow-[var(--sp-focus-brand)]"
              >
                <Icon name="close" size={12} color="var(--sp-icon)" />
              </button>
            </span>
          )) : <span className="sp-text-standard italic text-sp-text-placeholder">{placeholder}</span>}
        </span>
        <Icon name="expanded" color="var(--sp-text)" className={open ? "rotate-180" : ""} />
      </div>

      <Popover
        open={open}
        anchorRef={fieldRef}
        panelRef={panelRef}
        matchWidth
        minWidth={360}
        offset={-1}
        role="dialog"
        aria-label="Empfänger wählen"
        className="flex flex-col bg-sp-form-control-background-color border border-solid border-sp-brand-border-normal rounded-b-[var(--sp-radius-2x)] shadow-[var(--sp-shadow-m)]"
      >
        <div className="flex flex-col gap-[var(--sp-space-2x)] p-[var(--sp-space-3x)]">
          <div className="self-start">
            <SegmentedControl
              label="Empfängerart"
              value={tab}
              onChange={(t) => { setTab(t as Tab); setQuery(""); }}
              options={[{ id: "people", label: "Mitarbeiter", icon: "user" }, { id: "shifts", label: "Schicht", icon: "user_clock" }]}
            />
          </div>
          <SearchField value={query} onChange={setQuery} placeholder="Suchen" clearLabel="Suche löschen" />
        </div>

        <div role="tabpanel" className="flex flex-col gap-[var(--sp-space-2x)] max-h-[var(--tms-recipient-popover-list-max-height)] overflow-y-auto px-[var(--sp-space-3x)] pb-[var(--sp-space-3x)]">
          {tree.length ? tree.map(({ loc, ids, groups }) => (
            <div key={loc.id} className="bg-sp-surface-raised border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] overflow-hidden">
              {header(`loc:${loc.id}`, 0, loc.label, ids, ids.length)}
              {(!!q || opened.has(`loc:${loc.id}`)) && groups.map((g) => (
                <Fragment key={g.name}>
                  {header(`grp:${loc.id}:${g.name}`, 1, g.name, g.items.map((x) => x.id), g.items.length)}
                  {(!!q || opened.has(`grp:${loc.id}:${g.name}`)) && g.items.map(leaf)}
                </Fragment>
              ))}
            </div>
          )) : <span className="p-[var(--sp-space-3x)] sp-text-standard text-sp-text-label">Keine Treffer.</span>}
        </div>

        <div className="flex items-center justify-between px-[var(--sp-space-3x)] py-[var(--sp-space-1x)] border-0 border-t border-solid border-sp-border-line">
          <span className="sp-text-small text-sp-text-label">{value.length} ausgewählt</span>
          <Button variant="tertiary" label="Fertig" onClick={() => { setOpen(false); onBlur?.(); }} />
        </div>
      </Popover>
    </div>
  );
}
