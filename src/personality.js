/* =====================================================================
   PERSONALITY — MBTI types and character traits.
   Everyone has four type axes (E/I, N/S, T/F, J/P, each -1..1) and up to
   five traits. Both are partly inherited, and traits grow out of what a
   person actually does: pick brave options and you become brave. They
   feed back into happiness, work, relationships, romance, event odds,
   accidents, crime, NPC marriages and divorces, and what an NPC (or the
   auto-player "in character") chooses.
   ===================================================================== */

DATA.mbti = {
  INTJ: ['The Architect', 'Strategic and independent; always has a plan.'],
  INTP: ['The Logician', 'Curious and inventive; lives for ideas.'],
  ENTJ: ['The Commander', 'Bold and decisive, born to lead.'],
  ENTP: ['The Debater', 'Quick-witted; loves a challenge and an argument.'],
  INFJ: ['The Advocate', 'Quietly idealistic and deeply principled.'],
  INFP: ['The Mediator', 'Gentle and imaginative, guided by values.'],
  ENFJ: ['The Protagonist', 'Warm and inspiring; brings people together.'],
  ENFP: ['The Campaigner', 'Enthusiastic, creative and endlessly sociable.'],
  ISTJ: ['The Logistician', 'Dutiful, practical and reliable.'],
  ISFJ: ['The Defender', 'Caring and loyal; protects their own.'],
  ESTJ: ['The Executive', 'Organised and firm; gets things done.'],
  ESFJ: ['The Consul', 'Sociable and helpful; the heart of any community.'],
  ISTP: ['The Virtuoso', 'Hands-on and cool-headed; a natural tinkerer.'],
  ISFP: ['The Adventurer', 'An easy-going artist who lives in the moment.'],
  ESTP: ['The Entrepreneur', 'Energetic risk-taker who lives for action.'],
  ESFP: ['The Entertainer', 'Spontaneous and fun; loves the spotlight.'],
};
DATA.axes = [['e', 'Extraverted', 'Introverted'], ['n', 'Intuitive', 'Observant'], ['t', 'Thinking', 'Feeling'], ['j', 'Judging', 'Prospecting']];

// ax: how the MBTI axes make a trait more likely at birth (e: +E, n: +N, t: +T, j: +J)
DATA.traits = [
  { id: 'ambitious', n: 'Ambitious', o: 'easygoing', ax: { j: 0.6, e: 0.3 }, d: 'Works harder and climbs faster, but frets when stuck without work.' },
  { id: 'easygoing', n: 'Easygoing', o: 'ambitious', ax: { j: -0.6 }, d: 'Content with little: happier day to day, slower to rise.' },
  { id: 'brave', n: 'Brave', o: 'cowardly', ax: { e: 0.3, t: 0.3 }, d: 'Wins more fights and duels, and holds the line in war.' },
  { id: 'cowardly', n: 'Timid', o: 'brave', ax: { e: -0.4 }, d: 'Steers clear of danger and loses most confrontations.' },
  { id: 'kind', n: 'Kind', o: 'cruel', ax: { t: -0.7 }, d: 'People warm to them; closeness and reputation grow.' },
  { id: 'cruel', n: 'Cruel', o: 'kind', ax: { t: 0.5 }, d: 'Feared rather than loved; relationships sour.' },
  { id: 'honest', n: 'Honest', o: 'deceitful', ax: { j: 0.3, t: -0.2 }, d: 'Trusted by all; bad at lying, cheating and crime.' },
  { id: 'deceitful', n: 'Deceitful', o: 'honest', ax: { j: -0.3 }, d: 'A smooth liar: better at crime and bluffing, trusted less.' },
  { id: 'generous', n: 'Generous', o: 'greedy', ax: { t: -0.4 }, d: 'Gives freely; loved, but seldom rich.' },
  { id: 'greedy', n: 'Greedy', o: 'generous', ax: { t: 0.3 }, d: 'Money sticks to them. Friends, less so.' },
  { id: 'cheerful', n: 'Cheerful', o: 'melancholic', ax: { e: 0.5 }, d: 'Bounces back from anything; happiness stays high.' },
  { id: 'melancholic', n: 'Melancholic', o: 'cheerful', ax: { e: -0.4, n: 0.3 }, d: 'Prone to gloom, but feels deeply and creates beautifully.' },
  { id: 'gregarious', n: 'Gregarious', o: 'shy', ax: { e: 1 }, d: 'Makes friends everywhere and loves a crowd.' },
  { id: 'shy', n: 'Shy', o: 'gregarious', ax: { e: -1 }, d: 'Few friends, but deep ones. Parties drain them.' },
  { id: 'diligent', n: 'Diligent', o: 'lazy', ax: { j: 0.7 }, d: 'A steady worker whose willpower keeps growing.' },
  { id: 'lazy', n: 'Lazy', o: 'diligent', ax: { j: -0.5 }, d: 'Avoids effort; work and health suffer.' },
  { id: 'patient', n: 'Patient', o: 'hotheaded', ax: { j: 0.2, t: 0.2 }, d: 'Calm under pressure, with steady mental health.' },
  { id: 'hotheaded', n: 'Hot-headed', o: 'patient', ax: { e: 0.3, j: -0.2 }, d: 'Quick to anger: more quarrels, more fights.' },
  { id: 'curious', n: 'Curious', ax: { n: 0.8 }, d: 'Learns faster and loves to travel.' },
  { id: 'romantic', n: 'Romantic', ax: { t: -0.5, n: 0.3 }, d: 'Falls in love easily and deeply.' },
  { id: 'loyal', n: 'Loyal', o: 'fickle', ax: { j: 0.5, t: -0.2 }, d: 'Relationships last; divorce is rare.' },
  { id: 'fickle', n: 'Fickle', o: 'loyal', ax: { j: -0.6 }, d: 'Bores easily; relationships fade faster.' },
  { id: 'pious', n: 'Pious', o: 'skeptic', ax: { n: -0.2, j: 0.3 }, d: 'Finds peace in faith; respected in devout ages.' },
  { id: 'skeptic', n: 'Skeptical', o: 'pious', ax: { t: 0.6, n: 0.2 }, d: 'Questions everything: a sharper mind, a cooler faith.' },
  { id: 'creative', n: 'Creative', ax: { n: 0.8, j: -0.3 }, d: 'Imagination keeps growing; creative work pays off more.' },
  { id: 'athletic', n: 'Athletic', ax: { n: -0.4 }, d: 'A strong body: healthier, and better at sport and war.' },
  { id: 'charming', n: 'Charming', ax: { e: 0.7, t: -0.2 }, d: 'Wins hearts, votes and job interviews.' },
  { id: 'reckless', n: 'Reckless', o: 'cautious', ax: { j: -0.6, e: 0.3 }, d: 'A thrill-seeker: bigger wins, more accidents.' },
  { id: 'cautious', n: 'Cautious', o: 'reckless', ax: { j: 0.5, e: -0.2 }, d: 'Plays it safe: fewer accidents, fewer windfalls.' },
  { id: 'jealous', n: 'Jealous', ax: { t: -0.2 }, d: 'Guards what they love, and quarrels with partners.' },
];

const Pers = (() => {
  const S = Sim;
  const T = id => DATA.traits.find(t => t.id === id);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const cl = v => Math.max(-1, Math.min(1, v));
  const typeOf = ax => `${ax.e >= 0 ? 'E' : 'I'}${ax.n >= 0 ? 'N' : 'S'}${ax.t >= 0 ? 'T' : 'F'}${ax.j >= 0 ? 'J' : 'P'}`;
  const has = (p, id) => !!p.pers && p.pers.tr.includes(id);
  const capAt = a => (a < 6 ? 1 : a < 13 ? 2 : a < 18 ? 3 : a < 30 ? 4 : 5);

  /* ---------- creation and growth ---------- */
  function traitWeight(t, ax) { let w = 1; for (const [k, v] of Object.entries(t.ax || {})) w *= Math.exp(v * ax[k] * 1.6); return w; }
  function pickTrait(p, prefer) {
    const tr = p.pers.tr, pool = DATA.traits.filter(t => !tr.includes(t.id) && !tr.includes(t.o));
    if (!pool.length) return null;
    return U.wpick(pool, t => traitWeight(t, p.pers.ax) * (1 + (p.pers.sc?.[t.id] || 0)) * (prefer?.includes(t.id) ? 3 : 1));
  }
  function make(p, fa, mo) {
    const pa = [fa, mo].filter(x => x && x.pers);
    const ax = {};
    for (const k of ['e', 'n', 't', 'j']) {
      const inh = pa.length ? pa.reduce((s, x) => s + x.pers.ax[k], 0) / pa.length : 0;
      ax[k] = cl(inh * 0.45 + gauss() * 0.5);
    }
    p.pers = { ax, tr: [], sc: {}, type: typeOf(ax) };
    const inherited = pa.flatMap(x => x.pers.tr).filter(() => Math.random() < 0.3);
    const n = S.age(p) >= 18 ? U.ri(3, 4) : Math.min(capAt(S.age(p)), 2);
    for (let i = 0; i < n; i++) { const t = pickTrait(p, inherited); if (t) p.pers.tr.push(t.id); }
    // dynasty traits and the family's temperament can tilt a newborn (see legacy.js)
    if (S.hooks.persBorn) S.hooks.persBorn(p);
  }
  function ensure(p) {
    if (p.pers && p.pers.ax) { p.pers.sc ||= {}; p.pers.type = typeOf(p.pers.ax); return; }
    make(p, S.P(p.fa), S.P(p.mo));
  }

  // A choice or habit nudges a trait. Enough nudges and it becomes who you are.
  function nudge(p, id, w = 1, quiet) {
    if (!p.pers || !T(id)) return;
    const t = T(id), sc = p.pers.sc;
    sc[id] = (sc[id] || 0) + w;
    if (t.o) sc[t.o] = Math.max(0, (sc[t.o] || 0) - w * 0.7);
    for (const [k, v] of Object.entries(t.ax || {})) p.pers.ax[k] = cl(p.pers.ax[k] + v * 0.01 * w);
    const a = S.age(p), tr = p.pers.tr;
    if (tr.includes(id)) return;
    if (t.o && tr.includes(t.o)) {
      if (sc[id] >= 7) {
        tr.splice(tr.indexOf(t.o), 1, id); sc[id] = 2;
        if (!quiet) S.log(p, `You have changed: people no longer call you ${T(t.o).n.toLowerCase()}, but ${t.n.toLowerCase()}.`, 'good');
      }
      return;
    }
    if (sc[id] >= 4 && a >= 4 && tr.length < capAt(a) + 1) {
      tr.push(id); sc[id] = 1;
      if (!quiet) S.log(p, `A trait has taken root: you are ${t.n.toLowerCase()}. ${t.d}`, 'good');
    }
    p.pers.type = typeOf(p.pers.ax);
  }

  /* ---------- compatibility and job fit ---------- */
  const GOLDEN = ['INFJ ENFP', 'INFJ ENTP', 'INTJ ENFP', 'INTJ ENTP', 'INFP ENFJ', 'INFP ENTJ', 'INTP ENTJ', 'INTP ESTJ', 'ISFJ ESFP', 'ISFJ ESTP', 'ISTJ ESFP', 'ISTJ ESTP', 'ISFP ENFJ', 'ISFP ESFJ', 'ISTP ESFJ', 'ISTP ESTJ'];
  function compat(a, b) {
    if (!a?.pers || !b?.pers) return 0;
    const A = a.pers, B = b.pers;
    let c = 0;
    c += (Math.sign(A.ax.n) === Math.sign(B.ax.n) ? 0.25 : -0.15);
    c += (Math.sign(A.ax.t) === Math.sign(B.ax.t) ? 0.1 : 0);
    c += 0.05;
    const pair = [A.type, B.type].sort().join(' ');
    if (GOLDEN.some(g => g.split(' ').sort().join(' ') === pair)) c += 0.3;
    for (const t of A.tr) {
      if (B.tr.includes(t)) c += 0.12;
      const o = T(t)?.o; if (o && B.tr.includes(o)) c -= 0.2;
    }
    if (A.tr.includes('kind') || B.tr.includes('kind')) c += 0.08;
    if (A.tr.includes('cruel') || B.tr.includes('cruel')) c -= 0.15;
    if (A.tr.includes('jealous') && B.tr.includes('fickle')) c -= 0.25;
    return cl(c);
  }
  const FIT = [
    [/engineer|programmer|developer|scientist|astronom|inventor|data|archivist|codebreaker|mechanic|technician|philosoph|researcher|accountant|banker|stockbroker|surgeon|geolog|navigator/i, 't', 1],
    [/nurse|teacher|priest|monk|nun|clergy|healer|care|therap|charity|midwife|shaman|imam|mullah/i, 't', -1],
    [/merchant|trader|sales|shopkeeper|innkeeper|anchor|actor|star|senator|governor|founder|manager|lawyer|courtier|entertainer|musician|performer|diplomat|chief|creator|influencer|politic|barista/i, 'e', 1],
    [/scribe|programmer|archivist|farmer|shepherd|researcher|writer|painter|sculptor|weaver|potter|monk|nun|embalmer|hydroponic|miner|data/i, 'e', -1],
    [/artist|painter|sculptor|musician|poet|designer|architect|inventor|writer|actor|creator|philosoph|griot|troubadour|perfumer|shaman|dreamer/i, 'n', 1],
    [/farmer|miner|smith|carpenter|mason|soldier|legionary|mechanic|porter|hand|worker|labourer|fisher|hunter|gatherer|builder|electrician|driver|servant|peasant|herder|hauler/i, 'n', -1],
    [/clerk|accountant|lawyer|judge|official|officer|administrator|banker|police|executive|scribe|secretary/i, 'j', 1],
    [/musician|artist|founder|trader|crypto|content|streamer|entertainer|explorer|prospector|mercenary|gladiator|athlete|cowboy/i, 'j', -1],
  ];
  const TFIT = [[/soldier|legionary|knight|warrior|athlete|gladiator|miner|cossack|samurai|man-at-arms|hunter/i, 'athletic'], [/merchant|sales|actor|star|senator|anchor|politic|courtier|diplomat|influencer/i, 'charming'], [/judge|priest|clergy|official|accountant|banker/i, 'honest'], [/painter|sculptor|musician|poet|writer|designer|artist|creator/i, 'creative'], [/scientist|researcher|inventor|astronom|philosoph|scholar/i, 'curious']];
  function jobFit(p, j) {
    if (!p.pers || !j) return 0;
    const t = j.t || '';
    let s = 0, n = 0;
    for (const [rx, k, sign] of FIT) if (rx.test(t)) { s += p.pers.ax[k] * sign; n++; }
    for (const [rx, tr] of TFIT) if (rx.test(t) && has(p, tr)) { s += 0.6; n++; }
    return n ? cl(s / Math.max(1, n * 0.8)) : 0;
  }

  /* ---------- what a person picks, given their character ---------- */
  // [label pattern, traits that favour it, traits that avoid it]
  const CHOICE = [
    [/fight|draw your sword|confront|meet him|take the cross|charge|duel|defend|refuse|stand|rise to/i, ['brave', 'hotheaded', 'reckless'], ['cowardly', 'cautious', 'patient']],
    [/run|hide|flee|walk on|bow and|chicken|apologise|leave town|swallow|pack your|keep your head/i, ['cowardly', 'cautious', 'patient'], ['brave', 'hotheaded']],
    [/return it|give generously|vouch|help|hear their side|talk to someone|kinder|take them in|donate/i, ['kind', 'generous', 'honest'], ['cruel', 'greedy']],
    [/keep it|snub them back|shout|punish/i, ['greedy', 'cruel', 'hotheaded'], ['kind', 'generous', 'patient']],
    [/bribe|cheat|pay .* off|lie|forge|smuggle|steal|do it$/i, ['deceitful', 'greedy', 'reckless'], ['honest', 'cautious']],
    [/invest|buy|go prospecting|enter|emigrate|enrol|court them|play$/i, ['reckless', 'ambitious', 'curious'], ['cautious']],
    [/pass|decline|stay|keep your money|not this year|politely/i, ['cautious', 'easygoing'], ['reckless', 'ambitious']],
    [/celebrate|party|host|attend|join/i, ['gregarious', 'cheerful'], ['shy']],
    [/quietly|stay home|alone|go back to sleep/i, ['shy', 'easygoing', 'melancholic'], ['gregarious']],
    [/study|learn|seek answers|sit the|get up and create/i, ['curious', 'diligent', 'creative', 'skeptic'], ['lazy']],
    [/pray|faith|offer|confess|pilgrim/i, ['pious'], ['skeptic']],
    [/work|push through|throw yourself|resist/i, ['diligent', 'ambitious'], ['lazy', 'easygoing']],
    [/give in|take time off|wing it|ignore/i, ['lazy', 'easygoing'], ['diligent']],
    [/confess|ask your crush|court|propose|accept the match|meet them/i, ['romantic', 'charming'], ['shy']],
  ];
  function choiceScore(p, label) {
    let s = 0;
    for (const [rx, pro, con] of CHOICE) if (rx.test(label)) { for (const t of pro) if (has(p, t)) s += 1; for (const t of con) if (has(p, t)) s -= 1; }
    return s;
  }
  function inCharacter(p, choices) {
    const scored = choices.map(c => [c, choiceScore(p, c.l || '') + Math.random() * 0.9]);
    scored.sort((a, b) => b[1] - a[1]);
    return scored[0][0];
  }

  /* ---------- hooks: feedback into everything ---------- */
  S.addHook('onCreate', p => make(p, S.P(p.fa), S.P(p.mo)));
  S.addHook('migrate', w => Object.values(w.people).forEach(ensure));

  S.addHook('hpTarget', (p, e) => {
    let d = 0;
    if (has(p, 'cheerful')) d += 7; if (has(p, 'melancholic')) d -= 6; if (has(p, 'easygoing')) d += 3;
    if (has(p, 'ambitious')) d += p.job || S.age(p) < 18 || p.retired ? 1 : -5;
    const friends = Object.values(p.rels).filter(r => r.k === 'friend').length;
    if (has(p, 'gregarious')) d += friends >= 3 ? 3 : -3;
    if (p.pers && p.pers.ax.e > 0.3 && friends === 0 && S.age(p) >= 14) d -= 3;
    if (has(p, 'pious')) d += DATA.PREMODERN.includes(e.id) ? 4 : 2;
    if (has(p, 'greedy')) d += p.money > S.toVal(e.cost * 10) ? 3 : -2;
    if (p.job) d += jobFit(p, p.job) * 4;
    return d;
  }, 'add');
  S.addHook('perf', (p, j) => (has(p, 'diligent') ? 3 : 0) - (has(p, 'lazy') ? 3 : 0) + (has(p, 'ambitious') ? 2 : 0) + jobFit(p, j) * 3, 'add');
  S.addHook('promoMul', p => (has(p, 'ambitious') ? 1.4 : 1) * (has(p, 'charming') ? 1.2 : 1) * (has(p, 'lazy') ? 0.6 : 1) * (has(p, 'easygoing') ? 0.8 : 1), 'mul');
  S.addHook('relDrift', (p, o, r) => {
    let d = compat(p, o) * 1.5;
    if (has(p, 'loyal')) d += 1.2; if (has(p, 'fickle')) d -= 1.5; if (has(p, 'kind')) d += 0.8; if (has(p, 'cruel')) d -= 1.5; if (has(p, 'hotheaded')) d -= 0.8;
    if (r.k === 'friend') d += has(p, 'gregarious') ? 0.6 : has(p, 'shy') ? -0.4 : 0;
    return d;
  }, 'add');
  S.addHook('relGain', (p, o, act) => {
    if (act === 'argue') return (has(p, 'hotheaded') ? -4 : 0) + (has(p, 'patient') ? 5 : 0) + (has(o, 'hotheaded') ? -3 : 0);
    return compat(p, o) * 4 + (has(p, 'charming') ? 2 : 0) + (has(p, 'kind') ? 1 : 0) + (has(p, 'cruel') ? -2 : 0);
  }, 'add');
  S.addHook('odds', (p, c) => {
    if (!p.pers) return 0;
    let d = 0;
    const tag = c.tag, o = c.o;
    if (tag === 'romance') d += (has(p, 'charming') ? 0.12 : 0) + (has(p, 'romantic') ? 0.05 : 0) - (has(p, 'shy') ? 0.08 : 0) + (o ? compat(p, o) * 0.12 : 0);
    else if (tag === 'propose') d += (o ? compat(p, o) * 0.15 : 0) + (has(p, 'loyal') ? 0.05 : 0) + (has(o, 'romantic') ? 0.05 : 0);
    else if (tag === 'crime') d += (has(p, 'deceitful') ? 0.12 : 0) - (has(p, 'honest') ? 0.1 : 0) + (has(p, 'cautious') ? 0.05 : 0) - (has(p, 'reckless') ? 0.05 : 0);
    else if (tag === 'interview') d += (has(p, 'charming') ? 0.1 : 0) + (has(p, 'ambitious') ? 0.05 : 0) - (has(p, 'shy') ? 0.05 : 0);
    else if (tag === 'fight') d += (has(p, 'brave') ? 0.1 : 0) - (has(p, 'cowardly') ? 0.1 : 0) + (has(p, 'athletic') ? 0.08 : 0) + (has(p, 'hotheaded') ? 0.03 : 0);
    else if (tag === 'vote') d += (has(p, 'charming') ? 0.08 : 0) + (has(p, 'honest') ? 0.03 : 0) + (has(p, 'cruel') ? -0.05 : 0) + (p.pers.ax.e > 0 ? 0.03 : -0.02);
    else if (c.l) {
      const l = c.l;
      if (/fight|duel|draw|confront|meet him|take the cross|charge|refuse/i.test(l)) d += (has(p, 'brave') ? 0.12 : 0) - (has(p, 'cowardly') ? 0.12 : 0) + (has(p, 'athletic') ? 0.06 : 0);
      if (/ask|confess|court|speak|attend and|flirt/i.test(l)) d += (has(p, 'charming') ? 0.12 : 0) - (has(p, 'shy') ? 0.1 : 0);
      if (/sit|exam|study|play$|enrol/i.test(l)) d += (has(p, 'curious') ? 0.05 : 0) + (has(p, 'diligent') ? 0.05 : 0) - (has(p, 'lazy') ? 0.05 : 0);
      if (/resist|push through|get fit/i.test(l)) d += (has(p, 'diligent') ? 0.1 : 0) + (has(p, 'patient') ? 0.05 : 0) - (has(p, 'lazy') ? 0.1 : 0);
      if (/bribe|cheat|lie|bluff/i.test(l)) d += (has(p, 'deceitful') ? 0.1 : 0) - (has(p, 'honest') ? 0.1 : 0);
      if (/invest|buy|prospect/i.test(l)) d += has(p, 'curious') ? 0.02 : 0;
    }
    return d;
  }, 'add');
  S.addHook('npcMul', (p, what) => {
    if (what === 'marry') return (has(p, 'romantic') ? 1.4 : 1) * (has(p, 'gregarious') ? 1.2 : 1) * (has(p, 'shy') ? 0.7 : 1);
    if (what === 'divorce') { const sp = S.spouse(p); return (has(p, 'loyal') ? 0.4 : 1) * (has(p, 'fickle') ? 2 : 1) * (has(p, 'hotheaded') ? 1.5 : 1) * (has(p, 'patient') ? 0.7 : 1) * (has(p, 'cruel') ? 1.5 : 1) * (sp ? 1 - compat(p, sp) * 0.5 : 1); }
    return 1;
  }, 'mul');
  S.addHook('accMul', p => (has(p, 'reckless') ? 1.6 : 1) * (has(p, 'cautious') ? 0.7 : 1) * (has(p, 'athletic') ? 0.9 : 1), 'mul');
  S.addHook('mort', p => (has(p, 'athletic') ? 0.95 : 1) * (has(p, 'melancholic') ? 1.03 : 1) * (has(p, 'lazy') ? 1.03 : 1), 'mul');
  S.addHook('crimeMul', p => (has(p, 'deceitful') ? 1.3 : 1) * (has(p, 'greedy') ? 1.2 : 1), 'mul');
  S.addHook('npcChoose', (p, choices) => inCharacter(p, choices));
  S.addHook('chose', (p, c) => {
    for (const [rx, pro] of CHOICE) if (rx.test(c.l || '')) { nudge(p, pro[0], 1, p.id !== S.W.playerId); break; }
  });

  // Solitary and social pleasures land differently on introverts and extraverts
  const SOCIAL = /u:(party|friend|love|gamble)|e:(games|symposium|fair|joust|masque|salon|coffee|concert|swing|movies|zerog|vr)/;
  const SOLO = /u:(study|faith|daydream|create|discipline|mind)|e:(philo|anatomy|radio|tv|sanctuary|detox|confess)/;
  const HABIT = { 'u:gym': 'athletic', 'u:study': 'curious', 'u:create': 'creative', 'u:faith': 'pious', 'u:party': 'gregarious', 'u:friend': 'gregarious', 'u:love': 'romantic', 'u:crime': 'deceitful', 'u:gamble': 'reckless', 'u:discipline': 'diligent', 'u:mind': 'patient', 'u:daydream': 'creative' };
  S.addHook('afterAct', (p, act) => {
    if (!p.pers) return '';
    const e = p.pers.ax.e, id = act.id;
    let note = '';
    if (SOCIAL.test(id)) { const d = Math.round(e * 4 + (has(p, 'gregarious') ? 2 : 0) - (has(p, 'shy') ? 2 : 0)); if (d) { p.hp = U.clamp(p.hp + d); note = d > 0 ? 'You came alive in the company.' : 'All those people wore you out.'; } }
    else if (SOLO.test(id)) { const d = Math.round(-e * 3); if (d > 0) { p.hp = U.clamp(p.hp + d); p.mh = U.clamp((p.mh ?? 60) + 1); note = 'The quiet suited you.'; } }
    if (id === 'u:gym' && has(p, 'athletic')) p.h = U.clamp(p.h + 2);
    if (id === 'u:study' && has(p, 'curious')) p.sm = U.clamp(p.sm + 1);
    if (id === 'u:create' && has(p, 'creative')) p.im = U.clamp((p.im ?? 50) + 2);
    if (id === 'u:faith') { if (has(p, 'pious')) p.mh = U.clamp((p.mh ?? 60) + 3); if (has(p, 'skeptic')) p.hp = U.clamp(p.hp - 2); }
    if (HABIT[id]) nudge(p, HABIT[id], 0.5);
    return note;
  });
  S.addHook('afterInteract', (p, o, act) => {
    if (act === 'argue') nudge(p, 'hotheaded', 0.7);
    else if (act === 'gift') nudge(p, 'generous', 0.7);
    else if (act === 'time') nudge(p, 'loyal', 0.3);
    else if (act === 'money') nudge(p, 'greedy', 0.4);
  });
  S.addHook('tick', (p, e, a) => {
    if (!p.pers) return;
    const tr = p.pers.tr;
    if (tr.includes('diligent')) p.wp = U.clamp((p.wp ?? 50) + 0.4);
    if (tr.includes('lazy')) { p.wp = U.clamp((p.wp ?? 50) - 0.3); p.bmi = Math.min(45, (p.bmi ?? 22) + 0.1); }
    if (tr.includes('athletic') && a < 60) p.h = U.clamp(p.h + 0.6);
    if (tr.includes('creative')) p.im = U.clamp((p.im ?? 50) + 0.4);
    if (tr.includes('curious') && a < 70) p.sm = U.clamp(p.sm + 0.25);
    if (tr.includes('melancholic')) { p.mh = U.clamp((p.mh ?? 60) - 0.5); p.im = U.clamp((p.im ?? 50) + 0.2); }
    if (tr.includes('cheerful') || tr.includes('patient')) p.mh = U.clamp((p.mh ?? 60) + 0.4);
    if (tr.includes('hotheaded')) p.mh = U.clamp((p.mh ?? 60) - 0.2);
    if (tr.includes('kind') || tr.includes('honest')) p.rep = U.clamp(p.rep + 0.2);
    if (tr.includes('cruel') || tr.includes('deceitful')) p.rep = U.clamp(p.rep - 0.2);
    if (tr.includes('charming') && (p.fm ?? 0) > 10) p.fm = U.clamp(p.fm + 0.2);
    // new traits surface at life's turning points
    if ([6, 13, 18, 30, 50].includes(a) && tr.length < capAt(a)) {
      const t = pickTrait(p, Object.entries(p.pers.sc).filter(([, v]) => v >= 2).map(([k]) => k));
      if (t) { tr.push(t.id); if (p.id === S.W.playerId) S.log(p, `As you grew, a new side of you emerged: ${t.n.toLowerCase()}. ${t.d}`, 'life'); }
    }
    p.pers.type = typeOf(p.pers.ax);
  });

  const describe = p => {
    if (!p.pers) return null;
    const [n, d] = DATA.mbti[p.pers.type] || ['', ''];
    return { type: p.pers.type, name: n, d, ax: p.pers.ax, traits: p.pers.tr.map(T).filter(Boolean) };
  };
  return { make, ensure, nudge, compat, jobFit, has, describe, inCharacter, choiceScore, typeOf, T };
})();
Sim.pers = Pers;
