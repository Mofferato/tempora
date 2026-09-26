/* =====================================================================
   PHONE — how people reach each other, era by era: runners with word
   from the next valley, letters (or a scribe if you cannot write),
   telegrams, the telephone, the smartphone with its social feed, and
   neural chat. People you know write to you with news, requests,
   invitations and love notes; you answer, call, write and post.
   From 2004 a social feed brings followers, likes, virality,
   sponsorships, trolls and scandal, and feeds your fame.
   ===================================================================== */

const Phone = (() => {
  const S = Sim, W = () => S.W, yr = () => S.W.year;
  function device(y = yr()) {
    if (y < -3000) return { id: 'runner', tab: 'Messages', verb: 'Send word', msg: 'word', social: false };
    if (y < 1840) return { id: 'letter', tab: 'Letters', verb: 'Write a letter', msg: 'letter', social: false };
    if (y < 1920) return { id: 'telegraph', tab: 'Post & Telegraph', verb: 'Write a letter', msg: 'letter', fast: 'Send a telegram', social: false };
    if (y < 1995) return { id: 'telephone', tab: 'Telephone', verb: 'Write a letter', msg: 'call', fast: 'Telephone them', social: false };
    if (y < 2040) return { id: 'mobile', tab: 'Phone', verb: 'Text them', msg: 'message', fast: y >= 2010 ? 'Video call' : 'Call them', social: y >= 2004, app: y >= 2004 ? (y >= 2016 ? 'Feed' : 'Wall') : null };
    return { id: 'neural', tab: 'Neural link', verb: 'Send a thought', msg: 'thought', fast: 'Share a memory', social: true, app: 'Holo-feed' };
  }
  const ph = p => (p.phone ||= { inbox: [], followers: 0, posts: [], sent: {} });
  const cost = m => S.toVal(S.era().cost * m);
  const canWrite = p => p.edu >= 1 || yr() >= 1900 || S.era().id === 'prehistory';
  const firstPerson = t => t.replace(/\bYou were\b/g, 'I was').replace(/\bYou are\b/g, 'I am').replace(/\bYou\b/g, 'I').replace(/\byou\b/g, 'me').replace(/\bYour\b/g, 'My').replace(/\byour\b/g, 'my').replace(/\byourself\b/g, 'myself');
  const dist = (p, o) => (o.cc !== p.cc ? 'far' : S.towns && S.towns.info(o).name !== S.towns.info(p).name ? 'near' : 'here');

  /* ---------- writing, calling, texting ---------- */
  function contactActs(p, o) {
    const d = device(), L = [];
    const r = p.rels[o.id];
    L.push(['write', d.verb]);
    if (d.fast) L.push(['fast', d.fast]);
    if (S.age(o) >= 16 && S.age(p) >= 14) L.push(['advice', 'Ask for advice']);
    if (S.age(p) >= 16) L.push(['gift', 'Send money']);
    if (r && r.c < 40) L.push(['sorry', 'Apologise']);
    if (S.age(p) >= 12) L.push(['invite', 'Invite them to visit']);
    return L;
  }
  function contact(oid, act) {
    const p = S.me(), o = S.P(oid), d = device(), st = ph(p);
    if (!o || !S.alive(o)) return 'They are gone.';
    const key = `ph:${oid}:${act}`;
    if (p.did[key]) return 'You already did that this year.';
    const r = S.rel(p, o), far = dist(p, o) === 'far', gain = (a, b) => { r.c = U.clamp(r.c + U.ri(a, b) + S.hadd('relGain', p, o, 'talk')); };
    let t = '';
    switch (act) {
      case 'write': {
        if (d.id === 'letter' && !canWrite(p)) { const c = cost(0.01); if (p.money < c) return `You cannot write, and a scribe costs ${S.money(c)}.`; p.money -= c; t = 'A scribe wrote it down for you. '; }
        if (d.id === 'runner') { if (S.age(p) < 8) return 'You are too young to send a runner.'; t = `A runner carried your word to ${o.first}. `; }
        gain(far ? 6 : 3, far ? 12 : 7); st.sent[oid] = yr();
        t += far && d.id !== 'mobile' && d.id !== 'neural' ? `${o.first} will treasure it; the reply will take a while.` : `${o.first} ${U.pick(['wrote back warmly.', 'loved hearing from you.', 'replied with news of their own.'])}`;
        if (far && ['letter', 'telegraph', 'runner'].includes(d.id)) queue(o, p, 'reply', 1);
        break;
      }
      case 'fast': {
        const c = d.id === 'telegraph' ? cost(0.01) : d.id === 'telephone' ? cost(far ? 0.01 : 0.002) : 0;
        if (p.money < c) return `That costs ${S.money(c)}.`;
        p.money -= c; gain(4, 9); S.applyFx(p, { hp: 2 });
        t = d.id === 'telegraph' ? `STOP. Your telegram reached ${o.first} within the hour. STOP.` : d.id === 'neural' ? `You and ${o.first} shared a memory, as if you were there together.` : `You and ${o.first} talked for ages.`;
        break;
      }
      case 'advice': { gain(2, 5); const g = U.pick([['sm', 2], ['mh', 3], ['wp', 2]]); S.applyFx(p, { [g[0]]: g[1] }); t = `${o.first} had wise words. ${U.pick(['You wrote them down.', 'They helped more than you expected.', 'You will think about them for years.'])}`; break; }
      case 'gift': { const c = cost(0.05); if (p.money < c) return `You need ${S.money(c)}.`; p.money -= c; o.money += c; gain(8, 14); S.pers?.nudge(p, 'generous', 0.5); t = `You sent ${o.first} ${S.money(c)}. They were deeply touched.`; break; }
      case 'sorry': if (U.chance(0.55 + (S.pers?.has(o, 'patient') ? 0.15 : 0) - (S.pers?.has(o, 'hotheaded') ? 0.15 : 0))) { gain(10, 18); t = `${o.first} forgave you.`; } else { gain(1, 3); t = `${o.first} is not ready to forgive you yet.`; } break;
      case 'invite': { const c = far ? S.world.tripCost?.(o, p.cc) || cost(0.1) : cost(0.01); if (p.money < c) return `Their journey would cost ${S.money(c)}.`; p.money -= c; gain(8, 15); S.applyFx(p, { hp: 5 }); t = `${o.first} came to stay${far ? ' after a long journey' : ''}. You talked late into the night.`; break; }
      default: return '';
    }
    p.did[key] = 1;
    S.log(p, t.replace(/^STOP\. /, ''), 'life');
    return t;
  }

  /* ---------- the inbox ---------- */
  let nid = 1;
  function queue(from, to, kind, delay = 0, extra = {}) {
    const st = ph(to);
    st.inbox.push({ id: `${yr()}-${nid++}-${Math.random().toString(36).slice(2, 7)}`, from: from.id, y: yr() + delay, kind, read: false, done: false, ...extra });
    if (st.inbox.length > 60) st.inbox.splice(0, st.inbox.length - 60);
  }
  const TEMPLATES = {
    reply: o => [`${o.first} writes back at last: "Your ${device().msg} made my whole year. Things here are ${U.pick(['hard, but we manage', 'good', 'the same as ever', 'changing fast'])}."`, [['Write again', { c: 6 }, 'You wrote back the same day.'], ['Keep it to treasure', { hp: 2 }, 'You read it again and again.']]],
    news: (o, x) => [`${o.first} ${device().id === 'mobile' || device().id === 'neural' ? 'messaged' : 'wrote'}: "${firstPerson(x.t).slice(0, 160)}"`, [['Reply warmly', { c: 5, hp: 1 }, 'You wrote back straight away.'], ['Send congratulations or sympathy', { c: 7 }, 'They were glad you cared.'], ['Leave it', { c: -1 }, 'You meant to answer.']]],
    money: o => [`${o.first} asks if you could spare a little money. Times are hard.`, [['Send some', { $: -0.05, c: 12, rep: 1, trait: 'generous' }, 'They wept with relief.'], ['Say no kindly', { c: -3 }, 'They understood. Mostly.'], ['Ignore it', { c: -8, trait: 'greedy' }, 'The silence said enough.']]],
    invite: o => [`${o.first} invites you to ${U.pick(['a wedding', 'a naming feast', 'a birthday gathering', 'the harvest celebration'])}.`, [['Go and celebrate', { $: -0.02, c: 8, hp: 5 }, 'A wonderful day.'], ['Send a gift instead', { $: -0.01, c: 3 }, 'They thanked you for the gift.'], ['Decline', { c: -4 }, 'They noticed you were missing.']]],
    love: o => [`${o.first} left you a note: "${U.pick(['I think about you all day.', 'Thank you for being you.', 'Come home early tonight.', 'I love you, even when you snore.'])}"`, [['Reply with love', { c: 6, hp: 4 }, 'You smiled all day.'], ['A quick reply', { c: 1 }, 'Short and sweet.']]],
    advice: o => [`${o.first} asks your advice about ${U.pick(['a hard choice at work', 'a quarrel with a friend', 'whether to marry', 'what to do with their life'])}.`, [['Give careful advice', { c: 8, rep: 2 }, 'They took your advice, and it helped.'], ['Tell them what they want to hear', { c: 3 }, 'They were pleased, for now.']]],
    rival: o => [`${o.first} ${device().id === 'mobile' ? 'posted something nasty about you' : 'has been spreading stories about you'}.`, [['Answer back', { rep: 1, mh: -1, trait: 'hotheaded' }, 'You gave as good as you got.'], ['Rise above it', { mh: 2, trait: 'patient' }, 'People noticed who stayed calm.']]],
    spam: () => [U.pick(['CONGRATULATIONS! You have won a prize. Just send a small fee to claim it.', 'A prince needs help moving his fortune and will share it with you.', 'Your account is locked. Confirm your details here.']), [['Follow the link', { $: -0.1, mh: -3 }, 'It was a scam. Of course it was.'], ['Delete it', { sm: 0.5 }, 'Nice try.']]],
    fan: () => [U.pick(['A stranger writes that your work changed their life.', 'A fan asks for your autograph.', 'Someone named their child after you.']), [['Write back graciously', { hp: 4, fm: 1, rep: 1 }, 'They will frame your reply.'], ['Ignore it', {}, 'Fame is tiring.']]],
  };
  function inboxTick(p) {
    const st = ph(p), d = device();
    st.inbox = st.inbox.filter(m => !m.done && yr() - m.y <= 2);
    const people = S.known(p).filter(o => S.alive(o) && S.age(o) >= 8 && (p.rels[o.id]?.c ?? 50) >= 30);
    const young = S.age(p) < 12, cap = young ? 0 : S.age(p) < 16 ? 1 : 3;
    let n = 0;
    for (const o of U.shuffle(people)) {
      if (n >= cap) break;
      if (!U.chance(0.07)) continue;
      const r = p.rels[o.id], rl = S.relLabel(p, o);
      let kind = U.pick(['invite', 'advice', 'money', 'invite']);
      if (/Husband|Wife|Boyfriend|Girlfriend|Fiancé/.test(rl)) kind = 'love';
      if (r?.k === 'enemy') kind = 'rival';
      if (kind === 'money' && o.money > p.money) kind = 'invite';
      if (kind === 'advice' && S.age(o) >= S.age(p)) kind = 'invite';
      queue(o, p, kind); n++;
    }
    if (['mobile', 'neural'].includes(d.id) && S.age(p) >= 12 && U.chance(0.35)) queue(p, p, 'spam');
    if ((p.fm ?? 0) >= 40 && U.chance((p.fm - 30) / 100)) queue(p, p, 'fan');
  }
  function text(m, p) {
    const o = S.P(m.from) || p;
    const tpl = TEMPLATES[m.kind]; if (!tpl) return ['', []];
    if (!m.txt) { const [t, ch] = tpl(o, m); m.txt = t; m.ch = ch.map(c => [c[0], c[1], c[2]]); }
    return [m.txt, m.ch];
  }
  function answer(mid, i) {
    const p = S.me(), st = ph(p), m = st.inbox.find(x => x.id === mid); if (!m || m.done) return '';
    const [, ch] = text(m, p), c = ch[+i]; if (!c) return '';
    const [l, fx, t] = c, o = S.P(m.from);
    if (fx.$ && p.money < cost(-fx.$)) return 'You cannot afford that.';
    if (fx.$) p.money += cost(fx.$);
    if (o && o.id !== p.id && fx.c) { const r = S.rel(p, o); r.c = U.clamp(r.c + fx.c); if (fx.$ && fx.$ < 0 && m.kind === 'money') o.money += cost(-fx.$); }
    const f = { ...fx }; delete f.c; delete f.$; delete f.trait;
    S.applyFx(p, f);
    if (fx.trait) S.pers?.nudge(p, fx.trait, 0.6);
    m.done = true; m.read = true;
    S.log(p, `${o && o.id !== p.id ? `A ${device().msg} from ${o.first}: ` : ''}${t}`, 'life');
    return t;
  }

  // Auto-play: answer everything waiting, choosing the reply that does you, and the friendship, the most good
  function autoAnswer(p) {
    if (p !== S.me()) return 0;
    let n = 0;
    for (const m of (ph(p).inbox || []).filter(x => !x.done && x.y <= yr())) {
      const [, ch] = text(m, p);
      let best = -1, bv = -Infinity;
      ch.forEach(([, fx], i) => {
        if (fx.$ && p.money < cost(-fx.$)) return;
        const v = (typeof AI !== 'undefined' ? AI.choiceValue(p, { fx }) : 0) + (fx.c || 0) * 0.6 + Math.random() * 0.3;
        if (v > bv) { bv = v; best = i; }
      });
      if (best >= 0 && answer(m.id, best)) n++;
    }
    return n;
  }

  /* ---------- the social feed ---------- */
  const POSTS = [
    ['selfie', 'Post a selfie', p => p.lk], ['update', 'Share a life update', p => 40 + (p.hp - 50) / 2], ['take', 'Post a hot take', p => p.sm * 0.6 + (p.im ?? 50) * 0.4],
    ['meme', 'Share a meme', p => p.im ?? 50], ['work', 'Promote your work', p => (p.fm ?? 0) + (p.job?.fame ? 30 : 0)], ['pet', 'Post a pet photo', p => (S.petsOf(p).length ? 75 : 0)],
  ];
  function post(kind) {
    const p = S.me(), st = ph(p), d = device();
    if (!d.social) return 'There is no feed to post on yet.';
    if (S.age(p) < 13) return 'You are too young for an account.';
    if (!st.handle) return 'Make an account first.';
    const used = st.posts.filter(x => x.y === yr()).length;
    if (used >= 3) return 'You have posted enough this year. Go outside.';
    const P = POSTS.find(x => x[0] === kind); if (!P) return '';
    if (kind === 'pet' && !S.petsOf(p).length) return 'You have no pet to show off.';
    const q = U.clamp(P[2](p) + U.ri(-25, 25) + (S.pers?.has(p, 'charming') ? 8 : 0), 0, 130);
    const base = Math.max(8, st.followers);
    let likes = Math.round(base * (0.02 + q / 900) * U.rand(0.5, 1.6)) + U.ri(0, 5);
    let gain = Math.round(likes * U.rand(0.05, 0.25));
    let viral = false, backlash = false;
    if (U.chance(0.012 + q / 4000 + ((p.fm ?? 0) / 5000))) { viral = true; const m = U.ri(5, 60); likes *= m; gain = Math.round(gain * m + U.ri(200, 5000)); }
    if (kind === 'take' && U.chance(0.2)) { backlash = true; gain = -Math.round(st.followers * U.rand(0.05, 0.2)); S.applyFx(p, { rep: -4, mh: -5 }); }
    st.followers = Math.max(0, st.followers + gain);
    const lines = { selfie: 'A new selfie.', update: `Life update: ${(p.log.filter(l => l.y === yr() && l.k !== 'quiet').slice(-1)[0]?.t || 'Just living.').slice(0, 120)}`, take: U.pick(['Unpopular opinion: everyone is wrong about everything.', 'Hot take: breakfast is overrated.', 'Somebody has to say it.']), meme: 'A meme that perfectly captures this year.', work: `New work out now${p.job ? ` from your favourite ${p.job.t.toLowerCase()}` : ''}.`, pet: `${S.petsOf(p)[0]?.n || 'My pet'} being a star.` };
    const comments = S.known(p).filter(o => S.alive(o) && S.age(o) >= 13 && U.chance(0.3)).slice(0, 3).map(o => { S.rel(p, o).c = U.clamp(S.rel(p, o).c + 1); return { from: o.id, t: U.pick(['Love this!', 'Ha!', 'So proud of you.', 'Call me sometime.', 'Iconic.', 'Where is this?']) }; });
    st.posts.push({ y: yr(), kind, t: lines[kind], likes, gain, viral, backlash, comments });
    if (st.posts.length > 40) st.posts.shift();
    S.applyFx(p, { hp: viral ? 10 : likes > 10 ? 3 : -1, fm: viral ? 6 : 0 });
    if (viral) S.log(p, `Your post went viral! ${U.fmtNum(gain)} new followers.`, 'good');
    if (backlash) S.log(p, 'Your hot take started a pile-on. You lost followers and sleep.', 'bad');
    if (st.followers >= 100000 && !st.verified) { st.verified = 1; S.log(p, 'Your account was verified. You have made it, online at least.', 'good'); }
    return viral ? `It went viral: ${U.fmtNum(likes)} likes!` : backlash ? 'The pile-on was brutal.' : `${U.fmtNum(likes)} likes${gain > 0 ? `, ${gain} new followers` : ''}.`;
  }
  function socialTick(p) {
    const st = ph(p), d = device();
    if (!d.social || !st.handle) return;
    const posted = st.posts.filter(x => x.y === yr()).length;
    st.followers = Math.round(st.followers * (posted ? 1.02 : 0.93));
    if (st.followers >= 10000 && posted >= 2) { const inc = S.toVal(S.era().cost * Math.min(40, st.followers / 50000)); p.money += inc; if (inc > S.toVal(S.era().cost * 0.2)) S.log(p, `Sponsors paid you ${S.money(inc)} for posts this year.`, 'money'); }
    if (st.followers >= 50000 && U.chance(0.12)) { S.applyFx(p, { mh: -4 }); S.log(p, 'Trolls swarmed your comments for weeks.', 'bad'); }
    const target = st.followers > 0 ? Math.log10(st.followers + 1) * 12 : 0;
    if (target > (p.fm ?? 0)) p.fm = U.clamp((p.fm ?? 0) + (target - (p.fm ?? 0)) * 0.25);
    if (st.followers >= 1000) p.flags.influencer = 1;
  }
  // what people you know are posting, made from their lives
  function feedOf(p) {
    const out = [];
    for (const o of S.known(p).filter(q => S.alive(q) && S.age(q) >= 13)) {
      const l = o.log.filter(x => x.y >= yr() - 1 && ['good', 'bad', 'love', 'family', 'work'].includes(x.k)).slice(-1)[0];
      if (l) out.push({ o, t: firstPerson(l.t).slice(0, 140), y: l.y });
    }
    return out.slice(0, 12);
  }

  /* ---------- hooks ---------- */
  S.addHook('postYear', p => { inboxTick(p); socialTick(p); });
  S.addHook('gossip', (p, news) => { if (S.age(p) < 10) return; for (const n of news) if (U.chance(0.4)) queue(n.o, p, 'news', 0, { t: n.t }); });
  S.snapAdd('Followers', p => p.phone?.followers || 0);
  DATA.achievements.push(
    { id: 'influencer', n: 'Influencer', d: 'Reach 10,000 followers.', test: p => (p.phone?.followers || 0) >= 10000 },
    { id: 'penpal', n: 'Pen Pal', d: 'Keep up a correspondence with someone in another land.', test: (p, S2) => Object.keys(p.phone?.sent || {}).some(id => S2.P(+id) && S2.P(+id).cc !== p.cc) },
  );
  const unread = p => (p.phone?.inbox || []).filter(m => !m.done && m.y <= yr()).length;
  return { device, contact, contactActs, answer, autoAnswer, text, post, POSTS, feedOf, unread, ph, queue };
})();

/* ---------------- the Phone tab ---------------- */
LATE.push(() => {
  const S = Sim, ui = UI, Ph = Phone, { esc, toast, render, sheet } = ui;
  const tabs = ui.tabList;
  ui.tabList = () => {
    const t = tabs(), p = S.W && S.me();
    if (!p) return t;
    const n = Ph.unread(p), d = Ph.device();
    const i = t.findIndex(x => x[0] === 'rel');
    t.splice(i + 1, 0, ['phone', `${d.tab}${n ? ` · ${n}` : ''}`]);
    return t;
  };
  function view(p) {
    const d = Ph.device(), st = Ph.ph(p), sub = ui.phoneTab || 'inbox';
    const subs = [['inbox', `Inbox${Ph.unread(p) ? ` (${Ph.unread(p)})` : ''}`], ['contacts', 'Contacts'], ...(d.social ? [['feed', d.app || 'Feed']] : [])];
    const head = `<div class="subtabs" role="tablist">${subs.map(([id, n]) => `<button data-act="phoneTab" data-v="${id}" aria-selected="${sub === id}">${n}</button>`).join('')}</div>`;
    const intro = { runner: 'News travels by runner and by word of mouth.', letter: 'Letters travel by messenger, ship and post. Those far away take a year to answer.', telegraph: 'Letters, or telegrams for when it cannot wait.', telephone: 'A telephone in the hall, and the post for everything else.', mobile: d.social ? 'Texts, calls and the endless feed.' : 'Texts and calls, wherever you are.', neural: 'Thoughts, shared directly, mind to mind.' }[d.id];
    if (sub === 'contacts') {
      const people = S.known(p).filter(S.alive).sort((a, b) => (p.rels[b.id]?.c ?? 0) - (p.rels[a.id]?.c ?? 0));
      return head + `<p class="lede" style="margin:2px 2px 10px">${esc(intro)}</p><div class="list">${people.map(o => `<div class="row contact">${ui.av(o, 'sm')}<div class="main"><button class="linkbtn t" data-act="person" data-id="${o.id}">${esc(S.fullName(o))}</button><div class="s">${esc(S.relLabel(p, o))}${o.cc !== p.cc ? ` · in ${esc(S.world.C(o.cc).short)}` : ''}${p.rels[o.id] ? ` · closeness ${Math.round(p.rels[o.id].c)}` : ''}</div>
        <div class="btnrow" style="margin-top:6px">${Ph.contactActs(p, o).map(([k, l]) => `<button class="btn sm" data-act="phoneAct" data-id="${o.id}" data-a="${k}" data-label="${esc(l)} (${esc(o.first)})" ${p.did[`ph:${o.id}:${k}`] ? 'disabled' : ''}>${esc(l)}</button>${ui.pinBtn('phoneAct', { id: String(o.id), a: k }, `${l} (${o.first})`)}`).join('')}</div></div></div>`).join('') || '<div class="row muted">You know no one yet.</div>'}</div>`;
    }
    if (sub === 'feed' && d.social) {
      if (!st.handle) return head + `<div class="panel"><div class="eyebrow">${esc(d.app)}</div><h3>Join ${esc(d.app)}</h3><p class="lede">Post, get followed, go viral, get famous, get trolled.</p>
        ${S.age(p) < 13 ? '<p class="why">You must be 13.</p>' : `<div class="field"><label for="ph-handle">Pick a handle</label><input id="ph-handle" maxlength="20" value="${esc((p.first + p.last).replace(/[^A-Za-z0-9]/g, '').toLowerCase())}"></div><button class="btn era" style="margin-top:10px" data-act="phoneJoin">Create account</button>`}</div>`;
      const feed = Ph.feedOf(p);
      return head + `<div class="panel"><div class="eyebrow">@${esc(st.handle)}${st.verified ? ' ✓' : ''}</div><h3>${U.fmtNum(st.followers)} followers</h3>
        <div class="btnrow" style="margin-top:8px">${Ph.POSTS.map(([k, l]) => `<button class="btn sm" data-act="phonePost" data-k="${k}">${esc(l)}</button>${ui.pinBtn('phonePost', { k }, l)}`).join('')}</div>
        <p class="faint" style="font-size:12.5px;margin:8px 0 0">Up to three posts a year. Followers turn into fame, and past 10,000 into sponsorship money. Hot takes can go very wrong.</p></div>
        ${st.posts.length ? `<div class="sec-h"><h3>Your posts</h3></div>${st.posts.slice().reverse().slice(0, 8).map(x => `<article class="post"><header><b>@${esc(st.handle)}</b> <span class="faint">· ${U.fmtYearAD(x.y)}</span>${x.viral ? ' <span class="tag good">viral</span>' : ''}${x.backlash ? ' <span class="tag bad">pile-on</span>' : ''}</header><p class="ptext">${esc(x.t)}</p><div class="faint" style="font-size:13px">${U.fmtNum(x.likes)} likes · ${x.gain >= 0 ? '+' : ''}${U.fmtNum(x.gain)} followers</div>${x.comments.length ? `<div class="comments">${x.comments.map(c => { const o = S.P(c.from); return o ? `<p><button class="linkbtn" data-act="person" data-id="${o.id}">${esc(o.first)}</button> ${esc(c.t)}</p>` : ''; }).join('')}</div>` : ''}</article>`).join('')}` : ''}
        ${feed.length ? `<div class="sec-h"><h3>People you know</h3></div>${feed.map(f => `<article class="post"><header><button class="linkbtn" data-act="person" data-id="${f.o.id}"><b>${esc(S.fullName(f.o))}</b></button> <span class="faint">· ${U.fmtYearAD(f.y)}</span></header><p class="ptext">${esc(f.t)}</p></article>`).join('')}` : ''}`;
    }
    const msgs = (st.inbox || []).filter(m => m.y <= S.W.year).slice().reverse();
    return head + `<p class="lede" style="margin:2px 2px 10px">${esc(intro)}</p>${msgs.length ? msgs.map(m => { const [t, ch] = Ph.text(m, p), o = S.P(m.from); return `<article class="post msg ${m.done ? 'done' : ''}"><header>${o && o.id !== p.id ? `<button class="linkbtn" data-act="person" data-id="${o.id}"><b>${esc(S.fullName(o))}</b></button> <span class="faint">· ${esc(S.relLabel(p, o))}</span>` : '<b>Unknown sender</b>'} <span class="faint">· ${U.fmtYearAD(m.y)}</span></header><p class="ptext">${esc(t)}</p>
      ${m.done ? '<div class="faint" style="font-size:13px">Answered.</div>' : `<div class="btnrow">${ch.map(([l, fx], i) => `<button class="btn sm ${i === 0 ? 'era' : ''}" data-act="phoneAns" data-m="${esc(m.id)}" data-i="${i}">${esc(l)}${ui.fxPills ? ` <span class="dchips small preview">${ui.fxPills(Object.fromEntries(Object.entries(fx).filter(([k]) => !['c', 'trait', '$'].includes(k))))}</span>` : ''}</button>`).join('')}</div>`}</article>`; }).join('') : '<p class="muted">Nothing yet. People you are close to will be in touch.</p>'}`;
  }
  ui.views.phone = view;
  ui.on.phoneTab = el => { ui.phoneTab = el.dataset.v; render(); };
  ui.on.phoneAct = el => { const t = Ph.contact(+el.dataset.id, el.dataset.a); S.settle(); render(); toast(t); };
  ui.on.phoneAns = el => { const t = Ph.answer(el.dataset.m, el.dataset.i); S.settle(); render(); toast(t); };
  ui.on.phonePost = el => { const t = Ph.post(el.dataset.k); render(); toast(t); };
  ui.on.phoneJoin = () => { const h = (document.querySelector('#ph-handle')?.value || '').trim().replace(/[^A-Za-z0-9_]/g, ''); if (!h) return toast('Pick a handle.'); const st = Ph.ph(S.me()); st.handle = h; st.followers = U.ri(5, 20) + S.known(S.me()).filter(S.alive).length; S.log(S.me(), `You joined ${Ph.device().app} as @${h}.`, 'life'); render(); toast('Welcome aboard.'); };
  if (typeof Auto !== 'undefined') { Auto.replay.phoneAct = ds => Ph.contact(+ds.id, ds.a); Auto.replay.phonePost = ds => Ph.post(ds.k); }
});
