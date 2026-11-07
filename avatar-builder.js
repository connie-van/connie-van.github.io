// Avatar builder: draws the avatar from stacked layers and runs the panels, tiles and color picker.
// All the content (traits, colors, defaults) lives in avatar-traits.js.
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const root = document.documentElement;
  const CATS = TABS.map(t => t[0]).filter(k => k !== 'colors');
  const LABEL = {}; TABS.forEach(t => { LABEL[t[0]] = t[1]; });
  const tabsOf = s => TABS.filter(t => t[2] === s && (!HIDE_EMPTY_TABS || t[0] === 'colors' || t[0] === 'outfits' || TRAITS[t[0]].length));
  const isRequired = cat => REQUIRED.indexOf(cat) >= 0;
  const SAVE_KEY = 'avatarBuilder.savedColors';

  const state = {
    tab: { left: 'outfits', right: 'hats' },
    sel: Object.assign({}, DEFAULT_SEL),
    colors: {},                                   // skin / eyes / hair
    bg: Object.assign({ stop: 0 }, DEFAULT_BG),   // background color (used when no background image is on)
    target: 'body',                               // what the color picker is editing: body | eyes | hair | bg
    hsv: { h: 0, s: 0, v: 0 },
    chosen: { body: false, eyes: false, hair: false },   // true once the visitor has picked a color themselves (not from an outfit)
    saved: []
  };
  const card = $('#card');

  const find = (cat, id) => (id ? TRAITS[cat].find(i => i.id === id) || null : null);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // ---------- color math ----------
  function normHex(s) {
    s = String(s).trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) s = s.replace(/./g, c => c + c);
    return /^[0-9a-f]{6}$/i.test(s) ? '#' + s.toUpperCase() : null;
  }
  const hexToRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; if (h < 0) h += 1; }
    return { h: h, s: mx ? d / mx : 0, v: mx };
  }
  function hsvToRgb(h, s, v) {
    const i = Math.floor(h * 6) % 6, f = h * 6 - Math.floor(h * 6), p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    const c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i];
    return [Math.round(c[0] * 255), Math.round(c[1] * 255), Math.round(c[2] * 255)];
  }
  const rgbToHex = c => '#' + c.map(n => (n < 16 ? '0' : '') + n.toString(16)).join('').toUpperCase();
  const hsvToHex = o => rgbToHex(hsvToRgb(o.h, o.s, o.v));
  function hsvFromHex(hex, keepHue) {
    const c = hexToRgb(hex), n = rgbToHsv(c[0], c[1], c[2]);
    return { h: (n.s === 0 || n.v === 0) ? keepHue : n.h, s: n.s, v: n.v };    // keep the hue when there is none to read (grays, black)
  }

  // ---------- saved colors (kept in the visitor's browser) ----------
  function loadSaved() {
    try {
      const a = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]');
      return (Array.isArray(a) ? a : []).map(normHex).filter(Boolean).slice(0, SAVED_SLOTS);
    } catch (e) { return []; }
  }
  function persistSaved() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state.saved)); } catch (e) { /* private mode: it just won't be remembered */ } }

  // ---------- selection rules ----------
  // An outfit is a preset: it fills several slots at once. Every other category holds one item (or none, if it's optional).
  const outfitOn = (sel, it) => Object.keys(it.sets).every(c => sel[c] === it.sets[c]);
  const outfitLook = it => Object.assign({}, it.sets);
  // wearing an outfit: it fills its slots, and takes off any OPTIONAL piece (hair, hat, accessories) it doesn't include, so the avatar matches the outfit.
  // A required slot it doesn't include (say a set with no bottoms) keeps what is already on.
  const OPTIONAL = CATS.filter(c => c !== 'outfits' && c !== 'backgrounds' && REQUIRED.indexOf(c) < 0);
  function applyOutfit(sel, it) { const s = Object.assign({}, sel); OPTIONAL.forEach(c => { s[c] = null; }); Object.keys(it.sets).forEach(c => { s[c] = it.sets[c]; }); return s; }
  // the background: a background image wins; otherwise the solid/gradient/none color mode
  const bgMode = () => (state.sel.backgrounds ? 'art' : state.bg.mode);
  function bgCss() {
    if (state.sel.backgrounds) return '';
    if (state.bg.mode === 'solid') return state.bg.c1;
    if (state.bg.mode === 'gradient') return 'linear-gradient(to bottom,' + state.bg.c1 + ',' + state.bg.c2 + ')';
    return '';
  }
  // the avatar's background (a picture, a solid color or a gradient) shows with rounded corners; with no background there is nothing to round
  const applyBg = () => { card.style.background = bgCss(); card.classList.toggle('rounded', bgMode() !== 'none'); };

  // picking an outfit also brings its set's original colors and its paired background (when the set has one)
  // "chosen" colors: trait tiles show their set's original colors until the visitor picks a color of their own
  // (the <html> element gets a c-body / c-eyes / c-hair class, and the CSS does the rest)
  const markChosen = k => { state.chosen[k] = true; root.classList.add('c-' + k); };
  const clearChosen = k => { state.chosen[k] = false; root.classList.remove('c-' + k); };
  function wearSet(it) {
    const set = SETS[it.set]; if (!set) return;
    if (set.background && find('backgrounds', set.background)) state.sel.backgrounds = set.background;
    Object.keys(set.colors || {}).forEach(k => { const c = normHex(set.colors[k]); if (c) { state.colors[k] = c; root.style.setProperty('--' + k, c); clearChosen(k); } });
  }
  // the Outfits tab always shows a fit in its set's original colors, whatever the visitor has customized.
  // Every other trait tile does the same, until the visitor picks a color of their own (an item can opt out with  originalInMenu: false  in avatar-traits.js).
  // The avatar itself always follows the colors the visitor picks..
  function ogTile(it) { const c = (SETS[it.set] && SETS[it.set].colors) || {}, ks = Object.keys(c); return { cls: ks.map(k => ' og og-' + k).join(''), style: ks.map(k => '--og-' + k + ':' + c[k]).join(';') }; }
  function outfitVars(it) { const c = (SETS[it.set] && SETS[it.set].colors) || {}; return Object.keys(c).map(k => '--' + k + ':' + c[k]).join(';'); }
  function pick(cat, id) {
    if (cat === 'outfits') { const it = find('outfits', id); state.sel = applyOutfit(state.sel, it); wearSet(it); return; }
    if (cat === 'backgrounds') {
      if (id) state.sel.backgrounds = id;
      else { state.sel.backgrounds = null; state.bg.mode = 'none'; }          // None = transparent
      return;
    }
    if (!id) { if (!isRequired(cat)) state.sel[cat] = null; return; }
    state.sel[cat] = (state.sel[cat] === id && !isRequired(cat)) ? null : id;   // tap a selected optional trait again to take it off
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
  function layersInner(sel, opt) {
    opt = opt || {};
    const out = [];
    const add = (layers, z) => layers.forEach(l => out.push(layerHtml(l, z)));
    const bg = find('backgrounds', sel.backgrounds);
    if (opt.bgOnly) { if (bg) add(bg.layers, CATEGORY_Z.backgrounds); return out.join(''); }
    if (!opt.noBg && bg) add(bg.layers, CATEGORY_Z.backgrounds);
    // the ground shadow (SHADOW in avatar-traits.js): always on, just in front of the background, behind every trait
    if (!opt.noBg && typeof SHADOW !== 'undefined' && SHADOW) out.push('<svg class="layer shadow" viewBox="0 0 ' + CANVAS.w + ' ' + CANVAS.h + '" style="z-index:' + (CATEGORY_Z.backgrounds + 1) + '" aria-hidden="true"><ellipse cx="' + SHADOW.cx + '" cy="' + SHADOW.cy + '" rx="' + SHADOW.rx + '" ry="' + SHADOW.ry + '" fill="' + SHADOW.color + '" fill-opacity="' + SHADOW.opacity + '"/></svg>');
    CATS.forEach(cat => {
      if (cat === 'backgrounds' || cat === 'outfits') return;
      const it = find(cat, sel[cat]);
      if (it) add(it.layers, CATEGORY_Z[cat]);
    });
    return out.join('');
  }
  const avatarHtml = (sel, opt) => '<div class="avatar">' + layersInner(sel, opt) + '</div>';
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
  // item in avatar-traits.js to choose the crop by hand.
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
        jobs.push(Promise.resolve().then(() => itemAlpha(it)).then(a => { it.cropF = cropFromAlpha(a, RW, RH, (cat === 'tops' || cat === 'bottoms') && !it.fullTile); }).catch(() => { it.cropF = null; }));   // if this fails the tile just shows the whole canvas
      });
    });
    return Promise.all(jobs).then(() => {
      TRAITS.outfits.forEach(o => {                // an outfit's crop is the box around all of its parts
        const parts = Object.keys(o.sets).map(c => { const it = find(c, o.sets[c]); return it && it.cropF; }).filter(Boolean);
        o.cropF = unionCrop(parts);
      });
    });
  }

  // ---------- panels: tabs and trait tiles ----------
  function renderTabs(s) {
    $('#tabs-' + s).innerHTML = tabsOf(s).map(t =>
      '<button class="tab" role="tab" data-side="' + s + '" data-tab="' + t[0] + '" aria-selected="' + (state.tab[s] === t[0]) + '" tabindex="' + (state.tab[s] === t[0] ? 0 : -1) + '">' + t[1] + '</button>').join('');
  }
  function tile(cat, it, idx) {
    const id = it ? it.id : null;
    let on;
    if (cat === 'outfits') on = !!(it && outfitOn(state.sel, it));
    else if (cat === 'backgrounds') on = it ? state.sel.backgrounds === id : bgMode() === 'none';
    else on = state.sel[cat] === id;
    const name = it ? it.name : 'None';
    let thumb = '', cls = 'tile';
    if (!it) cls += ' none';
    if (cat === 'backgrounds') {
      cls += ' bg' + (it && it.starLight ? ' lt' : '');
      if (it) thumb = '<div class="thumb"><div class="avatar">' + layersInner({ backgrounds: id }, { bgOnly: true }) + '</div></div>';
    } else if (cat === 'outfits' && it) {
      // the whole look, as on the main display: the set's background with the character placed on it (3:4, like the B.G. tiles)
      const set = SETS[it.set], look = Object.assign(outfitLook(it), { backgrounds: set && set.background ? set.background : null });
      const sbg = set && set.background && find('backgrounds', set.background);
      const collect = !!(set && set.collectible);
      cls += ' bg fit' + (sbg && sbg.starLight ? ' lt' : '') + (collect ? ' collect' : '');
      thumb = '<div class="thumb"><div class="avatar">' + layersInner(look) + '</div></div>' + (collect ? '<span class="holo" aria-hidden="true"></span><span class="shine" aria-hidden="true"></span>' : '');
    } else if (it) {
      thumb = '<div class="thumb iso">' + viewHtml(cat === 'outfits' ? layersInner(outfitLook(it), { noBg: true }) : itemInner(cat, it), it.cropF) + '</div>';
    }
    let extra = '';
    if (cat === 'outfits' && it) extra = ' style="' + outfitVars(it) + '"';                       // always the set's original colors
    else if (it && cat !== 'backgrounds' && it.originalInMenu !== false) { const o = ogTile(it); cls += o.cls; extra = o.style ? ' style="' + o.style + '"' : ''; }   // original colors until the visitor picks their own
    // tileBg: a backing color for light artwork that would vanish on the paper-colored tile
    if (it && it.tileBg) { const tb = tileBgCss(it); cls += ' dark' + (it.starLight ? ' lt' : ''); extra = extra ? extra.replace(/"$/, ';background:' + tb + '"') : ' style="background:' + tb + '"'; }
    return '<button class="' + cls + (on ? ' on' : '') + '"' + extra + ' data-id="' + (id || '') + '" aria-pressed="' + on + '" aria-label="' + esc(name) + '" title="' + esc(name) + '">' +
      thumb + (it ? '' : '<span class="nlabel">None</span>') + '</button>';
  }
  function renderGrid(body, cat) {
    if (!TRAITS[cat].length) { body.innerHTML = '<p class="empty"><span class="star" aria-hidden="true">\u2736</span>Nothing in ' + esc(LABEL[cat]) + ' yet</p>'; return; }
    let html = '<div class="grid">';
    if (cat !== 'outfits' && !isRequired(cat)) html += tile(cat, null, 0);      // optional traits get a None tile
    TRAITS[cat].forEach((it, i) => { html += tile(cat, it, i); });
    body.innerHTML = html + '</div>';
  }
  function renderSide(s) {
    const list = tabsOf(s);
    if (!list.some(t => t[0] === state.tab[s])) state.tab[s] = list[0][0];
    renderTabs(s);
    const body = $('#body-' + s), k = state.tab[s], keep = body.dataset.tab === k ? body.scrollTop : 0;
    body.classList.toggle('colors', k === 'colors');
    if (k === 'colors') renderColors(body); else renderGrid(body, k);
    body.dataset.tab = k;
    body.scrollTop = keep;                         // picking a tile shouldn't make the panel jump
  }
  function setTab(s, k) { state.tab[s] = k; renderSide(s); $('#body-' + s).scrollTop = 0; }
  ['left', 'right'].forEach(s => {
    const el = $('#tabs-' + s);
    el.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) setTab(s, b.dataset.tab); });
    el.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const keys = tabsOf(s).map(t => t[0]), i = keys.indexOf(state.tab[s]);
      setTab(s, keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length]);
      el.querySelector('[aria-selected="true"]').focus();
    });
    $('#body-' + s).addEventListener('click', onBodyClick);
  });

  function onBodyClick(e) {
    const t = e.target.closest('.tile');
    if (t) { const cat = t.closest('.body').dataset.tab; pick(cat, t.dataset.id || null); renderAll(); return; }
    const tg = e.target.closest('[data-target]');
    if (tg) { state.target = tg.dataset.target; renderSide('right'); return; }
    const md = e.target.closest('[data-mode]');
    if (md) { state.sel.backgrounds = null; state.bg.mode = md.dataset.mode; if (md.dataset.mode !== 'gradient') state.bg.stop = 0; renderAll(); return; }
    const st = e.target.closest('[data-stop]');
    if (st) { state.bg.stop = +st.dataset.stop; renderSide('right'); return; }
    const del = e.target.closest('[data-del]');
    if (del) { state.saved.splice(+del.dataset.del, 1); persistSaved(); renderPalette(); return; }
    const use = e.target.closest('.pal .use');
    if (use) {
      if (use.dataset.c) setColor(use.dataset.c);
      else if (use.dataset.save) saveCurrent();
    }
  }

  // ---------- colors ----------
  function curHex() {
    if (state.target === 'bg') return state.bg.stop === 1 ? state.bg.c2 : state.bg.c1;
    return state.colors[state.target];
  }
  function bgChip() {
    const a = state.sel.backgrounds && find('backgrounds', state.sel.backgrounds);
    if (a) return 'background-image:url(' + esc(a.layers[0].src) + ')';
    if (state.bg.mode === 'solid') return 'background:' + state.bg.c1;
    if (state.bg.mode === 'gradient') return 'background:linear-gradient(to bottom,' + state.bg.c1 + ',' + state.bg.c2 + ')';
    return 'background:transparent';
  }
  function renderColors(body) {
    const used = usedGroups(state.sel), mode = bgMode(), isBg = state.target === 'bg', off = isBg && (mode === 'none' || mode === 'art');
    // keep the picker in step with the color being edited (switching target, etc.)
    if (hsvToHex(state.hsv) !== curHex()) state.hsv = hsvFromHex(curHex(), state.hsv.h);
    // 1. what you're coloring
    const tgs = COLOR_GROUPS.map(g => '<button class="tg' + (state.target === g.key ? ' on' : '') + (used[g.key] ? '' : ' idle') + '" data-target="' + g.key + '"><i class="chip" style="background:var(--' + g.key + ')"></i>' + g.label + '</button>').join('') +
      '<button class="tg' + (isBg ? ' on' : '') + '" data-target="bg"><i class="chip" id="bgchip" style="' + bgChip() + '"></i>B.G.</button>';
    // 2. background modes (background only)
    const modes = !isBg ? '' : '<div class="modes ' + (MODE_STYLE === 'square' ? 'sq' : 'ul') + '">' +
      [['none', 'None'], ['solid', 'Solid'], ['gradient', 'Gradient']].map(m => '<button class="mode' + (mode === m[0] ? ' on' : '') + '" data-mode="' + m[0] + '">' + m[1] + '</button>').join('') + '</div>';
    // 3. the picker
    const picker = '<div class="picker' + (off ? ' dim' : '') + '"><div class="sv" id="sv"><i class="handle" id="handle"></i></div><div class="hue" id="hue"><i class="knob" id="knob"></i></div></div>';
    // 4. the color as a square (two for a gradient), then the hex
    let swatch;
    if (off) swatch = '<i class="swatch"' + (mode === 'art' ? ' style="' + bgChip() + '"' : '') + '></i>';
    else if (isBg && mode === 'gradient') swatch = [state.bg.c1, state.bg.c2].map((c, i) => '<button class="swatch stop' + (state.bg.stop === i ? ' on' : '') + '" data-stop="' + i + '" id="stop' + i + '" style="background:' + c + '" aria-label="Gradient color ' + (i + 1) + '"></button>').join('');
    else swatch = '<i class="swatch" id="swatch"></i>';
    const hex = off ? '' : '<div class="hex" id="hexbox"><span class="hash">#</span><input id="hex" type="text" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Hex color" value="' + curHex().slice(1) + '"></div>';
    body.innerHTML = '<div class="cwrap"><div class="targets">' + tgs + '</div>' + modes + picker + '<div class="hexrow">' + swatch + hex + '</div><div class="palette" id="palette"></div></div>';
    renderPalette();
    bindPicker();
    syncPicker();
  }
  // the palette: 12 presets, then 12 slots for the visitor's own colors (dashed = empty)
  function renderPalette() {
    const p = $('#palette'); if (!p) return;
    const cur = curHex().toUpperCase();
    let html = PALETTE_PRESETS.map(c => '<div class="pal' + (c.toUpperCase() === cur ? ' on' : '') + '"><button class="use" data-c="' + c + '" style="background:' + c + '" aria-label="Use ' + c + '"></button></div>').join('');
    for (let i = 0; i < SAVED_SLOTS; i++) {
      if (i < state.saved.length) {
        const c = state.saved[i];
        html += '<div class="pal saved' + (c.toUpperCase() === cur ? ' on' : '') + '"><button class="use" data-c="' + c + '" style="background:' + c + '" aria-label="Use saved ' + c + '"></button><button class="x" data-del="' + i + '" aria-label="Remove ' + c + '">x</button></div>';
      } else {
        html += '<div class="pal slot"><button class="use" data-save="1" aria-label="Save the current color here">' + (i === state.saved.length ? '+' : '') + '</button></div>';
      }
    }
    p.innerHTML = html;
  }
  function saveCurrent() {
    const hex = curHex().toUpperCase();
    if (state.target === 'bg' && (bgMode() === 'none' || bgMode() === 'art')) return;
    if (state.saved.indexOf(hex) >= 0 || state.saved.length >= SAVED_SLOTS) return;
    state.saved.push(hex); persistSaved(); renderPalette();
  }
  // refresh everything that shows the current color, without rebuilding the panel (so dragging stays smooth)
  function syncPicker() {
    const hex = curHex(), h = state.hsv;
    const sv = $('#sv'), handle = $('#handle'), knob = $('#knob');
    if (sv) sv.style.setProperty('--h', Math.round(h.h * 360));
    if (handle) { handle.style.left = (h.s * 100) + '%'; handle.style.top = ((1 - h.v) * 100) + '%'; handle.style.setProperty('--hc', hex); }
    if (knob) knob.style.left = (h.h * 100) + '%';
    const sw = $('#swatch'); if (sw) sw.style.background = hex;
    const hexEl = $('#hex');
    if (hexEl) { if (document.activeElement !== hexEl) hexEl.value = hex.slice(1); $('#hexbox').classList.remove('bad'); }
    const bc = $('#bgchip'); if (bc) bc.setAttribute('style', bgChip());
    ['stop0', 'stop1'].forEach((id, i) => { const el = $('#' + id); if (el) el.style.background = i ? state.bg.c2 : state.bg.c1; });
    document.querySelectorAll('#palette .pal').forEach(p => { const u = p.querySelector('.use'); if (u && u.dataset.c) p.classList.toggle('on', u.dataset.c.toUpperCase() === hex.toUpperCase()); });
  }
  function setColor(hex, fromHsv) {
    hex = hex.toUpperCase();
    if (!fromHsv) state.hsv = hsvFromHex(hex, state.hsv.h);
    if (state.target === 'bg') {
      const wasOff = bgMode() === 'none' || bgMode() === 'art';
      if (wasOff) { state.sel.backgrounds = null; state.bg.mode = 'solid'; state.bg.stop = 0; }   // picking a color switches the background to a solid color
      state.bg[state.bg.stop === 1 ? 'c2' : 'c1'] = hex;
      applyBg();
      if (wasOff) { renderAll(); return; }
    } else {
      state.colors[state.target] = hex;
      root.style.setProperty('--' + state.target, hex);
      markChosen(state.target);
    }
    syncPicker();
  }
  function bindPicker() {
    const sv = $('#sv'), hue = $('#hue'); if (!sv || !hue) return;
    const drag = (el, fn) => el.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      fn(e);
      const mv = ev => fn(ev), up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
    drag(sv, e => {
      const r = sv.getBoundingClientRect();
      state.hsv.s = clamp((e.clientX - r.left) / r.width, 0, 1);
      state.hsv.v = 1 - clamp((e.clientY - r.top) / r.height, 0, 1);
      setColor(hsvToHex(state.hsv), true);
    });
    drag(hue, e => {
      const r = hue.getBoundingClientRect();
      state.hsv.h = clamp((e.clientX - r.left) / r.width, 0, 0.9999);
      setColor(hsvToHex(state.hsv), true);
    });
    const hex = $('#hex');
    if (hex) {
      const raw = () => hex.value.replace(/^#/, '');
      const applyTyped = () => { const n = normHex(hex.value); if (n && n !== curHex().toUpperCase()) setColor(n); };
      // a full 6-digit code applies as you type; a 3-digit shorthand applies when you press Enter or leave the field
      hex.addEventListener('input', () => {
        const ok6 = /^[0-9a-f]{6}$/i.test(raw()), ok3 = /^[0-9a-f]{3}$/i.test(raw());
        $('#hexbox').classList.toggle('bad', !(ok6 || ok3));
        if (ok6) applyTyped();
      });
      let fresh = false;                         // clicking into the field selects what's there, so typing replaces it
      hex.addEventListener('focus', () => { fresh = true; hex.select(); });
      hex.addEventListener('mouseup', e => { if (fresh) { e.preventDefault(); fresh = false; } });
      hex.addEventListener('blur', () => { fresh = false; applyTyped(); hex.value = curHex().slice(1); $('#hexbox').classList.remove('bad'); });
      hex.addEventListener('keydown', e => { if (e.key === 'Enter') hex.blur(); });
    }
  }

  // ---------- put it together ----------
  function renderAll() {
    card.innerHTML = avatarHtml(state.sel);
    applyBg();
    renderSide('left');
    renderSide('right');
  }
  function applyColors() {
    COLOR_GROUPS.forEach(g => root.style.setProperty('--' + g.key, state.colors[g.key]));
  }
  function resetAll() {
    state.sel = Object.assign({}, DEFAULT_SEL);
    state.bg = Object.assign({ stop: 0 }, DEFAULT_BG);
    COLOR_GROUPS.forEach(g => { state.colors[g.key] = g.def; clearChosen(g.key); });   // back to the original colors, and menu tiles show their originals again
    state.target = 'body';
    applyColors();
    renderAll();
  }
  function shuffle() {
    const rnd = a => a[Math.floor(Math.random() * a.length)];
    const s = {};
    CATS.forEach(cat => {
      if (cat === 'outfits' || cat === 'backgrounds') return;
      const items = TRAITS[cat];
      s[cat] = !items.length ? null : (isRequired(cat) || Math.random() > 0.25) ? rnd(items).id : null;
    });
    // eyes: always, unless the head has its own eyes drawn in (hasEyes)
    const head = find('face', s.face);
    s.eyes = (head && head.hasEyes) || !TRAITS.eyes.length ? null : (s.eyes || rnd(TRAITS.eyes).id);
    // background: a picture, a solid color, a gradient, or nothing
    const art = TRAITS.backgrounds, r = Math.random();
    s.backgrounds = null; state.bg.mode = 'none'; state.bg.stop = 0;
    if (art.length && r < 0.4) s.backgrounds = rnd(art).id;
    else if (r < 0.6) { state.bg.mode = 'solid'; state.bg.c1 = rnd(PALETTE_PRESETS); }
    else if (r < 0.8) { state.bg.mode = 'gradient'; state.bg.c1 = rnd(PALETTE_PRESETS); state.bg.c2 = rnd(PALETTE_PRESETS); }
    state.sel = s;
    COLOR_GROUPS.forEach(g => { state.colors[g.key] = rnd(PALETTE_PRESETS); markChosen(g.key); });
    applyColors();
    renderAll();
  }
  $('#shuffle').addEventListener('click', shuffle);
  $('#resetAll').addEventListener('click', resetAll);

  // ---------- reading combined SVG exports ----------
  // A combined SVG is a flat color shape (painted in a marker color) plus the art image on top. The marker colors
  // become the Skin / Eyes / Hair colors; the art image is drawn above them.
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
  // the fill color a shape (or a group) asks for: from its class, its fill attribute, or the group it sits in
  function fillOf(el, css, inherited) {
    let color = null;
    (el.getAttribute('class') || '').split(/\s+/).forEach(c => { if (css[c]) color = css[c]; });
    if (!color && el.getAttribute('fill')) color = el.getAttribute('fill').trim().toLowerCase();
    return color || inherited || null;
  }
  function shapeMarkup(el, css, inherited) {
    const color = fillOf(el, css, inherited);
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
    // shapes can sit directly in the SVG or inside <g> groups (newer exports wrap them in a group)
    const walk = (el, inherited) => {
      const tag = el.localName;
      if (tag === 'defs' || tag === 'style' || tag === 'title' || tag === 'desc') return;
      if (tag === 'image') {
        const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (href) { flush(); out.push(Object.assign({ src: dataUriToUrl(href) }, extra)); }
        return;
      }
      if (tag === 'g') {
        const tr = el.getAttribute('transform'), color = fillOf(el, css, inherited);
        if (tr) shapes.push('<g transform="' + esc(tr) + '">');
        Array.prototype.forEach.call(el.children, k => walk(k, color));
        if (tr) shapes.push('</g>');
        return;
      }
      shapes.push(shapeMarkup(el, css, inherited));
    };
    Array.prototype.forEach.call(rootEl.children, el => walk(el, null));
    flush();
    return out;
  }
  // A plain full-color SVG (no green / yellow / blue marker shape, no embedded image) can't be recolored, so it is shown exactly as drawn:
  // as one image, with a width and height added so browsers can size it (and so the tile can be cropped to it).
  const MARKER_RE = /fill\s*[:=]\s*["']?\s*(lime|#0f0|#00ff00|yellow|#ff0|#ffff00|blue|#00f|#0000ff)\s*["';}\s]/i;
  const isPlainVector = text => !/<image\b/i.test(text) && !MARKER_RE.test(text);
  function plainVectorLayer(text, extra) {
    const m = /viewBox\s*=\s*"([^"]+)"/.exec(text), vb = m ? m[1].trim().split(/[\s,]+/).map(Number) : [0, 0, CANVAS.w, CANVAS.h];
    let t = text;
    if (!/<svg\b[^>]*\swidth\s*=/.test(t)) t = t.replace(/<svg\b/, '<svg width="' + vb[2] + '" height="' + vb[3] + '"');
    const url = window.URL && URL.createObjectURL ? URL.createObjectURL(new Blob([t], { type: 'image/svg+xml' })) : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(t);
    return Object.assign({ src: url }, extra);
  }
  function loadArt() {
    const jobs = [], found = [];
    Object.keys(TRAITS).forEach(cat => TRAITS[cat].forEach(it => {
      (it.layers || []).forEach((l, i) => {
        if (!l.svgSrc) return;
        jobs.push(fetch(l.svgSrc).then(r => { if (!r.ok) throw new Error(l.svgSrc + ' (' + r.status + ')'); return r.text(); })
          .then(t => { const ex = l.z != null ? { z: l.z } : {}; found.push([it, i, isPlainVector(t) ? [plainVectorLayer(t, ex)] : expandSvg(t, ex)]); }));
      });
    }));
    return Promise.all(jobs).then(() => {
      const byItem = new Map();
      found.forEach(f => { if (!byItem.has(f[0])) byItem.set(f[0], {}); byItem.get(f[0])[f[1]] = f[2]; });
      byItem.forEach((map, it) => { it.layers = [].concat.apply([], it.layers.map((l, i) => (map[i] ? map[i] : [l]))); });
    });
  }

  // a tileBg color at its tileBgOpacity (1 when not set)
  function tileBgCss(it) {
    const h = normHex(it.tileBg), a = it.tileBgOpacity == null ? 1 : it.tileBgOpacity;
    if (!h || a >= 1) return it.tileBg;
    return 'rgba(' + [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)).join(',') + ',' + a + ')';
  }

  // ---------- the selected star's color ----------
  // The star sits in a tile's top-right corner with nothing behind it, so it is dark (ink) on light artwork and paper-colored on dark artwork.
  // For background images (B.G. tiles, and Outfits tiles through their set's background) the corner of the image is measured once here;
  // for a tileBg it is that color. Whichever of ink or paper stands out more against it wins. Every other tile keeps the dark star.
  function starTones() {
    const cs = getComputedStyle(root), rgbOf = h => { h = normHex(h) || '#000000'; return [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); };
    const lum = c => { const f = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
    const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const ink = lum(rgbOf(cs.getPropertyValue('--ink').trim())), paper = lum(rgbOf(cs.getPropertyValue('--paper').trim()));
    const light = L => contrast(L, paper) > contrast(L, ink);       // true = use the paper-colored star
    const paperRgb = rgbOf(cs.getPropertyValue('--paper').trim());
    Object.keys(TRAITS).forEach(cat => TRAITS[cat].forEach(it => {
      if (!it.tileBg) return;
      const a = it.tileBgOpacity == null ? 1 : it.tileBgOpacity, c = rgbOf(it.tileBg).map((v, i) => v * a + paperRgb[i] * (1 - a));   // as it shows over the paper
      it.starLight = light(lum(c));
    }));
    return Promise.all(TRAITS.backgrounds.map(it => new Promise(res => {
      if (it.star === 'light' || it.star === 'dark') { it.starLight = it.star === 'light'; return res(); }   // set by hand
      const l = (it.layers || []).find(x => x.src); if (!l) return res();
      const img = new Image();
      img.onload = () => {
        try {
          const W = 118, H = 157, c = document.createElement('canvas'); c.width = W; c.height = H;   // a typical B.G./Outfits tile, in px
          const g = c.getContext('2d'), s = Math.max(W / img.naturalWidth, H / img.naturalHeight);   // drawn like the tile (cover)
          g.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
          const d = g.getImageData(W - 19, 5, 13, 13).data;   // exactly where the star sits (13px, 5px from the top, 6px from the right)
          let L = 0, n = 0;
          for (let i = 0; i < d.length; i += 4) { L += lum([d[i], d[i + 1], d[i + 2]]); n++; }
          it.starLight = light(L / n);
        } catch (e) { /* can't read it: keep the dark star */ }
        res();
      };
      img.onerror = () => res();
      img.src = l.src;
    })));
  }

  // ---------- narrow screens: the panels stack, so the frame needs to be taller ----------
  function fitFrame() {
    const f = window.frameElement; if (!f) return;
    try {
      if (f.dataset.h0 === undefined) f.dataset.h0 = f.style.height || '';
      f.style.height = window.innerWidth <= 860 ? '1140px' : f.dataset.h0;
    } catch (e) { /* embedded somewhere we can't resize: that's fine */ }
  }
  window.addEventListener('resize', fitFrame);

  // ---------- start ----------
  // ---------- holographic hover on collectible Outfits tiles ----------
  // The pointer's spot on the tile drives a few CSS variables; the foil itself is all CSS (.holo / .shine in avatar-builder.html).
  // Only the tile under the cursor does any work. Mouse/trackpad only: touch screens have no hover.

  // The pixel halftone both layers are printed through: a grid of squares whose size depends on where they sit (HOLO.pattern).
  // Made once as an SVG and handed to the CSS as --holo-mask.
  const HOLO_MAX_FILL = 0.5;   // the biggest square is 50% of its cell, which always leaves a gap between neighbours
  function holoMask(pattern, tileWidth, dot) {
    // one grid cell (the largest a square gets) is about `dot` screen pixels, whatever size the tiles are
    const C = Math.max(12, Math.round((tileWidth || 120) / (dot || 4))), R = Math.round(C * 4 / 3);
    const W = 300, H = 400, cw = W / C, ch = H / R, f = n => n.toFixed(2);
    let out = '';
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
      const u = (i + 0.5) / C, v = (j + 0.5) / R, d = (u + (1 - v)) / 2;
      let t = pattern === 'diagonal-balanced' ? Math.abs(d - 0.5) * 2                               // big in two opposite corners
        : pattern === 'edges' ? Math.min(1, Math.hypot((u - 0.5) * 1.5, (v - 0.5) * 1.1) * 1.55)   // big at the edges, small in the middle
        : Math.abs(v - 0.5) * 2;                                                                   // 'vertical-balanced': big at the top and bottom
      t = Math.max(0, Math.min(1, t));
      const s = cw * t * t * HOLO_MAX_FILL;           // the square's side: never fills its cell, so the squares never join into a solid
      if (s < 0.35) continue;
      out += '<rect x="' + f(i * cw + (cw - s) / 2) + '" y="' + f(j * ch + (ch - s) / 2) + '" width="' + f(s) + '" height="' + f(s) + '"/>';
    }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" shape-rendering="crispEdges">' + out + '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  function holoInit() {
    if (typeof HOLO === 'undefined' || !window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    root.style.setProperty('--holo-i', HOLO.intensity);
    const sample = document.querySelector('#body-left .tile.collect');
    root.style.setProperty('--holo-mask', holoMask(HOLO.pattern, sample ? sample.getBoundingClientRect().width : 0, HOLO.dot));
    let cur = null, frame = 0, last = null;
    const off = t => t.classList.remove('hov');
    const paint = () => {
      frame = 0; if (!cur || !last) return;
      const r = cur.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (last.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (last.clientY - r.top) / r.height));
      const st = cur.style;
      // the foil and the shine travel the same distance, in the same direction, as the cursor moves
      st.setProperty('--bx', (40 + x * 20).toFixed(1) + '%'); st.setProperty('--by', (40 + y * 20).toFixed(1) + '%');
      st.setProperty('--shx', (-15 + x * 130).toFixed(1) + '%'); st.setProperty('--shy', (-15 + y * 130).toFixed(1) + '%');
    };
    const body = document.getElementById('body-left');
    body.addEventListener('pointermove', e => {
      const t = e.target.closest && e.target.closest('.tile.collect');
      if (t !== cur) { if (cur) off(cur); cur = t; if (cur) cur.classList.add('hov'); }
      last = e; if (cur && !frame) frame = requestAnimationFrame(paint);
    });
    body.addEventListener('pointerleave', () => { if (cur) off(cur); cur = null; });
  }

  function start() {
    // load every image once up front so picking a trait doesn't flash while it loads
    Object.keys(TRAITS).forEach(cat => TRAITS[cat].forEach(it => (it.layers || []).forEach(l => { if (l.src) new Image().src = l.src; })));
    root.style.setProperty('--corner', AVATAR_CORNER);
    const figW = FIGURE.height * (CANVAS.w / CANVAS.h) * (4 / 3);     // the canvas's width as a fraction of the 3:4 display
    [['--fig-l', FIGURE.left], ['--fig-t', FIGURE.top], ['--fig-w', figW], ['--fig-h', FIGURE.height]].forEach(v => root.style.setProperty(v[0], (v[1] * 100).toFixed(3) + '%'));
    COLOR_GROUPS.forEach(g => { state.colors[g.key] = g.def; });
    state.saved = loadSaved();
    applyColors();
    renderAll();
    holoInit();
  }
  fitFrame();
  card.innerHTML = '<p class="empty" style="padding:16px">Loading\u2026</p>';
  renderTabs('left'); renderTabs('right');
  loadArt().then(computeCrops).then(starTones).then(start).catch(err => {
    console.error(err);
    card.innerHTML = '<p class="empty" style="padding:16px">Couldn\u2019t load the artwork. Open this page from the website, not as a file on your computer.</p>';
  });
})();
