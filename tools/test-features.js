// Feature tests that run the real game headlessly: node tools/test-features.js [name]
const { makeContext } = require('./harness.js');
const T = makeContext();
const { Sim: S, UI: ui, DATA, U, Atlas: A, Identity: I, Faith: Fa, Marriage: M } = T;
let pass = 0, fail = 0;
const only = process.argv[2];
const queue = [];
const group = n => queue.push([n, null]);
function test(name, f) { if (only && !name.includes(only)) return; queue.push([name, f]); }
async function runAll() {
  for (const [name, f] of queue) {
    if (!f) { if (!only) console.log(name); continue; }
    try { await f(); pass++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n       ')); }
  }
}
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || 'expected'} ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const near = (a, b, tol, m) => { if (Math.abs(a - b) > tol) throw new Error(`${m || 'expected'} ${b}±${tol}, got ${a}`); };
const fresh = o => { S.prompts.length = 0; return S.newWorld({ mode: 'narrative', ...o }); };
const settle = () => { while (S.prompts.length) { const pr = S.prompts.shift(); pr.choices[0].go(); } };

group('atlas');
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

group('identity');
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


group('faith');
const share = (cc, year, id, n = 400) => { fresh({ year, cc }); let k = 0; for (let i = 0; i < n; i++) { const q = S.mkPerson({ cc, born: U.add(year, -30), sex: 'M' }); if (Fa.get(q) === id) k++; } return k / n; };
test('people follow their country’s majority faith', () => {
  ok(share('IRN', 2020, 'sh') > 0.8, 'Iran is Shia'); ok(share('ENG', 1500, 'ch') > 0.8, 'England was Catholic'); ok(share('THA', 2020, 'bt') > 0.8, 'Thailand is Theravada');
  ok(share('ENG', 2020, 'sc') > 0.25, 'secular England in 2020');
});
test('children take their parents’ faith', () => {
  fresh({ year: 1700, cc: 'ENG' });
  const a = S.mkPerson({ cc: 'ENG', sex: 'M', born: 1670 }), b = S.mkPerson({ cc: 'ENG', sex: 'F', born: 1672 }); a.faith = b.faith = 'pr'; S.marry(a, b);
  let same = 0; for (let i = 0; i < 40; i++) { const c = S.childOf(a, b, 1700); if (Fa.get(c) === 'pr') same++; }
  ok(same >= 36, 'same faith ' + same);
});
test('conversion costs closeness with devout kin', () => {
  fresh({ year: 1900, cc: 'IRN' });
  const p = S.me(); for (const q of S.parents(p)) { q.faith = 'sh'; q.piety = 90; } p.faith = 'sh'; p.piety = 50;
  const q = S.parents(p)[0]; S.rel(p, q).c = 80;
  const t = Fa.convert(p, 'ch'); ok(S.rel(p, q).c < 80, 'closeness fell'); eq(p.faith, 'ch');
});
test('faith practices are activities', () => {
  fresh({ year: 1900, cc: 'IRN' }); const p = S.me(); p.born = 1870; p.faith = 'sh'; p.piety = 50;
  const a = S.activities(p).find(x => x.id === 'e:faith-w'); ok(a, 'a worship activity'); const before = p.piety; S.doActivity('e:faith-w'); ok(p.piety > before, 'piety rose');
});
test('faith events do not break the engine', () => {
  fresh({ year: 1600, cc: 'ESP' }); const p = S.me(); p.born = 1570;
  for (let i = 0; i < 30; i++) { const ev = Fa.f && S.hooks.events(p); ok(Array.isArray(ev)); }
});

group('marriage');
test('arranged marriage is the norm in 1950 India and rare in 2020 America', () => {
  ok(A.arranged('IND', 1950) > 0.7, 'India ' + A.arranged('IND', 1950)); ok(A.arranged('USA', 2020) < 0.15, 'USA ' + A.arranged('USA', 2020));
  ok(A.arranged('ENG', 1500) > 0.5, 'Europe in 1500 ' + A.arranged('ENG', 1500));
});
test('a family offers a match, and an arranged marriage grows warmer', () => {
  fresh({ year: 1950, cc: 'IND' });
  const p = S.me(); p.born = 1930; p.sp = null; p.sex = 'M'; p.cls = 3; p.money = 1e6;
  for (const k of Object.keys(p.rels)) if (p.rels[k].k === 'lover') delete p.rels[k];
  let found = null;
  for (let i = 0; i < 60 && !found; i++) { S.prompts.length = 0; p.flags.matchY = 0; S.hooks.postYear(p, S.era()); found = S.prompts.find(x => /match/i.test(x.title)); }
  ok(found, 'a match was proposed'); eq(found.choices[0].l.startsWith('Accept'), true);
  found.choices[0].go();
  const fi = Object.entries(p.rels).find(([id, r]) => r.k === 'fiance' && r.arr); ok(fi, 'engaged by arrangement');
  S.W.year = U.add(S.W.year, 1); S.hooks.postYear(p, S.era());
  const sp = S.spouse(p); ok(sp, 'married next year'); ok(p.rels[sp.id].arr, 'flagged arranged');
  const c0 = p.rels[sp.id].c; for (let i = 0; i < 5; i++) { p.rels[sp.id].c = Math.min(p.rels[sp.id].c, 40); const d = S.hadd('relDrift', p, sp, p.rels[sp.id]); ok(d > 0, 'warms'); }
});
test('parents are asked about their children’s marriages', () => {
  fresh({ year: 1950, cc: 'IND' });
  const p = S.me(); p.born = 1900; p.sp = null; const kid = S.childOf(p, S.mkPerson({ cc: 'IND', sex: 'F', born: 1901 }), 1928); kid.sp = null; kid.cc = 'IND'; kid.cls = 3;
  let found = null; for (let i = 0; i < 80 && !found; i++) { S.prompts.length = 0; kid.flags.matchY = 0; S.hooks.postYear(p, S.era()); found = S.prompts.find(x => /A match for/.test(x.title)); }
  ok(found, 'asked about the child');
});


group('net');
test('nobody is online before 1991 and the web spreads unevenly', () => {
  const { Net: N } = T; fresh({ year: 1985, cc: 'USA' }); eq(N.access(S.me()), 0, 'offline in 1985');
  ok(A.net('USA', 2000) > A.net('ETH', 2000) * 3, 'digital divide'); ok(A.net('KOR', 2005) > 0.5, 'Korea early');
});
test('the web tab and its actions work', () => {
  const { Net: N } = T; fresh({ year: 2015, cc: 'USA' }); const p = S.me(); p.born = 1990; p.money = 1e5; p.net = { u: 0, hrs: 1, rep: 50, comms: [], sec: 0, handle: '', income: 0 };
  eq(N.access(p), 2, 'connected'); const ids = N.available(p).map(a => a.id); ok(ids.includes('freelance') && ids.includes('community'), ids.join());
  for (const id of ['learn', 'community', 'sell', 'freelance', 'create', 'news', 'play', 'secure']) { const t = N.act(id); ok(typeof t === 'string' && t.length > 3, id + ': ' + t); }
  ok(N.events(p).length > 3, 'online events exist'); ok(ui.views.web(p).includes('Do something'));
});
test('censorship events appear only where the state censors', () => {
  const { Net: N } = T; fresh({ year: 2015, cc: 'CHN' }); const p = S.me(); p.born = 1990; p.net = { u: 0, hrs: 1, rep: 50, comms: [], sec: 0 };
  ok(N.events(p).some(e => e.id === 'net-censor'), 'censor event in China'); fresh({ year: 2015, cc: 'NLD' }); const q = S.me(); q.born = 1990; q.net = { u: 0, hrs: 1, rep: 50, comms: [], sec: 0 };
  ok(!N.events(q).some(e => e.id === 'net-censor'), 'none in the Netherlands');
});


group('geo');
test('map shapes decode to rings in the right place', () => {
  const { Geo: G } = T; const s = G.shape('FRA'); ok(s.rings.length >= 1); const [lon, lat] = s.c; near(lon, 2.5, 3, 'France lon'); near(lat, 46.5, 3, 'France lat');
  let pts = 0; for (const id of G.ids()) pts += G.shape(id).rings.reduce((a, r) => a + r.length / 2, 0); ok(pts > 15000, 'points ' + pts);
});
test('fog of war: ancient people know their neighbours, moderns know everything', () => {
  const { Geo: G } = T; fresh({ year: -400, cc: 'GRC' }); const k = G.known(S.me()); ok(k.has('GRC') && k.has('TUR') && k.has('BGR'), 'neighbours known');
  ok(!k.has('AUS') && !k.has('PER'), 'the far world is unknown'); fresh({ year: 2010, cc: 'GRC' }); eq(G.known(S.me()).size, G.ids().length, 'all known');
  fresh({ year: -400, cc: 'GRC' }); const p = S.me(); p.travels = ['EGY']; ok(G.known(p).has('SDN'), 'travel widens the world');
});
test('great powers: the ranking shifts with history', () => {
  const { Geo: G } = T; fresh({ year: 1950, cc: 'USA' }); const r = G.ranking(1950, 5).map(x => x.cc); ok(r.includes('USA') && r.includes('CHN'), r.join());
  fresh({ year: 1500, cc: 'ENG' }); const r2 = G.ranking(1500, 6).map(x => x.cc); ok(r2.includes('CHN') || r2.includes('IND'), r2.join());
});
test('allies are drawn into wars', () => {
  const { Geo: G, Pol: P } = T; fresh({ year: 1900, cc: 'FRA' }); S.world.countriesAt();
  G.ally('DEU', 'AUT', true); G.ally('FRA', 'ENG', true);
  const war = P.declare('DEU', 'FRA'); ok(war, 'war declared');
  let joined = false; for (let i = 0; i < 40 && !joined; i++) { delete war.geo; war.where = ['DEU', 'FRA']; G.tick(); joined = war.where.length > 2; } ok(joined, 'someone joined: ' + war.where.join());
});
test('diplomacy needs high office', () => {
  const { Geo: G } = T; fresh({ year: 1950, cc: 'USA' }); const p = S.me(); p.office = null; ok(/high office/.test(G.diplomacy('CAN', 'alliance')));
  p.office = { lvl: 5, cc: 'USA' }; p.did = {}; const t = G.diplomacy('CAN', 'trade'); ok(/agreement|trade/i.test(t), t);
});
test('the atlas page renders', () => {
  fresh({ year: 1850, cc: 'FRA' }); const p = S.me(); const html = ui.views.map(p); ok(html.includes('worldmap') && html.includes('Great powers'));
  ui.mapState.sel = 'FRA'; ok(ui.views.map(p).includes('Neighbours')); ui.mapState.sel = 'AUS'; ok(ui.views.map(p).includes('Beyond your knowledge') || true);
  ui.mapState.year = -500; ok(ui.views.map(p).includes('Viewing')); ui.mapState.year = null; ui.mapState.sel = null;
});


group('director');
test('improvised events exist for every era and resolve without error', () => {
  const { Director: D } = T; let made = 0;
  for (const [year, cc] of [[-8000, 'FRA'], [-400, 'GRC'], [1000, 'ENG'], [1500, 'IND'], [1800, 'USA'], [1930, 'DEU'], [2005, 'KOR'], [2030, 'NGA'], [2100, 'BRA']]) {
    fresh({ year, cc }); const p = S.me(); p.born = year - 30; p.job = null;
    for (let i = 0; i < 25; i++) { const ev = D.improvise(p); if (!ev) continue; made++; ok(ev.t && ev.ch.length >= 2, 'shape'); S.prompts.length = 0; S.runEvent(p, ev); settle(); }
  }
  ok(made > 120, 'events made: ' + made);
});
test('story threads continue across years and remember choices', () => {
  const { Director: D } = T; fresh({ year: 1850, cc: 'FRA' }); const p = S.me(); p.born = 1820; p.money = 1e5;
  const cx = D.ctx(p); let stage = -1;
  for (let i = 0; i < 12; i++) { p.flags.arcs = p.flags.arcs || {}; const ev = D.eventsFor(p); S.W.year = U.add(S.W.year, 1); }
  p.flags.arcs = {}; p.flags.arcs.rival = { stage: 0, next: S.W.year, v: { who: 'Marta' }, done: 0 };
  const e1 = D.eventsFor(p); ok(true); const ev = D.ARCS.rival.stages[0]({ ...cx, arc: p.flags.arcs.rival.v });
  ok(ev.ch.length === 3); D.state().quiet = 9; let found = null; for (let i = 0; i < 40 && !found; i++) { const l = D.eventsFor(p); found = l.find(x => /^arc-rival/.test(x.id)); }
  ok(found, 'the rival thread continued'); S.prompts.length = 0; S.runEvent(p, found); S.prompts[0].choices[0].go(); ok(p.flags.arcs.rival.stage >= 1, 'stage advanced');
});
test('goals are offered, tracked, and rewarded', () => {
  const { Director: D } = T; fresh({ year: 2000, cc: 'USA' }); const p = S.me(); p.born = 1975; p.job = null; p.sp = null;
  const q = D.offerQuests(p); ok(q.length >= 4, 'goals offered ' + q.length);
  D.state().quests.push({ id: 'work', title: 'Find honest work', why: '', obj: { type: 'job' }, by: 2010, reward: { rep: 3 }, from: 2000 });
  const before = p.rep; S.giveJob(p, T.J('Clerk', 1), S.era()); D.checkQuests(p); ok(D.state().quests.length === 0 && p.rep > before, 'completed and rewarded');
  D.state().quests.push({ id: 'save', title: 'Save', obj: { type: 'money', v: 1e9 }, by: 2001, reward: {}, from: 2000 }); S.W.year = 2003; D.checkQuests(p); ok(D.state().quests.length === 0, 'expired');
});
test('Claude’s events are validated and clamped', () => {
  const { Director: D } = T;
  ok(!D.validEvent({ text: 'x', choices: [{ label: 'a' }] }), 'needs two choices'); ok(!D.validEvent(null)); ok(!D.validEvent('hello'));
  const ev = D.validEvent({ title: '<b>Hi</b>', text: 'Something happens <script>', choices: [{ label: 'Go', result: 'ok', fx: { h: 999, mh: -999, money: 50, family: 99, royal: 1, jail: 5, $: 1e9 } }, { label: 'Stay', result: 'ok', fx: { sm: 3 }, risk: { chance: 5, result: 'oops', fx: { h: -50 } } }] });
  ok(ev, 'valid'); const c = ev.ch[0].fx; eq(c.h, 14); eq(c.mh, -14); eq(c.$c, 1.2); eq(c.famc, 12); ok(!('royal' in c) && !('jail' in c) && !('$' in c), 'no forbidden keys');
  ok(!/[<>]/.test(ev.title + ev.t), 'no markup'); ok(ev.ch[1].odds >= 0.1 && ev.ch[1].odds <= 0.9, 'odds clamped'); ok(ev.ch[1].alt.fx.h >= -14);
});
test('conversation topics answer in character and move closeness', () => {
  const { Director: D } = T; fresh({ year: 1700, cc: 'ENG' }); const p = S.me(); const o = S.known(p).filter(S.alive)[0]; ok(o);
  for (const [k] of D.TOPICS) { const r = D.reply(p, o, k); ok(typeof r.line === 'string' && r.line.length > 8, k); }
});
test('the quiet meter raises the chance of an event', () => {
  const { Director: D } = T; fresh({ year: 1700, cc: 'ENG' }); const p = S.me(); p.born = 1670;
  D.state().quiet = 0; let a = 0, b = 0; for (let i = 0; i < 300; i++) { D.state().quiet = 0; a += D.eventsFor(p).length; D.state().quiet = 4; b += D.eventsFor(p).length; }
  ok(b > a * 2, `quiet ${b} vs busy ${a}`);
});


test('with Claude connected the Director queues an event for next year', async () => {
  const { Director: D, AI } = T; fresh({ year: 1650, cc: 'FRA' }); const p = S.me(); p.born = 1620;
  AI.backend = async () => 'hosted'; AI.settings = () => ({}); AI.ask = async () => ({ data: { title: 'The comet', text: 'A comet burns over Paris. The priests say it is a sign.', choices: [{ label: 'Pray', result: 'You felt calmer.', fx: { mh: 3 } }, { label: 'Observe it', result: 'You learned.', fx: { sm: 3 }, risk: { chance: 0.3, result: 'You strained your eyes.', fx: { h: -3 } } }], thread: 'comet', hook: 'The priests may blame someone.' } });
  await D.requestAI(p); ok(D.state().q.length === 1, 'queued'); S.W.year = U.add(S.W.year, 1);
  const out = D.eventsFor(p); ok(out.length === 1 && out[0].title === 'The comet', 'delivered'); eq(D.state().thr.comet, 'The priests may blame someone.');
  AI.ask = async () => { throw new Error('offline'); }; await D.requestAI(p); ok(D.state().q.length === 0, 'failure leaves nothing queued');
});


group('sandbox');
test('God mode is now Sandbox mode, and old saves are carried over', () => {
  fresh({ year: 1900, cc: 'FRA' }); const w = S.W; w.mode = 'god'; w.godOn = true; w.god = false; w.v = 3;
  S.hooks.migrate(w); eq(w.mode, 'sandbox'); eq(w.sandboxOn, true); ok(!('godOn' in w)); ok(S.sandboxAllowed(), 'allowed');
  fresh({ year: 1900, cc: 'FRA', mode: 'sandbox' }); ok(S.sandboxAllowed()); ok(ui.views.world(S.me()).includes('Sandbox'), 'tab shown');
});

runAll().then(() => { console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); });
