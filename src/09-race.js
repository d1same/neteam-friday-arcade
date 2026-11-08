// ======================= NETEAM GRAND PRIX: 3D street race through a night-time NYC =======================
const RC_CTRL = [[0, 0], [70, -8], [135, 0], [178, 32], [186, 84], [160, 126], [116, 134], [92, 108], [66, 98], [42, 128], [0, 146], [-48, 132], [-70, 92], [-48, 58], [-72, 26], [-52, -6]];
const RC_HW = 8, RC_WALL = 13, RC_LAPS = 3;
const RC = (() => {
  // closed Catmull-Rom spline sampled to ~1.6 unit steps
  const P = RC_CTRL, n = P.length, raw = [];
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      raw.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  let len = 0; const cum = [0];
  for (let i = 1; i <= raw.length; i++) { const a = raw[i - 1], b = raw[i % raw.length]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); cum.push(len); }
  const N = Math.round(len / 1.6), pts = [];
  let j = 0;
  for (let k = 0; k < N; k++) {
    const d = k / N * len; while (cum[j + 1] < d) j++;
    const a = raw[j], b = raw[(j + 1) % raw.length], f = (d - cum[j]) / (cum[j + 1] - cum[j] || 1);
    pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  const tan = pts.map((p, i) => { const q = pts[(i + 1) % N], o = pts[(i - 1 + N) % N]; const dx = q[0] - o[0], dz = q[1] - o[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; });
  const curv = pts.map((p, i) => { const a = tan[(i - 3 + N) % N], b = tan[(i + 3) % N]; return Math.abs(Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1])); });
  let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9; pts.forEach(p => { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mnz = Math.min(mnz, p[1]); mxz = Math.max(mxz, p[1]); });
  return { pts, tan, curv, N, len, box: [mnx, mxx, mnz, mxz] };
})();
// boost pads: [sample index, lateral offset]
const RC_PADS = [[0.08, 0], [0.2, -4], [0.36, 4], [0.5, 0], [0.64, -4], [0.8, 3], [0.92, -3]].map(([f, l]) => [Math.round(f * RC.N), l]);
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
const RC_MAX = 44, RC_BOOST = 62, RC_GRASS = 20;

// shared car physics (used by the client for its own car and by the host for bots)
function rcDrive(c, dt, gas, steer, drift, isBot) {
  const near = rcNearest(c.x, c.z, c.i); c.i = near.i;
  const off = Math.abs(near.lat) > RC_HW + 0.6;
  c.bo = Math.max(0, (c.bo || 0) - dt);
  const top = (c.bo > 0 ? RC_BOOST : RC_MAX) * (off ? RC_GRASS / RC_MAX : 1) * (c.skill || 1);
  if (gas > 0) c.v += (c.v < top ? (c.bo > 0 ? 40 : 24) : -30) * gas * dt;
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
    c.a -= da * 0.35; c.v *= 0.9; c.hitT = 0.3;
  }
  // boost pads
  for (const [pi, pl] of RC_PADS) { const d = Math.abs(rcWrap(n2.i - pi)); if (d <= 2 && Math.abs(n2.lat - pl) < 2.6 && c.v > 5) { if (!(c.bo > 0.9)) c.boEv = (c.boEv || 0) + 1; c.bo = Math.max(c.bo, 1.3); } }
  c.lat = n2.lat; c.off = Math.abs(n2.lat) > RC_HW + 0.6;
  return c;
}

const race = {
  id: "race", title: "Neteam Grand Prix", tag: "3D street race · night NYC", custom3d: true,
  blurb: "3 laps around midnight Manhattan. Boost pads go fast. Drift for turbo.",
  how: [],
  keys: ["W gas", "S brake", "A / D steer", "Space drift", "R reset", "C camera"],
  rec: { label: "Best lap", better: "min", fmt: v => (v / 1000).toFixed(2) + " s" },
  GRID: 4, LIMIT: 300, GRACE: 25,
  fill(n) { return Math.max(6, Math.min(8, n)); },
  hostStart(S) {
    const P = S.ro.map((r, i) => {
      const row = Math.floor(i / 2), side = i % 2 ? 1 : -1;
      const idx = RC.N - 6 - row * 5, pos = rcAt(idx, side * 3.6);
      return { x: pos[0], z: pos[1], a: rcHead(idx), v: 0, i: idx, dist: idx - RC.N, ld: 0, lt: [], fin: 0, ft: 0, rsq: 1, bo: 0,
        bot: r.b ? { skill: (r.boss ? 0.97 : 0.86) + Math.random() * 0.07, lane: (Math.random() - 0.5) * 6, lT: 0, dr: 0 } : null, skill: r.b ? 1 : 1 };
    });
    P.forEach(p => { if (p.bot) p.skill = p.bot.skill; });
    S.g = { t: -this.GRID, P, place: 0, firstFin: 0 };
  },
  hostTick(S, dt, inputs) {
    const g = S.g; g.t += dt;
    const go = g.t >= 0;
    g.P.forEach((p, i) => {
      const prevI = p.i;
      if (p.bot) {
        if (go) this.botTick(S, i, dt);
      } else {
        const inp = inputs[i];
        if (inp && go && Number.isFinite(inp.x) && Number.isFinite(inp.z)) {
          const n = rcNearest(inp.x, inp.z, p.i);
          if (Math.abs(rcWrap(n.i - p.i)) < 60) { p.x = inp.x; p.z = inp.z; p.a = +inp.a || 0; p.v = +inp.v || 0; p.i = n.i; p.bo = inp.bo ? 1 : 0; }
        }
      }
      if (!go || p.fin) return;
      p.dist += rcWrap(p.i - prevI);
      const ld = p.dist < 0 ? 0 : Math.floor(p.dist / RC.N);
      if (ld > p.ld) { const prevT = p.lt.reduce((s, v) => s + v, 0); p.lt.push(Math.round(g.t * 1000) - prevT); p.ld = ld;
        if (ld >= RC_LAPS) { p.fin = ++g.place; p.ft = Math.round(g.t * 1000); if (!g.firstFin) g.firstFin = g.t; } }
    });
  },
  botTick(S, i, dt) {
    const g = S.g, p = g.P[i], b = p.bot;
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
    rcDrive(p, dt, gas, steer, ahead > 0.35 && p.v > 30, true);
    // nudge apart from other cars
    g.P.forEach((q, j) => { if (j === i) return; const dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz); if (d < 2.6 && d > 0.01) { p.x += dx / d * (2.6 - d) * 0.5; p.z += dz / d * (2.6 - d) * 0.5; } });
  },
  pack(S) {
    const g = S.g;
    return { t: Math.round(g.t * 10), pl: g.P.map(p => [Math.round(p.dist), p.ld, p.fin, p.ft, p.lt.length ? Math.min(...p.lt) : 0, p.rsq, p.lt.length ? p.lt[p.lt.length - 1] : 0]),
      bt: g.P.map(p => p.bot ? [+p.x.toFixed(2), +p.z.toFixed(2), +p.a.toFixed(3), +p.v.toFixed(1), p.bo > 0 ? 1 : 0, +(p.slip || 0).toFixed(2)] : 0) };
  },
  timeLeft(S) { const g = S.g; if (g.t < 0) return -g.t * 1000; if (g.firstFin) return Math.max(0, (g.firstFin + this.GRACE - g.t) * 1000); return (this.LIMIT - g.t) * 1000; },
  done(S) { const g = S.g; const humans = g.P.filter((p, i) => !S.ro[i].b); return g.t >= this.LIMIT || (g.firstFin && g.t >= g.firstFin + this.GRACE) || (humans.length && humans.every(p => p.fin)); },
  rank(S) {
    const g = S.g;
    return g.P.map((p, i) => ({ i, p, best: p.lt.length ? Math.min(...p.lt) : 0 }))
      .sort((a, b) => (a.p.fin || 99) - (b.p.fin || 99) || b.p.dist - a.p.dist)
      .map(o => ({ i: o.i, v: o.p.fin ? -o.p.ft : o.p.dist, label: o.p.fin ? "Finished " + (o.p.ft / 1000).toFixed(1) + " s" + (o.best ? " · best lap " + (o.best / 1000).toFixed(2) : "") : "DNF · lap " + Math.min(RC_LAPS, o.p.ld + 1) + "/" + RC_LAPS, rec: o.best }));
  },
  chip(V, i) { const q = V.g && V.g.pl && V.g.pl[i]; if (!q) return ""; return q[2] ? "P" + q[2] + " 🏁" : "L" + Math.min(RC_LAPS, q[1] + 1); },
  places(V) {
    const pl = (V.g && V.g.pl) || [];
    const ord = pl.map((q, i) => ({ i, q })).sort((a, b) => (a.q[2] || 99) - (b.q[2] || 99) || b.q[0] - a.q[0]);
    const pos = []; ord.forEach((o, k) => pos[o.i] = k + 1); return pos;
  },

  cardArt(ctx, ro, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#090b24"); sky.addColorStop(0.55, "#3a1a4f"); sky.addColorStop(0.62, "#ff7a59"); sky.addColorStop(0.63, "#14112a"); sky.addColorStop(1, "#0b0e20");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const rnd = mulberry32(5);
    for (let x = -20; x < W; x += 34 + rnd() * 30) { const h = 80 + rnd() * 230, w = 30 + rnd() * 50; ctx.fillStyle = "#151a3a"; ctx.fillRect(x, H * 0.62 - h, w, h); ctx.fillStyle = "rgba(255,210,120,.55)"; for (let y = H * 0.62 - h + 8; y < H * 0.62 - 6; y += 12) for (let k = 4; k < w - 6; k += 9) if (rnd() < 0.4) ctx.fillRect(x + k, y, 4, 5); }
    // road in perspective
    ctx.fillStyle = "#23263a"; ctx.beginPath(); ctx.moveTo(W * 0.46, H * 0.62); ctx.lineTo(W * 0.54, H * 0.62); ctx.lineTo(W * 1.05, H); ctx.lineTo(-W * 0.05, H); ctx.fill();
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
    ctx.font = "400 58px Bungee, Impact, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#ffd23f"; ctx.fillText("GRAND PRIX", W / 2, H * 0.14);
    ctx.font = "400 30px Bungee, Impact, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "rgba(245,241,230,.8)"; ctx.fillText("3D", 24, H - 30);
  },

  // ---------------- client ----------------
  clientEnter(V) {
    const F = V.fps = { ready: false, failed: false, me: null, rsq: -1, cam: 0, stick: null, brake: false, drift: false, remote: {}, lastBoEv: 0, toast: null, lastLd: 0, prevPos: 0, wrongT: 0, lastDist: null, shake: 0 };
    loadThree().then(ok => { if (!ok) { F.failed = true; return; } if (APP.V === V) this.build(V); });
    const cv = $("#gameCanvas"), unb = F.unbind = [];
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); unb.push(() => el.removeEventListener(ev, fn, o)); };
    on(window, "keydown", (e) => { if (APP.view !== "game") return; if (e.code === "Space") { F.drift = true; e.preventDefault(); } if (e.repeat) return; if (e.code === "KeyR") this.reset(V); if (e.code === "KeyC") { F.cam = (F.cam + 1) % 3; toast(["Chase camera", "Far chase camera", "Hood camera"][F.cam]); } });
    on(window, "keyup", (e) => { if (e.code === "Space") F.drift = false; });
    const coarse = matchMedia("(pointer: coarse)").matches; F.coarse = coarse;
    on(cv, "touchstart", (e) => { for (const t of e.changedTouches) if (!F.stick) F.stick = { id: t.identifier, bx: t.clientX, x: t.clientX }; e.preventDefault(); }, { passive: false });
    on(cv, "touchmove", (e) => { for (const t of e.changedTouches) if (F.stick && t.identifier === F.stick.id) F.stick.x = t.clientX; e.preventDefault(); }, { passive: false });
    const tend = (e) => { for (const t of e.changedTouches) if (F.stick && t.identifier === F.stick.id) F.stick = null; };
    on(cv, "touchend", tend); on(cv, "touchcancel", tend);
    if (coarse && V.meIdx >= 0) {
      const tc = document.createElement("div"); tc.className = "ops-touch race-touch";
      const mk = (txt, cls, k) => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = txt; b.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); F[k] = true; }, { passive: false }); b.addEventListener("touchend", (e) => { e.preventDefault(); F[k] = false; }); tc.append(b); return b; };
      mk("DRIFT", "t-fire", "drift"); mk("BRAKE", "t-r", "brake");
      const rs = document.createElement("button"); rs.type = "button"; rs.textContent = "RESET"; rs.addEventListener("touchstart", (e) => { e.preventDefault(); this.reset(V); }, { passive: false }); tc.append(rs);
      $("#stagebox").append(tc); F.touch = tc;
    }
  },
  clientExit(V) {
    const F = V.fps; if (!F) return;
    (F.unbind || []).forEach(f => f());
    if (F.post) try { F.post.dispose(); } catch (e) {}
    if (F.renderer) { try { F.renderer.dispose(); F.renderer.forceContextLoss(); } catch (e) {} }
    [F.cv, F.touch].forEach(el => el && el.remove());
    V.fps = null;
  },
  reset(V) {
    const F = V.fps; if (!F || !F.me) return;
    const c = F.me, n = rcNearest(c.x, c.z, c.i), p = rcAt(n.i, 0);
    c.x = p[0]; c.z = p[1]; c.a = rcHead(n.i); c.v = Math.min(c.v, 8); c.slip = 0; c.dc = 0; SFX.play("pop");
  },
  clientInput(V, dt, inp) {
    const F = V.fps; if (!F) return null;
    const me = V.meIdx; if (me < 0) return null;
    const g = V.g || {}, q = g.pl && g.pl[me];
    if (!F.me) {
      const row = Math.floor(me / 2), side = me % 2 ? 1 : -1, idx = RC.N - 6 - row * 5, p = rcAt(idx, side * 3.6);
      F.me = { x: p[0], z: p[1], a: rcHead(idx), v: 0, i: idx, bo: 0, skill: 1 };
    }
    const c = F.me, go = g.t != null && g.t >= 0 && V.h.ph === "play", fin = q && q[2];
    let steer = inp.dx, gas = -inp.dy;
    if (F.stick) { steer = clamp((F.stick.x - F.stick.bx) / 70, -1, 1); }
    if (F.coarse) gas = F.brake ? -1 : 1;
    if (!go) { gas = 0; c.v = 0; }
    if (fin) { gas = Math.max(0, gas) * 0.3; }
    const ev = c.boEv || 0;
    rcDrive(c, dt, gas, steer, F.drift, false);
    if ((c.boEv || 0) !== ev) { SFX.play("dash"); SFX.tone(500, 0.3, "sawtooth", 0.04, 700); F.shake = 0.25; }
    if (c.hitT > 0) { if (!F.hitPlayed) { SFX.play("bump"); F.hitPlayed = true; F.shake = 0.3; } c.hitT -= dt; } else F.hitPlayed = false;
    // keep cars from overlapping
    Object.keys(F.remote).forEach(k => { if (+k === me) return; const o = F.remote[k]; const dx = c.x - o.x, dz = c.z - o.z, d = Math.hypot(dx, dz); if (d < 2.6 && d > 0.01) { c.x += dx / d * (2.6 - d) * 0.6; c.z += dz / d * (2.6 - d) * 0.6; c.v *= 0.995; } });
    F.steer = steer; F.gas = gas;
    return { x: +c.x.toFixed(2), z: +c.z.toFixed(2), a: +c.a.toFixed(3), v: +c.v.toFixed(1), bo: c.bo > 0 ? 1 : 0, sl: +(c.slip || 0).toFixed(2), dr: c.dc > 0.1 ? 1 : 0 };
  },
  build(V) {
    const F = V.fps; if (!F || F.ready) return;
    const T = THREE;
    const cv = document.createElement("canvas"); cv.className = "fps3d";
    Object.assign(cv.style, { position: "absolute", borderRadius: "10px", pointerEvents: "none" });
    $("#stagebox").insertBefore(cv, $("#gameCanvas")); F.cv = cv;
    let renderer;
    const low = GFX.lowEnd();
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: low, powerPreference: "high-performance" }); } catch (e) { F.failed = true; return; }
    renderer.setPixelRatio(Math.min(low ? 1.25 : 1.75, devicePixelRatio || 1));
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    F.renderer = renderer;
    F.post = GFX.post(renderer, { strength: 1.0, threshold: 1.0, vignette: 0.5, low });
    const scene = new T.Scene(); F.scene = scene;
    scene.fog = new T.FogExp2(0x1c1438, 0.0042);
    const cam = new T.PerspectiveCamera(68, 16 / 10, 0.1, 900); F.cam3 = cam;
    const mk = (w, h, fn) => { const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };
    // sky dome with a dusk gradient and stars
    const skyTex = mk(32, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#05061a"); g.addColorStop(0.35, "#1a1446"); g.addColorStop(0.47, "#5a2a6a"); g.addColorStop(0.5, "#ff8a5c"); g.addColorStop(0.53, "#2a1a48"); g.addColorStop(1, "#120e26"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "#fff"; for (let i = 0; i < 40; i++) x.fillRect(Math.random() * w, Math.random() * h * 0.4, 1, 1); });
    const sky = new T.Mesh(new T.SphereGeometry(800, 32, 16), new T.MeshBasicMaterial({ map: skyTex, side: T.BackSide, fog: false })); scene.add(sky); F.sky = sky;
    scene.environment = GFX.env(renderer, { base: 0x120f28, panels: [[0, 8.9, 0, 10, 0.1, 10, 0x2a2060, 2], [-9.9, 4, 0, 0.1, 4, 16, 0xff9a5c, 2.5], [9.9, 3, 0, 0.1, 6, 16, 0x5c8aff, 1.5], [0, 2, -9.9, 16, 3, 0.1, 0xffd58a, 3], [0, 2, 9.9, 16, 3, 0.1, 0x9fd8ff, 2]] });
    scene.add(new T.HemisphereLight(0x8a90ff, 0x2a1830, 1.1));
    const moon = new T.DirectionalLight(0xffd7b0, 1.6); moon.position.set(-200, 160, -120); scene.add(moon);
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
    const barTex = mk(512, 64, (x, w, h) => { x.fillStyle = "#1f6fd1"; x.fillRect(0, 0, w, h); x.fillStyle = "#ffd23f"; x.fillRect(0, h - 10, w, 10); x.fillStyle = "#f5f1e6"; x.font = "400 34px Bungee, Impact, sans-serif"; x.textBaseline = "middle"; x.fillText("NETEAM SOLUTIONS", 20, h / 2 - 4); x.fillStyle = "#ffd23f"; x.fillText("IT · NYC", 360, h / 2 - 4); });
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
    const banTex = mk(1024, 128, (x, w, h) => { x.fillStyle = "#0b0e20"; x.fillRect(0, 0, w, h); x.strokeStyle = "#ffd23f"; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8); x.fillStyle = "#ffd23f"; x.font = "400 70px Bungee, Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NETEAM GRAND PRIX", w / 2, h / 2 + 4); });
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
    const hqTex = mk(256, 512, (x, w, h) => { x.fillStyle = "#101634"; x.fillRect(0, 0, w, h); for (let y = 70; y < h; y += 16) for (let k = 8; k < w; k += 16) { x.fillStyle = Math.random() < 0.6 ? "#9fd8ff" : "#1a2148"; x.fillRect(k, y, 10, 9); } x.fillStyle = "#ffd23f"; x.fillRect(0, 0, w, 56); x.fillStyle = "#0b0e20"; x.font = "400 40px Bungee, Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NETEAM", w / 2, 30); });
    const hq = new T.Mesh(new T.BoxGeometry(18, 110, 18), new T.MeshStandardMaterial({ map: hqTex, emissiveMap: hqTex, emissive: 0xffffff, emissiveIntensity: 1 })); hq.position.set(hqPos[0], 55, hqPos[1]); scene.add(hq);
    const spire = new T.Mesh(new T.CylinderGeometry(0.3, 0.8, 20, 8), new T.MeshBasicMaterial({ color: 0xff4d5e })); spire.position.set(hqPos[0], 120, hqPos[1]); scene.add(spire); F.spire = spire;
    const bb = (lines, fi, lat, col) => {
      const tex = mk(512, 256, (x, w, h) => { x.fillStyle = "#0b0e20"; x.fillRect(0, 0, w, h); x.strokeStyle = col; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); x.textAlign = "center"; x.textBaseline = "middle"; lines.forEach((l, k) => { x.fillStyle = k ? "#f5f1e6" : col; x.font = (k ? "700 34px Figtree, sans-serif" : "400 56px Bungee, Impact, sans-serif"); x.fillText(l, w / 2, 80 + k * 70); }); });
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
    for (let k = 0; k < RC.N; k += 66) { const p = rcAt(k, 0); const l = new T.PointLight(0xffd7a0, 30, 60, 1.6); l.position.set(p[0], 9, p[1]); scene.add(l); }
    // trees in the park
    const trunkM = new T.MeshStandardMaterial({ color: 0x4a3222 }), leafM = new T.MeshStandardMaterial({ color: 0x2f7a46, roughness: 0.9 });
    const trees = [];
    for (let k = 0; k < 140; k++) { const x = mnx + Math.random() * (mxx - mnx), z = mnz + Math.random() * (mxz - mnz); const n = rcNearest(x, z, -1); if (Math.abs(n.lat) < RC_WALL + 5) continue; trees.push([x, z, 0.8 + Math.random() * 0.8]); }
    const tIm = new T.InstancedMesh(new T.CylinderGeometry(0.25, 0.35, 2.4, 6), trunkM, trees.length), lIm = new T.InstancedMesh(new T.IcosahedronGeometry(1.8, 0), leafM, trees.length);
    trees.forEach(([x, z, s], i) => { m4.makeScale(s, s, s).setPosition(x, 1.2 * s, z); tIm.setMatrixAt(i, m4); m4.makeScale(s, s * 1.2, s).setPosition(x, 3.3 * s, z); lIm.setMatrixAt(i, m4); });
    scene.add(tIm, lIm);
    // cars: extruded body + glass cabin, clear-coat paint, real-looking wheels, glowing lights, headlight pool on the road
    const prof = (pts, depth, bevel) => { const sh = new T.Shape(); pts.forEach((p, k) => k ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 6 }); g.translate(0, 0, -depth / 2); g.rotateY(-Math.PI / 2); g.computeVertexNormals(); return g; };
    const bodyGeo = prof([[-2.15, 0.32], [2.05, 0.32], [2.25, 0.45], [2.25, 0.62], [1.4, 0.86], [0.9, 0.95], [-1.6, 0.98], [-2.2, 1.02], [-2.25, 0.62]], 1.8, 0.12);
    const cabGeo = prof([[-1.25, 0.95], [1.0, 0.95], [0.35, 1.42], [-0.65, 1.45], [-1.15, 1.12]], 1.48, 0.08);
    const tireGeo = new T.CylinderGeometry(0.43, 0.43, 0.36, 22); tireGeo.rotateZ(Math.PI / 2);
    const rimGeo = new T.CylinderGeometry(0.27, 0.27, 0.38, 12); rimGeo.rotateZ(Math.PI / 2);
    const tireM = new T.MeshStandardMaterial({ color: 0x111218, roughness: 0.85 }), rimM = new T.MeshStandardMaterial({ color: 0xc8ccd8, metalness: 1, roughness: 0.25 });
    const glassM = new T.MeshPhysicalMaterial({ color: 0x0a0f22, metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 });
    const darkM = new T.MeshStandardMaterial({ color: 0x14172a, metalness: 0.5, roughness: 0.45 });
    const headM = new T.MeshBasicMaterial({ color: new T.Color(3, 2.9, 2.6) }), tailM = new T.MeshBasicMaterial({ color: new T.Color(3, 0.25, 0.3) });
    const beamTex = GFX.tex(64, 128, (x, w, h) => { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, "rgba(255,240,210,.55)"); g.addColorStop(1, "rgba(255,240,210,0)"); x.fillStyle = g; x.beginPath(); x.moveTo(w * 0.3, h); x.lineTo(w * 0.7, h); x.lineTo(w, 0); x.lineTo(0, 0); x.fill(); });
    const beamM = new T.MeshBasicMaterial({ map: beamTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    const glowM = (c) => new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(c), transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    F.smokeM = new T.SpriteMaterial({ map: GFX.glowTex(), color: 0x9aa0b8, transparent: true, opacity: 0.35, depthWrite: false });
    F.smoke = [];
    F.cars = V.ro.map((r, i) => {
      const grp = new T.Group(), body = new T.Group(); grp.add(body);
      const paint = new T.MeshPhysicalMaterial({ color: new T.Color(r.hex), metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 });
      const shell = new T.Mesh(bodyGeo, paint), cab = new T.Mesh(cabGeo, glassM);
      const stripe = new T.Mesh(new T.BoxGeometry(0.42, 0.02, 3.4), new T.MeshStandardMaterial({ color: 0xf5f1e6, roughness: 0.3 })); stripe.position.set(0, 1.0, -0.2);
      const hood = new T.Mesh(new T.BoxGeometry(0.42, 0.02, 1.1), stripe.material); hood.position.set(0, 0.92, 1.55); hood.rotation.x = 0.12;
      const splitter = new T.Mesh(new T.BoxGeometry(2.0, 0.06, 0.4), darkM); splitter.position.set(0, 0.3, 2.2);
      const diff = new T.Mesh(new T.BoxGeometry(1.8, 0.18, 0.3), darkM); diff.position.set(0, 0.36, -2.2);
      const wing = new T.Mesh(new T.BoxGeometry(2.1, 0.06, 0.45), darkM); wing.position.set(0, 1.32, -1.95);
      const wl = new T.Mesh(new T.BoxGeometry(0.06, 0.32, 0.25), darkM); wl.position.set(-0.75, 1.15, -1.95); const wr = wl.clone(); wr.position.x = 0.75;
      const hl = new T.Mesh(new T.BoxGeometry(0.55, 0.09, 0.08), headM); hl.position.set(-0.62, 0.66, 2.3); hl.rotation.x = -0.4; const hr = hl.clone(); hr.position.x = 0.62;
      const tl = new T.Mesh(new T.BoxGeometry(1.7, 0.07, 0.06), tailM); tl.position.set(0, 0.86, -2.36);
      const hg1 = new T.Sprite(glowM(0xfff0d0)); hg1.scale.set(1.3, 0.8, 1); hg1.position.set(-0.62, 0.66, 2.45); const hg2 = hg1.clone(); hg2.position.x = 0.62;
      const tg = new T.Sprite(glowM(0xff2a3c)); tg.scale.set(2.4, 0.7, 1); tg.position.set(0, 0.86, -2.45);
      const beam = new T.Mesh(new T.PlaneGeometry(5, 14), beamM); beam.rotation.set(-Math.PI / 2, 0, Math.PI); beam.position.set(0, 0.04, 9.4);
      body.add(shell, cab, stripe, hood, splitter, diff, wing, wl, wr, hl, hr, tl, hg1, hg2, tg, beam);
      const wheels = [[-0.98, 1.38], [0.98, 1.38], [-0.98, -1.4], [0.98, -1.4]].map(([x, z]) => { const w = new T.Group(); w.add(new T.Mesh(tireGeo, tireM), new T.Mesh(rimGeo, rimM)); w.position.set(x, 0.43, z); grp.add(w); return w; });
      // the driver: your character riding on top
      const spr = new T.Sprite(new T.SpriteMaterial({ map: frenzy.charTex(r.c, r.hex, r.n), transparent: true })); spr.scale.set(1.5, 1.88, 1); spr.position.set(0, 2.2, -0.3); body.add(spr);
      const flame = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(0.6, 2.2, 3.2), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); flame.scale.set(1.4, 1.4, 1); flame.position.set(0, 0.55, -2.7); flame.visible = false; body.add(flame);
      const glow = new T.Mesh(new T.PlaneGeometry(3, 5.4), new T.MeshBasicMaterial({ map: GFX.glowTex(), color: new T.Color(r.hex).multiplyScalar(1.4), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.05; grp.add(glow);
      const shad = new T.Mesh(new T.PlaneGeometry(2.8, 5.4), new T.MeshBasicMaterial({ map: GFX.shadowTex(), transparent: true, depthWrite: false })); shad.rotation.x = -Math.PI / 2; shad.position.y = 0.03; grp.add(shad);
      scene.add(grp);
      return { grp, body, wheels, flame, spr, x: 0, z: 0, a: 0, init: false, roll: 0, smokeT: 0 };
    });
    F.ready = true;
  },
  draw(ctx, V, dt, t) {
    const F = V.fps; ctx.clearRect(0, 0, W, H); if (!F) return;
    if (F.failed) { ctx.fillStyle = "#0b0e20"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#f5f1e6"; ctx.font = "700 20px Figtree, sans-serif"; ctx.textAlign = "center"; ctx.fillText("3D isn't available in this browser. Try Chrome, Edge, Firefox or Safari.", W / 2, H / 2); return; }
    if (!F.ready) { ctx.fillStyle = "#0b0e20"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#ffd23f"; ctx.font = "400 26px Bungee, Impact, sans-serif"; ctx.textAlign = "center"; ctx.fillText("WARMING UP THE ENGINES…", W / 2, H / 2); return; }
    this.render3d(V, dt, t); this.hud(ctx, V, dt, t);
  },
  render3d(V, dt, t) {
    const F = V.fps, T = THREE, g = V.g || {};
    const gc = $("#gameCanvas"); const w = parseFloat(gc.style.width) || 960, h = parseFloat(gc.style.height) || 600;
    if (F.w !== w || F.h !== h) { F.w = w; F.h = h; F.renderer.setSize(w, h, false); Object.assign(F.cv.style, { width: w + "px", height: h + "px" }); F.cam3.aspect = w / h; F.cam3.updateProjectionMatrix(); }
    F.cv.style.left = gc.offsetLeft + "px"; F.cv.style.top = gc.offsetTop + "px"; pinToStage(F, w, h);
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
      car.body.rotation.y = -(sl || 0) * 0.8; car.body.rotation.z = lerp(car.body.rotation.z, (sl || 0) * 0.25, 0.2);
      car.roll += (v || 0) * dt / 0.42; car.wheels.forEach(wh => wh.rotation.x = car.roll);
      car.flame.visible = !!bo; if (bo) { const fs = 1.2 + Math.random() * 0.7; car.flame.scale.set(fs, fs, 1); }
      car.spr.position.y = 2.2 + Math.sin(t * 9 + i) * 0.02;
      // tyre smoke while drifting
      car.smokeT -= dt;
      if (Math.abs(sl || 0) > 0.12 && Math.abs(v || 0) > 12 && car.smokeT <= 0 && F.smoke.length < 120) {
        car.smokeT = 0.035;
        [-1, 1].forEach(sd => { const sp = new T.Sprite(F.smokeM.clone()); const ca = Math.cos(car.a), sa = Math.sin(car.a); sp.position.set(car.x - sa * 1.4 + ca * sd * 0.95, 0.4, car.z - ca * 1.4 - sa * sd * 0.95); sp.scale.set(1, 1, 1); F.scene.add(sp); F.smoke.push({ m: sp, life: 0.9 }); });
      }
    });
    // camera
    const c = me >= 0 && F.me ? F.me : null;
    let tx, tz, ta, tv;
    if (c) { tx = c.x; tz = c.z; ta = c.a + (c.slip || 0) * 0.4; tv = c.v; }
    else { const ranked = this.places(V).map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]); const lead = ranked.length ? ranked[0][1] : 0; const r = F.cars[lead]; tx = r.x; tz = r.z; ta = r.a; tv = 30; }
    const dist = [7.5, 12, 0][F.cam], hgt = [3.2, 5.2, 1.55][F.cam];
    F.camA = F.camA == null ? ta : F.camA + (((ta - F.camA + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 6);
    const ca = F.cam === 2 ? ta : F.camA;
    F.shake = Math.max(0, (F.shake || 0) - dt);
    const sh = F.shake * 0.5;
    const camX = tx - Math.sin(ca) * dist + (F.cam === 2 ? Math.sin(ca) * 0.6 : 0), camZ = tz - Math.cos(ca) * dist + (F.cam === 2 ? Math.cos(ca) * 0.6 : 0);
    F.cam3.position.set(camX + (Math.random() - 0.5) * sh, hgt + (Math.random() - 0.5) * sh, camZ + (Math.random() - 0.5) * sh);
    F.cam3.lookAt(tx + Math.sin(ca) * 8, F.cam === 2 ? 1.3 : 1.2, tz + Math.cos(ca) * 8);
    const fov = 66 + clamp(Math.abs(tv || 0) / RC_BOOST, 0, 1.1) * 16; F.cam3.fov = lerp(F.cam3.fov, fov, 0.08); F.cam3.updateProjectionMatrix();
    if (me >= 0 && F.cars[me]) F.cars[me].spr.visible = F.cam !== 2;
    F.sky.position.set(F.cam3.position.x, 0, F.cam3.position.z);
    F.padTex.offset.y = -t * 1.4;
    F.spire.material.color.setHex(Math.floor(t * 1.5) % 2 ? 0xff4d5e : 0x550010);
    // countdown lights
    const gt = (g.t || 0) / 10; F.lights.forEach((m, k) => m.material.color.setHex(gt >= 0 ? 0x3ddc97 : (gt > -3 + k ? 0xff2a3c : 0x330a0e)));
    for (const o of F.smoke) { o.life -= dt; const k = o.life / 0.9; o.m.scale.setScalar(1 + (1 - k) * 3); o.m.position.y += dt * 0.6; o.m.material.opacity = 0.32 * k; if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
    F.smoke = F.smoke.filter(o => o.life > 0);
    if (F.post) F.post.render(F.scene, F.cam3, t); else F.renderer.render(F.scene, F.cam3);
  },
  hud(ctx, V, dt, t) {
    const F = V.fps, g = V.g || {}, me = V.meIdx, q = me >= 0 && g.pl ? g.pl[me] : null;
    const box = (x, y, w, h, r = 12, a = 0.72) => { ctx.fillStyle = "rgba(9,11,26," + a + ")"; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
    ctx.textBaseline = "middle";
    const gt = (g.t || 0) / 10, pos = this.places(V), n = V.ro.length;
    // speed lines while boosting
    if (F.me && F.me.bo > 0) { ctx.strokeStyle = "rgba(160,230,255,.35)"; ctx.lineWidth = 2; for (let k = 0; k < 26; k++) { const a = Math.random() * Math.PI * 2, r0 = 180 + Math.random() * 120; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0 * 0.65); ctx.lineTo(W / 2 + Math.cos(a) * (r0 + 160), H / 2 + Math.sin(a) * (r0 + 160) * 0.65); ctx.stroke(); } }
    // countdown
    if (gt < 0.9 && V.h.ph === "play") {
      const k = gt < 0 ? Math.ceil(-gt) : 0, s = k > 0 ? String(k) : "GO!";
      if (s !== F.cdShown) { F.cdShown = s; if (k > 0) SFX.play("count"); }
      ctx.textAlign = "center"; ctx.font = "400 120px Bungee, Impact, sans-serif"; ctx.lineWidth = 12; ctx.strokeStyle = "rgba(9,11,26,.85)"; ctx.strokeText(s, W / 2, H * 0.36); ctx.fillStyle = k > 0 ? "#ff4d5e" : "#3ddc97"; ctx.fillText(s, W / 2, H * 0.36);
    }
    if (q) {
      // position
      box(14, 14, 150, 86, 14);
      ctx.textAlign = "left"; ctx.font = "400 54px Bungee, Impact, sans-serif"; ctx.fillStyle = pos[me] === 1 ? "#ffd23f" : "#f5f1e6"; ctx.fillText(String(pos[me] || "-"), 26, 58);
      ctx.font = "400 20px Bungee, Impact, sans-serif"; ctx.fillStyle = "#a6acd0"; const pw = ctx.measureText(String(pos[me] || "-")).width; ctx.fillText(["", "ST", "ND", "RD"][pos[me]] || "TH", 30 + pw * 2.6, 46); ctx.fillText("/" + n, 30 + pw * 2.6, 72);
      // lap + times
      box(W - 214, 14, 200, 70, 14);
      ctx.textAlign = "right"; ctx.font = "400 30px Bungee, Impact, sans-serif"; ctx.fillStyle = "#f5f1e6"; ctx.fillText("LAP " + Math.min(RC_LAPS, q[1] + 1) + "/" + RC_LAPS, W - 28, 40);
      const lapStart = (g.t || 0) / 10 * 1000 - 0; const done = q[2];
      ctx.font = "700 14px 'JetBrains Mono', monospace"; ctx.fillStyle = "#a6acd0";
      const sumPrev = q[1] ? null : 0;
      ctx.fillText("BEST " + (q[4] ? (q[4] / 1000).toFixed(2) : "--.--"), W - 28, 68);
      // lap toasts
      if (q[1] > F.lastLd && !done) { F.toast = { s: q[1] === RC_LAPS - 1 ? "FINAL LAP" : "LAP " + (q[1] + 1), sub: q[6] ? (q[6] / 1000).toFixed(2) + " s" : "", life: 2.2, col: q[1] === RC_LAPS - 1 ? "#ff6b57" : "#ffd23f" }; SFX.play("right"); }
      F.lastLd = q[1];
      if (done && !F.finShown) { F.finShown = true; F.toast = { s: done === 1 ? "WINNER!" : "FINISHED " + done + (["", "ST", "ND", "RD"][done] || "TH"), sub: (q[3] / 1000).toFixed(2) + " s", life: 4, col: done === 1 ? "#ffd23f" : "#3ddc97" }; SFX.play(done === 1 ? "win" : "right"); }
      // wrong way
      if (F.lastDist != null && q[0] < F.lastDist - 1 && !done) F.wrongT = Math.min(2, F.wrongT + dt * 3); else F.wrongT = Math.max(0, F.wrongT - dt);
      F.lastDist = q[0];
      if (F.wrongT > 0.8 && gt > 0) { ctx.textAlign = "center"; ctx.font = "400 40px Bungee, Impact, sans-serif"; ctx.fillStyle = Math.floor(t * 4) % 2 ? "#ff4d5e" : "#ffd23f"; ctx.fillText("WRONG WAY", W / 2, H * 0.3); }
      // speedo
      const c = F.me, mph = Math.round(Math.abs(c ? c.v : 0) * 2.2);
      box(W - 214, H - 108, 200, 94, 14);
      const cx0 = W - 114, cy0 = H - 38, R = 52, k = clamp(Math.abs(c ? c.v : 0) / RC_BOOST, 0, 1);
      ctx.lineWidth = 8; ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.arc(cx0, cy0, R, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.strokeStyle = c && c.bo > 0 ? "#4cc9f0" : k > 0.68 ? "#ff6b57" : "#ffd23f"; ctx.beginPath(); ctx.arc(cx0, cy0, R, Math.PI * 1.05, Math.PI * (1.05 + 0.9 * k)); ctx.stroke();
      ctx.textAlign = "center"; ctx.font = "400 30px Bungee, Impact, sans-serif"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(String(mph), cx0, cy0 - 14); ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#a6acd0"; ctx.fillText("MPH", cx0, cy0 + 8);
      // drift charge
      if (c && c.dc > 0.1) { const ch = Math.min(1, c.dc / 2.2); box(W / 2 - 110, H - 60, 220, 34, 10); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(W / 2 - 96, H - 40, 192, 8); ctx.fillStyle = c.dc > 0.6 ? "#4cc9f0" : "#a6acd0"; ctx.fillRect(W / 2 - 96, H - 40, 192 * ch, 8); ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(c.dc > 0.6 ? "TURBO READY" : "DRIFT", W / 2, H - 51); }
    }
    if (F.toast) { F.toast.life -= dt; const o = F.toast; ctx.globalAlpha = Math.min(1, o.life * 2); ctx.textAlign = "center"; ctx.font = "400 54px Bungee, Impact, sans-serif"; ctx.lineWidth = 10; ctx.strokeStyle = "rgba(9,11,26,.85)"; ctx.strokeText(o.s, W / 2, H * 0.24); ctx.fillStyle = o.col; ctx.fillText(o.s, W / 2, H * 0.24); if (o.sub) { ctx.font = "700 20px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(o.sub, W / 2, H * 0.24 + 46); } ctx.globalAlpha = 1; if (o.life <= 0) F.toast = null; }
    // minimap with standings
    const [mnx, mxx, mnz, mxz] = RC.box, mw = 150, mh = mw * (mxz - mnz) / (mxx - mnx), ox = 14, oy = H - mh - 30;
    box(ox - 6, oy - 8, mw + 12, mh + 16, 10, 0.65);
    const mpx = (x) => ox + (x - mnx) / (mxx - mnx) * mw, mpz = (z) => oy + (z - mnz) / (mxz - mnz) * mh;
    ctx.strokeStyle = "rgba(245,241,230,.55)"; ctx.lineWidth = 4; ctx.beginPath(); RC.pts.forEach((p, i) => i ? ctx.lineTo(mpx(p[0]), mpz(p[1])) : ctx.moveTo(mpx(p[0]), mpz(p[1]))); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "#f5f1e6"; ctx.fillRect(mpx(RC.pts[0][0]) - 3, mpz(RC.pts[0][1]) - 3, 6, 6);
    V.ro.forEach((r, i) => { const p = F.remote[i]; if (!p) return; ctx.fillStyle = r.hex; ctx.beginPath(); ctx.arc(mpx(p.x), mpz(p.z), i === me ? 5 : 3.5, 0, 7); ctx.fill(); if (i === me) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); } });
    if (F.stick) { const s = APP.gameScale || 1, rr = $("#gameCanvas").getBoundingClientRect(); const bx = (F.stick.bx - rr.left) / s, by = H - 150; ctx.strokeStyle = "rgba(245,241,230,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx - 70 / s, by); ctx.lineTo(bx + 70 / s, by); ctx.stroke(); ctx.fillStyle = "rgba(245,241,230,.45)"; ctx.beginPath(); ctx.arc((F.stick.x - rr.left) / s, by, 20 / s, 0, 7); ctx.fill(); }
  },
};
GAMES.race = race;
GAME_ORDER.push("race");
