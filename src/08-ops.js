// ======================= NETEAM OPS: 3D tactical shooter (Red vs Blue rounds + free-for-all) =======================
// Maps. # wall, r red spawn, u blue spawn, a = site A, b = site B. The host picks one sized to the player count.
const OPS_MAPS = {
  hq: { n: "Neteam HQ", theme: "office", sites: ["SERVER ROOM", "NETWORK CLOSET"], spawns: ["LOBBY", "NOC"], rows: [
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
  ] },
  farm: { n: "Server Farm", theme: "farm", sites: ["COLD AISLE", "HOT AISLE"], spawns: ["LOADING DOCK", "CONTROL ROOM"], rows: [
    "##################",
    "#aaaa......uuuuuu#",
    "#aaaa......uuuuuu#",
    "#..##..##.##..#..#",
    "#................#",
    "#................#",
    "#..##..##.##..#..#",
    "#.......##.......#",
    "#..##.#.##.......#",
    "#.......##.#.##..#",
    "#.......##.......#",
    "#..##..##.##..#..#",
    "#................#",
    "#................#",
    "#..##..##.##..#..#",
    "#rrrrrr......bbbb#",
    "#rrrrrr......bbbb#",
    "##################",
  ] },
  sand: { n: "Sandstorm District", theme: "desert", sites: ["MARKET", "OLD BAZAAR"], spawns: ["CANYON ROAD", "COMPOUND"], rows: [
    "##########################",
    "#aaaaaa###uuuuuu###bbbbbb#",
    "#aa#aaa...uuuuuu...bb#bbb#",
    "#aaaaaa...uuuuuu...bbbbbb#",
    "#aaa#aa..###..#####bbb#bb#",
    "#aaaaaa..###..#####bbbbbb#",
    "##....#..###..####....####",
    "##....#..###..####..##..##",
    "##..###..###....#...##..##",
    "##..###.............##..##",
    "##..###.......####..##..##",
    "##..#########.####..##..##",
    "##..######....####......##",
    "##..######....####.....###",
    "##.#########..#######..###",
    "##.##.........#######..###",
    "##..#..................###",
    "##..#..................###",
    "##..#.........#######..###",
    "##..#.........#######..###",
    "##..####..##..#######..###",
    "##..#####rrrrrrrr####..###",
    "##.......rrrrrrrr......###",
    "##.......rrrrrrrr......###",
    "#########rrrrrrrr#########",
    "##########################",
  ] },
  roof: { n: "Rooftop", theme: "roof", sites: ["HELIPAD", "WATER TOWER"], spawns: ["STAIRWELL", "ANTENNA FARM"], rows: [
    "########################",
    "#aaaaa...........uuuuuu#",
    "#aaaaa...........uuuuuu#",
    "#aaaaa...##............#",
    "#...##...##....##......#",
    "#...##.........##......#",
    "#......##..............#",
    "#......##.......##.....#",
    "#.........##....##.##..#",
    "#...##....##.......##..#",
    "#...##........##.......#",
    "#...........####.......#",
    "#....#.#..####..##..##.#",
    "#.##................##.#",
    "#.##..##...##....##....#",
    "#.....##...##....##....#",
    "#......................#",
    "#......................#",
    "#..##....##........##..#",
    "#..##....##....##..##..#",
    "#rrrrrr........##.bbbbb#",
    "#rrrrrr...........bbbbb#",
    "#rrrrrr...........bbbbb#",
    "########################",
  ] },
};
// small maps for small groups, big maps for big groups
function opsPickMap(n) { const pool = n <= 6 ? ["farm", "hq"] : n <= 10 ? ["hq", "sand", "roof"] : ["sand", "roof"]; return pool[Math.floor(Math.random() * pool.length)]; }
let OPS_ID = "", OPS_M = null, OPS_MAP = [], OG = 0, OPS_CELLS = null, OPS_SITE = null;
const OWH = 3.2;
function opsSetMap(id) {
  if (!OPS_MAPS[id]) id = "hq"; if (id === OPS_ID) return;
  OPS_ID = id; OPS_M = OPS_MAPS[id]; OPS_MAP = OPS_M.rows; OG = OPS_MAP.length;
  OPS_CELLS = { r: [], u: [], a: [], b: [], open: [] };
  OPS_MAP.forEach((row, z) => [...row].forEach((ch, x) => { if (ch !== "#") OPS_CELLS.open.push([x, z]); if (OPS_CELLS[ch]) OPS_CELLS[ch].push([x, z]); }));
  OPS_SITE = ["a", "b"].map(k => { const c = OPS_CELLS[k]; return [c.reduce((s, q) => s + q[0], 0) / c.length * CS + CS / 2, c.reduce((s, q) => s + q[1], 0) / c.length * CS + CS / 2]; });
}
opsSetMap("hq");
const cellC = ([x, z]) => [x * CS + CS / 2, z * CS + CS / 2];
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
// slot: 1 primary, 2 pistol, 3 knife. snd: sound profile. vm: view-model [length, height, barrel]
const OW = [
  { id: "pistol", n: "Ping Pistol", short: "PISTOL", slot: 2, cost: 0, dmg: 26, hs: 2.3, rate: 0.26, mag: 12, rl: 1.5, spr: 0.01, mv: 0.035, range: 50, spd: 1, auto: false, kick: 0.018, col: "#f5f1e6", snd: "pistol", kill: 300, vm: [0.32, 0.12, 0.12], d: "Free sidearm" },
  { id: "smg", n: "Packet SMG", short: "SMG", slot: 1, cost: 1200, dmg: 19, hs: 1.8, rate: 0.08, mag: 30, rl: 2.0, spr: 0.028, mv: 0.02, range: 38, spd: 1.04, auto: true, kick: 0.008, col: "#4cc9f0", snd: "smg", kill: 600, vm: [0.5, 0.13, 0.18], d: "Fast fire, run-and-gun" },
  { id: "rifle", n: "Fiber Rifle", short: "RIFLE", slot: 1, cost: 2700, dmg: 32, hs: 3.6, rate: 0.1, mag: 30, rl: 2.4, spr: 0.011, mv: 0.06, range: 75, spd: 0.93, auto: true, kick: 0.012, col: "#ffd23f", snd: "rifle", kill: 300, vm: [0.7, 0.14, 0.3], d: "One-tap headshots" },
  { id: "sniper", n: "Zero-Day Sniper", short: "SNIPER", slot: 1, cost: 4750, dmg: 115, hs: 2, rate: 1.4, mag: 5, rl: 3.4, spr: 0.0015, mv: 0.14, range: 120, spd: 0.84, auto: false, kick: 0.05, col: "#ff7ac6", snd: "sniper", kill: 100, scope: true, vm: [0.95, 0.12, 0.45], d: "One shot, one kill · scope" },
  { id: "knife", n: "Patch Knife", short: "KNIFE", slot: 3, cost: 0, dmg: 34, hs: 1, rate: 0.42, mag: 0, rl: 0, spr: 0, mv: 0, range: 2.3, spd: 1.1, auto: true, kick: 0, col: "#9da1a9", snd: "knife", kill: 1500, melee: true, vm: [0.28, 0.04, 0], d: "Always carried · stab from behind" },
  { id: "shotgun", n: "Root Shotgun", short: "SHOTGUN", slot: 1, cost: 1100, dmg: 16, hs: 1.5, rate: 0.85, mag: 7, rl: 3.0, spr: 0.075, mv: 0.02, range: 20, spd: 0.97, auto: false, kick: 0.04, col: "#ff6b57", snd: "shotgun", kill: 900, pel: 8, vm: [0.75, 0.13, 0.32], d: "Devastating up close" },
  { id: "deagle", n: "Kernel Magnum", short: "MAGNUM", slot: 2, cost: 700, dmg: 54, hs: 2.4, rate: 0.48, mag: 7, rl: 2.2, spr: 0.014, mv: 0.06, range: 60, spd: 0.98, auto: false, kick: 0.045, col: "#c084fc", snd: "heavy", kill: 300, vm: [0.38, 0.14, 0.14], d: "Heavy pistol, headshot kills" },
  { id: "carbine", n: "Proxy Carbine", short: "CARBINE", slot: 1, cost: 2100, dmg: 27, hs: 3.2, rate: 0.095, mag: 25, rl: 2.2, spr: 0.015, mv: 0.045, range: 65, spd: 0.97, auto: true, kick: 0.01, col: "#3ddc97", snd: "rifle", kill: 300, vm: [0.62, 0.13, 0.24], d: "Cheaper rifle" },
  { id: "lmg", n: "Botnet LMG", short: "LMG", slot: 1, cost: 5000, dmg: 30, hs: 2.4, rate: 0.088, mag: 100, rl: 5.0, spr: 0.026, mv: 0.06, range: 70, spd: 0.8, auto: true, kick: 0.009, col: "#ff9f1c", snd: "lmg", kill: 300, vm: [0.85, 0.17, 0.3], d: "100 rounds, very slow" },
  { id: "scout", n: "Spoof Scout", short: "SCOUT", slot: 1, cost: 1700, dmg: 76, hs: 2.6, rate: 1.15, mag: 10, rl: 2.8, spr: 0.002, mv: 0.05, range: 110, spd: 0.99, auto: false, kick: 0.04, col: "#9fd8ff", snd: "sniper", kill: 300, scope: true, vm: [0.85, 0.11, 0.38], d: "Light sniper, move fast" },
];
const OW_PRIMARY = [1, 5, 7, 2, 9, 3, 8], OW_PISTOL = [0, 6], KNIFE = 4, ARMOR_IT = 10;
const OW_BUY = [6, 1, 5, 7, 2, 9, 3, 8];
const ARMOR_COST = 650;
const TEAM = [{ n: "Red Team", short: "RED", hex: "#ff4d5e", sub: "Attackers · pen testers", cols: [0, 6, 5, 1, 7] }, { n: "Blue Team", short: "BLUE", hex: "#3fa9ff", sub: "Defenders · SOC", cols: [3, 8, 4, 2, 9] }];
// team colours: strong red/blue by default; colour-blind mode swaps red for orange and adds shapes (▲ red side, ■ blue side)
function opsColorBlind() { return !!(store("nfa-cb") || {}).on; }
function opsApplyTeamColors() { const cb = opsColorBlind(); TEAM[0].hex = cb ? "#ffa31a" : "#ff2d3f"; TEAM[1].hex = cb ? "#2f7dff" : "#1f8fff"; }
opsApplyTeamColors();
const OPS_ANN = ["", "Red Team eliminated", "Blue Team eliminated", "Time ran out", "Payload defused", "Payload detonated"];
const OPS_EXTRA_BOTS = ["Kernel Bot", "Proxy Bot", "Daemon Bot", "Sudo Bot", "Root Bot", "Packet Bot", "Byte Bot", "Cron Bot", "Hash Bot", "Socket Bot"];

function makeOps(md) {
  const team = md === "team";
  return {
    id: team ? "breach" : "deathmatch",
    title: team ? "Breach Protocol" : "Zero-Day Deathmatch",
    tag: team ? "Red Team vs Blue Team · 3D" : "Free-for-all shooter · 3D",
    blurb: team ? "Red plants the payload. Blue stops it. First to 7 rounds." : "Everyone for themselves. First to 25 wins.",
    how: [],
    keys: team ? ["WASD move", "Shift walk (silent)", "1 2 3 weapons", "E plant / defuse", "B buy"] : ["WASD move", "Shift walk (silent)", "1 2 3 weapons", "B loadout", "Right-click scope / stab"],
    rec: { label: "Most eliminations", better: "max", fmt: v => v + " elims" },
    custom3d: true, md,
    BUY: 9, ROUND: 105, POST: 5, BOMB: 40, PLANT: 3, DEFUSE: 5, WIN: 7, DUR: 300, GOAL: 25,
    fill(nHumans) { if (!team) return Math.max(4, Math.min(8, nHumans)); const n = Math.max(6, nHumans + (nHumans % 2)); return Math.min(16, n); },

    // ---------------- host ----------------
    hostStart(S) {
      const n = S.ro.length, mp = opsPickMap(n); opsSetMap(mp);
      const P = S.ro.map((r, i) => ({ tm: 0, x: 0, z: 0, a: 0, hp: 100, alive: 1, k: 0, d: 0, hsk: 0, as: 0, dmg: 0, pln: 0, dfs: 0, hb: {}, idle: 0, seen: 0, gone: 0, arm: 0, w: -1, cur: 0, cr: 800, rsq: 0, rx: 0, rz: 0, lastClaim: 0, lastHitT: -9, actT: 0, ax: 0, az: 0, rT: 0, bs: 0, shot: null,
        bot: r.b ? { path: [], pT: 0, fT: 0.5, tgt: -1, react: 0, strafe: 1, sT: 0, boss: !!r.boss, goal: null, gT: 0 } : null }));
      if (team) {
        // humans alternate, bots fill the smaller side
        const cnt = [0, 0];
        S.ro.forEach((r, i) => { if (!r.b) { P[i].tm = cnt[0] <= cnt[1] ? 0 : 1; cnt[P[i].tm]++; } });
        S.ro.forEach((r, i) => { if (r.b) { P[i].tm = cnt[0] <= cnt[1] ? 0 : 1; cnt[P[i].tm]++; } });
        const used = [0, 0];
        S.ro.forEach((r, i) => { const t = P[i].tm, cols = TEAM[t].cols; r.col = cols[used[t]++ % cols.length]; r.hex = PALETTE[r.col]; });
      } else P.forEach((p, i) => { p.tm = i; p.w = 2; p.pw = 0; p.cur = 2; });
      S.g = { md, mp, t: 0, rd: 0, ph: team ? "buy" : "live", pt: 0, sc: [0, 0], P, bomb: { st: 0, x: 0, z: 0, t: 0, site: 0 }, kf: [], kseq: 0, ann: null, aseq: 0, ls: [0, 0], over: false, rsite: 0 };
      if (team) this.startRound(S); else P.forEach((p, i) => this.spawnFFA(S, i, true));
    },
    say(S, a) { const g = S.g; g.ann = a.concat([++g.aseq]); },
    startRound(S) {
      const g = S.g; g.rd++; g.ph = "buy"; g.pt = this.BUY; g.bomb = { st: 0, x: 0, z: 0, t: 0, site: 0 }; g.rsite = Math.random() < 0.5 ? 0 : 1;
      const spots = [shuffle(OPS_CELLS.r.slice()), shuffle(OPS_CELLS.u.slice())], k = [0, 0];
      g.P.forEach((p, i) => {
        if (!p.alive || g.rd === 1) { p.w = -1; p.pw = 0; p.arm = 0; }
        const c = cellC(spots[p.tm][k[p.tm]++ % spots[p.tm].length]);
        p.x = p.rx = c[0] + (Math.random() - 0.5); p.z = p.rz = c[1] + (Math.random() - 0.5);
        p.a = p.tm === 0 ? Math.PI : 0; p.hp = 100; p.alive = p.gone ? 0 : 1; p.hb = {}; p.rsq++; p.actT = 0; p.cur = p.w >= 0 ? p.w : p.pw;
        if (p.bot) { p.bot.path = []; p.bot.goal = null; p.bot.tgt = -1; this.botBuy(p); p.bot.site = (i % 2); }
      });
      this.say(S, [1, g.rd]);
    },
    botBuy(p) {
      if (p.w < 0) {
        const opts = (p.cr >= 3400 ? [2, 2, 7, 9, 3, 8] : p.cr >= 2100 ? [7, 7, 9, 1, 5] : p.cr >= 1100 ? [1, 5, 9] : []).filter(w => OW[w].cost <= p.cr);
        if (opts.length && Math.random() < 0.85) { const w = opts[rint(0, opts.length - 1)]; p.cr -= OW[w].cost; p.w = w; }
        else if (p.pw === 0 && p.cr >= 700 && Math.random() < 0.6) { p.cr -= 700; p.pw = 6; }
      }
      if (p.arm < 50 && p.cr >= ARMOR_COST) { p.cr -= ARMOR_COST; p.arm = 100; }
      p.cur = p.w >= 0 ? p.w : p.pw;
    },
    spawnFFA(S, i, first) {
      const g = S.g, p = g.P[i];
      const others = g.P.filter((q, j) => j !== i && q.alive);
      let best = null, bs = -1;
      for (let k = 0; k < 24; k++) { const c = cellC(OPS_CELLS.open[rint(0, OPS_CELLS.open.length - 1)]); const d = others.length ? Math.min(...others.map(q => Math.hypot(q.x - c[0], q.z - c[1]))) : Math.random() * 10; if (d > bs) { bs = d; best = c; } }
      p.x = p.rx = best[0]; p.z = p.rz = best[1]; p.a = Math.random() * Math.PI * 2; p.hp = 100; p.alive = 1; p.arm = 0; p.rsq++; p.actT = 0; p.spT = g.t; p.hb = {};
      if (p.bot) { p.bot.path = []; p.bot.tgt = -1; p.cur = p.w = [1, 2, 2, 3, 5, 7, 8, 9][rint(0, 7)]; p.pw = Math.random() < 0.5 ? 6 : 0; }
    },
    damage(S, tgt, from, wi, head, raw) {
      const g = S.g, q = g.P[tgt], W0 = OW[wi] || OW[0];
      if (!q.alive) return;
      let dmg = raw != null ? raw : W0.dmg * (head ? W0.hs : 1);
      if (from >= 0 && from !== tgt && !W0.melee) { const f = g.P[from], dd = Math.hypot(f.x - q.x, f.z - q.z); dmg *= clamp(1.15 - dd / (W0.range * 1.6), 0.55, 1); }
      if (q.arm > 0) { const ab = Math.min(q.arm, dmg * 0.45); q.arm -= ab; dmg -= ab; }
      const real = Math.max(0, Math.min(dmg, q.hp));
      if (from >= 0 && from !== tgt) { g.P[from].dmg += real; q.hb[from] = (q.hb[from] || 0) + real; }
      q.hp -= dmg;
      if (q.hp <= 0) {
        q.hp = 0; q.alive = 0; q.d++; q.actT = 0; q.rT = 3;
        if (from >= 0 && from !== tgt) { const f = g.P[from]; f.k++; if (head) f.hsk++; f.cr = Math.min(16000, f.cr + (W0.kill || 300)); }
        // assist: anyone else who did 40+ damage to this life
        for (const j in q.hb) if (+j !== from && q.hb[j] >= 40 && g.P[j]) g.P[j].as++;
        q.hb = {};
        g.kf.push([from, tgt, wi, head ? 1 : 0, ++g.kseq]); if (g.kf.length > 5) g.kf.shift();
      }
    },
    enemy(S, i, j) { const P = S.g.P; return i !== j && (team ? P[i].tm !== P[j].tm : true); },
    owns(S, p, wi) { return wi === KNIFE || wi === p.pw || wi === p.w; },
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
        g.bomb = { st: 1, x: p.x, z: p.z, t: this.BOMB, site: ch === "a" ? 0 : 1, by: i }; p.pln++; p.actT = 0; p.cr = Math.min(9000, p.cr + 300);
        this.say(S, [2, g.bomb.site]);
      } else if (canDefuse && p.actT >= this.DEFUSE) { b.st = 2; p.dfs++; p.actT = 0; p.cr = Math.min(9000, p.cr + 300); }
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
        // a human who closed the tab stops sending input: take them out so rounds can still end
        if (!p.bot) {
          if (inputs[i]) { p.idle = 0; p.seen = 1; if (p.gone) { p.gone = 0; p.rT = 1; } }
          else { p.idle += dt; if (!p.gone && p.idle > (p.seen ? 8 : 25)) { p.gone = 1; if (p.alive) { p.alive = 0; p.hp = 0; } } }
        }
        if (!p.alive) { if (!team && !p.gone) { p.rT -= dt; if (p.rT <= 0) this.spawnFFA(S, i); } return; }
        if (p.bot) { this.botTick(S, i, dt); return; }
        const inp = inputs[i]; if (!inp) return;
        if (Number.isFinite(inp.x) && Number.isFinite(inp.z) && inp.q === p.rsq && !(team && g.ph === "buy" && Math.hypot(inp.x - p.rx, inp.z - p.rz) > 1.5)) { p.x = clamp(inp.x, 0, OG * CS); p.z = clamp(inp.z, 0, OG * CS); p.a = +inp.a || 0; }
        if (Number.isInteger(inp.w) && OW[inp.w] && this.owns(S, p, inp.w)) p.cur = inp.w;
        // shop
        if (!team && Array.isArray(inp.buy) && inp.buy[0] !== p.buySeq) { // free loadout in free-for-all
          p.buySeq = inp.buy[0]; const W1 = OW[inp.buy[1] | 0];
          if (W1 && W1.slot === 1) { p.w = inp.buy[1] | 0; p.cur = p.w; } if (W1 && W1.slot === 2) { p.pw = inp.buy[1] | 0; p.cur = p.pw; }
          if ((inp.buy[1] | 0) === ARMOR_IT && g.t - (p.spT || 0) < 10) p.arm = 100;
        }
        if (team && Array.isArray(inp.buy) && inp.buy[0] !== p.buySeq) {
          p.buySeq = inp.buy[0]; const it = inp.buy[1] | 0;
          if (g.ph === "buy" || (g.ph === "live" && this.ROUND - g.pt < 15)) {
            const W1 = OW[it];
            if (W1 && W1.slot === 1 && p.w !== it && p.cr >= W1.cost) { p.cr -= W1.cost; p.w = it; p.cur = it; }
            if (W1 && W1.slot === 2 && p.pw !== it && p.cr >= W1.cost) { p.cr -= W1.cost; p.pw = it; p.cur = it; }
            if (it === ARMOR_IT && p.arm < 100 && p.cr >= ARMOR_COST) { p.cr -= ARMOR_COST; p.arm = 100; }
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
            // one shot = one window; shotgun pellets share it
            if (g.t - p.lastHitT >= W0.rate * 0.55) { p.lastHitT = g.t; p.budget = W0.pel || 1; }
            if (!(p.budget > 0)) continue;
            const d = Math.hypot(q.x - p.x, q.z - p.z); if (d > (W0.melee ? 3.4 : W0.range + 6)) continue;
            if (!oLOS(p.x, p.z, q.x, q.z)) continue;
            p.budget--;
            if (W0.melee) {
              const stab = !!c[4], fx = q.bot ? Math.sin(q.a) : -Math.sin(q.a), fz = q.bot ? Math.cos(q.a) : -Math.cos(q.a);
              const back = ((q.x - p.x) * fx + (q.z - p.z) * fz) / (d || 1) > 0.35;
              this.damage(S, tg, i, wi, false, stab ? (back ? 200 : 65) : (back ? 80 : 34));
            } else this.damage(S, tg, i, wi, !!c[2]);
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
        if (b.t <= 0) { b.st = 3; P.forEach((q, j) => { if (q.alive && Math.hypot(q.x - b.x, q.z - b.z) < 9) { q.alive = 0; q.hp = 0; q.d++; q.hb = {}; const f = P[b.by]; if (f && q.tm !== f.tm) { f.k++; g.kf.push([b.by, j, -1, 0, ++g.kseq]); if (g.kf.length > 5) g.kf.shift(); } } }); this.endRound(S, 0, 5); return; }
      }
      if (b.st === 2) { this.endRound(S, 1, 4); return; }
      const alive = [0, 0]; P.forEach(p => { if (p.alive) alive[p.tm]++; });
      const has = [0, 0]; P.forEach(p => { if (!p.gone) has[p.tm]++; });
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
        const moving = !OW[p.cur].scope;
        if (moving) oMove(p, sx * 0.6 * speed * dt, sz * 0.6 * speed * dt);
        if (b.react <= 0 && b.fT <= 0 && Math.abs(da) < 0.15) {
          b.fT = W0.rate * (1 + Math.random() * (W0.auto ? 1.4 : 0.6)) + (W0.auto ? 0 : 0.15);
          const acc = clamp((b.boss ? 0.62 : 0.5) - td * (p.cur === 3 ? 0.002 : 0.011) - (moving ? 0.06 : 0), 0.08, 0.8);
          const hit = Math.random() < acc, head = hit && Math.random() < (b.boss ? 0.22 : 0.14);
          const ang = p.a + (hit ? 0 : (Math.random() - 0.5) * 0.2);
          const dist = hit ? td : oRay(p.x, p.z, Math.sin(ang), Math.cos(ang), 60);
          p.shot = [++p.bs, +(p.x + Math.sin(ang) * dist).toFixed(2), +(hit ? (head ? 1.45 : 1.0) : 0.8 + Math.random()).toFixed(2), +(p.z + Math.cos(ang) * dist).toFixed(2), p.cur];
          if (hit) { if (W0.pel) { let n = 0; for (let k = 0; k < W0.pel; k++) if (Math.random() < clamp(1.2 - td / W0.range, 0.1, 1)) n++; if (n) this.damage(S, tgt, i, p.cur, false, W0.dmg * n); } else this.damage(S, tgt, i, p.cur, head); }
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
        md, mp: g.mp, rd: g.rd, ph: g.ph, pt: Math.max(0, Math.round(g.pt * 10)), sc: g.sc, bomb: [b.st, +b.x.toFixed(2), +b.z.toFixed(2), Math.max(0, Math.round(b.t * 10)), b.site],
        pl: g.P.map(p => [Math.max(0, Math.round(p.hp)), p.alive, p.tm, p.k, p.d, Math.round(p.arm), p.cur, p.rsq, +p.rx.toFixed(2), +p.rz.toFixed(2), p.cr, Math.round(p.actT * 10), p.w, Math.ceil(p.rT * 10), p.hsk, p.pw, p.gone, p.as]),
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
    board(S) {
      const g = S.g;
      const rows = g.P.map((p, i) => {
        const kd = p.d ? p.k / p.d : p.k, hs = p.k ? Math.round(100 * p.hsk / p.k) : 0;
        const v = [p.k, p.d, p.as, kd.toFixed(2), hs + "%", Math.round(p.dmg)];
        if (team) v.push(p.pln + p.dfs);
        return { i, tm: team ? p.tm : -1, v, score: p.k * 2 + p.as + (p.pln + p.dfs) * 2 + p.dmg / 100 - p.d * 0.3 };
      });
      let mvp = -1, bs = -1e9; rows.forEach(r => { if (r.score > bs) { bs = r.score; mvp = r.i; } });
      rows.sort((a, b) => (a.tm - b.tm) || (b.v[0] - a.v[0]) || (a.v[1] - b.v[1]) || (b.v[5] - a.v[5]));
      return {
        cols: team ? ["K", "D", "A", "K/D", "HS", "DMG", "OBJ"] : ["K", "D", "A", "K/D", "HS", "DMG"],
        tips: team ? ["Kills", "Deaths", "Assists (40+ damage on someone a teammate finished)", "Kills per death", "Headshot kill %", "Damage dealt", "Plants + defuses"] : ["Kills", "Deaths", "Assists", "Kills per death", "Headshot kill %", "Damage dealt"],
        rows: rows.map(r => ({ i: r.i, tm: r.tm, v: r.v })), mvp,
        teams: team ? [{ n: TEAM[0].n, hex: TEAM[0].hex, sc: g.sc[0] }, { n: TEAM[1].n, hex: TEAM[1].hex, sc: g.sc[1] }] : null,
        sub: team ? "Rounds " + g.sc[0] + " – " + g.sc[1] + " · " + (OPS_MAPS[g.mp] ? OPS_MAPS[g.mp].n : "") : (OPS_MAPS[g.mp] ? OPS_MAPS[g.mp].n : ""),
      };
    },
    chip(V, i) { const pl = V.g && V.g.pl && V.g.pl[i]; return pl ? pl[3] : 0; },

    cardArt(ctx, ro, t) {
      const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, team ? "#2a0d12" : "#1a1d21"); bg.addColorStop(0.5, "#121316"); bg.addColorStop(1, team ? "#0b1a2e" : "#2a1408");
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
        ctx.font = "700 64px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#ff4d5e"; ctx.fillText("RED", W * 0.27, H * 0.16); ctx.fillStyle = "#f5f1e6"; ctx.font = "700 36px 'Chakra Petch', sans-serif"; ctx.fillText("VS", W / 2, H * 0.16); ctx.fillStyle = "#3fa9ff"; ctx.font = "700 64px 'Chakra Petch', sans-serif"; ctx.fillText("BLUE", W * 0.73, H * 0.16);
      } else {
        drawChar(ctx, ro[1].c, W * 0.5, H * 0.58, 150, { t, color: ro[1].hex, mood: "shock" });
        drawChar(ctx, ro[2].c, W * 0.2, H * 0.66, 90, { t, color: ro[2].hex, phase: 1 });
        drawChar(ctx, ro[3].c, W * 0.82, H * 0.64, 100, { t, color: ro[3].hex, phase: 2 });
        ctx.strokeStyle = "#ff7ac6"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, 60, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W * 0.5 - 95, H * 0.5); ctx.lineTo(W * 0.5 - 30, H * 0.5); ctx.moveTo(W * 0.5 + 30, H * 0.5); ctx.lineTo(W * 0.5 + 95, H * 0.5); ctx.moveTo(W * 0.5, H * 0.5 - 95); ctx.lineTo(W * 0.5, H * 0.5 - 30); ctx.moveTo(W * 0.5, H * 0.5 + 30); ctx.lineTo(W * 0.5, H * 0.5 + 95); ctx.stroke();
        ctx.font = "700 56px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ff8a3d"; ctx.fillText("FREE-FOR-ALL", W / 2, H * 0.15);
      }
      ctx.font = "700 30px 'Chakra Petch', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "rgba(245,241,230,.8)"; ctx.fillText("3D", 24, H - 30);
    },

    // ---------------- client ----------------
    clientEnter(V) {
      opsApplyTeamColors();
      const F = V.fps = { ready: false, failed: false, me: { x: OG * CS / 2, z: OG * CS / 2, a: 0, p: 0 }, rsq: -1, cur: 0, last: KNIFE, stepT: 0, ammo: OW.map(w => w.mag), reloadT: 0, fireCd: 0, firing: false, latch: false, scoped: false, bloom: 0, kick: 0,
        shotN: 0, claimN: 0, claims: [], look: { dx: 0, dy: 0 }, stick: null, lookT: null, lastHp: 100, hurtT: 0, hitT: 0, hitHead: false, kfSeen: 0, annSeen: 0, ann: null, toasts: [], remote: {}, shSeen: {}, bob: 0, buySeq: 0, buyReq: null, act: false, tab: false, lastW: undefined, prevPh: "", spec: 0 };
      loadThree().then(ok => { if (!ok) { F.failed = true; return; } if (APP.V === V) this.build(V); });
      this.bind(V);
    },
    clientExit(V) {
      const F = V.fps; if (!F) return; F.gone = true;
      (F.unbind || []).forEach(f => f());
      if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
      if (F.post) try { F.post.dispose(); } catch (e) {}
      if (F.renderer) { try { F.renderer.dispose(); F.renderer.forceContextLoss(); } catch (e) {} }
      [F.cv, F.setBtn, F.setPanel, F.shop, F.touch].forEach(el => el && el.remove());
      V.fps = null;
    },
    owned(V) { const pl = V.g && V.g.pl && V.g.pl[V.meIdx]; const o = []; if (pl && pl[12] >= 0) o.push(pl[12]); o.push(pl && pl[15] != null ? pl[15] : 0, KNIFE); return o; },
    slotOf(V, slot) { return this.owned(V).find(w => OW[w].slot === slot); },
    switchTo(V, wi) {
      const F = V.fps; if (!F || !this.owned(V).includes(wi) || F.cur === wi) return;
      F.last = F.cur; F.cur = wi; F.reloadT = 0; F.scoped = false; F.fireCd = Math.max(F.fireCd, OW[wi].melee ? 0.2 : 0.35); F.swapT = 0.35; if (OW[wi].melee) SFX.swish(0.25); else SFX.clank(0.5);
    },
    reload(V) { const F = V.fps, W0 = OW[F.cur]; if (W0.melee || F.reloadT > 0 || F.ammo[F.cur] >= W0.mag) return; F.reloadT = W0.rl; F.scoped = false; SFX.clank(0.6); setTimeout(() => SFX.clank(0.5), W0.rl * 450); setTimeout(() => SFX.clank(0.8), W0.rl * 880); },
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
      F.shop.querySelector("[data-cr]").textContent = team ? "$" + pl[10].toLocaleString() : "FREE LOADOUT";
      F.shop.querySelectorAll("[data-it]").forEach(b => { const it = +b.dataset.it, cost = it === ARMOR_IT ? ARMOR_COST : OW[it].cost, own = it === ARMOR_IT ? pl[5] >= 100 : (pl[12] === it || pl[15] === it); b.disabled = own || (team && pl[10] < cost); b.classList.toggle("own", own); });
    },
    bind(V) {
      const F = V.fps, cv = $("#gameCanvas");
      const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); (F.unbind || (F.unbind = [])).push(() => el.removeEventListener(ev, fn, o)); };
      const coarse = matchMedia("(pointer: coarse)").matches;
      on(cv, "contextmenu", (e) => e.preventDefault());
      const specNext = () => { F.specOff = (F.specOff || 0) + 1; F.specManual = true; F.specAuto = 0; };
      on(cv, "mousedown", (e) => {
        if (V.meIdx < 0) { specNext(); return; }
        if (coarse) return;
        if (document.pointerLockElement !== cv) {
          // first click only grabs the mouse; it never fires. Drag-to-look is the fallback when the browser refuses the lock.
          if (F.noLock) { F.dragLook = true; if (e.button === 0) F.firing = true; return; }
          try { const r = cv.requestPointerLock({ unadjustedMovement: true }); if (r && r.catch) r.catch(() => { try { const r2 = cv.requestPointerLock(); if (r2 && r2.catch) r2.catch(() => { F.noLock = true; }); } catch (er) { F.noLock = true; } }); } catch (er) { F.noLock = true; }
          return;
        }
        if (e.button === 0) F.firing = true;
        if (e.button === 2 && OW[F.cur].scope) { F.scoped = !F.scoped; SFX.clank(0.3); }
        if (e.button === 2 && OW[F.cur].melee) F.stab = true;
      });
      on(window, "mouseup", (e) => { if (e.button === 0) { F.firing = false; F.latch = false; } F.dragLook = false; });
      on(window, "mousemove", (e) => {
        const locked = document.pointerLockElement === cv; if (!locked && !F.dragLook) return;
        const mx = e.movementX || 0, my = e.movementY || 0;
        // browsers sometimes report a huge jump right after the lock engages: drop those
        if (locked && performance.now() - (F.lockAt || 0) < 80) return;
        if (Math.abs(mx) > 400 || Math.abs(my) > 400) return;
        F.look.dx += mx; F.look.dy += my;
      });
      on(document, "pointerlockchange", () => { if (document.pointerLockElement === cv) F.lockAt = performance.now(); else { F.firing = false; F.latch = false; F.dragLook = false; } });
      on(window, "wheel", (e) => { if (APP.view !== "game") return; const o = this.owned(V); const k = o.indexOf(F.cur); this.switchTo(V, o[(k + (e.deltaY > 0 ? 1 : o.length - 1)) % o.length]); }, { passive: true });
      on(window, "keydown", (e) => {
        if (APP.view !== "game" || (e.target && e.target.tagName === "INPUT")) return;
        if (e.code === "Tab") { F.tab = true; e.preventDefault(); }
        if (V.meIdx < 0) { if (e.code === "Space" || e.code === "ArrowRight") { F.specOff = (F.specOff || 0) + 1; F.specManual = true; F.specAuto = 0; e.preventDefault(); } if (e.code === "ArrowLeft") { F.specOff = (F.specOff || 0) - 1; F.specManual = true; F.specAuto = 0; } return; }
        if (e.repeat) return;
        const shopOpen = F.shop && !F.shop.hidden;
        if (shopOpen && /^Digit[1-9]$/.test(e.code)) { const k = +e.code.slice(-1) - 1, it = [...OW_BUY, ARMOR_IT][k]; if (it != null) this.buy(V, it); return; }
        if (e.code === "Space") { F.firing = true; e.preventDefault(); }
        if (e.code === "KeyR") this.reload(V);
        if (e.code === "KeyE") F.act = true;
        if (e.code === "KeyQ") this.switchTo(V, F.last);
        if (/^Digit[1-3]$/.test(e.code)) { const w = this.slotOf(V, +e.code.slice(-1)); if (w != null) this.switchTo(V, w); }
        if (e.code === "KeyB") this.shopOpen(V, !shopOpen);
        if (e.code === "Escape" && shopOpen) this.shopOpen(V, false);
        if (e.code === "KeyI") { const L = lookPrefs(); L.iy = !L.iy; saveLookPrefs(L); toast("Mouse look up/down: " + (L.iy ? "inverted" : "normal")); syncLookPanel(F); }
      });
      on(window, "keyup", (e) => { if (e.code === "Space") { F.firing = false; F.latch = false; } if (e.code === "KeyE") F.act = false; if (e.code === "Tab") F.tab = false; });
      // touch
      on(cv, "touchstart", (e) => {
        if (V.meIdx < 0) { specNext(); return; }
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
        mk("ALT", "t-scope", () => { if (OW[F.cur].scope) F.scoped = !F.scoped; if (OW[F.cur].melee) F.stab = true; });
        mk("R", "t-r", () => this.reload(V));
        mk("⇄", "t-swap", () => { const o = this.owned(V); this.switchTo(V, o[(o.indexOf(F.cur) + 1) % o.length]); });
        if (team) mk("USE", "t-use", () => { F.act = true; }, () => { F.act = false; });
        mk("BUY", "t-buy", () => this.shopOpen(V, F.shop.hidden));
        box.append(tc); F.touch = tc;
      }
      // shop
      if (V.meIdx >= 0) {
        const sh = document.createElement("div"); sh.className = "ops-shop"; sh.hidden = true;
        const head = document.createElement("div"); head.className = "sh-head"; head.innerHTML = "<b>NETEAM ARMORY</b><span data-cr>$0</span>";
        const grid = document.createElement("div"); grid.className = "sh-grid";
        [...OW_BUY.map(w => [w, OW[w].n, OW[w].d]), [ARMOR_IT, "Kevlar vest", "Absorbs damage"]].forEach(([it, n, d], k) => {
          const b = document.createElement("button"); b.type = "button"; b.dataset.it = it;
          const cost = it === ARMOR_IT ? ARMOR_COST : OW[it].cost;
          b.innerHTML = "<small>" + (k + 1) + "</small><b></b><i></i><em>" + (team ? "$" + cost.toLocaleString() : "") + "</em>";
          if (it !== ARMOR_IT) b.style.borderLeft = "3px solid " + OW[it].col;
          b.querySelector("b").textContent = n; b.querySelector("i").textContent = d;
          b.addEventListener("click", () => this.buy(V, it));
          grid.append(b);
        });
        const foot = document.createElement("div"); foot.className = "sh-foot"; foot.textContent = "1-9 to pick · B to close";
        const close = document.createElement("button"); close.type = "button"; close.className = "btn"; close.textContent = "Done"; close.addEventListener("click", () => this.shopOpen(V, false));
        sh.append(head, grid, foot, close); sh.addEventListener("mousedown", e => e.stopPropagation());
        box.append(sh); F.shop = sh;
      }
      // aim settings (shared with the other 3D game)
      const sb = document.createElement("button"); sb.type = "button"; sb.className = "look-btn"; sb.textContent = "⚙ Settings";
      const sp = document.createElement("div"); sp.className = "look-panel"; sp.hidden = true;
      sp.innerHTML = '<h4>Aim settings</h4><label><input type="checkbox" data-k="iy"> Invert up/down <small>(key I)</small></label><label><input type="checkbox" data-k="ix"> Invert left/right</label><label class="sl">Sensitivity <b data-v></b><input type="range" min="0.3" max="3" step="0.1" data-k="s"></label><label><input type="checkbox" data-cb> Color-blind team colors</label><label class="sl">Graphics <select data-q><option value="auto">Auto</option><option value="high">High quality</option><option value="low">Performance</option></select></label><button type="button" class="btn" data-close>Done</button>';
      const cbx = sp.querySelector("[data-cb]"); cbx.checked = opsColorBlind();
      cbx.addEventListener("change", () => { store("nfa-cb", { on: cbx.checked }); opsApplyTeamColors(); toast(cbx.checked ? "Teams: orange ▲ vs blue ■" : "Teams: red vs blue"); });
      const qs = sp.querySelector("[data-q]"); qs.value = (store("nfa-gfx") || {}).q || "auto";
      qs.addEventListener("change", () => { store("nfa-gfx", { q: qs.value }); toast("Graphics: " + qs.options[qs.selectedIndex].text + ". Applies from the next game."); });
      sb.addEventListener("click", (e) => { e.stopPropagation(); if (document.pointerLockElement) try { document.exitPointerLock(); } catch (er) {} sp.hidden = !sp.hidden; syncLookPanel(F); });
      sp.addEventListener("mousedown", (e) => e.stopPropagation());
      sp.addEventListener("input", (e) => { const k = e.target.dataset.k; if (!k) return; const L = lookPrefs(); L[k] = k === "s" ? clamp(+e.target.value || 1, 0.3, 3) : e.target.checked; saveLookPrefs(L); syncLookPanel(F); });
      sp.querySelector("[data-close]").addEventListener("click", () => { sp.hidden = true; });
      box.append(sb, sp); F.setBtn = sb; F.setPanel = sp;
    },
    clientInput(V, dt, inp) {
      const F = V.fps; if (!F || !F.ready) return null;
      const g = V.g || {}, me = V.meIdx; if (me < 0) return null;
      const pl = g.pl && g.pl[me];
      const alive = !pl || pl[1] === 1;
      if (pl && pl[7] !== F.rsq) { // (re)spawn
        F.rsq = pl[7]; F.me.x = pl[8]; F.me.z = pl[9]; F.me.p = 0; F.spawnHintT = team ? 0 : 5; F.hurtDir = null; F.ammo = OW.map(w => w.mag); F.reloadT = 0; F.scoped = false;
        F.me.a = team ? (pl[2] === 0 ? 0 : Math.PI) : Math.random() * 6.28;
        F.cur = pl[12] >= 0 ? pl[12] : (pl[15] != null ? pl[15] : 0);
      }
      // picked up / bought a new gun: switch to it with a full magazine
      if (pl && pl[12] !== F.lastW) { if (pl[12] >= 0 && F.lastW !== undefined) { F.cur = pl[12]; F.ammo[pl[12]] = OW[pl[12]].mag; } F.lastW = pl[12]; }
      if (pl && pl[15] != null && pl[15] !== F.lastP) { if (F.lastP != null && pl[15] !== 0) { F.cur = pl[15]; F.ammo[pl[15]] = OW[pl[15]].mag; } F.lastP = pl[15]; }
      if (!this.owned(V).includes(F.cur)) F.cur = this.owned(V)[0];
      // phase changes
      if (g.ph !== F.prevPh) { if (team && g.ph === "buy" && alive && !matchMedia("(pointer: coarse)").matches) this.shopOpen(V, true); if (g.ph !== "buy" && F.shop && !F.shop.hidden) this.shopOpen(V, false); F.prevPh = g.ph; }
      if (F.shop && !F.shop.hidden) this.syncShop(V);
      // look
      const LK = lookPrefs(), sens = 0.0024 * LK.s * (F.scoped ? 0.3 : 1);
      F.me.a -= F.look.dx * sens * (LK.ix ? -1 : 1); F.me.p = clamp(F.me.p - F.look.dy * sens * (LK.iy ? -1 : 1), -1.25, 1.25);
      F.lookVX = F.look.dx / Math.max(dt, 0.001) * 0.016; F.lookVY = F.look.dy / Math.max(dt, 0.001) * 0.016;
      F.look.dx = 0; F.look.dy = 0;
      F.rec = Math.max(0, (F.rec || 0) - dt * (F.firing ? 0.25 : 0.9));
      const playing = V.h.ph === "play";
      if (!playing && document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
      const W0 = OW[F.cur];
      F.bloom = Math.max(0, F.bloom - dt * 0.12); F.kick = Math.max(0, F.kick - dt * 6); F.swapT = Math.max(0, (F.swapT || 0) - dt);
      const frozen = team && g.ph === "buy";
      let moving = false;
      if (alive && playing && !frozen) {
        let fx = -inp.dy, sx = inp.dx, soft = false;
        if (F.stick) { const vx = F.stick.x - F.stick.bx, vy = F.stick.y - F.stick.by, d = Math.hypot(vx, vy); if (d > 6) { const k = Math.min(1, d / 55); sx = vx / d * k; fx = -vy / d * k; soft = k < 0.6; } }
        // Shift (or a light push on the touch stick) walks: half speed, steadier aim, no footsteps
        const walk = KEYS.has("ShiftLeft") || KEYS.has("ShiftRight") || soft;
        const sp = 5.4 * W0.spd * (walk ? 0.5 : 1) * (F.scoped ? 0.55 : 1) * dt;
        const sa = Math.sin(F.me.a), ca = Math.cos(F.me.a);
        const mx = (-sa * fx + ca * sx) * sp, mz = (-ca * fx - sa * sx) * sp;
        oMove(F.me, mx, mz); moving = Math.hypot(mx, mz) > 0.02 * dt * 60 * 0.05 && Math.hypot(fx, sx) > 0.2;
        F.bob += Math.hypot(mx, mz) * 2.4;
        F.moving = moving && !walk; F.walking = walk;
        // footsteps: running is loud, Shift-walking is silent
        if (F.moving) { F.stepT += Math.hypot(mx, mz); if (F.stepT > 2.1) { F.stepT = 0; SFX.step(0.55, 0, F.stepAlt = !F.stepAlt); } }
      } else F.moving = false;
      // weapon
      if (F.reloadT > 0) { F.reloadT -= dt; if (F.reloadT <= 0) { F.reloadT = 0; F.ammo[F.cur] = W0.mag; } }
      F.fireCd -= dt;
      const canFire = alive && playing && !(team && g.ph !== "live") && (!F.shop || F.shop.hidden);
      if (canFire && (F.firing || (F.stab && W0.melee)) && F.fireCd <= 0 && F.reloadT <= 0 && !(F.latch && !W0.auto)) {
        if (W0.melee) { F.fireCd = F.stab ? 1.0 : W0.rate; F.latch = !!F.stab; this.melee(V, !!F.stab); F.stab = false; }
        else if (F.ammo[F.cur] > 0) { F.fireCd = W0.rate; F.latch = true; this.fire(V); F.ammo[F.cur]--; if (F.ammo[F.cur] === 0) this.reload(V); }
        else { this.reload(V); F.latch = true; }
      }
      const act = F.act && alive;
      const out = { x: +F.me.x.toFixed(2), z: +F.me.z.toFixed(2), a: +F.me.a.toFixed(2), q: F.rsq, w: F.cur, sh: F.lastShot || 0, hc: F.claims.slice(-12), act: act ? 1 : 0 };
      if (F.buyReq) out.buy = F.buyReq;
      return out;
    },
    // knife: left = quick slash, right = heavy stab. Short reach cone; the host decides backstabs.
    melee(V, stab) {
      const F = V.fps, me = F.me; F.kick = stab ? 1.6 : 1; F.swing = stab ? -1 : 1; F.swingT = 0.32;
      SFX.swish(stab ? 0.7 : 0.5);
      const fx = -Math.sin(me.a), fz = -Math.cos(me.a);
      let best = -1, bd = 2.5;
      V.ro.forEach((r, i) => {
        if (i === V.meIdx) return; const pl = V.g && V.g.pl && V.g.pl[i]; if (!pl || !pl[1]) return;
        const av = F.remote[i]; if (!av) return;
        const dx = av.x - me.x, dz = av.z - me.z, d = Math.hypot(dx, dz); if (d > bd) return;
        if ((dx * fx + dz * fz) / (d || 1) < 0.55) return;
        if (team && pl[2] === V.g.pl[V.meIdx][2]) return;
        best = i; bd = d;
      });
      F.shotN++; F.lastShot = [F.shotN, +(me.x + fx).toFixed(2), 1.1, +(me.z + fz).toFixed(2), KNIFE];
      if (best >= 0) { F.claims.push([++F.claimN, best, 0, KNIFE, stab ? 1 : 0]); F.hitT = 0.3; F.hitHead = false; this.pop(F, stab ? 65 : 34, false, "KNIFE"); SFX.thud ? SFX.thud() : SFX.tone(140, 0.09, "square", 0.08); }
    },
    fire(V) {
      const F = V.fps, me = F.me, W0 = OW[F.cur];
      SFX.shot(W0.snd, 1);
      F.kick = 1; if (F.flash) F.flash.intensity = W0.pel ? 22 : 14;
      let spread = W0.spr + (F.moving ? W0.mv : F.walking ? W0.mv * 0.35 : 0) + F.bloom;
      if (W0.scope && !F.scoped) spread = 0.07 + (F.moving ? W0.mv : 0);
      F.bloom = Math.min(0.06, F.bloom + (W0.auto ? 0.006 : 0.012));
      const aimA = me.a, aimP = me.p + (F.rec || 0);
      F.rec = Math.min(0.16, (F.rec || 0) + W0.kick * (0.55 + Math.random() * 0.4)); me.a += (Math.random() - 0.5) * W0.kick * 0.25;
      const start = [me.x - Math.sin(aimA) * 0.6 + Math.cos(aimA) * 0.2, EYE - 0.16, me.z - Math.cos(aimA) * 0.6 - Math.sin(aimA) * 0.2];
      const pel = W0.pel || 1; let hitAny = false, headAny = false, lastEnd = null; const dmgAcc = {}, headIdx = {};
      for (let k = 0; k < pel; k++) {
        const ya = aimA + (Math.random() - 0.5) * 2 * spread, pa = aimP + (Math.random() - 0.5) * 2 * spread * (pel > 1 ? 0.6 : 1);
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
        const end = [me.x + dir[0] * t, EYE + dir[1] * t, me.z + dir[2] * t]; lastEnd = end;
        if (k < 3) this.addTracer(V, start, end, W0.col, hitIdx < 0);
        if (hitIdx >= 0) {
          const pls = V.g.pl, mine = pls[V.meIdx];
          const friendly = team && pls[hitIdx][2] === mine[2];
          if (!friendly) {
            const head = hitY > 1.22; F.claims.push([++F.claimN, hitIdx, head ? 1 : 0, F.cur]); hitAny = true; headAny = headAny || head;
            const av = F.remote[hitIdx], dd = av ? Math.hypot(av.x - me.x, av.z - me.z) : 0, est = W0.dmg * (head ? W0.hs : 1) * clamp(1.15 - dd / (W0.range * 1.6), 0.55, 1);
            dmgAcc[hitIdx] = (dmgAcc[hitIdx] || 0) + est; if (head) headIdx[hitIdx] = 1;
          }
        }
      }
      F.shotN++; F.lastShot = [F.shotN, +lastEnd[0].toFixed(2), +lastEnd[1].toFixed(2), +lastEnd[2].toFixed(2), F.cur];
      if (hitAny) { F.hitT = 0.3; F.hitHead = headAny; SFX.tone(headAny ? 2400 : 1700, 0.06, "square", 0.05); if (headAny) SFX.tone(3200, 0.08, "triangle", 0.05, 0, 0.05); }
      Object.keys(dmgAcc).forEach(k => this.pop(F, Math.round(dmgAcc[k]), !!headIdx[k]));
      if (W0.scope) F.scoped = false;
    },
    pop(F, n, head, tag) { F.pops = F.pops || []; F.pops.push({ n, head, tag, life: 0.9, x: (Math.random() - 0.5) * 60, y: -30 - Math.random() * 20 }); if (F.pops.length > 8) F.pops.shift(); },
    panOf(F, x, z, d) { const a = F.me.a; return d > 0.01 ? Math.max(-1, Math.min(1, ((x - F.me.x) * Math.cos(a) - (z - F.me.z) * Math.sin(a)) / d)) * 0.85 : 0; },
    charTex(c, hex, name, ringHex) { return frenzy.charTex(c, hex, name); },
    build(V) {
      const F = V.fps; if (!F || F.ready || F.building) return;
      // wait for the host to tell us which map we're on
      if (!(V.g && V.g.mp)) { setTimeout(() => { if (APP.V === V) this.build(V); }, 150); return; }
      opsSetMap(V.g.mp); F.building = true;
      const T = THREE, low = GFX.lowEnd();
      const cv = document.createElement("canvas"); cv.className = "fps3d";
      Object.assign(cv.style, { position: "absolute", borderRadius: "10px", pointerEvents: "none" });
      $("#stagebox").insertBefore(cv, $("#gameCanvas")); F.cv = cv;
      let renderer;
      try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: low, powerPreference: "high-performance" }); } catch (e) { F.failed = true; return; }
      renderer.setPixelRatio(Math.min(low ? 1.25 : 1.75, devicePixelRatio || 1));
      renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      F.renderer = renderer;
      F.post = GFX.post(renderer, { strength: 0.75, threshold: 1.1, vignette: 0.45, low });
      const scene = new T.Scene(); F.scene = scene;
      const TH = OPS_M.theme, outdoor = TH === "desert" || TH === "roof";
      const skyGrad = (stops) => { const t2 = GFX.tex(8, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); }); t2.wrapS = t2.wrapT = T.ClampToEdgeWrapping; return t2; };
      if (TH === "desert") { scene.background = skyGrad([[0, "#5d93c9"], [0.55, "#a9c8e0"], [0.8, "#f1d9ae"], [1, "#e8c48c"]]); scene.fog = new T.FogExp2(0xe6cfa5, 0.011); }
      else if (TH === "roof") { scene.background = skyGrad([[0, "#030409"], [0.6, "#121226"], [0.85, "#3a1c34"], [1, "#ff7a4a"]]); scene.fog = new T.FogExp2(0x1a1424, 0.013); }
      else { scene.background = new T.Color(0x05070f); scene.fog = new T.FogExp2(TH === "farm" ? 0x0a1420 : 0x0d1122, 0.016); }
      const cam = new T.PerspectiveCamera(74, 16 / 10, 0.05, 160); F.cam = cam; scene.add(cam);
      scene.environment = GFX.env(renderer, TH === "desert" ? { base: 0x9a8a70 } : {});
      if (TH === "desert") {
        scene.add(new T.HemisphereLight(0xfff1d6, 0x8a6a40, 2.4));
        const sun = new T.DirectionalLight(0xffe0b0, 2.7); sun.position.set(30, 50, 12); scene.add(sun); F.key = sun;
        const sunG = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(3, 2.6, 1.8), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); sunG.scale.set(40, 40, 1); sunG.position.set(OG * CS / 2 + 90, 120, OG * CS / 2 + 36); scene.add(sunG);
      } else if (TH === "roof") {
        scene.add(new T.HemisphereLight(0x8fa0d8, 0x2a2030, 1.2));
        const moon = new T.DirectionalLight(0x9fb4ff, 0.9); moon.position.set(-20, 40, -10); scene.add(moon); F.key = moon;
      } else { scene.add(new T.HemisphereLight(TH === "farm" ? 0xcfe4ff : 0xdfe4ff, 0x3a3040, 1.6)); const top = new T.DirectionalLight(0xfff0dc, 0.9); top.position.set(6, 40, 9); scene.add(top); F.key = top; }
      const tex = (w, h, fn) => GFX.tex(w, h, fn);
      const size = OG * CS;
      // ---- lights: warm office panels in corridors, coloured at sites and spawns
      const cen = (cells) => { let bx = cells[0], bd = 1e9; const mx = cells.reduce((s, q) => s + q[0], 0) / cells.length, mz = cells.reduce((s, q) => s + q[1], 0) / cells.length; cells.forEach(q => { const d = Math.hypot(q[0] - mx, q[1] - mz); if (d < bd) { bd = d; bx = q; } }); return cellC(bx); };
      const LIGHTS = [[OPS_SITE[0], 0x4cc9f0, 3.2], [OPS_SITE[1], 0x3ddc97, 3.2], [cen(OPS_CELLS.r), 0xff4d5e, 2.3], [cen(OPS_CELLS.u), 0x3fa9ff, 2.2]];
      const lampCol = { farm: 0xbfe0ff, desert: 0xffd9a0, roof: 0xff9a5c }[TH] || 0xffe6c4, grid = [];
      for (let z = 2; z < OG - 1; z += 4) for (let x = 2; x < OG - 1; x += 4) { const c = [[x, z], [x + 1, z], [x, z + 1], [x - 1, z], [x, z - 1]].find(q => !oWall(q[0], q[1])); if (c) grid.push(c); }
      grid.sort((p0, q0) => ((p0[0] * 7 + p0[1] * 13) % 11) - ((q0[0] * 7 + q0[1] * 13) % 11)).forEach(c => LIGHTS.push([cellC(c), lampCol, outdoor ? 1.1 : 1.6]));
      LIGHTS.slice(0, low ? 8 : outdoor ? 10 : 16).forEach(([p, c, k]) => { const l = new T.PointLight(c, 40 * k, 18, 1.3); l.position.set(p[0], OWH - 0.35, p[1]); scene.add(l); });
      // ---- floor: one baked texture for the whole map (zones, carpet, contact shadows near walls) + glow pools
      const px = low ? 32 : 64, FW = OG * px;
      const floorTex = tex(FW, FW, (x) => {
        for (let z = 0; z < OG; z++) for (let c = 0; c < OG; c++) {
          const ch = OPS_MAP[z][c], X = c * px, Y = z * px;
          if (ch === "#") { x.fillStyle = "#000"; x.fillRect(X, Y, px, px); continue; }
          const zone = { a: ["#24344f", "#4cc9f0"], b: ["#22403a", "#3ddc97"], r: ["#3c1d27", "#ff4d5e"], u: ["#1b2a47", "#3fa9ff"] }[ch];
          if (zone) { // raised-floor tiles
            x.fillStyle = zone[0]; x.fillRect(X, Y, px, px);
            x.strokeStyle = "rgba(0,0,0,.45)"; x.lineWidth = px / 32; for (let k = 0; k <= 2; k++) { x.beginPath(); x.moveTo(X + k * px / 2, Y); x.lineTo(X + k * px / 2, Y + px); x.moveTo(X, Y + k * px / 2); x.lineTo(X + px, Y + k * px / 2); x.stroke(); }
            x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(X + 2, Y + 2, px / 2 - 4, px / 2 - 4); x.fillRect(X + px / 2 + 2, Y + px / 2 + 2, px / 2 - 4, px / 2 - 4);
          } else { // office carpet / raised floor / sandstone pavers / roof concrete
            const FL = { farm: ["#2c3138", "#30353d"], desert: ["#c9a676", "#c2a070"], roof: ["#4b4d53", "#47494f"] }[TH] || ["#3a4060", "#343a58"];
            x.fillStyle = (c + z) % 2 ? FL[0] : FL[1]; x.fillRect(X, Y, px, px);
            for (let i = 0; i < px * px / 18; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.07)"; x.fillRect(X + Math.random() * px, Y + Math.random() * px, 1.5, 1.5); }
            x.strokeStyle = "rgba(0,0,0,.25)"; x.lineWidth = 1; x.strokeRect(X + 0.5, Y + 0.5, px - 1, px - 1);
          }
        }
        // hazard stripes around site edges
        ["a", "b"].forEach(k => OPS_CELLS[k].forEach(([c, z]) => { [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => { const n = OPS_MAP[z + dz] && OPS_MAP[z + dz][c + dx]; if (n !== "." ) return; const X = c * px + (dx > 0 ? px - px / 10 : 0), Y = z * px + (dz > 0 ? px - px / 10 : 0), w = dx ? px / 10 : px, h = dz ? px / 10 : px; x.fillStyle = "#ffd23f"; x.fillRect(X, Y, w, h); x.fillStyle = "#111"; for (let s = 0; s < 4; s++) { if (dx) x.fillRect(X, Y + s * px / 4, w, px / 8); else x.fillRect(X + s * px / 4, Y, px / 8, h); } }); }));
        // contact shadows: blurred wall mask multiplied over the floor
        const m = document.createElement("canvas"); m.width = m.height = FW; const mx = m.getContext("2d");
        mx.fillStyle = "#fff"; mx.fillRect(0, 0, FW, FW); mx.fillStyle = "#000";
        OPS_MAP.forEach((r, z) => [...r].forEach((ch, c) => { if (ch === "#") mx.fillRect(c * px - px * 0.04, z * px - px * 0.04, px * 1.08, px * 1.08); }));
        const b = document.createElement("canvas"); b.width = b.height = FW; const bx = b.getContext("2d"); bx.filter = "blur(" + Math.round(px * 0.22) + "px)"; bx.drawImage(m, 0, 0);
        x.globalCompositeOperation = "multiply"; x.globalAlpha = 0.85; x.drawImage(b, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
      });
      floorTex.wrapS = floorTex.wrapT = T.ClampToEdgeWrapping;
      const glowTex = tex(FW / 2, FW / 2, (x, w) => { x.fillStyle = "#000"; x.fillRect(0, 0, w, w); x.globalCompositeOperation = "lighter"; const s = w / size; LIGHTS.forEach(([p, c, k]) => { const col = new T.Color(c), r = (k > 2 ? 3.2 : 2.2) * CS * s; const g = x.createRadialGradient(p[0] * s, p[1] * s, 0, p[0] * s, p[1] * s, r); g.addColorStop(0, `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},${k > 2 ? 0.5 : 0.22})`); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, w); }); });
      glowTex.wrapS = glowTex.wrapT = T.ClampToEdgeWrapping;
      const bump = tex(128, 128, (x, w, h) => { x.fillStyle = "#808080"; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { const v = 100 + Math.random() * 60 | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.fillStyle = "#3a3a3a"; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h); });
      bump.repeat.set(OG, OG);
      const floor = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshStandardMaterial({ map: floorTex, emissiveMap: glowTex, emissive: 0xffffff, emissiveIntensity: 0.55, normalMap: GFX.normal(bump, 3), normalScale: new T.Vector2(0.6, 0.6), roughness: 0.82, metalness: 0.05 }));
      floor.rotation.x = -Math.PI / 2; floor.position.set(size / 2, 0, size / 2); scene.add(floor);
      // big site letters on the floor (glowing)
      ["A", "B"].forEach((L, k) => {
        const t2 = tex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = k ? "#3ddc97" : "#4cc9f0"; x.font = "700 200px 'Chakra Petch', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(L, w / 2, h / 2 + 12); x.lineWidth = 8; x.strokeStyle = k ? "#3ddc97" : "#4cc9f0"; x.beginPath(); x.arc(w / 2, h / 2, 118, 0, 7); x.stroke(); });
        const m = new T.Mesh(new T.PlaneGeometry(5.5, 5.5), new T.MeshBasicMaterial({ map: t2, transparent: true, depthWrite: false, opacity: 0.9, color: new T.Color(1.6, 1.6, 1.6), blending: T.AdditiveBlending }));
        m.rotation.x = -Math.PI / 2; m.position.set(OPS_SITE[k][0], 0.02, OPS_SITE[k][1]); scene.add(m);
      });
      // ---- ceiling: acoustic tiles + glowing light panels (bloom picks them up)
      const ceilTex = tex(256, 256, (x, w, h) => { x.fillStyle = "#8e93a8"; x.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { x.fillStyle = "rgba(0,0,0,.08)"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.strokeStyle = "#5d6178"; x.lineWidth = 5; for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); } });
      const ceilEm = tex(256, 256, (x, w, h) => { x.fillStyle = "#000"; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(255,244,224,.3)"; x.fillRect(136, 136, 112, 112); x.fillStyle = "#fff4e0"; x.fillRect(146, 146, 92, 92); });
      ceilTex.repeat.set(OG, OG); ceilEm.repeat.set(OG / 2, OG / 2);
      const ceil = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshStandardMaterial({ map: ceilTex, emissiveMap: ceilEm, emissive: 0xffffff, emissiveIntensity: 1.7, roughness: 0.95 }));
      ceil.rotation.x = Math.PI / 2; ceil.position.set(size / 2, OWH, size / 2); if (!outdoor) scene.add(ceil);
      // ---- walls: painted drywall, exposed NYC brick, glass partitions, server racks at the sites, skyline windows on the outside
      const AO = (x, w, h) => { let g = x.createLinearGradient(0, h, 0, h * 0.72); g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, h * 0.72, w, h * 0.28); g = x.createLinearGradient(0, 0, 0, h * 0.18); g.addColorStop(0, "rgba(0,0,0,.45)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h * 0.18); };
      const dry = tex(256, 256, (x, w, h) => { x.fillStyle = "#c9cdda"; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.fillStyle = "#1f6fd1"; x.fillRect(0, h * 0.55, w, 12); x.fillStyle = "#ffd23f"; x.fillRect(0, h * 0.55 + 12, w, 3); x.fillStyle = "#2b3046"; x.fillRect(0, h - 16, w, 16); x.fillStyle = "rgba(255,255,255,.2)"; x.fillRect(0, h - 16, w, 2); AO(x, w, h); });
      const dryH = tex(256, 256, (x, w, h) => { x.fillStyle = "#888"; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = Math.random() < 0.5 ? "#8c8c8c" : "#848484"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.fillStyle = "#aaa"; x.fillRect(0, h * 0.55, w, 15); x.fillStyle = "#bbb"; x.fillRect(0, h - 16, w, 16); });
      const brick = tex(256, 256, (x, w, h) => { x.fillStyle = "#4a2a24"; x.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) { const bx = c * 64 + (r % 2 ? 32 : 0), by = r * 16, v = 0.7 + Math.random() * 0.4; x.fillStyle = `rgb(${150 * v | 0},${68 * v | 0},${50 * v | 0})`; x.fillRect(bx + 2, by + 2, 60, 12); } AO(x, w, h); });
      const brickH = tex(256, 256, (x, w, h) => { x.fillStyle = "#222"; x.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) { const bx = c * 64 + (r % 2 ? 32 : 0), by = r * 16; x.fillStyle = "#ccc"; x.fillRect(bx + 3, by + 3, 58, 10); } });
      const glass = tex(256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#2c4a70"); g.addColorStop(1, "#16263f"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(255,255,255,.14)"; x.beginPath(); x.moveTo(40, 0); x.lineTo(100, 0); x.lineTo(30, h); x.lineTo(-30, h); x.fill(); x.fillStyle = "rgba(220,235,255,.5)"; x.fillRect(0, h * 0.46, w, 26); x.fillStyle = "#1f6fd1"; x.font = "700 20px 'Chakra Petch', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NETEAM", w / 2, h * 0.46 + 14); x.fillStyle = "#7d8299"; x.fillRect(0, 0, w, 8); x.fillRect(0, h - 18, w, 18); x.fillRect(0, 0, 6, h); x.fillRect(w - 6, 0, 6, h); });
      const sky = tex(256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#080a22"); g.addColorStop(0.7, "#2a1a4a"); g.addColorStop(1, "#ff8a5c"); x.fillStyle = g; x.fillRect(0, 0, w, h); for (let k = 0; k < 12; k++) { const bw = 14 + Math.random() * 30, bh = 60 + Math.random() * 150, bx = Math.random() * w; x.fillStyle = "#0b0d22"; x.fillRect(bx, h - bh, bw, bh); x.fillStyle = "rgba(255,214,140,.9)"; for (let y = h - bh + 6; y < h - 4; y += 8) for (let q = 3; q < bw - 3; q += 6) if (Math.random() < 0.35) x.fillRect(bx + q, y, 3, 3); } x.fillStyle = "#3a3f58"; x.fillRect(0, 0, w, 10); x.fillRect(0, h - 26, w, 26); x.fillRect(0, 0, 10, h); x.fillRect(w - 10, 0, 10, h); x.fillRect(w / 2 - 4, 0, 8, h); });
      const skyEm = tex(256, 256, (x, w, h) => { x.drawImage(sky.userData.canvas, 0, 0); x.fillStyle = "#000"; x.fillRect(0, 0, w, 10); x.fillRect(0, h - 26, w, 26); x.fillRect(0, 0, 10, h); x.fillRect(w - 10, 0, 10, h); x.fillRect(w / 2 - 4, 0, 8, h); });
      const rack = tex(128, 256, (x, w, h) => { x.fillStyle = "#1c2140"; x.fillRect(0, 0, w, h); x.fillStyle = "#10142a"; x.fillRect(6, 6, w - 12, h - 12); for (let y = 12; y < h - 12; y += 20) { x.fillStyle = "#3a4374"; x.fillRect(10, y, w - 20, 16); x.fillStyle = "#0a0c18"; for (let k = 0; k < 9; k++) x.fillRect(16 + k * 7, y + 4, 4, 8); } AO(x, w, h); });
      const rackEm = tex(128, 256, (x, w, h) => { x.fillStyle = "#000"; x.fillRect(0, 0, w, h); const cols = ["#3ddc97", "#4cc9f0", "#ffd23f", "#ff6b57"]; for (let y = 12; y < h - 12; y += 20) for (let k = 0; k < 4; k++) { if (Math.random() < 0.35) continue; x.fillStyle = cols[(Math.random() * cols.length) | 0]; x.fillRect(84 + k * 8, y + 6, 4, 4); } });
      const mats = [
        new T.MeshStandardMaterial({ map: dry, normalMap: GFX.normal(dryH, 2), roughness: 0.8 }),
        new T.MeshStandardMaterial({ map: rack, emissiveMap: rackEm, emissive: 0xffffff, emissiveIntensity: 3, normalMap: GFX.normal(rack, 1.5), roughness: 0.5, metalness: 0.6 }),
        new T.MeshStandardMaterial({ map: brick, normalMap: GFX.normal(brickH, 4), roughness: 0.92 }),
        new T.MeshStandardMaterial({ map: glass, roughness: 0.12, metalness: 0.7, emissiveMap: glass, emissive: 0x6688aa, emissiveIntensity: 0.35 }),
        new T.MeshStandardMaterial({ map: sky, emissiveMap: skyEm, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.2, metalness: 0.3 }),
      ];
      if (TH === "desert") {
        const sand = tex(256, 256, (x, w, h) => { x.fillStyle = "#d2b27e"; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = -1; c < 3; c++) { const v = 0.85 + Math.random() * 0.2; x.fillStyle = `rgb(${214 * v | 0},${180 * v | 0},${128 * v | 0})`; x.fillRect(c * 128 + (r % 2 ? 64 : 0) + 3, r * 32 + 3, 122, 26); } for (let i = 0; i < 2500; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(90,60,20,.08)" : "rgba(255,255,255,.07)"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } const g = x.createLinearGradient(0, h, 0, h * 0.7); g.addColorStop(0, "rgba(90,60,20,.35)"); g.addColorStop(1, "rgba(90,60,20,0)"); x.fillStyle = g; x.fillRect(0, h * 0.7, w, h * 0.3); });
        const sandH = tex(256, 256, (x, w, h) => { x.fillStyle = "#333"; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = -1; c < 3; c++) { x.fillStyle = "#bbb"; x.fillRect(c * 128 + (r % 2 ? 64 : 0) + 4, r * 32 + 4, 120, 24); } });
        mats.push(new T.MeshStandardMaterial({ map: sand, normalMap: GFX.normal(sandH, 3), roughness: 0.95 }));
      }
      if (TH === "roof") {
        const conc = tex(256, 256, (x, w, h) => { x.fillStyle = "#6b6e76"; x.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { x.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.05)"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.fillStyle = "#3a3d44"; for (let y = 30; y < h - 30; y += 22) x.fillRect(20, y, w - 40, 8); x.fillStyle = "#ff6a1a"; x.fillRect(0, 0, w, 6); AO(x, w, h); });
        mats.push(null, new T.MeshStandardMaterial({ map: conc, normalMap: GFX.normal(conc, 2), roughness: 0.75, metalness: 0.4 }));
      }
      F.rackMat = mats[1];
      const nearSite = (x, z) => { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const r = OPS_MAP[z + dz]; const ch = r && r[x + dx]; if (ch === "a" || ch === "b") return true; } return false; };
      const walls = [[], [], [], [], [], [], []];
      OPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch !== "#") return; const border = x === 0 || z === 0 || x === OG - 1 || z === OG - 1; let open = false; for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!oWall(x + ax, z + az)) open = true; if (!open) return; const hsh = (x * 7 + z * 3) % 6;
        const k = TH === "desert" ? 5 : TH === "roof" ? (border ? 4 : 6) : TH === "farm" ? (border ? 2 : [1, 1, 3, 1, 0, 1][hsh]) : border ? ((x + z) % 3 ? 4 : 2) : nearSite(x, z) ? 1 : [0, 0, 2, 3, 0, 2][hsh];
        walls[k].push([x, z]); }));
      const box = new T.BoxGeometry(CS, OWH, CS);
      mats.forEach((mat, k) => { if (!mat || !walls[k].length) return; const im = new T.InstancedMesh(box, mat, walls[k].length); const m4 = new T.Matrix4(); walls[k].forEach(([x, z], i) => { m4.makeTranslation(x * CS + CS / 2, OWH / 2, z * CS + CS / 2); im.setMatrixAt(i, m4); }); scene.add(im); });
      // skirting trim where walls meet the floor (sells the geometry)
      // ---- signs + posters
      const sign = (txt, sub, x, z, ry, col, wdt = 3.4) => {
        const t2 = tex(512, 140, (c, w, h) => { c.fillStyle = "#0a0b0d"; c.fillRect(0, 0, w, h); c.strokeStyle = col; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = col; c.font = "700 50px 'Chakra Petch', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, w / 2, 56); c.fillStyle = "#c8cde6"; c.font = "700 22px 'JetBrains Mono', monospace"; c.fillText(sub, w / 2, 108); });
        const m = new T.Mesh(new T.PlaneGeometry(wdt, wdt * 140 / 512), new T.MeshBasicMaterial({ map: t2, color: new T.Color(1.5, 1.5, 1.5) })); m.position.set(x, 2.45, z); m.rotation.y = ry; scene.add(m);
      };
      const wallFace = (cx, cz, dx, dz) => [cx * CS + CS / 2 - dx * (CS / 2 - 0.02), cz * CS + CS / 2 - dz * (CS / 2 - 0.02)];
      const faceFor = (cells) => { for (const [cx, cz] of cells) for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (oWall(cx + dx, cz + dz)) return [cx * CS + CS / 2 + dx * (CS / 2 - 0.03), cz * CS + CS / 2 + dz * (CS / 2 - 0.03), Math.atan2(-dx, -dz)]; return null; };
      [["a", "SITE A", OPS_M.sites[0], "#4cc9f0"], ["b", "SITE B", OPS_M.sites[1], "#3ddc97"], ["u", "BLUE TEAM", OPS_M.spawns[1], "#3fa9ff"], ["r", "RED TEAM", OPS_M.spawns[0], "#ff4d5e"]].forEach(([k, a1, a2, col]) => { const f = faceFor(OPS_CELLS[k]); if (f) sign(a1, a2, f[0], f[1], f[2], col); });
      const poster = (lines, x, z, ry, bg, fg) => {
        const t2 = tex(256, 320, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.textAlign = "center"; c.font = "700 30px 'Chakra Petch', sans-serif"; lines.forEach((l, i) => c.fillText(l, w / 2, 80 + i * 46)); c.strokeStyle = fg; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20); });
        const fr = new T.Mesh(new T.BoxGeometry(1.2, 1.48, 0.05), new T.MeshStandardMaterial({ color: 0x1a1d2e, roughness: 0.4, metalness: 0.6 }));
        const m = new T.Mesh(new T.PlaneGeometry(1.1, 1.375), new T.MeshStandardMaterial({ map: t2, roughness: 0.3, emissiveMap: t2, emissive: 0xffffff, emissiveIntensity: 0.35 })); m.position.z = 0.03;
        const g = new T.Group(); g.add(fr, m); g.position.set(x, 1.7, z); g.rotation.y = ry; scene.add(g);
      };
      // posters: spread over corridor walls, at least 5 cells apart
      const PST = [[["NETEAM", "SOLUTIONS", "SINCE 2001"], "#111316", "#ff8a3d"], [["THINK", "BEFORE", "YOU CLICK"], "#2a0d18", "#ff6b57"], [["PATCH", "TUESDAY", "IS SACRED"], "#0b1d3a", "#4cc9f0"], [["MIKE &", "PAVLOS", "FOUNDERS"], "#1a1530", "#ffd23f"], [["MFA", "OR IT", "DIDN'T HAPPEN"], "#102a22", "#3ddc97"], [["BACKUP", "3·2·1", "ALWAYS"], "#1d1030", "#ff7ac6"]];
      const placed = [];
      OPS_CELLS.open.filter(([x, z]) => OPS_MAP[z][x] === "." && (x * 5 + z * 11) % 7 === 0).forEach(([cx, cz]) => {
        if (placed.length >= PST.length || placed.some(q => Math.hypot(q[0] - cx, q[1] - cz) < 5)) return;
        const d = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dz]) => oWall(cx + dx, cz + dz)); if (!d) return;
        const [ls, bg, fg] = PST[placed.length]; placed.push([cx, cz]);
        poster(ls, cx * CS + CS / 2 + d[0] * (CS / 2 - 0.04), cz * CS + CS / 2 + d[1] * (CS / 2 - 0.04), Math.atan2(-d[0], -d[1]), bg, fg);
      });
      // ---- props against walls: desks with chairs + glowing monitors, plants, standalone racks inside the sites
      const mStd = (o) => new T.MeshStandardMaterial(o);
      const wood = mStd({ color: 0x8a6446, roughness: 0.6 }), metal = mStd({ color: 0x3a3f58, roughness: 0.35, metalness: 0.8 }), black = mStd({ color: 0x14161f, roughness: 0.5 });
      const screenTex = tex(128, 80, (x, w, h) => { x.fillStyle = "#06162e"; x.fillRect(0, 0, w, h); for (let y = 8; y < h - 4; y += 7) { x.fillStyle = ["#3ddc97", "#4cc9f0", "#ffd23f", "#9da1a9"][(y / 7 | 0) % 4]; x.fillRect(8 + (y * 13 % 20), y, 20 + (y * 37 % 70), 3); } });
      const screenM = new T.MeshBasicMaterial({ map: screenTex, color: new T.Color(1.4, 1.4, 1.4) });
      const leaf = mStd({ color: 0x2f8a52, roughness: 0.8 }), pot = mStd({ color: 0xd8d2c4, roughness: 0.6 });
      const crateT = tex(128, 128, (x, w, h) => { x.fillStyle = "#8a6038"; x.fillRect(0, 0, w, h); for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? "#7a5230" : "#916640"; x.fillRect(0, k * 16, w, 15); } x.strokeStyle = "#4a3018"; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); x.beginPath(); x.moveTo(8, 8); x.lineTo(w - 8, h - 8); x.stroke(); });
      const crateM = mStd({ map: crateT, roughness: 0.85 });
      const acT = tex(128, 128, (x, w, h) => { x.fillStyle = "#8d929c"; x.fillRect(0, 0, w, h); x.fillStyle = "#5a5f69"; for (let y = 14; y < h - 10; y += 10) x.fillRect(12, y, w - 24, 4); x.strokeStyle = "#ff6a1a"; x.lineWidth = 4; x.strokeRect(3, 3, w - 6, h - 6); });
      const acM = mStd({ map: acT, roughness: 0.5, metalness: 0.6 });
      const sites = new Set(OPS_CELLS.a.concat(OPS_CELLS.b).map(([x, z]) => x + "," + z));
      let desks = 0, plants = 0;
      for (const [x, z] of OPS_CELLS.open) {
        const ch = OPS_MAP[z][x], h = (x * 7 + z * 13) % 7;
        for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          if (!oWall(x + dx, z + dz)) continue;
          const px0 = x * CS + CS / 2, pz0 = z * CS + CS / 2, ry = Math.atan2(dx, dz);
          if ((sites.has(x + "," + z) && h < 3 && !outdoor) || (TH === "farm" && ch === "." && h < 2)) { // server rack
            const g = new T.Group(); const r = new T.Mesh(new T.BoxGeometry(0.9, 2.1, 0.9), mats[1]); r.position.y = 1.05; g.add(r);
            g.position.set(px0 + dx * (CS / 2 - 0.5), 0, pz0 + dz * (CS / 2 - 0.5)); g.rotation.y = ry; scene.add(g);
          } else if (outdoor && (h === 0 || (sites.has(x + "," + z) && h < 3)) && desks < 26) { // crates (desert) / AC units (roof), low cover
            const g = new T.Group(), big = 0.7 + ((x + z) % 3) * 0.15;
            const cm = TH === "desert" ? crateM : acM;
            const c1 = new T.Mesh(new T.BoxGeometry(big, big, big), cm); c1.position.y = big / 2; g.add(c1);
            if (h === 0) { const c2 = new T.Mesh(new T.BoxGeometry(0.6, 0.6, 0.6), cm); c2.position.set(big * 0.75, 0.3, 0.1); c2.rotation.y = 0.4; g.add(c2); }
            g.position.set(px0 + dx * (CS / 2 - big / 2 - 0.05), 0, pz0 + dz * (CS / 2 - big / 2 - 0.05)); g.rotation.y = ry; scene.add(g); desks++;
          } else if (ch === "." && h === 0 && desks < 18 && TH === "office") {
            const g = new T.Group();
            const top = new T.Mesh(new T.BoxGeometry(2.0, 0.06, 0.8), wood); top.position.y = 0.76;
            [-0.9, 0.9].forEach(sx => { const leg = new T.Mesh(new T.BoxGeometry(0.06, 0.76, 0.7), metal); leg.position.set(sx, 0.38, 0); g.add(leg); });
            const mon = new T.Mesh(new T.BoxGeometry(0.62, 0.38, 0.04), black); mon.position.set(0, 1.08, 0.18);
            const scr = new T.Mesh(new T.PlaneGeometry(0.56, 0.32), screenM); scr.position.set(0, 1.08, 0.155); scr.rotation.y = Math.PI;
            const stand = new T.Mesh(new T.BoxGeometry(0.06, 0.26, 0.06), metal); stand.position.set(0, 0.9, 0.2);
            const kb = new T.Mesh(new T.BoxGeometry(0.45, 0.02, 0.15), black); kb.position.set(0, 0.8, -0.1);
            const seat = new T.Mesh(new T.BoxGeometry(0.5, 0.08, 0.5), black); seat.position.set(0.1, 0.5, -0.7);
            const back = new T.Mesh(new T.BoxGeometry(0.5, 0.55, 0.07), black); back.position.set(0.1, 0.82, -0.96);
            const post = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.45, 8), metal); post.position.set(0.1, 0.24, -0.7);
            g.add(top, mon, scr, stand, kb, seat, back, post);
            g.position.set(px0 + dx * (CS / 2 - 0.45), 0, pz0 + dz * (CS / 2 - 0.45)); g.rotation.y = ry; scene.add(g); desks++;
          } else if (ch === "." && h === 3 && plants < 14 && !outdoor) {
            const g = new T.Group(); const p = new T.Mesh(new T.CylinderGeometry(0.22, 0.17, 0.45, 12), pot); p.position.y = 0.22;
            for (let k = 0; k < 4; k++) { const l = new T.Mesh(new T.IcosahedronGeometry(0.28 + Math.random() * 0.1, 0), leaf); l.position.set((Math.random() - 0.5) * 0.3, 0.6 + k * 0.17, (Math.random() - 0.5) * 0.3); g.add(l); }
            g.add(p); g.position.set(px0 + dx * (CS / 2 - 0.35) + dz * 1.2, 0, pz0 + dz * (CS / 2 - 0.35) + dx * 1.2); scene.add(g); plants++;
          }
          break;
        }
      }
      // ---- payload
      const bomb = new T.Group();
      const bb = new T.Mesh(new T.BoxGeometry(0.62, 0.32, 0.46), mStd({ color: 0x23263a, metalness: 0.7, roughness: 0.35 })); bb.position.y = 0.16;
      const strap = new T.Mesh(new T.BoxGeometry(0.66, 0.1, 0.12), mStd({ color: 0xffd23f, roughness: 0.5 })); strap.position.y = 0.2;
      const scr = new T.Mesh(new T.PlaneGeometry(0.34, 0.12), new T.MeshBasicMaterial({ color: 0xff2a3c })); scr.rotation.x = -Math.PI / 2; scr.position.set(0, 0.325, 0.06);
      const halo = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: 0xff2a3c, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); halo.scale.set(2.2, 2.2, 1); halo.position.y = 0.35;
      const led = new T.PointLight(0xff2a3c, 0, 7, 2); led.position.y = 0.7;
      bomb.add(bb, strap, scr, halo, led); bomb.visible = false; scene.add(bomb); F.bomb = bomb; F.bombLed = led; F.bombScr = scr; F.bombHalo = halo;
      // ---- players: character card + soft shadow + team glow ring + gun + muzzle flash
      const shadowM = new T.MeshBasicMaterial({ map: GFX.shadowTex(), transparent: true, depthWrite: false });
      F.markTex = (t, hx) => GFX.tex(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = hx; x.strokeStyle = "#0a0b0d"; x.lineWidth = 6; x.beginPath(); if (t === 0) { x.moveTo(w / 2, 8); x.lineTo(w - 8, h - 10); x.lineTo(8, h - 10); x.closePath(); } else x.rect(12, 12, w - 24, h - 24); x.stroke(); x.fill(); });
      const AVG = { torso: new T.CapsuleGeometry(0.27, 0.42, 4, 12), vest: new T.BoxGeometry(0.5, 0.42, 0.38), stripe: new T.BoxGeometry(0.4, 0.05, 0.02), leg: new T.BoxGeometry(0.17, 0.72, 0.2), boot: new T.BoxGeometry(0.19, 0.12, 0.3), arm: new T.CapsuleGeometry(0.075, 0.38, 3, 8) };
      F.avatars = V.ro.map((r, i) => {
        const grp = new T.Group(), bd = new T.Group(); grp.add(bd);
        // 3D operator body in the player's colour; the character face (or photo) rides on top as the head
        const suit = mStd({ color: new T.Color(r.hex).multiplyScalar(0.75), roughness: 0.55, metalness: 0.1, emissive: new T.Color(0), emissiveIntensity: 1 });
        const kit = mStd({ color: 0x1b1e24, roughness: 0.7, metalness: 0.2 }), boot = mStd({ color: 0x101114, roughness: 0.8 });
        const torso = new T.Mesh(AVG.torso, suit); torso.position.y = 1.12;
        const vest = new T.Mesh(AVG.vest, kit); vest.position.set(0, 1.16, -0.02);
        const stripe = new T.Mesh(AVG.stripe, mStd({ color: new T.Color(r.hex), emissive: new T.Color(r.hex), emissiveIntensity: 1.4 })); stripe.position.set(0, 1.3, -0.2);
        const legs = [-1, 1].map(sd => { const hip = new T.Group(); hip.position.set(sd * 0.13, 0.78, 0); const l = new T.Mesh(AVG.leg, kit); l.position.y = -0.36; const b = new T.Mesh(AVG.boot, boot); b.position.set(0, -0.74, -0.06); hip.add(l, b); bd.add(hip); return hip; });
        const arms = [-1, 1].map(sd => { const sh0 = new T.Group(); sh0.position.set(sd * 0.32, 1.38, 0); const a = new T.Mesh(AVG.arm, suit); a.position.set(0, -0.08, -0.22); a.rotation.x = 1.25 + (sd < 0 ? 0.15 : 0); a.rotation.z = sd * -0.35; sh0.add(a); bd.add(sh0); return sh0; });
        bd.add(torso, vest, stripe);
        const mat = new T.SpriteMaterial({ map: frenzy.charTex(r.c, r.hex, r.n), transparent: true });
        const spr = new T.Sprite(mat); spr.scale.set(1.05, 1.31, 1); spr.position.y = 1.95;
        const ring = new T.Mesh(new T.RingGeometry(0.45, 0.62, 32), new T.MeshBasicMaterial({ color: new T.Color(r.hex), transparent: true, opacity: 0.85, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
        const mark = new T.Sprite(new T.SpriteMaterial({ transparent: true, depthWrite: false })); mark.scale.set(0.42, 0.42, 1); mark.position.y = 2.78; mark.visible = false;
        const rim = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); rim.scale.set(1.9, 2.9, 1); rim.position.y = 1.25; rim.visible = false;
        grp.add(mark, rim);
        const sh = new T.Mesh(new T.PlaneGeometry(1.4, 1.4), shadowM); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02;
        const gun = new T.Group(); const gb = new T.Mesh(new T.BoxGeometry(0.1, 0.12, 0.62), metal); const gs = new T.Mesh(new T.BoxGeometry(0.105, 0.03, 0.5), mStd({ color: 0xffd23f, emissive: 0xffd23f, emissiveIntensity: 0.6 })); gs.position.y = 0.06; gun.add(gb, gs); gun.position.set(0.36, 0.95, -0.2);
        const fl = new T.Sprite(new T.SpriteMaterial({ map: GFX.flashTex(), transparent: true, blending: T.AdditiveBlending, depthWrite: false, color: new T.Color(2, 1.8, 1.4) })); fl.scale.set(0.7, 0.7, 1); fl.position.set(0.36, 0.97, -0.62); fl.visible = false;
        gun.position.set(0.12, 1.2, -0.42); fl.position.set(0.12, 1.22, -0.84);
        bd.add(gun, fl); grp.add(sh, spr, ring); scene.add(grp);
        return { grp, bd, legs, arms, suit, stripeM: stripe.material, mark, rim, tmKey: "", spr, ring, gun, fl, flT: 0, ph: 0, x: 0, z: 0, init: false, hurtT: 0, lastHp: 100, deadT: 0, wasAlive: true };
      });
      // swap the simple capsule bodies for animated operators once the model has loaded
      GFX.operator().then((gl) => {
        if (!gl || F.gone || !F.avatars) return;
        const SU = THREE_EXTRAS.SkeletonUtils;
        F.avatars.forEach((av) => {
          try {
            const m = SU.clone(gl.scene); m.scale.setScalar(0.56); m.rotation.y = Math.PI;
            const main = [];
            m.traverse(o => {
              if (!o.isMesh) return; o.frustumCulled = false; o.castShadow = !!F.shadows;
              const one = !Array.isArray(o.material), mats = one ? [o.material] : o.material;
              const nm = mats.map(mt => { if (mt.name === "Main") { const c = mt.clone(); c.roughness = 0.45; c.metalness = 0.25; main.push(c); return c; } if (mt.name === "Grey") { const c = mt.clone(); c.color.set(0x2a2d33); c.roughness = 0.6; c.metalness = 0.5; return c; } return mt; });
              o.material = one ? nm[0] : nm;
            });
            const head = m.getObjectByName("Head_1"); if (head) head.visible = false;
            av.bd.children.forEach(c => { if (c !== av.gun && c !== av.fl) c.visible = false; });
            av.bd.add(m);
            // gun in the right hand
            const hand = m.getObjectByName("Palm2R") || m.getObjectByName("LowerArmR");
            if (hand) { m.updateMatrixWorld(true); const ws = new THREE.Vector3(); hand.getWorldScale(ws); const s0 = 1 / (ws.x || 1) * av.bd.scale.x;
              const gw = av.gun; av.bd.remove(gw); hand.add(gw); gw.scale.setScalar(s0 * 1.1); gw.position.set(0, 0, 0); gw.rotation.set(0, 0, 0); av.handGun = true; av.gunS = s0; }
            const mixer = new THREE.AnimationMixer(m), act = {};
            gl.animations.forEach(c => { act[c.name] = mixer.clipAction(c); });
            if (act.Death) { act.Death.setLoop(THREE.LoopOnce); act.Death.clampWhenFinished = true; }
            av.rb = { m, mixer, act, cur: "", main };
          } catch (e) { console.warn("operator model", e); }
        });
      });
      // ---- view-model guns
      F.guns = OW.map((w0, k) => {
        const g = new T.Group();
        const dark = mStd({ color: 0x23283f, metalness: 0.75, roughness: 0.32 }), grip = mStd({ color: 0x15171f, roughness: 0.8 });
        const acc = mStd({ color: new T.Color(w0.col), emissive: new T.Color(w0.col), emissiveIntensity: 0.9, roughness: 0.4 });
        const hand = mStd({ color: 0x2a2f45, roughness: 0.75 }), skin = mStd({ color: 0xc89878, roughness: 0.7 });
        if (w0.melee) {
          // knife: dark grip with accent guard and a brushed steel blade
          const steel = mStd({ color: 0xd8dde8, metalness: 1, roughness: 0.18 });
          const bladeShape = new T.Shape(); bladeShape.moveTo(0, 0); bladeShape.lineTo(0.045, 0); bladeShape.lineTo(0.05, 0.2); bladeShape.lineTo(0.0, 0.3); bladeShape.lineTo(-0.008, 0.2); bladeShape.closePath();
          const bg = new T.ExtrudeGeometry(bladeShape, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 1 });
          const blade = new T.Mesh(bg, steel); blade.rotation.x = -Math.PI / 2; blade.position.set(-0.022, 0.02, -0.06);
          const gripM = new T.Mesh(new T.CylinderGeometry(0.022, 0.026, 0.14, 10), mStd({ color: 0x15171f, roughness: 0.9 })); gripM.rotation.x = Math.PI / 2; gripM.position.z = 0.03;
          const guard = new T.Mesh(new T.BoxGeometry(0.09, 0.022, 0.02), acc); guard.position.z = -0.045;
          const fist = new T.Mesh(new T.BoxGeometry(0.085, 0.09, 0.11), hand); fist.position.set(0, -0.01, 0.03);
          const k1 = new T.Group(); k1.add(blade, gripM, guard, fist); k1.rotation.set(0.25, 0.35, -0.5); g.add(k1); g.userData.knife = k1;
          g.scale.setScalar(0.85); g.position.set(0.2, -0.2, -0.38); g.visible = false; cam.add(g);
          return g;
        }
        const [L, hgt, bl] = w0.vm;
        const body = new T.Mesh(new T.BoxGeometry(0.09, hgt, L), dark);
        const top = new T.Mesh(new T.BoxGeometry(0.07, 0.03, L * 0.9), grip); top.position.y = hgt / 2 + 0.012;
        const stripe = new T.Mesh(new T.BoxGeometry(0.094, 0.018, L * 0.7), acc); stripe.position.y = hgt / 2 - 0.025;
        const fat = w0.id === "shotgun" || w0.id === "lmg" ? 1.6 : 1;
        const barrel = new T.Mesh(new T.CylinderGeometry(0.02 * fat, 0.024 * fat, bl, 12), dark); barrel.rotation.x = Math.PI / 2; barrel.position.z = -L / 2 - bl / 2;
        const muzzle = new T.Mesh(new T.CylinderGeometry(0.03 * fat, 0.03 * fat, 0.05, 12), grip); muzzle.rotation.x = Math.PI / 2; muzzle.position.z = barrel.position.z - bl / 2;
        const handM = new T.Mesh(new T.BoxGeometry(0.07, 0.16, 0.08), grip); handM.position.set(0, -0.11, L * 0.22); handM.rotation.x = 0.3;
        const glove = new T.Mesh(new T.BoxGeometry(0.095, 0.08, 0.11), hand); glove.position.set(0.01, -0.13, L * 0.24);
        g.add(body, top, stripe, barrel, muzzle, handM, glove);
        if (w0.slot === 1) {
          const mag = new T.Mesh(new T.BoxGeometry(0.06, w0.id === "lmg" ? 0.12 : 0.17, w0.id === "lmg" ? 0.16 : 0.08), acc); mag.position.set(0, -0.12, -L * 0.08); mag.rotation.x = -0.15; g.add(mag);
          const stock = new T.Mesh(new T.BoxGeometry(0.07, 0.1, 0.22), grip); stock.position.set(0, -0.02, L / 2 + 0.1); g.add(stock);
          const fore = new T.Mesh(new T.BoxGeometry(0.08, 0.06, L * 0.35), grip); fore.position.set(0, -hgt / 2 - 0.02, -L * 0.3); g.add(fore);
          const lglove = new T.Mesh(new T.BoxGeometry(0.1, 0.07, 0.1), hand); lglove.position.set(-0.03, -hgt / 2 - 0.06, -L * 0.3); g.add(lglove);
        }
        if (w0.id === "shotgun") { const pump = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.16, 10), acc); pump.rotation.x = Math.PI / 2; pump.position.set(0, -0.06, -L / 2 - 0.05); g.add(pump); }
        if (w0.id === "lmg") { const box = new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.14), acc); box.position.set(-0.08, -0.08, -0.05); g.add(box); }
        if (w0.scope) { const sc = new T.Mesh(new T.CylinderGeometry(0.035, 0.04, 0.32, 14), dark); sc.rotation.x = Math.PI / 2; sc.position.set(0, hgt / 2 + 0.05, -0.05); const lens = new T.Mesh(new T.CircleGeometry(0.033, 14), new T.MeshBasicMaterial({ color: 0x66ccff })); lens.position.set(0, hgt / 2 + 0.05, -0.215); lens.rotation.y = Math.PI; g.add(sc, lens); }
        const fl = new T.Sprite(new T.SpriteMaterial({ map: GFX.flashTex(), transparent: true, blending: T.AdditiveBlending, depthWrite: false, color: new T.Color(2.4, 2.1, 1.6) })); fl.scale.set(0.3, 0.3, 1); fl.position.z = muzzle.position.z - 0.08; fl.visible = false; g.add(fl); g.userData.fl = fl;
        g.scale.setScalar(0.5); g.position.set(0.2, -0.19, -0.5); g.visible = false; cam.add(g);
        return g;
      });
      const flash = new T.PointLight(0xffd59a, 0, 9, 2); flash.position.set(0.22, -0.12, -0.9); cam.add(flash); F.flash = flash;
      F.tracers = []; F.parts = [];
      F.tracerGeo = new T.BoxGeometry(0.025, 0.025, 1);
      F.partM = new T.SpriteMaterial({ map: GFX.glowTex(), transparent: true, blending: T.AdditiveBlending, depthWrite: false });
      // real-time shadows from the key light: characters, walls and props ground the scene
      if (!low && F.key) {
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
        const L = F.key, c = OG * CS / 2, dir = L.position.clone().normalize();
        L.position.set(c + dir.x * 80, dir.y * 80, c + dir.z * 80); L.target.position.set(c, 0, c); scene.add(L.target);
        L.castShadow = true; L.shadow.mapSize.set(2048, 2048); L.shadow.bias = -0.0006; L.shadow.normalBias = 0.04;
        const sc2 = L.shadow.camera; sc2.left = sc2.bottom = -c * 1.15; sc2.right = sc2.top = c * 1.15; sc2.near = 1; sc2.far = 200; sc2.updateProjectionMatrix();
        L.shadow.radius = 3;
        const ceilY = OWH - 0.2;
        scene.traverse(o => {
          if (!o.isMesh || o.parent === cam || !(o.material && (o.material.isMeshStandardMaterial || o.material.isMeshPhysicalMaterial))) return;
          o.receiveShadow = true;
          const pl = o.geometry && o.geometry.type === "PlaneGeometry";
          o.castShadow = !pl && !(o.position.y > ceilY);
        });
        (F.avatars || []).forEach(av => av.bd.traverse(o => { if (o.isMesh) o.castShadow = true; }));
        F.shadows = true;
      }
      F.ready = true;
    },
    burst(V, at, hex, n, spd) {
      const F = V.fps, T = THREE; if (!F || !F.ready) return;
      for (let k = 0; k < n; k++) {
        const m = new T.Sprite(F.partM.clone()); m.material.color = new T.Color(hex).multiplyScalar(2.2); const s = 0.08 + Math.random() * 0.1; m.scale.set(s, s, 1);
        m.position.set(at[0], at[1], at[2]); F.scene.add(m);
        F.parts.push({ m, v: [(Math.random() - 0.5) * spd, Math.random() * spd * 0.8, (Math.random() - 0.5) * spd], life: 0.25 + Math.random() * 0.25, max: 0.5 });
      }
    },
    addTracer(V, from, to, hex, spark) {
      const F = V.fps, T = THREE; if (!F || !F.ready) return;
      const a = new T.Vector3(...from), b = new T.Vector3(...to); const len = a.distanceTo(b); if (len < 0.1) return;
      const m = new T.Mesh(F.tracerGeo, new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(3), transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
      m.scale.z = len; m.position.copy(a).lerp(b, 0.5); m.lookAt(b); F.scene.add(m); F.tracers.push({ m, life: 0.07 });
      this.burst(V, to, spark ? "#ffd59a" : "#ff3b4e", spark ? 6 : 9, spark ? 3 : 2);
    },
    draw(ctx, V, dt, t) {
      const F = V.fps; ctx.clearRect(0, 0, W, H); if (!F) return;
      if (F.failed) { ctx.fillStyle = "#0a0b0d"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#f5f1e6"; ctx.font = "700 20px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText("3D isn't available in this browser.", W / 2, H / 2); return; }
      if (!F.ready) { ctx.fillStyle = "#05070f"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#ff8a3d"; ctx.font = "700 22px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.fillText("LOADING…", W / 2, H / 2); return; }
      this.render3d(V, dt, t);
      this.hud(ctx, V, dt, t);
    },
    render3d(V, dt, t) {
      const F = V.fps, T = THREE, g = V.g || {};
      const gc = $("#gameCanvas"); const w = parseFloat(gc.style.width) || 960, h = parseFloat(gc.style.height) || 600;
      if (F.w !== w || F.h !== h) { F.w = w; F.h = h; F.renderer.setSize(w, h, false); Object.assign(F.cv.style, { width: w + "px", height: h + "px" }); F.cam.aspect = w / h; F.cam.updateProjectionMatrix(); }
      F.cv.style.left = gc.offsetLeft + "px"; F.cv.style.top = gc.offsetTop + "px"; pinToStage(F, w, h);
      const fov = F.scoped ? 22 : 74; if (Math.abs(F.cam.fov - fov) > 0.1) { F.cam.fov = lerp(F.cam.fov, fov, 0.5); F.cam.updateProjectionMatrix(); }
      // players
      const mypl0 = V.meIdx >= 0 && g.pl ? g.pl[V.meIdx] : null;
      V.ro.forEach((r, i) => {
        const av = F.avatars[i]; const pl = g.pl && g.pl[i];
        let x, z, a;
        if (r.b) { const b = g.bt && g.bt[i]; if (!b) return; [x, z, a] = b; }
        else { const inp = V.inputOf(i); if (inp && Number.isFinite(inp.x) && pl && inp.q === pl[7]) { x = inp.x; z = inp.z; a = (inp.a || 0) + Math.PI; } else if (pl) { x = av.init ? av.x : pl[8]; z = av.init ? av.z : pl[9]; a = av.a || 0; } else return; }
        if (!av.init || Math.hypot(av.x - x, av.z - z) > 5) { av.x = x; av.z = z; av.init = true; }
        const k = 1 - Math.pow(0.0005, dt), ox = av.x, oz = av.z; av.x = lerp(av.x, x, k); av.z = lerp(av.z, z, k); av.a = a;
        // enemy footsteps: only running players make noise
        if (i !== V.meIdx && pl && pl[1] && dt > 0) {
          const v = Math.hypot(av.x - ox, av.z - oz) / dt; av.spd = lerp(av.spd || 0, v, 0.2);
          if (av.spd > 3.6) { av.stepT = (av.stepT || 0) + v * dt; if (av.stepT > 2.1) { av.stepT = 0; const d = Math.hypot(av.x - F.me.x, av.z - F.me.z); if (d < 26) SFX.step(0.75 * (1 - d / 26), this.panOf(F, av.x, av.z, d), i & 1); } }
        }
        F.remote[i] = { x: av.x, z: av.z, a };
        av.grp.position.set(av.x, 0, av.z); av.grp.rotation.y = a + Math.PI; av.grp.visible = !(pl && pl[16]);
        const alive = !!(pl && pl[1]);
        // death: tip over and fade out instead of vanishing
        if (alive) { av.deadT = 0; av.spr.material.opacity = 1; av.spr.material.rotation = 0; }
        else if (av.wasAlive) av.deadT = 0.001;
        if (!alive && av.deadT > 0 && av.rb) { av.deadT += dt; av.spr.material.opacity = Math.max(0, 1 - (av.deadT - 1.2) * 1.5); av.bd.visible = av.deadT < 2.4; }
        else if (!alive && av.deadT > 0) { av.deadT += dt; const k = Math.min(1, av.deadT * 3.5); av.bd.rotation.x = -k * 1.45; av.bd.position.y = k * 0.18; av.spr.material.opacity = Math.max(0, 1 - (av.deadT - 0.6) * 1.5); av.bd.visible = av.deadT < 1.4; }
        else { av.bd.rotation.x = 0; av.bd.position.y = 0; av.bd.visible = true; }
        // walk cycle from actual movement speed
        const spd = i === V.meIdx ? 0 : (av.spd || 0), sw = Math.min(1, spd / 4.5);
        av.ph += dt * (4 + spd * 1.6); av.legs[0].rotation.x = Math.sin(av.ph) * 0.65 * sw; av.legs[1].rotation.x = -Math.sin(av.ph) * 0.65 * sw;
        if (av.rb) {
          // pick the animation from how fast they're actually moving
          const want = !alive ? "Death" : spd > 3.6 ? "Running" : spd > 0.5 ? "Walking" : "Idle", R = av.rb;
          if (R.cur !== want && R.act[want]) { const nx = R.act[want].reset().play(), pv = R.act[R.cur]; if (pv) pv.crossFadeTo(nx, want === "Death" ? 0.12 : 0.25, false); R.cur = want; }
          if (want === "Running") R.act.Running.timeScale = clamp(spd / 6.2, 0.7, 1.3);
          if (want === "Walking") R.act.Walking.timeScale = clamp(spd / 2.2, 0.6, 1.4);
          R.mixer.update(dt);
          R.main.forEach(mt => { mt.color.copy(av.suit.color); mt.emissive.copy(av.suit.emissive); });
        } else av.bd.position.y += alive ? Math.abs(Math.sin(av.ph)) * 0.04 * sw : 0;
        av.wasAlive = alive;
        av.grp.visible = i !== V.meIdx && (alive || (av.deadT > 0 && av.deadT < (av.rb ? 2.4 : 1.4)));
        av.ring.visible = av.gun.visible = alive;
        av.spr.position.y = alive ? 1.95 + Math.sin(t * 3 + i) * 0.015 + av.bd.position.y : Math.max(0.35, 1.95 - av.deadT * 4);
        if (pl && pl[0] < av.lastHp && alive) av.hurtT = 0.18; av.lastHp = pl ? pl[0] : 100;
        av.hurtT = Math.max(0, av.hurtT - dt); av.spr.material.color.setRGB(1 + av.hurtT * 8, 1 - av.hurtT * 3, 1 - av.hurtT * 3); av.suit.emissive.setRGB(av.hurtT * 6, 0, 0);
        if (team && pl) {
          av.ring.material.color.set(TEAM[pl[2]].hex);
          // whole body in team colour, a glow behind it and a shape marker over the head so sides read from across the map
          const key = pl[2] + (opsColorBlind() ? "c" : "n");
          if (av.tmKey !== key) {
            av.tmKey = key; const hx = TEAM[pl[2]].hex;
            av.suit.color.set(hx).multiplyScalar(0.9); av.stripeM.color.set(hx); av.stripeM.emissive.set(hx);
            av.rim.material.color.set(hx).multiplyScalar(1.6);
            av.mark.material.map = F.markTex(pl[2], hx); av.mark.material.needsUpdate = true;
          }
          const mate = mypl0 && pl[2] === mypl0[2];
          av.mark.visible = alive; av.rim.visible = alive;
          av.mark.material.depthTest = !mate; av.mark.renderOrder = mate ? 10 : 0; // teammates' markers show through walls
          av.mark.scale.setScalar(mate ? 0.42 : 0.5);
        }
        av.flT = Math.max(0, av.flT - dt); av.fl.visible = av.flT > 0; if (av.fl.visible) av.fl.material.rotation = Math.random() * 6;
        const shot = r.b ? (g.bs && g.bs[i]) : (V.inputOf(i) || {}).sh;
        if (Array.isArray(shot) && shot[0] !== F.shSeen[i]) {
          const first = F.shSeen[i] === undefined; F.shSeen[i] = shot[0];
          if (!first && i !== V.meIdx && alive) {
            const wcol = (OW[shot[4]] || OW[0]).col; av.flT = 0.05;
            const ga = a + Math.PI, sx = av.x - Math.sin(ga) * 0.62 + Math.cos(ga) * 0.36, sz = av.z - Math.cos(ga) * 0.62 - Math.sin(ga) * 0.36;
            const W1 = OW[shot[4]] || OW[0];
            if (!W1.melee) this.addTracer(V, [sx, 0.97, sz], [shot[1], shot[2], shot[3]], wcol, true); else av.flT = 0;
            const d = Math.hypot(av.x - F.me.x, av.z - F.me.z);
            const pan = this.panOf(F, av.x, av.z, d);
            if (Math.hypot(shot[1] - F.me.x, shot[3] - F.me.z) < 2.5 || W1.melee && d < 3.5) F.lastAttacker = { x: av.x, z: av.z, t: performance.now() };
            if (W1.melee) { if (d < 8) SFX.swish(0.5 * (1 - d / 8), pan); }
            else if (d < 70) SFX.shot(W1.snd, Math.max(0.12, 1 - d / 70) * 0.8, pan, Math.min(1, d / 50));
          }
        }
      });
      // camera
      const me = V.meIdx, mypl = me >= 0 && g.pl ? g.pl[me] : null;
      const dead = mypl && !mypl[1];
      let cx = F.me.x, cz = F.me.z, ca = F.me.a, cp = F.me.p + (F.rec || 0), eye = EYE;
      if (me < 0 || (dead && team)) {
        const cands = V.ro.map((r, i) => i).filter(i => g.pl && g.pl[i] && g.pl[i][1] && (me < 0 || g.pl[i][2] === mypl[2]) && F.remote[i]);
        // spectators follow one player; click / Space / arrows switch, otherwise it moves on every 8 s
        F.specOff = F.specOff || 0; F.specAuto = (F.specAuto || 0) + dt;
        if (F.specAuto > (F.specManual ? 25 : 8)) { F.specAuto = 0; F.specOff++; F.specManual = false; }
        if (cands.length) {
          const k = cands[((F.specOff % cands.length) + cands.length) % cands.length], r = F.remote[k];
          const tx = r.x - Math.sin(r.a) * 2.8, tz = r.z - Math.cos(r.a) * 2.8, sk = F.specK === k ? 1 - Math.pow(0.002, dt) : 1;
          F.specK = k; F.specX = sk === 1 ? tx : lerp(F.specX, tx, sk); F.specZ = sk === 1 ? tz : lerp(F.specZ, tz, sk);
          let da = r.a - (F.specA == null ? r.a : F.specA); da = Math.atan2(Math.sin(da), Math.cos(da)); F.specA = sk === 1 ? r.a : F.specA + da * sk;
          cx = F.specX; cz = F.specZ; ca = F.specA + Math.PI; cp = -0.28; eye = 2.5; F.specName = V.ro[k].n;
        }
        else F.specName = "";
      } else if (dead) { eye = 0.5; }
      const bob = F.moving ? Math.sin(F.bob) * 0.03 : 0;
      F.cam.position.set(cx, eye + bob, cz); F.cam.rotation.order = "YXZ"; F.cam.rotation.set(cp, ca, dead && !team ? 0.5 : F.moving ? Math.sin(F.bob * 0.5) * 0.004 : 0);
      F.guns.forEach((gm, k) => { gm.visible = k === F.cur && me >= 0 && !dead && !F.scoped; });
      const gm = F.guns[F.cur];
      if (gm) {
        const rl = F.reloadT > 0 ? Math.sin(Math.min(1, F.reloadT / OW[F.cur].rl) * Math.PI) : 0, sw = F.swapT ? F.swapT / 0.35 : 0;
        F.sway = F.sway || { x: 0, y: 0 }; F.sway.x = lerp(F.sway.x, clamp(-(F.lookVX || 0) * 0.0004, -0.04, 0.04), 0.15); F.sway.y = lerp(F.sway.y, clamp((F.lookVY || 0) * 0.0004, -0.04, 0.04), 0.15);
        const base = gm.userData.knife ? [0.2, -0.2, -0.38] : [0.2, -0.19, -0.5];
        gm.position.set(base[0] + Math.sin(F.bob * 0.5) * 0.008 + F.sway.x, base[1] - rl * 0.14 - sw * 0.2 + Math.abs(Math.cos(F.bob * 0.5)) * 0.006 + F.sway.y, base[2] + F.kick * 0.045);
        gm.rotation.x = F.kick * 0.08 - rl * 0.6; gm.rotation.y = F.sway.x * 2;
        if (gm.userData.knife) {
          // swing: slash sweeps sideways, stab thrusts forward
          F.swingT = Math.max(0, (F.swingT || 0) - dt); const sp = Math.sin((1 - F.swingT / 0.32) * Math.PI) * (F.swingT > 0 ? 1 : 0);
          gm.position.x += F.swing > 0 ? -sp * 0.16 : 0; gm.position.z -= F.swing < 0 ? sp * 0.2 : 0;
          gm.rotation.z = F.swing > 0 ? sp * 0.9 : 0; gm.rotation.x = F.swing < 0 ? -sp * 0.4 : 0;
        } else {
          gm.userData.fl.visible = F.kick > 0.7; if (gm.userData.fl.visible) gm.userData.fl.material.rotation = Math.random() * 6;
        }
      }
      if (F.swapT === 0 && F.cur === KNIFE && F.kick > 0) F.kick = Math.max(0, F.kick - dt * 4);
      F.flash.intensity = Math.max(0, F.flash.intensity - dt * 120);
      F.rackMat.emissiveIntensity = 2.6 + Math.sin(t * 3) * 0.6;
      // payload
      const b = g.bomb || [0];
      F.bomb.visible = b[0] === 1 || b[0] === 2;
      if (F.bomb.visible) { F.bomb.position.set(b[1], 0, b[2]); const rate = b[3] < 100 ? 8 : 3; const on = b[0] === 1 && Math.floor(t * rate) % 2 === 0; F.bombLed.intensity = on ? 12 : 0; F.bombHalo.visible = on || b[0] === 2; F.bombHalo.material.color.set(b[0] === 2 ? 0x3ddc97 : 0xff2a3c); F.bombScr.material.color.set(b[0] === 2 ? 0x3ddc97 : on ? 0xff2a3c : 0x550010); }
      if (b[0] === 1) { const k = b[3] < 100 ? 4 : 1; if (Math.floor(t * k * 2) !== F.beepK) { F.beepK = Math.floor(t * k * 2); if (F.beepK % 2 === 0) SFX.tone(1900, 0.05, "square", 0.025); } }
      // effects
      for (const o of F.tracers) { o.life -= dt; o.m.material.opacity = Math.max(0, o.life / 0.07); if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
      F.tracers = F.tracers.filter(o => o.life > 0);
      for (const o of F.parts) { o.life -= dt; o.v[1] -= 9 * dt; o.m.position.x += o.v[0] * dt; o.m.position.y = Math.max(0.02, o.m.position.y + o.v[1] * dt); o.m.position.z += o.v[2] * dt; o.m.material.opacity = Math.max(0, o.life / 0.3); if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
      F.parts = F.parts.filter(o => o.life > 0);
      if (F.post) { F.post.comp.uniforms.hurt.value = Math.min(1, (F.hurtT || 0) * 2.2); F.post.render(F.scene, F.cam, t); }
      else F.renderer.render(F.scene, F.cam);
    },
    hud(ctx, V, dt, t) {
      const F = V.fps, g = V.g || {}, me = V.meIdx, pl = me >= 0 && g.pl ? g.pl[me] : null;
      const tm = pl ? pl[2] : 0;
      const box = (x, y, w, h, r = 12, a = 0.72) => { ctx.fillStyle = "rgba(10,11,13," + a + ")"; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
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
        if (a[0] === 1) F.ann = { big: "ROUND " + a[1], sub: team ? (tm === 0 ? "ATTACK" : "DEFEND") : "", col: "#f5f1e6", life: 3 };
        if (a[0] === 2) { F.ann = { big: "PAYLOAD PLANTED", sub: "SITE " + (a[1] ? "B" : "A"), col: "#ff4d5e", life: 3 }; SFX.play("early"); }
        if (a[0] === 3) { const mine = pl && a[1] === tm; F.ann = { big: TEAM[a[1]].n.toUpperCase() + " WINS", sub: OPS_ANN[a[2]], col: TEAM[a[1]].hex, life: 4.5 }; SFX.play(mine ? "win" : "wrong"); if (a[2] === 5) SFX.play("boom"); }
        if (a[0] === 4) { F.ann = { big: "GO GO GO", sub: "", col: "#ff8a3d", life: 1.6 }; SFX.play("go"); }
      }
      if (pl) { if (pl[0] < F.lastHp && pl[1]) { F.hurtT = 0.45; SFX.play("bump"); F.hurtN = { n: F.lastHp - pl[0], life: 1 }; const la = F.lastAttacker; if (la && performance.now() - la.t < 700) F.hurtDir = { x: la.x, z: la.z, life: 1.4 }; } F.lastHp = pl[0]; }
      // which way the damage came from: a red arc at the screen edge
      if (F.hurtDir && F.hurtDir.life > 0 && pl && pl[1]) {
        F.hurtDir.life -= dt; const dx = F.hurtDir.x - F.me.x, dz = F.hurtDir.z - F.me.z;
        const fwdx = -Math.sin(F.me.a), fwdz = -Math.cos(F.me.a), rx = Math.cos(F.me.a), rz = -Math.sin(F.me.a);
        const ang = Math.atan2(dx * rx + dz * rz, dx * fwdx + dz * fwdz); // 0 = ahead, +right
        ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(ang); ctx.globalAlpha = Math.min(1, F.hurtDir.life);
        ctx.strokeStyle = "#ff3b4e"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(0, 0, 150, -Math.PI / 2 - 0.35, -Math.PI / 2 + 0.35); ctx.stroke();
        ctx.fillStyle = "#ff3b4e"; ctx.beginPath(); ctx.moveTo(0, -178); ctx.lineTo(-14, -160); ctx.lineTo(14, -160); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
      }
      // damage you deal: numbers pop near the crosshair, gold for headshots
      if (F.pops && F.pops.length) {
        ctx.textAlign = "center"; F.pops.forEach(o => { o.life -= dt; o.y -= dt * 50; ctx.globalAlpha = Math.max(0, Math.min(1, o.life * 2));
          ctx.font = (o.head ? "700 30px" : "700 22px") + " 'Chakra Petch', sans-serif"; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(10,11,13,.85)";
          const txt = (o.head ? "◎ " : "") + o.n; ctx.strokeText(txt, W / 2 + 40 + o.x, H / 2 + o.y); ctx.fillStyle = o.head ? "#ffd23f" : "#f5f1e6"; ctx.fillText(txt, W / 2 + 40 + o.x, H / 2 + o.y);
          if (o.head && o.life > 0.5) { ctx.font = "700 14px 'JetBrains Mono', monospace"; ctx.fillStyle = "#ffd23f"; ctx.fillText("HEADSHOT", W / 2, H / 2 + 46); } });
        ctx.globalAlpha = 1; F.pops = F.pops.filter(o => o.life > 0);
      }
      // gun hint after spawning
      if (pl && pl[1] && F.spawnHintT > 0 && (!F.shop || F.shop.hidden)) { F.spawnHintT -= dt; ctx.globalAlpha = Math.min(1, F.spawnHintT); ctx.textAlign = "center"; ctx.font = "700 14px 'JetBrains Mono', monospace"; const tx = matchMedia("(pointer: coarse)").matches ? "TAP BUY FOR GUNS" : "PRESS B FOR GUNS"; const tw = ctx.measureText(tx).width + 28; ctx.fillStyle = "rgba(10,11,13,.75)"; ctx.beginPath(); ctx.roundRect(W / 2 - tw / 2, H * 0.72 - 16, tw, 32, 8); ctx.fill(); ctx.fillStyle = "#ff8a3d"; ctx.fillText(tx, W / 2, H * 0.72); ctx.globalAlpha = 1; }
      F.hurtT = Math.max(0, F.hurtT - dt);
      if (F.hurtT > 0 && !F.post) { const gr = ctx.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 560); gr.addColorStop(0, "rgba(255,40,60,0)"); gr.addColorStop(1, "rgba(255,40,60," + F.hurtT * 1.3 + ")"); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
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
        ctx.textAlign = "center"; ctx.font = "700 30px 'Chakra Petch', sans-serif";
        ctx.fillStyle = TEAM[0].hex; ctx.fillText(String((g.sc || [0, 0])[0]), W / 2 - 112, 38);
        ctx.fillStyle = TEAM[1].hex; ctx.fillText(String((g.sc || [0, 0])[1]), W / 2 + 112, 38);
        const b = g.bomb || [0];
        if (b[0] === 1 && g.ph === "live") { ctx.fillStyle = Math.floor(t * 4) % 2 ? "#ff4d5e" : "#ffd23f"; ctx.font = "700 24px 'JetBrains Mono', monospace"; ctx.fillText("💣 " + (b[3] / 10).toFixed(1), W / 2, 33); }
        else { ctx.fillStyle = g.ph === "buy" ? "#ff8a3d" : "#f5f1e6"; ctx.font = "700 24px 'JetBrains Mono', monospace"; ctx.fillText(fmtTime(tl), W / 2, 33); }
        ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.fillText(g.ph === "buy" ? "BUY TIME" : "ROUND " + (g.rd || 1), W / 2, 56);
        // alive pips
        const al = [[], []]; (g.pl || []).forEach(p => al[p[2]].push(p[1]));
        al.forEach((list, k) => list.forEach((a, j) => { ctx.fillStyle = a ? TEAM[k].hex : "rgba(255,255,255,.18)"; const x = k === 0 ? W / 2 - 162 - j * 13 : W / 2 + 162 + j * 13; ctx.beginPath(); ctx.roundRect(x - 4, 26, 8, 20, 3); ctx.fill(); }));
      } else {
        const ranked = (g.pl || []).map((p, i) => ({ i, k: p[3], d: p[4] })).sort((a, b) => b.k - a.k || a.d - b.d);
        const lead = ranked[0], myRank = ranked.findIndex(o => o.i === me) + 1;
        box(W / 2 - 160, 10, 320, 50, 14);
        ctx.textAlign = "center"; ctx.font = "700 22px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(fmtTime(tl), W / 2, 30);
        ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9";
        ctx.fillText((myRank ? "#" + myRank + "  ·  " : "") + ((g.pl && me >= 0 && g.pl[me]) ? g.pl[me][3] : 0) + " / " + this.GOAL, W / 2, 50);
      }
      // announcements
      if (F.ann) {
        F.ann.life -= dt; const a = F.ann, k = Math.min(1, a.life * 2);
        ctx.globalAlpha = k; ctx.textAlign = "center";
        ctx.font = "700 46px 'Chakra Petch', sans-serif"; ctx.lineWidth = 8; ctx.strokeStyle = "rgba(10,11,13,.85)"; ctx.strokeText(a.big, W / 2, H * 0.27); ctx.fillStyle = a.col; ctx.fillText(a.big, W / 2, H * 0.27);
        if (a.sub) { ctx.font = "700 18px Inter, sans-serif"; ctx.strokeText(a.sub, W / 2, H * 0.27 + 40); ctx.fillStyle = "#f5f1e6"; ctx.fillText(a.sub, W / 2, H * 0.27 + 40); }
        ctx.globalAlpha = 1; if (a.life <= 0) F.ann = null;
      }
      // objective hints + progress
      if (team && pl && alive && g.ph === "live") {
        const b = g.bomb || [0], ch = oCh(F.me.x, F.me.z);
        let hint = "";
        if (tm === 0 && b[0] === 0 && (ch === "a" || ch === "b")) hint = "E  PLANT";
        if (tm === 1 && b[0] === 1 && Math.hypot(F.me.x - b[1], F.me.z - b[2]) < 1.9) hint = "E  DEFUSE";
        if (pl[11] > 0) {
          const need = tm === 0 ? this.PLANT : this.DEFUSE, k = Math.min(1, pl[11] / 10 / need);
          box(W / 2 - 160, H * 0.62, 320, 46, 12); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(W / 2 - 140, H * 0.62 + 28, 280, 8);
          ctx.fillStyle = tm === 0 ? TEAM[0].hex : TEAM[1].hex; ctx.fillRect(W / 2 - 140, H * 0.62 + 28, 280 * k, 8);
          ctx.textAlign = "center"; ctx.fillStyle = "#f5f1e6"; ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillText(tm === 0 ? "PLANTING PAYLOAD…" : "DEFUSING…", W / 2, H * 0.62 + 14);
        } else if (hint) { ctx.textAlign = "center"; ctx.font = "700 16px Inter, sans-serif"; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(10,11,13,.8)"; ctx.strokeText(hint, W / 2, H * 0.64); ctx.fillStyle = "#ff8a3d"; ctx.fillText(hint, W / 2, H * 0.64); }
      }
      if (team && pl && g.ph === "buy" && alive) { ctx.textAlign = "center"; ctx.font = "700 15px Inter, sans-serif"; ctx.fillStyle = "#ff8a3d"; if (F.shop && F.shop.hidden) { ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillStyle = "rgba(10,11,13,.7)"; ctx.beginPath(); ctx.roundRect(W / 2 - 75, H * 0.36 - 14, 150, 28, 8); ctx.fill(); ctx.fillStyle = "#ff8a3d"; ctx.fillText("B  BUY GUNS", W / 2, H * 0.36); } }
      // bottom-left: health/armor
      if (pl) {
        box(14, H - 66, 250, 52);
        ctx.textAlign = "left"; ctx.font = "700 30px 'Chakra Petch', sans-serif"; ctx.fillStyle = pl[0] > 50 ? "#f5f1e6" : pl[0] > 25 ? "#ffd23f" : "#ff4d5e";
        ctx.fillText("✚ " + pl[0], 28, H - 39);
        ctx.fillStyle = "#4cc9f0"; ctx.fillText("◈ " + pl[5], 142, H - 39);
        ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(28, H - 22, 220, 4); ctx.fillStyle = "#3ddc97"; ctx.fillRect(28, H - 22, 2.2 * pl[0], 4);
        if (team) { box(14, H - 104, 120, 32, 10); ctx.font = "700 16px 'JetBrains Mono', monospace"; ctx.fillStyle = "#3ddc97"; ctx.fillText("$" + pl[10].toLocaleString(), 26, H - 88); }
        // bottom-right: weapon + ammo
        const W0 = OW[F.cur];
        box(W - 270, H - 66, 256, 52);
        ctx.textAlign = "right"; ctx.font = "700 30px 'Chakra Petch', sans-serif"; ctx.fillStyle = !W0.melee && F.ammo[F.cur] <= W0.mag * 0.25 ? "#ff6b57" : "#f5f1e6";
        ctx.fillText(W0.melee ? "—" : F.reloadT > 0 ? "…" : String(F.ammo[F.cur]), W - 92, H - 39);
        ctx.font = "700 14px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.fillText(W0.melee ? "" : "/ " + W0.mag, W - 30, H - 36);
        if (F.walking && F.walkHintT !== -1) { ctx.textAlign = "center"; ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#3ddc97"; ctx.fillText("WALKING · SILENT", W / 2, H - 20); }
        ctx.textAlign = "left"; ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = W0.col; ctx.fillText(W0.n.toUpperCase(), W - 258, H - 23);
        const own = this.owned(V); let wx = W - 16; ctx.font = "700 11px 'JetBrains Mono', monospace"; for (let k = own.length - 1; k >= 0; k--) { const o = own[k], lab = OW[o].slot + " " + OW[o].short, tw = ctx.measureText(lab).width + 14; box(wx - tw, H - 92, tw, 20, 6, o === F.cur ? 0.9 : 0.55); ctx.textAlign = "center"; ctx.fillStyle = o === F.cur ? OW[o].col : "#8a90b8"; ctx.fillText(lab, wx - tw / 2, H - 82); wx -= tw + 5; }
        if (F.reloadT > 0) { ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(W - 258, H - 60, 232, 4); ctx.fillStyle = "#ff8a3d"; ctx.fillRect(W - 258, H - 60, 232 * (1 - F.reloadT / W0.rl), 4); }
      }
      if (me < 0) {
        const tx = F.specName ? "WATCHING " + F.specName.toUpperCase() : "WATCHING";
        ctx.textAlign = "center"; ctx.font = "700 15px 'JetBrains Mono', monospace"; const tw = Math.max(ctx.measureText(tx).width, 300) + 36;
        box(W / 2 - tw / 2, H - 92, tw, 54, 10, 0.78);
        ctx.fillStyle = "#f5f1e6"; ctx.fillText(tx, W / 2, H - 72);
        ctx.font = "600 12px Inter, sans-serif"; ctx.fillStyle = "#9da1a9"; ctx.fillText((matchMedia("(pointer: coarse)").matches ? "Tap" : "Click or Space") + " for the next player · you're in the next game", W / 2, H - 52);
      }
      // dead overlay
      if (pl && !alive) {
        ctx.fillStyle = "rgba(10,11,13,.35)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center"; ctx.font = "700 40px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#ff4d5e"; ctx.fillText("ELIMINATED", W / 2, H * 0.4);
        ctx.font = "700 16px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6";
        ctx.fillText(team ? (F.specName ? "WATCHING " + F.specName.toUpperCase() : "NEXT ROUND") : "BACK IN " + Math.ceil(pl[13] / 10), W / 2, H * 0.4 + 40);
      }
      // kill feed
      F.toasts.forEach(o => o.life -= dt); F.toasts = F.toasts.filter(o => o.life > 0);
      F.toasts.forEach((o, k) => {
        const [a, b, wi, hs] = o.k, A = V.ro[a], B = V.ro[b]; if (!B) return;
        const pa = g.pl && g.pl[a], pb = g.pl && g.pl[b];
        const ca = team && pa ? TEAM[pa[2]].hex : A ? A.hex : "#fff", cb = team && pb ? TEAM[pb[2]].hex : B.hex;
        const mid = " " + (wi === -1 ? "PAYLOAD" : (OW[wi] || OW[0]).short) + (hs ? " ◎ " : " "), an = A && a !== b ? A.n : "💥", bn = B.n;
        ctx.font = "700 13px Inter, sans-serif"; const wa = ctx.measureText(an).width, wm = ctx.measureText(mid).width, wb = ctx.measureText(bn).width, w = wa + wm + wb + 22;
        const y = 76 + k * 28, x = W - w - 14;
        ctx.globalAlpha = Math.min(1, o.life); box(x, y, w, 24, 8, 0.75);
        if (a === me || b === me) { ctx.strokeStyle = "#ff8a3d"; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.textAlign = "left"; ctx.fillStyle = ca; ctx.fillText(an, x + 11, y + 12); ctx.fillStyle = hs ? "#ffd23f" : "#9da1a9"; ctx.fillText(mid, x + 11 + wa, y + 12); ctx.fillStyle = cb; ctx.fillText(bn, x + 11 + wa + wm, y + 12);
        ctx.globalAlpha = 1;
      });
      // minimap
      const ms = Math.min(5.2, 118 / OG), mx = 14, my = 14, mw = OG * ms;
      box(mx - 5, my - 5, mw + 10, mw + 24, 8, 0.7);
      ctx.textAlign = "left"; ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.fillText(OPS_M.n.toUpperCase(), mx, my + mw + 11);
      OPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch === "#") { ctx.fillStyle = "rgba(170,180,230,.35)"; ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); } else if (ch === "a" || ch === "b") { ctx.fillStyle = ch === "a" ? "rgba(76,201,240,.25)" : "rgba(61,220,151,.25)"; ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); } }));
      ctx.font = "700 12px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#4cc9f0"; ctx.fillText("A", mx + OPS_SITE[0][0] / CS * ms, my + OPS_SITE[0][1] / CS * ms); ctx.fillStyle = "#3ddc97"; ctx.fillText("B", mx + OPS_SITE[1][0] / CS * ms, my + OPS_SITE[1][1] / CS * ms);
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
        ctx.font = "700 12px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.textAlign = "left"; ctx.fillText("PLAYER", W / 2 - 280, 100); ctx.textAlign = "right"; ctx.fillText("K", W / 2 + 90, 100); ctx.fillText("D", W / 2 + 135, 100); ctx.fillText("A", W / 2 + 180, 100); ctx.fillText(team ? "$" : "HS", W / 2 + 270, 100);
        const order = V.ro.map((r, i) => i).sort((a, b) => team ? (g.pl[a][2] - g.pl[b][2]) || (g.pl[b][3] - g.pl[a][3]) : (g.pl[b][3] - g.pl[a][3]));
        order.forEach((i, k) => { const r = V.ro[i], q = g.pl[i]; const y = 124 + k * 24; ctx.textAlign = "left"; ctx.fillStyle = team ? TEAM[q[2]].hex : r.hex; ctx.font = (i === me ? "800" : "600") + " 14px Inter, sans-serif"; ctx.fillText((q[1] ? "" : "✖ ") + r.n + (r.b ? " (bot)" : q[16] ? " (left)" : ""), W / 2 - 280, y); ctx.textAlign = "right"; ctx.fillStyle = "#f5f1e6"; ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillText(String(q[3]), W / 2 + 90, y); ctx.fillText(String(q[4]), W / 2 + 135, y); ctx.fillText(String(q[17] || 0), W / 2 + 180, y); ctx.fillText(team ? (!pl || q[2] === pl[2] ? "$" + q[10] : "—") : String(q[14]), W / 2 + 270, y); });
      }
      if (F.stick) { const s = APP.gameScale || 1, r = $("#gameCanvas").getBoundingClientRect(); ctx.strokeStyle = "rgba(245,241,230,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc((F.stick.bx - r.left) / s, (F.stick.by - r.top) / s, 55 / s, 0, 7); ctx.stroke(); ctx.fillStyle = "rgba(245,241,230,.35)"; ctx.beginPath(); ctx.arc((F.stick.x - r.left) / s, (F.stick.y - r.top) / s, 22 / s, 0, 7); ctx.fill(); }
      if (me >= 0 && V.h.ph === "play" && !document.pointerLockElement && !matchMedia("(pointer: coarse)").matches && (!F.shop || F.shop.hidden) && !(team && g.ph === "buy")) {
        ctx.textAlign = "center"; ctx.font = "700 18px 'Chakra Petch', sans-serif"; ctx.fillStyle = "rgba(10,11,13,.75)"; ctx.beginPath(); ctx.roundRect(W / 2 - 100, H / 2 + 40, 200, 40, 12); ctx.fill(); ctx.fillStyle = "#ffd23f"; ctx.fillText("CLICK TO PLAY", W / 2, H / 2 + 61);
      }
    },
  };
}
GAMES.breach = makeOps("team");
GAMES.deathmatch = makeOps("ffa");
// the lobby now features only the 3D games; older games stay registered so past scores still show
GAME_ORDER.length = 0;
GAME_ORDER.push("breach", "deathmatch");
