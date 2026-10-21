import { useMemo, useState, type ReactNode } from "react";
import {
  Icon, ICON_SECTIONS, ProductLogo, TmsLogo, HeaderButton, SidebarNavItem,
  HeaderNavbar, SidebarNavigation, Button, PageHeader, WeekPicker, CalendarWeek, StatCard,
  DateRangePicker, CalendarRange, MenuListItem, MultiSelectDropdown, TextField, Switch, FormField, Toast,
  StatusChip, Link, Panel, AttentionList, DonutChart, BarChart, Tooltip, ScrollArea,
  ProgressBar, StatusDot, ShiftGroup, SubmissionList, TeamBreakdown, UpcomingList,
  Breadcrumb, TabBar, FilterPill, SearchField, SegmentedControl, DueDateChip,
  type IconName, type StatTone,
} from "@/design-system";
import { addDays, startOfWeek, type DateRange } from "@/design-system/utils/date";
import { HEADER, NAV_SECTIONS } from "@/prototype/data";

/* ─── Read tokens straight from the loaded CSS (sophis-pet.css + tms.css) ─── */

type Token = { name: string; value: string };

function readTokens(): Token[] {
  const seen = new Map<string, string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    const walk = (list: CSSRuleList) => {
      for (const r of Array.from(list)) {
        if (r instanceof CSSStyleRule && r.selectorText === ":root") {
          for (const p of Array.from(r.style)) if (/^--(sp|tms)-/.test(p)) seen.set(p, r.style.getPropertyValue(p).trim());
        } else if ("cssRules" in r) walk((r as CSSGroupingRule).cssRules);
      }
    };
    walk(rules);
  }
  return [...seen].map(([name, value]) => ({ name, value }));
}

/* SP3 Theme groups — prefix match, first match wins (order matters: --sp-text before the rest) */
const VARIANTS = ["brand", "neutral", "info", "success", "warning", "danger", "new", "ai"];
const COLOR_GROUPS: [string, string][] = [
  ["--sp-surface-", "Surface"], ["--sp-text", "Text styles"],
  ...VARIANTS.map((v) => [`--sp-${v}-`, `Variant · ${v}`] as [string, string]),
  ["--sp-", "Other (states, form controls, header, border, tooltip …)"], ["--tms-", "TMS project"],
];
const NON_COLOR = /space|radius|font|line-height|icon-size|border-width|density|focus|shadow|header-height|sidebar-width/;
const isColor = (t: Token) => /^#|^var\(--/.test(t.value) && !NON_COLOR.test(t.name);
const groupOf = (name: string) => COLOR_GROUPS.find(([p]) => name.startsWith(p))?.[0];

/* ─── Page chrome ─── */

const line = "var(--sp-border-line)";
const sub = "var(--sp-text-label)";
const SECTIONS = ["Tokens", "Icons", "Atoms", "Molecules", "Organisms"];

function Section({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <section id={title.toLowerCase()} className="scroll-mt-20 pb-12 mb-12" style={{ borderBottom: `1px solid ${line}` }}>
      <h2 className="sp-title-h1 m-0">{title}</h2>
      <p className="mt-2 mb-7 max-w-[680px] leading-normal" style={{ color: sub }}>{intro}</p>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}

function Specimen({ name, spec, children, stage = true, dark }: { name: string; spec?: string; children: ReactNode; stage?: boolean; dark?: boolean }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3 mb-2.5">
        <h3 className="sp-title-h3 m-0">{name}</h3>
        {spec && <code className="text-xs" style={{ color: sub }}>{spec}</code>}
      </div>
      <div
        className={stage ? "rounded-xl p-6 overflow-x-auto" : ""}
        style={stage ? { background: dark ? "var(--sp-header-background)" : "var(--sp-surface-default)", border: `1px solid ${line}` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

const Caption = ({ children, light }: { children: ReactNode; light?: boolean }) => (
  <div className="mt-1.5 text-[11px] font-mono break-all" style={{ color: light ? "var(--sp-selected)" : sub }}>{children}</div>
);

/* ─── Page ─── */

export default function StyleguidePage() {
  const [selectedId, setSelectedId] = useState("tasks/dashboard");
  const [query, setQuery] = useState("");
  const [sgTab, setSgTab] = useState("a");
  const [sgPill, setSgPill] = useState(true);
  const [sgSeg, setSgSeg] = useState("list");
  const [sgMulti, setSgMulti] = useState<string[]>([]);
  const [sgText, setSgText] = useState("");
  const [sgSwitch, setSgSwitch] = useState(false);
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const [range, setRange] = useState<DateRange>(() => ({ start: startOfWeek(new Date()), end: addDays(startOfWeek(new Date()), 6) }));
  const tokens = useMemo(readTokens, []);

  const colors = tokens.filter(isColor);
  const spaces = tokens.filter((t) => t.name.startsWith("--sp-space-"));
  const radii = tokens.filter((t) => t.name.startsWith("--sp-radius-"));

  const q = query.trim().toLowerCase();
  const iconSections = Object.entries(ICON_SECTIONS)
    .map(([s, names]) => [s, (names as readonly IconName[]).filter((n) => n.includes(q))] as const)
    .filter(([, n]) => n.length);
  const iconCount = iconSections.reduce((a, [, n]) => a + n.length, 0);

  return (
    <div className="min-h-full bg-white">
      <header className="sticky top-0 z-10 bg-white" style={{ borderBottom: `1px solid ${line}` }}>
        <div className="mx-auto max-w-[1200px] px-4 py-3.5 flex flex-wrap items-center gap-6">
          <strong className="sp-text-medium">TMS Styleguide · Sophi's Pet</strong>
          <nav className="flex flex-wrap gap-4">
            {SECTIONS.map((s) => (
              <a key={s} href={`#${s.toLowerCase()}`} className="sp-text-standard no-underline" style={{ color: sub }}>{s}</a>
            ))}
          </nav>
          <a href="/" className="ml-auto sp-text-standard text-sp-text-link">Prototype →</a>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <Section title="Tokens" intro={`${tokens.length} CSS variables, read live from sophis-pet.css (generated from “Sophi's Pet 3”, light theme) and tms.css (project values SP3 doesn't define).`}>
          {COLOR_GROUPS.map(([prefix, label]) => {
            const list = colors.filter((t) => groupOf(t.name) === prefix);
            if (!list.length) return null;
            return (
              <Specimen key={prefix} name={label} spec={`${list.length} colours`} stage={false}>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))" }}>
                  {list.map((t) => (
                    <div key={t.name} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${line}` }}>
                      <div className="h-12" style={{ background: `var(${t.name})`, borderBottom: `1px solid ${line}` }} />
                      <div className="px-2.5 py-2">
                        <Caption>{t.name}</Caption>
                        <Caption>{t.value}</Caption>
                      </div>
                    </div>
                  ))}
                </div>
              </Specimen>
            );
          })}

          <Specimen name="Typography" spec="Roboto · .sp-text-* / .sp-title-* classes" stage={false}>
            {["sp-title-h1", "sp-title-h2", "sp-title-h3", "sp-text-large-medium", "sp-text-standard", "sp-text-medium", "sp-text-bold", "sp-text-italic", "sp-text-italic-medium", "sp-text-underline", "sp-text-body-standard", "sp-text-body-medium", "sp-text-small", "sp-text-small-italic", "sp-text-small-medium", "sp-text-extra-small"].map((c) => (
              <div key={c} className="flex flex-wrap items-baseline gap-4 py-3" style={{ borderTop: `1px solid ${line}` }}>
                <code className="w-[180px] text-xs" style={{ color: sub }}>.{c}</code>
                <span className={c}>Aufgaben Management</span>
              </div>
            ))}
          </Specimen>

          <div className="grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}>
            <Specimen name="Spacing & Size" spec="--sp-space-*" stage={false}>
              <div className="flex flex-col gap-2">
                {spaces.map((t) => (
                  <div key={t.name} className="flex items-center gap-3">
                    <code className="w-[150px] text-xs" style={{ color: sub }}>{t.name}</code>
                    <div className="h-3 rounded-sm bg-sp-brand-fill-normal" style={{ width: `calc(${t.value} * 3)` }} />
                    <code className="text-xs" style={{ color: sub }}>{t.value}</code>
                  </div>
                ))}
              </div>
            </Specimen>
            <Specimen name="Corner radius" spec="--sp-radius-*" stage={false}>
              <div className="flex flex-wrap gap-5">
                {radii.map((t) => (
                  <div key={t.name}>
                    <div className="size-16 bg-sp-info-fill-light" style={{ borderRadius: `var(${t.name})`, border: "1px solid var(--sp-info-border-light)" }} />
                    <Caption>{t.name.replace("--sp-radius-", "")} · {t.value}</Caption>
                  </div>
                ))}
              </div>
            </Specimen>
          </div>
        </Section>

        <Section title="Icons" intro="Sophis Icons library — every icon exported from Figma as SVG. Usage: <Icon name size={12|16|24|48} color? />">
          <input
            type="search"
            placeholder="Search icons… (e.g. user, arrow, calendar)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sp-text-standard w-full max-w-[420px] h-9 px-3 rounded-[var(--sp-radius-2x)] bg-sp-form-control-background-color outline-none focus:shadow-[var(--sp-focus-brand)]"
            style={{ border: `1px solid ${line}` }}
          />
          <p className="m-0 sp-text-small" style={{ color: sub }}>{iconCount} icons</p>
          {iconSections.map(([section, names]) => (
            <Specimen key={section} name={section} spec={`${names.length}`}>
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))" }}>
                {names.map((n) => (
                  <div key={n} className="flex flex-col items-center gap-1.5 py-2 rounded-lg bg-white" title={n}>
                    <Icon name={n} size={24} color="var(--sp-brand-fill-normal)" />
                    <span className="text-[10px] font-mono text-center break-all px-1" style={{ color: sub }}>{n}</span>
                  </div>
                ))}
              </div>
            </Specimen>
          ))}
        </Section>

        <Section title="Atoms" intro="Library Button (37:48) and the logos from the Product Logo set.">
          <Specimen name="Button" spec="Sophi's Pet “Button” 37:48 · <Button variant icon? label? dropdown? disabled? />">
            <div className="flex flex-col gap-4">
              {(["primary", "secondary", "tertiary"] as const).map((v) => (
                <div key={v} className="flex flex-wrap items-center gap-4">
                  <code className="w-[80px] text-xs" style={{ color: sub }}>{v}</code>
                  <Button variant={v} icon="plus" label="New task" />
                  <Button variant={v} icon="plus" label="New task" dropdown />
                  <Button variant={v} icon="plus" aria-label="New task" />
                  <Button variant={v} icon="plus" label="Disabled" disabled />
                </div>
              ))}
            </div>
          </Specimen>
          <Specimen name="Logos" spec="<ProductLogo /> · <TmsLogo />" dark>
            <div className="flex items-center gap-8">
              <div><ProductLogo /><Caption light>ProductLogo (edtime)</Caption></div>
              <div><TmsLogo /><Caption light>TmsLogo</Caption></div>
            </div>
          </Specimen>
        </Section>

        <Section title="Molecules" intro="Library components with their states. Hover and press the live examples — colours come from header/* and basics/* tokens.">
          <Specimen name="HeaderButton" spec="Sophi's Pet “Header Button” 318:146 · “Menu Button” 13607:16093" dark>
            <div className="flex flex-wrap items-end gap-6">
              {[
                ["normal (hover / press me)", <HeaderButton icon="clock" ariaLabel="Zeiterfassung" />],
                ["active", <HeaderButton icon="clock" ariaLabel="Zeiterfassung" active />],
                ["disabled", <HeaderButton icon="clock" ariaLabel="Zeiterfassung" disabled />],
                ["menu (24px icon)", <HeaderButton icon="menu" largeIcon ariaLabel="Menü" />],
                ["label + dropdown", <HeaderButton icon="marker" label="Propep Test 1" dropdown />],
              ].map(([cap, el]) => <div key={cap as string}>{el}<Caption light>{cap}</Caption></div>)}
            </div>
          </Specimen>
          <Specimen name="SidebarNavItem" spec="Sophi's Pet “Sidebar Navigation Item” 49:52">
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))" }}>
              {[
                ["normal (hover / press me)", <SidebarNavItem label="Übersicht" icon="home" />],
                ["hasChildren", <SidebarNavItem label="Abwesenheiten" icon="cal" hasChildren />],
                ["open (holds current page)", <SidebarNavItem label="Aufgaben Management" icon="checklist" hasChildren expanded active />],
                ["level 1 · selected", <SidebarNavItem label="Dashboard" level={1} selected />],
                ["level 1", <SidebarNavItem label="Tasks" level={1} />],
                ["disabled", <SidebarNavItem label="Archiv" icon="save" hasChildren disabled />],
                ["tone promo", <SidebarNavItem label="Jetzt kaufen" icon="help_circle" tone="promo" />],
                ["tone promo-filled", <SidebarNavItem label="Hilfe" icon="help_circle" tone="promo-filled" />],
              ].map(([cap, el]) => <div key={cap as string} className="w-[280px] max-w-full">{el}<Caption>{cap}</Caption></div>)}
            </div>
          </Specimen>
        </Section>

        <Section title="Status & data" intro="Status Chip (13689:7110), Link (383:157), Panel (Card Tile contrast), attention rows and the dashboard charts. Tone colours come from utils/tones.ts.">
          <Specimen name="StatusChip" spec="<StatusChip tone label icon? /> · 20px · tone background + stroke · Small Medium carbon">
            <div className="flex flex-wrap gap-3">
              {(["default", "info", "success", "warning", "error", "new", "expired", "ai"] as const).map((t) => (
                <StatusChip key={t} tone={t} label={t[0].toUpperCase() + t.slice(1)} />
              ))}
              <StatusChip tone="error" icon="warning" label="With icon" />
            </div>
          </Specimen>
          <Specimen name="Tooltip" spec="Sophi's Pet “Tooltip” 256:11369, Position=top · <Tooltip type? align? />">
            <div className="flex flex-wrap items-end gap-8">
              <Tooltip>Mo · 05.10.<br />Done: 13 of 14</Tooltip>
              <Tooltip type="error">Overdue since 02.10.</Tooltip>
              <Tooltip type="warning">Warning tooltip</Tooltip>
              <Tooltip align="start">Tail left (edge anchor)</Tooltip>
              <Tooltip align="end">Tail right (edge anchor)</Tooltip>
            </div>
          </Specimen>
          <Specimen name="ScrollArea" spec="Sophi's Pet “Scrollbar” 2303:4485 as overlay · hover the bar (8 → 20px), drag the thumb, click the track">
            <ScrollArea className="max-h-[160px] w-[320px] bg-white rounded-[var(--sp-radius-2x)]" contentClassName="p-3 pr-6" label="Scroll demo">
              {Array.from({ length: 14 }, (_, i) => (
                <p key={i} className="m-0 py-1 sp-text-standard">Task row {i + 1}</p>
              ))}
            </ScrollArea>
          </Specimen>
          <Specimen name="Link" spec="<Link /> · hover / press it">
            <Link>+ 1 more in Tasks</Link>
          </Specimen>
          <Specimen name="Panel + AttentionList" spec="<Panel title meta actions?> · <AttentionList items limit? />">
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}>
              <Panel title="Kritische Aufgaben" meta="3 tasks · now">
                <AttentionList
                  limit={2}
                  items={[
                    { id: "1", tone: "error", icon: "warning", status: "Overdue", title: "Deep clean fryer", meta: "Overdue since 02.10. 22:00 · Florian Ade", actionLabel: "Open" },
                    { id: "3", tone: "error", icon: "warning", status: "Deviation, no action", title: "Cold room check – morning", meta: "Cold room 2: 7.6 °C · 05.10. 06:34", actionLabel: "Add action" },
                  ]}
                />
              </Panel>
              <Panel title="Empty state" meta="0 tasks"><AttentionList items={[]} /></Panel>
            </div>
          </Specimen>
          <Specimen name="ProgressBar + StatusDot" spec="library “Progress Bar” 21744:2489 (6px, slider-background track, primary fill; tone = accent) · 8px dot done / late / upcoming">
            <div className="flex flex-wrap items-center gap-6">
              {[0, 1, 2, 4].map((v) => <ProgressBar key={v} value={v} max={4} tone={v === 4 ? "success" : undefined} label={`${v}/4`} className="w-[120px]" />)}
              <StatusDot tone="success" label="Done" /><StatusDot tone="warning" label="Late" /><StatusDot label="Upcoming" />
            </div>
          </Specimen>
          <Specimen name="ShiftGroup (ShiftTaskRow)" spec="<ShiftGroup title tasks defaultOpen? /> · click the header to collapse · rows: done / late / upcoming">
            <div className="w-[min(480px,100%)]">
              <ShiftGroup
                title="Individual"
                tasks={[
                  { id: "1", state: "done", time: "07:30", title: "Cold room check – Split", person: "Florian Ade", doneAt: "07:42" },
                  { id: "2", state: "late", time: "10:00", title: "Terrace opening – Split", person: "Ruzica Vucic" },
                  { id: "3", state: "upcoming", time: "14:00", title: "Restock restrooms", person: "Kim Fehrmann" },
                ]}
              />
            </div>
          </Specimen>
          <Specimen name="SubmissionList (SubmissionRow)" spec="form tile (info / error) · title · person · time · Status Chip OK (success) / Deviation (error)">
            <div className="w-[min(480px,100%)] bg-white rounded-[var(--sp-radius-2x)]">
              <SubmissionList
                items={[
                  { id: "1", title: "Cold room temperature check", person: "Florian Ade", when: "Today 07:42", result: "ok" },
                  { id: "2", title: "Coffee machine cleaning", person: "Ruzica Vucic", when: "Yesterday 22:31", result: "deviation" },
                ]}
              />
            </div>
          </Specimen>
          <Specimen name="Breadcrumb" spec="library “Breadcrumb” Inline · Links + next icon · current page in text font/breadcrumb">
            <Breadcrumb items={[{ label: "Aufgaben Management" }, { label: "Tasks" }]} />
          </Specimen>
          <Specimen name="TabBar" spec="library “Tabs Item” Style=tertiary · active = basics/selected + 2px primary · count = Status Chip">
            <TabBar label="Demo tabs" value={sgTab} onChange={setSgTab} tabs={[{ id: "a", label: "Status", count: 63 }, { id: "b", label: "Library", count: 15 }, { id: "c", label: "Drafts", count: 3, countTone: "error" }]} />
          </Specimen>
          <Specimen name="FilterPill" spec="library “Status Chip & Filter Pill” Type=filter pill · toggle: on = tone, off = default">
            <div className="flex flex-wrap gap-2">
              <FilterPill tone="success" icon="check" label="Done" count={13} selected={sgPill} onClick={() => setSgPill((v) => !v)} />
              <FilterPill tone="error" icon="warning" label="Overdue" count={6} selected={false} />
            </div>
          </Specimen>
          <Specimen name="SearchField + SegmentedControl" spec="library “Search” (32px, circular) · “Segmented Control” (selected = primary/standard)">
            <div className="flex flex-wrap items-center gap-4">
              <SearchField value={query} onChange={setQuery} placeholder="Search task, person or shift" className="w-[280px]" />
              <SegmentedControl label="Demo" value={sgSeg} onChange={setSgSeg} options={[{ id: "list", label: "List", icon: "unordered_list" }, { id: "cards", label: "Cards", icon: "grid" }, { id: "cal", label: "Calendar", icon: "cal" }]} />
            </div>
          </Specimen>
          <Specimen name="DueDateChip" spec="first Task Card “DateChip” as SP3 Badge Chip with calendar icon · tone = task status · subtaskCount?">
            <div className="flex flex-wrap gap-3">
              <DueDateChip date="08.10." time="06:30" tone="success" />
              <DueDateChip date="08.10." time="14:00" tone="info" />
              <DueDateChip date="07.10." time="22:00" tone="warning" />
              <DueDateChip date="05.10." time="22:00" tone="error" />
              <DueDateChip date="09.10." time="12:00" tone="default" subtaskCount={3} />
            </div>
          </Specimen>
          <Specimen name="TeamBreakdown" spec="stacked bar per team (tone accents, empty = slider-background) · % done · legend · hover a segment → Tooltip">
            <div className="w-[min(560px,100%)] pt-8">
              <TeamBreakdown
                segments={[
                  { key: "done", label: "Done", tone: "success" },
                  { key: "overdue", label: "Overdue", tone: "error" },
                ]}
                rows={[
                  { id: "1", team: "Housekeeping", counts: { done: 3, overdue: 3 } },
                  { id: "2", team: "Kitchen", counts: { done: 18, overdue: 1 } },
                ]}
              />
            </div>
          </Specimen>
          <Specimen name="UpcomingList (DateTile + UpcomingRow)" spec="date tile · title · meta · recurrence (repeat icon when recurring)">
            <div className="w-[min(480px,100%)] bg-white rounded-[var(--sp-radius-2x)]">
              <UpcomingList
                items={[
                  { id: "1", date: new Date(2026, 9, 9), title: "Order brew group seal", meta: "Kristina Barac · 17:00", repeat: "One-time" },
                  { id: "2", date: new Date(2026, 9, 9), title: "Escape route briefing", meta: "All staff · 18:00", repeat: "One-time", progress: { done: 5, total: 10 } },
                  { id: "3", date: new Date(2026, 9, 12), title: "Clean coffee machine", meta: "Kristina Barac · 22:30", repeat: "Weekly", recurring: true },
                ]}
                today={new Date(2026, 9, 8)}
              />
            </div>
          </Specimen>
          <Specimen name="DonutChart + BarChart" spec="segment / bar colours = notification accents · empty / not done = basics/slider-background">
            <Panel title="Completion" meta="05.10. – 11.10.2026">
              <DonutChart
                centerValue="21%" centerLabel="13 of 63 done"
                segments={[
                  { key: "done", label: "Done", value: 13, tone: "success" },
                  { key: "open", label: "Open", value: 46, tone: "info" },
                  { key: "overdue", label: "Overdue", value: 2, tone: "error" },
                ]}
              />
              <BarChart
                data={[
                  { key: "1", label: "Mo", sublabel: "05.10.", done: 9, total: 12, current: true },
                  { key: "2", label: "Tu", sublabel: "06.10.", done: 0, total: 8, future: true },
                  { key: "3", label: "We", sublabel: "07.10.", done: 0, total: 10, future: true },
                  { key: "4", label: "Th", sublabel: "08.10.", done: 0, total: 0, future: true },
                ]}
              />
            </Panel>
          </Specimen>
        </Section>

        <Section title="Menu List" intro="Sophi's Pet “Menu List Item” 253:10863 — normal · hover · pressed (try them) · selected · disabled.">
          <Specimen name="MenuListItem" spec="<MenuListItem label icon? selected? disabled? />">
            <div className="w-40 flex flex-col py-2 bg-sp-form-control-background-color border border-solid border-sp-border-line rounded-[var(--sp-radius-2x)] overflow-hidden">
              <MenuListItem label="Today" selected />
              <MenuListItem label="Yesterday" />
              <MenuListItem label="This week" />
              <MenuListItem label="With icon" icon="cal" />
              <MenuListItem label="Disabled" disabled />
            </div>
          </Specimen>
          <Specimen name="MultiSelectDropdown" spec="<MultiSelectDropdown label icon options value onChange allLabel /> — empty value = all; header Groups / Location filter">
            <div className="h-56">
              <MultiSelectDropdown
                label="Location" icon="pin" allLabel="All locations" value={sgMulti} onChange={setSgMulti}
                options={[{ id: "a", label: "Makarska" }, { id: "b", label: "Split" }, { id: "c", label: "Zagreb" }]}
              />
            </div>
          </Specimen>
        </Section>

        <Section title="Forms" intro="Used by the New task modal (organism NewTaskModal, Modal, RecipientSelect) — open it with “New task” in the prototype.">
          <Specimen name="TextField · FormField" spec="<FormField label required error?><TextField value onChange multiline? invalid? /></FormField>">
            <div className="flex flex-col gap-4 w-80">
              <FormField label="Title" required><TextField value={sgText} onChange={setSgText} placeholder="Describe the title…" /></FormField>
              <FormField label="Title" required error="Enter a title."><TextField value="" onChange={() => {}} invalid /></FormField>
              <FormField label="Description"><TextField multiline value="" onChange={() => {}} placeholder="Describe the task…" /></FormField>
            </div>
          </Specimen>
          <Specimen name="Switch" spec="<Switch checked onChange label hint? />">
            <Switch checked={sgSwitch} onChange={setSgSwitch} label="Priority" hint="Shows a red “!” in lists." />
          </Specimen>
          <Specimen name="Toast" spec="<Toast message actions? onClose />">
            <Toast message="Task created." actions={[{ label: "View", onClick: () => {} }, { label: "Undo", onClick: () => {} }]} onClose={() => {}} />
          </Specimen>
        </Section>

        <Section title="Organisms" intro="Composed blocks. AppShell (template) = HeaderNavbar + SidebarNavigation + content slot — see the prototype.">
          <Specimen name="PageHeader + DateRangePicker" spec="Field = Header Date Spinner structure in Input Datepicker style · popover = Menu List presets + Calendar Range">
            <div className="min-h-[380px]">
              <PageHeader
                title="Dashboard"
                actions={<><DateRangePicker value={range} onChange={setRange} /><Button icon="plus" label="New task" /></>}
              />
            </div>
          </Specimen>
          <Specimen name="CalendarRange" spec="Sophi's Pet “Calendar” Type=Range 884:2259 · 1st click = single day, 2nd click = range">
            <CalendarRange value={range} onChange={(r) => setRange(r)} />
          </Specimen>
          <Specimen name="PageHeader + WeekPicker (week-only variant)" spec="Title/H1 Page Title · WeekPicker = Header Date Spinner structure in Input Datepicker style">
            <PageHeader
              title="Dashboard"
              actions={<><WeekPicker value={week} onChange={setWeek} /><Button icon="plus" label="New task" /></>}
            />
          </Specimen>
          <Specimen name="CalendarWeek" spec="Sophi's Pet “Calendar” Type=Week 3002:5848 · click a row to select the week">
            <CalendarWeek value={week} onChange={setWeek} />
          </Specimen>
          <Specimen name="StatCard" spec="Card Tile (contrast) + Status Chip colours · <StatCard icon tone value label people? selected? />">
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))" }}>
              {([
                ["success", "check", "Done"], ["info", "folder", "Open"],
                ["error", "warning", "Overdue"], ["expired", "hourglass", "Missed"], ["new", "add_circle", "New"],
                ["ai", "magic", "AI"], ["default", "unordered_list", "Default"],
              ] satisfies [StatTone, IconName, string][]).map(([tone, icon, label], i) => (
                <div key={tone}>
                  <StatCard tone={tone} icon={icon} label={label} value={i + 1} people={i} selected={tone === "info"} onClick={() => {}} />
                  <Caption>tone {tone}{tone === "info" ? " · selected" : ""}</Caption>
                </div>
              ))}
            </div>
          </Specimen>
          <Specimen name="HeaderNavbar" spec="<HeaderNavbar location group userEmail on…Click? />">
            <div className="min-w-[1100px]"><HeaderNavbar {...HEADER} /></div>
          </Specimen>
          <Specimen name="SidebarNavigation" spec="<SidebarNavigation sections selectedId onSelect />  · click sections to expand / collapse">
            <div className="h-[820px]">
              <SidebarNavigation sections={NAV_SECTIONS} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </Specimen>
        </Section>
      </main>
    </div>
  );
}
