// generates 3 static mockups (SP3 look) of the recipient picker -> docs/mockups/*.html, rendered to PNG with headless Chrome
const fs = require("fs");
const path = require("path");
const out = __dirname;

const css = `
*{box-sizing:border-box} body{margin:0;background:#E2E9EC;font-family:Roboto,Segoe UI,Arial,sans-serif;color:#04161C;font-size:14px}
.stage{width:760px;padding:32px;display:flex;flex-direction:column;gap:12px}
.cap{font-size:12px;color:#33464C;letter-spacing:.02em}
.modal{background:#fff;border-radius:8px;box-shadow:0 8px 16px #00181E33;width:696px;display:flex;flex-direction:column}
.mh{padding:20px 24px 12px;font-size:20px;font-weight:500}
.mb{padding:0 24px 20px;display:flex;flex-direction:column;gap:14px}
.mf{padding:14px 24px;border-top:1px solid #D0D9DE;display:flex;gap:8px;justify-content:flex-end}
.btn{height:40px;padding:0 16px;border-radius:8px;display:inline-flex;align-items:center;font-weight:500;border:1px solid #00738E;color:#00738E;background:#fff}
.btn.p{background:#00738E;color:#fff}
.lbl{font-weight:500}
.seg{display:inline-flex;background:#E2E9EC;border-radius:8px;padding:2px;align-self:flex-start}
.seg span{height:32px;padding:0 14px;display:inline-flex;align-items:center;gap:6px;border-radius:6px;font-weight:500;color:#33464C}
.seg span.on{background:#fff;color:#04161C;box-shadow:0 1px 2px #00181E33}
.ico{width:20px;height:20px;flex:none;display:inline-block}
.panel{border:1px solid #D0D9DE;border-radius:8px;overflow:hidden;max-height:420px}
.loc{border-bottom:1px solid #D0D9DE}.loc:last-child{border-bottom:0}
.row{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 8px}
.row.loch{background:#F2F6F7;font-weight:500}
.row.grp{padding-left:40px;border-top:1px solid #E2E9EC;font-weight:500}
.row.leaf{padding-left:72px;border-top:1px solid #EEF2F3}
.row .sp{flex:1}
.cb{width:20px;height:20px;border:2px solid #688B99;border-radius:4px;flex:none;background:#fff;position:relative}
.cb.on{background:#00738E;border-color:#00738E}.cb.on:after{content:"";position:absolute;left:5px;top:1px;width:5px;height:10px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}
.cb.part{background:#00738E;border-color:#00738E}.cb.part:after{content:"";position:absolute;left:3px;top:7px;width:10px;height:2px;background:#fff}
.chev{width:20px;height:20px;flex:none;color:#688B99}
.pill{height:20px;padding:0 6px;border-radius:4px;background:#DCEBF7;border:1px solid #B5D3EC;font-size:12px;font-weight:500;display:inline-flex;align-items:center}
.time{font-size:12px;color:#33464C;font-variant-numeric:tabular-nums}
.av{width:24px;height:24px;border-radius:50%;background:#BDDEE5;color:#003A47;font-size:11px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;flex:none}
.cnt{height:20px;padding:0 6px;border-radius:4px;background:#E2E9EC;border:1px solid #C5D4D9;font-size:12px;font-weight:500;display:inline-flex;align-items:center}
.cnt.b{background:#E1F1F5;border-color:#BDDEE5;color:#00738E}
.sum{border:1px solid #D0D9DE;border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;background:#fff}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{height:28px;padding:0 6px 0 10px;border-radius:14px;background:#F2F6F7;border:1px solid #C5D4D9;display:inline-flex;align-items:center;gap:6px}
.chip .x{color:#688B99;font-size:16px;line-height:1;padding:0 2px}
.muted{font-weight:500;color:#33464C;font-size:12px}
.search{height:40px;border:1px solid #C5D4D9;border-radius:8px;display:flex;align-items:center;gap:8px;padding:0 12px;color:#688B99}
.note{font-size:12px;color:#33464C;display:flex;gap:6px;align-items:center}
`;

const svg = {
  chevR: '<svg class="chev" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 5l5 5-5 5"/></svg>',
  chevD: '<svg class="chev" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l5 5 5-5"/></svg>',
  pin: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="#688B99" stroke-width="1.6"><path d="M10 18s6-5.2 6-9.5A6 6 0 0 0 4 8.5C4 12.800 10 18 10 18z"/><circle cx="10" cy="8.500" r="2"/></svg>',
  grp: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="#688B99" stroke-width="1.6"><circle cx="7" cy="7" r="2.500"/><circle cx="14" cy="8" r="2"/><path d="M2.500 16c0-3 2-4.500 4.500-4.500S11.500 13 11.500 16M12 12c2-.5 5 .3 5 3.500"/></svg>',
  clock: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="#688B99" stroke-width="1.6"><circle cx="10" cy="10" r="7.500"/><path d="M10 5.500V10l3 2"/></svg>',
  user: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="#688B99" stroke-width="1.6"><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3.300 2.700-5 6-5s6 1.700 6 5"/></svg>',
  search: '<svg class="ico" viewBox="0 0 20 20" fill="none" stroke="#688B99" stroke-width="1.8"><circle cx="9" cy="9" r="5.500"/><path d="M13.500 13.500L17 17"/></svg>',
};
const PC={"FRÜ":["#FFE9C7","#F2C77A"],"SPÄ":["#E3DAF7","#BDA9EA"],"ABE":["#D4EFE0","#8FD0AE"]};
const pill=(c)=>`<span class="pill" style="background:${PC[c][0]};border-color:${PC[c][1]}">${c}</span>`;
const cb = (s) => `<span class="cb ${s || ""}"></span>`;
const ini = (n) => n.split(" ").map((x) => x[0]).join("");
const emp = (n, on, role) => `<div class="row leaf">${cb(on && "on")}<span>${n}</span><span class="sp"></span><span class="muted">${role}</span></div>`;
const shift = (code, name, time, on) => `<div class="row leaf">${cb(on && "on")}${pill(code)}<span>${name}</span><span class="sp"></span><span class="time">${time}</span></div>`;
const loc = (name, state, open, body, count) => `<div class="loc"><div class="row loch">${cb(state)}${svg.pin}<span>${name}</span>${count ? `<span class="cnt b">${count}</span>` : ""}<span class="sp"></span>${open ? svg.chevD : svg.chevR}</div>${open ? body : ""}</div>`;
const grp = (name, state, open, body, n) => `<div class="row grp">${cb(state)}${svg.grp}<span>${name}</span><span class="cnt">${n}</span><span class="sp"></span>${open ? svg.chevD : svg.chevR}</div>${open ? body : ""}`;

const modal = (inner, title = "Neue Aufgabe", foot = "Aufgabe senden") => `
<div class="modal"><div class="mh">${title}</div><div class="mb">${inner}</div>
<div class="mf"><span class="btn">Abbrechen</span><span class="btn p">${foot}</span></div></div>`;
const seg = (on) => `<div class="seg"><span class="${on === "emp" ? "on" : ""}">${svg.user}Mitarbeiter</span><span class="${on === "shift" ? "on" : ""}">${svg.clock}Schicht</span></div>`;
const head = (txt) => `<div style="display:flex;align-items:center;gap:8px"><span class="lbl">Empfänger</span>${txt}</div>`;
const find = `<div class="search">${svg.search}<span>Suchen …</span></div>`;

const chipsEmp = (names) => names.map((n) => `<span class="chip">${n}<span class="x">×</span></span>`).join("");
const chipsShift = (rows) => rows.map(([c, n, t]) => `<span class="chip">${pill(c)}${n}<span class="time">${t}</span><span class="x">×</span></span>`).join("");

/* 1 — Mitarbeiter: group ticked => every employee ticked */
const p1 = `
<div class="stage"><div class="cap">1 / 3 · Empfänger › Mitarbeiter — Standort aufklappen, Gruppe aufklappen. Haken an der Gruppe wählt alle Mitarbeitenden darin einzeln aus.</div>
${modal(`
 <div style="display:flex;align-items:center;gap:12px">${head('<span class="cnt b">4 ausgewählt</span>')}</div>
 ${seg("emp")}${find}
 <div class="panel">
  ${loc("München", "part", true,
    grp("Service", "on", true, emp("Anna Müller", 1, "VZ") + emp("Jonas Weber", 1, "VZ") + emp("Lea Schmidt", 1, "VZ") + emp("Tim Becker", 1, "AZ"), 4) +
    grp("Küche", "", false, "", 5) + grp("Reinigung", "", false, "", 3), 4)}
  ${loc("Frankfurt", "", false, "", "")}
  ${loc("Hamburg", "", false, "", "")}
 </div>
 <div class="sum"><span class="muted">Empfänger (4) — jede Person einzeln, keine Gruppe</span><div class="chips">${chipsEmp(["Anna Müller", "Jonas Weber", "Lea Schmidt", "Tim Becker"])}</div></div>
`)}</div>`;

/* 2 — Schicht: group ticked => every shift of the group ticked */
const p2 = `
<div class="stage"><div class="cap">2 / 3 · Empfänger › Schicht — Standort › Gruppe › Schichten (KÜRZEL · Name · Zeitraum). Gruppe wählt jede Schicht einzeln, die Gruppe selbst ist nie Empfänger.</div>
${modal(`
 <div style="display:flex;align-items:center;gap:12px">${head('<span class="cnt b">3 ausgewählt</span>')}</div>
 ${seg("shift")}${find}
 <div class="panel">
  ${loc("München", "part", true,
    grp("Service", "on", true, shift("FRÜ", "Frühschicht", "05:30 – 13:30", 1) + shift("SPÄ", "Spätschicht", "13:30 – 22:00", 1) + shift("ABE", "Abendschicht", "17:00 – 23:30", 1), 3) +
    grp("Küche", "", false, "", 3) + grp("Reinigung", "", false, "", 2), 3)}
  ${loc("Frankfurt", "", false, "", "")}
  ${loc("Hamburg", "", false, "", "")}
 </div>
 <div class="sum"><span class="muted">Empfänger (3) — jede Schicht einzeln</span><div class="chips">${chipsShift([["FRÜ", "Frühschicht", "05:30 – 13:30"], ["SPÄ", "Spätschicht", "13:30 – 22:00"], ["ABE", "Abendschicht", "17:00 – 23:30"]])}</div></div>
`)}</div>`;

/* 3 — Mixed: single pick, partial state, several locations, summary */
const p3 = `
<div class="stage"><div class="cap">3 / 3 · Einzelne Auswahl, mehrere Standorte, gemischt — Teilauswahl zeigt „–“, Zusammenfassung unten ist die einzige Wahrheit (× entfernt eine Person / Schicht).</div>
${modal(`
 <div style="display:flex;align-items:center;gap:12px">${head('<span class="cnt b">5 ausgewählt</span>')}</div>
 ${seg("emp")}${find}
 <div class="panel">
  ${loc("München", "part", true,
    grp("Service", "part", true, emp("Anna Müller", 1, "VZ") + emp("Jonas Weber", 0, "VZ") + emp("Lea Schmidt", 0, "VZ") + emp("Tim Becker", 0, "AZ"), 4) +
    grp("Küche", "", false, "", 5), 1)}
  ${loc("Frankfurt", "part", true,
    grp("Reinigung", "on", true, emp("Marko Horvat", 1, "VZ") + emp("Ivana Kovač", 1, "AZ") + emp("Sven Krause", 1, "VZ") + emp("Eva Lang", 1, "AZ"), 4), 4)}
  ${loc("Hamburg", "", false, "", "")}
 </div>
 <div class="sum"><span class="muted">Empfänger (5)</span><div class="chips">${chipsEmp(["Anna Müller", "Marko Horvat", "Ivana Kovač", "Sven Krause", "Eva Lang"])}</div></div>
`)}</div>`;

[p1, p2, p3].forEach((body, i) => fs.writeFileSync(path.join(out, `recipients-${i + 1}.html`), `<!doctype html><meta charset="utf-8"><style>${css}</style>${body}`));
console.log("ok");
