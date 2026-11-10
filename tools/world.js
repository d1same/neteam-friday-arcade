// Loads the pure-data parts of the game (map grids, scanned texture table, world generator) into Node.
const fs = require("fs"), path = require("path"), vm = require("vm");
const SRC = path.join(__dirname, "../src");
function load() {
  const ctx = { console, Math, JSON, Float32Array, Uint8Array, Uint16Array, Int32Array, Uint32Array, Int16Array, Object, Array, Number, String, Error, Infinity, NaN, isFinite, parseFloat, parseInt, Set, Map };
  vm.createContext(ctx);
  const ops = fs.readFileSync(path.join(SRC, "08-ops.js"), "utf8"), cut = ops.indexOf("// weapons");
  if (cut < 0) throw new Error("08-ops.js: map section marker not found");
  let code = "const CS = 4, PR = 0.38;\n" + ops.slice(0, cut) + "\n";
  for (const f of fs.readdirSync(SRC).filter(f => /^1(0a|1[a-z]?)-nx-/.test(f)).sort()) code += fs.readFileSync(path.join(SRC, f), "utf8") + "\n";
  const rc = fs.readFileSync(path.join(SRC, "09-race.js"), "utf8"), rcut = rc.indexOf("// ---- driving");
  if (rcut < 0) throw new Error("09-race.js: track section marker not found");
  code += rc.slice(0, rcut) + "\nthis.RC_TRACKS = RC_TRACKS; this.rcWorld = rcWorld;\n";
  code += "this.OPS_MAPS = OPS_MAPS; this.NXW = NXW; this.NX_TEX = NX_TEX; this.NX_SKY = typeof NX_SKY === 'undefined' ? {} : NX_SKY; this.opsSetMap = opsSetMap; this.getProps = () => OPS_PROPS;";
  vm.runInContext(code, ctx, { filename: "game-src.js" });
  return ctx;
}
function build(id) {
  const g = load(), race = id.startsWith("rc-"), M = race ? g.rcWorld(id.slice(3)) : g.OPS_MAPS[id]; if (!M) throw new Error("no such map: " + id);
  if (!race) { g.opsSetMap(id === "hq" ? "farm" : "hq"); g.opsSetMap(id); }
  const sky = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, "sky", n + ".json"), "utf8"));
  const W = g.NXW.build(id, M, { tex: g.NX_TEX, props: race ? [] : g.getProps() });
  return { W, g, sky, M };
}
module.exports = { load, build };
if (require.main === module) {
  const id = process.argv[2] || "hq", t0 = Date.now(), { W } = build(id);
  let nv = 0, nt = 0; for (const k in W.bat) { nv += W.bat[k].nv; nt += W.bat[k].ix.length / 3; }
  console.log(`${id}: ${Date.now() - t0} ms, atlas ${W.atlas.w}x${W.atlas.h}, ${W.charts.length} charts, ${Object.keys(W.bat).length} materials, ${nv} verts, ${nt} tris, ${W.vl.g.length} vertex-light samples, ${W.occ.n} solids, ${W.lights.length} lights, ${W.decals.length} decals (atlas rows used ${W.dAtlas.used} of ${W.dAtlas.h}, scale ${W.dAtlas.scale.toFixed(2)}), sig ${W.sig}`);
  console.log(Object.keys(W.bat).map(k => k + ":" + W.bat[k].nv).join(" "));
}
