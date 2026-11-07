// Neteam Friday Arcade server: serves the game, relays live presence between players,
// and keeps the scoreboard in a JSON file (DATA_DIR/arcade-db.json).
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
const MAX_DOC = 16 * 1024, MAX_PRESENCE = 32 * 1024;

fs.mkdirSync(DATA_DIR, { recursive: true });
let db = {};
try { db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); console.log("Loaded", Object.keys(db).length, "records from", DB_FILE); }
catch (e) { if (e.code !== "ENOENT") console.error("Could not read db:", e.message); }
let saveT = null;
function persist() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    const tmp = DB_FILE + ".tmp";
    fs.writeFile(tmp, JSON.stringify(db), (err) => {
      if (err) return console.error("Save failed:", err.message);
      fs.rename(tmp, DB_FILE, (e2) => e2 && console.error("Save failed:", e2.message));
    });
  }, 300);
}

const AV_DIR = path.join(DATA_DIR, "avatars");
fs.mkdirSync(AV_DIR, { recursive: true });
const avHits = new Map(); // ip -> [timestamps]
function avAllowed(ip) {
  const nowT = Date.now(), list = (avHits.get(ip) || []).filter(t => nowT - t < 10 * 60 * 1000);
  if (list.length >= 30) { avHits.set(ip, list); return false; }
  list.push(nowT); avHits.set(ip, list); return true;
}
const indexHtml = () => fs.readFileSync(path.join(PUBLIC, "index.html"));
const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (url === "/health") { res.writeHead(200, { "content-type": "text/plain" }); return res.end("ok"); }
  if (url === "/" || url === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
    return res.end(indexHtml());
  }
  if (url.startsWith("/vendor/") && /^\/vendor\/[a-z0-9._-]+\.js$/i.test(url)) {
    const f = path.join(PUBLIC, url);
    return fs.readFile(f, (err, buf) => {
      if (err) { res.writeHead(404); return res.end("Not found"); }
      res.writeHead(200, { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=604800" });
      res.end(buf);
    });
  }
  if (url === "/api/avatar" && req.method === "POST") {
    if (!avAllowed(req.socket.remoteAddress || "")) { res.writeHead(429); return res.end("Too many uploads"); }
    const chunks = []; let size = 0, tooBig = false;
    req.on("data", (d) => { size += d.length; if (size > 256 * 1024) { tooBig = true; req.destroy(); } else chunks.push(d); });
    req.on("end", () => {
      if (tooBig) return;
      const buf = Buffer.concat(chunks);
      if (buf.length < 100 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) { res.writeHead(400, { "content-type": "text/plain" }); return res.end("JPEG only"); }
      const id = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
      fs.writeFile(path.join(AV_DIR, id + ".jpg"), buf, (err) => {
        if (err) { res.writeHead(500); return res.end("Save failed"); }
        res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ id }));
      });
    });
    return;
  }
  const am = /^\/api\/avatar\/([a-f0-9]{16})\.jpg$/.exec(url);
  if (am && req.method === "GET") {
    return fs.readFile(path.join(AV_DIR, am[1] + ".jpg"), (err, buf) => {
      if (err) { res.writeHead(404); return res.end("Not found"); }
      res.writeHead(200, { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" });
      res.end(buf);
    });
  }
  if (url === "/api/scores" && req.method === "GET") {
    const matches = Object.entries(db).filter(([k]) => k.startsWith("matches/")).map(([, v]) => v);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(matches));
  }
  res.writeHead(404, { "content-type": "text/plain" }); res.end("Not found");
});

const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 128 * 1024 });
const clients = new Map(); // ws -> {peer, by, presence, subs: Map}
function send(ws, m) { if (ws.readyState === 1) ws.send(JSON.stringify(m)); }
function broadcast(m, except) { const s = JSON.stringify(m); for (const ws of clients.keys()) if (ws !== except && ws.readyState === 1) ws.send(s); }
function colList(prefix) {
  const pre = prefix + "/";
  return Object.keys(db).filter(k => k.startsWith(pre) && !k.slice(pre.length).includes("/")).map(k => ({ path: k, data: db[k] }));
}
function notify(docPath) {
  const parent = docPath.slice(0, docPath.lastIndexOf("/"));
  for (const [ws, c] of clients) for (const [id, s] of c.subs) {
    if (s.kind === "doc" && s.path === docPath) send(ws, { t: "db", id, data: db[docPath] ?? null });
    else if (s.kind === "col" && s.path === parent) send(ws, { t: "db", id, data: colList(parent) });
  }
}
wss.on("connection", (ws) => {
  const c = { peer: crypto.randomBytes(8).toString("hex"), by: null, presence: {}, subs: new Map(), hello: false };
  clients.set(ws, c);
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));
  ws.on("message", (raw) => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m.t !== "string") return;
    if (m.t === "hello") {
      c.by = typeof m.uid === "string" ? m.uid.slice(0, 80) : null;
      c.hello = true;
      const peers = [];
      for (const [o, oc] of clients) if (o !== ws && oc.hello) peers.push({ peer: oc.peer, by: oc.by, presence: oc.presence });
      send(ws, { t: "welcome", peer: c.peer, peers });
      broadcast({ t: "p", peer: c.peer, by: c.by, presence: c.presence }, ws);
    } else if (m.t === "p") {
      if (!c.hello || !m.presence || typeof m.presence !== "object") return;
      if (Buffer.byteLength(JSON.stringify(m.presence)) > MAX_PRESENCE) return;
      c.presence = m.presence;
      broadcast({ t: "p", peer: c.peer, by: c.by, presence: c.presence }, ws);
    } else if (m.t === "sub") {
      if (typeof m.id !== "string" || typeof m.path !== "string") return;
      c.subs.set(m.id, { path: m.path, kind: m.kind === "doc" ? "doc" : "col" });
      send(ws, { t: "db", id: m.id, data: m.kind === "doc" ? (db[m.path] ?? null) : colList(m.path) });
    } else if (m.t === "unsub") {
      c.subs.delete(m.id);
    } else if (m.t === "set" || m.t === "update" || m.t === "del") {
      if (typeof m.path !== "string" || !ALLOWED.test(m.path)) return;
      if (m.t === "del") { delete db[m.path]; }
      else {
        if (!m.data || typeof m.data !== "object" || Buffer.byteLength(JSON.stringify(m.data)) > MAX_DOC) return;
        db[m.path] = m.t === "update" ? Object.assign({}, db[m.path] || {}, m.data) : m.data;
      }
      persist(); notify(m.path);
    }
  });
  ws.on("close", () => { clients.delete(ws); if (c.hello) broadcast({ t: "left", peer: c.peer }); });
});
setInterval(() => { for (const ws of clients.keys()) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); } }, 15000);
server.listen(PORT, () => console.log("Neteam Friday Arcade on http://0.0.0.0:" + PORT));
function shutdown() { clearTimeout(saveT); try { fs.writeFileSync(DB_FILE, JSON.stringify(db)); } catch (e) {} process.exit(0); }
process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
