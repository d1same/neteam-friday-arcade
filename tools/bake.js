#!/usr/bin/env node
// Light baker: path-traces the generated world of a shooter map on the CPU and writes the result next to the game:
//   server/public/models/lm-<map>-a.png  irradiance (sqrt encoded, sun excluded) + sun visibility in alpha
//   server/public/models/lm-<map>-b.png  dominant light direction + how directional the light is (half resolution)
//   server/public/models/lm-<map>.bin    header, baked vertex light, light probes for moving objects
// usage: node tools/bake.js <map|all> [--fast] [--debug=dir] [--threads=n]
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const fs = require("fs"), path = require("path"), os = require("os");
const LM_SCALE = 16, PI = Math.PI;

// ---------------------------------------------------------------- scene set-up shared by the main thread and the workers
function setup(id) {
  const { W, sky, g, M } = require("./world.js").build(id), mapRows = M.rows;
  const G = W.G, CS = W.CS, AWd = W.atlas.w, AHd = W.atlas.h, NA = AWd * AHd, NV = W.vl.g.length, N = NA + NV;
  const { floorY, ceilY, floorOn, ceilOn, floorAlb, ceilAlb } = W.cell, O = W.occ, ob = O.b;
  // bin the solids into grid cells
  const cnt = new Int32Array(G * G + 1), cl = (v) => Math.max(0, Math.min(G - 1, Math.floor(v / CS)));
  for (let k = 0; k < O.n; k++) for (let z = cl(ob[k * 6 + 2] + 1e-4); z <= cl(ob[k * 6 + 5] - 1e-4); z++) for (let x = cl(ob[k * 6] + 1e-4); x <= cl(ob[k * 6 + 3] - 1e-4); x++) cnt[z * G + x + 1]++;
  for (let i = 0; i < G * G; i++) cnt[i + 1] += cnt[i];
  const binS = cnt, binL = new Int32Array(cnt[G * G]), fill = new Int32Array(G * G);
  for (let k = 0; k < O.n; k++) for (let z = cl(ob[k * 6 + 2] + 1e-4); z <= cl(ob[k * 6 + 5] - 1e-4); z++) for (let x = cl(ob[k * 6] + 1e-4); x <= cl(ob[k * 6 + 3] - 1e-4); x++) { const c = z * G + x; binL[binS[c] + fill[c]++] = k; }
  let maxY = 0; for (let k = 0; k < O.n; k++) maxY = Math.max(maxY, ob[k * 6 + 4]); maxY = Math.max(maxY, W.H) + 0.5;

  // ---- ray caster: 2D walk over the cells, floor / ceiling planes and the boxes binned in each cell
  const hit = { t: 0, kind: 0, idx: 0, face: 0, cell: 0 };   // kind: 0 miss (sky), 1 floor, 2 ceiling, 3 box
  function trace(ox, oy, oz, dx, dy, dz, tmax, any) {
    let cx = Math.floor(ox / CS), cz = Math.floor(oz / CS); hit.kind = 0; hit.t = tmax;
    if (cx < 0 || cz < 0 || cx >= G || cz >= G) return tmax;
    const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1, adx = Math.abs(dx), adz = Math.abs(dz);
    const tdx = adx > 1e-9 ? CS / adx : Infinity, tdz = adz > 1e-9 ? CS / adz : Infinity;
    let tmx = adx > 1e-9 ? (dx > 0 ? (cx + 1) * CS - ox : ox - cx * CS) / adx : Infinity, tmz = adz > 1e-9 ? (dz > 0 ? (cz + 1) * CS - oz : oz - cz * CS) / adz : Infinity;
    const ix = adx > 1e-9 ? 1 / dx : 0, iy = Math.abs(dy) > 1e-9 ? 1 / dy : 0, iz = adz > 1e-9 ? 1 / dz : 0;
    let t0 = 0, best = tmax;
    for (let step = 0; step < 256; step++) {
      const t1 = tmx < tmz ? tmx : tmz, c = cz * G + cx;
      if (dy < 0) { const tf = (floorY[c] - oy) * iy; if (tf > 1e-5 && tf >= t0 - 1e-4 && tf <= t1 + 1e-4 && tf < best) { best = tf; hit.kind = 1; hit.cell = c; } }
      else if (dy > 0) { const cy = ceilY[c]; if (cy < 1e8) { const tc = (cy - oy) * iy; if (tc > 1e-5 && tc >= t0 - 1e-4 && tc <= t1 + 1e-4 && tc < best) { best = tc; hit.kind = 2; hit.cell = c; } } else if (oy + dy * t0 > maxY) { hit.t = tmax; hit.kind = best < tmax ? hit.kind : 0; return best; } }
      for (let q = binS[c], qe = binS[c + 1]; q < qe; q++) {
        const k = binL[q], b = k * 6; let tn = -Infinity, tf = Infinity, face = -1, a, e;
        if (ix !== 0) { a = (ob[b] - ox) * ix; e = (ob[b + 3] - ox) * ix; if (a > e) { const w = a; a = e; e = w; } if (a > tn) { tn = a; face = dx > 0 ? 1 : 0; } if (e < tf) tf = e; } else if (ox < ob[b] || ox > ob[b + 3]) continue;
        if (iy !== 0) { a = (ob[b + 1] - oy) * iy; e = (ob[b + 4] - oy) * iy; if (a > e) { const w = a; a = e; e = w; } if (a > tn) { tn = a; face = dy > 0 ? 3 : 2; } if (e < tf) tf = e; } else if (oy < ob[b + 1] || oy > ob[b + 4]) continue;
        if (iz !== 0) { a = (ob[b + 2] - oz) * iz; e = (ob[b + 5] - oz) * iz; if (a > e) { const w = a; a = e; e = w; } if (a > tn) { tn = a; face = dz > 0 ? 5 : 4; } if (e < tf) tf = e; } else if (oz < ob[b + 2] || oz > ob[b + 5]) continue;
        if (tn > tf || tn <= 1e-4 || tn >= best || tn > t1 + 1e-4) continue;
        best = tn; hit.kind = 3; hit.idx = k; hit.face = face; hit.cell = c;
      }
      if (best <= t1 + 1e-4) { hit.t = best; return best; }
      if (any && best < tmax) { hit.t = best; return best; }
      if (t1 >= tmax) break;
      if (tmx < tmz) { cx += sx; tmx += tdx; } else { cz += sz; tmz += tdz; }
      t0 = t1; if (cx < 0 || cz < 0 || cx >= G || cz >= G) break;
    }
    hit.kind = best < tmax ? hit.kind : 0; hit.t = best; return best;
  }
  const blocked = (ox, oy, oz, dx, dy, dz, tmax) => trace(ox, oy, oz, dx, dy, dz, tmax, true) < tmax - 1e-3;
  const inside = (x, y, z) => { const cx = Math.floor(x / CS), cz = Math.floor(z / CS); if (cx < 0 || cz < 0 || cx >= G || cz >= G) return false; const c = cz * G + cx; if (y < floorY[c] - 1e-3 || y > ceilY[c] + 1e-3) return true; for (let q = binS[c]; q < binS[c + 1]; q++) { const b = binL[q] * 6; if (x > ob[b] + 1e-3 && x < ob[b + 3] - 1e-3 && y > ob[b + 1] + 1e-3 && y < ob[b + 4] - 1e-3 && z > ob[b + 2] + 1e-3 && z < ob[b + 5] - 1e-3) return true; } return false; };

  // ---- chart lookups: world hit -> index of the light sample that covers it
  const ch = W.charts, FC = ch[1], CC = ch[2], FP = W.FP, CP = W.CP, WP = W.WP;
  const runInfo = W.runs.map(r => { const f = r.faces[0], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][f.d], rx = d[1], rz = -d[0], mx = f.cx * CS + CS / 2 + d[0] * CS / 2, mz = f.cz * CS + CS / 2 + d[1] * CS / 2; return { ox: mx - rx * CS / 2, oz: mz - rz * CS / 2, rx, rz, nx: d[0], nz: d[1], c: ch[r.chart] }; });
  const runOfChart = new Int32Array(ch.length).fill(-1); W.runs.forEach((r, i) => runOfChart[r.chart] = i);
  const vsCount = (v) => { let n = 1; const g = W.vl.g[v]; while (v + n < NV && W.vl.g[v + n] === g) n++; return n; };
  function sampleAt(x, y, z) { // for the current hit: sample index, or -1
    const c = hit.cell;
    if (hit.kind === 1) return floorOn[c] ? (FC.y + Math.min(FC.h - 1, Math.floor(z / CS * FP))) * AWd + FC.x + Math.min(FC.w - 1, Math.floor(x / CS * FP)) : -1;
    if (hit.kind === 2) return ceilOn[c] ? (CC.y + Math.min(CC.h - 1, Math.floor(z / CS * CP))) * AWd + CC.x + Math.min(CC.w - 1, Math.floor(x / CS * CP)) : -1;
    const k = hit.idx * 6 + hit.face, ci = O.chart[k];
    if (ci >= 0) { const R = runInfo[runOfChart[ci]], cc = R.c, u = (x - R.ox) * R.rx + (z - R.oz) * R.rz, px = Math.max(0, Math.min(cc.w - 1, Math.floor(u * WP))), py = Math.max(0, Math.min(cc.h - 1, Math.floor(y * cc.h / cc.hm))); return (cc.y + py) * AWd + cc.x + px; }
    const v = O.vs[k]; if (v >= 0) { const n = vsCount(v); return NA + v + ((n >> 1) | 0); }
    return -1;
  }
  const albOfHit = (out) => { let a; if (hit.kind === 1) a = W.alb[floorAlb[hit.cell]]; else if (hit.kind === 2) a = W.alb[ceilAlb[hit.cell]]; else a = W.alb[O.alb[hit.idx * 6 + hit.face]]; out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; };

  // ---- sky: coarse radiance table, rotated so its sun sits where the map's sun is
  const S = W.sky ? sky(W.sky.name) : null; let skyK = 0, skyOff = 0;
  if (S) { const lumE = S.skyE[0] * 0.2126 + S.skyE[1] * 0.7152 + S.skyE[2] * 0.0722; skyK = (W.sky.E || 2) / lumE * (W.sky.k || 1);
    if (W.sun) skyOff = (Math.atan2(-S.sunDir[2], -S.sunDir[0]) - Math.atan2(-W.sun.dir[2], -W.sun.dir[0])) / (2 * PI); }
  function skyL(dx, dy, dz, out) {
    if (!S) { out[0] = out[1] = out[2] = 0; return; }
    let u = Math.atan2(-dz, -dx) / (2 * PI) + skyOff; u -= Math.floor(u); const v = Math.acos(Math.max(-1, Math.min(1, dy))) / PI;
    const fx = u * S.tw - 0.5, fy = Math.max(0, Math.min(S.th - 1, v * S.th - 0.5)), x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0, xa = (x0 + S.tw) % S.tw, xb = (x0 + 1) % S.tw, yb = Math.min(S.th - 1, y0 + 1), T = S.tab;
    for (let c = 0; c < 3; c++) out[c] = ((T[(y0 * S.tw + xa) * 3 + c] * (1 - ax) + T[(y0 * S.tw + xb) * 3 + c] * ax) * (1 - ay) + (T[(yb * S.tw + xa) * 3 + c] * (1 - ax) + T[(yb * S.tw + xb) * 3 + c] * ax) * ay) * skyK;
  }

  // ---- lights, and for every cell the lights that can reach it (walls between them cull most)
  const L = W.lights.map(l => { const a = 4 * Math.hypot(l.u[0], l.u[1], l.u[2]) * Math.hypot(l.v[0], l.v[1], l.v[2]); return Object.assign({ area: a, ext: Math.hypot(l.u[0], l.u[1], l.u[2]) + Math.hypot(l.v[0], l.v[1], l.v[2]) }, l); });
  const rows = (cx, cz) => cx < 0 || cz < 0 || cx >= G || cz >= G;
  const blockCell = new Uint8Array(G * G); for (let k = 0; k < O.n; k++) { const b = k * 6; if (ob[b + 3] - ob[b] > CS - 0.01 && ob[b + 5] - ob[b + 2] > CS - 0.01 && ob[b + 1] < 0.01 && ob[b + 4] >= W.H - 0.01) blockCell[cl(ob[b + 2] + 0.1) * G + cl(ob[b] + 0.1)] = 1; }
  const los2 = (ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz); if (d < 0.01) return true; const n = Math.ceil(d / 0.5); for (let i = 1; i < n; i++) { const x = ax + dx * i / n, z = az + dz * i / n, cx = Math.floor(x / CS), cz = Math.floor(z / CS); if (rows(cx, cz)) return true; if (blockCell[cz * G + cx]) return false; } return true; };
  const cellL = []; let pairs = 0;
  for (let cz = 0; cz < G; cz++) for (let cx = 0; cx < G; cx++) {
    const list = [], c = cz * G + cx; cellL.push(list); if (blockCell[c]) continue;
    const pts = [[cx * CS + 2, cz * CS + 2], [cx * CS + 0.3, cz * CS + 0.3], [cx * CS + 3.7, cz * CS + 0.3], [cx * CS + 0.3, cz * CS + 3.7], [cx * CS + 3.7, cz * CS + 3.7]];
    L.forEach((l, li) => { const d = Math.hypot(l.c[0] - (cx * CS + 2), l.c[2] - (cz * CS + 2)); if (l.range && d > l.range + 3) return; if (!l.range && d > 40) return;
      const lp = [[l.c[0], l.c[2]], [l.c[0] + l.u[0] + l.v[0], l.c[2] + l.u[2] + l.v[2]], [l.c[0] - l.u[0] - l.v[0], l.c[2] - l.u[2] - l.v[2]]];
      if (pts.some(p => lp.some(q => los2(p[0], p[1], q[0], q[1])))) { list.push(li); pairs++; } });
  }

  // ---- samples: every lightmap texel in use, then the vertex-light samples
  const sp = new Float32Array(N * 3), sn = new Float32Array(N * 3), sf = new Uint8Array(N);   // sf: 0 unused, 1 valid, 2 inside geometry; +4 gather point; +8 open sky above
  const put = (i, x, y, z, nx, ny, nz, g) => { sp[i * 3] = x; sp[i * 3 + 1] = y; sp[i * 3 + 2] = z; sn[i * 3] = nx; sn[i * 3 + 1] = ny; sn[i * 3 + 2] = nz; sf[i] = (inside(x, y, z) ? 2 : 1) | (g ? 4 : 0); };
  for (let cz = 0; cz < G; cz++) for (let cx = 0; cx < G; cx++) { const c = cz * G + cx;
    if (floorOn[c]) for (let j = 0; j < FP; j++) for (let i = 0; i < FP; i++) { const px = cx * FP + i, py = cz * FP + j; put((FC.y + py) * AWd + FC.x + px, (px + 0.5) / FP * CS, floorY[c] + 0.015, (py + 0.5) / FP * CS, 0, 1, 0, !(px & 1) && !(py & 1)); }
    if (ceilOn[c]) for (let j = 0; j < CP; j++) for (let i = 0; i < CP; i++) { const px = cx * CP + i, py = cz * CP + j; put((CC.y + py) * AWd + CC.x + px, (px + 0.5) / CP * CS, ceilY[c] - 0.015, (py + 0.5) / CP * CS, 0, -1, 0, !(px & 1) && !(py & 1)); } }
  W.runs.forEach((r, ri) => { const R = runInfo[ri], cc = R.c;
    for (let px = 0; px < cc.w; px++) { const u = (px + 0.5) / WP, f = r.faces[Math.min(r.faces.length - 1, Math.floor(u / CS))]; if (f.kind === "window") continue;
      for (let py = 0; py < cc.h; py++) put((cc.y + py) * AWd + cc.x + px, R.ox + R.rx * u + R.nx * 0.015, (py + 0.5) * cc.hm / cc.h, R.oz + R.rz * u + R.nz * 0.015, R.nx, 0, R.nz, !(px & 1) && !(py & 1)); } });
  for (let v = 0; v < NV; v++) put(NA + v, W.vl.p[v * 3], W.vl.p[v * 3 + 1], W.vl.p[v * 3 + 2], W.vl.n[v * 3], W.vl.n[v * 3 + 1], W.vl.n[v * 3 + 2], true);
  return { W, G, CS, N, NA, NV, AWd, AHd, sp, sn, sf, trace, blocked, hit, sampleAt, albOfHit, skyL, L, cellL, pairs, ceilY, floorY, inside, S, rows: mapRows };
}

// ---------------------------------------------------------------- the work a thread does for a slice of samples
function runSlice(C, job, sh) {
  const { W, G, CS, sp, sn, sf, trace, blocked, hit, sampleAt, albOfHit, skyL, L, cellL, ceilY } = C, fast = job.fast;
  const Ed = new Float32Array(sh.Ed), Ei = new Float32Array(sh.Ei), En = new Float32Array(sh.En), Sv = new Float32Array(sh.Sv), Dm = new Float32Array(sh.Dm);
  const sun = W.sun, sE = sun ? sun.E : [0, 0, 0], sd = sun ? sun.dir : [0, 1, 0], tmp = [0, 0, 0], al = [0, 0, 0];
  let seed = (job.a * 2654435761 + job.pass * 97) >>> 0; const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
  // orthonormal basis around the sun for the soft-shadow jitter
  const st = Math.abs(sd[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], t1 = [st[1] * sd[2] - st[2] * sd[1], st[2] * sd[0] - st[0] * sd[2], st[0] * sd[1] - st[1] * sd[0]], tl = Math.hypot(t1[0], t1[1], t1[2]); t1[0] /= tl; t1[1] /= tl; t1[2] /= tl;
  const t2 = [sd[1] * t1[2] - sd[2] * t1[1], sd[2] * t1[0] - sd[0] * t1[2], sd[0] * t1[1] - sd[1] * t1[0]];
  let rays = 0;
  for (let i = job.a; i < job.b; i++) {
    if ((sf[i] & 3) !== 1) continue;
    const px = sp[i * 3], py = sp[i * 3 + 1], pz = sp[i * 3 + 2], nx = sn[i * 3], ny = sn[i * 3 + 1], nz = sn[i * 3 + 2];
    const cell = Math.max(0, Math.min(G - 1, Math.floor(pz / CS))) * G + Math.max(0, Math.min(G - 1, Math.floor(px / CS)));
    if (job.pass === 0) {
      // ---- direct light from every fixture and window that reaches this cell
      let er = 0, eg = 0, eb = 0, mx = 0, my = 0, mz = 0; const list = cellL[cell];
      for (let q = 0; q < list.length; q++) {
        const l = L[list[q]], cx = l.c[0] - px, cy = l.c[1] - py, cz = l.c[2] - pz, d2 = cx * cx + cy * cy + cz * cz, d = Math.sqrt(d2);
        if (l.range && d > l.range) continue;
        if (nx * cx + ny * cy + nz * cz + l.ext < 0) continue;
        const cl0 = -(l.n[0] * cx + l.n[1] * cy + l.n[2] * cz); if (!l.two && cl0 + l.ext < 0) continue;
        const om = l.area * Math.max(0.15, Math.abs(cl0) / (d + 1e-6)) / Math.max(d2, 0.05), m = fast ? (om > 0.05 ? 2 : 1) : om > 0.35 ? 5 : om > 0.06 ? 4 : om > 0.01 ? 3 : om > 0.0015 ? 2 : 1, ns = m * m;
        const win = l.range ? Math.pow(Math.max(0, 1 - Math.pow(d / l.range, 4)), 2) : 1, wA = l.area / ns * win;
        for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) {
          const s = ((a + rnd()) / m) * 2 - 1, t = ((b + rnd()) / m) * 2 - 1;
          const qx = cx + l.u[0] * s + l.v[0] * t, qy = cy + l.u[1] * s + l.v[1] * t, qz = cz + l.u[2] * s + l.v[2] * t, r2 = qx * qx + qy * qy + qz * qz, r = Math.sqrt(r2), wx = qx / r, wy = qy / r, wz = qz / r;
          const cp = nx * wx + ny * wy + nz * wz; if (cp <= 0) continue;
          let clq = -(l.n[0] * wx + l.n[1] * wy + l.n[2] * wz); if (l.two) clq = Math.abs(clq); if (clq <= 0) continue;
          rays++; if (blocked(px, py, pz, wx, wy, wz, r - 0.02)) continue;
          let w = cp * clq * wA / Math.max(r2, 0.02), Lr, Lg, Lb;
          if (l.portal) { skyL(wx, wy, wz, tmp); Lr = tmp[0] * 0.88; Lg = tmp[1] * 0.9; Lb = tmp[2] * 0.9; } else { Lr = l.L[0]; Lg = l.L[1]; Lb = l.L[2]; if (l.spot) w *= Math.pow(clq, l.spot); }
          er += Lr * w; eg += Lg * w; eb += Lb * w; const lm = (Lr * 0.2126 + Lg * 0.7152 + Lb * 0.0722) * w; mx += wx * lm; my += wy * lm; mz += wz * lm;
        }
      }
      Ed[i * 3] = er; Ed[i * 3 + 1] = eg; Ed[i * 3 + 2] = eb; Dm[i * 4] = mx; Dm[i * 4 + 1] = my; Dm[i * 4 + 2] = mz; Dm[i * 4 + 3] = er * 0.2126 + eg * 0.7152 + eb * 0.0722;
      // ---- sun visibility (soft: jittered inside the sun's disc)
      let vis = 0;
      if (sun && nx * sd[0] + ny * sd[1] + nz * sd[2] > 0.01) {
        let n = 0, lit = 0; const NS = fast ? 4 : 16;
        for (let k = 0; k < NS; k++) { const rr = Math.sqrt((k + rnd()) / NS) * sun.ang, a = rnd() * 2 * PI, ca = Math.cos(a) * rr, sa = Math.sin(a) * rr; let dx = sd[0] + t1[0] * ca + t2[0] * sa, dy = sd[1] + t1[1] * ca + t2[1] * sa, dz = sd[2] + t1[2] * ca + t2[2] * sa; const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
          rays++; n++; if (!blocked(px, py, pz, dx, dy, dz, 400)) lit++; if (k === 5 && (lit === 0 || lit === 6)) break; }
        vis = lit / n;
      }
      Sv[i] = vis;
    } else {
      // ---- one bounce of indirect light: cosine-weighted rays, read the light already stored where they land
      if (!(sf[i] & 4)) continue;
      const K = job.k, KK = K * K, open = ceilY[cell] > 1e8;
      const hx = Math.abs(nx) < 0.9 ? 1 : 0, hy = hx ? 0 : 1; let ux = hy * nz - 0 * ny, uy = 0 * nx - hx * nz, uz = hx * ny - hy * nx; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
      const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux, rot = rnd() * 2 * PI, cr = Math.cos(rot), sr = Math.sin(rot);
      let er = 0, eg = 0, eb = 0, mx = 0, my = 0, mz = 0, ml = 0;
      for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) {
        const r1 = (a + rnd()) / K, r2 = (b + rnd()) / K, rr = Math.sqrt(r1), ph = 2 * PI * r2, lx0 = rr * Math.cos(ph), ly0 = rr * Math.sin(ph), lx = lx0 * cr - ly0 * sr, ly = lx0 * sr + ly0 * cr, lz = Math.sqrt(Math.max(0, 1 - r1));
        const dx = ux * lx + vx * ly + nx * lz, dy = uy * lx + vy * ly + ny * lz, dz = uz * lx + vz * ly + nz * lz;
        rays++; const t = trace(px, py, pz, dx, dy, dz, 300, false);
        let Lr = 0, Lg = 0, Lb = 0;
        if (hit.kind === 0) { if (open || W.outdoor) { skyL(dx, dy, dz, tmp); Lr = tmp[0]; Lg = tmp[1]; Lb = tmp[2]; } }
        else {
          const hk = hit.kind, hf = hit.face, j = sampleAt(px + dx * t, py + dy * t, pz + dz * t); albOfHit(al);
          if (j >= 0 && (sf[j] & 3) === 1) {
            // sunlight the surface receives is bounced as well
            const hnx = hk === 3 ? (hf === 0 ? 1 : hf === 1 ? -1 : 0) : 0, hny = hk === 1 ? 1 : hk === 2 ? -1 : (hf === 2 ? 1 : hf === 3 ? -1 : 0), hnz = hk === 3 ? (hf === 4 ? 1 : hf === 5 ? -1 : 0) : 0;
            const sk = Sv[j] * Math.max(0, hnx * sd[0] + hny * sd[1] + hnz * sd[2]);
            Lr = al[0] * (Ed[j * 3] + Ei[j * 3] + sE[0] * sk) / PI; Lg = al[1] * (Ed[j * 3 + 1] + Ei[j * 3 + 1] + sE[1] * sk) / PI; Lb = al[2] * (Ed[j * 3 + 2] + Ei[j * 3 + 2] + sE[2] * sk) / PI;
          }
          if (hk === 3) { const e = W.occ.em; Lr += e[hit.idx * 3]; Lg += e[hit.idx * 3 + 1]; Lb += e[hit.idx * 3 + 2]; }
        }
        er += Lr; eg += Lg; eb += Lb; const lm = Lr * 0.2126 + Lg * 0.7152 + Lb * 0.0722; mx += dx * lm; my += dy * lm; mz += dz * lm; ml += lm;
      }
      const s = PI / KK; En[i * 3] = er * s; En[i * 3 + 1] = eg * s; En[i * 3 + 2] = eb * s;
      if (job.last) { Dm[i * 4] += mx * s; Dm[i * 4 + 1] += my * s; Dm[i * 4 + 2] += mz * s; Dm[i * 4 + 3] += ml * s; }
    }
  }
  return rays;
}

// light probes for moving objects: L1 spherical harmonics of everything but the sun, plus how much of the sun reaches the spot
function bakeProbes(C, E, Sv, fast) {
  const { W, G, CS, trace, blocked, hit, sampleAt, albOfHit, skyL, L, cellL, ceilY, floorY, inside, sf } = C, PS = W.ps || 2, PN = Math.ceil(G * CS / PS), out = new Float32Array(PN * PN * 13), tmp = [0, 0, 0], al = [0, 0, 0];
  const sun = W.sun, sd = sun ? sun.dir : [0, 1, 0], sE = sun ? sun.E : [0, 0, 0], K = fast ? 64 : 320, GA = PI * (3 - Math.sqrt(5));
  for (let pz = 0; pz < PN; pz++) for (let px = 0; px < PN; px++) {
    const x = Math.min(G * CS - 0.01, (px + 0.5) * PS), z = Math.min(G * CS - 0.01, (pz + 0.5) * PS), cell = Math.floor(z / CS) * G + Math.floor(x / CS), y = Math.max(0, floorY[cell]) + 1.25, o = (pz * PN + px) * 13;
    if (inside(x, y, z)) { out[o + 12] = -1; continue; }
    const sh = new Float64Array(12), open = ceilY[cell] > 1e8;
    for (let k = 0; k < K; k++) { // even directions on the sphere
      const dy = 1 - 2 * (k + 0.5) / K, r = Math.sqrt(1 - dy * dy), a = k * GA, dx = Math.cos(a) * r, dz = Math.sin(a) * r, t = trace(x, y, z, dx, dy, dz, 300, false); let Lr = 0, Lg = 0, Lb = 0;
      if (hit.kind === 0) { if (open || W.outdoor) { skyL(dx, dy, dz, tmp); Lr = tmp[0]; Lg = tmp[1]; Lb = tmp[2]; } }
      else { const hk = hit.kind, hf = hit.face, j = sampleAt(x + dx * t, y + dy * t, z + dz * t); albOfHit(al);
        if (j >= 0 && (sf[j] & 3) === 1) { const hnx = hk === 3 ? (hf === 0 ? 1 : hf === 1 ? -1 : 0) : 0, hny = hk === 1 ? 1 : hk === 2 ? -1 : (hf === 2 ? 1 : hf === 3 ? -1 : 0), hnz = hk === 3 ? (hf === 4 ? 1 : hf === 5 ? -1 : 0) : 0, sk = Sv[j] * Math.max(0, hnx * sd[0] + hny * sd[1] + hnz * sd[2]);
          Lr = al[0] * (E[j * 3] + sE[0] * sk) / PI; Lg = al[1] * (E[j * 3 + 1] + sE[1] * sk) / PI; Lb = al[2] * (E[j * 3 + 2] + sE[2] * sk) / PI; } }
      const w = 4 * PI / K, Y = [0.282095, 0.488603 * dy, 0.488603 * dz, 0.488603 * dx];
      for (let m = 0; m < 4; m++) { sh[m * 3] += Lr * Y[m] * w; sh[m * 3 + 1] += Lg * Y[m] * w; sh[m * 3 + 2] += Lb * Y[m] * w; }
    }
    // fixtures and windows are too small to find with a few hundred rays: add them one by one
    for (const li of cellL[cell]) { const l = L[li], m = 3;
      for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) { const s = ((a + 0.5) / m) * 2 - 1, t = ((b + 0.5) / m) * 2 - 1, qx = l.c[0] + l.u[0] * s + l.v[0] * t - x, qy = l.c[1] + l.u[1] * s + l.v[1] * t - y, qz = l.c[2] + l.u[2] * s + l.v[2] * t - z, r2 = qx * qx + qy * qy + qz * qz, r = Math.sqrt(r2), wx = qx / r, wy = qy / r, wz = qz / r;
        if (l.range && r > l.range) continue; let clq = -(l.n[0] * wx + l.n[1] * wy + l.n[2] * wz); if (l.two) clq = Math.abs(clq); if (clq <= 0) continue; if (blocked(x, y, z, wx, wy, wz, r - 0.02)) continue;
        let w = clq * l.area / (m * m) / Math.max(r2, 0.25) * (l.range ? Math.pow(Math.max(0, 1 - Math.pow(r / l.range, 4)), 2) : 1), Lr, Lg, Lb; if (l.portal) { skyL(wx, wy, wz, tmp); Lr = tmp[0] * 0.88; Lg = tmp[1] * 0.9; Lb = tmp[2] * 0.9; } else { Lr = l.L[0]; Lg = l.L[1]; Lb = l.L[2]; if (l.spot) w *= Math.pow(clq, l.spot); }
        const Y = [0.282095, 0.488603 * wy, 0.488603 * wz, 0.488603 * wx]; for (let q = 0; q < 4; q++) { sh[q * 3] += Lr * Y[q] * w; sh[q * 3 + 1] += Lg * Y[q] * w; sh[q * 3 + 2] += Lb * Y[q] * w; } } }
    // pre-multiply by the cosine lobe so the shader only needs sh0 + sh1 . n
    for (let c = 0; c < 3; c++) { out[o + c] = sh[c] * 0.886227; out[o + 3 + c] = sh[9 + c] * 1.023328; out[o + 6 + c] = sh[3 + c] * 1.023328; out[o + 9 + c] = sh[6 + c] * 1.023328; }
    let lit = 0, n = 0; if (sun) for (const [ax, ay, az] of [[0, 0, 0], [0.7, -0.5, 0], [-0.7, 0.4, 0], [0, -0.3, 0.7], [0, 0.3, -0.7], [0.5, -0.9, 0.5], [-0.5, -0.9, -0.5]]) { if (inside(x + ax, y + ay, z + az)) continue; n++; if (!blocked(x + ax, y + ay, z + az, sd[0], sd[1], sd[2], 400)) lit++; }
    out[o + 12] = n ? lit / n : 0;
  }
  return out;
}

// ---------------------------------------------------------------- worker thread
if (!isMainThread) {
  const C = setup(workerData.id);
  parentPort.on("message", (job) => { const rays = runSlice(C, job, workerData.sh); parentPort.postMessage({ done: job.n, rays }); });
  parentPort.postMessage({ ready: true });
} else if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });

// ---------------------------------------------------------------- main thread: orchestrate passes, post-process, write files
async function main() {
  const args = process.argv.slice(2), ids = args.filter(a => !a.startsWith("--")), fast = args.includes("--fast");
  const dbg = (args.find(a => a.startsWith("--debug=")) || "").slice(8), threads = +(args.find(a => a.startsWith("--threads=")) || "").slice(10) || Math.max(1, os.cpus().length);
  const L0 = require("./world.js").load(), maps = ids[0] === "all" || !ids.length ? Object.keys(L0.OPS_MAPS).concat(Object.keys(L0.RC_TRACKS).map(k => "rc-" + k)) : ids;
  for (const id of maps) await bakeMap(id, fast, dbg, threads);
}
async function bakeMap(id, fast, dbg, threads) {
  const sharp = require("sharp"), T0 = Date.now(), C = setup(id), { W, N, NA, NV, AWd, AHd, sf } = C;
  const used = sf.reduce((s, v) => s + ((v & 3) === 1 ? 1 : 0), 0), bad = sf.reduce((s, v) => s + ((v & 3) === 2 ? 1 : 0), 0);
  console.log(`[${id}] atlas ${AWd}x${AHd}, ${used} samples (${NV} vertex), ${bad} inside geometry, ${W.occ.n} solids, ${C.L.length} lights, ${C.pairs} cell-light pairs, ${threads} threads`);
  const mk = (n) => new SharedArrayBuffer(n * 4), sh = { Ed: mk(N * 3), Ei: mk(N * 3), En: mk(N * 3), Sv: mk(N), Dm: mk(N * 4) };
  const Ed = new Float32Array(sh.Ed), Ei = new Float32Array(sh.Ei), En = new Float32Array(sh.En), Sv = new Float32Array(sh.Sv), Dm = new Float32Array(sh.Dm);
  const workers = await Promise.all(Array.from({ length: threads }, () => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: { id, sh } }); w.once("message", () => res(w)); w.once("error", rej); })));
  const runPass = (pass, extra) => new Promise((res) => {
    const CH = 4096, jobs = []; for (let a = 0; a < N; a += CH) jobs.push(Object.assign({ pass, a, b: Math.min(N, a + CH), fast, n: jobs.length }, extra));
    let next = 0, left = jobs.length, rays = 0; const feed = (w) => { if (next < jobs.length) w.postMessage(jobs[next++]); };
    workers.forEach(w => { w.removeAllListeners("message"); w.on("message", (m) => { rays += m.rays; if (--left === 0) res(rays); else feed(w); }); feed(w); });
  });
  // chart-aware helpers on the atlas
  const charts = W.charts.filter(c => c.w > 0 && c.kind !== "black");
  const fillGather = (A, ch) => { // gather points sit on even texels of every chart: fill the others from their neighbours
    for (const c of charts) for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const i = (c.y + y) * AWd + c.x + x; if ((sf[i] & 3) !== 1 || (sf[i] & 4)) continue;
      const x0 = x & ~1, y0 = y & ~1, x1 = Math.min(x0 + 2, (c.w - 1) & ~1), y1 = Math.min(y0 + 2, (c.h - 1) & ~1), fx = x1 > x0 ? (x - x0) / 2 : 0, fy = y1 > y0 ? (y - y0) / 2 : 0; let ws = 0; const acc = [0, 0, 0, 0];
      for (const [qx, qy, w] of [[x0, y0, (1 - fx) * (1 - fy)], [x1, y0, fx * (1 - fy)], [x0, y1, (1 - fx) * fy], [x1, y1, fx * fy]]) { const j = (c.y + qy) * AWd + c.x + qx; if (w <= 0 || (sf[j] & 7) !== 5) continue; ws += w; for (let k = 0; k < ch; k++) acc[k] += A[j * ch + k] * w; }
      if (ws > 0) for (let k = 0; k < ch; k++) A[i * ch + k] = acc[k] / ws; else { // no valid gather neighbour: nearest valid one in a small window
        let bd = 1e9, bj = -1; for (let qy = Math.max(0, y - 4); qy <= Math.min(c.h - 1, y + 4); qy++) for (let qx = Math.max(0, x - 4); qx <= Math.min(c.w - 1, x + 4); qx++) { const j = (c.y + qy) * AWd + c.x + qx; if ((sf[j] & 7) !== 5) continue; const d = (qx - x) * (qx - x) + (qy - y) * (qy - y); if (d < bd) { bd = d; bj = j; } }
        if (bj >= 0) for (let k = 0; k < ch; k++) A[i * ch + k] = A[bj * ch + k]; } } };
  const blur = (A, ch, rad) => { const B = new Float32Array(A.length); B.set(A); // small blur inside each chart, valid texels only
    for (const c of charts) for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const i = (c.y + y) * AWd + c.x + x; if ((sf[i] & 3) !== 1) continue; let ws = 0; const acc = [0, 0, 0, 0];
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const qx = x + dx, qy = y + dy; if (qx < 0 || qy < 0 || qx >= c.w || qy >= c.h) continue; const j = (c.y + qy) * AWd + c.x + qx; if ((sf[j] & 3) !== 1) continue; const w = (dx === 0 && dy === 0) ? 4 : (dx === 0 || dy === 0) ? 2 : 1; ws += w; for (let k = 0; k < ch; k++) acc[k] += A[j * ch + k] * w; }
      for (let k = 0; k < ch; k++) B[i * ch + k] = acc[k] / ws; }
    A.set(B); };
  // vertex samples that ended up inside geometry take the mean of the good ones on the same face
  const fixVerts = (A, ch) => { const g = W.vl.g; let v = 0; while (v < NV) { let e = v; while (e < NV && g[e] === g[v]) e++; let n = 0; const acc = [0, 0, 0, 0]; for (let q = v; q < e; q++) if ((sf[NA + q] & 3) === 1) { n++; for (let k = 0; k < ch; k++) acc[k] += A[(NA + q) * ch + k]; } if (n) for (let q = v; q < e; q++) if ((sf[NA + q] & 3) !== 1) for (let k = 0; k < ch; k++) A[(NA + q) * ch + k] = acc[k] / n; v = e; } };

  let t = Date.now(), rays = await runPass(0, {}); console.log(`  direct + sun: ${((Date.now() - t) / 1000).toFixed(1)} s, ${(rays / 1e6).toFixed(1)} M rays`);
  blur(Ed, 3, 1); blur(Sv, 1, 1); fixVerts(Ed, 3); fixVerts(Sv, 1);
  const bounces = fast ? 1 : 3;
  for (let bnc = 0; bnc < bounces; bnc++) {
    t = Date.now(); rays = await runPass(1 + bnc, { k: fast ? 6 : bnc === 0 ? 12 : 9, last: bnc === bounces - 1 });
    fillGather(En, 3); blur(En, 3, 1); fixVerts(En, 3); Ei.set(En);
    console.log(`  bounce ${bnc + 1}: ${((Date.now() - t) / 1000).toFixed(1)} s, ${(rays / 1e6).toFixed(1)} M rays`);
  }
  fillGather(Dm, 4); fixVerts(Dm, 4);
  await Promise.all(workers.map(w => w.terminate()));
  const E = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) E[i] = Ed[i] + Ei[i];
  t = Date.now(); const probes = bakeProbes(C, E, Sv, fast); console.log(`  probes: ${((Date.now() - t) / 1000).toFixed(1)} s`);

  { // how bright is each kind of area? (floor irradiance; the look is tuned for about 2 - 3 where people walk)
    const F = W.charts[1], FP = W.FP, G = W.G, zs = {}, lum = (i) => E[i * 3] * 0.2126 + E[i * 3 + 1] * 0.7152 + E[i * 3 + 2] * 0.0722;
    for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) { const ch = C.rows[z][x], zn = ch === "#" ? (W.cell.floorOn[z * G + x] ? "terrace" : null) : ch === "a" || ch === "b" ? "site " + ch : ch === "r" ? "red spawn" : ch === "u" ? "blue spawn" : "hall"; if (!zn) continue;
      const q = zs[zn] || (zs[zn] = { n: 0, e: 0, s: 0, lo: 1e9, hi: 0 }); let ce = 0, cn = 0;
      for (let v = 0; v < FP; v += 2) for (let u = 0; u < FP; u += 2) { const i = (F.y + z * FP + v) * AWd + F.x + x * FP + u; if ((sf[i] & 3) !== 1) continue; ce += lum(i); cn++; q.s += Sv[i]; }
      if (cn) { q.n += cn; q.e += ce; q.lo = Math.min(q.lo, ce / cn); q.hi = Math.max(q.hi, ce / cn); } }
    console.log("  floor light: " + Object.keys(zs).map(k => `${k} ${(zs[k].e / zs[k].n).toFixed(2)} (cells ${zs[k].lo.toFixed(1)}..${zs[k].hi.toFixed(1)}, sun ${(zs[k].s / zs[k].n * 100).toFixed(0)}%)`).join("; "));
    let pn = 0, pe = 0; for (let i = 0; i < probes.length; i += 13) { if (probes[i + 12] < 0) continue; pn++; pe += probes[i] * 0.2126 + probes[i + 1] * 0.7152 + probes[i + 2] * 0.0722; }
    console.log(`  probes: ${pn} valid, mean ${(pe / pn).toFixed(2)}`);
  }

  // ---- encode. Unused texels are filled outwards from used ones so bilinear filtering never picks up black.
  const a8 = new Uint8Array(NA * 4), valid = new Uint8Array(NA), enc = (v) => Math.max(0, Math.min(255, Math.round(Math.sqrt(Math.min(1, v / LM_SCALE)) * 255)));
  for (let i = 0; i < NA; i++) { if ((sf[i] & 3) === 0) continue; valid[i] = 1; a8[i * 4] = enc(E[i * 3]); a8[i * 4 + 1] = enc(E[i * 3 + 1]); a8[i * 4 + 2] = enc(E[i * 3 + 2]); a8[i * 4 + 3] = Math.round(Math.max(0, Math.min(1, Sv[i])) * 255); }
  // texels inside geometry: treat as unknown and let the neighbours flow in
  for (let i = 0; i < NA; i++) if ((sf[i] & 3) === 2) valid[i] = 0;
  const b8 = new Uint8Array(NA * 4);
  for (let i = 0; i < NA; i++) { if (!valid[i]) continue; const l = Math.hypot(Dm[i * 4], Dm[i * 4 + 1], Dm[i * 4 + 2]), tot = Dm[i * 4 + 3]; if (l < 1e-9 || tot < 1e-9) { b8[i * 4] = b8[i * 4 + 1] = b8[i * 4 + 2] = 128; continue; }
    b8[i * 4] = Math.round((Dm[i * 4] / l * 0.5 + 0.5) * 255); b8[i * 4 + 1] = Math.round((Dm[i * 4 + 1] / l * 0.5 + 0.5) * 255); b8[i * 4 + 2] = Math.round((Dm[i * 4 + 2] / l * 0.5 + 0.5) * 255); b8[i * 4 + 3] = Math.round(Math.min(1, l / tot) * 255); }
  const dilate = (img, rounds) => { let v = valid.slice(); for (let r = 0; r < rounds; r++) { const nv = v.slice(); for (let y = 0; y < AHd; y++) for (let x = 0; x < AWd; x++) { const i = y * AWd + x; if (v[i]) continue; let n = 0, a0 = 0, a1 = 0, a2 = 0, a3 = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const qx = x + dx, qy = y + dy; if (qx < 0 || qy < 0 || qx >= AWd || qy >= AHd) continue; const j = qy * AWd + qx; if (!v[j]) continue; n++; a0 += img[j * 4]; a1 += img[j * 4 + 1]; a2 += img[j * 4 + 2]; a3 += img[j * 4 + 3]; } if (n) { img[i * 4] = a0 / n; img[i * 4 + 1] = a1 / n; img[i * 4 + 2] = a2 / n; img[i * 4 + 3] = a3 / n; nv[i] = 1; } } v = nv; } };
  dilate(a8, 6); dilate(b8, 6);
  // the black block every vertex-lit vertex points at
  const K0 = W.charts[0]; for (let y = -1; y < K0.h + 1; y++) for (let x = -1; x < K0.w + 1; x++) { const i = (K0.y + y) * AWd + K0.x + x; if (i < 0 || i >= NA) continue; a8[i * 4] = a8[i * 4 + 1] = a8[i * 4 + 2] = a8[i * 4 + 3] = 0; b8[i * 4] = b8[i * 4 + 1] = b8[i * 4 + 2] = 128; b8[i * 4 + 3] = 0; }
  const out = path.join(__dirname, "../server/public/models");
  await sharp(Buffer.from(a8.buffer), { raw: { width: AWd, height: AHd, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(out, `lm-${id}-a.png`));
  await sharp(Buffer.from(b8.buffer), { raw: { width: AWd, height: AHd, channels: 4 } }).resize(AWd >> 1, AHd >> 1, { kernel: "linear" }).png({ compressionLevel: 9 }).toFile(path.join(out, `lm-${id}-b.png`));
  const v8 = new Uint8Array(NV * 4); for (let v = 0; v < NV; v++) { const i = NA + v; v8[v * 4] = enc(E[i * 3]); v8[v * 4 + 1] = enc(E[i * 3 + 1]); v8[v * 4 + 2] = enc(E[i * 3 + 2]); v8[v * 4 + 3] = Math.round(Math.max(0, Math.min(1, Sv[i])) * 255); }
  const head = Buffer.from(JSON.stringify({ sig: W.sig, ver: W.ver, aw: AWd, ah: AHd, nv: NV, scale: LM_SCALE, pn: Math.ceil(W.G * W.CS / (W.ps || 2)), ps: W.ps || 2, fast: fast ? 1 : 0 })), pad = (4 - head.length % 4) % 4, hb = Buffer.alloc(8);
  hb.write("NXLM", 0, "ascii"); hb.writeUInt32LE(head.length + pad, 4);
  fs.writeFileSync(path.join(out, `lm-${id}.bin`), Buffer.concat([hb, head, Buffer.alloc(pad, 32), Buffer.from(v8.buffer), Buffer.from(probes.buffer)]));
  const sz = (f) => (fs.statSync(path.join(out, f)).size / 1024).toFixed(0) + " KB";
  console.log(`  wrote lm-${id}-a.png ${sz(`lm-${id}-a.png`)}, lm-${id}-b.png ${sz(`lm-${id}-b.png`)}, lm-${id}.bin ${sz(`lm-${id}.bin`)}  total ${((Date.now() - T0) / 1000).toFixed(1)} s`);
  if (dbg) { // top-down view of the floor with the sun added, tone mapped, for a quick look without a browser
    const F = W.charts[1], img = Buffer.alloc(F.w * F.h * 3), sun = W.sun, tm = (v) => { v *= 0.3 / PI * 1.6; v = v * (2.51 * v + 0.03) / (v * (2.43 * v + 0.59) + 0.14); return Math.round(Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2) * 255); };
    for (let y = 0; y < F.h; y++) for (let x = 0; x < F.w; x++) { const i = (F.y + y) * AWd + F.x + x, o = (y * F.w + x) * 3, s = sun ? Sv[i] * sun.dir[1] : 0; if ((sf[i] & 3) !== 1) continue; for (let c = 0; c < 3; c++) img[o + c] = tm(E[i * 3 + c] + (sun ? sun.E[c] * s : 0)); }
    fs.mkdirSync(dbg, { recursive: true }); await sharp(img, { raw: { width: F.w, height: F.h, channels: 3 } }).png().toFile(path.join(dbg, `bake-${id}-floor.png`));
    await sharp(Buffer.from(a8.buffer), { raw: { width: AWd, height: AHd, channels: 4 } }).removeAlpha().png().toFile(path.join(dbg, `bake-${id}-atlas.png`));
  }
}
