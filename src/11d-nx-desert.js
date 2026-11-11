// ======================= NX theme: Sandstorm District, a desert town under a high sun =======================
// Every block of walls is a building with its own height and plaster. Doors, shuttered windows, roof beams, rugs, pots
// and stalls dress the streets; a slatted canopy stripes the old bazaar with shade; towers, domes and palms stand beyond.
NXW.themes.desert = (B, M, env) => {
  const { W, A, G, H, CS, quad, box, cyl, tube, rectLight, matAlb, hsh, PX, PY, NY, PZ, NZ, ALL } = B, NXb = B.NX;
  const { ch, solid, border, ci, faces, runs, pods, podOf, frame, zoneOf, cellH } = A;
  const K = NXW.kit(B), size = G * CS, norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  W.sky = { name: "desert", k: 1.0 }; W.sun = { dir: norm([0.46, 0.78, 0.42]), E: [15, 13.2, 10.6], ang: 0.03 };
  W.grade = { expo: 1.0, fog: [0.62, 0.52, 0.4], fogD: 0.0045, tint: [1.03, 1.0, 0.95] };
  const WALLS = ["d_w0", "d_w1", "d_w2", "d_w3", "d_w4", "d_w5", "d_w6"], CLOTH = ["d_cloth0", "d_cloth1", "d_cloth2", "d_cloth3"], DOORS = ["d_dwood", "d_blue", "d_green", "d_wood"];
  const matOf = (x, z) => { const p = podOf[ci(x, z)]; return WALLS[Math.floor((p >= 0 ? hsh(p, 5, 3) : hsh(Math.floor(x / 3), Math.floor(z / 3), 5)) * WALLS.length) % WALLS.length]; };
  const FLOOR = { hall: "d_sand", siteA: "d_cobble", siteB: "d_patio", red: "d_gravel", blue: "d_pave" };
  B.floorAlbOf = (x, z) => matAlb(FLOOR[zoneOf(x, z)] || "d_sand");
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) if (!solid(x, z)) B.floor(FLOOR[zoneOf(x, z)] || "d_sand", x * CS, z * CS, x * CS + CS, z * CS + CS, 0);
  K.stepWalls(matOf);

  const SHOPS = ["CHAI & CABLES", "ROUTER BAZAAR", "SPICE & SWITCHES", "PATCH PANEL TEA", "OASIS WI-FI", "COPPER & FIBRE", "DATES & DATA", "THE LAST MILE"];
  let shopN = 0;
  const pots = (f, u, w, n, sd) => { for (let k = 0; k < n; k++) { const r = 0.14 + hsh(sd, k, 31) * 0.12, hh = 0.3 + hsh(sd, k, 32) * 0.45, p = B.fpos(f, u + k * 0.42 + hsh(sd, k, 33) * 0.1, 0, w + hsh(sd, k, 34) * 0.12); cyl("d_clay", p[0], 0, p[2], r * 0.7, hh * 0.55, 8, { r1: r, occ: false, cap: false }); cyl("d_clay", p[0], hh * 0.55, p[2], r, hh * 0.45, 8, { r1: r * 0.55, occ: false, cap: false }); } };
  for (const f of faces) {
    const h = f.h, mat = matOf(f.cx, f.cz), h1 = hsh(f.cx, f.cz, f.d), h2 = hsh(f.cx, f.cz, f.d + 4), h3 = hsh(f.cx, f.cz, f.d + 8), sd = f.cx * 31 + f.cz * 7 + f.d, zn = f.zone;
    B.wall(f, mat, 0, 0, CS, h); f.kind = "plain"; f.alb = matAlb(mat); f.free = 1;
    B.fbox(f, "d_base", 0, 0, 0, CS, 0.45 + hsh(f.cx, f.cz, 2) * 0.2, 0.035, { occ: false, seg: 2 });
    B.fbox(f, mat, -0.06, h - 0.22, 0, CS + 0.06, h, 0.09, { f: ALL & ~PY, occ: false, seg: 2 });
    // roof beams poking out under the parapet
    if (h < 6 && h2 < 0.55) for (let k = 0; k < 5; k++) { const a = B.fpos(f, 0.4 + k * 0.8, h - 0.62, 0), b = B.fpos(f, 0.4 + k * 0.8, h - 0.62, 0.34); tube("d_dwood", a[0], a[1], a[2], b[0], b[1], b[2], 0.07, 6, {}); }
    // upper windows on tall fronts
    if (h >= 5.6) for (const u of [0.9, 2.5]) { if (hsh(f.cx + u, f.cz, f.d + 12) < 0.3) continue; B.fbox(f, "d_dark", u, 3.9, 0, u + 0.6, 4.9, 0.012, { occ: false }); B.fbox(f, "d_wood", u - 0.06, 3.82, 0, u + 0.66, 3.9, 0.06, { occ: false }); if (h3 < 0.5) B.fbox(f, DOORS[Math.floor(h3 * 8) % 4], u + 0.6, 3.9, 0, u + 0.9, 4.9, 0.03, { occ: false }); }
    if (h1 < 0.2) { // door in a deep wooden frame, a step, a lantern hook
      f.free = 0; const dm = DOORS[Math.floor(h2 * 4) % 4];
      B.fbox(f, dm, 1.4, 0.12, 0, 2.6, 2.3, 0.04, { occ: false, seg: 1.2 }); for (const [u0, v0, u1, v1] of [[1.28, 0, 1.4, 2.42], [2.6, 0, 2.72, 2.42], [1.4, 2.3, 2.6, 2.42]]) B.fbox(f, "d_wood", u0, v0, 0, u1, v1, 0.1, { occ: false, seg: 1.2 });
      B.fbox(f, "d_base", 1.2, 0, 0, 2.8, 0.12, 0.3, { occ: false }); B.fbox(f, "trimBlack", 2.42, 1.1, 0.04, 2.47, 1.3, 0.08, { occ: false }); for (const v of [0.7, 1.7]) B.fbox(f, "trimBlack", 1.4, v, 0.04, 2.6, v + 0.05, 0.05, { occ: false });
      if (h3 < 0.5) { B.fbox(f, "d_wood", 1.0, 2.75, 0, 3.0, 3.25, 0.05, { occ: false }); B.fdecal(f, "decal", 1.04, 2.79, 2.96, 3.21, 0.055, 110, { k: "shop", t: SHOPS[shopN++ % SHOPS.length], v: shopN }); }
    } else if (h1 < 0.48) { // window: dark opening, frame, sill, two shutters folded back
      f.free = 0; const sm = DOORS[1 + Math.floor(h2 * 3) % 3];
      B.fbox(f, "d_dark", 1.4, 1.15, 0, 2.6, 2.45, 0.012, { occ: false }); for (const [u0, v0, u1, v1] of [[1.32, 1.07, 1.4, 2.53], [2.6, 1.07, 2.68, 2.53], [1.4, 2.45, 2.6, 2.53], [1.97, 1.15, 2.03, 2.45]]) B.fbox(f, "d_wood", u0, v0, 0, u1, v1, 0.06, { occ: false });
      B.fbox(f, "d_base", 1.25, 0.99, 0, 2.75, 1.07, 0.14, { occ: false }); for (const u of [0.74, 2.7]) B.fbox(f, sm, u, 1.13, 0, u + 0.56, 2.47, 0.035, { occ: false, seg: 1.2 });
      if (h3 < 0.4) pots(f, 1.5, 0.22, 3, sd);
    } else if (h1 < 0.58) { // rug over a rod
      f.free = 0; const a = B.fpos(f, 1.1, 2.72, 0.07), b = B.fpos(f, 2.9, 2.72, 0.07); tube("d_dwood", a[0], a[1], a[2], b[0], b[1], b[2], 0.03, 6, {}); B.fdecal(f, "decal", 1.3, 0.75, 2.7, 2.72, 0.045, 90, { k: "rug", v: Math.floor(h2 * 6) });
    } else if (h1 < 0.7 && (zn === "siteA" || zn === "siteB" || zn === "hall")) { // stall: trestle, crates and pots, cloth roof on two poles
      f.free = 0; const cm = CLOTH[Math.floor(h2 * 4) % 4];
      B.fbox(f, "d_wood", 0.6, 0.72, 0, 3.4, 0.8, 0.6, { f: ALL, occ: false, seg: 1.2 }); for (const u of [0.7, 3.24]) B.fbox(f, "d_dwood", u, 0, 0.1, u + 0.06, 0.72, 0.56, { f: ALL, occ: false });
      B.fbox(f, "d_wood", 0.8, 0.8, 0.08, 1.4, 1.12, 0.5, { f: ALL, occ: false }); B.fbox(f, "d_dwood", 1.6, 0.8, 0.1, 2.1, 1.0, 0.5, { f: ALL, occ: false });
      for (let k = 0; k < 3; k++) { const p = B.fpos(f, 2.4 + k * 0.32, 0.8, 0.3); cyl("d_clay", p[0], 0.8, p[2], 0.1, 0.26, 8, { r1: 0.13, occ: false }); }
      B.fbox(f, cm, 0.3, 2.5, 0, 3.7, 2.54, 1.5, { f: ALL, seg: 1.2 }); B.fbox(f, cm, 0.3, 2.3, 1.48, 3.7, 2.54, 1.5, { f: ALL, occ: false, seg: 1.2 });
      for (const u of [0.34, 3.62]) B.fbox(f, "d_dwood", u, 0, 1.42, u + 0.04, 2.5, 1.46, { f: ALL, occ: false, seg: 1.2 });
    } else if (h1 < 0.8) pots(f, 0.5 + h2 * 1.8, 0.25, 2 + Math.floor(h3 * 3), sd);
    else if (h1 < 0.86) { f.free = 0; B.fdecal(f, "decal", 1.2, 1.5, 2.8, 2.5, 0.012, 100, { k: "poster", v: Math.floor(h2 * 6), l: [["NETEAM", "FIXED", "IT"], ["HAVE YOU", "TRIED", "REBOOT"], ["BACK UP", "BEFORE", "SUNSET"]][Math.floor(h3 * 3) % 3] }); }
  }
  // ---- slatted canopy over the old bazaar: stripes of sun and shade
  K.cellsOf("b").forEach(([x, z]) => { const x0 = x * CS, z0 = z * CS; for (let k = 0; k < 4; k++) box("d_dwood", x0, 4.3, z0 + 0.3 + k, x0 + CS, 4.38, z0 + 0.72 + k, { f: ALL, seg: 2 }); box("d_wood", x0 + 1.9, 4.38, z0, x0 + 2.1, 4.52, z0 + CS, { f: ALL, occ: false, seg: 2 }); });
  // cloth sails across the market, one in three cells
  K.cellsOf("a").forEach(([x, z]) => { if (hsh(x, z, 61) > 0.3) return; const x0 = x * CS, z0 = z * CS; box(CLOTH[Math.floor(hsh(x, z, 62) * 4) % 4], x0 + 0.5, 3.4, z0 + 0.5, x0 + CS - 0.5, 3.43, z0 + CS - 0.5, { f: ALL, seg: 1.2 }); for (const [px, pz] of [[0.5, 0.5], [3.5, 0.5], [0.5, 3.5], [3.5, 3.5]]) box("d_dwood", x0 + px - 0.035, 0, z0 + pz - 0.035, x0 + px + 0.035, 3.5, z0 + pz + 0.035, { f: ALL & ~NY, occ: false, seg: 1.2 }); });
  // rugs laid in the two sites
  [["a", 0.8], ["b", 0.5]].forEach(([k, q]) => K.cellsOf(k).forEach(([x, z]) => { if (hsh(x, z, 71) > 0.16) return; B.decal("decal", [x * CS + 0.9, 0.007, z * CS + 3.5], [2.2, 0, 0], [0, 0, -3], 60, { k: "rug", v: Math.floor(hsh(x, z, 72) * 6) }); }));
  K.decks("d_wood", "d_clay", 2, "d_dwood");   // crate stacks and the roof terrace over the plaza
  K.siteMarks([0, 1]); K.signs(M, [0, 1, 3, 2], 2.75, (q) => q.free);

  // ---- beyond the walls: towers, a dome and palms, lit by the open sky
  const R = NXW.rng(NXW.strSeed("desert-skyline"));
  for (let i = 0; i < 22; i++) {
    const side = i % 4, t = (Math.floor(i / 4) + R()) / 6 * size, off = 7 + R() * 26, w = 5 + R() * 6, hh = 11 + R() * 12, cx = side === 0 ? -off : side === 1 ? size + off : t, cz = side === 2 ? -off : side === 3 ? size + off : t, m = WALLS[Math.floor(R() * WALLS.length)];
    box(m, cx - w / 2, 0, cz - w / 2, cx + w / 2, hh, cz + w / 2, { f: ALL & ~NY, occ: false, seg: 4 });
    box(m, cx - w / 2 - 0.15, hh, cz - w / 2 - 0.15, cx + w / 2 + 0.15, hh + 0.5, cz + w / 2 + 0.15, { f: ALL & ~NY, occ: false, seg: 4 });
    const q = R(); if (q < 0.3) { let r0 = w * 0.38; for (let k = 0; k < 5; k++) { const r1 = w * 0.38 * Math.cos((k + 1) / 5 * 1.5); cyl("d_w6", cx, hh + 0.5 + k * w * 0.075, cz, r0, w * 0.075, 14, { r1, occ: false, cap: k === 4 }); r0 = r1; } }
    else if (q < 0.5) { cyl(m, cx, hh + 0.5, cz, 1.1, 7, 10, { occ: false, cap: false }); cyl("d_w6", cx, hh + 7.5, cz, 1.4, 0.4, 10, { occ: false }); cyl(m, cx, hh + 7.9, cz, 0.8, 2.2, 10, { r1: 0.1, occ: false }); }
    for (const [du, dv] of [[-0.25, 0.75], [0.25, 0.75], [-0.25, 0.5], [0.25, 0.5]]) { const s = side < 2 ? (side === 0 ? 1 : -1) : 0, s2 = side >= 2 ? (side === 2 ? 1 : -1) : 0; if (s) box("d_dark", cx + s * (w / 2 + 0.02) - 0.01, hh * dv, cz + du * w - 0.4, cx + s * (w / 2 + 0.02) + 0.01, hh * dv + 1.3, cz + du * w + 0.4, { f: s > 0 ? PX : NXb, occ: false }); else box("d_dark", cx + du * w - 0.4, hh * dv, cz + s2 * (w / 2 + 0.02) - 0.01, cx + du * w + 0.4, hh * dv + 1.3, cz + s2 * (w / 2 + 0.02) + 0.01, { f: s2 > 0 ? PZ : NZ, occ: false }); }
  }
  for (let i = 0; i < 26; i++) {
    const side = i % 4, t = R() * size, off = 1.5 + R() * 5, px = side === 0 ? -off : side === 1 ? size + off : t, pz = side === 2 ? -off : side === 3 ? size + off : t, hh = 9.5 + R() * 4, lx = (R() - 0.5) * 1.6, lz = (R() - 0.5) * 1.6;
    tube("d_trunk", px, 0, pz, px + lx, hh, pz + lz, 0.2, 7, { seg: 3 });
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + R(), L = 2.6 + R() * 1.2, dx = Math.cos(a), dz = Math.sin(a), tx = px + lx, tz = pz + lz, wx = -dz * 0.45, wz = dx * 0.45, drop = 1.1 + R() * 0.9;
      for (const s of [1, -1]) { quad("d_palm", tx - wx * s, hh + 0.1, tz - wz * s, wx * 2 * s, 0, wz * 2 * s, dx * L * 0.5, 0.35, dz * L * 0.5, { seg: 3 }); quad("d_palm", tx + dx * L * 0.5 - wx * s * 0.8, hh + 0.45, tz + dz * L * 0.5 - wz * s * 0.8, wx * 1.6 * s, 0, wz * 1.6 * s, dx * L * 0.5, -drop, dz * L * 0.5, { seg: 3 }); } }
  }
};
NXW.themes.desert.outdoor = true; NXW.themes.desert.H = 4.5;
NXW.themes.desert.blockH = (x, z, c) => { const p = c.podOf[c.ci(x, z)]; return p >= 0 ? 3.6 + Math.floor(c.hsh(p, 3, 1) * 4) * 0.9 : 5.2 + Math.floor(c.hsh(Math.floor(x / 3), Math.floor(z / 3), 7) * 4) * 0.8; };
