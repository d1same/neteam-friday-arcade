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
