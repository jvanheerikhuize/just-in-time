/**
 * JUST IN TIME - Event Bus
 * Central pub/sub system for decoupled game communication.
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback, context = null) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push({ callback, context });
    return () => this.off(event, callback);
  }

  once(event, callback, context = null) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback.apply(context, args);
    };
    return this.on(event, wrapper, context);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event);
    const idx = list.findIndex(l => l.callback === callback);
    if (idx !== -1) list.splice(idx, 1);
    if (list.length === 0) this.listeners.delete(event);
  }

  emit(event, ...args) {
    if (!this.listeners.has(event)) return;
    for (const { callback, context } of [...this.listeners.get(event)]) {
      callback.apply(context, args);
    }
  }

  clear() {
    this.listeners.clear();
  }
}

// Singleton
export const eventBus = new EventBus();

// ---- Event Names ----
export const Events = {
  // Game lifecycle
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',
  GAME_SAVE: 'game:save',
  GAME_LOAD: 'game:load',
  STATE_CHANGE: 'game:stateChange',

  // Player
  PLAYER_MOVE: 'player:move',
  PLAYER_INTERACT: 'player:interact',
  PLAYER_DAMAGE: 'player:damage',
  PLAYER_HEAL: 'player:heal',
  PLAYER_DEATH: 'player:death',
  PLAYER_LEVEL_UP: 'player:levelUp',

  // Map
  MAP_CHANGE: 'map:change',
  MAP_LOADED: 'map:loaded',
  TILE_INTERACT: 'tile:interact',

  // Entity
  ENTITY_SPAWN: 'entity:spawn',
  ENTITY_DESTROY: 'entity:destroy',
  ENTITY_INTERACT: 'entity:interact',

  // Combat
  COMBAT_START: 'combat:start',
  COMBAT_END: 'combat:end',
  COMBAT_TURN: 'combat:turn',
  COMBAT_ACTION: 'combat:action',
  COMBAT_HIT: 'combat:hit',
  COMBAT_MISS: 'combat:miss',

  // Dialog
  DIALOG_START: 'dialog:start',
  DIALOG_END: 'dialog:end',
  DIALOG_ADVANCE: 'dialog:advance',
  DIALOG_CHOICE: 'dialog:choice',

  // Quest
  QUEST_START: 'quest:start',
  QUEST_UPDATE: 'quest:update',
  QUEST_COMPLETE: 'quest:complete',
  QUEST_FAIL: 'quest:fail',

  // Inventory
  ITEM_ADD: 'item:add',
  ITEM_REMOVE: 'item:remove',
  ITEM_USE: 'item:use',
  ITEM_EQUIP: 'item:equip',

  // UI
  UI_MESSAGE: 'ui:message',
  UI_PANEL_OPEN: 'ui:panelOpen',
  UI_PANEL_CLOSE: 'ui:panelClose',
  UI_TOOLTIP: 'ui:tooltip',
  UI_UPDATE: 'ui:update',

  // Story flags
  FLAG_SET: 'flag:set',
};
