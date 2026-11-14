const app = document.getElementById('app');
const RATIO = { '16:9': 16 / 9, '9:16': 9 / 16, '1:1': 1 };
// The project grids (home, Work, Play): equal-width columns.
//   cols  = columns on a wide screen (phones get at most 2)
//   ratio = every tile's shape, width:height, e.g. '3:4', '4:5', '5:7', '1:1'; or 'flex' = each tile takes its cover's own shape
//           (a project with no cover uses its r shape from projects.js)
// Add ?tune to the address (before any #) and pick Grid in the panel to try these live.
const GRID = { cols: 3, ratio: '7:5' };
const ratioOf = s => { const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(s || ''); return m ? m[1] / m[2] : 0; };
const COLORS = ['#FF6B4A', '#FFD84D', '#7FE0B0', '#7CC4FF', '#C3A6FF', '#FF9EC4', '#C8F169', '#FFA43A', '#FFF1D6', '#8E9BFF'];
const colorOf = p => COLORS[PROJECTS.indexOf(p) % COLORS.length];
const bySlug = s => PROJECTS.find(p => p.slug === s);
const byCat = c => PROJECTS.filter(p => p.cat === c && !p.hidden);
const isVideo = s => /\.(mp4|webm)$/i.test(s);

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Videos behave like gifs: silent, looping, never any controls. They play while on screen
// and pause when scrolled away. If a browser blocks autoplay (e.g. iPhone Low Power Mode),
// they start on the first touch, click or scroll instead.
let autoplayBlocked = false;
const gifVideos = new Set();
const onScreen = new WeakSet();
function tryPlay(v) {
  const p = v.play();
  if (p && p.catch) p.catch(() => { autoplayBlocked = true; });
}
const vidObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { onScreen.add(e.target); tryPlay(e.target); }
  else { onScreen.delete(e.target); e.target.pause(); }
}), { rootMargin: '200px' }) : null;
function gifVideo(src, cls) {
  const v = document.createElement('video');
  if (cls) v.className = cls;
  v.muted = v.defaultMuted = v.loop = v.autoplay = v.playsInline = true;
  v.controls = false;
  ['muted', 'loop', 'autoplay', 'playsinline', 'disablepictureinpicture', 'disableremoteplayback'].forEach(k => v.setAttribute(k, ''));
  v.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
  v.tabIndex = -1;
  v.preload = 'auto';
  v.src = src;
  gifVideos.add(v);
  if (vidObserver) vidObserver.observe(v); else tryPlay(v);
  return v;
}
function wakeVideos() {
  if (!autoplayBlocked) return;
  autoplayBlocked = false;
  gifVideos.forEach(v => {
    if (!v.isConnected) { gifVideos.delete(v); return; }
    if (v.paused && (onScreen.has(v) || !vidObserver)) tryPlay(v);
  });
}
['touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(ev => window.addEventListener(ev, wakeVideos, { passive: true }));

function tile(p) {
  const a = el('a', 'tile');
  a.href = '#/p/' + p.slug;
  a.style.background = colorOf(p);
  if (p.cover && isVideo(p.cover)) {
    a.appendChild(gifVideo(p.cover));
  } else if (p.cover) {
    a.innerHTML = '<img src="' + p.cover + '" alt="" loading="lazy">';
  } else {
    a.classList.add('noimg');
  }
  a.insertAdjacentHTML('beforeend', '<span class="cap">' + esc(p.title) + '</span>');
  a.setAttribute('aria-label', p.title);
  return { node: a, r: RATIO[p.r] || 1 };
}

// Equal-width columns (GRID). A fixed ratio gives every tile the same shape, in reading order across the rows.
// 'flex' stacks the tiles in columns (left to right, then down), each at its cover's own shape once that has loaded.
function mosaic(items) {
  const W = app.clientWidth, cols = Math.max(1, Math.min(GRID.cols, W < 640 ? 2 : GRID.cols));
  const fixed = ratioOf(GRID.ratio);
  if (fixed) {
    const g = el('div', 'grid');
    g.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
    items.forEach(it => { it.node.style.aspectRatio = fixed; g.appendChild(it.node); });
    return g;
  }
  const g = el('div', 'grid flex'), colEls = [];
  for (let i = 0; i < cols; i++) colEls.push(g.appendChild(el('div', 'gcol')));
  items.forEach((it, i) => {
    it.node.style.aspectRatio = it.r;                               // until the cover's own shape is known
    const m = it.node.querySelector('img, video');
    if (m) {
      const fit = () => { const w = m.naturalWidth || m.videoWidth, h = m.naturalHeight || m.videoHeight; if (w && h) it.node.style.aspectRatio = w / h; };
      if (m.tagName === 'IMG') { if (m.complete) fit(); else m.addEventListener('load', fit); }
      else m.addEventListener('loadedmetadata', fit);
    }
    colEls[i % cols].appendChild(it.node);
  });
  return g;
}

function crumbs(parts) {
  return '<p class="crumb">' + parts.map((x, i) => i === parts.length - 1 ? '<b>' + x[0] + '</b>' : '<a href="' + x[1] + '">' + x[0] + '</a>').join(' / ') + '</p>';
}

function home() {
  const items = PROJECTS.filter(p => p.feat && !p.hidden).map(tile);
  return mosaic(items);
}

function work() {
  const items = byCat('work').map(tile);
  const w = el('div', null, '');   // no page label (was: crumbs([['Work']]))
  w.appendChild(mosaic(items));
  return w;
}

function play() {
  const w = el('div', null, '');   // no page label (was: crumbs([['Play']]))
  w.appendChild(mosaic(byCat('play').map(tile)));
  return w;
}

function about() {
  const links = SITE.links.map(l => '<a href="' + l.href + '">' + l.label + '</a>').join('');
  return el('div', 'about', '<p>' + SITE.name + ' is a ' + SITE.tagline + '.</p><p>' + links + '</p>');
}

// Images and videos without any transparency get square corners and a black outline (the 'framed' class).
// Ones with transparency (cut-out stickers, characters) get no outline (corners are square either way). JPGs and MP4s can't be transparent;
// anything else is checked once it has loaded by reading a small copy of it.
function frameIfOpaque(n) {
  const src = n.getAttribute('src') || '';
  if (/\.(jpe?g|mp4)(\?|#|$)/i.test(src)) { n.classList.add('framed'); return; }
  const test = () => {
    try {
      const w = n.naturalWidth || n.videoWidth, h = n.naturalHeight || n.videoHeight; if (!w || !h) return;
      const k = Math.min(1, 96 / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(n, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return;   // found a see-through pixel: leave it as is
      n.classList.add('framed');
    } catch (e) {}
  };
  if (n.tagName === 'IMG') { if (n.complete && n.naturalWidth) test(); else n.addEventListener('load', test, { once: true }); }
  else if (n.tagName === 'VIDEO') { if (n.readyState >= 2) test(); else n.addEventListener('loadeddata', test, { once: true }); }
}

function mediaBlock(m, cls) {
  if (m.t === 'grid' || m.t === 'row') {
    const w = el('div', m.t === 'grid' ? 'gbox' : 'prow');
    w.style.setProperty('--cols', m.cols || (m.t === 'grid' ? 5 : m.items.length));
    if (m.bg) w.style.background = m.bg; else w.classList.add('plain');
    m.items.forEach(i => w.appendChild(mediaBlock(i, m.t === 'grid' ? 'gi' : 'm')));
    return w;
  }
  let n;
  if (m.t === 'video') {
    n = gifVideo(m.src, cls || 'm');
    if (m.alt) n.setAttribute('aria-label', m.alt);
  }
  else if (m.t === 'embed') {
    n = el('iframe', cls || 'm'); n.src = m.src; n.allowFullscreen = true; n.loading = 'lazy';
    if (m.height) { n.style.aspectRatio = 'auto'; n.style.height = m.height; }
    if (m.alt) n.setAttribute('aria-label', m.alt);      // not a title: a title shows as a tooltip over the whole builder
  }
  else { n = el('img', cls || 'm'); n.src = m.src; n.alt = m.alt || ''; n.loading = 'lazy'; }
  if (m.t !== 'embed') frameIfOpaque(n);
  return n;
}

function prevNext(p) {
  const list = byCat(p.cat), n = list.length, i = list.indexOf(p);
  if (n < 2 || i < 0) return document.createDocumentFragment();
  const mk = (q, cls, label) => {
    const a = el('a', cls, '<small>' + label + '</small><span class="t sqw"><span>' + esc(q.title) + '</span></span>');
    a.href = '#/p/' + q.slug;
    a.style.background = colorOf(q);
    return a;
  };
  const w = el('div', 'pn');
  w.append(mk(list[(i + n - 1) % n], 'pv', 'Previous'), mk(list[(i + 1) % n], 'nx', 'Next'));
  return w;
}

function project(slug) {
  const p = bySlug(slug);
  if (!p) return el('p', 'empty', 'That project doesn\u2019t exist. <a href="#/">Back to home</a>');
  const d = el('div', 'proj');
  const intro = el('div', 'intro', '<h1 class="sqw"><span>' + esc(p.title) + '</span></h1>');
  const hasCredits = p.credits && p.credits.length;
  const tuning = /[?&]tune\b/.test(location.search);
  if (p.blurb || hasCredits || tuning) {
    const side = el('div', 'side');
    if (p.blurb) side.appendChild(el('p', 'blurb', esc(p.blurb)));
    else if (tuning) side.appendChild(el('p', 'blurb tph', 'Description box (only shown while tuning). Fill in this project\u2019s blurb in projects.js and it appears here.'));
    if (hasCredits) side.appendChild(el('dl', 'credits', p.credits.map(c => '<div><dt>' + esc(c.role) + '</dt><dd>' + esc(c.name) + '</dd></div>').join('')));
    intro.appendChild(side);
  } else intro.classList.add('solo');   // no description: the title gets the whole row
  if (!p.titleBelow) d.appendChild(intro);          // titleBelow: true puts the title, blurb and credits after the media
  if (!p.media.length) {
    for (let i = 0; i < 3; i++) d.appendChild(el('div', 'm', '')).style.cssText = 'aspect-ratio:16/9;background:' + COLORS[(PROJECTS.indexOf(p) + i * 3) % COLORS.length];
  } else {
    p.media.forEach(m => d.appendChild(mediaBlock(m)));
  }
  if (p.titleBelow) { intro.classList.add('below'); d.appendChild(intro); }
  if (p.after) p.after.forEach(m => d.appendChild(mediaBlock(m)));   // after: media shown below the title
  return d;
}

const SECTIONS = { work, play };
const sectionOf = p => p.cat;
let shown = null, box = null;

function closeBox() {
  if (!box) return;
  box.remove();
  box = null;
  document.body.style.overflow = '';
}

function mediaNode(m) {
  let n;
  if (m.t === 'video') { n = gifVideo(m.src); }
  else if (m.t === 'embed') { n = el('iframe'); n.src = m.src; n.allowFullscreen = true; }
  else { n = el('img'); n.src = m.src; n.alt = ''; }
  n.className = 'lbm';
  if (m.t !== 'embed') frameIfOpaque(n);
  return n;
}

// Single-image projects open as a floating lightbox over their section.
// The URL still changes to #/p/<slug>, so the project has its own link.
function openBox(p) {
  closeBox();
  const back = '#/' + sectionOf(p);
  box = el('div', 'lb');
  box.dataset.back = back;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', p.title);
  const list = p.media.length ? p.media : (p.cover ? [{ t: isVideo(p.cover) ? 'video' : 'img', src: p.cover }] : []);
  const inner = el('div', 'lbin');
  if (list.length) list.forEach(m => inner.appendChild(mediaNode(m)));
  else {
    const ph = el('div', 'lbm');
    ph.style.cssText = 'aspect-ratio:' + RATIO[p.r] + ';background:' + colorOf(p);
    inner.appendChild(ph);
  }
  inner.appendChild(el('p', 'lbcap', esc(p.title)));
  const x = el('button', 'lbx', '\u00d7');
  x.setAttribute('aria-label', 'Close');
  x.onclick = () => { location.hash = back; };
  box.onclick = e => { if (e.target === box || e.target === inner) location.hash = back; };
  box.append(inner, x);
  document.body.appendChild(box);
  document.body.style.overflow = 'hidden';
  x.focus();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && box) location.hash = box.dataset.back;
});

// Corner menu. On the landing page all three links run along the top (and, rotated, the bottom). On a section
// (or a project in it) that section's link stays on the top edge and the other two run down the sides.
const MENU = { work: 'Work', play: 'Play', about: 'About' };
function menuHtml(key, dup) {
  const t = dup ? ' tabindex="-1"' : '';
  const keys = Object.keys(MENU);
  const link = (k, cur) => '<a href="#/' + k + '" data-k="' + k + '"' + t + (cur ? ' aria-current="page"' : '') + '>' + MENU[k] + '</a>';
  const top = (key ? [key] : keys).map(k => link(k, k === key)).join('');
  const side = key ? keys.filter(k => k !== key).map(k => link(k, false)).join('') : '';
  return '<div class="mtop"><div class="mwrap">' + top + '</div><span class="cstar" aria-hidden="true">\u2736</span></div>' + (side ? '<div class="mside">' + side + '</div>' : '');
}
function setMenu(key) {
  const tr = document.getElementById('menu-tr'), bl = document.getElementById('menu-bl');
  if (tr) { tr.innerHTML = menuHtml(key, false); tr.className = 'menu menu-tr' + (key ? '' : ' is-home'); }
  if (bl) { bl.innerHTML = menuHtml(key, true); bl.className = 'menu menu-bl' + (key ? '' : ' is-home'); }
}

function render(force) {
  const h = (location.hash || '#/').replace(/^#\/?/, '');
  const [a, b] = h.split('/');
  if (h === 'work/reddit') { location.replace('#/work'); return; }   // old link to the retired sub-page
  const p = a === 'p' ? bySlug(b) : null;
  const boxSec = p && p.single ? sectionOf(p) : null;
  const target = boxSec || (SECTIONS[h] ? h : null);
  if (!force && target && target === shown) {
    if (boxSec) openBox(p); else closeBox();
    return;
  }
  closeBox();
  let v, key = a;
  if (target) { v = SECTIONS[target](); if (boxSec) key = boxSec.split('/')[0]; }
  else if (a === 'about') v = about();
  else if (a === 'p') { v = project(b); key = p ? sectionOf(p).split('/')[0] : ''; }
  else { v = home(); key = ''; }
  shown = target;
  app.replaceChildren(v);
  setMenu(key);
  window.scrollTo(0, 0);
  if (boxSec) openBox(p);
  fitTitles();
}

// project titles stay on one line: one too long for the row is set just small enough to fit (on load, resize, font changes)
function fitTitles() {
  document.querySelectorAll('.intro h1').forEach(h => {
    const s = h.firstElementChild; if (!s) return;
    h.style.fontSize = '';
    const r = document.createRange(); r.selectNodeContents(s);
    const ink = r.getBoundingClientRect().width, room = h.clientWidth;
    if (ink > room && room > 0) h.style.fontSize = (parseFloat(getComputedStyle(h).fontSize) * room / ink * 0.98) + 'px';
  });
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitTitles());

let lastW = app.clientWidth, t;
window.addEventListener('hashchange', () => render());
window.addEventListener('resize', () => {
  fitTitles();
  clearTimeout(t);
  t = setTimeout(() => { if (Math.abs(app.clientWidth - lastW) > 40) { lastW = app.clientWidth; const y = scrollY; render(true); scrollTo(0, y); } }, 150);
});
render();

// ---------- the rounded, squeezed Cossette lettering ----------
// Every rounded word is blurred, then its edge is cut sharp again, which rounds off the corners.
//   blur    = how round the corners get (bigger = rounder and softer; scale it with the text size)
//   sharp   = how crisp the cut edge is (lower = a soft, fuzzy edge; higher = a hard edge)
//   thick   = moves the cut: above 0 the letters get bolder and blobbier, below 0 thinner (0 = their own weight)
//   squeeze = how narrow the letters are drawn (1 = the font's own width)
//   font    = which of the site's typefaces it's set in (see FX_FONTS)
//   size    = how big it is, times its normal size (1 = as designed)
//   caps    = (title only) true = all capitals
// name = "connie ✶ van" at the top, headings = the next / previous project titles at the bottom of a project page,
// title = the big title on a project page (it shares the headings' squeeze), body = body copy (descriptions, credits, the About page),
// images = the outline on project images with no transparency: outline = its thickness in px (0 = none)
// labels = the small uppercase labels (credit roles, tile captions, the menu, the breadcrumb, Next / Previous, lightbox captions).
//   leading = (body and title) line height
// Add ?tune to the address, before any #, (connievan.com/?tune#/work) for sliders that change these live, with the line to copy back here.
const FX = { name: { blur: 6, sharp: 4.5, thick: 0, squeeze: 0.68, font: 'cossette-bold', size: 1 }, headings: { blur: 1.1, sharp: 4.5, thick: 0, squeeze: 0.68, font: 'cossette-bold', size: 1 }, title: { blur: 0, sharp: 4.5, thick: 0, font: 'instrument-serif', size: 1, caps: false, leading: 1 }, body: { font: 'geist', size: 0.83, leading: 1.4 }, labels: { font: 'geist-mono', size: 1 }, images: { outline: 0 } };
// the typefaces in fonts/: [the name shown in the ?tune panel, CSS family, weight]
const FX_FONTS = {
  'cossette-bold': ['Cossette Titre Bold', "'Cossette Titre'", 700],
  'cossette': ['Cossette Titre Regular', "'Cossette Titre'", 400],
  'instrument-serif': ['Instrument Serif', "'Instrument Serif'", 400],
  'geist-mono': ['Geist Mono Medium', "'Geist Mono'", 500],
  'geist-mono-regular': ['Geist Mono Regular', "'Geist Mono'", 400],
  'geist': ['Geist Regular', "'Geist'", 400],
  'geist-medium': ['Geist Medium', "'Geist'", 500]
};
// A font can also come from Google Fonts: font: 'google:Family Name:700' or 'google:Family Name:700:italic' (family, weight, style).
// It's loaded from Google when the page opens. Fine for trying fonts out; for good, download the font into fonts/ and add it to FX_FONTS.
const gfLoaded = {};
function googleFont(family, w, it) {
  const key = family + ':' + w + ':' + it; if (gfLoaded[key]) return; gfLoaded[key] = true;
  const fam = encodeURIComponent(family).replace(/%20/g, '+');
  const add = (href, fail) => {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
    l.onload = () => { if (document.fonts && document.fonts.load) document.fonts.load((it ? 'italic ' : '') + w + " 100px '" + family + "'").then(() => applyFx()); };
    l.onerror = fail || null; document.head.appendChild(l);
  };
  // if Google doesn't have that weight and style, fall back to the family's default
  add('https://fonts.googleapis.com/css2?family=' + fam + (it ? ':ital,wght@1,' : ':wght@') + w + '&display=swap', () => add('https://fonts.googleapis.com/css2?family=' + fam + '&display=swap'));
}
// [name for the panel, CSS family, weight, style]
const fxFont = k => {
  if (typeof k === 'string' && k.indexOf('google:') === 0) {
    const bits = k.slice(7).split(':'), fam = bits[0], w = parseInt(bits[1], 10) || 400, it = bits[2] === 'italic';
    googleFont(fam, w, it);
    return [fam + ' ' + w + (it ? ' italic' : '') + ' (Google)', "'" + fam.replace(/'/g, '') + "'", w, it ? 'italic' : 'normal'];
  }
  return (FX_FONTS[k] || FX_FONTS['cossette-bold']).concat('normal');
};
function applyFx() {
  const set = (id, o) => {
    const f = document.getElementById(id); if (!f) return;
    f.querySelector('feGaussianBlur').setAttribute('stdDeviation', o.blur);
    const a = f.querySelector('feFuncA');
    a.setAttribute('slope', o.sharp);
    a.setAttribute('intercept', (0.5 - o.sharp * (0.5 - o.thick)).toFixed(3));   // the edge sits where the blur is (0.5 - thick) opaque
  };
  if (!FX.body) FX.body = { font: 'cossette', size: 1, leading: 1.4 };
  if (!FX.labels) FX.labels = { font: 'geist-mono', size: 1 };
  if (!FX.images) FX.images = { outline: 0 };
  set('nameRound', FX.name); set('round-m', FX.headings); set('round-l', FX.title);
  const nf = document.getElementById('nameRound'), pad = 60 + FX.name.blur * 3;   // room for the blur, so a big blur isn't clipped
  if (nf) { nf.setAttribute('x', -pad); nf.setAttribute('y', -pad); nf.setAttribute('width', 1180 + 2 * pad); nf.setAttribute('height', 300 + 2 * pad); }
  const tx = document.getElementById('nameText'), nf2 = fxFont(FX.name.font);
  if (tx) { tx.setAttribute('transform', 'scale(' + FX.name.squeeze + ' 1)'); tx.style.fontFamily = nf2[1] + ",'Noto Star',Impact,sans-serif"; tx.style.fontWeight = nf2[2]; tx.style.fontStyle = nf2[3]; }
  const rs = document.documentElement.style, hf = fxFont(FX.headings.font), tf = fxFont(FX.title.font);
  rs.setProperty('--sq', FX.headings.squeeze);
  rs.setProperty('--name-w', (126 * FX.name.size).toFixed(1) + 'px');
  rs.setProperty('--fx-h-font', hf[1]); rs.setProperty('--fx-h-weight', hf[2]); rs.setProperty('--fx-h-style', hf[3]); rs.setProperty('--fx-h-size', FX.headings.size);
  rs.setProperty('--fx-t-font', tf[1]); rs.setProperty('--fx-t-weight', tf[2]); rs.setProperty('--fx-t-style', tf[3]); rs.setProperty('--fx-t-size', FX.title.size); rs.setProperty('--title-w', (FX.title.width || 30) + '%'); rs.setProperty('--fx-t-case', FX.title.caps ? 'uppercase' : 'none'); rs.setProperty('--fx-t-lh', FX.title.leading || 1);
  const bf = fxFont(FX.body.font);
  rs.setProperty('--fx-b-font', bf[1]); rs.setProperty('--fx-b-weight', bf[2]); rs.setProperty('--fx-b-style', bf[3]); rs.setProperty('--fx-b-size', FX.body.size); rs.setProperty('--fx-b-lh', FX.body.leading);
  const lf = fxFont(FX.labels.font);
  rs.setProperty('--fx-l-font', lf[1]); rs.setProperty('--fx-l-weight', lf[2]); rs.setProperty('--fx-l-style', lf[3]); rs.setProperty('--fx-l-size', FX.labels.size);
  rs.setProperty('--img-outline', FX.images.outline + 'px');
  if (window.fitName) window.fitName();
  // re-measure the name once its typeface has loaded
  if (document.fonts && document.fonts.load) document.fonts.load((nf2[3] === 'italic' ? 'italic ' : '') + nf2[2] + ' 100px ' + nf2[1]).then(() => { if (window.fitName) window.fitName(); });
  fitTitles();
}

// The name hides while you scroll down and comes back when you scroll up.
(function () {
  const nb = document.getElementById('namebar'), svg = document.getElementById('nameSvg'), tx = document.getElementById('nameText');
  const H = 256, LSB = 5.4, RSB = 9.9;
  function fit() {
    try {
      const SQ = FX.name.squeeze, w = tx.getBBox().width * SQ;
      if (!(w > 100)) return;
      const ink = w - (LSB + RSB) * SQ;
      svg.setAttribute('viewBox', (LSB * SQ).toFixed(1) + ' 0 ' + ink.toFixed(1) + ' ' + H);
    } catch (e) {}
  }
  window.fitName = fit;
  applyFx();
  if (document.fonts && document.fonts.load) document.fonts.load('700 100px "Cossette Titre"').then(fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  fit();
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = Math.max(0, scrollY), dy = y - lastY;
    if (y < 8) nb.classList.remove('hide');
    else if (dy > 6) nb.classList.add('hide');
    else if (dy < -6) nb.classList.remove('hide');
    lastY = y; ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
})();

// ?tune in the address (before any #): sliders for FX, applied live, with the finished FX line to copy into app.js.
// Only for tuning: visitors never see it, and nothing it changes is saved.
(function () {
  if (!/[?&]tune\b/.test(location.search)) return;
  const orig = JSON.parse(JSON.stringify(FX));
  const parts = [['name', 'Name'], ['title', 'Project title'], ['headings', 'Next / prev'], ['body', 'Body copy'], ['labels', 'Labels'], ['images', 'Images']];
  const GRID_RATIOS = [['flex', 'Flexible (each cover\u2019s own shape)'], ['1:1', '1:1 square'], ['4:5', '4:5 tall'], ['5:4', '5:4 wide'], ['3:4', '3:4 tall'], ['4:3', '4:3 wide'], ['5:7', '5:7 tall'], ['7:5', '7:5 wide'], ['2:3', '2:3 tall'], ['3:2', '3:2 wide'], ['9:16', '9:16 tall'], ['16:9', '16:9 wide']];
  const origGrid = Object.assign({}, GRID);
  const rows = [['size', 'Size (\u00d7)', 0.5, 2, 0.01], ['blur', 'Roundness (blur)', 0, 20, 0.1], ['sharp', 'Edge sharpness', 1, 20, 0.1], ['thick', 'Thickness', -0.4, 0.4, 0.01], ['squeeze', 'Squeeze', 0.4, 1, 0.01], ['width', 'Title width (%)', 15, 85, 1], ['leading', 'Line height', 0.7, 2, 0.01], ['cols', 'Columns', 1, 6, 1], ['outline', 'Outline (px)', 0, 4, 0.25]];
  let part = 'name';
  const P = el('div', null, '<div class="th"><span>Tune</span><button type="button" class="tmin" aria-label="Hide or show the sliders">\u2013</button></div>' +
    '<div class="tbody"><div class="tparts">' + parts.map(p => '<button type="button" data-p="' + p[0] + '">' + p[1] + '</button>').join('') + '<button type="button" data-p="grid">Grid</button></div>' +
    '<label class="tr" data-row="ratio"><span>Tile shape</span><select data-k="ratio">' + GRID_RATIOS.map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join('') + '</select><span></span></label>' +
    '<label class="tr tchk" data-row="caps"><span>All caps</span><input type="checkbox" data-k="caps"><span></span></label>' +
    '<label class="tr" data-row="font"><span>Typeface</span><select data-k="font">' + Object.keys(FX_FONTS).map(k => '<option value="' + k + '">' + FX_FONTS[k][0] + '</option>').join('') + '</select><span></span></label>' +
    '<div class="tgf"><span>Google font</span><div class="gfbox"><input type="text" class="gfq" placeholder="Search Google Fonts" autocomplete="off" spellcheck="false"><div class="gfres" hidden></div></div>' +
    '<div class="gfrow"><select class="gfwt" aria-label="Weight and style"><option value="400">400</option><option value="700">700</option></select><button type="button" class="gfuse">Use</button></div></div>' +
    '<p class="tn gfmsg"></p>' +
    rows.map(r => '<label class="tr" data-row="' + r[0] + '"><span>' + r[1] + '</span><input type="range" data-k="' + r[0] + '" min="' + r[2] + '" max="' + r[3] + '" step="' + r[4] + '"><output></output></label>').join('') +
    '<p class="tn tnote"></p><code class="tcode"></code><div class="tb"><button type="button" class="tcopy">Copy</button><button type="button" class="treset">Reset</button></div>' +
    '<p class="tn tpaste"></p></div>');
  P.id = 'fxtune';
  document.body.appendChild(P);
  const num = v => String(+(+v).toFixed(3));
  const obj = o => '{ ' + Object.keys(o).map(k => k + ': ' + (typeof o[k] === 'string' ? "'" + o[k] + "'" : typeof o[k] === 'boolean' ? o[k] : num(o[k]))).join(', ') + ' }';
  const fxLine = () => 'const FX = { ' + parts.map(p => p[0] + ': ' + obj(FX[p[0]])).join(', ') + ' };';
  const gridLine = () => "const GRID = { cols: " + GRID.cols + ", ratio: '" + GRID.ratio + "' };";
  const line = () => part === 'grid' ? gridLine() : fxLine();
  const regrid = () => { const h = (location.hash || '#/').replace(/^#\/?/, '').split('/')[0]; if (h === '' || SECTIONS[h]) { const y = scrollY; render(true); scrollTo(0, y); } };
  // the Google Fonts list (with each family's weights) comes from Fontsource's free API; if it can't load, any exact family name still works
  // Each entry's weights and styles (normal / italic) come along too. Results are listed under the box (no browser datalist, which
  // Safari and DuckDuckGo handle unevenly).
  const gfFonts = [], gfBy = {};
  const msg = t => { P.querySelector('.gfmsg').textContent = t; };
  msg('Loading the Google Fonts list\u2026');
  fetch('https://api.fontsource.org/v1/fonts?type=google').then(r => { if (!r.ok) throw r.status; return r.json(); }).then(list => {
    list.forEach(f => { if (!f || !f.family) return; const e = { family: f.family, weights: (f.weights && f.weights.length ? f.weights : [400]).slice().sort((a, b) => a - b), italic: (f.styles || []).indexOf('italic') >= 0 }; gfFonts.push(e); gfBy[f.family.toLowerCase()] = e; });
    gfFonts.sort((a, b) => a.family.localeCompare(b.family));
    msg(gfFonts.length + ' Google Fonts. Type to search, pick one, choose a weight and style, then Use.');
  }).catch(() => msg('Couldn\u2019t load the font list. Type a Google Fonts family name exactly, choose a weight, then Use.'));
  const gfq = P.querySelector('.gfq'), gfwt = P.querySelector('.gfwt'), gfres = P.querySelector('.gfres');
  // the weight + style menu for a family: "400", "400 italic", "700", ...
  const fillStyles = e => {
    const cur = gfwt.value, opts = [];
    (e ? e.weights : [400, 700]).forEach(w => { opts.push([String(w), String(w)]); if (!e || e.italic) opts.push([w + ':italic', w + ' italic']); });
    gfwt.innerHTML = opts.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('');
    const vals = opts.map(o => o[0]);
    gfwt.value = vals.indexOf(cur) >= 0 ? cur : (vals.indexOf('700') >= 0 ? '700' : vals.indexOf('400') >= 0 ? '400' : vals[0]);
  };
  const matches = q => {
    q = q.trim().toLowerCase(); if (!q) return [];
    const starts = [], has = [];
    gfFonts.forEach(e => { const f = e.family.toLowerCase(); if (f.indexOf(q) === 0) starts.push(e); else if (f.indexOf(q) > 0) has.push(e); });
    return starts.concat(has).slice(0, 40);
  };
  const pickFamily = e => { gfq.value = e.family; gfres.hidden = true; fillStyles(e); };
  gfq.addEventListener('input', () => {
    const list = matches(gfq.value);
    gfres.innerHTML = list.map((e, i) => '<button type="button" data-i="' + i + '">' + esc(e.family) + '</button>').join('');
    gfres.hidden = !list.length; gfres._list = list;
    const exact = gfBy[gfq.value.trim().toLowerCase()]; if (exact) fillStyles(exact);
  });
  gfres.addEventListener('mousedown', e => e.preventDefault());   // keep focus in the box while clicking a result
  gfres.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pickFamily(gfres._list[+b.dataset.i]); e.stopPropagation(); });
  gfq.addEventListener('blur', () => { setTimeout(() => { gfres.hidden = true; }, 150); });
  const useGoogle = () => {
    const raw = gfq.value.trim(); if (!raw) return;
    let e = gfBy[raw.toLowerCase()];
    if (!e && gfFonts.length) { const m = matches(raw); if (m.length) { e = m[0]; pickFamily(e); } }
    const fam = e ? e.family : raw;
    gfres.hidden = true;
    FX[part].font = 'google:' + fam + ':' + gfwt.value; applyFx(); show();
  };
  gfq.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); useGoogle(); } else if (e.key === 'Escape') gfres.hidden = true; });
  const show = () => {
    const o = part === 'grid' ? GRID : FX[part];
    const noFont = part === 'grid' || part === 'images'; P.querySelector('.tgf').hidden = noFont; P.querySelector('.gfmsg').hidden = noFont;
    P.querySelector('.tpaste').textContent = 'Copy, then paste over the ' + (part === 'grid' ? 'GRID' : 'FX') + ' line in app.js.';
    const sel = P.querySelector('select[data-k="font"]');
    sel.querySelectorAll('option.gf').forEach(op => { if (op.value !== o.font) op.remove(); });
    if (o.font && !FX_FONTS[o.font] && !sel.querySelector('option[value="' + CSS.escape(o.font) + '"]')) {
      const op = document.createElement('option'); op.className = 'gf'; op.value = o.font; op.textContent = fxFont(o.font)[0]; sel.appendChild(op);
    }
    P.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === part));
    P.querySelectorAll('label[data-row]').forEach(l => {
      const k = l.dataset.row, has = k in o; l.hidden = !has; if (!has) return;
      const inp = l.querySelector('input, select'); if (inp.type === 'checkbox') inp.checked = !!o[k]; else inp.value = o[k]; const out = l.querySelector('output'); if (out) out.textContent = num(o[k]);
    });
    P.querySelector('.tnote').textContent = part === 'title' ? 'Shown on a project page. Its squeeze is the headings\u2019 squeeze. It always sits on one line: a title too long for the row is set smaller to fit.' : part === 'headings' ? 'The next and previous project titles at the bottom of a project page.' : part === 'body' ? 'Descriptions, credits and the About page. Sizes scale together.' : part === 'images' ? 'The black outline on project images and videos with no transparency. 0 = no outline (the corners stay square).' : part === 'labels' ? 'The small uppercase labels: credit roles, tile captions, the menu, the breadcrumb, Next / Previous, lightbox captions. Sizes scale together.' : '';
    P.querySelector('.tcode').textContent = line();
  };
  P.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.p) { part = b.dataset.p; show(); }
    else if (b.classList.contains('gfuse')) useGoogle();
    else if (b.classList.contains('tcopy')) { if (navigator.clipboard) navigator.clipboard.writeText(line()).then(() => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1200); }, () => {}); }
    else if (b.classList.contains('treset')) { if (part === 'grid') { Object.assign(GRID, origGrid); regrid(); } else { Object.keys(orig).forEach(k => Object.assign(FX[k], orig[k])); applyFx(); } show(); }
    else if (b.classList.contains('tmin')) { const m = P.classList.toggle('min'); b.textContent = m ? '+' : '\u2013'; }
  });
  P.addEventListener('input', onIn); P.addEventListener('change', onIn);
  function onIn(e) {
    const k = e.target.dataset && e.target.dataset.k; if (!k) return;
    if (part === 'grid') { GRID[k] = k === 'ratio' ? e.target.value : parseInt(e.target.value, 10); regrid(); show(); return; }
    FX[part][k] = k === 'font' ? e.target.value : e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value); applyFx(); show();
  }
  show();
})();
