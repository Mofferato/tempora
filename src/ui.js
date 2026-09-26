/* =====================================================================
   UI, part 1 — helpers, shell rendering, character card, life log,
   relationships, activities, sheets and choice prompts.
   Views register in UI.views; click handlers in UI.on (data-act="...").
   ===================================================================== */

const UI = (() => {
  const S = Sim, esc = U.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const ui = { tab: 'life', open: null, views: {}, on: {}, input: {} };

  /* ---------------- small helpers ---------------- */
  const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
  const eraCol = e => e.pal[isDark() ? 1 : 0];
  const bornCol = p => eraCol(S.eraOf(p.born));
  const initials = p => ((p.first[0] || '') + (p.last[0] || '')).toUpperCase();
  const av = (p, cls = '') => `<span class="av ${cls}${S.alive(p) ? '' : ' dead'}" style="--ring:${bornCol(p)}" aria-hidden="true">${esc(initials(p))}</span>`;
  const tone = v => (v < 30 ? 'low' : v < 55 ? 'mid' : '');
  const bar = (v, cls = '') => `<div class="bar ${cls}"><i class="${cls ? '' : tone(v)}" style="width:${Math.round(U.clamp(v))}%"></i></div>`;
  const span = p => (p.died != null ? `${U.fmtYear(p.born)}–${U.fmtYear(p.died)}` : `b. ${U.fmtYear(p.born)}`);
  const an = w => (/^[aeiou]/i.test(w) ? 'an' : 'a');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  let toastT;
  function toast(t) {
    if (!t) return;
    const el = $('#toast'); el.textContent = t; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function setEraTheme(e) {
    const r = document.documentElement.style;
    r.setProperty('--era-l', e.pal[0]); r.setProperty('--era-d', e.pal[1]);
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = eraCol(e);
  }

  /* ---------------- sheets ---------------- */
  function sheet(html, opt = {}) {
    ui.open = opt;
    $('#modal').innerHTML = `<div class="scrim" ${opt.locked ? '' : 'data-act="scrim"'}><div class="sheet" role="dialog" aria-modal="true" ${opt.label ? `aria-label="${esc(opt.label)}"` : ''}>${opt.locked ? '' : '<button class="iconbtn x" data-act="close" aria-label="Close">✕</button>'}${html}</div></div>`;
    const f = $('#modal .sheet button:not(.x), #modal .sheet input'); if (f) f.focus({ preventScroll: true });
  }
  function closeSheet() {
    $('#modal').innerHTML = ''; ui.open = null;
    if (ui.returnTo) { const f = ui.returnTo; ui.returnTo = null; f(); return; }
    pump();
  }
  ui.on.close = closeSheet;
  ui.on.scrim = (el, ev) => { if (ev.target === el) closeSheet(); };

  // Show queued choices, then the death screen.
  function pump() {
    if (ui.open || !S.W) return;
    const w = S.W;
    if (w.dead) { S.prompts.length = 0; ui.death(); return; }
    const pr = S.prompts[0];
    if (!pr) return;
    sheet(`<div class="eyebrow">${esc(pr.title)}</div><div class="body${pr.chapter ? ' chapter' : ''}">${esc(pr.text)}</div>
      <div class="acts">${pr.choices.map((c, i) => `<button class="btn choice ${i === 0 ? 'era' : ''}" data-act="choose" data-i="${i}" ${c.dis ? 'disabled title="You cannot afford this"' : ''}><span>${esc(c.l)}</span>${c.src && ui.dpreview ? ui.dpreview(c.src, S.me()) : ''}</button>`).join('')}</div>
      ${ui.promptExtra ? ui.promptExtra(pr) : ''}`, { locked: true, label: 'A choice' });
  }
  ui.on.choose = el => {
    const pr = S.prompts.shift(); if (!pr) return closeSheet();
    const c = pr.choices[+el.dataset.i];
    const res = c.go();
    S.settle();
    ui.open = null; $('#modal').innerHTML = '';
    render(); toast(res);
  };

  /* ---------------- shell ---------------- */
  const RIBBON_TO = { far: 2400 };
  function ribbon(year) {
    const idx = year == null ? -1 : DATA.eras.findIndex(e => year >= e.from && year <= e.to);
    let mark = '';
    if (idx >= 0) {
      const e = DATA.eras[idx], to = RIBBON_TO[e.id] || e.to;
      const f = U.clamp((year - e.from) / (to - e.from), 0, 1);
      mark = `<div class="mark" style="left:${((idx + f) / DATA.eras.length) * 100}%"></div>`;
    }
    return `<div class="segs" style="grid-template-columns:repeat(${DATA.eras.length},1fr)">${DATA.eras.map((e, i) => `<div class="seg ${i < idx ? 'past' : i === idx ? 'now' : ''}" style="--c:${eraCol(e)}" title="${esc(e.name)}: ${U.fmtYear(e.from)}${e.to > 9000 ? '+' : '–' + U.fmtYear(e.to)}"></div>`).join('')}</div>${mark}
      <div class="labels">${DATA.eras.map((e, i) => [e, i]).filter(([e]) => ['prehistory', 'ancient', 'medieval', 'renaissance', 'industrial', 'modern', 'far'].includes(e.id)).map(([e, i]) => `<span style="left:${(i / DATA.eras.length) * 100}%">${U.fmtYear(e.from).replace('10000 BC', '10k BC')}</span>`).join('')}</div>`;
  }

  function render() {
    const w = S.W;
    $('#ribbon').innerHTML = ribbon(w ? w.year : null);
    if (!w) { ui.start(); return; }
    const e = S.era(), p = S.me();
    setEraTheme(e);
    $('#when').innerHTML = `<div class="yr">${U.fmtYearAD(w.year)}</div><div class="er">${esc(e.short || e.name)}</div>`;
    $('#btnGod').setAttribute('aria-pressed', ui.tab === 'world' && ui.worldTab === 'god' ? 'true' : 'false');
    $('#btnGod').hidden = !(S.godAllowed && S.godAllowed());
    if (!$('#layout')) {
      $('#screen').innerHTML = `<div class="layout" id="layout"><aside class="side"><div class="card" id="card"></div></aside>
        <section><nav class="tabs" role="tablist" id="tabs" aria-label="Parts of your life"></nav><div id="view"></div></section></div>`;
      $('#tabs').addEventListener('scroll', () => edges($('#tabs')), { passive: true });
    }
    $('#card').innerHTML = ui.cardHTML(p);
    $('#tabs').innerHTML = ui.tabList().map(([id, n]) => `<button class="tab" role="tab" data-act="tab" data-tab="${id}" aria-selected="${ui.tab === id}" tabindex="${ui.tab === id ? 0 : -1}">${n}</button>`).join('');
    const head = document.querySelector('.top'); if (head) document.documentElement.style.setProperty('--toph', head.offsetHeight + 'px');
    fitTabs();
    renderView();
    const dead = !!w.dead || !S.alive(p);
    $('#agebar').hidden = false;
    $('#ageBtn').disabled = dead;
    $('#ageBtn').innerHTML = `Age +1 <small>→ ${U.fmtYearAD(U.next(w.year))}</small>`;
    for (const f of ui.afterRender || []) { try { f(p); } catch (err) { console.error(err); } }
    pump();
  }
  function renderView() {
    const v = ui.views[ui.tab], st = ui.tabStrips && ui.autoStrip && ui.tabStrips[ui.tab];
    $('#view').innerHTML = (st ? ui.autoStrip(...st) : '') + (v ? v(S.me()) : '');
    if (ui.tab === 'tree' && ui.afterTree) ui.afterTree();
  }
  const TABS = [['life', 'Life'], ['rel', 'Relationships'], ['act', 'Activities'], ['job', 'Occupation'], ['assets', 'Assets'], ['tree', 'Family Tree'], ['world', 'World']];
  // The selected tab stays in view: the strip scrolls only when it is cut off, and leaves a glimpse of its neighbours
  function fitTabs() {
    const tabs = $('#tabs'), b = tabs && tabs.querySelector('[aria-selected="true"]');
    if (!b) return;
    const tr = tabs.getBoundingClientRect(), br = b.getBoundingClientRect(), pad = Math.min(56, tr.width / 6);
    if (br.left - pad < tr.left) tabs.scrollLeft -= tr.left - br.left + pad;
    else if (br.right + pad > tr.right) tabs.scrollLeft += br.right + pad - tr.right;
    edges(tabs);
  }
  // fade an edge of the strip when there are more tabs past it
  const edges = tabs => { tabs.classList.toggle('fade-l', tabs.scrollLeft > 2); tabs.classList.toggle('fade-r', tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 2); };

  // Each tab remembers where you had scrolled to, so leaving the Life log and coming back keeps your place.
  // A tab you have not opened yet starts at its top, just below the pinned tab strip. Focus stays on the tab you picked.
  const scrollMem = {};
  ui.on.tab = el => {
    scrollMem[ui.tab] = window.scrollY;
    ui.tab = el.dataset.tab; render();
    const tabs = $('#tabs'), head = document.querySelector('.top')?.offsetHeight || 0;
    const start = Math.max(0, $('#view').getBoundingClientRect().top + window.scrollY - head - tabs.offsetHeight - 14);
    window.scrollTo(0, scrollMem[ui.tab] ?? Math.min(window.scrollY, start));
    tabs.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true });
  };
  // Left and right arrows (and Home, End) move between tabs, as in any tab strip
  document.addEventListener('keydown', e => {
    const t = e.target.closest?.('#tabs .tab');
    if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const all = [...$('#tabs').querySelectorAll('.tab')], i = all.indexOf(t);
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
    e.preventDefault(); ui.on.tab(all[j]);
  });

  /* ---------------- character card ---------------- */
  function card(p) {
    const e = S.era(), a = S.age(p), tags = [];
    tags.push(`<span class="tag era">${esc(e.name)}</span>`);
    if (p.prison) tags.push(`<span class="tag bad">In prison · ${plural(p.prison, 'year')}</span>`);
    if (p.flags.war) tags.push(`<span class="tag bad">At war</span>`);
    p.sick.forEach(s => tags.push(`<span class="tag bad">${esc(s.n)}</span>`));
    if (p.job) tags.push(`<span class="tag">${esc(p.job.t)}</span>`);
    else if (p.school) tags.push(`<span class="tag">${esc(e.edu.n[p.school.lvl])}</span>`);
    else if (p.retired) tags.push(`<span class="tag">Retired</span>`);
    const sp = S.spouse(p);
    if (sp) tags.push(`<span class="tag">Married to ${esc(sp.first)}</span>`);
    if (p.title) tags.push(`<span class="tag good">${esc(p.title)}</span>`);
    const st = [['Health', p.h], ['Happiness', p.hp], ['Smarts', p.sm], ['Looks', p.lk], ['Reputation', p.rep]];
    return `<div class="who">${av(p, 'lg')}<div class="meta"><h2>${esc(S.fullName(p))}</h2>
      <div class="sub">${p.sex === 'M' ? 'He' : 'She'} · age ${a} · ${span(p)} · ${esc(U.house(S.W.dyn.name))}</div></div></div>
      <div class="tags">${tags.join('')}</div>
      <div class="stats">${st.map(([k, v]) => `<div class="stat"><span class="k">${k}</span>${bar(v)}<span class="v">${Math.round(v)}</span></div>`).join('')}</div>
      <div class="wealth"><span class="eyebrow">Wealth · ${esc(e.cur.n)}</span><span class="v ${p.money < 0 ? 'faint' : ''}">${S.money(p.money)}</span></div>
      ${p.assets.length ? `<div class="faint" style="font-size:12px;text-align:right">Net worth ${S.money(S.netWorth(p))}</div>` : ''}`;
  }

  /* ---------------- Life log ---------------- */
  // The year-by-year log, newest first (also used by the docked log in lifedock.js)
  ui.logYears = (p, limit) => {
    const groups = [];
    for (const l of p.log) {
      const g = groups[groups.length - 1];
      if (g && g.y === l.y) g.items.push(l); else groups.push({ y: l.y, a: l.a, items: [l] });
    }
    groups.reverse();
    const yd = {}; for (const x of p.yd || []) yd[x.y] = x.d;
    const dc = (d, o) => (d && ui.dchips ? ui.dchips(d, o) : '');
    return groups.slice(0, limit).map((g, i) => `<div class="logyr ${i === 0 ? 'now' : ''}"><div class="d"><b>${U.fmtYearAD(g.y)}</b>Age ${g.a}</div>
      <div><ul>${g.items.map(l => `<li class="${l.k}">${ui.linkify ? ui.linkify(l.t, p) : esc(l.t)}${l.d ? ' ' + dc(l.d, { small: 1, max: 5 }) : ''}</li>`).join('')}</ul>${yd[g.y] ? `<div class="ydelta"><span class="faint">The year:</span> ${dc(yd[g.y], { small: 1, max: 8 })}</div>` : ''}</div></div>`).join('') || '<p class="muted">Your story begins.</p>';
  };
  ui.logYearCount = p => new Set(p.log.map(l => l.y)).size;
  ui.views.life = p => `<div class="panel">${ui.logYears(p, ui.logLimit || 120)}${ui.logYearCount(p) > (ui.logLimit || 120) ? '<button class="btn sm block" data-act="moreLog" style="margin-top:10px">Show older years</button>' : ''}</div>`;

  /* ---------------- Relationships ---------------- */
  const GROUPS = [
    ['Partner', /^(Husband|Wife|Boyfriend|Girlfriend|Fiancé|Fiancée)$/],
    ['Parents & grandparents', /^(Father|Mother|Grand(father|mother)|Great-grand(father|mother))$/],
    ['Siblings', /Brother|Sister/],
    ['Children & grandchildren', /^(Son|Daughter|Grand(son|daughter)|Great-grand(son|daughter))$/],
    ['Extended family', /Uncle|Aunt|Cousin|Nephew|Niece|in-law/],
    ['Friends & others', /./],
  ];
  function relRow(p, o) {
    const r = p.rels[o.id], lab = S.relLabel(p, o);
    const sub = S.alive(o) ? `${lab} · ${S.age(o)}${o.job ? ' · ' + o.job.t : ''}` : `${lab} · † ${U.fmtYear(o.died)}, ${o.cause}`;
    return `<button class="row" data-act="person" data-id="${o.id}">${ui.av(o, 'sm')}<div class="main"><div class="t">${esc(S.fullName(o))}</div><div class="s">${esc(sub)}</div></div>
      ${S.alive(o) && r ? `<div class="end"><div class="mini" title="Closeness ${Math.round(r.c)}">${bar(r.c, 'era')}</div></div>` : ''}</button>`;
  }
  ui.views.rel = p => {
    const all = S.known(p), live = all.filter(S.alive), dead = all.filter(o => !S.alive(o));
    const used = new Set(), out = [];
    for (const [name, rx] of GROUPS) {
      const g = live.filter(o => !used.has(o.id) && rx.test(S.relLabel(p, o))).sort((a, b) => a.born - b.born);
      g.forEach(o => used.add(o.id));
      if (g.length) out.push(`<div class="sec-h"><h3>${name}</h3><span class="faint">${g.length}</span></div><div class="list">${g.map(o => relRow(p, o)).join('')}</div>`);
    }
    return `<div class="btnrow" style="margin-bottom:6px">
        <button class="btn sm" data-act="activity" data-id="u:friend">${esc(S.era().L.friend)}</button>
        <button class="btn sm" data-act="activity" data-id="u:love">${esc(S.era().L.love)}</button></div>
      ${out.join('') || '<p class="muted">You know no one yet.</p>'}
      ${dead.length ? `<details style="margin-top:16px"><summary class="sec-h" style="cursor:pointer"><h3 style="display:inline">In memory</h3> <span class="faint">${dead.length}</span></summary><div class="list">${dead.sort((a, b) => b.died - a.died).map(o => relRow(p, o)).join('')}</div></details>` : ''}`;
  };

  // Bio sheet for anyone: family member, friend, or a stranger in the tree
  function person(id, res) {
    const p = S.me(), o = S.P(id);
    if (!o) return;
    const self = o.id === p.id, liv = S.alive(o), e = S.era();
    const lab = self ? 'You' : S.relLabel(p, o);
    const r = p.rels[o.id], sp = S.spouse(o);
    const kv = [
      ['Born', `${U.fmtYearAD(o.born)} · ${S.eraOf(o.born).name}`],
      liv ? ['Age', S.age(o)] : ['Died', `${U.fmtYearAD(o.died)}, age ${S.age(o)}, of ${o.cause}`],
      ['Occupation', o.job ? `${o.job.t}${o.job.rank ? ` (${S.rankName(o.job.rank)})` : ''}` : o.retired ? 'Retired' : o.lastJob ? `Formerly ${o.lastJob}` : '—'],
      ['Education', e.edu.n[o.edu]],
      ['Spouse', sp ? S.fullName(sp) : o.exes.length ? 'Divorced or widowed' : '—'],
      ['Children', o.kids.length],
      ['Wealth', S.money(S.netWorth(o))],
    ];
    if (o.played) kv.push(['Dynasty', 'Played by you']);
    const acts = !self && liv ? S.actionsFor(p, o) : [];
    sheet(`<div class="who">${av(o, 'lg')}<div class="meta"><div class="eyebrow">${esc(lab)}</div><h2>${esc(S.fullName(o))}</h2><div class="sub">${span(o)}</div></div></div>
      ${liv ? `<div class="stats">${[['Health', o.h], ['Happiness', o.hp], ['Smarts', o.sm], ['Looks', o.lk]].map(([k, v]) => `<div class="stat"><span class="k">${k}</span>${bar(v)}<span class="v">${Math.round(v)}</span></div>`).join('')}
        ${r && !self ? `<div class="stat"><span class="k">Closeness</span>${bar(r.c, 'era')}<span class="v">${Math.round(r.c)}</span></div>` : ''}</div>` : ''}
      <dl class="kv">${kv.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      ${res ? `<div class="result" role="status">${esc(res)}</div>` : ''}
      ${acts.length ? `<div class="acts" style="margin-top:14px">${acts.map(a => ui.interactBtn(o, a)).join('')}</div>` : ''}
      ${!self && liv && S.alive(p) ? `<button class="btn era block" style="margin-top:10px" data-act="become" data-id="${o.id}">Become ${esc(o.first)}</button>
        <p class="faint" style="font-size:12px;margin:8px 0 0">${esc(p.first)} keeps living in the world as an ordinary person.</p>` : ''}`, { label: S.fullName(o) });
  }
  // A button for something to do with a person; once-a-year actions already used up are greyed out and say so
  ui.interactBtn = (o, a) => a.done
    ? `<button class="btn used" disabled title="${a.done === 'auto' ? 'Auto-play did this for you this year' : 'You did this this year'}">${esc(a.l)}<span class="note">${a.done === 'auto' ? 'Done by auto-play this year' : 'Done this year'}</span></button>`
    : `<button class="btn" data-act="interact" data-id="${o.id}" data-a="${a.id}">${esc(a.l)}</button>`;
  ui.on.person = el => ui.person(+el.dataset.id);
  ui.on.interact = el => {
    const t = S.interact(+el.dataset.id, el.dataset.a);
    S.settle();
    ui.open = null; render();
    if (S.W.dead) return;
    ui.person(+el.dataset.id, t);
  };
  ui.on.become = el => {
    const o = S.P(+el.dataset.id);
    ui.open = { locked: false };
    sheet(`<h2>Become ${esc(o.first)}?</h2><div class="body">You will continue the story as ${esc(S.fullName(o))}, age ${S.age(o)}. ${esc(S.me().first)} stays in the world and keeps living on their own.</div>
      <div class="acts"><button class="btn era" data-act="becomeYes" data-id="${o.id}">Become ${esc(o.first)}</button><button class="btn" data-act="close">Not now</button></div>`);
  };
  ui.on.becomeYes = el => { S.become(+el.dataset.id); ui.open = null; $('#modal').innerHTML = ''; ui.tab = 'life'; render(); ui.save(); toast(`You are now ${S.fullName(S.me())}.`); };

  /* ---------------- Activities ---------------- */
  ui.views.act = p => {
    const acts = S.activities(p);
    const row = a => {
      const why = a.jailed ? 'Not from prison' : a.young ? `Age ${a.min}+` : a.done ? 'Done this year' : a.broke ? 'Cannot afford' : '';
      return `<div class="prow"><button class="row ${why ? 'off' : ''}" data-act="activity" data-id="${a.id}" ${why ? 'disabled' : ''}>
        <div class="main"><div class="t">${esc(a.n)}</div><div class="s">${esc(a.d || '')}</div>${a.src.fx && ui.fxPills ? `<div class="dchips small preview">${ui.fxPills(a.src.fx)}${a.src.risk ? `<span class="dodds alt">${Math.round(a.src.risk.p * 100)}% risk</span>` : ''}</div>` : ''}</div>
        <div class="end">${why ? `<span class="why">${why}</span>` : a.cost ? `<span class="mono">${S.money(a.cost)}</span>` : '<span class="faint">Free</span>'}</div></button>${ui.pinBtn ? ui.pinBtn('activity', { id: a.id }, a.n) : ''}</div>`;
    };
    const eraActs = acts.filter(a => a.era), common = acts.filter(a => !a.era);
    return `<div class="sec-h"><h3>Of the ${esc(S.era().name)} era</h3></div><div class="list">${eraActs.map(row).join('') || '<div class="row muted">Nothing special this year.</div>'}</div>
      <div class="sec-h"><h3>Everyday life</h3></div><div class="list">${common.map(row).join('')}</div>`;
  };
  ui.on.activity = el => {
    const t = S.doActivity(el.dataset.id);
    S.settle(); render(); toast(t);
  };

  Object.assign(ui, { $, esc, av, bar, span, an, plural, toast, sheet, closeSheet, pump, render, renderView, person, eraCol, bornCol, isDark, ribbon, setEraTheme, cardHTML: card, tabList: () => TABS, TABS });
  return ui;
})();
