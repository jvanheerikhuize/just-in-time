/**
 * JUST IN TIME - Inventory System
 * Manages player inventory, equipment, and item usage.
 */

import { eventBus, Events } from '../core/EventBus.js';
import { ITEM_DEFS } from '../data/items.js';

export class InventorySystem {
  constructor(game) {
    this.game = game;
    this.items = []; // Array of { id, count }
  }

  init() {
    this.items = [];
  }

  /**
   * Add an item to inventory.
   */
  addItem(itemId, count = 1) {
    const def = ITEM_DEFS[itemId];
    if (!def) {
      console.warn(`Item not found: ${itemId}`);
      return false;
    }

    // Check carry weight
    const currentWeight = this.getTotalWeight();
    const player = this.game.player;
    if (currentWeight + (def.weight * count) > player.carryWeight) {
      eventBus.emit(Events.UI_MESSAGE, 'warning',
        `Can't carry that. You're already lugging around ${currentWeight} pounds of questionable life choices.`);
      return false;
    }

    // Stack if possible
    const existing = this.items.find(i => i.id === itemId);
    if (existing && def.stackable !== false) {
      existing.count += count;
    } else {
      this.items.push({ id: itemId, count });
    }

    eventBus.emit(Events.ITEM_ADD, itemId, count, def);
    eventBus.emit(Events.UI_MESSAGE, 'loot', `Picked up: ${def.name}${count > 1 ? ` x${count}` : ''}`);
    eventBus.emit(Events.UI_UPDATE);
    return true;
  }

  /**
   * Remove an item from inventory.
   */
  removeItem(itemId, count = 1) {
    const idx = this.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;

    this.items[idx].count -= count;
    if (this.items[idx].count <= 0) {
      this.items.splice(idx, 1);
    }

    eventBus.emit(Events.ITEM_REMOVE, itemId, count);
    eventBus.emit(Events.UI_UPDATE);
    return true;
  }

  /**
   * Check if player has an item.
   */
  hasItem(itemId, count = 1) {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.count >= count : false;
  }

  /**
   * Get item count.
   */
  getItemCount(itemId) {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.count : 0;
  }

  /**
   * Use a consumable item.
   */
  useItem(itemId) {
    const def = ITEM_DEFS[itemId];
    if (!def) return false;

    if (def.type !== 'consumable') {
      eventBus.emit(Events.UI_MESSAGE, 'system',
        'You can\'t use that. Well, you could, but it wouldn\'t be productive.');
      return false;
    }

    if (!this.hasItem(itemId)) return false;

    // Apply item effects
    if (def.effects) {
      for (const effect of def.effects) {
        switch (effect.type) {
          case 'heal':
            const healed = this.game.characterSystem.healPlayer(effect.amount);
            eventBus.emit(Events.UI_MESSAGE, 'action',
              `Used ${def.name}. Healed ${healed} HP. ${def.useMessage || ''}`);
            break;

          case 'restoreAP':
            this.game.player.ap = Math.min(
              this.game.player.maxAp,
              this.game.player.ap + effect.amount
            );
            eventBus.emit(Events.UI_MESSAGE, 'action',
              `Used ${def.name}. Restored ${effect.amount} AP.`);
            break;

          case 'buff':
            // Temporary stat buff (simplified: just apply directly)
            if (effect.attribute && this.game.player.attributes[effect.attribute]) {
              this.game.player.attributes[effect.attribute] += effect.amount;
              eventBus.emit(Events.UI_MESSAGE, 'action',
                `Used ${def.name}. ${effect.attribute} temporarily increased by ${effect.amount}.`);
            }
            break;

          case 'damage':
            this.game.characterSystem.damagePlayer(effect.amount);
            eventBus.emit(Events.UI_MESSAGE, 'warning',
              `Used ${def.name}. Took ${effect.amount} damage. ${def.useMessage || 'Why did you do that?'}`);
            break;
        }
      }
    }

    this.removeItem(itemId);
    eventBus.emit(Events.ITEM_USE, itemId, def);
    return true;
  }

  /**
   * Equip a weapon or armor.
   */
  equipItem(itemId) {
    const def = ITEM_DEFS[itemId];
    if (!def) return false;

    if (!this.hasItem(itemId)) return false;

    const player = this.game.player;

    if (def.type === 'weapon') {
      // Unequip current weapon
      if (player.equipped.weapon) {
        this.addItem(player.equipped.weapon.id);
      }
      player.equipped.weapon = { ...def, id: itemId };
      this.removeItem(itemId);
      eventBus.emit(Events.UI_MESSAGE, 'action', `Equipped: ${def.name}`);
    } else if (def.type === 'armor') {
      // Unequip current armor
      if (player.equipped.armor) {
        this.addItem(player.equipped.armor.id);
      }
      player.equipped.armor = { ...def, id: itemId };
      this.removeItem(itemId);
      eventBus.emit(Events.UI_MESSAGE, 'action', `Equipped: ${def.name}`);
    } else {
      eventBus.emit(Events.UI_MESSAGE, 'system', 'You can\'t equip that.');
      return false;
    }

    eventBus.emit(Events.ITEM_EQUIP, itemId, def);
    eventBus.emit(Events.UI_UPDATE);
    return true;
  }

  /**
   * Unequip a weapon or armor.
   */
  unequipSlot(slot) {
    const player = this.game.player;
    const equipped = player.equipped[slot];
    if (!equipped) return;

    this.addItem(equipped.id);
    player.equipped[slot] = null;
    eventBus.emit(Events.UI_MESSAGE, 'action', `Unequipped: ${equipped.name}`);
    eventBus.emit(Events.UI_UPDATE);
  }

  /**
   * Get total carry weight.
   */
  getTotalWeight() {
    let weight = 0;
    for (const item of this.items) {
      const def = ITEM_DEFS[item.id];
      if (def) weight += def.weight * item.count;
    }
    return weight;
  }

  /**
   * Get all inventory items with their definitions.
   */
  getItems() {
    return this.items.map(item => ({
      ...item,
      def: ITEM_DEFS[item.id],
    })).filter(item => item.def);
  }

  getState() {
    return JSON.parse(JSON.stringify(this.items));
  }

  loadState(state) {
    this.items = state || [];
  }
}
