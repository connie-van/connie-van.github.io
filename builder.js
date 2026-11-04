// Avatar builder: draws the avatar from stacked layers and runs the tabs, tiles and Colors tab.
// All the content (traits, colors, defaults) lives in traits.js.
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const root = document.documentElement;
  const CATS = TABS.map(t => t[0]).filter(k => k !== 'colors');
  const TAB_LIST = HIDE_EMPTY_TABS ? TABS.filter(t => t[0] === 'colors' || t[0] === 'outfits' || TRAITS[t[0]].length) : TABS;
  const LABEL = {}; TABS.forEach(t => { LABEL[t[0]] = t[1]; });
  const PALETTE = ['#FF9EC4', '#FFD84D', '#7FE0B0', '#7CC4FF', '#C3A6FF', '#C8F169', '#FFA43A', '#FFF1D6', '#8E9BFF', '#FF6B4A'];
  const PENCIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-5L16.5 3.5a2.1 2.1 0 013 3L8 18l-4 2z" fill="#fff" stroke="#14110F" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  const state = { tab: TAB_LIST[0][0], sel: Object.assign({}, DEFAULT_SEL), colors: {} };
  const card = $('#card'), tabs = $('#tabs'), panel = $('#panel'), titleEl = $('#title'), countEl = $('#count');

  const find = (cat, id) => (id ? TRAITS[cat].find(i => i.id === id) || null : null);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad2 = n => (n < 10 ? '0' : '') + n;

  // ---------- selection rules ----------
  // An outfit is a preset: it fills several slots at once. Every other category holds one item (or none).
  const outfitOn = (sel, it) => Object.keys(it.sets).every(c => sel[c] === it.sets[c]);
  function withSel(sel, cat, id) {
    const s = Object.assign({}, sel);
    if (cat === 'outfits') {
      const it = find('outfits', id);
      if (it) Object.keys(it.sets).forEach(c => { s[c] = it.sets[c]; });
    } else s[cat] = id;
    return s;
  }
  function clearOutfit(sel, it) {                  // tapping a worn outfit takes its clothes off (the background stays)
    const s = Object.assign({}, sel);
    Object.keys(it.sets).forEach(c => { if (c !== 'backgrounds') s[c] = null; });
    return s;
  }
  // the clothes part of an outfit (everything except its background), as a selection
  function outfitLook(it) {
    const s = {};
    Object.keys(it.sets).forEach(c => { if (c !== 'backgrounds') s[c] = it.sets[c]; });
    return s;
  }

  // ---------- drawing ----------
  const VB = () => '0 0 ' + CANVAS.w + ' ' + CANVAS.h;
  function layerHtml(l, z) {
    const cls = 'layer' + (l.fit === 'cover' ? ' cover' : '');
    const st = 'z-index:' + (l.z != null ? l.z : z);
    if (l.svg) return '<svg class="' + cls + '" viewBox="' + (l.vb || VB()) + '" style="' + st + '" aria-hidden="true">' + l.svg + '</svg>';
    if (l.tint) return '<div class="' + cls + ' tint" style="' + st + ';--m:url(' + esc(l.src) + ');background:var(--' + l.tint + ')"></div>';
    return '<img class="' + cls + '" src="' + esc(l.src) + '" alt="" draggable="false" style="' + st + '">';
  }
  // all the layers of a look, as html (no wrapper)
  function layersInner(sel, opt) {
    opt = opt || {};
    const out = [];
    const add = (layers, z) => layers.forEach(l => out.push(layerHtml(l, z)));
    const bg = find('backgrounds', sel.backgrounds);
    if (opt.bgOnly) { if (bg) add(bg.layers, CATEGORY_Z.backgrounds); return out.join(''); }
    if (!opt.noBg && bg) add(bg.layers, CATEGORY_Z.backgrounds);
    CATS.forEach(cat => {
      if (cat === 'backgrounds' || cat === 'outfits') return;
      const it = find(cat, sel[cat]);
      if (it) add(it.layers, CATEGORY_Z[cat]);
    });
    return out.join('');
  }
  const avatarHtml = (sel, opt) => '<div class="avatar">' + layersInner(sel, opt) + '</div>';
  // a single trait on its own
  const itemInner = (cat, it) => it.layers.map(l => layerHtml(l, CATEGORY_Z[cat])).join('');

  // shows only the `crop` part of the canvas (crop = fractions of the canvas), scaled to fit the tile
  function viewHtml(inner, crop) {
    const c = crop || { x0: 0, y0: 0, x1: 1, y1: 1 };
    const cw = c.x1 - c.x0, ch = c.y1 - c.y0;
    const R = (cw * CANVAS.w) / (ch * CANVAS.h);
    return '<div class="view" style="' + (R >= 1 ? 'width:100%' : 'height:100%') + ';aspect-ratio:' + R.toFixed(4) + '">' +
      '<div class="avatar" style="inset:auto;width:' + (100 / cw).toFixed(3) + '%;height:' + (100 / ch).toFixed(3) + '%;left:' + (-c.x0 / cw * 100).toFixed(3) + '%;top:' + (-c.y0 / ch * 100).toFixed(3) + '%">' + inner + '</div></div>';
  }

  // which color groups actually change something in the current look
  function usedGroups(sel) {
    const used = {};
    CATS.forEach(cat => {
      if (cat === 'outfits') return;
      const it = find(cat, sel[cat]);
      if (!it) return;
      it.layers.forEach(l => {
        if (l.tint) used[l.tint] = true;
        if (l.svg) (l.svg.match(/var\(--\w+\)/g) || []).forEach(m => { used[m.slice(6, -1)] = true; });
      });
    });
    return used;
  }

  // ---------- cropping the selection tiles ----------
  // Each trait's tile zooms in on that trait. The crop is worked out from the artwork itself (the box around what is drawn).
  // On Tops and Bottoms only the biggest connected piece counts, so a floating detail (like the pillow in the bottoms file)
  // doesn't stretch the crop. It still shows on the live character. Set `crop:[left, top, right, bottom]` (in CANVAS units) on an
  // item in traits.js to choose the crop by hand.
  const RW = 190, RH = 300;                        // the artwork is looked at in this small size
  function cropFromAlpha(a, w, h, mainOnly) {
    const on = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) on[i] = a[i] > 24 ? 1 : 0;
    let keep = on;
    if (mainOnly) {
      const R = 2, dil = new Uint8Array(w * h), tmp = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let k = -R; k <= R && !v; k++) { const xx = x + k; if (xx >= 0 && xx < w && on[y * w + xx]) v = 1; } tmp[y * w + x] = v; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let k = -R; k <= R && !v; k++) { const yy = y + k; if (yy >= 0 && yy < h && tmp[yy * w + x]) v = 1; } dil[y * w + x] = v; }
      const lab = new Int32Array(w * h); let n = 0; const size = [0];
      for (let s = 0; s < w * h; s++) {
        if (!dil[s] || lab[s]) continue;
        n++; size.push(0); const stack = [s]; lab[s] = n;
        while (stack.length) {
          const p = stack.pop(), px = p % w, py = (p / w) | 0;
          if (on[p]) size[n]++;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = px + dx, ny = py + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const q = ny * w + nx;
            if (dil[q] && !lab[q]) { lab[q] = n; stack.push(q); }
          }
        }
      }
      let best = 1; for (let i = 2; i <= n; i++) if (size[i] > size[best]) best = i;
      keep = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) keep[i] = on[i] && lab[i] === best ? 1 : 0;
    }
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (keep[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    const m = 0.012;                                // a little breathing room
    return { x0: Math.max(0, x0 / w - m), y0: Math.max(0, y0 / h - m), x1: Math.min(1, (x1 + 1) / w + m), y1: Math.min(1, (y1 + 1) / h + m) };
  }
  function layerImage(l) {
    return new Promise(res => {
      const im = new Image();
      let done = false;
      const fin = v => { if (!done) { done = true; res(v); } };
      im.onload = () => fin(im);
      im.onerror = () => fin(null);
      setTimeout(() => fin(null), 5000);          // never let a slow image hold the builder up
      if (l.svg) im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (l.vb || VB()) + '" width="' + RW + '" height="' + RH + '">' + l.svg.replace(/var\(--\w+\)/g, '#000') + '</svg>');
      else im.src = l.src;
    });
  }
  function itemAlpha(it) {
    const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
    const ctx = cv.getContext('2d');
    return Promise.all(it.layers.map(layerImage)).then(imgs => {
      imgs.forEach(im => { if (im) ctx.drawImage(im, 0, 0, RW, RH); });
      const d = ctx.getImageData(0, 0, RW, RH).data, a = new Uint8Array(RW * RH);
      for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
      return a;
    });
  }
  const unionCrop = list => list.reduce((u, c) => (u ? { x0: Math.min(u.x0, c.x0), y0: Math.min(u.y0, c.y0), x1: Math.max(u.x1, c.x1), y1: Math.max(u.y1, c.y1) } : c), null);
  function computeCrops() {
    const jobs = [];
    CATS.forEach(cat => {
      if (cat === 'outfits' || cat === 'backgrounds') return;
      TRAITS[cat].forEach(it => {
        if (it.crop) { it.cropF = { x0: it.crop[0] / CANVAS.w, y0: it.crop[1] / CANVAS.h, x1: it.crop[2] / CANVAS.w, y1: it.crop[3] / CANVAS.h }; return; }
        jobs.push(Promise.resolve().then(() => itemAlpha(it)).then(a => { it.cropF = cropFromAlpha(a, RW, RH, cat === 'tops' || cat === 'bottoms'); }).catch(() => { it.cropF = null; }));   // if this fails the tile just shows the whole canvas
      });
    });
    return Promise.all(jobs).then(() => {
      TRAITS.outfits.forEach(o => {                // an outfit's crop is the box around all of its parts
        const parts = Object.keys(o.sets).filter(c => c !== 'backgrounds').map(c => { const it = find(c, o.sets[c]); return it && it.cropF; }).filter(Boolean);
        o.cropF = unionCrop(parts);
      });
    });
  }

  // ---------- tabs and heading ----------
  function renderTabs() {
    tabs.innerHTML = TAB_LIST.map(t => '<button class="tab" role="tab" id="tab-' + t[0] + '" data-tab="' + t[0] + '" aria-selected="' + (state.tab === t[0]) + '" tabindex="' + (state.tab === t[0] ? 0 : -1) + '">' + t[1] + '</button>').join('');
  }
  function renderHead() {
    const k = state.tab;
    titleEl.textContent = LABEL[k];
    if (k === 'colors') countEl.textContent = 'Pick any color';
    else if (!TRAITS[k].length) countEl.textContent = 'Coming soon';
    else countEl.textContent = pad2(TRAITS[k].length) + (TRAITS[k].length === 1 ? ' item' : ' items');
  }
  function setTab(k) {
    state.tab = k;
    renderTabs();
    renderHead();
    renderPanel();
    panel.scrollTop = 0;
    panel.setAttribute('aria-labelledby', 'tab-' + k);
  }
  tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.tab); });
  tabs.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const keys = TAB_LIST.map(t => t[0]);
    const i = keys.indexOf(state.tab);
    setTab(keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length]);
    tabs.querySelector('[aria-selected="true"]').focus();
  });

  // ---------- trait tiles ----------
  //  Outfits:      the whole fit, no background, cropped around the figure
  //  Backgrounds:  the background filling the tile
  //  Everything else: only that trait, cropped in on it
  function tile(cat, it, idx) {
    const id = it ? it.id : null;
    const on = cat === 'outfits' ? !!(it && outfitOn(state.sel, it)) : state.sel[cat] === id;
    const name = it ? it.name : 'None';
    let thumb = '', cls = 'tile';
    if (!it) cls += ' none';
    else if (cat === 'backgrounds') { thumb = '<div class="thumb"><div class="avatar">' + layersInner(withSel(state.sel, cat, id), { bgOnly: true }) + '</div></div>'; cls += ' bgtile'; }
    else if (cat === 'outfits') thumb = '<div class="thumb iso">' + viewHtml(layersInner(outfitLook(it), { noBg: true }), it.cropF) + '</div>';
    else thumb = '<div class="thumb iso">' + viewHtml(itemInner(cat, it), it.cropF) + '</div>';
    const color = it ? PALETTE[idx % PALETTE.length] : 'transparent';
    return '<button class="' + cls + (on ? ' on' : '') + '" style="--tc:' + color + '" data-id="' + (id || '') + '" aria-pressed="' + on + '" aria-label="' + esc(name) + '" title="' + esc(name) + '">' +
      thumb + (it ? '' : '<span class="nlabel">None</span>') + '</button>';
  }
  function renderGrid() {
    const cat = state.tab;
    if (!TRAITS[cat].length) { panel.innerHTML = '<p class="empty"><span class="star" aria-hidden="true">\u2736</span> Nothing in ' + esc(LABEL[cat]) + ' yet</p>'; return; }
    let html = '<div class="grid">';
    if (cat !== 'backgrounds' && cat !== 'outfits') html += tile(cat, null, 0);
    TRAITS[cat].forEach((it, i) => { html += tile(cat, it, i); });
    panel.innerHTML = html + '</div>';
  }
  panel.addEventListener('click', e => {
    const b = e.target.closest('.tile');
    if (b) {
      const cat = state.tab;
      const id = b.dataset.id || null;
      if (cat === 'outfits') {
        const it = find('outfits', id);
        state.sel = outfitOn(state.sel, it) ? clearOutfit(state.sel, it) : withSel(state.sel, cat, id);
      } else {
        let pick = id;
        if (pick && state.sel[cat] === pick && cat !== 'backgrounds') pick = null;   // tap the selected tile again to take it off
        state.sel = withSel(state.sel, cat, pick);
      }
      render();
      return;
    }
    const sw = e.target.closest('.sw[data-c]');
    if (sw) { setColor(sw.closest('.cg').dataset.key, sw.dataset.c); return; }
    const rs = e.target.closest('[data-reset]');
    if (rs) { const k = rs.closest('.cg').dataset.key; setColor(k, COLOR_GROUPS.find(g => g.key === k).def); }
  });

  // ---------- colors tab ----------
  function renderColors() {
    const used = usedGroups(state.sel);
    panel.innerHTML = COLOR_GROUPS.map(g =>
      '<section class="cg' + (used[g.key] ? '' : ' idle') + '" data-key="' + g.key + '"><div class="cgh"><h3 class="sqw"><span>' + g.label + '</span></h3>' +
      (used[g.key] ? '' : '<span class="note">Nothing to color in this look</span>') + '</div><div class="sw-row">' +
      '<label class="sw custom" title="Pick any color"><input type="color" value="' + state.colors[g.key].toLowerCase() + '" aria-label="Custom ' + g.label + ' color">' + PENCIL + '</label>' +
      g.presets.map(c => '<button class="sw" data-c="' + c + '" style="background:' + c + '" aria-label="' + g.label + ' ' + c + '"></button>').join('') +
      '<button class="reset" data-reset>Reset</button></div></section>').join('');
    updateRings();
  }
  function setColor(key, val) {
    state.colors[key] = val;
    root.style.setProperty('--' + key, val);
    updateRings();
  }
  function updateRings() {
    panel.querySelectorAll('.cg').forEach(sec => {
      const cur = state.colors[sec.dataset.key].toLowerCase();
      let hit = false;
      sec.querySelectorAll('.sw[data-c]').forEach(b => { const m = b.dataset.c.toLowerCase() === cur; if (m) hit = true; b.classList.toggle('on', m); });
      const custom = sec.querySelector('.custom');
      custom.classList.toggle('on', !hit);
      const inp = custom.querySelector('input');
      if (inp.value !== cur) inp.value = cur;
    });
  }
  panel.addEventListener('input', e => {
    if (e.target.type === 'color') setColor(e.target.closest('.cg').dataset.key, e.target.value);
  });

  // ---------- put it together ----------
  function renderPanel() { if (state.tab === 'colors') renderColors(); else renderGrid(); }
  function render() {
    card.innerHTML = avatarHtml(state.sel);
    renderPanel();
  }
  function applyColors() { COLOR_GROUPS.forEach(g => root.style.setProperty('--' + g.key, state.colors[g.key])); }

  function resetAll() {
    state.sel = Object.assign({}, DEFAULT_SEL);
    COLOR_GROUPS.forEach(g => { state.colors[g.key] = g.def; });
    applyColors();
    render();
  }
  function shuffle() {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const s = {};
    CATS.forEach(cat => {
      if (cat === 'outfits') return;
      const items = TRAITS[cat];
      s[cat] = !items.length ? null : (cat === 'backgrounds' || Math.random() > 0.25) ? pick(items).id : null;
    });
    state.sel = s;
    COLOR_GROUPS.forEach(g => { state.colors[g.key] = pick(g.presets); });
    applyColors();
    render();
  }
  $('#shuffle').addEventListener('click', shuffle);
  $('#resetAll').addEventListener('click', resetAll);

  // ---------- reading combined SVG exports ----------
  // A combined SVG is a flat color shape (painted in a marker color) plus the art image on top. The marker colors
  // become the Body / Eyes / Hair colors; the art image is drawn above them.
  const MARKERS = { lime: 'body', '#0f0': 'body', '#00ff00': 'body', yellow: 'eyes', '#ff0': 'eyes', '#ffff00': 'eyes', blue: 'hair', '#00f': 'hair', '#0000ff': 'hair' };
  function dataUriToUrl(uri) {
    try {
      const m = /^data:([^;,]+);base64,(.*)$/.exec(uri);
      if (!m || !window.URL || !URL.createObjectURL) return uri;
      const bin = atob(m[2]), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: m[1] }));
    } catch (e) { return uri; }
  }
  function shapeMarkup(el, css) {
    const cls = (el.getAttribute('class') || '').split(/\s+/);
    let color = null;
    cls.forEach(c => { if (css[c]) color = css[c]; });
    if (!color && el.getAttribute('fill')) color = el.getAttribute('fill').trim().toLowerCase();
    const attrs = [];
    Array.prototype.forEach.call(el.attributes, a => { if (['class', 'fill', 'style'].indexOf(a.name) < 0) attrs.push(a.name + '="' + esc(a.value) + '"'); });
    const group = color && MARKERS[color];
    const fillCss = group ? 'fill:var(--' + group + ')' : (color ? 'fill:' + color : '');
    return '<' + el.localName + ' ' + attrs.join(' ') + (fillCss ? ' style="' + fillCss + '"' : '') + '/>';
  }
  function expandSvg(text, extra) {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('not a valid SVG');
    const rootEl = doc.documentElement;
    const vb = rootEl.getAttribute('viewBox') || VB();
    const css = {};
    Array.prototype.forEach.call(doc.getElementsByTagName('style'), st => {
      String(st.textContent).replace(/\.([\w-]+)\s*\{([^}]*)\}/g, (m, c, body) => { const f = /fill\s*:\s*([^;}]+)/i.exec(body); if (f) css[c] = f[1].trim().toLowerCase(); return m; });
    });
    const out = []; let shapes = [];
    const flush = () => { if (shapes.length) { out.push(Object.assign({ svg: shapes.join(''), vb: vb }, extra)); shapes = []; } };
    Array.prototype.forEach.call(rootEl.children, el => {
      const tag = el.localName;
      if (tag === 'defs' || tag === 'style' || tag === 'title' || tag === 'desc') return;
      if (tag === 'image') {
        const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (href) { flush(); out.push(Object.assign({ src: dataUriToUrl(href) }, extra)); }
        return;
      }
      shapes.push(shapeMarkup(el, css));
    });
    flush();
    return out;
  }
  function loadArt() {
    const jobs = [], found = [];
    Object.keys(TRAITS).forEach(cat => TRAITS[cat].forEach(it => {
      (it.layers || []).forEach((l, i) => {
        if (!l.svgSrc) return;
        jobs.push(fetch(l.svgSrc).then(r => { if (!r.ok) throw new Error(l.svgSrc + ' (' + r.status + ')'); return r.text(); })
          .then(t => { found.push([it, i, expandSvg(t, l.z != null ? { z: l.z } : {})]); }));
      });
    }));
    return Promise.all(jobs).then(() => {
      const byItem = new Map();
      found.forEach(f => { if (!byItem.has(f[0])) byItem.set(f[0], {}); byItem.get(f[0])[f[1]] = f[2]; });
      byItem.forEach((map, it) => { it.layers = [].concat.apply([], it.layers.map((l, i) => (map[i] ? map[i] : [l]))); });
    });
  }

  // ---------- start ----------
  function start() {
    // load every image once up front so picking a trait doesn't flash while it loads
    Object.keys(TRAITS).forEach(cat => TRAITS[cat].forEach(it => (it.layers || []).forEach(l => { if (l.src) new Image().src = l.src; })));
    COLOR_GROUPS.forEach(g => { state.colors[g.key] = g.def; });
    applyColors();
    renderTabs();
    renderHead();
    render();
  }
  card.innerHTML = '<p class="empty">Loading\u2026</p>';
  renderTabs();
  loadArt().then(computeCrops).then(start).catch(err => {
    console.error(err);
    card.innerHTML = '<p class="empty">Couldn\u2019t load the artwork. Open this page from the website, not as a file on your computer.</p>';
  });
})();
