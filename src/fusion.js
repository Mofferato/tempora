/* =====================================================================
   REALITY FUSION — merge all or part of another life into yours:
   stats, genes, people, country, wealth, career, memories, pets, or a
   whole other world's population. Sources: save slots, pasted saves,
   community posts, or past lives in your own dynasty.
   ===================================================================== */

const Fusion = (() => {
  const S = Sim;
  const STATS = ['h', 'hp', 'sm', 'lk', 'rep', 'mh', 'fe', 'im', 'wp', 'fm'];

  // Copy people from another world into this one with fresh ids
  function importPeople(src, ids, keepAges) {
    const w = S.W, map = {}, shift = keepAges ? U.span(src.year, w.year) : 0;
    for (const id of ids) map[id] = w.nid++;
    const out = [];
    for (const id of ids) {
      const o = JSON.parse(JSON.stringify(src.people[id]));
      o.id = map[id]; o.born = U.add(o.born, shift); if (o.died != null) o.died = U.add(o.died, shift);
      if (o.born > w.year) o.born = w.year;
      o.fa = map[o.fa] ?? null; o.mo = map[o.mo] ?? null; o.sp = map[o.sp] ?? null;
      o.kids = o.kids.map(k => map[k]).filter(Boolean); o.exes = o.exes.map(k => map[k]).filter(Boolean);
      o.rels = Object.fromEntries(Object.entries(o.rels).filter(([k]) => map[k]).map(([k, v]) => [map[k], v]));
      o.played = false; o.log = o.log.slice(-20); o.fused = 1; o.did = {}; o.places = null;
      if (o.job && !S.jobsNow(S.era(), o.cc).some(j => j.id === o.job.id)) { o.job = null; }
      S.ensurePerson(o);
      w.people[o.id] = o; out.push(o);
    }
    return { out, map };
  }
  const knownIn = (src, p) => {
    const ids = new Set();
    const add = id => id != null && src.people[id] && ids.add(+id);
    [p.fa, p.mo, p.sp, ...p.kids, ...p.exes, ...Object.keys(p.rels)].forEach(add);
    for (const id of [...ids]) { const q = src.people[id]; [q.fa, q.mo, ...q.kids].forEach(add); }
    ids.delete(p.id);
    return [...ids].filter(id => src.people[id].died == null).slice(0, 40);
  };

  function fuse(src, srcId, o) {
    const w = S.W, p = S.me(), internal = src === w;
    const sp = src.people[srcId ?? src.playerId];
    if (!sp) return 'Nothing to fuse with.';
    const done = [];
    if (o.stats) {
      for (const k of STATS) {
        const a = p[k] ?? 50, b = sp[k] ?? 50;
        p[k] = U.clamp(Math.round(o.stats === 'blend' ? (a + b) / 2 : o.stats === 'best' ? Math.max(a, b) : b));
      }
      done.push('stats');
    }
    if (o.genes && sp.g) {
      p.g = o.genes === 'child' ? Gen.cross(p.sex === 'M' ? p.g : sp.g, p.sex === 'M' ? sp.g : p.g, p.sex) : JSON.parse(JSON.stringify(sp.g));
      if (o.genes === 'theirs' && sp.sex !== p.sex) p.g.cb = p.g.cb.slice(0, p.sex === 'M' ? 1 : 2).concat(p.sex === 'F' && p.g.cb.length === 1 ? [0] : []);
      delete p.phx; done.push('genes');
    }
    if (o.country && sp.cc && S.world.C(sp.cc) && w.year >= S.world.C(sp.cc).from) { p.cc = sp.cc; done.push('country'); }
    if (o.wealth && !internal) {
      p.money += Math.max(0, sp.money);
      for (const a of sp.assets || []) p.assets.push({ ...a, uid: w.nid++ });
      done.push('wealth');
    }
    if (o.career) {
      p.edu = Math.max(p.edu, sp.edu || 0);
      if (sp.title && !p.title) p.title = sp.title;
      p.cls = Math.max(p.cls ?? 2, sp.cls ?? 2);
      if (sp.job && !p.job) { const j = S.jobsNow(S.era(), p.cc).find(x => x.id === sp.job.id); if (j) S.giveJob(p, j); }
      done.push('career');
    }
    if (o.memories) {
      const mem = (sp.log || []).filter(l => !['quiet'].includes(l.k)).slice(-25);
      for (const l of mem) S.log(p, `Fused memory · ${U.fmtYearAD(l.y)}, age ${l.a}: ${l.t}`, 'fused');
      done.push('memories');
    }
    if (o.pets && !internal) {
      for (const pet of Object.values(src.pets || {})) if (pet.owner === sp.id && pet.died == null) { const id = w.nid++; w.pets[id] = { ...pet, id, owner: p.id, born: U.add(w.year, -(src.year - pet.born)) }; }
      done.push('pets');
    }
    if (o.people && !internal) {
      const ids = o.people === 'world' ? Object.keys(src.people).map(Number).filter(id => src.people[id].died == null && id !== sp.id).slice(0, 300) : knownIn(src, sp);
      const all = o.self ? [sp.id, ...ids] : ids;
      const { out, map } = importPeople(src, all, o.keepAges);
      const twin = map[sp.id] && S.P(map[sp.id]);
      if (twin) {
        twin.first = twin.first; twin.flags ||= {}; twin.flags.echo = 1;
        if (o.people === 'family') { twin.fa = p.fa; twin.mo = p.mo; [S.P(p.fa), S.P(p.mo)].forEach(x => x && x.kids.push(twin.id)); }
        p.rels[twin.id] = { k: o.people === 'family' ? 'fam' : 'friend', c: 70 };
      }
      for (const q of out) if (q !== twin && sp.rels[Object.keys(map).find(k => map[k] === q.id)]) p.rels[q.id] ||= { k: 'friend', c: U.ri(40, 70) };
      if (o.people === 'world') for (const n of src.news || []) if (!w.news.some(x => x.t === n.t)) w.news.push({ ...n, t: `${n.t} (another reality)` });
      done.push(`${out.length} people`);
    }
    if (internal && o.people) {
      for (const [k, r] of Object.entries(sp.rels)) { const q = S.P(+k); if (q && S.alive(q) && q.id !== p.id) p.rels[q.id] ||= { k: r.k === 'fam' ? 'friend' : r.k, c: Math.round(r.c * 0.7) }; }
      done.push('old ties');
    }
    p.flags.fused = 1;
    S.log(p, `Reality fusion with ${sp.first} ${sp.last}: ${done.join(', ') || 'nothing changed'}.`, 'switch');
    S.checkAch(p);
    return done.length ? `Fused: ${done.join(', ')}.` : 'Nothing was selected to fuse.';
  }
  return { fuse, STATS };
})();

(() => {
  const S = Sim, ui = UI, { $, esc, toast, sheet, render } = ui;
  let pending = null;                  // { src, id, label }
  function sources() {
    const out = [];
    [1, 2, 3].forEach(n => { const s = ui.store.get(`tempora.slot${n}`); if (s?.people) out.push({ key: `slot${n}`, label: `Save slot ${n}: ${s.people[s.playerId]?.first || ''} ${s.people[s.playerId]?.last || ''}, ${U.fmtYearAD(s.year)}`, get: () => ({ src: s }) }); });
    for (const l of S.W.dyn.lives.slice().reverse().slice(0, 12)) if (S.P(l.id)) out.push({ key: `life${l.id}`, label: `Past life: ${l.name}, ${U.fmtYear(l.born)}–${U.fmtYear(l.died)}`, get: () => ({ src: S.W, id: l.id }) });
    return out;
  }
  function fusionSheet(res) {
    const src = pending;
    sheet(`<h2>Reality fusion</h2><p class="lede">Weave another life into yours. Take their strengths, their people, their homeland, their memories, or pour their whole world into this one.</p>
      <div class="field" style="margin-top:8px"><label for="fu-src">Fuse with</label><select id="fu-src" data-input="fuSrc"><option value="">Choose a life…</option>${sources().map(s => `<option value="${s.key}" ${src?.key === s.key ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}${src?.key === 'paste' || src?.key === 'post' ? `<option value="${src.key}" selected>${esc(src.label)}</option>` : ''}</select></div>
      <details style="margin-top:8px"><summary class="faint" style="cursor:pointer">Or paste a save from anywhere</summary><textarea id="fu-paste" rows="4" placeholder="Paste exported save text" style="margin-top:6px;font:12px var(--f-mono)"></textarea><button class="btn sm" style="margin-top:6px" data-act="fuPaste">Use this save</button></details>
      ${src ? `<div class="panel" style="margin-top:12px"><div class="eyebrow">What to fuse</div>
        <div class="form" style="margin-top:8px">
          <div class="field"><label for="fu-stats">Stats</label><select id="fu-stats"><option value="blend">Blend both</option><option value="best">Keep the best of each</option><option value="theirs">Take theirs</option><option value="">Keep mine</option></select></div>
          <div class="field"><label for="fu-genes">Genes and looks</label><select id="fu-genes"><option value="">Keep mine</option><option value="child">Mix us, like a child of both</option><option value="theirs">Take theirs</option></select></div>
          <div class="field"><label for="fu-people">People</label><select id="fu-people"><option value="">Nobody</option><option value="friends">Their family and friends, as my friends</option><option value="family">Them as my sibling, with their family</option><option value="world">Their whole world (reality merge)</option></select></div></div>
        <div class="checks" style="margin-top:8px">${[['country', 'Their homeland'], ['wealth', 'Their money and property'], ['career', 'Their schooling, title and trade'], ['memories', 'Their memories'], ['pets', 'Their pets'], ['self', 'Bring them in as a living person too'], ['keepAges', 'Keep everyone’s ages (not their birth years)']].map(([k, l]) => `<label class="check"><input type="checkbox" id="fu-${k}" ${['memories', 'self', 'keepAges'].includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div>
        <button class="btn era block" style="margin-top:12px" data-act="fuGo">Fuse realities</button></div>` : ''}
      ${res ? `<div class="result">${esc(res)}</div>` : ''}`, { label: 'Reality fusion' });
  }
  ui.on.fusion = () => { ui.open = null; pending = null; fusionSheet(); };
  ui.openFusion = (src, label) => { ui.open = null; pending = { key: 'post', label, src, id: src.playerId }; fusionSheet(); };
  ui.input.fuSrc = el => { const s = sources().find(x => x.key === el.value); pending = s ? { key: s.key, label: s.label, ...s.get() } : null; ui.open = null; fusionSheet(); };
  ui.on.fuPaste = () => {
    try { const src = JSON.parse($('#fu-paste').value); if (!src.people) throw 0; pending = { key: 'paste', label: `Pasted save: ${src.people[src.playerId]?.first || 'someone'}, ${U.fmtYearAD(src.year)}`, src }; ui.open = null; fusionSheet(); }
    catch { toast('That is not valid save text.'); }
  };
  ui.on.fuGo = () => {
    if (!pending) return;
    const v = id => $('#fu-' + id), o = { stats: v('stats').value, genes: v('genes').value, people: v('people').value };
    for (const k of ['country', 'wealth', 'career', 'memories', 'pets', 'self', 'keepAges']) o[k] = v(k).checked;
    const t = Fusion.fuse(pending.src, pending.id, o);
    ui.open = null; $('#modal').innerHTML = ''; ui.tab = 'life'; render(); ui.save(); toast(t);
  };
})();
