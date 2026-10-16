/* =====================================================================
   FAITH, CULTURE and MARRIAGE — screens, as sections of the Identity tab.
   ===================================================================== */

LATE.push(() => {
  const S = Sim, ui = UI, A = Atlas, { $, esc, toast, render, sheet } = ui;
  const pct = v => `${Math.round(v * 100)}%`;
  const DIMS = [['I', 'Individualism', 'Community first', 'Self first'], ['H', 'Respect for hierarchy', 'Egalitarian', 'Deferential'], ['T', 'Tradition', 'Change-seeking', 'Tradition-bound'], ['F', 'Family ties', 'Loose', 'Close'], ['O', 'Openness to outsiders', 'Wary', 'Welcoming'], ['R', 'Religiosity', 'Secular', 'Devout'], ['G', 'Gender equality', 'Unequal', 'Equal']];
  const FCOL = ['#c9953a', '#3a8aa8', '#a85a8a', '#5a9a5a', '#c0603a', '#6a6ac0', '#8a8a3a', '#9a6a4a'];
  const tone = v => (v >= 0.75 ? 'welcomed' : v >= 0.5 ? 'accepted with reluctance' : v >= 0.25 ? 'frowned on' : 'strongly opposed');

  function mixBar(cc) {
    const m = Faith.mixAt(cc).slice(0, 7);
    return `<div class="ethbar">${m.map(([id, v], i) => `<i style="width:${v * 100}%;background:${FCOL[i % FCOL.length]}" title="${esc(Faith.f(id).n)} ${pct(v)}"></i>`).join('')}</div>
      <div class="ethkey">${m.map(([id, v], i) => `<span><b style="background:${FCOL[i % FCOL.length]}"></b>${esc(Faith.f(id).n)} ${pct(v)}</span>`).join('')}</div>`;
  }
  function faithSection(p) {
    const id = Faith.get(p), fa = Faith.f(id), piety = Math.round(p.piety ?? 40);
    const acts = S.activities(p).filter(a => a.id.startsWith('e:faith-'));
    const circle = Faith.circle(p).filter(q => Faith.get(q) !== id).slice(0, 3);
    const hd = fa.hd && fa.hd.length ? `<p class="faint" style="margin:8px 0 0">Holy days: ${fa.hd.map(esc).join(' · ')}</p>` : '';
    return `<div class="panel"><div class="eyebrow">Faith</div><h3 style="margin:2px 0 4px">${esc(fa.n)}</h3>
      <div class="faint" style="margin-bottom:8px">${piety >= 75 ? 'Devout' : piety >= 50 ? 'Observant' : piety >= 25 ? 'Casual' : 'Lapsed'} · piety ${piety}${Faith.minority(p) ? ' · a minority here' : ''}</div>
      <div class="bar era"><i style="width:${piety}%"></i></div>
      <div class="chips" style="margin-top:10px">${acts.map(a => `<button class="chip" data-act="activity" data-id="${esc(a.id)}" ${a.done || a.young || a.broke ? 'disabled' : ''}>${esc(a.n)}${a.cost ? ` · ${esc(S.money(a.cost))}` : ''}</button>`).join('') || '<span class="faint">No practices open to you yet.</span>'}</div>
      ${hd}
      ${circle.length ? `<p class="faint" style="margin:8px 0 0">${circle.map(q => `${esc(q.first)} follows ${esc(Faith.adj(Faith.get(q)))} ways`).join('; ')}.</p>` : ''}
      <details style="margin-top:10px"><summary class="faint">What ${esc(Faith.adj(id))}s hold dear</summary><ul class="plain">
        <li>Divorce is ${tone(fa.div)}</li><li>Same-sex love is ${tone(fa.ss)}</li><li>Marrying outside the faith is ${tone(fa.ifm)}</li><li>Arranged marriage is ${fa.arr >= 0.7 ? 'expected' : fa.arr >= 0.4 ? 'common' : 'uncommon'}</li><li>Other faiths are ${tone(fa.tol)}</li></ul></details>
      <div class="eyebrow" style="margin-top:12px">Belief in ${esc(S.world.name(p.cc))}</div>${mixBar(p.cc)}
      <button class="btn sm" style="margin-top:10px" data-act="faithExplore">Explore other faiths</button></div>`;
  }
  function cultureSection(p) {
    const c = A.culture(p.cc, S.W.year), at = A.C(p.cc)?.at || {};
    const bar = ([k, n, lo, hi]) => `<div class="dim"><div class="dn"><span>${n}</span><span class="faint">${c[k] >= 65 ? hi : c[k] <= 35 ? lo : 'Balanced'}</span></div><div class="bar era"><i style="width:${c[k]}%"></i></div></div>`;
    const list = (title, a) => (a && a.length ? `<div class="kvr"><b>${title}</b><span>${a.map(esc).join(' · ')}</span></div>` : '');
    const clean = a => (a || []).map(x => String(x).replace(/@-?\d+$/, '')).slice(0, 5);
    const y = S.W.year;
    const aged = a => (a || []).filter(x => { const m = String(x).match(/@(-?\d+)$/); return !m || +m[1] <= y; });
    return `<div class="panel"><div class="eyebrow">Culture of ${esc(S.world.name(p.cc))}</div>
      <div class="dims">${DIMS.map(bar).join('')}</div>
      <div class="kvrs">${list('Languages', at.lg)}${list('Food', clean(aged(at.fd)))}${list('Festivals', clean(aged(at.fs)))}${list('Sport and play', clean(aged(at.sp)))}${list('Customs', at.cs)}${list('What stands out', at.tr)}</div></div>`;
  }
  function marriageSection(p) {
    const v = Marriage.prevalence(p.cc, p), dow = Marriage.dowType(p.cc), sp = S.spouse(p);
    const arr = sp && p.rels[sp.id]?.arr;
    const dowTxt = { dowry: 'The bride’s family gives a dowry.', bride: 'The groom’s family pays a bride-price.', mutual: 'Families exchange gifts at the wedding.', none: 'No dowry or bride-price is expected.' }[dow];
    const fam = { nuclear: 'Couples set up their own household', extended: 'Several generations share a home', stem: 'The eldest son’s household keeps the elders', clan: 'The clan shapes every marriage', matrifocal: 'Households centre on mothers' }[A.culture(p.cc, S.W.year).fam] || '';
    const eng = Object.entries(p.rels).filter(([id, r]) => r.k === 'fiance' && r.arr && S.alive(S.P(+id)));
    return `<div class="panel"><div class="eyebrow">Marriage customs</div><h3 style="margin:2px 0 8px">${esc(Marriage.label(v))}</h3>
      <div class="bar era"><i style="width:${v * 100}%"></i></div>
      <p class="faint" style="margin:8px 0 0">${esc(dowTxt)} ${esc(fam)}.</p>
      ${arr ? `<p style="margin:8px 0 0">Your marriage to ${esc(sp.first)} was arranged. ${Math.round(p.rels[sp.id].c) >= 70 ? 'It has grown into real affection.' : 'Affection is still growing, year by year.'}</p>` : ''}
      ${eng.map(([id]) => `<p style="margin:8px 0 0">Engaged by arrangement to ${esc(S.P(+id).first)}. The wedding is soon.</p>`).join('')}</div>`;
  }
  ui.identitySections.push({ id: 'faith', order: 30, html: faithSection }, { id: 'culture', order: 40, html: cultureSection }, { id: 'marriage', order: 35, html: marriageSection });

  /* ---------- exploring other faiths ---------- */
  ui.on.faithExplore = () => {
    const p = S.me(), opts = Faith.options(p).slice(0, 14);
    sheet(`<div class="eyebrow">Explore</div><h2>Other ways of believing</h2><p class="faint" style="margin:2px 0 10px">Changing faith is a big step. Your family may not understand, and your community may not welcome it.</p>
      <div class="list">${opts.map(id => { const f = Faith.f(id), cost = Faith.conversionCost(p, id); return `<button class="row" data-act="faithConvert" data-id="${id}"><div class="main"><div class="t">${esc(f.n)}</div><div class="s">${Faith.share(p.cc, id) > 0.01 ? `${pct(Faith.share(p.cc, id))} of ${esc(S.world.name(p.cc))}` : 'Few follow it here'} · welcomes newcomers ${f.mis >= 0.5 ? 'eagerly' : f.mis >= 0.2 ? 'warmly' : 'quietly'}</div></div><div class="end">${cost.strict > 0.7 ? '<span class="tag bad">family may object</span>' : ''}</div></button>`; }).join('')}</div>`, { label: 'Other faiths' });
  };
  ui.on.faithConvert = el => {
    const p = S.me(), id = el.dataset.id, f = Faith.f(id);
    sheet(`<div class="eyebrow">Convert</div><h2>${esc(f.n)}</h2><p>Become ${/^[aeiou]/i.test(f.adj) ? 'an' : 'a'} ${esc(f.adj)}? Those close to you who follow ${esc(Faith.adj(Faith.get(p)))} ways may take it hard.</p>
      <div class="acts"><button class="btn era" data-act="faithDo" data-id="${id}">Yes, I want this</button><button class="btn" data-act="close">Not now</button></div>`, { label: 'Confirm' });
  };
  ui.on.faithDo = el => { const t = Faith.convert(S.me(), el.dataset.id); ui.open = null; $('#modal').innerHTML = ''; render(); toast(t); ui.save?.(); };
});
