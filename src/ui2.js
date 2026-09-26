/* =====================================================================
   UI, part 2 — Occupation, Assets, World (+ sandbox), start screen,
   death & inheritance, menu, saves.
   ===================================================================== */

(() => {
  const S = Sim, ui = UI, { $, esc, bar, plural, toast, sheet, render } = ui;
  const KEY = 'tempora.autosave', SLOT = n => `tempora.slot${n}`;
  const KIND = { home: 'Home', land: 'Land & income', stock: 'Investment', vehicle: 'Transport', animal: 'Livestock', luxury: 'Luxury', tech: 'Technology' };
  const START_YEAR = { prehistory: -8000, ancient: -450, medieval: 1300, renaissance: 1480, colonial: 1720, industrial: 1840, wars: 1912, modern: 1950, digital: 2000, near: 2040, far: 2160 };
  const rangeOf = e => [e.from, e.id === 'far' ? 2400 : e.to];
  const pct = v => `${Math.round(v * 100)}%`;

  /* ---------------- storage (wrapped: storage may be unavailable) ---------------- */
  const store = {
    get(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
  ui.store = store;
  ui.save = () => { if (S.W) store.set(KEY, S.serialize()); };
  const meta = w => { const p = w.people[w.playerId]; return `${U.house(w.dyn.name)} · ${U.fmtYearAD(w.year)} · ${p ? `${p.first} ${p.last}` : ''}`; };

  /* ---------------- Occupation ---------------- */
  ui.views.job = p => {
    const e = S.era(), a = S.age(p);
    let edu;
    if (p.school) {
      edu = `<p class="lede">Now attending <b>${esc(e.edu.n[p.school.lvl])}</b> · ${plural(p.school.left, 'year')} to go${p.school.cost ? ` · ${S.money(p.school.cost)} a year` : ''}.</p>
        <button class="btn sm" data-act="dropout">Drop out</button>`;
    } else {
      const opts = S.eduOptions(p);
      edu = opts.length ? `<div class="list">${opts.map(o => `<div class="row"><div class="main"><div class="t">${esc(o.n)}</div>
          <div class="s">${plural(o.yrs, 'year')} · ${o.cost ? `${S.money(o.cost)} a year` : 'free'}${o.why.length ? ` · <span class="why">${esc(o.why.join(', '))}</span>` : ''}</div></div>
          <button class="btn sm ${o.why.length ? '' : 'era'}" data-act="enroll" data-lvl="${o.lvl}" ${o.why.length ? 'disabled' : ''}>Enrol</button></div>`).join('')}</div>`
        : '<p class="lede">You have gone as far as schooling goes in this age.</p>';
    }
    const j = p.job, min = e.life.retire ? e.life.retire - 10 : 50;
    const canRetire = a >= min && !p.retired;
    const job = j ? `<div class="panel"><div class="eyebrow">Occupation</div><h3>${j.rank ? S.rankName(j.rank) + ' ' : ''}${esc(j.t)}</h3>
        <p class="lede">${S.money(j.pay * S.rankPay(j))} a year before tax${j.vol ? ' (varies)' : ''} · ${plural(j.yrs, 'year')} in the job${j.era !== e.id ? ' · a trade from an older age' : ''}</p>
        <div class="stat"><span class="k">Performance</span>${bar(j.perf)}<span class="v">${Math.round(j.perf)}</span></div>
        <div class="btnrow" style="margin-top:12px"><button class="btn sm era" data-act="workHard">Work harder</button><button class="btn sm" data-act="promo">Ask for promotion</button>
        ${canRetire ? '<button class="btn sm" data-act="retire">Retire</button>' : ''}<button class="btn sm danger" data-act="quit">Quit</button></div></div>`
      : `<div class="panel"><div class="eyebrow">Occupation</div><h3>${p.prison ? 'In prison' : a < S.workAge(e) ? 'Too young to work' : p.retired ? 'Retired' : 'Out of work'}</h3>
        <p class="lede">${a < S.workAge(e) ? `Work begins at ${S.workAge(e)} in this era.` : p.retired ? (e.life.retire ? 'You draw a pension each year.' : 'You live on your savings and your family.') : e.laws.ubi && a >= 18 ? `Universal basic income pays you ${S.money(S.toVal(e.laws.ubi))} a year.` : 'Pick a trade below. Better schooling opens better work.'}</p>
        ${canRetire && !p.retired && a >= S.workAge(e) ? '<button class="btn sm" data-act="retire">Retire</button>' : ''}</div>`;
    const L = S.jobListings(p);
    const rows = L.map(({ j: x, why, pay, cur }) => `<div class="row ${why.length && !cur ? 'off' : ''}"><div class="main"><div class="t">${esc((p.sex === 'F' && x.tf) || x.t)}${x.grant ? ` <span class="faint">· grants “${x.grant}”</span>` : ''}</div>
        <div class="s"><span class="mono">${S.money(pay)}</span>/yr${x.risk >= 0.03 ? ' · dangerous' : ''}${x.vol >= 0.5 ? ' · unpredictable pay' : ''}${x.fame >= 2 ? ' · brings fame' : ''}${why.length ? ` · <span class="why">needs ${esc(why.join(', '))}</span>` : ''}</div></div>
        ${cur ? '<span class="tag era">Current</span>' : `<button class="btn sm" data-act="apply" data-id="${x.id}" ${why.length ? 'disabled' : ''}>Apply</button>${ui.pinBtn ? ui.pinBtn('apply', { id: x.id }, `Apply to be a ${((p.sex === 'F' && x.tf) || x.t).toLowerCase()}`) : ''}`}</div>`).join('');
    return `<div class="panel"><div class="eyebrow">Education</div><h3>${esc(e.edu.n[p.edu])}</h3>${edu}</div>
      ${job}<div class="sec-h"><h3>Work in ${U.fmtYearAD(S.W.year)}</h3><span class="faint">${L.filter(x => !x.why.length).length} open to you</span></div><div class="list">${rows}</div>`;
  };
  ui.on.enroll = el => { toast(S.doEnroll(+el.dataset.lvl)); render(); };
  ui.on.dropout = () => { toast(S.dropOut()); render(); };
  ui.on.apply = el => { toast(S.apply(el.dataset.id).t); render(); };
  ui.on.workHard = () => { toast(S.workHard()); render(); };
  ui.on.promo = () => { toast(S.askPromotion()); render(); };
  ui.on.quit = () => { toast(S.quitJob()); render(); };
  ui.on.retire = () => { toast(S.retire()); render(); };

  /* ---------------- Assets ---------------- */
  ui.views.assets = p => {
    const m = S.market(), a = S.age(p);
    const owned = p.assets.map(x => `<div class="row"><div class="main"><div class="t">${esc(x.t)}</div>
        <div class="s">${KIND[x.kind] || x.kind} · bought ${U.fmtYearAD(x.y)}${x.inc ? ` · earns ${pct(x.inc)} a year` : ''}</div></div>
        <div class="end"><div class="mono">${S.money(x.val)}</div></div><button class="btn sm" data-act="sell" data-id="${x.uid}">Sell</button></div>`).join('');
    const shop = m.map(({ a: x, price }) => `<div class="row"><div class="main"><div class="t">${esc(x.t)}</div>
        <div class="s">${KIND[x.kind] || x.kind}${x.inc ? ` · earns ${pct(x.inc)}/yr` : ''}${x.appr > 0 ? ' · tends to gain value' : x.appr < 0 ? ' · loses value' : ''}${x.vol ? ' · volatile' : ''}</div></div>
        <div class="end"><div class="mono">${S.money(price)}</div></div><button class="btn sm" data-act="buy" data-id="${x.id}" ${p.money < price || a < 16 ? 'disabled' : ''}>Buy</button>${ui.pinBtn ? ui.pinBtn('buy', { id: x.id }, `Buy a ${x.t.toLowerCase()}`) : ''}</div>`).join('');
    return `<div class="panel"><div class="eyebrow">Your estate</div><div class="facts">
        <div class="fact"><div class="eyebrow">Cash</div><div class="v">${S.money(p.money)}</div></div>
        <div class="fact"><div class="eyebrow">Property</div><div class="v">${S.money(S.assetsVal(p))}</div></div>
        <div class="fact"><div class="eyebrow">Net worth</div><div class="v">${S.money(S.netWorth(p))}</div></div></div>
        <p class="lede" style="margin-top:10px">Owning a home cuts your living costs by a quarter. Everything you own passes to your heir.</p></div>
      <div class="sec-h"><h3>Owned</h3><span class="faint">${p.assets.length}</span></div>${owned ? `<div class="list">${owned}</div>` : '<p class="muted">Nothing yet.</p>'}
      <div class="sec-h"><h3>For sale in ${U.fmtYearAD(S.W.year)}</h3>${a < 16 ? '<span class="why">You can buy from 16</span>' : ''}</div><div class="list">${shop}</div>`;
  };
  ui.on.buy = el => { toast(S.buy(el.dataset.id)); render(); };
  ui.on.sell = el => { toast(S.sell(+el.dataset.id)); render(); };

  /* ---------------- World ---------------- */
  ui.views.world = p => {
    const w = S.W, e = S.era(), L = e.life, med = S.medicine();
    const cm = L.child * (1 - med * 0.5);
    const le = Math.round(L.adult * (1 - cm) * 0.9 + 3 * cm);
    const wars = S.activeWars();
    const laws = [...e.laws.list, `Minimum marriage age: ${e.laws.marry}`, e.laws.divorce ? 'Divorce is permitted' : 'Divorce is not permitted', S.sameSexOK(e) ? 'Same-sex marriage is legal' : 'Same-sex marriage is not recognised'];
    const lives = w.dyn.lives.slice().reverse();
    const now = S.me();
    const chron = w.news.slice().reverse().slice(0, 120);
    return `<div class="panel"><div class="eyebrow">The ${esc(e.name)} era · ${U.fmtYear(e.from)}${e.to > 9000 ? ' onward' : `–${U.fmtYear(e.to)}`}</div>
        <h3>${esc(e.blurb)}</h3>
        <div class="facts">
          <div class="fact"><div class="eyebrow">Currency</div><div class="v">${esc(e.cur.s)} ${esc(e.cur.n)}</div></div>
          <div class="fact"><div class="eyebrow">Life expectancy</div><div class="v">~${le} yrs</div></div>
          <div class="fact"><div class="eyebrow">Die before 5</div><div class="v">${pct(cm)}</div></div>
          <div class="fact"><div class="eyebrow">Medicine</div><div class="v">${pct(med)}</div></div>
          <div class="fact"><div class="eyebrow">Cost of living</div><div class="v">${S.money(S.toVal(e.cost))}/yr</div></div>
          <div class="fact"><div class="eyebrow">Tax</div><div class="v">${pct(L.tax)}</div></div>
        </div>
        ${wars.length ? `<p class="lede" style="margin-top:12px"><span class="tag bad">At war</span> ${wars.map(h => esc(h.n)).join(', ')}</p>` : ''}
        <div class="eyebrow" style="margin-top:14px">Laws & customs</div><ul class="laws">${laws.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>

      <div class="panel"><div class="eyebrow">Dynasty</div><h3>${esc(U.house(w.dyn.name))}</h3>
        <div class="facts"><div class="fact"><div class="eyebrow">Dynasty score</div><div class="v">${U.fmtNum(w.dyn.score + S.lifeScore(now))}</div></div>
          <div class="fact"><div class="eyebrow">Lives played</div><div class="v">${w.dyn.played.length}</div></div>
          <div class="fact"><div class="eyebrow">Years recorded</div><div class="v">${U.span(w.started, w.year)}</div></div></div>
        <div class="list" style="margin-top:12px"><button class="row" data-act="person" data-id="${now.id}">${ui.av(now, 'sm')}<div class="main"><div class="t">${esc(S.fullName(now))}</div><div class="s">Living · ${esc(S.eraOf(now.born).name)} · age ${S.age(now)}</div></div><div class="end mono">${U.fmtNum(S.lifeScore(now))}</div></button>
        ${lives.map(l => { const q = S.P(l.id); return `<button class="row" data-act="person" data-id="${l.id}" ${q ? '' : 'disabled'}>${q ? ui.av(q, 'sm') : ''}<div class="main"><div class="t">${esc(l.name)}</div><div class="s">${U.fmtYear(l.born)}–${U.fmtYear(l.died)} · ${esc(l.era)} · ${esc(l.cause)} · ${esc(l.netTxt)}</div></div><div class="end mono">${U.fmtNum(l.score)}</div></button>`; }).join('')}</div>
        ${w.dyn.houses.length > 1 ? `<p class="faint" style="font-size:13px;margin:10px 0 0">Houses: ${w.dyn.houses.map(h => `${esc(h.name)} (${U.fmtYear(h.y)})`).join(' → ')}</p>` : ''}</div>

      ${w.god ? godPanel(p) : ''}

      <div class="panel"><div class="eyebrow">Chronicle of the world</div>
        <div class="chron" style="margin-top:6px">${chron.map(n => `<div class="c ${n.type === 'era' ? 'era' : ''}"><span class="y">${U.fmtYearAD(n.y)}</span><span class="t">${esc(n.t)}${n.y > 2026 && n.type !== 'era' ? '<span class="proj">projected</span>' : ''}</span></div>`).join('') || '<p class="muted">History has not yet happened to you.</p>'}</div></div>`;
  };

  /* ---------------- sandbox / god mode ---------------- */
  function godPanel(p) {
    const e = S.era();
    const hist = DATA.history.map((h, i) => `<option value="${i}">${U.fmtYear(h.y)} · ${esc(h.t.slice(0, 70))}</option>`).join('');
    const evs = S.eventPool().map(ev => `<option value="${ev.id}">${esc((Array.isArray(ev.t) ? ev.t[0] : ev.t).slice(0, 70))}</option>`).join('');
    const st = [['h', 'Health'], ['hp', 'Happiness'], ['sm', 'Smarts'], ['lk', 'Looks'], ['rep', 'Reputation']];
    return `<div class="panel god"><div class="eyebrow">Sandbox</div><h3>God mode</h3>
      <div class="grid">${st.map(([k, n]) => `<label for="god-${k}">${n} <span class="mono" id="godv-${k}">${Math.round(p[k])}</span><input id="god-${k}" type="range" min="0" max="100" value="${Math.round(p[k])}" data-input="godStat" data-k="${k}"></label>`).join('')}
        <label for="god-money">Money (${esc(e.cur.n)})<span style="display:flex;gap:6px"><input id="god-money" type="number" value="${Math.round(S.cash(p))}"><button class="btn sm" data-act="godMoney">Set</button></span></label></div>
      <div class="eyebrow" style="margin-top:14px">Jump ahead</div>
      <div class="btnrow" style="margin-top:6px">${[5, 10, 25, 50, 100].map(n => `<button class="btn sm" data-act="godJump" data-n="${n}">+${n} years</button>`).join('')}</div>
      <div class="grid">
        <label for="god-hist">Historical event<select id="god-hist">${hist}</select><button class="btn sm" data-act="godHist">Unleash it now</button></label>
        <label for="god-ev">Life event<select id="god-ev">${evs}</select><button class="btn sm" data-act="godEv">Make it happen</button></label></div>
      <div class="btnrow" style="margin-top:12px"><button class="btn sm" data-act="godHeal">Heal completely</button><button class="btn sm" data-act="godFree">Release from prison</button><button class="btn sm" data-act="godEdu">Grant full education</button></div></div>`;
  }
  ui.input = ui.input || {};
  ui.input.godStat = el => { const p = S.me(); p[el.dataset.k] = +el.value; $(`#godv-${el.dataset.k}`).textContent = el.value; $('#card').innerHTML = ui.cardHTML(p); };
  ui.on.godMoney = () => { const p = S.me(); p.money = S.toVal(+$('#god-money').value || 0); render(); toast('Money set.'); };
  ui.on.godJump = el => { const n = +el.dataset.n; S.jump(n); render(); ui.save(); toast(S.W.dead ? 'The years ran out before the jump did.' : `${n} years pass in a blink.`); };
  ui.on.godHist = () => { S.forceHistory(+$('#god-hist').value); render(); toast('History bends to your will.'); };
  ui.on.godEv = () => { S.forceEvent($('#god-ev').value); ui.tab = 'life'; render(); };
  ui.on.godHeal = () => { const p = S.me(); p.h = 100; p.sick = []; render(); toast('Fully healed.'); };
  ui.on.godFree = () => { S.me().prison = 0; render(); toast('The cell door swings open.'); };
  ui.on.godEdu = () => { const p = S.me(); p.edu = 4; p.school = null; render(); toast('A lifetime of learning, instantly.'); };
  ui.on.god = () => { if (!S.W) return; S.W.god = !S.W.god; if (S.W.god) ui.tab = 'world'; render(); toast(S.W.god ? 'God mode on. Look in the World tab.' : 'God mode off.'); };

  /* ---------------- start screen ---------------- */
  const pick = { era: 'medieval', year: START_YEAR.medieval };
  ui.start = () => {
    const e = pick.era === 'random' ? null : DATA.eras.find(x => x.id === pick.era);
    ui.setEraTheme(e || DATA.eras[2]);
    $('#when').innerHTML = ''; $('#agebar').hidden = true; $('#btnGod').hidden = true;
    const auto = store.get(KEY);
    const [lo, hi] = e ? rangeOf(e) : [0, 0];
    $('#screen').innerHTML = `<div class="start">
      <div class="hero"><div class="eyebrow">A life simulator across twelve thousand years</div><h2>Every life is a chapter.<br>Every family, a history.</h2>
        <p>Be born in any age from the Stone Age to the stars. Live one year at a time, raise a family, and keep playing through your children, your friends, anyone you knew. The world keeps turning without you.</p></div>
      ${auto ? `<div class="panel" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:200px"><div class="eyebrow">Saved dynasty</div><div style="font-family:var(--f-display);font-size:20px">${esc(meta(auto))}</div></div><button class="btn era" data-act="continue">Continue</button></div>` : ''}
      <div class="sec-h"><h3>Choose when to be born</h3></div>
      <div class="eras">${DATA.eras.map(x => `<button class="eracard" style="--c:${ui.eraCol(x)}" data-act="pickEra" data-id="${x.id}" aria-pressed="${pick.era === x.id}"><div class="n">${esc(x.name)}</div><div class="r">${U.fmtYear(x.from)}${x.to > 9000 ? '+' : `–${U.fmtYear(x.to)}`}</div></button>`).join('')}
        <button class="eracard" style="--c:var(--ink-3)" data-act="pickEra" data-id="random" aria-pressed="${pick.era === 'random'}"><div class="n">Random</div><div class="r">any year</div></button></div>
      ${e ? `<div class="panel"><div class="field"><label for="yr">Birth year: <b class="mono" id="yrl">${U.fmtYearAD(pick.year)}</b></label>
        <input type="range" id="yr" min="${lo}" max="${hi}" step="1" value="${pick.year}" data-input="year"><span class="faint">${esc(e.blurb)}</span></div></div>` : '<div class="panel"><p class="lede" style="margin:0">Fate will choose the era and the year.</p></div>'}
      <div class="panel"><div class="form">
        <div class="field"><label for="f-first">First name</label><input id="f-first" placeholder="Random" maxlength="24" autocomplete="off"></div>
        <div class="field"><label for="f-last">Family name</label><input id="f-last" placeholder="Random" maxlength="24" autocomplete="off"></div>
        <div class="field"><label for="f-sex">Born as</label><select id="f-sex"><option value="">Random</option><option value="F">A girl</option><option value="M">A boy</option></select></div>
        <div class="field"><label for="f-orient">Attracted to</label><select id="f-orient"><option value="straight">The opposite sex</option><option value="gay">The same sex</option><option value="bi">Anyone</option></select></div>
        <div class="field"><label for="f-cls">Family fortune</label><select id="f-cls"><option value="">Random</option>${S.CLASSES.map(c => `<option value="${c.id}">${c.id[0].toUpperCase() + c.id.slice(1)}</option>`).join('')}</select></div>
      </div><button class="btn era block" style="margin-top:14px;height:48px;font-size:16px" data-act="begin">Begin a life</button></div></div>`;
  };
  ui.on.pickEra = el => {
    pick.era = el.dataset.id;
    if (pick.era !== 'random') pick.year = START_YEAR[pick.era];
    const keep = ['f-first', 'f-last', 'f-sex', 'f-orient', 'f-cls'].map(id => [id, $('#' + id)?.value]);
    ui.start();
    keep.forEach(([id, v]) => { if ($('#' + id) && v != null) $('#' + id).value = v; });
  };
  ui.input.year = el => { pick.year = +el.value === 0 ? 1 : +el.value; $('#yrl').textContent = U.fmtYearAD(pick.year); };
  ui.on.begin = () => {
    let year = pick.year;
    if (pick.era === 'random') { const e = U.pick(DATA.eras), [lo, hi] = rangeOf(e); year = U.ri(lo, hi) || 1; }
    S.newWorld({ year, first: $('#f-first').value, last: $('#f-last').value, sex: $('#f-sex').value || null, orient: $('#f-orient').value, cls: $('#f-cls').value || null });
    ui.tab = 'life'; $('#screen').innerHTML = ''; render(); ui.save();
  };
  ui.on.continue = () => { try { S.load(store.get(KEY)); ui.tab = 'life'; $('#screen').innerHTML = ''; render(); } catch (err) { toast(err.message); } };

  /* ---------------- death & inheritance ---------------- */
  ui.death = () => {
    const w = S.W, d = w.dead, p = S.P(d.id), heirs = S.heirs(p).slice(0, 40);
    const ach = DATA.achievements.filter(a => d.ach.includes(a.id));
    sheet(`<div class="epitaph"><div class="dag">†</div><h2>${esc(d.name)}</h2><div class="dates">${U.fmtYearAD(d.born)} – ${U.fmtYearAD(d.died)}</div>
        <div class="cause">Died of ${esc(d.cause)} at the age of ${d.age}, in the ${esc(d.era)} era.</div></div>
      <dl class="kv"><dt>Occupation</dt><dd>${esc(d.job || 'None')}</dd><dt>Net worth</dt><dd>${esc(d.netTxt)}</dd><dt>Children</dt><dd>${d.kids}</dd>
        <dt>Life score</dt><dd>${U.fmtNum(d.score)}</dd><dt>Dynasty score</dt><dd>${U.fmtNum(w.dyn.score)} over ${plural(w.dyn.lives.length, 'life')}</dd></dl>
      ${ach.length ? `<div class="tags" style="margin-bottom:14px">${ach.map(a => `<span class="tag good" title="${esc(a.d)}">${esc(a.n)}</span>`).join('')}</div>` : ''}
      ${heirs.length ? `<div class="eyebrow">Continue the story as</div><p class="faint" style="font-size:13px;margin:4px 0 10px">${esc(typeof Legacy !== 'undefined' ? (p.will ? 'Your will decides how the money and heirlooms are shared; your chosen heir takes the rest and any title.' : `${Legacy.LAWTXT[Legacy.lawOf(p.cc)]}. Your chosen heir takes any title.`) : 'Your chosen heir receives half your money, all your property and any title.')}</p>
        <div class="list">${heirs.map(({ o, rel }) => `<button class="row" data-act="heir" data-id="${o.id}">${ui.av(o, 'sm')}<div class="main"><div class="t">${esc(S.fullName(o))}</div><div class="s">${esc(rel)} · age ${S.age(o)}${o.job ? ' · ' + esc(o.job.t) : ''}</div></div></button>`).join('')}</div>`
        : `<div class="result">No one you knew is still alive. Your line has ended.</div>`}
      <div class="btnrow" style="margin-top:14px"><button class="btn sm" data-act="newHouse">Begin a new house in this world</button><button class="btn sm" data-act="newGame">Start over</button></div>`, { locked: true, label: 'Death' });
  };
  ui.on.heir = el => { S.continueAs(+el.dataset.id); ui.open = null; $('#modal').innerHTML = ''; ui.tab = 'life'; render(); ui.save(); };
  ui.on.newHouse = () => { S.newHouse({}); ui.open = null; $('#modal').innerHTML = ''; ui.tab = 'life'; render(); ui.save(); };
  ui.on.newGame = () => { ui.open = null; $('#modal').innerHTML = ''; S.W = null; S.prompts.length = 0; render(); };

  /* ---------------- menu, saves, export / import ---------------- */
  ui.on.menu = () => {
    const w = S.W, slots = [1, 2, 3].map(n => ({ n, s: store.get(SLOT(n)) }));
    sheet(`<h2>Menu</h2>
      ${w ? `<div class="eyebrow" style="margin-top:14px">Save this dynasty</div><div class="acts" style="margin-top:6px">${slots.map(({ n, s }) => `<button class="btn" data-act="saveSlot" data-n="${n}">Slot ${n}${s ? ` · <span class="faint">${esc(meta(s))}</span>` : ' · empty'}</button>`).join('')}</div>` : ''}
      <div class="eyebrow" style="margin-top:14px">Load</div><div class="acts" style="margin-top:6px">${slots.map(({ n, s }) => `<button class="btn" data-act="loadSlot" data-n="${n}" ${s ? '' : 'disabled'}>Slot ${n}${s ? ` · <span class="faint">${esc(meta(s))}</span>` : ' · empty'}</button>`).join('')}</div>
      <div class="eyebrow" style="margin-top:14px">Files</div><div class="btnrow" style="margin-top:6px">${w ? '<button class="btn" data-act="export">Export save</button>' : ''}<button class="btn" data-act="import">Import save</button></div>
      <p class="faint" style="font-size:12px;margin:10px 0 0">Tempora autosaves in this browser each year. Browser storage can be cleared, so export a file to keep a dynasty safe.</p>
      <div class="btnrow" style="margin-top:16px"><button class="btn danger" data-act="askNew">New game</button></div>`, { label: 'Menu' });
  };
  ui.on.saveSlot = el => { const ok = store.set(SLOT(el.dataset.n), S.serialize()); toast(ok ? `Saved to slot ${el.dataset.n}.` : 'Browser storage is unavailable. Use Export instead.'); ui.on.menu(); };
  ui.on.loadSlot = el => { try { S.load(store.get(SLOT(el.dataset.n))); ui.open = null; $('#modal').innerHTML = ''; ui.tab = 'life'; $('#screen').innerHTML = ''; render(); ui.save(); toast('Loaded.'); } catch (err) { toast(err.message); } };
  ui.on.export = () => {
    const json = S.serialize();
    sheet(`<h2>Export save</h2><p class="lede">Copy this text, or download it as a file. Import it later from the menu.</p>
      <textarea id="exp" rows="8" readonly style="font:12px var(--f-mono)">${esc(json)}</textarea>
      <div class="btnrow" style="margin-top:10px"><button class="btn era" data-act="copyExp">Copy</button>${window.TEMPORA_HOSTED ? '' : '<button class="btn" data-act="dlExp">Download .json</button>'}</div>`, { label: 'Export' });
  };
  ui.on.copyExp = () => {
    const ta = $('#exp');
    const done = () => toast('Copied.');
    const fallback = () => { ta.select(); try { document.execCommand('copy'); done(); } catch { toast('Select the text and copy it.'); } };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(ta.value).then(done, fallback); else fallback();
  };
  ui.on.dlExp = () => {
    try {
      const b = new Blob([S.serialize()], { type: 'application/json' }), a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = `tempora-${U.slug(S.W.dyn.name)}-${S.W.year}.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch { toast('Download blocked here. Use Copy instead.'); }
  };
  ui.on.import = () => {
    sheet(`<h2>Import save</h2><p class="lede">Choose a .json file, or paste the save text.</p>
      <input type="file" id="impf" accept=".json,application/json" data-input="impFile">
      <textarea id="imp" rows="6" placeholder="Paste save text here" style="margin-top:10px;font:12px var(--f-mono)"></textarea>
      <button class="btn era block" style="margin-top:10px" data-act="doImport">Import</button>`, { label: 'Import' });
  };
  ui.input.impFile = el => { const f = el.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#imp').value = r.result; }; r.readAsText(f); };
  ui.on.doImport = () => {
    try { S.load(JSON.parse($('#imp').value)); ui.open = null; $('#modal').innerHTML = ''; ui.tab = 'life'; $('#screen').innerHTML = ''; render(); ui.save(); toast('Save imported.'); }
    catch (err) { toast(err instanceof SyntaxError ? 'That is not valid save text.' : err.message); }
  };
  ui.on.askNew = () => sheet(`<h2>Start a new game?</h2><div class="body">Your current dynasty stays in its save slots and exports. The autosave will be replaced once you begin a new life.</div>
      <div class="acts"><button class="btn era" data-act="newGame">Choose a new birth</button><button class="btn" data-act="close">Keep playing</button></div>`);
})();
