// Frame rate benchmark on a real graphics card. It drives an installed Chrome or Edge through a solo match with bots
// for each game, map and quality level, with the frame rate uncapped, and prints what a player on this PC would get.
//
//   npm i playwright-core            (once, anywhere; no browser download needed)
//   node tools/bench.js [url] [--headed] [--quick] [--size 1920x1080] [--dpr 1] [--only race] [--secs 6] [--json out.json]
//
// url defaults to http://localhost:4802. Columns: fps = average, low = the slowest 1% of frames as a frame rate,
// hitch = frames longer than 50 ms, js = time the page's own code takes per frame (of which draw = sending the picture
// to the graphics card), res = the resolution the 3D picture is drawn at after the quality level and dynamic resolution.
let pw; try { pw = require("playwright-core"); } catch (e) { try { pw = require("playwright"); } catch (e2) { console.error("Install playwright-core first: npm i playwright-core"); process.exit(1); } }
const argv = process.argv.slice(2), flag = (n) => argv.includes("--" + n), opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const url = argv.find(a => /^https?:/.test(a)) || "http://localhost:4802";
const [W, H] = opt("size", "1920x1080").split("x").map(Number), DPR = +opt("dpr", 1), SECS = +opt("secs", 6), only = opt("only", "");
const RUNS = [];
const add = (game, map, q, extra) => RUNS.push(Object.assign({ game, map, q }, extra || {}));
if (flag("quick")) { add("deathmatch", "hq", "auto"); add("race", "neon", "auto"); }
else {
  add("deathmatch", "hq", "auto");
  for (const q of ["low", "medium", "high"]) { add("deathmatch", "hq", q); add("deathmatch", "sand", q); add("golden", "arena", q); add("race", "neon", q); add("race", "harbor", q); }
  add("deathmatch", "hq", "medium", { nx: 0 }); add("race", "neon", "medium", { nx: 0 });   // the renderer from before the overhaul, for comparison
}

async function launch() {
  const args = ["--disable-gpu-vsync", "--disable-frame-rate-limit", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"];
  if (process.env.BENCH_ARGS) args.push(...process.env.BENCH_ARGS.split(" "));
  const tries = process.env.BENCH_CHANNEL ? [process.env.BENCH_CHANNEL] : ["chrome", "msedge", ""];
  let err;
  for (const ch of tries) { try { return await pw.chromium.launch(Object.assign({ headless: !flag("headed"), args }, ch ? { channel: ch } : {})); } catch (e) { err = e; } }
  throw err;
}

async function one(browser, R) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const p = await ctx.newPage(), errs = [];
  p.on("pageerror", e => errs.push(String(e.message).slice(0, 160)));
  await p.addInitScript((r) => { localStorage.setItem("nfa-gfx", JSON.stringify(Object.assign({ q: r.q }, r.nx === 0 ? { nx: 0 } : {}))); localStorage.setItem("nfa-sound", "false"); }, R);
  const out = Object.assign({}, R);
  try {
    await p.goto(url); await p.waitForSelector("#editor[open]", { timeout: 30000 });
    await p.fill("#nickInput", "Bench"); await p.click("#edSave", { force: true }); await p.waitForTimeout(600);
    await p.click(`.game-card[data-g="${R.game}"]`, { force: true }); await p.click("#startBtn", { force: true }); await p.waitForTimeout(1200);
    if (R.map) { await p.evaluate((m) => setVote(APP.V, m), R.map); await p.waitForTimeout(250); }
    const t0 = Date.now();
    await p.click(".ready-btn", { force: true }); await p.waitForTimeout(4200);
    await p.click("text=Skip intro", { force: true }).catch(() => {});
    await p.waitForFunction(() => APP.V && APP.V.fps && (APP.V.fps.ready || APP.V.fps.failed), null, { timeout: 180000 });
    out.load = +((Date.now() - t0 - 4200) / 1000).toFixed(1);
    await p.waitForTimeout(R.game === "race" ? 6000 : 3500);   // countdown, first shaders, dynamic resolution settling
    Object.assign(out, await p.evaluate((secs) => new Promise((res) => {
      const F = APP.V.fps, r = F.renderer, gl = r.getContext(), ts = [], og = window.gameFrame; let js = 0, draw = 0, last = performance.now();
      const t0 = last, target = F.post && F.post.render ? F.post : null, od = target ? target.render : null, rr = r.render;
      window.gameFrame = function (a, b) { const s = performance.now(); og(a, b); js += performance.now() - s; };
      if (target) target.render = function () { const s = performance.now(); od.apply(target, arguments); draw += performance.now() - s; };
      else r.render = function () { const s = performance.now(); rr.apply(r, arguments); draw += performance.now() - s; };
      r.info.autoReset = false; r.info.reset();
      const tick = () => {
        const n = performance.now(); ts.push(n - last); last = n;
        if (n - t0 < secs * 1000) return requestAnimationFrame(tick);
        window.gameFrame = og; if (target) target.render = od; else r.render = rr;
        const N = ts.length, sum = ts.reduce((a, b) => a + b, 0), s = ts.slice().sort((a, b) => a - b), I = r.info.render, tgt = F.post && F.post.scene;
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        res({ fps: +(1000 * N / sum).toFixed(1), low: +(1000 / s[Math.min(N - 1, Math.floor(N * 0.99))]).toFixed(1), worst: +s[N - 1].toFixed(0), hitch: ts.filter(x => x > 50).length,
          js: +(js / N).toFixed(1), draw: +(draw / N).toFixed(1), calls: Math.round(I.calls / N), tris: Math.round(I.triangles / N),
          res: tgt ? tgt.width + "x" + tgt.height : r.domElement.width + "x" + r.domElement.height, drs: typeof NX !== "undefined" && F.nx ? +NX.drs.k.toFixed(2) : 1,
          tier: typeof NX !== "undefined" && F.nx ? NX.tier().name : "old", gpu: String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).slice(0, 90),
          tex: r.info.memory.textures, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0, players: (APP.V.ro || []).length });
        r.info.autoReset = true;
      };
      requestAnimationFrame(tick);
    }), SECS));
  } catch (e) { out.error = String(e.message).split("\n")[0].slice(0, 200); }
  if (errs.length) out.pageErrors = errs.slice(0, 3);
  await ctx.close();
  return out;
}

(async () => {
  const browser = await launch(), rows = [];
  console.log(`Friday Arcade benchmark · ${url} · ${W}x${H} @${DPR} · ${browser.version()} · ${flag("headed") ? "headed" : "headless"}`);
  const pad = (v, n) => String(v == null ? "" : v).padEnd(n);
  console.log(["game", "map", "asked", "ran as", "fps", "low", "worst ms", "hitch", "js ms", "draw ms", "calls", "tris", "res", "drs", "load s"].map((h, i) => pad(h, [11, 10, 7, 7, 7, 7, 9, 6, 6, 8, 6, 8, 10, 5, 6][i])).join(""));
  for (const R of RUNS.filter(r => !only || r.game === only || r.map === only || r.q === only)) {
    const o = await one(browser, R); rows.push(o);
    if (o.error) { console.log(pad(R.game, 11) + pad(R.map, 10) + pad(R.q, 7) + "FAILED: " + o.error); continue; }
    if (rows.filter(x => x.gpu).length === 1) console.log("graphics card: " + o.gpu);
    console.log([R.game, R.map, R.q + (R.nx === 0 ? "*" : ""), o.tier, o.fps, o.low, o.worst, o.hitch, o.js, o.draw, o.calls, o.tris, o.res, o.drs, o.load].map((v, i) => pad(v, [11, 10, 7, 7, 7, 7, 9, 6, 6, 8, 6, 8, 10, 5, 6][i])).join("") + (o.pageErrors ? "  page errors: " + o.pageErrors.join(" | ") : ""));
  }
  console.log("* = the renderer from before the overhaul");
  if (opt("json", "")) require("fs").writeFileSync(opt("json", ""), JSON.stringify(rows, null, 1));
  await browser.close();
})().catch(e => { console.error("benchmark failed:", e.message); process.exit(1); });
