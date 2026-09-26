/* =====================================================================
   AUTO — let the game act for you.
   * Habits: work, exercise, study, see a healer, keep in touch...
   * Pins: tap "auto" next to almost any action (an activity, a person's
     action, a pet, a household plan, a club, a phone call, a sport) and
     it repeats every year.
   * Recorder: everything you do in a year is remembered; "Repeat last
     year" replays it in one tap, or every year automatically.
   * Choice policies, an AI autopilot goal (ai.js), timed aging, carrying
     on as an heir, and "play N years".
   ===================================================================== */

const Auto = (() => {
  const S = Sim;
  const OPTS = [
    ['work', 'Work hard every year'], ['gym', 'Exercise every year'], ['study', 'Study every year'], ['healer', 'See a healer when ill'],
    ['social', 'Keep in touch with family'], ['job', 'Find work when unemployed'], ['school', 'Enrol in the next school'], ['invest', 'Put spare money into income property'], ['pets', 'Care for pets'],
    ['repeat', "Repeat last year's actions every year"], ['pinsOn', 'Run my pinned actions every year'],
  ];
  const cfg = () => (S.W.auto ||= { choices: 'ask', speed: 2, pinsOn: true });
  const macro = () => (S.W.macro ||= { cur: [], last: [] });

  /* ---------- replaying recorded or pinned actions ---------- */
  const replay = {
    activity: ds => S.doActivity(ds.id),
    interact: ds => S.interact(+ds.id, ds.a),
    workHard: () => S.workHard(),
    promo: () => S.askPromotion(),
    petAct: ds => S.petAct(+ds.id, ds.a),
    memberAct: ds => (typeof House !== 'undefined' ? House.act(S.me(), +ds.id, ds.a) : ''),
    house: ds => (typeof House !== 'undefined' ? House.houseAct(S.me(), ds.a) : ''),
    orgAct: ds => (['attend', 'donate', 'rise'].includes(ds.a) ? S.orgAct(ds.id, ds.a) : ''),
    natAct: ds => (ds.a === 'travel' ? S.world.travel(ds.cc) : ds.a === 'invest' ? S.world.invest(ds.cc, 0.2) : ''),
    bulk: ds => { let n = 0; for (const o of S.known(S.me()).filter(S.alive)) { if (ds.g === 'family' && !/Father|Mother|Brother|Sister|Son|Daughter|Grand|Husband|Wife/.test(S.relLabel(S.me(), o))) continue; if (ds.a === 'party') break; const t = S.interact(o.id, ds.a); if (t && !/already|cannot|gone/i.test(t)) n++; } return n ? `Kept up with ${n} people.` : ''; },
  };
  const label = x => x.label || `${x.act}${x.ds.a ? ' · ' + x.ds.a : ''}`;
  function exec(x) {
    const f = replay[x.act]; if (!f || !S.alive(S.me()) || S.W.dead) return '';
    try { const t = f(x.ds || {}); S.settle(); return t || ''; } catch (err) { console.error(err); return ''; }
  }
  // Clicks with a replay handler count as "things you did this year"
  function record(act, ds, lab) {
    if (!replay[act] || !S.W) return;
    const m = macro(), key = act + JSON.stringify(ds);
    if (!m.cur.some(x => x.key === key)) m.cur.push({ key, act, ds, label: lab });
  }
  function rollYear() { const m = macro(); if (m.cur.length) m.last = m.cur; m.cur = []; }
  function repeatLast() {
    const m = macro(), out = [];
    S.asAuto(() => { for (const x of m.last) { const t = exec(x); if (t && !/already|cannot|not |need|too young/i.test(t)) out.push(t); } });
    return out;
  }

  /* ---------- pins ---------- */
  const pins = () => (cfg().pins ||= []);
  const pinKey = (act, ds) => act + JSON.stringify(ds);
  const isPinned = (act, ds) => pins().some(x => x.key === pinKey(act, ds));
  function togglePin(act, ds, lab) {
    const k = pinKey(act, ds), list = pins(), i = list.findIndex(x => x.key === k);
    if (i >= 0) { list.splice(i, 1); return false; }
    list.push({ key: k, act, ds, label: lab }); return true;
  }
  function runPins() { const out = []; S.asAuto(() => { for (const x of pins().slice()) { const t = exec(x); if (t) out.push(t); } }); return out; }

  /* ---------- the yearly routine ---------- */
  function apply(p) { S.asAuto(() => routine(p)); }
  function routine(p) {
    const c = cfg(), e = S.era(), a = S.age(p);
    if (!S.alive(p) || S.W.dead) return;
    if (c.goal && typeof AI !== 'undefined') AI.autopilot(p, c.goal);
    if (c.work && p.job) S.workHard();
    if (c.gym && a >= 8) S.doActivity('u:gym');
    if (c.study && a >= 6) S.doActivity('u:study');
    if (c.healer && p.sick.length) S.doActivity('u:healer');
    if (c.social) S.known(p).filter(o => S.alive(o) && p.rels[o.id]?.k === 'fam').sort((x, y) => (p.rels[x.id]?.c ?? 50) - (p.rels[y.id]?.c ?? 50)).slice(0, 3).forEach(o => S.interact(o.id, 'time'));
    if (c.job && !p.job && a >= S.workAge(e) && !(p.school && p.school.lvl < 3)) { const L = S.jobListings(p).filter(x => !x.why.length).sort((x, y) => y.pay - x.pay); for (const x of L.slice(0, 3)) if (S.apply(x.j.id).ok) break; }
    if (c.school && !p.school && a <= 30) { const o = S.eduOptions(p).find(x => !x.why.length); if (o) S.doEnroll(o.lvl); }
    if (c.invest && p.money > S.toVal(e.cost * 20)) { const m = S.market().filter(x => x.a.inc > 0 && x.price < p.money * 0.5).sort((x, y) => y.a.inc - x.a.inc)[0]; if (m) S.buy(m.a.id); }
    if (c.pets) for (const pet of S.petsOf(p)) { S.petAct(pet.id, 'play'); if (pet.h < 50) S.petAct(pet.id, 'vet'); }
    if (c.pinsOn !== false) runPins();
    if (c.repeat) repeatLast();
    S.settle();
  }
  // Pick a choice by policy. Chapters and single-choice prompts just turn the page.
  function choose(pr, policy) {
    const ok = pr.choices.map((c, i) => [c, i]).filter(([c]) => !c.dis);
    if (!ok.length) return pr.choices[0];
    if (pr.choices.length === 1 || policy === 'bold') return ok[0][0];
    if (policy === 'safe') return ok[ok.length - 1][0];
    if (policy === 'character' && S.pers) return S.pers.inCharacter(S.me(), ok.map(x => x[0]));
    if ((policy === 'smart' || policy === 'goal') && typeof AI !== 'undefined') return AI.bestChoice(S.me(), ok.map(x => x[0]), cfg().goal || 'balanced');
    return U.pick(ok)[0];
  }
  function resolveAll(policy) { while (S.prompts.length) { const pr = S.prompts.shift(); choose(pr, policy).go(); S.settle(); } }
  function carryOn() {
    const d = S.W.dead; if (!d) return false;
    const h = S.heirs(S.P(d.id)).filter(x => S.age(x.o) >= 0);
    const kid = h.find(x => /Son|Daughter/.test(x.rel)) || h[0];
    if (!kid) return false;
    S.continueAs(kid.o.id);
    return true;
  }
  // Play n years at once with the current settings
  function run(n) {
    const c = cfg(), policy = c.choices === 'ask' ? 'safe' : c.choices;
    let lived = 0;
    for (let i = 0; i < n; i++) {
      rollYear();
      S.ageUp(); resolveAll(policy); S.settle();
      if (S.W.dead) { if (!(c.heir && carryOn())) break; }
      apply(S.me()); resolveAll(policy); lived++;
    }
    return lived;
  }
  return { OPTS, cfg, apply, choose, resolveAll, run, carryOn, replay, exec, record, rollYear, repeatLast, pins, isPinned, togglePin, runPins, macro, label };
})();

(() => {
  const S = Sim, ui = UI, { $, esc, toast, sheet, render } = ui;
  let timer = null;
  const running = () => !!timer;
  function stop() { if (timer) clearInterval(timer); timer = null; $('#autoBtn')?.setAttribute('aria-pressed', 'false'); }
  function tick() {
    if (!S.W || !ui.age) return stop();
    const c = Auto.cfg();
    if (ui.open && c.choices === 'ask') return;          // wait for the player's choice
    if (S.W.dead) { if (c.heir && Auto.carryOn()) { ui.open = null; $('#modal').innerHTML = ''; render(); ui.save(); return; } return stop(); }
    if (ui.open && c.choices !== 'ask') { ui.open = null; $('#modal').innerHTML = ''; }
    ui.age();
    if (c.choices !== 'ask') { Auto.resolveAll(c.choices); ui.open = null; $('#modal').innerHTML = ''; }
    render(); ui.save();
  }

  // Record what the player does (see main.js: every click passes through ui.around)
  (ui.around ||= []).push({ after: el => { if (!S.W || !S.me()) return; const ds = { ...el.dataset }; delete ds.act; delete ds.label; Auto.record(el.dataset.act, ds, el.dataset.label || el.textContent.trim().slice(0, 60)); } });
  const age0 = () => Auto.rollYear();
  // roll the recorder over at the start of every year, before the player acts again
  (ui.beforeAge ||= []).push(age0);

  // A small "auto" toggle placed next to an action button
  ui.pinBtn = (act, ds, lab) => {
    if (!S.W) return '';
    const on = Auto.isPinned(act, ds);
    return `<button class="pin ${on ? 'on' : ''}" data-act="pinToggle" data-pa="${esc(act)}" data-ps="${esc(JSON.stringify(ds))}" data-label="${esc(lab || '')}" aria-pressed="${on}" title="${on ? 'Repeats every year. Tap to stop.' : 'Repeat this every year'}">auto</button>`;
  };
  ui.on.pinToggle = el => {
    const on = Auto.togglePin(el.dataset.pa, JSON.parse(el.dataset.ps), el.dataset.label);
    el.classList.toggle('on', on); el.setAttribute('aria-pressed', on);
    ui.save(); toast(on ? `"${el.dataset.label}" will repeat every year.` : 'Unpinned.');
  };

  function autoSheet(res) {
    const c = Auto.cfg(), m = Auto.macro(), pins = Auto.pins();
    const goals = typeof AI !== 'undefined' ? AI.GOALS : [];
    sheet(`<h2>Auto-play</h2><p class="lede">Let your character handle the routine. Everything here works in every game mode.</p>
      <div class="eyebrow" style="margin-top:10px">Every year, automatically</div>
      <div class="checks">${Auto.OPTS.map(([k, l]) => `<label class="check"><input type="checkbox" data-input="autoOpt" data-k="${k}" ${c[k] || (k === 'pinsOn' && c.pinsOn !== false) ? 'checked' : ''}> ${esc(l)}</label>`).join('')}</div>
      <div class="form" style="margin-top:12px">
        <div class="field"><label for="a-choices">When a choice pops up</label><select id="a-choices" data-input="autoSel" data-k="choices">${[['ask', 'Ask me'], ['safe', 'Play it safe'], ['bold', 'Be bold'], ['character', 'Choose in character'], ['smart', 'Choose what serves my goal'], ['random', 'Choose at random']].map(([v, n]) => `<option value="${v}" ${c.choices === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        ${goals.length ? `<div class="field"><label for="a-goal">Autopilot goal</label><select id="a-goal" data-input="autoSel" data-k="goal"><option value="">Off (only the habits above)</option>${goals.map(([v, n]) => `<option value="${v}" ${c.goal === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>` : ''}
        <div class="field"><label for="a-speed">Auto-age speed</label><select id="a-speed" data-input="autoSel" data-k="speed">${[[4, 'Leisurely (4 s a year)'], [2, 'Steady (2 s)'], [1, 'Brisk (1 s)'], [0.4, 'Rapid']].map(([v, n]) => `<option value="${v}" ${+c.speed === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
      <label class="check" style="margin-top:10px"><input type="checkbox" data-input="autoOpt" data-k="heir" ${c.heir ? 'checked' : ''}> When I die, carry on as my eldest child</label>
      <div class="eyebrow" style="margin-top:14px">Pinned actions · ${pins.length}</div>
      ${pins.length ? `<div class="list" style="margin-top:6px">${pins.map((x, i) => `<div class="row"><div class="main"><div class="t">${esc(Auto.label(x))}</div></div><button class="btn sm danger" data-act="unpin" data-i="${i}">Remove</button></div>`).join('')}</div>` : '<p class="faint" style="font-size:13px;margin:4px 0 0">Tap the small <b>auto</b> button next to an activity, a person’s action, a pet, a club or a household plan to repeat it every year.</p>'}
      <div class="eyebrow" style="margin-top:14px">Last year you did ${m.last.length} thing${m.last.length === 1 ? '' : 's'} · this year so far ${m.cur.length}</div>
      ${m.last.length ? `<p class="faint" style="font-size:13px;margin:4px 0 0">${m.last.slice(0, 12).map(x => esc(Auto.label(x))).join(' · ')}${m.last.length > 12 ? ' …' : ''}</p>` : ''}
      ${res ? `<div class="result">${esc(res)}</div>` : ''}
      <div class="btnrow" style="margin-top:14px"><button class="btn era" data-act="autoToggle">${running() ? 'Stop auto-aging' : 'Start auto-aging'}</button>
        <button class="btn" data-act="repeatLast" ${m.last.length ? '' : 'disabled'}>Repeat last year now</button>
        ${[5, 10, 25].map(n => `<button class="btn" data-act="autoRun" data-n="${n}">Play ${n} years now</button>`).join('')}</div>`, { label: 'Auto-play' });
  }
  ui.on.auto = () => { ui.open = null; autoSheet(); };
  ui.on.unpin = el => { Auto.pins().splice(+el.dataset.i, 1); ui.save(); ui.open = null; autoSheet('Unpinned.'); };
  ui.input.autoOpt = el => { Auto.cfg()[el.dataset.k] = el.checked; ui.save(); };
  ui.input.autoSel = el => { Auto.cfg()[el.dataset.k] = el.dataset.k === 'speed' ? +el.value : el.value || null; if (running()) { stop(); start(); } ui.save(); };
  function start() { stop(); timer = setInterval(tick, Math.max(300, Auto.cfg().speed * 1000)); $('#autoBtn')?.setAttribute('aria-pressed', 'true'); }
  ui.on.autoToggle = () => { if (running()) { stop(); toast('Auto-aging stopped.'); } else { ui.open = null; $('#modal').innerHTML = ''; start(); toast('Auto-aging. Press the auto button to stop.'); } };
  ui.on.autoRun = el => {
    const n = +el.dataset.n, lived = Auto.run(n);
    ui.open = null; $('#modal').innerHTML = ''; render(); ui.save();
    toast(S.W.dead ? `Played ${lived} years before the end came.` : `Played ${lived} years.`);
  };
  ui.on.repeatLast = () => {
    if (!S.W || S.W.dead) return;
    const done = Auto.repeatLast();
    const wasOpen = !!ui.open && $('#modal .sheet h2')?.textContent === 'Auto-play';
    ui.open = null; if (!wasOpen) $('#modal').innerHTML = '';
    render(); ui.save();
    toast(done.length ? `Repeated ${done.length} of last year's actions.` : 'Nothing from last year could be repeated right now.');
  };
  ui.on.autoBtn = () => { if (running()) { stop(); toast('Auto-aging stopped.'); } else ui.on.auto(); };
  ui.stopAuto = stop;
  // replaying a recorded click should not be recorded again
  const rec = Auto.record;
  Auto.record = (act, ds, lab) => { if (act === 'repeatLast' || act === 'pinToggle') return; rec(act, ds, lab); };
})();
