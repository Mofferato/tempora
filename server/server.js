/* =====================================================================
   TEMPORA PLATFORM — a small Node server that turns the single-file game
   into a multi-device platform:
     * accounts (scrypt-hashed passwords, HttpOnly session cookies)
     * cloud saves that follow you between devices
     * one shared community: profiles, posts, likes, comments, follows,
       playable snapshots, live updates over server-sent events
     * Claude for everyone signed in, through the official Anthropic SDK
       with your server's API key and a per-user daily limit
   Run:  node server/server.js [--port=8080] [--data=./server/data]
         (Node 18+; run `npm install` in server/ to enable AI)
   Env:  PORT=8080  HOST=0.0.0.0  TEMPORA_DATA=./server/data
         ANTHROPIC_API_KEY=...  TEMPORA_AI_MODEL=claude-opus-5
         TEMPORA_AI_DAILY=200  TEMPORA_SECURE_COOKIES=1 (behind HTTPS)
         TEMPORA_TRUST_PROXY=1 (behind a reverse proxy that sets X-Forwarded-For)
   ===================================================================== */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const PORT = +arg('port') || +process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.join(__dirname, '..');
const DATA = path.resolve(arg('data') || process.env.TEMPORA_DATA || path.join(__dirname, 'data'));
const SECURE = process.env.TEMPORA_SECURE_COOKIES === '1';
const AI_MODEL = process.env.TEMPORA_AI_MODEL || 'claude-opus-5';
const AI_DAILY = +process.env.TEMPORA_AI_DAILY || 200;
const VERSION = '1.0.0';
const SESSION_DAYS = 30;
const SLOTS = ['auto', '1', '2', '3', '4', '5'];

/* ---------------- storage: one JSON file plus save and snapshot files ---------------- */
fs.mkdirSync(path.join(DATA, 'saves'), { recursive: true });
fs.mkdirSync(path.join(DATA, 'snaps'), { recursive: true });
const DB_FILE = path.join(DATA, 'db.json');
let db = { users: {}, byName: {}, sessions: {}, members: {}, posts: {}, ai: {} };
try { db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) }; } catch { /* first run */ }
let saveTimer = null;
function persist(now) {
  if (saveTimer) clearTimeout(saveTimer);
  const write = () => { saveTimer = null; const tmp = DB_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, DB_FILE); };
  if (now) write(); else saveTimer = setTimeout(write, 800);
}
const writeAtomic = (file, data) => { const tmp = file + '.tmp'; fs.writeFileSync(tmp, data); fs.renameSync(tmp, file); };
const id = (n = 12) => crypto.randomBytes(n).toString('hex');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

/* ---------------- passwords and sessions ---------------- */
function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(`${salt}:${k.toString('hex')}`))));
}
async function checkPassword(pw, stored) {
  const [salt, key] = String(stored).split(':');
  if (!salt || !key) return false;
  const again = (await hashPassword(pw, salt)).split(':')[1];
  return crypto.timingSafeEqual(Buffer.from(again, 'hex'), Buffer.from(key, 'hex'));
}
function newSession(uid) {
  const token = id(32);
  db.sessions[sha(token)] = { uid, exp: Date.now() + SESSION_DAYS * 864e5 };
  persist();
  return token;
}
const cookieOf = (req, name) => { for (const c of String(req.headers.cookie || '').split(';')) { const [k, ...v] = c.trim().split('='); if (k === name) return decodeURIComponent(v.join('=')); } return null; };
function userOf(req) {
  const t = cookieOf(req, 'tempora_sid') || (String(req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (!t) return null;
  const s = db.sessions[sha(t)];
  if (!s || s.exp < Date.now()) return null;
  return db.users[s.uid] || null;
}
const sessionCookie = (token, maxAge) => `tempora_sid=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${SECURE ? '; Secure' : ''}`;
const publicUser = u => ({ id: u.id, username: u.username, handle: db.members[u.id]?.handle || u.username, created: u.created });

/* ---------------- rate limits (in memory) ---------------- */
const buckets = new Map();
function limited(key, max, perMs) {
  const now = Date.now(), b = buckets.get(key) || { n: 0, t: now };
  if (now - b.t > perMs) { b.n = 0; b.t = now; }
  b.n++; buckets.set(key, b);
  return b.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (now - b.t > 36e5) buckets.delete(k); for (const [k, s] of Object.entries(db.sessions)) if (s.exp < now) delete db.sessions[k]; }, 6e5).unref();

/* ---------------- live community updates ---------------- */
const streams = new Set();
function broadcast() { for (const res of streams) { try { res.write('event: changed\ndata: {}\n\n'); } catch { streams.delete(res); } } }
setInterval(() => { for (const res of streams) { try { res.write(': ping\n\n'); } catch { streams.delete(res); } } }, 25000).unref();

/* ---------------- Claude, through the official SDK ---------------- */
let Anthropic = null, anthropic = null;
try { Anthropic = require('@anthropic-ai/sdk'); Anthropic = Anthropic.default || Anthropic; } catch { /* run `npm install` in server/ to enable AI */ }
if (Anthropic && process.env.ANTHROPIC_API_KEY) anthropic = new Anthropic();
async function askClaude({ system, messages, schema, effort, max_tokens }) {
  const params = { model: AI_MODEL, max_tokens: Math.min(16000, Math.max(256, +max_tokens || 4000)), system, messages };
  const oc = {};
  if (['low', 'medium', 'high'].includes(effort) && !/haiku/.test(AI_MODEL)) oc.effort = effort;
  if (schema) oc.format = { type: 'json_schema', schema };
  if (Object.keys(oc).length) params.output_config = oc;
  // Claude Opus 5 / Fable 5.1 may decline; server-side fallbacks re-run a declined request on a suitable model
  const res = /claude-opus-5$|claude-fable-5-1/.test(AI_MODEL)
    ? await anthropic.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
    : await anthropic.messages.create(params);
  if (res.stop_reason === 'refusal') return { error: 'Claude declined to answer that.', code: 'refused' };
  return { text: res.content.filter(b => b.type === 'text').map(b => b.text).join('') };
}

/* ---------------- HTTP helpers ---------------- */
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN' };
function send(res, code, body, headers = {}) {
  const json = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SEC, ...headers });
  res.end(json);
}
const fail = (res, code, error, extra = {}) => send(res, code, { error, ...extra });
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Request too large.'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { if (!chunks.length) return resolve({}); try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(Object.assign(new Error('Invalid JSON.'), { status: 400 })); } });
    req.on('error', reject);
  });
}
// Behind a reverse proxy set TEMPORA_TRUST_PROXY=1; otherwise the forwarded header could be forged to dodge rate limits
const ip = req => (process.env.TEMPORA_TRUST_PROXY === '1' && req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress || '');
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
// Same-origin check for state-changing requests (JSON bodies already force a CORS preflight)
function sameOrigin(req) {
  const o = req.headers.origin; if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

/* ---------------- the game page ---------------- */
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.anthropic.com https://cdn.jsdelivr.net; frame-ancestors 'self'";
function serveGame(res) {
  fs.readFile(path.join(ROOT, 'index.html'), (e, buf) => {
    if (e) return fail(res, 500, 'index.html is missing. Run `node build.js` first.');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'Content-Security-Policy': CSP, ...SEC });
    res.end(buf);
  });
}

/* ---------------- routes ---------------- */
async function route(req, res) {
  const url = new URL(req.url, 'http://x'), p = url.pathname, m = req.method;
  if (m === 'GET' && (p === '/' || p === '/index.html')) return serveGame(res);
  if (p === '/favicon.ico') { res.writeHead(204); return res.end(); }
  if (!p.startsWith('/api/')) return fail(res, 404, 'Not found.');
  if (m !== 'GET' && !sameOrigin(req)) return fail(res, 403, 'Cross-origin request refused.');
  const user = userOf(req);
  const need = () => { if (!user) { fail(res, 401, 'Sign in first.', { code: 'auth' }); return false; } return true; };

  if (m === 'GET' && p === '/api/ping') return send(res, 200, { tempora: true, version: VERSION, ai: !!anthropic, aiModel: anthropic ? AI_MODEL : null });

  /* accounts */
  if (m === 'POST' && p === '/api/auth/register') {
    if (limited('reg:' + ip(req), 5, 36e5)) return fail(res, 429, 'Too many new accounts from here. Try later.');
    const b = await readBody(req, 16e3), username = clean(b.username, 24).toLowerCase(), pw = String(b.password || '');
    if (!/^[a-z0-9_]{3,24}$/.test(username)) return fail(res, 400, 'Usernames are 3–24 letters, numbers or underscores.');
    if (pw.length < 8 || pw.length > 200) return fail(res, 400, 'Passwords need at least 8 characters.');
    if (db.byName[username]) return fail(res, 409, 'That username is taken.');
    const u = { id: id(8), username, pw: await hashPassword(pw), created: Date.now() };
    db.users[u.id] = u; db.byName[username] = u.id;
    db.members[u.id] = { handle: clean(b.handle, 24) || username, bio: '', following: [], joined: Date.now() };
    const token = newSession(u.id); persist(); broadcast();
    return send(res, 200, { user: publicUser(u) }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
  }
  if (m === 'POST' && p === '/api/auth/login') {
    if (limited('login:' + ip(req), 10, 6e4)) return fail(res, 429, 'Too many attempts. Wait a minute.');
    const b = await readBody(req, 16e3), uid = db.byName[clean(b.username, 24).toLowerCase()], u = uid && db.users[uid];
    if (!u || !(await checkPassword(String(b.password || ''), u.pw))) return fail(res, 401, 'Wrong username or password.');
    return send(res, 200, { user: publicUser(u) }, { 'Set-Cookie': sessionCookie(newSession(u.id), SESSION_DAYS * 86400) });
  }
  if (m === 'POST' && p === '/api/auth/logout') {
    const t = cookieOf(req, 'tempora_sid'); if (t) { delete db.sessions[sha(t)]; persist(); }
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }
  if (m === 'GET' && p === '/api/auth/me') return send(res, 200, { user: user ? publicUser(user) : null });
  if (m === 'POST' && p === '/api/auth/password') {
    if (!need()) return;
    const b = await readBody(req, 16e3);
    if (!(await checkPassword(String(b.old || ''), user.pw))) return fail(res, 401, 'Your current password is wrong.');
    if (String(b.new || '').length < 8) return fail(res, 400, 'Passwords need at least 8 characters.');
    user.pw = await hashPassword(String(b.new));
    for (const [k, s] of Object.entries(db.sessions)) if (s.uid === user.id) delete db.sessions[k];
    persist();
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(newSession(user.id), SESSION_DAYS * 86400) });
  }

  /* cloud saves */
  const sm = p.match(/^\/api\/saves(?:\/([a-z0-9]+))?$/);
  if (sm) {
    if (!need()) return;
    const dir = path.join(DATA, 'saves', user.id); fs.mkdirSync(dir, { recursive: true });
    const slot = sm[1];
    if (slot && !SLOTS.includes(slot)) return fail(res, 400, 'Unknown save slot.');
    if (m === 'GET' && !slot) {
      const list = SLOTS.map(s => { try { const st = fs.statSync(path.join(dir, s + '.json')); const meta = JSON.parse(fs.readFileSync(path.join(dir, s + '.meta'), 'utf8')); return { slot: s, meta, updated: st.mtimeMs, size: st.size }; } catch { return null; } }).filter(Boolean);
      return send(res, 200, { saves: list });
    }
    const file = path.join(dir, slot + '.json');
    if (m === 'GET') { try { return send(res, 200, `{"data":${fs.readFileSync(file, 'utf8')}}`); } catch { return fail(res, 404, 'That slot is empty.'); } }
    if (m === 'PUT') {
      if (limited('save:' + user.id, 60, 6e4)) return fail(res, 429, 'Saving too often.');
      const b = await readBody(req, 12e6);
      if (!b.data || typeof b.data !== 'object' || !b.data.people || b.data.playerId == null) return fail(res, 400, 'That is not a Tempora save.');
      writeAtomic(file, JSON.stringify(b.data));
      writeAtomic(path.join(dir, slot + '.meta'), JSON.stringify({ label: clean(b.meta, 120), year: b.data.year }));
      return send(res, 200, { ok: true, updated: Date.now() });
    }
    if (m === 'DELETE') { for (const f of [file, path.join(dir, slot + '.meta')]) try { fs.unlinkSync(f); } catch { /* already gone */ } return send(res, 200, { ok: true }); }
  }

  /* community */
  if (m === 'GET' && p === '/api/community') {
    const posts = Object.values(db.posts).sort((a, b) => b.t - a.t).slice(0, 120);
    const members = Object.fromEntries(Object.entries(db.members).map(([k, v]) => [k, { handle: v.handle, bio: v.bio, following: v.following, joined: v.joined }]));
    return send(res, 200, { members, posts, me: user ? user.id : null });
  }
  if (m === 'GET' && p === '/api/community/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', ...SEC });
    res.write('retry: 5000\n\n'); streams.add(res);
    req.on('close', () => streams.delete(res));
    return;
  }
  if (p.startsWith('/api/community/')) {
    if (!need()) return;
    if (limited('post:' + user.id, 40, 6e4)) return fail(res, 429, 'Slow down a little.');
    const me = db.members[user.id] ||= { handle: user.username, bio: '', following: [], joined: Date.now() };
    if (m === 'POST' && p === '/api/community/profile') { const b = await readBody(req, 16e3); me.handle = clean(b.handle, 24) || me.handle; me.bio = clean(b.bio, 80); persist(); broadcast(); return send(res, 200, { ok: true }); }
    if (m === 'POST' && p === '/api/community/posts') {
      const b = await readBody(req, 3e5), pid = 'p' + id(6);
      const snap = typeof b.snap === 'string' && b.snap.length < 250000 ? b.snap : null;
      db.posts[pid] = { id: pid, author: user.id, t: Date.now(), kind: b.kind === 'life' ? 'life' : 'status', text: clean(b.text, 500), life: b.life && typeof b.life === 'object' ? JSON.parse(JSON.stringify(b.life).slice(0, 4000)) : null, likes: {}, comments: {}, hasSnap: !!snap };
      if (snap) writeAtomic(path.join(DATA, 'snaps', pid + '.json'), snap);
      const ids = Object.keys(db.posts); if (ids.length > 2000) for (const k of ids.sort((a, c) => db.posts[a].t - db.posts[c].t).slice(0, ids.length - 2000)) { delete db.posts[k]; try { fs.unlinkSync(path.join(DATA, 'snaps', k + '.json')); } catch { /* none */ } }
      persist(); broadcast(); return send(res, 200, { id: pid });
    }
    const pm = p.match(/^\/api\/community\/posts\/([a-z0-9]+)(\/like|\/comments)?$/);
    if (pm) {
      const post = db.posts[pm[1]]; if (!post) return fail(res, 404, 'That post is gone.');
      if (m === 'POST' && pm[2] === '/like') { post.likes[user.id] = !post.likes[user.id]; persist(); broadcast(); return send(res, 200, { ok: true }); }
      if (m === 'POST' && pm[2] === '/comments') { const b = await readBody(req, 16e3), x = clean(b.text, 280); if (!x) return fail(res, 400, 'Write something first.'); post.comments[id(4)] = { a: user.id, t: Date.now(), x }; persist(); broadcast(); return send(res, 200, { ok: true }); }
      if (m === 'DELETE' && !pm[2]) { if (post.author !== user.id) return fail(res, 403, 'You can only delete your own posts.'); delete db.posts[post.id]; try { fs.unlinkSync(path.join(DATA, 'snaps', post.id + '.json')); } catch { /* none */ } persist(); broadcast(); return send(res, 200, { ok: true }); }
    }
    const fm = p.match(/^\/api\/community\/follow\/([a-z0-9]+)$/);
    if (m === 'POST' && fm) { if (!db.members[fm[1]] || fm[1] === user.id) return fail(res, 400, 'Nobody to follow.'); const f = new Set(me.following); f.has(fm[1]) ? f.delete(fm[1]) : f.add(fm[1]); me.following = [...f]; persist(); broadcast(); return send(res, 200, { ok: true }); }
    const nm = p.match(/^\/api\/community\/snaps\/([a-z0-9]+)$/);
    if (m === 'GET' && nm) { try { return send(res, 200, { data: fs.readFileSync(path.join(DATA, 'snaps', nm[1] + '.json'), 'utf8') }); } catch { return fail(res, 404, 'That life has no playable copy.'); } }
  }

  /* Claude */
  if (m === 'POST' && p === '/api/ai') {
    if (!need()) return;
    if (!anthropic) return fail(res, 503, 'AI is not configured on this server.', { code: 'unavailable' });
    const day = new Date().toISOString().slice(0, 10), u = db.ai[user.id] ||= { day, n: 0 };
    if (u.day !== day) { u.day = day; u.n = 0; }
    if (u.n >= AI_DAILY) return fail(res, 429, `You have used today's ${AI_DAILY} Claude requests.`, { code: 'rate_limited' });
    if (limited('ai:' + user.id, 12, 6e4)) return fail(res, 429, 'Too many requests at once. Wait a moment.', { code: 'rate_limited' });
    const b = await readBody(req, 2e5);
    const system = clean(b.system, 30000);
    const messages = Array.isArray(b.messages) ? b.messages.filter(x => x && (x.role === 'user' || x.role === 'assistant') && typeof x.content === 'string' && x.content.trim()).slice(-24).map(x => ({ role: x.role, content: x.content.slice(0, 8000) })) : [];
    if (!messages.length || messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') return fail(res, 400, 'Messages must start and end with the player.');
    u.n++; persist();
    try { const r = await askClaude({ system, messages, schema: b.schema && typeof b.schema === 'object' ? b.schema : null, effort: b.effort, max_tokens: b.max_tokens }); return send(res, r.error ? 422 : 200, r); }
    catch (e) {
      if (Anthropic && e instanceof Anthropic.RateLimitError) return fail(res, 429, 'Claude is busy. Try again shortly.', { code: 'rate_limited' });
      if (Anthropic && e instanceof Anthropic.AuthenticationError) return fail(res, 503, 'The server’s API key was rejected.', { code: 'unavailable' });
      if (Anthropic && e instanceof Anthropic.BadRequestError) return fail(res, 400, 'Claude rejected that request.', { code: 'bad_request' });
      if (Anthropic && e instanceof Anthropic.APIError) return fail(res, 502, 'Claude could not answer just now.', { code: 'upstream_error' });
      return fail(res, 502, 'Could not reach Claude.', { code: 'upstream_error' });
    }
  }
  return fail(res, 404, 'Not found.');
}

const server = http.createServer((req, res) => {
  route(req, res).catch(e => { if (!res.headersSent) fail(res, e.status || 500, e.status ? e.message : 'Something went wrong.'); console.error(e.status ? e.message : e); });
});
server.listen(PORT, HOST, () => console.log(`Tempora platform on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  ·  data in ${DATA}  ·  AI ${anthropic ? `on (${AI_MODEL})` : 'off'}`));
const bye = () => { persist(true); process.exit(0); };
process.on('SIGINT', bye); process.on('SIGTERM', bye);
