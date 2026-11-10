// Neteam Friday Arcade server: serves the game, relays live presence between players,
// and keeps the scoreboard in a JSON file (DATA_DIR/arcade-db.json).
//
// Trust model: this is a LAN party server with no logins. Game state is relayed between browsers and
// the match host's browser decides the results, so the scoreboard can't be made cheat-proof here.
// What the server does guarantee: one bad or hostile client can't crash it, fill the disk, wipe or
// rewrite other people's records, or be driven from a web page on another site.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const PORT = +process.env.PORT || 4802;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "arcade-db.json");
const PUBLIC = path.join(__dirname, "public");
const ALLOWED = /^(matches|players)\/[A-Za-z0-9_-]{1,80}$/;
const SUB_PATH = /^(matches|players)(\/[A-Za-z0-9_-]{1,80})?$/;
const UID = /^(?!__proto__$|constructor$|prototype$)[A-Za-z0-9_-]{1,80}$/;
const MAX_PRESENCE = 32 * 1024;
const MAX_CLIENTS = +process.env.MAX_CLIENTS || 200;       // sockets in total
const MAX_PER_IP = +process.env.MAX_PER_IP || 64;          // generous: a whole office can sit behind one address
const MAX_MATCHES = 5000, MAX_PLAYERS = 2000, MAX_AVATARS = 5000, MAX_AVATAR_BYTES = 256 * 1024;
const MATCH_FEED = 400;                                    // newest matches sent to each browser
const MAX_SUBS = 16, MAX_BUFFERED = 8 * 1024 * 1024;
const MSG_BURST = 240, MSG_PER_SEC = 120;                  // per-connection message budget
const MATCH_GAP_MS = 8000;                                 // one saved match per host at most this often
const RESUME_MS = 120000;                                  // a dropped connection can take its seat back for this long
const PLACE_POINTS = [10, 7, 5, 3];
// ORIGIN_CHECK=off disables the same-site check; ALLOWED_ORIGINS=host1,host2 adds extra hostnames (reverse proxies)
const ORIGIN_CHECK = String(process.env.ORIGIN_CHECK || "").toLowerCase() !== "off";
const EXTRA_ORIGINS = new Set(String(process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean));

process.on("uncaughtException", (e) => console.error("Unexpected error (server keeps running):", e && e.stack || e));
process.on("unhandledRejection", (e) => console.error("Unhandled rejection:", e && e.stack || e));

fs.mkdirSync(DATA_DIR, { recursive: true });
let db = {};
try {
  const j = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  if (j && typeof j === "object" && !Array.isArray(j)) { for (const k of Object.keys(j)) if (ALLOWED.test(k) && j[k] && typeof j[k] === "object") db[k] = j[k]; }
  console.log("Loaded", Object.keys(db).length, "records from", DB_FILE);
} catch (e) {
  if (e.code !== "ENOENT") {
    // a damaged file is kept aside (never overwritten by the next save), and the last good backup is loaded instead
    console.error("Could not read db:", e.message);
    try { fs.copyFileSync(DB_FILE, DB_FILE + ".corrupt-" + Date.now()); } catch (e2) {}
    try { const j = JSON.parse(fs.readFileSync(DB_FILE + ".bak", "utf8")); if (j && typeof j === "object" && !Array.isArray(j)) { for (const k of Object.keys(j)) if (ALLOWED.test(k) && j[k] && typeof j[k] === "object") db[k] = j[k]; console.log("Loaded", Object.keys(db).length, "records from the backup"); } } catch (e3) {}
  }
}
let saveT = null, saving = false, saveAgain = false, lastBak = 0;
function persist() {
  clearTimeout(saveT);
  saveT = setTimeout(function save() {
    if (saving) { saveAgain = true; return; }   // one write at a time
    saving = true; const tmp = DB_FILE + ".tmp";
    const done = () => { saving = false; if (saveAgain) { saveAgain = false; save(); } };
    fs.writeFile(tmp, JSON.stringify(db), (err) => {
      if (err) { console.error("Save failed:", err.message); return done(); }
      // keep a copy of the previous good file at most every 10 minutes
      if (Date.now() - lastBak > 600000) { try { fs.copyFileSync(DB_FILE, DB_FILE + ".bak"); lastBak = Date.now(); } catch (e) {} }
      fs.rename(tmp, DB_FILE, (e2) => { if (e2) console.error("Save failed:", e2.message); done(); });
    });
  }, 300);
}
const count = (prefix) => { let n = 0; for (const k in db) if (k.startsWith(prefix)) n++; return n; };

// ---------- validation of what browsers may store ----------
const cleanText = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/g, "").trim().slice(0, n);
function cleanChar(c) {
  if (!Array.isArray(c) || (c.length !== 5 && c.length !== 6)) return [0, 0, 0, 0, 0];
  const o = c.slice(0, 5).map(v => (Number.isInteger(v) && v >= 0 && v < 64 ? v : 0));
  if (c.length === 6 && typeof c[5] === "string" && /^[a-f0-9]{16}$/.test(c[5])) o.push(c[5]);
  return o;
}
function dayOf(ts) { const d = new Date(ts); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
// a finished match as the host's browser reports it. League points are worked out here from the places, not taken on trust.
function cleanMatch(d) {
  if (!d || typeof d !== "object" || typeof d.g !== "string" || !/^[a-z0-9_-]{1,24}$/i.test(d.g)) return null;
  if (!Array.isArray(d.ps) || d.ps.length < 1 || d.ps.length > 16) return null;
  const now = Date.now(), at = Number.isFinite(d.at) && Math.abs(d.at - now) < 10 * 60 * 1000 ? Math.round(d.at) : now;
  const seenU = new Set(), seenPl = new Set(), ps = [];
  for (const p of d.ps) {
    if (!p || typeof p !== "object" || typeof p.u !== "string" || !UID.test(p.u) || seenU.has(p.u)) return null;
    if (!Number.isInteger(p.pl) || p.pl < 1 || p.pl > 16 || seenPl.has(p.pl)) return null;
    seenU.add(p.u); seenPl.add(p.pl);
    ps.push({ u: p.u, n: cleanText(p.n, 14) || "Tech", c: cleanChar(p.c), pl: p.pl, pt: 0, sc: Number.isFinite(p.sc) ? Math.max(-1e9, Math.min(1e9, p.sc)) : null });
  }
  const solo = ps.length < 2;
  if (!solo) ps.forEach(p => { p.pt = PLACE_POINTS[p.pl - 1] || 1; });
  return { g: d.g, at, day: typeof d.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.day) ? d.day : dayOf(at), nb: Number.isInteger(d.nb) && d.nb >= 0 && d.nb <= 32 ? d.nb : 0, solo: solo ? 1 : 0, ps };
}
function cleanPlayer(d) {
  if (!d || typeof d !== "object") return null;
  return { n: cleanText(d.n, 14), c: cleanChar(d.c), at: Date.now() };
}
function pruneMatches() {
  const keys = Object.keys(db).filter(k => k.startsWith("matches/"));
  if (keys.length <= MAX_MATCHES) return;
  keys.sort((a, b) => ((db[a] && db[a].at) || 0) - ((db[b] && db[b].at) || 0));
  for (const k of keys.slice(0, keys.length - MAX_MATCHES)) delete db[k];
}

// ---------- http ----------
const SEC_HEADERS = { "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "x-frame-options": "SAMEORIGIN", "cross-origin-resource-policy": "same-origin" };
// the page is one inline script + inline styles, with fonts from Google Fonts; everything else is same-origin
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; " +
  "img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' ws: wss: data: blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
function reply(res, code, headers, body) { res.writeHead(code, Object.assign({}, SEC_HEADERS, headers)); res.end(body); }
function text(res, code, msg) { reply(res, code, { "content-type": "text/plain; charset=utf-8" }, msg); }
function sendFile(res, file, type, cache) {
  fs.readFile(file, (err, buf) => {
    if (err) return text(res, 404, "Not found");
    reply(res, 200, { "content-type": type, "cache-control": cache }, buf);
  });
}
const hostOnly = (h) => { try { return new URL("http://" + String(h).trim()).hostname.toLowerCase(); } catch (e) { return ""; } };
// a browser on another site must not be able to drive this server; requests with no Origin (curl, scripts) are fine
function originOk(req) {
  if (!ORIGIN_CHECK) return true;
  const o = req.headers.origin; if (!o) return true;
  let oh = ""; try { oh = new URL(o).hostname.toLowerCase(); } catch (e) { return false; }
  if (!oh) return false;
  if (EXTRA_ORIGINS.has(oh)) return true;
  const hosts = [req.headers.host, req.headers["x-forwarded-host"]].filter(Boolean).flatMap(h => String(h).split(","));
  return hosts.some(h => hostOnly(h) === oh);
}
const ipOf = (req) => (req.socket && req.socket.remoteAddress) || "";

const AV_DIR = path.join(DATA_DIR, "avatars");
fs.mkdirSync(AV_DIR, { recursive: true });
let avCount = 0; try { avCount = fs.readdirSync(AV_DIR).length; } catch (e) {}
const avHits = new Map(); // ip -> [timestamps]
function avAllowed(ip) {
  const nowT = Date.now(), list = (avHits.get(ip) || []).filter(t => nowT - t < 10 * 60 * 1000);
  if (list.length >= 30) { avHits.set(ip, list); return false; }
  list.push(nowT); avHits.set(ip, list); return true;
}
setInterval(() => { const nowT = Date.now(); for (const [ip, list] of avHits) if (!list.some(t => nowT - t < 10 * 60 * 1000)) avHits.delete(ip); }, 5 * 60 * 1000).unref();

let indexCache = null; // { mtimeMs, buf }
function sendIndex(res) {
  const f = path.join(PUBLIC, "index.html");
  fs.stat(f, (err, st) => {
    if (err) return text(res, 500, "The game files are missing from this server.");
    const done = (buf) => reply(res, 200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "content-security-policy": CSP }, buf);
    if (indexCache && indexCache.mtimeMs === st.mtimeMs) return done(indexCache.buf);
    fs.readFile(f, (e2, buf) => { if (e2) return text(res, 500, "The game files are missing from this server."); indexCache = { mtimeMs: st.mtimeMs, buf }; done(buf); });
  });
}
const STATIC_CACHE = "public, max-age=604800";
const STATIC_TYPES = {
  vendor: { js: "application/javascript; charset=utf-8", wasm: "application/wasm" },
  sfx: { mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav" },
  models: { glb: "model/gltf-binary", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", exr: "image/x-exr", hdr: "image/vnd.radiance", ktx2: "image/ktx2", bin: "application/octet-stream", json: "application/json; charset=utf-8" },
};
const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  const read = req.method === "GET" || req.method === "HEAD";
  if (url === "/health") return text(res, 200, "ok");
  if (url === "/api/avatar" && req.method === "POST") return avatarUpload(req, res);
  if (!read) { res.setHeader("allow", "GET, HEAD"); return text(res, 405, "Method not allowed"); }
  if (url === "/" || url === "/index.html") return sendIndex(res);
  // game assets: one flat folder each, plain file names, a fixed list of types
  const sm = /^\/(vendor|sfx|models)\/[a-z0-9_-][a-z0-9._-]*\.([a-z0-9]+)$/i.exec(url);
  if (sm) {
    const type = STATIC_TYPES[sm[1].toLowerCase()][sm[2].toLowerCase()];
    return type ? sendFile(res, path.join(PUBLIC, url), type, STATIC_CACHE) : text(res, 404, "Not found");
  }
  const am = /^\/api\/avatar\/([a-f0-9]{16})\.jpg$/.exec(url);
  if (am) {
    return fs.readFile(path.join(AV_DIR, am[1] + ".jpg"), (err, buf) => {
      if (err) return text(res, 404, "Not found");
      reply(res, 200, { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable", "content-security-policy": "default-src 'none'; sandbox" }, buf);
    });
  }
  if (url === "/api/scores") {
    const matches = Object.entries(db).filter(([k]) => k.startsWith("matches/")).map(([, v]) => v);
    return reply(res, 200, { "content-type": "application/json", "cache-control": "no-store" }, JSON.stringify(matches));
  }
  text(res, 404, "Not found");
});
function avatarUpload(req, res) {
  let sent = false;
  const fail = (code, msg) => { if (sent) return; sent = true; res.setHeader("connection", "close"); text(res, code, msg); req.resume(); };
  if (!originOk(req)) return fail(403, "Cross-site uploads are not allowed");
  if (!avAllowed(ipOf(req))) return fail(429, "Too many uploads");
  if (+req.headers["content-length"] > MAX_AVATAR_BYTES) return fail(413, "Photo too large");
  const chunks = []; let size = 0;
  req.on("error", () => { sent = true; });
  req.on("data", (d) => { if (sent) return; size += d.length; if (size > MAX_AVATAR_BYTES) { chunks.length = 0; fail(413, "Photo too large"); } else chunks.push(d); });
  req.on("end", () => {
    if (sent) return;
    const buf = Buffer.concat(chunks), n = buf.length;
    // a complete JPEG: starts with the SOI marker and ends with EOI
    if (n < 100 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff || buf[n - 2] !== 0xff || buf[n - 1] !== 0xd9) return fail(400, "JPEG only");
    const id = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16), file = path.join(AV_DIR, id + ".jpg");
    const ok = () => { sent = true; reply(res, 200, { "content-type": "application/json", "cache-control": "no-store" }, JSON.stringify({ id })); };
    fs.access(file, (missing) => {
      if (!missing) return ok();            // same photo uploaded before
      if (avCount >= MAX_AVATARS) return fail(507, "Photo storage is full");
      fs.writeFile(file, buf, { flag: "wx" }, (err) => {
        if (err && err.code !== "EEXIST") return fail(500, "Save failed");
        if (!err) avCount++;
        ok();
      });
    });
  });
}
server.requestTimeout = 30000; server.headersTimeout = 15000;
server.on("clientError", (err, socket) => { try { socket.destroy(); } catch (e) {} });

// ---------- live room + scoreboard over WebSocket ----------
const clients = new Map(); // ws -> {peer, by, presence, subs: Map, ...}
const perIp = new Map();   // ip -> open sockets
const retired = new Map(); // peer -> {tok, until}: seats that a reconnecting browser may take back
const wss = new WebSocketServer({
  server, path: "/ws", maxPayload: 128 * 1024,
  verifyClient(info, cb) {
    if (!originOk(info.req)) { console.warn("Refused a connection from another site:", info.req.headers.origin, "(set ALLOWED_ORIGINS or ORIGIN_CHECK=off if this is your own proxy)"); return cb(false, 403, "Forbidden"); }
    if (clients.size >= MAX_CLIENTS || (perIp.get(ipOf(info.req)) || 0) >= MAX_PER_IP) return cb(false, 503, "Server full");
    cb(true);
  },
});
wss.on("error", (e) => console.error("WebSocket server error:", e.message));
function rawSend(ws, s) {
  if (ws.readyState !== 1) return;
  // a browser that has stopped reading would otherwise pile messages up in memory; it reconnects and resyncs
  if (ws.bufferedAmount > MAX_BUFFERED) { try { ws.terminate(); } catch (e) {} return; }
  try { ws.send(s); } catch (e) {}
}
function send(ws, m) { rawSend(ws, JSON.stringify(m)); }
function broadcast(m, except) { const s = JSON.stringify(m); for (const [ws, c] of clients) if (ws !== except && c.hello) rawSend(ws, s); }
function colList(prefix) {
  const pre = prefix + "/";
  let list = Object.keys(db).filter(k => k.startsWith(pre) && !k.slice(pre.length).includes("/")).map(k => ({ path: k, data: db[k] }));
  if (prefix === "matches" && list.length > MATCH_FEED) list = list.sort((a, b) => ((b.data && b.data.at) || 0) - ((a.data && a.data.at) || 0)).slice(0, MATCH_FEED);
  return list;
}
function notify(docPath) {
  const parent = docPath.slice(0, docPath.lastIndexOf("/"));
  let col = null;
  for (const [ws, c] of clients) for (const [id, s] of c.subs) {
    if (s.kind === "doc" && s.path === docPath) send(ws, { t: "db", id, data: db[docPath] ?? null });
    else if (s.kind === "col" && s.path === parent) send(ws, { t: "db", id, data: col || (col = colList(parent)) });
  }
}
const sameTok = (a, b) => typeof a === "string" && typeof b === "string" && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
function onMessage(ws, c, raw) {
  // message budget: a normal game sends well under 60 a second
  const nowT = Date.now(); c.tokens = Math.min(MSG_BURST, c.tokens + (nowT - c.lastT) * MSG_PER_SEC / 1000); c.lastT = nowT;
  if (c.tokens < 1) { if (++c.dropped > 3000) { try { ws.close(1008, "Too many messages"); } catch (e) {} } return; }
  c.tokens -= 1;
  let m; try { m = JSON.parse(raw); } catch (e) { return; }
  if (!m || typeof m !== "object" || typeof m.t !== "string") return;
  if (m.t === "hello") {
    if (c.hello) return;
    c.by = typeof m.uid === "string" && UID.test(m.uid) ? m.uid : null;
    c.tok = typeof m.tok === "string" && m.tok.length >= 16 && m.tok.length <= 64 ? m.tok : null;
    // reconnecting after a network blip: take the old seat back so a match in progress carries on
    if (c.tok && typeof m.peer === "string" && /^[a-f0-9]{16}$/.test(m.peer)) {
      let ok = false;
      const r = retired.get(m.peer);
      if (r && r.until > nowT && sameTok(r.tok, c.tok)) { ok = true; retired.delete(m.peer); }
      else for (const [o, oc] of clients) if (o !== ws && oc.peer === m.peer && sameTok(oc.tok, c.tok)) { ok = true; oc.replaced = true; try { o.terminate(); } catch (e) {} }
      if (ok) c.peer = m.peer;
    }
    c.hello = true;
    const peers = [];
    for (const [o, oc] of clients) if (o !== ws && oc.hello && !oc.replaced) peers.push({ peer: oc.peer, by: oc.by, presence: oc.presence });
    send(ws, { t: "welcome", peer: c.peer, peers });
    broadcast({ t: "p", peer: c.peer, by: c.by, presence: c.presence }, ws);
  } else if (m.t === "p") {
    if (!c.hello || !m.presence || typeof m.presence !== "object" || Array.isArray(m.presence)) return;
    if (Buffer.byteLength(typeof raw === "string" ? raw : raw.toString()) > MAX_PRESENCE + 64) return;
    c.presence = m.presence;
    broadcast({ t: "p", peer: c.peer, by: c.by, presence: c.presence }, ws);
  } else if (m.t === "sub") {
    if (typeof m.id !== "string" || m.id.length > 24 || typeof m.path !== "string" || !SUB_PATH.test(m.path)) return;
    if (!c.subs.has(m.id) && c.subs.size >= MAX_SUBS) return;
    const kind = m.kind === "doc" ? "doc" : "col";
    c.subs.set(m.id, { path: m.path, kind });
    send(ws, { t: "db", id: m.id, data: kind === "doc" ? (db[m.path] ?? null) : colList(m.path) });
  } else if (m.t === "unsub") {
    if (typeof m.id === "string") c.subs.delete(m.id);
  } else if (m.t === "set" || m.t === "update") {
    // records can be added, never deleted or rewritten by a browser
    if (!c.hello || typeof m.path !== "string" || !ALLOWED.test(m.path)) return;
    const [col, id] = m.path.split("/");
    if (col === "matches") {
      // append-only, and only from the browser that is hosting that game right now
      if (m.t !== "set" || db[m.path]) return;
      const h = c.presence && c.presence.h, doc = cleanMatch(m.data);
      if (!doc || !h || typeof h !== "object" || h.game !== doc.g) return;
      if (nowT - c.lastMatch < MATCH_GAP_MS) return;
      c.lastMatch = nowT; db[m.path] = doc; pruneMatches();
    } else {
      // your own profile only
      if (!c.by || id !== c.by) return;
      const doc = cleanPlayer(m.data); if (!doc) return;
      if (!db[m.path] && count("players/") >= MAX_PLAYERS) return;
      db[m.path] = doc;
    }
    persist(); notify(m.path);
  }
}
wss.on("connection", (ws, req) => {
  const ip = ipOf(req); perIp.set(ip, (perIp.get(ip) || 0) + 1);
  const c = { peer: crypto.randomBytes(8).toString("hex"), by: null, tok: null, presence: {}, subs: new Map(), hello: false, replaced: false, tokens: MSG_BURST, lastT: Date.now(), dropped: 0, lastMatch: 0 };
  clients.set(ws, c);
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));
  // without this listener a malformed or oversized frame would take the whole server down
  ws.on("error", () => { try { ws.terminate(); } catch (e) {} });
  ws.on("message", (raw, isBinary) => { if (isBinary) return; try { onMessage(ws, c, raw.toString()); } catch (e) { console.error("Bad message ignored:", e.message); } });
  ws.on("close", () => {
    clients.delete(ws);
    const n = (perIp.get(ip) || 1) - 1; if (n > 0) perIp.set(ip, n); else perIp.delete(ip);
    if (!c.hello || c.replaced) return;
    if (c.tok) retired.set(c.peer, { tok: c.tok, until: Date.now() + RESUME_MS });
    broadcast({ t: "left", peer: c.peer });
  });
});
setInterval(() => {
  for (const ws of clients.keys()) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch (e) {} }
  const nowT = Date.now(); for (const [k, r] of retired) if (r.until < nowT) retired.delete(k);
}, 15000);
server.listen(PORT, () => console.log("Neteam Friday Arcade on http://0.0.0.0:" + PORT));
function shutdown() { clearTimeout(saveT); try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch (e) {} process.exit(0); }
process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
