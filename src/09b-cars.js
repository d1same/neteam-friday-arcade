// ======================= Race cars =======================
// An original open-top race car. The body is one smooth lofted skin: at every station along the car a cross-section is
// drawn from the sill up the flank, over the wing and across the bonnet, so the wings, the waist and the wheel arches are
// real shapes rather than boxes. The cockpit is cut out of the skin and the driver (your character) sits in it.
// Three body styles share the code; the paint, the number and the stripes are drawn per driver.
const RCCAR = {
  L0: -2.2, L1: 2.2, AXR: -1.32, AXF: 1.36, WR: 0.36, ARCH: 0.455, TRK: 0.83, UW: 1.0,
  // a smooth curve through [[z, value], ...]
  curve(keys) {
    const n = keys.length, m = keys.map((k, i) => { const a = keys[Math.max(0, i - 1)], b = keys[Math.min(n - 1, i + 1)]; return (b[1] - a[1]) / (b[0] - a[0]); });
    return (z) => { if (z <= keys[0][0]) return keys[0][1]; if (z >= keys[n - 1][0]) return keys[n - 1][1]; let i = 0; while (keys[i + 1][0] < z) i++;
      const h = keys[i + 1][0] - keys[i][0], t = (z - keys[i][0]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * keys[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * keys[i + 1][1] + (t3 - t2) * h * m[i + 1]; };
  },
  STYLES: [
    { // the spyder: long bonnet, short ducktail
      hw: [[-2.2, 0.8], [-2.05, 0.9], [-1.32, 0.965], [-0.2, 0.915], [0.6, 0.915], [1.36, 0.945], [1.9, 0.88], [2.12, 0.74], [2.2, 0.6]],
      ys: [[-2.2, 0.82], [-1.9, 0.91], [-1.32, 0.97], [-0.5, 0.86], [0.5, 0.84], [1.36, 0.91], [1.85, 0.76], [2.1, 0.6], [2.2, 0.5]],
      yt: [[-2.2, 0.9], [-1.9, 0.9], [-1.2, 0.93], [-0.75, 0.92], [0.4, 0.87], [1.0, 0.83], [1.6, 0.76], [2.0, 0.61], [2.2, 0.47]],
      yb: [[-2.2, 0.42], [-1.95, 0.25], [-1.7, 0.18], [1.8, 0.18], [2.05, 0.22], [2.2, 0.3]], wing: 0, scoop: 0, fin: 0 },
    { // the GT: fat haunches, bonnet scoop and a tall wing
      hw: [[-2.2, 0.84], [-2.05, 0.93], [-1.32, 0.99], [-0.2, 0.92], [0.6, 0.92], [1.36, 0.95], [1.9, 0.9], [2.12, 0.78], [2.2, 0.66]],
      ys: [[-2.2, 0.86], [-1.9, 0.95], [-1.32, 1.01], [-0.5, 0.88], [0.5, 0.86], [1.36, 0.93], [1.85, 0.8], [2.1, 0.64], [2.2, 0.54]],
      yt: [[-2.2, 0.9], [-1.9, 0.93], [-1.2, 0.96], [-0.75, 0.94], [0.4, 0.9], [1.0, 0.88], [1.6, 0.8], [2.0, 0.65], [2.2, 0.5]],
      yb: [[-2.2, 0.44], [-1.95, 0.26], [-1.7, 0.18], [1.8, 0.18], [2.05, 0.22], [2.2, 0.3]], wing: 1, scoop: 1, fin: 0 },
    { // the wedge: low nose, flat deck and a shark fin
      hw: [[-2.2, 0.86], [-2.05, 0.93], [-1.32, 0.96], [-0.2, 0.93], [0.6, 0.92], [1.36, 0.935], [1.9, 0.86], [2.12, 0.7], [2.2, 0.56]],
      ys: [[-2.2, 0.88], [-1.9, 0.93], [-1.32, 0.95], [-0.5, 0.88], [0.5, 0.82], [1.36, 0.88], [1.85, 0.7], [2.1, 0.54], [2.2, 0.45]],
      yt: [[-2.2, 0.93], [-1.9, 0.94], [-1.2, 0.95], [-0.75, 0.93], [0.4, 0.85], [1.0, 0.78], [1.6, 0.68], [2.0, 0.53], [2.2, 0.42]],
      yb: [[-2.2, 0.42], [-1.95, 0.25], [-1.7, 0.18], [1.8, 0.18], [2.05, 0.21], [2.2, 0.28]], wing: 0, scoop: 0, fin: 1 },
  ],
  // glue geometries (each with an optional matrix) into one plain triangle list
  merge(T, list) {
    let n = 0; const parts = list.map(([g, m]) => { const q = g.index ? g.toNonIndexed() : g.clone(); if (m) q.applyMatrix4(m); if (!q.attributes.normal) q.computeVertexNormals(); n += q.attributes.position.count; if (g !== q) g.dispose(); return q; });
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
    for (const q of parts) { P.set(q.attributes.position.array, o * 3); N.set(q.attributes.normal.array, o * 3); if (q.attributes.uv) U.set(q.attributes.uv.array, o * 2); o += q.attributes.position.count; q.dispose(); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(P, 3)); g.setAttribute("normal", new T.BufferAttribute(N, 3)); g.setAttribute("uv", new T.BufferAttribute(U, 2)); return g;
  },
  at(T, x, y, z, rx, ry, rz, sx, sy, sz) { return new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0, "YXZ")), new T.Vector3(sx || 1, sy || sx || 1, sz || sx || 1)); },
  tris(T, P) { const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(new Float32Array(P), 3)); g.computeVertexNormals(); return g; },
  // the shared shapes of one body style
  shape(T, si) {
    const C = RCCAR, key = "s" + si; if (C[key]) return C[key];
    const S = C.STYLES[si], hwF = C.curve(S.hw), ysF = C.curve(S.ys), ytF = C.curve(S.yt), ybF = C.curve(S.yb), L0 = C.L0, L1 = C.L1, at = (...a) => C.at(T, ...a);
    const ZC0 = -0.66, ZC1 = 0.3, TUB = 0.46;
    // stations: even spacing, plus the wheel arches and the cockpit edges exactly
    let zs = [ZC0, ZC1]; for (const zw of [C.AXR, C.AXF]) { for (let k = 0; k <= 12; k++) zs.push(zw + C.ARCH * Math.cos(Math.PI * k / 12)); zs.push(zw - C.ARCH - 0.012, zw + C.ARCH + 0.012); }
    for (let k = 0; k <= 46; k++) { const z = L0 + (L1 - L0) * (0.5 - 0.5 * Math.cos(Math.PI * k / 46)) * 0.5 + (L1 - L0) * (k / 46) * 0.5; if (!zs.some(q => Math.abs(q - z) < 0.035)) zs.push(z); }
    zs.sort((a, b) => a - b);
    const hwAt = (z) => { let w = hwF(z); for (const zw of [C.AXR, C.AXF]) { const d = (z - zw) / 0.5; w += 0.028 * Math.exp(-d * d); } return w; };
    const ring = (z) => {
      const hw = hwAt(z), ys = ysF(z), yt = ytF(z); let yb = ybF(z);
      for (const zw of [C.AXR, C.AXF]) { const d = Math.abs(z - zw); if (d < C.ARCH) yb = Math.max(yb, C.WR + Math.sqrt(C.ARCH * C.ARCH - d * d)); }
      yb = Math.min(yb, ys - 0.075);
      const K = [[hw * 0.955, yb], [hw, yb + (ys - yb) * 0.6], [hw * 0.955, ys - 0.015], [hw * 0.8, ys + 0.022], [hw * 0.5, yt + (ys - yt) * 0.42 + 0.012], [0, yt]], H = [];
      const cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
      for (let s = 0; s < 5; s++) for (let u = 0; u < 2; u++) { const a = K[Math.max(0, s - 1)], b = K[s], c = K[s + 1], d = K[Math.min(5, s + 2)], t = u / 2; H.push([Math.min(hw, cr(a[0], b[0], c[0], d[0], t)), cr(a[1], b[1], c[1], d[1], t)]); }
      H.push([0, yt]);
      const R = []; for (let j = 0; j <= 10; j++) R.push([-H[j][0], H[j][1], z]); for (let j = 9; j >= 0; j--) R.push([H[j][0], H[j][1], z]);
      return R;
    };
    const rings = zs.map(ring), NR = 21, pos = [], idx = [];
    rings.forEach(R => R.forEach(p => pos.push(p[0], p[1], p[2])));
    const sA = zs.indexOf(ZC0), sB = zs.indexOf(ZC1);
    for (let s = 0; s < zs.length - 1; s++) for (let j = 0; j < NR - 1; j++) { if (s >= sA && s < sB && j >= 8 && j < 12) continue; const a = s * NR + j, b = a + NR, c = a + 1, d = b + 1; idx.push(a, b, c, b, d, c); }
    const skin = new T.BufferGeometry(); skin.setAttribute("position", new T.BufferAttribute(new Float32Array(pos), 3)); skin.setIndex(idx); skin.computeVertexNormals();
    // the tail panel is paint, the mouth in the nose is dark
    const cap = (R, flip) => { const P = [], cy = (R[0][1] + R[10][1]) / 2, cz = R[0][2] + (flip ? 0.03 : -0.02); for (let j = 0; j < NR - 1; j++) { const a = R[j], b = R[j + 1]; if (flip) P.push(b[0], b[1], b[2], a[0], a[1], a[2], 0, cy, cz); else P.push(a[0], a[1], a[2], b[0], b[1], b[2], 0, cy, cz); } const a = R[NR - 1], b = R[0]; if (flip) P.push(b[0], b[1], b[2], a[0], a[1], a[2], 0, cy, cz); else P.push(a[0], a[1], a[2], b[0], b[1], b[2], 0, cy, cz); return C.tris(T, P); };
    const paintParts = [[skin], [cap(rings[0], false)]];
    // streamlined headrest behind the driver
    paintParts.push([new T.SphereGeometry(1, 18, 12), at(0, ytF(-1.25) - 0.02, -1.29, 0, 0, 0, 0.3, 0.27, 0.6)]);
    if (S.scoop) paintParts.push([new T.SphereGeometry(1, 16, 10), at(0, ytF(1.1) - 0.05, 1.1, 0, 0, 0, 0.26, 0.15, 0.5)]);
    if (S.fin) { const y0 = ytF(-1.9) - 0.03, f = 0.016, a = [-1.2, ytF(-1.2) - 0.02], b = [-2.16, y0], c = [-2.16, y0 + 0.3], d = [-1.95, y0 + 0.31], P = [];
      for (const sd of [-1, 1]) { const x = sd * f, q = sd > 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c]; q.forEach(v => P.push(x, v[1], v[0])); }
      [[a, d], [d, c], [c, b]].forEach(([u, v]) => P.push(-f, u[1], u[0], f, u[1], u[0], f, v[1], v[0], -f, u[1], u[0], f, v[1], v[0], -f, v[1], v[0]));
      paintParts.push([C.tris(T, P)]); }
    if (S.wing) { paintParts.push([new T.BoxGeometry(1.8, 0.03, 0.34), at(0, 1.25, -1.98, 0.14)]); for (const s of [-1, 1]) paintParts.push([new T.BoxGeometry(0.025, 0.2, 0.42), at(s * 0.9, 1.23, -1.98)]); }
    for (const s of [-1, 1]) paintParts.push([new T.SphereGeometry(1, 10, 8), at(s * (hwF(0.42) - 0.06), ysF(0.42) + 0.1, 0.42, 0, 0, 0, 0.09, 0.055, 0.075)]);
    const paint = C.merge(T, paintParts);
    { const p = paint.attributes.position, u = paint.attributes.uv; for (let i = 0; i < p.count; i++) u.setXY(i, 0.5 - p.getX(i) / (2 * C.UW), (p.getZ(i) - L0) / (L1 - L0)); }
    // dark parts: nose mouth, cockpit tub, wheel-arch liners, floor, splitter, skirts, diffuser, roll hoop, wing posts, mirror stalks
    const dark = [[cap(rings[rings.length - 1], true)]], tub = [];
    const wallDown = (a, b) => tub.push(a[0], a[1], a[2], b[0], b[1], b[2], b[0], TUB, b[2], a[0], a[1], a[2], b[0], TUB, b[2], a[0], TUB, a[2]);
    for (let s = sA; s < sB; s++) { wallDown(rings[s][8], rings[s + 1][8]); wallDown(rings[s + 1][12], rings[s][12]); }
    for (let j = 8; j < 12; j++) { wallDown(rings[sA][j + 1], rings[sA][j]); wallDown(rings[sB][j], rings[sB][j + 1]); }
    { const x = Math.abs(rings[sA][8][0]) + 0.03; tub.push(-x, TUB, ZC0, x, TUB, ZC1, x, TUB, ZC0, -x, TUB, ZC0, -x, TUB, ZC1, x, TUB, ZC1); }
    dark.push([C.tris(T, tub)]);
    for (const zw of [C.AXR, C.AXF]) for (const s of [-1, 1]) { const x1 = hwAt(zw) - 0.035, x0 = 0.6, w = x1 - x0;
      dark.push([new T.CylinderGeometry(C.ARCH + 0.012, C.ARCH + 0.012, w, 22, 1, true), at(s * (x0 + w / 2), C.WR, zw, 0, 0, Math.PI / 2)]);
      dark.push([new T.CircleGeometry(C.ARCH + 0.012, 22), at(s * x0, C.WR, zw, 0, s * Math.PI / 2, 0)]); }
    dark.push([new T.BoxGeometry(1.5, 0.02, 3.5), at(0, 0.2, 0)]);
    dark.push([new T.BoxGeometry(1.72, 0.035, 0.42), at(0, 0.15, L1 - 0.14)]);
    for (const s of [-1, 1]) { dark.push([new T.BoxGeometry(0.07, 0.07, 1.6), at(s * (hwF(0) - 0.01), 0.165, 0.02)]); dark.push([new T.BoxGeometry(0.025, 0.1, 0.36), at(s * 0.845, 0.2, L1 - 0.14)]); }
    dark.push([new T.BoxGeometry(1.46, 0.05, 0.4), at(0, 0.3, L0 + 0.2, -0.3)]);
    for (let k = -2; k <= 2; k++) dark.push([new T.BoxGeometry(0.025, 0.13, 0.36), at(k * 0.3, 0.27, L0 + 0.2, -0.3)]);
    dark.push([new T.TorusGeometry(0.27, 0.028, 8, 18, Math.PI), at(0, ytF(-0.74) - 0.03, -0.74)]);
    for (const s of [-1, 1]) { dark.push([new T.CylinderGeometry(0.045, 0.05, 0.18, 10), at(s * 0.3, 0.53, L0 - 0.02, Math.PI / 2 - 0.1)]); dark.push([new T.BoxGeometry(0.02, 0.1, 0.03), at(s * (hwF(0.42) - 0.06), ysF(0.42) + 0.03, 0.42)]); }
    if (S.wing) for (const s of [-1, 1]) dark.push([new T.BoxGeometry(0.025, 0.34, 0.13), at(s * 0.5, 1.08, -1.93, 0.1)]);
    if (S.scoop) dark.push([new T.BoxGeometry(0.34, 0.07, 0.02), at(0, ytF(1.56) + 0.045, 1.57)]);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) dark.push([new T.BoxGeometry(0.2, 0.012, 0.035), at(s * 0.5, ytF(0.95) + (ysF(0.95) - ytF(0.95)) * 0.5 + 0.012, 0.82 + k * 0.075, -0.08, 0, s * 0.1)]);
    const trim = C.merge(T, dark);
    // low wraparound screen
    const gp = [], R = 0.5, zc = ZC1 - 0.12, N = 14;
    for (let k = 0; k < N; k++) { const f = (k) => { const a = (k / N - 0.5) * 2.75, x = Math.sin(a) * R, z = zc + Math.cos(a) * 0.42, y0 = ytF(z) + 0.0, h = 0.25 * (0.55 + 0.45 * Math.cos(a)); return [[x, y0 - 0.03, z + 0.05], [x * 0.93, y0 + h, z - 0.13]]; }, [a0, a1] = f(k), [b0, b1] = f(k + 1); gp.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1); }
    const glass = C.tris(T, gp);
    // lamps: thin strips on the nose corners, one bar across the tail
    const head = [], zh = L1 - 0.2;
    for (const s of [-1, 1]) { head.push([new T.BoxGeometry(0.3, 0.05, 0.05), at(s * hwF(zh) * 0.7, ysF(zh) - 0.01, zh + 0.035, -0.5, -s * 0.5)]); head.push([new T.BoxGeometry(0.05, 0.11, 0.04), at(s * hwF(zh + 0.1) * 0.86, ysF(zh) - 0.1, zh + 0.09, -0.2, -s * 0.9)]); }
    const tail = [[new T.BoxGeometry(hwF(L0) * 1.8, 0.055, 0.03), at(0, ysF(L0) - 0.1, L0 - 0.022)]];
    for (const s of [-1, 1]) tail.push([new T.BoxGeometry(0.05, 0.16, 0.03), at(s * hwF(L0) * 0.86, ysF(L0) - 0.16, L0 - 0.022)]);
    return C[key] = { paint, trim, glass, head: C.merge(T, head), tail: C.merge(T, tail), doorX: hwAt(0.2), doorY: (0.18 + ysF(-0.1)) / 2 + 0.03, seatY: ytF(-0.2), tailY: ysF(L0) - 0.1, S };
  },
  // wheel: a round-shouldered tyre with a spoked alloy drawn on both faces
  wheel(T) {
    const C = RCCAR; if (C.wh) return C.wh;
    const r = C.WR, pr = [[0.215, -0.13], [0.3, -0.135], [r - 0.02, -0.12], [r, -0.085], [r, 0.085], [r - 0.02, 0.12], [0.3, 0.135], [0.215, 0.13]].map(p => new T.Vector2(p[0], p[1]));
    const tyre = new T.LatheGeometry(pr, 28); tyre.rotateZ(-Math.PI / 2);
    const nt = tyre.index ? tyre.index.count : tyre.attributes.position.count;
    const geo = C.merge(T, [[tyre], [new T.CircleGeometry(0.235, 28), C.at(T, 0.105, 0, 0, 0, Math.PI / 2)], [new T.CircleGeometry(0.235, 28), C.at(T, -0.105, 0, 0, 0, -Math.PI / 2)]]);
    // the whole wheel is one material so that every wheel in the race can be drawn in a single call:
    // the tyre reads the dark corner of the rim picture, and a second picture says where it is rubber and where metal
    { const uv = geo.attributes.uv, ix = geo.index, seen = new Set(); if (ix) { for (let i = 0; i < nt; i++) seen.add(ix.getX(i)); seen.forEach(v => uv.setXY(v, 0.012, 0.012)); } else for (let i = 0; i < nt; i++) uv.setXY(i, 0.012, 0.012); }
    const tex = GFX.tex(256, 256, (x, w, h) => {
      x.fillStyle = "#0b0c10"; x.fillRect(0, 0, w, h); const cx = w / 2, cy = h / 2;
      const g = x.createRadialGradient(cx, cy, 20, cx, cy, 124); g.addColorStop(0, "#3a3d46"); g.addColorStop(0.55, "#14151a"); g.addColorStop(1, "#0c0d11"); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 126, 0, 7); x.fill();
      x.strokeStyle = "#6d7078"; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, 86, 0, 7); x.stroke();   // brake disc behind the spokes
      x.strokeStyle = "#d9dce4"; x.lineWidth = 9; x.beginPath(); x.arc(cx, cy, 120, 0, 7); x.stroke();
      x.lineCap = "round"; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; for (const o of [-0.2, 0.2]) { x.strokeStyle = "#c9ccd6"; x.lineWidth = 11; x.beginPath(); x.moveTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22); x.lineTo(cx + Math.cos(a + o) * 116, cy + Math.sin(a + o) * 116); x.stroke(); x.strokeStyle = "#f4f5f8"; x.lineWidth = 3; x.stroke(); } }
      x.fillStyle = "#b9bcc6"; x.beginPath(); x.arc(cx, cy, 30, 0, 7); x.fill(); x.fillStyle = "#16171c"; x.beginPath(); x.arc(cx, cy, 14, 0, 7); x.fill();
      x.fillStyle = "#e8eaf0"; for (let k = 0; k < 5; k++) { const a = (k + 0.5) / 5 * Math.PI * 2; x.beginPath(); x.arc(cx + Math.cos(a) * 21, cy + Math.sin(a) * 21, 3.4, 0, 7); x.fill(); }
    });
    tex.anisotropy = 4;
    const mr = GFX.tex(64, 64, (x, w, h) => { x.fillStyle = "rgb(0,235,0)"; x.fillRect(0, 0, w, h); x.fillStyle = "rgb(0,87,178)"; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 0.6, 0, 7); x.fill(); }); mr.colorSpace = T.NoColorSpace;
    const mat = new T.MeshStandardMaterial({ map: tex, roughnessMap: mr, metalnessMap: mr, roughness: 1, metalness: 1, side: T.DoubleSide });
    return C.wh = { geo, mat };
  },
  mats(T) {
    const C = RCCAR; if (C.mt) return C.mt;
    return C.mt = {
      trim: new T.MeshStandardMaterial({ color: 0x0c0d11, roughness: 0.62, metalness: 0.2, side: T.DoubleSide }),
      glass: new T.MeshStandardMaterial({ color: 0x18222e, roughness: 0.06, metalness: 0.4, transparent: true, opacity: 0.62, side: T.DoubleSide, depthWrite: false }),
      head: new T.MeshBasicMaterial({ color: new T.Color(3.4, 3.2, 2.8) }), tail: new T.MeshBasicMaterial({ color: new T.Color(3.2, 0.2, 0.26) }),
    };
  },
  // paint, stripes and the number, seen from above (the top of the picture is the nose)
  livery(T, hex, num, si) {
    const C = RCCAR, col = new T.Color(hex), lum = col.r * 0.3 + col.g * 0.55 + col.b * 0.15, ink = lum > 0.55 ? "#14161c" : "#f3efe4", px = (m) => m * 128 / C.UW, Z = (z) => (1 - (z - C.L0) / (C.L1 - C.L0)) * 512;
    const tex = GFX.tex(256, 512, (x, w, h) => {
      x.fillStyle = hex; x.fillRect(0, 0, w, h);
      // twin stripes nose to tail (the wedge wears one offset stripe with a pinstripe)
      x.fillStyle = ink; if (si === 2) { x.fillRect(128 + px(0.2), 0, px(0.16), h); x.fillRect(128 + px(0.4), 0, px(0.04), h); } else { x.fillRect(128 - px(0.2), 0, px(0.12), h); x.fillRect(128 + px(0.08), 0, px(0.12), h); }
      // shut lines of the bonnet and the boot
      x.strokeStyle = "rgba(0,0,0,.42)"; x.lineWidth = 1.5; x.beginPath(); x.roundRect(128 - px(0.66), Z(1.98), px(1.32), Z(0.58) - Z(1.98), 16); x.stroke(); x.beginPath(); x.roundRect(128 - px(0.6), Z(-1.02), px(1.2), Z(-2.06) - Z(-1.02), 12); x.stroke();
      // number roundel on the bonnet
      x.fillStyle = "#f3efe4"; x.beginPath(); x.arc(128, Z(1.42), 27, 0, 7); x.fill(); x.fillStyle = "#14161c"; x.font = "700 34px 'Chakra Petch', Inter, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(String(num), 128, Z(1.42) + 2);
      x.fillStyle = ink; x.font = "700 13px 'Chakra Petch', Inter, sans-serif"; x.fillText("NETEAM", 128, Z(-1.92));
    });
    tex.anisotropy = 4; return tex;
  },
  door(T, hex, num) {
    const tex = GFX.tex(256, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = "#f3efe4"; x.beginPath(); x.arc(58, 64, 50, 0, 7); x.fill(); x.fillStyle = "#14161c"; x.font = "700 62px 'Chakra Petch', Inter, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(String(num), 58, 68);
      x.fillStyle = "#f3efe4"; x.textAlign = "left"; x.font = "700 30px 'Chakra Petch', Inter, sans-serif"; x.fillText("NETEAM", 122, 52); x.font = "600 17px Inter, sans-serif"; x.fillText("FRIDAY ARCADE", 123, 84); });
    tex.anisotropy = 4; return tex;
  },
  // ---- real cars: four scanned-quality CC0 cars (Grab3D, slimmed by tools/cars.js), resprayed in each driver's colour.
  // The red channel of their metal/rough picture marks the paint; the police car keeps its own livery.
  REAL_IDS: ["gt90", "gt80", "gt60", "cop"],
  modelOf(i) { return RCCAR.REAL_IDS[i % 4]; },
  real: null,
  load() {
    if (RCCAR._ld) return RCCAR._ld;
    const off = (store("nfa-gfx") || {}).cars === 0;
    const load = (f) => new Promise((res) => { try { new THREE_EXTRAS.GLTFLoader().load("models/" + f, (g) => res(g), null, () => res(null)); } catch (e) { res(null); } });
    return RCCAR._ld = off ? Promise.resolve(null) : GFX.track(GFX.operator().then(() => Promise.all(RCCAR.REAL_IDS.map(k => load("car-" + k + ".glb?v=1")))).then((L) => {
      if (L.some(g => !g)) return null; const o = {}; RCCAR.REAL_IDS.forEach((k, n) => { o[k] = RCCAR.prep(THREE, L[n], k); }); return RCCAR.real = o; }).catch((e) => { console.warn("[race] car models", e); return null; }));
  },
  // pull a loaded car apart once: the body (with the glass), and the two wheel shapes (left and right) centred on their hubs
  prep(T, gl, k) {
    const root = gl.scene; root.updateMatrixWorld(true);
    // the files store positions and normals as small integers (KHR_mesh_quantization): unpack to floats before moving them
    const flt = (g) => { for (const n of ["position", "normal", "uv"]) { const a = g.attributes[n]; if (!a || (a.array instanceof Float32Array && !a.normalized && !a.isInterleavedBufferAttribute)) continue; const o = new Float32Array(a.count * a.itemSize); for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) o[i * a.itemSize + c] = a.getComponent ? a.getComponent(i, c) : [a.getX(i), a.getY(i), a.getZ(i)][c]; g.setAttribute(n, new T.BufferAttribute(o, a.itemSize)); } return g; };
    const box = new T.Box3().setFromObject(root), len = box.max.z - box.min.z, sc = 4.4 / len;
    const wheels = [], keep = [];
    root.traverse(o => { if (!o.isMesh) return; if (/wheel_/.test(o.name) || (o.parent && /wheel_/.test(o.parent.name))) wheels.push(o); else keep.push(o); });
    const part = (o) => { const ms = Array.isArray(o.material) ? o.material : [o.material]; return { o, ms }; };
    // the wheels: every primitive of the front-left and front-right wheel, moved so the hub is at the origin
    const wp = [], hubs = [];
    for (const side of [1, -1]) {
      const src = wheels.filter(o => new RegExp("wheel_f" + (side > 0 ? "l" : "r")).test(o.name + " " + (o.parent ? o.parent.name : "")));
      const g0 = new T.Box3(); src.forEach(o => g0.expandByObject(o)); const c = g0.getCenter(new T.Vector3());
      src.forEach(o => { const g = flt(o.geometry.clone()); g.applyMatrix4(o.matrixWorld); g.translate(-c.x, -c.y, -c.z); g.scale(sc, sc, sc); const m = o.material.clone(); if (m.map) m.map.anisotropy = 4; wp.push({ side, geo: g, mat: m }); });
    }
    wheels.forEach(o => { const b = new T.Box3().setFromObject(o), c = b.getCenter(new T.Vector3()); hubs.push({ x: c.x * sc, y: c.y * sc, z: c.z * sc, side: c.x > 0 ? 1 : -1, front: c.z > 0, r: (b.max.y - b.min.y) / 2 * sc }); });
    // the body: one group of the remaining meshes in car space
    const body = new T.Group(); let paint = null, glass = null;
    keep.forEach(o => { const g = flt(o.geometry.clone()); g.applyMatrix4(o.matrixWorld); g.scale(sc, sc, sc); g.computeBoundingSphere(); const m = new T.Mesh(g, o.material); m.name = o.name; body.add(m);
      if (/body_pbr/.test(o.material.name)) paint = o.material; if (/glass/.test(o.material.name)) glass = o.material; });
    if (glass) { glass.color.setRGB(0.05, 0.07, 0.09); glass.opacity = 0.78; glass.roughness = 0.04; glass.metalness = 0.6; glass.depthWrite = false; }
    if (paint) { [paint.map, paint.normalMap, paint.metalnessMap].forEach(t => { if (t) t.anisotropy = 8; }); }
    const bb = new T.Box3().setFromObject(body);
    const wr = hubs.reduce((s, h) => s + h.r, 0) / Math.max(1, hubs.length);
    return { k, body, paint, wp, hubs, wr, lum: (root.userData && root.userData.paintLum) || 0, L0: bb.min.z, L1: bb.max.z, hw: (bb.max.x - bb.min.x) / 2, top: bb.max.y,
      AXF: Math.max(...hubs.map(h => h.z)), AXR: Math.min(...hubs.map(h => h.z)), TRK: Math.max(...hubs.map(h => Math.abs(h.x))) };
  },
  _paintObc(s) {
    const u = this.userData.rcp; s.uniforms.uPaint = u.col; s.uniforms.uPaintLum = u.lum;
    s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nuniform vec3 uPaint; uniform float uPaintLum;")
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>
      #ifdef USE_METALNESSMAP
      if (uPaintLum > 0.0) { float pm = texture2D(metalnessMap, vMetalnessMapUv).r;
        vec3 pc = uPaint * clamp(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)) / uPaintLum, 0.25, 2.2);
        diffuseColor.rgb = mix(diffuseColor.rgb, pc, pm); roughnessFactor = mix(roughnessFactor, 0.16, pm); metalnessFactor = mix(metalnessFactor, 0.55, pm); }
      #endif`);
  },
  _paintKey() { return "rcpaint1"; },
  // one real car: the body (own paint material) and four wheel anchors; the wheels themselves are drawn instanced by the race
  makeReal(T, hex, num, k) {
    const R = RCCAR.real[k], body = new T.Group(), own = [];
    R.body.children.forEach(m0 => { let mt = m0.material;
      if (mt === R.paint) { mt = R.paint.clone(); mt.userData.rcp = { col: { value: new T.Color(hex) }, lum: { value: R.lum } }; mt.onBeforeCompile = RCCAR._paintObc; mt.customProgramCacheKey = RCCAR._paintKey; mt.userData.exObc = RCCAR._paintObc; mt.userData.exKey = "rcpaint1"; mt.envMapIntensity = 1.3; own.push(mt); }
      const m = new T.Mesh(m0.geometry, mt); m.name = m0.name; if (/glass/.test(mt.name)) m.renderOrder = 2; body.add(m); });
    // brake lights: a lit strip across the tail that flares when the driver brakes
    const brake = new T.Mesh(RCCAR._brG || (RCCAR._brG = new T.PlaneGeometry(1, 1)), new T.MeshBasicMaterial({ color: new T.Color(2.4, 0.12, 0.16), transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false }));
    brake.scale.set(R.hw * 1.5, 0.09, 1); brake.position.set(0, R.top * 0.62, R.L0 - 0.02); brake.rotation.y = Math.PI; body.add(brake); own.push(brake.material);
    const wheels = R.hubs.map(h => { const st = new T.Group(), w = new T.Object3D(); st.position.set(h.x, h.y, h.z); st.add(w); return { st, w, front: h.front, side: h.side }; });
    return { body, wheels, brake, real: R, own, sh: { tailY: R.top * 0.62, seatY: R.top - 0.35, headY: R.top * 0.55, L0: R.L0, L1: R.L1, hw: R.hw, wr: R.wr } };
  },
  // one car: returns the body group (add it to the car's root), the four wheels and a few anchor points
  make(T, hex, num, si) {
    const C = RCCAR, sh = C.shape(T, si), M = C.mats(T), W = C.wheel(T), body = new T.Group();
    const lv = C.livery(T, hex, num, si), paintM = new T.MeshStandardMaterial({ map: lv, metalness: 0.6, roughness: 0.2, envMapIntensity: 1.25 });
    const dt = C.door(T, hex, num), doorM = new T.MeshStandardMaterial({ map: dt, transparent: true, roughness: 0.4, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false });
    body.add(new T.Mesh(sh.paint, paintM), new T.Mesh(sh.trim, M.trim), new T.Mesh(sh.head, M.head), new T.Mesh(sh.tail, M.tail));
    const gl = new T.Mesh(sh.glass, M.glass); gl.renderOrder = 2; body.add(gl);
    for (const s of [-1, 1]) { const d = new T.Mesh(C.doorG || (C.doorG = new T.PlaneGeometry(0.76, 0.38)), doorM); d.position.set(s * (sh.doorX + 0.008), sh.doorY, 0.2); d.rotation.y = s * Math.PI / 2; body.add(d); }
    const wheels = [[-1, C.AXF], [1, C.AXF], [-1, C.AXR], [1, C.AXR]].map(([s, z]) => { const st = new T.Group(), w = new T.Object3D(); st.position.set(s * C.TRK, C.WR, z); st.add(w); return { st, w, front: z > 0 }; });   // w only carries the transform: all wheels are one instanced mesh (see buildDyn)
    return { body, wheels, sh, own: [paintM, doorM, lv, dt] };
  },
};
