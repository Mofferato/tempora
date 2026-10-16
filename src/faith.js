/* =====================================================================
   FAITH — what people believe, and what it asks of them.
   Every person has a faith (p.faith) and a piety (p.piety, 0..100).
   * Children take their parents' faith; mixed households choose, and the
     modern world drifts toward doubt.
   * Practices (worship, fasting, pilgrimage, study, giving) are
     activities for the player, in each faith's own words.
   * Events: festivals, crises of faith, a calling to the clergy,
     missionaries, and prejudice against minorities.
   * Conversion is a real choice with real costs: the family's reaction
     depends on both faiths' attitudes toward leaving and tolerance.
   * Faiths differ on divorce, same-sex love, marrying outside the faith,
     and arranged marriage; the numbers come from data-faiths.js.
   ===================================================================== */

const Faith = (() => {
  const S = Sim, A = Atlas, F = DATA.atlas.faiths, yr = () => S.W.year;
  const f = id => F[id] || F.ot;
  const adj = id => f(id).adj || f(id).n;
  const mixAt = (cc, y = yr()) => A.faithMix(cc, y);
  const majority = (cc, y = yr()) => mixAt(cc, y)[0]?.[0] || 'an';
  const share = (cc, id, y = yr()) => (mixAt(cc, y).find(x => x[0] === id) || [0, 0])[1];

  /* ---------- who believes what ---------- */
  function seed(p) {
    const y = Math.min(yr(), U.add(p.born, 18));
    const m = mixAt(p.cc || 'ENG', y);
    return U.wpick(m, x => x[1])?.[0] || 'an';
  }
  const pietyOf = (id, y) => {
    const base = id === 'sc' ? U.ri(5, 30) : f(id).fam === 'folk' ? U.ri(30, 85) : U.ri(25, 90);
    return U.clamp(base - (y > 1950 ? 8 : 0) - (y > 2000 ? 7 : 0));
  };
  function childFaith(c, fa, mo) {
    const a = fa?.faith, b = mo?.faith;
    if (a && b && a === b) return U.chance(0.97) ? a : seed(c);
    if (a || b) {
      const pa = fa?.piety ?? 40, pb = mo?.piety ?? 40;
      // the more devout parent usually decides; the mother raises the children slightly more often in most societies
      const pick = U.chance(pa + 5 === pb ? 0.5 : (pa * (fa ? 1 : 0) + 8) / ((pa * (fa ? 1 : 0)) + (pb * (mo ? 1 : 0)) + 16)) ? a : b;
      return pick || a || b;
    }
    return seed(c);
  }
  function get(p) {
    if (!p) return 'an';
    if (!p.faith) {
      const fa = S.P(p.fa), mo = S.P(p.mo);
      p.faith = fa && mo && fa.faith && mo.faith ? childFaith(p, fa, mo) : seed(p);
      p.piety = Math.round(U.clamp((fa?.piety ?? pietyOf(p.faith, p.born)) * 0.6 + pietyOf(p.faith, p.born) * 0.4 + U.ri(-8, 8)));
    }
    return p.faith;
  }
  // the faiths of people who are close: partner, parents, children
  const circle = p => [S.spouse(p), ...S.parents(p), ...S.kids(p)].filter(x => x && S.alive(x));

  /* ---------- how faiths regard each other ---------- */
  function compat(a, b) {
    if (a === b) return 1;
    const A_ = f(a), B_ = f(b);
    let base = A_.fam === B_.fam ? (A_.fam === 'abrahamic' ? 0.62 : 0.8) : (A_.fam === 'none' || B_.fam === 'none') ? 0.78 : (A_.fam === 'folk' || B_.fam === 'folk') ? 0.55 : 0.5;
    if ((a === 'su' && b === 'sh') || (a === 'sh' && b === 'su')) base = 0.5;
    if ((a === 'ch' && b === 'pr') || (a === 'pr' && b === 'ch')) base = 0.7;
    return base * (0.55 + 0.45 * (A_.tol + B_.tol) / 2);
  }
  // how welcome a marriage across faiths is, 0..1
  const interfaith = (a, b) => (a === b ? 1 : U.clamp(((f(a).ifm + f(b).ifm) / 2) * compat(a, b) * 1.4, 0, 1));
  const minority = (p, y = yr()) => get(p) !== majority(p.cc, y) && share(p.cc, p.faith, y) < 0.25;
  const intolerant = (cc, y = yr()) => (f(majority(cc, y)).tol ?? 0.5) < 0.4;

  /* ---------- conversion ---------- */
  function conversionCost(p, id) {
    const old = get(p), O = f(old), N = f(id);
    // leaving a strict faith costs more with the family, and more with devout kin
    const strict = (1 - O.tol) * (O.fam === 'abrahamic' ? 1.2 : 0.7);
    return { strict: U.clamp(strict, 0.1, 1), accept: N.mis ?? 0.1 };
  }
  function convert(p, id, why = 'by choice') {
    const old = get(p); if (old === id) return 'You already follow it.';
    const { strict, accept } = conversionCost(p, id);
    p.faith = id; p.fhist = [...(p.fhist || []), { y: yr(), from: old, to: id }];
    p.piety = Math.round(U.clamp(40 + U.ri(0, 30) - (id === 'sc' ? 25 : 0)));
    const loss = [];
    for (const q of circle(p)) {
      if (get(q) !== old) continue;
      const r = S.rel(p, q), d = -Math.round(strict * (q.piety ?? 40) / 6) - U.ri(0, 4);
      if (d < 0) { r.c = U.clamp(r.c + d); loss.push(q); }
    }
    S.applyFx(p, { mh: [-2, 4], rep: minority({ ...p, faith: id, cc: p.cc }) ? -2 : 1 });
    S.log(p, `You ${why === 'by marriage' ? 'took your partner’s faith' : 'converted'} and became ${/^[aeiou]/i.test(adj(id)) ? 'an' : 'a'} ${adj(id)}${loss.length ? `. ${loss[0].first} took it hard` : ''}.`, 'life');
    return `You are now ${/^[aeiou]/i.test(adj(id)) ? 'an' : 'a'} ${adj(id)}.`;
  }
  // the faiths a person can turn to, here and now
  function options(p) {
    const y = yr(), here = new Set(mixAt(p.cc, y).map(x => x[0]));
    return DATA.atlas.convertible.filter(id => f(id).from <= y && id !== get(p) && (here.has(id) || (y >= 1850 && id !== 'fu') || y >= 2000))
      .filter(id => id !== 'fu' || y >= f('fu').from).sort((a, b) => share(p.cc, b, y) - share(p.cc, a, y));
  }

  /* ---------- practices ---------- */
  const PR = {
    w: { n: 'Worship', gain: 2, fx: { mh: [1, 3], hp: [1, 3] }, c: 0, t: 'A calm hour among your own people.' },
    f: { n: 'Fast', gain: 3, fx: { wp: 1, h: [-1, 1], mh: 1 }, c: 0, t: 'Hunger sharpened your focus, and your resolve.' },
    pg: { n: 'Pilgrimage', gain: 9, fx: { mh: [4, 9], hp: [4, 9], im: 2 }, c: 0.5, min: 14, t: 'The road was long. You came home changed.' },
    sc: { n: 'Study', gain: 2, fx: { sm: [1, 2], im: 1 }, c: 0, t: 'You read and reasoned, and understood a little more.' },
    ch: { n: 'Give', gain: 3, fx: { rep: [1, 3], hp: [1, 3] }, c: 0.04, t: 'You gave, and felt lighter for it.' },
  };
  function acts(p, e) {
    const id = get(p), fa = f(id), out = [];
    if (S.age(p) < 5 || fa.from > yr()) return out;
    for (const [k, d] of Object.entries(PR)) {
      if (!fa[k]) continue;
      if (id === 'sc' && (k === 'pg' || k === 'f')) continue;
      out.push({ id: `faith-${k}`, n: fa[k], d: `${d.n} · ${adj(id)}`, min: d.min || 6, c: d.c, cost: Math.round(e.cost * d.c * 100) / 100, kind: 'faith', pr: k, fx: d.fx, t: d.t });
    }
    return out;
  }
  S.addHook('acts', (p, e) => acts(p, e), 'cat');
  S.hooks.actKind ||= {};
  S.hooks.actKind.faith = (p, act) => {
    const d = PR[act.src.pr], fa = f(get(p)), y = yr();
    S.applyFx(p, d.fx);
    p.piety = U.clamp((p.piety ?? 40) + d.gain + U.ri(0, 2));
    if (act.src.pr === 'ch') S.pers?.nudge(p, 'generous', 0.5);
    if (act.src.pr === 'sc') S.pers?.nudge(p, 'diligent', 0.3);
    const extra = U.chance(0.15) ? ` ${fa.clergy ? `The ${fa.clergy} remembered your name.` : ''}` : '';
    return `${d.t}${extra}`;
  };

  /* ---------- the yearly drift ---------- */
  const secularTrend = y => (y < 1700 ? 0 : y < 1900 ? 0.15 : y < 1990 ? 0.35 : y < 2100 ? 0.5 : 0.3);
  function drift(p, a) {
    if (a < 14) return;
    get(p);
    const cc = p.cc, id = p.faith, maj = share(cc, id);
    let d = (maj > 0.6 ? 0.2 : -0.3) - secularTrend(yr()) * (1 - (A.culture(cc, yr()).R || 50) / 130) + (a > 55 ? 0.4 : 0) + U.rand(-1.4, 1.4);
    if (p.sick.length) d += 0.5;
    p.piety = U.clamp((p.piety ?? 40) + d);
    // the lapsed leave quietly
    if (id !== 'sc' && p.piety < 6 && yr() > 1800 && U.chance(0.12) && S.alive(p)) { p.faith = 'sc'; p.fhist = [...(p.fhist || []), { y: yr(), from: id, to: 'sc' }]; if (p.id === S.W.playerId) S.log(p, 'You stopped believing, and said so to nobody.', 'life'); }
  }
  S.addHook('tick', (p, e, a) => drift(p, a));
  S.addHook('onCreate', p => get(p));
  S.addHook('hpTarget', p => {
    if (!p.faith) return 0;
    const maj = share(p.cc, p.faith);
    return U.clamp(((p.piety ?? 40) - 40) / 30 * (maj > 0.5 ? 1 : 0.4), -0.5, 2) - (minority(p) && intolerant(p.cc) ? 1.2 : 0);
  }, 'add');
  S.addHook('relDrift', (p, o) => {
    const a = get(p), b = get(o);
    if (a === b) return (p.piety ?? 40) > 60 ? 0.6 : 0.2;
    const c = compat(a, b);
    return -(1 - c) * (((p.piety ?? 40) + (o.piety ?? 40)) / 160);
  }, 'add');

  /* ---------- events ---------- */
  function events(p) {
    const id = get(p), fa = f(id), cc = p.cc, a = S.age(p), out = [];
    if (a < 8) return out;
    const hd = fa.hd || [];
    if (hd.length) {
      const day = U.pick(hd), pious = (p.piety ?? 40) > 55;
      out.push({ id: 'fh-' + id, p: pious ? 0.24 : 0.14, min: 8, t: `It is ${day}. ${pious ? 'Your family has been preparing for days.' : 'Your relatives expect you to join in.'}`, ch: [
        { l: 'Observe it fully', fx: { $c: -0.02, hp: 5, mh: 3, famc: 4 }, t: `You kept ${day} properly, with ${fa.place ? `a visit to the ${fa.place} and ` : ''}the people you love.`, piety: 4 },
        { l: 'Join in a little', fx: { hp: 3, famc: 2 }, t: 'You took part, for family’s sake.', piety: 1 },
        { l: 'Skip it', fx: { famc: id === 'sc' ? 0 : -2, mh: 1 }, t: 'You let the day pass.', piety: -2 }] });
    }
    if (a >= 16 && id !== 'sc') {
      out.push({ id: 'fcrisis', p: 0.03 + (p.sick.length ? 0.03 : 0), min: 16, c: q => (q.piety ?? 40) >= 25, t: `A death, a book, a long night: you begin to doubt what ${adj(id)}s believe.`, ch: [
        { l: `Wrestle with it (${fa.sc || 'study'})`, odds: 0.6, win: { fx: { sm: 2, wp: 3, mh: 3 }, t: 'Your faith emerged deeper, and your own.', piety: 12 }, alt: { fx: { mh: -4 }, t: 'The questions stayed, unanswered.', piety: -10 } },
        { l: `Ask the ${fa.clergy || 'elders'}`, fx: { rep: 1, mh: 2 }, t: `The ${fa.clergy || 'elder'} listened and did not flinch.`, piety: 5 },
        { l: 'Let it go', fx: { mh: 3, famc: id === 'sc' ? 0 : -4 }, t: 'You drifted away from the faith you were raised in.', piety: -22 }] });
    }
    if (a >= 18 && a <= 45 && (p.piety ?? 40) >= 70 && id !== 'sc') {
      out.push({ id: 'fcall', p: 0.012, min: 18, max: 45, once: true, t: `You feel a calling to serve as ${/^[aeiou]/i.test(fa.clergy || 'priest') ? 'an' : 'a'} ${fa.clergy || 'priest'}.`, ch: [
        { l: `Take up the life of a ${fa.clergy || 'priest'}`, fx: { rep: 3, mh: 4, hp: 3 }, t: `You joined the ${fa.place || 'community'} as ${fa.clergy || 'a priest'}.`, piety: 12, job: true },
        { l: 'Serve as a layperson', fx: { rep: 1, hp: 2 }, t: 'You found other ways to serve.', piety: 4 },
        { l: 'Not for me', fx: {}, t: 'You set the thought aside.', piety: -3 }] });
    }
    if (a >= 14 && minority(p) && intolerant(cc)) {
      out.push({ id: 'fpreju', p: 0.1, min: 14, t: `Neighbours who follow ${adj(majority(cc))} ways turn on you for being ${adj(id)}.`, ch: [
        { l: 'Keep your head down', fx: { mh: -3, rep: -1 }, t: 'You stayed quiet and safe.', piety: -2 },
        { l: 'Stand your ground', odds: 0.5, win: { fx: { rep: 3, wp: 3, mh: 2 }, t: 'People came to respect you.', piety: 5 }, alt: { fx: { h: -8, hp: -5, rep: -2 }, t: 'It turned ugly, and you were hurt.', piety: 4 } },
        { l: `Convert to ${adj(majority(cc))} belief`, fx: { famc: -3 }, t: 'You changed faith to be left in peace.', convert: majority(cc) },
        { l: 'Leave the district', fx: { $c: -0.08, mh: -2 }, t: 'You moved to be among your own.', piety: 2 }] });
    }
    if (a >= 16 && a <= 60 && id !== majority(cc) && (f(majority(cc)).mis ?? 0) > 0.4) {
      out.push({ id: 'fmission', p: 0.04, min: 16, t: `Missionaries of ${adj(majority(cc))} faith come to your door with kind words and a bowl of food.`, ch: [
        { l: 'Hear them out', fx: { sm: 1, im: 2 }, t: 'You listened. The conversation stayed with you.', piety: -4 },
        { l: `Convert to ${adj(majority(cc))} belief`, fx: { hp: 3 }, t: 'You took their faith as your own.', convert: majority(cc) },
        { l: 'Politely decline', fx: {}, t: 'You wished them well, and meant it.', piety: 2 }] });
    }
    if (fa.pg && a >= 14 && (p.piety ?? 40) >= 40) {
      out.push({ id: 'fpilgrim', p: 0.025, min: 14, t: `A group from your community is setting out: ${fa.pg.toLowerCase()}.`, ch: [
        { l: 'Join them', fx: { $c: -0.4, mh: 6, hp: 6, im: 3 }, t: 'It was the journey of a lifetime.', piety: 10 },
        { l: 'Sponsor a traveller', fx: { $c: -0.1, rep: 3 }, t: 'You paid for another to go in your place.', piety: 4 },
        { l: 'Not this year', fx: {}, t: '', piety: 0 }] });
    }
    return out;
  }
  S.addHook('events', p => events(p), 'cat');
  // events carry two extra keys the engine does not know about: piety changes and conversions
  S.addHook('chose', (p, c, won) => {
    const src = c.src || c; let node = src;
    if (won === true && src.win) node = src.win; else if (won === false && src.alt) node = src.alt;
    if (node.piety) p.piety = U.clamp((p.piety ?? 40) + node.piety);
    if (node.convert) convert(p, node.convert, 'under pressure');
    if (node.job) {
      const e = S.era(), fa = f(get(p)), j = J(fa.clergy ? fa.clergy[0].toUpperCase() + fa.clergy.slice(1) : 'Priest', Math.round(e.cost * 0.7 * 100) / 100, { rep: 2, fame: 0.5 });
      j.id = 'clergy'; S.giveJob(p, j, e);
    }
  });

  return { f, adj, get, seed, childFaith, compat, interfaith, minority, intolerant, majority, share, mixAt, convert, options, conversionCost, acts, circle };
})();
