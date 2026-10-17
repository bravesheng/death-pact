/* 啟動。網址加上 #場景名稱（例如 #dream、#store、#exterior）可以直接跳到該場景測試。 */
(function () {
  const jump = decodeURIComponent(location.hash.slice(1));
  if (jump && G.scenes[jump]) {
    const gate = G.el('div', 'screen title-screen', `<div class="inner"><div class="title-sub" style="margin:0 0 24px">測試：${jump}</div><button class="btn">點擊開始</button></div>`);
    G.stage.appendChild(gate);
    G.fadeIn(300);
    gate.querySelector('button').addEventListener('click', () => {
      AudioSys.init();
      const F = G.state.flags;
      if (jump === 'dream' || jump === 'wake') { G.state.inv = ['marble']; G.renderInv(); }
      if (jump.startsWith('bed')) { F.furniture = ['bed']; F.fan = true; }
      G.go(jump, { fadeMs: 400 });
    });
  } else {
    G.go('title', { noFade: true, fadeInMs: 1500 });
  }
})();
