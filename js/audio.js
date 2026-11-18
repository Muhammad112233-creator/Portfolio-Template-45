// Small procedural soundscape — no external audio files, same Web Audio idea as the reference.
export function createAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, master = null, ambience = null, filter = null, lfo = null;
  let enabled = false, inPrologue = false, started = false;
  const voices = [];

  function build() {
    if (!AC || started) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    ambience = ctx.createGain();
    ambience.gain.value = 0.22;
    ambience.connect(master);

    // Four seconds of brown-ish noise: a room tone with air and water in it.
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.025 * white) / 1.025;
      data[i] = last * 3.2 + white * 0.018;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.5;
    noise.connect(filter).connect(ambience);
    noise.start();

    lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.045;
    lfoGain.gain.value = 190;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    // A slow, slightly detuned chord: felt more than heard.
    [55, 82.41, 110.3, 164.81].forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = ctx.createDelay(1.5);
      delay.delayTime.value = 0.31 + i * 0.17;
      osc.type = i % 2 ? 'sine' : 'triangle';
      osc.frequency.value = hz;
      osc.detune.value = (i - 1.5) * 4;
      gain.gain.value = 0.012 / (i + 1);
      osc.connect(gain).connect(ambience);
      gain.connect(delay).connect(ambience);
      osc.start();
      voices.push(osc);
    });
    started = true;
  }

  function target() {
    return enabled ? (inPrologue ? 0.11 : 0.34) : 0;
  }

  function fade() {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(target(), now, 0.45);
  }

  function unlock() {
    build();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    fade();
  }

  function setEnabled(on) {
    enabled = !!on;
    if (enabled) unlock();
    else fade();
    return enabled;
  }

  function setPrologue(on) {
    inPrologue = !!on;
    fade();
  }

  function cue(index = 0) {
    if (!enabled) return;
    unlock();
    if (!ctx) return;
    const now = ctx.currentTime;
    const scale = [220, 277.18, 329.63, 440, 554.37][index % 5];
    [1, 2.01, 3.02].forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = scale * mult;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.055 / (i + 1), now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8 + i * 0.4);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + 3.4 + i * 0.4);
    });
  }

  function click() {
    if (!enabled) return;
    unlock();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.055);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  return {
    unlock,
    setEnabled,
    toggle() { return setEnabled(!enabled); },
    setPrologue,
    cue,
    click,
    get enabled() { return enabled; },
    get context() { return ctx; }
  };
}
