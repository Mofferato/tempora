/* =====================================================================
   ENGINE, part 3 — the world layer. Implements the engine hooks for
   countries, currencies, laws, social classes, genetics, new stats,
   nations, travel and emigration, organisations, pets, ambitions,
   narrative chapters and god-mode edits. No DOM access.
   ===================================================================== */

(() => {
  const S = Sim, H = S.hooks;
  const W = () => S.W;
  const yr = () => W().year;
  const C = id => DATA.countries.find(c => c.id === id);
  const tl = (list, y) => { for (const x of list || []) if (y <= x[0]) return x; return null; };
  const last = a => a && a[a.length - 1];
  const PREMODERN = DATA.PREMODERN;

  /* ---------------- countries ---------------- */
  const cName = (cc, y = yr()) => { const c = C(cc); if (!c) return 'distant lands'; const base = (tl(c.names, y) || last(c.names))[1]; return H.regName && y === yr() ? H.regName(cc, base) : base; };
  const cGov = (cc, y = yr()) => { const c = C(cc); if (!c) return ''; const base = (tl(c.names, y) || last(c.names))[2]; return H.regGov && y === yr() ? H.regGov(cc, base) : base; };
  const cCap = (cc, y = yr()) => { const c = C(cc); return c ? (tl(c.cap, y) || last(c.cap))[1] : ''; };
  function popAt(cc, y = yr()) {
    const pts = C(cc)?.pop; if (!pts) return 0;
    if (y <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) { const [y0, v0] = pts[i - 1], [y1, v1] = pts[i]; return v0 + (v1 - v0) * (y - y0) / (y1 - y0); }
    return last(pts)[1];
  }
  const countriesAt = (y = yr()) => DATA.countries.filter(c => y >= c.from && (c.to == null || y <= c.to));
  H.popAt = popAt;
  H.defaultCC = y => U.wpick(DATA.countries.filter(c => y >= c.from && (c.to == null || y <= c.to) && c.region !== 'space'), c => Math.sqrt(popAt(c.id, y)) + 0.5)?.id || 'ENG';
  H.cur = (cc, y) => { const x = tl(C(cc)?.cur, y); return x ? { n: x[1], s: x[2], r: x[3] } : null; };
  H.pool = (e, cc, y) => { const x = tl(C(cc)?.pools, y); return x ? DATA.names[x[1]] : null; };
  H.law = (k, base, e, cc) => {
    const c = C(cc); if (!c) return base;
    let v = base;
    for (const [f, t, , fl] of c.laws || []) if (fl && k in fl && yr() >= f && yr() <= t) v = fl[k];
    return v;
  };
  const lawsFor = cc => (C(cc)?.laws || []).filter(([f, t]) => yr() >= f && yr() <= t).map(x => x[2]);

  /* ---------------- social classes ---------------- */
  function ladder(cc, y = yr()) {
    const o = (C(cc)?.cls || []).find(([f, t]) => y >= f && y <= t);
    return o ? o[2] : DATA.classLadders[S.eraOf(y).id];
  }
  const className = p => ladder(p.cc)[U.clamp(p.cls ?? 2, 0, 6)];
  // Where someone "should" stand: wealth owned, what they earn, titles, marriage, and for
  // young adults still at home, their parents. Tuned with tools/sim.js so that a typical
  // life ends near the middle of the ladder and the top two rungs stay rare.
  function classTarget(p, e) {
    const cost = S.toVal(e.cost), a = S.age(p);
    const wealth = S.netWorth(p) / cost;
    const earn = (p.job ? p.job.pay * S.rankPay(p.job) : p.retired && e.life.retire ? cost * 0.6 : 0) / cost;
    const wt = wealth < -3 ? 0 : wealth < 1 ? 1 : wealth < 6 ? 2 : wealth < 25 ? 3 : wealth < 100 ? 4 : 5;
    const it = earn <= 0 ? 0 : earn < 1 ? 1 : earn < 2.2 ? 2 : earn < 5 ? 3 : earn < 11 ? 4 : 5;
    let t = Math.max(wt, Math.min(it, wealth < 6 ? 2 : wealth < 25 ? 3 : 4));
    if (wt <= 1 && it >= 2) t = Math.max(t, 2);
    if (p.edu >= 3 && earn >= 2.2) t = Math.max(t, 3);
    if (p.title) t = Math.max(t, /Lord|Lady|Prince|Princess|King|Queen|Emperor|Empress|Pharaoh|Shah|Sultan|Tsar/.test(p.title) ? 5 : 4);
    if (p.office) t = Math.max(t, p.office.lvl >= 4 ? 5 : p.office.lvl >= 2 ? 4 : 3);
    const sp = S.spouse(p);
    // before the modern age, wealth alone moves you at most one rung from the class you were born into
    if (PREMODERN.includes(e.id) && p.clsBirth != null && !p.title && !p.office) t = U.clamp(t, p.clsBirth - 1, p.clsBirth + 1);
    if (sp && S.alive(sp)) t = Math.max(t, Math.min(sp.cls ?? 0, 5) - (PREMODERN.includes(e.id) ? 0 : 1));
    if (a < 25 && !sp) { const par = Math.max(...S.parents(p).filter(S.alive).map(x => x.cls ?? 0), -1); if (par >= 0) t = Math.max(t, Math.min(par, 5) - (a >= 21 ? 1 : 0)); }
    return U.clamp(t, 0, 5);
  }
  // Spending rises with station and income (the well-off keep up appearances), so wealth
  // does not pile up without limit; in return a higher station is a little happier.
  const LIFESTYLE = [0.8, 0.9, 1, 1.25, 1.7, 2.6, 4];
  S.addHook('costMul', p => LIFESTYLE[U.clamp(p.cls ?? 2, 0, 6)], 'mul');   // most of what people earn they spend too (engine-player.js)
  S.addHook('hpTarget', p => ((p.cls ?? 2) - 2) * 1.2, 'add');
  function classTick(p, e) {
    if ((p.cls ?? 2) >= 6) return;
    const a = S.age(p);
    if (a < 18) { const par = Math.max(...S.parents(p).filter(S.alive).map(x => x.cls ?? 0), -1); if (par >= 0 && par < 6) p.cls = par; p.clsBirth = p.cls; return; }
    p.clsBirth ??= p.cls ?? 2;
    const t = classTarget(p, e);
    if (t === p.cls) { p.clsPress = 0; return; }
    const up = t > p.cls;
    // standing has to hold for a while before society notices; older ages are stickier
    p.clsPress = (p.clsPress || 0) + (up ? 1 : -1);
    if (up ? p.clsPress < 0 : p.clsPress > 0) p.clsPress = up ? 1 : -1;
    const need = PREMODERN.includes(e.id) ? (up ? 3 : 2) : 2;
    if (Math.abs(p.clsPress) < need || !U.chance(PREMODERN.includes(e.id) ? (up ? 0.35 : 0.5) : 0.6)) return;
    p.clsPress = 0;
    p.cls += up ? 1 : -1;
    S.log(p, up ? `You rose into the ${className(p).toLowerCase()} class.` : `You fell into the ${className(p).toLowerCase()} class.`, up ? 'good' : 'bad');
  }

  /* ---------------- jobs, activities, labels ---------------- */
  const jobCache = {};
  H.jobs = (e, cc) => {
    cc = cc || S.me()?.cc;
    const list = DATA.countryJobs[cc]; if (!list) return [];
    const key = e.id + cc;
    jobCache[key] ||= list.map(([t, m, o]) => Object.assign(J(t, Math.round(e.cost * m * 100) / 100, o), { cc }));
    return jobCache[key].filter(S.inWindow);
  };
  const localCache = {};
  H.jobMap = (j, cc) => {
    cc = cc || S.me()?.cc;
    const m = DATA.jobLocal[j.id]; if (!m || !cc) return j;
    const t = cc in m ? m[cc] : m['*'];
    if (t === null) return null;
    if (t === j.t) return j;
    const key = j.id + cc;
    return (localCache[key] ||= { ...j, t, tf: null, grant: null });
  };
  H.jobWhy = (p, j) => {
    const w = [];
    if (j.cls && (p.cls ?? 2) < j.cls) w.push(`class: ${ladder(p.cc)[j.cls].toLowerCase()}`);
    if (j.im && (p.im ?? 50) < j.im) w.push(`imagination ${j.im}`);
    if (/pilot|captain|astronaut|cosmonaut/i.test(j.t) && Gen.effects.colourBlind(p)) w.push('normal colour vision');
    return w;
  };
  H.acts = (p, e) => (DATA.countryActs[p.cc] || []).map(a => ({ ...a, cost: Math.round(e.cost * (a.c || 0) * 100) / 100 }));
  H.label = (lab, e) => DATA.labels[lab]?.[e.id] || lab;
  H.actKind = {
    mind(p, act, e) {
      if (PREMODERN.includes(e.id) && U.chance(0.2)) { p.mh = U.clamp(p.mh - 2); return 'The cure was cold baths and bleeding. It did not help.'; }
      p.mh = U.clamp(p.mh + U.ri(4, 10) + (PREMODERN.includes(e.id) ? 0 : 3)); p.hp = U.clamp(p.hp + 2);
      return 'You talked it through and left feeling lighter.';
    },
    create(p, act, e) {
      const im = p.im ?? 50; p.im = U.clamp(im + U.ri(1, 3));
      if (U.chance(im / 140)) {
        const got = S.toVal(e.cost * (im / 100) * U.rand(0.05, 0.6)); p.money += got; p.fm = U.clamp((p.fm ?? 0) + U.ri(1, 4));
        return `People loved it. It earned you ${S.money(got)} and a little fame.`;
      }
      p.hp = U.clamp(p.hp + 2);
      return 'Nobody much noticed, but you made it, and that matters.';
    },
  };

  /* ---------------- people: creation, yearly body and mind ---------------- */
  const mid = (a, b, lo, hi) => (a != null && b != null ? U.clamp(Math.round((a + b) / 2 + U.ri(-15, 15)), 1, 100) : U.ri(lo, hi));
  H.onCreate = (p, o) => {
    const fa = S.P(p.fa), mo = S.P(p.mo);
    p.cc ||= 'ENG';
    p.g = fa?.g && mo?.g ? Gen.cross(fa.g, mo.g, p.sex) : Gen.make(Gen.pop(W(), p.cc), p.sex);
    const c = C(p.cc);
    if (c?.fo) p.fo = 1;
    if (c?.fem) { if (p.sex === 'F' && /(ov|ev|in)$/.test(p.last)) p.last += 'a'; if (p.sex === 'M' && /(ova|eva|ina)$/.test(p.last)) p.last = p.last.slice(0, -1); }
    p.mh ??= U.ri(55, 90); p.fe = Gen.effects.fertility(p);
    p.im = mid(fa?.im, mo?.im, 15, 85); p.wp = mid(fa?.wp, mo?.wp, 20, 85); p.fm = U.ri(0, 4);
    p.bmi = S.age(p) < 18 ? 16.5 : U.rand(19, 27);
    p.cls = o.near ? U.clamp((o.near.cls ?? 2) + U.ri(-1, 1), 0, 5) : Math.max(fa?.cls ?? 0, mo?.cls ?? 0) || 2;
    p.orgs = []; p.travels = [];
  };
  H.onSeed = (p, lvl) => { p.cls = [1, 2, 3, 4, 5][lvl]; };
  H.onFamily = p => {
    ensureWorld();
    for (const q of Object.values(W().people)) if (C(q.cc)?.fem) { if (q.sex === 'F' && /(ov|ev|in)$/.test(q.last)) q.last += 'a'; if (q.sex === 'M' && /(ova|eva|ina)$/.test(q.last)) q.last = q.last.slice(0, -1); }
    if (hasNarrative()) S.log(p, `Chapter I · Beginnings. ${chapterText(p, 0)}`, 'chapter');
  };
  H.tick = (p, e, a) => {
    Gen.effects.tick(p, a);
    if (p.sex === 'F' && a > 35) p.fe = U.clamp(p.fe - (a > 44 ? 8 : 3)); else if (p.sex === 'M' && a > 50) p.fe = U.clamp(p.fe - 1);
    const target = 35 + p.hp * 0.45 - (p.prison ? 15 : 0) - (p.flags.war ? 10 : 0) - (p.sick.length ? 8 : 0);
    p.mh = U.clamp((p.mh ?? 60) + (target - (p.mh ?? 60)) * 0.1 + U.rand(-2, 2));
    p.bmi = a >= 18 ? U.clamp((p.bmi ?? 22) + U.rand(-0.3, 0.45) * (a > 40 ? 1.2 : 0.8), 15, 45) : U.clamp(15.5 + a * 0.33 + U.rand(-0.5, 0.5), 14, 24);
    const lit = p.job?.fame || (p.office?.lvl ?? 0) >= 2 || (p.sport?.lvl ?? 0) >= 3 || (p.phone?.followers ?? 0) >= 5000;
    if ((p.fm ?? 0) > 3) p.fm = U.clamp(p.fm - p.fm * (lit ? 0.015 : 0.06));
  };
  H.mort = (p, a) => Gen.effects.mort(p, a, S.era().id) * ((p.mh ?? 60) < 25 ? 1.25 : 1) * ((p.bmi ?? 22) > 35 ? 1.3 : (p.bmi ?? 22) < 17 && a >= 18 ? 1.2 : 1) * (p.flags.dogWalks >= W().year - 1 && a >= 40 ? 0.97 : 1);
  H.catchMul = (p, d) => Gen.effects.catchMul(p, d);
  H.fert = (mo, fa) => {
    const lim = S.law('kids', S.era(), mo.cc);
    if (lim && mo.kids.length >= lim) return 0;
    return U.clamp(((mo.fe ?? 60) / 60) * ((fa?.fe ?? 60) / 65), 0, 2.2);
  };
  H.onBirth = (c, fa, mo) => {
    if (!U.chance(0.012 + (Gen.effects.twins(mo) ? 0.06 : 0))) return;
    const t = S.childOf(fa, mo, yr());
    if (U.chance(0.33)) { t.g = JSON.parse(JSON.stringify(c.g)); t.sex = c.sex; t.first = S.pickName(c.sex, S.era(), c.cc); t.lk = c.lk; }
    c.twin = t.id; t.twin = c.id;
    [fa, mo].forEach(x => x && S.log(x, `Twins! ${t.first} arrived just after ${c.first}.`, 'family'));
    const pl = S.me();
    if (pl && (pl.id === fa?.id || pl.id === mo?.id)) { pl.flags.twins = 1; S.rel(pl, t).c = 90; }
  };
  H.onDeath = p => {
    if (p.id === W().playerId) return;
    const heir = [S.spouse(p), ...S.kids(p)].find(x => x && S.alive(x));
    for (const pet of petsOf(p)) { pet.owner = heir ? heir.id : null; if (!heir) pet.died = yr(); }
  };
  H.onInherit = (p, h) => { for (const pet of petsOf(p)) pet.owner = h.id; };
  H.summary = (sum, p) => { sum.cc = p.cc; sum.country = cName(p.cc); sum.cls = className(p); };
  H.fx = (p, fx) => {
    if (fx.royal) {
      const o = S.newLover(p, true); o.cls = 6; o.title = o.sex === 'M' ? 'Prince' : 'Princess';
      S.marry(p, o); p.cls = 6; p.title = p.sex === 'M' ? 'Prince' : 'Princess'; p.fm = U.clamp((p.fm ?? 0) + 30); p.flags.royal = 1;
    }
    if (fx.rival) S.newFriend(p, 'enemy');
    if (fx.perf && p.job) p.job.perf = U.clamp(p.job.perf + fx.perf);
    if (fx.carer) p.flags.carer = 1;
    if (fx.bmi) p.bmi = U.clamp((p.bmi ?? 22) + fx.bmi, 14, 45);
    if (fx.famc) S.known(p).filter(o => S.alive(o) && p.rels[o.id]?.k === 'fam').forEach(o => { S.rel(p, o).c = U.clamp(S.rel(p, o).c + fx.famc); });
  };

  /* ---------------- events ---------------- */
  function holiday(p) {
    const list = (DATA.holidays[p.cc] || []).filter(([, f, t]) => yr() >= f && (t == null || yr() <= t));
    if (!list.length) return null;
    const [n] = U.pick(list);
    return { id: 'holiday', p: 0.22, min: 2, t: `It is ${n}.`, ch: [
      { l: 'Celebrate with family', fx: { hp: 5, mh: 2, famc: 5 }, t: 'Food, noise and far too many relatives. Wonderful.' },
      { l: 'Host a feast', fx: { $c: -0.03, rep: 2, hp: 6, famc: 3 }, t: 'Your table was the talk of the neighbourhood.' },
      { l: 'Spend it quietly', fx: { mh: 2 }, t: 'A peaceful day to yourself.' }] };
  }
  H.events = p => { const h = holiday(p); return [...(DATA.countryEvents[p.cc] || []), ...DATA.moreEvents, ...(h ? [h] : [])]; };
  H.maxEvents = () => (W().mode === 'household' ? 2 : 3);

  /* ---------------- nations ---------------- */
  function nat() {
    const w = W(); w.nat ||= {}; w.rel ||= {};
    for (const c of countriesAt()) w.nat[c.id] ||= { stab: U.ri(45, 75) };
    return w.nat;
  }
  function relOf(a, b) {
    if (a === b) return 100;
    const w = W(), k = [a, b].sort().join('|'); w.rel ||= {};
    if (w.rel[k] == null) w.rel[k] = C(a)?.region === C(b)?.region ? U.ri(-10, 45) : U.ri(-20, 30);
    return w.rel[k];
  }
  const addRel = (a, b, d) => { const k = [a, b].sort().join('|'); W().rel[k] = U.clamp(relOf(a, b) + d, -100, 100); };
  const warsOf = cc => S.activeWars().filter(h => !h.where || h.where.includes(cc));
  function natTick() {
    const n = nat();
    for (const [cc, s] of Object.entries(n)) s.stab = U.clamp(s.stab + U.rand(-3, 3) + (62 - s.stab) * 0.05 - (warsOf(cc).length ? 3 : 0));
    for (const h of S.activeWars()) if (h.where && h.y === yr()) for (const a of h.where) for (const b of h.where) if (a < b && U.chance(0.5)) addRel(a, b, -U.ri(10, 30));
    for (const k of Object.keys(W().rel)) W().rel[k] += (0 - W().rel[k]) * 0.01 + U.rand(-1.5, 1.5);
  }
  function nations() {
    const p = S.me(), n = nat();
    return countriesAt().map(c => ({
      cc: c.id, c, name: cName(c.id), gov: cGov(c.id), cap: cCap(c.id), pop: popAt(c.id), cur: H.cur(c.id, yr()) || S.era().cur,
      stab: Math.round(n[c.id].stab), rel: c.id === p.cc ? 100 : Math.round(relOf(p.cc, c.id)), wars: warsOf(c.id).map(h => h.n), home: c.id === p.cc,
    })).sort((a, b) => (b.home - a.home) || b.pop - a.pop);
  }
  const inOffice = p => (p.cls ?? 0) >= 5 || /senator|governor|lord|lady|mandarin|scholar-official|courtier|diplomat|administrator|council/i.test(p.job?.t || '') || (p.orgs || []).some(o => (DATA.orgs.find(x => x.id === o.id)?.k === 'Power' || o.id === 'party') && o.rank >= 1);
  function tripCost(p, cc) {
    const a = C(p.cc), b = C(cc), e = S.era();
    const mult = a?.region === 'space' || b?.region === 'space' ? 2 : a?.region !== b?.region ? 0.25 : 0.08;
    return S.toVal(e.cost * mult);
  }
  const enemies = (a, b) => S.activeWars().some(h => h.where && h.where.includes(a) && h.where.includes(b) && a !== b);
  function travel(cc) {
    const p = S.me(), e = S.era(), c = C(cc);
    if (cc === p.cc) return 'You are already here.';
    if (enemies(p.cc, cc)) return 'The borders are closed: your countries are at war.';
    if (S.law('noEmigrate', e, p.cc)) return 'The law forbids you from leaving the country.';
    if (S.age(p) < 12) return 'You are too young to travel alone.';
    if (p.did.travel) return 'You already travelled this year.';
    const cost = tripCost(p, cc);
    if (p.money < cost) return `The journey costs ${S.money(cost)}. You cannot afford it.`;
    p.did.travel = 1; p.money -= cost;
    S.applyFx(p, { hp: [6, 12], im: [2, 5], sm: 1 });
    if (!p.travels.includes(cc)) p.travels.push(cc);
    let t = `You travelled to ${cName(cc)} and saw ${cCap(cc)}.`;
    if (U.chance(0.4)) {
      const o = S.mkPerson({ cc, near: p, born: U.add(yr(), -U.clamp(S.age(p) + U.ri(-8, 8), 12, 90)) });
      p.rels[o.id] = { k: 'friend', c: U.ri(45, 75) }; o.rels[p.id] = { k: 'friend', c: U.ri(45, 75) };
      t += ` You befriended ${o.first}, a local.`;
    }
    if (U.chance(PREMODERN.includes(e.id) ? 0.12 : 0.03)) { p.h = U.clamp(p.h - U.ri(5, 15)); t += ' You came home with a foreign fever.'; }
    S.log(p, t, 'good');
    return t;
  }
  function emigrate(cc, family) {
    const p = S.me(), e = S.era();
    if (cc === p.cc) return 'You already live here.';
    if (enemies(p.cc, cc)) return 'You cannot move to a country your own is at war with.';
    if (S.age(p) < 16) return 'You are too young to move abroad on your own.';
    const cost = tripCost(p, cc) * 3;
    if (p.money < cost) return `Moving costs ${S.money(cost)}. You cannot afford it.`;
    if (S.law('noEmigrate', e, p.cc)) {
      if (!U.chance(0.35)) { S.jail(p, U.ri(2, 5)); S.log(p, 'You were caught trying to leave the country and imprisoned.', 'bad'); return 'Caught at the border. You were imprisoned.'; }
      p.rep = U.clamp(p.rep - 5);
    }
    p.money -= cost;
    const from = p.cc; p.cc = cc;
    const moved = [];
    if (family) for (const o of [S.spouse(p), ...S.kids(p).filter(k => S.age(k) < 18)]) if (o && S.alive(o)) { o.cc = cc; moved.push(o.first); }
    if (p.job && !['digital', 'near', 'far'].includes(e.id)) { S.log(p, `You left your job as ${p.job.t.toLowerCase()} behind.`, 'work'); p.job = null; }
    S.applyFx(p, { rep: -5, mh: -3, hp: [-4, 6], im: 3 });
    S.known(p).filter(o => S.alive(o) && o.cc === from).forEach(o => { if (p.rels[o.id]) p.rels[o.id].c = U.clamp(p.rels[o.id].c - 8); });
    if (!p.travels.includes(cc)) p.travels.push(cc);
    const t = `You emigrated from ${cName(from)} to ${cName(cc)}${moved.length ? ` with ${moved.join(', ')}` : ''}.`;
    S.log(p, t, 'switch');
    return t;
  }
  function invest(cc, share) {
    const p = S.me(), e = S.era(), s = nat()[cc];
    const amt = S.toVal(e.cost * share);
    if (S.age(p) < 18) return 'You must be an adult to invest.';
    if (p.money < amt) return `You need ${S.money(amt)} to invest.`;
    p.money -= amt;
    p.assets.push({ uid: W().nid++, id: 'venture-' + cc, t: `${C(cc).adj} venture`, kind: 'stock', val: amt, appr: 0.03 + (s.stab - 55) / 800, inc: 0.02, vol: 0.35 * (1 - s.stab / 150), era: e.id, y: yr() });
    S.log(p, `You invested ${S.money(amt)} in ${cName(cc)}.`, 'money');
    return `Invested ${S.money(amt)}.`;
  }
  function diplomacy(cc, act) {
    const p = S.me(), e = S.era();
    if (!inOffice(p)) return 'Only people in high office can conduct diplomacy.';
    if (p.did['dip:' + cc]) return 'You already dealt with them this year.';
    p.did['dip:' + cc] = 1;
    if (act === 'embassy') { const d = U.ri(4, 14); addRel(p.cc, cc, d); S.applyFx(p, { fm: 2, rep: 1 }); return `Your embassy warmed relations with ${cName(cc)} (+${d}).`; }
    if (act === 'aid') { const c = S.toVal(e.cost * 0.5); if (p.money < c) return `Aid costs ${S.money(c)}.`; p.money -= c; addRel(p.cc, cc, 12); nat()[cc].stab = U.clamp(nat()[cc].stab + 4); S.applyFx(p, { rep: 3, fm: 2 }); return 'Your aid was gratefully received.'; }
    if (act === 'denounce') { addRel(p.cc, cc, -U.ri(8, 18)); S.applyFx(p, { fm: 3, rep: -1 }); return `You denounced ${cName(cc)}. Crowds cheered, diplomats winced.`; }
    return '';
  }

  /* ---------------- organisations ---------------- */
  const orgsAvail = p => DATA.orgs.filter(o => S.inWindow(o) && (!o.cc || o.cc.includes(p.cc)));
  function orgWhy(p, o) {
    const r = o.req || {}, w = [];
    if (S.age(p) < (r.age || 14)) w.push(`age ${r.age || 14}+`);
    if (r.sm && p.sm < r.sm) w.push(`smarts ${r.sm}`);
    if (r.lk && p.lk < r.lk) w.push(`looks ${r.lk}`);
    if (r.rep && p.rep < r.rep) w.push(`reputation ${r.rep}`);
    if (r.edu && p.edu < r.edu) w.push('more schooling');
    if (r.cls && (p.cls ?? 2) < r.cls) w.push('higher class');
    if (r.sex && r.sex !== p.sex) w.push(r.sex === 'M' ? 'men only' : 'women only');
    if (r.job && !p.job) w.push('a job');
    return w;
  }
  function orgAct(id, act) {
    const p = S.me(), e = S.era(), o = DATA.orgs.find(x => x.id === id), m = p.orgs.find(x => x.id === id);
    if (act === 'join') {
      if (m) return 'You are already a member.';
      const why = orgWhy(p, o); if (why.length) return `They need: ${why.join(', ')}.`;
      p.orgs.push({ id, rank: 0, y: yr() }); S.log(p, `You joined ${o.n}.`, 'good'); return `Welcome to ${o.n}.`;
    }
    if (!m) return 'You are not a member.';
    if (p.did['org:' + id + act]) return 'You already did that this year.';
    p.did['org:' + id + act] = 1;
    if (act === 'attend') {
      S.applyFx(p, { hp: 3, ...Object.fromEntries(Object.entries(o.perk).filter(([k]) => k !== '$')) });
      let t = `You took part in the life of ${o.n}.`;
      if (U.chance(0.4)) { const f = S.newFriend(p); t += ` You got to know ${f.first}.`; }
      return t;
    }
    if (act === 'donate') { const c = S.toVal(e.cost * 0.1); if (p.money < c) return `A worthwhile gift would be ${S.money(c)}.`; p.money -= c; p.rep = U.clamp(p.rep + 3); m.pts = (m.pts || 0) + 2; return 'Your generosity was noted.'; }
    if (act === 'rise') {
      if (m.rank >= o.ranks.length - 1) return 'You already lead it.';
      const odds = U.clamp(0.15 + (yr() - m.y) * 0.04 + (m.pts || 0) * 0.05 + (p.rep - 40) / 200, 0.05, 0.85);
      if (U.chance(odds)) { m.rank++; S.applyFx(p, { rep: 3, fm: 2 }); S.log(p, `You became ${o.ranks[m.rank].toLowerCase()} of ${o.n}.`, 'good'); return `You are now ${o.ranks[m.rank]}.`; }
      m.pts = (m.pts || 0) + 1; return 'Not yet. Keep showing up.';
    }
    if (act === 'leave') { p.orgs = p.orgs.filter(x => x.id !== id); S.log(p, `You left ${o.n}.`, 'life'); return 'You left.'; }
    return '';
  }
  function orgsTick(p, e) {
    for (const m of (p.orgs || []).slice()) {
      const o = DATA.orgs.find(x => x.id === m.id);
      if (!o || !S.inWindow(o)) { p.orgs = p.orgs.filter(x => x !== m); S.log(p, `${o ? o.n[0].toUpperCase() + o.n.slice(1) : 'Your society'} has passed into history.`, 'world'); continue; }
      p.money -= S.toVal(e.cost * (o.fee || 0));
      const k = (m.rank + 1) * 0.5;
      if (o.perk.$) p.money += S.toVal(e.cost * o.perk.$ * (m.rank + 1));
      for (const [s, v] of Object.entries(o.perk)) if (s !== '$') p[s] = U.clamp((p[s] ?? 50) + v * k * 0.5);
      if (o.risk && U.chance(o.risk)) { p.h = U.clamp(p.h - U.ri(10, 25)); S.log(p, `Danger came with membership of ${o.n}. You were hurt.`, 'bad'); }
    }
  }

  /* ---------------- pets ---------------- */
  const petsOf = p => Object.values(W().pets || {}).filter(x => x.owner === p.id && x.died == null);
  const petSpec = k => DATA.pets.find(x => x.id === k);
  const petsAvail = p => DATA.pets.filter(x => S.inWindow(x));
  function adoptPet(kind, name) {
    const p = S.me(), e = S.era(), sp = petSpec(kind);
    if (S.age(p) < 5) return 'You are too young to look after a pet.';
    if (sp.cls && (p.cls ?? 2) < sp.cls) return `Keeping a ${sp.n.toLowerCase()} is for the upper classes here.`;
    const cost = S.toVal(e.cost * sp.cost);
    const payer = S.age(p) < 18 ? (S.parents(p).filter(S.alive).sort((a, b) => b.money - a.money)[0] || p) : p;
    if (payer.money < cost) return `A ${sp.n.toLowerCase()} costs ${S.money(cost)}.`;
    payer.money -= cost;
    W().pets ||= {};
    const pet = { id: W().nid++, kind, n: (name || '').trim() || U.pick(DATA.petNames), born: yr(), died: null, owner: p.id, h: 90, bond: 55, tricks: 0, life: U.ri(sp.life[0], sp.life[1]) };
    W().pets[pet.id] = pet;
    p.flags.pets = (p.flags.pets || 0) + 1;
    S.log(p, `You brought home a ${sp.n.toLowerCase()} and named it ${pet.n}.`, 'family');
    return `Meet ${pet.n}!`;
  }
  function petAct(id, act) {
    const p = S.me(), e = S.era(), pet = W().pets[id]; if (!pet || pet.died != null) return '';
    if (p.did['pet:' + id + act]) return `${pet.n} has had enough of that for this year.`;
    p.did['pet:' + id + act] = 1;
    const sp = petSpec(pet.kind), bump = (b, fx, t) => { pet.bond = U.clamp(pet.bond + b); if (fx) S.applyFx(p, fx); return t; };
    switch (act) {
      case 'play': return bump(10, { hp: 3 }, `You played with ${pet.n}.`);
      case 'walk': return bump(8, { h: 2, hp: 2 }, `You and ${pet.n} walked for miles.`);
      case 'groom': pet.h = U.clamp(pet.h + 5); return bump(6, null, `${pet.n} looks magnificent.`);
      case 'feed': pet.h = U.clamp(pet.h + 3); return bump(5, { hp: 1 }, `${pet.n} loved the treat.`);
      case 'ride': return bump(6, { hp: 4, rep: 1 }, `You rode ${pet.n} across the countryside.`);
      case 'hunt': return bump(5, { rep: 2 }, `${pet.n} brought down a hare. Admirers gathered.`);
      case 'milk': return bump(3, { h: 2 }, `${pet.n} gave good milk, grudgingly.`);
      case 'teach': return bump(4, { im: 1 }, U.chance(0.4) ? `${pet.n} learned a word you would rather it had not.` : `${pet.n} can now say your name.`);
      case 'fly': return bump(6, { fm: 2, hp: 4 }, `${pet.n} looped over the rooftops. Crowds pointed.`);
      case 'upgrade': { const c = S.toVal(e.cost * 0.05); if (p.money < c) return `Upgrades cost ${S.money(c)}.`; p.money -= c; pet.h = 100; return bump(4, null, `${pet.n} is running the latest firmware.`); }
      case 'train': pet.tricks++; if (pet.tricks >= 5 && U.chance(0.3)) S.applyFx(p, { fm: 2 }); return bump(5, null, `${pet.n} learned a new trick (${pet.tricks} so far).`);
      case 'vet': { const c = S.toVal(e.cost * 0.03); if (p.money < c) return `The ${PREMODERN.includes(e.id) ? 'animal doctor' : 'vet'} costs ${S.money(c)}.`; p.money -= c; pet.h = U.clamp(pet.h + 25); return `${pet.n} feels much better.`; }
      case 'rehome': pet.owner = null; pet.died = yr(); pet.gone = 1; S.log(p, `You found ${pet.n} a new home.`, 'life'); p.hp = U.clamp(p.hp - 4); return `${pet.n} has a new home.`;
    }
    return '';
  }
  function petsTick() {
    for (const pet of Object.values(W().pets || {})) {
      if (pet.died != null) continue;
      const age = yr() - pet.born, owner = S.P(pet.owner), sp = petSpec(pet.kind);
      pet.bond = U.clamp(pet.bond - 5); pet.h = U.clamp(pet.h - (age > pet.life * 0.7 ? 6 : 1) + U.ri(-2, 2));
      if (age >= pet.life || pet.h <= 0 || U.chance(0.02)) {
        pet.died = yr();
        if (owner && owner.id === W().playerId) { S.log(owner, `Your ${sp.n.toLowerCase()} ${pet.n} died at ${age}.`, 'death'); S.applyFx(owner, { hp: -Math.round(3 + pet.bond / 10), mh: -Math.round(1 + pet.bond / 20) }); }
        continue;
      }
      if (owner && S.alive(owner) && pet.bond > 30) {
        const k = (pet.bond - 30) / 50;                     // 0 at a weak bond, 1.4 at the strongest
        S.applyFx(owner, Object.fromEntries(Object.entries(sp.bonus).map(([s, v]) => [s, Math.round(v * k * 10) / 10])));
        const lonely = !S.spouse(owner) && Object.values(owner.rels).filter(r => r.k === 'friend' && r.c >= 40).length < 2;
        if (lonely) S.applyFx(owner, { mh: 1.5 * k, hp: 1 * k });
        if (/dog|robodog/.test(pet.kind)) owner.flags.dogWalks = W().year;
      }
    }
  }

  /* ---------------- ambitions, chapters, story ---------------- */
  const hasNarrative = () => ['narrative', 'god'].includes(W().mode);
  const CHAPTERS = [[0, 'I', 'Beginnings'], [6, 'II', 'Childhood'], [13, 'III', 'Coming of Age'], [18, 'IV', 'Setting Out'], [30, 'V', 'The Middle of the Road'], [50, 'VI', 'Harvest'], [70, 'VII', 'Twilight'], [90, 'VIII', 'The Long Evening']];
  function chapterText(p, a) {
    const tier = k => DATA.statTier(k, p[k] ?? 50).name.toLowerCase();
    const where = cName(p.cc), cls = className(p).toLowerCase();
    const opener = a === 0 ? `You are born in ${U.fmtYearAD(yr())}, in ${where}, into a ${cls} family.` : `It is ${U.fmtYearAD(yr())} in ${where}, and you are ${a}.`;
    const body = a < 13 ? `Your health is ${tier('h')} and your mind ${tier('sm')}.` : `People would call you ${tier('lk')} to look at and ${tier('sm')} of mind; your spirit is ${tier('mh')}.`;
    const wars = warsOf(p.cc).map(h => h.n);
    const world = wars.length ? ` The ${wars[0]} darkens everything.` : ` The ${S.era().name} era ${a === 0 ? 'waits for you' : 'goes on around you'}.`;
    return opener + ' ' + body + world;
  }
  function chaptersTick(p) {
    if (!hasNarrative()) return;
    const a = S.age(p), ch = CHAPTERS.find(c => c[0] === a && a > 0);
    if (!ch) return;
    const text = chapterText(p, a);
    S.log(p, `Chapter ${ch[1]} · ${ch[2]}. ${text}`, 'chapter');
    S.prompt({ title: `Chapter ${ch[1]}`, text: `${ch[2]}\n\n${text}`, chapter: true, choices: [{ l: 'Turn the page', go: () => '' }] });
  }
  function ambitionTick(p) {
    const a = S.age(p);
    if (a === 16 && !p.amb && !p.flags.ambAsked) {
      p.flags.ambAsked = 1;
      const opts = U.shuffle(DATA.ambitions).slice(0, 4);
      S.prompt({ title: 'A life’s ambition', text: 'You are sixteen. What do you want from your life?', choices: [
        ...opts.map(o => ({ l: o.n, go: () => { p.amb = o.id; S.log(p, `Your ambition: ${o.n.toLowerCase()}. ${o.d}`, 'ach'); return `Ambition set: ${o.n}.`; } })),
        { l: 'Take life as it comes', go: () => { S.log(p, 'You decided to take life as it comes.', 'life'); return 'No grand plans.'; } }] });
    }
    if (p.amb && !p.flags.ambDone) {
      const o = DATA.ambitions.find(x => x.id === p.amb);
      if (o && o.test(p, S)) { p.flags.ambDone = 1; S.applyFx(p, { hp: 15, mh: 10, rep: 5 }); S.log(p, `You achieved your life's ambition: ${o.n.toLowerCase()}!`, 'ach'); }
    }
  }
  function story(p) {
    const out = [];
    let cur = null;
    for (const l of p.log) {
      if (l.k === 'quiet') continue;
      const ch = [...CHAPTERS].reverse().find(c => l.a >= c[0]);
      if (!cur || cur.n !== ch[1]) { cur = { n: ch[1], title: ch[2], lines: [] }; out.push(cur); }
      if (l.k === 'chapter') { cur.intro = l.t.replace(/^Chapter [IVX]+ · [^.]+\. /, ''); continue; }
      const t = l.t.replace(/^You /, 'you ').replace(/^Your /, 'your ');
      cur.lines.push(l.k === 'world' ? `In ${U.fmtYearAD(l.y)}, ${t.charAt(0).toLowerCase() + t.slice(1)}` : `At ${l.a}, ${t.charAt(0).toLowerCase() === t.charAt(0) ? t : t.charAt(0).toLowerCase() + t.slice(1)}`);
    }
    return out;
  }

  /* ---------------- modes, world setup, migration ---------------- */
  function ensurePerson(p) {
    p.cc ||= 'ENG';
    if (!p.g) p.g = Gen.make(Gen.pop(W(), p.cc), p.sex);
    p.mh ??= U.ri(55, 85); p.fe ??= Gen.effects.fertility(p); p.im ??= U.ri(20, 80); p.wp ??= U.ri(25, 80); p.fm ??= Math.round((p.rep ?? 10) / 5);
    p.bmi ??= 22; p.cls ??= 2; p.orgs ||= []; p.travels ||= [];
  }
  function ensureWorld() {
    const w = W();
    w.mode ||= 'narrative'; w.pets ||= {}; w.auto ||= {}; w.rel ||= {};
    nat();
  }
  H.migrate = w => { ensureWorld(); Object.values(w.people).forEach(ensurePerson); };
  H.preYear = (p, e) => {
    ensureWorld();
    natTick();
    if (yr() % 5 === 0) Gen.evolve(W(), yr(), 5);
    petsTick();
    orgsTick(p, e);
  };
  H.postYear = (p, e) => { classTick(p, e); ambitionTick(p); chaptersTick(p); };

  /* ---------------- god-mode edits ---------------- */
  const god = {
    stat(id, k, v) { const p = S.P(id); if (p) p[k] = U.clamp(+v); },
    money(id, v) { const p = S.P(id); if (p) p.money = +v * S.curNow(p.cc).r; },
    cls(id, v) { const p = S.P(id); if (p) p.cls = U.clamp(+v, 0, 6); },
    country(id, cc) { const p = S.P(id); if (p) p.cc = cc; },
    look(id, k, v) { const p = S.P(id); if (!p) return; p.phx ||= {}; if (v === '' || v == null) delete p.phx[k]; else p.phx[k] = v; },
    title(id, t) { const p = S.P(id); if (p) p.title = t || null; },
    kill(id) { const p = S.P(id); if (p && S.alive(p) && p.id !== W().playerId) S.kill(p, 'the will of the gods'); },
    revive(id) { const p = S.P(id); if (p && !S.alive(p)) { p.died = null; p.cause = null; p.h = 60; p.sick = []; S.log(p, 'Brought back from death.', 'switch'); } },
    closeness(id, v) { const p = S.me(), o = S.P(id); if (o) S.rel(p, o).c = U.clamp(+v); },
    spawn(kind) {
      const p = S.me(), a = S.age(p);
      if (kind === 'friend') return S.newFriend(p);
      if (kind === 'lover') return S.newLover(p);
      if (kind === 'rival') return S.newFriend(p, 'enemy');
      if (kind === 'child') { const o = S.mkPerson({ near: p, born: yr(), last: W().dyn.name, fa: p.sex === 'M' ? p.id : S.spouse(p)?.id, mo: p.sex === 'F' ? p.id : S.spouse(p)?.id }); if (!o.fa && !o.mo) { p.kids.push(o.id); o[p.sex === 'M' ? 'fa' : 'mo'] = p.id; } S.rel(p, o).c = 90; return o; }
      if (kind === 'sibling') { const [fa, mo] = [S.P(p.fa), S.P(p.mo)]; if (!fa && !mo) return null; const o = S.childOf(fa, mo, U.add(yr(), -U.ri(0, Math.max(0, a + 5)))); S.rel(p, o).c = 70; return o; }
      return null;
    },
  };

  const pheno = p => {
    const P = Gen.pop(W(), p.cc || 'ENG');
    return Gen.phenotype(p, W(), { age: S.age(p), ht: P.ht || [175, 162], adj: P.adj || 0, era: S.eraOf(U.add(p.born, 10)).id });
  };

  DATA.achievements.push(
    { id: 'ambition', n: 'Dream Fulfilled', d: 'Achieve your life’s ambition.', test: p => !!p.flags.ambDone },
    { id: 'globetrotter', n: 'Globetrotter', d: 'Travel to five foreign lands.', test: p => (p.travels || []).length >= 5 },
    { id: 'royalty', n: 'Royal Blood', d: 'Join a royal family.', test: p => (p.cls ?? 0) >= 6 },
    { id: 'twins', n: 'Double Trouble', d: 'Have twins.', test: p => !!p.flags.twins },
    { id: 'petlover', n: 'Animal Lover', d: 'Keep three pets in one life.', test: p => (p.flags.pets || 0) >= 3 },
    { id: 'celebrity', n: 'Celebrity', d: 'Reach 90 fame.', test: p => (p.fm ?? 0) >= 90 },
    { id: 'zen', n: 'Inner Peace', d: 'Reach 95 mental health.', test: p => (p.mh ?? 0) >= 95 },
    { id: 'fused', n: 'Reality Weaver', d: 'Fuse two lives together.', test: p => !!p.flags.fused },
  );

  Object.assign(S, {
    world: { C, name: cName, gov: cGov, cap: cCap, popAt, countriesAt, rel: relOf, addRel: (a, b, d) => { relOf(a, b); addRel(a, b, d); }, wars: warsOf, laws: lawsFor, nations, travel, emigrate, invest, diplomacy, inOffice, tripCost, ladder },
    className, ladder, orgsAvail, orgWhy, orgAct, petsOf, petsAvail, petSpec, adoptPet, petAct, story, god, pheno, ensureWorld, ensurePerson,
    hasNarrative, godAllowed: () => W().mode === 'god' || !!W().godOn, CHAPTERS,
  });
})();
