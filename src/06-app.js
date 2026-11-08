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
function lobbyPeers() {
  return NET.room ? NET.room.peers().filter(p => p.presence && typeof p.presence.nick === "string" && p.kind !== "agent") : [];
}
function findHost() {
  if (!NET.room) return null;
  let best = null;
  for (const p of NET.room.peers()) {
    const h = p.presence && p.presence.h;
    if (!h || !h.id || !GAMES[h.game] || !Array.isArray(h.ro)) continue;
    if (!best || h.since < best.h.since || (h.since === best.h.since && p.peer < best.peer)) best = { peer: p.peer, h, p };
  }
  return best;
}
function setPresence(patch) { if (NET.room) NET.room.presence(patch).catch(() => {}); }
function myPresence() { return { v: 1, nick: APP.me.nick || "New tech", c: APP.me.c, uid: NET.uid }; }

// ---------- host ----------
function startSession(gameId) {
  if (findHost()) { toast("A game is already running. Hop in when it ends."); return; }
  const mod = GAMES[gameId];
  const myPeer = NET.myPeerLabel();
  const humans = lobbyPeers().slice(0, 16);
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
  const S = { id: randId(8), since: Date.now(), game: gameId, ph: "intro", phT: 6500, seed: (Math.random() * 1e9) | 0, ro, sq: 0, saved: null, res: null };
  S.ro.forEach(r => r.hex = PALETTE[r.col]);
  mod.hostStart(S);
  APP.S = S; APP.optOut = null;
  let last = now(), lastSend = 0;
  clearInterval(APP.hostTimer);
  APP.hostTimer = setInterval(() => {
    const t = now(), dtMs = clamp(t - last, 0, 120); last = t;
    hostTick(dtMs);
    if (t - lastSend > 60 && APP.S) { lastSend = t; setPresence({ h: packH() }); }
  }, 1000 / 60);
  setPresence({ h: packH() });
  SFX.play("start");
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
    tl: S.ph === "play" ? mod.timeLeft(S) : S.phT,
    ro: S.ro.map(r => ({ k: r.k, n: r.n, c: r.c, col: r.col, u: r.u, b: r.b, boss: r.boss || 0 })),
    g: mod.pack(S), res: S.res, saved: S.saved,
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
  S.ph = "results"; S.phT = 14000;
  const humans = S.res.filter(o => !S.ro[o.i].b && S.ro[o.i].u);
  if (humans.length >= 2 && NET.db) {
    const doc = {
      g: S.game, at: Date.now(), day: dayKey(), nb: S.ro.filter(r => r.b).length,
      ps: humans.map(o => { const r = S.ro[o.i]; return { u: r.u, n: r.n, c: r.c, pl: o.hp, pt: o.pt, sc: o.rec == null ? null : o.rec }; }),
    };
    S.saved = "saving";
    Promise.resolve().then(() => NET.db.collection("matches").add(doc)).then(() => { if (APP.S === S) S.saved = "yes"; }).catch(() => {
      if (APP.S === S) S.saved = "fail";
      toast("Couldn't save this match to the scoreboard.");
    });
  } else S.saved = "practice";
}
function endSession() {
  clearInterval(APP.hostTimer); APP.hostTimer = 0;
  APP.S = null;
  setPresence({ h: null });
}

// ---------- client game view ----------
const KEYS = new Set();
const JOY = { on: false, id: null, bx: 0, by: 0, x: 0, y: 0 };
let pendingDash = false;
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
  mod.clientEnter(V);
  APP.view = "game"; APP.myIn = null;
  $("#lobbyView").hidden = true; $("#gameView").hidden = false;
  $("#hudName").textContent = mod.title;
  $("#spectateTag").hidden = meIdx >= 0;
  $("#dashBtn").hidden = !(mod.id === "sumo" && meIdx >= 0 && matchMedia("(pointer: coarse)").matches);
  $("#leaveBtn").textContent = APP.S && APP.S.id === h.id ? "End game" : "Leave";
  buildChips(V);
  renderOverlay(V, true);
  resizeGame();
}
function exitGame() {
  if (APP.V && APP.V.mod.clientExit) { try { APP.V.mod.clientExit(APP.V); } catch (e) {} }
  APP.view = "lobby"; APP.V = null; APP.myIn = null;
  if (fsElement()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
  setPresence({ in: null });
  $("#gameView").hidden = true; $("#lobbyView").hidden = false;
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
  V.age = now() - V.recvAt;
  const mod = V.mod, ph = V.h.ph;
  if (ph !== V.prevPh) {
    if (ph === "play") { SFX.play("go"); }
    if (ph === "results") { const me = (V.h.res || []).find(o => o.i === V.meIdx); SFX.play(me && me.hp === 1 ? "win" : "pop"); }
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
    ctx.fillStyle = "rgba(11,14,32,.45)"; ctx.fillRect(0, 0, W, H);
    ctx.font = "400 " + Math.round(120 + k * 60) + "px Bungee, Impact, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.4 + k * 0.6; ctx.lineWidth = 10; ctx.strokeStyle = "#0b0e20"; ctx.strokeText(String(Math.max(1, n)), W / 2, H / 2);
    ctx.fillStyle = "#ffd23f"; ctx.fillText(String(Math.max(1, n)), W / 2, H / 2); ctx.globalAlpha = 1;
    if (V.meIdx >= 0) { ctx.font = "700 18px Figtree, system-ui, sans-serif"; ctx.fillStyle = "#f5f1e6"; ctx.fillText("You're " + V.ro[V.meIdx].n + " in " + PALETTE_NAMES[V.ro[V.meIdx].col], W / 2, H / 2 + 120); }
  }
  if (JOY.on && (mod.id === "coverage" || mod.id === "sumo")) {
    const s = APP.gameScale || 1, r = cv.getBoundingClientRect();
    const bx = (JOY.bx - r.left) / s, by = (JOY.by - r.top) / s, x = (JOY.x - r.left) / s, y = (JOY.y - r.top) / s;
    ctx.strokeStyle = "rgba(245,241,230,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, 55 / s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(245,241,230,.35)"; ctx.beginPath(); ctx.arc(x, y, 22 / s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (ph === "results" && V.podium) drawPodium(V, t);
}
function renderOverlay(V, full) {
  const ov = $("#overlay"), ph = V.h.ph, mod = V.mod;
  if (ph !== "results") $("#mindPanel").hidden = !(ph === "play" && mod.id === "helpdesk" && V.meIdx >= 0);
  if (ph !== "play" && $("#socPanel")) $("#socPanel").hidden = true;
  if (ph === "intro") {
    ov.textContent = "";
    const card = document.createElement("div"); card.className = "card";
    const h2 = document.createElement("h2"); h2.textContent = mod.title;
    const p = document.createElement("p"); p.textContent = mod.blurb;
    const ul = document.createElement("div"); ul.className = "keys";
    mod.how.forEach(x => { const s = document.createElement("span"); s.className = "key"; s.style.borderBottomWidth = "1px"; s.textContent = x; ul.append(s); });
    const keys = document.createElement("div"); keys.className = "keys";
    mod.keys.forEach(x => { const s = document.createElement("span"); s.className = "key"; s.textContent = x; keys.append(s); });
    const cnt = document.createElement("div"); cnt.className = "count-ring"; cnt.id = "introCount"; cnt.textContent = "Starting…";
    card.append(h2, p); if (mod.how && mod.how.length) card.append(ul); card.append(keys, cnt);
    if (innerHeight > innerWidth && innerWidth < 700) { const tip = document.createElement("p"); tip.style.marginTop = "8px"; tip.textContent = "Tip: turn your phone sideways for a bigger view."; card.append(tip); }
    if (APP.S && APP.S.id === V.sid) {
      const b = document.createElement("button"); b.className = "btn primary"; b.style.marginTop = "12px"; b.textContent = "Skip intro";
      b.addEventListener("click", () => { if (APP.S && APP.S.ph === "intro") APP.S.phT = 0; });
      card.append(b);
    }
    ov.append(card);
  } else if (ph === "results") {
    V.shownSaved = V.h.saved;
    if (!full && V.resCard) { const nt = $("#resNote"); if (nt) nt.textContent = savedNote(V.h.saved); return; }
    ov.textContent = "";
    const card = document.createElement("div"); card.className = "card results-card";
    const res = V.h.res || [];
    const win = res[0] && V.ro[res[0].i];
    const h2 = document.createElement("h2"); h2.textContent = win ? win.n + " wins!" : "Round over";
    const cv = document.createElement("canvas"); cv.className = "podium"; V.podium = cv;
    const list = document.createElement("div"); list.className = "res-list";
    res.forEach((o, k) => {
      const r = V.ro[o.i]; if (!r) return;
      const row = document.createElement("div"); row.className = "res-row" + (o.i === V.meIdx ? " me" : "");
      const p = document.createElement("span"); p.className = "p"; p.textContent = String(k + 1);
      const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = r.n + (r.b ? " (bot)" : "");
      const s = document.createElement("span"); s.className = "s"; s.textContent = o.l;
      const g = document.createElement("span"); g.className = "g"; g.textContent = r.b ? "" : "+" + o.pt;
      row.append(p, avatarCanvas(r.c, 30, r.hex), nm, s, g);
      list.append(row);
    });
    const note = document.createElement("div"); note.className = "res-note"; note.id = "resNote"; note.textContent = savedNote(V.h.saved);
    const act = document.createElement("div"); act.className = "res-actions";
    if (APP.S && APP.S.id === V.sid) {
      const again = document.createElement("button"); again.className = "btn primary"; again.textContent = "Play again";
      again.addEventListener("click", () => { const g = APP.S.game; endSession(); setTimeout(() => startSession(g), 120); });
      const back = document.createElement("button"); back.className = "btn"; back.textContent = "Back to the NOC";
      back.addEventListener("click", () => endSession());
      act.append(again, back);
    } else {
      const back = document.createElement("button"); back.className = "btn"; back.textContent = "Back to the NOC";
      back.addEventListener("click", () => { APP.optOut = V.sid; exitGame(); });
      act.append(back);
    }
    const cnt = document.createElement("span"); cnt.className = "res-note"; cnt.id = "resCount";
    act.append(cnt);
    card.append(h2, cv, list, note, act);
    ov.append(card);
    V.resCard = card;
    const top = res.slice(0, 3).map(o => o.i);
    V.podiumTop = top;
    FX.clear();
  } else {
    ov.textContent = "";
  }
}
function savedNote(s) {
  return s === "yes" ? "Saved to the scoreboard." : s === "saving" ? "Saving to the scoreboard…" : s === "fail" ? "This match couldn't be saved." : s === "practice" ? "Practice match. Scores count when 2 or more people play." : "";
}
const CONFETTI = [];
function drawPodium(V, t) {
  const cv = V.podium; if (!cv.isConnected) return;
  const w = cv.clientWidth || 560, h = cv.clientHeight || 230;
  const ctx = fitCanvas(cv, w, h);
  ctx.clearRect(0, 0, w, h);
  const top = V.podiumTop || [];
  const slots = [[0, 0.5, 0.42], [1, 0.22, 0.28], [2, 0.78, 0.18]]; // [rankIndex, x, height]
  for (const [ri, fx, fh] of slots) {
    const i = top[ri]; if (i == null) continue;
    const r = V.ro[i]; const x = w * fx, bw = Math.min(140, w * 0.26), bh = h * fh, by = h - bh;
    const grd = ctx.createLinearGradient(0, by, 0, h); grd.addColorStop(0, r.hex); grd.addColorStop(1, shade(r.hex, -0.5));
    ctx.fillStyle = grd; ctx.beginPath(); ctx.roundRect(x - bw / 2, by, bw, bh + 10, 10); ctx.fill();
    ctx.fillStyle = "rgba(11,14,32,.55)"; ctx.font = "400 " + Math.round(Math.min(34, bh * 0.5)) + "px Bungee, Impact, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(ri + 1), x, by + bh / 2 + 4);
    const jump = ri === 0 ? Math.abs(Math.sin(t * 5)) * 12 : Math.abs(Math.sin(t * 3 + ri)) * 4;
    drawChar(ctx, r.c, x, by - 34 - jump, 58, { t, mood: ri === 0 ? "happy" : "", phase: ri, color: r.hex });
    if (ri === 0) { star(ctx, x - 40, by - 80 - jump * 0.5, 9, 4, 5, "#ffd23f"); star(ctx, x + 42, by - 70 - jump * 0.3, 7, 3, 5, "#ffd23f"); }
  }
  if (!reducedMotion) {
    if (CONFETTI.length < 70) CONFETTI.push({ x: Math.random() * w, y: -10, vy: 40 + Math.random() * 60, vx: (Math.random() - 0.5) * 30, c: PALETTE[rint(0, 9)], r: Math.random() * 6, s: 4 + Math.random() * 4 });
    for (const p of CONFETTI) {
      p.y += p.vy / 60; p.x += p.vx / 60; p.r += 0.1;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
    }
  }
}

// ---------- lobby ----------
function drawStage(t) {
  const cv = $("#stageCanvas"); if (!cv.isConnected || APP.view !== "lobby") return;
  const w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  const ctx = fitCanvas(cv, w, h);
  // NOC backdrop: wall of screens
  const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#161b3a"); bg.addColorStop(1, "#1f2550");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const cols = Math.max(4, Math.floor(w / 120));
  for (let k = 0; k < cols; k++) {
    const sx = 14 + k * (w - 28) / cols, sw = (w - 28) / cols - 10;
    ctx.fillStyle = "#0a0d1e"; ctx.beginPath(); ctx.roundRect(sx, 14, sw, 54, 6); ctx.fill();
    ctx.strokeStyle = k % 3 === 1 ? "rgba(255,210,63,.6)" : "rgba(61,220,151,.55)"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const x = sx + 6 + i * (sw - 12) / 20, y = 46 + Math.sin(i * 0.9 + t * 2 + k) * 8 * Math.sin(t * 0.7 + k * 2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = "rgba(166,172,208,.6)"; ctx.font = "700 8px 'JetBrains Mono', monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(["UPTIME 99.98%", "TICKETS 12 OPEN", "FW · OK", "BACKUPS · OK", "EDR · 0 ALERTS", "LATENCY 18 MS", "VPN · 31 USERS", "PATCH TUE · 96%"][k % 8], sx + 6, 18);
  }
  ctx.fillStyle = "#2a3263"; ctx.fillRect(0, h - 46, w, 46);
  ctx.fillStyle = "#333d73"; ctx.fillRect(0, h - 46, w, 3);
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
    if (host && host.peer === p.peer) { ctx.font = "700 9px 'JetBrains Mono', monospace"; ctx.fillStyle = "#ffd23f"; ctx.textAlign = "center"; ctx.fillText("HOSTING", x, y - 56); }
    if (active) {
      const by = y - 70 - jump * 0.3;
      ctx.fillStyle = "#f5f1e6"; ctx.beginPath(); ctx.roundRect(x - 22, by - 20, 44, 38, 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 5, by + 17); ctx.lineTo(x, by + 25); ctx.lineTo(x + 5, by + 17); ctx.fill();
      ctx.font = "22px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(ea.e, x, by);
    }
  });
}
function updateLobby() {
  const ps = lobbyPeers();
  const n = ps.length || 1;
  $("#hereCount").textContent = n === 1 ? "Just you in the NOC" : n + " techs in the NOC";
  const host = findHost();
  const btn = $("#startBtn");
  const mod = GAMES[APP.sel];
  if (host) { btn.textContent = "Game in progress"; btn.disabled = true; }
  else { btn.textContent = "Start " + mod.title; btn.disabled = false; }
  const bots = APP.bots ? Math.max(0, (mod.fill ? mod.fill(Math.min(16, n)) : 4) - Math.min(16, n)) : 0;
  $("#startHint").textContent = n + (n === 1 ? " person" : " people") + (bots ? " + " + bots + " bot" + (bots > 1 ? "s" : "") : "") + " will play." + (n < 2 ? " Scores count with 2+ people." : "");
  $$(".game-card").forEach(el => el.setAttribute("aria-pressed", String(el.dataset.g === APP.sel)));
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
function buildCards() {
  const box = $("#gameCards"); box.textContent = "";
  GAME_ORDER.forEach(id => {
    const g = GAMES[id];
    const b = document.createElement("button"); b.className = "game-card"; b.dataset.g = id; b.type = "button";
    const cv = document.createElement("canvas");
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
    const id = card.dataset.g, mod = GAMES[id], cv = card.querySelector("canvas");
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
  APP.matches = snap.docs.map(d => d.data()).filter(m => m && GAMES[m.g] && Array.isArray(m.ps)).sort((a, b) => (b.at || 0) - (a.at || 0));
  renderBoard();
}
function aggregate(ms) {
  const by = {};
  ms.slice().sort((a, b) => a.at - b.at).forEach(m => m.ps.forEach(p => {
    if (!p || !p.u) return;
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
  const recs = computeRecords();
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
      row.append(best ? avatarCanvas(best.p.c, 38) : avatarCanvas([0, 9, 3, 0, 0], 38));
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
      e.textContent = APP.tab === "today" ? "No matches yet today. Start a game with 2+ people and the standings show up here." : "No matches yet. Every match with 2+ people adds points here.";
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
      const a = document.createElement("span"); a.textContent = GAMES[m.g].title + " · " + (w ? cleanNick(w.n) + " won" : "done");
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
  $("#startBtn").addEventListener("click", () => { SFX.ensure(); startSession(APP.sel); });
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
  addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || $("#editor").open)) return;
    if (APP.view !== "game") return;
    const V = APP.V; if (!V) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    KEYS.add(e.code);
    if (e.repeat) return;
    if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey) toggleFullscreen();
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

// ---------- main loop ----------
let lastT = now();
function frame() {
  const tn = now(), dt = Math.min(0.05, (tn - lastT) / 1000); lastT = tn;
  const t = tn / 1000;
  try {
    if (APP.view === "game") gameFrame(dt, t);
    else {
      drawStage(t);
      const host = findHost();
      if (host && host.h.id !== APP.optOut && host.h.ph !== "results") enterGame(host);
    }
    edPreview(t);
  } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}

async function boot() {
  APP.peerMap = {};
  renderMe(); buildCards(); bindEvents(); renderBoard(); updateLobby();
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
    if (APP.S) { const h = findHost(); if (h && h.h.id !== APP.S.id) { clearInterval(APP.hostTimer); APP.hostTimer = 0; APP.S = null; setPresence({ h: null }); } }
    updateLobby();
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
