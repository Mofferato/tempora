/* =====================================================================
   ATLAS — turns the compact country records (data-atlas-*.js) into the
   lands the engine knows (DATA.countries and the tables beside it), and
   answers questions about any country in any year:
     Atlas.faithMix(cc, y)   what people believe          Atlas.ethnic(cc, y)   who lives there
     Atlas.culture(cc, y)    values and customs           Atlas.arranged(cc, y) how many marriages are arranged
     Atlas.polity(cc, y)     whose banner flies over it   Atlas.net(cc, y)      share of people online
     Atlas.blocs(cc, y)      alliances and unions         Atlas.neighbors(cc)   land neighbours
   The old combined regions (West Africa, the Levant, Mesopotamia, Anatolia,
   the Maghreb, Scandinavia and the Andes) are replaced by their countries.
   A record is written with Land(`ID|Short name|Adjective|subregion  key=value; key=value`) — see
   the header of data-atlas-europe.js for every key.
   ===================================================================== */


const Atlas = (() => {
  const AT = DATA.atlas, MAP = () => DATA.map;
  const LEGACY = {
    WAF: ['NGA', 'GHA', 'SEN', 'GMB', 'MLI', 'BFA', 'NER', 'CIV', 'GIN', 'SLE', 'LBR', 'TGO', 'BEN', 'GNB', 'CPV', 'MRT'],
    LEV: ['SYR', 'LBN', 'JOR', 'ISR', 'PSE'], MSP: ['IRQ', 'KWT'], ANA: ['TUR', 'CYP'], MAG: ['MOR', 'DZA', 'TUN', 'LBY'],
    SCA: ['SWE', 'NOR', 'DNK', 'FIN', 'ISL'], AND: ['PER', 'BOL', 'ECU', 'COL'],
  };
  const LEGACY_HOME = { WAF: 'NGA', LEV: 'SYR', MSP: 'IRQ', ANA: 'TUR', MAG: 'DZA', SCA: 'SWE', AND: 'PER' };   // where an old save's people go
  // units of the game's value per US dollar, by era
  const ERA_U = [[1913, 30], [1945, 16], [1999, 6], [99999, 1]];
  const BOUND = [1913, 1945, 1999, 2029, 99999];
  const unitFor = y => ERA_U.find(([u]) => y <= u)[1];
  const GOV = { dem: 0.9, flaw: 0.65, hyb: 0.4, aut: 0.15, mon: 0.3, theo: 0.15, party: 0.1, mil: 0.1, col: 0.05 };
  const PRE_BY_SUB = {
    'eu-brit': 'euw', 'eu-nord': 'eun', 'eu-balt': 'eun', 'eu-west': 'euw', 'eu-cent': 'euc', 'eu-iber': 'euw', 'eu-ital': 'eus', 'eu-balk': 'balk', 'eu-east': 'eue',
    'as-cauc': 'cauc', 'as-anat': 'anat', 'as-levant': 'lev', 'as-mesop': 'mes', 'as-gulf': 'arab', 'as-iran': 'irn', 'as-cent': 'cen', 'as-sasia': 'india', 'as-easia': 'chin', 'as-seasia': 'seam',
    'af-north': 'mag', 'af-sahel': 'sah', 'af-west': 'waf', 'af-cent': 'cf', 'af-east': 'eaf', 'af-south': 'saf', 'af-ocean': 'mad',
    'am-north': 'nna', 'am-meso': 'mes_am', 'am-carib': 'car', 'am-andes': 'and', 'am-cone': 'con', 'am-braz': 'ama', 'oc-aus': 'aus', 'oc-mel': 'mel', 'oc-pol': 'pol', 'oc-mic': 'mic',
  };
  const CUR_BY_SUB = (sub, id) => /^eu-|as-cauc|as-anat/.test(sub) ? 'eu' : /as-(levant|mesop|gulf|iran|cent)|af-north|af-sahel/.test(sub) ? 'isl' : sub === 'as-easia' ? 'eas' : sub === 'as-sasia' ? 'sas' : sub === 'as-seasia' ? 'sea'
    : /af-(west)/.test(sub) ? 'waf' : /af-/.test(sub) ? 'saf' : sub === 'am-meso' || sub === 'am-andes' || sub === 'am-cone' || sub === 'am-braz' || sub === 'am-carib' ? 'ame' : 'pac';

  /* ---------- parsing ---------- */
  const on = v => !!v && v !== '0' && v !== 'no';
  const num = v => (v === '' || v == null ? null : +v);
  const list = (s, sep = '|') => (s ? s.split(sep).map(x => x.trim()).filter(Boolean) : []);
  function parse(text) {
    const nl = text.indexOf('\n'), head = (nl < 0 ? text : text.slice(0, nl)).trim(), body = nl < 0 ? '' : text.slice(nl + 1);
    const [id, short, adj, sub] = head.split('|').map(x => x.trim());
    const r = { id, short, adj, sub, f: {} };
    for (const part of body.split(';')) {
      const i = part.indexOf('=');
      if (i < 0) { if (part.trim()) r.f[part.trim()] = '1'; continue; }
      r.f[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
    return r;
  }
  // "until:Name:Gov|until:Name:Gov|Name:Gov" -> [[until, name, gov]]
  function timeline(s, shape) {
    const out = [];
    for (const e of list(s)) {
      const p = e.split(':');
      const hasUntil = /^-?\d+$/.test(p[0]) && p.length > shape;
      const until = hasUntil ? +p[0] : 99999, rest = hasUntil ? p.slice(1) : p;
      out.push([until, ...rest]);
    }
    return out;
  }
  // Records are written start-style: "1804:Name" means the name begins in 1804. The engine reads until-style
  // ("applies up to"), so the lists are converted: each entry ends the year before the next one starts.
  function startToUntil(arr) {
    const a = arr.map(x => x.slice());
    let prev = -1e9;
    for (const x of a) { if (x[0] === 99999) x[0] = Math.max(prev + 1, 2000); prev = x[0]; }
    return a.map((x, i) => [i + 1 < a.length ? a[i + 1][0] - 1 : 99999, ...x.slice(1)]);
  }
  const tlist = (f, key, shape) => (f[key + 'u'] ? timeline(f[key + 'u'], shape) : f[key] ? startToUntil(timeline(f[key], shape)) : []);
  const tstart = (f, key, shape) => (f[key + 'u'] ? (timeline(f[key + 'u'], shape)[0] || [99999])[0] : f[key] ? (timeline(f[key], shape)[0] || [99999])[0] - 1 : 99999);
  // "year>code:pct code:pct|year>..." -> [[year, [[code, pct]]]]
  function snaps(s) {
    return list(s).map(e => { const [y, mix] = e.split('>'); return [+y, mix.trim().split(/\s+/).map(x => { const [c, p] = x.split(':'); return [c, +p || 1]; })]; });
  }
  function eths(s) {
    return list(s, ',').map(e => { const m = e.match(/^(.*?):(\d+(?:\.\d+)?):([a-z0-9]+)(?:@(-?\d+))?$/); return m ? { n: m[1].trim(), s: +m[2], k: m[3], f: m[4] != null ? +m[4] : -99999 } : null; }).filter(Boolean);
  }
  function cultureOf(f, id) {
    const toks = (f.cu || 'anglo').split(/\s+/), base = AT.cult[toks[0]] || AT.cult.anglo, c = { ...base, id: toks[0] };
    for (const t of toks.slice(1)) { const m = t.match(/^([IHTFORG])(-?\d+)$/); if (m) c[m[1]] = U.clamp(c[m[1]] + +m[2], 0, 100); }
    return c;
  }
  const areaKm2 = (id, s) => { const lat = s.c[1]; const a = (s.a || 0) * 111.32 * 111.32 * Math.max(0.2, Math.cos(lat * Math.PI / 180)); return Math.max(a, 20); };

  /* ---------- building one land ---------- */
  function currency(rec, pre, arch) {
    const f = rec.f, cut = rec.cut, out = [];
    const auth = tlist(f, 'cur', 3), aStart = tstart(f, 'cur', 3);
    for (const x of pre.cur || []) if (x[0] <= cut && x[0] < aStart) out.push(x.slice());
    const first = aStart;
    const ca = AT.curA[f.ca || CUR_BY_SUB(rec.sub, rec.id)] || [];
    for (const x of ca) if (x[0] > cut && x[0] < first) out.push(x.slice());
    let prev = out.length ? out[out.length - 1][0] : cut;
    for (const [until, name, sym, v] of auth) {
      if (until <= 1450 || (until <= 1800 && +v >= 5)) { out.push([until, name, sym === '_' ? '' : sym, +v]); prev = until; continue; }
      let start = Math.max(prev, Math.min(until <= 1800 ? 1450 : 1800, until - 1));
      for (const b of BOUND) {
        if (start >= until) break;
        const end = Math.min(until, b);
        if (end > start) { out.push([end, name, sym === '_' ? '' : sym, +(v * unitFor(end)).toPrecision(3)]); start = end; }
      }
      prev = until;
    }
    if (!out.length || out[out.length - 1][0] < 99999) { const l = out[out.length - 1]; out.push([99999, l ? l[1] : 'barter goods', l ? l[2] : '', l ? l[3] : 8]); }
    // the old lands carried [until, ...]; make sure the last entry covers the future
    return out;
  }
  function popSeries(rec, pre, s) {
    const f = rec.f, from = rec.from;
    const km2 = areaKm2(rec.id, s), pm = f.pm ? +f.pm : 1, d = AT.dens[pre.d || 'agri_mid'], ys = AT.densYears, pts = [];
    ys.forEach((y, i) => { if (y >= from) pts.push([y, Math.max(0.0005, +(km2 * d[i] * pm / 1e6).toPrecision(2))]); });
    if (pts.length) { if (from > ys[0] && pts[0][0] > from) pts.unshift([from, 0.0005]); }
    else pts.push([from, 0.0005]);
    const auth = list(f.pop, ',').map(x => x.split(':').map(Number)).filter(x => x.length === 2);
    const keep = pts.filter(p => p[0] < 1700 || !auth.length || p[0] < auth[0][0] - 80);
    // lands whose densities fall short of (or overshoot) their known 1800 population are scaled up (or down) gradually
    if (auth.length && keep.length) {
      const near = keep.filter(p => p[0] <= 1700).pop();
      if (near && near[1] > 0.001) { const r = U.clamp(auth[0][1] / near[1], 0.1, 15); for (const p of keep) if (p[0] > 1) p[1] = Math.max(0.0005, +(p[1] * Math.pow(r, Math.min(1, (p[0] - 1) / 1699))).toPrecision(2)); }
    }
    const out = [...keep, ...auth];
    // trim the drop-outs: a series must rise in years
    out.sort((a, b) => a[0] - b[0]);
    const last = auth.length ? auth[auth.length - 1] : out[out.length - 1];
    const g = +(f.fut || 1);
    out.push([2400, +(last[1] * g).toPrecision(3)]);
    return out;
  }
  function genOf(spec) {
    // spec: [{ landId: weight }, { overrides }]
    const mixes = spec[0], over = spec[1] || {};
    const out = { ht: [0, 0], bl: [0, 0], rh: 0, nose: '' }, noses = new Set(), KEYS = ['sk', 'hd', 'rd', 'eb', 'eg', 'cu', 'lac', 'sc', 'cf', 'cb'];
    let tot = 0; for (const w of Object.values(mixes)) tot += w;
    for (const [k, w0] of Object.entries(mixes)) {
      const g = genOfLand(k); if (!g) continue; const w = w0 / tot;
      KEYS.forEach(key => (out[key] = (out[key] || 0) + g[key] * w));
      out.ht[0] += g.ht[0] * w; out.ht[1] += g.ht[1] * w; out.bl[0] += g.bl[0] * w; out.bl[1] += g.bl[1] * w; out.rh += g.rh * w;
      g.nose.split(' ').forEach(n => noses.add(n));
    }
    out.nose = [...noses].join(' ');
    for (const [k, v] of Object.entries(over)) out[k] = Array.isArray(v) ? v.slice() : v;
    KEYS.forEach(k => (out[k] = +out[k].toFixed(3)));
    out.ht = out.ht.map(Math.round); out.bl = out.bl.map(v => +v.toFixed(2)); out.rh = +out.rh.toFixed(2);
    return out;
  }
  const genCache = {};
  function genOfLand(k) { return genCache[k] || DATA.countries.find(c => c.id === k)?.gen; }

  function laws(rec) {
    const f = rec.f, out = [], from = rec.from;
    const sx = num(f.sx), wv = num(f.wv), dv = num(f.dv), ind = num(f.ind);
    if (ind) out.push([ind, 99999, `Independence${f.indFrom ? ' from ' + f.indFrom : ''}`]);
    if (wv) out.push([wv, 99999, 'Women win the vote']);
    if (dv) { if (dv > 1850) out.push([Math.max(from, num(f.dvb) || 1000), dv - 1, 'Divorce is not available under the law', { divorce: false }]); out.push([dv, 99999, 'Divorce legalised', { divorce: true }]); }
    // the digital era assumes same-sex marriage from 2001; each land says when it really did (or never)
    if (sx && sx <= 2001) out.push([sx, 99999, 'Same-sex marriage is legal', { sameSex: true }]);
    else { out.push([1946, sx ? sx - 1 : 99999, 'Same-sex marriage is not recognised', { sameSex: false }]); if (sx) out.push([sx, 99999, 'Same-sex marriage is legal', { sameSex: true }]); }
    for (const e of list(f.law)) {
      const m = e.match(/^(-?\d+)-(-?\d+|on):([^:]*)(?::(\w+)=(\w+))?$/);
      if (!m) continue;
      const o = m[4] ? { [m[4]]: m[5] === 'true' ? true : m[5] === 'false' ? false : isNaN(+m[5]) ? m[5] : +m[5] } : undefined;
      out.push(o ? [+m[1], m[2] === 'on' ? 99999 : +m[2], m[3].trim(), o] : [+m[1], m[2] === 'on' ? 99999 : +m[2], m[3].trim()]);
    }
    if (f.alc === 'ban') out.push([num(f.alcFrom) || 622, 99999, 'Alcohol is banned', { alcohol: false }]);
    return out.sort((a, b) => a[0] - b[0]);
  }
  const EVT = { pol: 'politics', war: 'war', rev: 'revolution', cult: 'culture', tech: 'tech', dis: 'disaster', fam: 'famine', law: 'law', plg: 'plague', mig: 'migration' };
  function events(rec, out) {
    for (const e of list(rec.f.ev)) {
      const m = e.match(/^(-?\d+)(?:-(-?\d+))?\s+(\w+)\s+(.*)$/);
      if (!m || !EVT[m[3]]) continue;
      let text = m[4], extra = [], par = {};
      const at = text.match(/\s@([A-Z0-9,]+)\s*$/); if (at) { extra = at[1].split(','); text = text.replace(at[0], ''); }
      const hs = text.match(/\s#([a-z0-9=.,\-]+)\s*$/); if (hs) { text = text.replace(hs[0], ''); for (const kv of hs[1].split(',')) { const [k, v] = kv.split('='); par[k] = +v; } }
      const y = +m[1], type = EVT[m[3]], where = [rec.id, ...extra];
      const h = { y, type, t: text, key: `${type}${y}${rec.id}${out.length}`, where };
      if (m[2]) h.end = +m[2];
      if (type === 'war') { const c = text.indexOf(':'); h.n = c > 0 ? text.slice(0, c) : text.replace(/\.$/, ''); h.t = c > 0 ? text.slice(c + 1).trim() : text; Object.assign(h, { draft: par.d ?? 0.08, mort: par.m ?? 0.05, civ: par.c ?? 0.005 }); if (c > 0) h.t = `${h.n}: ${h.t}`; }
      else if (type === 'famine') Object.assign(h, { n: par.n || 'Famine', mort: par.m ?? 0.03, dmg: par.h ?? 12 });
      else if (type === 'disaster') Object.assign(h, { p: par.p ?? 0.05, fx: { h: par.h ?? -10 }, loss: par.l ?? 0.2 });
      else if (type === 'revolution') h.strip = par.s ?? 0.2;
      else if (type === 'plague') Object.assign(h, { n: 'Epidemic', dn: par.dn || 'Plague', inf: par.i ?? 0.3, let: par.l ?? 0.2, dmg: par.h ?? 15, end: h.end ?? y });
      else if (type === 'migration') { h.mix = par.mix ?? 0.002; h.from = extra.length ? extra : []; h.where = [rec.id]; }
      out.push(h);
    }
  }
  function cityList(rec) {
    return list(rec.f.ci).map(e => { const p = e.split('~'); return [p[0].trim(), +p[1], +p[2] || 0, (p[3] || '').trim().replace(/:(\d+)/g, (m, n) => ':' + Math.min(7, +n))]; }).filter(x => x[3]);
  }

  /* ---------- the culture-flavoured events, activities and holidays every land gets ---------- */
  function flavour(rec, c, out) {
    const f = rec.f, id = rec.id, dishes = list(f.fd, ','), fests = list(f.fs, ','), sports = list(f.sp, ',');
    const withYear = (s, d) => { const m = s.match(/^(.*?)@(-?\d+)$/); return m ? [m[1].trim(), +m[2]] : [s.trim(), d]; };
    const ev = [], acts = [], hol = [];
    for (const d of dishes.slice(0, 3)) { const [n, y] = withYear(d, 1500); ev.push({ id: `dish-${id}-${U.slug(n)}`, p: 0.025, min: 3, from: y, t: `A neighbour brought you a bowl of ${n}. It was the best thing you ate all year.`, fx: { hp: 3, h: 1 } }); }
    if (dishes.length) { const [n, y] = withYear(dishes[0], 1500); acts.push({ id: `eat-${id}`, n: `Cook ${n} for the family`, d: 'A taste of home.', from: y, min: 8, c: 0.003, fx: { hp: [2, 5], mh: 1 }, t: `You made ${n} the way it has always been made. Everyone had seconds.` }); }
    for (const s of sports.slice(0, 2)) { const [n, y] = withYear(s, 1700); acts.push({ id: `sp-${id}-${U.slug(n)}`, n: `Take part in ${n}`, d: 'The local passion.', from: y, min: 6, c: 0.004, fx: { hp: [3, 7], h: 1 }, t: `You threw yourself into ${n} with the rest of the neighbourhood.` }); }
    for (const s of fests) { const [n, y] = withYear(s, 1000); hol.push([n, y]); }
    out.events = ev; out.acts = acts; out.hol = hol;
  }

  /* ---------- build everything ---------- */
  function build() {
    const D = DATA, byId = Object.fromEntries(D.countries.map(c => [c.id, c]));
    // genetic archetypes first, so records can use them
    for (const [k, spec] of Object.entries(AT.ga)) genCache['@' + k] = genOf(spec);
    const dep = {};   // data harvested from the retired combined lands
    for (const k of Object.keys(LEGACY)) dep[k] = { cities: D.cities[k] || [], events: D.countryEvents[k] || [], jobs: D.countryJobs[k] || [], acts: D.countryActs[k] || [], hol: D.holidays[k] || [] };
    const records = AT.raw.map(parse), built = new Set();
    for (const rec of records) {
      const f = rec.f, id = rec.id, old = byId[id];
      const preCode = (f.pre || PRE_BY_SUB[rec.sub] || 'euw').split(':')[0];
      const pre = AT.pre[preCode] || AT.pre.euw;
      rec.cut = f.pre && f.pre.includes(':') ? +f.pre.split(':')[1] : -1000;
      rec.from = f.from ? +f.from : (pre.from ?? -10000);
      const shape = MAP()?.shapes?.[id] || { c: [0, 0], a: 1, bb: [0, 0, 0, 0], pt: 0 };
      const cu = cultureOf(f, id);
      const at = { sub: rec.sub, cu, eth: eths(f.eth), rs: snaps(f.rs), pre: preCode, tier: +(f.tier || 3), mil: +(f.mil || 3), gv: f.gv || 'dem', net: f.net || '', cz: +(f.cz || 0), pp: +(f.pp || f.tier || 3),
        dual: f.dual || 'y', cit: f.cit || 'sang', ind: num(f.ind), col: f.col || '', arr: f.arr != null ? +f.arr / 100 : null, arrT: num(f.arrT),
        lg: list(f.lg, ','), fd: list(f.fd, ','), fs: list(f.fs, ','), cs: list(f.cs, '|'), sp: list(f.sp, ','), tr: list(f.tr, '|'),
        ov: list(f.ov).map(e => { const [p, a, b] = e.split(':'); return [p, +a, +b]; }), bl: list(f.bl).map(e => { const [b, y, t] = e.split(':'); return [b, +y || 0, t ? +t : 99999]; }),
        iso: id, ww: f.ww || '', hd: f.hd || '' };
      const nmA = tlist(f, 'nm', 2), capA = tlist(f, 'cap', 1);
      const nmS = tstart(f, 'nm', 2), capS = tstart(f, 'cap', 1);
      const names = [...(pre.n || []).filter(x => x[0] <= rec.cut && x[0] < nmS), ...nmA];
      const caps = [...(pre.cap || []).filter(x => x[0] <= rec.cut && x[0] < capS), ...capA];
      if (capA.length && capS > rec.cut + 1 && capS < 1500) caps.splice(caps.findIndex(x => x[0] >= capS - 1 + 1) < 0 ? caps.length : caps.findIndex(x => x[0] >= capS), 0, [capS - 1, capS < 600 ? 'a chiefly seat' : 'a royal seat']);
      if (!caps.length || caps[caps.length - 1][0] < 99999) { const l = caps[caps.length - 1]; caps.push([99999, l ? l[1] : rec.short]); }
      if (!names.length || names[names.length - 1][0] < 99999) { const l = names[names.length - 1]; names.push([99999, l ? l[1] : rec.short, l ? l[2] : 'Republic']); }
      // pools: the early pool, then the country's own
      const ncl = timeline(f.nc, 1);
      const pools = (ncl.length && ncl[0][0] > rec.cut ? [[rec.cut, pre.pool || 'meso']] : []).concat(ncl.map(x => [x[0] === 99999 ? 2029 : x[0], x[1]]));
      if (pools.length && pools[pools.length - 1][0] < 2029) pools.push([2029, pools[pools.length - 1][1]]);
      const c = old || { id };
      Object.assign(c, { short: old?.short || rec.short, adj: old?.adj || rec.adj, region: AT.subs[rec.sub] ? AT.subs[rec.sub][1] : 'asia', sub: rec.sub, from: old ? old.from : rec.from, at });
      if (!old) {
        const gspec = f.ga ? AT.ga[f.ga.split('+')[0]] : null;
        let gen = gspec ? genCache['@' + f.ga.split('+')[0]] : null;
        if (f.mix) { const mx = {}; for (const e of list(f.mix, ',')) { const [k, w] = e.split(':'); mx[k] = +w; } gen = genOf([mx, {}]); }
        if (f.gx) { try { gen = { ...gen, ...JSON.parse(f.gx.replace(/'/g, '"')) }; } catch { /* ignore a bad tweak */ } }
        Object.assign(c, { names, pools, cur: currency(rec, pre, f), cap: caps, pop: popSeries(rec, pre, shape), gen: JSON.parse(JSON.stringify(gen || genCache['@weur'])), laws: laws(rec), cls: null });
        if (pre.gt && !f.nogt) c.genT = pre.gt.map(x => x.slice());
        if (f.genT) c.genT = list(f.genT).map(e => { const [u, p] = e.split(':'); return [+u, p]; });
        if (f.dairy) c.dairy = f.dairy === '1' ? 1 : +f.dairy;
        if (on(f.malaria)) c.malaria = 1;
        if (on(f.fo)) c.fo = 1;
        if (on(f.fem)) c.fem = f.fem === '1' ? 1 : f.fem;
        const cls = list(f.cls).map(e => { const [a, b, names7] = e.split(':'); return [+a, +b, names7.split(',').map(s => s.trim())]; });
        if (cls.length) c.cls = cls; else delete c.cls;
        D.countries.push(c);
        const nlv = f.nl ? f.nl.split('/').map(Number) : pre.nl || [-5000, -5000, -3000];
        D.neolithic[id] = { farm: nlv[0], herd: nlv[1], copper: nlv[2] };
      } else if (old) {
        old.laws = [...(old.laws || []), ...laws(rec).filter(l => l[3] && 'sameSex' in l[3] && !(old.laws || []).some(x => x[3] && 'sameSex' in x[3]))];
      }
      const cl = cityList(rec); if (cl.length && !old) D.cities[id] = cl; else if (cl.length && old) D.cities[id] = cl;
      const ev = []; events(rec, ev); for (const h of ev) D.history.push(h);
      const fl = {}; flavour(rec, c, fl);
      D.countryEvents[id] = [...(D.countryEvents[id] || []), ...fl.events];
      D.countryActs[id] = [...(D.countryActs[id] || []), ...fl.acts];
      const hol = [...(D.holidays[id] || [])];
      if (!old && rec.from <= -9000) hol.unshift(['the midwinter gathering', -10000, -1000], ['the harvest moon feast', -9000, -500]);
      for (const [n, y] of fl.hol) hol.push([n, y]);
      D.holidays[id] = hol;
      const jb = list(f.jb);
      if (jb.length) D.countryJobs[id] = [...(D.countryJobs[id] || []), ...jb.map(e => { const [t, m, a, b] = e.split(':'); const o = {}; if (a) o.from = +a; if (b) o.to = +b; return [t, +m, o]; })];
      built.add(id);
    }
    retire(dep);
    patchHistory();
    // lookups
    AT.byId = Object.fromEntries(D.countries.map(c => [c.id, c]));
    AT.ids = D.countries.filter(c => c.at).map(c => c.id);
  }

  /* the combined regions give way to their countries; what they carried is shared out */
  const RETARGET = [
    [/Nok sculptors/, ['NGA']], [/Sundiata/, ['MLI', 'GIN', 'SEN', 'GMB', 'MRT', 'BFA']], [/Mansa Musa/, ['MLI', 'GIN', 'SEN', 'EGY']], [/Sonni Ali/, ['MLI', 'NER', 'BFA']], [/Moroccan musketeers/, ['MLI', 'NER']],
    [/Usman dan Fodio/, ['NGA', 'NER']], [/Britain unites Northern and Southern Nigeria|Nigeria wins independence|Nigerian Civil War/, ['NGA']], [/Bantu-speaking farmers/, ['NGA', 'CIV', 'GHA']],
    [/Sahara is green|rains fail over the Sahara/, ['EGY', 'LBY', 'DZA', 'MLI', 'NER', 'MRT', 'MOR']], [/Megalith builders/, ['FRA', 'ENG', 'MOR', 'DZA', 'TUN']],
    [/Jericho raises/, ['PSE']], [/Babylon destroys Jerusalem/, ['ISR', 'PSE', 'IRQ']], [/Rome crushes the Jewish revolt/, ['ISR', 'PSE']], [/Crusaders storm Jerusalem/, ['ISR', 'PSE', 'FRA', 'SYR', 'LBN']],
    [/War follows the founding of Israel/, ['ISR', 'PSE', 'JOR', 'SYR', 'LBN']], [/Civil war breaks out in Syria/, ['SYR']], [/Phoenician settlers/, ['TUN', 'LBN']],
    [/Sargon of Akkad|Hammurabi|temple scribes press|Abbasids found Baghdad|sack Baghdad/, ['IRQ']], [/Iran and Iraq/, ['IRQ', 'IRN']], [/American-led coalition invades Iraq/, ['IRQ', 'USA', 'ENG']],
    [/Hittites and Egyptians/, ['TUR', 'SYR', 'EGY']], [/Seljuks defeat/, ['TUR', 'GRC', 'ARM', 'GEO']], [/Ottomans take Constantinople/, ['TUR', 'GRC', 'BGR']], [/Ottoman sultanate is abolished/, ['TUR']],
    [/Rome destroys Carthage/, ['TUN', 'ITA']], [/France invades Algiers/, ['DZA', 'FRA']], [/Algerian War/, ['DZA', 'FRA']],
    [/Viking age begins/, ['SWE', 'NOR', 'DNK', 'ENG', 'FRA', 'IRL', 'ISL']], [/Doggerland/, ['ENG', 'DNK', 'NLD']],
    [/Pizarro/, ['PER', 'ECU', 'BOL', 'COL']], [/Epidemics brought from Europe sweep the Andes/, ['PER', 'ECU', 'BOL', 'COL']], [/Peru wins its independence/, ['PER', 'BOL']],
    [/Guest workers from/, ['FRA', 'DEU', 'NLD', 'BEL', 'SWE', 'TUR', 'MOR', 'DZA', 'TUN']], [/War in Syria drives millions/, ['TUR', 'SYR', 'DEU', 'SWE', 'FRA', 'GRC', 'LBN', 'JOR']],
    [/Climate refugees/, ['RUS', 'SWE', 'NOR', 'FIN', 'MRS']], [/Farmers cross the sea to Britain/, ['ENG', 'DNK', 'SWE', 'NLD']],
  ];
  function retire(dep) {
    const D = DATA, expand = (where, text) => {
      const out = new Set();
      for (const w of where) {
        if (!LEGACY[w]) { out.add(w); continue; }
        const hit = RETARGET.find(([rx, ids]) => rx.test(text) && ids.some(i => LEGACY[w].includes(i)));
        (hit ? hit[1] : LEGACY[w]).forEach(i => out.add(i));
      }
      return [...out];
    };
    for (const h of D.history) if (h.where) { h.where = expand(h.where, h.t); if (h.from) h.from = expand(h.from, h.t); }
    // cities: each goes to the land it stands in
    const CITY = { Gobero: 'NER', 'Dhar Tichitt': 'MRT', 'Jenne-Jeno': 'MLI', 'Koumbi Saleh': 'MRT', Timbuktu: 'MLI', Kano: 'NGA', Lagos: 'NGA', Eynan: 'ISR', Jericho: 'PSE', "'Ain Ghazal": 'JOR', Byblos: 'LBN', Tyre: 'LBN', Damascus: 'SYR', Jerusalem: 'ISR', Antioch: 'TUR',
      Jarmo: 'IRQ', Eridu: 'IRQ', Uruk: 'IRQ', Ur: 'IRQ', Babylon: 'IRQ', Nineveh: 'IRQ', Baghdad: 'IRQ', Basra: 'IRQ', 'Göbekli Tepe': 'TUR', 'Çatalhöyük': 'TUR', Troy: 'TUR', Hattusa: 'TUR', Ankara: 'TUR', Konya: 'TUR',
      Taforalt: 'MOR', Columnata: 'DZA', Carthage: 'TUN', Cirta: 'DZA', 'Hippo Regius': 'DZA', Tlemcen: 'DZA', Algiers: 'DZA', Stellmoor: 'DNK', 'Ertebølle': 'DNK', Sarup: 'DNK', Hedeby: 'DNK', Uppsala: 'SWE', Copenhagen: 'DNK', Stockholm: 'SWE', Oslo: 'NOR',
      'Huaca Prieta': 'PER', Caral: 'PER', 'Chavín de Huántar': 'PER', Tiwanaku: 'BOL', 'Chan Chan': 'PER', Cusco: 'PER', Lima: 'PER' };
    for (const [k, d] of Object.entries(dep)) {
      for (const city of d.cities) {
        const name = city[0].split('>')[0], to = CITY[name] || LEGACY_HOME[k];
        D.cities[to] ||= [];
        if (!D.cities[to].some(x => x[0] === city[0])) D.cities[to].push(city);
      }
      const members = LEGACY[k];
      for (const m of members) {
        D.countryEvents[m] = [...(D.countryEvents[m] || []), ...d.events.map(e => ({ ...e }))];
        D.countryJobs[m] = [...(D.countryJobs[m] || []), ...d.jobs];
        D.countryActs[m] = [...(D.countryActs[m] || []), ...d.acts.map(a => ({ ...a, id: a.id }))];
        for (const h of d.hol) if (!(D.holidays[m] ||= []).some(x => x[0] === h[0])) D.holidays[m].push(h);
      }
      for (const key of [k]) { delete D.cities[key]; delete D.countryEvents[key]; delete D.countryJobs[key]; delete D.countryActs[key]; delete D.holidays[key]; delete D.neolithic[key]; }
      const i = D.countries.findIndex(c => c.id === k); if (i >= 0) D.countries.splice(i, 1);
    }
    for (const m of Object.values(D.jobLocal)) for (const k of Object.keys(LEGACY)) if (k in m) { for (const to of LEGACY[k]) if (!(to in m)) m[to] = m[k]; delete m[k]; }
    for (const o of D.orgs || []) if (o.cc) o.cc = o.cc.flatMap(c => LEGACY[c] || [c]);
    // settler lands that blend old pools now blend the countries that replaced them
    for (const c of D.countries) if (c.mix && typeof c.mix === 'object') { const m = {}; for (const [k, w] of Object.entries(c.mix)) { const to = LEGACY_HOME[k] || k; m[to] = (m[to] || 0) + w; } c.mix = m; }
  }
  // the great shared events reach the new lands too
  function patchHistory() {
    const D = DATA, byKey = k => D.history.find(h => h.key === k);
    const lands = pred => D.countries.filter(c => c.at && pred(c.at.sub)).map(c => c.id);
    const add = (h, ids) => { if (h?.where) for (const i of ids) if (!h.where.includes(i)) h.where.push(i); };
    const eu = s => /^eu-/.test(s);
    add(byKey('plague1347'), lands(s => eu(s) || /as-(anat|levant|mesop|iran|cauc|cent)|af-north/.test(s)));
    add(byKey('plague541'), lands(s => eu(s) || /as-(anat|levant|mesop|iran)|af-north/.test(s)));
    add(byKey('war-1200'), lands(s => /eu-(balk|ital)|as-(anat|levant|mesop|iran)|af-north/.test(s)));
    for (const c of D.countries) {
      const ww = c.at?.ww; if (!ww) continue;
      if (ww.includes('1')) add(byKey('war1914'), [c.id]);
      if (ww.includes('2')) add(byKey('war1939'), [c.id]);
    }
  }

  /* ---------- queries ---------- */
  const C = id => AT.byId?.[id] || DATA.countries.find(c => c.id === id);
  const lerpMix = (a, b, t) => { const m = {}; for (const [k, v] of a) m[k] = (m[k] || 0) + v * (1 - t); for (const [k, v] of b) m[k] = (m[k] || 0) + v * t; return m; };
  const faithCache = {};
  function faithMix(cc, y) {
    const c = C(cc), rs = c?.at?.rs;
    if (!rs || !rs.length) return [['an', 1]];
    let i = rs.length - 1; while (i > 0 && rs[i][0] > y) i--;
    let mix;
    if (i >= rs.length - 1 || y < rs[0][0]) mix = Object.fromEntries(rs[Math.max(0, Math.min(i, rs.length - 1))][1]);
    else {
      const [y0, a] = rs[i], [y1, b] = rs[i + 1], t = U.clamp((y - y0) / Math.max(1, y1 - y0), 0, 1), inA = new Set(a.map(x => x[0]));
      mix = {};
      for (const [k, v] of a) mix[k] = (mix[k] || 0) + v * (1 - t);
      for (const [k, v] of b) mix[k] = (mix[k] || 0) + v * (inA.has(k) ? t : Math.max(0, (t - 0.55) / 0.45) * t);
    }
    let out = Object.entries(mix).filter(([k, v]) => v > 0 && AT.faiths[k] && AT.faiths[k].from <= y);
    if (!out.length) out = [['an', 1]];
    const tot = out.reduce((s, x) => s + x[1], 0);
    return out.map(([k, v]) => [k, v / tot]).sort((a, b) => b[1] - a[1]);
  }
  function ethnic(cc, y) {
    const c = C(cc), e = (c?.at?.eth || []).filter(x => x.f <= y);
    if (!e.length) return [{ n: c ? `${c.adj}` : 'Local', s: 1, k: 'weur' }];
    const tot = e.reduce((s, x) => s + x.s, 0);
    return e.map(x => ({ ...x, s: x.s / tot }));
  }
  function culture(cc, y = 2025) {
    const c = C(cc), cu = c?.at?.cu || AT.cult.anglo;
    const k = y < 1800 ? 0.0 : y < 1950 ? 0.5 : 1;       // equality of the sexes grows into the modern age
    return { ...cu, G: Math.round(cu.G * (0.35 + 0.65 * k)) };
  }
  function arranged(cc, y) {
    const c = C(cc), cu = c?.at?.cu; if (!cu) return 0.5;
    const a0 = cu.arr, a1 = c.at.arr ?? Math.max(0, cu.arr - 0.6);
    const mid = c.at.arrT ?? (c.region === 'europe' || c.region === 'oceania' ? 1780 : c.region === 'americas' ? 1820 : c.region === 'africa' ? 1985 : 1960);
    return U.clamp(a1 + (a0 - a1) / (1 + Math.exp((y - mid) / 25)), 0, 1);
  }
  function polity(cc, y) {
    const c = C(cc), best = (c?.at?.ov || []).filter(([, a, b]) => y >= a && y <= b).sort((p, q) => q[1] - p[1])[0];
    if (!best || !AT.polities[best[0]]) return null;
    const p = AT.polities[best[0]];
    return { id: best[0], name: p[0], color: p[1], adj: p[2] };
  }
  const TIER_CEIL = [0, 0.97, 0.9, 0.78, 0.6, 0.45];
  function net(cc, y) {
    const c = C(cc); if (!c?.at || y < 1991) return 0;
    const t = c.at.tier, ov = c.at.net ? c.at.net.split(':').map(Number) : null;
    const mid = ov ? ov[0] : 2000 + (t - 1) * 5 + 6, ceil = (ov && ov[1] != null ? ov[1] / 100 : TIER_CEIL[t]) + Math.max(0, (y - 2030) * 0.006);
    return U.clamp(Math.min(0.99, ceil) / (1 + Math.exp(-(y - mid) / 4.5)), 0, 0.99);
  }
  const blocs = (cc, y) => (C(cc)?.at?.bl || []).filter(([b, a, z]) => y >= a && y <= z && AT.blocs[b]).map(([b]) => b);
  const neighbors = cc => MAP()?.nb?.[cc] || [];
  const tier = cc => C(cc)?.at?.tier ?? 3;
  const subLabel = sub => AT.subs[sub]?.[0] || '';
  // feminine forms of family names, by language family
  function femSurname(cc, last, sex) {
    const c = C(cc), f = c?.fem; if (!f) return last;
    if (f === 1) { if (sex === 'F' && /(ov|ev|in)$/.test(last)) return last + 'a'; if (sex === 'M' && /(ova|eva|ina)$/.test(last)) return last.slice(0, -1); return last; }
    if (f === 'pl') { if (sex === 'F' && /(ski|cki|dzki)$/.test(last)) return last.slice(0, -1) + 'a'; if (sex === 'M' && /(ska|cka|dzka)$/.test(last)) return last.slice(0, -1) + 'i'; return last; }
    if (f === 'cz') { if (sex === 'F') return /ý$/.test(last) ? last.slice(0, -1) + 'á' : /ová$/.test(last) ? last : last + 'ová'; if (sex === 'M') return /ová$/.test(last) ? last.slice(0, -3) : /á$/.test(last) ? last.slice(0, -1) + 'ý' : last; return last; }
    if (f === 'lt') { if (sex === 'F' && /(as|is|us)$/.test(last)) return last.replace(/(as|is|us)$/, m => (m === 'as' ? 'ienė' : m === 'is' ? 'ienė' : 'ienė')); return last; }
    return last;
  }

  // the old combined region a land belongs to (or itself), so older rules written for those regions still apply
  const OLD = {}; for (const [k, ids] of Object.entries(LEGACY)) for (const i of ids) OLD[i] = k;
  const old = cc => OLD[cc] || cc;
  // share of the people following a family of faiths (islamic, abrahamic, ...) or one faith by code
  function share(cc, y, test) { let t = 0; for (const [k, v] of faithMix(cc, y)) if (test(AT.faiths[k], k)) t += v; return t; }
  const islamic = (cc, y) => share(cc, y, (f, k) => k === 'su' || k === 'sh' || k === 'ib') >= 0.5;
  const nordic = cc => OLD[cc] === 'SCA';

  build();
  return { C, old, share, islamic, nordic, faithMix, ethnic, culture, arranged, polity, net, blocs, neighbors, tier, subLabel, femSurname, LEGACY, LEGACY_HOME, GOV, build, genCache };
})();
