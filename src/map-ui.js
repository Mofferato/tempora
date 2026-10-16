/* =====================================================================
   ATLAS — the world map and the strategy board.
   A canvas map of every country in the world, drawn from the map data
   and coloured by what you want to see: realms and empires, faith,
   wealth, population, internet, stability, government, or how every
   land stands toward yours. Drag to pan, wheel or pinch to zoom, tap a
   country for its page. Slide the clock back to see the world as it
   was. Lands you have not heard of stay in the fog.
   ===================================================================== */

LATE.push(() => {
  const S = Sim, ui = UI, A = Atlas, G = Geo, { $, esc, toast, render, sheet } = ui;
  const pct = v => `${Math.round(v * 100)}%`;
  const st = { mode: 'political', cx: 10, cy: -30, k: 3, sel: null, year: null, hover: null, w: 0, h: 0, fog: true, drag: null, dpr: 1 };
  const MODES = [
    ['political', 'Realms', 'Countries and empires'], ['faith', 'Faith', 'Majority belief'], ['wealth', 'Wealth', 'Prosperity of the land'], ['people', 'People', 'Population density'],
    ['culture', 'Culture', 'Cultural families'], ['gov', 'Rule', 'Kind of government'], ['net', 'Internet', 'Share online (from 1991)'], ['stab', 'Stability', 'Calm or unrest'], ['rel', 'Diplomacy', 'How lands stand toward yours'],
  ];
  const yearNow = () => S.W.year;
  const viewYear = () => (st.year == null ? yearNow() : Math.min(st.year, yearNow()));
  const live = () => viewYear() === yearNow();
  const nameAt = (id, y) => { const c = A.C(id); if (!c) return id; if (y === yearNow()) return S.world.name(id); for (const x of c.names) if (y <= x[0]) return x[1]; return c.names[c.names.length - 1][1]; };
  const shortName = n => n.replace(/^(the|The) /, '').replace(/ \(under .*\)$/, '');

  /* ---------- colour ---------- */
  const PAL_L = ['#d9b28c', '#9fc5a0', '#9db7d9', '#d9a0a0', '#c9b6e0', '#e0d28a', '#8fcfc8', '#e0a8c8', '#b9c98a', '#c8a07a'];
  const PAL_D = ['#8a6a4a', '#4f7a58', '#4a6a92', '#8f4f4f', '#6f5c92', '#8f8440', '#3f8580', '#8f5878', '#6f7f3f', '#7a5a3a'];
  const pal = () => (ui.isDark() ? PAL_D : PAL_L);
  let paintOf = null;
  function landColours() {
    if (paintOf) return paintOf;
    const ids = Object.keys(DATA.map.shapes).sort((a, b) => DATA.map.shapes[b].a - DATA.map.shapes[a].a), out = {};
    for (const id of ids) { const used = new Set(G.near(id).map(n => out[n]).filter(v => v != null)); let c = 0; while (used.has(c) && c < 9) c++; out[id] = c; }
    return (paintOf = out);
  }
  const FAITH_COL = { ch: '#d9a441', pr: '#d9784f', or: '#5f8fd0', co: '#8aa4d6', pe: '#e08a5f', su: '#3f9a6a', sh: '#2f7a5a', ib: '#6fb07a', ju: '#5a78c8', ba: '#a98fd0', hi: '#e8863a', bt: '#d6b132', bm: '#c9a02a', bv: '#c28a2a', sk: '#e0b050', jn: '#c9702a', sn: '#c25f85', cf: '#b85a5a', ct: '#a85a68', sc: '#9aa3ad', an: '#8b6b4a', tn: '#6a8aa8', pa: '#7a9a5a', ce: '#5a9a7a', no: '#4a7a9a', sl: '#8a9a4a', ag: '#c8a86a', eg: '#d8b04a', me: '#b89a5a', zo: '#d86a3a', ma: '#9a6a4a', in: '#a8784a', po: '#4a9aa8', ab: '#c27a4a', na: '#8a6a3a', at: '#9a7a3a', vo: '#a05a8a', ot: '#9a9a9a', fu: '#5ac0d0' };
  const FAM_COL = { folk: '#8b6b4a', ancient: '#b89a5a', abrahamic: '#6a8ad0', dharmic: '#e0a040', east: '#c25f6f', none: '#9aa3ad' };
  const GOV_COL = { monarchy: '#d9a441', const: '#e08fa0', republic: '#5f8fd0', party: '#c25050', theo: '#9a6ac8', tribal: '#7a9a5a', colony: '#d28fc0', charter: '#4fb0b0' };
  const CULT_COL = {};
  function cultCol(id) { return CULT_COL[id] ||= `hsl(${[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)} 45% ${ui.isDark() ? 42 : 68}%)`; }
  const ramp = (v, a, b) => { const t = Math.max(0, Math.min(1, v)); const m = x => Math.round(x[0] + (x[1] - x[0]) * t); return `rgb(${m([a[0], b[0]])},${m([a[1], b[1]])},${m([a[2], b[2]])})`; };
  const RAMP = () => (ui.isDark() ? [[40, 52, 68], [120, 190, 190]] : [[226, 232, 220], [28, 118, 128]]);
  const HEAT = () => (ui.isDark() ? [[170, 70, 64], [90, 170, 120]] : [[214, 100, 90], [94, 170, 120]]);

  function areaKm2(id) { const s = DATA.map.shapes[id]; const lat = s.c[1] * Math.PI / 180; return Math.max(5, s.a * 111 * 111 * Math.cos(lat)); }
  // the fill for a land in the current mode, and what the legend should say
  function fillOf(id, y, me) {
    const c = A.C(id), exists = c && y >= c.from;
    if (!exists) return ui.isDark() ? '#232932' : '#cfd6cc';
    const t = live();
    switch (st.mode) {
      case 'faith': { const f = Faith.mixAt(id, y)[0]?.[0]; return FAITH_COL[f] || FAM_COL[Faith.f(f).fam] || '#999'; }
      case 'wealth': return ramp(1 - (A.tier(id) - 1) / 4, ...RAMP());
      case 'people': { const d = (S.world.popAt(id) || 0) * 1e6 / areaKm2(id); return ramp(Math.log10(1 + d) / 2.6, ...RAMP()); }
      case 'culture': return cultCol(c.at?.cu?.id || 'x');
      case 'gov': { if (!t) return '#9aa3ad'; return GOV_COL[Pol.kindOf(id)] || '#999'; }
      case 'net': return y < 1991 ? (ui.isDark() ? '#2a313b' : '#dde3da') : ramp(A.net(id, y), ...RAMP());
      case 'stab': return t ? ramp((S.W.nat?.[id]?.stab ?? 60) / 100, ...HEAT()) : '#9aa3ad';
      case 'rel': {
        if (!t) return '#9aa3ad';
        if (id === me) return '#3a7bd5';
        if (G.allied(me, id)) return '#2fa36b';
        if (G.atWar(me, id)) return '#c0392b';
        return ramp((S.world.rel(me, id) + 100) / 200, ...HEAT());
      }
      default: { const po = A.polity(id, y); if (po) return po.color; return pal()[landColours()[id] % 10]; }
    }
  }
  function legend() {
    const sw = (c, t) => `<span class="lg"><i style="background:${c}"></i>${esc(t)}</span>`, y = viewYear();
    switch (st.mode) {
      case 'faith': { const seen = new Set(); const out = []; for (const id of Object.keys(DATA.map.shapes)) { const c = A.C(id); if (!c || y < c.from) continue; const f = Faith.mixAt(id, y)[0]?.[0]; if (f && !seen.has(f)) { seen.add(f); out.push([f, 0]); } } return out.slice(0, 9).map(([f]) => sw(FAITH_COL[f] || '#999', Faith.f(f).n.replace(/ Christianity| Islam| Buddhism/, m => m.trim().split(' ')[1] ? ' ' + m.trim().split(' ')[1] : ''))).join(''); }
      case 'wealth': return [1, 2, 3, 4, 5].map(t => sw(ramp(1 - (t - 1) / 4, ...RAMP()), ['Rich', 'Prosperous', 'Middling', 'Poor', 'Poorest'][t - 1])).join('');
      case 'people': return [[0.1, 'Empty'], [0.35, 'Sparse'], [0.6, 'Dense'], [1, 'Crowded']].map(([v, t]) => sw(ramp(v, ...RAMP()), t)).join('');
      case 'gov': return Object.entries({ monarchy: 'Monarchy', const: 'Constitutional', republic: 'Republic', party: 'One-party', theo: 'Theocracy', tribal: 'Tribal', colony: 'Colony' }).map(([k, t]) => sw(GOV_COL[k], t)).join('');
      case 'net': return [[0.05, '5%'], [0.35, '35%'], [0.65, '65%'], [0.95, '95%']].map(([v, t]) => sw(ramp(v, ...RAMP()), t)).join('');
      case 'stab': return [[0.1, 'Unrest'], [0.5, 'Uneasy'], [0.9, 'Calm']].map(([v, t]) => sw(ramp(v, ...HEAT()), t)).join('');
      case 'rel': return sw('#3a7bd5', 'Your land') + sw('#2fa36b', 'Ally') + sw(ramp(0.8, ...HEAT()), 'Friendly') + sw(ramp(0.5, ...HEAT()), 'Neutral') + sw(ramp(0.2, ...HEAT()), 'Hostile') + sw('#c0392b', 'At war');
      case 'culture': return '<span class="lg faint">Colour marks a cultural family</span>';
      default: return '<span class="lg faint">Colour marks a realm; empires cover several lands</span>';
    }
  }

  /* ---------- the canvas ---------- */
  let canvas, ctx, raf = 0, known = null, hit = null;
  const worldToScreen = (lon, lat) => [(lon - st.cx) * st.k + st.w / 2, (-lat - st.cy) * st.k + st.h / 2];
  const screenToWorld = (x, y) => [(x - st.w / 2) / st.k + st.cx, -((y - st.h / 2) / st.k + st.cy)];
  function clampView() {
    const minK = Math.max(st.w / 360, st.h / 142);
    st.k = Math.max(minK, Math.min(60, st.k));
    st.cx = Math.max(-180 + st.w / 2 / st.k, Math.min(180 - st.w / 2 / st.k, st.cx));
    st.cy = Math.max(-84 + st.h / 2 / st.k, Math.min(58 - st.h / 2 / st.k, st.cy));
  }
  function focusOn(id, zoom) {
    const s = DATA.map.shapes[id], sh = G.shape(id); if (!s) return;
    // the biggest piece of land, so far-off territories do not decide the zoom
    let best = null, ba = -1;
    for (const r of sh.rings) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } const a = (x1 - x0) * (y1 - y0); if (a > ba) { ba = a; best = [x0, y0, x1, y1]; } }
    const bb = best || s.bb;
    st.cx = (bb[0] + bb[2]) / 2; st.cy = -(bb[1] + bb[3]) / 2;
    if (zoom) { const w = Math.max(3, bb[2] - bb[0]), h = Math.max(3, bb[3] - bb[1]); st.k = Math.min(st.w / (w * 2.4), st.h / (h * 2.4), 24); }
    clampView();
  }
  function draw() {
    raf = 0; if (!canvas || !canvas.isConnected) return;
    const dark = ui.isDark(), y = viewYear(), me = S.me().cc;
    ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    ctx.fillStyle = dark ? '#0f1822' : '#cfe0ea'; ctx.fillRect(0, 0, st.w, st.h);
    // graticule
    ctx.strokeStyle = dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 30) { const [x] = worldToScreen(lon, 0); ctx.moveTo(x, 0); ctx.lineTo(x, st.h); }
    for (let lat = -60; lat <= 80; lat += 20) { const [, yy] = worldToScreen(0, lat); ctx.moveTo(0, yy); ctx.lineTo(st.w, yy); }
    ctx.stroke();
    const wars = live() ? G.fighting() : new Set();
    const ids = G.ids(), edge = dark ? 'rgba(10,14,20,.75)' : 'rgba(255,255,255,.8)';
    const fog = st.fog && live() ? known : null;
    for (const id of ids) {
      const sh = G.shape(id); if (!sh) continue;
      const [x0, y0] = worldToScreen(sh.bb[0], sh.bb[3]), [x1, y1] = worldToScreen(sh.bb[2], sh.bb[1]);
      if (x1 < -20 || y1 < -20 || x0 > st.w + 20 || y0 > st.h + 20) continue;
      const dim = fog && !fog.has(id);
      ctx.beginPath();
      for (const r of sh.rings) { for (let i = 0; i < r.length; i += 2) { const x = (r[i] - st.cx) * st.k + st.w / 2, yy = (-r[i + 1] - st.cy) * st.k + st.h / 2; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.closePath(); }
      ctx.fillStyle = dim ? (dark ? '#1a222d' : '#b9c3c8') : fillOf(id, y, me);
      ctx.fill();
      ctx.strokeStyle = id === st.sel ? '#fff' : id === st.hover ? (dark ? '#fff' : '#223') : edge; ctx.lineWidth = id === st.sel ? 2.4 : id === st.hover ? 1.8 : 0.6; ctx.stroke();
      if (wars.has(id) && !dim) { ctx.strokeStyle = 'rgba(210,50,40,.95)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]); }
      if (id === me && !dim) { ctx.strokeStyle = dark ? '#8fb4ff' : '#1b4fd1'; ctx.lineWidth = 2.2; ctx.stroke(); }
    }
    // microstates get a marker so they can be found and tapped
    for (const id of ids) {
      const sh = G.shape(id); if (!sh || !sh.pt) continue; if (fog && !fog.has(id)) continue;
      const c = A.C(id); if (!c || y < c.from) continue;
      const [x, yy] = worldToScreen(sh.c[0], sh.c[1]); if (x < 0 || yy < 0 || x > st.w || yy > st.h) continue;
      ctx.beginPath(); ctx.arc(x, yy, id === st.sel ? 5 : 3.2, 0, 7); ctx.fillStyle = fillOf(id, y, me); ctx.fill(); ctx.strokeStyle = dark ? '#000' : '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }
    // alliances and wars between capitals
    if (live() && st.mode === 'rel' && st.k > 2) {
      for (const x of G.state().allies) { const [a, b] = x.k.split('|'); if (fog && (!fog.has(a) || !fog.has(b))) continue; line(a, b, 'rgba(47,163,107,.9)'); }
      for (const h of S.activeWars()) if (h.a && h.b && (!fog || (fog.has(h.a) && fog.has(h.b)))) line(h.a, h.b, 'rgba(192,57,43,.95)', true);
    }
    // labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const labs = [];
    for (const id of ids) {
      const sh = G.shape(id); if (!sh) continue; const c = A.C(id); if (!c || y < c.from) continue; if (fog && !fog.has(id)) continue;
      const w = (sh.bb[2] - sh.bb[0]) * st.k, h = (sh.bb[3] - sh.bb[1]) * st.k;
      const [x, yy] = worldToScreen(sh.c[0], sh.c[1]); if (x < -30 || yy < -10 || x > st.w + 30 || yy > st.h + 10) continue;
      let nm = shortName(nameAt(id, y)); if (nm.length > 24) nm = c.short.replace(/^the /, '');
      const need = Math.min(110, nm.length * 5.6);
      if (w < need * (sh.pt ? 99 : 0.78) && id !== st.sel && id !== st.hover) continue;
      labs.push([id, nm, x, yy, Math.min(14, Math.max(9, w / (nm.length * 0.65)))]);
    }
    for (const [id, nm, x, yy, fs] of labs) {
      ctx.font = `${id === me ? '700 ' : '600 '}${Math.round(fs)}px system-ui, sans-serif`;
      ctx.strokeStyle = dark ? 'rgba(10,14,20,.85)' : 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.strokeText(nm, x, yy + (DATA.map.shapes[id].pt ? 11 : 0));
      ctx.fillStyle = dark ? '#eef2f6' : '#1b2430'; ctx.fillText(nm, x, yy + (DATA.map.shapes[id].pt ? 11 : 0));
    }
    // your own marker
    const ms = DATA.map.shapes[me];
    if (ms && live()) { const [x, yy] = worldToScreen(ms.c[0], ms.c[1]); ctx.beginPath(); ctx.arc(x, yy, 4.5, 0, 7); ctx.fillStyle = dark ? '#8fb4ff' : '#1b4fd1'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function line(a, b, col, dash) {
    const A_ = DATA.map.shapes[a], B_ = DATA.map.shapes[b]; if (!A_ || !B_) return;
    const [x0, y0] = worldToScreen(A_.c[0], A_.c[1]), [x1, y1] = worldToScreen(B_.c[0], B_.c[1]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - Math.hypot(x1 - x0, y1 - y0) * 0.18, x1, y1);
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash ? [6, 4] : []); ctx.stroke(); ctx.setLineDash([]);
  }
  const redraw = () => { if (!raf) raf = requestAnimationFrame(draw); };

  /* ---------- hit testing ---------- */
  function inRing(r, lon, lat) {
    let inside = false;
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
      if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function pick(px, py) {
    const [lon, lat] = screenToWorld(px, py), y = viewYear(); let best = null, bd = 1e9;
    for (const id of G.ids()) {
      const sh = G.shape(id); if (!sh) continue;
      if (sh.pt) { const [x, yy] = worldToScreen(sh.c[0], sh.c[1]); const d = Math.hypot(x - px, yy - py); if (d < 9 && d < bd) { best = id; bd = d; } continue; }
      if (lon < sh.bb[0] - 0.2 || lon > sh.bb[2] + 0.2 || lat < sh.bb[1] - 0.2 || lat > sh.bb[3] + 0.2) continue;
      for (const r of sh.rings) if (inRing(r, lon, lat)) return id;
    }
    return best;
  }

  /* ---------- the page ---------- */
  function view(p) {
    known = G.known(p);
    const y = viewYear(), sel = st.sel, fogOn = st.fog;
    const modes = MODES.filter(m => !(m[0] === 'net' && yearNow() < 1991)).map(([id, n, d]) => `<button class="chip" data-act="mapMode" data-v="${id}" aria-pressed="${st.mode === id}" title="${esc(d)}">${n}</button>`).join('');
    const eras = DATA.eras;
    return `<div class="mapbox"><div class="maptools"><div class="chips">${modes}</div></div>
      <div class="mapwrap" id="mapwrap"><canvas id="worldmap" aria-label="World map" tabindex="0"></canvas>
        <div class="mapzoom"><button class="iconbtn" data-act="mapZoom" data-v="1" aria-label="Zoom in">+</button><button class="iconbtn" data-act="mapZoom" data-v="-1" aria-label="Zoom out">−</button><button class="iconbtn" data-act="mapHome" aria-label="Centre on my land">◎</button></div>
        <div class="maptip" id="maptip" hidden></div>
        <div class="mapcard" id="mapcard" ${sel ? '' : 'hidden'}>${sel ? card(sel) : ''}</div></div>
      <div class="maplegend" id="maplegend">${legend()}</div>
      <div class="mapclock"><label for="mapyear">${live() ? 'Today' : 'Viewing'}: <b id="mapyearl">${U.fmtYearAD(y)}</b></label><input id="mapyear" type="range" min="-10000" max="${yearNow()}" step="10" value="${y}" data-input="mapYear" aria-label="Year shown on the map">
        ${live() ? '' : '<button class="btn sm" data-act="mapNow">Back to now</button>'}<label class="check" style="margin:0"><input type="checkbox" data-input="mapFog" ${fogOn ? 'checked' : ''}> Fog of war</label></div></div>
      <div id="mapsel" class="mapsel">${sel ? panel(sel) : intro()}</div>
      ${board(p)}`;
  }
  function intro() { return `<div class="panel"><p class="lede" style="margin:0">Tap any country to learn about it${st.fog ? '. Dark lands are still unknown to you; travel, trade and time will reveal them' : ''}. Drag to move, pinch or scroll to zoom, and slide the clock to see the world of another age.</p></div>`; }

  function panel(id) {
    const p = S.me(), y = viewYear(), c = A.C(id);
    if (!c) return '';
    if (known && st.fog && live() && !known.has(id)) return `<div class="panel"><div class="eyebrow">Unknown lands</div><h3 style="margin:2px 0 4px">Beyond your knowledge</h3><p class="faint" style="margin:0">Travellers speak of far countries here, but you know nothing yet. Meet people from there or travel closer.</p></div>`;
    if (y < c.from) return `<div class="panel"><div class="eyebrow">${esc(c.short)}</div><h3 style="margin:2px 0 4px">No one lives here yet</h3><p class="faint" style="margin:0">People first reach this land around ${esc(U.fmtYearAD(c.from))}.</p></div>`;
    const t = live(), at = c.at || {}, nm = nameAt(id, y), po = A.polity(id, y);
    const fm = Faith.mixAt(id, y).slice(0, 4), tier = A.tier(id);
    const pop = t ? S.world.popAt(id) : popAtYear(c, y);
    const nb = G.near(id).filter(n => A.C(n) && y >= A.C(n).from).slice(0, 8);
    const rel = t && id !== p.cc ? Math.round(S.world.rel(p.cc, id)) : null;
    const wars = t ? S.world.wars(id) : [];
    const allies = t ? G.alliesOf(id) : [];
    const rows = [];
    const ruler = t ? Pol.ruler(id) : null;
    rows.push(['Government', S.world.gov(id)?.replace(/^./, m => m.toUpperCase()) || '—']);
    if (ruler) rows.push(['Ruler', `${ruler.t || ''} ${ruler.n || ruler.first || ''}`.trim()]);
    rows.push(['People', fmtPop(pop)]);
    if (t) rows.push(['Capital', S.world.cap(id)]);
    if (t) { const cur = DATA.countries.find(x => x.id === id); rows.push(['Wealth', ['', 'High income', 'Prosperous', 'Middle income', 'Low income', 'Very poor'][tier]]); }
    if (y >= 1991) rows.push(['Online', pct(A.net(id, y))]);
    const bl = A.blocs(id, y).map(b => DATA.atlas.blocs[b][1]);
    if (bl.length) rows.push(['Blocs', bl.join(' · ')]);
    if (po) rows.push(['Part of', po.name]);
    if (allies.length) rows.push(['Allies', allies.slice(0, 5).map(a => shortName(S.world.name(a))).join(', ')]);
    const cu = A.culture(id, y);
    const btn = (act, txt, extra = '', cls = '') => `<button class="btn sm ${cls}" data-act="${act}" data-cc="${id}" ${extra}>${txt}</button>`;
    const acts = [];
    if (t && id !== p.cc) {
      acts.push(btn('mapTravel', `Visit (${esc(S.money(S.world.tripCost(p, id)))})`, '', 'era'), btn('mapMove', `Move there (${esc(S.money(S.world.tripCost(p, id) * 3))})`));
      if (!Identity.isCitizen(p, id)) { const ap = Identity.canApply(p, id); if (ap.ok) acts.push(btn('mapCitizen', 'Seek citizenship')); }
      acts.push(btn('mapInvest', 'Invest'));
      if (G.isLeader(p)) {
        acts.push(G.allied(p.cc, id) ? btn('mapDip', 'End alliance', 'data-k="break"') : btn('mapDip', 'Propose alliance', 'data-k="alliance"'), btn('mapDip', 'Trade pact', 'data-k="trade"'), btn('mapDip', 'Send aid', 'data-k="aid"'), btn('mapDip', 'Sanctions', 'data-k="sanction"'));
        if (S.world.wars(id).some(h => h.where.includes(p.cc))) acts.push(btn('mapDip', 'Send peace envoys', 'data-k="peace"'));
      }
    }
    return `<div class="panel cpanel"><div class="eyebrow">${esc(c.short)}${po ? ` · ${esc(po.name)}` : ''}</div><h3 style="margin:2px 0 4px">${esc(nm)}</h3>
      ${rel != null ? `<div class="faint" style="margin-bottom:6px">${relTag(rel)} Relations ${rel > 0 ? '+' : ''}${rel}${G.allied(p.cc, id) ? ' · allied with your land' : ''}</div>` : ''}
      ${wars.length ? `<p style="margin:0 0 6px"><span class="tag bad">${id !== p.cc && G.atWar(p.cc, id) ? 'At war with you' : 'At war'}</span> ${wars.filter(h => h.n.length < 42).map(h => esc(h.n)).join(', ')}</p>` : ''}
      <div class="kvs">${rows.map(([k, v]) => `<div class="kv"><b>${k}</b><span>${esc(v)}</span></div>`).join('')}</div>
      <div class="eyebrow" style="margin-top:10px">Belief</div><div class="ethbar">${fm.map(([f, v]) => `<i style="width:${v * 100}%;background:${FAITH_COL[f] || '#999'}" title="${esc(Faith.f(f).n)} ${pct(v)}"></i>`).join('')}</div>
      <div class="ethkey">${fm.map(([f, v]) => `<span><b style="background:${FAITH_COL[f] || '#999'}"></b>${esc(Faith.f(f).n)} ${pct(v)}</span>`).join('')}</div>
      <details style="margin-top:8px"><summary class="faint">Culture and customs</summary><div class="kvs" style="margin-top:6px">
        <div class="kv"><b>Marriage</b><span>${esc(Marriage.label(A.arranged(id, y)))}</span></div>
        <div class="kv"><b>Society</b><span>${cu.T >= 65 ? 'Tradition-bound' : cu.T <= 35 ? 'Change-seeking' : 'Balanced'} · ${cu.I >= 65 ? 'individualist' : cu.I <= 35 ? 'collectivist' : 'mixed'} · ${cu.R >= 65 ? 'devout' : cu.R <= 35 ? 'secular' : 'moderately religious'}</span></div>
        ${at.lg ? `<div class="kv"><b>Languages</b><span>${at.lg.map(esc).join(', ')}</span></div>` : ''}${at.cs ? `<div class="kv"><b>Customs</b><span>${at.cs.slice(0, 3).map(esc).join(' · ')}</span></div>` : ''}${at.tr ? `<div class="kv"><b>Notes</b><span>${at.tr.slice(0, 3).map(esc).join(' · ')}</span></div>` : ''}</div></details>
      ${nb.length ? `<div class="eyebrow" style="margin-top:10px">Neighbours</div><div class="chips">${nb.map(n => `<button class="chip" data-act="mapSelect" data-cc="${n}">${esc(shortName(nameAt(n, y)))}</button>`).join('')}</div>` : ''}
      ${acts.length ? `<div class="row-actions" style="margin-top:12px">${acts.join('')}</div>` : ''}</div>`;
  }
  function card(id) {
    const p = S.me(), y = viewYear(), c = A.C(id); if (!c) return '';
    const unk = known && st.fog && live() && !known.has(id);
    const nm = unk ? 'Unknown lands' : shortName(nameAt(id, y)), t = live() && !unk && y >= c.from;
    const pop = t ? S.world.popAt(id) : y >= c.from ? popAtYear(c, y) : 0;
    const rel = t && id !== p.cc ? Math.round(S.world.rel(p.cc, id)) : null;
    return `<button class="x" data-act="mapCardClose" aria-label="Close">✕</button><div class="eyebrow">${unk ? 'Beyond your knowledge' : esc(c.short)}</div><h4>${esc(nm)}</h4>
      <div class="faint">${unk ? 'Nothing is known of this land yet.' : y < c.from ? 'Nobody lives here yet.' : `${esc(fmtPop(pop))}${rel != null ? ` · ${relTag(rel)}` : ''}${t && id !== p.cc && G.atWar(p.cc, id) ? ' <span class="tag bad">at war</span>' : ''}`}</div>
      ${unk ? '' : `<div class="row-actions" style="margin-top:8px"><button class="btn sm era" data-act="mapDetails" data-cc="${id}">Details</button>${t && id !== p.cc ? `<button class="btn sm" data-act="mapTravel" data-cc="${id}">Visit</button>` : ''}</div>`}`;
  }
  const relTag = v => (v >= 50 ? '<span class="tag good">Close</span>' : v >= 15 ? '<span class="tag good">Friendly</span>' : v > -15 ? '<span class="tag">Neutral</span>' : v > -50 ? '<span class="tag bad">Tense</span>' : '<span class="tag bad">Hostile</span>');
  const fmtPop = m => (m >= 1000 ? `${(m / 1000).toFixed(2)} billion` : m >= 1 ? `${m.toFixed(m < 10 ? 1 : 0)} million` : m >= 0.001 ? `${Math.round(m * 1000).toLocaleString()} thousand` : 'a few hundred');
  function popAtYear(c, y) { const pts = c.pop || []; let v = pts[0]?.[1] ?? 0.001; for (let i = 0; i < pts.length; i++) { if (pts[i][0] <= y) v = pts[i][1]; else { const [y0, v0] = pts[i - 1] || pts[i]; const [y1, v1] = pts[i]; if (y1 > y0) v = v0 + (v1 - v0) * (y - y0) / (y1 - y0); break; } } return v; }

  /* ---------- the board under the map: powers, alliances, wars, news ---------- */
  function board(p) {
    const y = viewYear(), lands = G.ranking(y, 10);
    const hist = G.state().hist, prev = hist.length > 1 ? hist[hist.length - 2].top.map(x => x.cc) : [];
    const wars = live() ? S.activeWars().filter(h => h.where?.length > 1) : [];
    const allies = live() ? G.state().allies.slice(-8) : [];
    const news = live() ? S.W.news.filter(n => n.type === 'war' || n.type === 'politics' || n.type === 'revolution').slice(-8).reverse() : [];
    return `<div class="sec-h"><h3>Great powers${live() ? '' : ` in ${U.fmtYearAD(y)}`}</h3></div>
      <div class="list">${lands.map((x, i) => `<button class="row" data-act="mapSelect" data-cc="${x.cc}"><span class="flagchip">${i + 1}</span><div class="main"><div class="t">${esc(shortName(nameAt(x.cc, y)))}${x.cc === p.cc ? ' <span class="tag era">home</span>' : ''}</div><div class="s">${fmtPop(live() ? S.world.popAt(x.cc) : popAtYear(A.C(x.cc), y))} · ${['', 'high income', 'prosperous', 'middle income', 'low income', 'very poor'][A.tier(x.cc)]}${wars.some(h => h.where.includes(x.cc)) ? ' · at war' : ''}</div></div>
        <div class="end">${live() && prev.length ? (prev.indexOf(x.cc) < 0 ? '↑' : prev.indexOf(x.cc) > i ? '↑' : prev.indexOf(x.cc) < i ? '↓' : '') : ''}</div></button>`).join('')}</div>
      ${live() ? `<div class="sec-h"><h3>Wars and alliances</h3></div><div class="list">
        ${wars.map(h => `<div class="row"><span class="flagchip" style="--c:#c0392b">⚔</span><div class="main"><div class="t">${esc(h.n)}</div><div class="s">${h.where.slice(0, 6).map(c => esc(shortName(S.world.name(c)))).join(', ')}${h.world ? ' · a world war' : ''}</div></div></div>`).join('') || '<div class="row muted">No wars between nations at this time.</div>'}
        ${allies.map(x => { const [a, b] = x.k.split('|'); return `<div class="row"><span class="flagchip" style="--c:#2fa36b">⚑</span><div class="main"><div class="t">${esc(shortName(S.world.name(a)))} and ${esc(shortName(S.world.name(b)))}</div><div class="s">Allied since ${esc(U.fmtYearAD(x.y))}</div></div></div>`; }).join('')}</div>
      ${news.length ? `<div class="sec-h"><h3>Dispatches</h3></div><div class="list">${news.map(n => `<div class="row"><div class="main"><div class="t">${esc(n.t)}</div><div class="s">${esc(U.fmtYearAD(n.y))}</div></div></div>`).join('')}</div>` : ''}` : ''}`;
  }

  /* ---------- mounting and input ---------- */
  function mount() {
    canvas = $('#worldmap'); if (!canvas) return;
    const wrap = $('#mapwrap'); const r = wrap.getBoundingClientRect();
    st.dpr = Math.min(2, window.devicePixelRatio || 1);
    st.w = Math.round(r.width); st.h = Math.round(Math.max(300, Math.min(window.innerHeight * 0.62, st.w < 520 ? st.w * 1.05 : st.w * 0.52)));
    wrap.style.height = st.h + 'px';
    canvas.width = st.w * st.dpr; canvas.height = st.h * st.dpr; canvas.style.width = st.w + 'px'; canvas.style.height = st.h + 'px';
    ctx = canvas.getContext('2d');
    if (!st.init) { st.init = 1; focusOn(S.me().cc, true); if (st.k < 2.5) st.k = 2.5; clampView(); }
    else clampView();
    bind();
    redraw();
  }
  function bind() {
    const pts = new Map(); let start = null, pinch = null, moved = 0;
    const pos = e => { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, pos(e)); start = pos(e); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: st.k }; } });
    canvas.addEventListener('pointermove', e => {
      const p = pos(e);
      if (pts.has(e.pointerId)) {
        const o = pts.get(e.pointerId); pts.set(e.pointerId, p);
        if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; st.k = pinch.k * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d; }
        else { st.cx -= (p[0] - o[0]) / st.k; st.cy -= (p[1] - o[1]) / st.k; moved += Math.abs(p[0] - o[0]) + Math.abs(p[1] - o[1]); }
        clampView(); redraw(); tip(null);
      } else if (e.pointerType === 'mouse') { const id = pick(p[0], p[1]); if (id !== st.hover) { st.hover = id; tip(id, p); redraw(); } else if (id) tip(id, p); }
    });
    const up = e => { const was = pts.has(e.pointerId); pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (was && start && moved < 6 && pts.size === 0) { const id = pick(...pos(e)); select(id); } };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', e => { pts.delete(e.pointerId); pinch = null; });
    canvas.addEventListener('pointerleave', () => { if (st.hover) { st.hover = null; tip(null); redraw(); } });
    canvas.addEventListener('wheel', e => { e.preventDefault(); const [px, py] = pos(e), [lon, lat] = screenToWorld(px, py); st.k *= e.deltaY < 0 ? 1.18 : 1 / 1.18; clampView(); const [nx, ny] = worldToScreen(lon, lat); st.cx += (nx - px) / st.k; st.cy += (ny - py) / st.k; clampView(); redraw(); }, { passive: false });
    canvas.addEventListener('keydown', e => { const s = 20 / st.k; if (e.key === 'ArrowLeft') st.cx -= s; else if (e.key === 'ArrowRight') st.cx += s; else if (e.key === 'ArrowUp') st.cy -= s; else if (e.key === 'ArrowDown') st.cy += s; else if (e.key === '+') st.k *= 1.3; else if (e.key === '-') st.k /= 1.3; else return; e.preventDefault(); clampView(); redraw(); });
  }
  function tip(id, p) {
    const t = $('#maptip'); if (!t) return;
    if (!id) { t.hidden = true; return; }
    const y = viewYear(), unk = st.fog && live() && known && !known.has(id);
    t.textContent = unk ? 'Unknown lands' : shortName(nameAt(id, y));
    t.hidden = false; t.style.left = Math.min(st.w - 130, (p?.[0] ?? 0) + 12) + 'px'; t.style.top = Math.max(4, (p?.[1] ?? 0) - 28) + 'px';
  }
  function select(id) {
    st.sel = id; const box = $('#mapsel'); if (box) box.innerHTML = id ? panel(id) : intro();
    const cd = $('#mapcard'); if (cd) { cd.innerHTML = id ? card(id) : ''; cd.hidden = !id; }
    redraw();
  }
  const sync = () => { const lg = $('#maplegend'); if (lg) lg.innerHTML = legend(); redraw(); };

  (ui.afterRender ||= []).push(() => { if (ui.tab === 'map' && $('#worldmap')) mount(); });
  window.addEventListener?.('resize', () => { if (ui.tab === 'map' && $('#worldmap')) { mount(); } });

  ui.views.map = view;
  ui.extraTabs.push({ id: 'map', n: 'Atlas', order: 8 });
  ui.on.mapMode = el => { st.mode = el.dataset.v; document.querySelectorAll('[data-act="mapMode"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === st.mode))); sync(); };
  ui.on.mapSelect = el => { const id = el.dataset.cc; select(id); focusOn(id, false); redraw(); if ($('#modal .sheet')) sheet(panel(id), { label: 'Country' }); };
  ui.on.mapCardClose = () => select(null);
  ui.on.mapDetails = el => sheet(panel(el.dataset.cc), { label: 'Country' });
  ui.on.mapZoom = el => { st.k *= +el.dataset.v > 0 ? 1.5 : 1 / 1.5; clampView(); redraw(); };
  ui.on.mapHome = () => { focusOn(S.me().cc, true); redraw(); };
  ui.on.mapNow = () => { st.year = null; render(); };
  ui.input.mapYear = el => { st.year = +el.value; const l = $('#mapyearl'); if (l) l.textContent = U.fmtYearAD(viewYear()); if (st.mode === 'gov' || st.mode === 'stab' || st.mode === 'rel') st.mode = 'political'; sync(); const sel = $('#mapsel'); if (sel && st.sel) sel.innerHTML = panel(st.sel); };
  ui.input.mapFog = el => { st.fog = el.checked; redraw(); };
  const after = f => { S.settle?.(); render(); ui.save?.(); };
  ui.on.mapTravel = el => { const t = S.world.travel(el.dataset.cc); toast(t); after(); };
  ui.on.mapMove = el => { const t = S.world.emigrate(el.dataset.cc, true); toast(t); after(); };
  ui.on.mapInvest = el => { const t = S.world.invest(el.dataset.cc, 0.2); toast(t); after(); };
  ui.on.mapCitizen = el => { const t = Identity.apply(el.dataset.cc); toast(t); after(); };
  ui.on.mapDip = el => { const t = G.diplomacy(el.dataset.cc, el.dataset.k); toast(t); after(); };
  ui.mapState = st;
});
