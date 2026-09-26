/* =====================================================================
   ENGINE, part 2 — the player's year, choices, careers, school,
   relationships, assets, death & inheritance, dynasty, god mode, saves.
   ===================================================================== */

Object.assign(Sim, (() => {
  const S = Sim;
  const W = () => S.W;
  const EDU_YEARS = [0, 6, 6, 4, 4];
  const EDU_AGE = [0, 5, 10, 16, 20];
  const EDU_SM = [0, 0, 20, 45, 65];
  const workAge = e => (e.id === 'prehistory' ? 10 : DATA.PREMODERN.includes(e.id) ? 12 : 16);

  /* ---------------- the yearly loop ---------------- */
  function ageUp() {
    const w = W(), p = S.me();
    if (!S.alive(p) || w.dead) return;
    const s0 = S.snap(p);
    w.year = U.next(w.year);
    const e = S.era();
    p.did = {};
    if (e.id !== w.lastEra) {
      w.lastEra = e.id;
      w.news.push({ y: w.year, t: `The ${e.name} era begins.`, type: 'era' });
      S.log(p, `A new age dawns: the ${e.name} era. ${e.blurb}`, 'era');
      if (S.age(p) > 0) p.flags.era = 1;
    }
    if (S.hooks.preYear) S.hooks.preYear(p, e);
    S.histTick();
    const conn = S.connected();
    for (const q of Object.values(w.people)) if (S.alive(q)) S.tickPerson(q, e, conn.has(q.id), q.id === p.id);
    if (S.alive(p)) playerYear(p, e);
    if (S.alive(p)) randomEvents(p, e);
    if (S.alive(p) && S.hooks.postYear) S.hooks.postYear(p, e);
    if (S.alive(p) && !p.log.some(l => l.y === w.year)) S.log(p, quietYear(S.age(p)), 'quiet');
    checkAch(p);
    const yd = S.diff(s0, S.snap(p));
    if (S.hasDiff(yd)) { (p.yd ||= []).push({ y: w.year, d: yd }); if (p.yd.length > 160) p.yd.splice(0, p.yd.length - 160); }
    w.lastYear = { y: w.year, d: yd, pid: p.id };
    if (w.year % 25 === 0) prune();
    if (!S.alive(p)) onDeath(p);
  }

  const QUIET = [
    [2, ['You slept, ate and cried. Mostly cried.', 'You grew round and content.', 'You discovered your own feet.']],
    [12, ['You played with the other children.', 'You helped around the house.', 'You chased animals and scraped your knees.', 'You asked "why?" roughly ten thousand times.']],
    [19, ['You spent the year daydreaming.', 'You argued with your parents about everything.', 'You felt like nobody understood you.']],
    [64, ['A quiet year.', 'The year passed without much to remark on.', 'Work, meals, sleep. Repeat.', 'An ordinary year, and you were grateful for it.']],
    [999, ['You spent the year by the fire with your memories.', 'A slow, peaceful year.', 'You told the same stories again. Nobody minded.']],
  ];
  const quietYear = a => U.pick(QUIET.find(([m]) => a <= m)[1]);

  function playerYear(p, e) {
    const a = S.age(p), L = e.life;
    schoolYear(p, e, a);
    // work
    const j = p.job;
    let takeHome = 0;
    if (j) {
      j.yrs++;
      let pay = j.pay * rankPay(j) * S.hmul('payMul', p, j);
      if (j.vol) pay *= U.rand(1 - j.vol * 0.6, 1 + j.vol);
      takeHome = pay * (1 - Math.min(0.9, L.tax * S.hmul('taxMul', p)));
      p.money += takeHome;
      j.perf = U.clamp(j.perf + U.ri(-6, 5) + S.hadd('perf', p, j));
      if (j.fame) { p.fm = U.clamp((p.fm ?? 0) + j.fame * U.rand(0.5, 1.5) * (1 + 0.25 * j.rank) * (1 - (p.fm ?? 0) / 130)); p.rep = U.clamp(p.rep + j.fame * 0.3); }
      if (j.risk && U.chance(j.risk)) { p.h = U.clamp(p.h - U.ri(8, 25)); S.log(p, 'You were injured at work.', 'bad'); }
      if (j.perf >= 80 && promoReady(j) && j.rank < 4 && U.chance(0.35 * S.hmul('promoMul', p, j))) { j.rank++; j.perf = 60; j.lastPromo = j.yrs; S.log(p, `You were promoted to ${rankName(j.rank)} ${j.t.toLowerCase()}.`, 'good'); }
      else if (j.perf < 15 && U.chance(0.4)) { S.log(p, `You were fired from your job as ${j.t.toLowerCase()}.`, 'bad'); p.job = null; }
      if (p.job && j.era !== e.id && !S.jobsNow(e, p.cc).some(x => x.id === j.id) && U.chance(0.3)) { S.log(p, `Your trade as ${j.t.toLowerCase()} has no place in the ${e.name} era. You are out of work.`, 'bad'); p.job = null; }
    } else if (p.retired && L.retire) p.money += S.toVal(e.cost * 0.6);
    else if (a >= 18 && S.law('ubi', e, p.cc) && !p.prison) p.money += S.toVal(S.law('ubi', e, p.cc));
    // cost of living
    if ((a >= 18 || takeHome > 0) && !p.prison && !p.school?.home) {      // working children pay their way at home too
      const deps = S.kids(p).filter(k => S.alive(k) && S.age(k) < 18).length;
      const sp = S.spouse(p);
      const share = sp && S.alive(sp) && sp.job ? 0.6 : 1;
      const home = p.assets.some(x => x.kind === 'home') ? 0.75 : 1;
      const par = a < 25 && !(sp && S.alive(sp)) ? S.parents(p).filter(S.alive).sort((x, y) => y.money - x.money)[0] : null;   // still living with family
      // what a household of this station needs, or most of what it brings home, whichever is more
      const need = S.toVal(e.cost) * (1 + deps * 0.3) * share * home * S.hmul('costMul', p, e);
      const c1 = S.toVal(e.cost), bill = Math.max(need, takeHome * (takeHome < c1 * 2 ? 0.88 : takeHome < c1 * 6 ? 0.78 : 0.6));
      // at home, a working child hands over a good part of their wages; the parents carry the rest
      if (par) { const mine = Math.max(need * (p.job ? 0.35 : 0.15), takeHome * 0.6), theirs = Math.min(Math.max(0, par.money), need * 0.3); p.money -= mine + Math.max(0, need * 0.3 - theirs); par.money -= theirs; }
      else p.money -= bill;
    }
    if (p.money < 0) {
      p.hp = U.clamp(p.hp - 6);
      if (DATA.PREMODERN.includes(e.id)) { p.h = U.clamp(p.h - 5); S.log(p, 'You are in debt and often go hungry.', 'bad'); }
      else S.log(p, 'You are in debt. The letters from creditors keep coming.', 'bad');
      if (e.id === 'colonial' && p.money < -S.toVal(e.cost * 2) && U.chance(0.3)) { S.jail(p, 1); S.log(p, "You were thrown into debtors' prison.", 'bad'); }
    }
    // assets
    for (const as of p.assets) {
      as.val = Math.max(0, as.val * (1 + as.appr + (as.vol ? U.rand(-as.vol, as.vol) : 0)));
      if (as.inc) p.money += as.val * as.inc;
    }
    // relationships drift
    for (const [id, r] of Object.entries(p.rels)) {
      const o = S.P(+id);
      if (!o || !S.alive(o)) continue;
      r.c = U.clamp(r.c + U.ri(-4, 1) + S.hadd('relDrift', p, o, r));
      if ((r.k === 'lover' || r.k === 'fiance') && r.c < 20 && U.chance(0.4)) { r.k = 'ex'; S.log(p, `${o.first} broke up with you.`, 'love'); p.hp = U.clamp(p.hp - 8); }
      if (r.k === 'friend' && r.c < 8 && U.chance(0.3)) { delete p.rels[id]; S.log(p, `You and ${o.first} drifted apart.`, 'life'); }
    }
    const sp = S.spouse(p);
    if (sp && S.alive(sp)) {
      const r = S.rel(p, sp);
      if (r.c < 15 && S.law('divorce', e, p.cc) && U.chance(0.25 * S.hmul('npcMul', sp, 'divorce'))) { S.unmarry(p, sp); p.money *= 0.65; S.log(p, `${sp.first} divorced you and took a third of your savings.`, 'love'); p.hp = U.clamp(p.hp - 15); }
      else if (p.sex !== sp.sex) {
        const mo = p.sex === 'F' ? p : sp, ma = S.age(mo);
        if (ma >= 16 && ma <= 44 && !mo.kids.some(k => S.P(k)?.born === W().year) && U.chance(L.fert * 0.35 * (mo.kids.length > 4 ? 0.4 : 1) * (S.hooks.fert ? S.hooks.fert(mo, p.sex === 'M' ? p : sp) : 1))) {
          const c = S.birth(p.sex === 'M' ? p : sp, mo);
          S.log(p, `You welcomed a baby ${c.sex === 'M' ? 'boy' : 'girl'}: ${c.first}!`, 'family');
          S.rel(p, c).c = 90;
        }
      }
    }
    // happiness drifts toward a life-shaped baseline
    const target = 52 + (sp && S.alive(sp) ? 8 : 0) + (p.job ? 4 : 0) - (p.sick.length ? 10 : 0) + (p.money > S.toVal(e.cost * 5) ? 6 : 0) - (p.money < 0 ? 10 : 0) - (p.prison ? 20 : 0) + (p.h - 60) / 8 + S.hadd('hpTarget', p, e);
    p.hp = U.clamp(p.hp + (target - p.hp) * 0.15 + U.ri(-3, 3));
    p.lk = U.clamp(p.lk + (a < 18 ? U.ri(-1, 2) : 0));
  }

  const rankName = r => ['Junior', 'Senior', 'Lead', 'Chief', 'Grand'][Math.min(r, 4)];
  // Each rank adds a fifth to the pay; each takes longer to earn than the last
  const rankPay = j => 1 + 0.2 * (j?.rank || 0);
  const promoReady = j => j.yrs - (j.lastPromo || 0) >= 2 + j.rank;

  /* ---------------- education ---------------- */
  // Who pays a child's way: parents first, then grandparents, then an adult sibling.
  function payerFor(p, need = 0) {
    if (S.age(p) >= 18) return p;
    const fam = [...S.parents(p), ...S.grandparents(p), ...S.siblings(p).filter(o => S.age(o) >= 18)].filter(S.alive).sort((a, b) => b.money - a.money);
    const best = fam.find(x => x.money >= Math.max(need, 1));
    return best || (fam[0] && fam[0].money > 0 ? fam[0] : p);
  }
  function enroll(p, lvl, auto) {
    const e = S.era(), cost = lvl <= S.eduComp(e) ? 0 : S.toVal(e.edu.cost[lvl]);
    p.school = { lvl, left: EDU_YEARS[lvl], cost, home: S.age(p) < 18 };
    S.log(p, auto ? `You started ${e.edu.n[lvl].toLowerCase()}.` : `You enrolled in ${e.edu.n[lvl].toLowerCase()}.`, 'school');
  }
  // Auto-enrolment for children: primary from 6, secondary straight after primary.
  // Uses ranges rather than exact birthdays so a child who finishes early, changes
  // country or is taken over mid-childhood is never stranded between schools.
  function autoSchool(p, e, a) {
    if (p.school || p.prison || p.flags.homeTaught) return;
    const comp = S.eduComp(e);
    const rich = lvl => { const c = S.toVal(e.edu.cost[lvl] * EDU_YEARS[lvl] * 1.2) + S.toVal(e.cost) * 0.5; return payerFor(p, c).money > c; };
    const free = lvl => lvl <= comp || !e.edu.cost[lvl];
    if (a >= 6 && a <= 11 && p.edu < 1) {
      if (free(1) || rich(1)) enroll(p, 1, true);
      else if (!p.flags.noschool) { p.flags.noschool = 1; S.log(p, 'There is no schooling for a child like you. You help at home instead. (Your family could enrol you later if they can afford it.)', 'life'); }
    } else if (a >= 10 && a <= 15 && p.edu === 1) {
      if (free(2) || rich(2)) enroll(p, 2, true);
      else if (!p.flags.noschool2) { p.flags.noschool2 = 1; S.log(p, 'Your schooling ends here. It is time to learn a trade.', 'life'); }
    }
  }
  function schoolYear(p, e, a) {
    if (p.prison) { if (p.school) { p.school = null; S.log(p, 'Prison ended your studies.', 'bad'); } return; }
    if (p.school) {
      const sc = p.school, payer = payerFor(p, sc.cost);
      if (sc.cost && !(sc.lvl <= S.eduComp(e))) {
        if (payer.money >= sc.cost || (payer === p && S.age(p) >= 18)) payer.money -= sc.cost;
        else {
          S.log(p, S.age(p) < 18 ? `Your family could no longer pay for ${e.edu.n[sc.lvl].toLowerCase()}, so you had to leave.` : `You could no longer pay for ${e.edu.n[sc.lvl].toLowerCase()} and had to leave.`, 'bad');
          p.school = null; p.flags.leftSchool = W().year; return;
        }
      }
      p.sm = U.clamp(p.sm + U.ri(1, 4));
      if (--sc.left <= 0) {
        p.edu = Math.max(p.edu, sc.lvl);
        S.log(p, `You finished ${e.edu.n[sc.lvl].toLowerCase()}.`, 'good');
        p.hp = U.clamp(p.hp + 5); p.school = null;
        autoSchool(p, e, a);          // go straight on to the next school where there is one
      }
      return;
    }
    autoSchool(p, e, a);
  }
  function eduOptions(p) {
    const e = S.era(), a = S.age(p), out = [];
    for (let l = 1; l <= 4; l++) {
      if (p.edu >= l) continue;
      const why = [];
      if (p.edu < l - 1) why.push(`needs ${e.edu.n[l - 1].toLowerCase()}`);
      if (a < EDU_AGE[l]) why.push(`age ${EDU_AGE[l]}+`);
      if (p.sm < EDU_SM[l]) why.push(`smarts ${EDU_SM[l]}+`);
      if (S.hooks.eduWhy) why.push(...S.hooks.eduWhy(p, l));
      const cost = S.toVal(e.edu.cost[l]);
      if (l > S.eduComp(e) && cost > 0 && cost * EDU_YEARS[l] > payerFor(p, cost * EDU_YEARS[l]).money) why.push('cannot afford');
      out.push({ lvl: l, n: e.edu.n[l], yrs: EDU_YEARS[l], cost, why });
      if (why.length) break;
    }
    return out;
  }
  function doEnroll(lvl) {
    const p = S.me(), o = eduOptions(p).find(x => x.lvl === lvl);
    if (!o || o.why.length || p.school) return 'You cannot enrol right now.';
    enroll(p, lvl, false);
    return `You enrolled in ${o.n.toLowerCase()}.`;
  }
  function dropOut() {
    const p = S.me();
    if (!p.school) return '';
    const n = S.era().edu.n[p.school.lvl];
    if (S.age(p) < 16 && S.eduComp() >= p.school.lvl) return 'School is compulsory at your age.';
    p.school = null; S.log(p, `You dropped out of ${n.toLowerCase()}.`, 'school');
    return 'You dropped out.';
  }

  /* ---------------- careers ---------------- */
  function jobListings(p) {
    const e = S.era(), a = S.age(p);
    return S.jobsNow(e, p.cc).map(j => {
      const why = [];
      if (S.hooks.jobWhy) why.push(...S.hooks.jobWhy(p, j));
      if (a < workAge(e)) why.push(`age ${workAge(e)}+`);
      if (j.sex && j.sex !== p.sex) why.push(j.sex === 'M' ? 'men only in this era' : 'women only');
      if (p.edu < j.edu) why.push(e.edu.n[j.edu]);
      if (p.sm < j.sm) why.push(`smarts ${j.sm}`);
      if (p.lk < j.lk) why.push(`looks ${j.lk}`);
      if (p.rep < j.rep) why.push(`reputation ${j.rep}`);
      if (p.prison) why.push('in prison');
      if (p.school && p.school.lvl < 3) why.push('still in school');
      return { j, why, pay: S.toVal(j.pay, e), cur: p.job?.id === j.id };
    }).sort((x, y) => x.pay - y.pay);
  }
  function apply(jid) {
    const p = S.me(), e = S.era();
    const L = jobListings(p).find(x => x.j.id === jid);
    const jt = j0 => (p.sex === 'F' && j0.tf) || j0.t;
    if (!L || L.why.length) return { ok: false, t: 'You do not meet the requirements.' };
    if (p.did['apply:' + jid]) return { ok: false, t: 'You already applied this year.' };
    p.did['apply:' + jid] = 1;
    const j = L.j;
    const odds = U.clamp(0.35 + (p.sm - j.sm) / 150 + p.lk / 400 + p.rep / 300 + (j.pay < e.cost * 2 ? 0.3 : 0) + S.hadd('odds', p, { tag: 'interview', j }), 0.05, 0.95);
    if (!U.chance(odds)) { S.log(p, `You applied to be a ${j.t.toLowerCase()} and were turned down.`, 'work'); return { ok: false, t: 'They turned you down. Try again next year, or improve yourself.' }; }
    if (p.job) S.log(p, `You left your job as ${p.job.t.toLowerCase()}.`, 'work');
    S.giveJob(p, j, e);
    if (j.grant && !p.title) p.title = p.sex === 'M' ? j.grant : ({ Sir: 'Dame', Lord: 'Lady' }[j.grant] || j.grant);
    S.log(p, `You were hired as ${/^[aeiou]/i.test(jt(j)) ? 'an' : 'a'} ${jt(j).toLowerCase()}${j.grant ? `, and may now be styled ${p.title}` : ''}.`, 'work');
    return { ok: true, t: `Hired! You are now ${/^[aeiou]/i.test(jt(j)) ? 'an' : 'a'} ${jt(j).toLowerCase()}.` };
  }
  function workHard() {
    const p = S.me(); if (!p.job) return '';
    if (p.did.work) return 'You already pushed yourself hard this year.';
    p.did.work = 1; p.job.perf = U.clamp(p.job.perf + U.ri(4, 10)); p.hp = U.clamp(p.hp - 2); p.h = U.clamp(p.h - 1);
    return 'You put in long hours. Your boss noticed.';
  }
  function askPromotion() {
    const p = S.me(), j = p.job; if (!j) return '';
    if (p.did.promo) return 'You already asked this year.';
    p.did.promo = 1;
    if (!promoReady(j)) { S.log(p, 'You asked for a promotion, but it was too soon after your last one.', 'work'); return 'Too soon. Prove yourself in this rank first.'; }
    if (j.rank < 4 && j.perf >= 60 && U.chance(j.perf / 140)) { j.rank++; j.perf = 60; j.lastPromo = j.yrs; S.log(p, `You asked for a promotion and became ${rankName(j.rank).toLowerCase()} ${j.t.toLowerCase()}.`, 'good'); return 'Promoted! Your pay went up.'; }
    j.perf = U.clamp(j.perf - 5); S.log(p, 'You asked for a promotion and were refused.', 'work');
    return 'Refused. Work harder first.';
  }
  function quitJob() {
    const p = S.me(); if (!p.job) return '';
    S.log(p, `You quit your job as ${p.job.t.toLowerCase()}.`, 'work'); p.job = null; return 'You quit.';
  }
  function retire() {
    const p = S.me(), e = S.era();
    const min = e.life.retire ? e.life.retire - 10 : 50;
    if (S.age(p) < min) return `You can retire from age ${min}.`;
    if (p.job) S.log(p, `You retired from your work as ${p.job.t.toLowerCase()}.`, 'work');
    p.job = null; p.retired = true;
    return e.life.retire ? 'You retired with a pension.' : 'You retired. Your savings will have to last.';
  }

  /* ---------------- activities ---------------- */
  function activities(p) {
    const e = S.era(), a = S.age(p), out = [];
    for (const u of DATA.activities) out.push({ id: 'u:' + u.id, n: e.L[u.lab] || (S.hooks.label ? S.hooks.label(u.lab, e, p) : u.lab), d: u.d, min: u.min, cost: S.toVal(e.cost * u.cost), src: u });
    for (const x of [...e.acts, ...(S.hooks.acts ? S.hooks.acts(p, e) : [])]) if (S.inWindow(x) && (!x.when || S.activeWars().length)) out.push({ id: 'e:' + x.id, n: x.n, d: x.d, min: x.min, cost: S.toVal(x.cost), src: x, era: true });
    return out.map(o => ({ ...o, done: !!p.did[o.id], young: a < o.min, broke: o.cost > 0 && payerFor(p, o.cost).money < o.cost, jailed: p.prison > 0 }));
  }
  function doActivity(id) {
    const p = S.me(), e = S.era();
    const act = activities(p).find(x => x.id === id);
    if (!act || !S.alive(p)) return '';
    if (act.jailed) return 'You cannot do that from a prison cell.';
    if (act.young) return `You must be at least ${act.min}.`;
    if (act.done) return 'You already did that this year.';
    if (act.broke) return 'You cannot afford it.';
    p.did[id] = 1;
    if (act.cost) payerFor(p, act.cost).money -= act.cost;
    const src = act.src, kind = src.kind || 'fx';
    let t = '';
    if (kind === 'fx') {
      if (src.risk && U.chance(src.risk.p)) { S.applyFx(p, src.risk.fx); t = src.risk.t; }
      else { S.applyFx(p, src.fx); t = Array.isArray(src.t) ? U.pick(src.t) : src.t; }
      if (src.immune) p.imm.push(src.immune);
      if (src.set) p.flags[src.set] = 1;
    } else if (kind === 'healer') {
      const med = S.medicine();
      if (p.sick.length) {
        const cured = [];
        for (const s of p.sick.slice()) {
          const c = med >= s.cure ? 0.85 : Math.max(0.05, 0.6 * med / s.cure - 0.1);
          if (U.chance(c)) { cured.push(s.n); p.sick.splice(p.sick.indexOf(s), 1); }
        }
        t = cured.length ? `You were treated and cured of ${cured.join(' and ').toLowerCase()}.` : 'The treatment did nothing. Medicine in this age has its limits.';
        p.h = U.clamp(p.h + U.ri(1, 5));
      } else { const g = Math.round(U.ri(2, 6) * (0.5 + med)); p.h = U.clamp(p.h + g); t = med < 0.2 && U.chance(0.25) ? 'The healer bled you "to balance your humours". You feel worse.' : 'A clean bill of health, and some sensible advice.'; if (t.includes('worse')) p.h = U.clamp(p.h - 2 * g); }
    } else if (kind === 'love') {
      const partner = Object.entries(p.rels).find(([id, r]) => (r.k === 'lover' || r.k === 'fiance') && S.alive(S.P(+id)));
      if (p.sp != null || partner) { p.did[id] = 0; return 'You are already in a relationship.'; }
      if (U.chance(0.3 + p.lk / 200 + S.hadd('odds', p, { tag: 'romance' }))) { const o = S.newLover(p); t = `You hit it off with ${o.first} ${o.last}, ${S.age(o)}.`; }
      else { p.hp = U.clamp(p.hp - 2); t = 'No sparks this time.'; }
    } else if (kind === 'friend') {
      if (U.chance(0.7)) { const o = S.newFriend(p); t = `You made a new friend: ${o.first} ${o.last}.`; S.log(p, t, 'life'); return t; }
      t = 'Nobody interesting turned up.';
    } else if (kind === 'gamble') {
      const stake = act.cost, r = Math.random();
      if (r < 0.03) { payerFor(p).money += stake * 20; p.flags.jackpot = 1; p.hp = U.clamp(p.hp + 15); t = `Jackpot! You won ${S.money(stake * 20)}.`; }
      else if (r < 0.43) { payerFor(p).money += stake * 2; p.hp = U.clamp(p.hp + 4); t = `You doubled your stake and won ${S.money(stake * 2)}.`; }
      else { p.hp = U.clamp(p.hp - 4); t = `You lost your stake of ${S.money(stake)}.`; }
    } else if (kind === 'crime') {
      if (U.chance(0.45 + p.sm / 300 + S.hadd('odds', p, { tag: 'crime' }))) { const g = S.toVal(e.cost * U.rand(0.05, 0.4) * S.hmul('crimeMul', p)); p.money += g; p.hp = U.clamp(p.hp + 3); t = `You got away with ${S.money(g)}.`; }
      else if (U.chance(0.55)) {
        const y = U.ri(1, 4);
        if (S.hooks.arrest) t = S.hooks.arrest(p, { crime: 'theft', yrs: y, sev: 1, what: e.L.crime.toLowerCase() });
        else { S.jail(p, y); t = `You were caught and sentenced to ${y} year${y > 1 ? 's' : ''} in prison.`; }
      }
      else { p.hp = U.clamp(p.hp - 4); p.rep = U.clamp(p.rep - 3); t = 'You were spotted and ran for it, empty-handed.'; }
    } else if (S.hooks.actKind && S.hooks.actKind[kind]) {
      t = S.hooks.actKind[kind](p, act, e);
    }
    if (S.hooks.afterAct) { const extra = S.hooks.afterAct(p, act, kind); if (extra) t += ' ' + extra; }
    S.log(p, `${act.n}: ${t}`, 'act');
    return t;
  }

  /* ---------------- relationships ---------------- */
  function actionsFor(p, o) {
    const e = S.era(), a = S.age(p), oa = S.age(o), r = p.rels[o.id];
    const out = [];
    if (!S.alive(o)) return out;
    const kid = a < 5;
    out.push({ id: 'time', l: 'Spend time together' });
    if (!kid) out.push({ id: 'talk', l: 'Have a conversation' });
    if (a >= 10) out.push({ id: 'gift', l: `Give a gift (${S.money(S.toVal(e.cost * 0.03))})` });
    if (!kid) out.push({ id: 'argue', l: 'Pick an argument' });
    const parentLike = p.fa === o.id || p.mo === o.id || S.grandparents(p).includes(o);
    if (parentLike || (r && r.k === 'friend')) out.push({ id: 'money', l: 'Ask for money' });
    if (r && r.k === 'friend' && a >= 14 && oa >= 14 && p.sp == null) out.push({ id: 'flirt', l: 'Ask them out' });
    if (r && r.k === 'lover') { out.push({ id: 'propose', l: 'Propose' }); out.push({ id: 'breakup', l: 'Break up' }); }
    if (r && r.k === 'fiance') { out.push({ id: 'wed', l: `Get married (${S.money(S.toVal(e.cost * 0.2))})` }); out.push({ id: 'breakup', l: 'Call off the engagement' }); }
    if (p.sp === o.id) {
      out.push({ id: 'baby', l: p.sex !== o.sex ? 'Try for a baby' : 'Adopt a child' });
      out.push({ id: 'divorce', l: S.law('divorce', e, p.cc) ? 'Divorce' : 'Seek an annulment' });
    }
    if (r && r.k === 'lover' && p.sex !== o.sex && a >= 16) out.push({ id: 'baby', l: 'Try for a baby' });
    return out;
  }
  function interact(oid, act) {
    const p = S.me(), o = S.P(oid), e = S.era();
    if (!o || !S.alive(o) || !S.alive(p)) return 'They are gone.';
    const r = S.rel(p, o), key = `r:${oid}:${act}`;
    if (['time', 'talk', 'gift', 'money', 'flirt', 'baby'].includes(act)) { if (p.did[key]) return 'You already did that this year.'; p.did[key] = 1; }
    let t = '';
    switch (act) {
      case 'time': r.c = U.clamp(r.c + U.ri(4, 12) + S.hadd('relGain', p, o, 'time')); p.hp = U.clamp(p.hp + 2); t = `You spent a lovely day with ${o.first}.`; break;
      case 'talk': r.c = U.clamp(r.c + U.ri(1, 6) + S.hadd('relGain', p, o, 'talk')); t = U.pick([`You and ${o.first} talked for hours.`, `${o.first} told you a secret.`, `You chatted about nothing in particular.`]); break;
      case 'gift': {
        const c = S.toVal(e.cost * 0.03);
        if (payerFor(p, c).money < c) { p.did[key] = 0; return 'You cannot afford a gift.'; }
        payerFor(p, c).money -= c; r.c = U.clamp(r.c + U.ri(6, 15)); t = `${o.first} loved your gift.`; break;
      }
      case 'argue': r.c = U.clamp(r.c - U.ri(8, 20) + S.hadd('relGain', p, o, 'argue')); p.hp = U.clamp(p.hp - 3); t = `You and ${o.first} had a shouting match.`; break;
      case 'money': {
        if (S.age(o) < 16 || o.money <= 0 || !U.chance(r.c / 150)) { r.c = U.clamp(r.c - 4); t = `${o.first} refused.`; break; }
        const g = Math.min(o.money * 0.2, S.toVal(e.cost * U.rand(0.05, 0.3)));
        o.money -= g; p.money += g; t = `${o.first} gave you ${S.money(g)}.`; break;
      }
      case 'flirt':
        if (U.chance(r.c / 160 + p.lk / 400 + S.hadd('odds', p, { tag: 'romance', o }))) { r.k = 'lover'; S.rel(o, p).k = 'lover'; t = `${o.first} said yes! You are together now.`; }
        else { r.c = U.clamp(r.c - 10); t = `${o.first} would rather stay friends.`; }
        break;
      case 'propose':
        if (S.age(p) < S.law('marry', e, p.cc) || S.age(o) < S.law('marry', e, p.cc)) { t = `You must both be at least ${S.law('marry', e, p.cc)} to marry here and now.`; break; }
        if (p.sex === o.sex && !S.sameSexOK(e, p.cc)) { t = 'The law of this era does not allow you to marry. You remain together.'; break; }
        if (U.chance(r.c / 110 + S.hadd('odds', p, { tag: 'propose', o }))) { r.k = 'fiance'; t = `${o.first} said yes! You are engaged.`; }
        else { r.c = U.clamp(r.c - 12); t = `${o.first} said no.`; }
        break;
      case 'wed': {
        const c = S.toVal(e.cost * 0.2);
        if (p.money < c * 0.3) { t = 'You cannot afford even a modest wedding.'; break; }
        p.money -= Math.min(c, p.money); S.marry(p, o); p.hp = U.clamp(p.hp + 10); t = `You married ${o.first} ${o.last}.`; break;
      }
      case 'breakup': r.k = 'ex'; p.hp = U.clamp(p.hp - 5); t = `You broke up with ${o.first}.`; break;
      case 'divorce':
        if (S.law('divorce', e, p.cc)) { S.unmarry(p, o); p.money *= 0.7; p.hp = U.clamp(p.hp - 8); t = `You divorced ${o.first}. The settlement was not cheap.`; }
        else if (U.chance(0.2) && p.money > S.toVal(e.cost * 0.5)) { p.money -= S.toVal(e.cost * 0.5); S.unmarry(p, o); t = 'The Church granted an annulment. It cost you dearly.'; }
        else t = 'Your plea for an annulment was refused. You remain married.';
        break;
      case 'baby': {
        if (p.sex === o.sex || (p.sp !== o.id && !r)) {
          const c = S.mkPerson({ born: U.add(W().year, -U.ri(0, 6)) });
          c.last = W().dyn.name; c.fa = p.sex === 'M' ? p.id : o.id; c.mo = p.sex === 'M' ? o.id : p.id;
          p.kids.push(c.id); o.kids.push(c.id); S.rel(p, c).c = 85;
          t = `You adopted ${c.first}, aged ${S.age(c)}.`; break;
        }
        const mo = p.sex === 'F' ? p : o, ma = S.age(mo);
        if (ma < 16 || ma > 46) { t = 'It is not going to happen at this age.'; break; }
        if (mo.kids.some(k => S.P(k)?.born === W().year)) { t = 'You already had a baby this year.'; break; }
        const lim = S.law('kids', e, p.cc);
        if (lim && mo.kids.length >= lim) { t = `The law here allows only ${lim} child${lim > 1 ? 'ren' : ''} per family.`; break; }
        if (U.chance(U.clamp(e.life.fert * 2, 0.15, 0.5) * (mo.kids.length > 6 ? 0.4 : 1) * (S.hooks.fert ? S.hooks.fert(mo, p.sex === 'M' ? p : o) : 1))) {
          const c = S.birth(p.sex === 'M' ? p : o, mo); S.rel(p, c).c = 90;
          t = `A baby ${c.sex === 'M' ? 'boy' : 'girl'}: ${c.first}!`;
          if (p.sp !== o.id) p.rep = U.clamp(p.rep - ([...DATA.PREMODERN, 'wars'].includes(e.id) ? 10 : 2));
        } else t = 'No baby this year.';
        break;
      }
    }
    if (S.hooks.afterInteract) S.hooks.afterInteract(p, o, act, t);
    S.log(p, t, ['wed', 'propose', 'breakup', 'divorce', 'flirt', 'baby'].includes(act) ? 'love' : 'life');
    return t;
  }

  /* ---------------- assets ---------------- */
  function market() { const e = S.era(); return e.assets.filter(S.inWindow).map(a => ({ a, price: S.toVal(a.price) })); }
  function buy(aid) {
    const p = S.me(), e = S.era(), m = market().find(x => x.a.id === aid);
    if (!m) return '';
    if (S.age(p) < 16) return 'You are too young to buy property.';
    if (p.money < m.price) return 'You cannot afford it.';
    p.money -= m.price;
    const a = m.a;
    p.assets.push({ uid: W().nid++, id: a.id, t: a.t, kind: a.kind, val: m.price, appr: a.appr, inc: a.inc, vol: a.vol || 0, era: e.id, y: W().year });
    S.applyFx(p, { hp: a.hp, rep: a.rep, lk: a.lk, sm: a.sm });
    S.log(p, `You bought ${/^[aeiou]/i.test(a.t) ? 'an' : 'a'} ${a.t.toLowerCase()} for ${S.money(m.price)}.`, 'money');
    return `You bought the ${a.t.toLowerCase()}.`;
  }
  function sell(uid) {
    const p = S.me(), i = p.assets.findIndex(x => x.uid === uid);
    if (i < 0) return '';
    const a = p.assets[i], v = a.val * 0.95;
    p.money += v; p.assets.splice(i, 1);
    S.log(p, `You sold your ${a.t.toLowerCase()} for ${S.money(v)}.`, 'money');
    return `Sold for ${S.money(v)}.`;
  }

  /* ---------------- random life events ---------------- */
  function eventOK(p, ev, a) {
    if (ev.min != null && a < ev.min) return false;
    if (ev.max != null && a > ev.max) return false;
    if (ev.sex && ev.sex !== p.sex) return false;
    if (!S.inWindow(ev)) return false;
    if (ev.when === 'war' && !S.activeWars().length) return false;
    if (ev.once && p.flags['ev_' + ev.id]) return false;
    if (ev.c && !ev.c(p, S)) return false;
    return true;
  }
  function randomEvents(p, e) {
    if (p.prison > 0) return;
    const a = S.age(p);
    let fired = 0;
    const max = S.hooks.maxEvents ? S.hooks.maxEvents(p) : 2;
    for (const ev of U.shuffle([...e.ev, ...DATA.events, ...(S.hooks.events ? S.hooks.events(p, e) : [])])) {
      if (fired >= max) break;
      if (eventOK(p, ev, a) && U.chance(ev.p)) { runEvent(p, ev); fired++; }
    }
  }
  const tone = fx => { if (!fx) return 'life'; const s = ['h', 'hp', 'sm', 'lk', 'rep'].reduce((t, k) => t + (fx[k] != null ? Math.sign(Array.isArray(fx[k]) ? fx[k][0] + fx[k][1] : fx[k]) : 0), 0) + Math.sign(Array.isArray(fx.$) ? fx.$[0] : fx.$ || 0); return s > 0 ? 'good' : s < 0 ? 'bad' : 'life'; };
  const afford = (p, fx) => { if (!fx) return true; const e = S.era(); const need = (fx.$ < 0 ? -fx.$ : 0) + (typeof fx.$c === 'number' && fx.$c < 0 ? -fx.$c * e.cost : 0); return S.cash(p) >= need; };
  // Odds for a chance outcome, adjusted by traits, skills and circumstance
  const oddsOf = (p, c) => U.clamp((typeof c.odds === 'function' ? c.odds(p) : c.odds) + S.hadd('odds', p, c), 0.02, 0.98);
  // npc: resolve without prompting (the person picks what suits their character)
  function runEvent(p, ev, npc) {
    if (ev.once) p.flags['ev_' + ev.id] = 1;
    const text = Array.isArray(ev.t) ? U.pick(ev.t) : ev.t;
    if (ev.ch) {
      if (npc) { const ok = ev.ch.filter(c => afford(p, c.fx)); const c = S.hooks.npcChoose ? S.hooks.npcChoose(p, ok.length ? ok : ev.ch) : U.pick(ok.length ? ok : ev.ch); resolve(p, c, text, true); return; }
      S.prompt({
        title: `${U.fmtYearAD(W().year)} · Age ${S.age(p)}`, text, ev: ev.id,
        choices: ev.ch.map(c => ({ l: c.l, dis: !afford(p, c.fx), src: c, go: () => resolve(p, c, text) })),
      });
      return;
    }
    const s0 = S.snap(p);
    S.applyFx(p, ev.fx);
    let msg = text, k = tone(ev.fx);
    if (ev.odds != null) {
      const won = U.chance(oddsOf(p, ev)), o = won ? ev.win : ev.alt;
      if (o) { S.applyFx(p, o.fx); if (o.t) msg += ' ' + o.t; k = tone(o.fx) === 'life' ? k : tone(o.fx); }
    }
    S.log(p, npc ? npcVoice(msg) : msg, k);
    S.tagLast(p, S.diff(s0, S.snap(p)));
  }
  function resolve(p, c, text, npc) {
    const s0 = S.snap(p);
    S.applyFx(p, c.fx);
    let msg = c.t || '', k = tone(c.fx), won = null;
    if (c.odds != null) {
      won = U.chance(oddsOf(p, c));
      const o = won ? c.win : c.alt;
      if (o) { S.applyFx(p, o.fx); msg = o.t || ''; k = tone(o.fx); }
    }
    if (S.hooks.chose) S.hooks.chose(p, c, won);
    S.log(p, `${text} You chose: ${c.l.toLowerCase()}. ${msg}`, k);
    S.tagLast(p, S.diff(s0, S.snap(p)));
    return msg;
  }
  // NPC logs stay in the second person like the player's, so they read the same when you become them
  const npcVoice = t => t;

  /* ---------------- achievements ---------------- */
  function checkAch(p) {
    for (const a of DATA.achievements) {
      if (!p.ach.includes(a.id) && a.test(p, S)) { p.ach.push(a.id); S.log(p, `Achievement: ${a.n}. ${a.d}`, 'ach'); }
    }
  }

  /* ---------------- death, heirs, dynasty ---------------- */
  function lifeScore(p) {
    const nw = Math.max(0, S.netWorth(p));
    return Math.round(S.age(p) * 2 + Math.log10(nw + 1) * 18 + p.rep + p.ach.length * 25 + p.kids.length * 10 + p.edu * 10 + (p.title ? 40 : 0));
  }
  function onDeath(p) {
    const e = S.eraOf(p.died);
    checkAch(p);
    const sum = {
      id: p.id, name: S.fullName(p), born: p.born, died: p.died, age: S.age(p), cause: p.cause, era: e.name, eraId: e.id,
      net: S.netWorth(p), netTxt: S.money(S.netWorth(p), e), ach: p.ach.slice(), kids: p.kids.length, job: p.lastJob || null, score: lifeScore(p),
    };
    if (S.hooks.summary) S.hooks.summary(sum, p);
    W().dyn.lives.push(sum);
    W().dyn.score += sum.score;
    W().dead = sum;
  }
  function heirs(p) {
    const order = [...S.kids(p), ...S.grandkids(p), ...(S.spouse(p) ? [S.spouse(p)] : []), ...S.siblings(p), ...S.niblings(p), ...S.known(p)];
    const seen = new Set();
    return order.filter(o => S.alive(o) && !seen.has(o.id) && seen.add(o.id)).map(o => ({ o, rel: S.relLabel(p, o) }));
  }
  function continueAs(id) {
    const p = S.me(), h = S.P(id);
    if (!h || !S.alive(h)) return;
    // Estate: the chosen heir takes half the money, every asset and any title; the rest is split among children and spouse.
    const others = [...S.kids(p), ...(S.spouse(p) ? [S.spouse(p)] : [])].filter(o => S.alive(o) && o.id !== h.id);
    const pot = Math.max(0, p.money);
    const main = others.length ? pot / 2 : pot;
    h.money += main;
    others.forEach(o => (o.money += (pot - main) / others.length));
    const nA = p.assets.length;
    h.assets.push(...p.assets); p.assets = []; p.money = 0;
    let title = '';
    if (p.title && !h.title) { h.title = h.sex === 'M' ? p.title.replace('Lady', 'Lord').replace('Dame', 'Sir') : p.title.replace('Lord', 'Lady').replace('Sir', 'Dame'); title = h.title; }
    h.rep = U.clamp(h.rep + p.rep * 0.3);
    if (S.hooks.onInherit) S.hooks.onInherit(p, h);
    W().dead = null;
    S.setPlayer(h);
    const rl = S.relLabel(h, p).toLowerCase();
    S.log(h, `Your ${rl} ${p.first} died of ${p.cause}. You inherited ${S.money(main)}${nA ? ` and ${nA} propert${nA > 1 ? 'ies' : 'y'}` : ''}${title ? `, and the title ${title}` : ''}.`, 'money');
    checkAch(h);
  }
  // The line has ended: a new house begins in the same world.
  function newHouse(opt = {}) {
    W().dead = null; S.prompts.length = 0;
    const p = S.spawnFamily(opt);
    S.log(p, 'A new house begins, in a world that remembers the old one.', 'switch');
    return p;
  }
  function settle() { const p = S.me(); if (p && !S.alive(p) && !W().dead) onDeath(p); }
  function become(id) {
    const p = S.me(), o = S.P(id);
    if (!o || !S.alive(o) || o.id === p.id) return;
    S.log(p, `You stepped aside. ${o.first} ${o.last} takes up the story.`, 'switch');
    S.setPlayer(o);
    o.did = {};
  }

  /* ---------------- housekeeping ---------------- */
  function prune() {
    const w = W(), keep = new Set();
    const addAnc = (p, d) => { if (!p || d > 40 || keep.has(p.id)) return; keep.add(p.id); addAnc(S.P(p.fa), d + 1); addAnc(S.P(p.mo), d + 1); };
    const roots = [];
    w.dyn.played.map(S.P).filter(Boolean).forEach(p => addAnc(p, 0));
    keep.forEach(id => roots.push(S.P(id)));
    const addDesc = (p, d) => { if (!p || d > 60) return; keep.add(p.id); if (p.sp != null) keep.add(p.sp); p.exes.forEach(x => keep.add(x)); p.kids.forEach(k => { if (!keep.has(k)) addDesc(S.P(k), d + 1); }); };
    roots.forEach(r => addDesc(r, 0));
    const conn = S.connected();
    for (const [id, p] of Object.entries(w.people)) {
      if (S.alive(p) || keep.has(+id) || conn.has(+id) || w.year - p.died < 20) continue;
      delete w.people[id];
    }
    for (const p of Object.values(w.people)) {
      for (const k of Object.keys(p.rels)) if (!w.people[k]) delete p.rels[k];
      p.exes = p.exes.filter(x => w.people[x]);
      p.kids = p.kids.filter(x => w.people[x]);
      if (p.sp != null && !w.people[p.sp]) p.sp = null;
    }
  }

  /* ---------------- god mode ---------------- */
  function autoResolve() { while (S.prompts.length) { const pr = S.prompts.shift(); const ok = pr.choices.filter(c => !c.dis); (ok[ok.length - 1] || pr.choices[0]).go(); } }
  function jump(n) {
    for (let i = 0; i < n; i++) { ageUp(); autoResolve(); if (W().dead) break; }
  }
  function forceHistory(i) {
    const h = DATA.history[i]; if (!h) return;
    S.histTick([{ ...h, y: W().year, end: W().year, key: h.key + '_forced' }]);
    const p = S.me(); if (!S.alive(p)) onDeath(p);
  }
  function forceEvent(id) {
    const p = S.me(), ev = [...S.era().ev, ...DATA.events].find(x => x.id === id);
    if (ev) runEvent(p, { ...ev, once: false });
  }
  function eventPool() { return [...S.era().ev, ...DATA.events]; }

  /* ---------------- save / load ---------------- */
  const serialize = () => JSON.stringify(W());
  function load(obj) {
    if (!obj || typeof obj !== 'object' || !obj.people || obj.playerId == null) throw new Error('This file is not a Tempora save.');
    S.W = obj; S.prompts.length = 0;
    if (S.hooks.migrate) S.hooks.migrate(obj);
    return obj;
  }

  return {
    ageUp, eduOptions, doEnroll, dropOut, jobListings, apply, workHard, askPromotion, quitJob, retire, rankName,
    activities, doActivity, actionsFor, interact, market, buy, sell, heirs, continueAs, become, checkAch, settle, newHouse,
    jump, forceHistory, forceEvent, eventPool, serialize, load, workAge, lifeScore, EDU_YEARS, EDU_AGE, rankPay, promoReady, runEvent, eventOK, payerFor, rankName, tone, afford, autoSchool, enroll,
  };
})());
