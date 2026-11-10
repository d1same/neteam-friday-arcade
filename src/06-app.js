// ---------- app ----------
const APP = {
  me: null, sel: store("nfa-sel") || "coverage", bots: store("nfa-bots") !== false,
  view: "lobby", S: null, hostTimer: 0, V: null, optOut: null,
  matches: [], tab: "today", myIn: null, lastInJson: "", lastInSend: 0,
  emoteSeen: {}, emoteAt: {}, boardKey: "",
};
if (!GAMES[APP.sel] || !GAME_ORDER.includes(APP.sel)) APP.sel = GAME_ORDER[0];
(function loadMe() {
  const m = store("nfa-me");
  APP.me = m && validChar(m.c) ? { nick: cleanNick(m.nick), c: validChar(m.c) } : { nick: "", c: randomChar() };
})();

// ---------- peers helpers ----------
// game ids arrive from other browsers and from stored records: only real, own entries count (never "constructor" and friends)
function gameOf(id) { return typeof id === "string" && Object.prototype.hasOwnProperty.call(GAMES, id) ? GAMES[id] : null; }
function lobbyPeers() {
  return NET.room ? NET.room.peers().filter(p => p.presence && typeof p.presence.nick === "string" && p.kind !== "agent") : [];
}
function findHost() {
  if (!NET.room) return null;
  let best = null;
  for (const p of NET.room.peers()) {
    const h = p.presence && p.presence.h;
    // ignore anything that isn't a well-formed session, so one broken or hostile browser can't lock everyone's screen
    if (!h || typeof h !== "object" || typeof h.id !== "string" || !h.id || !gameOf(h.game) || typeof h.ph !== "string" || !Number.isFinite(h.since)) continue;
    if (!Array.isArray(h.ro) || h.ro.length > 32 || !h.ro.every(r => r && typeof r === "object" && typeof r.k === "string")) continue;
    if (!best || h.since < best.h.since || (h.since === best.h.since && p.peer < best.peer)) best = { peer: p.peer, h, p };
  }
  return best;
}
// Other players arrive 15 to 25 times a second. Instead of easing toward the last position (which trails and then
// jumps), remember when each update arrived and how fast they were moving, look a little ahead along that motion and
// glide there at the same rate whatever the frame rate. vx/vz: speed sent with the update (cars), else measured.
function netSmooth(o, ref, x, z, vx, vz, dt, snap, ahead) {
  const t = performance.now();
  if (!o.init || o.nsT == null || Math.hypot(o.x - x, o.z - z) > snap) { o.x = x; o.z = z; o.init = true; o.nsRef = ref; o.nsX = x; o.nsZ = z; o.nsT = t; o.nvx = 0; o.nvz = 0; return o; }
  if (ref !== o.nsRef || x !== o.nsX || z !== o.nsZ) {
    const gap = Math.max(0.016, (t - o.nsT) / 1000);
    if (vx == null) { const mx = clamp((x - o.nsX) / gap, -24, 24), mz = clamp((z - o.nsZ) / gap, -24, 24); const k = gap > 0.3 ? 1 : 0.4; o.nvx += (mx - o.nvx) * k; o.nvz += (mz - o.nvz) * k; }
    else { o.nvx = vx; o.nvz = vz; }
    o.nsRef = ref; o.nsX = x; o.nsZ = z; o.nsT = t;
  }
  // look ahead by the time since the update, fading out when no new one comes (they stopped, or the update is late)
  const age = (t - o.nsT) / 1000, la = age < ahead ? age : Math.max(0, ahead - (age - ahead));
  const tx = o.nsX + o.nvx * la, tz = o.nsZ + o.nvz * la, k = 1 - Math.exp(-(dt || 0) * 16);
  o.x += (tx - o.x) * k; o.z += (tz - o.z) * k;
  return o;
}
function setPresence(patch) { if (NET.room) NET.room.presence(patch).catch(() => {}); }
function myPresence() { return { v: 1, nick: APP.me.nick || "New tech", c: APP.me.c, uid: NET.uid }; }

// ---------- host ----------
const READY_MS = 60000, ALL_READY_MS = 3000;
// everyone in the NOC is pulled into a ready room; the match starts when all have tapped Ready
// (or the host starts it / the timer runs out). Anyone not ready watches and plays the next one.
function roomState(S) {
  const myPeer = NET.myPeerLabel();
  return lobbyPeers().map(p => {
    const r = p.presence.rdy, mine = p.peer === myPeer;
    const v = mine ? (S.hr ? 1 : 0) : r && r.s === S.id ? (r.v === 1 ? 1 : r.v === -1 ? -1 : 0) : -2; // 1 ready, 0 not ready, -1 left, -2 still joining
    const mv = mine ? (S.hv || "") : r && r.s === S.id && typeof r.mv === "string" ? r.mv.slice(0, 24) : "";
    return { k: p.peer, n: cleanNick(p.presence.nick) || "Tech", c: validChar(p.presence.c) || [0, 0, 0, 0, 0], v, h: mine ? 1 : 0, mv };
  }).filter(r => r.v !== -1).slice(0, 24);
}
function startSession(gameId) {
  if (findHost()) { toast("A game is already running. Hop in when it ends."); return; }
  const S = { id: randId(8), since: Date.now(), game: gameId, ph: "ready", phT: READY_MS, seed: (Math.random() * 1e9) | 0, ro: [], rr: [], sq: 0, saved: null, res: null, rdyT: 0, hr: 0, hv: "", allT: 0 };
  APP.S = S; APP.optOut = null;
  S.rr = roomState(S);
  let last = now(), lastSend = 0;
  stopHostTimer();
  APP.hostTimer = startHostTimer(() => {
    // browsers slow timers right down in a background tab. Catch up on the time that really passed (in small
    // steps, up to two seconds) so the match clock and the bots don't crawl for everyone when the host tabs away.
    if (APP.S !== S) return;
    const t = now(); let left = clamp(t - last, 0, 2000); last = t;
    while (left > 0.5 && APP.S === S) { const d = Math.min(left, 50); hostTick(d); left -= d; }
    if (t - lastSend > 60 && APP.S) {
      lastSend = t;
      // two people pressed Start at the same moment: the older game wins, the other host stands down
      const other = findHost(); if (other && other.h.id !== APP.S.id && other.peer !== NET.myPeerLabel()) { endSession(); toast("Someone else started a game first. Joining theirs."); return; }
      setPresence({ h: packH() });
    }
  });
  setPresence({ h: packH(), rdy: { s: S.id, v: 0 } });
  SFX.play("start");
}
// most-voted map wins (ties broken at random); no votes = picked automatically from the player count
function tallyVotes(mod, room) {
  if (!mod.mapList) return null;
  const ids = new Set(mod.mapList().map(m => m.id)), cnt = {};
  room.forEach(r => { if (r.mv && ids.has(r.mv)) cnt[r.mv] = (cnt[r.mv] || 0) + 1; });
  const best = Math.max(0, ...Object.values(cnt)); if (!best) return null;
  const top = Object.keys(cnt).filter(k => cnt[k] === best); return top[Math.floor(Math.random() * top.length)];
}
// the host loop runs off a worker's clock where it can: worker timers keep ticking at full rate when the tab is in the background
function startHostTimer(fn) {
  try {
    const url = URL.createObjectURL(new Blob(["setInterval(function(){postMessage(0)}," + (1000 / 60) + ");"], { type: "application/javascript" }));
    const w = new Worker(url); URL.revokeObjectURL(url);
    const h = { w, id: 0 };
    w.onmessage = () => fn();
    // if the worker can't run here, fall back to an ordinary timer
    w.onerror = () => { try { w.terminate(); } catch (e) {} if (APP.hostTimer === h && !h.id) { h.w = null; h.id = setInterval(fn, 1000 / 60); } };
    return h;
  } catch (e) { return { w: null, id: setInterval(fn, 1000 / 60) }; }
}
function stopHostTimer() {
  const h = APP.hostTimer; APP.hostTimer = 0; if (!h) return;
  if (h.w) { try { h.w.terminate(); } catch (e) {} }
  if (h.id) clearInterval(h.id);
}
function launchSession() {
  const S = APP.S, mod = GAMES[S.game];
  const myPeer = NET.myPeerLabel();
  const room = roomState(S), okKeys = new Set(room.filter(r => r.v === 1).map(r => r.k));
  S.mapPick = tallyVotes(mod, room);
  const humans = lobbyPeers().filter(p => okKeys.has(p.peer)).slice(0, 16);
  const ro = humans.map(p => ({ k: p.peer, n: cleanNick(p.presence.nick) || "Tech", c: validChar(p.presence.c) || [0, 0, 0, 0, 0], u: p.by || (typeof p.presence.uid === "string" ? p.presence.uid.slice(0, 80) : null), b: 0 }));
  if (!ro.length) ro.push({ k: myPeer, n: APP.me.nick || "You", c: APP.me.c, u: NET.uid, b: 0 });
  if (APP.bots) {
    const pool = shuffle(BOT_NAMES.slice());
    pool.sort((a, b) => (b.boss ? 1 : 0) - (a.boss ? 1 : 0));
    let k = 0;
    const want = mod.fill ? mod.fill(ro.length) : 4, extra = shuffle(OPS_EXTRA_BOTS.slice());
    while (ro.length < want) { const b = pool[k], n = b ? b.n : (extra[k - pool.length] || "Bot " + (k + 1)); k++; ro.push({ k: "bot" + k, n, c: b ? b.c.slice() : randomChar(), u: null, b: 1, boss: b && b.boss ? 1 : 0 }); }
  }
  const used = new Set();
  ro.forEach(r => { let col = r.c[1]; if (used.has(col)) { col = 0; while (used.has(col) && col < PALETTE.length) col++; if (col >= PALETTE.length) col = r.c[1]; } used.add(col); r.col = col; });
  S.ro = ro; S.ph = "intro"; S.phT = 6500; S.rr = null;
  S.ro.forEach(r => r.hex = PALETTE[r.col]);
  mod.hostStart(S);
  setPresence({ h: packH() });
}
function hostTick(dtMs) {
  const S = APP.S; if (!S) return;
  const mod = GAMES[S.game], dt = dtMs / 1000;
  const myPeer = NET.myPeerLabel();
  const pm = {}; NET.room.peers().forEach(p => pm[p.peer] = p);
  const inputs = S.ro.map(r => {
    if (r.b) return null;
    if (r.k === myPeer) return APP.myIn && APP.myIn.s === S.id ? APP.myIn : null;
    const p = pm[r.k], i = p && p.presence && p.presence.in;
    return i && i.s === S.id ? i : null;
  });
  if (S.ph === "ready") {
    // the host is a normal player here: nothing starts until everyone (host included) has tapped Ready,
    // then a short countdown lets anyone change their vote or un-ready
    S.phT -= dtMs; S.rdyT += dtMs;
    if (S.allT > 0) S.allT -= dtMs;
    if (S.rdyT > 250) {
      S.rdyT = 0; S.rr = roomState(S);
      const allReady = S.rr.length > 0 && S.rr.every(r => r.v === 1);
      if (!allReady) S.allT = 0; else if (S.allT === 0) S.allT = ALL_READY_MS;
      if (S.go || S.phT <= 0 || (allReady && S.allT <= 1)) { launchSession(); return; }
    }
    return;
  }
  if (S.ph === "intro" || S.ph === "count") {
    S.phT -= dtMs;
    if (S.phT <= 0) { if (S.ph === "intro") { S.ph = "count"; S.phT = 3000; } else { S.ph = "play"; } }
  } else if (S.ph === "play") {
    mod.hostTick(S, dt, inputs);
    if (mod.done(S)) finishSession();
  } else if (S.ph === "results") {
    S.phT -= dtMs;
    if (S.phT <= 0) endSession();
  }
}
function packH() {
  const S = APP.S, mod = GAMES[S.game];
  return {
    id: S.id, since: S.since, game: S.game, ph: S.ph, seed: S.seed, sq: ++S.sq,
    tl: S.ph === "play" ? mod.timeLeft(S) : S.ph === "ready" && S.allT > 0 ? Math.min(S.phT, S.allT) : S.phT, aR: S.ph === "ready" && S.allT > 0 ? 1 : 0,
    ro: S.ro.map(r => ({ k: r.k, n: r.n, c: r.c, col: r.col, u: r.u, b: r.b, boss: r.boss || 0 })),
    g: S.g ? mod.pack(S) : null, rr: S.ph === "ready" ? S.rr : null, res: S.res, saved: S.saved, bd: S.ph === "results" ? S.board : null,
  };
}
function finishSession() {
  const S = APP.S, mod = GAMES[S.game];
  const rank = mod.rank(S);
  let place = 0;
  S.res = rank.map(o => {
    const r = S.ro[o.i];
    let pt = 0, hp = 0;
    if (!r.b) { hp = ++place; pt = PLACE_POINTS[hp - 1] || 1; }
    return { i: o.i, l: o.label, pt, hp, rec: o.rec };
  });
  S.board = mod.board ? mod.board(S) : null;
  S.ph = "results"; S.phT = 20000;
  const humans = S.res.filter(o => !S.ro[o.i].b && S.ro[o.i].u);
  // every match with a signed-in human is saved. Solo matches vs bots keep records/personal bests but don't award league points.
  const solo = humans.length < 2;
  if (humans.length >= 1 && NET.db) {
    const doc = {
      g: S.game, at: Date.now(), day: dayKey(), nb: S.ro.filter(r => r.b).length, solo: solo ? 1 : 0,
      ps: humans.map(o => { const r = S.ro[o.i]; return { u: r.u, n: r.n, c: r.c, pl: o.hp, pt: solo ? 0 : o.pt, sc: o.rec == null ? null : o.rec }; }),
    };
    if (solo) S.res.forEach(o => { o.pt = 0; });
    S.saved = "saving"; S.solo = solo;
    Promise.resolve().then(() => NET.db.collection("matches").add(doc)).then(() => { if (APP.S === S) S.saved = solo ? "solo" : "yes"; }).catch(() => {
      if (APP.S === S) S.saved = "fail";
      toast("Couldn't save this match to the scoreboard.");
    });
  } else S.saved = "practice";
}
function endSession() {
  stopHostTimer();
  APP.S = null;
  setPresence({ h: null });
}

// ---------- client game view ----------
const KEYS = new Set();
const JOY = { on: false, id: null, bx: 0, by: 0, x: 0, y: 0 };
let pendingDash = false;
// ---------- game focus guard ----------
// While a game is open the page behaves like a game, not a web page: no text selection, no browser
// shortcuts (Ctrl+A/S/D/F/P, Alt menus, F1/F3/F5/F7, quick-find, zoom), no right-click menu, no
// mouse back/forward, no scrolling, and closing or reloading the tab asks first.
const typing = (t) => t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
function inMatch() { return APP.view === "game" && !!APP.V && !$("#editor").open; }
function kbLocked() { return !!APP.kbLock; }
(function guard() {
  const pass = new Set(["Escape", "F11", "F12"]);
  addEventListener("keydown", (e) => {
    if (!inMatch() || typing(e.target)) return;
    if (!pass.has(e.code)) e.preventDefault();
    const a = document.activeElement; if (a && a !== document.body && a.tagName === "BUTTON") a.blur();
  }, true);
  addEventListener("keyup", (e) => { if (inMatch() && !typing(e.target) && !pass.has(e.code)) e.preventDefault(); }, true);
  for (const ev of ["contextmenu", "selectstart", "dragstart"]) addEventListener(ev, (e) => { if (inMatch() && !typing(e.target)) e.preventDefault(); }, true);
  // mouse side buttons would navigate back/forward and drop you out of the match
  for (const ev of ["mousedown", "mouseup", "auxclick"]) addEventListener(ev, (e) => { if (inMatch() && (e.button === 3 || e.button === 4)) { e.preventDefault(); e.stopPropagation(); } }, true);
  addEventListener("wheel", (e) => { if (inMatch() && (e.ctrlKey || e.metaKey)) e.preventDefault(); }, { passive: false, capture: true });
  addEventListener("beforeunload", (e) => { if (APP.view === "game" && APP.V && (APP.V.meIdx >= 0 || APP.V.ready || (APP.S && APP.S.id === APP.V.sid))) { e.preventDefault(); e.returnValue = ""; } });
  // in fullscreen, also grab keys the browser normally keeps (Ctrl+W, Ctrl+T, the Windows key)
  const sync = () => {
    const kb = navigator.keyboard;
    if (fsElement() && kb && kb.lock) kb.lock().then(() => { APP.kbLock = true; }).catch(() => { APP.kbLock = false; });
    else { APP.kbLock = false; try { kb && kb.unlock && kb.unlock(); } catch (err) {} }
  };
  document.addEventListener("fullscreenchange", sync); document.addEventListener("webkitfullscreenchange", sync);
})();
function enterGame(host) {
  if (APP.V && APP.V.mod.clientExit) { try { APP.V.mod.clientExit(APP.V); } catch (e) {} }
  const h = host.h, mod = GAMES[h.game];
  const myPeer = NET.myPeerLabel();
  const ro = h.ro.map(r => Object.assign({}, r, { hex: PALETTE[r.col] || PALETTE[0], c: validChar(r.c) || [0, 0, 0, 0, 0] }));
  const meIdx = ro.findIndex(r => r.k === myPeer);
  const V = APP.V = {
    sid: h.id, h, g: h.g, ro, meIdx, sm: {}, age: 0, recvAt: now(), lastH: h, mod, prevPh: "", lastCount: 0,
    inputOf(i) { const r = ro[i]; const p = APP.peerMap[r.k]; const inp = p && p.presence && p.presence.in; return inp && inp.s === V.sid ? inp : null; },
  };
  FX.clear();
  V.ready = h.ph === "ready";
  if (V.ready) { V.myRdy = 0; V.myVote = ""; setPresence({ rdy: { s: h.id, v: V.myRdy, mv: "" }, in: null }); }
  else mod.clientEnter(V);
  APP.view = "game"; APP.myIn = null; document.body.classList.add("playing");
  try { const a = document.activeElement; if (a && a !== document.body) a.blur(); getSelection().removeAllRanges(); } catch (e) {}
  $("#lobbyView").hidden = true; $("#gameView").hidden = false;
  $("#hudName").textContent = mod.title;
  $("#spectateTag").hidden = meIdx >= 0 || V.ready || !!mod.md;
  $("#dashBtn").hidden = !(mod.id === "sumo" && meIdx >= 0 && matchMedia("(pointer: coarse)").matches);
  $("#leaveBtn").textContent = APP.S && APP.S.id === h.id ? "End game" : "Leave";
  buildChips(V);
  renderOverlay(V, true);
  resizeGame();
}
function exitGame() {
  if (APP.V && APP.V.mod.clientExit) { try { APP.V.mod.clientExit(APP.V); } catch (e) {} }
  APP.view = "lobby"; APP.V = null; APP.myIn = null; document.body.classList.remove("playing");
  if (fsElement()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
  setPresence({ in: null, rdy: APP.optOut ? { s: APP.optOut, v: -1 } : null });
  $("#gameView").hidden = true; $("#lobbyView").hidden = false; updateLobby();
  $("#mindPanel").hidden = true; $("#dashBtn").hidden = true; if ($("#socPanel")) $("#socPanel").hidden = true;
  $("#overlay").textContent = "";
  updateLobby();
}
function buildChips(V) {
  const box = $("#hudChips"); box.textContent = "";
  box.classList.toggle("many", V.ro.length > 8);
  V.chips = V.ro.map((r, i) => {
    const el = document.createElement("span"); el.className = "chip" + (i === V.meIdx ? " me" : "");
    el.style.borderColor = i === V.meIdx ? "" : "transparent";
    el.append(avatarCanvas(r.c, 24, r.hex));
    const nm = document.createElement("span"); nm.textContent = r.n;
    const sc = document.createElement("b"); sc.textContent = "0";
    el.append(nm, sc);
    el.style.boxShadow = "inset 0 -3px 0 " + r.hex;
    box.append(el);
    return sc;
  });
}
function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
function toggleFullscreen() {
  const el = $("#gameView");
  try {
    if (fsElement()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) { toast("Your browser doesn't allow fullscreen here. On iPhone, use Add to Home Screen."); return; }
    const r = req.call(el, { navigationUI: "hide" });
    if (r && r.then) r.then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape").catch(() => {}); } catch (e) {} }).catch(() => toast("Fullscreen was blocked by the browser."));
  } catch (e) { toast("Fullscreen isn't available here."); }
}
document.addEventListener("fullscreenchange", () => { $("#fsBtn").textContent = fsElement() ? "🗗" : "⛶"; setTimeout(() => { if (APP.view === "game") resizeGame(); }, 60); });
document.addEventListener("webkitfullscreenchange", () => setTimeout(() => { if (APP.view === "game") resizeGame(); }, 60));
function resizeGame() {
  const box = $("#stagebox"), cv = $("#gameCanvas");
  const bw = box.clientWidth - 16, bh = box.clientHeight - 16;
  let w = bw, h = bw * H / W;
  if (h > bh) { h = bh; w = bh * W / H; }
  cv.style.width = Math.floor(w) + "px"; cv.style.height = Math.floor(h) + "px";
  APP.gameScale = w / W;
}
addEventListener("resize", () => { if (APP.view === "game") resizeGame(); drawCards(); });

function readInput() {
  let dx = 0, dy = 0;
  if (KEYS.has("ArrowLeft") || KEYS.has("KeyA")) dx -= 1;
  if (KEYS.has("ArrowRight") || KEYS.has("KeyD")) dx += 1;
  if (KEYS.has("ArrowUp") || KEYS.has("KeyW")) dy -= 1;
  if (KEYS.has("ArrowDown") || KEYS.has("KeyS")) dy += 1;
  if (JOY.on) { const vx = JOY.x - JOY.bx, vy = JOY.y - JOY.by, d = Math.hypot(vx, vy); if (d > 6) { const k = Math.min(1, d / 55); dx = vx / d * k; dy = vy / d * k; } }
  const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
  const dash = pendingDash; pendingDash = false;
  return { dx, dy, dash };
}
function gameFrame(dt, t) {
  const host = findHost();
  if (!host || (APP.optOut && host.h.id === APP.optOut)) { exitGame(); return; }
  let V = APP.V;
  if (host.h.id !== V.sid) { enterGame(host); V = APP.V; }
  if (host.h !== V.lastH) { V.lastH = host.h; V.h = host.h; V.g = host.h.g; V.recvAt = now(); }
  // the ready room is over: re-enter with the real roster (players or spectators)
  if (V.ready && host.h.ph !== "ready") { enterGame(host); V = APP.V; V.lastH = host.h; V.h = host.h; V.g = host.h.g; }
  V.age = now() - V.recvAt;
  if (V.ready) { readyFrame(V, dt, t); return; }
  const mod = V.mod, ph = V.h.ph;
  if (ph !== V.prevPh) {
    if (ph === "play") { SFX.play("go"); }
    if (ph === "results") { const me = (V.h.res || []).find(o => o.i === V.meIdx); SFX.play(me && me.hp === 1 ? "win" : "count"); }
    V.prevPh = ph;
    renderOverlay(V, true);
  } else if (ph === "results" && V.h.saved !== V.shownSaved) renderOverlay(V, false);
  // input
  const inp = readInput();
  const out = mod.clientInput(V, dt, inp);
  if (V.meIdx >= 0 && out) {
    APP.myIn = Object.assign({ s: V.sid }, out);
    const j = JSON.stringify(APP.myIn), tt = now();
    if (j !== APP.lastInJson && tt - APP.lastInSend > 45) { APP.lastInJson = j; APP.lastInSend = tt; setPresence({ in: APP.myIn }); }
  }
  // timer
  const tl = Math.max(0, (V.h.tl || 0) - V.age);
  const timer = $("#hudTimer");
  if (ph === "play" && mod.timeLeft !== alert.timeLeft) { timer.textContent = fmtTime(tl); timer.classList.toggle("low", tl < 10000); }
  else if (ph === "play" && V.g) { timer.textContent = "R" + (V.g.r || 1) + "/" + alert.ROUNDS; timer.classList.remove("low"); }
  else { timer.textContent = ph === "results" ? "Done" : "—"; timer.classList.remove("low"); }
  if (!V.chipT || t - V.chipT > 0.2) { V.chipT = t; V.chips.forEach((el, i) => { el.textContent = i === V.meIdx && mod.id === "helpdesk" && V.md ? V.md.pts : mod.chip(V, i); }); }
  if (ph === "intro") { const n = Math.ceil(tl / 1000); const c = $("#introCount"); if (c) c.textContent = "Starting in " + n + "…"; }
  if (ph === "results") { const c = $("#resCount"); if (c) c.textContent = "Back to the NOC in " + Math.ceil(tl / 1000) + "s"; }
  // draw
  const cv = $("#gameCanvas");
  const cw = parseFloat(cv.style.width) || W, ch = parseFloat(cv.style.height) || H;
  const ctx = fitCanvas(cv, cw, ch);
  ctx.save();
  ctx.scale(cw / W, ch / H);
  mod.draw(ctx, V, dt, t);
  FX.draw(ctx, dt);
  if (ph === "count") {
    const n = Math.ceil(tl / 1000);
    if (n !== V.lastCount && n > 0) { V.lastCount = n; SFX.play("count"); }
    const k = (tl % 1000) / 1000;
    ctx.fillStyle = "rgba(8,9,11,.45)"; ctx.fillRect(0, 0, W, H);
    ctx.font = "700 " + Math.round(120 + k * 60) + "px 'Chakra Petch', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.4 + k * 0.6; ctx.lineWidth = 10; ctx.strokeStyle = "#0a0b0d"; ctx.strokeText(String(Math.max(1, n)), W / 2, H / 2);
    ctx.fillStyle = "#ff6a1a"; ctx.fillText(String(Math.max(1, n)), W / 2, H / 2); ctx.globalAlpha = 1;
    if (V.meIdx >= 0) { ctx.font = "700 18px Inter, system-ui, sans-serif"; ctx.fillStyle = "#f5f1e6"; ctx.fillText("You're " + V.ro[V.meIdx].n + " in " + PALETTE_NAMES[V.ro[V.meIdx].col], W / 2, H / 2 + 120); }
  }
  if (JOY.on && (mod.id === "coverage" || mod.id === "sumo")) {
    const s = APP.gameScale || 1, r = cv.getBoundingClientRect();
    const bx = (JOY.bx - r.left) / s, by = (JOY.by - r.top) / s, x = (JOY.x - r.left) / s, y = (JOY.y - r.top) / s;
    ctx.strokeStyle = "rgba(245,241,230,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, 55 / s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(245,241,230,.35)"; ctx.beginPath(); ctx.arc(x, y, 22 / s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function readyFrame(V, dt, t) {
  const tl = Math.max(0, (V.h.tl || 0) - V.age);
  const key = JSON.stringify(V.h.rr || []) + "|" + V.myRdy + "|" + V.myVote;
  if (key !== V.rrKey || V.prevPh !== "ready") { V.rrKey = key; V.prevPh = "ready"; renderReady(V); }
  const c = $("#rdyClock"); if (c) { c.textContent = fmtTime(tl); c.classList.toggle("go", !!V.h.aR); c.classList.toggle("low", !V.h.aR && tl < 10000); }
  const cl = $("#rdyLab"); if (cl) cl.textContent = V.h.aR ? "Everyone's ready" : "Starts in";
  $("#hudTimer").textContent = fmtTime(tl); $("#hudTimer").classList.toggle("low", tl < 10000);
  const cv = $("#gameCanvas");
  const cw = parseFloat(cv.style.width) || W, ch = parseFloat(cv.style.height) || H;
  const ctx = fitCanvas(cv, cw, ch);
  ctx.save(); ctx.scale(cw / W, ch / H);
  if (V.mod.cardArt) { try { V.mod.cardArt(ctx, V.cardRo || (V.cardRo = [{ c: APP.me.c }, { c: randomChar() }, { c: randomChar() }]), t); } catch (e) { ctx.fillStyle = "#0c0d0f"; ctx.fillRect(0, 0, W, H); } }
  else { ctx.fillStyle = "#0c0d0f"; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = "rgba(8,9,11,.55)"; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function setReady(V, v) { V.myRdy = v; if (APP.S && APP.S.id === V.sid) APP.S.hr = v; setPresence({ rdy: { s: V.sid, v, mv: V.myVote || "" } }); SFX.play(v ? "right" : "pop"); renderReady(V); }
function setVote(V, id) { V.myVote = V.myVote === id ? "" : id; if (APP.S && APP.S.id === V.sid) APP.S.hv = V.myVote; setPresence({ rdy: { s: V.sid, v: V.myRdy, mv: V.myVote } }); SFX.play("blip"); renderReady(V); }
// ---------- match screens: lobby, briefing, results ----------
function mkEl(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function nth(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
// a screenshot of the game fills the screen behind the lobby; the drawn card art shows through if the image is missing
function scrBackdrop(id) {
  const bg = mkEl("div", "scr-bg"), im = new Image(); im.alt = ""; im.decoding = "async"; im.onerror = () => im.remove(); im.src = "models/shot-" + id + ".jpg?v=" + SHOT_V;
  bg.append(im, mkEl("i")); return bg;
}
// small top-down plan of a map (walls, sites, decks) or the outline of a race track, for the vote tiles
function mapThumb(modId, id) {
  const S = 64, cv = document.createElement("canvas"); cv.width = cv.height = S * 2; cv.className = "map-thumb"; cv.setAttribute("aria-hidden", "true");
  const c = cv.getContext("2d"); c.scale(2, 2);
  try {
    if (modId === "race" && typeof RC_TRACKS !== "undefined" && RC_TRACKS[id]) {
      const P = RC_TRACKS[id].ctrl, n = P.length, pts = [];
      for (let q = 0; q < n; q++) {
        const a = P[(q + n - 1) % n], b = P[q], d = P[(q + 1) % n], e = P[(q + 2) % n];
        for (let k = 0; k < 8; k++) { const t = k / 8, t2 = t * t, t3 = t2 * t, f = (m) => 0.5 * (2 * b[m] + (d[m] - a[m]) * t + (2 * a[m] - 5 * b[m] + 4 * d[m] - e[m]) * t2 + (3 * b[m] - a[m] - 3 * d[m] + e[m]) * t3); pts.push([f(0), f(1)]); }
      }
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; pts.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); });
      const k = (S - 14) / Math.max(x1 - x0, z1 - z0, 1), ox = (S - (x1 - x0) * k) / 2 - x0 * k, oz = (S - (z1 - z0) * k) / 2 - z0 * k;
      c.beginPath(); pts.forEach(([x, z], q) => q ? c.lineTo(ox + x * k, oz + z * k) : c.moveTo(ox + x * k, oz + z * k)); c.closePath(); c.lineJoin = "round";
      c.strokeStyle = "rgba(255,255,255,.14)"; c.lineWidth = 6; c.stroke(); c.strokeStyle = "#e8eaee"; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = "#ff6a1a"; c.beginPath(); c.arc(ox + P[0][0] * k, oz + P[0][1] * k, 2.8, 0, 7); c.fill();
    } else if (typeof OPS_MAPS !== "undefined" && OPS_MAPS[id]) {
      const rows = OPS_MAPS[id].rows, n = Math.max(rows.length, rows[0].length), k = (S - 8) / n, o = 4;
      rows.forEach((row, z) => [...row].forEach((ch, x) => {
        if (ch === "#") c.fillStyle = "rgba(232,234,238,.62)"; else if (ch === "a" || ch === "b") c.fillStyle = "rgba(255,106,26,.6)"; else if (ch >= "1" && ch <= "9") c.fillStyle = "rgba(76,201,240,.42)"; else return;
        c.fillRect(o + x * k, o + z * k, k + 0.25, k + 0.25);
      }));
    }
  } catch (e) {}
  return cv;
}
function renderReady(V) {
  const ov = $("#overlay"), id = V.mod.id;
  const isHost = APP.S && APP.S.id === V.sid, myKey = NET.myPeerLabel();
  const rr = (V.h.rr || []).slice().filter(r => r && typeof r === "object").sort((a, b) => b.h - a.h || b.v - a.v || String(a.n).localeCompare(String(b.n)));
  const nReady = rr.filter(r => r.v === 1).length;
  // the backdrop stays put; only the content is rebuilt when someone readies up or votes
  let root = ov.querySelector(".mlobby");
  if (!root) { ov.textContent = ""; root = mkEl("div", "scr mlobby"); root.append(scrBackdrop(id)); ov.append(root); }
  const sc = mkEl("div", "scr-scroll"), inn = mkEl("div", "ml-in card");
  // left: the game, the clock and your ready button
  const left = mkEl("div", "ml-left");
  left.append(mkEl("span", "scr-eyebrow", "Match lobby · " + (HERO_KIND[id] || "Game night")), mkEl("h2", null, V.mod.title), mkEl("p", "ml-tag", V.mod.blurb || V.mod.tag || ""));
  const stat = mkEl("div", "ml-stat"), clk = mkEl("div", "ml-clock"), rdy = mkEl("div", "ml-rdy");
  const cl = mkEl("span", "cap", V.h.aR ? "Everyone's ready" : "Starts in"); cl.id = "rdyLab";
  const cb = mkEl("b", V.h.aR ? "go" : null, fmtTime(Math.max(0, (V.h.tl || 0) - (V.age || 0)))); cb.id = "rdyClock"; clk.append(cl, cb);
  const rn = mkEl("b", null, String(nReady)); rn.append(mkEl("small", null, " / " + rr.length));
  const pips = mkEl("div", "ml-pips"); rr.forEach(r => pips.append(mkEl("i", r.v === 1 ? "on" : r.v === -2 ? "wait" : null)));
  rdy.append(mkEl("span", "cap", "Ready"), rn, pips); stat.append(clk, rdy);
  const act = mkEl("div", "ml-actions");
  const rb = mkEl("button", "btn primary big ready-btn" + (V.myRdy ? " on" : ""), V.myRdy ? "✓ Ready" : "I'm ready"); rb.type = "button";
  rb.addEventListener("click", () => setReady(V, V.myRdy ? 0 : 1));
  act.append(rb);
  if (isHost) {
    const go = mkEl("button", "btn", "Force start (" + nReady + " ready)"); go.type = "button";
    go.addEventListener("click", () => { if (APP.S && APP.S.ph === "ready") APP.S.go = 1; });
    const cancel = mkEl("button", "btn ghost", "Cancel"); cancel.type = "button";
    cancel.addEventListener("click", () => endSession());
    act.append(go, cancel);
  } else {
    const back = mkEl("button", "btn ghost", "Sit this one out"); back.type = "button";
    back.addEventListener("click", () => { APP.optOut = V.sid; exitGame(); });
    act.append(back);
  }
  const hint = mkEl("p", "ml-hint", "Starts when the clock runs out, or as soon as everyone is ready (host too). Not ready by then? You'll watch live and play the next game." + (APP.bots ? " Bots fill empty seats." : ""));
  left.append(stat, act, hint);
  // right: who is here, and the map vote
  const right = mkEl("div", "ml-right");
  const ros = mkEl("section", "ml-panel"), rh = mkEl("header"); rh.append(mkEl("span", "cap", "Players"), mkEl("b", null, String(rr.length)));
  const list = mkEl("div", "ml-roster" + (rr.length > 6 ? " many" : ""));
  rr.forEach(r => {
    const row = mkEl("div", "ml-row" + (r.v === 1 ? " ok" : r.v === -2 ? " wait" : "") + (r.k === myKey ? " me" : ""));
    const ch = validChar(r.c) || [0, 0, 0, 0, 0], nm = mkEl("span", "nm", String(r.n || "Tech")); if (r.h) nm.append(mkEl("em", null, "Host"));
    row.append(avatarCanvas(ch, 34, PALETTE[ch[1]] || PALETTE[0]), nm, mkEl("span", "st", r.v === 1 ? "Ready" : r.v === -2 ? "Joining" : "Not ready"));
    list.append(row);
  });
  ros.append(rh, list); right.append(ros);
  if (V.mod.mapList) {
    const ml = V.mod.mapList(), cnt = {}, race = id === "race"; rr.forEach(r => { if (r.mv) cnt[r.mv] = (cnt[r.mv] || 0) + 1; });
    const mp = mkEl("section", "ml-panel"), mh = mkEl("header"); mh.append(mkEl("span", "cap", race ? "Vote for a track" : "Vote for a map"), mkEl("small", null, race ? "No votes = random" : "No votes = picked by player count"));
    const grid = mkEl("div", "map-grid");
    ml.forEach(m => {
      const on = V.myVote === m.id, n = cnt[m.id] || 0, b = mkEl("button", "map-btn" + (on ? " on" : "")); b.type = "button"; b.setAttribute("aria-pressed", String(on));
      const tx = mkEl("span", "tx"); tx.append(mkEl("b", null, m.n), mkEl("span", null, m.sub || ""));
      const vc = mkEl("i", n ? "has" : null, n ? String(n) : ""); vc.title = n + (n === 1 ? " vote" : " votes");
      b.append(mapThumb(id, m.id), tx, vc);
      b.addEventListener("click", () => setVote(V, m.id)); grid.append(b);
    });
    mp.append(mh, grid); right.append(mp);
  }
  inn.append(left, right); sc.append(inn);
  const old = root.querySelector(".scr-scroll"), top = old ? old.scrollTop : 0;
  if (old) old.replaceWith(sc); else root.append(sc);
  sc.scrollTop = top;
}
// "WASD move" -> key cap + action; anything that does not start with a key stays a plain tip
const KEY_RX = /^((?:WASD|Space|Shift|Ctrl|Tab|Esc|Click|Right-click|[A-Z]|[0-9])(?:\s*(?:\/|or)?\s*(?:WASD|Space|Shift|Ctrl|Tab|Esc|Click|Right-click|[A-Z]|[0-9])\b)*):?\s+(.+)$/;
function renderOverlay(V, full) {
  const ov = $("#overlay"), ph = V.h.ph, mod = V.mod;
  if (ph !== "results") $("#mindPanel").hidden = !(ph === "play" && mod.id === "helpdesk" && V.meIdx >= 0);
  if (ph !== "play" && $("#socPanel")) $("#socPanel").hidden = true;
  if (ph === "intro") {
    ov.textContent = "";
    const root = mkEl("div", "scr brief"), card = mkEl("div", "br-card card");
    card.append(mkEl("span", "scr-eyebrow", "Briefing · " + (HERO_KIND[mod.id] || "Game night")), mkEl("h2", null, mod.title), mkEl("p", "br-blurb", mod.blurb));
    if (mod.how && mod.how.length) { const ol = mkEl("ol", "br-how"); mod.how.forEach(x => ol.append(mkEl("li", null, x))); card.append(ol); }
    const keys = mkEl("div", "br-keys"), lines = [];
    (mod.keys || []).forEach(x => { const parts = String(x).split(" · "); if (parts.length > 1 && parts.every(q => KEY_RX.test(q))) lines.push(...parts); else lines.push(String(x)); });
    lines.forEach(x => { const m = KEY_RX.exec(x), row = mkEl("div", "br-key"); if (m) row.append(mkEl("kbd", null, m[1]), mkEl("span", null, m[2])); else { row.classList.add("tip"); row.textContent = x; } keys.append(row); });
    if (lines.length) card.append(mkEl("span", "cap", "Controls"), keys);
    if (innerHeight > innerWidth && innerWidth < 700) card.append(mkEl("p", "br-tip", "Tip: turn your phone sideways for a bigger view."));
    const foot = mkEl("div", "br-foot"), cnt = mkEl("span", "br-count", "Starting…"); cnt.id = "introCount"; foot.append(cnt);
    if (APP.S && APP.S.id === V.sid) {
      const b = mkEl("button", "btn primary", "Skip intro"); b.type = "button";
      b.addEventListener("click", () => { if (APP.S && APP.S.ph === "intro") APP.S.phT = 0; });
      foot.append(b);
    }
    card.append(foot); root.append(card); ov.append(root);
  } else if (ph === "results") {
    V.shownSaved = V.h.saved;
    if (!full && V.resCard) { const nt = $("#resNote"); if (nt) nt.textContent = savedNote(V.h.saved); return; }
    ov.textContent = "";
    const res = (Array.isArray(V.h.res) ? V.h.res : []).filter(o => o && typeof o === "object"), me = V.meIdx;
    const bd0 = V.h.bd, bd = bd0 && typeof bd0 === "object" && Array.isArray(bd0.rows) && Array.isArray(bd0.cols) ? Object.assign({}, bd0, { rows: bd0.rows.filter(o => o && typeof o === "object" && Array.isArray(o.v)) }) : null;
    const teams = bd && Array.isArray(bd.teams) && bd.teams.length === 2 && bd.teams.every(t => t && typeof t === "object") ? bd.teams : null;
    const root = mkEl("div", "scr results"), card = mkEl("div", "rs-card card");
    // headline: from your own seat when you played, the plain result when you watched
    const win = res[0] && V.ro[res[0].i], myPlace = res.findIndex(o => o.i === me) + 1;
    let head = win ? win.n + " wins" : "Match over", tone = "", accent = "";
    const meta = [];
    if (teams) {
      const T = teams, w = T[0].sc === T[1].sc ? -1 : T[0].sc > T[1].sc ? 0 : 1, mine = (bd.rows.find(o => o.i === me) || {}).tm;
      if (w < 0) head = "Draw";
      else if (mine === 0 || mine === 1) { head = mine === w ? "Victory" : "Defeat"; tone = mine === w ? "win" : "loss"; meta.push(T[w].n + " wins"); }
      else head = T[w].n + " wins";
      if (w >= 0) accent = T[w].hex;
    } else if (win && myPlace === 1) { head = "Victory"; tone = "win"; if (res.length > 1) meta.push("First of " + res.length); }
    else if (win && myPlace > 1) meta.push("You finished " + nth(myPlace) + " of " + res.length);
    if (bd && bd.sub) { let sb = String(bd.sub).replace(/^Rounds \d+ – \d+ · /, ""); if (sb.startsWith(mod.title + " · ")) sb = sb.slice(mod.title.length + 3); if (sb) meta.push(sb); }
    const hd = mkEl("header", "rs-head"), hl = mkEl("div", "rs-title");
    const h2 = mkEl("h2", tone || null, head); if (!tone && accent) h2.style.color = accent;
    hl.append(mkEl("span", "scr-eyebrow", "Match complete · " + mod.title), h2);
    if (meta.length) hl.append(mkEl("p", "rs-sub", meta.join("  ·  ")));
    hd.append(hl);
    if (accent) card.style.setProperty("--acc", accent);
    if (teams) {
      const sc = mkEl("div", "rs-score");
      teams.forEach((t, k) => { const d = mkEl("div", "t" + (k ? " r" : "")); d.style.setProperty("--c", t.hex); d.append(mkEl("span", null, t.n), mkEl("b", null, String(t.sc))); if (k) sc.append(mkEl("i", null, ":")); sc.append(d); });
      hd.append(sc);
    }
    // the strip under the headline: podium for free-for-all and races, awards for team games
    const strip = mkEl("div", "rs-strip");
    const pod = (label, i, stat, cls) => {
      const r = V.ro[i]; if (!r) return;
      const c = mkEl("div", "rs-pod" + (cls ? " " + cls : "") + (i === me ? " me" : "")), tx = mkEl("div", "tx");
      tx.append(mkEl("span", "cap", label), mkEl("b", null, r.n), mkEl("span", "st", stat || ""));
      c.append(avatarCanvas(r.c, 56, r.hex), tx); strip.append(c);
    };
    if (teams) {
      const col = (name) => bd.cols.indexOf(name), val = (rw, name) => { const k = col(name); return k < 0 ? 0 : parseFloat(rw.v[k]) || 0; };
      const best = (name) => { let b = null; bd.rows.forEach(rw => { const v = val(rw, name); if (v > 0 && (!b || v > b.v)) b = { i: rw.i, v }; }); return b; };
      // one card per player: someone who takes several awards gets them listed together
      const aw = [], give = (label, i, stat) => { const e = aw.find(q => q.i === i); if (e) { e.labels.push(label); if (stat) e.stats.push(stat); } else aw.push({ i, labels: [label], stats: stat ? [stat] : [] }); };
      const mv = bd.rows.find(rw => rw.i === bd.mvp), k = best("K"), d = best("DMG"), o = best("OBJ");
      if (mv) give("MVP", mv.i, val(mv, "K") + " K · " + val(mv, "D") + " D · " + val(mv, "A") + " A");
      if (k) give("Most eliminations", k.i, mv && mv.i === k.i ? "" : k.v + (k.v === 1 ? " elimination" : " eliminations"));
      if (d) give("Most damage", d.i, d.v + " damage");
      if (o) give("Objective", o.i, o.v + (o.v === 1 ? " plant or defuse" : " plants and defuses"));
      aw.forEach((e, q) => pod(e.labels.join(" · "), e.i, e.stats.join(" · "), q === 0 && mv ? "p1" : ""));
    } else res.slice(0, 3).forEach((o, k) => pod(["1st place", "2nd place", "3rd place"][k], o.i, o.l, "p" + (k + 1)));
    let list;
    if (bd) {
      list = mkEl("div", "rs-board"); const ptOf = {}; res.forEach(o => ptOf[o.i] = o.pt);
      const tbl = mkEl("table", "sb");
      const head2 = (label, hex, score) => {
        const tr = mkEl("tr", "sb-h" + (hex ? " tm" : "")); if (hex) tr.style.setProperty("--c", hex);
        const th0 = mkEl("th", "sb-name", hex ? label : "Player"); th0.colSpan = 3; if (hex && score != null) th0.append(mkEl("b", null, String(score)));
        tr.append(th0);
        bd.cols.forEach((c, k) => { const th = mkEl("th", null, c); th.title = (bd.tips && bd.tips[k]) || ""; tr.append(th); });
        const thp = mkEl("th", null, "PTS"); thp.title = "League points"; tr.append(thp); tbl.append(tr);
      };
      let lastTm = null, rank = 0;
      bd.rows.forEach(rw => {
        const r = V.ro[rw.i]; if (!r) return;
        const tm = teams ? teams[rw.tm] : null; if (teams && !tm) return;
        if (tm && rw.tm !== lastTm) { lastTm = rw.tm; rank = 0; head2(tm.n, tm.hex, tm.sc); }
        else if (!teams && lastTm === null) { lastTm = 0; head2("", null, null); }
        const tr = mkEl("tr", rw.i === me ? "me" : null); tr.style.setProperty("--c", tm ? tm.hex : r.hex);
        const tdA = mkEl("td", "sb-av"); tdA.append(avatarCanvas(r.c, 26, r.hex));
        const tdN = mkEl("td", "sb-name", r.n); if (r.b) tdN.append(mkEl("em", null, "Bot")); if (rw.i === bd.mvp) tdN.append(mkEl("span", "mvp", "MVP"));
        tr.append(mkEl("td", "sb-rk", String(++rank)), tdA, tdN);
        rw.v.forEach(x => tr.append(mkEl("td", null, String(x))));
        tr.append(mkEl("td", "sb-pt", r.b || !ptOf[rw.i] ? "" : "+" + ptOf[rw.i]));
        tbl.append(tr);
      });
      list.append(tbl);
    } else {
      list = mkEl("div", "res-list");
      res.forEach((o, k) => {
        const r = V.ro[o.i]; if (!r) return;
        const row = mkEl("div", "res-row" + (o.i === me ? " me" : ""));
        row.append(mkEl("span", "p", String(k + 1)), avatarCanvas(r.c, 30, r.hex), mkEl("span", "nm", r.n + (r.b ? " (bot)" : "")), mkEl("span", "s", o.l), mkEl("span", "g", r.b || !o.pt ? "" : "+" + o.pt));
        list.append(row);
      });
    }
    const foot = mkEl("footer", "rs-foot"), notes = mkEl("div", "rs-notes"), act = mkEl("div", "res-actions");
    const cnt = mkEl("span", "res-note cnt"); cnt.id = "resCount";
    const note = mkEl("span", "res-note", savedNote(V.h.saved)); note.id = "resNote"; notes.append(cnt, note);
    if (APP.S && APP.S.id === V.sid) {
      const again = mkEl("button", "btn primary", "Play again"); again.type = "button";
      again.addEventListener("click", () => { const g = APP.S.game; endSession(); setTimeout(() => startSession(g), 120); });
      const back = mkEl("button", "btn", "Back to the NOC"); back.type = "button";
      back.addEventListener("click", () => endSession());
      act.append(again, back);
    } else {
      const back = mkEl("button", "btn", "Back to the NOC"); back.type = "button";
      back.addEventListener("click", () => { APP.optOut = V.sid; exitGame(); });
      act.append(back);
    }
    foot.append(notes, act);
    card.append(hd); if (strip.childElementCount) card.append(strip); card.append(list, foot);
    root.append(card); ov.append(root);
    V.resCard = card;
    FX.clear();
  } else {
    ov.textContent = "";
  }
}
function savedNote(s) {
  return s === "yes" ? "Saved to the scoreboard." : s === "solo" ? "Saved. Records count; league points need 2+ players." : s === "saving" ? "Saving to the scoreboard…" : s === "fail" ? "This match couldn't be saved." : s === "practice" ? "Practice match. Scores count when 2 or more people play." : "";
}

// ---------- lobby ----------
function drawStage(t) {
  const cv = $("#stageCanvas"); if (!cv.isConnected || APP.view !== "lobby") return;
  const w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  const ctx = fitCanvas(cv, w, h);
  // NOC backdrop: wall of screens
  const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#141518"); bg.addColorStop(1, "#1b1d21");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const cols = Math.max(4, Math.floor(w / 120));
  for (let k = 0; k < cols; k++) {
    const sx = 14 + k * (w - 28) / cols, sw = (w - 28) / cols - 10;
    ctx.fillStyle = "#08090b"; ctx.beginPath(); ctx.roundRect(sx, 14, sw, 54, 6); ctx.fill();
    ctx.strokeStyle = k % 3 === 1 ? "rgba(255,210,63,.6)" : "rgba(61,220,151,.55)"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const x = sx + 6 + i * (sw - 12) / 20, y = 46 + Math.sin(i * 0.9 + t * 2 + k) * 8 * Math.sin(t * 0.7 + k * 2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = "rgba(157,161,169,.6)"; ctx.font = "700 8px 'JetBrains Mono', monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(["UPTIME 99.98%", "TICKETS 12 OPEN", "FW · OK", "BACKUPS · OK", "EDR · 0 ALERTS", "LATENCY 18 MS", "VPN · 31 USERS", "PATCH TUE · 96%"][k % 8], sx + 6, 18);
  }
  ctx.fillStyle = "#1d2024"; ctx.fillRect(0, h - 46, w, 46);
  ctx.fillStyle = "#2c3036"; ctx.fillRect(0, h - 46, w, 3);
  const ps = lobbyPeers();
  const list = ps.length ? ps : [{ peer: "me", sameTab: true, presence: myPresence(), by: null }];
  const n = list.length, gap = Math.min(110, (w - 40) / Math.max(1, n));
  const host = findHost();
  list.forEach((p, i) => {
    const x = w / 2 + (i - (n - 1) / 2) * gap, y = h - 78;
    const c = validChar(p.presence.c) || [0, 0, 0, 0, 0];
    // emote handling
    const em = p.presence.em;
    if (em && em.t && APP.emoteSeen[p.peer] !== em.t) { APP.emoteSeen[p.peer] = em.t; APP.emoteAt[p.peer] = { e: String(em.e || "").slice(0, 4), at: t }; if (!p.sameTab) SFX.play("blip"); }
    const ea = APP.emoteAt[p.peer];
    const active = ea && t - ea.at < 2.4;
    const jump = active ? Math.abs(Math.sin((t - ea.at) * 7)) * 16 * Math.max(0, 1 - (t - ea.at) / 2.4) : 0;
    drawChar(ctx, c, x, y - jump, Math.min(64, gap * 0.62), { t, phase: i * 1.3, mood: active ? "happy" : "", look: Math.sin(t * 0.5 + i) * 0.6 });
    nameTag(ctx, cleanNick(p.presence.nick) || "New tech", x, h - 22, p.sameTab, PALETTE[c[1]]);
    if (host && host.peer === p.peer) { ctx.font = "700 9px 'JetBrains Mono', monospace"; ctx.fillStyle = "#ff6a1a"; ctx.textAlign = "center"; ctx.fillText("HOSTING", x, y - 56); }
    if (active) {
      const by = y - 70 - jump * 0.3;
      ctx.fillStyle = "#f5f1e6"; ctx.beginPath(); ctx.roundRect(x - 22, by - 20, 44, 38, 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 5, by + 17); ctx.lineTo(x, by + 25); ctx.lineTo(x + 5, by + 17); ctx.fill();
      ctx.font = "22px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(ea.e, x, by);
    }
  });
}
// network messages arrive many times a second: refresh the lobby at most 4 times a second, and not at all during a match
function lobbySoon() {
  if (APP.view === "game") { APP.lobbyStale = true; return; }
  if (APP.lobbyT) return;
  APP.lobbyT = setTimeout(() => { APP.lobbyT = 0; updateLobby(); }, 250);
}
function updateLobby() {
  APP.lobbyStale = false;
  const ps = lobbyPeers();
  const n = ps.length || 1;
  $("#hereCount").textContent = n === 1 ? "Just you in the NOC" : n + " techs in the NOC";
  const host = findHost();
  const btn = $("#startBtn");
  const mod = GAMES[APP.sel];
  if (host) { btn.textContent = host.h.ph === "ready" ? "Join the match lobby" : host.h.ph === "results" ? "Match finishing…" : "Watch the game"; btn.disabled = host.h.ph === "results"; }
  else { btn.textContent = "Start " + mod.title; btn.disabled = false; }
  const bots = APP.bots ? Math.max(0, (mod.fill ? mod.fill(Math.min(16, n)) : 4) - Math.min(16, n)) : 0;
  $("#startHint").textContent = n + (n === 1 ? " person" : " people") + (bots ? " + " + bots + " bot" + (bots > 1 ? "s" : "") : "") + " in the lineup. Everyone taps Ready in the match lobby first." + (n < 2 ? " Scores count with 2+ people." : "");
  $$(".game-card").forEach(el => el.setAttribute("aria-pressed", String(el.dataset.g === APP.sel)));
  renderHero();
  // net pill
  const dot = $("#netDot"), txt = $("#netText");
  if (NET.server) { const on = NET.room.connected(); dot.className = "dot" + (on ? " on" : ""); txt.textContent = on ? "Online" : "Reconnecting…"; }
  else if (NET.local) { dot.className = "dot solo"; txt.textContent = "This browser only"; }
  else if (NET.room) { dot.className = "dot on"; txt.textContent = "Live"; }
}
function renderMe() {
  paintAvatar($("#meCanvas"), APP.me.c, 34);
  $("#meName").textContent = APP.me.nick || "Set up your tech";
}
// homepage screenshots are cached for a week: raise this when the shot-<game>.jpg files change
const SHOT_V = 3;
const HERO_KIND = { breach: "Team · Red vs Blue", deathmatch: "Free-for-all", golden: "Jump arena", laser: "Instagib arena", race: "Street race" };
function renderHero() {
  const id = APP.sel, g = GAMES[id]; if (!g || !$("#hero")) return;
  if (APP.heroSel === id) return; APP.heroSel = id;
  $("#heroTitle").textContent = g.title; $("#heroTag").textContent = g.tag; $("#heroKind").textContent = HERO_KIND[id] || "Game night";
  const ks = $("#heroKeys"); ks.textContent = ""; (g.keys || []).slice(0, 6).forEach(k => { const sp = document.createElement("span"); sp.textContent = k; ks.append(sp); });
  const im = $("#heroImg"), src = "models/shot-" + id + ".jpg?v=" + SHOT_V; im.classList.add("swap"); const pre = new Image();
  pre.onload = () => { im.src = src; im.classList.remove("swap"); }; pre.onerror = () => { im.style.display = "none"; }; pre.src = src;
  const best = (APP.recs || {})[id]; $("#heroRec").textContent = best ? g.rec.fmt(best.v) : "—";
}
function buildCards() {
  const box = $("#gameCards"); box.textContent = "";
  GAME_ORDER.forEach(id => {
    const g = GAMES[id];
    const b = document.createElement("button"); b.className = "game-card"; b.dataset.g = id; b.type = "button";
    // real in-game screenshot; the drawn card art is the fallback if the image is missing
    const cv = document.createElement("div"); cv.className = "shot";
    const im = document.createElement("img"); im.alt = ""; im.loading = "lazy"; im.src = "models/shot-" + id + ".jpg?v=" + SHOT_V;
    im.onerror = () => { const c2 = document.createElement("canvas"); cv.replaceWith(c2); drawCards(); };
    const kind = document.createElement("span"); kind.className = "kind"; kind.textContent = HERO_KIND[id] || "3D";
    cv.append(im, kind);
    const body = document.createElement("div"); body.className = "body";
    const h3 = document.createElement("h3"); h3.textContent = g.title;
    const p = document.createElement("p"); p.textContent = g.tag;
    const meta = document.createElement("div"); meta.className = "meta";
    const k = document.createElement("span"); k.textContent = g.keys[0];
    const rec = document.createElement("span"); rec.className = "rec"; rec.textContent = "No record yet";
    meta.append(k, rec);
    body.append(h3, p, meta);
    b.append(cv, body);
    b.addEventListener("click", () => { APP.sel = id; store("nfa-sel", id); SFX.play("blip"); updateLobby(); });
    b.addEventListener("dblclick", () => { APP.sel = id; startSession(id); });
    box.append(b);
  });
  drawCards();
}
function sampleRoster() {
  return [[1, 0, 1, 1, 2], [0, 3, 0, 5, 0], [2, 2, 4, 2, 1], [4, 4, 5, 6, 0]].map((c, i) => ({ n: ["Ana", "Dev", "Sam", "Kit"][i], c, col: c[1], hex: PALETTE[c[1]], b: 0 }));
}
function drawCards() {
  const ro = sampleRoster();
  $$(".game-card").forEach(card => {
    const id = card.dataset.g, mod = GAMES[id], cv = card.querySelector("canvas"); if (!cv) return;
    const w = cv.clientWidth || 260, h = cv.clientHeight || 162;
    const ctx = fitCanvas(cv, w, h);
    const V = { ro, meIdx: -1, sm: {}, age: 0, h: { ph: "play", seed: 7 }, inputOf: () => null, local: { x: 0, y: 0 }, prevSt: {}, lastBump: 99, lr: {}, pop: {}, prevGr: "" };
    if (id === "coverage") {
      const rnd = mulberry32(3); let gr = "";
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const q = (x < 9 && y < 8) ? 0 : (x > 14 && y < 8) ? 1 : (x > 14) ? 2 : (x < 9) ? 3 : -1; gr += (q >= 0 && rnd() < 0.8) ? String.fromCharCode(97 + q) : "."; }
      V.g = { gr, bp: [[200, 150], [760, 150], [760, 450], [200, 450]], pk: [480, 300] };
      V.inputOf = (i) => ({ x: V.g.bp[i][0], y: V.g.bp[i][1] });
      V.ro = ro.map(r => Object.assign({}, r, { b: 1 }));
      V.prevGr = gr;
    } else if (id === "sumo") V.g = { r: 200, p: [[400, 260, 0, 0, 0, 3, 1, 0, 0, 0], [450, 270, 0, 0, 0, 2, 0, 0, 0, 0], [600, 330, 0, 0, 0, 3, 2, 0, 0, 1], [330, 380, 0, 0, 0, 1, 0, 0, 0, 0]] };
    else if (id === "alert") { V.g = { rp: "armed", r: 3, al: 2, rt: [1, null, null, null] }; V.lr = { r: 3, goAt: 1, done: false }; }
    else V.g = { sc: [120, 85, 150, 60] };
    ctx.save(); ctx.scale(w / W, h / H);
    try { if (mod.cardArt) mod.cardArt(ctx, ro, 1.2); else mod.draw(ctx, V, 0, 1.2); } catch (e) { console.error(e); }
    ctx.restore();
  });
  FX.clear();
}

// ---------- scoreboard ----------
function onMatches(snap) {
  // stored records are tidied before use so one odd entry can't break the scoreboard for everyone
  APP.matches = snap.docs.map(d => d.data()).filter(m => m && typeof m === "object" && gameOf(m.g) && Array.isArray(m.ps))
    .map(m => { const at = Number.isFinite(+m.at) ? +m.at : 0; return Object.assign({}, m, { at, day: typeof m.day === "string" ? m.day : dayKey(at), ps: m.ps.filter(p => p && typeof p === "object") }); })
    .sort((a, b) => b.at - a.at);
  renderBoard();
}
function aggregate(ms) {
  const by = Object.create(null);
  ms.filter(m => !m.solo).sort((a, b) => a.at - b.at).forEach(m => m.ps.forEach(p => {
    if (!p || typeof p.u !== "string" || !p.u) return;
    const o = by[p.u] || (by[p.u] = { u: p.u, n: "", c: null, pts: 0, wins: 0, games: 0 });
    o.n = cleanNick(p.n) || o.n; o.c = validChar(p.c) || o.c; o.pts += +p.pt || 0; o.wins += p.pl === 1 ? 1 : 0; o.games++;
  }));
  return Object.values(by).sort((a, b) => (b.pts - a.pts) || (b.wins - a.wins));
}
function computeRecords() {
  const out = {};
  GAME_ORDER.forEach(id => {
    const mod = GAMES[id]; let best = null;
    APP.matches.filter(m => m.g === id).forEach(m => m.ps.forEach(p => {
      if (!p || p.sc == null || !Number.isFinite(+p.sc)) return;
      const v = +p.sc; if (mod.rec.better === "min" && v <= 0) return;
      if (!best || (mod.rec.better === "max" ? v > best.v : v < best.v)) best = { v, p };
    }));
    out[id] = best;
  });
  return out;
}
function renderBoard() {
  const body = $("#boardBody"); body.textContent = "";
  const today = dayKey();
  const todays = APP.matches.filter(m => m.day === today);
  $("#boardSub").textContent = todays.length ? todays.length + " match" + (todays.length > 1 ? "es" : "") + " today" : "";
  $$(".tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === APP.tab)));
  const recs = computeRecords(); APP.recs = recs; APP.heroSel = null; renderHero();
  GAME_ORDER.forEach(id => {
    const mod = GAMES[id], best = recs[id];
    const recEl = $('.game-card[data-g="' + id + '"] .rec');
    if (recEl) { recEl.textContent = ""; if (best) { const b = document.createElement("b"); b.textContent = mod.rec.fmt(best.v); recEl.append("Record ", b); } else recEl.textContent = "No record yet"; }
  });
  if (APP.tab === "records") {
    const box = document.createElement("div"); box.className = "records";
    GAME_ORDER.forEach(id => {
      const mod = GAMES[id], best = recs[id];
      const row = document.createElement("div"); row.className = "record";
      row.append(best ? avatarCanvas(validChar(best.p.c) || [0, 0, 0, 0, 0], 38) : avatarCanvas([0, 9, 3, 0, 0], 38));
      const mid = document.createElement("div"); mid.style.minWidth = "0";
      const l = document.createElement("div"); l.className = "lbl"; l.textContent = mod.title + " · " + mod.rec.label;
      const nm = document.createElement("div"); nm.style.fontWeight = "700"; nm.textContent = best ? cleanNick(best.p.n) : "Up for grabs";
      mid.append(l, nm);
      const v = document.createElement("div"); v.className = "val"; v.textContent = best ? mod.rec.fmt(best.v) : "—";
      row.append(mid, v); box.append(row);
    });
    body.append(box);
  } else {
    const rows = aggregate(APP.tab === "today" ? todays : APP.matches);
    if (!rows.length) {
      const e = document.createElement("div"); e.className = "empty";
      e.textContent = APP.tab === "today" ? "No league games yet today. Play with 2+ people to earn points." : "No matches yet. Every match with 2+ people adds points here.";
      body.append(e);
    } else {
      const box = document.createElement("div"); box.className = "rows";
      rows.slice(0, 12).forEach((r, k) => {
        const row = document.createElement("div"); row.className = "row" + (k === 0 ? " first" : "");
        const rk = document.createElement("span"); rk.className = "rank"; rk.textContent = String(k + 1);
        const who = document.createElement("div"); who.className = "who";
        const b = document.createElement("b"); b.textContent = (r.n || "Tech") + (r.u === NET.uid ? " (you)" : "");
        const sm = document.createElement("small"); sm.textContent = r.wins + " win" + (r.wins === 1 ? "" : "s") + " · " + r.games + " played" + (k === 0 && APP.tab === "today" ? " · MVP of the day" : "");
        who.append(b, sm);
        const pts = document.createElement("div"); pts.className = "pts"; pts.textContent = String(r.pts);
        const ps = document.createElement("small"); ps.textContent = "PTS"; pts.append(ps);
        row.append(rk, avatarCanvas(r.c || [0, 0, 0, 0, 0], 38), who, pts);
        box.append(row);
      });
      body.append(box);
    }
  }
  const feed = $("#feed"); feed.textContent = "";
  if (APP.matches.length) {
    const h4 = document.createElement("h4"); h4.textContent = "Recent matches";
    const ul = document.createElement("ul");
    APP.matches.slice(0, 6).forEach(m => {
      const li = document.createElement("li");
      const w = m.ps.find(p => p.pl === 1);
      const a = document.createElement("span"); a.textContent = GAMES[m.g].title + " · " + (w ? cleanNick(w.n) + (m.solo ? " vs bots" : " won") : "done");
      const b = document.createElement("span"); b.textContent = (m.day === today ? "" : m.day.slice(5).replace("-", "/") + " ") + clockStr(m.at);
      li.append(a, b); ul.append(li);
    });
    feed.append(h4, ul);
  }
}

// ---------- character editor ----------
let DRAFT = null;
function openEditor() {
  DRAFT = { nick: APP.me.nick, c: APP.me.c.slice() };
  $("#nickInput").value = DRAFT.nick;
  buildEditorOpts();
  const d = $("#editor");
  if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute("open", ""); } }
  setTimeout(() => $("#nickInput").focus(), 30);
}
async function uploadPhoto(file) {
  const btn = $("#photoBtn"); btn.disabled = true; btn.textContent = "Uploading…";
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => bad(new Error("That file isn't an image we can read.")); im.src = url; });
    const side = Math.min(img.naturalWidth, img.naturalHeight), N = 192;
    const cv = document.createElement("canvas"); cv.width = cv.height = N;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, N, N);
    // center crop, nudged up a bit since faces sit in the upper half of most photos
    const sx = (img.naturalWidth - side) / 2, sy = Math.max(0, Math.min(img.naturalHeight - side, (img.naturalHeight - side) * 0.35));
    ctx.drawImage(img, sx, sy, side, side, 0, 0, N, N);
    URL.revokeObjectURL(url);
    const blob = await new Promise(ok => cv.toBlob(ok, "image/jpeg", 0.86));
    const r = await fetch("api/avatar", { method: "POST", headers: { "content-type": "image/jpeg" }, body: blob });
    if (!r.ok) throw new Error(r.status === 429 ? "Too many uploads, try again in a few minutes." : "Upload failed (" + r.status + "). Photos need the arcade server.");
    const { id } = await r.json();
    if (!isAvId(id)) throw new Error("Upload failed.");
    // seed the cache with the local copy so the preview updates right away
    const e = AV[id] || (AV[id] = { img: new Image(), ok: false, cbs: [] });
    if (!e.ok) { e.img.onload = () => { e.ok = true; buildEditorOpts(); }; e.img.src = cv.toDataURL("image/jpeg", 0.86); }
    DRAFT.c = DRAFT.c.slice(0, 5).concat([id]);
    SFX.play("join"); buildEditorOpts();
  } catch (err) { toast(err.message || "Upload failed."); }
  btn.disabled = false; btn.textContent = "📷 Use my photo";
}
function buildEditorOpts() {
  $("#photoDel").hidden = !(DRAFT && DRAFT.c[5]);
  const box = $("#edOpts"); box.textContent = "";
  const groups = [["Body", 0, CHAR_OPTS.body], ["Color", 1, PALETTE_NAMES], ["Eyes", 2, CHAR_OPTS.eyes], ["Hat", 3, CHAR_OPTS.hat], ["Accessory", 4, CHAR_OPTS.acc]];
  groups.forEach(([label, slot, names]) => {
    const sec = document.createElement("div");
    const h3 = document.createElement("h3"); h3.textContent = label + " · " + names[DRAFT.c[slot]];
    const row = document.createElement("div"); row.className = "optrow";
    names.forEach((nm, v) => {
      const b = document.createElement("button"); b.type = "button"; b.title = nm; b.setAttribute("aria-label", label + ": " + nm);
      b.setAttribute("aria-pressed", String(DRAFT.c[slot] === v));
      if (slot === 1) { b.className = "swatch"; b.style.background = PALETTE[v]; }
      else {
        b.className = "opt";
        const c = DRAFT.c.slice(); c[slot] = v;
        const cv = document.createElement("canvas"); paintAvatar(cv, c, 46); b.append(cv);
      }
      b.addEventListener("click", () => { DRAFT.c[slot] = v; SFX.play("blip"); buildEditorOpts(); });
      row.append(b);
    });
    sec.append(h3, row); box.append(sec);
  });
}
function saveEditor() {
  const nick = cleanNick($("#nickInput").value) || ("Tech " + rint(100, 999));
  APP.me = { nick, c: validChar(DRAFT.c) };
  store("nfa-me", APP.me);
  setPresence(myPresence());
  renderMe();
  if (NET.db && NET.uid) { try { NET.db.collection("players").doc(NET.uid).set({ n: nick, c: APP.me.c, at: Date.now() }).catch(() => {}); } catch (e) {} }
  $("#editor").close();
  SFX.play("join");
  toast("Looking sharp, " + nick + ".");
}
function edPreview(t) {
  const d = $("#editor"); if (!d.open || !DRAFT) return;
  const cv = $("#edCanvas"), s = cv.clientWidth || 200;
  const ctx = fitCanvas(cv, s, s);
  ctx.clearRect(0, 0, s, s);
  drawChar(ctx, DRAFT.c, s / 2, s * 0.56, s * 0.62, { t, look: Math.sin(t * 0.8) * 0.7 });
}

// ---------- events ----------
function bindEvents() {
  $("#startBtn").addEventListener("click", () => { SFX.ensure(); const host = findHost(); if (host) { APP.optOut = null; if (host.h.ph !== "results") enterGame(host); return; } startSession(APP.sel); });
  $("#botsToggle").checked = APP.bots;
  $("#botsToggle").addEventListener("change", (e) => { APP.bots = e.target.checked; store("nfa-bots", APP.bots); updateLobby(); });
  $("#editBtn").addEventListener("click", openEditor);
  $("#meChip").addEventListener("click", openEditor);
  $("#edCancel").addEventListener("click", () => $("#editor").close());
  $("#edSave").addEventListener("click", saveEditor);
  $("#nickInput").addEventListener("keydown", (e) => { if (e.key === "Enter") saveEditor(); });
  $("#randBtn").addEventListener("click", () => { const ph = DRAFT.c[5]; DRAFT.c = randomChar(); if (ph) DRAFT.c.push(ph); SFX.play("pop"); buildEditorOpts(); });
  $("#photoBtn").addEventListener("click", () => $("#photoInput").click());
  $("#photoInput").addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) uploadPhoto(f); });
  $("#photoDel").addEventListener("click", () => { DRAFT.c = DRAFT.c.slice(0, 5); SFX.play("pop"); buildEditorOpts(); });
  $("#soundBtn").addEventListener("click", () => { SFX.on = !SFX.on; store("nfa-sound", SFX.on); $("#soundBtn").textContent = SFX.on ? "🔊" : "🔇"; if (SFX.on) SFX.play("blip"); });
  $("#soundBtn").textContent = SFX.on ? "🔊" : "🔇";
  $$(".emote").forEach(b => b.addEventListener("click", () => { SFX.ensure(); setPresence({ em: { e: b.dataset.e, t: Date.now() } }); }));
  $$(".tabs button").forEach(b => b.addEventListener("click", () => { APP.tab = b.dataset.tab; renderBoard(); }));
  $("#fsBtn").addEventListener("click", toggleFullscreen);
  $("#leaveBtn").addEventListener("click", () => {
    if (APP.S && APP.V && APP.S.id === APP.V.sid) { endSession(); toast("You ended the game for everyone."); }
    else if (APP.V) { APP.optOut = APP.V.sid; exitGame(); }
  });
  $("#dashBtn").addEventListener("pointerdown", (e) => { e.preventDefault(); pendingDash = true; });
  addEventListener("pointerdown", () => SFX.ensure(), { once: true });
  addEventListener("keydown", (e) => { if (e.code === "F8" && !e.repeat) { e.preventDefault(); NX.perfSet(!NX.perfOn()); const c = document.querySelector("[data-fps]"); if (c) c.checked = NX.perfOn(); } });
  addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || $("#editor").open)) return;
    if (APP.view !== "game") return;
    const V = APP.V; if (!V) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    KEYS.add(e.code);
    if (e.repeat) return;
    if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey) toggleFullscreen();
    if (V.ready) { if ((e.code === "KeyR" || e.code === "Enter")) setReady(V, V.myRdy ? 0 : 1); return; }
    if (V.mod.id === "sumo" && e.code === "Space") pendingDash = true;
    if (V.mod.id === "alert" && (e.code === "Space" || e.code === "Enter")) alert.tap(V);
    if (V.mod.id === "alert" && /^Digit[1-4]$|^Numpad[1-4]$/.test(e.code)) alert.tap(V, +e.code.slice(-1) - 1);
    if (V.mod.id === "helpdesk" && /^Digit[1-4]$|^Numpad[1-4]$/.test(e.code)) helpdesk.answer(V, +e.code.slice(-1) - 1);
  });
  addEventListener("keyup", (e) => KEYS.delete(e.code));
  addEventListener("blur", () => KEYS.clear());
  const cv = $("#gameCanvas");
  cv.addEventListener("pointerdown", (e) => {
    const V = APP.V; if (!V) return;
    if (V.mod.id === "alert") { alert.tap(V); return; }
    if (V.mod.id === "coverage" || V.mod.id === "sumo") { JOY.on = true; JOY.id = e.pointerId; JOY.bx = JOY.x = e.clientX; JOY.by = JOY.y = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (er) {} }
  });
  cv.addEventListener("pointermove", (e) => { if (JOY.on && e.pointerId === JOY.id) { JOY.x = e.clientX; JOY.y = e.clientY; } });
  const up = (e) => { if (e.pointerId === JOY.id) { JOY.on = false; JOY.id = null; } };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  $("#stagebox").addEventListener("pointerdown", (e) => { const V = APP.V; if (V && V.mod.id === "alert" && e.target.id !== "leaveBtn" && !e.target.closest(".card") && !e.target.closest("#socPanel")) { if (e.target !== cv) alert.tap(V); } });
}

// ---------- sound test: every sound in the game on a button (Settings in a match, or open the site with #sounds) ----------
function soundTest() {
  let d = $("#sndTest");
  if (!d) {
    d = document.createElement("div"); d.id = "sndTest"; d.className = "snd-test";
    d.innerHTML = '<header><div><span class="set-eyebrow">Neteam Friday Arcade</span><h4>Sound test</h4></div><button type="button" class="set-x" aria-label="Close">✕</button></header><p>Press a sound to hear it. Tell us the names of the ones that are wrong.</p><div class="snd-grid"></div>';
    const grid = d.querySelector(".snd-grid");
    SFX.LIST().forEach(([name, fn]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = name; b.addEventListener("click", () => { if (!SFX.on) { toast("Sound is off. Turn it on with the speaker button."); return; } SFX.ensure(); try { fn(); } catch (e) { console.error(e); } }); grid.appendChild(b); });
    d.querySelector(".set-x").addEventListener("click", () => { d.hidden = true; if (location.hash === "#sounds") history.replaceState(null, "", location.pathname + location.search); });
    ["mousedown", "pointerdown", "click"].forEach(ev => d.addEventListener(ev, (e) => e.stopPropagation()));
  }
  const host = APP.view === "game" ? $("#gameView") : document.body; if (d.parentNode !== host) host.appendChild(d);
  d.hidden = false; if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) { }
  SFX.ensure(); SFX.load();
}
addEventListener("hashchange", () => { if (location.hash === "#sounds") soundTest(); });

// ---------- main loop ----------
let lastT = now();
function frame() {
  const tn = now(), dt = Math.min(0.05, (tn - lastT) / 1000); lastT = tn;
  const t = tn / 1000;
  const inGame = APP.view === "game";
  try {
    if (inGame) gameFrame(dt, t);
    else {
      drawStage(t);
      const host = findHost();
      if (host && host.h.id !== APP.optOut && host.h.ph !== "results") enterGame(host);
    }
    edPreview(t);
  } catch (e) { console.error(e); }
  // frame rate display (F8) and the display's refresh rate for dynamic resolution
  try { NX.perfFrame(tn - (frame.prev || tn), now() - tn, inGame ? $("#gameView") : document.body, inGame); } catch (e) { }
  frame.prev = tn;
  requestAnimationFrame(frame);
}

async function boot() {
  APP.peerMap = {};
  renderMe(); buildCards(); bindEvents(); renderBoard(); updateLobby();
  if (location.hash === "#sounds") soundTest();
  requestAnimationFrame(frame);
  await NET.init();
  // a stored character from the shared store wins if this browser has none
  if (!store("nfa-me") && NET.db && NET.uid) {
    try { const s = await Promise.race([NET.db.collection("players").doc(NET.uid).get(), new Promise(r => setTimeout(() => r(null), 2500))]); if (s && s.exists) { const d = s.data(); if (validChar(d.c)) { APP.me = { nick: cleanNick(d.n), c: validChar(d.c) }; store("nfa-me", APP.me); renderMe(); } } } catch (e) {}
  }
  setPresence(myPresence());
  NET.room.onPeers((ch) => {
    APP.peerMap = {}; ch.peers.forEach(p => APP.peerMap[p.peer] = p);
    if (ch.joined.some(p => !p.sameTab) && APP.view === "lobby") SFX.play("join");
    // two hosts at once: the older session wins
    if (APP.S) { const h = findHost(); if (h && h.h.id !== APP.S.id) { stopHostTimer(); APP.S = null; setPresence({ h: null }); } }
    if (ch.joined.length || ch.left.length) updateLobby(); else lobbySoon();
  });
  NET.room.onConnection(() => updateLobby());
  try {
    NET.db.collection("matches").orderBy("at", "desc").limit(400).onSnapshot(onMatches, () => {
      try { NET.db.collection("matches").onSnapshot(onMatches, () => {}); } catch (e) {}
    });
  } catch (e) { try { NET.db.collection("matches").onSnapshot(onMatches, () => {}); } catch (e2) {} }
  updateLobby();
  if (!APP.me.nick) setTimeout(openEditor, 400);
}
boot();
