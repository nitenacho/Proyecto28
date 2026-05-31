const STORAGE_KEY = 'p28-audio-muted-v1';

const PRESETS = {
  midi: {
    wave: 'triangle',
    supportWave: 'sine',
    attack: 0.006,
    decay: 0.18,
    filter: 2600,
    supportGain: 0.22,
    notes: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99],
  },
  glass: {
    wave: 'sine',
    supportWave: 'triangle',
    attack: 0.003,
    decay: 0.22,
    filter: 4200,
    supportGain: 0.18,
    notes: [329.63, 392.0, 493.88, 587.33, 659.25, 783.99, 987.77, 1174.66],
  },
  soft: {
    wave: 'sine',
    supportWave: 'sine',
    attack: 0.012,
    decay: 0.24,
    filter: 1800,
    supportGain: 0.12,
    notes: [220.0, 261.63, 293.66, 349.23, 392.0, 440.0, 523.25],
  },
};

function clamp01(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function normalizeConfig(config = {}) {
  const preset = PRESETS[config.preset] ? config.preset : 'midi';
  return {
    enabled: config.enabled !== false,
    preset,
    masterVolume: clamp01(config.masterVolume, 0.24),
    hoverVolume: clamp01(config.hoverVolume, 0.2),
    interactionVolume: clamp01(config.interactionVolume, 0.18),
  };
}

function readMuted() {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; }
  catch { return false; }
}

function writeMuted(value) {
  try { localStorage.setItem(STORAGE_KEY, value ? '1' : '0'); }
  catch { /* localStorage can be unavailable in private contexts. */ }
}

function tileIdentity(tile) {
  const data = tile?.userData || {};
  return data.slot || `${data.row ?? 0}:${data.col ?? 0}:${tile?.id ?? 'tile'}`;
}

function tileNoteIndex(tile) {
  const data = tile?.userData || {};
  const row = Number.isFinite(data.row) ? data.row : 0;
  const col = Number.isFinite(data.col) ? data.col : 0;
  return row * 3 + col + (data.isProject ? 2 : 0);
}

export function createInteractionAudio(initialConfig = {}) {
  let config = normalizeConfig(initialConfig);
  let muted = readMuted();
  let audioContext = null;
  let outputGain = null;
  let unlocked = false;
  let lastBlockId = null;
  let lastBlockAt = -Infinity;
  const listeners = new Set();

  function emit() {
    const snapshot = { muted, enabled: config.enabled };
    for (const listener of listeners) listener(snapshot);
  }

  function ensureContext() {
    if (audioContext) return audioContext;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContext = new AudioContextCtor();
    outputGain = audioContext.createGain();
    outputGain.gain.value = config.masterVolume;
    outputGain.connect(audioContext.destination);
    return audioContext;
  }

  function resume() {
    const ctx = ensureContext();
    if (!ctx) return;
    unlocked = true;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  function setMasterVolume() {
    if (!audioContext || !outputGain) return;
    outputGain.gain.setTargetAtTime(config.masterVolume, audioContext.currentTime, 0.03);
  }

  function canPlay() {
    return config.enabled && !muted && unlocked && typeof window !== 'undefined';
  }

  function playTone(frequency, options = {}) {
    if (!canPlay()) return;
    const ctx = ensureContext();
    if (!ctx || !outputGain) return;
    if (ctx.state === 'suspended') resume();

    const preset = PRESETS[config.preset] || PRESETS.midi;
    const start = ctx.currentTime + (options.delay || 0);
    const duration = options.duration || preset.decay;
    const attack = options.attack || preset.attack;
    const volume = Math.max(0.0001, options.volume || config.interactionVolume);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(options.filter || preset.filter, start);
    filter.Q.setValueAtTime(0.7, start);

    const osc = ctx.createOscillator();
    osc.type = options.wave || preset.wave;
    osc.frequency.setValueAtTime(frequency, start);
    if (options.detune) osc.detune.setValueAtTime(options.detune, start);

    const support = ctx.createOscillator();
    support.type = preset.supportWave;
    support.frequency.setValueAtTime(frequency * (options.supportRatio || 2), start);
    support.detune.setValueAtTime((options.detune || 0) - 7, start);

    const supportGain = ctx.createGain();
    supportGain.gain.setValueAtTime(volume * preset.supportGain, start);
    supportGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    support.connect(supportGain);
    supportGain.connect(gain);
    gain.connect(filter);
    filter.connect(outputGain);

    const stopAt = start + duration + 0.04;
    osc.start(start);
    support.start(start);
    osc.stop(stopAt);
    support.stop(stopAt);
  }

  function playBlock(tile) {
    if (!tile || !canPlay()) return;
    const now = performance.now();
    const id = tileIdentity(tile);
    if (id === lastBlockId || now - lastBlockAt < 70) return;
    lastBlockId = id;
    lastBlockAt = now;

    const preset = PRESETS[config.preset] || PRESETS.midi;
    const note = preset.notes[tileNoteIndex(tile) % preset.notes.length];
    const detune = (((tile.userData?.col || 0) % 3) - 1) * 5;
    playTone(note, {
      volume: config.hoverVolume,
      duration: Math.max(0.11, preset.decay * 0.82),
      detune,
      supportRatio: 2,
    });
  }

  function playInteraction(kind = 'ui') {
    if (!canPlay()) return;
    const v = config.interactionVolume;
    switch (kind) {
      case 'collect':
        playTone(783.99, { volume: v * 1.05, duration: 0.12, delay: 0.00, filter: 3800 });
        playTone(1174.66, { volume: v * 0.72, duration: 0.14, delay: 0.035, filter: 4200 });
        break;
      case 'victory':
        playTone(523.25, { volume: v * 1.0, duration: 0.28, delay: 0.00, filter: 4400 });
        playTone(659.25, { volume: v * 0.82, duration: 0.30, delay: 0.055, filter: 4400 });
        playTone(783.99, { volume: v * 0.72, duration: 0.34, delay: 0.11, filter: 4400 });
        break;
      case 'fall':
        playTone(196.0, { volume: v * 0.78, duration: 0.18, delay: 0.00, filter: 1200 });
        playTone(146.83, { volume: v * 0.55, duration: 0.22, delay: 0.07, filter: 900 });
        break;
      case 'control':
        playTone(392.0, { volume: v * 0.52, duration: 0.12, filter: 2400 });
        break;
      case 'tap':
        playTone(587.33, { volume: v * 0.5, duration: 0.09, filter: 3000 });
        break;
      case 'ui':
      default:
        playTone(659.25, { volume: v * 0.42, duration: 0.08, filter: 3200 });
        break;
    }
  }

  const unlock = () => resume();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);

  return {
    playBlock,
    playInteraction,
    resume,
    setConfig(nextConfig = {}) {
      config = normalizeConfig(nextConfig);
      setMasterVolume();
      emit();
    },
    setMuted(nextMuted) {
      muted = !!nextMuted;
      writeMuted(muted);
      if (!muted) resume();
      emit();
      return muted;
    },
    toggleMuted() {
      return this.setMuted(!muted);
    },
    isMuted() {
      return muted;
    },
    onChange(listener) {
      listeners.add(listener);
      listener({ muted, enabled: config.enabled });
      return () => listeners.delete(listener);
    },
    destroy() {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      listeners.clear();
      if (audioContext) audioContext.close().catch(() => {});
    },
  };
}
