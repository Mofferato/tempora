/* =====================================================================
   SANDBOX — tools for the newer systems: faith, nationality, ancestry,
   the story director, and the board of nations (alliances, wars, ties).
   ===================================================================== */

LATE.push(() => {
  const S = Sim, ui = UI, A = Atlas, { $, esc, toast, render } = ui;
  const tgt = () => S.P(ui.sandboxTarget) || S.me();
  const lands = () => S.world.countriesAt().filter(c => c.region !== 'space' || S.W.year > 2100);
  const opt = (v, n, cur) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(n)}</option>`;
  ui.sandboxMore = p => {
    const t = tgt(), id = Faith.get(t), nats = Identity.natsOf(t), groups = A.ethnic(t.cc, S.W.year), L = lands();
    return `<div class="panel sandbox"><div class="eyebrow">Identity · ${esc(S.fullName(t))}</div>
      <div class="grid">
        <label for="sb-faith">Faith<select id="sb-faith" data-input="sbFaith">${Object.values(DATA.atlas.faiths).filter(f => f.from <= S.W.year).map(f => opt(f.id, f.n, id)).join('')}</select></label>
        <label for="sb-piety">Piety <span class="mono" id="sbv-piety">${Math.round(t.piety ?? 40)}</span><input id="sb-piety" type="range" min="0" max="100" value="${Math.round(t.piety ?? 40)}" data-input="sbPiety"></label>
        <label for="sb-anc">Ancestry<select id="sb-anc" data-input="sbAnc"><option value="">${esc(Identity.ethText(t))}</option>${groups.map(g => opt(g.n, `All ${g.n.replace(/\s*\(.*\)/, '')}`, '')).join('')}</select></label>
        <label for="sb-nat">Add a nationality<select id="sb-nat" data-input="sbNat"><option value="">Choose…</option>${L.filter(c => !nats.includes(c.id)).map(c => opt(c.id, S.world.name(c.id), '')).join('')}</select></label></div>
      <div class="chips" style="margin-top:8px">${nats.map(n => `<button class="chip" data-act="sbNatDrop" data-cc="${n}" title="Remove">${esc(A.C(n)?.adj || n)} ✕</button>`).join('')}</div></div>
    <div class="panel sandbox"><div class="eyebrow">The world</div>
      <div class="grid">
        <label for="sb-a">Land A<select id="sb-a">${L.map(c => opt(c.id, S.world.name(c.id), p.cc)).join('')}</select></label>
        <label for="sb-b">Land B<select id="sb-b">${L.map((c, i) => opt(c.id, S.world.name(c.id), L[1]?.id)).join('')}</select></label></div>
      <div class="btnrow" style="margin-top:8px"><button class="btn sm" data-act="sbGeo" data-k="ally">Ally them</button><button class="btn sm" data-act="sbGeo" data-k="unally">Break the alliance</button><button class="btn sm" data-act="sbGeo" data-k="war">Declare war</button><button class="btn sm" data-act="sbGeo" data-k="peace">Make peace</button><button class="btn sm" data-act="sbGeo" data-k="warm">Warm relations</button><button class="btn sm" data-act="sbGeo" data-k="chill">Chill relations</button></div>
      <div class="eyebrow" style="margin-top:14px">Story director</div>
      <div class="field" style="margin-top:6px"><label for="sb-ev">Make an improvised event happen<select id="sb-ev">${Director.T.map(x => opt(x.id, x.id.replace(/-/g, ' '), '')).join('')}</select></label></div>
      <div class="btnrow" style="margin-top:8px"><button class="btn sm" data-act="sbForce">Make it happen</button><button class="btn sm" data-act="sbGoal">Offer me a goal</button></div></div>`;
  };
  ui.input.sbFaith = el => { const t = tgt(); t.faith = el.value; t.piety = t.piety ?? 50; render(); };
  ui.input.sbPiety = el => { tgt().piety = +el.value; $('#sbv-piety').textContent = el.value; };
  ui.input.sbAnc = el => { if (!el.value) return; const t = tgt(), g = A.ethnic(t.cc, S.W.year).find(x => x.n === el.value); if (!g) return; t.eth = [{ n: g.n, k: g.k, s: 1 }]; t.g = Identity.genomeFor(t.eth, t.cc, t.born, t.sex); render(); toast('Ancestry changed.'); };
  ui.input.sbNat = el => { if (!el.value) return; const t = tgt(); Identity.natsOf(t).push(el.value); render(); toast('Nationality added.'); };
  ui.on.sbNatDrop = el => { const t = tgt(); if (Identity.natsOf(t).length > 1) { t.nats = t.nats.filter(n => n !== el.dataset.cc); render(); } else toast('They would be stateless.'); };
  ui.on.sbGeo = el => {
    const a = $('#sb-a').value, b = $('#sb-b').value, k = el.dataset.k; if (a === b) return toast('Choose two different lands.');
    let t = '';
    if (k === 'ally') { Geo.ally(a, b); t = 'Allied.'; } else if (k === 'unally') { Geo.unally(a, b, 'is ended'); t = 'Alliance ended.'; }
    else if (k === 'war') { if (Pol.atWar(a, b)) t = 'They are already at war.'; else { Pol.declare(a, b); t = 'War declared.'; } }
    else if (k === 'peace') { const w = Pol.warsNow().find(h => h.dyn && h.where.includes(a) && h.where.includes(b)); if (w) { Pol.endWar(w, null); t = 'Peace made.'; } else t = 'No war between them.'; }
    else { S.world.addRel(a, b, k === 'warm' ? 25 : -25); t = k === 'warm' ? 'Relations warmed.' : 'Relations cooled.'; }
    S.settle?.(); render(); toast(t);
  };
  ui.on.sbForce = () => { const ok = Director.force(S.me(), $('#sb-ev').value); S.settle?.(); render(); toast(ok ? 'It happens.' : 'That event does not fit this life right now.'); };
  ui.on.sbGoal = () => { Director.propose(S.me()); render(); };
});
