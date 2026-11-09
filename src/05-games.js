// ---------- games ----------
// World is 960 x 600 logical px. The host simulates; everyone renders.
const W = 960, H = 600;
const BOT_NAMES = [
  { n: "Sr. Tech Bot", boss: true, c: [2, 3, 4, 2, 1] },
  { n: "Firewall Bot", boss: true, c: [0, 4, 4, 5, 3] },
  { n: "Patch Bot", c: [1, 6, 2, 1, 0] },
  { n: "Ping Bot", c: [4, 8, 5, 6, 0] },
  { n: "Tier-1 Bot", c: [3, 7, 0, 3, 2] },
  { n: "Cache Bot", c: [0, 9, 1, 8, 6] },
];
function spawnPoint(i, n) {
  const a = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;
  return [W / 2 + Math.cos(a) * 340, H / 2 + Math.sin(a) * 200];
}
function smoothTo(V, key, x, y, k = 0.35) {
  const m = V.sm[key] || (V.sm[key] = { x, y, px: x, py: y, vx: 0 });
  m.px = m.x; m.py = m.y;
  m.x = lerp(m.x, x, k); m.y = lerp(m.y, y, k);
  m.vx = m.x - m.px;
  return m;
}
function nameTag(ctx, text, x, y, me, color) {
  ctx.font = "700 12px Inter, system-ui, sans-serif";
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = me ? "#f5f1e6" : "rgba(11,14,32,.78)";
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 9, w, 18, 9); ctx.fill();
  if (color) { ctx.fillStyle = color; ctx.fillRect(x - w / 2 + 6, y + 6, w - 12, 2); }
  ctx.fillStyle = me ? "#111316" : "#f5f1e6";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 0.5);
}
const FX = {
  parts: [],
  burst(x, y, color, n = 14, speed = 160, life = 0.6, size = 4) {
    if (reducedMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color, size: size * (0.6 + Math.random() * 0.8) });
    }
  },
  ring(x, y, color, r = 90, life = 0.5) { this.parts.push({ ring: true, x, y, r, life, max: life, color }); },
  text(x, y, txt, color, life = 1) { this.parts.push({ txt, x, y, vy: -40, vx: 0, life, max: life, color }); },
  draw(ctx, dt) {
    for (const p of this.parts) {
      p.life -= dt;
      const k = Math.max(0, p.life / p.max);
      ctx.globalAlpha = k;
      if (p.ring) {
        ctx.strokeStyle = p.color; ctx.lineWidth = 6 * k;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - k) + 10, 0, Math.PI * 2); ctx.stroke();
      } else if (p.txt) {
        p.y += p.vy * dt;
        ctx.font = "700 22px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.lineWidth = 5; ctx.strokeStyle = "#0a0b0d"; ctx.strokeText(p.txt, p.x, p.y);
        ctx.fillStyle = p.color; ctx.fillText(p.txt, p.x, p.y);
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
        ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
    this.parts = this.parts.filter(p => p.life > 0);
  },
  clear() { this.parts = []; },
};

// ======================= COVERAGE RUSH =======================
const COLS = 24, ROWS = 15, CELL = 40;
const FW_CELLS = new Set([[5, 4], [5, 5], [5, 6], [5, 7], [18, 7], [18, 8], [18, 9], [18, 10], [10, 3], [11, 3], [12, 3], [13, 3], [10, 11], [11, 11], [12, 11], [13, 11], [14, 6], [14, 7], [9, 7], [9, 8]].map(([x, y]) => y * COLS + x));
function covWall(x, y) { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return true; return FW_CELLS.has(cy * COLS + cx); }
function covBlocked(x, y, r = 13) { return covWall(x - r, y - r) || covWall(x + r, y - r) || covWall(x - r, y + r) || covWall(x + r, y + r); }
function covSpawn(i, n) { let [x, y] = spawnPoint(i, n); for (let k = 0; k < 20 && covBlocked(x, y, 16); k++) { x += (W / 2 - x) * 0.08; y += (H / 2 - y) * 0.08 + (k % 2 ? 10 : -10); } return [x, y]; }
const COV_PK = { ap: { n: "AP DEPLOYED", c: "#ffd23f" }, boost: { n: "FIBER BOOST", c: "#4cc9f0" }, lock: { n: "LOCKDOWN", c: "#ff7ac6" } };
const coverage = {
  id: "coverage", title: "Coverage Rush", tag: "Claim the client's floor",
  blurb: "A new client's office needs coverage. Run the floor and claim tiles with your network. Most tiles in 60 seconds wins.",
  how: ["Walk over tiles to claim them · steal rivals' tiles", "Firewalls block the way, so route around them", "Access Point = coverage blast · Fiber Boost = speed · Lockdown = your tiles can't be stolen for 6 s"],
  keys: ["WASD / arrows", "Touch: drag anywhere"],
  rec: { label: "Most tiles", better: "max", fmt: v => v + " tiles" },
  hostStart(S) {
    const n = S.ro.length;
    S.g = { t: 0, dur: 60, grid: new Array(COLS * ROWS).fill(-1), pos: S.ro.map((r, i) => covSpawn(i, n)), bot: {}, pk: null, pkT: 3, bm: null, bmSeq: 0, boost: S.ro.map(() => 0), lock: S.ro.map(() => 0) };
    S.ro.forEach((r, i) => { if (r.b) S.g.bot[i] = { tx: 0, ty: 0, t: 0, sp: r.boss ? 215 : 185 }; });
  },
  hostTick(S, dt, inputs) {
    const g = S.g; g.t += dt;
    S.ro.forEach((r, i) => {
      let p = g.pos[i];
      if (r.b) {
        const b = g.bot[i];
        b.t -= dt;
        const dx = b.tx - p[0], dy = b.ty - p[1], d = Math.hypot(dx, dy);
        if (b.t <= 0 || d < 12 || b.stuck > 0.4) {
          b.stuck = 0;
          let best = null, bs = -1e9;
          if (g.pk && Math.hypot(g.pk[0] - p[0], g.pk[1] - p[1]) < 320 && Math.random() < 0.6) best = g.pk;
          else for (let k = 0; k < 16; k++) {
            const cx = rint(0, COLS - 1), cy = rint(0, ROWS - 1), o = g.grid[cy * COLS + cx];
            if (FW_CELLS.has(cy * COLS + cx)) continue;
            const x = cx * CELL + CELL / 2, y = cy * CELL + CELL / 2;
            const sc = (o === i ? -2 : o === -1 ? 1.2 : 2) - Math.hypot(x - p[0], y - p[1]) / 260 + Math.random() * 0.6;
            if (sc > bs) { bs = sc; best = [x, y]; }
          }
          b.tx = best[0]; b.ty = best[1]; b.t = 0.8 + Math.random() * 1.2;
        } else {
          const s = Math.min(d, b.sp * (g.boost[i] > 0 ? 1.45 : 1) * dt);
          const nx = p[0] + dx / d * s, ny = p[1] + dy / d * s;
          let moved = false;
          if (!covBlocked(nx, p[1])) { p[0] = nx; moved = true; }
          if (!covBlocked(p[0], ny)) { p[1] = ny; moved = true; }
          if (!moved || (Math.abs(dx) > 2 && covBlocked(nx, p[1]))) b.stuck = (b.stuck || 0) + dt;
        }
      } else {
        const inp = inputs[i];
        if (inp && Number.isFinite(inp.x) && Number.isFinite(inp.y)) { p[0] = clamp(inp.x, 14, W - 14); p[1] = clamp(inp.y, 14, H - 14); }
      }
      const cx = clamp(Math.floor(p[0] / CELL), 0, COLS - 1), cy = clamp(Math.floor(p[1] / CELL), 0, ROWS - 1);
      const claim = (k) => { if (FW_CELLS.has(k)) return; const o = g.grid[k]; if (o >= 0 && o !== i && g.lock[o] > 0) return; g.grid[k] = i; };
      claim(cy * COLS + cx);
      if (g.pk && Math.hypot(g.pk[0] - p[0], g.pk[1] - p[1]) < 34) {
        const type = g.pk[2];
        if (type === "ap") {
          const pcx = Math.floor(g.pk[0] / CELL), pcy = Math.floor(g.pk[1] / CELL);
          for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
            if (x * x + y * y > 6.5) continue;
            const X = pcx + x, Y = pcy + y;
            if (X >= 0 && Y >= 0 && X < COLS && Y < ROWS) claim(Y * COLS + X);
          }
        } else if (type === "boost") g.boost[i] = 5;
        else g.lock[i] = 6;
        g.bm = [i, g.pk[0], g.pk[1], ++g.bmSeq, type]; g.pk = null; g.pkT = 3 + Math.random() * 3;
      }
    });
    g.boost = g.boost.map(v => Math.max(0, v - dt)); g.lock = g.lock.map(v => Math.max(0, v - dt));
    if (!g.pk) { g.pkT -= dt; if (g.pkT <= 0) { let cx, cy; do { cx = rint(2, COLS - 3); cy = rint(2, ROWS - 3); } while (FW_CELLS.has(cy * COLS + cx)); g.pk = [cx * CELL + CELL / 2, cy * CELL + CELL / 2, ["ap", "ap", "boost", "lock"][rint(0, 3)]]; } }
  },
  pack(S) {
    const g = S.g;
    return {
      gr: g.grid.map(v => v < 0 ? "." : String.fromCharCode(97 + v)).join(""),
      bp: S.ro.map((r, i) => r.b ? [Math.round(g.pos[i][0]), Math.round(g.pos[i][1])] : 0),
      pk: g.pk, bm: g.bm, fx: S.ro.map((r, i) => (g.boost[i] > 0 ? 1 : 0) + (g.lock[i] > 0 ? 2 : 0)),
    };
  },
  timeLeft(S) { return (S.g.dur - S.g.t) * 1000; },
  done(S) { return S.g.t >= S.g.dur; },
  counts(gr, n) { const c = new Array(n).fill(0); for (let k = 0; k < gr.length; k++) { const v = gr.charCodeAt(k) - 97; if (v >= 0 && v < n) c[v]++; } return c; },
  rank(S) {
    const c = this.counts(this.pack(S).gr, S.ro.length);
    return S.ro.map((r, i) => ({ i, v: c[i], label: c[i] + (c[i] === 1 ? " tile" : " tiles"), rec: c[i] })).sort((a, b) => b.v - a.v);
  },
  chip(V, i) { return V.g ? this.counts(V.g.gr || "", V.ro.length)[i] : 0; },
  clientEnter(V) { const sp = covSpawn(V.meIdx, V.ro.length); V.local = { x: sp[0], y: sp[1] }; V.prevGr = ""; V.pop = {}; V.lastBm = 0; },
  clientInput(V, dt, inp) {
    if (V.meIdx < 0 || V.h.ph !== "play") return null;
    const L = V.local, fx = V.g && V.g.fx ? V.g.fx[V.meIdx] : 0, sp = fx & 1 ? 340 : 235;
    const nx = clamp(L.x + inp.dx * sp * dt, 14, W - 14), ny = clamp(L.y + inp.dy * sp * dt, 14, H - 14);
    if (!covBlocked(nx, L.y)) L.x = nx;
    if (!covBlocked(L.x, ny)) L.y = ny;
    return { x: Math.round(L.x), y: Math.round(L.y) };
  },
  draw(ctx, V, dt, t) {
    const g = V.g || {};
    const gr = g.gr || "";
    // floor
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#1c2246" : "#191e3f";
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
    // office plan details (non-blocking): room outlines + labels
    ctx.strokeStyle = "rgba(157,161,169,.18)"; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    [[0, 0, 7, 6, "MIKE'S OFFICE"], [17, 0, 7, 6, "SERVER CLOSET"], [0, 9, 7, 6, "RECEPTION"], [17, 9, 7, 6, "PAVLOS'S OFFICE"], [9, 5, 6, 5, "OPEN DESKS"]].forEach(([x, y, w, h, l]) => {
      ctx.strokeRect(x * CELL + 3, y * CELL + 3, w * CELL - 6, h * CELL - 6);
      ctx.fillStyle = "rgba(157,161,169,.22)"; ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(l, x * CELL + 10, y * CELL + 9);
    });
    ctx.setLineDash([]);
    // claimed tiles
    if (gr !== V.prevGr) {
      for (let k = 0; k < gr.length; k++) if (gr[k] !== V.prevGr[k] && gr[k] !== ".") V.pop[k] = t;
      V.prevGr = gr;
    }
    for (let k = 0; k < gr.length; k++) {
      const v = gr.charCodeAt(k) - 97; if (v < 0) continue;
      const r = V.ro[v]; if (!r) continue;
      const x = (k % COLS) * CELL, y = Math.floor(k / COLS) * CELL;
      const age = V.pop[k] != null ? t - V.pop[k] : 9;
      const s = age < 0.25 ? 0.6 + (age / 0.25) * 0.4 : 1;
      const pad = 2 + (1 - s) * 16;
      ctx.fillStyle = r.hex;
      ctx.globalAlpha = 0.78;
      ctx.beginPath(); ctx.roundRect(x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, 7); ctx.fill();
      ctx.globalAlpha = 0.35; ctx.strokeStyle = "#0a0b0d"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2 + 6, 9, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 2 + 6, 4, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // lockdown shimmer on locked players' tiles
    if (g.fx) {
      ctx.strokeStyle = "rgba(255,122,198," + (0.5 + Math.sin(t * 8) * 0.3) + ")"; ctx.lineWidth = 2;
      for (let k = 0; k < gr.length; k++) { const v = gr.charCodeAt(k) - 97; if (v < 0 || !(g.fx[v] & 2)) continue; ctx.strokeRect((k % COLS) * CELL + 4, Math.floor(k / COLS) * CELL + 4, CELL - 8, CELL - 8); }
    }
    // firewalls
    FW_CELLS.forEach(k => {
      const x = (k % COLS) * CELL, y = Math.floor(k / COLS) * CELL;
      ctx.fillStyle = "#3a1d2e"; ctx.fillRect(x, y, CELL, CELL);
      ctx.fillStyle = "#5b2a3f";
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, CELL, CELL); ctx.clip();
      for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) ctx.fillRect(x + 2 + c * 19 + (r % 2 ? 9 : 0), y + 2 + r * 9.5, 16, 7);
      ctx.restore();
      const glow = 0.35 + Math.sin(t * 5 + k) * 0.2;
      ctx.fillStyle = "rgba(255,107,87," + glow + ")"; ctx.fillRect(x, y + CELL - 4, CELL, 4);
    });
    ctx.font = "700 9px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(255,159,28,.8)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    [[5, 4], [18, 7], [10, 3], [10, 11]].forEach(([x, y]) => ctx.fillText("FW", x * CELL + CELL / 2, y * CELL + CELL / 2));
    // pickup
    if (g.pk) {
      const [px, py, type] = g.pk, pulse = (t * 1.4) % 1, info = COV_PK[type] || COV_PK.ap;
      ctx.strokeStyle = info.c; ctx.globalAlpha = 1 - pulse; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py, 14 + pulse * 30, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.5;
      if (type === "boost") {
        ctx.fillStyle = "#4cc9f0"; ctx.beginPath(); ctx.moveTo(px + 4, py - 16); ctx.lineTo(px - 10, py + 2); ctx.lineTo(px, py + 2); ctx.lineTo(px - 4, py + 16); ctx.lineTo(px + 10, py - 2); ctx.lineTo(px, py - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (type === "lock") {
        ctx.fillStyle = "#ff7ac6"; ctx.beginPath(); ctx.roundRect(px - 11, py - 4, 22, 17, 4); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(px, py - 4, 7, Math.PI, 0); ctx.stroke();
      } else {
        ctx.fillStyle = "#f5f1e6";
        ctx.beginPath(); ctx.roundRect(px - 16, py - 6, 32, 14, 5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px - 9, py - 6); ctx.lineTo(px - 13, py - 20); ctx.moveTo(px + 9, py - 6); ctx.lineTo(px + 13, py - 20); ctx.stroke();
        ctx.fillStyle = "#3ddc97"; ctx.beginPath(); ctx.arc(px + 9, py + 1, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (g.bm && g.bm[3] !== V.lastBm) {
      V.lastBm = g.bm[3];
      const r = V.ro[g.bm[0]], info = COV_PK[g.bm[4] || "ap"];
      if (r) {
        if ((g.bm[4] || "ap") === "ap") { FX.ring(g.bm[1], g.bm[2], r.hex, 150, 0.7); FX.burst(g.bm[1], g.bm[2], r.hex, 30, 260, 0.8, 6); SFX.play("boom"); }
        else { FX.ring(g.bm[1], g.bm[2], info.c, 60, 0.5); SFX.play("pop"); }
        FX.text(g.bm[1], g.bm[2] - 30, info.n, info.c, 1.1);
      }
    }
    // players
    const list = V.ro.map((r, i) => {
      let x, y;
      if (i === V.meIdx && V.h.ph === "play") { x = V.local.x; y = V.local.y; }
      else if (r.b) { const p = g.bp && g.bp[i]; if (!p) { [x, y] = covSpawn(i, V.ro.length); } else { x = p[0]; y = p[1]; } }
      else { const inp = V.inputOf(i); if (inp && Number.isFinite(inp.x)) { x = inp.x; y = inp.y; } else[x, y] = covSpawn(i, V.ro.length); }
      const m = i === V.meIdx ? (V.sm[i] = { x, y, px: (V.sm[i] || { x }).x, vx: x - (V.sm[i] || { x }).x }) : smoothTo(V, i, x, y, 0.3);
      return { i, r, m };
    }).sort((a, b) => a.m.y - b.m.y);
    for (const { i, r, m } of list) {
      const moving = Math.abs(m.vx) + Math.abs(m.y - (m.py ?? m.y)) > 0.3;
      const fx = g.fx ? g.fx[i] : 0;
      if (fx & 1) { FX.parts.length < 400 && moving && FX.burst(m.x, m.y + 8, "#4cc9f0", 1, 40, 0.35, 5); }
      if (fx & 2) { ctx.strokeStyle = "#ff7ac6"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(m.x, m.y - 6, 26 + Math.sin(t * 8) * 2, 0, Math.PI * 2); ctx.stroke(); }
      drawChar(ctx, r.c, m.x, m.y - 6, 38, { t, look: clamp(m.vx * 0.3, -1, 1), squash: moving ? Math.sin(t * 18 + i) * 0.35 : 0, phase: i, color: r.hex });
      nameTag(ctx, r.n, m.x, m.y - 40, i === V.meIdx, r.hex);
    }
  },
};

// ======================= UPTIME SUMO =======================
const sumo = {
  id: "sumo", title: "Uptime Sumo", tag: "Last tech online wins",
  blurb: "An outage is eating the server-room floor. Bump rival techs off the edge and stay online. You have 3 lives.",
  how: ["Dash into rivals to knock them off the floor", "The floor shrinks, and flashing tiles drop out as holes", "Shield = can't be pushed · Heavy = hit like a server rack"],
  keys: ["WASD / arrows", "Space = dash", "Touch: drag + DASH"],
  rec: { label: "Most knockouts", better: "max", fmt: v => v + " KOs" },
  R: 22,
  tileOf(x, y) { return [Math.floor((x - (W / 2 - 300)) / 50), Math.floor((y - (H / 2 - 300)) / 50)]; },
  radius(t) { return t < 8 ? 265 : Math.max(125, 265 - (t - 8) * (140 / 45)); },
  hostStart(S) {
    const n = S.ro.length;
    S.g = { t: 0, dur: 80, endT: 0, p: S.ro.map((r, i) => { const a = -Math.PI / 2 + i / n * Math.PI * 2; return { x: W / 2 + Math.cos(a) * 150, y: H / 2 + Math.sin(a) * 150, vx: 0, vy: 0, st: 0, lives: 3, kos: 0, cd: 0, inv: 1, fallT: 0, hit: -1, hitT: -9, d: null, outAt: 0, boss: !!r.boss, shT: 0, hvT: 0 }; }), holes: [], hT: 7, pk: null, pkT: 5, pev: null, pseq: 0 };
  },
  hostTick(S, dt, inputs) {
    const g = S.g; g.t += dt;
    const r = this.radius(g.t), R = this.R, cx = W / 2, cy = H / 2;
    const ps = g.p;
    // failing tiles
    g.hT -= dt;
    if (g.hT <= 0 && g.holes.length < 4) {
      g.hT = 2.6 + Math.random() * 1.6;
      for (let k = 0; k < 10; k++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.8;
        const [tx, ty] = this.tileOf(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
        if (g.holes.some(h => h.tx === tx && h.ty === ty)) continue;
        g.holes.push({ tx, ty, st: 1, t: 1.6 }); break;
      }
    }
    g.holes.forEach(h => { h.t -= dt; if (h.t <= 0) { if (h.st === 1) { h.st = 2; h.t = 6; } else h.st = 3; } });
    g.holes = g.holes.filter(h => h.st !== 3);
    // pickups
    if (!g.pk) { g.pkT -= dt; if (g.pkT <= 0) { const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.55; g.pk = [Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), Math.random() < 0.5 ? "shield" : "heavy"]; } }
    ps.forEach((p, i) => {
      p.shT = Math.max(0, p.shT - dt); p.hvT = Math.max(0, p.hvT - dt);
      if (p.st === 0 && g.pk && Math.hypot(g.pk[0] - p.x, g.pk[1] - p.y) < 32) {
        if (g.pk[2] === "shield") p.shT = 4; else p.hvT = 6;
        g.pev = [i, g.pk[2], ++g.pseq]; g.pk = null; g.pkT = 5 + Math.random() * 3;
      }
      if (p.st === 2) return;
      if (p.st === 1) {
        p.fallT -= dt;
        if (p.fallT <= 0) {
          if (p.lives > 0) { const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.35; p.x = cx + Math.cos(a) * d; p.y = cy + Math.sin(a) * d; p.vx = p.vy = 0; p.st = 0; p.inv = 1.5; }
          else { p.st = 2; p.outAt = g.t; }
        }
        return;
      }
      p.cd -= dt; p.inv -= dt;
      let dx = 0, dy = 0, dash = false;
      if (S.ro[i].b) {
        let best = null, bd = 1e9;
        ps.forEach((q, j) => { if (j !== i && q.st === 0) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } } });
        if (best) { dx = (best.x - p.x) / bd; dy = (best.y - p.y) / bd; if (bd < 140 && p.cd <= 0 && Math.random() < dt * (p.boss ? 3 : 1.8)) dash = true; }
        const dc = Math.hypot(p.x - cx, p.y - cy);
        const edge = dc / r;
        if (edge > 0.6) { const w = (edge - 0.6) * (p.boss ? 5 : 3.5); dx += (cx - p.x) / dc * w; dy += (cy - p.y) / dc * w; }
        for (const h of g.holes) { const hx = W / 2 - 300 + h.tx * 50 + 25, hy = H / 2 - 300 + h.ty * 50 + 25, hd = Math.hypot(p.x - hx, p.y - hy); if (hd < 70 && hd > 0) { dx += (p.x - hx) / hd * 1.6; dy += (p.y - hy) / hd * 1.6; } }
        if (g.pk && Math.hypot(g.pk[0] - p.x, g.pk[1] - p.y) < 160) { const pd = Math.hypot(g.pk[0] - p.x, g.pk[1] - p.y) || 1; dx += (g.pk[0] - p.x) / pd * 0.8; dy += (g.pk[1] - p.y) / pd * 0.8; }
        const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        if (!p.boss) { dx *= 0.85; dy *= 0.85; }
      } else {
        const inp = inputs[i] || {};
        dx = clamp(+inp.dx || 0, -1, 1); dy = clamp(+inp.dy || 0, -1, 1);
        const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
        if (p.d === null) p.d = inp.d || 0;
        if ((inp.d || 0) > p.d) { p.d = inp.d; if (p.cd <= 0) dash = true; }
      }
      const acc = p.hvT > 0 ? 800 : 950;
      p.vx += dx * acc * dt; p.vy += dy * acc * dt;
      if (dash) {
        let ddx = dx, ddy = dy; if (!ddx && !ddy) { const l = Math.hypot(p.vx, p.vy) || 1; ddx = p.vx / l; ddy = p.vy / l; }
        p.vx += ddx * 560; p.vy += ddy * 560; p.cd = 1.2; p.dashT = 0.25;
      }
      p.dashT = (p.dashT || 0) - dt;
      const sp = Math.hypot(p.vx, p.vy), max = p.dashT > 0 ? 820 : 270;
      if (sp > max) { p.vx = p.vx / sp * lerp(sp, max, 0.25); p.vy = p.vy / sp * lerp(sp, max, 0.25); }
      const f = Math.pow(0.12, dt); p.vx *= f; p.vy *= f;
      p.x += p.vx * dt; p.y += p.vy * dt;
    });
    // collisions
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i], b = ps[j];
      if (a.st || b.st || a.inv > 0 || b.inv > 0) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= R * 2 || d === 0) continue;
      const nx = dx / d, ny = dy / d, ov = R * 2 - d;
      a.x -= nx * ov / 2; a.y -= ny * ov / 2; b.x += nx * ov / 2; b.y += ny * ov / 2;
      const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rv > 0) {
        const j2 = rv * 1.25 + 90;
        const ma = a.hvT > 0 ? 2.6 : 1, mb = b.hvT > 0 ? 2.6 : 1;
        const fa = a.shT > 0 ? 0 : 2 * mb / (ma + mb), fb = b.shT > 0 ? 0 : 2 * ma / (ma + mb);
        a.vx -= nx * j2 * fa; a.vy -= ny * j2 * fa; b.vx += nx * j2 * fb; b.vy += ny * j2 * fb;
        a.hit = j; a.hitT = g.t; b.hit = i; b.hitT = g.t;
      }
    }
    // falls
    ps.forEach((p, i) => {
      if (p.st !== 0) return;
      const [tx, ty] = this.tileOf(p.x, p.y);
      const inHole = p.inv <= 0 && g.holes.some(h => h.st === 2 && h.tx === tx && h.ty === ty);
      if (Math.hypot(p.x - cx, p.y - cy) > r + 4 || inHole) {
        p.st = 1; p.fallT = 1.1; p.lives--;
        if (p.hit >= 0 && g.t - p.hitT < 3 && p.hit !== i) ps[p.hit].kos++;
        p.hit = -1;
      }
    });
    const alive = ps.filter(p => p.st !== 2).length;
    if (ps.length > 1 && alive <= 1 && !g.endT) g.endT = g.t + 1.4;
  },
  pack(S) {
    const g = S.g;
    return { r: Math.round(this.radius(g.t)), p: g.p.map(p => [Math.round(p.x), Math.round(p.y), Math.round(p.vx), Math.round(p.vy), p.st, p.lives, p.kos, p.inv > 0 ? 1 : 0, Math.max(0, Math.round(p.fallT * 10)), p.dashT > 0 ? 1 : 0, p.shT > 0 ? 1 : 0, p.hvT > 0 ? 1 : 0]), hl: g.holes.map(h => [h.tx, h.ty, h.st]), pk: g.pk, pev: g.pev };
  },
  timeLeft(S) { return (S.g.dur - S.g.t) * 1000; },
  done(S) { return S.g.t >= S.g.dur || (S.g.endT && S.g.t >= S.g.endT); },
  rank(S) {
    return S.g.p.map((p, i) => ({ i, p })).sort((a, b) => ((b.p.st !== 2) - (a.p.st !== 2)) || (b.p.lives - a.p.lives) || (b.p.outAt - a.p.outAt) || (b.p.kos - a.p.kos))
      .map(({ i, p }) => ({ i, v: p.lives * 100 + p.kos, label: p.kos + " KO" + (p.kos === 1 ? "" : "s") + " · " + (p.st === 2 ? "offline" : p.lives + " " + (p.lives === 1 ? "life" : "lives") + " left"), rec: p.kos }));
  },
  chip(V, i) { const p = V.g && V.g.p && V.g.p[i]; return p ? "●".repeat(Math.max(0, p[5])) + "○".repeat(Math.max(0, 3 - p[5])) : "●●●"; },
  clientEnter(V) { V.dashN = 0; V.lastBump = 0; V.prevSt = {}; V.pevSeen = 0; },
  clientInput(V, dt, inp) {
    if (V.meIdx < 0) return null;
    if (inp.dash) { V.dashN++; inp.dash = false; SFX.play("dash"); }
    return { dx: Math.round(inp.dx * 100) / 100, dy: Math.round(inp.dy * 100) / 100, d: V.dashN };
  },
  draw(ctx, V, dt, t) {
    const g = V.g || {};
    const r = g.r || 265, cx = W / 2, cy = H / 2;
    // under-floor void: cable trays
    ctx.fillStyle = "#08090b"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(76,201,240,.07)"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // outage zone ring
    ctx.save();
    const og = ctx.createRadialGradient(cx, cy, r, cx, cy, 300);
    og.addColorStop(0, "rgba(255,107,87,.35)"); og.addColorStop(1, "rgba(255,107,87,0)");
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy, 300, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // raised floor disc
    ctx.save();
    ctx.fillStyle = "#06081a"; ctx.beginPath(); ctx.ellipse(cx, cy + 14, r, r * 0.98, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    const fg = ctx.createRadialGradient(cx - 60, cy - 80, 20, cx, cy, r);
    fg.addColorStop(0, "#3a4486"); fg.addColorStop(1, "#232a58");
    ctx.fillStyle = fg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.strokeStyle = "rgba(245,241,230,.08)"; ctx.lineWidth = 2;
    for (let x = cx - 300; x < cx + 300; x += 50) { ctx.beginPath(); ctx.moveTo(x, cy - r); ctx.lineTo(x, cy + r); ctx.stroke(); }
    for (let y = cy - 300; y < cy + 300; y += 50) { ctx.beginPath(); ctx.moveTo(cx - r, y); ctx.lineTo(cx + r, y); ctx.stroke(); }
    ctx.fillStyle = "rgba(76,201,240,.12)";
    for (let x = cx - 275; x < cx + 300; x += 100) for (let y = cy - 275; y < cy + 300; y += 100) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = "700 30px 'Chakra Petch', sans-serif"; ctx.fillStyle = "rgba(245,241,230,.07)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("NETEAM DC-1", cx, cy);
    (g.hl || []).forEach(([tx, ty, st]) => {
      const x = cx - 300 + tx * 50, y = cy - 300 + ty * 50;
      if (st === 1) { ctx.fillStyle = "rgba(255,107,87," + (0.25 + 0.35 * (Math.sin(t * 18) * 0.5 + 0.5)) + ")"; ctx.fillRect(x + 1, y + 1, 48, 48); ctx.strokeStyle = "#ff6b57"; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, 44, 44); }
      else {
        ctx.fillStyle = "#03040c"; ctx.fillRect(x, y, 50, 50);
        const gr2 = ctx.createLinearGradient(x, y, x, y + 50); gr2.addColorStop(0, "rgba(76,201,240,.25)"); gr2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gr2; ctx.fillRect(x, y, 50, 10);
        ctx.strokeStyle = "rgba(255,159,28,.6)"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, 48, 48);
      }
    });
    ctx.restore();
    if (g.pk) {
      const [px, py, type] = g.pk, bob = Math.sin(t * 4) * 3;
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.5;
      if (type === "shield") { ctx.fillStyle = "rgba(76,201,240,.35)"; ctx.beginPath(); ctx.arc(px, py + bob, 16, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#4cc9f0"; ctx.stroke(); ctx.fillStyle = "#4cc9f0"; ctx.font = "700 14px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("S", px, py + bob + 1); }
      else { ctx.fillStyle = "#9b7bff"; ctx.beginPath(); ctx.moveTo(px - 16, py + 12 + bob); ctx.lineTo(px - 10, py - 10 + bob); ctx.lineTo(px + 10, py - 10 + bob); ctx.lineTo(px + 16, py + 12 + bob); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("4U", px, py + 3 + bob); }
    }
    if (g.pev && g.pev[2] !== V.pevSeen) {
      V.pevSeen = g.pev[2]; const q = (g.p || [])[g.pev[0]];
      if (q) { FX.text(q[0], q[1] - 50, g.pev[1] === "shield" ? "SHIELD UP" : "HEAVY RACK", g.pev[1] === "shield" ? "#4cc9f0" : "#9b7bff", 1); SFX.play("pop"); }
    }
    const pulse = 0.5 + Math.sin(t * 6) * 0.5;
    ctx.strokeStyle = r < 260 ? "rgba(255,107,87," + (0.55 + pulse * 0.45) + ")" : "rgba(255,210,63,.7)";
    ctx.lineWidth = 6; ctx.setLineDash([16, 10]); ctx.lineDashOffset = -t * 40;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    if (r < 260) { ctx.font = "700 12px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(255,107,87,.9)"; ctx.textAlign = "center"; ctx.fillText("OUTAGE SPREADING", cx, cy - r - 16); }
    // players
    const P = g.p || [];
    const list = V.ro.map((ro, i) => {
      const p = P[i]; if (!p) { const a = -Math.PI / 2 + i / V.ro.length * Math.PI * 2; return { i, ro, m: smoothTo(V, i, cx + Math.cos(a) * 150, cy + Math.sin(a) * 150), p: [0, 0, 0, 0, 0, 3, 0, 0, 0, 0] }; }
      const ex = p[0] + p[2] * Math.min(0.12, V.age / 1000), ey = p[1] + p[3] * Math.min(0.12, V.age / 1000);
      const m = (V.sm[i] && Math.hypot(V.sm[i].x - ex, V.sm[i].y - ey) > 120) ? (V.sm[i] = { x: ex, y: ey, px: ex, py: ey, vx: 0 }) : smoothTo(V, i, ex, ey, 0.45);
      return { i, ro, m, p };
    });
    // sparks on contact
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const A = list[a], B = list[b];
      if (A.p[4] || B.p[4]) continue;
      if (Math.hypot(A.m.x - B.m.x, A.m.y - B.m.y) < this.R * 2 + 3 && t - V.lastBump > 0.15) {
        V.lastBump = t; FX.burst((A.m.x + B.m.x) / 2, (A.m.y + B.m.y) / 2, "#ffd23f", 10, 220, 0.35, 4); SFX.play("bump");
      }
    }
    list.sort((a, b) => a.m.y - b.m.y);
    for (const { i, ro, m, p } of list) {
      const st = p[4];
      if (V.prevSt[i] === 0 && st === 1) { SFX.play("fall"); FX.text(m.x, m.y - 30, "OFFLINE", "#ff6b57", 1); }
      V.prevSt[i] = st;
      if (st === 2) continue;
      let scale = 1, alpha = 1;
      if (st === 1) { const k = p[8] / 11; scale = 0.25 + 0.75 * k; alpha = k; }
      if (p[7] && Math.floor(t * 10) % 2) alpha *= 0.45;
      if (p[9]) { ctx.fillStyle = "rgba(255,210,63,.25)"; ctx.beginPath(); ctx.arc(m.x - p[2] * 0.03, m.y - p[3] * 0.03, 26, 0, Math.PI * 2); ctx.fill(); }
      if (p[10] && st === 0) { ctx.fillStyle = "rgba(76,201,240,.18)"; ctx.strokeStyle = "rgba(76,201,240," + (0.6 + Math.sin(t * 10) * 0.3) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(m.x, m.y - 4, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      if (p[11]) scale *= 1.3;
      drawChar(ctx, ro.c, m.x, m.y - 4, 46 * scale, { t, alpha, look: clamp(p[2] / 200, -1, 1), squash: clamp(Math.hypot(p[2], p[3]) / 600, 0, 0.6), mood: st === 1 ? "shock" : p[9] ? "happy" : "", phase: i, color: ro.hex });
      if (st === 0) {
        nameTag(ctx, ro.n, m.x, m.y - 44, i === V.meIdx, ro.hex);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = k < p[5] ? "#3ddc97" : "rgba(245,241,230,.2)"; ctx.beginPath(); ctx.arc(m.x - 10 + k * 10, m.y + 30, 3.5, 0, Math.PI * 2); ctx.fill(); }
      }
    }
  },
};

// ======================= ALERT RESPONSE =======================
const SOC_ACTS = ["ISOLATE HOST", "BLOCK IP", "RESET PASSWORD", "KILL PROCESS"];
const ALERTS = [["Brute-force on the VPN", 1], ["Phishing link clicked", 2], ["Ransomware beacon", 0], ["Impossible-travel login", 2], ["MFA fatigue spam", 2], ["Port scan on edge firewall", 1], ["Unknown USB device", 0], ["Admin login at 3 a.m.", 2], ["Mass file rename on NAS", 0], ["DNS tunneling spotted", 1], ["Suspicious PowerShell", 3], ["Crypto-miner on FS01", 3], ["Unsigned process injecting", 3], ["C2 traffic to new domain", 1]];
const LOW_ALERTS = ["Printer toner low", "Disk 81% on FS01", "Update pending reboot", "Cert expires in 30 days", "Guest Wi-Fi spike", "Backup ran long", "UPS self-test passed"];
const alert = {
  id: "alert", title: "Alert Response", tag: "Fastest containment wins",
  blurb: "You're on SOC duty. When a critical SIEM alert fires, pick the right containment fast. Yellow low-severity noise is bait, and the wrong fix costs you.",
  how: ["Ignore yellow low-severity alerts, they're decoys", "On a red critical alert, pick the right fix: isolate, block, reset or kill", "6 rounds · 1st 5 pts, 2nd 3, 3rd 2 · early or wrong fix −2"],
  keys: ["1 2 3 4 = fix", "Click or tap the fix buttons"],
  rec: { label: "Fastest response", better: "min", fmt: v => v + " ms" },
  ROUNDS: 6,
  hostStart(S) {
    const n = S.ro.length;
    S.g = { r: 1, rp: "ready", pt: 2, d: 0, al: 0, aT: 0, rt: new Array(n).fill(null), pts: new Array(n).fill(0), rpts: new Array(n).fill(0), best: new Array(n).fill(null), bot: {} };
  },
  hostTick(S, dt, inputs) {
    const g = S.g; g.pt -= dt;
    if (g.rp === "ready" && g.pt <= 0) {
      g.rp = "armed"; g.d = Math.round(2000 + Math.random() * 3000); g.aT = 0; g.al = rint(0, ALERTS.length - 1);
      g.dc = []; const nd = rint(0, 2); for (let k = 0; k < nd; k++) g.dc.push([Math.round(400 + Math.random() * (g.d - 1300)), rint(0, LOW_ALERTS.length - 1)]);
      g.rt = g.rt.map(() => null); g.rpts = g.rpts.map(() => 0);
      S.ro.forEach((r, i) => { if (r.b) { const fs = Math.random() < 0.04, wr = Math.random() < 0.08; g.bot[i] = fs ? { fs: Math.random() * g.d } : { t: (r.boss ? 195 + Math.random() * 130 : 230 + Math.random() * 230) + 150 + Math.random() * 120, wr }; } });
    } else if (g.rp === "armed") {
      g.aT += dt * 1000;
      S.ro.forEach((r, i) => {
        if (g.rt[i] != null) return;
        if (r.b) { const b = g.bot[i]; if (b.fs != null && g.aT >= b.fs) g.rt[i] = -1; else if (b.t != null && g.aT >= g.d + b.t) g.rt[i] = b.wr ? -2 : Math.round(b.t); }
        else { const rx = inputs[i] && inputs[i].rx; if (rx && rx.r === g.r) g.rt[i] = rx.f ? -1 : rx.a !== ALERTS[g.al][1] ? -2 : clamp(Math.round(+rx.t || 0), 90, 9999); }
      });
      const all = g.rt.every(v => v != null);
      if (g.aT > g.d + 4000 || (all && g.aT > g.d + 250)) {
        const valid = g.rt.map((v, i) => ({ v, i })).filter(o => o.v != null && o.v > 0).sort((a, b) => a.v - b.v);
        const P = [5, 3, 2];
        valid.forEach((o, k) => { g.rpts[o.i] = k < 3 ? P[k] : 1; if (g.best[o.i] == null || o.v < g.best[o.i]) g.best[o.i] = o.v; });
        g.rt.forEach((v, i) => { if (v < 0) g.rpts[i] = -2; });
        g.rpts.forEach((p, i) => g.pts[i] += p);
        g.rp = "reveal"; g.pt = 3;
      }
    } else if (g.rp === "reveal" && g.pt <= 0) {
      if (g.r >= this.ROUNDS) g.fin = true;
      else { g.r++; g.rp = "ready"; g.pt = 1.6; }
    }
  },
  pack(S) { const g = S.g; return { r: g.r, rp: g.rp, d: g.d, al: g.al, dc: g.dc || [], ac: g.rp === "reveal" ? ALERTS[g.al][1] : -1, rt: g.rp === "armed" ? g.rt.map(v => v == null ? null : 1) : g.rt, pts: g.pts, rpts: g.rpts, best: g.best }; },
  timeLeft() { return null; },
  done(S) { return !!S.g.fin; },
  rank(S) {
    const g = S.g;
    return S.ro.map((r, i) => ({ i, v: g.pts[i], label: g.pts[i] + " pts" + (g.best[i] ? " · best " + g.best[i] + " ms" : ""), rec: g.best[i] }))
      .sort((a, b) => (b.v - a.v) || ((a.rec || 1e9) - (b.rec || 1e9)));
  },
  chip(V, i) { return V.g && V.g.pts ? V.g.pts[i] : 0; },
  clientEnter(V) { V.lr = { r: 0 }; V.lastRp = ""; },
  tap(V, k) {
    const g = V.g; if (!g || V.meIdx < 0 || V.h.ph !== "play") return;
    const L = V.lr;
    if (g.rp !== "armed" || L.r !== g.r || L.done) return;
    if (L.goAt) {
      if (k == null) return;
      L.done = true; L.pick = k; L.res = Math.round(now() - L.goAt);
      V.sendRx = { r: g.r, t: L.res, a: k }; SFX.play("blip");
    } else { L.done = true; L.res = -1; L.pick = k == null ? -1 : k; V.sendRx = { r: g.r, f: 1 }; SFX.play("early"); }
  },
  clientExit() { const p = $("#socPanel"); if (p) p.hidden = true; },
  clientInput(V) {
    const g = V.g; if (!g) return null;
    const panel = $("#socPanel");
    if (panel) {
      if (!panel.dataset.built) {
        panel.dataset.built = "1";
        SOC_ACTS.forEach((a, k) => { const b = document.createElement("button"); b.type = "button"; const sm = document.createElement("small"); sm.textContent = String(k + 1); b.append(sm, document.createTextNode(a)); b.addEventListener("click", () => alert.tap(APP.V, k)); panel.append(b); });
      }
      panel.hidden = !(V.h.ph === "play" && V.meIdx >= 0);
      const Lx = V.lr || {}, bs = panel.querySelectorAll("button");
      const live = g.rp === "armed" && Lx.r === g.r && Lx.goAt && !Lx.done;
      panel.classList.toggle("live", !!live);
      bs.forEach((b, k) => {
        b.classList.toggle("picked", g.rp !== "ready" && Lx.r === g.r && Lx.pick === k);
        b.classList.toggle("right", g.rp === "reveal" && g.ac === k);
      });
    }
    const L = V.lr;
    if (g.rp === "armed" && L.r !== g.r) { V.lr = { r: g.r, start: now(), d: g.d, goAt: 0, done: false, res: null, pick: -1 }; V.sendRx = null; }
    const L2 = V.lr;
    if (g.rp === "armed" && L2.r === g.r && !L2.goAt && now() - L2.start >= L2.d) { L2.goAt = now(); if (!L2.done) SFX.play("go"); }
    return V.sendRx ? { rx: V.sendRx } : {};
  },
  draw(ctx, V, dt, t) {
    const g = V.g || { rp: "ready", r: 1 };
    const L = V.lr || {};
    const armed = g.rp === "armed" && L.r === g.r;
    const go = armed && !!L.goAt;
    // room
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, go ? "#3a0f1a" : "#121733"); bg.addColorStop(1, "#08090b");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // SOC wall: 3 monitors
    const mons = [[90, 40, 200, 120], [310, 30, 340, 210], [670, 40, 200, 120]];
    mons.forEach(([x, y, w, h], k) => {
      ctx.fillStyle = "#05070f"; ctx.strokeStyle = "#2c3036"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.roundRect(x + 6, y + 6, w - 12, h - 12, 6); ctx.clip();
      if (k === 1) {
        if (go) {
          ctx.fillStyle = Math.floor(t * 8) % 2 ? "#ff3b4e" : "#d81f36"; ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.font = "700 44px 'Chakra Petch', sans-serif"; ctx.fillText("CONTAIN!", x + w / 2, y + h / 2 - 18);
          ctx.font = "700 15px 'JetBrains Mono', monospace"; ctx.fillText("⚠ CRITICAL · " + ALERTS[g.al || 0][0], x + w / 2, y + h / 2 + 30);
        } else if (armed && !L.done && (g.dc || []).some(([at]) => { const e = now() - L.start; return e >= at && e < at + 750; })) {
          const dc = g.dc.find(([at]) => { const e = now() - L.start; return e >= at && e < at + 750; });
          ctx.fillStyle = "#3a3208"; ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "#ffd23f"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.font = "700 30px 'Chakra Petch', sans-serif"; ctx.fillText("LOW", x + w / 2, y + h / 2 - 16);
          ctx.font = "700 14px 'JetBrains Mono', monospace"; ctx.fillText("ⓘ " + LOW_ALERTS[dc[1]], x + w / 2, y + h / 2 + 24);
        } else {
          ctx.fillStyle = "#07160f"; ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "#3ddc97"; ctx.lineWidth = 2; ctx.beginPath();
          for (let i = 0; i <= 60; i++) { const xx = x + 10 + i * (w - 20) / 60; const yy = y + h / 2 + 22 + Math.sin(i * 0.7 + t * 4) * 8 + Math.sin(i * 2.3 + t * 7) * 4; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
          ctx.stroke();
          ctx.fillStyle = "#3ddc97"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.font = "700 14px 'JetBrains Mono', monospace";
          const label = g.rp === "reveal" ? "INCIDENT CLOSED" : armed ? (L.done && L.res === -1 ? "FALSE POSITIVE" : "MONITORING… HOLD") : "ROUND " + g.r + " / " + this.ROUNDS + " · STAND BY";
          ctx.fillText("NETEAM SIEM · " + label, x + w / 2, y + 34);
          if (g.rp === "reveal") { ctx.fillStyle = "#f5f1e6"; ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillText(ALERTS[g.al || 0][0], x + w / 2, y + h / 2 - 40); ctx.fillStyle = "#3ddc97"; ctx.font = "700 24px 'Chakra Petch', sans-serif"; ctx.fillText("FIX: " + (SOC_ACTS[g.ac] || ""), x + w / 2, y + h / 2 - 12); }
          if (armed && L.done && L.res === -1) { ctx.fillStyle = "#ff6b57"; ctx.font = "700 26px 'Chakra Petch', sans-serif"; ctx.fillText("TOO EARLY −2", x + w / 2, y + h / 2 - 12); }
        }
      } else {
        ctx.fillStyle = "#0b1022"; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = go ? "rgba(255,59,78,.6)" : "rgba(76,201,240,.35)";
        for (let b = 0; b < 8; b++) { const bh = 10 + Math.abs(Math.sin(b * 1.7 + t * (k + 1))) * (h - 40); ctx.fillRect(x + 14 + b * ((w - 28) / 8), y + h - 10 - bh, (w - 28) / 8 - 5, bh); }
      }
      ctx.restore();
    });
    // founders frame
    ctx.fillStyle = "#2a2140"; ctx.strokeStyle = "#c99a00"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(110, 182, 160, 112, 6); ctx.fill(); ctx.stroke();
    drawChar(ctx, [2, 3, 1, 0, 1], 158, 232, 38, { t, shadow: false, phase: 1 });
    drawChar(ctx, [0, 8, 0, 0, 4], 222, 232, 38, { t, shadow: false, phase: 2 });
    ctx.font = "700 9.5px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd23f";
    ctx.fillText("MIKE & PAVLOS", 190, 270); ctx.fillStyle = "#9da1a9"; ctx.fillText("FOUNDERS · SINCE 2001", 190, 283);
    // desk
    ctx.fillStyle = "#17191c"; ctx.fillRect(0, 430, W, 170);
    ctx.fillStyle = "#1d2024"; ctx.fillRect(0, 430, W, 8);
    // techs in a row
    const n = V.ro.length, two = n > 8, perRow = two ? Math.ceil(n / 2) : n, gap = Math.min(120, (W - 80) / Math.max(1, perRow));
    V.ro.forEach((ro, i) => {
      const row = two && i >= perRow ? 1 : 0, col = row ? i - perRow : i, cnt = row ? n - perRow : perRow;
      const x = W / 2 + (col - (cnt - 1) / 2) * gap + (two && row ? gap / 2 : 0), y = two ? (row ? 466 : 366) : 395;
      const rt = g.rt ? g.rt[i] : null;
      let mood = "", jump = 0;
      if (g.rp === "reveal") { mood = rt < 0 ? "sad" : g.rpts && g.rpts[i] >= 5 ? "happy" : ""; if (g.rpts && g.rpts[i] >= 5) jump = Math.abs(Math.sin(t * 8)) * 18; }
      else if (armed && i === V.meIdx && L.done) { mood = L.res === -1 ? "sad" : "happy"; jump = 8; }
      else if (g.rp === "armed" && rt === 1) jump = 8;
      if (go && !(rt === 1)) mood = mood || "shock";
      drawChar(ctx, ro.c, x, y - jump, two ? 44 : 56, { t, mood, phase: i, color: ro.hex });
      nameTag(ctx, ro.n, x, y + (two ? 38 : 48), i === V.meIdx, ro.hex);
      // results
      if (g.rp === "reveal") {
        const txt = rt == null ? "—" : rt === -1 ? "FALSE +" : rt === -2 ? "WRONG FIX" : rt + " ms";
        ctx.font = "700 14px 'JetBrains Mono', monospace"; ctx.textAlign = "center";
        ctx.fillStyle = rt < 0 ? "#ff6b57" : "#f5f1e6"; ctx.fillText(txt, x, y - (two ? 44 : 58));
        const rp = g.rpts ? g.rpts[i] : 0;
        ctx.fillStyle = rp > 0 ? "#ffd23f" : "#ff6b57"; ctx.font = "700 18px 'Chakra Petch', sans-serif";
        ctx.fillText((rp > 0 ? "+" : "") + rp, x, y - (two ? 64 : 80));
      }
      if (i === V.meIdx && armed && L.done && L.res > 0) {
        ctx.font = "700 15px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#3ddc97";
        ctx.fillText(L.res + " ms", x, y - (two ? 44 : 58));
      }
    });
    // instruction
    ctx.textAlign = "center"; ctx.font = "700 16px Inter, system-ui, sans-serif"; ctx.fillStyle = "rgba(245,241,230,.75)";
    const hint = V.meIdx < 0 ? "" : g.rp === "ready" ? "Get ready…" : armed && !L.goAt && !L.done ? "Hold… yellow LOW alerts are decoys" : go && !L.done ? "Pick the right fix! (1–4)" : "";
    ctx.fillText(hint, W / 2, 285);
  },
};

// ======================= HELPDESK SPRINT =======================
const PORTS = [["HTTPS", 443], ["SSH", 22], ["RDP", 3389], ["DNS", 53], ["SMTP", 25], ["HTTP", 80], ["FTP", 21], ["IMAPS", 993], ["LDAP", 389], ["SMB", 445], ["Telnet", 23], ["SNMP", 161], ["NTP", 123], ["POP3", 110], ["SQL Server", 1433], ["MySQL", 3306], ["Kerberos", 88], ["Syslog", 514], ["Mail submission", 587], ["LDAPS", 636]];
const ACRONYMS = [["MFA", "Multi-Factor Authentication"], ["MDR", "Managed Detection & Response"], ["SIEM", "Security Info & Event Mgmt"], ["VPN", "Virtual Private Network"], ["DHCP", "Dynamic Host Config Protocol"], ["EDR", "Endpoint Detection & Response"], ["SSO", "Single Sign-On"], ["VLAN", "Virtual LAN"], ["NAS", "Network-Attached Storage"], ["UPS", "Uninterruptible Power Supply"], ["SLA", "Service Level Agreement"], ["MSP", "Managed Service Provider"], ["PoE", "Power over Ethernet"], ["SOC", "Security Operations Center"], ["NAT", "Network Address Translation"], ["RAID", "Redundant Array of Indep. Disks"]];
const TICKET_FROM = ["Front desk", "Reception", "Accounting", "the CFO", "a new hire", "the warehouse", "Legal"];
function isP1(i) { return i % 8 >= 5; }
function genTicket(seed, i, tier) {
  const rnd = mulberry32(seed * 7919 + i * 104729 + (tier || 0) * 15485863);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const T = isP1(i) ? 3 : (tier || 0);
  const types = [
    ["port", "port", "subnet", "binary", "acr", "acr", "math", "math", "hex", "mask"],
    ["port", "subnet", "mask", "binary", "acr", "math", "hex", "cidr", "priv"],
    ["port", "subnet", "mask", "hex", "cidr", "bcast", "raid", "priv", "acr"],
    ["cidr", "bcast", "raid", "raid", "priv", "subnet", "mask", "port"],
  ][T];
  const type = types[Math.floor(rnd() * types.length)];
  let kind, q, ans, wrong = [];
  const numDistract = (a, spread) => { const s = new Set([a]); let guard = 0; while (s.size < 4 && guard++ < 50) { const d = a + Math.round((rnd() * 2 - 1) * spread) || a + 1; if (d > 0) s.add(d); } return Array.from(s).slice(1); };
  const uniq = (a, list, gen) => { const s2 = new Set([String(a)]); const out = []; for (const w of list) if (!s2.has(String(w))) { s2.add(String(w)); out.push(w); } let g2 = 0; while (out.length < 3 && g2++ < 60) { const w = gen(); if (!s2.has(String(w))) { s2.add(String(w)); out.push(w); } } return out; };
  if (type === "cidr" || type === "bcast") {
    const n = 25 + Math.floor(rnd() * 5), blk = Math.pow(2, 32 - n), o = Math.floor(rnd() * 256);
    const net = Math.floor(o / blk) * blk, bc = net + blk - 1, base = pick(["10.20.4.", "192.168.10.", "172.16.8.", "10.1.50."]);
    kind = "Subnetting"; q = (type === "cidr" ? "Network address of " : "Broadcast of ") + base + o + "/" + n + "?";
    ans = base + (type === "cidr" ? net : bc);
    const cands = type === "cidr" ? [net + blk, net - blk, o, bc] : [net, bc + 1, bc - 1, net + blk * 2 - 1];
    wrong = uniq(ans, cands.filter(v => v >= 0 && v <= 255).map(v => base + v), () => base + Math.floor(rnd() * 256));
  } else if (type === "raid") {
    const lv = pick(["1", "5", "5", "6", "10"]), sz = pick([2, 4, 8, 12]);
    const nd = lv === "1" ? 2 : lv === "10" ? pick([4, 6, 8]) : 3 + Math.floor(rnd() * 5);
    const use = { "1": sz, "5": (nd - 1) * sz, "6": (nd - 2) * sz, "10": nd / 2 * sz };
    kind = "Storage"; q = "RAID " + lv + ", " + nd + " × " + sz + " TB. Usable?"; ans = use[lv] + " TB";
    wrong = uniq(ans, [nd * sz, (nd - 1) * sz, (nd - 2) * sz, nd / 2 * sz, sz].filter(v => v > 0).map(v => v + " TB"), () => (sz * (1 + Math.floor(rnd() * 8)) / (rnd() < 0.3 ? 2 : 1)) + " TB");
  } else if (type === "priv") {
    const r8 = () => Math.floor(rnd() * 256);
    const priv = [() => "10." + r8() + "." + r8() + "." + r8(), () => "172." + (16 + Math.floor(rnd() * 16)) + "." + r8() + "." + r8(), () => "192.168." + r8() + "." + r8()];
    const pub = [() => "172." + (32 + Math.floor(rnd() * 20)) + "." + r8() + "." + r8(), () => "192.169." + r8() + "." + r8(), () => "8.8." + r8() + "." + r8(), () => "11." + r8() + "." + r8() + "." + r8(), () => "172." + (1 + Math.floor(rnd() * 15)) + "." + r8() + "." + r8(), () => "193.168." + r8() + "." + r8()];
    kind = "IP addressing"; q = "Which one is a private IP?"; ans = pick(priv)();
    wrong = uniq(ans, shuffle(pub.slice(), rnd).slice(0, 3).map(f => f()), () => pick(pub)());
  } else if (type === "port") {
    const [name, p] = pick(PORTS); kind = "Firewall rule"; q = "Default port for " + name + "?"; ans = p;
    const others = shuffle(PORTS.filter(x => x[1] !== p).map(x => x[1]), rnd); wrong = others.slice(0, 3);
  } else if (type === "subnet") {
    const n = 23 + Math.floor(rnd() * 8); kind = "Subnetting"; q = "Usable hosts in a /" + n + "?"; ans = Math.pow(2, 32 - n) - 2;
    wrong = uniq(ans, [Math.pow(2, 32 - n), Math.pow(2, 33 - n) - 2, Math.pow(2, 31 - n) - 2].filter(v => v > 0), () => Math.pow(2, 32 - n) + Math.floor(rnd() * 4) * 2 + 2);
  } else if (type === "mask") {
    const n = 24 + Math.floor(rnd() * 7); kind = "Subnetting"; q = "Subnet mask for /" + n + "?";
    const oct = 256 - Math.pow(2, 32 - n); ans = "255.255.255." + oct;
    const alts = [128, 192, 224, 240, 248, 252, 254, 0].filter(v => v !== oct); shuffle(alts, rnd);
    wrong = alts.slice(0, 3).map(v => "255.255.255." + v);
  } else if (type === "binary") {
    const v = 5 + Math.floor(rnd() * 250), b = v.toString(2).padStart(8, "0");
    kind = "Binary"; q = b.slice(0, 4) + " " + b.slice(4) + " = ?"; ans = v; wrong = numDistract(v, 24);
  } else if (type === "hex") {
    const v = 16 + Math.floor(rnd() * 240); kind = "Hex"; q = "0x" + v.toString(16).toUpperCase() + " in decimal?"; ans = v; wrong = numDistract(v, 30);
  } else if (type === "acr") {
    const [a, full] = pick(ACRONYMS); kind = "Acronym"; q = a + " stands for…"; ans = full;
    wrong = shuffle(ACRONYMS.filter(x => x[0] !== a).map(x => x[1]), rnd).slice(0, 3);
  } else {
    const lvl = Math.min(3, Math.floor(i / 5));
    const op = pick(lvl ? ["+", "−", "×"] : ["+", "−"]);
    let a, b;
    if (op === "×") { a = 3 + Math.floor(rnd() * (6 + lvl * 3)); b = 3 + Math.floor(rnd() * 9); ans = a * b; }
    else if (op === "+") { a = 12 + Math.floor(rnd() * (40 + lvl * 40)); b = 9 + Math.floor(rnd() * (40 + lvl * 30)); ans = a + b; }
    else { a = 40 + Math.floor(rnd() * (60 + lvl * 40)); b = 7 + Math.floor(rnd() * (a - 10)); ans = a - b; }
    kind = pick(["Ticket queue", "License count", "Seat count", "Open alerts"]); q = a + " " + op + " " + b; wrong = numDistract(ans, op === "×" ? 12 : 10);
  }
  const choices = shuffle([ans, ...wrong.slice(0, 3)], rnd);
  return { kind, q, choices: choices.map(String), ans: choices.indexOf(ans), from: pick(TICKET_FROM), id: "NT-" + (4100 + ((seed + i * 37) % 900)) };
}
const helpdesk = {
  id: "helpdesk", title: "Helpdesk Sprint", tag: "Close tickets fast",
  blurb: "The queue is exploding. Close tickets on ports, subnets, RAID, IP ranges and more. Streaks unlock harder tickets, and P1 incidents pay double.",
  how: ["+10 per fix, plus a speed bonus up to +10. Every 3 in a row adds +5", "Your streak raises the ticket tier: harder, but worth more", "P1 incident = 3 steps at double points, +25 if you nail all 3"],
  keys: ["1 2 3 4", "Click or tap answers"],
  rec: { label: "Top sprint score", better: "max", fmt: v => v + " pts" },
  hostStart(S) {
    const n = S.ro.length;
    S.g = { t: 0, dur: 60, sc: new Array(n).fill(0), nn: new Array(n).fill(0), bot: {} };
    S.ro.forEach((r, i) => { if (r.b) S.g.bot[i] = 1.5 + Math.random() * 2; });
  },
  hostTick(S, dt, inputs) {
    const g = S.g; g.t += dt;
    S.ro.forEach((r, i) => {
      if (r.b) {
        g.bot[i] -= dt;
        if (g.bot[i] <= 0) {
          const ok = Math.random() < (r.boss ? 0.86 : 0.76);
          g.sc[i] = Math.max(0, g.sc[i] + (ok ? 10 + rint(0, r.boss ? 9 : 6) : -5)); g.nn[i]++;
          g.bot[i] = (r.boss ? 1.9 : 2.4) + Math.random() * 2;
        }
      } else {
        const inp = inputs[i];
        if (inp && Number.isFinite(inp.p)) { g.sc[i] = clamp(Math.round(inp.p), 0, 20000); g.nn[i] = inp.n | 0; }
      }
    });
  },
  pack(S) { return { sc: S.g.sc, nn: S.g.nn }; },
  timeLeft(S) { return (S.g.dur - S.g.t) * 1000; },
  done(S) { return S.g.t >= S.g.dur; },
  rank(S) { return S.ro.map((r, i) => ({ i, v: S.g.sc[i], label: S.g.sc[i] + " pts · " + S.g.nn[i] + " tickets", rec: S.g.sc[i] })).sort((a, b) => b.v - a.v); },
  chip(V, i) { return V.g && V.g.sc ? V.g.sc[i] : 0; },
  clientEnter(V) { V.md = { qi: 0, pts: 0, n: 0, streak: 0, lock: 0, shown: -1, qStart: 0, flash: 0, tier: 0, p1ok: 0, tk: null }; },
  answer(V, k) {
    const M = V.md; if (!M || V.h.ph !== "play" || V.meIdx < 0) return;
    if (now() < M.lock || M.busy) return;
    const tk = M.tk || genTicket(V.h.seed, M.qi, M.tier);
    const btns = $$("#mindAns button");
    const p1 = isP1(M.qi), step = M.qi % 8 - 4;
    M.busy = true;
    if (k === tk.ans) {
      const el = now() - M.qStart;
      M.streak++; M.n++;
      const bonus = Math.max(0, Math.round(10 - el / 500));
      let add = 10 + bonus + (M.streak % 3 === 0 ? 5 : 0) + M.tier * 3;
      if (p1) { add *= 2; if (step === 1) M.p1ok = 0; M.p1ok = (M.p1ok || 0) + 1; if (step === 3 && M.p1ok === 3) { add += 25; FX.text(W / 2, 290, "P1 RESOLVED +25", "#ffd23f", 1.2); SFX.play("win"); } }
      M.pts += add; SFX.play("right");
      btns[k] && btns[k].classList.add("right");
      FX.text(W / 2, 330, "+" + add, "#3ddc97", 0.8);
      setTimeout(() => { M.qi++; M.busy = false; M.shown = -1; }, 260);
    } else {
      if (p1) M.p1ok = -9;
      M.streak = 0; M.n++; M.pts = Math.max(0, M.pts - 5); M.lock = now() + 1000; SFX.play("wrong");
      btns[k] && btns[k].classList.add("wrong"); btns[tk.ans] && btns[tk.ans].classList.add("right");
      $("#mindPanel").classList.add("locked");
      setTimeout(() => { $("#mindPanel").classList.remove("locked"); M.qi++; M.busy = false; M.shown = -1; }, 1000);
    }
  },
  clientInput(V) {
    const M = V.md; if (!M || V.meIdx < 0) return null;
    const panel = $("#mindPanel");
    const playing = V.h.ph === "play";
    panel.hidden = !playing;
    if (playing && M.shown !== M.qi) {
      M.shown = M.qi; M.qStart = now();
      if (!isP1(M.qi)) M.tier = Math.min(3, Math.floor(M.streak / 3));
      const tk = M.tk = genTicket(V.h.seed, M.qi, M.tier);
      const p1 = isP1(M.qi);
      $("#mindPanel").classList.toggle("p1", p1);
      $("#mindKind").textContent = p1 ? "P1 INCIDENT · step " + (M.qi % 8 - 4) + "/3 · " + tk.kind + " · 2x points" : "Ticket " + tk.id + " · Tier " + (M.tier + 1) + " · " + tk.kind + " · from " + tk.from;
      $("#mindQ").textContent = tk.q;
      const box = $("#mindAns"); box.textContent = "";
      tk.choices.forEach((c, k) => {
        const b = document.createElement("button");
        b.type = "button";
        const sm = document.createElement("small"); sm.textContent = String(k + 1);
        b.append(sm, document.createTextNode(c));
        if (c.length > 9) b.style.fontSize = c.length > 22 ? "12px" : "15px";
        b.addEventListener("click", () => helpdesk.answer(V, k));
        box.append(b);
      });
    }
    $("#mindScore").textContent = M.pts;
    $("#mindStreak").textContent = "Streak " + M.streak;
    return { p: M.pts, n: M.n };
  },
  draw(ctx, V, dt, t) {
    const g = V.g || {};
    ctx.fillStyle = "#11152c"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(76,201,240,.05)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.font = "700 18px 'Chakra Petch', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#ffd23f";
    ctx.fillText("TICKET QUEUE · RESOLVED", 30, 30);
    const n = V.ro.length;
    const top = 60, laneH = Math.min(46, 270 / Math.max(1, n));
    const sc = g.sc || [];
    const me = V.meIdx >= 0 && V.md ? V.md.pts : null;
    const vals = V.ro.map((r, i) => i === V.meIdx && me != null ? me : (sc[i] || 0));
    const max = Math.max(160, ...vals.map(v => v * 1.12));
    const x0 = 150, x1 = W - 60;
    V.ro.forEach((ro, i) => {
      const y = top + i * laneH + laneH / 2;
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,.025)" : "rgba(255,255,255,.05)"; ctx.fillRect(20, y - laneH / 2, W - 40, laneH);
      ctx.font = "700 13px Inter, system-ui, sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = i === V.meIdx ? "#f5f1e6" : "#9da1a9";
      ctx.fillText(ro.n, x0 - 30, y);
      ctx.strokeStyle = "rgba(157,161,169,.2)"; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.setLineDash([]);
      const m = smoothTo(V, i, x0 + (x1 - x0) * vals[i] / max, y, 0.12);
      ctx.fillStyle = ro.hex; ctx.globalAlpha = 0.35; ctx.fillRect(x0, y - 3, m.x - x0, 6); ctx.globalAlpha = 1;
      drawChar(ctx, ro.c, m.x, y - 2, Math.min(36, laneH * 0.82), { t, shadow: false, squash: Math.abs(m.vx) > 0.2 ? Math.sin(t * 20) * 0.3 : 0, phase: i, color: ro.hex });
      ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#ffd23f";
      ctx.fillText(String(vals[i]), m.x + 24, y);
    });
  },
};

const GAMES = { coverage, sumo, alert, helpdesk };
const GAME_ORDER = ["coverage", "sumo", "alert", "helpdesk"];
const PLACE_POINTS = [10, 7, 5, 3];
