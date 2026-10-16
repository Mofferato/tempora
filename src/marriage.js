/* =====================================================================
   MARRIAGE — arranged marriages, dowry and bride-price.
   How common arranged marriage is comes from the country and the year
   (Atlas.arranged), nudged by class and by the faith's own view.
   * When you are single and of age, your family may bring a match.
     Accept, ask to meet first, ask for another, refuse, or marry the
     one you love. Each has a cost that depends on how strict your
     society is.
   * Arranged marriages begin cooler and grow warmer, year by year, and
     last: couples in places where it is the norm divorce less.
   * When your own children come of age, you may arrange their marriage,
     ask what they want, or leave them to find their own partner.
   * Dowry (the bride's side pays) and bride-price (the groom's side
     pays) follow the country's customs.
   ===================================================================== */

const Marriage = (() => {
  const S = Sim, A = Atlas, yr = () => S.W.year;
  const dowType = cc => A.culture(cc, yr()).dow || 'none';
  function prevalence(cc, p, y = yr()) {
    let v = A.arranged(cc, y);
    if (p) {
      const fa = Faith.f(Faith.get(p)).arr ?? 0.5;
      v = v * 0.8 + fa * v * 0.4;                  // devout communities arrange more
      const cls = p.cls ?? 2;
      v *= cls >= 4 ? 1.15 : cls <= 1 ? 0.88 : 1;
    }
    return U.clamp(v, 0, 0.99);
  }
  const strict = cc => { const c = A.culture(cc, yr()); return U.clamp((c.T + c.F + c.R - c.G - c.I) / 200 + 0.4, 0, 1); };
  const label = v => (v >= 0.8 ? 'Almost every marriage is arranged' : v >= 0.55 ? 'Arranged marriage is the norm' : v >= 0.3 ? 'Many marriages are arranged or introduced by family' : v >= 0.1 ? 'Families often introduce the couple' : 'Almost everyone chooses their own partner');

  /* ---------- the money ---------- */
  function price(p, groom, bride) {
    const t = dowType(p.cc), e = S.era(), rich = ((groom.cls ?? 2) + (bride.cls ?? 2)) / 2;
    const base = S.toVal(e.cost * (0.25 + rich * 0.18));
    if (t === 'dowry') return { payer: 'bride', amt: base, label: 'dowry' };
    if (t === 'bride') return { payer: 'groom', amt: base * 0.8, label: 'bride-price' };
    if (t === 'mutual') return { payer: 'both', amt: base * 0.4, label: 'gift exchange' };
    return { payer: null, amt: 0, label: '' };
  }
  // what this person's family pays or receives at the wedding
  function settle(p, groom, bride, side) {
    const pr = price(p, groom, bride); if (!pr.payer) return 0;
    if (pr.payer === 'both') return side === 'groom' ? -pr.amt / 2 : -pr.amt / 2;
    return pr.payer === side ? -pr.amt : pr.amt;
  }

  /* ---------- finding a match ---------- */
  function candidate(p, forKid) {
    const e = S.era(), subject = forKid || p, sex = subject.orient === 'gay' && S.sameSexOK(e, subject.cc) ? subject.sex : subject.sex === 'M' ? 'F' : 'M';
    const a = S.age(subject), older = sex === 'M' ? U.ri(0, 8) : -U.ri(0, 6);
    const o = S.mkPerson({ cc: subject.cc, near: subject, sex, born: U.add(yr(), -U.clamp(a + older, S.law('marry', e, subject.cc), 60)) });
    o.money = S.toVal(e.cost) * U.rand(0.2, 3);
    if (S.age(o) >= 16) S.npcJob(o, e);
    // arranged matches are mostly within the same faith and people
    const endog = U.clamp(0.9 - (yr() > 1950 ? 0.25 : 0) - (yr() > 2000 ? 0.15 : 0), 0.3, 0.95);
    if (U.chance(endog)) { o.faith = Faith.get(subject); o.piety = U.clamp((subject.piety ?? 40) + U.ri(-20, 20)); }
    if (U.chance(endog) && Identity.eth(subject)) { const top = Identity.eth(subject)[0]; o.eth = [{ n: top.n, k: top.k, s: 1 }]; o.g = Identity.genomeFor(o.eth, o.cc, o.born, o.sex); }
    o.nats = [...Identity.natsOf(subject)].slice(0, 1);
    return o;
  }
  const pitch = (p, o) => {
    const bits = [`${S.age(o)}`, S.className(o).toLowerCase(), o.job ? `works as ${o.job.t.toLowerCase()}` : 'has no trade'];
    const f = Faith.get(o), same = f === Faith.get(p);
    bits.push(same ? 'shares your faith' : `follows ${Faith.adj(f)} ways`);
    const e1 = Identity.ethText(o), e0 = Identity.ethText(p);
    if (e1 !== e0) bits.push(e1);
    return `${o.first} ${o.last}, ${bits.join(', ')}`;
  };
  const compatScore = (p, o) => {
    const fc = Faith.interfaith(Faith.get(p), Faith.get(o)), sm = 1 - Math.abs((p.sm ?? 50) - (o.sm ?? 50)) / 100;
    const cls = 1 - Math.abs((p.cls ?? 2) - (o.cls ?? 2)) / 5;
    return U.clamp(fc * 0.4 + sm * 0.25 + cls * 0.35, 0.05, 1);
  };

  /* ---------- the offer ---------- */
  function setEngaged(p, o, how) {
    const c0 = Math.round(18 + compatScore(p, o) * 38 + U.ri(0, 10));
    p.rels[o.id] = { k: 'fiance', c: c0, arr: yr(), wed: U.add(yr(), 1) };
    o.rels[p.id] = { k: 'fiance', c: c0 - U.ri(-6, 6), arr: yr(), wed: U.add(yr(), 1) };
    S.log(p, `${how}, you are engaged to ${o.first} ${o.last}. The wedding is next year.`, 'love');
  }
  function offer(p) {
    const e = S.era(), cc = p.cc, str = strict(cc);
    const o = p.flags.matchWith && S.P(p.flags.matchWith) && S.alive(S.P(p.flags.matchWith)) ? S.P(p.flags.matchWith) : candidate(p);
    delete p.flags.matchWith; p.flags.matchY = yr();
    const groom = p.sex === 'M' ? p : o, bride = p.sex === 'M' ? o : p, pr = price(p, groom, bride);
    const me = pr.payer === 'both' ? 'groom' : p.sex === 'M' ? 'groom' : 'bride';
    const net = settle(p, groom, bride, me), fear = Math.round(4 + str * 12);
    const lover = Object.entries(p.rels).map(([id, r]) => (r.k === 'lover' && S.alive(S.P(+id)) ? S.P(+id) : null)).find(Boolean);
    const money = net ? ` Custom calls for a ${pr.label}${net < 0 ? ` of about ${S.money(-net)} from your side` : ` of about ${S.money(net)} coming to your family`}.` : '';
    const par = S.parents(p).find(S.alive);
    const who = par ? `Your ${S.relLabel(p, par).toLowerCase()} ${par.first}` : 'Your family';
    const choices = [
      { l: `Accept ${o.first}`, dis: net < 0 && p.money < -net, go: () => { if (net) p.money += net; setEngaged(p, o, 'By arrangement'); S.applyFx(p, { famc: 4, rep: 1 }); return `You said yes. You are engaged to ${o.first}.`; } },
      { l: 'Ask to meet first', go: () => { p.flags.matchWith = o.id; p.rels[o.id] = { k: 'friend', c: U.ri(25, 50) }; o.rels[p.id] = { k: 'friend', c: U.ri(25, 50) }; return `You asked to meet ${o.first} before deciding. The families agreed to wait a year.`; } },
      { l: 'Ask for a different match', go: () => { S.applyFx(p, { famc: -2 }); return 'Your family sighed and promised to look again.'; } },
      ...(lover ? [{ l: `Marry ${lover.first}, whom you love`, go: () => { const r = p.rels[lover.id]; r.k = 'fiance'; S.rel(lover, p).k = 'fiance'; S.applyFx(p, { famc: -fear, rep: -Math.round(str * 6), hp: 3 }); return `You told your family you would marry ${lover.first}. They were not pleased.`; } }] : []),
      { l: 'Refuse', go: () => {
        S.applyFx(p, { famc: -fear, rep: -Math.round(str * 5), mh: 2 });
        if (str > 0.65 && U.chance(0.12)) { S.log(p, 'Your family cut off your allowance for defying them.', 'bad'); p.money = Math.max(0, p.money * 0.7); }
        return 'You refused. Your family did not hide their disappointment.';
      } },
    ];
    S.prompt({ title: 'A match is proposed', text: `${who} has found a match for you: ${pitch(p, o)}.${money} ${prevalence(cc, p) > 0.5 ? 'In this place, it is how marriages are made.' : 'It is a little old-fashioned, but families still do this.'}`, choices });
  }

  /* ---------- for your children ---------- */
  function forChild(p, kid) {
    const e = S.era(), cc = kid.cc, v = prevalence(cc, p), o = candidate(p, kid);
    kid.flags.matchY = yr();
    const groom = kid.sex === 'M' ? kid : o, bride = kid.sex === 'M' ? o : kid, pr = price(p, groom, bride);
    const side = kid.sex === 'M' ? 'groom' : 'bride', net = settle(p, groom, bride, side);
    const money = net ? ` Custom calls for a ${pr.label}${net < 0 ? ` of about ${S.money(-net)} from your side` : ` of about ${S.money(net)} to your family`}.` : '';
    const note = (kid.sex === 'F' ? 'her' : 'him');
    S.prompt({ title: `A match for ${kid.first}`, text: `Word has reached you of ${pitch(kid, o)}, who would make a match for ${kid.first}.${money}`, choices: [
      { l: 'Arrange the marriage', dis: net < 0 && p.money < -net, go: () => {
        p.money += net; setEngaged(kid, o, `At ${p.first}’s wish`);
        const d = Math.round((v - 0.45) * 12 + U.ri(-6, 4)); S.rel(p, kid).c = U.clamp(S.rel(p, kid).c + d);
        S.log(p, `You arranged ${kid.first}’s marriage to ${o.first} ${o.last}.${d < -3 ? ` ${kid.first} was unhappy about it.` : ''}`, 'family'); return `${kid.first} will marry ${o.first}.`;
      } },
      { l: `Ask ${kid.first} what ${kid.sex === 'M' ? 'he' : 'she'} wants`, go: () => {
        const yes = U.chance(0.35 + v * 0.35); S.rel(p, kid).c = U.clamp(S.rel(p, kid).c + 4);
        if (yes && !(net < 0 && p.money < -net)) { p.money += net; setEngaged(kid, o, `With ${kid.first}’s consent`); return `${kid.first} agreed to the match.`; }
        return `${kid.first} would rather find ${note === 'her' ? 'her' : 'his'} own way.`;
      } },
      { l: 'Let them choose for themselves', go: () => { S.rel(p, kid).c = U.clamp(S.rel(p, kid).c + 3); kid.flags.free = yr(); return `You left it to ${kid.first}.`; } },
    ] });
  }

  /* ---------- dynastic matches: a marriage that makes an alliance ---------- */
  function dynastic(p, kid) {
    const e = S.era(), cc = p.cc;
    const pool = Geo.near(cc).map(n => A.C(n)).filter(c => c && c.region !== 'space' && yr() >= c.from && !Geo.atWar(cc, c.id) && S.world.rel(cc, c.id) > -35).map(c => c.id);
    const to = Geo.pickNear(cc, pool.length ? pool : S.world.countriesAt().filter(c => c.id !== cc && c.region !== 'space').map(c => c.id));
    if (!to) return;
    kid.flags.matchY = yr();
    const sex = kid.orient === 'gay' && S.sameSexOK(e, kid.cc) ? kid.sex : kid.sex === 'M' ? 'F' : 'M';
    const o = S.mkPerson({ cc: to, sex, born: U.add(yr(), -U.clamp(S.age(kid) + U.ri(-3, 3), S.law('marry', e, to), 45)) });
    o.cls = 6; o.title = o.sex === 'M' ? 'Prince' : 'Princess'; o.money = S.toVal(e.cost) * U.rand(5, 40); o.nats = [to];
    const ally = Geo.allied(cc, to), name = S.world.name(to), rel = Math.round(S.world.rel(cc, to));
    S.prompt({ title: 'A royal match', text: `The court of ${name} proposes that ${kid.first} marry ${o.title} ${o.first} ${o.last}, to seal friendship between the two lands${ally ? ' and strengthen the alliance you already have' : ''}. Relations stand at ${rel > 0 ? '+' : ''}${rel}.`, choices: [
      { l: 'Agree to the marriage', go: () => {
        S.marry(kid, o, true); const home = kid.sex === 'F' && A.culture(cc, yr()).F >= 60 ? to : cc; kid.cc = home; o.cc = home;
        S.world.addRel(cc, to, 25); if (!ally) Geo.ally(cc, to);
        S.rel(p, kid).c = U.clamp(S.rel(p, kid).c + U.ri(-10, 6)); S.applyFx(p, { fm: 3, rep: 2 });
        S.log(p, `${kid.first} married ${o.title} ${o.first} of ${name}, and the two lands made an alliance.`, 'family'); return `${kid.first} is married, and ${name} is your ally.`;
      } },
      { l: 'Politely decline', go: () => { S.world.addRel(cc, to, -8); S.applyFx(p, { rep: -1 }); return `${name} took the refusal coolly.`; } },
    ] });
  }

  /* ---------- the years ---------- */
  function weddings(p) {
    for (const [id, r] of Object.entries(p.rels)) {
      if (r.k !== 'fiance' || !r.arr || U.span(r.wed ?? yr(), yr()) < 0) continue;
      const o = S.P(+id); if (!o || !S.alive(o) || p.sp != null || o.sp != null) { r.k = 'ex'; continue; }
      S.marry(p, o);
      const rr = S.rel(p, o); rr.c = Math.max(rr.c, 20); rr.arr = r.arr; S.rel(o, p).arr = r.arr;
      S.log(p, `You married ${o.first} ${o.last}, a match arranged by your families.`, 'love'); S.applyFx(p, { hp: 6, famc: 3 });
    }
  }
  S.addHook('postYear', p => {
    const e = S.era(), a = S.age(p), mA = S.law('marry', e, p.cc);
    weddings(p);
    if (p.prison > 0) return;
    // matches for you
    const pending = Object.values(p.rels).some(r => r.k === 'fiance');
    if (p.sp == null && !pending && a >= mA && a <= 38 && p.flags.matchY !== yr() && p.flags.free !== yr() - 1) {
      const v = prevalence(p.cc, p);
      if (U.chance(v * (a < 30 ? 0.45 : 0.2) * (p.flags.matchWith ? 2.2 : 1))) offer(p);
    }
    // a ruler's children are matches between states
    if ((p.office?.lvl ?? 0) >= 5 || (p.cls ?? 2) >= 6) {
      const kid = S.kids(p).find(k => S.alive(k) && k.sp == null && S.age(k) >= S.law('marry', e, k.cc) + 1 && S.age(k) <= 34 && k.flags.matchY !== yr() && !Object.values(k.rels).some(r => r.k === 'fiance'));
      if (kid && U.chance(0.2)) { dynastic(p, kid); return; }
    }
    // matches for your children
    for (const kid of S.kids(p)) {
      if (!S.alive(kid) || kid.sp != null || S.age(kid) < S.law('marry', e, kid.cc) + 1 || S.age(kid) > 34 || kid.flags.matchY === yr()) continue;
      if (Object.values(kid.rels).some(r => r.k === 'fiance' || r.k === 'lover')) continue;
      const v = prevalence(kid.cc, p);
      if (v > 0.2 && U.chance(v * 0.22)) { forChild(p, kid); break; }
    }
  });

  S.addHook('tick', p => { if (p.id !== S.W.playerId && S.alive(p) && Object.values(p.rels).some(r => r.arr && r.k === 'fiance')) weddings(p); });
  // arranged marriages warm over the years; where they are the norm, they last
  S.addHook('relDrift', (p, o, r) => (r.arr && p.sp === o.id && r.c < 80 ? 1.2 + (r.c < 50 ? 1 : 0) : 0), 'add');
  S.addHook('npcMul', (p, what) => (what === 'divorce' && p.sp != null && S.rel(p, S.P(p.sp)).arr ? 0.35 : 1), 'mul');

  return { dynastic, prevalence, label, dowType, price, strict, candidate, offer, forChild, pitch, compatScore };
})();
