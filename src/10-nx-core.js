// ======================= NX engine core: quality levels, texture loading, material shaders =======================
// The 3D games draw with baked lighting: tools/bake.js pre-computes soft shadows and bounced light for every map, and the
// shaders here combine that with scanned PBR materials, a real-time sun, shadows of moving things and reflections.
// Everything runs on the player's own graphics card; the quality level scales the cost from office laptops to gaming PCs.
const NX = {
  VER: 7,            // cache buster for baked files and textures (the server caches /models for a week)
  LM_SCALE: 16,      // lightmaps store sqrt(irradiance / 16)
  url(f) { return "models/" + f + "?v=" + NX.VER; },

  // ---- quality. Setting "nfa-gfx".q: auto | low | medium | high | ultra
  TIERS: [
    { name: "low", scale: 0.75, msaa: 0, fxaa: 1, ao: 0, bloom: 4, shadow: 0, tex: 512, aniso: 2, norm: 0, orm: 0, dir: 0, env: 64, lights: 1, parts: 0.4, grain: 0, ca: 0, sky: 2048, refl: 0, reflN: 0 },
    { name: "medium", scale: 0.9, msaa: 0, fxaa: 1, ao: 0, bloom: 5, shadow: 1024, tex: 1024, aniso: 4, norm: 1, orm: 1, dir: 1, env: 128, lights: 2, parts: 0.7, grain: 1, ca: 0, sky: 4096, refl: 32, reflN: 24 },
    { name: "high", scale: 1, msaa: 4, fxaa: 0, ao: 1, bloom: 6, shadow: 2048, tex: 1024, aniso: 8, norm: 1, orm: 1, dir: 1, env: 128, lights: 4, parts: 1, grain: 1, ca: 1, sky: 4096, refl: 64, reflN: 32 },
    { name: "ultra", scale: 1, msaa: 4, fxaa: 1, ao: 2, bloom: 6, shadow: 4096, tex: 1024, aniso: 16, norm: 1, orm: 1, dir: 1, env: 128, lights: 4, parts: 1.5, grain: 1, ca: 1, sky: 4096, refl: 128, reflN: 32 },
  ],
  gpu() {
    if (NX._gpu != null) return NX._gpu;
    let r = "";
    try { const c = document.createElement("canvas"), gl = c.getContext("webgl2") || c.getContext("webgl"); if (gl) { const e = gl.getExtension("WEBGL_debug_renderer_info"); r = String((e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) || ""); const l = gl.getExtension("WEBGL_lose_context"); if (l) l.loseContext(); } } catch (e) { }
    return NX._gpu = r;
  },
  // guess a sensible level from the graphics card's name; dynamic resolution takes care of the rest while playing
  autoTier() {
    const r = NX.gpu().toLowerCase(), touch = matchMedia("(pointer: coarse)").matches, cores = navigator.hardwareConcurrency || 4;
    if (/swiftshader|llvmpipe|software|microsoft basic/.test(r)) return 0;
    if (touch) return /apple|adreno \(tm\) 7|mali-g7|mali-g6/.test(r) ? 1 : 0;
    if (/rtx|radeon rx (6|7|8|9)\d{3}|rx (6|7|8|9)\d{3}|arc\(tm\) a7|apple m\d (max|ultra)/.test(r)) return 3;
    if (/nvidia|geforce|quadro|radeon rx|radeon pro|radeon \(tm\) rx|apple m\d|apple gpu|arc/.test(r)) return 2;
    if (/iris\(r\) xe|iris xe|iris\(tm\) plus|iris plus|uhd graphics 7\d\d|radeon\(tm\) graphics|radeon graphics|vega/.test(r)) return 1;
    if (/hd graphics (2|3|4)\d{3}|hd graphics\b(?! \d)|gma|mali-4|adreno \(tm\) (3|4)/.test(r)) return 0;
    if (/intel/.test(r)) return cores <= 4 ? 0 : 1;
    return cores <= 4 ? 1 : 2;
  },
  tier() {
    const g = store("nfa-gfx") || {}, q = g.q || "auto", named = ["low", "medium", "high", "ultra"].indexOf(q);
    // Auto corrects itself: a PC that could not hold its level last game (see drsTick) starts one lower on this card
    const adj = named < 0 && g.adjGpu === NX.gpu() ? Math.min(0, +g.adj || 0) : 0;
    const i = named >= 0 ? named : Math.max(0, NX.autoTier() + adj);
    return Object.assign({ i, auto: named < 0 }, NX.TIERS[i]);
  },
  // ---- the display's refresh interval. Frames can never come faster than the display shows them, so a 30 Hz screen
  // (Remote Desktop, some docks and TVs) must not be mistaken for a slow graphics card. The shortest steady average seen
  // is the display; menus are light enough to trust in both directions, a match can only confirm a faster display.
  hz: { ms: 16.67, acc: 0, n: 0, known: false },
  hzTick(dtMs, light) {
    const H = NX.hz; if (!(dtMs > 1) || dtMs > 120) { H.acc = 0; H.n = 0; return; }
    H.acc += dtMs; if (++H.n < 24) return; const a = H.acc / H.n; H.acc = 0; H.n = 0;
    if (!H.known || a < H.ms) { if (light || a < H.ms) { H.ms = a; H.known = true; } }
    else if (light) H.ms += (a - H.ms) * 0.25;
  },
  // the frame time dynamic resolution aims for: 60 a second, or the display's own rate when that is slower
  frameGoal() { return Math.min(42, Math.max(16.67, NX.hz.ms)); },
  // dynamic resolution: when frames take too long the picture is drawn a little smaller and scaled up, and it grows back
  // when there is room. Frame times are locked to the display's refresh, so "room" can only be found by trying: a step up
  // that drops frames is taken back and the next try waits twice as long.
  drs: { k: 1, acc: 0, n: 0, hold: 4, cool: 6, up: 0, sum: 0, cnt: 0, told: false },
  drsReset() { const D = NX.drs; D.k = 1; D.acc = 0; D.n = 0; D.hold = 4; D.cool = 6; D.up = 0; D.sum = 0; D.cnt = 0; D.told = false; },
  drsTick(dtMs) {
    const D = NX.drs; if (!(dtMs > 0) || dtMs > 250) return D.k; D.acc += dtMs; D.n++; if (D.n < 30) return D.k;
    const avg = D.acc / D.n, goal = NX.frameGoal(); D.acc = 0; D.n = 0;
    if (avg > goal * 1.23 && D.k > 0.5) { if (D.up) D.cool = Math.min(64, D.cool * 2); D.up = 0; D.k = Math.max(0.5, D.k * (avg > goal * 1.8 ? 0.8 : 0.9)); D.hold = D.cool; }
    else if (D.hold > 0) D.hold--;
    else if (avg < goal * 1.056 && D.k < 1) { D.k = Math.min(1, D.k + 0.1); D.up = 1; D.hold = 2; }
    else D.up = 0;
    // Auto level: half a minute spent mostly at a much smaller picture means this level is too heavy for this card.
    // A level lower at full size looks better and runs smoother, so the next game starts one lower.
    D.sum += D.k; D.cnt++;
    if (!D.told && D.cnt >= 50 && D.sum / D.cnt < 0.72) {
      D.told = true; const g = store("nfa-gfx") || {}, T = NX.tier();
      if (T.auto && T.i > 0) {
        store("nfa-gfx", Object.assign(g, { adj: (g.adjGpu === NX.gpu() ? Math.min(0, +g.adj || 0) : 0) - 1, adjGpu: NX.gpu() }));
        if (typeof toast === "function") toast("This PC is struggling at " + (T.name === "medium" ? "Medium" : T.name === "high" ? "High" : "Ultra") + " graphics. The next game starts one level lower (Settings to change).", 6000);
      }
    }
    return D.k;
  },

  // ---- frame rate display (F8, or the switch in Settings): what this PC really gets, half a second at a time
  perf: { on: null, el: null, ts: [], hist: [], js: 0, draw: 0, n: 0, t0: 0, gl: null, ext: null, q: null, pend: [], gAcc: 0, gN: 0, gpuMs: -1, d0: 0, calls: 0, tris: 0, res: "", k: 1, live: 0 },
  perfOn() { const P = NX.perf; if (P.on === null) P.on = (store("nfa-gfx") || {}).fps === 1 || /[#?&]fps\b/.test(location.href); return P.on; },
  perfSet(on) { const P = NX.perf; P.on = !!on; store("nfa-gfx", Object.assign(store("nfa-gfx") || {}, { fps: on ? 1 : 0 })); if (P.el) P.el.hidden = !on; P.ts.length = 0; P.hist.length = 0; },
  gpuName() { return NX.gpu().replace(/^ANGLE \((?:[^,]+, )?/, "").replace(/ \(0x[0-9a-f]+\).*$/i, "").replace(/ Direct3D.*$| OpenGL.*$|, .*$/i, "").replace(/\)$/, "").slice(0, 60) || "unknown graphics card"; },
  // once per animation frame from the page loop. jsMs = time the game's own code took this frame (drawing included)
  perfFrame(dtMs, jsMs, host, inGame) {
    NX.hzTick(dtMs, !inGame);
    const P = NX.perf; if (!NX.perfOn()) return;
    if (!P.el) { P.el = document.createElement("div"); P.el.className = "perf-box"; P.el.setAttribute("aria-hidden", "true"); }
    if (P.el.parentNode !== host) host.appendChild(P.el);
    if (dtMs > 0 && dtMs < 2000) P.ts.push(dtMs); P.js += jsMs; P.n++;
    const now = performance.now(); if (now - P.t0 < 500 || !P.ts.length) return; P.t0 = now;
    const N = P.ts.length, avg = P.ts.reduce((a, b) => a + b, 0) / N;
    P.hist = P.hist.concat(P.ts).slice(-480); const s = P.hist.slice().sort((a, b) => a - b), low = s[Math.min(s.length - 1, Math.floor(s.length * 0.99))];
    const T = NX.tier(), lvl = ({ low: "Performance", medium: "Medium", high: "High", ultra: "Ultra" })[T.name] + (T.auto ? " (auto)" : "");
    const rows = [Math.round(1000 / avg) + " FPS   " + avg.toFixed(1) + " ms   slowest " + Math.round(low) + " ms"];
    if (inGame && now - P.live < 1500) {
      if (P.gN) { P.gpuMs = P.gAcc / P.gN; P.gAcc = 0; P.gN = 0; }
      rows.push("script " + (P.js / P.n).toFixed(1) + " ms (drawing " + (P.draw / P.n).toFixed(1) + ")" + (P.gpuMs >= 0 ? "   graphics card " + P.gpuMs.toFixed(1) + " ms" : ""));
      rows.push(P.res + "   " + Math.round(T.scale * 100) + "% x " + P.k.toFixed(2) + "   " + lvl);
      rows.push(P.calls + " draw calls   " + (P.tris > 9999 ? Math.round(P.tris / 1000) + "k" : P.tris) + " triangles");
    } else rows.push("graphics: " + lvl);
    rows.push(NX.gpuName() + "   display " + Math.round(1000 / NX.hz.ms) + " Hz");
    P.el.textContent = rows.join("\n"); P.el.hidden = false;
    P.ts.length = 0; P.js = 0; P.draw = 0; P.n = 0;
  },
  // around one frame's drawing (called by the post chain): draw-call counts and, where the browser offers it, real graphics card time
  perfBegin(r) {
    const P = NX.perf;
    if (!P.on) { if (!r.info.autoReset) r.info.autoReset = true; return; }
    r.info.autoReset = false; r.info.reset(); P.d0 = performance.now();
    const gl = r.getContext();
    if (P.gl !== gl) { P.gl = gl; P.q = null; P.pend = []; P.gpuMs = -1; P.gAcc = 0; P.gN = 0; try { P.ext = gl.getExtension("EXT_disjoint_timer_query_webgl2"); } catch (e) { P.ext = null; } }
    if (P.ext && !P.q && P.pend.length < 4) { try { P.q = gl.createQuery(); gl.beginQuery(P.ext.TIME_ELAPSED_EXT, P.q); } catch (e) { P.q = null; P.ext = null; } }
  },
  perfEnd(r, w, h, k) {
    const P = NX.perf; if (!P.on || !P.d0) return;
    const gl = r.getContext(); P.draw += performance.now() - P.d0; P.d0 = 0; P.live = performance.now();
    P.calls = r.info.render.calls; P.tris = r.info.render.triangles; P.res = w + " x " + h; P.k = k;
    if (!P.ext || P.gl !== gl) return;
    try {
      if (P.q) { gl.endQuery(P.ext.TIME_ELAPSED_EXT); P.pend.push(P.q); P.q = null; }
      while (P.pend.length && gl.getQueryParameter(P.pend[0], gl.QUERY_RESULT_AVAILABLE)) {
        const q = P.pend.shift(); if (!gl.getParameter(P.ext.GPU_DISJOINT_EXT)) { P.gAcc += gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; P.gN++; } gl.deleteQuery(q);
      }
    } catch (e) { P.ext = null; }
  },

  // ---- loading. Everything a map needs is counted so the loading screen can show real progress.
  prog: { n: 0, done: 0 },
  _tc: {},
  // decoded picture straight from the file: no colour management, no alpha premultiplication (lightmaps keep data in alpha)
  bitmap(url, o) {
    NX.prog.n++;
    const viaImg = () => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; });
    const p = (typeof createImageBitmap === "function")
      ? fetch(url).then(r => { if (!r.ok) throw new Error(url + " " + r.status); return r.blob(); }).then(b => createImageBitmap(b, Object.assign({ premultiplyAlpha: "none", colorSpaceConversion: "none" }, o || {}))).catch((e) => { console.warn("[nx] bitmap fallback", url, e && e.message); return viaImg(); })
      : viaImg();
    return p.then(bm => { NX.prog.done++; if (!bm) console.warn("[nx] image failed", url); return bm; });
  },
  // turn a decoded picture into a texture. up = true when v = 0 should be the bottom row of the picture
  toTex(bm, up) { const t = new THREE.Texture(bm), isBmp = typeof ImageBitmap !== "undefined" && bm instanceof ImageBitmap; t.flipY = isBmp ? false : !!up; t.premultiplyAlpha = false; t.needsUpdate = true; return t; },
  // one map of a scanned set: k = c (colour), n (normal), m (AO / roughness / metal), e (emission), a (opacity)
  tex(name, k, T) {
    const max = T.tex, key = name + "-" + k + "@" + max;
    return NX._tc[key] || (NX._tc[key] = NX.bitmap(NX.url("t-" + name + "-" + k + ".jpg"), max < 1024 ? { imageOrientation: "flipY", resizeWidth: max, resizeHeight: max, resizeQuality: "high" } : { imageOrientation: "flipY" }).then(bm => {
      if (!bm) return null; const t = NX.toTex(bm, true); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = T.aniso; t.colorSpace = (k === "c" || k === "e") ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t; }));
  },
  // data picture (lightmap, lookup): exact values, no mipmaps, row 0 of the file at v = 0
  data(bm) { const t = NX.toTex(bm, false); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.NoColorSpace; return t; },
  noise() { // tileable value noise at four scales, used to break up tiling and vary roughness
    if (NX._noise) return NX._noise; const n = 256, d = new Uint8Array(n * n * 4); let s = 1234567; const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    const layer = (cells) => { const g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = r(); const o = new Float32Array(n * n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const fx = x / n * cells, fy = y / n * cells, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0, sx = ax * ax * (3 - 2 * ax), sy = ay * ay * (3 - 2 * ay), x1 = (x0 + 1) % cells, y1 = (y0 + 1) % cells; o[y * n + x] = (g[y0 * cells + x0] * (1 - sx) + g[y0 * cells + x1] * sx) * (1 - sy) + (g[y1 * cells + x0] * (1 - sx) + g[y1 * cells + x1] * sx) * sy; } return o; };
    const a = layer(4), b = layer(9), c = layer(23), e = layer(61);
    for (let i = 0; i < n * n; i++) { d[i * 4] = (a[i] * 0.5 + b[i] * 0.3 + c[i] * 0.2) * 255; d[i * 4 + 1] = (b[i] * 0.4 + c[i] * 0.35 + e[i] * 0.25) * 255; d[i * 4 + 2] = (c[i] * 0.5 + e[i] * 0.5) * 255; d[i * 4 + 3] = e[i] * 255; }
    const t = new THREE.DataTexture(d, n, n, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return NX._noise = t;
  },

  // ---- shader pieces
  // shadows of moving things (players, props) in the sun: one depth map that follows the player
  GLSL_SHADOW: `
uniform sampler2D nxShadow; uniform mat4 nxShadowM; uniform vec4 nxShadowP;
float nxDynShadow( vec3 wp ) {
  if ( nxShadowP.z < 0.5 ) return 1.0;
  vec4 sc = nxShadowM * vec4( wp, 1.0 ); vec3 p = sc.xyz / sc.w * 0.5 + 0.5;
  if ( p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0 ) return 1.0;
  float z = p.z - nxShadowP.w, t = nxShadowP.x, s = 0.0;
  float a = fract( sin( dot( gl_FragCoord.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) * 6.2831; vec2 r = vec2( cos( a ), sin( a ) ) * t * nxShadowP.y;
  s += step( z, texture2D( nxShadow, p.xy ).r );
  s += step( z, texture2D( nxShadow, p.xy + r ).r ); s += step( z, texture2D( nxShadow, p.xy - r ).r );
  s += step( z, texture2D( nxShadow, p.xy + vec2( -r.y, r.x ) ).r ); s += step( z, texture2D( nxShadow, p.xy - vec2( -r.y, r.x ) ).r );
  vec2 e = min( p.xy, 1.0 - p.xy ); float edge = clamp( min( e.x, e.y ) * 12.0, 0.0, 1.0 );
  return mix( 1.0, s * 0.2, edge );
}`,
  // room reflections: every room has a small pre-blurred picture of itself (taken once at load, all packed into one texture).
  // A floor-plan lookup says which room a spot belongs to, and the reflection ray is followed to the room's walls so that
  // lamps and windows mirror in the right place on glossy floors. Layout of each picture = three.js PMREM "CubeUV".
  GLSL_REFL: `
uniform sampler2D nxRefl; uniform sampler2D nxReflI; uniform highp sampler2D nxReflD; uniform vec4 nxReflP, nxReflT;
float nxFace( vec3 d ) { vec3 a = abs( d ); if ( a.x > a.z ) { if ( a.x > a.y ) return d.x > 0.0 ? 0.0 : 3.0; return d.y > 0.0 ? 1.0 : 4.0; } if ( a.z > a.y ) return d.z > 0.0 ? 2.0 : 5.0; return d.y > 0.0 ? 1.0 : 4.0; }
vec2 nxFaceUV( vec3 d, float f ) { vec2 uv;
  if ( f == 0.0 ) uv = vec2( d.z, d.y ) / abs( d.x ); else if ( f == 1.0 ) uv = vec2( - d.x, - d.z ) / abs( d.y ); else if ( f == 2.0 ) uv = vec2( - d.x, d.y ) / abs( d.z );
  else if ( f == 3.0 ) uv = vec2( - d.z, d.y ) / abs( d.x ); else if ( f == 4.0 ) uv = vec2( - d.x, d.z ) / abs( d.y ); else uv = vec2( d.x, d.y ) / abs( d.z );
  return 0.5 * ( uv + 1.0 ); }
float nxRoughMip( float r ) { return r >= 0.8 ? ( 1.0 - r ) * 5.0 - 2.0 : r >= 0.4 ? ( 0.8 - r ) * 7.5 - 1.0 : r >= 0.305 ? ( 0.4 - r ) * 10.526 + 2.0 : r >= 0.21 ? ( 0.305 - r ) * 10.526 + 3.0 : - 2.0 * log2( 1.16 * r ); }
vec3 nxCube1( vec3 d, float mipInt, vec2 org ) {
  float face = nxFace( d ), filterInt = max( 4.0 - mipInt, 0.0 ); mipInt = max( mipInt, 4.0 ); float faceSize = exp2( mipInt );
  highp vec2 uv = nxFaceUV( d, face ) * ( faceSize - 2.0 ) + 1.0;
  if ( face > 2.0 ) { uv.y += faceSize; face -= 3.0; }
  uv.x += face * faceSize + filterInt * 48.0; uv.y += 4.0 * ( exp2( nxReflP.y ) - faceSize );
  return texture2D( nxRefl, ( uv + org ) * nxReflT.xy ).rgb; }
vec3 nxCube( vec3 d, float rough, vec2 org ) {
  float mip = clamp( nxRoughMip( rough ), - 2.0, nxReflP.y ), mipF = fract( mip ), mipInt = floor( mip );
  vec3 c = nxCube1( d, mipInt, org ); if ( mipF > 0.0 ) c = mix( c, nxCube1( d, mipInt + 1.0, org ), mipF ); return c; }
// wp: world position, v / n: view-space view direction and normal, localE: how much light arrives here
vec3 nxRoom( vec3 wp, vec3 v, vec3 n, float rough, float localE ) {
  vec3 r = reflect( - v, n ); r = inverseTransformDirection( normalize( mix( r, n, rough * rough ) ), viewMatrix );
  int row = int( floor( texture2D( nxReflI, wp.xz * nxReflP.x ).r * 255.0 + 0.5 ) );
  vec4 d0 = texelFetch( nxReflD, ivec2( 0, row ), 0 ), d1 = texelFetch( nxReflD, ivec2( 1, row ), 0 ), d2 = texelFetch( nxReflD, ivec2( 2, row ), 0 );
  vec3 rd = vec3( abs( r.x ) < 1e-4 ? 1e-4 : r.x, abs( r.y ) < 1e-4 ? 1e-4 : r.y, abs( r.z ) < 1e-4 ? 1e-4 : r.z );
  vec3 tm = ( mix( d1.xyz, d2.xyz, step( 0.0, rd ) ) - wp ) / rd; float t = max( min( min( tm.x, tm.y ), tm.z ), 0.0 );
  vec3 e = min( wp - d1.xyz, d2.xyz - wp ); float inside = step( - 0.35, min( min( e.x, e.y ), e.z ) );
  vec3 c = nxCube( normalize( inside > 0.5 ? wp + rd * t - d0.xyz : r ), rough, vec2( d0.w, d1.w ) );
  return c * mix( clamp( localE / max( d2.w, 0.05 ), 0.0, 1.0 ), 1.0, inside ); }
`,
  // the sun as a light with the given visibility (0..1)
  GLSL_SUN: `
  {
    IncidentLight nxL; nxL.direction = normalize( ( viewMatrix * vec4( nxSunDir, 0.0 ) ).xyz ); nxL.color = nxSunCol * nxS; nxL.visible = true;
    RE_Direct( nxL, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
  }
`,
  // static world: lightmap (or baked vertex light) + sun + reflections scaled by how lit the spot is.
  // o: macro (0 = no large-scale variation), glass, noShadow, haze (distant scenery fades into the sky)
  patchStatic(mat, S, o) {
    o = o || {}; const T = S.tier, hasSun = !!S.W.sun, dir = !!(T.dir && !o.noDir && S.lmB), shadow = hasSun && T.shadow > 0 && !o.noShadow, macro = o.macro === 0 ? 0 : 1, room = T.refl > 0 && !o.haze;
    mat.lightMap = S.lmA; mat.lightMapIntensity = 1; mat.userData.nx = 1;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, S.uni, { nxMacro: { value: o.macro == null ? 1 : o.macro } });
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute vec4 nxl; varying vec4 vNxl; varying vec3 vNxW;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\n vNxl = nxl; vNxW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;");
      let f = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec4 vNxl; varying vec3 vNxW; uniform sampler2D nxDirMap, nxNoise; uniform vec3 nxSunDir, nxSunCol; uniform vec4 nxK, nxHaze; uniform float nxMacro;\n" + (shadow ? NX.GLSL_SHADOW : "") + (room ? NX.GLSL_REFL : ""));
      if (macro) f = f.replace("#include <map_fragment>", "#include <map_fragment>\n vec3 nxN3 = texture2D( nxNoise, vNxW.xz * 0.043 + vNxW.y * 0.071 ).rgb; diffuseColor.rgb *= 1.0 + ( nxN3.r * 0.6 + nxN3.g * 0.4 - 0.5 ) * 0.34 * nxMacro;\n")
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n roughnessFactor = clamp( roughnessFactor * ( 1.0 + ( texture2D( nxNoise, vNxW.xz * 0.19 + vNxW.y * 0.13 ).g - 0.5 ) * 0.5 * nxMacro ), 0.03, 1.0 );\n");
      f = f.replace("#include <lights_fragment_maps>", `
  vec4 nxA = texture2D( lightMap, vLightMapUv );
  vec3 nxE = ( nxA.rgb * nxA.rgb + vNxl.rgb * vNxl.rgb ) * ${NX.LM_SCALE.toFixed(1)};
  float nxS = nxA.a + vNxl.a;
` + (dir ? `  vec4 nxB = texture2D( nxDirMap, vLightMapUv );
  vec3 nxD = normalize( ( viewMatrix * vec4( nxB.xyz * 2.0 - 1.0, 0.0 ) ).xyz + nonPerturbedNormal * 0.001 );
  nxE *= mix( 1.0, clamp( max( dot( geometryNormal, nxD ), 0.0 ) / max( dot( nonPerturbedNormal, nxD ), 0.2 ), 0.0, 2.2 ), nxB.a * nxK.z );
` : "") + `  irradiance += nxE;
  float nxEl = dot( nxE, vec3( 0.2126, 0.7152, 0.0722 ) );
#if defined( RE_IndirectSpecular )
` + (room ? `  if ( nxReflP.w > 0.5 ) radiance += nxRoom( vNxW + inverseTransformDirection( nonPerturbedNormal, viewMatrix ) * 0.06, geometryViewDir, geometryNormal, material.roughness, nxEl );
  else
` : "") + `  {
#ifdef USE_ENVMAP
    radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness ) * clamp( nxEl * nxK.x + nxS * nxK.w, nxK.y, 1.0 );
#endif
  }
#endif
` + (hasSun ? (shadow ? "  if ( nxS > 0.004 ) nxS *= nxDynShadow( vNxW );\n" : "") + NX.GLSL_SUN : ""));
      if (o.glass) f = f.replace("#include <opaque_fragment>", "gl_FragColor = vec4( ( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance ) * diffuseColor.a + reflectedLight.directSpecular + reflectedLight.indirectSpecular, diffuseColor.a );").replace("#include <premultiplied_alpha_fragment>", "");
      // far scenery: fade into the sky colour along the view ray instead of the room's fog
      if (o.haze) f = f.replace("#include <fog_fragment>", `
#ifdef ENVMAP_TYPE_CUBE_UV
  { vec3 nxV = normalize( vNxW - cameraPosition ); float nxF = 1.0 - exp( - distance( vNxW, cameraPosition ) * nxHaze.x );
    vec3 nxSky = textureCubeUV( envMap, normalize( vec3( nxV.x, max( nxV.y, 0.0 ) * 0.6 + 0.04, nxV.z ) ), 0.42 ).rgb;
    gl_FragColor.rgb = mix( gl_FragColor.rgb, nxSky * nxHaze.y, nxF ); }
#endif
`);
      sh.fragmentShader = f;
    };
    mat.customProgramCacheKey = () => "nxS" + (dir ? 1 : 0) + (hasSun ? 1 : 0) + (shadow ? 1 : 0) + (o.glass ? 1 : 0) + macro + (o.haze ? 1 : 0) + (room ? 1 : 0);
    return mat;
  },
  // moving things (players, guns, props): lit by the baked light probes around them, the sun and the shadow map.
  // The probes live in one small texture that the shader reads by world position, so materials can be shared freely.
  patchDynamic(mat, S, o) {
    o = o || {}; const T = S.tier, hasSun = !!S.W.sun, shadow = hasSun && T.shadow > 0 && !o.noShadow, room = T.refl > 0;
    mat.userData.nx = 2; const ex = mat.userData.exObc;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, S.uni);
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vNxW;")
        .replace("#include <project_vertex>", "#include <project_vertex>\n{ vec4 nxWp = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\n nxWp = instanceMatrix * nxWp;\n#endif\n vNxW = ( modelMatrix * nxWp ).xyz; }");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vNxW; uniform highp sampler2D nxProbe; uniform vec4 nxProbeP; uniform vec3 nxSunDir, nxSunCol; uniform vec4 nxK;\n" + (shadow ? NX.GLSL_SHADOW : "") + (room ? NX.GLSL_REFL : ""))
        .replace("#include <lights_fragment_maps>", `
  vec3 nxNw = inverseTransformDirection( geometryNormal, viewMatrix );
  vec2 nxPu = clamp( vNxW.xz * nxProbeP.x, vec2( nxProbeP.y ), vec2( 1.0 - nxProbeP.y ) ); nxPu.x *= 0.25;
  if ( nxProbeP.w > 1.5 ) nxPu.y = ( nxPu.y + step( nxProbeP.z, vNxW.y ) ) / nxProbeP.w;
  vec4 nxP0 = texture2D( nxProbe, nxPu );
  vec3 nxE = nxP0.rgb + texture2D( nxProbe, nxPu + vec2( 0.25, 0.0 ) ).rgb * nxNw.x + texture2D( nxProbe, nxPu + vec2( 0.5, 0.0 ) ).rgb * nxNw.y + texture2D( nxProbe, nxPu + vec2( 0.75, 0.0 ) ).rgb * nxNw.z;
  nxE = max( nxE, nxP0.rgb * 0.15 );
  float nxS = nxP0.a;
  irradiance += nxE;
  float nxEl = dot( nxP0.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
#if defined( RE_IndirectSpecular )
` + (room ? `  if ( nxReflP.w > 0.5 ) radiance += nxRoom( vNxW, geometryViewDir, geometryNormal, material.roughness, nxEl );
  else
` : "") + `  {
#ifdef USE_ENVMAP
    radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness ) * clamp( nxEl * nxK.x + nxS * nxK.w, nxK.y, 1.0 );
#endif
  }
#endif
` + (hasSun ? (shadow ? "  if ( nxS > 0.004 ) nxS *= nxDynShadow( vNxW + inverseTransformDirection( nonPerturbedNormal, viewMatrix ) * 0.04 );\n" : "") + NX.GLSL_SUN : ""));
      if (ex) ex.call(mat, sh);   // a material's own extra (e.g. the people's clothing colours) on top of the engine light
    };
    mat.customProgramCacheKey = () => "nxD" + (hasSun ? 1 : 0) + (shadow ? 1 : 0) + (room ? 1 : 0) + (ex ? mat.userData.exKey : "");
    mat.needsUpdate = true;
    return mat;
  },
};
