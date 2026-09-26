/* =====================================================================
   PROFILES — tap any face or name to open a full profile: overview (in
   the style of text life sims), every stat, personality, their whole
   life's events, family, and achievements. Your own avatar opens yours.
   The character card gains an ID card, and names in the life log link
   to the people they mention.
   ===================================================================== */

(() => {
  const S = Sim, ui = UI, { $, esc, bar, span, plural, sheet, render, toast } = ui;
  const basicPerson = ui.person;
  const TABS = [['over', 'Overview'], ['stats', 'Stats'], ['pers', 'Personality'], ['life', 'Life'], ['fam', 'Family'], ['ach', 'Achievements']];
  const STATUS = (p, o) => {
    const sp = S.spouse(o);
    if (sp) return `Married to ${sp.first}`;
    const lover = Object.entries(o.rels).find(([id, r]) => (r.k === 'lover' || r.k === 'fiance') && S.alive(S.P(+id)));
    if (lover) return `${o.rels[lover[0]].k === 'fiance' ? 'Engaged to' : 'Seeing'} ${S.P(+lover[0]).first}`;
    if (o.flags.widow) return o.sex === 'M' ? 'Widower' : 'Widow';
    if (o.exes.length) return 'Divorced';
    return S.age(o) < 14 ? 'A child' : 'Single';
  };
  const tierOf = (k, v) => DATA.statTier(k, v ?? 0).name;

  /* ---------- ID card on the character card ---------- */
  function idRows(p) {
    const e = S.era(), pd = S.pers?.describe(p), home = S.towns?.info(p);
    const work = p.office ? p.office.t : p.job ? `${p.job.rank ? S.rankName(p.job.rank) + ' ' : ''}${p.job.t}` : p.school ? `Student · ${e.edu.n[p.school.lvl]}` : p.retired ? 'Retired' : S.age(p) < S.workAge(e) ? 'Child' : 'Out of work';
    return [
      ['Home', home ? home.label[0].toUpperCase() + home.label.slice(1) : S.world.name(p.cc)],
      ['Status', STATUS(p, p)],
      ['Work', work],
      ['Schooling', e.edu.n[p.edu]],
      pd ? ['Nature', `${pd.type} · ${pd.traits.slice(0, 3).map(t => t.n).join(', ') || 'still forming'}`] : null,
    ].filter(Boolean);
  }
  const card = ui.cardHTML;
  ui.cardHTML = p => {
    let html = card(p);
    html = html.replace(/<span class="av pt lg/, `<button class="avbtn" data-act="profile" data-id="${p.id}" aria-label="Open your full profile"><span class="av pt lg`).replace(/(<span class="av pt lg[^]*?<\/svg><\/span>)/, '$1</button>');
    const rows = idRows(p);
    return html.replace('<div class="tags">', `<dl class="idcard">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl><div class="tags">`);
  };

  /* ---------- the profile sheet ---------- */
  function overview(p, o) {
    const self = o.id === p.id, liv = S.alive(o), e = S.era(), ph = S.pheno(o), home = S.towns?.info(o), pd = S.pers?.describe(o);
    const kv = [
      ['Age', liv ? `${S.age(o)}` : `Died ${U.fmtYearAD(o.died)} at ${S.age(o)}, of ${o.cause}`],
      ['Born', `${U.fmtYearAD(o.born)}, ${S.eraOf(o.born).name} era`],
      ['Sex', o.sex === 'M' ? 'Male' : 'Female'],
      ['Nationality', `${S.world.C(o.cc)?.adj || ''} · ${S.world.name(o.cc)}`],
      home ? ['Lives in', home.label] : null,
      ['Class', S.className(o)],
      ['Education', e.edu.n[o.edu] + (o.school ? ` (now at ${e.edu.n[o.school.lvl].toLowerCase()})` : '')],
      ['Occupation', o.office ? o.office.t : o.job ? `${o.job.rank ? S.rankName(o.job.rank) + ' ' : ''}${o.job.t} · ${S.money(o.job.pay * S.rankPay(o.job))}/yr` : o.retired ? 'Retired' : o.lastJob ? `Formerly ${o.lastJob}` : '—'],
      o.sport ? ['Sport', S.sports?.label(o) || ''] : null,
      ['Relationship', STATUS(p, o)],
      ['Children', o.kids.length ? `${o.kids.length} (${S.kids(o).filter(S.alive).length} living)` : 'None'],
      ['Wealth', S.money(S.netWorth(o))],
      pd ? ['Personality', `${pd.type}, ${pd.name.replace(/^The /, 'the ')}`] : null,
      self ? ['Attracted to', { straight: 'The opposite sex', gay: 'The same sex', bi: 'Anyone' }[o.orient] || o.orient] : null,
      ['Fame', tierOf('fm', o.fm)], ['Reputation', tierOf('rep', o.rep)],
      o.phone?.followers ? ['Followers', U.fmtNum(o.phone.followers)] : null,
      (o.orgs || []).length ? ['Belongs to', o.orgs.map(m => DATA.orgs.find(x => x.id === m.id)?.n).filter(Boolean).join(', ')] : null,
      o.twin ? ['Twin', S.P(o.twin) ? S.fullName(S.P(o.twin)) : '—'] : null,
      o.title ? ['Title', o.title] : null,
      o.played ? ['Dynasty', 'A life you played'] : null,
    ].filter(Boolean);
    const look = ph ? `<p class="lede" style="margin:10px 0 0">${esc(`${ph.skin.n[0].toUpperCase() + ph.skin.n.slice(1)} skin, ${ph.hair.n} ${ph.hair.type} hair, ${ph.eyes.n} eyes, a ${ph.nose} nose. ${ph.height} cm, ${ph.weight} kg, blood type ${ph.blood}.`)}${ph.traits.length ? ' ' + esc(ph.traits.join(', ')) + '.' : ''}</p>
      ${ph.conds.length || o.sick.length ? `<div class="tags">${o.sick.map(s => `<span class="tag bad">${esc(s.n)}</span>`).join('')}${ph.conds.map(([c, k]) => `<span class="tag ${k === 'bad' ? 'bad' : k === 'good' ? 'good' : ''}">${esc(c)}</span>`).join('')}</div>` : ''}` : '';
    return `<dl class="kv profkv">${kv.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${look}`;
  }
  function stats(o) {
    return `<div class="stats">${DATA.stats.map(s => { const v = Math.round(o[s.k] ?? 0); return `<div class="stat"><span class="k">${s.n}</span>${bar(v)}<span class="v">${v}</span></div><div class="tiernote">${esc(tierOf(s.k, v))}</div>`; }).join('')}</div>`;
  }
  function persView(p, o) {
    const d = S.pers?.describe(o); if (!d) return '<p class="muted">No personality recorded.</p>';
    const ax = DATA.axes.map(([k, pos, neg]) => { const v = d.ax[k], pct = Math.round((v + 1) * 50); return `<div class="axis"><span class="${v < 0 ? 'on' : ''}">${neg}</span><div class="axbar"><i style="left:${pct}%"></i></div><span class="${v >= 0 ? 'on' : ''}">${pos}</span></div>`; }).join('');
    const c = o.id !== p.id ? S.pers.compat(p, o) : null;
    return `<div class="mbti"><div class="type">${d.type}</div><div><b>${esc(d.name)}</b><div class="faint">${esc(d.d)}</div></div></div>
      <div class="axes">${ax}</div>
      <div class="eyebrow" style="margin-top:12px">Traits</div>
      ${d.traits.length ? `<ul class="traits">${d.traits.map(t => `<li><b>${esc(t.n)}</b> <span class="faint">${esc(t.d)}</span></li>`).join('')}</ul>` : '<p class="muted">Too young for their character to show.</p>'}
      ${c != null ? `<p class="lede" style="margin-top:10px">Compatibility with you: <b>${c > 0.3 ? 'Kindred spirits' : c > 0.1 ? 'Good' : c > -0.1 ? 'Mixed' : c > -0.3 ? 'Prickly' : 'Oil and water'}</b> <span class="mono faint">${c >= 0 ? '+' : ''}${Math.round(c * 100)}</span>. It shapes how fast you grow close, and how romance goes.</p>` : `<p class="faint" style="font-size:12.5px;margin-top:10px">Traits come from your parents and grow out of what you choose. Pick brave options and you become brave; keep studying and you become curious.</p>`}`;
  }
  function lifeList(p, o) {
    const items = o.log.filter(l => l.k !== 'quiet').slice().reverse();
    if (!items.length) return '<p class="muted">Nothing recorded yet. People you are close to have fuller stories.</p>';
    return `<ul class="plog">${items.slice(0, 160).map(l => `<li class="${l.k}"><span class="mono faint">${U.fmtYearAD(l.y)} · ${l.a}</span> ${ui.linkify ? ui.linkify(l.t, p) : esc(l.t)}${l.d && ui.dchips ? ' ' + ui.dchips(l.d, { small: 1, max: 4 }) : ''}</li>`).join('')}</ul>`;
  }
  function famView(p, o) {
    const grp = (n, list) => (list.length ? `<div class="eyebrow" style="margin-top:10px">${n}</div><div class="list">${list.map(q => `<button class="row" data-act="person" data-id="${q.id}">${ui.av(q, 'sm')}<div class="main"><div class="t">${esc(S.fullName(q))}</div><div class="s">${S.alive(q) ? `${S.age(q)}` : `† ${U.fmtYear(q.died)}`}${q.id === p.id ? ' · you' : ''}</div></div></button>`).join('')}</div>` : '');
    return grp('Parents', S.parents(o)) + grp('Siblings', S.siblings(o)) + grp('Spouse', [S.spouse(o)].filter(Boolean)) + grp('Former partners', o.exes.map(S.P).filter(Boolean)) + grp('Children', S.kids(o)) + grp('Grandchildren', S.grandkids(o)) || '<p class="muted">No family recorded.</p>';
  }
  function achView(o) {
    const got = DATA.achievements.filter(a => o.ach.includes(a.id)), rest = DATA.achievements.filter(a => !o.ach.includes(a.id));
    return `<div class="tags">${got.map(a => `<span class="tag good" title="${esc(a.d)}">${esc(a.n)}</span>`).join('') || '<span class="muted">None yet.</span>'}</div>
      <details style="margin-top:10px"><summary class="faint" style="cursor:pointer">Still to earn (${rest.length})</summary><ul class="traits">${rest.map(a => `<li><b>${esc(a.n)}</b> <span class="faint">${esc(a.d)}</span></li>`).join('')}</ul></details>`;
  }
  ui.profile = (id, tab, res) => {
    const p = S.me(), o = S.P(id); if (!o) return;
    const self = o.id === p.id, liv = S.alive(o);
    tab = tab || ui.profTab || 'over'; ui.profTab = tab;
    const tabs = TABS.filter(([t]) => t !== 'ach' || o.played);
    const lab = self ? 'You' : S.relLabel(p, o), r = p.rels[o.id];
    const acts = !self && liv ? S.actionsFor(p, o) : [];
    const body = { over: () => overview(p, o), stats: () => stats(o), pers: () => persView(p, o), life: () => lifeList(p, o), fam: () => famView(p, o), ach: () => achView(o) }[tab]();
    sheet(`<div class="who">${ui.av(o, 'lg')}<div class="meta"><div class="eyebrow">${esc(lab)}${o.flags?.ruler ? ' · ruler of your land' : ''}</div><h2>${esc(S.fullName(o))}</h2><div class="sub">${span(o)}${r && !self ? ` · closeness ${Math.round(r.c)}` : ''}</div></div></div>
      ${r && !self && liv ? `<div class="stat" style="margin-top:10px"><span class="k">Closeness</span>${bar(r.c, 'era')}<span class="v">${Math.round(r.c)}</span></div>` : ''}
      <div class="subtabs" role="tablist" style="margin-top:12px">${tabs.map(([t, n]) => `<button data-act="profTab" data-id="${o.id}" data-v="${t}" aria-selected="${tab === t}">${n}</button>`).join('')}</div>
      <div class="profbody">${body}</div>
      ${res ? `<div class="result" role="status">${esc(res)}</div>` : ''}
      ${acts.length ? `<div class="eyebrow" style="margin-top:14px">Do something together</div><div class="acts two" style="margin-top:6px">${acts.map(a => `<div class="actrow"><button class="btn" data-act="interact" data-id="${o.id}" data-a="${a.id}">${esc(a.l)}</button>${ui.pinBtn ? ui.pinBtn('interact', { id: o.id, a: a.id }, `${a.l} with ${o.first}`) : ''}</div>`).join('')}</div>` : ''}
      ${ui.personExtra ? ui.personExtra(p, o) : ''}
      ${!self && liv && S.alive(p) ? `<button class="btn era block" style="margin-top:10px" data-act="become" data-id="${o.id}">Become ${esc(o.first)}</button>
        <p class="faint" style="font-size:12px;margin:8px 0 0">You would take over ${esc(o.first)}'s life with everything in it: their family, work, places and choices. ${esc(p.first)} keeps living in the world.</p>` : ''}
      ${S.godAllowed() ? `<button class="btn sm" style="margin-top:10px" data-act="godEdit" data-id="${o.id}">Edit with god powers</button>` : ''}`, { label: S.fullName(o) });
  };
  ui.person = (id, res) => ui.profile(id, ui.profTab === 'ach' ? 'over' : ui.profTab || 'over', res);
  ui.personBasic = basicPerson;
  ui.on.profile = el => { ui.profTab = 'over'; ui.profile(+el.dataset.id, 'over'); };
  ui.on.profTab = el => { ui.open = null; ui.profile(+el.dataset.id, el.dataset.v); };
  ui.on.moreLog = () => { ui.logLimit = (ui.logLimit || 120) + 120; render(); };

  /* ---------- names in text become links ---------- */
  let cache = { key: '', rx: null, map: null };
  ui.linkify = (t, p) => {
    const s = esc(t);
    if (!p || !S.W) return s;
    const key = `${S.W.year}:${p.id}:${Object.keys(p.rels).length}:${p.kids.length}`;
    if (cache.key !== key) {
      const map = new Map(), firsts = new Map();
      for (const o of S.known(p)) {
        map.set(esc(`${o.first} ${o.last}`), o.id);
        firsts.set(esc(o.first), firsts.has(esc(o.first)) ? -1 : o.id);
      }
      for (const [f, id] of firsts) if (id !== -1 && !map.has(f)) map.set(f, id);
      const names = [...map.keys()].filter(n => n.length > 2).sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      cache = { key, map, rx: names.length ? new RegExp(`\\b(${names.join('|')})\\b`, 'g') : null };
    }
    if (!cache.rx) return s;
    return s.replace(cache.rx, m => `<button class="plink" data-act="person" data-id="${cache.map.get(m)}">${m}</button>`);
  };

  /* ---------- faces in places and households open profiles too ---------- */
  ui.personExtra = (p, o) => '';
})();
