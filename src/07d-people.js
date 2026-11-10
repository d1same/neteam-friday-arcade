// ---------------------------------------------------------------------------
// Business vs IT: three real scanned people (Grab3D, CC0) dressed in ten looks (Business: three men, two women; IT: five men; the face shape comes from the scan, so variety is skin, hair, glasses and build). A mask texture says which texel is
// jacket, trousers, skin, hair, shirt or shoes; one shared shader recolours each part per look, so every person costs
// the same single draw and program. Neteam logos ride the chest and back, some wear glasses, heads and heights vary.
// Generic office roles only: nobody here is a real person.
// ---------------------------------------------------------------------------
const PPL = {
  // per part [r, g, b, mode] in linear colour: mode 0 keep the scan, 1 new colour with the scan's shading, 2 multiply
  // part order: top (jacket), trousers, skin, hair, shirt, shoes
  LOOKS: {
    b: [ // Business (Blue side in team modes)
      { model: "businessman", role: "CEO", top: [0.05, 0.05, 0.056, 1], bot: [0.05, 0.05, 0.056, 1], hair: [0.3, 0.3, 0.31, 1], glasses: 1, hs: 1.0, ht: 1.02 },
      { model: "businessman", role: "Legal", top: [0.016, 0.016, 0.019, 1], bot: [0.016, 0.016, 0.019, 1], skin: [0.42, 0.3, 0.24, 2], hair: [0.012, 0.01, 0.009, 1], shirt: [0.45, 0.56, 0.74, 1], hs: 1.035, ht: 0.995 },
      { model: "woman", role: "Finance", top: [0.022, 0.036, 0.1, 1], bot: [0.03, 0.03, 0.035, 1], hair: [0.012, 0.01, 0.009, 1], shoes: [0.015, 0.015, 0.016, 1], glasses: 1, hs: 1.0, ht: 1.0 },
      { model: "businessman", role: "Sales", top: [0.26, 0.17, 0.09, 1], bot: [0.045, 0.036, 0.03, 1], skin: [0.92, 0.8, 0.7, 2], hair: [0.38, 0.25, 0.11, 1], shirt: [0.75, 0.74, 0.7, 1], hs: 0.965, ht: 0.975 },
      { model: "woman", role: "HR", top: [0.15, 0.022, 0.035, 1], bot: [0.012, 0.012, 0.014, 1], skin: [0.8, 0.67, 0.57, 2], hair: [0.2, 0.065, 0.028, 1], shoes: [0.06, 0.012, 0.015, 1], hs: 1.0, ht: 1.01 },
    ],
    i: [ // IT (Red side)
      { model: "man", role: "Sysadmin", top: [0.15, 0.15, 0.16, 1], hs: 1.0, ht: 1.0 },
      { model: "man", role: "Network", top: [0.28, 0.045, 0.035, 1], skin: [0.45, 0.33, 0.26, 2], hair: [0.012, 0.01, 0.009, 1], hs: 1.035, ht: 1.02 },
      { model: "man", role: "Cloud", top: [0.03, 0.045, 0.09, 1], bot: [0.02, 0.022, 0.026, 1], skin: [0.97, 0.85, 0.68, 2], hair: [0.008, 0.007, 0.007, 1], shirt: [0.2, 0.21, 0.23, 1], hs: 0.975, ht: 0.97 },
      { model: "man", role: "Developer", top: [0.018, 0.018, 0.02, 1], skin: [1.04, 0.97, 0.94, 2], hair: [0.3, 0.085, 0.03, 1], glasses: 1, hs: 0.965, ht: 0.985 },
      { model: "man", role: "Helpdesk", top: [0.06, 0.11, 0.05, 1], bot: [0.014, 0.014, 0.016, 1], skin: [0.85, 0.72, 0.6, 2], shoes: [0.05, 0.05, 0.055, 1], hs: 1.02, ht: 1.03 },
    ],
  },
  // which look player i wears: in team modes by side (Blue = Business) and place within the side, otherwise alternating
  lookOf(V, i, team) {
    const P = V.g && V.g.pl, q = P && P[i]; let side, n;
    if (team && q) { side = q[2] === 1 ? "b" : "i"; n = 0; for (let j = 0; j < i; j++) if (P[j] && P[j][2] === q[2]) n++; }
    else { side = i % 2 ? "b" : "i"; n = i >> 1; }
    const L = PPL.LOOKS[side][n % 5]; if (!L.id) { PPL.LOOKS.b.forEach((l, k) => { l.id = "b" + k; l.side = "b"; }); PPL.LOOKS.i.forEach((l, k) => { l.id = "i" + k; l.side = "i"; }); }
    return L;
  },
  // one function for every person so three.js builds the program once; each material carries its own uniforms
  _obc(s) {
    const u = this.userData.ppl; s.uniforms.uPMask = u.mask; s.uniforms.uPCol = u.col; s.uniforms.uPMean = u.mean;
    s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D uPMask; uniform vec4 uPCol[6]; uniform float uPMean[6];")
      .replace("#include <map_fragment>", `#include <map_fragment>
      { int pk = int(floor(texture2D(uPMask, vMapUv).r * 255.0 / 36.0 + 0.5)) - 1;
        if (pk >= 0 && pk < 6) { vec4 pc = uPCol[pk];
          if (pc.w > 1.5) diffuseColor.rgb *= pc.rgb;
          else if (pc.w > 0.5) diffuseColor.rgb = pc.rgb * min(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)) / uPMean[pk], 3.0); } }`);
  },
  _key() { return "ppl1"; },
  dress(mt, gl, look) {
    const col = ["top", "bot", "skin", "hair", "shirt", "shoes"].map(k => { const c = look[k]; return new THREE.Vector4(...(c || [1, 1, 1, 0])); });
    mt.userData.ppl = { mask: { value: gl.userData.mask }, col: { value: col }, mean: { value: gl.userData.mean } };
    mt.color.setRGB(1, 1, 1); mt.onBeforeCompile = PPL._obc; mt.customProgramCacheKey = PPL._key; mt.userData.exObc = PPL._obc; mt.userData.exKey = "ppl1";
  },
  // the Neteam mark: an orange square and the name, for the chest; the back adds the side's name under it
  tex(kind) {
    const C = PPL._tx || (PPL._tx = {}); if (C[kind]) return C[kind];
    const back = kind !== "chest", w = 256, h = back ? 128 : 96;
    const t = GFX.tex(w, h, (x) => {
      x.clearRect(0, 0, w, h); x.textBaseline = "middle"; x.textAlign = "left";
      const s = back ? 44 : 42, y0 = back ? 46 : h / 2; x.font = "700 " + s + "px Inter, 'Segoe UI', Arial, sans-serif";
      const tw = x.measureText("NETEAM").width, sq = s * 0.58, gap = s * 0.3, x0 = (w - (sq + gap + tw)) / 2;
      x.fillStyle = "#ff8a3d"; x.fillRect(x0, y0 - sq / 2, sq, sq); x.fillStyle = "#f4f1ea"; x.fillText("NETEAM", x0 + sq + gap, y0 + 2);
      if (back) { x.font = "600 30px 'JetBrains Mono', Consolas, monospace"; x.textAlign = "center"; x.fillStyle = "#ffb27a"; x.fillText(kind === "b" ? "B U S I N E S S" : "I T   T E A M", w / 2, 100); }
    });
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return C[kind] = t;
  },
  // where logos and glasses sit on a model, found once from the mesh in its bind pose (where the stored vertex
  // positions are the figure in metres), kept relative to the bone they ride
  anchors(gl) {
    const U = gl.userData; if (U.anc) return U.anc;
    const T = THREE, sc = gl.scene; sc.updateWorldMatrix(true, true); let mesh = null;
    sc.traverse(o => { if (o.isSkinnedMesh && !mesh) mesh = o; });
    const bn = (n) => sc.getObjectByName(n), wp = (o) => o.getWorldPosition(new T.Vector3());
    const hd = bn("Head"), he = bn("head_end"), hf = bn("headfront"), nk = bn("neck");
    const spines = ["Spine", "Spine01", "Spine02"].map(bn).filter(Boolean), chestB = spines.sort((a, b) => wp(b).y - wp(a).y)[0];
    const fwd = hf && hd ? wp(hf).sub(wp(hd)).setY(0).normalize() : new T.Vector3(0, 0, 1), side = new T.Vector3().crossVectors(new T.Vector3(0, 1, 0), fwd);
    const A = U.anc = {}; if (!mesh || !nk || !chestB || !hd || !he) return A;
    const P = mesh.geometry.attributes.position, v = new T.Vector3(), N = wp(nk), H = wp(hd), E = wp(he), c = wp(chestB);
    // the frontmost (or backmost) point of the body near a given height and sideways offset
    const probe = (y, lat, dy, dl, back) => { let best = null, bf = back ? 1e9 : -1e9;
      for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); if (Math.abs(v.y - y) > dy) continue; const l = v.clone().sub(N).dot(side); if (Math.abs(l - lat) > dl) continue; const f = v.dot(fwd); if (back ? f < bf : f > bf) { bf = f; best = v.clone(); } }
      return best; };
    const local = (bone, p, face, size) => { const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), face), bq = bone.getWorldQuaternion(new T.Quaternion()), s = bone.getWorldScale(new T.Vector3()).x || 1;
      return { bone: bone.name, p: bone.worldToLocal(p.clone()), q: bq.invert().multiply(q), s: size / s }; };
    const yc = c.y + (N.y - c.y) * 0.62, pc = probe(yc, 0.085, 0.02, 0.02, false);
    if (pc) A.chest = local(chestB, pc.addScaledVector(fwd, 0.02), fwd, 0.13);
    const pb = probe(c.y + (N.y - c.y) * 0.45, 0, 0.025, 0.04, true);
    if (pb) A.back = local(chestB, pb.addScaledVector(fwd, -0.014), fwd.clone().negate(), 0.27);
    const ye = H.y + (E.y - H.y) * 0.37, eyes = [-1, 1].map(sd => probe(ye, sd * 0.032, 0.01, 0.01, false));
    if (eyes[0] && eyes[1]) { const m = eyes[0].clone().add(eyes[1]).multiplyScalar(0.5); m.addScaledVector(fwd, Math.max(eyes[0].dot(fwd), eyes[1].dot(fwd)) - m.dot(fwd) + 0.013); m.y = ye; A.eyes = local(hd, m, fwd, 1); }
    return A;
  },
  _glassGeo() {
    if (PPL._gg) return PPL._gg; const T = THREE, parts = [];
    for (const sd of [-1, 1]) { const r = new T.TorusGeometry(0.021, 0.0028, 4, 18); r.scale(1, 0.72, 1); r.translate(sd * 0.032, 0, 0); parts.push(r);
      const arm = new T.BoxGeometry(0.003, 0.003, 0.09); arm.translate(sd * 0.069, 0.004, -0.045); parts.push(arm); const hinge = new T.BoxGeometry(0.018, 0.004, 0.004); hinge.translate(sd * 0.06, 0.004, 0); parts.push(hinge); }
    const br = new T.BoxGeometry(0.022, 0.003, 0.003); br.translate(0, 0.006, 0); parts.push(br);
    // one mesh: join the triangle soups
    const nn = parts.map(p => p.toNonIndexed()), n = nn.reduce((a, p) => a + p.attributes.position.count, 0), P = new Float32Array(n * 3), N = new Float32Array(n * 3); let o = 0;
    nn.forEach(p => { P.set(p.attributes.position.array, o * 3); N.set(p.attributes.normal.array, o * 3); o += p.attributes.position.count; p.dispose(); });
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(P, 3)); g.setAttribute("normal", new T.BufferAttribute(N, 3));
    return PPL._gg = g;
  },
  // logo cards and glasses on one dressed model (m is a clone of gl.scene)
  extras(m, gl, look, F) {
    const T = THREE, A = PPL.anchors(gl), put = (a, obj) => { const b = m.getObjectByName(a.bone); if (!b) return; obj.position.copy(a.p); obj.quaternion.copy(a.q); obj.scale.multiplyScalar(a.s); b.add(obj); };
    const CM = PPL._cm || (PPL._cm = {});
    const card = (kind, w, h) => { const mt = CM[kind] || (CM[kind] = new T.MeshStandardMaterial({ map: PPL.tex(kind), transparent: true, alphaTest: 0.05, roughness: 0.55, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      const g = PPL._pg || (PPL._pg = {}); const k = w + "x" + h; const ms = new T.Mesh(g[k] || (g[k] = new T.PlaneGeometry(w, h)), mt); ms.frustumCulled = false; ms.renderOrder = 2; return ms; };
    if (A.chest) put(A.chest, card("chest", 1, 0.375));
    if (A.back) put(A.back, card(look.side, 1, 0.5));
    if (look.glasses && A.eyes) { const gm = PPL._gm || (PPL._gm = new T.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.35, metalness: 0.3 })); const gs = new T.Mesh(PPL._glassGeo(), gm); gs.frustumCulled = false; put(A.eyes, gs); }
  },
};
