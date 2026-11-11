// ======================= NX theme: Data Center Campus, server halls round an open yard at sunset =======================
// The first map that is half indoors and half outdoors. `M.indoor` lists the roofed rectangles (cells): those get a raised
// floor, a ceiling with high-bay lamps and walls lined with server cabinets; everything else is open yard under the sky
// with asphalt, painted lines, floodlight poles and metal-clad building fronts. Doorways between the two get a lintel and a
// roller-door frame so the buildings read as buildings.
NXW.themes.campus = (B, M, env) => {
  const { W, A, G, H, CS, quad, box, cyl, tube, rectLight, lightMat, matAlb, hsh, PX, PY, NY, PZ, NZ, ALL } = B, NXb = B.NX;
  const { ch, solid, border, ci, faces, runs, pods, frame, zoneOf } = A, DIRS = NXW.DIRS;
  const K = NXW.kit(B), { WARM, COOL, CYAN, GREEN, AMBER, SODIUM } = K.C, mul = K.mul, norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  W.sky = { name: "dusk", k: 1.0 }; W.sun = { dir: norm([-0.62, 0.5, 0.6]), E: [9.5, 7.0, 4.4], ang: 0.035 };
  W.grade = { expo: 1.0, fog: [0.16, 0.12, 0.1], fogD: 0.004, tint: [1.02, 1.0, 0.97] };
  const lampCool = lightMat("lampCool", COOL, 22), lampSod = lightMat("lampSod", SODIUM, 30), ledCyan = lightMat("ledCyan", CYAN, 9), ledAmber = lightMat("ledAmber", AMBER, 8), ledGreen = lightMat("ledGreen", GREEN, 9);
  const RECTS = M.indoor || [], inRect = (x, z) => RECTS.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
  const indoor = (x, z) => !solid(x, z) && inRect(x, z);
  // ---- ground: raised floor tiles indoors, asphalt and pavers outside
  const OUT = { hall: "rc_road", red: "r_pave", blue: "r_pave", siteA: "d_pave", siteB: "d_pave" };
  const floorMat = (x, z) => indoor(x, z) ? "o_raised" : OUT[zoneOf(x, z)] || "rc_road";
  B.floorAlbOf = (x, z) => matAlb(floorMat(x, z)); B.ceilAlbOf = () => matAlb("f_ceil");
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
    if (solid(x, z)) continue; const c = ci(x, z), x0 = x * CS, z0 = z * CS;
    B.floor(floorMat(x, z), x0, z0, x0 + CS, z0 + CS, 0);
    if (!indoor(x, z)) continue;
    // roofed: ceiling at H, a roof slab over it (seen from the top of a jump), high-bay lamps on every other cell
    B.ceilY[c] = H; B.ceilOn[c] = 1; B.ceil("f_ceil", x0, z0, x0 + CS, z0 + CS, H);
    box("r_parapet", x0, H, z0, x0 + CS, H + 0.35, z0 + CS, { f: PY, occ: false });
    const cx = x0 + CS / 2, cz = z0 + CS / 2, zn = zoneOf(x, z);
    if (((x + z) & 1) === 0) K.highbay(cx, cz, H - 1.1, H - 0.02, mul(COOL, zn === "siteA" ? 300 : 360), lampCool, 16);
  }
  // ---- doorways: where a roofed cell meets open yard, a lintel closes the wall above the opening and a frame lines it
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
    if (!indoor(x, z)) continue;
    DIRS.forEach(([dx, dz]) => { const nx = x + dx, nz = z + dz; if (solid(nx, nz) || indoor(nx, nz)) return;
      const ex = x * CS + CS / 2 + dx * CS / 2, ez = z * CS + CS / 2 + dz * CS / 2, hx = dz ? CS / 2 : 0.2, hz = dx ? CS / 2 : 0.2;
      box("f_blue", ex - hx, 3.6, ez - hz, ex + hx, H + 0.35, ez + hz, { f: ALL & ~NY, seg: 1.5 });
      box("f_yellow", ex - hx, 3.48, ez - hz, ex + hx, 3.6, ez + hz, { f: ALL, occ: false, seg: 2 });
      box("f_shutter", ex - (dz ? hx - 0.2 : 0.06), 3.0, ez - (dx ? hz - 0.2 : 0.06), ex + (dz ? hx - 0.2 : 0.06), 3.48, ez + (dx ? hz - 0.2 : 0.06), { f: ALL, occ: false, seg: 1.5 });   // rolled-up door drum
      for (const s of [-1, 1]) { const px = ex + (dz ? s * (hx - 0.1) : 0), pz = ez + (dx ? s * (hz - 0.1) : 0); box("f_yellow", px - 0.1, 0, pz - 0.1, px + 0.1, 3.48, pz + 0.1, { f: ALL & ~NY, occ: false }); }
      // a lamp over the door on the yard side
      const ox = ex + dx * 0.25, oz = ez + dz * 0.25; box("trimBlack", ox - 0.2, 3.85, oz - 0.2, ox + 0.2, 3.95, oz + 0.2, { f: ALL, occ: false }); box(lampSod, ox - 0.16, 3.84, oz - 0.16, ox + 0.16, 3.85, oz + 0.16, { f: NY, occ: false });
      rectLight([ox, 3.83, oz], [0.16, 0, 0], [0, 0, 0.16], [dx * 0.3, -1, dz * 0.3], mul(SODIUM, 150), { range: 10 });
    });
  }
  // ---- walls. Indoors: cabinet rows (blocks inside a hall) or painted panels; outdoors: metal-clad fronts and brick,
  // the security wall round the edge
  const podIn = pods.map(p => p.cells.every(([x, z]) => DIRS.every(([dx, dz]) => solid(x + dx, z + dz) || indoor(x + dx, z + dz))));
  let signN = 0;
  for (const f of faces) {
    const fr = frame(f), h = f.h, h1 = hsh(f.cx, f.cz, f.d), h2 = hsh(f.cx, f.cz, f.d + 4), inside = indoor(f.ox, f.oz), zn = f.zone;
    if (inside && f.pod >= 0 && podIn[f.pod]) {   // a row of server cabinets with its containment on top
      const col = zn === "siteA" ? 0 : h2 < 0.3 ? 1 : 0, led = col === 1 ? ledGreen : ledCyan, LC = col === 1 ? GREEN : CYAN;
      B.wall(f, "f_pod", 0, 0, CS, h); f.kind = "racks"; f.alb = [0.05, 0.05, 0.06];
      B.fbox(f, "plasticBlack", 0.17, 0.1, 0, 3.83, 2.13, 0.06, { occ: false, seg: 2 });
      for (let k = 0; k < 6; k++) { const u = 0.2 + k * 0.605, q = hsh(f.cx * 5 + k, f.cz * 3 + f.d, 7);
        B.fdecal(f, "glow", u + 0.012, 0.13, u + 0.593, 2.1, 0.066, 150, q < 0.1 ? { k: "cooler" } : { k: "rack", sd: Math.floor(q * 60) % 6, col }); }
      K.strip(f, 0.2, 3.8, 0.082, 0.066, led, mul(LC, 16), 4.5, 0.016);
      B.fbox(f, "trimSteel", 0.14, 2.13, 0, 3.86, 2.2, 0.08, { occ: false, seg: 2 });
      B.fdecal(f, "decal", 1.55, 2.26, 2.45, 2.46, 0.012, 260, { k: "label", t: "DC" + (1 + f.pod % 3) + "-" + String(1 + (f.cx * 3 + f.cz * 7 + f.d) % 48).padStart(2, "0") });
      for (let k = 0; k < 4; k++) B.fbox(f, "darkMetal", k + 0.03, 2.52, 0, k + 0.97, 3.17, 0.022, { occ: false, seg: 1.4 });
      continue;
    }
    if (inside) {   // hall wall: grey lower panels, white upper, a cable tray and a chilled-water pair
      B.wall(f, "f_wallLo", 0, 0, CS, 2.8); B.wall(f, "f_wallHi", 0, 2.8, CS, H); f.kind = "plain"; f.alb = matAlb("f_wallLo");
      B.fbox(f, "trimBlack", 0.11, 2.74, 0, CS - 0.11, 2.86, 0.07, { occ: false, seg: 2 });
      K.pipe(f, "f_pipeBlue", 0, CS, H - 0.7, 0.2, 0.07); K.pipe(f, "f_pipeRed", 0, CS, H - 0.45, 0.4, 0.07);
      if (h1 < 0.3) { B.fbox(f, "plasticGrey", 0.6, 0, 0, 1.5, 1.95, 0.6, { seg: 2 }); B.fdecal(f, "glow", 0.7, 1.4, 1.4, 1.8, 0.605, 120, { k: "screen", v: Math.floor(h2 * 6) }); }   // a CRAC unit
      else if (h1 < 0.45) B.fdecal(f, "decal", 1.0, 1.0, 3.0, 2.2, 0.012, 90, { k: "poster", v: Math.floor(h2 * 8) });
      continue;
    }
    if (f.pod < 0) {   // the security wall round the campus: precast concrete, a coping, razor wire, a light every few panels
      B.wall(f, "r_parapet", 0, 0, CS, h); f.kind = "plain"; f.alb = matAlb("r_parapet");
      for (let k = 0; k <= 1; k++) B.fbox(f, "trimBlack", k * CS - 0.03, 0, 0, k * CS + 0.03, h, 0.04, { occ: false, seg: 1.3 });
      B.fbox(f, "trimSteel", -0.02, h - 0.12, 0, CS + 0.02, h, 0.22, { f: ALL, occ: false, seg: 2 });
      for (let k = 0; k < 3; k++) tube("trimSteel", B.fpos(f, k * 1.33, h + 0.25, 0.1)[0], h + 0.25, B.fpos(f, k * 1.33, h + 0.25, 0.1)[2], B.fpos(f, (k + 1) * 1.33, h + 0.25, 0.1)[0], h + 0.25, B.fpos(f, (k + 1) * 1.33, h + 0.25, 0.1)[2], 0.12, 6, { occ: false });
      if ((f.cx + f.cz) % 3 === 0) { const q = B.fpos(f, 2, h - 0.6, 0.25); box("trimBlack", q[0] - 0.2, q[1] - 0.1, q[2] - 0.2, q[0] + 0.2, q[1] + 0.1, q[2] + 0.2, { f: ALL, occ: false }); box(lampSod, q[0] - 0.16, q[1] - 0.11, q[2] - 0.16, q[0] + 0.16, q[1] - 0.1, q[2] + 0.16, { f: NY, occ: false });
        rectLight([q[0], q[1] - 0.12, q[2]], [0.16, 0, 0], [0, 0, 0.16], [fr.nx * 0.5, -0.85, fr.nz * 0.5], mul(SODIUM, 260), { range: 16, spot: 1 }); }
      else if (h1 < 0.18) B.fdecal(f, "decal", 0.8, 1.2, 3.2, 2.6, 0.012, 90, { k: "bill", l: ["NETEAM", "MANAGED IT · NYC"], col: Math.floor(h2 * 5) });
      continue;
    }
    // a building front on the yard: corrugated blue cladding over a concrete plinth, or brick on the small sheds
    const big = pods[f.pod].cells.length >= 6, clad = big || h1 < 0.5;
    B.wall(f, clad ? "f_blue" : "o_brick", 0, 0, CS, h); f.kind = "plain"; f.alb = matAlb(clad ? "f_blue" : "o_brick");
    B.fbox(f, "r_parapet", 0, 0, 0, CS, 0.6, 0.05, { occ: false, seg: 2 }); B.fbox(f, "trimSteel", -0.03, h - 0.18, 0, CS + 0.03, h, 0.1, { f: ALL & ~PY, occ: false, seg: 2 });
    if (big && signN < 2 && h > 4 && h1 < 0.35) { signN++; B.fbox(f, "trimBlack", 0.3, 2.9, 0, 3.7, 4.2, 0.06, { occ: false, seg: 2 }); B.fdecal(f, "glowHi", 0.35, 2.95, 3.65, 4.15, 0.065, 90, { k: "bill", l: signN === 1 ? ["NETEAM", "DATA CENTER · HALL " + signN] : ["NETEAM", "TIER III · 99.982%"], col: signN }); }
    else if (h1 < 0.55) { B.fbox(f, "f_shutter", 0.5, 0.6, 0, 3.5, 3.1, 0.04, { occ: false, seg: 1.5 }); B.fbox(f, "f_yellow", 0.4, 3.1, 0, 3.6, 3.2, 0.08, { occ: false, seg: 2 }); }
    else if (h1 < 0.75) { for (let k = 0; k < 3; k++) { const u = 0.35 + k * 1.12; B.fbox(f, "darkMetal", u, 1.2, 0, u + 1.04, 2.4, 0.03, { occ: false, seg: 1.3 }); } B.fdecal(f, "decal", 1.4, 2.6, 2.6, 2.85, 0.012, 240, { k: "label", t: "AHU-" + String(1 + Math.floor(h2 * 20)).padStart(2, "0"), col: 1 }); }
    else { K.pipe(f, "f_pipeBlue", 0, CS, 1.1, 0.14, 0.08); K.pipe(f, "f_pipeRed", 0, CS, 1.4, 0.14, 0.08); }
    if (hsh(f.cx, f.cz, f.d + 30) < 0.3) { const q = B.fpos(f, 2, h - 0.5, 0.3); box("trimBlack", q[0] - 0.22, q[1] - 0.1, q[2] - 0.22, q[0] + 0.22, q[1] + 0.12, q[2] + 0.22, { f: ALL, occ: false }); box(lampSod, q[0] - 0.18, q[1] - 0.115, q[2] - 0.18, q[0] + 0.18, q[1] - 0.1, q[2] + 0.18, { f: NY, occ: false });
      rectLight([q[0], q[1] - 0.12, q[2]], [0.18, 0, 0], [0, 0, 0.18], [fr.nx * 0.55, -0.8, fr.nz * 0.55], mul(SODIUM, 380), { range: 20, spot: 1 }); }
  }
  // ---- painted parking lines and arrows in the yards, a chiller row along site B
  for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) { if (solid(x, z) || indoor(x, z) || hsh(x, z, 81) > 0.22 || ch(x, z) !== ".") continue;
    K.floorText(x * CS + 0.6, z * CS + 1.2, 2.8, 1.6, hsh(x, z, 82) < 0.5 ? "SLOW" : "NO PARKING", 1, false); }
  K.decks("v_deckTop", "r_unit", 3);
  K.siteMarks([0, 1]); K.signs(M, [0, 1, 3, 2], 2.4, (q) => q.free && q.kind === "plain");
  W.dress.push({ kind: "city", sides: [0, 1, 2, 3], floor: 30, em: 0.18 });
};
NXW.themes.campus.outdoor = true; NXW.themes.campus.mixed = true; NXW.themes.campus.H = 5.2;
// building heights: halls and their walls stand a little over the roof line; sheds and the yard blocks are lower
NXW.themes.campus.blockH = (x, z, c) => { if (c.border(x, z)) return 4.6; const p = c.podOf[c.ci(x, z)]; return p >= 0 && c.pods[p].cells.length >= 6 ? 5.6 : 5.2; };
