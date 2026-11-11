// ---------- networking: claude.ai room/db/user, with a same-browser fallback ----------
// Inside the claude.ai viewer we use the platform's live room (presence) and shared db.
// Opened anywhere else (a saved copy, local testing) a BroadcastChannel stand-in lets
// several tabs in one browser play together, and scores are kept in localStorage.
function makeLocalRoom() {
  const myPeer = "t" + randId(12);
  let uid = sstore("nfa-local-uid"); if (!uid) { uid = "local-" + randId(8); sstore("nfa-local-uid", uid); }
  let ch = null; try { ch = new BroadcastChannel("nfa-room-v1"); } catch (e) { ch = null; }
  const peers = new Map();
  let mine = {};
  const handlers = new Set();
  let snap = Object.freeze([]);
  let pend = { joined: [], left: [], updated: [] }, sched = false;
  function mk(peer, by, presence, isMe) {
    return Object.freeze({ peer, by, isMe, sameTab: isMe, kind: "viewer", guest: false, presence: Object.freeze(presence), updatedAt: Date.now() });
  }
  function flush() {
    sched = false;
    snap = Object.freeze(Array.from(peers.values()).map(v => v.p));
    const ch = { peers: snap, joined: pend.joined, left: pend.left, updated: pend.updated };
    pend = { joined: [], left: [], updated: [] };
    handlers.forEach(h => { try { h(ch); } catch (e) { console.error(e); } });
  }
  function notify() { if (!sched) { sched = true; setTimeout(flush, 0); } }
  function upsert(peer, by, presence, isMe) {
    const had = peers.get(peer);
    const p = mk(peer, by, presence, isMe);
    peers.set(peer, { p, seen: Date.now() });
    (had ? pend.updated : pend.joined).push(p);
    notify();
  }
  upsert(myPeer, uid, {}, true);
  let lastSend = 0, sendT = 0;
  function send() {
    if (!ch) return;
    const n = Date.now();
    if (n - lastSend < 30) { if (!sendT) sendT = setTimeout(() => { sendT = 0; send(); }, 30); return; }
    lastSend = n;
    ch.postMessage({ t: "p", peer: myPeer, by: uid, presence: mine });
  }
  if (ch) {
    ch.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.t === "p" && m.peer && m.peer !== myPeer) upsert(m.peer, m.by || null, m.presence || {}, false);
      else if (m.t === "bye" && peers.has(m.peer)) { pend.left.push(peers.get(m.peer).p); peers.delete(m.peer); notify(); }
      else if (m.t === "hello" && m.peer !== myPeer) send();
    };
    ch.postMessage({ t: "hello", peer: myPeer });
    setInterval(() => {
      ch.postMessage({ t: "p", peer: myPeer, by: uid, presence: mine });
      const n = Date.now();
      for (const [k, v] of peers) if (k !== myPeer && n - v.seen > 4000) { pend.left.push(v.p); peers.delete(k); notify(); }
    }, 1000);
    addEventListener("pagehide", () => { try { ch.postMessage({ t: "bye", peer: myPeer }); } catch (e) {} });
  }
  return {
    local: true, solo: !ch, uid,
    presence(patch) {
      const m = Object.assign({}, mine);
      for (const k in patch) { if (patch[k] === null) delete m[k]; else m[k] = patch[k]; }
      mine = JSON.parse(JSON.stringify(m));
      upsert(myPeer, uid, mine, true);
      send();
      return Promise.resolve();
    },
    peers() { return snap; },
    onPeers(fn) { handlers.add(fn); setTimeout(() => fn({ peers: snap, joined: snap, left: [], updated: [] }), 0); return () => handlers.delete(fn); },
    connected() { return true; },
    onConnection(fn) { setTimeout(() => fn(true), 0); return () => {}; },
    emit() { return Promise.resolve(); },
    on() { return () => {}; },
  };
}
function makeLocalDb() {
  const KEY = "nfa-local-db";
  let ch = null; try { ch = new BroadcastChannel("nfa-db-v1"); } catch (e) {}
  const listeners = new Set();
  const read = () => store(KEY) || {};
  const write = (d) => { store(KEY, d); listeners.forEach(f => f()); if (ch) ch.postMessage(1); };
  if (ch) ch.onmessage = () => listeners.forEach(f => f());
  const docSnap = (path, data) => ({ id: path.split("/").pop(), exists: data != null, data: () => data == null ? undefined : JSON.parse(JSON.stringify(data)), metadata: { fromCache: false, hasPendingWrites: false } });
  function doc(path) {
    return {
      id: path.split("/").pop(), path,
      get: async () => docSnap(path, read()[path]),
      set: async (data) => { const d = read(); d[path] = data; write(d); },
      update: async (data) => { const d = read(); d[path] = Object.assign({}, d[path] || {}, data); write(d); },
      delete: async () => { const d = read(); delete d[path]; write(d); },
      onSnapshot(next) { const f = () => next(docSnap(path, read()[path])); listeners.add(f); setTimeout(f, 0); return () => listeners.delete(f); },
    };
  }
  function collection(path) {
    const q = {
      path,
      where() { return q; }, orderBy() { return q; }, limit() { return q; },
      doc: (id) => doc(path + "/" + (id || randId(16))),
      add: async (data) => { const r = doc(path + "/" + randId(16)); await r.set(data); return r; },
      get: async () => snapOf(),
      onSnapshot(next) { const f = () => next(snapOf()); listeners.add(f); setTimeout(f, 0); return () => listeners.delete(f); },
    };
    function snapOf() {
      const d = read(), pre = path + "/";
      const docs = Object.keys(d).filter(k => k.startsWith(pre) && !k.slice(pre.length).includes("/")).map(k => docSnap(k, d[k]));
      return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } };
    }
    return q;
  }
  return { local: true, doc, collection };
}

// a strip across the top of the page while the arcade server can't be reached (null hides it)
function netBanner(text) {
  let el = document.getElementById("netBanner");
  if (!text) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("div"); el.id = "netBanner"; el.setAttribute("role", "status"); el.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:200;padding:9px 16px;text-align:center;background:#3a2414;color:#ffd9bf;border-bottom:1px solid #ff8a3d;font:500 14px/1.4 Inter,system-ui,sans-serif"; document.body.append(el); }
  el.textContent = text;
}
// ---------- self-hosted server backend (Docker) ----------
function connectServer(timeoutMs = 2500) {
  return new Promise((resolve) => {
    let ws;
    try { ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws"); }
    catch (e) { resolve(null); return; }
    const t = setTimeout(() => { try { ws.close(); } catch (e) {} resolve(null); }, timeoutMs);
    ws.onopen = () => { clearTimeout(t); resolve(ws); };
    ws.onerror = () => { clearTimeout(t); resolve(null); };
  });
}
function makeServerBackend(firstWs) {
  let uid = store("nfa-uid"); if (!uid) { uid = "u-" + randId(14); store("nfa-uid", uid); }
  let ws = firstWs, myPeer = null, mine = {}, isOpen = false;
  // a secret for this page load: lets us take our seat back (same peer id) after a network blip,
  // so a match in progress carries on instead of dropping us
  const tok = (() => { try { return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join(""); } catch (e) { return randId(16) + randId(16); } })();
  // scoreboard writes made while the connection is down wait here and go out when it is back
  const outbox = [];
  function write(m) { if (ws && ws.readyState === 1 && isOpen) ws.send(JSON.stringify(m)); else { outbox.push(m); if (outbox.length > 40) outbox.shift(); } }
  // match saves wait for the server's answer: resolved when it was stored, rejected when it was refused
  const acks = new Map();
  function writeAck(m) { return new Promise((res, rej) => { const t = setTimeout(() => { acks.delete(m.path); rej(new Error("no answer")); }, 30000); acks.set(m.path, (ok) => { clearTimeout(t); acks.delete(m.path); ok ? res() : rej(new Error("refused")); }); write(m); }); }
  const peers = new Map();
  const handlers = new Set(), connHandlers = new Set();
  let snap = Object.freeze([]), pend = { joined: [], left: [], updated: [] }, sched = false;
  const subs = new Map(); // id -> {path, kind, cb}
  let subSeq = 0;
  function flush() {
    sched = false;
    snap = Object.freeze(Array.from(peers.values()));
    const ch = { peers: snap, joined: pend.joined, left: pend.left, updated: pend.updated };
    pend = { joined: [], left: [], updated: [] };
    handlers.forEach(h => { try { h(ch); } catch (e) { console.error(e); } });
  }
  function notify() { if (!sched) { sched = true; requestAnimationFrame ? setTimeout(flush, 0) : flush(); } }
  function upsert(peer, by, presence) {
    const isMe = peer === myPeer;
    const had = peers.has(peer);
    const p = Object.freeze({ peer, by, isMe, sameTab: isMe, kind: "viewer", guest: false, presence: Object.freeze(presence || {}), updatedAt: Date.now() });
    peers.set(peer, p);
    (had ? pend.updated : pend.joined).push(p);
    notify();
  }
  function send(m) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); }
  let lastP = 0, pT = 0;
  function sendPresence() {
    const n = Date.now();
    if (n - lastP < 33) { if (!pT) pT = setTimeout(() => { pT = 0; sendPresence(); }, 34); return; }
    lastP = n; send({ t: "p", presence: mine });
  }
  function attach(sock) {
    ws = sock;
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === "welcome") {
        myPeer = m.peer; isOpen = true;
        // after a reconnect only the people who really went away count as left (no flicker for everyone else)
        const back = new Set((m.peers || []).map(x => x.peer));
        for (const [k, p] of peers) if (k !== myPeer && !back.has(k)) { pend.left.push(p); peers.delete(k); }
        peers.delete(myPeer);
        upsert(myPeer, uid, mine);
        (m.peers || []).forEach(x => { if (x.peer !== myPeer) upsert(x.peer, x.by, x.presence); });
        send({ t: "p", presence: mine });
        for (const [id, s] of subs) send({ t: "sub", id, path: s.path, kind: s.kind });
        while (outbox.length) send(outbox.shift());
        connHandlers.forEach(f => f(true));
      } else if (m.t === "p") { if (m.peer !== myPeer) upsert(m.peer, m.by, m.presence); }
      else if (m.t === "left") { const p = peers.get(m.peer); if (p) { pend.left.push(p); peers.delete(m.peer); notify(); } }
      else if (m.t === "ack") { const f = acks.get(m.path); if (f) f(!!m.ok); }
      else if (m.t === "db") { const s = subs.get(m.id); if (s) s.cb(m.data); }
    };
    ws.onclose = () => {
      isOpen = false; connHandlers.forEach(f => f(false));
      const retry = () => setTimeout(async () => { const s = await connectServer(4000); if (s) attach(s); else retry(); }, 1500);
      retry();
    };
    ws.send(JSON.stringify(myPeer ? { t: "hello", uid, tok, peer: myPeer } : { t: "hello", uid, tok }));
  }
  const room = {
    server: true, uid,
    presence(patch) {
      const m = Object.assign({}, mine);
      for (const k in patch) { if (patch[k] === null) delete m[k]; else m[k] = patch[k]; }
      mine = JSON.parse(JSON.stringify(m));
      if (myPeer) upsert(myPeer, uid, mine);
      sendPresence();
      return Promise.resolve();
    },
    peers() { return snap; },
    onPeers(fn) { handlers.add(fn); setTimeout(() => fn({ peers: snap, joined: snap, left: [], updated: [] }), 0); return () => handlers.delete(fn); },
    connected() { return isOpen; },
    onConnection(fn) { connHandlers.add(fn); setTimeout(() => fn(isOpen), 0); return () => connHandlers.delete(fn); },
    emit() { return Promise.resolve(); }, on() { return () => {}; },
  };
  const docSnap = (path, data) => ({ id: path.split("/").pop(), exists: data != null, data: () => data == null ? undefined : data, metadata: { fromCache: false, hasPendingWrites: false } });
  function subscribe(path, kind, cb) { const id = "s" + (++subSeq); subs.set(id, { path, kind, cb }); send({ t: "sub", id, path, kind }); return () => { subs.delete(id); send({ t: "unsub", id }); }; }
  function doc(path) {
    return {
      id: path.split("/").pop(), path,
      get: () => new Promise((res) => { const un = subscribe(path, "doc", (d) => { un(); res(docSnap(path, d)); }); }),
      set: async (data) => path.startsWith("matches/") ? writeAck({ t: "set", path, data }) : write({ t: "set", path, data }),
      update: async (data) => write({ t: "update", path, data }),
      delete: async () => {}, // the server keeps records append-only
      onSnapshot(next) { return subscribe(path, "doc", (d) => next(docSnap(path, d))); },
    };
  }
  function collection(path) {
    const q = {
      path, where() { return q; }, orderBy() { return q; }, limit() { return q; },
      doc: (id) => doc(path + "/" + (id || randId(16))),
      add: async (data) => { const r = doc(path + "/" + Date.now().toString(36) + randId(6)); await r.set(data); return r; },
      onSnapshot(next) {
        return subscribe(path, "col", (list) => {
          const docs = (list || []).map(x => docSnap(x.path, x.data));
          next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } });
        });
      },
    };
    return q;
  }
  attach(firstWs);
  return { room, db: { server: true, doc, collection }, uid };
}

const NET = {
  room: null, db: null, user: null, local: false, uid: null, myPeer: null, canWrite: true,
  async init() {
    const hasClaude = !!(window.claude && typeof window.claude.use === "function");
    let room = null, db = null, user = null;
    if (hasClaude) {
      const get = (n) => window.claude.use(n).catch(() => null);
      [room, db, user] = await Promise.all([get("room"), get("db"), get("user")]);
    }
    this.user = user;
    if (!hasClaude && /^https?:$/.test(location.protocol)) {
      // a slow or restarting server must not drop anyone into a lonely offline mode: keep trying for about half a minute
      let sock = null;
      for (let k = 0; k < 7 && !sock; k++) {
        if (k) { netBanner("Can't reach the arcade server yet. Retrying\u2026"); await new Promise(r => setTimeout(r, 1500)); }
        sock = await connectServer(k ? 4000 : 2500);
      }
      netBanner(sock ? null : "Couldn't reach the arcade server, so this is offline mode: only this browser can play. Reload the page to try again.");
      if (sock) { const b = makeServerBackend(sock); this.server = true; this.room = b.room; this.db = b.db; this.uid = b.uid; return this; }
    }
    if (room) { this.room = room; }
    else { this.room = makeLocalRoom(); this.local = true; }
    if (db) this.db = db; else { this.db = makeLocalDb(); this.dbLocal = true; }
    if (user) {
      try { this.uid = await user.id(); } catch (e) {}
      try { const c = await user.can("data.write"); if (c === false) this.canWrite = false; } catch (e) {}
    }
    if (!this.uid) this.uid = this.room.uid || store("nfa-uid") || (() => { const u = "anon-" + randId(10); store("nfa-uid", u); return u; })();
    return this;
  },
  myPeerLabel() {
    const me = this.room.peers().find(p => p.sameTab);
    return me ? me.peer : null;
  },
};
