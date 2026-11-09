// ======================= shared 3D graphics helpers: post-processing (bloom + grade), procedural PBR textures =======================
const GFX = {
  // animated CC0 "operator" character (Quaternius robot via the three.js examples), loaded on demand
  operator() {
    if (GFX._op) return GFX._op;
    GFX._op = new Promise((res) => {
      const go = () => { try { new THREE_EXTRAS.GLTFLoader().load("models/operator.glb", (g) => res(g), null, () => res(null)); } catch (e) { res(null); } };
      if (window.THREE_EXTRAS) go(); else { const s = document.createElement("script"); s.src = "vendor/three-extras.min.js"; s.onload = go; s.onerror = () => res(null); document.head.append(s); }
    });
    return GFX._op;
  },
  // quality: phones get a lighter pipeline
  lowEnd() { const q = (store("nfa-gfx") || {}).q; if (q === "low") return true; if (q === "high") return false; return matchMedia("(pointer: coarse)").matches || (navigator.hardwareConcurrency || 8) <= 4; },
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
    const P = { main: mkRT(opt.low ? 0 : 4), a1: mkRT(), b1: mkRT(), a2: mkRT(), b2: mkRT(), strength: opt.strength || 0.9, threshold: opt.threshold || 0.85, vignette: opt.vignette == null ? 0.38 : opt.vignette, tint: new T.Vector3(...(opt.tint || [1, 1, 1])), w: 0, h: 0 };
    const vs = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
    const bright = new T.ShaderMaterial({ uniforms: { t: { value: null }, th: { value: P.threshold } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(th, th + 0.8, l), 1.0); }" });
    const blur = new T.ShaderMaterial({ uniforms: { t: { value: null }, d: { value: new T.Vector2() } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb * 0.227; c += (texture2D(t, vUv + d * 1.385).rgb + texture2D(t, vUv - d * 1.385).rgb) * 0.316; c += (texture2D(t, vUv + d * 3.231).rgb + texture2D(t, vUv - d * 3.231).rgb) * 0.070; gl_FragColor = vec4(c, 1.0); }" });
    const comp = new T.ShaderMaterial({ uniforms: { t: { value: null }, b1: { value: null }, b2: { value: null }, k: { value: P.strength }, vig: { value: P.vignette }, tint: { value: P.tint }, tm: { value: 0 }, hurt: { value: 0 } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: "uniform sampler2D t, b1, b2; uniform float k, vig, tm, hurt; uniform vec3 tint; varying vec2 vUv;\n#include <common>\nvoid main(){ vec3 c = texture2D(t, vUv).rgb; c += (texture2D(b1, vUv).rgb * 0.6 + texture2D(b2, vUv).rgb * 0.9) * k; c *= tint; vec2 q = vUv - 0.5; float v = 1.0 - dot(q, q) * vig * 2.6; c *= clamp(v, 0.0, 1.0); c = mix(c, c * vec3(1.6, 0.35, 0.35), hurt * smoothstep(0.15, 0.7, length(q))); float n = fract(sin(dot(vUv * (tm + 1.0), vec2(12.9898, 78.233))) * 43758.5453); c += (n - 0.5) * 0.018; gl_FragColor = vec4(max(c, 0.0), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" });
    const quad = new T.Mesh(new T.PlaneGeometry(2, 2), bright); quad.frustumCulled = false;
    const sc = new T.Scene(); sc.add(quad); const oc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pass = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(sc, oc); };
    P.comp = comp;
    P.render = (scene, cam, t) => {
      const sz = renderer.getDrawingBufferSize(new T.Vector2()), w = sz.x, h = sz.y;
      if (w !== P.w || h !== P.h) { P.w = w; P.h = h; P.main.setSize(w, h); P.a1.setSize(w >> 1, h >> 1); P.b1.setSize(w >> 1, h >> 1); P.a2.setSize(w >> 2, h >> 2); P.b2.setSize(w >> 2, h >> 2); }
      renderer.setRenderTarget(P.main); renderer.render(scene, cam);
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
    P.dispose = () => { [P.main, P.a1, P.b1, P.a2, P.b2].forEach(r => r.dispose()); [bright, blur, comp].forEach(m => m.dispose()); };
    return P;
  },
};

// keep on-screen touch buttons and the aim button inside the visible game area
function pinToStage(F, w, h) {
  const gc = $("#gameCanvas"), box = $("#stagebox"); if (!gc || !box) return;
  const right = Math.max(0, box.clientWidth - (gc.offsetLeft + w)), bottom = Math.max(0, box.clientHeight - (gc.offsetTop + h));
  if (F.touch) { F.touch.style.right = right + 8 + "px"; F.touch.style.bottom = bottom + h * 0.13 + "px"; }
  if (F.setBtn) { F.setBtn.style.right = right + 8 + "px"; F.setBtn.style.top = gc.offsetTop + 8 + "px"; F.setBtn.style.bottom = "auto"; }
  if (F.setPanel) { F.setPanel.style.right = right + 8 + "px"; F.setPanel.style.top = gc.offsetTop + 50 + "px"; F.setPanel.style.bottom = "auto"; }
}
