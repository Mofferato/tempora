/* =====================================================================
   FAMILY TREE — SVG, generational layout with couples, pan and zoom.
   Roots are the topmost known ancestors of every life you have played.
   ===================================================================== */

(() => {
  const S = Sim, ui = UI, { $, esc } = ui;
  const NW = 156, NH = 54, SG = 16, HG = 20, VG = 70;
  const view = { root: null, x: 0, y: 0, k: 0.9, fitted: false, nodes: [], w: 0, h: 0 };

  function descendants(p) {
    const seen = new Set(), st = [p.id];
    while (st.length) { const id = st.pop(); if (seen.has(id)) continue; seen.add(id); S.P(id)?.kids.forEach(k => st.push(k)); }
    return seen;
  }
  const partnersOf = p => {
    const ids = new Set([p.sp, ...p.exes, ...S.kids(p).map(k => (k.fa === p.id ? k.mo : k.fa))].filter(x => x != null && S.P(x)));
    return [...ids].filter(id => id === p.sp || S.P(id).kids.some(k => p.kids.includes(k)));
  };

  function roots() {
    const top = new Map();
    const up = (p, seen) => { if (!p || seen.has(p.id)) return; seen.add(p.id); const ps = S.parents(p); if (!ps.length) top.set(p.id, p); ps.forEach(q => up(q, seen)); };
    S.W.dyn.played.map(S.P).filter(Boolean).forEach(p => up(p, new Set()));
    let list = [...top.values()].map(p => ({ p, d: descendants(p) }));
    // one entry per founding couple
    list = list.filter(r => !partnersOf(r.p).some(id => id < r.p.id && top.has(id)));
    // drop people who merely married into a larger line
    list = list.filter(r => !partnersOf(r.p).some(id => list.some(o => o !== r && !partnersOf(o.p).includes(r.p.id) && o.d.has(id))));
    return list.map(r => ({ p: r.p, d: r.d, n: r.d.size })).sort((a, b) => b.n - a.n);
  }

  function build(root) {
    const seen = new Set();
    const mk = (p, d) => {
      seen.add(p.id);
      const partners = partnersOf(p).filter(id => !seen.has(id)).map(S.P);
      partners.forEach(x => seen.add(x.id));
      const n = { p, partners, d, kids: [] };
      if (d < 60) for (const k of S.kids(p).sort((a, b) => a.born - b.born)) if (!seen.has(k.id)) n.kids.push(mk(k, d + 1));
      return n;
    };
    const t = mk(root, 0);
    const measure = n => {
      n.uw = NW * (1 + n.partners.length) + SG * n.partners.length;
      n.kw = n.kids.reduce((s, k) => s + measure(k), 0) + HG * Math.max(0, n.kids.length - 1);
      n.w = Math.max(n.uw, n.kw);
      return n.w;
    };
    measure(t);
    const nodes = [], links = [];
    let maxD = 0;
    const place = (n, left) => {
      n.x = left + (n.w - n.uw) / 2; n.y = n.d * (NH + VG); maxD = Math.max(maxD, n.d);
      nodes.push({ p: n.p, x: n.x, y: n.y });
      n.partners.forEach((q, i) => {
        const x = n.x + (i + 1) * (NW + SG);
        nodes.push({ p: q, x, y: n.y });
        links.push(`<path class="${q.id === n.p.sp ? 'tlink' : 'tmar'}" d="M${x - SG} ${n.y + NH / 2}H${x}"/>`);
      });
      let kx = left + (n.w - n.kw) / 2;
      for (const k of n.kids) { place(k, kx); kx += k.w + HG; }
      if (n.kids.length) {
        const x0 = n.partners.length ? n.x + NW + SG / 2 : n.x + NW / 2, y0 = n.partners.length ? n.y + NH / 2 : n.y + NH;
        const ym = n.y + NH + VG / 2, cx = n.kids.map(k => k.x + NW / 2);
        links.push(`<path class="tlink" d="M${x0} ${y0}V${ym}M${Math.min(x0, ...cx)} ${ym}H${Math.max(x0, ...cx)}${cx.map((c, i) => `M${c} ${ym}V${n.kids[i].y}`).join('')}"/>`);
      }
    };
    place(t, 0);
    return { nodes, links, w: t.w, h: (maxD + 1) * (NH + VG) - VG };
  }

  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  function nodeSVG({ p, x, y }) {
    const me = p.id === S.W.playerId, dead = !S.alive(p);
    const yrs = dead ? `${U.fmtYear(p.born)} – ${U.fmtYear(p.died)}` : `b. ${U.fmtYear(p.born)} · age ${S.age(p)}`;
    return `<g class="tn${me ? ' me' : ''}${dead ? ' dead' : ''}" data-id="${p.id}" transform="translate(${x},${y})" style="cursor:pointer">
      <title>${esc(S.fullName(p))}, ${esc(yrs)}</title>
      <rect class="box" width="${NW}" height="${NH}" rx="8"/>
      <rect x="0" y="0" width="5" height="${NH}" rx="2" fill="${ui.bornCol(p)}"/>
      <text class="nm" x="14" y="23">${dead ? '† ' : ''}${esc(clip(`${p.first} ${p.last}`, dead ? 16 : 18))}</text>
      <text class="yr" x="14" y="41">${esc(yrs)}</text>
      ${p.played ? `<text class="crown" x="${NW - 10}" y="18" text-anchor="end">◆</text>` : ''}</g>`;
  }

  ui.views.tree = () => {
    const rs = roots();
    if (!rs.length) return '<p class="muted">No family recorded yet.</p>';
    const pl = S.me();
    if (!view.root || !rs.some(r => r.p.id === view.root)) {
      const withMe = rs.filter(r => r.d.has(pl.id));
      view.root = (withMe.find(r => r.p.last === S.W.dyn.name) || withMe[0] || rs[0]).p.id;
      view.fitted = false;
    }
    const t = build(S.P(view.root));
    Object.assign(view, { nodes: t.nodes, w: t.w, h: t.h });
    const eras = [...new Set(t.nodes.map(n => S.eraOf(n.p.born)))];
    return `<div class="treebar"><label class="faint" for="treeRoot" style="font-size:13px">Line of</label>
        <select id="treeRoot" data-input="treeRoot">${rs.map(r => `<option value="${r.p.id}" ${r.p.id === view.root ? 'selected' : ''}>${esc(r.p.first)} ${esc(r.p.last)} (b. ${U.fmtYear(r.p.born)}) · ${r.n} descendants</option>`).join('')}</select>
        <span style="flex:1"></span>
        <button class="iconbtn" data-act="treeZoom" data-f="0.8" aria-label="Zoom out">−</button><button class="iconbtn" data-act="treeZoom" data-f="1.25" aria-label="Zoom in">+</button>
        <button class="btn sm" data-act="treeFit">Fit</button><button class="btn sm" data-act="treeMe">Find me</button></div>
      <div class="treewrap" id="treewrap"><svg id="treesvg" role="img" aria-label="Family tree, ${t.nodes.length} people"><g id="tv">${t.links.join('')}${t.nodes.map(nodeSVG).join('')}</g></svg></div>
      <div class="legend">${eras.map(e => `<span><i style="background:${ui.eraCol(e)}"></i>${esc(e.name)}</span>`).join('')}<span>◆ a life you played</span><span>— married · - - former partner</span></div>
      <p class="faint" style="font-size:13px;margin:8px 2px 0">Drag to pan. Scroll or pinch to zoom. Tap anyone to read their life, or become them.</p>`;
  };

  const apply = () => $('#tv')?.setAttribute('transform', `translate(${view.x},${view.y}) scale(${view.k})`);
  function zoomAt(pt, f) {
    const k2 = U.clamp(view.k * f, 0.12, 2.5); f = k2 / view.k;
    view.x = pt.x - (pt.x - view.x) * f; view.y = pt.y - (pt.y - view.y) * f; view.k = k2;
  }
  function fit() {
    const r = $('#treewrap').getBoundingClientRect();
    view.k = Math.min(1, (r.width - 40) / Math.max(1, view.w), (r.height - 40) / Math.max(1, view.h));
    view.x = (r.width - view.w * view.k) / 2; view.y = 20;
  }
  function findMe() {
    const r = $('#treewrap').getBoundingClientRect(), n = view.nodes.find(x => x.p.id === S.W.playerId);
    if (!n) return fit();
    view.k = Math.max(view.k, 0.75);
    view.x = r.width / 2 - (n.x + NW / 2) * view.k; view.y = r.height / 2 - (n.y + NH / 2) * view.k;
  }

  ui.afterTree = () => {
    const wrap = $('#treewrap'); if (!wrap) return;
    if (!view.fitted) { view.nodes.length > 14 ? findMe() : fit(); view.fitted = true; }
    apply();
    const pts = new Map(); let moved = 0, pinch = null, downEl = null;
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    wrap.onpointerdown = e => {
      downEl = e.target; wrap.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: dist(a, b), k: view.k }; }
      wrap.classList.add('drag');
    };
    wrap.onpointermove = e => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId), cur = { x: e.clientX, y: e.clientY };
      pts.set(e.pointerId, cur);
      if (pts.size === 1) { view.x += cur.x - prev.x; view.y += cur.y - prev.y; moved += Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y); }
      else if (pinch) {
        const [a, b] = [...pts.values()], r = wrap.getBoundingClientRect();
        zoomAt({ x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top }, (pinch.k * dist(a, b) / pinch.d) / view.k); moved += 10;
      }
      apply();
    };
    const up = e => {
      pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      if (!pts.size) wrap.classList.remove('drag');
      if (e.type === 'pointerup' && moved < 6) { const n = downEl?.closest?.('.tn'); if (n) ui.person(+n.dataset.id); }
    };
    wrap.onpointerup = up; wrap.onpointercancel = up;
    wrap.onwheel = e => { e.preventDefault(); const r = wrap.getBoundingClientRect(); zoomAt({ x: e.clientX - r.left, y: e.clientY - r.top }, Math.exp(-e.deltaY * 0.0015)); apply(); };
  };

  ui.input.treeRoot = el => { view.root = +el.value; view.fitted = false; ui.renderView(); };
  ui.on.treeZoom = el => { const r = $('#treewrap').getBoundingClientRect(); zoomAt({ x: r.width / 2, y: r.height / 2 }, +el.dataset.f); apply(); };
  ui.on.treeFit = () => { fit(); apply(); };
  ui.on.treeMe = () => { findMe(); apply(); };
})();
