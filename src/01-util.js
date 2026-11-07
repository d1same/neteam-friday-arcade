// ---------- utilities ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const now = () => performance.now();
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rnd = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}
function store(key, val) {
  try {
    if (val === undefined) { const v = localStorage.getItem(key); return v == null ? null : JSON.parse(v); }
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { return null; }
}
function sstore(key, val) {
  try {
    if (val === undefined) { const v = sessionStorage.getItem(key); return v == null ? null : JSON.parse(v); }
    sessionStorage.setItem(key, JSON.stringify(val));
  } catch (e) { return null; }
}
function randId(n = 10) { const s = "abcdefghijkmnpqrstuvwxyz23456789"; let o = ""; for (let i = 0; i < n; i++) o += s[Math.floor(Math.random() * s.length)]; return o; }
function cleanNick(s) {
  return String(s || "").replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/g, "").trim().slice(0, 14);
}
let toastT = 0;
function toast(msg, ms = 2800) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), ms);
}
function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function clockStr(ts) { return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
// size a canvas for crisp drawing; returns ctx scaled to CSS px
function fitCanvas(cv, w, h) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
const reducedMotion = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } })();
