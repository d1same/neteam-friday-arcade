// ======================= weapon models: real firearm proportions, hands and arms, animated parts =======================
// Every gun is built from side-profile outlines (in metres) extruded to thickness, plus lathe-style barrels.
// Model space: muzzle points to -Z, up is +Y, origin at the top of the pistol grip. Parts that move
// (magazine, slide / bolt, pump) are kept in g.userData so the view-model code can animate them.
const GUNS = {
  _m: null,
  mats(T) {
    if (this._m) return this._m;
    const S = (o) => new T.MeshStandardMaterial(o);
    const grain = GFX.tex(64, 64, (x, w, h) => { x.fillStyle = "#808080"; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = 108 + Math.random() * 40 | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } });
    grain.repeat.set(6, 6); const nrm = GFX.normal(grain, 0.6);
    const wood = GFX.tex(128, 64, (x, w, h) => { x.fillStyle = "#6b4226"; x.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { x.strokeStyle = Math.random() < 0.5 ? "rgba(40,22,10,.35)" : "rgba(150,100,60,.25)"; x.lineWidth = 0.6 + Math.random() * 1.6; const y = Math.random() * h; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 8, w * 0.6, y + (Math.random() - 0.5) * 8, w, y + (Math.random() - 0.5) * 6); x.stroke(); } });
    wood.repeat.set(3, 3);
    // scanned cloth and leather from the map texture sets
    const scan = (name, kind, ru, rv, srgb) => { const t = new T.TextureLoader().load((typeof NX !== "undefined" && NX.url ? NX.url("t-" + name + "-" + kind + ".jpg") : "models/t-" + name + "-" + kind + ".jpg")); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(ru, rv); t.anisotropy = 4; if (srgb) t.colorSpace = T.SRGBColorSpace; return t; };
    return this._m = {
      steel: S({ color: 0x2b2e33, metalness: 0.92, roughness: 0.36, normalMap: nrm, normalScale: new T.Vector2(0.25, 0.25) }),
      blued: S({ color: 0x1a1c20, metalness: 0.85, roughness: 0.42, normalMap: nrm, normalScale: new T.Vector2(0.3, 0.3) }),
      bright: S({ color: 0xb9bdc4, metalness: 1, roughness: 0.24 }),
      poly: S({ color: 0x17181b, metalness: 0.05, roughness: 0.72, normalMap: nrm, normalScale: new T.Vector2(0.5, 0.5) }),
      tan: S({ color: 0x8a7350, metalness: 0.05, roughness: 0.75, normalMap: nrm, normalScale: new T.Vector2(0.5, 0.5) }),
      olive: S({ color: 0x4a5138, metalness: 0.1, roughness: 0.7, normalMap: nrm, normalScale: new T.Vector2(0.5, 0.5) }),
      wood: S({ map: wood, color: 0xffffff, metalness: 0, roughness: 0.55 }),
      brass: S({ color: 0xc9a03a, metalness: 1, roughness: 0.3 }),
      lens: S({ color: 0x1a2a55, metalness: 0.9, roughness: 0.05, emissive: 0x223a88, emissiveIntensity: 0.5 }),
      glove: S({ color: 0x33363b, metalness: 0, roughness: 0.78, normalMap: scan("leather", "n", 3, 3), normalScale: new T.Vector2(0.9, 0.9) }),
      knuckle: S({ color: 0x4a4e56, metalness: 0.25, roughness: 0.5 }),
      sleeve: S({ map: scan("fabric", "c", 1, 1, true), color: 0x8f9a8c, metalness: 0, roughness: 0.95, normalMap: scan("fabric", "n", 1, 1), normalScale: new T.Vector2(1.2, 1.2) }),
    };
  },
  // extruded side profile: pts are [forward, up] pairs; th = thickness (left-right)
  ext(T, pts, th, mat, bev = 0.0035, x = 0) {
    const sh = new T.Shape(); pts.forEach(([u, v], i) => i ? sh.lineTo(u, v) : sh.moveTo(u, v)); sh.closePath();
    const b = Math.min(bev, th * 0.3), g = new T.ExtrudeGeometry(sh, { depth: th - b * 2, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, steps: 1 });
    g.translate(0, 0, -(th - b * 2) / 2); g.rotateY(Math.PI / 2); const m = new T.Mesh(g, mat); m.position.x = x; return m;
  },
  cyl(T, r0, r1, u0, u1, v, mat, seg = 16, x = 0) { const g = new T.CylinderGeometry(r1, r0, Math.abs(u1 - u0), seg); g.rotateX(-Math.PI / 2); const m = new T.Mesh(g, mat); m.position.set(x, v, -(u0 + u1) / 2); return m; },
  box(T, du, dv, dx, mat, u, v, x = 0) { const m = new T.Mesh(new T.BoxGeometry(dx, dv, du), mat); m.position.set(x, v, -u); return m; },
  // forearm + gloved hand. Hand at the group's origin, forearm runs along +Z to the elbow.
  // The sleeve is a turned shape with a cuff and a few folds; the glove has a padded back, knuckle guard and a wrist strap.
  arm(T, hex) {
    const M = this.mats(T), g = new T.Group(), h = new T.Group();
    if (!this._armG) {
      const pr = []; for (let k = 0; k <= 22; k++) { const f = k / 22, z = 0.065 + f * 0.47, r = 0.0375 + f * 0.017 + 0.0022 * Math.sin(f * 21) * (0.3 + f) + (f < 0.07 ? 0.0035 : 0); pr.push(new T.Vector2(r, z)); }
      const sl = new T.LatheGeometry(pr, 18); sl.rotateX(Math.PI / 2); const uv = sl.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1.1, uv.getY(i) * 1.9);
      this._armG = { sleeve: sl, back: new T.SphereGeometry(1, 14, 10), fin: new T.CapsuleGeometry(0.0108, 0.03, 3, 8), fin2: new T.CapsuleGeometry(0.01, 0.026, 3, 8), th: new T.CapsuleGeometry(0.0118, 0.04, 3, 8) };
    }
    const A = this._armG, fore = new T.Mesh(A.sleeve, M.sleeve);
    const cuff = new T.Mesh(new T.CylinderGeometry(0.0462, 0.042, 0.052, 20), M.glove); cuff.rotation.x = Math.PI / 2; cuff.position.z = 0.064;
    const strap = new T.Mesh(new T.CylinderGeometry(0.0462, 0.0468, 0.018, 20), M.knuckle); strap.rotation.x = Math.PI / 2; strap.position.z = 0.07;
    const band = new T.Mesh(new T.CylinderGeometry(0.047, 0.049, 0.022, 16), new T.MeshStandardMaterial({ color: new T.Color(hex || "#ff8a3d").multiplyScalar(0.7), roughness: 0.6 })); band.rotation.x = Math.PI / 2; band.position.z = 0.3;
    // fist: palm, padded back of the hand, four curled fingers with a knuckle guard, thumb
    const palm = new T.Mesh(new T.BoxGeometry(0.034, 0.088, 0.084), M.glove); palm.position.set(0, 0, 0.012);
    const back = new T.Mesh(A.back, M.glove); back.scale.set(0.02, 0.046, 0.046); back.position.set(0.012, 0, 0.012);
    const pad = new T.Mesh(new T.BoxGeometry(0.01, 0.062, 0.046), M.knuckle); pad.position.set(0.026, 0.004, 0.016);
    for (let k = 0; k < 4; k++) {
      const y = 0.034 - k * 0.0225, a = new T.Mesh(A.fin, M.glove), b = new T.Mesh(A.fin2, M.glove), kn = new T.Mesh(A.back, M.knuckle);
      a.rotation.x = Math.PI / 2; a.position.set(-0.006, y, -0.048); b.rotation.z = Math.PI / 2; b.position.set(-0.03, y, -0.062);
      kn.scale.set(0.009, 0.0105, 0.012); kn.position.set(0.012, y, -0.034); h.add(a, b, kn);
    }
    const th = new T.Mesh(A.th, M.glove); th.rotation.x = Math.PI / 2 - 0.5; th.position.set(-0.012, 0.052, -0.02);
    h.add(palm, back, pad, th); g.add(fore, cuff, strap, band, h); g.userData.hand = h;
    return g;
  },
  // point an arm: hand at `hand`, forearm toward `elbow` (both in the gun's space), roll around the forearm
  setArm(arm, hand, elbow, roll) {
    const T = THREE, d = GUNS._v || (GUNS._v = new T.Vector3()), q = GUNS._q || (GUNS._q = new T.Quaternion());
    arm.position.set(hand[0], hand[1], hand[2]); d.set(elbow[0] - hand[0], elbow[1] - hand[1], elbow[2] - hand[2]).normalize();
    arm.quaternion.setFromUnitVectors(GUNS._z || (GUNS._z = new T.Vector3(0, 0, 1)), d); q.setFromAxisAngle(GUNS._z, roll || 0); arm.quaternion.multiply(q);
  },
  // ---- the guns. Returns a Group with userData { mag, slide, bolt, pump, muzzle:[x,y,z], port:[x,y,z], lhBase, rhBase, kind }
  build(w0, T, opt = {}) {
    const M = this.mats(T), E = (...a) => this.ext(T, ...a), C = (...a) => this.cyl(T, ...a), B = (...a) => this.box(T, ...a);
    const g = new T.Group(), U = g.userData, id = w0.id, acc = new T.MeshStandardMaterial({ color: new T.Color(w0.col), emissive: new T.Color(w0.col), emissiveIntensity: 0.5, roughness: 0.45 });
    const grp = (...ms) => { const q = new T.Group(); q.add(...ms); g.add(q); return q; };
    const gripPts = (u, v, w, len, rake) => [[u, v], [u + w, v], [u + w - rake, v - len], [u - rake - 0.004, v - len + 0.004]];
    U.kind = "rifle"; U.rh = [0.026, -0.065, 0.035]; U.lh = [0, -0.03, -0.3]; U.lroll = Math.PI / 2;
    if (id === "pistol" || id === "deagle") {
      const big = id === "deagle", s = big ? 1.22 : 1, fr = big ? M.bright : M.poly, sl = big ? M.bright : M.blued;
      U.kind = "pistol";
      g.add(E([[-0.085 * s, 0.0], [0.105 * s, 0.0], [0.105 * s, 0.022], [-0.085 * s, 0.022]], 0.03 * s, fr));           // frame
      g.add(E(gripPts(-0.075 * s, 0.002, 0.052 * s, 0.115 * s, 0.03 * s), 0.031 * s, big ? M.wood : M.poly, 0.006));     // grip
      g.add(E([[-0.022 * s, 0.0], [0.045 * s, 0.0], [0.04 * s, -0.036], [-0.016 * s, -0.036], [-0.016 * s, -0.03], [0.034 * s, -0.03], [0.038 * s, -0.006], [-0.022 * s, -0.006]], 0.012, fr, 0.001)); // trigger guard
      g.add(B(0.006, 0.02, 0.006, M.steel, 0.012 * s, -0.014));                                                           // trigger
      const slide = grp(E(big ? [[-0.09 * s, 0.022], [0.1 * s, 0.022], [0.1 * s, 0.05], [0.02, 0.066], [-0.09 * s, 0.066]] : [[-0.09, 0.022], [0.105, 0.022], [0.105, 0.058], [-0.09, 0.058]], 0.029 * s, sl, 0.003),
        B(0.006, 0.006, 0.004, M.bright, -0.078 * s, (big ? 0.069 : 0.061)), B(0.005, 0.006, 0.003, M.bright, 0.092 * s, big ? 0.053 : 0.061),
        B(0.036 * s, 0.014, 0.0305 * s, M.steel, 0.01, big ? 0.05 : 0.046));
      for (let k = 0; k < 5; k++) slide.add(B(0.003, 0.026, 0.0305 * s, M.steel, -0.08 * s + k * 0.007, 0.042));
      U.slide = slide; g.add(C(0.0075 * s, 0.0075 * s, 0.09 * s, 0.112 * s, 0.045, M.steel, 12));
      U.mag = grp(E(gripPts(-0.066 * s, 0.0, 0.034 * s, 0.122 * s, 0.03 * s), 0.02 * s, M.steel, 0.002));
      g.add(B(0.02, 0.004, 0.0315 * s, acc, 0.07 * s, 0.006));
      U.muzzle = [0, 0.045, -0.115 * s]; U.port = [0.02, 0.055, -0.01]; U.rh = [0.026, -0.06 * s, 0.045 * s]; U.lh = [-0.02, -0.085 * s, 0.03 * s]; U.lroll = 0.9; U.magDrop = [0.03 * s, -1, 0]; U.vm = [0.14, -0.19, -0.56];
    } else if (id === "shotgun") {
      U.kind = "pump";
      g.add(E([[-0.14, 0.0], [0.13, 0.0], [0.13, 0.062], [-0.11, 0.062], [-0.14, 0.04]], 0.04, M.blued));              // receiver
      g.add(E([[-0.14, 0.0], [-0.14, 0.04], [-0.2, 0.03], [-0.44, -0.015], [-0.44, -0.12], [-0.41, -0.125], [-0.26, -0.05], [-0.2, -0.06], [-0.17, -0.11], [-0.13, -0.11], [-0.115, 0.0]], 0.038, M.wood, 0.008)); // stock + grip
      g.add(E([[-0.09, 0.0], [-0.02, 0.0], [-0.025, -0.036], [-0.085, -0.036], [-0.085, -0.03], [-0.031, -0.03], [-0.028, -0.006], [-0.09, -0.006]], 0.012, M.blued, 0.001));
      g.add(C(0.0125, 0.0125, 0.13, 0.66, 0.045, M.blued, 16)); g.add(C(0.015, 0.015, 0.13, 0.56, 0.014, M.blued, 16));     // barrel + tube
      g.add(B(0.012, 0.02, 0.03, M.blued, 0.555, 0.03)); g.add(B(0.006, 0.01, 0.005, M.brass, 0.65, 0.062));
      U.pump = grp(E([[0.24, -0.012], [0.44, -0.012], [0.44, 0.03], [0.24, 0.03]], 0.05, M.wood, 0.01));
      for (let k = 0; k < 7; k++) U.pump.add(B(0.005, 0.03, 0.052, M.blued, 0.265 + k * 0.025, 0.004));
      g.add(B(0.05, 0.006, 0.041, acc, 0.0, 0.03)); g.add(B(0.07, 0.022, 0.006, M.steel, 0.03, 0.035, 0.021));
      U.muzzle = [0, 0.045, -0.67]; U.port = [0.025, 0.04, -0.03]; U.rh = [0.026, -0.07, 0.15]; U.lh = [0, -0.035, -0.34]; U.vm = [0.17, -0.215, -0.54];
    } else if (id === "sniper" || id === "scout") {
      const hv = id === "sniper", stockM = hv ? M.olive : M.poly, bl = hv ? 0.82 : 0.68;
      U.kind = "bolt";
      g.add(E([[-0.42, -0.02], [-0.42, -0.13], [-0.39, -0.135], [-0.25, -0.07], [-0.19, -0.075], [-0.16, -0.12], [-0.12, -0.12], [-0.1, -0.02], [0.02, -0.02], [0.4, -0.006], [0.4, 0.03], [-0.16, 0.03], [-0.22, 0.045], [-0.4, 0.045]], 0.044, stockM, 0.009)); // one-piece stock
      g.add(E([[-0.18, 0.03], [0.14, 0.03], [0.14, 0.066], [-0.18, 0.066]], 0.034, M.blued));
      g.add(C(hv ? 0.013 : 0.011, hv ? 0.0105 : 0.009, 0.14, bl, 0.05, M.blued, 16));
      if (hv) { g.add(C(0.019, 0.019, bl, bl + 0.07, 0.05, M.blued, 12)); for (let k = 0; k < 3; k++) g.add(B(0.008, 0.042, 0.012, M.poly, bl + 0.015 + k * 0.02, 0.05)); }
      // scope: tube, bells, lenses, mounts
      g.add(C(0.016, 0.016, -0.12, 0.2, 0.108, M.blued, 16), C(0.016, 0.026, 0.2, 0.3, 0.108, M.blued, 16), C(0.024, 0.016, -0.2, -0.12, 0.108, M.blued, 16));
      g.add(C(0.0245, 0.0245, 0.298, 0.302, 0.108, M.lens, 16), C(0.022, 0.022, -0.202, -0.198, 0.108, M.lens, 16));
      g.add(B(0.02, 0.03, 0.022, M.blued, -0.03, 0.082), B(0.02, 0.03, 0.022, M.blued, 0.1, 0.082), C(0.012, 0.012, 0.03, 0.05, 0.132, M.blued, 10));
      const tk = new T.Mesh(new T.CylinderGeometry(0.011, 0.011, 0.03, 10), M.blued); tk.rotation.z = Math.PI / 2; tk.position.set(0.028, 0.108, -0.04); g.add(tk);
      const bh = new T.Mesh(new T.CylinderGeometry(0.005, 0.005, 0.05, 8), M.bright); bh.rotation.z = Math.PI / 2 - 0.5; bh.position.set(0.035, 0.04, 0.1);
      const bk = new T.Mesh(new T.SphereGeometry(0.011, 10, 8), M.poly); bk.position.set(0.058, 0.028, 0.1);
      U.bolt = grp(bh, bk, C(0.008, 0.008, -0.17, -0.05, 0.05, M.bright, 10));
      U.mag = grp(E([[0.0, -0.02], [0.075, -0.02], [0.07, -0.075], [0.004, -0.075]], 0.026, M.blued, 0.003));
      g.add(E([[-0.085, -0.02], [-0.015, -0.02], [-0.02, -0.052], [-0.08, -0.052], [-0.08, -0.046], [-0.026, -0.046], [-0.023, -0.026], [-0.085, -0.026]], 0.012, M.blued, 0.001));
      if (hv) { [-1, 1].forEach(sd => { const lg = new T.Mesh(new T.CylinderGeometry(0.005, 0.005, 0.2, 6), M.blued); lg.position.set(sd * 0.03, -0.01, -0.36); lg.rotation.x = 1.25; lg.rotation.z = sd * 0.1; g.add(lg); }); }
      g.add(B(0.06, 0.005, 0.045, acc, 0.2, 0.012));
      U.muzzle = [0, 0.05, -(bl + (hv ? 0.07 : 0))]; U.port = [0.03, 0.055, 0.02]; U.rh = [0.026, -0.085, 0.14]; U.lh = [0, -0.045, -0.26]; U.magDrop = [0, -1, 0]; U.vm = [0.17, -0.225, -0.5];
    } else if (id === "rocket") {
      U.kind = "tube";
      g.add(C(0.055, 0.055, -0.5, 0.42, 0.06, M.olive, 20), C(0.055, 0.07, 0.42, 0.5, 0.06, M.olive, 20), C(0.075, 0.055, -0.58, -0.5, 0.06, M.olive, 20));
      g.add(C(0.058, 0.058, -0.2, -0.16, 0.06, M.blued, 20), C(0.058, 0.058, 0.2, 0.24, 0.06, M.blued, 20), C(0.0575, 0.0575, 0.0, 0.03, 0.06, acc, 20));
      g.add(E(gripPts(-0.03, 0.006, 0.045, 0.11, 0.02), 0.03, M.poly, 0.006), E(gripPts(0.2, 0.006, 0.04, 0.1, 0.01), 0.03, M.poly, 0.006));
      g.add(B(0.07, 0.05, 0.03, M.blued, 0.06, 0.13, -0.05), C(0.014, 0.014, 0.02, 0.1, 0.14, M.lens, 10, -0.05));
      const tip = new T.Mesh(new T.ConeGeometry(0.045, 0.14, 16), new T.MeshStandardMaterial({ color: 0x8a2f1a, roughness: 0.5, metalness: 0.3 })); tip.rotation.x = -Math.PI / 2; tip.position.set(0, 0.06, -0.52);
      U.mag = grp(tip, C(0.044, 0.044, 0.36, 0.46, 0.06, M.bright, 14));
      U.muzzle = [0, 0.06, -0.55]; U.port = null; U.rh = [0.026, -0.06, 0.02]; U.lh = [0, -0.05, -0.22]; U.lroll = 0.5; U.magDrop = [0, 0, -1]; U.vm = [0.2, -0.24, -0.48];
    } else if (id === "laser") {
      U.kind = "laser";
      g.add(E([[-0.14, 0.0], [0.34, 0.0], [0.4, 0.03], [0.4, 0.06], [0.3, 0.085], [-0.1, 0.085], [-0.14, 0.06]], 0.046, M.bright, 0.008));
      g.add(E([[-0.14, 0.0], [-0.14, 0.06], [-0.34, 0.05], [-0.36, -0.07], [-0.33, -0.075], [-0.24, 0.0]], 0.036, M.poly, 0.008));
      g.add(E(gripPts(-0.07, 0.004, 0.048, 0.11, 0.028), 0.03, M.poly, 0.006), E(gripPts(0.2, 0.004, 0.04, 0.085, 0.006), 0.03, M.poly, 0.006));
      g.add(C(0.016, 0.016, 0.4, 0.62, 0.045, M.blued, 16));
      const glow = new T.MeshStandardMaterial({ color: new T.Color(w0.col), emissive: new T.Color(w0.col), emissiveIntensity: 2.4, roughness: 0.3 });
      for (let k = 0; k < 5; k++) { const r = new T.Mesh(new T.TorusGeometry(0.026, 0.006, 8, 20), glow); r.position.set(0, 0.045, -(0.43 + k * 0.04)); g.add(r); }
      g.add(C(0.02, 0.012, 0.62, 0.66, 0.045, M.bright, 16), B(0.3, 0.012, 0.048, glow, 0.12, 0.045), B(0.14, 0.02, 0.02, M.blued, 0.1, 0.095));
      U.mag = grp(E([[0.02, 0.0], [0.11, 0.0], [0.1, -0.06], [0.03, -0.06]], 0.034, glow, 0.004));
      U.muzzle = [0, 0.045, -0.67]; U.port = null; U.rh = [0.026, -0.06, 0.045]; U.lh = [0, -0.07, -0.22]; U.lroll = 0.5; U.vm = [0.17, -0.215, -0.52];
    } else {
      // rifle family: rifle (AK-style, wood), carbine (AR-style, polymer), smg (compact), lmg (belt box + bipod)
      const P = { rifle: { hg: 0.3, bl: 0.6, fm: M.wood, sm: M.wood, mg: [0.05, 0.075, 0.19, 0.055], recv: M.blued },
        carbine: { hg: 0.34, bl: 0.52, fm: M.poly, sm: M.poly, mg: [0.045, 0.062, 0.16, 0.022], recv: M.poly },
        smg: { hg: 0.2, bl: 0.3, fm: M.poly, sm: M.blued, mg: [0.06, 0.032, 0.2, 0.0], recv: M.poly },
        lmg: { hg: 0.36, bl: 0.68, fm: M.poly, sm: M.poly, mg: [0.04, 0.12, 0.1, 0.0], recv: M.blued } }[id] || { hg: 0.3, bl: 0.55, fm: M.poly, sm: M.poly, mg: [0.045, 0.062, 0.16, 0.02], recv: M.poly };
      const smg = id === "smg", lmg = id === "lmg", ak = id === "rifle";
      g.add(E([[-0.14, 0.0], [0.15, 0.0], [0.15, 0.058], [0.02, 0.07], [-0.14, 0.07]], lmg ? 0.05 : 0.04, P.recv));                       // receiver
      g.add(E(gripPts(-0.085, 0.004, 0.046, 0.115, 0.032), 0.03, ak ? M.wood : M.poly, 0.006));                                         // pistol grip
      g.add(E([[-0.04, 0.0], [0.035, 0.0], [0.03, -0.036], [-0.034, -0.036], [-0.034, -0.03], [0.024, -0.03], [0.028, -0.006], [-0.04, -0.006]], 0.012, M.blued, 0.001));
      g.add(B(0.006, 0.02, 0.006, M.steel, 0.0, -0.014));
      // stock
      if (smg) { g.add(B(0.22, 0.008, 0.008, M.blued, -0.25, 0.055, 0.016), B(0.22, 0.008, 0.008, M.blued, -0.25, 0.055, -0.016), B(0.012, 0.11, 0.04, M.poly, -0.36, 0.01)); }
      else g.add(E(ak ? [[-0.14, 0.01], [-0.14, 0.066], [-0.4, 0.04], [-0.41, -0.075], [-0.38, -0.08], [-0.2, 0.0]] : [[-0.14, 0.025], [-0.14, 0.066], [-0.4, 0.066], [-0.4, -0.06], [-0.37, -0.065], [-0.3, 0.02]], 0.036, P.sm, 0.008));
      // handguard, barrel, gas tube, muzzle device, sights
      g.add(E([[0.15, 0.002], [0.15 + P.hg, 0.008], [0.15 + P.hg, 0.062], [0.15, 0.066]], lmg ? 0.05 : 0.044, P.fm, 0.008));
      if (!ak) for (let k = 0; k < Math.floor(P.hg / 0.045); k++) g.add(B(0.022, 0.012, 0.047, M.blued, 0.18 + k * 0.045, 0.036));
      g.add(C(lmg ? 0.014 : 0.0115, lmg ? 0.012 : 0.0095, 0.15, 0.15 + P.bl, 0.04, M.blued, 16));
      if (ak || lmg) g.add(C(0.007, 0.007, 0.15, 0.15 + P.hg + 0.06, 0.066, M.blued, 10), B(0.018, 0.04, 0.02, M.blued, 0.15 + P.hg + 0.06, 0.054));
      if (smg) g.add(C(0.02, 0.02, 0.15 + P.bl - 0.16, 0.15 + P.bl + 0.02, 0.04, M.blued, 16));                                         // suppressor
      else { g.add(C(0.015, 0.015, 0.15 + P.bl - 0.045, 0.15 + P.bl, 0.04, M.blued, 12)); for (let k = 0; k < 2; k++) g.add(B(0.008, 0.008, 0.032, M.poly, 0.15 + P.bl - 0.032 + k * 0.018, 0.04)); }
      g.add(B(0.006, 0.03, 0.006, M.blued, 0.15 + P.bl - 0.07, 0.066), B(0.012, 0.012, 0.018, M.blued, -0.09, 0.078));
      if (!ak) { g.add(B(0.26, 0.01, 0.022, M.blued, 0.03, 0.074)); g.add(B(0.07, 0.035, 0.034, M.blued, 0.02, 0.097), C(0.013, 0.013, -0.02, 0.06, 0.1, M.lens, 12)); } // rail + red dot
      if (lmg) { g.add(B(0.16, 0.012, 0.012, M.blued, 0.2, 0.11), B(0.012, 0.045, 0.012, M.blued, 0.13, 0.09), B(0.012, 0.045, 0.012, M.blued, 0.27, 0.09));           // carry handle
        [-1, 1].forEach(sd => { const lg = new T.Mesh(new T.CylinderGeometry(0.005, 0.005, 0.22, 6), M.blued); lg.position.set(sd * 0.035, -0.06, -0.52); lg.rotation.x = 1.2; lg.rotation.z = sd * 0.12; g.add(lg); }); }
      // magazine (curved for the rifle), charging handle
      const [mu, mw, mh, mc] = P.mg;
      U.mag = grp(lmg ? E([[mu, 0.0], [mu + mw, 0.0], [mu + mw, -mh], [mu, -mh]], 0.075, M.olive, 0.006) : E([[mu, 0.0], [mu + mw, 0.0], [mu + mw + mc * 0.5, -mh * 0.5], [mu + mw + mc, -mh], [mu + mc, -mh], [mu + mc * 0.5, -mh * 0.5]], 0.026, ak ? M.blued : M.steel, 0.003));
      U.bolt = grp(B(0.03, 0.01, 0.016, M.bright, 0.05, 0.05, (lmg ? 0.03 : 0.025)));
      g.add(B(0.05, 0.005, (lmg ? 0.051 : 0.041), acc, -0.05, 0.03));
      U.muzzle = [0, 0.04, -(0.15 + P.bl + (smg ? 0.02 : 0))]; U.port = [0.028, 0.05, -0.05]; U.rh = [0.026, -0.06, 0.07]; U.lh = [0, -0.035, -(0.15 + P.hg * 0.55)]; U.magDrop = [mc * 3, -1, 0];
      U.vm = smg ? [0.16, -0.2, -0.52] : lmg ? [0.18, -0.225, -0.5] : [0.17, -0.215, -0.5];
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = false; });
    U.proc = g.children.slice();
    const sk = opt.lite ? null : { pistol: "pistol", sniper: "sniper", scout: "sniper", deagle: "1911", rifle: "ak", lmg: "ak", carbine: "m4", smg: "mp5", shotgun: "shotgun" }[id];
    if (sk) this.scan(sk).then(sc => { try { if (sc) (sk === "pistol" || sk === "sniper" ? this.fit(g, sc, sk, id, T) : this.fit2(g, sc, GUNS.REAL[id], T)); } catch (e) { console.warn("gun model", id, e); } });
    if (opt.arms !== false) {
      const R = this.arm(T, opt.hex), L = this.arm(T, opt.hex); g.add(R, L); U.armR = R; U.armL = L;
      U.rElbow = [0.13, -0.3, 0.52]; U.lElbow = [-0.3, -0.3, 0.42];
      this.setArm(R, U.rh, U.rElbow, 0); this.setArm(L, U.lh, U.lElbow, U.lroll);
    }
    return g;
  },
  // the gun in another player's hands when the match is crowded: the hand-built gun welded into one mesh with painted-on colours.
  // One draw call and about a thousand triangles, where the detailed model costs up to 18 thousand per player.
  _lg: {}, _lm: null,
  lite(w0, T) {
    let geo = this._lg[w0.id];
    if (!geo) {
      const g = this.build(w0, T, { arms: false, lite: true }), P = [], N = [], C = [], col = new T.Color(), M = this.mats(T);
      g.updateMatrixWorld(true);
      g.traverse(o => { if (!o.isMesh || !o.visible) return; const q = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); q.applyMatrix4(o.matrixWorld);
        col.copy(o.material.color); if (o.material === M.wood) col.set(0x5a3a22); if (o.material.emissiveIntensity && o.material.emissive.getHex()) col.copy(o.material.emissive);
        const p = q.attributes.position, n = q.attributes.normal; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); N.push(n.getX(i), n.getY(i), n.getZ(i)); C.push(col.r, col.g, col.b); } q.dispose(); });
      geo = this._lg[w0.id] = new T.BufferGeometry(); geo.setAttribute("position", new T.Float32BufferAttribute(P, 3)); geo.setAttribute("normal", new T.Float32BufferAttribute(N, 3)); geo.setAttribute("color", new T.Float32BufferAttribute(C, 3)); geo.computeBoundingSphere();
      g.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    }
    const m = new T.Mesh(geo, this._lm || (this._lm = new T.MeshStandardMaterial({ vertexColors: true, metalness: 0.55, roughness: 0.5 }))), grp = new T.Group(); grp.add(m); return grp;
  },
  // photo-scanned CC0 models (Poly Haven, see models/CREDITS.txt) replace the hand-built pistol and bolt rifle once they have loaded
  _sc: {},
  scan(k) {
    if (this._sc[k]) return this._sc[k];
    return this._sc[k] = GFX.track(GFX.operator().then(() => new Promise((res) => { try { new THREE_EXTRAS.GLTFLoader().load("models/gun-" + k + ".glb", (g) => res(g.scene), null, () => res(null)); } catch (e) { res(null); } })).catch(() => null));
  },
  fit(g, src, k, id, T) {
    const U = g.userData; U.proc.forEach(c => { c.visible = false; });
    const root = new T.Group(), part = (n) => { const q = new T.Group(), o = src.getObjectByName(n); if (o) { const c = o.clone(true); c.traverse(m => { if (m.isMesh) { m.castShadow = false; m.frustumCulled = false; } }); q.add(c); } root.add(q); return q; };
    // scans have the barrel along +X: turn it to -Z, then seat the grip on the model origin
    root.rotation.y = Math.PI / 2;
    const C = GUNS.SCAN[id] || GUNS.SCAN[k], hold = new T.Group(); hold.add(root); hold.scale.setScalar(C.s); hold.position.set(0, C.y, C.z); g.add(hold);
    if (k === "pistol") {
      part("pistol_a"); part("hammer_a"); part("trigger_a");
      const sl = part("slide_a"), mg = part("magazine_loaded"); mg.children.forEach(c => c.position.set(C.mag[0], C.mag[1], 0));
      U.slide = GUNS.proxy(T, g, sl, C.s, 0); U.mag = GUNS.proxy(T, g, mg, C.s, 1);
    } else {
      part("rifle_7_62"); part("_trigger"); part("_scope"); if (id === "sniper") part("_wrap");
      U.bolt = GUNS.proxy(T, g, part("bolt_a"), C.s, 0); U.mag = null;
    }
  },
  // textured CC0 models (see models/CREDITS.txt). They come in different orientations and units, so each is measured:
  // the long axis is the barrel, the end farther from the trigger is the muzzle, and the trigger is seated where the hand-built gun had its own
  fit2(g, src, C, T) {
    const U = g.userData; U.proc.forEach(c => { c.visible = false; });
    const m = THREE_EXTRAS.SkeletonUtils.clone(src), V = (x, y, z) => new T.Vector3(x, y, z);
    m.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
    const find = (n) => { let f = null; m.traverse(o => { if (!f && o.name === n) f = o; }); return f; };
    (C.hide || []).forEach(n => { const o = find(n); if (o) o.visible = false; });
    const turn = new T.Group(), hold = new T.Group(); turn.add(m); hold.add(turn); hold.scale.setScalar(C.s);
    hold.updateWorldMatrix(false, true);
    const bb = new T.Box3(), tp = V(0, 0, 0), tr = find(C.trig);
    m.traverse(o => { if (o.isMesh && o.visible) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
    if (tr) tr.getWorldPosition(tp); else bb.getCenter(tp);
    const front = Math.abs(bb.min.z - tp.z) > Math.abs(bb.max.z - tp.z) ? -1 : 1;
    if ((front > 0) !== !!C.flip) turn.rotation.y = Math.PI;
    hold.updateWorldMatrix(false, true); if (tr) tr.getWorldPosition(tp); else { tp.z = -tp.z; tp.x = -tp.x; }
    hold.position.set(-tp.x, C.y - tp.y, C.z - tp.z); g.add(hold); g.updateWorldMatrix(true, true);
    const P = C.parts || {}, px = (n) => { const q = n && find(n); return q ? GUNS.proxy2(T, g, q) : null; };
    U.mag = px(P.mag); U.slide = px(P.slide); U.bolt = px(P.bolt); U.pump = px(P.pump);
  },
  // stand-in the pose code moves in gun space; the offset is converted into the real part's own parent space (bones included)
  proxy2(T, g, q) {
    const p = new T.Group(); g.add(p);
    const rel = new T.Matrix4().copy(g.matrixWorld).invert().multiply(q.parent.matrixWorld).invert(), o0 = new T.Vector3().applyMatrix4(rel), base = q.position.clone(), v = new T.Vector3();
    p.updateMatrix = function () { v.copy(p.position).applyMatrix4(rel).sub(o0); q.position.copy(base).add(v); q.visible = p.visible; T.Object3D.prototype.updateMatrix.call(this); };
    return p;
  },
  REAL: {
    rifle: { s: 1.15, y: -0.03, z: -0.02, trig: "TRIGGER", parts: { mag: "MAGAZINE", bolt: "SLIDE" } },
    lmg: { s: 1.3, y: -0.035, z: -0.02, trig: "TRIGGER", parts: { mag: "MAGAZINE", bolt: "SLIDE" } },
    smg: { s: 1.15, y: -0.03, z: -0.02, flip: 1, trig: "TRIGGER", parts: { mag: "MAGASINE", bolt: "BOLT" } },
    deagle: { s: 1.6, y: -0.035, z: -0.03, trig: "TRIGGER", parts: { mag: "MAGAZINE", slide: "SLIDE" } },
    carbine: { s: 1.15, y: -0.03, z: -0.02, trig: "Trigger", parts: { mag: "Magazine", bolt: "Charging_Handle" } },
    shotgun: { s: 1.1, y: -0.03, z: -0.02, trig: "Trigger", parts: { pump: "Fore_Stock" } },
  },
  // stand-in object the pose code moves (z = back along the barrel, y = down for a magazine); it forwards that to the scanned part
  proxy(T, g, q, s, isMag) {
    const p = new T.Group(); g.add(p);
    const upd = () => { q.position.set(-p.position.z / s, isMag ? p.position.y / s : 0, 0); q.visible = p.visible; };
    p.updateMatrix = function () { upd(); T.Object3D.prototype.updateMatrix.call(this); };
    return p;
  },
  SCAN: { pistol: { s: 1.6, y: -0.06, z: 0.04, mag: [-0.02, -0.01] }, deagle: { s: 1.8, y: -0.075, z: 0.035, mag: [-0.02, -0.01] }, sniper: { s: 1.05, y: -0.025, z: -0.31 }, scout: { s: 0.95, y: -0.02, z: -0.28 } },
  // per-frame pose of the first-person weapon: recoil, slide / bolt, reload with the off hand, pump and bolt cycles
  pose(g, st) {
    const U = g.userData, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const k = st.reload, kick = st.kick || 0, cyc = st.cyc == null ? 1 : st.cyc;
    let lh = U.lh, tilt = 0, dip = 0, magY = 0, magVis = true, slide = 0, pump = 0, bolt = 0;
    const md = U.magDrop || [0, -1, 0];
    if (U.kind === "pistol") slide = Math.sin(Math.min(1, kick) * Math.PI) * 0.03;
    else if (U.bolt && U.kind !== "bolt") bolt = Math.sin(Math.min(1, kick) * Math.PI) * 0.04;
    if (U.kind === "pump" && cyc < 1) pump = Math.sin(ss(0.3, 0.75, cyc) * Math.PI) * 0.09;
    if (U.kind === "bolt" && cyc < 1) { bolt = Math.sin(ss(0.2, 0.7, cyc) * Math.PI) * 0.07; tilt = bolt * 2.2; }
    if (k >= 0) {
      tilt = Math.sin(ss(0, 0.2, k) * Math.PI / 2) * (1 - ss(0.82, 1, k)) * 0.42; dip = Math.sin(k * Math.PI) * 0.03;
      if (U.kind === "pump") { // shells in one at a time, then rack
        const n = 4, f = (k * 0.84 * n) % 1, in0 = k < 0.84; const port = [0.0, -0.03, -0.02];
        lh = in0 ? [port[0], port[1] - 0.09 * (1 - Math.sin(f * Math.PI)), port[2] + 0.05 * (1 - f)] : U.lh; pump = in0 ? 0 : Math.sin(ss(0.86, 0.98, k) * Math.PI) * 0.09;
        if (!in0) lh = [U.lh[0], U.lh[1], U.lh[2] + pump];
      } else if (U.mag) {
        const out = ss(0.16, 0.32, k) - ss(0.5, 0.68, k); magY = out * 0.3; magVis = !(k > 0.3 && k < 0.5);
        const mp = [0.0 + md[0] * magY, -0.11 + md[1] * magY, -0.07 + md[2] * magY * (U.kind === "tube" ? 1 : 0)];
        if (U.kind === "pistol") { mp[0] = 0; mp[1] = -0.16 - magY; mp[2] = 0.05; slide = k < 0.86 ? 0.03 : 0; }
        if (U.kind === "tube") { mp[0] = 0; mp[1] = 0.0; mp[2] = -0.5 - magY * 0.5; }
        const go = ss(0.04, 0.16, k), back = ss(0.7, 0.82, k), w = go * (1 - back);
        lh = [U.lh[0] + (mp[0] - U.lh[0]) * w, U.lh[1] + (mp[1] - U.lh[1]) * w, U.lh[2] + (mp[2] - U.lh[2]) * w];
        if (U.bolt) { const rk = Math.sin(ss(0.84, 0.98, k) * Math.PI); bolt = rk * (U.kind === "bolt" ? 0.07 : 0.05); if (U.kind !== "bolt" && rk > 0) lh = [0.04, 0.04, -0.05 + bolt]; }
      }
    }
    if (U.mag) { U.mag.position.set(md[0] * magY, md[1] * magY, U.kind === "tube" ? magY * 0.6 : 0); U.mag.visible = magVis; }
    if (U.slide) U.slide.position.z = slide; if (U.bolt) U.bolt.position.z = bolt; if (U.pump) U.pump.position.z = pump;
    if (U.armL) { const lp = U.pump && !(k >= 0 && k < 0.84) ? [lh[0], lh[1], U.lh[2] + pump] : lh; GUNS.setArm(U.armL, lp, U.lElbow, U.lroll); }
    return { tilt, dip };
  },
};
