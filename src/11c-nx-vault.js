// ======================= NX theme: Data Vault, the jump arena =======================
// A strongroom eight metres high. Steel decks at two heights (cyan edge = low, orange edge = high), light slots between
// the wall panels in the colour of each quarter, round strongroom doors, drawer walls, and a gold ring over the router's home.
NXW.themes.vault = (B, M, env) => {
  const { W, A, G, H, CS, quad, box, cyl, tube, rectLight, lightMat, matAlb, hsh, PX, PY, NY, PZ, NZ, ALL } = B, NXb = B.NX;
  const { ch, solid, border, ci, faces, runs, pods, frame } = A, DIRS = NXW.DIRS;
  const K = NXW.kit(B), { COOL, CYAN, GREEN, AMBER, GOLD } = K.C, mul = K.mul, ORANGE = [1, 0.5, 0.2], size = G * CS, mid = size / 2;
  W.sky = { name: "storm", k: 0.4 }; W.sun = null;
  W.grade = { expo: 1.0, fog: [0.03, 0.04, 0.06], fogD: 0.007, tint: [0.98, 1.0, 1.03] };
  const panel = lightMat("panelCool", COOL, 7), ledCyan = lightMat("ledCyan", CYAN, 9), ledOrange = lightMat("ledOrange", ORANGE, 9), ledGold = lightMat("ledGold", GOLD, 12), ledGreen = lightMat("ledGreen", GREEN, 9);
  const DH = { "1": 1.2, "2": 2.6 }, hAt = (x, z) => DH[ch(x, z)] || 0;
  // quarters: north-west and south-east glow orange, the other two cyan (as the arena always did)
  const warm = (x, z) => (x < G / 2) === (z < G / 2), core = (x, z) => Math.abs(x - (G - 1) / 2) < 4.6 && Math.abs(z - (G - 1) / 2) < 4.6;

  B.floorAlbOf = (x, z) => matAlb(hAt(x, z) ? "v_deckTop" : "v_floor"); B.ceilAlbOf = () => matAlb("v_ceil");
  // ---- floor, decks, ceiling
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
    if (solid(x, z)) continue; const c = ci(x, z), x0 = x * CS, z0 = z * CS, hh = hAt(x, z);
    B.ceil("v_ceil", x0, z0, x0 + CS, z0 + CS, H);
    if (!hh) { B.floor("v_floor", x0, z0, x0 + CS, z0 + CS, 0); continue; }
    B.floorY[c] = hh; B.floor("v_deckTop", x0, z0, x0 + CS, z0 + CS, hh);
    const low = hh < 2, led = low ? ledCyan : ledOrange, LC = low ? CYAN : ORANGE; let fm = 0, y0 = hh;
    DIRS.forEach(([dx, dz], d) => {
      const nh = solid(x + dx, z + dz) ? 99 : hAt(x + dx, z + dz); if (nh >= hh) return; fm |= dx > 0 ? PX : dx < 0 ? NXb : dz > 0 ? PZ : NZ; y0 = Math.min(y0, nh);
      // lit lip under the edge, dark kick at the foot, a painted line on top
      const ex = x0 + CS / 2 + dx * CS / 2, ez = z0 + CS / 2 + dz * CS / 2, hx = dz ? CS / 2 : 0.012, hz = dx ? CS / 2 : 0.012, ox = dx * 0.012, oz = dz * 0.012;
      box(led, ex - hx + ox, hh - 0.13, ez - hz + oz, ex + hx + ox, hh - 0.07, ez + hz + oz, { f: ALL, occ: false, seg: 2 });
      box("trimBlack", ex - hx + ox, nh, ez - hz + oz, ex + hx + ox, nh + 0.12, ez + hz + oz, { f: ALL, occ: false, seg: 2 });
      box("trimBlack", ex - hx * 1.02 + ox * 2, hh - 0.06, ez - hz * 1.02 + oz * 2, ex + hx * 1.02 + ox * 2, hh + 0.004, ez + hz * 1.02 + oz * 2, { f: ALL, occ: false, seg: 2 });
      rectLight([ex + dx * 0.04, hh - 0.1, ez + dz * 0.04], [dz ? 1.9 : 0, 0, dx ? 1.9 : 0], [0, 0.03, 0], [dx, 0, dz], mul(LC, 26), { range: 5 });
      B.decal("decal", [dz ? x0 : ex - dx * 0.2 - 0.06, hh + 0.005, dx ? z0 + CS : ez - dz * 0.2 + 0.06], dz ? [CS, 0, 0] : [0.12, 0, 0], dz ? [0, 0, -0.12] : [0, 0, -CS], 40, { k: "line", col: low ? 3 : 2 });
    });
    box("v_deck", x0, y0, z0, x0 + CS, hh - 0.02, z0 + CS, { f: fm, seg: 1.3 });
  }

  // ---- walls. Every panel joint is a slot of light; the lower half carries the features
  let doorN = 0;
  for (const f of faces) {
    const fr = frame(f), h1 = hsh(f.cx, f.cz, f.d), isCore = core(f.ox, f.oz), wq = warm(f.ox, f.oz), led = isCore ? ledGold : wq ? ledOrange : ledCyan, LC = isCore ? GOLD : wq ? ORANGE : CYAN, base = hAt(f.ox, f.oz);
    B.wall(f, "v_wall", 0, 0, CS, 4); B.wall(f, "v_wallHi", 0, 4, CS, H); f.kind = "plain"; f.alb = matAlb("v_wall");
    B.fbox(f, "trimBlack", 0, base, 0, CS, base + 0.25, 0.04, { occ: false, seg: 2 });
    B.fbox(f, "v_gold", 0, 3.94, 0, CS, 4.06, 0.05, { occ: false, seg: 2 });
    B.fbox(f, "trimBlack", 0, H - 0.5, 0, CS, H, 0.18, { occ: false, seg: 2 });
    // light slot at the joint: full height on the border, to the gold band on the blocks inside
    const top = f.pod >= 0 && !isCore ? 3.9 : H - 0.6, v0 = base + 0.4;
    if (f.ru > 0 || f.pod < 0) {
      B.fbox(f, "trimBlack", -0.14, v0 - 0.1, 0, 0.14, top + 0.1, 0.05, { f: ALL & ~NY & ~PY, occ: false, seg: 1.3 }); B.fbox(f, led, -0.035, v0, 0.05, 0.035, top, 0.062, { f: ALL, occ: false, seg: 1.3 });
      rectLight(B.fpos(f, 0, (v0 + top) / 2, 0.08), [fr.rx * 0.035, 0, fr.rz * 0.035], [0, (top - v0) / 2, 0], [fr.nx, 0, fr.nz], mul(LC, 30), { range: 9 });
    }
    // cove line under the ceiling
    K.strip(f, 0.1, CS - 0.1, H - 0.56, 0.2, led, mul(LC, 14), 8, 0.03);
    if (base) continue;
    if (f.pod < 0 && h1 < 0.2 && f.ru > 0) { // strongroom door
      const n = ++doorN, c0 = B.fpos(f, 2, 1.85, 0), c1 = B.fpos(f, 2, 1.85, 0.22);
      tube("trimSteel", c0[0], 1.85, c0[2], c1[0], 1.85, c1[2], 1.62, 28, { seg: 1 }); B.fdecal(f, "decal", 0.4, 0.25, 3.6, 3.45, 0.2, 110, { k: "vdoor", t: "V-" + String(n).padStart(2, "0") });
      for (const v of [1.2, 2.5]) B.fbox(f, "trimBlack", 0.2, v - 0.12, 0, 0.5, v + 0.12, 0.26, { occ: false });
      B.fbox(f, ledGreen, 3.72, 1.5, 0, 3.82, 1.7, 0.03, { f: ALL, occ: false });
    } else if (h1 < 0.55) { // deposit drawers in a steel frame
      B.fbox(f, "trimSteel", 0.3, 0.35, 0, 3.7, 3.35, 0.05, { occ: false, seg: 2 }); B.fdecal(f, "decal", 0.36, 0.41, 3.64, 3.29, 0.055, 90, { k: "boxes", nx: 9, ny: 8, sd: Math.floor(h1 * 99) });
    } else if (h1 < 0.8) { // storage arrays behind black glass
      B.fbox(f, "plasticBlack", 0.3, 0.3, 0, 3.7, 2.42, 0.06, { occ: false, seg: 2 });
      for (let k = 0; k < 5; k++) { const u = 0.36 + k * 0.66; B.fdecal(f, "glow", u, 0.36, u + 0.62, 2.36, 0.066, 130, { k: "rack", sd: Math.floor(hsh(f.cx + k, f.cz, f.d + 9) * 6), col: isCore || wq ? 2 : 0 }); }
      B.fdecal(f, "decal", 1.5, 2.62, 2.5, 2.84, 0.012, 240, { k: "label", t: "ARRAY " + String(10 + Math.floor(h1 * 89)) });
    } else { // plain panel with a stencilled bay number
      for (let k = 0; k < 2; k++) B.fbox(f, "darkMetal", 0.3 + k * 1.75, 0.4, 0, 1.95 + k * 1.75, 3.5, 0.025, { occ: false, seg: 1.3 });
      B.fdecal(f, "decal", 1.0, 1.5, 3.0, 2.4, 0.03, 80, { k: "text", t: "BAY " + String(1 + Math.floor(h1 * 40)).padStart(2, "0"), col: isCore ? 1 : wq ? 2 : 3 });
    }
  }
  // the company name high on the two long walls
  for (const d of [0, 1, 2, 3]) { const f = faces.find(q => q.pod < 0 && q.d === d && Math.abs(q.ox - (G - 1) / 2) + Math.abs(q.oz - (G - 1) / 2) > G / 2 - 1 && Math.abs(q.ox - q.oz) < 9 && Math.abs(q.ox + q.oz - G + 1) > 3 && q.ru > 1); if (f) B.fdecal(f, "glowHi", -3, 5.1, 7, 6.3, 0.03, 60, { k: "logo" }); }

  // ---- ceiling: beams on the cell lines, a light panel over every second cell
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
    if (solid(x, z)) continue; const x0 = x * CS, z0 = z * CS, cx = x0 + CS / 2, cz = z0 + CS / 2;
    box("trimBlack", x0, H - 0.35, z0 - 0.1, x0 + CS, H - 0.01, z0 + 0.1, { f: PZ | NZ | NY, occ: false, seg: 2 }); box("trimBlack", x0 - 0.1, H - 0.35, z0, x0 + 0.1, H - 0.01, z0 + CS, { f: PX | NXb | NY, occ: false, seg: 2 });
    if ((x & 1) || (z & 1)) continue;
    box(panel, cx - 1.1, H - 0.06, cz - 1.1, cx + 1.1, H - 0.03, cz + 1.1, { f: NY | PX | NXb | PZ | NZ, occ: false }); rectLight([cx, H - 0.08, cz], [1.1, 0, 0], [0, 0, 1.1], [0, -1, 0], mul(COOL, 26), { range: 22 });
  }
  // ---- the router's home: gold rings hanging over it, a ring on the floor; green rings under the jump pads
  const tc = K.cellsOf("T"); if (tc.length) { const hx = tc.reduce((s, q) => s + q[0], 0) / tc.length * CS + CS / 2, hz = tc.reduce((s, q) => s + q[1], 0) / tc.length * CS + CS / 2;
    for (const [R, y] of [[2.6, 5.2], [1.7, 5.9]]) { const n = 28; for (let i = 0; i < n; i++) { const a = i / n * 6.28319, b = (i + 1) / n * 6.28319; tube(ledGold, hx + Math.cos(a) * R, y, hz + Math.sin(a) * R, hx + Math.cos(b) * R, y, hz + Math.sin(b) * R, 0.05, 6, {}); }
      for (let i = 0; i < 4; i++) { const a = i * 1.5708 + 0.7854, px = hx + Math.cos(a) * R, pz = hz + Math.sin(a) * R; box("trimBlack", px - 0.008, y, pz - 0.008, px + 0.008, H - 0.3, pz + 0.008, { f: PX | NXb | PZ | NZ, occ: false, seg: 3 }); } }
    rectLight([hx, 5.2, hz], [1.6, 0, 0], [0, 0, 1.6], [0, -1, 0], mul(GOLD, 22), { range: 16 });
    B.decal("decal", [hx - 3.4, 0.006, hz + 3.4], [6.8, 0, 0], [0, 0, -6.8], 60, { k: "ring", col: 1, n: 12, chev: 1 }); }
  K.cellsOf("^").forEach(([x, z]) => B.decal("decal", [x * CS + 0.3, 0.006, z * CS + CS - 0.3], [CS - 0.6, 0, 0], [0, 0, -(CS - 0.6)], 60, { k: "ring", col: 0, n: 8, chev: 1 }));
};
NXW.themes.vault.H = 8;
