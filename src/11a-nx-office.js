// ======================= NX theme: Neteam HQ, a tech office floor high above the city at golden hour =======================
// The outer ring facing the low sun becomes glass with a terrace beyond it; every block of walls inside is a "pod":
// a plaster core, an oak-slat room, old brick, cast concrete, or a glazed room you can look into (server racks, meeting
// rooms). Sites are the server room and the network closet, the lobby and the NOC are the two spawns.
NXW.themes.office = (B, M, env) => {
  const { W, A, G, H, CS, quad, box, cyl, tube, occ, rectLight, lightMat, matAlb, hsh, PX, PY, NY, PZ, NZ, ALL } = B, NXb = B.NX;
  const { ch, solid, inb, border, ci, faces, runs, pods, podOf, frame, faceAt, zoneOf, openN } = A;
  const DIRS = NXW.DIRS, norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  // ---- sun and sky: low golden sun from the south-west, coming in through the glass
  W.sky = { name: "dusk", k: 1.0 };
  W.sun = { dir: norm([-0.74, 0.21, 0.64]), E: [10.5, 6.6, 3.5], ang: 0.035 };
  W.grade = { expo: 1.0, fog: [0.055, 0.06, 0.075], fogD: 0.011, tint: [1.02, 1.0, 0.97] };
  const WARM = [1, 0.84, 0.64], NEUT = [1, 0.92, 0.8], COOL = [0.86, 0.94, 1], CYAN = [0.2, 0.78, 1], GREEN = [0.22, 1, 0.55], RED = [1, 0.22, 0.26], BLUE = [0.22, 0.5, 1], AMBER = [1, 0.6, 0.18];
  const lampWarm = lightMat("lampWarm", WARM, 22), lampCool = lightMat("lampCool", COOL, 22), lampNeut = lightMat("lampNeut", NEUT, 22);
  const ledCyan = lightMat("ledCyan", CYAN, 9), ledGreen = lightMat("ledGreen", GREEN, 9), ledRed = lightMat("ledRed", RED, 7), ledBlue = lightMat("ledBlue", BLUE, 8), ledAmber = lightMat("ledAmber", AMBER, 8);

  // ---- which border sides are glass: the ones the sun faces
  const hollow = B.hollow = new Uint8Array(G * G), terrace = new Uint8Array(G * G);
  const sunny = (d) => DIRS[d][0] * W.sun.dir[0] + DIRS[d][1] * W.sun.dir[2] < -0.3;   // wall normal points away from the sun = sun shines in
  const sides = [0, 1, 2, 3].filter(sunny);   // face directions that get windows (0: wall on the x = 0 edge, 3: wall on the z = max edge ...)
  for (let k = 1; k < G - 1; k++) for (const d of sides) { const [x, z] = d === 0 ? [0, k] : d === 1 ? [G - 1, k] : d === 2 ? [k, 0] : [k, G - 1]; hollow[ci(x, z)] = terrace[ci(x, z)] = 1; }
  if (sides.includes(0) && sides.includes(3)) hollow[ci(0, G - 1)] = terrace[ci(0, G - 1)] = 1;
  if (sides.includes(0) && sides.includes(2)) hollow[ci(0, 0)] = terrace[ci(0, 0)] = 1;
  if (sides.includes(1) && sides.includes(3)) hollow[ci(G - 1, G - 1)] = terrace[ci(G - 1, G - 1)] = 1;
  if (sides.includes(1) && sides.includes(2)) hollow[ci(G - 1, 0)] = terrace[ci(G - 1, 0)] = 1;

  // ---- pods: pick a look for every block of interior walls
  const nearZone = (cells) => { const n = {}; cells.forEach(([x, z]) => DIRS.forEach(([dx, dz]) => { const zn = zoneOf(x + dx, z + dz); if (zn) n[zn] = (n[zn] || 0) + 1; })); return n; };
  pods.forEach((p) => {
    const n = nearZone(p.cells), h = hsh(p.cells[0][0], p.cells[0][1], 11);
    p.style = (n.siteA || 0) + (n.siteB || 0) >= 2 ? "server" : (n.red || 0) >= 2 ? "lobby" : (n.blue || 0) >= 2 ? "noc" : ["plaster", "oak", "brick", "plaster", "conc", "glass", "plaster", "oak", "glass", "brick"][Math.floor(h * 10)];
  });
  const styleOf = (f) => {
    if (f.pod >= 0) return pods[f.pod].style;
    if (f.zone === "siteA" || f.zone === "siteB") return "server";
    if (f.zone === "red") return "lobby"; if (f.zone === "blue") return "noc";
    return f.d === 2 || f.d === 3 ? "brick" : "conc";   // outer walls away from the sun: brick to the north / south, concrete east / west
  };
  const WALLKEY = { plaster: "o_wall", oak: "o_wallDark", brick: "o_brick", conc: "o_conc", glass: "o_wall", server: "o_wallDark", lobby: "o_marble", noc: "o_wallDark" };

  // ---- floors and ceilings
  // storeys: a cell can be open to the storey above (atrium, stairwell: no ceiling) or below (no floor); upstairs is oak
  const noCeil = (x, z) => !!(B.noCeil && B.noCeil[ci(x, z)]) || !!(B.skylight && B.skylight[ci(x, z)]), noFloor = (x, z) => !!(B.noFloor && B.noFloor[ci(x, z)]), above = B.li === 0 && !!M.up;
  const FLOOR = { hall: B.li ? "o_oak" : "o_floor", red: "o_lobby", blue: "o_carpet", siteA: "o_raised", siteB: "o_raised" }, CEIL = { hall: "o_ceil", red: "o_oak", blue: "o_ceil", siteA: "o_ceil", siteB: "o_ceil" };
  B.floorAlbOf = (x, z) => terrace[ci(x, z)] ? matAlb("o_tile") : matAlb(FLOOR[zoneOf(x, z)] || "o_floor");
  B.ceilAlbOf = (x, z) => matAlb(CEIL[zoneOf(x, z)] || "o_ceil");
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
    const c = ci(x, z), x0 = x * CS, z0 = z * CS;
    if (terrace[c]) { B.floorOn[c] = 1; B.floor("o_tile", x0, z0, x0 + CS, z0 + CS, 0); if (above) { B.ceilOn[c] = 1; B.ceil("o_ceil", x0, z0, x0 + CS, z0 + CS, H); } else B.ceilY[c] = Infinity; continue; }
    if (solid(x, z)) continue;
    const zn = zoneOf(x, z); if (!noFloor(x, z)) B.floor(FLOOR[zn], x0, z0, x0 + CS, z0 + CS, 0); if (!noCeil(x, z)) B.ceil(CEIL[zn], x0, z0, x0 + CS, z0 + CS, H);
  }
  // terrace edge: glass balustrade with a steel rail, and the city beyond (drawn by the renderer, not baked)
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
    if (!terrace[ci(x, z)]) continue; const x0 = x * CS, z0 = z * CS;
    for (let d = 0; d < 4; d++) { const nx = x + DIRS[d][0], nz = z + DIRS[d][1]; if (inb(nx, nz)) continue;
      const along = DIRS[d][0] !== 0, e = along ? (DIRS[d][0] > 0 ? x0 + CS - 0.06 : x0 + 0.06) : (DIRS[d][1] > 0 ? z0 + CS - 0.06 : z0 + 0.06);
      if (along) { quad("glass", e, 0.05, z0, 0, 0, CS, 0, 1.05, 0, { seg: 4 }); box("trimSteel", e - 0.03, 1.1, z0, e + 0.03, 1.14, z0 + CS, { occ: false, seg: 4 }); box("trimBlack", e - 0.05, 0, z0, e + 0.05, 0.06, z0 + CS, { occ: false, seg: 4 }); }
      else { quad("glass", x0, 0.05, e, CS, 0, 0, 0, 1.05, 0, { seg: 4 }); box("trimSteel", x0, 1.1, e - 0.03, x0 + CS, 1.14, e + 0.03, { occ: false, seg: 4 }); box("trimBlack", x0, 0, e - 0.05, x0 + CS, 0.06, e + 0.05, { occ: false, seg: 4 }); }
    }
  }
  if (!B.li) W.dress.push({ kind: "city", sides: sides.slice(), floor: 38 });

  // ---- wall faces
  const usedNiche = new Uint8Array(G * G * 4);
  // a glazed room takes 1.7 m of the cell behind the wall, so never on two faces that meet at a corner
  const canNiche = (f) => { const c = ci(f.cx, f.cz); if (terrace[c]) return false; const perp = f.d < 2 ? [2, 3] : [0, 1]; return !perp.some(d => usedNiche[c * 4 + d]); };
  const baseboard = (f, u0, u1) => B.fbox(f, "trimBlack", u0, 0, 0, u1, 0.09, 0.012, { occ: false, seg: 2 });
  const POSTERS = [["NETEAM", "SOLUTIONS", "SINCE 2001"], ["THINK", "BEFORE", "YOU CLICK"], ["PATCH", "TUESDAY", "IS SACRED"], ["MIKE &", "PAVLOS", "FOUNDERS"], ["MFA", "OR IT", "DIDN'T HAPPEN"], ["BACKUP", "3 · 2 · 1", "ALWAYS"], ["IT'S", "ALWAYS", "DNS"], ["HAVE YOU", "TRIED", "REBOOTING?"], ["NO TICKET", "NO", "PROBLEM"], ["UPTIME", "99.999", "PERCENT"]];
  const ROOMS = ["IT SUPPORT", "STORAGE", "PRINT ROOM", "RISER", "COMMS", "STAFF ONLY", "ARCHIVE", "CLEANER", "ELECTRICAL", "WELLNESS"];
  let posterN = 0, doorN = 0;

  function windowFace(f) {
    // floor-to-ceiling glazing: low kerb, head bulkhead, one mullion per bay; the sky lights the room through it
    B.fbox(f, "trimBlack", 0, 0, -0.1, CS, 0.1, 0.07, { f: ALL & ~NY, occ: false, seg: 2 });
    B.fbox(f, "trimBlack", 0, 2.92, -0.1, CS, H, 0.07, { f: ALL, occ: true, seg: 2 });
    for (const u of [0, 2]) B.fbox(f, "trimBlack", u - (u ? 0.03 : 0.045), 0.1, -0.08, u + (u ? 0.03 : 0.045), 2.92, 0.06, { f: ALL & ~NY & ~PY, occ: false });
    B.fquad(f, "glass", 0, 0.1, CS, 2.92, -0.02, { seg: 4 });
    const c = B.fpos(f, 2, 1.51, -0.02), fr = frame(f);
    rectLight(c, [fr.rx * 2, 0, fr.rz * 2], [0, 1.41, 0], [fr.nx, 0, fr.nz], null, { portal: true });
    f.kind = "window"; f.alb = [0.3, 0.35, 0.4];
  }
  // glazed room behind the wall line. Returns the local depth so the cell's baker solids can be rebuilt around it.
  const ND = 1.72, NU0 = 0.18, NU1 = CS - 0.18, NV = 2.5;
  function niche(f, key, variant) {
    const c = ci(f.cx, f.cz); usedNiche[c * 4 + f.d] = 1; hollow[c] = 1; f.kind = "niche"; f.alb = matAlb(key);
    B.wall(f, key, 0, 0, NU0, H); B.wall(f, key, NU1, 0, CS, H); B.wall(f, key, NU0, NV, NU1, H);
    baseboard(f, 0, NU0); baseboard(f, NU1, CS);
    const q = (k, p, U, V, o) => quad(k, ...B.fpos(f, ...p), ...B.fdir(f, ...U), ...B.fdir(f, ...V), o);
    const wallK = variant === "racks" ? "o_wallDark" : variant === "meeting" ? "o_wall" : "o_wall2", floorK = variant === "racks" ? "o_raised" : "o_carpet";
    q(floorK, [NU0, 0, 0], [NU1 - NU0, 0, 0], [0, 0, -ND]); q(wallK, [NU0, 0, -ND], [NU1 - NU0, 0, 0], [0, NV, 0]);
    q(wallK, [NU0, 0, 0], [0, 0, -ND], [0, NV, 0]); q(wallK, [NU1, 0, -ND], [0, 0, ND], [0, NV, 0]); q("o_ceil", [NU0, NV, -ND], [NU1 - NU0, 0, 0], [0, 0, ND]);
    // black frame, glass, mid mullion
    B.fbox(f, "trimBlack", NU0 - 0.03, 0, -0.07, NU0 + 0.03, NV + 0.03, 0.025, { f: ALL & ~NY, occ: false }); B.fbox(f, "trimBlack", NU1 - 0.03, 0, -0.07, NU1 + 0.03, NV + 0.03, 0.025, { f: ALL & ~NY, occ: false });
    B.fbox(f, "trimBlack", NU0, NV - 0.03, -0.07, NU1, NV + 0.03, 0.025, { f: ALL, occ: false, seg: 2 }); B.fbox(f, "trimBlack", NU0, 0, -0.07, NU1, 0.05, 0.025, { f: ALL & ~NY, occ: false, seg: 2 });
    B.fbox(f, "trimBlack", 1.97, 0.05, -0.06, 2.03, NV - 0.03, 0.015, { f: ALL & ~NY & ~PY, occ: false });
    B.fquad(f, "glass", NU0, 0.05, NU1, NV - 0.03, -0.025, { seg: 4 });
    const lit = (u, v, w, hu, hw, L) => { const fr = frame(f); rectLight(B.fpos(f, u, v, w), [fr.rx * hu, 0, fr.rz * hu], [fr.nx * hw, 0, fr.nz * hw], [0, -1, 0], L, { range: 9 }); };
    if (variant === "racks") {
      const led = f.zone === "siteB" ? ledGreen : ledCyan, col = f.zone === "siteB" ? GREEN : CYAN;
      for (let k = 0; k < 5; k++) { const u = 0.42 + k * 0.66;
        B.fbox(f, "plasticBlack", u, 0.02, -ND + 0.12, u + 0.6, 2.12, -0.62, { a: [0.03, 0.03, 0.035] });
        B.fdecal(f, "glow", u + 0.03, 0.1, u + 0.57, 2.06, -0.612, 150, { k: "rack", sd: Math.floor(hsh(f.cx * 7 + k, f.cz * 5 + f.d, 3) * 6), col: f.zone === "siteB" ? 1 : 0 }); }
      B.fbox(f, led, NU0 + 0.05, NV - 0.035, -0.5, NU1 - 0.05, NV - 0.015, -0.46, { f: ALL, occ: false, seg: 2 });
      lit(2, NV - 0.04, -0.48, 1.7, 0.03, col.map(v => v * 30)); lit(2, NV - 0.02, -1.1, 1.2, 0.05, COOL.map(v => v * 9));
      B.fbox(f, "trimSteel", NU0 + 0.1, 2.2, -ND + 0.15, NU1 - 0.1, 2.26, -ND + 0.55, { occ: false, seg: 2 });   // cable tray over the racks
    } else if (variant === "meeting") {
      B.fbox(f, "o_oak", 0.9, 0.7, -1.25, 3.1, 0.74, -0.45, { f: ALL }); B.fbox(f, "trimBlack", 1.1, 0, -0.9, 1.16, 0.7, -0.8, { occ: false }); B.fbox(f, "trimBlack", 2.84, 0, -0.9, 2.9, 0.7, -0.8, { occ: false });
      for (const [u, w, back] of [[1.25, -0.2, 1], [2.15, -0.2, 1], [1.25, -1.55, -1], [2.15, -1.55, -1]]) { B.fbox(f, "o_feltDark", u, 0.42, w - 0.22, u + 0.46, 0.48, w + 0.22, { f: ALL, occ: false }); B.fbox(f, "o_feltDark", u, 0.48, w + back * 0.18, u + 0.46, 0.95, w + back * 0.23, { f: ALL, occ: false }); B.fbox(f, "trimBlack", u + 0.2, 0, w - 0.03, u + 0.26, 0.42, w + 0.03, { occ: false }); }
      B.fbox(f, "plasticBlack", 1.3, 1.15, -ND + 0.01, 2.7, 1.98, -ND + 0.05, { f: ALL, occ: false });
      B.fdecal(f, "glow", 1.33, 1.18, 2.67, 1.95, -ND + 0.055, 150, { k: "screen", v: Math.floor(hsh(f.cx, f.cz, 21 + f.d) * 6) });
      B.fbox(f, lampWarm, 1.3, 2.05, -0.9, 2.7, 2.08, -0.8, { f: ALL, occ: false }); B.fbox(f, "trimBlack", 1.28, 2.08, -0.92, 2.72, 2.12, -0.78, { f: ALL, occ: false });
      lit(2, 2.04, -0.85, 0.7, 0.05, WARM.map(v => v * 34));
      B.fquad(f, "glassFrost", NU0, 0.95, NU1, 1.55, -0.022, { seg: 4 });
    } else {
      // small office / store: desk with two screens, shelves with boxes
      B.fbox(f, "o_oak", 0.5, 0.72, -ND + 0.05, 2.5, 0.76, -ND + 0.75, { f: ALL }); B.fbox(f, "trimBlack", 0.55, 0, -ND + 0.1, 0.6, 0.72, -ND + 0.7, { occ: false }); B.fbox(f, "trimBlack", 2.4, 0, -ND + 0.1, 2.45, 0.72, -ND + 0.7, { occ: false });
      for (const u of [0.85, 1.55]) { B.fbox(f, "plasticBlack", u, 0.95, -ND + 0.2, u + 0.6, 1.32, -ND + 0.23, { f: ALL, occ: false }); B.fbox(f, "plasticBlack", u + 0.27, 0.76, -ND + 0.18, u + 0.33, 0.95, -ND + 0.22, { occ: false }); B.fdecal(f, "glow", u + 0.02, 0.97, u + 0.58, 1.3, -ND + 0.235, 160, { k: "screen", v: Math.floor(hsh(f.cx + u * 10, f.cz, 31 + f.d) * 6) }); }
      B.fbox(f, "o_feltDark", 1.3, 0.44, -0.75, 1.78, 0.5, -0.3, { f: ALL, occ: false }); B.fbox(f, "o_feltDark", 1.3, 0.5, -0.33, 1.78, 1.0, -0.28, { f: ALL, occ: false }); B.fbox(f, "trimBlack", 1.51, 0, -0.55, 1.57, 0.44, -0.49, { occ: false });
      for (let s = 0; s < 4; s++) { const v = 0.3 + s * 0.52; B.fbox(f, "trimSteel", 2.75, v, -ND + 0.05, 3.7, v + 0.03, -ND + 0.5, { f: ALL, occ: false }); for (let k = 0; k < 2; k++) { const hh = hsh(f.cx * 3 + s, f.cz * 7 + k, f.d + 40), bw = 0.28 + hh * 0.14; B.fbox(f, hh > 0.55 ? "plasticGrey" : "o_oak", 2.8 + k * 0.45, v + 0.03, -ND + 0.08, 2.8 + k * 0.45 + bw, v + 0.2 + hh * 0.2, -ND + 0.44, { f: ALL, occ: false }); } }
      for (const u of [2.75, 3.68]) B.fbox(f, "trimSteel", u, 0, -ND + 0.05, u + 0.03, 2.2, -ND + 0.5, { occ: false });
      B.fbox(f, lampNeut, 0.9, NV - 0.03, -1.0, 2.2, NV - 0.01, -0.9, { f: ALL, occ: false }); lit(1.55, NV - 0.04, -0.95, 0.65, 0.05, NEUT.map(v => v * 30));
    }
  }
  function door(f, uc, key) {
    const label = ROOMS[doorN++ % ROOMS.length], leaf = hsh(f.cx, f.cz, 50 + f.d) > 0.5 ? "o_oak" : "o_wallDark";
    B.fbox(f, leaf, uc - 0.47, 0.01, 0, uc + 0.47, 2.1, 0.03, { rot: 1 });
    B.fbox(f, "trimBlack", uc - 0.54, 0, 0, uc - 0.47, 2.17, 0.05, { occ: false }); B.fbox(f, "trimBlack", uc + 0.47, 0, 0, uc + 0.54, 2.17, 0.05, { occ: false }); B.fbox(f, "trimBlack", uc - 0.47, 2.1, 0, uc + 0.47, 2.17, 0.05, { occ: false });
    B.fbox(f, "trimSteel", uc - 0.47, 0.01, 0.03, uc + 0.47, 0.22, 0.034, { occ: false }); B.fbox(f, "chrome", uc + 0.3, 1.02, 0.03, uc + 0.42, 1.045, 0.075, { occ: false }); B.fbox(f, "chrome", uc + 0.385, 1.0, 0.03, uc + 0.415, 1.07, 0.045, { occ: false });
    B.fdecal(f, "decal", uc + 0.62, 1.48, uc + 1.0, 1.66, 0.012, 420, { k: "plate", t: label, n: 200 + Math.floor(hsh(f.cx, f.cz, 60 + f.d) * 40) });
  }
  function poster(f, uc) { const pi = posterN++ % POSTERS.length, P = POSTERS[pi], v0 = 1.05; B.fbox(f, "trimBlack", uc - 0.47, v0 - 0.02, 0, uc + 0.47, v0 + 1.2, 0.03, { occ: false }); B.fdecal(f, "decal", uc - 0.44, v0 + 0.01, uc + 0.44, v0 + 1.17, 0.034, 256, { k: "poster", l: P, v: pi % 6 }); }
  function wallTV(f, uc) { B.fbox(f, "plasticBlack", uc - 0.72, 1.2, 0, uc + 0.72, 2.03, 0.045, { occ: false }); B.fdecal(f, "glow", uc - 0.69, 1.23, uc + 0.69, 2.0, 0.05, 150, { k: "screen", v: Math.floor(hsh(f.cx, f.cz, 70 + f.d) * 6) }); }
  function bench(f, uc) { B.fbox(f, "o_oak", uc - 0.8, 0.4, 0.02, uc + 0.8, 0.46, 0.36, { f: ALL }); B.fbox(f, "trimBlack", uc - 0.72, 0, 0.06, uc - 0.66, 0.4, 0.32, { occ: false }); B.fbox(f, "trimBlack", uc + 0.66, 0, 0.06, uc + 0.72, 0.4, 0.32, { occ: false }); }
  function planter(f, uc) {
    B.fbox(f, "trimBlack", uc - 0.55, 0, 0.03, uc + 0.55, 0.52, 0.36, { f: ALL & ~NY });
    for (let k = 0; k < 7; k++) { const u = uc - 0.45 + k * 0.15, hh = hsh(f.cx * 5 + k, f.cz * 3, f.d + 80), ht = 0.5 + hh * 0.55; const p = B.fpos(f, u, 0.52, 0.2 + (hh - 0.5) * 0.12); cyl("leaf", p[0], 0.5, p[2], 0.1 + hh * 0.05, ht, 5, { r1: 0.02, occ: false, cap: false }); }
  }
  NXW.MATS.leaf = NXW.MATS.leaf || { c: [0.07, 0.19, 0.06], r: 0.6, m: 0 };

  // upstairs offices: the fixed desks (the game collides with the same boxes); walls behind a desk keep only wall things
  const FURN = B.li && typeof opsFurniture === "function" ? opsFurniture(M) : [], deskWall = new Uint8Array(G * G * 4);
  FURN.forEach(q => { const d = DIRS.findIndex(([a, b]) => a === -q.dx && b === -q.dz); deskWall[ci(q.cx, q.cz) * 4 + d] = 1; });
  for (const f of faces) {
    const c = ci(f.cx, f.cz), st = styleOf(f), key = WALLKEY[st], h1 = hsh(f.cx, f.cz, f.d), h2 = hsh(f.cx, f.cz, f.d + 4);
    f.style = st; f.alb = matAlb(key);
    if (terrace[c]) { windowFace(f); continue; }
    // walls along a stair or over a drop stay plain: nothing may stand in the stair or hang over the void
    // beside a stair: a dark wall clad in oak battens, the feature wall of the atrium
    if (B.stair && B.stair[ci(f.ox, f.oz)]) { B.wall(f, "o_wallDark", 0, 0, CS, H); f.kind = "plain"; f.alb = matAlb("o_wallDark"); for (let k = 0; k < 32; k++) { const u = 0.035 + k * 0.125; B.fbox(f, "o_oak", u, 0, 0, u + 0.055, H - 0.02, 0.028, { f: (ALL & ~NY & ~PY), occ: false, rot: 1, seg: 1.6 }); } continue; }
    if (noFloor(f.ox, f.oz)) { B.wall(f, key, 0, 0, CS, H); f.kind = "plain"; continue; }
    if (deskWall[ci(f.ox, f.oz) * 4 + f.d]) { const dk = key === "o_wallDark" ? "o_wall" : key; B.wall(f, dk, 0, 0, CS, H); f.kind = "plain"; f.alb = matAlb(dk); baseboard(f, 0, CS); if (h2 < 0.5) poster(f, 2); else if (h2 < 0.75) wallTV(f, 2); continue; }
    // glazed rooms
    const wantNiche = st === "server" ? ((f.zone === "siteA" || f.zone === "siteB") && h1 < 0.75) : st === "glass" ? h1 < 0.8 : st === "plaster" ? h1 < 0.16 : st === "noc" ? h1 < 0.3 : false;
    if (wantNiche && canNiche(f)) { niche(f, key, st === "server" || st === "noc" ? "racks" : st === "glass" ? "meeting" : "office"); continue; }
    B.wall(f, key, 0, 0, CS, H); f.kind = "plain";
    if (st === "oak") {
      // acoustic slat wall: oak battens on a dark backing
      for (let k = 0; k < 32; k++) { const u = 0.035 + k * 0.125; B.fbox(f, "o_oak", u, 0.1, 0, u + 0.055, H - 0.02, 0.028, { f: (ALL & ~NY & ~PY), occ: false, rot: 1, seg: 1.6 }); }
      B.fbox(f, "trimBlack", 0, 0, 0, CS, 0.1, 0.034, { occ: false, seg: 2 });
    } else if (st === "brick" || st === "conc") {
      // steel columns on the bay lines
      B.fbox(f, "trimBlack", -0.09, 0, 0, 0.09, H, 0.1, { f: ALL & ~NY & ~PY, occ: false, seg: 1.1 }); if (f.ru === runs[f.run].faces.length - 1) B.fbox(f, "trimBlack", CS - 0.09, 0, 0, CS + 0.09, H, 0.1, { f: ALL & ~NY & ~PY, occ: false, seg: 1.1 });
      if (st === "conc") baseboard(f, 0.09, CS - 0.09);
    } else if (st === "server") {
      // dark panels with a glowing reveal in the site colour
      const led = f.zone === "siteB" ? ledGreen : f.zone === "siteA" ? ledCyan : null, col = f.zone === "siteB" ? GREEN : CYAN;
      for (let k = 0; k < 4; k++) B.fbox(f, "darkMetal", k + 0.02, 0.12, 0, k + 0.98, 2.6, 0.02, { occ: false, seg: 1.3 });
      B.fbox(f, "trimBlack", 0, 0, 0, CS, 0.12, 0.03, { occ: false, seg: 2 });
      if (led) { B.fbox(f, led, 0.05, 2.66, 0, CS - 0.05, 2.69, 0.03, { f: ALL, occ: false, seg: 2 }); const fr = frame(f); rectLight(B.fpos(f, 2, 2.675, 0.035), [fr.rx * 1.9, 0, fr.rz * 1.9], [0, 0.015, 0], [fr.nx, 0, fr.nz], col.map(v => v * 26), { range: 8 }); }
    } else if (st === "lobby") {
      B.fbox(f, "trimSteel", 0, 0, 0, CS, 0.1, 0.014, { occ: false, seg: 2 });
      for (const u of [0, 2]) B.fbox(f, "trimSteel", u - 0.006, 0.1, 0, u + 0.006, H, 0.006, { f: ALL & ~NY & ~PY, occ: false });
    } else baseboard(f, 0, CS);
    // dressing on plain walls
    if (st === "plaster" || st === "glass") {
      if (h2 < 0.2) door(f, 2, key); else if (h2 < 0.42) poster(f, 2); else if (h2 < 0.52) wallTV(f, 2); else if (h2 < 0.64) bench(f, 2); else if (h2 < 0.76) planter(f, 2);
      if (h2 >= 0.2 && h2 < 0.3 && posterN < 40) poster(f, 0.9);
    } else if (st === "conc" || st === "brick") { if (h2 < 0.14) door(f, 2, key); else if (h2 < 0.3) poster(f, 2); else if (h2 < 0.42) bench(f, 2); else if (h2 < 0.52) planter(f, 2); }
    else if (st === "noc") { if (h2 < 0.75) wallTV(f, 1.1), wallTV(f, 2.9); }
    else if (st === "lobby") { if (h2 < 0.3) planter(f, 2); else if (h2 < 0.5) bench(f, 2); }
  }
  // a wall that faces a hollow terrace cell from inside a solid block still needs a surface (seen through the glass)
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
    if (!solid(x, z) || terrace[ci(x, z)]) continue;
    for (let d = 0; d < 4; d++) { const nx = x + DIRS[d][0], nz = z + DIRS[d][1]; if (!inb(nx, nz) || !terrace[ci(nx, nz)]) continue;
      const fk = { cx: x, cz: z, d }, fr = frame(fk); quad("o_conc", fr.ox, 0, fr.oz, fr.rx * CS, 0, fr.rz * CS, 0, H + 0.6, 0, { seg: 1.4 }); }
  }
  // ---- baker solids for cells that were hollowed out by glazed rooms
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
    const c = ci(x, z); if (!hollow[c] || terrace[c]) continue;
    const x0 = x * CS, z0 = z * CS, n = [0, 1, 2, 3].map(d => usedNiche[c * 4 + d]);
    const core = occ(x0 + (n[1] ? ND : 0), 0, z0 + (n[3] ? ND : 0), x0 + CS - (n[0] ? ND : 0), H, z0 + CS - (n[2] ? ND : 0), [0.3, 0.3, 0.3]), boxes = [core];
    for (let d = 0; d < 4; d++) { if (!n[d]) continue; const f = faces[faceAt[c * 4 + d]], ob = (u0, v0, u1, v1) => { const a = B.fpos(f, u0, v0, -ND), b = B.fpos(f, u1, v1, 0); boxes.push(occ(Math.min(a[0], b[0]), v0, Math.min(a[2], b[2]), Math.max(a[0], b[0]), v1, Math.max(a[2], b[2]), f.alb)); };
      ob(0, 0, NU0, H); ob(NU1, 0, CS, H); ob(NU0, NV, NU1, H); }
    // plain faces of this cell keep their lightmap chart: point every solid that touches the face plane at it
    for (let d = 0; d < 4; d++) { const fi = faceAt[c * 4 + d]; if (fi < 0 || n[d]) continue; const f = faces[fi], fa = d === 0 ? 0 : d === 1 ? 1 : d === 2 ? 4 : 5, plane = d === 0 ? x0 + CS : d === 1 ? x0 : d === 2 ? z0 + CS : z0, ai = d < 2 ? (d === 0 ? 3 : 0) : (d === 2 ? 5 : 2);
      for (const k of boxes) if (Math.abs(B.occB(k, ai) - plane) < 0.001) B.setOcc(k, fa, runs[f.run].chart, f.alb); }
  }

  // ---- ceiling: linear pendants along the walking direction, ducts and acoustic fins; these are the light sources
  const pend = (x, z, alongX, len, mat, L, y) => {
    y = y || 2.72; const hx = alongX ? len / 2 : 0.035, hz = alongX ? 0.035 : len / 2;
    box(mat, x - hx, y, z - hz, x + hx, y + 0.025, z + hz, { f: ALL & ~PY, occ: false, seg: 3 }); box("trimBlack", x - hx - 0.01, y + 0.025, z - hz - 0.01, x + hx + 0.01, y + 0.075, z + hz + 0.01, { f: ALL, occ: false, seg: 3 });
    for (const s of [-0.8, 0.8]) { const cx = x + (alongX ? s * len / 2 : 0), cz = z + (alongX ? 0 : s * len / 2); box("trimBlack", cx - 0.004, y + 0.075, cz - 0.004, cx + 0.004, H, cz + 0.004, { f: PX | NXb | PZ | NZ, occ: false, seg: 4 }); }
    rectLight([x, y - 0.005, z], [hx, 0, 0], [0, 0, hz], [0, -1, 0], L, { range: 13 });
    rectLight([x, y + 0.08, z], [hx, 0, 0], [0, 0, hz], [0, 1, 0], L.map(v => v * 0.22), { range: 6 });
    B.fixture(x, y, z, L, len, "bar");
  };
  const spot = (x, z, L, y) => { cyl("trimBlack", x, (y || H) - 0.1, z, 0.075, 0.1, 10, { occ: false, cap: false }); box("lampWarm", x - 0.05, (y || H) - 0.102, z - 0.05, x + 0.05, (y || H) - 0.1, z + 0.05, { f: NY, occ: false }); rectLight([x, (y || H) - 0.11, z], [0.06, 0, 0], [0, 0, 0.06], [0, -1, 0], L, { range: 9, spot: 3 }); B.fixture(x, (y || H) - 0.1, z, L, 0.15, "spot"); };
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
    if (solid(x, z) || noCeil(x, z)) continue; const zn = zoneOf(x, z), cx = x * CS + CS / 2, cz = z * CS + CS / 2, wx = solid(x - 1, z) && solid(x + 1, z), wz = solid(x, z - 1) && solid(x, z + 1), h = hsh(x, z, 90);
    if (zn === "hall") {
      // corridors: a pendant along the corridor in every other cell; open floor: a pendant per cell, alternating direction
      const corr = wx !== wz;
      if (corr ? ((x + z) & 1) === 0 : true) pend(cx, cz, corr ? wz : ((x + z) & 1) === 0, corr ? 2.0 : 1.6, lampWarm, WARM.map(v => v * (corr ? 175 : 140)));
      if (!corr && openN(x, z) === 4 && h < 0.55) for (let k = 0; k < 4; k++) { const o = -1.35 + k * 0.9; if (((x + z) & 1) === 0) box("o_felt", cx + o - 0.02, 2.62, cz - 1.5, cx + o + 0.02, 2.98, cz - 0.55, { f: ALL, occ: false, seg: 1.2 }), box("o_felt", cx + o - 0.02, 2.62, cz + 0.55, cx + o + 0.02, 2.98, cz + 1.5, { f: ALL, occ: false, seg: 1.2 }); else box("o_felt", cx - 1.5, 2.62, cz + o - 0.02, cx - 0.55, 2.98, cz + o + 0.02, { f: ALL, occ: false, seg: 1.2 }), box("o_felt", cx + 0.55, 2.62, cz + o - 0.02, cx + 1.5, 2.98, cz + o + 0.02, { f: ALL, occ: false, seg: 1.2 }); }
    } else if (zn === "red") {
      // lobby: warm downlights in a grid and a pendant ring of small lamps
      for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) spot(cx + ox, cz + oz, WARM.map(v => v * 620));
      if (((x + z) & 1) === 0) { cyl("lampWarm", cx, 2.35, cz, 0.16, 0.22, 12, { occ: false }); box("trimBlack", cx - 0.004, 2.57, cz - 0.004, cx + 0.004, H, cz + 0.004, { f: PX | NXb | PZ | NZ, occ: false }); rectLight([cx, 2.34, cz], [0.16, 0, 0], [0, 0, 0.16], [0, -1, 0], WARM.map(v => v * 55), { range: 9 }); B.fixture(cx, 2.45, cz, WARM.map(v => v * 30), 0.4, "bulb"); }
    } else if (zn === "blue") {
      // NOC: dim, cool, screens do the talking
      if (((x + z) & 1) === 0) pend(cx, cz, true, 1.4, lampCool, COOL.map(v => v * 85));
      spot(cx + 1.2, cz - 1.2, BLUE.map(v => v * 300));
    } else {
      // sites: cold white strips in pairs plus a coloured wash
      pend(cx - 0.9, cz, false, 2.6, lampCool, COOL.map(v => v * 50), 2.86); pend(cx + 0.9, cz, false, 2.6, lampCool, COOL.map(v => v * 50), 2.86);
    }
  }
  // ducts: follow long straight open runs, alternating sides, with hangers
  for (let z = 1; z < G - 1; z++) { let x = 1; while (x < G - 1) { if (solid(x, z) || noCeil(x, z) || zoneOf(x, z) !== "hall") { x++; continue; } let e = x; while (e < G - 1 && !solid(e, z) && !noCeil(e, z) && zoneOf(e, z) === "hall") e++; if (e - x >= 4 && hsh(x, z, 95) < 0.6) { const zc = z * CS + (hsh(x, z, 96) < 0.5 ? 0.75 : CS - 0.75); box("trimSteel", x * CS + 0.3, 2.78, zc - 0.3, e * CS - 0.3, 3.1, zc + 0.3, { f: ALL, seg: 2, uo: 0.3 }); for (let k = x * CS + 1; k < e * CS - 0.5; k += 2) box("trimBlack", k - 0.02, 2.76, zc - 0.33, k + 0.02, H, zc + 0.33, { f: ALL & ~PY, occ: false }); } x = e + 1; } }
  for (let x = 1; x < G - 1; x++) { let z = 1; while (z < G - 1) { if (solid(x, z) || noCeil(x, z) || zoneOf(x, z) !== "hall") { z++; continue; } let e = z; while (e < G - 1 && !solid(x, e) && !noCeil(x, e) && zoneOf(x, e) === "hall") e++; if (e - z >= 4 && hsh(x, z, 97) < 0.6) { const xc = x * CS + (hsh(x, z, 98) < 0.5 ? 0.7 : CS - 0.7); box("redPaint", xc - 0.035, 3.0, z * CS + 0.2, xc + 0.035, 3.07, e * CS - 0.2, { f: ALL & ~PY, occ: false, seg: 2 }); box("trimSteel", xc + 0.25, 2.93, z * CS + 0.2, xc + 0.6, 2.97, e * CS - 0.2, { f: ALL, occ: false, seg: 2 }); } z = e + 1; } }

  // ---- desks: oak top on black legs, two screens, an office chair, sometimes a plant
  FURN.forEach((q) => {
    const yT = q.y1 - q.y0, mx = (q.x0 + q.x1) / 2, mz = (q.z0 + q.z1) / 2, ax = q.dz !== 0 ? 1 : 0, az = 1 - ax;   // (ax, az): along the desk
    box("o_oak", q.x0, yT - 0.04, q.z0, q.x1, yT, q.z1, { f: ALL, seg: 2 });
    const hw = (q.x1 - q.x0) / 2, hd = (q.z1 - q.z0) / 2;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const lx = mx + sx * (hw - 0.05), lz = mz + sz * (hd - 0.05); box("trimBlack", lx - 0.025, 0, lz - 0.025, lx + 0.025, yT - 0.04, lz + 0.025, { occ: false }); }
    // modesty panel on the wall side
    { const wx = mx + q.dx * (q.dx ? hw - 0.06 : 0), wz = mz + q.dz * (q.dz ? hd - 0.06 : 0); box("trimBlack", wx - (ax ? hw - 0.06 : 0.01), 0.25, wz - (az ? hd - 0.06 : 0.01), wx + (ax ? hw - 0.06 : 0.01), yT - 0.04, wz + (az ? hd - 0.06 : 0.01), { occ: false, seg: 2 }); }
    const nd = [-q.dx, -q.dz];   // the side people sit on
    for (const k of [-1, 1]) {
      const cxm = mx + ax * k * 0.42 + q.dx * 0.18, czm = mz + az * k * 0.42 + q.dz * 0.18, Ux = -q.dz, Uz = q.dx;   // screen faces the chair
      box("plasticBlack", cxm - Math.abs(Ux) * 0.29 - Math.abs(q.dx) * 0.015, yT + 0.17, czm - Math.abs(Uz) * 0.29 - Math.abs(q.dz) * 0.015, cxm + Math.abs(Ux) * 0.29 + Math.abs(q.dx) * 0.015, yT + 0.53, czm + Math.abs(Uz) * 0.29 + Math.abs(q.dz) * 0.015, { occ: false });
      box("trimBlack", cxm - 0.02 + q.dx * 0.04, yT, czm - 0.02 + q.dz * 0.04, cxm + 0.02 + q.dx * 0.04, yT + 0.17, czm + 0.02 + q.dz * 0.04, { occ: false });
      const px = cxm + nd[0] * 0.017 - Ux * 0.27, pz = czm + nd[1] * 0.017 - Uz * 0.27;
      B.decal("glow", [px, yT + 0.19, pz], [Ux * 0.54, 0, Uz * 0.54], [0, 0.32, 0], 160, { k: "screen", v: Math.floor(hsh(q.cx * 3 + k, q.cz, 41) * 6) });
    }
    // chair: five-star base, gas lift, seat and back
    const chx = mx + nd[0] * 0.78 + ax * (q.s - 0.5) * 0.4, chz = mz + nd[1] * 0.78 + az * (q.s - 0.5) * 0.4;
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + q.s; tube("trimBlack", chx, 0.07, chz, chx + Math.cos(a) * 0.3, 0.05, chz + Math.sin(a) * 0.3, 0.02, 4); }
    cyl("chrome", chx, 0.07, chz, 0.025, 0.36, 8, { occ: false, cap: false });
    box("o_feltDark", chx - 0.25, 0.43, chz - 0.25, chx + 0.25, 0.5, chz + 0.25, { f: ALL, occ: false });
    box("o_feltDark", chx + nd[0] * 0.24 - (ax ? 0.23 : 0.03), 0.52, chz + nd[1] * 0.24 - (az ? 0.23 : 0.03), chx + nd[0] * 0.24 + (ax ? 0.23 : 0.03), 1.05, chz + nd[1] * 0.24 + (az ? 0.23 : 0.03), { f: ALL, occ: false });
    if (q.s > 0.7) { const plx = mx + ax * (hw + 0.35) * (q.s > 0.85 ? 1 : -1), plz = mz + az * (hd + 0.35) * (q.s > 0.85 ? 1 : -1);
      cyl("trimBlack", plx + q.dx * 0.15, 0, plz + q.dz * 0.15, 0.2, 0.45, 10, { occ: false });
      for (let k = 0; k < 6; k++) { const hh = hsh(q.cx * 5 + k, q.cz * 3, 88); cyl("leaf", plx + q.dx * 0.15 + (hh - 0.5) * 0.2, 0.43, plz + q.dz * 0.15 + (hsh(k, q.cz, 89) - 0.5) * 0.2, 0.07 + hh * 0.05, 0.6 + hh * 0.5, 5, { r1: 0.02, occ: false, cap: false }); } }
  });

  // ---- floor markings and signs
  const siteCells = (k) => { const out = []; for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) if (ch(x, z) === k) out.push([x, z]); return out; };
  [["a", "A", 0, CYAN], ["b", "B", 1, GREEN]].forEach(([k, L, col]) => {
    const cells = siteCells(k); if (!cells.length) return; const si = OPS_SITE[k === "a" ? 0 : 1], mx = si[0], mz = si[1];   // on a floor cell of the site, never inside a block
    B.decal("decal", [mx - 2.4, 0.006, mz + 2.4], [4.8, 0, 0], [0, 0, -4.8], 100, { k: "site", t: L, col });
    // hazard edge where the site meets the hall
    cells.forEach(([x, z]) => DIRS.forEach(([dx, dz]) => { if (ch(x + dx, z + dz) !== ".") return; const x0 = x * CS, z0 = z * CS;
      if (dx) B.decal("decal", [dx > 0 ? x0 + CS - 0.3 : x0, 0.005, z0 + CS], [0.3, 0, 0], [0, 0, -CS], 64, { k: "hazard", r: 1 }); else B.decal("decal", [x0, 0.005, dz > 0 ? z0 + CS : z0 + 0.3], [CS, 0, 0], [0, 0, -0.3], 64, { k: "hazard", r: 0 }); }));
  });
  // lit signs for sites and spawns on the first wall that looks into them
  const signs = [["a", "SITE A", M.sites[0], 0], ["b", "SITE B", M.sites[1], 1], ["u", "BLUE TEAM", M.spawns[1], 3], ["r", "RED TEAM", M.spawns[0], 2]];
  signs.forEach(([k, t, sub, col]) => { const zn = { a: "siteA", b: "siteB", u: "blue", r: "red" }[k]; const f = faces.find(q => q.zone === zn && q.kind === "plain" && q.style !== "oak" && hsh(q.cx, q.cz, q.d + 4) >= 0.76) || faces.find(q => q.zone === zn && q.kind === "plain"); if (!f) return;
    B.fbox(f, "trimBlack", 0.55, 2.2, 0, 3.45, 3.0, 0.05, { occ: false, seg: 2 }); B.fdecal(f, "glowHi", 0.6, 2.25, 3.4, 2.95, 0.055, 180, { k: "sign", t, sub, col }); f.sign = 1; });
  // the lobby gets the company name in light on its widest marble wall
  const lobbyRun = runs.filter(r => r.faces.every(f => f.zone === "red" && f.kind === "plain" && !f.sign)).sort((a, b) => b.faces.length - a.faces.length)[0];
  if (lobbyRun && lobbyRun.faces.length >= 2) { const f = lobbyRun.faces[Math.floor((lobbyRun.faces.length - 2) / 2)]; B.fdecal(f, "glowHi", 0.6, 1.25, 7.4, 2.45, 0.02, 128, { k: "logo" }); const fr = frame(f); rectLight(B.fpos(f, 4, 1.85, 0.05), [fr.rx * 3.2, 0, fr.rz * 3.2], [0, 0.4, 0], [fr.nx, 0, fr.nz], AMBER.map(v => v * 3.2), { range: 10 }); }
};
