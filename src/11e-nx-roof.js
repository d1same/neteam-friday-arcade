// ======================= NX theme: Rooftop, a tower roof over the city at night =======================
// Plant rooms, brick bulkheads and glowing skylights stand on wet roofing felt. A parapet and a glass screen run round
// the edge with a gravel ledge beyond; floodlights on poles and on the plant light the roof in sodium and cold white.
// The helipad, the water tower, the antenna farm and the stairwell are the four named corners.
NXW.themes.roof = (B, M, env) => {
  const { W, A, G, H, CS, quad, box, cyl, tube, rectLight, lightMat, matAlb, hsh, PX, PY, NY, PZ, NZ, ALL } = B, NXb = B.NX;
  const { ch, solid, border, ci, faces, runs, pods, podOf, frame, zoneOf, cellH } = A, DIRS = NXW.DIRS;
  const K = NXW.kit(B), { WARM, COOL, CYAN, GREEN, RED, SODIUM, MAG } = K.C, mul = K.mul, size = G * CS, norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  W.sky = { name: "night", k: 1.0, E: 0.3 }; W.sun = { dir: norm([0.55, 0.3, 0.78]), E: [0.3, 0.4, 0.62], ang: 0.03 };
  W.grade = { expo: 1.0, fog: [0.02, 0.03, 0.055], fogD: 0.0035, tint: [0.97, 1.0, 1.05] };
  const lampSod = lightMat("lampSod", SODIUM, 30), lampCool = lightMat("lampCool", COOL, 22), lampWarm = lightMat("lampWarm2", WARM, 12), skyGlow = lightMat("skyGlow", [1, 0.8, 0.52], 0.55), ledRed = lightMat("ledRedHi", RED, 30), ledGreen = lightMat("ledGreen", GREEN, 9), neonM = lightMat("neonMag", MAG, 10), neonC = lightMat("neonCyan", CYAN, 10);
  const FLOOR = { hall: "r_floor", siteA: "r_pad", siteB: "r_gravel", red: "r_pave", blue: "r_pave" };
  B.floorAlbOf = (x, z) => matAlb(border(x, z) ? "r_gravel" : FLOOR[zoneOf(x, z)] || "r_floor");
  B.hollow = new Uint8Array(G * G);
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
    const c = ci(x, z), x0 = x * CS, z0 = z * CS;
    if (border(x, z)) { B.hollow[c] = 1; B.floorOn[c] = 1; B.floor("r_gravel", x0, z0, x0 + CS, z0 + CS, 0); continue; }
    if (!solid(x, z)) B.floor(FLOOR[zoneOf(x, z)] || "r_floor", x0, z0, x0 + CS, z0 + CS, 0);
  }
  const cen = (k) => { const c = K.cellsOf(k); return c.length ? [c.reduce((s, q) => s + q[0], 0) / c.length, c.reduce((s, q) => s + q[1], 0) / c.length] : null; };
  const pc = (p) => [p.cells.reduce((s, q) => s + q[0], 0) / p.cells.length, p.cells.reduce((s, q) => s + q[1], 0) / p.cells.length];
  const nearest = (pt, ok) => { let best = null, bd = 1e9; if (pt) pods.forEach(p => { if (!ok(p)) return; const c = pc(p), d = Math.hypot(c[0] - pt[0], c[1] - pt[1]); if (d < bd) { bd = d; best = p; } }); return best; };
  const tower = nearest(cen("b"), p => p.cells.length >= 4), stair = nearest(cen("r"), p => p !== tower && p.cells.length >= 2);
  let sign = null; pods.forEach(p => { if (p !== tower && p !== stair && (!sign || p.cells.length > sign.cells.length)) sign = p; });
  pods.forEach((p, i) => { const q = hsh(i, 7, 21); p.style = p === tower || p === stair ? "brick" : p === sign ? "mech" : q < 0.42 ? "mech" : q < 0.72 ? "brick" : "light"; p.cool = hsh(i, 3, 22) < 0.5; });

  // floodlight head on a wall face or a pole: lamp aimed out and down
  const flood = (x, y, z, nx, nz, L, mat, range) => {
    const rx = nz, rz = -nx; box("trimBlack", x - Math.abs(rx) * 0.24 - Math.abs(nx) * 0.1, y - 0.1, z - Math.abs(rz) * 0.24 - Math.abs(nz) * 0.1, x + Math.abs(rx) * 0.24 + Math.abs(nx) * 0.1, y + 0.12, z + Math.abs(rz) * 0.24 + Math.abs(nz) * 0.1, { f: ALL, occ: false });
    box(mat, x - Math.abs(rx) * 0.2 - Math.abs(nx) * 0.08 + nx * 0.03, y - 0.115, z - Math.abs(rz) * 0.2 - Math.abs(nz) * 0.08 + nz * 0.03, x + Math.abs(rx) * 0.2 + Math.abs(nx) * 0.08 + nx * 0.03, y - 0.1, z + Math.abs(rz) * 0.2 + Math.abs(nz) * 0.08 + nz * 0.03, { f: NY, occ: false });
    rectLight([x + nx * 0.05, y - 0.13, z + nz * 0.05], [rx * 0.2, 0, rz * 0.2], [nx * 0.12, 0.09, nz * 0.12], [nx * 0.6, -0.8, nz * 0.6], L, { range: range || 20, spot: 1 }); B.fixture(x, y, z, L, 0.4, "spot");
  };

  let doorN = 0;
  for (const f of faces) {
    const fr = frame(f), h = f.h, h1 = hsh(f.cx, f.cz, f.d), h2 = hsh(f.cx, f.cz, f.d + 4);
    if (f.pod < 0) { // the edge: parapet, coping, glass screen on posts, a marker light now and then
      B.wall(f, "r_parapet", 0, 0, CS, 1.1); f.kind = "edge"; f.alb = matAlb("r_parapet");
      B.fbox(f, "r_parapet", 0, 0, -0.3, CS, 1.1, -0.001, { f: PY, seg: 2 }); B.fbox(f, "trimSteel", -0.02, 1.1, -0.34, CS + 0.02, 1.15, 0.04, { f: ALL, occ: false, seg: 2 });
      const a = B.fpos(f, 0, 1.15, -0.15), u = B.fdir(f, CS, 0, 0); quad("glass", a[0], a[1], a[2], u[0], 0, u[2], 0, 1.2, 0, { seg: 4 }); quad("glass", a[0] + u[0], a[1], a[2] + u[2], -u[0], 0, -u[2], 0, 1.2, 0, { seg: 4 });
      B.fbox(f, "trimBlack", -0.03, 1.15, -0.18, 0.03, 2.38, -0.12, { f: ALL, occ: false, seg: 1.3 }); B.fbox(f, "trimBlack", 0, 2.35, -0.17, CS, 2.39, -0.13, { f: ALL, occ: false, seg: 2 });
      if ((f.cx + f.cz) % 3 === 0) { const amber = zoneOf(f.ox, f.oz) === "hall"; B.fbox(f, amber ? lampWarm : ledGreen, 1.8, 0.62, 0, 2.2, 0.7, 0.03, { f: ALL, occ: false }); rectLight(B.fpos(f, 2, 0.66, 0.05), [fr.rx * 0.2, 0, fr.rz * 0.2], [0, 0.04, 0], [fr.nx, 0, fr.nz], mul(amber ? WARM : GREEN, 22), { range: 6 }); }
      continue;
    }
    const p = pods[f.pod], st = p.style;
    if (st === "light") { // skylight: concrete curb, frosted glass lit from the floor below
      B.wall(f, "r_parapet", 0, 0, CS, 0.5); B.wall(f, skyGlow, 0, 0.5, CS, h - 0.25); B.wall(f, "trimBlack", 0, h - 0.25, CS, h); f.kind = "glow"; f.alb = [0.5, 0.45, 0.35];
      for (let k = 0; k <= 4; k++) B.fbox(f, "trimBlack", k - 0.035, 0.5, 0, k + 0.035, h - 0.25, 0.05, { occ: false, seg: 1.3 }); B.fbox(f, "trimBlack", 0, 0.46, 0, CS, 0.54, 0.06, { occ: false, seg: 2 }); B.fbox(f, "trimBlack", 0, (h + 0.25) / 2 - 0.03, 0, CS, (h + 0.25) / 2 + 0.03, 0.05, { occ: false, seg: 2 });
      rectLight(B.fpos(f, 2, (h + 0.25) / 2, 0.08), [fr.rx * 1.9, 0, fr.rz * 1.9], [0, (h - 0.75) / 2, 0], [fr.nx, 0, fr.nz], mul([1, 0.8, 0.52], 2.2), { range: 14 });
      continue;
    }
    if (st === "brick") {
      B.wall(f, "r_brick", 0, 0, CS, h); f.kind = "plain"; f.alb = matAlb("r_brick"); B.fbox(f, "r_parapet", -0.05, h - 0.2, 0, CS + 0.05, h, 0.08, { f: ALL & ~PY, occ: false, seg: 2 }); B.fbox(f, "r_parapet", 0, 0, 0, CS, 0.3, 0.04, { occ: false, seg: 2 });
      const isDoor = (p === stair && f.ru === 0) || h1 < 0.22;
      if (isDoor) { const n = ++doorN; f.kind = "door"; B.fbox(f, "f_blue", 1.5, 0.02, 0, 2.5, 2.1, 0.03, { occ: false }); for (const [u0, v0, u1, v1] of [[1.42, 0, 1.5, 2.18], [2.5, 0, 2.58, 2.18], [1.5, 2.1, 2.5, 2.18]]) B.fbox(f, "trimBlack", u0, v0, 0, u1, v1, 0.06, { occ: false });
        B.fbox(f, "chrome", 2.32, 1.02, 0.03, 2.44, 1.045, 0.075, { occ: false }); B.fdecal(f, "decal", 2.66, 1.46, 3.1, 1.66, 0.012, 380, { k: "plate", t: p === stair ? "STAIRS" : ["PLANT", "LIFT MOTOR", "RISER", "STORE"][n % 4], n: 90 + n });
        B.fbox(f, "trimBlack", 1.85, 2.36, 0, 2.15, 2.5, 0.14, { f: ALL, occ: false }); B.fbox(f, lampWarm, 1.88, 2.345, 0.02, 2.12, 2.36, 0.13, { f: NY, occ: false }); rectLight(B.fpos(f, 2, 2.33, 0.08), [fr.rx * 0.12, 0, fr.rz * 0.12], [fr.nx * 0.05, 0, fr.nz * 0.05], [0, -1, 0], mul(WARM, 190), { range: 8 }); }
      else if (h1 < 0.5) { B.fbox(f, "f_shutter", 1.2, 1.5, 0, 2.8, 2.3, 0.04, { occ: false }); for (const [u0, v0, u1, v1] of [[1.14, 1.44, 2.86, 1.5], [1.14, 2.3, 2.86, 2.36]]) B.fbox(f, "trimBlack", u0, v0, 0, u1, v1, 0.06, { occ: false }); }
      else if (h1 < 0.7) { K.riser(f, "trimSteel", 0.5 + h2 * 3, 0.08, 0, h + 0.5, 0.06); }
      else if (h1 < 0.86 && h > 2.2) { // a lit ad panel on the brick (its joke is picked when the map loads)
        B.fbox(f, "trimBlack", 0.32, 0.62, 0, 3.68, h - 0.38, 0.06, { occ: false, seg: 1.5 }); B.fdecal(f, "glow", 0.4, 0.7, 3.6, h - 0.46, 0.065, 60, { k: "bill", l: ["NETEAM", "MANAGED IT \u00b7 NYC"], col: Math.floor(h2 * 5) }); }
    } else { // plant: grey casing, louvres, service panels, a yellow band
      B.wall(f, "r_unit", 0, 0, CS, h); f.kind = "plain"; f.alb = matAlb("r_unit"); B.fbox(f, "trimBlack", 0, 0, 0, CS, 0.16, 0.05, { occ: false, seg: 2 }); B.fbox(f, "f_yellow", 0, h - 0.24, 0, CS, h - 0.14, 0.014, { occ: false, seg: 2 });
      if (h1 < 0.5) { B.fbox(f, "f_shutter", 0.5, 0.5, 0, 3.5, h - 0.7, 0.05, { occ: false, seg: 1.5 }); for (const [u0, v0, u1, v1] of [[0.42, 0.42, 0.5, h - 0.62], [3.5, 0.42, 3.58, h - 0.62], [0.5, 0.42, 3.5, 0.5], [0.5, h - 0.7, 3.5, h - 0.62]]) B.fbox(f, "trimBlack", u0, v0, 0, u1, v1, 0.07, { occ: false, seg: 2 }); }
      else if (h1 < 0.8) { for (let k = 0; k < 3; k++) { const u = 0.35 + k * 1.12; B.fbox(f, "darkMetal", u, 0.3, 0, u + 1.04, 2.2, 0.03, { occ: false, seg: 1.3 }); B.fbox(f, "chrome", u + 0.9, 1.1, 0.03, u + 0.93, 1.32, 0.06, { occ: false }); } B.fdecal(f, "decal", 1.72, 1.3, 2.28, 2.0, 0.035, 200, { k: "warn", t: "DANGER|ROTATING FAN" }); }
      else { K.pipe(f, "f_pipeBlue", 0, CS, 0.5, 0.12, 0.07); K.pipe(f, "f_pipeRed", 0, CS, 0.75, 0.12, 0.07); B.fdecal(f, "decal", 1.5, 1.5, 2.5, 1.72, 0.012, 240, { k: "label", t: "AHU-" + String(1 + Math.floor(h2 * 20)).padStart(2, "0"), col: 1 }); }
    }
    // a floodlight on about one face in three
    if (hsh(f.cx, f.cz, f.d + 30) < 0.34) { const q = B.fpos(f, 2, h + 0.35, 0.3), m = B.fpos(f, 2, 0, 0.02); box("trimBlack", m[0] - 0.03, h - 0.3, m[2] - 0.03, m[0] + 0.03, h + 0.4, m[2] + 0.03, { f: ALL, occ: false }); flood(q[0], q[1], q[2], fr.nx, fr.nz, mul(p.cool ? COOL : SODIUM, 380), p.cool ? lampCool : lampSod, 18); }
  }
  // ---- sodium floods on poles standing on the ledge, every third cell of the edge
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) { if (!border(x, z) || (x + z) % 3 !== 1) continue; const corner = (x === 0 || x === G - 1) && (z === 0 || z === G - 1); if (corner) continue;
    const nx = x === 0 ? 1 : x === G - 1 ? -1 : 0, nz = z === 0 ? 1 : z === G - 1 ? -1 : 0, px = x * CS + CS / 2 - nx * 0.6, pz = z * CS + CS / 2 - nz * 0.6;
    tube("trimBlack", px, 0, pz, px, 5.2, pz, 0.06, 8, { seg: 2 }); tube("trimBlack", px, 5.2, pz, px + nx * 1.6, 5.4, pz + nz * 1.6, 0.04, 6, {}); flood(px + nx * 1.7, 5.4, pz + nz * 1.7, nx, nz, mul(SODIUM, 620), lampSod, 24); }

  // ---- water tower on the block beside site B
  if (tower) { const c = pc(tower), cx = c[0] * CS + CS / 2, cz = c[1] * CS + CS / 2, y0 = cellH[ci(tower.cells[0][0], tower.cells[0][1])], yb = y0 + 3.4, R = 3.1;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { tube("trimBlack", cx + sx * 3.2, y0, cz + sz * 3.2, cx + sx * 2.1, yb, cz + sz * 2.1, 0.11, 6, { seg: 2 }); tube("trimBlack", cx + sx * 3.2, y0, cz + sz * 3.2, cx - sz * 2.1 * (sx * sz), yb, cz + sx * 2.1 * (sx * sz), 0.05, 5, { seg: 3 }); }
    box("trimBlack", cx - 2.6, yb - 0.2, cz - 2.6, cx + 2.6, yb, cz + 2.6, { f: ALL, occ: false, seg: 3 });
    cyl("r_tank", cx, yb, cz, R, 4.4, 20, { occ: false, cap: false, seg: 2 }); for (const k of [0.5, 2.2, 3.9]) cyl("trimBlack", cx, yb + k, cz, R + 0.03, 0.09, 20, { occ: false, cap: false }); cyl("darkMetal", cx, yb + 4.4, cz, R + 0.25, 1.7, 20, { r1: 0.15, occ: false });
    for (const [sx, sz] of DIRS) flood(cx + sx * 2.7, yb - 0.3, cz + sz * 2.7, sx, sz, mul(COOL, 520), lampCool, 22); }
  // ---- the company name in neon over the largest plant room, both sides
  if (sign) { const xs = sign.cells.map(q => q[0]), zs = sign.cells.map(q => q[1]), x0 = Math.min(...xs) * CS, x1 = (Math.max(...xs) + 1) * CS, z0 = Math.min(...zs) * CS, z1 = (Math.max(...zs) + 1) * CS, y0 = cellH[ci(sign.cells[0][0], sign.cells[0][1])], alongX = x1 - x0 >= z1 - z0;
    const L = Math.min(14, (alongX ? x1 - x0 : z1 - z0) - 1), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, yA = y0 + 0.7, yB = yA + L * 0.15;
    for (const s of [-1, 1]) { for (const t of [-0.46, 0, 0.46]) { const px = alongX ? mx + t * L : mx, pz = alongX ? mz : mz + t * L; box("trimBlack", px - 0.05, y0, pz - 0.05, px + 0.05, yB + 0.2, pz + 0.05, { f: ALL, occ: false, seg: 1.5 }); }
      const off = 0.12 * s; if (alongX) { B.decal("glowHi", [mx - s * L / 2, yA, mz + off], [s * L, 0, 0], [0, yB - yA, 0], 56, { k: "logo" }); box(s > 0 ? neonM : neonC, mx - L / 2, yA - 0.14, mz + off - 0.02, mx + L / 2, yA - 0.09, mz + off + 0.02, { f: ALL, occ: false, seg: 2 }); rectLight([mx, (yA + yB) / 2, mz + off * 2], [L / 2, 0, 0], [0, (yB - yA) / 2, 0], [0, 0, s], mul([1, 0.62, 0.35], 5), { range: 22 }); }
      else { B.decal("glowHi", [mx + off, yA, mz + s * L / 2], [0, 0, -s * L], [0, yB - yA, 0], 56, { k: "logo" }); box(s > 0 ? neonM : neonC, mx + off - 0.02, yA - 0.14, mz - L / 2, mx + off + 0.02, yA - 0.09, mz + L / 2, { f: ALL, occ: false, seg: 2 }); rectLight([mx + off * 2, (yA + yB) / 2, mz], [0, 0, L / 2], [0, (yB - yA) / 2, 0], [s, 0, 0], mul([1, 0.62, 0.35], 5), { range: 22 }); } } }
  // ---- antenna masts on the ledge behind the blue spawn, red lamps on top
  K.cellsOf("u").forEach(([x, z]) => DIRS.forEach(([dx, dz]) => { const bx = x + dx, bz = z + dz; if (!border(bx, bz) || (bx + bz) % 2) return; const px = bx * CS + CS / 2 + dx * 0.9, pz = bz * CS + CS / 2 + dz * 0.9, hh = 11 + hsh(bx, bz, 41) * 6;
    tube("trimSteel", px, 0, pz, px, hh, pz, 0.1, 8, { seg: 3 }); for (const k of [0.45, 0.65, 0.85]) { box("trimSteel", px - 0.9, hh * k, pz - 0.03, px + 0.9, hh * k + 0.05, pz + 0.03, { f: ALL, occ: false }); box("trimSteel", px - 0.03, hh * k, pz - 0.9, px + 0.03, hh * k + 0.05, pz + 0.9, { f: ALL, occ: false }); for (const [ax, az] of [[0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9]]) box("plasticWhite", px + ax - 0.09, hh * k - 0.6, pz + az - 0.09, px + ax + 0.09, hh * k + 0.7, pz + az + 0.09, { f: ALL, occ: false }); }
    box(ledRed, px - 0.07, hh, pz - 0.07, px + 0.07, hh + 0.16, pz + 0.07, { f: ALL, occ: false }); }));
  K.decks("v_deckTop", "r_unit", 3);   // AC housings and the raised plant deck
  // ---- helipad paint and edge lights, site rings, signs on the glass
  const hp = cen("a"); if (hp) { const hx = hp[0] * CS + CS / 2, hz = hp[1] * CS + CS / 2, R = Math.min(5.6, Math.sqrt(K.cellsOf("a").length) * CS * 0.42); B.decal("decal", [hx - R, 0.007, hz + R], [2 * R, 0, 0], [0, 0, -2 * R], 44, { k: "heli", t: "N 5t" });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, lx = hx + Math.cos(a) * (R + 0.35), lz = hz + Math.sin(a) * (R + 0.35); cyl("trimBlack", lx, 0, lz, 0.09, 0.05, 8, { occ: false }); cyl(ledGreen, lx, 0.05, lz, 0.055, 0.04, 8, { occ: false }); } }
  else K.siteMarks([0, 1]);
  const bm = cen("b"); if (bm) B.decal("decal", [bm[0] * CS + CS / 2 - 2.4, 0.006, bm[1] * CS + CS / 2 + 2.4], [4.8, 0, 0], [0, 0, -4.8], 100, { k: "site", t: "B", col: 1 });
  K.signs(M, [0, 1, 3, 2], 1.3, (q) => q.kind === "edge" && q.ru % 2 === 1);
  W.dress.push({ kind: "city", sides: [0, 1, 2, 3], floor: 26, em: 0.3 });
};
NXW.themes.roof.outdoor = true; NXW.themes.roof.H = 3;
NXW.themes.roof.blockH = (x, z, c) => { const p = c.podOf[c.ci(x, z)]; return p >= 0 ? 2.8 + Math.floor(c.hsh(p, 3, 1) * 3) * 0.5 : 3; };
