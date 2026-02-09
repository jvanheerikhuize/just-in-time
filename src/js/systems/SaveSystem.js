/**
 * JUST IN TIME - Save System
 * Persists game state to localStorage.
 */

import { eventBus, Events } from '../core/EventBus.js';

const SAVE_PREFIX = 'jit_save_';
const MAX_SAVES = 5;

export class SaveSystem {
  constructor(game) {
    this.game = game;
  }

  /**
   * Save the current game state.
   */
  save(slotName = 'auto') {
    const state = this.game.getState();
    const saveData = {
      version: '0.1.0',
      timestamp: Date.now(),
      slotName,
      playerName: this.game.player.name,
      level: this.game.player.level,
      location: this.game.player.mapId,
      state,
    };

    try {
      localStorage.setItem(SAVE_PREFIX + slotName, JSON.stringify(saveData));
      eventBus.emit(Events.GAME_SAVE, slotName);
      eventBus.emit(Events.UI_MESSAGE, 'system',
        `Game saved to slot: ${slotName}. Your progress is preserved, unlike most things in the wasteland.`);
      return true;
    } catch (e) {
      eventBus.emit(Events.UI_MESSAGE, 'warning',
        'Save failed. localStorage is full, much like your inventory.');
      return false;
    }
  }

  /**
   * Load a saved game state.
   */
  load(slotName = 'auto') {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + slotName);
      if (!raw) {
        eventBus.emit(Events.UI_MESSAGE, 'warning', 'No save found in that slot.');
        return false;
      }

      const saveData = JSON.parse(raw);

      // Version check (basic)
      if (!saveData.version) {
        eventBus.emit(Events.UI_MESSAGE, 'warning',
          'Save data is corrupted or from an incompatible version.');
        return false;
      }

      this.game.loadState(saveData.state);
      eventBus.emit(Events.GAME_LOAD, slotName);
      eventBus.emit(Events.UI_MESSAGE, 'system',
        `Game loaded from slot: ${slotName}. Welcome back to the apocalypse.`);
      return true;
    } catch (e) {
      eventBus.emit(Events.UI_MESSAGE, 'warning', 'Failed to load save. The data is as corrupted as pre-war politics.');
      return false;
    }
  }

  /**
   * Get all save slots with metadata.
   */
  getSaveSlots() {
    const slots = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(SAVE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          slots.push({
            slotName: key.replace(SAVE_PREFIX, ''),
            playerName: data.playerName,
            level: data.level,
            location: data.location,
            timestamp: data.timestamp,
            date: new Date(data.timestamp).toLocaleString(),
          });
        } catch (e) {
          // Corrupted save, skip
        }
      }
    }
    slots.sort((a, b) => b.timestamp - a.timestamp);
    return slots;
  }

  /**
   * Delete a save slot.
   */
  deleteSave(slotName) {
    localStorage.removeItem(SAVE_PREFIX + slotName);
  }

  /**
   * Check if a save exists.
   */
  hasSave(slotName = 'auto') {
    return localStorage.getItem(SAVE_PREFIX + slotName) !== null;
  }

  /**
   * Auto-save (called periodically or on map change).
   */
  autoSave() {
    this.save('auto');
  }
}
