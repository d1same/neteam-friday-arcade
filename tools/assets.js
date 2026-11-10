#!/usr/bin/env node
// Asset pipeline: downloads CC0 source material (Poly Haven, ambientCG) into tools/.cache and writes game-ready files to
// server/public/models. Run it from anywhere: node tools/assets.js [tex|sky|all] [--only a,b] [--force]
//   textures -> t-<name>-c.jpg (colour, sRGB), t-<name>-n.jpg (normal, OpenGL), t-<name>-m.jpg (R = AO, G = roughness, B = metal),
//               optional -e.jpg (emission) and -a.jpg (opacity); table of real-world sizes and average colours -> src/10a-nx-tex.js
//   skies    -> sky-<name>.jpg (what you see), sky-<name>-env.png (small RGBE-encoded HDR for reflections), and
//               tools/sky/<name>.json (sun direction + colour, coarse sky radiance for the light baker)
const fs = require("fs"), path = require("path"), cp = require("child_process");
const sharp = require("sharp");
const ROOT = path.join(__dirname, ".."), OUT = path.join(ROOT, "server/public/models"), CACHE = path.join(__dirname, ".cache");
const args = process.argv.slice(2), what = args.find(a => !a.startsWith("--")) || "all";
const only = (args.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean), force = args.includes("--force");
fs.mkdirSync(CACHE, { recursive: true });

// [game name, source, source id, options]. options: s = metres covered by one tile (overrides the scan's own size),
// size = output pixels (default 1024), tint = multiply colour
const TEX = [
  // ---- office
  ["plaster", "ph", "white_plaster_02"],
  ["plaster2", "ph", "plastered_wall_04"],
  ["brick", "ph", "red_brick_03"],
  ["brick2", "ph", "brick_wall_001"],
  ["concrete", "ph", "concrete_wall_008"],
  ["concfloor", "ph", "concrete_floor_worn_001"],
  ["carpet", "acg", "Carpet012", { q: 72 }],
  ["carpet2", "acg", "Carpet016"],
  ["laminate", "ph", "laminate_floor_02"],
  ["terrazzo", "ph", "terrazzo_tiles"],
  ["granite", "ph", "granite_tile_03"],
  ["wood", "ph", "wood_table_001"],
  ["darkwood", "ph", "dark_wood"],
  ["ceiltile", "ph", "ceiling_interior"],
  ["oak", "ph", "oak_veneer_01"],
  ["plywood", "ph", "plywood"],
  ["marble", "ph", "marble_01"],
  ["paintwall", "ph", "painted_plaster_wall"],
  ["greyplaster", "ph", "grey_plaster_02"],
  ["bigtiles", "ph", "large_floor_tiles_02"],
  ["fabric", "ph", "poly_wool_herringbone"],
  ["leather", "ph", "brown_leather"],
  ["terrazzo2", "acg", "Terrazzo018"],
  // ---- server farm / vault
  ["hangar", "ph", "hangar_concrete_floor"],
  ["metalplate", "ph", "metal_plate"],
  ["metalplate2", "ph", "metal_plate_02"],
  ["concrete2", "ph", "concrete_wall_004"],
  ["paintconc", "ph", "painted_concrete_02"],
  ["bluemetal", "ph", "blue_metal_plate"],
  ["container", "ph", "container_side"],
  ["corrugated", "ph", "corrugated_iron"],
  ["diamond", "acg", "MetalPlates006"],
  ["walkway", "acg", "MetalWalkway014"],
  ["brushed", "acg", "Metal055A"],
  ["darkmetal", "acg", "Metal046B"],
  ["redpaint", "acg", "PaintedMetal004"],
  ["plastic", "acg", "Plastic013A"],
  ["rubber", "acg", "Rubber004", { q: 72 }],
  ["tiles", "acg", "Tiles107"],
  ["grate", "acg", "Grate001"],
  ["fence", "acg", "Fence007A"],
  // ---- desert town
  ["sandstone", "ph", "sandstone_blocks_04"],
  ["sandstone2", "ph", "sandstone_blocks_08"],
  ["sandbrick", "ph", "white_sandstone_bricks_03"],
  ["yplaster", "ph", "yellow_plaster"],
  ["yplaster2", "ph", "yellow_plaster_02"],
  ["stoneplaster", "ph", "plaster_stone_wall_01"],
  ["redplaster", "ph", "red_plaster_weathered"],
  ["blueplaster", "ph", "blue_plaster_weathered"],
  ["crackplaster", "ph", "worn_cracked_plaster"],
  ["cobble", "ph", "cobblestone_floor_05"],
  ["patio", "ph", "patio_tiles"],
  ["sand", "ph", "sand_01"],
  ["rooftile", "ph", "clay_roof_tiles"],
  ["planks", "ph", "brown_planks_03"],
  ["darkplanks", "ph", "dark_wooden_planks"],
  // ---- rooftop
  ["bitumen", "ph", "bitumen"],
  ["gravel", "ph", "tarred_gravel"],
  ["pavers", "ph", "concrete_pavers_02"],
  ["blockwall", "ph", "concrete_block_wall"],
  ["factory", "ph", "factory_wall"],
  ["rust", "ph", "rusty_metal_02"],
  ["shutter", "ph", "painted_metal_shutter"],
  ["boxprofile", "ph", "box_profile_metal_sheet"],
  // ---- racing
  ["asphalt", "ph", "asphalt_track"],
  ["asphalt2", "ph", "asphalt_02", { q: 74 }],
  ["pitlane", "ph", "asphalt_pit_lane"],
  ["pavement", "ph", "concrete_pavement"],
  ["herringbone", "ph", "herringbone_pavement_04"],
  ["asphalt3", "ph", "asphalt_04"],
  ["grass", "ph", "sparse_grass"],
  ["rock", "ph", "rocky_terrain_02"],
  ["facade1", "acg", "Facade017"],
  ["facade2", "acg", "Facade009"],
  ["facade3", "acg", "Facade013"],
  ["facade4", "acg", "Facade002"],
  ["facade5", "acg", "Facade018A"],
  ["facade6", "acg", "Facade001"],
];
// [game name, Poly Haven id, options]. sunK scales the sun the baker uses, k the sky brightness
const SKY = [
  ["dusk", "belfast_sunset_puresky"],
  ["desert", "kloofendal_48d_partly_cloudy_puresky"],
  ["night", "kloppenheim_02_puresky"],
  ["dawn", "qwantani_dawn_puresky"],
  ["storm", "kloofendal_overcast_puresky"],
];

const sh = (cmd, a, o = {}) => cp.execFileSync(cmd, a, Object.assign({ stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 }, o));
function get(url, file, tries = 4) {
  if (fs.existsSync(file) && fs.statSync(file).size > 200) return file;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  for (let k = 0; k < tries; k++) {
    try { sh("curl", ["-sSL", "--fail", "-m", "300", "-o", file + ".part", url]); fs.renameSync(file + ".part", file); return file; }
    catch (e) { if (k === tries - 1) throw new Error("download failed: " + url + " " + String(e.stderr || e.message).slice(0, 200)); sh("sleep", [String(2 << k)]); }
  }
}
const getJson = (url, file) => JSON.parse(fs.readFileSync(get(url, file), "utf8"));
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const r3 = (v) => Math.round(v * 1000) / 1000;

async function texPH(name, id, o) {
  const dir = path.join(CACHE, "ph", id), files = getJson("https://api.polyhaven.com/files/" + id, path.join(dir, "files.json")), info = getJson("https://api.polyhaven.com/info/" + id, path.join(dir, "info.json"));
  const url = (k) => { const e = files[k] && (files[k]["1k"] || files[k]["2k"]); return e && e.jpg && e.jpg.url; };
  const src = {}; for (const [k, key] of [["c", "Diffuse"], ["n", "nor_gl"], ["m", "arm"]]) { const u = url(key); if (!u) throw new Error(id + ": no " + key); src[k] = get(u, path.join(dir, path.basename(u))); }
  const dim = info.dimensions || [1000, 1000];
  return { src, s: o.s || dim[0] / 1000, sy: (o.s || dim[0] / 1000) * (dim[1] / dim[0]), credit: `${info.name} by ${Object.keys(info.authors || {}).join(", ")} (Poly Haven, CC0) https://polyhaven.com/a/${id}` };
}
async function texACG(name, id, o) {
  const dir = path.join(CACHE, "acg", id), zip = get(`https://ambientcg.com/get?file=${id}_1K-JPG.zip`, path.join(dir, id + ".zip"));
  const ex = path.join(dir, "x"); if (!fs.existsSync(ex)) { fs.mkdirSync(ex, { recursive: true }); sh("unzip", ["-o", "-q", zip, "-d", ex]); }
  const meta = getJson(`https://ambientcg.com/api/v2/full_json?id=${id}&include=dimensionsData`, path.join(dir, "meta.json")), a0 = (meta.foundAssets || [])[0] || {};
  const f = (k) => { const p = path.join(ex, `${id}_1K-JPG_${k}.jpg`); return fs.existsSync(p) ? p : null; };
  const src = { c: f("Color"), n: f("NormalGL"), ao: f("AmbientOcclusion"), r: f("Roughness"), mt: f("Metalness"), e: f("Emission"), a: f("Opacity") };
  if (!src.c || !src.n) throw new Error(id + ": missing colour or normal map");
  const cm = +a0.dimensionX || 0; // centimetres, 0 when the scan has no recorded size
  return { src, s: o.s || (cm ? cm / 100 : 2), sy: o.s || (cm ? (+a0.dimensionY || cm) / 100 : 2), credit: `${id} (ambientCG, CC0) https://ambientcg.com/a/${id}` };
}
async function doTex() {
  const table = {}, credits = [];
  const tf = path.join(ROOT, "src/10a-nx-tex.js");
  let prev = {}; try { prev = JSON.parse(fs.readFileSync(path.join(CACHE, "tex-table.json"), "utf8")); } catch (e) { }
  for (const [name, kind, id, o0] of TEX) {
    const o = o0 || {}, size = o.size || 1024, q = o.q || 0, out = (k) => path.join(OUT, `t-${name}-${k}.jpg`);
    if (only.length && !only.includes(name)) { if (prev[name]) { table[name] = prev[name].t; credits.push(prev[name].c); } continue; }
    if (!force && prev[name] && prev[name].id === id && fs.existsSync(out("c")) && fs.existsSync(out("n")) && fs.existsSync(out("m"))) { table[name] = prev[name].t; credits.push(prev[name].c); continue; }
    const t = kind === "ph" ? await texPH(name, id, o) : await texACG(name, id, o), S = t.src, rs = { width: size, height: size, fit: "fill" };
    let c = sharp(S.c).resize(rs).removeAlpha(); if (o.tint) c = c.linear(o.tint, [0, 0, 0]);
    await c.jpeg({ quality: q || 84, chromaSubsampling: "4:2:0", mozjpeg: true }).toFile(out("c"));
    await sharp(S.n).resize(rs).removeAlpha().jpeg({ quality: q ? q + 6 : 88, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(out("n"));
    if (S.m) await sharp(S.m).resize(rs).removeAlpha().jpeg({ quality: 82, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(out("m"));
    else {
      const ch = async (p, v) => p ? sharp(p).resize(rs).greyscale().raw().toBuffer() : Buffer.alloc(size * size, v);
      const [ao, ro, me] = await Promise.all([ch(S.ao, 255), ch(S.r, 200), ch(S.mt, 0)]), buf = Buffer.alloc(size * size * 3);
      for (let i = 0; i < size * size; i++) { buf[i * 3] = ao[i]; buf[i * 3 + 1] = ro[i]; buf[i * 3 + 2] = me[i]; }
      await sharp(buf, { raw: { width: size, height: size, channels: 3 } }).jpeg({ quality: 82, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(out("m"));
    }
    const ent = { s: r3(t.s), sy: r3(t.sy) };
    if (S.e) { await sharp(S.e).resize(rs).removeAlpha().jpeg({ quality: 82, mozjpeg: true }).toFile(out("e")); ent.e = 1; }
    if (S.a) { await sharp(S.a).resize(rs).greyscale().jpeg({ quality: 88, mozjpeg: true }).toFile(out("a")); ent.o = 1; }
    // average linear colour, roughness and metalness (the light baker bounces light with the colour)
    const px = await sharp(out("c")).resize(48, 48, { fit: "fill" }).raw().toBuffer(), mm = await sharp(out("m")).resize(48, 48, { fit: "fill" }).raw().toBuffer();
    const av = [0, 0, 0]; let ro = 0, me = 0; const n = 48 * 48;
    for (let i = 0; i < n; i++) { for (let k = 0; k < 3; k++) av[k] += lin(px[i * 3 + k]); ro += mm[i * 3 + 1] / 255; me += mm[i * 3 + 2] / 255; }
    ent.a = av.map(v => r3(v / n)); ent.r = r3(ro / n); ent.m = r3(me / n);
    table[name] = ent; credits.push(`t-${name}-*.jpg: ${t.credit}`); prev[name] = { id, t: ent, c: credits[credits.length - 1] };
    const kb = ["c", "n", "m"].reduce((s, k) => s + fs.statSync(out(k)).size, 0) / 1024;
    console.log(`tex ${name.padEnd(13)} ${id.padEnd(28)} ${String(ent.s).padStart(5)} m  rgb ${ent.a.join(",")} rough ${ent.r} ${Math.round(kb)} KB`);
  }
  fs.writeFileSync(path.join(CACHE, "tex-table.json"), JSON.stringify(prev));
  const lines = Object.keys(table).map(k => `  ${k}: ${JSON.stringify(table[k]).replace(/"/g, "")},`).join("\n");
  fs.writeFileSync(tf, "// Generated by tools/assets.js: scanned texture sets in models/t-<name>-*.jpg.\n// s, sy = metres one tile covers; a = average linear colour; r, m = average roughness, metalness; e = has emission map; o = has opacity map\nconst NX_TEX = {\n" + lines + "\n};\n");
  return credits;
}

// ---- skies: Radiance .hdr -> viewable JPG, small RGBE env map, sun + coarse sky table for the baker
function readHDR(file) {
  const b = fs.readFileSync(file); let p = 0, line = "";
  const rl = () => { let s = ""; while (b[p] !== 10) s += String.fromCharCode(b[p++]); p++; return s; };
  while ((line = rl()) !== "") { }
  const m = /-Y (\d+) \+X (\d+)/.exec(rl()); if (!m) throw new Error("unsupported HDR layout");
  const h = +m[1], w = +m[2], out = new Float32Array(w * h * 3), row = new Uint8Array(w * 4);
  for (let y = 0; y < h; y++) {
    if (b[p] !== 2 || b[p + 1] !== 2) throw new Error("only RLE HDR files are supported"); p += 4;
    for (let c = 0; c < 4; c++) { let x = 0; while (x < w) { let n = b[p++]; if (n > 128) { n -= 128; const v = b[p++]; while (n--) row[x++ * 4 + c] = v; } else while (n--) row[x++ * 4 + c] = b[p++]; } }
    for (let x = 0; x < w; x++) { const e = row[x * 4 + 3], f = e ? Math.pow(2, e - 136) : 0, o = (y * w + x) * 3; out[o] = row[x * 4] * f; out[o + 1] = row[x * 4 + 1] * f; out[o + 2] = row[x * 4 + 2] * f; }
  }
  return { w, h, d: out };
}
async function doSky() {
  const credits = [], table = {}; fs.mkdirSync(path.join(__dirname, "sky"), { recursive: true });
  for (const [name, id, o0] of SKY) {
    if (only.length && !only.includes(name)) continue;
    const o = o0 || {}, dir = path.join(CACHE, "sky", id), info = getJson("https://api.polyhaven.com/info/" + id, path.join(dir, "info.json"));
    credits.push(`sky-${name}*: ${info.name} by ${Object.keys(info.authors || {}).join(", ")} (Poly Haven, CC0) https://polyhaven.com/a/${id}`);
    const jsonOut = path.join(__dirname, "sky", name + ".json");
    if (!force && fs.existsSync(jsonOut) && fs.existsSync(path.join(OUT, `sky-${name}.jpg`)) && fs.existsSync(path.join(OUT, `sky-${name}-env.png`))) { const j = JSON.parse(fs.readFileSync(jsonOut, 'utf8')); table[name] = { sun: j.sunDir, expo: j.expo, e: j.skyE }; continue; }
    const hdr = readHDR(get(`https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/${id}_2k.hdr`, path.join(dir, id + "_2k.hdr"))), { w, h, d } = hdr;
    // the sun: brightest small disc. Everything brighter than the cap inside 6 degrees of it belongs to the sun.
    let bi = 0, bv = 0; for (let i = 0; i < w * h; i++) { const l = d[i * 3] * 0.2126 + d[i * 3 + 1] * 0.7152 + d[i * 3 + 2] * 0.0722; if (l > bv) { bv = l; bi = i; } }
    const dirOf = (x, y) => { const th = (y + 0.5) / h * Math.PI, ph = (x + 0.5) / w * 2 * Math.PI; return [-Math.sin(th) * Math.cos(ph), Math.cos(th), -Math.sin(th) * Math.sin(ph)]; };
    const sd = dirOf(bi % w, (bi / w) | 0), lum = (i) => d[i * 3] * 0.2126 + d[i * 3 + 1] * 0.7152 + d[i * 3 + 2] * 0.0722;
    // median luminance of the upper hemisphere sets the exposure of the visible sky
    const up = []; for (let y = 0; y < h / 2; y += 4) for (let x = 0; x < w; x += 4) up.push(lum(y * w + x)); up.sort((a, b) => a - b);
    const med = up[up.length >> 1], cap = Math.max(med * 12, up[Math.floor(up.length * 0.995)]);
    const sun = [0, 0, 0]; let sunSr = 0; const hasSun = bv > cap * 4 && sd[1] > -0.05;
    const sky = new Float32Array(d);
    if (hasSun) for (let y = 0; y < h; y++) { const th = (y + 0.5) / h * Math.PI, dw = Math.sin(th) * (Math.PI / h) * (2 * Math.PI / w); for (let x = 0; x < w; x++) { const v = dirOf(x, y), i = y * w + x; if (v[0] * sd[0] + v[1] * sd[1] + v[2] * sd[2] < 0.9945) continue; const l = lum(i); if (l <= cap) continue; const k = cap / l; for (let c = 0; c < 3; c++) { sun[c] += d[i * 3 + c] * (1 - k) * dw; sky[i * 3 + c] = d[i * 3 + c] * k; } sunSr += dw; } }
    // coarse sky radiance table for the baker (32 x 16, sun removed), energy-preserving box filter
    const TW = 32, TH = 16, tab = new Float32Array(TW * TH * 3), cnt = new Float32Array(TW * TH);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = ((y * TH / h) | 0) * TW + ((x * TW / w) | 0), i = y * w + x; tab[t * 3] += sky[i * 3]; tab[t * 3 + 1] += sky[i * 3 + 1]; tab[t * 3 + 2] += sky[i * 3 + 2]; cnt[t]++; }
    for (let t = 0; t < TW * TH; t++) for (let c = 0; c < 3; c++) tab[t * 3 + c] /= cnt[t];
    // irradiance of the sky alone on flat ground, used to bring every sky to a known brightness
    let E = [0, 0, 0]; for (let y = 0; y < TH / 2; y++) { const th = (y + 0.5) / TH * Math.PI, dw = Math.sin(th) * (Math.PI / TH) * (2 * Math.PI / TW); for (let x = 0; x < TW; x++) for (let c = 0; c < 3; c++) E[c] += tab[(y * TW + x) * 3 + c] * Math.cos(th) * dw; }
    const expo = +(0.22 / med).toPrecision(4);
    fs.writeFileSync(jsonOut, JSON.stringify({ id, sunDir: sd.map(r3), sun: hasSun ? sun.map(v => +v.toPrecision(4)) : null, skyE: E.map(v => +v.toPrecision(4)), med: +med.toPrecision(4), expo, tw: TW, th: TH, tab: Array.from(tab, v => +v.toPrecision(4)) }));
    table[name] = { sun: sd.map(r3), expo, e: E.map(v => +v.toPrecision(4)) };
    // visible sky: 4096 x 2048 JPG, exposed so the median sky sits at 0.22 before the display curve; the runtime multiplies it back
    const VW = 4096, VH = 2048, big = Buffer.alloc(w * h * 3);
    const tm = (v) => { v *= expo; v = v / (1 + v * 0.6); return Math.max(0, Math.min(255, Math.round(Math.pow(Math.min(1, v), 1 / 2.2) * 255))); };
    for (let i = 0; i < w * h * 3; i++) big[i] = tm(d[i]);
    await sharp(big, { raw: { width: w, height: h, channels: 3 } }).resize(VW, VH, { kernel: "lanczos3" }).jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(path.join(OUT, `sky-${name}.jpg`));
    // env map for reflections: 512 x 256 RGBE in a PNG (sun kept but capped at 60x the median so reflections do not sparkle)
    const EW = 512, EH = 256, env = Buffer.alloc(EW * EH * 4), acc = new Float32Array(EW * EH * 3), cn = new Float32Array(EW * EH), cap2 = med * 60;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = ((y * EH / h) | 0) * EW + ((x * EW / w) | 0), i = y * w + x; for (let c = 0; c < 3; c++) acc[t * 3 + c] += Math.min(d[i * 3 + c], cap2); cn[t]++; }
    for (let t = 0; t < EW * EH; t++) { const r = acc[t * 3] / cn[t], g = acc[t * 3 + 1] / cn[t], bl = acc[t * 3 + 2] / cn[t], m = Math.max(r, g, bl); if (m < 1e-32) continue; let e = Math.ceil(Math.log2(m)); const f = Math.pow(2, 8 - e); env[t * 4] = Math.min(255, r * f); env[t * 4 + 1] = Math.min(255, g * f); env[t * 4 + 2] = Math.min(255, bl * f); env[t * 4 + 3] = e + 128; }
    await sharp(env, { raw: { width: EW, height: EH, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(OUT, `sky-${name}-env.png`));
    console.log(`sky ${name.padEnd(8)} ${id.padEnd(40)} sun ${hasSun ? sd.map(v => v.toFixed(2)).join(",") + " E " + sun.map(v => v.toFixed(1)).join(",") : "none"} skyE ${E.map(v => v.toFixed(2)).join(",")} med ${med.toFixed(3)} expo ${expo.toFixed(2)}`);
  }
  if (!only.length) fs.writeFileSync(path.join(ROOT, 'src/10b-nx-sky.js'), '// Generated by tools/assets.js: skies in models/sky-<name>.jpg (+ -env.png). sun = direction of the brightest point,\n// expo = exposure the JPG was written with, e = irradiance of the raw sky on flat ground\nconst NX_SKY = ' + JSON.stringify(table).replace(/"/g, '') + ';\n');
  return credits;
}

(async () => {
  const credits = [];
  if (what === "tex" || what === "all") credits.push(...await doTex());
  if (what === "sky" || what === "all") credits.push(...await doSky());
  if (!only.length && what === "all") {
    const cf = path.join(OUT, "CREDITS.txt"), mark = "\n== Scanned materials and skies (generated by tools/assets.js) ==\n";
    let txt = fs.existsSync(cf) ? fs.readFileSync(cf, "utf8") : ""; const at = txt.indexOf(mark); if (at >= 0) txt = txt.slice(0, at);
    fs.writeFileSync(cf, txt.replace(/\s+$/, "") + "\n" + mark + credits.join("\n") + "\n");
  }
})().catch(e => { console.error(e); process.exit(1); });
