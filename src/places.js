/* =====================================================================
   PLACES — school, work, prison, town (people nearby) and home as real
   places with persistent rosters. A visit is a day with an hour budget;
   an optional real-time clock lets the hours tick by on their own.
   Logic first (Places), then the Places tab and the day scene.
   ===================================================================== */

const Places = (() => {
  const S = Sim, W = () => S.W;
  const VISITS = 3;
  const role = { classmate: 'Classmate', teacher: 'Teacher', head: 'Headteacher', coworker: 'Coworker', boss: 'Boss', inmate: 'Inmate', guard: 'Guard', stranger: 'Stranger' };
  const coolerLabel = e => ({ ancient: 'Gossip at the well', medieval: 'Gossip at the well', renaissance: 'Linger in the workshop yard', colonial: 'Chat in the counting house', industrial: 'Smoke by the factory gate', wars: 'Chat by the coffee urn', modern: 'Hang out by the water cooler', digital: 'Chat in the break room', near: 'Loiter in the VR lounge', far: 'Drift by the hydroponics bay' }[e.id]);

  function available(p) {
    const a = S.age(p), out = ['home'];
    if (p.prison) return [...out.slice(0, 0), 'prison'];
    if (p.school) out.push('school');
    if (p.job) out.push('work');
    if (a >= 5) out.push('town');
    return out;
  }
  const title = (p, id) => ({ home: 'Home', school: S.era().edu.n[p.school?.lvl || 1], work: p.job ? `Work · ${p.job.t}` : 'Work', prison: 'Prison', town: 'Out and about' }[id]);
  const HOURS = { home: 6, school: 7, work: 8, prison: 8, town: 5 };

  function household(p) {
    const a = S.age(p), m = [];
    if (a < 18) { m.push(...S.parents(p).filter(S.alive)); m.push(...S.siblings(p).filter(o => S.alive(o) && S.age(o) < 21 && o.sp == null)); }
    else {
      const sp = S.spouse(p); if (sp && S.alive(sp)) m.push(sp);
      m.push(...S.kids(p).filter(o => S.alive(o) && (S.age(o) < 18 || (S.age(o) < 25 && o.sp == null))));
      if (p.flags.carer) m.push(...S.parents(p).filter(o => S.alive(o) && S.age(o) >= 70));
    }
    return [...new Set(m)];
  }

  function spawn(p, n, ageFn, o = {}) {
    const y = W().year;
    return Array.from({ length: n }, () => {
      const cc = o.foreign && U.chance(0.15) ? U.pick(S.world.countriesAt().filter(c => c.region !== 'space' || c.id === p.cc)).id : p.cc;
      const q = S.mkPerson({ near: p, cc, born: U.add(y, -ageFn()) });
      q.tmp = 1;      // place regulars are swept away once nobody is attached to them (places2.js)
      return q.id;
    });
  }
  function cleanup(p, ids) {
    for (const id of ids || []) {
      const o = S.P(id);
      if (!o || !o.tmp || p.rels[id] || o.sp != null || o.kids.length || o.played) continue;
      delete W().people[id];
    }
  }
  // Returns [{o, role}] for a place, building the roster the first time
  function roster(p, id) {
    p.places ||= {};
    const a = S.age(p), y = W().year;
    if (id === 'home') return household(p).map(o => ({ o, role: S.relLabel(p, o) }));
    let r = p.places[id], key;
    if (id === 'school') key = `${p.school?.lvl}`;
    if (id === 'work') key = `${p.job?.id}:${p.job?.era}`;
    if (id === 'prison') key = `${p.flags.jailY || y}`;
    if (id === 'town') key = `${y}`;
    if (!r || r.key !== key) {
      if (id === 'town' && r) cleanup(p, r.ids);
      if (id === 'school') r = { key, ids: spawn(p, 8, () => U.clamp(a + U.ri(-1, 1), 4, 90)), staff: spawn(p, 2, () => U.ri(26, 62)), head: spawn(p, 1, () => U.ri(42, 66)) };
      if (id === 'work') r = { key, ids: spawn(p, 5, () => U.clamp(a + U.ri(-10, 12), 16, 80)), staff: [], head: spawn(p, 1, () => U.clamp(a + U.ri(5, 25), 25, 80)) };
      if (id === 'prison') r = { key, ids: spawn(p, 5, () => U.ri(18, 60)), staff: [], head: spawn(p, 1, () => U.ri(25, 55)) };
      if (id === 'town') r = { key, ids: spawn(p, 6, () => U.ri(Math.max(5, a - 25), Math.min(90, a + 30)), { tmp: 1, foreign: 1 }), staff: [], head: [] };
      p.places[id] = r;
    }
    const kind = { school: ['classmate', 'teacher', 'head'], work: ['coworker', null, 'boss'], prison: ['inmate', null, 'guard'], town: ['stranger', null, null] }[id];
    return [...r.head.map(i => [i, kind[2]]), ...r.staff.map(i => [i, kind[1]]), ...r.ids.map(i => [i, kind[0]])]
      .map(([i, k]) => ({ o: S.P(i), k })).filter(x => x.o && S.alive(x.o)).map(x => ({ o: x.o, k: x.k, role: role[x.k] }));
  }

  /* ---------- place actions ---------- */
  function placeActs(p, id) {
    const e = S.era(), a = S.age(p);
    const L = {
      home: [['dinner', 'Share a family meal', 1], ['chores', 'Do the chores', 1], ['read', 'Read by the fire', 1], ['nap', 'Take a nap', 1], ['argue', 'Pick a quarrel', 1]],
      school: [['attend', 'Pay attention in class', 1], ['library', 'Study in the library', 2], ['recess', 'Play at break time', 1], ['skip', 'Skip class', 2], ['cheat', 'Cheat on a test', 1], ['alone', 'Sit alone and daydream', 1], ...(p.school?.club ? [] : [['club', 'Join a club', 1]])],
      work: [['grind', 'Put your head down', 1], ['project', 'Volunteer for a big project', 2], ['cooler', coolerLabel(e), 1], ['lunch', 'Take a long lunch', 1], ['early', 'Slip out early', 2]],
      prison: [['lift', 'Lift weights', 1], ['books', 'Read in the prison library', 1], ['laundry', 'Work in the laundry', 2], ['lowkey', 'Keep your head down', 1], ['gang', 'Join a gang', 1], ['escape', 'Plan an escape', 3]],
      town: [['stroll', 'Stroll around', 1], ['busk', a >= 10 ? 'Perform for coins' : 'Sing in the street', 1], ['watch', 'People-watch', 1], ['shop', 'Browse the shops and stalls', 1], ['shrine', 'Visit a quiet holy place', 1]],
    }[id] || [];
    return L.filter(([k]) => !(k === 'gang' && p.flags.gang));
  }
  function doPlace(p, id, act) {
    const e = S.era(), sc = p.school, fx = f => S.applyFx(p, f);
    const members = () => roster(p, 'home').map(x => x.o);
    switch (act) {
      case 'dinner': members().forEach(o => { S.rel(p, o).c = U.clamp(S.rel(p, o).c + 4); }); fx({ hp: 2 }); return 'Everyone talked over each other. It was lovely.';
      case 'chores': fx({ wp: 1, h: 1 }); S.parents(p).filter(S.alive).forEach(o => { S.rel(p, o).c = U.clamp(S.rel(p, o).c + 2); }); return 'Floors swept, pots scrubbed, family pleased.';
      case 'read': fx({ sm: 1, im: 1 }); return 'You lost track of time in a good book.';
      case 'nap': fx({ h: 1, hp: 1 }); return 'Bliss.';
      case 'argue': { const m = members(); if (!m.length) return 'There is nobody home to quarrel with.'; const o = U.pick(m); S.rel(p, o).c = U.clamp(S.rel(p, o).c - 8); fx({ hp: -2 }); return `You and ${o.first} shouted until the neighbours knocked.`; }
      case 'attend': sc.gr = U.clamp((sc.gr ?? 60) + 4); fx({ sm: 1 }); return 'You actually listened. It stuck.';
      case 'library': sc.gr = U.clamp((sc.gr ?? 60) + 6); fx({ sm: 2, hp: -1 }); return 'Two hours with your books. Your marks will thank you.';
      case 'recess': fx({ hp: 3 }); return 'You ran around until the bell.';
      case 'skip': sc.gr = U.clamp((sc.gr ?? 60) - 6); fx({ hp: 3 }); if (U.chance(0.25)) { fx({ rep: -2 }); return 'You skipped class and got caught.'; } return 'Freedom! You were not missed. Probably.';
      case 'cheat': if (U.chance(0.55 + (p.sm - 50) / 200)) { sc.gr = U.clamp((sc.gr ?? 60) + 10); fx({ wp: -1 }); return 'You copied the answers and nobody noticed.'; } sc.gr = U.clamp((sc.gr ?? 60) - 15); fx({ rep: -5 }); return 'Caught cheating. Your parents have been told.';
      case 'alone': fx({ im: 2, mh: -1 }); return 'You stared out of the window and dreamed up other worlds.';
      case 'club': { const c = U.pick(DATA.clubs[e.id]); sc.club = c; fx({ hp: 3 }); return `You joined: ${c}.`; }
      case 'grind': p.job.perf = U.clamp(p.job.perf + 5); fx({ hp: -1 }); return 'Nose to the grindstone.';
      case 'project': if (U.chance(0.45 + p.sm / 250 + (p.wp ?? 50) / 400)) { p.job.perf = U.clamp(p.job.perf + 12); fx({ rep: 2 }); return 'The project was a triumph, with your name on it.'; } p.job.perf = U.clamp(p.job.perf - 6); return 'The project went sideways.';
      case 'cooler': { const r = roster(p, 'work').filter(x => x.k === 'coworker'); if (r.length) { const o = U.pick(r).o; knowAs(p, o, 'coworker', 6); } fx({ hp: 2 }); return 'You caught up on all the gossip.'; }
      case 'lunch': p.job.perf = U.clamp(p.job.perf - 3); fx({ hp: 3 }); return 'A long, lazy lunch.';
      case 'early': p.job.perf = U.clamp(p.job.perf - 4); fx({ hp: 4 }); return 'You slipped out. Nobody said anything. Yet.';
      case 'lift': fx({ h: 2, wp: 1 }); return 'You got stronger. People noticed.';
      case 'books': fx({ sm: 2 }); return 'You read everything the library had, twice.';
      case 'laundry': p.money += S.toVal(e.cost * 0.01); return 'Steam, soap and a few coins.';
      case 'lowkey': fx({ mh: 1 }); return 'Another day survived.';
      case 'gang': p.flags.gang = 1; fx({ rep: -5 }); return 'You have people watching your back now. And debts to them.';
      case 'escape':
        if (U.chance(0.15 + (p.wp ?? 50) / 500)) { p.prison = 0; p.flags.fugitive = 1; fx({ rep: -10, hp: 10 }); S.log(p, 'You escaped from prison!', 'bad'); return 'Over the wall and into the night. You are free, and hunted.'; }
        p.prison += 2; fx({ h: -8 }); S.log(p, 'Your escape attempt failed. Two more years.', 'bad'); return 'Caught in the yard. Two more years.';
      case 'stroll': { if (U.chance(0.4)) { const id2 = spawn(p, 1, () => U.ri(10, 70), { tmp: 1, foreign: 1 })[0]; p.places.town.ids.push(id2); return `You bumped into ${S.P(id2).first}, who seems to want to talk.`; } fx({ hp: 2 }); return U.pick(['The streets were busy and bright.', 'You found a lane you had never noticed.', 'A street seller gave you a free sample.']); }
      case 'busk': { const im = p.im ?? 50; if (U.chance(im / 110)) { const g = S.toVal(e.cost * U.rand(0.005, 0.03)); p.money += g; fx({ fm: 1, hp: 3 }); return `A crowd gathered. You earned ${S.money(g)}.`; } fx({ hp: -2 }); return 'People walked past without looking.'; }
      case 'watch': fx({ im: 2 }); return 'You invented life stories for everyone who passed.';
      case 'shop': { const c = S.toVal(e.cost * 0.01); if (p.money < c) return 'You looked, but could not afford anything.'; p.money -= c; fx({ hp: 3 }); return 'You bought something small and pleasing.'; }
      case 'shrine': fx({ mh: 3 }); return 'A quiet hour. Your mind settled.';
    }
    return '';
  }

  /* ---------- people actions ---------- */
  function knowAs(p, o, k, dc = 0) {
    const r = p.rels[o.id];
    if (!r) p.rels[o.id] = { k: k || 'friend', c: U.clamp(35 + dc) };
    else r.c = U.clamp(r.c + dc);
    o.rels[p.id] ||= { k: k || 'friend', c: 35 };
    return p.rels[o.id];
  }
  function personActs(p, id, x) {
    const a = S.age(p), oa = S.age(x.o), fam = id === 'home';
    const L = [['talk', 'Talk'], ['joke', 'Tell a joke'], ['compliment', 'Compliment them']];
    if (!fam && (!p.rels[x.o.id] || p.rels[x.o.id].k !== 'friend')) L.push(['befriend', 'Offer friendship']);
    if (x.k === 'classmate') L.push(['study', 'Study together']);
    if (x.k === 'teacher' || x.k === 'head') L.push(['askhelp', 'Ask for extra help']);
    if (x.k === 'coworker') L.push(['gossip', 'Gossip together']);
    if (x.k === 'boss') L.push(['impress', 'Try to impress them']);
    if (x.k === 'guard') L.push(['bribe', 'Slip them a bribe']);
    if (!fam && a >= 16 && oa >= 16 && Math.abs(a - oa) <= 15 && p.sp == null) L.push(['flirt', 'Flirt']);
    if (x.k === 'stranger') L.push(['help', 'Offer to help them'], ['pickpocket', 'Pick their pocket']);
    L.push(['insult', 'Insult them'], ['fight', 'Pick a fight']);
    return L;
  }
  function doPerson(p, id, oid, act) {
    const e = S.era(), rs = roster(p, id), x = rs.find(r => r.o.id === oid); if (!x) return '';
    const o = x.o, k = { classmate: 'classmate', teacher: 'teacher', head: 'teacher', coworker: 'coworker', boss: 'boss', inmate: 'inmate', guard: 'guard', stranger: 'friend' }[x.k] || 'fam';
    const r = knowAs(p, o, k), fx = f => S.applyFx(p, f), sc = p.school;
    switch (act) {
      case 'talk': r.c = U.clamp(r.c + U.ri(3, 8)); fx({ hp: 1 }); return `You and ${o.first} talked. ${U.pick(['They told you about their family.', 'You found you both like the same things.', 'Mostly small talk, but pleasant.'])}`;
      case 'joke': if (U.chance(0.35 + (p.im ?? 50) / 200)) { r.c = U.clamp(r.c + 10); return `${o.first} laughed until they cried.`; } r.c = U.clamp(r.c - 3); return `${o.first} did not get it.`;
      case 'compliment': r.c = U.clamp(r.c + 5); o.hp = U.clamp(o.hp + 3); return `${o.first} blushed.`;
      case 'befriend': if (r.c >= 40 || U.chance(0.3)) { if (r.k !== 'fam') r.k = 'friend'; o.rels[p.id].k = 'friend'; r.c = U.clamp(r.c + 5); S.log(p, `You became friends with ${o.first} ${o.last}.`, 'life'); return `${o.first} is your friend now.`; } r.c = U.clamp(r.c + 3); return `${o.first} is not sure about you yet.`;
      case 'study': sc && (sc.gr = U.clamp((sc.gr ?? 60) + 3)); fx({ sm: 1 }); r.c = U.clamp(r.c + 5); return `You and ${o.first} quizzed each other.`;
      case 'askhelp': sc && (sc.gr = U.clamp((sc.gr ?? 60) + 5)); fx({ sm: 2 }); r.c = U.clamp(r.c + 4); return `${o.first} explained it until it clicked.`;
      case 'gossip': r.c = U.clamp(r.c + 6); if (U.chance(0.15)) { fx({ rep: -2 }); return 'Your gossip got back to the person you gossiped about.'; } return `You and ${o.first} traded the juiciest stories.`;
      case 'impress': if (U.chance(0.3 + p.sm / 250 + p.lk / 400)) { p.job.perf = U.clamp(p.job.perf + 8); r.c = U.clamp(r.c + 8); return `${o.first} was impressed.`; } r.c = U.clamp(r.c - 3); return `${o.first} looked straight through you.`;
      case 'bribe': { const c = S.toVal(e.cost * 0.05); if (p.money < c) return `A guard like ${o.first} expects at least ${S.money(c)}.`; p.money -= c; r.c = U.clamp(r.c + 15); if (U.chance(0.25) && p.prison > 1) { p.prison--; return 'The paperwork went missing. A year off your sentence.'; } return `${o.first} will look the other way, sometimes.`; }
      case 'flirt': {
        const pref = p.orient === 'bi' || (p.orient === 'gay' ? o.sex === p.sex : o.sex !== p.sex);
        if (pref && U.chance(0.25 + p.lk / 250 + r.c / 300)) { r.k = 'lover'; o.rels[p.id].k = 'lover'; S.log(p, `You started seeing ${o.first} ${o.last}.`, 'love'); return `${o.first} said yes. You are seeing each other now.`; }
        r.c = U.clamp(r.c - 8); return `${o.first} was not interested.`;
      }
      case 'help': fx({ rep: 1, mh: 1 }); r.c = U.clamp(r.c + 8); return `You helped ${o.first} with their load. They were grateful.`;
      case 'pickpocket': if (U.chance(0.45 + p.sm / 300)) { const g = S.toVal(e.cost * U.rand(0.005, 0.05)); p.money += g; return `You lifted ${S.money(g)} from ${o.first}.`; } if (U.chance(0.5)) return S.hooks.arrest ? S.hooks.arrest(p, { crime: 'pickpocket', yrs: 1, sev: 1 }) : (S.jail(p, 1), 'Caught red-handed. A year in jail.'); r.c = 0; return `${o.first} felt your hand and shouted.`;
      case 'insult': r.c = U.clamp(r.c - 15); fx({ rep: -1 }); if (x.k !== 'stranger' && r.k !== 'fam' && r.c < 15) r.k = 'enemy'; return `${o.first} will not forget that.`;
      case 'fight': {
        const win = U.chance(0.35 + (p.h - o.h) / 200 + ((p.wp ?? 50) - 50) / 300 + S.hadd('odds', p, { tag: 'fight' }));
        if (sc && id === 'school') sc.gr = U.clamp((sc.gr ?? 60) - 5);
        if (win) { fx({ rep: id === 'prison' ? 5 : 1, hp: 2 }); o.h = U.clamp(o.h - 10); r.c = U.clamp(r.c - 10); return `You beat ${o.first} in a fight.`; }
        fx({ h: -10, hp: -3 }); r.c = U.clamp(r.c - 10); return `${o.first} beat you badly.`;
      }
    }
    return '';
  }

  /* ---------- yearly: grades, exams, honours ---------- */
  const pre = S.hooks.preYear, post = S.hooks.postYear;
  S.hooks.preYear = (p, e) => { pre(p, e); if (p.school) { p.school.gr ??= 60; if (p.school.left === 1) p.flags.gradGr = p.school.gr; } if (p.prison && !p.flags.jailY) p.flags.jailY = W().year; if (!p.prison) delete p.flags.jailY; };
  S.hooks.postYear = (p, e) => {
    post(p, e);
    const sc = p.school;
    if (sc) {
      sc.gr = U.clamp((sc.gr ?? 60) + (p.sm * 0.5 + (p.wp ?? 50) * 0.3 + 10 - (sc.gr ?? 60)) * 0.25 + U.ri(-4, 4));
      if (sc.club) S.applyFx(p, { hp: 2, im: 1 });
      if (S.age(p) >= 8 && U.chance(0.3)) S.prompt({ title: 'Exam week', text: `Exams at ${S.era().edu.n[sc.lvl].toLowerCase()}. Your marks so far: ${Math.round(sc.gr)}.`, choices: [
        { l: 'Study all night', go: () => { sc.gr = U.clamp(sc.gr + 8); S.applyFx(p, { h: -2, sm: 1 }); return 'Bleary-eyed but ready. You did well.'; } },
        { l: 'Cheat', go: () => { if (U.chance(0.6)) { sc.gr = U.clamp(sc.gr + 12); return 'Nobody noticed.'; } sc.gr = U.clamp(sc.gr - 15); S.applyFx(p, { rep: -5 }); S.log(p, 'You were caught cheating in an exam.', 'bad'); return 'Caught. Zero marks and a letter home.'; } },
        { l: 'Wing it', go: () => { const d = Math.round((p.sm - 55) / 5) + U.ri(-5, 5); sc.gr = U.clamp(sc.gr + d); return d >= 0 ? 'Better than expected!' : 'That went badly.'; } }] });
    }
    if (p.flags.gradGr != null && !sc) {
      const g = p.flags.gradGr; delete p.flags.gradGr;
      if (g >= 85) { S.applyFx(p, { rep: 5, sm: 3, hp: 5 }); S.log(p, 'You graduated with honours!', 'good'); }
      else if (g < 35) { S.applyFx(p, { hp: -3 }); S.log(p, 'You scraped through with poor marks.', 'bad'); }
    }
  };

  return { available, title, HOURS, VISITS, roster, placeActs, doPlace, personActs, doPerson, household, knowAs, cleanup };
})();

/* ---------------- Places tab and the day scene ---------------- */
(() => {
  const S = Sim, ui = UI, P = Places, { $, esc, bar, toast, sheet, render } = ui;
  const DESC = { home: 'Family, chores and quiet hours.', school: 'Classes, classmates, teachers and clubs.', work: 'Coworkers, the boss and your performance.', prison: 'Inmates, guards and a long wait.', town: 'The streets, and the people nearby.' };
  const AMB = { home: ['The kettle whistled.', 'Somebody laughed in the next room.', 'Rain tapped on the window.'], school: ['The bell rang.', 'Someone passed a note across the room.', 'The teacher droned on about dates.'], work: ['The clock crawled.', 'Someone burned something in the kitchen.', 'A deadline loomed.'], prison: ['A guard rattled the bars.', 'Someone shouted in the next block.', 'The yard went quiet.'], town: ['A cart rattled past.', 'Street sellers called out their wares.', 'Pigeons scattered.'] };
  let sc = null;

  ui.views.places = p => {
    const avail = P.available(p);
    const town = avail.includes('town') ? P.roster(p, 'town') : [];
    return `<p class="lede" style="margin:2px 2px 10px">Where your days are spent. Each place can take up to ${P.VISITS} days of your year; a day is a handful of hours to spend on people and things.</p>
      <div class="placegrid">${avail.map(id => { const used = p.did['visit:' + id] || 0; return `<div class="panel place"><div class="eyebrow">${esc(P.title(p, id))}</div><p class="lede">${esc(DESC[id] || P.desc?.(p, id) || '')}</p>
        <div class="faces">${P.roster(p, id).slice(0, 7).map(x => ui.av(x.o, 'sm')).join('')}</div>
        <button class="btn ${used < P.VISITS ? 'era' : ''} sm" data-act="visit" data-id="${id}" ${used >= P.VISITS ? 'disabled' : ''}>${used >= P.VISITS ? 'No days left this year' : `Spend a day here · ${P.VISITS - used} left`}</button></div>`; }).join('')}</div>
      ${town.length ? `<div class="sec-h"><h3>People nearby</h3><span class="faint">new faces every year</span></div><div class="list">${town.map(x => `<button class="row" data-act="visitPerson" data-id="town" data-o="${x.o.id}">${ui.av(x.o, 'sm')}<div class="main"><div class="t">${esc(S.fullName(x.o))}</div><div class="s">${S.age(x.o)} · ${esc(x.o.job?.t || (S.age(x.o) < 16 ? 'child' : 'no work'))}${x.o.cc !== p.cc ? ` · from ${esc(S.world.C(x.o.cc).short)}` : ''}</div></div>${p.rels[x.o.id] ? `<div class="end"><div class="mini">${bar(p.rels[x.o.id].c, 'era')}</div></div>` : ''}</button>`).join('')}</div>` : ''}`;
  };

  function startDay(id, focus) {
    const p = S.me();
    if ((p.did['visit:' + id] || 0) >= P.VISITS) return toast('No days left there this year.');
    p.did['visit:' + id] = (p.did['visit:' + id] || 0) + 1;
    sc = { id, hours: P.HOURS[id], max: P.HOURS[id], feed: [], rt: false, sel: focus || null, timer: null };
    draw();
  }
  function stopClock() { if (sc?.timer) { clearInterval(sc.timer); sc.timer = null; } }
  function endDay(msg) {
    stopClock();
    const p = S.me();
    S.settle();
    if (sc && sc.feed.length) S.log(p, `A day at ${P.title(p, sc.id).toLowerCase()}: ${sc.feed.slice(-3).reverse().join(' ')}`, 'act');
    sc = null; ui.open = null; $('#modal').innerHTML = ''; render(); toast(msg || 'The day is over.');
  }
  function spend(h, text) {
    sc.hours -= h; sc.feed.push(text);
    if (sc.hours <= 0) return endDay(`${text} The day is over.`);
    draw();
  }
  function draw() {
    const p = S.me(); if (!sc) return;
    if (!S.alive(p) || S.W.dead) return endDay();
    const people = P.roster(p, sc.id), hour = 8 + sc.max - sc.hours;
    const sel = people.find(x => x.o.id === sc.sel);
    ui.open = null;
    sheet(`<div class="scenehead"><div><div class="eyebrow">${esc(P.title(p, sc.id))}</div><h2>${String(hour).padStart(2, '0')}:00</h2><div class="faint">${sc.hours} of ${sc.max} hours left</div></div>
        <button class="btn sm ${sc.rt ? 'era' : ''}" data-act="rt" aria-pressed="${sc.rt}">${sc.rt ? 'Pause clock' : 'Real-time clock'}</button></div>
      <div class="hours" aria-hidden="true">${Array.from({ length: sc.max }, (_, i) => `<i class="${i < sc.max - sc.hours ? 'gone' : ''}"></i>`).join('')}</div>
      <div class="eyebrow" style="margin-top:12px">People here</div>
      <div class="faces big">${people.map(x => `<button class="face ${sc.sel === x.o.id ? 'on' : ''}" data-act="scenePick" data-o="${x.o.id}">${ui.av(x.o, 'sm')}<span>${esc(x.o.first)}</span><small>${esc(x.role)}</small></button>`).join('') || '<p class="muted">Nobody else is here.</p>'}</div>
      ${sel ? `<div class="panel pick"><div class="t">${esc(S.fullName(sel.o))} · ${esc(sel.role)} · ${S.age(sel.o)}${p.rels[sel.o.id] ? ` · closeness ${Math.round(p.rels[sel.o.id].c)}` : ''} <button class="linkbtn" data-act="sceneProfile" data-o="${sel.o.id}">Profile</button></div>
        <div class="s faint" style="font-size:12.5px">${esc([sel.o.job?.t, S.className(sel.o), sel.o.pers ? `${sel.o.pers.type} · ${sel.o.pers.tr.map(t => S.pers.T(t)?.n).filter(Boolean).join(', ')}` : ''].filter(Boolean).join(' · '))}</div>
        <div class="btnrow" style="margin-top:8px">${P.personActs(p, sc.id, sel).map(([k, l]) => `<button class="btn sm" data-act="sceneP" data-a="${k}" data-place="${sc.id}" data-o="${sel.o.id}" data-label="${esc(l)} (${esc(sel.o.first)})">${esc(l)}</button>`).join('')}</div></div>` : ''}
      <div class="eyebrow" style="margin-top:12px">Things to do</div>
      <div class="btnrow" style="margin-top:6px">${P.placeActs(p, sc.id).map(([k, l, h]) => `<button class="btn sm" data-act="sceneA" data-a="${k}" data-place="${sc.id}" data-label="${esc(l)} (${esc(P.title(p, sc.id))})" ${h > sc.hours ? 'disabled' : ''}>${esc(l)}${h > 1 ? ` · ${h}h` : ''}</button>`).join('')}</div>
      ${sc.id === 'school' && p.school ? `<p class="faint" style="font-size:13px;margin:10px 0 0">Your marks: <b class="mono">${Math.round(p.school.gr ?? 60)}</b>${p.school.club ? ` · Club: ${esc(p.school.club)}` : ''}</p>` : ''}
      ${sc.id === 'work' && p.job ? `<p class="faint" style="font-size:13px;margin:10px 0 0">Performance: <b class="mono">${Math.round(p.job.perf)}</b></p>` : ''}
      <div class="feed">${sc.feed.slice().reverse().slice(0, 6).map(t => `<p>${esc(t)}</p>`).join('')}</div>
      <button class="btn block" style="margin-top:12px" data-act="endDay">Go home</button>`, { locked: true, label: 'A day out' });
  }
  ui.on.visit = el => startDay(el.dataset.id);
  ui.on.visitPerson = el => startDay(el.dataset.id, +el.dataset.o);
  ui.on.scenePick = el => { sc.sel = +el.dataset.o === sc.sel ? null : +el.dataset.o; draw(); };
  ui.on.sceneP = el => { const t = P.doPerson(S.me(), sc.id, sc.sel, el.dataset.a); spend(1, t); };
  ui.on.sceneA = el => { const [, , h] = P.placeActs(S.me(), sc.id).find(x => x[0] === el.dataset.a); const t = P.doPlace(S.me(), sc.id, el.dataset.a); spend(h, t); };
  ui.on.endDay = () => endDay('You headed home.');
  ui.on.sceneProfile = el => { ui.returnTo = () => { if (sc) draw(); }; ui.open = null; ui.profile(+el.dataset.o); };
  ui.sceneOpen = () => !!sc;
  ui.on.rt = () => {
    sc.rt = !sc.rt;
    if (sc.rt) sc.timer = setInterval(() => { if (!sc) return; if (!document.querySelector('.scenehead')) return stopClock(); spend(1, U.pick(AMB[sc.id] || P.amb?.(sc.id) || ['Time passes.'])); }, 4000);
    else stopClock();
    draw();
  };
})();
