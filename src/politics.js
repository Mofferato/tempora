/* =====================================================================
   POLITICS — offices, elections, ruling and war, and a world of rulers
   that rise and fall.
   * Every land has a kind of government (read from its current name):
     tribal, monarchy, constitutional monarchy, republic, one-party
     state, theocracy, colony or charter. Each has a ladder of five
     offices, won by acclaim, election, appointment, inheritance or coup.
   * In office you draw a salary, face yearly decisions and keep an
     approval rating. At the top you set policy, build monuments,
     make alliances and declare wars that draft real people.
   * Every country has a ruler who ages, dies and is succeeded; unstable
     lands have revolutions and restorations; wars end in victory,
     defeat or occupation. All of it is saved in W.reg and W.wars.
   ===================================================================== */

const Pol = (() => {
  const S = Sim, W = () => S.W, yr = () => S.W.year;
  const C = cc => S.world.C(cc);
  const premodern = () => DATA.PREMODERN.includes(S.era().id);

  /* ---------- kinds of government ---------- */
  function kindOf(cc) {
    const g = (S.world.gov(cc) || '').toLowerCase(), e = S.era().id;
    if (e === 'prehistory' || /band|forager|hunter|clan|tribe|village|chiefdom|herding|fishing|camp|hamlet|proto|temple town|cult centre|nomad/.test(g)) return 'tribal';
    if (/one-party|party/.test(g)) return 'party';
    if (/theocra/.test(g)) return 'theo';
    if (/constitutional/.test(g)) return 'const';
    if (/republic|democra|federal|commonwealth|free states|city league|assembly|city-state|trading republic/.test(g)) return 'republic';
    if (/colon|province|satrap|mandate|regency|viceroy|occupied|provinces/.test(g)) return 'colony';
    if (/corporate|charter|authority/.test(g)) return 'charter';
    return 'monarchy';
  }
  const ISLAMIC = ['EGY', 'IRN', 'MAG', 'MSP', 'LEV', 'ANA'];
  function headTitle(cc, sex) {
    const g = (S.world.gov(cc) || '').toLowerCase(), n = (S.world.name(cc) || '').toLowerCase(), F = sex === 'F', y = yr();
    if (cc === 'EGY' && y < -30) return 'Pharaoh';
    if (/shogun/.test(g) || /shogunate/.test(n)) return 'Shogun';
    if (/caliph/.test(g + n)) return 'Caliph';
    if (/sultan/.test(g + n)) return F ? 'Sultana' : 'Sultan';
    if (cc === 'IRN' && y > -600 && y < 1979) return F ? 'Shahbanu' : 'Shah';
    if (cc === 'RUS' && y >= 1547 && y < 1917) return F ? 'Tsaritsa' : 'Tsar';
    if (/empire/.test(g + n)) return F ? 'Empress' : 'Emperor';
    if (/grand duchy/.test(g + n)) return F ? 'Grand Duchess' : 'Grand Duke';
    if (/principalit/.test(g)) return F ? 'Princess' : 'Prince';
    if (/chief|tribe|clan|band|nomad/.test(g)) return F ? 'Chieftess' : 'Chief';
    return F ? 'Queen' : 'King';
  }
  function repHead(cc) {
    const y = yr();
    if (cc === 'ITA' && y >= -509 && y <= -27) return 'Consul';
    if (cc === 'GRC' && y < -146) return 'Archon';
    if (cc === 'MAG' && y < -146) return 'Suffete';
    if (/prime minister/i.test(S.world.gov(cc))) return 'Prime Minister';
    return 'President';
  }
  function legisTitle(cc) {
    const y = yr();
    if (cc === 'ITA' && y < 476) return 'Senator'; if (cc === 'GRC' && y < -146) return 'Member of the Boule';
    if (cc === 'USA') return 'Senator'; if (cc === 'FRA') return 'Deputy'; if (cc === 'SCA' && y < 1300) return 'Speaker at the Thing';
    return 'Member of Parliament';
  }
  const LADDERS = {
    tribal: ['Hunt leader', 'Elder', 'Speaker of the band', 'War chief', '@head'],
    monarchy: ['Village reeve', 'Town alderman', 'Royal councillor', '@chancellor', '@head'],
    const: ['Councillor', 'Mayor', '@legis', 'Minister', 'Prime Minister'],
    republic: ['Councillor', 'Mayor', '@legis', 'Minister', '@rhead'],
    party: ['Party cadre', 'Local party secretary', 'Central Committee member', 'Politburo member', 'General Secretary'],
    theo: ['Temple warden', 'Judge', 'Council of clerics', 'Grand vizier', 'Supreme Leader'],
    colony: ['Clerk of the council', 'Assemblyman', 'Colonial councillor', 'Lieutenant governor', 'Governor'],
    charter: ['Council delegate', 'Sector chief', 'Assembly member', 'Administrator', 'President of the Council'],
  };
  function officeTitle(cc, lvl, sex) {
    const k = kindOf(cc), raw = LADDERS[k][lvl - 1];
    if (raw === '@head') return headTitle(cc, sex);
    if (raw === '@rhead') return repHead(cc);
    if (raw === '@legis') return legisTitle(cc);
    if (raw === '@chancellor') return ISLAMIC.includes(cc) && yr() > 640 ? 'Grand vizier' : cc === 'EGY' ? 'Vizier' : cc === 'CHN' ? 'Grand Secretary' : 'Chancellor';
    if (k === 'monarchy' && lvl === 3 && cc === 'CHN') return 'Mandarin';
    return raw;
  }
  // how the office is won
  function method(k, lvl) {
    if (k === 'tribal') return lvl === 5 ? 'acclaim' : 'acclaim';
    if (k === 'republic' || k === 'const' || k === 'charter') return 'elect';
    if (k === 'monarchy' && lvl === 5) return 'throne';
    return 'appoint';
  }
  const AGE = [16, 21, 25, 30, 35], REP = [20, 35, 50, 60, 70], FAME = [0, 5, 15, 25, 40], CAMP = [0.1, 0.3, 1, 2.5, 6], SAL = [0.3, 0.6, 1.5, 3, 6], CLS = [1, 2, 3, 4, 5];

  /* ---------- world registry: regimes, rulers, policies ---------- */
  function reg(cc) {
    const w = W(); w.reg ||= {};
    return (w.reg[cc] ||= { gov: null, name: null, since: yr(), base: null, occ: null, pol: { tax: 1, army: 1, free: 1 }, works: [], ruler: null, nums: {} });
  }
  const natOf = cc => { const w = W(); w.nat ||= {}; return (w.nat[cc] ||= { stab: 60 }); };
  S.hooks.regName = (cc, base) => {
    const r = W().reg?.[cc]; if (!r) return base;
    const n = r.name && r.base === base ? r.name : base;
    return r.occ ? `${n} (under ${C(r.occ.by)?.adj || 'foreign'} occupation)` : n;
  };
  S.hooks.regGov = (cc, base) => { const r = W().reg?.[cc]; return r && r.gov && r.base === baseName(cc) ? r.gov : base; };
  const baseName = cc => { const c = C(cc); if (!c) return ''; for (const x of c.names) if (yr() <= x[0]) return x[1]; return c.names[c.names.length - 1][1]; };

  /* ---------- rulers ---------- */
  const ordinal = n => (n <= 1 ? '' : ` ${U.roman(n)}`);
  function mkRuler(cc, prev) {
    const r = reg(cc), k = kindOf(cc), e = S.era();
    const pool = S.pool(e, cc) || DATA.names[e.names];
    const sex = k === 'monarchy' || k === 'tribal' ? (U.chance(0.12) ? 'F' : 'M') : U.chance(yr() > 1950 ? 0.3 : 0.05) ? 'F' : 'M';
    const first = U.pick(sex === 'M' ? pool.m : pool.f);
    const dyn = (k === 'monarchy' || k === 'tribal') && prev?.dyn && U.chance(0.8) ? prev.dyn : U.pick(pool.last);
    r.nums[first] = (r.nums[first] || 0) + 1;
    const num = k === 'monarchy' ? r.nums[first] : 1;
    const t = k === 'monarchy' || k === 'tribal' ? headTitle(cc, sex) : officeTitle(cc, 5, sex);
    const age = k === 'monarchy' ? U.ri(16, 50) : U.ri(40, 65);
    return { first, n: `${first}${ordinal(num)}`, dyn, sex, t, born: U.add(yr(), -age), since: yr(), kind: k };
  }
  const rulerName = rr => (rr ? `${rr.t} ${rr.n}${rr.kind === 'monarchy' || rr.kind === 'tribal' ? '' : ` ${rr.dyn}`}` : '');
  function ruler(cc) {
    const r = reg(cc), p = S.me();
    if (r.ruler?.pid != null) { const q = S.P(r.ruler.pid); if (!q || !S.alive(q)) r.ruler = null; }
    if (!r.ruler) r.ruler = mkRuler(cc);
    // the ruler of your own land is a real person you can meet
    if (p && cc === p.cc && r.ruler.pid == null && !r.ruler.player) {
      const rr = r.ruler, q = S.mkPerson({ cc, born: rr.born, sex: rr.sex, first: rr.first, last: rr.dyn });
      q.title = rr.t; q.cls = rr.kind === 'monarchy' ? 6 : 5; q.flags.ruler = cc; q.rep = U.ri(55, 85); q.fm = U.ri(60, 90);
      if (q.home && S.towns) { const cap = S.towns.citiesAt(cc)[0]; if (cap) q.home = { c: cap.raw, rural: false }; }
      rr.pid = q.id;
    }
    return r.ruler;
  }
  function succeed(cc, why) {
    const r = reg(cc), old = r.ruler, k = kindOf(cc), p = S.me();
    if (old?.pid != null) { const q = S.P(old.pid); if (q && S.alive(q) && q.flags.ruler) { q.title = null; delete q.flags.ruler; } }
    r.ruler = mkRuler(cc, old);
    if (p && p.cc === cc) {
      const nn = rulerName(r.ruler);
      const t = why === 'death' ? (k === 'monarchy' || k === 'tribal' ? `${old ? rulerName(old) : 'The old ruler'} has died. ${nn} now rules ${S.world.name(cc)}.` : `${old ? rulerName(old) : 'The leader'} has died in office. ${nn} takes over.`)
        : why === 'election' ? `${nn} won the election and now leads ${S.world.name(cc)}.` : why === 'coup' ? `A coup! ${nn} has seized power in ${S.world.name(cc)}.` : `${nn} now leads ${S.world.name(cc)}.`;
      W().news.push({ y: yr(), t, type: 'politics', where: [cc] }); S.log(p, t, 'world');
    }
  }
  function rulerTick(cc) {
    const r = reg(cc), k = kindOf(cc);
    if (r.ruler?.player) { const q = S.P(r.ruler.pid); if (!q || !S.alive(q) || q.office?.lvl !== 5 || q.cc !== cc) r.ruler = null; return; }
    const rr = ruler(cc);
    if (rr.pid != null) { const q = S.P(rr.pid); if (!q || !S.alive(q)) return succeed(cc, 'death'); }
    else { const age = U.span(rr.born, yr()); if (U.chance(0.01 + Math.max(0, age - 45) * 0.004)) return succeed(cc, 'death'); }
    if ((k === 'republic' || k === 'const' || k === 'charter') && yr() - rr.since >= U.ri(4, 8)) return succeed(cc, 'election');
    if (natOf(cc).stab < 20 && U.chance(0.08)) return succeed(cc, 'coup');
  }

  /* ---------- revolutions, restorations, occupation ---------- */
  const REV = {
    monarchy: [['Revolutionary republic', 'the {Adj} Republic'], ['Military junta', 'the {Adj} Military Government'], ['Constitutional monarchy', 'the constitutional Kingdom of {Short}']],
    const: [['Military junta', 'the {Adj} Military Government'], ['Republic', 'the {Adj} Republic']],
    republic: [['Military junta', 'the {Adj} Military Government'], ['One-party state', "the People's Republic of {Short}"], ['Empire', 'the {Adj} Empire']],
    party: [['Republic', 'the {Adj} Republic'], ['Military junta', 'the {Adj} Military Government']],
    theo: [['Republic', 'the {Adj} Republic'], ['Military junta', 'the {Adj} Military Government']],
    colony: [['Republic', 'the Free {Adj} Republic'], ['Monarchy', 'the Kingdom of {Short}']],
    charter: [['Free states', 'the Free {Adj} Commons']],
  };
  const fill = (s, c) => s.replace('{Adj}', c.adj).replace('{Short}', c.short.replace(/^the /, ''));
  function revolution(cc) {
    const r = reg(cc), k = kindOf(cc), c = C(cc), p = S.me();
    const [gov, nm] = U.pick(REV[k] || REV.monarchy);
    r.base = baseName(cc); r.gov = gov; r.name = fill(nm, c); r.since = yr(); r.rev = (r.rev || 0) + 1;
    natOf(cc).stab = U.clamp(natOf(cc).stab + U.ri(8, 20));
    const t = `Revolution in ${c.short}! The old order falls, and ${r.name} is proclaimed.`;
    W().news.push({ y: yr(), t, type: 'revolution', where: [cc] });
    succeed(cc, 'coup');
    if (p && p.cc === cc) {
      S.log(p, t, 'world');
      if (p.title && U.chance(0.4)) { S.log(p, 'The revolutionaries stripped you of your title.', 'bad'); p.title = null; p.money *= 0.6; }
      if (p.office) { if (p.office.lvl >= 4) { S.log(p, 'The revolution swept you from office.', 'bad'); leave(p, true); if (U.chance(0.3)) S.hooks.arrest?.(p, { crime: 'corruption', yrs: 3, sev: 2, what: 'as a servant of the old regime' }); } else p.office.t = officeTitle(cc, p.office.lvl, p.sex); }
    }
  }
  function restoration(cc) {
    const r = reg(cc), c = C(cc), p = S.me(), old = r.name;
    r.gov = null; r.name = null; r.since = yr();
    const t = `${old ? old[0].toUpperCase() + old.slice(1) : c.short} gives way: ${baseName(cc)} is restored.`;
    W().news.push({ y: yr(), t, type: 'politics', where: [cc] });
    succeed(cc);
    if (p && p.cc === cc) S.log(p, t, 'world');
  }
  function regTick() {
    const p = S.me();
    for (const c of S.world.countriesAt()) {
      if (c.region === 'space' && yr() < 2100) { rulerTick(c.id); continue; }
      const r = reg(c.id), b = baseName(c.id);
      if (r.base !== b) { const changed = r.base != null; r.base = b; r.gov = null; r.name = null; r.since = yr(); if (changed) succeed(c.id); }
      if (r.occ && yr() >= r.occ.until) {
        const t = `${S.world.name(c.id).replace(/ \(under .*\)$/, '')} throws off ${C(r.occ.by)?.adj || 'foreign'} occupation.`;
        r.occ = null; W().news.push({ y: yr(), t, type: 'politics', where: [c.id] }); if (p && p.cc === c.id) { S.log(p, t, 'world'); S.applyFx(p, { hp: 8, mh: 4 }); }
      }
      const st = natOf(c.id).stab, k = kindOf(c.id);
      if (k !== 'tribal' && yr() > -2500) {
        if (!r.gov && st < 18 && U.chance(0.08)) revolution(c.id);
        else if (r.gov && yr() - r.since > 12 && U.chance(0.035 + (st < 30 ? 0.05 : 0))) restoration(c.id);
      }
      rulerTick(c.id);
    }
  }

  /* ---------- wars ---------- */
  const warsNow = () => (W().wars || []).filter(h => yr() >= h.y && yr() <= h.end);
  const atWar = (a, b) => S.activeWars().some(h => h.where && h.where.includes(a) && h.where.includes(b) && a !== b);
  function strength(cc) {
    const pop = S.world.popAt(cc) || 0.01, r = reg(cc);
    const pl = S.me(), lead = pl && pl.cc === cc && pl.office?.lvl >= 4 ? (pl.sm + (pl.wp ?? 50)) / 60 + (S.pers?.has(pl, 'brave') ? 0.5 : 0) : 0;
    return Math.log10(pop * 1e6 + 10) + (r.pol.army - 1) * 1.5 + natOf(cc).stab / 40 + lead;
  }
  function declare(a, b, byPlayer) {
    const w = W(); w.wars ||= [];
    const ca = C(a), cb = C(b), y = yr();
    const war = { y, end: y + U.ri(2, 7), type: 'war', key: `dyn${y}${a}${b}`, n: `${ca.adj}–${cb.adj} War`, t: `${S.world.name(a)} declares war on ${S.world.name(b)}.`, where: [a, b], draft: premodern() ? 0.05 : 0.1, mort: premodern() ? 0.05 : 0.035, civ: 0.002, dyn: 1, a, b, score: 0, byPlayer: !!byPlayer };
    w.wars.push(war);
    S.world.addRel?.(a, b, -40);
    w.news.push({ y, t: war.t, type: 'war', where: [a, b] });
    const p = S.me(); if (p && war.where.includes(p.cc)) S.log(p, war.t, 'world');
    natOf(a).stab = U.clamp(natOf(a).stab + 3); natOf(b).stab = U.clamp(natOf(b).stab - 2);
    return war;
  }
  function endWar(war, winner, how) {
    war.end = yr();
    const loser = winner === war.a ? war.b : war.a, p = S.me();
    let t;
    if (!winner) t = `The ${war.n} ends in an exhausted peace.`;
    else {
      natOf(winner).stab = U.clamp(natOf(winner).stab + 6); natOf(loser).stab = U.clamp(natOf(loser).stab - 15);
      const occ = Math.abs(war.score) > 9 && U.chance(0.45) && C(loser).region !== 'space';
      if (occ) reg(loser).occ = { by: winner, until: yr() + U.ri(5, 25) };
      t = `The ${war.n} ends: ${C(winner).short} ${how || 'is victorious'}${occ ? `, and occupies ${C(loser).short}` : ''}.`;
    }
    W().news.push({ y: yr(), t, type: 'war', where: war.where });
    if (p && war.where.includes(p.cc)) {
      S.log(p, t, 'world');
      const won = winner === p.cc;
      S.applyFx(p, winner ? (won ? { hp: 6, rep: 1 } : { hp: -6, mh: -4 }) : { hp: 2 });
      if (p.office?.lvl >= 4) { p.office.appr = U.clamp(p.office.appr + (winner ? (won ? 25 : -30) : 5)); S.applyFx(p, winner ? (won ? { fm: 10, rep: 6 } : { rep: -8 }) : {}); if (won) p.flags.warwon = (p.flags.warwon || 0) + 1; }
    }
  }
  function warTick() {
    for (const war of warsNow()) {
      if (!war.dyn || war.end < yr()) continue;
      war.score += (strength(war.a) - strength(war.b)) * 1.6 + U.rand(-4, 4);
      if (Math.abs(war.score) >= 14 || yr() >= war.end) endWar(war, Math.abs(war.score) < 3 ? null : war.score > 0 ? war.a : war.b);
    }
    // other nations quarrel too
    const live = warsNow().filter(h => h.dyn).length;
    if (live < 3 && yr() > -3000) {
      const cs = S.world.countriesAt().filter(c => c.region !== 'space' || yr() > 2100);
      for (let i = 0; i < 3; i++) {
        const a = U.pick(cs), b = U.pick(cs);
        if (!a || !b || a.id === b.id || atWar(a.id, b.id) || reg(a.id).occ || reg(b.id).occ) continue;
        const near = a.region === b.region;
        if (S.world.rel(a.id, b.id) < -50 && U.chance(near ? 0.06 : 0.02)) { if (!S.me() || (S.me().office?.lvl !== 5 || S.me().cc !== a.id)) declare(a.id, b.id); break; }
      }
    }
  }

  /* ---------- the player's political career ---------- */
  function requirements(p, lvl) {
    const cc = p.cc, k = kindOf(cc), m = method(k, lvl), why = [], a = S.age(p), cur = p.office?.lvl || 0;
    if (a < AGE[lvl - 1]) why.push(`age ${AGE[lvl - 1]}+`);
    if (p.rep < REP[lvl - 1]) why.push(`reputation ${REP[lvl - 1]}`);
    if ((m === 'elect') && (p.fm ?? 0) < FAME[lvl - 1]) why.push(`fame ${FAME[lvl - 1]}`);
    if (m === 'appoint' && (p.cls ?? 2) < CLS[lvl - 1] && k !== 'party') why.push('higher class');
    if (k === 'party' && !(p.orgs || []).some(o => o.id === 'party')) why.push('party membership');
    if (lvl > cur + 1 && lvl >= 3) why.push(`first serve as ${officeTitle(cc, lvl - 1, p.sex).toLowerCase()}`);
    if (p.prison) why.push('freedom');
    if (m === 'throne' && (p.cls ?? 2) < 6 && cur < 3) why.push('royal blood, or high office for a coup');
    if (lvl <= cur) why.push('you already hold a higher or equal office');
    return why;
  }
  function campaignCost(lvl) { return S.toVal(S.era().cost * CAMP[lvl - 1]); }
  function take(p, lvl, how) {
    const cc = p.cc, k = kindOf(cc);
    if (p.office) leave(p, true, true);
    p.office = { lvl, cc, t: officeTitle(cc, lvl, p.sex), since: yr(), yrs: 0, term: k === 'republic' || k === 'const' || k === 'charter' ? U.pick([4, 4, 5, 6]) : 0, appr: 55 + U.ri(-5, 10), kind: k };
    S.applyFx(p, { rep: 3 + lvl, fm: 2 + lvl * 2, hp: 8 });
    if (lvl === 5) {
      const r = reg(cc), old = r.ruler;
      if (old?.pid != null && old.pid !== p.id) { const q = S.P(old.pid); if (q) { q.title = null; delete q.flags.ruler; } }
      r.ruler = { pid: p.id, player: 1, n: p.first, first: p.first, dyn: p.last, sex: p.sex, t: p.office.t, born: p.born, since: yr(), kind: k };
      if (k === 'monarchy' || k === 'tribal' || k === 'theo') { p.title = p.office.t; p.cls = Math.max(p.cls ?? 2, 6); }
      W().news.push({ y: yr(), t: `${p.office.t} ${p.first} ${p.last} ${how === 'coup' ? 'seizes power' : 'takes power'} in ${S.world.name(cc)}.`, type: 'politics', where: [cc] });
    }
    p.flags.office = Math.max(p.flags.office || 0, lvl);
    S.log(p, `You became ${p.office.t}${how ? ` (${how})` : ''}.`, 'good');
    return `You are now ${p.office.t}!`;
  }
  function leave(p, forced, quiet) {
    const o = p.office; if (!o) return '';
    if (o.lvl === 5) { const r = reg(o.cc); if (r.ruler?.pid === p.id) r.ruler = null; if (p.title === o.t) p.title = null; }
    if (!quiet) S.log(p, forced ? `You were removed from office as ${o.t}.` : `You stepped down as ${o.t} after ${o.yrs} year${o.yrs === 1 ? '' : 's'}.`, forced ? 'bad' : 'life');
    p.office = null;
    return forced ? 'You were removed from office.' : 'You stepped down.';
  }
  // Seek an office: builds the right prompt for how it is won
  function seek(lvl) {
    const p = S.me(), cc = p.cc, k = kindOf(cc), m = method(k, lvl), why = requirements(p, lvl);
    if (why.length) return `You need: ${why.join(', ')}.`;
    if (p.did['seek']) return 'You have already tried for office this year.';
    p.did.seek = 1;
    const t = officeTitle(cc, lvl, p.sex), cost = campaignCost(lvl), inc = p.office && p.office.lvl === lvl;
    const opp = { n: `${S.pickName(U.chance(0.5) ? 'M' : 'F', S.era(), cc)} ${U.pick((S.pool(S.era(), cc) || DATA.names.modern).last)}`, str: U.ri(30 + lvl * 6, 70 + lvl * 6) };
    const base = 0.32 - (lvl - 1) * 0.05 + (p.rep - REP[lvl - 1]) / 150 + ((p.fm ?? 0) - FAME[lvl - 1]) / 250 + p.sm / 600 + (inc ? 0.1 : 0) - (opp.str - 55) / 250;
    const odds = x => U.clamp(base + x + S.hadd('odds', p, { tag: 'vote' }), 0.04, 0.93);
    const win = (x, how) => (U.chance(odds(x)) ? take(p, lvl, how) : (S.applyFx(p, { hp: -5, rep: -1 }), S.log(p, `You tried to become ${t.toLowerCase()} and failed.`, 'bad'), `You lost to ${opp.n}.`));
    if (m === 'elect') {
      S.prompt({ title: `Running for ${t}`, text: `You are standing for ${t.toLowerCase()} of ${S.world.name(cc)}. Your opponent is ${opp.n}. How will you campaign?`, choices: [
        { l: 'Knock on every door', go: () => { S.applyFx(p, { h: -2 }); return win(0.05, 'elected'); } },
        { l: `Hold rallies and give speeches (${S.money(cost)})`, dis: p.money < cost, go: () => { p.money -= cost; return win(0.12 + (S.pers?.has(p, 'charming') ? 0.08 : 0) + (S.pers?.has(p, 'shy') ? -0.08 : 0), 'elected'); } },
        { l: `Spend big on ${S.era().id === 'digital' || S.era().id === 'near' ? 'online ads' : ['modern', 'wars'].includes(S.era().id) ? 'broadcast ads' : 'posters and pamphlets'} (${S.money(cost * 3)})`, dis: p.money < cost * 3, go: () => { p.money -= cost * 3; return win(0.2, 'elected'); } },
        { l: 'Smear your opponent', go: () => { S.pers?.nudge(p, 'deceitful', 1); if (U.chance(0.25)) { S.applyFx(p, { rep: -10 }); S.log(p, 'Your smear campaign backfired into a scandal.', 'bad'); return win(-0.2); } return win(0.12, 'elected'); } },
        { l: 'Promise everyone everything', go: () => { const r = win(0.1, 'elected'); if (p.office) p.office.appr -= 8; return r; } }] });
      return `Your campaign for ${t.toLowerCase()} has begun.`;
    }
    if (m === 'acclaim') {
      S.prompt({ title: `Seeking the band's trust`, text: `The ${lvl === 5 ? 'chief is chosen' : 'elders gather'} around the great fire. Will they name you ${t.toLowerCase()}?`, choices: [
        { l: 'Prove yourself on a great hunt', go: () => { if (U.chance(0.15)) S.applyFx(p, { h: -12 }); return win(0.05 + p.h / 400, 'by acclaim'); } },
        { l: 'Give generous gifts of food and tools', go: () => { p.money -= S.toVal(S.era().cost * 0.2); return win(0.12, 'by acclaim'); } },
        { l: 'Speak wisely at the fire', go: () => win(p.sm / 300 + (S.pers?.has(p, 'charming') ? 0.08 : 0), 'by acclaim') }] });
      return 'You put yourself forward.';
    }
    if (m === 'appoint') {
      const gift = S.toVal(S.era().cost * CAMP[lvl - 1] * 1.5);
      S.prompt({ title: `Seeking appointment as ${t}`, text: `Offices here are given, not won. Who will you approach?`, choices: [
        { l: 'Rely on your record and reputation', go: () => win(0.02, 'appointed') },
        { l: `Send lavish gifts to a patron (${S.money(gift)})`, dis: p.money < gift, go: () => { p.money -= gift; return win(0.2, 'appointed'); } },
        { l: 'Flatter the powerful at every chance', go: () => { S.applyFx(p, { mh: -2 }); return win(0.1 + (S.pers?.has(p, 'charming') ? 0.1 : 0), 'appointed'); } }] });
      return 'You set out to win the favour of the powerful.';
    }
    // the throne: royal blood, or a coup
    const royal = (p.cls ?? 2) >= 6;
    S.prompt({ title: royal ? 'The throne' : 'Seize the throne?', text: royal ? `You have royal blood. ${rulerName(ruler(cc))} sits on the throne. Will you press your claim?` : `Only a coup can put you on the throne of ${S.world.name(cc)}. Soldiers, nobles and gold will decide it.`, choices: [
      { l: royal ? 'Press your claim before the court' : 'Plot with the generals', go: () => {
        const o = U.clamp(0.12 + (p.rep - 60) / 200 + (p.fm ?? 0) / 400 + (royal ? 0.15 : 0) + (natOf(cc).stab < 35 ? 0.15 : 0) + (S.pers?.has(p, 'brave') ? 0.05 : 0), 0.03, 0.6);
        if (U.chance(o)) return take(p, 5, royal ? 'by right of blood' : 'coup');
        S.log(p, 'Your bid for the throne failed.', 'bad');
        if (premodern() && U.chance(0.4)) { S.kill(p, 'execution for treason'); return 'You were executed for treason.'; }
        return S.hooks.arrest ? S.hooks.arrest(p, { crime: 'sedition', yrs: 6, sev: 3, what: 'plotting against the ruler' }) : 'You were arrested.';
      } },
      { l: 'Think better of it', go: () => 'You kept your head, and your head.' }] });
    return 'You weigh your chances.';
  }

  /* ---------- a year in office ---------- */
  const WORKS = { prehistory: 'a great stone circle', ancient: 'an aqueduct', medieval: 'a cathedral', renaissance: 'a palace and piazza', colonial: 'a canal', industrial: 'a railway', wars: 'a dam', modern: 'a highway', digital: 'a high-speed rail line', near: 'a sea wall', far: 'an orbital ring' };
  const DECISIONS = [
    { id: 'taxes', t: 'Farmers and merchants complain the taxes are crushing them.', ch: [['Cut taxes', { appr: 8, stab: -2 }, 'Cheers in the market.'], ['Hold firm', { appr: -3 }, 'Grumbling, but the coffers are full.'], ['Raise them further', { appr: -9, money: 0.5 }, 'You squeezed out more. They will remember.']] },
    { id: 'works', t: () => `${WORKS[S.era().id][0].toUpperCase() + WORKS[S.era().id].slice(1)} is falling into ruin.`, ch: [['Fund the repairs', { appr: 5, stab: 2 }, 'Workers swarmed over it for a season.'], ['Divert the funds to yourself', { money: 0.8, rep: -3, risk: 0.3 }, 'Nobody noticed. Probably.'], ['Leave it', { appr: -3 }, 'It crumbled a little more.']] },
    { id: 'protest', t: 'A crowd gathers in the square demanding change.', ch: [['Listen and compromise', { appr: 5, stab: 2, trait: 'kind' }, 'The crowd went home satisfied, mostly.'], ['Send the guards to disperse them', { appr: -5, stab: 1, trait: 'cruel' }, 'The square was cleared by nightfall.'], ['Crack down without mercy', { appr: -12, stab: 5, rep: -6, trait: 'cruel' }, 'Order returned, at a terrible price.']] },
    { id: 'scandal', t: 'An official under you is caught taking bribes.', ch: [['Expose him publicly', { appr: 4, rep: 3, trait: 'honest' }, 'The people applauded your honesty.'], ['Hush it up', { risk: 0.35 }, 'It went away. For now.'], ['Take a share yourself', { money: 0.6, trait: 'deceitful', risk: 0.4 }, 'A quiet arrangement.']] },
    { id: 'envoy', t: () => `An envoy arrives from ${S.world.name(U.pick(S.world.countriesAt().filter(c => c.id !== S.me().cc && c.region !== 'space')).id)} seeking friendship.`, ch: [['Welcome them warmly', { appr: 2, rel: 12 }, 'Gifts were exchanged. Ties grew warmer.'], ['Snub them', { fame: 2, rel: -12 }, 'They left in a huff.']] },
    { id: 'monument', t: 'Your advisers propose a great monument to your rule.', ch: [['Build it', { fame: 6, appr: -3, stab: -1 }, 'It will stand for centuries, with your name carved on it.'], ['Spend the money on the people', { appr: 6 }, 'The people ate better, and loved you for it.']] },
    { id: 'plot', t: 'Spies report a faction plotting against you.', ch: [['Arrest the plotters', { stab: 3, appr: -4, trait: 'cruel' }, 'Doors were broken down at dawn.'], ['Win them over with favours', { money: -0.5, appr: 3 }, 'Enemies became allies, for a price.'], ['Ignore the rumours', { plot: 1 }, 'You slept soundly. Perhaps too soundly.']] },
    { id: 'reform', t: () => `Reformers ask you to champion ${{ prehistory: 'sharing the herds fairly', ancient: 'freeing debt-slaves', medieval: 'a charter of rights for townsfolk', renaissance: 'schools for the poor', colonial: 'freedom of the press', industrial: "limits on children's working hours", wars: 'votes for women', modern: 'civil rights for all', digital: 'data privacy', near: 'a universal basic income', far: 'rights for synthetic minds' }[S.era().id]}.`, ch: [['Champion the reform', { appr: 4, fame: 4, rep: 4, stab: -1 }, 'History will remember you kindly.'], ['Oppose it', { appr: -2, stab: 1 }, 'The old ways hold, for now.']] },
  ];
  function decision(p) {
    const d = U.pick(DECISIONS), o = p.office;
    const text = typeof d.t === 'function' ? d.t() : d.t;
    const target = d.id === 'envoy' ? U.pick(S.world.countriesAt().filter(c => c.id !== p.cc && c.region !== 'space'))?.id : null;
    S.prompt({ title: `${o.t} · ${U.fmtYearAD(yr())}`, text, choices: d.ch.map(([l, fx, t]) => ({ l, src: { l }, go: () => {
      o.appr = U.clamp(o.appr + (fx.appr || 0));
      if (fx.stab) natOf(p.cc).stab = U.clamp(natOf(p.cc).stab + fx.stab * (o.lvl >= 4 ? 1 : 0.3));
      if (fx.money) p.money += S.toVal(S.era().cost * fx.money * o.lvl);
      if (fx.rep) p.rep = U.clamp(p.rep + fx.rep);
      if (fx.fame) p.fm = U.clamp((p.fm ?? 0) + fx.fame);
      if (fx.rel && target) S.world.addRel?.(p.cc, target, fx.rel);
      if (fx.trait) S.pers?.nudge(p, fx.trait, 1);
      if (fx.plot) o.plot = (o.plot || 0) + 1;
      let msg = t;
      if (fx.risk && U.chance(fx.risk)) { o.appr = U.clamp(o.appr - 15); p.rep = U.clamp(p.rep - 10); msg += ' But it leaked, and there was a scandal.'; S.log(p, 'A scandal broke over your conduct in office.', 'bad'); }
      S.log(p, `${text} You chose to ${l.toLowerCase()}. ${msg}`, 'life');
      return msg;
    } })) });
  }
  function officeTick(p) {
    const o = p.office; if (!o) return;
    if (o.cc !== p.cc) { leave(p, true); return; }
    const k = kindOf(p.cc);
    if (k !== o.kind) { o.kind = k; o.t = officeTitle(p.cc, o.lvl, p.sex); }
    o.yrs++;
    p.money += S.toVal(S.era().cost * SAL[o.lvl - 1]);
    const stab = natOf(p.cc).stab, wars = S.world.wars(p.cc).length;
    o.appr = U.clamp(o.appr + (stab - 55) / 12 - wars * 2 + U.rand(-5, 5) + (S.pers?.has(p, 'charming') ? 1 : 0));
    p.fm = U.clamp((p.fm ?? 0) + o.lvl * 0.7 * (1 - (p.fm ?? 0) / 130)); p.rep = U.clamp(p.rep + (o.appr - 50) / 30);
    if (o.lvl >= 4) natOf(p.cc).stab = U.clamp(stab + (o.appr - 50) / 40);
    if (o.plot && U.chance(0.25 * o.plot)) { o.plot = 0; if (U.chance(0.5)) { S.log(p, 'The plotters struck. You were overthrown.', 'bad'); leave(p, true); if (premodern() && U.chance(0.3)) S.kill(p, 'assassination'); return; } S.log(p, 'A plot against you was uncovered just in time.', 'good'); }
    if (o.appr < 15 && U.chance(0.35)) { S.log(p, ['monarchy', 'tribal'].includes(k) ? 'The people rose against you. You were deposed.' : 'A vote of no confidence removed you from office.', 'bad'); leave(p, true); return; }
    if (U.chance(0.5)) decision(p);
    if (o.term && o.yrs >= o.term) {
      o.yrs = 0;
      S.prompt({ title: 'Your term is up', text: `Your ${o.term}-year term as ${o.t.toLowerCase()} has ended. Approval: ${Math.round(o.appr)}.`, choices: [
        { l: 'Stand for re-election', go: () => { if (U.chance(U.clamp(0.2 + o.appr / 110 + (p.fm ?? 0) / 500, 0.05, 0.92))) { S.applyFx(p, { hp: 6, fm: 3 }); S.log(p, `You were re-elected as ${o.t}.`, 'good'); return 'Re-elected!'; } leave(p, true); return 'The voters turned you out.'; } },
        { l: 'Step down gracefully', go: () => { S.applyFx(p, { rep: 3, mh: 3 }); return leave(p); } }] });
    }
  }

  /* ---------- ruling ---------- */
  function rule(act, cc2) {
    const p = S.me(), o = p.office;
    if (!o || o.lvl < 4) return 'Only a minister or the head of state can do that.';
    const r = reg(p.cc), n = natOf(p.cc), head = o.lvl === 5;
    const once = k => { if (p.did['rule:' + k]) return false; p.did['rule:' + k] = 1; return true; };
    switch (act) {
      case 'taxdown': if (!head) return 'Only the head of state sets taxes.'; if (!once('tax')) return 'You already changed taxes this year.'; r.pol.tax = Math.max(0.5, r.pol.tax - 0.25); o.appr = U.clamp(o.appr + 8); n.stab = U.clamp(n.stab - 2); return 'Taxes cut. The people cheer; the treasury groans.';
      case 'taxup': if (!head) return 'Only the head of state sets taxes.'; if (!once('tax')) return 'You already changed taxes this year.'; r.pol.tax = Math.min(1.75, r.pol.tax + 0.25); o.appr = U.clamp(o.appr - 9); n.stab = U.clamp(n.stab + 1); p.money += S.toVal(S.era().cost * 2); return 'Taxes raised. The treasury fills, and so do the complaints.';
      case 'works': { if (!once('works')) return 'One great project a year is plenty.'; const w = WORKS[S.era().id]; r.works.push({ t: w, y: yr(), by: p.id }); n.stab = U.clamp(n.stab + 4); o.appr = U.clamp(o.appr + 5); S.applyFx(p, { fm: 3, rep: 2 }); S.log(p, `You ordered the building of ${w}.`, 'good'); return `Work began on ${w}.`; }
      case 'armyup': if (!once('army')) return 'You already reshaped the army this year.'; r.pol.army = Math.min(2, r.pol.army + 0.25); o.appr = U.clamp(o.appr - 3); return 'Recruiting sergeants spread through the land.';
      case 'armydown': if (!once('army')) return 'You already reshaped the army this year.'; r.pol.army = Math.max(0.5, r.pol.army - 0.25); o.appr = U.clamp(o.appr + 3); return 'Soldiers went home to their families.';
      case 'free': if (!once('free')) return 'You already acted on that this year.'; r.pol.free = Math.min(2, r.pol.free + 0.25); o.appr = U.clamp(o.appr + 5); n.stab = U.clamp(n.stab - 3); S.pers?.nudge(p, 'kind', 1); return 'You granted new freedoms. People breathe easier, and argue louder.';
      case 'crack': if (!once('free')) return 'You already acted on that this year.'; r.pol.free = Math.max(0.25, r.pol.free - 0.25); o.appr = U.clamp(o.appr - 6); n.stab = U.clamp(n.stab + 5); S.applyFx(p, { rep: -3 }); S.pers?.nudge(p, 'cruel', 1); return 'Informers and curfews. Quiet streets, frightened faces.';
      case 'war': {
        if (!head) return 'Only the head of state can declare war.';
        if (!cc2 || cc2 === p.cc) return '';
        if (atWar(p.cc, cc2)) return 'You are already at war with them.';
        if (!once('war')) return 'One war a year is enough for anyone.';
        declare(p.cc, cc2, true); o.appr = U.clamp(o.appr + (S.world.rel(p.cc, cc2) < -30 ? 8 : -8));
        S.applyFx(p, { fm: 5 }); S.log(p, `You declared war on ${S.world.name(cc2)}.`, 'world');
        return `War is declared on ${S.world.name(cc2)}.`;
      }
      case 'peace': {
        const war = warsNow().find(h => h.dyn && h.where.includes(p.cc) && h.where.includes(cc2));
        if (!war) return 'There is no war to end with them.';
        if (!once('peace:' + cc2)) return 'They already refused this year.';
        const mine = war.a === p.cc ? war.score : -war.score;
        if (U.chance(U.clamp(0.4 + mine / 20, 0.1, 0.9))) { endWar(war, mine > 4 ? p.cc : null, 'wins the peace'); S.world.addRel?.(p.cc, cc2, 10); return 'Peace was signed.'; }
        return 'They refused to make peace.';
      }
      case 'ally': {
        if (!once('ally:' + cc2)) return 'You already approached them this year.';
        if (S.world.rel(p.cc, cc2) < 20) return 'They do not trust you enough for an alliance yet.';
        S.world.addRel?.(p.cc, cc2, 20); S.applyFx(p, { fm: 2, rep: 2 }); (r.allies ||= []).includes(cc2) || r.allies.push(cc2);
        return `An alliance with ${S.world.name(cc2)} was sealed.`;
      }
      case 'trade': { if (!once('trade:' + cc2)) return 'You already signed a pact with them this year.'; S.world.addRel?.(p.cc, cc2, 8); n.stab = U.clamp(n.stab + 2); p.money += S.toVal(S.era().cost * 0.5); o.appr = U.clamp(o.appr + 3); return `A trade pact with ${S.world.name(cc2)} brought goods and goodwill.`; }
    }
    return '';
  }

  /* ---------- hooks ---------- */
  S.addHook('preYear', () => { regTick(); warTick(); });
  S.addHook('postYear', p => officeTick(p));
  S.addHook('draftMul', p => ((p.office?.lvl ?? 0) >= 3 ? 0 : 1), 'mul');
  S.addHook('taxMul', p => reg(p.cc).pol.tax, 'mul');
  // a monarch's heir inherits the throne
  S.addHook('onInherit', (dead, h) => {
    const o = dead.office; if (!o) return;
    if (o.lvl === 5 && ['monarchy', 'tribal'].includes(kindOf(o.cc)) && h.cc === o.cc && (dead.kids.includes(h.id) || S.siblings(dead).includes(h) || dead.sp === h.id)) {
      h.office = { ...o, since: yr(), yrs: 0, t: officeTitle(o.cc, 5, h.sex), appr: Math.max(40, o.appr - 5) };
      h.title = h.office.t; h.cls = 6;
      reg(o.cc).ruler = { pid: h.id, player: 1, n: h.first, first: h.first, dyn: h.last, sex: h.sex, t: h.office.t, born: h.born, since: yr(), kind: kindOf(o.cc) };
      S.log(h, `You inherited the throne. You are now ${h.office.t} of ${S.world.name(o.cc)}.`, 'good');
    }
  });
  S.addHook('migrate', w => { w.wars ||= []; w.reg ||= {}; });
  LATE.push(() => {
    const io = S.world.inOffice;
    S.world.inOffice = p => io(p) || (p.office?.lvl ?? 0) >= 3;
  });
  DATA.achievements.push(
    { id: 'office', n: 'Public Servant', d: 'Hold public office.', test: p => (p.flags.office || 0) >= 1 },
    { id: 'ruler', n: 'Head of State', d: 'Rule your land.', test: p => (p.flags.office || 0) >= 5 },
    { id: 'conqueror', n: 'Conqueror', d: 'Win a war as a leader.', test: p => (p.flags.warwon || 0) >= 1 },
  );

  return { kindOf, officeTitle, headTitle, method, requirements, seek, leave, take, rule, reg, ruler, rulerName, declare, endWar, warsNow, atWar, strength, natOf, LADDERS, AGE, REP, FAME, CAMP, SAL, campaignCost };
})();
Sim.pol = Pol;

/* ---------------- World → Politics ---------------- */
LATE.push(() => {
  const S = Sim, ui = UI, Po = Pol, { esc, bar, toast, render, sheet } = ui;
  const KIND = { tribal: 'Rule by elders and chiefs', monarchy: 'A monarchy', const: 'A constitutional monarchy with elections', republic: 'A republic with elections', party: 'A one-party state', theo: 'A theocracy', colony: 'A colony ruled from abroad', charter: 'A chartered colony' };
  const HOW = { acclaim: 'By acclaim of the band', elect: 'By election', appoint: 'By appointment', throne: 'By blood, or by coup' };
  function view(p) {
    const cc = p.cc, k = Po.kindOf(cc), r = Po.reg(cc), ru = Po.ruler(cc), st = Math.round(Po.natOf(cc).stab), o = p.office;
    const rq = ru?.pid != null ? S.P(ru.pid) : null;
    const wars = S.world.wars(cc);
    const ladder = [1, 2, 3, 4, 5].map(l => {
      const t = Po.officeTitle(cc, l, p.sex), why = Po.requirements(p, l), m = Po.method(k, l), mine = o?.lvl === l;
      return `<div class="row"><div class="main"><div class="t">${l}. ${esc(t)}${mine ? ' <span class="tag era">you</span>' : ''}</div><div class="s">${HOW[m]} · age ${Po.AGE[l - 1]}+ · reputation ${Po.REP[l - 1]}${m === 'elect' && Po.FAME[l - 1] ? ` · fame ${Po.FAME[l - 1]}` : ''} · salary ${S.money(S.toVal(S.era().cost * Po.SAL[l - 1]))}${why.length && !mine ? ` · <span class="why">needs ${esc(why.join(', '))}</span>` : ''}</div></div>
        ${mine ? '' : `<button class="btn sm ${why.length ? '' : 'era'}" data-act="polSeek" data-l="${l}" ${why.length ? 'disabled' : ''}>${m === 'elect' ? 'Run' : m === 'appoint' ? 'Seek post' : m === 'acclaim' ? 'Put yourself forward' : (p.cls ?? 2) >= 6 ? 'Claim the throne' : 'Plot a coup'}</button>`}</div>`;
    }).join('');
    const others = S.world.countriesAt().filter(c => c.id !== cc && (c.region !== 'space' || S.W.year > 2100));
    const ruling = o && o.lvl >= 4;
    return `<div class="panel"><div class="eyebrow">${esc(S.world.name(cc))} · ${esc(S.world.gov(cc))}</div><h3>${esc(KIND[k])}</h3>
        <div class="facts"><div class="fact"><div class="eyebrow">Ruler</div><div class="v sm">${ru ? (rq ? `<button class="linkbtn" data-act="person" data-id="${rq.id}">${esc(Po.rulerName(ru))}</button>` : esc(Po.rulerName(ru))) : '—'}</div></div>
          <div class="fact"><div class="eyebrow">In power since</div><div class="v sm">${ru ? U.fmtYearAD(ru.since) : '—'}</div></div>
          <div class="fact"><div class="eyebrow">Stability</div><div class="v sm">${st}${st < 25 ? ' · unrest' : ''}</div></div>
          <div class="fact"><div class="eyebrow">Taxes</div><div class="v sm">${r.pol.tax > 1 ? 'High' : r.pol.tax < 1 ? 'Low' : 'Normal'}</div></div></div>
        ${r.occ ? `<p class="lede" style="margin-top:10px"><span class="tag bad">Occupied</span> by ${esc(S.world.C(r.occ.by).short)} until about ${U.fmtYearAD(r.occ.until)}.</p>` : ''}
        ${wars.length ? `<p class="lede" style="margin-top:10px"><span class="tag bad">At war</span> ${wars.map(h => esc(h.n)).join(', ')}</p>` : ''}
        ${r.works.length ? `<p class="faint" style="font-size:13px;margin:10px 0 0">Great works: ${r.works.slice(-5).map(w => `${esc(w.t)} (${U.fmtYearAD(w.y)})`).join(' · ')}</p>` : ''}</div>
      ${o ? `<div class="panel"><div class="eyebrow">Your office</div><h3>${esc(o.t)}</h3>
        <div class="stat"><span class="k">Approval</span>${bar(o.appr)}<span class="v">${Math.round(o.appr)}</span></div>
        <p class="lede" style="margin-top:8px">${o.yrs} year${o.yrs === 1 ? '' : 's'} in office${o.term ? ` · term of ${o.term} years` : ''}. Each year brings decisions; low approval can cost you the post.</p>
        <div class="btnrow"><button class="btn sm danger" data-act="polLeave">Step down</button></div></div>` : ''}
      ${ruling ? `<div class="panel god"><div class="eyebrow">${o.lvl === 5 ? 'Rule' : 'Govern'}</div>
        <div class="btnrow" style="margin-top:8px">${[['taxdown', 'Cut taxes'], ['taxup', 'Raise taxes'], ['works', 'Commission great works'], ['armyup', 'Expand the army'], ['armydown', 'Shrink the army'], ['free', 'Grant freedoms'], ['crack', 'Crack down']].map(([a, l]) => `<button class="btn sm" data-act="polRule" data-a="${a}" data-label="${esc(l)}">${esc(l)}</button>${ui.pinBtn ? ui.pinBtn('polRule', { a }, l) : ''}`).join('')}</div>
        <div class="eyebrow" style="margin-top:14px">Foreign affairs</div>
        <div class="list" style="margin-top:6px">${others.map(c => { const rel = Math.round(S.world.rel(cc, c.id)), war = Po.atWar(cc, c.id); return `<div class="row"><div class="main"><div class="t">${esc(S.world.name(c.id))}</div><div class="s">${war ? '<span class="why">at war</span>' : `relations ${rel}`}</div></div>
          <div class="btnrow">${war ? `<button class="btn sm" data-act="polRule" data-a="peace" data-cc="${c.id}">Sue for peace</button>` : `<button class="btn sm" data-act="polRule" data-a="ally" data-cc="${c.id}">Ally</button><button class="btn sm" data-act="polRule" data-a="trade" data-cc="${c.id}">Trade pact</button>${o.lvl === 5 ? `<button class="btn sm danger" data-act="polWar" data-cc="${c.id}">Declare war</button>` : ''}`}</div></div>`; }).join('')}</div></div>` : ''}
      <div class="sec-h"><h3>The path to power</h3><span class="faint">${esc(KIND[k])}</span></div><div class="list">${ladder}</div>
      <p class="faint" style="font-size:12.5px;margin:10px 2px 0">Offices change with the government: revolutions, restorations and conquests reshape the ladder. A monarch's child inherits the throne when you carry on as them.</p>`;
  }
  (ui.worldExtra ||= []).push({ id: 'politics', n: 'Politics', view, show: p => S.age(p) >= 12 });
  ui.on.polSeek = el => { const t = Po.seek(+el.dataset.l); S.settle(); render(); toast(t); };
  ui.on.polLeave = () => { const t = Po.leave(S.me()); render(); toast(t); };
  ui.on.polRule = el => { const t = Po.rule(el.dataset.a, el.dataset.cc); S.settle(); render(); toast(t); };
  ui.on.polWar = el => {
    const cc = el.dataset.cc;
    sheet(`<h2>Declare war on ${esc(S.world.name(cc))}?</h2><div class="body">Men of fighting age in both lands will be called up, and people will die, perhaps some you know. Victory brings glory and sometimes conquest; defeat can cost you your rule.</div>
      <p class="lede">Your strength ${Po.strength(S.me().cc).toFixed(1)} against theirs ${Po.strength(cc).toFixed(1)}.</p>
      <div class="acts"><button class="btn danger" data-act="polRule" data-a="war" data-cc="${cc}">Declare war</button><button class="btn" data-act="close">Not now</button></div>`, { label: 'Declare war' });
  };
  if (typeof Auto !== 'undefined') Auto.replay.polRule = ds => (['works', 'taxdown', 'free'].includes(ds.a) ? Po.rule(ds.a, ds.cc) : '');
  // Nations sheets name the ruler
  const nat = S.world.nations;
  S.world.nations = () => nat().map(n => ({ ...n, ruler: Po.rulerName(Po.ruler(n.cc)), gov: S.world.gov(n.cc) }));
});
