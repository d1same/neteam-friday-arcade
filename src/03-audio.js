// ---------- sound (recorded samples with synthesised fallbacks, starts after first interaction) ----------
const SFX = {
  on: store("nfa-sound") !== false,
  ctx: null,
  ensure() {
    if (!this.on) return null;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
    } catch (e) { return null; }
    return this.ctx;
  },
  tone(freq, dur = 0.12, type = "square", vol = 0.08, slide = 0, delay = 0) {
    const a = this.ensure(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.dest(a)); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur = 0.2, vol = 0.08, freq = 900) {
    const a = this.ensure(); if (!a) return;
    const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(); s.buffer = b;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq;
    const g = a.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(this.dest(a)); s.start();
  },
  // recorded samples (CC0, see sfx/CREDITS.txt); every caller falls back to the synth until a sample has loaded
  // menus (real switches), announcements (war drums, crowd), hits, cases, air and electricity: see sfx/CREDITS.txt
  NEW: "ui-tick ui-on ui-off ui-deny drum1 drum-go drum-win drum-low crowd1 applause1 thud1 thwack1 thwack2 tick1 tink1 casing1 casing2 casing3 metal2 fall1 pickup1 air1 air2 steam1 zap1 zap2 power-down shield1 laser1 laser2 land1 eng-idle.wav eng-mid.wav shot-lmg shot-scout far-pistol far-smg far-rifle far-carbine far-sniper far-shotgun far-heavy far-lmg far-scout bolt-up bolt-back bolt-fwd bolt-down clip1 clip2 bullet1 rl-ar gun-pistol gun-heavy gun-smg gun-rifle gun-carbine gun-sniper gun-shotgun gun-lmg gun-scout gunm-pistol gunm-heavy gunm-smg gunm-rifle gunm-carbine gunm-sniper gunm-shotgun gunm-lmg gunm-scout fb-hit fb-tick fb-flesh fb-head fb-ping fb-kill fb-killhead fb-win fb-lose imp-metal1 imp-metal2 imp-metal3 imp-metal4 imp-metal5 imp-metal6 imp-metal7 ric1 ric2 ric3 ric4 imp-wood1 flyby1 crack1 war-bed war-far1 war-far2 war-far3 war-far4 war-far5 boom-near1 boom-near2 boom-near3 debris1 debris2 car-e1 car-e2 car-e3 car-skid car-shift1 car-shift2 car-clunk car-pop1 car-pop2 car-crash1 car-crash2 car-crash3 car-pass",
  S: {}, _ld: 0, SV: 17,   // bump when recordings are replaced under the same name (the server caches /sfx for 7 days)
  load() {
    const a = this.ctx; if (!a || this._ld) return; this._ld = 1;
    ("shot-pistol shot-heavy shot-smg shot-rifle shot-carbine shot-sniper shot-shotgun shot-far rl-pistol rl-rifle rl-shell rl-pump click1 click2 step1 step2 step3 step4 step5 boom1 boom2 boom3 swing1 swing2 hit-wood hit-glass hit-metal hit-wall " + this.NEW).split(" ").forEach((n) => {
      fetch("sfx/" + (n.includes(".") ? n : n + ".mp3") + "?v=" + this.SV).then(r => r.ok ? r.arrayBuffer() : null).then(b => b && a.decodeAudioData(b, (buf) => { this.S[n.replace(/\.wav$/, "")] = buf; }, () => {})).catch(() => {});
    });
  },
  // play a sample: far 0..1 muffles it; returns false when it is not loaded so the caller can synthesise instead
  // how loud something is at d metres: about -6 dB per doubling of distance past R metres (R = 0 m gives 1)
  fall(d, R = 8) { return Math.pow(R / (R + Math.max(0, d)), 1.3); },
  // handling foley (reloads, bolts, clicks) was recorded and saved far hotter than the gunshots: up to 10 dB louder in the
  // loudest 50 ms. Each file's own trim brings it to about -24 dB at volume 1, so a reload sits about 11 dB under a shot
  TRIM: { "rl-rifle": 0.18, "rl-ar": 0.3, "rl-pistol": 0.09, "rl-shell": 0.11, "rl-pump": 0.09, "bolt-up": 0.43, "bolt-back": 0.3, "bolt-fwd": 0.27, "bolt-down": 0.56,
    clip1: 0.23, clip2: 0.64, bullet1: 0.86, click1: 0.18, click2: 0.57 },
  samp(name, vol = 1, pan = 0, rate = 1, far = 0, delay = 0, wet = 1) {
    const a = this.ensure(); if (!a) return true; this.load(); const b = this.S[name]; if (!b) return false; vol *= this.TRIM[name] || 1; if (vol < 0.003) return true;
    const s = a.createBufferSource(); s.buffer = b; s.playbackRate.value = rate; let n = s;
    if (far > 0.05) { const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 14000 * Math.pow(1 - Math.min(far, 0.95), 2) + 500; n = s.connect(f); }
    n.connect(this.out(a, vol, pan, wet)); s.start(a.currentTime + delay); return true;
  },
  // a soft dry tap of noise: what a menu or event sound falls back to in the first second, before its recording has loaded
  tap(vol = 0.3, freq = 1800) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, vol * 0.4, 0, 0), s = a.createBufferSource(); s.buffer = this.noiseBuf(a);
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.1; const g = a.createGain(); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.07);
  },
  _nb: null,
  noiseBuf(a) { if (this._nb && this._nb.sampleRate === a.sampleRate) return this._nb; const n = a.sampleRate * 1.5, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (this._nb = b); },
  // ---- the mix: everything goes through one master bus (a limiter keeps bursts of gunfire from clipping) and a shared
  // reverb whose size follows the place you are in (SFX.space). `wet` scales how much of a sound reaches the reverb.
  vol: typeof store("nfa-vol") === "number" ? store("nfa-vol") : 1, _bus: null, _space: "room",
  setVol(v) { this.vol = Math.max(0, Math.min(1, v)); store("nfa-vol", this.vol); const B = this._bus; if (B && this.on) B.master.gain.setTargetAtTime(this.vol, B.a.currentTime, 0.05); },
  // [where the soft clipper starts to bend (linear, 0..1), gain into it]
  MIX: [0.7, 1],
  softClip(k) { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = ((i / (n - 1)) * 2 - 1) * 2, ax = Math.abs(x);   // the curve covers -2..2: the input is halved going in
    c[i] = Math.sign(x) * (ax <= k ? ax : k + (1 - k) * Math.tanh((ax - k) / (1 - k))); } return c; },
  bus(a) {
    if (this._bus && this._bus.a === a) return this._bus;
    const master = a.createGain(); master.gain.value = this.vol;
    // no compressor on the master: the browser's compressor adds its own make-up gain and reacts to short peaks, so the
    // old one (-16 dB, 5:1) and even a -1.5 dB limiter pulled a gunshot down 10 dB or more while lifting quiet sounds,
    // and a reload came out as loud as a shot. Instead a soft clipper: straight through up to -3 dBFS, then a smooth
    // curve that never passes full scale. A shot keeps its crack and only a burst that would clip is rounded off
    const C = this.MIX, mu = a.createGain(); mu.gain.value = C[1] * 0.5;
    const comp = a.createWaveShaper(); comp.curve = this.softClip(C[0]); comp.oversample = "2x";
    const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 20000; lp.Q.value = 0.3;
    master.connect(lp).connect(mu).connect(comp).connect(a.destination);
    const send = a.createGain(), rev = a.createConvolver(), wet = a.createGain(); send.connect(rev).connect(wet).connect(master);
    this._bus = { a, master, comp, send, rev, wet, lp, mk: 0 }; this.space(this._space); return this._bus;
  },
  // dull the whole mix (0 = clear, 1 = under water): used while badly hurt
  muffle(k) { const B = this._bus; if (!B || k === B.mk || (k > 0 && Math.abs(k - B.mk) < 0.02)) return; B.mk = k; B.lp.frequency.setTargetAtTime(20000 * Math.pow(0.04, k), B.a.currentTime, 0.12); },
  dest(a) { return this.bus(a).master; },
  // an impulse response made of decaying noise with a few early echoes: length in seconds, damping 0..1 (1 = dull)
  ir(a, len, damp, early, taps) {
    const sr = a.sampleRate, n = Math.floor(sr * len), b = a.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; const k = 1 - damp * 0.9;
      for (let i = 0; i < n; i++) { const t = i / n, e = Math.pow(1 - t, 2.2) * Math.exp(-t * 2.4); lp += ((Math.random() * 2 - 1) - lp) * (k * (1 - t * 0.7) + 0.02); d[i] = lp * e * (i < sr * 0.006 ? i / (sr * 0.006) : 1); }
      // outdoors: slap-back off the buildings around, later and softer each time
      if (taps) taps.forEach(([at0, g0]) => { const at = Math.floor(sr * (at0 + (c ? 0.013 : 0) + Math.random() * 0.01)), ln = Math.floor(sr * 0.05); let q0 = 0; for (let q = 0; q < ln && at + q < n; q++) { q0 += ((Math.random() * 2 - 1) - q0) * 0.35; d[at + q] += q0 * g0 * Math.pow(1 - q / ln, 2); } });
      for (let j = 0; j < early; j++) { const at = Math.floor(sr * (0.011 + Math.random() * 0.07)), g = 0.5 - j * 0.06; for (let q = 0; q < 40 && at + q < n; q++) d[at + q] += (Math.random() * 2 - 1) * g * (1 - q / 40); } }
    return b;
  },
  SPACES: { room: [0.55, 0.5, 5, 0.14], hall: [1.05, 0.4, 6, 0.17], vault: [1.3, 0.35, 6, 0.19], street: [1.6, 0.6, 3, 0.16, [[0.09, 0.9], [0.17, 0.7], [0.29, 0.55], [0.46, 0.4], [0.7, 0.28], [1.0, 0.18]]], open: [1.8, 0.65, 2, 0.15, [[0.12, 0.8], [0.23, 0.6], [0.38, 0.5], [0.6, 0.36], [0.9, 0.24], [1.3, 0.14]]], dry: [0.3, 0.6, 2, 0.04] },
  // the rooms as they were before the gun sound rework, for the old/new switch on the sound page
  OLD_SPACES: { room: [0.55, 0.5, 5, 0.14], hall: [1.05, 0.4, 6, 0.17], vault: [1.3, 0.35, 6, 0.19], street: [0.9, 0.6, 3, 0.1], open: [0.6, 0.7, 2, 0.06], dry: [0.3, 0.6, 2, 0.04] },
  space(kind) {
    this._space = this.SPACES[kind] ? kind : "room"; const B = this._bus; if (!B) return; const key = this._space + (this.legacy ? "-old" : "");
    if (B.kind !== key) { const P = (this.legacy ? this.OLD_SPACES : this.SPACES)[this._space]; try { B.rev.buffer = this.ir(B.a, P[0], P[1], P[2], P[4]); } catch (e) {} B.wet.gain.value = P[3]; B.kind = key; }
  },
  out(a, vol, pan, wet = 1) {
    const B = this.bus(a), g = a.createGain(); g.gain.value = vol; let n = g;
    if (a.createStereoPanner && pan) { const p = a.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); n = p; }
    n.connect(B.master); if (wet > 0) { if (wet === 1) n.connect(B.send); else { const w = a.createGain(); w.gain.value = wet; n.connect(w).connect(B.send); } }
    return g;
  },
  // a looping band of noise you can steer while it plays: wind, tyres, fans, rain
  nloop(a, type, freq, q, wet = 0.3) {
    const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); s.loop = true; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = a.createGain(); g.gain.value = 0; const p = a.createStereoPanner ? a.createStereoPanner() : null, B = this.bus(a);
    s.connect(f).connect(g); const end = p ? g.connect(p) : g; end.connect(B.master); if (wet > 0) { const w = a.createGain(); w.gain.value = wet; end.connect(w).connect(B.send); }
    s.start(a.currentTime, Math.random());
    return { f, g, p, set(vol, fr, pan) { const t = a.currentTime; g.gain.setTargetAtTime(vol, t, 0.08); if (fr) f.frequency.setTargetAtTime(fr, t, 0.08); if (p && pan != null) p.pan.setTargetAtTime(pan, t, 0.08); }, stop() { try { g.gain.setTargetAtTime(0, a.currentTime, 0.1); s.stop(a.currentTime + 0.5); } catch (e) {} } };
  },
  // a recorded loop (tyre squeal, ...): set(vol, rate) every frame; silent until the recording has loaded
  sloop(name, wet = 0.2) {
    const a = this.ensure(); if (!a) return null; let s = null, g = null;
    const on = () => { if (s || !this.S[name]) return !!s; const B = this.bus(a); s = a.createBufferSource(); s.buffer = this.S[name]; s.loop = true; g = a.createGain(); g.gain.value = 0; s.connect(g); g.connect(B.master); if (wet) { const w = a.createGain(); w.gain.value = wet; g.connect(w).connect(B.send); } s.start(a.currentTime, Math.random() * s.buffer.duration); return true; };
    return { ok: () => on(), set(v, rate) { if (!on()) return; g.gain.setTargetAtTime(Math.max(0, v), a.currentTime, 0.05); if (rate) s.playbackRate.setTargetAtTime(rate, a.currentTime, 0.08); }, stop() { try { if (s) { g.gain.setTargetAtTime(0, a.currentTime, 0.05); s.stop(a.currentTime + 0.3); } } catch (e) {} } };
  },
  // ---- ambience: a bed of sound for each place, built from filtered noise and a few hums. SFX.amb(null) stops it.
  _amb: null,
  amb(kind) {
    this._ambWant = kind || null; if (this._amb && this._amb.kind === kind) return; if (this._amb) { this._amb.stop(); this._amb = null; }
    const a = kind ? this.ensure() : null; if (!a) return;
    const parts = [], timers = [], B = this.bus(a), t = a.currentTime;
    const bed = (type, f, q, vol, wet) => { const n = this.nloop(a, type, f, q, wet == null ? 0.2 : wet); n.set(vol); parts.push(n); return n; };
    const hum = (f, vol, type) => { const o = a.createOscillator(), g = a.createGain(); o.type = type || "sine"; o.frequency.value = f; g.gain.value = 0; g.gain.setTargetAtTime(vol, t, 0.8); o.connect(g).connect(B.master); o.start(); parts.push({ stop() { try { g.gain.setTargetAtTime(0, a.currentTime, 0.1); o.stop(a.currentTime + 0.5); } catch (e) {} } }); };
    const sway = (n, f0, f1, v0, v1, every) => { const go = () => { const k = Math.random(); n.g.gain.setTargetAtTime(v0 + (v1 - v0) * k, a.currentTime, every * 0.35); n.f.frequency.setTargetAtTime(f0 + (f1 - f0) * Math.random(), a.currentTime, every * 0.35); }; go(); timers.push(setInterval(go, every * 1000)); };
    if (kind === "office") { bed("lowpass", 240, 0.3, 0.05); bed("bandpass", 2600, 0.4, 0.004); hum(100, 0.006); hum(200, 0.002); }
    else if (kind === "farm") { bed("lowpass", 320, 0.4, 0.085); sway(bed("bandpass", 760, 1.6, 0.03), 700, 840, 0.022, 0.036, 3.1); bed("bandpass", 3300, 3, 0.006); hum(120, 0.012); hum(240, 0.005); hum(59, 0.014); }
    else if (kind === "vault") { bed("lowpass", 150, 0.5, 0.08); hum(55, 0.02); hum(110.6, 0.006); bed("bandpass", 1900, 2.5, 0.003); }
    else if (kind === "desert") { sway(bed("bandpass", 480, 0.7, 0.03, 0.1), 300, 800, 0.016, 0.06, 2.7); sway(bed("bandpass", 1500, 1.2, 0.006, 0.1), 1100, 2400, 0.002, 0.014, 3.9); }
    else if (kind === "roof") { sway(bed("bandpass", 420, 0.6, 0.04, 0.1), 260, 700, 0.025, 0.075, 2.4); bed("lowpass", 110, 0.4, 0.09, 0); sway(bed("bandpass", 2000, 1, 0.004, 0.1), 1400, 3000, 0.002, 0.012, 3.3); }
    else if (kind === "city") { bed("lowpass", 130, 0.4, 0.08, 0); sway(bed("bandpass", 900, 0.5, 0.012), 700, 1300, 0.008, 0.02, 2.9); }
    else if (kind === "rain") { bed("lowpass", 130, 0.4, 0.06, 0); bed("highpass", 5200, 0.3, 0.02, 0.1); sway(bed("bandpass", 2300, 0.4, 0.02, 0.1), 1800, 3000, 0.014, 0.03, 2.2); sway(bed("bandpass", 420, 0.6, 0.02, 0.1), 300, 620, 0.012, 0.04, 3.4); }
    else if (kind === "night") { bed("lowpass", 120, 0.4, 0.07, 0); sway(bed("bandpass", 1000, 0.5, 0.008), 800, 1500, 0.005, 0.014, 3.1); hum(60, 0.004); }
    // a war going on somewhere else: a recorded firefight far off (through the walls indoors) and now and then a distant tank, artillery or demolition
    const WAR = { office: [0.045, 520], farm: [0.05, 600], vault: [0.035, 380], desert: [0.1, 2200], roof: [0.09, 2000] }[kind];
    if (WAR && !this.legacy) {
      const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = WAR[1]; lp.Q.value = 0.5; lp.connect(B.master);
      const g = a.createGain(); g.gain.value = 0; g.connect(lp); let src = null;
      const bedOn = () => { const buf = this.S["war-bed"]; if (src || !buf) return; src = a.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(g); src.start(a.currentTime, Math.random() * buf.duration * 0.9); g.gain.setTargetAtTime(WAR[0], a.currentTime, 1.5); };
      bedOn(); timers.push(setInterval(bedOn, 1500));
      const far = () => { const buf = this.S["war-far" + (1 + (Math.random() * 5 | 0))]; if (buf && this.on) { const s = a.createBufferSource(), gg = a.createGain(), pn = a.createStereoPanner ? a.createStereoPanner() : null; s.buffer = buf; s.playbackRate.value = 0.88 + Math.random() * 0.2; gg.gain.value = WAR[0] * (2 + Math.random() * 2.5); s.connect(gg); if (pn) { pn.pan.value = Math.random() * 1.6 - 0.8; gg.connect(pn).connect(lp); } else gg.connect(lp); s.start(); }
        timers.push(setTimeout(far, 12000 + Math.random() * 30000)); };
      timers.push(setTimeout(far, 6000 + Math.random() * 12000));
      parts.push({ stop() { try { g.gain.setTargetAtTime(0, a.currentTime, 0.3); if (src) src.stop(a.currentTime + 1.5); setTimeout(() => lp.disconnect(), 9000); } catch (e) {} } });
    }
    this._amb = { kind, stop() { timers.forEach(clearInterval); parts.forEach(q => q.stop()); } };
  },
  // call once a frame: follows the sound switch (mutes the bus) and starts the ambience once sound is allowed
  sync() {
    const B = this._bus; if (B && B.on !== this.on) { B.on = this.on; B.master.gain.setTargetAtTime(this.on ? this.vol : 0, B.a.currentTime, 0.05); }
    if (this.on && this._ambWant && !this._amb) this.amb(this._ambWant);
  },
  floor: "hard",
  // ---- engine: saw harmonics through a drive stage and a filter that opens with revs and throttle. rev 0..1, load 0..1.
  engine(big) {
    const a = this.ensure(); if (!a) return null; const B = this.bus(a), t = a.currentTime;
    const drive = a.createWaveShaper(), cv = new Float32Array(257); for (let i = 0; i < 257; i++) { const x = i / 128 - 1; cv[i] = Math.tanh(x * 2.6); } drive.curve = cv;
    const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500; lp.Q.value = 1.1;
    const pk = a.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = 820; pk.Q.value = 1.4; pk.gain.value = 7;
    const out = a.createGain(); out.gain.value = 0; const pan = a.createStereoPanner ? a.createStereoPanner() : null;
    const os = (big ? [["sawtooth", 1, 0.5], ["sawtooth", 2.006, 0.3], ["square", 0.5, 0.34], ["sawtooth", 1.5, 0.14]] : [["sawtooth", 1, 0.55], ["square", 0.5, 0.3]]).map(([type, mul, g]) => { const o = a.createOscillator(), og = a.createGain(); o.type = type; o.frequency.value = 50 * mul; og.gain.value = g; o.connect(og).connect(drive); o.start(t); return { o, mul }; });
    // the lumpy idle: the level wobbles at half the firing rate
    const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 20; lg.gain.value = 0; lfo.connect(lg).connect(out.gain); lfo.start(t);
    const ns = a.createBufferSource(); ns.buffer = this.noiseBuf(a); ns.loop = true; const nf = a.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 900; nf.Q.value = 0.8; const ng = a.createGain(); ng.gain.value = 0; ns.connect(nf).connect(ng).connect(out); ns.start(t, Math.random());
    drive.connect(lp).connect(pk).connect(out); const end = pan ? out.connect(pan) : out; end.connect(B.master); const w = a.createGain(); w.gain.value = 0.25; end.connect(w).connect(B.send);
    const S = this.S; let R = null;
    const rec = () => {
      if (R) return R;
      const v2 = !this.legacy && S["car-e1"] && S["car-e2"] && S["car-e3"];
      if (!v2 && (!S["eng-idle"] || !S["eng-mid"])) return R;
      const lp2 = a.createBiquadFilter(); lp2.type = "lowpass"; lp2.Q.value = 0.7; lp2.frequency.value = 1200; const o2 = a.createGain(); o2.gain.value = 0;
      const mk = (buf) => { const s = a.createBufferSource(), g = a.createGain(); s.buffer = buf; s.loop = true; g.gain.value = 0; s.connect(g).connect(lp2); s.start(a.currentTime, Math.random() * buf.duration * 0.9); return { s, g }; };
      // a real petrol engine recorded under load at about 700, 2500 and 6500 rpm: the two nearest recordings blend and are pitched to the revs
      R = v2 ? { lp2, o2, v2: 1, L: [mk(S["car-e1"]), mk(S["car-e2"]), mk(S["car-e3"])], nat: [700, 2500, 6500] } : { lp2, o2, idle: mk(S["eng-idle"]), mid: mk(S["eng-mid"]) };
      lp2.connect(o2); o2.connect(pan || B.master); out.gain.cancelScheduledValues(a.currentTime); out.gain.value = 0; lg.gain.cancelScheduledValues(a.currentTime); lg.gain.value = 0; drive.disconnect(); out.disconnect(); if (pan) out.connect(pan);
      return R;
    };
    return {
      set(rev, load, vol, p, pitch) {
        const now = a.currentTime, f = (36 + rev * rev * 60 + rev * 96) * (pitch || 1), r = rec();
        if (r && r.v2) {
          const rpm = (800 + rev * 6000) * (pitch || 1), lr = Math.log(rpm), N = r.nat.map(Math.log);
          r.L.forEach((q, k) => { let w = 0; if (k > 0 && lr <= N[k] && lr >= N[k - 1]) w = (lr - N[k - 1]) / (N[k] - N[k - 1]); else if (k < N.length - 1 && lr >= N[k] && lr <= N[k + 1]) w = 1 - (lr - N[k]) / (N[k + 1] - N[k]); else if ((k === 0 && lr < N[0]) || (k === N.length - 1 && lr > N[k])) w = 1;
            q.s.playbackRate.setTargetAtTime(Math.min(1.7, Math.max(0.6, rpm / r.nat[k])), now, 0.05); q.g.gain.setTargetAtTime(Math.sin(w * Math.PI / 2), now, 0.06); });
          r.lp2.frequency.setTargetAtTime(700 + rev * 2600 + load * 2200, now, 0.06);
          r.o2.gain.setTargetAtTime(vol * 1.5 * (0.45 + 0.55 * load) * (0.7 + rev * 0.4), now, 0.06);
          if (pan && p != null) pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, p)), now, 0.08);
          return;
        }
        if (r) {
          const xf = Math.min(1, Math.max(0, (rev - 0.18) / 0.32)), sm = xf * xf * (3 - 2 * xf);
          r.idle.s.playbackRate.setTargetAtTime(Math.min(2.6, Math.max(0.85, f / 40)), now, 0.05); r.mid.s.playbackRate.setTargetAtTime(Math.min(1.4, Math.max(0.5, f / 150)), now, 0.05);
          r.idle.g.gain.setTargetAtTime(1 - sm, now, 0.08); r.mid.g.gain.setTargetAtTime(0.18 + sm * 0.9, now, 0.08);
          r.lp2.frequency.setTargetAtTime(480 + rev * 1700 + load * 1100, now, 0.06);
          r.o2.gain.setTargetAtTime(vol * 1.7 * (0.5 + 0.5 * load) * (0.75 + rev * 0.35), now, 0.06);
          if (pan && p != null) pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, p)), now, 0.08);
          return;
        }
        os.forEach(q => q.o.frequency.setTargetAtTime(f * q.mul, now, 0.04)); lfo.frequency.setTargetAtTime(f * 0.5, now, 0.05);
        lp.frequency.setTargetAtTime(260 + rev * 1500 + load * (700 + rev * 1700), now, 0.06); pk.frequency.setTargetAtTime(520 + rev * 900, now, 0.08);
        const v = vol * (0.42 + 0.58 * load) * (0.6 + rev * 0.4); out.gain.setTargetAtTime(v, now, 0.06); lg.gain.setTargetAtTime(v * 0.22 * (1 - rev * 0.7), now, 0.08);
        ng.gain.setTargetAtTime(vol * (0.03 + load * rev * 0.22), now, 0.08); nf.frequency.setTargetAtTime(700 + rev * 2600, now, 0.1);
        if (pan && p != null) pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, p)), now, 0.08);
      },
      stop() { try { out.gain.setTargetAtTime(0, a.currentTime, 0.08); const e = a.currentTime + 0.5; os.forEach(q => q.o.stop(e)); lfo.stop(e); ns.stop(e); if (R) { R.o2.gain.setTargetAtTime(0, a.currentTime, 0.08); (R.L || [R.idle, R.mid]).forEach(q => q.s.stop(e)); } } catch (e) {} },
    };
  },
  // ---- small one-shots
  _it: 0,
  // a bullet lands near you: 0 masonry, 1 metal; now and then it sings off as a ricochet
  impact(kind, vol, pan) {
    const a = this.ensure(); if (!a || vol < 0.02) return; const t = a.currentTime; if (t - this._it < 0.045) return; this._it = t;
    if (!this.legacy && kind && this.samp("imp-metal" + (1 + (Math.random() * 7 | 0)), vol * 0.5, pan, 0.9 + Math.random() * 0.2, 0, 0, 0.3)) { if (Math.random() < 0.3) this.samp("ric" + (1 + (Math.random() * 4 | 0)), vol * 0.32, pan, 0.92 + Math.random() * 0.16, 0, 0.015, 0.4); return; }
    if (!this.legacy && !kind && Math.random() < 0.06 && this.samp("ric" + (1 + (Math.random() * 4 | 0)), vol * 0.26, pan, 0.92 + Math.random() * 0.16, 0, 0.015, 0.4)) { this.samp("hit-wall", vol * 0.75, pan, 0.85 + Math.random() * 0.5, 0, 0, 0.3); return; }
    if (!this.samp(kind ? "hit-metal" : "hit-wall", vol * (kind ? 0.5 : 0.75), pan, 0.85 + Math.random() * 0.5, 0, 0, 0.3)) { const o = this.out(a, vol * 0.25, pan), s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = kind ? 3200 : 1300; f.Q.value = 1; const g = a.createGain(); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.1); }
    // now and then the round sings off the surface: air noise through a narrow filter that falls away (a pure tone here sounded like a cartoon)
    if (Math.random() < (kind ? 0.2 : 0.07)) { const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), f0 = 2400 + Math.random() * 2600; s.buffer = this.noiseBuf(a); f.type = "bandpass"; f.Q.value = 22; f.frequency.setValueAtTime(f0, t + 0.02); f.frequency.exponentialRampToValueAtTime(f0 * (0.4 + Math.random() * 0.2), t + 0.4); g.gain.setValueAtTime(0.0001, t + 0.02); g.gain.exponentialRampToValueAtTime(1, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42); s.connect(f).connect(g).connect(this.out(a, vol * 0.5, pan)); s.start(t + 0.02, Math.random(), 0.45); }
  },
  // a round passing close to your head
  whiz(pan) {
    const a = this.ensure(); if (!a) return;
    if (!this.legacy && this.S.flyby1 && this.S.crack1) { this.samp("crack1", 0.42, pan, 0.95 + Math.random() * 0.1, 0, 0, 0.25); this.samp("flyby1", 0.55, pan, 0.9 + Math.random() * 0.2, 0, 0.01, 0.3); return; }
    if (!this.legacy) { // the crack of a round breaking the sound barrier past your ear: a sharp N-shaped pressure wave
      const sr = a.sampleRate, n = Math.floor(sr * 0.006), b = this._crack || (this._crack = a.createBuffer(1, n, sr)), d = b.getChannelData(0);
      if (!this._crackOk) { this._crackOk = 1; const w = Math.floor(sr * 0.0012); for (let i = 0; i < n; i++) d[i] = i < w ? 1 - 2 * i / w : 0; for (let i = w; i < n; i++) d[i] += (Math.random() * 2 - 1) * 0.3 * Math.exp(-(i - w) / (sr * 0.0012)); }
      const s = a.createBufferSource(); s.buffer = b; const hp = a.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900; s.connect(hp).connect(this.out(a, 0.55, pan, 0.25)); s.start();
    }
    const t = a.currentTime, o = this.out(a, 0.34, pan, 0.4), s = a.createBufferSource(); s.buffer = this.noiseBuf(a);
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 3.5; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.13);
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.2);
  },
  // a spent case ringing on the floor
  casing(vol = 0.5, big = 0) {
    { const d = 0.42 + Math.random() * 0.12, pn = (Math.random() - 0.3) * 0.6, r = (big ? 0.8 : 1.25) + Math.random() * 0.3;   // recorded brass on a hard floor: one bounce, then a smaller one
      if (this.samp("casing" + (1 + (Math.random() * 3 | 0)), vol * 0.2, pn, r, 0, d, 0.08)) { this.samp("casing" + (1 + (Math.random() * 3 | 0)), vol * 0.09, pn, r * 1.12, 0, d + 0.09 + Math.random() * 0.06, 0.08); return; } }
    const a = this.ensure(); if (!a) return; const t = a.currentTime + 0.42 + Math.random() * 0.12, o = this.out(a, vol * 0.05, (Math.random() - 0.3) * 0.6);
    [0, 0.07 + Math.random() * 0.05, 0.2].forEach((d, k) => { const os = a.createOscillator(), g = a.createGain(), f = (big ? 1900 : 4300) + Math.random() * 1500; os.type = "sine"; os.frequency.setValueAtTime(f, t + d); g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(1 / (k + 1), t + d + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.09); os.connect(g).connect(o); os.start(t + d); os.stop(t + d + 0.1); });
  },
  // you dropped someone: a dry recorded thwack over a low thud, with a helmet tick for a headshot
  kill(head) {
    if (!this.legacy && this.samp(head ? "fb-killhead" : "fb-kill", 0.62, 0, 1, 0, 0, 0.1)) { if (head) this.samp("fb-ping", 0.32, 0, 0.92, 0, 0, 0.1); return; }
    if (this.samp("thwack1", 0.75, 0, head ? 1.1 : 0.94, 0, 0, 0.15)) { this.samp("thud1", 0.55, 0, 0.9, 0, 0.01, 0); if (head) this.samp("tink1", 0.5, 0, 0.9, 0, 0.02, 0.15); return; }
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, 0.3, 0, 0);
    const th = a.createOscillator(), tg = a.createGain(); th.type = "sine"; th.frequency.setValueAtTime(190, t); th.frequency.exponentialRampToValueAtTime(70, t + 0.12); tg.gain.setValueAtTime(0.9, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); th.connect(tg).connect(o); th.start(t); th.stop(t + 0.18);
    [head ? 1760 : 1175, head ? 2637 : 1568].forEach((f, k) => { const os = a.createOscillator(), g = a.createGain(); os.type = "triangle"; os.frequency.value = f; g.gain.setValueAtTime(0.0001, t + k * 0.06); g.gain.exponentialRampToValueAtTime(0.5, t + k * 0.06 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.06 + 0.3); os.connect(g).connect(o); os.start(t + k * 0.06); os.stop(t + k * 0.06 + 0.32); });
  },
  // your round landed: a dry recorded tick, a metal one for a head
  hit(head) {
    if (!this.legacy && this.samp(head ? "fb-head" : "fb-hit", head ? 0.55 : 0.5, 0, 0.96 + Math.random() * 0.08, 0, 0, 0)) { if (head) this.samp("fb-ping", 0.3, 0, 1 + Math.random() * 0.06, 0, 0, 0.1); else this.samp("fb-flesh", 0.22, 0, 0.95 + Math.random() * 0.1, 0, 0, 0); return; }
    if (this.samp(head ? "tink1" : "tick1", head ? 0.42 : 0.4, 0, 0.94 + Math.random() * 0.12, 0, 0, 0)) return;
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, 0.26, 0, 0);
    const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = head ? 5200 : 3400; f.Q.value = 2.2;
    const g = a.createGain(); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045); s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.06);
    (head ? [2093, 3136] : [1318]).forEach((fr, k) => { const os = a.createOscillator(), og = a.createGain(), d = k * 0.035; os.type = "triangle"; os.frequency.value = fr; og.gain.setValueAtTime(0.0001, t + d); og.gain.exponentialRampToValueAtTime(0.4, t + d + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.09); os.connect(og).connect(o); os.start(t + d); os.stop(t + d + 0.1); });
  },
  // you were hit: a dull body thump, heavier for big damage
  hurt(n = 20) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime, k = Math.min(1, n / 60), o = this.out(a, 0.3 + k * 0.25, 0, 0);
    const os = a.createOscillator(), g = a.createGain(); os.type = "sine"; os.frequency.setValueAtTime(150, t); os.frequency.exponentialRampToValueAtTime(48, t + 0.16); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); os.connect(g).connect(o); os.start(t); os.stop(t + 0.24);
    const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900; const ng = a.createGain(); ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); s.connect(f).connect(ng).connect(o); s.start(t, Math.random(), 0.1);
  },
  // heartbeat while badly hurt: two soft thumps
  heart(vol = 0.5) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, vol * 0.55, 0, 0);
    [0, 0.17].forEach((d, k) => { const os = a.createOscillator(), g = a.createGain(); os.type = "sine"; os.frequency.setValueAtTime(k ? 62 : 74, t + d); os.frequency.exponentialRampToValueAtTime(38, t + d + 0.12); g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(k ? 0.7 : 1, t + d + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.16); os.connect(g).connect(o); os.start(t + d); os.stop(t + d + 0.18); });
  },
  // bodywork meeting a barrier or another car: a thud, a crunch and a short scrape
  scrape(vol = 0.5, pan = 0) {
    const a = this.ensure(); if (!a || vol < 0.02) return; const t = a.currentTime, o = this.out(a, Math.min(1, vol) * 0.5, pan, 0.5);
    const os = a.createOscillator(), g = a.createGain(); os.type = "sine"; os.frequency.setValueAtTime(120, t); os.frequency.exponentialRampToValueAtTime(52, t + 0.12); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); os.connect(g).connect(o); os.start(t); os.stop(t + 0.18);
    [[1100, 1.2, 0.8, 0.14], [3100, 2.5, 0.35, 0.3]].forEach(([fr, q, lv, len]) => { const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(fr, t); f.frequency.exponentialRampToValueAtTime(fr * 0.6, t + len); f.Q.value = q; const ng = a.createGain(); ng.gain.setValueAtTime(lv, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + len); s.connect(f).connect(ng).connect(o); s.start(t, Math.random(), len + 0.02); });
  },
  // a crowd going up (recorded)
  cheer(vol = 0.5) {
    if (this.samp("crowd1", Math.min(1, vol * 1.1), 0, 0.96 + Math.random() * 0.08, 0, 0, 0.5)) return;
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, vol * 0.35, 0, 0.6);
    [[700, 0.6], [1250, 0.8], [2100, 0.9]].forEach(([fr, q], k) => { const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); s.loop = true; s.playbackRate.value = 0.7 + k * 0.2; const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = fr; f.Q.value = q;
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7 / (k + 1), t + 0.5 + k * 0.15); g.gain.setTargetAtTime(0.0001, t + 1.4, 0.7); s.connect(f).connect(g).connect(o); s.start(t, Math.random()); s.stop(t + 4.5); });
    for (let k = 0; k < 4; k++) { const d = 0.3 + Math.random() * 1.6, os = a.createOscillator(), g = a.createGain(), f0 = 1700 + Math.random() * 900; os.type = "sine"; os.frequency.setValueAtTime(f0, t + d); os.frequency.linearRampToValueAtTime(f0 * 1.35, t + d + 0.18); g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.3); os.connect(g).connect(o); os.start(t + d); os.stop(t + d + 0.32); }
  },
  // a rush of air: nitro, a car passing, a jump pad
  whoosh(vol = 0.5, pan = 0, up = 1) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, vol * 0.5, pan, 0.5), s = a.createBufferSource(); s.buffer = this.noiseBuf(a);
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.1; f.frequency.setValueAtTime(up ? 300 : 2400, t); f.frequency.exponentialRampToValueAtTime(up ? 2600 : 260, t + 0.5);
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.8);
  },
  // layered gunshot: sharp crack + filtered body + low thump + room tail
  shot(kind, vol = 1, pan = 0, far = 0) {
    const a = this.ensure(); if (!a || vol < 0.01) return;
    if (kind === "laser") { this.samp(Math.random() < 0.5 ? "laser1" : "laser2", 0.55 * vol, pan, 0.94 + Math.random() * 0.12, far * 0.7, 0, 0.5) || this.tone(1500, 0.2, "sine", 0.05 * vol, -1100); return; }
    const G = (this.legacy ? this.GUNS_OLD : this.GUNS)[kind];
    if (G && !this.legacy) { // layered: the gun's own crack and body, a low punch, and its sound coming back off the surroundings
      const r = G[1] * (0.97 + Math.random() * 0.06), v = G[0] * vol * 1.35, out = this._space === "open" || this._space === "street";
      const dl = far > 0 ? far * 50 / 343 : 0;   // sound travels: a shot 50 m away is heard 0.15 s after it is fired
      // the caller has already turned the level down for distance (SFX.fall). Here: which recording, and how muffled.
      // Close (under 10 m): the near take, like your own gun. Mid range: the single-mic take. Past 35 m: the distant recording,
      // which carries its own echo, so it gets little reverb. Muffling only starts past about 20 m.
      const lpF = Math.max(0, far - 0.4) * 1.3;
      if (far > 0.7) { if (this.samp("far-" + kind, v * 0.9, pan, r, lpF, dl, 0.12)) { if (G[2] && far < 0.8) this.bolt(v * 0.2 * (1 - far), pan, G[2] + dl); return; } }
      else if (this.samp((far > 0.2 ? "gunm-" : "gun-") + kind, v * (far > 0 ? 1.15 : 1.4), pan, r, lpF, dl, 0.1 + far * 0.2)) {   // your own gun: right at your ear
        const tv = v * (out ? 0.18 : 0.08) * (1 - far);   // the room answering back: a touch of it, so the shot itself stays up front
        this.samp("far-" + kind, tv, clamp(pan - 0.45, -1, 1), r, 0.3 + far * 0.3, dl + (out ? 0.07 : 0.03), out ? 0.55 : 0.4);
        this.samp("far-" + kind, tv * 0.75, clamp(pan + 0.45, -1, 1), r * 0.985, 0.4 + far * 0.3, dl + (out ? 0.15 : 0.055), out ? 0.65 : 0.45);
        if (far < 0.35 && G[3]) this.thump(v * (1 - far * 2.6) * (G[3] || 1), pan, dl);
        if (G[2]) this.bolt(vol * (far > 0 ? 0.3 * (1 - far) : 0.75), pan, G[2] + dl); return; }
    }
    // every gun plays its own recording: close up the near take, far away the same gun recorded from a distance, muffled further with range
    if (G) { const r = G[1] * (0.97 + Math.random() * 0.06), v = G[0] * vol;
      if (far > 0.45 && this.samp("far-" + kind, v * (0.75 + far * 0.25), pan, r, Math.max(0, far - 0.45) * 1.1, 0, 0.3)) { if (G[2] && far < 0.8) this.bolt(v * 0.25 * (1 - far), pan, G[2]); return; }
      if (this.samp("shot-" + kind, v, pan, r, far * 0.8, 0, 0.12 + far * 0.25)) { if (G[2]) this.bolt(vol * (far > 0 ? 0.3 * (1 - far) : 0.75), pan, G[2]); return; } }
    const P = { pistol: [2600, 0.12, 120, 0.5], heavy: [1800, 0.2, 80, 0.9], smg: [3200, 0.07, 140, 0.4], rifle: [2200, 0.13, 95, 0.7], sniper: [1400, 0.32, 60, 1.2], shotgun: [1500, 0.26, 70, 1.1], lmg: [2000, 0.12, 85, 0.75] }[kind] || [2200, 0.12, 100, 0.6];
    const t = a.currentTime, o = this.out(a, 0.22 * vol, pan), lp = 1 - far * 0.85;
    const src = a.createBufferSource(); src.buffer = this.noiseBuf(a); src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(P[0] * 3 * lp + 300, t); f.frequency.exponentialRampToValueAtTime(P[0] * 0.25 * lp + 120, t + P[1]);
    const g = a.createGain(); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + P[1] * 2.6);
    src.connect(f).connect(g).connect(o); src.start(t, Math.random() * 0.5, P[1] * 3);
    const th = a.createOscillator(), tg = a.createGain(); th.type = "sine"; th.frequency.setValueAtTime(P[2] * 1.8, t); th.frequency.exponentialRampToValueAtTime(P[2] * 0.5, t + 0.12);
    tg.gain.setValueAtTime(P[3] * (1 - far * 0.6), t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); th.connect(tg).connect(o); th.start(t); th.stop(t + 0.2);
    if (far < 0.6) { const c = a.createBufferSource(); c.buffer = this.noiseBuf(a); const hp = a.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 4000; const cg = a.createGain(); cg.gain.setValueAtTime(0.6 * (1 - far), t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.025); c.connect(hp).connect(cg).connect(o); c.start(t, Math.random(), 0.04); }
  },
  // [volume, playback rate, bolt worked this long after the shot (bolt-action rifles)]
  // [volume, playback rate, bolt worked this long after the shot (bolt-action rifles), weight of the low punch]
  // pistol and SMG recordings are thin in the low end (6 to 10 dB under the rifle), so they get more level and some punch, or they sound far away
  GUNS: { pistol: [0.6, 1, 0, 0.85], heavy: [0.64, 1, 0, 1.4], smg: [0.62, 1, 0, 0.6], rifle: [0.6, 1, 0, 0.8], carbine: [0.6, 1, 0, 0.5], lmg: [0.64, 1, 0, 1.1], sniper: [0.72, 1, 0.42, 1.6], scout: [0.6, 1, 0.36, 1], shotgun: [0.7, 1, 0, 1.5] },
  // pre-PR15 table, kept for the old/new switch on the sound page
  GUNS_OLD: { pistol: [0.5, 1, 0, 0.5], heavy: [0.62, 0.92, 0, 1.1], smg: [0.48, 1, 0, 0.45], rifle: [0.62, 1, 0, 0.8], carbine: [0.6, 1, 0, 0.7], lmg: [0.62, 0.95, 0, 0.9], sniper: [0.68, 1, 0.42, 1.4], scout: [0.6, 1, 0.36, 1.1], shotgun: [0.66, 1, 0, 1.3] },
  legacy: false,
  // the low punch you feel in your chest: field recordings of guns have little below 80 Hz
  thump(vol, pan = 0, delay = 0) {
    const a = this.ensure(); if (!a || vol < 0.03) return; const t = a.currentTime + delay, o = this.out(a, Math.min(1, vol) * 0.55, pan, 0);
    const os = a.createOscillator(), g = a.createGain(); os.type = "sine"; os.frequency.setValueAtTime(115, t); os.frequency.exponentialRampToValueAtTime(42, t + 0.09);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); os.connect(g).connect(o); os.start(t); os.stop(t + 0.16);
  },
  // ringing ears after a blast close by (k 0..1)
  ring(k) {
    const a = this.ensure(); if (!a || k < 0.05) return; const t = a.currentTime, o = this.out(a, 0.05 * k, 0, 0);
    [3720, 3790].forEach((f, i) => { const os = a.createOscillator(), g = a.createGain(); os.type = "sine"; os.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(i ? 0.5 : 1, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5 + 2.5 * k); os.connect(g).connect(o); os.start(t); os.stop(t + 4.2); });
  },
  // working a rifle bolt: up, back, forward, down (recorded on a real bolt-action rifle)
  bolt(vol = 0.7, pan = 0, at = 0, open = 1, shut = 1) {
    if (vol < 0.02) return; const r = () => 0.97 + Math.random() * 0.06;
    if (open) { this.samp("bolt-up", vol * 0.8, pan, r(), 0, at, 0.08); this.samp("bolt-back", vol, pan, r(), 0, at + 0.1, 0.08); }
    if (shut) { const t = at + (open ? 0.27 : 0); this.samp("bolt-fwd", vol, pan, r(), 0, t, 0.08); this.samp("bolt-down", vol * 0.85, pan, r(), 0, t + 0.15, 0.08); }
  },
  step(vol = 0.3, pan = 0, surf = 0) {
    const a = this.ensure(); if (!a || vol < 0.01) return;
    let sn = 1 + (Math.random() * 5 | 0); if (sn === this._ls) sn = sn % 5 + 1; this._ls = sn;   // never the same recording twice in a row
    // a boot on a hard floor: the recorded tap slowed and muffled, a low heel thump under it and a short sole scuff after it
    const b = this.S["step" + sn]; this.load();
    if (b) {
      const t = a.currentTime, o = this.out(a, vol * 0.5, pan), r = 0.74 + Math.random() * 0.08;
      const src = a.createBufferSource(); src.buffer = b; src.playbackRate.value = r;
      const fl = this.floor, lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = (fl === "sand" ? 750 : fl === "metal" ? 2700 : 1500) + Math.random() * 500; lp.Q.value = 0.4;
      const sg = a.createGain(); sg.gain.value = 0.85; src.connect(lp).connect(sg).connect(o); src.start(t);
      const th = a.createOscillator(), tg = a.createGain(); th.type = "sine"; th.frequency.setValueAtTime(92, t); th.frequency.exponentialRampToValueAtTime(48, t + 0.09);
      tg.gain.setValueAtTime(0.0001, t); tg.gain.exponentialRampToValueAtTime(fl === "sand" ? 0.3 : 0.55, t + 0.008); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.13); th.connect(tg).connect(o); th.start(t); th.stop(t + 0.15);
      if (fl === "metal") this.samp("metal2", vol * 0.07, pan, 1.5 + Math.random() * 0.5);
      const n = a.createBufferSource(); n.buffer = this.noiseBuf(a); const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700 + Math.random() * 300; bp.Q.value = 0.7;
      const ng = a.createGain(); ng.gain.setValueAtTime(0.0001, t + 0.05); ng.gain.exponentialRampToValueAtTime(fl === "sand" ? 0.3 : 0.1, t + 0.075); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
      n.connect(bp).connect(ng).connect(o); n.start(t + 0.05, Math.random(), 0.16);
      return;
    }
    const t = a.currentTime, o = this.out(a, vol * 0.5, pan);
    const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = surf ? 1400 : 700 + Math.random() * 200; f.Q.value = 1.2;
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.12);
  },
  // explosion: sharp crack, low rumble that rolls off, sub-bass thump and a debris rattle
  blast(vol = 1, pan = 0, big = 0, far = 0) {
    const a = this.ensure(); if (!a || !this.on || vol < 0.01) return; const t = a.currentTime, o = this.out(a, 0.5 * vol, pan), L = big ? 1.45 : 1.0, lp = 1 - far * 0.7;
    if (!this.legacy && this.samp(big ? "boom-near1" : Math.random() < 0.6 ? "boom-near2" : "boom-near3", 0.95 * vol, pan, (big ? 0.92 : 0.96) + Math.random() * 0.08, far * 0.8, 0, 0.6)) {
      if (far < 0.6) this.samp(big ? "debris2" : "debris1", (big ? 0.55 : 0.4) * vol * (1 - far), pan, 0.9 + Math.random() * 0.2, far, 0.12 + Math.random() * 0.1, 0.4);
      const th = a.createOscillator(), tg = a.createGain(); th.type = "sine"; th.frequency.setValueAtTime(big ? 70 : 90, t); th.frequency.exponentialRampToValueAtTime(28, t + 0.6);
      tg.gain.setValueAtTime(0.7 * (1 - far * 0.5), t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.8 * L); th.connect(tg).connect(o); th.start(t); th.stop(t + L); return;
    }
    if (this.samp(big ? "boom2" : Math.random() < 0.5 ? "boom1" : "boom3", 0.95 * vol, pan, (big ? 0.82 : 0.95) + Math.random() * 0.08, far * 0.8)) {
      // keep only the synthetic sub-bass thump under the recording: phone-recorded bangs have no low end
      const th = a.createOscillator(), tg = a.createGain(); th.type = "sine"; th.frequency.setValueAtTime(big ? 75 : 95, t); th.frequency.exponentialRampToValueAtTime(28, t + 0.6);
      tg.gain.setValueAtTime(1.2 * (1 - far * 0.4), t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.8 * L); th.connect(tg).connect(o); th.start(t); th.stop(t + L); return;
    }
    const c = a.createBufferSource(); c.buffer = this.noiseBuf(a); const cf = a.createBiquadFilter(); cf.type = "lowpass"; cf.frequency.setValueAtTime(9000 * lp + 500, t); cf.frequency.exponentialRampToValueAtTime(300, t + 0.25);
    const cg = a.createGain(); cg.gain.setValueAtTime(1.1, t); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); c.connect(cf).connect(cg).connect(o); c.start(t, Math.random() * 0.3, 0.4);
    const r = a.createBufferSource(); r.buffer = this.noiseBuf(a); r.playbackRate.value = 0.5; const rf = a.createBiquadFilter(); rf.type = "lowpass"; rf.frequency.setValueAtTime(900 * lp + 100, t); rf.frequency.exponentialRampToValueAtTime(90, t + L * 1.6);
    const rg = a.createGain(); rg.gain.setValueAtTime(0.0001, t); rg.gain.exponentialRampToValueAtTime(1.4, t + 0.03); rg.gain.exponentialRampToValueAtTime(0.0001, t + L * 1.9); r.connect(rf).connect(rg).connect(o); r.start(t, 0, 1.5);
    const th = a.createOscillator(), tg = a.createGain(); th.type = "sine"; th.frequency.setValueAtTime(big ? 75 : 95, t); th.frequency.exponentialRampToValueAtTime(28, t + 0.6);
    tg.gain.setValueAtTime(1.6 * (1 - far * 0.4), t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.8 * L); th.connect(tg).connect(o); th.start(t); th.stop(t + L);
    if (far < 0.7) for (let k = 0; k < 6; k++) { const d = 0.25 + Math.random() * 0.7 * L, s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1800 + Math.random() * 2500; f.Q.value = 3; const g = a.createGain(); g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.07); s.connect(f).connect(g).connect(o); s.start(t + d, Math.random(), 0.1); }
  },
  // smoke grenade popping: a long airy hiss
  hiss(vol = 0.6, pan = 0) {
    const a = this.ensure(); if (!a || !this.on || vol < 0.01) return; const t = a.currentTime, o = this.out(a, 0.3 * vol, pan);
    const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); s.loop = true; const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(2200, t + 2.2); f.Q.value = 0.6;
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6); s.connect(f).connect(g).connect(o); s.start(t); s.stop(t + 2.7);
    this.samp("air1", 0.5 * vol, pan, 0.8);   // the pop of the canister
  },
  // prop breaking: 0 wood/cardboard crunch, 1 glass + electrical pop
  crash(kind = 0, vol = 0.6, pan = 0) {
    const a = this.ensure(); if (!a || !this.on || vol < 0.01) return; const t = a.currentTime, o = this.out(a, 0.45 * vol, pan);
    if (this.samp(kind ? "hit-glass" : "hit-wood", 0.9 * vol, pan, 0.9 + Math.random() * 0.2)) { if (!kind) this.samp("hit-wood", 0.6 * vol, pan, 0.7, 0, 0.07); return; }
    const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = kind ? "highpass" : "bandpass"; f.frequency.value = kind ? 3500 : 600; f.Q.value = kind ? 0.7 : 0.9;
    const g = a.createGain(); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind ? 0.5 : 0.3)); s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.6);
    for (let k = 0; k < (kind ? 9 : 4); k++) { const d = 0.04 + Math.random() * 0.35, os = a.createOscillator(), og = a.createGain(); os.type = kind ? "triangle" : "square"; os.frequency.value = kind ? 2500 + Math.random() * 4000 : 140 + Math.random() * 160; og.gain.setValueAtTime(0.0001, t + d); og.gain.exponentialRampToValueAtTime(kind ? 0.12 : 0.18, t + d + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + d + (kind ? 0.08 : 0.05)); os.connect(og).connect(o); os.start(t + d); os.stop(t + d + 0.12); }
  },
  swish(vol = 0.4, pan = 0) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, vol * 0.4, pan);
    if (this.samp(Math.random() < 0.5 ? "swing1" : "swing2", vol * 0.8, pan, 1.5 + Math.random() * 0.3)) return;
    const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 2; f.frequency.setValueAtTime(800, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.15);
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.25);
  },
  // full reload sequence for a weapon id, stretched to the reload time
  reload(id, dur) {
    const W = 0.06, r = () => 0.98 + Math.random() * 0.04, end = (len) => Math.max(0, dur - 0.12 - len);   // start so the sound ends just before the gun is ready
    if (id === "shotgun") { const ok = this.samp("rl-shell", 0.7, 0, 1.94 / Math.max(0.8, dur - 1.0), 0, 0, W); this.samp("rl-pump", 0.8, 0, 1.15, 0, Math.max(0, dur - 0.95), W); return ok; }
    if (id === "pistol") return this.samp("rl-pistol", 0.8, 0, clamp(1.59 / (dur - 0.1), 1, 1.08), 0, 0, W);
    if (id === "deagle") return this.samp("rl-pistol", 0.85, 0, 0.92, 0, end(1.73), W);   // heavier slide, a touch lower
    if (id === "smg") return this.samp("rl-rifle", 0.75, 0, 1.06 * r(), 0, end(1.5), W);
    if (id === "rifle") return this.samp("rl-rifle", 0.85, 0, r(), 0, end(1.59), W);
    if (id === "carbine") return this.samp("rl-ar", 0.85, 0, r(), 0, end(1.56), W);
    if (id === "sniper" || id === "scout") { // bolt open, rounds pressed in from a clip, bolt shut
      const ok = this.samp("bolt-up", 0.7, 0, r(), 0, 0.15, W); this.bolt(0.75, 0, 0.15, 1, 0);
      const n = id === "scout" ? 2 : 3; for (let k = 0; k < n; k++) this.samp(k % 2 ? "clip2" : "clip1", 0.7, 0, r(), 0, 0.75 + k * 0.42, W);
      this.samp("bullet1", 0.55, 0, r(), 0, 0.75 + n * 0.42, W); this.bolt(0.8, 0, end(0.45), 0, 1); return ok;
    }
    if (id === "lmg") { // cover up, belt box out and in, cover slammed shut, charging handle
      const ok = this.samp("bolt-back", 0.8, 0, 0.85, 0, 0.25, W); this.samp("bolt-up", 0.7, 0, 0.8, 0, 0.2, W);
      this.samp("rl-rifle", 0.85, 0, 0.92, 0, 1.0, W); this.samp("bullet1", 0.5, 0, 0.8, 0, 2.9, W); this.samp("clip1", 0.5, 0, 0.75, 0, 3.15, W);
      this.samp("bolt-fwd", 0.9, 0, 0.8, 0, dur - 1.25, W); this.samp("thud1", 0.08, 0, 1.6, 0, dur - 1.1, W); this.samp("rl-ar", 0.6, 0, 1, 0, dur - 0.2 - 0.7, W);
      return ok;
    }
    return this.samp("rl-rifle", 0.85, 0, r(), 0, end(1.59), W);
  },
  clank(vol = 0.3, pan = 0) { const a = this.ensure(); if (!a) return; if (this.samp(Math.random() < 0.5 ? "click1" : "click2", vol * 2.2, pan, 0.9 + Math.random() * 0.2)) return; const t = a.currentTime, o = this.out(a, vol * 0.3, pan); [1200, 1850, 2600].forEach((fq, k) => { const os = a.createOscillator(), g = a.createGain(); os.type = "triangle"; os.frequency.value = fq * (0.97 + Math.random() * 0.06); g.gain.setValueAtTime(0.5 / (k + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + k * 0.03); os.connect(g).connect(o); os.start(t); os.stop(t + 0.25); }); },
  // ---- named event sounds. Menus are real switches and clicks, announcements are war drums and a crowd: no beeps or
  // jingles. Until a recording has loaded (the first second) a soft tap of noise stands in.
  play(name) {
    if (!this.on) return;
    const u = (n, vol, rate, delay, wet) => this.samp(n, vol, 0, rate || 1, 0, delay || 0, wet || 0) || (delay ? 0 : this.tap(vol * 0.6));
    switch (name) {
      case "blip": u("ui-tick", 0.55); break;
      case "pop": u("ui-off", 0.5); break;
      case "right": u("ui-on", 0.6); break;
      case "join": u("ui-on", 0.45, 1.2); break;
      case "wrong": case "early": u("ui-deny", 0.65); break;
      case "count": this.beep(880, 0.16, 0.5); break;
      case "go": this.beep(1760, 0.6, 0.55); break;
      case "start": u("ui-on", 0.55); break;
      case "win": if (!this.legacy && this.samp("fb-win", 0.7, 0, 1, 0, 0, 0.25)) { this.samp("crowd1", 0.3, 0, 1, 0, 0.6, 0.4); break; } u("drum-win", 1, 1, 0, 0.2); this.samp("crowd1", 0.45, 0, 1, 0, 0.3, 0.4); break;
      case "lose": if (!this.legacy && this.samp("fb-lose", 0.75, 0, 1, 0, 0, 0.25)) break; u("drum-low", 0.95, 1, 0, 0.2); this.samp("power-down", 0.3, 0, 0.9, 0, 0.12, 0.3); break;
      case "alarm": u("drum-low", 0.8, 1.15, 0, 0.2); u("ui-deny", 0.5, 1, 0.05); break;
      case "pickup": u("pickup1", 0.4, 0.9 + Math.random() * 0.15); break;
      case "bump": this.samp("thud1", 0.75, 0, 0.9 + Math.random() * 0.2) || this.tap(0.4, 500); break;
      case "dash": this.samp("air1", 0.5, 0, 1.1) || this.tap(0.3, 3000); break;
      case "fall": this.samp("fall1", 0.6) || this.tap(0.4, 700); break;
      case "boom": this.blast(0.8, 0, 0, 0.25); break;
    }
  },
  // countdown timer beep: a clean electronic tone (sine with a little octave and fifth on top), fast attack, short
  // ring-out through the room, like a race start light or a match timer
  beep(f, len, vol) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime + 0.005, o = this.out(a, vol, 0, 0.15);
    [[1, 1], [2, 0.22], [3, 0.06]].forEach(([m, v]) => {
      const s = a.createOscillator(), g = a.createGain(); s.type = "sine"; s.frequency.value = f * m;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006);
      g.gain.setValueAtTime(v, t + len * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.12);
      s.connect(g).connect(o); s.start(t); s.stop(t + len + 0.15);
    });
  },
  // ---- one-shots that used to be beeps
  // jump pad: a burst of compressed air and the deck kicking
  pad(vol = 0.6) { this.samp("thud1", vol * 0.45, 0, 1.3, 0, 0, 0.2); if (!this.samp("air2", vol * 0.75, 0, 1.2 + Math.random() * 0.1, 0, 0, 0.4)) this.whoosh(vol, 0, 1); this.samp("swing2", vol * 0.35, 0, 0.8, 0, 0.05, 0.3); },
  // jumping: a light push-off scuff and a little air; landing: a body-weight thud that gets heavier with the drop
  jump(vol = 0.5) { this.step(vol * 0.35, 0, 0); this.samp("swing1", vol * 0.22, 0, 1.35 + Math.random() * 0.1, 0.3, 0, 0.1); },
  land(k = 0.5) { this.samp("land1", 0.35 + 0.5 * k, 0, 1.08 - 0.18 * k + Math.random() * 0.05, 0, 0, 0.15) || this.tap(0.3 + 0.3 * k, 300); this.step(0.3 + 0.4 * k, 0, 0); if (k > 0.65) this.samp("thud1", 0.35 * k, 0, 0.8, 0, 0, 0.2); },
  // something hard meeting metal: a hook that found nothing, a car nudging a barrier
  clack(vol = 0.4, pan = 0, rate = 1) { this.samp("metal2", vol, pan, rate * (0.92 + Math.random() * 0.16)) || this.tap(vol * 0.6, 2600); },
  // an electric discharge: sharp crack for a shot or a spark, the longer one for an EMP or a bolt landing
  zap(vol = 0.5, pan = 0, long = 0) { this.samp(long ? "zap2" : "zap1", vol * (long ? 0.9 : 0.7), pan, 0.92 + Math.random() * 0.16, 0, 0, 0.6) || this.tap(vol * 0.6, 5200); if (long) this.samp("zap1", vol * 0.5, pan, 0.8, 0, 0, 0.6); },
  // steam letting go (an overheated gun), a shield coming up, something powering down
  steam(vol = 0.5) { this.samp("steam1", vol * 0.6, 0, 1, 0, 0, 0.3) || this.hiss(vol * 0.5, 0); },
  shield(vol = 0.5) { this.samp("shield1", vol * 0.7, 0, 1, 0, 0, 0.4) || this.whoosh(vol * 0.6, 0, 1); },
};
