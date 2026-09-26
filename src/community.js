/* =====================================================================
   COMMUNITY — profiles, a feed of shared lives, likes, comments,
   follows and a leaderboard. Two backends with one interface:
     hosted: the page's shared database, with each viewer's Claude identity
     local:  profiles and posts kept in this browser
   Shared lives can be played as a copy or fused into your own life.
   ===================================================================== */

const Community = (() => {
  let api = null, listeners = [];
  const changed = () => listeners.forEach(f => f());
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function localApi() {
    const KEY = 'tempora.community';
    // Kept in memory, and in browser storage when it is available
    let mem = UI.store.get(KEY) || { members: {}, posts: {}, snaps: {}, me: null }, warned = false;
    const load = () => mem;
    const save = d => {
      mem = d;
      if (!UI.store.set(KEY, JSON.stringify(d)) && !warned) { warned = true; UI.toast('Browser storage is unavailable, so the community will be forgotten when you close the page.'); }
      changed();
    };
    try { window.addEventListener('storage', e => { if (e.key === KEY) { mem = UI.store.get(KEY) || mem; changed(); } }); } catch { /* ignore */ }
    return {
      mode: 'local',
      me() { const d = load(); return d.me && d.members[d.me] ? { id: d.me, ...d.members[d.me] } : null; },
      accounts() { return Object.entries(load().members).map(([id, m]) => ({ id, ...m })); },
      async switchTo(id) { const d = load(); d.me = id; save(d); },
      async newAccount() { const d = load(); d.me = null; save(d); },
      async setProfile(pr) { const d = load(); let id = d.me; if (!id) { id = 'local-' + rid(); d.me = id; } d.members[id] = { following: [], joined: Date.now(), ...(d.members[id] || {}), ...pr }; save(d); },
      members() { return Object.entries(load().members).map(([id, m]) => ({ id, ...m })); },
      posts() { return Object.values(load().posts).sort((a, b) => b.t - a.t); },
      async post(x, snap) { const d = load(), id = 'p' + rid(); d.posts[id] = { id, author: d.me, t: Date.now(), likes: {}, comments: {}, ...x, hasSnap: !!snap }; if (snap) d.snaps[id] = snap; save(d); return id; },
      async like(id) { const d = load(), p = d.posts[id]; if (!p) return; p.likes[d.me] = !p.likes[d.me]; save(d); },
      async comment(id, text) { const d = load(); d.posts[id].comments[rid()] = { a: d.me, t: Date.now(), x: text }; save(d); },
      async del(id) { const d = load(); delete d.posts[id]; delete d.snaps[id]; save(d); },
      async follow(uid) { const d = load(), m = d.members[d.me], f = new Set(m.following || []); f.has(uid) ? f.delete(uid) : f.add(uid); m.following = [...f]; save(d); },
      async snap(id) { return load().snaps[id] || null; },
      async names() { return {}; },
    };
  }

  async function hostedApi() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') return null;
    const [db, user] = await Promise.all([cl.use('db'), cl.use('user')]);
    if (!db || !user) return null;
    const uid = await user.id();
    if (!uid) return null;
    const st = { members: {}, posts: [] };
    db.collection('members').onSnapshot(s => { st.members = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); changed(); }, () => {});
    db.collection('posts').orderBy('t', 'desc').limit(80).onSnapshot(s => { st.posts = s.docs.map(d => ({ id: d.id, ...d.data() })); changed(); }, () => {});
    return {
      mode: 'hosted', uid,
      me() { return st.members[uid] ? { id: uid, ...st.members[uid] } : null; },
      accounts() { return []; },
      async setProfile(pr) { const cur = st.members[uid] || { following: [], joined: Date.now() }; await db.doc('members/' + uid).set({ ...cur, ...pr }); },
      members() { return Object.entries(st.members).map(([id, m]) => ({ id, ...m })); },
      posts() { return st.posts; },
      async post(x, snap) { const ref = await db.collection('posts').add({ author: uid, t: Date.now(), likes: {}, comments: {}, ...x, hasSnap: !!snap }); if (snap) await db.doc('snaps/' + ref.id).set({ data: snap }); return ref.id; },
      async like(id) { const p = st.posts.find(x => x.id === id); await db.doc('posts/' + id).update({ likes: { [uid]: !(p?.likes?.[uid]) } }); },
      async comment(id, text) { await db.doc('posts/' + id).update({ comments: { [rid()]: { a: uid, t: Date.now(), x: text } } }); },
      async del(id) { await db.doc('posts/' + id).delete(); await db.doc('snaps/' + id).delete(); },
      async follow(target) { const f = new Set(st.members[uid]?.following || []); f.has(target) ? f.delete(target) : f.add(target); await db.doc('members/' + uid).update({ following: [...f] }); },
      async snap(id) { const s = await db.doc('snaps/' + id).get(); return s.exists ? s.data().data : null; },
      async names(ids) { const ps = await user.profiles(ids); return Object.fromEntries(ids.map(i => [i, ps[i]?.name || ''])); },
    };
  }

  async function init() {
    api = localApi();
    // Served by a Tempora server: one shared community for every account
    if (typeof Platform !== 'undefined' && Platform.on()) { api = Platform.communityApi(changed); Platform.onChange(changed); changed(); return; }
    try { const h = await hostedApi(); if (h) { api = h; changed(); } } catch { /* stay local */ }
  }
  return { init, get api() { return api; }, onChange: f => listeners.push(f) };
})();

(() => {
  const S = Sim, ui = UI, { $, esc, bar, toast, sheet, render } = ui;
  const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} d ago`; };
  let names = {};
  const handleOf = (uid, members) => { const m = members.find(x => x.id === uid); return m?.handle || names[uid] || 'Someone'; };

  // A compact copy of the world that fits a shared post
  function miniSave() {
    const w = S.W, p = S.me();
    const keep = new Set([p.id, ...S.known(p).map(o => o.id)]);
    let x = p; for (let i = 0; i < 6 && x; i++) { [x.fa, x.mo].forEach(id => id != null && keep.add(id)); x = S.P(x.fa); }
    const people = {};
    for (const id of keep) { const o = S.P(id); if (!o) continue; people[id] = { ...o, log: id === p.id ? o.log.slice(-150) : o.log.slice(-8), places: null }; }
    const json = JSON.stringify({ ...w, people, news: w.news.slice(-80) });
    return json.length < 240000 ? json : null;
  }
  function lifeCard(p) {
    const ph = S.pheno(p);
    return { name: S.fullName(p), sex: p.sex, born: p.born, age: S.age(p), year: S.W.year, era: S.era().name, country: S.world.name(p.cc), cls: S.className(p), job: p.job?.t || p.lastJob || null,
      net: S.money(S.netWorth(p)), dyn: S.W.dyn.name, dynScore: S.W.dyn.score + S.lifeScore(p), ach: p.ach.length, lives: S.W.dyn.played.length,
      stats: Object.fromEntries(['h', 'hp', 'sm', 'lk', 'rep', 'fm'].map(k => [k, Math.round(p[k] ?? 0)])), looks: ph ? `${ph.skin.n} skin, ${ph.hair.n} hair, ${ph.eyes.n} eyes` : '' };
  }
  function postHTML(x, me, members) {
    const L = x.life, mine = x.author === me?.id, liked = !!x.likes?.[me?.id];
    const likes = Object.values(x.likes || {}).filter(Boolean).length, comments = Object.values(x.comments || {}).sort((a, b) => a.t - b.t);
    const following = (me?.following || []).includes(x.author);
    return `<article class="post"><header><b>${esc(handleOf(x.author, members))}</b> <span class="faint">· ${ago(x.t)}</span>
        ${!mine && me ? `<button class="linkbtn" data-act="cFollow" data-u="${esc(x.author)}">${following ? 'Following' : 'Follow'}</button>` : ''}</header>
      ${L ? `<div class="lifecard"><div class="eyebrow">${esc(L.era)} · ${esc(L.country)} · ${U.fmtYearAD(L.year)}</div><h3>${esc(L.name)}</h3>
        <p class="faint">${L.age} years old · ${esc(L.cls)}${L.job ? ` · ${esc(L.job)}` : ''} · worth ${esc(L.net)}</p>
        <div class="minis">${[['Health', 'h'], ['Happiness', 'hp'], ['Smarts', 'sm'], ['Looks', 'lk'], ['Fame', 'fm']].map(([n, k]) => `<div class="stat"><span class="k">${n}</span>${bar(L.stats[k])}<span class="v">${L.stats[k]}</span></div>`).join('')}</div>
        <p class="faint" style="font-size:12px;margin:6px 0 0">${esc(U.house(L.dyn))} · dynasty score ${U.fmtNum(L.dynScore)} over ${L.lives} ${L.lives === 1 ? 'life' : 'lives'} · ${L.ach} achievements${L.looks ? ` · ${esc(L.looks)}` : ''}</p></div>` : ''}
      ${x.text ? `<p class="ptext">${esc(x.text)}</p>` : ''}
      <div class="btnrow"><button class="btn sm ${liked ? 'era' : ''}" data-act="cLike" data-id="${esc(x.id)}">${liked ? 'Liked' : 'Like'} · ${likes}</button>
        ${x.hasSnap ? `<button class="btn sm" data-act="cPlay" data-id="${esc(x.id)}">Play a copy</button><button class="btn sm" data-act="cFuse" data-id="${esc(x.id)}">Fuse with my life</button>` : ''}
        ${mine ? `<button class="btn sm danger" data-act="cDel" data-id="${esc(x.id)}">Delete</button>` : ''}</div>
      <div class="comments">${comments.map(c => `<p><b>${esc(handleOf(c.a, members))}</b> ${esc(c.x)}</p>`).join('')}
        ${me ? `<form class="cform" data-id="${esc(x.id)}"><input id="cm-${esc(x.id)}" maxlength="280" placeholder="Write a comment" aria-label="Write a comment"><button class="btn sm">Send</button></form>` : ''}</div></article>`;
  }
  function feedHTML() {
    const api = Community.api, me = api.me(), members = api.members();
    let posts = api.posts();
    if (ui.cFilter === 'following') posts = posts.filter(x => (me?.following || []).includes(x.author));
    if (ui.cFilter === 'mine') posts = posts.filter(x => x.author === me?.id);
    if (ui.cSub === 'board') {
      const best = {}; for (const x of api.posts()) if (x.life && (!best[x.life.dyn + x.author] || best[x.life.dyn + x.author].life.dynScore < x.life.dynScore)) best[x.life.dyn + x.author] = x;
      const rows = Object.values(best).sort((a, b) => b.life.dynScore - a.life.dynScore).slice(0, 30);
      return rows.length ? `<ol class="board">${rows.map((x, i) => `<li><span class="mono">${i + 1}</span><div><b>${esc(U.house(x.life.dyn))}</b> <span class="faint">by ${esc(handleOf(x.author, members))}</span><div class="faint">${esc(x.life.era)} · ${esc(x.life.country)} · ${x.life.lives} lives</div></div><span class="mono">${U.fmtNum(x.life.dynScore)}</span></li>`).join('')}</ol>` : '<p class="muted">No dynasties shared yet. Be the first.</p>';
    }
    if (ui.cSub === 'members') return `<div class="list">${members.sort((a, b) => (b.joined || 0) - (a.joined || 0)).map(m => { const followers = members.filter(x => (x.following || []).includes(m.id)).length; return `<div class="row"><div class="main"><div class="t">${esc(m.handle || 'Someone')}${m.id === me?.id ? ' <span class="tag era">you</span>' : ''}</div><div class="s">${esc(m.bio || '')} · ${followers} followers</div></div>${m.id !== me?.id && me ? `<button class="btn sm" data-act="cFollow" data-u="${esc(m.id)}">${(me.following || []).includes(m.id) ? 'Following' : 'Follow'}</button>` : ''}</div>`; }).join('') || '<p class="muted">Nobody yet.</p>'}</div>`;
    return posts.length ? posts.map(x => postHTML(x, me, members)).join('') : '<p class="muted">Nothing here yet. Share a life to start the conversation.</p>';
  }
  ui.views.community = () => {
    const api = Community.api;
    if (!api) return '<p class="muted">Connecting…</p>';
    const me = api.me();
    const note = api.mode === 'hosted'
      ? 'You are signed in with your Claude account. Everyone this page is shared with sees the same feed.'
      : api.mode === 'server' ? 'One shared community for everyone with an account on this Tempora server.'
      : 'This community lives in this browser. Run the Tempora server, or publish Tempora as a shared page, to play with other people.';
    if (api.mode === 'server' && !Platform.user()) return `<div class="panel"><div class="eyebrow">Shared community</div><h3>Sign in to join</h3><p class="lede">${note}</p><button class="btn era" data-act="account">Sign in or create an account</button></div>`;
    if (!me) return `<div class="panel"><div class="eyebrow">Join the community</div><h3>Create your profile</h3><p class="lede">${note}</p>
      <div class="form"><div class="field"><label for="c-handle">Display name</label><input id="c-handle" maxlength="24" placeholder="What should people call you?"></div>
      <div class="field"><label for="c-bio">About you</label><input id="c-bio" maxlength="80" placeholder="Optional"></div></div>
      <button class="btn era" style="margin-top:12px" data-act="cProfile">Create profile</button>
      ${api.accounts().length ? `<div class="eyebrow" style="margin-top:14px">Or sign in as</div><div class="btnrow" style="margin-top:6px">${api.accounts().map(a => `<button class="btn sm" data-act="cSwitch" data-u="${esc(a.id)}">${esc(a.handle)}</button>`).join('')}</div>` : ''}</div>`;
    const members = api.members(), followers = members.filter(x => (x.following || []).includes(me.id)).length;
    const subs = [['feed', 'Feed'], ['board', 'Leaderboard'], ['members', 'Members']];
    return `<div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;align-items:start;flex-wrap:wrap"><div><div class="eyebrow">${api.mode === 'hosted' ? 'Shared community' : 'Local community'}</div><h3>${esc(me.handle)}</h3>
        <p class="faint" style="margin:2px 0 0">${esc(me.bio || '')}${me.bio ? ' · ' : ''}${followers} followers · following ${(me.following || []).length}</p></div>
        ${api.mode === 'local' ? `<div class="btnrow">${api.accounts().length > 1 ? `<select id="c-acct" data-input="cAcct" aria-label="Switch profile">${api.accounts().map(a => `<option value="${esc(a.id)}" ${a.id === me.id ? 'selected' : ''}>${esc(a.handle)}</option>`).join('')}</select>` : ''}<button class="btn sm" data-act="cNewAcct">New profile</button></div>` : ''}</div>
      <p class="faint" style="font-size:12px">${note}</p>
      ${S.W ? `<div class="compose"><textarea id="c-text" rows="2" maxlength="500" placeholder="Say something about ${esc(S.me().first)}'s life…"></textarea>
        <label class="check"><input type="checkbox" id="c-snap" checked> Attach a playable copy of this life</label>
        <div class="btnrow"><button class="btn era sm" data-act="cShare">Share this life</button><button class="btn sm" data-act="cStatus">Post an update</button></div></div>` : ''}</div>
    <div class="subtabs" role="tablist">${subs.map(([id, n]) => `<button data-act="cSub" data-v="${id}" aria-selected="${(ui.cSub || 'feed') === id}">${n}</button>`).join('')}</div>
    ${(ui.cSub || 'feed') === 'feed' ? `<div class="subtabs small">${[['all', 'Everyone'], ['following', 'Following'], ['mine', 'Mine']].map(([id, n]) => `<button data-act="cFilter" data-v="${id}" aria-selected="${(ui.cFilter || 'all') === id}">${n}</button>`).join('')}</div>` : ''}
    <div id="cfeed">${feedHTML()}</div>`;
  };
  const refresh = () => { const f = $('#cfeed'); if (f && ui.tab === 'community') f.innerHTML = feedHTML(); else if (ui.tab === 'community' && !ui.open && !$('#c-handle')) render(); };
  Community.onChange(async () => {
    const api = Community.api; if (!api) return;
    if (api.mode === 'hosted') { const ids = [...new Set(api.posts().map(p => p.author))].filter(id => !names[id]); if (ids.length) names = { ...names, ...(await api.names(ids)) }; }
    refresh();
  });
  const guard = async (fn, ok) => { try { await fn(); if (ok) toast(ok); } catch (e) { toast(e?.message || 'That did not go through. Try again.'); } };
  ui.on.cProfile = () => { const h = $('#c-handle').value.trim(); if (!h) return toast('Choose a display name.'); guard(() => Community.api.setProfile({ handle: h, bio: $('#c-bio').value.trim() }), 'Welcome!').then(render); };
  ui.on.cSwitch = el => guard(() => Community.api.switchTo(el.dataset.u)).then(render);
  ui.input.cAcct = el => guard(() => Community.api.switchTo(el.value)).then(render);
  ui.on.cNewAcct = () => guard(() => Community.api.newAccount()).then(render);
  ui.on.cSub = el => { ui.cSub = el.dataset.v; render(); };
  ui.on.cFilter = el => { ui.cFilter = el.dataset.v; render(); };
  ui.on.cShare = () => {
    const p = S.me(), snap = $('#c-snap').checked ? miniSave() : null;
    if ($('#c-snap').checked && !snap) toast('This world is too large to attach, so only the summary will be shared.');
    guard(async () => {
      await Community.api.post({ kind: 'life', text: $('#c-text').value.trim(), life: lifeCard(p) }, snap);
      p.flags.shared = 1; S.applyFx(p, { fm: 3 }); S.log(p, 'You shared your story with the world.', 'good');
    }, 'Shared. Your fame grew a little.').then(render);
  };
  ui.on.cStatus = () => { const t = $('#c-text').value.trim(); if (!t) return toast('Write something first.'); guard(() => Community.api.post({ kind: 'status', text: t }), 'Posted.').then(render); };
  ui.on.cLike = el => guard(() => Community.api.like(el.dataset.id));
  ui.on.cFollow = el => guard(() => Community.api.follow(el.dataset.u));
  ui.on.cDel = el => guard(() => Community.api.del(el.dataset.id), 'Deleted.');
  async function loadSnap(id) { const s = await Community.api.snap(id); if (!s) throw new Error('That life has no playable copy.'); return JSON.parse(s); }
  ui.on.cPlay = el => guard(async () => {
    const w = await loadSnap(el.dataset.id);
    ui.open = null;
    sheet(`<h2>Play a copy of this life?</h2><div class="body">Your current game stays in its save slots and exports, but the autosave will switch to this copy.</div>
      <div class="acts"><button class="btn era" data-act="cPlayYes">Play it</button><button class="btn" data-act="close">Not now</button></div>`);
    ui.pendingPlay = w;
  });
  ui.on.cPlayYes = () => { try { S.load(ui.pendingPlay); ui.open = null; $('#modal').innerHTML = ''; ui.tab = 'life'; $('#screen').innerHTML = ''; render(); ui.save(); toast('You are now living this shared life.'); } catch (e) { toast(e.message); } };
  ui.on.cFuse = el => guard(async () => { if (!S.W) throw new Error('Start a life first.'); const w = await loadSnap(el.dataset.id); ui.openFusion(w, `Shared life: ${w.people[w.playerId]?.first || 'someone'}`); });
  document.addEventListener('submit', e => {
    const f = e.target.closest('.cform'); if (!f) return;
    e.preventDefault();
    const inp = f.querySelector('input'), t = inp.value.trim(); if (!t) return;
    inp.value = '';
    guard(() => Community.api.comment(f.dataset.id, t));
  });
  DATA.achievements.push({ id: 'storyteller', n: 'Storyteller', d: 'Share a life with the community.', test: p => !!p.flags.shared });
})();
