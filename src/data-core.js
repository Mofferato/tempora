'use strict';
/* =====================================================================
   TEMPORA — data layer, part 1: utilities, name pools, data registry.
   Everything the simulation knows about the world lives in DATA and is
   plain data. To add an era, event or activity, push a new object.
   ===================================================================== */

const U = {
  rand: (a = 0, b = 1) => a + Math.random() * (b - a),
  ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  chance: p => Math.random() < p,
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  clamp: (v, a = 0, b = 100) => Math.max(a, Math.min(b, v)),
  slug: s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  // Weighted pick: items + weight function
  wpick(items, w) {
    const ws = items.map(w), tot = ws.reduce((s, x) => s + x, 0);
    if (tot <= 0) return null;
    let r = Math.random() * tot;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  },
  shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  // Years skip 0: ... 2 BC (-2), 1 BC (-1), 1 AD (1), 2 AD ... Math is done
  // in astronomical years (1 BC = 0) and converted back.
  astro: y => (y < 0 ? y + 1 : y),
  unastro: a => (a <= 0 ? a - 1 : a),
  add: (y, n) => U.unastro(U.astro(y) + n),
  next: y => U.add(y, 1),
  span: (a, b) => U.astro(b) - U.astro(a),
  fmtYear: y => (y < 0 ? `${-y} BC` : `${y}`),
  fmtYearAD: y => (y < 0 ? `${-y} BC` : y < 1000 ? `${y} AD` : `${y}`),
  esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  // Resolve a value that may be a number or a [min,max] range
  roll: v => (Array.isArray(v) ? U.ri(v[0], v[1]) : v),
  fmtNum(n) {
    const a = Math.abs(n), s = n < 0 ? '−' : '';
    if (a >= 1e9) return s + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B';
    if (a >= 1e6) return s + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M';
    if (a >= 1e4) return s + Math.round(a / 1e3) + 'k';
    return s + Math.round(a).toLocaleString('en-US');
  },
  ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); },
  // 'House of Smith', but 'House of Thebes' for a name that is already 'of Thebes'
  house: n => (/^(of|the) /i.test(n || '') ? `House ${/^the /i.test(n) ? 'of ' : ''}${n}` : `House of ${n || '?'}`),
  roman(n) { const m = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let r = ''; for (const [v, s] of m) while (n >= v) { r += s; n -= v; } return r || '—'; },
};

// UI registrations from engine-side modules; late.js runs them once every file has loaded
const LATE = [];

const DATA = {
  PREMODERN: ['prehistory', 'ancient', 'medieval', 'renaissance', 'colonial', 'industrial'],
  eras: [],          // ordered, contiguous era definitions
  history: [],       // dated world events
  events: [],        // universal random life events
  activities: [],    // universal activities (labels come from the era)
  achievements: [],
  names: {},         // culture -> { m, f, last }
};

/* ---------- compact constructors used by the era tables ---------- */
// Job: title, pay (era currency / year), options
// o: sm min smarts, edu min education level, rep min reputation, lk min looks,
//    risk yearly injury chance, fame rep gained per year, vol income volatility,
//    from/to year window, sex restriction, grant honorific title
function J(t, pay, o = {}) { return Object.assign({ id: U.slug(t), t, pay, sm: 0, edu: 0, rep: 0, lk: 0, risk: 0, fame: 0, vol: 0 }, o); }
// Asset: title, price (era currency), kind, yearly appreciation, yearly income rate, happiness on purchase
function A(t, price, kind, o = {}) { return Object.assign({ id: U.slug(t), t, price, kind, appr: 0, inc: 0, hp: 5 }, o); }
// Disease: name, yearly catch chance, health damage/yr, lethality/yr, duration (yrs), medicine needed to cure
function D(n, p, dmg, let_, dur, cure) { return { id: U.slug(n), n, p, dmg, let: let_, dur, cure }; }

/* ---------- name pools by culture ---------- */
DATA.names = {
  ancient: {
    m: ['Marcus', 'Gaius', 'Lucius', 'Titus', 'Quintus', 'Nikias', 'Demetrios', 'Kleon', 'Andronikos', 'Sextus', 'Aulus', 'Philon', 'Theron', 'Kyros', 'Hanno'],
    f: ['Julia', 'Livia', 'Cornelia', 'Octavia', 'Helena', 'Theodora', 'Phoebe', 'Aurelia', 'Claudia', 'Thalia', 'Iris', 'Nefret', 'Drusilla', 'Kallisto', 'Tullia'],
    last: ['Valerius', 'Aemilius', 'Cornelius', 'Fabius', 'Flavius', 'Antonius', 'Sulpicius', 'Petronius', 'Kallias', 'Lykos', 'Domitius', 'Horatius', 'Nerva', 'Pollio'],
  },
  medieval: {
    m: ['William', 'John', 'Robert', 'Richard', 'Hugh', 'Walter', 'Geoffrey', 'Thomas', 'Henry', 'Roger', 'Ralph', 'Simon', 'Adam', 'Gilbert', 'Osbert', 'Aldric'],
    f: ['Alice', 'Matilda', 'Agnes', 'Joan', 'Isabel', 'Margery', 'Emma', 'Cecily', 'Edith', 'Beatrice', 'Maud', 'Eleanor', 'Rohese', 'Avice', 'Sybil'],
    last: ['Smith', 'Miller', 'Fletcher', 'Cooper', 'Thatcher', 'Ashdown', 'Blackwood', 'Hale', 'Wick', 'Brewer', 'Carter', 'Mason', 'Fairfax', 'Thorne', 'Atwood', 'Marsh'],
  },
  renaissance: {
    m: ['Lorenzo', 'Giovanni', 'Niccolò', 'Leonardo', 'Francesco', 'Cosimo', 'Pietro', 'Matteo', 'Tommaso', 'Alessandro', 'Baldassare', 'Jacopo', 'Rodrigo', 'Hans', 'Pieter'],
    f: ['Caterina', 'Lucrezia', 'Isabella', 'Beatrice', 'Giulia', 'Francesca', 'Bianca', 'Ginevra', 'Laura', 'Maddalena', 'Vittoria', 'Clarice', 'Margarethe', 'Leonor', 'Anneke'],
    last: ['Rossi', 'Bianchi', 'Conti', 'Moretti', 'Romano', 'Greco', 'Galli', 'Marino', 'Barone', 'Ricci', 'Vitale', 'Albrecht', 'de Vries', 'Salviati', 'Strozzi'],
  },
  colonial: {
    m: ['James', 'John', 'William', 'Samuel', 'Benjamin', 'Thomas', 'Josiah', 'Nathaniel', 'Ebenezer', 'Isaac', 'George', 'Daniel', 'Jonathan', 'Elias', 'Silas'],
    f: ['Mary', 'Elizabeth', 'Abigail', 'Sarah', 'Hannah', 'Martha', 'Anne', 'Rebecca', 'Patience', 'Mercy', 'Charlotte', 'Susannah', 'Prudence', 'Temperance', 'Lydia'],
    last: ['Whitfield', 'Hawthorne', 'Adams', 'Porter', 'Wells', 'Bradford', 'Winslow', 'Lowell', 'Sterling', 'Cartwright', 'Pembroke', 'Ashby', 'Holt', 'Crane', 'Pryor'],
  },
  industrial: {
    m: ['Arthur', 'Albert', 'Frederick', 'Edward', 'Walter', 'Harold', 'Ernest', 'Charles', 'Alfred', 'George', 'Herbert', 'Frank', 'Percival', 'Cornelius', 'Reuben'],
    f: ['Florence', 'Edith', 'Ada', 'Clara', 'Mabel', 'Harriet', 'Ethel', 'Lillian', 'Beatrice', 'Victoria', 'Emily', 'Rose', 'Winifred', 'Agatha', 'Nellie'],
    last: ['Ashworth', 'Holloway', 'Bramwell', 'Fenwick', 'Kingsley', 'Thornton', 'Whitaker', 'Radcliffe', 'Barlow', 'Crowther', 'Hargreaves', 'Pickering', 'Sutcliffe', 'Oakes'],
  },
  wars: {
    m: ['Jack', 'Harry', 'Joseph', 'Frank', 'Robert', 'Walter', 'Stanley', 'Leonard', 'Raymond', 'Howard', 'Eugene', 'Clarence', 'Vernon', 'Lloyd', 'Milton'],
    f: ['Dorothy', 'Helen', 'Margaret', 'Betty', 'Ruth', 'Mildred', 'Virginia', 'Evelyn', 'Frances', 'Irene', 'Lois', 'Marjorie', 'Hazel', 'Gladys', 'Vera'],
    last: ['Miller', 'Walsh', 'Kowalski', 'Brennan', 'Fischer', 'Doyle', 'Novak', 'Russo', 'Sullivan', 'Harper', 'Keller', 'Lindqvist', 'Moreau', 'Callahan'],
  },
  modern: {
    m: ['Michael', 'David', 'James', 'Robert', 'Mark', 'Steven', 'Kevin', 'Brian', 'Daniel', 'Chris', 'Jason', 'Eric', 'Gary', 'Tony', 'Marcus'],
    f: ['Linda', 'Susan', 'Karen', 'Lisa', 'Jennifer', 'Michelle', 'Amy', 'Nancy', 'Donna', 'Laura', 'Kimberly', 'Angela', 'Denise', 'Tracy', 'Rhonda'],
    last: ['Johnson', 'Lee', 'Martinez', 'Brooks', 'Carter', 'Nguyen', 'Patel', 'Reyes', 'Bennett', 'Foster', 'Hughes', 'Okonkwo', 'Schultz', 'Delgado'],
  },
  digital: {
    m: ['Liam', 'Noah', 'Ethan', 'Mason', 'Lucas', 'Aiden', 'Oliver', 'Elijah', 'Mateo', 'Leo', 'Kai', 'Ezra', 'Omar', 'Arjun', 'Theo'],
    f: ['Emma', 'Olivia', 'Ava', 'Sophia', 'Mia', 'Isla', 'Chloe', 'Zoe', 'Aria', 'Maya', 'Nora', 'Luna', 'Amara', 'Priya', 'Hana'],
    last: ['Kim', 'Silva', 'Okafor', 'Singh', 'Novak', 'Park', 'Haddad', 'Tanaka', 'Ibrahim', 'Morales', 'Larsen', 'Adeyemi', 'Costa', 'Chen'],
  },
  near: {
    m: ['Orion', 'Jax', 'Zev', 'Rune', 'Cassius', 'Kairo', 'Idris', 'Soren', 'Atlas', 'Ren', 'Tycho', 'Emeka', 'Lior', 'Ansel', 'Dax'],
    f: ['Lyra', 'Vega', 'Nyx', 'Ayla', 'Juno', 'Selene', 'Io', 'Seren', 'Wren', 'Mira', 'Kaia', 'Elara', 'Noor', 'Sunniva', 'Ottilie'],
    last: ['Okoro-Lin', 'Vance', 'Achebe', 'Solberg', 'Nakamura', 'Reyes-Kim', 'Castellan', 'Oyelaran', 'Varga', 'Quill', 'Moreau-Sato', 'Halloran'],
  },
  far: {
    m: ['Xander', 'Kael', 'Thorne', 'Zephyr', 'Draven', 'Axiom', 'Sol', 'Eon', 'Cyrus', 'Talon', 'Oberon', 'Riven', 'Castor', 'Juniper'],
    f: ['Astra', 'Celest', 'Lumen', 'Nebula', 'Aurora', 'Seraph', 'Zara', 'Echo', 'Halcyon', 'Iris', 'Andromeda', 'Tessaly', 'Ondine', 'Vesper'],
    last: ['Kepler', 'Meridian', 'Castor', 'Vireo', 'Halden', 'Arcturi', 'Solace', 'Lumière', 'Orrin', 'Tarsis', 'Ceres-Vale', 'Nakamura-Ode', 'Brightwater'],
  },
};
