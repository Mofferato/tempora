/* =====================================================================
   DIRECTOR — screens: goals on the Life tab, topics to talk about on
   every person's page, and the story director's settings.
   ===================================================================== */

LATE.push(() => {
  const S = Sim, ui = UI, D = Director, { $, esc, toast, render, sheet } = ui;
  ui.lifeCards = ui.lifeCards || [];

  function goalsCard(p) {
    if (S.age(p) < 8) return '';
    const qs = D.questView(p), st = D.state();
    const row = q => `<div class="goal"><div class="gt"><b>${esc(q.title)}</b><span class="faint">by ${esc(U.fmtYearAD(q.by))}</span></div><div class="bar era"><i style="width:${Math.round(q.progress * 100)}%"></i></div><div class="faint">${esc(q.text)}</div></div>`;
    return `<div class="panel goals"><div class="eyebrow" style="display:flex;justify-content:space-between;align-items:center"><span>Goals</span><span><button class="linkbtn" data-act="dirNew">New goal</button> · <button class="linkbtn" data-act="dirSettings">Story director</button></span></div>
      ${qs.map(row).join('') || '<p class="faint" style="margin:6px 0 0">No goals yet. Set one to give the years a direction, or let life surprise you.</p>'}</div>`;
  }
  ui.lifeCards.push(goalsCard);
  const baseLife = ui.views.life;
  ui.views.life = p => (ui.lifeView === 'story' ? '' : ui.lifeCards.map(f => { try { return f(p); } catch (e) { console.error(e); return ''; } }).join('')) + baseLife(p);

  ui.on.dirNew = () => {
    const p = S.me(); const opts = D.offerQuests(p);
    if (!opts.length) return toast('Nothing new calls to you at the moment.');
    D.propose(p); render();
  };

  /* ---------- talking ---------- */
  const pExtra = ui.personExtra;
  ui.personExtra = (p, o) => (pExtra ? pExtra(p, o) : '') + (o.id !== p.id && S.alive(o) && S.age(o) >= 4 && S.age(p) >= 4
    ? `<div class="eyebrow" style="margin-top:12px">Talk about…</div><div class="chips">${D.TOPICS.map(([k, n]) => `<button class="chip" data-act="dirTalk" data-id="${o.id}" data-t="${k}">${esc(n)}</button>`).join('')}</div>` : '');
  ui.on.dirTalk = el => {
    const p = S.me(), o = S.P(+el.dataset.id); if (!o) return;
    const r = D.reply(p, o, el.dataset.t);
    ui.chatLog = [{ r: 'you', t: D.TOPICS.find(t => t[0] === el.dataset.t)[1] }, { r: 'them', t: r.line, g: r.gain }];
    sheet(`<div class="who">${ui.av(o, 'lg')}<div class="meta"><div class="eyebrow">${esc(S.relLabel(p, o))}</div><h2>${esc(S.fullName(o))}</h2><div class="sub">Closeness ${Math.round(S.rel(p, o).c)}${r.gain > 0 ? ` <span class="good">+${r.gain}</span>` : r.gain < 0 ? ` <span class="why">${r.gain}</span>` : ''}</div></div></div>
      <div class="chatlog"><p class="user">${esc(ui.chatLog[0].t)}</p><p class="assistant">${esc(r.line)}</p></div>
      <div class="chips" style="margin-top:10px">${D.TOPICS.map(([k, n]) => `<button class="chip" data-act="dirTalk" data-id="${o.id}" data-t="${k}">${esc(n)}</button>`).join('')}</div>`, { label: 'Conversation' });
    ui.save?.();
  };

  /* ---------- the story director ---------- */
  ui.on.dirSettings = async () => {
    const how = await AI.backend().catch(() => null), s = AI.settings(), st = D.state();
    const on = how && !s.directorOff && (how !== 'key' || s.director);
    sheet(`<div class="eyebrow">Story director</div><h2>Keeping every year interesting</h2>
      <p class="lede">The director watches how eventful your years have been. In quiet stretches it brings in a turn of events built from your own life: your work, people, land and faith. It also sets goals and runs longer storylines that remember what you chose.</p>
      <p>${how ? (on ? `<b>Claude is writing events for you</b>, in addition to the director’s own (${st.ai} so far).` : 'Claude is connected, but its event writing is off.') : 'Claude is not connected, so the director improvises on its own, which works fine.'}</p>
      ${how ? `<label class="check"><input type="checkbox" data-input="dirAI" ${on ? 'checked' : ''}> Let Claude write extra events${how === 'key' ? ' (uses your API key and costs a little each year)' : ''}</label>` : ''}
      <div class="acts" style="margin-top:12px"><button class="btn" data-act="close">Done</button></div>`, { label: 'Story director' });
  };
  ui.input.dirAI = async el => { const how = await AI.backend().catch(() => null), s = AI.settings(); AI.saveSettings({ ...s, directorOff: !el.checked, director: el.checked }); };
  (ui.onAged ||= []).push(() => { try { D.requestAI(S.me()); } catch (e) { console.error(e); } });
});
