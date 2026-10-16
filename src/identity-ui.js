/* =====================================================================
   IDENTITY — screens: the heritage options on the start screen, the name
   chooser, and the Identity tab (ancestry, citizenship, and the sections
   other modules add: faith, culture, marriage).
   Other modules add a section with ui.identitySections.push({ id, order, html(p) }).
   ===================================================================== */

LATE.push(() => {
  const S = Sim, ui = UI, I = Identity, A = Atlas, { $, esc, toast, render, sheet } = ui;
  ui.identitySections = ui.identitySections || [];
  ui.extraTabs = ui.extraTabs || [];

  /* ---------- start screen ---------- */
  ui.heritagePanel = (pick, lands) => {
    if (pick.era === 'random') return '';
    const cc = pick.cc, groups = cc ? A.ethnic(cc, pick.year) : [];
    const opt = (v, n, cur) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(n)}</option>`;
    const others = lands.filter(c => c.id !== cc && c.at).sort((a, b) => a.short.localeCompare(b.short));
    return `<details class="panel heritage" ${pick.anc || pick.origin ? 'open' : ''}><summary><b>Heritage</b> <span class="faint">ancestry, mixed families, parents from abroad</span></summary><div class="form" style="margin-top:12px">
      <div class="field"><label for="f-anc">Your people</label><select id="f-anc" data-input="anc"><option value="">Typical for the land</option>${groups.map(g => opt(g.n, `${g.n}${g.s < 0.995 ? ` (${Math.round(g.s * 100)}%)` : ''}`, pick.anc)).join('')}</select>
        ${cc ? '' : '<span class="faint">Choose a land of birth to pick a people.</span>'}</div>
      <div class="field"><label for="f-anc2">Mixed with (a parent from another people)</label><select id="f-anc2" data-input="anc2" ${pick.anc ? '' : 'disabled'}><option value="">Not mixed</option>${groups.filter(g => g.n !== pick.anc).map(g => opt(g.n, g.n, pick.anc2)).join('')}</select></div>
      <div class="field"><label for="f-origin">Parents who came from abroad</label><select id="f-origin" data-input="origin"><option value="">Everyone is from here</option>${others.map(c => opt(c.id, `${S_name(c.id, pick.year)}`, pick.origin)).join('')}</select></div>
      <div class="field"><label for="f-oside">Which parent</label><select id="f-oside" data-input="oside" ${pick.origin ? '' : 'disabled'}>${opt('both', 'Both parents', pick.oside)}${opt('M', 'Your father only', pick.oside)}${opt('F', 'Your mother only', pick.oside)}</select></div>
      <p class="faint" style="grid-column:1/-1;margin:0">Children inherit half of each parent’s ancestry and genes, and take every nationality their parents’ countries pass down. Some countries make you choose one at eighteen.</p></div></details>`;
  };
  const S_name = (cc, y) => { const c = DATA.countries.find(x => x.id === cc); for (const x of c.names) if (y <= x[0]) return x[1]; return c.names[c.names.length - 1][1]; };
  ui.heritageOpts = (pick, cc) => {
    const o = {};
    if (pick.anc) { o.anc = pick.anc; if (pick.anc2) o.anc2 = pick.anc2; }
    if (pick.origin && pick.origin !== cc) { o.origin = pick.origin; o.originSide = pick.oside || 'both'; if (o.originSide !== 'F') o.surnameCC = pick.origin; }
    return o;
  };
  for (const [k, f] of [['anc', 'anc'], ['anc2', 'anc2'], ['origin', 'origin'], ['oside', 'oside']]) ui.input[k] = el => { ui.pick[f] = el.value; if (k === 'anc' && !el.value) ui.pick.anc2 = ''; const kf = ui.keepFields(); ui.start(); ui.restoreFields(kf); };

  /* ---------- name chooser ---------- */
  ui.nameChips = pick => {
    const cc = pick.cc;
    const chips = pick.sugg && pick.sugg.cc === cc && pick.sugg.year === pick.year ? pick.sugg : null;
    return `<div class="namekit"><div class="row-actions"><button class="btn sm" data-act="nameSuggest">Suggest names${cc ? '' : ' (pick a land)'}</button>${chips ? `<span class="faint">tap one to use it</span>` : ''}</div>
      ${chips ? `<div class="chips">${chips.first.map(n => `<button class="chip" data-act="nameUse" data-f="first" data-n="${esc(n)}">${esc(n)}</button>`).join('')}<span class="sep">·</span>${chips.last.map(n => `<button class="chip" data-act="nameUse" data-f="last" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}</div>`;
  };
  ui.on.nameSuggest = () => {
    const pick = ui.pick, cc = pick.cc;
    if (!cc) return toast('Choose a land of birth first, then suggestions come from its names.');
    const sex = $('#f-sex')?.value || U.pick(['M', 'F']);
    pick.sugg = { cc, year: pick.year, first: I.suggest(sex, cc, pick.year, 6), last: I.surnames(cc, pick.year, 4) };
    const k = ui.keepFields(); ui.start(); ui.restoreFields(k);
  };
  ui.on.nameUse = el => { const f = $(el.dataset.f === 'last' ? '#f-last' : '#f-first'); if (f) f.value = el.dataset.n; };

  /* ---------- the Identity tab ---------- */
  const COLS = ['#c9953a', '#3a8aa8', '#a85a8a', '#5a9a5a', '#c0603a', '#6a6ac0', '#8a8a3a'];
  const bar = e => `<div class="ethbar" role="img" aria-label="${esc(I.ethText({ eth: e }))}">${e.map((x, i) => `<i style="width:${x.s * 100}%;background:${COLS[i % COLS.length]}" title="${esc(x.n)} ${Math.round(x.s * 100)}%"></i>`).join('')}</div>
    <div class="ethkey">${e.map((x, i) => `<span><b style="background:${COLS[i % COLS.length]}"></b>${esc(x.n)} ${Math.round(x.s * 100)}%</span>`).join('')}</div>`;
  const chip = cc => `<span class="flagchip" aria-hidden="true">${esc(cc)}</span>`;
  const premodern = () => S.W.year < 1750;
  const natLabel = () => (premodern() ? 'Allegiance' : 'Citizenship');

  function ancestrySection(p) {
    const e = I.eth(p), par = S.parents(p);
    const lines = [];
    for (const q of par) lines.push(`<li>${esc(q.first)} (${esc(S.relLabel(p, q).toLowerCase())}): ${esc(I.ethText(q))}</li>`);
    return `<div class="panel"><div class="eyebrow">Ancestry</div><h3 style="margin:2px 0 8px">${esc(I.ethText(p))}</h3>${bar(e)}${lines.length ? `<ul class="plain">${lines.join('')}</ul>` : ''}
      <p class="faint" style="margin:8px 0 0">${e.length > 1 ? 'You carry the genes and the stories of more than one people.' : 'Your people have lived here a long time.'}</p></div>`;
  }
  function citizenshipSection(p) {
    const nats = I.natsOf(p), claims = I.descentClaims(p), here = p.cc;
    const rows = nats.map(n => {
      const r = I.rules(n);
      return `<div class="row"><div class="main"><div class="t">${chip(n)} ${esc(A.C(n)?.adj || I.name(n))}${n === here ? ' <span class="tag era">lives here</span>' : ''}</div><div class="s">${r.dual === 'n' ? 'Does not allow dual nationality' : r.dual === 'l' ? 'Allows two nationalities' : 'Allows dual nationality'} · ${r.cit === 'soli' ? 'by birth on its soil' : r.cit === 'sang' ? 'by descent' : 'by birth and descent'}</div></div>
        <div class="end">${nats.length > 1 ? `<button class="btn sm" data-act="idRenounce" data-cc="${n}">Renounce</button>` : ''}</div></div>`;
    }).join('');
    const opts = [];
    if (!I.isCitizen(p, here)) { const c = I.canApply(p, here); opts.push(`<div class="row"><div class="main"><div class="t">${chip(here)} Become ${esc(A.C(here)?.adj || I.name(here))}</div><div class="s">${c.ok ? `Apply by ${c.route} (${Math.round(c.odds * 100)}% chance, fee ${esc(S.money(S.toVal(S.era().cost * c.cost)))})` : esc(c.why)}</div></div><div class="end"><button class="btn sm era" data-act="idApply" data-cc="${here}" ${c.ok ? '' : 'disabled'}>Apply</button></div></div>`); }
    for (const n of claims) if (n !== here) { const c = I.canApply(p, n); opts.push(`<div class="row"><div class="main"><div class="t">${chip(n)} Claim ${esc(A.C(n)?.adj || I.name(n))} nationality</div><div class="s">${c.ok ? `Through your ancestors (${Math.round(c.odds * 100)}% chance)` : esc(c.why)}</div></div><div class="end"><button class="btn sm era" data-act="idApply" data-cc="${n}" ${c.ok ? '' : 'disabled'}>Claim</button></div></div>`); }
    const conflictNote = I.conflict(nats) ? `<p class="why" style="margin:8px 0 0">One of these countries does not allow dual nationality; you will have to choose at eighteen.</p>` : '';
    return `<div class="panel"><div class="eyebrow">${natLabel()}</div><div class="list">${rows}${opts.join('')}</div>${conflictNote}
      <p class="faint" style="margin:8px 0 0">${I.resYears(p)} year${I.resYears(p) === 1 ? '' : 's'} living in ${esc(I.name(here))}.</p></div>`;
  }
  ui.identitySections.push({ id: 'ancestry', order: 10, html: ancestrySection }, { id: 'citizen', order: 20, html: citizenshipSection });
  ui.views.identity = p => `<div class="idgrid">${[...ui.identitySections].sort((a, b) => a.order - b.order).map(s => { try { return s.html(p) || ''; } catch (err) { console.error(err); return ''; } }).join('')}</div>`;
  ui.extraTabs.push({ id: 'identity', n: 'Identity', order: 5 });
  ui.on.idApply = el => { const t = I.apply(el.dataset.cc); S.settle?.(); render(); toast(t); ui.save?.(); };
  ui.on.idRenounce = el => { const t = I.renounce(el.dataset.cc); render(); toast(t); ui.save?.(); };
});
