/**
 * JUST IN TIME - Sound Definitions
 * Procedural audio definitions for the Web Audio API SoundSystem.
 * Each sound has layers[] with synthesis parameters.
 *
 * Layer properties:
 *   type       - 'sine'|'square'|'sawtooth'|'triangle'|'noise'
 *   freq       - Base frequency in Hz (oscillators only)
 *   gain       - Volume 0-1 (default 0.3)
 *   decay      - Envelope decay time in seconds
 *   delay      - Delay before layer starts (seconds, default 0)
 *   pitchSlide - Target frequency to slide to over decay period
 *   filter     - 'lowpass'|'highpass'|'bandpass' (optional)
 *   filterFreq - Filter cutoff frequency (default 1000)
 *   filterQ    - Filter Q/resonance (default 1)
 */

export const SOUND_DEFS = {
  // ---- Ambient Loops ----
  ambient_vault: {
    loop: true,
    layers: [
      { type: 'noise', filter: 'lowpass', filterFreq: 200, gain: 0.06, decay: 4 },
      { type: 'sine', freq: 60, gain: 0.04, decay: 4 },
      { type: 'sine', freq: 120, gain: 0.02, decay: 4 },
    ],
  },

  ambient_dustbowl: {
    loop: true,
    layers: [
      { type: 'noise', filter: 'bandpass', filterFreq: 800, filterQ: 0.5, gain: 0.05, decay: 4 },
      { type: 'noise', filter: 'highpass', filterFreq: 2000, gain: 0.02, decay: 4 },
    ],
  },

  ambient_wastes: {
    loop: true,
    layers: [
      { type: 'noise', filter: 'lowpass', filterFreq: 300, gain: 0.05, decay: 4 },
      { type: 'noise', filter: 'bandpass', filterFreq: 3000, filterQ: 2, gain: 0.01, decay: 4 },
      { type: 'sine', freq: 45, gain: 0.03, decay: 4 },
    ],
  },

  // ---- Combat SFX ----
  hit_melee: {
    layers: [
      { type: 'noise', filter: 'bandpass', filterFreq: 1200, filterQ: 1, gain: 0.4, decay: 0.1 },
      { type: 'square', freq: 100, gain: 0.2, decay: 0.06 },
    ],
  },

  hit_ranged: {
    layers: [
      { type: 'square', freq: 180, gain: 0.4, decay: 0.06 },
      { type: 'noise', filter: 'highpass', filterFreq: 2000, gain: 0.5, decay: 0.04 },
      { type: 'sawtooth', freq: 120, pitchSlide: 60, gain: 0.2, decay: 0.1 },
    ],
  },

  hit_crit: {
    layers: [
      { type: 'sawtooth', freq: 300, pitchSlide: 100, gain: 0.5, decay: 0.15 },
      { type: 'noise', filter: 'bandpass', filterFreq: 1500, filterQ: 2, gain: 0.5, decay: 0.1 },
      { type: 'square', freq: 80, gain: 0.3, decay: 0.08 },
    ],
  },

  miss: {
    layers: [
      { type: 'sine', freq: 400, pitchSlide: 200, gain: 0.15, decay: 0.15 },
      { type: 'noise', filter: 'highpass', filterFreq: 3000, gain: 0.08, decay: 0.1 },
    ],
  },

  enemy_death: {
    layers: [
      { type: 'sawtooth', freq: 200, pitchSlide: 40, gain: 0.3, decay: 0.4 },
      { type: 'noise', filter: 'lowpass', filterFreq: 500, gain: 0.2, decay: 0.3 },
      { type: 'square', freq: 80, pitchSlide: 30, gain: 0.15, decay: 0.35, delay: 0.05 },
    ],
  },

  // ---- UI SFX ----
  ui_click: {
    layers: [
      { type: 'square', freq: 800, gain: 0.12, decay: 0.03 },
    ],
  },

  ui_loot: {
    layers: [
      { type: 'sine', freq: 600, gain: 0.2, decay: 0.08 },
      { type: 'sine', freq: 900, gain: 0.15, decay: 0.08, delay: 0.06 },
      { type: 'sine', freq: 1200, gain: 0.1, decay: 0.06, delay: 0.12 },
    ],
  },

  ui_error: {
    layers: [
      { type: 'square', freq: 200, gain: 0.25, decay: 0.15 },
      { type: 'square', freq: 150, gain: 0.2, decay: 0.15, delay: 0.08 },
    ],
  },

  // ---- Gameplay SFX ----
  level_up: {
    layers: [
      { type: 'sine', freq: 523, gain: 0.25, decay: 0.12 },
      { type: 'sine', freq: 659, gain: 0.25, decay: 0.12, delay: 0.1 },
      { type: 'sine', freq: 784, gain: 0.25, decay: 0.12, delay: 0.2 },
      { type: 'sine', freq: 1047, gain: 0.3, decay: 0.3, delay: 0.3 },
    ],
  },

  quest_complete: {
    layers: [
      { type: 'triangle', freq: 440, gain: 0.2, decay: 0.15 },
      { type: 'triangle', freq: 554, gain: 0.2, decay: 0.15, delay: 0.08 },
      { type: 'triangle', freq: 659, gain: 0.2, decay: 0.15, delay: 0.16 },
      { type: 'triangle', freq: 880, gain: 0.3, decay: 0.4, delay: 0.24 },
    ],
  },

  heal: {
    layers: [
      { type: 'sine', freq: 500, pitchSlide: 800, gain: 0.2, decay: 0.25 },
      { type: 'sine', freq: 750, pitchSlide: 1100, gain: 0.1, decay: 0.2, delay: 0.05 },
    ],
  },

  door_open: {
    layers: [
      { type: 'noise', filter: 'bandpass', filterFreq: 400, filterQ: 1, gain: 0.25, decay: 0.25 },
      { type: 'sawtooth', freq: 80, pitchSlide: 120, gain: 0.1, decay: 0.2 },
    ],
  },

  player_hurt: {
    layers: [
      { type: 'sawtooth', freq: 150, pitchSlide: 80, gain: 0.35, decay: 0.15 },
      { type: 'noise', filter: 'bandpass', filterFreq: 800, gain: 0.2, decay: 0.1 },
    ],
  },

  combat_start: {
    layers: [
      { type: 'square', freq: 220, gain: 0.2, decay: 0.08 },
      { type: 'square', freq: 330, gain: 0.25, decay: 0.1, delay: 0.06 },
      { type: 'sawtooth', freq: 440, gain: 0.2, decay: 0.15, delay: 0.12 },
    ],
  },
};

/**
 * Map ID to ambient sound ID mapping.
 */
export const MAP_AMBIENT = {
  vault42: 'ambient_vault',
  dustbowl: 'ambient_dustbowl',
  wastes: 'ambient_wastes',
};
