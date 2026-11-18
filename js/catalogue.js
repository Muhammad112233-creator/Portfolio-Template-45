import { NOOR_WORKS } from './works-data.js';
import { SITE } from './data.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = t => t * t * (3 - 2 * t);

export function createCatalogue({ end }) {
  const { rows, sheets } = NOOR_WORKS;
  const root = document.querySelector('#catalogue');
  root.innerHTML = `<div class="cat__stage">
      <div class="cat__hud"><div class="cat__year"></div><div class="cat__info"><div class="cat__t"></div><div class="cat__m"></div></div><div class="cat__n"></div></div>
      <div class="cat__comb" aria-hidden="true"></div><div class="cat__row"></div>
      <div class="cat__hint">Scroll · click a frame · drag the years</div>
      <nav class="cat__tl" aria-label="Years"><div class="cat__tl-line"><i class="cat__tl-pos"></i></div><div class="cat__tl-guide"><b></b></div></nav>
    </div><div class="cat__spacer"></div>`;
  const stage = root.querySelector('.cat__stage'), rowWrap = root.querySelector('.cat__row');
  const hudYear = root.querySelector('.cat__year'), hudTitle = root.querySelector('.cat__t'), hudMeta = root.querySelector('.cat__m'), hudNo = root.querySelector('.cat__n');
  const timeline = root.querySelector('.cat__tl');
  let timelinePos = root.querySelector('.cat__tl-pos'), guide = root.querySelector('.cat__tl-guide');
  const spacer = root.querySelector('.cat__spacer');
  const cardMap = new Map(), loadedSheets = new Set();
  const yearIndex = new Map();
  rows.forEach((r, i) => { if (!yearIndex.has(r[2])) yearIndex.set(r[2], i); });
  const y0 = rows[0][2], y1 = rows[rows.length - 1][2];
  let active = false, currentTarget = 0, current = 0, lastShown = -1, raf = 0, M = 400, J = innerHeight * .47;

  // Timeline: a tooth every half year, a button every year.
  let comb = '', buttons = '<div class="cat__tl-line"><i class="cat__tl-pos"></i></div><div class="cat__tl-guide"><b></b></div>';
  for (let h = y0 * 2; h <= y1 * 2; h++) {
    const year = h / 2;
    const klass = (h % 20 === 0 ? 'd' : h % 10 === 0 ? 'f' : h % 2 ? 'h' : '') + (yearIndex.has(Math.floor(year)) ? '' : ' e');
    comb += `<i class="${klass}" style="left:${((year - y0) / (y1 - y0) * 100).toFixed(3)}%"></i>`;
  }
  root.querySelector('.cat__comb').innerHTML = comb;
  for (let y = y0; y <= y1; y++) buttons += `<button type="button" style="left:${((y - y0) / (y1 - y0) * 100).toFixed(2)}%" data-y="${y}" aria-label="${y}"><span>${y % 10 === 0 ? y : ''}</span></button>`;
  timeline.innerHTML = buttons;
  timelinePos = timeline.querySelector('.cat__tl-pos'); guide = timeline.querySelector('.cat__tl-guide');

  const box = document.createElement('div');
  box.className = 'cat-box'; box.hidden = true;
  box.innerHTML = `<figure><div class="fr"><i></i><img alt=""></div><figcaption><span class="t"></span><span class="m"></span><a href="#">Open archive note ↗</a></figcaption></figure>`;
  document.body.appendChild(box);

  function topOfCatalogue() {
    return root.getBoundingClientRect().top - end.getBoundingClientRect().top + end.scrollTop;
  }
  function layout() {
    M = Math.min(innerHeight * (innerHeight > innerWidth || innerHeight < 520 ? .3 : .36), innerWidth * (innerWidth < 800 ? .6 : innerHeight > innerWidth ? .5 : .32), 520);
    J = innerHeight * (innerHeight < 520 ? .5 : .47);
    spacer.style.height = Math.round(rows.length * innerHeight * .2) + 'px';
    cardMap.forEach(o => o.el.remove()); cardMap.clear();
    if (active) schedule();
  }
  layout(); addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 180); }, { passive: true });

  function ratio(r) { return r[5] < 0 ? 1.25 : r[8] / r[9]; }
  function background(r, w, h) {
    if (r[5] < 0) return '';
    const s = sheets[r[5]];
    const c = Math.max(w / r[8], h / r[9]) * 1.012;
    const x = -r[6] * c - (r[8] * c - w) / 2;
    const y = -r[7] * c - (r[9] * c - h) / 2;
    return `background-image:url(${s.f});background-size:${(s.w * c).toFixed(1)}px ${(s.h * c).toFixed(1)}px;background-position:${x.toFixed(1)}px ${y.toFixed(1)}px`;
  }
  function hash(s) { let h = 0; for (const c of s) h = h * 31 + c.charCodeAt(0) | 0; return Math.abs(h); }
  function place(y) {
    return y < 1948 ? 'Lahore & Delhi' : y < 1963 ? 'Paris' : y < 1983 ? 'Tokyo' : y < 1998 ? 'Lisbon' : y < 2015 ? 'Reykjavík' : 'Lahore';
  }
  function makeCard(i) {
    const r = rows[i], q = ratio(r), h = Math.round(M), w = Math.round(M * Math.min(1.9, Math.max(.55, q)));
    const border = Math.round(M * (.035 + hash(r[0]) % 3 * .012));
    const variant = hash(r[0] + 'f') % 7;
    const el = document.createElement('div');
    el.className = 'cat__c'; el.dataset.i = i;
    el.innerHTML = `<div class="cat__f f${variant}${r[5] < 0 ? ' noimg' : ''} ld" style="width:${w}px;height:${h}px"><i style="left:${border}px;top:${border}px;width:${w - 2 * border}px;height:${h - 2 * border}px;${r[5] < 0 ? '' : background(r, w - 2 * border, h - 2 * border)}"></i></div><div class="cat__lab"></div>`;
    el.querySelector('.cat__lab').textContent = r[1];
    el._w = w; rowWrap.appendChild(el);
    return { el, sheet: r[5] };
  }
  function updateHud(i) {
    if (i === lastShown) return;
    lastShown = i; const r = rows[i];
    hudYear.textContent = r[2]; hudTitle.textContent = r[1];
    const material = r[3] === 'lost artwork' ? 'Lost' : r[3] === 'Private collection' ? 'Private collection' : r[3];
    hudMeta.innerHTML = `<span><b>${material}</b></span><span>${place(r[2])}</span><span>Painted at ${r[2] - 1926}</span>`;
    hudNo.innerHTML = `No. ${String(i + 1).padStart(4, '0')}<br>of ${rows.length.toLocaleString('en-US')}`;
    timelinePos.style.left = `${((r[2] - y0) / (y1 - y0) * 100).toFixed(2)}%`;
  }
  function draw() {
    if (!active) return;
    const a = Math.max(0, Math.floor(current) - 5), b = Math.min(rows.length - 1, Math.ceil(current) + 5);
    cardMap.forEach((o, i) => { if (i < a || i > b) { o.el.remove(); cardMap.delete(i); } });
    for (let i = a; i <= b; i++) if (!cardMap.has(i)) cardMap.set(i, makeCard(i));
    for (let i = a; i <= b; i++) {
      const o = cardMap.get(i), d = i - current, ad = Math.abs(d), sign = Math.sign(d);
      const x = innerWidth * .5 + d * M * .54;
      const z = -Math.min(ad, 1) * M * .5 - Math.max(0, ad - 1) * M * .2;
      const rot = -sign * Math.min(72, Math.min(ad, 1) * 50 + Math.max(0, ad - 1) * 3);
      const opacity = clamp((6.2 - ad) / 1.5);
      const dim = Math.min(.75, Math.max(0, ad - .35) * .2) + Math.min(.35, Math.max(0, ad - 1.6) * .12);
      const el = o.el;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${J.toFixed(1)}px,${z.toFixed(1)}px) translate(-50%,-50%) rotateY(${rot.toFixed(2)}deg)`;
      el.style.opacity = opacity.toFixed(3); el.style.setProperty('--dim', dim.toFixed(3));
      el.style.zIndex = String(1000 - Math.round(ad * 10));
      el.style.pointerEvents = opacity > .3 ? 'auto' : 'none';
    }
    updateHud(clamp(Math.round(current), 0, rows.length - 1) | 0);
  }
  function schedule() {
    if (raf) return;
    const tick = () => {
      raf = 0; if (!active) return;
      current += (currentTarget - current) * .085;
      if (Math.abs(currentTarget - current) < .0005) current = currentTarget;
      draw(); if (Math.abs(currentTarget - current) > .0005) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function readScroll() {
    if (!active) return;
    const t = clamp((end.scrollTop - topOfCatalogue()) / Math.max(1, spacer.offsetHeight));
    currentTarget = t * (rows.length - 1);
    const nearEnd = end.scrollTop + end.clientHeight >= end.scrollHeight - 8;
    document.body.dataset.fin = nearEnd ? '1' : '';
    schedule();
  }
  end.addEventListener('scroll', readScroll, { passive: true });

  function scrollToIndex(i, smoothBehavior = false) {
    i = clamp(i, 0, rows.length - 1) | 0;
    const delta = i - currentTarget;
    if (Math.abs(delta) > 4) current = i - Math.sign(delta) * 4;
    end.scrollTo({ top: topOfCatalogue() + i / (rows.length - 1) * spacer.offsetHeight, behavior: smoothBehavior ? 'smooth' : 'auto' });
    readScroll();
  }
  function seekYear(year) {
    let index = yearIndex.get(year);
    if (index == null) { for (let y = year; y <= y1; y++) if (yearIndex.has(y)) { index = yearIndex.get(y); break; } }
    if (index == null) index = rows.length - 1;
    scrollToIndex(index);
  }
  timeline.addEventListener('pointermove', e => {
    const r = timeline.getBoundingClientRect(), p = clamp((e.clientX - r.left) / r.width);
    guide.style.left = `${(p * 100).toFixed(2)}%`; guide.firstChild.textContent = Math.round(y0 + p * (y1 - y0));
  });
  timeline.addEventListener('click', e => {
    const button = e.target.closest('button'); let year;
    if (button) year = +button.dataset.y;
    else { const r = timeline.getBoundingClientRect(); year = Math.round(y0 + clamp((e.clientX - r.left) / r.width) * (y1 - y0)); }
    seekYear(year);
  });
  let dragging = false;
  const scrub = clientX => {
    const r = timeline.getBoundingClientRect(), p = clamp((clientX - r.left) / r.width);
    guide.style.left = `${(p * 100).toFixed(2)}%`; guide.firstChild.textContent = Math.round(y0 + p * (y1 - y0));
    seekYear(Math.round(y0 + p * (y1 - y0)));
  };
  timeline.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    e.preventDefault(); dragging = true; timeline.classList.add('is-scrub', 'is-drag');
    try { timeline.setPointerCapture(e.pointerId); } catch {}
    scrub(e.clientX);
  });
  timeline.addEventListener('pointermove', e => { if (dragging) scrub(e.clientX); });
  const stopDrag = e => { if (!dragging) return; dragging = false; timeline.classList.remove('is-drag'); try { timeline.releasePointerCapture(e.pointerId); } catch {} setTimeout(() => timeline.classList.remove('is-scrub'), 700); };
  timeline.addEventListener('pointerup', stopDrag); timeline.addEventListener('pointercancel', stopDrag);
  let touchY = false;
  timeline.addEventListener('touchstart', e => { touchY = true; timeline.classList.add('is-scrub'); scrub(e.touches[0].clientX); }, { passive: true });
  timeline.addEventListener('touchmove', e => { if (!touchY) return; e.preventDefault(); e.stopPropagation(); scrub(e.touches[0].clientX); }, { passive: false });
  const endTouch = () => { if (touchY) { touchY = false; setTimeout(() => timeline.classList.remove('is-scrub'), 700); } };
  timeline.addEventListener('touchend', endTouch, { passive: true }); timeline.addEventListener('touchcancel', endTouch, { passive: true });

  function openBox(i) {
    const r = rows[i]; if (!r) return;
    const maxW = Math.min(innerWidth * .92, 1100), maxH = innerHeight * .7;
    let w = maxW, h = w / ratio(r); if (h > maxH) { h = maxH; w = h * ratio(r); }
    const fr = box.querySelector('.fr'); fr.style.width = `${w}px`; fr.style.height = `${h}px`;
    box.querySelector('.fr i').style.cssText = r[5] < 0 ? '' : background(r, w, h);
    const img = box.querySelector('img'); img.className = ''; img.removeAttribute('src');
    img.onload = () => img.classList.add('ok');
    const artNumber = (Math.abs(r[5]) % 7) + 1;
    img.src = `./assets/images/work-${String(artNumber).padStart(2, '0')}.webp`;
    box.querySelector('.t').textContent = r[1];
    box.querySelector('.m').textContent = `${r[2]}${r[3] ? ' · ' + r[3] : ''} · ${r[4]}`;
    box.querySelector('a').href = `archive.html?id=${encodeURIComponent(r[0])}`;
    box.hidden = false; requestAnimationFrame(() => box.classList.add('open'));
    document.body.dataset.cursorLabel = 'Close';
  }
  function closeBox() {
    box.classList.remove('open'); document.body.dataset.cursorLabel = '';
    setTimeout(() => { box.hidden = true; }, 500);
  }
  root.addEventListener('click', e => { const card = e.target.closest('.cat__c'); if (card) openBox(+card.dataset.i); });
  box.addEventListener('click', e => { if (!e.target.closest('a')) closeBox(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) closeBox(); });

  function activate() {
    active = true;
    sheets.forEach((s, i) => {
      if (loadedSheets.has(i)) return;
      const img = new Image(); img.onload = () => {
        loadedSheets.add(i); cardMap.forEach(o => { if (o.sheet === i) o.el.querySelector('.cat__f').classList.add('ld'); });
      }; img.src = s.f;
    });
    readScroll();
  }
  function scrollIntoView() {
    end.scrollTo({ top: topOfCatalogue() + 8, behavior: 'smooth' });
    setTimeout(readScroll, 700);
  }

  return { activate, scrollIntoView, scrollToIndex, openBox, closeBox, get active() { return active; }, get count() { return rows.length; } };
}
