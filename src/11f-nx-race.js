// ======================= NX theme: the Grand Prix street circuits =======================
// A race world is an open grid that only carries the baked light; the road follows the track's centre line (M.track).
// Road, kerbs, run-off and verge are ribbons lit by the ground lightmap, so lamp pools and building shadows fall across
// them. Around it: concrete barriers with sponsor boards, catch fences on the bends, street lamps, a start gantry and
// grandstand, billboards, the Neteam tower, a park inside the loop and city blocks outside.
NXW.themes.race = (B, M, env) => {
  const { W, G, CS, MATS, quad, box, cyl, tube, mesh, rectLight, lightMat, matAlb, hsh, PX, PY, NY, PZ, NZ, ALL } = B, NXb = B.NX, TEX = env.tex || {};
  const R = M.track, N = R.N, pts = R.pts, tan = R.tan, HW = M.hw || 8, WALL = M.wall || 13, size = G * CS, STEP = R.len / N;
  const K = NXW.kit(B), { COOL, CYAN, MAG, SODIUM, WARM, GREEN } = K.C, mul = K.mul, norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const wrap = (i) => ((i % N) + N) % N, at = (i, lat) => { const p = pts[wrap(i)], t = tan[wrap(i)]; return [p[0] - t[1] * lat, p[1] + t[0] * lat]; };
  const rnd = NXW.rng(NXW.strSeed("race:" + M.tid));
  const TUN = R.tunnel, inTun = (k, pad) => { if (!TUN) return false; pad = pad || 0; return wrap(k - TUN[0] + pad) <= TUN[1] - TUN[0] + 2 * pad; };
  const atF = (f, lat) => { const i = Math.floor(f), u = f - i, a = at(i, lat), b = at(i + 1, lat); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
  if (!MATS.rc_tunwall) Object.assign(MATS, { rc_tunwall: { t: "tiles", c: [0.62, 0.64, 0.62], s: 0.6, r: 0.35 }, rc_tunceil: { t: "concrete2", c: [0.55, 0.55, 0.56], s: 2 }, rc_ramp: { t: "diamond", c: [1.4, 1.4, 1.45], s: 1.4 } });

  // ---- the look of each sky
  const LOOK = {
    dusk: { sky: { name: "dusk", k: 1.0 }, sun: { dir: norm([-0.62, 0.2, 0.55]), E: [9.5, 5.8, 3.0], ang: 0.035 }, fog: [0.07, 0.065, 0.085], fogD: 0.0022, tint: [1.02, 1.0, 0.97], lamp: SODIUM, lampL: 1500, win: 0.5, wet: 0 },
    dawn: { sky: { name: "dawn", k: 1.0 }, sun: { dir: norm([0.6, 0.24, -0.5]), E: [8.5, 6.4, 4.4], ang: 0.035 }, fog: [0.13, 0.12, 0.13], fogD: 0.0026, tint: [1.02, 1.0, 0.98], lamp: WARM, lampL: 500, win: 0.2, wet: 0 },
    neon: { sky: { name: "night", k: 0.8, E: 0.3 }, sun: { dir: norm([0.5, 0.3, 0.75]), E: [0.2, 0.26, 0.42], ang: 0.03 }, fog: [0.035, 0.012, 0.05], fogD: 0.0028, tint: [1.0, 0.98, 1.05], lamp: MAG, lamp2: CYAN, lampL: 1500, win: 0.75, wet: 1 },
    storm: { sky: { name: "storm", k: 1.0 }, sun: null, fog: [0.05, 0.065, 0.075], fogD: 0.004, tint: [0.97, 1.0, 1.03], lamp: COOL, lampL: 1700, win: 0.55, wet: 1 },
  }, SK = LOOK[M.sky] || LOOK.dusk, night = M.sky === "neon";
  W.sky = SK.sky; W.sun = SK.sun; W.grade = { expo: 1.0, fog: SK.fog, fogD: SK.fogD, tint: SK.tint };
  // facades glow more the darker the sky; wet tracks get a glossier road
  const FAC = [["facade1", 40], ["facade2", 36], ["facade3", 110], ["facade4", 30], ["facade5", 18], ["facade6", 30]].map(([t, s], i) => { const key = "rc_f" + i + "_" + M.sky; if (!MATS[key]) MATS[key] = Object.assign({ t, s }, (TEX[t] || {}).e ? { e: [SK.win, SK.win * 0.9, SK.win * 0.75] } : {}, i === 3 || i === 5 ? { r: 3.2, m: 0.45 } : {}); return key; });
  const road = SK.wet ? "rc_roadWet" : "rc_road";
  const lampA = lightMat("rcLamp_" + M.sky, SK.lamp, 26), lampB = SK.lamp2 ? lightMat("rcLamp2_" + M.sky, SK.lamp2, 26) : lampA, flood = lightMat("rcFlood", COOL, 22);
  const sc = (key) => { const m = MATS[key], t = m.t && TEX[m.t]; return m.s || (t ? t.s : 1) || 1; };

  // ---- where things may stand: distance to the centre line, and whether a spot is inside the loop
  const near = (x, z) => { let bd = 1e18, bi = 0; for (let i = 0; i < N; i += 2) { const p = pts[i], d = (p[0] - x) * (p[0] - x) + (p[1] - z) * (p[1] - z); if (d < bd) { bd = d; bi = i; } } return [Math.sqrt(bd), bi]; };
  const inside = (x, z) => { let c = false; for (let i = 0, j = N - 4; i < N; j = i, i += 4) { const a = pts[i], b = pts[j < 0 ? 0 : j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const cellD = new Float32Array(G * G), cellIn = new Uint8Array(G * G);
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) { const c = z * G + x, cx = x * CS + 2, cz = z * CS + 2; cellD[c] = near(cx, cz)[0]; cellIn[c] = inside(cx, cz) ? 1 : 0; }
  B.floorAlbOf = (x, z) => { const c = z * G + x; return matAlb(cellD[c] < WALL + 2 ? road : cellIn[c] ? "rc_grass" : "rc_walk"); };
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) { const c = z * G + x; if (cellD[c] < WALL + 2.4) continue; B.floor(cellIn[c] ? "rc_grass" : "rc_walk", x * CS, z * CS, x * CS + CS, z * CS + CS, 0); }

  // ---- ribbons along the track, lit by the ground lightmap
  const strip = (key, l0, l1, y, from, cnt) => {
    from = from || 0; cnt = cnt == null ? N : cnt; const s = sc(key), V = [], I = [];
    for (let k = 0; k <= cnt; k++) { const a = at(from + k, l0), b = at(from + k, l1), v = (from + k) * STEP / s; V.push(a[0], y, a[1], 0, 1, 0, l0 / s, v, b[0], y, b[1], 0, 1, 0, l1 / s, v); if (k < cnt) { const q = k * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
    mesh(key, V, I, { floor: true });
  };
  strip(road, -HW - 0.6, HW + 0.6, 0.02);
  for (const s of [-1, 1]) {
    const a = s * (HW + 0.6), b = s * (HW + 1.6), lo = Math.min(a, b), hi = Math.max(a, b);
    for (let k = 0; k < N; k += 2) strip((k >> 1) & 1 ? "rc_kerbW" : "rc_kerbR", lo, hi, 0.045, k, Math.min(2, N - k));
    strip("rc_runoff", Math.min(s * (HW + 1.6), s * (WALL + 0.4)), Math.max(s * (HW + 1.6), s * (WALL + 0.4)), 0.015);
    strip("rc_verge", Math.min(s * (WALL + 0.4), s * (WALL + 6.5)), Math.max(s * (WALL + 0.4), s * (WALL + 6.5)), 0.012);
    strip("rc_white", s * (HW - 0.5) - 0.08, s * (HW - 0.5) + 0.08, 0.02);
    for (let k = 0; k < N; k += 8) strip("rc_white", s * HW * 0.5 - 0.07, s * HW * 0.5 + 0.07, 0.02, k, Math.min(3, N - k));
    strip("rc_yellow", s * 0.22 - 0.07, s * 0.22 + 0.07, 0.02);
  }
  // ---- concrete barriers, a catch fence on the outside of every bend
  const wallStrip = (key, lat, y0, y1, f, from, cnt) => { // f = +1: faces towards +lat, -1: towards -lat
    from = from || 0; cnt = cnt == null ? N : cnt; const s = sc(key), V = [], I = [];
    for (let k = 0; k <= cnt; k++) { const p = at(from + k, lat), t = tan[wrap(from + k)], nx = -t[1] * f, nz = t[0] * f, u = (from + k) * STEP / s; V.push(p[0], y0, p[1], nx, 0, nz, u, y0 / s, p[0], y1, p[1], nx, 0, nz, u, y1 / s); if (k < cnt) { const q = k * 2; if (f > 0) I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); else I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
    mesh(key, V, I, { gs: 4 });
  };
  const topStrip = (key, l0, l1, y) => { const s = sc(key), V = [], I = []; for (let k = 0; k <= N; k++) { const a = at(k, l0), b = at(k, l1), v = k * STEP / s; V.push(a[0], y, a[1], 0, 1, 0, l0 / s, v, b[0], y, b[1], 0, 1, 0, l1 / s, v); if (k < N) { const q = k * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } } mesh(key, V, I, { gs: 4 }); };
  const BOARDS = ["NETEAM SOLUTIONS", "PATCH TUESDAY", "IT DONE RIGHT", "MFA EVERYWHERE", "BACK UP TODAY", "ZERO TRUST RACING", "HELPDESK 4802", "FIBRE TO THE FINISH"];
  for (const s of [-1, 1]) {
    const li = s * (WALL + 0.4), lo = s * (WALL + 0.78);
    wallStrip("rc_barrier", li, 0, 1.05, -s); wallStrip("rc_barrier", lo, 0, 1.05, s); topStrip("rc_barrier", Math.min(li, lo), Math.max(li, lo), 1.05);
    wallStrip(s > 0 ? "rc_kerbR" : "rc_blue", s * (WALL + 0.385), 0.86, 0.98, -s);
    // sponsor boards where the wall runs straight enough
    for (let k = 6, n = 0; k < N - 4; k += 14) { if (R.curv[k] > 0.05 || R.curv[k + 3] > 0.05) continue; const a = at(k, s * (WALL + 0.36)), b = at(k + 3, s * (WALL + 0.36)), p = s > 0 ? b : a, q = s > 0 ? a : b;
      B.decal("decal", [p[0], 0.16, p[1]], [q[0] - p[0], 0, q[1] - p[1]], [0, 0.62, 0], 56, { k: "shop", t: BOARDS[(n++ + (s > 0 ? 3 : 0)) % BOARDS.length], v: n + (s > 0 ? 2 : 0) }); }
    // fence: runs of samples where the road bends away from this side
    let k = 0; while (k < N) { const t0 = tan[wrap(k - 3)], t1 = tan[wrap(k + 3)], turn = t0[0] * t1[1] - t0[1] * t1[0], out = Math.abs(turn) > 0.05 && (turn > 0 ? -1 : 1) === s; if (!out) { k++; continue; } let e = k; while (e < N) { const a0 = tan[wrap(e - 3)], a1 = tan[wrap(e + 3)], tn = a0[0] * a1[1] - a0[1] * a1[0]; if (!(Math.abs(tn) > 0.03 && (tn > 0 ? -1 : 1) === s)) break; e++; }
      const fenceRun = (k, e) => { wallStrip("rc_fence", s * (WALL + 0.6), 1.05, 3.4, -s, k, e - k); for (let j = k; j <= e; j += 3) { const p = at(j, s * (WALL + 0.62)); tube("trimSteel", p[0], 1.05, p[1], p[0], 3.5, p[1], 0.04, 5, { seg: 2.5 }); } const a = at(k, s * (WALL + 0.62)); for (let j = k; j < e; j += 3) { const p = at(j, s * (WALL + 0.62)), q = at(Math.min(e, j + 3), s * (WALL + 0.62)); tube("trimSteel", p[0], 3.4, p[1], q[0], 3.4, q[1], 0.025, 4, {}); } }
      for (let j0 = k, j = k; j <= e + 1; j++) { if (j > e || inTun(j, 2)) { if (j - j0 >= 6) fenceRun(j0, j - 1); j0 = j + 1; } }
      k = e + 1; }
  }
  // ---- street lamps: every 32 m on alternate sides, arm reaching over the road
  for (let k = 5, n = 0; k < N - 6; k += 20, n++) { if (inTun(k, 5)) continue; const s = n & 1 ? 1 : -1, p = at(k, s * (WALL + 2.2)), h = at(k, s * (WALL - 2.6)), y = 8.6, mat = n & 2 ? lampB : lampA, col = n & 2 && SK.lamp2 ? SK.lamp2 : SK.lamp;
    tube("trimBlack", p[0], 0, p[1], p[0], y, p[1], 0.09, 7, { seg: 3 }); tube("trimBlack", p[0], y, p[1], h[0], y + 0.35, h[1], 0.055, 6, { seg: 3 });
    box("trimBlack", h[0] - 0.42, y + 0.2, h[1] - 0.42, h[0] + 0.42, y + 0.36, h[1] + 0.42, { f: ALL, occ: false }); box(mat, h[0] - 0.36, y + 0.185, h[1] - 0.36, h[0] + 0.36, y + 0.2, h[1] + 0.36, { f: NY, occ: false });
    rectLight([h[0], y + 0.17, h[1]], [0.36, 0, 0], [0, 0, 0.36], [0, -1, 0], mul(col, SK.lampL * 0.24), { range: 34 }); }

  // ---- start: chequered line, gantry with the banner, grandstand on the outer side
  { const a = at(0, -HW - 0.6), t = tan[0], lv = [-t[1], t[0]];
    B.decal("decal", [a[0] - t[0] * 1.2, 0.03, a[1] - t[1] * 1.2], [lv[0] * (2 * HW + 1.2), 0, lv[1] * (2 * HW + 1.2)], [t[0] * 2.4, 0, t[1] * 2.4], 24, { k: "checker" });
    const L = at(0, -(WALL + 1.6)), Rr = at(0, WALL + 1.6);
    for (const p of [L, Rr]) { box("trimSteel", p[0] - 0.4, 0, p[1] - 0.4, p[0] + 0.4, 9.6, p[1] + 0.4, { f: ALL & ~NY, seg: 2.5 }); box("trimBlack", p[0] - 0.7, 0, p[1] - 0.7, p[0] + 0.7, 0.5, p[1] + 0.7, { f: ALL & ~NY, occ: false }); }
    for (const y of [6.85, 9.45]) tube("trimSteel", L[0], y, L[1], Rr[0], y, Rr[1], 0.16, 4, { seg: 3 });
    for (let k = 1; k < 10; k++) { const f = k / 10, x = L[0] + (Rr[0] - L[0]) * f, z = L[1] + (Rr[1] - L[1]) * f; tube("trimSteel", x, 6.85, z, x, 9.45, z, 0.05, 4, {}); }
    const u = [Rr[0] - L[0], 0, Rr[1] - L[1]], ul = Math.hypot(u[0], u[2]), m = 0.1; for (const s of [1, -1]) { const p = s > 0 ? L : Rr, o = [t[0] * 0.2 * -s, t[1] * 0.2 * -s]; B.decal("glowHi", [p[0] + u[0] * m * s + o[0], 7.05, p[1] + u[2] * m * s + o[1]], [u[0] * (1 - 2 * m) * s, 0, u[2] * (1 - 2 * m) * s], [0, 2.2, 0], 44, { k: "banner", t: "NETEAM GRAND PRIX" }); }
    W.start = { x: pts[0][0], z: pts[0][1] };
    // grandstand: six rows under a roof, on whichever side is not the park
    const gp = at(12, WALL + 14), s = inside(gp[0], gp[1]) ? -1 : 1, c = at(12, s * (WALL + 9)), dz = Math.sign(lv[1] * s) || 1, x0 = c[0] - 22, x1 = c[0] + 22, CL = ["d_cloth0", "d_cloth1", "d_cloth3", "d_cloth1", "d_cloth0", "d_cloth2"];
    for (let r = 0; r < 6; r++) { const za = c[1] + dz * r * 1.5, zb = c[1] + dz * (r + 1) * 1.5; box("rc_barrier", x0, 0, Math.min(za, zb), x1, 1 + r * 0.75, Math.max(za, zb), { f: ALL & ~NY, seg: 3 }); box(CL[r], x0 + 0.3, 1 + r * 0.75, Math.min(za, zb) + 0.35, x1 - 0.3, 1.42 + r * 0.75, Math.max(za, zb) - 0.35, { f: ALL & ~NY, occ: false, seg: 3 }); }
    const zb = c[1] + dz * 9.3, zf = c[1] - dz * 1; box("trimSteel", x0 - 0.5, 9.2, Math.min(zb, zf), x1 + 0.5, 9.45, Math.max(zb, zf), { f: ALL, seg: 3 }); box("rc_barrier", x0, 0, Math.min(zb, zb - dz * 0.4), x1, 9.2, Math.max(zb, zb - dz * 0.4), { f: ALL & ~NY, seg: 3 });
    for (let x = x0; x <= x1 + 0.1; x += 11) { box("trimSteel", x - 0.15, 0, c[1] - dz * 0.6 - 0.15, x + 0.15, 9.2, c[1] - dz * 0.6 + 0.15, { f: ALL & ~NY, occ: false, seg: 2.5 }); box(flood, x - 0.5, 9.14, c[1] + dz * 1 - 0.3, x + 0.5, 9.2, c[1] + dz * 1 + 0.3, { f: NY, occ: false }); rectLight([x, 9.1, c[1] + dz * 1], [0.5, 0, 0], [0, 0, 0.3], [0, -1, 0], mul(COOL, 520), { range: 22 }); }
    W.stand = { x0: x0 - 2, x1: x1 + 2, z0: Math.min(zb, zf) - 2, z1: Math.max(zb, zf) + 2 };
    W.crowd = { x0: x0 + 0.6, x1: x1 - 0.6, dz, rows: [0, 1, 2, 3, 4, 5].map(r => [c[1] + dz * (r * 1.5 + 0.95), 1.42 + r * 0.75]) };
  }
  // ---- billboards and the Neteam tower
  const taken = [W.stand];
  const BILL = [[["NETEAM", "Managed IT for NYC"], 0.14, 1, 1], [["PATCH YOUR STUFF", "Mike & Pavlos"], 0.3, -1, 3], [["MFA ON?", "Good. Now drive."], 0.46, 1, 0], [["TICKET #4802", "Car won't go faster"], 0.6, -1, 2], [["BACKUPS", "3 copies, 2 media, 1 offsite"], 0.75, 1, 4], [["NETEAM", "Since 2001"], 0.88, -1, 1]];
  BILL.forEach(([l, fi, s, col]) => { const i = Math.round(N * fi), p = at(i, s * (WALL + 9)), t = tan[i], a = Math.atan2(t[0], t[1]) + s * -0.9 + Math.PI, ux = Math.cos(a), uz = -Math.sin(a), w = 14, h = 7, y0 = 5;
    tube("trimSteel", p[0], 0, p[1], p[0], y0 + h, p[1], 0.3, 8, { seg: 3 }); const x0 = p[0] - ux * w / 2, z0 = p[1] - uz * w / 2;
    for (const y of [y0, y0 + h]) tube("trimBlack", x0, y, z0, x0 + ux * w, y, z0 + uz * w, 0.14, 4, { seg: 4 }); for (const f of [0, 1]) tube("trimBlack", x0 + ux * w * f, y0, z0 + uz * w * f, x0 + ux * w * f, y0 + h, z0 + uz * w * f, 0.14, 4, { seg: 4 });
    const nx = -uz, nz = ux; B.decal("glow", [x0 + nx * 0.16, y0, z0 + nz * 0.16], [ux * w, 0, uz * w], [0, h, 0], 30, { k: "bill", l, col }); B.decal("glow", [x0 + ux * w - nx * 0.16, y0, z0 + uz * w - nz * 0.16], [-ux * w, 0, -uz * w], [0, h, 0], 30, { k: "bill", l, col });
    taken.push({ x0: p[0] - 9, x1: p[0] + 9, z0: p[1] - 9, z1: p[1] + 9 }); });
  { let p = at(Math.round(N * 0.02), -(WALL + 26)); if (near(p[0], p[1])[0] < WALL + 16) p = at(Math.round(N * 0.02), WALL + 26); const w = 11, h = 124;
    box(FAC[5], p[0] - w, 0, p[1] - w, p[0] + w, h, p[1] + w, { f: ALL & ~NY, seg: 16, occ: p[0] > w && p[1] > w && p[0] < size - w && p[1] < size - w });
    box("trimBlack", p[0] - w - 0.3, h, p[1] - w - 0.3, p[0] + w + 0.3, h + 5, p[1] + w + 0.3, { f: ALL & ~NY, occ: false, seg: 8 });
    B.decal("glowHi", [p[0] - w + 1, h + 0.8, p[1] + w + 0.35], [2 * w - 2, 0, 0], [0, 3.4, 0], 24, { k: "logo" }); B.decal("glowHi", [p[0] + w - 1, h + 0.8, p[1] - w - 0.35], [-(2 * w - 2), 0, 0], [0, 3.4, 0], 24, { k: "logo" });
    B.decal("glowHi", [p[0] + w + 0.35, h + 0.8, p[1] + w - 1], [0, 0, -(2 * w - 2)], [0, 3.4, 0], 24, { k: "logo" }); B.decal("glowHi", [p[0] - w - 0.35, h + 0.8, p[1] - w + 1], [0, 0, 2 * w - 2], [0, 3.4, 0], 24, { k: "logo" });
    W.hq = { x: p[0], z: p[1], h: h + 5 }; taken.push({ x0: p[0] - w - 8, x1: p[0] + w + 8, z0: p[1] - w - 8, z1: p[1] + w + 8 }); }
  const free = (x, z, r) => !taken.some(q => x + r > q.x0 && x - r < q.x1 && z + r > q.z0 && z - r < q.z1);

  // ---- jumps: a steel kicker ramp across the middle of the road (the edges stay flat for anyone who wants to stay down)
  for (const r of R.ramps || []) {
    const c0 = r.c - r.L, c1 = r.c, w = r.w, H = r.H, V = [], I = [], st = 0.5, us = sc("rc_ramp");
    // top: slope rising linearly to the lip
    let q = 0; for (let f = c0; f <= c1 + 1e-6; f += st) { const h = H * (f - c0) / (c1 - c0), a = atF(f, -w), b = atF(f, w), v = (f - c0) * STEP / us; V.push(a[0], h + 0.03, a[1], 0, 1, 0, -w / us, v, b[0], h + 0.03, b[1], 0, 1, 0, w / us, v); if (f > c0) I.push(q - 2, q - 1, q, q - 1, q + 1, q); q += 2; }
    mesh("rc_ramp", V, I, { gs: 2 });
    // sides and the drop at the back
    for (const s2 of [-1, 1]) { const SV = [], SI = []; let n2 = 0; for (let f = c0; f <= c1 + 1e-6; f += st) { const h = H * (f - c0) / (c1 - c0), a = atF(f, s2 * w), t = tan[wrap(Math.round(f))], nx = -t[1] * s2, nz = t[0] * s2, u = (f - c0) * STEP / 2.7; SV.push(a[0], 0, a[1], nx, 0, nz, u, 0, a[0], h + 0.03, a[1], nx, 0, nz, u, h / 2.7); if (f > c0) { if (s2 > 0) SI.push(n2 - 2, n2, n2 - 1, n2 - 1, n2, n2 + 1); else SI.push(n2 - 2, n2 - 1, n2, n2 - 1, n2 + 1, n2); } n2 += 2; } mesh("rc_barrier", SV, SI, { gs: 2 }); }
    { const a = atF(c1, -w), b = atF(c1, w), a2 = atF(c1 + 0.6, -w), b2 = atF(c1 + 0.6, w), t = tan[wrap(c1)], BV = [a[0], H + 0.03, a[1], t[0], 0.5, t[1], 0, H / 2.7, b[0], H + 0.03, b[1], t[0], 0.5, t[1], 2 * w / 2.7, H / 2.7, a2[0], 0, a2[1], t[0], 0.5, t[1], 0, 0, b2[0], 0, b2[1], t[0], 0.5, t[1], 2 * w / 2.7, 0];
      mesh("rc_barrier", BV, [0, 2, 1, 1, 2, 3], { gs: 4 }); }
    // paint on the slope: yellow and black chevrons pointing up the ramp, and a striped lip
    { const p0 = atF(c0 + 0.3, -w + 0.3), p1 = atF(c0 + 0.3, w - 0.3), p2 = atF(c1 - 0.6, -w + 0.3), h0 = H * 0.3 / (c1 - c0), h2 = H * (c1 - c0 - 0.6) / (c1 - c0), U = [p1[0] - p0[0], 0, p1[1] - p0[1]], Vv = [p2[0] - p0[0], h2 - h0, p2[1] - p0[1]], ny = U[2] * Vv[0] - U[0] * Vv[2];
      if (ny > 0) B.decal("decal", [p0[0], h0 + 0.05, p0[1]], U, Vv, 22, { k: "ramp" }); else B.decal("decal", [p1[0], h0 + 0.05, p1[1]], [-U[0], 0, -U[2]], [p2[0] - p0[0] + (p0[0] - p1[0]) * 0, h2 - h0, p2[1] - p0[1]], 22, { k: "ramp" }); }
    // marker posts with lights either side of the lip
    for (const s2 of [-1, 1]) { const p = atF(c1, s2 * (w + 0.5)); tube("trimBlack", p[0], 0, p[1], p[0], H + 1.4, p[1], 0.07, 6, { seg: 2 }); box(lightMat("rcAmber", [1.0, 0.55, 0.12], 30), p[0] - 0.12, H + 1.4, p[1] - 0.12, p[0] + 0.12, H + 1.6, p[1] + 0.12, { f: ALL, occ: false }); }
  }
  // ---- the tunnel: tiled walls, a concrete roof, two rows of lights and a lit name over each mouth
  if (TUN) {
    const [a0, a1] = TUN, n = a1 - a0, TW = WALL + 1.0, TH = 7.2, RT = 0.9;
    for (const s2 of [-1, 1]) { wallStrip("rc_tunwall", s2 * TW, 0, TH, -s2, a0, n); wallStrip("rc_tunceil", s2 * (TW + RT), 0, TH + RT, s2, a0, n); }
    { const s0 = sc("rc_tunceil"), Vd = [], Id = [], Vu = [], Iu = []; for (let k = 0; k <= n; k++) { const L = at(a0 + k, -TW - RT), Rr = at(a0 + k, TW + RT), v = (a0 + k) * STEP / s0;
        Vd.push(L[0], TH, L[1], 0, -1, 0, 0, v, Rr[0], TH, Rr[1], 0, -1, 0, (2 * TW) / s0, v); Vu.push(L[0], TH + RT, L[1], 0, 1, 0, 0, v, Rr[0], TH + RT, Rr[1], 0, 1, 0, (2 * TW) / s0, v);
        if (k < n) { const q = k * 2; Id.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); Iu.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
      mesh("rc_tunceil", Vd, Id, { gs: 2 }); mesh("rc_tunceil", Vu, Iu, { gs: 4 }); }
    // the roof and walls block the sky for the light baker: boxes around each short run
    for (let k = 0; k < n; k += 2) { const ps = [at(a0 + k, -TW - RT), at(a0 + k, TW + RT), at(a0 + k + 2, -TW - RT), at(a0 + k + 2, TW + RT)], xs = ps.map(p => p[0]), zs = ps.map(p => p[1]);
      B.occ(Math.min(...xs), TH, Math.min(...zs), Math.max(...xs), TH + RT, Math.max(...zs), [0.18, 0.18, 0.18]);
      for (const s2 of [-1, 1]) { const w0 = at(a0 + k, s2 * TW), w1 = at(a0 + k + 2, s2 * TW), w2 = at(a0 + k, s2 * (TW + RT)), w3 = at(a0 + k + 2, s2 * (TW + RT)), wx = [w0[0], w1[0], w2[0], w3[0]], wz = [w0[1], w1[1], w2[1], w3[1]]; B.occ(Math.min(...wx), 0, Math.min(...wz), Math.max(...wx), TH, Math.max(...wz), [0.5, 0.5, 0.5]); } }
    // lights: strips in two rows, a real light every second one
    const tl = lightMat("rcTun_" + M.sky, [1.0, 0.86, 0.62], 22);
    for (let k = 2, j = 0; k < n - 1; k += 5, j++) for (const s2 of [-1, 1]) { const p = at(a0 + k, s2 * 4.2), t = tan[wrap(a0 + k)], hx = t[0] * 1.1, hz = t[1] * 1.1;
      tube("trimBlack", p[0] - hx, TH - 0.12, p[1] - hz, p[0] + hx, TH - 0.12, p[1] + hz, 0.12, 4, {}); box(tl, Math.min(p[0] - hx, p[0] + hx) - 0.08, TH - 0.26, Math.min(p[1] - hz, p[1] + hz) - 0.08, Math.max(p[0] - hx, p[0] + hx) + 0.08, TH - 0.24, Math.max(p[1] - hz, p[1] + hz) + 0.08, { f: NY, occ: false });
      if ((j & 1) === 0) rectLight([p[0], TH - 0.3, p[1]], [0.4, 0, 0], [0, 0, 0.4], [0, -1, 0], mul([1.0, 0.86, 0.62], 260), { range: 18 }); }
    // a lit strip along both walls at kerb height, and the mouths
    for (const s2 of [-1, 1]) wallStrip(lightMat("rcTunEdge", [0.3, 0.75, 1.0], 9), s2 * (TW - 0.02), 0.9, 0.98, -s2, a0, n);
    for (const [k, dir] of [[a0, -1], [a1, 1]]) { const t = tan[wrap(k)], L = at(k, -TW - RT - 1.2), Rr = at(k, TW + RT + 1.2), o = [t[0] * dir * 0.02, t[1] * dir * 0.02];
      // the face above the opening, and a sign on it facing the cars that drive in
      const FV = [L[0], TH, L[1], t[0] * dir, 0, t[1] * dir, 0, 0, Rr[0], TH, Rr[1], t[0] * dir, 0, t[1] * dir, 1, 0, L[0], TH + 3.4, L[1], t[0] * dir, 0, t[1] * dir, 0, 1, Rr[0], TH + 3.4, Rr[1], t[0] * dir, 0, t[1] * dir, 1, 1];
      mesh("rc_tunceil", FV, dir < 0 ? [0, 1, 2, 1, 3, 2] : [0, 2, 1, 1, 2, 3], { gs: 4 });
      for (const s2 of [-1, 1]) { const P0 = at(k, s2 * TW), P1 = at(k, s2 * (TW + RT + 1.2)), FV2 = [P0[0], 0, P0[1], t[0] * dir, 0, t[1] * dir, 0, 0, P1[0], 0, P1[1], t[0] * dir, 0, t[1] * dir, 1, 0, P0[0], TH, P0[1], t[0] * dir, 0, t[1] * dir, 0, 1, P1[0], TH, P1[1], t[0] * dir, 0, t[1] * dir, 1, 1]; mesh("rc_tunceil", FV2, (dir < 0) === (s2 < 0) ? [0, 2, 1, 1, 2, 3] : [0, 1, 2, 1, 3, 2], { gs: 4 }); }
      if (dir < 0) { const A = at(k, 6.5), Bq = at(k, -6.5); B.decal("glowHi", [A[0] - t[0] * 0.05, TH + 0.7, A[1] - t[1] * 0.05], [Bq[0] - A[0], 0, Bq[1] - A[1]], [0, 2.0, 0], 30, { k: "banner", t: "NETEAM TUNNEL" }); }
      else { const A = at(k, -6.5), Bq = at(k, 6.5); B.decal("glowHi", [A[0] + t[0] * 0.05, TH + 0.7, A[1] + t[1] * 0.05], [Bq[0] - A[0], 0, Bq[1] - A[1]], [0, 2.0, 0], 30, { k: "banner", t: "NETEAM TUNNEL" }); } }
  }
  // ---- sign gantries over the road (motorway style), on straight-ish stretches away from the jumps and the tunnel
  { const GS = [["NETEAM HQ", "HELPDESK · 4802", "↑"], ["DATA CENTER", "NEXT EXIT", "↗"], ["FINISH", "KEEP LEFT FOR BOOST", "↑"]];
    let made = 0; for (const f of [0.28, 0.6, 0.86, 0.38, 0.7]) { if (made >= 2) break; const k = Math.round(N * f); if (inTun(k, 25) || (R.ramps || []).some(r => Math.abs(wrap(k - r.c + N / 2) - N / 2) < 20) || R.curv[k] > 0.08) continue;
      const L = at(k, -(WALL + 1.6)), Rr = at(k, WALL + 1.6), t = tan[k], Y = 7.4;
      for (const p of [L, Rr]) { box("trimSteel", p[0] - 0.25, 0, p[1] - 0.25, p[0] + 0.25, Y + 2.6, p[1] + 0.25, { f: ALL & ~NY, seg: 2.5 }); }
      for (const y of [Y, Y + 2.4]) tube("trimSteel", L[0], y, L[1], Rr[0], y, Rr[1], 0.12, 5, { seg: 3 });
      for (let j = 1; j < 12; j++) { const f2 = j / 12, x = L[0] + (Rr[0] - L[0]) * f2, z = L[1] + (Rr[1] - L[1]) * f2; tube("trimSteel", x, Y, z, x + (Rr[0] - L[0]) / 24, Y + 2.4, z + (Rr[1] - L[1]) / 24, 0.035, 4, {}); }
      const g = GS[made % GS.length]; for (const [lat0, lat1, gi] of [[-11, -1.5, 0], [1.5, 11, 1]]) { const A = at(k, lat1), Bq = at(k, lat0); B.decal("glow", [A[0] - t[0] * 0.25, Y - 0.1, A[1] - t[1] * 0.25], [Bq[0] - A[0], 0, Bq[1] - A[1]], [0, 2.6, 0], 26, { k: "gsign", t: gi ? g[1] : g[0], v: gi, a: g[2] }); }
      made++; } }
  // ---- red and white chevron boards on the outside of every hard bend
  for (let k = 0, run = 0; k < N; k++) { const t0 = tan[wrap(k - 4)], t1 = tan[wrap(k + 4)], turn = t0[0] * t1[1] - t0[1] * t1[0]; if (Math.abs(turn) < 0.16 || inTun(k, 2)) { run = 0; continue; } if (run++ % 7) continue;
    const s2 = turn > 0 ? -1 : 1, a = at(k, s2 * (WALL + 0.34)), b = at(k + 2, s2 * (WALL + 0.34)), p = s2 > 0 ? b : a, q = s2 > 0 ? a : b;
    B.decal("glow", [p[0], 1.15, p[1]], [q[0] - p[0], 0, q[1] - p[1]], [0, 1.0, 0], 30, { k: "chev", v: s2 > 0 ? 1 : 0 }); }
  // ---- city blocks outside the loop, a few low pavilions and many trees inside
  const harbor = M.tid === "harbor", SIGNS = ["OPEN 24H", "DINER", "HOTEL", "NOODLES", "ARCADE", "CLOUD BAR", "PIXEL", "RAMEN", "TAXI", "KARAOKE"];
  let signN = 0;
  for (let gx = -52; gx <= size + 52; gx += 22) for (let gz = -52; gz <= size + 52; gz += 22) {
    const x = gx + (rnd() - 0.5) * 7, z = gz + (rnd() - 0.5) * 7, w = 6.5 + rnd() * 2.5, dp = 6.5 + rnd() * 2.5, q = [rnd(), rnd(), rnd(), rnd()], [d, bi] = near(x, z);
    if (d < WALL + 9 + Math.max(w, dp) * 1.2 || !free(x, z, Math.max(w, dp))) continue;
    const inn = inside(x, z); if (inn && q[0] < 0.8) continue;
    const inGrid = x - w > 0 && z - dp > 0 && x + w < size && z + dp < size;
    if (harbor && !inn && d < 60 && q[1] < 0.7) { // container stacks on the quay
      const n = 1 + Math.floor(q[2] * 3), cm = ["rc_boxG", "rc_boxR", "rc_boxB"][Math.floor(q[3] * 3) % 3]; for (let k = 0; k < n; k++) box(k % 2 ? "rc_boxR" : cm, x - 6.1, k * 2.6, z - 1.22 - (k % 2) * 0.1, x + 6.1, k * 2.6 + 2.6, z + 1.22 + (k % 2) * 0.1, { f: ALL & ~NY, seg: 3, occ: inGrid && k === 0 ? undefined : false });
      if (inGrid && n > 1) B.occ(x - 6.1, 0, z - 1.3, x + 6.1, n * 2.6, z + 1.3, [0.2, 0.2, 0.2]);
      continue; }
    const h = inn ? 5 + q[1] * 7 : d < 45 ? 14 + q[1] * 30 : 22 + q[1] * q[1] * 96, m = FAC[Math.floor(q[2] * 6) % 6];
    box(m, x - w, 0, z - dp, x + w, h, z + dp, { f: ALL & ~NY & ~PY, seg: Math.max(3, h / 7), occ: inGrid });
    box("trimBlack", x - w - 0.2, h, z - dp - 0.2, x + w + 0.2, h + 0.7, z + dp + 0.2, { f: ALL & ~NY, occ: false, seg: 6 });
    if (q[3] < 0.5 && !inn) box("trimBlack", x - w * 0.4, h + 0.7, z - dp * 0.4, x + w * 0.4, h + 0.7 + 2 + q[0] * 4, z + dp * 0.4, { f: ALL & ~NY, occ: false, seg: 6 });
    // a lit sign on the side that faces the road, on the nearer blocks
    if (!inn && d < 52 && q[3] < (night ? 0.95 : 0.5)) { const p = pts[bi], ax = Math.abs(p[0] - x) > Math.abs(p[1] - z), sg = ax ? Math.sign(p[0] - x) : Math.sign(p[1] - z), y = 5 + q[0] * 7, sw = Math.min(8, (ax ? dp : w) * 1.5), txt = SIGNS[signN++ % SIGNS.length];
      if (ax) B.decal("glowHi", [x + sg * (w + 0.12), y, z + sg * sw / 2], [0, 0, -sg * sw], [0, sw * 0.3, 0], 26, { k: "sign", t: txt, sub: "NETEAM CITY", col: signN % 4 });
      else B.decal("glowHi", [x - sg * sw / 2, y, z + sg * (dp + 0.12)], [sg * sw, 0, 0], [0, sw * 0.3, 0], 26, { k: "sign", t: txt, sub: "NETEAM CITY", col: signN % 4 }); }
  }
  // a tree is a trunk under three lumpy crowns
  const blob = (cx, cy, cz, rx, ry, rings, segs) => {
    const V = [], I = [], ts = sc("rc_leaf"), ph = rnd() * 6.28;
    for (let i = 0; i <= rings; i++) { const th = Math.PI * i / rings, st = Math.sin(th), ct = Math.cos(th);
      for (let j = 0; j <= segs; j++) { const a = 2 * Math.PI * j / segs + ph, jj = j % segs, k = i === 0 || i === rings ? 1 : 1 + 0.2 * Math.sin(jj * 2.4 + i * 1.7 + ph * 3) + 0.11 * Math.sin(jj * 5.1 + i * 3.3 + ph);
        const nx = st * Math.cos(a), nz = st * Math.sin(a); V.push(cx + nx * rx * k, cy + ct * ry * k, cz + nz * rx * k, nx, ct, nz, a * rx / ts, th * ry / ts); } }
    for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) { const a = i * (segs + 1) + j, b = a + segs + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
    mesh("rc_leaf", V, I, { gs: 1 });
  };
  for (let k = 0; k < 520; k++) { const x = 8 + rnd() * (size - 16), z = 8 + rnd() * (size - 16), q = rnd(), d = near(x, z)[0]; if (d < WALL + 8.5 || !free(x, z, 2)) continue; const inn = inside(x, z); if (!inn && (d > WALL + 13 || q > 0.5)) continue;
    const s = 0.8 + rnd() * 0.9, hh = 2.3 * s, ang = rnd() * 6.28; tube("rc_trunk", x, 0, z, x, hh + 0.8 * s, z, 0.17 * s, 6, { seg: 2 });
    blob(x, hh + 1.5 * s, z, 1.9 * s, 1.7 * s, 5, 8);
    for (let j = 0; j < 2; j++) { const a = ang + j * 2.6 + rnd(), r = 1.15 * s; blob(x + Math.cos(a) * r, hh + (0.7 + rnd() * 1.3) * s, z + Math.sin(a) * r, 1.15 * s, 1.0 * s, 4, 6); } }
  // ---- the bridge circuit crosses under two suspension towers
  if (M.tid === "bridge") for (const fi of [0.1, 0.22]) { const i = Math.round(N * fi), tops = [-1, 1].map(s => { const p = at(i, s * (WALL + 3.5)); box("rc_barrier", p[0] - 2, 0, p[1] - 2, p[0] + 2, 46, p[1] + 2, { f: ALL & ~NY, seg: 6 }); box("rc_barrier", p[0] - 2.4, 46, p[1] - 2.4, p[0] + 2.4, 48, p[1] + 2.4, { f: ALL, occ: false, seg: 3 }); return p; });
    tube("rc_barrier", tops[0][0], 40, tops[0][1], tops[1][0], 40, tops[1][1], 1.2, 4, { seg: 4 }); tube("rc_barrier", tops[0][0], 22, tops[0][1], tops[1][0], 22, tops[1][1], 0.9, 4, { seg: 4 });
    for (const s of [0, 1]) for (const dir of [-1, 1]) { const e = at(i + dir * 34, (s ? 1 : -1) * (WALL + 3.5)); tube("trimSteel", tops[s][0], 47, tops[s][1], e[0], 1.2, e[1], 0.14, 5, { seg: 8 }); for (let j = 1; j < 6; j++) { const f = j / 6, hx = tops[s][0] + (e[0] - tops[s][0]) * f, hz = tops[s][1] + (e[1] - tops[s][1]) * f; tube("trimSteel", hx, 47 + (1.2 - 47) * f, hz, hx, 1.1, hz, 0.035, 4, { seg: 8 }); } } }
};
NXW.themes.race.outdoor = true; NXW.themes.race.H = 3;
