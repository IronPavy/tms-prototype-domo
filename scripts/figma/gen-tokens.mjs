// Generates src/design-system/sophis-pet.css from a Sophi's Pet 3 variable export.
// Usage: node scripts/figma/gen-tokens.mjs scripts/figma/sp3-tokens.json src/design-system/sophis-pet.css
// The export (sp3-tokens.json) is written with the Figma MCP from the SP3 file — see CLAUDE.md.
import fs from 'node:fs';

const [,, src, out] = process.argv;
const t = JSON.parse(fs.readFileSync(src, 'utf8'));

const slug = (s) => s.replace(/[()&]/g, '').trim().replace(/[\s/,]+/g, '-').replace(/-+/g, '-').toLowerCase();

// Theme (colour) names: "text styles/x" → text-x ("text styles/text" → text), rest slugged
function colorName(path) {
  if (path.startsWith('text styles/')) {
    const n = slug(path.slice(12));
    return n === 'text' ? 'text' : n.startsWith('text-') ? n : 'text-' + n;
  }
  return slug(path);
}
function sizeName(path) {
  const [group, ...rest] = path.split('/');
  const n = slug(rest.join('-'));
  if (group === 'Border Radius') return 'radius-' + n;
  if (group === 'Spacing & Size') return 'space-' + n;
  if (group === 'Font Size') return n.endsWith('line-height') ? 'line-height-' + n.replace(/-line-height$/, '') : 'font-size-' + n;
  if (group === 'Icon Size') return 'icon-size-' + n;
  if (group === 'Border') return 'border-width-' + n;
  throw new Error('unknown size group ' + group);
}

const used = new Set();
const uniq = (n) => { if (used.has(n)) throw new Error('collision --sp-' + n); used.add(n); return n; };

const colors = Object.entries(t.theme).map(([path, [light, dark]]) => {
  if (!/^#[0-9A-F]{6,8}$/i.test(light) || !/^#[0-9A-F]{6,8}$/i.test(dark)) throw new Error('unresolved colour ' + path);
  return { name: uniq(colorName(path)), path, light, dark };
});
const sizes = Object.entries(t.sizes).map(([path, v]) => ({ name: uniq(sizeName(path)), path, v }));
const density = Object.entries(t.density).map(([path, v]) => ({ name: uniq('density-' + slug(path)), path, v }));

const px = (v) => (v === 0 ? '0' : v + 'px');
const group = (list, key) => list.reduce((m, x) => { const g = key(x); (m[g] ||= []).push(x); return m; }, {});

let o = `/* ════════════════════════════════════════════════════════════════
   Sophi's Pet 3 — design tokens (GENERATED — do not edit by hand)
   Source:  ${t.source}
   Script:  node scripts/figma/gen-tokens.mjs scripts/figma/sp3-tokens.json src/design-system/sophis-pet.css
   Naming:  --sp-<figma path>   "brand/fill/normal" → --sp-brand-fill-normal
            "text styles/label" → --sp-text-label · "border (line)" → --sp-border-line
            "Spacing & Size/3x" → --sp-space-3x · "Border Radius/2x" → --sp-radius-2x
   Colours are also Tailwind utilities: bg-sp-…, text-sp-…, border-sp-…
   Light theme on :root, dark theme on [data-theme="dark"].
   Do not add project-specific values here — use tms.css.
   ════════════════════════════════════════════════════════════════ */

:root {
`;
const colorGroups = group(colors, (c) => (c.path.includes('/') ? c.path.split('/')[0] : 'basics'));
for (const [g, list] of Object.entries(colorGroups)) {
  o += `  /* ── ${g} ── */\n`;
  for (const c of list) o += `  --sp-${c.name}: ${c.light}; /* ${c.path} */\n`;
  o += '\n';
}
const sizeGroups = group(sizes, (s) => s.path.split('/')[0]);
for (const [g, list] of Object.entries(sizeGroups)) {
  o += `  /* ── ${g} ── */\n`;
  for (const s of list) o += `  --sp-${s.name}: ${s.name.startsWith('radius-pill') ? '9999px' : px(s.v)}; /* ${s.path} */\n`;
  o += '\n';
}
o += `  /* ── Density (Default) ── */\n`;
for (const d of density) o += `  --sp-${d.name}: ${px(d.v)}; /* ${d.path} */\n`;

o += `\n  /* ── Effect styles ── */\n`;
for (const [name, effects] of t.effects) {
  const css = effects.map(([type, x, y, r, s, c]) => `${type === 'INNER_SHADOW' ? 'inset ' : ''}${px(x)} ${px(y)} ${px(r)} ${px(s)} ${c}`).join(', ');
  o += `  --sp-${slug(name)}: ${css}; /* ${name} */\n`;
}
o += `\n  /* ── Typography ── */\n  --sp-font-family: 'Roboto', sans-serif;\n}\n\n`;

o += `/* Dark theme (Figma Theme mode "dark") */\n:root[data-theme="dark"] {\n`;
for (const c of colors) if (c.dark !== c.light) o += `  --sp-${c.name}: ${c.dark};\n`;
o += `}\n\n@theme inline {\n`;
for (const c of colors) o += `  --color-sp-${c.name}: var(--sp-${c.name});\n`;
o += `}\n\n/* ── Text styles (Figma "Roboto Standard/*" and "Title/*") ── */\n`;

const weight = { Regular: 400, Medium: 500, Bold: 700, Italic: 400, 'Medium Italic': 500 };
const sizeVar = { 10: '2xs', 11: 'xs', 12: 's', 13: 'm', 16: 'l', 20: 'xl', 25: '2xl', 32: '3xl', 41: '4xl' };
for (const [name, style, size, lh, deco] of t.text) {
  const cls = name.startsWith('Title/') ? 'sp-title-' + slug(name.split('/')[1].split(' ')[0]) : 'sp-text-' + slug(name.split('/')[1]);
  const italic = style.includes('Italic') ? 'italic ' : '';
  const line = lh ? `var(--sp-line-height-m)` : '1';
  o += `.${cls} { font: ${italic}${weight[style]} var(--sp-font-size-${sizeVar[size]})/${line} var(--sp-font-family);${deco === 'UNDERLINE' ? ' text-decoration: underline;' : ''} } /* ${name} */\n`;
}

o += `
/* ── Interaction overlays (SP3 "hover" 7% / "active" 11% layered on top of any fill) ── */
.sp-interactive:hover:not(:disabled):not([aria-disabled="true"])  { background-image: linear-gradient(var(--sp-hover), var(--sp-hover)); }
.sp-interactive:active:not(:disabled):not([aria-disabled="true"]) { background-image: linear-gradient(var(--sp-active), var(--sp-active)); }
`;

fs.writeFileSync(out, o);
console.log(`wrote ${out}: ${colors.length} colours, ${sizes.length} sizes, ${density.length} density, ${t.text.length} text styles, ${t.effects.length} effects`);
