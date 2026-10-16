// Builds src/data-map.js from Natural Earth admin-0 countries (public domain, naturalearthdata.com).
//   node tools/build-map.js path/to/ne_50m_admin_0_countries.geojson
// Each country gets a few simplified rings, a centroid, a bounding box and a list of land neighbours.
// Rings are stored as Google-polyline strings at 0.01° precision (about 1 km). The game projects them itself.
const fs = require('fs');
const path = require('path');

// Natural Earth ADM0_A3 -> Tempora country id. Anything not listed keeps its own ADM0_A3.
// Dependencies follow their sovereign (see SOV_A3), except where listed here.
const ALIAS = { GBR: 'ENG', SOL: 'SOM', CYN: 'CYP', KOS: 'KOS', PSX: 'PSE', SAH: 'MOR', MAR: 'MOR', ALD: 'FIN', ATC: 'AUS', IOA: 'AUS', SDS: 'SSD', AND: 'ADO' };
const SKIP = new Set(['ATA', 'ATF', 'HMD', 'SGS', 'IOT', 'KAS', 'BJN', 'SER', 'USG', 'CNM', 'SCR', 'NOL', 'BRI', 'CLP']);
const SOV_FIX = { GBR: 'ENG', GB1: 'ENG', MAR: 'MOR', SOL: 'SOM', CYN: 'CYP', AU1: 'AUS', FR1: 'FRA', NZ1: 'NZL', US1: 'USA', IS1: 'ISR', DN1: 'DNK', NL1: 'NLD', FI1: 'FIN', CH1: 'CHN' };

const file = process.argv[2];
if (!file) { console.error('usage: node tools/build-map.js ne_50m_admin_0_countries.geojson'); process.exit(1); }
const gj = JSON.parse(fs.readFileSync(file, 'utf8'));

const ringArea = r => { let a = 0; for (let i = 0, n = r.length; i < n; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % n]; a += x1 * y2 - x2 * y1; } return a / 2; };
const ringCentroid = r => { let a = 0, cx = 0, cy = 0; for (let i = 0, n = r.length; i < n; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % n], f = x1 * y2 - x2 * y1; a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f; } a /= 2; return a ? [cx / (6 * a), cy / (6 * a)] : r[0]; };

// Douglas-Peucker
function dp(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (!L) d = Math.hypot(px - ax, py - ay);
      else { let t = ((px - ax) * dx + (py - ay) * dy) / L; t = Math.max(0, Math.min(1, t)); d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); }
      if (d > md) { md = d; mi = i; }
    }
    if (md > tol && mi > 0) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// Google polyline encoding at 1e-2 precision (first point absolute, then deltas)
function enc(pts) {
  let out = '', px = 0, py = 0;
  const e = v => { v = v < 0 ? ~(v << 1) : v << 1; let s = ''; while (v >= 0x20) { s += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return s + String.fromCharCode(v + 63); };
  for (const [x, y] of pts) { const ix = Math.round(x * 100), iy = Math.round(y * 100); out += e(ix - px) + e(iy - py); px = ix; py = iy; }
  return out;
}

const shapes = {}, grid = new Map(), owner = {};
const cell = (x, y) => Math.round(x * 20) * 100000 + Math.round(y * 20);

for (const f of gj.features) {
  const p = f.properties, a3 = p.ADM0_A3;
  if (SKIP.has(a3)) continue;
  const sov = SOV_FIX[p.SOV_A3] || p.SOV_A3;
  let id = ALIAS[a3] || (p.SOVEREIGNT !== p.ADMIN ? sov : a3);
  if (a3 === 'PSX') id = 'PSE';
  if (id === 'GBR') id = 'ENG';
  if (id === 'MAR') id = 'MOR';
  owner[a3] = id;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const s = (shapes[id] ||= { rings: [], area: 0, cx: 0, cy: 0, bb: [180, 90, -180, -90], dep: id !== a3 && !ALIAS[a3] });
  for (const poly of polys) {
    const outer = poly[0];
    // vertices feed the neighbour grid at full resolution (before simplifying), for land borders only
    for (const [x, y] of outer) { const k = cell(x, y); let g = grid.get(k); if (!g) grid.set(k, g = new Set()); g.add(id); }
    const ar = Math.abs(ringArea(outer));
    s.rings.push({ pts: outer, ar, own: a3, dep: p.SOVEREIGNT !== p.ADMIN && !ALIAS[a3] });
  }
}

// simplification tolerance depends on how big the country is, so small ones keep their shape
const out = {}, nbSet = {};
let totalPts = 0;
for (const [id, s] of Object.entries(shapes)) {
  const big = s.rings.reduce((m, r) => Math.max(m, r.ar), 0);
  s.rings.sort((a, b) => b.ar - a.ar);
  const tol = Math.max(0.012, Math.min(0.16, Math.sqrt(big) * 0.012));
  const minArea = Math.max(0.006, big * 0.0004);
  const kept = s.rings.filter((r, i) => i === 0 || r.ar >= minArea).slice(0, 40);
  const rings = kept.map(r => { let q = dp(r.pts.slice(0, -1), tol); if (q.length < 3) q = r.pts.slice(0, 3); totalPts += q.length; return q; });
  let bb = [180, 90, -180, -90], tot = 0, cx = 0, cy = 0;
  const mainRings = s.rings.filter(r => !r.dep), core = mainRings.length ? mainRings : s.rings;
  for (const r of core) { for (const [x, y] of r.pts) { bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x), Math.max(bb[3], y)]; } }
  // label anchor: centroid of the biggest ring; antimeridian-crossers (Russia, Fiji) are kept as they are
  const c = ringCentroid(core[0].pts);
  for (const r of s.rings) if (!r.dep) tot += r.ar;
  if (!tot) for (const r of s.rings) tot += r.ar;
  out[id] = { r: rings.map(enc), c: [+c[0].toFixed(2), +c[1].toFixed(2)], bb: bb.map(v => +v.toFixed(1)), a: +tot.toFixed(3), pt: tot < 0.35 ? 1 : 0 };
}

// land neighbours: countries whose border vertices fall in the same or an adjacent grid cell
for (const [k, set] of grid) {
  const ids = [...set];
  const cx = Math.floor(k / 100000), cy = k % 100000;
  const near = new Set(ids);
  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const g = grid.get((cx + dx) * 100000 + (cy + dy)); if (g) g.forEach(i => near.add(i)); }
  const all = [...near];
  for (const a of ids) for (const b of all) if (a !== b) (nbSet[a] ||= new Set()).add(b), (nbSet[b] ||= new Set()).add(a);
}
const nb = {}; for (const [k, v] of Object.entries(nbSet)) nb[k] = [...v].sort();

const js = `/* Generated by tools/build-map.js from Natural Earth admin-0 countries (public domain). Do not edit by hand.
   Rings are polylines at 0.01 degree precision; c = label point, bb = bounding box, a = area in square degrees,
   pt = 1 for microstates drawn as dots; nb = land neighbours. */
DATA.map = ${JSON.stringify({ v: 1, shapes: out, nb })};
`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'data-map.js'), js);
console.log(`${Object.keys(out).length} shapes, ${totalPts} points, ${(js.length / 1024).toFixed(0)} KB`);
console.log('ids:', Object.keys(out).sort().join(' '));
