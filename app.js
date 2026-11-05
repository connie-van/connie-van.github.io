const app = document.getElementById('app');
const RATIO = { '16:9': 16 / 9, '9:16': 9 / 16, '1:1': 1 };
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
  return { node: a, r: RATIO[p.r] };
}

// Justified rows: every tile keeps its true ratio, each row fills the width.
function mosaic(items) {
  const wrap = el('div');
  const W = app.clientWidth;
  const target = W > 1000 ? 4.6 : W > 640 ? 3.6 : 2.3;
  let row = [], sum = 0;
  const flush = last => {
    if (!row.length) return;
    const r = el('div', 'row');
    const partial = last && sum < target * 0.7;
    row.forEach(it => {
      it.node.style.aspectRatio = it.r;
      it.node.style.flex = partial ? it.r / target + ' 0 0' : it.r + ' 1 0';
      r.appendChild(it.node);
    });
    wrap.appendChild(r);
    row = []; sum = 0;
  };
  items.forEach(it => {
    row.push(it); sum += it.r;
    if (sum >= target) flush(false);
  });
  flush(true);
  return wrap;
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
  const w = el('div', null, crumbs([['Work']]));
  w.appendChild(mosaic(items));
  return w;
}

function play() {
  const w = el('div', null, crumbs([['Play']]));
  w.appendChild(mosaic(byCat('play').map(tile)));
  return w;
}

function about() {
  const links = SITE.links.map(l => '<a href="' + l.href + '">' + l.label + '</a>').join('');
  return el('div', 'about', '<p>' + SITE.name + ' is a ' + SITE.tagline + '.</p><p>' + links + '</p>');
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
    if (m.alt) n.title = m.alt;
  }
  else { n = el('img', cls || 'm'); n.src = m.src; n.alt = m.alt || ''; n.loading = 'lazy'; }
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
  if (p.blurb || hasCredits) {
    const side = el('div', 'side');
    if (p.blurb) side.appendChild(el('p', 'blurb', esc(p.blurb)));
    if (hasCredits) side.appendChild(el('dl', 'credits', p.credits.map(c => '<div><dt>' + esc(c.role) + '</dt><dd>' + esc(c.name) + '</dd></div>').join('')));
    intro.appendChild(side);
  }
  if (!p.titleBelow) d.appendChild(intro);          // titleBelow: true puts the title, blurb and credits after the media
  if (!p.media.length) {
    for (let i = 0; i < 3; i++) d.appendChild(el('div', 'm', '')).style.cssText = 'aspect-ratio:16/9;background:' + COLORS[(PROJECTS.indexOf(p) + i * 3) % COLORS.length];
  } else {
    p.media.forEach(m => d.appendChild(mediaBlock(m)));
  }
  if (p.titleBelow) { intro.classList.add('below'); d.appendChild(intro); }
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
}

let lastW = app.clientWidth, t;
window.addEventListener('hashchange', () => render());
window.addEventListener('resize', () => {
  clearTimeout(t);
  t = setTimeout(() => { if (Math.abs(app.clientWidth - lastW) > 40) { lastW = app.clientWidth; const y = scrollY; render(true); scrollTo(0, y); } }, 150);
});
render();

// The name hides while you scroll down and comes back when you scroll up.
(function () {
  const nb = document.getElementById('namebar'), svg = document.getElementById('nameSvg'), tx = document.getElementById('nameText');
  const SQ = 0.68, H = 256, LSB = 5.4, RSB = 9.9;
  function fit() {
    try {
      const w = tx.getBBox().width * SQ;
      if (!(w > 100)) return;
      const ink = w - (LSB + RSB) * SQ;
      svg.setAttribute('viewBox', (LSB * SQ).toFixed(1) + ' 0 ' + ink.toFixed(1) + ' ' + H);
    } catch (e) {}
  }
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
