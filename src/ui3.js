/* =====================================================================
   UI, part 3 — portraits, character card, stat & class sheets, bios with
   appearance and genetics, Life story view, relationships with pets and
   bulk actions.
   ===================================================================== */

(() => {
  const S = Sim, ui = UI, { $, esc, bar, span, plural, toast, sheet, render } = ui;
  const idR = (id, s) => { const x = Math.sin(id * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
  const initialsAv = ui.av;

  /* ---------------- portraits ---------------- */
  function portrait(p, cls = '') {
    const ph = S.pheno ? S.pheno(p) : null;
    if (!ph) return initialsAv(p, cls);
    const a = S.age(p), F = p.sex === 'F', ring = ui.bornCol(p);
    const baby = a < 3, kid = a < 13;
    const r = baby ? 8.5 : kid ? 9.5 : 10.5, cy = baby ? 25 : 22.5;
    const skin = ph.skin.hex, hair = ph.hair.hex, eye = ph.eyes.hex, curl = ph.hair.curl;
    const L = 24 - r, R = 24 + r;
    let back = '', top = '', extra = '';
    if (!baby && curl >= 4) back = `<circle cx="24" cy="${cy - 1.5}" r="${r + 5.5}" fill="${hair}"/>`;
    else if (!baby && F && a >= 4) back = `<path d="M${L - 2} ${cy} Q${L - 4} ${cy + 15} ${L + 1} ${cy + 18} L${R - 1} ${cy + 18} Q${R + 4} ${cy + 15} ${R + 2} ${cy} Z" fill="${hair}"/>`;
    const bald = !F && a > 50 && idR(p.id, 3) < 0.4;
    if (baby) top = `<path d="M22 ${cy - r + 1} q2 -3 4 0" stroke="${hair}" stroke-width="1.6" fill="none"/>`;
    else if (curl === 3) top = [-7, -3.5, 0, 3.5, 7].map((dx, i) => `<circle cx="${24 + dx}" cy="${cy - r + 1.5 + (i % 2)}" r="3.4" fill="${hair}"/>`).join('');
    else if (curl < 4) top = bald
      ? `<path d="M${L} ${cy} Q${L} ${cy - 5} ${L + 3} ${cy - 6} L${L + 3} ${cy} Z M${R} ${cy} Q${R} ${cy - 5} ${R - 3} ${cy - 6} L${R - 3} ${cy} Z" fill="${hair}"/>`
      : `<path d="M${L} ${cy + 1} Q${L - 0.5} ${cy - r - 3} 24 ${cy - r - 2.5} Q${R + 0.5} ${cy - r - 3} ${R} ${cy + 1} Q${R - 2} ${cy - r + 3} ${24 + (curl ? 2 : 0)} ${cy - r + 3.5} Q${L + 2} ${cy - r + 3} ${L} ${cy + 1} Z" fill="${hair}"/>`;
    if (!F && a >= 20 && idR(p.id, 5) < 0.32) extra += `<path d="M${L + 1.5} ${cy + 2} Q24 ${cy + r + 5.5} ${R - 1.5} ${cy + 2} Q24 ${cy + r + 1.5} ${L + 1.5} ${cy + 2} Z" fill="${hair}" opacity=".92"/>`;
    const glasses = a >= 8 && p.g && p.g.myo[0] && p.g.myo[1] && S.W.year >= 1290;
    if (glasses) extra += `<circle cx="20.3" cy="${cy + 0.4}" r="2.6" fill="none" stroke="#2a2a2a" stroke-width=".8"/><circle cx="27.7" cy="${cy + 0.4}" r="2.6" fill="none" stroke="#2a2a2a" stroke-width=".8"/><path d="M22.9 ${cy + 0.2} h2.2" stroke="#2a2a2a" stroke-width=".8"/>`;
    const brows = a >= 10 ? `<path d="M18.6 ${cy - 2.6} h3.4 M26 ${cy - 2.6} h3.4" stroke="${hair}" stroke-width="1" stroke-linecap="round"/>` : '';
    const mouth = S.alive(p) && (p.hp ?? 50) >= 40 ? `<path d="M21.8 ${cy + 4.6} Q24 ${cy + 6.4} 26.2 ${cy + 4.6}" stroke="#7a3f2c" stroke-width=".9" fill="none" stroke-linecap="round"/>` : `<path d="M22 ${cy + 5.4} h4" stroke="#7a3f2c" stroke-width=".9" stroke-linecap="round"/>`;
    const svg = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" style="fill:var(--surface)"/><rect width="48" height="48" fill="${ring}" opacity=".2"/>
      ${back}<path d="M6 50 Q9 ${cy + 13} 24 ${cy + 12.5} Q39 ${cy + 13} 42 50 Z" fill="${ring}"/><rect x="21.3" y="${cy + 7}" width="5.4" height="6" fill="${skin}"/>
      <ellipse cx="24" cy="${cy}" rx="${r - 0.4}" ry="${r + 0.8}" fill="${skin}"/>${top}${brows}
      <circle cx="20.4" cy="${cy + 0.5}" r="${baby ? 0.9 : 1.25}" fill="${eye}"/><circle cx="27.6" cy="${cy + 0.5}" r="${baby ? 0.9 : 1.25}" fill="${eye}"/>${mouth}${extra}
      <circle cx="24" cy="24" r="23" fill="none" stroke="${ring}" stroke-width="2"/></svg>`;
    return `<span class="av pt ${cls}${S.alive(p) ? '' : ' dead'}" title="${esc(`${ph.skin.n} skin, ${ph.hair.n} ${ph.hair.type} hair, ${ph.eyes.n} eyes`)}">${svg}</span>`;
  }
  ui.av = portrait;

  /* ---------------- character card ---------------- */
  const statRow = (p, s) => `<button class="stat srow" data-act="stat" data-k="${s.k}" aria-label="${s.n}: ${Math.round(p[s.k] ?? 0)}, ${esc(DATA.statTier(s.k, p[s.k] ?? 0).name)}"><span class="k">${s.n}</span>${bar(p[s.k] ?? 0)}<span class="v">${Math.round(p[s.k] ?? 0)}</span></button>`;
  ui.cardHTML = p => {
    const e = S.era(), a = S.age(p), tags = [];
    tags.push(`<span class="tag era">${esc(e.short || e.name)}</span>`);
    tags.push(`<button class="tag cls" data-act="classes">${esc(S.className(p))}</button>`);
    if (p.prison) tags.push(`<span class="tag bad">In prison · ${plural(p.prison, 'year')}</span>`);
    if (p.flags.war) tags.push('<span class="tag bad">At war</span>');
    p.sick.forEach(s => tags.push(`<span class="tag bad">${esc(s.n)}</span>`));
    if (p.job) tags.push(`<span class="tag">${esc(p.job.t)}</span>`);
    else if (p.school) tags.push(`<span class="tag">${esc(e.edu.n[p.school.lvl])}</span>`);
    else if (p.retired) tags.push('<span class="tag">Retired</span>');
    const sp = S.spouse(p);
    if (sp) tags.push(`<span class="tag">Married to ${esc(sp.first)}</span>`);
    if (p.title) tags.push(`<span class="tag good">${esc(p.title)}</span>`);
    if (p.amb && !p.flags.ambDone) tags.push(`<span class="tag" title="Your ambition">Aim: ${esc(DATA.ambitions.find(x => x.id === p.amb)?.n || '')}</span>`);
    const main = DATA.stats.filter(s => s.main), more = DATA.stats.filter(s => !s.main);
    return `<div class="who">${portrait(p, 'lg')}<div class="meta"><h2>${esc(S.fullName(p))}</h2>
      <div class="sub">${p.sex === 'M' ? 'He' : 'She'} · age ${a} · ${span(p)}</div>
      <div class="sub">${esc(S.world.name(p.cc))} · ${esc(U.house(S.W.dyn.name))}</div></div></div>
      <div class="tags">${tags.join('')}</div>
      <div class="stats">${main.map(s => statRow(p, s)).join('')}
        <div class="moreStats" ${ui.moreStats ? '' : 'hidden'}>${more.map(s => statRow(p, s)).join('')}</div>
        <button class="linkbtn" data-act="moreStats">${ui.moreStats ? 'Fewer stats' : 'Mental health, fertility, imagination, willpower, fame'}</button></div>
      <div class="wealth"><span class="eyebrow">Wealth · ${esc(S.curNow(p.cc).n)}</span><span class="v ${p.money < 0 ? 'faint' : ''}">${S.money(p.money)}</span></div>
      ${p.assets.length ? `<div class="faint" style="font-size:12px;text-align:right">Net worth ${S.money(S.netWorth(p))}</div>` : ''}`;
  };
  ui.on.moreStats = () => { ui.moreStats = !ui.moreStats; render(); };

  /* ---------------- stat and class sheets ---------------- */
  const TIPS = {
    h: 'Exercise, eat well and see a healer when you fall ill. Danger, disease, debt and age wear it down.',
    hp: 'Love, work, money and health all feed it. Losses, prison and debt drain it.',
    sm: 'School, study and reading raise it. It shapes which careers and schools will take you.',
    lk: 'Mostly inherited, then shaped by youth, exercise and care. It fades gently with age.',
    rep: 'Kept promises, good deeds and honours build it. Crime, scandal and cowardice spend it.',
    mh: 'Follows your happiness and circumstances. Therapy, rest, faith and good company help; war, prison and grief hurt.',
    fe: 'Largely inherited. It falls with age, faster for women after thirty-five. Treatments can help in some eras.',
    im: 'Grows with stories, art and daydreaming. It opens creative careers and inspired moments.',
    wp: 'Grows with discipline and hardship survived. It helps you resist temptation and push through hard work.',
    fm: 'Comes from famous work, heroics and scandal. It fades when you step out of the spotlight.',
  };
  ui.on.stat = el => {
    const p = S.me(), k = el.dataset.k, v = Math.round(p[k] ?? 0), t = DATA.statTier(k, v);
    sheet(`<div class="statcard" style="--sc:${t.stat.col}"><div class="stitle">${esc(t.stat.n.toUpperCase())}: ${esc(t.name)}</div>
        <p class="sdesc">${esc(t.text)}</p><div class="sbar" role="img" aria-label="${v} out of 100"><i style="width:${v}%"></i><span>${v}</span></div></div>
      <p class="lede" style="margin-top:14px">${esc(TIPS[k])}</p>
      <div class="eyebrow" style="margin-top:12px">Every level</div>
      <ol class="tierlist">${t.stat.d.map((d, i) => `<li class="${d[0] === t.name ? 'on' : ''}"><span class="mono">${DATA.tiers[i]}</span> <b>${esc(d[0])}</b> <span class="faint">${esc(d[1])}</span></li>`).join('')}</ol>`, { label: t.stat.n });
  };
  ui.on.classes = () => {
    const p = S.me(), lad = S.ladder(p.cc);
    sheet(`<div class="eyebrow">Social class · ${esc(S.world.name(p.cc))}, ${U.fmtYearAD(S.W.year)}</div><h2>${esc(S.className(p))}</h2>
      <ol class="ladder">${lad.slice().reverse().map((n, i) => { const lvl = 6 - i; return `<li class="${lvl === p.cls ? 'on' : ''}"><span class="mono">${lvl + 1}</span> ${esc(n)}${lvl === p.cls ? ' <span class="tag era">you</span>' : ''}</li>`; }).join('')}</ol>
      <p class="lede">Class follows your wealth, titles and marriage, slowly in older eras and faster in modern ones. The top rung is reached only by marrying into it. Higher classes open some careers, clubs and pets.</p>`, { label: 'Social class' });
  };

  /* ---------------- bios with appearance and genetics ---------------- */
  ui.person = (id, res) => {
    const p = S.me(), o = S.P(id);
    if (!o) return;
    const self = o.id === p.id, liv = S.alive(o), e = S.era();
    const lab = self ? 'You' : S.relLabel(p, o);
    const r = p.rels[o.id], sp = S.spouse(o), ph = S.pheno(o);
    const kv = [
      ['Born', `${U.fmtYearAD(o.born)} · ${S.eraOf(o.born).name}`],
      liv ? ['Age', S.age(o)] : ['Died', `${U.fmtYearAD(o.died)}, age ${S.age(o)}, of ${o.cause}`],
      ['Country', S.world.name(o.cc)], ['Class', S.className(o)],
      ['Occupation', o.job ? `${o.job.t}${o.job.rank ? ` (${S.rankName(o.job.rank)})` : ''}` : o.retired ? 'Retired' : o.lastJob ? `Formerly ${o.lastJob}` : '—'],
      ['Education', e.edu.n[o.edu]], ['Spouse', sp ? S.fullName(sp) : o.exes.length ? 'Divorced or widowed' : '—'],
      ['Children', o.kids.length], ['Wealth', S.money(S.netWorth(o))],
    ];
    if ((o.orgs || []).length) kv.push(['Belongs to', o.orgs.map(m => DATA.orgs.find(x => x.id === m.id)?.n).filter(Boolean).join(', ')]);
    if (o.twin) kv.push(['Twin', S.P(o.twin) ? S.fullName(S.P(o.twin)) : '—']);
    if (o.played) kv.push(['Dynasty', 'A life you played']);
    const acts = !self && liv ? S.actionsFor(p, o) : [];
    const look = ph ? `<div class="eyebrow" style="margin-top:14px">Appearance</div>
      <p class="lede" style="margin:4px 0 0">${esc(`${ph.skin.n[0].toUpperCase() + ph.skin.n.slice(1)} skin, ${ph.hair.n} ${ph.hair.type} hair, ${ph.eyes.n} eyes and a ${ph.nose} nose. ${ph.height} cm and ${ph.weight} kg. Blood type ${ph.blood}.`)}${ph.traits.length ? ' ' + esc(ph.traits.join(', ')) + '.' : ''}</p>
      ${ph.conds.length ? `<div class="tags">${ph.conds.map(([c, k]) => `<span class="tag ${k === 'bad' ? 'bad' : k === 'good' ? 'good' : ''}">${esc(c)}</span>`).join('')}</div>` : ''}` : '';
    sheet(`<div class="who">${portrait(o, 'lg')}<div class="meta"><div class="eyebrow">${esc(lab)}</div><h2>${esc(S.fullName(o))}</h2><div class="sub">${span(o)}</div></div></div>
      ${liv ? `<div class="stats">${DATA.stats.filter(s => s.main || ['mh', 'fm'].includes(s.k)).filter(s => s.k !== 'rep').map(s => `<div class="stat"><span class="k">${s.n}</span>${bar(o[s.k] ?? 0)}<span class="v">${Math.round(o[s.k] ?? 0)}</span></div>`).join('')}
        ${r && !self ? `<div class="stat"><span class="k">Closeness</span>${bar(r.c, 'era')}<span class="v">${Math.round(r.c)}</span></div>` : ''}</div>` : ''}
      ${look}
      <dl class="kv">${kv.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      ${res ? `<div class="result" role="status">${esc(res)}</div>` : ''}
      ${acts.length ? `<div class="acts" style="margin-top:14px">${acts.map(a => ui.interactBtn(o, a)).join('')}</div>` : ''}
      ${!self && liv && S.alive(p) ? `<button class="btn era block" style="margin-top:10px" data-act="become" data-id="${o.id}">Become ${esc(o.first)}</button>
        <p class="faint" style="font-size:12px;margin:8px 0 0">${esc(p.first)} keeps living in the world as an ordinary person.</p>` : ''}
      ${S.godAllowed() ? `<button class="btn sm" style="margin-top:10px" data-act="godEdit" data-id="${o.id}">Edit with god powers</button>` : ''}`, { label: S.fullName(o) });
  };

  /* ---------------- Life: log or story ---------------- */
  const logView = ui.views.life;
  ui.views.life = p => {
    const toggle = `<div class="subtabs" role="tablist"><button data-act="lifeView" data-v="log" aria-selected="${ui.lifeView !== 'story'}">Year by year</button><button data-act="lifeView" data-v="story" aria-selected="${ui.lifeView === 'story'}">Your story</button></div>`;
    if (ui.lifeView !== 'story') return toggle + logView(p);
    const chs = S.story(p);
    return toggle + `<div class="panel story">${chs.map(c => `<section><h3>Chapter ${c.n} · ${esc(c.title)}</h3>${c.intro ? `<p class="intro">${esc(c.intro)}</p>` : ''}
      <p>${c.lines.slice(0, 40).map(l => esc(l.endsWith('.') || l.endsWith('!') || l.endsWith('?') ? l : l + '.')).join(' ')}</p></section>`).join('') || '<p class="muted">Your story has not begun.</p>'}</div>`;
  };
  ui.on.lifeView = el => { ui.lifeView = el.dataset.v; render(); };

  /* ---------------- Relationships: everyone, pets ---------------- */
  const relView = ui.views.rel;
  ui.views.rel = p => {
    const pets = S.petsOf(p);
    const live = S.known(p).filter(S.alive);
    const family = live.filter(o => p.rels[o.id]?.k === 'fam' || /Father|Mother|Brother|Sister|Son|Daughter|Grand|Uncle|Aunt|Cousin|Nephew|Niece|Husband|Wife|in-law/.test(S.relLabel(p, o)));
    const pin = (a, g, l) => (ui.pinBtn ? ui.pinBtn('bulk', { a, g }, l) : '');
    const bulk = `<div class="panel bulk"><div class="eyebrow">Everyone at once · ${live.length} people</div><div class="btnrow" style="margin-top:8px">
      <button class="btn sm" data-act="bulk" data-a="time" data-g="all">Spend time with everyone</button>${pin('time', 'all', 'Spend time with everyone')}
      <button class="btn sm" data-act="bulk" data-a="talk" data-g="family">Talk with all family (${family.length})</button>${pin('talk', 'family', 'Talk with all family')}
      <button class="btn sm" data-act="bulk" data-a="gift" data-g="all">Send everyone a gift</button>${pin('gift', 'all', 'Send everyone a gift')}
      <button class="btn sm" data-act="bulk" data-a="party" data-g="all">Throw a gathering</button>${ui.introBtn ? ui.introBtn(p) : ''}</div></div>`;
    const petBlock = `<div class="sec-h"><h3>Pets</h3><button class="btn sm" data-act="adopt">Adopt a pet</button></div>
      ${pets.length ? `<div class="list">${pets.map(x => { const sp = S.petSpec(x.kind); return `<button class="row" data-act="pet" data-id="${x.id}"><span class="av sm petav" aria-hidden="true">${esc(sp.n[0])}</span><div class="main"><div class="t">${esc(x.n)}</div><div class="s">${esc(sp.n)} · ${plural(S.W.year - x.born, 'year')} old</div></div><div class="end"><div class="mini" title="Bond ${Math.round(x.bond)}">${bar(x.bond, 'era')}</div></div></button>`; }).join('')}</div>` : '<p class="muted" style="margin:0 2px">No pets yet.</p>'}`;
    return bulk + relView(p) + petBlock;
  };
  ui.on.bulk = el => {
    const p = S.me(), e = S.era(), act = el.dataset.a;
    let people = S.known(p).filter(S.alive);
    if (el.dataset.g === 'family') people = people.filter(o => p.rels[o.id]?.k === 'fam' || /Father|Mother|Brother|Sister|Son|Daughter|Grand|Husband|Wife/.test(S.relLabel(p, o)));
    if (act === 'party') {
      if (p.did.party) return toast('You already hosted a gathering this year.');
      const c = S.toVal(e.cost * 0.05); if (p.money < c) return toast(`A gathering costs ${S.money(c)}.`);
      p.did.party = 1; p.money -= c;
      people.forEach(o => { S.rel(p, o).c = U.clamp(S.rel(p, o).c + U.ri(2, 8)); });
      S.applyFx(p, { hp: 6, rep: 2, fm: 1 }); S.log(p, `You threw a gathering for ${people.length} people. The house was full of noise.`, 'good');
      render(); return toast('What a gathering!');
    }
    if (act === 'gift') {
      const each = S.toVal(e.cost * 0.03), tot = each * people.length;
      if (p.money < tot) return toast(`Gifts for everyone would cost ${S.money(tot)}.`);
    }
    let n = 0;
    for (const o of people) { const t = S.interact(o.id, act); if (t && !/already|cannot|gone/i.test(t)) n++; }
    S.settle(); render();
    toast(n ? `Done with ${n} ${n === 1 ? 'person' : 'people'}.` : 'Nobody new to see this year.');
  };

  ui.on.adopt = () => {
    const p = S.me(), e = S.era();
    sheet(`<h2>Adopt a pet</h2><div class="field" style="margin:10px 0"><label for="petname">Name (optional)</label><input id="petname" maxlength="20" placeholder="Random"></div>
      <div class="list">${S.petsAvail(p).map(x => `<button class="row" data-act="adoptKind" data-k="${x.id}"><span class="av sm petav" aria-hidden="true">${esc(x.n[0])}</span><div class="main"><div class="t">${esc(x.n)}</div><div class="s">Lives ${x.life[0]}–${x.life[1]} years${x.cls ? ' · a status symbol' : ''}</div></div><div class="end mono">${S.money(S.toVal(e.cost * x.cost))}</div></button>`).join('')}</div>`, { label: 'Adopt a pet' });
  };
  ui.on.adoptKind = el => { const t = S.adoptPet(el.dataset.k, $('#petname')?.value); ui.open = null; $('#modal').innerHTML = ''; render(); toast(t); };
  function petSheet(id, res) {
    const pet = S.W.pets[id], sp = S.petSpec(pet.kind), acts = [...sp.acts, 'vet', 'rehome'];
    const L = { play: 'Play', walk: 'Go for a walk', groom: 'Groom', feed: 'Give a treat', ride: 'Go riding', hunt: 'Go hawking', milk: 'Milk', teach: 'Teach words', fly: 'Fly together', upgrade: 'Install upgrades', train: 'Teach a trick', vet: 'Visit the vet', rehome: 'Find a new home' };
    sheet(`<div class="eyebrow">${esc(sp.n)} · ${plural(S.W.year - pet.born, 'year')} old</div><h2>${esc(pet.n)}</h2>
      <div class="stats"><div class="stat"><span class="k">Health</span>${bar(pet.h)}<span class="v">${Math.round(pet.h)}</span></div><div class="stat"><span class="k">Bond</span>${bar(pet.bond, 'era')}<span class="v">${Math.round(pet.bond)}</span></div></div>
      ${pet.tricks ? `<p class="lede">Knows ${plural(pet.tricks, 'trick')}.</p>` : ''}${res ? `<div class="result">${esc(res)}</div>` : ''}
      <div class="acts" style="margin-top:12px">${acts.map(a => `<button class="btn ${a === 'rehome' ? 'danger' : ''}" data-act="petAct" data-id="${id}" data-a="${a}">${L[a]}</button>`).join('')}</div>`, { label: pet.n });
  }
  ui.on.pet = el => petSheet(+el.dataset.id);
  ui.on.petAct = el => { const t = S.petAct(+el.dataset.id, el.dataset.a); ui.open = null; render(); if (el.dataset.a === 'rehome') { $('#modal').innerHTML = ''; toast(t); } else petSheet(+el.dataset.id, t); };

  Object.assign(ui, { portrait });
})();
