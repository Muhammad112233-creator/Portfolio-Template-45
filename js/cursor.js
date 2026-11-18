export function createCursor({ isHoldAllowed, onHoldComplete } = {}) {
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.createElement('div');
  root.className = 'cursor';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `<svg viewBox="0 0 60 60"><circle class="cursor__ring" cx="30" cy="30" r="22"/><circle class="cursor__hold" cx="30" cy="30" r="22"/></svg><span class="cursor__dot"></span><span class="cursor__lbl"></span>`;
  document.body.appendChild(root);
  const ring = root.querySelector('.cursor__ring');
  const hold = root.querySelector('.cursor__hold');
  const label = root.querySelector('.cursor__lbl');
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  let holding = false, progress = 0, downAt = 0, completed = false;
  let magnetic = null, magnetOffset = [0, 0], released = null, releaseOffset = [0, 0], lastLabel = '';
  const interactive = 'a[href],button,[role="button"],.snd,.x';
  const excluded = '.cat__tl,.cat__c,.cat-box,.end,.interlude';

  if (!fine) {
    root.remove();
    return { setHold() {}, setLabel() {}, get fine() { return false; }, destroy() {} };
  }
  document.body.classList.add('has-cursor');

  addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY;
    let target = e.target && e.target.closest ? e.target.closest(interactive) : null;
    if (target && (target.closest(excluded) || target.disabled)) target = null;
    const rect = target && target.getBoundingClientRect();
    if (rect && (rect.width > 360 || rect.height > 200 || rect.width < 4)) target = null;
    if (target !== magnetic) {
      if (magnetic) {
        magnetic.classList.remove('is-mag', 'is-mag-text', 'is-mag-fill');
        released = magnetic; releaseOffset = magnetOffset.slice();
      }
      magnetic = target; magnetOffset = [0, 0]; root.classList.remove('is-mag');
      if (magnetic) {
        if (magnetic === released) { magnetic.style.translate = ''; released = null; }
        const text = (magnetic.textContent || '').trim();
        const round = Math.abs(rect.width - rect.height) < 12 && !!magnetic.querySelector('svg');
        magnetic.classList.add('is-mag', (round || magnetic.matches('.go') || text.length < 2) ? 'is-mag-fill' : 'is-mag-text');
        root.classList.add('is-mag');
      }
    }
  }, { passive: true, capture: true });

  addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('button,a,input,.cat__tl,.end')) return;
    if (isHoldAllowed && !isHoldAllowed()) return;
    holding = true; completed = false; downAt = performance.now();
    document.body.dataset.holding = '1';
  }, { passive: true });

  const stopHold = () => {
    if (!holding) return;
    holding = false; document.body.dataset.holding = '';
  };
  addEventListener('pointerup', stopHold, { passive: true });
  addEventListener('pointercancel', stopHold, { passive: true });
  addEventListener('blur', stopHold);

  function frame(now) {
    const goalX = (() => {
      if (!magnetic) return tx;
      const r = magnetic.getBoundingClientRect();
      const cx = r.left + r.width / 2 - magnetOffset[0];
      const cy = r.top + r.height / 2 - magnetOffset[1];
      const dx = tx - cx, dy = ty - cy;
      const boost = magnetic.matches('.go') ? 1.6 : 1;
      const ox = Math.max(-8 * boost, Math.min(8 * boost, dx * .14 * boost));
      const oy = Math.max(-6 * boost, Math.min(6 * boost, dy * .14 * boost));
      magnetOffset[0] += (ox - magnetOffset[0]) * .2;
      magnetOffset[1] += (oy - magnetOffset[1]) * .2;
      magnetic.style.translate = `${magnetOffset[0].toFixed(1)}px ${magnetOffset[1].toFixed(1)}px`;
      return cx + dx * .2;
    })();
    const goalY = magnetic ? magnetic.getBoundingClientRect().top + magnetic.getBoundingClientRect().height / 2 - magnetOffset[1] + (ty - (magnetic.getBoundingClientRect().top + magnetic.getBoundingClientRect().height / 2 - magnetOffset[1])) * .2 : ty;
    x += (goalX - x) * .6; y += (goalY - y) * .6;
    root.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;

    if (released) {
      releaseOffset[0] *= .8; releaseOffset[1] *= .8;
      if (Math.abs(releaseOffset[0]) + Math.abs(releaseOffset[1]) < .1) { released.style.translate = ''; released = null; }
      else released.style.translate = `${releaseOffset[0].toFixed(1)}px ${releaseOffset[1].toFixed(1)}px`;
    }

    if (holding && !completed) {
      progress = Math.min(1, (now - downAt) / 1350);
      if (progress >= 1) { completed = true; holding = false; document.body.dataset.holding = ''; onHoldComplete && onHoldComplete(); }
    } else if (!holding) progress = Math.max(0, progress - .045);
    hold.style.strokeDashoffset = ((1 - progress) * 138.2).toFixed(1);
    root.classList.toggle('is-holding', progress > .02);
    ring.style.r = magnetic ? 18 : 22;

    let text = document.body.dataset.cursorLabel || '';
    if (!text && document.body.dataset.view === 'painting') text = 'Esc';
    if (label.textContent !== text) label.textContent = text;
    root.dataset.state = text;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    fine: true,
    setHold(value) { progress = Math.max(0, Math.min(1, value)); },
    setLabel(value) { document.body.dataset.cursorLabel = value || ''; },
    destroy() { root.remove(); document.body.classList.remove('has-cursor'); }
  };
}
