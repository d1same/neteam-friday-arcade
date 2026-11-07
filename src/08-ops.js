// ======================= NETEAM OPS: 3D tactical shooter (Red vs Blue rounds + free-for-all) =======================
// Map: "Neteam HQ". # wall, r red spawn (lobby), u blue spawn (NOC), a = site A (server room), b = site B (network closet)
const OPS_MAP = [
  "######################",
  "#aaaa...#.uuuu.#.bbbb#",
  "#aaaa...#.uuuu.#.bbbb#",
  "#aa##........#...##bb#",
  "#......####..#.......#",
  "###.##.#........###.##",
  "#....#.#.##.###.#....#",
  "#.##.....#.......###.#",
  "#.#..###.#.###.#.....#",
  "#...#.....#...#..#.#.#",
  "##.##.##.....##..#...#",
  "#.......#.###.......##",
  "#.###.#.#.....#.###..#",
  "#.#...#...#.#.#...#..#",
  "#...#.###.#.#.##.#.#.#",
  "#.#.#.....#......#...#",
  "###.###.####.##.###.##",
  "#.....#.........#....#",
  "#.###...rrrrrr....##.#",
  "#.....#.rrrrrr.#.....#",
  "#...#...rrrrrr...#...#",
  "######################",
];
const OG = OPS_MAP.length, OWH = 3.2;
const OPS_CELLS = { r: [], u: [], a: [], b: [], open: [] };
OPS_MAP.forEach((row, z) => [...row].forEach((ch, x) => { if (ch !== "#") OPS_CELLS.open.push([x, z]); if (OPS_CELLS[ch]) OPS_CELLS[ch].push([x, z]); }));
const cellC = ([x, z]) => [x * CS + CS / 2, z * CS + CS / 2];
const OPS_SITE = ["a", "b"].map(k => { const c = OPS_CELLS[k]; return [c.reduce((s, q) => s + q[0], 0) / c.length * CS + CS / 2, c.reduce((s, q) => s + q[1], 0) / c.length * CS + CS / 2]; });
function oWall(cx, cz) { if (cx < 0 || cz < 0 || cx >= OG || cz >= OG) return true; return OPS_MAP[cz][cx] === "#"; }
function oCh(x, z) { const cx = Math.floor(x / CS), cz = Math.floor(z / CS); return oWall(cx, cz) ? "#" : OPS_MAP[cz][cx]; }
function oSolid(x, z) { return oWall(Math.floor(x / CS), Math.floor(z / CS)); }
function oBlocked(x, z, r = PR) { return oSolid(x - r, z - r) || oSolid(x + r, z - r) || oSolid(x - r, z + r) || oSolid(x + r, z + r); }
function oMove(p, dx, dz) { if (!oBlocked(p.x + dx, p.z)) p.x += dx; if (!oBlocked(p.x, p.z + dz)) p.z += dz; }
function oRay(ox, oz, dx, dz, maxT) {
  let cx = Math.floor(ox / CS), cz = Math.floor(oz / CS);
  const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(CS / dx) : Infinity, tdz = dz !== 0 ? Math.abs(CS / dz) : Infinity;
  let tmx = dx !== 0 ? ((dx > 0 ? (cx + 1) * CS - ox : ox - cx * CS) / Math.abs(dx)) : Infinity;
  let tmz = dz !== 0 ? ((dz > 0 ? (cz + 1) * CS - oz : oz - cz * CS) / Math.abs(dz)) : Infinity;
  let t = 0;
  for (let k = 0; k < 220 && t < maxT; k++) {
    if (tmx < tmz) { cx += sx; t = tmx; tmx += tdx; } else { cz += sz; t = tmz; tmz += tdz; }
    if (oWall(cx, cz)) return Math.min(t, maxT);
  }
  return maxT;
}
function oLOS(ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz); if (d < 0.01) return true; return oRay(ax, az, dx / d, dz / d, d) >= d - 0.05; }
function oPath(sx, sz, tx, tz) {
  const start = sz * OG + sx, goal = tz * OG + tx; if (start === goal) return [];
  const prev = new Int16Array(OG * OG).fill(-1); prev[start] = start; const q = [start];
  for (let h = 0; h < q.length; h++) {
    const c = q[h]; if (c === goal) break; const x = c % OG, z = (c / OG) | 0;
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ax, nz = z + az; if (oWall(nx, nz)) continue; const n = nz * OG + nx; if (prev[n] !== -1) continue; prev[n] = c; q.push(n); }
  }
  if (prev[goal] === -1) return [];
  const out = []; for (let c = goal; c !== start; c = prev[c]) out.push([c % OG, (c / OG) | 0]); return out.reverse();
}
// weapons
const OW = [
  { id: "pistol", n: "Ping Pistol", short: "PISTOL", cost: 0, dmg: 26, hs: 2.3, rate: 0.28, mag: 12, rl: 1.5, spr: 0.01, mv: 0.035, range: 50, spd: 1, auto: false, kick: 0.018, col: "#f5f1e6", snd: [1100, 0.06] },
  { id: "smg", n: "Packet SMG", short: "SMG", cost: 1200, dmg: 19, hs: 1.8, rate: 0.085, mag: 30, rl: 2.0, spr: 0.028, mv: 0.02, range: 38, spd: 1, auto: true, kick: 0.008, col: "#4cc9f0", snd: [1500, 0.04] },
  { id: "rifle", n: "Fiber Rifle", short: "RIFLE", cost: 2700, dmg: 31, hs: 2.7, rate: 0.105, mag: 30, rl: 2.4, spr: 0.012, mv: 0.06, range: 75, spd: 0.93, auto: true, kick: 0.012, col: "#ffd23f", snd: [700, 0.07] },
  { id: "sniper", n: "Zero-Day Sniper", short: "SNIPER", cost: 4200, dmg: 105, hs: 2, rate: 1.3, mag: 5, rl: 3.0, spr: 0.0015, mv: 0.12, range: 120, spd: 0.86, auto: false, kick: 0.05, col: "#ff7ac6", snd: [300, 0.18], scope: true },
];
const ARMOR_COST = 650;
const TEAM = [{ n: "Red Team", short: "RED", hex: "#ff4d5e", sub: "Attackers · pen testers", cols: [0, 6, 5, 1, 7] }, { n: "Blue Team", short: "BLUE", hex: "#3fa9ff", sub: "Defenders · SOC", cols: [3, 8, 4, 2, 9] }];
const OPS_ANN = ["", "Red Team eliminated", "Blue Team eliminated", "Time ran out", "Payload defused", "Payload detonated"];
const OPS_EXTRA_BOTS = ["Kernel Bot", "Proxy Bot", "Daemon Bot", "Sudo Bot", "Root Bot", "Packet Bot", "Byte Bot", "Cron Bot", "Hash Bot", "Socket Bot"];

function makeOps(md) {
  const team = md === "team";
  return {
    id: team ? "breach" : "deathmatch",
    title: team ? "Breach Protocol" : "Zero-Day Deathmatch",
    tag: team ? "Red Team vs Blue Team · 3D" : "Free-for-all shooter · 3D",
    blurb: team
      ? "Round-based team shooter at Neteam HQ. Red Team pen testers plant a ransomware payload in the server room (A) or network closet (B). Blue Team SOC stops them or defuses it. One life per round, first team to 7 rounds wins."
      : "Everyone against everyone at Neteam HQ. Pick any weapon, respawn after 3 seconds. First to 25 eliminations, or the most after 5 minutes, wins.",
    how: team
      ? ["Buy phase: B opens the shop (SMG, rifle, sniper, armor)", "Red: hold E in site A or B for 3 s to plant · it blows in 40 s", "Blue: hold E on the payload for 5 s to defuse · or wipe the other team"]
      : ["1-4 switch weapons · R reload · right-click to scope the sniper", "Headshots do 2-3× damage", "Kills and deaths count for your score"],
    keys: team
      ? ["Click to aim · WASD · Shift walk", "Click fire · R reload · 1/2/Q swap", "E plant/defuse · B buy · Tab scores · F fullscreen"]
      : ["Click to aim · WASD · Shift walk", "Click fire · R reload · 1-4 weapons", "Right-click scope · Tab scores · F fullscreen"],
    rec: { label: "Most eliminations", better: "max", fmt: v => v + " elims" },
    custom3d: true, md,
    BUY: 9, ROUND: 105, POST: 5, BOMB: 40, PLANT: 3, DEFUSE: 5, WIN: 7, DUR: 300, GOAL: 25,
    fill(nHumans) { if (!team) return Math.max(4, Math.min(8, nHumans)); const n = Math.max(6, nHumans + (nHumans % 2)); return Math.min(16, n); },

    // ---------------- host ----------------
    hostStart(S) {
      const n = S.ro.length;
      const P = S.ro.map((r, i) => ({ tm: 0, x: 0, z: 0, a: 0, hp: 100, alive: 1, k: 0, d: 0, hsk: 0, arm: 0, w: -1, cur: 0, cr: 800, rsq: 0, rx: 0, rz: 0, lastClaim: 0, lastHitT: -9, actT: 0, ax: 0, az: 0, rT: 0, bs: 0, shot: null,
        bot: r.b ? { path: [], pT: 0, fT: 0.5, tgt: -1, react: 0, strafe: 1, sT: 0, boss: !!r.boss, goal: null, gT: 0 } : null }));
      if (team) {
        // humans alternate, bots fill the smaller side
        const cnt = [0, 0];
        S.ro.forEach((r, i) => { if (!r.b) { P[i].tm = cnt[0] <= cnt[1] ? 0 : 1; cnt[P[i].tm]++; } });
        S.ro.forEach((r, i) => { if (r.b) { P[i].tm = cnt[0] <= cnt[1] ? 0 : 1; cnt[P[i].tm]++; } });
        const used = [0, 0];
        S.ro.forEach((r, i) => { const t = P[i].tm, cols = TEAM[t].cols; r.col = cols[used[t]++ % cols.length]; r.hex = PALETTE[r.col]; });
      } else P.forEach((p, i) => { p.tm = i; p.w = 2; p.cur = 2; });
      S.g = { md, t: 0, rd: 0, ph: team ? "buy" : "live", pt: 0, sc: [0, 0], P, bomb: { st: 0, x: 0, z: 0, t: 0, site: 0 }, kf: [], kseq: 0, ann: null, aseq: 0, ls: [0, 0], over: false, rsite: 0 };
      if (team) this.startRound(S); else P.forEach((p, i) => this.spawnFFA(S, i, true));
    },
    say(S, a) { const g = S.g; g.ann = a.concat([++g.aseq]); },
    startRound(S) {
      const g = S.g; g.rd++; g.ph = "buy"; g.pt = this.BUY; g.bomb = { st: 0, x: 0, z: 0, t: 0, site: 0 }; g.rsite = Math.random() < 0.5 ? 0 : 1;
      const spots = [shuffle(OPS_CELLS.r.slice()), shuffle(OPS_CELLS.u.slice())], k = [0, 0];
      g.P.forEach((p, i) => {
        if (!p.alive || g.rd === 1) { p.w = -1; p.arm = 0; }
        const c = cellC(spots[p.tm][k[p.tm]++ % spots[p.tm].length]);
        p.x = p.rx = c[0] + (Math.random() - 0.5); p.z = p.rz = c[1] + (Math.random() - 0.5);
        p.a = p.tm === 0 ? Math.PI : 0; p.hp = 100; p.alive = 1; p.rsq++; p.actT = 0; p.cur = p.w >= 0 ? p.w : 0;
        if (p.bot) { p.bot.path = []; p.bot.goal = null; p.bot.tgt = -1; this.botBuy(p); p.bot.site = (i % 2); }
      });
      this.say(S, [1, g.rd]);
    },
    botBuy(p) {
      if (p.w < 0) { if (p.cr >= 2700 + (p.arm < 50 ? 650 : 0)) { p.cr -= 2700; p.w = 2; } else if (p.cr >= 4200 && Math.random() < 0.2) { p.cr -= 4200; p.w = 3; } else if (p.cr >= 1200 && Math.random() < 0.7) { p.cr -= 1200; p.w = 1; } }
      if (p.arm < 50 && p.cr >= ARMOR_COST) { p.cr -= ARMOR_COST; p.arm = 100; }
      p.cur = p.w >= 0 ? p.w : 0;
    },
    spawnFFA(S, i, first) {
      const g = S.g, p = g.P[i];
      const others = g.P.filter((q, j) => j !== i && q.alive);
      let best = null, bs = -1;
      for (let k = 0; k < 24; k++) { const c = cellC(OPS_CELLS.open[rint(0, OPS_CELLS.open.length - 1)]); const d = others.length ? Math.min(...others.map(q => Math.hypot(q.x - c[0], q.z - c[1]))) : Math.random() * 10; if (d > bs) { bs = d; best = c; } }
      p.x = p.rx = best[0]; p.z = p.rz = best[1]; p.a = Math.random() * Math.PI * 2; p.hp = 100; p.alive = 1; p.arm = 0; p.rsq++; p.actT = 0;
      if (p.bot) { p.bot.path = []; p.bot.tgt = -1; p.cur = p.w = [1, 2, 2, 3, 0][rint(0, 4)]; }
    },
    damage(S, tgt, from, wi, head) {
      const g = S.g, q = g.P[tgt], W0 = OW[wi] || OW[0];
      if (!q.alive) return;
      let dmg = W0.dmg * (head ? W0.hs : 1);
      if (q.arm > 0) { const ab = Math.min(q.arm, dmg * 0.45); q.arm -= ab; dmg -= ab; }
      q.hp -= dmg;
      if (q.hp <= 0) {
        q.hp = 0; q.alive = 0; q.d++; q.actT = 0; q.rT = 3;
        if (from >= 0 && from !== tgt) { const f = g.P[from]; f.k++; if (head) f.hsk++; f.cr = Math.min(9000, f.cr + 300); }
        g.kf.push([from, tgt, wi, head ? 1 : 0, ++g.kseq]); if (g.kf.length > 5) g.kf.shift();
      }
    },
    enemy(S, i, j) { const P = S.g.P; return i !== j && (team ? P[i].tm !== P[j].tm : true); },
    owns(S, p, wi) { return !team || wi === 0 || wi === p.w; },
    procAct(S, i, act, dt) {
      const g = S.g, p = g.P[i], b = g.bomb;
      if (!team || g.ph !== "live" || !p.alive || !act) { p.actT = 0; return; }
      const ch = oCh(p.x, p.z);
      const canPlant = p.tm === 0 && b.st === 0 && (ch === "a" || ch === "b");
      const canDefuse = p.tm === 1 && b.st === 1 && Math.hypot(p.x - b.x, p.z - b.z) < 1.9;
      if (!canPlant && !canDefuse) { p.actT = 0; return; }
      if (p.actT === 0) { p.ax = p.x; p.az = p.z; }
      if (Math.hypot(p.x - p.ax, p.z - p.az) > 0.6) { p.actT = 0; return; }
      p.actT += dt;
      if (canPlant && p.actT >= this.PLANT) {
        g.bomb = { st: 1, x: p.x, z: p.z, t: this.BOMB, site: ch === "a" ? 0 : 1 }; p.actT = 0; p.cr = Math.min(9000, p.cr + 300);
        this.say(S, [2, g.bomb.site]);
      } else if (canDefuse && p.actT >= this.DEFUSE) { b.st = 2; p.actT = 0; p.cr = Math.min(9000, p.cr + 300); }
    },
    endRound(S, win, why) {
      const g = S.g; g.sc[win]++; g.ph = "post"; g.pt = this.POST;
      g.ls[win] = 0; g.ls[1 - win] = Math.min(4, g.ls[1 - win] + 1);
      g.P.forEach(p => { p.cr = Math.min(9000, p.cr + (p.tm === win ? 3000 : 1400 + 500 * g.ls[1 - win])); p.actT = 0; });
      this.say(S, [3, win, why]);
    },
    hostTick(S, dt, inputs) {
      const g = S.g; g.t += dt; const P = g.P;
      if (team) { g.pt -= dt; if (g.ph === "buy" && g.pt <= 0) { g.ph = "live"; g.pt = this.ROUND; this.say(S, [4]); } else if (g.ph === "post" && g.pt <= 0) { if (g.sc[0] >= this.WIN || g.sc[1] >= this.WIN) g.over = true; else this.startRound(S); } }
      P.forEach((p, i) => {
        if (!p.alive) { if (!team) { p.rT -= dt; if (p.rT <= 0) this.spawnFFA(S, i); } return; }
        if (p.bot) { this.botTick(S, i, dt); return; }
        const inp = inputs[i]; if (!inp) return;
        if (Number.isFinite(inp.x) && Number.isFinite(inp.z) && inp.q === p.rsq && !(team && g.ph === "buy" && Math.hypot(inp.x - p.rx, inp.z - p.rz) > 1.5)) { p.x = clamp(inp.x, 0, OG * CS); p.z = clamp(inp.z, 0, OG * CS); p.a = +inp.a || 0; }
        if (Number.isInteger(inp.w) && OW[inp.w] && this.owns(S, p, inp.w)) p.cur = inp.w;
        // shop
        if (team && Array.isArray(inp.buy) && inp.buy[0] !== p.buySeq) {
          p.buySeq = inp.buy[0]; const it = inp.buy[1] | 0;
          if (g.ph === "buy" || (g.ph === "live" && this.ROUND - g.pt < 12)) {
            if (it >= 1 && it <= 3 && p.w !== it && p.cr >= OW[it].cost) { p.cr -= OW[it].cost; p.w = it; p.cur = it; }
            if (it === 4 && p.arm < 100 && p.cr >= ARMOR_COST) { p.cr -= ARMOR_COST; p.arm = 100; }
          }
        }
        // hit claims [id, target, head, weapon]
        if (Array.isArray(inp.hc) && g.ph === "live") {
          let mx = p.lastClaim;
          for (const c of inp.hc) {
            if (!Array.isArray(c) || !(c[0] > p.lastClaim)) continue;
            mx = Math.max(mx, c[0]);
            const tg = c[1] | 0, q = P[tg], wi = c[3] | 0, W0 = OW[wi];
            if (!q || !W0 || !q.alive || !this.enemy(S, i, tg) || !this.owns(S, p, wi)) continue;
            if (g.t - p.lastHitT < W0.rate * 0.55) continue;
            const d = Math.hypot(q.x - p.x, q.z - p.z); if (d > W0.range + 6) continue;
            if (!oLOS(p.x, p.z, q.x, q.z)) continue;
            p.lastHitT = g.t; this.damage(S, tg, i, wi, !!c[2]);
          }
          p.lastClaim = mx;
        }
        this.procAct(S, i, !!inp.act, dt);
      });
      if (!team) return;
      if (g.ph !== "live") return;
      const b = g.bomb;
      if (b.st === 1) {
        b.t -= dt;
        if (b.t <= 0) { b.st = 3; P.forEach((q, j) => { if (q.alive && Math.hypot(q.x - b.x, q.z - b.z) < 9) { q.alive = 0; q.hp = 0; q.d++; } }); this.endRound(S, 0, 5); return; }
      }
      if (b.st === 2) { this.endRound(S, 1, 4); return; }
      const alive = [0, 0]; P.forEach(p => { if (p.alive) alive[p.tm]++; });
      const has = [0, 0]; P.forEach(p => has[p.tm]++);
      if (has[1] && alive[1] === 0) { this.endRound(S, 0, 2); return; }
      if (has[0] && alive[0] === 0 && b.st !== 1) { this.endRound(S, 1, 1); return; }
      if (g.pt <= 0 && b.st === 0) { this.endRound(S, 1, 3); return; }
    },
    botTick(S, i, dt) {
      const g = S.g, p = g.P[i], b = p.bot;
      if (team && g.ph !== "live") return;
      const W0 = OW[p.cur] || OW[0];
      let tgt = -1, td = 1e9;
      g.P.forEach((q, j) => { if (!q.alive || !this.enemy(S, i, j)) return; const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < 42 && d < td && oLOS(p.x, p.z, q.x, q.z)) { td = d; tgt = j; } });
      if (tgt !== b.tgt) { b.tgt = tgt; b.react = (b.boss ? 0.25 : 0.4) + Math.random() * 0.35; }
      b.react -= dt; b.fT -= dt; b.pT -= dt;
      const speed = 4.6 * W0.spd;
      if (tgt >= 0) {
        const q = g.P[tgt];
        const want = Math.atan2(q.x - p.x, q.z - p.z);
        let da = ((want - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        p.a += clamp(da, -dt * 5.5, dt * 5.5);
        b.sT -= dt; if (b.sT <= 0) { b.strafe = Math.random() < 0.5 ? -1 : 1; b.sT = 0.5 + Math.random(); }
        const sx = Math.cos(p.a) * b.strafe, sz = -Math.sin(p.a) * b.strafe;
        const moving = p.cur !== 3;
        if (moving) oMove(p, sx * 0.6 * speed * dt, sz * 0.6 * speed * dt);
        if (b.react <= 0 && b.fT <= 0 && Math.abs(da) < 0.15) {
          b.fT = W0.rate * (1 + Math.random() * (W0.auto ? 1.4 : 0.6)) + (W0.auto ? 0 : 0.15);
          const acc = clamp((b.boss ? 0.62 : 0.5) - td * (p.cur === 3 ? 0.002 : 0.011) - (moving ? 0.06 : 0), 0.08, 0.8);
          const hit = Math.random() < acc, head = hit && Math.random() < (b.boss ? 0.22 : 0.14);
          const ang = p.a + (hit ? 0 : (Math.random() - 0.5) * 0.2);
          const dist = hit ? td : oRay(p.x, p.z, Math.sin(ang), Math.cos(ang), 60);
          p.shot = [++p.bs, +(p.x + Math.sin(ang) * dist).toFixed(2), +(hit ? (head ? 1.45 : 1.0) : 0.8 + Math.random()).toFixed(2), +(p.z + Math.cos(ang) * dist).toFixed(2), p.cur];
          if (hit) this.damage(S, tgt, i, p.cur, head);
        }
        return;
      }
      // objectives
      let goal = null, act = false;
      const bm = g.bomb;
      if (!team) {
        if (!b.goal || b.gT <= 0 || !b.path.length) { const others = g.P.filter((q, j) => j !== i && q.alive); b.goal = (others.length && Math.random() < 0.6) ? [Math.floor(others[rint(0, others.length - 1)].x / CS), Math.floor(others[rint(0, others.length - 1)].z / CS)] : OPS_CELLS.open[rint(0, OPS_CELLS.open.length - 1)]; b.gT = 6; b.path = []; }
        goal = b.goal;
      } else if (p.tm === 0) {
        if (bm.st === 0) {
          const ch = oCh(p.x, p.z), site = ["a", "b"][g.rsite];
          if (ch === site) { act = true; goal = null; }
          else { if (!b.goal || b.goalKind !== site) { const c = OPS_CELLS[site]; b.goal = c[rint(0, c.length - 1)]; b.goalKind = site; b.path = []; } goal = b.goal; }
        } else { if (!b.goal || b.gT <= 0) { const c = OPS_CELLS[["a", "b"][bm.site]]; b.goal = c[rint(0, c.length - 1)]; b.gT = 5; b.path = []; b.goalKind = "guard"; } goal = b.goal; }
      } else {
        if (bm.st === 1) {
          if (Math.hypot(p.x - bm.x, p.z - bm.z) < 1.5) { act = true; goal = null; }
          else { const bc = [Math.floor(bm.x / CS), Math.floor(bm.z / CS)]; if (!b.goal || b.goalKind !== "bomb") { b.goal = bc; b.goalKind = "bomb"; b.path = []; } goal = b.goal; if (!b.path.length && Math.floor(p.x / CS) === bc[0] && Math.floor(p.z / CS) === bc[1]) { const dx = bm.x - p.x, dz = bm.z - p.z, d = Math.hypot(dx, dz) || 1; oMove(p, dx / d * speed * dt, dz / d * speed * dt); } }
        } else { const site = ["a", "b"][b.site || 0]; if (!b.goal || b.gT <= 0 || b.goalKind !== site) { const c = OPS_CELLS[site]; b.goal = c[rint(0, c.length - 1)]; b.gT = 7 + Math.random() * 5; b.path = []; b.goalKind = site; } goal = b.goal; }
      }
      b.gT -= dt;
      this.procAct(S, i, act, dt);
      if (act || !goal) return;
      if ((!b.path.length || b.pT <= 0)) { b.path = oPath(Math.floor(p.x / CS), Math.floor(p.z / CS), goal[0], goal[1]); b.pT = 2.5; }
      const nx = b.path[0];
      if (nx) {
        const tx = nx[0] * CS + CS / 2, tz = nx[1] * CS + CS / 2, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
        if (d < 0.4) b.path.shift();
        else { const want = Math.atan2(dx, dz); let da = ((want - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; p.a += clamp(da, -dt * 6, dt * 6); const s = Math.min(d, speed * dt); oMove(p, dx / d * s, dz / d * s); }
      }
    },
    pack(S) {
      const g = S.g, b = g.bomb;
      return {
        md, rd: g.rd, ph: g.ph, pt: Math.max(0, Math.round(g.pt * 10)), sc: g.sc, bomb: [b.st, +b.x.toFixed(2), +b.z.toFixed(2), Math.max(0, Math.round(b.t * 10)), b.site],
        pl: g.P.map(p => [Math.max(0, Math.round(p.hp)), p.alive, p.tm, p.k, p.d, Math.round(p.arm), p.cur, p.rsq, +p.rx.toFixed(2), +p.rz.toFixed(2), p.cr, Math.round(p.actT * 10), p.w, Math.ceil(p.rT * 10), p.hsk]),
        bt: g.P.map(p => p.bot ? [+p.x.toFixed(2), +p.z.toFixed(2), +(p.a + Math.PI).toFixed(2)] : 0),
        bs: g.P.map(p => p.bot && p.shot ? p.shot : 0), kf: g.kf, ann: g.ann,
      };
    },
    timeLeft(S) { const g = S.g; if (!team) return (this.DUR - g.t) * 1000; return (g.bomb.st === 1 && g.ph === "live" ? g.bomb.t : g.pt) * 1000; },
    done(S) { const g = S.g; return team ? g.over : (g.t >= this.DUR || g.P.some(p => p.k >= this.GOAL)); },
    rank(S) {
      const g = S.g, win = g.sc[0] === g.sc[1] ? -1 : g.sc[0] > g.sc[1] ? 0 : 1;
      return g.P.map((p, i) => ({ i, v: p.k, de: p.d, w: team && p.tm === win ? 1 : 0, label: (team ? TEAM[p.tm].short + " · " : "") + p.k + " elim" + (p.k === 1 ? "" : "s") + " · " + p.d + " death" + (p.d === 1 ? "" : "s"), rec: p.k }))
        .sort((a, b) => (b.w - a.w) || (b.v - a.v) || (a.de - b.de));
    },
    chip(V, i) { const pl = V.g && V.g.pl && V.g.pl[i]; return pl ? pl[3] : 0; },

    cardArt(ctx, ro, t) {
      const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, team ? "#2a0d18" : "#0d1430"); bg.addColorStop(0.5, "#121633"); bg.addColorStop(1, team ? "#0b1d3a" : "#22103a");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // perspective corridor
      const vx = W / 2, vy = H * 0.44;
      ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 2;
      for (let k = -9; k <= 9; k++) { ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + k * 120, H); ctx.stroke(); }
      for (let k = 1; k < 8; k++) { const y = vy + (H - vy) * Math.pow(k / 8, 1.8); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      if (team) {
        const g1 = ctx.createRadialGradient(W * 0.2, H * 0.6, 10, W * 0.2, H * 0.6, 420); g1.addColorStop(0, "rgba(255,77,94,.45)"); g1.addColorStop(1, "rgba(255,77,94,0)"); ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
        const g2 = ctx.createRadialGradient(W * 0.8, H * 0.6, 10, W * 0.8, H * 0.6, 420); g2.addColorStop(0, "rgba(63,169,255,.45)"); g2.addColorStop(1, "rgba(63,169,255,0)"); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
        drawChar(ctx, ro[0].c, W * 0.2, H * 0.62, 120, { t, color: TEAM[0].hex, mood: "", look: 0.6 });
        drawChar(ctx, ro[1].c, W * 0.8, H * 0.62, 120, { t, color: TEAM[1].hex, look: -0.6, phase: 1 });
        // payload
        ctx.fillStyle = "#1a1d2e"; ctx.strokeStyle = "#0d1024"; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(W / 2 - 70, H * 0.62, 140, 90, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#200"; ctx.fillRect(W / 2 - 50, H * 0.62 + 16, 100, 34);
        ctx.fillStyle = Math.floor(t * 3) % 2 ? "#ff3b4e" : "#a01020"; ctx.font = "700 26px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("0:40", W / 2, H * 0.62 + 34);
        ctx.font = "400 64px Bungee, Impact, sans-serif"; ctx.fillStyle = "#ff4d5e"; ctx.fillText("RED", W * 0.27, H * 0.16); ctx.fillStyle = "#f5f1e6"; ctx.font = "400 36px Bungee, Impact, sans-serif"; ctx.fillText("VS", W / 2, H * 0.16); ctx.fillStyle = "#3fa9ff"; ctx.font = "400 64px Bungee, Impact, sans-serif"; ctx.fillText("BLUE", W * 0.73, H * 0.16);
      } else {
        drawChar(ctx, ro[1].c, W * 0.5, H * 0.58, 150, { t, color: ro[1].hex, mood: "shock" });
        drawChar(ctx, ro[2].c, W * 0.2, H * 0.66, 90, { t, color: ro[2].hex, phase: 1 });
        drawChar(ctx, ro[3].c, W * 0.82, H * 0.64, 100, { t, color: ro[3].hex, phase: 2 });
        ctx.strokeStyle = "#ff7ac6"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, 60, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W * 0.5 - 95, H * 0.5); ctx.lineTo(W * 0.5 - 30, H * 0.5); ctx.moveTo(W * 0.5 + 30, H * 0.5); ctx.lineTo(W * 0.5 + 95, H * 0.5); ctx.moveTo(W * 0.5, H * 0.5 - 95); ctx.lineTo(W * 0.5, H * 0.5 - 30); ctx.moveTo(W * 0.5, H * 0.5 + 30); ctx.lineTo(W * 0.5, H * 0.5 + 95); ctx.stroke();
        ctx.font = "400 56px Bungee, Impact, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffd23f"; ctx.fillText("FREE-FOR-ALL", W / 2, H * 0.15);
      }
      ctx.font = "400 30px Bungee, Impact, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "rgba(245,241,230,.8)"; ctx.fillText("3D", 24, H - 30);
    },

    // ---------------- client ----------------
    clientEnter(V) {
      const F = V.fps = { ready: false, failed: false, me: { x: OG * CS / 2, z: OG * CS / 2, a: 0, p: 0 }, rsq: -1, cur: team ? 0 : 2, last: 0, ammo: OW.map(w => w.mag), reloadT: 0, fireCd: 0, firing: false, latch: false, scoped: false, bloom: 0, kick: 0,
        shotN: 0, claimN: 0, claims: [], look: { dx: 0, dy: 0 }, stick: null, lookT: null, lastHp: 100, hurtT: 0, hitT: 0, hitHead: false, kfSeen: 0, annSeen: 0, ann: null, toasts: [], remote: {}, shSeen: {}, bob: 0, buySeq: 0, buyReq: null, act: false, tab: false, lastW: -1, prevPh: "", spec: 0 };
      loadThree().then(ok => { if (!ok) { F.failed = true; return; } if (APP.V === V) this.build(V); });
      this.bind(V);
    },
    clientExit(V) {
      const F = V.fps; if (!F) return;
      (F.unbind || []).forEach(f => f());
      if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
      if (F.renderer) { try { F.renderer.dispose(); F.renderer.forceContextLoss(); } catch (e) {} }
      [F.cv, F.setBtn, F.setPanel, F.shop, F.touch].forEach(el => el && el.remove());
      V.fps = null;
    },
    owned(V) { const pl = V.g && V.g.pl && V.g.pl[V.meIdx]; if (!team) return [0, 1, 2, 3]; const o = [0]; if (pl && pl[12] >= 0) o.unshift(pl[12]); return o; },
    switchTo(V, wi) {
      const F = V.fps; if (!F || !this.owned(V).includes(wi) || F.cur === wi) return;
      F.last = F.cur; F.cur = wi; F.reloadT = 0; F.scoped = false; F.fireCd = Math.max(F.fireCd, 0.35); F.swapT = 0.35; SFX.tone(500, 0.05, "square", 0.03);
    },
    reload(V) { const F = V.fps, W0 = OW[F.cur]; if (F.reloadT > 0 || F.ammo[F.cur] >= W0.mag) return; F.reloadT = W0.rl; F.scoped = false; SFX.tone(300, 0.08, "square", 0.04); SFX.tone(420, 0.06, "square", 0.04, 0, W0.rl * 0.7); },
    buy(V, it) { const F = V.fps; F.buyReq = [++F.buySeq, it]; SFX.play("blip"); },
    shopOpen(V, on) {
      const F = V.fps; if (!F || !F.shop) return;
      F.shop.hidden = !on;
      if (on && document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
      if (on) this.syncShop(V);
    },
    syncShop(V) {
      const F = V.fps, pl = V.g && V.g.pl && V.g.pl[V.meIdx]; if (!F || !F.shop || !pl) return;
      F.shop.querySelector("[data-cr]").textContent = "$" + pl[10].toLocaleString();
      F.shop.querySelectorAll("[data-it]").forEach(b => { const it = +b.dataset.it, cost = it === 4 ? ARMOR_COST : OW[it].cost, own = it === 4 ? pl[5] >= 100 : pl[12] === it; b.disabled = own || pl[10] < cost; b.classList.toggle("own", own); });
    },
    bind(V) {
      const F = V.fps, cv = $("#gameCanvas");
      const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); (F.unbind || (F.unbind = [])).push(() => el.removeEventListener(ev, fn, o)); };
      const coarse = matchMedia("(pointer: coarse)").matches;
      on(cv, "contextmenu", (e) => e.preventDefault());
      on(cv, "mousedown", (e) => {
        if (coarse) return;
        if (document.pointerLockElement !== cv) { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (er) {} F.dragLook = true; }
        if (e.button === 0) F.firing = true;
        if (e.button === 2 && OW[F.cur].scope) { F.scoped = !F.scoped; SFX.tone(900, 0.03, "square", 0.03); }
      });
      on(window, "mouseup", (e) => { if (e.button === 0) { F.firing = false; F.latch = false; } F.dragLook = false; });
      on(window, "mousemove", (e) => { if (document.pointerLockElement === cv || F.dragLook) { F.look.dx += e.movementX || 0; F.look.dy += e.movementY || 0; } });
      on(window, "wheel", (e) => { if (APP.view !== "game") return; const o = this.owned(V); const k = o.indexOf(F.cur); this.switchTo(V, o[(k + (e.deltaY > 0 ? 1 : o.length - 1)) % o.length]); }, { passive: true });
      on(window, "keydown", (e) => {
        if (APP.view !== "game" || (e.target && e.target.tagName === "INPUT")) return;
        if (e.code === "Tab") { F.tab = true; e.preventDefault(); }
        if (e.repeat) return;
        const shopOpen = F.shop && !F.shop.hidden;
        if (shopOpen && /^Digit[1-4]$/.test(e.code)) { this.buy(V, +e.code.slice(-1)); return; }
        if (e.code === "Space") { F.firing = true; e.preventDefault(); }
        if (e.code === "KeyR") this.reload(V);
        if (e.code === "KeyE") F.act = true;
        if (e.code === "KeyQ") this.switchTo(V, F.last);
        if (team && e.code === "Digit1") this.switchTo(V, this.owned(V)[0]);
        if (team && e.code === "Digit2") this.switchTo(V, 0);
        if (!team && /^Digit[1-4]$/.test(e.code)) this.switchTo(V, +e.code.slice(-1) - 1);
        if (team && (e.code === "KeyB")) this.shopOpen(V, !shopOpen);
        if (e.code === "Escape" && shopOpen) this.shopOpen(V, false);
        if (e.code === "KeyI") { const L = lookPrefs(); L.iy = !L.iy; saveLookPrefs(L); toast("Mouse look up/down: " + (L.iy ? "inverted" : "normal")); syncLookPanel(F); }
      });
      on(window, "keyup", (e) => { if (e.code === "Space") { F.firing = false; F.latch = false; } if (e.code === "KeyE") F.act = false; if (e.code === "Tab") F.tab = false; });
      // touch
      on(cv, "touchstart", (e) => {
        const r = cv.getBoundingClientRect();
        for (const t of e.changedTouches) {
          if (t.clientX - r.left < r.width * 0.42 && !F.stick) F.stick = { id: t.identifier, bx: t.clientX, by: t.clientY, x: t.clientX, y: t.clientY };
          else if (!F.lookT) F.lookT = { id: t.identifier, x: t.clientX, y: t.clientY };
        }
        e.preventDefault();
      }, { passive: false });
      on(cv, "touchmove", (e) => {
        for (const t of e.changedTouches) {
          if (F.stick && t.identifier === F.stick.id) { F.stick.x = t.clientX; F.stick.y = t.clientY; }
          if (F.lookT && t.identifier === F.lookT.id) { F.look.dx += (t.clientX - F.lookT.x) * 1.5; F.look.dy += (t.clientY - F.lookT.y) * 1.5; F.lookT.x = t.clientX; F.lookT.y = t.clientY; }
        }
        e.preventDefault();
      }, { passive: false });
      const tend = (e) => { for (const t of e.changedTouches) { if (F.stick && t.identifier === F.stick.id) F.stick = null; if (F.lookT && t.identifier === F.lookT.id) F.lookT = null; } };
      on(cv, "touchend", tend); on(cv, "touchcancel", tend);
      const box = $("#stagebox");
      if (coarse && V.meIdx >= 0) {
        const tc = document.createElement("div"); tc.className = "ops-touch";
        const mk = (txt, cls, down, up) => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = txt; b.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); down(); }, { passive: false }); if (up) b.addEventListener("touchend", (e) => { e.preventDefault(); up(); }); tc.append(b); return b; };
        mk("FIRE", "t-fire", () => { F.firing = true; }, () => { F.firing = false; F.latch = false; });
        mk("SCOPE", "t-scope", () => { if (OW[F.cur].scope) F.scoped = !F.scoped; });
        mk("R", "t-r", () => this.reload(V));
        mk("⇄", "t-swap", () => { const o = this.owned(V); this.switchTo(V, o[(o.indexOf(F.cur) + 1) % o.length]); });
        if (team) { mk("USE", "t-use", () => { F.act = true; }, () => { F.act = false; }); mk("BUY", "t-buy", () => this.shopOpen(V, F.shop.hidden)); }
        box.append(tc); F.touch = tc;
      }
      // shop
      if (team && V.meIdx >= 0) {
        const sh = document.createElement("div"); sh.className = "ops-shop"; sh.hidden = true;
        const head = document.createElement("div"); head.className = "sh-head"; head.innerHTML = "<b>NETEAM ARMORY</b><span data-cr>$0</span>";
        const grid = document.createElement("div"); grid.className = "sh-grid";
        [[1, OW[1].n, "Fast, short range"], [2, OW[2].n, "Accurate, deadly headshots"], [3, OW[3].n, "One shot · right-click to scope"], [4, "Kevlar vest", "Absorbs 45% damage"]].forEach(([it, n, d]) => {
          const b = document.createElement("button"); b.type = "button"; b.dataset.it = it;
          const cost = it === 4 ? ARMOR_COST : OW[it].cost;
          b.innerHTML = "<small>" + it + "</small><b></b><i></i><em>$" + cost.toLocaleString() + "</em>";
          b.querySelector("b").textContent = n; b.querySelector("i").textContent = d;
          b.addEventListener("click", () => this.buy(V, it));
          grid.append(b);
        });
        const foot = document.createElement("div"); foot.className = "sh-foot"; foot.textContent = "Press 1-4 or tap to buy · B or Esc to close · you keep your gun if you survive";
        const close = document.createElement("button"); close.type = "button"; close.className = "btn"; close.textContent = "Done"; close.addEventListener("click", () => this.shopOpen(V, false));
        sh.append(head, grid, foot, close); sh.addEventListener("mousedown", e => e.stopPropagation());
        box.append(sh); F.shop = sh;
      }
      // aim settings (shared with the other 3D game)
      const sb = document.createElement("button"); sb.type = "button"; sb.className = "look-btn"; sb.textContent = "⚙ Aim";
      const sp = document.createElement("div"); sp.className = "look-panel"; sp.hidden = true;
      sp.innerHTML = '<h4>Aim settings</h4><label><input type="checkbox" data-k="iy"> Invert up/down <small>(key I)</small></label><label><input type="checkbox" data-k="ix"> Invert left/right</label><label class="sl">Sensitivity <b data-v></b><input type="range" min="0.3" max="3" step="0.1" data-k="s"></label><button type="button" class="btn" data-close>Done</button>';
      sb.addEventListener("click", (e) => { e.stopPropagation(); if (document.pointerLockElement) try { document.exitPointerLock(); } catch (er) {} sp.hidden = !sp.hidden; syncLookPanel(F); });
      sp.addEventListener("mousedown", (e) => e.stopPropagation());
      sp.addEventListener("input", (e) => { const k = e.target.dataset.k; if (!k) return; const L = lookPrefs(); L[k] = k === "s" ? clamp(+e.target.value || 1, 0.3, 3) : e.target.checked; saveLookPrefs(L); syncLookPanel(F); });
      sp.querySelector("[data-close]").addEventListener("click", () => { sp.hidden = true; });
      box.append(sb, sp); F.setBtn = sb; F.setPanel = sp;
    },
    clientInput(V, dt, inp) {
      const F = V.fps; if (!F) return null;
      const g = V.g || {}, me = V.meIdx; if (me < 0) return null;
      const pl = g.pl && g.pl[me];
      const alive = !pl || pl[1] === 1;
      if (pl && pl[7] !== F.rsq) { // (re)spawn
        F.rsq = pl[7]; F.me.x = pl[8]; F.me.z = pl[9]; F.me.p = 0; F.ammo = OW.map(w => w.mag); F.reloadT = 0; F.scoped = false;
        F.me.a = team ? (pl[2] === 0 ? 0 : Math.PI) : Math.random() * 6.28;
        if (team) { F.cur = pl[12] >= 0 ? pl[12] : 0; } else if (pl[6] >= 0) F.cur = F.cur;
      }
      if (team && pl && pl[12] !== F.lastW) { if (pl[12] >= 0 && F.lastW !== -9) { F.cur = pl[12]; F.ammo[pl[12]] = OW[pl[12]].mag; } F.lastW = pl[12]; }
      if (!this.owned(V).includes(F.cur)) F.cur = this.owned(V)[0];
      // phase changes
      if (g.ph !== F.prevPh) { if (team && g.ph === "buy" && alive && !matchMedia("(pointer: coarse)").matches) this.shopOpen(V, true); if (g.ph !== "buy" && F.shop && !F.shop.hidden) this.shopOpen(V, false); F.prevPh = g.ph; }
      if (F.shop && !F.shop.hidden) this.syncShop(V);
      // look
      const LK = lookPrefs(), sens = 0.0024 * LK.s * (F.scoped ? 0.3 : 1);
      F.me.a -= F.look.dx * sens * (LK.ix ? -1 : 1); F.me.p = clamp(F.me.p - F.look.dy * sens * (LK.iy ? -1 : 1), -1.25, 1.25);
      F.look.dx = 0; F.look.dy = 0;
      const playing = V.h.ph === "play";
      if (!playing && document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
      const W0 = OW[F.cur];
      F.bloom = Math.max(0, F.bloom - dt * 0.12); F.kick = Math.max(0, F.kick - dt * 6); F.swapT = Math.max(0, (F.swapT || 0) - dt);
      const frozen = team && g.ph === "buy";
      let moving = false;
      if (alive && playing && !frozen) {
        let fx = -inp.dy, sx = inp.dx;
        if (F.stick) { const vx = F.stick.x - F.stick.bx, vy = F.stick.y - F.stick.by, d = Math.hypot(vx, vy); if (d > 6) { const k = Math.min(1, d / 55); sx = vx / d * k; fx = -vy / d * k; } }
        const walk = KEYS.has("ShiftLeft") || KEYS.has("ShiftRight");
        const sp = 5.4 * W0.spd * (walk ? 0.5 : 1) * (F.scoped ? 0.55 : 1) * dt;
        const sa = Math.sin(F.me.a), ca = Math.cos(F.me.a);
        const mx = (-sa * fx + ca * sx) * sp, mz = (-ca * fx - sa * sx) * sp;
        oMove(F.me, mx, mz); moving = Math.hypot(mx, mz) > 0.02 * dt * 60 * 0.05 && Math.hypot(fx, sx) > 0.2;
        F.bob += Math.hypot(mx, mz) * 2.4;
        F.moving = moving && !walk;
      } else F.moving = false;
      // weapon
      if (F.reloadT > 0) { F.reloadT -= dt; if (F.reloadT <= 0) { F.reloadT = 0; F.ammo[F.cur] = W0.mag; } }
      F.fireCd -= dt;
      const canFire = alive && playing && !(team && g.ph !== "live") && (!F.shop || F.shop.hidden);
      if (canFire && F.firing && F.fireCd <= 0 && F.reloadT <= 0 && !(F.latch && !W0.auto)) {
        if (F.ammo[F.cur] > 0) { F.fireCd = W0.rate; F.latch = true; this.fire(V); F.ammo[F.cur]--; if (F.ammo[F.cur] === 0) this.reload(V); }
        else { this.reload(V); F.latch = true; }
      }
      const act = F.act && alive;
      const out = { x: +F.me.x.toFixed(2), z: +F.me.z.toFixed(2), a: +F.me.a.toFixed(2), q: F.rsq, w: F.cur, sh: F.lastShot || 0, hc: F.claims.slice(-6), act: act ? 1 : 0 };
      if (F.buyReq) out.buy = F.buyReq;
      return out;
    },
    fire(V) {
      const F = V.fps, me = F.me, W0 = OW[F.cur];
      SFX.noise(W0.id === "sniper" ? 0.25 : 0.09, W0.id === "sniper" ? 0.16 : 0.07, W0.snd[0] * 2); SFX.tone(W0.snd[0], W0.snd[1], "sawtooth", 0.03, -W0.snd[0] * 0.5);
      F.kick = 1; if (F.flash) F.flash.intensity = 7;
      let spread = W0.spr + (F.moving ? W0.mv : 0) + F.bloom;
      if (W0.scope && !F.scoped) spread = 0.07 + (F.moving ? W0.mv : 0);
      F.bloom = Math.min(0.06, F.bloom + (W0.auto ? 0.006 : 0.012));
      const ya = me.a + (Math.random() - 0.5) * 2 * spread, pa = me.p + (Math.random() - 0.5) * 2 * spread;
      me.p = clamp(me.p + W0.kick * (0.6 + Math.random() * 0.5), -1.25, 1.25); me.a += (Math.random() - 0.5) * W0.kick * 0.5;
      const cp = Math.cos(pa), dir = [-Math.sin(ya) * cp, Math.sin(pa), -Math.cos(ya) * cp];
      const h = Math.hypot(dir[0], dir[2]) || 1e-6;
      let t = oRay(me.x, me.z, dir[0] / h, dir[2] / h, W0.range) / h;
      if (dir[1] < -1e-4) t = Math.min(t, EYE / -dir[1]);
      if (dir[1] > 1e-4) t = Math.min(t, (OWH - EYE) / dir[1]);
      let hitIdx = -1, hitY = 0;
      V.ro.forEach((r, i) => {
        if (i === V.meIdx) return;
        const pl = V.g && V.g.pl && V.g.pl[i]; if (!pl || !pl[1]) return;
        const av = F.remote[i]; if (!av) return;
        const ox = me.x - av.x, oz = me.z - av.z;
        const a = dir[0] * dir[0] + dir[2] * dir[2], b = 2 * (ox * dir[0] + oz * dir[2]), c = ox * ox + oz * oz - 0.45 * 0.45;
        const disc = b * b - 4 * a * c; if (disc < 0) return;
        const th = (-b - Math.sqrt(disc)) / (2 * a); if (th <= 0 || th >= t) return;
        const y = EYE + dir[1] * th; if (y < 0.25 || y > 1.75) return;
        t = th; hitIdx = i; hitY = y;
      });
      const end = [me.x + dir[0] * t, EYE + dir[1] * t, me.z + dir[2] * t];
      const start = [me.x - Math.sin(me.a) * 0.6 + Math.cos(me.a) * 0.2, EYE - 0.16, me.z - Math.cos(me.a) * 0.6 - Math.sin(me.a) * 0.2];
      this.addTracer(V, start, end, W0.col, hitIdx < 0);
      F.shotN++; F.lastShot = [F.shotN, +end[0].toFixed(2), +end[1].toFixed(2), +end[2].toFixed(2), F.cur];
      if (hitIdx >= 0) {
        const pls = V.g.pl, mine = pls[V.meIdx];
        const friendly = team && pls[hitIdx][2] === mine[2];
        if (!friendly) { const head = hitY > 1.22; F.claims.push([++F.claimN, hitIdx, head ? 1 : 0, F.cur]); F.hitT = 0.3; F.hitHead = head; SFX.tone(head ? 2400 : 1700, 0.06, "square", 0.05); }
      }
      if (W0.scope) F.scoped = false;
    },
    charTex(c, hex, name, ringHex) { return frenzy.charTex(c, hex, name); },
    build(V) {
      const F = V.fps; if (!F || F.ready) return;
      const T = THREE;
      const cv = document.createElement("canvas"); cv.className = "fps3d";
      Object.assign(cv.style, { position: "absolute", borderRadius: "10px", pointerEvents: "none" });
      $("#stagebox").insertBefore(cv, $("#gameCanvas")); F.cv = cv;
      let renderer;
      try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" }); } catch (e) { F.failed = true; return; }
      renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
      renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
      F.renderer = renderer;
      const scene = new T.Scene(); F.scene = scene;
      scene.background = new T.Color(0x0c1022); scene.fog = new T.Fog(0x141a36, 18, 70);
      const cam = new T.PerspectiveCamera(74, 16 / 10, 0.05, 160); F.cam = cam; scene.add(cam);
      scene.add(new T.HemisphereLight(0xdfe6ff, 0x3a2c40, 2.2));
      scene.add(new T.AmbientLight(0x8890c0, 1.1));
      const sun = new T.DirectionalLight(0xfff1dd, 1.3); sun.position.set(30, 50, 20); scene.add(sun);
      const mk = (w, h, fn) => { const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; };
      const size = OG * CS;
      // floors
      const carpet = mk(256, 256, (x, w, h) => { x.fillStyle = "#3a4268"; x.fillRect(0, 0, w, h); for (let i = 0; i < 2200; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.06)"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.strokeStyle = "rgba(255,255,255,.06)"; x.lineWidth = 2; x.strokeRect(0, 0, w, h); });
      carpet.wrapS = carpet.wrapT = T.RepeatWrapping; carpet.repeat.set(OG, OG);
      const floor = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshStandardMaterial({ map: carpet, roughness: 0.92, metalness: 0.02 }));
      floor.rotation.x = -Math.PI / 2; floor.position.set(size / 2, 0, size / 2); scene.add(floor);
      const tileTex = (base, line, letter, lcol) => mk(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); x.strokeStyle = line; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(40 + i * 58, 40 + j * 58, 4, 0, 7); x.fill(); } if (letter) { x.fillStyle = lcol; x.font = "400 150px Bungee, Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(letter, w / 2, h / 2 + 8); } });
      const zoneFloor = { a: tileTex("#2b3b58", "#4cc9f0"), b: tileTex("#2d4a44", "#3ddc97"), r: tileTex("#4a2430", "#ff4d5e"), u: tileTex("#1f3150", "#3fa9ff") };
      const zoneMat = {}; Object.keys(zoneFloor).forEach(k => zoneMat[k] = new T.MeshStandardMaterial({ map: zoneFloor[k], roughness: 0.5, metalness: 0.35 }));
      const tileGeo = new T.PlaneGeometry(CS, CS);
      ["a", "b", "r", "u"].forEach(k => { const cells = OPS_CELLS[k]; const im = new T.InstancedMesh(tileGeo, zoneMat[k], cells.length); const m4 = new T.Matrix4(), rot = new T.Matrix4().makeRotationX(-Math.PI / 2); cells.forEach(([x, z], i) => { m4.makeTranslation(x * CS + CS / 2, 0.012, z * CS + CS / 2).multiply(rot); im.setMatrixAt(i, m4); }); scene.add(im); });
      // big site letters on the floor
      ["A", "B"].forEach((L, k) => {
        const tex = mk(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = k ? "rgba(61,220,151,.85)" : "rgba(76,201,240,.85)"; x.font = "400 210px Bungee, Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(L, w / 2, h / 2 + 12); });
        const m = new T.Mesh(new T.PlaneGeometry(5, 5), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.position.set(OPS_SITE[k][0], 0.03, OPS_SITE[k][1]); scene.add(m);
      });
      // ceiling with light panels
      const ceilTex = mk(256, 256, (x, w, h) => { x.fillStyle = "#cfd3e0"; x.fillRect(0, 0, w, h); x.strokeStyle = "#9aa0b8"; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } x.fillStyle = "#ffffff"; x.fillRect(68, 68, 120, 56); });
      ceilTex.wrapS = ceilTex.wrapT = T.RepeatWrapping; ceilTex.repeat.set(OG, OG);
      const ceil = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshStandardMaterial({ map: ceilTex, emissiveMap: ceilTex, emissive: 0x9aa6d0, emissiveIntensity: 0.55, roughness: 0.9 }));
      ceil.rotation.x = Math.PI / 2; ceil.position.set(size / 2, OWH, size / 2); scene.add(ceil);
      // walls: office drywall vs server racks near the sites
      const wallTex = mk(256, 256, (x, w, h) => {
        const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#e7e9f2"); g.addColorStop(1, "#c8ccdc"); x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = "#1f6fd1"; x.fillRect(0, h * 0.52, w, 14); x.fillStyle = "#ffd23f"; x.fillRect(0, h * 0.52 + 14, w, 4);
        x.fillStyle = "#3a3f58"; x.fillRect(0, h - 18, w, 18);
        x.strokeStyle = "rgba(0,0,0,.08)"; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2);
      });
      const rackTex = mk(128, 256, (x, w, h) => { x.fillStyle = "#2e3558"; x.fillRect(0, 0, w, h); x.fillStyle = "#1a1f38"; x.fillRect(6, 6, w - 12, h - 12); for (let y = 12; y < h - 12; y += 20) { x.fillStyle = "#454f84"; x.fillRect(10, y, w - 20, 16); x.fillStyle = "#0a0c18"; for (let k = 0; k < 9; k++) x.fillRect(16 + k * 7, y + 4, 4, 8); } });
      const ledTex = mk(128, 256, (x, w, h) => { x.fillStyle = "#000"; x.fillRect(0, 0, w, h); const cols = ["#3ddc97", "#4cc9f0", "#ffd23f", "#ff6b57"]; for (let y = 12; y < h - 12; y += 20) for (let k = 0; k < 4; k++) { if (Math.random() < 0.35) continue; x.fillStyle = cols[(Math.random() * cols.length) | 0]; x.fillRect(84 + k * 8, y + 6, 4, 4); } });
      const nearSite = (x, z) => { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const r = OPS_MAP[z + dz]; const ch = r && r[x + dx]; if (ch === "a" || ch === "b") return true; } return false; };
      const walls = [[], [], [], []];
      OPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch !== "#") return; const border = x === 0 || z === 0 || x === OG - 1 || z === OG - 1; let open = false; for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!oWall(x + ax, z + az)) open = true; if (!open && border) return; walls[nearSite(x, z) && !border ? 1 : border ? 2 : [0, 0, 2, 3, 0, 2][(x * 7 + z * 3) % 6]].push([x, z]); }));
      const brickTex = mk(256, 256, (x, w, h) => {
        x.fillStyle = "#5a2e26"; x.fillRect(0, 0, w, h);
        for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) { const bx = c * 64 + (r % 2 ? 32 : 0), by = r * 16; const v = 0.75 + Math.random() * 0.35; x.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(70 * v)},${Math.round(52 * v)})`; x.fillRect(bx + 2, by + 2, 60, 12); }
        x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, h - 22, w, 22); x.fillStyle = "#2b2f45"; x.fillRect(0, h - 14, w, 14);
      });
      const glassTex = mk(256, 256, (x, w, h) => {
        const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#3a5f8c"); g.addColorStop(1, "#1d3352"); x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = "rgba(255,255,255,.18)"; x.beginPath(); x.moveTo(30, 0); x.lineTo(90, 0); x.lineTo(20, h); x.lineTo(-40, h); x.fill();
        x.fillStyle = "rgba(230,240,255,.55)"; x.fillRect(0, h * 0.45, w, 30); x.fillStyle = "#1f6fd1"; x.font = "400 22px Bungee, Impact, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NETEAM", w / 2, h * 0.45 + 16);
        x.fillStyle = "#9aa0b8"; x.fillRect(0, 0, w, 8); x.fillRect(0, h - 16, w, 16); x.fillRect(0, 0, 6, h); x.fillRect(w - 6, 0, 6, h);
      });
      const wallMat = [new T.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0.02 }), new T.MeshStandardMaterial({ map: brickTex, roughness: 0.95 }), new T.MeshStandardMaterial({ map: glassTex, roughness: 0.15, metalness: 0.6, emissiveMap: glassTex, emissive: 0x335577, emissiveIntensity: 0.25 })];
      const rackMat = new T.MeshStandardMaterial({ map: rackTex, emissiveMap: ledTex, emissive: 0xffffff, emissiveIntensity: 1.3, roughness: 0.6, metalness: 0.5 }); F.rackMat = rackMat;
      [wallMat[0], rackMat, wallMat[1], wallMat[2]].forEach((mat, k) => { const im = new T.InstancedMesh(new T.BoxGeometry(CS, OWH, CS), mat, walls[k].length); const m4 = new T.Matrix4(); walls[k].forEach(([x, z], i) => { m4.makeTranslation(x * CS + CS / 2, OWH / 2, z * CS + CS / 2); im.setMatrixAt(i, m4); }); scene.add(im); });
      // outer shell so nothing leaks past the border
      // signs and posters on walls facing open cells
      const sign = (txt, sub, x, z, ry, col, wdt = 3.4) => {
        const tex = mk(512, 140, (c, w, h) => { c.fillStyle = "#0b0e20"; c.fillRect(0, 0, w, h); c.strokeStyle = col; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = col; c.font = "400 50px Bungee, Impact, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, w / 2, 56); c.fillStyle = "#c8cde6"; c.font = "700 22px 'JetBrains Mono', monospace"; c.fillText(sub, w / 2, 108); });
        const m = new T.Mesh(new T.PlaneGeometry(wdt, wdt * 140 / 512), new T.MeshBasicMaterial({ map: tex })); m.position.set(x, 2.45, z); m.rotation.y = ry; scene.add(m);
      };
      const wallFace = (cx, cz, dx, dz) => [cx * CS + CS / 2 - dx * (CS / 2 - 0.02) + 0, cz * CS + CS / 2 - dz * (CS / 2 - 0.02), Math.atan2(dx, dz)];
      // site A: wall north of cells (row 0) -> face south
      let f = wallFace(2, 1, 0, -1); sign("SITE A", "SERVER ROOM · DC-1", f[0], f[1], 0, "#4cc9f0");
      f = wallFace(18, 1, 0, -1); sign("SITE B", "NETWORK CLOSET", f[0], f[1], 0, "#3ddc97");
      f = wallFace(11, 1, 0, -1); sign("BLUE TEAM", "NOC · DEFENDERS", f[0], f[1], 0, "#3fa9ff");
      f = wallFace(10, 20, 0, 1); sign("RED TEAM", "LOBBY · ATTACKERS", f[0], f[1], Math.PI, "#ff4d5e");
      const poster = (lines, x, z, ry, bg, fg) => {
        const tex = mk(256, 320, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.textAlign = "center"; c.font = "400 30px Bungee, Impact, sans-serif"; lines.forEach((l, i) => c.fillText(l, w / 2, 80 + i * 46)); c.strokeStyle = fg; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20); });
        const m = new T.Mesh(new T.PlaneGeometry(1.1, 1.375), new T.MeshBasicMaterial({ map: tex })); m.position.set(x, 1.7, z); m.rotation.y = ry; scene.add(m);
      };
      // posters on a few corridor walls (cell + direction of the open side)
      [[["NETEAM", "SOLUTIONS", "SINCE 2001"], 7, 9, 1, 0, "#12162e", "#ffd23f"], [["THINK", "BEFORE", "YOU CLICK"], 13, 9, -1, 0, "#2a0d18", "#ff6b57"], [["PATCH", "TUESDAY", "IS SACRED"], 5, 13, 0, 1, "#0b1d3a", "#4cc9f0"], [["MIKE &", "PAVLOS", "FOUNDERS"], 9, 15, 0, -1, "#1a1530", "#ffd23f"], [["MFA", "OR IT", "DIDN'T HAPPEN"], 17, 12, 0, 1, "#102a22", "#3ddc97"]].forEach(([ls, cx, cz, dx, dz, bg, fg]) => {
        if (!oWall(cx + dx, cz + dz) || oWall(cx, cz)) return;
        const x = cx * CS + CS / 2 + dx * (CS / 2 - 0.03), z = cz * CS + CS / 2 + dz * (CS / 2 - 0.03);
        poster(ls, x, z, Math.atan2(-dx, -dz), bg, fg);
      });
      // lights
      [[OPS_SITE[0], 0x4cc9f0, 30], [OPS_SITE[1], 0x3ddc97, 30], [cellC([10, 19]), 0xff4d5e, 34], [cellC([11, 1]), 0x3fa9ff, 28], [cellC([10, 10]), 0xfff0d0, 26], [cellC([4, 13]), 0xfff0d0, 22], [cellC([17, 13]), 0xfff0d0, 22], [cellC([11, 6]), 0xffe0b0, 20]].forEach(([p, c, i]) => { const l = new T.PointLight(c, i, 22, 1.5); l.position.set(p[0], OWH - 0.3, p[1]); scene.add(l); });
      // desks along some open cells (decor, no collision: placed against walls)
      const deskMat = new T.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.7 }), monMat = new T.MeshStandardMaterial({ color: 0x111522, emissive: 0x2a5aa0, emissiveIntensity: 0.9 });
      let desks = 0;
      for (const [x, z] of OPS_CELLS.open) {
        if (desks > 14 || "abru".includes(OPS_MAP[z][x]) || (x * 7 + z * 13) % 5) continue;
        for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          if (!oWall(x + dx, z + dz)) continue;
          const g = new T.Group();
          const top = new T.Mesh(new T.BoxGeometry(2.2, 0.08, 0.7), deskMat); top.position.y = 0.75;
          const mon = new T.Mesh(new T.BoxGeometry(0.7, 0.42, 0.05), monMat); mon.position.set(0, 1.05, 0.15);
          g.add(top, mon); g.position.set(x * CS + CS / 2 + dx * (CS / 2 - 0.4), 0, z * CS + CS / 2 + dz * (CS / 2 - 0.4)); g.rotation.y = Math.atan2(dx, dz);
          scene.add(g); desks++; break;
        }
      }
      // payload (bomb)
      const bomb = new T.Group();
      const bb = new T.Mesh(new T.BoxGeometry(0.6, 0.35, 0.45), new T.MeshStandardMaterial({ color: 0x23263a, metalness: 0.6, roughness: 0.4 }));
      bb.position.y = 0.18;
      const scr = new T.Mesh(new T.PlaneGeometry(0.4, 0.14), new T.MeshBasicMaterial({ color: 0xff2a3c })); scr.rotation.x = -Math.PI / 2; scr.position.set(0, 0.36, 0);
      const led = new T.PointLight(0xff2a3c, 0, 6, 2); led.position.y = 0.6;
      bomb.add(bb, scr, led); bomb.visible = false; scene.add(bomb); F.bomb = bomb; F.bombLed = led; F.bombScr = scr;
      // players
      F.avatars = V.ro.map((r, i) => {
        const grp = new T.Group();
        const mat = new T.SpriteMaterial({ map: frenzy.charTex(r.c, r.hex, r.n), transparent: true });
        const spr = new T.Sprite(mat); spr.scale.set(2.0, 2.5, 1); spr.position.y = 1.2;
        const ringHex = team ? TEAM[V.g && V.g.pl && V.g.pl[i] ? V.g.pl[i][2] : 0].hex : r.hex;
        const ring = new T.Mesh(new T.RingGeometry(0.42, 0.56, 28), new T.MeshBasicMaterial({ color: new T.Color(ringHex), transparent: true, opacity: 0.9, side: T.DoubleSide }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04;
        const gun = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.6), new T.MeshStandardMaterial({ color: 0x2a2f48 })); gun.position.set(0.32, 0.95, -0.15);
        grp.add(spr, ring, gun); scene.add(grp);
        return { grp, spr, ring, gun, x: 0, z: 0, init: false };
      });
      // view-model guns
      F.guns = OW.map((w0, k) => {
        const g = new T.Group();
        const dark = new T.MeshStandardMaterial({ color: 0x2b3150, metalness: 0.5, roughness: 0.45 });
        const acc = new T.MeshStandardMaterial({ color: new T.Color(w0.col), emissive: new T.Color(w0.col), emissiveIntensity: 0.35 });
        const L = [0.32, 0.55, 0.7, 0.95][k], hgt = [0.12, 0.13, 0.14, 0.12][k];
        const body = new T.Mesh(new T.BoxGeometry(0.09, hgt, L), dark);
        const stripe = new T.Mesh(new T.BoxGeometry(0.095, 0.025, L * 0.8), acc); stripe.position.y = hgt / 2 - 0.01;
        const barrel = new T.Mesh(new T.CylinderGeometry(0.022, 0.026, [0.12, 0.2, 0.3, 0.45][k], 10), dark); barrel.rotation.x = Math.PI / 2; barrel.position.z = -L / 2 - [0.06, 0.1, 0.15, 0.22][k];
        const grip = new T.Mesh(new T.BoxGeometry(0.07, 0.15, 0.08), dark); grip.position.set(0, -0.11, L * 0.22); grip.rotation.x = 0.3;
        g.add(body, stripe, barrel, grip);
        if (k >= 1) { const mag = new T.Mesh(new T.BoxGeometry(0.06, 0.16, 0.08), acc); mag.position.set(0, -0.12, -L * 0.1); mag.rotation.x = -0.15; g.add(mag); }
        if (k === 3) { const sc = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.3, 12), dark); sc.rotation.x = Math.PI / 2; sc.position.set(0, 0.1, -0.05); g.add(sc); }
        g.position.set(0.22, -0.2, -0.45); g.visible = false; cam.add(g);
        return g;
      });
      const flash = new T.PointLight(0xffe6a0, 0, 7, 2); flash.position.set(0.22, -0.12, -0.9); cam.add(flash); F.flash = flash;
      F.tracers = []; F.sparks = [];
      F.tracerGeo = new T.BoxGeometry(0.03, 0.03, 1); F.sparkGeo = new T.SphereGeometry(0.1, 8, 6);
      F.ready = true;
    },
    addTracer(V, from, to, hex, spark) {
      const F = V.fps, T = THREE; if (!F || !F.ready) return;
      const a = new T.Vector3(...from), b = new T.Vector3(...to); const len = a.distanceTo(b); if (len < 0.1) return;
      const m = new T.Mesh(F.tracerGeo, new T.MeshBasicMaterial({ color: new T.Color(hex), transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
      m.scale.z = len; m.position.copy(a).lerp(b, 0.5); m.lookAt(b); F.scene.add(m); F.tracers.push({ m, life: 0.09 });
      const s = new T.Mesh(F.sparkGeo, new T.MeshBasicMaterial({ color: new T.Color(spark ? "#ffe6a0" : "#ff3b4e"), transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false }));
      s.position.copy(b); F.scene.add(s); F.sparks.push({ m: s, life: 0.22 });
    },
    draw(ctx, V, dt, t) {
      const F = V.fps; ctx.clearRect(0, 0, W, H); if (!F) return;
      if (F.failed) { ctx.fillStyle = "#0b0e20"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#f5f1e6"; ctx.font = "700 20px Figtree, sans-serif"; ctx.textAlign = "center"; ctx.fillText("3D isn't available in this browser. Try Chrome, Edge, Firefox or Safari.", W / 2, H / 2); return; }
      if (!F.ready) { ctx.fillStyle = "#0b0e20"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#ffd23f"; ctx.font = "400 26px Bungee, Impact, sans-serif"; ctx.textAlign = "center"; ctx.fillText("LOADING NETEAM HQ…", W / 2, H / 2); return; }
      this.render3d(V, dt, t);
      this.hud(ctx, V, dt, t);
    },
    render3d(V, dt, t) {
      const F = V.fps, T = THREE, g = V.g || {};
      const gc = $("#gameCanvas"); const w = parseFloat(gc.style.width) || 960, h = parseFloat(gc.style.height) || 600;
      if (F.w !== w || F.h !== h) { F.w = w; F.h = h; F.renderer.setSize(w, h, false); Object.assign(F.cv.style, { width: w + "px", height: h + "px" }); F.cam.aspect = w / h; F.cam.updateProjectionMatrix(); }
      F.cv.style.left = gc.offsetLeft + "px"; F.cv.style.top = gc.offsetTop + "px";
      const fov = F.scoped ? 22 : 74; if (Math.abs(F.cam.fov - fov) > 0.1) { F.cam.fov = lerp(F.cam.fov, fov, 0.5); F.cam.updateProjectionMatrix(); }
      // avatars + positions
      V.ro.forEach((r, i) => {
        const av = F.avatars[i]; const pl = g.pl && g.pl[i];
        let x, z, a;
        if (r.b) { const b = g.bt && g.bt[i]; if (!b) return; [x, z, a] = b; }
        else { const inp = V.inputOf(i); if (inp && Number.isFinite(inp.x) && pl && inp.q === pl[7]) { x = inp.x; z = inp.z; a = inp.a || 0; } else if (pl) { x = av.init ? av.x : pl[8]; z = av.init ? av.z : pl[9]; a = av.a || 0; } else return; }
        if (!av.init || Math.hypot(av.x - x, av.z - z) > 5) { av.x = x; av.z = z; av.init = true; }
        av.x = lerp(av.x, x, 0.35); av.z = lerp(av.z, z, 0.35); av.a = a;
        F.remote[i] = { x: av.x, z: av.z, a };
        av.grp.position.set(av.x, 0, av.z); av.grp.rotation.y = a + Math.PI;
        av.grp.visible = i !== V.meIdx && !!(pl && pl[1]);
        av.spr.position.y = 1.2 + Math.sin(t * 7 + i) * 0.03;
        if (team && pl) av.ring.material.color.set(TEAM[pl[2]].hex);
        const shot = r.b ? (g.bs && g.bs[i]) : (V.inputOf(i) || {}).sh;
        if (Array.isArray(shot) && shot[0] !== F.shSeen[i]) {
          const first = F.shSeen[i] === undefined; F.shSeen[i] = shot[0];
          if (!first && i !== V.meIdx && pl && pl[1]) {
            const wcol = (OW[shot[4]] || OW[0]).col;
            this.addTracer(V, [av.x - Math.sin(a + Math.PI) * 0.6, 1.2, av.z - Math.cos(a + Math.PI) * 0.6], [shot[1], shot[2], shot[3]], wcol, true);
            const d = Math.hypot(av.x - F.me.x, av.z - F.me.z);
            if (d < 40) { const k = 1 - d / 40; SFX.noise(0.07, 0.05 * k, 1600); }
          }
        }
      });
      // camera: me, or spectate a teammate / killer
      const me = V.meIdx, mypl = me >= 0 && g.pl ? g.pl[me] : null;
      const dead = mypl && !mypl[1];
      let cx = F.me.x, cz = F.me.z, ca = F.me.a, cp = F.me.p, eye = EYE;
      if (me < 0 || (dead && team)) {
        const cands = V.ro.map((r, i) => i).filter(i => g.pl && g.pl[i] && g.pl[i][1] && (me < 0 || g.pl[i][2] === mypl[2]) && F.remote[i]);
        if (cands.length) { const k = cands[Math.floor(t / 6) % cands.length]; const r = F.remote[k]; cx = r.x + Math.sin(r.a) * 2.6; cz = r.z + Math.cos(r.a) * 2.6; ca = r.a; cp = -0.25; eye = 2.4; F.specName = V.ro[k].n; }
        else F.specName = "";
      } else if (dead) { eye = 0.5; }
      const bob = F.moving ? Math.sin(F.bob) * 0.035 : 0;
      F.cam.position.set(cx, eye + bob, cz); F.cam.rotation.order = "YXZ"; F.cam.rotation.set(cp + F.kick * 0.012, ca, dead && !team ? 0.5 : 0);
      F.guns.forEach((gm, k) => { gm.visible = k === F.cur && me >= 0 && !dead && !F.scoped; });
      const gm = F.guns[F.cur];
      if (gm) { const rl = F.reloadT > 0 ? Math.sin(Math.min(1, F.reloadT / OW[F.cur].rl) * Math.PI) : 0, sw = F.swapT ? F.swapT / 0.35 : 0; gm.position.set(0.22 + Math.sin(F.bob * 0.5) * 0.012, -0.2 - rl * 0.18 - sw * 0.25 + Math.abs(Math.cos(F.bob * 0.5)) * 0.008, -0.45 + F.kick * 0.07); gm.rotation.x = F.kick * 0.1 - rl * 0.6; }
      F.flash.intensity = Math.max(0, F.flash.intensity - dt * 70);
      F.rackMat.emissiveIntensity = 1.1 + Math.sin(t * 3) * 0.25;
      // bomb
      const b = g.bomb || [0];
      F.bomb.visible = b[0] === 1 || b[0] === 2;
      if (F.bomb.visible) { F.bomb.position.set(b[1], 0, b[2]); const rate = b[3] < 100 ? 8 : 3; const on = b[0] === 1 && Math.floor(t * rate) % 2 === 0; F.bombLed.intensity = on ? 9 : 0; F.bombScr.material.color.set(b[0] === 2 ? 0x3ddc97 : on ? 0xff2a3c : 0x550010); }
      if (b[0] === 1) { const k = b[3] < 100 ? 4 : 1; if (Math.floor(t * k * 2) !== F.beepK) { F.beepK = Math.floor(t * k * 2); if (F.beepK % 2 === 0) SFX.tone(1900, 0.05, "square", 0.025); } }
      for (const o of F.tracers) { o.life -= dt; o.m.material.opacity = Math.max(0, o.life / 0.09); if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
      F.tracers = F.tracers.filter(o => o.life > 0);
      for (const o of F.sparks) { o.life -= dt; const k = Math.max(0, o.life / 0.22); o.m.material.opacity = k; o.m.scale.setScalar(1 + (1 - k) * 2); if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
      F.sparks = F.sparks.filter(o => o.life > 0);
      F.renderer.render(F.scene, F.cam);
    },
    hud(ctx, V, dt, t) {
      const F = V.fps, g = V.g || {}, me = V.meIdx, pl = me >= 0 && g.pl ? g.pl[me] : null;
      const tm = pl ? pl[2] : 0;
      const box = (x, y, w, h, r = 12, a = 0.72) => { ctx.fillStyle = "rgba(9,11,26," + a + ")"; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
      ctx.textBaseline = "middle";
      // events
      (g.kf || []).forEach(k => {
        if (k[4] <= F.kfSeen) return; F.kfSeen = k[4];
        F.toasts.push({ k, life: 5 });
        if (k[0] === me && k[1] !== me) { FX.text(W / 2, H / 2 - 70, (k[3] ? "HEADSHOT · " : "") + "ELIMINATED " + (V.ro[k[1]] ? V.ro[k[1]].n : ""), k[3] ? "#ffd23f" : "#3ddc97", 1.1); SFX.play("right"); }
        if (k[1] === me) SFX.play("fall");
      });
      if (F.toasts.length > 5) F.toasts.splice(0, F.toasts.length - 5);
      if (g.ann && g.ann[g.ann.length - 1] !== F.annSeen) {
        F.annSeen = g.ann[g.ann.length - 1]; const a = g.ann;
        if (a[0] === 1) F.ann = { big: "ROUND " + a[1], sub: team ? (tm === 0 ? "Plant the payload in site A or B" : "Defend sites A and B") : "", col: "#f5f1e6", life: 3 };
        if (a[0] === 2) { F.ann = { big: "PAYLOAD PLANTED", sub: "Site " + (a[1] ? "B" : "A") + " · " + (tm === 1 ? "defuse it!" : "defend it!"), col: "#ff4d5e", life: 3 }; SFX.play("early"); }
        if (a[0] === 3) { const mine = pl && a[1] === tm; F.ann = { big: TEAM[a[1]].n.toUpperCase() + " WINS", sub: OPS_ANN[a[2]], col: TEAM[a[1]].hex, life: 4.5 }; SFX.play(mine ? "win" : "wrong"); if (a[2] === 5) SFX.play("boom"); }
        if (a[0] === 4) { F.ann = { big: "GO GO GO", sub: "", col: "#ffd23f", life: 1.6 }; SFX.play("go"); }
      }
      if (pl) { if (pl[0] < F.lastHp && pl[1]) { F.hurtT = 0.45; SFX.play("bump"); } F.lastHp = pl[0]; }
      F.hurtT = Math.max(0, F.hurtT - dt);
      if (F.hurtT > 0) { const gr = ctx.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 560); gr.addColorStop(0, "rgba(255,40,60,0)"); gr.addColorStop(1, "rgba(255,40,60," + F.hurtT * 1.3 + ")"); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
      const alive = pl && pl[1];
      // scope
      if (F.scoped && alive) {
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, H * 0.44, 0, Math.PI * 2, true); ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - H * 0.44, H / 2); ctx.lineTo(W / 2 + H * 0.44, H / 2); ctx.moveTo(W / 2, H / 2 - H * 0.44); ctx.lineTo(W / 2, H / 2 + H * 0.44); ctx.stroke();
        ctx.fillStyle = "#ff3b4e"; ctx.beginPath(); ctx.arc(W / 2, H / 2, 2, 0, 7); ctx.fill();
      } else if (alive) {
        const W0 = OW[F.cur]; const gap = 5 + (W0.spr + (F.moving ? W0.mv : 0) + F.bloom) * 380 * (W0.scope ? 3 : 1);
        ctx.strokeStyle = "rgba(160,255,200,.95)"; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(W / 2 - gap - 9, H / 2); ctx.lineTo(W / 2 - gap, H / 2); ctx.moveTo(W / 2 + gap, H / 2); ctx.lineTo(W / 2 + gap + 9, H / 2); ctx.moveTo(W / 2, H / 2 - gap - 9); ctx.lineTo(W / 2, H / 2 - gap); ctx.moveTo(W / 2, H / 2 + gap); ctx.lineTo(W / 2, H / 2 + gap + 9); ctx.stroke();
        ctx.fillStyle = "rgba(160,255,200,.95)"; ctx.fillRect(W / 2 - 1, H / 2 - 1, 2, 2);
      }
      F.hitT = Math.max(0, F.hitT - dt);
      if (F.hitT > 0 && alive) { ctx.strokeStyle = F.hitHead ? "rgba(255,210,63," + F.hitT * 3.3 + ")" : "rgba(255,255,255," + F.hitT * 3.3 + ")"; ctx.lineWidth = 3; ctx.beginPath(); for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(W / 2 + sx * 7, H / 2 + sy * 7); ctx.lineTo(W / 2 + sx * 15, H / 2 + sy * 15); } ctx.stroke(); }
      // top center: score / timer
      const tl = Math.max(0, (V.h.tl || 0) - V.age);
      if (team) {
        box(W / 2 - 150, 10, 300, 56, 14);
        ctx.textAlign = "center"; ctx.font = "400 30px Bungee, Impact, sans-serif";
        ctx.fillStyle = TEAM[0].hex; ctx.fillText(String((g.sc || [0, 0])[0]), W / 2 - 112, 38);
        ctx.fillStyle = TEAM[1].hex; ctx.fillText(String((g.sc || [0, 0])[1]), W / 2 + 112, 38);
        const b = g.bomb || [0];
        if (b[0] === 1 && g.ph === "live") { ctx.fillStyle = Math.floor(t * 4) % 2 ? "#ff4d5e" : "#ffd23f"; ctx.font = "700 24px 'JetBrains Mono', monospace"; ctx.fillText("💣 " + (b[3] / 10).toFixed(1), W / 2, 33); }
        else { ctx.fillStyle = g.ph === "buy" ? "#ffd23f" : "#f5f1e6"; ctx.font = "700 24px 'JetBrains Mono', monospace"; ctx.fillText(fmtTime(tl), W / 2, 33); }
        ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillStyle = "#a6acd0"; ctx.fillText("ROUND " + (g.rd || 1) + " · FIRST TO " + this.WIN + (g.ph === "buy" ? " · BUY PHASE" : ""), W / 2, 56);
        // alive pips
        const al = [[], []]; (g.pl || []).forEach(p => al[p[2]].push(p[1]));
        al.forEach((list, k) => list.forEach((a, j) => { ctx.fillStyle = a ? TEAM[k].hex : "rgba(255,255,255,.18)"; const x = k === 0 ? W / 2 - 162 - j * 13 : W / 2 + 162 + j * 13; ctx.beginPath(); ctx.roundRect(x - 4, 26, 8, 20, 3); ctx.fill(); }));
      } else {
        const ranked = (g.pl || []).map((p, i) => ({ i, k: p[3], d: p[4] })).sort((a, b) => b.k - a.k || a.d - b.d);
        const lead = ranked[0], myRank = ranked.findIndex(o => o.i === me) + 1;
        box(W / 2 - 160, 10, 320, 50, 14);
        ctx.textAlign = "center"; ctx.font = "700 22px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(fmtTime(tl), W / 2, 30);
        ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#a6acd0";
        ctx.fillText((lead ? "LEADER " + V.ro[lead.i].n.toUpperCase() + " " + lead.k : "") + "  ·  FIRST TO " + this.GOAL + (myRank ? "  ·  YOU #" + myRank : ""), W / 2, 50);
      }
      // announcements
      if (F.ann) {
        F.ann.life -= dt; const a = F.ann, k = Math.min(1, a.life * 2);
        ctx.globalAlpha = k; ctx.textAlign = "center";
        ctx.font = "400 46px Bungee, Impact, sans-serif"; ctx.lineWidth = 8; ctx.strokeStyle = "rgba(9,11,26,.85)"; ctx.strokeText(a.big, W / 2, H * 0.27); ctx.fillStyle = a.col; ctx.fillText(a.big, W / 2, H * 0.27);
        if (a.sub) { ctx.font = "700 18px Figtree, sans-serif"; ctx.strokeText(a.sub, W / 2, H * 0.27 + 40); ctx.fillStyle = "#f5f1e6"; ctx.fillText(a.sub, W / 2, H * 0.27 + 40); }
        ctx.globalAlpha = 1; if (a.life <= 0) F.ann = null;
      }
      // objective hints + progress
      if (team && pl && alive && g.ph === "live") {
        const b = g.bomb || [0], ch = oCh(F.me.x, F.me.z);
        let hint = "";
        if (tm === 0 && b[0] === 0 && (ch === "a" || ch === "b")) hint = "Hold E to plant the payload";
        if (tm === 1 && b[0] === 1 && Math.hypot(F.me.x - b[1], F.me.z - b[2]) < 1.9) hint = "Hold E to defuse";
        if (pl[11] > 0) {
          const need = tm === 0 ? this.PLANT : this.DEFUSE, k = Math.min(1, pl[11] / 10 / need);
          box(W / 2 - 160, H * 0.62, 320, 46, 12); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(W / 2 - 140, H * 0.62 + 28, 280, 8);
          ctx.fillStyle = tm === 0 ? TEAM[0].hex : TEAM[1].hex; ctx.fillRect(W / 2 - 140, H * 0.62 + 28, 280 * k, 8);
          ctx.textAlign = "center"; ctx.fillStyle = "#f5f1e6"; ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillText(tm === 0 ? "PLANTING PAYLOAD…" : "DEFUSING…", W / 2, H * 0.62 + 14);
        } else if (hint) { ctx.textAlign = "center"; ctx.font = "700 16px Figtree, sans-serif"; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(9,11,26,.8)"; ctx.strokeText(hint, W / 2, H * 0.64); ctx.fillStyle = "#ffd23f"; ctx.fillText(hint, W / 2, H * 0.64); }
      }
      if (team && pl && g.ph === "buy" && alive) { ctx.textAlign = "center"; ctx.font = "700 15px Figtree, sans-serif"; ctx.fillStyle = "#ffd23f"; ctx.fillText(F.shop && F.shop.hidden ? "Buy phase · press B to open the armory" : "", W / 2, H * 0.36); }
      // bottom-left: health/armor
      if (pl) {
        box(14, H - 66, 250, 52);
        ctx.textAlign = "left"; ctx.font = "400 30px Bungee, Impact, sans-serif"; ctx.fillStyle = pl[0] > 50 ? "#f5f1e6" : pl[0] > 25 ? "#ffd23f" : "#ff4d5e";
        ctx.fillText("✚ " + pl[0], 28, H - 39);
        ctx.fillStyle = "#4cc9f0"; ctx.fillText("◈ " + pl[5], 142, H - 39);
        ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(28, H - 22, 220, 4); ctx.fillStyle = "#3ddc97"; ctx.fillRect(28, H - 22, 2.2 * pl[0], 4);
        if (team) { box(14, H - 104, 120, 32, 10); ctx.font = "700 16px 'JetBrains Mono', monospace"; ctx.fillStyle = "#3ddc97"; ctx.fillText("$" + pl[10].toLocaleString(), 26, H - 88); }
        // bottom-right: weapon + ammo
        const W0 = OW[F.cur];
        box(W - 270, H - 66, 256, 52);
        ctx.textAlign = "right"; ctx.font = "400 30px Bungee, Impact, sans-serif"; ctx.fillStyle = F.ammo[F.cur] <= W0.mag * 0.25 ? "#ff6b57" : "#f5f1e6";
        ctx.fillText(F.reloadT > 0 ? "…" : String(F.ammo[F.cur]), W - 92, H - 39);
        ctx.font = "700 14px 'JetBrains Mono', monospace"; ctx.fillStyle = "#a6acd0"; ctx.fillText("/ " + W0.mag, W - 30, H - 36);
        ctx.textAlign = "left"; ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = W0.col; ctx.fillText(W0.n.toUpperCase(), W - 258, H - 23);
        const own = this.owned(V); let wx = W - 16; ctx.font = "700 11px 'JetBrains Mono', monospace"; for (let k = own.length - 1; k >= 0; k--) { const o = own[k], lab = (team ? (o === 0 ? "2 " : "1 ") : (o + 1) + " ") + OW[o].short, tw = ctx.measureText(lab).width + 14; box(wx - tw, H - 92, tw, 20, 6, o === F.cur ? 0.9 : 0.55); ctx.textAlign = "center"; ctx.fillStyle = o === F.cur ? OW[o].col : "#8a90b8"; ctx.fillText(lab, wx - tw / 2, H - 82); wx -= tw + 5; }
        if (F.reloadT > 0) { ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(W - 258, H - 60, 232, 4); ctx.fillStyle = "#ffd23f"; ctx.fillRect(W - 258, H - 60, 232 * (1 - F.reloadT / W0.rl), 4); }
      }
      // dead overlay
      if (pl && !alive) {
        ctx.fillStyle = "rgba(9,11,26,.35)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center"; ctx.font = "400 40px Bungee, Impact, sans-serif"; ctx.fillStyle = "#ff4d5e"; ctx.fillText("ELIMINATED", W / 2, H * 0.4);
        ctx.font = "700 16px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6";
        ctx.fillText(team ? (F.specName ? "Spectating " + F.specName + " · back next round" : "Back next round") : "Respawning in " + (pl[13] / 10).toFixed(1) + " s", W / 2, H * 0.4 + 40);
      }
      // kill feed
      F.toasts.forEach(o => o.life -= dt); F.toasts = F.toasts.filter(o => o.life > 0);
      F.toasts.forEach((o, k) => {
        const [a, b, wi, hs] = o.k, A = V.ro[a], B = V.ro[b]; if (!B) return;
        const pa = g.pl && g.pl[a], pb = g.pl && g.pl[b];
        const ca = team && pa ? TEAM[pa[2]].hex : A ? A.hex : "#fff", cb = team && pb ? TEAM[pb[2]].hex : B.hex;
        const mid = " " + (OW[wi] || OW[0]).short + (hs ? " ◎ " : " "), an = A && a !== b ? A.n : "💥", bn = B.n;
        ctx.font = "700 13px Figtree, sans-serif"; const wa = ctx.measureText(an).width, wm = ctx.measureText(mid).width, wb = ctx.measureText(bn).width, w = wa + wm + wb + 22;
        const y = 76 + k * 28, x = W - w - 14;
        ctx.globalAlpha = Math.min(1, o.life); box(x, y, w, 24, 8, 0.75);
        if (a === me || b === me) { ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.textAlign = "left"; ctx.fillStyle = ca; ctx.fillText(an, x + 11, y + 12); ctx.fillStyle = hs ? "#ffd23f" : "#a6acd0"; ctx.fillText(mid, x + 11 + wa, y + 12); ctx.fillStyle = cb; ctx.fillText(bn, x + 11 + wa + wm, y + 12);
        ctx.globalAlpha = 1;
      });
      // minimap
      const ms = 5.2, mx = 14, my = 14, mw = OG * ms;
      box(mx - 5, my - 5, mw + 10, mw + 10, 8, 0.7);
      OPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch === "#") { ctx.fillStyle = "rgba(170,180,230,.35)"; ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); } else if (ch === "a" || ch === "b") { ctx.fillStyle = ch === "a" ? "rgba(76,201,240,.25)" : "rgba(61,220,151,.25)"; ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); } }));
      ctx.font = "400 12px Bungee, Impact, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#4cc9f0"; ctx.fillText("A", mx + OPS_SITE[0][0] / CS * ms, my + OPS_SITE[0][1] / CS * ms); ctx.fillStyle = "#3ddc97"; ctx.fillText("B", mx + OPS_SITE[1][0] / CS * ms, my + OPS_SITE[1][1] / CS * ms);
      V.ro.forEach((r, i) => {
        const p = i === me ? { x: F.me.x, z: F.me.z, a: F.me.a } : F.remote[i]; if (!p) return;
        const q = g.pl && g.pl[i]; if (!q || !q[1]) return;
        if (i !== me && (!team || !pl || q[2] !== pl[2])) return;
        const px = mx + p.x / CS * ms, pz = my + p.z / CS * ms;
        ctx.fillStyle = team ? TEAM[q[2]].hex : r.hex; ctx.beginPath(); ctx.arc(px, pz, i === me ? 3.6 : 2.8, 0, 7); ctx.fill();
        if (i === me) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, pz); ctx.lineTo(px - Math.sin(p.a) * 9, pz - Math.cos(p.a) * 9); ctx.stroke(); }
      });
      const bm = g.bomb || [0]; if (bm[0] === 1) { ctx.fillStyle = Math.floor(t * 4) % 2 ? "#ff4d5e" : "#ffd23f"; ctx.fillRect(mx + bm[1] / CS * ms - 3, my + bm[2] / CS * ms - 3, 6, 6); }
      // scoreboard (Tab)
      if (F.tab) {
        box(W / 2 - 300, 80, 600, 40 + V.ro.length * 24, 14, 0.9);
        ctx.font = "700 12px 'JetBrains Mono', monospace"; ctx.fillStyle = "#a6acd0"; ctx.textAlign = "left"; ctx.fillText("PLAYER", W / 2 - 280, 100); ctx.textAlign = "right"; ctx.fillText("K", W / 2 + 130, 100); ctx.fillText("D", W / 2 + 180, 100); ctx.fillText(team ? "$" : "HS", W / 2 + 270, 100);
        const order = V.ro.map((r, i) => i).sort((a, b) => team ? (g.pl[a][2] - g.pl[b][2]) || (g.pl[b][3] - g.pl[a][3]) : (g.pl[b][3] - g.pl[a][3]));
        order.forEach((i, k) => { const r = V.ro[i], q = g.pl[i]; const y = 124 + k * 24; ctx.textAlign = "left"; ctx.fillStyle = team ? TEAM[q[2]].hex : r.hex; ctx.font = (i === me ? "800" : "600") + " 14px Figtree, sans-serif"; ctx.fillText((q[1] ? "" : "✖ ") + r.n + (r.b ? " (bot)" : ""), W / 2 - 280, y); ctx.textAlign = "right"; ctx.fillStyle = "#f5f1e6"; ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillText(String(q[3]), W / 2 + 130, y); ctx.fillText(String(q[4]), W / 2 + 180, y); ctx.fillText(team ? (!pl || q[2] === pl[2] ? "$" + q[10] : "—") : String(q[14]), W / 2 + 270, y); });
      }
      if (F.stick) { const s = APP.gameScale || 1, r = $("#gameCanvas").getBoundingClientRect(); ctx.strokeStyle = "rgba(245,241,230,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc((F.stick.bx - r.left) / s, (F.stick.by - r.top) / s, 55 / s, 0, 7); ctx.stroke(); ctx.fillStyle = "rgba(245,241,230,.35)"; ctx.beginPath(); ctx.arc((F.stick.x - r.left) / s, (F.stick.y - r.top) / s, 22 / s, 0, 7); ctx.fill(); }
      if (me >= 0 && V.h.ph === "play" && !document.pointerLockElement && !matchMedia("(pointer: coarse)").matches && (!F.shop || F.shop.hidden) && t % 2 < 1.6) {
        ctx.textAlign = "center"; ctx.font = "700 14px Figtree, sans-serif"; ctx.lineWidth = 4; ctx.strokeStyle = "rgba(9,11,26,.8)"; const s = "Click to lock your mouse · Esc to release · Tab scores · F fullscreen"; ctx.strokeText(s, W / 2, H - 86); ctx.fillStyle = "#f5f1e6"; ctx.fillText(s, W / 2, H - 86);
      }
    },
  };
}
GAMES.breach = makeOps("team");
GAMES.deathmatch = makeOps("ffa");
// the lobby now features only the 3D games; older games stay registered so past scores still show
GAME_ORDER.length = 0;
GAME_ORDER.push("breach", "deathmatch");
