// ======================= FIREWALL FRENZY (first-person laser tag, three.js) =======================
const FPS_MAP = [
  "######################",
  "#S...#........#.....S#",
  "#.##.#.######.#.##...#",
  "#.#..P........P..#.#.#",
  "#.#.####.##.####.#.#.#",
  "#......#.#..#......#.#",
  "###.##.#....#.##.###.#",
  "#S..#....##....#.....#",
  "#.#.#.##.##.##.#.#.#.#",
  "#.#......P..P......#.#",
  "#.####.#.#..#.#.####.#",
  "#......#......#......#",
  "#.##.#.###..###.#.##.#",
  "#.#..#....P.....#..#.#",
  "#.#.####.#..#.####.#.#",
  "#...#....#..#....#...#",
  "#.#.#.##.####.##.#.#S#",
  "#.#...#........#...#.#",
  "#.###.#.######.#.###.#",
  "#S....P...#....P.....#",
  "#...#.....#...#....S.#",
  "######################",
];
const FG = FPS_MAP.length, CS = 4, EYE = 1.55, PR = 0.38;
const FPS_SPAWNS = [], FPS_PICKS = [];
FPS_MAP.forEach((row, z) => [...row].forEach((ch, x) => {
  if (ch === "S") FPS_SPAWNS.push([x * CS + CS / 2, z * CS + CS / 2]);
  if (ch === "P") FPS_PICKS.push([x * CS + CS / 2, z * CS + CS / 2]);
}));
const PICK_TYPES = ["oc", "heal", "shield"];
const PICK_NAMES = { oc: "OVERCLOCK", heal: "PATCH KIT", shield: "FIREWALL SHIELD" };
function fWall(cx, cz) { if (cx < 0 || cz < 0 || cx >= FG || cz >= FG) return true; return FPS_MAP[cz][cx] === "#"; }
function fSolidAt(x, z) { return fWall(Math.floor(x / CS), Math.floor(z / CS)); }
function fBlocked(x, z, r = PR) { return fSolidAt(x - r, z - r) || fSolidAt(x + r, z - r) || fSolidAt(x - r, z + r) || fSolidAt(x + r, z + r); }
function fMove(p, dx, dz) {
  if (!fBlocked(p.x + dx, p.z)) p.x += dx;
  if (!fBlocked(p.x, p.z + dz)) p.z += dz;
}
// 2D DDA through the grid: distance along (dx,dz) (unit) to the first wall, capped at maxT
function fGridRay(ox, oz, dx, dz, maxT) {
  let cx = Math.floor(ox / CS), cz = Math.floor(oz / CS);
  const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(CS / dx) : Infinity, tdz = dz !== 0 ? Math.abs(CS / dz) : Infinity;
  let tmx = dx !== 0 ? ((dx > 0 ? (cx + 1) * CS - ox : ox - cx * CS) / Math.abs(dx)) : Infinity;
  let tmz = dz !== 0 ? ((dz > 0 ? (cz + 1) * CS - oz : oz - cz * CS) / Math.abs(dz)) : Infinity;
  let t = 0;
  for (let k = 0; k < 200 && t < maxT; k++) {
    if (tmx < tmz) { cx += sx; t = tmx; tmx += tdx; } else { cz += sz; t = tmz; tmz += tdz; }
    if (fWall(cx, cz)) return Math.min(t, maxT);
  }
  return maxT;
}
function fLOS(ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz); if (d < 0.01) return true;
  return fGridRay(ax, az, dx / d, dz / d, d) >= d - 0.05;
}
function fCellPath(sx, sz, tx, tz) { // BFS on open cells; returns list of [cx,cz]
  const start = sz * FG + sx, goal = tz * FG + tx;
  if (start === goal) return [];
  const prev = new Int16Array(FG * FG).fill(-1); prev[start] = start;
  const q = [start];
  for (let h = 0; h < q.length; h++) {
    const c = q[h]; if (c === goal) break;
    const x = c % FG, z = (c / FG) | 0;
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ax, nz = z + az; if (fWall(nx, nz)) continue;
      const n = nz * FG + nx; if (prev[n] !== -1) continue; prev[n] = c; q.push(n);
    }
  }
  if (prev[goal] === -1) return [];
  const out = []; for (let c = goal; c !== start; c = prev[c]) out.push([c % FG, (c / FG) | 0]);
  return out.reverse();
}
const FPS_OPEN = []; FPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch !== "#") FPS_OPEN.push([x, z]); }));
// player aim preferences (kept per browser)
function lookPrefs() { const L = store("nfa-look") || {}; return { iy: !!L.iy, ix: !!L.ix, s: clamp(+L.s || 1, 0.3, 3) }; }
function saveLookPrefs(L) { store("nfa-look", { iy: !!L.iy, ix: !!L.ix, s: L.s }); }
function syncLookPanel(F) {
  const sp = F && F.setPanel; if (!sp) return; const L = lookPrefs();
  sp.querySelector('[data-k="iy"]').checked = L.iy; sp.querySelector('[data-k="ix"]').checked = L.ix;
  sp.querySelector('[data-k="s"]').value = L.s; sp.querySelector("[data-v]").textContent = L.s.toFixed(1) + "×";
}
function loadThree() {
  if (window.THREE) return Promise.resolve(true);
  if (loadThree.p) return loadThree.p;
  loadThree.p = new Promise((res) => {
    const s = document.createElement("script");
    s.src = "vendor/three.min.js"; s.onload = () => res(!!window.THREE); s.onerror = () => res(false);
    document.head.append(s);
  });
  return loadThree.p;
}

const frenzy = {
  id: "frenzy", title: "Firewall Frenzy", tag: "3D first-person laser tag",
  blurb: "Laser tag through the Neteam data center. Tag rivals to patch them, they reboot a few seconds later. First to 15 tags or most tags after 3 minutes wins.",
  how: ["3 hits patches a rival · you reboot in 3 s", "Overclock = rapid fire · Patch Kit = heal · Shield = blocks 2 hits", "Use the minimap to find people in the racks"],
  keys: ["Click to aim (mouse look) · I = invert", "WASD move · Shift sprint", "Click / Space = tag", "Phone: left stick + drag + TAG"],
  rec: { label: "Most tags", better: "max", fmt: v => v + " tags" },
  custom3d: true,
  DUR: 180, GOAL: 15, DMG: 34,
  hostStart(S) {
    const n = S.ro.length;
    const sp = shuffle(FPS_SPAWNS.slice());
    S.g = {
      t: 0, kseq: 0, kf: [],
      P: S.ro.map((r, i) => ({ x: sp[i % sp.length][0], z: sp[i % sp.length][1], a: 0, hp: 100, alive: 1, rT: 0, sc: 0, de: 0, sh: 0, ocT: 0, rsq: 0, lastClaim: 0, bot: r.b ? { path: [], pT: 0, fT: 1, boss: !!r.boss, tgt: -1, strafe: 1, sT: 0 } : null, bs: 0, shot: null })),
      pk: FPS_PICKS.map(() => 0), pev: null, pseq: 0,
    };
    S.g.P.forEach(p => { p.rx = p.x; p.rz = p.z; });
  },
  respawnSpot(S, i) {
    const others = S.g.P.filter((q, j) => j !== i && q.alive);
    let best = FPS_SPAWNS[0], bs = -1;
    for (const s of FPS_SPAWNS) { const d = others.length ? Math.min(...others.map(q => Math.hypot(q.x - s[0], q.z - s[1]))) : Math.random() * 10; if (d > bs) { bs = d; best = s; } }
    return best;
  },
  damage(S, tgt, from) {
    const g = S.g, q = g.P[tgt];
    if (!q.alive) return;
    if (q.sh > 0) { q.sh--; return; }
    q.hp -= this.DMG;
    if (q.hp <= 0) {
      q.hp = 0; q.alive = 0; q.rT = 3; q.de++;
      if (from >= 0 && from !== tgt) g.P[from].sc++;
      g.kf.push([from, tgt, ++g.kseq]); if (g.kf.length > 4) g.kf.shift();
    }
  },
  hostTick(S, dt, inputs) {
    const g = S.g; g.t += dt;
    const P = g.P;
    P.forEach((p, i) => {
      if (!p.alive) {
        p.rT -= dt;
        if (p.rT <= 0) { const s = this.respawnSpot(S, i); p.x = p.rx = s[0]; p.z = p.rz = s[1]; p.hp = 100; p.alive = 1; p.rsq++; p.sh = 0; p.ocT = 0; if (p.bot) p.bot.path = []; }
        return;
      }
      p.ocT = Math.max(0, p.ocT - dt);
      if (p.bot) this.botTick(S, i, dt);
      else {
        const inp = inputs[i];
        if (inp && Number.isFinite(inp.x) && Number.isFinite(inp.z) && inp.q === p.rsq) { p.x = clamp(inp.x, 0, FG * CS); p.z = clamp(inp.z, 0, FG * CS); p.a = +inp.a || 0; }
        if (inp && Array.isArray(inp.hc)) {
          let mx = p.lastClaim;
          for (const c of inp.hc) {
            if (!Array.isArray(c) || !(c[0] > p.lastClaim)) continue;
            mx = Math.max(mx, c[0]);
            const tg = c[1] | 0; const q = P[tg];
            if (!q || tg === i || !q.alive) continue;
            if (Math.hypot(q.x - p.x, q.z - p.z) > 60) continue;
            this.damage(S, tg, i);
          }
          p.lastClaim = mx;
        }
      }
      // pickups
      FPS_PICKS.forEach((pp, k) => {
        if (g.pk[k] > 0 || Math.hypot(pp[0] - p.x, pp[1] - p.z) > 1.3) return;
        const type = PICK_TYPES[k % PICK_TYPES.length];
        if (type === "heal" && p.hp >= 100) return;
        if (type === "oc") p.ocT = 8; else if (type === "heal") p.hp = 100; else p.sh = 2;
        g.pk[k] = 15; g.pev = [i, k, ++g.pseq];
      });
    });
    g.pk = g.pk.map(v => Math.max(0, v - dt));
  },
  botTick(S, i, dt) {
    const g = S.g, p = g.P[i], b = p.bot;
    // pick a visible target
    let tgt = -1, td = 1e9;
    g.P.forEach((q, j) => { if (j === i || !q.alive) return; const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < 26 && d < td && fLOS(p.x, p.z, q.x, q.z)) { td = d; tgt = j; } });
    b.pT -= dt; b.fT -= dt;
    const speed = b.boss ? 4.6 : 4.0;
    if (tgt >= 0) {
      const q = g.P[tgt];
      const want = Math.atan2(q.x - p.x, q.z - p.z);
      let da = ((want - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      p.a += clamp(da, -dt * 5, dt * 5);
      b.sT -= dt; if (b.sT <= 0) { b.strafe = Math.random() < 0.5 ? -1 : 1; b.sT = 0.6 + Math.random(); }
      const sx = Math.cos(p.a) * b.strafe, sz = -Math.sin(p.a) * b.strafe;
      const fwd = td > 7 ? 0.7 : td < 3 ? -0.5 : 0;
      fMove(p, (sx * 0.7 + Math.sin(p.a) * fwd) * speed * dt, (sz * 0.7 + Math.cos(p.a) * fwd) * speed * dt);
      if (b.fT <= 0 && Math.abs(da) < 0.25) {
        b.fT = (p.ocT > 0 ? 0.3 : 0.55) + Math.random() * (b.boss ? 0.3 : 0.5);
        const acc = clamp((b.boss ? 0.75 : 0.6) - td * 0.018, 0.12, 0.8);
        const hit = Math.random() < acc;
        const ang = p.a + (hit ? 0 : (Math.random() - 0.5) * 0.25);
        const dist = hit ? td : fGridRay(p.x, p.z, Math.sin(ang), Math.cos(ang), 40);
        p.shot = [++p.bs, +(p.x + Math.sin(ang) * dist).toFixed(2), +(hit ? 1.0 : 1.2 + Math.random() * 0.6).toFixed(2), +(p.z + Math.cos(ang) * dist).toFixed(2)];
        if (hit) this.damage(S, tgt, i);
      }
      return;
    }
    // roam: path to a pickup or random cell
    if (!b.path.length || b.pT <= 0) {
      let dest;
      const open = FPS_PICKS.map((pp, k) => ({ pp, k })).filter(o => g.pk[o.k] <= 0);
      if (open.length && Math.random() < 0.45) { const o = open[rint(0, open.length - 1)]; dest = [Math.floor(o.pp[0] / CS), Math.floor(o.pp[1] / CS)]; }
      else {
        // head toward the nearest living rival with some noise
        const others = g.P.filter((q, j) => j !== i && q.alive);
        if (others.length && Math.random() < 0.7) { const q = others[rint(0, others.length - 1)]; dest = [Math.floor(q.x / CS), Math.floor(q.z / CS)]; }
        else dest = FPS_OPEN[rint(0, FPS_OPEN.length - 1)];
      }
      b.path = fCellPath(Math.floor(p.x / CS), Math.floor(p.z / CS), dest[0], dest[1]);
      b.pT = 2.5;
    }
    const nx = b.path[0];
    if (nx) {
      const tx = nx[0] * CS + CS / 2, tz = nx[1] * CS + CS / 2;
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.4) b.path.shift();
      else {
        const want = Math.atan2(dx, dz); let da = ((want - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        p.a += clamp(da, -dt * 6, dt * 6);
        const s = Math.min(d, speed * dt);
        fMove(p, dx / d * s, dz / d * s);
      }
    }
  },
  pack(S) {
    const g = S.g;
    return {
      pl: g.P.map(p => [p.hp, p.alive, Math.ceil(p.rT * 10), p.sc, p.de, p.sh, p.ocT > 0 ? 1 : 0, p.rsq, +p.rx.toFixed(2), +p.rz.toFixed(2)]),
      bt: g.P.map(p => p.bot ? [+p.x.toFixed(2), +p.z.toFixed(2), +(p.a + Math.PI).toFixed(2)] : 0),
      bs: g.P.map(p => p.bot && p.shot ? p.shot : 0),
      pk: g.pk.map(v => v > 0 ? 0 : 1), pev: g.pev, kf: g.kf,
    };
  },
  timeLeft(S) { return (this.DUR - S.g.t) * 1000; },
  done(S) { return S.g.t >= this.DUR || S.g.P.some(p => p.sc >= this.GOAL); },
  rank(S) {
    return S.g.P.map((p, i) => ({ i, v: p.sc, label: p.sc + " tag" + (p.sc === 1 ? "" : "s") + " · " + p.de + " reboot" + (p.de === 1 ? "" : "s"), rec: p.sc, de: p.de }))
      .sort((a, b) => (b.v - a.v) || (a.de - b.de));
  },
  chip(V, i) { const pl = V.g && V.g.pl && V.g.pl[i]; return pl ? pl[3] : 0; },

  cardArt(ctx, ro, t) {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#0b0e22"); bg.addColorStop(1, "#1a2048");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const vx = W / 2, vy = H * 0.46;
    // floor & ceiling perspective lines
    ctx.strokeStyle = "rgba(76,201,240,.35)"; ctx.lineWidth = 2;
    for (let k = -8; k <= 8; k++) { ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + k * 140, H); ctx.stroke(); }
    for (let k = 1; k < 7; k++) { const y = vy + (H - vy) * Math.pow(k / 7, 2); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // rack walls left/right
    for (const side of [-1, 1]) {
      for (let k = 0; k < 5; k++) {
        const z0 = k / 5, z1 = (k + 1) / 5;
        const x0 = vx + side * (W / 2) * (1 - z0 * 0.8), x1 = vx + side * (W / 2) * (1 - z1 * 0.8);
        const t0 = vy - (vy) * (1 - z0 * 0.8), b0 = vy + (H - vy) * (1 - z0 * 0.8);
        const t1 = vy - (vy) * (1 - z1 * 0.8), b1 = vy + (H - vy) * (1 - z1 * 0.8);
        ctx.fillStyle = k % 2 ? "#151a33" : "#17191c";
        ctx.beginPath(); ctx.moveTo(x0, t0); ctx.lineTo(x1, t1); ctx.lineTo(x1, b1); ctx.lineTo(x0, b0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#2c355f"; ctx.stroke();
        for (let l = 0; l < 6; l++) { const f = 0.2 + l * 0.12; ctx.fillStyle = ["#3ddc97", "#4cc9f0", "#ffd23f"][(k + l) % 3]; ctx.fillRect(lerp(x0, x1, 0.5) - 3, lerp(lerp(t0, b0, f), lerp(t1, b1, f), 0.5), 6, 4); }
      }
    }
    // rivals
    drawChar(ctx, ro[1].c, vx - 70, vy + 60, 70, { t, color: ro[1].hex, mood: "shock" });
    drawChar(ctx, ro[2].c, vx + 110, vy + 30, 46, { t, color: ro[2].hex });
    // laser
    ctx.strokeStyle = ro[0].hex; ctx.lineWidth = 6; ctx.shadowColor = ro[0].hex; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(W * 0.66, H * 0.9); ctx.lineTo(vx - 70, vy + 50); ctx.stroke(); ctx.shadowBlur = 0;
    // tagger
    ctx.fillStyle = "#222844"; ctx.beginPath(); ctx.moveTo(W * 0.6, H); ctx.lineTo(W * 0.66, H * 0.84); ctx.lineTo(W * 0.78, H * 0.86); ctx.lineTo(W * 0.8, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ro[0].hex; ctx.fillRect(W * 0.655, H * 0.86, W * 0.1, 8);
    // crosshair
    ctx.strokeStyle = "#f5f1e6"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(vx - 70, vy + 50, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.font = "700 40px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd23f"; ctx.fillText("3D", 70, 60);
  },
  // ---------------- client ----------------
  clientEnter(V) {
    const mi = V.meIdx >= 0 ? V.meIdx : 0, sp0 = FPS_SPAWNS[mi % FPS_SPAWNS.length], lap = Math.floor(mi / FPS_SPAWNS.length);
    let sp = sp0;
    if (lap) { for (const [ox, oz] of [[1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) { const c = [sp0[0] + ox * lap, sp0[1] + oz * lap]; if (!fBlocked(c[0], c[1], 0.4)) { sp = c; break; } } }
    const F = V.fps = { ready: false, failed: false, me: { x: sp[0], z: sp[1], a: 0, p: 0 }, rsq: 0, shotN: 0, claimN: 0, claims: [], fireCd: 0, firing: false,
      look: { dx: 0, dy: 0 }, stick: null, lookT: null, lastHp: 100, hurtT: 0, hitT: 0, kfSeen: 0, pevSeen: 0, msg: null, bsSeen: {}, shSeen: {}, remote: {}, recoil: 0, bob: 0, toast: [] };
    F.me.a = this.faceOpen(sp[0], sp[1]);
    loadThree().then(ok => { if (!ok) { F.failed = true; return; } if (APP.V === V) this.build(V); });
    this.bind(V);
  },
  faceOpen(x, z) { let best = 0, bd = -1; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; const d = fGridRay(x, z, Math.sin(a), Math.cos(a), 40); if (d > bd) { bd = d; best = a; } } return best + Math.PI; },
  clientExit(V) {
    const F = V.fps; if (!F) return;
    (F.unbind || []).forEach(f => f());
    if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
    if (F.renderer) { try { F.renderer.dispose(); F.renderer.forceContextLoss(); } catch (e) {} }
    if (F.cv) F.cv.remove();
    if (F.fireBtn) F.fireBtn.remove();
    if (F.setBtn) F.setBtn.remove();
    if (F.setPanel) F.setPanel.remove();
    V.fps = null;
  },
  bind(V) {
    const F = V.fps, cv = $("#gameCanvas");
    const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); (F.unbind || (F.unbind = [])).push(() => el.removeEventListener(ev, fn, o)); };
    const coarse = matchMedia("(pointer: coarse)").matches;
    on(cv, "mousedown", (e) => {
      if (coarse) return;
      if (document.pointerLockElement !== cv) { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (er) {} F.dragLook = true; }
      if (e.button === 0) F.firing = true;
    });
    on(window, "mouseup", () => { F.firing = false; F.dragLook = false; });
    on(window, "mousemove", (e) => {
      if (document.pointerLockElement === cv || F.dragLook) { F.look.dx += e.movementX || 0; F.look.dy += e.movementY || 0; }
    });
    on(window, "keydown", (e) => {
      if (e.code === "Space" && APP.view === "game") { F.firing = true; e.preventDefault(); }
      if (e.code === "KeyI" && APP.view === "game" && !e.repeat) { const L = lookPrefs(); L.iy = !L.iy; saveLookPrefs(L); toast("Mouse look up/down: " + (L.iy ? "inverted" : "normal")); syncLookPanel(F); }
    });
    // look settings: gear button + small panel (press Esc first to free the mouse)
    const sb = document.createElement("button"); sb.type = "button"; sb.className = "look-btn"; sb.textContent = "⚙ Aim"; sb.title = "Mouse and aim settings";
    const sp = document.createElement("div"); sp.className = "look-panel"; sp.hidden = true;
    sp.innerHTML = '<h4>Aim settings</h4>' +
      '<label><input type="checkbox" data-k="iy"> Invert up/down <small>(key I)</small></label>' +
      '<label><input type="checkbox" data-k="ix"> Invert left/right</label>' +
      '<label class="sl">Sensitivity <b data-v></b><input type="range" min="0.3" max="3" step="0.1" data-k="s"></label>' +
      '<button type="button" class="btn" data-close>Done</button>';
    sb.addEventListener("click", (e) => { e.stopPropagation(); if (document.pointerLockElement) try { document.exitPointerLock(); } catch (er) {} sp.hidden = !sp.hidden; syncLookPanel(F); });
    sp.addEventListener("mousedown", (e) => e.stopPropagation());
    sp.addEventListener("input", (e) => {
      const k = e.target.dataset.k; if (!k) return;
      const L = lookPrefs(); L[k] = k === "s" ? clamp(+e.target.value || 1, 0.3, 3) : e.target.checked; saveLookPrefs(L); syncLookPanel(F);
    });
    sp.querySelector("[data-close]").addEventListener("click", () => { sp.hidden = true; });
    $("#stagebox").append(sb, sp); F.setBtn = sb; F.setPanel = sp;
    on(window, "keyup", (e) => { if (e.code === "Space") F.firing = false; });
    // touch: left half = move stick, right half = look
    on(cv, "touchstart", (e) => {
      const r = cv.getBoundingClientRect();
      for (const t of e.changedTouches) {
        if (t.clientX - r.left < r.width * 0.45 && !F.stick) F.stick = { id: t.identifier, bx: t.clientX, by: t.clientY, x: t.clientX, y: t.clientY };
        else if (!F.lookT) F.lookT = { id: t.identifier, x: t.clientX, y: t.clientY };
      }
      e.preventDefault();
    }, { passive: false });
    on(cv, "touchmove", (e) => {
      for (const t of e.changedTouches) {
        if (F.stick && t.identifier === F.stick.id) { F.stick.x = t.clientX; F.stick.y = t.clientY; }
        if (F.lookT && t.identifier === F.lookT.id) { F.look.dx += (t.clientX - F.lookT.x) * 1.6; F.look.dy += (t.clientY - F.lookT.y) * 1.6; F.lookT.x = t.clientX; F.lookT.y = t.clientY; }
      }
      e.preventDefault();
    }, { passive: false });
    const tend = (e) => { for (const t of e.changedTouches) { if (F.stick && t.identifier === F.stick.id) F.stick = null; if (F.lookT && t.identifier === F.lookT.id) F.lookT = null; } };
    on(cv, "touchend", tend); on(cv, "touchcancel", tend);
    if (coarse && V.meIdx >= 0) {
      const b = document.createElement("button"); b.className = "touch-dash"; b.textContent = "TAG"; b.type = "button";
      b.addEventListener("touchstart", (e) => { F.firing = true; e.preventDefault(); }, { passive: false });
      b.addEventListener("touchend", () => { F.firing = false; });
      $("#stagebox").append(b); F.fireBtn = b;
    }
  },
  charTex(c, hex, name) {
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 320;
    const ctx = cv.getContext("2d");
    drawChar(ctx, c, 128, 196, 150, { shadow: false, bob: false, blink: false, color: hex });
    ctx.font = "700 30px Inter, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const w = ctx.measureText(name).width + 24;
    ctx.fillStyle = "rgba(11,14,32,.82)"; ctx.beginPath(); ctx.roundRect(128 - w / 2, 14, w, 42, 21); ctx.fill();
    ctx.fillStyle = hex; ctx.fillRect(128 - w / 2 + 12, 50, w - 24, 4);
    ctx.fillStyle = "#f5f1e6"; ctx.fillText(name, 128, 36);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    if (isAvId(c && c[5]) && !avImg(c[5])) avImg(c[5], () => { const n = this.charTex(c, hex, name); ctx.clearRect(0, 0, 256, 320); ctx.drawImage(n.image, 0, 0); t.needsUpdate = true; n.dispose(); });
    return t;
  },
  build(V) {
    const F = V.fps; if (!F || F.ready) return;
    const T = THREE;
    const cv = document.createElement("canvas"); cv.className = "fps3d";
    Object.assign(cv.style, { position: "absolute", borderRadius: "10px", pointerEvents: "none" });
    $("#stagebox").insertBefore(cv, $("#gameCanvas"));
    F.cv = cv;
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" }); }
    catch (e) { F.failed = true; return; }
    renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    F.renderer = renderer;
    const scene = new T.Scene(); F.scene = scene;
    scene.background = new T.Color(0x070915);
    scene.fog = new T.FogExp2(0x101436, 0.035);
    const cam = new T.PerspectiveCamera(75, 16 / 10, 0.05, 120); F.cam = cam; scene.add(cam);
    scene.add(new T.HemisphereLight(0xb8c6ff, 0x2a1840, 2.6));
    const amb = new T.AmbientLight(0x5866a8, 1.4); scene.add(amb);
    // textures
    const mk = (w, h, fn) => { const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; };
    const rackMap = mk(128, 256, (x, w, h) => {
      x.fillStyle = "#3a4370"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#232a4d"; x.fillRect(6, 6, w - 12, h - 12);
      for (let y = 12; y < h - 12; y += 22) {
        x.fillStyle = "#4a5488"; x.fillRect(10, y, w - 20, 18);
        x.fillStyle = "#0a0c18"; for (let k = 0; k < 9; k++) x.fillRect(16 + k * 7, y + 5, 4, 8);
      }
      x.strokeStyle = "#6a76b0"; x.lineWidth = 3; x.strokeRect(4, 4, w - 8, h - 8);
    });
    const ledMap = mk(128, 256, (x, w, h) => {
      x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
      const cols = ["#3ddc97", "#4cc9f0", "#ffd23f", "#3ddc97", "#ff6b57"];
      for (let y = 12; y < h - 12; y += 22) for (let k = 0; k < 4; k++) { if (Math.random() < 0.35) continue; x.fillStyle = cols[Math.floor(Math.random() * cols.length)]; x.fillRect(84 + k * 8, y + 7, 4, 4); }
      x.fillStyle = "#4cc9f0"; x.fillRect(6, h - 10, w - 12, 3);
    });
    const floorMap = mk(256, 256, (x, w, h) => {
      x.fillStyle = "#2a3160"; x.fillRect(0, 0, w, h);
      x.strokeStyle = "#465096"; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4);
      x.fillStyle = "#121630"; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.arc(32 + i * 27, 32 + j * 27, 3, 0, Math.PI * 2); x.fill(); }
    });
    floorMap.wrapS = floorMap.wrapT = T.RepeatWrapping; floorMap.repeat.set(FG, FG);
    const ceilMap = mk(256, 256, (x, w, h) => { x.fillStyle = "#0b0e1e"; x.fillRect(0, 0, w, h); x.fillStyle = "#c9d6ff"; x.fillRect(110, 20, 36, 216); });
    ceilMap.wrapS = ceilMap.wrapT = T.RepeatWrapping; ceilMap.repeat.set(FG, FG);
    // floor & ceiling
    const size = FG * CS;
    const floor = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshStandardMaterial({ map: floorMap, roughness: 0.55, metalness: 0.3 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(size / 2, 0, size / 2); scene.add(floor);
    const ceil = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshStandardMaterial({ map: ceilMap, emissiveMap: ceilMap, emissive: 0x8090c0, emissiveIntensity: 0.5 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(size / 2, 3.4, size / 2); scene.add(ceil);
    // racks (instanced)
    const walls = []; FPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch === "#") walls.push([x, z]); }));
    const rackMat = new T.MeshStandardMaterial({ map: rackMap, emissiveMap: ledMap, emissive: 0xffffff, emissiveIntensity: 1.4, roughness: 0.6, metalness: 0.5 });
    F.rackMat = rackMat;
    const inst = new T.InstancedMesh(new T.BoxGeometry(CS, 3.4, CS), rackMat, walls.length);
    const m4 = new T.Matrix4();
    walls.forEach(([x, z], k) => { m4.makeTranslation(x * CS + CS / 2, 1.7, z * CS + CS / 2); inst.setMatrixAt(k, m4); });
    scene.add(inst);
    // neon trims on the floor along racks
    const trimMat = new T.MeshBasicMaterial({ color: 0x4cc9f0 });
    const trimGeo = new T.BoxGeometry(CS, 0.04, 0.06);
    walls.forEach(([x, z]) => {
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([ax, az]) => {
        if (fWall(x + ax, z + az)) return;
        const t = new T.Mesh(trimGeo, trimMat);
        t.position.set(x * CS + CS / 2 + ax * (CS / 2 + 0.03), 0.03, z * CS + CS / 2 + az * (CS / 2 + 0.03));
        if (ax) t.rotation.y = Math.PI / 2;
        scene.add(t);
      });
    });
    // signage
    const sign = (txt, sub, x, z, ry) => {
      const tex = mk(512, 128, (c, w, h) => { c.fillStyle = "#0a0b0d"; c.fillRect(0, 0, w, h); c.strokeStyle = "#ffd23f"; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#ffd23f"; c.font = "700 52px 'Chakra Petch', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, w / 2, 54); c.fillStyle = "#9da1a9"; c.font = "700 20px 'JetBrains Mono', monospace"; c.fillText(sub, w / 2, 100); });
      const m = new T.Mesh(new T.PlaneGeometry(3.2, 0.8), new T.MeshBasicMaterial({ map: tex }));
      m.position.set(x, 2.6, z); m.rotation.y = ry; scene.add(m);
    };
    sign("NETEAM DC-1", "AUTHORIZED TECHS ONLY", 11 * CS, CS + 0.02, 0);
    sign("NETEAM DC-1", "COLD AISLE B", 11 * CS, (FG - 1) * CS - 0.02, Math.PI);
    sign("CORE SWITCH", "DO NOT UNPLUG", CS + 0.02, 11 * CS, Math.PI / 2);
    sign("BACKUP VAULT", "3-2-1 OR BUST", (FG - 1) * CS - 0.02, 11 * CS, -Math.PI / 2);
    // colored point lights
    [[5, 5, 0x4cc9f0], [16, 5, 0xff7ac6], [5, 16, 0x3ddc97], [16, 16, 0xffd23f], [11, 11, 0x9b7bff]].forEach(([x, z, c]) => { const l = new T.PointLight(c, 18, 18, 1.6); l.position.set(x * CS + 2, 3, z * CS + 2); scene.add(l); });
    // pickups
    F.picks = FPS_PICKS.map((pp, k) => {
      const type = PICK_TYPES[k % PICK_TYPES.length];
      let mesh;
      if (type === "oc") mesh = new T.Mesh(new T.OctahedronGeometry(0.32), new T.MeshBasicMaterial({ color: 0xffd23f }));
      else if (type === "heal") { mesh = new T.Group(); const mat = new T.MeshBasicMaterial({ color: 0x3ddc97 }); mesh.add(new T.Mesh(new T.BoxGeometry(0.55, 0.18, 0.18), mat)); mesh.add(new T.Mesh(new T.BoxGeometry(0.18, 0.55, 0.18), mat)); }
      else mesh = new T.Mesh(new T.TorusGeometry(0.28, 0.08, 10, 24), new T.MeshBasicMaterial({ color: 0x4cc9f0 }));
      mesh.position.set(pp[0], 1, pp[1]);
      const ring = new T.Mesh(new T.RingGeometry(0.5, 0.62, 32), new T.MeshBasicMaterial({ color: type === "oc" ? 0xffd23f : type === "heal" ? 0x3ddc97 : 0x4cc9f0, transparent: true, opacity: 0.6, side: T.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(pp[0], 0.03, pp[1]);
      scene.add(mesh, ring);
      return { mesh, ring };
    });
    // players
    F.avatars = V.ro.map((r, i) => {
      const grp = new T.Group();
      const mat = new T.SpriteMaterial({ map: this.charTex(r.c, r.hex, r.n), transparent: true });
      const spr = new T.Sprite(mat); spr.scale.set(1.5, 1.875, 1); spr.position.y = 1.0;
      const ring = new T.Mesh(new T.RingGeometry(0.42, 0.55, 28), new T.MeshBasicMaterial({ color: new T.Color(r.hex), transparent: true, opacity: 0.85, side: T.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04;
      const shield = new T.Mesh(new T.SphereGeometry(0.85, 20, 14), new T.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.18 }));
      shield.position.y = 0.95; shield.visible = false;
      grp.add(spr, ring, shield);
      grp.visible = i !== V.meIdx;
      scene.add(grp);
      return { grp, spr, ring, shield, x: 0, z: 0, init: false };
    });
    // view model tagger
    const gun = new T.Group();
    const myHex = V.meIdx >= 0 ? V.ro[V.meIdx].hex : "#ffd23f";
    const body = new T.Mesh(new T.BoxGeometry(0.11, 0.13, 0.5), new T.MeshStandardMaterial({ color: 0x5a6498, metalness: 0.3, roughness: 0.5, emissive: 0x1a2040 }));
    const stripe = new T.Mesh(new T.BoxGeometry(0.115, 0.03, 0.42), new T.MeshBasicMaterial({ color: new T.Color(myHex) }));
    stripe.position.y = 0.04;
    const barrel = new T.Mesh(new T.CylinderGeometry(0.03, 0.035, 0.22, 12), new T.MeshBasicMaterial({ color: new T.Color(myHex) }));
    barrel.rotation.x = Math.PI / 2; barrel.position.z = -0.34;
    const grip = new T.Mesh(new T.BoxGeometry(0.08, 0.16, 0.09), new T.MeshStandardMaterial({ color: 0x3a4370 }));
    grip.position.set(0, -0.12, 0.12); grip.rotation.x = 0.3;
    gun.add(body, stripe, barrel, grip);
    gun.scale.setScalar(0.7); gun.position.set(0.24, -0.22, -0.48); cam.add(gun); F.gun = gun;
    const flash = new T.PointLight(new T.Color(myHex), 0, 6, 2); flash.position.set(0.24, -0.15, -0.9); cam.add(flash); F.flash = flash;
    F.tracers = []; F.sparks = [];
    F.tracerGeo = new T.BoxGeometry(0.035, 0.035, 1);
    F.sparkGeo = new T.SphereGeometry(0.12, 8, 6);
    F.ready = true;
  },
  addTracer(V, from, to, hex) {
    const F = V.fps, T = THREE; if (!F || !F.ready) return;
    const a = new T.Vector3(...from), b = new T.Vector3(...to);
    const len = a.distanceTo(b); if (len < 0.1) return;
    const m = new T.Mesh(F.tracerGeo, new T.MeshBasicMaterial({ color: new T.Color(hex), transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false }));
    m.scale.z = len; m.position.copy(a).lerp(b, 0.5); m.lookAt(b);
    F.scene.add(m); F.tracers.push({ m, life: 0.14 });
    const s = new T.Mesh(F.sparkGeo, new T.MeshBasicMaterial({ color: new T.Color(hex), transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false }));
    s.position.copy(b); F.scene.add(s); F.sparks.push({ m: s, life: 0.25 });
  },
  clientInput(V, dt, inp) {
    const F = V.fps; if (!F) return null;
    const g = V.g || {}, me = V.meIdx;
    if (me < 0) return null;
    const pl = g.pl && g.pl[me];
    const alive = !pl || pl[1] === 1;
    // respawn teleport
    if (pl && pl[7] !== F.rsq) { F.rsq = pl[7]; F.me.x = pl[8]; F.me.z = pl[9]; F.me.a = this.faceOpen(F.me.x, F.me.z); F.me.p = 0; }
    // look
    const LK = lookPrefs(), sens = 0.0024 * LK.s;
    F.me.a -= F.look.dx * sens * (LK.ix ? -1 : 1); F.me.p = clamp(F.me.p - F.look.dy * sens * (LK.iy ? -1 : 1), -1.2, 1.2);
    F.look.dx = 0; F.look.dy = 0;
    const playing = V.h.ph === "play";
    if (!playing && document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
    if (alive && playing) {
      let fx = -inp.dy, sx = inp.dx;
      if (F.stick) { const vx = F.stick.x - F.stick.bx, vy = F.stick.y - F.stick.by, d = Math.hypot(vx, vy); if (d > 6) { const k = Math.min(1, d / 55); sx = vx / d * k; fx = -vy / d * k; } }
      const sprint = KEYS.has("ShiftLeft") || KEYS.has("ShiftRight");
      const sp = (sprint ? 7.2 : 5.0) * dt;
      const sa = Math.sin(F.me.a), ca = Math.cos(F.me.a);
      // forward = (-sin a, -cos a) in our camera convention
      const mx = (-sa * fx + ca * sx) * sp, mz = (-ca * fx - sa * sx) * sp;
      fMove(F.me, mx, mz);
      F.bob += Math.hypot(mx, mz) * 2.2;
      // fire
      F.fireCd -= dt;
      const oc = pl && pl[6];
      if (F.firing && F.fireCd <= 0) { F.fireCd = oc ? 0.13 : 0.26; this.fire(V); }
    }
    const out = { x: +F.me.x.toFixed(2), z: +F.me.z.toFixed(2), a: +F.me.a.toFixed(2), q: F.rsq, sh: F.lastShot || 0, hc: F.claims.slice(-6) };
    return out;
  },
  fire(V) {
    const F = V.fps, me = F.me;
    SFX.tone(1200, 0.08, "sawtooth", 0.035, -700);
    F.recoil = 1; if (F.flash) F.flash.intensity = 6;
    const cp = Math.cos(me.p), dir = [-Math.sin(me.a) * cp, Math.sin(me.p), -Math.cos(me.a) * cp];
    const h = Math.hypot(dir[0], dir[2]) || 1e-6;
    const ux = dir[0] / h, uz = dir[2] / h;
    // walls (2D) then floor/ceiling
    let tHoriz = fGridRay(me.x, me.z, ux, uz, 50);
    let t = tHoriz / h;
    if (dir[1] < -1e-4) t = Math.min(t, EYE / -dir[1]);
    if (dir[1] > 1e-4) t = Math.min(t, (3.4 - EYE) / dir[1]);
    // players
    let hitIdx = -1;
    V.ro.forEach((r, i) => {
      if (i === V.meIdx) return;
      const pl = V.g && V.g.pl && V.g.pl[i]; if (!pl || !pl[1]) return;
      const av = F.remote[i]; if (!av) return;
      // ray vs vertical cylinder radius 0.5, height 0..1.9
      const ox = me.x - av.x, oz = me.z - av.z;
      const a = dir[0] * dir[0] + dir[2] * dir[2], b = 2 * (ox * dir[0] + oz * dir[2]), c = ox * ox + oz * oz - 0.5 * 0.5;
      const disc = b * b - 4 * a * c; if (disc < 0) return;
      const th = (-b - Math.sqrt(disc)) / (2 * a); if (th <= 0 || th >= t) return;
      const y = EYE + dir[1] * th; if (y < 0 || y > 1.95) return;
      t = th; hitIdx = i;
    });
    const end = [me.x + dir[0] * t, EYE + dir[1] * t, me.z + dir[2] * t];
    const start = [me.x - Math.sin(me.a) * 0.6 + Math.cos(me.a) * 0.22, EYE - 0.18, me.z - Math.cos(me.a) * 0.6 - Math.sin(me.a) * 0.22];
    const hex = V.ro[V.meIdx].hex;
    this.addTracer(V, start, end, hex);
    F.shotN++; F.lastShot = [F.shotN, +end[0].toFixed(2), +end[1].toFixed(2), +end[2].toFixed(2)];
    if (hitIdx >= 0) { F.claims.push([++F.claimN, hitIdx]); F.hitT = 0.25; SFX.tone(1800, 0.06, "square", 0.05); }
  },
  draw(ctx, V, dt, t) {
    const F = V.fps; const g = V.g || {};
    ctx.clearRect(0, 0, W, H);
    if (!F) return;
    if (F.failed) { ctx.fillStyle = "#0a0b0d"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#f5f1e6"; ctx.font = "700 20px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText("3D isn't available in this browser. Try Chrome, Edge, Firefox or Safari.", W / 2, H / 2); return; }
    if (!F.ready) { ctx.fillStyle = "#0a0b0d"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#ffd23f"; ctx.font = "700 26px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.fillText("BOOTING DATA CENTER…", W / 2, H / 2); return; }
    this.render3d(V, dt, t);
    this.hud(ctx, V, dt, t);
  },
  render3d(V, dt, t) {
    const F = V.fps, T = THREE, g = V.g || {};
    const gc = $("#gameCanvas");
    const w = parseFloat(gc.style.width) || 960, h = parseFloat(gc.style.height) || 600;
    if (F.w !== w || F.h !== h) {
      F.w = w; F.h = h; F.renderer.setSize(w, h, false);
      Object.assign(F.cv.style, { width: w + "px", height: h + "px", left: gc.offsetLeft + "px", top: gc.offsetTop + "px" });
      F.cam.aspect = w / h; F.cam.updateProjectionMatrix();
    }
    F.cv.style.left = gc.offsetLeft + "px"; F.cv.style.top = gc.offsetTop + "px";
    // camera: me or spectate first alive player
    let cx = F.me.x, cz = F.me.z, ca = F.me.a, cp = F.me.p;
    const mypl = V.meIdx >= 0 && g.pl ? g.pl[V.meIdx] : null;
    const dead = mypl && !mypl[1];
    if (V.meIdx < 0) { const k = Math.floor(t / 8) % V.ro.length; const r = F.remote[k]; if (r) { cx = r.x + Math.sin(r.a) * 2.5; cz = r.z + Math.cos(r.a) * 2.5; ca = r.a; cp = -0.2; } }
    const bob = Math.sin(F.bob) * 0.04;
    F.cam.position.set(cx, (dead ? 0.6 : EYE) + bob, cz);
    F.cam.rotation.order = "YXZ"; F.cam.rotation.set(cp, ca, dead ? 0.4 : 0);
    // gun
    F.recoil = Math.max(0, F.recoil - dt * 8);
    F.gun.visible = V.meIdx >= 0 && !dead;
    F.gun.position.set(0.24 + Math.sin(F.bob * 0.5) * 0.01, -0.22 + Math.abs(Math.cos(F.bob * 0.5)) * 0.01, -0.48 + F.recoil * 0.06);
    F.gun.rotation.x = F.recoil * 0.12;
    F.flash.intensity = Math.max(0, F.flash.intensity - dt * 60);
    F.rackMat.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.25;
    // avatars
    V.ro.forEach((r, i) => {
      const av = F.avatars[i]; const pl = g.pl && g.pl[i];
      let x, z, a;
      if (r.b) { const b = g.bt && g.bt[i]; if (!b) return; [x, z, a] = b; }
      else { const inp = V.inputOf(i); if (inp && Number.isFinite(inp.x)) { x = inp.x; z = inp.z; a = inp.a || 0; } else { if (!av.init) return; x = av.x; z = av.z; a = av.a || 0; } }
      if (!av.init || Math.hypot(av.x - x, av.z - z) > 6) { av.x = x; av.z = z; av.init = true; }
      av.x = lerp(av.x, x, 0.3); av.z = lerp(av.z, z, 0.3); av.a = a;
      F.remote[i] = { x: av.x, z: av.z, a };
      av.grp.position.set(av.x, 0, av.z);
      const alive = !pl || pl[1];
      av.grp.visible = i !== V.meIdx && !!alive;
      av.spr.position.y = 1.0 + Math.sin(t * 6 + i) * 0.04;
      av.shield.visible = !!(pl && pl[5] > 0);
      // remote shots
      const shot = r.b ? (g.bs && g.bs[i]) : (V.inputOf(i) || {}).sh;
      if (Array.isArray(shot) && shot[0] !== F.shSeen[i]) {
        const first = F.shSeen[i] === undefined; F.shSeen[i] = shot[0];
        if (!first && i !== V.meIdx) {
          this.addTracer(V, [av.x - Math.sin(a) * 0.5, 1.2, av.z - Math.cos(a) * 0.5].map((v, k) => k === 1 ? v : v), [shot[1], shot[2], shot[3]], r.hex);
          const d = Math.hypot(av.x - F.me.x, av.z - F.me.z);
          if (d < 25) SFX.tone(1000, 0.06, "sawtooth", 0.02 * (1 - d / 25), -500);
        }
      }
    });
    // pickups
    (g.pk || []).forEach((on, k) => { const p = F.picks[k]; if (!p) return; p.mesh.visible = !!on; p.ring.visible = !!on; p.mesh.rotation.y = t * 2; p.mesh.position.y = 1 + Math.sin(t * 3 + k) * 0.12; });
    // tracers/sparks
    for (const o of F.tracers) { o.life -= dt; o.m.material.opacity = Math.max(0, o.life / 0.14); if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
    F.tracers = F.tracers.filter(o => o.life > 0);
    for (const o of F.sparks) { o.life -= dt; const k = Math.max(0, o.life / 0.25); o.m.material.opacity = k; o.m.scale.setScalar(1 + (1 - k) * 2.5); if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
    F.sparks = F.sparks.filter(o => o.life > 0);
    F.renderer.render(F.scene, F.cam);
  },
  hud(ctx, V, dt, t) {
    const F = V.fps, g = V.g || {};
    const me = V.meIdx, pl = me >= 0 && g.pl ? g.pl[me] : null;
    // events: kill feed, pickups, damage
    (g.kf || []).forEach(k => {
      if (k[2] <= F.kfSeen) return; F.kfSeen = k[2];
      const a = V.ro[k[0]], b = V.ro[k[1]];
      F.toast.push({ txt: (a ? a.n : "?") + "  ⟶  " + (b ? b.n : "?"), col: a ? a.hex : "#fff", life: 4 });
      if (k[0] === me) { FX.text(W / 2, H / 2 - 60, "PATCHED " + (b ? b.n : "") + "!", "#3ddc97", 1.2); SFX.play("right"); }
      if (k[1] === me) SFX.play("fall");
    });
    if (F.toast.length > 4) F.toast.splice(0, F.toast.length - 4);
    if (g.pev && g.pev[2] !== F.pevSeen) {
      F.pevSeen = g.pev[2];
      if (g.pev[0] === me) { const type = PICK_TYPES[g.pev[1] % PICK_TYPES.length]; FX.text(W / 2, H / 2 + 70, PICK_NAMES[type] + "!", type === "oc" ? "#ffd23f" : type === "heal" ? "#3ddc97" : "#4cc9f0", 1.2); SFX.play("pop"); }
    }
    if (pl) { if (pl[0] < F.lastHp && pl[1]) { F.hurtT = 0.4; SFX.play("bump"); } F.lastHp = pl[0]; }
    // hurt vignette
    F.hurtT = Math.max(0, F.hurtT - dt);
    if (F.hurtT > 0) { const gr = ctx.createRadialGradient(W / 2, H / 2, 150, W / 2, H / 2, 560); gr.addColorStop(0, "rgba(255,59,78,0)"); gr.addColorStop(1, "rgba(255,59,78," + (F.hurtT * 1.4) + ")"); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
    if (pl && pl[6]) { ctx.strokeStyle = "rgba(255,210,63,.5)"; ctx.lineWidth = 6; ctx.strokeRect(3, 3, W - 6, H - 6); }
    // crosshair
    if (me >= 0 && pl && pl[1]) {
      const cx = W / 2, cy = H / 2;
      ctx.strokeStyle = "rgba(245,241,230,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 5, cy); ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 12, cy); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 5); ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 12); ctx.stroke();
      F.hitT = Math.max(0, F.hitT - dt);
      if (F.hitT > 0) { ctx.strokeStyle = "rgba(255,107,87," + F.hitT * 4 + ")"; ctx.lineWidth = 3; ctx.beginPath(); for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(cx + sx * 8, cy + sy * 8); ctx.lineTo(cx + sx * 15, cy + sy * 15); } ctx.stroke(); }
    }
    // health + status
    if (pl) {
      const x = 24, y = H - 46;
      ctx.fillStyle = "rgba(11,14,32,.75)"; ctx.beginPath(); ctx.roundRect(x - 8, y - 30, 250, 62, 12); ctx.fill();
      ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText("INTEGRITY", x, y - 16);
      ctx.fillStyle = "rgba(245,241,230,.15)"; ctx.fillRect(x, y - 6, 200, 14);
      ctx.fillStyle = pl[0] > 60 ? "#3ddc97" : pl[0] > 30 ? "#ffd23f" : "#ff6b57"; ctx.fillRect(x, y - 6, 2 * pl[0], 14);
      ctx.fillStyle = "#f5f1e6"; ctx.font = "700 14px 'JetBrains Mono', monospace"; ctx.fillText(String(pl[0]), x + 208, y + 1);
      let sx = x; ctx.font = "700 10px 'JetBrains Mono', monospace";
      if (pl[5] > 0) { ctx.fillStyle = "#4cc9f0"; ctx.fillText("SHIELD ×" + pl[5], sx, y + 20); sx += 80; }
      if (pl[6]) { ctx.fillStyle = "#ffd23f"; ctx.fillText("OVERCLOCK", sx, y + 20); }
      // score
      ctx.fillStyle = "rgba(11,14,32,.75)"; ctx.beginPath(); ctx.roundRect(W - 150, H - 76, 128, 54, 12); ctx.fill();
      ctx.textAlign = "center"; ctx.fillStyle = "#ffd23f"; ctx.font = "700 26px 'Chakra Petch', sans-serif"; ctx.fillText(String(pl[3]), W - 86, H - 56);
      ctx.fillStyle = "#9da1a9"; ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillText("TAGS · FIRST TO " + this.GOAL, W - 86, H - 32);
      if (!pl[1]) {
        ctx.fillStyle = "rgba(11,14,32,.55)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center"; ctx.fillStyle = "#ff6b57"; ctx.font = "700 44px 'Chakra Petch', sans-serif"; ctx.fillText("PATCHED", W / 2, H / 2 - 20);
        ctx.fillStyle = "#f5f1e6"; ctx.font = "700 18px 'JetBrains Mono', monospace"; ctx.fillText("Rebooting… " + (pl[2] / 10).toFixed(1) + " s", W / 2, H / 2 + 24);
      }
    }
    // kill feed
    F.toast.forEach(o => o.life -= dt); F.toast = F.toast.filter(o => o.life > 0);
    F.toast.forEach((o, k) => {
      ctx.globalAlpha = Math.min(1, o.life);
      ctx.font = "700 13px Inter, sans-serif"; const w = ctx.measureText(o.txt).width + 20;
      ctx.fillStyle = "rgba(11,14,32,.75)"; ctx.beginPath(); ctx.roundRect(W - w - 16, 16 + k * 30, w, 24, 8); ctx.fill();
      ctx.fillStyle = o.col; ctx.fillRect(W - w - 16, 16 + k * 30, 4, 24);
      ctx.fillStyle = "#f5f1e6"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(o.txt, W - w - 4, 28 + k * 30);
    });
    ctx.globalAlpha = 1;
    // minimap
    const ms = 6, mx = 16, my = 16;
    ctx.fillStyle = "rgba(11,14,32,.7)"; ctx.fillRect(mx - 4, my - 4, FG * ms + 8, FG * ms + 8);
    FPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch === "#") { ctx.fillStyle = "rgba(76,201,240,.35)"; ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); } }));
    (g.pk || []).forEach((on, k) => { if (!on) return; const p = FPS_PICKS[k]; ctx.fillStyle = "#ffd23f"; ctx.fillRect(mx + p[0] / CS * ms - 1.5, my + p[1] / CS * ms - 1.5, 3, 3); });
    V.ro.forEach((r, i) => {
      const p = i === me ? { x: F.me.x, z: F.me.z, a: F.me.a } : F.remote[i]; if (!p) return;
      const pl2 = g.pl && g.pl[i]; if (pl2 && !pl2[1]) return;
      const px = mx + p.x / CS * ms, pz = my + p.z / CS * ms;
      ctx.fillStyle = r.hex; ctx.beginPath(); ctx.arc(px, pz, i === me ? 3.5 : 2.6, 0, Math.PI * 2); ctx.fill();
      if (i === me) { ctx.strokeStyle = "#f5f1e6"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, pz); ctx.lineTo(px - Math.sin(p.a) * 9, pz - Math.cos(p.a) * 9); ctx.stroke(); }
    });
    // stick indicator
    if (F.stick) {
      const s = APP.gameScale || 1, r = $("#gameCanvas").getBoundingClientRect();
      ctx.strokeStyle = "rgba(245,241,230,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc((F.stick.bx - r.left) / s, (F.stick.by - r.top) / s, 55 / s, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(245,241,230,.35)"; ctx.beginPath(); ctx.arc((F.stick.x - r.left) / s, (F.stick.y - r.top) / s, 22 / s, 0, Math.PI * 2); ctx.fill();
    }
    if (me >= 0 && V.h.ph === "play" && !document.pointerLockElement && !matchMedia("(pointer: coarse)").matches && t % 2 < 1.6 && !F.firedOnce) {
      ctx.textAlign = "center"; ctx.fillStyle = "#f5f1e6"; ctx.font = "700 15px Inter, sans-serif"; ctx.fillText("Click to lock your mouse and aim · Esc to release · I = invert up/down", W / 2, H - 20);
    }
    if (document.pointerLockElement) F.firedOnce = true;
  },
};
GAMES.frenzy = frenzy;
GAME_ORDER.push("frenzy");
