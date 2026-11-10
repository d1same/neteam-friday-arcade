// ---------- sound (synthesised, starts after first interaction) ----------
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
  S: {}, _ld: 0,
  load() {
    const a = this.ctx; if (!a || this._ld) return; this._ld = 1;
    ("shot-pistol shot-heavy shot-smg shot-rifle shot-carbine shot-sniper shot-shotgun shot-far rl-pistol rl-rifle rl-shell rl-pump click1 click2 step1 step2 step3 step4 step5 boom1 boom2 boom3 swing1 swing2 hit-wood hit-glass hit-metal hit-wall").split(" ").forEach((n) => {
      fetch("sfx/" + n + ".mp3").then(r => r.ok ? r.arrayBuffer() : null).then(b => b && a.decodeAudioData(b, (buf) => { this.S[n] = buf; }, () => {})).catch(() => {});
    });
  },
  // play a sample: far 0..1 muffles it; returns false when it is not loaded so the caller can synthesise instead
  samp(name, vol = 1, pan = 0, rate = 1, far = 0, delay = 0) {
    const a = this.ensure(); if (!a) return true; this.load(); const b = this.S[name]; if (!b) return false; if (vol < 0.01) return true;
    const s = a.createBufferSource(); s.buffer = b; s.playbackRate.value = rate; let n = s;
    if (far > 0.05) { const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 14000 * Math.pow(1 - Math.min(far, 0.95), 2) + 500; n = s.connect(f); }
    n.connect(this.out(a, vol, pan)); s.start(a.currentTime + delay); return true;
  },
  _nb: null,
  noiseBuf(a) { if (this._nb && this._nb.sampleRate === a.sampleRate) return this._nb; const n = a.sampleRate * 1.5, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (this._nb = b); },
  // ---- the mix: everything goes through one master bus (a limiter keeps bursts of gunfire from clipping) and a shared
  // reverb whose size follows the place you are in (SFX.space). `wet` scales how much of a sound reaches the reverb.
  vol: 0.9, _bus: null, _space: "room",
  bus(a) {
    if (this._bus && this._bus.a === a) return this._bus;
    const master = a.createGain(); master.gain.value = this.vol;
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 20000; lp.Q.value = 0.3;
    master.connect(lp).connect(comp).connect(a.destination);
    const send = a.createGain(), rev = a.createConvolver(), wet = a.createGain(); send.connect(rev).connect(wet).connect(master);
    this._bus = { a, master, comp, send, rev, wet, lp, mk: 0 }; this.space(this._space); return this._bus;
  },
  // dull the whole mix (0 = clear, 1 = under water): used while badly hurt
  muffle(k) { const B = this._bus; if (!B || k === B.mk || (k > 0 && Math.abs(k - B.mk) < 0.02)) return; B.mk = k; B.lp.frequency.setTargetAtTime(20000 * Math.pow(0.04, k), B.a.currentTime, 0.12); },
  dest(a) { return this.bus(a).master; },
  // an impulse response made of decaying noise with a few early echoes: length in seconds, damping 0..1 (1 = dull)
  ir(a, len, damp, early) {
    const sr = a.sampleRate, n = Math.floor(sr * len), b = a.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; const k = 1 - damp * 0.9;
      for (let i = 0; i < n; i++) { const t = i / n, e = Math.pow(1 - t, 2.2) * Math.exp(-t * 2.4); lp += ((Math.random() * 2 - 1) - lp) * (k * (1 - t * 0.7) + 0.02); d[i] = lp * e * (i < sr * 0.006 ? i / (sr * 0.006) : 1); }
      for (let j = 0; j < early; j++) { const at = Math.floor(sr * (0.011 + Math.random() * 0.07)), g = 0.5 - j * 0.06; for (let q = 0; q < 40 && at + q < n; q++) d[at + q] += (Math.random() * 2 - 1) * g * (1 - q / 40); } }
    return b;
  },
  SPACES: { room: [0.7, 0.45, 5, 0.2], hall: [1.7, 0.3, 6, 0.3], vault: [2.5, 0.25, 6, 0.34], street: [1.3, 0.55, 3, 0.15], open: [0.9, 0.7, 2, 0.08], dry: [0.3, 0.6, 2, 0.04] },
  space(kind) {
    this._space = this.SPACES[kind] ? kind : "room"; const B = this._bus; if (!B) return;
    if (B.kind !== this._space) { const P = this.SPACES[this._space]; try { B.rev.buffer = this.ir(B.a, P[0], P[1], P[2]); } catch (e) {} B.wet.gain.value = P[3]; B.kind = this._space; }
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
    return {
      set(rev, load, vol, p, pitch) {
        const now = a.currentTime, f = (36 + rev * rev * 60 + rev * 96) * (pitch || 1);
        os.forEach(q => q.o.frequency.setTargetAtTime(f * q.mul, now, 0.04)); lfo.frequency.setTargetAtTime(f * 0.5, now, 0.05);
        lp.frequency.setTargetAtTime(260 + rev * 1500 + load * (700 + rev * 1700), now, 0.06); pk.frequency.setTargetAtTime(520 + rev * 900, now, 0.08);
        const v = vol * (0.42 + 0.58 * load) * (0.6 + rev * 0.4); out.gain.setTargetAtTime(v, now, 0.06); lg.gain.setTargetAtTime(v * 0.22 * (1 - rev * 0.7), now, 0.08);
        ng.gain.setTargetAtTime(vol * (0.03 + load * rev * 0.22), now, 0.08); nf.frequency.setTargetAtTime(700 + rev * 2600, now, 0.1);
        if (pan && p != null) pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, p)), now, 0.08);
      },
      stop() { try { out.gain.setTargetAtTime(0, a.currentTime, 0.08); const e = a.currentTime + 0.5; os.forEach(q => q.o.stop(e)); lfo.stop(e); ns.stop(e); } catch (e) {} },
    };
  },
  // ---- small one-shots
  _it: 0,
  // a bullet lands near you: 0 masonry, 1 metal; now and then it sings off as a ricochet
  impact(kind, vol, pan) {
    const a = this.ensure(); if (!a || vol < 0.02) return; const t = a.currentTime; if (t - this._it < 0.045) return; this._it = t;
    if (!this.samp(kind ? "hit-metal" : "hit-wall", vol * (kind ? 0.5 : 0.75), pan, 0.85 + Math.random() * 0.5)) { const o = this.out(a, vol * 0.25, pan), s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = kind ? 3200 : 1300; f.Q.value = 1; const g = a.createGain(); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.1); }
    if (Math.random() < (kind ? 0.3 : 0.12)) { const o = a.createOscillator(), g = a.createGain(), f0 = 1800 + Math.random() * 2200; o.type = "sine"; o.frequency.setValueAtTime(f0, t + 0.02); o.frequency.exponentialRampToValueAtTime(f0 * (0.35 + Math.random() * 0.2), t + 0.42); g.gain.setValueAtTime(0.0001, t + 0.02); g.gain.exponentialRampToValueAtTime(0.5, t + 0.035); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.44); o.connect(g).connect(this.out(a, vol * 0.1, pan)); o.start(t + 0.02); o.stop(t + 0.46); }
  },
  // a round passing close to your head
  whiz(pan) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, 0.34, pan, 0.4), s = a.createBufferSource(); s.buffer = this.noiseBuf(a);
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 3.5; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.13);
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.2);
  },
  // a spent case ringing on the floor
  casing(vol = 0.5, big = 0) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime + 0.42 + Math.random() * 0.12, o = this.out(a, vol * 0.05, (Math.random() - 0.3) * 0.6);
    [0, 0.07 + Math.random() * 0.05, 0.2].forEach((d, k) => { const os = a.createOscillator(), g = a.createGain(), f = (big ? 1900 : 4300) + Math.random() * 1500; os.type = "sine"; os.frequency.setValueAtTime(f, t + d); g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(1 / (k + 1), t + d + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.09); os.connect(g).connect(o); os.start(t + d); os.stop(t + d + 0.1); });
  },
  // you dropped someone: a dry thud with a bright ping over it (higher for a headshot)
  kill(head) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, 0.3, 0, 0);
    const th = a.createOscillator(), tg = a.createGain(); th.type = "sine"; th.frequency.setValueAtTime(190, t); th.frequency.exponentialRampToValueAtTime(70, t + 0.12); tg.gain.setValueAtTime(0.9, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); th.connect(tg).connect(o); th.start(t); th.stop(t + 0.18);
    [head ? 1760 : 1175, head ? 2637 : 1568].forEach((f, k) => { const os = a.createOscillator(), g = a.createGain(); os.type = "triangle"; os.frequency.value = f; g.gain.setValueAtTime(0.0001, t + k * 0.06); g.gain.exponentialRampToValueAtTime(0.5, t + k * 0.06 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.06 + 0.3); os.connect(g).connect(o); os.start(t + k * 0.06); os.stop(t + k * 0.06 + 0.32); });
  },
  // your round landed: a dry tick, brighter and doubled for a head
  hit(head) {
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
  // a crowd going up: a swell of voices with a few whistles
  cheer(vol = 0.5) {
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
    const sn = { pistol: "shot-pistol", heavy: "shot-heavy", smg: "shot-smg", rifle: "shot-rifle", carbine: "shot-carbine", lmg: "shot-rifle", sniper: "shot-sniper", shotgun: "shot-shotgun" }[kind];
    if (sn && this.samp(far > 0.75 && kind !== "pistol" && kind !== "smg" ? "shot-far" : sn, (kind === "smg" || kind === "pistol" ? 0.5 : 0.62) * vol, pan, (kind === "lmg" ? 0.9 : kind === "heavy" ? 0.88 : 1) * (0.97 + Math.random() * 0.06), far * 0.8)) return;
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
      if (fl === "metal") { const pg = a.createOscillator(), pgn = a.createGain(); pg.type = "triangle"; pg.frequency.value = 780 + Math.random() * 500; pgn.gain.setValueAtTime(0.0001, t); pgn.gain.exponentialRampToValueAtTime(0.07, t + 0.006); pgn.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); pg.connect(pgn).connect(o); pg.start(t); pg.stop(t + 0.18); }
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
    this.tone(180, 0.08, "square", 0.05 * vol);
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
    if (id === "shotgun") { let ok = this.samp("rl-shell", 0.7, 0, 1.94 / Math.max(0.8, dur - 1.0)); this.samp("rl-pump", 0.8, 0, 1.15, 0, Math.max(0, dur - 0.95)); return ok; }
    if (id === "pistol" || id === "deagle") return this.samp("rl-pistol", 0.8, 0, clamp(1.59 / (dur * 0.95), 0.8, 1.2));
    const ok = this.samp("rl-rifle", 0.85, 0, clamp(1.56 / (dur * 0.8), 0.62, 1.1), 0, dur * 0.08);
    if (ok && dur > 3) this.samp("click1", 0.7, 0, 0.8, 0, dur * 0.9);
    return ok;
  },
  clank(vol = 0.3, pan = 0) { const a = this.ensure(); if (!a) return; if (this.samp(Math.random() < 0.5 ? "click1" : "click2", vol * 1.6, pan, 0.9 + Math.random() * 0.2)) return; const t = a.currentTime, o = this.out(a, vol * 0.3, pan); [1200, 1850, 2600].forEach((fq, k) => { const os = a.createOscillator(), g = a.createGain(); os.type = "triangle"; os.frequency.value = fq * (0.97 + Math.random() * 0.06); g.gain.setValueAtTime(0.5 / (k + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + k * 0.03); os.connect(g).connect(o); os.start(t); os.stop(t + 0.25); }); },
  play(name) {
    if (!this.on) return;
    switch (name) {
      case "blip": this.tone(660, 0.07, "square", 0.05); break;
      case "pop": this.tone(420, 0.09, "sine", 0.12, 380); break;
      case "count": this.tone(440, 0.14, "square", 0.06); break;
      case "go": this.tone(880, 0.25, "square", 0.07); this.tone(1320, 0.25, "square", 0.04, 0, 0.05); break;
      case "start": [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.12, "square", 0.05, 0, i * 0.08)); break;
      case "win": [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, 0.16, "triangle", 0.09, 0, i * 0.11)); break;
      case "right": this.tone(740, 0.08, "triangle", 0.09); this.tone(1110, 0.12, "triangle", 0.08, 0, 0.06); break;
      case "wrong": this.tone(220, 0.22, "sawtooth", 0.05, -90); break;
      case "bump": this.tone(160, 0.12, "sine", 0.16, -60); this.noise(0.08, 0.05, 1200); break;
      case "dash": this.noise(0.18, 0.06, 2400); break;
      case "fall": this.tone(600, 0.6, "sine", 0.08, -520); break;
      case "boom": this.noise(0.4, 0.14, 700); this.tone(90, 0.3, "sine", 0.15, -40); break;
      case "join": this.tone(587, 0.08, "triangle", 0.07); this.tone(880, 0.1, "triangle", 0.06, 0, 0.07); break;
      case "early": this.tone(180, 0.35, "square", 0.06, -60); break;
    }
  },
};
