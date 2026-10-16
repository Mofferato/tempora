/* =====================================================================
   DASH — the shell: a clean, dense dashboard instead of a long page.
   Everything you need is on one screen, each part with one job:
     header      the date, the era, and the few switches you reach for
     hub bar     six places to go (Life, Self, People, Do, Money, World)
     sub-tabs    what is inside the place you are in
     left rail   who you are: face, name, stats, money
     main        the thing you came to do, in cards that flow in columns
     right rail  what is happening now: this year, goals, family, world
     bottom bar  the log, auto-play, repeat, and the Age button
   Three densities: Simple (only the essentials), Comfortable, and Compact
   (more on screen at once, for big monitors). It adapts to phones too:
   the hub bar scrolls, the right rail folds away, and cards stack.
   ===================================================================== */

LATE.push(() => {
  const S = Sim, ui = UI, A = Atlas, { $, esc, toast, render, sheet } = ui;
  const DENS = 'tempora.density';
  const I = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  ui.hubs = [
    { id: 'life', n: 'Life', icon: I('<path d="M4 5h16M4 10h16M4 15h10"/><circle cx="18" cy="17" r="3"/>'), tabs: ['life'] },
    { id: 'self', n: 'Self', icon: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>'), tabs: ['identity'] },
    { id: 'people', n: 'People', icon: I('<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M3 19c.6-3.2 2.8-5 6-5s5.4 1.8 6 5M15 15c3 0 5 1.4 6 4"/>'), tabs: ['rel', 'phone', 'web', 'tree', 'community'] },
    { id: 'do', n: 'Do', icon: I('<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>'), tabs: ['act', 'places', 'job'] },
    { id: 'money', n: 'Money', icon: I('<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.7-2.5 1.8 0 2.7 5 1.3 5 4 0 1.1-1.1 1.9-2.6 1.9-1.2 0-2.2-.5-2.7-1.4M12 6.5v1.5M12 16v1.5"/>'), tabs: ['assets', 'home'] },
    { id: 'world', n: 'World', icon: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>'), tabs: ['map', 'world'] },
  ];
  const hubOf = tab => (ui.hubs.find(h => h.tabs.includes(tab)) || ui.hubs[0]).id;
  const last = {};   // the sub-tab last open in each hub

  /* ---------- density ---------- */
  const dens = () => ui.store.get(DENS) || (window.innerWidth >= 1500 ? 'compact' : 'comfort');
  function applyDens() { const d = dens(); document.body.classList.remove('d-simple', 'd-comfort', 'd-compact'); document.body.classList.add('d-' + d); }
  ui.setDensity = d => { ui.store.set(DENS, JSON.stringify(d)); applyDens(); render(); };
  window.addEventListener?.('resize', () => { if (!ui.store.get(DENS)) applyDens(); });

  /* ---------- the frame ---------- */
  ui.shell = () => `<div class="layout dash" id="layout"><aside class="side"><div class="card" id="card"></div></aside>
    <section class="mainc"><nav class="tabs hubs" role="tablist" id="tabs" aria-label="Where to go"></nav><nav class="subtabs2" id="subtabs" aria-label="Sections"></nav><div id="view"></div></section>
    <aside class="rail" id="rail" aria-label="Right now"></aside></div>`;
  ui.drawNav = p => {
    const avail = new Map(ui.tabList().map(([id, n]) => [id, n]));
    // any tab not placed in a hub still reaches the user, under World
    for (const id of avail.keys()) if (!ui.hubs.some(h => h.tabs.includes(id))) ui.hubs.find(h => h.id === 'world').tabs.push(id);
    const hubs = ui.hubs.map(h => ({ ...h, tabs: h.tabs.filter(t => avail.has(t)) })).filter(h => h.tabs.length);
    const cur = hubs.find(h => h.tabs.includes(ui.tab)) || hubs[0];
    if (!cur.tabs.includes(ui.tab)) ui.tab = cur.tabs[0];
    last[cur.id] = ui.tab;
    $('#tabs').innerHTML = hubs.map(h => `<button class="tab hub" role="tab" data-act="hub" data-hub="${h.id}" aria-selected="${h.id === cur.id}" tabindex="${h.id === cur.id ? 0 : -1}">${h.icon}<span>${h.n}</span></button>`).join('');
    const sub = $('#subtabs');
    sub.hidden = cur.tabs.length < 2;
    sub.innerHTML = cur.tabs.length > 1 ? cur.tabs.map(id => `<button class="chip" data-act="tab" data-tab="${id}" aria-pressed="${ui.tab === id}">${esc(avail.get(id))}</button>`).join('') : '';
  };
  ui.on.hub = el => {
    const h = ui.hubs.find(x => x.id === el.dataset.hub), avail = new Set(ui.tabList().map(t => t[0]));
    const to = (last[h.id] && avail.has(last[h.id]) ? last[h.id] : h.tabs.find(t => avail.has(t)));
    ui.on.tab({ dataset: { tab: to } });
  };
  // arrow keys move between hubs
  document.addEventListener('keydown', e => {
    const t = e.target.closest?.('#tabs .hub'); if (!t || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const all = [...$('#tabs').querySelectorAll('.hub')], i = all.indexOf(t), j = (i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
    e.preventDefault(); ui.on.hub(all[j]); $('#tabs .hub[aria-selected="true"]')?.focus({ preventScroll: true });
  });

  /* ---------- the left rail: who you are ---------- */
  const baseCard = ui.cardHTML;
  ui.cardHTML = p => {
    let html = baseCard(p);
    const f = Faith.f(Faith.get(p)), nats = Identity.natsOf(p);
    const where = S.world.name(p.cc).replace(/ \(under .*\)$/, '');
    const extra = `<div class="idstrip"><span title="Your faith">${esc(f.adj)}</span>${nats.length > 1 ? `<span title="Nationalities">${nats.map(n => esc(A.C(n)?.adj || n)).join(' · ')}</span>` : ''}<span title="Your people">${esc(Identity.ethText(p))}</span></div>`;
    html = html.replace('<div class="tags">', extra + '<div class="tags">');
    ui.cardFull = html;
    const a = S.age(p), strip = `<button class="cardstrip" data-act="cardOpen" aria-label="Open your profile">${ui.av(p, 'sm')}<span class="m"><b>${esc(p.first)} ${esc(p.last)}</b><span>${a < 1 ? 'newborn' : 'age ' + a} · ${esc(where)}</span>
      <span class="mini"><i title="Health"><u style="width:${Math.round(p.h)}%"></u></i><i title="Happiness"><u style="width:${Math.round(p.hp)}%"></u></i></span></span><span class="money">${esc(S.money(p.money))}<small>profile ▾</small></span></button>`;
    return `<div class="cardfull">${html}</div>${strip}`;
  };
  ui.on.cardOpen = () => sheet(`<div class="cardsheet">${ui.cardFull || ''}</div>`, { label: 'Your profile' });

  /* ---------- the right rail: right now ---------- */
  ui.rail = [];
  const rThis = p => {
    const lines = p.log.filter(l => l.y === S.W.year && l.k !== 'quiet').slice(-6).reverse();
    return `<section class="rcard"><div class="eyebrow">This year · ${esc(U.fmtYearAD(S.W.year))}</div>${lines.length ? `<ul class="rl">${lines.map(l => `<li class="k-${esc(l.k)}">${esc(l.t)}</li>`).join('')}</ul>` : '<p class="faint" style="margin:6px 0 0">A quiet year so far.</p>'}</section>`;
  };
  const rGoals = p => { if (S.age(p) < 8) return ''; const qs = Director.questView(p); return `<section class="rcard"><div class="eyebrow">Goals</div>${qs.map(q => `<div class="goal"><div class="gt"><b>${esc(q.title)}</b></div><div class="bar era"><i style="width:${Math.round(q.progress * 100)}%"></i></div></div>`).join('') || '<p class="faint" style="margin:6px 0 0">No goal set. <button class="linkbtn" data-act="dirNew">Choose one</button></p>'}</section>`; };
  const rFamily = p => {
    const ppl = S.known(p).filter(S.alive).filter(o => p.rels[o.id]).sort((a, b) => (p.rels[b.id].c ?? 0) - (p.rels[a.id].c ?? 0)).slice(0, 6);
    if (!ppl.length) return '';
    return `<section class="rcard"><div class="eyebrow">Closest</div><div class="rppl">${ppl.map(o => `<button class="rp" data-act="person" data-id="${o.id}" title="${esc(S.relLabel(p, o))}">${ui.av(o, 'sm')}<span class="n">${esc(o.first)}</span><span class="bar"><i style="width:${Math.round(p.rels[o.id].c)}%"></i></span></button>`).join('')}</div></section>`;
  };
  const rWorld = p => {
    const news = S.W.news.filter(n => !n.where || n.where.includes(p.cc) || ['war', 'revolution', 'era'].includes(n.type)).slice(-4).reverse();
    const wars = S.activeWars().length;
    return `<section class="rcard"><div class="eyebrow">The world</div>${news.map(n => `<div class="rn"><b>${esc(U.fmtYearAD(n.y))}</b> ${esc(n.t)}</div>`).join('') || '<p class="faint" style="margin:6px 0 0">Nothing to report.</p>'}${wars ? `<div class="rn why">${wars} war${wars > 1 ? 's' : ''} under way</div>` : ''}</section>`;
  };
  ui.drawRail = p => { const r = $('#rail'); if (!r) return; r.innerHTML = [rThis, rGoals, rFamily, rWorld].map(f => { try { return f(p); } catch (e) { return ''; } }).join(''); };

  /* ---------- settings: display ---------- */
  ui.displaySettings = () => {
    const d = dens();
    sheet(`<div class="eyebrow">Display</div><h2>How much to show</h2>
      <div class="list">${[['simple', 'Simple', 'Just the essentials: your life, your people, one thing at a time.'], ['comfort', 'Comfortable', 'The default: roomy cards, a side panel for who you are.'], ['compact', 'Compact', 'Everything at once: columns, a right-hand panel, small type. Best on a large monitor.']].map(([k, n, t]) => `<button class="row" data-act="setDensity" data-v="${k}"><div class="main"><div class="t">${n}${d === k ? ' ✓' : ''}</div><div class="s">${t}</div></div></button>`).join('')}</div>`, { label: 'Display' });
  };
  ui.on.setDensity = el => { ui.open = null; $('#modal').innerHTML = ''; ui.setDensity(el.dataset.v); toast('Display changed.'); };
  ui.on.display = () => { ui.open = null; ui.displaySettings(); };

  applyDens();
});
