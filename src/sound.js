/* =====================================================================
   SOUND — generated music for each era and small sound effects, all
   synthesised with the Web Audio API (no audio files). Music starts on
   your first click (browsers block sound before that) and follows the
   era; effects mark ageing up, good and bad news, money, achievements,
   births and deaths. Settings live in this browser.
   ===================================================================== */

(() => {
  const S = Sim, ui = UI, { esc, sheet, toast } = ui;
  const KEY = 'tempora.sound';
  const cfg = Object.assign({ music: true, sfx: true, mv: 0.3, sv: 0.55 }, ui.store.get(KEY) || {});
  const save = () => ui.store.set(KEY, JSON.stringify(cfg));
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  let ctx = null, master, music, sfx, timer = null, next = 0, step = 0, bar = 0, chord = 0, melody = 7, style = null, unlocked = false;

  // era -> scale (semitones), root (MIDI), tempo, instruments
  const STYLES = {
    prehistory: { scale: [0, 3, 5, 7, 10], root: 45, bpm: 66, lead: 'flute', pad: 'drone', bass: null, drums: 'tribal', prog: [0, 0, 3, 0] },
    ancient: { scale: [0, 1, 4, 5, 7, 8, 10], root: 50, bpm: 76, lead: 'lyre', pad: 'drone', bass: null, drums: 'frame', prog: [0, 1, 0, 6] },
    medieval: { scale: [0, 2, 3, 5, 7, 9, 10], root: 50, bpm: 70, lead: 'recorder', pad: 'drone', bass: null, drums: null, prog: [0, 3, 0, 4] },
    renaissance: { scale: [0, 2, 4, 5, 7, 9, 11], root: 52, bpm: 84, lead: 'lute', pad: 'lute', bass: 'soft', drums: null, prog: [0, 3, 4, 0] },
    colonial: { scale: [0, 2, 4, 5, 7, 9, 11], root: 55, bpm: 92, lead: 'harpsichord', pad: 'harpsichord', bass: 'harpsichord', drums: null, prog: [0, 4, 5, 3] },
    industrial: { scale: [0, 2, 3, 5, 7, 8, 11], root: 57, bpm: 84, lead: 'musicbox', pad: 'organ', bass: 'soft', drums: null, prog: [0, 5, 3, 4] },
    wars: { scale: [0, 2, 4, 5, 7, 9, 10], root: 53, bpm: 108, lead: 'piano', pad: 'piano', bass: 'walk', drums: 'brush', prog: [0, 5, 1, 4] },
    modern: { scale: [0, 2, 4, 7, 9], root: 55, bpm: 100, lead: 'synth', pad: 'synthpad', bass: 'synth', drums: 'kit', prog: [0, 4, 5, 3] },
    digital: { scale: [0, 3, 5, 7, 10], root: 50, bpm: 78, lead: 'epiano', pad: 'epiano', bass: 'sub', drums: 'lofi', prog: [0, 3, 5, 4] },
    near: { scale: [0, 2, 4, 6, 7, 9, 11], root: 52, bpm: 70, lead: 'glass', pad: 'warm', bass: 'sub', drums: 'soft', prog: [0, 1, 4, 3] },
    far: { scale: [0, 2, 4, 6, 8, 10], root: 48, bpm: 58, lead: 'glass', pad: 'space', bass: null, drums: null, prog: [0, 2, 4, 1] },
  };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ctx || !AC) return !!ctx;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      music = ctx.createGain(); music.gain.value = cfg.mv; music.connect(master);
      sfx = ctx.createGain(); sfx.gain.value = cfg.sv; sfx.connect(master);
      return true;
    } catch { ctx = null; return false; }
  }
  // one note: type, frequency, start time, length, volume, envelope, destination
  function tone(f, t, len, vol, o = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.wave || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vib; lg.gain.value = f * 0.008; l.connect(lg).connect(osc.frequency); l.start(t); l.stop(t + len + 0.1); }
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + len);
    const a = o.a ?? 0.01, r = o.r ?? len;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + r);
    let node = osc;
    if (o.lp) { const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; osc.connect(f2); node = f2; }
    node.connect(g).connect(o.dest || music);
    osc.start(t); osc.stop(t + a + r + 0.05);
  }
  function noise(t, len, vol, o = {}) {
    const n = ctx.createBufferSource(), b = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * len)), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'highpass'; f.frequency.value = o.f || 6000;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    n.connect(f).connect(g).connect(o.dest || music); n.start(t); n.stop(t + len);
  }
  const INST = {
    flute: (f, t, d) => tone(f, t, d, 0.05, { wave: 'sine', a: 0.08, r: d, vib: 5 }),
    lyre: (f, t, d) => tone(f, t, d * 1.5, 0.07, { wave: 'triangle', a: 0.005, r: d * 1.5 }),
    recorder: (f, t, d) => tone(f, t, d, 0.035, { wave: 'square', a: 0.05, r: d * 0.9, lp: 1800, vib: 4 }),
    lute: (f, t, d) => tone(f, t, d * 1.2, 0.06, { wave: 'triangle', a: 0.004, r: d * 1.2, lp: 2600 }),
    harpsichord: (f, t, d) => tone(f, t, d, 0.04, { wave: 'sawtooth', a: 0.003, r: d * 0.8, lp: 3200 }),
    musicbox: (f, t, d) => tone(f * 2, t, d * 1.6, 0.05, { wave: 'sine', a: 0.003, r: d * 1.6 }),
    organ: (f, t, d) => { tone(f, t, d, 0.02, { wave: 'sine', a: 0.1, r: d }); tone(f * 2, t, d, 0.012, { wave: 'sine', a: 0.1, r: d }); },
    piano: (f, t, d) => tone(f, t, d * 1.3, 0.06, { wave: 'triangle', a: 0.005, r: d * 1.3, lp: 3000 }),
    synth: (f, t, d) => tone(f, t, d * 0.8, 0.035, { wave: 'square', a: 0.01, r: d * 0.8, lp: 1600 }),
    synthpad: (f, t, d) => tone(f, t, d, 0.02, { wave: 'sawtooth', a: 0.3, r: d, lp: 900 }),
    epiano: (f, t, d) => { tone(f, t, d * 1.4, 0.045, { wave: 'sine', a: 0.01, r: d * 1.4 }); tone(f * 2, t, d * 0.5, 0.012, { wave: 'triangle', a: 0.005, r: d * 0.5 }); },
    glass: (f, t, d) => tone(f * 2, t, d * 2, 0.03, { wave: 'sine', a: 0.02, r: d * 2 }),
    warm: (f, t, d) => tone(f, t, d, 0.02, { wave: 'triangle', a: 0.6, r: d, lp: 1200 }),
    space: (f, t, d) => tone(f, t, d * 1.2, 0.02, { wave: 'sawtooth', a: 1.2, r: d * 1.2, lp: 700, vib: 0.3 }),
    drone: (f, t, d) => { tone(f / 2, t, d, 0.025, { wave: 'sawtooth', a: 0.8, r: d, lp: 500 }); tone(f * 0.75, t, d, 0.015, { wave: 'sine', a: 0.8, r: d }); },
  };
  const BASS = {
    soft: (f, t, d) => tone(f / 2, t, d, 0.05, { wave: 'sine', a: 0.02, r: d }),
    harpsichord: (f, t, d) => tone(f / 2, t, d * 0.6, 0.03, { wave: 'sawtooth', a: 0.003, r: d * 0.6, lp: 1200 }),
    walk: (f, t, d) => tone(f / 2, t, d * 0.9, 0.06, { wave: 'triangle', a: 0.01, r: d * 0.9 }),
    synth: (f, t, d) => tone(f / 2, t, d * 0.8, 0.05, { wave: 'square', a: 0.01, r: d * 0.8, lp: 500 }),
    sub: (f, t, d) => tone(f / 4, t, d, 0.07, { wave: 'sine', a: 0.02, r: d }),
  };
  const DRUMS = {
    tribal: (b, t) => { if (b % 2 === 0) tone(80, t, 0.25, 0.12, { glide: 40, a: 0.003, r: 0.25 }); if (b === 3) tone(120, t, 0.15, 0.06, { glide: 70, a: 0.003, r: 0.15 }); },
    frame: (b, t) => { tone(b === 0 ? 90 : 160, t, 0.18, b === 0 ? 0.08 : 0.04, { glide: 60, a: 0.003, r: 0.18 }); },
    brush: (b, t) => noise(t, 0.12, 0.02, { f: 3000 }),
    kit: (b, t) => { if (b % 2 === 0) tone(90, t, 0.2, 0.1, { glide: 45, a: 0.003, r: 0.2 }); else noise(t, 0.1, 0.03, { f: 1800, type: 'bandpass' }); noise(t, 0.04, 0.012); },
    lofi: (b, t) => { if (b === 0 || b === 2.5) tone(70, t, 0.25, 0.08, { glide: 40, a: 0.003, r: 0.25 }); if (b === 1 || b === 3) noise(t, 0.12, 0.025, { f: 1500, type: 'bandpass' }); noise(t, 0.03, 0.008); },
    soft: (b, t) => { if (b === 0) tone(60, t, 0.3, 0.05, { glide: 35, a: 0.01, r: 0.3 }); },
  };
  const note = (st, deg, oct = 0) => { const sc = st.scale, n = sc.length; const i = ((deg % n) + n) % n, o = Math.floor(deg / n); return st.root + sc[i] + 12 * (o + oct); };
  function schedule() {
    if (!ctx || !cfg.music || !style) return;
    const st = STYLES[style], beat = 60 / st.bpm;
    while (next < ctx.currentTime + 0.4) {
      const t = next, b = step % 4;
      if (b === 0) {
        chord = st.prog[bar % st.prog.length];
        if (st.pad) { const pad = INST[st.pad]; [0, 2, 4].forEach(k => pad(hz(note(st, chord + k)), t, beat * 4 * 0.95)); }
        bar++;
      }
      if (st.bass && (b === 0 || b === 2 || st.bass === 'walk')) BASS[st.bass](hz(note(st, chord + (st.bass === 'walk' ? [0, 2, 4, 5][b] : 0), -1)), t, beat * 0.95);
      if (st.drums) DRUMS[st.drums](b, t);
      if (Math.random() < 0.72) {
        melody += U.pick([-2, -1, -1, 0, 1, 1, 2, 3]);
        if (melody < 4) melody = 6; if (melody > 14) melody = 11;
        const len = Math.random() < 0.25 ? beat * 2 : beat;
        INST[st.lead](hz(note(st, melody + (Math.random() < 0.3 ? chord : 0), 1)), t + (Math.random() < 0.15 ? beat / 2 : 0), len * 0.9);
      }
      next += beat; step++;
    }
  }
  function startMusic() {
    if (!cfg.music || !init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    style = S.W ? S.era().id : 'renaissance';
    if (!timer) { next = ctx.currentTime + 0.1; timer = setInterval(schedule, 120); }
  }
  function stopMusic() { if (timer) clearInterval(timer); timer = null; }
  function follow() { if (!S.W || !ctx) return; const id = S.era().id; if (id !== style) { style = id; bar = 0; } }

  /* ---------- effects ---------- */
  const SFX = {
    age: t => { tone(hz(72), t, 0.35, 0.08, { wave: 'sine', dest: sfx }); tone(hz(79), t + 0.09, 0.45, 0.07, { wave: 'sine', dest: sfx }); },
    good: t => { tone(hz(76), t, 0.2, 0.06, { wave: 'triangle', dest: sfx }); tone(hz(80), t + 0.08, 0.3, 0.06, { wave: 'triangle', dest: sfx }); },
    bad: t => { tone(hz(62), t, 0.25, 0.06, { wave: 'triangle', dest: sfx }); tone(hz(61), t + 0.1, 0.35, 0.05, { wave: 'triangle', dest: sfx }); },
    coin: t => { tone(hz(88), t, 0.08, 0.04, { wave: 'square', dest: sfx, lp: 5000 }); tone(hz(93), t + 0.06, 0.18, 0.04, { wave: 'square', dest: sfx, lp: 5000 }); },
    ach: t => [0, 4, 7, 12].forEach((k, i) => tone(hz(79 + k), t + i * 0.07, 0.35, 0.05, { wave: 'sine', dest: sfx })),
    death: t => { [0, 12, 19].forEach(k => tone(hz(45 + k), t, 3.2, k ? 0.03 : 0.08, { wave: 'sine', a: 0.005, r: 3.2, dest: sfx })); },
    birth: t => [0, 4, 7].forEach((k, i) => tone(hz(84 + k), t + i * 0.1, 0.4, 0.04, { wave: 'sine', dest: sfx })),
    click: t => tone(1100, t, 0.03, 0.02, { wave: 'sine', a: 0.002, r: 0.03, dest: sfx }),
  };
  function play(name) { if (!cfg.sfx || !unlocked || !init() || !SFX[name]) return; if (ctx.state === 'suspended') ctx.resume(); SFX[name](ctx.currentTime + 0.01); }
  function forDelta(d) {
    if (!d) return;
    const s = ['h', 'hp', 'sm', 'lk', 'rep', 'mh'].reduce((t, k) => t + (d[k] || 0), 0);
    if (d.$ && Math.abs(s) < 3) return play(d.$ > 0 ? 'coin' : 'bad');
    if (s >= 3) play('good'); else if (s <= -3) play('bad');
  }

  // first interaction unlocks audio
  const unlock = () => { if (unlocked) return; unlocked = true; if (cfg.music) startMusic(); };
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', unlock, { once: false, capture: true });
    document.addEventListener('keydown', unlock, { capture: true });
    document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.visibilityState === 'hidden') ctx.suspend(); else if (unlocked) ctx.resume(); });
  }
  let achN = -1, kids = -1;
  (ui.onAged ||= []).push(() => {
    follow();
    const p = S.me(); if (!p) return;
    if (S.W.dead) return play('death');
    if (achN >= 0 && p.ach.length > achN) play('ach');
    else if (kids >= 0 && p.kids.length > kids) play('birth');
    else play('age');
    achN = p.ach.length; kids = p.kids.length;
  });
  (ui.around ||= []).push({ after: el => { if (el.dataset.act === 'choose') play('click'); if (['heir', 'newHouse', 'begin', 'continue', 'becomeYes'].includes(el.dataset.act)) { follow(); const p = S.W && S.me(); achN = p ? p.ach.length : -1; kids = p ? p.kids.length : -1; } } });
  const death = ui.death;
  ui.death = () => { death(); play('death'); };

  function soundSheet() {
    sheet(`<h2>Music & sound</h2><p class="lede">Music is composed live for each era. Effects mark each year, good and bad news, money, achievements, births and deaths.</p>
      <label class="check"><input type="checkbox" data-input="sndMusic" ${cfg.music ? 'checked' : ''}> Music</label>
      <div class="field"><label for="snd-mv">Music volume</label><input id="snd-mv" type="range" min="0" max="100" value="${Math.round(cfg.mv * 100)}" data-input="sndMv"></div>
      <label class="check" style="margin-top:10px"><input type="checkbox" data-input="sndSfx" ${cfg.sfx ? 'checked' : ''}> Sound effects</label>
      <div class="field"><label for="snd-sv">Effects volume</label><input id="snd-sv" type="range" min="0" max="100" value="${Math.round(cfg.sv * 100)}" data-input="sndSv"></div>
      ${AC ? '' : '<p class="why">This browser cannot play generated audio.</p>'}`, { label: 'Music and sound' });
  }
  ui.on.sound = () => { unlock(); soundSheet(); };
  ui.input.sndMusic = el => { cfg.music = el.checked; save(); if (cfg.music) startMusic(); else stopMusic(); };
  ui.input.sndSfx = el => { cfg.sfx = el.checked; save(); if (cfg.sfx) play('good'); };
  ui.input.sndMv = el => { cfg.mv = +el.value / 100; save(); if (music) music.gain.value = cfg.mv; };
  ui.input.sndSv = el => { cfg.sv = +el.value / 100; save(); if (sfx) sfx.gain.value = cfg.sv; play('click'); };
  ui.sound = { init: () => { }, play, forDelta, follow, cfg };
})();
