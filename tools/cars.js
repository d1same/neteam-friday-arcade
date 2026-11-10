#!/usr/bin/env node
// Race cars: slims the four Grab3D CC0 cars (assets-src/models/cars, see models/CREDITS.txt) for the game.
//   textures 2048 -> 1024; the red channel of the metal/rough picture (unused by glTF) becomes a paint mask, so the
//   game can respray each car in its driver's colour in the shader (1 = paint, 0 = everything else)
//   writes server/public/models/car-<id>.glb.  usage: node tools/cars.js
const path = require("path"), sharp = require("sharp");
const { NodeIO } = require("@gltf-transform/core");
const { ALL_EXTENSIONS } = require("@gltf-transform/extensions");
const { dedup, prune, quantize } = require("@gltf-transform/functions");
const ROOT = path.join(__dirname, ".."), SRC = path.join(ROOT, "assets-src/models/cars"), OUT = path.join(ROOT, "server/public/models");
// id, source, paint hue to mask (degrees, null = keep the factory paint)
const CARS = [["gt60", "1960s-sports-car", 45], ["gt80", "1980s-sports-car", 352], ["gt90", "1990s-sports-car", 172], ["cop", "1990s-police-car", null]];
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx / 255]; };
(async () => {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  for (const [id, src, hue] of CARS) {
    const doc = await io.read(path.join(SRC, "grab3d_" + src + ".glb")), root = doc.getRoot();
    const body = root.listMaterials().find(m => /body_pbr/.test(m.getName())), cT = body.getBaseColorTexture(), mT = body.getMetallicRoughnessTexture(), nT = body.getNormalTexture();
    const S = 1024, col = await sharp(Buffer.from(cT.getImage())).resize(S, S).removeAlpha().raw().toBuffer();
    let mean = [0, 0, 0], n = 0; const mask = Buffer.alloc(S * S);
    if (hue != null) for (let i = 0; i < S * S; i++) { const [h, s, v] = hsv(col[i * 3], col[i * 3 + 1], col[i * 3 + 2]), dh = Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue));
      const k = Math.max(0, Math.min(1, (24 - dh) / 8)) * Math.max(0, Math.min(1, (s - 0.22) / 0.12)) * Math.max(0, Math.min(1, (v - 0.2) / 0.1)); mask[i] = Math.round(k * 255);
      if (k > 0.9) { for (let c = 0; c < 3; c++) mean[c] += lin(col[i * 3 + c]); n++; } }
    const mr = await sharp(Buffer.from(mT.getImage())).resize(S, S).removeAlpha().raw().toBuffer();
    for (let i = 0; i < S * S; i++) mr[i * 3] = mask[i];
    cT.setImage(await sharp(col, { raw: { width: S, height: S, channels: 3 } }).jpeg({ quality: 86 }).toBuffer());
    mT.setImage(await sharp(mr, { raw: { width: S, height: S, channels: 3 } }).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer());
    nT.setImage(await sharp(Buffer.from(nT.getImage())).resize(S, S).jpeg({ quality: 88 }).toBuffer());
    for (const n2 of root.listNodes()) n2.setName(n2.getName().replace(src, "car"));
    root.listScenes()[0].setExtras({ paintLum: n ? +((0.2126 * mean[0] + 0.7152 * mean[1] + 0.0722 * mean[2]) / n).toFixed(4) : 0, paintPx: n });
    await doc.transform(dedup(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }));
    const f = path.join(OUT, "car-" + id + ".glb"); await io.write(f, doc);
    console.log(id, (require("fs").statSync(f).size / 1024).toFixed(0) + " KB", "paint px", n, n ? ((0.2126 * mean[0] + 0.7152 * mean[1] + 0.0722 * mean[2]) / n).toFixed(3) : "");
  }
})();
