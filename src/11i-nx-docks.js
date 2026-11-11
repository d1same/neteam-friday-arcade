// ======================= NX theme: Harbor Docks, a container terminal at sunrise =======================
// Outdoors: a concrete quay with stacks of shipping containers ('#' = two high, '2' = one you can stand on), a truck gate,
// floodlight masts, and along the east edge a low quay wall with the harbour behind it: water, a ship being loaded and a
// ship-to-shore crane. Indoors (M.indoor): a warehouse with pallet racking, a loading platform and high-bay lamps under
// a steel roof at M.ceilH. Built like the campus: roofed cells get a ceiling, doorways get a lintel.
Object.assign(NXW.MATS, {
  k_red: { t: "corrugated", c: [1.25, 0.36, 0.26], r: 0.8, m: 0.55 }, k_blue: { t: "corrugated", c: [0.34, 0.6, 1.15], r: 0.8, m: 0.55 },
  k_green: { t: "corrugated", c: [0.4, 0.82, 0.5], r: 0.8, m: 0.55 }, k_orange: { t: "corrugated", c: [1.45, 0.82, 0.3], r: 0.8, m: 0.55 },
  k_grey: { t: "corrugated", c: [0.95, 0.96, 0.98], r: 0.8, m: 0.55 }, k_teal: { t: "corrugated", c: [0.3, 0.85, 0.9], r: 0.8, m: 0.55 },
  k_water: { c: [0.025, 0.06, 0.07], r: 0.07, m: 0.25 }, k_hull: { t: "redpaint", c: [0.32, 0.36, 0.42] }, k_hullRed: { t: "redpaint", c: [0.75, 0.6, 0.6] },
  k_crane: { t: "redpaint", c: [1.5, 1.05, 0.35] },
});
NXW.themes.docks = (B, M, env) => {
  const { W, A, G, H, CS, box, cyl, tube, rectLight, lightMat, matAlb, hsh, PX, PY, NY, PZ, NZ, ALL } = B, NXb = B.NX;
  const { ch, solid, border, ci, faces, pods, frame, zoneOf } = A, DIRS = NXW.DIRS, size = G * CS;
  const K = NXW.kit(B), { COOL, AMBER, SODIUM, RED } = K.C, mul = K.mul, norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  W.sky = { name: "dawn", k: 1.0 }; W.sun = { dir: norm([0.78, 0.4, 0.3]), E: [9.0, 6.8, 4.6], ang: 0.035 };
  W.grade = { expo: 1.0, fog: [0.2, 0.17, 0.15], fogD: 0.0035, tint: [1.02, 1.0, 0.98] };
  const HC = M.ceilH || H + 1.3, lampCool = lightMat("lampCool", COOL, 22), lampSod = lightMat("lampSod", SODIUM, 30), ledRed = lightMat("ledRed", RED, 7);
  const RECTS = M.indoor || [], inRect = (x, z) => RECTS.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
  const indoor = (x, z) => !solid(x, z) && inRect(x, z), quay = (x) => x === G - 1;
  // the quay edge (east border) is a low wall you see the harbour over: the builder must not treat it as a tall block
  const hollow = B.hollow = new Uint8Array(G * G); for (let z = 1; z < G - 1; z++) hollow[ci(G - 1, z)] = 1;
  // ---- ground: warehouse slab inside, concrete quay slabs outside, asphalt at the truck gate
  const OUT = { hall: "r_pave", red: "rc_road", blue: "r_pave", siteA: "f_dock", siteB: "d_pave" };
  const floorMat = (x, z) => indoor(x, z) ? "f_dock" : OUT[zoneOf(x, z)] || "r_pave";
  B.floorAlbOf = (x, z) => matAlb(floorMat(x, z)); B.ceilAlbOf = () => matAlb("f_ceil");
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
    if (solid(x, z)) continue; const c = ci(x, z), x0 = x * CS, z0 = z * CS;
    B.floor(floorMat(x, z), x0, z0, x0 + CS, z0 + CS, 0);
    if (!indoor(x, z)) continue;
    B.ceilY[c] = HC; B.ceilOn[c] = 1; B.ceil("f_ceil", x0, z0, x0 + CS, z0 + CS, HC);
    box("f_wallHi", x0, HC, z0, x0 + CS, HC + 0.3, z0 + CS, { f: PY, occ: false });
    const cx = x0 + CS / 2, cz = z0 + CS / 2;
    box("trimBlack", x0, HC - 0.5, cz - 0.05, x0 + CS, HC - 0.02, cz + 0.05, { f: PZ | NZ | NY, occ: false, seg: 2 });   // roof truss line
    if (((x + z) & 1) === 0) K.highbay(cx, cz, HC - 1.3, HC - 0.02, mul(SODIUM, 330), lampSod, 17);
  }
  // ---- doorways between the warehouse and the yard: lintel up to the roof, a rolled-up shutter, a lamp outside
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
    if (!indoor(x, z)) continue;
    DIRS.forEach(([dx, dz]) => { const nx = x + dx, nz = z + dz; if (solid(nx, nz) || indoor(nx, nz)) return;
      const ex = x * CS + CS / 2 + dx * CS / 2, ez = z * CS + CS / 2 + dz * CS / 2, hx = dz ? CS / 2 : 0.2, hz = dx ? CS / 2 : 0.2;
      box("f_blue", ex - hx, 3.8, ez - hz, ex + hx, HC + 0.3, ez + hz, { f: ALL & ~NY, seg: 1.5 });
      box("f_yellow", ex - hx, 3.68, ez - hz, ex + hx, 3.8, ez + hz, { f: ALL, occ: false, seg: 2 });
      box("f_shutter", ex - (dz ? hx - 0.2 : 0.06), 3.2, ez - (dx ? hz - 0.2 : 0.06), ex + (dz ? hx - 0.2 : 0.06), 3.68, ez + (dx ? hz - 0.2 : 0.06), { f: ALL, occ: false, seg: 1.5 });
      for (const s of [-1, 1]) { const px = ex + (dz ? s * (hx - 0.1) : 0), pz = ez + (dx ? s * (hz - 0.1) : 0); box("f_yellow", px - 0.1, 0, pz - 0.1, px + 0.1, 3.68, pz + 0.1, { f: ALL & ~NY, occ: false }); }
      const ox = ex + dx * 0.25, oz = ez + dz * 0.25; box("trimBlack", ox - 0.2, 4.05, oz - 0.2, ox + 0.2, 4.15, oz + 0.2, { f: ALL, occ: false }); box(lampSod, ox - 0.16, 4.04, oz - 0.16, ox + 0.16, 4.05, oz + 0.16, { f: NY, occ: false });
      rectLight([ox, 4.03, oz], [0.16, 0, 0], [0, 0, 0.16], [dx * 0.3, -1, dz * 0.3], mul(SODIUM, 140), { range: 10 });
    });
  }
  // ---- containers: every block of the yard is a stack of two, each pod painted one colour; the warehouse is clad steel
  const COLS = ["k_red", "k_blue", "k_green", "k_orange", "k_grey", "k_teal"], LINES = ["NETEAM LOGISTICS", "NTM · SD-WAN", "MANAGED IT · NYC", "NETEAM", "FIREWALL FREIGHT", "ZERO-DAY CARGO"];
  const podCol = (p) => COLS[Math.floor(hsh(p.cells[0][0], p.cells[0][1], 17) * COLS.length) % COLS.length];
  const podIn = pods.map(p => p.cells.some(([x, z]) => DIRS.some(([dx, dz]) => indoor(x + dx, z + dz))));
  // a container side on a face: ribbed panel, top and bottom rails, the split between the two boxes, doors on the ends
  const container = (f, key, y0, y1, ends) => {
    B.wall(f, key, 0, y0, CS, y1); B.fbox(f, "trimBlack", -0.02, y0, 0, CS + 0.02, y0 + 0.12, 0.05, { occ: false, seg: 2 }); B.fbox(f, key, -0.02, y1 - 0.12, 0, CS + 0.02, y1, 0.05, { occ: false, seg: 2 });
    if (ends) { for (const u of [0.5, 1.3, 2.7, 3.5]) B.fbox(f, "trimSteel", u - 0.02, y0 + 0.2, 0.03, u + 0.02, y1 - 0.2, 0.07, { f: ALL, occ: false, seg: 1.5 });
      B.fbox(f, "trimBlack", CS / 2 - 0.02, y0 + 0.12, 0, CS / 2 + 0.02, y1 - 0.12, 0.04, { occ: false }); for (const u of [0.5, 1.3, 2.7, 3.5]) B.fbox(f, "trimBlack", u - 0.06, y0 + 1.1, 0.06, u + 0.06, y0 + 1.3, 0.09, { f: ALL, occ: false }); }
  };
  for (const f of faces) {
    const fr = frame(f), h1 = hsh(f.cx, f.cz, f.d), h2 = hsh(f.cx, f.cz, f.d + 4), inside = indoor(f.ox, f.oz), h = f.h;
    if (quay(f.cx)) continue;   // drawn with the harbour below
    if (inside) {   // warehouse wall: concrete to 3 m, cladding above, pallet racking along some bays
      B.wall(f, "f_wallLo", 0, 0, CS, 3.0); B.wall(f, "f_wallHi", 0, 3.0, CS, HC); f.kind = "plain"; f.alb = matAlb("f_wallLo");
      B.fbox(f, "trimBlack", 0.11, 2.94, 0, CS - 0.11, 3.06, 0.07, { occ: false, seg: 2 });
      if (h1 < 0.45) {   // racking: orange beams on blue uprights, pallets of boxes on two levels
        for (const u of [0.15, 3.85]) B.fbox(f, "f_pipeBlue", u - 0.05, 0, 0.05, u + 0.05, 3.4, 0.4, { f: ALL & ~NY, occ: false, seg: 1.5 });
        for (const v of [1.3, 2.6]) B.fbox(f, "f_yellow", 0.1, v - 0.1, 0.05, 3.9, v, 0.4, { f: ALL, occ: false, seg: 2 });
        for (const v of [0, 1.3, 2.6]) for (let k = 0; k < 3; k++) { if (hsh(f.cx * 3 + k, f.cz, f.d + v * 10) < 0.25) continue; const u = 0.3 + k * 1.15;
          B.fbox(f, "f_dock", u, v, 0.08, u + 1.0, v + 0.12, 0.42, { f: ALL & ~NY, occ: false }); B.fbox(f, hsh(f.cx, k, v) < 0.5 ? "plasticGrey" : "d_wood", u + 0.05, v + 0.12, 0.1, u + 0.95, v + 0.95, 0.4, { f: ALL & ~NY, occ: false, seg: 1.5 }); }
      } else if (h1 < 0.6) B.fdecal(f, "decal", 1.2, 1.1, 2.8, 2.5, 0.012, 160, { k: "warn", t: h2 < 0.5 ? "FORKLIFTS|OPERATING" : "HARD HATS|REQUIRED" });
      else if (h1 < 0.7) B.fdecal(f, "decal", 1.0, 1.0, 3.0, 2.4, 0.012, 90, { k: "poster", v: Math.floor(h2 * 8) });
      continue;
    }
    if (f.pod < 0) {   // security wall round the terminal: precast panels, a coping, razor wire, a floodlight every few panels
      B.wall(f, "r_parapet", 0, 0, CS, h); f.kind = "plain"; f.alb = matAlb("r_parapet");
      B.fbox(f, "trimBlack", -0.03, 0, 0, 0.03, h, 0.04, { occ: false, seg: 1.3 }); B.fbox(f, "trimSteel", -0.02, h - 0.12, 0, CS + 0.02, h, 0.22, { f: ALL, occ: false, seg: 2 });
      { const a = B.fpos(f, 0, h + 0.25, 0.1), b = B.fpos(f, CS, h + 0.25, 0.1); tube("trimSteel", a[0], a[1], a[2], b[0], b[1], b[2], 0.12, 6, { occ: false }); }
      if ((f.cx + f.cz) % 3 === 0) { const q = B.fpos(f, 2, h - 0.6, 0.25); box("trimBlack", q[0] - 0.2, q[1] - 0.1, q[2] - 0.2, q[0] + 0.2, q[1] + 0.1, q[2] + 0.2, { f: ALL, occ: false }); box(lampSod, q[0] - 0.16, q[1] - 0.11, q[2] - 0.16, q[0] + 0.16, q[1] - 0.1, q[2] + 0.16, { f: NY, occ: false });
        rectLight([q[0], q[1] - 0.12, q[2]], [0.16, 0, 0], [0, 0, 0.16], [fr.nx * 0.5, -0.85, fr.nz * 0.5], mul(SODIUM, 240), { range: 16, spot: 1 }); }
      else if (h1 < 0.2) B.fdecal(f, "decal", 0.8, 1.2, 3.2, 2.6, 0.012, 90, { k: "bill", l: ["NETEAM", "HARBOR TERMINAL"], col: Math.floor(h2 * 5) });
      continue;
    }
    if (podIn[f.pod]) {   // the warehouse from outside: blue cladding over a concrete plinth, a lit sign on the long side
      B.wall(f, "f_blue", 0, 0, CS, h); f.kind = "plain"; f.alb = matAlb("f_blue");
      B.fbox(f, "r_parapet", 0, 0, 0, CS, 0.6, 0.05, { occ: false, seg: 2 }); B.fbox(f, "trimSteel", -0.03, h - 0.18, 0, CS + 0.03, h, 0.1, { f: ALL & ~PY, occ: false, seg: 2 });
      if (h1 < 0.3) { B.fbox(f, "trimBlack", 0.3, 3.4, 0, 3.7, 4.7, 0.06, { occ: false, seg: 2 }); B.fdecal(f, "glowHi", 0.35, 3.45, 3.65, 4.65, 0.065, 90, { k: "bill", l: ["NETEAM", "WAREHOUSE 3"], col: 1 }); }
      else if (h1 < 0.6) { B.fbox(f, "f_shutter", 0.5, 0.6, 0, 3.5, 3.1, 0.04, { occ: false, seg: 1.5 }); B.fbox(f, "f_yellow", 0.4, 3.1, 0, 3.6, 3.2, 0.08, { occ: false, seg: 2 }); for (const u of [0.56, 3.19]) B.fbox(f, "rubber", u, 0.7, 0.04, u + 0.25, 1.2, 0.13, { f: ALL, occ: false }); }
      else { K.pipe(f, "f_pipeBlue", 0, CS, 1.2, 0.14, 0.08); }
      continue;
    }
    // a container stack: two boxes, the lower one's doors on the short ends of the pod
    const p = pods[f.pod], col = podCol(p), xs = p.cells.map(q => q[0]), zs = p.cells.map(q => q[1]), wx = Math.max(...xs) - Math.min(...xs), wz = Math.max(...zs) - Math.min(...zs);
    const endFace = (DIRS[f.d][0] !== 0) === (wx > wz), col2 = COLS[(COLS.indexOf(col) + 1 + Math.floor(h2 * 3)) % COLS.length];
    container(f, col, 0, 2.6, endFace); container(f, h > 2.7 ? col2 : col, 2.6, Math.min(h, 5.2), endFace); f.kind = "plain"; f.alb = matAlb(col);
    if (h > 5.21) B.wall(f, col, 0, 5.2, CS, h);
    if (!endFace && h1 < 0.4) B.fdecal(f, "decal", 0.4, 1.0, 3.6, 1.8, 0.012, 110, { k: "text", t: LINES[Math.floor(h2 * LINES.length) % LINES.length], col: 1, clean: 1 });
  }
  // container roofs (seen from the single containers you can climb) with corner castings
  for (const p of pods) { if (podIn[p.id]) continue; const col = podCol(p);
    for (const [x, z] of p.cells) { const top = A.cellH[ci(x, z)], x0 = x * CS, z0 = z * CS; box(col, x0, top - 0.02, z0, x0 + CS, top, z0 + CS, { f: PY, occ: false }); for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) box("trimBlack", x0 + a * (CS - 0.2), top, z0 + b * (CS - 0.2), x0 + a * (CS - 0.2) + 0.2, top + 0.06, z0 + b * (CS - 0.2) + 0.2, { f: ALL & ~NY, occ: false }); } }
  // ---- the quay edge and the harbour: a low wall with bollards, fenders and a rail; past it the apron, the water, a
  // container ship along the berth and a ship-to-shore crane over it
  const QX = (G - 1) * CS, WX = size + 10;
  box("r_parapet", QX, 0, CS, QX + 0.5, 1.1, size - CS, { f: ALL & ~NY, seg: 2 });
  box("trimSteel", QX - 0.02, 1.1, CS, QX + 0.52, 1.16, size - CS, { f: ALL, occ: false, seg: 2 });
  box("r_pave", QX + 0.5, -0.02, CS, WX, 0, size - CS, { f: PY, occ: false, seg: 4 });
  for (let z = CS + 3; z < size - CS; z += 6) { cyl("trimBlack", WX - 1.2, 0, z, 0.24, 0.6, 10, { occ: false }); cyl("trimBlack", WX - 1.2, 0.6, z, 0.32, 0.1, 10, { occ: false }); }
  box("r_parapet", WX - 0.4, -2.4, -40, WX, 0, size + 40, { f: PX | PY, occ: false, seg: 3 });
  for (let z = 0; z < size; z += 9) box("rubber", WX, -2.0, z - 0.6, WX + 0.35, -0.1, z + 0.6, { f: ALL, occ: false });
  box("k_water", WX, -1.9, -400, WX + 600, -1.9, size + 400, { f: PY, occ: false });
  box("k_water", -400, -1.9, size + 160, WX, -1.9, size + 400, { f: PY, occ: false });
  // the ship: dark hull, red boot topping, a white bridge house at the stern and containers stacked on deck
  const SX = WX + 6, SW = 30, S0 = -30, S1 = size + 10;
  box("k_hullRed", SX, -1.9, S0, SX + SW, 0.4, S1, { f: ALL & ~NY, occ: false, seg: 6 }); box("k_hull", SX, 0.4, S0, SX + SW, 9, S1, { f: ALL & ~NY, occ: false, seg: 6 });
  box("trimWhite", SX, 9, S0, SX + SW, 9.3, S1, { f: ALL, occ: false, seg: 6 });
  box("trimWhite", SX + 4, 9.3, S1 - 22, SX + SW - 4, 26, S1 - 12, { f: ALL & ~NY, occ: false, seg: 4 });
  for (let k = 0; k < 6; k++) box("glassDark", SX + 4.2 - 0.05, 22 - k * 2.6, S1 - 21.8, SX + SW - 4.2, 23 - k * 2.6, S1 - 21.85, { f: NZ, occ: false });
  for (let z = S0 + 4; z < S1 - 26; z += 6.4) for (let r = 0; r < 4; r++) { const tiers = 2 + Math.floor(hsh(z, r, 5) * 4); for (let t = 0; t < tiers; t++) { const x0 = SX + 2 + r * 6.6;
    box(COLS[Math.floor(hsh(z, r * 7 + t, 9) * COLS.length) % COLS.length], x0, 9.3 + t * 2.6, z, x0 + 6.1, 9.3 + t * 2.6 + 2.5, z + 6.0, { f: ALL & ~NY, occ: false, seg: 3 }); } }
  // ship-to-shore crane: two portal legs on the apron, a boom out over the ship, the cab and a hanging spreader
  const CZ = size * 0.42, CY = 34, LG = [[QX + 2, CZ - 7], [QX + 2, CZ + 7], [WX + 3, CZ - 7], [WX + 3, CZ + 7]];
  for (const [x, z] of LG) box("k_crane", x - 0.6, x > WX ? -1.9 : 0, z - 0.6, x + 0.6, CY, z + 0.6, { f: ALL & ~NY, occ: false, seg: 4 });
  for (const z of [CZ - 7, CZ + 7]) { box("k_crane", QX - 30, CY, z - 0.7, SX + SW + 18, CY + 1.6, z + 0.7, { f: ALL, occ: false, seg: 6 }); tube("k_crane", QX + 2, CY + 1.6, z, QX + 2, CY + 12, z, 0.5, 8, { occ: false }); tube("trimSteel", QX + 2, CY + 12, z, SX + SW + 16, CY + 1.6, z, 0.08, 6, { occ: false }); tube("trimSteel", QX + 2, CY + 12, z, QX - 28, CY + 1.6, z, 0.08, 6, { occ: false }); }
  for (const x of [QX + 2, WX + 3]) box("k_crane", x - 0.5, 12, CZ - 7, x + 0.5, 13.2, CZ + 7, { f: ALL, occ: false, seg: 4 });
  box("k_grey", SX + 10, CY - 3.2, CZ - 2, SX + 14, CY - 0.2, CZ + 2, { f: ALL, occ: false }); box("glassDark", SX + 9.98, CY - 2.4, CZ - 1.6, SX + 10, CY - 1, CZ + 1.6, { f: NXb, occ: false });
  for (const z of [CZ - 1.2, CZ + 1.2]) box("trimBlack", SX + 18 - 0.02, CY - 14, z - 0.02, SX + 18 + 0.02, CY, z + 0.02, { f: ALL, occ: false });
  box("f_yellow", SX + 15, CY - 14.6, CZ - 3, SX + 21, CY - 14, CZ + 3, { f: ALL, occ: false }); box("k_orange", SX + 15.2, CY - 17.2, CZ - 3, SX + 20.8, CY - 14.6, CZ + 3, { f: ALL, occ: false, seg: 3 });
  for (const [x, z] of [[QX - 30, CZ], [SX + SW + 18, CZ]]) box(ledRed, x - 0.3, CY + 1.6, z - 0.3, x + 0.3, CY + 2.1, z + 0.3, { f: ALL, occ: false });
  // ---- floodlight masts in the yard corners that are open: a pole and a head of four lamps aimed at the stacks
  for (const [mx, mz] of [[2, 15], [21, 1], [22, 18], [12, 4]]) { if (solid(mx, mz) || indoor(mx, mz)) continue; const px = mx * CS + 0.6, pz = mz * CS + 0.6, top = 11;
    cyl("trimSteel", px, 0, pz, 0.16, top, 8, { occ: false }); box("trimBlack", px - 0.9, top, pz - 0.3, px + 0.9, top + 0.5, pz + 0.3, { f: ALL, occ: false });
    for (const s of [-0.5, 0.5]) { box(lampSod, px + s - 0.3, top - 0.02, pz - 0.25, px + s + 0.3, top, pz + 0.25, { f: NY, occ: false }); }
    rectLight([px, top - 0.05, pz], [0.8, 0, 0], [0, 0, 0.3], [0.4, -1, 0.4], mul(SODIUM, 600), { range: 30, spot: 1 }); }
  // ---- floor paint: lane lines and a few markings in the yard, the warehouse name on its slab
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) { if (solid(x, z) || indoor(x, z) || ch(x, z) !== "." || hsh(x, z, 81) > 0.16) continue;
    K.floorText(x * CS + 0.6, z * CS + 1.2, 2.8, 1.6, hsh(x, z, 82) < 0.5 ? "LANE " + (1 + Math.floor(hsh(x, z, 83) * 9)) : "NO STOPPING", 1, false); }
  // decks: wooden crates ('1'), the warehouse loading platform, single containers you can stand on ('2') out in the yard
  const deckCol = (x, z) => COLS[Math.floor(hsh(x >> 1, z, 23) * COLS.length) % COLS.length];
  K.decks((x, z, hh) => hh < 2 ? "d_wood" : indoor(x, z) ? "f_dock" : deckCol(x, z), (x, z, hh) => hh < 2 ? "d_wood" : indoor(x, z) ? "f_grey" : deckCol(x, z), 3, "d_dwood");
  K.siteMarks([0, 1]); K.signs(M, [0, 1, 3, 2], 2.4, (q) => q.free && q.kind === "plain");
  W.dress.push({ kind: "city", sides: [0, 2, 3], floor: 24, em: 0.2 });
};
NXW.themes.docks.outdoor = true; NXW.themes.docks.mixed = true; NXW.themes.docks.H = 5.2;
// the warehouse walls rise to its roof; the security wall is a little lower than a stack of two containers
NXW.themes.docks.blockH = (x, z, c) => { if (c.border(x, z)) return 5.2; const p = c.podOf[c.ci(x, z)], M = c.M; if (p >= 0 && (M.indoor || []).some(([x0, z0, x1, z1]) => c.pods[p].cells.some(([a, b]) => a >= x0 - 1 && a <= x1 + 1 && b >= z0 - 1 && b <= z1 + 1))) return (M.ceilH || 6.5) + 0.3; return 5.2; };
