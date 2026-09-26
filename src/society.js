/* =====================================================================
   SOCIETY — courts and trials, fugitives and lawsuits, and the lives of
   everyone you know. Crimes go to an era-appropriate court where you can
   plead, hire an advocate, bribe, face an ordeal or flee. Every year the
   people around you live through events of their own, and the notable
   ones reach you as gossip.
   ===================================================================== */

const Society = (() => {
  const S = Sim, W = () => S.W, yr = () => S.W.year;
  const ISLAMIC = ['EGY', 'IRN', 'MAG', 'MSP', 'LEV', 'ANA'];
  const CRIMES = {
    theft: 'theft', pickpocket: 'picking pockets', assault: 'assault', fraud: 'fraud', smuggling: 'smuggling', heresy: 'heresy',
    sedition: 'sedition', draft: 'dodging the draft', desertion: 'desertion', murder: 'murder', escape: 'escaping custody', bribery: 'bribery', corruption: 'corruption',
  };
  function court(p) {
    const e = S.era(), y = yr(), cc = p.cc;
    if (e.id === 'prehistory') return 'the council of elders';
    if (e.id === 'ancient') return cc === 'EGY' ? "the vizier's court" : cc === 'CHN' ? "the magistrate's yamen" : 'the magistrates';
    if (ISLAMIC.includes(cc) && y >= 640 && y < 1900) return "the qadi's court";
    if (e.id === 'medieval') return ['ENG', 'FRA', 'SCA'].includes(cc) ? 'the manor court' : cc === 'CHN' ? "the magistrate's yamen" : 'the local court';
    if (e.id === 'renaissance') return 'the city tribunal';
    if (e.id === 'colonial') return cc === 'ENG' || cc === 'USA' ? 'the assizes' : 'the royal court';
    if (e.id === 'near') return 'the AI-assisted court';
    if (e.id === 'far') return 'the Arbitration Mind';
    return 'the district court';
  }
  const ordealOK = () => { const y = yr(); return (S.era().id === 'prehistory') || (y >= 500 && y <= 1215); };
  const premodern = () => DATA.PREMODERN.includes(S.era().id);
  const corrupt = p => premodern() || (S.world.nations?.().find(n => n.cc === p.cc)?.stab ?? 60) < 40;

  /* ---------- sentencing ---------- */
  function sentence(p, c, mult = 1) {
    const e = S.era();
    let yrs = Math.max(0, Math.round(c.yrs * mult));
    const crime = CRIMES[c.crime] || c.crime;
    if (c.sev >= 3 && premodern() && U.chance(0.35)) { S.log(p, `Condemned for ${crime}, you were put to death.`, 'bad'); S.kill(p, 'execution'); return 'You were condemned to death.'; }
    if (e.id === 'prehistory') {
      if (yrs >= 3 || U.chance(0.3)) { S.applyFx(p, { rep: -15, mh: -8 }); exile(p); return 'The elders cast you out of the band. You must make a life among strangers.'; }
      S.applyFx(p, { rep: -8, $c: -0.2 }); return 'You were ordered to pay the wronged family in hides, tools and food.';
    }
    if (premodern() && c.sev <= 1 && U.chance(0.55)) {
      if (U.chance(0.5)) { S.applyFx(p, { h: -10, rep: -6, mh: -4 }); S.log(p, `You were flogged in public for ${crime}.`, 'bad'); return 'You were flogged in public and sent home.'; }
      S.applyFx(p, { rep: -8, $c: -0.1 }); S.log(p, `You spent a day in the stocks for ${crime}, pelted with rotten food.`, 'bad'); return 'A day in the stocks. The whole town came to jeer.';
    }
    if (yrs <= 0) { const f = S.toVal(e.cost * 0.15 * c.sev); p.money -= f; p.rep = U.clamp(p.rep - 4); S.log(p, `You were fined ${S.money(f)} for ${crime}.`, 'bad'); return `A fine of ${S.money(f)}.`; }
    S.jail(p, yrs);
    S.log(p, `${court(p)[0].toUpperCase() + court(p).slice(1)} sentenced you to ${yrs} year${yrs > 1 ? 's' : ''} for ${crime}.`, 'bad');
    return `Sentenced to ${yrs} year${yrs > 1 ? 's' : ''} in prison.`;
  }
  function exile(p) {
    const opts = S.world.countriesAt().filter(c => c.id !== p.cc && c.region !== 'space' && c.region === S.world.C(p.cc)?.region);
    const dest = (opts.length ? U.pick(opts) : U.pick(S.world.countriesAt().filter(c => c.id !== p.cc && c.region !== 'space'))).id;
    if (Sim.towns) Sim.towns.emigrateCheap(p, dest, 'exiled');
    else p.cc = dest;
    p.flags.exiled = yr();
  }

  /* ---------- arrests and trials ---------- */
  function arrest(p, c) {
    c = { sev: 1, yrs: 1, ...c };
    if (p.id !== W().playerId) { S.jail(p, Math.max(1, c.yrs)); return ''; }
    if (p.flags.fugitive) { c.yrs += 2; c.sev = Math.min(3, c.sev + 1); delete p.flags.fugitive; }
    const e = S.era(), crime = CRIMES[c.crime] || c.crime, where = court(p);
    const base = 0.25 + p.sm / 400 + p.rep / 500 - c.sev * 0.05 + S.hadd('odds', p, { tag: 'trial' });
    const lawyerCost = S.toVal(e.cost * 0.25 * c.sev), bribeCost = S.toVal(e.cost * 0.4 * c.sev);
    const acquit = how => { S.applyFx(p, { rep: -2, mh: 2 }); S.log(p, `${where[0].toUpperCase() + where.slice(1)} found you not guilty of ${crime}${how ? ` ${how}` : ''}.`, 'good'); return 'Not guilty! You walked free.'; };
    const choices = [
      { l: 'Plead guilty and ask for mercy', go: () => { S.applyFx(p, { rep: -3 }); return sentence(p, c, 0.5); } },
      { l: 'Plead not guilty and speak for yourself', go: () => (U.chance(U.clamp(base, 0.05, 0.85)) ? acquit() : sentence(p, c, 1.2)) },
      { l: `Hire an advocate (${S.money(lawyerCost)})`, dis: p.money < lawyerCost, go: () => { p.money -= lawyerCost; return U.chance(U.clamp(base + 0.25, 0.1, 0.92)) ? acquit('thanks to your advocate') : sentence(p, c, 0.9); } },
    ];
    if (corrupt(p)) choices.push({ l: `Bribe the judge (${S.money(bribeCost)})`, dis: p.money < bribeCost, go: () => {
      p.money -= bribeCost; S.pers?.nudge(p, 'deceitful', 1);
      if (U.chance(0.55 + S.hadd('odds', p, { l: 'bribe' }))) return acquit('after a quiet word and a heavy purse');
      S.applyFx(p, { rep: -10 }); S.log(p, 'Your bribe was exposed in open court.', 'bad'); return sentence(p, { ...c, crime: 'bribery' }, 1.5);
    } });
    if (ordealOK()) choices.push({ l: e.id === 'prehistory' ? 'Undergo the ordeal of the river' : 'Demand trial by ordeal', go: () => {
      if (U.chance(0.45 + p.h / 400 + (S.pers?.has(p, 'pious') ? 0.05 : 0))) return acquit('when you survived the ordeal unharmed');
      S.applyFx(p, { h: -15 }); return sentence(p, c, 1);
    } });
    choices.push({ l: 'Flee before the trial', go: () => {
      if (U.chance(0.4 + (S.pers?.has(p, 'reckless') ? 0.05 : 0))) { p.flags.fugitive = yr(); S.applyFx(p, { rep: -8, mh: -4 }); S.log(p, `You fled before your trial for ${crime}. You are a fugitive now.`, 'bad'); return 'You slipped away. They are still looking for you.'; }
      return sentence(p, c, 1.5);
    } });
    S.prompt({ title: `On trial · ${where}`, text: `You were arrested for ${crime}${c.what ? ` (${c.what})` : ''}. You now stand before ${where}.`, choices });
    return `You were caught and arrested for ${crime}. You will stand trial.`;
  }
  S.hooks.arrest = arrest;

  /* ---------- lawsuits and fugitives ---------- */
  S.addHook('events', p => {
    const out = [], e = S.era();
    if (p.flags.fugitive) out.push({ id: 'fugitive', p: 0.2, t: 'You glimpse a wanted notice with your face on it.', ch: [
      { l: 'Lie low and move on', fx: { mh: -3, $c: -0.05 }, t: 'Another town, another name.' },
      { l: 'Turn yourself in', go: 'surrender', fx: { rep: 2 }, t: 'You walked into the court and gave your name.' }] });
    if (S.age(p) >= 21 && e.id !== 'prehistory') {
      out.push({ id: 'sued', p: 0.02, t: `A neighbour is suing you before ${court(p)}, claiming you damaged their property.`, ch: [
        { l: 'Settle out of court', fx: { $c: -0.15 }, t: 'You paid, and the matter was closed.' },
        { l: 'Fight it in court', odds: q => 0.45 + q.sm / 400 + q.rep / 400, win: { fx: { rep: 3, hp: 3 }, t: 'The case was thrown out. Your neighbour paid the costs.' }, alt: { fx: { $c: -0.35, rep: -3 }, t: 'You lost, and paid damages and costs.' } }] });
      out.push({ id: 'cheated', p: 0.02, min: 18, t: 'A merchant sold you rotten goods and refuses to pay you back.', ch: [
        { l: 'Take them to court', odds: q => 0.5 + q.sm / 400, win: { fx: { $c: 0.1, rep: 2 }, t: 'The court ordered them to repay you, with interest.' }, alt: { fx: { $c: -0.05 }, t: 'The court sided with the merchant.' } },
        { l: 'Let it go', fx: { mh: -1 }, t: 'Lesson learned.' }] });
      if (['modern', 'digital', 'near', 'wars', 'industrial'].includes(e.id)) out.push({ id: 'jury', p: 0.03, min: 21, t: 'You were summoned for jury duty.', ch: [
        { l: 'Serve on the jury', fx: { sm: 1, rep: 2, hp: -1 }, t: 'Two weeks of testimony. You took it seriously.' }, { l: 'Invent an excuse', fx: { rep: -1 }, t: 'Your excuse was accepted. Just.' }] });
    }
    return out;
  }, 'cat');
  S.addHook('chose', (p, c) => { if (c.go === 'surrender') { delete p.flags.fugitive; arrest(p, { crime: 'escape', yrs: 1, sev: 1 }); } });
  S.addHook('postYear', p => {
    if (p.flags.fugitive && yr() - p.flags.fugitive >= 1 && U.chance(0.12)) { S.log(p, 'The law caught up with you.', 'bad'); arrest(p, { crime: 'escape', yrs: 2, sev: 2 }); }
  });

  /* ---------- extra effect keys ---------- */
  S.addHook('fx', (p, fx) => {
    if (fx.promote && p.job && p.job.rank < 4) { p.job.rank++; p.job.perf = 60; }
    if (fx.pet && p.id === W().playerId && Sim.adoptPet) { const cur = p.money; const t = S.adoptPet(fx.pet); p.money = Math.max(p.money, cur); if (/Meet/.test(t)) S.log(p, t, 'family'); }
  });

  /* ---------- the lives of everyone you know ---------- */
  const BIG = ['lover', 'royal', 'rival', 'pet', 'job', 'go'];
  const pool = () => {
    const e = S.era();
    return [...DATA.npcEvents, ...e.ev, ...DATA.events].filter(ev => !ev.once && !BIG.some(k => ev.fx && k in ev.fx) && !(ev.ch || []).some(c => BIG.some(k => (c.fx && k in c.fx) || (c.win?.fx && k in c.win.fx) || (c.alt?.fx && k in c.alt.fx)) || c.go));
  };
  function npcYear(p) {
    const people = S.known(p).filter(o => S.alive(o) && S.age(o) >= 3);
    const sample = U.shuffle(people).slice(0, 40);
    const evs = pool(), news = [];
    for (const o of sample) {
      if (!U.chance(0.3)) continue;
      const a = S.age(o);
      const opts = evs.filter(ev => S.eventOK(o, ev, a));
      const ev = U.wpick(opts, x => x.p);
      if (!ev) continue;
      const before = o.log.length;
      try { S.runEvent(o, ev, true); } catch { continue; }
      const l = o.log[o.log.length - 1];
      if (o.log.length > before && l && (l.k === 'good' || l.k === 'bad')) {
        const close = (p.rels[o.id]?.c ?? 0) >= 45 || /Father|Mother|Brother|Sister|Son|Daughter|Husband|Wife/.test(S.relLabel(p, o));
        const g = gist(l.t);
        if (close && g) news.push({ o, t: l.t, g, k: l.k });
      }
    }
    if (news.length) {
      const pick = U.shuffle(news).slice(0, 3);
      const line = pick.map(n => `your ${S.relLabel(p, n.o).toLowerCase()} ${n.o.first}${n.g}`).join('; ');
      S.log(p, `News from people you know: ${line}.`, 'gossip');
      if (S.hooks.gossip) S.hooks.gossip(p, pick);
      // good news cheers you a little, bad news worries you
      const d = pick.reduce((s, n) => s + (n.k === 'good' ? 1 : -1), 0);
      if (d) p.hp = U.clamp(p.hp + d);
    }
  }
  // Turn "You were praised at work..." into "was praised at work"; for a choice, what came of it.
  // Returns null when the line is not about the person ("A bitter winter.").
  function gist(t) {
    let s = t;
    const i = s.indexOf(' You chose: ');
    if (i >= 0) { const rest = s.slice(i + 12), j = rest.indexOf('. '); s = j >= 0 ? rest.slice(j + 2) : rest; }
    s = s.split(/(?<=[.!?])\s/)[0].replace(/[.!]$/, '');
    if (!/^(You|Your)\b/.test(s)) return null;
    const own = /^Your /.test(s);
    s = s.replace(/^You were /, 'was ').replace(/^You are /, 'is ').replace(/^You /, '').replace(/^Your /, '').replace(/\byou\b/g, 'them').replace(/\byour\b/g, 'their').replace(/\byourself\b/g, 'themselves');
    if (s.length > 110) s = s.slice(0, 107) + '…';
    return own ? `'s ${s}` : ` ${s}`;      // "Tom's post went viral" / "Tom was promoted"
  }
  S.addHook('postYear', p => npcYear(p));

  return { court, arrest, sentence, CRIMES, gist, npcYear };
})();
