// ---------- characters ----------
const PALETTE = ["#ff6b57", "#ffd23f", "#3ddc97", "#4cc9f0", "#9b7bff", "#ff7ac6", "#ff9f1c", "#b5e655", "#2ec4b6", "#f2e6d0"];
const PALETTE_NAMES = ["Coral", "Sun", "Mint", "Sky", "Grape", "Bubblegum", "Tangerine", "Lime", "Lagoon", "Oat"];
const CHAR_OPTS = {
  body: ["Blob", "Bean", "Cube", "Gumdrop", "Ghost"],
  eyes: ["Dots", "Happy", "Visor", "Sleepy", "Fierce", "Cyclops"],
  hat: ["None", "Cap", "Crown", "Beanie", "Wizard", "Headphones", "Propeller", "Cat ears", "Party"],
  acc: ["None", "Bow tie", "Scarf", "Mustache", "Specs", "Blush", "Star badge"],
};
const OUTLINE = "#0d1024";
function randomChar() {
  return [rint(0, 4), rint(0, PALETTE.length - 1), rint(0, 5), rint(0, 8), rint(0, 6)];
}
function validChar(c) {
  if (!Array.isArray(c) || c.length !== 5) return null;
  const lim = [5, PALETTE.length, 6, 9, 7];
  const o = c.map((v, i) => (Number.isInteger(v) && v >= 0 && v < lim[i]) ? v : 0);
  return o;
}
function shade(hex, amt) {
  let n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
}
function bodyPath(ctx, type, s) {
  // centered at 0,0. returns {top, w}
  ctx.beginPath();
  if (type === 0) { ctx.ellipse(0, 0, s * 0.52, s * 0.48, 0, 0, Math.PI * 2); return { top: -s * 0.48, w: s * 0.52 }; }
  if (type === 1) { const w = s * 0.4, h = s * 0.58; ctx.roundRect(-w, -h, w * 2, h * 2, w); return { top: -h, w }; }
  if (type === 2) { const w = s * 0.48, h = s * 0.45; ctx.roundRect(-w, -h, w * 2, h * 2, s * 0.16); return { top: -h, w }; }
  if (type === 3) {
    const h = s * 0.5;
    ctx.moveTo(-s * 0.56, h * 0.8);
    ctx.quadraticCurveTo(-s * 0.58, h, -s * 0.4, h);
    ctx.lineTo(s * 0.4, h);
    ctx.quadraticCurveTo(s * 0.58, h, s * 0.56, h * 0.8);
    ctx.bezierCurveTo(s * 0.48, -h * 0.2, s * 0.32, -h, 0, -h);
    ctx.bezierCurveTo(-s * 0.32, -h, -s * 0.48, -h * 0.2, -s * 0.56, h * 0.8);
    ctx.closePath();
    return { top: -h, w: s * 0.46 };
  }
  // ghost
  const w = s * 0.46, h = s * 0.52;
  ctx.moveTo(-w, 0);
  ctx.arc(0, 0 - h * 0.08, w, Math.PI, 0);
  ctx.lineTo(w, h * 0.9);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const x1 = w - (2 * w / n) * (i + 0.5), x2 = w - (2 * w / n) * (i + 1);
    ctx.quadraticCurveTo(x1, h * (i % 2 ? 1.1 : 0.62), x2, h * 0.9);
  }
  ctx.closePath();
  return { top: -h * 0.08 - w, w };
}
/**
 * Draw a character. (x, y) is the body centre, s ≈ body size in px.
 * o: { t: seconds, look: -1..1, squash: -1..1, mood: "happy"|"shock"|"sad"|"", alpha, shadow:bool, bob:bool }
 */
function drawChar(ctx, c, x, y, s, o = {}) {
  c = validChar(c) || [0, 0, 0, 0, 0];
  const [bt, ci, et, ht, ac] = c;
  const col = o.color || PALETTE[ci];
  const t = o.t || 0;
  const look = o.look || 0;
  const lw = Math.max(1.2, s * 0.055);
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.translate(x, y);
  if (o.shadow !== false) {
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath(); ctx.ellipse(0, s * 0.56, s * 0.42, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  }
  const bob = o.bob === false ? 0 : Math.sin(t * 3 + (o.phase || 0)) * s * 0.025;
  const sq = o.squash || 0;
  ctx.translate(0, bob);
  ctx.scale(1 + sq * 0.12, 1 - sq * 0.12);
  if (o.rot) ctx.rotate(o.rot);

  // accessories behind body: scarf tail
  const info = bodyPath(ctx, bt, s);
  const g = ctx.createRadialGradient(-s * 0.18, -s * 0.22, s * 0.05, 0, 0, s * 0.7);
  g.addColorStop(0, shade(col, 0.28)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.22));
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = OUTLINE; ctx.stroke();
  // belly sheen
  ctx.save(); ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.beginPath(); ctx.ellipse(-s * 0.16, -s * 0.24, s * 0.16, s * 0.09, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const top = info.top, w = info.w;
  const ey = bt === 1 ? -s * 0.2 : bt === 3 ? -s * 0.02 : -s * 0.08;
  const ex = s * 0.17, lx = look * s * 0.06;
  const blink = o.blink != null ? o.blink : ((t + (o.phase || 0)) % 4.2 > 4.05);

  // accessory: blush (under eyes)
  if (ac === 5) {
    ctx.fillStyle = "rgba(255,90,120,.45)";
    ctx.beginPath(); ctx.ellipse(-ex - s * 0.08 + lx, ey + s * 0.13, s * 0.08, s * 0.045, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ex + s * 0.08 + lx, ey + s * 0.13, s * 0.08, s * 0.045, 0, 0, Math.PI * 2); ctx.fill();
  }

  // eyes
  ctx.lineWidth = lw; ctx.strokeStyle = OUTLINE; ctx.fillStyle = OUTLINE;
  const mood = o.mood || "";
  if (et === 0 || et === 3 || et === 4) {
    for (const sx of [-1, 1]) {
      const cx = sx * ex + lx;
      if (blink) { ctx.beginPath(); ctx.moveTo(cx - s * 0.08, ey); ctx.lineTo(cx + s * 0.08, ey); ctx.stroke(); continue; }
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(cx, ey, s * 0.1, s * (mood === "shock" ? 0.13 : 0.115), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = OUTLINE;
      ctx.beginPath(); ctx.arc(cx + look * s * 0.03, ey + s * 0.015, s * (mood === "shock" ? 0.035 : 0.05), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(cx + look * s * 0.03 - s * 0.018, ey - s * 0.01, s * 0.016, 0, Math.PI * 2); ctx.fill();
      if (et === 3) { // sleepy lids
        ctx.fillStyle = shade(col, -0.1);
        ctx.beginPath(); ctx.ellipse(cx, ey - s * 0.02, s * 0.105, s * 0.075, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      }
      if (et === 4) { // fierce brows
        ctx.lineWidth = lw * 1.4;
        ctx.beginPath(); ctx.moveTo(cx - sx * s * 0.1, ey - s * 0.16); ctx.lineTo(cx + sx * s * 0.07, ey - s * 0.1); ctx.stroke();
        ctx.lineWidth = lw;
      }
    }
  } else if (et === 1) {
    ctx.lineWidth = lw * 1.3; ctx.lineCap = "round";
    for (const sx of [-1, 1]) { const cx = sx * ex + lx; ctx.beginPath(); ctx.arc(cx, ey + s * 0.03, s * 0.075, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    ctx.lineCap = "butt";
  } else if (et === 2) {
    const vw = s * 0.36, vh = s * 0.13;
    ctx.fillStyle = "#1a2050";
    ctx.beginPath(); ctx.roundRect(-vw + lx, ey - vh, vw * 2, vh * 2, vh); ctx.fill(); ctx.stroke();
    const vg = ctx.createLinearGradient(-vw, 0, vw, 0);
    vg.addColorStop(0, "#4cc9f0"); vg.addColorStop(1, "#ff7ac6");
    ctx.fillStyle = vg; ctx.globalAlpha *= 0.85;
    ctx.beginPath(); ctx.roundRect(-vw * 0.8 + lx + look * s * 0.05, ey - vh * 0.35, vw * 1.6, vh * 0.7, vh * 0.35); ctx.fill();
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
  } else if (et === 5) {
    const cx = lx;
    if (blink) { ctx.beginPath(); ctx.moveTo(cx - s * 0.13, ey); ctx.lineTo(cx + s * 0.13, ey); ctx.stroke(); }
    else {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, ey, s * 0.16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#3b2d66"; ctx.beginPath(); ctx.arc(cx + look * s * 0.05, ey + s * 0.01, s * 0.085, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = OUTLINE; ctx.beginPath(); ctx.arc(cx + look * s * 0.05, ey + s * 0.01, s * 0.045, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + look * s * 0.05 - s * 0.03, ey - s * 0.03, s * 0.022, 0, Math.PI * 2); ctx.fill();
    }
  }

  // mouth
  const my = ey + s * 0.2;
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = lw; ctx.lineCap = "round";
  if (ac !== 3) {
    ctx.beginPath();
    if (mood === "shock") { ctx.fillStyle = OUTLINE; ctx.ellipse(lx, my + s * 0.01, s * 0.045, s * 0.06, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (mood === "sad") { ctx.arc(lx, my + s * 0.07, s * 0.07, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    else if (mood === "happy") { ctx.fillStyle = "#5a1730"; ctx.arc(lx, my - s * 0.01, s * 0.08, 0.1, Math.PI - 0.1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.arc(lx, my - s * 0.03, s * 0.065, 0.35, Math.PI - 0.35); ctx.stroke(); }
  }
  ctx.lineCap = "butt";

  // accessories front
  if (ac === 1) { // bow tie
    const by = s * 0.3; ctx.fillStyle = "#ff4f6d";
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(-s * 0.14, by - s * 0.08); ctx.lineTo(-s * 0.14, by + s * 0.08); ctx.closePath();
    ctx.moveTo(0, by); ctx.lineTo(s * 0.14, by - s * 0.08); ctx.lineTo(s * 0.14, by + s * 0.08); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, by, s * 0.035, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (ac === 2) { // scarf
    const by = s * (bt === 1 ? 0.22 : 0.24);
    ctx.fillStyle = "#e63946";
    ctx.beginPath(); ctx.roundRect(-w * 0.95, by - s * 0.06, w * 1.9, s * 0.13, s * 0.06); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(w * 0.2, by, s * 0.12, s * 0.24, s * 0.04); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = lw * 0.8;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.12, by - s * 0.05); ctx.lineTo(i * s * 0.12 + s * 0.04, by + s * 0.06); ctx.stroke(); }
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = lw;
  } else if (ac === 3) { // mustache
    ctx.fillStyle = "#3a2318";
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(lx, my - s * 0.04);
      ctx.bezierCurveTo(lx + sx * s * 0.08, my - s * 0.1, lx + sx * s * 0.2, my - s * 0.04, lx + sx * s * 0.22, my - s * 0.1);
      ctx.bezierCurveTo(lx + sx * s * 0.2, my + s * 0.04, lx + sx * s * 0.06, my + s * 0.03, lx, my - s * 0.01);
      ctx.fill();
    }
  } else if (ac === 4 && et !== 2) { // specs
    ctx.lineWidth = lw * 1.1;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * ex + lx, ey, s * 0.13, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-ex + s * 0.13 + lx, ey); ctx.lineTo(ex - s * 0.13 + lx, ey); ctx.stroke();
    ctx.lineWidth = lw;
  } else if (ac === 6) { // star badge
    star(ctx, -w * 0.45, s * 0.24, s * 0.09, s * 0.04, 5, "#ffd23f");
  }

  // hats
  ctx.fillStyle = OUTLINE;
  const hy = top + s * 0.02;
  if (ht === 1) { // cap
    ctx.fillStyle = "#3b5bdb";
    ctx.beginPath(); ctx.ellipse(0, hy + s * 0.04, w * 0.78, s * 0.2, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(w * 0.55 * (look >= 0 ? 1 : -1), hy + s * 0.04, s * 0.26, s * 0.06, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, hy - s * 0.15, s * 0.03, 0, Math.PI * 2); ctx.fill();
  } else if (ht === 2) { // crown
    const cw = s * 0.32, ch = s * 0.22, cy = hy + s * 0.04;
    ctx.fillStyle = "#ffd23f";
    ctx.beginPath(); ctx.moveTo(-cw, cy); ctx.lineTo(-cw, cy - ch); ctx.lineTo(-cw * 0.5, cy - ch * 0.5); ctx.lineTo(0, cy - ch * 1.15); ctx.lineTo(cw * 0.5, cy - ch * 0.5); ctx.lineTo(cw, cy - ch); ctx.lineTo(cw, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ff4f6d"; ctx.beginPath(); ctx.arc(0, cy - ch * 0.35, s * 0.035, 0, Math.PI * 2); ctx.fill();
  } else if (ht === 3) { // beanie
    ctx.fillStyle = "#2ec4b6";
    ctx.beginPath(); ctx.ellipse(0, hy + s * 0.1, w * 0.85, s * 0.3, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1f8a80"; ctx.beginPath(); ctx.roundRect(-w * 0.88, hy + s * 0.02, w * 1.76, s * 0.11, s * 0.05); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f2e6d0"; ctx.beginPath(); ctx.arc(0, hy - s * 0.22, s * 0.075, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (ht === 4) { // wizard
    ctx.fillStyle = "#5b3cc4";
    ctx.beginPath(); ctx.moveTo(-s * 0.34, hy + s * 0.06); ctx.quadraticCurveTo(-s * 0.05, hy - s * 0.2, s * 0.08, hy - s * 0.6); ctx.quadraticCurveTo(s * 0.12, hy - s * 0.2, s * 0.34, hy + s * 0.06); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, hy + s * 0.06, s * 0.42, s * 0.07, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    star(ctx, -s * 0.02, hy - s * 0.14, s * 0.06, s * 0.025, 5, "#ffd23f");
  } else if (ht === 5) { // headphones
    ctx.strokeStyle = "#20263f"; ctx.lineWidth = s * 0.07;
    ctx.beginPath(); ctx.arc(0, ey + s * 0.02, w * 1.0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.lineWidth = lw; ctx.strokeStyle = OUTLINE; ctx.fillStyle = "#ff6b57";
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.roundRect(sx * w * 0.98 - s * 0.08, ey - s * 0.09, s * 0.16, s * 0.24, s * 0.06); ctx.fill(); ctx.stroke(); }
  } else if (ht === 6) { // propeller
    ctx.fillStyle = "#ffd23f";
    ctx.beginPath(); ctx.ellipse(0, hy + s * 0.06, w * 0.55, s * 0.14, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUTLINE; ctx.fillRect(-s * 0.015, hy - s * 0.18, s * 0.03, s * 0.12);
    const pa = (t * 14) % (Math.PI * 2), pw = Math.abs(Math.cos(pa)) * s * 0.26 + s * 0.03;
    ctx.fillStyle = "#ff4f6d"; ctx.beginPath(); ctx.ellipse(-pw / 2, hy - s * 0.19, pw / 2, s * 0.035, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#4cc9f0"; ctx.beginPath(); ctx.ellipse(pw / 2, hy - s * 0.19, pw / 2, s * 0.035, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (ht === 7) { // cat ears
    ctx.fillStyle = col;
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(sx * w * 0.25, hy + s * 0.08); ctx.lineTo(sx * w * 0.62, hy - s * 0.2); ctx.lineTo(sx * w * 0.9, hy + s * 0.14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ff9fb8"; ctx.beginPath(); ctx.moveTo(sx * w * 0.4, hy + s * 0.06); ctx.lineTo(sx * w * 0.61, hy - s * 0.09); ctx.lineTo(sx * w * 0.76, hy + s * 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = col;
    }
  } else if (ht === 8) { // party
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-s * 0.2, hy + s * 0.06); ctx.lineTo(s * 0.06, hy - s * 0.42); ctx.lineTo(s * 0.24, hy + s * 0.06); ctx.closePath();
    ctx.fillStyle = "#9b7bff"; ctx.fill();
    ctx.clip(); ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = s * 0.05;
    for (let i = -3; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.4, hy + i * s * 0.12); ctx.lineTo(s * 0.4, hy + i * s * 0.12 - s * 0.2); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-s * 0.2, hy + s * 0.06); ctx.lineTo(s * 0.06, hy - s * 0.42); ctx.lineTo(s * 0.24, hy + s * 0.06); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "#ff6b57"; ctx.beginPath(); ctx.arc(s * 0.06, hy - s * 0.44, s * 0.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function star(ctx, x, y, R, r, n, fill) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = Math.max(1, R * 0.2); ctx.strokeStyle = OUTLINE; ctx.stroke();
}
// small avatar canvases
function avatarCanvas(c, px = 38, colorOverride) {
  const cv = document.createElement("canvas");
  paintAvatar(cv, c, px, colorOverride);
  return cv;
}
function paintAvatar(cv, c, px, colorOverride) {
  const ctx = fitCanvas(cv, px, px);
  ctx.clearRect(0, 0, px, px);
  drawChar(ctx, c, px / 2, px * 0.56, px * 0.62, { shadow: false, bob: false, blink: false, color: colorOverride });
}
