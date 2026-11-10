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
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur = 0.2, vol = 0.08, freq = 900) {
    const a = this.ensure(); if (!a) return;
    const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(); s.buffer = b;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq;
    const g = a.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start();
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
  out(a, vol, pan) { const g = a.createGain(); g.gain.value = vol; if (a.createStereoPanner && pan) { const p = a.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p).connect(a.destination); } else g.connect(a.destination); return g; },
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
      const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500 + Math.random() * 500; lp.Q.value = 0.4;
      const sg = a.createGain(); sg.gain.value = 0.85; src.connect(lp).connect(sg).connect(o); src.start(t);
      const th = a.createOscillator(), tg = a.createGain(); th.type = "sine"; th.frequency.setValueAtTime(92, t); th.frequency.exponentialRampToValueAtTime(48, t + 0.09);
      tg.gain.setValueAtTime(0.0001, t); tg.gain.exponentialRampToValueAtTime(0.55, t + 0.008); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.13); th.connect(tg).connect(o); th.start(t); th.stop(t + 0.15);
      const n = a.createBufferSource(); n.buffer = this.noiseBuf(a); const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700 + Math.random() * 300; bp.Q.value = 0.7;
      const ng = a.createGain(); ng.gain.setValueAtTime(0.0001, t + 0.05); ng.gain.exponentialRampToValueAtTime(0.1, t + 0.075); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
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
