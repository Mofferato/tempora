// Headless Tempora context shared by the simulators and tests.
const vm = require('vm');
const path = require('path');
const fs = require('fs');
const { JS_ORDER } = require('../build.js');

const NAMES = ['Sim', 'UI', 'DATA', 'U', 'Gen', 'Auto', 'Places', 'Phone', 'Sports', 'Legacy', 'AI', 'Delta', 'Intro', 'Atlas', 'Identity', 'Faith', 'Marriage', 'Net', 'Director', 'Geo', 'Dash', 'Pol'];
function makeContext() {
  const store = {};
  const el = () => ({ innerHTML: '', textContent: '', hidden: false, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, appendChild() {}, remove() {}, style: { setProperty() {} }, dataset: {}, querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ top: 0, left: 0, width: 800, height: 600 }), focus() {}, scrollIntoView() {} });
  const els = {};
  const document = {
    documentElement: { dataset: {}, style: { setProperty() {} } },
    querySelector: s => (/^#(modal|toast|screen|card|tabs|view|ribbon|when|agebar|ageBtn|btnGod|layout|autoBtn|btnSound|btnAI|phoneBadge)$/.test(s) ? (els[s] ||= el()) : null),
    querySelectorAll: () => [], addEventListener() {}, createElement: el, body: el(), getElementById: () => null, head: el(),
    visibilityState: 'visible',
  };
  const ctx = {
    console, Math, JSON, Date, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    matchMedia: () => ({ matches: false, addEventListener() {} }), navigator: {}, document, performance: { now: () => Date.now() },
    fetch: () => Promise.reject(new Error('offline')), location: { protocol: 'file:', origin: 'null', href: 'file:///index.html' },
    AudioContext: undefined, requestAnimationFrame: () => 0, Blob: function () {}, URL: { createObjectURL: () => '' }, FileReader: function () {},
  };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  const code = JS_ORDER.filter(f => f !== 'main.js' && fs.existsSync(path.join(__dirname, '..', 'src', f)))
    .map(f => `/* ${f} */\n` + fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')).join('\n');
  vm.runInContext(code + '\n;globalThis.__T = { ' + NAMES.map(n => `${n}: typeof ${n} !== "undefined" ? ${n} : null`).join(', ') + ', extraActions: typeof SIM_EXTRA !== "undefined" ? SIM_EXTRA : [] };', ctx, { filename: 'tempora-bundle.js' });
  return ctx.__T;
}


module.exports = { makeContext };
