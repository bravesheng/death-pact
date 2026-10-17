/* 家具行：挑選家具、結帳，老闆送一台老電扇 */
(function () {
  const GOODS = [
    { id: 'bed', name: '實木雙人床', img: 'item_bed', price: 8800, must: true, desc: '附床墊與碎花床包。老闆說是「整組拿回來的」。' },
    { id: 'wardrobe', name: '對開大衣櫃', img: 'item_wardrobe', price: 6500, desc: '厚實的柚木衣櫃，門一關上就密不透風。' },
    { id: 'dresser', name: '四斗櫃＋首飾盒', img: 'item_dresser', price: 3900, desc: '抽屜有點卡。首飾盒的小鏡子擦不乾淨。' },
  ];
  const fmt = (n) => 'NT$ ' + n.toLocaleString('en-US');

  function fanIcon() {
    const c = document.createElement('canvas'); c.width = 400; c.height = 300;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#3a2a1e'); g.addColorStop(1, '#1d140e');
    x.fillStyle = g; x.fillRect(0, 0, 400, 300);
    x.fillStyle = '#2f7d84'; x.beginPath(); x.ellipse(200, 272, 70, 14, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#cfd6da'; x.fillRect(195, 150, 10, 120);
    x.fillStyle = '#2f7d84'; x.beginPath(); x.ellipse(218, 118, 34, 30, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#d9dee0'; x.lineWidth = 3; x.beginPath(); x.arc(190, 118, 78, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 1.2; x.beginPath();
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; x.moveTo(190, 118); x.lineTo(190 + Math.cos(a) * 78, 118 + Math.sin(a) * 78); }
    x.stroke();
    x.fillStyle = 'rgba(70,160,170,.75)';
    for (let i = 0; i < 4; i++) { x.save(); x.translate(190, 118); x.rotate(i * Math.PI / 2 + .3); x.beginPath(); x.ellipse(0, -36, 20, 34, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
    x.fillStyle = '#b3261e'; x.beginPath(); x.arc(190, 118, 12, 0, Math.PI * 2); x.fill();
    return c.toDataURL();
  }

  G.scenes.store = {
    mount(st) {
      G.hud(true); G.setLoc('阿成家具行'); G.objective('買家具（至少要買床）');
      const cart = this.cart = new Set();
      const scr = G.el('div', 'screen store');
      scr.innerHTML = `
        <div class="store-inner">
          <div class="store-sign"><div class="name">阿成家具行</div><div class="tag">傢俱・寢具・二手家電</div></div>
          <div class="store-intro">店裡瀰漫著木頭和樟腦丸的味道。日光燈管一閃一閃的。</div>
          <div class="goods"></div>
        </div>
        <div class="store-bar">
          <span>預算 <b class="budget"></b></span>
          <span>合計 <b class="total">NT$ 0</b></span>
          <button class="btn small checkout">結帳</button>
        </div>`;
      const goods = scr.querySelector('.goods');
      GOODS.forEach(g => {
        const card = G.el('div', 'good', `
          <div class="img" style="background-image:url(assets/${g.img}.jpg)"></div>
          <div class="body">
            <div class="nm">${g.name}${g.must ? '<span class="must">必買</span>' : ''}</div>
            <div class="ds">${g.desc}</div>
            <div class="row"><span class="pr">${fmt(g.price)}</span><button>加入</button></div>
          </div>`);
        card.querySelector('button').addEventListener('click', () => {
          if (G.locked()) return;
          if (cart.has(g.id)) cart.delete(g.id); else cart.add(g.id);
          G.sfx.click(); sync();
        });
        card.dataset.id = g.id;
        goods.appendChild(card);
      });
      const sync = () => {
        let total = 0;
        goods.querySelectorAll('.good').forEach(c => {
          const on = cart.has(c.dataset.id); c.classList.toggle('in', on);
          c.querySelector('button').textContent = on ? '已選 ✓' : '加入';
          if (on) total += GOODS.find(g => g.id === c.dataset.id).price;
        });
        scr.querySelector('.total').textContent = fmt(total);
        scr.querySelector('.total').style.color = total > G.state.money ? '#ff6b5b' : '';
        this.total = total;
      };
      scr.querySelector('.budget').textContent = fmt(G.state.money);
      scr.querySelector('.checkout').addEventListener('click', () => { if (!G.locked()) this.checkout(); });
      st.appendChild(scr);
      sync();
      G.keyHandler = null;
    },
    async after(first) {
      if (first) await G.say([['老闆', '少年仔，剛搬來喔？'], ['老闆', '要買什麼慢慢看，看好了跟我說。']]);
    },
    async checkout() {
      const cart = this.cart;
      if (!cart.has('bed')) { await G.say([['老闆', '沒買床喔？你今天晚上要睡地上嗎？']]); return; }
      if (this.total > G.state.money) { await G.say([['我', '（……錢不夠。得少買一點。）']]); return; }
      await G.say([
        ['老闆', '好，這樣一共 ' + fmt(this.total) + '。'],
        ['老闆', '送貨地址寫一下。今天晚上就幫你載過去。'],
        ['我', '中正路……44 號。'],
        ['老闆', '……'],
        ['老闆', '44 號？'],
        ['老闆', '你、你是買那間喔……'],
        ['我', '怎麼了嗎？'],
        ['老闆', '沒啦、沒啦！'],
        ['老闆', '算你半價就好。'],
        () => { G.sfx.cash(); G.state.money -= Math.round(this.total / 2); G.state.flags.furniture = Array.from(cart); },
        ['老闆', '還有這台老電扇……你帶回去。'],
        () => this.showFan(),
        ['老闆', '這台本來就是從那間厝收回來的。'],
        ['老闆', '它……應該也想回家吧。'],
        ['我', '（……什麼意思？）'],
        () => this.hideFan(),
        ['老闆', '晚上記得……不要關燈睡。'],
      ]);
      G.state.flags.fan = true;
      G.save('bedroom');
      await G.fadeOut(900);
      G.stage.innerHTML = '';
      G.hud(false);
      await G.fadeIn(10);
      const scr = G.el('div', 'screen black-screen'); G.stage.appendChild(scr);
      await G.sub('那天晚上，家具送到了。', 2600);
      await G.sub('搬運工人放下東西，連水都沒喝就走了。', 3000);
      G.go('bed1', { fadeMs: 800 });
    },
    showFan() {
      const d = G.el('div', '', `<img src="${fanIcon()}" style="width:min(360px,70vw);border-radius:8px;box-shadow:0 10px 50px #000,0 0 0 2px #d9b45a">
        <div style="text-align:center;margin:10px auto 0;width:fit-content;padding:6px 16px;border-radius:4px;background:rgba(0,0,0,.8);font-family:var(--serif);letter-spacing:.2em">老式電風扇（贈品）</div>`);
      Object.assign(d.style, { position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)', zIndex: 58, transition: 'opacity .5s', opacity: 0 });
      G.stage.appendChild(d); requestAnimationFrame(() => d.style.opacity = 1);
      this.fanEl = d; G.sfx.pickup();
    },
    hideFan() { if (this.fanEl) { const d = this.fanEl; d.style.opacity = 0; setTimeout(() => d.remove(), 500); } },
    unmount() {}
  };
})();
