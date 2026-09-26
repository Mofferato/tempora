/* =====================================================================
   INTRODUCTIONS: parents bring their children together with people they know.
   * From your child's profile: "Introduce Ann to someone…" lists the people
     you know, and the children of your friends, around her age first.
   * From anyone else's profile: "Introduce them to your child…".
   * From the Relationships tab: "Introduce your children…".
   How it goes depends on their ages, their personalities, and how much the
   other person likes you. Children and teens of an age may become friends,
   or rivals. A grown-up can take a child under their wing as a mentor. Two
   single adults may start courting, the way families arranged matches for
   most of history, and people who are courting marry each other (engine.js).
   Three introductions a year; each child meets each person once.
   ===================================================================== */

const Intro = (() => {
  const S = Sim;
  const PER_YEAR = 3;
  const FAMILY = /Father|Mother|Brother|Sister|Son|Daughter|Grand|Uncle|Aunt|Cousin|Nephew|Niece|Husband|Wife|in-law/;
  const has = (o, t) => !!S.pers?.has(o, t);

  // Your living children old enough to make friends
  const children = p => S.kids(p).filter(k => S.alive(k) && S.age(k) >= 3);
  const isChild = (p, o) => p.kids.includes(o.id);
  const met = (c, o) => { const r = c.rels[o.id]; return (r && r.k !== 'fam') || FAMILY.test(S.relLabel(c, o)); };

  // Who you could introduce child c to: people you know and the children of your friends, who are not c's family and have not met c
  function candidates(p, c) {
    const seen = new Set([p.id, c.id]), out = [];
    const add = (o, via) => { if (!o || seen.has(o.id) || !S.alive(o) || S.age(o) < 3 || met(c, o)) return; seen.add(o.id); out.push({ o, via }); };
    const known = S.known(p).filter(S.alive);
    for (const o of known) if (!FAMILY.test(S.relLabel(p, o))) add(o, S.relLabel(p, o));
    for (const o of known) if (!FAMILY.test(S.relLabel(p, o))) for (const k of S.kids(o)) add(k, `${o.first}'s ${k.sex === 'M' ? 'son' : 'daughter'}`);
    const ac = S.age(c), gap = x => Math.abs(S.age(x.o) - ac);
    // people around their age first, then those you are closest to
    return out.sort((x, y) => (gap(x) <= 5 ? 0 : 1) - (gap(y) <= 5 ? 0 : 1) || (p.rels[y.o.id]?.c ?? 40) - (p.rels[x.o.id]?.c ?? 40)).slice(0, 40);
  }

  // A rough forecast for the picker, from their personalities
  function forecast(c, o) {
    const k = S.pers ? S.pers.compat(c, o) : 0;
    return k > 0.25 ? 'likely to get on' : k > 0 ? 'might get on' : k > -0.25 ? 'hard to say' : 'unlikely to get on';
  }

  const courtAge = (x, e) => Math.max(16, S.law('marry', e, x.cc));
  const attracted = (a, b) => (a.orient === 'bi' ? true : a.orient === 'gay' ? a.sex === b.sex : a.sex !== b.sex);
  function canCourt(c, o, e) {
    return S.age(c) >= courtAge(c, e) && S.age(o) >= courtAge(o, e) && c.sp == null && o.sp == null && Math.abs(S.age(c) - S.age(o)) <= 12
      && attracted(c, o) && attracted(o, c) && (c.sex !== o.sex || S.sameSexOK(e, c.cc));
  }

  function introduce(cid, oid) {
    const p = S.me(), c = S.P(cid), o = S.P(oid), e = S.era();
    if (!c || !o || !S.alive(p) || !S.alive(c) || !S.alive(o)) return 'They are gone.';
    if (!isChild(p, c)) return `${c.first} is not your child.`;
    if (c.id === o.id || o.id === p.id) return '';
    if (S.age(c) < 3) return `${c.first} is too young to make friends yet.`;
    if (met(c, o)) return `${c.first} and ${o.first} already know each other.`;
    if ((p.did.intro || 0) >= PER_YEAR) return `You have made ${PER_YEAR} introductions this year. Try again next year.`;
    p.did.intro = (p.did.intro || 0) + 1;

    const ac = S.age(c), ao = S.age(o), rc = S.rel(p, c);
    const peers = Math.abs(ac - ao) <= 5 || (ac >= 18 && ao >= 18 && Math.abs(ac - ao) <= 12);
    const mentor = !peers && ao >= 18 && ac < ao;
    // how it goes: personalities, how much they like you, and a little luck
    const like = ((p.rels[o.id]?.c ?? 45) - 50) / 250;
    const score = 0.5 + (S.pers ? S.pers.compat(c, o) : 0) * 0.6 + like
      + (has(c, 'shy') ? -0.12 : 0) + (has(c, 'charming') || has(c, 'gregarious') ? 0.1 : 0) + (has(o, 'kind') ? 0.06 : 0) + (has(o, 'cruel') ? -0.1 : 0)
      + U.rand(-0.22, 0.22);
    const set = (k, lo, hi, k2 = k) => { c.rels[o.id] = { k, c: U.ri(lo, hi) }; o.rels[c.id] = { k: k2, c: U.clamp(c.rels[o.id].c + U.ri(-6, 6)) }; };
    const who = `your ${c.sex === 'M' ? 'son' : 'daughter'} ${c.first}`, them = o.first;
    let t, mine, mood = 0, good = true;   // t: your log, mine: how it went, in your child's own log

    if (canCourt(c, o, e) && score > 0.5 && U.chance(0.3 + (DATA.PREMODERN.includes(e.id) ? 0.2 : 0) + (score - 0.5))) {
      set('lover', 55, 72); mood = 6;
      t = DATA.PREMODERN.includes(e.id) ? `You introduced ${who} to ${them}. Both families agreed it was a good match, and they are courting.` : `You introduced ${who} to ${them}. Sparks flew, and they have started seeing each other.`;
      mine = DATA.PREMODERN.includes(e.id) ? 'Both families agreed it was a good match, and you are courting.' : 'Sparks flew, and you started seeing each other.';
    } else if (mentor && score > 0.45) {
      set('mentor', 50, 70, 'protege'); mood = 3;
      const learn = o.sm >= 55 || o.job ? U.ri(1, 3) : 1; c.sm = U.clamp(c.sm + learn);
      t = `You introduced ${who} to ${them}${o.job ? `, the ${o.job.t.toLowerCase()}` : ''}. ${them} took ${c.first} under their wing.`;
      mine = `${them} took you under their wing, and you learned a great deal.`;
    } else if (score > 0.55) {
      set('friend', 55, 78); mood = 4;
      const how = U.pick(['hit it off at once', 'talked for hours', 'were soon inseparable', 'became fast friends']);
      t = `You introduced ${who} to ${them}. They ${how}.`; mine = `You ${how}.`;
    } else if (score > 0.3) {
      set('acq', 35, 50); mood = 1;
      t = `You introduced ${who} to ${them}. They were polite, and now they know each other.`; mine = 'You were polite to each other.';
    } else if (score < 0.12 && ac >= 6 && ao >= 6) {
      set('enemy', 8, 22); mood = -4; good = false;
      t = `You introduced ${who} to ${them}. They could not stand each other.`; mine = 'You could not stand each other.';
    } else {
      set('acq', 20, 35); mood = -1; good = false;
      t = `You introduced ${who} to ${them}. It was awkward, and they had little to say to each other.`; mine = 'It was awkward, and you had little to say to each other.';
    }
    c.hp = U.clamp(c.hp + mood);
    // your child's feelings about it, and the other person's about being included
    if (ac >= 13 && ac <= 19 && (!good || U.chance(0.25))) { rc.c = U.clamp(rc.c - 3); t += ` ${c.first} found the whole thing embarrassing.`; }
    else if (good) rc.c = U.clamp(rc.c + U.ri(1, 3));
    if (good && p.rels[o.id]) p.rels[o.id].c = U.clamp(p.rels[o.id].c + U.ri(1, 3));
    S.pers?.nudge(p, 'gregarious', 0.3);
    S.log(p, t, 'family');
    S.log(c, `Your ${S.relLabel(c, p).toLowerCase()} introduced you to ${S.fullName(o)}. ${mine}`, 'life');
    return t;
  }

  return { PER_YEAR, children, candidates, forecast, introduce, met, isChild };
})();

/* ---------------- the introductions UI ---------------- */
(() => {
  const S = Sim, ui = UI, I = Intro, { esc, sheet, toast, render } = ui;
  const left = p => I.PER_YEAR - (p.did.intro || 0);
  const leftNote = p => `<p class="faint" style="font-size:12.5px;margin:6px 0 0">${left(p) > 0 ? `${left(p)} introduction${left(p) === 1 ? '' : 's'} left this year.` : 'No introductions left this year.'}</p>`;

  // Pick someone for child c to meet
  function pickFor(cid, res) {
    const p = S.me(), c = S.P(cid); if (!c) return;
    const list = I.candidates(p, c), ac = S.age(c);
    const peers = list.filter(x => Math.abs(S.age(x.o) - ac) <= 5), others = list.filter(x => Math.abs(S.age(x.o) - ac) > 5);
    const row = x => `<button class="row" data-act="introDo" data-c="${c.id}" data-o="${x.o.id}" ${left(p) > 0 ? '' : 'disabled'}>${ui.av(x.o, 'sm')}<div class="main"><div class="t">${esc(S.fullName(x.o))}</div><div class="s">${S.age(x.o)} · ${esc(x.via)}${x.o.job ? ` · ${esc(x.o.job.t)}` : ''} · ${esc(I.forecast(c, x.o))}</div></div></button>`;
    ui.open = null;
    sheet(`<div class="eyebrow">Introductions</div><h2>Who should ${esc(c.first)} meet?</h2>
      <p class="lede">People you know and your friends' children. ${esc(c.first)} is ${ac}.</p>${leftNote(p)}
      ${res ? `<div class="result" role="status">${esc(res)}</div>` : ''}
      ${peers.length ? `<div class="eyebrow" style="margin-top:12px">Around ${esc(c.first)}'s age</div><div class="list" style="margin-top:6px">${peers.map(row).join('')}</div>` : ''}
      ${others.length ? `<div class="eyebrow" style="margin-top:12px">${ac < 18 ? 'Grown-ups who could guide them' : 'Others you know'}</div><div class="list" style="margin-top:6px">${others.map(row).join('')}</div>` : ''}
      ${list.length ? '' : `<p class="muted">${esc(c.first)} already knows everyone you know.</p>`}
      <button class="btn block" style="margin-top:12px" data-act="profile" data-id="${c.id}">Back to ${esc(c.first)}</button>`, { label: 'Introductions' });
  }
  // Pick which of your children should meet person o
  function pickChild(oid, res) {
    const p = S.me(), o = S.P(oid); if (!o) return;
    const kids = I.children(p).filter(k => k.id !== o.id);
    ui.open = null;
    sheet(`<div class="eyebrow">Introductions</div><h2>Introduce ${esc(o.first)} to…</h2>${leftNote(p)}
      ${res ? `<div class="result" role="status">${esc(res)}</div>` : ''}
      <div class="list" style="margin-top:10px">${kids.map(k => { const done = I.met(k, o); return `<button class="row" data-act="introDo" data-c="${k.id}" data-o="${o.id}" data-back="o" ${done || left(p) <= 0 ? 'disabled' : ''}>${ui.av(k, 'sm')}<div class="main"><div class="t">${esc(S.fullName(k))}</div><div class="s">${S.age(k)} · ${done ? 'already knows them' : esc(I.forecast(k, o))}</div></div></button>`; }).join('') || '<div class="row muted">You have no children old enough.</div>'}</div>
      <button class="btn block" style="margin-top:12px" data-act="profile" data-id="${o.id}">Back to ${esc(o.first)}</button>`, { label: 'Introductions' });
  }
  // Pick a child first (from the Relationships tab)
  function pickKid() {
    const p = S.me(), kids = I.children(p);
    if (kids.length === 1) return pickFor(kids[0].id);
    ui.open = null;
    sheet(`<div class="eyebrow">Introductions</div><h2>Introduce which child?</h2>${leftNote(p)}
      <div class="list" style="margin-top:10px">${kids.map(k => `<button class="row" data-act="introFor" data-id="${k.id}">${ui.av(k, 'sm')}<div class="main"><div class="t">${esc(S.fullName(k))}</div><div class="s">${S.age(k)} · knows ${Object.values(k.rels).filter(r => r.k !== 'fam').length} people outside the family</div></div></button>`).join('')}</div>`, { label: 'Introductions' });
  }

  ui.on.introFor = el => pickFor(+el.dataset.id);
  ui.on.introTo = el => pickChild(+el.dataset.id);
  ui.on.introKids = () => pickKid();
  ui.on.introDo = el => {
    const t = I.introduce(+el.dataset.c, +el.dataset.o);
    S.settle(); render(); ui.save();
    if (el.dataset.back === 'o') pickChild(+el.dataset.o, t); else pickFor(+el.dataset.c, t);
  };

  // Buttons on profiles, and on the Relationships tab
  const extra = ui.personExtra;
  ui.personExtra = (p, o) => {
    let h = extra ? extra(p, o) : '';
    if (!S.alive(o) || !S.alive(p) || o.id === p.id) return h;
    if (I.isChild(p, o) && S.age(o) >= 3) h = `<button class="btn block" style="margin-top:10px" data-act="introFor" data-id="${o.id}">Introduce ${esc(o.first)} to someone…</button>` + h;
    else if (S.age(o) >= 3 && I.children(p).some(k => k.id !== o.id && !I.met(k, o))) h = `<button class="btn block" style="margin-top:10px" data-act="introTo" data-id="${o.id}">Introduce ${esc(o.first)} to your child…</button>` + h;
    return h;
  };
  ui.introBtn = p => (I.children(p).length ? '<button class="btn sm" data-act="introKids">Introduce your children…</button>' : '');

  if (typeof Auto !== 'undefined') Auto.replay.intro = ds => I.introduce(+ds.c, +ds.o);
})();
