/* =====================================================================
   SETTLEMENTS & MIGRATION — everyone lives somewhere: a hunting camp,
   a village near a town, or a named city whose size changes over the
   centuries (DATA.cities). Where you live changes your cost of living,
   pay, exposure to disease and which jobs you can get. People move to
   the city, bands follow the herds, and historical migrations carry
   genes and families from land to land.
   ===================================================================== */

const Towns = (() => {
  const S = Sim, W = () => S.W, yr = () => S.W.year;
  const LV = ['Camp', 'Hamlet', 'Village', 'Town', 'City', 'Great city', 'Metropolis', 'Megacity'];
  const COST = [0.6, 0.7, 0.8, 1, 1.12, 1.25, 1.4, 1.55], PAY = [0.7, 0.8, 0.85, 1, 1.1, 1.2, 1.3, 1.4];
  const SICK_OLD = [0.7, 0.8, 0.85, 1, 1.25, 1.5, 1.7, 1.8], SICK_NEW = [1, 1, 1, 1, 1.03, 1.06, 1.1, 1.15];
  const URBAN = { prehistory: 0.02, ancient: 0.1, medieval: 0.1, renaissance: 0.12, colonial: 0.15, industrial: 0.32, wars: 0.45, modern: 0.6, digital: 0.7, near: 0.8, far: 0.9 };

  /* ---------- the city tables ---------- */
  const cache = {};
  function list(cc) {
    if (cache[cc]) return cache[cc];
    return (cache[cc] = (DATA.cities[cc] || []).map(([raw, from, to, pts]) => ({ raw, from, to: to || null, pts: pts.split(' ').map(x => x.split(':').map(Number)) })));
  }
  const find = (cc, raw) => list(cc).find(c => c.raw === raw);
  function nameOf(raw, y = yr()) {
    if (!raw) return '';
    const parts = raw.split('>'); let n = parts[0];
    for (let i = 1; i < parts.length; i += 2) if (y >= +parts[i]) n = parts[i + 1];
    return n;
  }
  function lvlOf(c, y = yr()) {
    if (!c || y < c.from || (c.to != null && y > c.to)) return -1;
    let l = -1; for (const [yy, v] of c.pts) if (y >= yy) l = v;
    return l;
  }
  const citiesAt = (cc, y = yr()) => list(cc).map(c => ({ c, raw: c.raw, name: nameOf(c.raw, y), lvl: lvlOf(c, y) })).filter(x => x.lvl >= 0).sort((a, b) => b.lvl - a.lvl);
  const neoOK = (cc, what, y = yr()) => { const n = DATA.neolithic[cc]; return !n || y >= (n[what] ?? -1e9); };

  /* ---------- homes ---------- */
  function pickHome(cc, y = yr(), urbanBias = 0) {
    const cs = citiesAt(cc, y), e = S.eraOf(y);
    const space = S.world?.C(cc)?.region === 'space';
    if (!cs.length) return { c: null, near: S.world ? S.world.cap(cc, y) : '', rural: true, hm: U.chance(0.3) ? 1 : 0 };
    const urb = space ? 1 : U.clamp((URBAN[e.id] ?? 0.2) + urbanBias, 0, 1);
    const pick = U.wpick(cs, x => (x.lvl + 1) ** 2);
    if (U.chance(urb) || pick.lvl <= 1) return { c: pick.raw, rural: false };
    return { c: null, near: pick.raw, rural: true, hm: U.chance(0.3) ? 1 : 0 };
  }
  function ensure(p) {
    if (p.home && (p.home.c || p.home.near != null)) return p.home;
    return (p.home = pickHome(p.cc || 'ENG'));
  }
  function info(p, y = yr()) {
    const h = ensure(p), cc = p.cc;
    if (!h.rural) {
      const c = find(cc, h.c), l = lvlOf(c, y);
      if (c && l >= 0) return { name: nameOf(h.c, y), lvl: l, lvlName: LV[l], label: `${nameOf(h.c, y)} (${LV[l].toLowerCase()})`, rural: false, raw: h.c };
    }
    const near = h.near != null ? (find(cc, h.near) ? nameOf(h.near, y) : h.near) : h.c ? nameOf(h.c, y) : '';
    const forage = !neoOK(cc, 'farm', y) && y < 1500;
    const l = forage ? 0 : h.hm ? 1 : 2;
    const what = forage ? 'hunting camp' : LV[l].toLowerCase();
    return { name: near, lvl: l, lvlName: forage ? 'Camp' : LV[l], label: near ? `a ${what} near ${near}` : `a ${what}`, rural: true, raw: null };
  }
  const lvl = p => info(p).lvl;

  function move(p, target, quiet) {
    const e = S.era(), from = info(p);
    const dest = target === 'rural' ? { c: null, near: from.rural ? ensure(p).near : from.raw, rural: true, hm: 0 } : { c: target, rural: false };
    if (dest.c && dest.c === ensure(p).c) return 'You already live there.';
    const cost = S.toVal(e.cost * (target === 'rural' ? 0.1 : 0.25));
    if (!quiet) {
      if (S.age(p) < 16) return 'You are too young to move on your own.';
      if (p.did.move) return 'You already moved this year.';
      if (p.money < cost) return `Moving costs ${S.money(cost)}.`;
      p.did.move = 1; p.money -= cost;
    }
    p.home = dest;
    const fam = [S.spouse(p), ...S.kids(p).filter(k => S.age(k) < 18)].filter(o => o && S.alive(o) && o.cc === p.cc);
    fam.forEach(o => { o.home = { ...dest }; });
    for (const [id, r] of Object.entries(p.rels)) if (r.k === 'friend' || r.k === 'coworker') r.c = U.clamp(r.c - 8);
    if (p.places) delete p.places.town;
    const to = info(p);
    S.log(p, `You moved to ${to.label}${fam.length ? ` with ${fam.map(o => o.first).join(', ')}` : ''}.`, 'switch');
    return `You moved to ${to.label}.`;
  }

  /* ---------- hooks into the rest of the game ---------- */
  S.addHook('onCreate', (p, o) => {
    const par = [S.P(p.mo), S.P(p.fa)].find(x => x && x.home && x.cc === p.cc);
    if (par) { p.home = { ...par.home }; return; }
    const nr = o && o.near;
    if (nr && nr.home && nr.cc === p.cc && U.chance(0.7)) { p.home = { ...nr.home }; return; }
    p.home = pickHome(p.cc || 'ENG');
  });
  S.addHook('migrate', w => Object.values(w.people).forEach(ensure));
  S.hooks.neo = what => { const p = S.W && S.me(); return !p || neoOK(p.cc, what); };
  S.addHook('costMul', p => COST[lvl(p)] ?? 1, 'mul');
  S.addHook('payMul', p => PAY[lvl(p)] ?? 1, 'mul');
  S.addHook('catchMul', p => (DATA.PREMODERN.includes(S.era().id) ? SICK_OLD : SICK_NEW)[lvl(p)] ?? 1, 'mul');
  const BIGJOB = /senator|banker|lord|cardinal|governor|tycoon|industrialist|astronaut|anchor|film|star|stockbroker|diplomat|courtier|scholar-official|data scientist|ai researcher|neural|captain/i;
  function needLvl(j, e) {
    if (yr() < -3000 || S.world.C(S.me()?.cc)?.region === 'space') return 0;
    if (BIGJOB.test(j.t) || j.edu >= 3 || j.rep >= 50) return 4;
    if (j.edu >= 2 || j.pay >= e.cost * 3) return 3;
    return 0;
  }
  S.addHook('jobWhy', (p, j) => { const n = needLvl(j, S.era()), l = lvl(p); return l < n ? [n >= 4 ? 'living in a city' : 'living in a town'] : []; }, 'cat');

  // School beyond the basics needs a town in older ages; boarding away costs extra
  S.addHook('eduWhy', (p, l) => (l >= 3 && DATA.PREMODERN.includes(S.era().id) && lvl(p) < 3 ? ['a town with a school (or board away)'] : []), 'cat');

  /* ---------- settlement events ---------- */
  S.addHook('events', p => {
    const y = yr(), h = info(p), a = S.age(p), big = citiesAt(p.cc)[0];
    const out = [];
    if (h.rural && big && big.lvl >= 3 && a >= 16 && a <= 35 && y > -3000) out.push({ id: 'bigcity', p: ['industrial', 'wars', 'modern', 'digital'].includes(S.era().id) ? 0.08 : 0.03, t: `Travellers bring stories of ${big.name}: work, noise, and money for anyone willing to try.`, ch: [
      { l: `Move to ${big.name}`, go: 'city', fx: { im: 2, hp: 2 }, t: `You packed a bundle and left for ${big.name}.` }, { l: 'Stay where your roots are', fx: { mh: 2 }, t: 'Home is home.' }] });
    if (h.lvl === 0 && a >= 3) out.push({ id: 'bandmove', p: 0.08, t: 'The band broke camp and followed the herds to new grounds.', fx: { h: 1, im: 2 } });
    if (!h.rural && h.lvl >= 4 && DATA.PREMODERN.includes(S.era().id)) out.push({ id: 'cityfire', p: 0.03, min: 1, t: `Fire tore through the crowded lanes of ${h.name}.`, fx: { h: [-10, 0], $c: -0.1, hp: -4 } });
    if (!h.rural && h.lvl >= 5) out.push({ id: 'bigcitylife', p: 0.05, min: 12, t: `${h.name} never sleeps. Everything you could want is here, for a price.`, ch: [{ l: 'Take it all in', fx: { hp: 5, im: 2, $c: -0.03 }, t: 'Theatres, markets, crowds. You loved it.' }, { l: 'Keep your head down', fx: { mh: 1 }, t: 'The city is loud. You kept to your street.' }] });
    if (h.rural && h.lvl >= 1) out.push({ id: 'villagefair', p: 0.05, min: 4, t: 'The whole district came to the fair: livestock, dancing and gossip.', fx: { hp: 4, rep: 1 } });
    return out;
  }, 'cat');
  S.addHook('chose', (p, c) => { if (c.go === 'city') { const big = citiesAt(p.cc)[0]; if (big) move(p, big.raw, true); } });

  /* ---------- migration waves, refugees, settlement growth ---------- */
  function mixPop(to, froms, rate) {
    const w = W(), P = Gen.pop(w, to), src = froms.map(f => Gen.pop(w, f));
    for (const k of Gen.KEYS) { const g = src.reduce((s, x) => s + x[k], 0) / src.length; P[k] += (g - P[k]) * rate; }
  }
  const warsHere = cc => S.activeWars().filter(h => h.where && h.where.includes(cc) && h.civ);
  S.addHook('preYear', p => {
    const y = yr();
    for (const h of DATA.history) {
      if (h.type !== 'migration' || y < h.y || y > (h.end ?? h.y) || !h.where) continue;
      if (h.from && h.mix) for (const to of h.where) mixPop(to, h.from, h.mix);
      // a few people you know join the movement
      if (h.from) for (const o of S.known(p)) if (S.alive(o) && h.from.includes(o.cc) && S.age(o) >= 16 && S.age(o) <= 45 && U.chance(0.015)) {
        const dest = U.pick(h.where); o.cc = dest; o.home = pickHome(dest, y, 0.2);
        S.log(p, `Your ${S.relLabel(p, o).toLowerCase()} ${o.first} left for ${S.world.name(dest)}.`, 'world');
      }
      // and you might too
      const key = 'mig_' + h.key;
      if (h.from && h.from.includes(p.cc) && !p.flags[key] && S.age(p) >= 16 && S.age(p) <= 50 && U.chance(0.25)) {
        p.flags[key] = 1; const dest = U.pick(h.where);
        S.prompt({ title: 'A time of leaving', text: `${h.t}\n\nNeighbours are packing up for ${S.world.name(dest)}. Will you go with them?`, choices: [
          { l: `Go to ${S.world.name(dest)}`, go: () => { const t = emigrateCheap(p, dest); return t; } },
          { l: 'Stay', go: () => { S.log(p, 'Many left, but you stayed.', 'life'); return 'You watched them go.'; } }] });
      }
      if (h.urban && h.where.includes(p.cc) && info(p).rural && !p.flags[key] && S.age(p) >= 16 && S.age(p) <= 45 && U.chance(0.2)) {
        p.flags[key] = 1; const big = citiesAt(p.cc)[0];
        if (big) S.prompt({ title: 'Heading north', text: `${h.t}\n\nFactories in ${big.name} are hiring. Go?`, choices: [
          { l: `Move to ${big.name}`, go: () => move(p, big.raw, true) }, { l: 'Stay home', go: () => 'You stayed.' }] });
      }
    }
    // refugees: war with civilian deaths at home
    const wars = warsHere(p.cc);
    if (wars.length && S.age(p) >= 16 && !p.flags.war && !p.prison && U.chance(0.1)) {
      const h = wars[0], key = 'fled_' + h.key;
      if (!p.flags[key]) {
        const safe = S.world.countriesAt().filter(c => c.id !== p.cc && c.region !== 'space' && !S.activeWars().some(w => w.where && w.where.includes(c.id)));
        if (safe.length) {
          p.flags[key] = 1; const dest = U.pick(safe).id;
          S.prompt({ title: 'The war comes closer', text: `The ${h.n} has reached your district. Families are fleeing toward ${S.world.name(dest)}.`, choices: [
            { l: `Flee to ${S.world.name(dest)}`, go: () => emigrateCheap(p, dest, 'fled') },
            { l: 'Stay and endure', go: () => { S.applyFx(p, { mh: -4, wp: 2 }); return 'You bolted the door and stayed.'; } }] });
        }
      }
    }
  });
  function emigrateCheap(p, dest, how = 'migrated') {
    const from = p.cc;
    p.cc = dest; p.home = pickHome(dest, yr(), 0.2);
    const fam = [S.spouse(p), ...S.kids(p).filter(k => S.age(k) < 18)].filter(o => o && S.alive(o));
    fam.forEach(o => { o.cc = dest; o.home = { ...p.home }; });
    if (p.job && !['digital', 'near', 'far'].includes(S.era().id)) p.job = null;
    p.money *= how === 'fled' ? 0.5 : 0.8;
    S.applyFx(p, { mh: how === 'fled' ? -6 : -2, im: 3, rep: -2 });
    if (!p.travels.includes(dest)) p.travels.push(dest);
    const t = `You ${how === 'fled' ? 'fled' : 'emigrated'} from ${S.world.name(from)} to ${info(p).label}, ${S.world.name(dest)}${fam.length ? ` with ${fam.map(o => o.first).join(', ')}` : ''}.`;
    S.log(p, t, 'switch');
    return t;
  }
  S.addHook('postYear', p => {
    const h = ensure(p), i = info(p);
    // your town grows, shrinks, is renamed or abandoned
    if (!h.rural) {
      if (lvlOf(find(p.cc, h.c)) < 0) { const near = citiesAt(p.cc)[0]; p.home = { c: null, near: near ? near.raw : '', rural: true }; S.log(p, `${nameOf(h.c)} was abandoned. Your family moved out into the country.`, 'bad'); }
      else if (h.seen != null && i.lvl !== h.seen) S.log(p, i.lvl > h.seen ? `${i.name} has grown into a ${i.lvlName.toLowerCase()}.` : `${i.name} has shrunk to a ${i.lvlName.toLowerCase()}.`, 'world');
      else if (h.nm && h.nm !== i.name) S.log(p, `${h.nm} is now called ${i.name}.`, 'world');
    }
    p.home.seen = info(p).lvl; p.home.nm = info(p).name;
    // farming arrives in a hunter's lifetime
    const n = DATA.neolithic[p.cc];
    if (n && yr() === n.farm) S.log(p, 'Strangers with seed grain and tame goats have settled nearby. They plant, and they stay. Nothing will be quite the same.', 'world');
    if (n && yr() === n.copper) S.log(p, 'The first copper tools have reached your land. They gleam like the sun.', 'world');
  });

  // Emigrating to another country gives you a new home there
  LATE.push(() => {
    const em = S.world.emigrate;
    S.world.emigrate = (cc, family) => {
      const p = S.me(), before = p.cc, t = em(cc, family);
      if (p.cc !== before) { p.home = pickHome(cc, yr(), 0.25); [S.spouse(p), ...S.kids(p)].forEach(o => { if (o && o.cc === cc) o.home = { ...p.home }; }); }
      return t;
    };
  });

  return { LV, list, citiesAt, nameOf, lvlOf, info, lvl, move, pickHome, ensure, neoOK, COST, PAY, emigrateCheap };
})();
Sim.towns = Towns;

/* ---------------- World → Your land ---------------- */
LATE.push(() => {
  const S = Sim, ui = UI, T = Towns, { esc, toast, render } = ui;
  const x = v => `×${(+v).toFixed(2).replace(/0$/, '')}`;
  function view(p) {
    const e = S.era(), i = T.info(p), cs = T.citiesAt(p.cc), n = DATA.neolithic[p.cc], y = S.W.year;
    const neoLine = n ? (!T.neoOK(p.cc, 'farm') ? `People here live by hunting, fishing and gathering. Farming reaches this land around ${U.fmtYear(n.farm)}.` : y < 1500 ? `Farming came to this land in ${U.fmtYear(n.farm)}; ${T.neoOK(p.cc, 'copper') ? `copper-working in ${U.fmtYear(n.copper)}.` : `copper will arrive around ${U.fmtYear(n.copper)}.`}` : '') : '';
    const migs = DATA.history.filter(h => h.type === 'migration' && y >= h.y && y <= (h.end ?? h.y) && ((h.where || []).includes(p.cc) || (h.from || []).includes(p.cc)));
    const cost = raw => S.toVal(e.cost * (raw === 'rural' ? 0.1 : 0.25));
    return `<div class="panel"><div class="eyebrow">Where you live</div><h3>${esc(i.label[0].toUpperCase() + i.label.slice(1))}</h3>
        <p class="lede">${esc(S.world.name(p.cc))}. ${esc(neoLine)}</p>
        <div class="facts"><div class="fact"><div class="eyebrow">Settlement</div><div class="v sm">${esc(i.lvlName)}</div></div>
          <div class="fact"><div class="eyebrow">Living costs</div><div class="v sm">${x(T.COST[i.lvl])}</div></div>
          <div class="fact"><div class="eyebrow">Wages</div><div class="v sm">${x(T.PAY[i.lvl])}</div></div>
          <div class="fact"><div class="eyebrow">Best jobs</div><div class="v sm">${i.lvl >= 4 ? 'All open' : i.lvl >= 3 ? 'Most open' : 'Local work only'}</div></div></div>
        <p class="faint" style="font-size:12.5px;margin:10px 0 0">Cities pay more and open the best careers, but cost more and, before modern medicine, spread disease. Villages and camps are cheap, close-knit and healthier.</p></div>
      ${migs.length ? `<div class="panel"><div class="eyebrow">Peoples on the move</div><ul class="laws">${migs.map(h => `<li>${esc(h.t)}</li>`).join('')}</ul></div>` : ''}
      <div class="sec-h"><h3>Settlements of ${esc(S.world.C(p.cc).short)}</h3><span class="faint">${cs.length}</span></div>
      <div class="list">${cs.map(c => { const here = !i.rural && i.raw === c.raw; return `<div class="row"><div class="main"><div class="t">${esc(c.name)}${here ? ' <span class="tag era">home</span>' : ''}${c.name === S.world.cap(p.cc) ? ' <span class="tag">capital</span>' : ''}</div><div class="s">${esc(T.LV[c.lvl])} · since ${U.fmtYear(c.c.from)}</div></div>${here ? '' : `<button class="btn sm" data-act="townMove" data-raw="${esc(c.raw)}">Move · ${S.money(cost(c.raw))}</button>`}</div>`; }).join('') || '<div class="row muted">No towns yet: people live in camps and hamlets.</div>'}
        ${i.rural ? '' : `<div class="row"><div class="main"><div class="t">The countryside</div><div class="s">A ${T.neoOK(p.cc, 'farm') ? 'village' : 'camp'} near ${esc(i.name)}</div></div><button class="btn sm" data-act="townMove" data-raw="rural">Move · ${S.money(cost('rural'))}</button></div>`}</div>`;
  }
  (ui.worldExtra ||= []).push({ id: 'land', n: 'Your land', first: true, view });
  ui.on.townMove = el => { const t = T.move(S.me(), el.dataset.raw); render(); toast(t); };
});
