// Feature tests that run the real game headlessly: node tools/test-features.js [name]
const { makeContext } = require('./harness.js');
const T = makeContext();
const { Sim: S, UI: ui, DATA, U, Atlas: A, Identity: I } = T;
let pass = 0, fail = 0;
const only = process.argv[2];
function test(name, f) {
  if (only && !name.includes(only)) return;
  try { f(); pass++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n       ')); }
}
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || 'expected'} ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const near = (a, b, tol, m) => { if (Math.abs(a - b) > tol) throw new Error(`${m || 'expected'} ${b}±${tol}, got ${a}`); };
const fresh = o => { S.prompts.length = 0; return S.newWorld({ mode: 'narrative', ...o }); };
const settle = () => { while (S.prompts.length) { const pr = S.prompts.shift(); pr.choices[0].go(); } };

console.log('atlas');
test('every map shape has a country', () => {
  for (const id of Object.keys(DATA.map.shapes)) ok(DATA.countries.some(c => c.id === id), 'no country ' + id);
});
test('countries have names, capitals and currencies for every era', () => {
  fresh({ year: 1500 });
  for (const c of DATA.countries.filter(c => c.at)) for (const y of [-5000, 0, 800, 1500, 1800, 1914, 1960, 2000, 2025, 2200]) {
    if (y < c.from) continue;
    ok(S.world.name(c.id), `${c.id} name at ${y}`);
  }
});

console.log('identity');
test('mixed parents make mixed children', () => {
  fresh({ year: 2005, cc: 'USA', anc: 'Black Americans', anc2: 'Asian Americans' });
  const p = S.me(); const e = I.eth(p);
  eq(e.length, 2, 'two peoples'); near(e[0].s, 0.5, 0.01);
  ok(I.ethText(p).startsWith('Half'), I.ethText(p));
});
test('children inherit half of each parent', () => {
  fresh({ year: 2005, cc: 'USA', anc: 'Black Americans', anc2: 'Asian Americans' });
  const p = S.me();
  const kid = S.childOf(p, S.mkPerson({ cc: 'USA', sex: 'F', born: U.add(2005, -25), eth: [{ n: 'White Americans (English, German, Irish, Italian and others)', k: 'settler', s: 1 }] }), 2030);
  const e = I.eth(kid); eq(e.length, 3, 'three peoples'); near(e.reduce((s, x) => s + x.s, 0), 1, 0.01);
  near(e.find(x => /White/.test(x.n)).s, 0.5, 0.01);
});
test('immigrant parents give birthright and descent nationalities', () => {
  fresh({ year: 2005, cc: 'USA', origin: 'CHN', originSide: 'both', surnameCC: 'CHN' });
  const p = S.me(); const n = I.natsOf(p);
  ok(n.includes('USA') && n.includes('CHN'), 'USA+CHN got ' + n);
  ok(I.conflict(n), 'China forbids dual nationality');
  ok(/Han|Chin/.test(I.ethText(p)), I.ethText(p));
});
test('a forbidden dual nationality forces a choice at eighteen', () => {
  fresh({ year: 2005, cc: 'USA', origin: 'CHN', originSide: 'both' });
  const p = S.me();
  for (let i = 0; i < 18; i++) { S.ageUp(); settle(); }
  eq(I.natsOf(p).length, 1, 'chose one');
});
test('Germany allows two nationalities from birth, not by naturalisation', () => {
  fresh({ year: 2005, cc: 'USA' });
  const p = S.me(); p.cc = 'DEU'; p.nats = ['USA']; p.res = { cc: 'DEU', y: 1990 }; p.born = 1960; p.money = 1e6;
  const c = I.canApply(p, 'DEU'); ok(c.ok, 'eligible'); const t = I.apply('DEU'); ok(/naturalisation|dual/.test(t), t);
});
test('countries that allow it keep both', () => {
  fresh({ year: 2005, cc: 'CAN', origin: 'FRA', originSide: 'both' });
  const p = S.me(); ok(I.natsOf(p).length >= 2, 'both kept: ' + I.natsOf(p));
  for (let i = 0; i < 20; i++) { S.ageUp(); settle(); }
  ok(I.natsOf(p).length >= 2, 'both kept after 18: ' + I.natsOf(p));
});
test('naturalisation takes years of residence', () => {
  fresh({ year: 2005, cc: 'USA' });
  const p = S.me(); p.nats = ['FRA']; p.cc = 'USA'; p.res = { cc: 'USA', y: 2000 }; p.born = 1975; p.money = 1e6;
  const c = I.canApply(p, 'USA'); ok(c.ok, 'eligible after 5 years: ' + c.why);
  p.res = { cc: 'USA', y: 2004 }; ok(!I.canApply(p, 'USA').ok, 'not yet');
});
test('names: suggestions come from the land pool', () => {
  const l = I.suggest('F', 'JPN', 1500, 5); eq(l.length, 5, 'five names'); ok(l.every(x => typeof x === 'string' && x.length > 1));
});
test('the player is asked to name a baby', () => {
  fresh({ year: 2005, cc: 'USA' });
  const p = S.me(); p.age = 30; p.born = 1975; const sp = S.mkPerson({ cc: 'USA', sex: p.sex === 'M' ? 'F' : 'M', born: 1976 }); S.marry(p, sp);
  S.prompts.length = 0;
  const c = S.birth(p.sex === 'M' ? p : sp, p.sex === 'M' ? sp : p);
  ok(S.prompts.length >= 1 && /call/.test(S.prompts[S.prompts.length - 1].text), 'a naming prompt');
  const pr = S.prompts[S.prompts.length - 1]; S.promptValue = 'Zebedee';
  pr.choices.find(x => x.input).go(); S.promptValue = '';
  eq(c.first, 'Zebedee');
});
test('old saves with combined regions move to real countries', () => {
  fresh({ year: 1850, cc: 'ENG' });
  const w = S.W; w.v = 1;
  const q = S.mkPerson({ cc: 'ENG', born: 1820 }); q.cc = 'WAF'; w.pops.WAF = {}; w.nat.LEV = {};
  S.hooks.migrate(w);
  ok(!A.LEGACY[q.cc], 'moved to ' + q.cc); ok(A.LEGACY.WAF.includes(q.cc), 'to a West African land: ' + q.cc);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
