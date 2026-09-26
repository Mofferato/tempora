/* =====================================================================
   UI, part 4 — start screen with modes and countries, tab list, World
   (era, nations, organisations, god editor), menu with game modes.
   ===================================================================== */

(() => {
  const S = Sim, ui = UI, { $, esc, bar, plural, toast, sheet, render } = ui;
  const pct = v => `${Math.round(v * 100)}%`;
  const START_YEAR = { prehistory: -8000, ancient: -450, medieval: 1300, renaissance: 1480, colonial: 1720, industrial: 1840, wars: 1912, modern: 1950, digital: 2000, near: 2040, far: 2160 };
  const rangeOf = e => [e.from, e.id === 'far' ? 2400 : e.to];
  const MODES = [
    ['narrative', 'Narrative', 'A story told in chapters. Choices pop up as your life unfolds, and your life reads back as prose.'],
    ['household', 'Household', 'Run the whole home: plan each family member’s year and manage the shared budget.'],
    ['god', 'God', 'Everything unlocked: edit any stat, person, gene, class or year. Keeps the Narrative and Household features.'],
  ];

  /* ---------------- tabs ---------------- */
  ui.tabList = () => {
    const m = S.W?.mode;
    const t = [['life', 'Life'], ['rel', 'Relationships'], ['act', 'Activities'], ['places', 'Places'], ['job', 'Occupation'], ['assets', 'Assets']];
    if (m === 'household' || m === 'god') t.push(['home', 'Household']);
    t.push(['tree', 'Family Tree'], ['world', 'World'], ['community', 'Community']);
    return t;
  };

  /* ---------------- start screen ---------------- */
  const pick = { era: 'medieval', year: START_YEAR.medieval, cc: '', mode: 'narrative', godOn: false };
  const keepFields = () => ['f-first', 'f-last', 'f-sex', 'f-orient', 'f-cls'].map(id => [id, $('#' + id)?.value]);
  const restoreFields = k => k.forEach(([id, v]) => { if ($('#' + id) && v != null) $('#' + id).value = v; });
  ui.start = () => {
    const e = pick.era === 'random' ? null : DATA.eras.find(x => x.id === pick.era);
    ui.setEraTheme(e || DATA.eras[2]);
    $('#when').innerHTML = ''; $('#agebar').hidden = true; $('#btnGod').hidden = true;
    const auto = ui.store.get('tempora.autosave');
    const [lo, hi] = e ? rangeOf(e) : [0, 0];
    const lands = e ? DATA.countries.filter(c => pick.year >= c.from) : [];
    if (pick.cc && !lands.some(c => c.id === pick.cc)) pick.cc = '';
    $('#screen').innerHTML = `<div class="start">
      <div class="hero"><div class="eyebrow">A life simulator across twelve thousand years</div><h2>Every life is a chapter.<br>Every family, a history.</h2>
        <p>Be born in any land from the Stone Age to the stars. Live one year at a time, raise a family, and keep playing through your children, your friends, anyone you knew. The world keeps turning without you.</p></div>
      ${auto ? `<div class="panel" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><div class="eyebrow">Saved dynasty</div><div style="font-family:var(--f-display);font-size:20px">${esc(U.house(auto.dyn?.name || ''))} · ${U.fmtYearAD(auto.year)}</div></div><button class="btn era" data-act="continue">Continue</button></div>` : ''}
      <div class="sec-h"><h3>How do you want to play?</h3></div>
      <div class="modes">${MODES.map(([id, n, d]) => `<button class="modecard" data-act="pickMode" data-m="${id}" aria-pressed="${pick.mode === id}"><div class="n">${n}</div><div class="d">${esc(d)}</div></button>`).join('')}</div>
      ${pick.mode !== 'god' ? `<label class="check"><input type="checkbox" id="f-god" ${pick.godOn ? 'checked' : ''} data-input="godOn"> Also allow god tools (off by default)</label>` : ''}
      <div class="sec-h"><h3>Choose when to be born</h3></div>
      <div class="eras">${DATA.eras.map(x => `<button class="eracard" style="--c:${ui.eraCol(x)}" data-act="pickEra" data-id="${x.id}" aria-pressed="${pick.era === x.id}"><div class="n">${esc(x.name)}</div><div class="r">${U.fmtYear(x.from)}${x.to > 9000 ? '+' : `–${U.fmtYear(x.to)}`}</div></button>`).join('')}
        <button class="eracard" style="--c:var(--ink-3)" data-act="pickEra" data-id="random" aria-pressed="${pick.era === 'random'}"><div class="n">Random</div><div class="r">any year, any land</div></button></div>
      ${e ? `<div class="panel"><div class="form">
        <div class="field" style="grid-column:1/-1"><label for="yr">Birth year: <b class="mono" id="yrl">${U.fmtYearAD(pick.year)}</b></label>
        <input type="range" id="yr" min="${lo}" max="${hi}" step="1" value="${pick.year}" data-input="year"><span class="faint">${esc(e.blurb)}</span></div>
        <div class="field" style="grid-column:1/-1"><label for="f-cc">Land of birth</label><select id="f-cc" data-input="cc"><option value="">Random land</option>${lands.map(c => `<option value="${c.id}" ${pick.cc === c.id ? 'selected' : ''}>${esc(S_name(c.id, pick.year))} (${esc(c.short)})</option>`).join('')}</select></div></div></div>`
        : '<div class="panel"><p class="lede" style="margin:0">Fate will choose the era, the year and the land.</p></div>'}
      <div class="panel"><div class="form">
        <div class="field"><label for="f-first">First name</label><input id="f-first" placeholder="Random" maxlength="24" autocomplete="off"></div>
        <div class="field"><label for="f-last">Family name</label><input id="f-last" placeholder="Random" maxlength="24" autocomplete="off"></div>
        <div class="field"><label for="f-sex">Born as</label><select id="f-sex"><option value="">Random</option><option value="F">A girl</option><option value="M">A boy</option></select></div>
        <div class="field"><label for="f-orient">Attracted to</label><select id="f-orient"><option value="straight">The opposite sex</option><option value="gay">The same sex</option><option value="bi">Anyone</option></select></div>
        <div class="field"><label for="f-cls">Family fortune</label><select id="f-cls"><option value="">Random</option>${S.CLASSES.map(c => `<option value="${c.id}">${c.id[0].toUpperCase() + c.id.slice(1)}</option>`).join('')}</select></div>
      </div><button class="btn era block" style="margin-top:14px;height:48px;font-size:16px" data-act="begin">Begin a life</button></div></div>`;
  };
  // country names at an arbitrary year, before any world exists
  function S_name(cc, y) { const c = DATA.countries.find(x => x.id === cc); for (const x of c.names) if (y <= x[0]) return x[1]; return c.names[c.names.length - 1][1]; }
  ui.on.pickMode = el => { const k = keepFields(); pick.mode = el.dataset.m; ui.start(); restoreFields(k); };
  ui.input.godOn = el => { pick.godOn = el.checked; };
  ui.on.pickEra = el => { const k = keepFields(); pick.era = el.dataset.id; if (pick.era !== 'random') pick.year = START_YEAR[pick.era]; ui.start(); restoreFields(k); };
  ui.input.year = el => {
    pick.year = +el.value === 0 ? 1 : +el.value; $('#yrl').textContent = U.fmtYearAD(pick.year);
    const sel = $('#f-cc'); if (!sel) return;
    const lands = DATA.countries.filter(c => pick.year >= c.from);
    if (sel.options.length - 1 !== lands.length) { const k = keepFields(); ui.start(); restoreFields(k); }
    else [...sel.options].slice(1).forEach(o => { o.textContent = `${S_name(o.value, pick.year)} (${DATA.countries.find(c => c.id === o.value).short})`; });
  };
  ui.input.cc = el => { pick.cc = el.value; };
  ui.on.begin = () => {
    let year = pick.year, cc = pick.cc || null;
    if (pick.era === 'random') { const e = U.pick(DATA.eras), [lo, hi] = rangeOf(e); year = U.ri(lo, hi) || 1; cc = null; }
    S.newWorld({ year, cc, mode: pick.mode, godOn: pick.mode === 'god' || pick.godOn, first: $('#f-first').value, last: $('#f-last').value, sex: $('#f-sex').value || null, orient: $('#f-orient').value, cls: $('#f-cls').value || null });
    ui.tab = 'life'; $('#screen').innerHTML = ''; render(); ui.save();
  };

  /* ---------------- World: sub-tabs ---------------- */
  const eraView = ui.views.world;
  ui.views.world = p => {
    const extra = (ui.worldExtra || []).filter(x => !x.show || x.show(p));
    const tabs = [['era', 'This era'], ...extra.filter(x => x.first).map(x => [x.id, x.n]), ['nations', 'Nations'], ['orgs', 'Organisations'], ...extra.filter(x => !x.first).map(x => [x.id, x.n])];
    if (S.godAllowed()) tabs.push(['god', 'God mode']);
    if (!tabs.some(t => t[0] === ui.worldTab)) ui.worldTab = 'era';
    const head = `<div class="subtabs" role="tablist">${tabs.map(([id, n]) => `<button data-act="worldTab" data-v="${id}" aria-selected="${ui.worldTab === id}">${n}</button>`).join('')}</div>`;
    if (ui.worldTab === 'nations') return head + nationsView(p);
    if (ui.worldTab === 'orgs') return head + orgsView(p);
    if (ui.worldTab === 'god') return head + godView(p);
    const ex = extra.find(x => x.id === ui.worldTab); if (ex) return head + ex.view(p);
    const w = S.W, g = w.god; w.god = false;
    const html = eraView(p); w.god = g;
    const local = S.world.laws(p.cc);
    return head + (local.length ? `<div class="panel"><div class="eyebrow">Law in ${esc(S.world.name(p.cc))}</div><ul class="laws">${local.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>` : '') + html;
  };
  ui.on.worldTab = el => { ui.worldTab = el.dataset.v; render(); };

  /* ---------------- nations ---------------- */
  const relTag = v => v >= 50 ? '<span class="tag good">Close ally</span>' : v >= 15 ? '<span class="tag good">Friendly</span>' : v > -15 ? '<span class="tag">Neutral</span>' : v > -50 ? '<span class="tag bad">Tense</span>' : '<span class="tag bad">Hostile</span>';
  const fmtPop = m => m >= 1000 ? `${(m / 1000).toFixed(2)} billion` : m >= 1 ? `${m.toFixed(m < 10 ? 1 : 0)} million` : `${Math.round(m * 1000).toLocaleString()} thousand`;
  function nationsView(p) {
    const list = S.world.nations();
    return `<p class="lede" style="margin:2px 2px 10px">${list.length} lands you can know in ${U.fmtYearAD(S.W.year)}. Tap one to see its laws, classes and people, and to travel, move, trade or negotiate.</p>
      <div class="list">${list.map(n => `<button class="row" data-act="nation" data-cc="${n.cc}"><span class="flagchip" style="--c:${ui.eraCol(S.era())}" aria-hidden="true">${esc(n.cc)}</span>
        <div class="main"><div class="t">${esc(n.name)}${n.home ? ' <span class="tag era">home</span>' : ''}</div><div class="s">${esc(n.gov)} · ${fmtPop(n.pop)} · ${esc(n.cur.n)}${n.wars.length ? ` · <span class="why">at war</span>` : ''}</div></div>
        <div class="end">${n.home ? '' : relTag(n.rel)}</div></button>`).join('')}</div>`;
  }
  function nationSheet(cc, res) {
    const p = S.me(), n = S.world.nations().find(x => x.cc === cc);
    if (!n) return;
    const P = Gen.pop(S.W, cc), F = Gen.founding(cc);
    const rows = [
      ['Light eyes (blue, green, grey)', f => f.eb ** 2], ['Red hair', f => f.rd ** 2], ['Can digest milk as adults', f => 1 - (1 - f.lac) ** 2],
      ['Sickle cell carriers', f => 2 * f.sc * (1 - f.sc)], ['Cystic fibrosis carriers', f => 2 * f.cf * (1 - f.cf)], ['Colour-blind men', f => f.cb],
    ];
    const arrow = (a, b) => (b - a > 0.01 ? '↑' : a - b > 0.01 ? '↓' : '→');
    const office = S.world.inOffice(p), cost = S.world.tripCost(p, cc), e = S.era();
    sheet(`<div class="eyebrow">${esc(n.c.short)} · ${esc(n.gov)}</div><h2>${esc(n.name)}</h2>
      <div class="facts"><div class="fact"><div class="eyebrow">Capital</div><div class="v sm">${esc(n.cap)}</div></div><div class="fact"><div class="eyebrow">People</div><div class="v sm">${fmtPop(n.pop)}</div></div>
        <div class="fact"><div class="eyebrow">Money</div><div class="v sm">${esc(n.cur.n)}</div></div><div class="fact"><div class="eyebrow">Stability</div><div class="v sm">${n.stab}</div></div>${n.ruler ? `<div class="fact"><div class="eyebrow">Ruler</div><div class="v sm">${esc(n.ruler)}</div></div>` : ''}</div>
      ${n.home ? '' : `<p class="lede" style="margin-top:10px">Relations with ${esc(S.world.name(p.cc))}: ${relTag(n.rel)} <span class="mono">${n.rel}</span></p>`}
      ${n.wars.length ? `<p class="lede"><span class="tag bad">At war</span> ${n.wars.map(esc).join(', ')}</p>` : ''}
      ${res ? `<div class="result">${esc(res)}</div>` : ''}
      ${n.home ? '' : `<div class="acts" style="margin-top:12px">
        <button class="btn era" data-act="natAct" data-cc="${cc}" data-a="travel">Travel there (${S.money(cost)})</button>
        <button class="btn" data-act="natAct" data-cc="${cc}" data-a="emigrate">Emigrate with your family (${S.money(cost * 3)})</button>
        <button class="btn" data-act="natAct" data-cc="${cc}" data-a="emigrateAlone">Emigrate alone</button>
        <button class="btn" data-act="natAct" data-cc="${cc}" data-a="invest">Invest ${S.money(S.toVal(e.cost * 0.2))} there</button>
        ${office ? `<button class="btn" data-act="natAct" data-cc="${cc}" data-a="embassy">Send an embassy</button><button class="btn" data-act="natAct" data-cc="${cc}" data-a="aid">Send aid (${S.money(S.toVal(e.cost * 0.5))})</button><button class="btn danger" data-act="natAct" data-cc="${cc}" data-a="denounce">Denounce them publicly</button>` : '<p class="faint" style="font-size:12px;margin:4px 0 0">Hold high office (a lord, senator, governor, official or party leader) to conduct diplomacy.</p>'}</div>`}
      <div class="eyebrow" style="margin-top:14px">Law and custom</div><ul class="laws">${[...S.world.laws(cc)].map(l => `<li>${esc(l)}</li>`).join('') || '<li>Custom rules more than written law.</li>'}</ul>
      <div class="eyebrow" style="margin-top:14px">Social classes</div><p class="lede" style="margin:4px 0 0">${S.ladder(cc).map(esc).join(' → ')}</p>
      <div class="eyebrow" style="margin-top:14px">Population genetics</div>
      <table class="gtab"><thead><tr><th>Trait</th><th>At founding</th><th>Now</th><th></th></tr></thead><tbody>${rows.map(([t, f]) => `<tr><td>${t}</td><td class="mono">${pct(f(F))}</td><td class="mono">${pct(f(P))}</td><td>${arrow(f(F), f(P))}</td></tr>`).join('')}</tbody></table>
      <p class="faint" style="font-size:12px">Allele frequencies drift, adapt and mix as the centuries pass: milk-drinking lands favour lactase persistence, malaria keeps sickle cell common, migration blends peoples.</p>`, { label: n.name });
  }
  ui.on.nation = el => nationSheet(el.dataset.cc);
  ui.on.natAct = el => {
    const cc = el.dataset.cc, a = el.dataset.a, W = S.world;
    const t = a === 'travel' ? W.travel(cc) : a === 'emigrate' ? W.emigrate(cc, true) : a === 'emigrateAlone' ? W.emigrate(cc, false) : a === 'invest' ? W.invest(cc, 0.2) : W.diplomacy(cc, a);
    S.settle(); ui.open = null; render();
    if (S.W.dead) return;
    nationSheet(cc, t);
  };

  /* ---------------- organisations ---------------- */
  function orgsView(p) {
    const mine = p.orgs || [], avail = S.orgsAvail(p);
    const row = o => { const m = mine.find(x => x.id === o.id), why = S.orgWhy(p, o); return `<button class="row" data-act="org" data-id="${o.id}"><div class="main"><div class="t">${esc(o.n[0].toUpperCase() + o.n.slice(1))}</div>
      <div class="s">${esc(o.k)}${o.fee ? ` · dues ${S.money(S.toVal(S.era().cost * o.fee))}/yr` : ''}${m ? ` · <b>${esc(o.ranks[m.rank])}</b>` : why.length ? ` · <span class="why">needs ${esc(why.join(', '))}</span>` : ''}</div></div>${m ? '<span class="tag era">member</span>' : ''}</button>`; };
    return `<p class="lede" style="margin:2px 2px 10px">Guilds, orders, companies, parties and societies of ${esc(S.world.name(p.cc))} in ${U.fmtYearAD(S.W.year)}. Members pay dues and gain standing, friends and perks.</p>
      ${avail.length ? `<div class="list">${avail.map(row).join('')}</div>` : '<p class="muted">No organisations you could join here and now.</p>'}`;
  }
  function orgSheet(id, res) {
    const p = S.me(), o = DATA.orgs.find(x => x.id === id), m = (p.orgs || []).find(x => x.id === id), why = S.orgWhy(p, o);
    const perks = Object.entries(o.perk).map(([k, v]) => k === '$' ? 'income' : DATA.stats.find(s => s.k === k)?.n.toLowerCase()).join(', ');
    sheet(`<div class="eyebrow">${esc(o.k)}</div><h2>${esc(o.n[0].toUpperCase() + o.n.slice(1))}</h2>
      <p class="lede">Ranks: ${o.ranks.map((r, i) => m && i === m.rank ? `<b>${esc(r)}</b>` : esc(r)).join(' → ')}. Membership brings ${esc(perks)}${o.risk ? ', and some danger' : ''}.</p>
      ${res ? `<div class="result">${esc(res)}</div>` : ''}
      <div class="acts" style="margin-top:12px">${m ? ['attend', 'donate', 'rise', 'leave'].map(a => `<button class="btn ${a === 'leave' ? 'danger' : a === 'attend' ? 'era' : ''}" data-act="orgAct" data-id="${id}" data-a="${a}">${{ attend: 'Take part this year', donate: `Donate ${S.money(S.toVal(S.era().cost * 0.1))}`, rise: 'Seek a higher rank', leave: 'Leave' }[a]}</button>`).join('')
        : `<button class="btn era" data-act="orgAct" data-id="${id}" data-a="join" ${why.length ? 'disabled' : ''}>Join</button>${why.length ? `<p class="why">Needs ${esc(why.join(', '))}.</p>` : ''}`}</div>`, { label: o.n });
  }
  ui.on.org = el => orgSheet(el.dataset.id);
  ui.on.orgAct = el => { const t = S.orgAct(el.dataset.id, el.dataset.a); ui.open = null; render(); orgSheet(el.dataset.id, t); };

  /* ---------------- god mode editor ---------------- */
  const HAIR = [['black', '#1E1714'], ['dark brown', '#3F2A1C'], ['brown', '#5E3F28'], ['light brown', '#8A6040'], ['dark blonde', '#B08A4E'], ['blonde', '#D6B56E'], ['platinum blonde', '#E9D9A6'], ['red', '#A5431F'], ['auburn', '#7A3520'], ['grey', '#A9A6A0'], ['white', '#E8E6E1']];
  function godView(p) {
    const target = S.P(ui.godTarget) || p, isMe = target.id === p.id, e = S.era();
    const people = [p, ...S.known(p)].slice(0, 120);
    const ph = S.pheno(target), o = target.phx || {};
    const sel = (id, opts, cur) => `<select id="${id}" data-input="gLook" data-k="${id.slice(3)}"><option value="">From genes</option>${opts.map(([v, n]) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
    return `<div class="panel god"><div class="eyebrow">God mode · editing</div>
      <div class="field" style="margin-top:6px"><select id="g-target" data-input="gTarget">${people.map(x => `<option value="${x.id}" ${x.id === target.id ? 'selected' : ''}>${esc(S.fullName(x))} · ${x.id === p.id ? 'you' : esc(S.relLabel(p, x))}${S.alive(x) ? '' : ' †'}</option>`).join('')}</select></div>
      <div class="grid">${DATA.stats.map(s => `<label for="g-${s.k}">${s.n} <span class="mono" id="gv-${s.k}">${Math.round(target[s.k] ?? 0)}</span><input id="g-${s.k}" type="range" min="0" max="100" value="${Math.round(target[s.k] ?? 0)}" data-input="gStat" data-k="${s.k}"></label>`).join('')}
        ${!isMe ? `<label for="g-close">Closeness to you <span class="mono" id="gv-close">${Math.round(p.rels[target.id]?.c ?? 0)}</span><input id="g-close" type="range" min="0" max="100" value="${Math.round(p.rels[target.id]?.c ?? 50)}" data-input="gClose"></label>` : ''}
        <label for="g-money">Money (${esc(S.curNow(target.cc).n)})<span style="display:flex;gap:6px"><input id="g-money" type="number" value="${Math.round(target.money / S.curNow(target.cc).r)}"><button class="btn sm" data-act="gMoney">Set</button></span></label>
        <label for="g-cls">Social class<select id="g-cls" data-input="gCls">${S.ladder(target.cc).map((n, i) => `<option value="${i}" ${i === target.cls ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <label for="g-cc">Country<select id="g-cc" data-input="gCC">${S.world.countriesAt().map(c => `<option value="${c.id}" ${c.id === target.cc ? 'selected' : ''}>${esc(S.world.name(c.id))}</option>`).join('')}</select></label>
        <label for="g-title">Title<span style="display:flex;gap:6px"><input id="g-title" value="${esc(target.title || '')}" placeholder="None"><button class="btn sm" data-act="gTitle">Set</button></span></label></div>
      <div class="eyebrow" style="margin-top:14px">Appearance${ph ? ` · now ${esc(ph.skin.n)} skin, ${esc(ph.hair.n)} hair, ${esc(ph.eyes.n)} eyes, ${ph.height} cm` : ''}</div>
      <div class="grid">
        <label for="gl-skin">Skin tone${sel('gl-skin', Gen.SKIN.map((s, i) => [i, s[0]]), o.skin)}</label>
        <label for="gl-hair">Hair colour${sel('gl-hair', HAIR.map(h => [h.join('|'), h[0]]), o.hair ? o.hair.join('|') : '')}</label>
        <label for="gl-curl">Hair type${sel('gl-curl', [[0, 'straight'], [1, 'wavy'], [3, 'curly'], [4, 'coily']], o.curl)}</label>
        <label for="gl-eyes">Eyes${sel('gl-eyes', Object.keys(Gen.EYES).map(k => [k, k]), o.eyes)}</label>
        <label for="gl-height">Adult height (cm)<input id="gl-height" type="number" min="120" max="230" value="${o.height ?? ''}" placeholder="From genes" data-input="gLook" data-k="height"></label></div>
      <div class="btnrow" style="margin-top:12px">
        ${S.alive(target) ? `<button class="btn sm" data-act="gHeal">Heal completely</button>${!isMe ? '<button class="btn sm danger" data-act="gKill">Strike down</button>' : ''}` : '<button class="btn sm" data-act="gRevive">Raise from the dead</button>'}
        <button class="btn sm" data-act="gEdu">Grant full education</button><button class="btn sm" data-act="gFree">Release from prison</button>
        ${!isMe && S.alive(target) ? `<button class="btn sm" data-act="become" data-id="${target.id}">Become them</button>` : ''}</div></div>
    <div class="panel god"><div class="eyebrow">Create people</div><div class="btnrow" style="margin-top:8px">${['friend', 'lover', 'rival', 'child', 'sibling'].map(k => `<button class="btn sm" data-act="gSpawn" data-k="${k}">New ${k}</button>`).join('')}</div>
      <div class="eyebrow" style="margin-top:14px">Time</div><div class="btnrow" style="margin-top:8px">${[1, 5, 10, 25, 50, 100].map(n => `<button class="btn sm" data-act="godJump" data-n="${n}">+${n} years</button>`).join('')}</div>
      <div class="grid">
        <label for="god-hist">Historical event<select id="god-hist">${DATA.history.map((h, i) => `<option value="${i}">${U.fmtYear(h.y)} · ${esc(h.t.slice(0, 64))}${h.where ? ` (${h.where.join(', ')})` : ''}</option>`).join('')}</select><button class="btn sm" data-act="godHist">Unleash it now</button></label>
        <label for="god-ev">Life event<select id="god-ev">${S.eventPool().map(ev => `<option value="${ev.id}">${esc((Array.isArray(ev.t) ? ev.t[0] : ev.t).slice(0, 64))}</option>`).join('')}</select><button class="btn sm" data-act="godEv">Make it happen</button></label></div></div>`;
  }
  const tgt = () => S.P(ui.godTarget) || S.me();
  const reG = t => { render(); if (t) toast(t); };
  ui.on.godEdit = el => { ui.godTarget = +el.dataset.id; ui.tab = 'world'; ui.worldTab = 'god'; ui.open = null; $('#modal').innerHTML = ''; reG(); };
  ui.input.gTarget = el => { ui.godTarget = +el.value; reG(); };
  ui.input.gStat = el => { S.god.stat(tgt().id, el.dataset.k, el.value); $(`#gv-${el.dataset.k}`).textContent = el.value; if (tgt().id === S.me().id) $('#card').innerHTML = ui.cardHTML(S.me()); };
  ui.input.gClose = el => { S.god.closeness(tgt().id, el.value); $('#gv-close').textContent = el.value; };
  ui.input.gCls = el => { S.god.cls(tgt().id, el.value); reG('Class changed.'); };
  ui.input.gCC = el => { S.god.country(tgt().id, el.value); reG('Moved.'); };
  ui.input.gLook = el => {
    const k = el.dataset.k, v = el.value;
    const val = v === '' ? '' : k === 'hair' ? v.split('|') : k === 'eyes' ? v : +v;
    S.god.look(tgt().id, k, val);
    if (k === 'height' && v !== '' && v.length < 3) return;
    reG();
  };
  ui.on.gMoney = () => { S.god.money(tgt().id, +$('#g-money').value || 0); reG('Money set.'); };
  ui.on.gTitle = () => { S.god.title(tgt().id, $('#g-title').value.trim()); reG('Title set.'); };
  ui.on.gHeal = () => { const t = tgt(); t.h = 100; t.sick = []; reG('Fully healed.'); };
  ui.on.gKill = () => { S.god.kill(tgt().id); reG('It is done.'); };
  ui.on.gRevive = () => { S.god.revive(tgt().id); reG('They live again.'); };
  ui.on.gEdu = () => { const t = tgt(); t.edu = 4; t.school = null; reG('A lifetime of learning, instantly.'); };
  ui.on.gFree = () => { tgt().prison = 0; reG('The cell door swings open.'); };
  ui.on.gSpawn = el => { const o = S.god.spawn(el.dataset.k); reG(o ? `${S.fullName(o)} now exists.` : 'Nobody to attach them to.'); };
  ui.on.god = () => {
    if (!S.W) return;
    if (!S.godAllowed()) return toast('God tools are off. Turn them on in Menu → Game mode.');
    ui.tab = 'world'; ui.worldTab = 'god'; render();
  };

  /* ---------------- menu ---------------- */
  const slotMenu = ui.on.menu;
  ui.on.menu = () => {
    slotMenu();
    const w = S.W; if (!w) return;
    const box = $('#modal .sheet h2');
    box.insertAdjacentHTML('afterend', `<div class="eyebrow" style="margin-top:14px">Game mode</div>
      <div class="modes compact">${MODES.map(([id, n, d]) => `<button class="modecard" data-act="setMode" data-m="${id}" aria-pressed="${w.mode === id}"><div class="n">${n}</div><div class="d">${esc(d)}</div></button>`).join('')}</div>
      ${w.mode !== 'god' ? `<label class="check"><input type="checkbox" data-input="godOnLive" ${w.godOn ? 'checked' : ''}> Allow god tools in ${w.mode} mode</label>` : ''}
      <div class="btnrow" style="margin-top:12px"><button class="btn" data-act="auto">Auto-play…</button><button class="btn" data-act="fusion">Reality fusion…</button><button class="btn" data-act="goCommunity">Community</button></div>`);
  };
  ui.on.setMode = el => { S.W.mode = el.dataset.m; if (S.W.mode === 'god') S.W.godOn = true; ui.open = null; $('#modal').innerHTML = ''; render(); ui.save(); toast(`${el.dataset.m[0].toUpperCase() + el.dataset.m.slice(1)} mode.`); };
  ui.input.godOnLive = el => { S.W.godOn = el.checked; render(); ui.save(); };
  ui.on.goCommunity = () => { ui.open = null; $('#modal').innerHTML = ''; ui.tab = 'community'; render(); };
})();
