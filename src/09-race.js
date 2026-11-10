// ======================= NETEAM GRAND PRIX: 3D street race through a night-time NYC =======================
const RC_TRACKS = {
  manhattan: { n: "Midnight Manhattan", ctrl: [[0, 0], [70, -8], [135, 0], [178, 32], [186, 84], [160, 126], [116, 134], [92, 108], [66, 98], [42, 128], [0, 146], [-48, 132], [-70, 92], [-48, 58], [-72, 26], [-52, -6]] },
  midtown: { n: "Midtown Grid", ctrl: [[0, 0], [80, -4], [128, 14], [140, 56], [112, 84], [72, 86], [50, 112], [56, 138], [16, 162], [-42, 150], [-68, 110], [-44, 78], [-68, 42], [-46, 6]] },
  bridge: { n: "Bridge Loop", ctrl: [[0, 0], [120, 0], [220, 10], [262, 52], [240, 96], [180, 106], [120, 94], [60, 112], [0, 106], [-50, 80], [-62, 36], [-40, 8]] },
  harbor: { n: "Harbor Sunrise", sky: "dawn", ctrl: [[0, 0], [90, -10], [170, 0], [230, 40], [240, 100], [200, 140], [150, 130], [120, 160], [60, 170], [0, 150], [-40, 110], [-30, 60], [-50, 20]] },
  neon: { n: "Neon Hairpins", sky: "neon", ctrl: [[0, 0], [70, 0], [130, 12], [150, 50], [120, 80], [70, 82], [50, 115], [75, 150], [130, 150], [165, 180], [140, 222], [60, 232], [-20, 215], [-55, 170], [-35, 125], [-60, 75], [-45, 25]] },
  queens: { n: "Queens Express", sky: "storm", ctrl: [[0, 0], [150, 0], [260, 10], [300, 50], [290, 100], [240, 120], [150, 110], [90, 135], [20, 135], [-30, 100], [-40, 50], [-25, 15]] },
};
// sky looks per track: gradient stops, fog colour/density, hemisphere sky/ground, key light colour/intensity, street-lamp strength
const RC_SKY = {
  dusk: { st: [[0, "#05061a"], [0.35, "#1a1446"], [0.47, "#5a2a6a"], [0.5, "#ff8a5c"], [0.53, "#2a1a48"], [1, "#120e26"]], fog: 0x1c1438, fd: 0.0042, hs: 0x8a90ff, hg: 0x2a1830, hi: 1.1, kc: 0xffd7b0, ki: 1.6, lamp: 30, exp: 1.0 },
  dawn: { st: [[0, "#2a3c6e"], [0.3, "#6b77b0"], [0.44, "#e89aa0"], [0.5, "#ffc48a"], [0.53, "#7a6a8a"], [1, "#3a3048"]], fog: 0x9a8090, fd: 0.0036, hs: 0xffd2b8, hg: 0x4a3a40, hi: 1.9, kc: 0xffc890, ki: 2.6, lamp: 8, exp: 1.05 },
  neon: { st: [[0, "#06010f"], [0.35, "#22063a"], [0.47, "#5a0a5a"], [0.5, "#ff2fd0"], [0.53, "#1a0636"], [1, "#0a0216"]], fog: 0x2a0838, fd: 0.005, hs: 0xd070ff, hg: 0x10203a, hi: 1.0, kc: 0x5cf0ff, ki: 1.4, lamp: 34, exp: 1.0 },
  storm: { st: [[0, "#0a1014"], [0.35, "#1c2a30"], [0.47, "#33464c"], [0.5, "#7a9aa0"], [0.53, "#25343a"], [1, "#0e1416"]], fog: 0x24323a, fd: 0.0055, hs: 0x9fc4d0, hg: 0x1a2024, hi: 1.3, kc: 0xcfe6ff, ki: 1.2, lamp: 30, exp: 1.0 },
};
const RC_HW = 8, RC_WALL = 13, RC_LAPS = 3, RC_M = 48;
let RC_ID = "", RC = null, RC_PADS = [], RC_BOXES = [];
function rcSetTrack(id) {
  if (!RC_TRACKS[id]) id = "manhattan"; if (id === RC_ID) return; RC_ID = id;
  RC = rcBuild(RC_TRACKS[id].ctrl);
  // boost pads: [sample index, lateral offset]
  RC_PADS = [[0.08, 0], [0.2, -4], [0.36, 4], [0.5, 0], [0.64, -4], [0.8, 3], [0.92, -3]].map(([f, l]) => [Math.round(f * RC.N), l]);
  RC_BOXES = [0.14, 0.43, 0.72].flatMap(f => [-5, -1.7, 1.7, 5].map(l => [Math.round(f * RC.N), l]));
}
function rcBuild(P) {
  // closed Catmull-Rom spline sampled to ~1.6 unit steps
  const n = P.length, raw = [];
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      raw.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  const resample = (src) => {
    let len = 0; const cum = [0];
    for (let i = 1; i <= src.length; i++) { const a = src[i - 1], b = src[i % src.length]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); cum.push(len); }
    const N = Math.round(len / 1.6), out = []; let j = 0;
    for (let k = 0; k < N; k++) {
      const d = k / N * len; while (cum[j + 1] < d) j++;
      const a = src[j], b = src[(j + 1) % src.length], f = (d - cum[j]) / (cum[j + 1] - cum[j] || 1);
      out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    }
    return { out, len };
  };
  // round off any corner tighter than the barriers: otherwise the inner wall folds over itself and cars get snapped around
  const radius = (q) => { const M = q.length; return q.map((p, i) => { const a = q[(i - 4 + M) % M], c = q[(i + 4) % M]; const ab = Math.hypot(p[0] - a[0], p[1] - a[1]), bc = Math.hypot(c[0] - p[0], c[1] - p[1]), ac = Math.hypot(c[0] - a[0], c[1] - a[1]); const cr = Math.abs((p[0] - a[0]) * (c[1] - a[1]) - (p[1] - a[1]) * (c[0] - a[0])); return cr < 1e-6 ? 1e9 : ab * bc * ac / (2 * cr); }); };
  let q = resample(raw).out;
  for (let it = 0; it < 400; it++) {
    const r = radius(q), M = q.length, mark = new Uint8Array(M); let bad = 0;
    for (let i = 0; i < M; i++) if (r[i] < 24) { bad++; for (let k = -4; k <= 4; k++) mark[(i + k + M) % M] = 1; }
    if (!bad) break;
    q = q.map((p, jj) => { if (!mark[jj]) return p; const a = q[(jj - 1 + M) % M], c = q[(jj + 1) % M]; return [p[0] + ((a[0] + c[0]) / 2 - p[0]) * 0.4, p[1] + ((a[1] + c[1]) / 2 - p[1]) * 0.4]; });
  }
  const rs = resample(q), pts = rs.out, N = pts.length, len = rs.len;
  const tan = pts.map((p, i) => { const q = pts[(i + 1) % N], o = pts[(i - 1 + N) % N]; const dx = q[0] - o[0], dz = q[1] - o[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; });
  const curv = pts.map((p, i) => { const a = tan[(i - 3 + N) % N], b = tan[(i + 3) % N]; return Math.abs(Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1])); });
  let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; pts.forEach(p => { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mnz = Math.min(mnz, p[1]); mxz = Math.max(mxz, p[1]); });
  // slide the whole track so it sits RC_M metres inside the positive quarter: the baked-light grid starts at 0, 0
  const ox = RC_M - Math.floor(mnx), oz = RC_M - Math.floor(mnz); pts.forEach(p => { p[0] += ox; p[1] += oz; });
  return { pts, tan, curv, N, len, box: [mnx + ox, mxx + ox, mnz + oz, mxz + oz] };
}
rcSetTrack("manhattan");
// the track as a world for the NX engine: an open grid of 4 m cells that only carries the baked light
function rcWorld(id) {
  if (!RC_TRACKS[id]) id = "manhattan"; const T = RC_TRACKS[id], R = id === RC_ID ? RC : rcBuild(T.ctrl), G = Math.ceil((Math.max(R.box[1], R.box[3]) + RC_M) / 4);
  return { n: T.n, theme: "race", rows: Array(G).fill(".".repeat(G)), fp: G > 100 ? 6 : 8, ps: 4, noRefl: true, track: R, sky: T.sky || "dusk", tid: id, hw: RC_HW, wall: RC_WALL };
}
function rcNearest(x, z, hint) {
  const N = RC.N; let best = -1, bd = 1e18;
  const scan = (i) => { const p = RC.pts[i], d = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (d < bd) { bd = d; best = i; } };
  if (hint == null || hint < 0) for (let i = 0; i < N; i++) scan(i);
  else for (let k = -40; k <= 40; k++) scan((hint + k + N) % N);
  if (hint != null && hint >= 0 && bd > (RC_WALL + 6) ** 2) return rcNearest(x, z, -1);
  const p = RC.pts[best], tg = RC.tan[best];
  const lat = (x - p[0]) * -tg[1] + (z - p[1]) * tg[0];
  return { i: best, lat };
}
function rcWrap(d) { const N = RC.N; d = ((d % N) + N) % N; return d > N / 2 ? d - N : d; }
const rcAt = (i, lat) => { const p = RC.pts[((i % RC.N) + RC.N) % RC.N], tg = RC.tan[((i % RC.N) + RC.N) % RC.N]; return [p[0] - tg[1] * lat, p[1] + tg[0] * lat]; };
const rcHead = (i) => { const tg = RC.tan[((i % RC.N) + RC.N) % RC.N]; return Math.atan2(tg[0], tg[1]); };
// ---- driving
const RC_MAX = 44, RC_BOOST = 62, RC_GRASS = 20;
// pickups: drive through a glowing data packet to grab one
const RC_ITEMS = [null,
  { n: "EMP BLAST", c: "#4cc9f0", d: "Slows the car ahead" },
  { n: "COFFEE SPILL", c: "#d08a4a", d: "Drops a slick behind you" },
  { n: "SHOCKWAVE", c: "#ff6a1a", d: "Punches nearby cars" },
  { n: "FIREWALL", c: "#3ddc97", d: "Shield for 4 s" },
  { n: "TURBO", c: "#ff4d5e", d: "Instant boost" },
  { n: "PACKET BOMB", c: "#ffb347", d: "Lob a bomb up the road" },
  { n: "SMOKE SCREEN", c: "#c9ced8", d: "Blind whoever's behind" }];
// front blaster: everyone has one. Overheats after 6 quick shots.
const RC_BOLT_SPD = 78, RC_BOLT_LIFE = 0.8, RC_HEAT_MAX = 6;


// shared car physics (used by the client for its own car and by the host for bots)
function rcDrive(c, dt, gas, steer, drift, isBot) {
  const near = rcNearest(c.x, c.z, c.i); c.i = near.i;
  const off = Math.abs(near.lat) > RC_HW + 0.6;
  c.bo = Math.max(0, (c.bo || 0) - dt); c.slow = Math.max(0, (c.slow || 0) - dt); c.spin = Math.max(0, (c.spin || 0) - dt); if (isBot) c.hitT = Math.max(0, (c.hitT || 0) - dt);
  if (c.spin > 0) { gas = 0; drift = false; c.a += dt * 10 * (c.spinDir || 1); c.v -= Math.sign(c.v) * Math.min(Math.abs(c.v), 26 * dt); }
  const tow = off ? 0 : c.tow || 0;   // slipstream: thinner air right behind another car
  const top = ((c.bo > 0 ? RC_BOOST : RC_MAX) + tow * 5) * (off ? RC_GRASS / RC_MAX : 1) * (c.skill || 1) * (c.slow > 0 ? 0.5 : 1);
  if (gas > 0) c.v += (c.v < top ? (c.bo > 0 ? 40 : 24 + tow * 9) : -30) * gas * dt;
  else if (gas < 0) c.v -= (c.v > 0 ? 46 : 14) * -gas * dt;
  else c.v -= Math.sign(c.v) * Math.min(Math.abs(c.v), 9 * dt);
  if (c.v > top) c.v = Math.max(top, c.v - 34 * dt);
  c.v = clamp(c.v, -12, RC_BOOST + 4);
  const sp = Math.abs(c.v);
  // drift: tighter turns, charge a mini-boost while sliding
  const drifting = drift && sp > 18 && Math.abs(steer) > 0.2;
  const turn = steer * (drifting ? 2.3 : 1.6) * Math.min(1, sp / 10) / (1 + sp / 70);
  c.a -= turn * dt * Math.sign(c.v || 1);
  if (drifting) { c.dc = Math.min(2.2, (c.dc || 0) + dt); c.slip = lerp(c.slip || 0, steer * 0.42, 0.15); c.v -= 4 * dt; }
  else { if ((c.dc || 0) > 0.6) { c.bo = Math.max(c.bo, Math.min(1.4, c.dc * 0.6)); c.boEv = (c.boEv || 0) + 1; } c.dc = 0; c.slip = lerp(c.slip || 0, 0, 0.2); }
  const ma = c.a + (c.slip || 0);
  c.x += Math.sin(ma) * c.v * dt; c.z += Math.cos(ma) * c.v * dt;
  // barrier walls
  const n2 = rcNearest(c.x, c.z, c.i); c.i = n2.i;
  if (Math.abs(n2.lat) > RC_WALL) {
    const lat = Math.sign(n2.lat) * RC_WALL, p = rcAt(n2.i, lat); c.x = p[0]; c.z = p[1];
    const h = rcHead(n2.i); let da = ((c.a - h + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    // a square hit costs speed at once; a glancing one scrapes along the barrier and only rubs a little off (the same at any frame rate)
    const sq = Math.min(1, Math.abs(Math.sin(da)));
    if (!(c.hitT > 0)) { c.hitK = sq * Math.min(1, Math.abs(c.v) / 40); c.v *= 1 - Math.min(0.45, sq * 0.6); c.hitEv = (c.hitEv || 0) + 1; }
    c.a -= da * (1 - Math.exp(-dt * 12)); c.v -= Math.sign(c.v) * Math.min(Math.abs(c.v), (5 + sq * 30) * dt + Math.max(0, Math.abs(c.v) - 24) * (1 - Math.exp(-dt * 3.5))); c.hitT = 0.25;
  }
  // boost pads
  for (const [pi, pl] of RC_PADS) { const d = Math.abs(rcWrap(n2.i - pi)); if (d <= 2 && Math.abs(n2.lat - pl) < 2.6 && c.v > 5) { if (!(c.bo > 0.9)) c.boEv = (c.boEv || 0) + 1; c.bo = Math.max(c.bo, 1.3); } }
  c.lat = n2.lat; c.off = Math.abs(n2.lat) > RC_HW + 0.6;
  return c;
}

const race = {
  id: "race", title: "Neteam Grand Prix", tag: "3D street race · six NYC circuits", custom3d: true,
  blurb: "3 laps. Grab data packets for EMPs, shockwaves and coffee spills.",
  how: [],
  keys: ["W gas", "S brake", "A / D steer", "Space drift", "Click / Q shoot", "E use item", "R reset", "C camera"],
  rec: { label: "Best lap", better: "min", fmt: v => (v / 1000).toFixed(2) + " s" },
  GRID: 4, LIMIT: 300, GRACE: 25,
  fill(n) { return Math.max(6, Math.min(8, n)); },
  hostStart(S) {
    const ids = Object.keys(RC_TRACKS), tr = S.mapPick && RC_TRACKS[S.mapPick] ? S.mapPick : ids[Math.floor(Math.random() * ids.length)]; rcSetTrack(tr);
    const P = S.ro.map((r, i) => {
      const row = Math.floor(i / 2), side = i % 2 ? 1 : -1;
      const idx = RC.N - 6 - row * 5, pos = rcAt(idx, side * 3.6);
      return { x: pos[0], z: pos[1], a: rcHead(idx), v: 0, i: idx, dist: idx - RC.N, ld: 0, lt: [], fin: 0, ft: 0, rsq: 1, bo: 0, it: 0, sh: 0, hitN: 0, hitK: 0, hitF: 0, boN: 0, useSeq: 0, itT: 0, hl: 0, fireSeq: 0, heat: 0, lastShot: -9, oh: 0, iu: 0, idle: 0, seen: 0, gone: 0,
        bot: r.b ? { skill: (r.boss ? 0.97 : 0.86) + Math.random() * 0.07, lane: (Math.random() - 0.5) * 6, lT: 0, dr: 0 } : null, skill: r.b ? 1 : 1 };
    });
    P.forEach(p => { if (p.bot) p.skill = p.bot.skill; });
    S.g = { tr, t: -this.GRID, P, place: 0, firstFin: 0, boxes: RC_BOXES.map(() => 0), hz: [], hzN: 0, ev: [], evN: 0, bl: [], blN: 0, bm: [], bmN: 0, sk: [], skN: 0 };
  },
  hostTick(S, dt, inputs) {
    const g = S.g; g.t += dt;
    if (g.boxes) g.boxes.forEach((b, k) => { if (b > 0) g.boxes[k] = b - dt; });
    const go = g.t >= 0;
    g.P.forEach((p, i) => {
      const prevI = p.i;
      if (p.bot) {
        if (go) this.botTick(S, i, dt);
      } else {
        const inp = inputs[i];
        if (inp) { p.idle = 0; p.seen = 1; p.gone = 0; } else if (go) { p.idle += dt; if (p.idle > (p.seen ? 10 : 25)) p.gone = 1; }
        if (inp && go && Number.isInteger(inp.use) && inp.use !== p.useSeq) { p.useSeq = inp.use; if (p.it) this.useItem(S, i); }
        if (inp && go && Number.isInteger(inp.fire) && inp.fire !== p.fireSeq) { p.fireSeq = inp.fire; this.shoot(S, i); }
        if (inp && go && Number.isFinite(inp.x) && Number.isFinite(inp.z)) {
          // the car goes where its driver says it is. (This used to ignore any jump of 60+ track samples, so one long
          // network stall left that car frozen for the rest of the race.) Progress is rate-limited below instead.
          const n = rcNearest(inp.x, inp.z, p.i);
          p.x = inp.x; p.z = inp.z; p.a = +inp.a || 0; p.v = clamp(+inp.v || 0, -12, RC_BOOST + 4); p.i = n.i; p.bo = inp.bo ? 1 : 0;
        }
      }
      if (!go) return;
      p.sh = Math.max(0, p.sh - dt);
      p.heat = Math.max(0, p.heat - dt * (p.oh ? 2.4 : 1.6)); if (p.oh && p.heat <= 0) p.oh = 0;
      // grab a pickup
      if (!p.it && !p.fin) RC_BOXES.forEach(([bi, bl], k) => { if (g.boxes[k] > 0) return; const bp = rcAt(bi, bl); if (Math.hypot(bp[0] - p.x, bp[1] - p.z) < 2.6) { g.boxes[k] = 4; p.it = this.rollItem(S, i); p.itT = 1 + Math.random() * 2.5; } });
      // coffee spills
      for (const hz of g.hz) if (!hz.gone && Math.hypot(hz.x - p.x, hz.z - p.z) < 2.1 && !(hz.own === i && g.t - hz.t0 < 1.2)) { hz.gone = 1; this.hit(S, i, 2, hz.own); }
      if (p.fin) return;
      // forward progress can't be credited faster than a boosting car could really cover it (with slack for lag)
      p.pb = Math.min(110, (p.pb == null ? 110 : p.pb) + dt * 45);
      let adv = rcWrap(p.i - prevI); if (adv > 0) { adv = Math.min(adv, Math.floor(p.pb)); p.pb -= adv; }
      p.dist += adv;
      const ld = p.dist < 0 ? 0 : Math.floor(p.dist / RC.N);
      if (ld > p.ld) { const prevT = p.lt.reduce((s, v) => s + v, 0); p.lt.push(Math.round(g.t * 1000) - prevT); p.ld = ld;
        if (ld >= RC_LAPS) { p.fin = ++g.place; p.ft = Math.round(g.t * 1000); if (!g.firstFin) g.firstFin = g.t; } }
    });
    if (go) this.weaponsTick(S, dt);
  },
  ev(S, k, from, to, x, z) { const g = S.g; g.ev.push(x != null ? [++g.evN, k, from, to, +x.toFixed(1), +z.toFixed(1)] : [++g.evN, k, from, to]); if (g.ev.length > 10) g.ev.splice(0, g.ev.length - 10); },
  // blaster bolts, lobbed packet bombs and smoke screens (host)
  shoot(S, i) {
    const g = S.g, p = g.P[i]; if (p.fin || p.oh || g.t - p.lastShot < 0.3) return;
    p.lastShot = g.t; p.heat += 1; if (p.heat >= RC_HEAT_MAX) p.oh = 1;
    const sa = Math.sin(p.a), ca = Math.cos(p.a), v = Math.max(0, p.v) + RC_BOLT_SPD;
    g.bl.push({ id: ++g.blN, x: p.x + sa * 2.4, z: p.z + ca * 2.4, vx: sa * v, vz: ca * v, t: 0, own: i, i: p.i });
    this.ev(S, 7, i, -1);
  },
  weaponsTick(S, dt) {
    const g = S.g;
    for (const b of g.bl) {
      b.t += dt;
      for (let st = 0; st < 3 && !b.done; st++) {
        b.x += b.vx * dt / 3; b.z += b.vz * dt / 3;
        g.P.forEach((q, j) => { if (b.done || j === b.own || q.fin) return; if (Math.hypot(q.x - b.x, q.z - b.z) < 1.8) { b.done = 1; this.hit(S, j, 7, b.own); this.ev(S, 10, b.own, j, b.x, b.z); } });
      }
      const nn = b.done ? null : rcNearest(b.x, b.z, b.i); if (nn) b.i = nn.i;
      if (!b.done && (b.t > RC_BOLT_LIFE || Math.abs(nn.lat) > RC_HW + 4)) { b.done = 1; this.ev(S, 12, b.own, -1, b.x, b.z); }
    }
    g.bl = g.bl.filter(b => !b.done);
    for (const m of g.bm) {
      m.t += dt; m.vy -= 22 * dt; m.x += m.vx * dt; m.z += m.vz * dt; m.y += m.vy * dt;
      if (m.y <= 0.35 && m.vy < 0) { m.y = 0.35; m.vy = -m.vy * 0.3; m.vx *= 0.6; m.vz *= 0.6; m.b = (m.b || 0) + 1; }
      if (m.t > 1.6 || (m.b && m.t > 0.9)) { m.done = 1; this.ev(S, 11, m.own, -1, m.x, m.z); g.P.forEach((q, j) => { if (!q.fin && Math.hypot(q.x - m.x, q.z - m.z) < 8) this.hit(S, j, 8, m.own); }); }
    }
    g.bm = g.bm.filter(m => !m.done);
    for (const k of g.sk) { k.t -= dt; if (k.t > 0.5) g.P.forEach((q, j) => { if (q.fin || k.hit[j] || (j === k.own && g.t - k.t0 < 3)) return; if (Math.hypot(q.x - k.x, q.z - k.z) < 6) { k.hit[j] = 1; this.hit(S, j, 9, k.own); } }); }
    g.sk = g.sk.filter(k => k.t > 0);
  },
  // leaders get defensive items, the back of the pack gets the nasty ones
  rollItem(S, i) {
    const g = S.g, me = g.P[i], ahead = g.P.filter(q => q.dist > me.dist).length, f = ahead / Math.max(1, g.P.length - 1);
    const w = f < 0.25 ? [0, 1, 4, 1, 3, 1, 1, 4] : f < 0.6 ? [0, 3, 2, 2, 2, 2, 3, 2] : [0, 4, 1, 3, 1, 3, 4, 1];
    let r = Math.random() * w.reduce((s, v) => s + v, 0); for (let k = 1; k < w.length; k++) { r -= w[k]; if (r <= 0) return k; } return 6;
  },
  hit(S, j, kind, from) {
    const g = S.g, q = g.P[j]; if (!q || q.fin) return;
    if (q.sh > 0) { g.ev.push([++g.evN, 6, from, j]); return; }
    q.hitN++; q.hitK = kind; q.hitF = from; if (from >= 0 && from !== j && g.P[from]) g.P[from].hl++;
    if (q.bot) {
      if (kind === 1) q.slow = 2.6;
      if (kind === 2) { q.spin = 0.9; q.spinDir = Math.random() < 0.5 ? -1 : 1; q.v *= 0.5; }
      if (kind === 7) { q.slow = Math.max(q.slow || 0, 0.5); q.v *= 0.85; }
      if (kind === 8) { q.spin = 1.1; q.spinDir = Math.random() < 0.5 ? -1 : 1; q.v *= 0.35; }
      if (kind === 9) { q.slow = Math.max(q.slow || 0, 0.4); if (q.bot) { q.bot.lane = (Math.random() - 0.5) * 9; q.bot.lT = 2; } }
      if (kind === 3) { const s = g.P[from]; q.slow = 0.9; q.v *= 0.55; if (s) { const dx = q.x - s.x, dz = q.z - s.z, d = Math.hypot(dx, dz) || 1; q.x += dx / d * 2.5; q.z += dz / d * 2.5; } }
    }
  },
  useItem(S, i) {
    const g = S.g, p = g.P[i], kind = p.it; p.it = 0; if (kind) p.iu++;
    if (kind === 1) {
      let best = -1, bd = 1e9; g.P.forEach((q, j) => { if (j === i || q.fin) return; const d = q.dist - p.dist; if (d > 0 && d < bd) { bd = d; best = j; } });
      if (best < 0) g.P.forEach((q, j) => { if (j === i || q.fin) return; const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; best = j; } });
      g.ev.push([++g.evN, 1, i, best]); if (best >= 0) this.hit(S, best, 1, i);
    } else if (kind === 2) {
      const hz = { id: ++g.hzN, x: p.x - Math.sin(p.a) * 3.4, z: p.z - Math.cos(p.a) * 3.4, own: i, t0: g.t }; g.hz.push(hz); if (g.hz.length > 12) g.hz.shift();
      g.ev.push([++g.evN, 2, i, -1]);
    } else if (kind === 3) {
      g.ev.push([++g.evN, 3, i, -1]);
      g.P.forEach((q, j) => { if (j !== i && Math.hypot(q.x - p.x, q.z - p.z) < 10) this.hit(S, j, 3, i); });
    } else if (kind === 4) { p.sh = 4; g.ev.push([++g.evN, 4, i, -1]); }
    else if (kind === 5) { p.boN++; if (p.bot) p.bo = Math.max(p.bo, 2.2); g.ev.push([++g.evN, 5, i, -1]); }
    else if (kind === 6) { const sa = Math.sin(p.a), ca = Math.cos(p.a), v = Math.max(0, p.v) + 20; g.bm.push({ id: ++g.bmN, x: p.x + sa * 2, z: p.z + ca * 2, y: 1.4, vx: sa * v, vz: ca * v, vy: 8.5, t: 0, own: i }); g.ev.push([++g.evN, 13, i, -1]); }
    else if (kind === 7) { g.sk.push({ id: ++g.skN, x: p.x - Math.sin(p.a) * 5, z: p.z - Math.cos(p.a) * 5, t: 7, t0: g.t, own: i, hit: {} }); g.ev.push([++g.evN, 14, i, -1]); }
    if (g.ev.length > 8) g.ev.splice(0, g.ev.length - 8);
    g.hz = g.hz.filter(h => !h.gone && g.t - h.t0 < 45);
  },
  botTick(S, i, dt) {
    const g = S.g, p = g.P[i], b = p.bot;
    if (p.it) { p.itT -= dt; if (p.itT <= 0) {
      const near = g.P.some((q, j) => j !== i && Math.hypot(q.x - p.x, q.z - p.z) < 8), behind = g.P.some((q, j) => j !== i && p.dist - q.dist > 2 && p.dist - q.dist < 25);
      const aheadCar = g.P.some((q, j) => j !== i && q.dist - p.dist > 4 && q.dist - p.dist < 30);
      const ok = p.it === 3 ? near : p.it === 2 || p.it === 7 ? behind : p.it === 6 ? aheadCar : true;
      if (ok || p.itT < -6) this.useItem(S, i); else p.itT = 0.4; } }
    // blaster: fire at a car roughly dead ahead
    if (!p.oh && g.t - p.lastShot > 0.8 && Math.random() < dt * 1.2) { const sa = Math.sin(p.a), ca = Math.cos(p.a); if (g.P.some((q, j) => { if (j === i || q.fin) return false; const dx = q.x - p.x, dz = q.z - p.z, fw = dx * sa + dz * ca, sd = Math.abs(dx * ca - dz * sa); return fw > 4 && fw < 38 && sd < 1.4 + fw * 0.03; })) this.shoot(S, i); }
    b.lT -= dt; if (b.lT <= 0) { b.lT = 2 + Math.random() * 3; b.lane = (Math.random() - 0.5) * 7; const pad = RC_PADS.find(([pi]) => { const d = rcWrap(pi - p.i); return d > 4 && d < 40; }); if (pad && Math.random() < 0.7) b.lane = pad[1]; }
    const look = 6 + Math.round(Math.abs(p.v) / 6);
    let ahead = 0; for (let k = 2; k < 26; k++) ahead = Math.max(ahead, RC.curv[(p.i + k) % RC.N]);
    const tgt = rcAt(p.i + look, b.lane * (1 - Math.min(1, ahead * 1.5)));
    const want = Math.atan2(tgt[0] - p.x, tgt[1] - p.z);
    const da = ((want - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const steer = clamp(-da * 2.4, -1, 1);
    const vt = RC_MAX * (1 - Math.min(0.5, ahead * 0.9));
    // gentle rubber band so bots stay in the mix
    const leader = Math.max(...g.P.filter(q => !q.bot).map(q => q.dist), -1e9);
    const rb = leader > -1e8 ? clamp((leader - p.dist) / 120, -0.12, 0.1) : 0;
    p.skill = clamp(b.skill + rb, 0.7, 1.08);
    const gas = p.v > vt * p.skill + 2 && !(p.bo > 0) ? -0.4 : 1;
    { let tow = 0; const sa = Math.sin(p.a), ca = Math.cos(p.a); if (p.v > 24) g.P.forEach((q, j) => { if (j === i) return; const dx = q.x - p.x, dz = q.z - p.z, fw = dx * sa + dz * ca; if (fw > 3 && fw < 22 && Math.abs(dx * ca - dz * sa) < 2.2) tow = Math.max(tow, 1 - (fw - 3) / 19); }); p.tow = lerp(p.tow || 0, tow, 1 - Math.exp(-dt * (tow > (p.tow || 0) ? 1.6 : 4))); }
    rcDrive(p, dt, gas, steer, ahead > 0.35 && p.v > 30, true);
    // nudge apart from other cars
    g.P.forEach((q, j) => { if (j === i) return; const dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz); if (d < 2.6 && d > 0.01) { p.x += dx / d * (2.6 - d) * 0.5; p.z += dz / d * (2.6 - d) * 0.5; } });
  },
  pack(S) {
    const g = S.g;
    return { tr: g.tr, t: Math.round(g.t * 10), pl: g.P.map(p => [Math.round(p.dist), p.ld, p.fin, p.ft, p.lt.length ? Math.min(...p.lt) : 0, p.rsq, p.lt.length ? p.lt[p.lt.length - 1] : 0, p.it, p.hitN, p.hitK, Math.ceil(p.sh * 10), p.hitF, p.boN, Math.round(p.heat * 10), p.oh]),
      bx: g.boxes.map(b => b > 0 ? 0 : 1), hz: g.hz.filter(h => !h.gone).map(h => [h.id, +h.x.toFixed(1), +h.z.toFixed(1)]), ev: g.ev,
      bl: g.bl.map(b => [b.id, +b.x.toFixed(1), +b.z.toFixed(1), +Math.atan2(b.vx, b.vz).toFixed(2)]), bm: g.bm.map(m => [m.id, +m.x.toFixed(1), +m.y.toFixed(2), +m.z.toFixed(1)]), sk: g.sk.map(k => [k.id, +k.x.toFixed(1), +k.z.toFixed(1), Math.round(k.t * 10)]),
      bt: g.P.map(p => p.bot ? [+p.x.toFixed(2), +p.z.toFixed(2), +p.a.toFixed(3), +p.v.toFixed(1), p.bo > 0 ? 1 : 0, +(p.slip || 0).toFixed(2)] : 0) };
  },
  timeLeft(S) { const g = S.g; if (g.t < 0) return -g.t * 1000; if (g.firstFin) return Math.max(0, (g.firstFin + this.GRACE - g.t) * 1000); return (this.LIMIT - g.t) * 1000; },
  done(S) { const g = S.g; const humans = g.P.filter((p, i) => !S.ro[i].b && !p.gone); if (!humans.length && g.t > 0 && S.ro.some(r => !r.b)) return true; return g.t >= this.LIMIT || (g.firstFin && g.t >= g.firstFin + this.GRACE) || (humans.length && humans.every(p => p.fin)); },
  mapList() { const sub = { dusk: "Dusk", dawn: "Sunrise", neon: "Neon night", storm: "Storm" }, d = { manhattan: "flowing", midtown: "tight grid", bridge: "long and fast", harbor: "sweepers", neon: "hairpins", queens: "high speed" }; return Object.keys(RC_TRACKS).map(id => ({ id, n: RC_TRACKS[id].n, sub: sub[RC_TRACKS[id].sky || "dusk"] + " · " + (d[id] || "") })); },
  rank(S) {
    const g = S.g;
    return g.P.map((p, i) => ({ i, p, best: p.lt.length ? Math.min(...p.lt) : 0 }))
      .sort((a, b) => (a.p.fin || 99) - (b.p.fin || 99) || b.p.dist - a.p.dist)
      .map(o => ({ i: o.i, v: o.p.fin ? -o.p.ft : o.p.dist, label: o.p.fin ? "Finished " + (o.p.ft / 1000).toFixed(1) + " s" + (o.best ? " · best lap " + (o.best / 1000).toFixed(2) : "") : "DNF · lap " + Math.min(RC_LAPS, o.p.ld + 1) + "/" + RC_LAPS, rec: o.best }));
  },
  board(S) {
    const g = S.g;
    const fmt = v => { if (!v) return "—"; const m = Math.floor(v / 60000), sec = (v % 60000) / 1000; return m ? m + ":" + sec.toFixed(2).padStart(5, "0") : sec.toFixed(2) + "s"; };
    const ord = g.P.map((p, i) => ({ i, p })).sort((a, b) => (a.p.fin || 99) - (b.p.fin || 99) || b.p.dist - a.p.dist);
    let fast = -1, fv = 1e12; g.P.forEach((p, i) => { const b = p.lt.length ? Math.min(...p.lt) : 0; if (b && b < fv) { fv = b; fast = i; } });
    return {
      cols: ["TIME", "BEST LAP", "LAPS", "HITS", "ITEMS"], tips: ["Finish time", "Fastest lap", "Laps completed", "Items that hit someone", "Items used"],
      rows: ord.map(o => { const p = o.p, b = p.lt.length ? Math.min(...p.lt) : 0; return { i: o.i, tm: -1, v: [p.fin ? fmt(p.ft) : p.gone ? "LEFT" : "DNF", fmt(b) + (o.i === fast ? " ★" : ""), Math.min(RC_LAPS, p.lt.length) + "/" + RC_LAPS, p.hl, p.iu] }; }),
      mvp: -1, teams: null, sub: (RC_TRACKS[g.tr] ? RC_TRACKS[g.tr].n : "") + (fast >= 0 ? " · fastest lap " + fmt(fv) + " by " + S.ro[fast].n : ""),
    };
  },
  chip(V, i) { const q = V.g && V.g.pl && V.g.pl[i]; if (!q) return ""; return q[2] ? "P" + q[2] + " 🏁" : "L" + Math.min(RC_LAPS, q[1] + 1); },
  places(V) {
    const pl = (V.g && V.g.pl) || [];
    const ord = pl.map((q, i) => ({ i, q })).sort((a, b) => (a.q[2] || 99) - (b.q[2] || 99) || b.q[0] - a.q[0]);
    const pos = []; ord.forEach((o, k) => pos[o.i] = k + 1); return pos;
  },

  cardArt(ctx, ro, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#08090b"); sky.addColorStop(0.55, "#2a1a14"); sky.addColorStop(0.62, "#ff7a59"); sky.addColorStop(0.63, "#14112a"); sky.addColorStop(1, "#0a0b0d");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const rnd = mulberry32(5);
    for (let x = -20; x < W; x += 34 + rnd() * 30) { const h = 80 + rnd() * 230, w = 30 + rnd() * 50; ctx.fillStyle = "#131418"; ctx.fillRect(x, H * 0.62 - h, w, h); ctx.fillStyle = "rgba(255,210,120,.55)"; for (let y = H * 0.62 - h + 8; y < H * 0.62 - 6; y += 12) for (let k = 4; k < w - 6; k += 9) if (rnd() < 0.4) ctx.fillRect(x + k, y, 4, 5); }
    // road in perspective
    ctx.fillStyle = "#222428"; ctx.beginPath(); ctx.moveTo(W * 0.46, H * 0.62); ctx.lineTo(W * 0.54, H * 0.62); ctx.lineTo(W * 1.05, H); ctx.lineTo(-W * 0.05, H); ctx.fill();
    ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 4; ctx.setLineDash([26, 22]); ctx.beginPath(); ctx.moveTo(W / 2, H * 0.62); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    // boost chevrons
    ctx.fillStyle = "rgba(76,201,240,.85)"; for (let k = 0; k < 3; k++) { const y = H * 0.78 + k * 26; ctx.beginPath(); ctx.moveTo(W * 0.3, y + 20); ctx.lineTo(W * 0.34, y); ctx.lineTo(W * 0.38, y + 20); ctx.lineTo(W * 0.34, y + 10); ctx.fill(); }
    // two cars
    const car = (x, y, s, hex, c) => {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(x, y + 20 * s, 90 * s, 18 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = hex; ctx.beginPath(); ctx.roundRect(x - 85 * s, y - 25 * s, 170 * s, 46 * s, 14 * s); ctx.fill();
      ctx.fillStyle = "#0d1024"; ctx.beginPath(); ctx.roundRect(x - 50 * s, y - 58 * s, 100 * s, 38 * s, 12 * s); ctx.fill();
      ctx.fillStyle = "#ff3b4e"; ctx.fillRect(x - 80 * s, y - 14 * s, 26 * s, 9 * s); ctx.fillRect(x + 54 * s, y - 14 * s, 26 * s, 9 * s);
      ctx.fillStyle = "#111"; ctx.fillRect(x - 78 * s, y + 14 * s, 34 * s, 16 * s); ctx.fillRect(x + 44 * s, y + 14 * s, 34 * s, 16 * s);
      drawChar(ctx, c, x, y - 64 * s, 62 * s, { t, color: hex, mood: "", shadow: false });
    };
    car(W * 0.66, H * 0.8, 1.1, ro[0].hex, ro[0].c); car(W * 0.3, H * 0.7, 0.7, ro[1].hex, ro[1].c);
    ctx.font = "700 58px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#ff8a3d"; ctx.fillText("GRAND PRIX", W / 2, H * 0.14);
    ctx.font = "700 30px 'Chakra Petch', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "rgba(245,241,230,.8)"; ctx.fillText("3D", 24, H - 30);
  },

  // ---------------- client ----------------
  clientEnter(V) {
    const sq = this._seq && this._seq.sid === V.sid ? this._seq : (this._seq = { sid: V.sid, use: 0, fire: 0 });
    const F = V.fps = { ready: false, failed: false, me: null, rsq: -1, cam: 0, stick: null, brake: false, drift: false, remote: {}, sq, useSeq: sq.use, hitSeen: null, boSeen: null, evSeen: null, hzM: {}, fx: [], lastBoEv: 0, fireSeq: sq.fire, firing: false, fireAt: 0, blM: {}, bmM: {}, skM: {}, wfx: [], blindT: 0, toast: null, lastLd: 0, prevPos: 0, wrongT: 0, lastDist: null, shake: 0 };
    loadThree().then(ok => { if (!ok) { F.failed = true; return; } if (APP.V === V) this.build(V); });
    const cv = $("#gameCanvas"), unb = F.unbind = [];
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); unb.push(() => el.removeEventListener(ev, fn, o)); };
    on(window, "keydown", (e) => { if (APP.view !== "game") return; if (e.code === "Space") { F.drift = true; e.preventDefault(); } if (e.repeat) return; if (e.code === "KeyR") this.reset(V); if (e.code === "KeyE" || e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "KeyF") this.useItem2(V); if (e.code === "KeyC") { F.cam = (F.cam + 1) % 3; toast(["Chase camera", "Far chase camera", "Hood camera"][F.cam]); } });
    on(window, "keyup", (e) => { if (e.code === "Space") F.drift = false; if (e.code === "KeyQ" || e.code === "Enter") F.firing = false; });
    on(window, "keydown", (e) => { if (APP.view !== "game") return; if (e.code === "KeyQ" || e.code === "Enter") { F.firing = true; e.preventDefault(); } });
    on(cv, "mousedown", (e) => { if (e.button === 0) F.firing = true; });
    on(window, "mouseup", (e) => { if (e.button === 0) F.firing = false; });
    const coarse = matchMedia("(pointer: coarse)").matches; F.coarse = coarse;
    on(cv, "touchstart", (e) => { for (const t of e.changedTouches) if (!F.stick) F.stick = { id: t.identifier, bx: t.clientX, x: t.clientX }; e.preventDefault(); }, { passive: false });
    on(cv, "touchmove", (e) => { for (const t of e.changedTouches) if (F.stick && t.identifier === F.stick.id) F.stick.x = t.clientX; e.preventDefault(); }, { passive: false });
    const tend = (e) => { for (const t of e.changedTouches) if (F.stick && t.identifier === F.stick.id) F.stick = null; };
    on(cv, "touchend", tend); on(cv, "touchcancel", tend);
    if (coarse && V.meIdx >= 0) {
      const tc = document.createElement("div"); tc.className = "ops-touch race-touch";
      const mk = (txt, cls, k) => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = txt; b.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); F[k] = true; }, { passive: false }); b.addEventListener("touchend", (e) => { e.preventDefault(); F[k] = false; }); tc.append(b); return b; };
      mk("DRIFT", "t-fire", "drift"); mk("BRAKE", "t-r", "brake"); mk("SHOOT", "t-scope", "firing");
      const ib = document.createElement("button"); ib.type = "button"; ib.textContent = "ITEM"; ib.className = "t-use"; ib.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); this.useItem2(V); }, { passive: false }); tc.append(ib);
      const rs = document.createElement("button"); rs.type = "button"; rs.textContent = "RESET"; rs.addEventListener("touchstart", (e) => { e.preventDefault(); this.reset(V); }, { passive: false }); tc.append(rs);
      $("#stagebox").append(tc); F.touch = tc;
    }
  },
  clientExit(V) {
    const F = V.fps; if (!F) return;
    (F.unbind || []).forEach(f => f());
    if (F.aud) { [F.aud.me, F.aud.sq, F.aud.wind, F.aud.rum, F.aud.scr].concat(F.aud.others).forEach(q => q && q.stop()); F.aud = null; } SFX.amb(null);
    if (F.post) try { F.post.dispose(); } catch (e) {}
    if (F.nx) try { F.nx.dispose(); } catch (e) {}
    if (F.renderer) { try { F.renderer.dispose(); F.renderer.forceContextLoss(); } catch (e) {} }
    [F.cv, F.touch].forEach(el => el && el.remove());
    V.fps = null;
  },
  // ---- weapons (client art)
  weaponsDraw(V, g, dt, t) {
    const F = V.fps, T = THREE;
    const sync = (list, store, make, upd) => { const seen = {}; (list || []).forEach(e => { seen[e[0]] = 1; let o = store[e[0]]; if (!o) { o = store[e[0]] = make(e); } upd(o, e); }); for (const id in store) if (!seen[id]) { F.scene.remove(store[id].m); (store[id].parts || []).forEach(m => { F.scene.remove(m); m.material.dispose(); }); delete store[id]; } };
    F.boltG = F.boltG || new T.CylinderGeometry(0.09, 0.09, 2.6, 8).rotateX(Math.PI / 2);
    F.boltM = F.boltM || new T.MeshBasicMaterial({ color: new T.Color(1.4, 4, 5), transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false });
    sync(g.bl, F.blM, ([id, x, z, a]) => { const m = new T.Mesh(F.boltG, F.boltM); const gl = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(0.6, 2.2, 3), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); gl.scale.set(1.6, 1.6, 1); m.add(gl); m.position.set(x, 1.0, z); m.rotation.y = a; F.scene.add(m); return { m, x, z, a }; },
      (o, [id, x, z, a]) => { const f = Math.min(1, dt * 30); o.m.position.x += (x - o.m.position.x) * f; o.m.position.z += (z - o.m.position.z) * f; o.m.rotation.y = a; });
    sync(g.bm, F.bmM, ([id, x, y, z]) => { const m = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(0.32, 14, 10), new T.MeshStandardMaterial({ color: 0x2a2c33, metalness: 0.6, roughness: 0.35 })); const led = new T.Mesh(new T.SphereGeometry(0.08, 8, 6), new T.MeshBasicMaterial({ color: new T.Color(4, 1.2, 0.2) })); led.position.y = 0.3; m.add(b, led); m.userData.led = led; m.position.set(x, y, z); F.scene.add(m); return { m }; },
      (o, [id, x, y, z]) => { const f = Math.min(1, dt * 20), p = o.m.position; p.x += (x - p.x) * f; p.y += (y - p.y) * f; p.z += (z - p.z) * f; o.m.rotation.x += dt * 9; o.m.userData.led.visible = Math.floor(t * 10) % 2 === 0; });
    sync(g.sk, F.skM, ([id, x, z]) => { const parts = []; for (let i = 0; i < (GFX.lowEnd() ? 12 : 22); i++) { const m = new T.Sprite(new T.SpriteMaterial({ map: this.smokeTex(F), color: new T.Color(0.6, 0.62, 0.66), transparent: true, opacity: 0, depthWrite: false, fog: false })); const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 4.5; m.position.set(x + Math.cos(a) * r, 0.8 + Math.random() * 2.6, z + Math.sin(a) * r); m.userData.sc = 3 + Math.random() * 2; m.material.rotation = Math.random() * 6; F.scene.add(m); parts.push(m); } return { m: new T.Object3D(), parts, born: t }; },
      (o, [id, x, z, tl]) => { const age = t - o.born, fade = clamp(tl / 10 / 1.5, 0, 1), grow = 1 - Math.pow(1 - clamp(age / 1.0, 0, 1), 3); o.parts.forEach(m => { const sc = m.userData.sc * (0.3 + 0.7 * grow); m.scale.set(sc, sc, 1); m.material.opacity = 0.92 * fade * Math.min(1, age * 3); m.material.rotation += dt * 0.15; }); });
    // muzzle flashes on cars that just fired
    Object.values(F.cars || {}).forEach(car => { if (!car.flash) return; car.flashT = Math.max(0, (car.flashT || 0) - dt); car.flash.visible = car.flashT > 0; });
    // explosion particles
    for (const o of F.wfx) {
      o.life -= dt; const k = clamp(1 - o.life / o.max, 0, 1), m = o.m;
      if (o.v) { if (o.g) o.v[1] -= o.g * dt; if (o.drag) { const d = Math.max(0, 1 - o.drag * dt); o.v[0] *= d; o.v[2] *= d; if (!o.g) o.v[1] *= d; } m.position.x += o.v[0] * dt; m.position.y = Math.max(0.05, m.position.y + o.v[1] * dt); m.position.z += o.v[2] * dt; }
      if (o.s1 != null) { const sc = o.s0 + (o.s1 - o.s0) * (1 - Math.pow(1 - k, 2.2)); if (o.sprite) m.scale.set(sc, sc, 1); else m.scale.set(sc, 1, sc); }
      if (o.op != null) m.material.opacity = o.op * (o.fin ? Math.min(1, k / o.fin) : 1) * Math.pow(1 - k, 1.3);
      if (o.c0) m.material.color.lerpColors(o.c0, o.c1, Math.min(1, k * 1.4));
      if (o.sp) { m.rotation.x += o.sp * dt; m.rotation.y += o.sp * dt; }
      if (o.life <= 0) { F.scene.remove(m); m.material.dispose(); }
    }
    F.wfx = F.wfx.filter(o => o.life > 0);
    if (F.spk) F.spk.update(dt, 14);
    if (F.boomL) F.boomL.intensity = Math.max(0, F.boomL.intensity - dt * 220);
    F.blindT = Math.max(0, F.blindT - dt); F.zapT = Math.max(0, (F.zapT || 0) - dt);
  },
  smokeTex(F) { return GAMES.breach.smokeTex(F); },
  skid(F, a, b) {
    const K = F.skid, P = K.m.geometry.attributes.position, o = (K.n++ % K.N) * 6, dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.13, nz = dx / l * 0.13, y = 0.045;
    P.setXYZ(o, a[0] - nx, y, a[1] - nz); P.setXYZ(o + 1, a[0] + nx, y, a[1] + nz); P.setXYZ(o + 2, b[0] + nx, y, b[1] + nz); P.setXYZ(o + 3, a[0] - nx, y, a[1] - nz); P.setXYZ(o + 4, b[0] + nx, y, b[1] + nz); P.setXYZ(o + 5, b[0] - nx, y, b[1] - nz); P.needsUpdate = true;
  },
  // sparks: one cloud of points for the whole race (dozens fly whenever a bolt lands, and each used to be drawn on its own)
  // one hidden frame with a sample of every weapon and crash effect in it, so the first drift, bolt or blast of the race
  // does not freeze the picture while the graphics card compiles its shader
  warmUp(V) {
    const F = V.fps, T = THREE; if (!F || !F.post || !F.post.warm) return;
    const snd = SFX.on, sh = F.shake, p = rcAt(0, 0), x = p[0], z = p[1], tmp = new T.Group(); SFX.on = false; F.wfx = F.wfx || [];
    try {
      this.boom(V, x, z); this.sparks(V, x, z, 0xffb347, 2);
      const box = new T.BoxGeometry(1, 1, 1), smoke = this.smokeTex(F), glow = GFX.glowTex();
      [new T.MeshBasicMaterial({ color: 0xffffff }), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }), new T.MeshStandardMaterial({ color: 0x808080 }), F.spillM].forEach(m => { if (!m) return; const o = new T.Mesh(box, m); o.scale.setScalar(0.01); tmp.add(o); });
      [new T.SpriteMaterial({ map: glow, transparent: true, depthWrite: false }), new T.SpriteMaterial({ map: smoke, transparent: true, depthWrite: false }), new T.SpriteMaterial({ map: smoke, transparent: true, depthWrite: false, fog: false })].forEach(m => { const o = new T.Sprite(m); o.scale.setScalar(0.01); tmp.add(o); });
      tmp.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(0.01, 0, 0)]), new T.LineBasicMaterial({ color: 0xffffff, transparent: true })));
      tmp.position.set(x, 1, z); F.scene.add(tmp);
    } catch (e) { console.warn("[nx] effect samples", e); }
    if (F.nx) F.nx.adopt(F.scene);
    F.post.warm(F.scene, F.cam3);
    try {
      F.scene.remove(tmp); tmp.children.forEach(o => { if (o.material !== F.spillM) o.material.dispose(); });
      for (const o of F.wfx) { F.scene.remove(o.m); o.m.material.dispose(); } F.wfx = [];
      if (F.spk) F.spk.update(10, 14);
    } catch (e) { console.warn("[nx] effect samples", e); }
    if (F.boomL) F.boomL.intensity = 0; F.shake = sh; SFX.on = snd;
  },
  sparks(V, x, z, col, n) {
    const F = V.fps, K = F.spk || (F.spk = GFX.cloud(F.scene, 480, 0.13)), c = (GFX._bc || (GFX._bc = new THREE.Color())).set(col).multiplyScalar(4);
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, sp = 3 + Math.random() * 7; K.emit(x, 1, z, Math.cos(a) * sp, 1 + Math.random() * 5, Math.sin(a) * sp, 0.3 + Math.random() * 0.3, c.r, c.g, c.b); }
  },
  boom(V, x, z) {
    const F = V.fps, T = THREE; if (!F || !F.scene) return; const low = GFX.lowEnd();
    const d = F.me ? Math.hypot(x - F.me.x, z - F.me.z) : 40; SFX.blast(clamp(1.1 - d / 70, 0.12, 1), 0, 0, clamp(d / 70, 0, 1)); F.shake = Math.max(F.shake || 0, clamp(0.9 * (1 - d / 35), 0, 0.9));
    if (!F.boomL) { F.boomL = new T.PointLight(0xff7a2a, 0, 30, 1.6); F.scene.add(F.boomL); } F.boomL.position.set(x, 2.5, z); F.boomL.intensity = 120;
    for (let i = 0; i < (low ? 8 : 16); i++) { const m = new T.Sprite(new T.SpriteMaterial({ map: this.smokeTex(F), color: new T.Color(2.4, 1.5, 0.45), transparent: true, depthWrite: false })); m.material.rotation = Math.random() * 6; m.position.set(x, 0.8, z); F.scene.add(m); const a = Math.random() * 6.28, e = Math.random() * 1.2, sp = 3 + Math.random() * 5; F.wfx.push({ m, sprite: 1, life: 0.5 + Math.random() * 0.4, max: 0.9, v: [Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp + 2, Math.sin(a) * Math.cos(e) * sp], drag: 3, s0: 1.4, s1: 4 + Math.random() * 2, op: 1, c0: new T.Color(2.4, 1.5, 0.45), c1: new T.Color(0.75, 0.16, 0.03) }); }
    for (let i = 0; i < (low ? 6 : 12); i++) { const m = new T.Sprite(new T.SpriteMaterial({ map: this.smokeTex(F), color: 0x2b2b30, transparent: true, opacity: 0, depthWrite: false })); m.position.set(x + (Math.random() - 0.5) * 3, 1.2 + Math.random(), z + (Math.random() - 0.5) * 3); F.scene.add(m); const a = Math.random() * 6.28, sp = 0.5 + Math.random() * 2; F.wfx.push({ m, sprite: 1, life: 2.5 + Math.random() * 1.5, max: 4, v: [Math.cos(a) * sp, 1 + Math.random(), Math.sin(a) * sp], drag: 1.4, s0: 2, s1: 6 + Math.random() * 2, op: 0.9, fin: 0.1 }); }
    const ring = new T.Mesh(F.ringG, new T.MeshBasicMaterial({ color: new T.Color(2.4, 1.3, 0.5), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); ring.position.set(x, 0.1, z); F.scene.add(ring); F.wfx.push({ m: ring, life: 0.45, max: 0.45, s0: 0.5, s1: 8, op: 0.9 });
    this.sparks(V, x, z, 0xffb347, low ? 12 : 26);
  },
  useItem2(V) { const F = V.fps, q = V.g && V.g.pl && V.g.pl[V.meIdx]; if (!F || !q || !q[7]) return; F.sq.use = ++F.useSeq; },
  reset(V) {
    const F = V.fps; if (!F || !F.me) return;
    const c = F.me, n = rcNearest(c.x, c.z, c.i), p = rcAt(n.i, 0);
    c.x = p[0]; c.z = p[1]; c.a = rcHead(n.i); c.v = Math.min(c.v, 8); c.slip = 0; c.dc = 0; SFX.play("dash");
  },
  clientInput(V, dt, inp) {
    const F = V.fps; if (!F || !F.ready) return null;
    const me = V.meIdx; if (me < 0) return null;
    const g = V.g || {}, q = g.pl && g.pl[me];
    if (!F.me) {
      const row = Math.floor(me / 2), side = me % 2 ? 1 : -1;
      let idx = RC.N - 6 - row * 5, lat = side * 3.6;
      // coming back into a race that is under way: pick up where the host last had us, not back on the grid
      if (q && g.t > 0 && q[0] > 0) { idx = ((q[0] % RC.N) + RC.N) % RC.N; lat = 0; }
      const p = rcAt(idx, lat);
      F.me = { x: p[0], z: p[1], a: rcHead(idx), v: 0, i: idx, bo: 0, skill: 1 };
    }
    const c = F.me, go = g.t != null && g.t >= 0 && V.h.ph === "play", fin = q && q[2];
    let steer = inp.dx, gas = -inp.dy;
    if (F.stick) { steer = clamp((F.stick.x - F.stick.bx) / 70, -1, 1); }
    if (F.coarse) gas = F.brake ? -1 : 1;
    // keys are all-or-nothing: wind the wheel on and off instead of snapping it (quick to centre, quicker still to swap sides)
    if (!F.stick) { const cur = F.st || 0, rate = (steer === 0 ? 9 : steer * cur < 0 ? 14 : 5.5) * dt; steer = F.st = cur + clamp(steer - cur, -rate, rate); } else F.st = steer;
    // perfect start: get on the gas in the last half second before GO
    if (!go) { if (gas > 0.5 && !F.gasWas) F.gasAt = performance.now(); F.gasWas = gas > 0.5; F.wasWait = V.h.ph === "play"; }
    else if (F.wasWait) { F.wasWait = false; const el = F.gasWas && F.gasAt && !F.coarse ? performance.now() - F.gasAt : -1; if (el > 40 && el < 560 && !(g.t > 5)) { c.bo = Math.max(c.bo || 0, 1.2); c.boEv = (c.boEv || 0) + 1; F.toast = { s: "PERFECT START", sub: "", life: 1.3, col: "#4cc9f0" }; } }
    if (!go) { gas = 0; c.v = 0; }
    if (fin) { gas = Math.max(0, gas) * 0.3; }
    // hits from other players' items (the host decides, we feel it here)
    if (q) {
      if (F.hitSeen == null) F.hitSeen = q[8];
      if (q[8] !== F.hitSeen) {
        F.hitSeen = q[8]; const k = q[9], src = F.remote[q[11]], who = V.ro[q[11]] ? V.ro[q[11]].n : "";
        if (k === 1) { c.slow = 2.6; F.shake = 0.4; SFX.zap(0.8, 0, 1); SFX.samp("power-down", 0.35, 0, 1.15); F.toast = { s: "EMP'D", sub: who, life: 1.4, col: "#4cc9f0" }; }
        if (k === 2) { c.spin = 0.9; c.spinDir = Math.random() < 0.5 ? -1 : 1; c.v *= 0.5; F.shake = 0.3; SFX.play("bump"); F.toast = { s: "SPILL!", sub: who, life: 1.2, col: "#d08a4a" }; }
        if (k === 7) { c.slow = Math.max(c.slow || 0, 0.5); c.v *= 0.85; F.shake = Math.max(F.shake, 0.22); SFX.zap(0.65); F.toast = { s: "ZAPPED", sub: who, life: 0.9, col: "#4cc9f0" }; F.zapT = 0.35; }
        if (k === 8) { c.spin = 1.1; c.spinDir = Math.random() < 0.5 ? -1 : 1; c.v *= 0.35; F.shake = 1; F.toast = { s: "PACKET BOMB!", sub: who, life: 1.4, col: "#ffb347" }; }
        if (k === 9) { F.blindT = 2.6; c.slow = Math.max(c.slow || 0, 0.4); F.toast = { s: "SMOKED", sub: who, life: 1.2, col: "#c9ced8" }; }
        if (k === 3) { c.slow = 0.9; c.v *= 0.55; F.shake = 0.6; SFX.play("boom"); if (src) { const dx = c.x - src.x, dz = c.z - src.z, d = Math.hypot(dx, dz) || 1; c.x += dx / d * 2.5; c.z += dz / d * 2.5; } F.toast = { s: "PUNCHED", sub: who, life: 1.2, col: "#ff6a1a" }; }
      }
      if (F.boSeen == null) F.boSeen = q[12];
      if (q[12] !== F.boSeen) { F.boSeen = q[12]; c.bo = Math.max(c.bo || 0, 2.2); c.boEv = (c.boEv || 0) + 1; }
      if (q[7] && q[7] !== F.lastIt) SFX.play("pickup"); F.lastIt = q[7];
    }
    if (F.firing && go && !fin && q && !q[14] && performance.now() - F.fireAt > 320) { F.fireAt = performance.now(); F.sq.fire = ++F.fireSeq; }
    if (q && q[14] && F.firing && !F.ohWarn) { F.ohWarn = 1; SFX.steam(0.7); } if (q && !q[14]) F.ohWarn = 0;
    const ev = c.boEv || 0;
    // slipstream: tucked in behind another car you gain on it
    { let tow = 0; const sa = Math.sin(c.a), ca = Math.cos(c.a); if (c.v > 24 && go) Object.keys(F.remote).forEach(k => { if (+k === me) return; const o = F.remote[k], dx = o.x - c.x, dz = o.z - c.z, fw = dx * sa + dz * ca; if (fw > 3 && fw < 22 && Math.abs(dx * ca - dz * sa) < 2.2) tow = Math.max(tow, 1 - (fw - 3) / 19); });
      c.tow = lerp(c.tow || 0, tow, 1 - Math.exp(-dt * (tow > (c.tow || 0) ? 1.6 : 4))); }
    rcDrive(c, dt, gas, steer, F.drift, false);
    if ((c.boEv || 0) !== ev) { SFX.whoosh(0.9, 0, 1); SFX.tone(110, 0.35, "sine", 0.12, 90); F.shake = 0.25; }
    c.hitT = Math.max(0, (c.hitT || 0) - dt);
    if ((c.hitEv || 0) !== (F.hitEvSeen || 0)) { F.hitEvSeen = c.hitEv; const k = c.hitK || 0, ctr = rcAt(c.i, 0), side = (c.x - ctr[0]) * -Math.cos(c.a) + (c.z - ctr[1]) * Math.sin(c.a) > 0 ? 1 : -1;
      SFX.scrape(0.3 + k * 0.7, side * 0.55); F.shake = Math.max(F.shake || 0, 0.1 + k * 0.4); if (k > 0.12) this.sparks(V, c.x + Math.sin(c.a) * 1.4, c.z + Math.cos(c.a) * 1.4, 0xffc27a, GFX.lowEnd() ? 5 : 6 + Math.round(k * 10)); }
    F.bumpT = Math.max(0, (F.bumpT || 0) - dt);
    // keep cars from overlapping
    Object.keys(F.remote).forEach(k => { if (+k === me) return; const o = F.remote[k]; const dx = c.x - o.x, dz = c.z - o.z, d = Math.hypot(dx, dz); if (d < 2.6 && d > 0.01) { c.x += dx / d * (2.6 - d) * 0.6; c.z += dz / d * (2.6 - d) * 0.6; c.v *= 0.995;
      if (!F.bumpT && 2.6 - d > 0.12 && Math.abs(c.v) > 8) { F.bumpT = 0.45; SFX.scrape(0.35, (dx * -Math.cos(c.a) + dz * Math.sin(c.a)) / d > 0 ? -0.5 : 0.5); F.shake = Math.max(F.shake || 0, 0.14); } } });
    F.steer = steer; F.gas = gas;
    return { x: +c.x.toFixed(2), z: +c.z.toFixed(2), a: +c.a.toFixed(3), v: +c.v.toFixed(1), bo: c.bo > 0 ? 1 : 0, sl: +(c.slip || 0).toFixed(2), dr: c.dc > 0.1 ? 1 : 0, use: F.useSeq, fire: F.fireSeq };
  },
  build(V) {
    const F = V.fps; if (!F || F.ready || F.building) return;
    if (!(V.g && V.g.tr)) { setTimeout(() => { if (APP.V === V) this.build(V); }, 150); return; }
    rcSetTrack(V.g.tr); F.building = true;
    const T = THREE;
    const cv = document.createElement("canvas"); cv.className = "fps3d";
    Object.assign(cv.style, { position: "absolute", borderRadius: "10px", pointerEvents: "none" });
    $("#stagebox").insertBefore(cv, $("#gameCanvas")); F.cv = cv;
    let renderer;
    const low = GFX.lowEnd();
    const nxOn = !!(NXW.themes.race && (store("nfa-gfx") || {}).nx !== 0);
    try { renderer = new T.WebGLRenderer(nxOn ? { canvas: cv, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" } : { canvas: cv, antialias: low, powerPreference: "high-performance" }); } catch (e) { F.failed = true; return; }
    renderer.setPixelRatio(Math.min(low ? 1.25 : 1.75, devicePixelRatio || 1));
    if (nxOn) { F.renderer = renderer; this.buildNX(V, renderer); return; }
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; const SK = RC_SKY[RC_TRACKS[RC_ID].sky || "dusk"]; renderer.toneMappingExposure = SK.exp;
    F.renderer = renderer;
    F.post = GFX.post(renderer, { strength: 1.0, threshold: 1.0, vignette: 0.5, low });
    const scene = new T.Scene(); F.scene = scene;
    scene.fog = new T.FogExp2(SK.fog, SK.fd);
    const cam = new T.PerspectiveCamera(68, 16 / 10, 0.1, 900); F.cam3 = cam;
    const mk = (w, h, fn) => { const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };
    // sky dome with a dusk gradient and stars
    const skyTex = mk(32, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); SK.st.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "#fff"; for (let i = 0; i < 40; i++) x.fillRect(Math.random() * w, Math.random() * h * 0.4, 1, 1); });
    const sky = new T.Mesh(new T.SphereGeometry(800, 32, 16), new T.MeshBasicMaterial({ map: skyTex, side: T.BackSide, fog: false })); scene.add(sky); F.sky = sky;
    scene.environment = GFX.env(renderer, { base: 0x120f28, panels: [[0, 8.9, 0, 10, 0.1, 10, 0x2a2060, 2], [-9.9, 4, 0, 0.1, 4, 16, 0xff9a5c, 2.5], [9.9, 3, 0, 0.1, 6, 16, 0x5c8aff, 1.5], [0, 2, -9.9, 16, 3, 0.1, 0xffd58a, 3], [0, 2, 9.9, 16, 3, 0.1, 0x9fd8ff, 2]] });
    scene.add(new T.HemisphereLight(SK.hs, SK.hg, SK.hi));
    const moon = new T.DirectionalLight(SK.kc, SK.ki); moon.position.set(-200, 160, -120); scene.add(moon);
    const [mnx, mxx, mnz, mxz] = RC.box, cx = (mnx + mxx) / 2, cz = (mnz + mxz) / 2;
    // ground: park grass inside and around the track
    const grassTex = mk(256, 256, (x, w, h) => { x.fillStyle = "#1f4a32"; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(80,160,90,.18)" : "rgba(0,0,0,.15)"; x.fillRect(Math.random() * w, Math.random() * h, 2, 3); } });
    grassTex.wrapS = grassTex.wrapT = T.RepeatWrapping; grassTex.repeat.set(80, 80);
    const ground = new T.Mesh(new T.PlaneGeometry(1600, 1600), new T.MeshStandardMaterial({ map: grassTex, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set(cx, -0.02, cz); scene.add(ground);
    // track ribbon
    const ribbon = (inner, outer, y, mat, vScale) => {
      const N = RC.N, pos = [], uv = [], idx = [];
      let acc = 0;
      for (let k = 0; k <= N; k++) {
        const i = k % N, a = rcAt(i, inner), b = rcAt(i, outer);
        if (k > 0) acc += Math.hypot(RC.pts[i][0] - RC.pts[(k - 1) % N][0], RC.pts[i][1] - RC.pts[(k - 1) % N][1]);
        pos.push(a[0], y, a[1], b[0], y, b[1]); uv.push(0, acc / vScale, 1, acc / vScale);
        if (k < N) { const o = k * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      }
      const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new T.Mesh(geo, mat); m.material.side = T.DoubleSide; scene.add(m); return m;
    };
    const asphalt = mk(256, 256, (x, w, h) => { x.fillStyle = "#2a2d40"; x.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { const v = Math.random(); x.fillStyle = v < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.18)"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.fillStyle = "#e9e3cf"; x.fillRect(4, 0, 5, h); x.fillRect(w - 9, 0, 5, h); x.fillStyle = "#ffd23f"; x.fillRect(w / 2 - 3, 0, 6, h * 0.55); });
    asphalt.wrapS = asphalt.wrapT = T.RepeatWrapping;
    ribbon(-RC_HW - 0.6, RC_HW + 0.6, 0.02, new T.MeshStandardMaterial({ map: asphalt, roughness: 0.42, metalness: 0.25, normalMap: GFX.normal(GFX.tex(256, 256, (x, w, h) => x.drawImage(asphalt.image, 0, 0)), 1.2), normalScale: new T.Vector2(0.5, 0.5) }), 10);
    // run-off (dark asphalt) out to the barrier so the wall area reads as road shoulder
    const runoff = new T.MeshStandardMaterial({ color: 0x1b1d2c, roughness: 0.95 });
    ribbon(RC_HW + 1.6, RC_WALL + 0.6, 0.012, runoff, 10); ribbon(-RC_WALL - 0.6, -RC_HW - 1.6, 0.012, runoff, 10);
    const curb = mk(16, 64, (x, w, h) => { x.fillStyle = "#f5f1e6"; x.fillRect(0, 0, w, h); x.fillStyle = "#ff3b4e"; x.fillRect(0, 0, w, h / 2); });
    curb.wrapS = curb.wrapT = T.RepeatWrapping;
    const curbMat = new T.MeshStandardMaterial({ map: curb, roughness: 0.6 });
    ribbon(RC_HW + 0.6, RC_HW + 1.6, 0.04, curbMat, 4); ribbon(-RC_HW - 1.6, -RC_HW - 0.6, 0.04, curbMat.clone(), 4);
    // barriers: vertical ribbons with Neteam colors
    const barTex = mk(512, 64, (x, w, h) => { x.fillStyle = "#1f6fd1"; x.fillRect(0, 0, w, h); x.fillStyle = "#ffd23f"; x.fillRect(0, h - 10, w, 10); x.fillStyle = "#f5f1e6"; x.font = "700 34px 'Chakra Petch', sans-serif"; x.textBaseline = "middle"; x.fillText("NETEAM SOLUTIONS", 20, h / 2 - 4); x.fillStyle = "#ffd23f"; x.fillText("IT · NYC", 360, h / 2 - 4); });
    barTex.wrapS = T.RepeatWrapping;
    const wall = (lat) => {
      const N = RC.N, pos = [], uv = [], idx = []; let acc = 0;
      for (let k = 0; k <= N; k++) { const i = k % N, a = rcAt(i, lat); if (k > 0) acc += 1.6; pos.push(a[0], 0, a[1], a[0], 1.3, a[1]); const u = (lat > 0 ? -1 : 1) * acc / 20; uv.push(u, 0, u, 1); if (k < N) { const o = k * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); } }
      const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      scene.add(new T.Mesh(geo, new T.MeshStandardMaterial({ map: barTex, emissiveMap: barTex, emissive: 0xffffff, emissiveIntensity: 0.35, side: T.DoubleSide, roughness: 0.6 })));
    };
    wall(RC_WALL + 0.7); wall(-RC_WALL - 0.7);
    // start / finish line + gantry
    const chk = mk(128, 32, (x, w, h) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? "#111" : "#f5f1e6"; x.fillRect(i * 8, j * 8, 8, 8); } });
    const sl = new T.Mesh(new T.PlaneGeometry(RC_HW * 2 + 1, 2.4), new T.MeshStandardMaterial({ map: chk, roughness: 0.7 }));
    sl.rotation.x = -Math.PI / 2; sl.position.y = 0.05; const slG = new T.Group(); slG.add(sl); slG.position.set(RC.pts[0][0], 0, RC.pts[0][1]); slG.rotation.y = rcHead(0); scene.add(slG);
    const gantry = new T.Group(), steel = new T.MeshStandardMaterial({ color: 0x3a3f58, metalness: 0.7, roughness: 0.35 });
    [-1, 1].forEach(s => { const leg = new T.Mesh(new T.BoxGeometry(0.8, 9, 0.8), steel); leg.position.set(s * (RC_WALL + 1.2), 4.5, 0); gantry.add(leg); });
    const banTex = mk(1024, 128, (x, w, h) => { x.fillStyle = "#0a0b0d"; x.fillRect(0, 0, w, h); x.strokeStyle = "#ffd23f"; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8); x.fillStyle = "#ffd23f"; x.font = "700 70px 'Chakra Petch', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NETEAM GRAND PRIX", w / 2, h / 2 + 4); });
    const ban = new T.Mesh(new T.BoxGeometry(RC_WALL * 2 + 3.2, 2.6, 0.5), new T.MeshStandardMaterial({ map: banTex, emissiveMap: banTex, emissive: 0xffffff, emissiveIntensity: 0.8 }));
    ban.position.y = 8.2; gantry.add(ban);
    gantry.position.set(RC.pts[0][0], 0, RC.pts[0][1]); gantry.rotation.y = rcHead(0); scene.add(gantry);
    // countdown lights on the gantry
    F.lights = [0, 1, 2].map(k => { const m = new T.Mesh(new T.SphereGeometry(0.45, 16, 12), new T.MeshBasicMaterial({ color: 0x330a0e })); m.position.set(-1.6 + k * 1.6, 6.3, 0.4); gantry.add(m); const m2 = m.clone(); m2.material = m.material; m2.position.z = -0.4; gantry.add(m2); return m; });
    // boost pads
    const padTex = mk(128, 128, (x, w, h) => { x.fillStyle = "rgba(10,40,70,.9)"; x.fillRect(0, 0, w, h); x.fillStyle = "#4cc9f0"; for (let k = 0; k < 3; k++) { const y = 10 + k * 40; x.beginPath(); x.moveTo(20, y + 30); x.lineTo(64, y); x.lineTo(108, y + 30); x.lineTo(108, y + 40); x.lineTo(64, y + 12); x.lineTo(20, y + 40); x.fill(); } });
    padTex.wrapT = T.RepeatWrapping; F.padTex = padTex;
    const padMat = new T.MeshBasicMaterial({ map: padTex, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false });
    RC_PADS.forEach(([pi, pl]) => { const p = rcAt(pi, pl); const m = new T.Mesh(new T.PlaneGeometry(4.6, 5.2), padMat); m.rotation.order = "YXZ"; m.rotation.set(-Math.PI / 2, rcHead(pi) + Math.PI, 0); m.position.set(p[0], 0.06, p[1]); scene.add(m); const l = new T.PointLight(0x4cc9f0, 6, 14, 2); l.position.set(p[0], 1.2, p[1]); scene.add(l); });
    // city blocks: lit skyscrapers outside the barriers
    const winTex = mk(128, 256, (x, w, h) => { x.fillStyle = "#0d1028"; x.fillRect(0, 0, w, h); for (let y = 6; y < h; y += 12) for (let k = 6; k < w; k += 12) { const r = Math.random(); x.fillStyle = r < 0.45 ? "#ffd58a" : r < 0.55 ? "#9fd8ff" : "#141836"; x.fillRect(k, y, 7, 7); } });
    winTex.wrapS = winTex.wrapT = T.RepeatWrapping;
    const bMat = new T.MeshStandardMaterial({ map: winTex, emissiveMap: winTex, emissive: 0xffffff, emissiveIntensity: 1.9, roughness: 0.6, metalness: 0.3 });
    const spots = [];
    for (let x = mnx - 120; x <= mxx + 120; x += 16) for (let z = mnz - 120; z <= mxz + 120; z += 16) {
      const jx = x + (Math.random() - 0.5) * 6, jz = z + (Math.random() - 0.5) * 6;
      const n = rcNearest(jx, jz, -1); if (Math.abs(n.lat) < RC_WALL + 12) continue;
      // keep the infield mostly as a park with a few low buildings
      const inside = jx > mnx + 10 && jx < mxx - 10 && jz > mnz + 10 && jz < mxz - 10;
      if (inside && Math.random() < 0.65) continue;
      spots.push([jx, jz, inside ? 6 + Math.random() * 14 : 16 + Math.random() * Math.random() * 90]);
    }
    const bGeo = new T.BoxGeometry(1, 1, 1);
    const bIm = new T.InstancedMesh(bGeo, bMat, spots.length); const m4 = new T.Matrix4();
    spots.forEach(([x, z, h], i) => { const w = 9 + Math.random() * 4; m4.makeScale(w, h, w).setPosition(x, h / 2, z); bIm.setMatrixAt(i, m4); });
    scene.add(bIm);
    // Neteam HQ tower + billboards
    const hqPos = rcAt(Math.round(RC.N * 0.02), -RC_WALL - 20);
    const hqTex = mk(256, 512, (x, w, h) => { x.fillStyle = "#101634"; x.fillRect(0, 0, w, h); for (let y = 70; y < h; y += 16) for (let k = 8; k < w; k += 16) { x.fillStyle = Math.random() < 0.6 ? "#9fd8ff" : "#1a2148"; x.fillRect(k, y, 10, 9); } x.fillStyle = "#ffd23f"; x.fillRect(0, 0, w, 56); x.fillStyle = "#0a0b0d"; x.font = "700 40px 'Chakra Petch', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NETEAM", w / 2, 30); });
    const hq = new T.Mesh(new T.BoxGeometry(18, 110, 18), new T.MeshStandardMaterial({ map: hqTex, emissiveMap: hqTex, emissive: 0xffffff, emissiveIntensity: 1 })); hq.position.set(hqPos[0], 55, hqPos[1]); scene.add(hq);
    const spire = new T.Mesh(new T.CylinderGeometry(0.3, 0.8, 20, 8), new T.MeshBasicMaterial({ color: 0xff4d5e })); spire.position.set(hqPos[0], 120, hqPos[1]); scene.add(spire); F.spire = spire;
    const bb = (lines, fi, lat, col) => {
      const tex = mk(512, 256, (x, w, h) => { x.fillStyle = "#0a0b0d"; x.fillRect(0, 0, w, h); x.strokeStyle = col; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); x.textAlign = "center"; x.textBaseline = "middle"; lines.forEach((l, k) => { x.fillStyle = k ? "#f5f1e6" : col; x.font = (k ? "700 34px Inter, sans-serif" : "700 56px 'Chakra Petch', sans-serif"); x.fillText(l, w / 2, 80 + k * 70); }); });
      const i = Math.round(RC.N * fi), p = rcAt(i, lat), g = new T.Group();
      const board = new T.Mesh(new T.BoxGeometry(14, 7, 0.4), new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.9 })); board.position.y = 8;
      const pole = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 8, 8), steel); pole.position.y = 4;
      g.add(board, pole); g.position.set(p[0], 0, p[1]); g.rotation.y = rcHead(i) + (lat > 0 ? -1 : 1) * 0.9 + Math.PI; scene.add(g);
    };
    bb(["NETEAM", "Managed IT for NYC"], 0.14, RC_WALL + 6, "#ffd23f");
    bb(["PATCH YOUR STUFF", "— Mike & Pavlos"], 0.3, -RC_WALL - 6, "#4cc9f0");
    bb(["MFA ON?", "Good. Now drive."], 0.46, RC_WALL + 6, "#3ddc97");
    bb(["TICKET #4802", "Car won't go faster"], 0.6, -RC_WALL - 6, "#ff7ac6");
    bb(["BACKUPS", "3 copies · 2 media · 1 offsite"], 0.75, RC_WALL + 6, "#ff6b57");
    bb(["NETEAM", "Since 2001"], 0.88, -RC_WALL - 6, "#ffd23f");
    // street lamps
    const lampHead = new T.MeshBasicMaterial({ color: new T.Color(4, 3.4, 2.4) }), lampGlow = new T.SpriteMaterial({ map: GFX.glowTex(), color: 0xffcf8a, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0.8 });
    for (let k = 0; k < RC.N; k += 22) { [-1, 1].forEach(s => { const p = rcAt(k + (s > 0 ? 11 : 0), s * (RC_WALL + 2)); const pole = new T.Mesh(new T.CylinderGeometry(0.12, 0.16, 7, 6), steel); pole.position.set(p[0], 3.5, p[1]); const hd = new T.Mesh(new T.SphereGeometry(0.4, 10, 8), lampHead); hd.position.set(p[0], 7.1, p[1]); const gl = new T.Sprite(lampGlow); gl.scale.set(4, 4, 1); gl.position.copy(hd.position); scene.add(pole, hd, gl); }); }
    for (let k = 0; k < RC.N; k += 66) { const p = rcAt(k, 0); const l = new T.PointLight(0xffd7a0, SK.lamp, 60, 1.6); l.position.set(p[0], 9, p[1]); scene.add(l); }
    // trees in the park
    const trunkM = new T.MeshStandardMaterial({ color: 0x4a3222 }), leafM = new T.MeshStandardMaterial({ color: 0x2f7a46, roughness: 0.9 });
    const trees = [];
    for (let k = 0; k < 140; k++) { const x = mnx + Math.random() * (mxx - mnx), z = mnz + Math.random() * (mxz - mnz); const n = rcNearest(x, z, -1); if (Math.abs(n.lat) < RC_WALL + 5) continue; trees.push([x, z, 0.8 + Math.random() * 0.8]); }
    const tIm = new T.InstancedMesh(new T.CylinderGeometry(0.25, 0.35, 2.4, 6), trunkM, trees.length), lIm = new T.InstancedMesh(new T.IcosahedronGeometry(1.8, 0), leafM, trees.length);
    trees.forEach(([x, z, s], i) => { m4.makeScale(s, s, s).setPosition(x, 1.2 * s, z); tIm.setMatrixAt(i, m4); m4.makeScale(s, s * 1.2, s).setPosition(x, 3.3 * s, z); lIm.setMatrixAt(i, m4); });
    scene.add(tIm, lIm);
    this.buildDyn(V, scene);
    F.ready = true;
  },
  // ---- the track on the NX engine: baked light, scanned materials, real sky; then everything that moves
  buildNX(V, renderer) {
    const F = V.fps, T = THREE;
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.NoToneMapping;
    const scene = new T.Scene(); F.scene = scene;
    const cam = new T.PerspectiveCamera(68, 16 / 10, 0.1, 1700); F.cam3 = cam; scene.add(cam);
    NX.drsReset();
    NXS.create(renderer, scene, cam, "rc-" + RC_ID, rcWorld(RC_ID)).then((S) => {
      if (V.fps !== F || APP.V !== V) { S.dispose(); return; }
      F.nx = S; const g = S.W.grade || {};
      if (g.fog) scene.fog = new T.FogExp2(new T.Color(g.fog[0], g.fog[1], g.fog[2]), g.fogD || 0.003);
      F.post = NXP.create(renderer, S, Object.assign({}, g, { speed: 1 }));
      // countdown lights under the gantry banner
      const gantry = new T.Group(); gantry.position.set(RC.pts[0][0], 0, RC.pts[0][1]); gantry.rotation.y = rcHead(0); scene.add(gantry);
      F.lights = [0, 1, 2].map(k => { const m = new T.Mesh(new T.SphereGeometry(0.36, 18, 12), new T.MeshBasicMaterial({ color: 0x330a0e })); m.scale.z = 0.45; m.position.set(-1.6 + k * 1.6, 6.2, 0.27); gantry.add(m); const m2 = m.clone(); m2.material = m.material; m2.position.z = -0.27; gantry.add(m2); const bk = new T.Mesh(new T.BoxGeometry(1.3, 1.3, 0.5), new T.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.6 })); bk.position.set(-1.6 + k * 1.6, 6.2, 0); gantry.add(bk); return m; });
      // boost pads
      const padTex = GFX.tex(128, 128, (x, w, h) => { x.fillStyle = "rgba(10,40,70,.9)"; x.fillRect(0, 0, w, h); x.fillStyle = "#4cc9f0"; for (let k = 0; k < 3; k++) { const y = 10 + k * 40; x.beginPath(); x.moveTo(20, y + 30); x.lineTo(64, y); x.lineTo(108, y + 30); x.lineTo(108, y + 40); x.lineTo(64, y + 12); x.lineTo(20, y + 40); x.fill(); } });
      F.padTex = padTex;
      const padMat = new T.MeshBasicMaterial({ map: padTex, color: new T.Color(2.2, 2.2, 2.2), transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false });
      RC_PADS.forEach(([pi, pl]) => { const p = rcAt(pi, pl); const m = new T.Mesh(new T.PlaneGeometry(4.6, 5.2), padMat); m.rotation.order = "YXZ"; m.rotation.set(-Math.PI / 2, rcHead(pi) + Math.PI, 0); m.position.set(p[0], 0.07, p[1]); scene.add(m); });
      const hq = S.W.hq || { x: 0, z: 0, h: 100 };
      const spire = new T.Mesh(new T.CylinderGeometry(0.3, 0.8, 20, 8), new T.MeshBasicMaterial({ color: 0xff4d5e })); spire.position.set(hq.x, hq.h + 10, hq.z); scene.add(spire); F.spire = spire;
      this.buildDyn(V, scene);
      scene.traverse(o => { if (o.isMesh && !o.userData.nxStatic && o.material && o.material.isMeshStandardMaterial && !(o.geometry && o.geometry.type === "PlaneGeometry")) o.castShadow = true; });
      S.adopt(scene);
      // wait for the driver models, then prepare every shader behind the loading screen (see NXP warm)
      return GFX.whenLoaded(7000).then(() => { if (V.fps !== F || APP.V !== V) return; this.warmUp(V); F.ready = true; });
    }).catch((e) => { console.error("[nx] race build failed", e); F.failed = true; });
  },
  // ---- everything that moves: cars, pickups, spills, effects
  buildDyn(V, scene) {
    const F = V.fps, T = THREE, m4 = new T.Matrix4();
    // cars: see 09b-cars.js. Your character drives from the open cockpit.
    // headlight pool on the road: two soft lobes that merge and fade with distance (no hard edge anywhere), dimmer by day
    const beamTex = GFX.tex(64, 128, (x, w, h) => { const im = x.createImageData(w, h), d = im.data;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = 1 - (j + 0.5) / h, u = (i + 0.5) / w - 0.5, hw = 0.1 + 0.26 * v, off = 0.11 * (1 - v * 0.6);
        const lat = Math.exp(-Math.pow((Math.abs(u) - off) / hw, 2) * 2.4), lon = Math.min(1, v / 0.07) * Math.pow(1 - v, 1.7), edge = Math.max(0, Math.min(1, (0.5 - Math.abs(u)) / 0.08));
        const k = (j * w + i) * 4; d[k] = 255; d[k + 1] = 240; d[k + 2] = 210; d[k + 3] = Math.round(255 * 0.42 * lat * lon * edge); }
      x.putImageData(im, 0, 0); });
    beamTex.wrapS = beamTex.wrapT = T.ClampToEdgeWrapping;
    const beamM = new T.MeshBasicMaterial({ map: beamTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    beamM.color.setScalar(({ dawn: 0.4, dusk: 0.75 })[rcWorld(RC_ID).sky] || 1);
    const glowM = (c) => new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(c), transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    F.smokeM = new T.SpriteMaterial({ map: GFX.glowTex(), color: 0x9aa0b8, transparent: true, opacity: 0.35, depthWrite: false });
    F.smoke = [];
    F.cars = V.ro.map((r, i) => {
      const grp = new T.Group(), body = new T.Group(); grp.add(body);
      const car = RCCAR.make(T, r.hex, i + 1, i % 3), L0 = RCCAR.L0, L1 = RCCAR.L1; body.add(car.body);
      const hg1 = new T.Sprite(glowM(0x8c8470)); hg1.scale.set(0.7, 0.4, 1); hg1.position.set(-0.6, 0.66, L1 - 0.05); const hg2 = hg1.clone(); hg2.position.x = 0.58;
      const tg = new T.Sprite(glowM(0xb01c28)); tg.scale.set(2.0, 0.5, 1); tg.position.set(0, car.sh.tailY, L0 - 0.12);
      const beam = new T.Object3D(); beam.rotation.set(-Math.PI / 2, 0, Math.PI); beam.position.set(0, 0.04, 9.3);
      body.add(hg1, hg2, tg, beam);
      const wheels = car.wheels.map(w => { grp.add(w.st); return w; });
      // the driver: your character in the cockpit, name tag above
      const spr = new T.Sprite(new T.SpriteMaterial({ map: frenzy.charTex(r.c, r.hex, r.n), transparent: true, alphaTest: 0.02 })); spr.scale.set(1.26, 1.58, 1); spr.position.set(0, car.sh.seatY + 0.5, -0.2); body.add(spr);
      const flame = new T.Group(), flameM = new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(0.6, 2.2, 3.2), transparent: true, blending: T.AdditiveBlending, depthWrite: false }); for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { const f = new T.Sprite(flameM); f.position.set(sd * 0.3, 0.53, L0 - 0.3 - k * 0.42); f.userData.k = k; flame.add(f); } flame.visible = false; body.add(flame);
      const glow = new T.Object3D(); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.05; grp.add(glow);
      const shad = new T.Object3D(); shad.rotation.x = -Math.PI / 2; shad.position.y = 0.03; grp.add(shad);
      const shield = new T.Mesh(F.shieldGeo || (F.shieldGeo = new T.SphereGeometry(3.1, 24, 16)), new T.MeshBasicMaterial({ color: new T.Color(0.4, 2.2, 1.2), transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); shield.scale.set(0.85, 0.6, 1.1); shield.position.y = 1; shield.visible = false; grp.add(shield);
      const zap = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(0.8, 2.4, 3.4), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); zap.scale.set(5, 3, 1); zap.position.y = 1.2; zap.visible = false; grp.add(zap);
      scene.add(grp);
      return { grp, body, wheels, flame, spr, sprY: car.sh.seatY + 0.5, shield, zap, zapT: 0, x: 0, z: 0, a: 0, init: false, roll: 0, smokeT: 0, steer: 0, pv: 0, pitch: 0, inst: [beam, glow, shad] };
    });
    // the parts every car has are drawn together, one call per kind however many cars there are: wheels, headlight pools, underglow, contact shadows
    { const n = V.ro.length, W = RCCAR.wheel(T), im = (geo, mat, cnt, order) => { const m = new T.InstancedMesh(geo, mat, cnt); m.frustumCulled = false; m.renderOrder = order; m.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(m); return m; };
      F.inst = { wheel: im(W.geo, W.mat, n * 4, 0), beam: im(new T.PlaneGeometry(5, 14), beamM, n, 3),
        glow: im(new T.PlaneGeometry(3, 5.4), new T.MeshBasicMaterial({ map: GFX.glowTex(), transparent: true, blending: T.AdditiveBlending, depthWrite: false }), n, 2),
        shad: im(new T.PlaneGeometry(2.7, 5.3), new T.MeshBasicMaterial({ map: GFX.shadowTex(), transparent: true, depthWrite: false }), n, 1) };
      const c = new T.Color(); V.ro.forEach((r, i) => F.inst.glow.setColorAt(i, c.set(r.hex).multiplyScalar(0.5))); F.inst.glow.instanceColor.needsUpdate = true; }
    // speed streaks, skid marks and wet-road spray
    { const N = 64, g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(new Float32Array(N * 6), 3));
      const m = new T.LineSegments(g, new T.LineBasicMaterial({ color: new T.Color(1.5, 1.8, 2.3), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); m.frustumCulled = false; m.visible = false; scene.add(m); F.streak = { m, N, p: [] }; }
    { const N = 420, g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(new Float32Array(N * 18), 3));
      const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0x050506, transparent: true, opacity: 0.4, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); m.frustumCulled = false; scene.add(m); F.skid = { m, N, n: 0 }; }
    F.sprayM = new T.SpriteMaterial({ map: GFX.glowTex(), color: 0x7f8996, transparent: true, opacity: 0.14, depthWrite: false });
    F.wetRoad = /neon|storm/.test(rcWorld(RC_ID).sky || "");
    // pickups: spinning glowing data packets with the Neteam N
    const pkTex = GFX.tex(128, 128, (x, w, h) => { x.fillStyle = "#120600"; x.fillRect(0, 0, w, h); x.strokeStyle = "#ff8a3d"; x.lineWidth = 10; x.strokeRect(6, 6, w - 12, h - 12); x.fillStyle = "#ffb27a"; x.font = "700 84px 'Chakra Petch', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("?", w / 2, h / 2 + 4); });
    const pkM = new T.MeshStandardMaterial({ map: pkTex, emissiveMap: pkTex, emissive: 0xffffff, emissiveIntensity: 2.2, transparent: true, opacity: 0.92, roughness: 0.3 });
    const pkG = new T.BoxGeometry(1.5, 1.5, 1.5);
    F.boxes = RC_BOXES.map(([bi, bl]) => { const p = rcAt(bi, bl); const m = new T.Mesh(pkG, pkM); m.position.set(p[0], 1.3, p[1]); const gl = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(2.4, 1.0, 0.3), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); gl.scale.set(4, 4, 1); m.add(gl); scene.add(m); return m; });
    const spillTex = GFX.tex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = "rgba(70,38,14,.95)"; x.beginPath(); for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, r = 40 + Math.random() * 20; x.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } x.fill(); x.fillStyle = "rgba(255,190,120,.35)"; x.beginPath(); x.ellipse(w / 2 - 12, h / 2 - 12, 16, 8, -0.6, 0, 7); x.fill(); });
    F.spillM = new T.MeshStandardMaterial({ map: spillTex, transparent: true, depthWrite: false, roughness: 0.05, metalness: 0.3 });
    F.spillG = new T.PlaneGeometry(4.4, 4.4); F.spillG.rotateX(-Math.PI / 2);
    F.ringG = new T.RingGeometry(0.8, 1.1, 40); F.ringG.rotateX(-Math.PI / 2);
  },
  draw(ctx, V, dt, t) {
    const F = V.fps; ctx.clearRect(0, 0, W, H); if (!F) return;
    if (F.failed) { ctx.fillStyle = "#0a0b0d"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#f5f1e6"; ctx.font = "700 20px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText("3D isn't available in this browser. Try Chrome, Edge, Firefox or Safari.", W / 2, H / 2); return; }
    if (!F.ready) { ctx.fillStyle = "#0a0b0d"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#ff8a3d"; ctx.font = "700 26px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.fillText("WARMING UP THE ENGINES…", W / 2, H / 2); return; }
    this.render3d(V, dt, t); this.hud(ctx, V, dt, t);
  },
  render3d(V, dt, t) {
    const F = V.fps, T = THREE, g = V.g || {};
    GFX.fitStage(F, F.cam3);
    const me = V.meIdx;
    V.ro.forEach((r, i) => {
      const car = F.cars[i]; let x, z, a, v, bo, sl;
      if (i === me && F.me) ({ x, z, a, v } = F.me), bo = F.me.bo > 0, sl = F.me.slip || 0;
      else if (r.b) { const b = g.bt && g.bt[i]; if (!b) return; [x, z, a, v] = b; bo = !!b[4]; sl = b[5] || 0; }
      else { const inp = V.inputOf(i); if (!inp || !Number.isFinite(inp.x)) { if (!car.init) { const row = Math.floor(i / 2), side = i % 2 ? 1 : -1, idx = RC.N - 6 - row * 5, p = rcAt(idx, side * 3.6); x = p[0]; z = p[1]; a = rcHead(idx); v = 0; } else { x = car.x; z = car.z; a = car.a; v = 0; } } else { x = inp.x; z = inp.z; a = inp.a; v = inp.v || 0; bo = !!inp.bo; sl = inp.sl || 0; } }
      if (!car.init || Math.hypot(car.x - x, car.z - z) > 12 || i === me) { car.x = x; car.z = z; car.a = a; car.init = true; }
      else { car.x = lerp(car.x, x, 0.3); car.z = lerp(car.z, z, 0.3); let da = ((a - car.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; car.a += da * 0.3; }
      F.remote[i] = { x: car.x, z: car.z };
      car.grp.position.set(car.x, 0, car.z); car.grp.rotation.y = car.a;
      car.body.rotation.y = -(sl || 0) * 0.8; car.body.rotation.z = lerp(car.body.rotation.z, (sl || 0) * 0.25 - car.steer * Math.min(1, Math.abs(v || 0) / 30) * 0.07, 0.2);
      // wheels roll and steer, the body leans into corners and dips under braking
      const yaw = car.pa == null ? 0 : ((car.a - car.pa + Math.PI * 3) % (Math.PI * 2)) - Math.PI; car.pa = car.a;
      car.steer = lerp(car.steer, clamp(dt > 0 ? yaw / dt * 0.5 / (1 + Math.abs(v || 0) / 30) : 0, -0.5, 0.5), 0.2);
      car.pitch = lerp(car.pitch, clamp(dt > 0 ? ((v || 0) - car.pv) / dt * 0.0016 : 0, -0.045, 0.045), 0.1); car.pv = v || 0;
      car.roll += (v || 0) * dt / RCCAR.WR; car.wheels.forEach(wh => { wh.w.rotation.x = car.roll; if (wh.front) wh.st.rotation.y = car.steer; });
      car.body.rotation.x = -car.pitch; car.body.position.y = Math.abs(v || 0) > 1 ? Math.sin(t * 31 + i * 1.7) * 0.004 * Math.min(1, Math.abs(v) / 30) : 0;
      const pq = g.pl && g.pl[i]; car.shield.visible = !!(pq && pq[10] > 0); if (car.shield.visible) car.shield.material.opacity = 0.16 + Math.sin(t * 10) * 0.06;
      car.zapT = Math.max(0, car.zapT - dt); car.zap.visible = car.zapT > 0; if (car.zap.visible) car.zap.material.opacity = Math.random();
      car.flame.visible = !!bo; if (bo) car.flame.children.forEach(f => { const fs = (f.userData.k ? 0.42 : 0.7) * (0.8 + Math.random() * 0.6); f.scale.set(fs, fs, 1); });
      car.spr.position.y = car.sprY + Math.sin(t * 9 + i) * 0.012;
      // skid marks under the rear tyres while sliding
      if (F.skid && Math.abs(sl || 0) > 0.12 && Math.abs(v || 0) > 12) { const ca = Math.cos(car.a), sa = Math.sin(car.a), pos = [-1, 1].map(sd => [car.x + sa * RCCAR.AXR + ca * sd * RCCAR.TRK, car.z + ca * RCCAR.AXR - sa * sd * RCCAR.TRK]);
        if (!car.sk) car.sk = pos; else if (Math.hypot(pos[0][0] - car.sk[0][0], pos[0][1] - car.sk[0][1]) > 0.45) { pos.forEach((q, k) => this.skid(F, car.sk[k], q)); car.sk = pos; } }
      else car.sk = null;
      // spray off a wet road
      car.sprayT = (car.sprayT || 0) - dt;
      if (F.wetRoad && Math.abs(v || 0) > 16 && car.sprayT <= 0 && F.smoke.length < 150 && Math.hypot(car.x - F.cam3.position.x, car.z - F.cam3.position.z) < 48) {
        car.sprayT = 0.07; const sp = new T.Sprite(F.sprayM.clone()), ca = Math.cos(car.a), sa = Math.sin(car.a), sd = Math.random() - 0.5; sp.position.set(car.x - sa * 2.3 + ca * sd * 1.5, 0.35, car.z - ca * 2.3 - sa * sd * 1.5); sp.scale.set(1.2, 1.2, 1); F.scene.add(sp); F.smoke.push({ m: sp, life: 0.6, op: 0.14 * Math.min(1, Math.abs(v) / 40) }); }
      // tyre smoke while drifting
      car.smokeT -= dt;
      if (Math.abs(sl || 0) > 0.12 && Math.abs(v || 0) > 12 && car.smokeT <= 0 && F.smoke.length < 120) {
        car.smokeT = 0.035;
        [-1, 1].forEach(sd => { const sp = new T.Sprite(F.smokeM.clone()); const ca = Math.cos(car.a), sa = Math.sin(car.a); sp.position.set(car.x - sa * 1.4 + ca * sd * 0.95, 0.4, car.z - ca * 1.4 - sa * sd * 0.95); sp.scale.set(1, 1, 1); F.scene.add(sp); F.smoke.push({ m: sp, life: 0.9 }); });
      }
    });
    if (F.inst) { const I = F.inst; F.cars.forEach((car, i) => { car.grp.updateWorldMatrix(false, true); car.wheels.forEach((wh, k) => I.wheel.setMatrixAt(i * 4 + k, wh.w.matrixWorld)); I.beam.setMatrixAt(i, car.inst[0].matrixWorld); I.glow.setMatrixAt(i, car.inst[1].matrixWorld); I.shad.setMatrixAt(i, car.inst[2].matrixWorld); });
      I.wheel.instanceMatrix.needsUpdate = I.beam.instanceMatrix.needsUpdate = I.glow.instanceMatrix.needsUpdate = I.shad.instanceMatrix.needsUpdate = true; }
    // pickups, spills and item effects
    F.boxes.forEach((m, k) => { m.visible = !g.bx || !!g.bx[k]; m.rotation.y = t * 1.6 + k; m.rotation.x = t * 0.9; m.position.y = 1.3 + Math.sin(t * 3 + k) * 0.2; });
    const live = new Set();
    (g.hz || []).forEach(([id, x, z]) => { live.add(id); if (!F.hzM[id]) { const m = new T.Mesh(F.spillG, F.spillM); m.position.set(x, 0.05, z); m.rotation.y = id; F.scene.add(m); F.hzM[id] = m; } });
    Object.keys(F.hzM).forEach(id => { if (!live.has(+id)) { F.scene.remove(F.hzM[id]); delete F.hzM[id]; } });
    if (F.evSeen == null) F.evSeen = (g.ev && g.ev.length) ? g.ev[g.ev.length - 1][0] : 0;
    (g.ev || []).forEach(([n, k, from, to]) => {
      if (n <= F.evSeen) return; F.evSeen = n;
      const a = F.cars[from], b = F.cars[to]; if (!a) return;
      const dme = me >= 0 && F.me ? Math.hypot(a.x - F.me.x, a.z - F.me.z) : 30, vol = Math.max(0.15, 1 - dme / 90);
      if (k === 1 && b) { // lightning bolt from shooter to target
        const pts = []; for (let s2 = 0; s2 <= 10; s2++) { const f = s2 / 10; pts.push(new T.Vector3(lerp(a.x, b.x, f) + (s2 % 10 ? (Math.random() - 0.5) * 1.6 : 0), 1.4 + (s2 % 10 ? (Math.random() - 0.5) * 1.2 : 0), lerp(a.z, b.z, f) + (s2 % 10 ? (Math.random() - 0.5) * 1.6 : 0))); }
        const ln = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: new T.Color(1.2, 3, 4), transparent: true }));
        F.scene.add(ln); F.fx.push({ m: ln, life: 0.35, kind: "line" }); b.zapT = 2.4; SFX.zap(0.8 * vol, 0, 1);
      }
      if (k === 3) { const ring = new T.Mesh(F.ringG, new T.MeshBasicMaterial({ color: new T.Color(3, 1.2, 0.3), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); ring.position.set(a.x, 0.3, a.z); F.scene.add(ring); F.fx.push({ m: ring, life: 0.5, kind: "ring" }); SFX.noise(0.3, 0.12 * vol, 500); SFX.tone(70, 0.3, "sine", 0.15 * vol, -30); F.shake = Math.max(F.shake || 0, 0.25 * vol); }
      if (k === 2) SFX.samp("thud1", 0.4 * vol, 0, 1.5);
      if (k === 7) { SFX.shot("smg", 0.5 * vol, 0, clamp(1 - vol, 0, 0.9)); a.flashT = 0.08; }
      if (k === 10 || k === 12) { const ev2 = g.ev.find(e => e[0] === n); if (ev2 && ev2[4] != null) this.sparks(V, ev2[4], ev2[5], k === 10 ? 0x9fe8ff : 0xffd59a, k === 10 ? 18 : 8); if (k === 10) SFX.zap(0.55 * vol); }
      if (k === 11) { const ev2 = g.ev.find(e => e[0] === n); if (ev2 && ev2[4] != null) this.boom(V, ev2[4], ev2[5]); }
      if (k === 13) SFX.swish(0.6 * vol);
      if (k === 14) SFX.hiss(vol, 0);
      if (k === 4) SFX.shield(0.6 * vol); if (k === 6) { SFX.clack(0.6 * vol, 0, 0.8); SFX.zap(0.35 * vol); }
    });
    for (const o of F.fx) { o.life -= dt; if (o.kind === "ring") { const s2 = 1 + (0.5 - o.life) * 22; o.m.scale.set(s2, 1, s2); } o.m.material.opacity = Math.max(0, o.life * 2.5); if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); if (o.kind === "line") o.m.geometry.dispose(); } }
    F.fx = F.fx.filter(o => o.life > 0);
    this.weaponsDraw(V, g, dt, t);
    // camera
    const c = me >= 0 && F.me ? F.me : null;
    let tx, tz, ta, tv;
    if (c) { tx = c.x; tz = c.z; ta = c.a + (c.slip || 0) * 0.4; tv = c.v; }
    else { const ranked = this.places(V).map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]); const lead = ranked.length ? ranked[0][1] : 0; const r = F.cars[lead]; tx = r.x; tz = r.z; ta = r.a; tv = 30; }
    const dist = [7.5, 12, 0][F.cam], hgt = [3.2, 5.2, 1.55][F.cam];
    F.camA = F.camA == null ? ta : F.camA + (((ta - F.camA + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 6);
    const ca = F.cam === 2 ? ta : F.camA;
    F.shake = Math.max(0, (F.shake || 0) - dt);
    const spd = Math.abs(tv || 0), fast = clamp((spd - 36) / 24, 0, 1), sh = F.shake * 0.5 + fast * fast * 0.035;
    if (F.nx && F.post && F.post.comp.u.uSpd) F.post.comp.u.uSpd.value = lerp(F.post.comp.u.uSpd.value, fast, 0.08);
    const camX = tx - Math.sin(ca) * dist + (F.cam === 2 ? Math.sin(ca) * 0.6 : 0), camZ = tz - Math.cos(ca) * dist + (F.cam === 2 ? Math.cos(ca) * 0.6 : 0);
    F.cam3.position.set(camX + (Math.random() - 0.5) * sh, hgt + (Math.random() - 0.5) * sh, camZ + (Math.random() - 0.5) * sh);
    F.cam3.lookAt(tx + Math.sin(ca) * 8, F.cam === 2 ? 1.3 : 1.2, tz + Math.cos(ca) * 8);
    const fov = 66 + clamp(Math.abs(tv || 0) / RC_BOOST, 0, 1.1) * 16; F.cam3.fov = lerp(F.cam3.fov, fov, 0.08); F.cam3.updateProjectionMatrix();
    if (me >= 0 && F.cars[me]) F.cars[me].spr.visible = F.cam !== 2;
    // speed streaks: points hanging in the air that you rush past
    if (F.streak) { const K = F.streak, P = K.m.geometry.attributes.position, fx = Math.sin(ca), fz = Math.cos(ca), cx = F.cam3.position.x, cz = F.cam3.position.z, len = 0.5 + spd * 0.045;
      const tow = c ? c.tow || 0 : 0; K.m.material.opacity = Math.max(fast * 0.45, tow * 0.4); K.m.visible = fast > 0.02 || tow > 0.05;
      if (K.m.visible) { for (let i = 0; i < K.N; i++) { let q = K.p[i]; const ahead = q ? (q[0] - cx) * fx + (q[2] - cz) * fz : -9;
          if (ahead < -2 || ahead > 80) { const d = 30 + Math.random() * 45, lat = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 11); q = K.p[i] = [cx + fx * d + fz * lat, 0.4 + Math.random() * 5.5, cz + fz * d - fx * lat]; }
          P.setXYZ(i * 2, q[0], q[1], q[2]); P.setXYZ(i * 2 + 1, q[0] + fx * len, q[1], q[2] + fz * len); }
        P.needsUpdate = true; } }
    if (F.sky) F.sky.position.set(F.cam3.position.x, 0, F.cam3.position.z);
    F.padTex.offset.y = -t * 1.4;
    F.spire.material.color.setHex(Math.floor(t * 1.5) % 2 ? 0xff4d5e : 0x550010);
    // countdown lights
    const gt = (g.t || 0) / 10; F.lights.forEach((m, k) => { const on = gt >= 0 || gt > -3 + k; m.material.color.setHex(gt >= 0 ? 0x3ddc97 : (on ? 0xff2a3c : 0x330a0e)); if (F.nx && on) m.material.color.multiplyScalar(2.6); });
    for (const o of F.smoke) { o.life -= dt; const k = o.life / 0.9; o.m.scale.setScalar(1 + (1 - k) * 3); o.m.position.y += dt * 0.6; o.m.material.opacity = (o.op || 0.32) * k; if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
    F.smoke = F.smoke.filter(o => o.life > 0);
    SFX.sync(); this.audio(V, dt);
    if (F.nx) F.nx.update(dt, t);
    if (F.post) F.post.render(F.scene, F.cam3, t); else F.renderer.render(F.scene, F.cam3);
  },
  // ---- sound: your engine through the gears, the nearest rivals with a little doppler, wind, tyres and the kerb rumble
  audio(V, dt) {
    const F = V.fps, a = SFX.on ? SFX.ensure() : null; if (!a || a.state !== "running" || !F.cars) return;
    const A = F.aud || (F.aud = { me: SFX.engine(true), others: [0, 1, 2].map(() => SFX.engine(false)), sq: SFX.nloop(a, "bandpass", 1900, 7, 0.3), wind: SFX.nloop(a, "bandpass", 600, 0.5, 0), rum: SFX.nloop(a, "lowpass", 170, 0.8, 0), scr: SFX.nloop(a, "bandpass", 2400, 1.6, 0.3), rev: 0.2 });
    if (!F.ambOn) { F.ambOn = 1; const sky = rcWorld(RC_ID).sky; SFX.space("street"); SFX.amb(sky === "storm" ? "rain" : sky === "neon" ? "night" : "city"); }
    const GE = [0, 13, 24, 35, 46, 72], revOf = (v) => { v = Math.abs(v); let k = 0; while (k < 4 && v > GE[k + 1]) k++; const lo = GE[k] * 0.72; return 0.16 + 0.8 * clamp((v - lo) / (GE[k + 1] - lo), 0, 1); };
    const me = V.meIdx, c = me >= 0 && F.me ? F.me : null, live = V.h.ph === "play", cx = F.cam3.position.x, cz = F.cam3.position.z, k = 1 - Math.exp(-dt * 10);
    if (c && live) {
      const gas = F.gas || 0, waiting = ((V.g && V.g.t) || 0) < 0, tgt = waiting ? 0.2 + Math.max(0, gas) * 0.55 : revOf(c.v);
      A.rev += (tgt - A.rev) * k; A.me.set(A.rev, c.bo > 0 ? 1 : gas > 0.1 ? 0.85 : 0.12, c.bo > 0 ? 0.27 : 0.22, 0, 1);
      const sl = Math.abs(c.slip || 0), sp = Math.abs(c.v);
      A.sq.set(sp > 10 ? clamp(sl - 0.1, 0, 0.3) * 0.5 : 0, 1700 + sl * 1100, 0); A.wind.set(Math.pow(Math.min(1, sp / 62), 2) * 0.1, 380 + sp * 14, 0); A.rum.set(c.off && sp > 4 ? 0.2 * Math.min(1, sp / 20) : 0, 150, 0);
      A.scr.set(c.hitT > 0.2 && sp > 5 ? 0.09 * Math.min(1, sp / 30) : 0, 1900 + sp * 28, 0);
    } else { A.me.set(0.15, 0, 0, 0, 1); A.sq.set(0); A.wind.set(0); A.rum.set(0); A.scr.set(0); }
    // the three nearest rivals
    const near = []; F.cars.forEach((car, i) => { if (i === me || !car.init) return; const d = Math.hypot(car.x - cx, car.z - cz); car.vr = car.pd == null || dt <= 0 ? 0 : lerp(car.vr || 0, (d - car.pd) / dt, 0.2); car.pd = d; if (d < 70) near.push([d, car]); });
    near.sort((p, q) => p[0] - q[0]);
    A.others.forEach((e, n) => { const q = near[n]; if (!e) return; if (!q || !live) return e.set(0.2, 0.3, 0, 0, 1);
      const car = q[1], d = q[0], ca = F.camA || 0, pan = d > 0.5 ? clamp(((car.x - cx) * -Math.cos(ca) + (car.z - cz) * Math.sin(ca)) / d, -1, 1) * 0.8 : 0, sp = Math.hypot(car.x - (car.ax == null ? car.x : car.ax), car.z - (car.az == null ? car.z : car.az)) / Math.max(dt, 0.001);
      car.av = lerp(car.av || 0, Math.min(70, sp), 0.1); e.set(revOf(car.av), 0.75, 0.2 * Math.pow(1 - d / 70, 2), pan, clamp(1 - car.vr / 110, 0.86, 1.16)); });
    F.cars.forEach(car => { car.ax = car.x; car.az = car.z; });
  },
  hud(ctx, V, dt, t) {
    const F = V.fps, g = V.g || {}, me = V.meIdx, q = me >= 0 && g.pl ? g.pl[me] : null;
    const box = (x, y, w, h, r = 12, a = 0.72) => { ctx.fillStyle = "rgba(10,11,13," + a + ")"; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
    ctx.textBaseline = "middle";
    const gt = (g.t || 0) / 10, pos = this.places(V), n = V.ro.length;
    // speed lines while boosting
    if (F.me && F.me.bo > 0 && !F.nx) { ctx.strokeStyle = "rgba(160,230,255,.35)"; ctx.lineWidth = 2; for (let k = 0; k < 26; k++) { const a = Math.random() * Math.PI * 2, r0 = 180 + Math.random() * 120; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0 * 0.65); ctx.lineTo(W / 2 + Math.cos(a) * (r0 + 160), H / 2 + Math.sin(a) * (r0 + 160) * 0.65); ctx.stroke(); } }
    // countdown
    if (gt < 0.9 && V.h.ph === "play") {
      const k = gt < 0 ? Math.ceil(-gt) : 0, s = k > 0 ? String(k) : "GO!";
      if (s !== F.cdShown) { F.cdShown = s; if (k > 0) SFX.play("count"); else { SFX.play("go"); SFX.cheer(0.6); } }
      ctx.textAlign = "center"; ctx.font = "700 120px 'Chakra Petch', sans-serif"; ctx.lineWidth = 12; ctx.strokeStyle = "rgba(10,11,13,.85)"; ctx.strokeText(s, W / 2, H * 0.36); ctx.fillStyle = k > 0 ? "#ff4d5e" : "#3ddc97"; ctx.fillText(s, W / 2, H * 0.36);
      if (k > 0 && !F.coarse) { ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(245,241,230,.85)"; ctx.fillText("HIT THE GAS JUST BEFORE GO FOR A BOOST", W / 2, H * 0.36 + 34); }
    }
    if (F.me && F.me.tow > 0.3 && !(F.me.bo > 0)) { ctx.textAlign = "center"; ctx.font = "700 12px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(159,232,255," + Math.min(1, F.me.tow * 1.6) + ")"; ctx.fillText("SLIPSTREAM", W / 2, 116); }
    if (q) {
      // position
      box(14, 14, 150, 86, 14);
      ctx.textAlign = "left"; ctx.font = "700 54px 'Chakra Petch', sans-serif"; ctx.fillStyle = pos[me] === 1 ? "#ffd23f" : "#f5f1e6"; ctx.fillText(String(pos[me] || "-"), 26, 58);
      ctx.font = "700 20px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#9da1a9"; const pw = ctx.measureText(String(pos[me] || "-")).width; ctx.fillText(["", "ST", "ND", "RD"][pos[me]] || "TH", 30 + pw * 2.6, 46); ctx.fillText("/" + n, 30 + pw * 2.6, 72);
      // lap + times
      box(W - 214, 14, 200, 70, 14);
      ctx.textAlign = "right"; ctx.font = "700 30px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#f5f1e6"; ctx.fillText("LAP " + Math.min(RC_LAPS, q[1] + 1) + "/" + RC_LAPS, W - 28, 40);
      const lapStart = (g.t || 0) / 10 * 1000 - 0; const done = q[2];
      ctx.font = "700 14px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9";
      const sumPrev = q[1] ? null : 0;
      ctx.fillText("BEST " + (q[4] ? (q[4] / 1000).toFixed(2) : "--.--"), W - 28, 68);
      // lap toasts
      if (q[1] > F.lastLd && !done) { F.toast = { s: q[1] === RC_LAPS - 1 ? "FINAL LAP" : "LAP " + (q[1] + 1), sub: q[6] ? (q[6] / 1000).toFixed(2) + " s" : "", life: 2.2, col: q[1] === RC_LAPS - 1 ? "#ff6b57" : "#ffd23f" }; SFX.play("count"); }
      F.lastLd = q[1];
      if (done && !F.finShown) { F.finShown = true; SFX.samp("applause1", done === 1 ? 0.7 : 0.45, 0, 1, 0, 0.25, 0.5); F.toast = { s: done === 1 ? "WINNER!" : "FINISHED " + done + (["", "ST", "ND", "RD"][done] || "TH"), sub: (q[3] / 1000).toFixed(2) + " s", life: 4, col: done === 1 ? "#ffd23f" : "#3ddc97" }; SFX.play(done === 1 ? "win" : "count"); }
      // wrong way
      if (F.lastDist != null && q[0] < F.lastDist - 1 && !done) F.wrongT = Math.min(2, F.wrongT + dt * 3); else F.wrongT = Math.max(0, F.wrongT - dt);
      F.lastDist = q[0];
      if (F.wrongT > 0.8 && gt > 0) { ctx.textAlign = "center"; ctx.font = "700 40px 'Chakra Petch', sans-serif"; ctx.fillStyle = Math.floor(t * 4) % 2 ? "#ff4d5e" : "#ffd23f"; ctx.fillText("WRONG WAY", W / 2, H * 0.3); }
      // item slot
      const IT = RC_ITEMS[q[7]];
      box(W / 2 - 110, 14, 220, 56, 12, 0.78);
      if (IT) { ctx.textAlign = "center"; ctx.fillStyle = IT.c; ctx.font = "700 22px 'Chakra Petch', sans-serif"; ctx.fillText(IT.n, W / 2, 36); ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.fillText((F.coarse ? "ITEM" : "E") + " · " + IT.d, W / 2, 56); ctx.strokeStyle = IT.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(W / 2 - 110, 14, 220, 56, 12); ctx.stroke(); }
      else { ctx.textAlign = "center"; ctx.fillStyle = "#5d6169"; ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillText("NO ITEM · HIT A ? BOX", W / 2, 42); }
      if (q[10] > 0) { ctx.fillStyle = "#3ddc97"; ctx.font = "700 12px 'JetBrains Mono', monospace"; ctx.fillText("FIREWALL " + (q[10] / 10).toFixed(1) + "s", W / 2, 84); }
      // blaster heat
      { const heat = (q[13] || 0) / 10, oh = !!q[14], wq = 150; box(W / 2 - wq / 2 - 10, H - 104, wq + 20, 34, 10, 0.6); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(W / 2 - wq / 2, H - 82, wq, 6); ctx.fillStyle = oh ? (Math.floor(t * 6) % 2 ? "#ff4d5e" : "#ffd23f") : "#4cc9f0"; ctx.fillRect(W / 2 - wq / 2, H - 82, wq * clamp(heat / RC_HEAT_MAX, 0, 1), 6); ctx.textAlign = "center"; ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillStyle = oh ? "#ff4d5e" : "#9da1a9"; ctx.fillText(oh ? "OVERHEATED" : (F.coarse ? "SHOOT" : "CLICK / Q") + " · PING CANNON", W / 2, H - 92); }
      if (F.blindT > 0) { const a = Math.min(1, F.blindT / 1.2) * 0.85; const gr = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7); gr.addColorStop(0, "rgba(200,204,212," + a * 0.75 + ")"); gr.addColorStop(1, "rgba(170,175,184," + a + ")"); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
      if (F.zapT > 0) { ctx.fillStyle = "rgba(76,201,240," + F.zapT * 0.6 + ")"; ctx.fillRect(0, 0, W, H); }
      if (F.me && F.me.slow > 0) { ctx.fillStyle = "#4cc9f0"; ctx.font = "700 12px 'JetBrains Mono', monospace"; ctx.fillText("SLOWED", W / 2, 98); }
      // speedo
      const c = F.me, mph = Math.round(Math.abs(c ? c.v : 0) * 2.2);
      box(W - 214, H - 108, 200, 94, 14);
      const cx0 = W - 114, cy0 = H - 38, R = 52, k = clamp(Math.abs(c ? c.v : 0) / RC_BOOST, 0, 1);
      ctx.lineWidth = 8; ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.arc(cx0, cy0, R, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.strokeStyle = c && c.bo > 0 ? "#4cc9f0" : k > 0.68 ? "#ff6b57" : "#ffd23f"; ctx.beginPath(); ctx.arc(cx0, cy0, R, Math.PI * 1.05, Math.PI * (1.05 + 0.9 * k)); ctx.stroke();
      ctx.textAlign = "center"; ctx.font = "700 30px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(String(mph), cx0, cy0 - 14); ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.fillText("MPH", cx0, cy0 + 8);
      // drift charge
      if (c && c.dc > 0.1) { const ch = Math.min(1, c.dc / 2.2); box(W / 2 - 110, H - 60, 220, 34, 10); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(W / 2 - 96, H - 40, 192, 8); ctx.fillStyle = c.dc > 0.6 ? "#4cc9f0" : "#9da1a9"; ctx.fillRect(W / 2 - 96, H - 40, 192 * ch, 8); ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(c.dc > 0.6 ? "TURBO READY" : "DRIFT", W / 2, H - 51); }
    }
    if (F.toast) { F.toast.life -= dt; const o = F.toast; ctx.globalAlpha = Math.min(1, o.life * 2); ctx.textAlign = "center"; ctx.font = "700 54px 'Chakra Petch', sans-serif"; ctx.lineWidth = 10; ctx.strokeStyle = "rgba(10,11,13,.85)"; ctx.strokeText(o.s, W / 2, H * 0.24); ctx.fillStyle = o.col; ctx.fillText(o.s, W / 2, H * 0.24); if (o.sub) { ctx.font = "700 20px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(o.sub, W / 2, H * 0.24 + 46); } ctx.globalAlpha = 1; if (o.life <= 0) F.toast = null; }
    // minimap with standings
    const [mnx, mxx, mnz, mxz] = RC.box, mw = 150, mh = mw * (mxz - mnz) / (mxx - mnx), ox = 14, oy = H - mh - 30;
    box(ox - 6, oy - 8, mw + 12, mh + 16, 10, 0.65);
    const mpx = (x) => ox + (x - mnx) / (mxx - mnx) * mw, mpz = (z) => oy + (z - mnz) / (mxz - mnz) * mh;
    ctx.strokeStyle = "rgba(245,241,230,.55)"; ctx.lineWidth = 4; ctx.beginPath(); RC.pts.forEach((p, i) => i ? ctx.lineTo(mpx(p[0]), mpz(p[1])) : ctx.moveTo(mpx(p[0]), mpz(p[1]))); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "#f5f1e6"; ctx.fillRect(mpx(RC.pts[0][0]) - 3, mpz(RC.pts[0][1]) - 3, 6, 6);
    ctx.textAlign = "left"; ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.fillText(RC_TRACKS[RC_ID].n.toUpperCase(), ox, oy - 16);
    V.ro.forEach((r, i) => { const p = F.remote[i]; if (!p) return; ctx.fillStyle = r.hex; ctx.beginPath(); ctx.arc(mpx(p.x), mpz(p.z), i === me ? 5 : 3.5, 0, 7); ctx.fill(); if (i === me) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); } });
    if (F.stick) { const s = APP.gameScale || 1, rr = $("#gameCanvas").getBoundingClientRect(); const bx = (F.stick.bx - rr.left) / s, by = H - 150; ctx.strokeStyle = "rgba(245,241,230,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx - 70 / s, by); ctx.lineTo(bx + 70 / s, by); ctx.stroke(); ctx.fillStyle = "rgba(245,241,230,.45)"; ctx.beginPath(); ctx.arc((F.stick.x - rr.left) / s, by, 20 / s, 0, 7); ctx.fill(); }
  },
};
GAMES.race = race;
GAME_ORDER.push("race");
