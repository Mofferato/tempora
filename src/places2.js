/* =====================================================================
   MORE PLACES — the tavern, the house of worship, the hospital, the
   market, the battlefield in wartime and the council chamber for those
   in office. Each is named for its era and land, has its own regulars,
   and its own ways to spend the hours. Also: a clear notice on the
   Places tab when you are school-age but not enrolled, and why.
   ===================================================================== */

(() => {
  const S = Sim, ui = UI, P = Places, { esc, toast, render } = ui;
  const base = { ...P };
  const ISL = ['EGY', 'IRN', 'MAG', 'MSP', 'LEV', 'ANA'];
  const era = () => S.era().id, yr = () => S.W.year;
  const pre = () => DATA.PREMODERN.includes(era());

  const NAMES = {
    tavern: p => { const e = era(), cc = p.cc; if (e === 'prehistory') return 'The fire circle'; if (ISL.includes(cc) && yr() > 700) return yr() > 1550 ? 'The coffeehouse' : 'The tea house'; return { ancient: cc === 'EGY' || cc === 'MSP' ? 'The beer house' : 'The wine shop', medieval: 'The alehouse', renaissance: 'The tavern', colonial: 'The tavern', industrial: cc === 'USA' ? 'The saloon' : 'The pub', wars: 'The bar', modern: 'The bar', digital: 'The bar', near: 'The VR lounge', far: 'The zero-g bar' }[e]; },
    church: p => { const e = era(), cc = p.cc, y = yr(); if (e === 'prehistory') return 'The sacred grove'; if (e === 'near') return 'The mindfulness dome'; if (e === 'far') return 'The Hall of Silence'; if (ISL.includes(cc) && y > 640) return 'The mosque'; if (cc === 'CHN' || cc === 'IND' || cc === 'EGY' || cc === 'MEX' || cc === 'AND') return 'The temple'; if (cc === 'JPN') return 'The shrine'; if (['ENG', 'FRA', 'ITA', 'GRC', 'RUS', 'USA', 'SCA', 'LEV', 'ANA', 'MAG'].includes(cc) && y > 400) return 'The church'; return 'The temple'; },
    hospital: () => ({ prehistory: "The medicine woman's hut", ancient: 'The temple of healing', medieval: 'The infirmary', renaissance: 'The hospital', colonial: 'The infirmary', industrial: 'The hospital', wars: 'The hospital', modern: 'The hospital', digital: 'The hospital', near: 'The med-clinic', far: 'The nano-medic bay' }[era()]),
    market: p => ({ prehistory: 'The trading ground', ancient: p.cc === 'GRC' ? 'The agora' : p.cc === 'ITA' ? 'The forum' : 'The market', medieval: 'The market square', renaissance: 'The market square', colonial: 'The market', industrial: 'The high street', wars: 'The high street', modern: 'The shopping mall', digital: 'The shopping mall', near: 'The drone market', far: 'The trade concourse' }[era()]),
    battlefield: p => { const w = S.activeWars().find(h => h.key === p.flags.war); return w ? `The front · ${w.n}` : 'The front'; },
    palace: p => { const k = S.pol?.kindOf(p.cc); return k === 'tribal' ? 'The council fire' : k === 'republic' || k === 'const' ? (p.office?.lvl >= 3 ? 'The chamber' : 'The town hall') : k === 'party' ? 'Party headquarters' : 'The palace'; },
  };
  const DESC = {
    tavern: 'Drink, music, gossip and the odd brawl.', church: 'Prayer, counsel, charity and festivals.', hospital: 'Treatment, check-ups, and people who need a visit.',
    market: 'Haggling, trading and street performers.', battlefield: 'Mud, fear and comradeship.', palace: 'Power, favours and intrigue.',
  };
  const AMB = {
    tavern: ['Someone struck up a song.', 'A tankard crashed to the floor.', 'The fire crackled.'], church: ['Bells rang.', 'Incense drifted past.', 'Someone wept quietly at the back.'],
    hospital: ['A bell rang for a nurse.', 'Someone groaned in the next bed.', 'The smell of vinegar and lye.'], market: ['A trader bellowed prices.', 'A cart lost a wheel.', 'Someone haggled furiously.'],
    battlefield: ['Guns rumbled in the distance.', 'Rain filled the trenches.', 'Someone was singing, badly.'], palace: ['Whispers behind every door.', 'A messenger hurried past.', 'Papers were signed and sealed.'],
  };
  const HOURS = { tavern: 5, church: 3, hospital: 4, market: 4, battlefield: 10, palace: 6 };
  const ROLES = {
    tavern: ['patron', 'barkeep', 'Patron', 'Barkeep'], church: ['worshipper', 'priest', 'Worshipper', null], hospital: ['patient', 'healer', 'Patient', null],
    market: ['trader', null, 'Trader', null], battlefield: ['comrade', 'officer', 'Comrade', 'Officer'], palace: ['courtier', 'patron', 'Official', 'Patron'],
  };
  const clergy = p => ({ prehistory: 'Shaman', near: 'Guide', far: 'Keeper' }[era()] || (ISL.includes(p.cc) && yr() > 640 ? 'Imam' : ['CHN', 'JPN'].includes(p.cc) ? 'Priest' : 'Priest'));
  const healer = () => ({ prehistory: 'Medicine woman', ancient: 'Physician', medieval: 'Barber-surgeon' }[era()] || 'Doctor');

  P.available = p => {
    const out = base.available(p);
    if (p.prison) return out;
    const a = S.age(p);
    if (a >= 14) out.push('tavern');
    if (a >= 3) out.push('church');
    out.push('hospital');
    if (a >= 8) out.push('market');
    if (p.flags.war && S.activeWars().some(h => h.key === p.flags.war)) out.unshift('battlefield');
    if ((p.office?.lvl || 0) >= 1) out.push('palace');
    return out;
  };
  P.title = (p, id) => (NAMES[id] ? NAMES[id](p) : base.title(p, id));
  P.desc = (p, id) => DESC[id];
  P.amb = id => AMB[id];
  Object.assign(P.HOURS, HOURS);

  /* ---------- rosters ---------- */
  function spawnIds(p, n, ageFn, o = {}) {
    return Array.from({ length: n }, () => {
      const cc = o.foreign && U.chance(0.12) ? U.pick(S.world.countriesAt().filter(c => c.region !== 'space' || c.id === p.cc)).id : p.cc;
      const q = S.mkPerson({ near: p, cc, born: U.add(yr(), -ageFn()), sex: o.sex });
      q.tmp = 1;
      if (o.job && S.age(q) >= 16 && !q.job) S.npcJob(q, S.era());
      return q.id;
    });
  }
  function roster2(p, id) {
    p.places ||= {};
    const a = S.age(p), y = yr();
    const key = { tavern: `${y}`, church: `${S.towns ? S.towns.info(p).label : p.cc}`, hospital: `${y}`, market: `${y}`, battlefield: `${p.flags.war}`, palace: `${p.office?.lvl}:${p.cc}` }[id];
    let r = p.places[id];
    if (!r || r.key !== key) {
      if (r && ['tavern', 'hospital', 'market'].includes(id)) P.cleanup?.(p, r.ids);
      const tmp = ['tavern', 'hospital', 'market'].includes(id);
      if (id === 'tavern') r = { key, ids: spawnIds(p, 6, () => U.ri(18, 70), { tmp, foreign: 1, job: 1 }), staff: [], head: spawnIds(p, 1, () => U.ri(25, 60), { job: 1 }) };
      if (id === 'church') r = { key, ids: spawnIds(p, 6, () => U.ri(5, 85)), staff: [], head: spawnIds(p, 1, () => U.ri(30, 70), { sex: pre() && !['prehistory'].includes(era()) ? 'M' : undefined }) };
      if (id === 'hospital') r = { key, ids: spawnIds(p, 4, () => U.ri(1, 90), { tmp }), staff: [], head: spawnIds(p, 1, () => U.ri(28, 65)) };
      if (id === 'market') r = { key, ids: spawnIds(p, 6, () => U.ri(14, 75), { tmp, foreign: 1, job: 1 }), staff: [], head: [] };
      if (id === 'battlefield') r = { key, ids: spawnIds(p, 6, () => U.ri(18, 40), { sex: 'M' }), staff: [], head: spawnIds(p, 1, () => U.ri(28, 55), { sex: 'M' }) };
      if (id === 'palace') r = { key, ids: spawnIds(p, 5, () => U.ri(30, 70), { job: 1 }), staff: [], head: spawnIds(p, 1, () => U.ri(45, 75)) };
      p.places[id] = r;
    }
    const [k, hk] = ROLES[id];
    const roleName = (kk, o) => (kk === hk ? (id === 'church' ? clergy(p) : id === 'hospital' ? healer() : ROLES[id][3]) : ROLES[id][2]);
    return [...r.head.map(i => [i, hk]), ...r.ids.map(i => [i, k])].map(([i, kk]) => ({ o: S.P(i), k: kk })).filter(x => x.o && S.alive(x.o)).map(x => ({ o: x.o, k: x.k, role: roleName(x.k, x.o) }));
  }
  P.roster = (p, id) => (ROLES[id] ? roster2(p, id) : base.roster(p, id));

  /* ---------- things to do ---------- */
  const knownSick = p => S.known(p).filter(o => S.alive(o) && o.sick.length && (p.rels[o.id]?.c ?? 0) >= 30);
  P.placeActs = (p, id) => {
    const a = S.age(p), y = yr();
    const L = {
      tavern: [[a >= 16 ? 'drink' : 'cider', a >= 16 ? (era() === 'prehistory' ? 'Share the fermented honey' : 'Have a drink') : 'Sip something sweet', 1], ['round', 'Buy a round for everyone', 1], ['dicegame', era() === 'prehistory' ? 'Throw the marked bones' : 'Play dice or cards', 1], ['gossipt', 'Listen to the gossip', 1], ['sing', 'Lead a song', 1], ['armwrestle', 'Arm-wrestle someone', 1], ['brawl', 'Start a brawl', 1]],
      church: [['pray', era() === 'prehistory' ? 'Leave an offering to the spirits' : ['near', 'far'].includes(era()) ? 'Meditate' : 'Pray', 1], ['counsel', 'Seek counsel', 1], ['alms', 'Give alms', 1], ['volunteer', 'Help the poor', 2], ['festival', 'Join the festival', 1], ['sermon', era() === 'prehistory' ? 'Listen to the shaman' : 'Listen to the sermon', 1]],
      hospital: [['checkup', 'Get a check-up', 1], ...(p.sick.length ? [['treat', 'Ask for treatment', 2]] : []), ...(knownSick(p).length ? [['visitsick', 'Visit a sick relative', 1]] : []), ['wards', 'Volunteer on the wards', 2], ...(y >= 1940 && a >= 17 ? [['blood', 'Donate blood', 1]] : []), ...(y >= 1950 && a >= 18 ? [['cosmetic', 'Ask about cosmetic treatment', 2]] : [])],
      market: [['haggle', 'Haggle for bargains', 1], ['sellmade', 'Sell things you made', 2], ['browse', 'Browse and people-watch', 1], ['performers', 'Watch the street performers', 1], ...(a >= 14 ? [['trade', 'Try a little trading', 2]] : [])],
      battlefield: [['hold', 'Hold the line', 2], ['charge', 'Lead a charge', 3], ['wounded', 'Tend the wounded', 2], ['forage', 'Forage for supplies', 2], ['letter', 'Write a letter home', 1], ['desert', 'Desert', 3]],
      palace: [['lobby', 'Lobby your colleagues', 2], ['speech', 'Give a speech', 2], ['intrigue', 'Scheme against a rival', 2], ['favour', 'Grant favours', 1]],
    }[id];
    return L || base.placeActs(p, id);
  };
  const fx = (p, f) => S.applyFx(p, f);
  function curePlayer(p) {
    const med = S.medicine(), cured = [];
    for (const s of p.sick.slice()) if (U.chance(med >= s.cure ? 0.85 : Math.max(0.05, 0.6 * med / s.cure - 0.1))) { cured.push(s.n); p.sick.splice(p.sick.indexOf(s), 1); }
    return cured;
  }
  P.doPlace = (p, id, act) => {
    if (!ROLES[id]) return base.doPlace(p, id, act);
    const e = S.era(), cost = m => S.toVal(e.cost * m), has = t => S.pers?.has(p, t);
    const people = () => P.roster(p, id).map(x => x.o);
    switch (act) {
      case 'drink': fx(p, { hp: 3, h: -1 }); if ((p.wp ?? 50) < 35 && U.chance(0.3)) { fx(p, { h: -3, rep: -2, wp: -1 }); return 'One drink became six. You do not remember getting home.'; } return 'A good drink among good company.';
      case 'cider': fx(p, { hp: 2 }); return 'Sticky, sweet and delicious.';
      case 'round': { const c = cost(0.004 * (people().length + 1)); if (p.money < c) return `A round would cost ${S.money(c)}.`; p.money -= c; people().forEach(o => P.knowAs(p, o, 'friend', 5)); fx(p, { rep: 2, hp: 3 }); S.pers?.nudge(p, 'generous', 0.5); return 'Cheers went up all round. You are everyone’s friend tonight.'; }
      case 'dicegame': { const st = cost(0.01); if (p.money < st) return 'You have nothing to stake.'; if (U.chance(0.45 + (has('deceitful') ? 0.05 : 0))) { p.money += st; fx(p, { hp: 3 }); return `You won ${S.money(st)}.`; } p.money -= st; fx(p, { hp: -2 }); S.pers?.nudge(p, 'reckless', 0.3); return `You lost ${S.money(st)}.`; }
      case 'gossipt': { const n = U.pick(S.W.news.slice(-20)); fx(p, { sm: 1 }); const k = U.pick(S.known(p).filter(S.alive)); return n ? `Word is: ${n.t}${k && U.chance(0.4) ? ` And people say ${k.first} ${U.pick(['has money troubles', 'is sweet on someone', 'is doing very well', 'had a row with the neighbours'])}.` : ''}` : 'Nothing but idle chatter.'; }
      case 'sing': if (U.chance((p.im ?? 50) / 110 + (has('gregarious') ? 0.1 : 0))) { fx(p, { hp: 5, fm: 1, rep: 1 }); return 'The whole room joined the chorus.'; } fx(p, { hp: -1 }); return 'You forgot the second verse.';
      case 'armwrestle': { const o = U.pick(people()); if (!o) return 'Nobody took you on.'; if (U.chance(0.3 + (p.h - o.h) / 200 + S.hadd('odds', p, { tag: 'fight' }))) { fx(p, { rep: 2, hp: 3 }); return `You slammed ${o.first}'s hand to the table.`; } fx(p, { hp: -2 }); return `${o.first} beat you easily.`; }
      case 'brawl': { S.pers?.nudge(p, 'hotheaded', 1); if (U.chance(0.4 + S.hadd('odds', p, { tag: 'fight' }))) { fx(p, { rep: 1, h: -4 }); return 'You won the brawl, bloodied but proud.'; } fx(p, { h: -10 }); if (U.chance(0.3) && S.hooks.arrest) return S.hooks.arrest(p, { crime: 'assault', yrs: 1, sev: 1, what: 'a tavern brawl' }); return 'You were thrown out into the street.'; }
      case 'pray': fx(p, { mh: has('skeptic') ? 1 : 4, hp: 1 }); S.pers?.nudge(p, 'pious', 0.5); return 'A quiet hour. Your mind settled.';
      case 'counsel': fx(p, { mh: 5, wp: 1 }); return 'Wise words, kindly meant. You left lighter.';
      case 'alms': { const c = cost(0.02); if (p.money < c) return 'You have nothing to spare.'; p.money -= c; fx(p, { rep: 3, mh: 2 }); S.pers?.nudge(p, 'generous', 1); return 'Your gift fed a family for a week.'; }
      case 'volunteer': fx(p, { rep: 3, mh: 3, h: -1 }); S.pers?.nudge(p, 'kind', 1); if (U.chance(0.3)) { const f = S.newFriend(p); return `You ladled soup for hours, and met ${f.first}.`; } return 'You ladled soup for hours. It mattered.';
      case 'festival': fx(p, { hp: 6, rep: 1 }); people().forEach(o => P.knowAs(p, o, 'friend', 3)); return 'Music, food and the whole community together.';
      case 'sermon': fx(p, { mh: 2, sm: 1, hp: -1 }); return U.pick(['The sermon was long, but it stayed with you.', 'You dozed off, and woke to a stern look.', 'Words about mercy. You thought about them all week.']);
      case 'checkup': { const c = cost(0.02); if (p.money < c) return `A check-up costs ${S.money(c)}.`; p.money -= c; const g = Math.round(U.ri(2, 5) * (0.5 + S.medicine())); fx(p, { h: g }); return pre() && U.chance(0.2) ? 'They bled you for good measure. You feel faint.' : 'A clean bill of health, and sensible advice.'; }
      case 'treat': { const c = cost(0.05); if (p.money < c) return `Treatment costs ${S.money(c)}.`; p.money -= c; const cured = curePlayer(p); fx(p, { h: 2 }); return cured.length ? `You were cured of ${cured.join(' and ').toLowerCase()}.` : 'They tried everything they knew. It was not enough.'; }
      case 'visitsick': { const o = U.pick(knownSick(p)); if (!o) return 'Nobody you know is ill.'; S.rel(p, o).c = U.clamp(S.rel(p, o).c + 8); o.hp = U.clamp(o.hp + 6); fx(p, { mh: -1 }); S.pers?.nudge(p, 'kind', 0.5); return `You sat by ${o.first}'s bed all afternoon. It meant the world to them.`; }
      case 'wards': fx(p, { rep: 3, mh: 2, h: -1 }); if (U.chance(pre() ? 0.1 : 0.03)) { fx(p, { h: -8 }); return 'You helped all day, and caught a fever for your trouble.'; } return 'You emptied basins and held hands. The nurses were grateful.';
      case 'blood': fx(p, { rep: 2, h: -1, mh: 2 }); return 'A pint of blood, a biscuit and a warm feeling.';
      case 'cosmetic': { const c = cost(0.25); if (p.money < c) return `The surgeon wants ${S.money(c)}.`; p.money -= c; if (U.chance(0.85)) { fx(p, { lk: U.ri(3, 9) }); return 'The results were subtle and flattering.'; } fx(p, { lk: -5, h: -5 }); return 'It went wrong. The swelling took months to settle.'; }
      case 'haggle': { const c = cost(0.01); if (p.money < c) return 'You cannot afford anything here.'; p.money -= c * (U.chance(0.5 + p.sm / 400) ? 0.6 : 1); fx(p, { hp: 3 }); return 'You got a bargain and a story about the bargain.'; }
      case 'sellmade': { if (U.chance((p.im ?? 50) / 120 + (has('creative') ? 0.1 : 0))) { const g = cost(U.rand(0.01, 0.05)); p.money += g; fx(p, { hp: 3, fm: 0.5 }); return `Your wares sold out. You made ${S.money(g)}.`; } fx(p, { hp: -1 }); return 'Hardly anyone stopped at your stall.'; }
      case 'browse': fx(p, { hp: 2, im: 1 }); return 'Silks, spices, gadgets and gossip.';
      case 'performers': fx(p, { hp: 3, im: 2 }); return U.pick(['A juggler kept seven things in the air.', 'A fire-eater nearly set a cart alight.', 'A puppet show made the children shriek.']);
      case 'trade': { const st = cost(0.05); if (p.money < st) return `Trading needs a stake of ${S.money(st)}.`; const w = U.chance(0.4 + p.sm / 300 + (has('greedy') ? 0.05 : 0)); p.money += w ? st * U.rand(0.2, 0.8) : -st * U.rand(0.2, 0.7); fx(p, { sm: 1 }); return w ? 'You bought low and sold high.' : 'You bought high and sold low. Lesson learned.'; }
      case 'hold': if (U.chance(0.25)) { fx(p, { h: -U.ri(6, 18) }); S.log(p, 'You were wounded holding the line.', 'bad'); return 'Shrapnel and screaming. You were hit, but held.'; } fx(p, { rep: 3, wp: 2, mh: -2 }); S.pers?.nudge(p, 'brave', 0.5); return 'The line held. So did you.';
      case 'charge': { S.pers?.nudge(p, 'brave', 1); if (U.chance(0.45 + S.hadd('odds', p, { tag: 'fight' }))) { fx(p, { rep: 8, fm: 6, hp: 4 }); S.log(p, 'You led a charge that broke the enemy line. Your name was mentioned in dispatches.', 'good'); p.flags.medal = (p.flags.medal || 0) + 1; return 'The charge broke through. You are a hero.'; } fx(p, { h: -U.ri(15, 35) }); if (p.h <= 0) S.kill(p, 'wounds from a charge'); return 'The charge was cut to pieces. You crawled back.'; }
      case 'wounded': fx(p, { rep: 3, mh: -2 }); S.pers?.nudge(p, 'kind', 0.8); people().forEach(o => P.knowAs(p, o, 'friend', 4)); return 'You bound wounds until your hands shook.';
      case 'forage': if (U.chance(0.7)) { fx(p, { h: 2, hp: 3 }); return 'You found potatoes, and a chicken nobody claimed.'; } fx(p, { h: -5 }); return 'A sniper nearly had you.';
      case 'letter': { const who = [S.spouse(p), ...S.parents(p)].filter(o => o && S.alive(o)); who.forEach(o => { S.rel(p, o).c = U.clamp(S.rel(p, o).c + 6); }); fx(p, { mh: 3 }); return who.length ? `You wrote to ${who.map(o => o.first).join(' and ')}. They will keep the letter forever.` : 'You wrote a letter to nobody in particular, and felt better.'; }
      case 'desert': if (U.chance(0.4)) { delete p.flags.war; p.flags.fugitive = yr(); fx(p, { rep: -10, mh: -4 }); S.log(p, 'You deserted from the front and slipped away.', 'bad'); return 'You slipped away in the night. You are a deserter now.'; } return S.hooks.arrest ? S.hooks.arrest(p, { crime: 'desertion', yrs: 5, sev: 3 }) : 'You were caught.';
      case 'lobby': { if (!p.office) return 'You hold no office.'; p.office.appr = U.clamp(p.office.appr + 2); people().forEach(o => P.knowAs(p, o, 'coworker', 4)); return 'You worked the corridors. Votes are lining up.'; }
      case 'speech': { if (!p.office) return 'You hold no office.'; if (U.chance(0.5 + p.sm / 300 + (has('charming') ? 0.12 : 0))) { p.office.appr = U.clamp(p.office.appr + 5); fx(p, { fm: 3, rep: 2 }); return 'A rousing speech. It was quoted everywhere.'; } p.office.appr = U.clamp(p.office.appr - 3); return 'The speech fell flat. A heckler got the best line.'; }
      case 'intrigue': { if (!p.office) return 'You hold no office.'; S.pers?.nudge(p, 'deceitful', 1); if (U.chance(0.5 + S.hadd('odds', p, { l: 'bluff' }))) { p.office.appr = U.clamp(p.office.appr + 3); fx(p, { rep: -1 }); return 'Your rival stumbled into the trap you laid.'; } fx(p, { rep: -8 }); p.office.appr = U.clamp(p.office.appr - 8); return 'Your scheme was exposed. Embarrassing.'; }
      case 'favour': { if (!p.office) return 'You hold no office.'; const c = cost(0.1 * p.office.lvl); if (p.money < c) return `Favours cost ${S.money(c)}.`; p.money -= c; p.office.appr = U.clamp(p.office.appr + 4); return 'Jobs for friends, roads for loyal districts. It works.'; }
    }
    return '';
  };

  /* ---------- people here ---------- */
  P.personActs = (p, id, x) => {
    if (!ROLES[id]) return base.personActs(p, id, x);
    const a = S.age(p), oa = S.age(x.o);
    const L = [['talk', 'Talk'], ['joke', 'Tell a joke'], ['compliment', 'Compliment them']];
    if (!p.rels[x.o.id] || p.rels[x.o.id].k !== 'friend') L.push(['befriend', 'Offer friendship']);
    if (id === 'tavern' && a >= 16) L.push(['buydrink', 'Buy them a drink']);
    if (id === 'church') L.push(['praywith', 'Pray together']);
    if (id === 'hospital' && x.k === 'patient') L.push(['comfort', 'Comfort them']);
    if (id === 'battlefield') L.push(['cover', 'Watch their back']);
    if (id === 'market') L.push(['buyfrom', 'Buy something from them']);
    if (a >= 16 && oa >= 16 && Math.abs(a - oa) <= 15 && p.sp == null && id !== 'battlefield') L.push(['flirt', 'Flirt']);
    L.push(['insult', 'Insult them'], ['fight', 'Pick a fight']);
    return L;
  };
  P.doPerson = (p, id, oid, act) => {
    if (!ROLES[id]) return base.doPerson(p, id, oid, act);
    const x = P.roster(p, id).find(r => r.o.id === oid); if (!x) return '';
    const o = x.o, e = S.era(), r = P.knowAs(p, o, x.k === 'officer' || x.k === 'comrade' ? 'coworker' : 'friend'), f = q => S.applyFx(p, q);
    const gain = (lo, hi) => { r.c = U.clamp(r.c + U.ri(lo, hi) + S.hadd('relGain', p, o, 'talk')); };
    switch (act) {
      case 'talk': gain(3, 8); f({ hp: 1 }); return `You and ${o.first} talked. ${U.pick(['They told you about their family.', 'You found you both like the same things.', 'Mostly small talk, but pleasant.'])}`;
      case 'joke': if (U.chance(0.35 + (p.im ?? 50) / 200)) { gain(8, 12); return `${o.first} laughed until they cried.`; } r.c = U.clamp(r.c - 3); return `${o.first} did not get it.`;
      case 'compliment': gain(4, 6); o.hp = U.clamp(o.hp + 3); return `${o.first} blushed.`;
      case 'befriend': if (r.c >= 40 || U.chance(0.3)) { r.k = 'friend'; o.rels[p.id].k = 'friend'; gain(3, 6); S.log(p, `You became friends with ${o.first} ${o.last}.`, 'life'); return `${o.first} is your friend now.`; } gain(2, 4); return `${o.first} is not sure about you yet.`;
      case 'buydrink': { const c = S.toVal(e.cost * 0.002); p.money -= c; gain(6, 12); return `${o.first} raised the glass to you.`; }
      case 'praywith': gain(4, 8); f({ mh: 2 }); return `You prayed side by side with ${o.first}.`;
      case 'comfort': gain(6, 10); o.hp = U.clamp(o.hp + 6); f({ mh: 1, rep: 1 }); return `You held ${o.first}'s hand. They were grateful.`;
      case 'cover': gain(8, 14); f({ wp: 1 }); if (U.chance(0.15)) { f({ h: -8 }); return `You took a hit meant for ${o.first}. They will never forget it.`; } return `You and ${o.first} kept each other alive another day.`;
      case 'buyfrom': { const c = S.toVal(e.cost * 0.01); if (p.money < c) return 'You cannot afford anything.'; p.money -= c; gain(3, 6); f({ hp: 2 }); return `${o.first} sold you something lovely, at only a slightly unfair price.`; }
      case 'flirt': { const pref = p.orient === 'bi' || (p.orient === 'gay' ? o.sex === p.sex : o.sex !== p.sex); if (pref && U.chance(0.25 + p.lk / 250 + r.c / 300 + S.hadd('odds', p, { tag: 'romance', o }))) { r.k = 'lover'; o.rels[p.id].k = 'lover'; S.log(p, `You started seeing ${o.first} ${o.last}.`, 'love'); return `${o.first} said yes. You are seeing each other now.`; } r.c = U.clamp(r.c - 8); return `${o.first} was not interested.`; }
      case 'insult': r.c = U.clamp(r.c - 15); f({ rep: -1 }); if (r.c < 15) r.k = 'enemy'; return `${o.first} will not forget that.`;
      case 'fight': { const win = U.chance(0.35 + (p.h - o.h) / 200 + S.hadd('odds', p, { tag: 'fight' })); r.c = U.clamp(r.c - 10); if (win) { f({ rep: 1, hp: 2 }); o.h = U.clamp(o.h - 10); return `You beat ${o.first} in a fight.`; } f({ h: -10, hp: -3 }); return `${o.first} beat you badly.`; }
    }
    return '';
  };

  // Place regulars nobody is attached to any more are let go every few years
  function sweep(p) {
    const keep = new Set();
    for (const r of Object.values(p.places || {})) if (r) [...(r.ids || []), ...(r.staff || []), ...(r.head || [])].forEach(i => keep.add(i));
    for (const [id, q] of Object.entries(S.W.people)) {
      if (!q.tmp || keep.has(+id) || p.rels[id] || q.sp != null || q.kids.length || q.played || q.flags?.ruler || q.id === p.id) continue;
      delete S.W.people[id];
    }
  }
  S.addHook('postYear', p => { if (S.W.year % 3 === 0) sweep(p); });

  /* ---------- the Places tab: a clear word about school ---------- */
  const view = ui.views.places;
  ui.views.places = p => {
    const e = S.era(), a = S.age(p);
    let note = '';
    if (!p.school && !p.prison && a >= 5 && a <= 17 && p.edu < 3) {
      const opts = S.eduOptions(p), next = opts[0];
      const left = p.flags.leftSchool && S.W.year - p.flags.leftSchool <= 2;
      const why = next ? next.why : [];
      note = `<div class="panel notice"><div class="eyebrow">${esc(e.id === 'prehistory' ? "The elders' fire" : 'School')} · not enrolled</div>
        <p class="lede" style="margin:6px 0 8px">${left ? 'Your family could no longer pay the fees, so you left. ' : ''}${!next ? 'You have gone as far as schooling goes here.' : why.length ? `You cannot start ${esc(next.n.toLowerCase())} yet: ${esc(why.join(', '))}.` : `You could start ${esc(next.n.toLowerCase())} (${next.yrs} years${next.cost ? `, ${S.money(next.cost)} a year` : ', free'}).`}</p>
        ${next && !why.length ? `<button class="btn era sm" data-act="enroll" data-lvl="${next.lvl}">Enrol now</button>` : ''} <button class="btn sm" data-act="tab" data-tab="job">Occupation & schooling</button></div>`;
    }
    return note + view(p);
  };

  /* ---------- replaying place actions (auto-play) ---------- */
  LATE.push(() => {
    Auto.replay.sceneA = ds => { const p = S.me(); if (!P.available(p).includes(ds.place)) return ''; return P.doPlace(p, ds.place, ds.a); };
    Auto.replay.sceneP = ds => { const p = S.me(); if (!P.available(p).includes(ds.place)) return ''; return P.doPerson(p, ds.place, +ds.o, ds.a); };
  });
})();
