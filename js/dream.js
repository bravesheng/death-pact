/* 惡夢：three.js 仰躺視角、鬼壓床（只能轉頭）、重力反轉、天花板龜裂、跳臉 */
(function () {
  const T = THREE;
  const RW = 3.2, RL = 3.6, RH = 2.7, HX = RW / 2, HZ = RL / 2;
  const CAM = new T.Vector3(0, 0.8, -1.25);
  const DEF_PITCH = 0.42;
  const WZ0 = -1.45, WZ1 = -0.15, WY0 = 0.95, WY1 = 2.15;  // 窗戶開口（+x 牆）
  const CW = 1024, CH = 1152;                                  // 天花板貼圖尺寸

  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); if (draw) draw(x, w, h);
    const t = new T.CanvasTexture(c); t.anisotropy = 4;
    return { c, x, t };
  }
  const ceilToWorld = (cx, cy) => new T.Vector3((cx / CW - .5) * RW, RH, (.5 - cy / CH) * RL);

  /* ---------- 靜態貼圖 ---------- */
  function plaster(color, seed, w = 512) {
    return canvasTex(w, w, (x) => {
      const R = rng(seed); x.fillStyle = color; x.fillRect(0, 0, w, w);
      for (let i = 0; i < 40; i++) {
        const g = x.createRadialGradient(R() * w, R() * w, 0, R() * w, R() * w, 30 + R() * 120);
        g.addColorStop(0, `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * .05})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(0, 0, w, w);
      }
      for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * .06})`; x.fillRect(R() * w, R() * w, 1.5, 1.5); }
    });
  }
  function floorTex() {
    const o = canvasTex(512, 512, (x, w) => {
      const R = rng(5);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const v = 200 + R() * 18 | 0; x.fillStyle = `rgb(${v},${v - 2},${v - 8})`; x.fillRect(i * 128, j * 128, 128, 128);
      }
      x.strokeStyle = '#8f877c'; x.lineWidth = 3;
      for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, w); x.stroke(); x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); }
    });
    o.t.wrapS = o.t.wrapT = T.RepeatWrapping; o.t.repeat.set(RW / 2.4, RL / 2.4); return o.t;
  }
  function floralTex() {
    const o = canvasTex(512, 512, (x, w) => {
      const R = rng(9); x.fillStyle = '#e9e6dc'; x.fillRect(0, 0, w, w);
      const cols = ['#7fa3c9', '#d98aa0', '#8fbf8a', '#e7c46a', '#b08fd0'];
      for (let i = 0; i < 260; i++) {
        const cx = R() * w, cy = R() * w, c = cols[(R() * cols.length) | 0];
        x.fillStyle = c;
        for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; x.beginPath(); x.arc(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, 3, 0, Math.PI * 2); x.fill(); }
        x.fillStyle = '#f5e7a0'; x.beginPath(); x.arc(cx, cy, 2, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#6f9a6a'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx + 5, cy + 5); x.quadraticCurveTo(cx + 12, cy + 8, cx + 16, cy + 3); x.stroke();
      }
    });
    o.t.wrapS = o.t.wrapT = T.RepeatWrapping; o.t.repeat.set(2, 2); return o.t;
  }
  function woodTex(base = '#6b4326', seed = 3) {
    const o = canvasTex(256, 256, (x, w) => {
      const R = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, w);
      for (let i = 0; i < 70; i++) {
        x.strokeStyle = `rgba(${R() < .5 ? '30,15,5' : '160,110,60'},${.1 + R() * .2})`; x.lineWidth = 1 + R() * 2;
        const y = R() * w; x.beginPath(); x.moveTo(0, y);
        for (let xx = 0; xx <= w; xx += 32) x.lineTo(xx, y + Math.sin(xx * .03 + i) * 4 + (R() - .5) * 3);
        x.stroke();
      }
    });
    return o.t;
  }

  /* ---------- 動態貼圖 ---------- */
  function makeCeiling() {
    const base = document.createElement('canvas'); base.width = CW; base.height = CH;
    const bx = base.getContext('2d'), R = rng(77);
    bx.fillStyle = '#d6d1c4'; bx.fillRect(0, 0, CW, CH);
    for (let i = 0; i < 60; i++) {
      const g = bx.createRadialGradient(R() * CW, R() * CH, 0, R() * CW, R() * CH, 60 + R() * 200);
      g.addColorStop(0, `rgba(0,0,0,${R() * .035})`); g.addColorStop(1, 'rgba(0,0,0,0)'); bx.fillStyle = g; bx.fillRect(0, 0, CW, CH);
    }
    for (let i = 0; i < 26000; i++) { bx.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * .07})`; bx.fillRect(R() * CW, R() * CH, 2, 2); }
    // 舊的水漬
    const g = bx.createRadialGradient(780, 260, 0, 780, 260, 120); g.addColorStop(0, 'rgba(140,110,60,.12)'); g.addColorStop(.8, 'rgba(140,110,60,.06)'); g.addColorStop(1, 'rgba(140,110,60,0)');
    bx.fillStyle = g; bx.beginPath(); bx.arc(780, 260, 120, 0, Math.PI * 2); bx.fill();

    // 裂縫
    const segs = [], pts = [];
    const cx0 = CW / 2, cy0 = CH / 2;
    function branch(x, y, ang, len, w, t0, depth) {
      const steps = 10 + (R() * 8 | 0);
      for (let i = 0; i < steps; i++) {
        ang += (R() - .5) * .8;
        const l = len / steps * (.6 + R() * .8);
        const nx = x + Math.cos(ang) * l, ny = y + Math.sin(ang) * l, t1 = t0 + l;
        segs.push({ x1: x, y1: y, x2: nx, y2: ny, t0, t1, w });
        if (R() < .35) pts.push({ x: nx, y: ny, t: t1, w });
        if (depth < 3 && R() < .2) branch(nx, ny, ang + (R() < .5 ? -1 : 1) * (.5 + R() * .8), len * .55, w * .65, t1, depth + 1);
        x = nx; y = ny; t0 = t1; w *= .94;
      }
    }
    for (let k = 0; k < 7; k++) branch(cx0, cy0, k * Math.PI * 2 / 7 + R() * .6, 380 + R() * 300, 4.2, 0, 0);
    const maxT = Math.max(...segs.map(s => s.t1));
    segs.forEach(s => { s.t0 /= maxT; s.t1 /= maxT; }); pts.forEach(p => p.t /= maxT);
    const stains = Array.from({ length: 26 }, () => {
      const p = pts[(R() * pts.length) | 0] || { x: cx0, y: cy0, t: 0 };
      return { x: p.x + (R() - .5) * 60, y: p.y + (R() - .5) * 60, r: 60 + R() * 170, t: p.t * .8 };
    });
    stains.push({ x: cx0, y: cy0, r: 260, t: 0 });
    const oozes = pts.filter((_, i) => i % 2 === 0).slice(0, 46).map(p => ({ ...p, r: 6 + R() * 18, sx: (R() - .5) * 20, sy: (R() - .5) * 20 }));

    const tx = canvasTex(CW, CH);
    const C = { base, segs, pts, stains, oozes, tex: tx.t, x: tx.x, crack: 0, stain: 0, ooze: 0, dirty: true };
    C.draw = function () {
      const x = tx.x; x.drawImage(base, 0, 0);
      if (C.stain > 0) {
        x.save(); x.globalCompositeOperation = 'multiply';
        C.stains.forEach(s => {
          const k = Math.max(0, Math.min(1, (C.stain - s.t) / (1 - s.t + 0.001)));
          if (k <= 0) return;
          const r = s.r * (.4 + .6 * k), gg = x.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
          gg.addColorStop(0, `rgba(176,128,52,${.75 * k})`); gg.addColorStop(.7, `rgba(196,150,70,${.45 * k})`); gg.addColorStop(1, 'rgba(210,170,90,0)');
          x.fillStyle = gg; x.beginPath(); x.arc(s.x, s.y, r, 0, Math.PI * 2); x.fill();
        });
        x.restore();
      }
      if (C.crack > 0) {
        x.lineCap = 'round';
        C.segs.forEach(s => {
          if (C.crack <= s.t0) return;
          const f = Math.min(1, (C.crack - s.t0) / (s.t1 - s.t0));
          const ex = s.x1 + (s.x2 - s.x1) * f, ey = s.y1 + (s.y2 - s.y1) * f;
          x.strokeStyle = 'rgba(255,250,235,.14)'; x.lineWidth = s.w + 3;
          x.beginPath(); x.moveTo(s.x1 + 1.5, s.y1 + 1.5); x.lineTo(ex + 1.5, ey + 1.5); x.stroke();
          x.strokeStyle = 'rgba(22,15,10,.97)'; x.lineWidth = s.w * 1.25;
          x.beginPath(); x.moveTo(s.x1, s.y1); x.lineTo(ex, ey); x.stroke();
        });
      }
      if (C.ooze > 0) {
        C.oozes.forEach(o => {
          const k = Math.max(0, Math.min(1, (C.ooze - o.t * .6) * 2.2));
          if (k <= 0) return;
          const r = o.r * k;
          x.fillStyle = 'rgba(52,24,10,.95)';
          x.beginPath(); x.ellipse(o.x + o.sx * k, o.y + o.sy * k, r * 1.3, r, o.t * 7, 0, Math.PI * 2); x.fill();
          x.fillStyle = 'rgba(90,45,20,.9)';
          x.beginPath(); x.ellipse(o.x, o.y, r * .8, r * .6, o.t * 5, 0, Math.PI * 2); x.fill();
          x.fillStyle = 'rgba(255,220,180,.35)';
          x.beginPath(); x.arc(o.x - r * .3, o.y - r * .3, r * .22, 0, Math.PI * 2); x.fill();
        });
      }
      tx.t.needsUpdate = true; C.dirty = false;
    };
    C.draw();
    return C;
  }

  function makePortrait() {
    const o = canvasTex(256, 320);
    const P = { tex: o.t, smile: 0, last: -1 };
    const R = rng(21);
    const specks = Array.from({ length: 900 }, () => [R() * 256, R() * 320, R()]);
    const scratches = Array.from({ length: 14 }, () => [R() * 256, R() * 320, (R() - .5) * 40, 20 + R() * 120, R()]);
    const tmp = document.createElement('canvas'); tmp.width = 256; tmp.height = 320;
    const tx = tmp.getContext('2d');
    P.draw = function () {
      const x = tx, s = P.smile, cx = 128;
      // 照相館的背景布
      let g = x.createRadialGradient(cx, 120, 10, cx, 150, 210);
      g.addColorStop(0, '#83705a'); g.addColorStop(.6, '#4c3f30'); g.addColorStop(1, '#1d1712');
      x.fillStyle = g; x.fillRect(0, 0, 256, 320);
      // 後面的頭髮
      x.fillStyle = '#0d0907';
      x.beginPath(); x.moveTo(70, 150); x.quadraticCurveTo(64, 70, cx, 66); x.quadraticCurveTo(192, 70, 186, 150);
      x.lineTo(196, 262); x.quadraticCurveTo(cx, 280, 60, 262); x.closePath(); x.fill();
      // 高領的深色衣服
      x.fillStyle = '#15100c';
      x.beginPath(); x.moveTo(8, 320); x.quadraticCurveTo(26, 236, 96, 222); x.lineTo(160, 222); x.quadraticCurveTo(230, 236, 248, 320); x.fill();
      x.fillStyle = '#221a14'; x.fillRect(104, 206, 48, 26);
      // 脖子
      g = x.createLinearGradient(0, 190, 0, 222); g.addColorStop(0, '#6e5c44'); g.addColorStop(1, '#a08a6a');
      x.fillStyle = g; x.fillRect(112, 188, 32, 26);
      // 臉
      const fw = 47 + s * 3;
      g = x.createRadialGradient(120, 122, 8, cx, 140, 78);
      g.addColorStop(0, '#dccaa6'); g.addColorStop(.65, '#b39d78'); g.addColorStop(1, '#6d5a40');
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, 140, fw, 61, 0, 0, Math.PI * 2); x.fill();
      // 顴骨與臉頰的陰影（笑越開，臉頰被拉得越凹）
      [[-1, 96], [1, 160]].forEach(([d, sx]) => {
        const cg = x.createRadialGradient(sx, 160, 2, sx, 160, 26 + s * 6);
        cg.addColorStop(0, `rgba(60,42,26,${.25 + s * .25})`); cg.addColorStop(1, 'rgba(60,42,26,0)');
        x.fillStyle = cg; x.beginPath(); x.arc(sx, 160, 34, 0, Math.PI * 2); x.fill();
      });
      // 中分的前髮，蓋住額頭兩側
      x.fillStyle = '#0d0907';
      x.beginPath(); x.moveTo(cx, 80); x.quadraticCurveTo(92, 86, 80, 150); x.quadraticCurveTo(76, 110, 84, 96); x.quadraticCurveTo(100, 84, cx, 80); x.fill();
      x.beginPath(); x.moveTo(cx, 80); x.quadraticCurveTo(164, 86, 176, 150); x.quadraticCurveTo(180, 110, 172, 96); x.quadraticCurveTo(156, 84, cx, 80); x.fill();
      x.beginPath(); x.moveTo(cx - 2, 76); x.quadraticCurveTo(100, 90, 82, 160); x.lineTo(76, 160); x.quadraticCurveTo(80, 84, cx, 72); x.fill();
      x.beginPath(); x.moveTo(cx + 2, 76); x.quadraticCurveTo(156, 90, 174, 160); x.lineTo(180, 160); x.quadraticCurveTo(176, 84, cx, 72); x.fill();
      // 眼窩
      [[108, 132], [148, 132]].forEach(([ex, ey]) => {
        const eg = x.createRadialGradient(ex, ey, 2, ex, ey, 20);
        eg.addColorStop(0, `rgba(35,24,14,${.5 + s * .3})`); eg.addColorStop(1, 'rgba(35,24,14,0)');
        x.fillStyle = eg; x.beginPath(); x.ellipse(ex, ey, 20, 15, 0, 0, Math.PI * 2); x.fill();
      });
      // 眼睛：嘴巴在笑，眼睛卻越睜越大、瞳孔縮成一點
      [[108, 133], [148, 133]].forEach(([ex, ey], i) => {
        const ry = 4.2 + s * 3.2, rx = 9 + s * 1.2;
        x.fillStyle = '#cfc4ad'; x.beginPath(); x.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); x.fill();
        const look = (i ? -1 : 1) * s * 1.6; // 兩眼往中間看
        const ir = 3.9 - s * 1.3;
        x.fillStyle = '#1a120b'; x.beginPath(); x.arc(ex + look, ey, ir + 1.2, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#050302'; x.beginPath(); x.arc(ex + look, ey, Math.max(.8, ir - s * 2.2), 0, Math.PI * 2); x.fill();
        x.strokeStyle = 'rgba(25,16,10,.85)'; x.lineWidth = 1.8;
        x.beginPath(); x.ellipse(ex, ey, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
        x.strokeStyle = 'rgba(25,16,10,.4)'; x.lineWidth = 1;
        x.beginPath(); x.ellipse(ex, ey + 1, rx, ry + 2, 0, Math.PI * .1, Math.PI * .9); x.stroke();
      });
      // 眉毛
      x.strokeStyle = 'rgba(20,13,8,.85)'; x.lineWidth = 2.4;
      x.beginPath(); x.moveTo(96, 121 - s * 5); x.quadraticCurveTo(108, 116 - s * 7, 119, 121 - s * 3); x.stroke();
      x.beginPath(); x.moveTo(137, 121 - s * 3); x.quadraticCurveTo(148, 116 - s * 7, 160, 121 - s * 5); x.stroke();
      // 鼻子
      x.strokeStyle = 'rgba(70,50,32,.55)'; x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(124, 138); x.quadraticCurveTo(120, 156, 124, 160); x.stroke();
      x.fillStyle = 'rgba(50,34,20,.55)';
      x.beginPath(); x.ellipse(122, 162, 3, 1.6, .3, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(134, 162, 3, 1.6, -.3, 0, Math.PI * 2); x.fill();
      // 法令紋
      x.strokeStyle = `rgba(55,38,22,${.15 + s * .5})`; x.lineWidth = 1.4 + s;
      x.beginPath(); x.moveTo(114, 160); x.quadraticCurveTo(104 - s * 8, 172, 108 - s * 16, 184 - s * 6); x.stroke();
      x.beginPath(); x.moveTo(142, 160); x.quadraticCurveTo(152 + s * 8, 172, 148 + s * 16, 184 - s * 6); x.stroke();
      // 嘴
      const my = 178, mw = 13 + s * 40, lift = s * 17, open = Math.max(0, s - .3) * 20;
      if (open <= 0) {
        x.strokeStyle = 'rgba(60,30,20,.9)'; x.lineWidth = 2;
        x.beginPath(); x.moveTo(cx - mw, my + 1 - lift); x.quadraticCurveTo(cx, my + 3 - lift * .2 + s * 6, cx + mw, my + 1 - lift); x.stroke();
      } else {
        const top = (t) => my - lift * Math.pow(Math.abs(t), 1.6) - 1;
        const bot = (t) => my - lift * Math.pow(Math.abs(t), 1.6) + open * (1 - t * t) + 2;
        x.fillStyle = '#0b0403';
        x.beginPath();
        for (let i = -10; i <= 10; i++) { const t = i / 10; x[i === -10 ? 'moveTo' : 'lineTo'](cx + t * mw, top(t)); }
        for (let i = 10; i >= -10; i--) { const t = i / 10; x.lineTo(cx + t * mw, bot(t)); }
        x.fill();
        // 牙齒：一顆一顆，中間是黑色的縫
        const n = 14;
        for (let i = 0; i < n; i++) {
          const t0 = -0.92 + i * 1.84 / n, t1 = t0 + 1.84 / n * .78, tm = (t0 + t1) / 2;
          const th = 3 + open * .35 * (1 - tm * tm);
          x.fillStyle = `rgba(${215 - Math.abs(tm) * 50 | 0},${205 - Math.abs(tm) * 50 | 0},${180 - Math.abs(tm) * 50 | 0},.95)`;
          x.beginPath(); x.moveTo(cx + t0 * mw, top(t0) + .5); x.lineTo(cx + t1 * mw, top(t1) + .5);
          x.lineTo(cx + t1 * mw, top(t1) + th); x.lineTo(cx + t0 * mw, top(t0) + th); x.fill();
          if (open > 4) {
            const bh = 2 + open * .18 * (1 - tm * tm);
            x.fillStyle = 'rgba(170,160,140,.8)';
            x.beginPath(); x.moveTo(cx + t0 * mw, bot(t0) - .5); x.lineTo(cx + t1 * mw, bot(t1) - .5);
            x.lineTo(cx + t1 * mw, bot(t1) - bh); x.lineTo(cx + t0 * mw, bot(t0) - bh); x.fill();
          }
        }
        x.strokeStyle = 'rgba(70,30,22,.9)'; x.lineWidth = 1.6;
        x.beginPath(); for (let i = -10; i <= 10; i++) { const t = i / 10; x[i === -10 ? 'moveTo' : 'lineTo'](cx + t * mw, top(t) - 1); } x.stroke();
        // 嘴角撕裂一般往耳朵延伸
        if (s > .7) {
          const k = (s - .7) / .3;
          x.strokeStyle = `rgba(30,12,8,${.9 * k})`; x.lineWidth = 1.6;
          [-1, 1].forEach(d => {
            x.beginPath(); x.moveTo(cx + d * mw, top(1) + 1);
            x.quadraticCurveTo(cx + d * (mw + 10 * k), top(1) - 6 * k, cx + d * (mw + 16 * k), top(1) - 16 * k); x.stroke();
          });
        }
      }
      // 老照片：泛黃、暗角、刮痕、霉斑
      x.fillStyle = 'rgba(130,95,50,.16)'; x.fillRect(0, 0, 256, 320);
      g = x.createRadialGradient(cx, 150, 90, cx, 160, 200); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,6,3,.65)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 320);
      specks.forEach(([px, py, v]) => { x.fillStyle = `rgba(${v < .5 ? '0,0,0' : '250,236,210'},${v * .22})`; x.fillRect(px, py, 1.6, 1.6); });
      scratches.forEach(([sx, sy, dx, len, v]) => { x.strokeStyle = `rgba(240,228,200,${.08 + v * .12})`; x.lineWidth = .8; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + dx, sy + len); x.stroke(); });
      const mg = x.createRadialGradient(214, 46, 4, 214, 46, 46); mg.addColorStop(0, 'rgba(80,60,30,.35)'); mg.addColorStop(1, 'rgba(80,60,30,0)');
      x.fillStyle = mg; x.fillRect(150, 0, 106, 110);
      // 稍微模糊後貼到貼圖上，再加相紙白邊
      const ox = o.x;
      ox.save(); ox.filter = 'blur(0.6px)'; ox.drawImage(tmp, 0, 0); ox.restore();
      ox.strokeStyle = 'rgba(232,220,192,.92)'; ox.lineWidth = 12; ox.strokeRect(6, 6, 244, 308);
      ox.strokeStyle = 'rgba(120,100,70,.4)'; ox.lineWidth = 1; ox.strokeRect(12, 12, 232, 296);
      o.t.needsUpdate = true; P.last = s;
    };
    P.draw();
    return P;
  }

  function makeOutside() {
    const bg = document.createElement('canvas'); bg.width = bg.height = 512;
    const b = bg.getContext('2d'), R = rng(31);
    const g = b.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#0b1020'); g.addColorStop(1, '#1b2134');
    b.fillStyle = g; b.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9; i++) {
      const bw = 50 + R() * 80, bh = 120 + R() * 280, bx = R() * 512;
      b.fillStyle = '#070910'; b.fillRect(bx, 512 - bh, bw, bh);
      for (let wy = 512 - bh + 10; wy < 512; wy += 22) for (let wx = bx + 6; wx < bx + bw - 8; wx += 16)
        if (R() < .07) { b.fillStyle = R() < .5 ? 'rgba(255,210,140,.7)' : 'rgba(170,200,255,.6)'; b.fillRect(wx, wy, 6, 9); }
    }
    const o = canvasTex(512, 512);
    const drops = Array.from({ length: 220 }, () => ({ x: Math.random() * 512, y: Math.random() * 512, v: 600 + Math.random() * 500, l: 14 + Math.random() * 20 }));
    return {
      tex: o.t, draw(dt, flash, rainK) {
        const x = o.x; x.drawImage(bg, 0, 0);
        if (flash > 0) { x.fillStyle = `rgba(200,215,255,${flash * .85})`; x.fillRect(0, 0, 512, 512); }
        x.strokeStyle = `rgba(190,205,235,${.25 + flash * .4})`; x.lineWidth = 1.2; x.beginPath();
        drops.forEach(d => {
          d.y += d.v * dt * rainK; d.x -= d.v * dt * .08 * rainK;
          if (d.y > 512) { d.y -= 512 + d.l; d.x = Math.random() * 540; }
          if (rainK > 0.02) { x.moveTo(d.x, d.y); x.lineTo(d.x - d.l * .08, d.y + d.l); }
        });
        x.stroke();
        o.t.needsUpdate = true;
      }
    };
  }

  function makeGlass() {
    const o = canvasTex(256, 256);
    const beads = Array.from({ length: 70 }, () => ({ x: Math.random() * 256, y: Math.random() * 256, r: 1 + Math.random() * 3.5, v: Math.random() < .25 ? 20 + Math.random() * 60 : 0 }));
    return {
      tex: o.t, draw(dt, flash) {
        const x = o.x; x.clearRect(0, 0, 256, 256);
        x.fillStyle = `rgba(150,170,200,${.06 + flash * .2})`; x.fillRect(0, 0, 256, 256);
        beads.forEach(b => {
          b.y += b.v * dt; if (b.y > 260) { b.y = -5; b.x = Math.random() * 256; }
          x.fillStyle = `rgba(210,225,255,${.35 + flash * .4})`; x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2); x.fill();
          if (b.v) { x.strokeStyle = 'rgba(200,215,245,.18)'; x.lineWidth = b.r * .8; x.beginPath(); x.moveTo(b.x, b.y - 2); x.lineTo(b.x, b.y - 18); x.stroke(); }
        });
        o.t.needsUpdate = true;
      }
    };
  }

  function glowSprite(color, size) {
    const o = canvasTex(64, 64, (x) => {
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    });
    const s = new T.Sprite(new T.SpriteMaterial({ map: o.t, blending: T.AdditiveBlending, transparent: true, depthWrite: false }));
    s.scale.set(size, size, 1); return s;
  }

  /* =================================================================== */
  const Dream = {};
  Dream.start = function (host) {
    return new Promise(resolveAll => {
      const el = G.el('div', 'screen dream');
      const canvas = G.el('canvas', 'gl');
      const lidT = G.el('div', 'lid top'), lidB = G.el('div', 'lid bot');
      const hintEl = G.el('div', 'look-hint', '<svg viewBox="0 0 40 40"><path d="M8 8 L30 20 L8 32 Z" fill="#ff5a48"/></svg>');
      const keysEl = G.el('div', 'keys-hint');
      const dpad = G.el('div', 'dpad', '<button class="u">▲</button><button class="l">◀</button><button class="r">▶</button><button class="d">▼</button>');
      el.append(canvas, lidT, lidB, hintEl, keysEl, dpad);
      host.appendChild(el);

      const renderer = new T.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      const scene = new T.Scene();
      scene.background = new T.Color(0x000000);
      scene.fog = new T.Fog(0x05070d, 3.5, 9);
      const camera = new T.PerspectiveCamera(70, 1, 0.02, 30);
      function resize() {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      }
      resize(); window.addEventListener('resize', resize);

      /* ---------- 房間 ---------- */
      const wallT = plaster('#c9c4b8', 11); wallT.t.wrapS = wallT.t.wrapT = T.RepeatWrapping; wallT.t.repeat.set(2, 2);
      const wallMat = new T.MeshStandardMaterial({ map: wallT.t, roughness: .95 });
      const add = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; scene.add(m); return m; };
      const box = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return add(m); };

      const floor = new T.Mesh(new T.PlaneGeometry(RW, RL), new T.MeshStandardMaterial({ map: floorTex(), roughness: .55 }));
      floor.rotation.x = -Math.PI / 2; add(floor, false);
      const ceil = makeCeiling();
      const ceilMesh = new T.Mesh(new T.PlaneGeometry(RW, RL), new T.MeshStandardMaterial({ map: ceil.tex, roughness: .95 }));
      ceilMesh.rotation.x = Math.PI / 2; ceilMesh.position.y = RH; add(ceilMesh, false);
      const wR = new T.Mesh(new T.PlaneGeometry(RL, RH), wallMat); wR.position.set(-HX, RH / 2, 0); wR.rotation.y = Math.PI / 2; add(wR, false);
      const wF = new T.Mesh(new T.PlaneGeometry(RW, RH), wallMat); wF.position.set(0, RH / 2, HZ); wF.rotation.y = Math.PI; add(wF, false);
      const wH = new T.Mesh(new T.PlaneGeometry(RW, RH), wallMat); wH.position.set(0, RH / 2, -HZ); add(wH, false);
      // 有窗戶的牆（+x）
      const WX = HX + 0.05;
      box(0.1, RH, WZ0 + HZ, wallMat, WX, RH / 2, (-HZ + WZ0) / 2);
      box(0.1, RH, HZ - WZ1, wallMat, WX, RH / 2, (WZ1 + HZ) / 2);
      box(0.1, WY0, WZ1 - WZ0, wallMat, WX, WY0 / 2, (WZ0 + WZ1) / 2);
      box(0.1, RH - WY1, WZ1 - WZ0, wallMat, WX, (WY1 + RH) / 2, (WZ0 + WZ1) / 2);
      // 鋁窗框
      const alu = new T.MeshStandardMaterial({ color: 0x8d949b, metalness: .6, roughness: .4 });
      const wzc = (WZ0 + WZ1) / 2, wyc = (WY0 + WY1) / 2;
      box(0.06, 0.04, WZ1 - WZ0, alu, HX, WY0, wzc); box(0.06, 0.04, WZ1 - WZ0, alu, HX, WY1, wzc);
      box(0.06, WY1 - WY0, 0.04, alu, HX, wyc, WZ0); box(0.06, WY1 - WY0, 0.04, alu, HX, wyc, WZ1);
      box(0.05, WY1 - WY0, 0.05, alu, HX + 0.02, wyc, wzc);
      // 鐵窗
      const iron = new T.MeshStandardMaterial({ color: 0x151515, roughness: .7, metalness: .4 });
      for (let z = WZ0 - 0.05; z <= WZ1 + 0.06; z += 0.11) box(0.015, 1.36, 0.015, iron, HX + 0.3, wyc, z);
      [WY0 - 0.06, wyc + 0.1, WY1 + 0.06].forEach(y => box(0.02, 0.02, WZ1 - WZ0 + 0.14, iron, HX + 0.3, y, wzc));
      // 窗外夜景與玻璃
      const outside = makeOutside();
      const outMesh = new T.Mesh(new T.PlaneGeometry(7, 5), new T.MeshBasicMaterial({ map: outside.tex, fog: false }));
      outMesh.position.set(HX + 2.6, 1.4, wzc); outMesh.rotation.y = -Math.PI / 2; scene.add(outMesh);
      const glass = makeGlass();
      const glassMesh = new T.Mesh(new T.PlaneGeometry(WZ1 - WZ0, WY1 - WY0), new T.MeshBasicMaterial({ map: glass.tex, transparent: true, depthWrite: false }));
      glassMesh.position.set(HX + 0.01, wyc, wzc); glassMesh.rotation.y = -Math.PI / 2; scene.add(glassMesh);
      // 窗簾
      const curtainMat = new T.MeshStandardMaterial({ color: 0xcfc9bd, roughness: 1, transparent: true, opacity: .82, side: T.DoubleSide });
      const curtains = [];
      [[WZ0 - 0.12, 0.42], [WZ1 + 0.12, 0.42]].forEach(([zc, wdt], i) => {
        const geo = new T.PlaneGeometry(wdt, 1.75, 24, 1);
        const pos = geo.attributes.position;
        for (let k = 0; k < pos.count; k++) pos.setZ(k, Math.sin(pos.getX(k) * 46) * 0.025);
        geo.computeVertexNormals();
        const m = new T.Mesh(geo, curtainMat); m.position.set(HX - 0.07, 1.42, zc + (i ? -wdt / 2 + 0.12 : wdt / 2 - 0.12)); m.rotation.y = -Math.PI / 2;
        add(m); curtains.push(m);
      });
      box(0.04, 0.04, WZ1 - WZ0 + 0.7, alu, HX - 0.07, 2.32, wzc);

      // 床
      const wood = new T.MeshStandardMaterial({ map: woodTex('#5e3a22', 4), roughness: .7 });
      const floral = floralTex();
      box(1.6, 0.32, 2.05, wood, 0, 0.16, -HZ + 1.025);
      box(1.52, 0.2, 1.98, new T.MeshStandardMaterial({ map: floral, roughness: .95 }), 0, 0.42, -HZ + 1.02);
      box(1.7, 1.05, 0.07, wood, 0, 0.525, -HZ + 0.035);
      const pillow = new T.Mesh(new T.SphereGeometry(1, 24, 12), new T.MeshStandardMaterial({ color: 0xe8e3d6, roughness: 1 }));
      pillow.scale.set(0.34, 0.07, 0.2); pillow.position.set(0, 0.58, -1.47); add(pillow);
      // 棉被（底下是自己的身體）
      const bgeo = new T.PlaneGeometry(1.56, 1.34, 40, 40);
      bgeo.rotateX(-Math.PI / 2);
      const bp = bgeo.attributes.position;
      for (let k = 0; k < bp.count; k++) {
        const px = bp.getX(k), pz = bp.getZ(k) - 0.43;   // pz 對應世界 z（-1.1 ~ 0.24）
        let hgt = 0.56;
        const torso = Math.max(0, 1 - (px / 0.3) ** 2) * (pz > -1.1 && pz < -0.35 ? 1 : Math.max(0, 1 - Math.abs(pz + 0.35) * 6));
        hgt += torso * 0.17;
        [-0.13, 0.13].forEach(lx => { const lg = Math.max(0, 1 - ((px - lx) / 0.12) ** 2) * (pz > -0.4 && pz < 0.1 ? 1 : 0); hgt += lg * 0.09; });
        [-0.13, 0.13].forEach(lx => { const ft = Math.max(0, 1 - ((px - lx) / 0.09) ** 2 - ((pz - 0.12) / 0.08) ** 2); hgt += ft * 0.12; });
        const edge = Math.max(0, Math.abs(px) - 0.62); hgt -= edge * 1.6;
        bp.setY(k, hgt);
      }
      bgeo.computeVertexNormals();
      const blanket = new T.Mesh(bgeo, new T.MeshStandardMaterial({ map: floral, roughness: 1, side: T.DoubleSide }));
      blanket.position.set(0, 0, -0.43); add(blanket);

      // 床頭櫃與水杯
      box(0.42, 0.58, 0.42, wood, -1.03, 0.29, -1.4);
      const cupPos = new T.Vector3(-0.98, 0.58, -1.3);
      const cupG = new T.Group(); cupG.position.copy(cupPos); cupG.scale.setScalar(1.35); scene.add(cupG);
      const cup = new T.Mesh(new T.CylinderGeometry(0.036, 0.03, 0.115, 28, 1, true), new T.MeshStandardMaterial({ color: 0xdfefff, transparent: true, opacity: .35, roughness: .05, side: T.DoubleSide, depthWrite: false }));
      cup.position.y = 0.0575; cupG.add(cup);
      const cupBottom = new T.Mesh(new T.CircleGeometry(0.03, 24), cup.material); cupBottom.rotation.x = -Math.PI / 2; cupBottom.position.y = 0.002; cupG.add(cupBottom);
      const waterMat = new T.MeshStandardMaterial({ color: 0x9cc6e8, transparent: true, opacity: .7, roughness: .05, emissive: 0x0d2233 });
      const waterNormal = new T.Mesh(new T.CylinderGeometry(0.033, 0.03, 0.065, 28), waterMat); waterNormal.position.y = 0.035; cupG.add(waterNormal);
      const waterInv = new T.Mesh(new T.CylinderGeometry(0.0355, 0.034, 0.06, 28), waterMat); waterInv.position.y = 0.083; waterInv.visible = false; cupG.add(waterInv);
      const cupGlow = glowSprite('rgba(120,170,255,.35)', 0.25); cupGlow.position.set(0, 0.09, 0); cupG.add(cupGlow);
      const upDrops = [], dropGeo = new T.SphereGeometry(0.007, 8, 6);

      // 牆上的照片
      const portrait = makePortrait();
      const portraitPos = new T.Vector3(-HX + 0.03, 1.5, -0.8);
      const picFrame = box(0.04, 0.62, 0.5, new T.MeshStandardMaterial({ color: 0x2a1a10, roughness: .5 }), -HX + 0.02, portraitPos.y, portraitPos.z);
      const pic = new T.Mesh(new T.PlaneGeometry(0.4, 0.5), new T.MeshStandardMaterial({ map: portrait.tex, roughness: .4 }));
      pic.position.set(-HX + 0.045, portraitPos.y, portraitPos.z); pic.rotation.y = Math.PI / 2; scene.add(pic);

      // 衣櫃、斗櫃、門
      box(0.6, 2.1, 1.3, new T.MeshStandardMaterial({ map: woodTex('#6e4528', 8), roughness: .65 }), -HX + 0.3, 1.05, 0.95);
      box(0.45, 0.85, 0.9, new T.MeshStandardMaterial({ map: woodTex('#7a5030', 9), roughness: .65 }), HX - 0.23, 0.425, 1.05);
      const doorGap = new T.Mesh(new T.PlaneGeometry(0.85, 2.05), new T.MeshBasicMaterial({ color: 0x000000 }));
      doorGap.position.set(0.95, 1.025, HZ - 0.005); doorGap.rotation.y = Math.PI; scene.add(doorGap);
      const doorPivot = new T.Group(); doorPivot.position.set(1.375, 0, HZ - 0.02); doorPivot.rotation.y = -0.32; scene.add(doorPivot);
      const door = new T.Mesh(new T.BoxGeometry(0.85, 2.05, 0.04), new T.MeshStandardMaterial({ map: woodTex('#8a6a48', 12), roughness: .7 }));
      door.position.set(-0.425, 1.025, 0); door.castShadow = door.receiveShadow = true; doorPivot.add(door);
      // 吸頂燈
      const lampMat = new T.MeshStandardMaterial({ color: 0xeeeeea, roughness: .4, emissive: 0x000000 });
      const lamp = new T.Mesh(new T.BoxGeometry(1.2, 0.05, 0.16), lampMat); lamp.position.set(0, RH - 0.025, 1.25); add(lamp, false);
      const tube = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 1.1, 10), lampMat); tube.rotation.z = Math.PI / 2; tube.position.set(0, RH - 0.07, 1.25); add(tube, false);

      // 老電扇
      const teal = new T.MeshStandardMaterial({ color: 0x2c7a82, metalness: .45, roughness: .32 });
      const chrome = new T.MeshStandardMaterial({ color: 0xd2d8dc, metalness: .9, roughness: .22 });
      const fanG = new T.Group(); fanG.position.set(0.18, 0, 0.55); fanG.scale.setScalar(1.25); scene.add(fanG);
      const fbase = new T.Mesh(new T.CylinderGeometry(0.17, 0.2, 0.05, 32), teal); fbase.position.y = 0.025; fanG.add(fbase);
      const pole = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.9, 12), chrome); pole.position.y = 0.48; fanG.add(pole);
      const fanHead = new T.Group(); fanHead.position.y = 0.97; fanG.add(fanHead);
      const motor = new T.Mesh(new T.SphereGeometry(1, 24, 16), teal); motor.scale.set(0.085, 0.085, 0.12); motor.position.z = 0.1; fanHead.add(motor);
      [[-0.06, 0.2], [0.05, 0.2], [0.05, 0.15]].forEach(([z, r]) => {
        const ring = new T.Mesh(new T.TorusGeometry(r, 0.004, 6, 48), chrome); ring.position.z = z - 0.01; fanHead.add(ring);
      });
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2;
        const sp = new T.Mesh(new T.CylinderGeometry(0.0022, 0.0022, 0.2, 4), chrome);
        sp.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, -0.07); sp.rotation.z = a - Math.PI / 2; fanHead.add(sp);
      }
      const badge = new T.Mesh(new T.CircleGeometry(0.032, 24), new T.MeshStandardMaterial({ color: 0xa8261d, metalness: .3, roughness: .4 }));
      badge.position.z = -0.075; badge.rotation.y = Math.PI; fanHead.add(badge);
      const blades = new T.Group(); blades.position.z = -0.01; fanHead.add(blades);
      const bladeMat = new T.MeshStandardMaterial({ color: 0x3f9aa4, metalness: .3, roughness: .35, transparent: true, opacity: .85, side: T.DoubleSide });
      for (let i = 0; i < 4; i++) {
        const b = new T.Mesh(new T.SphereGeometry(1, 16, 8), bladeMat); b.scale.set(0.055, 0.12, 0.006);
        const piv = new T.Group(); piv.rotation.z = i * Math.PI / 2; b.position.y = 0.1; b.rotation.y = 0.35; piv.add(b); blades.add(piv);
      }
      fanG.traverse(o => { if (o.isMesh) o.castShadow = true; });

      // 彈珠
      const marble = new T.Mesh(new T.SphereGeometry(0.04, 24, 16), new T.MeshStandardMaterial({ color: 0x77e6d6, emissive: 0x135a52, roughness: .06, metalness: .2 }));
      marble.visible = false; scene.add(marble);
      const marbleGlow = glowSprite('rgba(140,255,240,.75)', 0.28); marble.add(marbleGlow);

      // 天花板滴下來的液體
      const dripMat = new T.MeshStandardMaterial({ color: 0x3a1c0c, roughness: .12, metalness: .15 });
      const drips = [];
      function addDrip(pos, maxLen, delay, rad) {
        const g = new T.Group(); g.position.copy(pos); g.position.y = RH - 0.002;
        const stem = new T.Mesh(new T.CylinderGeometry(rad * 0.55, rad, 1, 10), dripMat); stem.position.y = -0.5; stem.scale.y = 0.001;
        const tip = new T.Mesh(new T.SphereGeometry(rad * 1.15, 12, 10), dripMat); tip.scale.y = 1.5; tip.position.y = 0;
        const holder = new T.Group(); holder.add(stem); g.add(holder); g.add(tip);
        scene.add(g);
        const d = { g, stem, holder, tip, len: 0, maxLen, delay, rad };
        drips.push(d); return d;
      }

      /* ---------- 光源 ---------- */
      const hemi = new T.HemisphereLight(0x55638a, 0x221a14, 0.8); scene.add(hemi);
      const spot = new T.SpotLight(0xa4b9e8, 1.5, 0, 0.62, 0.65, 1);
      spot.position.set(HX + 2.4, 0.15, wzc); spot.target.position.set(-0.7, RH, -0.75);
      spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0006; spot.shadow.camera.near = 0.5; spot.shadow.camera.far = 12;
      scene.add(spot); scene.add(spot.target);
      const fill = new T.PointLight(0x7484b0, 0.5, 7); fill.position.set(0, 1.9, 0.2); scene.add(fill);

      /* ---------- 狀態 ---------- */
      let yaw = 0, pitch = DEF_PITCH, vy = 0, vp = 0;
      let control = false, forced = null, autoTarget = null;
      let flash = 0, flashQ = [], lightsK = 1, rainK = 1, fanSpeed = 1, fanStopped = false;
      let fovT = 70, focusTarget = null, gray = false;
      let t = 0, last = performance.now(), running = true;
      let marbleAnim = null, gravityReversed = false, nextBolt = 6;
      const keys = {};
      const KM = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' };
      const kd = (e) => { const k = KM[e.key]; if (k) { keys[k] = true; e.preventDefault(); } };
      const ku = (e) => { const k = KM[e.key]; if (k) keys[k] = false; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      dpad.querySelectorAll('button').forEach(b => {
        const k = b.className;
        const on = (e) => { e.preventDefault(); keys[k] = true; b.classList.add('on'); };
        const off = () => { keys[k] = false; b.classList.remove('on'); };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
      });
      let drag = null;
      canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; });
      window.addEventListener('pointermove', onMove);
      function onMove(e) {
        if (!drag || !control) return;
        yaw += (e.clientX - drag.x) * 0.0045; pitch -= (e.clientY - drag.y) * 0.0045;
        drag = { x: e.clientX, y: e.clientY };
      }
      const endDrag = () => { drag = null; };
      window.addEventListener('pointerup', endDrag);

      AudioSys.rain.start(0.55, 3);
      AudioSys.fan.start(0.5, 2, { panFn: () => -Math.sin(fanHead.rotation.y) * 0.8 });
      AudioSys.drone.start(0.16, 4, { base: 49 });

      function setLids(p) { lidT.style.height = lidB.style.height = (p * 52) + '%'; }
      setLids(1);
      async function openEyes() {
        const seq = [[.7, 500], [1, 260], [.45, 700], [.8, 300], [.15, 900], [0, 600]];
        for (const [p, ms] of seq) { lidT.style.transition = lidB.style.transition = `height ${ms}ms ease`; setLids(p); await G.wait(ms); }
        lidT.style.transition = lidB.style.transition = 'height 120ms ease';
      }
      async function blink() { setLids(1); await G.wait(130); setLids(0); }
      let blinkTimer = setInterval(() => { if (control && Math.random() < .5) blink(); }, 7000);

      function bolt(power = 1) {
        flashQ = [[0, 1], [0.07, 0.15], [0.12, 0.9], [0.2, 0.3], [0.32, 0.6], [0.5, 0]].map(([dt, v]) => [t + dt, v * power]);
        AudioSys.sfx.thunder(0.6 + Math.random() * 1.2, 0.6 + power * 0.4);
      }

      const fwd = new T.Vector3(), tmp = new T.Vector3();
      function applyCam() {
        const c = Math.cos(pitch), s = Math.sin(pitch), ca = Math.cos(yaw), sa = Math.sin(yaw);
        const f = tmp.set(c * sa, c * ca, s);
        camera.position.copy(CAM); camera.position.y += Math.sin(t * 1.5) * 0.004;
        camera.up.set(s * sa, s * ca, -c);
        camera.lookAt(camera.position.clone().add(f));
      }
      function angleTo(pos) { camera.getWorldDirection(fwd); return fwd.angleTo(pos.clone().sub(camera.position).normalize()) * 180 / Math.PI; }
      // 讓鏡頭朝向某個點需要的 yaw / pitch
      function anglesFor(pos) {
        const d = pos.clone().sub(CAM).normalize();
        const p = Math.atan2(d.z, Math.hypot(d.x, d.y));
        const y = Math.atan2(d.x, d.y);
        return { yaw: Math.max(-1.75, Math.min(1.75, y)), pitch: Math.max(-0.75, Math.min(1.5, p)) };
      }

      function updateHint(target) {
        if (!target) { hintEl.classList.remove('show'); return; }
        const v = target.clone().project(camera);
        const behind = v.z > 1;
        let nx = v.x, ny = v.y; if (behind) { nx = -nx; ny = -ny; }
        if (!behind && Math.abs(nx) < .8 && Math.abs(ny) < .8) { hintEl.classList.remove('show'); return; }
        const a = Math.atan2(ny, nx), W = el.clientWidth, H = el.clientHeight, r = Math.min(W, H) * .36;
        hintEl.style.left = (W / 2 + Math.cos(a) * r) + 'px'; hintEl.style.top = (H / 2 - Math.sin(a) * r) + 'px';
        hintEl.style.transform = `rotate(${-a}rad)`;
        hintEl.classList.add('show');
      }

      // 等待玩家看向某個點，看夠久才算數
      function waitLook(pos, holdMs = 900, deg = 16, opts = {}) {
        return new Promise(res => {
          let held = 0, waited = 0;
          const o = { pos, focus: !!opts.focus, force: false, check(dt) {
            waited += dt;
            const ok = angleTo(pos) < deg;
            held = ok ? held + dt : Math.max(0, held - dt * 2);
            const showHint = waited > (opts.hintAfter || 8) && !ok;
            updateHint(showHint ? pos : null);
            if (waited > (opts.autoAfter || 45) && !autoTarget) autoTarget = anglesFor(pos);
            if (o.force || held * 1000 >= holdMs) {
              autoTarget = null; updateHint(null);
              if (o.focus) focusTarget = pos;
              res(); return true;
            }
            return false;
          } };
          lookers.push(o);
        });
      }
      const lookers = [];
      function keysHint(text) { keysEl.textContent = text || ''; keysEl.classList.toggle('show', !!text); }

      /* ---------- 主迴圈 ---------- */
      function frame(now) {
        if (!running) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;

        // 鏡頭控制
        if (control && !autoTarget) {
          const ay = (keys.l ? 1 : 0) - (keys.r ? 1 : 0), ap = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
          vy += (ay * 1.25 - vy) * Math.min(1, dt * 5); vp += (ap * 1.1 - vp) * Math.min(1, dt * 5);
          yaw += vy * dt; pitch += vp * dt;
        } else {
          const tgt = forced || autoTarget;
          if (tgt) { yaw += (tgt.yaw - yaw) * Math.min(1, dt * (tgt.k || 1.4)); pitch += (tgt.pitch - pitch) * Math.min(1, dt * (tgt.k || 1.4)); }
          vy = vp = 0;
        }
        yaw = Math.max(-1.75, Math.min(1.75, yaw)); pitch = Math.max(-0.75, Math.min(1.5, pitch));
        applyCam();
        for (let i = lookers.length - 1; i >= 0; i--) if (lookers[i].check(dt)) lookers.splice(i, 1);
        // 盯著看的時候畫面會微微拉近
        let fovGoal = 70;
        if ((focusTarget && angleTo(focusTarget) < 14) || lookers.some(l => l.focus && angleTo(l.pos) < 14)) fovGoal = 48;
        fovT += (fovGoal - fovT) * Math.min(1, dt * 1.5);
        if (Math.abs(camera.fov - fovT) > 0.01) { camera.fov = fovT; camera.updateProjectionMatrix(); }

        // 閃電
        if (control && t > nextBolt) { bolt(0.6 + Math.random() * .4); nextBolt = t + 14 + Math.random() * 14; }
        while (flashQ.length && flashQ[0][0] <= t) { flash = flashQ.shift()[1]; }
        flash *= Math.pow(0.02, dt);
        const fl = flash * lightsK;
        spot.intensity = (1.5 + fl * 6) * lightsK;
        hemi.intensity = 0.8 * lightsK + fl * 0.9;
        fill.intensity = 0.5 * lightsK;

        // 電扇
        if (!fanStopped) {
          fanHead.rotation.y = Math.sin(t * 2 * Math.PI / 6.5 * fanSpeed) * 0.75;
          blades.rotation.z -= dt * 26 * fanSpeed;
        }
        // 窗外與玻璃
        outside.draw(dt, fl, rainK); glass.draw(dt, fl);
        curtains.forEach((c, i) => { c.rotation.x = Math.sin(t * .7 + i) * 0.02; });

        // 彈珠動畫
        if (marbleAnim) marbleAnim(dt);
        // 往上飄的水滴（重力反轉）
        if (gravityReversed && Math.random() < dt * 1.6) {
          const d = new T.Mesh(dropGeo, waterMat); d.position.copy(cupPos).add(new T.Vector3((Math.random() - .5) * .05, 0.16, (Math.random() - .5) * .05));
          scene.add(d); upDrops.push({ m: d, v: 0.05 });
        }
        for (let i = upDrops.length - 1; i >= 0; i--) {
          const u = upDrops[i]; u.v += dt * 0.6; u.m.position.y += u.v * dt;
          if (u.m.position.y > RH - 0.01) { scene.remove(u.m); upDrops.splice(i, 1); }
        }
        if (gravityReversed) waterInv.scale.y = 1 + Math.sin(t * 3) * 0.03;
        // 照片
        if (portrait.smile !== portrait.last) portrait.draw();
        // 天花板
        if (ceil.dirty && (t - (ceil.lastDraw || 0)) > 0.07) { ceil.draw(); ceil.lastDraw = t; }
        // 液體滴落
        drips.forEach(d => {
          if (d.speed && t > d.delay) {
            d.len = Math.min(d.maxLen, d.len + dt * d.speed * (0.6 + Math.sin(t * 2 + d.delay) * 0.4 + .4));
            d.holder.scale.y = 1; d.stem.scale.y = Math.max(0.001, d.len); d.stem.position.y = -d.len / 2;
            d.tip.position.y = -d.len; const ts = Math.min(1, 0.4 + d.len * 3); d.tip.scale.set(ts, ts * 1.5, ts);
          }
        });

        renderer.render(scene, camera);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      function tween(ms, fn) {
        return new Promise(res => {
          const t0 = performance.now();
          const step = (n) => { if (!running) return res(); const e = Math.min(1, (n - t0) / ms); fn(e); if (e < 1) requestAnimationFrame(step); else res(); };
          requestAnimationFrame(step);
        });
      }

      // 彈珠：在天花板上彈跳，然後滾向正中央
      function runMarble() {
        return new Promise(res => {
          const r = 0.04, ceilY = RH - r;
          const start = new T.Vector3(0.95, 0, -0.1), mid = new T.Vector3(0.55, 0, -0.32), center = new T.Vector3(0.0, 0, 0.02);
          const hs = [0.36, 0.19, 0.09, 0.04, 0.016];
          const g = 9.8;
          const phases = [{ type: 'fall', dur: Math.sqrt(2 * 0.45 / g) }];
          hs.forEach(h => phases.push({ type: 'bounce', h, dur: 2 * Math.sqrt(2 * h / g) }));
          const bounceTotal = phases.reduce((a, p) => a + p.dur, 0);
          phases.push({ type: 'roll', dur: 3.4 });
          let pi = 0, pt = 0, elapsed = 0;
          marble.visible = true;
          const panOf = (p) => -Math.max(-1, Math.min(1, p.x / 1.2));
          marbleAnim = (dt) => {
            const ph = phases[pi]; pt += dt; elapsed += dt;
            const kH = Math.min(1, elapsed / bounceTotal);
            const hp = start.clone().lerp(mid, kH);
            if (ph.type === 'fall') {
              const e = Math.min(1, pt / ph.dur);
              marble.position.set(hp.x, ceilY - 0.45 * (1 - e * e), hp.z);
            } else if (ph.type === 'bounce') {
              const e = Math.min(1, pt / ph.dur);
              marble.position.set(hp.x, ceilY - 4 * ph.h * e * (1 - e), hp.z);
            } else {
              const e = Math.min(1, pt / ph.dur), k = 1 - Math.pow(1 - e, 2.2);
              const p = mid.clone().lerp(center, k);
              marble.position.set(p.x, ceilY, p.z);
              marble.rotation.x += dt * 6 * (1 - e); marble.rotation.z += dt * 4 * (1 - e);
            }
            if (pt >= ph.dur) {
              pt -= ph.dur; pi++;
              if (ph.type !== 'roll') AudioSys.sfx.pata(ph.type === 'fall' ? 1 : Math.max(.15, ph.h * 2.6), panOf(marble.position));
              if (phases[pi] && phases[pi].type === 'roll') AudioSys.sfx.roll(3.4, panOf(marble.position));
              if (pi >= phases.length) { marbleAnim = null; res(); }
            }
          };
        });
      }

      /* ---------- 劇本 ---------- */
      const winPos = new T.Vector3(HX + 0.1, wyc, wzc);
      const fanPos = new T.Vector3(0.18, 1.21, 0.55);
      const ceilPos = new T.Vector3(0.2, RH, -0.25);
      const centerPos = new T.Vector3(0, RH, 0);
      const picPos = portraitPos.clone();

      (async function script() {
        await G.wait(800);
        await openEyes();
        await G.sub('……', 1200);
        await G.sub('窗外，下著大雨。', 2200);
        await G.sub('床尾的電風扇，發出「咯噠、咯噠」的擺頭聲。', 3200);
        await G.sub('……身體，動不了。', 2200);
        AudioSys.heart.start(64);
        await G.sub('（鬼壓床……？）', 2000);
        control = true;
        keysHint('只能轉動頭部：← → ↑ ↓（或 WASD）');
        setTimeout(() => keysHint('（看看四周……窗戶、電風扇）'), 6000);

        let seenW = false, seenF = false;
        const pW = waitLook(winPos, 1100, 18, { hintAfter: 14, autoAfter: 60, focus: true }).then(async () => {
          seenW = true; bolt(1);
          await G.sub('雨好大……雨聲大到聽不見其他聲音。', 2800);
        });
        const pF = waitLook(fanPos, 1100, 15, { hintAfter: 16, autoAfter: 60 }).then(async () => {
          seenF = true;
          await G.sub('那台老電扇左右擺著頭。咯噠……咯噠……', 3000);
        });
        await Promise.all([pW, pF]);
        focusTarget = null;
        keysHint('');
        await G.wait(1500);

        // 異象初現：彈珠
        AudioSys.sfx.marbleBounce(0);
        await G.sub('……啪噠。', 1800);
        await G.sub('頭頂上……有什麼東西掉下來了？', 2400);
        keysHint('（看向天花板）');
        await waitLook(ceilPos, 500, 24, { hintAfter: 5, autoAfter: 25 });
        keysHint('');
        await G.wait(400);
        const mp = runMarble();
        await G.wait(500);
        G.sub('彈珠……？', 1800);
        await mp;
        await G.sub('它沒有掉下來。', 2000);
        await G.sub('而是在天花板上滾……朝著正中央滾了過去。', 3200);
        if (G.hasItem('marble')) {
          await G.sub('那是……我在一樓撿到的那顆彈珠？', 2800);
          G.removeItem('marble');
          await G.sub('口袋裡……空了。', 2200);
        }
        AudioSys.heart.set(78);

        // 重力是反的
        waterNormal.visible = false; waterInv.visible = true; gravityReversed = true;
        keysHint('（床頭的水杯……）');
        await waitLook(cupPos.clone().add(new T.Vector3(0, 0.08, 0)), 1300, 17, { hintAfter: 8, autoAfter: 40, focus: true });
        keysHint('');
        await G.sub('床頭的水杯……', 2000);
        await G.sub('水全都聚在杯口那一端，水面朝著地板。', 3000);
        AudioSys.sfx.sting(0.35);
        await G.sub('這個房間的重力……是反的。', 2800);
        focusTarget = null;
        AudioSys.heart.set(90);
        await G.wait(800);

        // 牆上的照片在笑
        AudioSys.sfx.creak(0.4, 1.6);
        keysHint('（牆上的照片……）');
        await waitLook(picPos, 1200, 13, { hintAfter: 8, autoAfter: 40, focus: true });
        keysHint('');
        await G.sub('牆上的照片……', 1800);
        const smileP = tween(5000, e => { portrait.smile = e; });
        await G.wait(1200);
        await G.sub('照片裡的人……', 1800);
        AudioSys.sfx.whisper(0.3);
        await G.sub('在笑。', 1600);
        await smileP;
        await G.sub('她在對我笑。', 2000);
        focusTarget = null;
        AudioSys.heart.set(105);

        // 天花板龜裂
        control = false;
        forced = { yaw: 0, pitch: DEF_PITCH, k: 1.1 };
        G.sub('頭……自己轉了回去。', 2400);
        await G.wait(2200);
        AudioSys.sfx.crack(1);
        await G.sub('喀……喀喀……', 1800);
        const crackTimer = setInterval(() => AudioSys.sfx.crack(0.6 + Math.random() * .6), 700);
        const fanUp = tween(9000, e => { fanSpeed = 1 + e * 1.6; AudioSys.fan.setSpeed && AudioSys.fan.setSpeed(fanSpeed); });
        AudioSys.rain.set(0.85, 6);
        AudioSys.drone.set(0.32, 6);
        tween(7000, e => { ceil.crack = e; ceil.dirty = true; });
        setTimeout(() => tween(8000, e => { ceil.stain = e; ceil.dirty = true; }), 1200);
        setTimeout(() => bolt(1), 2500);
        await G.sub('天花板的油漆……裂開了。', 2600);
        AudioSys.heart.set(125);
        await G.sub('裂縫的邊緣開始發黃、捲起來……', 2800);
        tween(8000, e => { ceil.ooze = e; ceil.dirty = true; });
        // 液體滴
        const R = rng(99);
        ceil.oozes.filter((_, i) => i % 3 === 0).slice(0, 12).forEach((o, i) => {
          const d = addDrip(ceilToWorld(o.x, o.y), 0.12 + R() * 0.5, t + 1 + i * 0.35, 0.006 + R() * 0.007); d.speed = 0.05 + R() * 0.07;
        });
        await G.sub('裂縫裡……滲出黏稠的、暗褐色的東西。', 3200);
        setTimeout(() => bolt(1), 600);
        await G.sub('（不要……不要滴下來……）', 2600);
        // 臉正上方那一滴
        const face = addDrip(new T.Vector3(0, RH, -0.42), 1.7, t, 0.02);
        face.speed = 0.25;
        AudioSys.heart.set(150);
        await G.wait(3800);
        clearInterval(crackTimer);
        await fanUp;

        // 驚嚇黑白：一切突然靜止
        AudioSys.rain.stop(0.05); AudioSys.fan.stop(0.05); AudioSys.drone.stop(0.05); AudioSys.heart.stop();
        fanStopped = true; rainK = 0;
        canvas.style.transition = 'none';
        canvas.style.filter = 'grayscale(1) contrast(1.45) brightness(.85)';
        gray = true;
        for (let i = 0; i < 6; i++) { lightsK = Math.random() < .5 ? .15 : .9; await G.wait(60 + Math.random() * 120); }
        lightsK = 0.55;
        G.hideSub();
        await G.wait(1900);
        AudioSys.sfx.drip(0.5, 0);
        await G.wait(1300);
        // 突然出現一張鬼臉
        const layer = await Ghost.scare(el, 1500);
        running = false;
        await G.wait(1400);
        cleanup();
        resolveAll();
      })();

      function cleanup() {
        running = false;
        clearInterval(blinkTimer);
        window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
        window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('resize', resize);
        AudioSys.rain.stop(0.1); AudioSys.fan.stop(0.1); AudioSys.drone.stop(0.1); AudioSys.heart.stop();
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } });
        renderer.dispose();
        try { renderer.forceContextLoss(); } catch (e) {}
      }
      Dream._debug = { get yaw() { return yaw; }, get pitch() { return pitch; }, setLook(y, p) { yaw = y; pitch = p; }, ceil, portrait, skip: () => lookers.forEach(l => { l.force = true; }) };
    });
  };
  window.Dream = Dream;
})();
