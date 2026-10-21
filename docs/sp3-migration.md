# Sophi's Pet 2 → Sophi's Pet 3

Source: "Sophis Pet 3" — https://www.figma.com/design/uoppu4TRLnHVEDl5ZlQs7B (viewer access is enough to read it).
Tokens: `scripts/figma/sp3-tokens.json` (Figma export) → `node scripts/figma/gen-tokens.mjs scripts/figma/sp3-tokens.json src/design-system/sophis-pet.css`.

## What changed in the system
| Area | SP2 (old) | SP3 (now) |
|---|---|---|
| Token model | per component (`status-chip-…`, `notification-…`, `tabs-…`) | **Variants**: `brand · neutral · info · success · warning · danger · new · ai` × `fill / border / on` × `dark / normal / light (+ on/surface)` |
| Brand | primary #007F9C | brand/fill/normal **#00738E** |
| Info | = primary #007F9C | own blue **#1171A2** |
| Success accent | #08A169 | **#068154** |
| Label text | #5E737A | text label **#33464C** (old value is now `subtitle` / `placeholder`) |
| Link text | primary #007F9C | text-link **#006880** |
| Icons | #8BA8B2 (TMS override #688B99) | icon **#688B99** (override dropped) |
| Hover / pressed | solid colours | overlays: hover 7 %, active 11 % (`.sp-interactive`) |
| Form controls | border frosty blue #D0D9DE | form-control-border-color **#688B99** |
| Font size M | 14 (TMS override 13) | **13** (override dropped) · H1 24 → **25** · new Body styles 13/21 |
| Focus | focus/surfie #007F9C | Focus Brand **#00738E** (+ Warning / Danger / AI) |
| Shadow | shadow/small | Shadow M (same value) |
| Spacing / radius names | `0,5 · 0,75 · 1 · 1,5` / `half · standard · double · circular` | `1x 2x 3x 4x 5x 6x …` (4 px steps) / `1x 2x 3x 4x pill` |
| Dark theme | – | every colour has a dark value (`[data-theme="dark"]`) |

## Token rename (code)
`--sp-text-font-standard → --sp-text` · `text-font-label → text-label` · `text-font-hint → text-placeholder` · `text-font-primary → text-link` ·
`text-font-title → text-title` · `basics-lines-and-borders → border-line` · `basics-hover/pressed → hover/active` · `basics-selected → selected` ·
`basics-input-background → form-control-background-color` · `basics-icons → icon` · `basics-app-background → surface-default` ·
`card-contrast-background → surface-raised` · `primary-standard → brand-fill-normal` · `notification-X-accent → X-fill-normal` ·
`status-chip-filter-pill-X-background / hover / text-font → X-fill-light / X-border-light / X-on-surface` (default → neutral, error → danger) ·
`space-0-5 → space-2x` (etc.) · `radius-standard → radius-2x` · `focus-surfie → focus-brand` · `shadow-small → shadow-m`.
Full table: the codemod map used for the switch (499 replacements in 53 files).

## Components
| Ours | SP3 component | Change |
|---|---|---|
| Button | Button (1:586) | primary = accent, secondary = outlined (on/surface text), tertiary = plain; hover overlay |
| StatusChip / FilterPill | Badge Chip (39:5407) / Badge Pill (101:3441) | fill/light + border/light; chip 20 px Small Medium · filter pill = Badge Pill styling at Density height 32 px, Medium label |
| Panel / StatCard | Card (497:3227) | padding 16 / 20, gap 16 (KPI cards keep the tone-stroke hover) |
| Tooltip | Tooltip (507:20447) | one dark style (tooltip-background), Body Standard, 14 × 6 tail — error/warning types removed |
| TabBar | Tab Item (2101:6940) Plain | padding 6 / 8, inactive tabs show the 2 px border-line |
| SegmentedControl | Radio Button Group (Segmented Control) (2087:6675) | pill group + pill items, #688B99 border |
| SearchField, date fields | Search (172:2309) / Input (163:1751) | #688B99 border, Standard text |
| Breadcrumb | Breadcrumb (497:2927) | gap 4, current page Medium in title colour |
| SidebarNavigation | Side Menu (621:12085) | 270 px, right border line, Search on top (filters items), folders with caret + 21 px indent guide, Divider before Jetzt kaufen / Hilfe |
| SidebarNavItem | Side Menu Item (424:2194) / Item Folder (2004:18517) | 40 px, 16 px icons, selected = 2 px brand left border, caret up when open |
| HeaderNavbar / HeaderButton | Header (401:2012) / Header Button (401:1597) | padding 8, gap 4, Medium label; hover brand/90, active brand/80; right group gap 16 |
| EmptyState (new) | Empty State (512:4561) | framed icon + title + Body text + optional button — used by the lists and the Tasks placeholder |
| MenuListItem | Dropdown Item (2033:5720) | icon colours from SP3 |
| ProgressBar | Progress Bar (525:4126) | track = border (line) |
| Calendar, ScrollArea, charts | – (not in SP3) | kept, recoloured with SP3 tokens |

## Open points
- **Figma:** SP3 is not a library the Foundation file can use (not published / not shared with the team). The Figma Dashboard stays on SP2 until
  SP3 is published (or duplicated to drafts and published); then swap variables + instances using the tables above.
- **Header search field** has no SP3 mapping yet (`--tms-header-input-background` = brand/fill/dark).
- **Scrollbar** colour uses `text-subtitle` (#5E737A, same value as before) — SP3 has no scrollbar component.
