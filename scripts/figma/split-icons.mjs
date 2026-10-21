import fs from 'node:fs';
const [,, metaFile, secDir, outDir] = process.argv;
const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')).map(x => x.text).join('');
// --- section geometry + icon positions (relative to section) from metadata
const sections = {}; let cur = null; const top = [];
for (const line of meta.split('\n')) {
  let m = line.match(/^  <section id="([^"]+)" name="([^"]+)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
  if (m) { cur = { id: m[1], name: m[2].replace(/&amp;/g,'&'), w: +m[5], h: +m[6], icons: [] }; sections[m[1].replace(':','-')] = cur; continue; }
  m = line.match(/^(\s+)<symbol id="([^"]+)" name="([^"]+)" x="([^"]+)" y="([^"]+)"/);
  if (m) { const depth = m[1].length; const icon = { name: m[3], x: +m[4], y: +m[5] }; if (depth === 2) top.push(icon); else if (depth === 4 && cur) cur.icons.push(icon); else console.log('nested?', m[3], depth); }
}
// --- tiny XML element scanner: returns top-level children of an element string
function children(xml) {
  const out = []; const re = /<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g; let depth = 0, start = -1, m;
  while ((m = re.exec(xml))) {
    const [all, close, , , self] = m;
    if (!close && !self) { if (depth === 0) start = m.index; depth++; }
    else if (close) { depth--; if (depth === 0) out.push(xml.slice(start, m.index + all.length)); }
    else if (self && depth === 0) out.push(all);
  }
  return out;
}
const report = { written: 0, missing: [] }; const manifest = [];
fs.mkdirSync(outDir, { recursive: true });
for (const [file, sec] of Object.entries(sections)) {
  const svg = fs.readFileSync(`${secDir}/${file}.svg`, 'utf8');
  const [, W, H] = svg.match(/<svg width="([\d.]+)" height="([\d.]+)"/).map(Number);
  const ox = (W - sec.w) / 2, oy = (H - sec.h) / 2;
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const kids = children(inner);
  const sectionGroup = kids.find(k => k.startsWith('<g'));
  const defs = kids.find(k => k.startsWith('<defs')) || '';
  const clips = Object.fromEntries(children(defs.replace(/^<defs>|<\/defs>$/g, '')).map(c => [c.match(/id="([^"]+)"/)[1], c]));
  const groups = children(sectionGroup.replace(/^<g[^>]*>/, '').replace(/<\/g>$/, '')).filter(k => k.startsWith('<g'));
  const byId = {}; for (const g of groups) { const id = g.match(/^<g id="([^"]+)"/)?.[1]; if (id) (byId[id] ??= []).push(g); }
  for (const icon of sec.icons) {
    const g = byId[icon.name]?.shift();
    if (!g) { report.missing.push(`${sec.name}/${icon.name}`); continue; }
    const used = [...g.matchAll(/url\(#([^)]+)\)/g)].map(m => clips[m[1]]).filter(Boolean);
    const x = icon.x + ox, y = icon.y + oy;
    const body = g.replace(/fill="#007F9C"/gi, 'fill="currentColor"');
    const out = `<svg width="24" height="24" viewBox="${x} ${y} 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n${body}\n${used.length ? `<defs>\n${used.join('\n')}\n</defs>\n` : ''}</svg>\n`;
    fs.writeFileSync(`${outDir}/${icon.name}.svg`, out); report.written++;
    manifest.push({ name: icon.name, section: sec.name });
  }
}
fs.writeFileSync(`${outDir}/../sophis-icons.json`, JSON.stringify(manifest, null, 0));
console.log('sections', Object.keys(sections).length, 'top-level icons', top.map(t => t.name).join(','));
console.log(report.written, 'written; missing', report.missing.length, report.missing.slice(0, 20));
