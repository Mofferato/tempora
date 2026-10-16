/* =====================================================================
   IDENTITY — who you are beyond a name.
   * Ancestry (p.eth): the peoples your family comes from. Children
     inherit half from each parent, and the genes follow (a Han and a
     Yoruba parent make a child whose genome mixes both).
   * Nationalities (p.nats): you can hold several. Birthright, descent,
     marriage and naturalisation add them; countries that forbid dual
     citizenship make you choose at eighteen.
   * Names: suggestions for yourself, your children and your pets, drawn
     from the pool of your land and age; or write your own.
   * Old saves that used the combined regions (West Africa, the Levant…)
     are moved to real countries here.
   ===================================================================== */

const Identity = (() => {
  const S = Sim, A = Atlas, AT = DATA.atlas, yr = () => S.W.year;
  const at = cc => A.C(cc)?.at;
  const name = cc => (S.world && S.W ? S.world.name(cc) : A.C(cc)?.short) || cc;

  /* ---------- ancestry ---------- */
  const mixChance = (cc, y) => {
    const g = A.ethnic(cc, y), div = 1 - g.reduce((s, x) => s + x.s * x.s, 0);   // 0 = one people, ~1 = very mixed
    return U.clamp((y < 1500 ? 0.015 : y < 1900 ? 0.03 : y < 1990 ? 0.06 : 0.12) + div * (y < 1500 ? 0.06 : 0.22), 0.01, 0.55);
  };
  const clusterPool = k => (A.genCache && A.genCache['@' + k]) || null;
  function pickGroup(cc, y, notName) {
    const g = A.ethnic(cc, y).filter(x => x.n !== notName);
    return U.wpick(g.length ? g : A.ethnic(cc, y), x => x.s) || { n: 'local', k: null, s: 1 };
  }
  function rollEth(cc, y) {
    const a = pickGroup(cc, y);
    if (A.ethnic(cc, y).length > 1 && U.chance(mixChance(cc, y))) { const b = pickGroup(cc, y, a.n); return norm([{ n: a.n, k: a.k, s: 0.5 }, { n: b.n, k: b.k, s: 0.5 }]); }
    return [{ n: a.n, k: a.k, s: 1 }];
  }
  function norm(list) {
    const m = new Map();
    for (const x of list) { const e = m.get(x.n); if (e) e.s += x.s; else m.set(x.n, { n: x.n, k: x.k, s: x.s }); }
    let out = [...m.values()].sort((a, b) => b.s - a.s);
    const tot = out.reduce((s, x) => s + x.s, 0) || 1;
    out = out.map(x => ({ ...x, s: x.s / tot })).filter((x, i) => i === 0 || x.s >= 0.06);
    const t2 = out.reduce((s, x) => s + x.s, 0);
    return out.map(x => ({ ...x, s: +(x.s / t2).toFixed(3) }));
  }
  const merge = (fa, mo) => norm([...(eth(fa) || []).map(x => ({ ...x, s: x.s / 2 })), ...(eth(mo) || []).map(x => ({ ...x, s: x.s / 2 }))]);
  // a person's ancestry, made on demand for anyone who lacks it (old saves, strangers)
  function eth(p) {
    if (!p) return null;
    if (!p.eth) {
      const fa = S.P(p.fa), mo = S.P(p.mo);
      p.eth = fa && mo ? merge(fa, mo) : rollEth(p.cc || 'ENG', p.born);
    }
    return p.eth;
  }
  const pct = s => `${Math.round(s * 100)}%`;
  function ethText(p) {
    const e = eth(p); if (!e || !e.length) return '';
    if (e.length === 1) return e[0].n;
    if (e.length === 2 && Math.abs(e[0].s - 0.5) < 0.02) return `Half ${e[0].n}, half ${e[1].n}`;
    return e.map(x => `${pct(x.s)} ${x.n}`).join(' · ');
  }
  // a genome drawn from the people they belong to, not only the land they live in
  function genomeFor(e, cc, y, sex) {
    const part = [];
    for (const x of e) {
      const pool = (x.k && clusterPool(x.k)) || Gen.founding(cc, y);
      part.push([pool, x.s]);
    }
    // each allele frequency is the ancestry-weighted mean
    const tot = part.reduce((s, x) => s + x[1], 0);
    const m = { ht: [0, 0], bl: [0, 0], rh: 0, nose: '' }, noses = new Set();
    for (const [P, w0] of part) {
      const w = w0 / tot;
      for (const k of Gen.KEYS) m[k] = (m[k] || 0) + P[k] * w;
      m.ht[0] += P.ht[0] * w; m.ht[1] += P.ht[1] * w; m.bl[0] += P.bl[0] * w; m.bl[1] += P.bl[1] * w; m.rh += P.rh * w;
      String(P.nose || 'straight').split(' ').forEach(n => noses.add(n));
    }
    m.nose = [...noses].join(' ');
    return Gen.make(m, sex);
  }

  /* ---------- nationalities ---------- */
  const rules = cc => { const a = at(cc); return { cit: a?.cit || 'soli', dual: a?.dual || 'y' }; };
  const natsOf = p => { p.nats ||= [p.cc]; return p.nats; };
  const isCitizen = (p, cc = p.cc) => natsOf(p).includes(cc);
  // whether the set of nationalities is permitted by every country involved
  function conflict(nats) {
    if (nats.length < 2) return false;
    return nats.some(n => rules(n).dual === 'n') || (nats.length > 2 && nats.some(n => rules(n).dual === 'l'));
  }
  function natsForChild(c, fa, mo) {
    const set = [];
    for (const q of [fa, mo].filter(Boolean)) for (const n of natsOf(q)) if (!set.includes(n)) set.push(n);
    const r = rules(c.cc);
    const parentHere = [fa, mo].some(q => q && natsOf(q).includes(c.cc));
    const parentResident = [fa, mo].some(q => q && q.cc === c.cc);
    if (!set.includes(c.cc) && (r.cit === 'soli' || (r.cit === 'mix' && parentResident))) set.unshift(c.cc);
    else if (!set.length) set.push(c.cc);
    if (!parentHere && set.includes(c.cc) && set.length > 1) { set.splice(set.indexOf(c.cc), 1); set.unshift(c.cc); }
    return set;
  }
  // choose which nationalities to keep; the player is asked, everyone else keeps their home first
  function resolveConflict(p, quiet) {
    const nats = natsOf(p);
    if (!conflict(nats)) return;
    const home = nats.includes(p.cc) ? p.cc : nats[0];
    const keep = rules(home).dual === 'n' ? [home] : nats.filter(n => rules(n).dual !== 'n').slice(0, 2);
    if (p.id === S.W.playerId && !quiet) {
      const opts = nats.filter(n => rules(n).dual === 'n' ? true : true);
      S.prompt({
        title: 'Which country is yours?', text: `${nats.map(name).join(' and ')} do not allow dual nationality${nats.length > 2 ? ' beyond two' : ''}. You must choose which to keep.`,
        choices: opts.map(n => ({ l: `Keep ${name(n)}`, go: () => { p.nats = [n]; S.log(p, `You chose to be ${A.C(n)?.adj || name(n)} only.`, 'life'); return `You are now ${A.C(n)?.adj || name(n)}.`; } })),
      });
      p.flags.natPending = 1;
      return;
    }
    p.nats = keep;
  }

  /* ---------- naturalisation ---------- */
  const needYears = cc => { const r = rules(cc), t = A.tier(cc); return (r.cit === 'sang' ? 10 : r.cit === 'mix' ? 7 : 5) + (t >= 4 ? 1 : 0); };
  function resYears(p) { return p.res && p.res.cc === p.cc ? Math.max(0, U.span(p.res.y, yr())) : 0; }
  function descentClaims(p) {
    const out = new Set();
    for (const q of [...S.parents(p), ...S.grandparents(p)]) for (const n of natsOf(q)) if (!isCitizen(p, n) && rules(n).cit !== 'soli' && A.C(n)) out.add(n);
    return [...out];
  }
  function canApply(p, cc) {
    if (isCitizen(p, cc)) return { ok: false, why: 'Already a citizen.' };
    if (S.age(p) < 16) return { ok: false, why: 'Too young to apply.' };
    const sp = S.spouse(p), byMarriage = sp && natsOf(sp).includes(cc);
    const claim = descentClaims(p).includes(cc);
    if (claim) return { ok: true, route: 'descent', cost: 0.1, odds: 0.92 };
    if (p.cc !== cc) return { ok: false, why: `You must live in ${name(cc)} first.` };
    const need = byMarriage ? Math.ceil(needYears(cc) / 2.5) : needYears(cc), have = resYears(p);
    if (have < need) return { ok: false, why: `${need - have} more year${need - have > 1 ? 's' : ''} of residence${byMarriage ? '' : ' (marriage to a citizen shortens this)'}.` };
    return { ok: true, route: byMarriage ? 'marriage' : 'residence', cost: 0.25, odds: U.clamp(0.62 + p.rep / 300 + (p.edu || 0) * 0.03 + (p.money > 0 ? 0.05 : 0) - (S.activeWars().some(h => h.where?.includes(cc) && h.where?.includes(p.cc)) ? 0.5 : 0), 0.15, 0.95) };
  }
  function apply(cc) {
    const p = S.me(), c = canApply(p, cc), e = S.era();
    if (!c.ok) return c.why;
    if (p.did['nat:' + cc]) return 'You already applied this year.';
    const fee = S.toVal(e.cost * c.cost);
    if (p.money < fee) return `The application costs ${S.money(fee)}.`;
    const held = natsOf(p), after = [...held, cc];
    const blocks = c.route === 'descent' ? conflict(after) : (held.some(n => rules(n).dual === 'n') || rules(cc).dual !== 'y');
    if (blocks) return `${name(cc)} or one of your countries does not allow dual nationality${c.route === 'descent' ? '' : ' by naturalisation'}. Renounce one first.`;
    p.did['nat:' + cc] = 1; p.money -= fee;
    if (!U.chance(c.odds)) { S.log(p, `Your application for ${A.C(cc)?.adj || name(cc)} citizenship was refused.`, 'bad'); return 'Refused. You may try again next year.'; }
    natsOf(p).push(cc);
    S.log(p, `You became a ${A.C(cc)?.adj || name(cc)} citizen${c.route === 'descent' ? ', through your ancestors' : c.route === 'marriage' ? ', through marriage' : ''}.`, 'good');
    S.applyFx(p, { hp: 6, rep: 1 });
    return `You are now a citizen of ${name(cc)}.`;
  }
  function renounce(cc) {
    const p = S.me(), n = natsOf(p);
    if (!n.includes(cc)) return '';
    if (n.length < 2) return 'You would be stateless.';
    p.nats = n.filter(x => x !== cc);
    S.log(p, `You renounced your ${A.C(cc)?.adj || name(cc)} citizenship.`, 'life');
    return `You gave up your ${A.C(cc)?.adj || name(cc)} citizenship.`;
  }

  /* ---------- names ---------- */
  function suggest(sex, cc, y, n = 8) {
    const out = new Set();
    for (let i = 0; i < n * 6 && out.size < n; i++) out.add(S.pickName(sex, S.eraOf(y), cc, y));
    return [...out];
  }
  function surnames(cc, y, n = 5) {
    const pool = S.pool(S.eraOf(y), cc, y), out = new Set();
    for (let i = 0; i < n * 6 && out.size < n; i++) out.add(U.pick(pool.last));
    return [...out];
  }
  const PETS = { dog: ['Biscuit', 'Scout', 'Maple', 'Rex', 'Willow', 'Bruno', 'Pepper', 'Juno', 'Milo', 'Bear'], cat: ['Pumpkin', 'Shadow', 'Luna', 'Mochi', 'Ginger', 'Smokey', 'Olive', 'Tiger', 'Pearl', 'Miso'], horse: ['Thunder', 'Star', 'Comet', 'Duke', 'Ember', 'Storm', 'Sable', 'Willow'], default: ['Buddy', 'Clover', 'Nugget', 'Sunny', 'Pip', 'Dot', 'Ash', 'Fig'] };
  const petNames = (kind, n = 6) => U.shuffle(PETS[kind] || PETS.default).slice(0, n);

  // after the player has a baby, the player may name them
  const NAME_OPT = 'nameBabies';
  function askName(c, fa, mo) {
    const pl = S.me(); if (!pl || (pl.id !== fa.id && pl.id !== mo.id)) return;
    if ((S.W.opts || {})[NAME_OPT] === 'auto') return;
    const sug = suggest(c.sex, c.cc, yr(), 4).filter(x => x !== c.first).slice(0, 3);
    const rel = [fa, mo, ...S.parents(fa), ...S.parents(mo)].filter(x => x && x.sex === c.sex && S.alive(x) || x && x.sex === c.sex).slice(0, 2);
    const choices = [
      ...sug.map(n => ({ l: n, go: () => setName(c, n) })),
      ...rel.map(x => ({ l: `${x.first} (after ${S.relLabel(pl, x).toLowerCase() === 'you' ? 'yourself' : 'your ' + S.relLabel(pl, x).toLowerCase()})`, go: () => setName(c, x.first, true) })),
      { l: 'Write their name…', input: { ph: 'Their name', max: 24 }, go: () => setName(c, (S.promptValue || '').trim() || c.first) },
      { l: `Keep ${c.first}`, go: () => `You named your ${c.sex === 'M' ? 'son' : 'daughter'} ${c.first}.` },
    ];
    S.prompt({ title: `A ${c.sex === 'M' ? 'son' : 'daughter'}`, text: `You have a new baby. What will you call ${c.sex === 'M' ? 'him' : 'her'}?`, choices });
  }
  function setName(c, n, after) {
    n = n.replace(/[<>]/g, '').trim().slice(0, 24); if (!n) return '';
    c.first = n;
    for (const q of [S.P(c.fa), S.P(c.mo)]) if (q) for (const l of q.log.slice(-4)) l.t = l.t.replace(/Son .* was born|Daughter .* was born/, m => m);
    const pl = S.me();
    S.log(pl, `You named ${c.sex === 'M' ? 'your son' : 'your daughter'} ${n}${after ? ', a family name' : ''}.`, 'family');
    return `${n} it is.`;
  }

  /* ---------- migration of old saves ---------- */
  const REMAP = {};
  function remap(w) {
    if (w.v >= 3) return;
    const pickNew = old => {
      const group = A.LEGACY[old]; if (!group) return old;
      return U.wpick(group, c => Math.sqrt(Math.max(0.01, popGuess(c)))) || A.LEGACY_HOME[old];
    };
    const popGuess = c => A.C(c)?.pop ? A.C(c).pop.reduce((m, x) => x[0] <= 2000 ? x[1] : m, 1) : 1;
    for (const p of Object.values(w.people)) { if (A.LEGACY[p.cc]) { REMAP[p.cc + p.id] ||= pickNew(p.cc); p.cc = REMAP[p.cc + p.id]; } if (p.nats) p.nats = p.nats.map(n => A.LEGACY_HOME[n] || n); }
    for (const k of Object.keys(w.pops || {})) if (A.LEGACY[k]) delete w.pops[k];
    for (const k of Object.keys(w.nat || {})) if (A.LEGACY[k]) delete w.nat[k];
    for (const k of Object.keys(w.rel || {})) if (k.split('|').some(x => A.LEGACY[x])) delete w.rel[k];
    for (const o of Object.values(w.pets || {})) if (o.cc && A.LEGACY[o.cc]) o.cc = A.LEGACY_HOME[o.cc];
    w.v = 3;
  }


  /* ---------- creation: ancestry and a family from elsewhere ---------- */
  // opt.anc / opt.anc2: ancestry group names (one: that people; two: a child of both); opt.origin + opt.originSide: parents who came from another country
  function applyCreation(pl, { fa, mo, opt }) {
    if (!opt || (!opt.anc && !opt.origin)) return;
    const y = yr(), cc = pl.cc, W = S.W, all = Object.values(W.people);
    const grp = n => A.ethnic(cc, y).find(x => x.n === n) || { n, k: null, s: 1 };
    const side = { P: [S.P(fa.fa), S.P(fa.mo)], M: [S.P(mo.fa), S.P(mo.mo)] };
    const fromOrigin = (side0) => opt.origin && (opt.originSide === 'both' || opt.originSide === side0);
    const setFounder = (q, e, n, nat) => { q.eth = e; q.g = genomeFor(e, nat || cc, q.born, q.sex); q.nats = [nat || cc]; };
    for (const key of ['P', 'M']) {
      const origin = fromOrigin(key === 'P' ? 'M' : 'F') ;     // 'M' = the father's side came from abroad
      for (const q of side[key]) {
        if (!q) continue;
        if (origin) {
          const eo = rollEth(opt.origin, q.born);
          setFounder(q, eo, opt.origin, opt.origin);
          q.first = S.pickName(q.sex, S.eraOf(q.born), opt.origin, q.born);
          if (q.sex === 'M' && key === 'P') q.last = pl.last;
        } else if (opt.anc) {
          const a = key === 'P' ? grp(opt.anc) : grp(opt.anc2 || opt.anc);
          setFounder(q, [{ n: a.n, k: a.k, s: 1 }], cc, cc);
        }
      }
    }
    // the parents' own birth countries: immigrants hold their origin's nationality
    const homeNats = q => fromOrigin(q === fa ? 'M' : 'F') ? [opt.origin] : [cc];
    // everyone born of two known people is made again, oldest first
    const kids = all.filter(q => q.fa != null && q.mo != null && W.people[q.fa] && W.people[q.mo]).sort((a, b) => U.span(a.born, b.born) * -1);
    for (const q of kids) {
      const f = S.P(q.fa), m = S.P(q.mo);
      q.eth = merge(f, m); q.g = Gen.cross(f.g, m.g, q.sex);
      q.nats = (q === fa || q === mo) ? (fromOrigin(q === fa ? 'M' : 'F') ? [opt.origin] : [cc]) : natsForChild(q, f, m);
    }
    for (const q of [fa, mo]) { q.nats = homeNats(q); if (q.nats[0] !== cc) q.res = { cc, y: U.add(y, -U.ri(8, 25)) }; }
    pl.nats = natsForChild(pl, fa, mo); pl.eth = merge(fa, mo); pl.g = Gen.cross(fa.g, mo.g, pl.sex);
    // siblings and cousins born after the parents were fixed
    for (const q of all) if (q !== pl && (q.fa === fa.id && q.mo === mo.id)) { q.nats = natsForChild(q, fa, mo); q.eth = merge(fa, mo); q.g = Gen.cross(fa.g, mo.g, q.sex); }
  }
  S.addHook('onFamily', (pl, ctx) => applyCreation(pl, ctx));

  /* ---------- hooks ---------- */
  S.addHook('onCreate', (p, o) => {
    const fa = S.P(p.fa), mo = S.P(p.mo);
    if (fa && mo && fa.eth && mo.eth) p.eth = merge(fa, mo);
    else if (o.eth) p.eth = norm(o.eth);
    else { p.eth = rollEth(p.cc || 'ENG', p.born); p.g = genomeFor(p.eth, p.cc, p.born, p.sex); }
    p.nats = fa || mo ? natsForChild(p, fa, mo) : [p.cc];
  });
  S.addHook('onBirth', (c, fa, mo) => { if (S.W.opts?.[NAME_OPT] !== 'auto') askName(c, fa, mo); });
  S.addHook('preYear', p => {
    if (!p.res || p.res.cc !== p.cc) p.res = { cc: p.cc, y: yr() };
    natsOf(p);
    if (S.age(p) >= 18 && conflict(p.nats) && !p.flags.natPending) resolveConflict(p);
    if (p.flags.natPending && !conflict(p.nats)) delete p.flags.natPending;
  });
  S.addHook('tick', (p, e, a) => { if (a === 18 && p.id !== S.W.playerId && p.nats && conflict(p.nats)) resolveConflict(p, true); });
  S.addHook('migrate', w => remap(w));

  return { eth, ethText, rollEth, merge, norm, genomeFor, mixChance, rules, natsOf, isCitizen, conflict, canApply, apply, renounce, descentClaims, resYears, needYears, suggest, surnames, petNames, setName, name, remap };
})();
