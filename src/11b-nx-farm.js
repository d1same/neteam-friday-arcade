// ======================= NX theme: Server Farm, a data-centre hall =======================
// One tall hall under a steel roof. Every block of walls inside is a row of server cabinets with its containment on top,
// the big block in the middle is the power room. Sites are the cold aisle (cyan) and the hot aisle (amber); the spawns
// are the loading dock (roller doors under daylight panels) and the control room (video walls over a console).
NXW.themes.farm = (B, M, env) => {
  const { W, A, G, H, CS, quad, box, cyl, tube, rectLight, lightMat, matAlb, hsh, PX, PY, NY, PZ, NZ, ALL } = B, NXb = B.NX;
  const { ch, solid, border, ci, faces, runs, pods, frame, zoneOf } = A;
  const K = NXW.kit(B), { COOL, CYAN, GREEN, RED, BLUE, AMBER } = K.C, mul = K.mul, HC = NXW.themes.farm.HC, size = G * CS;
  W.sky = { name: "storm", k: 0.6 }; W.sun = null;
  W.grade = { expo: 1.0, fog: [0.035, 0.05, 0.065], fogD: 0.011, tint: [0.97, 1.0, 1.04] };
  const lampCool = lightMat("lampCool", COOL, 22), lampDay = lightMat("lampDay", [0.8, 0.9, 1], 9), ledCyan = lightMat("ledCyan", CYAN, 9), ledAmber = lightMat("ledAmber", AMBER, 8), ledGreen = lightMat("ledGreen", GREEN, 9), ledBlue = lightMat("ledBlue", BLUE, 8), ledRed = lightMat("ledRed", RED, 7);

  // ---- floor everywhere you can walk, roof deck over the whole hall (it is seen above the cabinet rows)
  const FLOOR = { hall: "f_floor", red: "f_dock", blue: "f_floor", siteA: "f_floor", siteB: "f_floor" };
  B.floorAlbOf = (x, z) => matAlb(FLOOR[zoneOf(x, z)] || "f_floor"); B.ceilAlbOf = () => matAlb("f_ceil");
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
    const c = ci(x, z), x0 = x * CS, z0 = z * CS; B.ceilY[c] = HC; if (border(x, z)) continue;
    B.ceilOn[c] = 1; B.ceil("f_ceil", x0, z0, x0 + CS, z0 + CS, HC); if (!solid(x, z)) B.floor(FLOOR[zoneOf(x, z)], x0, z0, x0 + CS, z0 + CS, 0);
  }

  // ---- cabinet rows: colour of their lights follows the nearest site
  const near = (cells, k, R) => cells.some(([x, z]) => { for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) if (ch(x + dx, z + dz) === k) return true; return false; });
  pods.forEach((p, i) => { p.style = p.cells.length >= 6 ? "power" : "racks"; p.col = near(p.cells, "b", 3) ? 2 : near(p.cells, "a", 3) ? 0 : hsh(p.cells[0][0], p.cells[0][1], 12) < 0.3 ? 1 : 0; p.name = "R" + String.fromCharCode(65 + i % 26); });
  function racks(f, p) {
    const col = p.col, led = col === 2 ? ledAmber : col === 1 ? ledGreen : ledCyan, LC = col === 2 ? AMBER : col === 1 ? GREEN : CYAN;
    B.wall(f, "f_pod", 0, 0, CS, H); f.kind = "racks"; f.alb = [0.05, 0.05, 0.06];
    B.fbox(f, "trimBlack", 0.14, 0, 0, 3.86, 0.1, 0.05, { occ: false, seg: 2 });
    B.fbox(f, "plasticBlack", 0.17, 0.1, 0, 3.83, 2.13, 0.06, { occ: false, seg: 2 });
    for (let k = 0; k < 6; k++) { const u = 0.2 + k * 0.605, hh = hsh(f.cx * 5 + k, f.cz * 3 + f.d, 7);
      B.fdecal(f, "glow", u + 0.012, 0.13, u + 0.593, 2.1, 0.066, 150, hh < 0.1 ? { k: "cooler" } : { k: "rack", sd: Math.floor(hh * 60) % 6, col }); }
    K.strip(f, 0.2, 3.8, 0.082, 0.066, led, mul(LC, 16), 4.5, 0.016);
    B.fbox(f, "trimSteel", 0.14, 2.13, 0, 3.86, 2.2, 0.08, { occ: false, seg: 2 });
    B.fdecal(f, "decal", 1.55, 2.26, 2.45, 2.46, 0.012, 260, { k: "label", t: p.name + "-" + String(1 + (f.cx * 3 + f.cz * 7 + f.d) % 48).padStart(2, "0") });
    for (let k = 0; k < 4; k++) B.fbox(f, "darkMetal", k + 0.03, 2.52, 0, k + 0.97, 3.17, 0.022, { occ: false, seg: 1.4 });
  }
  // the power room in the middle: blue steel, louvres, switchgear, chilled-water risers
  function power(f, h1) {
    B.wall(f, "f_blue", 0, 0, CS, H); f.kind = "plain"; f.alb = matAlb("f_blue");
    B.fbox(f, "trimBlack", 0, 0, 0, CS, 0.12, 0.03, { occ: false, seg: 2 }); B.fbox(f, "f_yellow", 0, 2.86, 0, CS, 2.96, 0.016, { occ: false, seg: 2 });
    if (h1 < 0.36) {
      B.fbox(f, "f_shutter", 0.55, 0.45, 0, 3.45, 2.45, 0.05, { occ: false, seg: 1.5 });
      for (const [u0, v0, u1, v1] of [[0.47, 0.37, 0.55, 2.53], [3.45, 0.37, 3.53, 2.53], [0.55, 0.37, 3.45, 0.45], [0.55, 2.45, 3.45, 2.53]]) B.fbox(f, "trimBlack", u0, v0, 0, u1, v1, 0.07, { occ: false, seg: 2 });
    } else if (h1 < 0.74) {
      for (let k = 0; k < 3; k++) { const u = 0.38 + k * 1.1;
        B.fbox(f, "f_grey", u, 0.12, 0, u + 1.04, 2.3, 0.28, { seg: 1.3 }); B.fbox(f, "chrome", u + 0.9, 1.05, 0.28, u + 0.93, 1.3, 0.31, { occ: false });
        B.fbox(f, k === 1 ? ledAmber : ledGreen, u + 0.12, 1.95, 0.28, u + 0.17, 2.0, 0.286, { f: ALL, occ: false });
        if (k === 1) B.fdecal(f, "decal", u + 0.3, 1.1, u + 0.74, 1.7, 0.288, 200, { k: "warn", t: "DANGER|480 V" }); else B.fdecal(f, "decal", u + 0.3, 1.5, u + 0.74, 1.66, 0.288, 300, { k: "label", t: ["UPS-A", "", "PDU-2"][k], col: 1 }); }
    } else {
      B.fdecal(f, "decal", 1.6, 1.25, 2.4, 2.3, 0.012, 200, { k: "warn", t: "POWER ROOM|KEEP OUT" });
      B.fbox(f, "plasticBlack", 2.75, 1.25, 0, 3.6, 1.8, 0.04, { occ: false }); B.fdecal(f, "glow", 2.78, 1.28, 3.57, 1.77, 0.045, 150, { k: "screen", v: 4 });
    }
    if (f.ru === 0) { K.riser(f, "f_pipeBlue", 0.16, 0.14, 0, HC - 0.1, 0.09); K.riser(f, "f_pipeRed", 0.42, 0.14, 0, HC - 0.1, 0.09); }
  }

  // ---- the hall's outer wall: concrete to 3.2 m, metal cladding above, a steel column on every bay line
  const zc = {}; faces.forEach(f => { if (f.pod < 0 && f.zone !== "hall" && f.ru % 2 === 1 && !zc[f.zone]) zc[f.zone] = f; });
  let dockN = 0, doorN = 0;
  function outer(f, h1, h2) {
    const zn = f.zone, fr = frame(f), sign = zc[zn] === f;
    B.wall(f, "f_wallLo", 0, 0, CS, 3.2); B.wall(f, "f_wallHi", 0, 3.2, CS, HC); f.kind = "plain"; f.alb = matAlb("f_wallLo");
    B.fbox(f, "trimBlack", -0.11, 0, 0, 0.11, HC, 0.16, { f: ALL & ~NY & ~PY, occ: false, seg: 1.3 }); if (f.ru === runs[f.run].faces.length - 1) B.fbox(f, "trimBlack", CS - 0.11, 0, 0, CS + 0.11, HC, 0.16, { f: ALL & ~NY & ~PY, occ: false, seg: 1.3 });
    B.fbox(f, "trimBlack", 0.11, 3.14, 0, CS - 0.11, 3.26, 0.07, { occ: false, seg: 2 });
    K.pipe(f, "f_pipeBlue", 0, CS, 5.9, 0.2, 0.07); K.pipe(f, "f_pipeRed", 0, CS, 5.9, 0.4, 0.07);
    if (sign) { B.fbox(f, "trimBlack", 0.55, 3.42, 0, 3.45, 4.22, 0.05, { occ: false, seg: 2 }); B.fdecal(f, "glowHi", 0.6, 3.47, 3.4, 4.17, 0.055, 180, { k: "sign", t: { siteA: "SITE A", siteB: "SITE B", blue: "BLUE TEAM", red: "RED TEAM" }[zn], sub: { siteA: M.sites[0], siteB: M.sites[1], blue: M.spawns[1], red: M.spawns[0] }[zn], col: { siteA: 0, siteB: 4, blue: 3, red: 2 }[zn] }); }
    if (zn === "red") {
      // loading dock: roller door in a yellow frame, rubber bumpers, daylight panels high up
      const n = ++dockN;
      B.fbox(f, "f_shutter", 0.45, 0, 0, 3.55, 3.0, 0.04, { occ: false, seg: 1.5 }); B.fbox(f, "trimBlack", 0.45, 0, 0.04, 3.55, 0.14, 0.07, { occ: false, seg: 2 });
      for (const u of [0.33, 3.55]) B.fbox(f, "f_yellow", u, 0, 0, u + 0.12, 3.12, 0.09, { occ: false, seg: 1.5 }); B.fbox(f, "f_yellow", 0.45, 3.0, 0, 3.55, 3.12, 0.09, { occ: false, seg: 2 });
      for (const u of [0.56, 3.19]) B.fbox(f, "rubber", u, 0.5, 0.04, u + 0.25, 1.0, 0.13, { f: ALL, occ: false });
      if (!sign) B.fdecal(f, "decal", 1.2, 3.42, 2.8, 3.92, 0.012, 110, { k: "text", t: "DOCK " + String(n).padStart(2, "0"), col: 0, clean: 1 });
      B.fbox(f, lampDay, 0.3, 4.4, 0, 3.7, 5.6, 0.03, { f: ALL, occ: false, seg: 2 }); for (const u of [0.28, 1.42, 2.56, 3.68]) B.fbox(f, "trimBlack", u, 4.36, 0, u + 0.04, 5.64, 0.05, { occ: false });
      rectLight(B.fpos(f, 2, 5.0, 0.06), [fr.rx * 1.7, 0, fr.rz * 1.7], [0, 0.6, 0], [fr.nx, 0, fr.nz], [7.2, 8.1, 9], { range: 24 });
    } else if (zn === "blue") {
      // control room: a video wall of six screens over a console
      B.fbox(f, "plasticBlack", 0.3, 1.05, 0, 3.7, 2.97, 0.06, { occ: false, seg: 2 });
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) B.fdecal(f, "glow", 0.34 + i * 1.11, 1.09 + j * 0.94, 1.44 + i * 1.11, 1.99 + j * 0.94, 0.066, 110, { k: "screen", v: Math.floor(hsh(f.cx * 3 + i, f.cz * 5 + j, f.d + 20) * 6) });
      rectLight(B.fpos(f, 2, 2.0, 0.1), [fr.rx * 1.6, 0, fr.rz * 1.6], [0, 0.9, 0], [fr.nx, 0, fr.nz], [0.55, 1.1, 2.0], { range: 9 });
      B.fbox(f, "f_grey", 0.4, 0, 0, 3.6, 0.74, 0.3, { seg: 2 }); B.fbox(f, "plasticBlack", 0.36, 0.74, 0, 3.64, 0.78, 0.34, { f: ALL, occ: false, seg: 2 });
    } else if (zn === "siteA" || zn === "siteB") {
      const a = zn === "siteA"; for (let k = 0; k < 4; k++) B.fbox(f, "darkMetal", 0.14 + k * 0.93, 0.12, 0, 0.14 + k * 0.93 + 0.9, 2.6, 0.02, { occ: false, seg: 1.3 });
      K.strip(f, 0.16, CS - 0.16, 2.68, 0.03, a ? ledCyan : ledAmber, mul(a ? CYAN : AMBER, 24), 8);
    } else {
      B.fbox(f, "trimBlack", 0.11, 0, 0, CS - 0.11, 0.1, 0.014, { occ: false, seg: 2 });
      if (h2 < 0.15) { // cooling unit
        B.fbox(f, "f_grey", 0.8, 0, 0, 3.2, 2.3, 0.3, { seg: 1.3 }); B.fbox(f, "f_shutter", 1.0, 0.25, 0.3, 3.0, 1.3, 0.31, { f: ALL, occ: false, seg: 1.3 });
        B.fbox(f, "plasticBlack", 1.6, 1.6, 0.3, 2.4, 2.05, 0.315, { f: ALL, occ: false }); B.fdecal(f, "glow", 1.63, 1.63, 2.37, 2.02, 0.32, 150, { k: "screen", v: 0 }); K.strip(f, 0.85, 3.15, 2.2, 0.31, ledBlue, mul(BLUE, 10), 4);
      } else if (h2 < 0.28) { // distribution boards with conduits up to the tray
        for (const u of [0.9, 2.3]) { B.fbox(f, "f_grey", u, 0.95, 0, u + 0.8, 2.0, 0.16, { occ: false }); B.fdecal(f, "decal", u + 0.2, 1.3, u + 0.6, 1.84, 0.165, 200, { k: "warn", t: "DANGER|LIVE" }); K.riser(f, "trimSteel", u + 0.25, 0.06, 2.0, 3.14, 0.025); K.riser(f, "trimSteel", u + 0.55, 0.06, 2.0, 3.14, 0.025); }
      } else if (h2 < 0.38) { // door
        const n = ++doorN; B.fbox(f, "f_blue", 1.53, 0.01, 0, 2.47, 2.1, 0.03, { occ: false }); for (const [u0, v0, u1, v1] of [[1.46, 0, 1.53, 2.17], [2.47, 0, 2.54, 2.17], [1.53, 2.1, 2.47, 2.17]]) B.fbox(f, "trimBlack", u0, v0, 0, u1, v1, 0.05, { occ: false });
        B.fbox(f, "chrome", 2.3, 1.02, 0.03, 2.42, 1.045, 0.075, { occ: false }); B.fdecal(f, "decal", 2.62, 1.48, 3.0, 1.66, 0.012, 420, { k: "plate", t: ["PLANT", "STORES", "BATTERY", "FIRE PUMP", "STAFF", "GENSET"][n % 6], n: 10 + n });
        B.fbox(f, ledGreen, 1.75, 2.24, 0, 2.25, 2.4, 0.03, { f: ALL, occ: false }); rectLight(B.fpos(f, 2, 2.32, 0.05), [fr.rx * 0.25, 0, fr.rz * 0.25], [0, 0.08, 0], [fr.nx, 0, fr.nz], mul(GREEN, 12), { range: 4 });
      } else if (h2 < 0.5) { // fire point
        B.fbox(f, "redPaint", 1.6, 0.9, 0, 2.4, 2.0, 0.02, { occ: false }); B.fdecal(f, "decal", 1.66, 1.72, 2.34, 1.94, 0.025, 200, { k: "text", t: "FIRE POINT", col: 0, clean: 1 });
        for (const u of [1.82, 2.18]) { const p = B.fpos(f, u, 1.0, 0.12); cyl("f_pipeRed", p[0], 1.0, p[2], 0.075, 0.5, 10, { occ: false }); cyl("trimBlack", p[0], 1.5, p[2], 0.03, 0.1, 6, { occ: false }); }
      } else if (h2 < 0.55) B.fdecal(f, "decal", 1.42, 1.05, 2.58, 2.53, 0.012, 200, { k: "poster", l: ["NETEAM", "SERVER", "FARM"], v: Math.floor(h2 * 60) % 6 });   // a joke poster, picked at load
      else if (h2 < 0.62) B.fdecal(f, "decal", 1.6, 1.3, 2.4, 2.36, 0.012, 200, { k: "warn", t: h2 < 0.585 ? "AUTHORISED|STAFF ONLY" : "HEARING|PROTECTION" });
      else if (h2 < 0.8) { // cable ladder up the wall
        for (const u of [1.75, 2.25]) B.fbox(f, "trimSteel", u - 0.02, 0.3, 0.03, u + 0.02, 5.7, 0.07, { f: ALL, occ: false, seg: 1.5 }); for (let v = 0.5; v < 5.7; v += 0.4) B.fbox(f, "trimSteel", 1.77, v, 0.04, 2.23, v + 0.03, 0.06, { f: ALL, occ: false });
        B.fbox(f, "f_yellow", 1.86, 0.3, 0.07, 2.0, 5.7, 0.13, { f: ALL, occ: false, seg: 1.5 }); B.fbox(f, "plasticBlack", 2.04, 0.3, 0.07, 2.14, 5.7, 0.11, { f: ALL, occ: false, seg: 1.5 });
      }
    }
  }
  for (const f of faces) { const h1 = hsh(f.cx, f.cz, f.d), h2 = hsh(f.cx, f.cz, f.d + 4); if (f.pod >= 0) { const p = pods[f.pod]; if (p.style === "power") power(f, h1); else racks(f, p); } else outer(f, h1, h2); }

  // ---- roof: a beam on every cell line with a purlin across, high-bay lamps, trays and a duct over the cabinet rows
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
    const x0 = x * CS, z0 = z * CS, cx = x0 + CS / 2, cz = z0 + CS / 2, zn = zoneOf(x, z);
    box("trimBlack", x0, HC - 0.6, cz - 0.05, x0 + CS, HC - 0.02, cz + 0.05, { f: PZ | NZ, occ: false, seg: 2 }); box("trimBlack", x0, HC - 0.64, cz - 0.13, x0 + CS, HC - 0.6, cz + 0.13, { f: PZ | NZ | NY, occ: false, seg: 2 });
    box("trimSteel", cx - 0.04, HC - 0.12, z0, cx + 0.04, HC - 0.02, z0 + CS, { f: PX | NXb | NY, occ: false, seg: 2 });
    if (solid(x, z)) continue;
    if (((x + z) & 1) === 0) { const L = mul(COOL, zn === "blue" ? 250 : zn === "siteA" || zn === "siteB" ? 320 : 400); K.highbay(cx, cz + 0.9, 5.0, HC - 0.02, L, lampCool); rectLight([cx, 5.3, cz + 0.9], [0.2, 0, 0], [0, 0, 0.2], [0, 1, 0], mul(L, 0.3), { range: 9 }); }
  }
  // cable trays: over every walkway of three cells or more, basket tray plus the yellow fibre duct, hung from the beams
  const tray = (x0, z0, x1, z1, y, alongX) => {
    if (alongX) { box("trimSteel", x0, y, z0 - 0.22, x1, y + 0.05, z0 + 0.22, { f: ALL & ~PX & ~NXb, occ: false, seg: 2 }); box("f_yellow", x0, y + 0.05, z0 - 0.2, x1, y + 0.15, z0 - 0.07, { f: ALL & ~PX & ~NXb & ~NY, occ: false, seg: 2 }); for (let k = x0 + 1; k < x1; k += 2) for (const s of [-0.22, 0.22]) box("trimBlack", k - 0.008, y, z0 + s - 0.008, k + 0.008, HC - 0.02, z0 + s + 0.008, { f: PX | NXb | PZ | NZ, occ: false, seg: 3 }); }
    else { box("trimSteel", x0 - 0.22, y, z0, x0 + 0.22, y + 0.05, z1, { f: ALL & ~PZ & ~NZ, occ: false, seg: 2 }); box("f_yellow", x0 - 0.2, y + 0.05, z0, x0 - 0.07, y + 0.15, z1, { f: ALL & ~PZ & ~NZ & ~NY, occ: false, seg: 2 }); for (let k = z0 + 1; k < z1; k += 2) for (const s of [-0.22, 0.22]) box("trimBlack", x0 + s - 0.008, y, k - 0.008, x0 + s + 0.008, HC - 0.02, k + 0.008, { f: PX | NXb | PZ | NZ, occ: false, seg: 3 }); }
  };
  for (let z = 1; z < G - 1; z++) { let x = 1; while (x < G - 1) { if (solid(x, z)) { x++; continue; } let e = x; while (e < G - 1 && !solid(e, z)) e++; if (e - x >= 3 && hsh(x, z, 91) < 0.7) for (let k = x; k < e; k++) tray(k * CS, z * CS + 0.8, k * CS + CS, 0, 3.62, true); x = e + 1; } }
  for (let x = 1; x < G - 1; x++) { let z = 1; while (z < G - 1) { if (solid(x, z)) { z++; continue; } let e = z; while (e < G - 1 && !solid(x, e)) e++; if (e - z >= 3 && hsh(x, z, 93) < 0.55) for (let k = z; k < e; k++) tray(x * CS + 3.2, k * CS, 0, k * CS + CS, 4.0, false); z = e + 1; } }
  // supply duct over each long row of cabinets with a drop into every cabinet block
  for (let z = 1; z < G - 1; z++) { let n = 0; for (let x = 1; x < G - 1; x++) if (solid(x, z)) n++; if (n < 6) continue; const zc2 = z * CS + CS / 2;
    for (let x = 1; x < G - 1; x++) { tube("trimSteel", x * CS, 4.75, zc2, x * CS + CS, 4.75, zc2, 0.4, 12, { seg: 2 }); box("trimBlack", x * CS + 1.98, 5.15, zc2 - 0.02, x * CS + 2.02, HC - 0.6, zc2 + 0.02, { f: PX | NXb | PZ | NZ, occ: false }); if (solid(x, z)) cyl("trimSteel", x * CS + CS / 2, 3.22, zc2, 0.24, 1.2, 10, { occ: false, cap: false }); } }

  // ---- floor paint: sites, a walking line along every cabinet row, the dock
  K.siteMarks([0, 2]);
  faces.forEach(f => { if (f.kind !== "racks") return; B.decal("decal", B.fpos(f, 0, 0.004, 0.86), B.fdir(f, CS, 0, 0), B.fdir(f, 0, 0, -0.07), 48, { k: "line", col: 1 }); });
  const rc = K.cellsOf("r"); if (rc.length) { const mx = rc.reduce((s, q) => s + q[0], 0) / rc.length * CS + CS / 2, mz = rc.reduce((s, q) => s + q[1], 0) / rc.length * CS + CS / 2; K.floorText(mx - 5, mz - 0.7, 10, 1.4, "LOADING DOCK", 1); }
  const uc = K.cellsOf("u"); if (uc.length) { const mx = uc.reduce((s, q) => s + q[0], 0) / uc.length * CS + CS / 2, mz = uc.reduce((s, q) => s + q[1], 0) / uc.length * CS + CS / 2; K.floorText(mx - 4.5, mz - 0.6, 9, 1.2, "CONTROL ROOM", 3); }
};
NXW.themes.farm.H = 3.2; NXW.themes.farm.HC = 6.4;
NXW.themes.farm.blockH = (x, z, c) => c.border(x, z) ? 6.4 : 3.2;
