/* =====================================================================
   GENETICS — genomes, inheritance, phenotype, population microevolution.
   A genome (p.g) is a set of allele pairs. Children get one allele of
   each pair from each parent (X-linked traits follow the X). Founders
   are sampled from their country's current allele frequencies, which
   drift, adapt and mix over the centuries (W.pops).
   ===================================================================== */

const Gen = (() => {
  const bit = f => (Math.random() < f ? 1 : 0);
  const pair = f => [bit(f), bit(f)];
  const bits = (n, f) => Array.from({ length: n }, () => bit(f));
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const sum = a => a.reduce((s, x) => s + x, 0);

  // Frequencies of rarer single-gene traits, the same everywhere
  const UNI = { myo: 0.2, ast: 0.15, lon: 0.05, twn: 0.12, lh: 0.3, dim: 0.3, hem: 0.0003, hun: 0.0002 };
  const WORLD = 'ENG FRA ITA GRC EGY CHN JPN IND WAF MEX IRN RUS LEV MSP ANA MAG SCA AND'.split(' ');
  const KEYS = ['sk', 'hd', 'rd', 'eb', 'eg', 'cu', 'lac', 'sc', 'cf', 'cb'];

  /* ---------- population frequencies (with microevolution) ---------- */
  // y: the ancestral pool before later migrations, where a land has one (genT)
  function founding(cc, y) {
    const c = DATA.countries.find(x => x.id === cc);
    if (!c) return founding('ENG', y);
    if (y != null && c.genT) { const t = c.genT.find(([until]) => y <= until); if (t) { const g = DATA.genPools[t[1]]; return { ...g, ht: g.ht.slice(), bl: g.bl.slice() }; } }
    if (c.gen) return { ...c.gen, ht: c.gen.ht.slice() };
    const mix = c.mix === 'world' ? Object.fromEntries(WORLD.map(k => [k, 1 / WORLD.length])) : c.mix;
    return blend(mix);
  }
  function blend(mix) {
    const out = { ht: [0, 0], bl: [0, 0], rh: 0, nose: '' }, noses = new Set();
    for (const [k, w] of Object.entries(mix)) {
      const g = DATA.countries.find(x => x.id === k).gen;
      KEYS.forEach(key => (out[key] = (out[key] || 0) + g[key] * w));
      out.ht[0] += g.ht[0] * w; out.ht[1] += g.ht[1] * w; out.bl[0] += g.bl[0] * w; out.bl[1] += g.bl[1] * w; out.rh += g.rh * w;
      g.nose.split(' ').forEach(n => noses.add(n));
    }
    out.nose = [...noses].join(' ');
    return out;
  }
  function pop(W, cc) {
    W.pops ||= {};
    if (!W.pops[cc]) W.pops[cc] = { ...founding(cc, W.year), adj: 0, hist: [] };
    return W.pops[cc];
  }
  // Called every few years: drift, selection and migration
  function evolve(W, year, step) {
    for (const c of DATA.countries) {
      if (year < c.from) continue;
      const P = pop(W, c.id), f0 = founding(c.id, year);
      const drift = 0.004 * Math.sqrt(step) / Math.sqrt(1 + Math.log10(1 + (Sim.hooks.popAt ? Sim.hooks.popAt(c.id, year) : 5)));
      for (const k of KEYS) P[k] = U.clamp(P[k] + gauss() * drift * Math.max(0.02, P[k] * (1 - P[k])) * 4, 0, 1);
      if (c.dairy && year >= (c.dairy === 1 ? -1e9 : c.dairy)) P.lac = Math.min(0.97, P.lac + 0.0006 * step * (1 - P.lac));   // milk-drinking favours lactase persistence
      // lands whose ancestry changes (hunter-gatherers, then farmers, then steppe herders) drift toward the new mix
      if (c.genT) { const tg = founding(c.id, year); for (const k of KEYS) if (k !== 'lac') P[k] += (tg[k] - P[k]) * 0.002 * step; P.ht[0] += (tg.ht[0] - P.ht[0]) * 0.002 * step; P.ht[1] += (tg.ht[1] - P.ht[1]) * 0.002 * step; }
      if (c.malaria) P.sc += (Math.max(f0.sc, 0.05) - P.sc) * 0.01 * step;                   // heterozygote advantage holds sickle cell steady
      else P.sc *= 1 - 0.002 * step;
      P.cf *= 1 - 0.0003 * step;
      // migration: the Americas mix after 1500, and the modern world mixes a little everywhere
      const target = c.mix ? founding(c.id) : null;
      const rate = (target && year > 1600 ? 0.004 : 0) + (year > 1950 ? 0.0006 : 0);
      if (rate) {
        const world = blend(Object.fromEntries(WORLD.map(k => [k, 1 / WORLD.length])));
        const goal = target || world;
        for (const k of KEYS) P[k] += (goal[k] - P[k]) * rate * step;
      }
      if (c.id === 'MEX' && year > 1521) for (const k of KEYS) P[k] += (blend({ MEX: 0.6, ITA: 0.3, WAF: 0.1 })[k] - P[k]) * 0.003 * step;
      if (year % 50 < step) P.hist.push([year, Object.fromEntries(KEYS.map(k => [k, +P[k].toFixed(3)]))]);
      if (P.hist.length > 120) P.hist.splice(0, P.hist.length - 120);
    }
  }

  /* ---------- making and crossing genomes ---------- */
  function make(P, sex) {
    const noses = P.nose.split(' ');
    const abo = () => { const r = Math.random(); return r < P.bl[0] ? 'A' : r < P.bl[0] + P.bl[1] ? 'B' : 'O'; };
    return {
      sk: bits(16, P.sk), hd: bits(6, P.hd), rd: pair(P.rd), e1: [bit(1 - P.eb), bit(1 - P.eb)], e2: pair(P.eg), cu: bits(4, P.cu),
      lac: pair(P.lac), sc: pair(P.sc), cf: pair(P.cf), cb: sex === 'M' ? [bit(P.cb)] : pair(P.cb), hem: sex === 'M' ? [bit(UNI.hem)] : pair(UNI.hem),
      myo: pair(UNI.myo), ast: pair(UNI.ast), lon: pair(UNI.lon), twn: pair(UNI.twn), lh: pair(UNI.lh), dim: pair(UNI.dim), hun: pair(UNI.hun),
      bl: [abo(), abo()], rh: [Math.random() < Math.sqrt(P.rh) ? '-' : '+', Math.random() < Math.sqrt(P.rh) ? '-' : '+'],
      hs: gauss(), fs: gauss(), nose: noses[Math.floor(Math.random() * noses.length)],
    };
  }
  const pick2 = a => a[Math.random() < 0.5 ? 0 : 1];
  const mut = v => (Math.random() < 0.002 ? 1 - v : v);
  function cross(fg, mg, sex) {
    const loci = (a, b) => { const out = []; for (let i = 0; i < a.length; i += 2) out.push(mut(a[i + (Math.random() < 0.5 ? 0 : 1)]), mut(b[i + (Math.random() < 0.5 ? 0 : 1)])); return out; };
    const p2 = k => [mut(pick2(fg[k])), mut(pick2(mg[k]))];
    const x = k => (sex === 'M' ? [pick2(mg[k])] : [fg[k][0], pick2(mg[k])]);
    return {
      sk: loci(fg.sk, mg.sk), hd: loci(fg.hd, mg.hd), rd: p2('rd'), e1: p2('e1'), e2: p2('e2'), cu: loci(fg.cu, mg.cu),
      lac: p2('lac'), sc: p2('sc'), cf: p2('cf'), cb: x('cb'), hem: x('hem'), myo: p2('myo'), ast: p2('ast'), lon: p2('lon'),
      twn: p2('twn'), lh: p2('lh'), dim: p2('dim'), hun: p2('hun'), bl: [pick2(fg.bl), pick2(mg.bl)], rh: [pick2(fg.rh), pick2(mg.rh)],
      hs: (fg.hs + mg.hs) / 2 + gauss() * 0.7, fs: (fg.fs + mg.fs) / 2 + gauss() * 0.8,
      nose: Math.random() < 0.9 ? pick2([fg.nose, mg.nose]) : pick2(['straight', 'aquiline', 'button', 'broad', 'snub', 'roman', 'flat']),
    };
  }

  /* ---------- phenotype ---------- */
  const SKIN = [['porcelain', '#F7E1D2'], ['fair', '#F0CDB3'], ['light', '#E5B894'], ['light olive', '#D8A67F'], ['medium', '#C68E66'], ['olive', '#B07A52'], ['tan', '#966541'], ['brown', '#7B4F32'], ['dark brown', '#5E3A25'], ['deep brown', '#43291A']];
  const EYES = { 'dark brown': '#3B2416', brown: '#5B3A21', hazel: '#8A6A35', green: '#5E8A4E', blue: '#4A7FB5', grey: '#8C98A3' };
  function hairOf(g, age) {
    const skin = sum(g.sk) / 16, dark = Math.min(1, (sum(g.hd) / 6) * 0.75 + skin * 0.35);
    let n, hex;
    if (g.rd[0] && g.rd[1] && dark < 0.8) [n, hex] = dark > 0.55 ? ['auburn', '#7A3520'] : dark > 0.3 ? ['red', '#A5431F'] : ['strawberry blonde', '#C7824E'];
    else [n, hex] = dark < 0.12 ? ['platinum blonde', '#E9D9A6'] : dark < 0.25 ? ['blonde', '#D6B56E'] : dark < 0.4 ? ['dark blonde', '#B08A4E'] : dark < 0.55 ? ['light brown', '#8A6040'] : dark < 0.7 ? ['brown', '#5E3F28'] : dark < 0.85 ? ['dark brown', '#3F2A1C'] : ['black', '#1E1714'];
    if (age >= 75) return { n: 'white', hex: '#E8E6E1', base: n };
    if (age >= 55) return { n: `grey (once ${n})`, hex: '#A9A6A0', base: n };
    if (age >= 45) return { n: `${n}, greying`, hex: mixHex(hex, '#A9A6A0', 0.4), base: n };
    return { n, hex, base: n };
  }
  function mixHex(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  const idRand = (id, salt) => { let x = Math.sin(id * 9301 + salt * 49297) * 233280; return x - Math.floor(x); };
  const nutrition = { ancient: -6, medieval: -7, renaissance: -6, colonial: -6, industrial: -8, wars: -4, modern: -1, digital: 0, near: 1, far: 2 };

  function phenotype(p, W, ctx) {
    const g = p.g; if (!g) return null;
    const age = ctx.age, o = p.phx || {};
    const skinI = o.skin ?? Math.min(9, Math.floor((sum(g.sk) / 16) * 10));
    const skinFrac = sum(g.sk) / 16;
    let eye;
    if (g.e1[0] || g.e1[1]) eye = (g.e2[0] || g.e2[1]) && idRand(p.id, 1) < 0.35 ? 'hazel' : skinFrac > 0.45 ? 'dark brown' : 'brown';
    else if (g.e2[0] || g.e2[1]) eye = 'green';
    else eye = sum(g.hd) <= 1 && idRand(p.id, 2) < 0.25 ? 'grey' : 'blue';
    if (o.eyes) eye = o.eyes;
    const hair = o.hair ? { n: o.hair[0], hex: o.hair[1], base: o.hair[0] } : hairOf(g, age);
    const curl = o.curl ?? sum(g.cu);
    const hairType = ['straight', 'wavy', 'wavy', 'curly', 'coily'][curl];
    const base = ctx.ht[p.sex === 'F' ? 1 : 0] + ctx.adj + (nutrition[ctx.era] || 0) + ((p.cls ?? 2) - 2) * 1.5;
    const adult = o.height ?? Math.round(base + g.hs * 6.5);
    const height = age >= 18 ? adult : Math.round(50 + (adult - 50) * Math.min(1, Math.pow(age / 17, 0.75)));
    const bmi = p.bmi ?? 22;
    const weight = Math.round(bmi * Math.pow(height / 100, 2));
    const abo = g.bl.includes('A') && g.bl.includes('B') ? 'AB' : g.bl.includes('A') ? 'A' : g.bl.includes('B') ? 'B' : 'O';
    const rh = g.rh.includes('+') ? '+' : '−';
    const conds = [];
    const both = k => g[k][0] && g[k][1], any = k => g[k].some(Boolean);
    const xl = k => (p.sex === 'M' ? g[k][0] : g[k][0] && g[k][1]);
    if (both('cf')) conds.push(['Cystic fibrosis', 'bad']); else if (any('cf')) conds.push(['Cystic fibrosis carrier', 'info']);
    if (both('sc')) conds.push(['Sickle cell disease', 'bad']); else if (any('sc')) conds.push(['Sickle cell trait: some protection from malaria', 'good']);
    if (xl('cb')) conds.push(['Colour blindness', 'info']);
    if (xl('hem')) conds.push(['Haemophilia', 'bad']);
    if (any('hun')) conds.push([age >= 40 ? "Huntington's disease" : "Huntington's gene (onset after 40)", 'bad']);
    if (!any('lac') && age >= 5) conds.push(['Lactose intolerant', 'info']);
    if (sum(g.myo) === 2 && age >= 8) conds.push(['Short-sighted', 'info']);
    if (both('ast')) conds.push(['Asthma', 'bad']);
    if (any('lon')) conds.push(['Longevity genes', 'good']);
    if (both('twn') && p.sex === 'F') conds.push(['Runs to twins', 'info']);
    const traits = [];
    if (both('lh')) traits.push('left-handed');
    if (any('dim')) traits.push('dimples');
    if (any('rd') && skinI <= 2) traits.push('freckles');
    return {
      skin: { n: SKIN[skinI][0], hex: SKIN[skinI][1], i: skinI }, eyes: { n: eye, hex: EYES[eye] }, hair: { ...hair, type: hairType, curl },
      nose: o.nose || g.nose, height, weight, bmi, blood: abo + rh, conds, traits,
    };
  }

  // Health consequences, used by engine hooks
  const effects = {
    mort(p, a, eraId) {
      const g = p.g; if (!g) return 1;
      let m = 1;
      const modern = ['modern', 'digital', 'near', 'far'].includes(eraId);
      if (g.lon[0] || g.lon[1]) m *= 0.8;
      if (g.cf[0] && g.cf[1]) m *= modern ? 1.6 : 3;
      if (g.sc[0] && g.sc[1]) m *= modern ? 1.4 : 2.2;
      if ((g.hun[0] || g.hun[1]) && a > 40) m *= 1 + (a - 40) / 12;
      if (g.ast[0] && g.ast[1]) m *= modern ? 1.05 : 1.2;
      if ((p.sex === 'M' ? g.hem[0] : g.hem[0] && g.hem[1])) m *= modern ? 1.2 : 2;
      return m;
    },
    catchMul(p, d) {
      const g = p.g; if (!g) return 1;
      if (/malaria/i.test(d.n) && (g.sc[0] || g.sc[1])) return 0.25;
      if (/asthma|pneumonia|consumption|tuberculosis/i.test(d.n) && g.ast[0] && g.ast[1]) return 1.5;
      return 1;
    },
    tick(p, a) {
      const g = p.g; if (!g) return;
      if ((g.hun[0] || g.hun[1]) && a > 40) { p.h = U.clamp(p.h - 3); p.sm = U.clamp(p.sm - 1); p.mh = U.clamp((p.mh ?? 60) - 2); }
      if (g.cf[0] && g.cf[1]) p.h = U.clamp(p.h - 1.5);
      if (g.sc[0] && g.sc[1]) p.h = U.clamp(p.h - 1);
    },
    colourBlind: p => !!p.g && (p.sex === 'M' ? p.g.cb[0] : p.g.cb[0] && p.g.cb[1]),
    twins: mo => !!mo.g && mo.g.twn[0] && mo.g.twn[1],
    fertility: p => U.clamp(Math.round(62 + (p.g ? p.g.fs : 0) * 14), 3, 99),
  };

  return { make, cross, phenotype, pop, evolve, founding, effects, SKIN, EYES, KEYS, mixHex };
})();
