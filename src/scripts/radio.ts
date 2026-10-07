/* ------------------------------------------------------------------ *
 * 107.5 FM: behaviour of the newspaper's radio.
 *
 * Never makes a sound unless the reader switches it on. A remembered
 * "on" resumes on the next page only within the same browsing moment
 * (sessionStorage + a short time window) and only if the browser
 * itself allows playback without a new gesture; otherwise the radio
 * waits, switched on but silent, for one press.
 *
 * The station runs on a clock: every page, and every return, joins the
 * programme where it is "now". With no programme configured, switching
 * on finds «لا توجد إشارة».
 * ------------------------------------------------------------------ */
import { safeStorage } from './data';

interface Track {
  src: string;
  duration: number | null;
}
interface RadioConfig {
  frequency: number;
  label: string;
  min: number;
  max: number;
  capture: number;
  returnAfterMs: number;
  defaultVolume: number;
  resumeWindowMs: number;
  noSignal: string;
  tracks: Track[];
}
type State = 'off' | 'standby' | 'tuning-in' | 'playing' | 'nosignal';

const VOLUME_KEY = 'qqak:radio-volume';
const OPEN_KEY = 'qqak:radio-open';
const SESSION_KEY = 'qqak:radio';
const local = safeStorage('local');
const session = safeStorage('session');
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initRadio(): void {
  const root = document.querySelector<HTMLElement>('[data-radio]');
  if (!root) return;
  const cfgEl = root.querySelector('[data-radio-config]');
  const audio = root.querySelector<HTMLAudioElement>('[data-radio-audio]');
  const power = root.querySelector<HTMLButtonElement>('[data-radio-power]');
  const volumeKnob = root.querySelector<HTMLElement>('[data-radio-volume]');
  const tuneKnob = root.querySelector<HTMLElement>('[data-radio-tune]');
  const readout = root.querySelector<HTMLElement>('[data-radio-readout]');
  const signal = root.querySelector<HTMLElement>('[data-radio-signal]');
  if (!cfgEl?.textContent || !audio || !power || !volumeKnob || !tuneKnob || !readout || !signal) return;
  const cfg = JSON.parse(cfgEl.textContent) as RadioConfig;

  let state: State = 'off';
  let volume = clamp(local.read<number>(VOLUME_KEY) ?? cfg.defaultVolume, 0, 100);
  let freq = cfg.frequency;
  let returnTimer: number | undefined;
  let driftFrame: number | undefined;

  /* ---- sound path: element → station gain → volume → speakers;
          quiet generated noise for detuning. Built on first switch-on. */
  let ctx: AudioContext | null = null;
  let stationGain: GainNode | null = null;
  let masterGain: GainNode | null = null;
  let noiseGain: GainNode | null = null;
  const audioCtx = (): AudioContext | null => ctx; // read through closures (keeps TS narrowing honest)

  function buildGraph(): void {
    if (ctx) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return; // fall back to element volume
    try {
      ctx = new AC();
      masterGain = ctx.createGain();
      stationGain = ctx.createGain();
      noiseGain = ctx.createGain();
      noiseGain.gain.value = 0;
      ctx.createMediaElementSource(audio!).connect(stationGain).connect(masterGain).connect(ctx.destination);
      // a second of soft noise, looped, for the space between stations
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      noise.connect(noiseGain).connect(masterGain);
      noise.start();
    } catch {
      ctx = null;
    }
  }

  function applyVolume(): void {
    const v = volume / 100;
    const level = v * v; // perceptual curve
    if (masterGain && ctx) masterGain.gain.setTargetAtTime(level, ctx.currentTime, 0.05);
    else audio!.volume = level * reception();
    root!.dataset.volume = level.toFixed(3);
  }

  const onStation = () => Math.abs(freq - cfg.frequency) <= cfg.capture;

  /** 1 = clear on 107.5 … 0 = nothing: the programme fades as the needle leaves */
  function reception(): number {
    const away = Math.abs(freq - cfg.frequency);
    return clamp(1 - Math.max(0, away - 0.1) / 0.6, 0, 1);
  }

  function applyReception(): void {
    const tuned = onStation();
    const clear = reception();
    // on 107.5 with nothing to receive: «لا توجد إشارة»;
    // while the needle wanders, the dial shows where it is
    signal!.hidden = !(state === 'nosignal' && tuned);
    readout!.hidden = !signal!.hidden;
    root!.classList.toggle('is-detuned', !tuned && state !== 'off');
    root!.dataset.reception = clear.toFixed(2);
    const t = ctx?.currentTime ?? 0;
    stationGain?.gain.setTargetAtTime(clear, t, 0.08);
    const hiss = state !== 'off' && state !== 'standby' ? (1 - clear) * 0.035 : 0;
    noiseGain?.gain.setTargetAtTime(hiss, t, 0.08);
    if (!stationGain) {
      const v = volume / 100;
      audio!.volume = v * v * clear;
    }
  }

  /* ---- the station clock: where the programme is "now" ----------------
     Deterministic: position = (now in seconds) mod (programme length),
     so every page, every visitor and every return agrees on what 107.5
     is broadcasting. The programme exists whether or not anyone listens. */
  const failed = new Set<number>(); // items that would not load this visit

  function schedulePosition(): { index: number; offset: number } | null {
    const tracks = cfg.tracks;
    if (!tracks.length) return null;
    const durations = tracks.map((t, i) => t.duration ?? (i === 0 && audio!.duration > 0 ? audio!.duration : null));
    if (durations.some((d) => !d)) return { index: 0, offset: tracks.length === 1 ? NaN : 0 };
    return stationPosition(durations as number[], Date.now());
  }

  let trackIndex = -1;
  let switching = false;

  /** tune the receiver to whatever the programme is playing right now */
  function joinProgramme(): Promise<void> {
    let pos = schedulePosition();
    if (!pos) return Promise.reject(new Error('no programme'));
    // a broken item is skipped: the station carries on with the next one
    for (let n = 0; n < cfg.tracks.length && failed.has(pos.index); n++) {
      pos = { index: (pos.index + 1) % cfg.tracks.length, offset: 0 };
    }
    if (failed.has(pos.index)) return Promise.reject(new Error('no signal'));
    const target = pos;
    trackIndex = target.index;
    const src = cfg.tracks[trackIndex].src;
    if (!audio!.src.endsWith(src)) {
      audio!.src = src;
      audio!.preload = 'auto';
    }
    const seek = () => {
      const d = audio!.duration;
      if (!(d > 0)) return;
      const p = schedulePosition();
      const offset = Number.isNaN(target.offset) ? (Date.now() / 1000) % d : p && p.index === trackIndex ? p.offset : target.offset;
      audio!.currentTime = Math.min(Math.max(0, offset), Math.max(0, d - 0.5));
    };
    if (audio!.readyState >= 1) seek();
    else audio!.addEventListener('loadedmetadata', seek, { once: true });
    return audio!.play();
  }

  /* the next item is fetched shortly before it airs, not before */
  const preloader = new Audio();
  preloader.preload = 'none';
  let preloadedFor = -1;
  audio.addEventListener('timeupdate', () => {
    if (state !== 'playing' || cfg.tracks.length < 2 || !(audio.duration > 0)) return;
    if (audio.duration - audio.currentTime > 25) return;
    const next = (trackIndex + 1) % cfg.tracks.length;
    if (preloadedFor === next || failed.has(next)) return;
    preloadedFor = next;
    preloader.preload = 'auto';
    preloader.src = cfg.tracks[next].src;
    preloader.load();
  });

  // an item ends: the station moves on to what the clock says is next
  audio.addEventListener('ended', () => {
    if (state !== 'playing' || switching) return;
    switching = true;
    joinProgramme()
      .catch(() => (state === 'playing' ? setState('standby') : undefined))
      .finally(() => (switching = false));
  });

  // a file that will not load is a reception problem, never a crash
  audio.addEventListener('error', () => {
    if (state === 'off' || state === 'standby' || !audio.getAttribute('src')) return;
    if (trackIndex >= 0) failed.add(trackIndex);
    setState('nosignal');
    if (failed.size >= cfg.tracks.length) return; // nothing left to receive
    window.setTimeout(() => {
      if (state !== 'nosignal') return;
      setState('tuning-in');
      joinProgramme()
        .then(() => setState('playing'))
        .catch(() => setState('nosignal'));
    }, 1500);
  });

  /* ---- states */
  function setState(next: State): void {
    state = next;
    root!.dataset.state = next;
    power!.setAttribute('aria-pressed', String(next !== 'off'));
    root!.querySelector('[data-radio-toggle]')?.classList.toggle('is-on', next === 'playing' || next === 'nosignal');
    applyReception();
    session.write(SESSION_KEY, next === 'off' ? { on: false, ts: Date.now() } : { on: true, ts: Date.now() });
  }

  function switchOn(): void {
    buildGraph();
    audioCtx()?.resume().catch(() => {});
    applyVolume();
    freq = cfg.frequency; // switching on always finds 107.5
    renderTuning();
    if (!cfg.tracks.length) return setState('nosignal');
    setState('tuning-in');
    joinProgramme()
      .then(() => setState('playing'))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'NotAllowedError') setState('standby');
        else if (state === 'tuning-in') setState('nosignal');
      });
  }

  function switchOff(): void {
    audio!.pause();
    setState('off');
  }

  power.addEventListener('click', () => {
    if (state === 'off' || state === 'standby') switchOn();
    else switchOff();
  });

  /* ---- knobs: pointer drag, keys; rotation follows the value */
  function bindKnob(
    knob: HTMLElement,
    opts: { get: () => number; set: (v: number) => void; min: number; max: number; step: number; page: number; perPixel: number },
  ): void {
    const update = (v: number) => opts.set(clamp(v, opts.min, opts.max));
    knob.addEventListener('keydown', (e) => {
      const map: Record<string, number> = {
        ArrowUp: opts.step, ArrowRight: opts.step, ArrowDown: -opts.step, ArrowLeft: -opts.step,
        PageUp: opts.page, PageDown: -opts.page,
      };
      if (e.key in map) update(opts.get() + map[e.key]);
      else if (e.key === 'Home') update(opts.min);
      else if (e.key === 'End') update(opts.max);
      else return;
      e.preventDefault();
    });
    knob.addEventListener('pointerdown', (e) => {
      knob.setPointerCapture(e.pointerId);
      knob.focus({ preventScroll: true });
      let lastY = e.clientY;
      let lastX = e.clientX;
      const move = (ev: PointerEvent) => {
        const delta = lastY - ev.clientY + (lastX - ev.clientX) * -1; // up or left (RTL) turns it up
        lastY = ev.clientY;
        lastX = ev.clientX;
        update(opts.get() + delta * opts.perPixel);
      };
      const up = () => {
        knob.removeEventListener('pointermove', move);
        knob.removeEventListener('pointerup', up);
        knob.removeEventListener('pointercancel', up);
      };
      knob.addEventListener('pointermove', move);
      knob.addEventListener('pointerup', up);
      knob.addEventListener('pointercancel', up);
    });
  }

  function renderVolume(): void {
    const v = Math.round(volume);
    volumeKnob!.setAttribute('aria-valuenow', String(v));
    volumeKnob!.setAttribute('aria-valuetext', `${v}٪`);
    volumeKnob!.style.setProperty('--turn', `${-135 + (v / 100) * 270}deg`);
  }

  function renderTuning(): void {
    const label = Math.abs(freq - cfg.frequency) < 0.05 ? cfg.label : `${freq.toFixed(1)} FM`;
    tuneKnob!.setAttribute('aria-valuenow', freq.toFixed(1));
    tuneKnob!.setAttribute('aria-valuetext', label);
    tuneKnob!.style.setProperty('--turn', `${((freq - cfg.min) / (cfg.max - cfg.min)) * 300 - 150}deg`);
    root!.style.setProperty('--needle-k', String((freq - cfg.min) / (cfg.max - cfg.min)));
    readout!.textContent = label;
    applyReception();
  }

  /** nothing out there: after a while the needle finds its way home */
  function scheduleReturn(): void {
    window.clearTimeout(returnTimer);
    if (driftFrame) cancelAnimationFrame(driftFrame);
    if (onStation()) {
      if (freq !== cfg.frequency) {
        freq = cfg.frequency;
        renderTuning();
      }
      return;
    }
    returnTimer = window.setTimeout(() => {
      if (reducedMotion()) {
        freq = cfg.frequency;
        renderTuning();
        return;
      }
      const from = freq;
      const start = performance.now();
      const dur = 700 + Math.min(900, Math.abs(cfg.frequency - from) * 60);
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / dur);
        const ease = 1 - Math.pow(1 - k, 3);
        freq = from + (cfg.frequency - from) * ease;
        renderTuning();
        if (k < 1) driftFrame = requestAnimationFrame(step);
        else {
          freq = cfg.frequency;
          renderTuning();
        }
      };
      driftFrame = requestAnimationFrame(step);
    }, cfg.returnAfterMs);
  }

  bindKnob(volumeKnob, {
    get: () => volume,
    set: (v) => {
      volume = v;
      local.write(VOLUME_KEY, Math.round(v));
      renderVolume();
      applyVolume();
    },
    min: 0, max: 100, step: 5, page: 20, perPixel: 0.6,
  });

  bindKnob(tuneKnob, {
    get: () => freq,
    set: (v) => {
      if (driftFrame) cancelAnimationFrame(driftFrame);
      freq = Math.round(v * 10) / 10;
      renderTuning();
      scheduleReturn();
    },
    min: cfg.min, max: cfg.max, step: 0.1, page: 1, perPixel: 0.05,
  });

  /* ---- the desk radio folds away to its edge (state remembered) */
  const toggles = root.querySelectorAll<HTMLButtonElement>('[data-radio-toggle]');
  const setOpen = (open: boolean, focus = false) => {
    root.classList.toggle('is-open', open);
    toggles.forEach((t) => t.classList.contains('radio-tab') && t.setAttribute('aria-expanded', String(open)));
    local.write(OPEN_KEY, open);
    if (focus) (open ? power : root.querySelector<HTMLButtonElement>('.radio-tab'))?.focus({ preventScroll: true });
  };
  toggles.forEach((t) => t.addEventListener('click', () => setOpen(!root.classList.contains('is-open'), true)));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-open') && root.dataset.variant === 'desk') setOpen(false, true);
  });
  if (root.dataset.variant === 'desk' && local.read<boolean>(OPEN_KEY) && window.matchMedia('(min-width: 761px)').matches) setOpen(true);

  /* ---- first paint */
  renderVolume();
  renderTuning();
  root.dataset.state = 'off';

  // the same radio, on the next page of the same visit: try to keep playing
  const remembered = session.read<{ on: boolean; ts: number }>(SESSION_KEY);
  if (remembered?.on && Date.now() - remembered.ts < cfg.resumeWindowMs) {
    if (!cfg.tracks.length) {
      setState('nosignal');
    } else {
      buildGraph();
      applyVolume();
      setState('tuning-in');
      const c = audioCtx();
      Promise.all([c ? c.resume() : Promise.resolve(), joinProgramme()])
        .then(() => (c && c.state !== 'running' ? Promise.reject(new DOMException('', 'NotAllowedError')) : undefined))
        .then(() => setState('playing'))
        .catch(() => {
          // the browser wants a fresh press: stay switched on, silent
          audio.pause();
          setState('standby');
        });
    }
  }

  // keep the session's "on" fresh while reading
  window.addEventListener('pagehide', () => {
    if (state !== 'off') session.write(SESSION_KEY, { on: true, ts: Date.now() });
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * The station clock. Given the programme's durations (seconds) and a
 * moment in time, where is 107.5? Pure and deterministic: the same moment
 * always gives the same item and offset, for everyone, on every page.
 */
export function stationPosition(durations: number[], nowMs: number): { index: number; offset: number } {
  const total = durations.reduce((a, b) => a + b, 0);
  let t = ((nowMs / 1000) % total + total) % total;
  for (let i = 0; i < durations.length; i++) {
    if (t < durations[i]) return { index: i, offset: t };
    t -= durations[i];
  }
  return { index: 0, offset: 0 };
}
