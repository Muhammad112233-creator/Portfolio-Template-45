import { SITE, WORKS, ROOMS, LINKS } from './data.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = t => t * t * (3 - 2 * t);

export function mountUI({ audio, onEnter, onJump, onSoundChange, onClosePainting } = {}) {
  const root = document.createElement('div');
  root.className = 'ui';
  const linkAttrs = url => url.startsWith('http') ? ' target="_blank" rel="noopener"' : '';
  root.innerHTML = `
  <svg class="water-svg" aria-hidden="true" width="0" height="0">
    <defs>
      <filter id="dissolve" x="-10%" y="-30%" width="120%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="3" result="n"/>
        <feComponentTransfer in="n" result="m"><feFuncA id="dissolveA" type="linear" slope="22" intercept="20"/></feComponentTransfer>
        <feComposite in="SourceGraphic" in2="m" operator="in" result="cut"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="9" result="g"/>
        <feDisplacementMap id="dissolveD" in="cut" in2="g" scale="0" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="water" x="-5%" y="-20%" width="110%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.004 0.06" numOctaves="2" seed="7"><animate attributeName="baseFrequency" dur="7s" values="0.004 0.06;0.006 0.085;0.004 0.06" repeatCount="indefinite"/></feTurbulence>
        <feDisplacementMap id="waterMap" in="SourceGraphic" scale="4"/>
      </filter>
    </defs>
  </svg>
  <div class="u-shade u-shade--top"></div><div class="u-shade u-shade--bottom"></div>

  <div class="pre" id="pre">
    <div class="pre__eye"></div>
    <div class="pre__garden" aria-hidden="true">
      <div class="garden__sky"></div><div class="garden__under"></div><div class="garden__mid"></div>
      <div class="garden__bridge"></div><div class="g-dapple"></div><canvas class="petals"></canvas>
      <div class="garden__front"></div><div class="garden__vig"></div><i class="grain"></i>
    </div>
    <div class="cata"></div><div class="pre__blur"><i></i><i></i><i></i><i></i></div>
    <div class="lock" id="lock">
      <span class="lock__k"><i>${SITE.subject}</i><i>${SITE.dates}</i></span>
      <b class="lock__n"><span class="rise-in">1<em>0</em>0</span></b>
      <span class="lock__y"><span class="rise-in">Years</span></span>
      <span class="lock__s"><span class="rise-in">${SITE.shortTitle}</span></span>
    </div>
    <div class="reflection" aria-hidden="true"><b>100</b><span>${SITE.shortTitle}</span></div>
    <div class="load" aria-hidden="true">
      <div class="load__line"></div>
      <div class="load__num"><span class="load__digit">0</span><span class="load__digit">0</span><span class="load__digit">0</span></div>
      <div class="load__cap">100 years<br>${SITE.shortTitle}</div>
    </div>
    <div class="pre__slot">
      <p class="pre__intro">${SITE.intro}</p>
      <div class="enter">
        <button class="go" type="button" data-enter aria-label="Enter with sound">
          <svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="enterPath" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0"/></defs><text><textPath href="#enterPath" textLength="291" lengthAdjust="spacing">with sound · with sound · with sound ·</textPath></text></svg>
          <span class="go__t">Enter</span>
        </button>
        <button class="snd" type="button" data-hero-sound aria-pressed="true" aria-label="Sound on"><span class="snd__w" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="snd__t">Sound on</span></button>
      </div>
      <p class="holdhint">or click &amp; hold anywhere</p>
    </div>
    <p class="pre__legal">${SITE.legal}</p>
    <div class="pre__foot"><span class="u-lbl">${SITE.place}</span><span class="pre__num">0</span></div>
  </div>

  <nav class="nav" aria-label="Main">
    <div class="nav__l"><a href="#gallery" data-jump="gallery">Gallery</a><a href="#afterimages" data-jump="afterimages">Afterimages</a></div>
    <a href="#" class="logo" data-jump="top" aria-label="${SITE.name}, back to the start"><b>100</b><span>Years</span></a>
    <div class="nav__r"><a href="#works" data-jump="works">All works</a></div>
  </nav>
  <div class="top-mark"><b>100</b><span>Years</span></div>

  <header class="hud hud--top">
    <div class="corner"><span class="mark">${SITE.subject}</span><b>14.11.1926 — 05.12.2026</b></div>
    <div class="corner corner--r"><b>${SITE.hudRight}</b></div>
  </header>
  <footer class="hud hud--bottom" aria-label="Where you are">
    <div class="room u-lbl"><span>Room <em id="roomNo" style="font-style:normal">I</em></span><b id="roomName">Dawn</b></div>
    <div class="life" aria-hidden="true"><span class="u-lbl">1926</span><div class="life__track"><div class="life__fill"></div><div class="life__dot"></div><div class="life__year"></div></div><span class="u-lbl">2026</span></div>
    <div class="clock u-lbl"><span>Light</span><b id="clock">05:40</b></div>
  </footer>
  <button class="sound" id="soundBtn" type="button" aria-pressed="false" aria-label="Sound"><span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span id="soundLabel">Sound off</span></button>

  <div class="labels" id="labels" aria-hidden="true"></div>
  <div class="hover-hint" id="hoverHint">Hover the work to bring it to life</div>
  <div class="corridor-title" id="corridorTitle" aria-hidden="true">One light,<br>every hour.<small>Lanterns · Prisms · Rain · the North Window</small></div>
  <button class="scene-btn scene-btn--portal" type="button" data-jump="afterimages">Step into the chamber <span aria-hidden="true">→</span></button>
  <button class="scene-btn scene-btn--back" type="button" id="closePainting" aria-label="Back to the gallery"><span class="x" aria-hidden="true"></span><span class="x__t">Close <kbd>Esc</kbd></span></button>

  ${WORKS.map((w, i) => `
  <article class="card" data-card="${w.key}" aria-live="polite">
    <div class="card__meta u-lbl"><span>${w.place.split(' · ')[0]}</span><span>${w.yearLabel}</span></div>
    <div class="card__l"><p class="card__k"><i>${w.yearLabel}</i></p><h2 data-text="${w.title}">${w.title}</h2><p class="card__m">${w.medium}<br>${w.size}<br>${w.place.split(' · ')[1] || w.place}</p></div>
    <div class="card__body">${w.body.map(p => `<p>${p}</p>`).join('')}</div>
  </article>`).join('')}

  <section class="lilytext" aria-live="polite"><p class="k">${SITE.roomKicker}</p><h2>${SITE.roomTitle}</h2><p>${SITE.roomBody}</p></section>

  <div class="end" id="end" aria-label="End">
    <div class="end__first"><div class="end__in"><h2>${SITE.quote}</h2><p class="end__by">${SITE.quoteBy}</p></div></div>
    <div id="catalogue" class="cat"></div>
    <footer class="fin" id="fin">
      <div class="fin__g"><b>See the work</b><nav aria-label="Galleries">${LINKS.galleries.map(([label, url]) => `<a href="${url}"${linkAttrs(url)}>${label}</a>`).join('')}</nav></div>
      <div class="fin__g"><b>Sources &amp; further reading</b><nav aria-label="Sources">${LINKS.sources.map(([label, url]) => `<a href="${url}"${linkAttrs(url)}>${label}</a>`).join('')}</nav></div>
      <button type="button" class="fin__more" aria-expanded="false">Galleries &amp; sources</button>
      <div class="fin__g fin__g--end"><span>${SITE.footerNote}</span><a class="fin__by" href="#top" data-jump="top">${SITE.designedBy}</a><a href="#" data-jump="top">Back to the garden ↑</a></div>
    </footer>
  </div>
  <section class="outro" id="outro"><div class="outro__in"><p class="k">${SITE.outroKicker}</p><h2>${SITE.outroTitle}</h2><p>${SITE.outroBody}</p><p>${SITE.outroLast}</p></div></section>`;
  document.body.appendChild(root);

  const q = sel => root.querySelector(sel);
  const qa = sel => [...root.querySelectorAll(sel)];
  const pre = q('#pre'), digits = qa('.load__digit'), preNum = q('.pre__num');
  const heroSound = q('[data-hero-sound]'), soundBtn = q('#soundBtn'), soundLabel = q('#soundLabel');
  const roomNo = q('#roomNo'), roomName = q('#roomName'), clock = q('#clock'), fill = q('.life__fill'), dot = q('.life__dot'), yearEl = q('.life__year');
  const corridorTitle = q('#corridorTitle'), dissolveA = q('#dissolveA'), dissolveD = q('#dissolveD');
  const labelsWrap = q('#labels'), cards = qa('.card'), end = q('#end'), fin = q('#fin');
  let wantSound = true, entered = false, paintingIndex = null, lastRoom = '', lastClock = '', lastProgress = -1, lastPainting = -2;

  const labels = WORKS.map((w, i) => {
    const el = document.createElement('div');
    el.className = 'lab'; el.innerHTML = `<em>${w.label}</em><small>${w.yearLabel}</small>`;
    labelsWrap.appendChild(el); return el;
  });

  function ze(el, text) {
    let n = 0;
    el.innerHTML = text.split(' ').map(word => `<span style="white-space:nowrap;display:inline-block">${[...word].map(ch => `<span class="ch" style="transition-delay:${(n++) * 18}ms">${ch}</span>`).join('')}</span>`).join(' ');
  }

  function setLoadProgress(p) {
    p = clamp(p); pre.style.setProperty('--p', p.toFixed(3));
    const n = String(Math.round(p * 100)).padStart(3, '0');
    digits.forEach((d, i) => { if (d.textContent !== n[i]) { d.textContent = n[i]; d.classList.remove('is-spin'); void d.offsetWidth; d.classList.add('is-spin'); } });
    preNum.textContent = String(Math.round(p * 100));
  }

  function ready() {
    pre.classList.add('is-ready');
    document.body.dataset.ready = 'true';
    const status = document.querySelector('#status'); if (status) status.textContent = '';
  }

  function enterDone() {
    entered = true; pre.classList.add('is-done');
    document.documentElement.style.overflow = '';
  }

  function setSound(on) {
    soundBtn.classList.toggle('is-on', !!on);
    soundBtn.setAttribute('aria-pressed', String(!!on));
    soundBtn.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
    soundLabel.textContent = on ? 'Sound on' : 'Sound off';
    heroSound.classList.toggle('is-off', !wantSound);
    heroSound.querySelector('.snd__t').textContent = wantSound ? 'Sound on' : 'Sound off';
    heroSound.setAttribute('aria-pressed', String(wantSound));
  }

  q('[data-enter]').addEventListener('click', () => { if (!entered && pre.classList.contains('is-ready')) onEnter && onEnter(wantSound); });
  heroSound.addEventListener('click', e => {
    e.stopPropagation(); wantSound = !wantSound; setSound(audio.enabled); audio.click();
  });
  soundBtn.addEventListener('click', () => { const on = audio.toggle(); wantSound = on; setSound(on); onSoundChange && onSoundChange(on); });
  root.addEventListener('click', e => {
    const jump = e.target.closest('[data-jump]');
    if (jump) { e.preventDefault(); onJump && onJump(jump.dataset.jump); }
  });
  q('#closePainting').addEventListener('click', () => onClosePainting && onClosePainting());
  q('.fin__more').addEventListener('click', e => {
    const open = fin.classList.toggle('is-open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
  addEventListener('keydown', e => {
    if (e.key !== 'Enter' || entered || !pre.classList.contains('is-ready')) return;
    if (e.target.closest && e.target.closest('button,a,input')) return;
    e.preventDefault(); onEnter && onEnter(wantSound);
  });

  // Preloader parallax and drifting petals.
  const layers = qa('.garden__mid,.garden__bridge,.garden__front');
  let mx = 0, my = 0, sx = 0, sy = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  (function parallax() {
    sx += (mx - sx) * .08; sy += (my - sy) * .08;
    if (!entered) {
      q('.garden__front').style.transform = `translate3d(${-sx * 30}px,${-sy * 16}px,0) scale(1.07)`;
      q('.garden__mid').style.transform = `translate3d(${-sx * 9}px,${-sy * 4}px,0) scale(1.03)`;
      q('.garden__bridge').style.transform = `translate3d(${-sx * 9}px,${-sy * 4}px,0) scale(1.04)`;
    }
    requestAnimationFrame(parallax);
  })();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const pc = q('.petals'), pctx = pc.getContext('2d');
    let w = 0, h = 0;
    const resize = () => { w = pc.width = Math.round(innerWidth * Math.min(devicePixelRatio, 1.5)); h = pc.height = Math.round(innerHeight * Math.min(devicePixelRatio, 1.5)); };
    resize(); addEventListener('resize', resize, { passive: true });
    const colors = ['#f4c7cf','#eeb3c0','#fbe3e6','#fff3ee','#e99fb2','#f7d9b8'];
    const make = initial => ({ x: Math.random() * w, y: initial ? Math.random() * h : -20 - Math.random() * h * .3, r: (5 + Math.random() * 7) * w / 1440, vx: (.15 + Math.random() * .35) * w / 1440, vy: (.25 + Math.random() * .45) * h / 900, a: Math.random() * 6.28, va: (Math.random() - .5) * .04, f: Math.random() * 6.28, vf: .02 + Math.random() * .03, c: colors[Math.random() * colors.length | 0], o: .55 + Math.random() * .4 });
    const petals = Array.from({ length: innerWidth < 760 ? 18 : 34 }, () => make(true));
    let last = performance.now();
    (function petalsFrame(now) {
      if (entered) { pctx.clearRect(0, 0, w, h); return; }
      const dt = Math.min(3, (now - last) / 16.7); last = now;
      const wind = Math.sin(now / 2600) * .6 + Math.sin(now / 900) * .2;
      pctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.f += p.vf * dt; p.a += p.va * dt; p.x += (p.vx + wind * p.vx * 1.4 + Math.sin(p.f) * p.vx * .8) * dt; p.y += (p.vy + Math.cos(p.f * .7) * p.vy * .35) * dt;
        if (p.y > h + 20 || p.x > w + 30) Object.assign(p, make(false), { x: Math.random() * w * .9 - w * .1 });
        const flip = Math.abs(Math.sin(p.f)); pctx.save(); pctx.translate(p.x, p.y); pctx.rotate(p.a); pctx.scale(1, .35 + .65 * flip); pctx.globalAlpha = p.o * (.6 + .4 * flip); pctx.fillStyle = p.c; pctx.beginPath(); pctx.ellipse(0, 0, p.r, p.r * .62, 0, 0, 6.283); pctx.fill(); pctx.restore();
      }
      requestAnimationFrame(petalsFrame);
    })(last);
  }

  // Animated favicon, as a small opening lantern.
  const fav = document.querySelector('link[rel~="icon"]');
  if (fav && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const draw = t => {
      x.clearRect(0, 0, 64, 64); x.fillStyle = '#0b0d16'; x.fillRect(0, 0, 64, 64);
      const pulse = .7 + Math.sin(t / 700) * .3;
      x.save(); x.translate(32, 34); x.scale(1, .86); x.fillStyle = '#2f6b3a'; x.beginPath(); x.ellipse(0, 10, 25, 9, 0, 0, 6.283); x.fill(); x.restore();
      x.fillStyle = `rgba(252,244,225,${.72 + pulse * .2})`; x.beginPath(); x.ellipse(32, 31, 13 + pulse * 2, 17 + pulse * 2, 0, 0, 6.283); x.fill();
      x.fillStyle = '#e5a657'; x.beginPath(); x.ellipse(32, 34, 6, 7, 0, 0, 6.283); x.fill();
      fav.href = c.toDataURL('image/png');
    };
    draw(0); const timer = setInterval(() => { if (entered) { clearInterval(timer); draw(2600); } else draw(performance.now()); }, 125);
  }

  function setProgress(t) {
    t = clamp(t); if (Math.abs(t - lastProgress) < .0004 && paintingIndex === lastPainting) return; lastProgress = t; lastPainting = paintingIndex;
    const u = t * 5, i = Math.min(4, Math.floor(u)), f = u - i;
    const hour = ROOMS[i].hour + (ROOMS[i + 1].hour - ROOMS[i].hour) * f;
    const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 6) * 10;
    const time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    if (time !== lastClock) { clock.textContent = time; lastClock = time; }
    const room = ROOMS[Math.min(5, Math.floor(t * 6))];
    if (room.name !== lastRoom) { roomName.textContent = room.name; roomNo.textContent = room.numeral; lastRoom = room.name; }
    const y = paintingIndex === null ? 1926 + t * 100 : WORKS[paintingIndex].year;
    const p = clamp((y - 1926) / 100) * 100;
    fill.style.width = `${p.toFixed(2)}%`; dot.style.left = `${p.toFixed(2)}%`; yearEl.style.left = `${p.toFixed(2)}%`; yearEl.textContent = p < 2 ? '' : String(Math.round(y));

    const navGallery = root.querySelector('[data-jump="gallery"]'), navAfter = root.querySelector('[data-jump="afterimages"]');
    navGallery.classList.toggle('is-on', t < .76); navAfter.classList.toggle('is-on', t >= .76);
    document.body.classList.toggle('show-top-mark', t > .1 && t < .86);
    document.body.classList.toggle('show-portal', t > .69 && t < .8);
    document.body.classList.toggle('show-lilytext', t > .86 && t < .965);
    const inTitle = t > .265 && t < .37;
    document.body.classList.toggle('show-corridor-title', inTitle);
    if (inTitle) {
      const local = clamp((t - .265) / .105);
      dissolveA.setAttribute('intercept', (20 - local * 34).toFixed(2));
      dissolveD.setAttribute('scale', (local * 18).toFixed(2));
      corridorTitle.style.opacity = String(Math.min(1, local * 4) * (1 - smooth(clamp((local - .7) / .3))));
      corridorTitle.style.transform = `translate(-50%,-50%) scale(${(1 + local * .12).toFixed(3)})`;
    } else {
      corridorTitle.style.opacity = '0';
      corridorTitle.style.transform = 'translate(-50%,-50%)';
    }
    const caption = document.querySelector('#caption');
    if (caption) caption.textContent = 'Scroll — forward through the gallery · Hover — highlight · Click — approach';
  }

  function setLabels(data) {
    data.forEach((d, i) => {
      const el = labels[i]; if (!el) return;
      const x = clamp(d.x, 70, innerWidth - 70), y = clamp(d.y, 90, innerHeight - 140);
      el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(${d.side < 0 ? '0' : '-100%'},-50%)`;
      el.style.opacity = d.opacity.toFixed(3);
    });
    const show = data.some(d => d.opacity > .05) && document.body.dataset.view !== 'painting' && document.body.dataset.end !== '1';
    q('#hoverHint').classList.toggle('is-on', show);
  }

  function showPainting(index, side = 'r') {
    paintingIndex = index;
    document.body.dataset.view = 'painting';
    document.body.dataset.cursorLabel = 'Esc';
    cards.forEach((card, i) => {
      card.classList.toggle('is-on', i === index);
      card.classList.toggle('card--l', i === index && side === 'l');
      card.classList.toggle('card--r', i === index && side === 'r');
      if (i === index) {
        const h = card.querySelector('h2'); ze(h, WORKS[i].title);
        requestAnimationFrame(() => card.classList.add('is-in'));
      } else card.classList.remove('is-in');
    });
    const caption = document.querySelector('#caption'); if (caption) caption.textContent = WORKS[index].title;
  }
  function hidePainting() {
    paintingIndex = null;
    document.body.dataset.view = 'route';
    document.body.dataset.cursorLabel = '';
    cards.forEach(card => card.classList.remove('is-on', 'is-in'));
  }

  // Keep card body masks honest on small screens.
  setInterval(() => {
    cards.forEach(card => {
      const body = card.querySelector('.card__body');
      if (!card.classList.contains('is-on')) return;
      const more = body.scrollHeight > body.clientHeight + 4;
      body.classList.toggle('is-more', more && body.scrollTop + body.clientHeight < body.scrollHeight - 4);
      body.classList.toggle('is-end', more && body.scrollTop + body.clientHeight >= body.scrollHeight - 4);
    });
  }, 150);

  setSound(audio.enabled);
  return {
    root, pre, end, fin,
    get wantSound() { return wantSound; },
    get entered() { return entered; },
    get paintingIndex() { return paintingIndex; },
    setLoadProgress, ready, enterDone, setSound, setProgress, setLabels, showPainting, hidePainting
  };
}
