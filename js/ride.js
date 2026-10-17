/* 騎機車小關卡：橫向捲軸，按住油門前進 */
(function () {
  const Ride = {};
  const hash = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  const lerp = (a, b, t) => a + (b - a) * t;
  function mix(c1, c2, t) {
    const p = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const a = p(c1), b = p(c2);
    return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;
  }
  const SIGNS = ['檳榔', '小吃部', '機車行', '當舖', '牙科', '便當', '雜貨店', '中藥行', '卡拉OK', '麵店', '鎖匙', '佛具', '眼鏡行', '補習班', '米粉湯', '五金行', '理髮', '冰果室', '金紙', '旅社'];
  const SIGN_COL = [['#c0392b', '#fff'], ['#f1c40f', '#7a1d10'], ['#1f5fa8', '#fff'], ['#1e8449', '#fff'], ['#e67e22', '#fff'], ['#f4f1e8', '#b3261e'], ['#6c3483', '#fff']];
  const WALLS = ['#6e625c', '#7c6f62', '#5f5a5e', '#857668', '#6a5d55', '#776a5f', '#5c5650'];

  Ride.start = function (host, opts = {}) {
    const length = opts.length || 18;           // 全速需要幾秒
    const lines = (opts.lines || []).slice();
    const tod0 = opts.tod0 != null ? opts.tod0 : 0.05, tod1 = opts.tod1 != null ? opts.tod1 : 0.55;
    return new Promise(resolve => {
      const scr = G.el('div', 'screen canvas-screen');
      const cv = G.el('canvas', 'main'); scr.appendChild(cv);
      const ui = G.el('div', 'ride-ui', `<div class="ride-bar"><div class="fill"></div><div class="bike">🛵</div></div><div class="ride-labels"><span>${opts.from || '出發'}</span><span>${opts.to || '新家'}</span></div>`);
      const hint = G.el('div', 'ride-hint', '按住 → 鍵（或按住畫面）催油門');
      const skip = G.el('button', 'btn small ride-skip', '略過 ▶▶');
      scr.append(ui, hint, skip);
      host.appendChild(scr);
      document.body.classList.add('riding');
      const fill = ui.querySelector('.fill'), bike = ui.querySelector('.bike');
      const x = cv.getContext('2d');
      let W = 0, H = 0, s = 1, vw = 1600;
      function resize() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        W = cv.width = Math.round(scr.clientWidth * dpr); H = cv.height = Math.round(scr.clientHeight * dpr);
        s = H / 900; vw = W / s;
      }
      resize(); window.addEventListener('resize', resize);

      const MAXV = 820, total = length * MAXV;
      let dist = 0, speed = 0, throttle = false, arriving = false, done = false, t = 0, last = performance.now(), hinted = false;
      const puffs = [];
      AudioSys.engine.start(0.22, 0.6); AudioSys.city.start(0.12, 1.5);
      if (opts.rain) AudioSys.rain.start(0.25, 2);

      const kd = (e) => { if (['ArrowRight', 'ArrowUp', ' ', 'd', 'D', 'w', 'W'].includes(e.key)) { throttle = true; e.preventDefault(); } };
      const ku = (e) => { if (['ArrowRight', 'ArrowUp', ' ', 'd', 'D', 'w', 'W'].includes(e.key)) throttle = false; };
      const pd = (e) => { if (e.target === skip) return; throttle = true; };
      const pu = () => { throttle = false; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      scr.addEventListener('pointerdown', pd); window.addEventListener('pointerup', pu); window.addEventListener('pointercancel', pu);
      skip.addEventListener('click', (e) => { e.stopPropagation(); finish(); });

      function finish() {
        if (done) return; done = true;
        window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
        window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu);
        window.removeEventListener('resize', resize);
        document.body.classList.remove('riding');
        AudioSys.engine.stop(0.8); AudioSys.city.stop(1);
        resolve();
      }

      function frame(now) {
        if (done) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        if (!arriving) {
          if (throttle) { speed = Math.min(1, speed + dt * 0.7); if (!hinted) { hinted = true; hint.style.opacity = 0; setTimeout(() => hint.remove(), 600); } }
          else speed = Math.max(0, speed - dt * 0.45);
        } else speed = Math.max(0, speed - dt * 0.6);
        dist += speed * MAXV * dt;
        const p = Math.min(1, dist / total);
        if (p >= 1 && !arriving) { arriving = true; setTimeout(finish, 1800); }
        while (lines.length && p >= lines[0].at) { const ln = lines.shift(); G.sub(ln.text, ln.ms); }
        if (AudioSys.engine.setSpeed) AudioSys.engine.setSpeed(speed);
        fill.style.width = (p * 100) + '%'; bike.style.left = (p * 100) + '%';
        render(p, lerp(tod0, tod1, p));
        requestAnimationFrame(frame);
      }

      function render(p, tod) {
        x.setTransform(s, 0, 0, s, 0, 0);
        const horizon = 640;
        // 天空
        let g = x.createLinearGradient(0, 0, 0, horizon);
        g.addColorStop(0, mix('#2b2346', '#06080f', tod));
        g.addColorStop(.55, mix('#7a4a62', '#141a33', tod));
        g.addColorStop(1, mix('#f0915a', '#3a2c4a', tod));
        x.fillStyle = g; x.fillRect(0, 0, vw, 900);
        // 夕陽
        const sunY = 520 + tod * 220;
        x.fillStyle = `rgba(255,200,130,${Math.max(0, .9 - tod * 1.4)})`;
        x.beginPath(); x.arc(vw * 0.78, sunY, 48, 0, Math.PI * 2); x.fill();
        // 星星
        if (tod > .4) for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,255,${(tod - .4) * hash(i, 9) * 1.2})`; x.fillRect(hash(i, 1) * vw, hash(i, 2) * 380, 1.6, 1.6); }

        // 遠景天際線
        const farX = dist * 0.08;
        for (let i = Math.floor(farX / 90) - 1; i < (farX + vw) / 90 + 1; i++) {
          const bx = i * 90 - farX, bw = 70 + hash(i, 3) * 80, bh = 110 + hash(i, 4) * 230;
          x.fillStyle = mix('#3a2c48', '#0d0f1c', tod);
          x.fillRect(bx, horizon - bh, bw, bh + 90);
          for (let wy = horizon - bh + 12; wy < horizon + 40; wy += 18) for (let wx = bx + 8; wx < bx + bw - 8; wx += 14) {
            if (hash(wx * 3.1 + wy, i) < 0.08 + tod * 0.25) { x.fillStyle = 'rgba(255,214,140,.55)'; x.fillRect(wx, wy, 5, 7); }
          }
        }

        // 中景：街屋
        const midX = dist * 0.42, base = 760;
        for (let i = Math.floor(midX / 230) - 1; i < (midX + vw) / 230 + 1; i++) drawShop(i, i * 230 - midX, base, tod);

        // 電線桿與電線
        const poleX = dist * 0.9, pSp = 640;
        const poles = [];
        for (let i = Math.floor(poleX / pSp) - 1; i < (poleX + vw) / pSp + 2; i++) poles.push(i * pSp - poleX + 200);
        x.strokeStyle = 'rgba(10,10,14,.85)'; x.lineWidth = 2;
        for (let w = 0; w < 3; w++) {
          x.beginPath();
          poles.forEach((px, j) => {
            const y = 300 + w * 14;
            if (j === 0) x.moveTo(px, y); else x.quadraticCurveTo(px - pSp / 2, y + 40, px, y);
          });
          x.stroke();
        }
        poles.forEach(px => {
          x.fillStyle = '#16141a'; x.fillRect(px - 7, 280, 14, base - 280);
          x.fillRect(px - 40, 296, 80, 6);
          x.fillStyle = '#2a2a30'; x.fillRect(px - 16, 360, 32, 40); // 變壓器
        });

        // 人行道與馬路
        x.fillStyle = mix('#5d5552', '#2a2729', tod); x.fillRect(0, base, vw, 22);
        x.fillStyle = mix('#3a3a40', '#18181c', tod); x.fillRect(0, base + 22, vw, 900 - base);
        const roadX = dist % 140;
        x.fillStyle = 'rgba(240,240,220,.55)';
        for (let i = -1; i < vw / 140 + 2; i++) x.fillRect(i * 140 - roadX, 856, 70, 6);
        x.fillStyle = 'rgba(230,200,60,.35)'; x.fillRect(0, base + 24, vw, 3);

        // 路燈
        const lampX = dist, lSp = 520;
        for (let i = Math.floor(lampX / lSp) - 1; i < (lampX + vw) / lSp + 1; i++) {
          const lx = i * lSp - lampX + 80;
          x.fillStyle = '#1b1a1f'; x.fillRect(lx - 5, 430, 10, base - 430 + 10);
          x.fillRect(lx - 5, 430, 70, 7);
          const on = tod > 0.18 && !(hash(i, 7) < .15 && Math.sin(t * 23 + i) > .3);
          x.fillStyle = on ? '#ffe2a8' : '#555'; x.fillRect(lx + 50, 437, 26, 7);
          if (on) {
            const a = Math.min(1, (tod - .18) * 2.5);
            g = x.createRadialGradient(lx + 63, 444, 0, lx + 63, 444, 120);
            g.addColorStop(0, `rgba(255,220,150,${.55 * a})`); g.addColorStop(1, 'rgba(255,220,150,0)');
            x.fillStyle = g; x.fillRect(lx - 60, 324, 250, 250);
            g = x.createLinearGradient(0, 444, 0, 900);
            g.addColorStop(0, `rgba(255,214,140,${.12 * a})`); g.addColorStop(1, `rgba(255,214,140,${.05 * a})`);
            x.fillStyle = g;
            x.beginPath(); x.moveTo(lx + 52, 444); x.lineTo(lx + 74, 444); x.lineTo(lx + 180, 900); x.lineTo(lx - 50, 900); x.fill();
          }
        }

        // 主角的機車
        const sx = vw * 0.28, sy = 838;
        drawScooter(sx, sy, tod);
        // 排氣
        if (speed > 0.05 && Math.random() < speed * 0.6) puffs.push({ x: sx - 95, y: sy - 30, r: 6, a: .35 });
        puffs.forEach(pf => { pf.x -= (60 + speed * 500) * 0.016; pf.y -= 0.3; pf.r += 0.5; pf.a -= 0.008; });
        while (puffs.length && puffs[0].a <= 0) puffs.shift();
        puffs.forEach(pf => { x.fillStyle = `rgba(200,200,210,${pf.a})`; x.beginPath(); x.arc(pf.x, pf.y, pf.r, 0, Math.PI * 2); x.fill(); });
        // 雨
        if (opts.rain) {
          x.strokeStyle = 'rgba(200,210,240,.35)'; x.lineWidth = 1.4;
          x.beginPath();
          for (let i = 0; i < 160; i++) {
            const rx = (hash(i, 11) * vw + t * 300 + dist * 0.6) % vw, ry = (hash(i, 12) * 900 + t * 1400) % 900;
            x.moveTo(vw - rx, ry); x.lineTo(vw - rx - 6 - speed * 14, ry + 22);
          }
          x.stroke();
        }
        // 夜色
        x.fillStyle = `rgba(5,8,20,${tod * 0.35})`; x.fillRect(0, 0, vw, 900);
      }

      function drawShop(i, bx, base, tod) {
        const w = 220 + hash(i, 1) * 12, h = 250 + hash(i, 2) * 170;
        const temple = hash(i, 50) < 0.07;
        const dark = tod * 0.55;
        if (temple) {
          x.fillStyle = mix('#8e2a1e', '#3a1410', dark); x.fillRect(bx, base - 200, w, 200);
          x.fillStyle = mix('#b8892e', '#4a3a14', dark); x.fillRect(bx + 20, base - 150, w - 40, 30);
          x.fillStyle = mix('#a8321f', '#3a1410', dark);
          x.beginPath(); x.moveTo(bx - 30, base - 200); x.quadraticCurveTo(bx + w / 2, base - 230, bx + w + 30, base - 200);
          x.lineTo(bx + w + 46, base - 222); x.quadraticCurveTo(bx + w / 2, base - 268, bx - 46, base - 222); x.fill();
          x.fillStyle = mix('#3d8f6a', '#163a2a', dark);
          x.beginPath(); x.moveTo(bx + 10, base - 262); x.lineTo(bx + w - 10, base - 262); x.lineTo(bx + w / 2, base - 300); x.fill();
          x.fillStyle = '#f5d77a'; x.font = "bold 24px 'Noto Serif TC', serif"; x.textAlign = 'center';
          x.fillText('福德宮', bx + w / 2, base - 127);
          // 燈籠
          [bx + 40, bx + w - 40].forEach(lx => {
            x.fillStyle = tod > .2 ? '#ff4a2a' : '#c0392b';
            x.beginPath(); x.ellipse(lx, base - 100, 14, 18, 0, 0, Math.PI * 2); x.fill();
            if (tod > .2) { const gg = x.createRadialGradient(lx, base - 100, 0, lx, base - 100, 60); gg.addColorStop(0, 'rgba(255,80,40,.4)'); gg.addColorStop(1, 'rgba(255,80,40,0)'); x.fillStyle = gg; x.fillRect(lx - 60, base - 160, 120, 120); }
          });
          x.fillStyle = 'rgba(20,10,8,.9)'; x.fillRect(bx + w / 2 - 30, base - 90, 60, 90);
          return;
        }
        x.fillStyle = mix(WALLS[(hash(i, 3) * WALLS.length) | 0], '#1d1b1e', dark);
        x.fillRect(bx, base - h, w, h);
        x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(bx + w - 4, base - h, 4, h);
        // 樓層窗戶 + 鐵窗
        const floors = Math.floor((h - 120) / 92);
        for (let f = 0; f < floors; f++) {
          const wy = base - 130 - (f + 1) * 92 + 18;
          for (let k = 0; k < 2; k++) {
            const wx = bx + 24 + k * 100, ww = 74, wh = 56;
            const lit = hash(i * 7 + f * 3 + k, 5) < 0.12 + tod * 0.5;
            x.fillStyle = lit ? (hash(i + f + k, 6) < .3 ? '#cfe3ff' : '#ffd99a') : mix('#2b2a30', '#101015', tod);
            x.fillRect(wx, wy, ww, wh);
            x.strokeStyle = 'rgba(20,20,22,.9)'; x.lineWidth = 2;
            x.strokeRect(wx - 4, wy - 4, ww + 8, wh + 8);
            x.beginPath(); for (let b = 1; b < 7; b++) { x.moveTo(wx - 4 + b * (ww + 8) / 7, wy - 4); x.lineTo(wx - 4 + b * (ww + 8) / 7, wy + wh + 4); } x.stroke();
          }
          if (hash(i, f + 20) < .4) { x.fillStyle = mix('#bdbdb6', '#3a3a3a', tod); x.fillRect(bx + w - 54, base - 130 - f * 92 - 40, 40, 26); }
        }
        // 直式招牌
        if (hash(i, 8) < .75) {
          const [bgc, fg] = SIGN_COL[(hash(i, 9) * SIGN_COL.length) | 0];
          const txt = SIGNS[(hash(i, 10) * SIGNS.length) | 0];
          const chars = Array.from(txt), sh = chars.length * 30 + 20, sxp = bx + w - 30, syp = base - 130 - sh - 10;
          x.fillStyle = bgc; x.fillRect(sxp, syp, 34, sh);
          if (tod > .25) { x.shadowColor = bgc; x.shadowBlur = 25; x.fillRect(sxp, syp, 34, sh); x.shadowBlur = 0; }
          x.fillStyle = fg; x.font = "bold 24px 'Noto Serif TC', 'PingFang TC', sans-serif"; x.textAlign = 'center';
          chars.forEach((ch, ci) => x.fillText(ch, sxp + 17, syp + 34 + ci * 30));
        }
        // 騎樓
        x.fillStyle = mix('#2a2422', '#0b0a0a', tod); x.fillRect(bx, base - 120, w, 120);
        const open = hash(i, 12) < 0.6;
        if (open) {
          const gg = x.createLinearGradient(0, base - 110, 0, base);
          gg.addColorStop(0, 'rgba(255,220,160,.55)'); gg.addColorStop(1, 'rgba(255,200,120,.2)');
          x.fillStyle = gg; x.fillRect(bx + 14, base - 106, w - 28, 106);
          x.fillStyle = 'rgba(40,30,25,.8)'; x.fillRect(bx + 30, base - 50, 50, 50); x.fillRect(bx + w - 90, base - 70, 40, 70);
        } else {
          x.fillStyle = mix('#7d8790', '#2c3034', tod); x.fillRect(bx + 14, base - 106, w - 28, 106);
          x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1;
          x.beginPath(); for (let yy = base - 104; yy < base; yy += 7) { x.moveTo(bx + 14, yy); x.lineTo(bx + w - 14, yy); } x.stroke();
        }
        // 橫式招牌
        if (hash(i, 13) < .55) {
          const [bgc, fg] = SIGN_COL[(hash(i, 14) * SIGN_COL.length) | 0];
          x.fillStyle = bgc; x.fillRect(bx + 10, base - 150, w - 50, 30);
          x.fillStyle = fg; x.font = "bold 20px 'Noto Serif TC', 'PingFang TC', sans-serif"; x.textAlign = 'center';
          x.fillText(SIGNS[(hash(i, 15) * SIGNS.length) | 0], bx + 10 + (w - 50) / 2, base - 128);
        }
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(bx, base - 124, w, 4);
      }

      function drawScooter(cx, cy, tod) {
        const bob = Math.sin(t * 18) * speed * 1.6;
        const rot = dist / 26;
        // 車頭燈光束
        if (tod > .2) {
          const g = x.createLinearGradient(cx + 50, 0, cx + 420, 0);
          g.addColorStop(0, `rgba(255,240,190,${.35 * Math.min(1, (tod - .2) * 3)})`); g.addColorStop(1, 'rgba(255,240,190,0)');
          x.fillStyle = g;
          x.beginPath(); x.moveTo(cx + 46, cy - 98 + bob); x.lineTo(cx + 420, cy - 40); x.lineTo(cx + 420, cy + 30); x.lineTo(cx + 46, cy - 88 + bob); x.fill();
        }
        // 影子
        x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(cx, cy + 2, 100, 9, 0, 0, Math.PI * 2); x.fill();
        // 輪子
        [[cx - 52, cy - 24], [cx + 54, cy - 24]].forEach(([wx, wy]) => {
          x.fillStyle = '#111'; x.beginPath(); x.arc(wx, wy, 24, 0, Math.PI * 2); x.fill();
          x.fillStyle = '#777'; x.beginPath(); x.arc(wx, wy, 12, 0, Math.PI * 2); x.fill();
          x.strokeStyle = '#aaa'; x.lineWidth = 2; x.beginPath();
          for (let k = 0; k < 5; k++) { const a = rot + k * Math.PI * 2 / 5; x.moveTo(wx, wy); x.lineTo(wx + Math.cos(a) * 11, wy + Math.sin(a) * 11); } x.stroke();
        });
        x.save(); x.translate(0, bob);
        // 車身
        x.fillStyle = '#d8d2c4';
        x.beginPath();
        x.moveTo(cx - 92, cy - 44); x.quadraticCurveTo(cx - 92, cy - 76, cx - 60, cy - 78);
        x.lineTo(cx - 8, cy - 76); x.quadraticCurveTo(cx + 2, cy - 60, cx - 4, cy - 46);
        x.lineTo(cx + 22, cy - 46); x.lineTo(cx + 40, cy - 116); x.lineTo(cx + 56, cy - 112);
        x.quadraticCurveTo(cx + 66, cy - 70, cx + 74, cy - 44);
        x.quadraticCurveTo(cx + 50, cy - 50, cx + 34, cy - 30);
        x.lineTo(cx - 30, cy - 30); x.quadraticCurveTo(cx - 60, cy - 50, cx - 92, cy - 44);
        x.fill();
        x.fillStyle = '#b3261e'; x.fillRect(cx - 86, cy - 58, 70, 5);
        x.fillStyle = '#3a2a22'; x.beginPath(); x.ellipse(cx - 44, cy - 82, 40, 8, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#ffe9a8'; x.beginPath(); x.ellipse(cx + 54, cy - 102, 6, 9, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#ff4433'; x.fillRect(cx - 95, cy - 62, 6, 8);
        x.strokeStyle = '#222'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx + 44, cy - 118); x.lineTo(cx + 26, cy - 126); x.stroke();
        // 騎士
        x.strokeStyle = '#2b2f3a'; x.lineWidth = 13; x.lineCap = 'round';
        x.beginPath(); x.moveTo(cx - 40, cy - 88); x.lineTo(cx - 2, cy - 84); x.lineTo(cx + 6, cy - 52); x.stroke();
        x.fillStyle = '#4b5a3c';
        x.beginPath(); x.moveTo(cx - 52, cy - 90); x.lineTo(cx - 20, cy - 92); x.lineTo(cx - 14, cy - 150); x.lineTo(cx - 44, cy - 150); x.fill();
        x.strokeStyle = '#4b5a3c'; x.lineWidth = 10;
        x.beginPath(); x.moveTo(cx - 24, cy - 144); x.lineTo(cx + 6, cy - 120); x.lineTo(cx + 28, cy - 124); x.stroke();
        x.fillStyle = '#e0c3a0'; x.beginPath(); x.arc(cx - 26, cy - 160, 9, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#b8302a'; x.beginPath(); x.arc(cx - 30, cy - 170, 19, Math.PI * 0.9, Math.PI * 2.15); x.fill();
        x.fillStyle = '#1b1d24'; x.fillRect(cx - 18, cy - 172, 12, 9);
        x.restore();
      }

      requestAnimationFrame(frame);
    });
  };
  window.Ride = Ride;
})();
