/* =====================================================================
   THE LIFE DOCK: your life log, docked above the Age button, so you can
   follow your story from any tab without leaving it. It updates as you
   act. The book button next to Age opens and closes it, and the game
   remembers your choice. On the Life tab itself it steps aside.
   ===================================================================== */

(() => {
  const S = Sim, ui = UI, { $, esc, toast } = ui;
  const KEY = 'tempora.dock', YEARS = 6;
  let open = !!ui.store.get(KEY), lastYear = null, lastN = null, lastPid = null;

  function draw() {
    const dock = $('#lifedock'), btn = $('#lifeBtn'); if (!dock || !btn) return;
    const p = S.W && S.me();
    btn.setAttribute('aria-pressed', String(open));
    const show = !!(open && p && ui.tab !== 'life');
    dock.hidden = !show; document.body.classList.toggle('docked', show);
    if (!show) return;
    // keep the reader's place within a year; a new year (or a new life) starts at the top
    const same = S.W.year === lastYear && p.id === lastPid;
    const keep = same ? dock.querySelector('.dockbody')?.scrollTop || 0 : 0;
    lastYear = S.W.year; lastPid = p.id;
    dock.innerHTML = `<div class="wrap"><div class="dockbox">
      <div class="dockhead"><span class="eyebrow">Your life · ${esc(U.fmtYearAD(S.W.year))} · age ${S.age(p)}</span><span class="grow"></span>
        <button class="linkbtn" data-act="tab" data-tab="life">Open the Life tab</button><button class="iconbtn x" data-act="lifeDock" aria-label="Hide the life log">✕</button></div>
      <div class="dockbody">${ui.logYears(p, YEARS)}</div></div></div>`;
    const body = dock.querySelector('.dockbody'); body.scrollTop = keep;
    // new lines since last time: highlight them, and bring the newest into view
    const n = p.log.length, fresh = same && lastN != null && n > lastN ? n - lastN : 0; lastN = n;
    const now = [...body.querySelectorAll('.logyr.now li')];
    if (fresh && now.length) {
      now.slice(-fresh).forEach(li => li.classList.add('fresh'));
      const li = now[now.length - 1], over = li.offsetTop + li.offsetHeight - body.clientHeight + 10;
      if (over > body.scrollTop) body.scrollTop = over;
    }
  }
  ui.on.lifeDock = () => {
    open = !open; ui.store.set(KEY, JSON.stringify(open)); draw();
    if (ui.tab === 'life') toast(open ? 'Your life log will follow you to the other tabs.' : 'Your life log will stay on the Life tab.');
  };
  (ui.afterRender ||= []).push(draw);
})();
