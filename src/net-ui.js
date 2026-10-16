/* =====================================================================
   NET — the Web tab (from 1991).
   ===================================================================== */

LATE.push(() => {
  const S = Sim, ui = UI, A = Atlas, N = Net, { $, esc, toast, render } = ui;
  const pct = v => `${Math.round(v * 100)}%`;
  const FREE = ['Free and open', 'Lightly filtered', 'Heavily filtered', 'Closely watched and censored'];

  function view(p) {
    const era = N.era(), lvl = N.access(p), s = N.state(p), cc = p.cc, pen = N.pen(cc);
    const cz = N.censorship(cc);
    const head = `<div class="panel"><div class="eyebrow">${esc(era ? era[2] : 'Offline')}</div><h3 style="margin:2px 0 6px">${esc(N.levelText(lvl))}</h3>
      <div class="faint">${esc(S.world.name(cc))}: ${pct(pen)} of people are online · ${esc(FREE[cz])}${N.platform ? ` · popular: ${esc(N.platform(cc))}` : ''}</div>
      <div class="bar era" style="margin-top:8px"><i style="width:${pen * 100}%"></i></div>
      ${lvl === 0 ? `<p class="faint" style="margin:10px 0 0">You have no way online yet. ${S.age(p) < 5 ? 'You are too young.' : 'It may come with time, work, schooling or the spread of the network.'}</p>` : ''}</div>`;
    if (!lvl) return head;
    const hrs = N.HRS.map(([n], i) => `<button class="chip" data-act="netHrs" data-v="${i}" aria-pressed="${s.hrs === i}">${n}</button>`).join('');
    const acts = N.available(p).map(a => `<div class="prow"><button class="row ${a.why ? 'off' : ''}" data-act="netDo" data-id="${a.id}" ${a.why ? 'disabled' : ''}><div class="main"><div class="t">${esc(a.n)}</div></div><div class="end">${a.why ? `<span class="why">${esc(a.why)}</span>` : ''}</div></button></div>`).join('');
    const ph = p.phone;
    return head + `<div class="panel"><div class="eyebrow">Time online</div><div class="chips">${hrs}</div><p class="faint" style="margin:8px 0 0">${esc(N.HRS[s.hrs][1])}</p></div>
      <div class="sec-h"><h3>Do something</h3></div><div class="list">${acts}</div>
      <div class="panel" style="margin-top:12px"><div class="eyebrow">Your online life</div>
        <div class="kvs"><div class="kv"><b>Reputation</b><span>${Math.round(s.rep)}/100</span></div><div class="kv"><b>Security</b><span>${Math.round(s.sec)}/100</span></div>
        ${ph && ph.followers ? `<div class="kv"><b>Followers</b><span>${ph.followers.toLocaleString()}</span></div>` : ''}
        ${s.income ? `<div class="kv"><b>Earned online</b><span>${esc(S.money(s.income))}</span></div>` : ''}
        ${s.comms.length ? `<div class="kv"><b>Communities</b><span>${s.comms.map(esc).join(' · ')}</span></div>` : ''}</div></div>`;
  }
  ui.views.web = view;
  ui.extraTabs.push({ id: 'web', n: 'Web', order: 6, show: p => S.W.year >= 1991 });
  ui.on.netDo = el => { const t = N.act(el.dataset.id); S.settle?.(); render(); toast(t); ui.save?.(); };
  ui.on.netHrs = el => { const t = N.setHours(S.me(), +el.dataset.v); render(); toast(t); };
});
