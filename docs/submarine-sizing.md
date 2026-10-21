# "Submarine" (New task) — min / max sizing for Figma

The New task flow ("submarine") is built from Sophi's Pet 3 parts. Every size below lives in code as a CSS variable in
`src/design-system/tms.css` (`--tms-…`), so code and Figma use the same numbers.
In Figma set them on the **auto-layout** frames: *Resizing* = Fixed / Hug / Fill, and add **min / max width / height** in the
frame's size menu (⋯ next to W/H). "Fill" = `width: 100%` of the parent, capped by the max.

| Component | Code token(s) | Width (Figma) | Height (Figma) |
|---|---|---|---|
| **New task modal** (`Modal`) | `--tms-modal-min-width` 360 · `--tms-modal-max-width` 672 | Fill, min 360, max 672 (never wider than the screen − 32) | Hug, max = screen − 32 — the body scrolls, header + footer stay |
| **Set date and time dialog** | min 360 · `--tms-dialog-max-width` 680 | Fill, min 360, max 680 | Hug, max = screen − 32 |
| **Discard confirmation** | `--tms-confirm-min-width` 320 · `--tms-confirm-max-width` 440 | Fill, min 320, max 440 | Hug |
| Text field · Select · Date field | `--tms-field-min-width` 120 | Fill, min 120 | Fixed 32 |
| Description (text area) | `--tms-textarea-min-height` 64 · `--tms-textarea-max-height` 200 | Fill | Hug (grows with text), min 64, max 200, then scrolls |
| Recipient field | `--tms-recipient-min-width` 240 · `--tms-recipient-max-height` 96 | Fill, min 240 | Hug, min 32, max 96 (chips wrap, then scroll) |
| Recipient popover | `--tms-recipient-popover-min-width` 320 · `--tms-recipient-popover-list-max-height` 240 | = field width, min 320 | Hug: tabs + list (max 240, scrolls) + footer |
| Select popover (Task series) | min 176 | = field width, min 176 | Hug, max 240, then scrolls |
| Solution type menu | `--tms-menu-min-width` 176 · `--tms-menu-max-width` 280 · `--tms-menu-max-height` 240 | Hug, min 176, max 280 (right edge = button) | Hug, max 240 |
| Date popover (Calendar) | `--tms-calendar-popover-width` 280 | Fixed 280 | Hug |
| Time field | `--tms-time-min-width` 120 · `--tms-time-max-width` 224 | Fill, min 120, max 224 | Fixed 32 |
| Switch row · Day checkbox · Radio | — | Hug | Fixed 32 |
| Toast | `--tms-toast-min-width` 280 · `--tms-toast-max-width` 480 | Hug, min 280, max 480 | Hug (min 48) |

## Layout rules (match these in Figma)
- Modal paddings: 5x (20) left / right / top, footer 4x; gaps between blocks 4x (16); inside a block 1x–3x.
- Dialog body = vertical auto-layout, **Fill** children; only the body scrolls (`overflow-y: auto`), never horizontally.
- Floating panels (Recipient popover, selects, date popover, Solution type menu) are separate frames placed **below** their trigger
  (4px gap; the Recipient popover overlaps the field border by 1px). In the build they float above the dialog (portal, `position: fixed`),
  flip above the trigger when there is no room below and stay inside the screen — so they never add a scrollbar to the dialog.
  Components: `molecules/Popover.tsx`.
- Two-column areas (e.g. calendar + "Task due:") use a 280px fixed left column and a Fill right column that may shrink
  (min width 0); below 640px they stack into one column.

## Where it is in code
`tms.css` (tokens) · `molecules/Modal.tsx` (width / min width / max height) · `atoms/TextField.tsx` (field min width, text area min/max)
· `molecules/Popover.tsx` (matchWidth / minWidth / maxWidth / maxHeight) · `molecules/Toast.tsx` · `organisms/NewTaskModal.tsx` · `organisms/DueDateModal.tsx`.
