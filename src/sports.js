/* =====================================================================
   SPORTS — take up a sport of your age and land, train, compete, climb
   from hobbyist to club, regional star, professional and legend, win
   titles (and the Olympics, in the years they are held), get injured,
   and age out of your prime. Going professional becomes your job.
   ===================================================================== */

DATA.sports = [
  { id: 'running', n: 'Foot racing', who: 'Runner', from: -10000, to: 99999 },
  { id: 'wrestling', n: 'Wrestling', who: 'Wrestler', from: -10000, to: 99999, cc: { GRC: 'Pankration', JPN: 'Sumo', IRN: 'Pahlevani wrestling', IND: 'Kushti', ANA: 'Oil wrestling', WAF: 'Traditional wrestling' } },
  { id: 'spear', n: 'Spear throwing', who: 'Spear thrower', from: -10000, to: -800 },
  { id: 'chariot', n: 'Chariot racing', who: 'Charioteer', from: -1500, to: 600, risk: 0.05, fame: 1.5 },
  { id: 'boxing', n: 'Boxing', who: 'Boxer', from: -700, to: 99999, risk: 0.03 },
  { id: 'ballgame', n: 'The ball game (ōllamaliztli)', who: 'Ball player', from: -1400, to: 1540, only: ['MEX'] },
  { id: 'jousting', n: 'Jousting', who: 'Jouster', from: 1000, to: 1600, sex: 'M', risk: 0.05, fame: 1.5, cls: 3, only: ['ENG', 'FRA', 'ITA', 'SCA', 'RUS'] },
  { id: 'archery', n: 'Archery', who: 'Archer', from: -3000, to: 99999 },
  { id: 'cuju', n: 'Cuju (kickball)', who: 'Cuju player', from: -300, to: 1650, only: ['CHN'] },
  { id: 'kemari', n: 'Kemari', who: 'Kemari player', from: 600, to: 1868, only: ['JPN'] },
  { id: 'fencing', n: 'Fencing', who: 'Fencer', from: 1400, to: 99999 },
  { id: 'calcio', n: 'Calcio', who: 'Calcio player', from: 1500, to: 1740, only: ['ITA'] },
  { id: 'cricket', n: 'Cricket', who: 'Cricketer', from: 1700, to: 99999, only: ['ENG', 'IND', 'USA'] },
  { id: 'horse', n: 'Horse racing', who: 'Jockey', from: 1650, to: 99999, risk: 0.04 },
  { id: 'football', n: 'Football', who: 'Footballer', from: 1860, to: 99999, fame: 1.4 },
  { id: 'baseball', n: 'Baseball', who: 'Baseball player', from: 1845, to: 99999, only: ['USA', 'JPN', 'MEX'] },
  { id: 'cycling', n: 'Cycling', who: 'Cyclist', from: 1870, to: 99999 },
  { id: 'tennis', n: 'Tennis', who: 'Tennis player', from: 1874, to: 99999 },
  { id: 'basketball', n: 'Basketball', who: 'Basketball player', from: 1891, to: 99999, fame: 1.3 },
  { id: 'athletics', n: 'Athletics', who: 'Athlete', from: 1880, to: 99999 },
  { id: 'hockey', n: 'Ice hockey', who: 'Hockey player', from: 1875, to: 99999, only: ['RUS', 'SCA', 'USA'], risk: 0.03 },
  { id: 'swimming', n: 'Swimming', who: 'Swimmer', from: 1880, to: 99999 },
  { id: 'martial', n: 'Martial arts', who: 'Martial artist', from: 500, to: 99999, only: ['CHN', 'JPN'] },
  { id: 'esports', n: 'Esports', who: 'Pro gamer', from: 2000, to: 99999, fame: 1.2, mind: 1 },
  { id: 'drone', n: 'Drone racing', who: 'Drone racer', from: 2025, to: 99999, mind: 1 },
  { id: 'exoball', n: 'Exosuit football', who: 'Exoball player', from: 2060, to: 99999, fame: 1.4 },
  { id: 'zerog', n: 'Zero-g polo', who: 'Zero-g polo player', from: 2150, to: 99999 },
  { id: 'gravball', n: 'Gravball', who: 'Gravball athlete', from: 2150, to: 99999, fame: 1.5, risk: 0.02 },
];

const Sports = (() => {
  const S = Sim, yr = () => S.W.year;
  const LVL = ['Hobbyist', 'Club player', 'Regional star', 'Professional', 'Legend'];
  const NEED = [0, 20, 40, 60, 80];            // skill to try out for each level
  const PAY = [0, 0.2, 0.8, 3, 12];            // share of a year's living cost
  const spec = id => DATA.sports.find(s => s.id === id);
  const nameIn = (s, cc) => (s.cc && s.cc[cc]) || s.n;
  const avail = p => DATA.sports.filter(s => yr() >= s.from && yr() <= s.to && (!s.only || s.only.includes(p.cc)) && (!s.sex || s.sex === p.sex) && (!s.cls || (p.cls ?? 2) >= s.cls));
  const olympics = () => { const y = yr(); return (y >= -776 && y <= 393 && (y + 776) % 4 === 0) || (y >= 1896 && y % 4 === 0 && ![1916, 1940, 1944].includes(y)); };
  const label = p => { const s = p.sport && spec(p.sport.id); return s ? `${LVL[p.sport.lvl]} · ${nameIn(s, p.cc)} · skill ${Math.round(p.sport.skill)}` : ''; };
  const prime = a => (a < 14 ? 1.3 : a < 26 ? 1.15 : a < 31 ? 1 : a < 36 ? 0.6 : 0.3);
  const mult = p => (S.pers?.has(p, 'athletic') ? 1.3 : 1) * (S.pers?.has(p, 'diligent') ? 1.15 : 1) * (S.pers?.has(p, 'lazy') ? 0.7 : 1) * (0.7 + (p.wp ?? 50) / 170);

  function takeUp(id) {
    const p = S.me(), s = spec(id);
    if (!s || !avail(p).includes(s)) return 'That sport is not played here and now.';
    if (S.age(p) < 5) return 'You are a little young for that.';
    if (p.sport && p.sport.id === id) return 'You already play it.';
    const talent = s.mind ? (p.sm + (p.im ?? 50)) / 2 : (p.h + (p.lk ?? 50) * 0.2) / 1.2;
    p.sport = { id, skill: U.clamp(talent * 0.25 + U.ri(0, 12)), lvl: 0, yrs: 0, wins: 0, losses: 0, titles: 0, inj: 0, since: yr() };
    S.log(p, `You took up ${nameIn(s, p.cc).toLowerCase()}.`, 'life');
    return `You took up ${nameIn(s, p.cc).toLowerCase()}.`;
  }
  function train() {
    const p = S.me(), sp = p.sport; if (!sp) return '';
    if (p.did.train) return 'You already trained hard this year.';
    if (sp.inj) return 'You are injured. Rest first.';
    p.did.train = 1;
    const s = spec(sp.id), g = U.rand(3, 7) * prime(S.age(p)) * mult(p);
    sp.skill = U.clamp(sp.skill + g);
    S.applyFx(p, s.mind ? { sm: 1, h: -1 } : { h: 2, wp: 1, bmi: -0.3 });
    S.pers?.nudge(p, s.mind ? 'diligent' : 'athletic', 0.5);
    if (!s.mind && U.chance((s.risk || 0.01) + (S.pers?.has(p, 'reckless') ? 0.02 : 0))) { sp.inj = U.ri(1, 2); S.applyFx(p, { h: -10 }); S.log(p, 'You were injured in training.', 'bad'); return 'You pushed too hard and got hurt.'; }
    return `Training paid off. Skill ${Math.round(sp.skill)}.`;
  }
  function compete() {
    const p = S.me(), sp = p.sport; if (!sp) return '';
    if (p.did.compete) return 'You already competed this year.';
    if (sp.inj) return 'You are injured and cannot compete.';
    p.did.compete = 1;
    const s = spec(sp.id), oly = olympics() && sp.lvl >= 3;
    const opp = { n: `${S.pickName(p.sex, S.era(), p.cc)} ${U.pick((S.pool(S.era(), p.cc) || DATA.names.modern).last)}`, skill: U.clamp(NEED[sp.lvl] + U.ri(-5, 22) + (oly ? 12 : 0)) };
    const form = sp.skill + (s.mind ? p.sm / 10 : p.h / 8) + (p.wp ?? 50) / 12 - (s.mind ? 0 : Math.max(0, S.age(p) - 32) * 1.5);
    const odds = x => U.clamp(0.5 + (form + x - opp.skill - 12) / 40, 0.05, 0.95);
    const what = oly ? (yr() < 400 ? 'the Olympic Games at Olympia' : 'the Olympic Games') : ['a local match', 'the club championship', 'the regional finals', 'the national championship', 'the world championship'][sp.lvl];
    const play = x => {
      const won = U.chance(odds(x));
      if (won) {
        sp.wins++; sp.skill = U.clamp(sp.skill + 1);
        const prize = S.toVal(S.era().cost * PAY[sp.lvl] * 0.15);
        p.money += prize;
        S.applyFx(p, { hp: 8, fm: (1 + sp.lvl * 2) * (s.fame || 1), rep: 1 + sp.lvl });
        if (sp.lvl >= 1 && U.chance(0.35 + sp.lvl * 0.1)) { sp.titles++; if (oly) p.flags.olympic = (p.flags.olympic || 0) + 1; S.log(p, `You won ${what}! ${oly ? 'Olympic champion!' : 'A title for the record books.'}`, 'good'); p.flags.champion = 1; return `Champion of ${what}!`; }
        S.log(p, `You beat ${opp.n} at ${what}.`, 'good');
        return `You beat ${opp.n}!${prize > 0 ? ` Prize: ${S.money(prize)}.` : ''}`;
      }
      sp.losses++; S.applyFx(p, { hp: -4, mh: -1 });
      if (!s.mind && U.chance((s.risk || 0.015) * 1.5)) { sp.inj = U.ri(1, 2); S.applyFx(p, { h: -12 }); S.log(p, `You lost to ${opp.n} at ${what}, and were injured.`, 'bad'); return 'You lost, and got hurt.'; }
      S.log(p, `You lost to ${opp.n} at ${what}.`, 'bad');
      return `${opp.n} beat you.`;
    };
    S.prompt({ title: `${nameIn(s, p.cc)} · ${what}`, text: `You face ${opp.n}. They are ${opp.skill > form ? 'the favourite' : opp.skill > form - 10 ? 'evenly matched with you' : 'the underdog'}. How will you play it?`, choices: [
      { l: 'Play your own game', src: { l: 'play', odds: odds(0) }, go: () => play(0) },
      { l: 'Go all out', src: { l: 'play', odds: odds(6) }, go: () => { if (!s.mind && U.chance(0.08)) { sp.inj = 1; S.applyFx(p, { h: -8 }); } return play(6); } },
      { l: 'Play dirty', src: { l: 'cheat', odds: odds(10) }, go: () => { if (U.chance(0.3)) { S.applyFx(p, { rep: -8, fm: 2 }); sp.losses++; S.log(p, `You were disqualified at ${what} for foul play.`, 'bad'); return 'Disqualified for foul play!'; } S.pers?.nudge(p, 'deceitful', 1); return play(10); } }] });
    return `You entered ${what}.`;
  }
  function tryout() {
    const p = S.me(), sp = p.sport; if (!sp) return '';
    if (sp.lvl >= 4) return 'You are already a legend.';
    if (p.did.tryout) return 'You already tried out this year.';
    const next = sp.lvl + 1;
    if (sp.skill < NEED[next]) return `You need skill ${NEED[next]} to try out as a ${LVL[next].toLowerCase()}.`;
    if (next >= 3 && S.age(p) < 16) return 'You must be 16 to turn professional.';
    p.did.tryout = 1;
    if (!U.chance(U.clamp(0.35 + (sp.skill - NEED[next]) / 40 + S.hadd('odds', p, { tag: 'interview' }), 0.1, 0.9))) { S.applyFx(p, { hp: -4 }); return 'Not this time. Keep training.'; }
    sp.lvl = next;
    if (next >= 3) goPro(p);
    S.applyFx(p, { hp: 8, fm: next * 2 });
    S.log(p, `You made it: ${LVL[next].toLowerCase()} in ${nameIn(spec(sp.id), p.cc).toLowerCase()}.`, 'good');
    return `You are now a ${LVL[next].toLowerCase()}!`;
  }
  function goPro(p) {
    const s = spec(p.sport.id), e = S.era();
    const j = J(`${p.sport.lvl >= 4 ? 'Star ' : 'Professional '}${s.who}`, Math.round(e.cost * PAY[p.sport.lvl] * 100) / 100, { fame: s.fame ? 2 * s.fame : 2, risk: s.mind ? 0.001 : (s.risk || 0.015), vol: 0.3 });
    j.id = 'sport-' + s.id;
    if (p.job && p.job.id !== j.id) S.log(p, `You left your job as ${p.job.t.toLowerCase()} to play full time.`, 'work');
    S.giveJob(p, j, e);
  }
  function retire(p = S.me(), quiet) {
    const sp = p.sport; if (!sp) return '';
    if (p.job && p.job.id?.startsWith('sport-')) p.job = null;
    if (!quiet) S.log(p, `You retired from ${nameIn(spec(sp.id), p.cc).toLowerCase()} after ${sp.yrs} years: ${sp.wins} wins, ${sp.titles} titles.`, 'life');
    p.flags.exSport = { id: sp.id, lvl: sp.lvl, titles: sp.titles };
    p.sport = null;
    return 'You hung up your boots.';
  }
  S.addHook('postYear', p => {
    const sp = p.sport; if (!sp) return;
    sp.yrs++;
    const a = S.age(p), s = spec(sp.id);
    if (sp.inj) sp.inj--;
    if (!s.mind && a > 30) sp.skill = U.clamp(sp.skill - (a > 35 ? 4 : 2));
    if (s.mind && a > 40) sp.skill = U.clamp(sp.skill - 1.5);
    if (!p.did.train) sp.skill = U.clamp(sp.skill - 0.8);
    if (sp.lvl >= 3) S.applyFx(p, { fm: sp.lvl === 4 ? 3 : 1.5 });
    if (sp.lvl === 3 && sp.titles >= 3 && sp.skill >= NEED[4] && U.chance(0.3)) { sp.lvl = 4; goPro(p); S.log(p, 'The press calls you a legend of the game.', 'good'); }
    if (!(yr() >= s.from && yr() <= s.to)) { S.log(p, `${s.n} is no longer played. You had to stop.`, 'life'); retire(p, true); return; }
    if (sp.lvl >= 3 && ((!s.mind && a >= 38) || a >= 55) && U.chance(0.5)) { S.log(p, 'Your body told you it was time. You retired from professional sport.', 'life'); retire(p, true); }
  });
  S.snapAdd('Skill', p => p.sport?.skill || 0);
  DATA.achievements.push(
    { id: 'champion', n: 'Champion', d: 'Win a sporting title.', test: p => !!p.flags.champion },
    { id: 'olympian', n: 'Olympic Gold', d: 'Win at the Olympic Games.', test: p => (p.flags.olympic || 0) >= 1 },
    { id: 'pro', n: 'Going Pro', d: 'Become a professional athlete.', test: p => (p.sport?.lvl ?? p.flags.exSport?.lvl ?? 0) >= 3 },
  );
  return { avail, takeUp, train, compete, tryout, retire, label, spec, nameIn, LVL, NEED, olympics };
})();
Sim.sports = Sports;

/* ---------------- sport on the Activities tab ---------------- */
LATE.push(() => {
  const S = Sim, ui = UI, Sp = Sports, { esc, bar, toast, render } = ui;
  const act = ui.views.act;
  ui.views.act = p => {
    const a = S.age(p), sp = p.sport;
    let panel = '';
    if (sp) {
      const s = Sp.spec(sp.id);
      panel = `<div class="panel sport"><div class="eyebrow">Sport · ${esc(Sp.LVL[sp.lvl])}</div><h3>${esc(Sp.nameIn(s, p.cc))}</h3>
        <div class="stat"><span class="k">Skill</span>${bar(sp.skill, 'era')}<span class="v">${Math.round(sp.skill)}</span></div>
        <p class="lede" style="margin-top:8px">${sp.wins} wins, ${sp.losses} losses, ${sp.titles} title${sp.titles === 1 ? '' : 's'} over ${sp.yrs} year${sp.yrs === 1 ? '' : 's'}${sp.inj ? ' · <span class="why">injured</span>' : ''}${Sp.olympics() && sp.lvl >= 3 ? ' · <span class="tag good">Olympic year</span>' : ''}.${sp.lvl < 4 ? ` Next level at skill ${Sp.NEED[sp.lvl + 1]}.` : ''}</p>
        <div class="btnrow"><button class="btn sm era" data-act="sportTrain" data-label="Train">Train hard</button>${ui.pinBtn('sportTrain', {}, 'Train hard')}
          <button class="btn sm" data-act="sportCompete" data-label="Compete">Compete</button>${ui.pinBtn('sportCompete', {}, 'Compete')}
          ${sp.lvl < 4 ? `<button class="btn sm" data-act="sportTry" ${sp.skill < Sp.NEED[sp.lvl + 1] ? 'disabled' : ''}>Try out: ${esc(Sp.LVL[sp.lvl + 1])}</button>` : ''}
          <button class="btn sm danger" data-act="sportRetire">Give it up</button></div></div>`;
    } else if (a >= 5) {
      const list = Sp.avail(p);
      panel = `<div class="panel sport"><div class="eyebrow">Sport</div><h3>Take up a sport</h3><p class="lede">Train, compete and, with talent and grit, go professional.</p>
        <div class="btnrow">${list.map(s => `<button class="btn sm" data-act="sportTake" data-id="${s.id}">${esc(Sp.nameIn(s, p.cc))}</button>`).join('') || '<span class="muted">No organised sport here and now.</span>'}</div></div>`;
    }
    return panel + act(p);
  };
  const done = t => { S.settle(); render(); toast(t); };
  ui.on.sportTake = el => done(Sp.takeUp(el.dataset.id));
  ui.on.sportTrain = () => done(Sp.train());
  ui.on.sportCompete = () => done(Sp.compete());
  ui.on.sportTry = () => done(Sp.tryout());
  ui.on.sportRetire = () => done(Sp.retire());
  Auto.replay.sportTrain = () => Sp.train();
  Auto.replay.sportCompete = () => Sp.compete();
});
