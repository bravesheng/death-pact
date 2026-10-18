/* 新家門口：canvas 繪製的透天厝外觀、找鑰匙、拉開鐵捲門 */
(function () {
  const VW = 1600, VH = 900;
  const SH = { x: 512, y: 572, w: 576, h: 288 }; // 鐵捲門
  let bgCache = null;

  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  function tiles(x, x0, y0, w, h, color, tw, th, line) {
    x.fillStyle = color; x.fillRect(x0, y0, w, h);
    x.strokeStyle = line; x.lineWidth = 1; x.beginPath();
    for (let yy = y0; yy <= y0 + h; yy += th) { x.moveTo(x0, yy); x.lineTo(x0 + w, yy); }
    for (let xx = x0; xx <= x0 + w; xx += tw) { x.moveTo(xx, y0); x.lineTo(xx, y0 + h); }
    x.stroke();
  }
  function grilleWindow(x, wx, wy, ww, wh, glass) {
    x.fillStyle = glass; x.fillRect(wx, wy, ww, wh);
    const g = x.createLinearGradient(wx, wy, wx + ww, wy + wh);
    g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.05)');
    x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
    x.strokeStyle = '#2b2a2c'; x.lineWidth = 6; x.strokeRect(wx - 10, wy - 10, ww + 20, wh + 20);
    x.lineWidth = 3; x.beginPath();
    for (let b = 1; b < ww / 26; b++) { x.moveTo(wx - 10 + b * 26, wy - 10); x.lineTo(wx - 10 + b * 26, wy + wh + 10); }
    x.moveTo(wx - 10, wy + wh / 2); x.lineTo(wx + ww + 10, wy + wh / 2);
    x.stroke();
    // 鐵窗上的花紋
    x.lineWidth = 2; x.beginPath();
    for (let b = 0; b < ww / 52; b++) { const cx = wx + 16 + b * 52; x.moveTo(cx + 10, wy + wh / 2 - 14); x.arc(cx, wy + wh / 2 - 14, 10, 0, Math.PI * 2); }
    x.stroke();
  }

  function drawStatic() {
    const c = document.createElement('canvas'); c.width = VW; c.height = VH;
    const x = c.getContext('2d'), R = rng(44);
    let g = x.createLinearGradient(0, 0, 0, 560);
    g.addColorStop(0, '#120e22'); g.addColorStop(.45, '#36243f'); g.addColorStop(.8, '#844650'); g.addColorStop(1, '#c46744');
    x.fillStyle = g; x.fillRect(0, 0, VW, VH);
    // 雲
    for (let i = 0; i < 9; i++) {
      x.fillStyle = `rgba(30,18,40,${.25 + R() * .3})`;
      x.beginPath(); x.ellipse(R() * VW, 60 + R() * 260, 180 + R() * 220, 10 + R() * 14, 0, 0, Math.PI * 2); x.fill();
    }
    // 左鄰
    x.fillStyle = '#4b4446'; x.fillRect(0, 150, 425, 720);
    grilleWindow(x, 60, 200, 260, 110, '#22252c'); grilleWindow(x, 60, 360, 260, 110, '#2a2a30');
    x.fillStyle = '#211d1c'; x.fillRect(0, 520, 425, 340);
    x.fillStyle = '#5b6168'; x.fillRect(20, 570, 380, 290);
    x.strokeStyle = 'rgba(0,0,0,.3)'; x.beginPath(); for (let yy = 572; yy < 860; yy += 11) { x.moveTo(20, yy); x.lineTo(400, yy); } x.stroke();
    // 右鄰
    x.fillStyle = '#433d40'; x.fillRect(1175, 70, 425, 800);
    grilleWindow(x, 1240, 130, 280, 120, '#1e2026'); grilleWindow(x, 1240, 320, 280, 120, '#3b3326');
    x.fillStyle = '#1d1918'; x.fillRect(1175, 520, 425, 340);
    x.fillStyle = '#5a6066'; x.fillRect(1260, 570, 320, 290);
    x.strokeStyle = 'rgba(0,0,0,.3)'; x.beginPath(); for (let yy = 572; yy < 860; yy += 11) { x.moveTo(1260, yy); x.lineTo(1580, yy); } x.stroke();
    // 主屋立面
    tiles(x, 420, 100, 760, 420, '#b3a690', 24, 12, 'rgba(80,70,55,.18)');
    x.fillStyle = '#8f846f'; x.fillRect(410, 92, 780, 24);
    // 水漬
    for (let i = 0; i < 14; i++) {
      const sx = 430 + R() * 740, sy = 116 + R() * 60, len = 80 + R() * 260;
      g = x.createLinearGradient(0, sy, 0, sy + len); g.addColorStop(0, 'rgba(40,35,30,.35)'); g.addColorStop(1, 'rgba(40,35,30,0)');
      x.fillStyle = g; x.fillRect(sx, sy, 6 + R() * 16, len);
    }
    // 三樓窗
    grilleWindow(x, 500, 150, 230, 120, '#1c1f26'); grilleWindow(x, 870, 150, 230, 120, '#1c1f26');
    x.fillStyle = '#c9c8c0'; x.fillRect(1110, 200, 56, 44); x.fillStyle = '#9a9890'; x.fillRect(1114, 206, 48, 4);
    // 二樓大窗（鬼影會出現的地方）
    x.fillStyle = '#26232a'; x.fillRect(530, 322, 540, 176);
    // 一樓騎樓
    x.fillStyle = '#2a2523'; x.fillRect(420, 520, 760, 50);
    x.fillStyle = '#3a3432'; x.fillRect(500, 570, 600, 290);
    tiles(x, 420, 520, 82, 340, '#a0957f', 20, 10, 'rgba(60,50,40,.2)');
    tiles(x, 1098, 520, 82, 340, '#a0957f', 20, 10, 'rgba(60,50,40,.2)');
    // 卷門外箱
    x.fillStyle = '#4a5056'; x.fillRect(SH.x - 8, SH.y - 18, SH.w + 16, 24);
    // 地面
    tiles(x, 0, 860, VW, 40, '#5a514c', 60, 40, 'rgba(0,0,0,.25)');
    // 門牌
    x.fillStyle = '#1f4f9a'; x.fillRect(1112, 548, 56, 48); x.strokeStyle = '#e8e8e8'; x.lineWidth = 2; x.strokeRect(1115, 551, 50, 42);
    x.fillStyle = '#fff'; x.font = "bold 26px 'Noto Serif TC', serif"; x.textAlign = 'center'; x.fillText('44', 1140, 582);
    // 春聯
    [[438, '出入平安'], [1118, '四季平安']].forEach(([cx, txt]) => {
      x.fillStyle = 'rgba(150,50,40,.65)'; x.fillRect(cx, 700, 44, 150);
      x.fillStyle = 'rgba(30,20,15,.55)'; x.font = "bold 28px 'Noto Serif TC', serif";
      Array.from(txt).forEach((ch, i) => x.fillText(ch, cx + 22, 734 + i * 34));
      x.fillStyle = 'rgba(200,190,170,.25)'; x.fillRect(cx + 30, 800, 14, 50);
    });
    // 信箱
    x.fillStyle = '#9e2219'; x.fillRect(1108, 608, 64, 80);
    x.fillStyle = '#5e130e'; x.fillRect(1118, 622, 44, 6);
    x.fillStyle = '#f0d8c0'; x.font = "bold 22px 'Noto Serif TC', serif"; x.fillText('信', 1140, 668);
    x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(1108, 608, 64, 6);
    // 電錶箱
    x.fillStyle = '#8b8f8d'; x.fillRect(432, 566, 62, 88);
    x.fillStyle = '#c8d4d2'; x.fillRect(442, 580, 42, 34);
    x.strokeStyle = '#333'; x.lineWidth = 1.5; x.beginPath(); x.arc(463, 597, 11, 0, Math.PI * 2); x.stroke();
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(432, 646, 62, 8);
    x.fillStyle = '#6c6f6d'; x.fillRect(428, 560, 70, 7);
    // 盆栽
    x.fillStyle = '#7d4329'; x.beginPath(); x.moveTo(1196, 800); x.lineTo(1276, 800); x.lineTo(1264, 862); x.lineTo(1208, 862); x.fill();
    x.fillStyle = '#5e3020'; x.fillRect(1192, 796, 88, 10);
    x.strokeStyle = '#4b3a2a'; x.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      x.lineWidth = 2 + R() * 3; let px = 1236 + (R() - .5) * 30, py = 798, a = -Math.PI / 2 + (R() - .5) * 1.2;
      x.beginPath(); x.moveTo(px, py);
      for (let j = 0; j < 4; j++) { a += (R() - .5) * .7; px += Math.cos(a) * 22; py += Math.sin(a) * 22; x.lineTo(px, py); }
      x.stroke();
    }
    x.strokeStyle = '#a3302a'; x.lineWidth = 2; x.beginPath(); x.moveTo(1226, 760); x.lineTo(1250, 764); x.lineTo(1244, 790); x.stroke();
    // 停好的機車
    x.save(); x.translate(300, 862); x.scale(-1, 1);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(0, 0, 100, 9, 0, 0, Math.PI * 2); x.fill();
    [[-52, -24], [54, -24]].forEach(([wx, wy]) => { x.fillStyle = '#111'; x.beginPath(); x.arc(wx, wy, 24, 0, Math.PI * 2); x.fill(); x.fillStyle = '#666'; x.beginPath(); x.arc(wx, wy, 11, 0, Math.PI * 2); x.fill(); });
    x.fillStyle = '#cfc8ba';
    x.beginPath(); x.moveTo(-92, -44); x.quadraticCurveTo(-92, -76, -60, -78); x.lineTo(-8, -76); x.quadraticCurveTo(2, -60, -4, -46);
    x.lineTo(22, -46); x.lineTo(40, -116); x.lineTo(56, -112); x.quadraticCurveTo(66, -70, 74, -44); x.quadraticCurveTo(50, -50, 34, -30);
    x.lineTo(-30, -30); x.quadraticCurveTo(-60, -50, -92, -44); x.fill();
    x.fillStyle = '#b3261e'; x.fillRect(-86, -58, 70, 5);
    x.fillStyle = '#3a2a22'; x.beginPath(); x.ellipse(-44, -82, 40, 8, 0, 0, Math.PI * 2); x.fill();
    x.restore();
    // 路燈桿
    x.fillStyle = '#18171b'; x.fillRect(1440, 150, 12, 750); x.fillRect(1360, 150, 92, 8);
    // 電線
    x.strokeStyle = 'rgba(8,8,12,.8)'; x.lineWidth = 2;
    for (let w = 0; w < 3; w++) { x.beginPath(); x.moveTo(0, 40 + w * 16); x.quadraticCurveTo(800, 120 + w * 16, VW, 30 + w * 16); x.stroke(); }
    return c;
  }

  const rust = (() => { const R = rng(7); return Array.from({ length: 22 }, () => ({ x: R() * SH.w, y: R() * SH.h, w: 3 + R() * 10, h: 20 + R() * 90, a: .15 + R() * .3 })); })();

  function drawDynamic(x, t, P, ghostA, flicker) {
    x.drawImage(bgCache, 0, 0);
    // 二樓窗內 + 鬼影
    const g2 = x.createLinearGradient(530, 322, 1070, 498);
    g2.addColorStop(0, 'rgba(60,70,90,.25)'); g2.addColorStop(1, 'rgba(0,0,0,.2)');
    x.fillStyle = g2; x.fillRect(530, 322, 540, 176);
    if (ghostA > 0) {
      x.fillStyle = `rgba(4,4,6,${ghostA})`;
      x.beginPath(); x.ellipse(800, 380, 24, 30, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.moveTo(760, 498); x.quadraticCurveTo(762, 420, 800, 410); x.quadraticCurveTo(838, 420, 840, 498); x.fill();
      x.fillStyle = `rgba(4,4,6,${ghostA * .8})`; x.fillRect(782, 390, 36, 80);
      x.fillStyle = `rgba(230,230,230,${ghostA * .9})`; x.fillRect(790, 376, 4, 3); x.fillRect(806, 376, 4, 3);
    }
    grilleWindowOverlay(x);
    // 鐵捲門
    const top = SH.y + 6, openH = SH.h * P, bottom = top + SH.h - openH;
    if (P > 0) {
      // 捲門底下露出來的黑暗與雜物輪廓
      const gi = x.createLinearGradient(0, bottom, 0, top + SH.h);
      gi.addColorStop(0, '#000'); gi.addColorStop(1, '#100c0a');
      x.fillStyle = gi; x.fillRect(SH.x, bottom, SH.w, openH);
      x.fillStyle = 'rgba(70,58,50,.35)';
      x.fillRect(SH.x + 50, top + SH.h - 90, 130, 90); x.fillRect(SH.x + 210, top + SH.h - 50, 90, 50);
      x.fillRect(SH.x + 390, top + SH.h - 140, 70, 140); x.fillRect(SH.x + 470, top + SH.h - 70, 80, 70);
    }
    x.save(); x.beginPath(); x.rect(SH.x, top, SH.w, SH.h - openH); x.clip();
    const s0 = top - openH;
    x.fillStyle = '#7b858e'; x.fillRect(SH.x, top, SH.w, SH.h);
    for (let yy = s0; yy < bottom; yy += 12) {
      x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(SH.x, yy, SH.w, 2);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(SH.x, yy + 9, SH.w, 2);
    }
    rust.forEach(r => {
      const gy = s0 + r.y; const g = x.createLinearGradient(0, gy, 0, gy + r.h);
      g.addColorStop(0, `rgba(110,60,30,${r.a})`); g.addColorStop(1, 'rgba(110,60,30,0)');
      x.fillStyle = g; x.fillRect(SH.x + r.x, gy, r.w, r.h);
    });
    // 被撕掉一半的「售」
    const py = s0 + 70;
    x.fillStyle = 'rgba(190,40,30,.85)'; x.beginPath(); x.moveTo(890, py); x.lineTo(960, py + 4); x.lineTo(950, py + 50); x.lineTo(930, py + 80); x.lineTo(892, py + 76); x.fill();
    x.fillStyle = 'rgba(255,240,220,.85)'; x.font = "bold 44px 'Noto Serif TC', serif"; x.textAlign = 'center'; x.fillText('售', 922, py + 56);
    x.fillStyle = 'rgba(220,210,190,.35)'; x.fillRect(958, py + 2, 30, 20);
    // 底桿與鎖
    const by = bottom - 16;
    x.fillStyle = '#4e555b'; x.fillRect(SH.x, by, SH.w, 16);
    x.fillStyle = '#c9b77a'; x.beginPath(); x.arc(800, by + 8, 7, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#222'; x.fillRect(799, by + 5, 2, 6);
    x.restore();
    // 路燈閃爍
    if (flicker > 0.05) {
      const lg = x.createRadialGradient(1380, 162, 0, 1380, 162, 260);
      lg.addColorStop(0, `rgba(255,226,160,${.75 * flicker})`); lg.addColorStop(1, 'rgba(255,226,160,0)');
      x.fillStyle = lg; x.fillRect(1100, 0, 500, 450);
      x.fillStyle = `rgba(255,214,140,${.08 * flicker})`;
      x.beginPath(); x.moveTo(1360, 166); x.lineTo(1400, 166); x.lineTo(1560, 900); x.lineTo(1160, 900); x.fill();
    }
    x.fillStyle = flicker > .05 ? '#ffe7b0' : '#555'; x.fillRect(1362, 158, 36, 9);
    // 黃昏色調
    x.fillStyle = 'rgba(30,10,40,.18)'; x.fillRect(0, 0, VW, VH);
  }
  function grilleWindowOverlay(x) {
    const wx = 540, wy = 332, ww = 520, wh = 156;
    x.strokeStyle = '#1e1d20'; x.lineWidth = 7; x.strokeRect(wx - 10, wy - 10, ww + 20, wh + 20);
    x.lineWidth = 3; x.beginPath();
    for (let b = 1; b < ww / 26; b++) { x.moveTo(wx - 10 + b * 26, wy - 10); x.lineTo(wx - 10 + b * 26, wy + wh + 10); }
    x.moveTo(wx - 10, wy + wh * 0.62); x.lineTo(wx + ww + 10, wy + wh * 0.62);
    x.stroke();
    x.fillStyle = '#25242a'; x.fillRect(wx - 16, wy + wh + 10, ww + 32, 10);
  }

  const HS = [
    { id: 'meter', label: '電錶箱', r: [428, 552, 70, 106] },
    { id: 'mailbox', label: '信箱', r: [1104, 604, 72, 90] },
    { id: 'plate', label: '門牌', r: [1108, 544, 64, 56] },
    { id: 'plant', label: '盆栽', r: [1186, 700, 100, 166] },
    { id: 'shutter', label: '鐵捲門', r: [512, 572, 576, 288] },
    { id: 'win', label: '二樓窗戶', r: [530, 322, 540, 176] },
    { id: 'scooter', label: '我的機車', r: [190, 760, 230, 106] },
    { id: 'couplet', label: '春聯', r: [434, 696, 52, 158] },
    { id: 'lamp', label: '路燈', r: [1330, 130, 130, 60] },
  ];

  G.scenes.exterior = {
    mount(st) {
      if (!bgCache) bgCache = drawStatic();
      const scr = G.el('div', 'screen canvas-screen');
      const wrap = G.el('div', 'fit169');
      const cv = document.createElement('canvas'); cv.width = VW; cv.height = VH;
      wrap.appendChild(cv); scr.appendChild(wrap); st.appendChild(scr);
      const x = cv.getContext('2d');
      const S = this.s = { P: 0, ghost: 0, run: true };
      let flick = 1;
      const loop = (t) => {
        if (!S.run) return;
        if (Math.random() < 0.04) flick = Math.random() < 0.5 ? 0 : 0.3 + Math.random() * 0.7;
        else flick += (1 - flick) * 0.08;
        drawDynamic(x, t, S.P, S.ghost, flick);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      HS.forEach(h => {
        const d = G.el('div', 'ext-hs', `<span class="lbl">${h.label}</span>`);
        const [hx, hy, hw, hh] = h.r;
        Object.assign(d.style, { left: hx / VW * 100 + '%', top: hy / VH * 100 + '%', width: hw / VW * 100 + '%', height: hh / VH * 100 + '%' });
        d.addEventListener('click', (e) => {
          e.stopPropagation(); if (G.locked() || S.opening) return;
          G.ripple(e.clientX, e.clientY);
          if (G.touch) { d.classList.add('reveal'); setTimeout(() => d.classList.remove('reveal'), 900); }
          this.click(h.id);
        });
        wrap.appendChild(d);
      });
      G.setLoc('新家門口'); G.hud(true);
      AudioSys.city.start(0.06, 2);
    },
    async after(first) {
      if (!first) return;
      await G.say([
        '到了。',
        '就是這間……三層樓的透天厝。比照片上看起來舊了一點。',
        '鐵捲門拉得緊緊的。仲介說，鑰匙會放在門口。',
      ]);
      G.objective('找到鑰匙，打開鐵捲門');
      if (G.touch) {
        G.revealHotspots();
        await G.say([['操作', '點畫面上的東西可以調查。\n右上角「？提示」會標出可以調查的地方。']]);
      }
    },
    unmount() { this.s.run = false; AudioSys.city.stop(1); },
    async click(id) {
      const F = G.state.flags, S = this.s;
      switch (id) {
        case 'mailbox':
          if (!F.noteRead) {
            F.noteRead = true;
            await G.say(['信箱塞滿了泛黃的廣告單。', '最底下壓著一張便條紙——', '「鑰匙放在電錶箱上面。　—— 仲介 小陳」']);
            G.objective('到電錶箱上面找鑰匙');
          } else await G.say(['信箱裡只剩下過期的廣告單。']);
          break;
        case 'meter':
          if (!F.noteRead) await G.say(['灰色的電錶箱。', '玻璃窗裡的轉盤……還在慢慢地轉。', '（明明好幾個月沒人住了。）']);
          else if (!G.hasItem('key')) {
            await G.say(['伸手往電錶箱上面摸……', '灰塵、灰塵……', '指尖碰到一個冰涼的東西。']);
            G.addItem('key');
            G.objective('用鑰匙打開鐵捲門');
            await G.wait(900);
            S.ghost = 1; G.sfx.sting(0.35);
            await G.wait(260);
            S.ghost = 0;
            await G.wait(500);
            await G.say(['……', '（剛剛……二樓的窗戶，是不是站著一個人？）', '……一定是看錯了。']);
            F.sawGhost = true;
          } else await G.say(['電錶的轉盤，還在轉。']);
          break;
        case 'plate':
          await G.say(['門牌：中正路 44 號。', '……44。', '（難怪這麼便宜。）']);
          break;
        case 'plant':
          await G.say(['門口的盆栽早就枯死了，土乾裂成一塊一塊的。', '枯枝上綁著一條褪色的紅線。']);
          break;
        case 'couplet':
          await G.say(['褪色的春聯：「出入平安」。', '……希望是。']);
          break;
        case 'scooter':
          await G.say(['我的老機車，陪我騎了七年。']);
          break;
        case 'lamp':
          G.sfx.buzz(1.2);
          await G.say(['路燈一閃一閃，發出「滋——滋——」的聲音。']);
          break;
        case 'win':
          await G.say(F.sawGhost ? ['二樓的窗戶……現在什麼都沒有。', '只有鐵窗的影子。'] : ['二樓的窗戶裝著鐵窗，裡面黑漆漆的。']);
          break;
        case 'shutter':
          if (!G.hasItem('key')) { await G.say(['鐵捲門鎖著，拉不起來。', '門上原本貼著的「售」字紅紙，被撕掉了一半。']); break; }
          S.opening = true;
          await G.say(['把鑰匙插進鎖孔，轉——', ['', '喀。', () => G.sfx.unlock()]]);
          G.removeItem('key');
          G.objective('');
          G.sfx.shutter(3);
          await new Promise(res => {
            const t0 = performance.now();
            const step = (t) => { const e = Math.min(1, (t - t0) / 3000); S.P = e * e * (3 - 2 * e) * 0.98; if (e < 1) requestAnimationFrame(step); else res(); };
            requestAnimationFrame(step);
          });
          await G.say(['鐵捲門後面，一片漆黑。', '一股潮濕的霉味撲面而來。']);
          G.save('f1');
          G.go('shelf', { fadeMs: 900 });
          break;
      }
    }
  };
})();
