/* 劇本與場景資料 */
(function () {
  const S = G.scenes, F = () => G.state.flags;
  const say = (l) => G.say(l);

  // 黑底字幕，可點擊略過
  async function cine(lines) {
    const sub = G.$('#sub');
    for (const [text, ms] of lines) {
      sub.textContent = text; sub.classList.add('show');
      await new Promise(res => {
        const done = () => { clearTimeout(tm); window.removeEventListener('pointerdown', done); window.removeEventListener('keydown', done); res(); };
        const tm = setTimeout(done, ms || 1500 + Array.from(text).length * 130);
        setTimeout(() => { window.addEventListener('pointerdown', done); window.addEventListener('keydown', done); }, 400);
      });
      sub.classList.remove('show');
      await G.wait(550);
    }
  }
  G.cine = cine;
  const black = (st) => { G.hud(false); st.appendChild(G.el('div', 'screen black-screen')); };

  /* ================= 標題 ================= */
  S.title = {
    mount(st) {
      G.hud(false);
      const save = G.loadSave();
      const scr = G.el('div', 'screen title-screen', `
        <div class="bg" style="background-image:url(assets/living.jpg)"></div>
        <canvas class="rain"></canvas>
        <div class="inner">
          <div class="title-main">死契</div>
          <div class="title-sub">第一章・惡夢開端</div>
          <div class="menu">
            <button class="btn start">開始遊戲</button>
            ${save ? '<button class="btn cont">繼續遊戲</button>' : ''}
          </div>
          <div class="warn">※ 本遊戲含有驚嚇畫面與音效，建議戴上耳機遊玩<br>滑鼠點擊調查・方向鍵移動・H 顯示可調查處・M 靜音</div>
        </div>`);
      st.appendChild(scr);
      scr.querySelector('.start').addEventListener('click', () => {
        AudioSys.init(); G.sfx.click();
        G.state = G.newState(); G.renderInv(); G.objective('', false); G.clearSave();
        G.go('prologue', { fadeMs: 1200 });
      });
      const cont = scr.querySelector('.cont');
      if (cont) cont.addEventListener('click', () => {
        AudioSys.init(); G.sfx.click();
        G.state = Object.assign(G.newState(), save.state); G.renderInv();
        G.go({ living: 'living', bedroom: 'bed1' }[save.cp] || 'living', { fadeMs: 1000 });
      });
      // 標題畫面的雨
      const cv = scr.querySelector('canvas'), x = cv.getContext('2d');
      const drops = Array.from({ length: 200 }, () => ({ x: Math.random(), y: Math.random(), v: .8 + Math.random() * .8 }));
      let run = true, last = performance.now();
      const loop = (n) => {
        if (!run) return;
        const dt = Math.min(.05, (n - last) / 1000); last = n;
        cv.width = cv.clientWidth; cv.height = cv.clientHeight;
        x.strokeStyle = 'rgba(180,195,220,.28)'; x.lineWidth = 1; x.beginPath();
        drops.forEach(d => { d.y += d.v * dt; d.x -= d.v * dt * .1; if (d.y > 1) { d.y = 0; d.x = Math.random() * 1.1; } x.moveTo(d.x * cv.width, d.y * cv.height); x.lineTo(d.x * cv.width - 3, d.y * cv.height + 22); });
        x.stroke();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      this.stop = () => { run = false; };
    },
    unmount() { this.stop && this.stop(); }
  };

  /* ================= 序章 ================= */
  S.prologue = {
    mount: black,
    async after() {
      AudioSys.drone.start(0.1, 3, { base: 55 });
      await cine([
        ['房仲說，這間房子的價格，只有附近行情的一半。', 3600],
        ['屋主急著脫手，其他的，什麼都沒多說。', 3200],
        ['……便宜就好。我簽了約。', 3000],
        ['今天，是我第一次去看我的新家。', 3000],
      ]);
      AudioSys.drone.stop(2);
      G.go('ride1', { fadeMs: 800 });
    }
  };

  S.ride1 = {
    mount(st) {
      G.hud(false);
      this.p = Ride.start(st, {
        length: 16, from: '租屋處', to: '新家', tod0: .05, tod1: .5,
        lines: [
          { at: .04, text: '騎了快半個小時。' },
          { at: .24, text: '房仲說，前屋主是「急著出國」才賣的。' },
          { at: .46, text: '……可是他講這句話的時候，一直沒有看著我的眼睛。' },
          { at: .7, text: '算了。便宜就好。' },
          { at: .9, text: '應該……就是前面那間了。' },
        ]
      });
    },
    async after() { await this.p; G.go('exterior', { fadeMs: 900 }); }
  };

  /* ================= 一樓（照片場景） ================= */
  const F1 = { ambient: true, grade: G.GRADE.dusk, tint: G.TINT.dusk };

  S.living = G.photo(Object.assign({}, F1, {
    id: 'living', img: 'living', ar: 1400 / 873, title: '一樓・客廳',
    async onEnter(first) {
      if (!first) return;
      await say(['一樓堆滿了前屋主留下的東西……', '沙發、茶几、擺設，全都還在原來的位置。', '簡直像是……人突然消失了一樣。', '（先找找上二樓的樓梯吧。）']);
      G.objective('找到上二樓的樓梯');
    },
    hotspots: [
      { id: 'painting', label: '老畫', r: [11, 38, 14, 12], lines: ['一幅褪色的風景畫。', '畫框底下有一圈深色的水漬……', '像是從畫裡面滲出來的。'] },
      { id: 'hatch', label: '天花板', r: [24, 25, 12, 8], lines: ['天花板上的維修孔，蓋子沒有闔緊。', '縫隙裡黑漆漆的……', '好像有風從裡面吹出來。'] },
      { id: 'wreath', label: '小花圈', r: [37, 40, 6, 7], lines: ['牆上掛著一個小小的花圈。', '（是過年過節的裝飾吧……我這樣告訴自己。）'] },
      { id: 'sofa', label: '沙發', r: [26, 57, 24, 18], lines: ['皮沙發上，還留著一個人形的凹痕。', '伸手摸了一下……', '是溫的？'], sfx: () => G.sfx.creak(0.25, 0.8) },
      { id: 'table', label: '茶几', r: [35, 77, 27, 23], lines: ['茶几上的桌巾一塵不染。', '（不是說這裡已經空了大半年嗎？）'] },
      { id: 'lamp', label: '檯燈', r: [10, 57, 11, 14], lines: ['檯燈的開關是開著的，燈泡卻沒有亮。'] },
      { id: 'fan', label: '電風扇', r: [91, 63, 9, 18], lines: ['一台電風扇。', '扇葉上纏著幾根……長長的頭髮。'] },
      { id: 'window', label: '窗戶', r: [65, 43, 27, 17], lines: ['窗外的天色暗得好快。', '對面那戶人家，好像拉開窗簾在看這裡。'] },
      { id: 'books', label: '書櫃', r: [0, 38, 8, 36], lines: ['書櫃裡塞滿了舊書和相簿。', '每一本相簿的封面……都被撕掉了。'] },
    ],
    nav: [
      { dir: 'left', to: 'shelf', label: '展示櫃' },
      { dir: 'right', to: 'dining', label: '餐廳' },
      { dir: 'up', to: 'hall', label: '走廊' },
    ]
  }));

  S.dining = G.photo(Object.assign({}, F1, {
    id: 'dining', img: 'dining', title: '一樓・餐廳',
    hotspots: [
      { id: 'portrait', label: '老照片', r: [2, 19, 14, 21], lines: ['牆上掛著一張全家福，相紙已經泛黃了。', '照片裡的人……', '眼睛好像一直跟著我移動。'] },
      { id: 'table', label: '圓桌', r: [46, 58, 42, 22], lines: ['紅木圓桌上的轉盤……', '我走進來的時候，它好像自己轉了半圈。'], sfx: () => G.sfx.creak(0.3, 1) },
      {
        id: 'pc', label: '電腦螢幕', r: [44, 43, 22, 17], fn: () => say([
          '電腦螢幕是黑的。', '黑色的螢幕上映出我的臉……',
          ['', '還有，我背後站著的另一個人。', () => G.sfx.sting(0.55)],
          '——！', '……回頭。', '什麼都沒有。'])
      },
      { id: 'window', label: '窗外', r: [70, 24, 30, 30], lines: ['窗外是後巷。', '晾衣竿上掛著一件白衣服，一動也不動。'] },
      { id: 'wallfan', label: '壁扇', r: [47, 28, 9, 15], lines: ['牆上的壁扇，扇葉積了厚厚的灰。'] },
    ],
    nav: [
      { dir: 'right', to: 'altar', label: '神明廳' },
      { dir: 'down', to: 'living', label: '回客廳' },
    ]
  }));

  S.altar = G.photo(Object.assign({}, F1, {
    id: 'altar', img: 'altar', title: '一樓・神明廳',
    onEnter: async (first) => { if (first) { G.sfx.whisper(0.2); await say(['神明廳。', '紅色的神明燈把整面牆照得像血一樣。']); } },
    hotspots: [
      { id: 'lamps', label: '神明燈', r: [56, 39, 23, 16], lines: ['神明燈還亮著。', '（房子空了這麼久……電費到底是誰在繳？）'] },
      { id: 'painting', label: '神明彩', r: [58, 15, 30, 37], lines: ['牆上掛著神明彩。', '神像都請走了，只留下這幅畫。', '畫裡的神明低著頭……好像在看地上的什麼東西。'] },
      { id: 'plush', label: '布偶櫃', r: [26, 26, 22, 62], lines: ['櫃子裡塞滿了布偶。', '每一隻……都面向著門口。'] },
      { id: 'jar', label: '陶甕', r: [14, 65, 13, 14], lines: ['一個黑色的陶甕，蓋子被膠帶封死了。', '……我決定不要打開它。'] },
      { id: 'chair', label: '搖椅', r: [66, 71, 34, 29], lines: ['一張舊搖椅。', '我盯著它看的時候，它輕輕晃了一下。'], sfx: () => G.sfx.creak(0.45, 1.6) },
      { id: 'window', label: '盆栽', r: [0, 22, 24, 34], lines: ['窗台上的盆栽倒是長得很好。', '……好得有點不正常。'] },
    ],
    nav: [{ dir: 'down', to: 'dining', label: '回餐廳' }]
  }));

  S.shelf = G.photo(Object.assign({}, F1, {
    id: 'shelf', img: 'shelf', title: '一樓・展示櫃',
    hotspots: [
      { id: 'globes', label: '雪花球', r: [10, 39, 40, 13], lines: ['一整排雪花球。', '裡面的小人……全都背對著我。'] },
      { id: 'box', label: '私房錢盒', r: [29, 54, 10, 15], lines: ['寫著「私房錢」的木盒子。', '搖一搖，裡面沙沙作響……', '（還是別打開好了。）'] },
      { id: 'hats', label: '生日帽', r: [19, 17, 27, 15], lines: ['兩頂生日帽。', '上一次在這間房子裡過生日的人，現在在哪裡呢？'] },
      { id: 'plane', label: '玩具飛機', r: [52, 3, 20, 10], lines: ['櫃子頂端擺著一架紅色的玩具飛機。', '機頭朝著窗外，像是想飛走。'] },
      { id: 'capy', label: '水豚擺飾', r: [55, 65, 9, 13], lines: ['咬著西瓜的水豚擺飾。', '整間房子裡，只有牠看起來心情很好。'] },
      { id: 'art', label: '畫', r: [80, 14, 20, 32], lines: ['一幅夕陽的畫。', '顏色黑黑紅紅的，越看越不舒服。'] },
    ],
    nav: [
      { dir: 'left', to: 'cabinet', label: '置物櫃' },
      { dir: 'down', to: 'living', label: '回客廳' },
    ]
  }));

  S.cabinet = G.photo(Object.assign({}, F1, {
    id: 'cabinet', img: 'cabinet', title: '一樓・置物櫃',
    hotspots: [
      { id: 'capsules', label: '最下層', r: [26, 77, 17, 22], go: 'capsules' },
      { id: 'louver', label: '百葉櫃', r: [5, 20, 20, 74], lines: ['百葉門的縫隙裡，好像有什麼東西在往外看。', '……拉開。', '只有一堆舊衣服。'] },
      { id: 'plush', label: '黃色布偶', r: [62, 84, 27, 16], lines: ['一隻黃色的大布偶，歪著頭看我。', '剛剛……它的頭是往這邊歪的嗎？'] },
      { id: 'fan', label: '電風扇', r: [85, 61, 15, 34], lines: ['又一台電風扇。', '這家人好像很怕熱……還是很怕安靜？'] },
      { id: 'pumpkin', label: '南瓜燈', r: [87, 0, 13, 8], lines: ['萬聖節的南瓜燈，嘴巴咧得好開。'] },
      { id: 'drawers', label: '收納盒', r: [77, 12, 22, 18], lines: ['抽屜裡塞滿了髮夾、橡皮筋……', '還有一撮綁好的頭髮。'] },
    ],
    nav: [{ dir: 'down', to: 'shelf', label: '回展示櫃' }]
  }));

  S.capsules = G.photo(Object.assign({}, F1, {
    id: 'capsules', img: 'capsules', title: '一樓・置物櫃（最下層）',
    enter: ['櫃子最下層，塞滿了扭蛋的空殼。'],
    decorate(wrap) {
      if (F().marbleTaken) return;
      const m = G.el('div', 'marble');
      Object.assign(m.style, { left: '45%', top: '73.3%', width: '3.9%', height: '3.9%' });
      m.title = '';
      m.addEventListener('click', async (e) => {
        e.stopPropagation(); if (G.locked()) return;
        F().marbleTaken = true; m.remove();
        await say(['咦？扭蛋殼堆裡，混著一顆玻璃彈珠。']);
        G.addItem('marble');
        await say(['冰冰涼涼的。', '我順手把它放進了口袋。']);
      });
      wrap.appendChild(m);
    },
    hotspots: [
      { id: 'black', label: '黑色扭蛋', r: [57, 46, 8, 10], lines: ['只有這顆扭蛋是全黑的。', '拿起來搖一搖……裡面有東西在動。', '……我把它放回去了。'] },
      { id: 'box', label: '積木盒', r: [62, 28, 38, 32], lines: ['黃色的積木收納盒，裡面空空的。'] },
      { id: 'pile', label: '扭蛋殼', r: [10, 20, 30, 40], lines: ['好多扭蛋殼……少說也有上百個。', '到底是誰轉了這麼多？'] },
    ],
    nav: [{ dir: 'down', to: 'cabinet', label: '返回' }]
  }));

  S.hall = G.photo(Object.assign({}, F1, {
    id: 'hall', img: 'hall', title: '一樓・走廊',
    hotspots: [
      { id: 'shelves', label: '雜物架', r: [0, 5, 17, 95], lines: ['架子上塞滿了塑膠袋、舊報紙，還有看不出是什麼的東西。', '一股霉味。'] },
      { id: 'wok', label: '炒鍋', r: [61, 32, 9, 17], lines: ['門後掛著一個大炒鍋。'] },
      { id: 'kitchen', label: '進入廚房', r: [30, 22, 30, 62], go: 'kitchen' },
    ],
    nav: [
      { dir: 'up', to: 'kitchen', label: '廚房' },
      { dir: 'right', to: 'corridor', label: '樓梯間' },
      { dir: 'down', to: 'living', label: '回客廳' },
    ]
  }));

  S.kitchen = G.photo(Object.assign({}, F1, {
    id: 'kitchen', img: 'kitchen', title: '一樓・廚房',
    hotspots: [
      { id: 'stove', label: '瓦斯爐', r: [13, 53, 17, 9], lines: ['爐子上的鍋子裡，還有半鍋凝固的油。'] },
      { id: 'bulb', label: '燈泡', r: [36, 2, 7, 11], fn: async () => { G.sfx.buzz(1); await say(['燈泡閃了一下。', '……又閃了一下。']); } },
      { id: 'window', label: '小窗', r: [14, 29, 20, 18], lines: ['抽油煙機旁邊的小窗，玻璃上有一個手印。', '……是從外面印上去的。'] },
      { id: 'pan', label: '平底鍋', r: [75, 3, 20, 46], lines: ['掛在門上的平底鍋。', '鍋底映出我扭曲的臉。'] },
      { id: 'back', label: '後陽台', r: [49, 18, 21, 66], go: 'balcony' },
    ],
    nav: [
      { dir: 'up', to: 'balcony', label: '後陽台' },
      { dir: 'down', to: 'hall', label: '回走廊' },
    ]
  }));

  S.balcony = G.photo(Object.assign({}, F1, {
    id: 'balcony', img: 'balcony', title: '一樓・後陽台',
    hotspots: [
      { id: 'cookers', label: '電鍋', r: [0, 50, 30, 25], lines: ['一排電鍋。', '其中一個的保溫燈……還亮著。', '掀開鍋蓋——是空的。'] },
      { id: 'broom', label: '畚箕', r: [52, 60, 15, 36], lines: ['掃把和畚箕。', '畚箕裡有一小撮黑色的頭髮。'] },
      { id: 'heater', label: '熱水器', r: [48, 13, 20, 15], lines: ['熱水器的指示燈，一閃一閃的。'] },
      { id: 'glass', label: '霧面玻璃', r: [77, 0, 23, 100], lines: ['霧面玻璃門後面……', '有一個影子晃了過去。'], sfx: () => G.sfx.step(2) },
    ],
    nav: [
      { dir: 'up', to: 'laundry', label: '曬衣區' },
      { dir: 'down', to: 'kitchen', label: '回廚房' },
    ]
  }));

  S.laundry = G.photo(Object.assign({}, F1, {
    id: 'laundry', img: 'laundry', title: '一樓・曬衣區',
    hotspots: [
      { id: 'clothes', label: '衣服', r: [55, 38, 45, 58], lines: ['曬衣架上的衣服還沒收。', '伸手摸了一下……是濕的。', '（最近明明都沒有下雨。）'] },
      { id: 'sleeve', label: '掛著的衣服', r: [0, 51, 16, 36], lines: ['掛在牆邊的衣服，袖子垂下來……', '像是一隻手。'] },
      { id: 'basin', label: '鐵盆', r: [19, 62, 20, 20], lines: ['鐵盆裡積了一點水。', '水面……在輕輕地晃。'] },
    ],
    nav: [{ dir: 'down', to: 'balcony', label: '回後陽台' }]
  }));

  S.corridor = G.photo(Object.assign({}, F1, {
    id: 'corridor', img: 'corridor', title: '一樓・樓梯間',
    enter: ['左手邊就是往上的樓梯。'],
    hotspots: [
      { id: 'stairs', label: '樓梯（上二樓）', r: [0, 44, 11, 56], go: 'stairs' },
      { id: 'bath', label: '浴室', r: [42, 10, 32, 80], go: 'bath' },
      {
        id: 'trash', label: '垃圾桶', r: [16, 78, 16, 21], fn: async ({ first }) => {
          if (F().note) return say(['垃圾桶裡已經沒有其他東西了。']);
          await say(['垃圾桶裡只有一張揉爛的紙。', '攤開來看——']);
          G.sfx.sting(0.4);
          await say(['「不要睡在二樓」', '……什麼意思？']);
          F().note = true; G.addItem('note');
        }
      },
      { id: 'basket', label: '洗衣籃', r: [74, 76, 17, 24], lines: ['空的洗衣籃。'] },
      { id: 'towels', label: '層架', r: [82, 0, 18, 20], lines: ['門框上方的層架堆著舊毛巾。'] },
    ],
    nav: [
      { dir: 'left', to: 'stairs', label: '上二樓' },
      { dir: 'up', to: 'bath', label: '浴室' },
      { dir: 'down', to: 'hall', label: '回走廊' },
    ]
  }));

  S.bath = G.photo(Object.assign({}, F1, {
    id: 'bath', img: 'bath', title: '一樓・浴室',
    hotspots: [
      { id: 'drain', label: '排水孔', r: [54, 70, 10, 8], fn: async () => { G.sfx.gurgle(); await say(['排水孔傳來「咕嚕……咕嚕……」的聲音。', '像是有人在下面吞口水。']); } },
      { id: 'drain2', label: '排水孔', r: [55, 88, 11, 8], fn: async () => { G.sfx.gurgle(); await say(['另一個排水孔裡，卡著一團長頭髮。']); } },
      { id: 'stool', label: '小板凳', r: [21, 58, 15, 26], lines: ['浴室裡放著一張小板凳。', '……板凳上是濕的。'] },
      { id: 'sink', label: '洗手台', r: [62, 49, 17, 22], fn: async () => { G.sfx.drip(0.4); await G.wait(500); G.sfx.drip(0.35); await say(['水龍頭沒有關緊，一滴一滴地漏水。', '滴、答。滴、答。']); } },
      { id: 'shelf', label: '置物架', r: [20, 29, 10, 32], lines: ['洗髮精、沐浴乳……都還是半滿的。'] },
    ],
    nav: [{ dir: 'down', to: 'corridor', label: '返回' }]
  }));

  S.stairs = G.photo(Object.assign({}, F1, {
    id: 'stairs', img: 'stairs', title: '二樓・樓梯口',
    async onEnter(first) {
      if (!first) return;
      G.objective('');
      await say(['爬上樓梯，回頭往下看了一眼——',
        ['', '樓梯底下，有兩顆頭正探出來看著我。', () => G.sfx.sting(0.6)],
        '……', '……仔細一看，只是櫃子上的玩偶。', '（嚇死人了……）']);
    },
    hotspots: [
      { id: 'dolls', label: '玩偶', r: [64, 63, 15, 11], lines: ['樓梯下櫃子上的玩偶。', '剛剛……它們有在那裡嗎？'] },
      { id: 'rail', label: '扶手', r: [15, 43, 50, 32], lines: ['不鏽鋼扶手冰冰涼涼的。'] },
    ],
    nav: [
      { dir: 'up', to: 'room2f', label: '進入二樓' },
      { dir: 'down', to: 'corridor', label: '下樓' },
    ]
  }));

  S.room2f = G.photo({
    id: 'room2f', img: 'room2f', ar: 1400 / 1064, title: '二樓', grade: G.GRADE.dusk, tint: G.TINT.dusk,
    async onEnter(first) {
      if (!first) return;
      await say(['二樓……什麼都沒有。', '乾乾淨淨的，跟一樓完全不一樣。', '好像前屋主……從來沒有上來過。', '今晚要住在這裡的話，至少得買張床。']);
      G.objective('去家具行買家具');
    },
    hotspots: [
      { id: 'wreath', label: '花圈', r: [48, 33, 9, 11], lines: ['空蕩蕩的牆上，只掛著一個小花圈。', '（……誰會在空房間裡掛花圈？）'] },
      { id: 'light', label: '日光燈', r: [0, 7, 18, 18], fn: async () => { G.sfx.buzz(1.4); await say(['日光燈管「滋——滋——」地閃了兩下。']); } },
      { id: 'wall', label: '牆壁', r: [58, 46, 36, 44], lines: ['這面牆有一塊顏色比較新，像是重新粉刷過。', '底下……蓋住了什麼？'] },
      { id: 'ceiling', label: '天花板', r: [34, 0, 50, 28], lines: ['天花板很高，白白的，什麼都沒有。', '……今天晚上，我就要睡在這底下。'] },
    ],
    nav: () => [
      { dir: 'down', to: 'stairs', label: '下樓' },
      { dir: 'action', label: '騎車去家具行', fn: () => G.go('ride2', { fadeMs: 800 }), show: () => G.state.visited.room2f > 0 },
    ]
  });

  S.ride2 = {
    mount(st) {
      G.hud(false);
      this.p = Ride.start(st, {
        length: 8, from: '新家', to: '家具行', tod0: .5, tod1: .7,
        lines: [{ at: .08, text: '附近就有一間老家具行。' }, { at: .55, text: '天色，暗得好快。' }]
      });
    },
    async after() { await this.p; G.go('store', { fadeMs: 800 }); }
  };

  /* ================= 晚上，臥室 ================= */
  const NIGHT = { grade: G.GRADE.night, tint: G.TINT.night, tintBlend: 'multiply' };
  const readyToSleep = () => F().water && F().fanOn;
  const bedObjective = () => {
    if (readyToSleep()) G.objective('上床睡覺');
    else G.objective('睡前要' + [F().water ? null : '倒一杯水放床頭', F().fanOn ? null : '打開電風扇'].filter(Boolean).join('、'));
  };

  S.bed1 = G.photo(Object.assign({}, NIGHT, {
    id: 'bed1', img: 'bed1', title: '二樓・臥室',
    async onEnter(first) {
      if (!AudioSys.rain.on) AudioSys.rain.start(0.22, 3);
      if (first) {
        await say(['衣櫃、五斗櫃、床……都擺好了。', '二樓終於有點像人住的地方。', '窗外……開始下雨了。']);
      }
      bedObjective();
    },
    hotspots: [
      { id: 'mirror', label: '鏡子', r: [35, 13, 24, 58], lines: ['衣櫃的鏡子霧濛濛的。', '裡面……好像有一團黑影。', '揉揉眼睛再看，又只是房間的倒影。'] },
      { id: 'window', label: '窗戶', r: [0, 11, 19, 39], lines: ['雨越下越大了。'] },
      { id: 'chair', label: '椅子', r: [2, 50, 28, 26], lines: ['椅子上堆著剛搬來的衣服和棉被。'] },
      { id: 'shelf', label: '摺好的衣服', r: [78, 49, 22, 12], lines: ['摺好的衣服。上面那件……我不記得我有這件。'] },
      {
        id: 'bed', label: '床', r: [8, 74, 92, 26], fn: async () => {
          if (!readyToSleep()) return say(['（睡前……先倒杯水、把電風扇打開吧。）']);
          const lines = ['躺上床，關燈。', '雨聲。電風扇的咯噠聲。'];
          if (G.hasItem('note')) lines.push('（「不要睡在二樓」……）', '……想太多了。');
          lines.push('眼皮……越來越重——');
          await say(lines);
          AudioSys.fan.stop(1.5);
          G.save('bedroom');
          await G.fadeOut(1800);
          G.go('sleep', { noFade: true });
        }
      },
    ],
    nav: [
      { dir: 'left', to: 'bed2', label: '衣櫃' },
      { dir: 'right', to: 'bed3', label: '五斗櫃' },
    ]
  }));

  S.bed2 = G.photo(Object.assign({}, NIGHT, {
    id: 'bed2', img: 'bed2', title: '二樓・臥室（衣櫃）',
    hotspots: [
      { id: 'wardrobe', label: '衣櫃', r: [20, 0, 52, 98], lines: ['新買的衣櫃。', '門關得緊緊的……', '（我記得剛剛有打開來放衣服的。）'] },
      { id: 'window', label: '窗戶', r: [70, 15, 30, 36], fn: async () => { G.sfx.thunder(0.4, 0.7); await say(['雨打在窗戶上，劈哩啪啦。', '遠處閃了一下雷光。']); } },
      { id: 'jewel', label: '首飾盒', r: [0, 33, 25, 30], lines: ['首飾盒的小鏡子裡，有一雙眼睛——', '……是我自己的。'] },
    ],
    nav: [{ dir: 'right', to: 'bed1', label: '床' }]
  }));

  S.bed3 = G.photo(Object.assign({}, NIGHT, {
    id: 'bed3', img: 'bed3', title: '二樓・臥室（五斗櫃）',
    hotspots: [
      {
        id: 'water', label: '水杯', r: [10, 30, 40, 20], fn: async () => {
          if (F().water) return say(['床頭的水杯。', '水面平平靜靜的。']);
          F().water = true;
          G.sfx.drip(0.4); await G.wait(250); G.sfx.drip(0.3);
          await say(['倒了一杯水，放在床頭。', '半夜口渴的話，就不用下樓了。']);
          bedObjective();
        }
      },
      {
        id: 'fan', label: '電風扇', r: [0, 69, 42, 31], fn: async () => {
          if (F().fanOn) return say(['電風扇左右擺著頭。', '咯噠……咯噠……']);
          F().fanOn = true;
          AudioSys.fan.start(0.28, 1.5);
          await say(['打開家具行老闆送的電風扇。', '它左右擺頭的時候，會發出「咯噠、咯噠」的聲音。', '……有點吵，不過聽久了應該就習慣了。']);
          bedObjective();
        }
      },
      { id: 'drawer', label: '抽屜', r: [28, 50, 40, 44], lines: ['抽屜拉開一半就卡住了。', '裡面……好像有人塞了一張紙？', '用力拉——拉不開。'] },
      { id: 'side', label: '衣櫃側面', r: [70, 0, 30, 90], lines: ['衣櫃側面有幾道細細的刮痕。', '像是……指甲抓出來的。'] },
    ],
    nav: [{ dir: 'left', to: 'bed1', label: '床' }]
  }));

  /* ================= 夢境 ================= */
  S.sleep = {
    mount: black,
    async after() {
      await G.fadeIn(10);
      await cine([['那一晚，我做了一個好長、好長的夢。', 3600]]);
      G.go('dream', { fadeMs: 600, fadeInMs: 200 });
    }
  };

  S.dream = {
    mount(st) { G.hud(false); G.ambient(false); Ghost.prepare(); this.p = Dream.start(st); },
    async after() {
      await this.p;
      G.go('wake', { fadeMs: 10, fadeInMs: 2400 });
    }
  };

  S.wake = {
    mount(st) {
      G.hud(false);
      AudioSys.rain.stop(0.1);
      const scr = G.el('div', 'screen photo-scene', `
        <div class="bgblur" style="background-image:url(assets/bed1.jpg)"></div>
        <div class="photo-wrap" style="--ar:1;--grade:${G.GRADE.morning}"><img src="assets/bed1.jpg" alt=""><div class="sunlight"></div></div>
        <div class="phone"><div class="scr"><div class="date">10月18日 星期日</div><div class="time">10:30</div>
          <div class="noti"><b>訊息・仲介 小陳</b>昨晚……睡得還好嗎？</div></div></div>`);
      st.appendChild(scr);
      this.phone = scr.querySelector('.phone');
    },
    async after() {
      await say(['——哈啊！', '……', '醒……醒來了。', '全身都是冷汗，睡衣黏在背上。']);
      this.phone.classList.add('show'); G.sfx.pickup();
      await say(['手機的螢幕亮著。', '……已經 10:30 了？', '（我睡了這麼久……）']);
      this.phone.classList.remove('show');
      await G.wait(600);
      await say(['窗外的雨停了。陽光照進房間，一切看起來都很正常。', '……只是一場夢而已。', '我轉頭看向床頭——',
        ['', '水杯裡的水，一滴都不剩。', () => G.sfx.sting(0.6)],
        '杯子正上方的天花板，有一圈濕濕的、暗褐色的水漬。']);
      G.go('end', { fadeMs: 1600 });
    }
  };

  S.end = {
    mount(st) {
      G.hud(false); G.objective('', false);
      const n = G.state.examined || 0;
      const scr = G.el('div', 'screen end-card', `
        <div>
          <div class="ch">第 一 章</div>
          <div class="tt">惡夢開端</div>
          <div class="fin">〔 完 〕</div>
          <div class="stats">${[n ? `調查了 ${n} 個地方` : '', F().marbleTaken ? '找到了彈珠' : '', F().note ? '讀了紙條' : ''].filter(Boolean).join('・')}<br>第二章　敬請期待</div>
          <div class="menu"><button class="btn again">再玩一次</button><button class="btn small dream">重看惡夢</button></div>
        </div>`);
      st.appendChild(scr);
      scr.querySelector('.again').addEventListener('click', () => { G.clearSave(); G.state = G.newState(); G.renderInv(); G.go('title', { fadeMs: 1000 }); });
      scr.querySelector('.dream').addEventListener('click', () => G.go('dream', { fadeMs: 800, fadeInMs: 200 }));
    },
    after() { AudioSys.drone.start(0.08, 3, { base: 41 }); },
    unmount() { AudioSys.drone.stop(1); }
  };
})();
