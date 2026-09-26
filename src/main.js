/* =====================================================================
   BOOT — event wiring, theme, the Age button, autosave.
   Modules extend the loop through:
     ui.around    [{before(el), after(el, ctx)}] around every click
     ui.beforeAge [fn] before each year, ui.onAged [fn] after it
   ===================================================================== */

(() => {
  const S = Sim, ui = UI, { $ } = ui;
  const root = document.documentElement;
  const THEME = 'tempora.theme';

  const savedTheme = ui.store.get(THEME);
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

  function toggleTheme() {
    const next = ui.isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    ui.store.set(THEME, JSON.stringify(next));
    ui.render();
  }
  const each = (list, ...a) => { for (const f of list || []) { try { f(...a); } catch (err) { console.error(err); } } };

  function ageUp() {
    if (!S.W || S.W.dead || ui.open) return;
    each(ui.beforeAge);
    S.ageUp();
    const auto = S.W.auto || {};
    if (typeof Auto !== 'undefined' && !S.W.dead) { Auto.apply(S.me()); if (auto.choices && auto.choices !== 'ask') Auto.resolveAll(auto.choices); }
    ui.render();
    ui.save();
    each(ui.onAged);
    if (ui.tab === 'life') {
      const v = $('#view');
      if (v && v.getBoundingClientRect().top < 0) v.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const f = ui.on[el.dataset.act];
    if (!f) return;
    const arr = ui.around || [], ctx = arr.map(h => { try { return h.before ? h.before(el) : null; } catch { return null; } });
    f(el, e);
    arr.forEach((h, i) => { try { if (h.after) h.after(el, ctx[i]); } catch (err) { console.error(err); } });
  });
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-input]');
    if (el && ui.input[el.dataset.input]) ui.input[el.dataset.input](el, e);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && ui.open && !ui.open.locked) ui.closeSheet();
    // Space or Enter on the page (not in a field) ages you up
    if ((e.key === ' ' || e.key === 'Enter') && !ui.open && S.W && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement?.tagName || '') && e.target === document.body) { e.preventDefault(); ageUp(); }
  });
  $('#ageBtn').addEventListener('click', ageUp);
  ui.age = ageUp;
  $('#btnTheme').addEventListener('click', toggleTheme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => ui.render());

  // Pick up where the last session left off
  const saved = ui.store.get('tempora.autosave');
  if (saved) { try { S.load(saved); } catch { S.W = null; } }
  ui.render();
  Promise.resolve(typeof Platform !== 'undefined' ? Platform.init() : null).then(() => { if (typeof Community !== 'undefined') Community.init(); });
  if (ui.sound) ui.sound.init();
})();
