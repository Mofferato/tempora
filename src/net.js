/* =====================================================================
   NET — the internet, from the first email in 1991 to the neural net.
   * Access depends on the country and year (Atlas.net), your wealth and
     your age: nobody is online in 1985, and a village in a poor country
     may only reach it through a café or a shared phone for years.
   * Online life: learn, join communities, date, sell, freelance for
     foreign clients (the pay follows the client's country, not yours),
     create, game, follow the news, invest.
   * Time online is a choice (light, normal, heavy) that shapes sleep,
     mood, savings and relationships.
   * Risks: scams, hacks, bullying, viral shame, addiction, misinformation,
     censorship and shutdowns where the state is strict or shaky.
   ===================================================================== */

const Net = (() => {
  const S = Sim, A = Atlas, yr = () => S.W.year;
  const state = p => (p.net ||= { u: Math.random(), hrs: 1, rep: 50, comms: [], sec: 0, handle: '', income: 0, jobCC: null });
  const pen = (cc, y = yr()) => A.net(cc, y);
  const censorship = cc => A.C(cc)?.at?.cz ?? 0;
  const ERAS = [
    [1991, 1995, 'Email and bulletin boards', 'mailing lists, bulletin boards and early chat'],
    [1995, 2004, 'The early web', 'portals, forums, instant messengers and online shops'],
    [2004, 2012, 'The social web', 'blogs, video sites and the first social networks'],
    [2012, 2040, 'The mobile age', 'always-on feeds, apps, streaming and remote work'],
    [2040, 2160, 'The neural net', 'a mind-to-mind network that never sleeps'],
    [2160, 99999, 'The Commons', 'a shared mind spanning worlds'],
  ];
  const era = (y = yr()) => ERAS.find(([a, b]) => y >= a && y < b) || null;

  /* ---------- who is online ---------- */
  // 0: not online, 1: patchy (café, shared device, slow), 2: connected
  function access(p, y = yr()) {
    if (y < 1991 || S.age(p) < 5) return 0;
    const s = state(p), cc = p.cc, base = pen(cc, y);
    const wealth = ((p.cls ?? 2) - 2) * 0.09 + (p.money > S.toVal(S.era().cost * 3) ? 0.05 : 0);
    const ageF = S.age(p) > 70 ? -0.25 : S.age(p) > 55 ? -0.1 : S.age(p) < 12 ? -0.05 : 0.08;
    const v = base + wealth + ageF + (p.edu ?? 0) * 0.03;
    if (y >= 2040) return v + 0.1 > s.u * 0.7 ? 2 : 1;
    return v > s.u + 0.28 ? 2 : v > s.u ? 1 : 0;
  }
  const levelText = l => ['Offline', 'Patchy access (cafés and shared devices)', 'Connected'][l];

  /* ---------- the local web ---------- */
  const LOCAL = {
    CHN: ['WeChat', 'Weibo', 'Douyin', 'Baidu'], RUS: ['VK', 'Yandex', 'Telegram'], KOR: ['KakaoTalk', 'Naver'], JPN: ['LINE', 'Niconico', '2channel'], IRN: ['Telegram', 'Instagram'], IND: ['WhatsApp', 'ShareChat', 'Koo'],
    VNM: ['Zalo'], THA: ['LINE'], BRA: ['Orkut', 'WhatsApp'], TUR: ['Ekşi Sözlük', 'Twitter'], UKR: ['Telegram', 'VK'], EGY: ['Facebook', 'Twitter'], NGA: ['WhatsApp', 'Nairaland'],
  };
  const platform = cc => U.pick(LOCAL[cc] || (yr() < 2004 ? ['IRC', 'AOL', 'Usenet', 'GeoCities'] : yr() < 2012 ? ['MySpace', 'Facebook', 'YouTube', 'MSN'] : yr() < 2040 ? ['Instagram', 'TikTok', 'WhatsApp', 'YouTube', 'Twitch'] : ['the Mesh', 'Dreamfeed', 'Echo']));

  /* ---------- time online ---------- */
  const HRS = [['Light', 'An hour a day, no more.'], ['Normal', 'A few hours a day.'], ['Heavy', 'Most waking hours, in one way or another.']];
  function setHours(p, h) { state(p).hrs = U.clamp(h, 0, 2); return `Online time: ${HRS[state(p).hrs][0].toLowerCase()}.`; }

  /* ---------- doing things online ---------- */
  const once = (p, k) => { if (p.did['net:' + k]) return false; p.did['net:' + k] = 1; return true; };
  const cost = m => S.toVal(S.era().cost * m);
  const need = (p, lvl = 1) => (access(p) >= lvl ? '' : 'You are not online.');
  const ACTS = {
    learn: { n: 'Learn something online', min: 8, lvl: 1, run(p, s) {
      if (!once(p, 'learn')) return 'You already studied online this year.';
      const gain = U.ri(2, 5) + (s.hrs === 2 ? 1 : 0); S.applyFx(p, { sm: gain, im: 1 });
      if (p.school) p.school.gr = U.clamp((p.school.gr ?? 60) + 3);
      return `You followed online courses and tutorials (smarts +${gain}).`;
    } },
    community: { n: 'Join an online community', min: 10, lvl: 1, run(p, s) {
      if (!once(p, 'comm')) return 'You already joined one this year.';
      const topics = ['a music fandom', 'a gardening forum', 'a modding community', 'a chess club', 'a support group', 'a language-exchange group', 'a hobby marketplace', 'a local-history society', 'a gaming guild', 'a cooking circle'];
      const what = U.pick(topics); s.comms.push(what); if (s.comms.length > 6) s.comms.shift();
      const o = S.newFriend(p); o.cc = U.chance(0.45) ? p.cc : (A.C(U.pick(DATA.countries.filter(c => c.at && yr() >= c.from).map(c => c.id)))?.id || p.cc);
      p.rels[o.id].c = U.ri(40, 70); o.rels[p.id].c = p.rels[o.id].c;
      S.applyFx(p, { hp: 3, mh: 2 }); s.rep = U.clamp(s.rep + 3);
      return `You joined ${what} on ${platform(p.cc)} and befriended ${o.first}${o.cc !== p.cc ? ` from ${S.world.name(o.cc)}` : ''}.`;
    } },
    date: { n: 'Meet someone online', min: 16, lvl: 1, run(p, s) {
      if (p.sp != null) return 'You are already married.';
      if (!once(p, 'date')) return 'You already tried this year.';
      if (U.chance(0.45 + p.lk / 300)) {
        const o = S.newLover(p, true); const far = yr() > 2000 && U.chance(0.3);
        if (far) { const to = U.pick(DATA.countries.filter(c => c.at && yr() >= c.from && c.id !== p.cc)); o.cc = to.id; S.rel(p, o).c = U.ri(50, 75); }
        S.applyFx(p, { hp: 4 });
        return `You met ${o.first} online${o.cc !== p.cc ? ` — they live in ${S.world.name(o.cc)}` : ''}.`;
      }
      if (U.chance(0.12)) { const lost = Math.round(cost(0.3)); p.money = Math.max(0, p.money - lost); S.applyFx(p, { mh: -5, rep: -1 }); return `It was a romance scam. You lost ${S.money(lost)}.`; }
      S.applyFx(p, { mh: -1 }); return 'Nobody worth meeting this time.';
    } },
    sell: { n: 'Sell things online', min: 14, lvl: 1, run(p, s) {
      if (!once(p, 'sell')) return 'You already did this year.';
      const gain = Math.round(cost(U.rand(0.04, 0.25) * (0.6 + p.sm / 100 + (s.rep - 50) / 200)) * (access(p) === 2 ? 1 : 0.5));
      if (U.chance(0.07)) { S.applyFx(p, { rep: -2, mh: -2 }); return 'A buyer disputed the sale and left you a bad review.'; }
      p.money += gain; s.income += gain; return `Online sales earned ${S.money(gain)}.`;
    } },
    freelance: { n: 'Freelance for clients abroad', min: 16, lvl: 2, from: 1998, run(p, s) {
      if (!once(p, 'free')) return 'You already did this year.';
      const clients = DATA.countries.filter(c => c.at && yr() >= c.from && A.tier(c.id) <= 2 && c.id !== p.cc);
      const client = clients.length ? U.pick(clients) : null;
      const arb = client ? Math.max(1, (4 - A.tier(p.cc)) * 0.5 + 1) : 1;
      const base = cost(U.rand(0.2, 0.7) * (0.5 + p.sm / 100 + (p.edu ?? 0) * 0.1));
      const gain = Math.round(base * (A.tier(p.cc) > 2 ? arb : 1)); p.money += gain; s.income += gain; s.jobCC = client?.id || s.jobCC;
      S.applyFx(p, { sm: 1, wp: 1 });
      return `You did contract work${client ? ` for a client in ${S.world.name(client.id)}` : ''} and earned ${S.money(gain)}${A.tier(p.cc) > 2 ? ', which goes far here' : ''}.`;
    } },
    create: { n: 'Make and share things', min: 10, lvl: 1, from: 1996, run(p, s) {
      if (!once(p, 'create')) return 'You already posted a lot this year.';
      const viral = U.chance(0.05 + (p.im ?? 50) / 800 + (s.hrs === 2 ? 0.03 : 0));
      const ph = p.phone || (p.phone = { inbox: [], followers: 0, posts: [], sent: {} });
      if (viral) { const f = Math.round(U.rand(800, 20000) * (yr() > 2012 ? 3 : 1)); ph.followers += f; S.applyFx(p, { fm: 8, rep: 3, hp: 5 }); s.rep = U.clamp(s.rep + 10); return `It went viral. ${f.toLocaleString()} strangers now follow you.`; }
      const f = U.ri(2, 60); ph.followers += f; S.applyFx(p, { im: 2, hp: 2, fm: 1 }); return `You made something and shared it. ${f} new followers.`;
    } },
    news: { n: 'Follow the news', min: 12, lvl: 1, run(p, s) {
      if (!once(p, 'news')) return 'You already caught up this year.';
      const cz = censorship(p.cc);
      if (cz >= 2 && U.chance(0.3)) { S.applyFx(p, { sm: 0, mh: -2 }); return 'Most of what you read is what the state wants you to read.'; }
      if (U.chance(0.18)) { S.applyFx(p, { mh: -4, sm: -1 }); s.rep = U.clamp(s.rep - 2); return 'You went down a rabbit hole of outrage and fell for a false story.'; }
      S.applyFx(p, { sm: 1, im: 1, mh: -1 }); return 'You stayed informed and a little anxious.';
    } },
    play: { n: 'Play and stream', min: 6, lvl: 1, run(p, s) {
      if (!once(p, 'play')) return 'You already played plenty this year.';
      S.applyFx(p, { mh: s.hrs === 2 ? 1 : 4, hp: 4, wp: s.hrs === 2 ? -2 : 0 });
      return `You played games on ${platform(p.cc)}.`;
    } },
    invest: { n: 'Trade and invest online', min: 18, lvl: 2, from: 1998, run(p, s) {
      if (!once(p, 'invest')) return 'You already traded this year.';
      const stake = cost(0.2); if (p.money < stake) return `You need ${S.money(stake)} to trade.`;
      const r = Math.random();
      if (r < 0.1) { p.money += stake * 3; return `A lucky bet: you made ${S.money(stake * 3)}.`; }
      if (r < 0.5) { p.money += stake * 0.4; return `Trading earned ${S.money(stake * 0.4)}.`; }
      p.money -= stake * 0.6; S.applyFx(p, { mh: -3 }); return `A bad trade cost you ${S.money(stake * 0.6)}.`;
    } },
    secure: { n: 'Secure your accounts (VPN, passwords)', min: 12, lvl: 1, from: 1998, run(p, s) {
      if (!once(p, 'sec')) return 'You already did this year.';
      const c = cost(0.02); p.money = Math.max(0, p.money - c); s.sec = U.clamp(s.sec + 25, 0, 100);
      return 'You tightened your security. Hackers and censors will have a harder time.';
    } },
    detox: { n: 'Take a break from screens', min: 8, lvl: 0, run(p, s) {
      if (!once(p, 'detox')) return 'You already did this year.';
      S.applyFx(p, { mh: 5, hp: 4, wp: 2 }); s.hrs = Math.max(0, s.hrs - 1); return 'A week offline did you a world of good.';
    } },
  };
  function available(p) { return Object.entries(ACTS).filter(([, a]) => (a.from || 1991) <= yr() && S.age(p) >= a.min).map(([id, a]) => ({ id, ...a, why: access(p) < a.lvl ? (a.lvl === 2 ? 'Needs a good connection' : 'Not online') : p.did['net:' + (id === 'community' ? 'comm' : id === 'freelance' ? 'free' : id === 'secure' ? 'sec' : id)] ? 'Done this year' : '' })); }
  function act(id) {
    const p = S.me(), a = ACTS[id], s = state(p); if (!a) return '';
    const why = access(p) < a.lvl ? 'Your connection is not good enough.' : '';
    if (why) return why;
    const t = a.run(p, s); if (t) S.log(p, `Online: ${t}`, 'life'); return t;
  }

  /* ---------- the yearly effects ---------- */
  S.addHook('postYear', p => {
    const lvl = access(p); if (!lvl) return;
    const s = state(p), a = S.age(p);
    if (a < 6) return;
    // screens and sleep
    if (s.hrs === 2) { S.applyFx(p, { mh: -2, wp: -1, h: -1 }); if (a < 20 && U.chance(0.15)) p.school && (p.school.gr = U.clamp((p.school.gr ?? 60) - 4)); }
    if (s.hrs === 0 && lvl === 2) S.applyFx(p, { im: 0 });
    s.sec = U.clamp(s.sec - 4, 0, 100);
    s.rep = U.clamp(s.rep + (s.rep > 50 ? -1 : 1));
  });
  S.addHook('hpTarget', p => { const s = p.net; return s && access(p) ? (s.hrs === 2 ? -1.2 : s.hrs === 1 ? 0.2 : 0.4) : 0; }, 'add');
  S.addHook('relGain', (p, o, act) => (access(p) && p.net?.hrs === 2 && act === 'time' ? -1 : 0), 'add');

  /* ---------- events ---------- */
  function events(p) {
    const lvl = access(p), a = S.age(p), s = state(p), cc = p.cc, cz = censorship(cc), out = [];
    if (!lvl || a < 8) return out;
    const sec = s.sec / 100;
    out.push({ id: 'net-scam', p: 0.07 * (1 - sec * 0.7), min: 14, from: 1996, t: 'An email says you have won a fortune, if you will only send a small fee first.', ch: [
      { l: 'Ignore it', fx: {}, t: 'You deleted it.' },
      { l: 'Pay the fee', fx: { $c: -0.12, mh: -3 }, t: 'It was a scam, of course.' },
      { l: 'Report it', fx: { rep: 1, sm: 1 }, t: 'The authorities thanked you and did nothing.' }] });
    out.push({ id: 'net-hack', p: 0.04 * (1 - sec * 0.8), min: 14, from: 1998, t: 'Someone broke into your accounts.', ch: [
      { l: 'Reset everything', fx: { $c: -0.02, mh: -2, wp: 1 }, t: 'It took a weekend, but you got it all back.' },
      { l: 'Pay the ransom', fx: { $c: -0.3, mh: -4 }, t: 'You paid. They asked for more.' },
      { l: 'Go to the police', odds: 0.35, win: { fx: { rep: 1 }, t: 'They traced the intruder.' }, alt: { fx: { mh: -2 }, t: 'They shrugged.' } }] });
    if (a >= 10 && a <= 24) out.push({ id: 'net-bully', p: 0.06 + (s.hrs === 2 ? 0.03 : 0), min: 10, max: 24, from: 2004, t: `Classmates are mocking you online, on ${platform(cc)}.`, ch: [
      { l: 'Block them and tell an adult', fx: { mh: -2, famc: 3 }, t: 'It helped, a little.' },
      { l: 'Hit back online', odds: 0.4, win: { fx: { rep: 2, wp: 2 }, t: 'You humiliated them in turn.' }, alt: { fx: { mh: -7, rep: -2 }, t: 'It made things much worse.' } },
      { l: 'Log off for a while', fx: { mh: 1, hp: -1 }, t: 'You stayed away until it blew over.', } ] });
    if (a >= 14) out.push({ id: 'net-viralshame', p: 0.025 + (s.hrs === 2 ? 0.015 : 0), min: 14, from: 2008, t: 'A clip of something you said goes viral, and not kindly.', ch: [
      { l: 'Apologise publicly', fx: { rep: -1, mh: -2, fm: 2 }, t: 'It blew over in a week.' },
      { l: 'Lay low', fx: { rep: -3, mh: -3 }, t: 'You waited for the next scandal to bury yours.' },
      { l: 'Double down', odds: 0.35, win: { fx: { fm: 10, rep: 2 }, t: 'You turned the shame into a following.' }, alt: { fx: { fm: 4, rep: -8, mh: -6 }, t: 'You became a meme and lost your job prospects.' } }] });
    if (a >= 12 && a <= 80) out.push({ id: 'net-friend', p: 0.07, min: 12, from: 1995, t: 'An online friend from another country wants to meet in person.', ch: [
      { l: 'Meet them', fx: { $c: -0.15, hp: 6, im: 3, mh: 3 }, t: 'You met at last and it was just like talking online, only better.' },
      { l: 'Stay online friends', fx: { hp: 2 }, t: 'You kept chatting across the distance.' }] });
    if (cz >= 2 && lvl) {
      out.push({ id: 'net-censor', p: 0.06 * cz, min: 14, from: 1998, t: `The authorities in ${S.world.name(cc)} block the sites you used.`, ch: [
        { l: 'Use a VPN', odds: 0.5 + sec * 0.4, win: { fx: { sm: 1, im: 2, mh: 1 }, t: 'You slipped past the filters.' }, alt: { fx: { rep: -4, mh: -4, $c: -0.1 }, t: 'You were flagged and fined.' } },
        { l: 'Do without', fx: { mh: -2, im: -1 }, t: 'You made do with the approved web.' },
        { l: 'Join the protest online', odds: 0.4, win: { fx: { rep: 3, fm: 3 }, t: 'Thousands joined you.' }, alt: { fx: { rep: -6, h: -6, mh: -4 }, t: 'You were arrested for “spreading rumours”.' } }] });
      out.push({ id: 'net-blackout', p: 0.02 * cz, min: 12, from: 2005, t: 'The internet goes dark across the country: a shutdown during unrest.', fx: { mh: -3, $c: -0.05 } });
    }
    if (yr() >= 2024 && a >= 14) out.push({ id: 'net-deepfake', p: 0.025, min: 14, t: 'A convincing fake video of you circulates online.', ch: [
      { l: 'Fight it', fx: { $c: -0.1, wp: 2, mh: -2 }, t: 'You had it taken down, eventually.' },
      { l: 'Ignore it', fx: { rep: -3, mh: -3 }, t: 'People believed some of it.' }] });
    if (a >= 14 && a <= 60 && lvl === 2 && yr() >= 2010) out.push({ id: 'net-remote', p: 0.03, min: 18, max: 60, t: 'A company abroad offers you remote work at foreign pay.', ch: [
      { l: 'Take it', fx: { $c: 0.3, sm: 1 }, t: 'Your salary now comes from far away, and goes far.' },
      { l: 'Stay where you are', fx: { mh: 1 }, t: 'You turned it down.' }] });
    return out;
  }
  S.addHook('events', p => events(p), 'cat');

  return { state, access, pen, censorship, era, ERAS, levelText, platform, ACTS, available, act, setHours, HRS, events };
})();
