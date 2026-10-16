// Validates the country atlas: unknown references, ordering problems and gaps.
//   node tools/check-atlas.js [--list] [--id NGA]
const fs = require('fs'), vm = require('vm');
const { bundle } = require('../build.js');
const ctx = vm.createContext({ console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Promise, setTimeout, document: {}, window: {}, localStorage: { getItem() { return null; }, setItem() {} }, navigator: {} });
const src = bundle().split('/* ---- ui.js ---- */')[0] + ';this.DATA=DATA;this.Atlas=typeof Atlas!=="undefined"?Atlas:null;';
vm.runInContext(src, ctx);
const D = ctx.DATA, At = ctx.Atlas, AT = D.atlas;
const bad = [], warn = [];
const ids = new Set(D.countries.map(c => c.id));
const map = D.map?.shapes || {};
for (const c of D.countries) {
  if (!c.at) continue;
  const id = c.id, at = c.at;
  if (!map[id]) warn.push(`${id}: no shape on the map`);
  if (!AT.subs[c.sub]) bad.push(`${id}: unknown subregion ${c.sub}`);
  if (!AT.cult[at.cu?.id]) bad.push(`${id}: unknown culture`);
  for (const [p] of at.ov) if (!AT.polities[p]) bad.push(`${id}: unknown polity ${p}`);
  for (const [b] of at.bl) if (!AT.blocs[b]) bad.push(`${id}: unknown bloc ${b}`);
  for (const [, mix] of at.rs) for (const [f] of mix) if (!AT.faiths[f]) bad.push(`${id}: unknown faith ${f}`);
  for (const e of at.eth) if (!AT.ga[e.k]) bad.push(`${id}: unknown ethnic cluster ${e.k} (${e.n})`);
  if (!at.rs.length) warn.push(`${id}: no beliefs`);
  if (!at.eth.length) warn.push(`${id}: no ethnic groups`);
  for (const [, pool] of c.pools || []) if (!D.names[pool]) bad.push(`${id}: unknown name pool ${pool}`);
  for (const k of ['names', 'cap', 'cur', 'pools']) {
    const t = c[k]; if (!t) continue;
    for (let i = 1; i < t.length; i++) if (!(t[i][0] > t[i - 1][0])) bad.push(`${id}: ${k} not ascending at ${t[i - 1][0]},${t[i][0]}`);
    if (t.length && t[t.length - 1][0] < 2029) warn.push(`${id}: ${k} ends at ${t[t.length - 1][0]}`);
  }
  for (let i = 1; i < (c.pop || []).length; i++) if (!(c.pop[i][0] > c.pop[i - 1][0])) bad.push(`${id}: pop not ascending at ${c.pop[i - 1][0]},${c.pop[i][0]}`);
  if (!D.cities[id] || !D.cities[id].length) warn.push(`${id}: no cities`);
  if (!c.gen) bad.push(`${id}: no genes`);
  const hs = D.history.filter(h => h.where?.includes(id) && h.key.includes(id)).length;
  if (hs < 2) warn.push(`${id}: only ${hs} events`);
}
for (const id of Object.keys(map)) if (!ids.has(id)) warn.push(`map shape ${id} has no country`);
const n = D.countries.filter(c => c.at).length;
console.log(`${D.countries.length} lands (${n} in the atlas); ${D.history.length} history entries; ${Object.keys(map).length} map shapes`);
if (process.argv.includes('--list')) console.log(D.countries.map(c => c.id).sort().join(' '));
const idx = process.argv.indexOf('--id');
if (idx > 0) { const c = D.countries.find(x => x.id === process.argv[idx + 1]); console.log(JSON.stringify({ ...c, at: { ...c.at, cu: c.at.cu } }, null, 1).slice(0, 6000)); }
console.log(`${bad.length} problems, ${warn.length} warnings`);
for (const b of bad) console.log('PROBLEM', b);
for (const w of warn.slice(0, 80)) console.log('warn', w);
process.exit(bad.length ? 1 : 0);
