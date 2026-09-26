/* =====================================================================
   CHANGE INDICATORS — every click, choice and year is measured: stats,
   money and closeness are snapshotted before and diffed after. Changes
   show as chips in a floating bar, as badges on the character card, on
   each life-log entry, under each year, and as previews on choices and
   activities before you pick them.
   ===================================================================== */

const Delta = (() => {
  const S = Sim, ui = UI, { $, esc } = ui;
  const LAB = { h: 'Health', hp: 'Happiness', sm: 'Smarts', lk: 'Looks', rep: 'Reputation', mh: 'Mind', fe: 'Fertility', im: 'Imagination', wp: 'Willpower', fm: 'Fame' };
  const ORDER = ['h', 'hp', 'sm', 'lk', 'rep', 'mh', 'im', 'wp', 'fm', 'fe'];
  const sign = v => (v > 0 ? '+' : v < 0 ? '−' : '±');
  const num = v => `${sign(v)}${Math.abs(v)}`;

  // chips for a change record from Sim.diff
  function chips(d, o = {}) {
    if (!d) return '';
    const out = [];
    for (const k of ORDER) if (d[k]) out.push(`<span class="dchip ${d[k] > 0 ? 'up' : 'down'}${k === 'fe' ? ' minor' : ''}">${num(d[k])} ${LAB[k]}</span>`);
    if (d.$) out.push(`<span class="dchip ${d.$ > 0 ? 'up' : 'down'} money">${d.$ > 0 ? '+' : '−'}${esc(S.money(Math.abs(d.$)))}</span>`);
    for (const [id, v] of d.rel || []) {
      const q = S.P(id); if (!q) continue;
      out.push(v === 'new' ? `<span class="dchip up rel">New: ${esc(q.first)}</span>` : `<span class="dchip ${v > 0 ? 'up' : 'down'} rel">${esc(q.first)} ${num(v)}</span>`);
    }
    for (const [k, v] of Object.entries(d.x || {})) out.push(`<span class="dchip ${v > 0 ? 'up' : 'down'}">${num(v)} ${esc(k)}</span>`);
    const max = o.max || 9;
    const shown = out.slice(0, max).join('') + (out.length > max ? `<span class="dchip more">+${out.length - max}</span>` : '');
    return shown ? `<span class="dchips${o.small ? ' small' : ''}">${shown}</span>` : '';
  }

  // what an fx object is likely to do, before it happens
  function fxText(fx, e = S.era()) {
    if (!fx) return [];
    const out = [];
    const rng = v => (Array.isArray(v) ? (v[0] === v[1] ? num(v[0]) : `${sign(v[0] + v[1])}${Math.min(Math.abs(v[0]), Math.abs(v[1]))}–${Math.max(Math.abs(v[0]), Math.abs(v[1]))}`) : num(v));
    for (const k of ORDER) if (fx[k] != null) out.push([(Array.isArray(fx[k]) ? fx[k][0] + fx[k][1] : fx[k]) >= 0 ? 'up' : 'down', `${rng(fx[k])} ${LAB[k]}`]);
    const m = v => S.money(Math.abs(v));
    if (fx.$ != null) { const a = Array.isArray(fx.$) ? fx.$ : [fx.$, fx.$]; out.push([a[0] + a[1] >= 0 ? 'up' : 'down', a[0] === a[1] ? `${a[0] >= 0 ? '+' : '−'}${m(S.toVal(a[0], e))}` : `${a[0] >= 0 ? '+' : '−'}${m(S.toVal(Math.min(Math.abs(a[0]), Math.abs(a[1])), e))}–${m(S.toVal(Math.max(Math.abs(a[0]), Math.abs(a[1])), e))}`]); }
    if (fx.$c != null) { const a = Array.isArray(fx.$c) ? fx.$c : [fx.$c, fx.$c]; const v = (a[0] + a[1]) / 2; out.push([v >= 0 ? 'up' : 'down', `${v >= 0 ? '+' : '−'}${m(S.toVal(e.cost * Math.abs(v), e))}${a[0] !== a[1] ? ' (about)' : ''}`]); }
    if (fx.jail) out.push(['down', `Prison ${fx.jail}y`]);
    if (fx.fire) out.push(['down', 'Lose your job']);
    if (fx.job) out.push(['up', 'New job']);
    if (fx.lover) out.push(['up', 'A new partner']);
    if (fx.edu) out.push(['up', 'Schooling']);
    if (fx.perf) out.push([fx.perf > 0 ? 'up' : 'down', `${num(fx.perf)} Performance`]);
    if (fx.pet) out.push(['up', 'A pet']);
    if (fx.famc) out.push(['up', 'Family closeness']);
    if (fx.royal) out.push(['up', 'Royalty']);
    if (fx.rival) out.push(['down', 'A rival']);
    return out;
  }
  const pills = list => list.map(([c, t]) => `<span class="dchip ${c}">${esc(t)}</span>`).join('');
  function preview(src, p) {
    if (!src) return '';
    let html = pills(fxText(src.fx));
    if (src.odds != null) {
      let o = typeof src.odds === 'function' ? src.odds(p) : src.odds;
      o = U.clamp(o + S.hadd('odds', p, src), 0.02, 0.98);
      const w = pills(fxText(src.win?.fx)), a = pills(fxText(src.alt?.fx));
      html += `<span class="dodds">${Math.round(o * 100)}%</span>${w || '<span class="dchip">success</span>'}${a ? `<span class="dodds alt">else</span>${a}` : ''}`;
    }
    return html ? `<span class="dchips small preview">${html}</span>` : '';
  }

  /* ---------- floating bar and card badges ---------- */
  let hideT;
  function show(d, label) {
    if (!S.hasDiff(d)) return;
    ui.lastDelta = { d, t: Date.now(), pid: S.W.playerId };
    let el = $('#dtoast');
    if (!el) { el = document.createElement('div'); el.id = 'dtoast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    el.innerHTML = `${label ? `<span class="dlabel">${esc(label)}</span>` : ''}${chips(d, { max: 10 })}`;
    el.classList.add('show');
    clearTimeout(hideT); hideT = setTimeout(() => el.classList.remove('show'), 4200);
    const card = $('#card'); if (card && S.me()) card.innerHTML = ui.cardHTML(S.me());
    // inside an open sheet, show the change next to its result too
    const res = $('#modal .result:last-of-type') || $('#modal .feed p');
    if (res && !res.querySelector('.dchips')) res.insertAdjacentHTML('beforeend', ' ' + chips(d, { small: 1 }));
    if (ui.sound) ui.sound.forDelta(d);
  }
  const card = ui.cardHTML;
  ui.cardHTML = p => {
    let html = card(p);
    const ld = ui.lastDelta;
    if (!ld || ld.pid !== p.id || Date.now() - ld.t > 5000) return html;
    for (const k of ORDER) if (ld.d[k]) html = html.replace(`data-k="${k}" `, `data-k="${k}" data-d="${num(ld.d[k])}" data-dir="${ld.d[k] > 0 ? 'up' : 'down'}" `);
    if (ld.d.$) html = html.replace('<div class="wealth">', `<div class="wealth" data-d="${ld.d.$ > 0 ? '+' : '−'}${esc(S.money(Math.abs(ld.d.$)))}" data-dir="${ld.d.$ > 0 ? 'up' : 'down'}">`);
    return html;
  };

  // measure every click (see main.js), and each year
  (ui.around ||= []).push({
    before: () => (S.W && S.me() && !S.W.dead ? { pid: S.W.playerId, s: S.snap(S.me()) } : null),
    after: (el, b) => { if (!b || !S.W || S.W.playerId !== b.pid || !S.me()) return; show(S.diff(b.s, S.snap(S.me()))); },
  });
  ui.onAged = (ui.onAged || []);
  ui.onAged.push(() => { const ly = S.W?.lastYear; if (ly && ly.pid === S.W.playerId) show(ly.d, `Age ${S.age(S.me())}`); });

  ui.dchips = chips; ui.dpreview = preview; ui.fxPills = fx => pills(fxText(fx));
  return { chips, preview, show, fxText, LAB };
})();
