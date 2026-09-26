/* =====================================================================
   HOUSEHOLD — plan every family member's year, share meals and holidays,
   hire help. Available in Household and God modes.
   ===================================================================== */

const House = (() => {
  const S = Sim, W = () => S.W;
  const helpLabel = e => (DATA.PREMODERN.includes(e.id) ? 'a household servant' : ['wars', 'modern', 'digital'].includes(e.id) ? 'a nanny and housekeeper' : 'a robot helper');
  const members = p => [p, ...Places.household(p)];
  const roleOf = (p, o) => (o.id === p.id ? 'You' : S.relLabel(p, o));

  function memberActs(p, o) {
    const a = S.age(o), L = [['study', 'Study time'], ['exercise', 'Exercise'], ['rest', 'Rest and relax']];
    if (o.id !== p.id) L.push(['praise', 'Praise them'], ['discipline', 'Discipline them']);
    if (a < 18 && o.id !== p.id) L.push(['play', 'Play together'], ['chores', 'Give them chores'], ['allowance', 'Give pocket money'], ['tutor', 'Hire a tutor']);
    if (o.id !== p.id && a >= 5 && a < 18 && o.edu < Math.min(2, a >= 12 ? 2 : 1)) L.push(['school', 'Send them to school']);
    if (a >= 16 && !o.job && o.id !== p.id && !o.retired) L.push(['findjob', 'Find them work']);
    if (a >= S.law('marry', S.era(), o.cc) && o.sp == null && o.id !== p.id && o.kids.length === 0 && S.age(o) < 45) L.push(['match', 'Arrange a match']);
    if (o.sick.length) L.push(['healer', `Take them to the ${['prehistory', 'ancient', 'medieval'].includes(S.era().id) ? 'healer' : 'doctor'}`]);
    return L;
  }
  function act(p, oid, k) {
    const o = S.P(oid), e = S.era(); if (!o || !S.alive(o)) return '';
    const key = `hh:${oid}:${k}`; if (p.did[key]) return `${o.first} has done that this year.`; p.did[key] = 1;
    const fx = f => S.applyFx(o, f), close = d => { if (o.id !== p.id) S.rel(p, o).c = U.clamp(S.rel(p, o).c + d); };
    const who = o.id === p.id ? 'You' : o.first;
    switch (k) {
      case 'study': fx({ sm: [2, 4], hp: -1 }); return `${who} studied hard.`;
      case 'exercise': fx({ h: [2, 4], lk: 1, bmi: -0.5 }); return `${who} worked up a sweat.`;
      case 'rest': fx({ hp: 3, mh: 2 }); return `${who} took it easy for a while.`;
      case 'praise': fx({ hp: 3, mh: 2 }); close(5); return `${o.first} beamed.`;
      case 'discipline': fx({ wp: 3, hp: -3 }); close(-4); return `${o.first} sulked, but learned something.`;
      case 'play': fx({ hp: 4 }); close(5); p.hp = U.clamp(p.hp + 2); return `You and ${o.first} played until dinner.`;
      case 'chores': fx({ wp: 2, h: 1 }); close(-1); return `${o.first} grumbled through the chores.`;
      case 'allowance': { const c = S.toVal(e.cost * 0.02); if (p.money < c) return `You need ${S.money(c)}.`; p.money -= c; o.money += c; fx({ hp: 3 }); close(3); return `${o.first} ran off to spend it.`; }
      case 'tutor': { const c = S.toVal(e.cost * 0.1); if (p.money < c) return `A tutor costs ${S.money(c)}.`; p.money -= c; fx({ sm: [4, 8] }); return `The tutor says ${o.first} is making progress.`; }
      case 'school': { const lvl = S.age(o) >= 12 ? 2 : 1, c = S.toVal(e.edu.cost[lvl] * 3); if (p.money < c) return `Schooling costs ${S.money(c)}.`; p.money -= c; o.edu = Math.max(o.edu, lvl); fx({ sm: 4 }); return `${o.first} started at ${e.edu.n[lvl].toLowerCase()}.`; }
      case 'findjob': { S.npcJob(o, e); return o.job ? `${o.first} is now working as ${o.job.t.toLowerCase()}.` : `No work to be found for ${o.first} this year.`; }
      case 'match': {
        const sp = S.mkPerson({ near: o, cc: o.cc, sex: o.sex === 'M' ? 'F' : 'M', born: U.add(W().year, -U.clamp(S.age(o) + U.ri(-4, 4), 16, 60)) });
        if (S.age(sp) >= 16) S.npcJob(sp, e);
        S.marry(o, sp); close(-2);
        return `${o.first} married ${sp.first} ${sp.last}. Whether they are happy remains to be seen.`;
      }
      case 'healer': {
        const med = S.medicine(); let cured = 0;
        for (const s of o.sick.slice()) if (U.chance(med >= s.cure ? 0.85 : Math.max(0.05, 0.6 * med / s.cure - 0.1))) { o.sick.splice(o.sick.indexOf(s), 1); cured++; }
        return cured ? `${o.first} was cured.` : `Nothing could be done for ${o.first}, yet.`;
      }
    }
    return '';
  }
  function houseAct(p, k) {
    const e = S.era(), m = members(p).filter(o => o.id !== p.id);
    if (p.did['house:' + k]) return 'You already did that this year.';
    switch (k) {
      case 'dinner': p.did['house:' + k] = 1; m.forEach(o => { S.rel(p, o).c = U.clamp(S.rel(p, o).c + 4); o.hp = U.clamp(o.hp + 2); }); p.hp = U.clamp(p.hp + 3); return 'A long family dinner. Everyone stayed at the table.';
      case 'holiday': { const c = S.toVal(e.cost * 0.05 * (m.length + 1)); if (p.money < c) return `A family holiday costs ${S.money(c)}.`; p.did['house:' + k] = 1; p.money -= c; [p, ...m].forEach(o => S.applyFx(o, { hp: 6, mh: 3 })); m.forEach(o => { S.rel(p, o).c = U.clamp(S.rel(p, o).c + 6); }); S.log(p, 'You took the whole family on holiday.', 'family'); return 'Sun, arguments in the cart or car, and memories for life.'; }
      case 'help': if (p.flags.help) { p.flags.help = 0; return 'You let the help go.'; } if (p.money < S.toVal(e.cost * 0.3)) return `Hiring ${helpLabel(e)} costs ${S.money(S.toVal(e.cost * 0.3))} a year.`; p.flags.help = 1; return `You hired ${helpLabel(e)}.`;
    }
    return '';
  }
  // yearly upkeep and benefits of hired help
  const post = S.hooks.postYear;
  S.hooks.postYear = (p, e) => {
    post(p, e);
    if (p.flags.help) { p.money -= S.toVal(e.cost * 0.3); members(p).forEach(o => S.applyFx(o, { h: 1, hp: 1 })); }
  };
  return { members, memberActs, act, houseAct, helpLabel, roleOf };
})();

(() => {
  const S = Sim, ui = UI, H = House, { $, esc, bar, plural, toast, sheet, render } = ui;
  ui.views.home = p => {
    const e = S.era(), m = H.members(p);
    const money = m.reduce((s, o) => s + Math.max(0, o.money), 0), income = m.reduce((s, o) => s + (o.job ? o.job.pay : 0), 0);
    return `<div class="panel"><div class="eyebrow">Your household · ${plural(m.length, 'person')}</div>
      <div class="facts"><div class="fact"><div class="eyebrow">Savings</div><div class="v">${S.money(money)}</div></div><div class="fact"><div class="eyebrow">Wages a year</div><div class="v">${S.money(income)}</div></div>
        <div class="fact"><div class="eyebrow">Home</div><div class="v sm">${esc(p.assets.find(a => a.kind === 'home')?.t || (S.age(p) < 18 ? 'Your parents’' : 'Rented'))}</div></div><div class="fact"><div class="eyebrow">Pets</div><div class="v">${S.petsOf(p).length}</div></div></div>
      <div class="btnrow" style="margin-top:12px"><button class="btn sm era" data-act="house" data-a="dinner">Family dinner</button><button class="btn sm" data-act="house" data-a="holiday">Family holiday</button>
        <button class="btn sm" data-act="house" data-a="help">${p.flags.help ? `Dismiss ${H.helpLabel(e)}` : `Hire ${H.helpLabel(e)}`}</button><button class="btn sm" data-act="adopt">Adopt a pet</button></div></div>
      <div class="hhgrid">${m.map(o => `<button class="panel member" data-act="member" data-id="${o.id}">${ui.av(o, 'lg')}<div class="main"><div class="t">${esc(S.fullName(o))}</div><div class="s">${esc(H.roleOf(p, o))} · ${S.age(o)}${o.job ? ' · ' + esc(o.job.t) : o.school ? ' · at school' : ''}</div>
        <div class="minis">${[['Health', o.h], ['Happy', o.hp], ['Smarts', o.sm]].map(([k, v]) => `<div class="stat"><span class="k">${k}</span>${bar(v)}<span class="v">${Math.round(v)}</span></div>`).join('')}</div>
        ${o.sick.length ? `<div class="tags">${o.sick.map(s => `<span class="tag bad">${esc(s.n)}</span>`).join('')}</div>` : ''}</div></button>`).join('')}</div>`;
  };
  function memberSheet(id, res) {
    const p = S.me(), o = S.P(id);
    sheet(`<div class="who">${ui.av(o, 'lg')}<div class="meta"><div class="eyebrow">${esc(H.roleOf(p, o))}</div><h2>${esc(S.fullName(o))}</h2><div class="sub">${S.age(o)} · ${esc(S.className(o))}</div></div></div>
      <div class="stats">${DATA.stats.filter(s => s.k !== 'fe').map(s => `<div class="stat"><span class="k">${s.n}</span>${bar(o[s.k] ?? 0)}<span class="v">${Math.round(o[s.k] ?? 0)}</span></div>`).join('')}</div>
      ${res ? `<div class="result">${esc(res)}</div>` : ''}
      <div class="eyebrow" style="margin-top:12px">Plan ${o.id === p.id ? 'your' : 'their'} year</div>
      <div class="acts" style="margin-top:6px">${H.memberActs(p, o).map(([k, l]) => `<button class="btn" data-act="memberAct" data-id="${id}" data-a="${k}" ${p.did[`hh:${id}:${k}`] ? 'disabled' : ''}>${esc(l)}</button>`).join('')}</div>
      ${o.id !== p.id ? `<button class="btn era block" style="margin-top:10px" data-act="become" data-id="${id}">Take over as ${esc(o.first)}</button>` : ''}`, { label: S.fullName(o) });
  }
  ui.on.member = el => memberSheet(+el.dataset.id);
  ui.on.memberAct = el => { const t = H.act(S.me(), +el.dataset.id, el.dataset.a); ui.open = null; render(); memberSheet(+el.dataset.id, t); };
  ui.on.house = el => { const t = H.houseAct(S.me(), el.dataset.a); render(); toast(t); };
})();
