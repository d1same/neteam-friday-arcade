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
  _nb: null,
  noiseBuf(a) { if (this._nb && this._nb.sampleRate === a.sampleRate) return this._nb; const n = a.sampleRate * 1.5, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (this._nb = b); },
  out(a, vol, pan) { const g = a.createGain(); g.gain.value = vol; if (a.createStereoPanner && pan) { const p = a.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p).connect(a.destination); } else g.connect(a.destination); return g; },
  // layered gunshot: sharp crack + filtered body + low thump + room tail
  shot(kind, vol = 1, pan = 0, far = 0) {
    const a = this.ensure(); if (!a || vol < 0.01) return;
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
    const t = a.currentTime, o = this.out(a, vol * 0.5, pan);
    const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = surf ? 1400 : 700 + Math.random() * 200; f.Q.value = 1.2;
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.12);
  },
  swish(vol = 0.4, pan = 0) {
    const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, vol * 0.4, pan);
    const s = a.createBufferSource(); s.buffer = this.noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 2; f.frequency.setValueAtTime(800, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.15);
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    s.connect(f).connect(g).connect(o); s.start(t, Math.random(), 0.25);
  },
  clank(vol = 0.3, pan = 0) { const a = this.ensure(); if (!a) return; const t = a.currentTime, o = this.out(a, vol * 0.3, pan); [1200, 1850, 2600].forEach((fq, k) => { const os = a.createOscillator(), g = a.createGain(); os.type = "triangle"; os.frequency.value = fq * (0.97 + Math.random() * 0.06); g.gain.setValueAtTime(0.5 / (k + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + k * 0.03); os.connect(g).connect(o); os.start(t); os.stop(t + 0.25); }); },
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
