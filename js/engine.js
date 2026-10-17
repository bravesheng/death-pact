/* 遊戲引擎：場景切換、對話框、字幕、HUD、物品欄、照片場景 */
(function () {
  const G = window.G = { scenes: {}, cur: null, curId: null, busy: false };
  const $ = (s, el = document) => el.querySelector(s);
  G.$ = $;
  G.wait = (ms) => new Promise(r => setTimeout(r, ms));
  G.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  G.sfx = new Proxy({}, { get: (_, k) => (...a) => AudioSys.sfx[k] && AudioSys.sfx[k](...a) });

  G.GRADE = {
    dusk: 'brightness(.86) contrast(1.1) saturate(.75) sepia(.2)',
    dim: 'brightness(.62) contrast(1.18) saturate(.6) sepia(.15)',
    night: 'brightness(.66) contrast(1.15) saturate(.55)',
    morning: 'brightness(1.12) contrast(1.02) saturate(1.05) sepia(.08)',
  };
  G.TINT = {
    night: 'linear-gradient(rgba(20,34,80,.38), rgba(10,14,40,.45))',
    dusk: 'linear-gradient(rgba(90,40,20,.12), rgba(20,10,30,.25))',
  };

  G.newState = () => ({ flags: {}, inv: [], seen: {}, visited: {}, money: 20000, examined: 0 });
  G.state = G.newState();

  const stage = $('#stage'), fade = $('#fade'), dialog = $('#dialog'), sub = $('#sub'), toast = $('#toast');
  const dlgBox = $('.dlg-box'), dlgName = $('.dlg-name'), dlgText = $('.dlg-text');
  G.stage = stage;

  /* ---------- fade ---------- */
  G.fadeOut = function (ms = 600) {
    fade.style.transitionDuration = ms + 'ms'; fade.classList.add('block');
    void fade.offsetWidth; fade.style.opacity = 1; return G.wait(ms);
  };
  G.fadeIn = function (ms = 600) {
    fade.style.transitionDuration = ms + 'ms'; fade.style.opacity = 0;
    return G.wait(ms).then(() => fade.classList.remove('block'));
  };

  /* ---------- scene switching ---------- */
  G.go = async function (id, opts = {}) {
    const def = G.scenes[id];
    if (!def) { console.error('no scene', id); return; }
    if (G.busy && !opts.force) return;
    G.busy = true;
    if (!opts.noFade) await G.fadeOut(opts.fadeMs || 450);
    if (G.cur && G.cur.unmount) { try { G.cur.unmount(); } catch (e) { console.warn(e); } }
    stage.innerHTML = '';
    G.hideSub();
    const first = !G.state.visited[id];
    G.state.visited[id] = (G.state.visited[id] || 0) + 1;
    G.cur = def; G.curId = id;
    try { await def.mount(stage, opts, first); } catch (e) { console.error(e); }
    if (!opts.noFadeIn) await G.fadeIn(opts.fadeInMs || 650);
    G.busy = false;
    if (def.after) { try { await def.after(first, opts); } catch (e) { console.error(e); } }
  };
  G.locked = () => G.busy || G.dialogOpen;

  /* ---------- dialog ---------- */
  let advanceFn = null;
  G.dialogOpen = false;
  function typeLine(who, text, thought) {
    return new Promise(resolve => {
      dlgName.textContent = who || '';
      dlgText.textContent = '';
      dlgText.classList.toggle('thought', !!thought);
      dlgBox.classList.remove('done');
      let i = 0, done = false;
      const chars = Array.from(text);
      const timer = setInterval(() => {
        i++;
        dlgText.textContent = chars.slice(0, i).join('');
        if (i % 3 === 0) G.sfx.tick();
        if (i >= chars.length) finish();
      }, 34);
      function finish() { clearInterval(timer); dlgText.textContent = text; done = true; dlgBox.classList.add('done'); }
      advanceFn = () => {
        if (!done) { finish(); return; }
        advanceFn = null; resolve();
      };
    });
  }
  G.say = async function (lines) {
    if (!Array.isArray(lines)) lines = [lines];
    G.dialogOpen = true;
    document.body.classList.add('dialog-open');
    let shown = false;
    for (const ln of lines) {
      if (typeof ln === 'function') { await ln(); continue; }
      let who = '', text = ln;
      if (Array.isArray(ln)) { who = ln[0]; text = ln[1]; if (ln[2]) ln[2](); }
      if (!shown) { dialog.classList.remove('hidden'); shown = true; }
      await typeLine(who, text, /^（/.test(text));
    }
    dialog.classList.add('hidden');
    document.body.classList.remove('dialog-open');
    await G.wait(60);
    G.dialogOpen = false;
  };
  dialog.addEventListener('click', () => advanceFn && advanceFn());

  /* ---------- subtitles / toast ---------- */
  let subTimer = null;
  G.sub = async function (text, ms) {
    clearTimeout(subTimer);
    sub.textContent = text; sub.classList.add('show');
    await G.wait(ms || 1300 + Array.from(text).length * 120);
    sub.classList.remove('show');
    await G.wait(500);
  };
  G.hideSub = () => sub.classList.remove('show');
  let toastTimer = null;
  G.toast = function (text, ms = 2200) {
    toast.textContent = text; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
  };

  /* ---------- HUD ---------- */
  const hud = $('#hud'), hudLoc = $('#hud-loc'), hudObj = $('#hud-obj'), hudInv = $('#hud-inv');
  G.hud = (show) => hud.classList.toggle('hidden', !show);
  G.setLoc = (t) => { hudLoc.textContent = t || ''; };
  G.objective = function (t, flash = true) {
    G.state.objective = t || '';
    hudObj.textContent = t ? '目標：' + t : '';
    if (t && flash) { hudObj.classList.remove('flash'); void hudObj.offsetWidth; hudObj.classList.add('flash'); }
  };

  G.ITEMS = {
    key: { name: '生鏽的鑰匙', svg: '<svg viewBox="0 0 24 24"><circle cx="7" cy="12" r="4" fill="none" stroke="#d9b45a" stroke-width="2.2"/><path d="M11 12h10M17 12v4M20 12v3" stroke="#d9b45a" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>' },
    marble: { name: '玻璃彈珠', svg: '<svg viewBox="0 0 24 24"><defs><radialGradient id="mg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#bfefff"/><stop offset=".7" stop-color="#2aa69a"/><stop offset="1" stop-color="#0c4a55"/></radialGradient></defs><circle cx="12" cy="12" r="8" fill="url(#mg)"/></svg>' },
    note: { name: '揉爛的紙條', svg: '<svg viewBox="0 0 24 24"><path d="M5 4l12 1 2 14-13 1z" fill="#e8e0cc"/><path d="M8 9h8M8 12h7M8 15h5" stroke="#a33" stroke-width="1.4"/></svg>' },
  };
  function renderInv() {
    hudInv.innerHTML = '';
    G.state.inv.forEach(id => {
      const it = G.ITEMS[id]; if (!it) return;
      const d = G.el('div', 'inv-item', it.svg + `<span class="tip">${it.name}</span>`);
      d.dataset.id = id;
      hudInv.appendChild(d);
    });
  }
  G.renderInv = renderInv;
  G.addItem = function (id) {
    if (G.state.inv.includes(id)) return;
    G.state.inv.push(id); renderInv();
    const d = hudInv.querySelector(`[data-id="${id}"]`); if (d) d.classList.add('new');
    G.sfx.pickup();
    G.toast('獲得：' + G.ITEMS[id].name);
  };
  G.hasItem = (id) => G.state.inv.includes(id);
  G.removeItem = function (id) { G.state.inv = G.state.inv.filter(x => x !== id); renderInv(); };

  /* ---------- hint & sound buttons ---------- */
  G.revealHotspots = function () {
    const hs = stage.querySelectorAll('.hs, .ext-hs');
    hs.forEach(h => h.classList.add('reveal'));
    setTimeout(() => hs.forEach(h => h.classList.remove('reveal')), 2200);
  };
  $('#btn-hint').addEventListener('click', (e) => { e.stopPropagation(); G.revealHotspots(); });
  const btnSound = $('#btn-sound');
  function syncSound() { btnSound.classList.toggle('off', AudioSys.isMuted()); }
  btnSound.addEventListener('click', (e) => {
    e.stopPropagation(); AudioSys.setMuted(!AudioSys.isMuted()); syncSound();
    try { localStorage.setItem('cheaphouse.muted', AudioSys.isMuted() ? '1' : ''); } catch (err) {}
  });
  try { if (localStorage.getItem('cheaphouse.muted')) AudioSys.setMuted(true); } catch (err) {}
  syncSound();

  /* ---------- keyboard ---------- */
  G.keyHandler = null;
  window.addEventListener('keydown', (e) => {
    if (G.dialogOpen) {
      if ([' ', 'Enter', 'z', 'Z'].includes(e.key)) { e.preventDefault(); advanceFn && advanceFn(); }
      return;
    }
    if (e.key === 'h' || e.key === 'H') { G.revealHotspots(); return; }
    if (e.key === 'm' || e.key === 'M') { btnSound.click(); return; }
    if (G.keyHandler) G.keyHandler(e);
  });

  /* ---------- grain ---------- */
  (function grain() {
    const c = $('#grain'), x = c.getContext('2d'), img = x.createImageData(c.width, c.height);
    setInterval(() => {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      x.putImageData(img, 0, 0);
    }, 90);
  })();

  /* ---------- save ---------- */
  G.save = function (cp) {
    try { localStorage.setItem('cheaphouse.save', JSON.stringify({ cp, state: G.state })); } catch (e) {}
  };
  G.loadSave = function () {
    try { const s = JSON.parse(localStorage.getItem('cheaphouse.save') || 'null'); return s && s.cp ? s : null; } catch (e) { return null; }
  };
  G.clearSave = function () { try { localStorage.removeItem('cheaphouse.save'); } catch (e) {} };

  /* ---------- ambient scares while exploring ---------- */
  let ambTimer = null;
  G.ambient = function (on) {
    clearTimeout(ambTimer);
    if (!on) return;
    const next = () => {
      ambTimer = setTimeout(() => {
        if (!G.dialogOpen && !G.busy) {
          const r = Math.random();
          if (r < .35) G.sfx.creak(0.35, 1.4);
          else if (r < .6) G.sfx.whisper(0.18);
          else if (r < .8) G.sfx.step(1);
          else G.sfx.drip(0.25, Math.random() * 2 - 1);
        }
        next();
      }, 22000 + Math.random() * 26000);
    };
    next();
  };

  /* ---------- photo scenes ---------- */
  const ARROWS = { left: '◀', right: '▶', up: '▲', down: '▼', action: '' };
  G.photo = function (def) {
    return Object.assign({}, def, {
      mount(st) {
        const scr = G.el('div', 'screen photo-scene enter');
        const bg = G.el('div', 'bgblur'); bg.style.backgroundImage = `url(assets/${def.img}.jpg)`;
        const wrap = G.el('div', 'photo-wrap');
        wrap.style.setProperty('--ar', def.ar || 1);
        wrap.style.setProperty('--grade', typeof def.grade === 'function' ? def.grade() : (def.grade || G.GRADE.dusk));
        const img = new Image(); img.src = `assets/${def.img}.jpg`; img.draggable = false; img.alt = def.title || '';
        wrap.appendChild(img);
        const tintVal = typeof def.tint === 'function' ? def.tint() : def.tint;
        if (tintVal) { const t = G.el('div', 'tint'); t.style.background = tintVal; if (def.tintBlend) t.style.mixBlendMode = def.tintBlend; wrap.appendChild(t); }
        const hs = typeof def.hotspots === 'function' ? def.hotspots() : (def.hotspots || []);
        hs.forEach(h => {
          if (h.show && !h.show()) return;
          const d = G.el('div', 'hs' + (h.go || h.goFn ? ' go' : ''), `<span class="lbl">${h.label}</span>`);
          const [x, y, w, hh] = h.r;
          Object.assign(d.style, { left: x + '%', top: y + '%', width: w + '%', height: hh + '%' });
          if (G.state.seen[def.id + ':' + h.id] && !h.go) d.classList.add('seen');
          d.addEventListener('click', (e) => { e.stopPropagation(); if (G.locked()) return; G.hotspot(def, h, d); });
          wrap.appendChild(d);
        });
        scr.append(bg, wrap);
        if (def.decorate) def.decorate(wrap, scr);
        const navs = typeof def.nav === 'function' ? def.nav() : (def.nav || []);
        const keymap = {};
        navs.forEach(n => {
          if (n.show && !n.show()) return;
          const b = G.el('button', 'nav ' + n.dir, `<span class="arr">${ARROWS[n.dir] || ''}</span><span>${n.label}</span>`);
          const act = () => { if (G.locked()) return; G.sfx.step(2); if (n.fn) n.fn(); else G.go(n.to); };
          b.addEventListener('click', (e) => { e.stopPropagation(); act(); });
          scr.appendChild(b);
          keymap[{ left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' }[n.dir]] = act;
        });
        G.keyHandler = (e) => { if (keymap[e.key]) { e.preventDefault(); keymap[e.key](); } };
        st.appendChild(scr);
        G.setLoc(def.title); G.hud(true);
        G.ambient(!!def.ambient);
      },
      async after(first) {
        if (def.onEnter) await def.onEnter(first);
        else if (first && def.enter) await G.say(def.enter);
      },
      unmount() { G.keyHandler = null; G.ambient(false); if (def.onLeave) def.onLeave(); }
    });
  };
  G.hotspot = async function (def, h, d) {
    const key = def.id + ':' + h.id;
    const first = !G.state.seen[key];
    if (first && !h.go) { G.state.seen[key] = true; G.state.examined++; }
    if (!h.go) d.classList.add('seen');
    if (h.go) { G.sfx.step(2); return G.go(h.go); }
    if (h.goFn) return h.goFn();
    if (h.sfx) h.sfx();
    if (h.fn) return h.fn({ first, el: d });
    if (h.lines) return G.say(typeof h.lines === 'function' ? h.lines(first) : h.lines);
  };
  G.refresh = function () {
    if (!G.cur) return;
    if (G.cur.unmount) G.cur.unmount();
    stage.innerHTML = '';
    G.cur.mount(stage);
    const scr = stage.querySelector('.photo-scene'); if (scr) scr.classList.remove('enter');
  };
})();
