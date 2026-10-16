/* =====================================================================
   DIRECTOR — a story engine that keeps every life interesting.
   It never replaces the simulation; it adds to it:
   * Improvised events built from your own situation (your job, your
     people, your land's customs, your faith, the wars next door), in
     the voice of your era. Offline, always.
   * Story threads that run across years (a rival, a mystery, a venture),
     remembering what you chose.
   * Goals worth chasing, generated from where you are in life, with
     rewards, deadlines and progress.
   * Pacing: quiet stretches invite more happens; busy years are left
     alone; milestones (first day of school, coming of age, midlife,
     old age) get a beat of their own.
   * Conversation: topics to talk about with anyone you know, answered
     in their voice and in keeping with their character.
   With Claude connected (AI.ask) the Director also writes events and
   goals fresh each year, using the same shapes. Everything Claude
   returns is checked and clamped before it can touch your life.
   ===================================================================== */

const Director = (() => {
  const S = Sim, A = Atlas, yr = () => S.W.year;
  const state = () => (S.W.dir ||= { q: [], thr: {}, quests: [], done: [], quiet: 0, busy: false, n: 0, seen: [], log: [], ai: 0, lastAI: 0 });
  const age = p => S.age(p);
  const pick = U.pick, chance = U.chance;
  const first = o => o.first;
  const FX_KEYS = ['h', 'hp', 'sm', 'lk', 'rep', 'mh', 'im', 'wp', 'fm'];

  /* ---------- the situation ---------- */
  function ctx(p) {
    const e = S.era(), a = age(p), kin = S.known(p).filter(S.alive);
    const rels = k => kin.filter(o => p.rels[o.id]?.k === k);
    const friends = rels('friend'), enemies = rels('enemy'), cow = rels('coworker');
    const spouse = S.spouse(p), kids = S.kids(p).filter(S.alive), parents = S.parents(p).filter(S.alive);
    const home = S.towns?.info(p), cc = p.cc, c = A.C(cc), at = c?.at || {};
    const others = DATA.countries.filter(x => x.at && yr() >= x.from && x.id !== cc && x.region !== 'space');
    const foreign = others.length ? U.wpick(others, x => 1 + (S.world.rel(cc, x.id) > 20 ? 2 : 0) + (A.tier(x.id) <= 2 ? 1 : 0)) : null;
    const neighbours = Geo.near(cc).map(n => A.C(n)).filter(x => x && yr() >= x.from);
    const warNear = S.activeWars().find(h => h.where?.some(w => w !== cc && Geo.near(cc).includes(w)) && !h.where.includes(cc));
    const warHere = S.activeWars().find(h => h.where?.includes(cc));
    const food = (at.fd || []).map(x => String(x).replace(/@-?\d+$/, '')).filter(Boolean);
    const fest = (at.fs || []).map(x => String(x).replace(/@-?\d+$/, '')).filter(Boolean);
    const custom = (at.cs || []);
    return { p, e, a, y: yr(), cc, c, at, kin, friends, enemies, cow, spouse, kids, parents, home, foreign, neighbours, warNear, warHere, food, fest, custom,
      job: p.job?.t?.toLowerCase() || (p.office ? p.office.t.toLowerCase() : null), faith: Faith.f(Faith.get(p)), cu: A.culture(cc, yr()), town: home?.name || S.world.cap(cc), name: S.world.name(cc),
      net: Net.access(p) > 0, nm: o => o.first, any: arr => (arr && arr.length ? pick(arr) : null), pre: DATA.PREMODERN.includes(e.id), modern: !DATA.PREMODERN.includes(e.id) };
  }

  /* ---------- improvised events ---------- */
  // each template: [id, when(cx) -> bool, build(cx) -> { t, ch: [...] }]; fx keys as in the rest of the game, and run(p) for custom outcomes
  const T = [];
  const add = (id, when, build) => T.push({ id, when, build });
  const cost = (cx, m) => Math.round(cx.e.cost * m * 100) / 100;

  add('friend-favour', cx => cx.friends.length, cx => { const f = cx.any(cx.friends); return { title: 'A favour', t: `${f.first} comes to you in some trouble and asks for help: ${cx.pre ? 'a place to stay and a few coins until the season turns' : 'a loan to get through the month'}.`, ch: [
    { l: 'Help generously', fx: { $c: -0.12, rep: 1 }, t: `${f.first} will not forget this.`, run: p => { S.rel(p, f).c = U.clamp(S.rel(p, f).c + 12); } },
    { l: 'Help a little', fx: { $c: -0.04 }, t: `You did what you could.`, run: p => { S.rel(p, f).c = U.clamp(S.rel(p, f).c + 4); } },
    { l: 'Say no', fx: { mh: -1 }, t: `${f.first} left disappointed.`, run: p => { S.rel(p, f).c = U.clamp(S.rel(p, f).c - 10); } }] }; });
  add('gossip', cx => cx.a >= 12, cx => ({ title: 'Rumours', t: `A rumour about you is going round ${cx.pre ? 'the village' : 'town'}. It is not entirely false.`, ch: [
    { l: 'Deny it loudly', odds: 0.5, win: { fx: { rep: 2 }, t: 'People believed you.' }, alt: { fx: { rep: -4, mh: -2 }, t: 'The denial made it worse.' } },
    { l: 'Laugh it off', fx: { rep: -1, mh: 2 }, t: 'It faded quickly.' },
    { l: 'Find who started it', odds: 0.45, win: { fx: { rep: 3, wp: 2 }, t: 'You confronted them, and it stopped.' }, alt: { fx: { rep: -3, hp: -3 }, t: 'You accused the wrong person.' } }] }));
  add('newcomer', cx => cx.foreign && cx.a >= 8, cx => { const f = cx.foreign, fc = A.C(f.id), d = (fc.at?.fd || [])[0]?.replace(/@-?\d+$/, ''); return { title: 'New neighbours', t: `A family from ${S.world.name(f.id)} has settled nearby. ${d ? `They bring ${d} to your door.` : 'They are curious about your ways.'}`, ch: [
    { l: 'Welcome them', fx: { im: 3, hp: 3, rep: 1 }, t: `You learned something of ${fc.adj} customs, and made friends.`, run: p => { const o = S.newFriend(p); o.cc = f.id; } },
    { l: 'Keep your distance', fx: {}, t: 'You nodded in the street and no more.' },
    { l: 'Complain to the neighbours', fx: { rep: -2, im: -1 }, t: 'Some agreed with you. You did not feel better.' }] }; });
  add('festival-host', cx => cx.fest.length && cx.a >= 14, cx => { const f = cx.any(cx.fest); return { title: f, t: `${f} is coming. Your family expects you to ${cx.food.length ? `cook ${cx.any(cx.food)} for the table` : 'do your part'}.`, ch: [
    { l: 'Host the whole family', fx: { $c: -0.1, hp: 5, famc: 5, rep: 1 }, t: 'It was loud, long, and wonderful.' },
    { l: 'Join someone else’s table', fx: { hp: 2, famc: 1 }, t: 'You were a welcome guest.' },
    { l: 'Skip it this year', fx: { famc: -3, mh: 1 }, t: 'Your absence was noticed.' }] }; });
  add('rival', cx => cx.a >= 14 && (cx.job || cx.a < 24), cx => { const n = pick(['a classmate', 'a colleague', 'a neighbour', 'a cousin']); return { title: 'A rival', t: `${n[0].toUpperCase() + n.slice(1)} has made it clear they intend to outdo you ${cx.job ? `at your ${cx.job} work` : 'in everything'}.`, ch: [
    { l: 'Rise to the challenge', odds: 0.55, win: { fx: { rep: 3, wp: 3, sm: 1 }, t: 'You pushed yourself and came out ahead.' }, alt: { fx: { mh: -3, rep: -1 }, t: 'They outshone you this time.' } },
    { l: 'Ignore it', fx: { mh: 1 }, t: 'You refused to play the game.' },
    { l: 'Undermine them', odds: 0.4, win: { fx: { rep: 1 }, t: 'It worked, and nobody knew.' }, alt: { fx: { rep: -6, mh: -2 }, t: 'You were caught.' } }] }; });
  add('invitation', cx => cx.a >= 10 && cx.kin.length > 3, cx => ({ title: 'An invitation', t: `A distant relative invites you to ${pick(cx.pre ? ['a wedding in the next valley', 'a naming feast', 'a funeral feast'] : ['a wedding', 'a family reunion', 'a milestone birthday'])}. It means a long journey.`, ch: [
    { l: 'Go', fx: { $c: -0.07, hp: 5, famc: 3, im: 1 }, t: 'It was good to see so many faces.' },
    { l: 'Send a gift instead', fx: { $c: -0.02, famc: 1 }, t: 'They were gracious about it.' },
    { l: 'Decline', fx: { famc: -2 }, t: 'Your seat stayed empty.' }] }));
  add('mentor', cx => cx.a >= 12 && cx.a < 45, cx => ({ title: 'An offer to teach', t: `An older ${cx.job ? `${cx.job}` : 'neighbour'} notices your talent and offers to teach you what they know.`, ch: [
    { l: 'Accept gladly', fx: { sm: 4, im: 2, wp: 2 }, t: 'You learned more in a season than in years alone.' },
    { l: 'Accept, but keep your own counsel', fx: { sm: 2 }, t: 'You learned what you could.' },
    { l: 'Decline politely', fx: { mh: 1 }, t: 'You preferred to find your own way.' }] }));
  add('dispute', cx => cx.a >= 16, cx => ({ title: 'A dispute next door', t: `Two of your neighbours quarrel over ${cx.pre ? 'a boundary stone and the use of a well' : 'noise, parking and a fence'}, and both want you on their side.`, ch: [
    { l: 'Mediate', odds: 0.6, win: { fx: { rep: 4, wp: 1 }, t: 'Both sides thanked you.' }, alt: { fx: { rep: -2, mh: -2 }, t: 'You made two enemies.' } },
    { l: 'Take a side', fx: { rep: -1 }, t: 'You made one friend and one foe.' },
    { l: 'Stay out of it', fx: {}, t: 'It was settled without you.' }] }));
  add('work-extra', cx => cx.job && cx.a >= 18, cx => ({ title: 'More responsibility', t: `Your ${cx.p.job ? 'employer' : 'superior'} asks you to take on extra work as a ${cx.job}, with no promise of reward.`, ch: [
    { l: 'Take it on', fx: { perf: 5, mh: -2, rep: 1 }, t: 'You worked hard and were noticed.' },
    { l: 'Ask for more pay first', odds: 0.5, win: { fx: { $c: 0.15, rep: 1 }, t: 'They agreed.' }, alt: { fx: { perf: -4, rep: -1 }, t: 'They found someone else.' } },
    { l: 'Refuse', fx: { perf: -2 }, t: 'You kept your evenings.' }] }));
  add('slacker', cx => cx.job && cx.a >= 18, cx => ({ title: 'Pulling their weight', t: `A coworker is not doing their share, and you are covering for them.`, ch: [
    { l: 'Cover for them', fx: { mh: -2, famc: 0 }, t: 'You kept the peace and carried the load.' },
    { l: 'Report it', odds: 0.6, win: { fx: { rep: 2, perf: 2 }, t: 'Things improved.' }, alt: { fx: { rep: -3 }, t: 'You were seen as a tale-bearer.' } },
    { l: 'Talk to them', fx: { wp: 1, rep: 1 }, t: 'They listened, more or less.' }] }));
  add('idea', cx => cx.a >= 15 && cx.job, cx => ({ title: 'An idea', t: `You think of a better way of doing your ${cx.job} work. It would save time and money.`, ch: [
    { l: 'Pitch it', odds: 0.5, win: { fx: { rep: 3, perf: 5, $c: 0.1 }, t: 'It was adopted, with your name on it.' }, alt: { fx: { rep: -1 }, t: 'They were not interested.' } },
    { l: 'Quietly use it yourself', fx: { perf: 3, sm: 1 }, t: 'You worked smarter, not louder.' },
    { l: 'Forget it', fx: {}, t: 'The idea faded.' }] }));
  add('child-trouble', cx => cx.kids.some(k => age(k) >= 5 && age(k) <= 17), cx => { const k = cx.any(cx.kids.filter(k => age(k) >= 5 && age(k) <= 17)); return { title: `${k.first}`, t: `${k.first} has been getting into trouble ${cx.pre ? 'with the other children' : 'at school'}.`, ch: [
    { l: 'Talk it through', fx: { wp: 1 }, t: `${k.first} opened up a little.`, run: p => { S.rel(p, k).c = U.clamp(S.rel(p, k).c + 8); } },
    { l: 'Punish them', fx: { mh: -1 }, t: `${k.first} behaved, and resented it.`, run: p => { S.rel(p, k).c = U.clamp(S.rel(p, k).c - 6); } },
    { l: 'Let it be', fx: {}, t: 'It sorted itself out, mostly.' }] }; });
  add('parent-ill', cx => cx.parents.some(q => age(q) >= 55), cx => { const q = cx.any(cx.parents.filter(q => age(q) >= 55)); return { title: `${q.first} is unwell`, t: `Your ${S.relLabel(cx.p, q).toLowerCase()} ${q.first} has fallen ill and cannot manage alone.`, ch: [
    { l: 'Care for them yourself', fx: { mh: -3, hp: -2, famc: 4 }, t: 'It was exhausting, and it mattered.', run: p => { S.rel(p, q).c = U.clamp(S.rel(p, q).c + 12); } },
    { l: 'Pay for help', fx: { $c: -0.15 }, t: 'You made sure they were looked after.', run: p => { S.rel(p, q).c = U.clamp(S.rel(p, q).c + 4); } },
    { l: 'Visit when you can', fx: { mh: -1 }, t: 'It was not enough, and you knew it.', run: p => { S.rel(p, q).c = U.clamp(S.rel(p, q).c - 3); } }] }; });
  add('anniversary', cx => cx.spouse && cx.a >= 20, cx => { const s = cx.spouse; return { title: 'An anniversary', t: `Your wedding anniversary with ${s.first} is coming.`, ch: [
    { l: 'Plan something special', fx: { $c: -0.08, hp: 4 }, t: `${s.first} was touched.`, run: p => { S.rel(p, s).c = U.clamp(S.rel(p, s).c + 10); } },
    { l: 'A quiet evening together', fx: { hp: 2 }, t: 'It was enough.', run: p => { S.rel(p, s).c = U.clamp(S.rel(p, s).c + 4); } },
    { l: 'Forget about it', fx: {}, t: `${s.first} said nothing, which was worse.`, run: p => { S.rel(p, s).c = U.clamp(S.rel(p, s).c - 8); } }] }; });
  add('tradition', cx => cx.custom.length && cx.a >= 16, cx => { const c = cx.any(cx.custom); return { title: 'Old ways', t: `An elder reminds you of the custom: “${c.replace(/\|.*/, '')}.” Younger people are letting it slide.`, ch: [
    { l: 'Keep the custom', fx: { famc: 3, rep: 1, im: -1 }, t: 'The elders approved.' },
    { l: 'Adapt it to the times', fx: { im: 2, famc: -1 }, t: 'A compromise, accepted grudgingly.' },
    { l: 'Let it go', fx: { famc: -3, im: 1 }, t: 'It went the way of many customs.' }] }; });
  add('dream', cx => cx.a >= 10, cx => ({ title: 'A strange dream', t: 'You dream of a place you have never been. It stays with you for days.', ch: [
    { l: 'Write it down', fx: { im: 3, mh: 2 }, t: 'It became something of yours.' },
    { l: 'Tell someone', fx: { hp: 2 }, t: 'They listened with wide eyes.' },
    { l: 'Shake it off', fx: {}, t: 'The memory faded.' }] }));
  add('found-purse', cx => cx.a >= 10, cx => ({ title: 'A lost purse', t: `You find a ${cx.pre ? 'leather pouch of coins' : 'wallet'} on the road. There is a name in it.`, ch: [
    { l: 'Return it', fx: { rep: 3, mh: 2 }, t: 'The owner wept with gratitude.' },
    { l: 'Keep it', odds: 0.8, win: { fx: { $c: 0.1, mh: -1 }, t: 'No one ever asked.' }, alt: { fx: { rep: -6, mh: -3 }, t: 'You were seen, and the story spread.' } }] }));
  add('health-scare', cx => cx.a >= 25, cx => ({ title: 'A worrying symptom', t: 'You have felt strange for weeks: tired, off, not yourself.', ch: [
    { l: `See ${cx.pre ? 'a healer' : 'a doctor'}`, fx: { $c: -0.04, mh: -1, h: 3 }, t: 'It was caught early.' },
    { l: 'Wait and see', odds: 0.65, win: { fx: {}, t: 'It passed.' }, alt: { fx: { h: -8, mh: -3 }, t: 'It got worse.' } },
    { l: 'Try a home remedy', fx: { h: 1 }, t: 'It helped, or perhaps it was the rest.' }] }));
  add('stranger', cx => cx.a >= 16 && cx.a <= 50, cx => ({ title: 'A stranger’s offer', t: `A stranger at the ${cx.pre ? 'market' : 'café'} offers you a share in a venture. They talk well, and fast.`, ch: [
    { l: 'Invest', odds: 0.4, win: { fx: { $c: 0.4, rep: 1 }, t: 'It paid off handsomely.' }, alt: { fx: { $c: -0.25, mh: -3 }, t: 'The stranger vanished with the money.' } },
    { l: 'Ask around first', fx: { sm: 1 }, t: 'Nobody had heard of them. You passed.' },
    { l: 'Decline', fx: {}, t: 'You went home.' }] }));
  add('taxes', cx => cx.pre && cx.a >= 18, cx => ({ title: 'The tax collector', t: 'The collector arrives, with more demands than last year.', ch: [
    { l: 'Pay in full', fx: { $c: -0.12 }, t: 'It hurt, but you were left alone.' },
    { l: 'Haggle', odds: 0.5, win: { fx: { $c: -0.06 }, t: 'You paid less than he wanted.' }, alt: { fx: { $c: -0.18, rep: -1 }, t: 'He charged you for your cheek.' } },
    { l: 'Hide some of it', odds: 0.5, win: { fx: { $c: -0.04 }, t: 'He found nothing.' }, alt: { fx: { $c: -0.25, rep: -4 }, t: 'You were caught and fined.' } }] }));
  add('war-rumour', cx => cx.warNear && cx.a >= 12, cx => { const w = cx.warNear; return { title: 'War nearby', t: `News comes of the ${w.n} just beyond your borders. People are afraid.`, ch: [
    { l: 'Stock up', fx: { $c: -0.06, mh: -1 }, t: 'You were ready, for what that is worth.' },
    { l: 'Prepare to leave', fx: { $c: -0.1, mh: -3 }, t: 'You kept a bag packed by the door.' },
    { l: 'Carry on as usual', fx: { wp: 1 }, t: 'Life went on.' }] }; });
  add('refugees', cx => cx.warNear && cx.a >= 16, cx => ({ title: 'Refugees', t: 'Families fleeing the fighting have reached your town. Some of them stand at your door.', ch: [
    { l: 'Take them in', fx: { $c: -0.08, rep: 3, mh: 2 }, t: 'You gave what you could; they will remember.', run: p => { const o = S.newFriend(p); o.cc = Geo.near(p.cc)[0] || p.cc; } },
    { l: 'Give food and send them on', fx: { $c: -0.02, rep: 1 }, t: 'It was something.' },
    { l: 'Turn them away', fx: { rep: -2, mh: -2 }, t: 'You closed the door, and heard them go.' }] }));
  add('election-fever', cx => cx.cu && cx.a >= 18 && ['republic', 'const'].includes(Pol.kindOf(cx.cc)), cx => ({ title: 'Election season', t: `The whole of ${cx.name} is arguing about the coming vote.`, ch: [
    { l: 'Volunteer for a campaign', fx: { rep: 2, fm: 1, hp: 2 }, t: 'You knocked on doors for weeks.' },
    { l: 'Debate with friends', fx: { sm: 1, mh: -1 }, t: 'No one changed their mind.' },
    { l: 'Tune it out', fx: { mh: 1 }, t: 'You enjoyed the quiet.' }] }));
  add('ai-offer', cx => cx.y >= 2024 && cx.a >= 14, cx => ({ title: 'An assistant', t: 'A company offers you a personal AI assistant that will take care of your errands, schedule and even your replies.', ch: [
    { l: 'Accept it', fx: { wp: -1, $c: -0.01, im: -1 }, t: 'Life got easier; you began to notice what you no longer did yourself.' },
    { l: 'Try it for a while', fx: { sm: 1 }, t: 'You used it for the dull parts only.' },
    { l: 'No thanks', fx: { wp: 1 }, t: 'You preferred to keep your own hand on things.' }] }));
  add('relatives-abroad', cx => cx.foreign && cx.a >= 18 && cx.a <= 55 && (Identity.natsOf(cx.p).length > 1 || cx.p.eth?.length > 1), cx => { const f = cx.foreign; return { title: 'Family abroad', t: `Relatives in ${S.world.name(f.id)} write that there is work and a home for you there, if you want to come.`, ch: [
    { l: 'Visit them', fx: { $c: -0.15, im: 4, hp: 4 }, t: 'You saw where part of your family came from.', run: p => { if (!p.travels.includes(f.id)) p.travels.push(f.id); } },
    { l: 'Move there', run: p => S.world.emigrate(f.id, true), fx: { mh: -2 }, t: '' },
    { l: 'Thank them and stay', fx: {}, t: 'You wrote back warmly.' }] }; });
  add('faith-neighbours', cx => cx.a >= 10, cx => { const here = Faith.majority(cx.cc), mine = Faith.get(cx.p); if (here === mine) return null; return { title: 'Different beliefs', t: `A neighbour who follows ${Faith.adj(here)} ways invites you to their ${Faith.f(here).hd?.[0] || 'celebration'}.`, ch: [
    { l: 'Go with an open mind', fx: { im: 3, hp: 3 }, t: 'You were made welcome.' },
    { l: 'Politely decline', fx: {}, t: 'They understood.' }] }; });
  add('lost-job-scare', cx => cx.job && cx.modern && cx.a >= 22, cx => ({ title: 'Rumours of cuts', t: `Word is that your ${cx.job} department will be cut. Nobody will say anything for sure.`, ch: [
    { l: 'Work harder and stay visible', fx: { perf: 4, mh: -3 }, t: 'You were kept on.' },
    { l: 'Start looking elsewhere', fx: { sm: 1 }, t: 'You updated your CV and made a few calls.' },
    { l: 'Save every coin', fx: { mh: -2 }, t: 'You trimmed expenses to the bone.' }] }));
  add('weather-hardship', cx => cx.pre && cx.a >= 14, cx => ({ title: pick(['A bad season', 'Flood', 'Drought', 'A harsh winter']), t: `A hard season strains ${cx.town}. Prices rise and tempers fray.`, ch: [
    { l: 'Share what you have', fx: { $c: -0.1, rep: 3 }, t: 'People remembered who helped.' },
    { l: 'Look after your own', fx: { rep: -1 }, t: 'You got through, and so did your family.' },
    { l: 'Leave for a better place', fx: { $c: -0.08, mh: -2, im: 2 }, t: 'You went and returned with new stories.' }] }));
  add('hobby', cx => cx.a >= 8, cx => { const sp = (cx.at.sp || []).map(x => String(x).replace(/@-?\d+$/, '')); const h = sp.length ? pick(sp) : pick(['carving', 'singing', 'gardening']); return { title: 'A new pastime', t: `Everyone around you seems to love ${h}. You are tempted.`, ch: [
    { l: 'Take it up', fx: { hp: 4, h: 2, im: 1 }, t: `${h[0].toUpperCase() + h.slice(1)} turned into a joy.` },
    { l: 'Watch from the side', fx: { hp: 1 }, t: 'You enjoyed it from a distance.' }] }; });
  add('regret', cx => cx.a >= 35 && cx.p.exes?.length, cx => { const x = S.P(pick(cx.p.exes)); if (!x || !S.alive(x)) return null; return { title: 'An old flame', t: `You think of ${x.first}, whom you once loved. You hear that ${x.sex === 'M' ? 'he' : 'she'} is well.`, ch: [
    { l: 'Write to them', fx: { mh: 1 }, t: `${x.first} wrote back, kindly.`, run: p => { S.rel(p, x).c = U.clamp(S.rel(p, x).c + 15); } },
    { l: 'Let it be', fx: { mh: -1 }, t: 'Some things are best left.' }] }; });

  /* ---------- story threads that run across years ---------- */
  const ARCS = {
    rival: { start: cx => cx.a >= 16 && cx.a <= 55 && cx.friends.length < 9, stages: [
      cx => ({ title: 'A rival appears', t: `${cx.arc.who} has taken a dislike to you, and tells everyone.`, ch: [
        { l: 'Win them over', odds: 0.4, win: { fx: { rep: 2 }, t: 'It took patience, but they came round.' }, alt: { fx: { mh: -2 }, t: 'They only grew more suspicious.' }, set: { path: 'kind' } },
        { l: 'Ignore them', fx: {}, t: 'You carried on.', set: { path: 'ignore' } },
        { l: 'Give as good as you get', fx: { wp: 2, rep: -1 }, t: 'Battle was joined.', set: { path: 'fight' } }] }),
      cx => ({ title: 'The rivalry grows', t: `${cx.arc.who} has been spreading ${cx.arc.path === 'fight' ? 'worse and worse stories' : 'quiet slights'} about you.`, ch: [
        { l: 'Confront them in public', odds: 0.5, win: { fx: { rep: 3, wp: 2 }, t: 'Their story fell apart.' }, alt: { fx: { rep: -3, mh: -3 }, t: 'It backfired.' }, set: { result: 'public' } },
        { l: 'Find allies', fx: { hp: 2, rep: 1 }, t: 'Friends rallied behind you.', set: { result: 'allies' } },
        { l: 'Rise above it', fx: { wp: 1, mh: 1 }, t: 'Your calm spoke for you.', set: { result: 'calm' } }] }),
      cx => ({ title: 'The reckoning', t: `After years of it, ${cx.arc.who} is in trouble of their own and comes to you for help.`, ch: [
        { l: 'Help them', fx: { rep: 4, mh: 3 }, t: 'It ended the feud for good, and made you better known for it.', set: { end: 'peace' } },
        { l: 'Walk away', fx: { mh: 1 }, t: 'You let them face it alone.', set: { end: 'cold' } },
        { l: 'Press your advantage', odds: 0.55, win: { fx: { rep: 1, fm: 2 }, t: 'You won, and it felt hollow.' }, alt: { fx: { rep: -4 }, t: 'Others thought you cruel.' }, set: { end: 'victory' } }] }),
    ] },
    mystery: { start: cx => cx.a >= 14, stages: [
      cx => ({ title: 'A curious find', t: `You find ${cx.pre ? 'an old carved box' : 'a sealed envelope'} behind a loose board, with a name you do not know.`, ch: [
        { l: 'Open it', fx: { im: 2 }, t: 'Inside were fragments of someone else’s story.', set: { opened: 1 } },
        { l: 'Ask around about the name', fx: { sm: 1 }, t: 'People went quiet when you said it.', set: { opened: 0 } },
        { l: 'Put it back', fx: {}, t: 'You left it where it lay.', set: { dropped: 1 } }] }),
      cx => cx.arc.dropped ? null : ({ title: 'A trail', t: 'The more you learn, the stranger it becomes. Someone wants it kept hidden.', ch: [
        { l: 'Keep digging', odds: 0.5, win: { fx: { sm: 3, im: 2 }, t: 'You found the thread that ties it together.' }, alt: { fx: { mh: -3, hp: -2 }, t: 'A warning arrived at your door.' }, set: { deep: 1 } },
        { l: 'Tell someone you trust', fx: { hp: 2 }, t: 'It was a relief to share the weight.', set: { shared: 1 } },
        { l: 'Burn it', fx: { mh: 1 }, t: 'It was over, or so you hoped.', set: { dropped: 1 } }] }),
      cx => cx.arc.dropped ? null : ({ title: 'The truth', t: 'At last you understand whose story it was, and why it mattered.', ch: [
        { l: 'Make it known', fx: { rep: 3, fm: 2 }, t: 'The truth came out, and it changed a few lives.', set: { end: 'public' } },
        { l: 'Keep it', fx: { im: 3, mh: 2 }, t: 'It became a private treasure.', set: { end: 'private' } }] }),
    ] },
    venture: { start: cx => cx.a >= 20 && cx.a <= 55 && cx.p.money > cx.e.cost * 0.4, stages: [
      cx => ({ title: 'A business idea', t: `You see a chance to start something of your own: ${cx.pre ? 'a stall and a small stock of goods' : 'a small shop and a website'}.`, ch: [
        { l: 'Put in your savings', fx: { $c: -0.35, wp: 2 }, t: 'You took the plunge.', set: { in: 1 } },
        { l: 'Start small, on the side', fx: { $c: -0.1 }, t: 'You kept your day job.', set: { in: 0.4 } },
        { l: 'Not now', fx: {}, t: 'You put it off.', set: { dropped: 1 } }] }),
      cx => cx.arc.dropped ? null : ({ title: 'The hard part', t: 'Customers are slow to come, and the costs are not slow at all.', ch: [
        { l: 'Work every hour', fx: { h: -3, mh: -3, wp: 2 }, t: 'You burned the candle at both ends.', set: { grind: 1 } },
        { l: 'Find a partner', fx: { $c: 0.05 }, t: 'Someone shared the load, and a share of the profits.', set: { partner: 1 } },
        { l: 'Cut your losses', fx: { mh: -2 }, t: 'You closed it down.', set: { dropped: 1 } }] }),
      cx => cx.arc.dropped ? null : ({ title: 'Make or break', t: 'A big order could make you, or break you.', ch: [
        { l: 'Go for it', odds: 0.5 + (cx.arc.grind ? 0.08 : 0) + (cx.arc.partner ? 0.1 : 0), win: { fx: { $c: 0.8, rep: 4, fm: 3 }, t: 'You pulled it off, and the business took flight.' }, alt: { fx: { $c: -0.3, mh: -4 }, t: 'It collapsed. You owe money.' }, set: { end: 'big' } },
        { l: 'Play it safe', fx: { $c: 0.15 }, t: 'Steady, honest, small.', set: { end: 'safe' } }] }),
    ] },
  };
  function arcState(p) { return (p.flags.arcs ||= {}); }
  function nextArcEvent(p, cx) {
    const st = arcState(p);
    // continue a running thread first
    for (const [id, a] of Object.entries(st)) {
      if (a.done || yr() < a.next) continue;
      const def = ARCS[id]; const stage = def.stages[a.stage];
      if (!stage) { a.done = 1; continue; }
      const ev = stage({ ...cx, arc: a.v });
      if (!ev) { a.done = 1; continue; }
      return finish(`arc-${id}-${a.stage}`, ev, p, { arc: id });
    }
    // sometimes begin a new one
    for (const [id, def] of U.shuffle(Object.entries(ARCS))) {
      if (st[id] || !def.start(cx) || !chance(0.35)) continue;
      const who = id === 'rival' ? (cx.any(cx.enemies) || cx.any(cx.cow) || { first: pick(['Aldric', 'Marta', 'Josef', 'Lena', 'Tomas', 'Ines']) }).first : '';
      st[id] = { stage: 0, next: yr(), v: { who }, done: 0 };
      return nextArcEvent(p, cx);
    }
    return null;
  }
  // an event's choices are wrapped so arc variables are remembered
  function finish(id, ev, p, extra = {}) {
    const out = { id, p: 1, min: 0, title: ev.title, t: ev.t, ch: ev.ch.map(c => ({ ...c, run: pp => { const a = extra.arc && arcState(pp)[extra.arc]; if (a) { Object.assign(a.v, c.set || {}); a.stage++; a.next = U.add(yr(), U.ri(1, 3)); } return c.run ? c.run(pp) : undefined; } })), dir: 1 };
    return out;
  }

  /* ---------- goals ---------- */
  const OBJ = {
    money: { test: (p, o) => p.money >= o.v, text: o => `Save ${S.money(o.v)}`, prog: (p, o) => Math.min(1, p.money / o.v) },
    stat: { test: (p, o) => (p[o.k] ?? 0) >= o.v, text: o => `Reach ${o.n} ${o.v}`, prog: (p, o) => Math.min(1, (p[o.k] ?? 0) / o.v) },
    friends: { test: (p, o) => S.known(p).filter(q => S.alive(q) && p.rels[q.id]?.k === 'friend' && p.rels[q.id].c >= 55).length >= o.v, text: o => `Have ${o.v} good friends`, prog: (p, o) => Math.min(1, S.known(p).filter(q => S.alive(q) && p.rels[q.id]?.k === 'friend' && p.rels[q.id].c >= 55).length / o.v) },
    married: { test: p => p.sp != null, text: () => 'Marry', prog: p => (p.sp != null ? 1 : 0) },
    kids: { test: (p, o) => S.kids(p).length >= o.v, text: o => `Have ${o.v === 1 ? 'a child' : o.v + ' children'}`, prog: (p, o) => Math.min(1, S.kids(p).length / o.v) },
    job: { test: p => !!p.job, text: () => 'Find work', prog: p => (p.job ? 1 : 0) },
    perf: { test: (p, o) => (p.job?.perf ?? 0) >= o.v, text: o => `Excel at work (performance ${o.v})`, prog: (p, o) => Math.min(1, (p.job?.perf ?? 0) / o.v) },
    travel: { test: (p, o) => (p.travels || []).length >= o.v, text: o => `Visit ${o.v === 1 ? 'a foreign land' : o.v + ' foreign lands'}`, prog: (p, o) => Math.min(1, (p.travels || []).length / o.v) },
    piety: { test: (p, o) => (p.piety ?? 0) >= o.v, text: o => `Deepen your faith (piety ${o.v})`, prog: (p, o) => Math.min(1, (p.piety ?? 0) / o.v) },
    nation: { test: (p, o) => (p.nats || []).length >= o.v, text: () => 'Hold a second nationality', prog: (p, o) => Math.min(1, (p.nats || []).length / o.v) },
    edu: { test: (p, o) => p.edu >= o.v, text: o => `Reach education level ${o.v}`, prog: (p, o) => Math.min(1, p.edu / o.v) },
    office: { test: (p, o) => (p.office?.lvl ?? 0) >= o.v, text: o => `Hold public office (level ${o.v})`, prog: (p, o) => Math.min(1, (p.office?.lvl ?? 0) / o.v) },
    followers: { test: (p, o) => (p.phone?.followers ?? 0) >= o.v, text: o => `Gain ${o.v.toLocaleString()} followers`, prog: (p, o) => Math.min(1, (p.phone?.followers ?? 0) / o.v) },
  };
  function offerQuests(p) {
    const cx = ctx(p), a = cx.a, c = cx.e.cost, q = [];
    const add = (id, title, why, obj, yrsN, reward) => q.push({ id, title, why, obj, by: U.add(yr(), yrsN), reward, from: yr() });
    if (a >= 12 && a < 30 && p.sp == null) add('wed', 'Find someone to share your life with', 'Companionship matters more than most things.', { type: 'married' }, 8, { hp: 8, mh: 6 });
    if (a >= 28 && S.kids(p).length === 0 && p.sp != null) add('child', 'Start a family', 'A house is quieter without children.', { type: 'kids', v: 1 }, 6, { hp: 8, mh: 4 });
    if (a >= 16 && !p.job && !p.retired && !p.school) add('work', 'Find honest work', 'Idle hands are restless hands.', { type: 'job' }, 3, { rep: 3, wp: 3 });
    if (a >= 18) add('save', `Save ${S.money(S.toVal(c * 3))}`, 'A cushion lets you sleep at night.', { type: 'money', v: S.toVal(c * 3) + Math.max(0, p.money) }, 8, { hp: 5, rep: 1 });
    if (a >= 10) add('friends', 'Build a circle of friends', 'The people you choose are the people you become.', { type: 'friends', v: 3 }, 6, { hp: 5, mh: 4 });
    if (a >= 14 && p.h < 85) add('fit', 'Look after your health', 'Health is the first wealth.', { type: 'stat', k: 'h', n: 'health', v: Math.min(95, Math.round(p.h + 12)) }, 5, { mh: 4, wp: 2 });
    if (a >= 14 && p.sm < 85) add('learn', 'Sharpen your mind', 'Learn something that sets you apart.', { type: 'stat', k: 'sm', n: 'smarts', v: Math.min(95, Math.round(p.sm + 12)) }, 6, { wp: 3, im: 3 });
    if (a >= 18 && p.job && (p.job.perf ?? 50) < 85) add('shine', `Shine at your ${p.job.t.toLowerCase()} work`, 'Be the one they cannot do without.', { type: 'perf', v: Math.min(95, Math.round(p.job.perf + 15)) }, 4, { rep: 3, $c: 0.2 });
    if (a >= 16 && (p.travels || []).length < 3) add('see', 'See a foreign land', cx.foreign ? `Perhaps ${S.world.name(cx.foreign.id)}.` : 'The world is bigger than your street.', { type: 'travel', v: (p.travels || []).length + 1 }, 8, { im: 4, hp: 5 });
    if (a >= 14 && (p.piety ?? 40) >= 30 && (p.piety ?? 40) < 80) add('devout', `Deepen your faith`, `Practise ${cx.faith.n.toLowerCase()} seriously.`, { type: 'piety', v: Math.min(95, Math.round((p.piety ?? 40) + 18)) }, 6, { mh: 5, rep: 1 });
    if (a >= 18 && Identity.natsOf(p).length < 2 && cx.foreign) add('passport', 'Hold a second passport', 'Roots and wings.', { type: 'nation', v: 2 }, 10, { rep: 2, hp: 4 });
    if (a >= 25 && !p.office && ['republic', 'const', 'monarchy'].includes(Pol.kindOf(cx.cc))) add('office', 'Serve in public office', 'Someone has to.', { type: 'office', v: 1 }, 12, { rep: 5, fm: 4 });
    if (a >= 14 && cx.net && Net.access(p) > 0) add('follow', 'Build an audience online', 'People are listening, if you have something to say.', { type: 'followers', v: 1000 + (p.phone?.followers ?? 0) }, 6, { fm: 5, hp: 3 });
    const taken = new Set(state().quests.map(x => x.id)); const done = new Set(state().done.slice(-6));
    return q.filter(x => !taken.has(x.id) && !done.has(x.id));
  }
  function propose(p) {
    const st = state(); if (st.quests.length >= 3) return;
    const opts = offerQuests(p); if (!opts.length) return;
    const q = pick(opts);
    S.prompt({ title: 'A goal worth chasing', text: `${q.title}. ${q.why} You have until ${U.fmtYearAD(q.by)}.`, choices: [
      { l: 'Take it on', go: () => { st.quests.push(q); S.log(p, `New goal: ${q.title}.`, 'life'); return 'Goal set.'; } },
      { l: 'Not now', go: () => { st.done.push(q.id); return 'Perhaps another time.'; } }] });
  }
  function checkQuests(p) {
    const st = state();
    for (const q of st.quests.slice()) {
      const o = OBJ[q.obj.type]; if (!o) { st.quests.splice(st.quests.indexOf(q), 1); continue; }
      if (o.test(p, q.obj)) {
        S.applyFx(p, q.reward); st.quests.splice(st.quests.indexOf(q), 1); st.done.push(q.id);
        S.log(p, `Goal achieved: ${q.title}.`, 'ach'); S.applyFx(p, { rep: 1 });
      } else if (U.span(q.by, yr()) > 0) {
        st.quests.splice(st.quests.indexOf(q), 1); st.done.push(q.id); S.log(p, `You did not reach your goal: ${q.title}.`, 'life'); S.applyFx(p, { mh: -2 });
      }
    }
  }
  const questView = p => state().quests.map(q => ({ ...q, progress: OBJ[q.obj.type]?.prog(p, q.obj) ?? 0, text: OBJ[q.obj.type]?.text(q.obj) || '' }));

  /* ---------- pacing and milestones ---------- */
  const MILE = [
    [5, 'Your first year of lessons', 'Letters and numbers begin to make sense.', { sm: 3 }],
    [12, 'A change in you', 'Your body and your thoughts are not what they were last year.', { im: 3, mh: -2 }],
    [18, 'Coming of age', 'You are treated as an adult now, whether you feel ready or not.', { wp: 3 }],
    [30, 'Thirty', 'You count what you have, and what you do not.', { mh: -1, sm: 1 }],
    [50, 'Half a century', 'You are old enough to know better, and young enough to try anyway.', { wp: 2 }],
    [70, 'The long view', 'You see your own life as a story now.', { mh: 2 }],
  ];
  function milestone(p) {
    const a = age(p), m = MILE.find(x => x[0] === a); if (!m || p.flags['mile' + a]) return;
    p.flags['mile' + a] = 1; S.applyFx(p, m[3]); S.log(p, `${m[1]}. ${m[2]}`, 'life');
  }
  function eventful(p) { return p.log.filter(l => l.y === yr() && !['quiet', 'act', 'era', 'birth', 'chapter', 'switch', 'life'].includes(l.k)).length; }

  /* ---------- the Director's events for this year ---------- */
  function validEvent(raw) {
    // Claude's event: only whitelisted effects, clamped, with short text
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.choices) || raw.choices.length < 2 || typeof raw.text !== 'string') return null;
    const clampFx = fx => {
      const out = {}; if (!fx || typeof fx !== 'object') return out;
      for (const k of FX_KEYS) if (typeof fx[k] === 'number' && isFinite(fx[k])) out[k] = Math.max(-14, Math.min(14, Math.round(fx[k])));
      if (typeof fx.money === 'number') out.$c = Math.max(-1.2, Math.min(1.2, Math.round(fx.money * 100) / 100));
      if (typeof fx.family === 'number') out.famc = Math.max(-12, Math.min(12, Math.round(fx.family)));
      return out;
    };
    const str = (s, n) => String(s ?? '').replace(/[<>]/g, '').slice(0, n);
    const ch = raw.choices.slice(0, 4).map(c => {
      if (!c || typeof c.label !== 'string') return null;
      const o = { l: str(c.label, 80), fx: clampFx(c.fx), t: str(c.result, 260) };
      if (c.risk && typeof c.risk.chance === 'number') { const ch2 = Math.max(0.1, Math.min(0.9, c.risk.chance)); o.odds = Math.round((1 - ch2) * 100) / 100; o.win = { fx: o.fx, t: o.t }; o.alt = { fx: clampFx(c.risk.fx), t: str(c.risk.result, 260) }; o.fx = {}; o.t = ''; }
      return o;
    }).filter(Boolean);
    if (ch.length < 2) return null;
    return { id: `ai-${yr()}-${Math.random().toString(36).slice(2, 6)}`, p: 1, min: 0, title: str(raw.title, 60) || 'A turn of events', t: str(raw.text, 700), ch, dir: 1, ai: 1, thread: str(raw.thread, 40), hook: str(raw.hook, 160) };
  }
  function improvise(p) {
    const cx = ctx(p), pool = U.shuffle(T.filter(t => { try { return t.when(cx); } catch { return false; } }));
    const seen = state().seen;
    for (const t of pool) {
      if (seen.includes(t.id) && chance(0.8)) continue;
      const ev = t.build(cx); if (!ev) continue;
      seen.push(t.id); if (seen.length > 20) seen.shift();
      return { id: `dir-${t.id}-${yr()}`, p: 1, min: 0, dir: 1, ...ev, ch: ev.ch.map(c => ({ ...c, run: c.run })) };
    }
    return null;
  }
  function eventsFor(p) {
    if (p.id !== S.W.playerId || age(p) < 5 || p.prison > 0) return [];
    const st = state(), out = [], cx = ctx(p);
    // an event Claude wrote last year
    const q = st.q.findIndex(e => e.y <= yr());
    if (q >= 0) { const e = st.q.splice(q, 1)[0]; if (e.ev) out.push(e.ev); }
    // a thread, a goal, or an improvisation, depending on how quiet things have been
    if (!out.length) {
      const quiet = st.quiet, want = U.clamp(0.1 + quiet * 0.24, 0.1, 0.85);
      if (chance(want)) {
        const arc = chance(0.4) ? nextArcEvent(p, cx) : null;
        const ev = arc || improvise(p); if (ev) out.push(ev);
      }
    }
    return out;
  }
  S.addHook('events', p => eventsFor(p), 'cat');
  S.addHook('postYear', p => {
    if (p.id !== S.W.playerId) return;
    const st = state();
    milestone(p); checkQuests(p);
    st.quiet = eventful(p) <= 1 ? st.quiet + 1 : 0;
    if (age(p) >= 10 && st.quiet >= 1 && chance(0.22 + st.quiet * 0.08)) propose(p);
  });
  S.addHook('migrate', w => { w.dir ||= { q: [], thr: {}, quests: [], done: [], quiet: 0, busy: false, n: 0, seen: [], log: [], ai: 0, lastAI: 0 }; });

  /* ---------- Claude as the Director ---------- */
  const EVENT_SCHEMA = { type: 'object', additionalProperties: false, required: ['title', 'text', 'choices'], properties: {
    title: { type: 'string' }, text: { type: 'string' }, thread: { type: 'string' }, hook: { type: 'string' },
    choices: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'object', additionalProperties: false, required: ['label', 'result', 'fx'], properties: {
      label: { type: 'string' }, result: { type: 'string' },
      fx: { type: 'object', additionalProperties: false, properties: { h: { type: 'integer' }, hp: { type: 'integer' }, sm: { type: 'integer' }, lk: { type: 'integer' }, rep: { type: 'integer' }, mh: { type: 'integer' }, im: { type: 'integer' }, wp: { type: 'integer' }, fm: { type: 'integer' }, money: { type: 'number' }, family: { type: 'integer' } } },
      risk: { type: 'object', additionalProperties: false, properties: { chance: { type: 'number' }, result: { type: 'string' }, fx: { type: 'object', additionalProperties: false, properties: { h: { type: 'integer' }, hp: { type: 'integer' }, sm: { type: 'integer' }, rep: { type: 'integer' }, mh: { type: 'integer' }, money: { type: 'number' }, family: { type: 'integer' } } } } } } } } } };
  function system(p, cx) {
    return `You are the Director of Tempora, a life simulator that runs year by year from 10,000 BC to the far future. Write ONE short, vivid event for the player's coming year, in the voice and technology of ${U.fmtYearAD(yr())} (${cx.e.name} era): no anachronisms. Ground it in this person's actual situation, their country (${cx.name}: ${cx.custom.slice(0, 2).join('; ')}), their faith (${cx.faith.n}), their people and relationships, and what is going on in the world. The event is a dilemma with 2 to 4 choices. Each choice has a short "label", a one-sentence "result", and "fx": small integer changes to stats (h health, hp happiness, sm smarts, lk looks, rep reputation, mh mental health, im imagination, wp willpower, fm fame) within -12..12, "money" as a fraction of one year's living costs within -1..1, and "family" closeness change within -10..10. A choice may carry a "risk" ({chance 0..1 that it goes badly, result, fx}). Keep the text under 80 words. Use "thread" for a short slug if this continues a storyline, and "hook" for one sentence about what could come next. Never mention being an AI or a game. Reply with JSON only.`;
  }
  async function requestAI(p) {
    const st = state(); if (st.busy || st.q.length >= 2) return;
    let how = null; try { how = await AI.backend(); } catch { return; }
    if (!how) return;
    const s = AI.settings(); if (s.directorOff || (how === 'key' && !s.director)) return;
    st.busy = true;
    try {
      const cx = ctx(p), threads = Object.entries(st.thr).slice(-3).map(([k, v]) => `${k}: ${v}`).join(' | ');
      const r = await AI.ask({ system: system(p, cx), messages: [{ role: 'user', content: `${AI.digest(p)}\nReligion: ${cx.faith.n}. Ancestry: ${Identity.ethText(p)}. Nationalities: ${Identity.natsOf(p).map(n => S.world.name(n)).join(', ')}.\n${cx.warHere ? `Your land is at war: ${cx.warHere.n}.` : cx.warNear ? `A war rages nearby: ${cx.warNear.n}.` : 'There is no war at your door.'}\n${threads ? `Threads still open: ${threads}.` : ''}\nWrite next year's event.` }], schema: EVENT_SCHEMA, effort: 'low', tier: 'quick', maxTokens: 3000 });
      const raw = r.data && r.data.choices ? r.data : (() => { try { return JSON.parse(r.text); } catch { return null; } })();
      const ev = validEvent(raw);
      if (ev) { st.q.push({ y: U.add(yr(), 1), ev }); if (ev.thread && ev.hook) st.thr[ev.thread] = ev.hook; st.ai++; }
    } catch (e) { /* offline or refused: the improviser covers it */ }
    st.busy = false;
  }
  // when the player has chosen, remember how the story went
  S.addHook('chose', (p, c) => { if (c.run && p.id === S.W.playerId) { try { const m = c.run(p); if (typeof m === 'string' && m) S.log(p, m, 'life'); } catch (e) { console.error(e); } } });

  /* ---------- talking with people ---------- */
  const TOPICS = [['news', 'Ask for news'], ['advice', 'Ask for advice'], ['worry', 'Share a worry'], ['memory', 'Remember together'], ['joke', 'Make them laugh'], ['faith', 'Talk about belief'], ['plans', 'Talk about the future']];
  const BITS = {
    news: { f: ['Well, you will not believe what I heard.', 'Where shall I begin?', 'Things are changing round here.'], m: [`{o1}`, 'They say {w}.', 'There is talk of {w}.'] },
    advice: ['Hm. In your place I would {adv}.', 'If it were me, I would {adv}, and not rush.', 'Honestly? {adv}. You already know that.'],
    worry: ['I am glad you told me. {comfort}', '{comfort} You are not alone in this.', 'That is a heavy thing to carry. {comfort}'],
    memory: ['Do you remember {mem}? I think of it often.', 'Ha, {mem}. We were so young.', '{mem}... those were good days.'],
    joke: ['{joke}', 'You are impossible. {joke}', 'Stop! {joke}'],
    faith: ['{faith}', 'I find {faith2}', 'We should {prac} more often, you and I.'],
    plans: ['I would like {plan}. And you?', 'Who knows? Maybe {plan}.', 'I think about {plan} more than I admit.'],
  };
  function reply(p, o, topic) {
    const r = S.rel(p, o), c = r.c, cx = ctx(o), pd = S.pers?.describe(o), traits = (pd?.traits || []).map(t => t.n.toLowerCase());
    const warm = c >= 55, cold = c < 30, formal = traits.some(t => /cautious|formal|stern|reserved/.test(t));
    const mood = (cold ? -1 : warm ? 1 : 0) + (traits.some(t => /cheerful|warm|kind|gregarious/.test(t)) ? 1 : 0) - (traits.some(t => /grumpy|bitter|melancholic/.test(t)) ? 1 : 0);
    const recent = o.log.filter(l => !['quiet', 'act'].includes(l.k)).slice(-4);
    const adv = pick(cx.pre ? ['save what you can before the season turns', 'ask the elders before you act', 'keep your friends close and your quarrels short', 'take the safe path this once'] : ['sleep on it before you decide', 'talk to the people it affects', 'put some money aside for a rainy day', 'learn the skill that scares you most']);
    const mem = pick(cx.pre ? ['the harvest feast', 'that winter by the fire', 'the day we got lost on the road', 'the first time we met'] : ['that terrible trip', 'the day the car broke down', 'our first apartment', 'that awful dinner party']);
    const w = pick([cx.warNear ? `the ${cx.warNear.n}` : 'the price of things', cx.fest[0] || 'the harvest', 'a new neighbour', `the ${cx.faith.clergy || 'elder'}`, cx.cc ? S.world.name(pick(cx.neighbours.length ? cx.neighbours.map(n => n.id) : [cx.cc])) : 'faraway lands']);
    const plan = pick(['to see the sea', 'to build something that lasts', 'a quiet old age', `to visit ${cx.foreign ? S.world.name(cx.foreign.id) : 'somewhere new'}`, 'to see the children settled']);
    const fill = s => s.replace('{adv}', adv).replace('{mem}', mem).replace('{w}', w).replace('{plan}', plan)
      .replace('{comfort}', pick(['Time heals more than we expect.', 'These things pass, I promise.', 'Whatever you decide, I am with you.'])).replace('{joke}', pick(cx.pre ? ['Did you hear the one about the priest, the goat and the tax collector?', 'Your cooking could end a siege, and not the way you hope.'] : ['I told my phone a secret and now it sends me adverts for it.', 'Our best plans always start with “how hard can it be?”']))
      .replace('{faith}', cx.faith.w ? `I try to ${cx.faith.w.toLowerCase()}, when I can.` : 'It is a private matter, I find.').replace('{faith2}', 'comfort in the old words, even when I doubt them.').replace('{prac}', (cx.faith.w || 'go to worship').toLowerCase()).replace('{o1}', recent[0] ? recent[0].t.replace(/\bYou\b/g, 'I').replace(/\byou\b/g, 'me').replace(/\byour\b/g, 'my') : 'Not much, really.');
    let line;
    if (topic === 'news') line = `${pick(BITS.news.f)} ${fill(pick(BITS.news.m))}`; else line = fill(pick(BITS[topic] || BITS.news.f));
    if (cold) line = pick(['Hmph. ', 'If you must. ', '']) + line; else if (formal) line = 'Well. ' + line; else if (mood > 1) line += pick([' It is good to see you.', ' I always enjoy this.', '']);
    const d = (topic === 'joke' ? 2 : topic === 'worry' ? 3 : 2) + mood + U.ri(-1, 2) + (r.c > 85 ? -1 : 0);
    const used = p.flags.talk ||= {}; const k = `${o.id}:${yr()}`; const n = used[k] || 0; used[k] = n + 1;
    const gain = n >= 3 ? 0 : Math.max(-2, d);
    r.c = U.clamp(r.c + gain);
    if (n === 0) S.log(p, `You talked with ${o.first} about ${TOPICS.find(t => t[0] === topic)?.[1].toLowerCase().replace(/^(ask for|share a|make them|talk about|remember) ?/, '') || 'things'}.`, 'life');
    return { line, gain, mood };
  }

  return { ctx, improvise, eventsFor, requestAI, validEvent, propose, offerQuests, checkQuests, questView, reply, TOPICS, OBJ, ARCS, T, state, milestone, EVENT_SCHEMA };
})();
