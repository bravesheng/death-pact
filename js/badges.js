/* 徽章（榮譽）：達成不同劇情就會獲得，存在瀏覽器裡 */
(function () {
  const KEY = 'deathpact.badges';
  const ring = (inner) => `<svg viewBox="0 0 64 64"><defs>
      <radialGradient id="bgR" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#8e2219"/><stop offset="1" stop-color="#3a0b07"/></radialGradient>
      <linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dd8c"/><stop offset=".5" stop-color="#b8892e"/><stop offset="1" stop-color="#f1d27a"/></linearGradient></defs>
      <circle cx="32" cy="32" r="30" fill="url(#bgG)"/><circle cx="32" cy="32" r="25" fill="url(#bgR)"/>
      <circle cx="32" cy="32" r="25" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>
      <g fill="none" stroke="#f3e6cc" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
  G.BADGES = [
    { id: 'ending1', name: '惡夢開端', desc: '第一章結局：撐過了天花板上的惡夢。', hint: '把家具都買齊，安心睡一覺。',
      icon: ring('<path d="M32 18v10l-6 5M32 28l7 4 2 8M26 33l-5 9M39 32l6-2"/><circle cx="32" cy="28" r="2.2" fill="#9ff" stroke="none"/>') },
    { id: 'ending2', name: '留給我的水', desc: '第一章隱藏結局：晚上，別把水放在地上。', hint: '有些東西，晚上不該放在地上。',
      icon: ring('<path d="M22 26h18v14a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6z"/><path d="M40 30h3a3 3 0 0 1 0 6h-3"/><path d="M31 14c-3 4-3 6 0 7 3-1 3-3 0-7z" fill="#f3e6cc"/>') },
    { id: 'marble', name: '玻璃彈珠', desc: '在一樓的雜物間找到了玻璃彈珠。', hint: '雜物間的扭蛋殼堆裡，好像有什麼在發光。',
      icon: ring('<circle cx="32" cy="32" r="10"/><path d="M26 30c3-5 9-5 12 0"/><circle cx="28" cy="28" r="1.6" fill="#f3e6cc"/>') },
    { id: 'note', name: '警告', desc: '讀到了「不要睡在二樓」。', hint: '二樓某個垃圾桶裡，有一張揉爛的紙。',
      icon: ring('<path d="M23 18h14l5 5v23H23z"/><path d="M28 28h9M28 33h9M28 38h6"/>') },
    { id: 'curious', name: '好奇心', desc: '調查了 30 個地方。', hint: '到處點點看。',
      icon: ring('<circle cx="29" cy="29" r="8"/><path d="M35 35l8 8"/>') },
    { id: 'stairs', name: '不回頭', desc: '一口氣走上二樓，中途沒有停下來。', hint: '走樓梯的時候，不要放開。',
      icon: ring('<path d="M18 44h8v-7h7v-7h7v-7h6"/>') },
  ];
  G.BADGE_LOCKED = ring('');
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = (b) => { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) {} };
  G.badges = load();
  G.hasBadge = (id) => !!G.badges[id];

  // 跳出一個小框框：「觸發 ……」+ 獲得徽章
  let queue = Promise.resolve();
  G.award = function (id, opts = {}) {
    const b = G.BADGES.find(x => x.id === id);
    if (!b) return Promise.resolve(false);
    const isNew = !G.badges[id];
    if (isNew) { G.badges[id] = new Date().toISOString().slice(0, 10); save(G.badges); }
    if (!isNew && !opts.always) return Promise.resolve(false);
    queue = queue.then(() => popup(b, opts, isNew));
    return queue;
  };
  function popup(b, opts, isNew) {
    return new Promise(res => {
      const el = G.el('div', 'badge-pop', `
        <div class="bp-icon">${b.icon}</div>
        <div class="bp-text">
          ${opts.title ? `<div class="bp-title">${opts.title}</div>` : ''}
          <div class="bp-name">${isNew ? '獲得徽章' : '徽章'}「${b.name}」</div>
          <div class="bp-desc">${b.desc}</div>
        </div>`);
      document.getElementById('app').appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      G.sfx.pickup();
      let done = false;
      const close = () => {
        if (done) return; done = true;
        el.classList.remove('show'); setTimeout(() => { el.remove(); res(true); }, 450);
      };
      el.addEventListener('click', close);
      setTimeout(close, opts.ms || 3600);
    });
  }

  // 主頁面的「榮譽」：看已經拿到的徽章
  G.showHonors = function () {
    const got = G.BADGES.filter(b => G.badges[b.id]).length;
    const el = G.el('div', 'honors', `
      <div class="hn-box">
        <div class="hn-head"><div class="hn-title">榮　譽</div><div class="hn-count">徽章 ${got} / ${G.BADGES.length}</div></div>
        <div class="hn-grid">${G.BADGES.map(b => {
          const on = G.badges[b.id];
          return `<div class="hn-card ${on ? 'on' : 'off'}">
            <div class="hn-icon">${on ? b.icon : G.BADGE_LOCKED + '<span class="hn-q">？</span>'}</div>
            <div class="hn-name">${on ? b.name : '？？？'}</div>
            <div class="hn-desc">${on ? b.desc : b.hint}</div>
            ${on ? `<div class="hn-date">${on}</div>` : ''}
          </div>`;
        }).join('')}</div>
        <button class="btn small hn-close">返回</button>
      </div>`);
    document.getElementById('app').appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const close = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); };
    el.querySelector('.hn-close').addEventListener('click', (e) => { e.stopPropagation(); G.sfx.click(); close(); });
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
  };
})();
