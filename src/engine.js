/* =====================================================================
   ENGINE, part 1 — world state, people, family graph, yearly simulation.
   No DOM access here. The UI reads Sim.W and calls Sim.* actions.
   ===================================================================== */

const Sim = (() => {
  let W = null;                 // the whole saveable world
  const prompts = [];           // pending interactive choices (not saved)
  const hooks = {};             // extension points, filled in by engine-world.js

  /* ---------------- basic lookups ---------------- */
  const eraOf = y => DATA.eras.find(e => y >= e.from && y <= e.to) || (y < DATA.eras[0].from ? DATA.eras[0] : DATA.eras[DATA.eras.length - 1]);
  const era = () => eraOf(W.year);
  const P = id => (id == null ? null : W.people[id]);
  const me = () => W.people[W.playerId];
  const alive = p => !!p && p.died == null;
  const age = (p, y) => U.span(p.born, p.died != null ? p.died : (y ?? W.year));
  const toVal = (amt, e = era()) => amt * e.cur.r;
  const cash = p => p.money / era().cur.r;                 // in current era currency
  const curNow = (cc, e = era()) => (hooks.cur && W && hooks.cur(cc ?? P(W.playerId)?.cc, W.year)) || e.cur;
  const money = (v, e = era(), cc) => { const c = curNow(cc, e); return c.s ? `${c.s}${U.fmtNum(v / c.r)}` : `${U.fmtNum(v / c.r)} ${c.n}`; };
  const fullName = p => `${p.title ? p.title + ' ' : ''}${p.fo && !/^(of|the) /.test(p.last) ? `${p.last} ${p.first}` : `${p.first} ${p.last}`}`;
  const assetsVal = p => p.assets.reduce((s, a) => s + a.val, 0);
  const netWorth = p => p.money + assetsVal(p);
  const law = (k, e = era(), cc) => {
    const base = k === 'sameSex' ? (e.laws.sameSex || (e.laws.sameSexFrom != null && W.year >= e.laws.sameSexFrom)) : e.laws[k];
    return hooks.law ? hooks.law(k, base, e, cc ?? P(W.playerId)?.cc) : base;
  };
  const sameSexOK = (e = era(), cc) => law('sameSex', e, cc);
  const medicine = (y = W.year) => {
    const e = eraOf(y);
    return Math.min(0.97, e.life.med + DATA.history.filter(h => h.type === 'medicine' && h.y <= y && h.y >= e.from).reduce((s, h) => s + h.med, 0));
  };
  const eduComp = (e = era()) => {
    let c = e.edu.comp;
    for (const [y, lvl] of e.edu.compAt || []) if (W.year >= y) c = Math.max(c, lvl);
    return c;
  };
  // Wars from the history books plus wars declared during play (politics.js keeps W.wars)
  const activeWars = () => [...DATA.history, ...(W.wars || [])].filter(h => h.type === 'war' && W.year >= h.y && W.year <= (h.end ?? h.y));
  // neo: content that needs farming, herding or copper to have reached the player's land
  const inWindow = o => (o.from == null || W.year >= o.from) && (o.to == null || W.year <= o.to) && (o.neo == null || !hooks.neo || hooks.neo(o.neo));

  /* ---------------- family graph ---------------- */
  const parents = p => [P(p.fa), P(p.mo)].filter(Boolean);
  const kids = p => p.kids.map(P).filter(Boolean);
  const siblings = p => {
    const s = new Set();
    parents(p).forEach(par => par.kids.forEach(k => k !== p.id && s.add(k)));
    return [...s].map(P).filter(Boolean);
  };
  const grandparents = p => parents(p).flatMap(parents);
  const grandkids = p => kids(p).flatMap(kids);
  const auncles = p => parents(p).flatMap(siblings);
  const cousins = p => auncles(p).flatMap(kids);
  const niblings = p => siblings(p).flatMap(kids);
  const spouse = p => P(p.sp);

  function relLabel(p, o) {
    if (!o || o.id === p.id) return 'You';
    const M = o.sex === 'M';
    if (p.fa === o.id || p.mo === o.id) return M ? 'Father' : 'Mother';
    if (p.sp === o.id) return M ? 'Husband' : 'Wife';
    if (p.kids.includes(o.id)) return M ? 'Son' : 'Daughter';
    if (siblings(p).includes(o)) {
      const full = o.fa === p.fa && o.mo === p.mo;
      return (full ? '' : 'Half-') + (M ? 'Brother' : 'Sister');
    }
    if (grandparents(p).includes(o)) return M ? 'Grandfather' : 'Grandmother';
    if (grandkids(p).includes(o)) return M ? 'Grandson' : 'Granddaughter';
    if (auncles(p).includes(o)) return M ? 'Uncle' : 'Aunt';
    if (niblings(p).includes(o)) return M ? 'Nephew' : 'Niece';
    if (cousins(p).includes(o)) return 'Cousin';
    if (grandparents(p).some(g => g.fa === o.id || g.mo === o.id)) return M ? 'Great-grandfather' : 'Great-grandmother';
    if (grandkids(p).some(g => g.kids.includes(o.id))) return M ? 'Great-grandson' : 'Great-granddaughter';
    if (p.exes.includes(o.id)) return M ? 'Ex-husband' : 'Ex-wife';
    if (spouse(p) && parents(spouse(p)).includes(o)) return M ? 'Father-in-law' : 'Mother-in-law';
    if (kids(p).some(k => k.sp === o.id)) return M ? 'Son-in-law' : 'Daughter-in-law';
    const r = p.rels[o.id];
    if (r) return { friend: 'Friend', lover: M ? 'Boyfriend' : 'Girlfriend', fiance: M ? 'Fiancé' : 'Fiancée', ex: 'Ex', coworker: 'Coworker', enemy: 'Rival' }[r.k] || 'Acquaintance';
    return 'Acquaintance';
  }

  // Everyone the player knows (for the Relationships tab and "Become")
  function known(p) {
    const s = new Set([...parents(p), ...siblings(p), ...grandparents(p), ...auncles(p), ...cousins(p), ...kids(p), ...grandkids(p), ...niblings(p)].map(x => x.id));
    if (p.sp != null) s.add(p.sp);
    p.exes.forEach(x => s.add(x));
    Object.keys(p.rels).forEach(k => s.add(+k));
    const sp = spouse(p); if (sp) parents(sp).forEach(x => s.add(x.id));
    kids(p).forEach(k => k.sp != null && s.add(k.sp));
    s.delete(p.id);
    return [...s].map(P).filter(Boolean);
  }

  function rel(p, o) {                       // closeness record, created lazily
    if (!p.rels[o.id]) p.rels[o.id] = { k: 'fam', c: U.ri(45, 80) };
    return p.rels[o.id];
  }

  /* ---------------- people ---------------- */
  const pool = (e, cc, y) => (hooks.pool && hooks.pool(e, cc, y ?? W.year)) || DATA.names[e.names];
  function pickName(sex, e = era(), cc, y) {
    const pool_ = pool(e, cc, y);
    return U.pick(sex === 'M' ? pool_.m : pool_.f);
  }
  function mkPerson(o) {
    const e = eraOf(o.born);
    const sex = o.sex || (U.chance(0.5) ? 'M' : 'F');
    const cc = o.cc || W.spawnCC || P(W.playerId)?.cc || null;
    const p = {
      id: W.nid++, first: o.first || pickName(sex, e, cc, o.born), last: o.last || U.pick(pool(e, cc, o.born).last), sex, cc,
      born: o.born, died: null, cause: null,
      h: o.h ?? U.ri(65, 100), hp: o.hp ?? U.ri(55, 90), sm: o.sm ?? U.ri(20, 85), lk: o.lk ?? U.ri(20, 85), rep: o.rep ?? U.ri(5, 25),
      money: o.money || 0, fa: o.fa ?? null, mo: o.mo ?? null, sp: null, exes: [], kids: [],
      job: null, retired: false, edu: o.edu || 0, school: null, assets: [], rels: {}, sick: [], imm: [],
      title: o.title || null, prison: 0, orient: o.orient || 'straight', played: false, log: [], ach: [], flags: {}, did: {},
    };
    W.people[p.id] = p;
    const fa = P(p.fa), mo = P(p.mo);
    if (fa) fa.kids.push(p.id);
    if (mo) mo.kids.push(p.id);
    if (hooks.onCreate) hooks.onCreate(p, o);
    return p;
  }
  function inherit(a, b) { return U.clamp(Math.round((a + b) / 2 + U.ri(-18, 18)), 1, 100); }
  function childOf(fa, mo, born) {
    const dyn = [fa, mo].some(x => x && (x.id === W.playerId || x.last === W.dyn.name));
    const last = dyn ? W.dyn.name : (fa || mo).last;
    const sex = U.chance(0.5) ? 'M' : 'F';
    const taken = new Set([...[fa, mo].filter(Boolean).flatMap(x => x.kids.map(P)).filter(k => k && alive(k)), fa, mo].filter(Boolean).map(k => k.first));
    const cc = mo?.cc || fa?.cc;
    let first = pickName(sex, eraOf(born), cc, born);
    for (let i = 0; i < 6 && taken.has(first); i++) first = pickName(sex, eraOf(born), cc, born);
    return mkPerson({ born, sex, first, cc, fa: fa?.id, mo: mo?.id, last, sm: inherit(fa?.sm ?? 50, mo?.sm ?? 50), lk: inherit(fa?.lk ?? 50, mo?.lk ?? 50), h: U.ri(70, 100), hp: U.ri(70, 95) });
  }

  function log(p, t, k = 'life') {
    p.log.push({ y: W.year, a: age(p), t, k });
    if (p.log.length > 400) p.log.splice(0, p.log.length - 400);
    if (hooks.onLog) hooks.onLog(p, t, k);
  }

  /* ---------------- hooks, stat snapshots and change records ---------------- */
  // Chain an extension hook. 'seq' calls every handler in order, 'mul' multiplies
  // numeric results, 'add' sums them, 'cat' concatenates array results.
  function addHook(name, fn, mode = 'seq') {
    const prev = hooks[name];
    if (!prev) { hooks[name] = fn; return; }
    hooks[name] = mode === 'mul' ? (...a) => (prev(...a) ?? 1) * (fn(...a) ?? 1)
      : mode === 'add' ? (...a) => (prev(...a) || 0) + (fn(...a) || 0)
      : mode === 'cat' ? (...a) => [...(prev(...a) || []), ...(fn(...a) || [])]
      : (...a) => { prev(...a); return fn(...a); };
  }
  const hk = (name, ...a) => (hooks[name] ? hooks[name](...a) : undefined);
  const hmul = (name, ...a) => (hooks[name] ? hooks[name](...a) ?? 1 : 1);
  const hadd = (name, ...a) => (hooks[name] ? hooks[name](...a) || 0 : 0);
  const STAT_KEYS = ['h', 'hp', 'sm', 'lk', 'rep', 'mh', 'fe', 'im', 'wp', 'fm'];
  // Extra numbers worth tracking in change records (followers, skills...): [label, p => number]
  const snapFns = [];
  const snapAdd = (label, f) => snapFns.push([label, f]);
  function snap(p) {
    const s = { $: p.money, c: {}, x: {} };
    for (const [k, f] of snapFns) { try { s.x[k] = f(p) || 0; } catch { s.x[k] = 0; } }
    for (const k of STAT_KEYS) s[k] = p[k] ?? 0;
    for (const [id, r] of Object.entries(p.rels)) s.c[id] = r.c;
    return s;
  }
  // Compact change record: { h: -3, hp: 5, $: 120, rel: [[id, +8], [id, 'new']], x: {...} }
  function diff(a, b) {
    const d = {};
    for (const k of STAT_KEYS) { const v = Math.round((b[k] ?? 0) - (a[k] ?? 0)); if (v) d[k] = v; }
    const m = b.$ - a.$; if (Math.abs(m) >= 0.5) d.$ = Math.round(m * 100) / 100;
    const rc = [];
    for (const [id, c] of Object.entries(b.c)) { if (a.c[id] == null) rc.push([+id, 'new']); else { const v = Math.round(c - a.c[id]); if (v) rc.push([+id, v]); } }
    if (rc.length) d.rel = rc.sort((x, y) => (y[1] === 'new') - (x[1] === 'new') || Math.abs(y[1]) - Math.abs(x[1])).slice(0, 4);
    const x = {}; for (const k of Object.keys(b.x || {})) { const v = Math.round((b.x[k] || 0) - (a.x?.[k] || 0)); if (v) x[k] = v; }
    if (Object.keys(x).length) d.x = x;
    return d;
  }
  const hasDiff = d => !!d && Object.keys(d).length > 0;
  function tagLast(p, d) { if (hasDiff(d) && p.log.length) p.log[p.log.length - 1].d = d; }

  /* ---------------- jobs (shared by NPCs and player) ---------------- */
  const jobsNow = (e = era(), cc) => [...e.jobs.filter(inWindow).map(j => (hooks.jobMap ? hooks.jobMap(j, cc) : j)).filter(Boolean), ...(hooks.jobs ? hooks.jobs(e, cc) : [])];
  function eligible(p, j) {
    return (!j.sex || j.sex === p.sex) && p.sm >= j.sm && p.edu >= j.edu && p.rep >= j.rep && p.lk >= j.lk;
  }
  function giveJob(p, j, e = era()) {
    p.job = { id: j.id, t: (p.sex === 'F' && j.tf) || j.t, era: e.id, pay: toVal(j.pay, e), yrs: 0, perf: 55, rank: 0, risk: j.risk, fame: j.fame, vol: j.vol };
    p.retired = false; p.lastJob = p.job.t;
    if (/astronaut|mars|orbital|starship|asteroid|colonist/i.test(j.t)) p.flags.space = 1;
  }
  function npcJob(p, e) {
    const opts = jobsNow(e).filter(j => eligible(p, j) && !j.grant);
    const j = U.wpick(opts, x => 1 / Math.sqrt(x.pay) * (x.pay < e.cost * 3 ? 3 : 1));
    if (j) giveJob(p, j, e);
  }

  /* ---------------- world creation ---------------- */
  const CLASSES = [
    { id: 'poor', w: 35, cash: 0.2, edu: 0 }, { id: 'common', w: 40, cash: 1, edu: 0.3 },
    { id: 'comfortable', w: 17, cash: 4, edu: 0.7 }, { id: 'wealthy', w: 7, cash: 20, edu: 1 }, { id: 'noble', w: 1.5, cash: 60, edu: 1 },
  ];
  function seedAdult(o, e, cls) {
    const p = mkPerson(o);
    const lvl = CLASSES.indexOf(cls);
    p.edu = Math.max(eduComp(e), U.chance(cls.edu) ? U.ri(1, Math.min(4, lvl + 1)) : 0);
    p.sm = U.clamp(p.sm + lvl * 4);
    p.money = toVal(e.cost, e) * cls.cash * U.rand(0.5, 1.5);
    p.rep = U.clamp(p.rep + lvl * 8);
    if (hooks.onSeed) hooks.onSeed(p, lvl);
    if (age(p) >= 16) {
      if (lvl >= 3) {
        const good = jobsNow(e).filter(j => (!j.sex || j.sex === p.sex) && !j.grant).sort((a, b) => b.pay - a.pay).slice(0, 5);
        giveJob(p, U.pick(good), e);
      } else npcJob(p, e);
    }
    return p;
  }

  function newWorld(opt) {
    const year = opt.year;
    W = { v: 1, year, nid: 1, people: {}, playerId: null, news: [], started: year,
      dyn: { name: '', score: 0, lives: [], played: [], founder: null, houses: [] }, god: false, lastEra: eraOf(year).id,
      mode: opt.mode || 'narrative', godOn: !!opt.godOn, pets: {}, auto: {}, rel: {}, nat: {}, pops: {} };
    spawnFamily(opt);
    return W;
  }

  // A complete family (grandparents, parents, aunts, uncles, cousins, older
  // siblings) around a newborn player, in the current world year.
  function spawnFamily(opt) {
    const year = W.year;
    const e = eraOf(year);
    W.spawnCC = opt.cc || (hooks.defaultCC && hooks.defaultCC(year)) || null;
    const mA = law('marry', e, W.spawnCC);
    const cls = opt.cls ? CLASSES.find(c => c.id === opt.cls) : U.wpick(CLASSES, c => c.w);
    const last = opt.last?.trim() || U.pick(pool(e, W.spawnCC).last);
    const faAge = U.ri(mA + 6, 40), moAge = U.ri(mA + 3, Math.min(40, faAge + 2));
    const by = a => U.add(year, -a);
    // grandparents
    const gpf = seedAdult({ sex: 'M', born: by(faAge + U.ri(20, 32)), last }, e, cls);
    const gmf = seedAdult({ sex: 'F', born: by(faAge + U.ri(18, 28)) }, e, cls);
    const gpm = seedAdult({ sex: 'M', born: by(moAge + U.ri(20, 32)) }, e, cls);
    const gmm = seedAdult({ sex: 'F', born: by(moAge + U.ri(18, 28)), last: undefined }, e, cls);
    marry(gpf, gmf, true); marry(gpm, gmm, true);
    // parents
    const fa = seedAdult({ sex: 'M', born: by(faAge), fa: gpf.id, mo: gmf.id, last }, e, cls);
    const mo = seedAdult({ sex: 'F', born: by(moAge), fa: gpm.id, mo: gmm.id, last: gpm.last }, e, cls);
    marry(fa, mo, true);
    if (cls.id === 'noble' && ['medieval', 'renaissance', 'colonial', 'industrial'].includes(e.id)) { gpf.title = 'Lord'; fa.title = 'Lord'; }
    // aunts, uncles, cousins
    for (const [g1, g2, parentAge] of [[gpf, gmf, faAge], [gpm, gmm, moAge]]) {
      for (let i = 0, n = U.ri(0, 3); i < n; i++) {
        const a = U.clamp(parentAge + U.ri(-8, 8), mA, 60);
        const au = seedAdult({ born: by(a), fa: g1.id, mo: g2.id, last: g1.last }, e, cls);
        if (a > mA + 4 && U.chance(0.7)) {
          const sp = seedAdult({ sex: au.sex === 'M' ? 'F' : 'M', born: by(a + U.ri(-4, 4)) }, e, cls);
          marry(au, sp, true);
          const [f, m] = au.sex === 'M' ? [au, sp] : [sp, au];
          for (let k = 0, kn = U.ri(0, 3); k < kn; k++) {
            const ka = U.ri(0, Math.max(0, a - mA - 2));
            const c = childOf(f, m, by(ka)); c.last = f.last;
            if (ka >= 16) npcJob(c, e);
          }
        }
      }
    }
    // older siblings
    const maxSib = Math.max(0, moAge - mA - 1);
    for (let i = 0, n = U.ri(0, Math.min(3, Math.floor(maxSib / 2))); i < n; i++) {
      const sa = U.ri(1, maxSib);
      const s = childOf(fa, mo, by(sa)); s.last = last;
      s.edu = Math.min(eduComp(e), sa >= 12 ? 2 : sa >= 6 ? 1 : 0);
      if (sa >= 16) npcJob(s, e);
    }
    // the player
    const p = childOf(fa, mo, year);
    p.last = last; p.sex = opt.sex || p.sex; p.first = opt.first?.trim() || pickName(p.sex, e, p.cc); p.orient = opt.orient || 'straight';
    delete W.spawnCC;
    if (hooks.onFamily) hooks.onFamily(p, { fa, mo, cls, opt });
    W.dyn.name = last; W.dyn.founder = p.id; W.dyn.houses.push({ name: last, y: year, founder: p.id });
    known(p).forEach(o => (rel(p, o).c = U.ri(55, 90)));
    setPlayer(p, true);
    const fj = fa.job ? `a ${fa.job.t.toLowerCase()}` : 'unemployed';
    const mj = mo.job ? `a ${mo.job.t.toLowerCase()}` : 'at home';
    log(p, `You were born a ${p.sex === 'M' ? 'boy' : 'girl'} in the ${e.name} era. Your father ${fa.first} is ${fj}; your mother ${mo.first} is ${mj}. Your family is ${cls.id}.`, 'birth');
    const gl = grandparents(p).length;
    if (gl) log(p, `Your ${gl} grandparents came to meet you.`, 'birth');
    return p;
  }

  function setPlayer(p, founder = false) {
    W.playerId = p.id;
    if (!p.played) { p.played = true; W.dyn.played.push(p.id); }
    if (!founder) log(p, `From this year, you live as ${p.first} ${p.last}.`, 'switch');
  }

  function marry(a, b, silent) {
    a.sp = b.id; b.sp = a.id;
    delete a.rels[b.id]; delete b.rels[a.id];
    a.rels[b.id] = { k: 'fam', c: U.ri(65, 95) }; b.rels[a.id] = { k: 'fam', c: U.ri(65, 95) };
    if (!silent) { log(a, `Married ${b.first} ${b.last}.`, 'love'); log(b, `Married ${a.first} ${a.last}.`, 'love'); }
  }
  function unmarry(a, b) {
    if (a.sp === b.id) a.sp = null; if (b.sp === a.id) b.sp = null;
    if (!a.exes.includes(b.id)) a.exes.push(b.id);
    if (!b.exes.includes(a.id)) b.exes.push(a.id);
  }

  /* ---------------- death ---------------- */
  function mortality(p, e, a) {
    const L = e.life, med = medicine();
    let q = 0;
    const cm = L.child * (1 - med * 0.5);
    if (a < 5) q += (1 - Math.pow(1 - cm, 1 / 5)) * 0.85;       // era diseases supply the rest
    else if (a < 15) q += cm * 0.015;
    // Gompertz senescence around the era's modal adult age, scaled by health
    q += 0.09 * Math.exp(0.09 * (a - L.adult)) * 0.55 * U.clamp(1 + (60 - p.h) / 40, 0.35, 3);
    if (hooks.mort) q *= hooks.mort(p, a);
    return Math.min(0.95, q + L.acc * 0.35 * hmul('accMul', p));
  }
  function causeOf(p, e, a) {
    if (p.sick.length) return U.pick(p.sick).n;
    if (U.chance(e.life.acc * 20)) return U.pick(e.die.acc);
    if (a < 5) return U.pick(e.die.kid);
    if (a >= Math.min(e.life.adult - 8, e.life.adult * 0.8)) return U.chance(0.45) ? 'old age' : U.pick(e.die.old);
    return U.pick(e.die.adult);
  }
  function kill(p, cause) {
    if (!alive(p)) return;
    // Far Future mind backup: one restore
    if (p.flags.backup && p.id === W.playerId) {
      delete p.flags.backup; p.flags.revived = 1; p.h = 60; p.sick = [];
      log(p, `You died of ${cause}, but were restored from your mind backup into a new body.`, 'bad');
      return;
    }
    p.died = W.year; p.cause = cause; p.job = null; p.school = null;
    if (hooks.onDeath) hooks.onDeath(p);
    const sp = spouse(p);
    if (sp) { sp.sp = null; if (!sp.exes.includes(p.id)) sp.flags.widow = p.id; log(sp, `${p.first} died of ${cause}.`, 'death'); }
    log(p, `Died of ${cause}.`, 'death');
    const pl = me();
    if (pl && p.id !== pl.id && alive(pl) && known(pl).includes(p)) {
      log(pl, `Your ${relLabel(pl, p).toLowerCase()} ${p.first} died of ${cause}${age(p) ? ` at ${age(p)}` : ''}.`, 'death');
      pl.hp = U.clamp(pl.hp - ((pl.rels[p.id]?.c ?? 50) > 60 ? 12 : 5));
      // NPC estates flow to their children or spouse (the player's own estate is handled at their death)
      npcEstate(p);
    } else npcEstate(p);
  }
  function npcEstate(p) {
    if (p.id === W.playerId) return;
    const heirs = kids(p).filter(alive);
    const sp = spouse(p);
    const val = netWorth(p);
    if (val <= 0) return;
    const to = heirs.length ? heirs : sp && alive(sp) ? [sp] : [];
    if (!to.length) return;
    const share = p.money / to.length;
    to.forEach((h, i) => {
      h.money += share;
      p.assets.filter((_, k) => k % to.length === i).forEach(a => h.assets.push(a));
      if (h.id === W.playerId && val > 1) log(h, `You inherited ${money(share + p.assets.filter((_, k) => k % to.length === i).reduce((s, a) => s + a.val, 0))} from ${p.first}.`, 'money');
    });
    if (p.title && heirs.length) { const eldest = heirs.sort((a, b) => a.born - b.born)[0]; if (!eldest.title) eldest.title = eldest.sex === 'M' ? p.title.replace('Lady', 'Lord') : p.title.replace('Lord', 'Lady').replace('Sir', 'Dame'); }
    p.money = 0; p.assets = [];
  }

  /* ---------------- effects ---------------- */
  // Apply an fx object to a person. Returns nothing; logs side effects.
  function applyFx(p, fx, e = era()) {
    if (!fx) return;
    for (const k of ['h', 'hp', 'sm', 'lk', 'rep', 'mh', 'fe', 'im', 'wp', 'fm']) if (fx[k] != null) p[k] = U.clamp((p[k] ?? 50) + U.roll(fx[k]));
    if (fx.$ != null) p.money += toVal(U.roll(fx.$), e);
    if (fx.$c != null) { const r = Array.isArray(fx.$c) ? U.rand(fx.$c[0], fx.$c[1]) : fx.$c; p.money += toVal(e.cost * r, e); }
    if (fx.edu != null) p.edu = Math.max(p.edu, fx.edu);
    if (fx.jail) jail(p, fx.jail);
    if (fx.fire && p.job) { log(p, `You lost your job as ${p.job.t.toLowerCase()}.`, 'bad'); p.job = null; }
    if (fx.job) { const j = jobsNow(e, p.cc).find(x => x.id === fx.job); if (j) { giveJob(p, j, e); log(p, `You now work as ${j.t.toLowerCase()}.`, 'work'); } }
    if (fx.lover) newLover(p, true);
    if (hooks.fx) hooks.fx(p, fx, e);
  }
  function jail(p, yrs) {
    p.prison += yrs; p.flags.jailed = 1;
    if (p.job) p.job = null;
    p.school = null;
    p.rep = U.clamp(p.rep - 8);
  }

  /* ---------------- relationships spawning ---------------- */
  function prefSex(p) {
    if (p.orient === 'gay') return p.sex;
    if (p.orient === 'bi') return U.chance(0.5) ? 'M' : 'F';
    return p.sex === 'M' ? 'F' : 'M';
  }
  function newLover(p, quiet) {
    const a = age(p);
    const o = mkPerson({ near: p, sex: prefSex(p), born: U.add(W.year, -U.clamp(a + U.ri(-4, 4), 14, 120)) });
    o.sm = U.clamp(p.sm + U.ri(-25, 25)); o.money = toVal(era().cost, era()) * U.rand(0, 2);
    if (age(o) >= 16) npcJob(o, era());
    p.rels[o.id] = { k: 'lover', c: U.ri(55, 85) };
    o.rels[p.id] = { k: 'lover', c: U.ri(55, 85) };
    if (!quiet) log(p, `You started seeing ${o.first} ${o.last}.`, 'love');
    else log(p, `${o.first} ${o.last} is now your ${o.sex === 'M' ? 'boyfriend' : 'girlfriend'}.`, 'love');
    return o;
  }
  function newFriend(p, k = 'friend') {
    const a = age(p);
    const o = mkPerson({ near: p, born: U.add(W.year, -U.clamp(a + U.ri(-6, 6), 4, 120)) });
    if (age(o) >= 16) npcJob(o, era());
    p.rels[o.id] = { k, c: U.ri(40, 75) };
    o.rels[p.id] = { k, c: U.ri(40, 75) };
    return o;
  }

  /* ---------------- connected set (who gets a full life sim) ---------------- */
  function connected() {
    const pl = me(), set = new Set(), q = [[pl.id, 0]];
    while (q.length) {
      const [id, d] = q.shift();
      if (set.has(id)) continue;
      set.add(id);
      if (d >= 3) continue;
      const p = P(id); if (!p) continue;
      [p.fa, p.mo, p.sp, ...p.kids].forEach(n => n != null && !set.has(n) && q.push([n, d + 1]));
    }
    Object.keys(pl.rels).forEach(k => set.add(+k));
    return set;
  }

  /* ---------------- disease ---------------- */
  function catchChance(p, d, a) {
    let c = d.p * (1.5 - p.h / 100);
    if (d.kid) c *= a < 12 ? 3 : 0.2;
    if (d.adult && a < 16) c = 0;
    if (d.ag) c *= Math.max(0.1, (a - 25) / 25);
    if (hooks.catchMul) c *= hooks.catchMul(p, d);
    return c;
  }
  function tickSick(p, e, a, isPl) {
    for (const d of e.dis) {
      if (!inWindow(d) || p.imm.includes(d.id) || p.sick.some(s => s.id === d.id)) continue;
      if (U.chance(catchChance(p, d, a))) {
        p.sick.push({ id: d.id, n: d.n, left: d.dur, dmg: d.dmg, let: d.let, cure: d.cure });
        if (isPl) log(p, `You fell ill with ${d.n.toLowerCase()}.`, 'bad');
      }
    }
    const med = medicine();
    for (const s of p.sick.slice()) {
      p.h = U.clamp(p.h - s.dmg * U.rand(0.5, 1.2));
      if (U.chance(s.let * (1 - med * 0.8) * (1.4 - p.h / 100))) { kill(p, s.n.toLowerCase()); return; }
      if (--s.left <= 0) {
        p.sick.splice(p.sick.indexOf(s), 1);
        if (s.wave) p.flags.plague = 1;
        if (['smallpox', 'measles'].includes(s.id)) p.imm.push(s.id);
        if (isPl) log(p, `You recovered from ${s.n.toLowerCase()}.`, 'good');
      }
    }
  }

  /* ---------------- per-person yearly tick ---------------- */
  function tickPerson(p, e, full, isPl) {
    const a = age(p), L = e.life;
    // aging, then the body's own recovery toward a baseline that sinks with age
    const s = L.adult * 0.6;
    if (a > s) p.h = U.clamp(p.h - Math.max(0, a - s) / (L.adult * 0.4) * 2.2 * L.age * U.rand(0.5, 1.5));
    else if (a < 18) p.h = U.clamp(p.h + U.ri(-1, 3));
    const base = a < s ? 88 : Math.max(20, 88 - (a - s) * 1.2 * L.age);
    if (!p.sick.length && p.h < base) p.h = U.clamp(p.h + (base - p.h) * 0.12);
    if (a > 40) p.lk = U.clamp(p.lk - U.rand(0, 0.8));
    if (!isPl) { p.hp = U.clamp(p.hp + U.ri(-4, 4)); }
    if (p.prison > 0) { p.prison--; p.hp = U.clamp(p.hp - 5); if (isPl) log(p, p.prison ? `Another year behind bars. ${p.prison} to go.` : 'You were released from prison.', p.prison ? 'bad' : 'good'); }
    tickSick(p, e, a, isPl);
    if (!alive(p)) return;
    if (hooks.tick) hooks.tick(p, e, a, isPl, full);
    if (p.h <= 0 || U.chance(mortality(p, e, a))) { kill(p, causeOf(p, e, a)); return; }
    if (isPl) return;          // the player's choices drive the rest
    // NPC education, work, money
    if (a === 6 && eduComp(e) >= 1) p.edu = Math.max(p.edu, 1);
    if (a === 12 && eduComp(e) >= 2) p.edu = Math.max(p.edu, 2);
    if (a === 22 && p.edu >= 2 && U.chance(p.sm / 160)) p.edu = 3;
    if (!full) return;
    if (a >= 16 && !p.job && !p.retired && p.prison <= 0 && U.chance(0.4)) npcJob(p, e);
    if (p.job) {
      if (p.job.era !== e.id && U.chance(0.5)) { p.job = null; npcJob(p, e); }
      if (p.job) { p.job.yrs++; p.money += p.job.pay * U.rand(0.08, 0.18); if (p.job.risk && U.chance(p.job.risk)) p.h = U.clamp(p.h - U.ri(8, 25)); }
      if (p.job && L.retire && a >= L.retire) { p.job = null; p.retired = true; }
    }
    if (!p.job && a >= 18 && law('ubi', e, p.cc)) p.money += toVal(law('ubi', e, p.cc), e) * 0.1;
    // relationships
    const mA = law('marry', e, p.cc);
    if (p.sp == null && a >= mA + 2 && a <= 50 && U.chance((a < 30 ? 0.12 : 0.05) * hmul('npcMul', p, 'marry'))) {
      const sp = mkPerson({ cc: p.cc, near: p, sex: p.orient === 'gay' && sameSexOK(e, p.cc) ? p.sex : p.sex === 'M' ? 'F' : 'M', born: U.add(W.year, -U.clamp(a + U.ri(-5, 5), mA, 80)) });
      sp.money = toVal(e.cost, e) * U.rand(0, 3); if (age(sp) >= 16) npcJob(sp, e);
      marry(p, sp);
      const pl = me();
      if (pl && known(pl).includes(p)) log(pl, `Your ${relLabel(pl, p).toLowerCase()} ${p.first} married ${sp.first} ${sp.last}.`, 'family');
    }
    const sp = spouse(p);
    if (sp && law('divorce', e, p.cc) && U.chance(0.008 * hmul('npcMul', p, 'divorce'))) {
      unmarry(p, sp); log(p, `Divorced ${sp.first}.`, 'love');
      const pl = me();
      if (pl && pl.id !== sp.id && known(pl).includes(p)) log(pl, `Your ${relLabel(pl, p).toLowerCase()} ${p.first} and ${sp.first} divorced.`, 'family');
    }
    // children: the woman of a couple rolls
    if (sp && alive(sp) && p.sex === 'F' && sp.sex === 'M' && a >= 16 && a <= 44) {
      const f = e.life.fert * (a > 35 ? 0.5 : 1) * (p.kids.length > 6 ? 0.3 : 1) * (hooks.fert ? hooks.fert(p, sp) : 1);
      if (U.chance(f)) birth(sp, p);
    }
  }

  function birth(fa, mo) {
    const e = era();
    const c = childOf(fa, mo, W.year);
    log(fa, `${c.sex === 'M' ? 'Son' : 'Daughter'} ${c.first} was born.`, 'family');
    log(mo, `${c.sex === 'M' ? 'Son' : 'Daughter'} ${c.first} was born.`, 'family');
    if (hooks.onBirth) hooks.onBirth(c, fa, mo);
    const pl = me();
    if (pl && pl.id !== fa.id && pl.id !== mo.id) {
      const k = known(pl);
      const par = [mo, fa].find(x => k.includes(x));
      if (par) log(pl, `Your ${relLabel(pl, par).toLowerCase()} ${par.first} had a baby: ${c.first}.`, 'family');
    }
    if (e.life.birth && U.chance(e.life.birth * (1 - medicine()))) kill(mo, 'complications of childbirth');
    return c;
  }

  /* ---------------- history ---------------- */
  function histTick(list = [...DATA.history, ...(W.wars || [])]) {
    const pl = me();
    const conn = connected();
    const scope = (h, q) => !h.where || h.where.includes(q.cc);
    for (const h of list) {
      const end = h.end ?? h.y;
      if (W.year < h.y || W.year > end) continue;
      const first = W.year === h.y;
      if (first) {
        W.news.push({ y: W.year, t: h.t, type: h.type, where: h.where || null });
        if (alive(pl) && scope(h, pl)) log(pl, h.t, 'world');
        if (h.fx) Object.values(W.people).filter(q => alive(q) && scope(h, q)).forEach(p => applyFx(p, h.fx));
      }
      const living = Object.values(W.people).filter(q => alive(q) && scope(h, q));
      if (h.type === 'plague') {
        let hit = false;
        for (const p of living) {
          if (p.sick.some(s => s.id === U.slug(h.dn)) || U.chance(1 - h.inf * (1.3 - p.h / 100))) continue;
          p.sick.push({ id: U.slug(h.dn), n: h.dn, left: 1, dmg: h.dmg, let: h.let, cure: 0.6, wave: 1 });
          if (p === pl) hit = true;
        }
        if (hit) log(pl, `You caught the ${h.dn}.`, 'bad');
      } else if (h.type === 'war') {
        for (const p of living) {
          const a = age(p);
          if (p.flags.war === h.key) {
            if (a > 50 || W.year === end) { delete p.flags.war; p.flags.vet = 1; if (p === pl) log(p, `You came home from the ${h.n}.`, 'good'); continue; }
            if (U.chance(h.mort)) kill(p, `wounds in the ${h.n}`);
            else if (p === pl && U.chance(0.3)) { p.h = U.clamp(p.h - U.ri(5, 20)); log(p, `You were wounded at the front.`, 'bad'); }
            continue;
          }
          if (p.sex === 'M' && a >= 18 && a <= 45 && !p.prison && !law('noDraft', era(), p.cc) && U.chance(h.draft * hmul('draftMul', p))) {
            if (p === pl) draftPrompt(p, h);
            else if (conn.has(p.id)) { p.flags.war = h.key; if (known(pl).includes(p)) log(pl, `Your ${relLabel(pl, p).toLowerCase()} ${p.first} was called up for the ${h.n}.`, 'world'); }
          } else if (h.civ && U.chance(h.civ)) kill(p, `the ${h.n}`);
        }
      } else if (h.type === 'famine') {
        for (const p of living) {
          p.h = U.clamp(p.h - h.dmg * U.rand(0.5, 1.2) * (p.money > toVal(era().cost * 3) ? 0.3 : 1));
          if (U.chance(h.mort * (p.money > toVal(era().cost * 3) ? 0.2 : 1))) kill(p, 'starvation');
        }
      } else if (h.type === 'crash') {
        if (first) living.forEach(p => { if (p.money > 0) p.money *= 1 - h.loss; p.assets.forEach(a => a.kind === 'stock' && (a.val *= 1 - h.loss * 1.5)); });
        if (h.lay) living.forEach(p => { if (p.job && U.chance(h.lay)) { if (p === pl) log(p, `You were laid off from your job as ${p.job.t.toLowerCase()}.`, 'bad'); p.job = null; } });
      } else if (h.type === 'disaster') {
        if (alive(pl) && scope(h, pl) && U.chance(h.p)) {
          applyFx(pl, h.fx); if (h.loss) pl.money *= 1 - h.loss;
          log(pl, first ? 'You were caught up in it and lost a great deal.' : 'Disaster struck close to home this year.', 'bad');
        }
      } else if (h.type === 'revolution' && first) {
        for (const p of living) if (p.title && U.chance(h.strip)) {
          if (p === pl) log(p, `Revolutionaries stripped you of your title and seized half your wealth.`, 'bad');
          p.title = null; p.money *= 0.5;
        }
      }
    }
  }

  function draftPrompt(p, h) {
    prompt({
      title: `Called up: ${h.n}`, text: `You have been conscripted to fight in the ${h.n}.`,
      choices: [
        { l: 'Serve', go: () => { p.flags.war = h.key; p.rep = U.clamp(p.rep + 5); if (p.job) p.job = null; log(p, `You went off to fight in the ${h.n}.`, 'world'); return 'You shipped out with your unit.'; } },
        { l: 'Dodge the draft', go: () => { if (U.chance(0.5)) { if (hooks.arrest) return hooks.arrest(p, { crime: 'draft', yrs: U.ri(1, 3), sev: 2 }); jail(p, U.ri(1, 3)); log(p, 'You were caught dodging the draft and imprisoned.', 'bad'); return 'Caught. You were sent to prison.'; } p.rep = U.clamp(p.rep - 6); log(p, 'You dodged the draft.', 'life'); return 'You slipped through the cracks, but people talk.'; } },
        { l: 'Flee abroad', go: () => { p.money *= 0.6; p.hp = U.clamp(p.hp - 8); if (p.job) p.job = null; log(p, 'You fled abroad to avoid the war, leaving much behind.', 'life'); return 'You escaped, at great cost.'; } },
      ],
    });
  }

  // Prompts are locked until answered, so there must always be something you can pick
  function prompt(pr) {
    if (pr.choices?.length && pr.choices.every(c => c.dis)) pr.choices.push({ l: 'Let it pass', go: () => 'You could not afford any of it, so you let it pass.' });
    prompts.push(pr);
  }

  return {
    get W() { return W; }, set W(v) { W = v; }, prompts, hooks, law, curNow, pool, pickName,
    eraOf, era, P, me, alive, age, toVal, cash, money, fullName, assetsVal, netWorth, sameSexOK, medicine, eduComp, activeWars, inWindow,
    parents, kids, siblings, grandparents, grandkids, auncles, cousins, niblings, spouse, relLabel, known, rel,
    mkPerson, childOf, log, jobsNow, eligible, giveJob, npcJob, newWorld, spawnFamily, setPlayer, marry, unmarry, kill, applyFx, jail,
    newLover, newFriend, connected, tickPerson, birth, histTick, prompt, CLASSES, npcEstate,
    addHook, hk, hmul, hadd, snap, diff, hasDiff, tagLast, STAT_KEYS, mortality, snapAdd,
  };
})();
