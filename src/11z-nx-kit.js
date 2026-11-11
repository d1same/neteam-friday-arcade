// ======================= NX theme kit: pieces several map themes share =======================
// Light fittings, pipes, site markings and lit signs. NXW.kit(B) binds them to the builder of the map being generated.
NXW.kit = (B) => {
  const { W, A, G, CS, quad, box, cyl, tube, rectLight, PX, PY, NY, PZ, NZ, ALL } = B, NXb = B.NX, { ch, faces, frame } = A, DIRS = NXW.DIRS;
  const C = { WARM: [1, 0.84, 0.64], NEUT: [1, 0.92, 0.8], COOL: [0.86, 0.94, 1], CYAN: [0.2, 0.78, 1], GREEN: [0.22, 1, 0.55], RED: [1, 0.22, 0.26], BLUE: [0.22, 0.5, 1], AMBER: [1, 0.6, 0.18], MAG: [1, 0.2, 0.75], GOLD: [1, 0.74, 0.28], SODIUM: [1, 0.66, 0.3] };
  const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const K = { C, mul };
  // linear pendant hanging from `top`; lights down and a little up
  K.pend = (x, z, alongX, len, mat, L, y, top, range) => {
    const hx = alongX ? len / 2 : 0.035, hz = alongX ? 0.035 : len / 2;
    box(mat, x - hx, y, z - hz, x + hx, y + 0.025, z + hz, { f: ALL & ~PY, occ: false, seg: 3 }); box("trimBlack", x - hx - 0.01, y + 0.025, z - hz - 0.01, x + hx + 0.01, y + 0.075, z + hz + 0.01, { f: ALL, occ: false, seg: 3 });
    for (const s of [-0.8, 0.8]) { const cx = x + (alongX ? s * len / 2 : 0), cz = z + (alongX ? 0 : s * len / 2); box("trimBlack", cx - 0.004, y + 0.075, cz - 0.004, cx + 0.004, top, cz + 0.004, { f: PX | NXb | PZ | NZ, occ: false, seg: 4 }); }
    rectLight([x, y - 0.005, z], [hx, 0, 0], [0, 0, hz], [0, -1, 0], L, { range: range || 13 });
    rectLight([x, y + 0.08, z], [hx, 0, 0], [0, 0, hz], [0, 1, 0], mul(L, 0.22), { range: 6 });
    B.fixture(x, y, z, L, len, "bar");
  };
  // recessed or surface downlight under a ceiling at `y`
  K.spot = (x, z, L, y, mat, range) => { cyl("trimBlack", x, y - 0.1, z, 0.075, 0.1, 10, { occ: false, cap: false }); box(mat || "lampWarm", x - 0.05, y - 0.102, z - 0.05, x + 0.05, y - 0.1, z + 0.05, { f: NY, occ: false }); rectLight([x, y - 0.11, z], [0.06, 0, 0], [0, 0, 0.06], [0, -1, 0], L, { range: range || 9, spot: 3 }); B.fixture(x, y - 0.1, z, L, 0.15, "spot"); };
  // industrial high-bay lamp on a rod
  K.highbay = (x, z, y, top, L, mat, range) => {
    cyl("trimBlack", x, y, z, 0.21, 0.16, 12, { r1: 0.09, occ: false, cap: false }); cyl("trimBlack", x, y + 0.16, z, 0.09, 0.1, 8, { occ: false });
    box(mat, x - 0.16, y - 0.004, z - 0.16, x + 0.16, y, z + 0.16, { f: NY, occ: false }); box("trimBlack", x - 0.008, y + 0.26, z - 0.008, x + 0.008, top, z + 0.008, { f: PX | NXb | PZ | NZ, occ: false, seg: 4 });
    rectLight([x, y - 0.012, z], [0.16, 0, 0], [0, 0, 0.16], [0, -1, 0], L, { range: range || 17, spot: 1 }); B.fixture(x, y, z, L, 0.4, "spot");
  };
  // glowing strip on a wall face (u0..u1 along the wall at height v, w off the wall) that washes the wall or the floor in colour
  K.strip = (f, u0, u1, v, w, mat, L, range, th) => { const fr = frame(f); th = th || 0.03; B.fbox(f, mat, u0, v, w - 0.012, u1, v + th, w, { f: ALL, occ: false, seg: 2 }); rectLight(B.fpos(f, (u0 + u1) / 2, v + th / 2, w + 0.01), [fr.rx * (u1 - u0) / 2, 0, fr.rz * (u1 - u0) / 2], [0, th / 2, 0], [fr.nx, 0, fr.nz], L, { range: range || 7 }); };
  // pipe run with brackets along a wall face
  K.pipe = (f, key, u0, u1, v, w, r) => { const a = B.fpos(f, u0, v, w), b = B.fpos(f, u1, v, w); tube(key, a[0], a[1], a[2], b[0], b[1], b[2], r, 8, { seg: 2 }); };
  K.riser = (f, key, u, w, v0, v1, r) => { const a = B.fpos(f, u, v0, w); tube(key, a[0], v0, a[2], a[0], v1, a[2], r, 8, { seg: 1.6 }); };
  // ---- floor paint for the two sites: a ring with the letter, hazard stripes where the site meets the hall
  K.cellsOf = (k) => { const out = []; for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) if (ch(x, z) === k) out.push([x, z]); return out; };
  K.siteMarks = (cols, y) => {
    y = y || 0; [["a", "A", cols[0]], ["b", "B", cols[1]]].forEach(([k, L, col]) => {
      const cells = K.cellsOf(k); if (!cells.length) return; const si = OPS_SITE[k === "a" ? 0 : 1], mx = si[0], mz = si[1];   // on a floor cell of the site, never inside a block
      B.decal("decal", [mx - 2.4, y + 0.006, mz + 2.4], [4.8, 0, 0], [0, 0, -4.8], 100, { k: "site", t: L, col });
      cells.forEach(([x, z]) => DIRS.forEach(([dx, dz]) => { if (ch(x + dx, z + dz) !== ".") return; const x0 = x * CS, z0 = z * CS;
        if (dx) B.decal("decal", [dx > 0 ? x0 + CS - 0.3 : x0, y + 0.005, z0 + CS], [0.3, 0, 0], [0, 0, -CS], 64, { k: "hazard", r: 1 }); else B.decal("decal", [x0, y + 0.005, dz > 0 ? z0 + CS : z0 + 0.3], [CS, 0, 0], [0, 0, -0.3], 64, { k: "hazard", r: 0 }); }));
    });
  };
  // ---- jumpable decks for any theme: "1" = 1.2 m (crates, low platforms), "2" = 2.6 m (balconies, catwalks reached from
  // a jump pad "^"). A solid block with its own top, a dark kick at the foot, a light line on the top edge, a ring under each pad
  K.decks = (top, side, lineCol, frameMat) => {
    const FR = frameMat || "trimSteel";
    const DH = { "1": 1.2, "2": 2.6 }, hAt = (x, z) => DH[ch(x, z)] || 0;
    for (let z = 1; z < G - 1; z++) for (let x = 1; x < G - 1; x++) {
      const hh = hAt(x, z); if (!hh || A.solid(x, z)) continue; const c = A.ci(x, z), x0 = x * CS, z0 = z * CS; let fm = 0, y0 = hh;
      B.floorY[c] = hh; B.floor(top, x0, z0, x0 + CS, z0 + CS, hh);
      DIRS.forEach(([dx, dz]) => { const nh = A.solid(x + dx, z + dz) ? 99 : hAt(x + dx, z + dz); if (nh >= hh) return; fm |= dx > 0 ? PX : dx < 0 ? NXb : dz > 0 ? PZ : NZ; y0 = Math.min(y0, nh);
        const ex = x0 + CS / 2 + dx * CS / 2, ez = z0 + CS / 2 + dz * CS / 2, hx = dz ? CS / 2 : 0.012, hz = dx ? CS / 2 : 0.012, ox = dx * 0.012, oz = dz * 0.012;
        box("trimBlack", ex - hx + ox, nh, ez - hz + oz, ex + hx + ox, nh + 0.1, ez + hz + oz, { f: ALL, occ: false, seg: 2 });
        box("trimBlack", ex - hx * 1.02 + ox * 2, hh - 0.05, ez - hz * 1.02 + oz * 2, ex + hx * 1.02 + ox * 2, hh + 0.004, ez + hz * 1.02 + oz * 2, { f: ALL, occ: false, seg: 2 });
        B.decal("decal", [dz ? x0 : ex - dx * 0.2 - 0.06, hh + 0.005, dx ? z0 + CS : ez - dz * 0.2 + 0.06], dz ? [CS, 0, 0] : [0.12, 0, 0], dz ? [0, 0, -0.12] : [0, 0, -CS], 40, { k: "line", col: lineCol == null ? 3 : lineCol });
        // along the open edge: a crate frame (corner posts + a band) on low blocks, a railing on high ones (never on the
        // side a jump pad lands you from)
        const ax = dz ? 1 : 0, az = dx ? 1 : 0, sx = ex - ax * CS / 2, sz = ez - az * CS / 2, px = dx * 0.03, pz = dz * 0.03, th = 0.06;
        const bar = (u0, u1, y0b, y1b) => box(FR, sx + ax * u0 + px - (ax ? 0 : th), y0b, sz + az * u0 + pz - (az ? 0 : th), sx + ax * u1 + px + (ax ? 0 : th), y1b, sz + az * u1 + pz + (az ? 0 : th), { f: ALL, occ: false, seg: 2 });
        if (hh < 2) { for (const u of [0.04, CS / 2 - 0.06, CS - 0.16]) bar(u, u + 0.12, nh, hh - 0.04); bar(0.04, CS - 0.04, nh + (hh - nh) * 0.45, nh + (hh - nh) * 0.45 + 0.12); }
        else if (ch(x + dx, z + dz) !== "^") { for (let u = 0.1; u < CS; u += CS / 3) bar(u, u + 0.06, hh, hh + 1.02); bar(0.04, CS - 0.04, hh + 0.98, hh + 1.04); bar(0.04, CS - 0.04, hh + 0.5, hh + 0.54); } });
      box(side, x0, y0, z0, x0 + CS, hh - 0.02, z0 + CS, { f: fm, seg: 1.3 });
    }
    K.cellsOf("^").forEach(([x, z]) => B.decal("decal", [x * CS + 0.3, 0.006, z * CS + CS - 0.3], [CS - 0.6, 0, 0], [0, 0, -(CS - 0.6)], 60, { k: "ring", col: 0, n: 8, chev: 1 }));
  };
  // ---- lit signs for sites and spawns on a plain wall that looks into them. cols: sign colour index per zone [A, B, blue, red]
  K.signs = (M, cols, v0, ok) => {
    v0 = v0 || 2.2; [["a", "SITE A", M.sites[0], cols[0]], ["b", "SITE B", M.sites[1], cols[1]], ["u", "BLUE TEAM", M.spawns[1], cols[2]], ["r", "RED TEAM", M.spawns[0], cols[3]]].forEach(([k, t, sub, col]) => {
      const zn = { a: "siteA", b: "siteB", u: "blue", r: "red" }[k], good = (q) => q.zone === zn && !q.sign && (ok ? ok(q) : q.kind === "plain");
      const f = faces.find(q => good(q) && q.free) || faces.find(good); if (!f || !sub) return;
      B.fbox(f, "trimBlack", 0.55, v0, 0, 3.45, v0 + 0.8, 0.05, { occ: false, seg: 2 }); B.fdecal(f, "glowHi", 0.6, v0 + 0.05, 3.4, v0 + 0.75, 0.055, 180, { k: "sign", t, sub, col }); f.sign = 1; });
  };
  // paint on the floor: text or a line (px per metre kept low, it is seen from standing height)
  K.floorText = (x0, z0, w, d, t, col, rot) => B.decal("decal", rot ? [x0, 0.006, z0] : [x0, 0.006, z0 + d], rot ? [0, 0, d] : [w, 0, 0], rot ? [w, 0, 0] : [0, 0, -d], 72, { k: "text", t, col: col || 0 });
  // where a tall block stands next to a lower one, close the strip of wall that shows above the lower roof
  K.stepWalls = (matOf) => { for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) { if (!A.solid(x, z)) continue; const h = A.cellH[A.ci(x, z)], x0 = x * CS, z0 = z * CS;
    DIRS.forEach(([dx, dz]) => { const nx = x + dx, nz = z + dz; if (!A.inb(nx, nz) || !A.solid(nx, nz)) return; const nh = A.cellH[A.ci(nx, nz)]; if (nh >= h - 0.01) return; box(matOf(x, z), x0, nh, z0, x0 + CS, h, z0 + CS, { f: dx > 0 ? PX : dx < 0 ? NXb : dz > 0 ? PZ : NZ, occ: false, seg: 2 }); }); } };
  return K;
};
