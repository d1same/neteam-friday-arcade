// ======================= NX world generator =======================
// Turns a shooter map grid (4 m cells) into real architecture: lightmapped floors, ceilings and walls, detail geometry
// (trims, frames, fixtures, furniture), light sources and the simplified solids the light baker traces against.
// Pure data, no THREE and no DOM: the browser builds meshes from it (13-nx-scene.js) and tools/bake.js runs the very
// same code in Node to pre-compute the lighting. Everything here must be deterministic: no Math.random, no Date.
const NXW = (() => {
  const CS = 4;            // metres per grid cell
  const FP = 32, CP = 16;  // lightmap texels per cell on floors / ceilings (12.5 cm / 25 cm)
  const WP = 8;            // lightmap texels per metre on walls
  const AW = 2048;         // lightmap atlas width
  const VER = 1;           // bump when the generator changes shape (old bakes are then ignored)
  const PX = 1, NX_ = 2, PY = 4, NY = 8, PZ = 16, NZ = 32, ALL = 63;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // ---- small deterministic helpers
  const hash = (a, b, c) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  const strSeed = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; };
  class Buf { constructor(T, n) { this.T = T; this.a = new T(n || 1024); this.n = 0; }
    need(k) { if (this.n + k > this.a.length) { const b = new this.T(Math.max(this.a.length * 2, this.n + k)); b.set(this.a); this.a = b; } }
    push2(a, b) { this.need(2); const d = this.a; d[this.n++] = a; d[this.n++] = b; }
    push3(a, b, c) { this.need(3); const d = this.a; d[this.n++] = a; d[this.n++] = b; d[this.n++] = c; }
    push1(a) { this.need(1); this.a[this.n++] = a; }
    done() { return this.a.subarray(0, this.n); } }

  // ---- materials. t = scanned texture set (NX_TEX), c = tint, s = metres per tile (default: the scan's real size),
  // r/m = roughness / metalness multipliers (or plain values when there is no texture), e = emissive radiance,
  // kind: "glass" | "emit" | "decal" | "sky" changes how the browser draws it
  const MATS = {
    // office
    o_wall: { t: "paintwall", c: [0.93, 0.92, 0.9] }, o_wall2: { t: "paintwall", c: [0.48, 0.53, 0.58] }, o_wallDark: { t: "paintwall", c: [0.2, 0.22, 0.25] },
    o_brick: { t: "brick2", s: 2.4 }, o_conc: { t: "concrete", c: [0.9, 0.9, 0.92] }, o_oak: { t: "oak", s: 1.6 }, o_walnut: { t: "wood", c: [1.6, 1.5, 1.4], s: 1.5 },
    o_floor: { t: "concfloor", c: [1.7, 1.7, 1.73], r: 0.7 }, o_carpet: { t: "carpet", c: [2.2, 2.2, 2.3], s: 1.5 }, o_lobby: { t: "granite", c: [1.25, 1.4, 1.6], s: 2.4, r: 0.17 },
    o_tile: { t: "bigtiles", c: [1.1, 1.12, 1.15], s: 2.4, r: 0.6 }, o_raised: { t: "tiles", c: [0.2, 0.21, 0.23], s: 4.8, r: 5 },
    o_ceil: { t: "paintconc", c: [1.5, 1.5, 1.55] }, o_ceilTile: { t: "ceiltile", c: [1.7, 1.8, 1.9], s: 2.4 },
    o_felt: { t: "fabric", c: [2.6, 2.6, 2.5], s: 0.5 }, o_feltDark: { t: "fabric", c: [0.5, 0.55, 0.65], s: 0.5 }, o_leather: { t: "leather", c: [0.9, 0.9, 0.9], s: 0.6 },
    o_marble: { t: "marble", c: [0.9, 0.9, 0.9], r: 0.6 },
    // data centre
    f_floor: { t: "tiles", c: [0.22, 0.23, 0.25], s: 4.8, r: 4.2 }, f_dock: { t: "concfloor", c: [1.9, 1.9, 1.93], r: 0.62 }, f_wallLo: { t: "concrete2", c: [0.82, 0.84, 0.88] }, f_wallHi: { t: "corrugated", c: [0.5, 0.53, 0.58], r: 0.9 },
    f_ceil: { t: "corrugated", c: [0.42, 0.44, 0.47] }, f_pod: { t: "darkmetal", c: [0.75, 0.78, 0.84], m: 1 }, f_blue: { t: "bluemetal", c: [0.9, 1, 1.15], m: 0.8 }, f_shutter: { t: "shutter", c: [0.92, 0.94, 0.97], m: 0.9 },
    f_yellow: { c: [0.72, 0.5, 0.04], r: 0.5, m: 0 }, f_pipeBlue: { c: [0.05, 0.16, 0.42], r: 0.4, m: 0.2 }, f_pipeRed: { c: [0.5, 0.05, 0.04], r: 0.4, m: 0.2 }, f_grey: { c: [0.42, 0.44, 0.47], r: 0.55, m: 0.1 },
    // generic
    trimBlack: { c: [0.03, 0.032, 0.036], r: 0.42, m: 0.85 }, trimSteel: { t: "brushed", c: [0.6, 0.61, 0.63], r: 1.1, m: 1 }, trimWhite: { c: [0.8, 0.8, 0.78], r: 0.5, m: 0 },
    darkMetal: { t: "darkmetal", c: [1, 1, 1], m: 1 }, plasticBlack: { c: [0.025, 0.026, 0.03], r: 0.45, m: 0 }, plasticGrey: { t: "plastic", c: [0.35, 0.36, 0.38] }, plasticWhite: { t: "plastic", c: [0.9, 0.9, 0.9] },
    rubber: { t: "rubber" }, chrome: { c: [0.9, 0.9, 0.92], r: 0.12, m: 1 }, redPaint: { t: "redpaint", c: [0.8, 0.8, 0.8] },
    glass: { kind: "glass", c: [0.75, 0.86, 0.9], r: 0.04, m: 0, op: 0.16 }, glassFrost: { kind: "glass", c: [0.9, 0.95, 1], r: 0.55, m: 0, op: 0.62 }, glassDark: { kind: "glass", c: [0.25, 0.32, 0.38], r: 0.05, m: 0, op: 0.45 },
    // drawn at load into one canvas atlas: decal = lit by the baked light (signs, posters, floor paint), glow = self-lit (screens, LEDs)
    decal: { kind: "decal" }, glow: { kind: "glow", k: 1.6 }, glowHi: { kind: "glow", k: 5 },
  };
  const lightMat = (key, rgb, k) => { if (!MATS[key]) MATS[key] = { kind: "emit", c: [0.9, 0.9, 0.9], r: 0.5, m: 0, e: [rgb[0] * k, rgb[1] * k, rgb[2] * k] }; return key; };

  function build(id, M, env) {
    env = env || {};
    const TEX = env.tex || {}, rows = M.rows, G = rows.length, size = G * CS, theme = M.nx || M.theme;
    // a theme is a function with optional settings on it: outdoor (open sky), H (wall height), blockH(x, z, ctx) = height of a solid cell
    const TH = NXW.themes[theme] || NXW.themes.office, outdoor = !!TH.outdoor;
    const H = M.wallH || TH.H || 3.2;
    const W = { id, theme, G, H, size, outdoor, ver: VER, mats: {}, bat: {}, lights: [], fixtures: [], decals: [], sun: null, sky: null, dress: [] };
    const ch = (x, z) => (x < 0 || z < 0 || x >= G || z >= G) ? "#" : rows[z][x];
    const solid = (x, z) => ch(x, z) === "#";
    const inb = (x, z) => x >= 0 && z >= 0 && x < G && z < G;
    const border = (x, z) => x === 0 || z === 0 || x === G - 1 || z === G - 1;
    const ci = (x, z) => z * G + x;
    const seed = strSeed(id + ":" + VER);
    const hsh = (x, z, k) => hash(x + seed % 977, z + (seed >>> 10) % 991, k | 0);

    // ---- per-cell tables the baker reads: floor height, ceiling height (Infinity = open sky), surface colours
    const floorY = new Float32Array(G * G), ceilY = new Float32Array(G * G).fill(outdoor ? Infinity : H), floorOn = new Uint8Array(G * G), ceilOn = new Uint8Array(G * G);
    const alb = [[0, 0, 0]], albKey = { "0,0,0": 0 };
    const albIdx = (c) => { const k = c.map(v => Math.round(v * 500) / 500).join(","); if (albKey[k] == null) { albKey[k] = alb.length; alb.push(k.split(",").map(Number)); } return albKey[k]; };
    const floorAlb = new Uint16Array(G * G), ceilAlb = new Uint16Array(G * G);
    const matDef = (key) => { const m = MATS[key]; if (!m) throw new Error("NXW: unknown material " + key); if (!W.mats[key]) W.mats[key] = m; return m; };
    const matAlb = (key) => { const m = matDef(key), t = m.t && TEX[m.t], a = t ? t.a : [1, 1, 1], c = m.c || [1, 1, 1]; return [Math.min(0.9, a[0] * c[0]), Math.min(0.9, a[1] * c[1]), Math.min(0.9, a[2] * c[2])]; };
    const matScale = (key) => { const m = matDef(key), t = m.t && TEX[m.t]; return [m.s || (t ? t.s : 1), m.s ? m.s * (t ? t.sy / t.s : 1) : (t ? t.sy : 1)]; };

    // ---- render batches (one per material): positions, normals, uvs, lightmap uvs (in atlas pixels until finalised),
    // and per vertex the index of its baked light sample (-1 = lit by the lightmap instead)
    const batch = (key) => W.bat[key] || (matDef(key), W.bat[key] = { p: new Buf(Float32Array, 4096), n: new Buf(Float32Array, 4096), uv: new Buf(Float32Array, 4096), lm: new Buf(Float32Array, 4096), lc: new Buf(Int32Array, 2048), vi: new Buf(Int32Array, 2048), ix: new Buf(Uint32Array, 4096), nv: 0 });
    // vertex-light samples: position, normal, group (samples of one face share a group so broken ones can be repaired)
    const vlP = new Buf(Float32Array, 8192), vlN = new Buf(Float32Array, 8192), vlG = new Buf(Int32Array, 4096); let vlGroups = 0;
    // baker solids: boxes with per-face colour, lightmap chart and light sample
    const oB = new Buf(Float32Array, 4096), oAlb = new Buf(Uint16Array, 2048), oChart = new Buf(Int32Array, 2048), oVs = new Buf(Int32Array, 2048), oEm = new Buf(Float32Array, 2048); let oN = 0;
    const charts = [];

    function occ(x0, y0, z0, x1, y1, z1, a, em) {
      oB.push3(x0, y0, z0); oB.push3(x1, y1, z1); const ai = albIdx(a || [0.5, 0.5, 0.5]);
      for (let k = 0; k < 6; k++) { oAlb.push1(ai); oChart.push1(-1); oVs.push1(-1); }
      oEm.push3(em ? em[0] : 0, em ? em[1] : 0, em ? em[2] : 0); return oN++;
    }
    const FN = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    // one planar quad. P = corner, U and V edge vectors (U x V = normal). Lit by the lightmap (lm = [chart, u0, v0, u1, v1] in
    // chart pixels) or by baked vertex light (subdivided so gradients survive).
    function quad(key, px, py, pz, ux, uy, uz, vx, vy, vz, o) {
      o = o || {}; const b = batch(key), nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1, n0 = nx / nl, n1 = ny / nl, n2 = nz / nl;
      const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz), sc = o.fit ? null : matScale(key);
      const su = o.lm ? 1 : Math.max(1, Math.min(8, Math.ceil(lu / (o.seg || 1.1)))), sv = o.lm ? 1 : Math.max(1, Math.min(8, Math.ceil(lv / (o.seg || 1.1))));
      const base = b.nv, grp = o.lm ? -1 : vlGroups++;
      // texture axes: world-planar so neighbouring pieces line up; "fit" stretches 0..1 over the quad (screens, signs)
      const an = [Math.abs(n0), Math.abs(n1), Math.abs(n2)], ax = an[1] > 0.7 ? 1 : an[0] > an[2] ? 0 : 2;
      for (let j = 0; j <= sv; j++) for (let i = 0; i <= su; i++) {
        const fu = i / su, fv = j / sv, x = px + ux * fu + vx * fv, y = py + uy * fu + vy * fv, z = pz + uz * fu + vz * fv;
        b.p.push3(x, y, z); b.n.push3(n0, n1, n2);
        if (o.fit) b.uv.push2(o.fit[0] + (o.fit[2] - o.fit[0]) * fu, o.fit[1] + (o.fit[3] - o.fit[1]) * fv);
        else { let tu = ax === 1 ? x : ax === 0 ? -z * Math.sign(n0) : x * Math.sign(n2), tv = ax === 1 ? z : y; if (o.rot) { const q = tu; tu = tv; tv = -q; } b.uv.push2(tu / sc[0] + (o.uo || 0), tv / sc[1] + (o.vo || 0)); }
        if (o.lm) { b.lm.push2(o.lm[1] + (o.lm[3] - o.lm[1]) * fu, o.lm[2] + (o.lm[4] - o.lm[2]) * fv); b.lc.push1(o.lm[0]); b.vi.push1(-1); }   // chart-local pixels; the chart is placed in the atlas later
        else {
          // sample a little inside the quad and off the surface so neighbours do not shadow it
          const iu = (fu < 0.5 ? 1 : -1) * Math.min(0.03, lu * 0.25) / lu, iv = (fv < 0.5 ? 1 : -1) * Math.min(0.03, lv * 0.25) / lv, sx = (i === 0 || i === su) ? iu : 0, sy = (j === 0 || j === sv) ? iv : 0;
          b.lm.push2(0, 0); b.lc.push1(-1); b.vi.push1(vlG.n);
          vlP.push3(x + ux * sx + vx * sy + n0 * 0.02, y + uy * sx + vy * sy + n1 * 0.02, z + uz * sx + vz * sy + n2 * 0.02); vlN.push3(n0, n1, n2); vlG.push1(grp);
        }
      }
      for (let j = 0; j < sv; j++) for (let i = 0; i < su; i++) { const a = base + j * (su + 1) + i, c = a + su + 1; b.ix.push3(a, a + 1, c + 1); b.ix.push3(a, c + 1, c); }
      b.nv += (su + 1) * (sv + 1);
      return o.lm ? -1 : vlG.n - (su + 1) * (sv + 1);
    }
    // axis-aligned box. o.f = faces to draw (bit mask), o.occ = false to keep it out of the baker, o.em = emissive
    // radiance, o.seg = subdivision length for the baked vertex light, o.a = colour override for bounced light
    function box(key, x0, y0, z0, x1, y1, z1, o) {
      o = o || {}; if (x1 < x0) { const q = x0; x0 = x1; x1 = q; } if (y1 < y0) { const q = y0; y0 = y1; y1 = q; } if (z1 < z0) { const q = z0; z0 = z1; z1 = q; }
      let f = o.f == null ? ALL : o.f; if (y0 <= 0.001 && o.f == null) f &= ~NY;
      const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, q = { seg: o.seg, rot: o.rot, uo: o.uo, vo: o.vo }, vs = [-1, -1, -1, -1, -1, -1];
      if (f & PX) vs[0] = quad(key, x1, y0, z1, 0, 0, -dz, 0, dy, 0, q);
      if (f & NX_) vs[1] = quad(key, x0, y0, z0, 0, 0, dz, 0, dy, 0, q);
      if (f & PY) vs[2] = quad(key, x0, y1, z1, dx, 0, 0, 0, 0, -dz, q);
      if (f & NY) vs[3] = quad(key, x0, y0, z0, dx, 0, 0, 0, 0, dz, q);
      if (f & PZ) vs[4] = quad(key, x0, y0, z1, dx, 0, 0, 0, dy, 0, q);
      if (f & NZ) vs[5] = quad(key, x1, y0, z0, -dx, 0, 0, 0, dy, 0, q);
      const big = Math.max(dx, dy, dz), small = Math.min(dx, dy, dz), mid = dx + dy + dz - big - small;
      if (o.occ === true || (o.occ !== false && small >= 0.04 && mid >= 0.25 && big >= 0.5)) {
        const k = occ(x0, y0, z0, x1, y1, z1, o.a || matAlb(key), o.em || (MATS[key].e && !o.noEm ? MATS[key].e : null));
        for (let i = 0; i < 6; i++) oVs.a[k * 6 + i] = vs[i];
        return k;
      }
      return -1;
    }
    // cylinder along Y (columns, pipes, bins, pots): n-sided prism, vertex lit
    function cyl(key, cx, y0, cz, r, h, n, o) {
      o = o || {}; n = n || 10; const b = batch(key), sc = matScale(key), sv = Math.max(1, Math.min(6, Math.ceil(h / (o.seg || 1.1)))), r1 = o.r1 == null ? r : o.r1;
      const base = b.nv, grp = vlGroups++;
      for (let j = 0; j <= sv; j++) for (let i = 0; i <= n; i++) {
        const a = i / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), rr = r + (r1 - r) * j / sv, x = cx + ca * rr, y = y0 + h * j / sv, z = cz + sa * rr;
        b.p.push3(x, y, z); b.n.push3(ca, 0, sa); b.uv.push2(i / n * 2 * Math.PI * r / sc[0], y / sc[1]); b.lm.push2(0, 0); b.lc.push1(-1); b.vi.push1(vlG.n);
        vlP.push3(x + ca * 0.03, Math.min(y0 + h - 0.02, Math.max(y0 + 0.02, y)), z + sa * 0.03); vlN.push3(ca, 0, sa); vlG.push1(grp);
      }
      for (let j = 0; j < sv; j++) for (let i = 0; i < n; i++) { const a = base + j * (n + 1) + i, c = a + n + 1; b.ix.push3(a, c, c + 1); b.ix.push3(a, c + 1, a + 1); }
      b.nv += (sv + 1) * (n + 1);
      if (o.cap !== false) { // top cap as a fan
        const cb = b.nv, g2 = vlGroups++; b.p.push3(cx, y0 + h, cz); b.n.push3(0, 1, 0); b.uv.push2(cx / sc[0], cz / sc[1]); b.lm.push2(0, 0); b.lc.push1(-1); b.vi.push1(vlG.n); vlP.push3(cx, y0 + h + 0.02, cz); vlN.push3(0, 1, 0); vlG.push1(g2);
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = cx + Math.cos(a) * r1, z = cz + Math.sin(a) * r1; b.p.push3(x, y0 + h, z); b.n.push3(0, 1, 0); b.uv.push2(x / sc[0], z / sc[1]); b.lm.push2(0, 0); b.lc.push1(-1); b.vi.push1(vlG.n); vlP.push3(cx + Math.cos(a) * r1 * 0.9, y0 + h + 0.02, cz + Math.sin(a) * r1 * 0.9); vlN.push3(0, 1, 0); vlG.push1(g2); }
        for (let i = 0; i < n; i++) b.ix.push3(cb, cb + 1 + (i + 1) % n, cb + 1 + i);
        b.nv += n + 1;
      }
      if (o.occ !== false && r >= 0.12 && h >= 0.5) occ(cx - r * 0.8, y0, cz - r * 0.8, cx + r * 0.8, y0 + h, cz + r * 0.8, o.a || matAlb(key));
    }
    // round bar between two points (pipes, cables, rails, poles at any angle): n-sided prism without caps, vertex lit
    function tube(key, ax, ay, az, bx, by, bz, r, n, o) {
      o = o || {}; n = n || 6; const b = batch(key), sc = matScale(key), dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz) || 1e-6, wx = dx / len, wy = dy / len, wz = dz / len;
      let ux = Math.abs(wy) > 0.9 ? 1 : 0, uy = Math.abs(wy) > 0.9 ? 0 : 1, uz = 0; let vx = wy * uz - wz * uy, vy = wz * ux - wx * uz, vz = wx * uy - wy * ux; const vl = Math.hypot(vx, vy, vz); vx /= vl; vy /= vl; vz /= vl; ux = vy * wz - vz * wy; uy = vz * wx - vx * wz; uz = vx * wy - vy * wx;
      const sv = Math.max(1, Math.min(10, Math.ceil(len / (o.seg || 1.6)))), base = b.nv, grp = vlGroups++;
      for (let j = 0; j <= sv; j++) for (let i = 0; i <= n; i++) {
        const a = i / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), nx = ux * ca + vx * sa, ny = uy * ca + vy * sa, nz = uz * ca + vz * sa, t = j / sv, x = ax + dx * t + nx * r, y = ay + dy * t + ny * r, z = az + dz * t + nz * r;
        b.p.push3(x, y, z); b.n.push3(nx, ny, nz); b.uv.push2(i / n * 2 * Math.PI * r / sc[0], len * t / sc[1]); b.lm.push2(0, 0); b.lc.push1(-1); b.vi.push1(vlG.n);
        vlP.push3(x + nx * 0.03, y + ny * 0.03, z + nz * 0.03); vlN.push3(nx, ny, nz); vlG.push1(grp);
      }
      for (let j = 0; j < sv; j++) for (let i = 0; i < n; i++) { const a = base + j * (n + 1) + i, c = a + n + 1; b.ix.push3(a, a + 1, c + 1); b.ix.push3(a, c + 1, c); }
      b.nv += (sv + 1) * (n + 1);
    }
    // light sources the baker integrates. Rectangle: centre c, half edges u and v, emits along n (two = both sides).
    // L = radiance. vis = what the player sees is handled by emissive geometry, this is only the lighting.
    function rectLight(c, u, v, n, L, o) { o = o || {}; W.lights.push({ c, u, v, n, L, two: !!o.two, portal: !!o.portal, range: o.range || 0, spot: o.spot || 0 }); }

    // ---- map analysis: exposed wall faces, straight runs of them, zones
    const zoneOf = (x, z) => { const c = ch(x, z); return c === "a" ? "siteA" : c === "b" ? "siteB" : c === "r" ? "red" : c === "u" ? "blue" : c === "#" ? "" : "hall"; };
    // connected blocks of solid cells that are not the outer ring ("pods": cores, columns, rooms you cannot enter)
    const podOf = new Int32Array(G * G).fill(-1), pods = [];
    for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
      if (!solid(x, z) || podOf[ci(x, z)] >= 0) continue; const pod = { id: pods.length, cells: [], faces: 0 }, st = [[x, z]]; podOf[ci(x, z)] = pod.id;
      while (st.length) { const [a, b] = st.pop(); pod.cells.push([a, b]); for (const [dx, dz] of DIRS) { const nx = a + dx, nz = b + dz; if (border(nx, nz) || !solid(nx, nz) || podOf[ci(nx, nz)] >= 0) continue; podOf[ci(nx, nz)] = pod.id; st.push([nx, nz]); } }
      pods.push(pod);
    }
    const cellH = new Float32Array(G * G).fill(H), hctx = { G, H, rows, ch, solid, border, ci, hsh, podOf, pods, zoneOf, M };
    if (TH.blockH) for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) if (solid(x, z)) cellH[ci(x, z)] = Math.max(H, TH.blockH(x, z, hctx));
    const faces = [];   // {cx, cz (solid cell), d, ox, oz (open cell), h}
    const faceAt = new Int32Array(G * G * 4).fill(-1);
    for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
      if (!solid(x, z)) { floorOn[ci(x, z)] = 1; if (!outdoor) ceilOn[ci(x, z)] = 1; continue; }
      for (let d = 0; d < 4; d++) { const ox = x + DIRS[d][0], oz = z + DIRS[d][1]; if (!inb(ox, oz) || solid(ox, oz)) continue; faceAt[ci(x, z) * 4 + d] = faces.length; faces.push({ cx: x, cz: z, d, ox, oz, h: cellH[ci(x, z)], zone: zoneOf(ox, oz), kind: "", run: -1, ru: 0 }); }
    }
    // face-local frame: u runs to the viewer's right along the wall, v is up, w points out of the wall into the room
    const frame = (f) => { const [dx, dz] = DIRS[f.d], rx = dz, rz = -dx, mx = f.cx * CS + CS / 2 + dx * CS / 2, mz = f.cz * CS + CS / 2 + dz * CS / 2; return { ox: mx - rx * CS / 2, oz: mz - rz * CS / 2, rx, rz, nx: dx, nz: dz }; };
    // straight runs: faces on one wall line that continue each other share a lightmap chart
    const runs = [];
    for (const f of faces) {
      if (f.run >= 0) continue; const [dx, dz] = DIRS[f.d], rx = dz, rz = -dx;
      const same = (x, z) => inb(x, z) && solid(x, z) && faceAt[ci(x, z) * 4 + f.d] >= 0 && faces[faceAt[ci(x, z) * 4 + f.d]].h === f.h;
      let sx = f.cx, sz = f.cz; while (same(sx - rx, sz - rz)) { sx -= rx; sz -= rz; }
      const run = { id: runs.length, faces: [], d: f.d, h: f.h }; let x = sx, z = sz;
      while (same(x, z)) { const g = faces[faceAt[ci(x, z) * 4 + f.d]]; g.run = run.id; g.ru = run.faces.length; run.faces.push(g); x += rx; z += rz; }
      runs.push(run);
    }
    faces.forEach(f => { f.pod = podOf[ci(f.cx, f.cz)]; if (f.pod >= 0) pods[f.pod].faces++; });
    const openN = (x, z) => DIRS.reduce((n, [dx, dz]) => n + (solid(x + dx, z + dz) ? 0 : 1), 0);
    const A = { ch, solid, inb, border, ci, hsh, faces, runs, pods, podOf, frame, faceAt, zoneOf, openN, cellH };

    // ---- lightmap charts. Chart 0 = a few black texels every vertex-lit vertex points at, 1 = floor, 2 = ceiling, then wall runs.
    charts.push({ kind: "black", w: 4, h: 4 });
    charts.push({ kind: "floor", w: G * FP, h: G * FP });
    charts.push({ kind: "ceil", w: outdoor ? 0 : G * CP, h: outdoor ? 0 : G * CP });
    const floorLm = (x0, z0, x1, z1) => [1, x0 / CS * FP, z0 / CS * FP, x1 / CS * FP, z1 / CS * FP];
    const ceilLm = (x0, z0, x1, z1) => [2, x0 / CS * CP, z0 / CS * CP, x1 / CS * CP, z1 / CS * CP];
    for (const r of runs) { r.chart = charts.length; charts.push({ kind: "wall", w: r.faces.length * CS * WP, h: Math.ceil(r.h * WP), run: r.id, hm: r.h }); }

    // decal atlas (2048 x 2048 canvas the browser paints), shelf packed
    const DA = { w: 2048, h: 2048, pad: 4, used: 0, scale: 1 }, DC = {}, DU = []; W.dAtlas = DA;
    // lightmapped building blocks
    const B = { W, A, G, H, CS, MATS, quad, box, cyl, tube, occ, rectLight, lightMat, matAlb, floorLm, ceilLm, hsh, PX, NX: NX_, PY, NY, PZ, NZ, ALL,
      floorY, ceilY, floorOn, ceilOn,
      occB: (k, i) => oB.a[k * 6 + i],
      // point one face of a baker solid (0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z) at a lightmap chart and give it a colour
      setOcc(k, face, chart, a) { oChart.a[k * 6 + face] = chart; if (a) oAlb.a[k * 6 + face] = albIdx(a); },
      // floor of one cell (or part of it), lit by the floor lightmap
      floor(key, x0, z0, x1, z1, y, o) { quad(key, x0, y || 0, z1, x1 - x0, 0, 0, 0, 0, z0 - z1, Object.assign({ lm: floorLm(x0, z1, x1, z0) }, o)); },
      ceil(key, x0, z0, x1, z1, y, o) { quad(key, x0, y, z0, x1 - x0, 0, 0, 0, 0, z1 - z0, Object.assign({ lm: ceilLm(x0, z0, x1, z1) }, o)); },
      // part of a wall face in face-local coordinates (u0..u1 along the wall, v0..v1 up), lit by the run's lightmap chart
      wall(f, key, u0, v0, u1, v1, o) { const fr = frame(f), r = runs[f.run], c = charts[r.chart], ps = c.h / c.hm, bu = f.ru * CS;
        quad(key, fr.ox + fr.rx * u0, v0, fr.oz + fr.rz * u0, fr.rx * (u1 - u0), 0, fr.rz * (u1 - u0), 0, v1 - v0, 0, Object.assign({ lm: [r.chart, (bu + u0) * WP, v0 * ps, (bu + u1) * WP, v1 * ps] }, o)); },
      // box in face-local coordinates: u along the wall, v up, w out of the wall (negative = recessed into the wall)
      fbox(f, key, u0, v0, w0, u1, v1, w1, o) { const fr = frame(f), xa = fr.ox + fr.rx * u0 + fr.nx * w0, za = fr.oz + fr.rz * u0 + fr.nz * w0, xb = fr.ox + fr.rx * u1 + fr.nx * w1, zb = fr.oz + fr.rz * u1 + fr.nz * w1;
        o = o || {}; if (o.f == null && Math.min(w0, w1) <= 0.001 && Math.min(w0, w1) >= -0.001) { const back = fr.nx > 0 ? NX_ : fr.nx < 0 ? PX : fr.nz > 0 ? NZ : PZ; o = Object.assign({}, o, { f: (ALL & ~back) & (Math.min(v0, v1) <= 0.001 ? ~NY : ALL) }); }
        return box(key, xa, v0, za, xb, v1, zb, o); },
      // quad standing on the wall plane (posters, screens, signs), w metres off the wall
      fquad(f, key, u0, v0, u1, v1, w, o) { const fr = frame(f); return quad(key, fr.ox + fr.rx * u0 + fr.nx * w, v0, fr.oz + fr.rz * u0 + fr.nz * w, fr.rx * (u1 - u0), 0, fr.rz * (u1 - u0), 0, v1 - v0, 0, o); },
      // world position of a face-local point
      fpos(f, u, v, w) { const fr = frame(f); return [fr.ox + fr.rx * u + fr.nx * w, v, fr.oz + fr.rz * u + fr.nz * w]; },
      fdir(f, u, v, w) { const fr = frame(f); return [fr.rx * u + fr.nx * w, v, fr.rz * u + fr.nz * w]; },
      // light fixture seen by the player: glow sprite / flare anchors for the renderer
      fixture(x, y, z, col, k, kind) { W.fixtures.push({ x, y, z, col, k, kind: kind || "lamp" }); },
      // decal: a quad whose picture the browser draws into the decal atlas from a small spec ({k: kind, ...}); px = pixels per metre.
      // Equal pictures are drawn once; the atlas is packed after the theme has run, so the quad's uvs are filled in later.
      decal(key, P, U, V, px, spec) {
        const lu = Math.hypot(U[0], U[1], U[2]), lv = Math.hypot(V[0], V[1], V[2]), pw = Math.max(8, Math.ceil(lu * px)), ph = Math.max(8, Math.ceil(lv * px)), ck = JSON.stringify(spec) + "|" + pw + "x" + ph; let di = DC[ck];
        if (di == null) { di = DC[ck] = W.decals.length; W.decals.push(Object.assign({ s: [0, 0, pw, ph], w0: pw, h0: ph }, spec)); }
        const b = batch(key), u0 = b.uv.n, r = quad(key, P[0], P[1], P[2], U[0], U[1], U[2], V[0], V[1], V[2], { fit: [0, 0, 1, 1], seg: 1.6 }); DU.push([key, u0, b.uv.n, di]); return r; },
      // decal on a wall face: u0..u1 along the wall, v0..v1 up, w off the wall
      fdecal(f, key, u0, v0, u1, v1, w, px, spec) { return B.decal(key, B.fpos(f, u0, v0, w), B.fdir(f, u1 - u0, 0, 0), [0, v1 - v0, 0], px, spec); },
    };

    // ---- theme
    TH(B, M, env);

    // every solid cell that the theme did not replace by its own geometry is one solid block for the baker
    for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
      const c = ci(x, z); floorAlb[c] = B.floorAlbOf ? albIdx(B.floorAlbOf(x, z)) : albIdx([0.3, 0.3, 0.3]); ceilAlb[c] = B.ceilAlbOf ? albIdx(B.ceilAlbOf(x, z)) : albIdx([0.3, 0.3, 0.3]);
      if (!solid(x, z) || (B.hollow && B.hollow[c])) continue;
      const k = occ(x * CS, 0, z * CS, x * CS + CS, cellH[c], z * CS + CS, [0.4, 0.4, 0.4]);
      for (let d = 0; d < 4; d++) { const fi = faceAt[c * 4 + d]; if (fi < 0) continue; const f = faces[fi], fa = d === 0 ? 0 : d === 1 ? 1 : d === 2 ? 4 : 5; oChart.a[k * 6 + fa] = runs[f.run].chart; oAlb.a[k * 6 + fa] = albIdx(f.alb || [0.4, 0.4, 0.4]); }
    }

    // ---- pack the decal pictures (tallest first; everything shrinks a little if the atlas would overflow) and point the quads at them
    { const order = W.decals.map((d, i) => i).sort((a, b) => W.decals[b].h0 - W.decals[a].h0 || W.decals[b].w0 - W.decals[a].w0), PAD = DA.pad;
      for (let sc = 1; ; sc *= 0.88) { let x = 0, y = 0, sh = 0;
        for (const i of order) { const d = W.decals[i], w = Math.max(8, Math.round(d.w0 * sc)), h = Math.max(8, Math.round(d.h0 * sc)); if (x + w + PAD * 2 > DA.w) { x = 0; y += sh; sh = 0; } d.s = [x + PAD, y + PAD, w, h]; x += w + PAD * 2; sh = Math.max(sh, h + PAD * 2); }
        DA.used = y + sh; DA.scale = sc; if (y + sh <= DA.h || sc < 0.25) break; }
      for (const [key, a, e, di] of DU) { const uv = W.bat[key].uv.a, s = W.decals[di].s; for (let i = a; i < e; i += 2) { uv[i] = (s[0] + uv[i] * s[2]) / DA.w; uv[i + 1] = 1 - (s[1] + (1 - uv[i + 1]) * s[3]) / DA.h; } } }

    // ---- pack the charts into the atlas (shelves, tallest first; floor and ceiling go top-left)
    let ax = 0, ay = 0, shelf = 0; const place = (c, pad) => { const w = c.w + pad * 2, h = c.h + pad * 2; if (ax + w > AW) { ax = 0; ay += shelf; shelf = 0; } c.x = ax + pad; c.y = ay + pad; ax += w; shelf = Math.max(shelf, h); };
    charts[1].x = 0; charts[1].y = 0; charts[2].x = charts[1].w + 2; charts[2].y = 0; charts[0].x = charts[2].x + charts[2].w + 2; charts[0].y = 0;
    // wall shelves first fill the column right of the floor, under the ceiling chart, then continue below the floor
    const colX = charts[1].w + 2, colY0 = charts[2].h + 6; let cx2 = colX, cy2 = colY0, csh = 0, below = false;
    const walls = charts.slice(3).sort((a, b) => b.h - a.h || b.w - a.w);
    for (const c of walls) {
      const w = c.w + 2, h = c.h + 2;
      if (!below) { if (cx2 + w > AW) { cx2 = colX; cy2 += csh; csh = 0; } if (cy2 + h > charts[1].h || w > AW - colX) { below = true; ax = 0; ay = charts[1].h + 2; shelf = 0; } else { c.x = cx2 + 1; c.y = cy2 + 1; cx2 += w; csh = Math.max(csh, h); continue; } }
      place(c, 1);
    }
    const AH = Math.max(charts[1].h, below ? ay + shelf : cy2 + csh) + 2;
    W.atlas = { w: AW, h: AH + (AH & 1) };
    // lightmap uvs: pixels -> 0..1; vertex-lit vertices point at the centre of the black block
    const bx = (charts[0].x + 2) / W.atlas.w, by = (charts[0].y + 2) / W.atlas.h;
    for (const k in W.bat) { const b = W.bat[k], lm = b.lm.a, lc = b.lc.a; for (let i = 0, v = 0; i < b.lm.n; i += 2, v++) { const c = lc[v] < 0 ? null : charts[lc[v]]; if (!c) { lm[i] = bx; lm[i + 1] = by; } else { lm[i] = (c.x + lm[i]) / W.atlas.w; lm[i + 1] = (c.y + lm[i + 1]) / W.atlas.h; } }
      W.bat[k] = { p: b.p.done(), n: b.n.done(), uv: b.uv.done(), lm: b.lm.done(), vi: b.vi.done(), ix: b.ix.done(), nv: b.nv }; }
    W.charts = charts; W.runs = runs; W.faces = faces; W.CS = CS; W.FP = FP; W.CP = CP; W.WP = WP;
    W.vl = { p: vlP.done(), n: vlN.done(), g: vlG.done(), groups: vlGroups };
    W.occ = { n: oN, b: oB.done(), alb: oAlb.done(), chart: oChart.done(), vs: oVs.done(), em: oEm.done() };
    W.alb = alb; W.cell = { floorY, ceilY, floorOn, ceilOn, floorAlb, ceilAlb };
    // signature: the baked files only fit a world with exactly this layout
    let sg = 2166136261; const mix = (v) => { sg = Math.imul(sg ^ (v | 0), 16777619); };
    mix(VER); mix(G); mix(W.atlas.w); mix(W.atlas.h); mix(W.vl.g.length); mix(oN); mix(W.lights.length); charts.forEach(c => { mix(c.x); mix(c.y); mix(c.w); mix(c.h); });
    for (let i = 0; i < W.vl.p.length; i += 97) mix(Math.round(W.vl.p[i] * 100));
    W.sig = sg >>> 0;
    return W;
  }
  return { build, CS, FP, CP, WP, AW, VER, MATS, lightMat, hash, rng, strSeed, DIRS, themes: {} };
})();
