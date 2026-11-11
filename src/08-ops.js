// ======================= NETEAM OPS: 3D tactical shooter (Red vs Blue rounds + free-for-all) =======================
// Maps. # wall, r red spawn, u blue spawn, a = site A, b = site B. The host picks one sized to the player count.
const OPS_MAPS = {
  // two storeys: an atrium in the middle with a gallery around it, two feature stairs, offices upstairs
  hq: { n: "Neteam HQ", theme: "office", wallH: 6.8, sites: ["SERVER ROOM", "MEZZANINE"], spawns: ["LOBBY", "NOC"],
  stairs: [[7, 12, 0, -1, 2], [14, 10, 0, 1, 2]],
  // site B is upstairs: the east gallery where the east stair arrives (upper-floor cells)
  upSites: { b: [[14, 12], [15, 12], [16, 12], [14, 13], [15, 13], [14, 14], [15, 14]] },
  up: { h: 3.6, ceil: 3.2, rows: [
    "######################",
    "######################",
    "######################",
    "######################",
    "######################",
    "######################",
    "#......###..###......#",
    "#.##.#..........#.##.#",
    "#.##.#..........#.##.#",
    "#.......      .......#",
    "#.###...       #..##.#",
    "#.....#        #.....#",
    "#.###.#       ...##..#",
    "#.##.#..........#.##.#",
    "#.##.#..........#.##.#",
    "#......###..###......#",
    "######################",
    "######################",
    "######################",
    "######################",
    "######################",
    "######################",
  ] }, rows: [
  "######################",
  "#.......#......#.....#",
  "#.......#......#uu...#",
  "#..##........#uuu##..#",
  "#......####..#uuu....#",
  "###.##.#........###.##",
  "#....#.#.##.###.#....#",
  "#.##..aaa#.......###.#",
  "#.#..###a#.###.#.....#",
  "#...#.aaa........#.#.#",
  "##.##.##.........#...#",
  "#...................##",
  "#.###.#.......#.###..#",
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
  farm: { n: "Server Farm", theme: "farm", ceilH: 6.4, sites: ["COLD AISLE", "HOT AISLE"], spawns: ["LOADING DOCK", "CONTROL ROOM"], rows: [
    "##################",
    "#aaaa.....uuuuuu.#",
    "#aaaa.....uuuuuu.#",
    "#..##..##.##..#..#",
    "#................#",
    "#................#",
    "#..##..##.##..#..#",
    "#.......##.......#",
    "#..##.#.##.......#",
    "#.......##.#b##b.#",
    "#.......##..bbbb.#",
    "#..##..##.##..#..#",
    "#................#",
    "#................#",
    "#..##..##.##..#..#",
    "#rrrrrr..........#",
    "#rrrrrr..........#",
    "##################",
  ] },
  sand: { n: "Sandstorm District", theme: "desert", sites: ["MARKET", "OLD BAZAAR"], spawns: ["CANYON ROAD", "COMPOUND"], rows: [
    "##########################",
    "#......###uuuuuu###......#",
    "#..#......uuuuuu.....#...#",
    "#.........uuuuuu.........#",
    "#...#....###..#####...#..#",
    "#........###..#####......#",
    "##....#..###..####....####",
    "##....#..###..####bb##..##",
    "##..###aa###....#bbb##..##",
    "##..###aaaa.....bbbb##..##",
    "##..###aaaa...####..##..##",
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
  // jump arena for Golden Router: 1 = 1.2 m deck, 2 = 2.6 m deck, ^ = jump pad, T = trophy home. Open sky.
  // enclosed indoor arena: a tall vault with rooms, a walled core and a roof (decks, pads and rockets still work in 3D)
  arena: { n: "Data Vault", theme: "farm", nx: "vault", open: true, wallH: 8, only: "golden", sites: ["", ""], spawns: ["", ""],
    // pickups [cell x, cell z, item]: weapon index, "H" health, "A" armor
    picks: [[6, 3, 10], [15, 18, 10], [1, 10, 5], [20, 11, 5], [10, 3, 8], [11, 18, 1], [3, 7, 9], [18, 14, 9], [6, 10, "H"], [15, 11, "H"], [8, 1, "H"], [13, 20, "H"], [1, 1, "A"], [20, 20, "A"]],
    rows: [
    "######################",
    "#11..^....##....^..11#",
    "#11.......##.......11#",
    "#....2222....2222....#",
    "#...12..........21...#",
    "#^...2...1..1...2...^#",
    "#####....1..1....#####",
    "#..1..............1..#",
    "#..1..#..^..^..#..1..#",
    "#....11#......#11....#",
    "#......#..TT..#......#",
    "#......#..TT..#......#",
    "#....11#......#11....#",
    "#..1..#..^..^..#..1..#",
    "#..1..............1..#",
    "#####....1..1....#####",
    "#^...2...1..1...2...^#",
    "#...12..........21...#",
    "#....2222....2222....#",
    "#11.......##.......11#",
    "#11..^....##....^..11#",
    "######################",
  ] },
  // Laser Arena only: two tower roofs high over the city with nothing between them. v = open air (fall in and you are out),
  // ^ = booster that throws you across: jumps [pad x, pad z, landing x, landing z]
  sky: { n: "Uplink", theme: "roof", nx: "sky", open: true, sky: true, wallH: 4.5, only: "laser", sites: ["", ""], spawns: ["", ""], homes: [[6, 8], [17, 15]],
    jumps: [[9, 4, 16, 4], [14, 5, 7, 5], [9, 11, 16, 11], [14, 12, 7, 12], [9, 18, 16, 18], [14, 19, 7, 19]],
    rows: [
    "##########vvvv##########",
    "#11.......vvvv11.....###",
    "#11.......vvvv.........#",
    "#....##...vvvv..1....2.#",
    "#....##..^vvvv.......2.#",
    "#.........vvvv^........#",
    "#..2....1.vvvv..##.....#",
    "#..2....1.vvvv..##.....#",
    "#.........vvvv.........#",
    "####......vvvv..11..1..#",
    "####...2..vvvv......1..#",
    "#......2.^vvvv.........#",
    "#.........vvvv^.2......#",
    "#..1......vvvv..2...####",
    "#..1..11..vvvv......####",
    "#.........vvvv.........#",
    "#.....##..vvvv.1....2..#",
    "#.....##..vvvv.1....2..#",
    "#........^vvvv.........#",
    "#.2.......vvvv^..##....#",
    "#.2....1..vvvv...##....#",
    "#.........vvvv.......11#",
    "###.....11vvvv.......11#",
    "##########vvvv##########",
  ] },
  roof: { n: "Rooftop", theme: "roof", sites: ["HELIPAD", "WATER TOWER"], spawns: ["STAIRWELL", "ANTENNA FARM"], rows: [
    "########################",
    "#aaaaa.................#",
    "#aaaaa...........uuuuuu#",
    "#aaaaa...##......uuuuuu#",
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
    "#.##..##...##....##bbbb#",
    "#.....##...##....##bbbb#",
    "#.................bbbbb#",
    "#......................#",
    "#..##....##........##..#",
    "#..##....##....##..##..#",
    "#rrrrrr........##......#",
    "#rrrrrr................#",
    "#rrrrrr................#",
    "########################",
  ] },
};
// small maps for small groups, big maps for big groups
function opsPickMap(n) { const pool = n <= 6 ? ["farm", "hq"] : n <= 10 ? ["hq", "sand", "roof"] : ["sand", "roof"]; return pool[Math.floor(Math.random() * pool.length)]; }
// feet height of whoever is moving, and how high a step they can take onto a box (more with legs tucked mid-air)
let OPS_FEET = 0, OPS_STEP = 0.35;
// multi-level maps (see opsBuildLevels): per-cell solid spans, stair runs, upper floor height
let OPS_ML = false, OPS_SP = null, OPS_RAMP = null, OPS_UPH = 0, OPS_RAILS = [], OPS_FURN = [];
const ML_SLAB = 0.35, ML_TOP = 99;
let OPS_JUMP = {}, OPS_ID = "", OPS_M = null, OPS_MAP = [], OG = 0, OPS_CELLS = null, OPS_SITE = null, OPS_PROPS = [], OPS_PALIVE = new Uint8Array(0);
// breakable props: 0 hardware crate, 1 old monitor on a cart, 2 Li-ion UPS battery (explodes)
const OPROP = [{ n: "crate", hp: 100, hx: 0.48, hz: 0.48, h: 0.96 }, { n: "monitor", hp: 55, hx: 0.42, hz: 0.34, h: 1.25 }, { n: "battery", hp: 60, hx: 0.38, hz: 0.38, h: 1.05 }];
// same layout on every machine: seeded from the map id, placed against walls, never in spawns
function opsPlaceProps(id) {
  let sd = 0; for (const ch of id) sd = (sd * 31 + ch.charCodeAt(0)) >>> 0; sd = sd || 7;
  const rnd = () => { sd ^= sd << 13; sd >>>= 0; sd ^= sd >>> 17; sd ^= sd << 5; sd >>>= 0; return sd / 4294967296; };
  for (let k = 0; k < 12; k++) rnd();
  const out = [], used = new Set(), cap = Math.min(26, Math.round(OPS_CELLS.open.length * 0.09));
  const cells = OPS_CELLS.open.slice(); for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  for (const [cx, cz] of cells) {
    if (out.length >= cap) break;
    const ch = OPS_MAP[cz][cx]; if (!".ab".includes(ch) || (OPS_RAMP && OPS_RAMP[cz * OG + cx])) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([a, b]) => used.has((cx + a) + "," + (cz + b)))) continue;
    const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => oWall(cx + a, cz + b)); if (!sides.length) continue;
    // a cell walled on two opposite sides is a corridor: leave it clear
    if (sides.length >= 2 && sides.some(([a, b]) => sides.some(([c, d]) => a === -c && b === -d))) continue;
    if (rnd() > 0.5) continue;
    const [dx, dz] = sides[Math.floor(rnd() * sides.length)], t = [0, 1, 0, 2, 0, 0, 1, 0, 2, 0][out.length % 10], P0 = OPROP[t];
    const off = CS / 2 - (dx ? P0.hx : P0.hz) - 0.12, slide = (rnd() - 0.5) * 1.6;
    out.push({ t, x: cx * CS + CS / 2 + dx * off + dz * slide, z: cz * CS + CS / 2 + dz * off + dx * slide, ry: Math.atan2(-dx, -dz), hx: P0.hx, hz: P0.hz, h: P0.h });
    used.add(cx + "," + cz);
  }
  // footprint is axis-aligned; swap extents when the prop is turned sideways
  out.forEach(p => { if (Math.abs(Math.sin(p.ry)) > 0.5) { const k = p.hx; p.hx = p.hz; p.hz = k; } });
  return out;
}
const OWH = 3.2;
function opsSetMap(id) {
  if (!OPS_MAPS[id]) id = "hq"; if (id === OPS_ID) return;
  OPS_ID = id; OPS_M = OPS_MAPS[id]; OPS_MAP = OPS_M.rows; OG = OPS_MAP.length;
  OPS_CELLS = { r: [], u: [], a: [], b: [], open: [], spawn: [], T: [], up: [] };
  if (OPS_M.up) OPS_M.up.rows.forEach((row, z) => [...row].forEach((ch, x) => { if (ch === ".") OPS_CELLS.up.push([x, z, 1]); }));
  OPS_MAP.forEach((row, z) => [...row].forEach((ch, x) => { if (ch !== "#" && ch !== "v") OPS_CELLS.open.push([x, z]); if (".rubaT".includes(ch)) OPS_CELLS.spawn.push([x, z]); if (OPS_CELLS[ch]) OPS_CELLS[ch].push([x, z]); }));
  opsBuildLevels();
  OPS_PROPS = opsPlaceProps(id); OPS_PALIVE = new Uint8Array(OPS_PROPS.length).fill(1);
  // boosters that throw you across open air: pad cell -> landing point (world metres)
  OPS_JUMP = {}; (OPS_M.jumps || []).forEach(([px, pz, tx, tz]) => { OPS_JUMP[pz * OG + px] = [tx * CS + CS / 2, tz * CS + CS / 2, tx, tz]; });
  Object.entries(OPS_M.upSites || {}).forEach(([k, cs]) => cs.forEach(([x, z]) => OPS_CELLS[k].push([x, z, 1])));   // sites on the upper floor
  if (!OPS_CELLS.a.length) { OPS_SITE = [[0, 0, 0], [0, 0, 0]]; return; }
  OPS_SITE = ["a", "b"].map(k => { const c = OPS_CELLS[k]; return [c.reduce((s, q) => s + q[0], 0) / c.length * CS + CS / 2, c.reduce((s, q) => s + q[1], 0) / c.length * CS + CS / 2, c[0][2] ? OPS_UPH : 0]; });
}
const cellC = ([x, z]) => [x * CS + CS / 2, z * CS + CS / 2];
// which bomb site ("a", "b" or null) someone stands in, feet at height jh: upstairs only the upper-floor sites count
// free-for-all spawns face the open side of the map: the heading with the longest clear view, pulled toward the middle
function opsSpawnYaw(x, z) {
  const mid = OG * CS / 2; let best = Math.random() * 6.28, bs = -1;
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, fx = -Math.sin(a), fz = -Math.cos(a);
    const d = OPS_ML ? mlRay([x, 1.5, z], [fx, 0, fz], 30) : oRay(x, z, fx, fz, 30), toMid = Math.hypot(mid - x, mid - z) || 1;
    const sc = Math.min(d, 30) + 8 * ((mid - x) * fx + (mid - z) * fz) / toMid + Math.random() * 2 - ([4, 8].some(r => (OPS_MAP[Math.floor((z + fz * r) / CS)] || "")[Math.floor((x + fx * r) / CS)] === "v") ? 25 : 0); if (sc > bs) { bs = sc; best = a; } }
  return best;
}
function opsSiteAt(x, z, jh) {
  const up = OPS_ML && OPS_M.up && (jh || 0) > OPS_UPH - 0.6, cx = Math.floor(x / CS), cz = Math.floor(z / CS);
  if (up) { for (const [k, cs] of Object.entries(OPS_M.upSites || {})) if (cs.some(([a, b]) => a === cx && b === cz)) return k; return null; }
  const ch = oCh(x, z); return ch === "a" || ch === "b" ? ch : null;
}
function oWall(cx, cz) { if (cx < 0 || cz < 0 || cx >= OG || cz >= OG) return true; return OPS_MAP[cz][cx] === "#"; }
function oCh(x, z) { const cx = Math.floor(x / CS), cz = Math.floor(z / CS); return oWall(cx, cz) ? "#" : OPS_MAP[cz][cx]; }
function oSolid(x, z, y) { if (OPS_ML) { const yy = y == null ? OPS_FEET + 1 : y; return mlHit(x, z, yy - 0.02, yy + 0.02); } return oWall(Math.floor(x / CS), Math.floor(z / CS)); }
// the Settings window: mouse and aim, video, sound, accessibility. Used in a match (⚙ Settings) and on the homepage.
function opsSettingsPanel() {
  const sp = document.createElement("div"); sp.className = "look-panel"; sp.hidden = true;
  sp.classList.add("set-modal");
  sp.innerHTML = '<header><div><span class="set-eyebrow">Neteam Friday Arcade</span><h4>Settings</h4></div><button type="button" class="set-x" data-close aria-label="Close">✕</button></header>' +
    '<div class="set-grid">' +
    '<section><h5>Mouse and aim</h5>' +
    '<label class="sl"><span>Sensitivity</span><b data-v></b><input type="range" min="0.3" max="3" step="0.1" data-k="s"></label>' +
    '<label class="sw"><span>Invert up/down <small>key I</small></span><input type="checkbox" data-k="iy"><i></i></label>' +
    '<label class="sw"><span>Invert left/right</span><input type="checkbox" data-k="ix"><i></i></label></section>' +
    '<section><h5>Video</h5>' +
    '<label class="sl"><span>Graphics</span><select data-q><option value="auto">Auto (fits this PC)</option><option value="ultra">Ultra</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Performance</option></select></label>' +
    '<label class="sl"><span>Resolution</span><b data-rv></b><input type="range" min="50" max="150" step="5" data-rs></label>' +
    '<label class="sw"><span>Show frame rate <small>key F8</small></span><input type="checkbox" data-fps><i></i></label></section>' +
    '<section><h5>Sound</h5>' +
    '<label class="sw"><span>Game sound</span><input type="checkbox" data-snd><i></i></label>' +
    '<label class="sl"><span>Volume</span><b data-vv></b><input type="range" min="0" max="100" step="5" data-vol></label></section>' +
    '<section><h5>Accessibility</h5>' +
    '<label class="sw"><span>Color-blind team colors <small>orange ▲ vs blue ■</small></span><input type="checkbox" data-cb><i></i></label></section>' +
    '</div>' +
    '<div class="set-keys"><span><kbd>WASD</kbd> move</span><span><kbd>Shift</kbd> walk</span><span><kbd>Space</kbd> jump</span><span><kbd>R</kbd> reload</span><span><kbd>1</kbd>–<kbd>5</kbd> weapons</span><span><kbd>Tab</kbd> scoreboard</span><span><kbd>Esc</kbd> free the mouse</span></div>' +
    '<footer><span class="hint">Saved on this device.</span><button type="button" class="btn primary" data-close>Done</button></footer>';
  const snd = sp.querySelector("[data-snd]"); snd.checked = SFX.on;
  snd.addEventListener("change", () => { SFX.on = snd.checked; store("nfa-sound", SFX.on); const sbn = $("#soundBtn"); if (sbn) sbn.textContent = SFX.on ? "🔊" : "🔇"; if (SFX.on) SFX.play("blip"); });
  const vI = sp.querySelector("[data-vol]"), vV = sp.querySelector("[data-vv]"); vI.value = Math.round(SFX.vol * 100); vV.textContent = vI.value + "%";
  vI.addEventListener("input", () => { vV.textContent = vI.value + "%"; SFX.setVol(+vI.value / 100); });
  vI.addEventListener("change", () => { if (SFX.on) SFX.play("blip"); });
  const fpx = sp.querySelector("[data-fps]"); fpx.checked = NX.perfOn(); fpx.addEventListener("change", () => NX.perfSet(fpx.checked));
  const cbx = sp.querySelector("[data-cb]"); cbx.checked = opsColorBlind();
  cbx.addEventListener("change", () => { store("nfa-cb", { on: cbx.checked }); opsApplyTeamColors(); toast(cbx.checked ? "Teams: orange ▲ vs blue ■" : "Teams: red vs blue"); });
  const rsI = sp.querySelector("[data-rs]"), rsV = sp.querySelector("[data-rv]"), rsShow = () => { rsV.textContent = rsI.value + "%"; };
  rsI.value = Math.round(((store("nfa-gfx") || {}).rs || (GFX.lowEnd() ? 0.75 : 1)) * 100); rsShow();
  rsI.addEventListener("input", () => { rsShow(); store("nfa-gfx", Object.assign(store("nfa-gfx") || {}, { rs: +rsI.value / 100 })); });
  const qs = sp.querySelector("[data-q]"); qs.value = (store("nfa-gfx") || {}).q || "auto";
  qs.addEventListener("change", () => { store("nfa-gfx", Object.assign(store("nfa-gfx") || {}, { q: qs.value })); toast("Graphics: " + qs.options[qs.selectedIndex].text + ". Applies from the next game."); });
  sp.addEventListener("mousedown", (e) => e.stopPropagation());
  sp.addEventListener("input", (e) => { const k = e.target.dataset.k; if (!k) return; const L = lookPrefs(); L[k] = k === "s" ? clamp(+e.target.value || 1, 0.3, 3) : e.target.checked; saveLookPrefs(L); syncLookPanel({ setPanel: sp }); });
  sp.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", () => { sp.hidden = true; }));
  syncLookPanel({ setPanel: sp });
  return sp;
}
function oBlocked(x, z, r = PR) { if (OPS_ML) { const lo = OPS_FEET + 0.55, hi = OPS_FEET + 1.7; return mlHit(x - r, z - r, lo, hi) || mlHit(x + r, z - r, lo, hi) || mlHit(x - r, z + r, lo, hi) || mlHit(x + r, z + r, lo, hi) || oPropBlock(x, z, r) >= 0 || (OPS_RAILS.length > 0 && mlRailBlock(x, z, r, OPS_FEET)); } return oSolid(x - r, z - r) || oSolid(x + r, z - r) || oSolid(x - r, z + r) || oSolid(x + r, z + r) || oPropBlock(x, z, r) >= 0 || oDeckBlocks(x, z, r, OPS_FEET); }
// raised decks in the jump arena: height of a cell, what you'd stand on, and whether a deck is a wall at your height
const DECK_H = { "1": 1.2, "2": 2.6 };
function oCellH(cx, cz) { if (cx < 0 || cz < 0 || cx >= OG || cz >= OG) return 0; return DECK_H[OPS_MAP[cz][cx]] || 0; }
function oHAt(x, z) { return oCellH(Math.floor(x / CS), Math.floor(z / CS)); }
// open air (Uplink): no floor at all. Below roof level the side of the tower is a wall
const OPS_DEEP = -99;
opsSetMap("hq");   // after DECK_H: the default map has storeys, so its collision is built now
// where the router sits when nobody has it: the map's "homes" (it alternates between them), else the T cells, else the middle
function opsRouterHomes() {
  if (OPS_M && OPS_M.homes) return OPS_M.homes.map(([cx, cz]) => [cx * CS + CS / 2, cz * CS + CS / 2]);
  const tc = OPS_CELLS.T.length ? OPS_CELLS.T : [[OG >> 1, OG >> 1]];
  return [[tc.reduce((a, q) => a + q[0], 0) / tc.length * CS + CS / 2, tc.reduce((a, q) => a + q[1], 0) / tc.length * CS + CS / 2]];
}
function oVoid(x, z) { return !!(OPS_M && OPS_M.sky) && oCh(x, z) === "v"; }
function oFloorAt(x, z) { return oVoid(x, z) ? OPS_DEEP : oHAt(x, z); }
function oDeckBlocks(x, z, r, feet) { if (!OPS_M || !OPS_M.open) return false; for (const [a, b] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (oFloorAt(x + a, z + b) > feet + 0.55) return true; return false; }
function oGround(x, z, r, feet) { let g = oPropTop(x, z, r, feet); if (OPS_ML) { for (const [a, b] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]]) g = Math.max(g, mlTop(x + a, z + b, feet)); return g; } if (!g && OPS_M && OPS_M.sky) g = OPS_DEEP; for (const [a, b] of [[-r, -r], [r, -r], [-r, r], [r, r]]) { const h = oFloorAt(x + a, z + b); if (h <= feet + 0.55 && h > g) g = h; } return g; }
// bots keep clear of the edge: a step that would put them near open air is not taken
function oMoveSafe(p, dx, dz) { if (!OPS_M || !OPS_M.sky) return oMove(p, dx, dz); const ox = p.x, oz = p.z; oMove(p, dx, dz); const m = 0.7; if (oVoid(p.x - m, p.z - m) || oVoid(p.x + m, p.z - m) || oVoid(p.x - m, p.z + m) || oVoid(p.x + m, p.z + m)) { p.x = ox; p.z = oz; } }
// 3D ray vs decks (slab test per deck cell along the way)
function oRayDecks(o, d, maxT) {
  if (!OPS_M || !OPS_M.open) return maxT; let best = maxT;
  for (let cz = 0; cz < OG; cz++) for (let cx = 0; cx < OG; cx++) {
    const h = oCellH(cx, cz); if (!h) continue; const lo = [cx * CS, 0, cz * CS], hi = [cx * CS + CS, h, cz * CS + CS];
    let t0 = 0, t1 = best, ok = true;
    for (let k = 0; k < 3 && ok; k++) { if (Math.abs(d[k]) < 1e-8) { if (o[k] < lo[k] || o[k] > hi[k]) ok = false; continue; } let a = (lo[k] - o[k]) / d[k], b = (hi[k] - o[k]) / d[k]; if (a > b) { const q = a; a = b; b = q; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) ok = false; }
    if (ok && t0 < best) best = t0;
  }
  return best;
}
// ---------------- multi-level maps (real floors, stairs, ceilings) ----------------
// A map with `up: { h, rows, ceil }` has a second storey: h = its floor height, rows = its own grid
// ("#" wall, "." floor slab, " " open air / atrium), ceil = its room height. `stairs: [[cx, cz, dx, dz, n]]` are
// runs of n cells from (cx, cz) heading (dx, dz) that climb from the ground to the upper floor; the cell after
// the run is the landing. Every cell then holds solid spans [bottom, top] in metres, and moving, standing,
// jumping, shooting and seeing are all tested against those spans. Maps without these keys use the old 2D rules.
function opsBuildLevels() {
  const U = OPS_M.up; OPS_ML = !!(U || OPS_M.stairs); OPS_SP = null; OPS_RAMP = null; OPS_UPH = U ? U.h : 0; OPS_RAILS = []; OPS_FURN = []; if (!OPS_ML) return;
  const H = OPS_UPH, roof = U ? H + (U.ceil || 3.6) : ML_TOP;
  OPS_SP = new Array(OG * OG); OPS_RAMP = new Array(OG * OG).fill(null);
  for (let cz = 0; cz < OG; cz++) for (let cx = 0; cx < OG; cx++) {
    const ch = OPS_MAP[cz][cx], u = U ? (U.rows[cz] || "")[cx] || " " : " ", sp = [];
    if (ch === "#") sp.push([-1, U ? H : ML_TOP]); else if (ch !== "v") sp.push([-1, DECK_H[ch] || 0]);
    if (U) { if (u === "#") sp.push([H - ML_SLAB, roof + 0.5]); else { if (u !== " ") sp.push([H - ML_SLAB, H]); sp.push([roof, roof + 0.5]); } }
    OPS_SP[cz * OG + cx] = sp;
  }
  (OPS_M.stairs || []).forEach(([cx, cz, dx, dz, n]) => {
    // where the run starts (its low edge) along its axis, and which way is up
    const ax = dx ? 0 : 2, dir = dx || dz, edge = dx ? (dx > 0 ? cx * CS : (cx + 1) * CS) : (dz > 0 ? cz * CS : (cz + 1) * CS);
    for (let k = 0; k < n; k++) { const x = cx + dx * k, z = cz + dz * k; OPS_RAMP[z * OG + x] = { ax, dir, edge, len: n * CS, h: H }; }
  });
  // glass balustrades (the world generator draws the same ones): round every opening in the upper floor, except where a
  // stair arrives, and down the open sides of each stair. A rail is an edge on the cell grid: fixed coordinate e on axis
  // ax (0 = a line of constant x), running a0..a1 on the other axis, standing on lo0..lo1 along it
  OPS_RAILS = []; OPS_FURN = opsFurniture(OPS_M); if (!U) return;
  const up = (x, z) => x < 0 || z < 0 || x >= OG || z >= OG ? "#" : (U.rows[z] || "")[x] || "#", gr = (x, z) => x < 0 || z < 0 || x >= OG || z >= OG ? "#" : OPS_MAP[z][x];
  const runs = (OPS_M.stairs || []).map(([cx, cz, dx, dz, n]) => ({ cx, cz, dx, dz, n })), inRun = (x, z) => runs.find(r => { for (let k = 0; k < r.n; k++) if (r.cx + r.dx * k === x && r.cz + r.dz * k === z) return true; return false; });
  for (let z = 0; z < OG; z++) for (let x = 0; x < OG; x++) {
    if (up(x, z) !== " ") continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz, r = inRun(x, z); if (up(nx, nz) !== "." || (r && r.cx + r.dx * r.n === nx && r.cz + r.dz * r.n === nz)) continue;
      if (dx) OPS_RAILS.push({ ax: 0, e: (dx > 0 ? x + 1 : x) * CS, a0: z * CS, a1: (z + 1) * CS, lo0: H, lo1: H }); else OPS_RAILS.push({ ax: 2, e: (dz > 0 ? z + 1 : z) * CS, a0: x * CS, a1: (x + 1) * CS, lo0: H, lo1: H }); }
  }
  for (const r of runs) for (let k = 0; k < r.n; k++) { const x = r.cx + r.dx * k, z = r.cz + r.dz * k, along = r.dx !== 0;
    for (const sg of [-1, 1]) { const sx = along ? x : x + sg, sz = along ? z + sg : z; if (gr(sx, sz) === "#" || inRun(sx, sz)) continue;
      // the rail stands on the stair: its foot rises with the flight
      const lowEnd = along ? (r.dx > 0 ? x * CS : (x + 1) * CS) : (r.dz > 0 ? z * CS : (z + 1) * CS), dir = r.dx || r.dz, h0 = k / r.n * H, h1 = (k + 1) / r.n * H;
      const a0 = lowEnd, a1 = lowEnd + dir * CS, rail = along ? { ax: 2, e: (sg > 0 ? z + 1 : z) * CS } : { ax: 0, e: (sg > 0 ? x + 1 : x) * CS };
      OPS_RAILS.push(Object.assign(rail, a0 < a1 ? { a0, a1, lo0: h0, lo1: h1 } : { a0: a1, a1: a0, lo0: h1, lo1: h0 })); } }
}
// fixed furniture upstairs: desks with screens against the walls of the offices. The world generator draws exactly these
// boxes (office theme) and they are solid to walking, shots and sight. Same layout on every machine (seeded by the map).
function opsFurniture(M) {
  const U = M && M.up; if (!U) return [];
  const G = M.rows.length, up = (x, z) => x < 0 || z < 0 || x >= G || z >= G ? "#" : (U.rows[z] || "")[x] || "#", N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let sd = 0; for (const ch of "desks:" + M.n) sd = (sd * 31 + ch.charCodeAt(0)) >>> 0; sd = sd || 7;
  const rnd = () => { sd ^= sd << 13; sd >>>= 0; sd ^= sd >>> 17; sd ^= sd << 5; sd >>>= 0; return sd / 4294967296; };
  const out = [], stairTop = new Set((M.stairs || []).map(([cx, cz, dx, dz, n]) => (cx + dx * n) + "," + (cz + dz * n)));
  for (let z = 0; z < G; z++) for (let x = 0; x < G; x++) {
    const r1 = rnd(), r2 = rnd(), r3 = rnd(); if (up(x, z) !== "." || stairTop.has(x + "," + z)) continue;
    if (N4.some(([a, b]) => up(x + a, z + b) === " ")) continue;   // the gallery round the atrium stays clear
    const walls = N4.filter(([a, b]) => up(x + a, z + b) === "#"); if (!walls.length || walls.length >= 3) continue;
    if (walls.length === 2 && walls[0][0] === -walls[1][0] && walls[0][1] === -walls[1][1]) continue;   // corridor
    if (r1 > 0.62) continue;
    const [dx, dz] = walls[Math.floor(r2 * walls.length)], off = CS / 2 - 0.42, mx = x * CS + CS / 2 + dx * off, mz = z * CS + CS / 2 + dz * off, hw = dx ? 0.4 : 0.9, hd = dx ? 0.9 : 0.4;
    out.push({ x0: mx - hw, x1: mx + hw, z0: mz - hd, z1: mz + hd, y0: U.h, y1: U.h + 0.76, dx, dz, cx: x, cz: z, s: r3 });
  }
  return out;
}
function mlFurnAt(x, z, lo, hi) { for (const f of OPS_FURN) if (x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1 && f.y0 < hi && f.y1 > lo) return f; return null; }
function mlFurnRay(o, d, maxT) {
  let best = maxT;
  for (const f of OPS_FURN) { let tn = 0, tf = best; const lo = [f.x0, f.y0, f.z0], hi = [f.x1, f.y1, f.z1];
    for (let a = 0; a < 3 && tn <= tf; a++) { if (Math.abs(d[a]) < 1e-9) { if (o[a] < lo[a] || o[a] > hi[a]) tn = Infinity; continue; } let u = (lo[a] - o[a]) / d[a], v = (hi[a] - o[a]) / d[a]; if (u > v) { const q = u; u = v; v = q; } tn = Math.max(tn, u); tf = Math.min(tf, v); }
    if (tn <= tf && tn < best) best = tn; }
  return best;
}
// does a balustrade stand in the way of someone of radius r at (x, z) with their feet at `feet`
function mlRailBlock(x, z, r, feet) {
  for (const q of OPS_RAILS) { const u = q.ax ? z : x, v = q.ax ? x : z; if (Math.abs(u - q.e) >= r || v + r <= q.a0 || v - r >= q.a1) continue;
    const t = Math.max(0, Math.min(1, (v - q.a0) / (q.a1 - q.a0))), lo = q.lo0 + (q.lo1 - q.lo0) * t; if (feet < lo + 0.9 && feet + 1.7 > lo) return true; }
  return false;
}
// height of the stair surface at a point (-1 if there are no stairs there)
function mlRampH(x, z) {
  const cx = Math.floor(x / CS), cz = Math.floor(z / CS); if (cx < 0 || cz < 0 || cx >= OG || cz >= OG) return -1; const r = OPS_RAMP[cz * OG + cx]; if (!r) return -1;
  const d = ((r.ax ? z : x) - r.edge) * r.dir; return clamp(d / r.len, 0, 1) * r.h;
}
function mlSpans(x, z) { const cx = Math.floor(x / CS), cz = Math.floor(z / CS); if (cx < 0 || cz < 0 || cx >= OG || cz >= OG) return null; return OPS_SP[cz * OG + cx]; }
// the highest surface at a point that someone with their feet at `feet` can stand on (step included)
function mlTop(x, z, feet) {
  const sp = mlSpans(x, z); if (!sp) return ML_TOP; let g = OPS_DEEP;
  for (const [a, b] of sp) if (b <= feet + 0.55 && b > g) g = b;
  const rh = mlRampH(x, z); if (rh >= 0 && rh <= feet + 0.55 && rh > g) g = rh; if (OPS_FURN.length) for (const f of OPS_FURN) if (x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1 && f.y1 <= feet + 0.55 && f.y1 > g) g = f.y1; return g;
}
// is anything solid between heights lo and hi at this point
function mlHit(x, z, lo, hi) {
  const sp = mlSpans(x, z); if (!sp) return true; if (OPS_FURN.length && mlFurnAt(x, z, lo, hi)) return true;
  for (const [a, b] of sp) if (a < hi && b > lo) return true;
  return mlRampH(x, z) > lo;
}
// the lowest ceiling above someone standing at `feet`
function mlCeil(x, z, feet) { const sp = mlSpans(x, z); if (!sp) return feet; let c = ML_TOP; for (const [a] of sp) if (a > feet + 0.55 && a < c) c = a; return c; }
function mlCeilR(x, z, r, feet) { let c = ML_TOP; for (const [a, b] of [[-r, -r], [r, -r], [-r, r], [r, r]]) c = Math.min(c, mlCeil(x + a, z + b, feet)); return c; }
// a straight 3D ray against floors, walls, slabs and stairs: distance to the first hit (maxT if none)
function mlRay(o, d, maxT) { return mlRayW(o, d, OPS_FURN.length ? mlFurnRay(o, d, maxT) : maxT); }
function mlRayW(o, d, maxT) {
  const h = Math.hypot(d[0], d[2]); let cx = Math.floor(o[0] / CS), cz = Math.floor(o[2] / CS);
  const sx = d[0] > 0 ? 1 : -1, sz = d[2] > 0 ? 1 : -1;
  const tdx = Math.abs(d[0]) > 1e-9 ? Math.abs(CS / d[0]) : Infinity, tdz = Math.abs(d[2]) > 1e-9 ? Math.abs(CS / d[2]) : Infinity;
  let tmx = Math.abs(d[0]) > 1e-9 ? (d[0] > 0 ? (cx + 1) * CS - o[0] : o[0] - cx * CS) / Math.abs(d[0]) : Infinity;
  let tmz = Math.abs(d[2]) > 1e-9 ? (d[2] > 0 ? (cz + 1) * CS - o[2] : o[2] - cz * CS) / Math.abs(d[2]) : Infinity;
  let t0 = 0;
  for (let k = 0; k < 260 && t0 < maxT; k++) {
    const t1 = Math.min(tmx, tmz, maxT);
    if (cx < 0 || cz < 0 || cx >= OG || cz >= OG) return t0;
    const sp = OPS_SP[cz * OG + cx], y0 = o[1] + d[1] * t0; let hitT = Infinity;
    for (const [a, b] of sp) {
      // the part of [t0, t1] where the ray's height is inside [a, b]; the nearest such entry wins
      let ta = t0, tb = t1;
      if (Math.abs(d[1]) < 1e-9) { if (y0 < a || y0 > b) continue; }
      else { let u = (a - o[1]) / d[1], v = (b - o[1]) / d[1]; if (u > v) { const q = u; u = v; v = q; } ta = Math.max(ta, u); tb = Math.min(tb, v); if (ta > tb) continue; }
      if (ta < hitT) hitT = ta;
    }
    if (hitT < Infinity) return Math.max(0, hitT);
    const r = OPS_RAMP[cz * OG + cx];
    if (r) { // stairs: the ray's height minus the stair height is linear across the cell, so solve for where it crosses
      const f = (t) => o[1] + d[1] * t - mlRampH(o[0] + d[0] * t, o[2] + d[2] * t), f0 = f(t0), f1 = f(t1);
      if (f0 <= 0) return t0; if (f1 <= 0) return t0 + (t1 - t0) * f0 / (f0 - f1);
    }
    if (t1 >= maxT) return maxT;
    if (tmx < tmz) { cx += sx; t0 = tmx; tmx += tdx; } else { cz += sz; t0 = tmz; tmz += tdz; }
  }
  return maxT;
}
function oSee(ax, ay, az, bx, by, bz) {
  if (OPS_ML) { const d = [bx - ax, by - ay, bz - az], L = Math.hypot(d[0], d[1], d[2]) || 1e-6; return mlRay([ax, ay, az], [d[0] / L, d[1] / L, d[2] / L], L) >= L - 0.3; }
  if (!oLOS(ax, az, bx, bz)) return false; if (!OPS_M || !OPS_M.open) return true;
  const d = [bx - ax, by - ay, bz - az], L = Math.hypot(d[0], d[1], d[2]) || 1e-6; return oRayDecks([ax, ay, az], [d[0] / L, d[1] / L, d[2] / L], L) >= L - 0.3;
}
// a box is a wall only when its top is above the step you can make; under you it is the floor (until someone breaks it)
function oPropBlock(x, z, r) { for (let i = 0; i < OPS_PROPS.length; i++) { const p = OPS_PROPS[i]; if (OPS_PALIVE[i] && p.h > OPS_FEET + OPS_STEP && Math.abs(x - p.x) < p.hx + r && Math.abs(z - p.z) < p.hz + r) return i; } return -1; }
function oPropTop(x, z, r, feet) { let g = 0; for (let i = 0; i < OPS_PROPS.length; i++) { const p = OPS_PROPS[i]; if (OPS_PALIVE[i] && p.h <= feet + OPS_STEP + 0.001 && p.h > g && Math.abs(x - p.x) < p.hx + r * 0.6 && Math.abs(z - p.z) < p.hz + r * 0.6) g = p.h; } return g; }
function oPropAt(x, z, r) { for (let i = 0; i < OPS_PROPS.length; i++) { const p = OPS_PROPS[i]; if (OPS_PALIVE[i] && Math.abs(x - p.x) < p.hx + r && Math.abs(z - p.z) < p.hz + r) return i; } return -1; }
// ray vs the standing props (3D slab test); returns [t, index] of the nearest hit before maxT
// glass panes of the current map, taken from the world generator (every glass quad; the two faces of a screen are one pane).
// {c centre, n normal, u/v unit edges, hu/hv half sizes, a area, r: [[material, first vertex, vertex count], ...]}
let OPS_PANES = [], OPS_PANES_ID = "", OPS_PGONE = new Uint8Array(0);
function opsPanesEnsure(W) {
  if (OPS_PANES_ID === OPS_ID && (!W || OPS_PANES.src === W.sig)) return;
  OPS_PANES = []; OPS_PANES_ID = OPS_ID; OPS_PGONE = new Uint8Array(0);
  if (!OPS_M || typeof NXW === "undefined" || !NXW.themes[OPS_M.nx || OPS_M.theme]) return;
  try { W = W || NXW.build(OPS_ID, OPS_M, { tex: NX_TEX }); } catch (e) { console.warn("[ops] no glass panes:", e && e.message); return; }
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (const [key, s0, cnt, P, U, V] of W.panes || []) {
    const lu = Math.hypot(U[0], U[1], U[2]), lv = Math.hypot(V[0], V[1], V[2]); if (lu < 0.05 || lv < 0.05) continue;
    const c = [P[0] + (U[0] + V[0]) / 2, P[1] + (U[1] + V[1]) / 2, P[2] + (U[2] + V[2]) / 2], u = U.map(x => x / lu), v = V.map(x => x / lv);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const same = OPS_PANES.find(q => Math.hypot(q.c[0] - c[0], q.c[1] - c[1], q.c[2] - c[2]) < 0.3 && Math.abs(dot(q.n, n)) > 0.9 && Math.abs(q.a - lu * lv) < 0.3);
    if (same) same.r.push([key, s0, cnt]); else OPS_PANES.push({ c, n, u, v, hu: lu / 2, hv: lv / 2, a: lu * lv, r: [[key, s0, cnt]] });
  }
  // a strip lying on a bigger pane (frosting on a glass wall) goes with it
  OPS_PANES.sort((a, b) => b.a - a.a);
  for (let i = OPS_PANES.length - 1; i > 0; i--) { const q = OPS_PANES[i];
    const big = OPS_PANES.slice(0, i).find(B => { if (Math.abs(dot(B.n, q.n)) < 0.9) return false; const r = [q.c[0] - B.c[0], q.c[1] - B.c[1], q.c[2] - B.c[2]]; return Math.abs(dot(r, B.n)) < 0.08 && Math.abs(dot(r, B.u)) < B.hu && Math.abs(dot(r, B.v)) < B.hv; });
    if (big) { big.r.push(...q.r); OPS_PANES.splice(i, 1); } }
  OPS_PANES.src = W.sig; OPS_PGONE = new Uint8Array(OPS_PANES.length);
}
// first unbroken pane along a ray, up to a little past maxT (glass sits just behind the face a bullet stops at): [t, pane or -1]
function oRayPanes(o, d, maxT) {
  let bt = maxT + 0.4, bi = -1;
  for (let k = 0; k < OPS_PANES.length; k++) {
    if (OPS_PGONE[k]) continue; const q = OPS_PANES[k], dn = d[0] * q.n[0] + d[1] * q.n[1] + d[2] * q.n[2]; if (Math.abs(dn) < 1e-4) continue;
    const t = ((q.c[0] - o[0]) * q.n[0] + (q.c[1] - o[1]) * q.n[1] + (q.c[2] - o[2]) * q.n[2]) / dn; if (t <= 0.05 || t >= bt) continue;
    const r = [o[0] + d[0] * t - q.c[0], o[1] + d[1] * t - q.c[1], o[2] + d[2] * t - q.c[2]];
    if (Math.abs(r[0] * q.u[0] + r[1] * q.u[1] + r[2] * q.u[2]) > q.hu || Math.abs(r[0] * q.v[0] + r[1] * q.v[1] + r[2] * q.v[2]) > q.hv) continue;
    bt = t; bi = k;
  }
  return [bt, bi];
}
function oRayProps(o, d, maxT) {
  let best = maxT, bi = -1;
  for (let i = 0; i < OPS_PROPS.length; i++) {
    if (!OPS_PALIVE[i]) continue; const p = OPS_PROPS[i], lo = [p.x - p.hx, 0, p.z - p.hz], hi = [p.x + p.hx, p.h, p.z + p.hz];
    let t0 = 0, t1 = best, ok = true;
    for (let k = 0; k < 3 && ok; k++) {
      if (Math.abs(d[k]) < 1e-8) { if (o[k] < lo[k] || o[k] > hi[k]) ok = false; continue; }
      let a = (lo[k] - o[k]) / d[k], b = (hi[k] - o[k]) / d[k]; if (a > b) { const q = a; a = b; b = q; }
      t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) ok = false;
    }
    if (ok && t0 < best) { best = t0; bi = i; }
  }
  return [best, bi];
}
function oSolidAt(x, z, r) { return oSolid(x - r, z - r) || oSolid(x + r, z - r) || oSolid(x - r, z + r) || oSolid(x + r, z + r); }
// already overlapping a prop (spawned on one, or it reappeared on you)? walls only until you step clear
function oMove(p, dx, dz) { const f = oPropBlock(p.x, p.z, PR) >= 0 ? oSolidAt : oBlocked; if (!f(p.x + dx, p.z, PR)) p.x += dx; if (!f(p.x, p.z + dz, PR)) p.z += dz; }
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
// line of sight to the centre of someone or to either shoulder (a peek round a corner)
function oLOSw(ax, az, bx, bz) { if (oLOS(ax, az, bx, bz)) return true; const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz) || 1, px = -dz / d * 0.3, pz = dx / d * 0.3; return oLOS(ax, az, bx + px, bz + pz) || oLOS(ax, az, bx - px, bz - pz); }
function oLOS(ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz); if (d < 0.01) return true; return oRay(ax, az, dx / d, dz / d, d) >= d - 0.05; }
// which floor someone is on (0 ground, 1 upper); stairs count as the ground floor's
function mlLevel(x, z, jh) { if (!OPS_ML || !OPS_UPH) return 0; const c = Math.floor(z / CS) * OG + Math.floor(x / CS); return !OPS_RAMP[c] && (jh || 0) > OPS_UPH * 0.6 ? 1 : 0; }
// breadth-first search over (cell, floor) nodes: ground cells, upper slab cells, and stair runs joining them
function mlPath(sx, sz, sl, tx, tz, tl) {
  const N = OG * OG, U = OPS_M.up, start = sl * N + sz * OG + sx, goal = tl * N + tz * OG + tx; if (start === goal) return [];
  const walk = (l, x, z) => { if (x < 0 || z < 0 || x >= OG || z >= OG) return false; if (l) return !!U && U.rows[z][x] === "."; return !oWall(x, z) && !oCellH(x, z) && OPS_MAP[z][x] !== "v"; };
  const prev = new Int32Array(2 * N).fill(-1); prev[start] = start; const q = [start];
  for (let h = 0; h < q.length; h++) {
    const c = q[h]; if (c === goal) break; const l = c >= N ? 1 : 0, cc = c - l * N, x = cc % OG, z = (cc / OG) | 0, r = OPS_RAMP[cc];
    const add = (n) => { if (prev[n] === -1) { prev[n] = c; q.push(n); } };
    if (r) { // on a stair run: only up or down it (the top step leads onto the landing upstairs)
      const st = (OPS_M.stairs || []).find(([ax, az, dx, dz, n]) => { for (let k = 0; k < n; k++) if (ax + dx * k === x && az + dz * k === z) return true; return false; });
      if (st) { const [ax, az, dx, dz, n] = st, k = dx ? (x - ax) / dx : (z - az) / dz;
        if (k + 1 < n) add((z + dz) * OG + x + dx); else if (walk(1, x + dx, z + dz)) add(N + (z + dz) * OG + x + dx);
        if (k > 0) add((z - dz) * OG + x - dx); else if (walk(0, x - dx, z - dz)) add((z - dz) * OG + x - dx); }
      continue;
    }
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ax, nz = z + az; if (nx < 0 || nz < 0 || nx >= OG || nz >= OG) continue; const nr = OPS_RAMP[nz * OG + nx];
      if (nr) { // step onto a stair run only at its ends
        const st = (OPS_M.stairs || []).find(([bx, bz, dx, dz, n]) => (!l && bx - dx === x && bz - dz === z && bx === nx && bz === nz) || (l && bx + dx * n === x && bz + dz * n === z && bx + dx * (n - 1) === nx && bz + dz * (n - 1) === nz));
        if (st) add(nz * OG + nx); continue;
      }
      if (walk(l, nx, nz)) add(l * N + nz * OG + nx);
    }
  }
  if (prev[goal] === -1) return [];
  const out = []; for (let c = goal; c !== start; c = prev[c]) { const cc = c % N; out.push([cc % OG, (cc / OG) | 0]); } return out.reverse();
}
function oPath(sx, sz, tx, tz, sl, tl) {
  if (OPS_ML) return mlPath(sx, sz, sl || 0, tx, tz, tl || 0);
  const start = sz * OG + sx, goal = tz * OG + tx; if (start === goal) return [];
  const prev = new Int16Array(OG * OG).fill(-1); prev[start] = start; const q = [start];
  for (let h = 0; h < q.length; h++) {
    const c = q[h]; if (c === goal) break; const x = c % OG, z = (c / OG) | 0, J = OPS_JUMP[c];
    if (J) { const n = J[3] * OG + J[2]; if (prev[n] === -1) { prev[n] = c; q.push(n); } continue; }
    for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ax, nz = z + az; if (oWall(nx, nz) || oCellH(nx, nz) || OPS_MAP[nz][nx] === "v") continue; const n = nz * OG + nx; if (prev[n] !== -1) continue; prev[n] = c; q.push(n); }
  }
  if (prev[goal] === -1) return [];
  const out = []; for (let c = goal; c !== start; c = prev[c]) out.push([c % OG, (c / OG) | 0]); return out.reverse();
}
// weapons
// slot: 1 primary, 2 pistol, 3 knife. snd: sound profile. vm: view-model [length, height, barrel]
const OW = [
  { id: "pistol", n: "Ping Pistol", short: "PISTOL", slot: 2, cost: 0, dmg: 26, hs: 2.3, rate: 0.26, mag: 12, rl: 1.5, spr: 0.01, mv: 0.035, range: 50, spd: 1, auto: false, kick: 0.018, col: "#f5f1e6", snd: "pistol", kill: 300, vm: [0.32, 0.12, 0.12], d: "Free sidearm" },
  { id: "smg", n: "Packet SMG", short: "SMG", slot: 1, cost: 1200, dmg: 19, hs: 1.8, rate: 0.08, mag: 30, rl: 2.0, spr: 0.028, mv: 0.02, range: 38, spd: 1.04, auto: true, kick: 0.008, col: "#4cc9f0", snd: "smg", kill: 600, vm: [0.5, 0.13, 0.18], d: "Fast fire, run-and-gun" },
  { id: "rifle", n: "Fiber Rifle", short: "RIFLE", slot: 1, cost: 2700, dmg: 34, hs: 3.6, rate: 0.1, mag: 30, rl: 2.4, spr: 0.011, mv: 0.06, range: 75, spd: 0.93, auto: true, kick: 0.012, col: "#ffd23f", snd: "rifle", kill: 300, vm: [0.7, 0.14, 0.3], d: "One-tap headshots" },
  { id: "sniper", n: "Zero-Day Sniper", short: "SNIPER", slot: 1, cost: 4750, dmg: 115, hs: 2, ap: 0.85, fo: 6, rate: 1.4, mag: 5, rl: 3.4, spr: 0.0015, mv: 0.14, range: 120, spd: 0.84, auto: false, kick: 0.05, col: "#ff7ac6", snd: "sniper", kill: 100, scope: true, vm: [0.95, 0.12, 0.45], d: "One shot, one kill · scope" },
  { id: "knife", n: "Patch Knife", short: "KNIFE", slot: 3, cost: 0, dmg: 34, hs: 1, rate: 0.42, mag: 0, rl: 0, spr: 0, mv: 0, range: 2.3, spd: 1.1, auto: true, kick: 0, col: "#9da1a9", snd: "knife", kill: 1500, melee: true, vm: [0.28, 0.04, 0], d: "Always carried · stab from behind" },
  { id: "shotgun", n: "Root Shotgun", short: "SHOTGUN", slot: 1, cost: 1100, dmg: 16, hs: 1.5, rate: 0.85, mag: 7, rl: 3.0, spr: 0.075, mv: 0.02, range: 20, spd: 0.97, auto: false, kick: 0.04, col: "#ff6b57", snd: "shotgun", kill: 900, pel: 8, vm: [0.75, 0.13, 0.32], d: "Devastating up close" },
  { id: "deagle", n: "Kernel Magnum", short: "MAGNUM", slot: 2, cost: 700, dmg: 54, hs: 2.4, rate: 0.48, mag: 7, rl: 2.2, spr: 0.014, mv: 0.06, range: 60, spd: 0.98, auto: false, kick: 0.045, col: "#c084fc", snd: "heavy", kill: 300, vm: [0.38, 0.14, 0.14], d: "Heavy pistol, headshot kills" },
  { id: "carbine", n: "Proxy Carbine", short: "CARBINE", slot: 1, cost: 2100, dmg: 25, hs: 3.2, rate: 0.095, mag: 25, rl: 2.2, spr: 0.015, mv: 0.045, range: 65, spd: 0.97, auto: true, kick: 0.01, col: "#3ddc97", snd: "carbine", kill: 300, vm: [0.62, 0.13, 0.24], d: "Cheaper rifle" },
  { id: "lmg", n: "Botnet LMG", short: "LMG", slot: 1, cost: 5000, dmg: 30, hs: 2.4, rate: 0.088, mag: 100, rl: 5.0, spr: 0.026, mv: 0.06, range: 70, spd: 0.8, auto: true, kick: 0.009, col: "#ff9f1c", snd: "lmg", kill: 300, vm: [0.85, 0.17, 0.3], d: "100 rounds, very slow" },
  { id: "scout", n: "Spoof Scout", short: "SCOUT", slot: 1, cost: 1700, dmg: 76, hs: 2.6, ap: 0.5, fo: 4, rate: 1.15, mag: 10, rl: 2.8, spr: 0.002, mv: 0.05, range: 110, spd: 0.99, auto: false, kick: 0.04, col: "#9fd8ff", snd: "scout", kill: 300, scope: true, vm: [0.85, 0.11, 0.38], d: "Light sniper, move fast" },
  { id: "rocket", n: "Packet Launcher", short: "ROCKET", slot: 1, cost: 0, dmg: 100, hs: 1, rate: 0.8, mag: 5, rl: 2.6, spr: 0, mv: 0, range: 120, spd: 0.95, auto: false, kick: 0.06, col: "#ff6a1a", snd: "rocket", kill: 300, rocket: true, vm: [0.8, 0.2, 0.3], d: "Splash damage · rocket jumps" },
  { id: "laser", n: "Photon Laser", short: "LASER", slot: 1, cost: 0, dmg: 100, hs: 1, rate: 0.85, mag: 99, rl: 0, spr: 0, mv: 0, range: 160, spd: 1.05, auto: true, kick: 0.025, col: "#ff3df0", snd: "laser", kill: 300, laser: true, vm: [0.72, 0.14, 0.34], d: "One hit, one kill" },
];
// spare rounds each gun carries besides the one in the magazine. Reloading takes from them; when they're gone, it's the pistol or the knife
const OW_RES = [36, 90, 90, 15, 0, 24, 21, 75, 200, 30, 10, 0]; OW.forEach((w, k) => { w.res = OW_RES[k] || 0; });
// damage rules shared by the host (real damage) and the shooter's screen (the numbers that pop up), so they always agree
function opsFall(W, dd) { return !W || W.melee || W.laser ? 1 : clamp(1.15 - dd / (W.range * (W.fo || 1.6)), 0.55, 1); }
function opsArmor(W, dmg, head, arm) { return arm > 0 ? Math.min(arm, dmg * (head ? 0.12 : 0.45) * (1 - ((W && W.ap) || 0))) : 0; }
const OW_PRIMARY = [1, 5, 7, 2, 9, 3, 8], OW_PISTOL = [0, 6], KNIFE = 4, ROCKET = 10, LASER = 11, ARMOR_IT = 20;
const OW_BUY = [6, 1, 5, 7, 2, 9, 3, 8];
const ARMOR_COST = 650;
// grenades: thrown with 4/G (frag) and 5 (smoke); one of each, bought in the armory (free on spawn in free-for-all)
const FRAG_IT = 21, SMOKE_IT = 22, NADE_COST = 300;
// Breach: a bought gun comes with a full load; after that its ammo doesn't refill by itself; buy more each round
const AMMO_IT = 23, AMMO_COST = 200;
const itemCost = (it) => it === ARMOR_IT ? ARMOR_COST : it === FRAG_IT || it === SMOKE_IT ? NADE_COST : it === AMMO_IT ? AMMO_COST : OW[it].cost;
let OPS_SMOKES = [];
// does a smoke cloud sit between a and b? (bots can't see through smoke)
function oSmoked(ax, az, bx, bz) {
  for (const s of OPS_SMOKES) { if (s.age < 0.8) continue; const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1e-6, t = clamp(((s.x - ax) * dx + (s.z - az) * dz) / L, 0, 1); if (Math.hypot(ax + dx * t - s.x, az + dz * t - s.z) < 3.1) return true; }
  return false;
}
const TEAM = [{ n: "IT Team", short: "IT", hex: "#ff4d5e", sub: "Attackers · pen testers", cols: [0, 6, 5, 1, 7] }, { n: "Business", short: "BIZ", hex: "#3fa9ff", sub: "Defenders · the boardroom", cols: [3, 8, 4, 2, 9] }];
// team colours: strong red/blue by default; colour-blind mode swaps red for orange and adds shapes (▲ red side, ■ blue side)
function opsColorBlind() { return !!(store("nfa-cb") || {}).on; }
function opsApplyTeamColors() { const cb = opsColorBlind(); TEAM[0].hex = cb ? "#ffa31a" : "#ff2d3f"; TEAM[1].hex = cb ? "#2f7dff" : "#1f8fff"; }
opsApplyTeamColors();
const OPS_ANN = ["", "IT Team eliminated", "Business eliminated", "Time ran out", "Payload defused", "Payload detonated"];
const OPS_EXTRA_BOTS = ["Kernel Bot", "Proxy Bot", "Daemon Bot", "Sudo Bot", "Root Bot", "Packet Bot", "Byte Bot", "Cron Bot", "Hash Bot", "Socket Bot"];

// each player's colour comes from their side, in roster order (the host and every client work it out the same way)
function opsTeamCols(ro, tms) { const used = [0, 0]; ro.forEach((r, i) => { const t = tms[i] ? 1 : 0, cols = TEAM[t].cols; r.col = cols[used[t]++ % cols.length]; r.hex = PALETTE[r.col]; }); }

function makeOps(md) {
  // md: "team" Breach, "ffa" Deathmatch, "trophy" Golden Router, "laser" Laser Arena, "capture" Capture the Router (lasers + the router)
  const team = md === "team", gold = md === "trophy", cap = md === "capture", troph = gold || cap, laser = md === "laser" || cap, arena = troph || laser;
  return {
    id: team ? "breach" : cap ? "capture" : troph ? "golden" : laser ? "laser" : "deathmatch",
    title: team ? "Breach Protocol" : cap ? "Capture the Router" : troph ? "Golden Router" : laser ? "Laser Arena" : "Zero-Day Deathmatch",
    tag: team ? "IT vs Business · 3D" : cap ? "Lasers + hold the router · 3D" : troph ? "Jump arena · hold the trophy · 3D" : laser ? "Lasers + grappling hook · 3D" : "Free-for-all shooter · 3D",
    blurb: team ? "Red plants the payload. Blue stops it. First to 7 rounds." : cap ? "One-hit lasers. Grab the router and hold it. First to 60 seconds held wins." : troph ? "Grab the Golden Router and keep it. First to 90 seconds held wins." : laser ? "Every hit kills. Hook, jump and fly. First to 25 wins." : "Everyone for themselves. First to 25 wins.",
    how: [],
    keys: cap ? ["WASD move", "Space jump (hold to bunny hop)", "Click fire the laser · one hit kills", "Right-click or F: grappling hook", "Touch the router to grab it", "Holder: a shield that stops one hit", "Falling is out"] : troph ? ["WASD move", "Space jump (hold to bunny hop)", "Strafe in the air to speed up", "Walk over pads for guns, health, armor", "Rocket at your feet to rocket jump", "Touch the Golden Router to grab it", "4 / G frag"] : laser ? ["WASD move", "Space jump (hold to bunny hop)", "Right-click or F: grappling hook", "Click fire the laser · one hit kills", "Jump pads launch you up", "Uplink: boosters fly you over the gap · falling is out"] : team ? ["WASD move", "Space jump (onto boxes)", "C crouch (mid-jump for tall boxes)", "Shift walk (silent)", "1 2 3 weapons", "4 / G frag · 5 smoke", "E plant / defuse", "B buy"] : ["WASD move", "Space jump (onto boxes)", "C crouch (mid-jump for tall boxes)", "Shift walk (silent)", "1 2 3 weapons", "4 / G frag · 5 smoke", "B loadout", "Right-click scope / stab"],
    rec: troph ? { label: "Longest router hold", better: "max", fmt: v => v + "s" } : { label: "Most eliminations", better: "max", fmt: v => v + " elims" },
    custom3d: true, md,
    BUY: 9, ROUND: 105, POST: 5, BOMB: 40, PLANT: 3, DEFUSE: 5, WIN: 7, DUR: cap ? 240 : 300, GOAL: 25, HOLD: cap ? 60 : 90,
    mapList() { return Object.keys(OPS_MAPS).filter(id => !OPS_MAPS[id].dev || store("nfa-dev")).filter(id => arena ? OPS_MAPS[id].only === "golden" || (laser && OPS_MAPS[id].only === "laser") : !OPS_MAPS[id].only).map(id => ({ id, n: OPS_MAPS[id].n, sub: OPS_MAPS[id].sky ? "Sky towers · fall = out · 2–10" : OPS_MAPS[id].only ? "Jump arena · 2–10" : id === "farm" ? "Small · 2–6" : id === "hq" ? "Medium · 4–10" : "Large · 6–16" })); },
    fill(nHumans) { if (arena) return Math.max(6, Math.min(10, nHumans)); if (!team) return Math.max(4, Math.min(8, nHumans)); const n = Math.max(6, nHumans + (nHumans % 2)); return Math.min(16, n); },

    // ---------------- host ----------------
    hostStart(S) {
      const n = S.ro.length, mp = arena ? (laser && S.mapPick && OPS_MAPS[S.mapPick] && OPS_MAPS[S.mapPick].only ? S.mapPick : "arena") : S.mapPick && OPS_MAPS[S.mapPick] && !OPS_MAPS[S.mapPick].only ? S.mapPick : opsPickMap(n); opsSetMap(mp);
      const P = S.ro.map((r, i) => ({ tm: 0, x: 0, z: 0, a: 0, hp: 100, alive: 1, k: 0, d: 0, hsk: 0, as: 0, dmg: 0, pln: 0, dfs: 0, hb: {}, idle: 0, seen: 0, gone: 0, arm: 0, w: -1, cur: 0, cr: 800, rsq: 0, rx: 0, rz: 0, lastClaim: 0, gr: [0, 0], thSeq: 0, lastHitT: -9, actT: 0, ax: 0, az: 0, rT: 0, jh: 0, hold: 0, rkSeq: 0, rkT: -9, kb: 0, kbs: 0, pk: 0, hasTr: 0, bs: 0, shot: null,
        bot: r.b ? { path: [], pT: 0, fT: 0.5, tgt: -1, react: 0, strafe: 1, sT: 0, boss: !!r.boss, goal: null, gT: 0 } : null }));
      if (team) {
        // humans alternate, bots fill the smaller side
        const cnt = [0, 0];
        S.ro.forEach((r, i) => { if (!r.b) { P[i].tm = cnt[0] <= cnt[1] ? 0 : 1; cnt[P[i].tm]++; } });
        S.ro.forEach((r, i) => { if (r.b) { P[i].tm = cnt[0] <= cnt[1] ? 0 : 1; cnt[P[i].tm]++; } });
        opsTeamCols(S.ro, P.map(p => p.tm));
      } else P.forEach((p, i) => { p.tm = i; p.w = gold ? -1 : laser ? LASER : 2; p.pw = 0; p.cur = gold ? 0 : laser ? LASER : 2; });
      OPS_SMOKES = [];
      const homes = opsRouterHomes(), hi = rint(0, homes.length - 1), [hx, hz] = homes[hi];
      S.g = { gb: [], rk: [], rks: 0, wp: gold ? (OPS_M.picks || []).map(([cx, cz, it]) => ({ x: cx * CS + CS / 2, z: cz * CS + CS / 2, y: oCellH(cx, cz), it, rt: 0 })) : [], tr: troph ? { x: hx, z: hz, y: 0, hx, hz, hi, by: -1, idle: 0 } : null, pr: this.propsFresh(), fx: [], fxs: 0, gn: [], sm: [], gns: 0, md, mp, t: 0, rd: 0, ph: team ? "buy" : "live", pt: 0, sc: [0, 0], P, bomb: { st: 0, x: 0, z: 0, t: 0, site: 0 }, kf: [], kseq: 0, ann: null, aseq: 0, ls: [0, 0], over: false, rsite: 0 };
      if (team) this.startRound(S); else P.forEach((p, i) => this.spawnFFA(S, i, true));
    },
    // ---- breakable props (host)
    propsFresh() { OPS_PALIVE.fill(1); opsPanesEnsure(); OPS_PGONE.fill(0); return OPS_PROPS.map(p => ({ hp: OPROP[p.t].hp, rt: 0, fu: 0, by: -1 })); },
    hitProp(S, k, by, dmg) { const q = S.g.pr[k]; if (!q || q.hp <= 0) return; q.hp -= dmg; if (by >= 0) q.by = by; if (q.hp <= 0) this.breakProp(S, k); },
    breakPane(S, k) { const g = S.g; if (!OPS_PANES[k] || OPS_PGONE[k]) return; OPS_PGONE[k] = 1; (g.gb = g.gb || []).push([k, g.t]); },
    breakProp(S, k) { const g = S.g, q = g.pr[k], p = OPS_PROPS[k]; q.hp = 0; q.fu = 0; q.rt = team ? 0 : 40; OPS_PALIVE[k] = 0; if (p.t === 2) this.blast(S, p.x, p.z, q.by, 0); },
    // kind 0: battery (hurts players, credited to whoever set it off), kind 1: the payload (its own damage rules)
    blast(S, x, z, by, kind, y = 0, direct = -1) {
      const g = S.g, R = kind === 1 ? 10 : kind === 2 ? 7 : kind === 4 ? 4.2 : 5.5;
      g.fx.push([++g.fxs, +x.toFixed(2), +z.toFixed(2), kind, +y.toFixed(2)]); if (g.fx.length > 6) g.fx.shift();
      // rocket: 3D splash, self damage at 35%, and a shove that makes rocket jumps work
      if (kind === 4) g.P.forEach((q, j) => {
        if (!q.alive) return; const cy = (q.jh || 0) + 1.0, dx = q.x - x, dy = cy - y, dz = q.z - z, d = Math.hypot(dx, dy, dz);
        if (d >= R && j !== direct) return; if (j !== direct && !(OPS_ML ? oSee(x, y + 0.3, z, q.x, cy, q.z) : oLOS(x, z, q.x, q.z))) return;
        const k = Math.max(0, 1 - d / R); let raw = j === direct ? 100 : 12 + 78 * k; if (j === by) raw *= 0.35;
        const L = d || 1, imp = (j === by ? 11 : 7) * k + 2.5, vx = dx / L * imp, vy = Math.max(dy / L, 0.35) * imp, vz = dz / L * imp;
        if (q.bot) oMove(q, vx * 0.2, vz * 0.2); else { q.kbs++; q.kb = [q.kbs, +vx.toFixed(2), +vy.toFixed(2), +vz.toFixed(2)]; }
        this.damage(S, j, j === by ? j : by, -4, false, raw);
      });
      else if (kind !== 1) g.P.forEach((q, j) => {
        if (!q.alive) return; const d = OPS_ML ? Math.hypot(q.x - x, (q.jh || 0) + 0.8 - y, q.z - z) : Math.hypot(q.x - x, q.z - z); if (d >= R || !(OPS_ML ? oSee(x, y + 0.3, z, q.x, (q.jh || 0) + 1.0, q.z) : oLOS(x, z, q.x, q.z))) return;
        const f = g.P[by]; if (team && f && j !== by && f.tm === q.tm) return;   // no team damage from grenades (bullets have none either); your own still hurts you
        const credit = by === j ? j : f ? by : -1;
        this.damage(S, j, credit, kind === 2 ? -3 : -2, false, kind === 2 ? 6 + 104 * Math.pow(1 - d / R, 1.15) : 8 + 120 * Math.pow(1 - d / R, 1.1));
      });
      // glass in reach of the blast shatters (checked from a point just off the pane on the blast's side)
      OPS_PANES.forEach((q, k) => { if (OPS_PGONE[k]) return; const dx = x - q.c[0], dy = y + 0.5 - q.c[1], dz = z - q.c[2], dd = Math.hypot(dx, dy, dz); if (dd > R * 0.75 + Math.max(q.hu, q.hv) * 0.5) return;
        const sd = Math.sign(dx * q.n[0] + dz * q.n[2]) || 1; if (oLOS(x, z, q.c[0] + q.n[0] * 0.45 * sd, q.c[2] + q.n[2] * 0.45 * sd)) this.breakPane(S, k); });
      g.pr.forEach((q, k) => { if (q.hp <= 0) return; const p = OPS_PROPS[k]; if (Math.hypot(p.x - x, p.z - z) >= R * 0.9 || !oLOS(x, z, p.x, p.z) || y > p.h + 1.5) return; if (p.t === 2) { if (!q.fu) { q.fu = 0.16 + Math.random() * 0.22; q.by = by; } } else this.hitProp(S, k, by, 999); });
    },
    hostThrow(S, i, k, a, pt, crouch) {
      const g = S.g, p = g.P[i], sp = crouch ? 10 : 15.5, cp = Math.cos(pt), y = (crouch ? 1.0 : EYE) - 0.15 + (OPS_ML ? p.jh || 0 : 0); p.prot = 0;
      const dx = -Math.sin(a) * cp, dz = -Math.cos(a) * cp;
      let x = p.x + dx * 0.4, z = p.z + dz * 0.4; if (oSolid(x, z, y)) { x = p.x; z = p.z; }
      g.gn.push({ id: ++g.gns, k, x, y, z, vx: dx * sp, vy: Math.sin(pt) * sp + 2.2, vz: dz * sp, t: 0, by: i });
    },
    // grenades bounce off walls, props, floor (and the ceiling indoors); frags pop after a fuse, smokes once they settle
    nadesTick(S, dt) {
      const g = S.g, roofed = OPS_M.theme === "office" || OPS_M.theme === "farm";
      for (const n of g.gn) {
        n.t += dt;
        for (let st = 0; st < 3; st++) {
          const h = dt / 3; n.vy -= 15 * h;
          let nx = n.x + n.vx * h, nz = n.z + n.vz * h; const ny = n.y + n.vy * h;
          const pi = oPropAt(nx, nz, 0.06), hitProp = pi >= 0 && ny < OPS_PROPS[pi].h;
          if (oSolid(nx, n.z, ny) || (hitProp && oPropAt(nx, n.z, 0.06) >= 0)) { n.vx *= -0.45; n.vz *= 0.8; nx = n.x; }
          if (oSolid(n.x, nz, ny) || (hitProp && oPropAt(n.x, nz, 0.06) >= 0)) { n.vz *= -0.45; n.vx *= 0.8; nz = n.z; }
          n.x = nx; n.z = nz; n.y = ny;
          if (hitProp && ny < OPS_PROPS[pi].h + 0.06 && n.vy < 0 && oPropAt(n.x, n.z, 0.06) >= 0) { n.y = OPS_PROPS[pi].h + 0.06; n.vy *= -0.3; n.vx *= 0.7; n.vz *= 0.7; }
          if (OPS_ML) { const c = mlCeil(n.x, n.z, n.y - 0.55); if (n.y > c - 0.1) { n.y = c - 0.1; n.vy = -Math.abs(n.vy) * 0.4; } }
          else if (roofed && n.y > OWH - 0.1) { n.y = OWH - 0.1; n.vy = -Math.abs(n.vy) * 0.4; }
          const fl = OPS_ML ? Math.max(0, mlTop(n.x, n.z, n.y - 0.5)) : 0;   // (floors and stairs on multi-level maps)
          if (n.y < fl + 0.07) { n.y = fl + 0.07; n.vy = Math.abs(n.vy) < 1 ? 0 : -n.vy * 0.35; n.vx *= 0.62; n.vz *= 0.62; }
        }
        if (n.k === 0 && n.t >= 1.7) { n.done = 1; this.blast(S, n.x, n.z, n.by, 2, OPS_ML ? n.y : 0); }
        if (n.k === 1 && (n.t >= 2.6 || (n.t > 0.9 && Math.hypot(n.vx, n.vz) < 0.6 && (OPS_ML ? n.vy === 0 : n.y < 0.1)))) { n.done = 1; g.sm.push({ id: n.id, x: n.x, z: n.z, t: 16, age: 0 }); g.fx.push([++g.fxs, +n.x.toFixed(2), +n.z.toFixed(2), 3]); if (g.fx.length > 6) g.fx.shift(); }
      }
      g.gn = g.gn.filter(n => !n.done);
      g.sm.forEach(s => { s.t -= dt; s.age += dt; }); g.sm = g.sm.filter(s => s.t > 0); OPS_SMOKES = g.sm;
    },
    // ---- jump-arena host: rockets, pickups, the Golden Router
    hostRocket(S, i, o, d) {
      const g = S.g, L = Math.hypot(d[0], d[1], d[2]) || 1, u = [d[0] / L, d[1] / L, d[2] / L], p = g.P[i]; p.prot = 0;
      g.rk.push({ id: ++g.rks, x: p.x + u[0] * 0.5, y: clamp(o[1], 0.2, 40) + u[1] * 0.5, z: p.z + u[2] * 0.5, vx: u[0] * 27, vy: u[1] * 27, vz: u[2] * 27, t: 0, by: i });
    },
    rocketsTick(S, dt) {
      const g = S.g;
      for (const r of g.rk) {
        r.t += dt;
        for (let st = 0; st < 4 && !r.done; st++) {
          const h = dt / 4, nx = r.x + r.vx * h, ny = r.y + r.vy * h, nz = r.z + r.vz * h;
          let hit = r.t > 3.2, dj = -1;
          if (!hit && (oSolid(nx, nz) || ny <= oHAt(nx, nz) || (OPS_M.theme !== "roof" && OPS_M.theme !== "desert" && ny >= (OPS_M.wallH || 99) - 0.1))) hit = true;
          if (!hit) { const pi = oPropAt(nx, nz, 0.1); if (pi >= 0 && ny < OPS_PROPS[pi].h) hit = true; }
          if (!hit) g.P.forEach((q, j) => { if (dj >= 0 || !q.alive || j === r.by && r.t < 0.25) return; if (Math.hypot(q.x - nx, q.z - nz) < 0.55 && ny > (q.jh || 0) && ny < (q.jh || 0) + 1.95) { dj = j; hit = true; } });
          if (hit) { r.done = 1; const bx = oSolid(nx, nz) ? r.x : nx, bz = oSolid(nx, nz) ? r.z : nz; this.blast(S, bx, bz, r.by, 4, Math.max(ny, oHAt(bx, bz) + 0.05), dj); break; }
          r.x = nx; r.y = ny; r.z = nz;
        }
      }
      g.rk = g.rk.filter(r => !r.done);
    },
    pickTick(S, dt) {
      const g = S.g;
      for (const w of g.wp) {
        if (w.rt > 0) { w.rt -= dt; continue; }
        for (const q of g.P) {
          if (!q.alive || q.gone || Math.hypot(q.x - w.x, q.z - w.z) > 1.15 || Math.abs((q.jh || 0) - w.y) > 1.1) continue;
          let took = false;
          if (w.it === "H") { if (q.hp < 100) { q.hp = Math.min(100, q.hp + 50); took = true; } }
          else if (w.it === "A") { if (q.arm < 100) { q.arm = 100; took = true; } }
          else { q.w = w.it; q.cur = w.it; q.pk++; took = true; }
          if (took) { w.rt = w.it === ROCKET ? 22 : 15; break; }
        }
      }
    },
    trophyTick(S, dt) {
      const g = S.g, tr = g.tr; if (!tr) return;
      if (tr.by >= 0) {
        const p = g.P[tr.by];
        if (!p || !p.alive || p.gone) { const who = tr.by; tr.by = -1; tr.idle = 0; if (p) { p.hasTr = 0; p.sh = 0; tr.x = p.x; tr.z = p.z; } tr.y = oHAt(tr.x, tr.z); if (oVoid(tr.x, tr.z)) tr.idle = 9; this.say(S, [7, who]); }   // lost over the gap: back home in 3 s
        else { p.hold += dt; tr.x = p.x; tr.z = p.z; tr.y = p.jh || 0; }
        return;
      }
      tr.idle += dt;
      if (tr.idle > 12 && Math.hypot(tr.x - tr.hx, tr.z - tr.hz) > 0.5) {
        const hm = opsRouterHomes(); if (hm.length > 1) { tr.hi = ((tr.hi || 0) + 1) % hm.length; [tr.hx, tr.hz] = hm[tr.hi]; }   // two homes: it goes back to the other side
        tr.x = tr.hx; tr.z = tr.hz; tr.y = 0; tr.idle = 0; this.say(S, [8]); return; }
      let best = -1, bd = 1.35;
      g.P.forEach((q, j) => { if (!q.alive || q.gone) return; const d = Math.hypot(q.x - tr.x, q.z - tr.z); if (d < bd && Math.abs((q.jh || 0) - tr.y) < 1.4) { bd = d; best = j; } });
      if (best >= 0) { const q = g.P[best]; tr.by = best; tr.idle = 0; q.hasTr = 1; if (cap) q.sh = 1; this.say(S, [6, best]); }   // with one-hit lasers the holder gets a shield that stops one hit (and keeps the hook)   // the holder keeps every weapon
    },
    propsTick(S, dt) {
      const g = S.g;
      // broken glass is replaced after a minute when there are no rounds to reset it
      if (!team && g.gb && g.gb.length && g.gb.some(e => g.t - e[1] > 60)) g.gb = g.gb.filter(e => { if (g.t - e[1] <= 60) return true; OPS_PGONE[e[0]] = 0; return false; });
      g.pr.forEach((q, k) => {
        if (q.fu > 0 && q.hp > 0) { q.fu -= dt; if (q.fu <= 0) this.hitProp(S, k, -1, 999); }
        if (!team && q.hp <= 0 && q.rt > 0) { q.rt -= dt; if (q.rt <= 0) { const p = OPS_PROPS[k]; if (g.P.some(o => o.alive && Math.abs(o.x - p.x) < p.hx + PR + 0.2 && Math.abs(o.z - p.z) < p.hz + PR + 0.2)) q.rt = 2; else { q.hp = OPROP[p.t].hp; q.by = -1; OPS_PALIVE[k] = 1; } } }
      });
    },
    // how fast someone really moves (bots find a moving target harder to hit) and where they stood in the last 0.3 s (hit checks)
    track(S, p, ox, oz, dt) {
      if (dt > 0) { const v = Math.min(12, Math.hypot(p.x - ox, p.z - oz) / dt); p.mv = (p.mv || 0) + (v - (p.mv || 0)) * Math.min(1, dt * 5); }
      const h = p.hist || (p.hist = []), t = S.g.t; if (!h.length || t - h[h.length - 1][0] >= 0.03) h.push([t, p.x, p.z, p.jh || 0]); while (h.length && t - h[0][0] > 0.3) h.shift();
    },
    say(S, a) { const g = S.g; g.ann = a.concat([++g.aseq]); },
    seat: true,
    // one player's numbers for the all-time Hall of Fame
    stats(S, i) { const p = S.g.P[i]; return { k: p.k, d: p.d, hs: p.hsk, kn: p.knk || 0, as: p.as, dmg: Math.round(p.dmg), obj: p.pln + p.dfs, hold: Math.floor(p.hold || 0), mvp: S.board && S.board.mvp === i ? 1 : 0 }; },
    // hand bot i's place to the first person waiting to join (keeps the bot's side and colour)
    takeSeat(S, i) {
      const q = S.joinQ && S.joinQ.shift(); if (!q) return false; const r = S.ro[i], p = S.g.P[i];
      if (!r || !r.b || S.ro.some(o => o.k === q.k)) return false;
      Object.assign(r, { k: q.k, n: q.n, c: q.c, u: q.u, b: 0, boss: 0 });
      p.bot = null; p.k = p.d = p.as = p.dmg = p.hsk = p.pln = p.dfs = 0; p.hold = 0; p.lastClaim = 0; p.idle = 0; p.seen = 0; p.gone = 0; p.budget = 0; p.lastSh = undefined; p.joinT = S.g.t;
      this.say(S, [9, i]); return true;
    },
    swapSides(S) {
      const g = S.g; g.half = 1; g.sc = [g.sc[1], g.sc[0]]; g.ls = [0, 0];
      g.P.forEach(p => { p.tm = 1 - p.tm; p.cr = 800; p.w = -1; p.pw = 0; p.arm = 0; p.gr = [0, 0]; p.alive = 0; if (p.bot) p.bot.site = 0; });
      opsTeamCols(S.ro, g.P.map(p => p.tm));
    },
    startRound(S) {
      const g = S.g; g.rd++; g.ph = "buy"; g.pt = this.BUY; g.bomb = { st: 0, x: 0, z: 0, t: 0, site: 0 }; g.pr = this.propsFresh(); g.gb = []; g.gn = []; g.sm = []; OPS_SMOKES = g.sm; g.rsite = Math.random() < 0.5 ? 0 : 1;
      const spots = [shuffle(OPS_CELLS.r.slice()), shuffle(OPS_CELLS.u.slice())], k = [0, 0];
      // late joiners take a bot's place on the side with fewer people, with that side's average money
      while (S.joinQ && S.joinQ.length) {
        const hum = [0, 0]; g.P.forEach(p => { if (!p.bot && !p.gone) hum[p.tm]++; });
        const t = hum[0] <= hum[1] ? 0 : 1, i = [t, 1 - t].map(tt => g.P.findIndex(p => p.bot && p.tm === tt)).find(x => x >= 0);
        if (i == null || i < 0 || !this.takeSeat(S, i)) break;
        const p = g.P[i], mates = g.P.filter((q, j) => j !== i && q.tm === p.tm && !q.bot);
        p.cr = mates.length ? Math.round(mates.reduce((a, q) => a + q.cr, 0) / mates.length / 50) * 50 : 800; p.w = -1; p.pw = 0; p.arm = 0; p.gr = [0, 0]; p.alive = 0;
      }
      g.P.forEach((p, i) => {
        if (!p.alive || g.rd === 1) { p.w = -1; p.pw = 0; p.arm = 0; p.gr = [0, 0]; if (p.bot) p.bot.rs = {}; }
        else if (p.bot && p.bot.rs && Object.keys(p.bot.rs).length && p.cr >= AMMO_COST) { p.cr -= AMMO_COST; p.bot.rs = {}; }   // bots buy ammo too
        const c = cellC(spots[p.tm][k[p.tm]++ % spots[p.tm].length]);
        p.x = p.rx = c[0] + (Math.random() - 0.5); p.z = p.rz = c[1] + (Math.random() - 0.5);
        p.a = p.tm === 0 ? Math.PI : 0; p.hp = 100; p.alive = p.gone ? 0 : 1; p.hb = {}; p.jh = 0; p.rsq++; p.actT = 0; p.cur = p.w >= 0 ? p.w : p.pw;
        if (p.bot) { p.bot.path = []; p.bot.goal = null; p.bot.tgt = -1; this.botBuy(p); p.bot.site = (i % 2); }
      });
      this.say(S, [1, g.rd, g.half === 1 ? 1 : 0]); if (g.half === 1) g.half = 2;
    },
    botBuy(p) {
      if (p.w < 0) {
        const opts = (p.cr >= 3400 ? [2, 2, 7, 9, 3, 8] : p.cr >= 2100 ? [7, 7, 9, 1, 5] : p.cr >= 1100 ? [1, 5, 9] : []).filter(w => OW[w].cost <= p.cr);
        if (opts.length && Math.random() < 0.85) { const w = opts[rint(0, opts.length - 1)]; p.cr -= OW[w].cost; p.w = w; }
        else if (p.pw === 0 && p.cr >= 700 && Math.random() < 0.6) { p.cr -= 700; p.pw = 6; }
      }
      if (p.arm < 50 && p.cr >= ARMOR_COST) { p.cr -= ARMOR_COST; p.arm = 100; }
      if (!p.gr[0] && p.cr >= NADE_COST && Math.random() < 0.6) { p.cr -= NADE_COST; p.gr[0] = 1; }
      p.cur = p.w >= 0 ? p.w : p.pw;
    },
    spawnFFA(S, i, first) {
      const g = S.g, p = g.P[i];
      const others = g.P.filter((q, j) => j !== i && q.alive);
      let best = null, bs = -1;
      // never spawn on top of a free router (a free grab) or on the edge of the void (a step and you fall)
      const tr = g.tr && g.tr.by < 0 ? g.tr : null, edge = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => (OPS_MAP[z + dz] || "")[x + dx] === "v");
      for (let k = 0; k < 48 && !(k >= 24 && best); k++) { const cl = OPS_CELLS.spawn[rint(0, OPS_CELLS.spawn.length - 1)], c = cellC(cl); if (k < 44 && ((tr && Math.hypot(tr.x - c[0], tr.z - c[1]) < 13) || edge(cl[0], cl[1]))) continue;
        const d = others.length ? Math.min(...others.map(q => Math.hypot(q.x - c[0], q.z - c[1]))) : Math.random() * 10; if (d > bs) { bs = d; best = c; } }
      if (p.bot) p.bot.rs = {};
      p.x = p.rx = best[0]; p.z = p.rz = best[1]; p.a = Math.random() * Math.PI * 2; p.hp = 100; p.alive = 1; p.arm = 0; p.gr = [1, 1]; p.rsq++; p.actT = 0; p.spT = g.t; p.prot = g.t + 1.5; p.hb = {}; p.jh = 0; p.hasTr = 0; if (p.bot) p.bot.fly = null;
      p.sh = 0;
      if (gold) { p.w = -1; p.pw = 0; p.cur = 0; p.gr = [1, 0]; if (p.bot) { p.bot.path = []; p.bot.tgt = -1; p.bot.goal = null; } return; }
      if (laser) { p.w = LASER; p.pw = 0; p.cur = LASER; p.gr = [0, 0]; if (p.bot) { p.bot.path = []; p.bot.tgt = -1; p.bot.goal = null; } return; }
      if (p.bot) { p.bot.path = []; p.bot.tgt = -1; p.cur = p.w = [1, 2, 2, 3, 5, 7, 8, 9][rint(0, 7)]; p.pw = Math.random() < 0.5 ? 6 : 0; p.arm = 100; }
    },
    damage(S, tgt, from, wi, head, raw) {
      const g = S.g, q = g.P[tgt], W0 = OW[wi] || OW[0];
      if (!q.alive) return;
      if (team && g.ph !== "live") return;   // a grenade that lands after the round is decided does nothing
      if (!team && from >= 0 && from !== tgt && g.t < (q.prot || 0)) return;   // a moment of spawn protection (ends when you shoot)
      if (q.sh > 0 && from >= 0 && from !== tgt) { q.sh = 0; q.shT = g.t; if (q.bot) q.bot.alertT = 2.5; return; }   // the router holder's shield takes the first hit
      let dmg = raw != null ? raw : W0.dmg * (head ? W0.hs : 1);
      if (from >= 0 && from !== tgt && !W0.melee && !W0.laser && wi >= 0) { const f = g.P[from]; dmg *= opsFall(W0, Math.hypot(f.x - q.x, f.z - q.z)); }
      // armor (a vest) takes 45% of body damage; a headshot gets past it mostly, and the snipers punch through
      if (q.arm > 0) { const ab = opsArmor(W0, dmg, head, q.arm); q.arm -= ab; dmg -= ab; }
      if (q.bot && from >= 0 && from !== tgt) q.bot.alertT = 2.5;
      const real = Math.max(0, Math.min(dmg, q.hp));
      if (from >= 0 && from !== tgt) { g.P[from].dmg += real; q.hb[from] = (q.hb[from] || 0) + real; }
      q.hp -= dmg;
      if (q.hp <= 0) {
        q.hp = 0; q.alive = 0; q.d++; q.actT = 0; q.rT = 3; q.dieT = g.t;
        // a fall or your own grenade still counts as a kill for the enemy who hurt you most this life
        if (from < 0 || from === tgt) { let bj = -1, bv = 0; for (const j in q.hb) if (+j !== tgt && q.hb[j] > bv && g.P[j] && this.enemy(S, +j, tgt)) { bv = q.hb[j]; bj = +j; } if (bj >= 0) from = bj; }
        if (from >= 0 && from !== tgt) { const f = g.P[from]; f.k++; if (head) f.hsk++; if (W0.melee && wi >= 0) f.knk = (f.knk || 0) + 1; f.cr = Math.min(16000, f.cr + (W0.kill || 300)); }
        // assist: anyone else who did 40+ damage to this life
        for (const j in q.hb) if (+j !== from && q.hb[j] >= 40 && g.P[j]) g.P[j].as++;
        q.hb = {};
        g.kf.push([from, tgt, wi, head ? 1 : 0, ++g.kseq]); if (g.kf.length > 5) g.kf.shift();
      }
    },
    enemy(S, i, j) { const P = S.g.P; return i !== j && (team ? P[i].tm !== P[j].tm : true); },
    owns(S, p, wi) { if (laser) return wi === LASER; return wi === KNIFE || wi === p.pw || wi === p.w; },
    procAct(S, i, act, dt) {
      const g = S.g, p = g.P[i], b = g.bomb;
      if (!team || g.ph !== "live" || !p.alive || !act) { p.actT = 0; return; }
      const ch = opsSiteAt(p.x, p.z, p.jh);
      const canPlant = p.tm === 0 && b.st === 0 && !!ch;
      const canDefuse = p.tm === 1 && b.st === 1 && Math.hypot(p.x - b.x, p.z - b.z) < 1.9 && Math.abs((p.jh || 0) - (b.y || 0)) < 1.5;
      if (!canPlant && !canDefuse) { p.actT = 0; return; }
      if (p.actT === 0) { p.ax = p.x; p.az = p.z; }
      if (Math.hypot(p.x - p.ax, p.z - p.az) > 0.6) { p.actT = 0; return; }
      p.actT += dt;
      if (canPlant && p.actT >= this.PLANT) {
        g.bomb = { st: 1, x: p.x, z: p.z, y: OPS_ML ? oGround(p.x, p.z, 0.1, p.jh || 0) : 0, t: this.BOMB, site: ch === "a" ? 0 : 1, by: i }; p.pln++; p.actT = 0; p.cr = Math.min(16000, p.cr + 300);
        this.say(S, [2, g.bomb.site]);
      } else if (canDefuse && p.actT >= this.DEFUSE) { b.st = 2; p.dfs++; p.actT = 0; p.cr = Math.min(16000, p.cr + 300); }
    },
    endRound(S, win, why) {
      const g = S.g; g.sc[win]++; g.ph = "post"; g.pt = this.POST;
      g.ls[win] = 0; g.ls[1 - win] = Math.min(3, g.ls[1 - win] + 1);
      g.P.forEach(p => { p.cr = Math.min(16000, p.cr + (p.tm === win ? 3000 : 1400 + 500 * g.ls[1 - win])); p.actT = 0; });
      this.say(S, [3, win, why]);
    },
    // hit claims [id, target, head, weapon, stab]. Each id counts once. They only count while the round is live and the shooter
    // is alive or died a split second ago (so two players who shoot each other at once both land); older ones are thrown away
    claims(S, i, inp, ok) {
      const g = S.g, P = g.P, p = P[i];
      if (!Array.isArray(inp.hc)) return;
      let mx = p.lastClaim;
      if (!ok || (team && g.ph !== "live")) { for (const c of inp.hc) if (Array.isArray(c) && Number.isFinite(c[0]) && c[0] > mx) mx = c[0]; p.lastClaim = mx; return; }
      for (const c of inp.hc.slice(-24)) {
        if (!Array.isArray(c) || !Number.isFinite(c[0]) || !(c[0] > p.lastClaim)) continue;
        mx = Math.max(mx, c[0]); p.prot = 0;
        if ((c[1] | 0) <= -10000) { const k = -10000 - (c[1] | 0), q = OPS_PANES[k], W1 = OW[c[3] | 0]; if (q && W1 && this.owns(S, p, c[3] | 0) && Math.hypot(q.c[0] - p.x, q.c[2] - p.z) < (W1.melee ? 3.6 : W1.range + 8)) this.breakPane(S, k); continue; }
        if ((c[1] | 0) < 0) { const k = -1 - (c[1] | 0), pp = OPS_PROPS[k], wi = c[3] | 0, W1 = OW[wi]; if (pp && W1 && this.owns(S, p, wi) && Math.hypot(pp.x - p.x, pp.z - p.z) < (W1.melee ? 3.4 : W1.range + 6)) this.hitProp(S, k, i, W1.dmg); continue; }
        const tg = c[1] | 0, q = P[tg], wi = c[3] | 0, W0 = OW[wi];
        if (!q || !W0 || W0.rocket || !q.alive || !this.enemy(S, i, tg) || !this.owns(S, p, wi)) continue;
        // a hit allowance that refills at the gun's fire rate (pellets share a shot's worth) and banks up to four shots, so
        // claims from two quick shots that arrive in one network packet both count, while nobody can out-hit their gun
        { const per = W0.pel || 1; if (p.hbW !== wi) { p.hbW = wi; p.budget = Math.max(p.budget || 0, per); }
          p.budget = Math.min(per * 4, (p.budget || 0) + Math.max(0, g.t - p.lastHitT) / (W0.rate * 0.55) * per); p.lastHitT = g.t; }
        if (!(p.budget >= 1)) continue;
        const d = Math.hypot(q.x - p.x, q.z - p.z); if (d > (W0.melee ? 3.4 : W0.range + 6)) continue;
        const seen = (x, z, jh) => OPS_ML ? oSee(p.x, (p.jh || 0) + 1.5, p.z, x, jh + 1.4, z) || oSee(p.x, (p.jh || 0) + 1.5, p.z, x, jh + 0.8, z) : oLOSw(p.x, p.z, x, z);
        if (!seen(q.x, q.z, q.jh || 0) && !(q.hist || []).some(h => seen(h[1], h[2], h[3]))) continue;   // in sight now, or a moment ago on the shooter's screen
        p.budget--;
        if (W0.melee) {
          const stab = !!c[4], fx = q.bot ? Math.sin(q.a) : -Math.sin(q.a), fz = q.bot ? Math.cos(q.a) : -Math.cos(q.a);
          const back = ((q.x - p.x) * fx + (q.z - p.z) * fz) / (d || 1) > 0.35;
          this.damage(S, tg, i, wi, false, stab ? (back ? 200 : 65) : (back ? 80 : 34));
        } else this.damage(S, tg, i, wi, !!c[2]);
      }
      p.lastClaim = mx;
    },
    hostTick(S, dt, inputs) {
      const g = S.g; g.t += dt; const P = g.P;
      if (team) { g.pt -= dt; if (g.ph === "buy" && g.pt <= 0) { g.ph = "live"; g.pt = this.ROUND; this.say(S, [4]); } else if (g.ph === "post" && g.pt <= 0) { if (g.sc[0] >= this.WIN || g.sc[1] >= this.WIN) g.over = true; else { if (!g.half && g.sc[0] + g.sc[1] === this.WIN - 1) this.swapSides(S); this.startRound(S); } } }
      P.forEach((p, i) => {
        // a human who closed the tab stops sending input: take them out so rounds can still end
        if (!p.bot) {
          if (inputs[i]) { p.idle = 0; p.seen = 1; if (p.gone) { p.gone = 0; p.rT = 1; } }
          else { p.idle += dt; if (!p.gone && p.idle > (p.seen ? 8 : 25)) { p.gone = 1; if (p.alive) { p.alive = 0; p.hp = 0; } } }
        }
        if (!p.alive) {
          if (!p.bot && inputs[i]) this.claims(S, i, inputs[i], g.t - (p.dieT == null ? -9 : p.dieT) < 0.3);
          if (!team && !p.gone) { p.rT -= dt; if (p.rT <= 0) { if (p.bot && S.joinQ && S.joinQ.length) this.takeSeat(S, i); this.spawnFFA(S, i); } }
          return;
        }
        if (p.bot) { const ox = p.x, oz = p.z; OPS_FEET = p.jh || 0; this.botTick(S, i, dt); this.track(S, p, ox, oz, dt); if (OPS_ML && !p.bot.fly) p.jh = oGround(p.x, p.z, PR, p.jh || 0); OPS_FEET = 0; return; }
        const inp = inputs[i]; if (!inp) return;
        if (Number.isFinite(inp.x) && Number.isFinite(inp.z) && inp.q === p.rsq && !(team && g.ph === "buy" && Math.hypot(inp.x - p.rx, inp.z - p.rz) > 1.5)) { p.x = clamp(inp.x, 0, OG * CS); p.z = clamp(inp.z, 0, OG * CS); p.a = +inp.a || 0; }
        if (Number.isInteger(inp.w) && OW[inp.w] && this.owns(S, p, inp.w)) p.cur = inp.w;
        if (p.lastSh !== undefined && inp.sh !== p.lastSh) p.prot = 0; p.lastSh = inp.sh;   // firing (hit or miss) ends spawn protection
        p.jh = clamp(+inp.jh || 0, OPS_M.sky ? -60 : 0, 40); p.ducked = !!inp.cr; this.track(S, p, p.tx == null ? p.x : p.tx, p.tz == null ? p.z : p.tz, dt); p.tx = p.x; p.tz = p.z;
        // fell into the open air between the towers: out
        if (OPS_M.sky && p.jh < -7) { this.damage(S, i, i, -5, false, 999); return; }
        if (Array.isArray(inp.rk) && inp.rk[0] !== p.rkSeq) { p.rkSeq = inp.rk[0]; if (this.owns(S, p, ROCKET) && g.t - p.rkT > 0.6) { p.rkT = g.t; this.hostRocket(S, i, [p.x, +inp.rk[2] || 1.5, p.z], [+inp.rk[4] || 0, +inp.rk[5] || 0, +inp.rk[6] || 0]); } }
        if (Array.isArray(inp.th) && inp.th[0] !== p.thSeq) { p.thSeq = inp.th[0]; const k = inp.th[1] === 1 ? 1 : 0; if (p.gr[k] > 0 && (!team || g.ph === "live")) { p.gr[k]--; this.hostThrow(S, i, k, +inp.th[2] || p.a, clamp(+inp.th[3] || 0, -1.4, 1.4), inp.th[4] ? 1 : 0); } }
        // shop
        if (!team && !arena && Array.isArray(inp.buy) && inp.buy[0] !== p.buySeq) { // free loadout in free-for-all
          p.buySeq = inp.buy[0]; const W1 = OW[inp.buy[1] | 0];
          if (W1 && W1.slot === 1) { p.w = inp.buy[1] | 0; p.cur = p.w; } if (W1 && W1.slot === 2) { p.pw = inp.buy[1] | 0; p.cur = p.pw; }
          if ((inp.buy[1] | 0) === ARMOR_IT && g.t - (p.spT || 0) < 10) p.arm = 100;
          const nk = (inp.buy[1] | 0) - FRAG_IT; if ((nk === 0 || nk === 1) && g.t - (p.spT || 0) < 10) p.gr[nk] = 1;
        }
        if (team && Array.isArray(inp.buy) && inp.buy[0] !== p.buySeq) {
          p.buySeq = inp.buy[0]; const it = inp.buy[1] | 0;
          if (g.ph === "buy" || (g.ph === "live" && this.ROUND - g.pt < 15)) {
            const W1 = OW[it];
            if (W1 && W1.slot === 1 && p.w !== it && p.cr >= W1.cost) { p.cr -= W1.cost; p.w = it; p.cur = it; }
            if (W1 && W1.slot === 2 && p.pw !== it && p.cr >= W1.cost) { p.cr -= W1.cost; p.pw = it; p.cur = it; }
            if (it === ARMOR_IT && p.arm < 100 && p.cr >= ARMOR_COST) { p.cr -= ARMOR_COST; p.arm = 100; }
            if ((it === FRAG_IT || it === SMOKE_IT) && !p.gr[it - FRAG_IT] && p.cr >= NADE_COST) { p.cr -= NADE_COST; p.gr[it - FRAG_IT] = 1; }
            if (it === AMMO_IT && (p.w >= 0 || p.pw > 0) && p.cr >= AMMO_COST) { p.cr -= AMMO_COST; p.amS = (p.amS || 0) + 1; }
          }
        }
        this.claims(S, i, inp, true);
        this.procAct(S, i, !!inp.act, dt);
      });
      this.propsTick(S, dt); this.nadesTick(S, dt);
      if (troph) { this.rocketsTick(S, dt); this.pickTick(S, dt); this.trophyTick(S, dt); }
      if (!team) return;
      if (g.ph !== "live") return;
      const b = g.bomb;
      if (b.st === 1) {
        b.t -= dt;
        if (b.t <= 0) { b.st = 3; this.blast(S, b.x, b.z, b.by, 1); P.forEach((q, j) => { if (q.alive && Math.hypot(q.x - b.x, q.z - b.z) < 9) { q.alive = 0; q.hp = 0; q.d++; q.hb = {}; const f = P[b.by]; if (f && q.tm !== f.tm) { f.k++; g.kf.push([b.by, j, -1, 0, ++g.kseq]); if (g.kf.length > 5) g.kf.shift(); } } }); this.endRound(S, 0, 5); return; }
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
      // riding a booster arc across the open air
      if (b.fly) { const f = b.fly; f.t += dt; const k = Math.min(1, f.t / f.T); p.x = f.x0 + (f.x1 - f.x0) * k; p.z = f.z0 + (f.z1 - f.z0) * k; p.jh = Math.max(0, f.vy * f.t - 8.5 * f.t * f.t); if (k >= 1) { p.jh = 0; b.fly = null; b.path = []; b.pT = 0; } return; }
      if (OPS_M.sky) { const J = OPS_JUMP[Math.floor(p.z / CS) * OG + Math.floor(p.x / CS)]; if (J) { const T = clamp(Math.hypot(J[0] - p.x, J[1] - p.z) / 15, 0.9, 2.6); b.fly = { t: 0, T, x0: p.x, z0: p.z, x1: J[0], z1: J[1], vy: 8.5 * T }; p.a = Math.atan2(J[0] - p.x, J[1] - p.z); return; } }
      const W0 = OW[p.cur] || OW[0];
      let tgt = -1, td = 1e9;
      // bots see what is in front of them; behind, only someone very close, someone they are already fighting, or whoever just shot them
      const fa = Math.sin(p.a), fc = Math.cos(p.a), wide = (b.alertT = Math.max(0, (b.alertT || 0) - dt)) > 0;
      g.P.forEach((q, j) => { if (!q.alive || !this.enemy(S, i, j)) return; const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < 42 && d < td && (wide || d < 7 || j === b.tgt || ((q.x - p.x) * fa + (q.z - p.z) * fc) / (d || 1) > 0.3) && (arena ? oSee(p.x, (p.jh || 0) + 1.5, p.z, q.x, (q.jh || 0) + 1.2, q.z) : oLOS(p.x, p.z, q.x, q.z)) && !oSmoked(p.x, p.z, q.x, q.z)) { td = d; tgt = j; } });
      // Golden Router: go after whoever holds it; the holder keeps running but shoots back at anyone who gets close
      if (troph && g.tr.by >= 0 && g.tr.by !== i) { const q = g.P[g.tr.by], d = Math.hypot(q.x - p.x, q.z - p.z); if (q.alive && d < 42 && oSee(p.x, (p.jh || 0) + 1.5, p.z, q.x, (q.jh || 0) + 1.2, q.z)) { tgt = g.tr.by; td = d; } }
      if (p.hasTr && td > 16) tgt = -1;
      if (troph && !p.hasTr && g.tr.by < 0 && td > 7) tgt = -1; // the free router matters more than a far-away fight
      if (tgt >= 0 && p.gr[0] > 0 && td > 7 && td < 20 && Math.random() < dt * 0.22) { const q = g.P[tgt]; p.gr[0]--; this.hostThrow(S, i, 0, Math.atan2(-(q.x - p.x), -(q.z - p.z)), clamp(0.06 + td / 55, 0.1, 0.45), 0); }
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
        // close the gap when the gun is out of its range, give ground when someone is in their face
        const adv = W0.melee ? 0 : td > Math.min(20, W0.range * 0.45) ? 0.5 : td < 3.2 && !W0.pel ? -0.45 : 0;
        if (moving) oMoveSafe(p, (sx * 0.6 + Math.sin(p.a) * adv) * speed * dt, (sz * 0.6 + Math.cos(p.a) * adv) * speed * dt);
        b.ls = [q.x, q.z, mlLevel(q.x, q.z, q.jh)];
        if (b.amW !== p.cur) { b.amW = p.cur; b.am = W0.mag; b.bn = 0; }
        if (W0.melee && td > 2.2) { const s2 = speed * dt, dx = q.x - p.x, dz = q.z - p.z; oMoveSafe(p, dx / td * s2, dz / td * s2); return; }
        if (W0.rocket && b.react <= 0 && b.fT <= 0 && Math.abs(da) < 0.2) {
          b.fT = W0.rate * 1.6 + Math.random() * 0.6; const ty = (q.jh || 0) + 0.4, err = (Math.random() - 0.5) * 0.12, ang = p.a + err;
          this.hostRocket(S, i, [p.x, 1.4, p.z], [Math.sin(ang) * td, ty - 1.4, Math.cos(ang) * td]); p.shot = [++p.bs, +q.x.toFixed(2), 1, +q.z.toFixed(2), p.cur]; return;
        }
        if (b.react <= 0 && b.fT <= 0 && Math.abs(da) < 0.15 && td < W0.range + 4) {   // no shotgun chip from across the map
          // automatic guns fire in bursts with a breath between them; every gun has to stop and reload
          const burst = W0.auto && W0.rate < 0.2;
          if (burst) { b.bn = (b.bn || 0) - 1; if (b.bn <= 0) { b.bn = 3 + Math.floor(Math.random() * 4); b.fT = 0.25 + Math.random() * 0.4; } else b.fT = W0.rate * 1.15; }
          else b.fT = W0.rate * (1 + Math.random() * (W0.auto ? 1.4 : 0.6)) + (W0.auto ? 0 : 0.15);
          if (W0.mag && --b.am <= 0) {   // reload from the spare rounds; out of them, it's the sidearm
            b.rs = b.rs || {}; const r = b.rs[p.cur] == null ? W0.res : b.rs[p.cur];
            if (!(r > 0) && p.cur !== p.pw && !W0.laser) { p.cur = p.pw; b.amW = -1; b.fT = Math.max(b.fT, 0.6); }
            else { const t = W0.laser || p.cur === p.pw && !(r > 0) ? W0.mag : Math.min(W0.mag, r); if (!W0.laser) b.rs[p.cur] = Math.max(0, r - t); b.am = t; b.bn = 0; b.fT = Math.max(b.fT, W0.rl * 0.8); }
          }
          p.prot = 0;
          const tq = g.P[tgt], tRun = clamp(((tq.mv || 0) - 1.5) / 4, 0, 1), tAir = (tq.jh || 0) - oGround(tq.x, tq.z, PR, tq.jh || 0) > 0.3 ? 1 : 0, tDuck = tq.ducked && td > 8 ? 1 : 0;   // running, jumping, or crouched far away = harder to hit
          const acc = clamp(((b.boss ? 0.62 : 0.5) + (burst ? 0.04 : 0) - td * (p.cur === 3 ? 0.002 : 0.011) - (moving ? 0.06 : 0) - 0.12 * tRun - 0.08 * tAir - 0.05 * tDuck) * (W0.scope ? 0.75 : 1), 0.06, 0.8);   // a bot's one-shot rifle shouldn't feel like an aimbot
          // cover: crates, desks and monitors stop a bot's bullets the same way they stop yours. Only the head showing = a harder shot, at the head
          const eye = [p.x, (p.jh || 0) + 1.5, p.z], cov = (y) => { const dx = q.x - p.x, dy = (q.jh || 0) + y - eye[1], dz = q.z - p.z, L = Math.hypot(dx, dy, dz) || 1; const r = oRayProps(eye, [dx / L, dy / L, dz / L], L - 0.35); return r[1] >= 0 ? r : null; };
          const cb = cov(1.0), ch2 = cb ? cov(1.58) : null, blocked = cb && ch2;
          const roll = Math.random() < acc * (cb ? 0.45 : 1), hit = roll && !blocked && !(cb && W0.pel), head = hit && (!!cb || Math.random() < (b.boss ? 0.22 : 0.14));
          if (roll && blocked) this.hitProp(S, cb[1], i, W0.dmg);
          const ang = p.a + (hit || blocked ? 0 : (Math.random() - 0.5) * 0.2);
          const dist = hit ? td : blocked ? Math.hypot(q.x - p.x, q.z - p.z) * cb[0] / Math.max(0.1, Math.hypot(q.x - p.x, (q.jh || 0) - 0.5 - (p.jh || 0), q.z - p.z)) : OPS_ML ? mlRay([p.x, (p.jh || 0) + 1.5, p.z], [Math.sin(ang), 0, Math.cos(ang)], 60) : oRay(p.x, p.z, Math.sin(ang), Math.cos(ang), 60);
          p.shot = [++p.bs, +(p.x + Math.sin(ang) * dist).toFixed(2), +((hit ? (head ? 1.45 : 1.0) : 0.8 + Math.random()) + (OPS_ML ? p.jh || 0 : 0)).toFixed(2), +(p.z + Math.cos(ang) * dist).toFixed(2), p.cur];
          if (hit) { if (W0.pel) { let n = 0; for (let k = 0; k < W0.pel; k++) if (Math.random() < clamp(1.2 - td / W0.range, 0.1, 1)) n++; if (n) this.damage(S, tgt, i, p.cur, false, W0.dmg * n / opsFall(W0, td)); } else this.damage(S, tgt, i, p.cur, head); }
        }
        return;
      }
      // objectives
      let goal = null, act = false;
      const bm = g.bomb;
      if (troph) {
        const tr = g.tr;
        if (!b.goal || b.gT <= 0 || !b.path.length) {
          b.gT = 3; b.path = []; const sp = OPS_CELLS.spawn;
          if (p.hasTr) { // run: the spot furthest from everyone else
            let bs = -1; for (let k = 0; k < 30; k++) { const c = sp[rint(0, sp.length - 1)], cc = cellC(c); const d = Math.min(99, ...g.P.filter((q, j) => j !== i && q.alive).map(q => Math.hypot(q.x - cc[0], q.z - cc[1]))); if (d > bs) { bs = d; b.goal = c; } }
          } else if (p.w < 0 && (b.pick = g.wp.filter(w => !w.rt && !w.y && typeof w.it === "number" && Math.hypot(w.x - p.x, w.z - p.z) < 14)[0])) b.goal = [Math.floor(b.pick.x / CS), Math.floor(b.pick.z / CS)];
          else if (tr.by < 0 && !oHAt(tr.x, tr.z)) b.goal = [Math.floor(tr.x / CS), Math.floor(tr.z / CS)];
          else if (tr.by >= 0 && !oHAt(g.P[tr.by].x, g.P[tr.by].z)) b.goal = [Math.floor(g.P[tr.by].x / CS), Math.floor(g.P[tr.by].z / CS)];
          else { const wp = g.wp.filter(w => !w.rt && !w.y && typeof w.it === "number"); b.goal = p.w < 0 && wp.length ? (w => [Math.floor(w.x / CS), Math.floor(w.z / CS)])(wp[rint(0, wp.length - 1)]) : sp[rint(0, sp.length - 1)]; }
        }
        goal = b.goal;
        if (b.pick && !b.pick.rt && Math.floor(p.x / CS) === Math.floor(b.pick.x / CS) && Math.floor(p.z / CS) === Math.floor(b.pick.z / CS)) { const dx = b.pick.x - p.x, dz = b.pick.z - p.z, d = Math.hypot(dx, dz) || 1; oMoveSafe(p, dx / d * speed * dt, dz / d * speed * dt); }
        // last stretch to the router: walk straight at it
        if (tr.by < 0 && !p.hasTr && Math.floor(p.x / CS) === Math.floor(tr.x / CS) && Math.floor(p.z / CS) === Math.floor(tr.z / CS)) { const dx = tr.x - p.x, dz = tr.z - p.z, d = Math.hypot(dx, dz) || 1; oMoveSafe(p, dx / d * speed * dt, dz / d * speed * dt); }
      } else if (!team) {
        // lost sight of someone: go and look where they were last seen
        if (b.ls) { b.goal = [clamp(Math.floor(b.ls[0] / CS), 0, OG - 1), clamp(Math.floor(b.ls[1] / CS), 0, OG - 1), b.ls[2] || 0]; b.gT = 4; b.path = []; b.pT = 0; b.ls = null; }
        else if (!b.goal || b.gT <= 0 || !b.path.length) { const others = g.P.filter((q, j) => j !== i && q.alive); const o = others.length && Math.random() < 0.6 ? others[rint(0, others.length - 1)] : null; b.goal = o ? [Math.floor(o.x / CS), Math.floor(o.z / CS), mlLevel(o.x, o.z, o.jh)] : OPS_CELLS.up.length && Math.random() < 0.45 ? OPS_CELLS.up[rint(0, OPS_CELLS.up.length - 1)] : OPS_CELLS.spawn[rint(0, OPS_CELLS.spawn.length - 1)]; b.gT = b.goal[2] ? 14 : 6; b.path = []; }
        goal = b.goal;
      } else if (p.tm === 0) {
        if (bm.st === 0) {
          const ch = opsSiteAt(p.x, p.z, p.jh), site = ["a", "b"][g.rsite];
          if (ch === site) { act = true; goal = null; }
          else { if (!b.goal || b.goalKind !== site) { const c = OPS_CELLS[site]; b.goal = c[rint(0, c.length - 1)]; b.goalKind = site; b.path = []; } goal = b.goal; }
        } else { if (!b.goal || b.gT <= 0) { const c = OPS_CELLS[["a", "b"][bm.site]]; b.goal = c[rint(0, c.length - 1)]; b.gT = 5; b.path = []; b.goalKind = "guard"; } goal = b.goal; }
      } else {
        if (bm.st === 1) {
          if (Math.hypot(p.x - bm.x, p.z - bm.z) < 1.5 && Math.abs((p.jh || 0) - (bm.y || 0)) < 1.5) { act = true; goal = null; }
          else { const bc = [Math.floor(bm.x / CS), Math.floor(bm.z / CS), (bm.y || 0) > 1 ? 1 : 0]; if (!b.goal || b.goalKind !== "bomb") { b.goal = bc; b.goalKind = "bomb"; b.path = []; } goal = b.goal; if (!b.path.length && Math.floor(p.x / CS) === bc[0] && Math.floor(p.z / CS) === bc[1]) { const dx = bm.x - p.x, dz = bm.z - p.z, d = Math.hypot(dx, dz) || 1; oMoveSafe(p, dx / d * speed * dt, dz / d * speed * dt); } }
        } else { const site = ["a", "b"][b.site || 0]; if (!b.goal || b.gT <= 0 || b.goalKind !== site) { const c = OPS_CELLS[site]; b.goal = c[rint(0, c.length - 1)]; b.gT = 7 + Math.random() * 5; b.path = []; b.goalKind = site; } goal = b.goal; }
      }
      b.gT -= dt;
      this.procAct(S, i, act, dt);
      if (act || !goal) return;
      if ((!b.path.length || b.pT <= 0)) { b.path = oPath(Math.floor(p.x / CS), Math.floor(p.z / CS), goal[0], goal[1], mlLevel(p.x, p.z, p.jh), goal[2] || 0); b.pT = 2.5; }
      const nx = b.path[0];
      if (nx) {
        const tx = nx[0] * CS + CS / 2, tz = nx[1] * CS + CS / 2, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
        if (d < 0.4) b.path.shift();
        else { const want = Math.atan2(dx, dz); let da = ((want - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; p.a += clamp(da, -dt * 6, dt * 6); const s = Math.min(d, speed * dt); oMoveSafe(p, dx / d * s, dz / d * s); }
      }
    },
    pack(S) {
      const g = S.g, b = g.bomb;
      return {
        md, mp: g.mp, rd: g.rd, hf: g.half ? 1 : 0, ph: g.ph, pt: Math.max(0, Math.round(g.pt * 10)), sc: g.sc, bomb: [b.st, +b.x.toFixed(2), +b.z.toFixed(2), Math.max(0, Math.round(b.t * 10)), b.site, +(b.y || 0).toFixed(2)],
        pl: g.P.map(p => [Math.max(0, Math.round(p.hp)), p.alive, p.tm, p.k, p.d, Math.round(p.arm), p.cur, p.rsq, +p.rx.toFixed(2), +p.rz.toFixed(2), p.cr, Math.round(p.actT * 10), p.w, Math.ceil(p.rT * 10), p.hsk, p.pw, p.gone, p.as, p.gr[0], p.gr[1], p.pk, Math.round(p.hold * 10), p.hasTr, p.amS || 0, p.sh ? 1 : 0]),
        bt: g.P.map(p => p.bot ? (p.jh > 0.05 ? [+p.x.toFixed(2), +p.z.toFixed(2), +(p.a + Math.PI).toFixed(2), +p.jh.toFixed(2)] : [+p.x.toFixed(2), +p.z.toFixed(2), +(p.a + Math.PI).toFixed(2)]) : 0),
        bs: g.P.map(p => p.bot && p.shot ? p.shot : 0), kf: g.kf, ann: g.ann, gb: (g.gb || []).map(e => e[0]), pr: g.pr.map((q, k) => { if (q.hp <= 0) return 0; const f = q.hp / OPROP[OPS_PROPS[k].t].hp; return f > 0.67 ? 1 : f > 0.34 ? 2 : 3; }).join(""), fx: g.fx,
        kb: g.P.map(p => p.kb || 0), rk: g.rk.map(r => [r.id, +r.x.toFixed(2), +r.y.toFixed(2), +r.z.toFixed(2)]), wp: g.wp.map(w => w.rt > 0 ? 0 : 1).join(""), tr: g.tr ? [+g.tr.x.toFixed(2), +g.tr.y.toFixed(2), +g.tr.z.toFixed(2), g.tr.by] : 0,
        gn: g.gn.map(n => [n.id, n.k, +n.x.toFixed(2), +n.y.toFixed(2), +n.z.toFixed(2)]), sm: g.sm.map(s => [s.id, +s.x.toFixed(2), +s.z.toFixed(2), Math.round(s.t * 10)]),
      };
    },
    timeLeft(S) { const g = S.g; if (!team) return (this.DUR - g.t) * 1000; return (g.bomb.st === 1 && g.ph === "live" ? g.bomb.t : g.pt) * 1000; },
    done(S) { const g = S.g, hs = g.P.filter(p => !p.bot); if (hs.length && hs.every(p => p.gone)) return true; return team ? g.over : troph ? (g.t >= this.DUR || g.P.some(p => p.hold >= this.HOLD)) : (g.t >= this.DUR || g.P.some(p => p.k >= this.GOAL)); },
    rank(S) {
      // anyone who left before the end goes to the bottom and earns no place or league points
      const late = (p) => p.joinT != null && p.joinT > S.g.t * 0.5 ? 1 : 0;
      if (troph) return S.g.P.map((p, i) => ({ i, gone: p.gone, late: late(p), v: Math.floor(p.hold), de: p.d, k: p.k, label: Math.floor(p.hold) + "s held · " + p.k + " elim" + (p.k === 1 ? "" : "s"), rec: Math.floor(p.hold) })).sort((a, b) => (a.gone - b.gone) || (b.v - a.v) || (b.k - a.k) || (a.de - b.de));
      const g = S.g, win = g.sc[0] === g.sc[1] ? -1 : g.sc[0] > g.sc[1] ? 0 : 1;
      return g.P.map((p, i) => ({ i, gone: p.gone, late: late(p), v: p.k, de: p.d, w: team && p.tm === win ? 1 : 0, label: (team ? TEAM[p.tm].short + " · " : "") + p.k + " elim" + (p.k === 1 ? "" : "s") + " · " + p.d + " death" + (p.d === 1 ? "" : "s"), rec: p.k }))
        .sort((a, b) => (a.gone - b.gone) || (b.w - a.w) || (b.v - a.v) || (a.de - b.de));
    },
    board(S) {
      const g = S.g;
      if (troph) {
        const rows = g.P.map((p, i) => ({ i, tm: -1, v: [Math.floor(p.hold), p.k, p.d, Math.round(p.dmg)] })).sort((a, b) => (b.v[0] - a.v[0]) || (b.v[1] - a.v[1]));
        return { cols: ["HOLD", "K", "D", "DMG"], tips: ["Seconds holding the Golden Router", "Kills", "Deaths", "Damage dealt"], rows, mvp: rows.length ? rows[0].i : -1, teams: null, sub: (cap ? "Capture the Router · " : "Golden Router · ") + OPS_M.n };
      }
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
        ctx.font = "700 64px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#ff4d5e"; ctx.fillText("IT", W * 0.27, H * 0.16); ctx.fillStyle = "#f5f1e6"; ctx.font = "700 36px 'Chakra Petch', sans-serif"; ctx.fillText("VS", W / 2, H * 0.16); ctx.fillStyle = "#3fa9ff"; ctx.font = "700 52px 'Chakra Petch', sans-serif"; ctx.fillText("BUSINESS", W * 0.73, H * 0.16);
      } else if (arena) {
        const gl = ctx.createRadialGradient(W / 2, H * 0.5, 10, W / 2, H * 0.5, 460); gl.addColorStop(0, laser ? "rgba(255,61,240,.5)" : "rgba(255,200,61,.55)"); gl.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#2a2e39"; [[0.12, 0.7, 0.22], [0.66, 0.62, 0.24]].forEach(([x0, y0, w0]) => { ctx.fillRect(W * x0, H * y0, W * w0, H); ctx.fillStyle = laser ? "#ff3df0" : "#ff8a3d"; ctx.fillRect(W * x0, H * y0, W * w0, 6); ctx.fillStyle = "#2a2e39"; });
        drawChar(ctx, ro[1].c, W * 0.24, H * 0.42 + Math.sin(t * 3) * 14, 100, { t, color: ro[1].hex, phase: 1 });
        drawChar(ctx, ro[2].c, W * 0.78, H * 0.38 + Math.cos(t * 3) * 14, 100, { t, color: ro[2].hex, phase: 2 });
        if (laser) { ctx.strokeStyle = "#ff3df0"; ctx.lineWidth = 8; ctx.shadowColor = "#ff3df0"; ctx.shadowBlur = 24; ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.42); ctx.lineTo(W * 0.72, H * 0.38); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = "#cfd4de"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W * 0.24, H * 0.35); ctx.lineTo(W * 0.5, H * 0.08); ctx.stroke(); }
        if (troph) { ctx.save(); ctx.translate(W / 2, H * (cap ? 0.62 : 0.52)); ctx.shadowColor = "#ffc83d"; ctx.shadowBlur = 40; ctx.fillStyle = "#ffc83d"; ctx.fillRect(-90, -24, 180, 48); ctx.fillRect(-70, -90, 10, 70); ctx.fillRect(-5, -100, 10, 80); ctx.fillRect(60, -90, 10, 70); ctx.shadowBlur = 0; ctx.fillStyle = "#3ddc97"; for (let k = 0; k < 6; k++) ctx.fillRect(-60 + k * 22, 6, 10, 6); ctx.restore(); }
        ctx.font = "700 56px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = laser ? "#ff3df0" : "#ffc83d"; ctx.fillText(cap ? "CAPTURE THE ROUTER" : laser ? "LASER ARENA" : "GOLDEN ROUTER", W / 2, H * 0.15);
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
      const F = V.fps = { ready: false, failed: false, me: { x: OG * CS / 2, z: OG * CS / 2, a: 0, p: 0 }, rsq: -1, cur: 0, last: KNIFE, stepT: 0, ammo: OW.map(w => w.mag), res: OW.map(w => w.res), reloadT: 0, fireCd: 0, firing: false, latch: false, scoped: false, bloom: 0, kick: 0,
        shotN: 0, claimN: Math.floor(now()), thSeq: Math.floor(now()), rkSeq: Math.floor(now()), claims: [], look: { dx: 0, dy: 0 }, stick: null, lookT: null, lastHp: 100, hurtT: 0, hitT: 0, hitHead: false, kfSeen: 0, annSeen: 0, ann: null, toasts: [], remote: {}, shSeen: {}, bob: 0, buySeq: Math.floor(now()), buyReq: null, act: false, tab: false, lastW: undefined, prevPh: "", spec: 0 };
      loadThree().then(ok => { if (!ok) { F.failed = true; return; } if (APP.V === V) this.build(V); });
      this.bind(V);
    },
    // someone took a bot's place: their name and face over the head
    rosterChanged(V, i) { const F = V.fps, av = F && F.avatars && F.avatars[i], r = V.ro[i]; if (!av || !r || !av.spr) return; const old = av.spr.material.map; av.spr.material.map = frenzy.charTex(r.c, r.hex, r.n); av.spr.material.needsUpdate = true; if (old && old.dispose) old.dispose(); },
    clientExit(V) {
      const F = V.fps; if (!F) return; F.gone = true;
      (F.unbind || []).forEach(f => f());
      if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
      SFX.amb(null); SFX.muffle(0);
      if (F.post) try { F.post.dispose(); } catch (e) {}
      if (F.nx) try { F.nx.dispose(); } catch (e) {}
      if (F.renderer) { try { F.renderer.dispose(); F.renderer.forceContextLoss(); } catch (e) {} }
      [F.cv, F.setBtn, F.setPanel, F.shop, F.touch].forEach(el => el && el.remove()); GFX.bleed("");
      V.fps = null;
    },
    owned(V) { const pl = V.g && V.g.pl && V.g.pl[V.meIdx]; if (laser) return [LASER]; const o = []; if (pl && pl[12] >= 0) o.push(pl[12]); o.push(pl && pl[15] != null ? pl[15] : 0, KNIFE); return o; },
    throwNade(V, k) {
      const F = V.fps, pl = V.g && V.g.pl && V.g.pl[V.meIdx]; if (!F || !pl || !pl[1] || F.shop && !F.shop.hidden) return;
      if (!(pl[18 + k] > 0)) { FX.text(W / 2, H * 0.7, arena ? (k ? "NO SMOKE" : "NO FRAG") : k ? "NO SMOKE · BUY ONE (B)" : "NO FRAG · BUY ONE (B)", "#ff8a3d", 0.9); return; }
      if (performance.now() - (F.thAt || 0) < 900) return; F.thAt = performance.now();
      F.thSeq = (F.thSeq || 0) + 1; F.th = [F.thSeq, k, +F.me.a.toFixed(3), +(F.me.p + (F.rec || 0)).toFixed(3), F.cr > 0.5 ? 1 : 0];
      F.throwT = 0.45; SFX.swish(0.7); SFX.clank(0.25);
    },
    slotOf(V, slot) { return this.owned(V).find(w => OW[w].slot === slot); },
    switchTo(V, wi) {
      const F = V.fps; if (!F || !this.owned(V).includes(wi) || F.cur === wi) return;
      F.last = F.cur; F.cur = wi; F.reloadT = 0; F.scoped = false; F.rescope = -1; F.fireCd = Math.max(F.fireCd, OW[wi].melee ? 0.2 : 0.35); F.swapT = 0.35; if (OW[wi].melee) SFX.swish(0.25); else SFX.clank(0.5);
    },
    reload(V) { const F = V.fps, W0 = OW[F.cur]; if (W0.melee || F.reloadT > 0 || F.ammo[F.cur] >= W0.mag) return; if (!W0.laser && F.res && !(F.res[F.cur] > 0)) return; F.reloadT = W0.rl; F.scoped = false; F.rescope = -1; if (!SFX.reload(W0.id, W0.rl)) { SFX.clank(0.6); setTimeout(() => SFX.clank(0.5), W0.rl * 450); setTimeout(() => SFX.clank(0.8), W0.rl * 880); } },
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
      F.shop.querySelectorAll("[data-it]").forEach(b => { const it = +b.dataset.it, cost = itemCost(it), own = it === ARMOR_IT ? pl[5] >= 100 : it === FRAG_IT ? pl[18] > 0 : it === SMOKE_IT ? pl[19] > 0 : it === AMMO_IT ? ![pl[12], pl[15]].some(w => w > 0 && OW[w] && F.res && F.res[w] < OW[w].res) : (pl[12] === it || pl[15] === it); b.disabled = own || (team && pl[10] < cost); b.classList.toggle("own", own); });
    },
    bind(V) {
      const F = V.fps, cv = $("#gameCanvas");
      const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); (F.unbind || (F.unbind = [])).push(() => el.removeEventListener(ev, fn, o)); };
      const coarse = matchMedia("(pointer: coarse)").matches;
      on(cv, "contextmenu", (e) => e.preventDefault());
      const specNext = () => { F.specOff = (F.specOff || 0) + 1; F.specManual = true; F.specAuto = 0; };
      // grab the mouse. Browsers refuse a re-grab for about a second after Esc, so a refusal is retried
      // on the next click instead of giving up; only after several refusals do we fall back to drag-to-look.
      const lockFail = () => { F.lockFails = (F.lockFails || 0) + 1; F.lockRetryAt = performance.now() + 1100; if (F.lockFails >= 4) F.noLock = true; };
      const grab = () => {
        F.lockTry = performance.now();
        try {
          const r = cv.requestPointerLock({ unadjustedMovement: true });
          if (r && r.catch) r.catch(() => { try { const r2 = cv.requestPointerLock(); if (r2 && r2.catch) r2.catch(lockFail); } catch (er) { lockFail(); } });
        } catch (er) { try { cv.requestPointerLock(); } catch (er2) { lockFail(); } }
      };
      on(document, "pointerlockerror", () => { if (APP.V === V) lockFail(); });
      // listen on the whole stage, not just the canvas, so a leftover overlay can't swallow the click
      on($("#stagebox"), "mousedown", (e) => {
        const tg = e.target;
        if (tg !== cv && tg.closest && tg.closest("button, input, select, textarea, a, .ops-shop, .look-panel, .look-btn, .card")) return;
        if (V.meIdx < 0 || F.watchTm) { specNext(); return; }
        if (coarse) return;
        if (document.pointerLockElement !== cv) {
          // first click only grabs the mouse; it never fires. Drag-to-look works meanwhile.
          if (F.noLock) { F.dragLook = true; if (e.button === 0) F.firing = true; }
          grab();
          return;
        }
        if (e.button === 0) F.firing = true;
        if (e.button === 2 && laser) this.hook(V, true);
        if (e.button === 2 && OW[F.cur].scope) { F.scoped = !F.scoped; F.rescope = -1; SFX.clank(0.3); }
        if (e.button === 2) F.adsHeld = true;
        if (e.button === 2 && OW[F.cur].melee) F.stab = true;
      });
      on(window, "mouseup", (e) => { if (e.button === 0) { F.firing = false; F.latch = false; } if (e.button === 2 && F.hk && !F.hkKey) F.hk = null; if (e.button === 2) F.adsHeld = false; F.dragLook = false; });
      on(window, "mousemove", (e) => {
        const locked = document.pointerLockElement === cv; if (!locked && !F.dragLook) return;
        const mx = e.movementX || 0, my = e.movementY || 0;
        // browsers sometimes report a huge jump right after the lock engages: drop those
        if (locked && performance.now() - (F.lockAt || 0) < 80) return;
        if (Math.abs(mx) > 400 || Math.abs(my) > 400) return;
        F.look.dx += mx; F.look.dy += my;
      });
      on(document, "pointerlockchange", () => { if (document.pointerLockElement === cv) { F.lockAt = performance.now(); F.lockFails = 0; F.noLock = false; } else { F.firing = false; F.latch = false; F.dragLook = false; } });
      on(window, "wheel", (e) => { if (APP.view !== "game") return; const o = this.owned(V); const k = o.indexOf(F.cur); this.switchTo(V, o[(k + (e.deltaY > 0 ? 1 : o.length - 1)) % o.length]); }, { passive: true });
      on(window, "keydown", (e) => {
        if (APP.view !== "game" || (e.target && e.target.tagName === "INPUT")) return;
        if (e.code === "Tab") { F.tab = true; e.preventDefault(); }
        if (V.meIdx < 0 || F.watchTm) { if (e.code === "Space" || e.code === "ArrowRight") { F.specOff = (F.specOff || 0) + 1; F.specManual = true; F.specAuto = 0; e.preventDefault(); } if (e.code === "ArrowLeft") { F.specOff = (F.specOff || 0) - 1; F.specManual = true; F.specAuto = 0; } return; }
        if (e.repeat) return;
        const shopOpen = F.shop && !F.shop.hidden;
        if (shopOpen && (/^Digit[0-9]$/.test(e.code) || e.code === "Minus" || (team && e.code === "Equal"))) { const k = e.code === "Equal" ? 11 : e.code === "Minus" ? 10 : e.code === "Digit0" ? 9 : +e.code.slice(-1) - 1, it = [...OW_BUY, ARMOR_IT, FRAG_IT, SMOKE_IT, AMMO_IT][k]; if (it != null) this.buy(V, it); return; }
        if (e.code === "Space") { F.wantJump = true; e.preventDefault(); }
        if (e.code === "KeyR") this.reload(V);
        if (e.code === "KeyE") F.act = true;
        if (e.code === "KeyF" && laser) { F.hkKey = true; this.hook(V, true); }
        if (e.code === "KeyQ") this.switchTo(V, F.last);
        if (e.code === "Digit4" || e.code === "KeyG") this.throwNade(V, 0);
        if (e.code === "Digit5") this.throwNade(V, 1);
        if (/^Digit[1-3]$/.test(e.code)) { const w = this.slotOf(V, +e.code.slice(-1)); if (w != null) this.switchTo(V, w); }
        if (e.code === "KeyB") this.shopOpen(V, !shopOpen);
        if (e.code === "Escape" && shopOpen) this.shopOpen(V, false);
        if (e.code === "KeyI") { const L = lookPrefs(); L.iy = !L.iy; saveLookPrefs(L); toast("Mouse look up/down: " + (L.iy ? "inverted" : "normal")); syncLookPanel(F); }
      });
      on(window, "keyup", (e) => { if (e.code === "KeyF" && F.hkKey) { F.hkKey = false; F.hk = null; } if (e.code === "KeyE") F.act = false; if (e.code === "Tab") F.tab = false; });
      // touch
      on(cv, "touchstart", (e) => {
        if (V.meIdx < 0 || F.watchTm) { specNext(); return; }
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
        mk("ALT", "t-scope", () => { if (OW[F.cur].scope) { F.scoped = !F.scoped; F.rescope = -1; } else F.adsHeld = !F.adsHeld; if (OW[F.cur].melee) F.stab = true; });
        mk("R", "t-r", () => this.reload(V));
        mk("💣", "t-frag", () => this.throwNade(V, 0));
        mk("☁", "t-smoke", () => this.throwNade(V, 1));
        mk("⤒", "t-jump", () => { F.wantJump = true; });
        mk("⤓", "t-crouch", () => { F.crouchT = !F.crouchT; });
        mk("⇄", "t-swap", () => { const o = this.owned(V); this.switchTo(V, o[(o.indexOf(F.cur) + 1) % o.length]); });
        if (team) mk("USE", "t-use", () => { F.act = true; }, () => { F.act = false; });
        if (laser) mk("HOOK", "t-use", () => this.hook(V, true), () => { F.hk = null; });
        if (!arena) mk("BUY", "t-buy", () => this.shopOpen(V, F.shop.hidden));
        box.append(tc); F.touch = tc;
      }
      // shop (not in the jump arena: weapons are picked up there)
      if (V.meIdx >= 0 && !arena) {
        const sh = document.createElement("div"); sh.className = "ops-shop"; sh.hidden = true;
        const head = document.createElement("div"); head.className = "sh-head"; head.innerHTML = "<b>NETEAM ARMORY</b><span data-cr>$0</span>";
        const grid = document.createElement("div"); grid.className = "sh-grid";
        [...OW_BUY.map(w => [w, OW[w].n, OW[w].d]), [ARMOR_IT, "Kevlar vest", "Absorbs damage"], [FRAG_IT, "Frag grenade", "4 or G to throw · bounces"], [SMOKE_IT, "Smoke grenade", "5 to throw · blocks vision"]].concat(team ? [[AMMO_IT, "Ammo", "Refill spare rounds for your guns"]] : []).forEach(([it, n, d], k) => {
          const b = document.createElement("button"); b.type = "button"; b.dataset.it = it;
          const cost = itemCost(it);
          b.innerHTML = "<small>" + ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="][k] + "</small><b></b><i></i><em>" + (team ? "$" + cost.toLocaleString() : "") + "</em>";
          if (OW[it]) b.style.borderLeft = "3px solid " + OW[it].col;
          b.querySelector("b").textContent = n; b.querySelector("i").textContent = d;
          b.addEventListener("click", () => this.buy(V, it));
          grid.append(b);
        });
        const foot = document.createElement("div"); foot.className = "sh-foot"; foot.textContent = "1-9, 0, - to pick · B to close";
        const close = document.createElement("button"); close.type = "button"; close.className = "btn"; close.textContent = "Done"; close.addEventListener("click", () => this.shopOpen(V, false));
        sh.append(head, grid, foot, close); sh.addEventListener("mousedown", e => e.stopPropagation());
        box.append(sh); F.shop = sh;
      }
      // aim settings (shared with the other 3D game)
      const sb = document.createElement("button"); sb.type = "button"; sb.className = "look-btn"; sb.innerHTML = "<span>⚙</span> Settings";
      const sp = opsSettingsPanel();
      sb.addEventListener("click", (e) => { e.stopPropagation(); if (document.pointerLockElement) try { document.exitPointerLock(); } catch (er) {} sp.hidden = !sp.hidden; syncLookPanel(F); });
      box.append(sb, sp); F.setBtn = sb; F.setPanel = sp;
    },
    clientInput(V, dt, inp) {
      const F = V.fps; if (!F || !F.ready) return null;
      const g = V.g || {}, me = V.meIdx; if (me < 0) return null;
      const pl = g.pl && g.pl[me];
      const alive = !pl || pl[1] === 1;
      if (pl && pl[7] !== F.rsq) { // (re)spawn
        F.rsq = pl[7]; F.me.x = pl[8]; F.me.z = pl[9]; F.me.p = 0; F.spawnHintT = team ? 0 : 5; F.hurtDir = null; F.reloadT = 0;
        // free-for-all modes: a full load every life. Breach: guns you survive with keep what's left in them; the starting pistol is always reloaded
        if (!team || !F.ammo || !F.res) { F.ammo = OW.map(w => w.mag); F.res = OW.map(w => w.res); } else { F.ammo[0] = OW[0].mag; F.res[0] = OW[0].res; } F.scoped = false; F.rescope = -1; F.adsHeld = false; F.ads = 0;
        F.me.a = team ? (pl[2] === 0 ? 0 : Math.PI) : opsSpawnYaw(F.me.x, F.me.z);
        F.cur = pl[12] >= 0 ? pl[12] : (pl[15] != null ? pl[15] : 0);
        F.jh = oHAt(F.me.x, F.me.z); F.vy = 0; F.vel = { x: 0, z: 0 }; F.hk = null; F.spawnHintT = arena ? 5 : F.spawnHintT;
      }
      // picked a gun up off a pad: fresh magazine
      if (pl && pl[20] !== F.pkSeen) { if (F.pkSeen !== undefined && pl[12] >= 0) { F.ammo[pl[12]] = OW[pl[12]].mag; F.res[pl[12]] = OW[pl[12]].res; F.reloadT = 0; SFX.clank(0.7); } F.pkSeen = pl[20]; }
      if (pl && pl[23] !== F.amSeen) { if (F.amSeen !== undefined) { for (const w of [pl[12], pl[15]]) if (w >= 0 && OW[w]) { F.res[w] = OW[w].res; } SFX.clank(0.7); } F.amSeen = pl[23]; }   // bought ammo
      // rocket blast shove (rocket jumps)
      const kb = g.kb && g.kb[me];
      const kbN = Array.isArray(kb) ? kb[0] : 0;
      if (kbN !== F.kbSeen) { if (F.kbSeen !== undefined && Array.isArray(kb) && alive) { F.vel = F.vel || { x: 0, z: 0 }; F.vel.x += kb[1]; F.vel.z += kb[3]; F.vy = Math.max(F.vy || 0, 0) + kb[2]; F.jh = (F.jh || 0) + 0.02; } F.kbSeen = kbN; }
      // picked up / bought a new gun: switch to it with a full magazine
      if (pl && pl[12] !== F.lastW) { if (pl[12] >= 0 && F.lastW !== undefined) { F.cur = pl[12]; F.ammo[pl[12]] = OW[pl[12]].mag; F.res[pl[12]] = OW[pl[12]].res; } F.lastW = pl[12]; }
      if (pl && pl[15] != null && pl[15] !== F.lastP) { if (F.lastP != null && pl[15] !== 0) { F.cur = pl[15]; F.ammo[pl[15]] = OW[pl[15]].mag; F.res[pl[15]] = OW[pl[15]].res; } F.lastP = pl[15]; }
      if (!this.owned(V).includes(F.cur)) F.cur = this.owned(V)[0];
      // phase changes
      if (g.ph !== F.prevPh) { if (team && g.ph === "buy" && alive && !matchMedia("(pointer: coarse)").matches) this.shopOpen(V, true); if (g.ph !== "buy" && F.shop && !F.shop.hidden) this.shopOpen(V, false); F.prevPh = g.ph; }
      if (F.shop && !F.shop.hidden) this.syncShop(V);
      // look
      // aiming down the sights (hold right mouse) on guns without a scope: 0..1, eased in and out
      { const W = OW[F.cur], can = !W.scope && !W.melee && !W.laser && !W.rocket && F.adsHeld && !(F.reloadT > 0) && !(F.swapT > 0) && alive;
        F.ads = clamp((F.ads || 0) + (can ? dt : -dt) * 7, 0, 1); }
      // the sniper goes back into its scope once the bolt is worked, unless you reload or switch
      if (F.rescope >= 0 && F.rescope === F.cur && !(F.reloadT > 0) && F.fireCd <= OW[F.cur].rate * 0.22 && alive) { F.scoped = true; F.rescope = -1; }
      const LK = lookPrefs(), sens = 0.0024 * LK.s * (F.scoped ? 0.3 : 1) * (1 - 0.3 * (F.ads || 0));
      F.me.a -= F.look.dx * sens * (LK.ix ? -1 : 1); F.me.p = clamp(F.me.p - F.look.dy * sens * (LK.iy ? -1 : 1), -1.25, 1.25);
      F.lookVX = F.look.dx / Math.max(dt, 0.001) * 0.016; F.lookVY = F.look.dy / Math.max(dt, 0.001) * 0.016;
      F.look.dx = 0; F.look.dy = 0;
      // recoil: holds while you keep firing, then settles back to where you were aiming (nothing is left behind)
      F.recT = (F.recT || 0) + dt; { const k = 1 - Math.exp(-dt * (F.recT > 0.17 ? 7.5 : 0.3)); F.rec = Math.max(0, (F.rec || 0) * (1 - k) - (F.recT > 0.17 ? dt * 0.02 : 0)); F.recA = (F.recA || 0) * (1 - k); if (F.recT > 0.4) F.recN = 0; }
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
        const crouchKey = KEYS.has("KeyC") || (KEYS.has("ControlLeft") && kbLocked()) || F.crouchT;
        OPS_STEP = 0.35; const gPre = oGround(F.me.x, F.me.z, PR, F.jh || 0), airPre = (F.jh || 0) > gPre + 0.01 || (F.vy || 0) > 0; F.tuck = !!(crouchKey && airPre); OPS_STEP = F.tuck ? 0.68 : 0.35;
        F.cr = lerp(F.cr || 0, crouchKey && !airPre ? 1 : 0, 1 - Math.pow(0.0001, dt));
        const top = 5.4 * W0.spd * (arena ? 1.3 : 1) * (pl && pl[22] ? 0.92 : 1) * (walk ? 0.5 : 1) * (F.scoped ? 0.55 : 1) * (1 - 0.25 * (F.ads || 0)) * (1 - 0.55 * F.cr);
        const sa = Math.sin(F.me.a), ca = Math.cos(F.me.a);
        // velocity with acceleration / friction instead of instant start-stop; little air control
        const tvx = (-sa * fx + ca * sx) * top, tvz = (-ca * fx - sa * sx) * top, air = airPre;
        F.vel = F.vel || { x: 0, z: 0 };
        F.padFly = Math.max(0, (F.padFly || 0) - dt);
        if (F.padFly > 0) { /* booster flight: the arc is set, no steering until the last stretch */ }
        else if (arena && air) {
          // Quake air control: strafing while turning adds speed, holding forward alone doesn't
          const wl = Math.hypot(tvx, tvz);
          if (wl > 0.01) { const wx = tvx / wl, wz = tvz / wl, cur = F.vel.x * wx + F.vel.z * wz, add = 1.1 - cur; if (add > 0) { const ac = Math.min(add, 14 * wl * dt); F.vel.x += ac * wx; F.vel.z += ac * wz; } }
        } else { const accel = air ? 2.5 : Math.hypot(tvx, tvz) > 0.1 ? 16 : 11, kk = 1 - Math.exp(-accel * dt); F.vel.x = lerp(F.vel.x, tvx, kk); F.vel.z = lerp(F.vel.z, tvz, kk); }
        // grappling hook: pull toward the anchor
        if (F.hk) {
          const hx = F.hk[0] - F.me.x, hy = F.hk[1] - ((F.jh || 0) + 1.2), hz = F.hk[2] - F.me.z, hd = Math.hypot(hx, hy, hz);
          if (hd < 1.6 || !alive) F.hk = null;
          else { const pull = 34 * dt; F.vel.x += hx / hd * pull; F.vel.z += hz / hd * pull; F.vy = (F.vy || 0) + hy / hd * pull + 17 * dt * 0.55; if (!air && hy > 0) F.jh = (F.jh || 0) + 0.02; }
        }
        { const sp = Math.hypot(F.vel.x, F.vel.z), cap = F.padFly > 0 ? 99 : arena ? 17 : 99; if (sp > cap) { F.vel.x *= cap / sp; F.vel.z *= cap / sp; } }
        const mx = F.vel.x * dt, mz = F.vel.z * dt, ox0 = F.me.x, oz0 = F.me.z;
        OPS_FEET = F.jh || 0; oMove(F.me, mx, mz); OPS_FEET = 0;
        // stop velocity going into walls so you don't stick
        if (Math.abs(F.me.x - ox0) < Math.abs(mx) * 0.5) F.vel.x *= 0.3; if (Math.abs(F.me.z - oz0) < Math.abs(mz) * 0.5) F.vel.z *= 0.3;
        const spdNow = Math.hypot(F.vel.x, F.vel.z);
        moving = spdNow > 1.2;
        // jump / fall / land (decks: stand on them, drop off their edges)
        const JV = arena ? 7.2 : 5.4, gNow = oGround(F.me.x, F.me.z, PR, F.jh || 0); OPS_STEP = 0.35;
        // (on stairs going down you stay on your feet instead of falling a little every frame)
        const onG = ((F.jh || 0) <= gNow + 0.01 || (OPS_ML && F.wasG && (F.jh || 0) - gNow < 0.45)) && (F.vy || 0) <= 0;
        if (onG) {
          F.jh = gNow; F.vy = 0;
          if ((F.wantJump || (arena && KEYS.has("Space"))) && F.cr < 0.5) { F.vy = JV; SFX.jump(0.5); }
          if (arena && !gNow && oCh(F.me.x, F.me.z) === "^") {
            const J = OPS_JUMP[Math.floor(F.me.z / CS) * OG + Math.floor(F.me.x / CS)];
            if (J) { // booster: a fixed arc that lands on the far side whatever way you walked onto it
              const dx = J[0] - F.me.x, dz = J[1] - F.me.z, T = clamp(Math.hypot(dx, dz) / 15, 0.9, 2.6); F.vel.x = dx / T; F.vel.z = dz / T; F.vy = 8.5 * T; F.padFly = T * 0.82; F.hk = null; SFX.swish(1); SFX.pad(0.9);
            } else { F.vy = 13.5; F.vel.x += -sa * 2.5; F.vel.z += -ca * 2.5; SFX.swish(0.9); SFX.pad(0.7); }
            F.padT = 0.4;
          }
        }
        F.wantJump = false; F.wasG = onG && !(F.vy > 0);
        if (!onG || F.vy > 0) {
          const nj = (F.jh || 0) + (F.vy || 0) * dt - 8.5 * dt * dt; F.vy -= 17 * dt;   // exact arc: the same jump height at any frame rate
          if (nj <= gNow && F.vy <= 0) {
            const iv = -(F.vy || 0); F.jh = gNow; F.vy = 0; SFX.land(clamp((iv - 3) / 11, 0.15, 1));
            if (arena && KEYS.has("Space") && F.cr < 0.5 && !(!gNow && oCh(F.me.x, F.me.z) === "^")) F.vy = JV; else F.landT = 0.18; // bunny hop: keep the speed (but a pad you land on fires next frame)
          } else { F.jh = nj; if (OPS_ML) { const c = mlCeilR(F.me.x, F.me.z, PR, F.jh) - 1.8; if (F.jh > c) { F.jh = c; if (F.vy > 0) F.vy = 0; } } const top = (OPS_M.wallH || 99) - 1.95; if (OPS_M.theme !== "roof" && OPS_M.theme !== "desert" && F.jh > top) { F.jh = top; if (F.vy > 0) F.vy = 0; } }
        }
        F.inAir = (F.jh || 0) > gNow + 0.01 || F.vy > 0;
        F.landT = Math.max(0, (F.landT || 0) - dt);
        F.bob += spdNow * dt * 2.4 * (F.inAir ? 0 : 1);
        F.moving = moving && !walk && F.cr < 0.5 && !F.inAir; F.walking = (walk || F.cr >= 0.5) && moving;
        // footsteps: running is loud, Shift-walking is silent
        if (F.moving) { F.stepT += Math.hypot(mx, mz); if (F.stepT > 2.45) { F.stepT = 0; SFX.step(0.34, 0, F.stepAlt = !F.stepAlt); } }
      } else { F.moving = false; F.vel = { x: 0, z: 0 }; F.jh = F.jh || 0; F.vy = 0; F.cr = 0; F.hk = null; }
      F.eyeH = EYE - 0.55 * (F.cr || 0) + (F.jh || 0) - (F.landT || 0) * 0.35;
      // weapon
      if (F.reloadT > 0) { F.reloadT -= dt; if (F.reloadT <= 0) { F.reloadT = 0; const need = W0.mag - F.ammo[F.cur], take = W0.laser || !F.res ? need : Math.min(need, F.res[F.cur] || 0); F.ammo[F.cur] += take; if (!W0.laser && F.res) F.res[F.cur] -= take; } }
      F.fireCd -= dt;
      const canFire = alive && playing && !(team && g.ph !== "live") && (!F.shop || F.shop.hidden);
      if (canFire && (F.firing || (F.stab && W0.melee)) && F.fireCd <= 0 && F.reloadT <= 0 && !(F.latch && !W0.auto)) {
        const over = Math.max(F.fireCd, -Math.min(dt, 0.05));   // keep the overshoot: the same fire rate at 30 fps as at 144 fps
        if (W0.melee) { F.fireCd = over + (F.stab ? 1.0 : W0.rate); F.latch = !!F.stab; this.melee(V, !!F.stab); F.stab = false; }
        else if (F.ammo[F.cur] > 0) { F.fireCd = over + W0.rate; F.latch = true; this.fire(V); if (!W0.laser) F.ammo[F.cur]--; if (F.ammo[F.cur] === 0) this.reload(V); }
        else { if (!W0.laser && F.res && !(F.res[F.cur] > 0) && !F.latch) { SFX.clack(0.35, 0, 2.2); F.dryT = 1.2; } this.reload(V); F.latch = true; }   // click: empty
      }
      const act = F.act && alive;
      if (F.claims.length > 48) F.claims.splice(0, F.claims.length - 24);
      const out = { x: +F.me.x.toFixed(2), z: +F.me.z.toFixed(2), a: +F.me.a.toFixed(2), p: +(F.me.p || 0).toFixed(2), q: F.rsq, w: F.cur, sh: F.lastShot || 0, hc: F.claims.slice(-12), act: act ? 1 : 0, cr: F.cr > 0.5 ? 1 : 0, jh: +(F.jh || 0).toFixed(2), th: F.th || 0, rk: F.rk || 0, hk: F.hk ? F.hk.map(v => +v.toFixed(2)) : 0 };
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
      if (best >= 0) { F.claims.push([++F.claimN, best, 0, KNIFE, stab ? 1 : 0]); F.hitT = 0.3; F.hitHead = false; this.pop(F, stab ? 65 : 34, false, "KNIFE"); SFX.samp("thwack1", 0.7, 0, 0.9) || SFX.tap(0.5, 400); }
    },
    // grappling hook (Laser Arena): latch onto a wall or deck in front of you
    hook(V, on) {
      const F = V.fps, me = F.me; if (!F || !F.ready || !on) return; const pl = V.g && V.g.pl && V.g.pl[V.meIdx]; if (!pl || !pl[1]) return;
      const EY = F.eyeH || EYE, cp = Math.cos(me.p), dir = [-Math.sin(me.a) * cp, Math.sin(me.p), -Math.cos(me.a) * cp], h = Math.hypot(dir[0], dir[2]) || 1e-6, R = 34;
      let t = oRay(me.x, me.z, dir[0] / h, dir[2] / h, R) / h; const wallT = t, floorT = dir[1] < -1e-4 ? EY / -dir[1] : 1e9;
      t = oRayDecks([me.x, EY, me.z], dir, Math.min(t, floorT));
      if (OPS_ML) t = mlRay([me.x, EY, me.z], dir, R);   // (the hook is only in the arena modes, which have no multi-level maps yet)
      else if (t >= floorT - 1e-3) { SFX.clack(0.3, 0, 1.3); return; }
      const y = EY + dir[1] * t, hitWall = t >= wallT - 1e-3 && t < R / h - 0.01;
      if (t >= R - 0.01 || (hitWall && y > (OPS_M.wallH || OWH)) || (dir[1] < -0.2 && t < 3)) { SFX.clack(0.3, 0, 1.3); return; }
      F.hk = [me.x + dir[0] * t, y, me.z + dir[2] * t]; F.hkT = 0; SFX.clank(0.8); SFX.swish(0.6);
    },
    fireRocket(V) {
      const F = V.fps, me = F.me, W0 = OW[F.cur], EY = F.eyeH || EYE, aimP = me.p + (F.rec || 0), cp = Math.cos(aimP);
      SFX.shot("rocket", 1); SFX.swish(0.8); F.kick = 1.6; if (F.flash) F.flash.intensity = 18; F.rec = Math.min(0.16, (F.rec || 0) + W0.kick); F.recT = 0; F.fovK = 3; if (F.vp) F.vp[3] += (Math.random() - 0.5) * 1.2;
      const dir = [-Math.sin(me.a) * cp, Math.sin(aimP), -Math.cos(me.a) * cp];
      F.rkSeq = (F.rkSeq || 0) + 1; F.rk = [F.rkSeq, +me.x.toFixed(2), +(EY - 0.15).toFixed(2), +me.z.toFixed(2), +dir[0].toFixed(3), +dir[1].toFixed(3), +dir[2].toFixed(3)];
      F.shotN++; F.lastShot = [F.shotN, +(me.x + dir[0] * 4).toFixed(2), +(EY + dir[1] * 4).toFixed(2), +(me.z + dir[2] * 4).toFixed(2), F.cur];
    },
    fire(V) {
      const F = V.fps, me = F.me, W0 = OW[F.cur];
      if (W0.rocket) return this.fireRocket(V);
      SFX.shot(W0.snd, 1);
      F.kick = 1; if (F.flash) F.flash.intensity = W0.pel ? 22 : 14;
      let spread = W0.laser ? 0 : (W0.spr + (F.moving ? W0.mv : F.walking ? W0.mv * 0.35 : 0) + F.bloom) * (F.cr > 0.5 ? 0.65 : 1) + (F.inAir ? 0.09 : 0);
      if (W0.scope && !F.scoped) spread = 0.07 + (F.moving ? W0.mv : 0);
      if (F.ads > 0) spread *= 1 - (W0.pel ? 0.3 : 0.55) * F.ads;
      F.bloom = Math.min(0.06, F.bloom + (W0.auto ? 0.006 : 0.012));
      const aimA = me.a + (F.recA || 0), aimP = me.p + (F.rec || 0);
      // recoil pattern: the first rounds climb, then the muzzle weaves side to side. It is the same every spray, so it can be learned.
      { const n = F.recN = (F.recN || 0) + 1, up = n < 3 ? 0.75 : n < 9 ? 1.05 : 0.4, sw = n < 4 ? 0 : Math.sin((n - 4) * 0.55 + F.cur * 1.7);
        F.rec = Math.min(Math.min(0.14, W0.kick * 6 + 0.02), (F.rec || 0) + W0.kick * up * (0.85 + Math.random() * 0.3));
        F.recA = clamp((F.recA || 0) + W0.kick * (sw * 0.55 + (Math.random() - 0.5) * 0.3), -0.06, 0.06); F.recT = 0;
        if (F.vp) F.vp[3] += (Math.random() - 0.5) * W0.kick * 18; if (W0.kick >= 0.04) F.fovK = W0.kick * 45; }
      const EY = F.eyeH || EYE;
      const start = [me.x - Math.sin(aimA) * 0.6 + Math.cos(aimA) * 0.2, EY - 0.16, me.z - Math.cos(aimA) * 0.6 - Math.sin(aimA) * 0.2];
      const pel = W0.pel || 1; let hitAny = false, headAny = false, lastEnd = null; const dmgAcc = {}, headIdx = {}, armLeft = {};
      for (let k = 0; k < pel; k++) {
        const ya = aimA + (Math.random() - 0.5) * 2 * spread, pa = aimP + (Math.random() - 0.5) * 2 * spread * (pel > 1 ? 0.6 : 1);
        const cp = Math.cos(pa), dir = [-Math.sin(ya) * cp, Math.sin(pa), -Math.cos(ya) * cp];
        const h = Math.hypot(dir[0], dir[2]) || 1e-6;
        let t = oRay(me.x, me.z, dir[0] / h, dir[2] / h, W0.range) / h;
        if (dir[1] < -1e-4) t = Math.min(t, EY / -dir[1]);
        if (dir[1] > 1e-4 && OPS_M.theme !== "desert" && OPS_M.theme !== "roof") t = Math.min(t, ((OPS_M.ceilH || OPS_M.wallH || OWH) - EY) / dir[1]);
        t = OPS_ML ? mlRay([me.x, EY, me.z], dir, W0.range) : oRayDecks([me.x, EY, me.z], dir, t);
        const prh = oRayProps([me.x, EY, me.z], dir, t); if (prh[1] >= 0) t = prh[0];
        // glass on the way (or just behind the wall face the shot stops at) shatters; the shot carries on through it
        const gph = OPS_PANES.length && OPS_PANES_ID === OPS_ID ? oRayPanes([me.x, EY, me.z], dir, t) : [0, -1];
        if (gph[1] >= 0 && !(F.pgClaim && F.pgClaim[gph[1]] > now() - 600)) { (F.pgClaim = F.pgClaim || {})[gph[1]] = now(); F.claims.push([++F.claimN, -10000 - gph[1], 0, F.cur]); }
        let hitIdx = -1, hitY = 0;
        V.ro.forEach((r, i) => {
          if (i === V.meIdx) return;
          const pl = V.g && V.g.pl && V.g.pl[i]; if (!pl || !pl[1]) return;
          const av = F.remote[i]; if (!av) return;
          // hit shapes that match the 1.8 m characters: a body cylinder from the shins to the shoulders, and a head ball on top
          const ox = me.x - av.x, oz = me.z - av.z, sc = 1 - 0.3 * (av.cr || 0), jh = av.jh || 0;
          const hy = jh + 1.63 * sc, hr = 0.15, oy = EY - hy, hb = ox * dir[0] + oy * dir[1] + oz * dir[2], hc = ox * ox + oy * oy + oz * oz - hr * hr, hd = hb * hb - hc;
          if (hd >= 0) { const th = -hb - Math.sqrt(hd); if (th > 0 && th < t) { t = th; hitIdx = i; hitY = 2; return; } }
          const a = dir[0] * dir[0] + dir[2] * dir[2], b = 2 * (ox * dir[0] + oz * dir[2]), c = ox * ox + oz * oz - 0.3 * 0.3;
          const disc = b * b - 4 * a * c; if (disc < 0) return;
          for (const th of [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)]) {   // front of the cylinder, or its far side when the shot drops in over the shoulders
            if (th <= 0 || th >= t) continue;
            const y = (EY + dir[1] * th - jh) / sc; if (y < 0.15 || y > 1.47) continue;
            t = th; hitIdx = i; hitY = y; return;
          }
        });
        const end = [me.x + dir[0] * t, EY + dir[1] * t, me.z + dir[2] * t]; lastEnd = end;
        if (k < 3) this.addTracer(V, start, end, W0.laser ? V.ro[V.meIdx].hex : W0.col, hitIdx < 0, W0.laser);
        if (hitIdx < 0 && prh[1] < 0 && !W0.laser) this.impact(V, end, dir);
        if (hitIdx < 0 && prh[1] >= 0) { F.claims.push([++F.claimN, -1 - prh[1], 0, F.cur]); this.chips(V, end, OPS_PROPS[prh[1]].t); }
        if (hitIdx >= 0) {
          const pls = V.g.pl, mine = pls[V.meIdx];
          const friendly = team && pls[hitIdx][2] === mine[2];
          if (!friendly) {
            const head = hitY > 1.5; F.claims.push([++F.claimN, hitIdx, head ? 1 : 0, F.cur]); hitAny = true; headAny = headAny || head;
            const av = F.remote[hitIdx], dd = av ? Math.hypot(av.x - me.x, av.z - me.z) : 0, arm = (armLeft[hitIdx] != null ? armLeft[hitIdx] : pls[hitIdx][5]) || 0;
            let est = W0.dmg * (head ? W0.hs : 1) * opsFall(W0, dd); const ab = opsArmor(W0, est, head, arm); armLeft[hitIdx] = arm - ab; est -= ab;
            dmgAcc[hitIdx] = (dmgAcc[hitIdx] || 0) + est; if (head) headIdx[hitIdx] = 1;
          }
        }
      }
      F.shotN++; F.lastShot = [F.shotN, +lastEnd[0].toFixed(2), +lastEnd[1].toFixed(2), +lastEnd[2].toFixed(2), F.cur];
      this.shell(V); if (!W0.laser) SFX.casing(0.5, W0.pel ? 1 : 0);
      if (hitAny) { F.hitT = 0.3; F.hitHead = headAny; SFX.hit(headAny); }
      Object.keys(dmgAcc).forEach(k => this.pop(F, Math.round(dmgAcc[k]), !!headIdx[k]));
      if (W0.scope && F.scoped) { F.scoped = false; F.rescope = F.cur; }
    },
    // spent casing flips out of the ejection port
    shell(V) {
      const F = V.fps, T = THREE, gm = F.guns && F.guns[F.cur], U = gm && gm.userData; if (!U || !U.port || !F.vfx || GFX.lowEnd()) return;
      const sg = OW[F.cur].pel, m = new T.Mesh(F.shellG || (F.shellG = new T.CylinderGeometry(0.006, 0.006, 0.022, 6)), new T.MeshStandardMaterial({ color: sg ? 0xb02a22 : 0xc9a03a, metalness: sg ? 0.1 : 1, roughness: 0.35 }));
      if (sg) m.scale.set(1.8, 2, 1.8);
      gm.updateWorldMatrix(true, false); const wp = new T.Vector3(...U.port).applyMatrix4(gm.matrixWorld); m.position.copy(wp); F.scene.add(m);
      const a = F.me.a, rx = Math.cos(a), rz = -Math.sin(a), sp = 1.6 + Math.random() * 1.2;
      F.vfx.push({ m, life: 1.5, max: 1.5, v: [rx * sp + (F.vel ? F.vel.x : 0), 1.6 + Math.random() * 1.2 + (F.vy || 0) * 0.5, rz * sp + (F.vel ? F.vel.z : 0)], g: 11, r: (F.jh || 0) > 0.5 ? -50 : 0.012, sp: [Math.random() * 20, Math.random() * 20, Math.random() * 20] });
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
      // maps whose look has been rebuilt on the NX renderer (baked light, scanned materials, HDR camera); the rest still use the older one below
      const nxMap = !!(NXW.themes[OPS_M.nx || OPS_M.theme] && (store("nfa-gfx") || {}).nx !== 0);
      let renderer;
      try { renderer = new T.WebGLRenderer(nxMap ? { canvas: cv, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" } : { canvas: cv, antialias: low, powerPreference: "high-performance" }); } catch (e) { F.failed = true; return; }
      F.renderer = renderer;
      if (nxMap) { this.buildNX(V, renderer); return; }
      renderer.setPixelRatio(Math.min(low ? 1.25 : 1.75, devicePixelRatio || 1));
      renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = { office: 0.95, farm: 1.0, desert: 0.92, roof: 1.2 }[OPS_M.theme] || 1;
      F.renderer = renderer;
      // realistic grade: restrained bloom, near-neutral saturation, slightly stronger contact occlusion
      F.post = GFX.post(renderer, { strength: 0.5, threshold: 1.15, vignette: 0.34, low, ao: true, aoRadius: 0.65, aoStrength: 1.25, sat: 1.05 });
      const scene = new T.Scene(); F.scene = scene;
      const TH = OPS_M.theme, outdoor = TH === "desert" || TH === "roof";
      const skyGrad = (stops) => { const t2 = GFX.tex(8, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); }); t2.wrapS = t2.wrapT = T.ClampToEdgeWrapping; return t2; };
      if (TH === "desert") { scene.background = skyGrad([[0, "#5d93c9"], [0.55, "#a9c8e0"], [0.8, "#f1d9ae"], [1, "#e8c48c"]]); scene.fog = new T.FogExp2(0xe6cfa5, 0.011); }
      else if (TH === "roof") { scene.background = skyGrad([[0, "#030409"], [0.6, "#121226"], [0.85, "#3a1c34"], [1, "#ff7a4a"]]); scene.fog = new T.FogExp2(0x1a1424, 0.013); }
      else { scene.background = new T.Color(0x05070f); scene.fog = new T.FogExp2(TH === "farm" ? 0x0a1420 : 0x0d1122, 0.016); }
      const cam = new T.PerspectiveCamera(74, 16 / 10, 0.05, 160); F.cam = cam; scene.add(cam);
      scene.environment = GFX.env(renderer, TH === "desert" ? { base: 0x9a8a70 } : {});
      // swap the generated environment for a real HDR one once it has loaded (reflections + soft fill light)
      if (!low) GFX.hdri(renderer, { office: "lobby", farm: "warehouse", desert: "sunset", roof: "night" }[TH] || "lobby").then((env) => {
        if (!env || F.gone) return; scene.environment = env;
        const k = { office: 1.0, farm: 1.0, desert: 1.1, roof: 1.4 }[TH] || 1;
        scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { if (m.isMeshStandardMaterial) { m.envMapIntensity = k; m.needsUpdate = true; } }); });
      });
      if (TH === "desert") {
        scene.add(new T.HemisphereLight(0xdfe9ff, 0x8a6a40, 1.5));
        const sun = new T.DirectionalLight(0xffe2b8, 3.6); sun.position.set(30, 50, 12); scene.add(sun); F.key = sun;
        const sunG = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(3, 2.6, 1.8), transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false })); sunG.scale.set(40, 40, 1); sunG.position.set(OG * CS / 2 + 90, 120, OG * CS / 2 + 36); scene.add(sunG);
      } else if (TH === "roof") {
        scene.add(new T.HemisphereLight(0x9fb0e8, 0x33283a, 1.35));
        const moon = new T.DirectionalLight(0xb4c4ff, 1.9); moon.position.set(-20, 40, -10); scene.add(moon); F.key = moon;
      } else { scene.add(new T.HemisphereLight(TH === "farm" ? 0xcfe4ff : 0xdfe4ff, 0x3a3040, 0.9)); const top = new T.DirectionalLight(0xfff0dc, 0.9); top.position.set(6, 40, 9); scene.add(top); F.key = top; }
      const tex = (w, h, fn) => GFX.tex(w, h, fn);
      const size = OG * CS;
      // ---- lights: warm office panels in corridors, coloured at sites and spawns
      const cen = (cells) => { let bx = cells[0], bd = 1e9; const mx = cells.reduce((s, q) => s + q[0], 0) / cells.length, mz = cells.reduce((s, q) => s + q[1], 0) / cells.length; cells.forEach(q => { const d = Math.hypot(q[0] - mx, q[1] - mz); if (d < bd) { bd = d; bx = q; } }); return cellC(bx); };
      const LIGHTS = !OPS_CELLS.r.length ? [] : [[OPS_SITE[0], 0x4cc9f0, 2.4], [OPS_SITE[1], 0x3ddc97, 2.4], [cen(OPS_CELLS.r), 0xff4d5e, 1.4], [cen(OPS_CELLS.u), 0x3fa9ff, 1.4]];
      const lampCol = { farm: 0xbfe0ff, desert: 0xffd9a0, roof: 0xff9a5c }[TH] || 0xffe6c4, grid = [];
      for (let z = 2; z < OG - 1; z += 4) for (let x = 2; x < OG - 1; x += 4) { const c = [[x, z], [x + 1, z], [x, z + 1], [x - 1, z], [x, z - 1]].find(q => !oWall(q[0], q[1])); if (c) grid.push(c); }
      grid.sort((p0, q0) => ((p0[0] * 7 + p0[1] * 13) % 11) - ((q0[0] * 7 + q0[1] * 13) % 11)).forEach(c => LIGHTS.push([cellC(c), lampCol, outdoor ? 1.1 : 1.6]));
      LIGHTS.slice(0, low ? 8 : outdoor ? 10 : 16).forEach(([p, c, k]) => { const l = new T.PointLight(c, 40 * k, 18, 1.3); l.position.set(p[0], OWH - 0.35, p[1]); scene.add(l); });
      // ---- floor: one baked texture for the whole map (zones, carpet, contact shadows near walls) + glow pools
      const px = low ? 32 : 64, FW = OG * px;
      // real = true draws only the paint layer (zone tints, joints, hazard stripes, contact shadows) on a transparent canvas,
      // to be laid over a tiling PBR floor; real = false is the fully procedural floor (fallback when textures are missing)
      const drawFloor = (x, real) => {
        const JN = { farm: [4, 0.5], desert: [2, 0.42], roof: [1, 0.4] }[TH] || [2, 0.1];
        for (let z = 0; z < OG; z++) for (let c = 0; c < OG; c++) {
          const ch = OPS_MAP[z][c], X = c * px, Y = z * px;
          if (ch === "#") { x.fillStyle = "#000"; x.fillRect(X, Y, px, px); continue; }
          const zone = { a: ["#24344f", "#4cc9f0"], b: ["#22403a", "#3ddc97"], r: ["#3c1d27", "#ff4d5e"], u: ["#1b2a47", "#3fa9ff"] }[ch];
          if (zone) { // raised-floor tiles
            x.globalAlpha = real ? 0.34 : 1; x.fillStyle = zone[0]; x.fillRect(X, Y, px, px); x.globalAlpha = 1;
            x.strokeStyle = real ? "rgba(0,0,0,.2)" : "rgba(0,0,0,.45)"; x.lineWidth = real ? 1 : px / 32; for (let k = 0; k <= 2; k++) { x.beginPath(); x.moveTo(X + k * px / 2, Y); x.lineTo(X + k * px / 2, Y + px); x.moveTo(X, Y + k * px / 2); x.lineTo(X + px, Y + k * px / 2); x.stroke(); }
            x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(X + 2, Y + 2, px / 2 - 4, px / 2 - 4); x.fillRect(X + px / 2 + 2, Y + px / 2 + 2, px / 2 - 4, px / 2 - 4);
          } else if (real) { // joints between carpet tiles / floor plates / pavers / concrete slabs
            x.strokeStyle = "rgba(0,0,0," + JN[1] + ")"; x.lineWidth = 1; x.beginPath();
            for (let k = 0; k < JN[0]; k++) { const o = Math.round(k * px / JN[0]) + 0.5; x.moveTo(X + o, Y); x.lineTo(X + o, Y + px); x.moveTo(X, Y + o); x.lineTo(X + px, Y + o); }
            x.stroke();
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
        if (!real) { mx.fillStyle = "#fff"; mx.fillRect(0, 0, FW, FW); } mx.fillStyle = "#000";
        OPS_MAP.forEach((r, z) => [...r].forEach((ch, c) => { if (ch === "#") mx.fillRect(c * px - px * 0.04, z * px - px * 0.04, px * 1.08, px * 1.08); }));
        const b = document.createElement("canvas"); b.width = b.height = FW; const bx = b.getContext("2d"); bx.filter = "blur(" + Math.round(px * 0.22) + "px)"; bx.drawImage(m, 0, 0);
        if (real) { x.globalAlpha = 0.72; x.drawImage(b, 0, 0); x.globalAlpha = 1; }
        else { x.globalCompositeOperation = "multiply"; x.globalAlpha = 0.85; x.drawImage(b, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; }
      };
      const floorTex = tex(FW, FW, (x) => drawFloor(x, false));
      floorTex.wrapS = floorTex.wrapT = T.ClampToEdgeWrapping;
      const glowTex = tex(FW / 2, FW / 2, (x, w) => { x.fillStyle = "#000"; x.fillRect(0, 0, w, w); x.globalCompositeOperation = "lighter"; const s = w / size; LIGHTS.forEach(([p, c, k]) => { const col = new T.Color(c), r = (k > 2 ? 3.2 : 2.2) * CS * s; const g = x.createRadialGradient(p[0] * s, p[1] * s, 0, p[0] * s, p[1] * s, r); g.addColorStop(0, `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},${k > 2 ? 0.5 : 0.22})`); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, w); }); });
      glowTex.wrapS = glowTex.wrapT = T.ClampToEdgeWrapping;
      const bump = tex(128, 128, (x, w, h) => { x.fillStyle = "#808080"; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { const v = 100 + Math.random() * 60 | 0; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.fillStyle = "#3a3a3a"; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h); });
      bump.repeat.set(OG, OG);
      const floor = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshStandardMaterial({ map: floorTex, emissiveMap: glowTex, emissive: 0xffffff, emissiveIntensity: outdoor ? 0.22 : 0.45, normalMap: GFX.normal(bump, 3), normalScale: new T.Vector2(0.6, 0.6), roughness: 0.82, metalness: 0.05 }));
      floor.rotation.x = -Math.PI / 2; floor.position.set(size / 2, 0, size / 2); scene.add(floor);
      if (OPS_M.sky) { const am = tex(OG * 8, OG * 8, (x, w) => { x.fillStyle = "#fff"; x.fillRect(0, 0, w, w); x.fillStyle = "#000"; OPS_MAP.forEach((r, z) => [...r].forEach((ch, c) => { if (ch === "v") x.fillRect(c * 8, z * 8, 8, 8); })); }); floor.material.alphaMap = am; floor.material.alphaTest = 0.5; floor.material.side = T.DoubleSide; }
      // real floor material: loop-pile carpet (office), scuffed steel plates (server farm), warm stone pavers (desert), weathered concrete (rooftops)
      const FLR = { farm: ["metal", 2, { color: 0x8a9099, metal: 0.6, rough: 1.25, ns: 0.9 }], desert: ["concrete", 3, { color: 0xf3d9ae, ns: 1.3 }], roof: ["concrete", 3.5, { color: 0xa4a8b0, ns: 1.3 }] }[TH] || ["carpet", 0.6, { ns: 0.8 }];
      GFX.skin(floor.material, FLR[0], size / FLR[1], size / FLR[1], FLR[2]).then((ok) => { if (!ok || F.gone) return; GFX.paint(floor.material, tex(FW, FW, (x) => drawFloor(x, true))); floor.material.emissiveIntensity *= 0.55; });
      // big site letters on the floor (glowing)
      if (OPS_CELLS.a.length) ["A", "B"].forEach((L, k) => {
        const t2 = tex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = k ? "#3ddc97" : "#4cc9f0"; x.font = "700 200px 'Chakra Petch', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(L, w / 2, h / 2 + 12); x.lineWidth = 8; x.strokeStyle = k ? "#3ddc97" : "#4cc9f0"; x.beginPath(); x.arc(w / 2, h / 2, 118, 0, 7); x.stroke(); });
        const m = new T.Mesh(new T.PlaneGeometry(5.5, 5.5), new T.MeshBasicMaterial({ map: t2, transparent: true, depthWrite: false, opacity: 0.9, color: new T.Color(1.6, 1.6, 1.6), blending: T.AdditiveBlending }));
        m.rotation.x = -Math.PI / 2; m.position.set(OPS_SITE[k][0], (OPS_SITE[k][2] || 0) + 0.02, OPS_SITE[k][1]); scene.add(m);
      });
      // ---- ceiling: acoustic tiles + glowing light panels (bloom picks them up)
      const ceilTex = tex(256, 256, (x, w, h) => { x.fillStyle = "#e4e6ee"; x.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { x.fillStyle = "rgba(0,0,0,.035)"; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.strokeStyle = "#5d6178"; x.lineWidth = 5; for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); } });
      const ceilEm = tex(256, 256, (x, w, h) => { x.fillStyle = "#000"; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(255,244,224,.3)"; x.fillRect(136, 136, 112, 112); x.fillStyle = "#fff4e0"; x.fillRect(146, 146, 92, 92); });
      ceilTex.repeat.set(OG, OG); ceilEm.repeat.set(OG / 2, OG / 2);
      const ceil = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshStandardMaterial({ map: ceilTex, emissiveMap: ceilEm, emissive: 0xffffff, emissiveIntensity: 1.35, roughness: 0.95 }));
      ceil.rotation.x = Math.PI / 2; ceil.position.set(size / 2, OPS_M.wallH || OWH, size / 2); if (!outdoor) scene.add(ceil);
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
      const WH = OPS_M.wallH || OWH, box = new T.BoxGeometry(CS, WH, CS);
      mats.forEach((mat, k) => { if (!mat || !walls[k].length) return; const im = new T.InstancedMesh(box, mat, walls[k].length); const m4 = new T.Matrix4(); walls[k].forEach(([x, z], i) => { m4.makeTranslation(x * CS + CS / 2, WH / 2, z * CS + CS / 2); im.setMatrixAt(i, m4); }); scene.add(im); });
      // ---- stylized pass: trims along every wall (cornice/cap + skirting), soft height shading on wall faces
      const STY = { office: [0xff7a2f, 0x23262e], farm: [0x4cc9f0, 0x1a1d24], desert: [0xf6e6c6, 0x8a5a36], roof: [0xff8a5c, 0x26282e] }[TH] || [0xff7a2f, 0x23262e];
      const capM = new T.MeshStandardMaterial({ color: STY[0], roughness: 0.4, metalness: 0.1, emissive: TH === "desert" ? 0x000000 : STY[0], emissiveIntensity: TH === "desert" ? 0 : 0.12 }), baseM = new T.MeshStandardMaterial({ color: STY[1], roughness: 0.55, metalness: 0.2 });
      const openWalls = walls.flat();
      [[new T.BoxGeometry(CS + 0.18, outdoor ? 0.2 : 0.12, CS + 0.18), capM, outdoor ? WH + 0.1 : OWH - 0.3], [new T.BoxGeometry(CS + 0.07, 0.24, CS + 0.07), baseM, 0.12]].forEach(([g0, m0, y]) => {
        const im = new T.InstancedMesh(g0, m0, openWalls.length), m4 = new T.Matrix4();
        openWalls.forEach(([x, z], i) => { m4.makeTranslation(x * CS + CS / 2, y, z * CS + CS / 2); im.setMatrixAt(i, m4); }); scene.add(im);
      });
      [0, 2, 5, 6].forEach(k => { if (mats[k]) GFX.paint(mats[k], null, [0.5, 1.06]); });
      // real wall materials: painted plaster, brick, adobe sandstone, cast concrete. The paint layer keeps the accent stripe,
      // formwork joints and the baked top/bottom occlusion; tiling is a whole number per cell so courses line up across cells.
      const wallP = (fn) => tex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); if (fn) fn(x, w, h); x.globalAlpha = 0.6; AO(x, w, h); x.globalAlpha = 1; });
      GFX.skin(mats[0], "plaster", 2, WH / 2, { color: 0xf1efe9, shade: [0.76, 1.02], paint: wallP((x, w, h) => { x.fillStyle = "#2c5c9c"; x.fillRect(0, h * 0.56, w, 9); x.fillStyle = "rgba(0,0,0,.22)"; x.fillRect(0, h * 0.56 + 9, w, 1.5); }) });
      GFX.skin(mats[2], "brick", 4, WH / 1.2, { ns: 1.2, shade: [0.72, 1.02], paint: wallP() });
      GFX.skin(mats[5], "sandstone", 2, WH / 2, { ns: 1.3, shade: [0.8, 1.02], paint: wallP((x, w, h) => { const g = x.createLinearGradient(0, h, 0, h * 0.62); g.addColorStop(0, "rgba(96,62,28,.4)"); g.addColorStop(1, "rgba(96,62,28,0)"); x.fillStyle = g; x.fillRect(0, h * 0.62, w, h * 0.38); }) });
      GFX.skin(mats[6], "concrete", 2, WH / 2, { color: 0xc9ccd2, ns: 1.4, shade: [0.76, 1.02], paint: wallP((x, w, h) => { x.fillStyle = "rgba(0,0,0,.32)"; x.fillRect(0, h / 2 - 1, w, 2); x.fillRect(w / 2 - 1, 0, 2, h); x.fillRect(0, 0, 1.5, h); x.fillRect(w - 1.5, 0, 1.5, h); x.fillStyle = "rgba(0,0,0,.4)"; [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].forEach(([a, b]) => { x.beginPath(); x.arc(w * a, h * b, 3, 0, 7); x.fill(); }); }) });
      // outdoor skyline dressing: palms / water towers + antennas standing behind the outer walls, and soft clouds
      if (outdoor) {
        const trunkM = new T.MeshStandardMaterial({ color: TH === "desert" ? 0x8a6040 : 0x4a4d55, roughness: 0.8 }), frondM = new T.MeshStandardMaterial({ color: 0x3fae5a, roughness: 0.7, side: T.DoubleSide });
        const tankM = new T.MeshStandardMaterial({ color: 0x7a5236, roughness: 0.75 }), redM = new T.MeshBasicMaterial({ color: new T.Color(3, 0.4, 0.3) });
        const border = []; OPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch === "#" && (x === 0 || z === 0 || x === OG - 1 || z === OG - 1) && (x * 3 + z * 5) % 4 === 0) border.push([x, z]); }));
        border.forEach(([x, z], i) => {
          const g = new T.Group(), px0 = x * CS + CS / 2 + (x === 0 ? -2 : x === OG - 1 ? 2 : 0), pz0 = z * CS + CS / 2 + (z === 0 ? -2 : z === OG - 1 ? 2 : 0);
          if (TH === "desert") {
            const hgt = 6 + (i * 37 % 5); const tr = new T.Mesh(new T.CylinderGeometry(0.16, 0.28, hgt, 7), trunkM); tr.position.y = hgt / 2; tr.rotation.z = ((i % 3) - 1) * 0.12; g.add(tr);
            for (let k = 0; k < 7; k++) { const fr = new T.Mesh(new T.ConeGeometry(0.55, 3.2, 4, 1, true), frondM); fr.scale.set(1, 1, 0.25); fr.position.set(Math.sin(k * 0.9) * 1.3, hgt - 0.3, Math.cos(k * 0.9) * 1.3); fr.rotation.set(Math.cos(k * 0.9) * 1.25, 0, -Math.sin(k * 0.9) * 1.25); g.add(fr); }
          } else if (i % 3 === 0) {
            const tk = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 2.6, 12), tankM); tk.position.y = 6.2; const cap = new T.Mesh(new T.ConeGeometry(1.55, 1.0, 12), tankM); cap.position.y = 8; g.add(tk, cap);
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const leg = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 4.9, 5), trunkM); leg.position.set(a, 2.45, b); g.add(leg); });
          } else { const an = new T.Mesh(new T.CylinderGeometry(0.05, 0.09, 7, 5), trunkM); an.position.y = 3.5; const tip = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), redM); tip.position.y = 7.05; g.add(an, tip); }
          g.position.set(px0, 0, pz0); scene.add(g);
        });
        const cloudT = GFX.tex(128, 64, (x, w, h) => { x.clearRect(0, 0, w, h); for (let k = 0; k < 7; k++) { const cx = 20 + k * 15, cy = 36 - Math.sin(k / 6 * Math.PI) * 12, r = 14 + Math.sin(k / 6 * Math.PI) * 10; const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
        const cloudM = new T.SpriteMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false, color: TH === "desert" ? 0xffffff : 0x6a5a8a, opacity: TH === "desert" ? 0.9 : 0.5 });
        for (let k = 0; k < (low ? 6 : 14); k++) { const c = new T.Sprite(cloudM); const a = k / 14 * Math.PI * 2 + Math.random() * 0.3, d = size * 0.9 + Math.random() * 60; c.position.set(size / 2 + Math.cos(a) * d, 38 + Math.random() * 30, size / 2 + Math.sin(a) * d); const sc2 = 40 + Math.random() * 40; c.scale.set(sc2, sc2 / 2, 1); scene.add(c); }
      }
      // market awnings over doorways in the desert (above head height, purely visual)
      if (TH === "desert") {
        const awnT = (c1, c2) => GFX.tex(64, 64, (x, w, h) => { for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? c1 : c2; x.fillRect(k * 8, 0, 8, h); } });
        const awnMs = [awnT("#e84a3c", "#f6e6c6"), awnT("#2f8fd8", "#f6e6c6"), awnT("#2fae6a", "#f6e6c6"), awnT("#f2a33a", "#7a3a20")].map(t2 => new T.MeshStandardMaterial({ map: t2, roughness: 0.8, side: T.DoubleSide }));
        let n = 0;
        for (const [x, z] of OPS_CELLS.open) { if ((x * 11 + z * 7) % 9 !== 0 || n > 22) continue; const d = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dz]) => oWall(x + dx, z + dz)); if (!d) continue;
          const aw = new T.Mesh(new T.PlaneGeometry(2.6, 1.3), awnMs[n % 4]); const px0 = x * CS + CS / 2 + d[0] * (CS / 2 - 0.62), pz0 = z * CS + CS / 2 + d[1] * (CS / 2 - 0.62);
          aw.position.set(px0, 2.55, pz0); aw.rotation.order = "YXZ"; aw.rotation.y = Math.atan2(-d[0], -d[1]); aw.rotation.x = -1.0; scene.add(aw); n++; }
      }
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
      GFX.skin(crateM, "planks", 1, 1, { ns: 1.2, paint: tex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = "rgba(58,38,20,.8)"; x.lineWidth = 11; x.strokeRect(5, 5, w - 10, h - 10); x.beginPath(); x.moveTo(8, 8); x.lineTo(w - 8, h - 8); x.stroke(); }) });
      GFX.skin(wood, "wood", 1, 1, { r: false });
      const acT = tex(128, 128, (x, w, h) => { x.fillStyle = "#8d929c"; x.fillRect(0, 0, w, h); x.fillStyle = "#5a5f69"; for (let y = 14; y < h - 10; y += 10) x.fillRect(12, y, w - 24, 4); x.strokeStyle = "#ff6a1a"; x.lineWidth = 4; x.strokeRect(3, 3, w - 6, h - 6); });
      const acM = mStd({ map: acT, roughness: 0.5, metalness: 0.6 });
      GFX.skin(acM, "metal", 1, 1, { color: 0xb9bec6, rough: 1.2, paint: tex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = "rgba(20,22,26,.78)"; for (let y = 14; y < h - 10; y += 10) x.fillRect(12, y, w - 24, 4); x.strokeStyle = "#c9601f"; x.lineWidth = 3; x.strokeRect(3, 3, w - 6, h - 6); }) });
      const sites = new Set(OPS_CELLS.a.concat(OPS_CELLS.b).map(([x, z]) => x + "," + z));
      let desks = 0, plants = 0;
      for (const [x, z] of OPS_CELLS.open) {
        const ch = OPS_MAP[z][x], h = (x * 7 + z * 13) % 7; if (OPS_M.only && ch !== ".") continue;
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
      this.buildDyn(V);
    },
    // ---- the NX path: build the world from the generator, then add what moves
    buildNX(V, renderer) {
      const F = V.fps, T = THREE;
      renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.NoToneMapping;
      const scene = new T.Scene(); F.scene = scene;
      const cam = new T.PerspectiveCamera(74, 16 / 10, 0.05, 1700); F.cam = cam; scene.add(cam);
      NX.drsReset();
      NXS.create(renderer, scene, cam, V.g.mp, OPS_M).then((S) => {
        if (F.gone || APP.V !== V) { S.dispose(); return; }
        F.nx = S; const g = S.W.grade || {}; opsPanesEnsure(S.W); F.pgS = null;
        if (g.fog) scene.fog = new T.FogExp2(new T.Color(g.fog[0], g.fog[1], g.fog[2]), g.fogD || 0.01);
        F.post = NXP.create(renderer, S, g);
        F.rackMat = { emissiveIntensity: 0 }; F.shadows = !!S.shadow;
        this.buildDyn(V);
      }).catch((e) => { console.error("[nx] build failed", e); F.failed = true; });
    },
    // ---- everything that moves: breakable props, the payload, players, view-model guns, effects
    buildDyn(V) {
      const F = V.fps, T = THREE, low = GFX.lowEnd(), renderer = F.renderer, scene = F.scene, cam = F.cam;
      const mStd = (o) => new T.MeshStandardMaterial(o), metal = mStd({ color: 0x3a3f58, roughness: 0.35, metalness: 0.8 });
      // ---- breakable props
      this.buildProps(V, scene, mStd);
      if (OPS_M.only) this.buildArena(V, scene, mStd);
      F.boomL = new T.PointLight(0xff7a2a, 0, 26, 1.6); F.boomL.position.y = 1.6; scene.add(F.boomL);
      F.vfx = []; F.scorch = []; F.box1 = new T.BoxGeometry(1, 1, 1); F.ringG = new T.RingGeometry(0.82, 1, 48); F.prA = []; F.prS = []; F.prT = [];
      // ---- payload
      const bomb = new T.Group();
      const bb = new T.Mesh(new T.BoxGeometry(0.62, 0.32, 0.46), mStd({ color: 0x23263a, metalness: 0.7, roughness: 0.35 })); bb.position.y = 0.16;
      const strap = new T.Mesh(new T.BoxGeometry(0.66, 0.1, 0.12), mStd({ color: 0xffd23f, roughness: 0.5 })); strap.position.y = 0.2;
      const scr = new T.Mesh(new T.PlaneGeometry(0.34, 0.12), new T.MeshBasicMaterial({ color: 0xff2a3c })); scr.rotation.x = -Math.PI / 2; scr.position.set(0, 0.325, 0.06);
      const halo = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: 0xff2a3c, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); halo.scale.set(2.2, 2.2, 1); halo.position.y = 0.35;
      const led = new T.PointLight(0xff2a3c, 0, 7, 2); led.position.y = 0.7;
      // the light lives in the scene and only its brightness changes: showing or hiding a light changes the number of
      // lights, and three.js then rebuilds every lit shader (a freeze in the middle of a round)
      bomb.add(bb, strap, scr, halo); bomb.visible = false; scene.add(bomb, led); F.bomb = bomb; F.bombLed = led; F.bombScr = scr; F.bombHalo = halo;
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
      // fit an animated character onto one avatar (replacing whatever body it had): the soldier, or one of the dressed people
      const rig = (av, gl, look) => {
        const SU = THREE_EXTRAS.SkeletonUtils, U = gl.userData, clip = (n) => gl.animations.find(c => c.name === n);
        if (!U.h) {
          gl.scene.updateWorldMatrix(true, true); let lo = 1e9, hi = -1e9; const v = new THREE.Vector3(), w = new THREE.Vector3();
          gl.scene.traverse(o => { if (o.isBone) { o.getWorldPosition(v); lo = Math.min(lo, v.y); hi = Math.max(hi, v.y); } }); U.h = (hi - lo) || 1; U.y0 = lo;
          // there is no idle clip: stand on the walk frame where the feet pass each other
          U.idleT = 0; const wc = clip("walk"), lf = gl.scene.getObjectByName("LeftFoot"), rf = gl.scene.getObjectByName("RightFoot");
          const keep = []; gl.scene.traverse(o => { if (o.isBone) keep.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]); });
          if (wc && lf && rf) { const mx = new THREE.AnimationMixer(gl.scene), a = mx.clipAction(wc); a.play(); let best = 1e9; for (let k = 0; k < 24; k++) { mx.setTime(wc.duration * k / 24); gl.scene.updateWorldMatrix(true, true); lf.getWorldPosition(v); rf.getWorldPosition(w); const d = Math.abs(v.z - w.z) + Math.abs(v.y - w.y); if (d < best) { best = d; U.idleT = wc.duration * k / 24; } } a.stop(); mx.uncacheRoot(gl.scene); keep.forEach(([o, p, q, k]) => { o.position.copy(p); o.quaternion.copy(q); o.scale.copy(k); }); gl.scene.updateWorldMatrix(true, true); }
        }
        const sc = 1.8 / U.h * (look ? look.ht : 1);
        if (av.rb && av.rb.m) { av.rb.mixer.stopAllAction(); av.rb.mixer.uncacheRoot(av.rb.m); av.bd.remove(av.rb.m); if (av.rb.ppl) av.rb.main.forEach(mt => mt.dispose()); av.rb = null; }
        const m = SU.clone(gl.scene); m.scale.multiplyScalar(sc); m.rotation.y = Math.PI; m.position.y = -U.y0 * sc;
        const main = [], ms = [];
        m.traverse(o => { if (!o.isMesh) return; o.frustumCulled = false; o.castShadow = !!F.shadows && !(look && F.crowd); const c = o.material.clone(); c.envMapIntensity = 0.6; if (look) PPL.dress(c, gl, look); main.push(c); o.material = c; ms.push(o); });
        av.bd.children.forEach(c => { if (c !== av.gun && c !== av.fl) c.visible = false; });
        av.bd.add(m);
        const mixer = new THREE.AnimationMixer(m), act = {};
        [["Walking", "walk"], ["Running", "run"]].forEach(([k, n]) => { const c = clip(n); if (c) { const c2 = c.clone(); c2.name = k; act[k] = mixer.clipAction(c2); } });
        av.spr.scale.set(0.5, 0.62, 1); av.gun.scale.setScalar(1.05);
        const nb = (n) => m.getObjectByName(n), B = { s1: nb("Spine01"), s2: nb("Spine02"), nk: nb("neck"), hd: nb("Head"), lu: nb("LeftUpLeg"), ll: nb("LeftLeg"), lf: nb("LeftFoot"), ru: nb("RightUpLeg"), rl: nb("RightLeg"), rf: nb("RightFoot") };
        const okB = Object.values(B).every(Boolean), rest = okB ? Object.values(B).map(bn => [bn, bn.quaternion.clone()]) : null;
        let L1 = 0.44, L2 = 0.45; if (okB) { m.updateWorldMatrix(true, true); const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(); L1 = B.lu.getWorldPosition(p1).distanceTo(B.ll.getWorldPosition(p2)); L2 = B.ll.getWorldPosition(p1).distanceTo(B.lf.getWorldPosition(p2)); }
        if (look) PPL.extras(m, gl, look, F);
        av.rim.material.opacity = look ? 0.1 : 0.55;   // the clothes already say which side: only a faint team glow
        av.rb = { m, mixer, act, cur: "", main, ms, hum: 1, ppl: !!look, hs: look ? look.hs : 1, idleT: U.idleT, B: okB ? B : null, rest, L1, L2, y0: m.position.y, hand: m.getObjectByName("RightHand"), spine: m.getObjectByName("Spine02"), arms: [["RightArm", "RightForeArm", "RightHand"], ["LeftArm", "LeftForeArm", "LeftHand"]].map(a => a.map(n => m.getObjectByName(n))) };
        av.rb.on = undefined;
      };
      const soldier = (gl) => { if (F.gone || !F.avatars) return; F.avatars.forEach((av) => { try { rig(av, gl); } catch (e) { console.warn("soldier model", e); } }); };
      // Business vs IT: real people, each player dressed in one of ten looks (suits on one side, casual on the other)
      F.dress = (av, i) => { const P = F.ppl, lk = P && PPL.lookOf(V, i, team); if (!lk || av.look === lk.id) return; try { rig(av, P[lk.model], lk); av.look = lk.id; } catch (e) { console.warn("person model", e); } };
      // the full soldier and detailed guns for small matches on capable cards; light ones when there are many players or the card is modest
      F.crowd = NX.tier().i <= 1 || V.ro.length > 6;
      const people = (store("nfa-gfx") || {}).ppl !== 0;   // every quality level: office laptops on Performance see the Business vs IT people too
      (people ? GFX.people() : Promise.resolve(null)).then((P) => { if (P && !F.gone && F.avatars) { F.ppl = P; F.avatars.forEach((av, i) => F.dress(av, i)); return; } return GFX.soldier(F.crowd).then((g2) => g2 ? soldier(g2) : GFX.operator().then((gl) => {
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
      })); });
      // ---- view-model guns
      const myHex = (V.ro[V.meIdx] || {}).hex || "#ff8a3d";
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
          fist.visible = false; const ka = GUNS.arm(T, myHex); ka.scale.setScalar(1.15); k1.add(ka); GUNS.setArm(ka, [0, -0.005, 0.03], [0.12, -0.25, 0.5], Math.PI / 2);
          g.scale.setScalar(0.85); g.position.set(0.2, -0.2, -0.38); g.visible = false; cam.add(g);
          return g;
        }
        const gm = GUNS.build(w0, T, { hex: myHex });
        const fl = new T.Sprite(new T.SpriteMaterial({ map: GFX.flashTex(), transparent: true, blending: T.AdditiveBlending, depthWrite: false, color: new T.Color(2.4, 2.1, 1.6) })); fl.scale.set(0.34, 0.34, 1); fl.position.set(gm.userData.muzzle[0], gm.userData.muzzle[1], gm.userData.muzzle[2] - 0.06); fl.visible = false; gm.add(fl); gm.userData.fl = fl;
        gm.position.set(...gm.userData.vm); gm.visible = false; cam.add(gm);
        return gm;
      });
      const flash = new T.PointLight(0xffd59a, 0, 9, 2); flash.position.set(0.22, -0.12, -0.9); cam.add(flash); F.flash = flash;
      F.tracers = []; F.parts = [];
      // the sound of the place: reverb size, floor underfoot and a bed of ambience
      { const th = OPS_M.nx || OPS_M.theme; SFX.space({ office: "room", farm: "hall", vault: "vault", desert: "open", roof: "open", sky: "open" }[th] || "room"); SFX.floor = { desert: "sand", farm: "metal", vault: "metal" }[th] || "hard"; SFX.amb({ office: "office", farm: "farm", vault: "vault", desert: "desert", roof: "roof", sky: "roof" }[th] || "office"); }
      F.tracerGeo = new T.BoxGeometry(0.025, 0.025, 1);
      // bullet holes: one mesh holding a ring of small quads, oldest overwritten first
      { const N = GFX.lowEnd() ? 60 : 180, g = new T.BufferGeometry(), uv = new Float32Array(N * 12); for (let i = 0; i < N; i++) uv.set([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], i * 12);
        g.setAttribute("position", new T.BufferAttribute(new Float32Array(N * 18), 3)); g.setAttribute("uv", new T.BufferAttribute(uv, 2));
        const tex = GFX.tex(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); const c = w / 2; let gr = x.createRadialGradient(c, c, 2, c, c, 30); gr.addColorStop(0, "rgba(0,0,0,.5)"); gr.addColorStop(0.5, "rgba(8,8,8,.28)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, w, h);
          x.strokeStyle = "rgba(0,0,0,.6)"; x.lineWidth = 1.2; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28 + Math.random(), r = 12 + Math.random() * 14; x.beginPath(); x.moveTo(c + Math.cos(a) * 6, c + Math.sin(a) * 6); x.lineTo(c + Math.cos(a + 0.2) * r * 0.6, c + Math.sin(a + 0.2) * r * 0.6); x.lineTo(c + Math.cos(a - 0.1) * r, c + Math.sin(a - 0.1) * r); x.stroke(); }
          x.fillStyle = "rgba(0,0,0,.96)"; x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28, r = 7 + Math.random() * 3.5; x.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } x.fill(); });
        const m = new T.Mesh(g, new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); m.frustumCulled = false; m.renderOrder = 1; scene.add(m); F.holes = { m, N, n: 0 }; }
      F.partM = new T.SpriteMaterial({ map: GFX.glowTex(), transparent: true, blending: T.AdditiveBlending, depthWrite: false });
      // real-time shadows from the key light: characters, walls and props ground the scene
      if (!low && F.key && !F.nx) {
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
        const L = F.key, c = OG * CS / 2, dir = L.position.clone().normalize();
        L.position.set(c + dir.x * 80, dir.y * 80, c + dir.z * 80); L.target.position.set(c, 0, c); scene.add(L.target);
        L.castShadow = true; L.shadow.mapSize.set(2048, 2048); L.shadow.bias = -0.0006; L.shadow.normalBias = 0.04;
        const sc2 = L.shadow.camera; sc2.left = sc2.bottom = -c * 1.15; sc2.right = sc2.top = c * 1.15; sc2.near = 1; sc2.far = 200; sc2.updateProjectionMatrix();
        L.shadow.radius = 3;
        const ceilY = (OPS_M.wallH || OWH) - 0.2;
        scene.traverse(o => {
          if (!o.isMesh || o.parent === cam || !(o.material && (o.material.isMeshStandardMaterial || o.material.isMeshPhysicalMaterial))) return;
          o.receiveShadow = true;
          const pl = o.geometry && o.geometry.type === "PlaneGeometry";
          o.castShadow = !pl && !(o.position.y > ceilY);
        });
        (F.avatars || []).forEach(av => av.bd.traverse(o => { if (o.isMesh) o.castShadow = true; }));
        F.shadows = true;
        F.guns.forEach(gm => gm.traverse(o => { if (o.isMesh) o.castShadow = false; }));
      }
      if (F.nx) { // props and players are lit by the baked probes and cast sun shadows; the gun in your hands does not
        scene.traverse(o => { if (o.isMesh && !o.userData.nxStatic && o.material && o.material.isMeshStandardMaterial && !(o.geometry && o.geometry.type === "PlaneGeometry")) o.castShadow = true; });
        F.guns.forEach(gm => gm.traverse(o => { if (o.isMesh) o.castShadow = false; }));
        F.nx.adopt(scene);
        // soldiers and guns are still loading: wait for them, then prepare every shader behind the loading screen
        GFX.whenLoaded(7000).then(() => { if (F.gone || APP.V !== V || V.fps !== F) return; F.ready = true; this.warmUp(V); });
        return;
      }
      F.ready = true;
    },
    // ---- one hidden frame with a sample of every effect in it, so the first shot, hit, kill and blast of the match do
    // not freeze the picture while the graphics card compiles their shaders (see NXP warm)
    warmUp(V) {
      const F = V.fps, T = THREE; if (!F || !F.post || !F.post.warm) return;
      const snd = SFX.on, sh = F.shake, hu = F.hurtT, x = F.me.x, z = F.me.z, y = oHAt(x, z) + 1.2, sc0 = F.scorch.length, tmp = new T.Group(); SFX.on = false;
      try {
        this.addTracer(V, [x, y, z], [x + 1, y, z + 1], "#ffd59a", 1, 0); this.addTracer(V, [x, y, z], [x - 1, y, z + 1], "#ff3b4e", 0, 1);
        this.burst(V, [x, y, z], "#ffb347", 2, 1); this.burst(V, [x, y, z], "#ff3b4e", 2, 1, 1);
        this.puff(V, x, y, z, 0x8f8a80, 1, 1); this.dustTex(F);
        this.explode(V, x, z, 0, 0);
        if (F.propMats) this.chips(V, [x, y, z], 0);
        // kinds of material that only thrown and dropped things use
        const g = F.box1;
        [new T.MeshBasicMaterial({ color: 0xffffff }), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: T.DoubleSide }),
          new T.MeshStandardMaterial({ color: 0x808080 }), new T.MeshStandardMaterial({ color: 0x808080, transparent: true })].forEach(m => { const o = new T.Mesh(g, m); o.scale.setScalar(0.01); tmp.add(o); });
        [new T.SpriteMaterial({ map: GFX.glowTex(), transparent: true, depthWrite: false }), new T.SpriteMaterial({ map: GFX.glowTex(), transparent: true })].forEach(m => { const o = new T.Sprite(m); o.scale.setScalar(0.01); tmp.add(o); });
        // the guns other players carry are built when first seen: one of each kind of build
        { const pw = OW.find(w => !w.melee); if (pw) { const a = GUNS.lite(pw, T); a.scale.setScalar(0.01); tmp.add(a); if (!F.crowd) { const b = GUNS.build(pw, T, { arms: false }); b.scale.setScalar(0.01); tmp.add(b); } } }
        tmp.position.set(x, y, z); F.scene.add(tmp);
      } catch (e) { console.warn("[nx] effect samples", e); }
      if (F.nx) F.nx.adopt(F.scene);
      F.post.warm(F.scene, F.cam);
      // the samples have done their job: gone before the first real frame
      try {
        F.scene.remove(tmp); tmp.children.forEach(o => { if (o.isMesh || o.isSprite) o.material.dispose(); });
        for (const o of F.vfx) o.life = 0; this.vfxTick(F, 0);
        for (const o of F.tracers) { F.scene.remove(o.m); o.m.material.dispose(); } F.tracers = [];
        while (F.scorch.length > sc0) { const o = F.scorch.pop(); F.scene.remove(o); o.material.dispose(); }
        (F.sparkC || []).forEach(c => c.update(10, 9));
      } catch (e) { console.warn("[nx] effect samples", e); }
      F.boomL.intensity = 0; F.shake = sh; F.hurtT = hu; SFX.on = snd;
    },
    // ---- breakable props (client art + effects)
    buildProps(V, scene, mStd) {
      const F = V.fps, T = THREE;
      const crateT = GFX.tex(256, 256, (x, w, h) => {
        x.fillStyle = "#c99558"; x.fillRect(0, 0, w, h);
        for (let k = 0; k < 40; k++) { x.fillStyle = "rgba(90,55,20," + (Math.random() * 0.08) + ")"; x.fillRect(0, Math.random() * h, w, 1 + Math.random() * 3); }
        x.strokeStyle = "#8a5d2c"; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14);
        x.fillStyle = "#e9d7a6"; x.fillRect(0, h / 2 - 20, w, 40);
        x.fillStyle = "#ff6a1a"; x.font = "900 34px 'Chakra Petch', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NETEAM", w / 2, h / 2 + 2);
        x.fillStyle = "#3a2410"; x.font = "700 18px 'JetBrains Mono', monospace"; x.fillText("HARDWARE · HANDLE WITH CARE", w / 2, h * 0.78);
        x.beginPath(); x.moveTo(w / 2, 30); x.lineTo(w / 2 + 22, 62); x.lineTo(w / 2 - 22, 62); x.fill(); x.fillRect(w / 2 - 7, 60, 14, 22);
      });
      const bsodT = GFX.tex(256, 192, (x, w, h) => {
        x.fillStyle = "#1d5fd6"; x.fillRect(0, 0, w, h); x.fillStyle = "#fff"; x.textBaseline = "top";
        x.font = "700 64px Inter, sans-serif"; x.fillText(":(", 22, 14);
        x.font = "700 17px Inter, sans-serif"; x.fillText("Your PC ran into a problem.", 22, 96); x.fillText("Call Neteam IT: ext. 2001", 22, 122);
        x.font = "13px 'JetBrains Mono', monospace"; x.fillText("STOP: 0x0000NETEAM", 22, 156);
      });
      const battT = GFX.tex(256, 128, (x, w, h) => {
        x.fillStyle = "#d42a33"; x.fillRect(0, 0, w, h);
        for (let k = -2; k < 20; k++) { x.fillStyle = k % 2 ? "#ffd23f" : "#15161a"; x.beginPath(); x.moveTo(k * 16, 46); x.lineTo(k * 16 + 16, 46); x.lineTo(k * 16 + 4, 82); x.lineTo(k * 16 - 12, 82); x.fill(); }
        x.fillStyle = "#fff"; x.font = "900 22px 'Chakra Petch', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
        x.fillText("⚡ LI-ION UPS", w * 0.25, 22); x.fillText("⚡ LI-ION UPS", w * 0.75, 22); x.font = "700 14px 'JetBrains Mono', monospace"; x.fillText("DANGER · DO NOT SHOOT", w * 0.25, 104); x.fillText("DANGER · DO NOT SHOOT", w * 0.75, 104);
      });
      const crateM = mStd({ map: crateT, roughness: 0.85 });
      GFX.skin(crateM, "planks", 1, 1, { color: 0xe8c9a0, ns: 1.2, paint: GFX.tex(256, 256, (x, w, h) => {
        x.clearRect(0, 0, w, h); x.strokeStyle = "rgba(70,46,22,.82)"; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14);
        x.fillStyle = "rgba(226,208,164,.92)"; x.fillRect(14, h / 2 - 20, w - 28, 40);
        x.fillStyle = "#c9561a"; x.font = "900 34px 'Chakra Petch', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NETEAM", w / 2, h / 2 + 2);
        x.fillStyle = "rgba(40,26,12,.85)"; x.font = "700 13px 'JetBrains Mono', monospace"; x.fillText("HARDWARE · HANDLE WITH CARE", w / 2, h * 0.76);
      }) });
      const cartM = mStd({ color: 0x2c313a, metalness: 0.6, roughness: 0.45 }), beigeM = mStd({ color: 0xd9d0b8, roughness: 0.55 });
      const scrM = mStd({ map: bsodT, emissiveMap: bsodT, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.2 });
      const battM = mStd({ map: battT, roughness: 0.4, metalness: 0.25 }), capM = mStd({ color: 0x24262c, metalness: 0.7, roughness: 0.35 }), ledM = new T.MeshBasicMaterial({ color: new T.Color(0.4, 3, 1.2) });
      F.propMats = { crate: 0xc99558, cart: 0x2c313a, beige: 0xd9d0b8, red: 0xd42a33 };
      // cracks and dents drawn over a prop as it takes hits (two strengths); a speck of each sits under the floor so their shaders are ready
      const crackTex = (n, sd, rgb = "12,10,8", lw = 1.6) => GFX.tex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); let r = sd; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
        x.lineCap = "round"; for (let i = 0; i < n; i++) { let px = rnd() * w, py = rnd() * h, a = rnd() * 6.28; x.strokeStyle = "rgba(" + rgb + "," + (0.6 + rnd() * 0.4) + ")"; x.lineWidth = lw * (1 + rnd() * 2); x.beginPath(); x.moveTo(px, py);
          for (let j = 0; j < 7; j++) { a += (rnd() - 0.5) * 1.3; const L = 8 + rnd() * 26; px += Math.cos(a) * L; py += Math.sin(a) * L; x.lineTo(px, py); if (rnd() < 0.3) { x.stroke(); x.beginPath(); x.moveTo(px, py); a += (rnd() < 0.5 ? 1 : -1) * 0.9; } } x.stroke();
          x.fillStyle = "rgba(" + rgb + ",.3)"; x.beginPath(); x.arc(rnd() * w, rnd() * h, 4 + rnd() * 10, 0, 7); x.fill(); } });
      F.crackM = [crackTex(7, 7), crackTex(16, 31, "12,10,8", 2.2), crackTex(22, 53, "235,244,255", 1.3)].map(tx => new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      F.crackM.forEach((m, i) => { const w = new T.Mesh(F.box1, m); w.scale.setScalar(0.01); w.position.set(1 + i, -3, 1); scene.add(w); });
      F.shardG = new T.BufferGeometry(); F.shardG.setAttribute("position", new T.Float32BufferAttribute([-0.5, -0.4, 0, 0.55, -0.3, 0, -0.1, 0.6, 0], 3)); F.shardG.computeVertexNormals();
      F.shardM = new T.MeshStandardMaterial({ color: 0xe4f3fb, emissive: 0x3a4a55, roughness: 0.04, metalness: 0.5, transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false });
      { const w = new T.Mesh(F.shardG, F.shardM); w.scale.setScalar(0.01); w.position.set(4, -3, 1); scene.add(w); }
      { const w = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: 0xff3020, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); w.scale.setScalar(0.01); w.position.set(3, -3, 1); scene.add(w); }
      F.propM = OPS_PROPS.map(p => {
        const gp = new T.Group();
        if (p.t === 0) { const b = new T.Mesh(new T.BoxGeometry(0.94, 0.94, 0.94), crateM); b.position.y = 0.47; b.rotation.y = (p.x * 7.3 + p.z) % 0.3 - 0.15; gp.add(b); }
        if (p.t === 1) {
          const cart = new T.Mesh(new T.BoxGeometry(0.8, 0.62, 0.62), cartM); cart.position.y = 0.36; gp.add(cart);
          for (const sx of [-0.33, 0.33]) for (const sz of [-0.24, 0.24]) { const w = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.05, 10), capM); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.05, sz); gp.add(w); }
          const body = new T.Mesh(new T.BoxGeometry(0.66, 0.5, 0.42), beigeM); body.position.set(0, 0.92, -0.04); gp.add(body);
          const scr = new T.Mesh(new T.PlaneGeometry(0.56, 0.41), scrM); scr.position.set(0, 0.92, 0.175); gp.add(scr);
        }
        if (p.t === 2) {
          const c = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.92, 24), battM); c.position.y = 0.46; gp.add(c);
          const cap = new T.Mesh(new T.CylinderGeometry(0.3, 0.36, 0.1, 24), capM); cap.position.y = 0.97; gp.add(cap);
          for (const sx of [-0.12, 0.12]) { const tm = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.08, 8), sx < 0 ? mStd({ color: 0xd42a33 }) : capM); tm.position.set(sx, 1.06, 0); gp.add(tm); }
          const led = new T.Mesh(new T.SphereGeometry(0.03, 8, 6), ledM); led.position.set(0, 1.03, 0.2); gp.add(led);
        }
        gp.position.set(p.x, 0, p.z); gp.rotation.y = p.ry; scene.add(gp); return gp;
      });
    },
    // little bits off a prop when a bullet hits it
    chips(V, at, t) {
      const F = V.fps, T = THREE; if (!F || !F.vfx) return; const col = [F.propMats.crate, F.propMats.beige, F.propMats.red][t];
      for (let k = 0; k < 4; k++) { const m = new T.Mesh(F.box1, new T.MeshStandardMaterial({ color: col, roughness: 0.8 })); const s = 0.04 + Math.random() * 0.04; m.scale.set(s, s, s); m.position.set(at[0], at[1], at[2]); F.scene.add(m); F.vfx.push({ m, life: 0.8, max: 0.8, v: [(Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3], g: 12, r: s / 2, sp: [Math.random() * 9, Math.random() * 9, 0], shrink: s }); }
    },
    sfxAt(F, x, z) { const d = Math.hypot(x - F.me.x, z - F.me.z); return [d, this.panOf(F, x, z, d)]; },
    // a prop has taken hits: crack it and knock it about (st 1 = fine, 2 = damaged, 3 = about to go; 0 = back as new)
    propDamage(V, k, st, worse) {
      const F = V.fps, T = THREE, gp = F.propM[k], p = OPS_PROPS[k], u = gp.userData; if (!gp) return;
      if (!u.ov && st > 1) { // crack overlay that follows the prop's main body
        const body = gp.children[p.t === 1 ? 5 : 0], geo = p.t === 0 ? new T.BoxGeometry(0.955, 0.955, 0.955) : p.t === 1 ? new T.BoxGeometry(0.67, 0.51, 0.43) : new T.CylinderGeometry(0.366, 0.366, 0.93, 24, 1, true);
        u.ov = new T.Mesh(geo, F.crackM[0]); body.add(u.ov);
        if (p.t === 1) { u.ov2 = new T.Mesh(new T.PlaneGeometry(0.56, 0.41), F.crackM[2]); u.ov2.position.set(0, 0, 0.217); body.add(u.ov2); }
        if (p.t === 2) { u.led = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(4, 0.3, 0.2), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); u.led.scale.setScalar(0.32); u.led.position.set(0, 1.04, 0.22); gp.add(u.led); }
      }
      const sg = k % 2 ? 1 : -1, lvl = Math.max(0, st - 1);
      gp.rotation.x = 0.03 * lvl * sg; gp.rotation.z = 0.045 * lvl * -sg;
      if (p.t === 0) gp.scale.set(1 + 0.015 * lvl, 1 - 0.045 * lvl, 1 + 0.015 * lvl); else gp.scale.set(1, 1, 1);
      if (u.ov) { u.ov.visible = lvl > 0; u.ov.material = F.crackM[Math.max(0, lvl - 1)]; } if (u.ov2) u.ov2.visible = lvl > 0; if (u.led) u.led.visible = lvl >= 2;
      if (!worse || !lvl) return;
      const [d, pan] = this.sfxAt(F, p.x, p.z), at = [p.x, p.h * 0.7, p.z], vol = clamp(1 - d / 40, 0.1, 0.8);
      this.chips(V, at, p.t); this.puff(V, p.x, p.h * 0.5, p.z, p.t === 0 ? 0xc9b08a : 0x8a8f99, 2, 0.7);
      if (p.t === 1) { this.burst(V, [p.x, 0.95, p.z], "#9fd8ff", 6, 3, 1); this.burst(V, [p.x, 0.95, p.z], "#ffd59a", 5, 3, 1); SFX.samp("hit-glass", 0.45 * vol, pan, 1.3) || SFX.crash(1, 0.3 * vol, pan); }
      else if (p.t === 2) { SFX.hiss(0.5 * vol, pan); this.burst(V, [p.x, 1.05, p.z], "#ffb347", 6, 2.5, 1); }
      else SFX.samp("hit-wood", 0.55 * vol, pan, 0.75) || SFX.crash(0, 0.3 * vol, pan);
    },
    // badly damaged props keep showing it: a monitor sparks and smokes, a battery vents smoke and blinks red before it blows
    propHurtFx(V, k, dt, t, st) {
      const F = V.fps, p = OPS_PROPS[k], u = F.propM[k].userData; F.prT[k] = (F.prT[k] || 0) - dt;
      if (u.led) u.led.material.opacity = Math.floor(t * 6) % 2 ? 1 : 0.15;
      if (F.prT[k] > 0 || p.t === 0) return; const bad = st >= 3; F.prT[k] = (p.t === 2 ? 0.35 + Math.random() * 0.2 : 0.45 + Math.random() * 0.6) * (bad ? 1 : 2.5);
      const [d, pan] = this.sfxAt(F, p.x, p.z); if (d > 45) return;
      if (p.t === 1) { this.puff(V, p.x, 1.15, p.z, 0x5a5e66, 1, 0.45, 2.2, 0.9); if (bad && Math.random() < 0.6) { this.burst(V, [p.x, 0.95, p.z], "#ffd59a", 4, 2.2, 1); if (d < 16) SFX.clack(0.1 * (1 - d / 16), pan, 1.8); } }
      else { this.puff(V, p.x, 1.1, p.z, bad ? 0x2f3136 : 0x6a6d72, 1, 0.5, 2.4, 1.2); if (bad && d < 20 && Math.random() < 0.25) SFX.hiss(0.18 * (1 - d / 20), pan); }
    },
    // show or hide one glass pane in the baked glass meshes (its vertices collapse to a point), and shatter it
    paneSet(V, k, on, fx) {
      const F = V.fps, S = F.nx, q = OPS_PANES[k]; if (!S || !q) return;
      F.glassG = F.glassG || {};
      for (const [key, s0, cnt] of q.r) {
        let e = F.glassG[key];
        if (!e) { const mat = S.mats[key]; let mesh = null; S.group.traverse(o => { if (!mesh && o.isMesh && o.material === mat) mesh = o; }); if (!mesh) continue; const at = mesh.geometry.attributes.position; e = F.glassG[key] = { at, orig: at.array.slice() }; }
        const a = e.at.array, o = e.orig;
        for (let i = s0; i < s0 + cnt; i++) { const src = on ? i : s0; a[i * 3] = o[src * 3]; a[i * 3 + 1] = o[src * 3 + 1]; a[i * 3 + 2] = o[src * 3 + 2]; }
        e.at.needsUpdate = true;
      }
      F.paneRem = F.paneRem || {};
      if (on && F.paneRem[k]) { F.scene.remove(F.paneRem[k]); F.paneRem[k].geometry.dispose(); delete F.paneRem[k]; }
      if (!on && !F.paneRem[k] && F.shardM) F.scene.add(F.paneRem[k] = this.paneRemnant(F, q, k));
      if (!on && fx) this.shatter(V, q);
    },
    // the jagged teeth of glass left round the frame of a broken pane
    paneRemnant(F, q, k) {
      const T = THREE, P = [], rnd = NXW.rng(k * 977 + 13), at = (a, b) => [q.c[0] + q.u[0] * a + q.v[0] * b, q.c[1] + q.u[1] * a + q.v[1] * b, q.c[2] + q.u[2] * a + q.v[2] * b];
      // walk each edge; every tooth is a triangle from two points on the frame to one inside
      const edges = [[-q.hu, -q.hv, 1, 0, q.hu * 2, 1], [q.hu, -q.hv, 0, 1, q.hv * 2, -1], [q.hu, q.hv, -1, 0, q.hu * 2, 1], [-q.hu, q.hv, 0, -1, q.hv * 2, -1]];
      for (const [a0, b0, da, db, len] of edges) {
        const inA = db !== 0 ? -Math.sign(a0) : 0, inB = da !== 0 ? -Math.sign(b0) : 0;
        for (let s = 0; s < len - 0.02;) {
          const w = Math.min(len - s, 0.12 + rnd() * 0.4), deep = (rnd() < 0.2 ? 0.25 + rnd() * 0.45 : 0.04 + rnd() * 0.16) * Math.min(1, len / 1.2), m = s + w * (0.2 + rnd() * 0.6);
          P.push(...at(a0 + da * s, b0 + db * s), ...at(a0 + da * (s + w), b0 + db * (s + w)), ...at(a0 + da * m + inA * deep, b0 + db * m + inB * deep)); s += w;
        }
      }
      const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(P, 3)); g.computeVertexNormals();
      const m = new T.Mesh(g, F.shardM); m.renderOrder = 31; return m;
    },
    shatter(V, q) {
      const F = V.fps, T = THREE, low = GFX.lowEnd(), [d, pan] = this.sfxAt(F, q.c[0], q.c[2]);
      if (d < 70) { const vol = clamp(1.1 - d / 45, 0.08, 1); SFX.samp("hit-glass", vol, pan, 0.78 + Math.random() * 0.1, d / 80) || SFX.crash(1, vol, pan); SFX.samp("hit-glass", vol * 0.6, pan, 1.2 + Math.random() * 0.15, d / 80, 0.05);
        for (let i = 0; i < (low ? 3 : 6); i++) SFX.samp("tink1", vol * (0.25 + Math.random() * 0.3), pan, 1.3 + Math.random() * 0.9, d / 80, 0.35 + Math.random() * 0.7, 0.3); }
      if (d > 90 || !F.shardM) return;
      const n = Math.round(clamp(q.a * (low ? 2.5 : 5), low ? 6 : 10, low ? 14 : 34));
      for (let i = 0; i < n; i++) {
        const fu = (Math.random() * 2 - 1) * q.hu, fv = (Math.random() * 2 - 1) * q.hv, m = new T.Mesh(F.shardG, F.shardM), sc = 0.06 + Math.random() * 0.16;
        m.scale.set(sc * (0.6 + Math.random()), sc * (0.6 + Math.random()), 1); m.rotation.set(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3);
        m.position.set(q.c[0] + q.u[0] * fu + q.v[0] * fv, q.c[1] + q.u[1] * fu + q.v[1] * fv, q.c[2] + q.u[2] * fu + q.v[2] * fv); F.scene.add(m);
        const side = Math.random() < 0.5 ? -1 : 1, sp = 0.6 + Math.random() * 2.2;
        F.vfx.push({ m, keep: 1, life: 1.4 + Math.random() * 1.2, max: 2.6, v: [q.n[0] * side * sp + (Math.random() - 0.5), Math.random() * 1.5, q.n[2] * side * sp + (Math.random() - 0.5)], g: 14, r: 0.01, sp: [Math.random() * 14, Math.random() * 14, Math.random() * 14], shrinkV: [m.scale.x, m.scale.y, 1] });
      }
      this.burst(V, q.c, "#e8f6ff", low ? 6 : 12, 3, 1);
    },
    propBreak(V, k) {
      const F = V.fps, T = THREE, p = OPS_PROPS[k], low = GFX.lowEnd(), [d, pan] = this.sfxAt(F, p.x, p.z);
      const cols = p.t === 0 ? [F.propMats.crate, 0xe9d7a6, 0x8a5d2c] : p.t === 1 ? [F.propMats.beige, F.propMats.cart, 0x1d5fd6] : [F.propMats.red, 0x24262c, 0xffd23f];
      const n = low ? 7 : 14;
      for (let i = 0; i < n; i++) {
        const m = new T.Mesh(F.box1, new T.MeshStandardMaterial({ color: cols[i % 3], roughness: 0.7, metalness: p.t === 0 ? 0 : 0.3 }));
        const sx = 0.1 + Math.random() * 0.22, sy = p.t === 0 ? 0.03 + Math.random() * 0.05 : 0.06 + Math.random() * 0.1, sz = 0.08 + Math.random() * 0.16; m.scale.set(sx, sy, sz);
        m.position.set(p.x + (Math.random() - 0.5) * p.hx * 1.6, 0.2 + Math.random() * p.h, p.z + (Math.random() - 0.5) * p.hz * 1.6); m.castShadow = !!F.shadows; F.scene.add(m);
        const a = Math.random() * 6.28, sp = 1.5 + Math.random() * 3;
        F.vfx.push({ m, life: 3 + Math.random() * 2, max: 5, v: [Math.cos(a) * sp, 2 + Math.random() * 3.5, Math.sin(a) * sp], g: 14, r: sy / 2, sp: [Math.random() * 10, Math.random() * 10, Math.random() * 10], shrinkV: [sx, sy, sz] });
      }
      if (p.t === 1) { // shattered screen: glass glints and a spark pop
        for (let i = 0; i < (low ? 6 : 14); i++) { const m = new T.Mesh(F.box1, new T.MeshStandardMaterial({ color: 0xbfe3ff, emissive: 0x3a7bd5, emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85 })); const s = 0.03 + Math.random() * 0.07; m.scale.set(s, 0.006, s * 1.4); m.position.set(p.x, 0.9, p.z); F.scene.add(m); F.vfx.push({ m, life: 2.5, max: 2.5, v: [(Math.random() - 0.5) * 4, 1 + Math.random() * 3, (Math.random() - 0.5) * 4], g: 12, r: 0.004, sp: [Math.random() * 14, Math.random() * 14, 0], shrink: s }); }
        this.burst(V, [p.x, 0.95, p.z], "#9fd8ff", 14, 5); this.burst(V, [p.x, 0.95, p.z], "#ffd59a", 8, 4);
      }
      this.puff(V, p.x, 0.5, p.z, p.t === 0 ? 0xc9b08a : 0x8a8f99, low ? 3 : 6, 1.2);
      if (p.t !== 2) SFX.crash(p.t === 1 ? 1 : 0, clamp(SFX.fall(d, 9), 0.06, 1), pan);
    },
    // soft dust/smoke sprites (normal blending so they read as solid smoke, not glow)
    // light on a puff of smoke or dust at a spot (sprites are drawn without the full material, so they are tinted by hand)
    fxLit(F, x, z, col) {
      const c = col && col.isColor ? col.clone() : new THREE.Color(col);
      if (F.nx && F.nx.lightAt) { const L = F.nx.lightAt(x, z), k = 1 / Math.PI; c.r *= Math.min(1.6, L[0] * k + L[3] * 0.25); c.g *= Math.min(1.6, L[1] * k + L[3] * 0.24); c.b *= Math.min(1.6, L[2] * k + L[3] * 0.21); }
      return c;
    },
    puff(V, x, y, z, col, n, sc, life = 1.6, rise = 0.5) {
      const F = V.fps, T = THREE; col = this.fxLit(F, x, z, col);
      for (let i = 0; i < n; i++) {
        const m = new T.Sprite(new T.SpriteMaterial({ map: this.smokeTex(F), color: col, transparent: true, opacity: 0, depthWrite: false })); m.material.rotation = Math.random() * 6;
        m.position.set(x + (Math.random() - 0.5) * sc, y + Math.random() * sc * 0.5, z + (Math.random() - 0.5) * sc); F.scene.add(m);
        const a = Math.random() * 6.28, sp = 0.4 + Math.random() * 1.2 * sc;
        F.vfx.push({ m, sprite: 1, life: life * (0.7 + Math.random() * 0.6), max: life * 1.3, v: [Math.cos(a) * sp, rise + Math.random() * rise, Math.sin(a) * sp], drag: 1.6, s0: sc * 0.8, s1: sc * (2.4 + Math.random()), op: 0.9, fin: 0.1 });
      }
    },
    // thin dust: a few faint wisps with no solid middle
    dustTex(F) {
      return F.dustT || (F.dustT = GFX.tex(64, 64, (x, w, h) => {
        x.clearRect(0, 0, w, h);
        for (let k = 0; k < 9; k++) { const a = Math.random() * 6.28, rr = Math.random() * 13, cx = w / 2 + Math.cos(a) * rr, cy = h / 2 + Math.sin(a) * rr, r = 9 + Math.random() * 9; const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, "rgba(255,255,255,.2)"); g.addColorStop(0.5, "rgba(255,255,255,.09)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }
      }));
    },
    // lumpy cloud puff: overlapping soft blobs, dense in the middle
    smokeTex(F) {
      return F.smokeT || (F.smokeT = GFX.tex(128, 128, (x, w, h) => {
        x.clearRect(0, 0, w, h);
        for (let k = 0; k < 14; k++) { const a = Math.random() * 6.28, rr = Math.random() * 26, cx = w / 2 + Math.cos(a) * rr, cy = h / 2 + Math.sin(a) * rr, r = 22 + Math.random() * 20; const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(0.6, "rgba(255,255,255,.25)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }
      }));
    },
    explode(V, x, z, kind, y = 0) {
      const F = V.fps, T = THREE; if (!F || !F.vfx) return;
      const big = kind === 1, S0 = big ? 2.1 : kind === 4 ? 0.75 : 1, gy = oHAt(x, z), by0 = kind === 4 ? Math.max(gy, y - 0.6) : 0, low = GFX.lowEnd(), q = low ? 0.5 : 1, [d, pan] = this.sfxAt(F, x, z);
      SFX.blast(clamp(1.1 * SFX.fall(d, big ? 22 : 15), 0.06, 1), pan, big ? 1 : 0, clamp(d / 60, 0, 1));
      // close by, it leaves your ears ringing and the world muffled for a few seconds
      { const dk = clamp(1 - d / (big ? 12 : 7), 0, 1); if (dk > 0.15 && !SFX.legacy) { F.deaf = Math.max(F.deaf || 0, dk); SFX.ring(dk); } }
      F.shake = Math.max(F.shake || 0, clamp((big ? 1.5 : 1.1) * (1 - d / (big ? 45 : 26)), 0, 1.5));
      F.boomL.position.set(x, by0 + 1.8 * S0, z); F.boomL.intensity = (big ? 110 : 55); F.boomL.distance = 22 * S0; F.boomL.userData.k = F.boomL.intensity / 0.55;
      // white-hot core flash
      const core = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(6, 5.4, 4.2), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); core.position.set(x, by0 + 1 * S0, z); F.scene.add(core);
      F.vfx.push({ m: core, sprite: 1, life: 0.14, max: 0.14, s0: 1.5 * S0, s1: 4.5 * S0, op: 1 });
      // fireball: puffs that cool from yellow-white to deep orange and rise
      for (let i = 0; i < Math.round(16 * q * (big ? 1.6 : 1)); i++) {
        const m = new T.Sprite(new T.SpriteMaterial({ map: this.smokeTex(F), color: new T.Color(2.2, 1.4, 0.5), transparent: true, depthWrite: false })); m.material.rotation = Math.random() * 6;
        const a = Math.random() * 6.28, e = Math.random() * 1.2, sp = (2 + Math.random() * 4) * S0;
        m.position.set(x, by0 + 0.6 * S0, z); F.scene.add(m);
        F.vfx.push({ m, sprite: 1, life: 0.45 + Math.random() * 0.45, max: 0.9, v: [Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp * 0.8 + 1.5, Math.sin(a) * Math.cos(e) * sp], drag: 3.2, s0: 1.2 * S0, s1: (3.2 + Math.random() * 2) * S0, op: 1, c0: new T.Color(2.4, 1.5, 0.45), c1: new T.Color(0.75, 0.16, 0.03) });
      }
      // black-grey smoke column that lingers
      this.puff(V, x, by0 + 0.9 * S0, z, 0x2b2b30, Math.round(12 * q * (big ? 1.5 : 1)), 1.6 * S0, big ? 5 : 3.6, 0.9);
      this.puff(V, x, by0 + 0.2, z, 0x8f8a80, Math.round(6 * q), 1.8 * S0, 1.4, 0.15);
      // ground shockwave
      const ring = new T.Mesh(F.ringG, new T.MeshBasicMaterial({ color: new T.Color(2.4, 1.3, 0.5), transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, by0 + 0.06, z); F.scene.add(ring);
      F.vfx.push({ m: ring, life: 0.45, max: 0.45, s0: 0.4, s1: 8 * S0, op: 0.9 });
      // glowing shrapnel + sparks
      for (let i = 0; i < Math.round(12 * q * S0); i++) {
        const m = new T.Mesh(F.box1, new T.MeshStandardMaterial({ color: 0x2a2a2e, emissive: 0xff6a1a, emissiveIntensity: 2.5, roughness: 0.6 })); const s = 0.05 + Math.random() * 0.08; m.scale.set(s, s, s * 1.6);
        m.position.set(x, by0 + 0.6, z); F.scene.add(m); const a = Math.random() * 6.28, sp = (4 + Math.random() * 6) * S0;
        F.vfx.push({ m, life: 1.6 + Math.random(), max: 2.6, v: [Math.cos(a) * sp, 3 + Math.random() * 7, Math.sin(a) * sp], g: 16, r: s / 2, sp: [Math.random() * 12, Math.random() * 12, 0], shrink: s, cool: 1 });
      }
      this.burst(V, [x, by0 + 0.8, z], "#ffb347", Math.round(26 * q * S0), 10 * S0);
      // scorch mark stays until the next round
      const sc = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: F.scorchT || (F.scorchT = GFX.tex(128, 128, (cx, w, h) => { cx.clearRect(0, 0, w, h); for (let k = 0; k < 18; k++) { const r = 18 + Math.random() * 40, a = Math.random() * 6.28, rr = Math.random() * 20; const gg = cx.createRadialGradient(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr, 0, w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr, r); gg.addColorStop(0, "rgba(10,8,6,.5)"); gg.addColorStop(1, "rgba(10,8,6,0)"); cx.fillStyle = gg; cx.fillRect(0, 0, w, h); } })), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      sc.rotation.x = -Math.PI / 2; sc.rotation.z = Math.random() * 6; sc.scale.set(4.2 * S0, 4.2 * S0, 1); sc.position.set(x, gy + 0.015, z); sc.visible = y - gy < 0.9; F.scene.add(sc); F.scorch.push(sc);
      if (F.scorch.length > 12) { const o = F.scorch.shift(); F.scene.remove(o); o.material.dispose(); }
      // close to it: the screen kicks
      if (d < 7 * S0) F.hurtT = Math.max(F.hurtT || 0, 0.25);
    },
    // thrown grenades (smoothed toward the host's positions) and smoke clouds
    nadesDraw(V, g, dt, t) {
      const F = V.fps, T = THREE; F.nades = F.nades || {}; F.smk = F.smk || {};
      const seen = {};
      (g.gn || []).forEach(([id, k, x, y, z]) => {
        seen[id] = 1; let o = F.nades[id];
        if (!o) {
          const m = new T.Group();
          const body = new T.Mesh(k ? new T.CylinderGeometry(0.065, 0.065, 0.2, 12) : new T.SphereGeometry(0.085, 14, 10), new T.MeshStandardMaterial({ color: k ? 0x9aa0aa : 0x4f7a3a, roughness: 0.5, metalness: 0.4 }));
          const cap = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.05, 8), new T.MeshStandardMaterial({ color: 0x2b2e35, metalness: 0.8, roughness: 0.3 })); cap.position.y = k ? 0.12 : 0.09;
          const led = new T.Mesh(new T.SphereGeometry(0.018, 6, 4), new T.MeshBasicMaterial({ color: k ? new T.Color(0.6, 1.4, 3) : new T.Color(3, 0.4, 0.3) })); led.position.set(0, k ? 0.06 : 0.04, 0.07);
          m.add(body, cap, led); m.userData.led = led; m.position.set(x, y, z); F.scene.add(m); o = F.nades[id] = { m, k, spin: [Math.random() * 12, Math.random() * 12] };
          if (Math.hypot(x - F.me.x, z - F.me.z) > 2) { const [d, pan] = this.sfxAt(F, x, z); SFX.swish(clamp(0.6 - d / 40, 0, 0.6), pan); }
        }
        const p = o.m.position, f = Math.min(1, dt * 18); p.x += (x - p.x) * f; p.y += (y - p.y) * f; p.z += (z - p.z) * f;
        if (y > 0.09) { o.m.rotation.x += o.spin[0] * dt; o.m.rotation.z += o.spin[1] * dt; }
        o.m.userData.led.visible = Math.floor(t * 8) % 2 === 0;
      });
      for (const id in F.nades) if (!seen[id]) { F.scene.remove(F.nades[id].m); delete F.nades[id]; }
      const sseen = {};
      (g.sm || []).forEach(([id, x, z, tl]) => {
        sseen[id] = 1; let c = F.smk[id];
        if (!c) {
          c = F.smk[id] = { born: t, parts: [] }; const n = GFX.lowEnd() ? 14 : 24;
          for (let i = 0; i < n; i++) {
            const m = new T.Sprite(new T.SpriteMaterial({ map: this.smokeTex(F), color: this.fxLit(F, x, z, new T.Color(0.78, 0.8, 0.84).multiplyScalar(0.9 + Math.random() * 0.2)), transparent: true, opacity: 0, depthWrite: false }));
            const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 2.7; m.material.rotation = Math.random() * 6;
            m.position.set(x, 0.3, z); m.userData.to = [x + Math.cos(a) * r, 1.0 + Math.random() * 1.9, z + Math.sin(a) * r]; m.userData.sc = 2.6 + Math.random() * 1.6; m.userData.rs = (Math.random() - 0.5) * 0.3;
            F.scene.add(m); c.parts.push(m);
          }
        }
        const age = t - c.born, grow = 1 - Math.pow(1 - clamp(age / 1.4, 0, 1), 3), fade = clamp(tl / 10 / 2.5, 0, 1);
        c.parts.forEach(m => { const u = m.userData; m.position.x += (u.to[0] - m.position.x) * Math.min(1, dt * 3); m.position.y += (u.to[1] - m.position.y) * Math.min(1, dt * 2.4); m.position.z += (u.to[2] - m.position.z) * Math.min(1, dt * 3); const sc = u.sc * (0.3 + 0.7 * grow); m.scale.set(sc, sc, 1); m.material.rotation += u.rs * dt; m.material.opacity = 0.95 * Math.min(1, age * 2.5) * fade; });
      });
      for (const id in F.smk) if (!sseen[id]) { F.smk[id].parts.forEach(m => { F.scene.remove(m); m.material.dispose(); }); delete F.smk[id]; }
    },
    vfxTick(F, dt) {
      for (const o of F.vfx) {
        o.life -= dt; const k = clamp(1 - o.life / o.max, 0, 1), m = o.m;
        if (o.v) {
          if (o.drag) { const f = Math.max(0, 1 - o.drag * dt); o.v[0] *= f; o.v[2] *= f; if (!o.g) o.v[1] *= f; }
          if (o.g) o.v[1] -= o.g * dt;
          m.position.x += o.v[0] * dt; m.position.y += o.v[1] * dt; m.position.z += o.v[2] * dt;
          if (o.g && m.position.y < o.r) { m.position.y = o.r; o.v[1] *= -0.3; o.v[0] *= 0.55; o.v[2] *= 0.55; if (o.sp) o.sp = o.sp.map(v => v * 0.5); }
          if (o.g && oSolid(m.position.x, m.position.z)) { o.v[0] *= -0.4; o.v[2] *= -0.4; m.position.x += o.v[0] * dt * 2; m.position.z += o.v[2] * dt * 2; }
        }
        if (o.sp) { m.rotation.x += o.sp[0] * dt; m.rotation.y += o.sp[1] * dt; m.rotation.z += o.sp[2] * dt; }
        if (o.s1 != null) { const e = 1 - Math.pow(1 - k, 2.2), sc = o.s0 + (o.s1 - o.s0) * e; if (o.sprite) m.scale.set(sc, sc, 1); else m.scale.set(sc, sc, sc); }
        if (o.op != null) m.material.opacity = o.op * (o.fin ? Math.min(1, k / o.fin) : 1) * Math.pow(1 - k, 1.3);
        if (o.c0) m.material.color.lerpColors(o.c0, o.c1, Math.min(1, k * 1.4));
        if (o.cool) m.material.emissiveIntensity = Math.max(0, 2.5 * (1 - k * 1.6));
        if (o.life < 0.5) { const f = Math.max(0, o.life / 0.5); if (o.shrink) m.scale.setScalar(o.shrink * f); if (o.shrinkV) m.scale.set(o.shrinkV[0] * f, o.shrinkV[1] * f, o.shrinkV[2] * f); }
        if (o.life <= 0) { F.scene.remove(m); if (!o.keep) m.material.dispose(); }
      }
      F.vfx = F.vfx.filter(o => o.life > 0);
    },
    // a bullet lands on the world: a hole in the surface, a kick of dust
    impact(V, end, dir) {
      const F = V.fps, K = F && F.holes; if (!K || !F.ready) return;
      const top = OPS_M.ceilH || OPS_M.wallH || OWH, out = OPS_M.theme === "desert" || OPS_M.theme === "roof"; let n = null;
      if (end[1] < 0.08) n = [0, 1, 0];
      else if (oSolid(end[0] + dir[0] * 0.12, end[2] + dir[2] * 0.12)) { const fx = end[0] / CS, fz = end[2] / CS; n = Math.abs(fx - Math.round(fx)) < Math.abs(fz - Math.round(fz)) ? [dir[0] > 0 ? -1 : 1, 0, 0] : [0, 0, dir[2] > 0 ? -1 : 1]; }
      else if (!out && end[1] > top - 0.08) n = [0, -1, 0];
      if (!n) return;
      const u = n[1] ? [1, 0, 0] : n[0] ? [0, 0, 1] : [1, 0, 0], v = n[1] ? [0, 0, 1] : [0, 1, 0], a = Math.random() * 6.28, ca = Math.cos(a), sa = Math.sin(a), sz = 0.055 + Math.random() * 0.03;
      const U = [(u[0] * ca + v[0] * sa) * sz, (u[1] * ca + v[1] * sa) * sz, (u[2] * ca + v[2] * sa) * sz], W2 = [(v[0] * ca - u[0] * sa) * sz, (v[1] * ca - u[1] * sa) * sz, (v[2] * ca - u[2] * sa) * sz];
      const c = [end[0] + n[0] * 0.012, end[1] + n[1] * 0.012, end[2] + n[2] * 0.012], P = K.m.geometry.attributes.position, o = (K.n++ % K.N) * 6;
      const pt = (i, su, sv) => P.setXYZ(o + i, c[0] + U[0] * su + W2[0] * sv, c[1] + U[1] * su + W2[1] * sv, c[2] + U[2] * su + W2[2] * sv);
      pt(0, -1, -1); pt(1, 1, -1); pt(2, 1, 1); pt(3, -1, -1); pt(4, 1, 1); pt(5, -1, 1); P.needsUpdate = true;
      { const d = Math.hypot(end[0] - F.me.x, end[2] - F.me.z); if (d < 26) SFX.impact(!n[1] && SFX.floor === "metal" ? 1 : 0, 0.55 * SFX.fall(d, 5) * (1 - d / 26), this.panOf(F, end[0], end[2], d)); }
      if (!GFX.lowEnd() && F.vfx.length < 90) {
        const T = THREE, col = this.fxLit(F, c[0], c[2], OPS_M.theme === "desert" ? 0xc7a777 : 0x9c9c9a);
        for (let k = 0; k < 2; k++) {
          const m = new T.Sprite(new T.SpriteMaterial({ map: this.dustTex(F), color: col, transparent: true, opacity: 0, depthWrite: false })); m.material.rotation = Math.random() * 6;
          m.position.set(c[0] + n[0] * 0.05, c[1] + n[1] * 0.05, c[2] + n[2] * 0.05); F.scene.add(m);
          const sp = k ? 0.35 : 1.5, j = () => (Math.random() - 0.5) * (k ? 0.5 : 0.35);
          F.vfx.push({ m, sprite: 1, life: k ? 0.7 : 0.3, max: k ? 0.7 : 0.3, v: [n[0] * sp + j(), n[1] * sp + j() + (k ? 0.12 : 0), n[2] * sp + j()], drag: k ? 2.2 : 5, s0: k ? 0.1 : 0.05, s1: k ? 0.5 : 0.24, op: k ? 0.2 : 0.38, fin: 0.12 });
        }
      }
    },
    // sparks and blood flecks: two clouds of points (coarse and fine), one draw call each however many fly
    burst(V, at, hex, n, spd, fine = 0) {
      const F = V.fps; if (!F || !F.ready) return;
      const K = F.sparkC || (F.sparkC = [GFX.cloud(F.scene, 360, 0.055), GFX.cloud(F.scene, 260, 0.03)]), q = K[fine ? 1 : 0], c = (GFX._bc || (GFX._bc = new THREE.Color())).set(hex).multiplyScalar(5);
      for (let k = 0; k < n; k++) q.emit(at[0], at[1], at[2], (Math.random() - 0.5) * spd, Math.random() * spd * 0.8, (Math.random() - 0.5) * spd, (0.25 + Math.random() * 0.25) * (fine ? 0.55 : 1), c.r, c.g, c.b);
    },
    addTracer(V, from, to, hex, spark, beam) {
      const F = V.fps, T = THREE; if (!F || !F.ready) return;
      const a = new T.Vector3(...from), b = new T.Vector3(...to); const len = a.distanceTo(b); if (len < 0.1) return;
      const m = new T.Mesh(F.tracerGeo, new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(3), transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
      m.scale.z = len; m.position.copy(a).lerp(b, 0.5); m.lookAt(b); F.scene.add(m); F.tracers.push({ m, life: beam ? 0.35 : 0.07, max: beam ? 0.35 : 0.07 });
      if (beam) { m.scale.x = m.scale.y = 3.2; const core = new T.Mesh(F.tracerGeo, new T.MeshBasicMaterial({ color: new T.Color(4, 4, 4), transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false })); core.scale.set(1.1, 1.1, len); core.position.copy(m.position); core.quaternion.copy(m.quaternion); F.scene.add(core); F.tracers.push({ m: core, life: 0.2, max: 0.2 });
        const halo = new T.Mesh(F.tracerGeo, new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(0.9), transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false })); halo.scale.set(9, 9, len); halo.position.copy(m.position); halo.quaternion.copy(m.quaternion); F.scene.add(halo); F.tracers.push({ m: halo, life: 0.45, max: 0.45 }); }
      this.burst(V, to, spark ? "#ffd59a" : "#ff3b4e", spark ? 4 : 9, spark ? 3.5 : 2, spark ? 1 : 0);
    },
    // ---- jump arena (client art): decks, jump pads, pickups, the Golden Router, rockets, hook cables
    buildArena(V, scene, mStd) {
      const F = V.fps, T = THREE;
      if (!F.nx) scene.add(new T.HemisphereLight(0xc4ccff, 0x4a3a40, 1.5));
      (F.nx ? [] : [[0.25, 0.25, 0xff8a5c], [0.75, 0.25, 0x4cc9f0], [0.25, 0.75, 0x4cc9f0], [0.75, 0.75, 0xff8a5c], [0.5, 0.5, 0xffc83d]]).forEach(([fx, fz, c]) => { const l = new T.PointLight(c, 90, 26, 1.2); l.position.set(OG * CS * fx, 6, OG * CS * fz); scene.add(l); });
      const side = GFX.tex(128, 128, (x, w, h) => { x.fillStyle = "#4a505e"; x.fillRect(0, 0, w, h); x.fillStyle = "#5a6070"; x.fillRect(5, 5, w - 10, h - 10); x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 3; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(0, k * h / 4); x.lineTo(w, k * h / 4); x.stroke(); } x.fillStyle = "rgba(255,255,255,.05)"; for (let i = 0; i < 400; i++) x.fillRect(Math.random() * w, Math.random() * h, 2, 2); });
      const topT = GFX.tex(128, 128, (x, w, h) => { x.fillStyle = "#3b404c"; x.fillRect(0, 0, w, h); x.strokeStyle = "#2a2e38"; x.lineWidth = 4; for (let k = 0; k <= 8; k++) { x.beginPath(); x.moveTo(k * 16, 0); x.lineTo(k * 16, h); x.stroke(); } });
      (F.nx ? [] : [[1.2, 0x4cc9f0], [2.6, 0xff8a3d]]).forEach(([hh, col]) => {
        const cells = []; OPS_MAP.forEach((row, z) => [...row].forEach((ch, x) => { if (oCellH(x, z) === hh) cells.push([x, z]); }));
        if (!cells.length) return;
        const m4 = new T.Matrix4();
        // painted steel panels on the sides, tread plate on top
        const sideM = mStd({ map: side, roughness: 0.7, metalness: 0.25 }), topM = mStd({ map: topT, roughness: 0.55, metalness: 0.4 });
        GFX.skin(sideM, "metal", 2, 1, { color: 0x8d94a1, metal: 0.55, rough: 1.35, paint: GFX.tex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = "rgba(0,0,0,.4)"; x.fillRect(0, 0, w, 3); x.fillRect(0, h - 4, w, 4); x.fillRect(0, 0, 2, h); x.fillRect(w - 2, 0, 2, h); x.fillRect(w / 2 - 1, 0, 2, h); x.fillStyle = "rgba(0,0,0,.5)"; [[8, 8], [w - 8, 8], [8, h - 9], [w - 8, h - 9], [w / 2 - 7, 8], [w / 2 + 7, 8], [w / 2 - 7, h - 9], [w / 2 + 7, h - 9]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 2.2, 0, 7); x.fill(); }); }) });
        const body = new T.InstancedMesh(new T.BoxGeometry(CS, hh, CS), [sideM, sideM, topM, mStd({ color: 0x15171c }), sideM, sideM], cells.length);
        const capM = mStd({ color: col, emissive: col, emissiveIntensity: 0.55, roughness: 0.4 });
        // colour-coded deck tops become painted tread plate (blue = low deck, orange = high deck)
        GFX.skin(capM, "metal", 2, 2, { color: new T.Color(col).lerp(new T.Color(0x8a8f98), 0.35).getHex(), metal: 0.35, rough: 1.5, n: "plate", nk: 4, ns: 1.2 }).then((ok) => { if (ok) capM.emissiveIntensity = 0.14; });
        const cap = new T.InstancedMesh(new T.BoxGeometry(CS + 0.06, 0.09, CS + 0.06), capM, cells.length);
        const foot = new T.InstancedMesh(new T.BoxGeometry(CS + 0.04, 0.16, CS + 0.04), mStd({ color: 0x16181e, roughness: 0.8 }), cells.length);
        cells.forEach(([x, z], i) => { const cx = x * CS + CS / 2, cz = z * CS + CS / 2; m4.makeTranslation(cx, hh / 2, cz); body.setMatrixAt(i, m4); m4.makeTranslation(cx, hh - 0.03, cz); cap.setMatrixAt(i, m4); m4.makeTranslation(cx, 0.08, cz); foot.setMatrixAt(i, m4); });
        scene.add(body, cap, foot);
      });
      const glowM = (c, op) => new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(c).multiplyScalar(2), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false });
      // jump pads
      const arrowT = GFX.tex(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = "#fff"; x.lineWidth = 9; x.lineCap = "round"; x.beginPath(); x.moveTo(12, 44); x.lineTo(32, 22); x.lineTo(52, 44); x.stroke(); });
      F.pads = [];
      OPS_MAP.forEach((row, z) => [...row].forEach((ch, x) => {
        if (ch !== "^") return; const g = new T.Group(), cx = x * CS + CS / 2, cz = z * CS + CS / 2;
        const base = new T.Mesh(new T.CylinderGeometry(0.95, 1.05, 0.14, 24), mStd({ color: 0x1d2027, metalness: 0.7, roughness: 0.35 })); base.position.y = 0.07;
        const disc = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.02, 24), mStd({ color: 0x3ddc97, emissive: 0x3ddc97, emissiveIntensity: 1.6 })); disc.position.y = 0.15;
        const ring = new T.Mesh(new T.RingGeometry(0.78, 0.92, 32), new T.MeshBasicMaterial({ color: new T.Color(0.6, 3, 1.6), transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.16;
        const arrows = [0, 1, 2].map(() => { const a = new T.Sprite(new T.SpriteMaterial({ map: arrowT, color: new T.Color(0.6, 2.6, 1.4), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); a.scale.set(0.9, 0.9, 1); g.add(a); return a; });
        g.add(base, disc, ring); g.position.set(cx, 0, cz); scene.add(g);
        // a booster across open air: a trail of light shows the arc it throws you along
        const J = OPS_JUMP[z * OG + x]; let arc = null;
        if (J) { const fT = clamp(Math.hypot(J[0] - cx, J[1] - cz) / 15, 0.9, 2.6), dm = new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(0.5, 2.4, 1.3), transparent: true, blending: T.AdditiveBlending, depthWrite: false });
          arc = { x0: cx, z0: cz, x1: J[0], z1: J[1], T: fT, dots: Array.from({ length: 18 }, () => { const d = new T.Sprite(dm.clone()); d.scale.set(0.42, 0.42, 1); scene.add(d); return d; }) }; }
        F.pads.push({ ring, arrows, arc });
      }));
      // router home pedestal
      if (troph) opsRouterHomes().forEach(([hx, hz]) => {
        const ped = new T.Mesh(new T.CylinderGeometry(1.25, 1.45, 0.3, 6), mStd({ color: 0x23262e, metalness: 0.6, roughness: 0.35 })); ped.position.set(hx, 0.15, hz); scene.add(ped);
        GFX.skin(ped.material, "metal", 3, 1, { color: 0x4a4f5a, metal: 0.8, rough: 1.2 });
        const tr = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 0.04, 6), mStd({ color: 0xffc83d, emissive: 0xffb000, emissiveIntensity: 1.2 })); tr.position.set(hx, 0.31, hz); scene.add(tr); });
      // pickups
      F.picks = (gold ? OPS_M.picks || [] : []).map(([cx, cz, it]) => {
        const x = cx * CS + CS / 2, z = cz * CS + CS / 2, y = oCellH(cx, cz), col = it === "H" ? 0x3ddc97 : it === "A" ? 0x4cc9f0 : new T.Color(OW[it].col).getHex();
        const g = new T.Group(), baseM = mStd({ color: col, emissive: col, emissiveIntensity: 1.4, roughness: 0.4 });
        const base = new T.Mesh(new T.CylinderGeometry(0.62, 0.7, 0.08, 20), mStd({ color: 0x1b1d23, metalness: 0.6, roughness: 0.4 })); base.position.y = 0.04;
        const lit = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.02, 20), baseM); lit.position.y = 0.09;
        const item = new T.Group(); item.position.y = 0.95;
        if (it === "H") { const cm = mStd({ color: 0x3ddc97, emissive: 0x3ddc97, emissiveIntensity: 1.3 }); item.add(new T.Mesh(new T.BoxGeometry(0.5, 0.16, 0.16), cm), new T.Mesh(new T.BoxGeometry(0.16, 0.5, 0.16), cm)); }
        else if (it === "A") { const a1 = new T.Mesh(new T.BoxGeometry(0.42, 0.5, 0.12), mStd({ color: 0x1f3550, metalness: 0.5, roughness: 0.3 })), a2 = new T.Mesh(new T.BoxGeometry(0.3, 0.08, 0.13), mStd({ color: 0x4cc9f0, emissive: 0x4cc9f0, emissiveIntensity: 1.5 })); item.add(a1, a2); }
        else {
          const gm2 = GUNS.build(OW[it], T, { arms: false }); gm2.position.z = 0.15; gm2.scale.setScalar(1.25); item.add(gm2);
          item.rotation.z = 0.25;
        }
        const glow = new T.Sprite(glowM(col, 0.55)); glow.scale.set(1.7, 1.7, 1); glow.position.y = 0.95;
        g.add(base, lit, item, glow); g.position.set(x, y, z); scene.add(g);
        return { g, item, glow, baseM, x, z, on: null };
      });
      // the Golden Router
      if (troph) {
        const gold = mStd({ color: 0xffc247, metalness: 1, roughness: 0.2, emissive: 0x6a4600, emissiveIntensity: 0.35 }), t0 = new T.Group(); gold.envMapIntensity = 1.6;
        GFX.pbr("metal", 1, 1, { r: false }).then((s) => { if (s && s.normalMap) { gold.normalMap = s.normalMap; gold.normalScale.set(0.6, 0.6); gold.needsUpdate = true; } });
        const body = new T.Mesh(new T.BoxGeometry(0.7, 0.16, 0.46), gold); t0.add(body);
        [-0.24, 0, 0.24].forEach(ax => { const an = new T.Mesh(new T.CylinderGeometry(0.022, 0.03, 0.5, 8), gold); an.position.set(ax, 0.3, -0.18); an.rotation.x = -0.15; t0.add(an); });
        const leds = new T.Mesh(new T.BoxGeometry(0.5, 0.03, 0.02), new T.MeshBasicMaterial({ color: new T.Color(0.6, 3, 1.4) })); leds.position.set(0, 0.02, 0.235); t0.add(leds);
        const glow = new T.Sprite(glowM(0xffc83d, 0.8)); glow.scale.set(2.6, 2.6, 1); t0.add(glow);
        const L = new T.PointLight(0xffc040, 26, 10, 1.6);   // follows the router; never hidden (see the bomb light)
        scene.add(t0, L); F.trophy = t0; F.trophyL = L;
        const bc = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 40, 16, 1, true), new T.MeshBasicMaterial({ color: new T.Color(2.4, 1.8, 0.5), transparent: true, opacity: 0.18, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
        scene.add(bc); F.beacon = bc;
        if (cap) { const sm = new T.Mesh(new T.SphereGeometry(1.05, 24, 16), new T.MeshBasicMaterial({ color: new T.Color(0.9, 2.2, 3), transparent: true, opacity: 0.2, blending: T.AdditiveBlending, depthWrite: false })); sm.visible = false; scene.add(sm); F.trShield = sm; }
      }
      F.rkM = {}; F.cables = {};
    },
    arenaDraw(V, g, dt, t) {
      const F = V.fps, T = THREE;
      (F.pads || []).forEach((pd, k) => { pd.ring.material.opacity = 0.6 + 0.4 * Math.sin(t * 4 + k); pd.arrows.forEach((a, j) => { const u = (t * 0.9 + j / 3 + k * 0.17) % 1; a.position.y = 0.3 + u * 2.4; a.material.opacity = Math.sin(u * Math.PI) * 0.9; });
        if (pd.arc) { const A = pd.arc, n = A.dots.length; A.dots.forEach((d, j) => { const u = (j + (t * 0.55) % 1) / n, tt = u * A.T; d.position.set(A.x0 + (A.x1 - A.x0) * u, 0.5 + 8.5 * A.T * tt - 8.5 * tt * tt, A.z0 + (A.z1 - A.z0) * u); const cp = F.cam.position, dc = Math.hypot(d.position.x - cp.x, d.position.y - cp.y, d.position.z - cp.z); d.material.opacity = 0.75 * Math.sin(Math.min(1, u) * Math.PI) ** 0.5 * clamp((dc - 1.5) / 5, 0, 1); }); } });
      if (F.picks && typeof g.wp === "string") F.picks.forEach((pk, k) => {
        const on = g.wp.charCodeAt(k) === 49;
        if (pk.on === true && !on && Math.hypot(pk.x - F.me.x, pk.z - F.me.z) < 2.5) SFX.play("blip");
        pk.on = on; pk.item.visible = pk.glow.visible = on; pk.item.rotation.y += dt * 1.6; pk.item.position.y = 0.95 + Math.sin(t * 2.2 + k) * 0.08; pk.baseM.emissiveIntensity = on ? 1.4 : 0.12;
      });
      if (F.trophy && Array.isArray(g.tr)) {
        const [x, y, z, by] = g.tr; let px = x, py = y + 0.8 + Math.sin(t * 2) * 0.1, pz = z;
        if (by >= 0) { if (by === V.meIdx) { px = F.me.x; pz = F.me.z; py = (F.jh || 0) + 2.6; } else if (F.remote[by]) { const rm = F.remote[by]; px = rm.x; pz = rm.z; py = (rm.jh || 0) + 2.9; } }
        F.trophy.visible = F.beacon.visible = by !== V.meIdx; F.trophy.position.set(px, py, pz); F.trophy.rotation.y += dt * 1.4;
        if (F.trophyL) { F.trophyL.position.set(px, py, pz); F.trophyL.intensity = F.trophy.visible ? 26 : 0; }
        F.beacon.position.set(px, py + 20, pz); F.beacon.material.opacity = (by >= 0 ? 0.26 : 0.16) + Math.sin(t * 5) * 0.04; F.trW = [px, py, pz]; F.trBy = by;
        if (F.trShield) { const sh = by >= 0 && g.pl && g.pl[by] && g.pl[by][24] ? 1 : 0;
          if (F.shWas && !sh && by >= 0) { const sx = by === V.meIdx ? F.me.x : px, sz = by === V.meIdx ? F.me.z : pz; SFX.shield(0.7 * SFX.fall(Math.hypot(sx - F.me.x, sz - F.me.z), 8)); }
          F.shWas = sh; F.trShield.visible = !!sh && by !== V.meIdx; F.trShield.position.set(px, py - 1.9, pz); F.trShield.material.opacity = 0.16 + Math.sin(t * 6) * 0.05; }
      }
      const seen = {};
      (g.rk || []).forEach(([id, x, y, z]) => {
        seen[id] = 1; let o = F.rkM[id];
        if (!o) {
          const m = new T.Group(), body = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.46, 10), new T.MeshStandardMaterial({ color: 0x2a2d36, metalness: 0.7, roughness: 0.3 })); body.rotation.x = Math.PI / 2;
          const tip = new T.Mesh(new T.ConeGeometry(0.07, 0.16, 10), new T.MeshStandardMaterial({ color: 0xff6a1a, emissive: 0xff6a1a, emissiveIntensity: 1.2 })); tip.rotation.x = -Math.PI / 2; tip.position.z = -0.31;
          const fl = new T.Sprite(new T.SpriteMaterial({ map: GFX.glowTex(), color: new T.Color(3, 1.6, 0.5), transparent: true, blending: T.AdditiveBlending, depthWrite: false })); fl.scale.set(0.9, 0.9, 1); fl.position.z = 0.32;
          m.add(body, tip, fl); m.position.set(x, y, z); F.scene.add(m); o = F.rkM[id] = { m, px: x, py: y, pz: z, n: 0 };
          const [d, pan] = this.sfxAt(F, x, z); if (d > 2) SFX.swish(clamp(0.8 - d / 50, 0.05, 0.8), pan);
        }
        const dx = x - o.px, dy = y - o.py, dz = z - o.pz; if (Math.hypot(dx, dy, dz) > 0.01) o.m.lookAt(o.m.position.x - dx, o.m.position.y - dy, o.m.position.z - dz);
        o.px = x; o.py = y; o.pz = z; const p = o.m.position, f = Math.min(1, dt * 22); p.x += (x - p.x) * f; p.y += (y - p.y) * f; p.z += (z - p.z) * f;
        if ((o.n++ & 1) === 0) this.puff(V, p.x, p.y, p.z, 0xa8a8ae, 1, 0.55, 0.9, 0.15);
      });
      for (const id in F.rkM) if (!seen[id]) { F.scene.remove(F.rkM[id].m); delete F.rkM[id]; }
      V.ro.forEach((r, i) => {
        const hk = i === V.meIdx ? F.hk : r.b ? null : (V.inputOf(i) || {}).hk, rm = F.remote[i];
        const from = i === V.meIdx ? [F.me.x - Math.sin(F.me.a) * 0.4 + Math.cos(F.me.a) * 0.22, (F.eyeH || EYE) - 0.28, F.me.z - Math.cos(F.me.a) * 0.4 - Math.sin(F.me.a) * 0.22] : rm ? [rm.x, (rm.jh || 0) + 1.2, rm.z] : null;
        let c = F.cables[i]; if (!Array.isArray(hk) || !from) { if (c) c.visible = false; return; }
        if (!c) { c = F.cables[i] = new T.Mesh(F.tracerGeo, new T.MeshBasicMaterial({ color: new T.Color(r.hex).multiplyScalar(2.5), transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); c.scale.x = c.scale.y = 1.6; F.scene.add(c); }
        const a = new T.Vector3(...from), b = new T.Vector3(...hk); c.visible = true; c.scale.z = a.distanceTo(b); c.position.copy(a).lerp(b, 0.5); c.lookAt(b);
      });
    },
    draw(ctx, V, dt, t) {
      const F = V.fps; ctx.clearRect(0, 0, W, H); if (!F) return;
      if (F.failed) { ctx.fillStyle = "#0a0b0d"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#f5f1e6"; ctx.font = "700 20px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillText("3D isn't available in this browser.", W / 2, H / 2); return; }
      if (!F.ready) {
        ctx.fillStyle = "#05070f"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#ff8a3d"; ctx.font = "700 22px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.fillText("LOADING " + String(OPS_M.n || "").toUpperCase() + "…", W / 2, H / 2 - 8);
        // the new renderer counts what it has fetched, so the bar is real progress
        if (NX.prog.n) { const k = clamp(NX.prog.done / NX.prog.n, 0, 1), bw = 280; ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(W / 2 - bw / 2, H / 2 + 14, bw, 4); ctx.fillStyle = "#ff8a3d"; ctx.fillRect(W / 2 - bw / 2, H / 2 + 14, bw * k, 4); ctx.fillStyle = "rgba(245,241,230,.55)"; ctx.font = "500 12px Inter, sans-serif"; ctx.fillText(k < 1 ? "Textures and lighting" : "Preparing the scene", W / 2, H / 2 + 40); }
        return;
      }
      this.render3d(V, dt, t);
      this.hud(ctx, V, dt, t);
    },
    render3d(V, dt, t) {
      const F = V.fps, T = THREE, g = V.g || {};
      SFX.sync();
      GFX.fitStage(F, F.cam);
      F.fovK = Math.max(0, (F.fovK || 0) - dt * 22);
      const fov = F.scoped ? 22 : 74 - 16 * (F.ads || 0) + F.fovK; if (Math.abs(F.cam.fov - fov) > 0.1) { F.cam.fov = lerp(F.cam.fov, fov, 0.5); F.cam.updateProjectionMatrix(); }
      // players
      { const K = F.cull || (F.cull = { fr: new T.Frustum(), m: new T.Matrix4(), s: new T.Sphere(new T.Vector3(), 2.4), d: new T.Vector3() });
        F.cam.updateMatrixWorld(); K.m.multiplyMatrices(F.cam.projectionMatrix, F.cam.matrixWorldInverse); K.fr.setFromProjectionMatrix(K.m); F.cam.getWorldDirection(K.d); K.x = F.cam.position.x + K.d.x * 12; K.z = F.cam.position.z + K.d.z * 12; }
      const mypl0 = V.meIdx >= 0 && g.pl ? g.pl[V.meIdx] : null;
      V.ro.forEach((r, i) => {
        const av = F.avatars[i]; const pl = g.pl && g.pl[i];
        let x, z, a, ref = null;
        if (r.b) { const b = g.bt && g.bt[i]; if (!b) return; [x, z, a] = b; a += Math.PI; ref = g; }   // bots send their move heading, people their camera yaw: half a turn apart
        else { const inp = V.inputOf(i); if (inp && Number.isFinite(inp.x) && pl && inp.q === pl[7]) { x = inp.x; z = inp.z; a = (inp.a || 0) + Math.PI; ref = inp; } else if (pl) { x = av.init ? av.x : pl[8]; z = av.init ? av.z : pl[9]; a = av.a || 0; } else return; }
        const ox = av.x, oz = av.z;
        if (i === V.meIdx || !ref) { if (!av.init || Math.hypot(av.x - x, av.z - z) > 5 || i === V.meIdx) { av.x = x; av.z = z; av.init = true; } else { const k = 1 - Math.pow(0.0005, dt); av.x = lerp(av.x, x, k); av.z = lerp(av.z, z, k); } av.nsT = null; }
        else netSmooth(av, ref, x, z, null, null, dt, 5, 0.09);
        av.a = a;
        // the body turns smoothly toward the latest heading instead of snapping at the network rate
        { const w = (v) => v - Math.PI * 2 * Math.round(v / (Math.PI * 2)); if (av.ya === undefined || i === V.meIdx) av.ya = a; const d = w(a - av.ya) * (1 - Math.pow(0.00004, dt)); av.ya = w(av.ya + d); av.dYaw = d;
          const tp = r.b ? 0 : clamp(+((V.inputOf(i) || {}).p) || 0, -1.25, 1.25); av.pt = lerp(av.pt || 0, tp, 1 - Math.pow(0.002, dt)); }
        // enemy footsteps: only running players make noise
        if (i !== V.meIdx && pl && pl[1] && dt > 0) {
          const v = Math.hypot(av.x - ox, av.z - oz) / dt; av.spd = lerp(av.spd || 0, v, 0.2); av.mvx = lerp(av.mvx || 0, (av.x - ox) / dt, 0.2); av.mvz = lerp(av.mvz || 0, (av.z - oz) / dt, 0.2);
          if (av.spd > 3.6) { av.stepT = (av.stepT || 0) + v * dt; if (av.stepT > 2.45) { av.stepT = 0; const d = Math.hypot(av.x - F.me.x, av.z - F.me.z); if (d < 26) SFX.step(0.4 * SFX.fall(d, 4) * (1 - d / 26), this.panOf(F, av.x, av.z, d), i & 1); } }
        }
        const rin = r.b ? null : V.inputOf(i);
        const tjh = r.b ? +((g.bt[i] || [])[3] || 0) : rin ? +rin.jh || 0 : 0;   // in the air (or, on Uplink, falling below the roof)
        av.cr = lerp(av.cr || 0, rin && rin.cr ? 1 : 0, 1 - Math.pow(0.0005, dt)); av.jh = tjh > 0 || tjh < 0 ? lerp(av.jh || 0, tjh, 0.5) : Math.max(0, (av.jh || 0) - dt * 6);
        F.remote[i] = { x: av.x, z: av.z, a, cr: av.cr, jh: av.jh };
        av.grp.position.set(av.x, av.jh || 0, av.z); av.grp.rotation.y = av.ya + Math.PI; av.bd.scale.y = av.rb && av.rb.hum ? 1 : 1 - 0.3 * (av.cr || 0); av.grp.visible = !(pl && pl[16]);
        const alive = !!(pl && pl[1]);
        // the gun they actually carry
        const cw = pl ? pl[6] : 0; if (av.gunW !== cw && OW[cw]) { av.gunW = cw; while (av.gun.children.length) av.gun.remove(av.gun.children[0]); if (!OW[cw].melee) { const gm2 = F.crowd ? GUNS.lite(OW[cw], T) : GUNS.build(OW[cw], T, { arms: false }); gm2.traverse(o => { if (o.isMesh) o.castShadow = !!F.shadows; }); av.gun.add(gm2); } }
        if (0) { av.rbW = cw; const nm = { pistol: "Pistol", deagle: "Revolver", smg: "SMG", rifle: "AK", carbine: "AK", lmg: "AK", sniper: "Sniper", scout: "Sniper_2", shotgun: "Shotgun", knife: "Knife_1", rocket: "RocketLauncher", laser: "ShortCannon" }[(OW[cw] || OW[0]).id]; for (const n in av.rb.wp) av.rb.wp[n].visible = n === nm; }
        // death: tip over and fade out instead of vanishing
        if (alive) { av.deadT = 0; av.spr.material.opacity = 1; av.spr.material.rotation = 0; }
        else if (av.wasAlive) av.deadT = 0.001;
        if (!alive && av.deadT > 0 && av.rb && av.rb.act.Death) { av.deadT += dt; av.spr.material.opacity = Math.max(0, 1 - (av.deadT - 1.2) * 1.5); av.bd.visible = av.deadT < 2.4; }
        else if (!alive && av.deadT > 0 && av.rb && av.rb.hum) { av.deadT += dt; if (!av.dieDir) { av.dieDir = Math.random() < 0.65 ? -1 : 1; av.dieRoll = (Math.random() - 0.5) * 0.5; } const k = clamp((av.deadT - 0.16) * 3, 0, 1), e = k * k * (3 - 2 * k); av.bd.rotation.x = av.dieDir * e * 1.45; av.bd.rotation.z = av.dieRoll * e; av.bd.position.y = e * 0.16; av.spr.material.opacity = Math.max(0, 1 - (av.deadT - 0.9) * 1.5); av.bd.visible = av.deadT < 1.7; }
        else if (!alive && av.deadT > 0) { av.deadT += dt; const k = Math.min(1, av.deadT * 3.5); av.bd.rotation.x = -k * 1.45; av.bd.position.y = k * 0.18; av.spr.material.opacity = Math.max(0, 1 - (av.deadT - 0.6) * 1.5); av.bd.visible = av.deadT < 1.4; }
        else { av.bd.rotation.x = 0; av.bd.rotation.z = av.lean || 0; av.bd.position.y = 0; av.bd.visible = true; av.dieDir = 0; }
        // walk cycle from actual movement speed
        const spd = i === V.meIdx ? 0 : (av.spd || 0), sw = Math.min(1, spd / 4.5);
        av.ph += dt * (4 + spd * 1.6); av.legs[0].rotation.x = Math.sin(av.ph) * 0.65 * sw; av.legs[1].rotation.x = -Math.sin(av.ph) * 0.65 * sw;
        if (F.ppl && team) F.dress(av, i);
        if (av.rb) {
          // pick the animation from how fast they're actually moving
          const R = av.rb, want = !alive ? "Death" : R.act.Air && (av.jh || 0) > 0.25 && !oHAt(av.x, av.z) ? "Air" : R.act.Duck && (av.cr || 0) > 0.5 && spd < 0.5 ? "Duck" : spd > 3.6 ? "Running" : spd > 0.5 || av.stepT > 0 ? "Walking" : "Idle";
          // skinned soldiers are never culled automatically: keep them off the screen pass when out of view, and out of the shadow pass when outside the sun-shadow area
          if (R.ms) { const K = F.cull; K.s.center.set(av.x, 1 + (av.jh || 0), av.z); const on = K.fr.intersectsSphere(K.s), near = !!F.shadows && Math.abs(av.x - K.x) < 27 && Math.abs(av.z - K.z) < 27;
            if (on !== R.on || near !== R.near) { R.on = on; R.near = near; for (const o of R.ms) { if (on) o.layers.enable(0); else o.layers.disable(0); if (near) o.layers.enable(2); else o.layers.disable(2); } } }
          if (R.hum && R.cur !== want && (want === "Idle" || want === "Death")) { const pv = R.act[R.cur]; if (pv) pv.fadeOut(0.22); R.cur = want; }   // no idle clip: ease back to the standing rest pose
          else if (R.cur !== want && R.act[want]) { const nx = R.act[want].reset().play(), pv = R.act[R.cur]; if (pv) pv.crossFadeTo(nx, want === "Death" ? 0.12 : 0.25, false); else if (R.hum) nx.fadeIn(0.2); R.cur = want; }
          // legs follow the real travel direction: hips turn into a strafe, and moving backwards plays the stride in reverse
          let back = 1, ly = 0;
          if (R.hum && alive && spd > 0.6) { const gr = av.grp.rotation.y, cg = Math.cos(gr), sg = Math.sin(gr), lx = (av.mvx || 0) * cg - (av.mvz || 0) * sg, lz = (av.mvx || 0) * sg + (av.mvz || 0) * cg; let th = Math.atan2(lx, -lz); if (Math.abs(th) > 1.9) { back = -1; th -= Math.sign(th) * Math.PI; } ly = -clamp(th, -1.2, 1.2); av.plant = 0; av.stepT = 0; }
          else if (R.hum && alive) {   // standing: the feet stay planted while the body turns, then step round to catch up
            av.plant = clamp((av.plant || 0) - (av.dYaw || 0), -1.7, 1.7);
            if (Math.abs(av.plant) > 0.7 && !(av.stepT > 0)) av.stepT = 0.45;
            if (av.stepT > 0) { av.stepT -= dt; av.plant *= Math.pow(0.0006, dt); }
            ly = av.plant;
          }
          if (R.hum) { av.legY = spd <= 0.6 && !(av.stepT > 0) && alive ? ly : lerp(av.legY || 0, ly, 1 - Math.pow(0.001, dt)); av.back = back; R.m.rotation.y = Math.PI + av.legY; }
          if (want === "Running") R.act.Running.timeScale = back * clamp(spd / (R.hum ? 5.4 : 6.2), 0.7, 1.3);
          if (want === "Walking") R.act.Walking.timeScale = R.hum ? (spd <= 0.5 ? 1.25 : back * clamp(spd / 1.7, 0.6, 1.9)) : clamp(spd / 2.2, 0.6, 1.4);
          // nobody can see this one: let the animation rest (it catches up when they come back into view)
          const idle = !!R.ms && R.on === false && R.near === false;
          if (idle) R.lag = Math.min(0.5, (R.lag || 0) + dt); else { if (R.rest) for (const [bn, q0] of R.rest) bn.quaternion.copy(q0); R.mixer.update(dt + (R.lag || 0)); R.lag = 0; }
          if (!idle && R.hum && R.spine && Math.abs(av.legY) > 0.01) opsTwist(R.spine, -av.legY);
          if (!idle && R.hum && R.B) opsPose(av, R, alive, spd, dt, t, i);
          if (!idle && R.ppl && R.B) R.B.hd.scale.setScalar(R.hs);   // absolute: when no clip is playing nothing resets it, so multiplying would grow the head every frame
          // weapon rides the right hand but always points where the player faces
          if (!idle && R.hum && R.hand && alive) {
            // arms hold the weapon whatever the legs are doing: swing each upper arm and forearm onto a pose for the weapon class
            const wk = (OW[cw] || OW[0]), kind = wk.melee ? 0 : wk.slot === 2 ? 1 : 2, A = OPS_ARM[kind];
            for (let sd = 0; sd < 2; sd++) { const B = R.arms[sd]; if (!B[0] || !B[1] || !B[2]) continue; opsAim(B[0], B[1], opsTilt(A[sd][0], av.aimP || 0, 0), av.bd); opsAim(B[1], B[2], opsTilt(A[sd][1], av.aimP || 0, 1), av.bd); }
            const _hv = GFX._hv || (GFX._hv = new THREE.Vector3()); R.hand.getWorldPosition(_hv); av.bd.worldToLocal(_hv); av.gun.position.set(_hv.x - 0.02, _hv.y + (kind === 1 ? 0.05 : 0.03), _hv.z - 0.04 + 0.06 * (av.kick || 0)); av.gun.rotation.x = av.aimP || 0;
            av.fl.position.set(av.gun.position.x, av.gun.position.y + 0.02 + Math.sin(av.aimP || 0) * 0.42, av.gun.position.z - Math.cos(av.aimP || 0) * 0.42);
          }
          R.main.forEach(mt => { if (R.ppl) mt.emissive.copy(av.suit.emissive).multiplyScalar(0.25); else if (R.hum) { mt.color.setRGB(1, 1, 1).lerp(av.suit.color, team ? 0.5 : 0.28); mt.emissive.copy(av.suit.emissive).multiplyScalar(0.25); } else { mt.color.copy(av.suit.color); mt.emissive.copy(av.suit.emissive); } });
        } else av.bd.position.y += alive ? Math.abs(Math.sin(av.ph)) * 0.04 * sw : 0;
        av.wasAlive = alive;
        av.grp.visible = i !== V.meIdx && (alive || (av.deadT > 0 && av.deadT < (av.rb && av.rb.act.Death ? 2.4 : 1.4)));
        av.ring.visible = alive; av.gun.visible = alive;
        av.spr.position.y = alive ? (av.rb && av.rb.hum ? 2.2 : 1.95) - 0.55 * (av.cr || 0) + Math.sin(t * 3 + i) * 0.015 + av.bd.position.y : Math.max(0.35, 1.95 - av.deadT * 4);
        if (pl && pl[0] < av.lastHp && alive) { av.hurtT = 0.18; av.flinch = 1; av.flS = Math.random() < 0.5 ? -1 : 1; } av.lastHp = pl ? pl[0] : 100;
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
            const wcol = (OW[shot[4]] || OW[0]).col; av.flT = 0.05; av.kick = (OW[shot[4]] || OW[0]).pel || (OW[shot[4]] || OW[0]).scope ? 1 : 0.6;
            const ga = a + Math.PI, sx = av.x - Math.sin(ga) * 0.62 + Math.cos(ga) * 0.36, sz = av.z - Math.cos(ga) * 0.62 - Math.sin(ga) * 0.36;
            const W1 = OW[shot[4]] || OW[0];
            if (!W1.melee && !W1.rocket) { this.addTracer(V, [sx, 0.97 + (av.jh || 0), sz], [shot[1], shot[2], shot[3]], W1.laser ? r.hex : wcol, true, W1.laser);
              if (!W1.laser) { const dx = shot[1] - sx, dy = shot[2] - 0.97, dz = shot[3] - sz, dl = Math.hypot(dx, dy, dz) || 1; this.impact(V, [shot[1], shot[2], shot[3]], [dx / dl, dy / dl, dz / dl]);
                // a round that passes close to your head cracks past
                const mp = V.g.pl && V.g.pl[V.meIdx]; if (mp && mp[1]) { const ex = F.me.x - sx, ey = (F.eyeH || EYE) - 0.97, ez = F.me.z - sz, u = (ex * dx + ey * dy + ez * dz) / (dl * dl); if (u > 0.08 && u < 0.97) { const px = ex - dx * u, py = ey - dy * u, pz = ez - dz * u; if (px * px + py * py + pz * pz < 1.7) SFX.whiz(this.panOf(F, sx + dx * u, sz + dz * u, 1)); } } } }
            else if (W1.melee) av.flT = 0;
            const d = Math.hypot(av.x - F.me.x, av.z - F.me.z);
            const pan = this.panOf(F, av.x, av.z, d);
            if (Math.hypot(shot[1] - F.me.x, shot[3] - F.me.z) < 2.5 || W1.melee && d < 3.5) F.lastAttacker = { x: av.x, z: av.z, t: performance.now() };
            if (W1.melee) { if (d < 8) SFX.swish(0.5 * (1 - d / 8), pan); }
            else if (d < 90) SFX.shot(W1.snd, 0.95 * SFX.fall(d, 8), pan, Math.min(1, d / 50));
          }
        }
      });
      // camera
      const me = V.meIdx, mypl = me >= 0 && g.pl ? g.pl[me] : null;
      const dead = mypl && !mypl[1];
      let cx = F.me.x, cz = F.me.z, ca = F.me.a + (F.recA || 0), cp = F.me.p + (F.rec || 0), eye = F.eyeH || EYE;
      // spectators watch through any living player. In Breach, once you're out you see where you fell for a moment,
      // then watch your living teammates (never the other side) until the next round; no walking around
      const now = performance.now(); F.deadAt = dead ? F.deadAt || now : 0;
      const tmCands = me >= 0 && dead && team && now - F.deadAt > 2500 ? V.ro.map((r, i) => i).filter(i => i !== me && g.pl && g.pl[i] && g.pl[i][1] && g.pl[i][2] === mypl[2] && F.remote[i]) : [];
      F.watchTm = tmCands.length > 0;
      if (me < 0 || F.watchTm) {
        const cands = me < 0 ? V.ro.map((r, i) => i).filter(i => g.pl && g.pl[i] && g.pl[i][1] && F.remote[i]) : tmCands;
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
      } else if (dead) {
        // out (or no teammate left to watch): you stay where you fell, and the mouse swings a camera round
        // that spot, pulled in where a wall or floor is in the way
        F.specName = ""; const by = (F.jh || 0) + 1.1, cpp = clamp(cp, -1.1, 0.5), fx = -Math.sin(ca) * Math.cos(cpp), fy = Math.sin(cpp), fz = -Math.cos(ca) * Math.cos(cpp);
        let dist = 3.4; const o = [F.me.x, by, F.me.z], d = [-fx, -fy, -fz];
        dist = Math.min(dist, OPS_ML ? mlRay(o, d, dist) : oRay(F.me.x, F.me.z, -fx, -fz, dist)); dist = Math.max(0.3, dist - 0.3);
        cx = F.me.x - fx * dist; cz = F.me.z - fz * dist; cp = cpp; eye = Math.max((F.jh || 0) + 0.3, by - fy * dist); if (!OPS_ML) eye = Math.min(eye, (OPS_M.ceilH || OPS_M.wallH || OWH) - 0.3);
      }
      const bobAmt = F.moving ? 0.045 : F.walking ? 0.018 : 0; F.bobK = lerp(F.bobK || 0, bobAmt, 0.12); const bob = Math.abs(Math.sin(F.bob)) * F.bobK * 1.4 - F.bobK * 0.7;
      F.cam.position.set(cx, eye + bob, cz); F.cam.rotation.order = "YXZ"; F.cam.rotation.set(cp, ca, F.moving && !dead ? Math.sin(F.bob * 0.5) * 0.004 : 0);
      // view punch: a damped spring that shots and hits knock about (a roll and a short flinch; where you aim is not touched)
      { const P = F.vp || (F.vp = [0, 0, 0, 0]), h = Math.min(dt, 0.033); for (let k = 0; k < 2; k++) { P[k + 2] += (-190 * P[k] - 17 * P[k + 2]) * h; P[k] += P[k + 2] * h; } if (me >= 0 && !dead) { F.cam.rotation.x += P[0]; F.cam.rotation.z += P[1]; } }
      if (F.shake > 0) { F.shake = Math.max(0, F.shake - dt * 1.4); const sk = F.shake * F.shake * 0.32; F.cam.position.x += (Math.random() - 0.5) * sk; F.cam.position.y += (Math.random() - 0.5) * sk; F.cam.rotation.x += (Math.random() - 0.5) * sk * 0.25; F.cam.rotation.z += (Math.random() - 0.5) * sk * 0.3; }
      F.guns.forEach((gm, k) => { gm.visible = k === F.cur && me >= 0 && !dead && !F.scoped; });
      const gm = F.guns[F.cur];
      if (gm) {
        const rl = F.reloadT > 0 ? Math.sin(Math.min(1, F.reloadT / OW[F.cur].rl) * Math.PI) : 0, sw = F.swapT ? F.swapT / 0.35 : 0;
        F.sway = F.sway || { x: 0, y: 0 }; F.sway.x = lerp(F.sway.x, clamp(-(F.lookVX || 0) * 0.0004, -0.04, 0.04), 0.15); F.sway.y = lerp(F.sway.y, clamp((F.lookVY || 0) * 0.0004, -0.04, 0.04), 0.15);
        const U = gm.userData, ad = U.knife ? 0 : F.ads || 0, base = U.knife ? [0.2, -0.2, -0.38] : [U.vm[0] * (1 - ad), U.vm[1] + ad * 0.045, U.vm[2] + ad * 0.05];
        if (ad > 0) { F.sway.x *= 1 - 0.6 * ad; F.sway.y *= 1 - 0.6 * ad; }
        F.throwT = Math.max(0, (F.throwT || 0) - dt); const thw = F.throwT > 0 ? Math.sin((1 - F.throwT / 0.45) * Math.PI) : 0;
        const W1 = OW[F.cur], ps = U.knife ? { tilt: 0, dip: 0 } : GUNS.pose(gm, { reload: F.reloadT > 0 ? 1 - F.reloadT / W1.rl : -1, kick: F.kick, cyc: W1.rate > 0.5 && F.fireCd > 0 ? 1 - F.fireCd / W1.rate : 1 });
        const kz = U.knife ? 0.045 : 0.03 + W1.kick * 0.9, sw2 = sw * sw;
        gm.position.set(base[0] + Math.sin(F.bob * 0.5) * 0.006 * (1 - 0.7 * ad) + F.sway.x + thw * 0.08, base[1] - ps.dip - sw2 * 0.32 + Math.abs(Math.cos(F.bob * 0.5)) * 0.005 + F.sway.y - thw * 0.22, base[2] + F.kick * kz);
        gm.rotation.set(F.kick * (U.knife ? 0.08 : 0.035 + W1.kick * 1.6) + sw2 * 0.9 + ps.tilt * 0.25, F.sway.x * 2 + ps.tilt * 0.5, -ps.tilt * 0.9 - sw2 * 0.4);
        if (gm.userData.knife) {
          // swing: slash sweeps sideways, stab thrusts forward
          F.swingT = Math.max(0, (F.swingT || 0) - dt); const sp = Math.sin((1 - F.swingT / 0.32) * Math.PI) * (F.swingT > 0 ? 1 : 0);
          gm.position.x += F.swing > 0 ? -sp * 0.16 : 0; gm.position.z -= F.swing < 0 ? sp * 0.2 : 0;
          gm.rotation.z = F.swing > 0 ? sp * 0.9 : 0; gm.rotation.x = F.swing < 0 ? -sp * 0.4 : 0;
        } else {
          gm.userData.fl.visible = F.kick > 0.72 && !OW[F.cur].rocket; if (gm.userData.fl.visible) { gm.userData.fl.material.rotation = Math.random() * 6; const fs = 0.26 + Math.random() * 0.16; gm.userData.fl.scale.set(fs, fs, 1); }
        }
      }
      if (F.swapT === 0 && F.cur === KNIFE && F.kick > 0) F.kick = Math.max(0, F.kick - dt * 4);
      F.flash.intensity = Math.max(0, F.flash.intensity - dt * 120);
      F.rackMat.emissiveIntensity = 2.6 + Math.sin(t * 3) * 0.6;
      // payload
      const b = g.bomb || [0];
      F.bomb.visible = b[0] === 1 || b[0] === 2; if (!F.bomb.visible) F.bombLed.intensity = 0; else F.bombLed.position.set(b[1], (b[5] || 0) + 0.7, b[2]);
      if (F.bomb.visible) { F.bomb.position.set(b[1], b[5] || 0, b[2]); const rate = b[3] < 100 ? 8 : 3; const on = b[0] === 1 && Math.floor(t * rate) % 2 === 0; F.bombLed.intensity = on ? 12 : 0; F.bombHalo.visible = on || b[0] === 2; F.bombHalo.material.color.set(b[0] === 2 ? 0x3ddc97 : 0xff2a3c); F.bombScr.material.color.set(b[0] === 2 ? 0x3ddc97 : on ? 0xff2a3c : 0x550010); }
      if (b[0] === 1) { const k = b[3] < 100 ? 4 : 1; if (Math.floor(t * k * 2) !== F.beepK) { F.beepK = Math.floor(t * k * 2); if (F.beepK % 2 === 0) SFX.tone(1900, 0.05, "sine", 0.035); } }
      // glass the host says is broken: shatter what just broke, put back what was replaced
      if (F.nx && OPS_PANES_ID === OPS_ID && OPS_PANES.length) {
        const first = !F.pgS; if (first) F.pgS = new Uint8Array(OPS_PANES.length); const want = F.pgW || (F.pgW = new Uint8Array(4096)); want.fill(0, 0, OPS_PANES.length);
        if (Array.isArray(g.gb)) for (const k of g.gb) if (k >= 0 && k < OPS_PANES.length) want[k] = 1;
        for (let k = 0; k < OPS_PANES.length; k++) if (want[k] !== F.pgS[k]) { F.pgS[k] = want[k]; OPS_PGONE[k] = want[k]; this.paneSet(V, k, !want[k], !first); }
      }
      // props and explosions from the host
      if (typeof g.pr === "string" && F.propM) for (let k = 0; k < F.propM.length; k++) {
        const c = g.pr.charCodeAt(k), al = c > 48, st = al ? c - 48 : 0; OPS_PALIVE[k] = al ? 1 : 0;
        if (F.prA[k] !== al) { if (F.prA[k] === true && !al) this.propBreak(V, k); F.propM[k].visible = al; F.prA[k] = al; }
        if ((F.prS[k] || 0) !== st) { this.propDamage(V, k, st, st > (F.prS[k] || 0)); F.prS[k] = st; }
        if (st >= 2) this.propHurtFx(V, k, dt, t, st);
      }
      if (Array.isArray(g.fx)) { const mx = g.fx.reduce((m, f) => Math.max(m, f[0]), 0); if (F.fxSeen == null) F.fxSeen = mx; else { g.fx.forEach(f => { if (f[0] > F.fxSeen) { if (f[3] === 3) { const [d, pan] = this.sfxAt(F, f[1], f[2]); SFX.hiss(clamp(1 - d / 40, 0.1, 1), pan); } else this.explode(V, f[1], f[2], f[3], f[4] || 0); } }); F.fxSeen = Math.max(F.fxSeen, mx); } }
      this.nadesDraw(V, g, dt, t);
      if (OPS_M.only) this.arenaDraw(V, g, dt, t);
      if (g.rd !== F.scRd) { F.scRd = g.rd; F.scorch.forEach(m => { F.scene.remove(m); m.material.dispose(); }); F.scorch = []; }
      F.boomL.intensity = Math.max(0, F.boomL.intensity - dt * (F.boomL.userData.k || 0));
      this.vfxTick(F, dt);
      // effects
      for (const o of F.tracers) { o.life -= dt; o.m.material.opacity = Math.max(0, o.life / (o.max || 0.07)); if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
      F.tracers = F.tracers.filter(o => o.life > 0);
      for (const o of F.parts) { o.life -= dt; o.v[1] -= 9 * dt; o.m.position.x += o.v[0] * dt; o.m.position.y = Math.max(0.02, o.m.position.y + o.v[1] * dt); o.m.position.z += o.v[2] * dt; o.m.material.opacity = Math.max(0, o.life / 0.3); if (o.life <= 0) { F.scene.remove(o.m); o.m.material.dispose(); } }
      F.parts = F.parts.filter(o => o.life > 0);
      if (F.sparkC) { F.sparkC[0].update(dt, 9); F.sparkC[1].update(dt, 9); }
      if (F.nx) F.nx.update(dt, t);
      { const hp = mypl && mypl[1] ? mypl[0] : 100, low = me >= 0 && hp < 35 ? (35 - hp) / 35 : 0; F.lowK = lerp(F.lowK || 0, low, 0.06);
        F.hbT = (F.hbT || 0) - dt; if (low > 0 && F.hbT <= 0) { SFX.heart(0.45 + low * 0.5); F.hbT = 1.05 - low * 0.4; F.hbP = 1; } F.hbP = Math.max(0, (F.hbP || 0) - dt * 2.4);
        F.deaf = Math.max(0, (F.deaf || 0) - dt / 3.5); const mf = Math.max(F.lowK > 0.03 ? F.lowK * 0.55 : 0, F.deaf > 0.02 ? Math.min(0.8, F.deaf * 0.85) : 0);
        SFX.muffle(mf > 0.02 ? mf : 0); }
      if (F.post) { F.post.comp.uniforms.hurt.value = Math.min(1, (F.hurtT || 0) * 2.2 + (F.lowK || 0) * (0.16 + 0.2 * (F.hbP || 0))); F.post.render(F.scene, F.cam, t); if (F.nx) NXS.keep(F.nx); }
      else F.renderer.render(F.scene, F.cam);
    },
    hud(ctx, V, dt, t) {
      const F = V.fps, g = V.g || {}, me = V.meIdx, pl = me >= 0 && g.pl ? g.pl[me] : null;
      const tm = pl ? pl[2] : 0;
      if (team && g.hf && F.hf !== g.hf && Array.isArray(g.pl)) { F.hf = g.hf; opsTeamCols(V.ro, g.pl.map(q => q[2])); }   // halftime: colours follow the new sides
      const box = (x, y, w, h, r = 12, a = 0.72) => { ctx.fillStyle = "rgba(10,11,13," + a + ")"; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
      ctx.textBaseline = "middle";
      // HUD plates: dark glass with a cut corner and a thin accent edge
      const plate = (x, y, w, h, col, side = "l", a = 0.78, c = 10) => {
        ctx.beginPath();
        if (side === "l") { ctx.moveTo(x, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); }
        else { ctx.moveTo(x + c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + c); }
        ctx.closePath();
        const gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "rgba(22,25,30," + a + ")"); gr.addColorStop(1, "rgba(8,9,11," + Math.min(1, a + 0.12) + ")");
        ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.lineWidth = 1; ctx.stroke();
        if (col) { ctx.fillStyle = col; ctx.fillRect(side === "l" ? x : x + w - 3, y + (side === "l" ? 0 : c), 3, h - (side === "l" ? 0 : c)); }
      };
      const segs = (x, y, w, h, k, col, n = 10) => { const gw = (w - (n - 1) * 3) / n; for (let q = 0; q < n; q++) { const f = clamp(k * n - q, 0, 1); ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fillRect(x + q * (gw + 3), y, gw, h); if (f > 0) { ctx.fillStyle = col; ctx.fillRect(x + q * (gw + 3), y, gw * f, h); } } };
      const cap = (tx, x, y, col = "#8b919b") => { ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillStyle = col; try { ctx.letterSpacing = "2px"; } catch (e) {} ctx.fillText(tx, x, y); try { ctx.letterSpacing = "0px"; } catch (e) {} };
      // events
      (g.kf || []).forEach(k => {
        if (k[4] <= F.kfSeen) return; F.kfSeen = k[4];
        F.toasts.push({ k, life: 5 });
        if (k[0] === me && k[1] !== me) { FX.text(W / 2, H / 2 - 70, (k[3] ? "HEADSHOT · " : "") + "ELIMINATED " + (V.ro[k[1]] ? V.ro[k[1]].n : ""), k[3] ? "#ffd23f" : "#3ddc97", 1.1); SFX.kill(!!k[3]); }
        if (k[1] === me) SFX.play("fall");
      });
      if (F.toasts.length > 5) F.toasts.splice(0, F.toasts.length - 5);
      if (g.ann && g.ann[g.ann.length - 1] !== F.annSeen) {
        F.annSeen = g.ann[g.ann.length - 1]; const a = g.ann;
        if (a[0] === 9 && V.ro[a[1]]) F.ann = { big: V.ro[a[1]].n.toUpperCase() + " JOINED", sub: team ? "IN FOR A BOT · " + TEAM[(g.pl && g.pl[a[1]] ? g.pl[a[1]][2] : 0)].n.toUpperCase() : "IN FOR A BOT", col: "#3ddc97", life: 2.5 };
        if (a[0] === 1) F.ann = { big: a[2] ? "HALFTIME · SWITCH SIDES" : "ROUND " + a[1], sub: team ? (a[2] ? "ROUND " + a[1] + " · YOU NOW " : "") + (tm === 0 ? "ATTACK" : "DEFEND") : "", col: "#f5f1e6", life: a[2] ? 4.5 : 3 };
        if (a[0] === 2) { F.ann = { big: "PAYLOAD PLANTED", sub: "SITE " + (a[1] ? "B" : "A"), col: "#ff4d5e", life: 3 }; SFX.play("alarm"); }
        if (a[0] === 3) { const mine = pl && a[1] === tm; F.ann = { big: TEAM[a[1]].n.toUpperCase() + " WINS", sub: OPS_ANN[a[2]], col: TEAM[a[1]].hex, life: 4.5 }; SFX.play(mine ? "win" : "lose"); }
        if (a[0] === 4) { F.ann = { big: "GO GO GO", sub: "", col: "#ff8a3d", life: 1.6 }; SFX.play("go"); }
        if (a[0] === 6) { const mine = a[1] === me; F.ann = { big: mine ? "YOU HAVE THE ROUTER" : ((V.ro[a[1]] || {}).n || "").toUpperCase() + " HAS THE ROUTER", sub: mine ? "Keep it · stay alive" : "Take it from them", col: "#ffd23f", life: 2.6 }; SFX.play(mine ? "start" : "alarm"); }
        if (a[0] === 7) { F.ann = { big: "ROUTER DROPPED", sub: "Grab it!", col: "#ffd23f", life: 2 }; SFX.clack(0.7, 0, 0.7); }
        if (a[0] === 8) { F.ann = { big: "ROUTER RESET", sub: "Back at the center", col: "#ffd23f", life: 2 }; }
      }
      if (pl) { if (pl[0] < F.lastHp && pl[1]) { const n = F.lastHp - pl[0]; F.hurtT = 0.45; SFX.hurt(n); F.hurtN = { n, life: 1 }; const la = F.lastAttacker; let side = Math.random() < 0.5 ? -1 : 1;
          if (la && performance.now() - la.t < 700) { F.hurtDir = { x: la.x, z: la.z, life: 1.4 }; side = (la.x - F.me.x) * Math.cos(F.me.a) - (la.z - F.me.z) * Math.sin(F.me.a) > 0 ? 1 : -1; }
          if (F.vp) { const k = clamp(n / 45, 0.25, 1.2); F.vp[2] += k * 0.55; F.vp[3] += side * k * 0.8; } } F.lastHp = pl[0]; }
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
      if (pl && pl[1] && F.spawnHintT > 0 && (!F.shop || F.shop.hidden)) { F.spawnHintT -= dt; ctx.globalAlpha = Math.min(1, F.spawnHintT); ctx.textAlign = "center"; ctx.font = "700 14px 'JetBrains Mono', monospace"; const tx = troph ? "GRAB GUNS FROM THE PADS · FIND THE GOLDEN ROUTER" : laser ? (matchMedia("(pointer: coarse)").matches ? "HOOK BUTTON TO SWING" : "RIGHT-CLICK OR F TO HOOK") : matchMedia("(pointer: coarse)").matches ? "TAP BUY FOR GUNS" : "PRESS B FOR GUNS"; const tw = ctx.measureText(tx).width + 28; ctx.fillStyle = "rgba(10,11,13,.75)"; ctx.beginPath(); ctx.roundRect(W / 2 - tw / 2, H * 0.72 - 16, tw, 32, 8); ctx.fill(); ctx.fillStyle = "#ff8a3d"; ctx.fillText(tx, W / 2, H * 0.72); ctx.globalAlpha = 1; }
      F.hurtT = Math.max(0, F.hurtT - dt);
      if (F.hurtT > 0 && !F.post) { const gr = ctx.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 560); gr.addColorStop(0, "rgba(255,40,60,0)"); gr.addColorStop(1, "rgba(255,40,60," + F.hurtT * 1.3 + ")"); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
      const alive = pl && pl[1];
      // scope
      GFX.bleed(F.scoped && alive ? "#000" : pl && !alive ? "rgba(10,11,13,.35)" : "");
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
        plate(W / 2 - 70, 8, 140, 58, null, "l", 0.82, 0);
        for (const k of [0, 1]) { const x0 = k ? W / 2 + 72 : W / 2 - 72 - 64; plate(x0, 8, 64, 58, null, k ? "l" : "r", 0.82, 12); ctx.fillStyle = TEAM[k].hex; ctx.fillRect(x0, 62, 64, 4);
          ctx.textAlign = "center"; ctx.font = "700 34px 'Chakra Petch', sans-serif"; ctx.fillStyle = TEAM[k].hex; ctx.fillText(String((g.sc || [0, 0])[k]), x0 + 32, 35); }
        ctx.textAlign = "center";
        const b = g.bomb || [0];
        if (b[0] === 1 && g.ph === "live") { ctx.fillStyle = Math.floor(t * 4) % 2 ? "#ff4d5e" : "#ffd23f"; ctx.font = "700 24px 'JetBrains Mono', monospace"; ctx.fillText("💣 " + (b[3] / 10).toFixed(1), W / 2, 33); }
        else { ctx.fillStyle = g.ph === "buy" ? "#ff8a3d" : "#f5f1e6"; ctx.font = "700 24px 'JetBrains Mono', monospace"; ctx.fillText(fmtTime(tl), W / 2, 33); }
        ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.fillText(g.ph === "buy" ? "BUY TIME" : "ROUND " + (g.rd || 1), W / 2, 54);
        // alive pips
        const al = [[], []]; (g.pl || []).forEach(p => al[p[2]].push(p[1]));
        al.forEach((list, k) => list.forEach((a, j) => { ctx.fillStyle = a ? TEAM[k].hex : "rgba(255,255,255,.18)"; const x = k === 0 ? W / 2 - 150 - j * 12 : W / 2 + 150 + j * 12; ctx.fillRect(x - 4, 26, 7, 22); }));
      } else if (troph) {
        const pls = g.pl || [], lead = pls.reduce((m, p) => Math.max(m, p[21] || 0), 0), mine = pl ? pl[21] || 0 : 0, tr = g.tr || [0, 0, 0, -1];
        plate(W / 2 - 180, 8, 360, 68, "#ffd23f", "l", 0.82, 12); ctx.textAlign = "center";
        ctx.font = "700 22px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(fmtTime(tl), W / 2, 30);
        ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.fillText("YOU " + Math.floor(mine / 10) + "s  ·  BEST " + Math.floor(lead / 10) + "s  ·  WIN AT " + this.HOLD + "s", W / 2, 50);
        ctx.font = "700 12px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#ffd23f"; ctx.fillText(tr[3] >= 0 ? "🏆 " + (tr[3] === me ? "YOU" : ((V.ro[tr[3]] || {}).n || "").toUpperCase()) : "🏆 ROUTER IS FREE", W / 2, 66);
        // where's the router: a gold marker on screen, pinned to the edge when it's off screen
        if (F.trW && F.trBy !== me && F.cam) {
          const v = new THREE.Vector3(...F.trW).project(F.cam); let sx = W / 2 + v.x * (F.w / 2) / (F.gw / W), sy = H / 2 - v.y * (F.h / 2) / (F.gh / H); const behind = v.z > 1;
          if (behind) { sx = sx < W / 2 ? W - 40 : 40; sy = H / 2; }
          const ex = clamp(sx, 40, W - 40), ey = clamp(sy, 90, H - 90), d = Math.hypot(F.trW[0] - F.me.x, F.trW[2] - F.me.z);
          ctx.save(); ctx.translate(ex, ey); ctx.fillStyle = "#ffd23f"; ctx.strokeStyle = "rgba(10,11,13,.85)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(9, 0); ctx.lineTo(0, 11); ctx.lineTo(-9, 0); ctx.closePath(); ctx.stroke(); ctx.fill();
          ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.lineWidth = 4; ctx.strokeText(Math.round(d) + "m", 0, 22); ctx.fillText(Math.round(d) + "m", 0, 22); ctx.restore();
        }
        if (pl && pl[22] && pl[1]) { const k = Math.min(1, mine / 10 / this.HOLD); box(W / 2 - 170, H - 118, 340, 40, 10, 0.78); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(W / 2 - 150, H - 90, 300, 6); ctx.fillStyle = "#ffd23f"; ctx.fillRect(W / 2 - 150, H - 90, 300 * k, 6); ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillStyle = "#ffd23f"; ctx.fillText("YOU HAVE THE ROUTER · STAY ALIVE" + (cap ? (pl[24] ? " · SHIELD UP" : " · SHIELD GONE") : ""), W / 2, H - 104); }
      } else {
        const ranked = (g.pl || []).map((p, i) => ({ i, k: p[3], d: p[4] })).sort((a, b) => b.k - a.k || a.d - b.d);
        const lead = ranked[0], myRank = ranked.findIndex(o => o.i === me) + 1;
        plate(W / 2 - 130, 8, 260, 54, "#ff8a3d", "l", 0.82, 12);
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
        const b = g.bomb || [0], ch = opsSiteAt(F.me.x, F.me.z, F.jh);
        let hint = "";
        if (tm === 0 && b[0] === 0 && ch) hint = "E  PLANT";
        if (tm === 1 && b[0] === 1 && Math.hypot(F.me.x - b[1], F.me.z - b[2]) < 1.9 && Math.abs((F.jh || 0) - (b[5] || 0)) < 1.5) hint = "E  DEFUSE";
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
        const hp = Math.max(0, pl[0]), hc = hp > 50 ? "#f5f1e6" : hp > 25 ? "#ffd23f" : "#ff4d5e", low = hp <= 25 && pl[1];
        plate(14, H - 84, 300, 70, low && Math.floor(t * 3) % 2 ? "#ff4d5e" : "#3ddc97", "l");
        ctx.textAlign = "left"; cap("HEALTH", 30, H - 70); cap("ARMOR", 186, H - 70);
        ctx.font = "700 40px 'Chakra Petch', sans-serif"; ctx.fillStyle = hc; ctx.fillText(String(hp), 28, H - 45);
        ctx.font = "700 28px 'Chakra Petch', sans-serif"; ctx.fillStyle = pl[5] > 0 ? "#4cc9f0" : "#5b6068"; ctx.fillText(String(pl[5] | 0), 186, H - 47);
        segs(104, H - 50, 66, 8, hp / 100, hp > 50 ? "#3ddc97" : hp > 25 ? "#ffd23f" : "#ff4d5e", 5);
        segs(240, H - 50, 58, 8, (pl[5] | 0) / 100, "#4cc9f0", 5);
        segs(28, H - 26, 270, 4, hp / 100, hp > 50 ? "#3ddc97" : hp > 25 ? "#ffd23f" : "#ff4d5e", 20);
        if (team) { plate(14, H - 122, 132, 32, "#3ddc97", "l", 0.74, 8); ctx.textAlign = "left"; ctx.font = "700 17px 'JetBrains Mono', monospace"; ctx.fillStyle = "#3ddc97"; ctx.fillText("$" + pl[10].toLocaleString(), 28, H - 105); }
        // bottom-right: weapon + ammo
        const W0 = OW[F.cur], lowA = !W0.melee && !W0.laser && F.ammo[F.cur] <= W0.mag * 0.25;
        plate(W - 284, H - 84, 270, 70, W0.col, "r");
        ctx.textAlign = "left"; cap(W0.n.toUpperCase(), W - 270, H - 70, W0.col);
        ctx.textAlign = "right"; ctx.font = "700 44px 'Chakra Petch', sans-serif"; ctx.fillStyle = lowA ? "#ff6b57" : "#f5f1e6";
        const atx = W0.melee ? "—" : W0.laser ? "∞" : F.reloadT > 0 ? "··" : String(F.ammo[F.cur]);
        ctx.fillText(atx, W - 96, H - 42);
        ctx.textAlign = "left"; ctx.font = "700 16px 'JetBrains Mono', monospace"; ctx.fillStyle = "#8b919b"; ctx.fillText(W0.melee || W0.laser ? "" : "/ " + (F.res ? F.res[F.cur] : W0.mag), W - 88, H - 38);
        if (!W0.melee && !W0.laser) { if (F.reloadT > 0) { ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fillRect(W - 270, H - 26, 240, 4); ctx.fillStyle = "#ff8a3d"; ctx.fillRect(W - 270, H - 26, 240 * (1 - F.reloadT / W0.rl), 4); ctx.textAlign = "left"; cap("RELOADING", W - 270, H - 44, "#ff8a3d"); }
          else { segs(W - 270, H - 26, 240, 4, F.ammo[F.cur] / W0.mag, lowA ? "#ff6b57" : "#d7dbe2", Math.min(W0.mag, 30)); const dry = F.res && !(F.res[F.cur] > 0); if (lowA || (dry && F.ammo[F.cur] <= W0.mag * 0.25)) { ctx.textAlign = "left"; cap(F.ammo[F.cur] ? (dry ? "LAST MAG" : "LOW AMMO") : dry ? "NO AMMO" : "R  RELOAD", W - 270, H - 44, "#ff6b57"); } } }
        if (F.walking && F.walkHintT !== -1) { ctx.textAlign = "center"; ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#3ddc97"; ctx.fillText("WALKING · SILENT", W / 2, H - 20); }
        const own = this.owned(V); let wx = W - 14; ctx.font = "700 11px 'JetBrains Mono', monospace";
        const chip = (key, lab, col, on, dim) => { ctx.font = "700 11px 'JetBrains Mono', monospace"; const tw = ctx.measureText(lab).width + 34; plate(wx - tw, H - 114, tw, 24, on ? col : null, "r", on ? 0.9 : 0.6, 6);
          ctx.fillStyle = on ? col : "rgba(255,255,255,.14)"; ctx.fillRect(wx - tw + 5, H - 109, 15, 14); ctx.textAlign = "center"; ctx.fillStyle = on ? "#0b0c0e" : "#c9ced6"; ctx.fillText(String(key), wx - tw + 12.5, H - 101.5);
          ctx.textAlign = "left"; ctx.fillStyle = dim ? "#4a4f58" : on ? "#f5f1e6" : "#9aa1ab"; ctx.fillText(lab, wx - tw + 25, H - 101.5); wx -= tw + 5; };
        for (let k = own.length - 1; k >= 0; k--) { const o = own[k]; chip(OW[o].slot, OW[o].short, OW[o].col, o === F.cur, false); }
        for (const [k, key, lab, col] of [[1, 5, "SMOKE", "#c9ced8"], [0, 4, "FRAG", "#7ddc6a"]].filter(c => !laser && !(troph && c[0] === 1))) { const n = pl[18 + k] | 0; chip(key, lab, col, false, !n); }
      }
      if (me < 0) {
        const tx = F.specName ? "WATCHING " + F.specName.toUpperCase() : "WATCHING";
        ctx.textAlign = "center"; ctx.font = "700 15px 'JetBrains Mono', monospace"; const tw = Math.max(ctx.measureText(tx).width, 300) + 36;
        box(W / 2 - tw / 2, H - 92, tw, 54, 10, 0.78);
        ctx.fillStyle = "#f5f1e6"; ctx.fillText(tx, W / 2, H - 72);
        ctx.font = "600 12px Inter, sans-serif"; ctx.fillStyle = "#9da1a9"; ctx.fillText((matchMedia("(pointer: coarse)").matches ? "Tap" : "Click or Space") + " for the next player · you're in the next game", W / 2, H - 52);
      }
      // dead overlay
      if (pl && !alive && F.watchTm) {
        // watching a teammate: keep their view clear and say whose eyes these are at the bottom
        const tx = "WATCHING " + (F.specName || "").toUpperCase();
        ctx.textAlign = "center"; ctx.font = "700 15px 'JetBrains Mono', monospace"; const tw = Math.max(ctx.measureText(tx).width, 320) + 36;
        box(W / 2 - tw / 2, H - 112, tw, 74, 10, 0.78);
        ctx.font = "700 12px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#ff4d5e"; ctx.fillText("ELIMINATED", W / 2, H - 92);
        ctx.font = "700 15px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(tx, W / 2, H - 72);
        ctx.font = "600 12px Inter, sans-serif"; ctx.fillStyle = "#9da1a9"; ctx.fillText((matchMedia("(pointer: coarse)").matches ? "Tap" : "Click or Space") + " for the next teammate \u00b7 back next round", W / 2, H - 52);
      } else if (pl && !alive) {
        ctx.fillStyle = "rgba(10,11,13,.35)"; ctx.fillRect(0, 0, W, H);
        plate(W / 2 - 190, H * 0.4 - 36, 380, 96, "#ff4d5e", "l", 0.8, 14); ctx.textAlign = "center"; ctx.font = "700 38px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#ff4d5e"; ctx.fillText("ELIMINATED", W / 2, H * 0.4);
        ctx.font = "700 16px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6";
        ctx.fillText(team ? (F.specName ? "WATCHING " + F.specName.toUpperCase() : "NEXT ROUND") : "BACK IN " + Math.ceil(pl[13] / 10), W / 2, H * 0.4 + 40);
      }
      // kill feed
      F.toasts.forEach(o => o.life -= dt); F.toasts = F.toasts.filter(o => o.life > 0);
      F.toasts.forEach((o, k) => {
        const [a, b, wi, hs] = o.k, A = V.ro[a], B = V.ro[b]; if (!B) return;
        const pa = g.pl && g.pl[a], pb = g.pl && g.pl[b];
        const ca = team && pa ? TEAM[pa[2]].hex : A ? A.hex : "#fff", cb = team && pb ? TEAM[pb[2]].hex : B.hex;
        const mid = " " + (wi === -1 ? "PAYLOAD" : wi === -2 ? "⚡ BATTERY" : wi === -3 ? "FRAG" : wi === -4 ? "ROCKET" : wi === -5 ? "FELL" : (OW[wi] || OW[0]).short) + (hs ? " ◎ " : " "), an = A && a !== b ? A.n : "💥", bn = B.n;
        ctx.font = "700 11px 'JetBrains Mono', monospace"; const wm = ctx.measureText(mid).width; ctx.font = "700 13px Inter, sans-serif"; const wa = ctx.measureText(an).width, wb = ctx.measureText(bn).width, w = wa + wm + wb + 22;
        const y = 62 + k * 30, x = W - w - 14, mine = a === me || b === me;
        ctx.globalAlpha = Math.min(1, o.life); plate(x - 4, y, w + 4, 25, mine ? "#ff8a3d" : null, "r", mine ? 0.92 : 0.7, 7);
        ctx.textAlign = "left"; ctx.fillStyle = ca; ctx.fillText(an, x + 8, y + 13); ctx.fillStyle = hs ? "#ffd23f" : "#8b919b"; ctx.font = "700 11px 'JetBrains Mono', monospace"; ctx.fillText(mid, x + 8 + wa, y + 13); ctx.font = "700 13px Inter, sans-serif"; ctx.fillStyle = cb; ctx.fillText(bn, x + 8 + wa + wm, y + 13);
        ctx.globalAlpha = 1;
      });
      // minimap
      const ms = Math.min(5.2, 118 / OG), mx = 14, my = 14, mw = OG * ms;
      plate(mx - 6, my - 6, mw + 12, mw + 26, null, "l", 0.74, 10);
      ctx.textAlign = "left"; ctx.font = "700 10px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9da1a9"; ctx.fillText(OPS_M.n.toUpperCase(), mx, my + mw + 11);
      OPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch === "#") { ctx.fillStyle = "rgba(170,180,230,.35)"; ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); } else if (ch === "a" || ch === "b") { ctx.fillStyle = ch === "a" ? "rgba(76,201,240,.25)" : "rgba(61,220,151,.25)"; ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); } }));
      for (const k in (OPS_M.upSites || {})) { ctx.fillStyle = k === "a" ? "rgba(76,201,240,.3)" : "rgba(61,220,151,.3)"; ctx.strokeStyle = k === "a" ? "#4cc9f0" : "#3ddc97"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); for (const [x, z] of OPS_M.upSites[k]) { ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); ctx.strokeRect(mx + x * ms + 0.5, my + z * ms + 0.5, ms - 1, ms - 1); } ctx.setLineDash([]); }
      if (OPS_M.sky) OPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { if (ch === "v") { ctx.fillStyle = "rgba(255,77,94,.16)"; ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); } }));
      if (OPS_M.only) { OPS_MAP.forEach((r, z) => [...r].forEach((ch, x) => { const hh = oCellH(x, z); if (hh) { ctx.fillStyle = hh > 2 ? "rgba(255,138,61,.45)" : "rgba(76,201,240,.35)"; ctx.fillRect(mx + x * ms, my + z * ms, ms, ms); } else if (ch === "^") { ctx.fillStyle = "#3ddc97"; ctx.fillRect(mx + x * ms + ms * 0.25, my + z * ms + ms * 0.25, ms * 0.5, ms * 0.5); } }));
        if (Array.isArray(g.tr)) { ctx.fillStyle = Math.floor(t * 3) % 2 ? "#ffd23f" : "#fff2b0"; ctx.beginPath(); ctx.arc(mx + g.tr[0] / CS * ms, my + g.tr[2] / CS * ms, 4, 0, 7); ctx.fill(); } }
      ctx.font = "700 12px 'Chakra Petch', sans-serif"; if (OPS_CELLS.a.length) { ctx.textAlign = "center"; ctx.fillStyle = "#4cc9f0"; ctx.fillText("A", mx + OPS_SITE[0][0] / CS * ms, my + OPS_SITE[0][1] / CS * ms); ctx.fillStyle = "#3ddc97"; ctx.fillText(OPS_SITE[1][2] > 1 ? "B\u2191" : "B", mx + OPS_SITE[1][0] / CS * ms, my + OPS_SITE[1][1] / CS * ms); }
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
        const order = V.ro.map((r, i) => i).filter(i => g.pl && g.pl[i]).sort((a, b) => team ? (g.pl[a][2] - g.pl[b][2]) || (g.pl[b][3] - g.pl[a][3]) : troph ? ((g.pl[b][21] || 0) - (g.pl[a][21] || 0)) || (g.pl[b][3] - g.pl[a][3]) : (g.pl[b][3] - g.pl[a][3]) || (g.pl[a][4] - g.pl[b][4]));
        const RH = 26, bw = 680, bx = W / 2 - bw / 2, rowsH = order.length * RH + (team ? 2 * 26 : 0), bh = 84 + rowsH + 14, by = Math.max(74, (H - bh) / 2 - 10);
        ctx.fillStyle = "rgba(6,7,9,.5)"; ctx.fillRect(0, 0, W, H);
        plate(bx, by, bw, bh, "#ff8a3d", "l", 0.94, 18);
        ctx.textAlign = "left"; ctx.font = "700 22px 'Chakra Petch', sans-serif"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(this.title.toUpperCase(), bx + 22, by + 26);
        cap(OPS_M.n.toUpperCase() + "  ·  " + (team ? "ROUND " + (g.rd || 1) : troph ? "HOLD " + this.HOLD + "s TO WIN" : "FIRST TO " + this.GOAL), bx + 22, by + 48);
        ctx.textAlign = "right"; ctx.font = "700 22px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(fmtTime(tl), bx + bw - 22, by + 26);
        if (team) { ctx.font = "700 14px 'Chakra Petch', sans-serif"; const sc = g.sc || [0, 0]; ctx.fillStyle = TEAM[1].hex; ctx.fillText(String(sc[1]), bx + bw - 22, by + 48); const w1 = ctx.measureText(String(sc[1])).width; ctx.fillStyle = "#8b919b"; ctx.fillText(" : ", bx + bw - 22 - w1, by + 48); const w2 = ctx.measureText(" : ").width; ctx.fillStyle = TEAM[0].hex; ctx.fillText(String(sc[0]), bx + bw - 22 - w1 - w2, by + 48); }
        const cols = [["K", 380], ["D", 430], ["A", 480], ["K/D", 545], [team ? "$" : troph ? "HOLD" : "HS", 640]];
        let y = by + 72; ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(bx + 14, y + 10, bw - 28, 1);
        ctx.textAlign = "left"; cap("#", bx + 22, y); cap("PLAYER", bx + 54, y); ctx.textAlign = "right"; cols.forEach(c => cap(c[0], bx + c[1], y));
        y += 12; let lastT = -1, rank = 0;
        order.forEach((i) => { const r = V.ro[i], q = g.pl[i];
          if (team && q[2] !== lastT) { lastT = q[2]; rank = 0; ctx.fillStyle = TEAM[lastT].hex; ctx.globalAlpha = 0.16; ctx.fillRect(bx + 14, y + 3, bw - 28, 22); ctx.globalAlpha = 1; ctx.fillRect(bx + 14, y + 3, 3, 22); ctx.textAlign = "left"; cap(TEAM[lastT].n.toUpperCase() + (lastT === 0 ? "  ·  ATTACK" : "  ·  DEFEND"), bx + 26, y + 14, TEAM[lastT].hex); y += 26; }
          rank++; const cy = y + RH / 2;
          if (i === me) { ctx.fillStyle = "rgba(255,138,61,.14)"; ctx.fillRect(bx + 14, y, bw - 28, RH); ctx.fillStyle = "#ff8a3d"; ctx.fillRect(bx + 14, y, 3, RH); } else if (rank % 2 === 0) { ctx.fillStyle = "rgba(255,255,255,.03)"; ctx.fillRect(bx + 14, y, bw - 28, RH); }
          ctx.globalAlpha = q[1] ? 1 : 0.5; ctx.textAlign = "left"; ctx.font = "700 12px 'JetBrains Mono', monospace"; ctx.fillStyle = "#8b919b"; ctx.fillText(String(rank), bx + 22, cy);
          ctx.fillStyle = team ? TEAM[q[2]].hex : r.hex; ctx.beginPath(); ctx.arc(bx + 44, cy, 4, 0, 7); ctx.fill();
          ctx.fillStyle = i === me ? "#ffffff" : "#e3e6ea"; ctx.font = (i === me ? "800" : "600") + " 14px Inter, sans-serif"; ctx.fillText(r.n, bx + 56, cy); const nw = ctx.measureText(r.n).width;
          const tag = !q[1] ? "DEAD" : r.b ? "BOT" : q[16] ? "LEFT" : (troph && q[22]) ? "ROUTER" : ""; if (tag) cap(tag, bx + 64 + nw, cy, tag === "DEAD" ? "#ff4d5e" : tag === "ROUTER" ? "#ffd23f" : "#6d737d");
          ctx.textAlign = "right"; ctx.font = "700 13px 'JetBrains Mono', monospace"; ctx.fillStyle = "#f5f1e6"; ctx.fillText(String(q[3]), bx + 380, cy); ctx.fillStyle = "#b9bec6"; ctx.fillText(String(q[4]), bx + 430, cy); ctx.fillText(String(q[17] || 0), bx + 480, cy);
          ctx.fillText((q[3] / Math.max(1, q[4])).toFixed(2), bx + 545, cy);
          ctx.fillStyle = team ? "#3ddc97" : troph ? "#ffd23f" : "#b9bec6"; ctx.fillText(team ? (!pl || q[2] === pl[2] ? "$" + q[10] : "—") : troph ? Math.floor((q[21] || 0) / 10) + "s" : String(q[14] || 0), bx + 640, cy);
          ctx.globalAlpha = 1; y += RH; });
      }
      if (F.stick) { const s = APP.gameScale || 1, r = $("#gameCanvas").getBoundingClientRect(); ctx.strokeStyle = "rgba(245,241,230,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc((F.stick.bx - r.left) / s, (F.stick.by - r.top) / s, 55 / s, 0, 7); ctx.stroke(); ctx.fillStyle = "rgba(245,241,230,.35)"; ctx.beginPath(); ctx.arc((F.stick.x - r.left) / s, (F.stick.y - r.top) / s, 22 / s, 0, 7); ctx.fill(); }
      if (me >= 0 && V.h.ph === "play" && !document.pointerLockElement && !matchMedia("(pointer: coarse)").matches && (!F.shop || F.shop.hidden) && !(team && g.ph === "buy")) {
        ctx.textAlign = "center"; ctx.font = "700 18px 'Chakra Petch', sans-serif"; ctx.fillStyle = "rgba(10,11,13,.75)"; const msg = F.noLock ? "HOLD CLICK TO LOOK · CLICK AGAIN TO LOCK" : performance.now() < (F.lockRetryAt || 0) ? "ONE SEC… CLICK AGAIN" : "CLICK TO PLAY", bw = F.noLock ? 420 : 240; ctx.beginPath(); ctx.roundRect(W / 2 - bw / 2, H / 2 + 40, bw, 40, 12); ctx.fill(); ctx.fillStyle = "#ffd23f"; if (F.noLock) ctx.font = "700 14px 'Chakra Petch', sans-serif"; ctx.fillText(msg, W / 2, H / 2 + 61);
      }
    },
  };
}
GAMES.breach = makeOps("team");
GAMES.deathmatch = makeOps("ffa");
// the lobby now features only the 3D games; older games stay registered so past scores still show
GAME_ORDER.length = 0;
// third-person arm poses per weapon class (0 knife, 1 pistol, 2 long gun): [right [upper, fore], left [upper, fore]] as directions in body space (x right, y up, -z forward)
const OPS_ARM = [
  [[[0.18, -1, -0.05], [0.0, -0.8, -0.6]], [[-0.18, -1, -0.05], [0.0, -0.9, -0.4]]],
  [[[0.0, -0.45, -0.9], [-0.28, 0.25, -0.93]], [[0.0, -0.45, -0.9], [0.3, 0.25, -0.93]]],
  [[[0.3, -0.9, -0.15], [-0.4, 0.22, -0.9]], [[-0.05, -0.6, -0.8], [0.5, 0.28, -0.8]]],
];
// rotate `bone` so that its child ends up in direction `dir` (given in the space of `ref`)
const opsAim = (() => { let a, b, q, q2, pq; return (bone, child, dir, ref) => {
  if (!a) { a = new THREE.Vector3(); b = new THREE.Vector3(); q = new THREE.Quaternion(); q2 = new THREE.Quaternion(); pq = new THREE.Quaternion(); }
  bone.updateWorldMatrix(true, false); child.updateWorldMatrix(false, false);
  a.setFromMatrixPosition(child.matrixWorld).sub(b.setFromMatrixPosition(bone.matrixWorld)).normalize();
  b.set(dir[0], dir[1], dir[2]).transformDirection(ref.matrixWorld);
  q.setFromUnitVectors(a, b); bone.getWorldQuaternion(q2); q2.premultiply(q);
  bone.parent.getWorldQuaternion(pq); bone.quaternion.copy(pq.invert().multiply(q2));
}; })();
// rotate a bone about a world axis
const opsRotW = (() => { let q, q2, pq; return (bone, ax, ang) => {
  if (!ang) return; if (!q) { q = new THREE.Quaternion(); q2 = new THREE.Quaternion(); pq = new THREE.Quaternion(); }
  bone.updateWorldMatrix(true, false); q.setFromAxisAngle(ax, ang); bone.getWorldQuaternion(q2); q2.premultiply(q);
  bone.parent.getWorldQuaternion(pq); bone.quaternion.copy(pq.invert().multiply(q2));
}; })();
// tilt an arm-pose direction (body space, forward is -z) up or down with the player's aim
const opsTilt = (() => { const o = [[0, 0, 0], [0, 0, 0]]; return (d, p, k) => { const c = Math.cos(p), s = Math.sin(p), r = o[k]; r[0] = d[0]; r[1] = d[1] * c - d[2] * s; r[2] = d[1] * s + d[2] * c; return r; }; })();
// layers on top of the walk/run clips: knee-bend crouch, jump tuck, landing dip, aim pitch, recoil, hit flinch, breathing, leaning into turns, knees buckling on death
const opsPose = (() => { let axB, axL, up; return (av, R, alive, spd, dt, t, i) => {
  if (!axB) { axB = new THREE.Vector3(); axL = new THREE.Vector3(); up = new THREE.Vector3(0, 1, 0); }
  const B = R.B, e = (k) => Math.pow(k, dt);
  av.kick = (av.kick || 0) * e(0.00005); av.flinch = (av.flinch || 0) * e(0.004);
  const air = alive && (av.jh || 0) > 0.15; if (!air && (av.airK || 0) > 0.6) av.landT = 0.24;
  av.airK = lerp(av.airK || 0, air ? 1 : 0, 1 - e(air ? 0.0005 : 0.00001)); av.landT = Math.max(0, (av.landT || 0) - dt);
  const land = av.landT > 0 ? Math.sin(Math.PI * av.landT / 0.24) * 0.5 : 0, die = alive ? 0 : Math.min(1, (av.deadT || 0) * 5);
  const wC = Math.max(av.cr || 0, land, die), wA = (av.airK || 0) * (1 - (av.cr || 0));
  // leaning into turns while running
  const yr = dt > 0 ? (av.dYaw || 0) / dt : 0; av.lean = lerp(av.lean || 0, alive ? clamp(yr * 0.05 * Math.min(1, spd / 5), -0.2, 0.2) : 0, 1 - e(0.01));
  R.m.updateWorldMatrix(true, false); axB.set(1, 0, 0).transformDirection(av.bd.matrixWorld); axL.set(-1, 0, 0).transformDirection(R.m.matrixWorld);
  // legs: bend at hip and knee, keep the feet flat, and sink the body by what the bend takes off
  const th1 = 1.15 * wC, th2 = 2.05 * wC;
  [[B.lu, B.ll, B.lf, 0.75, 1.3], [B.ru, B.rl, B.rf, 0.4, 0.85]].forEach(([u, l, f, a1, a2]) => { const t1 = th1 + a1 * wA, t2 = th2 + a2 * wA; opsRotW(u, axL, t1); opsRotW(l, axL, -t2); opsRotW(f, axL, t2 - t1); });
  R.m.position.y = R.y0 - (R.L1 * (1 - Math.cos(th1)) + R.L2 * (1 - Math.cos(th1 - th2)));
  // upper body: aim pitch spread over the spine, neck and head, plus kick, flinch and breathing
  const still = spd < 0.5 && alive, br = still ? Math.sin(t * 1.7 + i * 1.3) * 0.022 : 0;
  av.aimP = alive ? clamp(av.pt || 0, -1.1, 1.1) + 0.09 * av.kick : 0;
  const P = av.aimP - 0.12 * av.flinch, lean = -0.3 * (av.cr || 0) - (alive ? 0 : 0.5 * die);
  opsRotW(B.s1, axB, P * 0.22 + lean + br); opsRotW(B.s2, axB, P * 0.3 + br * 0.6); opsRotW(B.nk, axB, P * 0.2); opsRotW(B.hd, axB, P * 0.28 - lean * (alive ? 1 : 0));
  if (av.flinch > 0.02) { opsRotW(B.s2, up, av.flS * 0.2 * av.flinch); opsRotW(B.hd, up, av.flS * 0.25 * av.flinch); }
}; })();
// turn a bone about the world up axis (keeps the torso on the aim line while the hips face the travel direction)
const opsTwist = (() => { let q, q2, pq, up; return (bone, ang) => {
  if (!q) { q = new THREE.Quaternion(); q2 = new THREE.Quaternion(); pq = new THREE.Quaternion(); up = new THREE.Vector3(0, 1, 0); }
  bone.updateWorldMatrix(true, false); q.setFromAxisAngle(up, ang); bone.getWorldQuaternion(q2); q2.premultiply(q);
  bone.parent.getWorldQuaternion(pq); bone.quaternion.copy(pq.invert().multiply(q2));
}; })();
GAMES.golden = makeOps("trophy");
GAMES.laser = makeOps("laser");       // retired from the lobby (Capture the Router is the laser game now); kept so past Laser Arena matches still show
GAMES.capture = makeOps("capture");
GAME_ORDER.push("breach", "deathmatch", "golden", "capture");
