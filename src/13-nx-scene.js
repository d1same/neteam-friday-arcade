// ======================= NX scene: the generated world, on screen =======================
// Loads what a map needs (baked light, scanned materials, sky), builds the meshes and materials, and keeps the things
// that change every frame: shadows of moving objects, light probes for players and props, the sky and the city outside.
const NXS = {
  VS: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }",
  quad(mat) { if (!NXS._q) NXS._q = { cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), geo: new THREE.PlaneGeometry(2, 2) }; const m = new THREE.Mesh(NXS._q.geo, mat); m.frustumCulled = false; return m; },
  blit(renderer, mesh, target) { renderer.setRenderTarget(target || null); renderer.render(mesh, NXS._q.cam); },

  // Builds the static world of a shooter map into `scene`. Resolves with the object the game keeps as F.nx.
  create(renderer, scene, cam, id, M) {
    const T = THREE, tier = NX.tier(), t0 = performance.now();
    NX.prog.n = 0; NX.prog.done = 0;
    const W = NXW.build(id, M, { tex: NX_TEX });
    const S = { W, M, tier, renderer, scene, cam, id, group: new T.Group(), mats: {}, tex: {}, trash: [], frame: 0, baked: false, gone: false };
    S.group.name = "nx-world";
    S.uni = {
      nxDirMap: { value: null }, nxNoise: { value: NX.noise() },
      nxSunDir: { value: W.sun ? new T.Vector3(W.sun.dir[0], W.sun.dir[1], W.sun.dir[2]).normalize() : new T.Vector3(0, 1, 0) },
      nxSunCol: { value: W.sun ? new T.Vector3(W.sun.E[0], W.sun.E[1], W.sun.E[2]) : new T.Vector3() },
      // x: reflection strength per unit of light, y: minimum reflection, z: strength of bump shading from baked light, w: extra reflection in sunlight
      nxK: { value: new T.Vector4(0.2, 0.035, 0.9, 0.45) }, nxHaze: { value: new T.Vector4(0.0013, 0.85, 0, 0) },
      nxShadow: { value: null }, nxShadowM: { value: new T.Matrix4() }, nxShadowP: { value: new T.Vector4(1 / 2048, 1.7, 0, 0.0005) },
      nxProbe: { value: null }, nxProbeP: { value: new T.Vector4(1, 0.5, 0, 0) },
      // room reflections. P: 1 / map size, largest mip, -, on. T: 1 / atlas width, 1 / atlas height
      nxRefl: { value: null }, nxReflI: { value: null }, nxReflD: { value: null }, nxReflP: { value: new T.Vector4(1, 6, 0, 0) }, nxReflT: { value: new T.Vector4(1, 1, 0, 0) },
    };
    const sets = {}; for (const k in W.mats) { const t = W.mats[k].t; if (t && NX_TEX[t]) sets[t] = 1; }
    const city = W.dress.find(d => d.kind === "city"); if (city) NXS.FACADES.forEach(n => { if (NX_TEX[n]) sets[n] = 1; });
    // texture size follows how large one tile is in the world: a 30 cm fabric swatch does not need a 1024 px map
    const sized = (name) => { const s = NX_TEX[name].s || 1, want = s * (tier.i >= 2 ? 620 : 420); return Object.assign({}, tier, { tex: Math.min(tier.tex, want <= 300 ? 256 : want <= 700 ? 512 : 1024) }); };
    const loadSet = (name) => { const t = NX_TEX[name], q = sized(name); return Promise.all([NX.tex(name, "c", q), tier.norm ? NX.tex(name, "n", q) : null, tier.orm ? NX.tex(name, "m", q) : null, t.e ? NX.tex(name, "e", q) : null, t.o ? NX.tex(name, "a", q) : null]).then(([c, n, m, e, a]) => { S.tex[name] = { c, n, m, e, a }; }); };
    const pBin = fetch(NX.url("lm-" + id + ".bin")).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
    return Promise.all([Promise.all(Object.keys(sets).map(loadSet)), pBin, NX.bitmap(NX.url("lm-" + id + "-a.png")), tier.dir ? NX.bitmap(NX.url("lm-" + id + "-b.png")) : null, NXS.loadSky(S), NXD.ready()]).then(([x0, bin, bmA, bmB]) => {
      if (S.gone) return S;
      const baked = bmA ? NXS.parseBin(bin, W) : null; S.baked = !!baked;
      if (baked) { S.lmA = NX.data(bmA); S.lmB = bmB ? NX.data(bmB) : null; }
      else { // no bake for this layout (or it failed to load): even light everywhere, so the game still runs
        console.warn("[nx] no baked lighting for", id, "- using flat light"); const v = Math.round(Math.sqrt(2.4 / NX.LM_SCALE) * 255);
        S.lmA = new T.DataTexture(new Uint8Array([v, v, v, 0, v, v, v, 0, v, v, v, 0, v, v, v, 0]), 2, 2, T.RGBAFormat); S.lmA.needsUpdate = true; S.lmB = null; }
      S.lmA.channel = 1; if (S.lmB) { S.lmB.channel = 1; S.uni.nxDirMap.value = S.lmB; }
      S.trash.push(S.lmA); if (S.lmB) S.trash.push(S.lmB);
      NXS.probeTex(S, baked);
      NXS.buildSky(S);
      const dc = NXD.paint(W); S.decalTex = new T.CanvasTexture(dc); S.decalTex.colorSpace = T.SRGBColorSpace; S.decalTex.anisotropy = tier.aniso; S.trash.push(S.decalTex);
      NXS.makeMats(S);
      NXS.buildMeshes(S, baked ? baked.vl : null);
      if (city) NXS.buildCity(S, city);
      scene.add(S.group);
      NXS.initShadow(S);
      S.update = (dt, t) => NXS.update(S, dt, t); S.adopt = (o, opt) => NXS.adopt(S, o, opt); S.dispose = () => NXS.dispose(S); S.lightAt = (x, z) => NXS.lightAt(S, x, z);
      return NXS.reflBuild(S).catch((e) => { console.warn("[nx] room reflections off:", e && e.message); S.uni.nxReflP.value.w = 0; }).then(() => {
        console.log("[nx] " + id + " ready in " + Math.round(performance.now() - t0) + " ms, tier " + tier.name + (tier.auto ? " (auto, " + NX.gpu() + ")" : "") + ", " + S.group.children.length + " meshes, baked " + S.baked + (S.refl ? ", " + S.refl.n + " room reflections" : ""));
        return S;
      });
    });
  },
  FACADES: ["facade1", "facade2", "facade3", "facade4", "facade5", "facade6"],
  FACADE_M: { facade1: 40, facade2: 36, facade3: 110, facade4: 30, facade5: 18, facade6: 30 },   // metres one tile of each facade picture covers

  // lm-<id>.bin: "NXLM", header length, JSON header, baked vertex light (RGBA per sample), light probes (13 floats each)
  parseBin(buf, W) {
    try {
      if (!buf || buf.byteLength < 16) return null; const dv = new DataView(buf); if (dv.getUint32(0, true) !== 0x4d4c584e) return null;
      const hl = dv.getUint32(4, true), head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, hl)));
      if (head.sig !== W.sig || head.nv !== W.vl.g.length || head.aw !== W.atlas.w || head.ah !== W.atlas.h) { console.warn("[nx] baked light does not match this map version (run tools/bake.js)"); return null; }
      const o = 8 + hl, pn = head.pn; if (buf.byteLength < o + head.nv * 4 + pn * pn * 52) return null;
      return { head, vl: new Uint8Array(buf, o, head.nv * 4), probes: new Float32Array(buf.slice(o + head.nv * 4, o + head.nv * 4 + pn * pn * 52)) };
    } catch (e) { console.warn("[nx] bad bake file", e && e.message); return null; }
  },

  // light probes -> one small float texture (4 blocks side by side: constant term + sun visibility, then x, y, z terms)
  probeTex(S, baked) {
    const T = THREE, h = T.DataUtils.toHalfFloat;
    if (!baked) { const d = new Uint16Array(16); d[0] = d[1] = d[2] = h(2.4); d[3] = h(0); const t = new T.DataTexture(d, 4, 1, T.RGBAFormat, T.HalfFloatType); t.minFilter = t.magFilter = T.LinearFilter; t.needsUpdate = true; S.uni.nxProbe.value = t; S.uni.nxProbeP.value.set(0, 0.5, 0, 0); S.trash.push(t); S.probes = null; return; }
    const pn = baked.head.pn, n = pn * pn, P = baked.probes; let valid = new Uint8Array(n); for (let i = 0; i < n; i++) valid[i] = P[i * 13 + 12] >= 0 ? 1 : 0;
    S.pfree = valid.slice();   // spots that are not inside furniture or walls (used to place the reflection cameras)
    // probes inside walls take the average of their neighbours, so a player hugging a wall is not darkened
    for (let pass = 0; pass < 6; pass++) { const nv = valid.slice(); let ch = 0;
      for (let z = 0; z < pn; z++) for (let x = 0; x < pn; x++) { const i = z * pn + x; if (valid[i]) continue; let c = 0; const acc = new Float32Array(13);
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const qx = x + dx, qz = z + dz; if (qx < 0 || qz < 0 || qx >= pn || qz >= pn) continue; const j = qz * pn + qx; if (!valid[j]) continue; c++; for (let k = 0; k < 13; k++) acc[k] += P[j * 13 + k]; }
        if (c) { for (let k = 0; k < 13; k++) P[i * 13 + k] = acc[k] / c; nv[i] = 1; ch++; } }
      valid = nv; if (!ch) break; }
    const d = new Uint16Array(pn * 4 * pn * 4);
    for (let z = 0; z < pn; z++) for (let x = 0; x < pn; x++) { const i = (z * pn + x) * 13; for (let b = 0; b < 4; b++) { const o = (z * pn * 4 + b * pn + x) * 4; d[o] = h(P[i + b * 3]); d[o + 1] = h(P[i + b * 3 + 1]); d[o + 2] = h(P[i + b * 3 + 2]); d[o + 3] = h(b === 0 ? Math.max(0, P[i + 12]) : 1); } }
    const t = new T.DataTexture(d, pn * 4, pn, T.RGBAFormat, T.HalfFloatType); t.minFilter = t.magFilter = T.LinearFilter; t.wrapS = t.wrapT = T.ClampToEdgeWrapping; t.needsUpdate = true;
    S.uni.nxProbe.value = t; S.uni.nxProbeP.value.set(1 / (pn * baked.head.ps), 0.5 / pn, 0, 0); S.trash.push(t); S.probes = P; S.pn = pn; S.ps = baked.head.ps;
  },
  // light at a spot on the floor plan, for effects drawn without the full material (smoke, blob shadows): [r, g, b, sun]
  lightAt(S, x, z) {
    const P = S.probes; if (!P) return [2.4, 2.4, 2.4, 0];
    const pn = S.pn, fx = Math.max(0, Math.min(pn - 1.001, x / S.ps - 0.5)), fz = Math.max(0, Math.min(pn - 1.001, z / S.ps - 0.5)), x0 = Math.floor(fx), z0 = Math.floor(fz), ax = fx - x0, az = fz - z0, o = [0, 0, 0, 0];
    for (const [dx, dz, w] of [[0, 0, (1 - ax) * (1 - az)], [1, 0, ax * (1 - az)], [0, 1, (1 - ax) * az], [1, 1, ax * az]]) { const i = ((z0 + dz) * pn + x0 + dx) * 13; o[0] += P[i] * w; o[1] += P[i + 1] * w; o[2] += P[i + 2] * w; o[3] += Math.max(0, P[i + 12]) * w; }
    return o;
  },

  // ---- materials: one per entry of the world's material table
  makeMats(S) {
    const T = THREE, W = S.W;
    for (const key in W.mats) {
      const def = W.mats[key], kind = def.kind || "", ts = def.t && S.tex[def.t], info = def.t && NX_TEX[def.t], c = def.c || [1, 1, 1];
      const m = new T.MeshStandardMaterial({ name: "nx:" + key }); m.color.setRGB(c[0], c[1], c[2]);
      const o = { macro: ts && ts.c ? 1 : 0 }; let order = 0;
      if (ts && ts.c) {
        m.map = ts.c; if (ts.n) m.normalMap = ts.n;
        if (ts.m) { m.roughnessMap = m.metalnessMap = m.aoMap = ts.m; m.roughness = def.r == null ? 1 : def.r; m.metalness = def.m == null ? 1 : def.m; }
        else { m.roughness = Math.min(1, Math.max(0.05, info.r * (def.r == null ? 1 : def.r))); m.metalness = Math.min(1, info.m * (def.m == null ? 1 : def.m)); }
        if (ts.e) { m.emissiveMap = ts.e; m.emissive.setRGB(1, 1, 1); }
        if (ts.a) { m.alphaMap = ts.a; m.alphaTest = 0.5; m.side = T.DoubleSide; }
      } else { m.roughness = def.r == null ? 0.6 : def.r; m.metalness = def.m || 0; }
      if (def.e) m.emissive.setRGB(def.e[0], def.e[1], def.e[2]);
      if (kind === "glass") { m.transparent = true; m.opacity = def.op == null ? 0.2 : def.op; m.depthWrite = false; m.side = T.DoubleSide; m.premultipliedAlpha = true; o.glass = 1; o.macro = 0; order = 30; }
      else if (kind === "decal") { m.map = S.decalTex; m.transparent = true; m.depthWrite = false; m.roughness = 0.82; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; order = 10; }
      else if (kind === "glow") { m.map = S.decalTex; m.emissiveMap = S.decalTex; m.color.setRGB(0.55, 0.55, 0.55); m.emissive.setScalar(def.k || 1); m.roughness = 0.2; m.transparent = true; m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; order = 11; }
      NX.patchStatic(m, S, o); m.userData.order = order; S.mats[key] = m;
    }
  },

  // ---- meshes: one per material, big ones split into 16 m tiles so what is behind you is not drawn
  buildMeshes(S, vl) {
    const T = THREE, W = S.W, CH = 16, nC = Math.max(1, Math.ceil(W.size / CH));
    const add = (geo, mat) => { geo.computeBoundingSphere(); const m = new T.Mesh(geo, mat); m.matrixAutoUpdate = false; m.renderOrder = mat.userData.order || 0; m.userData.nxStatic = 1; S.group.add(m); return m; };
    for (const key in W.bat) {
      const b = W.bat[key], mat = S.mats[key]; if (!mat || !b.nv) continue;
      const nxl = new Uint8Array(b.nv * 4); if (vl) for (let i = 0; i < b.nv; i++) { const v = b.vi[i]; if (v < 0) continue; nxl[i * 4] = vl[v * 4]; nxl[i * 4 + 1] = vl[v * 4 + 1]; nxl[i * 4 + 2] = vl[v * 4 + 2]; nxl[i * 4 + 3] = vl[v * 4 + 3]; }
      const nt = b.ix.length / 3;
      if (nt < 1500 || mat.transparent) {
        const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(b.p, 3)); g.setAttribute("normal", new T.BufferAttribute(b.n, 3)); g.setAttribute("uv", new T.BufferAttribute(b.uv, 2)); g.setAttribute("uv1", new T.BufferAttribute(b.lm, 2)); g.setAttribute("nxl", new T.BufferAttribute(nxl, 4, true)); g.setIndex(new T.BufferAttribute(b.ix, 1)); add(g, mat); continue;
      }
      const p = b.p, ix = b.ix, cid = new Uint16Array(nt), cnt = new Uint32Array(nC * nC), map = new Int32Array(b.nv);
      for (let t = 0; t < nt; t++) { const a = ix[t * 3] * 3, c = ix[t * 3 + 1] * 3, d = ix[t * 3 + 2] * 3, cx = Math.min(nC - 1, Math.max(0, ((p[a] + p[c] + p[d]) / 3 / CH) | 0)), cz = Math.min(nC - 1, Math.max(0, ((p[a + 2] + p[c + 2] + p[d + 2]) / 3 / CH) | 0)); cnt[cid[t] = cz * nC + cx]++; }
      for (let c = 0; c < nC * nC; c++) {
        if (!cnt[c]) continue; map.fill(-1); const ni = new Uint32Array(cnt[c] * 3), src = []; let k = 0;
        for (let t = 0; t < nt; t++) { if (cid[t] !== c) continue; for (let j = 0; j < 3; j++) { const v = ix[t * 3 + j]; let q = map[v]; if (q < 0) { q = map[v] = src.length; src.push(v); } ni[k++] = q; } }
        const n = src.length, P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), L = new Float32Array(n * 2), X = new Uint8Array(n * 4);
        for (let i = 0; i < n; i++) { const v = src[i]; P[i * 3] = p[v * 3]; P[i * 3 + 1] = p[v * 3 + 1]; P[i * 3 + 2] = p[v * 3 + 2]; N[i * 3] = b.n[v * 3]; N[i * 3 + 1] = b.n[v * 3 + 1]; N[i * 3 + 2] = b.n[v * 3 + 2]; U[i * 2] = b.uv[v * 2]; U[i * 2 + 1] = b.uv[v * 2 + 1]; L[i * 2] = b.lm[v * 2]; L[i * 2 + 1] = b.lm[v * 2 + 1]; X[i * 4] = nxl[v * 4]; X[i * 4 + 1] = nxl[v * 4 + 1]; X[i * 4 + 2] = nxl[v * 4 + 2]; X[i * 4 + 3] = nxl[v * 4 + 3]; }
        const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(P, 3)); g.setAttribute("normal", new T.BufferAttribute(N, 3)); g.setAttribute("uv", new T.BufferAttribute(U, 2)); g.setAttribute("uv1", new T.BufferAttribute(L, 2)); g.setAttribute("nxl", new T.BufferAttribute(X, 4, true)); g.setIndex(new T.BufferAttribute(ni, 1)); add(g, mat);
      }
    }
  },

  // ---- sky: the photo you see, and a small HDR copy of it for reflections
  loadSky(S) {
    const W = S.W, name = W.sky && W.sky.name; if (!name || !NX_SKY[name]) return Promise.resolve();
    const small = S.tier.sky < 4096;
    return Promise.all([NX.bitmap(NX.url("sky-" + name + ".jpg"), Object.assign({ imageOrientation: "flipY" }, small ? { resizeWidth: 2048, resizeHeight: 1024, resizeQuality: "medium" } : {})), NX.bitmap(NX.url("sky-" + name + "-env.png"), { imageOrientation: "flipY" })]).then(([jpg, env]) => { S.skyBm = jpg; S.envBm = env; });
  },
  buildSky(S) {
    const T = THREE, W = S.W, sk = W.sky && NX_SKY[W.sky.name]; if (!sk) return;
    const lumE = sk.e[0] * 0.2126 + sk.e[1] * 0.7152 + sk.e[2] * 0.0722, skyK = (W.sky.E || 2) / lumE * (W.sky.k || 1);
    // turn the photo so its sun sits where the map's sun is
    const off = W.sun ? (Math.atan2(-sk.sun[2], -sk.sun[0]) - Math.atan2(-W.sun.dir[2], -W.sun.dir[0])) / (2 * Math.PI) : 0;
    S.skyK = skyK;
    if (S.envBm) {
      const src = NX.toTex(S.envBm, true); src.minFilter = src.magFilter = T.NearestFilter; src.generateMipmaps = false; src.wrapS = T.RepeatWrapping; src.wrapT = T.ClampToEdgeWrapping; src.colorSpace = T.NoColorSpace;
      const rt = new T.WebGLRenderTarget(S.tier.env * 4, S.tier.env * 2, { type: T.HalfFloatType, depthBuffer: false, magFilter: T.LinearFilter, minFilter: T.LinearFilter });
      const mat = new T.ShaderMaterial({ uniforms: { t: { value: src }, p: { value: new T.Vector2(off, skyK) } }, vertexShader: NXS.VS, depthTest: false, depthWrite: false,
        fragmentShader: "uniform sampler2D t; uniform vec2 p; varying vec2 vUv; void main(){ vec4 e = texture2D( t, vec2( vUv.x + p.x, vUv.y ) ); gl_FragColor = vec4( e.rgb * 255.0 * exp2( floor( e.a * 255.0 + 0.5 ) - 136.0 ) * p.y, 1.0 ); }" });
      const old = S.renderer.getRenderTarget(); NXS.blit(S.renderer, NXS.quad(mat), rt); S.renderer.setRenderTarget(old);
      rt.texture.mapping = T.EquirectangularReflectionMapping;
      const pm = new T.PMREMGenerator(S.renderer), envRT = pm.fromEquirectangular(rt.texture); pm.dispose(); rt.dispose(); src.dispose(); mat.dispose();
      S.env = envRT.texture; S.scene.environment = S.env; S.trash.push(envRT);
    }
    if (S.skyBm) {
      const tex = NX.toTex(S.skyBm, true); tex.minFilter = tex.magFilter = T.LinearFilter; tex.generateMipmaps = false; tex.wrapS = T.RepeatWrapping; tex.wrapT = T.ClampToEdgeWrapping; tex.colorSpace = T.NoColorSpace; S.trash.push(tex);
      const sunC = W.sun ? W.sun.E : [0, 0, 0], mx = Math.max(sunC[0], sunC[1], sunC[2], 1e-6), ang = W.sun ? (W.sun.ang || 0.03) : 0.03, sd = W.sun && W.sun.disc !== undefined ? W.sun.disc : 1;
      const mat = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, uniforms: { tSky: { value: tex }, uP: { value: new T.Vector4(off, skyK / sk.expo, 0, 0) }, uSunDir: S.uni.nxSunDir, uSunCol: { value: new T.Vector3(sunC[0] / mx, sunC[1] / mx, sunC[2] / mx) }, uSunP: { value: new T.Vector4(Math.cos(ang * 0.62), Math.cos(ang * 0.5), 46 * sd, 0.55 * sd) } },
        vertexShader: "varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * vec4( mat3( viewMatrix ) * position, 1.0 ); gl_Position = p.xyww; }",
        fragmentShader: `uniform sampler2D tSky; uniform vec4 uP, uSunP; uniform vec3 uSunDir, uSunCol; varying vec3 vDir;
void main(){ vec3 d = normalize( vDir );
  vec2 uv = vec2( atan( d.z, d.x ) * 0.15915494 + 0.5 + uP.x, 0.5 + asin( clamp( d.y, -1.0, 1.0 ) ) * 0.31830989 );
  vec3 t = pow( texture2D( tSky, uv ).rgb, vec3( 2.2 ) ); vec3 c = t / ( 1.0 - 0.6 * t ) * uP.y;
  float cs = max( dot( d, uSunDir ), 0.0 );
  c += uSunCol * ( smoothstep( uSunP.x, uSunP.y, cs ) * uSunP.z + ( pow( cs, 900.0 ) * 2.2 + pow( cs, 90.0 ) * 0.5 + pow( cs, 12.0 ) * 0.12 ) * uSunP.w );
  gl_FragColor = vec4( c, 1.0 ); }` });
      const sky = new T.Mesh(new T.SphereGeometry(1, 32, 16), mat); sky.frustumCulled = false; sky.renderOrder = 1000; sky.userData.nxStatic = 1; sky.name = "nx-sky"; S.sky = sky; S.group.add(sky);
    }
  },

  // ---- the city beyond the terrace: towers on a street grid far below, lit by the same sun, fading into the evening haze
  buildCity(S, d) {
    const T = THREE, W = S.W, size = W.size, r = NXW.rng(NXW.strSeed(W.id + ":city")), base = -(d.floor || 30) * 3.7, sides = d.sides || [];
    const names = NXS.FACADES.filter(n => S.tex[n] && S.tex[n].c); if (!names.length) return;
    const mk = () => ({ p: [], n: [], uv: [], l: [], ix: [] }), B = names.map(mk), roof = mk(), lamp = mk();
    const skyE = (W.sky && W.sky.E) || 2, enc = (e) => Math.round(Math.sqrt(Math.min(1, Math.max(0, e) / NX.LM_SCALE)) * 255), sunAt = (y) => { const k = Math.max(0, Math.min(1, (y + 78) / 60)); return k * k * (3 - 2 * k); };
    const K0 = W.charts[0], bu = (K0.x + 2) / W.atlas.w, bv = (K0.y + 2) / W.atlas.h; S.blackUv = [bu, bv];
    // a vertical strip of wall from y0 to y1 (split where the evening shadow line runs so the lit tops read correctly)
    const wall = (b, x0, z0, x1, z1, y0, y1, nx, nz, ts, u0) => {
      const len = Math.hypot(x1 - x0, z1 - z0), ys = [y0]; for (const q of [-78, -48, -18]) if (q > y0 + 4 && q < y1 - 4) ys.push(q); ys.push(y1);
      const v0 = b.p.length / 3; ys.forEach((y) => { const e = skyE * 0.5 * (0.22 + 0.78 * Math.max(0, Math.min(1, (y - base) / 110))), s = sunAt(y); for (const [x, z, u] of [[x0, z0, u0], [x1, z1, u0 + len / ts]]) { b.p.push(x, y, z); b.n.push(nx, 0, nz); b.uv.push(u, (y - base) / ts); b.l.push(enc(e * 0.86), enc(e * 0.93), enc(e * 1.06), Math.round(s * 255)); } });
      for (let i = 0; i < ys.length - 1; i++) { const a = v0 + i * 2; b.ix.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    };
    const flat = (b, x0, z0, x1, z1, y, e, s) => { const v0 = b.p.length / 3; for (const [x, z] of [[x0, z1], [x1, z1], [x1, z0], [x0, z0]]) { b.p.push(x, y, z); b.n.push(0, 1, 0); b.uv.push(x / 8, z / 8); b.l.push(enc(e * 0.86), enc(e * 0.93), enc(e * 1.06), Math.round(s * 255)); } b.ix.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3); };
    const box = (b, x0, z0, x1, z1, y0, y1, ts) => { wall(b, x0, z1, x1, z1, y0, y1, 0, 1, ts, x0 / ts); wall(b, x1, z1, x1, z0, y0, y1, 1, 0, ts, -z1 / ts); wall(b, x1, z0, x0, z0, y0, y1, 0, -1, ts, -x1 / ts); wall(b, x0, z0, x0, z1, y0, y1, -1, 0, ts, z0 / ts); };
    const PITCH = 64, c0 = size / 2, R = 980;
    for (let j = -16; j <= 16; j++) for (let i = -16; i <= 16; i++) {
      const q = [r(), r(), r(), r(), r(), r(), r()], bx = c0 + i * PITCH + (q[0] - 0.5) * 8, bz = c0 + j * PITCH + (q[1] - 0.5) * 8;
      const out = (sides.includes(0) && bx < -30) || (sides.includes(1) && bx > size + 30) || (sides.includes(2) && bz < -30) || (sides.includes(3) && bz > size + 30), dist = Math.hypot(bx - c0, bz - c0);
      if (!out || dist > R) continue;
      const w = 22 + q[2] * 22, dp = 22 + q[3] * 22, tall = q[4] < 0.2 && dist > 150, h = tall ? 165 + q[5] * 150 : 46 + q[5] * q[5] * 92, fi = Math.floor(q[6] * names.length) % names.length, ts = NXS.FACADE_M[names[fi]] || 30;
      const x0 = bx - w / 2, x1 = bx + w / 2, z0 = bz - dp / 2, z1 = bz + dp / 2, top = base + h;
      box(B[fi], x0, z0, x1, z1, base, top, ts); flat(roof, x0, z0, x1, z1, top, skyE, sunAt(top));
      // a set-back crown or plant room on most roofs, a red aviation light on the tall ones
      if (q[4] > 0.45) { const m = 3 + q[2] * 4, ch = 3 + q[3] * (tall ? 16 : 5); box(B[fi], x0 + m, z0 + m, x1 - m, z1 - m, top, top + ch, ts); flat(roof, x0 + m, z0 + m, x1 - m, z1 - m, top + ch, skyE, sunAt(top + ch)); if (tall) { const v0 = lamp.p.length / 3, s = 0.9, y = top + ch + 1.2; for (const [ax, az] of [[-s, -s], [s, -s], [s, s], [-s, s]]) { lamp.p.push(bx + ax, y, bz + az); lamp.n.push(0, 1, 0); lamp.uv.push(0, 0); lamp.l.push(0, 0, 0, 0); } for (const [ax, az] of [[-s, -s], [s, -s], [s, s], [-s, s]]) { lamp.p.push(bx + ax, y + 1.8, bz + az); lamp.n.push(0, 1, 0); lamp.uv.push(0, 0); lamp.l.push(0, 0, 0, 0); } for (let f = 0; f < 4; f++) { const a = v0 + f, b2 = v0 + (f + 1) % 4; lamp.ix.push(a, b2, b2 + 4, a, b2 + 4, a + 4); } } }
    }
    // streets far below: one dark slab, hazed like everything else
    flat(roof, c0 - 1400, c0 - 1400, c0 + 1400, c0 + 1400, base, skyE * 0.25, 0);
    const mesh = (b, mat) => { if (!b.ix.length) return; const g = new T.BufferGeometry(), n = b.p.length / 3, l = new Float32Array(n * 2); for (let i = 0; i < n; i++) { l[i * 2] = bu; l[i * 2 + 1] = bv; }
      g.setAttribute("position", new T.BufferAttribute(new Float32Array(b.p), 3)); g.setAttribute("normal", new T.BufferAttribute(new Float32Array(b.n), 3)); g.setAttribute("uv", new T.BufferAttribute(new Float32Array(b.uv), 2)); g.setAttribute("uv1", new T.BufferAttribute(l, 2)); g.setAttribute("nxl", new T.BufferAttribute(new Uint8Array(b.l), 4, true)); g.setIndex(new T.BufferAttribute(new Uint32Array(b.ix), 1)); g.computeBoundingSphere();
      const m = new T.Mesh(g, mat); m.matrixAutoUpdate = false; m.userData.nxStatic = 1; m.frustumCulled = false; m.renderOrder = 900; S.group.add(m); };
    names.forEach((n, i) => { const ts = S.tex[n], info = NX_TEX[n], m = new T.MeshStandardMaterial({ name: "nx:city:" + n, map: ts.c }); if (ts.n) m.normalMap = ts.n; if (ts.m) { m.roughnessMap = m.metalnessMap = ts.m; m.roughness = 1; m.metalness = 1; } else { m.roughness = Math.max(0.1, info.r); m.metalness = info.m; }
      if (ts.e) { m.emissiveMap = ts.e; { const k = d.em || 1; m.emissive.setRGB(2.6 * k, 2.1 * k, 1.4 * k); } } NX.patchStatic(m, S, { haze: 1, noShadow: 1, noDir: 1, macro: 0 }); S.mats["city:" + n] = m; mesh(B[i], m); });
    const rm = new T.MeshStandardMaterial({ name: "nx:city:roof", color: new T.Color(0.11, 0.115, 0.125), roughness: 0.9 }); NX.patchStatic(rm, S, { haze: 1, noShadow: 1, noDir: 1, macro: 0 }); S.mats["city:roof"] = rm; mesh(roof, rm);
    const lm = new T.MeshStandardMaterial({ name: "nx:city:lamp", color: 0x000000, emissive: new T.Color(26, 1.2, 0.8), side: T.DoubleSide }); NX.patchStatic(lm, S, { haze: 1, noShadow: 1, noDir: 1, macro: 0 }); S.mats["city:lamp"] = lm; mesh(lamp, lm);
  },

  // ---- room reflections. The floor plan is cut into rectangles (rooms, corridor runs), largest first. Each gets a small cube
  // picture of the finished static world, blurred for every roughness and stored as one tile of an atlas texture.
  reflPlan(S) {
    const W = S.W, G = W.G, CS = W.CS || 4, rows = S.M.rows, N = S.tier.reflN, ceil = W.cell.ceilY;
    const open = (x, z) => x >= 0 && z >= 0 && x < G && z < G && rows[z][x] !== "#";
    const own = new Int16Array(G * G).fill(-1), rects = [];
    while (rects.length < N) { let best = null;
      for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) { if (!open(x, z) || own[z * G + x] >= 0) continue; let maxW = G;
        for (let h = 1; z + h <= G; h++) { let w = 0; while (w < maxW && open(x + w, z + h - 1) && own[(z + h - 1) * G + x + w] < 0) w++; if (!w) break; maxW = w; const sc = w * h + Math.min(w, h) * 0.5; if (!best || sc > best.sc) best = { x, z, w, h, sc }; } }
      if (!best) break; for (let z = best.z; z < best.z + best.h; z++) for (let x = best.x; x < best.x + best.w; x++) own[z * G + x] = rects.length; rects.push(best); }
    if (!rects.length) return null;
    // every other open cell joins the nearest room on foot, then walls take the room they face
    let q = []; for (let i = 0; i < G * G; i++) if (own[i] >= 0) q.push(i);
    while (q.length) { const nq = []; for (const i of q) { const x = i % G, z = (i / G) | 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Z = z + dz; if (open(X, Z) && own[Z * G + X] < 0) { own[Z * G + X] = own[i]; nq.push(Z * G + X); } } } q = nq; }
    for (let pass = 0; pass < G; pass++) { let ch = 0; const prev = own.slice();
      for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) { if (prev[z * G + x] >= 0) continue; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const X = x + dx, Z = z + dz; if (X >= 0 && Z >= 0 && X < G && Z < G && prev[Z * G + X] >= 0) { own[z * G + x] = prev[Z * G + X]; ch++; break; } } }
      if (!ch) break; }
    const probes = rects.map((r) => {
      let top = Infinity; for (let z = r.z; z < r.z + r.h; z++) for (let x = r.x; x < r.x + r.w; x++) top = Math.min(top, ceil[z * G + x]);
      const sky = !(top < 1e3); if (sky) top = 60;
      let px = (r.x + r.w / 2) * CS, pz = (r.z + r.h / 2) * CS; const py = sky ? 1.6 : Math.min(1.6, top * 0.5);
      // stand the camera on the free light-probe spot nearest the middle, so it never ends up inside a desk or a rack
      if (S.pfree) { const pn = S.pn, ps = S.ps; let bd = 1e9, bx = px, bz = pz;
        for (let j = Math.floor(r.z * CS / ps); j < Math.ceil((r.z + r.h) * CS / ps); j++) for (let i = Math.floor(r.x * CS / ps); i < Math.ceil((r.x + r.w) * CS / ps); i++) { if (i < 0 || j < 0 || i >= pn || j >= pn || !S.pfree[j * pn + i]) continue; const x = (i + 0.5) * ps, z = (j + 0.5) * ps, d = (x - px) * (x - px) + (z - pz) * (z - pz); if (d < bd) { bd = d; bx = x; bz = z; } }
        px = bx; pz = bz; }
      const L = S.lightAt(px, pz);
      return { p: [px, py, pz], b0: [r.x * CS, 0, r.z * CS], b1: [(r.x + r.w) * CS, top, (r.z + r.h) * CS], e: L[0] * 0.2126 + L[1] * 0.7152 + L[2] * 0.0722 };
    });
    return { probes, own, G };
  },
  async reflBuild(S) {
    const T = THREE, tier = S.tier, r = S.renderer; if (!tier.refl || !tier.reflN || !r.capabilities.isWebGL2) return;
    const plan = NXS.reflPlan(S); if (!plan) return;
    const P = plan.probes, n = P.length, G = plan.G, size = tier.refl, tw = 3 * Math.max(size, 112), th = 4 * size, cols = Math.min(n, Math.max(1, Math.floor(4096 / tw))), rws = Math.ceil(n / cols);
    NX.prog.n += n;
    const atlas = new T.WebGLRenderTarget(cols * tw, rws * th, { type: T.HalfFloatType, depthBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter, generateMipmaps: false });
    atlas.scissorTest = true;
    const cube = new T.WebGLCubeRenderTarget(size, { type: T.HalfFloatType, generateMipmaps: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter }), cc = new T.CubeCamera(0.08, 1700, cube);
    const pm = new T.PMREMGenerator(r), copy = new T.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: NXS.VS, fragmentShader: "uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = vec4( min( texture2D( t, vUv ).rgb, vec3( 4000.0 ) ), 1.0 ); }", depthTest: false, depthWrite: false }), cq = NXS.quad(copy);
    const sunP = S.sky ? S.sky.material.uniforms.uSunP.value : null, sz = sunP ? sunP.z : 0, sw = sunP ? sunP.w : 0; if (sunP) { sunP.z = 0; sunP.w = 0; }   // the sun itself is a real light; its mirror image would count twice
    const oldT = r.getRenderTarget(), oldAC = r.autoClear;
    const dat = new Float32Array(n * 16);
    try {
      for (let i = 0; i < n; i++) {
        if (S.gone) break;
        const q = P[i], ox = (i % cols) * tw, oy = Math.floor(i / cols) * th;
        cc.position.set(q.p[0], q.p[1], q.p[2]); cc.update(r, S.scene);
        const f = pm.fromCubemap(cube.texture);
        copy.uniforms.t.value = f.texture; atlas.viewport.set(ox, oy, tw, th); atlas.scissor.set(ox, oy, tw, th); r.autoClear = false; NXS.blit(r, cq, atlas); r.autoClear = oldAC; f.dispose();
        dat.set([q.p[0], q.p[1], q.p[2], ox, q.b0[0], q.b0[1], q.b0[2], oy, q.b1[0], q.b1[1], q.b1[2], q.e, 0, 0, 0, 0], i * 16);
        NX.prog.done++;
        if (i % 2 === 1) { r.setRenderTarget(oldT); await new Promise(res => setTimeout(res, 0)); }
      }
    } finally { r.setRenderTarget(oldT); r.autoClear = oldAC; if (sunP) { sunP.z = sz; sunP.w = sw; } pm.dispose(); cube.dispose(); copy.dispose(); }
    if (S.gone) { atlas.dispose(); return; }
    const dt = new T.DataTexture(dat, 4, n, T.RGBAFormat, T.FloatType); dt.minFilter = dt.magFilter = T.NearestFilter; dt.generateMipmaps = false; dt.needsUpdate = true;
    const id8 = new Uint8Array(G * G * 4); for (let i = 0; i < G * G; i++) id8[i * 4] = Math.max(0, plan.own[i]);
    const it = new T.DataTexture(id8, G, G, T.RGBAFormat); it.minFilter = it.magFilter = T.NearestFilter; it.generateMipmaps = false; it.needsUpdate = true;
    S.uni.nxRefl.value = atlas.texture; S.uni.nxReflI.value = it; S.uni.nxReflD.value = dt;
    S.uni.nxReflP.value.set(1 / (G * (S.W.CS || 4)), Math.log2(size), 0, 1); S.uni.nxReflT.value.set(1 / (cols * tw), 1 / (rws * th), 0, 0);
    S.refl = { n, atlas, plan }; S.trash.push(atlas, dt, it);
  },

  // ---- shadows of moving things in the sun: a depth picture taken from the sun, re-centred on the player every frame
  initShadow(S) {
    const T = THREE, sz = S.tier.shadow; if (!sz || !S.W.sun) return;
    const rt = new T.WebGLRenderTarget(sz, sz, { format: T.RedFormat, type: T.UnsignedByteType, depthBuffer: true, minFilter: T.NearestFilter, magFilter: T.NearestFilter, generateMipmaps: false });
    rt.depthTexture = new T.DepthTexture(sz, sz, T.UnsignedIntType);
    const R = 24, cam = new T.OrthographicCamera(-R, R, R, -R, 1, 220); cam.layers.set(2);
    S.shadow = { rt, cam, R, sz, mat: new T.MeshBasicMaterial({ colorWrite: false, fog: false, side: T.DoubleSide }), v: new T.Vector3(), a: new T.Vector3(), b: new T.Vector3() };
    S.uni.nxShadow.value = rt.depthTexture; S.uni.nxShadowP.value.set(1 / sz, 1.7, 0, 0.0007); S.trash.push(rt, S.shadow.mat);
  },
  shadowPass(S) {
    const sh = S.shadow, r = S.renderer, cam = S.cam, L = sh.cam, sun = S.uni.nxSunDir.value, v = sh.v;
    cam.getWorldDirection(v); const wp = cam.getWorldPosition(sh.a), cx = wp.x + v.x * sh.R * 0.5, cz = wp.z + v.z * sh.R * 0.5;
    L.position.set(cx + sun.x * 110, 1 + sun.y * 110, cz + sun.z * 110); L.up.set(0, 1, 0); L.lookAt(cx, 1, cz); L.updateMatrixWorld(true);
    // move in whole texels so shadow edges do not shimmer when the player walks
    const e = L.matrixWorld.elements, tx = 2 * sh.R / sh.sz, px = L.position.x * e[0] + L.position.y * e[1] + L.position.z * e[2], py = L.position.x * e[4] + L.position.y * e[5] + L.position.z * e[6], dx = Math.round(px / tx) * tx - px, dy = Math.round(py / tx) * tx - py;
    L.position.x += e[0] * dx + e[4] * dy; L.position.y += e[1] * dx + e[5] * dy; L.position.z += e[2] * dx + e[6] * dy; L.updateMatrixWorld(true);
    const old = r.getRenderTarget(), om = S.scene.overrideMaterial, bg = S.scene.background; S.scene.overrideMaterial = sh.mat; S.scene.background = null;
    r.setRenderTarget(sh.rt); r.clear(); r.render(S.scene, L); S.scene.overrideMaterial = om; S.scene.background = bg; r.setRenderTarget(old);
    S.uni.nxShadowM.value.multiplyMatrices(L.projectionMatrix, L.matrixWorldInverse); S.uni.nxShadowP.value.z = 1;
  },

  // give everything that is not part of the static world the probe lighting (and a place in the shadow pass)
  adopt(S, obj, opt) {
    const cast = S.shadow && opt && opt.cast;
    obj.traverse(o => { if (!o.isMesh || o.userData.nxStatic) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) if (m && m.isMeshStandardMaterial && !m.userData.nx) NX.patchDynamic(m, S); if (cast) o.castShadow = true; if (S.shadow && o.castShadow && !o.userData.nxCast) { o.layers.enable(2); o.userData.nxCast = 1; } });
  },
  update(S, dt, t) {
    if (S.gone) return; S.frame++;
    if (S.frame % 24 === 1) NXS.adopt(S, S.scene);   // catches anything the game created since the last look (new props, effects, late models)
    if (S.shadow && (S.tier.shadow >= 2048 || (S.frame & 1))) NXS.shadowPass(S);
  },
  dispose(S) {
    S.gone = true;
    S.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    for (const k in S.mats) S.mats[k].dispose();
    S.trash.forEach(x => { try { x.dispose(); } catch (e) { } });
    // scanned textures: free the GPU copies and the decoded pictures (the browser's HTTP cache keeps the files for the next game)
    for (const k in NX._tc) NX._tc[k].then(tx => { if (!tx) return; try { tx.dispose(); if (tx.image && tx.image.close) tx.image.close(); } catch (e) { } });
    NX._tc = {}; [S.skyBm, S.envBm].forEach(b => { try { if (b && b.close) b.close(); } catch (e) { } });
  },
};
