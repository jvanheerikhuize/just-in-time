/**
 * JUST IN TIME - Map System
 * Loads, manages, and provides access to map data.
 * Maps are stored as base64-encoded tile grids.
 */

import { TILE_PROPS, Tiles } from '../core/constants.js';
import { decodeMap } from '../core/utils.js';
import { eventBus, Events } from '../core/EventBus.js';
import { ALL_MAPS } from '../data/maps.js';
import { ENTITY_DEFS } from '../data/entities.js';

export class MapSystem {
  constructor(game) {
    this.game = game;
    this.maps = {};       // Loaded map data cache
    this.currentMapId = null;
    this.entityStates = {}; // Per-map entity state persistence
  }

  /**
   * Load a map by ID and decode its layers.
   */
  loadMap(mapId) {
    // Check cache first
    if (this.maps[mapId]) {
      this.currentMapId = mapId;
      return this.maps[mapId];
    }

    const mapDef = ALL_MAPS[mapId];
    if (!mapDef) return null;

    // Decode base64 layers
    const groundGrid = decodeMap(mapDef.layers.ground, mapDef.width, mapDef.height);
    const objectGrid = mapDef.layers.objects
      ? decodeMap(mapDef.layers.objects, mapDef.width, mapDef.height)
      : null;

    const mapData = {
      id: mapId,
      name: mapDef.name,
      width: mapDef.width,
      height: mapDef.height,
      groundGrid,
      objectGrid,
      spawns: mapDef.spawns || {},
      exits: mapDef.exits || [],
      entities: mapDef.entities || [],
      ambient: mapDef.ambient || null,
    };

    this.maps[mapId] = mapData;
    this.currentMapId = mapId;
    return mapData;
  }

  getCurrentMap() {
    return this.maps[this.currentMapId] || null;
  }

  /**
   * Get entities for a map, instantiating from definitions.
   */
  getEntities(mapId) {
    const mapData = this.maps[mapId];
    if (!mapData) return [];

    // Check if we have saved entity states for this map
    if (this.entityStates[mapId]) {
      return this.entityStates[mapId].map(state => ({ ...state }));
    }

    // Create entities from map definition
    const entities = [];
    for (const placement of mapData.entities) {
      const def = ENTITY_DEFS[placement.id];
      if (!def) continue;

      const entity = {
        ...def,
        instanceId: `${mapId}_${placement.id}_${placement.x}_${placement.y}`,
        position: { x: placement.x, y: placement.y },
        alive: true,
        ...(placement.overrides || {}),
      };

      entities.push(entity);
    }

    return entities;
  }

  /**
   * Get tile properties.
   */
  getTileProps(tileId) {
    return TILE_PROPS[tileId] || TILE_PROPS[Tiles.VOID];
  }

  /**
   * Interact with a tile (e.g., open a door).
   */
  interactTile(x, y) {
    const mapData = this.getCurrentMap();
    if (!mapData || !mapData.objectGrid) return;

    const tileId = mapData.objectGrid[y][x];

    switch (tileId) {
      case Tiles.DOOR_CLOSED:
        mapData.objectGrid[y][x] = Tiles.DOOR_OPEN;
        eventBus.emit(Events.UI_MESSAGE, 'action', 'You open the door.');
        this.game.updateFOV();
        break;

      case Tiles.DOOR_OPEN:
        mapData.objectGrid[y][x] = Tiles.DOOR_CLOSED;
        eventBus.emit(Events.UI_MESSAGE, 'action', 'You close the door.');
        this.game.updateFOV();
        break;

      case Tiles.DOOR_LOCKED: {
        const hasKey = this.game.inventorySystem.hasItem('key_' + this.currentMapId);
        const lockpickSkill = this.game.player.skills.lockpick || 0;

        if (hasKey) {
          mapData.objectGrid[y][x] = Tiles.DOOR_OPEN;
          eventBus.emit(Events.UI_MESSAGE, 'action', 'You unlock the door with the key.');
          this.game.updateFOV();
        } else if (lockpickSkill >= 30) {
          mapData.objectGrid[y][x] = Tiles.DOOR_OPEN;
          eventBus.emit(Events.UI_MESSAGE, 'action',
            'You pick the lock with the finesse of someone who definitely didn\'t learn this from a cereal box manual.');
          this.game.updateFOV();
        } else {
          eventBus.emit(Events.UI_MESSAGE, 'warning',
            'The door is locked. You\'d need a key or better lockpick skills. Or a very large rock, but that\'s not in your skill tree.');
        }
        break;
      }

      case Tiles.COMPUTER:
        eventBus.emit(Events.UI_MESSAGE, 'action',
          'The terminal flickers to life. Most of the data is corrupted, but you can make out someone\'s browser history. You wish you hadn\'t.');
        break;

      default:
        break;
    }
  }

  /**
   * Save entity states for current map.
   */
  getEntityStates() {
    const states = {};
    states[this.currentMapId] = this.game.entities.map(e => ({
      ...e,
      position: { ...e.position },
    }));
    return { ...this.entityStates, ...states };
  }

  loadEntityStates(states) {
    this.entityStates = states || {};
  }
}
