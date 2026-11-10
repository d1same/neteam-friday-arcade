// ======================= NX post: the camera =======================
// The world is drawn in real light units into a floating-point picture; this turns it into what a camera would record:
// exposure that adapts like an eye, glow around bright things, soft contact shadows, a film-like tone curve, a grade,
// vignette, grain and edge smoothing. Each quality level switches parts of it off.
const NXP = {
  // the AgX tone curve (Blender / Filament): bright saturated lights roll off to white instead of clipping to a flat colour
  GLSL_TONE: `
vec3 nxAgx( vec3 c, float power, float sat ) {
  const mat3 toRec2020 = mat3( vec3( 0.6274, 0.0691, 0.0164 ), vec3( 0.3293, 0.9195, 0.0880 ), vec3( 0.0433, 0.0113, 0.8956 ) );
  const mat3 fromRec2020 = mat3( vec3( 1.6605, -0.1246, -0.0182 ), vec3( -0.5876, 1.1329, -0.1006 ), vec3( -0.0728, -0.0083, 1.1187 ) );
  const mat3 inset = mat3( vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ), vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ), vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 ) );
  const mat3 outset = mat3( vec3( 1.1271005818144368, -0.1413297634984383, -0.14132976349843826 ), vec3( -0.11060664309660323, 1.157823702216272, -0.11060664309660294 ), vec3( -0.016493938717834573, -0.016493938717834257, 1.2519364065950405 ) );
  c = inset * ( toRec2020 * c );
  c = clamp( ( log2( max( c, 1e-10 ) ) + 12.47393 ) / 16.5, 0.0, 1.0 );
  vec3 x2 = c * c, x4 = x2 * x2;
  c = 15.5 * x4 * x2 - 40.14 * x4 * c + 31.96 * x4 - 6.868 * x2 * c + 0.4298 * x2 + 0.1191 * c - 0.00232;
  float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
  c = pow( max( c, 0.0 ), vec3( power ) ); c = l + sat * ( c - l );
  c = outset * c;
  c = pow( max( c, 0.0 ), vec3( 2.2 ) );
  return clamp( fromRec2020 * c, 0.0, 1.0 );
}
vec3 nxSrgb( vec3 c ) { return mix( c * 12.92, 1.055 * pow( max( c, 0.0 ), vec3( 1.0 / 2.4 ) ) - 0.055, step( 0.0031308, c ) ); }
float nxHash( vec2 p ) { vec3 q = fract( vec3( p.xyx ) * 0.1031 ); q += dot( q, q.yzx + 33.33 ); return fract( ( q.x + q.y ) * q.z ); }`,

  // look: expo, key (scene brightness the exposure aims for), auto (0 = fixed exposure .. 1 = full compensation), lo / hi (exposure limits),
  // bloom, thr (glow threshold), vig, grain, ca, contrast, sat, tint, ao
  create(renderer, S, look) {
    const T = THREE, tier = S ? S.tier : NX.tier(), L = Object.assign({ expo: 1, key: 0.2, auto: 0.5, lo: 0.62, hi: 1.7, bloom: 0.55, thr: 1.05, vig: 0.3, grain: 0.03, ca: 0.0022, contrast: 1.2, sat: 1.16, tint: [1, 1, 1], ao: 0.85, aoR: 0.55 }, look || {});
    renderer.toneMapping = T.NoToneMapping; renderer.setClearColor(0x000000, 1); renderer.autoClear = true;
    const P = { look: L, tier, w: 0, h: 0, cw: 0, ch: 0, last: 0, frame: 0, flip: 0, v2: new T.Vector2(), drs: (store("nfa-gfx") || {}).drs !== 0 };
    const rt = (o) => new T.WebGLRenderTarget(4, 4, Object.assign({ type: T.HalfFloatType, depthBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter, generateMipmaps: false }, o));
    const pass = (fs, uniforms, defines) => { const m = new T.ShaderMaterial({ uniforms, vertexShader: NXS.VS, fragmentShader: fs, depthTest: false, depthWrite: false, defines: defines || {} }); return { m, q: NXS.quad(m), u: uniforms }; };
    P.scene = rt({ depthBuffer: true, samples: tier.msaa });
    if (tier.ao) P.scene.depthTexture = new T.DepthTexture(4, 4, T.UnsignedIntType);
    const N = tier.bloom; P.D = []; P.U = []; for (let i = 0; i < N; i++) { P.D.push(rt()); if (i < N - 1) P.U.push(rt()); }
    P.expo = [rt({ minFilter: T.NearestFilter, magFilter: T.NearestFilter }), rt({ minFilter: T.NearestFilter, magFilter: T.NearestFilter })]; P.expo.forEach(e => e.setSize(1, 1));
    if (tier.ao) { P.aoA = rt({ format: T.RGFormat }); P.aoB = rt({ format: T.RGFormat }); }
    if (tier.fxaa) P.ldr = new T.WebGLRenderTarget(4, 4, { depthBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter, generateMipmaps: false });
    const LUM = "vec3( 0.2126, 0.7152, 0.0722 )";

    // glow source: what is brighter than the threshold after exposure. Alpha carries plain scene brightness for the light meter.
    P.pre = pass(`uniform sampler2D tScene, tExpo; uniform vec4 uP; varying vec2 vUv;
void main(){ vec3 a = texture2D( tScene, vUv + uP.xy * vec2( -1.0, -1.0 ) ).rgb, b = texture2D( tScene, vUv + uP.xy * vec2( 1.0, -1.0 ) ).rgb, c = texture2D( tScene, vUv + uP.xy * vec2( -1.0, 1.0 ) ).rgb, d = texture2D( tScene, vUv + uP.xy * vec2( 1.0, 1.0 ) ).rgb;
  float la = dot( a, ${LUM} ), lb = dot( b, ${LUM} ), lc = dot( c, ${LUM} ), ld = dot( d, ${LUM} ), wa = 1.0 / ( 1.0 + la ), wb = 1.0 / ( 1.0 + lb ), wc = 1.0 / ( 1.0 + lc ), wd = 1.0 / ( 1.0 + ld );
  vec3 col = ( a * wa + b * wb + c * wc + d * wd ) / ( wa + wb + wc + wd ) * texture2D( tExpo, vec2( 0.5 ) ).r;
  float br = max( col.r, max( col.g, col.b ) ), kn = uP.w, s = clamp( br - uP.z + kn, 0.0, 2.0 * kn ); s = s * s / ( 4.0 * kn + 1e-4 );
  col *= max( s, br - uP.z ) / max( br, 1e-4 );
  gl_FragColor = vec4( min( col, vec3( 64.0 ) ), min( ( la + lb + lc + ld ) * 0.25, 10.0 ) ); }`, { tScene: { value: null }, tExpo: { value: null }, uP: { value: new T.Vector4() } });
    P.down = pass(`uniform sampler2D t; uniform vec2 uP; varying vec2 vUv;
void main(){ gl_FragColor = ( texture2D( t, vUv ) * 4.0 + texture2D( t, vUv + uP ) + texture2D( t, vUv - uP ) + texture2D( t, vUv + vec2( uP.x, -uP.y ) ) + texture2D( t, vUv + vec2( -uP.x, uP.y ) ) ) * 0.125; }`, { t: { value: null }, uP: { value: new T.Vector2() } });
    P.up = pass(`uniform sampler2D tLow, tHigh; uniform vec4 uP; varying vec2 vUv;
void main(){ vec3 lo = ( texture2D( tLow, vUv + uP.xy ).rgb + texture2D( tLow, vUv - uP.xy ).rgb + texture2D( tLow, vUv + vec2( uP.x, -uP.y ) ).rgb + texture2D( tLow, vUv + vec2( -uP.x, uP.y ) ).rgb ) * 0.25;
  gl_FragColor = vec4( texture2D( tHigh, vUv ).rgb * uP.z + lo * uP.w, 1.0 ); }`, { tLow: { value: null }, tHigh: { value: null }, uP: { value: new T.Vector4() } });
    // light meter: eases the exposure towards what the scene needs (quicker when it gets brighter, like an eye)
    P.adapt = pass(`uniform sampler2D tLum, tPrev; uniform vec4 uP, uQ; varying vec2 vUv;
void main(){ float l = texture2D( tLum, vec2( 0.5 ) ).a * 0.36 + ( texture2D( tLum, vec2( 0.3, 0.35 ) ).a + texture2D( tLum, vec2( 0.7, 0.35 ) ).a + texture2D( tLum, vec2( 0.3, 0.65 ) ).a + texture2D( tLum, vec2( 0.7, 0.65 ) ).a ) * 0.16;
  float want = clamp( uP.x * pow( uP.y / max( l, 0.01 ), uP.z ), uP.x * uQ.x, uP.x * uQ.y ), prev = texture2D( tPrev, vec2( 0.5 ) ).r;
  float e = uQ.z > 0.5 ? want : mix( prev, want, 1.0 - exp( - uP.w * ( want < prev ? 3.2 : 1.3 ) ) );
  gl_FragColor = vec4( e, l, 0.0, 1.0 ); }`, { tLum: { value: null }, tPrev: { value: null }, uP: { value: new T.Vector4() }, uQ: { value: new T.Vector4() } });
    if (tier.ao) {
      // contact shadows from the depth picture: how much of the hemisphere above each pixel is blocked by nearby surfaces
      P.ao = pass(`uniform sampler2D tDepth; uniform vec4 uProj, uAO; uniform vec2 uInv; varying vec2 vUv;
float vz( vec2 uv ) { float d = texture2D( tDepth, uv ).r; return uProj.z * uProj.w / ( uProj.w - d * ( uProj.w - uProj.z ) ); }
vec3 vp( vec2 uv, float z ) { return vec3( ( uv * 2.0 - 1.0 ) * uProj.xy * z, z ); }
void main(){ float zc = vz( vUv ); if ( zc > uProj.w * 0.5 ) { gl_FragColor = vec4( 1.0, 1.0, 0.0, 1.0 ); return; }
  vec3 pc = vp( vUv, zc ), pr = vp( vUv + vec2( uInv.x, 0.0 ), vz( vUv + vec2( uInv.x, 0.0 ) ) ), pl = vp( vUv - vec2( uInv.x, 0.0 ), vz( vUv - vec2( uInv.x, 0.0 ) ) ), pu = vp( vUv + vec2( 0.0, uInv.y ), vz( vUv + vec2( 0.0, uInv.y ) ) ), pd = vp( vUv - vec2( 0.0, uInv.y ), vz( vUv - vec2( 0.0, uInv.y ) ) );
  vec3 dx = abs( pr.z - pc.z ) < abs( pc.z - pl.z ) ? pr - pc : pc - pl, dy = abs( pu.z - pc.z ) < abs( pc.z - pd.z ) ? pu - pc : pc - pd, n = normalize( cross( dx, dy ) ); if ( n.z > 0.0 ) n = -n;
  float R = uAO.x * clamp( zc * 0.35, 0.35, 1.6 ), rs = min( R / zc, 0.28 ), a0 = nxHash( gl_FragCoord.xy ) * 6.2831853, occ = 0.0;
  for ( int i = 0; i < NS; i ++ ) { float f = ( float( i ) + 0.5 ) / float( NS ), a = a0 + float( i ) * 2.39996; vec2 uv = vUv + vec2( cos( a ), sin( a ) ) * sqrt( f ) * rs * vec2( 0.5 / uProj.x, 0.5 / uProj.y );
    vec3 v = vp( uv, vz( uv ) ) - pc; float d2 = dot( v, v ); occ += max( 0.0, dot( v, n ) / sqrt( d2 + 1e-5 ) - 0.1 ) * max( 0.0, 1.0 - d2 / ( R * R ) ); }
  gl_FragColor = vec4( clamp( 1.0 - occ * uAO.y / float( NS ), 0.0, 1.0 ), zc / uProj.w, 0.0, 1.0 ); }`.replace("void main", "float nxHash( vec2 p ) { vec3 q = fract( vec3( p.xyx ) * 0.1031 ); q += dot( q, q.yzx + 33.33 ); return fract( ( q.x + q.y ) * q.z ); }\nvoid main"), { tDepth: { value: null }, uProj: { value: new T.Vector4() }, uAO: { value: new T.Vector4() }, uInv: { value: new T.Vector2() } }, { NS: tier.ao > 1 ? 12 : 8 });
      // smooth the noise without bleeding across depth edges
      P.aoBlur = pass(`uniform sampler2D t; uniform vec2 uP; varying vec2 vUv;
void main(){ vec2 c = texture2D( t, vUv ).rg; float s = 0.0, w = 0.0;
  for ( int y = -1; y <= 2; y ++ ) for ( int x = -1; x <= 2; x ++ ) { vec2 q = texture2D( t, vUv + ( vec2( float( x ), float( y ) ) - 0.5 ) * uP ).rg; float k = max( 0.0, 1.0 - abs( q.g - c.g ) / ( c.g * 0.04 + 1e-5 ) ); s += q.r * k; w += k; }
  gl_FragColor = vec4( w > 0.0 ? s / w : c.r, c.g, 0.0, 1.0 ); }`, { t: { value: null }, uP: { value: new T.Vector2() } });
    }
    // light shafts (High and Ultra, maps with a sun): the bright sky around the sun, wherever nothing stands in front of it,
    // smeared away from the sun across the picture at quarter size. Walls, roofs and people cut dark gaps into it.
    P.shK = 0;
    if (tier.ao && S && S.W && S.W.sun) { const E = S.W.sun.E || [8, 8, 8]; P.shK = L.shafts == null ? 0.5 * Math.min(1, 0.45 + (0.2126 * E[0] + 0.7152 * E[1] + 0.0722 * E[2]) / 8) : L.shafts; }   // moonlight gets about half
    if (P.shK) {
      P.shA = rt(); P.shB = rt(); P.v3 = new T.Vector3(); P.v3b = new T.Vector3();
      P.shMask = pass(`uniform sampler2D tScene, tDepth, tExpo; uniform vec4 uS; varying vec2 vUv;
void main(){ float sky = step( 0.99995, texture2D( tDepth, vUv ).r ); vec3 c = min( texture2D( tScene, vUv ).rgb * texture2D( tExpo, vec2( 0.5 ) ).r, vec3( 6.0 ) );
  vec2 q = ( vUv - uS.xy ) * vec2( uS.z, 1.0 ); float d2 = dot( q, q ), glow = exp( - d2 * 9.0 ) + 0.22 * exp( - sqrt( d2 ) * 2.6 );
  gl_FragColor = vec4( c * sky * glow, 1.0 ); }`, { tScene: { value: null }, tDepth: { value: null }, tExpo: { value: null }, uS: { value: new T.Vector4() } });
      P.shBlur = pass(`uniform sampler2D t; uniform vec4 uS; varying vec2 vUv;
float nxHash( vec2 p ) { vec3 q = fract( vec3( p.xyx ) * 0.1031 ); q += dot( q, q.yzx + 33.33 ); return fract( ( q.x + q.y ) * q.z ); }
void main(){ vec2 dv = ( uS.xy - vUv ) * uS.w / 14.0; float j = nxHash( gl_FragCoord.xy + uS.z ), w = 1.0, ws = 0.0; vec3 a = vec3( 0.0 );
  for ( int i = 0; i < 14; i ++ ) { a += texture2D( t, vUv + dv * ( float( i ) + j ) ).rgb * w; ws += w; w *= 0.94; }
  gl_FragColor = vec4( a / ws, 1.0 ); }`, { t: { value: null }, uS: { value: new T.Vector4() } });
    }
    const cdef = {}; if (tier.ao) cdef.AO = 1; if (tier.ca) cdef.CA = 1; if (!tier.fxaa) cdef.FINAL = 1; if (look && look.speed && tier.i > 0) cdef.SPD = 1; if (P.shK) cdef.SHAFT = 1;
    P.comp = pass(`uniform sampler2D tScene, tBloom, tAO, tExpo, tShaft; uniform vec4 uA, uB; uniform vec3 uTint; uniform float hurt, uSpd, uShaft; varying vec2 vUv;
${NXP.GLSL_TONE}
void main(){ vec2 d = vUv - 0.5; float r2 = dot( d, d ); vec3 c;
#ifdef CA
  vec2 o = d * ( r2 * uA.w * 4.0 + uA.w * 0.25 ); c = vec3( texture2D( tScene, vUv + o ).r, texture2D( tScene, vUv ).g, texture2D( tScene, vUv - o ).b );
#else
  c = texture2D( tScene, vUv ).rgb;
#endif
#ifdef SPD
  if ( uSpd > 0.002 ) { vec2 sd = d * ( uSpd * 0.02 * smoothstep( 0.03, 0.3, r2 ) ); float sj = nxHash( gl_FragCoord.xy + fract( uB.w ) * 57.0 ); vec3 sa = c; for ( int i = 0; i < 6; i ++ ) sa += texture2D( tScene, vUv - sd * ( float( i ) + sj ) ).rgb; c = sa / 7.0; }
#endif
  float e = texture2D( tExpo, vec2( 0.5 ) ).r; c *= e;
#ifdef AO
  c *= mix( 1.0, texture2D( tAO, vUv ).r, uB.z * ( 1.0 - smoothstep( 0.8, 3.0, dot( c, vec3( 0.2126, 0.7152, 0.0722 ) ) ) ) );
#endif
  c += texture2D( tBloom, vUv ).rgb * uA.x;
#ifdef SHAFT
  if ( uShaft > 0.003 ) c += texture2D( tShaft, vUv ).rgb * uShaft;
#endif
  c *= uTint * ( 1.0 - uA.y * smoothstep( 0.12, 0.85, r2 * 2.0 ) );
  float hv = hurt * smoothstep( 0.02, 0.45, r2 * 1.5 ); c = mix( c, vec3( dot( c, vec3( 0.3, 0.5, 0.2 ) ) * 1.5 + 0.12, 0.0, 0.0 ), hv * 0.8 );
  c = nxSrgb( nxAgx( c, uB.x, uB.y ) );
#ifdef FINAL
  c += ( nxHash( gl_FragCoord.xy + fract( uB.w ) * 311.0 ) - 0.5 ) * uA.z * ( 1.0 - 0.55 * dot( c, vec3( 0.3, 0.5, 0.2 ) ) );
#endif
  gl_FragColor = vec4( c, 1.0 ); }`, { tScene: { value: null }, tBloom: { value: null }, tAO: { value: null }, tExpo: { value: null }, uA: { value: new T.Vector4() }, uB: { value: new T.Vector4() }, uTint: { value: new T.Vector3(1, 1, 1) }, hurt: { value: 0 }, uSpd: { value: 0 }, tShaft: { value: null }, uShaft: { value: 0 } }, cdef);
    P.comp.uniforms = P.comp.u;   // the games set comp.uniforms.hurt
    if (tier.fxaa) P.fxaa = pass(`uniform sampler2D t; uniform vec4 uP; varying vec2 vUv;
float nxHash( vec2 p ) { vec3 q = fract( vec3( p.xyx ) * 0.1031 ); q += dot( q, q.yzx + 33.33 ); return fract( ( q.x + q.y ) * q.z ); }
void main(){ vec2 inv = uP.xy; vec3 lw = vec3( 0.299, 0.587, 0.114 );
  vec3 nw = texture2D( t, vUv + vec2( -1.0, -1.0 ) * inv ).rgb, ne = texture2D( t, vUv + vec2( 1.0, -1.0 ) * inv ).rgb, sw = texture2D( t, vUv + vec2( -1.0, 1.0 ) * inv ).rgb, se = texture2D( t, vUv + vec2( 1.0, 1.0 ) * inv ).rgb, m = texture2D( t, vUv ).rgb;
  float lnw = dot( nw, lw ), lne = dot( ne, lw ), lsw = dot( sw, lw ), lse = dot( se, lw ), lm = dot( m, lw ), lmin = min( lm, min( min( lnw, lne ), min( lsw, lse ) ) ), lmax = max( lm, max( max( lnw, lne ), max( lsw, lse ) ) );
  vec2 dir = vec2( -( ( lnw + lne ) - ( lsw + lse ) ), ( lnw + lsw ) - ( lne + lse ) );
  float red = max( ( lnw + lne + lsw + lse ) * 0.03125, 0.0078125 ), rcp = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + red );
  dir = clamp( dir * rcp, vec2( -8.0 ), vec2( 8.0 ) ) * inv;
  vec3 a = 0.5 * ( texture2D( t, vUv + dir * ( 1.0 / 3.0 - 0.5 ) ).rgb + texture2D( t, vUv + dir * ( 2.0 / 3.0 - 0.5 ) ).rgb ), b = a * 0.5 + 0.25 * ( texture2D( t, vUv - dir * 0.5 ).rgb + texture2D( t, vUv + dir * 0.5 ).rgb );
  float lb = dot( b, lw ); vec3 c = ( lb < lmin || lb > lmax ) ? a : b;
  c += ( nxHash( gl_FragCoord.xy + fract( uP.w ) * 311.0 ) - 0.5 ) * uP.z * ( 1.0 - 0.55 * dot( c, lw ) );
  gl_FragColor = vec4( c, 1.0 ); }`, { t: { value: null }, uP: { value: new T.Vector4() } });

    const resize = (cw, ch, k) => {
      const w = Math.max(64, Math.round(cw * k / 2) * 2), h = Math.max(36, Math.round(ch * k / 2) * 2); if (w === P.w && h === P.h) return;
      P.w = w; P.h = h; P.scene.setSize(w, h); let bw = w, bh = h;
      for (let i = 0; i < N; i++) { bw = Math.max(2, bw >> 1); bh = Math.max(2, bh >> 1); P.D[i].setSize(bw, bh); if (i < N - 1) P.U[i].setSize(bw, bh); }
      if (tier.ao) { P.aoA.setSize(w >> 1, h >> 1); P.aoB.setSize(w >> 1, h >> 1); }
      if (P.ldr) P.ldr.setSize(w, h);
      if (P.shK) { P.shA.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); P.shB.setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); }
    };
    const BW = [0.34, 0.22, 0.16, 0.12, 0.09, 0.07];
    P.render = (scene, cam, t) => {
      const r = renderer, now = performance.now(), dtMs = P.last ? now - P.last : 16.7, dt = Math.min(0.1, dtMs / 1000); P.last = now; P.frame++;
      r.getDrawingBufferSize(P.v2); const cw = P.v2.x, ch = P.v2.y, k = tier.scale * (P.drs ? Math.round(NX.drsTick(dtMs) * 20) / 20 : 1);
      resize(cw, ch, k);
      r.setRenderTarget(P.scene); r.render(scene, cam);
      const eA = P.expo[P.flip], eB = P.expo[1 - P.flip];   // eA: last frame's exposure, eB: this frame's
      // glow
      P.pre.u.tScene.value = P.scene.texture; P.pre.u.tExpo.value = eA.texture; P.pre.u.uP.value.set(1 / P.w, 1 / P.h, L.thr, 0.45); NXS.blit(r, P.pre.q, P.D[0]);
      for (let i = 1; i < N; i++) { P.down.u.t.value = P.D[i - 1].texture; P.down.u.uP.value.set(1 / P.D[i - 1].width, 1 / P.D[i - 1].height); NXS.blit(r, P.down.q, P.D[i]); }
      for (let i = N - 2; i >= 0; i--) { const low = i === N - 2 ? P.D[N - 1] : P.U[i + 1]; P.up.u.tLow.value = low.texture; P.up.u.tHigh.value = P.D[i].texture; P.up.u.uP.value.set(0.5 / low.width, 0.5 / low.height, BW[i], i === N - 2 ? BW[N - 1] : 1); NXS.blit(r, P.up.q, P.U[i]); }
      // exposure for this frame
      P.adapt.u.tLum.value = P.D[N - 1].texture; P.adapt.u.tPrev.value = eA.texture; P.adapt.u.uP.value.set(L.expo, L.key, L.auto, dt); P.adapt.u.uQ.value.set(L.lo, L.hi, P.frame < 3 ? 1 : 0, 0); NXS.blit(r, P.adapt.q, eB); P.flip = 1 - P.flip;
      if (tier.ao) {
        const pm = cam.projectionMatrix.elements; P.ao.u.tDepth.value = P.scene.depthTexture; P.ao.u.uProj.value.set(1 / pm[0], 1 / pm[5], cam.near, cam.far); P.ao.u.uAO.value.set(L.aoR, 2.4, 0, 0); P.ao.u.uInv.value.set(1 / P.w, 1 / P.h); NXS.blit(r, P.ao.q, P.aoA);
        P.aoBlur.u.t.value = P.aoA.texture; P.aoBlur.u.uP.value.set(1 / P.aoA.width, 1 / P.aoA.height); NXS.blit(r, P.aoBlur.q, P.aoB);
      }
      let shf = 0;
      if (P.shK) {
        const sd = S.uni.nxSunDir.value, v = P.v3, f = cam.getWorldDirection(P.v3b), facing = f.dot(sd);
        if (facing > 0.02) {
          cam.getWorldPosition(v).addScaledVector(sd, 1000).project(cam); const off = Math.max(Math.abs(v.x), Math.abs(v.y));
          shf = P.shK * Math.min(1, facing / 0.3) * (1 - Math.min(1, Math.max(0, (off - 1) / 0.8)));
          if (shf > 0.003) {
            const su = v.x * 0.5 + 0.5, sv = v.y * 0.5 + 0.5, mu = P.shMask.u, bu = P.shBlur.u;
            mu.tScene.value = P.scene.texture; mu.tDepth.value = P.scene.depthTexture; mu.tExpo.value = eB.texture; mu.uS.value.set(su, sv, P.w / P.h, 0); NXS.blit(r, P.shMask.q, P.shA);
            bu.t.value = P.shA.texture; bu.uS.value.set(su, sv, (t || 0) % 13, 0.92); NXS.blit(r, P.shBlur.q, P.shB);
            bu.t.value = P.shB.texture; bu.uS.value.set(su, sv, (t || 0) % 7 + 3, 0.92 / 14); NXS.blit(r, P.shBlur.q, P.shA);
          }
        }
        P.comp.u.tShaft.value = P.shA.texture; P.comp.u.uShaft.value = shf;
      }
      const cu = P.comp.u; cu.tScene.value = P.scene.texture; cu.tBloom.value = P.U[0].texture; cu.tAO.value = tier.ao ? P.aoB.texture : null; cu.tExpo.value = eB.texture;
      cu.uA.value.set(L.bloom, L.vig, tier.grain ? L.grain : 0, L.ca); cu.uB.value.set(L.contrast, L.sat, L.ao, (t || 0) % 97); cu.uTint.value.set(L.tint[0], L.tint[1], L.tint[2]);
      if (P.fxaa) { NXS.blit(r, P.comp.q, P.ldr); P.fxaa.u.t.value = P.ldr.texture; P.fxaa.u.uP.value.set(1 / P.w, 1 / P.h, tier.grain ? L.grain : 0, (t || 0) % 97); NXS.blit(r, P.fxaa.q, null); }
      else NXS.blit(r, P.comp.q, null);
      NX.perfEnd(r, P.w, P.h, P.drs ? NX.drs.k : 1);
    };
    // ---- warm-up, behind the loading screen. Everything the match can ever show is drawn once, hidden and off-screen
    // things included, so the graphics card compiles every shader and takes every texture now instead of freezing the
    // picture the first time each one appears in play. Lights stay exactly as they are: their number is part of every shader.
    P.warm = (scene, cam) => {
      const hid = [], cull = [], lit = [];
      const walk = (o, shown) => {
        const vis = shown && o.visible;
        if (o.isLight) { if (!vis && o.visible) { o.visible = false; lit.push(o); } return; }
        if (!o.visible) { o.visible = true; hid.push(o); }
        if (o.frustumCulled) { o.frustumCulled = false; cull.push(o); }
        for (let i = 0; i < o.children.length; i++) walk(o.children[i], vis);
      };
      const t0 = performance.now(), n0 = renderer.info.programs ? renderer.info.programs.length : 0;
      try {
        walk(scene, true);
        if (S && S.shadow) NXS.shadowPass(S);
        P.render(scene, cam, 0);
        if (S) NXS.keep(S);
      } catch (e) { console.warn("[nx] warm-up", e); }
      hid.forEach(o => { o.visible = false; }); lit.forEach(o => { o.visible = true; }); cull.forEach(o => { o.frustumCulled = true; });
      try { renderer.setRenderTarget(null); renderer.setClearColor(0x000000, 1); renderer.clear(); } catch (e) { }
      P.frame = 0; P.last = 0; NX.drsReset();
      console.info("[nx] warm-up " + Math.round(performance.now() - t0) + " ms, " + ((renderer.info.programs ? renderer.info.programs.length : 0) - n0) + " shaders, " + hid.length + " hidden things shown");
    };
    P.dispose = () => { [P.scene, P.aoA, P.aoB, P.ldr, P.shA, P.shB].concat(P.D, P.U, P.expo).forEach(x => { if (x) x.dispose(); }); if (P.scene.depthTexture) P.scene.depthTexture.dispose(); [P.pre, P.down, P.up, P.adapt, P.ao, P.aoBlur, P.comp, P.fxaa, P.shMask, P.shBlur].forEach(x => { if (x) x.m.dispose(); }); };
    return P;
  },
};
