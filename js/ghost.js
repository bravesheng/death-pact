/* 鬼臉：用 canvas 程序化繪製（黑白），以及跳臉驚嚇動畫 */
(function () {
  let cache = null;
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  function draw(W) {
    const c = document.createElement('canvas'); c.width = c.height = W;
    const x = c.getContext('2d');
    const R = rng(1337), k = W / 1024;
    x.fillStyle = '#000'; x.fillRect(0, 0, W, W);

    // 背後微光
    let g = x.createRadialGradient(512 * k, 470 * k, 0, 512 * k, 470 * k, 560 * k);
    g.addColorStop(0, 'rgba(90,90,90,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, W);

    // 後方頭髮
    x.save(); x.translate(512 * k, 480 * k);
    x.fillStyle = '#050505';
    x.beginPath();
    x.moveTo(-330 * k, -200 * k);
    x.bezierCurveTo(-320 * k, -520 * k, 320 * k, -520 * k, 330 * k, -200 * k);
    x.bezierCurveTo(380 * k, 100 * k, 420 * k, 400 * k, 470 * k, 600 * k);
    x.lineTo(-470 * k, 600 * k);
    x.bezierCurveTo(-420 * k, 400 * k, -380 * k, 100 * k, -330 * k, -200 * k);
    x.fill();

    // 臉
    x.rotate(-0.07);
    const face = new Path2D();
    face.moveTo(0, -330 * k);
    face.bezierCurveTo(205 * k, -330 * k, 262 * k, -120 * k, 232 * k, 40 * k);
    face.bezierCurveTo(212 * k, 215 * k, 118 * k, 380 * k, 0, 420 * k);
    face.bezierCurveTo(-125 * k, 380 * k, -218 * k, 205 * k, -238 * k, 30 * k);
    face.bezierCurveTo(-258 * k, -130 * k, -195 * k, -330 * k, 0, -330 * k);
    g = x.createRadialGradient(-40 * k, -70 * k, 20 * k, 0, 0, 440 * k);
    g.addColorStop(0, '#eef0f1'); g.addColorStop(.45, '#bfc4c7'); g.addColorStop(.78, '#6a6f73'); g.addColorStop(1, '#151618');
    x.fillStyle = g; x.fill(face);

    x.save(); x.clip(face);
    // 皮膚雜點
    for (let i = 0; i < 9000; i++) {
      const px = (R() - .5) * 520 * k, py = (R() - .5) * 780 * k;
      x.fillStyle = R() < .5 ? `rgba(0,0,0,${R() * .09})` : `rgba(255,255,255,${R() * .07})`;
      x.fillRect(px, py, 2 * k, 2 * k);
    }
    // 血管
    x.lineCap = 'round';
    for (let i = 0; i < 34; i++) {
      x.strokeStyle = `rgba(25,30,38,${.12 + R() * .2})`; x.lineWidth = (1 + R() * 2.2) * k;
      let px = (R() - .5) * 420 * k, py = (R() - .5) * 600 * k;
      x.beginPath(); x.moveTo(px, py);
      for (let j = 0; j < 5; j++) { px += (R() - .5) * 90 * k; py += (R() - .3) * 70 * k; x.lineTo(px, py); }
      x.stroke();
    }
    // 龜裂（跟天花板一樣）
    for (let b = 0; b < 7; b++) {
      let px = (R() - .5) * 60 * k, py = -250 * k + R() * 60 * k, a = Math.PI / 2 + (R() - .5) * 2.2;
      x.strokeStyle = 'rgba(10,10,10,.75)'; x.lineWidth = 2.6 * k;
      x.beginPath(); x.moveTo(px, py);
      for (let j = 0; j < 9; j++) { a += (R() - .5) * .9; px += Math.cos(a) * 30 * k; py += Math.sin(a) * 30 * k; x.lineTo(px, py); x.lineWidth *= .9; }
      x.stroke();
    }
    // 眼窩陰影
    [[-98, -45, 1.05], [104, -32, 1]].forEach(([ex, ey, s]) => {
      const gg = x.createRadialGradient(ex * k, ey * k, 10 * k, ex * k, ey * k, 150 * k * s);
      gg.addColorStop(0, 'rgba(0,0,0,1)'); gg.addColorStop(.45, 'rgba(0,0,0,.92)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gg; x.beginPath(); x.ellipse(ex * k, ey * k, 150 * k * s, 160 * k * s, 0, 0, Math.PI * 2); x.fill();
    });
    // 黑色眼淚
    [[-98, 40], [104, 52]].forEach(([ex, ey], i) => {
      for (let j = 0; j < 3; j++) {
        const ox = (j - 1) * 22 * k + (R() - .5) * 10 * k, len = (130 + R() * 160) * k;
        const gg = x.createLinearGradient(0, ey * k, 0, ey * k + len);
        gg.addColorStop(0, 'rgba(0,0,0,.95)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
        x.strokeStyle = gg; x.lineWidth = (9 - j * 2) * k;
        x.beginPath(); x.moveTo(ex * k + ox, ey * k);
        x.bezierCurveTo(ex * k + ox + 8 * k, ey * k + len * .4, ex * k + ox - 6 * k, ey * k + len * .7, ex * k + ox + 4 * k, ey * k + len);
        x.stroke();
      }
    });
    // 鼻孔
    x.fillStyle = 'rgba(0,0,0,.85)';
    x.beginPath(); x.ellipse(-20 * k, 92 * k, 7 * k, 16 * k, .3, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(20 * k, 94 * k, 7 * k, 16 * k, -.3, 0, Math.PI * 2); x.fill();
    // 嘴：撕裂般張大
    const my = 255 * k;
    const mouth = new Path2D();
    mouth.moveTo(-70 * k, my - 120 * k);
    mouth.bezierCurveTo(-20 * k, my - 150 * k, 30 * k, my - 145 * k, 78 * k, my - 112 * k);
    mouth.bezierCurveTo(118 * k, my - 20 * k, 92 * k, my + 130 * k, 6 * k, my + 160 * k);
    mouth.bezierCurveTo(-85 * k, my + 128 * k, -112 * k, my - 30 * k, -70 * k, my - 120 * k);
    x.save(); x.shadowColor = 'rgba(0,0,0,1)'; x.shadowBlur = 40 * k;
    x.fillStyle = '#000'; x.fill(mouth); x.restore();
    x.strokeStyle = 'rgba(40,40,40,.9)'; x.lineWidth = 6 * k; x.stroke(mouth);
    // 牙齒
    x.save(); x.clip(mouth);
    for (let i = 0; i < 9; i++) {
      const tx = -68 * k + i * 17 * k, th = (18 + R() * 26) * k;
      x.fillStyle = `rgba(${200 + R() * 40 | 0},${200 + R() * 40 | 0},${190 + R() * 40 | 0},.85)`;
      x.beginPath(); x.moveTo(tx, my - 150 * k); x.lineTo(tx + 14 * k, my - 150 * k); x.lineTo(tx + 9 * k, my - 140 * k + th); x.lineTo(tx + 3 * k, my - 142 * k + th); x.fill();
    }
    for (let i = 0; i < 7; i++) {
      const tx = -52 * k + i * 16 * k, th = (14 + R() * 20) * k;
      x.fillStyle = 'rgba(190,190,180,.6)';
      x.beginPath(); x.moveTo(tx, my + 160 * k); x.lineTo(tx + 13 * k, my + 160 * k); x.lineTo(tx + 8 * k, my + 150 * k - th); x.lineTo(tx + 3 * k, my + 152 * k - th); x.fill();
    }
    x.restore();
    // 嘴角拉扯的皺紋
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2 * k;
    for (let i = 0; i < 6; i++) {
      const s = i < 3 ? -1 : 1;
      x.beginPath(); x.moveTo(s * 95 * k, my - 60 * k + (i % 3) * 30 * k);
      x.quadraticCurveTo(s * 150 * k, my - 90 * k + (i % 3) * 40 * k, s * 190 * k, my - 140 * k + (i % 3) * 50 * k); x.stroke();
    }
    x.restore(); // unclip face

    // 瞳孔：針尖般的白點
    [[-90, -36], [108, -24]].forEach(([ex, ey]) => {
      x.save(); x.shadowColor = '#fff'; x.shadowBlur = 26 * k;
      x.fillStyle = '#fff'; x.beginPath(); x.arc(ex * k, ey * k, 7 * k, 0, Math.PI * 2); x.fill();
      x.restore();
      x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(ex * k, ey * k, 12 * k, 0, Math.PI * 2); x.fill();
    });
    x.restore(); // translate

    // 前方髮絲
    x.lineCap = 'round';
    for (let i = 0; i < 520; i++) {
      const side = R() < .5 ? -1 : 1;
      const sx = 512 * k + side * (60 + R() * 260) * k, sy = (60 + R() * 140) * k;
      const ex = 512 * k + side * (150 + R() * 420) * k, ey = (720 + R() * 380) * k;
      const across = R() < .12;
      x.strokeStyle = `rgba(0,0,0,${.35 + R() * .6})`; x.lineWidth = (0.8 + R() * 3.2) * k;
      x.beginPath(); x.moveTo(sx, sy);
      const cx1 = across ? 512 * k + (R() - .5) * 300 * k : sx + side * (R() * 120) * k;
      x.bezierCurveTo(cx1, sy + 260 * k, ex - side * 80 * k, ey - 300 * k, ex, ey);
      x.stroke();
    }
    // 暗角
    g = x.createRadialGradient(512 * k, 512 * k, 280 * k, 512 * k, 512 * k, 740 * k);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.95)');
    x.fillStyle = g; x.fillRect(0, 0, W, W);
    // 底片顆粒
    for (let i = 0; i < 26000; i++) {
      x.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * .08})`;
      x.fillRect(R() * W, R() * W, 1.5 * k, 1.5 * k);
    }
    return c;
  }

  const Ghost = {};
  Ghost.prepare = function () { if (!cache) cache = draw(1024); return cache; };

  // 跳臉驚嚇：回傳 Promise，結束時畫面是全黑
  Ghost.scare = function (host, ms = 1500) {
    const src = Ghost.prepare();
    const layer = G.el('div', 'ghost-layer');
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const x = cv.getContext('2d');
    layer.appendChild(cv); host.appendChild(layer);
    layer.style.display = 'block';
    AudioSys.sfx.scream();
    return new Promise(resolve => {
      const t0 = performance.now();
      function frame(t) {
        const e = (t - t0) / ms;
        if (e >= 1) { layer.style.background = '#000'; x.clearRect(0, 0, 1024, 1024); cv.remove(); resolve(layer); return; }
        const zoom = e < .08 ? 0.55 + (e / .08) * 0.75 : 1.3 + e * 0.25;
        const shake = (1 - e * .5) * 46;
        x.fillStyle = '#000'; x.fillRect(0, 0, 1024, 1024);
        x.save();
        x.translate(512 + (Math.random() - .5) * shake, 512 + (Math.random() - .5) * shake);
        x.rotate((Math.random() - .5) * 0.06);
        x.scale(zoom, zoom);
        x.drawImage(src, -512, -512);
        // 殘影
        x.globalAlpha = .35; x.drawImage(src, -512 + (Math.random() - .5) * 40, -512 + (Math.random() - .5) * 40);
        x.restore();
        x.globalAlpha = 1;
        // 掃描線撕裂
        for (let i = 0; i < 6; i++) {
          if (Math.random() < .5) continue;
          const y = Math.random() * 1024, h = 8 + Math.random() * 50, dx = (Math.random() - .5) * 120;
          x.drawImage(cv, 0, y, 1024, h, dx, y, 1024, h);
        }
        const flashOn = (e > .2 && e < .24) || (e > .55 && e < .58);
        cv.style.filter = flashOn ? 'invert(1) contrast(1.5)' : 'contrast(1.25)';
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  };
  window.Ghost = Ghost;
})();
