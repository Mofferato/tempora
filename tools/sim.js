// Headless Tempora: runs the real game code without a browser, plays many
// lives with random choices, renders every view, and prints statistics.
//   node tools/sim.js                 smoke test + stats (40 dynasties)
//   node tools/sim.js 200 ancient     200 dynasties starting in one era
//   node tools/sim.js 50 all --years 300 --quiet
// Use it to catch runtime errors and to tune numbers (lifespans, class
// movement, fame, pets...) the way the mortality curves were tuned.
const vm = require('vm');
const path = require('path');
const { JS_ORDER } = require('../build.js');
const fs = require('fs');

const args = process.argv.slice(2);
const N = +args[0] || 40;
const ERA = args[1] && !args[1].startsWith('--') ? args[1] : 'all';
const YEARS = +(args[args.indexOf('--years') + 1] || 0) || 220;
const QUIET = args.includes('--quiet');
const TYPICAL = args.includes('--typical');   // an ordinary player: school, work, a few activities and people

function makeContext() {
  const store = {};
  const el = () => ({ innerHTML: '', textContent: '', hidden: false, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, appendChild() {}, remove() {}, style: { setProperty() {} }, dataset: {}, querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ top: 0, left: 0, width: 800, height: 600 }), focus() {}, scrollIntoView() {} });
  const els = {};
  const document = {
    documentElement: { dataset: {}, style: { setProperty() {} } },
    querySelector: s => (/^#(modal|toast|screen|card|tabs|view|ribbon|when|agebar|ageBtn|btnGod|layout|autoBtn|btnSound|btnAI|phoneBadge)$/.test(s) ? (els[s] ||= el()) : null),
    querySelectorAll: () => [], addEventListener() {}, createElement: el, body: el(), getElementById: () => null, head: el(),
    visibilityState: 'visible',
  };
  const ctx = {
    console, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    matchMedia: () => ({ matches: false, addEventListener() {} }), navigator: {}, document, performance: { now: () => Date.now() },
    fetch: () => Promise.reject(new Error('offline')), location: { protocol: 'file:', origin: 'null', href: 'file:///index.html' },
    AudioContext: undefined, requestAnimationFrame: () => 0, Blob: function () {}, URL: { createObjectURL: () => '' }, FileReader: function () {},
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  const code = JS_ORDER.filter(f => f !== 'main.js' && fs.existsSync(path.join(__dirname, '..', 'src', f)))
    .map(f => `/* ${f} */\n` + fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
  vm.runInContext(code + '\n;globalThis.__T = { Sim, UI, DATA, U, Gen, Auto: typeof Auto !== "undefined" ? Auto : null, Places: typeof Places !== "undefined" ? Places : null, extraActions: typeof SIM_EXTRA !== "undefined" ? SIM_EXTRA : [], Phone: typeof Phone !== "undefined" ? Phone : null, Sports: typeof Sports !== "undefined" ? Sports : null, Legacy: typeof Legacy !== "undefined" ? Legacy : null, AI: typeof AI !== "undefined" ? AI : null, Delta: typeof Delta !== "undefined" ? Delta : null, Intro: typeof Intro !== "undefined" ? Intro : null };', ctx, { filename: 'tempora-bundle.js' });
  return ctx.__T;
}

const T = makeContext();
const { Sim: S, UI: ui, DATA, U } = T;
const errors = new Map();
function err(where, e) {
  const k = `${where}: ${e && e.message}`;
  if (!errors.has(k)) errors.set(k, { n: 0, stack: (e && e.stack || '').split('\n').slice(0, 5).join('\n') });
  errors.get(k).n++;
}

// Render every view and sheet we can reach, to catch template errors
function renderAll() {
  const p = S.me();
  for (const tab of Object.keys(ui.views)) {
    try { ui.views[tab](p); } catch (e) { err('view ' + tab, e); }
  }
  for (const sub of ['era', 'nations', 'orgs', 'god', 'politics']) { ui.worldTab = sub; try { ui.views.world(p); } catch (e) { err('world/' + sub, e); } }
  ui.worldTab = 'era';
  try { ui.cardHTML(p); } catch (e) { err('card', e); }
  for (const o of [p, ...S.known(p).slice(0, 4)]) { try { ui.person(o.id); } catch (e) { err('person sheet', e); } }
  if (ui.profile) { try { ui.profile(p.id); } catch (e) { err('profile', e); } for (const k of S.kids(p).slice(0, 2)) { try { ui.profile(k.id); } catch (e) { err('child profile', e); } } }
  for (const sub of ['inbox', 'contacts', 'feed']) { ui.phoneTab = sub; try { ui.views.phone && ui.views.phone(p); } catch (e) { err('phone/' + sub, e); } }
  ui.phoneTab = 'inbox';
}

// Try a spread of player actions each year
function playYear(p) {
  const tryIt = (n, f) => { try { f(); } catch (e) { err(n, e); } };
  const acts = S.activities(p).filter(a => !a.young && !a.done && !a.broke && !a.jailed);
  for (const a of U.shuffle(acts.filter(a => !TYPICAL || !/gamble|crime/.test(a.id))).slice(0, TYPICAL ? 2 : 3)) tryIt('activity ' + a.id, () => S.doActivity(a.id));
  const people = S.known(p).filter(S.alive);
  for (const o of U.shuffle(people).slice(0, 2)) {
    const opts = S.actionsFor(p, o);
    if (opts.length) { const a = U.pick(opts); tryIt('interact ' + a.id, () => S.interact(o.id, a.id)); }
  }
  if (p.job) { tryIt('workHard', () => S.workHard()); if (U.chance(0.3)) tryIt('promo', () => S.askPromotion()); }
  else if (S.age(p) >= S.workAge(S.era())) {
    const L = S.jobListings(p).filter(x => !x.why.length);
    if (L.length) tryIt('apply', () => S.apply(U.pick(L).j.id));
  }
  if (!p.school && S.age(p) < 30) { const o = S.eduOptions(p).find(x => !x.why.length); if (o && U.chance(0.5)) tryIt('enroll', () => S.doEnroll(o.lvl)); }
  if (TYPICAL) return;
  if (T.Places) {
    const P = T.Places;
    for (const id of P.available(p)) {
      tryIt('roster ' + id, () => P.roster(p, id));
      const pa = P.placeActs(p, id);
      if (pa.length && U.chance(0.4)) { const [k] = U.pick(pa); tryIt(`place ${id}/${k}`, () => P.doPlace(p, id, k)); }
      const r = P.roster(p, id);
      if (r.length && U.chance(0.3)) { const x = U.pick(r); const pa2 = P.personActs(p, id, x); if (pa2.length) { const [k] = U.pick(pa2); tryIt(`person ${id}/${k}`, () => P.doPerson(p, id, x.o.id, k)); } }
    }
  }
  if (S.hooks.playerExtras) tryIt('extras', () => S.hooks.playerExtras(p));
  if (S.pol && S.age(p) >= 18 && U.chance(0.25)) {
    const lvl = Math.min(5, (p.office?.lvl || 0) + 1);
    tryIt('pol.seek', () => S.pol.seek(lvl));
    if (p.office?.lvl >= 4) {
      const other = U.pick(S.world.countriesAt().filter(c => c.id !== p.cc));
      for (const a of U.shuffle(['taxdown', 'taxup', 'works', 'armyup', 'free', 'crack', 'war', 'peace', 'ally', 'trade']).slice(0, 2)) tryIt('pol.rule ' + a, () => S.pol.rule(a, other && other.id));
    }
  }
  if (S.towns && S.age(p) >= 16 && U.chance(0.05)) { const cs = S.towns.citiesAt(p.cc); if (cs.length) tryIt('towns.move', () => S.towns.move(p, U.pick(cs).raw)); }
  for (const f of T.extraActions || []) tryIt('extra', () => f(p));
  if (T.Phone) {
    const Ph = T.Phone, people = S.known(p).filter(S.alive);
    if (people.length) { const o = U.pick(people), acts = Ph.contactActs(p, o); if (acts.length) tryIt('phone.contact', () => Ph.contact(o.id, U.pick(acts)[0])); }
    const m = (Ph.ph(p).inbox || []).find(x => !x.done && x.y <= S.W.year);
    if (m) tryIt('phone.answer', () => { const [, ch] = Ph.text(m, p); if (ch.length) Ph.answer(m.id, U.ri(0, ch.length - 1)); });
    if (Ph.device().social && S.age(p) >= 13) { const st = Ph.ph(p); if (!st.handle) { st.handle = 'sim'; st.followers = 10; } tryIt('phone.post', () => Ph.post(U.pick(Ph.POSTS)[0])); }
  }
  if (T.Sports && S.age(p) >= 6) {
    const Sp = T.Sports;
    if (!p.sport && U.chance(0.2)) { const av = Sp.avail(p); if (av.length) tryIt('sport.take', () => Sp.takeUp(U.pick(av).id)); }
    if (p.sport) { tryIt('sport.train', () => Sp.train()); tryIt('sport.compete', () => Sp.compete()); tryIt('sport.try', () => Sp.tryout()); }
  }
  if (T.Legacy && S.age(p) >= 30 && U.chance(0.05)) {
    tryIt('legacy.commission', () => T.Legacy.commission(U.ri(0, 1), U.chance(0.5) ? 'The Sim Relic' : ''));
    const c = T.Legacy.candidates(p); if (c.length) p.will = { shares: Object.fromEntries(c.slice(0, 3).map((o, i) => [o.id, i + 1])), hl: {}, charity: U.ri(0, 1) };
  }
  // introductions: a child meets someone, now and then
  if (T.Intro && U.chance(0.35)) { const kids = T.Intro.children(p); if (kids.length) { const c = U.pick(kids), cand = T.Intro.candidates(p, c); if (cand.length) tryIt('introduce', () => T.Intro.introduce(c.id, U.pick(cand).o.id)); } }
  // auto-play: the tab habits, automatic days and letters, and pins on the newer kinds of action
  if (T.Auto && U.chance(0.2)) {
    const A = T.Auto, c = A.cfg();
    for (const k of ['promo', 'home', 'inbox', 'days', 'invest', 'job', 'school']) c[k] = U.chance(0.5);
    if (U.chance(0.3)) {
      const L = S.jobListings(p).find(x => !x.cur); if (L) A.togglePin('apply', { id: L.j.id }, 'apply');
      const m = S.market()[0]; if (m) A.togglePin('buy', { id: m.a.id }, 'buy');
      if (T.Places) { const id = U.pick(T.Places.available(p)); A.togglePin('visitAuto', { id }, 'day'); const pa = T.Places.placeActs(p, id); if (pa.length) A.togglePin('sceneA', { place: id, a: pa[0][0] }, 'scene'); }
      if (T.Phone && T.Phone.device().social) A.togglePin('phonePost', { k: 'update' }, 'post');
    }
    tryIt('auto.apply', () => A.apply(p));
    if (A.pins().length > 12) A.pins().splice(0, 6);
  }
  if (T.AI) { tryIt('ai.advise', () => T.AI.advise(p)); if (U.chance(0.3)) tryIt('ai.autopilot', () => T.AI.autopilot(p, U.pick(T.AI.GOALS)[0])); }
  if (S.age(p) >= 16 && U.chance(0.15)) { const m = S.market().filter(x => x.price < p.money * 0.4); if (m.length) tryIt('buy', () => S.buy(U.pick(m).a.id)); }
  if (U.chance(0.05)) { const pets = S.petsAvail(p); if (pets.length) tryIt('adoptPet', () => S.adoptPet(U.pick(pets).id)); }
  for (const pet of S.petsOf(p)) tryIt('petAct', () => S.petAct(pet.id, 'play'));
}

function resolvePrompts() {
  let guard = 0;
  while (S.prompts.length && guard++ < 50) {
    const pr = S.prompts.shift();
    const ok = pr.choices.filter(c => !c.dis);
    // a locked prompt with nothing to pick would freeze the real game
    if (!ok.length) err('prompt with every choice disabled: ' + (pr.text || '').slice(0, 50), new Error('soft lock'));
    let c = U.pick(ok.length ? ok : pr.choices);
    if (T.AI && ok.length && U.chance(0.3)) { try { c = T.AI.bestChoice(S.me(), ok, U.pick(T.AI.GOALS)[0]); } catch (e) { err('ai.bestChoice', e); } }
    if (T.Delta && c.src) { try { T.Delta.preview(c.src, S.me()); } catch (e) { err('delta.preview', e); } }
    try { c.go(); } catch (e) { err('prompt: ' + (pr.title || '').slice(0, 40), e); }
    try { S.settle(); } catch (e) { err('settle', e); }
  }
}

const stats = { cls40: [0, 0, 0, 0, 0, 0, 0], fame40: [], money40: [], lives: 0, ages: [], ageByEra: {}, cls: [0, 0, 0, 0, 0, 0, 0], fame: [], fameMax: [], pets: 0, petYears: 0, people: [], ms: [], mbti: {}, eduAt18: [0, 0, 0, 0, 0], schoolGap: 0, deathsBy: {} };
const eras = DATA.eras.map(e => e.id);
const t0 = Date.now();
for (let d = 0; d < N; d++) {
  const eraId = ERA === 'all' ? eras[d % eras.length] : ERA;
  const e = DATA.eras.find(x => x.id === eraId);
  if (!e) { console.error('Unknown era', eraId); process.exit(1); }
  const hi = e.to > 9000 ? 2400 : e.to;
  const year = U.ri(e.from, Math.max(e.from, hi - 60)) || 1;
  try { S.newWorld({ year, mode: U.pick(['narrative', 'household', 'god']) }); } catch (e2) { err('newWorld ' + eraId, e2); continue; }
  let years = 0, lastId = S.me().id, fameMax = 0;
  const born = S.me().born;
  while (years < YEARS) {
    const p = S.me();
    if (p.id !== lastId) { lastId = p.id; fameMax = 0; }
    const t1 = Date.now();
    try { S.ageUp(); } catch (e2) { err('ageUp', e2); break; }
    stats.ms.push(Date.now() - t1);
    resolvePrompts();
    years++;
    const q = S.me();
    fameMax = Math.max(fameMax, q.fm || 0);
    if (S.age(q) === 18 && !S.W.dead) stats.eduAt18[q.edu]++;
    if (S.age(q) === 40 && !S.W.dead && process.env.TEMPORA_DIAG) { const c = S.toVal(S.era().cost); const inh = q.log.filter(l => /inherited|You received/.test(l.t)).length; (stats.diag ||= []).push([S.era().id, (q.money / c).toFixed(1), (S.assetsVal(q) / c).toFixed(1), q.job ? ((q.job.pay * (1 + 0.35 * q.job.rank)) / c).toFixed(1) : '-', q.job?.t || '', inh, q.cls].join(' ')); }
    if (S.age(q) === 40 && !S.W.dead) { stats.cls40[q.cls ?? 2]++; stats.fame40.push(Math.round(q.fm || 0)); stats.money40.push(S.netWorth(q) / S.toVal(S.era().cost)); }
    if (S.age(q) >= 6 && S.age(q) <= 15 && !q.school && q.edu < 2 && S.eduComp() >= 2) stats.schoolGap++;
    if (S.W.dead) {
      const dd = S.W.dead;
      stats.lives++; stats.ages.push(dd.age);
      (stats.ageByEra[dd.eraId] ||= []).push(dd.age);
      stats.cls[S.P(dd.id).cls ?? 2]++;
      stats.fame.push(Math.round(S.P(dd.id).fm || 0)); stats.fameMax.push(Math.round(fameMax));
      const cause = /old age/.test(dd.cause) ? 'old age' : dd.cause;
      stats.deathsBy[cause] = (stats.deathsBy[cause] || 0) + 1;
      if (S.P(dd.id).pers) stats.mbti[S.P(dd.id).pers.type] = (stats.mbti[S.P(dd.id).pers.type] || 0) + 1;
      const h = S.heirs(S.P(dd.id));
      if (!h.length) break;
      try { S.continueAs((h.find(x => /Son|Daughter/.test(x.rel)) || h[0]).o.id); } catch (e2) { err('continueAs', e2); break; }
      continue;
    }
    playYear(q);
    resolvePrompts();
    if (years % 7 === 0) renderAll();
  }
  stats.people.push(Object.keys(S.W.people).length);
  try { JSON.parse(S.serialize()); } catch (e2) { err('serialize', e2); }
  if (!QUIET) process.stdout.write(`\r${d + 1}/${N} dynasties · ${stats.lives} lives · ${errors.size} distinct errors`);
}
if (!QUIET) process.stdout.write('\n');

const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const pctl = (a, q) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(q * b.length))]; };
console.log(`\n${N} dynasties, ${stats.lives} finished lives, ${((Date.now() - t0) / 1000).toFixed(1)} s, ${avg(stats.ms).toFixed(1)} ms per year (p95 ${pctl(stats.ms, 0.95)} ms)`);
console.log('Age at death by era (median / mean / n):');
for (const id of eras) { const a = stats.ageByEra[id]; if (a) console.log(`  ${id.padEnd(12)} ${String(pctl(a, 0.5)).padStart(4)} / ${avg(a).toFixed(1).padStart(5)} / ${a.length}`); }
const tot = stats.cls.reduce((s, x) => s + x, 0) || 1;
console.log('Class at death (0 lowest .. 6 royal):', stats.cls.map(x => `${Math.round(x / tot * 100)}%`).join(' '));
const t40 = stats.cls40.reduce((s, x) => s + x, 0) || 1;
console.log('Class at 40:', stats.cls40.map(x => `${Math.round(x / t40 * 100)}%`).join(' '), ` · fame at 40 median ${pctl(stats.fame40, 0.5)}, p90 ${pctl(stats.fame40, 0.9)} · net worth at 40 in years of living: median ${pctl(stats.money40, 0.5).toFixed(1)}, p90 ${pctl(stats.money40, 0.9).toFixed(1)}`);
console.log(`Fame at death: median ${pctl(stats.fame, 0.5)}, p90 ${pctl(stats.fame, 0.9)}; peak fame median ${pctl(stats.fameMax, 0.5)}, p90 ${pctl(stats.fameMax, 0.9)}, p99 ${pctl(stats.fameMax, 0.99)}`);
console.log('Education at 18:', stats.eduAt18.join(' / '), ` · school-age children out of compulsory school (child-years): ${stats.schoolGap}`);
console.log(`World size at end: median ${pctl(stats.people, 0.5)} people, max ${Math.max(0, ...stats.people)}`);
const causes = Object.entries(stats.deathsBy).sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log('Top causes of death:', causes.map(([c, n]) => `${c} ${n}`).join(', '));
if (Object.keys(stats.mbti).length) console.log('Personality types:', Object.entries(stats.mbti).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' '));
if (stats.diag) console.log(['era cash assets pay job inherits cls', ...stats.diag.slice(0, 60)].join('\n'));
if (errors.size) {
  console.log(`\n${errors.size} distinct errors:`);
  for (const [k, v] of errors) console.log(`\n[${v.n}x] ${k}\n${v.stack}`);
  process.exitCode = 1;
} else console.log('\nNo runtime errors.');
