import { SITE, WORKS } from './data.js';
import { createAudio } from './audio.js';
import { createCursor } from './cursor.js';
import { mountUI } from './ui.js';
import { createScene } from './scene.js';
import { createInterlude } from './interlude.js';
import { createCatalogue } from './catalogue.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);
document.documentElement.style.overflow = 'hidden';
document.body.dataset.view = 'route';
document.body.dataset.hovered = 'none';

const audio = createAudio();
let ui, scene, interlude, catalogue, cursor;
let sceneReady = false, lastProgress = 0, pointerX = innerWidth / 2;
let upWheel = 0, upTouch = 0, lastEndTouch = 0, touchY = null;

addEventListener('pointerdown', () => audio.unlock(), { passive: true });
addEventListener('pointermove', e => { pointerX = e.clientX; }, { passive: true, capture: true });

ui = mountUI({
  audio,
  onEnter: enter,
  onJump: jump,
  onSoundChange: on => { ui.setSound(on); },
  onClosePainting: closePainting
});

scene = createScene(document.querySelector('#scene'), {
  works: WORKS,
  onHover: index => cursor && cursor.setLabel(index >= 0 ? 'Open' : ''),
  onOpen: openPainting,
  onLabels: labels => ui && ui.setLabels(labels),
  onReady: ok => { document.body.dataset.webgl = ok ? '1' : '0'; },
  onFrame: state => { document.body.dataset.cameraZ = state.cameraZ.toFixed(1); }
});
scene.ready.catch(() => {}).then(() => { sceneReady = true; document.body.dataset.sceneReady = 'true'; });

catalogue = createCatalogue({ end: ui.end });
interlude = createInterlude({
  audio,
  onFinish: () => {
    document.documentElement.style.overflow = '';
    const top = innerHeight * (innerHeight > innerWidth * 1.15 ? .12 : .9);
    scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  },
  onSoundChange: on => ui.setSound(on)
});
cursor = createCursor({
  isHoldAllowed: () => ui.pre.classList.contains('is-ready') && !ui.entered,
  onHoldComplete: () => enter(ui.wantSound)
});

window.Noor100 = { audio, ui, scene, interlude, catalogue, cursor, SITE, WORKS };

function enter(withSound) {
  if (ui.entered) return;
  audio.setEnabled(!!withSound);
  ui.setSound(audio.enabled);
  document.body.classList.add('walking', 'mui-door');
  ui.enterDone();
  audio.click();
  interlude.play(() => {
    document.documentElement.style.overflow = '';
    document.body.classList.remove('mui-door');
    const top = innerHeight * (innerHeight > innerWidth * 1.15 ? .12 : .9);
    scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  });
}

function openPainting(index) {
  if (document.body.dataset.end === '1') return;
  const side = pointerX > innerWidth / 2 ? 'l' : 'r';
  ui.showPainting(index, side);
  cursor.setLabel('Esc');
  audio.click();
  ui.setProgress(lastProgress);
}
function closePainting() {
  if (document.body.dataset.view !== 'painting') return;
  ui.hidePainting(); scene.release(); cursor.setLabel(''); ui.setProgress(lastProgress);
}

function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - innerHeight); }
function enterEnd() {
  if (document.body.dataset.end === '1') return;
  closePainting();
  document.body.dataset.end = '1';
  document.body.dataset.view = 'route';
  document.documentElement.style.overflow = 'hidden';
  scene.setProgress(1); ui.setProgress(1);
  catalogue.activate();
}
function leaveEnd(targetY = maxScroll() - innerHeight * 1.2) {
  document.body.dataset.end = '';
  document.body.dataset.fin = '';
  document.body.dataset.cursorLabel = '';
  ui.end.scrollTop = 0;
  document.documentElement.style.overflow = '';
  scrollTo({ top: Math.max(0, targetY), behavior: reduced ? 'auto' : 'smooth' });
  const t = clamp(Math.max(0, targetY) / maxScroll());
  scene.setProgress(t); ui.setProgress(t);
}

function jump(target) {
  if (!ui.entered) return;
  const max = maxScroll();
  if (target === 'works') {
    window.__toCat = true;
    scrollTo(0, max);
    enterEnd();
    catalogue.activate();
    setTimeout(() => catalogue.scrollIntoView(), reduced ? 50 : 420);
    setTimeout(() => { window.__toCat = false; }, 1200);
    return;
  }
  if (document.body.dataset.end === '1') leaveEnd(0);
  if (target === 'top') { scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
  if (target === 'gallery') { scrollTo({ top: innerHeight * .9, behavior: reduced ? 'auto' : 'smooth' }); return; }
  if (target === 'afterimages') { scrollTo({ top: max * .92, behavior: reduced ? 'auto' : 'smooth' }); return; }
}

// The long page scroll drives the 3D camera and all HUD states.
addEventListener('scroll', () => {
  if (!ui.entered || document.body.classList.contains('interlude-active')) return;
  const t = clamp(scrollY / maxScroll());
  lastProgress = t;
  scene.setProgress(t); ui.setProgress(t);
  if (t > .992 && document.body.dataset.end !== '1') enterEnd();
}, { passive: true });

// Before entry, the page refuses to move. At the end, the wheel is handed to the end scroller.
addEventListener('wheel', e => {
  if (!ui.entered) { e.preventDefault(); return; }
  if (document.body.dataset.end !== '1' || document.querySelector('.cat-box.open')) return;
  e.preventDefault();
  const delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
  const atTop = ui.end.scrollTop <= 1;
  const atBottom = ui.end.scrollTop + ui.end.clientHeight >= ui.end.scrollHeight - 1;
  if (delta < 0 && atTop) {
    upWheel += delta;
    if (upWheel < -260) { upWheel = 0; leaveEnd(); }
  } else {
    upWheel = 0;
    if (!(delta > 0 && atBottom)) ui.end.scrollTop += delta;
  }
}, { passive: false });

addEventListener('touchstart', e => { touchY = e.touches[0]?.clientY ?? null; }, { passive: true });
addEventListener('touchmove', e => {
  if (!ui.entered) { e.preventDefault(); return; }
  if (document.body.dataset.end !== '1' || e.target.closest('.cat__tl') || document.querySelector('.cat-box.open')) return;
  if (touchY == null) return;
  e.preventDefault();
  const y = e.touches[0].clientY, delta = (touchY - y) * 2.2; touchY = y;
  const atTop = ui.end.scrollTop <= 1;
  const atBottom = ui.end.scrollTop + ui.end.clientHeight >= ui.end.scrollHeight - 1;
  if (delta < 0 && atTop) {
    const now = performance.now(); if (now - lastEndTouch > 600) upTouch = 0; lastEndTouch = now; upTouch += delta;
    if (upTouch < -260) { upTouch = 0; leaveEnd(); }
  } else {
    upTouch = 0; if (!(delta > 0 && atBottom)) ui.end.scrollTop += delta;
  }
}, { passive: false });

const blockedKeys = new Set(['ArrowDown','ArrowUp','PageDown','PageUp',' ','Home','End']);
addEventListener('keydown', e => {
  if (!ui.entered && blockedKeys.has(e.key)) e.preventDefault();
  if (e.key === 'Escape') {
    if (document.body.dataset.view === 'painting') closePainting();
    else if (document.body.dataset.end === '1') leaveEnd();
  }
});
addEventListener('scroll', () => { if (!ui.entered && scrollY > 2) scrollTo(0, 0); }, { passive: true });

// 0–100 loading state, tied to the real local asset load and a minimum door dwell.
const start = performance.now();
const minMs = reduced ? 250 : 4400;
Promise.race([scene.ready.catch(() => {}), new Promise(resolve => setTimeout(resolve, 8000))]).then(() => { sceneReady = true; });
(function load(now) {
  const time = clamp((now - start) / minMs);
  const p = sceneReady || time < .94 ? time : Math.min(time, .94);
  ui.setLoadProgress(p);
  if (time >= 1 && sceneReady) { ui.ready(); return; }
  requestAnimationFrame(load);
})(start);
