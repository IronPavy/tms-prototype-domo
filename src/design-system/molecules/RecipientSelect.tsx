import { useEffect, useRef, useState } from "react";
import { Avatar } from "../atoms/Avatar";
import { Button } from "../atoms/Button";
import { Icon, type IconName } from "../atoms/Icon";
import { TabBar } from "../organisms/TabBar";
import { Popover } from "./Popover";

export interface RecipientPerson { id: string; label: string; /** team heading the person is listed under */ group: string }
export interface RecipientTeam { id: string; label: string; /** head count */ count: number }
export interface RecipientShift { id: string; label: string; /** "From the duty roster · today: Name" */ sub: string }

export interface RecipientSelectProps {
  people: RecipientPerson[];
  teams: RecipientTeam[];
  shifts: RecipientShift[];
  /** selected ids across all three tabs */
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
  onBlur?: () => void;
}

type Tab = "people" | "teams" | "shifts";

const row =
  "flex items-center w-full min-h-10 p-[var(--sp-space-2x)] gap-[var(--sp-space-3x)] border-0 bg-transparent rounded-[var(--sp-radius-2x)] text-left cursor-pointer sp-interactive outline-none focus-visible:shadow-[var(--sp-focus-brand)]";

const Tile = ({ icon }: { icon: IconName }) => (
  <span className="flex items-center justify-center shrink-0 size-8 rounded-full bg-sp-info-fill-light">
    <Icon name={icon} color="var(--sp-info-on-surface)" />
  </span>
);
const Check = ({ on, partial }: { on: boolean; partial?: boolean }) => (
  <Icon name={on ? "checkbox_active_filled" : partial ? "checkbox_tristate" : "checkbox"} color={on || partial ? "var(--sp-brand-on-surface)" : "var(--sp-icon)"} />
);

/** Recipient picker. Field = "Input Dropdown" (chips for the picks, chevron flips up while open, brand border).
    Popover attached under the field: SP3 Tab Items People · Teams · Shifts, then a scrolling list, footer "N selected" + Done.
    People = grouped by team (Avatar + name) · Teams = "All teams" select-all, then group tile + name + "N people" ·
    Shifts = clock tile + shift name + "From the duty roster · today: …". Picks accumulate across the tabs. */
export function RecipientSelect({ people, teams, shifts, value, onChange, placeholder = "Choose recipient", invalid, id, onBlur }: RecipientSelectProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("people");
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

  const toggle = (rid: string) => onChange(value.includes(rid) ? value.filter((v) => v !== rid) : [...value, rid]);
  const teamIds = teams.map((t) => t.id);
  const pickedTeams = teamIds.filter((t) => value.includes(t)).length;
  const allTeams = !!teamIds.length && pickedTeams === teamIds.length;
  const toggleAllTeams = () => onChange(allTeams ? value.filter((v) => !teamIds.includes(v)) : [...new Set([...value, ...teamIds])]);

  // chips in the field, in the order picked
  const chips = value.flatMap((v): { id: string; label: string; icon?: IconName }[] => {
    const p = people.find((x) => x.id === v); if (p) return [{ id: v, label: p.label }];
    const t = teams.find((x) => x.id === v); if (t) return [{ id: v, label: t.label, icon: "user_group" }];
    const s = shifts.find((x) => x.id === v); if (s) return [{ id: v, label: s.label, icon: "clock" }];
    return [];
  });
  const groups = [...new Set(people.map((p) => p.group))];

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
            <span key={c.id} className="inline-flex items-center h-6 pl-[var(--sp-space-2x)] pr-[var(--sp-space-1x)] gap-[var(--sp-space-1x)] rounded-[var(--sp-radius-2x)] bg-sp-neutral-fill-light border border-solid border-sp-neutral-border-light sp-text-small-medium text-sp-text">
              {c.icon && <Icon name={c.icon} size={12} color="var(--sp-icon)" />}
              {c.label}
              <button
                type="button"
                aria-label={`Remove ${c.label}`}
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
        minWidth={320}
        offset={-1}
        role="dialog"
        aria-label="Choose recipient"
        className="flex flex-col bg-sp-form-control-background-color border border-solid border-sp-brand-border-normal rounded-b-[var(--sp-radius-2x)] shadow-[var(--sp-shadow-m)]"
      >
          <div className="pt-[var(--sp-space-2x)] px-[var(--sp-space-2x)]">
            <TabBar
              label="Recipient type"
              value={tab}
              onChange={(t) => setTab(t as Tab)}
              tabs={[{ id: "people", label: "People" }, { id: "teams", label: "Teams" }, { id: "shifts", label: "Shifts" }]}
            />
          </div>

          <div role="tabpanel" className="flex flex-col max-h-[var(--tms-recipient-popover-list-max-height)] overflow-y-auto p-[var(--sp-space-2x)]">
            {tab === "people" && (groups.length ? groups.map((g) => (
              <div key={g} className="flex flex-col">
                <span className="px-[var(--sp-space-2x)] pt-[var(--sp-space-2x)] pb-[var(--sp-space-1x)] sp-text-small text-sp-text-label">{g}</span>
                {people.filter((p) => p.group === g).map((p) => {
                  const on = value.includes(p.id);
                  return (
                    <button key={p.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(p.id)} className={row}>
                      <Avatar name={p.label} size={24} />
                      <span className={`flex-1 min-w-0 truncate text-sp-text ${on ? "sp-text-medium" : "sp-text-standard"}`}>{p.label}</span>
                      <Check on={on} />
                    </button>
                  );
                })}
              </div>
            )) : <Empty />)}

            {tab === "teams" && (teams.length ? (
              <>
                <button type="button" role="checkbox" aria-checked={allTeams ? true : pickedTeams ? "mixed" : false} onClick={toggleAllTeams} className={row}>
                  <Tile icon="user_group" />
                  <span className={`flex-1 min-w-0 truncate text-sp-text ${allTeams ? "sp-text-medium" : "sp-text-standard"}`}>All teams</span>
                  <Check on={allTeams} partial={!!pickedTeams && !allTeams} />
                </button>
                <hr className="my-[var(--sp-space-1x)] border-0 border-t border-solid border-sp-border-line" />
                {teams.map((t) => {
                  const on = value.includes(t.id);
                  return (
                    <button key={t.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(t.id)} className={row}>
                      <Tile icon="user_group" />
                      <span className="flex flex-col flex-1 min-w-0 gap-[var(--sp-space-1x)]">
                        <span className={`truncate text-sp-text ${on ? "sp-text-medium" : "sp-text-standard"}`}>{t.label}</span>
                        <span className="sp-text-small text-sp-text-label">{t.count} {t.count === 1 ? "person" : "people"}</span>
                      </span>
                      <Check on={on} />
                    </button>
                  );
                })}
              </>
            ) : <Empty />)}

            {tab === "shifts" && (shifts.length ? shifts.map((s) => {
              const on = value.includes(s.id);
              return (
                <button key={s.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(s.id)} className={row}>
                  <Tile icon="clock" />
                  <span className="flex flex-col flex-1 min-w-0 gap-[var(--sp-space-1x)]">
                    <span className={`truncate text-sp-text ${on ? "sp-text-medium" : "sp-text-standard"}`}>{s.label}</span>
                    <span className="truncate sp-text-small text-sp-text-label">{s.sub}</span>
                  </span>
                  <Check on={on} />
                </button>
              );
            }) : <Empty />)}
          </div>

          <div className="flex items-center justify-between px-[var(--sp-space-3x)] py-[var(--sp-space-1x)] border-0 border-t border-solid border-sp-border-line">
            <span className="sp-text-small text-sp-text-label">{value.length} selected</span>
            <Button variant="tertiary" label="Done" onClick={() => { setOpen(false); onBlur?.(); }} />
          </div>
      </Popover>
    </div>
  );
}

const Empty = () => <span className="p-[var(--sp-space-3x)] sp-text-standard text-sp-text-label">Nothing here for the selected location.</span>;
