/* =====================================================================
   LEGACY — wills and inheritance, disputes, heirlooms, and the traits
   a family earns over the generations.
   * Write a will: shares of your estate for each heir, heirlooms to
     named people, a gift to charity. Without one, the law of your land
     and age decides (primogeniture, Islamic shares, or equal division).
   * Unequal or unwritten estates can end in a family dispute that the
     heir must settle, fight in court, or ignore.
   * Heirlooms are named possessions that carry their story and prestige
     down the generations.
   * Dynasty traits grow from what your family's lives achieved, and
     tilt every child born into the house. The house gets a motto and
     a coat of arms.
   ===================================================================== */

const Legacy = (() => {
  const S = Sim, W = () => S.W, yr = () => S.W.year;
  const ISL = ['EGY', 'IRN', 'MAG', 'MSP', 'LEV', 'ANA'];
  const HL = {
    prehistory: ['a carved bone amulet', 'an amber necklace', 'a polished jade axe'], ancient: ['a gold signet ring', 'a bronze mirror', 'a painted clay figure'],
    medieval: ['a sword with a named blade', 'an illuminated psalter', 'a silver chalice'], renaissance: ['a family portrait in oils', 'a jewelled rapier', 'a brass astrolabe'],
    colonial: ['a pocket watch', 'a family bible', 'a silver tea service'], industrial: ['a gold watch', 'a cameo brooch', 'a music box'],
    wars: ['a medal for valour', 'a wedding ring', 'a fountain pen'], modern: ['a vintage guitar', 'a signed photograph', 'a diamond ring'],
    digital: ['a first-edition book', 'a designer watch', 'a vinyl collection'], near: ['a memory crystal', 'a hand-built robot'], far: ['a star-chart of the family voyages', 'a relic from Old Earth'],
  };
  const isHL = a => a.kind === 'heirloom';

  /* ---------- heirlooms ---------- */
  function makeHeirloom(p, t, val, how, name) {
    const a = { uid: W().nid++, id: 'heirloom', t: name ? `${name} (${t})` : t[0].toUpperCase() + t.slice(1), kind: 'heirloom', val, appr: 0.015, inc: 0, vol: 0, era: S.era().id, y: yr(),
      hl: { made: yr(), maker: p.id, prestige: 1, story: [{ y: yr(), who: p.id, t: how }] } };
    p.assets.push(a);
    return a;
  }
  function commission(kind, name) {
    const p = S.me(), e = S.era(), list = HL[e.id] || HL.modern;
    const t = list[+kind] || list[0], price = S.toVal(e.cost * (0.4 + (+kind) * 0.3));
    if (S.age(p) < 16) return 'You are too young to commission an heirloom.';
    if (p.money < price) return `That would cost ${S.money(price)}.`;
    p.money -= price;
    const a = makeHeirloom(p, t, price * 0.8, 'commissioned', (name || '').trim().slice(0, 30));
    S.applyFx(p, { hp: 4, rep: 1 });
    S.log(p, `You commissioned ${t} to hand down in the family: ${a.t}.`, 'good');
    return `${a.t} will pass down the generations.`;
  }
  S.addHook('fx', (p, fx) => { if (fx.heirloom && p.id === W().playerId) makeHeirloom(p, fx.heirloom, S.toVal(S.era().cost * 0.2), fx.how || 'earned'); });
  // medals and trophies become heirlooms
  S.addHook('postYear', p => {
    if ((p.flags.medal || 0) > (p.flags.medalHL || 0)) { p.flags.medalHL = p.flags.medal; makeHeirloom(p, 'a medal for valour', S.toVal(S.era().cost * 0.2), 'won in battle'); S.log(p, 'You were given a medal for valour. It will be handed down.', 'good'); }
    if ((p.flags.olympic || 0) > (p.flags.olyHL || 0)) { p.flags.olyHL = p.flags.olympic; makeHeirloom(p, 'an Olympic gold medal', S.toVal(S.era().cost * 0.5), 'won at the Olympic Games'); }
    for (const a of p.assets.filter(isHL)) { S.applyFx(p, { rep: Math.min(1.5, a.hl.prestige * 0.15), hp: 0.5 }); }
  });
  S.addHook('events', p => {
    const hls = p.assets.filter(isHL); if (!hls.length) return [];
    const a = U.pick(hls);
    return [
      { id: 'appraiser', p: 0.03, min: 18, t: `A collector offers a fortune for ${a.t.toLowerCase()}.`, ch: [{ l: 'Sell it', go: 'sellhl:' + a.uid, t: 'The collector left with it. The family will not forgive you soon.' }, { l: 'It is not for sale', fx: { rep: 2, mh: 2 }, t: 'Some things are worth more than money.' }] },
      { id: 'hlstory', p: 0.04, min: 8, t: `Over dinner, someone told the story of ${a.t.toLowerCase()} again.`, fx: { hp: 3, famc: 3 } },
      { id: 'hllost', p: 0.01, min: 10, t: `${a.t} has gone missing!`, ch: [{ l: 'Search everywhere', odds: 0.6, win: { t: 'It turned up behind a chest. Everyone breathed again.' }, alt: { go: 'losehl:' + a.uid, fx: { hp: -8 }, t: 'It was never found. A piece of the family is gone.' } }, { l: 'Accept the loss', go: 'losehl:' + a.uid, fx: { hp: -6 }, t: 'You told yourself it was only a thing.' }] },
    ];
  }, 'cat');
  S.addHook('chose', (p, c, won) => {
    const g = c.go || (won === false ? c.alt?.go : won ? c.win?.go : null);
    if (typeof g !== 'string') return;
    const [kind, uid] = g.split(':'); const a = p.assets.find(x => x.uid === +uid); if (!a) return;
    if (kind === 'sellhl') { p.money += a.val * 2.5; p.assets.splice(p.assets.indexOf(a), 1); familyFrown(p, a); }
    if (kind === 'losehl') p.assets.splice(p.assets.indexOf(a), 1);
  });
  function familyFrown(p, a) { for (const o of S.known(p).filter(S.alive)) if (p.rels[o.id]?.k === 'fam' || /Father|Mother|Son|Daughter|Brother|Sister|Grand/.test(S.relLabel(p, o))) S.rel(p, o).c = U.clamp(S.rel(p, o).c - 8); S.log(p, `You sold the family's ${a.t.toLowerCase()}.`, 'bad'); }
  LATE.push(() => {
    const sell = S.sell;
    S.sell = uid => { const p = S.me(), a = p.assets.find(x => x.uid === uid); const t = sell(uid); if (a && isHL(a)) familyFrown(p, a); return t; };
  });

  /* ---------- the law of inheritance ---------- */
  function lawOf(cc, y = yr()) {
    if (ISL.includes(cc) && y >= 640 && y < 1990) return 'islamic';
    if (['ENG', 'FRA', 'SCA'].includes(cc) && y >= 1066 && y < 1925) return 'primogeniture';
    if (cc === 'JPN' && y >= 1600 && y < 1947) return 'primogeniture';
    if (S.era().id === 'prehistory') return 'custom';
    return 'equal';
  }
  const LAWTXT = { islamic: 'Islamic inheritance: sons take two shares, daughters one, the widow an eighth', primogeniture: 'Primogeniture: the eldest son takes the lands and the house', custom: 'Custom: the band shares out tools and goods among the kin', equal: 'The estate is divided among the heirs' };
  const candidates = p => {
    const set = new Set([...S.kids(p), S.spouse(p), ...S.grandkids(p), ...S.siblings(p), ...S.known(p).filter(o => (p.rels[o.id]?.c ?? 0) >= 60)].filter(o => o && S.alive(o)));
    return [...set];
  };
  // How the estate will be split: [{o, share (0-1)}], heirlooms {uid: id}, charity share
  function plan(p, h) {
    const will = p.will, out = new Map(), add = (o, s) => { if (o && S.alive(o)) out.set(o.id, (out.get(o.id) || 0) + s); };
    let charity = 0, how = '';
    if (will && Object.keys(will.shares || {}).length) {
      const tot = Object.values(will.shares).reduce((s, v) => s + v, 0) + (will.charity || 0) || 1;
      for (const [id, v] of Object.entries(will.shares)) add(S.P(+id), v / tot);
      charity = (will.charity || 0) / tot; how = `by ${p.first}'s will`;
      const alive = [...out.keys()].map(S.P).filter(o => o && S.alive(o)).length;
      if (!alive) { out.clear(); add(h, 1 - charity); }
    } else {
      const law = lawOf(p.cc), kids = S.kids(p).filter(S.alive), sp = S.spouse(p) && S.alive(S.spouse(p)) ? S.spouse(p) : null;
      how = LAWTXT[law];
      if (law === 'islamic' && kids.length) {
        const w = kids.map(k => [k, k.sex === 'M' ? 2 : 1]), tot = w.reduce((s, x) => s + x[1], 0), sps = sp ? 0.125 : 0;
        w.forEach(([k, n]) => add(k, (1 - sps) * n / tot)); if (sp) add(sp, sps);
      } else if (kids.length || sp) {
        const heirs = [...kids, ...(sp ? [sp] : [])];
        if (heirs.some(x => x.id === h.id)) { add(h, 0.5); heirs.filter(x => x.id !== h.id).forEach(x => add(x, 0.5 / Math.max(1, heirs.length - 1))); if (heirs.length === 1) add(h, 0.5); }
        else { add(h, 0.5); heirs.forEach(x => add(x, 0.5 / heirs.length)); }
      } else add(h, 1);
    }
    return { shares: [...out.entries()].map(([id, s]) => ({ o: S.P(id), s })).filter(x => x.o), charity, how, law: will ? 'will' : lawOf(p.cc) };
  }

  /* ---------- carrying on as an heir: the estate is settled ---------- */
  function continueAs(id) {
    const p = S.me(), h = S.P(id);
    if (!h || !S.alive(h)) return;
    const pl = plan(p, h), pot = Math.max(0, p.money);
    const got = new Map();
    for (const { o, s } of pl.shares) { const m = pot * s; o.money += m; got.set(o.id, (got.get(o.id) || 0) + m); }
    const charity = pot * pl.charity;
    // property: primogeniture sends it to the eldest son, a will can name heirloom heirs, the rest goes to the chosen heir
    const eldestSon = S.kids(p).filter(k => S.alive(k) && k.sex === 'M').sort((a, b) => U.span(a.born, b.born) > 0 ? -1 : 1)[0];
    const propHeir = pl.law === 'primogeniture' && eldestSon ? eldestSon : h;
    const nA = p.assets.length;
    for (const a of p.assets) {
      let to = propHeir;
      if (isHL(a) && p.will?.hl?.[a.uid] && S.alive(S.P(+p.will.hl[a.uid]))) to = S.P(+p.will.hl[a.uid]);
      if (isHL(a)) { a.hl.prestige++; a.hl.story.push({ y: yr(), who: to.id, t: `inherited from ${p.first}` }); }
      to.assets.push(a);
    }
    p.assets = []; p.money = 0;
    let title = '';
    if (p.title && !h.title && !(p.office?.lvl === 5)) { h.title = h.sex === 'M' ? p.title.replace('Lady', 'Lord').replace('Dame', 'Sir').replace('Queen', 'King').replace('Empress', 'Emperor') : p.title.replace('Lord', 'Lady').replace('Sir', 'Dame').replace('King', 'Queen').replace('Emperor', 'Empress'); title = h.title; }
    h.rep = U.clamp(h.rep + p.rep * 0.3 + (charity > 0 ? 5 : 0));
    if (S.hooks.onInherit) S.hooks.onInherit(p, h);
    W().dead = null;
    S.setPlayer(h);
    const rl = S.relLabel(h, p).toLowerCase(), mine = got.get(h.id) || 0, props = h.assets.filter(a => a.y <= yr()).length;
    S.log(h, `Your ${rl} ${p.first} died of ${p.cause}. ${pl.how[0].toUpperCase() + pl.how.slice(1)}${pl.law === 'will' ? ',' : ':'} you received ${S.money(mine)}${propHeir === h && nA ? ` and ${nA} propert${nA > 1 ? 'ies' : 'y'}` : ''}${title ? `, and the title ${title}` : ''}${charity > 0 ? `. ${S.money(charity)} went to charity in ${p.first}'s name` : ''}.`, 'money');
    if (propHeir !== h && nA) S.log(h, `By law the house and lands went to your ${S.relLabel(h, propHeir).toLowerCase()} ${propHeir.first}.`, 'money');
    S.checkAch(h);
    dispute(h, p, pl, got, pot);
  }
  function dispute(h, dead, pl, got, pot) {
    if (pot < S.toVal(S.era().cost * 3)) return;
    const kids = S.kids(dead).filter(k => S.alive(k) && S.age(k) >= 18 && k.id !== h.id);
    if (!kids.length) return;
    const fair = pot / (kids.length + 1);
    const wronged = kids.filter(k => (got.get(k.id) || 0) < fair * 0.5);
    const chance = pl.law === 'will' ? (wronged.length ? 0.55 : 0.05) : pl.law === 'primogeniture' ? 0.35 : wronged.length ? 0.4 : 0.1;
    if (!wronged.length && !U.chance(chance * 0.3)) return;
    if (!U.chance(chance)) return;
    const who = (wronged.length ? wronged : kids).slice(0, 3), names = who.map(o => o.first).join(' and ');
    const ask = Math.round(Math.min(h.money * 0.5, fair * 0.5) * 100) / 100;
    const court = typeof Society !== 'undefined' ? Society.court(h) : 'the court';
    S.prompt({ title: 'The will is contested', text: `${names} ${who.length > 1 ? 'say they were' : 'says they were'} cheated of their share of ${dead.first}'s estate${pl.law === 'will' ? ' and challenge the will' : ''}. They want ${S.money(ask)}.`, choices: [
      { l: `Share it with them (${S.money(ask)})`, dis: h.money < ask, go: () => { h.money -= ask; who.forEach(o => { o.money += ask / who.length; S.rel(h, o).c = U.clamp(S.rel(h, o).c + 10); }); S.applyFx(h, { rep: 3, mh: 2 }); S.pers?.nudge(h, 'generous', 1); S.log(h, `You settled the inheritance dispute with ${names}.`, 'good'); return 'Peace in the family, at a price.'; } },
      { l: `Fight it before ${court}`, go: () => {
        const cost = S.toVal(S.era().cost * 0.3); h.money -= cost;
        const odds = (pl.law === 'will' ? 0.65 : 0.45) + h.sm / 500 + S.hadd('odds', h, { tag: 'trial' });
        who.forEach(o => { S.rel(h, o).c = U.clamp(S.rel(h, o).c - 20); });
        if (U.chance(odds)) { S.log(h, `You won the inheritance case against ${names}.`, 'good'); S.applyFx(h, { rep: -1, mh: -2 }); return 'The court upheld your inheritance.'; }
        const loss = Math.min(h.money * 0.5, ask * 1.5); h.money -= loss; who.forEach(o => { o.money += loss / who.length; });
        S.log(h, `You lost the inheritance case and paid ${S.money(loss)} to ${names}.`, 'bad'); return 'The court split the estate against you.';
      } },
      { l: 'Ignore them', go: () => { who.forEach(o => { S.rel(h, o).c = U.clamp(S.rel(h, o).c - 15); if (U.chance(0.4)) o.rels[h.id] && (o.rels[h.id].k = 'enemy'); }); S.log(h, `You ignored ${names}'s claims. The family is split.`, 'bad'); return 'They will not forget it.'; } }] });
  }
  S.continueAs = continueAs;

  /* ---------- dynasty traits ---------- */
  const DT = [
    { id: 'scholarly', n: 'Scholarly', d: 'Children are born brighter.', motto: 'Knowledge Endures', test: q => q.edu >= 4 || q.sm >= 90 },
    { id: 'martial', n: 'Martial', d: 'Sons and daughters are born brave.', motto: 'By Courage Alone', test: q => !!q.flags.vet || (q.flags.medal || 0) > 0 || (q.flags.warwon || 0) > 0 },
    { id: 'wealthy', n: 'Wealthy', d: 'The family purse is always a little fuller.', motto: 'Prudence Brings Plenty', test: (q, l) => l && l.net >= S.toVal(S.eraOf(l.died).cost * 60, S.eraOf(l.died)) },
    { id: 'longlived', n: 'Long-lived', d: 'The family lives longer.', motto: 'We Endure', test: (q, l) => l && l.age >= 80 },
    { id: 'fertile', n: 'Fruitful', d: 'Big families come easily.', motto: 'Our Line Is Many', test: q => q.kids.length >= 5 },
    { id: 'famous', n: 'Illustrious', d: 'The family name opens doors.', motto: 'Remember Our Name', test: q => (q.fm ?? 0) >= 65 },
    { id: 'royal', n: 'Royal', d: 'Royal blood runs in the family.', motto: 'Born To The Crown', test: q => (q.cls ?? 0) >= 6 },
    { id: 'political', n: 'Statesmen', d: 'Children are born persuasive.', motto: 'To Serve And To Lead', test: q => (q.flags.office || 0) >= 3 },
    { id: 'athletic', n: 'Athletic', d: 'Children are born strong.', motto: 'Swift And Strong', test: q => !!q.flags.champion || (q.flags.exSport?.lvl ?? q.sport?.lvl ?? 0) >= 3 },
    { id: 'pious', n: 'Devout', d: 'Faith runs deep in the family.', motto: 'Faith Before All', test: q => !!S.pers?.has(q, 'pious') },
    { id: 'infamous', n: 'Infamous', d: 'People whisper about the family.', motto: 'Fear Us', test: q => !!q.flags.jailed },
    { id: 'wanderers', n: 'Wanderers', d: 'Children are born curious.', motto: 'The World Is Our Home', test: q => (q.travels || []).length >= 3 || !!q.flags.exiled },
  ];
  function traits(extra = []) {
    const w = W(), lives = [...w.dyn.lives, ...extra], out = [];
    for (const t of DT) {
      let n = 0;
      for (const l of lives) { const q = S.P(l.id); if (q && t.test(q, l)) n++; }
      const lvl = n >= 5 ? 3 : n >= 3 ? 2 : n >= (['royal', 'athletic'].includes(t.id) ? 1 : 2) ? 1 : 0;
      if (lvl) out.push({ ...t, lvl, n });
    }
    return out.sort((a, b) => b.lvl - a.lvl || b.n - a.n);
  }
  const member = q => q.played || q.last === W().dyn.name;
  const tr = id => (W().dyn.traits || []).find(t => t.id === id)?.lvl || 0;
  S.addHook('onBirth', c => {
    if (!member(c) || !W().dyn.traits) return;
    c.sm = U.clamp(c.sm + tr('scholarly') * 4); c.fe = U.clamp((c.fe ?? 60) + tr('fertile') * 5); c.fm = U.clamp((c.fm ?? 0) + tr('famous') * 3); c.rep = U.clamp(c.rep + tr('royal') * 3 - tr('infamous') * 2); c.h = U.clamp(c.h + tr('athletic') * 3);
    const give = (id, t) => { if (tr(id) && c.pers && !c.pers.tr.includes(t) && U.chance(0.15 * tr(id))) c.pers.tr.push(t); };
    give('martial', 'brave'); give('political', 'charming'); give('athletic', 'athletic'); give('pious', 'pious'); give('wanderers', 'curious'); give('infamous', 'deceitful'); give('scholarly', 'curious');
  });
  S.addHook('mort', p => (member(p) ? 1 - tr('longlived') * 0.035 : 1), 'mul');
  S.addHook('costMul', p => (member(p) ? 1 - tr('wealthy') * 0.04 : 1), 'mul');
  S.addHook('summary', sum => { const w = W(), before = (w.dyn.traits || []).map(t => t.id + t.lvl).join(); w.dyn.traits = traits([sum]).map(({ id, lvl, n }) => ({ id, lvl, n })); w.dyn.traitNews = before !== w.dyn.traits.map(t => t.id + t.lvl).join(); });
  const DEF = id => DT.find(t => t.id === id);
  function motto() { const ts = W().dyn.traits || []; return ts.length ? DEF(ts[0].id).motto : 'Our Story Begins'; }

  /* ---------- a coat of arms from the family name and traits ---------- */
  function crest(name, size = 64) {
    let h = 0; for (const ch of name || '?') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const TINCT = ['#B8392F', '#2E4F9E', '#2C8653', '#6B3FA0', '#1B1B1B', '#B7791F'], METAL = ['#E9C46A', '#E8E6E1'];
    const f = TINCT[h % 6], m = METAL[(h >> 3) % 2], div = (h >> 5) % 5;
    const top = (W()?.dyn.traits || [])[0]?.id;
    const shape = 'M8 6h48v24c0 16-10 24-24 30C18 54 8 46 8 30z';
    const divs = [`<rect x="32" y="0" width="32" height="64" fill="${m}"/>`, `<rect x="0" y="0" width="64" height="26" fill="${m}"/>`, `<path d="M0 0L64 64V0z" fill="${m}"/>`, `<path d="M8 50L32 20L56 50V64H8z" fill="${m}"/>`, `<rect x="0" y="0" width="32" height="30" fill="${m}"/><rect x="32" y="30" width="32" height="34" fill="${m}"/>`][div];
    const CH = {
      scholarly: '<path d="M22 26h20v14H22z M32 26v14" stroke="#111" stroke-width="1.6" fill="#fff"/>', martial: '<path d="M32 16v26M26 36h12M32 42v4" stroke="#111" stroke-width="2.4"/>',
      wealthy: '<circle cx="32" cy="32" r="7" fill="#E9C46A" stroke="#111" stroke-width="1.5"/>', longlived: '<path d="M32 44V24M32 30l-7-6M32 34l7-6" stroke="#111" stroke-width="2.2" fill="none"/><circle cx="32" cy="22" r="6" fill="#2C8653"/>',
      fertile: '<path d="M32 44V20M28 26l4 4 4-4M28 32l4 4 4-4" stroke="#111" stroke-width="1.8" fill="none"/>', famous: '<path d="M32 20l3.5 8 8.5.6-6.5 5.4 2 8.4L32 38l-7.5 4.4 2-8.4-6.5-5.4 8.5-.6z" fill="#E9C46A" stroke="#111" stroke-width="1"/>',
      royal: '<path d="M22 38l2-14 5 7 3-9 3 9 5-7 2 14z" fill="#E9C46A" stroke="#111" stroke-width="1.3"/>', political: '<path d="M24 38h16M26 38V28h12v10M22 28l10-6 10 6" stroke="#111" stroke-width="1.8" fill="none"/>',
      athletic: '<path d="M22 36c4-10 16-10 20 0M24 30c4-8 12-8 16 0" stroke="#2C8653" stroke-width="2.4" fill="none"/>', pious: '<path d="M32 18v26M24 26h16" stroke="#111" stroke-width="2.6"/>',
      infamous: '<path d="M24 24l16 16M40 24L24 40" stroke="#111" stroke-width="2.6"/>', wanderers: '<circle cx="32" cy="32" r="9" fill="none" stroke="#111" stroke-width="1.8"/><path d="M32 23v18M23 32h18" stroke="#111" stroke-width="1.2"/>',
    };
    return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><defs><clipPath id="sh${h}"><path d="${shape}"/></clipPath></defs><g clip-path="url(#sh${h})"><rect width="64" height="64" fill="${f}"/>${divs}</g><path d="${shape}" fill="none" stroke="#111" stroke-width="2"/>${top ? CH[top] : `<text x="32" y="39" text-anchor="middle" font-size="18" font-family="serif" fill="#111">${U.esc(((name || '?').replace(/^(of\s+)?(the\s+)?/i, '') || '?')[0].toUpperCase())}</text>`}</svg>`;
  }
  return { commission, makeHeirloom, plan, lawOf, LAWTXT, candidates, traits, motto, crest, HL, DT, isHL };
})();

/* ---------------- UI: will, heirlooms, dynasty ---------------- */
LATE.push(() => {
  const S = Sim, ui = UI, L = Legacy, { esc, toast, render, sheet, $ } = ui;
  const assets = ui.views.assets;
  ui.views.assets = p => {
    const e = S.era(), hls = p.assets.filter(L.isHL), list = L.HL[e.id] || L.HL.modern;
    const panel = `<div class="panel"><div class="eyebrow">Legacy</div><h3>Will & heirlooms</h3>
      <p class="lede">${p.will ? `Your will leaves shares to ${Object.keys(p.will.shares || {}).length} people${p.will.charity ? ' and to charity' : ''}.` : `You have no will. ${esc(L.LAWTXT[L.lawOf(p.cc)])}.`}</p>
      ${hls.length ? `<div class="list" style="margin-bottom:10px">${hls.map(a => `<div class="row"><div class="main"><div class="t">${esc(a.t)}</div><div class="s">Prestige ${a.hl.prestige} · ${esc(a.hl.story.slice(-3).map(s => `${U.fmtYearAD(s.y)}: ${s.t} (${S.P(s.who)?.first || '?'})`).join(' → '))}</div></div><div class="end mono">${S.money(a.val)}</div></div>`).join('')}</div>` : ''}
      <div class="btnrow"><button class="btn sm era" data-act="willOpen" ${S.age(p) < 16 ? 'disabled' : ''}>${p.will ? 'Change your will' : 'Write a will'}</button>
        ${list.map((t, i) => `<button class="btn sm" data-act="hlMake" data-k="${i}" ${S.age(p) < 16 ? 'disabled' : ''}>Commission ${esc(t)} · ${S.money(S.toVal(e.cost * (0.4 + i * 0.3)))}</button>`).join('')}</div></div>`;
    return panel + assets(p);
  };
  ui.on.hlMake = el => {
    const i = el.dataset.k;
    sheet(`<h2>Name your heirloom</h2><p class="lede">Give it a name the family will remember, or leave it blank.</p><div class="field"><input id="hl-name" maxlength="30" placeholder="e.g. The Morning Star"></div>
      <div class="acts" style="margin-top:10px"><button class="btn era" data-act="hlGo" data-k="${i}">Commission it</button><button class="btn" data-act="close">Not now</button></div>`, { label: 'Heirloom' });
  };
  ui.on.hlGo = el => { const t = L.commission(el.dataset.k, $('#hl-name')?.value); ui.open = null; $('#modal').innerHTML = ''; render(); toast(t); };
  function willSheet(res) {
    const p = S.me(), c = L.candidates(p), w = p.will || { shares: {}, hl: {}, charity: 0 }, hls = p.assets.filter(L.isHL);
    sheet(`<h2>Your will</h2><p class="lede">Choose how your estate is shared when you die. Shares are relative: give 2 to one child and 1 to another and the first gets twice as much. Leave someone at 0 and they may contest it.</p>
      <div class="list">${c.map(o => `<div class="row"><div class="main"><div class="t">${esc(S.fullName(o))}</div><div class="s">${esc(S.relLabel(p, o))} · ${S.age(o)}</div></div><input type="number" min="0" max="10" step="1" class="share" data-id="${o.id}" value="${w.shares?.[o.id] ?? 0}" aria-label="Share for ${esc(o.first)}"></div>`).join('') || '<div class="row muted">Nobody to leave anything to yet.</div>'}
        <div class="row"><div class="main"><div class="t">Charity</div><div class="s">Your name lives on in good works (reputation for your heir)</div></div><input type="number" min="0" max="10" step="1" id="w-charity" value="${w.charity || 0}" aria-label="Share for charity"></div></div>
      ${hls.length ? `<div class="eyebrow" style="margin-top:12px">Heirlooms</div>${hls.map(a => `<div class="field" style="margin-top:6px"><label>${esc(a.t)}</label><select class="hlto" data-uid="${a.uid}"><option value="">Whoever becomes the heir</option>${c.map(o => `<option value="${o.id}" ${String(w.hl?.[a.uid]) === String(o.id) ? 'selected' : ''}>${esc(S.fullName(o))}</option>`).join('')}</select></div>`).join('')}` : ''}
      ${res ? `<div class="result">${esc(res)}</div>` : ''}
      <div class="btnrow" style="margin-top:12px"><button class="btn era" data-act="willSave">Seal the will</button>${p.will ? '<button class="btn danger" data-act="willTear">Tear it up</button>' : ''}</div>`, { label: 'Your will' });
  }
  ui.on.willOpen = () => willSheet();
  ui.on.willSave = () => {
    const p = S.me(), shares = {}, hl = {};
    document.querySelectorAll('#modal .share').forEach(i => { const v = Math.max(0, +i.value || 0); if (v) shares[i.dataset.id] = v; });
    document.querySelectorAll('#modal .hlto').forEach(s => { if (s.value) hl[s.dataset.uid] = +s.value; });
    p.will = { shares, hl, charity: Math.max(0, +$('#w-charity').value || 0), y: S.W.year };
    S.log(p, 'You wrote your will and had it witnessed.', 'life');
    ui.open = null; willSheet('Sealed and witnessed.'); ui.save();
  };
  ui.on.willTear = () => { const p = S.me(); p.will = null; S.log(p, 'You tore up your will.', 'life'); ui.open = null; willSheet('Torn up. The law will decide.'); };

  function dynView(p) {
    const w = S.W, ts = w.dyn.traits || L.traits().map(({ id, lvl, n }) => ({ id, lvl, n }));
    const hls = Object.values(w.people).filter(q => S.alive(q) && (q.played || q.last === w.dyn.name)).flatMap(q => q.assets.filter(L.isHL).map(a => [q, a]));
    return `<div class="panel dyn"><div class="crestrow">${L.crest(w.dyn.name, 84)}<div><div class="eyebrow">${esc(U.house(w.dyn.name))}</div><h3>“${esc(L.motto())}”</h3><p class="lede" style="margin:4px 0 0">${w.dyn.played.length} lives played · founded ${U.fmtYearAD(w.dyn.houses[0]?.y ?? w.started)}</p></div></div>
      <div class="eyebrow" style="margin-top:14px">Dynasty traits</div>
      ${ts.length ? `<ul class="traits">${ts.map(t => { const d = L.DT.find(x => x.id === t.id); return `<li><b>${esc(d.n)}${' ✦'.repeat(t.lvl)}</b> <span class="faint">${esc(d.d)} Earned by ${t.n} ${t.n === 1 ? 'life' : 'lives'}.</span></li>`; }).join('')}</ul>` : '<p class="muted">Traits are earned when two or more lives in the family share an achievement: scholars, soldiers, the long-lived, the famous, the royal.</p>'}
      ${hls.length ? `<div class="eyebrow" style="margin-top:14px">Family heirlooms</div><ul class="traits">${hls.map(([q, a]) => `<li><b>${esc(a.t)}</b> <span class="faint">held by ${esc(q.first)} · prestige ${a.hl.prestige} · made ${U.fmtYearAD(a.hl.made)}</span></li>`).join('')}</ul>` : ''}</div>`;
  }
  (ui.worldExtra ||= []).push({ id: 'dynasty', n: 'Dynasty', view: dynView });
});
