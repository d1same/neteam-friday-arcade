// ======================= NX decals: signs, screens, posters, rack fronts and floor paint =======================
// The world generator only records what each picture is ({k: kind, ...} and its place in the atlas); this paints them all
// into one canvas when a map loads. Lit pictures (screens, LEDs, signs) and painted ones share the atlas.
const NXD = {
  FONT: (w, px, f) => w + " " + px + "px " + (f === 2 ? "Inter, 'Segoe UI', Arial, sans-serif" : "'Chakra Petch', 'Arial Narrow', Arial, sans-serif"),
  ready() { // the web fonts may still be loading (or blocked on an offline LAN): wait a moment, then paint with what there is
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([Promise.all([document.fonts.load("700 32px 'Chakra Petch'"), document.fonts.load("600 20px Inter")]).catch(() => 0), new Promise(r => setTimeout(r, 1500))]);
  },
  paint(W) {
    const A = W.dAtlas, cv = document.createElement("canvas"); cv.width = A.w; cv.height = A.h; const x = cv.getContext("2d");
    for (const d of W.decals) {
      const [sx, sy, w, h] = d.s, fn = NXD["k_" + d.k]; if (!fn) continue;
      x.save(); x.beginPath(); x.rect(sx, sy, w, h); x.clip(); x.translate(sx, sy);
      try { fn(x, w, h, d, NXW.rng(NXW.strSeed(JSON.stringify([d.k, d.sd, d.v, d.t, d.n, d.col, d.l])) || 7)); } catch (e) { console.warn("[nx] decal", d.k, e && e.message); }
      x.restore();
    }
    // stretch the border pixels into the gutters so mip-mapping never pulls in a neighbour
    const P = A.pad || 0;
    if (P) for (const d of W.decals) { const [sx, sy, w, h] = d.s; x.drawImage(cv, sx, sy, 1, h, sx - P, sy, P, h); x.drawImage(cv, sx + w - 1, sy, 1, h, sx + w, sy, P, h); x.drawImage(cv, sx - P, sy, w + 2 * P, 1, sx - P, sy - P, w + 2 * P, P); x.drawImage(cv, sx - P, sy + h - 1, w + 2 * P, 1, sx - P, sy + h, w + 2 * P, P); }
    return cv;
  },
  fit(x, txt, maxW, px, w, f) { for (let i = 0; i < 40; i++) { x.font = NXD.FONT(w, Math.round(px), f); if (x.measureText(txt).width <= maxW || px < 6) break; px *= 0.94; } return px; },
  // scratches and missing flecks for paint on the floor
  wear(x, w, h, r, n) { x.save(); x.globalCompositeOperation = "destination-out"; for (let i = 0; i < n; i++) { const px = r() * w, py = r() * h, s = 1 + r() * r() * Math.max(w, h) * 0.035; x.globalAlpha = 0.25 + r() * 0.6; x.beginPath(); x.ellipse(px, py, s, s * (0.3 + r() * 0.7), r() * 3.14, 0, 6.3); x.fill(); } x.globalAlpha = 0.5; x.lineWidth = 1; for (let i = 0; i < n / 3; i++) { const px = r() * w, py = r() * h, a = r() * 6.3, l = 4 + r() * Math.max(w, h) * 0.2; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); } x.restore(); },

  // ---- server rack front, 42 units of switches, servers and storage with their status lights
  k_rack(x, w, h, d, r) {
    const led = d.col ? ["#3ddc97", "#8dffc6"] : ["#35c3f2", "#a6ecff"], U = h / 43;
    x.fillStyle = "#050607"; x.fillRect(0, 0, w, h); x.fillStyle = "#0e1013"; x.fillRect(0, 0, w * 0.07, h); x.fillRect(w * 0.93, 0, w * 0.07, h);
    const dot = (px, py, s, c, glow) => { if (glow) { x.fillStyle = c[0]; x.globalAlpha = 0.35; x.fillRect(px - s, py - s, s * 3, s * 3); x.globalAlpha = 1; } x.fillStyle = c[1]; x.fillRect(px, py, s, s); };
    let y = U * 0.5; const x0 = w * 0.09, bw = w * 0.82, s = Math.max(1, w / 54);
    while (y < h - U * 1.5) {
      const k = r(), units = k < 0.34 ? 1 : k < 0.72 ? 2 : k < 0.86 ? 4 : 1, bh = units * U - 1; if (y + bh > h - U * 0.5) break;
      if (k < 0.34) { // switch: two rows of ports with link lights
        x.fillStyle = "#14171b"; x.fillRect(x0, y, bw, bh); x.fillStyle = "#07080a";
        for (let p = 0; p < 16; p++) { const px = x0 + bw * 0.08 + p * bw * 0.052; x.fillRect(px, y + bh * 0.22, bw * 0.036, bh * 0.56); if (r() < 0.72) dot(px + bw * 0.008, y + bh * 0.06, s, r() < 0.08 ? ["#ffb020", "#ffd27a"] : led, true); }
        x.fillStyle = "#23272d"; x.fillRect(x0 + bw * 0.01, y + bh * 0.2, bw * 0.04, bh * 0.6);
      } else if (k < 0.72) { // 2U server: handles, drive bays, mesh
        x.fillStyle = "#191c21"; x.fillRect(x0, y, bw, bh); x.fillStyle = "#0b0c0f"; x.fillRect(x0 + bw * 0.5, y + 2, bw * 0.47, bh - 4);
        x.fillStyle = "#101216"; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const px = x0 + bw * 0.05 + i * bw * 0.11, py = y + 2 + j * (bh - 4) / 2; x.fillRect(px, py, bw * 0.095, (bh - 5) / 2); if (r() < 0.85) dot(px + bw * 0.012, py + 1, s, r() < 0.06 ? ["#ff5a3c", "#ff9a86"] : led, r() < 0.5); }
        x.fillStyle = "#1f2329"; for (let i = 0; i < 9; i++) x.fillRect(x0 + bw * 0.52 + i * bw * 0.05, y + 3, 1, bh - 6);
        dot(x0 + bw * 0.455, y + bh * 0.42, s * 1.3, ["#3ddc97", "#b5ffd9"], true);
      } else if (k < 0.86) { // 4U storage shelf: three rows of bays
        x.fillStyle = "#16191d"; x.fillRect(x0, y, bw, bh);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const px = x0 + bw * 0.03 + i * bw * 0.158, py = y + 2 + j * (bh - 4) / 3; x.fillStyle = "#0c0e11"; x.fillRect(px, py, bw * 0.145, (bh - 6) / 3); x.fillStyle = "#1d2126"; x.fillRect(px + bw * 0.1, py + 1, bw * 0.03, (bh - 6) / 3 - 2); if (r() < 0.9) dot(px + bw * 0.01, py + 2, s, led, r() < 0.4); if (r() < 0.3) dot(px + bw * 0.035, py + 2, s, ["#ffb020", "#ffe0a0"], false); }
      } else { x.fillStyle = "#0b0c0f"; x.fillRect(x0, y, bw, bh); x.fillStyle = "#15171b"; x.fillRect(x0 + bw * 0.03, y + bh * 0.4, bw * 0.94, 1); }
      y += units * U;
    }
  },

  // ---- screens: six dashboards an IT company would leave running
  k_screen(x, w, h, d, r) {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#07111f"); g.addColorStop(1, "#0b1a2c"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const u = h / 100, C = { c: "#39c6f4", g: "#3ddc97", a: "#ffb020", r: "#ff5a5a", t: "#d9e6f2", m: "#5d7389" }, v = d.v | 0, big = h > 90;
    const text = (s, px, py, size, col, wt, al) => { x.font = NXD.FONT(wt || 600, Math.max(5, Math.round(size * u)), 2); x.fillStyle = col; x.textAlign = al || "left"; x.textBaseline = "middle"; x.fillText(s, px, py); };
    // header
    x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(0, 0, w, 11 * u); x.fillStyle = "#ff8a3d"; x.fillRect(2.5 * u, 3.5 * u, 4 * u, 4 * u);
    const titles = ["NETWORK STATUS", "DEPLOY · PROD", "GLOBAL LINKS", "SERVICE DESK", "UPTIME · 30 DAYS", ""]; if (big) text(titles[v], 9 * u, 5.8 * u, 5, C.t, 700); if (big) text("NETEAM NOC", w - 3 * u, 5.8 * u, 4, C.m, 600, "right");
    const X0 = 4 * u, Y0 = 16 * u, PW = w - 8 * u, PH = h - 21 * u;
    if (v === 0) { // line chart and tiles
      const cw = PW * 0.68; x.strokeStyle = "rgba(255,255,255,.07)"; x.lineWidth = 1; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(X0, Y0 + PH * i / 4); x.lineTo(X0 + cw, Y0 + PH * i / 4); x.stroke(); }
      for (const [col, base] of [[C.c, 0.45], [C.g, 0.7]]) { x.strokeStyle = col; x.lineWidth = Math.max(1, u * 0.9); x.shadowColor = col; x.shadowBlur = 3 * u; x.beginPath(); let yy = base; for (let i = 0; i <= 28; i++) { yy = Math.max(0.08, Math.min(0.92, yy + (r() - 0.5) * 0.17)); const px = X0 + cw * i / 28, py = Y0 + PH * yy; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); x.shadowBlur = 0; }
      [["LATENCY", "12 ms", C.c], ["PACKET LOSS", "0.0%", C.g], ["ALERTS", "2", C.a]].forEach(([a, b, col], i) => { const px = X0 + cw + 4 * u, py = Y0 + i * PH / 3, tw = PW - cw - 4 * u; x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(px, py, tw, PH / 3 - 3 * u); if (big) text(a, px + 2 * u, py + 5 * u, 3.6, C.m); text(b, px + 2 * u, py + (big ? 15 : 12) * u, big ? 9 : 12, col, 700); });
    } else if (v === 1) { // terminal
      x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(X0, Y0, PW, PH); const lh = PH / 13;
      for (let i = 0; i < 12; i++) { const ok = r() < 0.86, py = Y0 + lh * (i + 0.8); x.fillStyle = ok ? C.g : C.a; x.fillRect(X0 + 2 * u, py - lh * 0.22, 3 * u, lh * 0.44); x.fillStyle = i === 11 ? C.t : "rgba(190,215,235," + (0.35 + r() * 0.4) + ")"; let px = X0 + 7 * u; const n = 2 + Math.floor(r() * 4); for (let k = 0; k < n; k++) { const tw = (4 + r() * 16) * u; if (px + tw > X0 + PW - 3 * u) break; x.fillRect(px, py - lh * 0.16, tw, lh * 0.32); px += tw + 2 * u; } }
    } else if (v === 2) { // world of links: dots and arcs
      const pts = []; for (let i = 0; i < 230; i++) { const a = r(), b = r(), blob = Math.sin(a * 9 + 1) * Math.cos(b * 7 + 0.5) + Math.sin(a * 4 + b * 5); if (blob < 0.15) continue; x.fillStyle = "rgba(90,130,170,.55)"; x.fillRect(X0 + a * PW, Y0 + b * PH, Math.max(1, u * 0.9), Math.max(1, u * 0.9)); if (r() < 0.07) pts.push([X0 + a * PW, Y0 + b * PH]); }
      x.lineWidth = Math.max(1, u * 0.5); for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; x.strokeStyle = i % 3 ? C.c : C.g; x.globalAlpha = 0.8; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 14 * u, bx, by); x.stroke(); }
      x.globalAlpha = 1; pts.forEach(([px, py]) => { x.fillStyle = "#fff"; x.shadowColor = C.c; x.shadowBlur = 4 * u; x.beginPath(); x.arc(px, py, 1.3 * u, 0, 6.3); x.fill(); }); x.shadowBlur = 0;
    } else if (v === 3) { // ticket queue
      const rows = 7, rh = PH / rows; for (let i = 0; i < rows; i++) { const py = Y0 + i * rh, st = r(); x.fillStyle = i % 2 ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.06)"; x.fillRect(X0, py, PW, rh - u); const col = st < 0.6 ? C.g : st < 0.88 ? C.a : C.r; x.fillStyle = col; x.fillRect(X0 + 2 * u, py + rh * 0.25, 9 * u, rh * 0.45); x.fillStyle = "rgba(200,220,240,.55)"; x.fillRect(X0 + 14 * u, py + rh * 0.34, (20 + r() * 40) * u, rh * 0.26); x.fillStyle = "rgba(200,220,240,.25)"; x.fillRect(X0 + PW - 22 * u, py + rh * 0.34, 18 * u, rh * 0.26); }
    } else if (v === 4) { // uptime bars
      const n = 30, bw = PW / n; for (let i = 0; i < n; i++) { const q = r(), col = q < 0.9 ? C.g : q < 0.97 ? C.a : C.r, bh = PH * 0.42 * (0.75 + r() * 0.25); x.fillStyle = col; x.fillRect(X0 + i * bw + bw * 0.15, Y0 + PH - bh, bw * 0.7, bh); }
      text("99.98%", X0, Y0 + PH * 0.24, 24, C.t, 700); if (big) text("ALL SYSTEMS OPERATIONAL", X0 + PW, Y0 + PH * 0.24, 4.5, C.g, 600, "right");
    } else { // screen saver: the company mark
      const gg = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6); gg.addColorStop(0, "#12304a"); gg.addColorStop(1, "#060d18"); x.fillStyle = gg; x.fillRect(0, 0, w, h);
      x.fillStyle = "#ff8a3d"; x.fillRect(w / 2 - 30 * u, h / 2 - 14 * u, 7 * u, 7 * u); x.textAlign = "left"; x.textBaseline = "middle"; x.font = NXD.FONT(700, Math.round(15 * u)); x.fillStyle = "#f2f6fa"; x.fillText("NETEAM", w / 2 - 20 * u, h / 2 - 9 * u); x.font = NXD.FONT(500, Math.round(6 * u)); x.fillStyle = "#7fa2bf"; x.fillText("S O L U T I O N S", w / 2 - 20 * u, h / 2 + 6 * u);
    }
    // glass: faint diagonal sheen
    const sg = x.createLinearGradient(0, 0, w, h); sg.addColorStop(0, "rgba(255,255,255,.05)"); sg.addColorStop(0.5, "rgba(255,255,255,0)"); x.fillStyle = sg; x.fillRect(0, 0, w, h);
  },

  // ---- door plate: brushed aluminium, room number and name
  k_plate(x, w, h, d, r) {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#c9cdd2"); g.addColorStop(0.5, "#b3b8be"); g.addColorStop(1, "#c2c6cb"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.08; for (let i = 0; i < h; i += 2) { x.fillStyle = r() < 0.5 ? "#fff" : "#000"; x.fillRect(0, i, w, 1); } x.globalAlpha = 1;
    x.strokeStyle = "rgba(0,0,0,.35)"; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2);
    x.fillStyle = "#14161a"; x.textBaseline = "middle"; x.textAlign = "left"; x.font = NXD.FONT(700, Math.round(h * 0.5)); x.fillText(String(d.n || 100), w * 0.06, h * 0.4);
    const nw = x.measureText(String(d.n || 100)).width; x.fillStyle = "#ff8a3d"; x.fillRect(w * 0.06, h * 0.72, nw, h * 0.06);
    const px = NXD.fit(x, d.t || "", w * 0.88 - nw - w * 0.08, h * 0.26, 600, 2); x.font = NXD.FONT(600, Math.round(px), 2); x.fillStyle = "#23262b"; x.fillText(d.t || "", w * 0.06 + nw + w * 0.07, h * 0.42);
  },

  // ---- posters: three heavy lines, six colourways
  k_poster(x, w, h, d, r) {
    const S = [["#f1ece2", "#16181c", "#ff8a3d"], ["#12161f", "#f2ede2", "#39c6f4"], ["#ff8a3d", "#16181c", "#fff4e6"], ["#1c3558", "#f6f3ea", "#ffd23f"], ["#e7e3db", "#b8322a", "#16181c"], ["#0e2a24", "#e8f6ee", "#3ddc97"]][(d.v | 0) % 6], L = d.l || ["", "", ""];
    x.fillStyle = S[0]; x.fillRect(0, 0, w, h);
    // one bold shape per poster
    x.fillStyle = S[2]; const sh = (d.v | 0) % 3; if (sh === 0) { x.beginPath(); x.arc(w * 0.78, h * 0.2, w * 0.3, 0, 6.3); x.fill(); } else if (sh === 1) { x.beginPath(); x.moveTo(w, h * 0.62); x.lineTo(w, h * 0.86); x.lineTo(w * 0.52, h * 0.86); x.closePath(); x.fill(); x.fillRect(0, h * 0.86, w, h * 0.14); } else { x.fillRect(0, h * 0.86, w, h * 0.14); }
    x.fillStyle = S[1]; x.textAlign = "left"; x.textBaseline = "alphabetic"; let y = h * 0.34;
    L.forEach((ln, i) => { const px = Math.min(h * 0.19, NXD.fit(x, ln, w * 0.84, h * 0.2, 700)); x.font = NXD.FONT(700, Math.round(px)); x.fillText(ln, w * 0.08, y + px * 0.36); y += px * 1.04 + h * 0.012; });
    x.fillRect(w * 0.08, h * 0.78, w * 0.2, Math.max(2, h * 0.008));
    x.font = NXD.FONT(600, Math.max(6, Math.round(h * 0.03)), 2); x.fillStyle = sh === 0 ? S[1] : S[0]; x.globalAlpha = 0.85; x.fillText("NETEAM SOLUTIONS  ·  IT DONE RIGHT", w * 0.08, h * 0.94); x.globalAlpha = 1;
    // paper grain and a soft shadow under the glazing bar
    x.globalAlpha = 0.05; for (let i = 0; i < 500; i++) { x.fillStyle = r() < 0.5 ? "#000" : "#fff"; x.fillRect(r() * w, r() * h, 1.5, 1.5); } x.globalAlpha = 1;
    const g = x.createLinearGradient(0, 0, 0, h * 0.08); g.addColorStop(0, "rgba(0,0,0,.28)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h * 0.08);
  },

  // ---- floor paint: site letter in a ring
  k_site(x, w, h, d, r) {
    const col = d.col ? "rgba(190,255,224,.9)" : "rgba(190,238,255,.9)"; x.strokeStyle = col; x.fillStyle = col;
    x.lineWidth = w * 0.035; x.beginPath(); x.arc(w / 2, h / 2, w * 0.44, 0, 6.3); x.stroke(); x.lineWidth = w * 0.008; x.beginPath(); x.arc(w / 2, h / 2, w * 0.385, 0, 6.3); x.stroke();
    for (let i = 0; i < 4; i++) { x.save(); x.translate(w / 2, h / 2); x.rotate(i * Math.PI / 2 + Math.PI / 4); x.fillRect(w * 0.385, -w * 0.012, w * 0.075, w * 0.024); x.restore(); }
    x.font = NXD.FONT(700, Math.round(h * 0.56)); x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillText(d.t || "", w / 2, h * 0.7);
    NXD.wear(x, w, h, r, 260);
  },
  k_hazard(x, w, h, d, r) {
    const L = Math.max(w, h), T = Math.min(w, h); x.fillStyle = "rgba(232,178,30,.92)"; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(20,21,24,.94)";
    for (let i = -2; i < L / T + 2; i += 2) { x.beginPath(); if (w > h) { x.moveTo(i * T, 0); x.lineTo((i + 1) * T, 0); x.lineTo(i * T, h); x.lineTo((i - 1) * T, h); } else { x.moveTo(0, i * T); x.lineTo(0, (i + 1) * T); x.lineTo(w, i * T); x.lineTo(w, (i - 1) * T); } x.closePath(); x.fill(); }
    NXD.wear(x, w, h, r, 60);
  },

  // ---- lit signs over sites and spawns
  k_sign(x, w, h, d, r) {
    const P = [["#052838", "#39c6f4", "#bfefff"], ["#06281e", "#3ddc97", "#c4ffe2"], ["#330a10", "#ff5a66", "#ffd0d4"], ["#0a1b3c", "#4f9dff", "#cfe2ff"]][(d.col | 0) % 4];
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, P[0]); g.addColorStop(1, "#04070c"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = P[1]; x.fillRect(0, 0, w, h * 0.045); x.fillRect(0, h * 0.955, w, h * 0.045);
    // badge on the left
    const bs = h * 0.62, bx = h * 0.2, by = h * 0.19; x.fillStyle = P[1]; x.fillRect(bx, by, bs, bs); x.fillStyle = "#04070c"; x.font = NXD.FONT(700, Math.round(bs * 0.82)); x.textAlign = "center"; x.textBaseline = "middle";
    const t = d.t || "", sm = /SITE (\w)/.exec(t), badge = sm ? sm[1] : t[0]; x.fillText(badge, bx + bs / 2, by + bs * 0.54);
    const tx = bx + bs + h * 0.2, tw = w - tx - h * 0.2; x.textAlign = "left"; x.fillStyle = "#f4fbff"; const px = NXD.fit(x, t, tw, h * 0.44, 700); x.font = NXD.FONT(700, Math.round(px)); x.fillText(t, tx, h * 0.4);
    const sub = String(d.sub || "").toUpperCase(); x.fillStyle = P[2]; const p2 = NXD.fit(x, sub, tw, h * 0.2, 600, 2); x.font = NXD.FONT(600, Math.round(p2), 2); x.globalAlpha = 0.9; x.fillText(sub, tx, h * 0.73); x.globalAlpha = 1;
  },
  // ---- the company name in light
  k_logo(x, w, h, d, r) {
    x.textBaseline = "middle"; x.textAlign = "left"; const px = h * 0.74; x.font = NXD.FONT(700, Math.round(px));
    const a = "NETEAM", aw = x.measureText(a).width; let p2 = h * 0.4; x.font = NXD.FONT(500, Math.round(p2)); const b = "S O L U T I O N S", bw = x.measureText(b).width, gap = h * 0.5, tot = h * 0.62 + aw + gap + bw, k = Math.min(1, w * 0.98 / tot), x0 = (w - tot * k) / 2;
    x.save(); x.translate(x0, 0); x.scale(k, 1); x.shadowColor = "rgba(255,190,110,.9)"; x.shadowBlur = h * 0.12;
    x.fillStyle = "#ff9a4d"; x.fillRect(0, h * 0.27, h * 0.42, h * 0.42);
    x.fillStyle = "#fff0d8"; x.font = NXD.FONT(700, Math.round(px)); x.fillText(a, h * 0.62, h * 0.52);
    x.fillStyle = "#ffd9a8"; x.font = NXD.FONT(500, Math.round(p2)); x.fillText(b, h * 0.62 + aw + gap, h * 0.54); x.restore();
  },
};
