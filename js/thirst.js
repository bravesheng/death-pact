/* 第一章隱藏結局：水杯放在地上 → 半夜渴醒、紫指甲的手、低頭吸水的黑影、浮著蛆的水 */
(function () {
  const IMG = 'assets/floorcup2.jpg';
  const CUP = { x: 0.465, y: 0.85 };      // 馬克杯在照片裡的位置
  const RIM = { x: 0.465, y: 0.815, rx: 0.042, ry: 0.016 };

  const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;

  function drawHand(x, o) {
    // 手在本地座標裡朝左（-x）伸出，原點是中指指尖
    const { ghost, s } = o;
    x.save(); x.translate(o.x, o.y); x.rotate(o.a); x.scale(s, s);
    const skin1 = ghost ? '#a7b1b6' : '#c99f86', skin2 = ghost ? '#4d565c' : '#6e4a3a';
    let g = x.createLinearGradient(0, -40, 0, 50);
    g.addColorStop(0, skin1); g.addColorStop(1, skin2);
    // 前臂
    x.fillStyle = g;
    x.beginPath(); x.moveTo(150, -34); x.quadraticCurveTo(400, -46, 900, -60); x.lineTo(900, 70); x.quadraticCurveTo(400, 52, 150, 40); x.fill();
    if (!ghost) { // 睡衣袖子
      const sg = x.createLinearGradient(0, -60, 0, 70); sg.addColorStop(0, '#3b4a63'); sg.addColorStop(1, '#141a26');
      x.fillStyle = sg;
      x.beginPath(); x.moveTo(300, -52); x.quadraticCurveTo(320, 0, 296, 62); x.lineTo(900, 90); x.lineTo(900, -80); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 3;
      for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(360 + i * 90, -50); x.quadraticCurveTo(380 + i * 90, 0, 350 + i * 90, 60); x.stroke(); }
    }
    if (ghost) { // 突出的筋與血管
      x.strokeStyle = 'rgba(30,40,60,.45)'; x.lineWidth = 2.2;
      [[-14, 6], [6, -4], [22, 10]].forEach(([oy, w]) => { x.beginPath(); x.moveTo(160, oy); x.bezierCurveTo(260, oy + w, 360, oy - w, 520, oy + w * .6); x.stroke(); });
    }
    // 手背
    x.fillStyle = g;
    x.beginPath(); x.moveTo(52, -38); x.quadraticCurveTo(110, -52, 170, -36); x.lineTo(170, 42); x.quadraticCurveTo(110, 54, 56, 36); x.closePath(); x.fill();
    // 四根手指（鬼的比較長、比較細）
    const L = ghost ? 1.35 : 1, W = ghost ? .78 : 1;
    const spread = ghost ? [-.2, -.06, .08, .24] : [-.12, -.04, .04, .12];
    [[-30, 0.9], [-10, 1], [10, .95], [28, .78]].forEach(([fy, len], i) => {
      const fl = 70 * len * L, fw = 9 * W;
      const curl = (o.curl || 0) * (i + 1) * 3;
      x.save(); x.translate(58, fy); x.rotate(spread[i] + (ghost ? Math.sin(i * 2.3) * .05 : 0));
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(0, -fw); x.quadraticCurveTo(-fl * .5, -fw + curl * .3, -fl, -fw * .7 + curl);
      x.quadraticCurveTo(-fl - fw * 1.2, curl, -fl, fw * .7 + curl);
      x.quadraticCurveTo(-fl * .5, fw + curl * .3, 0, fw); x.fill();
      // 指節
      x.strokeStyle = ghost ? 'rgba(20,26,34,.5)' : 'rgba(80,50,35,.4)'; x.lineWidth = 1.4;
      [.35, .68].forEach(k => { const kx = -fl * k; x.beginPath(); x.moveTo(kx, -fw * .6 + curl * k); x.lineTo(kx - 2, fw * .6 + curl * k); x.stroke(); });
      // 指甲
      const nx = -fl - (ghost ? 10 : 2), ny = curl;
      if (ghost) {
        const ng = x.createLinearGradient(nx, ny - 6, nx - 20, ny + 6);
        ng.addColorStop(0, '#7a3a8f'); ng.addColorStop(1, '#2a0c33');
        x.fillStyle = ng;
        x.beginPath(); x.moveTo(nx + 14, ny - fw * .65); x.quadraticCurveTo(nx - 6, ny - fw * .5, nx - 18, ny); x.quadraticCurveTo(nx - 6, ny + fw * .5, nx + 14, ny + fw * .65); x.fill();
        x.fillStyle = 'rgba(255,220,255,.25)'; x.fillRect(nx + 2, ny - 2, 8, 1.5);
      } else {
        x.fillStyle = 'rgba(240,210,195,.85)'; x.beginPath(); x.ellipse(nx + 8, ny, 7, fw * .55, 0, 0, Math.PI * 2); x.fill();
      }
      x.restore();
    });
    // 手背的陰影
    const sh = x.createLinearGradient(40, 0, 170, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)');
    x.fillStyle = sh; x.fillRect(40, -55, 140, 110);
    // 大拇指
    x.fillStyle = g;
    x.beginPath(); x.moveTo(120, 40); x.quadraticCurveTo(90, 74 * L, 46, 70 * L); x.quadraticCurveTo(38, 60 * L, 50, 52); x.quadraticCurveTo(80, 50, 100, 30); x.fill();
    // 月光打在邊緣
    x.strokeStyle = ghost ? 'rgba(170,200,255,.35)' : 'rgba(160,180,230,.2)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(52, -38); x.quadraticCurveTo(110, -52, 170, -36); x.quadraticCurveTo(400, -46, 900, -60); x.stroke();
    x.restore();
  }

  function drawFigure(x, p, sc, turn, bob, alpha) {
    // 跪在地上、彎腰低頭吸水的黑色人影；turn = 1 時猛然抬頭、轉過來對你笑
    x.save(); x.globalAlpha = alpha; x.translate(p.x, p.y + bob); x.scale(sc * p.flip, sc);
    x.lineCap = 'round'; x.lineJoin = 'round';
    const ink = '#040406', rim = 'rgba(130,160,220,.32)';
    const limb = (pts, w, col) => { x.strokeStyle = col || ink; x.lineWidth = w; x.beginPath(); x.moveTo(pts[0], pts[1]); if (pts.length === 6) x.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); else x.lineTo(pts[2], pts[3]); x.stroke(); };
    const hip = [-48, -52], sho = [22, -86];
    const head = [lerp(62, 26, turn), lerp(-30, -138, turn)];
    // 小腿、大腿
    limb([-70, -6, 8, -6], 20); limb([4, -8, hip[0], hip[1]], 30);
    // 彎成弓形的背
    limb([hip[0], hip[1], -20, -112, sho[0], sho[1]], 46);
    // 垂到地上的雙手
    limb([sho[0], sho[1], 52, -46, 66, -4], 13); limb([sho[0] - 8, sho[1] + 4, 36, -40, 44, -4], 12);
    // 脖子與頭
    limb([sho[0] + 6, sho[1], head[0], head[1]], 16);
    x.fillStyle = ink; x.beginPath(); x.ellipse(head[0], head[1], 19, 23, lerp(1.1, 0, turn), 0, Math.PI * 2); x.fill();
    // 長頭髮垂下來
    x.strokeStyle = ink; x.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const hx = head[0] - 14 + i * 3.5, len = lerp(34, 70, turn) + (i % 3) * 6;
      x.beginPath(); x.moveTo(hx, head[1] - 6); x.quadraticCurveTo(hx + lerp(10, 2, turn), head[1] + len * .5, hx + lerp(6, -2, turn) + Math.sin(i) * 3, head[1] + len); x.stroke();
    }
    // 月光勾出背的輪廓
    x.strokeStyle = rim; x.lineWidth = 3;
    x.beginPath(); x.moveTo(hip[0] - 18, hip[1] - 12); x.quadraticCurveTo(-24, -136, sho[0] + 4, sho[1] - 22); x.stroke();
    if (turn > 0.5) {
      const k = (turn - .5) * 2, fx = head[0] * p.flip;
      x.save(); x.scale(p.flip, 1);
      const fg = x.createRadialGradient(fx, head[1] - 4, 2, fx, head[1], 26);
      fg.addColorStop(0, `rgba(228,230,232,${k})`); fg.addColorStop(1, `rgba(110,116,122,${k})`);
      x.fillStyle = fg; x.beginPath(); x.ellipse(fx, head[1] + 3, 15, 20, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = `rgba(0,0,0,${k})`;
      x.beginPath(); x.ellipse(fx - 6, head[1] - 3, 4.2, 6, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(fx + 6, head[1] - 3, 4.2, 6, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = `rgba(255,255,255,${k})`; x.fillRect(fx - 6.5, head[1] - 4, 1.6, 1.6); x.fillRect(fx + 5.5, head[1] - 4, 1.6, 1.6);
      x.beginPath(); x.moveTo(fx - 14, head[1] + 7); x.quadraticCurveTo(fx, head[1] + 24, fx + 14, head[1] + 7); x.quadraticCurveTo(fx, head[1] + 14, fx - 14, head[1] + 7); x.fill();
      x.strokeStyle = `rgba(0,0,0,${k * .8})`; x.lineWidth = .8;
      for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(fx + i * 3.6, head[1] + 10); x.lineTo(fx + i * 3.6, head[1] + 16 - Math.abs(i) * .8); x.stroke(); }
      // 頭髮蓋住臉的兩側
      x.fillStyle = `rgba(4,4,6,${k})`;
      x.beginPath(); x.moveTo(fx - 19, head[1] - 14); x.quadraticCurveTo(fx - 22, head[1] + 30, fx - 14, head[1] + 52); x.lineTo(fx - 11, head[1] + 4); x.quadraticCurveTo(fx - 12, head[1] - 14, fx - 19, head[1] - 14); x.fill();
      x.beginPath(); x.moveTo(fx + 19, head[1] - 14); x.quadraticCurveTo(fx + 22, head[1] + 30, fx + 14, head[1] + 52); x.lineTo(fx + 11, head[1] + 4); x.quadraticCurveTo(fx + 12, head[1] - 14, fx + 19, head[1] - 14); x.fill();
      x.restore();
    }
    x.restore();
  }

  function drawMaggot(x, m, t, s) {
    x.save(); x.translate(m.x, m.y); x.rotate(m.a + Math.sin(t * m.sp + m.ph) * .5); x.scale(s, s);
    for (let i = 0; i < 8; i++) {
      const sx = i * 5 - 18, sy = Math.sin(t * m.sp * 2 + i * .8 + m.ph) * 2.4, r = 4.2 - Math.abs(i - 3.5) * .45;
      x.fillStyle = i === 0 ? '#bfae8c' : '#ede4cb';
      x.beginPath(); x.ellipse(sx, sy, r * 1.15, r, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(120,100,70,.5)'; x.lineWidth = .6; x.beginPath(); x.arc(sx, sy, r, -1.2, 1.2); x.stroke();
    }
    x.restore();
  }

  G.scenes.thirst = {
    mount(st) {
      G.hud(false); G.ambient(false);
      const scr = G.el('div', 'screen thirst');
      const cv = G.el('canvas', 'th-cv');
      const lid = G.el('div', 'th-lid');
      const btn = G.el('button', 'walk-btn hidden', '伸手拿水杯');
      const words = G.el('div', 'whisper-text');
      scr.append(cv, lid, words, btn);
      st.appendChild(scr);
      const img = new Image(); img.src = IMG;
      const S = this.S = {
        run: true, cv, x: cv.getContext('2d'), img, btn, lid, words, scr,
        cam: { fx: .5, fy: .62, z: 1.06, r: 0 }, dark: .82, moon: .25,
        hand: -1, ghost: -1, curl: 0, figs: 0, turn: 0, figAlpha: 0, maggots: 0, shake: 0, flash: 0, t: 0,
      };
      const figs = S.figPos = [
        { u: .1, v: .8, s: .9, flip: 1 }, { u: .3, v: .9, s: 1.1, flip: 1 }, { u: .56, v: .78, s: .78, flip: -1 },
        { u: .74, v: .9, s: 1.15, flip: -1 }, { u: .9, v: .76, s: .82, flip: -1 },
      ];
      figs.forEach((f, i) => { f.ph = i * 1.3; });
      // 蛆平均散在水面上（不要擠成一團）
      S.mag = [];
      for (let tries = 0; S.mag.length < 16 && tries < 500; tries++) {
        const u = Math.random() * 2 - 1, v = Math.random() * 2 - 1;
        if (u * u + v * v > .78) continue;
        if (S.mag.some(m => (m.u - u) ** 2 + ((m.v - v) * .6) ** 2 < .09)) continue;
        S.mag.push({ u, v, a: Math.random() * 6.28, sp: 2 + Math.random() * 3, ph: Math.random() * 6 });
      }
      const resize = () => { const d = Math.min(2, devicePixelRatio || 1); cv.width = scr.clientWidth * d; cv.height = scr.clientHeight * d; };
      resize(); window.addEventListener('resize', resize); S.resize = resize;
      let last = performance.now();
      const frame = (n) => {
        if (!S.run) return;
        const dt = Math.min(.05, (n - last) / 1000); last = n; S.t += dt;
        render(S);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    },
    async after() {
      const S = this.S;
      await new Promise(r => { if (S.img.complete) r(); else { S.img.onload = r; S.img.onerror = r; } });
      await G.fadeIn(10);
      const tween = (ms, fn) => new Promise(res => { const t0 = performance.now(); const st = (n) => { const e = Math.min(1, (n - t0) / ms); fn(ease(e), e); if (e < 1 && S.run) requestAnimationFrame(st); else res(); }; requestAnimationFrame(st); });
      const sub = (t, ms) => G.sub(t, ms);
      AudioSys.fan.start(0.14, 2);
      AudioSys.drone.start(0.12, 3, { base: 46 });
      // 睜開眼
      S.lid.style.opacity = 1; await G.wait(600);
      S.lid.style.transition = 'opacity 2.4s ease'; S.lid.style.opacity = 0;
      await sub('……', 1300);
      await sub('好渴。', 1500);
      await sub('喉嚨乾得像砂紙一樣。', 2200);
      await sub('（水杯……我放在地上了。）', 2400);
      // 伸手（之後系統強制探頭）
      S.btn.classList.remove('hidden');
      await new Promise(res => {
        const go = (e) => { if (e) e.preventDefault(); S.btn.removeEventListener('click', go); window.removeEventListener('keydown', kd); res(); };
        const kd = (e) => { if ([' ', 'Enter', 'ArrowDown', 's', 'S'].includes(e.key)) go(e); };
        S.btn.addEventListener('click', go); window.addEventListener('keydown', kd);
      });
      S.btn.classList.add('hidden');
      G.sfx.creak(0.3, 0.9);
      G.sub('（身體……自己往床下探了出去——）', 2600);
      AudioSys.heart.start(88);
      const c0 = { ...S.cam };
      const lean = tween(2700, (e) => {
        S.cam.z = lerp(c0.z, 2.9, e); S.cam.fx = lerp(c0.fx, CUP.x, e); S.cam.fy = lerp(c0.fy, CUP.y - .02, e); S.cam.r = lerp(0, -.08, e);
      });
      await G.wait(500);
      S.hand = 0;
      await tween(2300, (e) => { S.hand = e * .86; });
      await lean;
      // 指尖快要碰到的瞬間——紫色指甲的手搶先碰到杯子
      S.ghost = 0;
      AudioSys.sfx.impact(.5);
      await tween(170, (e, raw) => { S.ghost = raw; });
      S.curl = 1; AudioSys.heart.set(140);
      await G.wait(500);
      const say3 = async (t, ms, loud) => {
        S.words.textContent = t; S.words.classList.add('show');
        if (loud) { AudioSys.sfx.scream(); S.shake = 1; S.flash = .8; } else AudioSys.sfx.whisper(.45);
        await G.wait(ms); S.words.classList.remove('show'); await G.wait(180);
      };
      await say3('這……這杯……', 1300);
      await say3('不是……', 1100);
      await say3('留給我喝的嗎？', 1500, true);
      S.dark = 1; await G.wait(500);
      S.hand = -1; S.ghost = -1; S.curl = 0; S.cam.z = 2.2; S.cam.r = -.03;
      AudioSys.heart.set(120);
      await G.wait(400); S.dark = .82;
      await sub('——！', 900);
      await sub('……那隻手，不見了。', 2000);
      await sub('（是……錯覺？）', 1800);
      await sub('喉嚨乾得快要裂開……我抓起杯子，喝了一口。', 3000);
      AudioSys.sfx.gulp(.8); await G.wait(900);
      await sub('……', 900);
      AudioSys.sfx.cough(.7);
      await sub('喉嚨裡……全是鐵鏽和燒香灰的味道。', 3000);
      // 借著月光，看見好多黑影低頭吸水
      const c1 = { ...S.cam };
      await tween(2000, (e) => { S.cam.z = lerp(c1.z, 1.12, e); S.cam.fx = lerp(c1.fx, .52, e); S.cam.fy = lerp(c1.fy, .66, e); S.cam.r = lerp(c1.r, 0, e); S.moon = lerp(.25, .75, e); S.dark = lerp(.82, .7, e); });
      AudioSys.slurp.start(.5, 2.5);
      tween(2600, (e) => { S.figAlpha = e; });
      await sub('借著月光，我看見——', 2200);
      await sub('房間裡，蹲著好多黑色的人影。', 2600);
      await sub('它們低著頭……在吸地上的水。', 2800);
      AudioSys.slurp.set(.8, 1);
      await G.wait(1500);
      AudioSys.slurp.stop(0.05); AudioSys.heart.stop(); AudioSys.fan.stop(0.05);
      G.hideSub();
      await G.wait(1400);
      // 驚嚇點：一起轉過頭來對你笑
      S.turn = 1; S.shake = 1.4; S.flash = 1;
      AudioSys.sfx.scream();
      tween(220, (e) => { S.cam.z = lerp(1.12, 1.38, e); });
      await G.wait(1500);
      for (let i = 0; i < 6; i++) { S.figAlpha = i % 2 ? 1 : 0; await G.wait(80 + i * 15); }
      S.figAlpha = 0; S.turn = 0;
      await G.wait(900);
      await sub('……', 1000);
      await sub('不見了。', 1600);
      await sub('手裡的杯子……', 1800);
      const c2 = { ...S.cam };
      await tween(1400, (e) => { S.cam.z = lerp(c2.z, 7, e); S.cam.fx = lerp(c2.fx, RIM.x, e); S.cam.fy = lerp(c2.fy, RIM.y, e); S.moon = lerp(.75, .9, e); });
      tween(2500, (e) => { S.maggots = e; });
      await sub('水面上，浮著一隻一隻白白的東西。', 2600);
      AudioSys.sfx.sting(.6);
      await sub('……在動。', 1600);
      await sub('是蛆。', 1600);
      await G.wait(700);
      S.dark = 1; AudioSys.sfx.impact(1);
      AudioSys.drone.stop(0.05);
      await G.wait(1600);
      G.go('wake444', { noFade: true });
    },
    unmount() {
      const S = this.S; S.run = false;
      window.removeEventListener('resize', S.resize);
      AudioSys.slurp.stop(0.1); AudioSys.heart.stop(); AudioSys.fan.stop(0.2); AudioSys.drone.stop(0.3);
    }
  };

  function render(S) {
    const { x, cv, img, cam } = S, W = cv.width, H = cv.height;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    if (!img.naturalWidth) return;
    const IW = img.naturalWidth, IH = img.naturalHeight;
    const s0 = Math.max(W / IW, H / IH) * 1.06, sc = s0 * cam.z;
    // 不讓畫面露出照片外的黑邊
    const hw = W / 2 / sc, hh = H / 2 / sc;
    const fx = Math.min(IW - hw, Math.max(hw, cam.fx * IW)), fy = Math.min(IH - hh, Math.max(hh, cam.fy * IH));
    const sh = S.shake > 0 ? S.shake * 26 * (W / 1000) : 0;
    S.shake = Math.max(0, S.shake - .03);
    const bob = Math.sin(S.t * 1.3) * 3;
    x.save();
    x.translate(W / 2 + (Math.random() - .5) * sh, H / 2 + (Math.random() - .5) * sh + bob);
    x.rotate(cam.r); x.scale(sc, sc); x.translate(-fx, -fy);
    x.drawImage(img, 0, 0);
    const P = (u, v) => ({ x: u * IW, y: v * IH });
    // 夜色：壓暗、偏藍
    x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(70,84,125)'; x.fillRect(0, 0, IW, IH);
    x.globalCompositeOperation = 'source-over';
    // 蛆（畫在杯口的水面上）
    if (S.maggots > 0) {
      const c = P(RIM.x, RIM.y), rx = RIM.rx * IW, ry = RIM.ry * IH;
      x.save(); x.beginPath(); x.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2); x.clip();
      const wg = x.createRadialGradient(c.x - rx * .3, c.y - ry * .3, 1, c.x, c.y, rx);
      wg.addColorStop(0, 'rgba(70,58,44,.92)'); wg.addColorStop(1, 'rgba(25,18,12,.95)');
      x.fillStyle = wg; x.fillRect(c.x - rx, c.y - ry, rx * 2, ry * 2);
      const n = Math.round(S.mag.length * S.maggots);
      S.mag.slice(0, n).forEach(m => drawMaggot(x, { ...m, x: c.x + m.u * rx * .85, y: c.y + m.v * ry * .8 }, S.t, rx / 150));
      x.restore();
    }
    x.restore();
    const cupS = { x: W / 2 + (CUP.x * IW - fx) * sc, y: H / 2 + (CUP.y * IH - 30 - fy) * sc };
    const hs = Math.min(W, H) / 700;
    if (S.hand >= 0) {
      const tr = Math.sin(S.t * 30) * 1.5 * hs;
      const sx = W * .55, sy = H * 1.3;
      const ang = Math.atan2(cupS.y - sy, cupS.x - sx);
      const reach = Math.hypot(cupS.x - sx, cupS.y - sy);
      const d = reach * (0.35 + S.hand * .65) - 26 * hs;
      drawHand(x, { x: sx + Math.cos(ang) * d + tr, y: sy + Math.sin(ang) * d, a: ang + Math.PI, s: hs * 1.2, ghost: false, curl: .45 });
    }
    // 暗度與月光（畫面座標）
    x.fillStyle = `rgba(0,0,0,${S.dark * .62})`; x.fillRect(0, 0, W, H);
    const mg = x.createRadialGradient(W * .15, -H * .1, 10, W * .15, -H * .1, Math.max(W, H) * 1.1);
    mg.addColorStop(0, `rgba(150,175,235,${.22 * S.moon})`); mg.addColorStop(1, 'rgba(150,175,235,0)');
    x.globalCompositeOperation = 'screen'; x.fillStyle = mg; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
    // 黑影
    if (S.figAlpha > 0) {
      const toS = (u, v) => ({ x: W / 2 + (u * IW - fx) * sc, y: H / 2 + (v * IH - fy) * sc });
      [...S.figPos].sort((a, b) => a.v - b.v).forEach(f => {
        const p = toS(f.u, f.v); p.flip = f.flip;
        drawFigure(x, p, f.s * H * .0022, S.turn, Math.sin(S.t * 2.4 + f.ph) * 3 * (1 - S.turn), S.figAlpha);
      });
    }
    // 杯口反射的一點月光，讓人看得到水杯在哪
    if (S.maggots <= 0 && cam.z > 1.5) {
      const rx = RIM.rx * IW * sc, ry = RIM.ry * IH * sc, rcx = W / 2 + (RIM.x * IW - fx) * sc, rcy = H / 2 + (RIM.y * IH - fy) * sc;
      x.strokeStyle = 'rgba(190,210,255,.35)'; x.lineWidth = Math.max(1.5, rx * .05);
      x.beginPath(); x.ellipse(rcx, rcy, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
      x.fillStyle = 'rgba(200,220,255,.18)'; x.beginPath(); x.ellipse(rcx - rx * .2, rcy, rx * .35, ry * .3, 0, 0, Math.PI * 2); x.fill();
    }
    // 鬼的手：蒼白，帶一點冷光
    if (S.ghost >= 0) {
      x.save(); x.shadowColor = 'rgba(140,170,255,.55)'; x.shadowBlur = 24 * hs;
      const sx = W * 1.25, sy = cupS.y - H * .05;
      const ang = Math.atan2(cupS.y - sy, cupS.x + 40 * hs - sx);
      const reach = Math.hypot(cupS.x + 40 * hs - sx, cupS.y - sy);
      const d = reach * (0.2 + S.ghost * .8);
      drawHand(x, { x: sx + Math.cos(ang) * d, y: sy + Math.sin(ang) * d, a: ang + Math.PI, s: hs * 1.35, ghost: true, curl: S.curl });
      x.restore();
    }
    // 暗角
    const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.85)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    if (S.flash > 0) { x.fillStyle = `rgba(255,255,255,${S.flash * .7})`; x.fillRect(0, 0, W, H); S.flash = Math.max(0, S.flash - .08); }
    if (S.dark >= 1) { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); }
  }

  // 4:44 被嚇醒（影片）
  G.scenes.wake444 = {
    mount(st) {
      G.hud(false);
      const scr = G.el('div', 'screen video-scene', `
        <video class="vid dawn" src="assets/wake444.mp4" muted playsinline preload="auto"></video>
        <div class="led-clock"><span>4</span><i>:</i><span>44</span></div>`);
      st.appendChild(scr);
      this.v = scr.querySelector('video'); this.clock = scr.querySelector('.led-clock');
      this.v.load();
    },
    async after() {
      const v = this.v;
      AudioSys.heart.start(150);
      try { await v.play(); } catch (e) {}
      setTimeout(() => { AudioSys.sfx.gasp(.8); AudioSys.sfx.impact(.4); }, 1850);
      await new Promise(res => { v.addEventListener('ended', res, { once: true }); setTimeout(res, 9000); });
      AudioSys.heart.set(96);
      this.clock.classList.add('show'); G.sfx.tick();
      await G.say(['——哈啊、哈啊……', '……是夢？', '床頭的電子鐘，紅色的數字一閃一閃。', ['', '4:44。', () => AudioSys.sfx.sting(.4)],
        '喉嚨裡……好像還留著鐵鏽的味道。', '我看了一眼地上的水杯。', '……', '（下班之後，去買個床頭櫃吧。）', '（水杯……再也不要放在地上了。）']);
      AudioSys.heart.stop();
      await G.award('ending2', { title: '觸發 第一章隱藏結局……', always: true, ms: 4200 });
      G.clearSave();
      await G.fadeOut(1400);
      G.go('title', { noFade: true, fadeInMs: 1500 });
    },
    unmount() { if (this.v) this.v.pause(); AudioSys.heart.stop(); }
  };
})();
