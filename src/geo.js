/* =====================================================================
   GEO — the world as a map and a board.
   * Shapes: the map data (src/data-map.js) decoded into rings of
     longitude/latitude, cached.
   * Fog of war: a person knows their own land, its neighbours and, as
     the ages pass, farther lands; travel, ancestry, friends abroad and
     the news widen what is known.
   * Great powers: a score for every land from people, wealth, arms and
     stability, with a ranking that moves through history.
   * Alliances: lands that like each other and share neighbours or
     enemies pair up; when a war breaks out their allies are drawn in,
     and a quarrel between two can become a world war.
   * Diplomacy for those in office: alliance, trade pact, sanctions, aid,
     and peace envoys.
   ===================================================================== */

const Geo = (() => {
  const S = Sim, A = Atlas, M = DATA.map, yr = () => S.W.year;
  const state = () => (S.W.geo ||= { allies: [], pacts: [], hist: [], sanc: [] });

  /* ---------- shapes ---------- */
  const cache = {};
  function decode(str) {
    const out = []; let i = 0, x = 0, y = 0;
    const next = () => { let r = 0, s = 0, b; do { b = str.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20); return r & 1 ? ~(r >> 1) : r >> 1; };
    while (i < str.length) { x += next(); y += next(); out.push(x / 100, y / 100); }
    return Float32Array.from(out);
  }
  function shape(id) {
    if (cache[id]) return cache[id];
    const s = M.shapes[id]; if (!s) return null;
    return (cache[id] = { id, rings: s.r.map(decode), c: s.c, bb: s.bb, a: s.a, pt: !!s.pt });
  }
  const ids = () => Object.keys(M.shapes);

  /* ---------- who is next to whom ---------- */
  const rad = d => d * Math.PI / 180;
  const dist = (a, b) => {   // great-circle distance between centroids, km
    const A_ = M.shapes[a]?.c, B_ = M.shapes[b]?.c; if (!A_ || !B_) return 99999;
    const dl = rad(B_[0] - A_[0]), p1 = rad(A_[1]), p2 = rad(B_[1]);
    return 6371 * Math.acos(Math.min(1, Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl)));
  };
  const nearCache = {};
  function near(cc) {
    if (nearCache[cc]) return nearCache[cc];
    const set = new Set(M.nb[cc] || []);
    const mine = M.shapes[cc]; if (!mine) return (nearCache[cc] = []);
    const reach = Math.max(900, Math.min(2200, Math.sqrt(mine.a) * 140));
    for (const id of ids()) if (id !== cc && dist(cc, id) < reach) set.add(id);
    return (nearCache[cc] = [...set]);
  }
  // pick a land from a list, favouring those close to cc (refugees go to neighbours more than to the other side of the world)
  function pickNear(cc, ids) {
    if (!ids.length) return null;
    return U.wpick(ids, id => Math.exp(-dist(cc, id) / 1800) + 0.015);
  }
  // depth of knowledge by era
  const REACH = { prehistory: 1, ancient: 2, medieval: 3, renaissance: 4, colonial: 5, industrial: 6, wars: 99, modern: 99, digital: 99, near: 99, far: 99 };
  function known(p) {
    const y = yr(), era = S.era().id, depth = REACH[era] ?? 99;
    const all = ids();
    if (depth >= 99 || S.W.mode === 'sandbox' || S.W.sandbox) return new Set(all);
    const seen = new Set(), q = [];
    const add = (cc, d) => { if (cc && M.shapes[cc] && !seen.has(cc)) { seen.add(cc); q.push([cc, d]); } };
    add(p.cc, 0);
    for (const cc of p.nats || []) add(cc, 0);
    for (const cc of p.travels || []) add(cc, 0);
    for (const o of S.known(p)) if (o.cc && o.cc !== p.cc) add(o.cc, 1);
    for (const n of S.W.news.slice(-80)) for (const cc of n.where || []) if (U.span(n.y, y) < 40) add(cc, depth - 1);
    while (q.length) { const [cc, d] = q.shift(); if (d >= depth) continue; for (const n of near(cc)) add(n, d + 1); }
    return seen;
  }

  /* ---------- the great powers ---------- */
  const TIER_W = [0, 1.25, 1, 0.8, 0.6, 0.45];
  function power(cc, y = yr()) {
    const c = A.C(cc); if (!c || y < c.from) return 0;
    const pop = S.world.popAt(cc) || 0.01, t = TIER_W[A.tier(cc)] ?? 0.7, mil = (c.at?.mil ?? 3) / 9;
    const stab = (S.W.nat?.[cc]?.stab ?? 60) / 60;
    const era = y < 0 ? 0.5 : y < 1500 ? 0.8 : 1;
    return Math.pow(pop, 0.62) * t * (0.5 + mil * 1.2) * stab * era * 10;
  }
  function ranking(y = yr(), n = 12) {
    return S.world.countriesAt(y).filter(c => c.region !== 'space' || y > 2100).map(c => ({ cc: c.id, power: power(c.id, y) })).sort((a, b) => b.power - a.power).slice(0, n);
  }

  /* ---------- alliances ---------- */
  const key = (a, b) => [a, b].sort().join('|');
  const allied = (a, b) => state().allies.some(x => x.k === key(a, b));
  const alliesOf = cc => state().allies.filter(x => x.k.split('|').includes(cc)).map(x => x.k.split('|').find(z => z !== cc));
  function ally(a, b, quiet) {
    if (a === b || allied(a, b)) return;
    state().allies.push({ k: key(a, b), y: yr() });
    S.world.addRel(a, b, 18);
    if (!quiet) news(`${S.world.name(a)} and ${S.world.name(b)} sign a treaty of alliance.`, [a, b], 'politics');
  }
  function unally(a, b, why) {
    const g = state(); const i = g.allies.findIndex(x => x.k === key(a, b)); if (i < 0) return;
    g.allies.splice(i, 1);
    news(`The alliance between ${S.world.name(a)} and ${S.world.name(b)} ${why || 'collapses'}.`, [a, b], 'politics');
  }
  function news(t, where, type) {
    S.W.news.push({ y: yr(), t, type, where });
    const p = S.me(); if (p && where.includes(p.cc)) S.log(p, t, 'world');
  }
  // who fought on which side of the great wars (the history gives only the list of lands involved)
  const SIDES = {
    war1914: { a: 'ENG FRA ITA RUS USA JPN GRC PRT BEL SRB MNE ROU CAN AUS NZL IND ZAF EGY LUX MLI NER BFA SEN LBR GHA NGA KEN UGA ZMB MWI MOZ MDG HTI UKR BLR MDA EST LVA LTU ARM',
      b: 'DEU AUT HUN CZE SVK SVN HRV BIH TUR SYR LBN JOR ISR PSE IRQ KWT BGR TZA RWA BDI NAM CMR TGO' },
    war1939: { a: 'ENG FRA USA RUS CHN POL GRC NLD BEL LUX NOR DNK CZE SVK SRB MNE ALB MKD BIH AUS NZL CAN IND ZAF EGY MEX ETH IRN KOS UKR BLR EST LVA LTU MLT MOR DZA TUN LBY SEN CIV GHA NGA KEN TZA',
      b: 'DEU ITA JPN HUN ROU BGR FIN AUT HRV KOR PRK TWN VNM MMR MYS SGP IDN PHL BRN TLS THA MNG' },
  };
  const sideSets = {};
  const sideOf = (h, cc) => {
    if (h.a && h.b) { if (cc === h.a || h.joined?.[cc] === h.a) return 'a'; if (cc === h.b || h.joined?.[cc] === h.b) return 'b'; return null; }
    const sd = SIDES[h.key]; if (!sd) return '?';
    const set = (sideSets[h.key] ||= { a: new Set(sd.a.split(' ')), b: new Set(sd.b.split(' ')) });
    return set.a.has(cc) ? 'a' : set.b.has(cc) ? 'b' : null;
  };
  const atWar = (a, b) => a !== b && S.activeWars().some(h => {
    if (!h.where || !h.where.includes(a) || !h.where.includes(b)) return false;
    const sa = sideOf(h, a), sb = sideOf(h, b);
    return sa === '?' ? true : !!(sa && sb && sa !== sb);
  });
  // lands at war with anyone this year (for the map)
  const fighting = () => { const out = new Set(); for (const h of S.activeWars()) for (const cc of h.where || []) { const sd = sideOf(h, cc); if (sd) out.add(cc); } return out; };
  function tick() {
    const w = state(), y = yr();
    if (y < -3000) return;
    const lands = S.world.countriesAt().filter(c => c.region !== 'space' || y > 2100).map(c => c.id);
    // alliances form between friendly neighbours
    for (let i = 0; i < 5; i++) {
      const a = U.pick(lands), b = U.pick(near(a));
      if (!b || !lands.includes(b) || allied(a, b) || atWar(a, b)) continue;
      const r = S.world.rel(a, b), shared = near(a).filter(z => near(b).includes(z) && S.world.rel(a, z) < -20).length;
      const sameBloc = A.blocs(a, y).some(z => A.blocs(b, y).includes(z));
      if ((r > 45 || (r > 25 && (shared || sameBloc))) && U.chance(0.12 + (sameBloc ? 0.1 : 0))) { ally(a, b); break; }
    }
    // and they fray
    for (const x of w.allies.slice()) {
      const [a, b] = x.k.split('|');
      if (!lands.includes(a) || !lands.includes(b)) { w.allies.splice(w.allies.indexOf(x), 1); continue; }
      const r = S.world.rel(a, b);
      if (atWar(a, b)) unally(a, b, 'ends in war between them');
      else if (r < 5 && U.chance(0.25)) unally(a, b, 'falls apart');
      else { S.world.addRel(a, b, 1.2); }
    }
    // blocs warm their members' relations a little
    for (let i = 0; i < 4; i++) {
      const a = U.pick(lands), bl = A.blocs(a, y); if (!bl.length) continue;
      const b = U.pick(lands); if (a !== b && bl.some(z => A.blocs(b, y).includes(z))) S.world.addRel(a, b, 2);
    }
    // an invasion draws in the invaded land's friends, and sometimes the aggressor's
    for (const war of S.activeWars().filter(h => h.dyn && !h.geo && h.a && h.b)) {
      war.geo = 1;
      for (const [side, other] of [[war.b, war.a], [war.a, war.b]]) for (const f of alliesOf(side)) {
        if (war.where.includes(f) || !lands.includes(f) || allied(f, other)) continue;
        if (U.chance(side === war.b ? 0.7 : 0.45) && S.world.rel(f, other) < 40) {
          war.where.push(f); (war.joined ||= {})[f] = side;
          news(`${S.world.name(f)} enters the ${war.n} on the side of ${S.world.name(side)}.`, [f, side, other], 'war');
        }
      }
      if ((war.joined && Object.keys(war.joined).length >= 3) && !war.world) { war.world = 1; war.n = `${war.n}, a world war`; news(`A quarrel has become a world war: ${war.where.slice(0, 6).map(S.world.name).join(', ')} are at arms.`, war.where, 'war'); }
    }
    if (y % 10 === 0) { w.hist.push({ y, top: ranking(y, 8) }); if (w.hist.length > 40) w.hist.shift(); }
  }
  S.addHook('preYear', () => { try { tick(); } catch (e) { console.error(e); } });
  S.addHook('migrate', w => { w.geo ||= { allies: [], pacts: [], hist: [], sanc: [] }; });

  /* ---------- the player's diplomacy ---------- */
  const isLeader = p => (p.office?.lvl ?? 0) >= 3 || (S.world.inOffice ? S.world.inOffice(p) : false);
  function diplomacy(cc, kind) {
    const p = S.me(), mine = p.cc;
    if (!isLeader(p)) return 'Only people in high office can conduct foreign policy.';
    if (cc === mine) return 'That is your own land.';
    if (p.did['geo:' + cc + kind]) return 'You already tried that this year.';
    p.did['geo:' + cc + kind] = 1;
    const r = S.world.rel(mine, cc), lvl = p.office?.lvl ?? 3, c = S.era().cost;
    const name = S.world.name(cc);
    switch (kind) {
      case 'alliance': {
        if (allied(mine, cc)) return 'You are already allies.';
        if (atWar(mine, cc)) return 'You are at war with them.';
        if (U.chance(U.clamp((r + 20) / 100 + lvl * 0.05, 0.05, 0.85))) { ally(mine, cc); S.applyFx(p, { fm: 4, rep: 2 }); return `${name} agreed to an alliance.`; }
        S.world.addRel(mine, cc, -3); return `${name} declined, politely.`;
      }
      case 'break': if (!allied(mine, cc)) return 'You have no alliance with them.'; unally(mine, cc, 'is dissolved by your government'); S.world.addRel(mine, cc, -20); S.applyFx(p, { fm: 2, rep: -2 }); return 'The alliance is over.';
      case 'trade': {
        const g = state(); if (g.pacts.some(x => x.k === key(mine, cc))) return 'You already trade freely.';
        if (r < -15) return `${name} will not talk trade with you.`;
        g.pacts.push({ k: key(mine, cc), y: yr() }); S.world.addRel(mine, cc, 10);
        for (const z of [mine, cc]) { const n = S.world.nations().find(x => x.cc === z); const st = S.W.nat[z]; if (st) st.stab = U.clamp(st.stab + 3); }
        S.applyFx(p, { fm: 2, rep: 2 }); news(`${S.world.name(mine)} and ${name} sign a trade agreement.`, [mine, cc], 'politics'); return 'A trade agreement was signed.';
      }
      case 'sanction': { S.world.addRel(mine, cc, -18); const st = S.W.nat[cc]; if (st) st.stab = U.clamp(st.stab - 5); state().sanc.push({ by: mine, on: cc, y: yr() }); S.applyFx(p, { fm: 3, rep: -1 }); news(`${S.world.name(mine)} imposes sanctions on ${name}.`, [mine, cc], 'politics'); return 'Sanctions imposed.'; }
      case 'aid': { const cost = S.toVal(c * 0.4 * lvl); if (p.money < cost) return `Aid costs ${S.money(cost)}.`; p.money -= cost; S.world.addRel(mine, cc, 14); const st = S.W.nat[cc]; if (st) st.stab = U.clamp(st.stab + 5); S.applyFx(p, { rep: 3, fm: 2 }); return `Your aid reached ${name}.`; }
      case 'peace': {
        const war = S.activeWars().find(h => h.dyn && h.where.includes(mine) && h.where.includes(cc)); if (!war) return 'You are not at war with them.';
        if (U.chance(U.clamp(0.25 + (-Math.abs(war.score || 0) / 40) + lvl * 0.1 + (r + 50) / 300, 0.1, 0.8))) { Pol.endWar(war, null); return 'The envoys agreed a peace.'; }
        return 'The other side refused to talk.';
      }
    }
    return '';
  }

  return { pickNear, sideOf, fighting, shape, ids, decode, near, dist, known, power, ranking, allied, alliesOf, ally, unally, atWar, tick, diplomacy, isLeader, state, REACH };
})();
