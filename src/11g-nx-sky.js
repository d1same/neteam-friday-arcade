// ======================= NX theme: Uplink, two tower roofs at dawn with open air between them =======================
// Two glass towers stand sixteen metres apart, two hundred metres over the city. Each roof has plant rooms, steel decks for
// cover and a parapet round the outside; the sides that face each other have no rail at all, only a painted edge and a row
// of lights. Boosters on the edge throw you across. The towers' curtain walls run down into the haze to the streets.
NXW.themes.sky = (B, M, env) => {
  const { W, A, G, H, CS, quad, box, cyl, tube, rectLight, lightMat, matAlb, hsh, PX, PY, NY, PZ, NZ, ALL, MATS } = B, NXb = B.NX;
  const { ch, solid, border, ci, faces, pods, cellH } = A, DIRS = NXW.DIRS;
  const K = NXW.kit(B), { WARM, COOL, CYAN, GREEN, RED, AMBER } = K.C, mul = K.mul, ORANGE = [1, 0.5, 0.2], size = G * CS, norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  W.sky = { name: "dawn", k: 1.0 }; W.sun = { dir: norm([0.3, 0.27, -0.91]), E: [8.5, 6.4, 4.4], ang: 0.035 };
  W.grade = { expo: 1.0, fog: [0.13, 0.12, 0.13], fogD: 0.0021, tint: [1.02, 1.0, 0.98] };
  // curtain wall of the two towers: reflective glass in a metal grid, a few windows lit inside
  if (!MATS.s_glass) MATS.s_glass = { t: "facade4", s: 30, e: [0.18, 0.16, 0.13], r: 3, m: 0.5 };
  if (!MATS.s_glass2) MATS.s_glass2 = { t: "facade6", s: 30, r: 3, m: 0.45 };
  const ledCyan = lightMat("ledCyan", CYAN, 9), ledOrange = lightMat("ledOrange", ORANGE, 9), ledGreen = lightMat("ledGreen", GREEN, 9), ledRed = lightMat("ledRedHi", RED, 30), ledAmber = lightMat("ledAmberS", AMBER, 14), lampWarm = lightMat("lampWarm2", WARM, 12);
  const DH = { "1": 1.2, "2": 2.6 }, hAt = (x, z) => DH[ch(x, z)] || 0, voidAt = (x, z) => ch(x, z) === "v";
  const DEEP = 200;   // metres down to the street
  // which tower a column belongs to: left = 0, right = 1; each tower's footprint in metres
  let gx0 = G, gx1 = -1; for (let x = 0; x < G; x++) if (voidAt(x, 1)) { gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); }
  const TW = [[0, 0, gx0 * CS, size], [(gx1 + 1) * CS, 0, size, size]];
  const edge = (x, z) => !voidAt(x, z) && DIRS.some(([dx, dz]) => voidAt(x + dx, z + dz));

  // ---- floors: roofing felt, concrete pavers along the open edge, gravel on the ledge outside the parapet; nothing over the gap
  B.floorAlbOf = (x, z) => matAlb(voidAt(x, z) ? "trimBlack" : border(x, z) ? "r_gravel" : hAt(x, z) ? "v_deckTop" : edge(x, z) ? "r_pave" : "r_floor");
  B.hollow = new Uint8Array(G * G);
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
    const c = ci(x, z), x0 = x * CS, z0 = z * CS;
    if (voidAt(x, z)) { B.floorOn[c] = 0; B.floorY[c] = -DEEP; continue; }
    if (border(x, z)) { B.hollow[c] = 1; B.floorOn[c] = 1; B.floor("r_gravel", x0, z0, x0 + CS, z0 + CS, 0); continue; }
    if (solid(x, z)) continue;
    const hh = hAt(x, z);
    if (!hh) { B.floor(edge(x, z) ? "r_pave" : "r_floor", x0, z0, x0 + CS, z0 + CS, 0); continue; }
    // steel decks (cover): cyan lip on the low ones, orange on the high ones, as in the Data Vault
    B.floorY[c] = hh; B.floor("v_deckTop", x0, z0, x0 + CS, z0 + CS, hh);
    const low = hh < 2, led = low ? ledCyan : ledOrange, LC = low ? CYAN : ORANGE; let fm = 0, y0 = hh;
    DIRS.forEach(([dx, dz]) => {
      const nh = solid(x + dx, z + dz) ? 99 : hAt(x + dx, z + dz); if (nh >= hh) return; fm |= dx > 0 ? PX : dx < 0 ? NXb : dz > 0 ? PZ : NZ; y0 = Math.min(y0, nh);
      const ex = x0 + CS / 2 + dx * CS / 2, ez = z0 + CS / 2 + dz * CS / 2, hx = dz ? CS / 2 : 0.012, hz = dx ? CS / 2 : 0.012, ox = dx * 0.012, oz = dz * 0.012;
      box(led, ex - hx + ox, hh - 0.13, ez - hz + oz, ex + hx + ox, hh - 0.07, ez + hz + oz, { f: ALL, occ: false, seg: 2 });
      box("trimBlack", ex - hx + ox, nh, ez - hz + oz, ex + hx + ox, nh + 0.12, ez + hz + oz, { f: ALL, occ: false, seg: 2 });
      rectLight([ex + dx * 0.04, hh - 0.1, ez + dz * 0.04], [dz ? 1.9 : 0, 0, dx ? 1.9 : 0], [0, 0.03, 0], [dx, 0, dz], mul(LC, 14), { range: 4 });
    });
    box("v_deck", x0, y0, z0, x0 + CS, hh - 0.02, z0 + CS, { f: fm, seg: 1.3 });
  }

  // ---- the open edge: a steel angle on the slab, a hazard stripe, an amber marker light every two metres and stencils
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
    if (voidAt(x, z) || solid(x, z)) continue;
    DIRS.forEach(([dx, dz]) => {
      if (!voidAt(x + dx, z + dz) || dz) return; const ex = x * CS + CS / 2 + dx * CS / 2, z0 = z * CS, z1 = z0 + CS, s = dx;
      box("trimSteel", ex - s * 0.08, -0.35, z0, ex, 0.03, z1, { f: ALL, occ: false, seg: 2 });
      B.decal("decal", [ex - s * 0.42, 0.006, s > 0 ? z1 : z0], [s * 0.34, 0, 0], [0, 0, s > 0 ? -CS : CS], 64, { k: "hazard", r: 1 });
      for (const k of [0.25, 0.75]) { const lz = z0 + CS * k; box(ledAmber, ex - s * 0.16, 0.0, lz - 0.06, ex - s * 0.1, 0.05, lz + 0.06, { f: ALL, occ: false }); }
      rectLight([ex - s * 0.13, 0.06, z0 + CS / 2], [0, 0, CS * 0.4], [s * 0.03, 0, 0], [0, 1, 0], mul(AMBER, 2.2), { range: 3 });
      if (!border(x, z) && z % 4 === 2 && ch(x, z) === ".") K.floorText(ex - s * 2.2 - 0.8, z0 + 0.7, 1.6, 2.6, "DANGER · NO RAIL", 2, true);
    });
  }

  // ---- the two towers: crown band at roof level, curtain wall down to the street, a hidden solid block for the light baker
  TW.forEach(([x0, z0, x1, z1], t) => {
    const top = -0.05, crown = -1.6, glass = t ? "s_glass2" : "s_glass";
    // outside faces: +x / -x / +z / -z (a face is skipped where it would sit inside the map's ledge on the other tower side)
    const sides = [[x1, z1, x1, z0, 1, 0], [x0, z0, x0, z1, -1, 0], [x0, z1, x1, z1, 0, 1], [x1, z0, x0, z0, 0, -1]];   // U x up points out
    for (const [ax, az, bx, bz, nx, nz] of sides) {
      const ux = bx - ax, uz = bz - az, o = 0.0;
      // crown: dark metal fascia, then a cornice lip
      quad("darkMetal", ax + nx * 0.06, crown, az + nz * 0.06, ux, 0, uz, 0, top - crown, 0, { seg: 6 });
      box("trimBlack", Math.min(ax, bx, ax + nx * 0.18), crown - 0.12, Math.min(az, bz, az + nz * 0.18), Math.max(ax, bx, ax + nx * 0.18), crown + 0.02, Math.max(az, bz, az + nz * 0.18), { f: ALL, occ: false, seg: 6 });
      quad(glass, ax + nx * o, -DEEP, az + nz * o, ux, 0, uz, 0, crown - 0.12 + DEEP, 0, { seg: 12 });
      // vertical fins every 4 m on the face toward the gap and the street ends
      const L = Math.hypot(ux, uz), n = Math.round(L / CS);
      for (let k = 0; k <= n; k++) { const px = ax + ux * k / n, pz = az + uz * k / n; box("trimSteel", px - (nz ? 0.05 : 0) + nx * 0.0, -DEEP, pz - (nx ? 0.05 : 0), px + (nz ? 0.05 : 0) + nx * 0.22, crown - 0.12, pz + (nx ? 0.05 : 0) + nz * 0.22, { f: ALL & ~NY & ~PY, occ: false, seg: 25 }); }
    }
    B.occ(x0, -DEEP, z0, x1, top, z1, [0.08, 0.09, 0.1]);
  });
  // the company name across each tower's face toward the other, just under the roof
  { const L = Math.min(30, size * 0.36), zc = size / 2, y0 = -9.5, y1 = y0 + L * 0.15;
    B.decal("glowHi", [gx0 * CS + 0.3, y0, zc + L / 2], [0, 0, -L], [0, y1 - y0, 0], 22, { k: "logo" });
    B.decal("glowHi", [(gx1 + 1) * CS - 0.3, y0, zc - L / 2], [0, 0, L], [0, y1 - y0, 0], 22, { k: "logo" });
    rectLight([gx0 * CS + 0.5, (y0 + y1) / 2, zc], [0, 0, L / 2], [0, (y1 - y0) / 2, 0], [1, 0, 0], mul([1, 0.62, 0.35], 4), { range: 22 });
    rectLight([(gx1 + 1) * CS - 0.5, (y0 + y1) / 2, zc], [0, 0, L / 2], [0, (y1 - y0) / 2, 0], [-1, 0, 0], mul([1, 0.62, 0.35], 4), { range: 22 }); }

  // ---- parapet round the outside of each roof (and where the ledge meets the gap): concrete, steel coping, glass screen
  for (const f of faces) {
    if (f.pod >= 0) continue; const fr = A.frame(f);
    B.wall(f, "r_parapet", 0, 0, CS, 1.1); f.kind = "edge"; f.alb = matAlb("r_parapet");
    if (voidAt(f.ox, f.oz)) { f.kind = "end"; continue; }
    B.fbox(f, "r_parapet", 0, 0, -0.3, CS, 1.1, -0.001, { f: PY, seg: 2 }); B.fbox(f, "trimSteel", -0.02, 1.1, -0.34, CS + 0.02, 1.15, 0.04, { f: ALL, occ: false, seg: 2 });
    const a = B.fpos(f, 0, 1.15, -0.15), u = B.fdir(f, CS, 0, 0); quad("glass", a[0], a[1], a[2], u[0], 0, u[2], 0, 1.2, 0, { seg: 4 }); quad("glass", a[0] + u[0], a[1], a[2] + u[2], -u[0], 0, -u[2], 0, 1.2, 0, { seg: 4 });
    B.fbox(f, "trimBlack", -0.03, 1.15, -0.18, 0.03, 2.38, -0.12, { f: ALL, occ: false, seg: 1.3 }); B.fbox(f, "trimBlack", 0, 2.35, -0.17, CS, 2.39, -0.13, { f: ALL, occ: false, seg: 2 });
    if ((f.cx + f.cz) % 3 === 0) { B.fbox(f, ledGreen, 1.8, 0.62, 0, 2.2, 0.7, 0.03, { f: ALL, occ: false }); rectLight(B.fpos(f, 2, 0.66, 0.05), [fr.rx * 0.2, 0, fr.rz * 0.2], [0, 0.04, 0], [fr.nx, 0, fr.nz], mul(GREEN, 14), { range: 5 }); }
  }
  // the end of each ledge over the gap: a low wall with a red light (the ledge itself is behind the parapet)
  for (const f of faces) { if (f.kind !== "end") continue; B.fbox(f, "trimSteel", -0.02, 1.1, 0, CS + 0.02, 1.15, 0.06, { f: ALL, occ: false, seg: 2 }); B.fbox(f, ledRed, 1.9, 1.15, 0, 2.1, 1.25, 0.06, { f: ALL, occ: false }); }

  // ---- plant rooms and stair bulkheads (the solid blocks on the roof)
  pods.forEach((p, i) => { p.style = hsh(i, 5, 31) < 0.5 ? "brick" : "mech"; });
  let doorN = 0;
  for (const f of faces) {
    if (f.pod < 0) continue; const p = pods[f.pod], h = f.h, fr = A.frame(f), h1 = hsh(f.cx, f.cz, f.d);
    if (p.style === "brick") {
      B.wall(f, "r_brick", 0, 0, CS, h); f.kind = "plain"; f.alb = matAlb("r_brick"); B.fbox(f, "r_parapet", -0.05, h - 0.2, 0, CS + 0.05, h, 0.08, { f: ALL & ~PY, occ: false, seg: 2 }); B.fbox(f, "r_parapet", 0, 0, 0, CS, 0.3, 0.04, { occ: false, seg: 2 });
      if (h1 < 0.3) { const n = ++doorN; B.fbox(f, "f_blue", 1.5, 0.02, 0, 2.5, 2.1, 0.03, { occ: false }); for (const [u0, v0, u1, v1] of [[1.42, 0, 1.5, 2.18], [2.5, 0, 2.58, 2.18], [1.5, 2.1, 2.5, 2.18]]) B.fbox(f, "trimBlack", u0, v0, 0, u1, v1, 0.06, { occ: false });
        B.fbox(f, "chrome", 2.32, 1.02, 0.03, 2.44, 1.045, 0.075, { occ: false }); B.fdecal(f, "decal", 2.66, 1.46, 3.1, 1.66, 0.012, 380, { k: "plate", t: ["STAIRS", "LIFT MOTOR", "RISER"][n % 3], n: 40 + n });
        B.fbox(f, "trimBlack", 1.85, 2.36, 0, 2.15, 2.5, 0.14, { f: ALL, occ: false }); B.fbox(f, lampWarm, 1.88, 2.345, 0.02, 2.12, 2.36, 0.13, { f: NY, occ: false }); rectLight(B.fpos(f, 2, 2.33, 0.08), [fr.rx * 0.12, 0, fr.rz * 0.12], [fr.nx * 0.05, 0, fr.nz * 0.05], [0, -1, 0], mul(WARM, 120), { range: 7 }); }
    } else {
      B.wall(f, "r_unit", 0, 0, CS, h); f.kind = "plain"; f.alb = matAlb("r_unit"); B.fbox(f, "trimBlack", 0, 0, 0, CS, 0.16, 0.05, { occ: false, seg: 2 }); B.fbox(f, "f_yellow", 0, h - 0.24, 0, CS, h - 0.14, 0.014, { occ: false, seg: 2 });
      if (h1 < 0.5) { B.fbox(f, "f_shutter", 0.5, 0.5, 0, 3.5, h - 0.7, 0.05, { occ: false, seg: 1.5 }); for (const [u0, v0, u1, v1] of [[0.42, 0.42, 0.5, h - 0.62], [3.5, 0.42, 3.58, h - 0.62], [0.5, 0.42, 3.5, 0.5], [0.5, h - 0.7, 3.5, h - 0.62]]) B.fbox(f, "trimBlack", u0, v0, 0, u1, v1, 0.07, { occ: false, seg: 2 }); }
      else if (h1 < 0.8) { for (let k = 0; k < 3; k++) { const u = 0.35 + k * 1.12; B.fbox(f, "darkMetal", u, 0.3, 0, u + 1.04, 2.2, 0.03, { occ: false, seg: 1.3 }); B.fbox(f, "chrome", u + 0.9, 1.1, 0.03, u + 0.93, 1.32, 0.06, { occ: false }); } B.fdecal(f, "decal", 1.72, 1.3, 2.28, 2.0, 0.035, 200, { k: "warn", t: "DANGER|ROTATING FAN" }); }
      else { K.pipe(f, "f_pipeBlue", 0, CS, 0.5, 0.12, 0.07); K.pipe(f, "f_pipeRed", 0, CS, 0.75, 0.12, 0.07); B.fdecal(f, "decal", 1.5, 1.5, 2.5, 1.72, 0.012, 240, { k: "label", t: "AHU-" + String(1 + Math.floor(h1 * 20)).padStart(2, "0"), col: 1 }); }
    }
  }
  // tops of the blocks (seen from the decks and from the top of a booster arc): concrete slab, a fan or an antenna mast
  pods.forEach((p, i) => {
    p.cells.forEach(([x, z]) => { const h = cellH[ci(x, z)], x0 = x * CS, z0 = z * CS; box("r_parapet", x0, h - 0.02, z0, x0 + CS, h, z0 + CS, { f: PY, occ: false, seg: 2 }); });
    const [x, z] = p.cells[0], h = cellH[ci(x, z)], cx = x * CS + CS / 2, cz = z * CS + CS / 2;
    if (p.style === "mech") { cyl("darkMetal", cx, h, cz, 1.2, 0.7, 18, { occ: false }); cyl("trimBlack", cx, h + 0.7, cz, 1.05, 0.04, 18, { occ: false }); }
    else { const mh = 7 + hsh(i, 9, 2) * 5; tube("trimSteel", cx, h, cz, cx, h + mh, cz, 0.08, 8, { seg: 3 }); for (const k of [0.5, 0.8]) box("trimSteel", cx - 0.7, h + mh * k, cz - 0.03, cx + 0.7, h + mh * k + 0.05, cz + 0.03, { f: ALL, occ: false });
      box(ledRed, cx - 0.07, h + mh, cz - 0.07, cx + 0.07, h + mh + 0.16, cz + 0.07, { f: ALL, occ: false }); }
  });

  // ---- boosters: a green ring and an arrow toward the other tower
  K.cellsOf("^").forEach(([x, z]) => { const x0 = x * CS, z0 = z * CS, s = voidAt(x + 1, z) ? 1 : -1;
    B.decal("decal", [x0 + 0.3, 0.007, z0 + CS - 0.3], [CS - 0.6, 0, 0], [0, 0, -(CS - 0.6)], 60, { k: "ring", col: 0, n: 8, chev: 1 });
    K.floorText(s > 0 ? x0 - 3.2 : x0 + CS + 0.6, z0 + 0.7, 2.6, 2.6, "BOOST", 3, false); });
  K.siteMarks([0, 1]);   // bomb site floor paint (Breach)
  // the street far below for the light baker
  W.dress.push({ kind: "city", sides: [0, 1, 2, 3], all: true, avoid: TW.map(([a, b, c, d]) => [a - 6, b - 6, c + 6, d + 6]), floor: 54, em: 0.12 });
};
NXW.themes.sky.outdoor = true; NXW.themes.sky.H = 3.2;
NXW.themes.sky.blockH = (x, z, c) => { const p = c.podOf[c.ci(x, z)]; return p >= 0 ? 3.0 + Math.floor(c.hsh(p, 3, 1) * 3) * 0.4 : 3.2; };
