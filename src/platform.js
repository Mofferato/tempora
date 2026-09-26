/* =====================================================================
   PLATFORM — the browser side of the Tempora server (server/server.js).
   When the game is served by a Tempora server, this adds real accounts,
   cloud saves that follow you between devices (with an optional synced
   autosave), a shared community backend with live updates, and Claude
   through the server. Opened as a plain file, it stays out of the way.
   ===================================================================== */

const Platform = (() => {
  let info = null, user = null;
  const subs = [];
  const changed = () => subs.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  async function api(method, path, body) {
    const r = await fetch(path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || `The server said ${r.status}.`), { status: r.status, code: j.code });
    return j;
  }
  async function init() {
    // static hosts such as GitHub Pages can't run the platform server, so don't look for one
    if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol) || window.TEMPORA_HOSTED || /\.github\.io$/.test(location.hostname)) return;
    try { const j = await api('GET', '/api/ping'); if (!j.tempora) return; info = j; } catch { return; }
    try { user = (await api('GET', '/api/auth/me')).user; } catch { user = null; }
    changed();
  }
  const on = () => !!info;
  async function register(username, password, handle) { user = (await api('POST', '/api/auth/register', { username, password, handle })).user; changed(); return user; }
  async function login(username, password) { user = (await api('POST', '/api/auth/login', { username, password })).user; changed(); return user; }
  async function logout() { await api('POST', '/api/auth/logout').catch(() => {}); user = null; changed(); }
  const saves = {
    list: async () => (await api('GET', '/api/saves')).saves,
    get: async slot => (await api('GET', `/api/saves/${slot}`)).data,
    put: (slot, data, meta) => api('PUT', `/api/saves/${slot}`, { data, meta }),
    del: slot => api('DELETE', `/api/saves/${slot}`),
  };
  async function aiAsk(body) {
    try { return await api('POST', '/api/ai', body); } catch (e) { return { error: e.message, code: e.code || 'upstream_error' }; }
  }

  // The community interface community.js expects, backed by the server
  function communityApi(onChange) {
    let st = { members: {}, posts: [] }, es = null;
    const pull = async () => { try { st = await api('GET', '/api/community'); onChange(); } catch { /* offline for now */ } };
    pull();
    try { es = new EventSource('/api/community/events'); es.addEventListener('changed', pull); } catch { setInterval(pull, 15000); }
    return {
      mode: 'server',
      me() { return user && st.members[user.id] ? { id: user.id, ...st.members[user.id] } : null; },
      accounts() { return []; },
      async setProfile(pr) { if (!user) throw new Error('Sign in first: Menu → Account.'); await api('POST', '/api/community/profile', pr); await pull(); },
      members() { return Object.entries(st.members).map(([id, m]) => ({ id, ...m })); },
      posts() { return st.posts; },
      async post(x, snap) { const r = await api('POST', '/api/community/posts', { ...x, snap }); await pull(); return r.id; },
      async like(id) { await api('POST', `/api/community/posts/${id}/like`); },
      async comment(id, text) { await api('POST', `/api/community/posts/${id}/comments`, { text }); },
      async del(id) { await api('DELETE', `/api/community/posts/${id}`); },
      async follow(uid) { await api('POST', `/api/community/follow/${uid}`); },
      async snap(id) { return (await api('GET', `/api/community/snaps/${id}`)).data; },
      async names() { return {}; },
    };
  }
  return { init, on, user: () => user, info: () => info, ai: () => !!(info && info.ai && user), register, login, logout, saves, aiAsk, communityApi, onChange: f => subs.push(f) };
})();

/* ---------------- Account & cloud saves (Menu → Account) ---------------- */
(() => {
  const S = Sim, ui = UI, { $, esc, toast, sheet, render } = ui;
  const meta = w => `${U.house(w.dyn.name)} · ${U.fmtYearAD(w.year)} · ${w.people[w.playerId]?.first || ''}`;
  async function accountSheet(res) {
    if (!Platform.on()) {
      sheet(`<h2>Account</h2><p class="lede">Accounts, cloud saves and a shared community need the Tempora server. Opened as a file, the game keeps everything in this browser.</p>
        <p class="faint" style="font-size:13px">To host it: install Node 18+, run <span class="mono">node server/server.js</span> in the game folder, and open the address it prints. Anyone who can reach the server can make an account and play across devices.</p>`, { label: 'Account' });
      return;
    }
    const u = Platform.user();
    if (!u) {
      sheet(`<h2>Your Tempora account</h2><p class="lede">Sign in to keep your dynasties in the cloud, play them on any device, and join the shared community${Platform.info()?.ai ? ', and talk with Claude' : ''}.</p>
        <div class="form"><div class="field"><label for="ac-user">Username</label><input id="ac-user" autocomplete="username" maxlength="24"></div>
        <div class="field"><label for="ac-pw">Password</label><input id="ac-pw" type="password" autocomplete="current-password" maxlength="200"></div></div>
        ${res ? `<div class="result">${esc(res)}</div>` : ''}
        <div class="btnrow" style="margin-top:12px"><button class="btn era" data-act="acLogin">Sign in</button><button class="btn" data-act="acRegister">Create account</button></div>
        <p class="faint" style="font-size:12px;margin:8px 0 0">Usernames are 3–24 letters, numbers or underscores. Passwords need at least 8 characters.</p>`, { label: 'Account' });
      return;
    }
    let list = [];
    try { list = await Platform.saves.list(); } catch (e) { res = e.message; }
    const slot = s => list.find(x => x.slot === s);
    sheet(`<h2>Your Tempora account</h2><p class="lede">Signed in as <b>${esc(u.handle)}</b> <span class="faint">(@${esc(u.username)})</span>.</p>
      <label class="check"><input type="checkbox" data-input="acSync" ${ui.store.get('tempora.cloudsync') ? 'checked' : ''}> Sync my autosave to the cloud every year</label>
      <div class="eyebrow" style="margin-top:14px">Cloud saves</div>
      <div class="list" style="margin-top:6px">${['auto', '1', '2', '3', '4', '5'].map(s => { const x = slot(s); return `<div class="row"><div class="main"><div class="t">${s === 'auto' ? 'Cloud autosave' : `Cloud slot ${s}`}</div><div class="s">${x ? `${esc(x.meta?.label || '')} · saved ${new Date(x.updated).toLocaleString()}` : 'empty'}</div></div>
        <div class="btnrow">${S.W && s !== 'auto' ? `<button class="btn sm" data-act="acSave" data-s="${s}">Save here</button>` : ''}${x ? `<button class="btn sm era" data-act="acLoad" data-s="${s}">Load</button>` : ''}</div></div>`; }).join('')}</div>
      ${res ? `<div class="result">${esc(res)}</div>` : ''}
      <div class="btnrow" style="margin-top:14px"><button class="btn" data-act="acLogout">Sign out</button></div>`, { label: 'Account' });
  }
  const guard = async (f, ok) => { try { const r = await f(); ui.open = null; accountSheet(ok || r); } catch (e) { ui.open = null; accountSheet(e.message); } };
  ui.on.account = () => { ui.open = null; accountSheet(); };
  ui.on.acLogin = () => guard(() => Platform.login($('#ac-user').value.trim(), $('#ac-pw').value), 'Welcome back.');
  ui.on.acRegister = () => guard(() => Platform.register($('#ac-user').value.trim(), $('#ac-pw').value), 'Account created. Welcome to Tempora.');
  ui.on.acLogout = () => guard(() => Platform.logout(), 'Signed out.');
  ui.on.acSave = el => guard(() => Platform.saves.put(el.dataset.s, JSON.parse(S.serialize()), meta(S.W)), `Saved to cloud slot ${el.dataset.s}.`);
  ui.on.acLoad = el => guard(async () => { const d = await Platform.saves.get(el.dataset.s); S.load(d); ui.tab = 'life'; $('#screen').innerHTML = ''; render(); ui.save(); return 'Loaded from the cloud.'; });
  ui.input.acSync = el => { ui.store.set('tempora.cloudsync', JSON.stringify(el.checked)); if (el.checked) push(true); };
  // synced autosave: at most every 20 seconds, after each year
  let last = 0, pending = null;
  function push(force) {
    if (!Platform.user() || !S.W || !ui.store.get('tempora.cloudsync')) return;
    const go = () => { pending = null; last = Date.now(); Platform.saves.put('auto', JSON.parse(S.serialize()), meta(S.W)).catch(() => {}); };
    if (force || Date.now() - last > 20000) go(); else if (!pending) pending = setTimeout(go, 20000 - (Date.now() - last));
  }
  (ui.onAged ||= []).push(() => push());
  // add the Account button to the menu
  const menu = ui.on.menu;
  ui.on.menu = () => { menu(); const h = $('#modal .sheet h2'); if (h) h.insertAdjacentHTML('afterend', `<div class="btnrow" style="margin-top:10px"><button class="btn ${Platform.user() ? '' : 'era'}" data-act="account">${Platform.user() ? `Account · ${esc(Platform.user().handle)}` : Platform.on() ? 'Sign in or create an account' : 'Accounts & cloud saves'}</button><button class="btn" data-act="ai">Guide & AI</button><button class="btn" data-act="sound">Music & sound</button></div>`); };
  // a cloud autosave newer than this browser's is offered on the start screen
  const start = ui.start;
  ui.start = () => {
    start();
    if (!Platform.user()) return;
    Platform.saves.list().then(list => {
      const a = list.find(x => x.slot === 'auto'); const box = document.querySelector('.start .hero');
      if (a && box && !document.querySelector('#cloudCont')) box.insertAdjacentHTML('afterend', `<div class="panel" id="cloudCont" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><div class="eyebrow">In the cloud</div><div style="font-family:var(--f-display);font-size:20px">${esc(a.meta?.label || 'Your dynasty')}</div></div><button class="btn era" data-act="acLoad" data-s="auto">Continue from the cloud</button></div>`);
    }).catch(() => {});
  };
  Platform.onChange(() => { if (!S.W && document.querySelector('.start')) ui.start(); });
})();
