/**
 * JUST IN TIME - Sound System
 * Procedural audio via Web Audio API. Ambient loops with crossfade,
 * one-shot SFX for combat/UI/gameplay, volume controls per channel.
 * AudioContext initialized lazily on first user gesture.
 */

import { eventBus, Events } from '../core/EventBus.js';
import { SOUND_DEFS, MAP_AMBIENT } from '../data/sounds.js';

const CROSSFADE_TIME = 2; // seconds for ambient crossfade
const NOISE_BUFFER_SIZE = 2; // seconds of white noise

export class SoundSystem {
  constructor(game) {
    this.game = game;
    this.ctx = null; // AudioContext, created on first user gesture
    this._initialized = false;

    // Gain nodes (created in _init)
    this._masterGain = null;
    this._sfxGain = null;
    this._ambientGain = null;
    this._musicGain = null;

    // Volume settings (0-1)
    this._volumes = { master: 0.8, sfx: 1.0, ambient: 0.7, music: 0.5 };
    this._muted = false;

    // Ambient state
    this._currentAmbient = null; // soundId
    this._ambientNodes = null; // { sources, gains } for current ambient

    // Cached noise buffer
    this._noiseBuffer = null;

    // Load persisted settings
    this._loadSettings();

    // Register user gesture listener for lazy init
    this._gestureHandler = () => this._init();
    document.addEventListener('click', this._gestureHandler, { once: true });
    document.addEventListener('keydown', this._gestureHandler, { once: true });

    // Bind to game events
    this._bindEvents();
  }

  _loadSettings() {
    try {
      const saved = localStorage.getItem('jit_settings');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.soundVolumes) {
          this._volumes = { ...this._volumes, ...s.soundVolumes };
        }
        if (s.soundMuted !== undefined) {
          this._muted = s.soundMuted;
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  _init() {
    if (this._initialized) return;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      // Browser doesn't support Web Audio API
      console.warn('SoundSystem: Web Audio API not available');
      return;
    }

    // Build gain graph: sources -> category gains -> master -> destination
    this._masterGain = this.ctx.createGain();
    this._masterGain.connect(this.ctx.destination);

    this._sfxGain = this.ctx.createGain();
    this._sfxGain.connect(this._masterGain);

    this._ambientGain = this.ctx.createGain();
    this._ambientGain.connect(this._masterGain);

    this._musicGain = this.ctx.createGain();
    this._musicGain.connect(this._masterGain);

    // Apply saved volumes
    this._masterGain.gain.value = this._muted ? 0 : this._volumes.master;
    this._sfxGain.gain.value = this._volumes.sfx;
    this._ambientGain.gain.value = this._volumes.ambient;
    this._musicGain.gain.value = this._volumes.music;

    // Pre-generate noise buffer
    this._noiseBuffer = this._createNoiseBuffer();

    this._initialized = true;

    // Remove the other gesture listener
    document.removeEventListener('click', this._gestureHandler);
    document.removeEventListener('keydown', this._gestureHandler);

    // If a map is already loaded, start its ambient
    if (this.game.player && this.game.player.mapId) {
      const ambientId = MAP_AMBIENT[this.game.player.mapId];
      if (ambientId) {
        this.playAmbient(ambientId);
      }
    }
  }

  _bindEvents() {
    // Ambient: crossfade on map transitions
    eventBus.on(Events.MAP_LOADED, (mapId) => {
      const ambientId = MAP_AMBIENT[mapId];
      if (ambientId) {
        this.playAmbient(ambientId);
      }
    });

    // Combat
    eventBus.on(Events.COMBAT_START, () => {
      this.play('combat_start');
    });

    eventBus.on(Events.COMBAT_HIT, (attacker, target, damage, isCritical) => {
      if (isCritical) {
        this.play('hit_crit');
      } else {
        // Check if attacker has a ranged weapon equipped
        const weapon = attacker === this.game.player
          ? this.game.player.equipped.weapon
          : attacker.equipped?.weapon;
        const isRanged = weapon && weapon.range > 1;
        this.play(isRanged ? 'hit_ranged' : 'hit_melee');
      }
    });

    eventBus.on(Events.COMBAT_MISS, () => {
      this.play('miss');
    });

    eventBus.on(Events.ENTITY_DESTROY, () => {
      this.play('enemy_death');
    });

    eventBus.on(Events.PLAYER_DAMAGE, () => {
      this.play('player_hurt');
    });

    eventBus.on(Events.PLAYER_LEVEL_UP, () => {
      this.play('level_up');
    });

    eventBus.on(Events.QUEST_COMPLETE, () => {
      this.play('quest_complete');
    });

    // Inventory / items
    eventBus.on(Events.ITEM_ADD, () => {
      this.play('ui_loot');
    });

    eventBus.on(Events.ITEM_USE, () => {
      this.play('heal');
    });

    // UI
    eventBus.on(Events.DIALOG_START, () => {
      this.play('ui_click');
    });

    eventBus.on(Events.UI_PANEL_OPEN, () => {
      this.play('ui_click');
    });

    eventBus.on(Events.TILE_INTERACT, () => {
      this.play('door_open');
    });
  }

  /**
   * Play a one-shot sound effect.
   */
  play(soundId) {
    if (!this._initialized || !this.ctx) return;

    const def = SOUND_DEFS[soundId];
    if (!def) return;

    for (const layer of def.layers) {
      const startDelay = layer.delay || 0;
      if (layer.type === 'noise') {
        this._playNoiseLayer(layer, startDelay, this._sfxGain);
      } else {
        this._playToneLayer(layer, startDelay, this._sfxGain);
      }
    }
  }

  /**
   * Start or crossfade to an ambient sound loop.
   */
  playAmbient(soundId) {
    if (!this._initialized || !this.ctx) return;
    if (this._currentAmbient === soundId) return;

    const def = SOUND_DEFS[soundId];
    if (!def) return;

    // Fade out current ambient
    if (this._ambientNodes) {
      this._fadeOutAmbient(this._ambientNodes);
    }

    // Create new ambient layers
    const now = this.ctx.currentTime;
    const nodes = { sources: [], gains: [] };

    for (const layer of def.layers) {
      const layerGain = this.ctx.createGain();
      layerGain.gain.setValueAtTime(0, now);
      layerGain.gain.linearRampToValueAtTime(layer.gain || 0.3, now + CROSSFADE_TIME);
      layerGain.connect(this._ambientGain);

      let source;
      if (layer.type === 'noise') {
        source = this.ctx.createBufferSource();
        source.buffer = this._noiseBuffer;
        source.loop = true;

        if (layer.filter) {
          const filter = this.ctx.createBiquadFilter();
          filter.type = layer.filter;
          filter.frequency.value = layer.filterFreq || 1000;
          filter.Q.value = layer.filterQ || 1;
          source.connect(filter);
          filter.connect(layerGain);
        } else {
          source.connect(layerGain);
        }
      } else {
        source = this.ctx.createOscillator();
        source.type = layer.type;
        source.frequency.value = layer.freq || 440;
        source.connect(layerGain);
      }

      source.start(now);
      nodes.sources.push(source);
      nodes.gains.push(layerGain);
    }

    this._ambientNodes = nodes;
    this._currentAmbient = soundId;
  }

  /**
   * Fade out and stop ambient nodes.
   */
  _fadeOutAmbient(nodes) {
    const now = this.ctx.currentTime;
    for (const gain of nodes.gains) {
      gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_TIME);
    }
    // Stop sources after fade completes
    setTimeout(() => {
      for (const source of nodes.sources) {
        try { source.stop(); } catch (e) { /* already stopped */ }
      }
    }, CROSSFADE_TIME * 1000 + 100);
  }

  /**
   * Play an oscillator-based tone layer.
   */
  _playToneLayer(layer, startDelay, destination) {
    const now = this.ctx.currentTime + startDelay;
    const decay = layer.decay || 0.2;
    const gain = layer.gain || 0.3;

    const osc = this.ctx.createOscillator();
    osc.type = layer.type || 'sine';
    osc.frequency.setValueAtTime(layer.freq || 440, now);

    if (layer.pitchSlide) {
      osc.frequency.linearRampToValueAtTime(layer.pitchSlide, now + decay);
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(now);
    osc.stop(now + decay + 0.05);
  }

  /**
   * Play a noise-based layer (filtered white noise).
   */
  _playNoiseLayer(layer, startDelay, destination) {
    const now = this.ctx.currentTime + startDelay;
    const decay = layer.decay || 0.2;
    const gain = layer.gain || 0.3;

    const source = this.ctx.createBufferSource();
    source.buffer = this._noiseBuffer;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + decay);

    if (layer.filter) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = layer.filter;
      filter.frequency.value = layer.filterFreq || 1000;
      filter.Q.value = layer.filterQ || 1;
      source.connect(filter);
      filter.connect(gainNode);
    } else {
      source.connect(gainNode);
    }

    gainNode.connect(destination);
    source.start(now);
    source.stop(now + decay + 0.05);
  }

  /**
   * Generate a white noise AudioBuffer.
   */
  _createNoiseBuffer() {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * NOISE_BUFFER_SIZE;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Set volume for a channel (master, sfx, ambient, music). Value 0-1.
   */
  setVolume(channel, value) {
    const v = Math.max(0, Math.min(1, value));
    this._volumes[channel] = v;

    if (!this._initialized) return;

    const gainMap = {
      master: this._masterGain,
      sfx: this._sfxGain,
      ambient: this._ambientGain,
      music: this._musicGain,
    };

    const node = gainMap[channel];
    if (node) {
      if (channel === 'master' && this._muted) return; // Don't change while muted
      node.gain.setValueAtTime(v, this.ctx.currentTime);
    }
  }

  /**
   * Toggle mute on/off.
   */
  toggleMute() {
    this._muted = !this._muted;

    if (this._initialized && this._masterGain) {
      this._masterGain.gain.setValueAtTime(
        this._muted ? 0 : this._volumes.master,
        this.ctx.currentTime
      );
    }

    return this._muted;
  }

  /**
   * Get current volume settings for persistence.
   */
  getSettings() {
    return {
      soundVolumes: { ...this._volumes },
      soundMuted: this._muted,
    };
  }
}
