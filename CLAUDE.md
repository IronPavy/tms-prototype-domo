# Aufgaben Management — Prototype

Vite + React 18 + TypeScript + Tailwind v4 + react-router 7. Font: Roboto (Google Fonts).

- Dev server: `npm run dev` → http://localhost:5174 (launch config `aufgaben-management`)
- Type check: `npm run typecheck`
- `@/` aliases `src/`

## Structure
- `src/prototype/` — prototype screens (`PrototypePage.tsx` = `/`), mock data in `data.ts`
- `src/styleguide/StyleguidePage.tsx` — `/styleguide`: all tokens (read live from CSS), icon browser, components + states
- `src/design-system/` — tokens, icons and components, exported via `index.ts`
- `src/Router.tsx` — routes
- `scripts/figma/` — generators for tokens and icons (see below)

## Design system: Sophi's Pet 3 (work by it)
- **Library:** "Sophis Pet 3" — https://www.figma.com/design/uoppu4TRLnHVEDl5ZlQs7B (viewer access; read with the Figma MCP —
  `get_metadata`, `get_screenshot`, read-only `use_figma` scripts). One page per component (Button, Badge, Card, Input,
  Radio & Segmented Control, Tab Group, Side Menu, Dropdown, Tooltip, …).
- **Icons:** "Sophis Icons (Copy)" — https://www.figma.com/design/PF9u5lmE0g1sVuTt1JtLKa (627 icons, 24px grid)
- **Screens:** "Foundation of the new TMS view" — `DsEpcoyPN2RAr5ABENsL4t`, page "Pavo". Still on SP2 in Figma:
  SP3 isn't a library that file can use yet (see `docs/sp3-migration.md`).
- SP2 ("Sophi's Pet - Q2-2024 (Copy)", sG9MLVjkS6KIEPHeYm0SOA) is retired — don't use it for new work.

Rule: before building anything, look for the matching SP3 component (its page in the SP3 file) and use its tokens + states.
Build a component only when a screen needs it.

### Tokens
- `sophis-pet.css` — GENERATED from `scripts/figma/sp3-tokens.json` (export of the SP3 Theme, Sizes, Density, text + effect styles):
  `node scripts/figma/gen-tokens.mjs scripts/figma/sp3-tokens.json src/design-system/sophis-pet.css`.
  Re-export the JSON with a read-only `use_figma` script on the SP3 file when the library changes.
- Naming `--sp-<figma path>`: `brand/fill/normal` → `--sp-brand-fill-normal`, `text styles/label` → `--sp-text-label`,
  `border (line)` → `--sp-border-line`, `Spacing & Size/3x` → `--sp-space-3x` (4px steps), `Border Radius/2x` → `--sp-radius-2x`.
  Variants: `brand · neutral · info · success · warning · danger · new · ai` × `fill|border` `dark|normal|light` + `on/dark|normal|light|surface`.
  Colours are Tailwind utilities (`bg-sp-surface-raised`, `text-sp-text-label`, `border-sp-border-line`).
  Text styles as classes: `.sp-text-standard|medium|bold|italic|body-standard|small|small-medium|…`, `.sp-title-h1|h2|h3`.
  Effects: `--sp-focus-brand|warning|danger|ai`, `--sp-shadow-m`. Light theme on `:root`, dark on `[data-theme="dark"]`.
- Hover / pressed = SP3 overlays: add class `sp-interactive` (layers `--sp-hover` 7% / `--sp-active` 11% over any fill).
- `tms.css` — ONLY values SP3 doesn't define (`--tms-*`): raw 2/5/6px paddings, header search bg, help / promo, layout widths.
- Never hard-code hex/px values in components — use `--sp-*`, or add a `--tms-*` token with a comment.

### Icons
- `assets/sophis-icons/*.svg` — the whole library, file name = Figma icon name. `atoms/iconNames.ts` (GENERATED) types them.
- `<Icon name size={12|16|24|48} color? />` — CSS mask, colour from any token. Never hand-draw icons.
- Re-generate when Figma changes: export each section node of the icon file as SVG (`download_assets`,
  format svg) + `get_metadata` of page `0:1`, then `node scripts/figma/split-icons.mjs <metadata.json> <sectionDir> <outDir>`
  and regenerate `iconNames.ts`.

### Components
(Node ids below are SP2 history; the SP3 component each one now follows is in `docs/sp3-migration.md` → Components.
 `utils/tones.ts` maps tones to SP3 variants: default→neutral, error→danger.)
- atoms: `Icon`, `ProductLogo`, `TmsLogo`,
  `Button` (library "Button" 37:48 — primary / secondary / tertiary, icon, dropdown, hover, pressed, focus, disabled)
- molecules: `HeaderButton` (library "Header Button" 318:146 / "Menu Button" 13607:16093 — normal, hover, pressed, active, disabled),
  `SidebarNavItem` (library "Sidebar Navigation Item" 49:52 — level 0/1, normal, hover, pressed, open, selected, disabled, promo tones),
  `PageHeader` (Title/H1 Page Title + actions slot)
- organisms: `HeaderNavbar`, `SidebarNavigation` (data-driven `NavSection[]`, expand/collapse),
  `CalendarWeek` (library "Calendar" Type=Week 3002:5848 + "Calendar / Day" states 388:145),
  `WeekPicker` (‹ field › — "Header Date Spinner" 864:2326 structure in "Input Dropdown Datepicker Textfield" style, opens CalendarWeek),
  `CalendarRange` (library "Calendar" Type=Range 884:2259 — 1st click = single day, 2nd click = range, hover preview),
  `DateRangePicker` (‹ field › + popover: preset Menu List — Today … This year — and CalendarRange; ‹ › step by day/week/month/length),
- molecules (cont.): `MultiSelectDropdown` (compact checkbox dropdown with an "All" row) — used for the header Groups + Location filters: `prototype/scope.tsx` (`ScopeProvider`, `ScopeFilters`, `useScope`), model `ORG_GROUPS` / `LOCATIONS` / `inScope` in `prototype/data.ts`; the scope filters every Dashboard and Tasks data source and is shared between the two pages
- forms: atoms `TextField` (single/multi-line), `Switch`; molecules `FormField` (label/required/error), `Modal` (portal, focus trap, Esc), `RecipientSelect` (chips field + attached popover with SP3 tabs People / Teams / Shifts: people grouped by team, Teams with "N people" + "All teams" select-all, Shifts from the duty roster; footer "N selected · Done"; data `PEOPLE` / `SHIFTS` / `recipientsForScope` in `prototype/data.ts`), `Toast`; organism `NewTaskModal` (Figma "submarine task new" 83:1854, English labels: Recipient*, Title*, Description + attachments, Due date / Subtasks / Solution type inline panels, Switches, Summary, Cancel · Save as draft · Send, discard confirmation). `prototype/tasksStore.tsx` = created tasks + drafts + toast (Undo/View); created tasks appear in Tasks and the KPI counts, drafts in the Drafts tab (Continue / Delete). Both "New task" buttons open it.
- sizing: min / max width + height of the submarine components = `--tms-*` tokens in `tms.css`, table + Figma settings in `docs/submarine-sizing.md`; dropdown panels use `molecules/Popover.tsx` (portal, fixed, flips, never adds a scrollbar to a dialog) — SelectField, DateField, RecipientSelect, MultiSelectDropdown and the Solution type menu all use it.
- due date: organism `DueDateModal` ("Set date and time", opened from the New task dialog's Due date button, arrow = back; series No repetition (Quick planning: date + calendar) / Daily / Weekly (week rows, Add week) / Monthly / Yearly, Start + End "no end", time: one time · range · all day; Save disabled while invalid) with atoms `Checkbox`, `Radio`, molecules `SelectField`, `DateField`, `Modal` props `onBack`/`subtitle`, `CalendarRange single`; logic + labels in `utils/due.ts` (`DueSettings`, `dueLabel`, `scheduleLabel`, `dueErrors`). `NewTaskValues.due` holds it.
- molecules (cont.): `MenuListItem` (library "Menu List Item" 253:10863 — normal, hover, pressed, selected + check, disabled)
- `utils/datePresets.ts` — DATE_PRESETS, matchPreset, shiftRange
- atoms (cont.): `StatusChip` (library "Status Chip & Filter Pill" 13689:7110, Type=status chip), `Link` (library "Link" 383:157),
  `Tooltip` (library "Tooltip" 256:11369, Position=top · normal/error/warning · tail = exported Figma shape · align center/start/end)
- molecules (cont.): `Panel` (Card Tile contrast + H3 header), `AttentionRow` (tone tile · title · meta · secondary Button — no status chip; status = tile hover hint),
  `ScrollArea` (library "Scrollbar" 2303:4485 as overlay — native bar hidden; 8→20px on hover, thumb 50/65/80%, drag + track click)
- organisms (cont.): `AttentionList` (Divider-separated rows, empty state; optional `limit` adds a "+N more" Link), `DonutChart`, `BarChart`
  (stacked done / not done, dashed planned bars for upcoming buckets, today outline, left y-axis with nice ticks, library Tooltip on hover/focus) — charts are not in the library,
  built from tokens: segments = notification accents, empty = basics/slider-background
- atoms (cont.): `ProgressBar` (library "Progress Bar" 21744:2489 — 6px, slider-background track, primary fill, tone = accent),
  `StatusDot` (8px, tone accent / slider-background — not in the library)
- molecules (cont.): `ShiftTaskRow` (dot · time · title · person/done time, or "Late" in warning text),
  `SubmissionRow` (form tile info/error · title · person · time · Status Chip OK/Deviation)
- organisms (cont.): `ShiftGroup` (collapsible box: app-background header + ProgressBar + done/total; Divider rows), `SubmissionList`
- molecules (cont.): `DateTile` (day number Large Medium + weekday Extra Small, framed; `highlight` = next day),
  `UpcomingRow` (DateTile · title · optional ProgressBar "n of m done" · meta · recurrence + repeat icon)
- organisms (cont.): `UpcomingList` (grouped by day: tile once per day, Divider only between days),
  `TeamBreakdown` (legend = filter toggles with totals on top · per team name + "n of m done" · stacked bar · % done;
  `activeKey` fades other segments, Tooltip on segment hover)
- atoms (cont.): `FilterPill` (library Status Chip Type=filter pill as toggle — on = tone, off = default), `SearchField` (library "Search", 32px circular)
- molecules (cont.): `Breadcrumb` (library "Breadcrumb" Inline), `SegmentedControl` (library "Segmented Control" — selected primary/standard),
  `PageHeader` now takes `breadcrumb` + `description`
- organisms (cont.): `TabBar` (library "Tabs Item" Style=tertiary, count = Status Chip, arrow-key navigation)
- SP3 shell: `SidebarNavigation` = SP3 "Side Menu" (search, folders + indent guide), `HeaderNavbar` = SP3 "Header";
  `EmptyState` (molecule) = SP3 "Empty State" — use it for every empty list / placeholder.
- Task list: `Avatar` (SP3 Colored Avatar, initials) · `TaskRow` (SP3 Row + Table Cells: task · assignee · due · proof · status · comments,
  `TASK_GRID` columns; due column = `DueDateChip` in the status colour; high priority = `PriorityIndicator` "!" with danger Tooltip) · `TaskList` (day groups in SP3 Cards). `TASK_STATUS` = same labels/icons/tones as KPI cards.
- `TaskCard` / `TaskCardGrid` (organisms, max 4 cards per row) = the first Task Card (reference project) on SP3: header "Assigned to",
  H3 title + PriorityIndicator, DueDateChip (+ subtasks) + schedule icon with Tooltip (`IconHint`), footer creator + created-at (old MetaRow), solution-type icon top-right (none when the task has subtasks), more_vert menu;
  SP3 Card states (hover Shadow M, selected). Due date shown as "08.10.26, 06:30".
- `TaskCalendar` (organism) = week rows of 7 day columns (SP3 Cards; today = selected header + brand border; days outside the
  period faded; no overdue strip); `CalendarTaskItem` = time in status-coloured Badge Chip · Medium title · assignee (person / group icon).
- `DueDateChip` (molecule) = the "DateChip" of the first Task Card (reference project) rebuilt as SP3 Badge Chip + calendar icon.
- `utils/tones.ts` — ONE tone map (bg / fg / border / accent) for KPI cards, chips, rows and charts
  `StatCard` (library "Card Tile" 1821:3346, Contrast=Yes + Status Chip colour tones)
- templates: `AppShell` — header + sidebar + content slot (`children`); menu button toggles sidebar
- `utils/date.ts` — ISO week helpers (Monday first)

## Screens
- `src/prototype/PrototypePage.tsx` maps sidebar ids → pages (`PAGES`). Add new screens there.
- `DashboardPage.tsx` (Aufgaben Management › Dashboard): PageHeader + DateRangePicker + "New task" + 5 StatCards
  (All tasks=default (sum of statuses), Done=success, Open=info, Overdue=error (the "Waiting for approval" status is out of the MVP — to be added in about a month); frosty-blue stroke → tone stroke + shadow/small on hover). Mock numbers in `data.ts` (`statsForRange`).
  Below: Panel "Kritische Aufgaben" (critical tasks; all items in a ScrollArea that fills the row height, no "+N more"; AttentionList, `ATTENTION_ITEMS`, each linked to a KPI via `kpi`) + Panel "Completion"
  (DonutChart + BarChart, `completionSeries` per day/week/month). One `filter` state is shared by KPI cards, donut legend and list.
  Third row: Panel "Today" (`TODAY_SHIFTS` → ShiftGroups) + Panel "Latest form submissions" (`SUBMISSIONS` → SubmissionList),
  both 400px ScrollAreas, header Links "All of today" / "Reports".
  Fourth row: Panel "By team" (`teamsForRange(range)` — the KPI done/overdue split across teams, so it always
  adds up to the cards; lowest share first; segments = `TEAM_SEGMENTS` taken from the cards; joins the shared `filter`)
  + Panel "Coming up" (`UPCOMING` → UpcomingList; ScrollArea fills the row height at xl, max 360px stacked).

- `TasksPage.tsx` (Aufgaben Management › Tasks): H1 + DateRangePicker + "New task" (primary) · TabBar Status/Library/Drafts
  · row 1: status FilterPills (same labels/icons/tones/numbers as the KPI cards, all on by default) + Type SegmentedControl + View SegmentedControl (icon-only, right)
  · row 2: SearchField · `TaskList` (groups from `taskGroupsForRange(range)` in data.ts: "Overdue – still open" first, then one
  Card per day, TODAY badge) filtered by the pills, Type and search. Cards view = `TaskCardGrid`, Calendar view = `TaskCalendar` (same groups). Library / Drafts tabs = EmptyState placeholder.
  Pages get `go(id)` from `PAGES` in PrototypePage for in-app navigation.

## Reference project
Earlier work lives in `C:\Users\Pavo\Desktop\New Task Managment`
(`src/design-system/` = Task Card; `src/SophisPetQ22024Copy/styles.css` = the library variable export used by
`scripts/figma/gen-tokens.mjs`). Only bring files over from there when explicitly asked.

## Review comments (stakeholder feedback)
`src/review/` — shown only when `VITE_REVIEW=1`. **C** = comment mode (click anywhere to place a comment), **Shift+C** = show / hide all, Esc leaves. Name is asked once and kept in localStorage. A pin is anchored to the clicked element (`anchor.ts`: child-index path + click fraction, viewport fallback) and belongs to one sidebar page. Storage (`store.ts`): Supabase when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set (table + RLS in `supabase/schema.sql`, anonymous sign-in, realtime), otherwise localStorage. Deploy: Vercel (`vercel.json`), env vars as in `.env.example`.

## Task detail modal
`organisms/TaskDetailModal.tsx` (+ `molecules/DetailRow`, `HistoryTimeline`): clicking a task (Tasks List / Cards / Calendar, Dashboard attention / Today / Coming up rows) opens it centred. Chips: status · solution type (none with subtasks) · tags · priority; tabs Details / Discussion (n); Subtasks are tickable and add history entries; Discussion takes comments; "Edit task" opens `NewTaskModal mode="edit"` prefilled and Save updates the task (`edits` in `prototype/tasksStore.tsx`, applied with `withEdits`). Dashboard rows are mapped to tasks by `detailTask` / `taskFromAttention|Shift|Upcoming` in `data.ts`. State is prototype-only (lost on reload). "Library task" row is left out until the Library has content.
