/**
 * JUST IN TIME - Main Entry Point
 * A post-apocalyptic browser RPG.
 *
 * War. War never changes. But game engines do.
 */

import { Game } from './engine/Game.js';
import { UIManager } from './ui/UIManager.js';
import { eventBus, Events } from './core/EventBus.js';

// ---- Initialize ----

const game = new Game();
const ui = new UIManager(game);

// ---- Quest Objective Tracking ----
// Wire up game events to quest objective tracking

eventBus.on(Events.MAP_LOADED, (mapId) => {
  // Track 'go' objectives
  const quests = game.questSystem.getActiveQuests();
  for (const quest of quests) {
    for (const obj of quest.objectives) {
      if (obj.type === 'go' && obj.target === mapId) {
        game.questSystem.updateObjective(quest.id, 'go', mapId);
      }
    }
  }

  // Auto-save on map change
  if (game.player) {
    game.saveSystem.autoSave();
  }
});

eventBus.on(Events.ENTITY_INTERACT, (entity) => {
  // Track 'talk' objectives
  const quests = game.questSystem.getActiveQuests();
  for (const quest of quests) {
    for (const obj of quest.objectives) {
      if (obj.type === 'talk' && obj.target === entity.id) {
        game.questSystem.updateObjective(quest.id, 'talk', entity.id);
      }
    }
  }
});

eventBus.on(Events.ENTITY_DESTROY, (entity) => {
  // Track 'kill' objectives
  const quests = game.questSystem.getActiveQuests();
  for (const quest of quests) {
    for (const obj of quest.objectives) {
      if (obj.type === 'kill') {
        // Match by entity type prefix (e.g., 'radroach' matches 'radroach_1', 'radroach_2')
        if (entity.id.startsWith(obj.target)) {
          game.questSystem.updateObjective(quest.id, 'kill', obj.target);
        }
      }
    }
  }

  // Reputation consequences: killing an entity angers their allies
  if (entity.allies) {
    for (const allyId of entity.allies) {
      game.changeReputation(allyId, -15);
    }
  }
});

eventBus.on(Events.ITEM_ADD, (itemId) => {
  // Track 'fetch' objectives
  const quests = game.questSystem.getActiveQuests();
  for (const quest of quests) {
    for (const obj of quest.objectives) {
      if (obj.type === 'fetch' && obj.target === itemId) {
        game.questSystem.updateObjective(quest.id, 'fetch', itemId);
      }
    }
  }
});

// ---- HUD Update on Events ----

eventBus.on(Events.PLAYER_MOVE, () => {
  ui.updateHUD();
});

eventBus.on(Events.COMBAT_HIT, () => {
  ui.updateHUD();
  if (game.combatSystem.inCombat) {
    ui.updateCombat();
  }
});

eventBus.on(Events.PLAYER_LEVEL_UP, () => {
  ui.updateHUD();
});

// ---- Start Game Loop ----

game.run();

// ---- Expose game to console for debugging ----
window.game = game;
window.eventBus = eventBus;

console.log('%c JUST IN TIME ', 'background: #0a0a0f; color: #33ff33; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('%c A Post-Apocalyptic RPG ', 'background: #0a0a0f; color: #ffaa00; font-size: 12px; padding: 5px;');
console.log('Type window.game to inspect game state. Happy wasteland wandering!');
