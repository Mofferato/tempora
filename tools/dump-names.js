const vm = require('vm'); const { bundle } = require('../build.js');
const ctx = vm.createContext({ console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Promise, setTimeout, document: {}, window: {}, localStorage: { getItem() { return null; }, setItem() {} }, navigator: {} });
vm.runInContext(bundle().split('/* ---- ui.js ---- */')[0] + ';this.DATA=DATA;', ctx);
const only = process.argv.slice(2);
for (const c of ctx.DATA.countries) {
  if (!c.at || (only.length && !only.includes(c.id))) continue;
  let prev = null; const out = [];
  for (const [u, n] of c.names) { out.push(`${prev === null ? '' : prev + 1}→${u === 99999 ? '' : u} ${n}`); prev = u; }
  console.log(c.id + ': ' + out.filter(x => !/^→?-?\d*→?-?\d* (a |the (Late|Meso|Neol|Bron|Nord|Funn|Batt|reind|Medit|Ice|Balkan))/.test(x)).join(' | '));
}
