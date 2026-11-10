// ======================= shared 3D graphics helpers: post-processing (bloom + grade), procedural PBR textures =======================
const GFX = {
  // animated CC0 "operator" character (Quaternius robot via the three.js examples), loaded on demand
  // CC0 HDR environment (Poly Haven, via @pmndrs/assets) for realistic image-based lighting and reflections
  hdri(renderer, name) {
    GFX._hd = GFX._hd || {};
    const key = name;
    if (!GFX._hd[key]) GFX._hd[key] = GFX.operator().then(() => new Promise((res) => {
      try { new THREE_EXTRAS.EXRLoader().load("models/hdri-" + name + ".exr", (tex) => res(tex), null, () => res(null)); } catch (e) { res(null); }
    }));
    return GFX._hd[key].then((tex) => {
      if (!tex) return null;
      const pm = new THREE.PMREMGenerator(renderer); tex.mapping = THREE.EquirectangularReflectionMapping;
      const rt = pm.fromEquirectangular(tex); pm.dispose(); return rt.texture;
    });
  },
  // ---- real PBR texture sets (CC0 scans in models/tex-<name>-c|-n|-r.jpg, see models/CREDITS.txt): colour + normal + roughness.
  // Resolves null when the colour map cannot be loaded, so every caller keeps its procedural canvas texture as the fallback.
  // The Performance setting loads the colour map only.
  pbr(name, rx = 1, ry = rx, o = {}) {
    const T = THREE, low = GFX.lowEnd(), C = GFX._px || (GFX._px = {});
    const one = (k, srgb) => C[k] || (C[k] = new Promise((res) => { try { new T.TextureLoader().load("models/tex-" + k + ".jpg", (t) => { if (srgb) t.colorSpace = T.SRGBColorSpace; res(t); }, null, () => res(null)); } catch (e) { res(null); } }));
    const none = Promise.resolve(null);
    return Promise.all([one(name + "-c", true), low || o.n === false ? none : one((o.n || name) + "-n"), low || o.r === false ? none : one(name + "-r")]).then(([c, n, r]) => {
      if (!c) return null;
      const mk = (t, k = 1) => { if (!t) return null; const q = t.clone(); q.wrapS = q.wrapT = T.RepeatWrapping; q.repeat.set(rx * k, ry * k); q.anisotropy = low ? 2 : 8; q.needsUpdate = true; return q; };
      return { map: mk(c), normalMap: mk(n, o.nk || 1), roughnessMap: mk(r) };
    });
  },
  // put a texture set on an existing MeshStandardMaterial. o: color (tint), ns (normal strength), rough (multiplier on the
  // roughness map), metal, paint (RGBA canvas texture laid over the albedo in face UVs), shade ([low, high] wall height shading)
  skin(mat, name, rx, ry, o = {}) {
    if (!mat) return Promise.resolve(false);
    return GFX.pbr(name, rx, ry, o).then((s) => {
      if (!s) return false;
      mat.map = s.map; mat.color.set(o.color == null ? 0xffffff : o.color);
      mat.normalMap = s.normalMap; if (s.normalMap) mat.normalScale.set(o.ns || 1, o.ns || 1);
      mat.roughnessMap = s.roughnessMap; if (s.roughnessMap) mat.roughness = o.rough == null ? 1 : o.rough;
      if (o.metal != null) mat.metalness = o.metal;
      if (o.paint || o.shade) GFX.paint(mat, o.paint, o.shade);
      mat.needsUpdate = true; return true;
    });
  },
  // paint layer: an RGBA canvas (stripes, joints, labels, baked contact shadows) alpha-blended over the tiling albedo using the
  // un-tiled face UVs, plus optional darkening towards the floor for walls
  paint(mat, tex, shade) {
    if (tex) tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    mat.onBeforeCompile = (sh) => {
      if (tex) sh.uniforms.paintMap = { value: tex };
      sh.vertexShader = "varying float vWY; varying vec2 vPaintUv;\n" + sh.vertexShader.replace("#include <fog_vertex>", "#include <fog_vertex>\n vPaintUv = uv;\n#ifdef USE_INSTANCING\n vWY = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).y;\n#else\n vWY = (modelMatrix * vec4(transformed, 1.0)).y;\n#endif");
      sh.fragmentShader = "varying float vWY; varying vec2 vPaintUv; uniform sampler2D paintMap;\n" + sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n" + (tex ? " vec4 pt = texture2D(paintMap, vPaintUv); diffuseColor.rgb = mix(diffuseColor.rgb, pt.rgb, pt.a);\n" : "") + (shade ? " diffuseColor.rgb *= mix(" + shade[0].toFixed(3) + ", " + shade[1].toFixed(3) + ", smoothstep(0.0, 2.4, vWY));\n" : ""));
    };
    mat.customProgramCacheKey = () => "paint" + (tex ? 1 : 0) + (shade ? shade.join("_") : "");
    mat.needsUpdate = true;
  },
  // model files still on their way. A match waits for them (briefly) so soldiers and guns are there, lit and compiled,
  // when the loading screen lifts, instead of popping in with a freeze a few seconds into the round
  pending: 0,
  track(p) { GFX.pending++; const done = () => { GFX.pending--; }; p.then(done, done); return p; },
  whenLoaded(maxMs) { return new Promise((res) => { const t0 = performance.now(); let calm = 0; const tick = () => { calm = GFX.pending > 0 ? 0 : calm + 1; if (calm >= 2 || performance.now() - t0 > maxMs) res(); else setTimeout(tick, 40); }; tick(); }); },
  operator() {
    if (GFX._op) return GFX._op;
    GFX._op = GFX.track(new Promise((res) => {
      const go = () => { try { new THREE_EXTRAS.GLTFLoader().load("models/operator.glb", (g) => res(g), null, () => res(null)); } catch (e) { res(null); } };
      if (window.THREE_EXTRAS) go(); else { const s = document.createElement("script"); s.src = "vendor/three-extras.min.js?v=2"; s.onload = go; s.onerror = () => res(null); document.head.append(s); }
    }));
    return GFX._op;
  },
  // realistic rigged CC0 soldier (see models/CREDITS.txt) with walk and run clips.
  // lite = the same soldier at a third of the triangles (tools: meshoptimizer), for crowded matches and modest graphics cards
  soldier(lite) {
    const k = lite ? 1 : 0, C = GFX._sol || (GFX._sol = []); if (C[k]) return C[k];
    const load = (f) => new Promise((res) => { try { new THREE_EXTRAS.GLTFLoader().load("models/" + f, (g) => res(g), null, () => res(null)); } catch (e) { res(null); } });
    return C[k] = GFX.track(GFX.operator().then(() => load(lite ? "trooper-lod.glb?v=1" : "trooper.glb")).then((g) => g || !lite ? g : load("trooper.glb")));
  },
  // real people for the two teams (Grab3D businessman, casual man, woman; slimmed, see models/CREDITS.txt) with a mask of what is
  // suit, trousers, skin, hair, shirt and shoes so each look can recolour them in the shader. Resolves null if any piece fails.
  people() {
    if (GFX._ppl) return GFX._ppl;
    const load = (f) => new Promise((res) => { try { new THREE_EXTRAS.GLTFLoader().load("models/" + f, (g) => res(g), null, () => res(null)); } catch (e) { res(null); } });
    const tex = (f) => new Promise((res) => new THREE.TextureLoader().load("models/" + f, (t) => { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.flipY = false; t.colorSpace = THREE.NoColorSpace; res(t); }, null, () => res(null)));
    const N = ["businessman", "man", "woman"];
    return GFX._ppl = GFX.track(GFX.operator().then(() => Promise.all(N.map(n => Promise.all([load("person-" + n + ".glb?v=1"), tex("person-" + n + "-mask.png?v=2")])))).then((L) => {
      if (L.some(([g, m]) => !g || !m)) return null; const o = {}; L.forEach(([g, m], k) => { g.userData.mask = m; g.userData.mean = PEOPLE_MEAN[N[k]]; o[N[k]] = g; }); return o; }));
  },
  // a cloud of glowing points drawn in one call (sparks, chips of light): emit() adds one, update() moves and fades them all
  cloud(scene, N, size) {
    const T = THREE, g = new T.BufferGeometry(), P = new T.BufferAttribute(new Float32Array(N * 3), 3), C = new T.BufferAttribute(new Float32Array(N * 3), 3); g.setAttribute("position", P); g.setAttribute("color", C);
    const m = new T.Points(g, new T.PointsMaterial({ map: GFX.glowTex(), size, sizeAttenuation: true, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); m.frustumCulled = false; m.renderOrder = 5; m.visible = false; scene.add(m);
    const v = new Float32Array(N * 3), life = new Float32Array(N), max = new Float32Array(N), c = new Float32Array(N * 3); let n = 0, live = 0;
    return { m,
      emit(x, y, z, vx, vy, vz, lf, r, gg, b) { const o = n++ % N; P.setXYZ(o, x, y, z); v[o * 3] = vx; v[o * 3 + 1] = vy; v[o * 3 + 2] = vz; life[o] = max[o] = lf; c[o * 3] = r; c[o * 3 + 1] = gg; c[o * 3 + 2] = b; live = Math.max(live, lf + 0.1); },
      update(dt, grav) {
        if (live <= 0) { if (m.visible) m.visible = false; return; } live -= dt; m.visible = true;
        for (let o = 0; o < N; o++) { if (life[o] <= 0) continue; life[o] -= dt; const f = Math.max(0, life[o] / max[o]); v[o * 3 + 1] -= grav * dt; P.setXYZ(o, P.getX(o) + v[o * 3] * dt, Math.max(0.02, P.getY(o) + v[o * 3 + 1] * dt), P.getZ(o) + v[o * 3 + 2] * dt); C.setXYZ(o, c[o * 3] * f, c[o * 3 + 1] * f, c[o * 3 + 2] * f); }
        P.needsUpdate = C.needsUpdate = true;
      } };
  },
  // quality: phones get a lighter pipeline
  // render resolution: the device's native pixel density times the player's scale (Settings). A 4K or high-density
  // laptop screen has four times the pixels of a 1080p one, far more than an office graphics card can shade, so the
  // picture is capped per quality level (about 1600x900, 1920x1080, 2560x1440, 4K) and the screen scales it up.
  pxRatio(w, h) {
    const g = store("nfa-gfx") || {}, rs = clamp(+g.rs || (this.lowEnd() ? 0.75 : 1), 0.5, 1.5); let pr = Math.min(3, (devicePixelRatio || 1) * rs);
    if (w > 0 && h > 0) { const cap = Math.sqrt([1.45e6, 2.1e6, 3.7e6, 8.3e6][NX.tier().i] / (w * h)) * Math.max(1, rs); if (pr > cap) pr = Math.max(0.5, cap); }
    return pr;
  },
  // size the 3D canvas to fill the whole stage (the 16:10 HUD canvas floats centred on top of it)
  fitStage(F, cam) {
    const box = $("#stagebox"), gc = $("#gameCanvas"), w = box.clientWidth || 960, h = box.clientHeight || 600, pr = this.pxRatio(w, h);
    if (F.w !== w || F.h !== h || F.pr !== pr) { F.w = w; F.h = h; F.pr = pr; F.renderer.setPixelRatio(pr); F.renderer.setSize(w, h, false); Object.assign(F.cv.style, { width: w + "px", height: h + "px", left: "0px", top: "0px", borderRadius: "0" }); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    const gw = parseFloat(gc.style.width) || 960, gh = parseFloat(gc.style.height) || 600; F.gw = gw; F.gh = gh; pinToStage(F, gw, gh);
  },
  // tint everything outside the HUD canvas too (scope black-out, death dim): a huge spread shadow on the HUD canvas
  bleed(col) { const gc = $("#gameCanvas"), v = col ? "0 0 0 200vmax " + col : ""; if (gc && gc.style.boxShadow !== v) gc.style.boxShadow = v; },
  lowEnd() { return NX.tier().i === 0; },   // the "Performance" level, chosen by the player or picked automatically from the graphics card
  tex(w, h, fn) { const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.userData.canvas = c; return t; },
  // turn a grayscale height canvas into a tangent-space normal map
  normal(srcTex, strength = 2) {
    const c = srcTex.userData.canvas, w = c.width, h = c.height, src = c.getContext("2d").getImageData(0, 0, w, h).data;
    const o = document.createElement("canvas"); o.width = w; o.height = h; const ox = o.getContext("2d"), img = ox.createImageData(w, h), d = img.data;
    const H = (x, y) => { x = (x + w) % w; y = (y + h) % h; const i = (y * w + x) * 4; return (src[i] + src[i + 1] + src[i + 2]) / 765; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (H(x - 1, y) - H(x + 1, y)) * strength, dy = (H(x, y - 1) - H(x, y + 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      d[i] = (dx / l * 0.5 + 0.5) * 255; d[i + 1] = (-dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    ox.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(o); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.copy(srcTex.repeat); t.anisotropy = 8; return t;
  },
  glowTex(col = "#ffffff") { return this._glow || (this._glow = this.tex(128, 128, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); })); },
  shadowTex() { return this._shad || (this._shad = this.tex(64, 64, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(0,0,0,.6)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); })); },
  flashTex() { return this._flash || (this._flash = this.tex(128, 128, (x, w, h) => { x.translate(w / 2, h / 2); for (let k = 0; k < 7; k++) { x.rotate(Math.PI * 2 / 7 + Math.random() * 0.3); const g = x.createLinearGradient(0, 0, 60, 0); g.addColorStop(0, "rgba(255,240,200,1)"); g.addColorStop(1, "rgba(255,160,40,0)"); x.fillStyle = g; x.beginPath(); x.moveTo(0, -7); x.lineTo(58 * (0.6 + Math.random() * 0.4), 0); x.lineTo(0, 7); x.fill(); } const g = x.createRadialGradient(0, 0, 0, 0, 0, 26); g.addColorStop(0, "rgba(255,255,240,1)"); g.addColorStop(1, "rgba(255,200,80,0)"); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 26, 0, 7); x.fill(); })); },

  // Image-based lighting from a tiny procedural room: gives metals and glossy surfaces something to reflect
  env(renderer, o = {}) {
    const T = THREE, sc = new T.Scene();
    const room = new T.Mesh(new T.BoxGeometry(20, 10, 20), new T.MeshBasicMaterial({ color: new T.Color(o.base || 0x30344a), side: T.BackSide })); room.position.y = 4; sc.add(room);
    const panel = (x, y, z, sx, sy, sz, col, k) => { const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k) })); m.position.set(x, y, z); sc.add(m); };
    (o.panels || [[0, 8.9, 0, 6, 0.1, 6, 0xfff2e0, 6], [-7, 6, 0, 0.1, 3, 8, 0x8fb4ff, 2], [7, 6, 0, 0.1, 3, 8, 0xffc49a, 2], [0, 5, -9.9, 10, 3, 0.1, 0xffffff, 1.5], [0, -0.9, 0, 20, 0.1, 20, 0x15182a, 1]]).forEach(a => panel(...a));
    const pm = new T.PMREMGenerator(renderer); const rt = pm.fromScene(sc, 0.04); pm.dispose();
    sc.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
    return rt.texture;
  },
  // Bloom + vignette + filmic grade. Scene renders into an MSAA float target, bright parts get blurred at two
  // scales and added back, then ACES tone mapping and sRGB output happen in the final pass.
  post(renderer, opt = {}) {
    const T = THREE, gl2 = renderer.capabilities.isWebGL2;
    if (!gl2) return null;
    const mkRT = (s) => new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: s || 0 });
    const P = { main: mkRT(opt.low ? 0 : 4), a1: mkRT(), b1: mkRT(), a2: mkRT(), b2: mkRT(), ao1: mkRT(), ao2: mkRT(), useAO: !!opt.ao && !opt.low, strength: opt.strength || 0.9, threshold: opt.threshold || 0.85, vignette: opt.vignette == null ? 0.38 : opt.vignette, tint: new T.Vector3(...(opt.tint || [1, 1, 1])), w: 0, h: 0 };
    if (P.useAO) { P.main.depthTexture = new T.DepthTexture(1, 1); P.main.depthTexture.type = T.UnsignedIntType; }
    const vs = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    // screen-space ambient occlusion from depth only: compares inverse depth of opposite samples (planes stay flat,
    // creases and contact areas darken), with a range cut so foreground objects don't halo the background
    const aoM = new T.ShaderMaterial({ uniforms: { dT: { value: null }, n: { value: 0.1 }, f: { value: 100 }, r: { value: 0.5 }, asp: { value: 1 }, st: { value: opt.aoStrength || 1.0 } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D dT; uniform float n, f, r, asp, st; varying vec2 vUv;\nfloat ld(vec2 uv){ float d = texture2D(dT, uv).x; return n * f / (f - d * (f - n)); }\nvoid main(){ float z = ld(vUv); if (z > f * 0.8) { gl_FragColor = vec4(1.0); return; } float iz = 1.0 / z; float rad = r / z; float occ = 0.0; float h = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831;\n for (int i = 0; i < 8; i++) { float a = float(i) * 0.3927 + h; float s = 0.35 + 0.65 * fract(float(i) * 0.618 + h); vec2 o = vec2(cos(a) / asp, sin(a)) * rad * s; float z1 = ld(vUv + o), z2 = ld(vUv - o); float c = ((1.0 / z1 + 1.0 / z2) * 0.5 - iz) / iz; float rng = 1.0 - smoothstep(0.6, 1.6, max(z - min(z1, z2), 0.0)); occ += clamp(c * 9.0, 0.0, 1.0) * rng; }\n float ao = 1.0 - occ / 8.0 * st; gl_FragColor = vec4(vec3(clamp(ao, 0.25, 1.0)), 1.0); }" });
    const bright = new T.ShaderMaterial({ uniforms: { t: { value: null }, th: { value: P.threshold } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(th, th + 0.8, l), 1.0); }" });
    const blur = new T.ShaderMaterial({ uniforms: { t: { value: null }, d: { value: new T.Vector2() } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb * 0.227; c += (texture2D(t, vUv + d * 1.385).rgb + texture2D(t, vUv - d * 1.385).rgb) * 0.316; c += (texture2D(t, vUv + d * 3.231).rgb + texture2D(t, vUv - d * 3.231).rgb) * 0.070; gl_FragColor = vec4(c, 1.0); }" });
    const comp = new T.ShaderMaterial({ defines: P.useAO ? { USE_AO: 1 } : {}, uniforms: { t: { value: null }, aoT: { value: null }, b1: { value: null }, b2: { value: null }, k: { value: P.strength }, vig: { value: P.vignette }, tint: { value: P.tint }, tm: { value: 0 }, hurt: { value: 0 }, sat: { value: opt.sat || 1 } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D t, b1, b2, aoT; uniform float k, vig, tm, hurt, sat; uniform vec3 tint; varying vec2 vUv;\n#include <common>\nvoid main(){ vec3 c = texture2D(t, vUv).rgb;\n#ifdef USE_AO\n c *= texture2D(aoT, vUv).r;\n#endif\n c += (texture2D(b1, vUv).rgb * 0.6 + texture2D(b2, vUv).rgb * 0.9) * k; c *= tint; c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, sat); vec2 q = vUv - 0.5; float v = 1.0 - dot(q, q) * vig * 2.6; c *= clamp(v, 0.0, 1.0); c = mix(c, c * vec3(1.6, 0.35, 0.35), hurt * smoothstep(0.15, 0.7, length(q))); float n = fract(sin(dot(vUv * (tm + 1.0), vec2(12.9898, 78.233))) * 43758.5453); c += (n - 0.5) * 0.018; gl_FragColor = vec4(max(c, 0.0), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), bright); quad.frustumCulled = false;
    const sc = new T.Scene(); sc.add(quad); const oc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pass = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(sc, oc); };
    P.comp = comp;
    P.render = (scene, cam, t) => {
      const sz = renderer.getDrawingBufferSize(new T.Vector2()), w = sz.x, h = sz.y;
      if (w !== P.w || h !== P.h) { P.w = w; P.h = h; P.main.setSize(w, h); P.ao1.setSize(w >> 1, h >> 1); P.ao2.setSize(w >> 1, h >> 1); P.a1.setSize(w >> 1, h >> 1); P.b1.setSize(w >> 1, h >> 1); P.a2.setSize(w >> 2, h >> 2); P.b2.setSize(w >> 2, h >> 2); }
      renderer.setRenderTarget(P.main); renderer.render(scene, cam);
      if (P.useAO) {
        aoM.uniforms.dT.value = P.main.depthTexture; aoM.uniforms.n.value = cam.near; aoM.uniforms.f.value = Math.min(cam.far, 120); aoM.uniforms.asp.value = w / h;
        aoM.uniforms.r.value = (opt.aoRadius || 0.55) / Math.tan(cam.fov * Math.PI / 360) * 0.5; pass(aoM, P.ao1);
        blur.uniforms.t.value = P.ao1.texture; blur.uniforms.d.value.set(1.5 / w, 0); pass(blur, P.ao2);
        blur.uniforms.t.value = P.ao2.texture; blur.uniforms.d.value.set(0, 1.5 / h); pass(blur, P.ao1);
        comp.uniforms.aoT.value = P.ao1.texture;
      }
      bright.uniforms.t.value = P.main.texture; pass(bright, P.a1);
      blur.uniforms.t.value = P.a1.texture; blur.uniforms.d.value.set(2 / w, 0); pass(blur, P.b1);
      blur.uniforms.t.value = P.b1.texture; blur.uniforms.d.value.set(0, 2 / h); pass(blur, P.a1);
      blur.uniforms.t.value = P.a1.texture; blur.uniforms.d.value.set(4 / w, 0); pass(blur, P.b2);
      blur.uniforms.t.value = P.b2.texture; blur.uniforms.d.value.set(0, 4 / h); pass(blur, P.a2);
      blur.uniforms.t.value = P.a2.texture; blur.uniforms.d.value.set(8 / w, 0); pass(blur, P.b2);
      blur.uniforms.t.value = P.b2.texture; blur.uniforms.d.value.set(0, 8 / h); pass(blur, P.a2);
      comp.uniforms.t.value = P.main.texture; comp.uniforms.b1.value = P.a1.texture; comp.uniforms.b2.value = P.a2.texture; comp.uniforms.tm.value = (t || 0) % 100;
      pass(comp, null);
    };
    P.dispose = () => { [P.main, P.a1, P.b1, P.a2, P.b2, P.ao1, P.ao2].forEach(r => r.dispose()); [bright, blur, comp, aoM].forEach(m => m.dispose()); };
    return P;
  },
};

// keep on-screen touch buttons and the aim button inside the visible game area
function pinToStage(F, w, h) {
  const gc = $("#gameCanvas"), box = $("#stagebox"); if (!gc || !box) return;
  const right = Math.max(0, box.clientWidth - (gc.offsetLeft + w)), bottom = Math.max(0, box.clientHeight - (gc.offsetTop + h));
  if (F.touch) { F.touch.style.right = right + 8 + "px"; F.touch.style.bottom = bottom + h * 0.13 + "px"; }
  if (F.setBtn) { F.setBtn.style.right = right + 8 + "px"; F.setBtn.style.top = gc.offsetTop + 8 + "px"; F.setBtn.style.bottom = "auto"; }
  if (F.setPanel && !F.setPanel.classList.contains("set-modal")) { F.setPanel.style.right = right + 8 + "px"; F.setPanel.style.top = gc.offsetTop + 50 + "px"; F.setPanel.style.bottom = "auto"; }
}
// mean linear brightness of each masked part in the source texture (1 top, 2 trousers, 3 skin, 4 hair, 5 shirt, 6 shoes)
const PEOPLE_MEAN = { businessman: [0.0225, 0.0225, 0.414, 0.0255, 0.663, 0.0336], man: [0.129, 0.0273, 0.418, 0.0384, 0.699, 0.409], woman: [0.1186, 0.0106, 0.46, 0.0559, 0.847, 0.602] };
