/* 所有音效都用 Web Audio 即時合成，不需要任何音檔。 */
(function () {
  const A = {};
  let ctx = null, master = null, muted = false;
  let noiseW, noiseP, noiseB;

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 12; comp.ratio.value = 5;
    comp.attack.value = 0.003; comp.release.value = 0.25;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.85;
    master.connect(comp); comp.connect(ctx.destination);
    noiseW = makeNoise('white'); noiseP = makeNoise('pink'); noiseB = makeNoise('brown');
  };
  A.ready = () => !!ctx;
  A.setMuted = function (m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, ctx.currentTime, 0.05);
  };
  A.isMuted = () => muted;

  function makeNoise(type) {
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'white') d[i] = w;
        else if (type === 'pink') {
          b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
          b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
        } else { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
      }
    }
    return buf;
  }

  const now = () => ctx.currentTime;
  function gain(v, dest) { const g = ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; }
  function filt(type, f, q, dest) {
    const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q;
    if (dest) b.connect(dest); return b;
  }
  function pan(v, dest) {
    if (!ctx.createStereoPanner) { const g = gain(1, dest); g.pan = { value: 0, setTargetAtTime() {} }; return g; }
    const p = ctx.createStereoPanner(); p.pan.value = v; if (dest) p.connect(dest); return p;
  }
  function noise(buf, dest, t, dur) {
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    s.connect(dest); s.start(t || now(), Math.random() * 3);
    if (dur) s.stop((t || now()) + dur);
    return s;
  }
  function osc(type, f, dest, t, dur) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(dest);
    o.start(t || now()); if (dur) o.stop((t || now()) + dur); return o;
  }
  function env(g, t, a, peak, d, sustain) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    if (sustain) g.gain.setValueAtTime(peak, t + a + sustain);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + (sustain || 0) + d);
  }
  function ramp(param, v, sec) { param.cancelScheduledValues(now()); param.setTargetAtTime(v, now(), Math.max(0.01, sec / 3)); }
  function distCurve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (3 + k) * x * 20 * Math.PI / 180 / (Math.PI + k * Math.abs(x)); }
    return c;
  }

  /* ---------- loops ---------- */
  function makeLoop(build) {
    return {
      out: null, parts: null, level: 0,
      start(level = 0.5, fade = 1.5, opts) {
        if (!ctx) return this;
        if (!this.out) {
          this.out = gain(0, master);
          this.parts = build(this.out, opts || {}, this);
        }
        this.set(level, fade);
        return this;
      },
      set(level, fade = 1) { if (!this.out) return; this.level = level; ramp(this.out.gain, level, fade); },
      stop(fade = 1) {
        if (!this.out) return;
        const out = this.out, parts = this.parts;
        this.out = null; this.parts = null; this.level = 0;
        if (fade <= 0.02) out.gain.setValueAtTime(0, now()); else ramp(out.gain, 0, fade);
        setTimeout(() => {
          (parts.srcs || []).forEach(s => { try { s.stop(); } catch (e) {} });
          (parts.timers || []).forEach(t => clearInterval(t));
          if (parts.cleanup) parts.cleanup();
          try { out.disconnect(); } catch (e) {}
        }, fade * 1000 + 100);
      },
      get on() { return !!this.out; }
    };
  }

  A.rain = makeLoop((out, o, self) => {
    const hp = filt('highpass', 400, 0.5), lp = filt('lowpass', 3200, 0.5, out);
    hp.connect(lp);
    const s1 = noise(noiseP, hp);
    const lowG = gain(0.5, out); const lp2 = filt('lowpass', 500, 0.7, lowG);
    const s2 = noise(noiseB, lp2);
    const t = setInterval(() => {
      if (!self.out) return;
      const n = (Math.random() * 4) | 0;
      for (let i = 0; i < n; i++) drop(out, now() + Math.random() * 0.08);
    }, 70);
    return { srcs: [s1, s2], timers: [t] };
  });
  function drop(dest, t) {
    const g = gain(0, pan(Math.random() * 2 - 1, dest));
    const b = filt('bandpass', 2500 + Math.random() * 4000, 2, g);
    noise(noiseW, b, t, 0.03);
    env(g, t, 0.001, 0.08 + Math.random() * 0.12, 0.02);
  }

  A.drone = makeLoop((out, o) => {
    const base = o.base || 55;
    const lp = filt('lowpass', 380, 1.5, out);
    const lfo = osc('sine', 0.06, gain(160, lp.frequency));
    const srcs = [lfo];
    [[base, 'sine', .5], [base * 1.007, 'triangle', .35], [base * 1.498, 'sine', .22], [base * 0.5, 'sine', .4]].forEach(([f, ty, v]) => {
      srcs.push(osc(ty, f, gain(v, lp)));
    });
    const nb = filt('lowpass', 220, 0.5, gain(0.6, out));
    srcs.push(noise(noiseB, nb));
    return { srcs };
  });

  A.city = makeLoop((out) => {
    const lp = filt('lowpass', 900, 0.4, out);
    const s = noise(noiseP, lp);
    return { srcs: [s] };
  });

  A.engine = makeLoop((out, o, self) => {
    const lp = filt('lowpass', 500, 2, out);
    const shaper = ctx.createWaveShaper(); shaper.curve = distCurve(8); shaper.connect(lp);
    const trem = gain(0.6, shaper);
    const o1 = osc('sawtooth', 40, gain(0.45, trem));
    const o2 = osc('square', 80.5, gain(0.18, trem));
    const lfo = osc('square', 10, gain(0.35, trem.gain));
    const nb = filt('bandpass', 280, 1.2, gain(0.5, out)); const s = noise(noiseB, nb);
    self.setSpeed = (sp) => {
      if (!self.out) return;
      const f = 34 + 70 * sp, t = now();
      o1.frequency.setTargetAtTime(f, t, 0.15); o2.frequency.setTargetAtTime(f * 2.01, t, 0.15);
      lfo.frequency.setTargetAtTime(f / 4, t, 0.15); lp.frequency.setTargetAtTime(380 + 1600 * sp, t, 0.2);
    };
    return { srcs: [o1, o2, lfo, s] };
  });

  // 老電扇：馬達嗡嗡聲 + 扇葉風聲 + 擺頭齒輪「咯噠、咯噠」
  A.fan = makeLoop((out, o, self) => {
    const hum = filt('lowpass', 220, 1, gain(0.22, out));
    const h1 = osc('sawtooth', 50, hum);
    const airGain = gain(0.35, out);
    const air = filt('bandpass', 650, 0.6, airGain);
    const s = noise(noiseP, air);
    const lfo = osc('sine', 16, gain(0.12, airGain.gain));
    self.speed = 1; self.panFn = o.panFn || (() => 0);
    let alive = true, next = now() + 0.3;
    const tick = setInterval(() => {
      if (!alive || !self.out) return;
      while (next < now() + 0.2) {
        if (self.speed > 0.01) clack(self.out, next, self.panFn(), 0.9);
        next += 0.62 / Math.max(0.2, self.speed);
      }
    }, 50);
    self.setSpeed = (sp) => {
      self.speed = sp;
      if (!self.out) return;
      h1.frequency.setTargetAtTime(40 + 14 * sp, now(), 0.3);
      lfo.frequency.setTargetAtTime(12 + 8 * sp, now(), 0.3);
    };
    return { srcs: [h1, s, lfo], timers: [tick], cleanup() { alive = false; } };
  });
  function clack(dest, t, p, vol) {
    const pn = pan(Math.max(-1, Math.min(1, p)), dest);
    [[0, 1700, 1], [0.075, 2600, 0.75]].forEach(([dt, f, v]) => {
      const g = gain(0, pn); const b = filt('bandpass', f, 5, g);
      noise(noiseW, b, t + dt, 0.04);
      env(g, t + dt, 0.001, 1.6 * v * vol, 0.035);
      const tg = gain(0, pn); osc('triangle', 210 + dt * 900, tg, t + dt, 0.06);
      env(tg, t + dt, 0.001, 0.35 * v * vol, 0.05);
    });
  }

  let heartTimer = null, heartBpm = 70;
  A.heart = {
    start(bpm = 70) { heartBpm = bpm; if (heartTimer || !ctx) return; const loop = () => { beat(); heartTimer = setTimeout(loop, 60000 / heartBpm); }; loop(); },
    set(bpm) { heartBpm = bpm; },
    stop() { clearTimeout(heartTimer); heartTimer = null; }
  };
  function beat() {
    if (!ctx) return;
    const t = now();
    [[0, 1], [0.26, 0.65]].forEach(([dt, v]) => {
      const g = gain(0, master); const o = osc('sine', 62, g, t + dt, 0.25);
      o.frequency.setValueAtTime(70, t + dt); o.frequency.exponentialRampToValueAtTime(38, t + dt + 0.18);
      env(g, t + dt, 0.008, 0.9 * v, 0.2);
    });
  }

  /* ---------- one-shots ---------- */
  const S = A.sfx = {};
  const guard = (fn) => function () { if (!ctx) return; try { return fn.apply(null, arguments); } catch (e) { console.warn(e); } };

  S.click = guard(() => { const t = now(), g = gain(0, master); osc('sine', 880, g, t, 0.06); env(g, t, 0.002, 0.08, 0.05); });
  S.tick = guard(() => { const t = now(), g = gain(0, master); const b = filt('bandpass', 3000, 3, g); noise(noiseW, b, t, 0.02); env(g, t, 0.001, 0.05, 0.015); });

  S.step = guard((n = 2) => {
    for (let i = 0; i < n; i++) {
      const t = now() + i * 0.32 + Math.random() * 0.04;
      const g = gain(0, master); const lp = filt('lowpass', 600, 1, g); noise(noiseB, lp, t, 0.15);
      env(g, t, 0.005, 0.9, 0.12);
      const g2 = gain(0, master); osc('sine', 85, g2, t, 0.12); env(g2, t, 0.003, 0.4, 0.09);
    }
  });

  S.pickup = guard(() => {
    const t = now();
    [[1318, 0], [1975, 0.09], [2637, 0.18]].forEach(([f, dt]) => {
      const g = gain(0, master); osc('sine', f, g, t + dt, 1.2); env(g, t + dt, 0.005, 0.12, 1.0);
    });
  });

  S.pata = guard((vol = 1, p = 0) => {
    const t = now(), d = pan(p, master);
    const g = gain(0, d); osc('sine', 3100 + Math.random() * 300, g, t, 0.12); env(g, t, 0.001, 0.35 * vol, 0.09);
    const g2 = gain(0, d); osc('sine', 5200, g2, t, 0.06); env(g2, t, 0.001, 0.15 * vol, 0.04);
    const g3 = gain(0, d); const b = filt('bandpass', 1400, 1.2, g3); noise(noiseW, b, t, 0.04); env(g3, t, 0.001, 0.9 * vol, 0.025);
    const g4 = gain(0, d); osc('sine', 160, g4, t, 0.08); env(g4, t, 0.001, 0.35 * vol, 0.06);
  });

  // 彈珠在天花板（樓上）彈跳：啪噠……噠、噠噠噠
  S.marbleBounce = function (p = 0) {
    if (!ctx) return;
    const seq = [[0, 1], [0.46, .75], [0.78, .55], [1.0, .4], [1.15, .3], [1.26, .22], [1.34, .16], [1.4, .12], [1.45, .09]];
    seq.forEach(([dt, v]) => setTimeout(() => S.pata(v, p), dt * 1000));
  };

  S.roll = guard((dur = 3, p = 0) => {
    const t = now(), pn = pan(p, master);
    const g = gain(0, pn); const b = filt('bandpass', 2600, 1.4, g);
    const s = noise(noiseW, b, t, dur + 0.2);
    const tr = gain(0.5, g.gain); osc('sine', 28, tr, t, dur + 0.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.2);
    g.gain.setValueAtTime(0.35, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lo = gain(0, pn); const lb = filt('lowpass', 300, 1, lo); noise(noiseB, lb, t, dur + 0.2);
    lo.gain.setValueAtTime(0.0001, t); lo.gain.linearRampToValueAtTime(0.4, t + 0.3); lo.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return s;
  });

  S.crack = guard((vol = 1) => {
    const t0 = now(); let t = t0;
    const n = 8 + (Math.random() * 10 | 0);
    for (let i = 0; i < n; i++) {
      t += 0.01 + Math.random() * 0.07;
      const g = gain(0, pan(Math.random() * 1.2 - .6, master));
      const b = filt('bandpass', 600 + Math.random() * 2600, 3, g);
      noise(noiseW, b, t, 0.03);
      env(g, t, 0.001, (0.4 + Math.random() * 0.8) * vol, 0.01 + Math.random() * 0.03);
    }
    const g = gain(0, master); const lp = filt('lowpass', 260, 4, g);
    const o = osc('sawtooth', 60, lp, t0, 0.7);
    o.frequency.setValueCurveAtTime(new Float32Array([60, 75, 52, 80, 58, 66]), t0, 0.6);
    env(g, t0, 0.05, 0.35 * vol, 0.55);
  });

  S.creak = guard((vol = 0.6, dur = 1.2) => {
    const t = now(), g = gain(0, master); const b = filt('bandpass', 900, 9, g);
    const o = osc('sawtooth', 140, b, t, dur + 0.1);
    const pts = new Float32Array(16).map(() => 110 + Math.random() * 90);
    o.frequency.setValueCurveAtTime(pts, t, dur);
    const am = gain(0.5, g.gain); osc('square', 23, am, t, dur);
    env(g, t, 0.1, vol, dur - 0.1, 0);
  });

  S.thunder = guard((delay = 0, power = 1) => {
    const t = now() + delay;
    if (power > 0.7) {
      const g0 = gain(0, master); const h = filt('highpass', 1200, 0.5, g0); noise(noiseW, h, t, 0.25);
      env(g0, t, 0.002, 0.4 * power, 0.2);
    }
    const g = gain(0, master); const lp = filt('lowpass', 160, 0.8, g);
    noise(noiseB, lp, t, 5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1.6 * power, t + 0.12);
    g.gain.linearRampToValueAtTime(0.7 * power, t + 0.6);
    g.gain.linearRampToValueAtTime(1.2 * power, t + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.6);
  });

  S.sting = guard((vol = 0.5) => {
    const t = now(), g = gain(0, master); const lp = filt('lowpass', 6000, 1, g);
    lp.frequency.setValueAtTime(6000, t); lp.frequency.exponentialRampToValueAtTime(400, t + 2);
    [233, 247, 370, 494, 523].forEach(f => osc('sawtooth', f, gain(0.09, lp), t, 2.2));
    env(g, t, 0.01, vol, 2);
    const g2 = gain(0, master); const b = filt('bandpass', 2000, 0.8, g2); noise(noiseW, b, t, 1);
    b.frequency.setValueAtTime(4000, t); b.frequency.exponentialRampToValueAtTime(300, t + 0.9);
    env(g2, t, 0.01, vol * 0.5, 0.9);
  });

  S.whisper = guard((vol = 0.25) => {
    const t = now(), d = pan(Math.random() < .5 ? -0.8 : 0.8, master);
    const g = gain(0, d); const b = filt('bandpass', 2400, 6, g);
    noise(noiseW, b, t, 1.6);
    b.frequency.setValueCurveAtTime(new Float32Array([1800, 3200, 2200, 3800, 2600, 1900]), t, 1.5);
    const am = gain(0.6, g.gain); osc('sine', 7, am, t, 1.6);
    env(g, t, 0.2, vol, 1.3);
  });

  S.buzz = guard((dur = 0.8) => {
    const t = now(), g = gain(0, master); const b = filt('bandpass', 240, 3, g);
    osc('sawtooth', 120, b, t, dur); osc('square', 60, gain(0.3, b), t, dur);
    g.gain.setValueAtTime(0.0001, t);
    for (let i = 0; i < 8; i++) g.gain.setValueAtTime(Math.random() < .6 ? 0.18 : 0.01, t + i * dur / 8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  });

  S.shutter = guard((dur = 3) => {
    const t0 = now();
    const ring = filt('bandpass', 420, 12, gain(1, master));
    const out = gain(1, master);
    for (let t = 0; t < dur; t += 0.03 + Math.random() * 0.02) {
      const g = gain(0, out); const b = filt('bandpass', 1500 + Math.random() * 1500, 2.5, g);
      noise(noiseW, b, t0 + t, 0.03);
      const v = (0.25 + Math.random() * 0.35) * Math.min(1, (dur - t) * 2, t * 4 + 0.3);
      env(g, t0 + t, 0.001, v, 0.025);
      const rg = gain(0, ring); noise(noiseW, rg, t0 + t, 0.02); env(rg, t0 + t, 0.001, v * 0.6, 0.02);
    }
    const g = gain(0, master); const lp = filt('lowpass', 200, 1, g); noise(noiseB, lp, t0, dur);
    env(g, t0, 0.2, 0.5, dur - 0.2);
    const tk = t0 + dur; const gk = gain(0, master); osc('sine', 90, gk, tk, 0.3); env(gk, tk, 0.002, 0.8, 0.25);
    const gk2 = gain(0, master); const bk = filt('bandpass', 900, 3, gk2); noise(noiseW, bk, tk, 0.1); env(gk2, tk, 0.002, 0.6, 0.08);
  });

  S.unlock = guard(() => {
    const t = now();
    [0, 0.18, 0.42].forEach((dt, i) => {
      const g = gain(0, master); const b = filt('bandpass', 3200 - i * 600, 6, g); noise(noiseW, b, t + dt, 0.04);
      env(g, t + dt, 0.001, 0.7, 0.03);
      const g2 = gain(0, master); osc('sine', 1900 - i * 300, g2, t + dt, 0.1); env(g2, t + dt, 0.001, 0.12, 0.08);
    });
  });

  S.drip = guard((vol = 0.4, p = 0) => {
    const t = now(), g = gain(0, pan(p, master)); const o = osc('sine', 900, g, t, 0.12);
    o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(2200, t + 0.05);
    env(g, t, 0.001, vol, 0.08);
  });

  S.gurgle = guard(() => {
    const t = now(), g = gain(0, master); const b = filt('bandpass', 400, 8, g);
    noise(noiseB, b, t, 1.6);
    b.frequency.setValueCurveAtTime(new Float32Array([300, 700, 250, 900, 350, 600, 280, 500]), t, 1.5);
    env(g, t, 0.1, 1.2, 1.4);
  });

  S.cash = guard(() => {
    const t = now();
    [[2093, 0], [2637, 0.12]].forEach(([f, dt]) => { const g = gain(0, master); osc('triangle', f, g, t + dt, 0.8); env(g, t + dt, 0.002, 0.15, 0.7); });
  });

  S.whoosh = guard((vol = 0.5) => {
    const t = now(), g = gain(0, master); const b = filt('bandpass', 400, 1, g); noise(noiseP, b, t, 1);
    b.frequency.setValueAtTime(300, t); b.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
    env(g, t, 0.3, vol, 0.5);
  });

  S.impact = guard((vol = 1) => {
    const t = now(), g = gain(0, master); const o = osc('sine', 80, g, t, 1.2);
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(28, t + 0.9);
    env(g, t, 0.002, vol, 1.0);
    const g2 = gain(0, master); const lp = filt('lowpass', 1200, 0.5, g2); noise(noiseW, lp, t, 0.4); env(g2, t, 0.001, vol * 0.6, 0.35);
  });

  // 鬼臉出現時的尖叫
  S.scream = guard(() => {
    const t = now();
    const out = gain(0, master);
    out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(1.0, t + 0.015);
    out.gain.setValueAtTime(1.0, t + 1.1); out.gain.exponentialRampToValueAtTime(0.0001, t + 2.0);
    const shaper = ctx.createWaveShaper(); shaper.curve = distCurve(50); shaper.connect(out);
    [520, 553, 740, 1046, 1480, 1990].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'square';
      o.frequency.setValueAtTime(f * 0.6, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.3);
      o.frequency.exponentialRampToValueAtTime(f * 1.05, t + 1.8);
      const vib = osc('sine', 8 + i * 1.7, gain(f * 0.05, o.frequency), t, 2);
      const g = gain(0.09, shaper); o.connect(g); o.start(t); o.stop(t + 2);
    });
    const ng = gain(0, out); const b = filt('bandpass', 1500, 1.5, ng); noise(noiseW, b, t, 2);
    b.frequency.setValueAtTime(900, t); b.frequency.exponentialRampToValueAtTime(3800, t + 0.4);
    env(ng, t, 0.01, 0.9, 1.6);
    S.impact(1.2);
  });

  window.AudioSys = A;
})();
