import { PROLOGUE } from './data.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => t * t * (3 - 2 * t);

export function createInterlude({ audio, onFinish, onSoundChange } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.createElement('section');
  root.className = 'interlude';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `<canvas></canvas><div class="interlude__cata"></div><div class="interlude__edge"></div><div class="interlude__grain"></div><div class="interlude__year"></div>
    <div class="interlude__page" data-place="bl"><div class="interlude__lab"><span></span><i><b></b></i></div><p class="interlude__txt" aria-live="polite"></p></div>
    <div class="interlude__dots">${PROLOGUE.map(() => '<i><b></b></i>').join('')}</div>
    <div class="interlude__hint"><span>Scroll</span><i></i></div>
    <div class="interlude__ui"><button type="button" data-k="snd"><span class="interlude__w" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="interlude__l"></span></button><button type="button" data-k="skip">Skip</button></div>`;
  document.body.appendChild(root);

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const page = root.querySelector('.interlude__page');
  const chapterLabel = root.querySelector('.interlude__lab span');
  const chapterBar = root.querySelector('.interlude__lab b');
  const text = root.querySelector('.interlude__txt');
  const year = root.querySelector('.interlude__year');
  const dots = [...root.querySelectorAll('.interlude__dots b')];
  const hint = root.querySelector('.interlude__hint');
  const sndButton = root.querySelector('[data-k="snd"]');
  const skipButton = root.querySelector('[data-k="skip"]');

  let orientation = innerHeight > innerWidth ? 'v' : 'd';
  const frames = new Array(60), ready = new Uint8Array(60);
  const framePath = i => `./prologue/${orientation}/${String(i + 1).padStart(3, '0')}.webp`;
  function loadFrame(i) {
    return new Promise(resolve => {
      if (ready[i]) return resolve();
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { ready[i] = 1; resolve(); drawIfIdle(); };
      img.onerror = () => resolve();
      img.src = framePath(i);
      frames[i] = img;
    });
  }
  function preload(indices, concurrency = 5) {
    let cursor = 0;
    return Promise.all(Array.from({ length: concurrency }, async () => {
      while (cursor < indices.length) await loadFrame(indices[cursor++]);
    }));
  }
  function nearest(i) {
    if (ready[i]) return i;
    for (let d = 1; d < 60; d++) { if (ready[i - d]) return i - d; if (ready[i + d]) return i + d; }
    return -1;
  }

  let active = false, finished = false, done = null, r = 0, s = 0, chapter = -1, words = [], shown = 0, lastInput = -1e9, raf = 0, lastTime = 0, touchY = null;
  const width = PROLOGUE.length + .45;

  function soundLabel() {
    sndButton.querySelector('.interlude__l').textContent = audio.enabled ? 'Sound on' : 'Sound off';
    sndButton.classList.toggle('is-off', !audio.enabled);
    sndButton.setAttribute('aria-pressed', String(audio.enabled));
  }
  sndButton.addEventListener('click', e => {
    e.stopPropagation();
    const on = audio.toggle();
    onSoundChange && onSoundChange(on);
    soundLabel();
  });
  skipButton.addEventListener('click', e => { e.stopPropagation(); skip(); });

  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  addEventListener('resize', () => {
    const next = innerHeight > innerWidth ? 'v' : 'd';
    if (next !== orientation) {
      orientation = next; frames.fill(undefined); ready.fill(0);
      preload(Array.from({ length: 60 }, (_, i) => i), 4);
    }
    if (active) { sizeCanvas(); drawIfIdle(); }
  }, { passive: true });

  function drawImageCover(img, alpha = 1, scale = 1) {
    if (!img || !img.naturalWidth) return;
    const w = canvas.width, h = canvas.height;
    const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight) * scale;
    const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    ctx.globalAlpha = 1;
  }

  function setChapter(c) {
    if (c === chapter) return;
    chapter = c;
    const item = PROLOGUE[c];
    page.classList.add('swap');
    setTimeout(() => {
      if (chapter !== c) return;
      page.dataset.place = item.place;
      chapterLabel.textContent = item.label;
      text.innerHTML = item.text.split(' ').map(word => `<span>${word}</span>`).join(' ');
      words = [...text.children]; shown = 0;
      page.classList.remove('swap');
    }, 340);
    if (audio.enabled) audio.cue(c);
  }
  function showWords(n) {
    n = clamp(Math.round(n), 0, words.length);
    if (n === shown) return;
    shown = n;
    words.forEach((el, i) => el.classList.toggle('on', i < n));
  }

  function draw() {
    if (!active) return;
    const c = Math.min(PROLOGUE.length - 1, Math.floor(s));
    const local = Math.min(1, s - c);
    const item = PROLOGUE[c];
    const exact = item.from + (item.to - item.from) * local;
    const a = Math.floor(exact), b = Math.min(59, a + 1), mix = exact - a;
    const ia = nearest(a), ib = nearest(b);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (ia >= 0) drawImageCover(frames[ia], 1, 1 + s * .012);
    if (ib >= 0 && ib !== ia && mix > .02) drawImageCover(frames[ib], mix, 1 + s * .012);

    const veil = Math.max(0, 1 - s * 4) * .7 + Math.max(0, (s - (PROLOGUE.length - .5)) / .5) * .18;
    root.style.setProperty('--veil', veil.toFixed(3));
    const fadeOut = smooth(clamp((s - (PROLOGUE.length - .12)) / .45));
    root.style.opacity = active ? (1 - fadeOut).toFixed(3) : '';
    root.style.background = fadeOut > 0 ? 'transparent' : '';

    setChapter(c);
    showWords(words.length * Math.min(1, local * 1.12));
    chapterBar.style.transform = `scaleX(${local.toFixed(3)})`;
    dots.forEach((dot, i) => dot.style.transform = `scaleX(${clamp(s - i, 0, 1).toFixed(3)})`);
    year.textContent = Math.round(item.years[0] + (item.years[1] - item.years[0]) * smooth(local));
    year.style.opacity = (1 - fadeOut).toFixed(3);
    hint.classList.toggle('on', s < .08 || (local > .94 && !audio.enabled));
    page.style.opacity = (1 - fadeOut).toFixed(3);
  }
  function drawIfIdle() { if (!raf) { raf = requestAnimationFrame(() => { raf = 0; draw(); }); } }

  function tick(now) {
    if (!active) return;
    const dt = Math.min(.1, (now - (lastTime || now)) / 1000); lastTime = now;
    if (now - lastInput > 1500 && s < width) r = Math.min(width, Math.max(r, s) + dt * .24);
    const ease = (now - lastInput > 1500) ? 1 - Math.exp(-dt * 3.2) : 1 - Math.exp(-dt * 7);
    s += (r - s) * ease;
    if (Math.abs(r - s) < .0005) s = r;
    draw();
    if (s >= width - .008) return finish();
    requestAnimationFrame(tick);
  }

  function input(delta) {
    if (!active) return;
    lastInput = performance.now();
    r = clamp(r + delta, 0, width);
  }
  addEventListener('wheel', e => { if (active) { e.preventDefault(); input((e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY) / 1500); } }, { passive: false });
  addEventListener('touchstart', e => { if (active) touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', e => {
    if (!active || touchY == null) return;
    e.preventDefault(); const y = e.touches[0].clientY; input((touchY - y) * 2.2 / 1500); touchY = y;
  }, { passive: false });
  addEventListener('keydown', e => {
    if (!active) return;
    if (e.key === 'Escape') { skip(); return; }
    const map = { ArrowDown: 220, PageDown: 900, ' ': 900, ArrowUp: -220, PageUp: -900 };
    if (map[e.key] != null) { e.preventDefault(); input(map[e.key] / 1500); }
  });

  function play(callback) {
    if (reduced || active || finished) { callback && callback(); return; }
    done = callback; active = true; r = s = 0; lastInput = performance.now(); lastTime = 0;
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('interlude-active');
    root.style.display = ''; root.classList.add('on'); root.classList.remove('out'); root.removeAttribute('aria-hidden');
    sizeCanvas(); soundLabel(); audio.setPrologue(true);
    preload([0, 1, 2, 3, 4, 5, 19, 20, 21, 39, 40, 41, 58, 59], 4).then(() => {
      preload(Array.from({ length: 60 }, (_, i) => i), 4);
    });
    setChapter(0); draw(); requestAnimationFrame(tick);
  }

  function finish() {
    if (!active) return;
    active = false; finished = true; audio.setPrologue(false);
    document.documentElement.style.overflow = '';
    document.body.classList.remove('interlude-active', 'mui-door');
    root.classList.add('out'); root.classList.remove('on'); root.setAttribute('aria-hidden', 'true');
    setTimeout(() => { root.style.display = 'none'; }, 1150);
    const cb = done; done = null; cb && cb();
  }
  function skip() { if (active) { r = width; s = width - .02; draw(); finish(); } }

  return {
    play, skip,
    state: () => ({ pos: s, target: r, active }),
    get active() { return active; }
  };
}
