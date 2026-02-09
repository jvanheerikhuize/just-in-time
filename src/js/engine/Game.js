/**
 * JUST IN TIME - Game Engine
 * Main game loop, state management, and system coordination.
 */

import { GameState, TILE_SIZE } from '../core/constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { findPath, computeFOV } from '../core/utils.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { MapSystem } from '../systems/MapSystem.js';
import { CharacterSystem } from '../systems/CharacterSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { DialogSystem } from '../systems/DialogSystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export class Game {
  constructor() {
    this.state = GameState.MENU;
    this.canvas = document.getElementById('game-canvas');
    this.camera = new Camera();
    this.renderer = new Renderer(this.canvas);
    this.input = new Input(this.canvas);

    // Systems
    this.mapSystem = new MapSystem(this);
    this.characterSystem = new CharacterSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.dialogSystem = new DialogSystem(this);
    this.questSystem = new QuestSystem(this);
    this.inventorySystem = new InventorySystem(this);
    this.saveSystem = new SaveSystem(this);

    // Player state
    this.player = null;

    // Entities on current map
    this.entities = [];

    // Field of view
    this.fovSet = null;
    this.fovRadius = 10;

    // Movement
    this.currentPath = [];
    this.moveTimer = 0;
    this.moveDelay = 120; // ms between steps
    this.keyMoveTimer = 0;
    this.keyMoveDelay = 150;

    // Hover
    this.hoverTile = null;

    // Time
    this.lastTime = 0;
    this.accumulator = 0;

    // Story flags
    this.flags = {};

    this._bindEvents();
  }

  _bindEvents() {
    eventBus.on(Events.STATE_CHANGE, (newState) => {
      this.state = newState;
    });

    eventBus.on(Events.MAP_CHANGE, (mapId, spawnPoint) => {
      this.loadMap(mapId, spawnPoint);
    });

    eventBus.on(Events.FLAG_SET, (key, value) => {
      this.flags[key] = value;
    });
  }

  /**
   * Start a new game with the given player data.
   */
  startNewGame(playerData) {
    this.player = {
      name: playerData.name,
      attributes: { ...playerData.attributes },
      skills: {},
      hp: 0,
      maxHp: 0,
      ap: 0,
      maxAp: 0,
      xp: 0,
      level: 1,
      caps: 50,
      position: { x: 0, y: 0 },
      mapId: 'vault42',
      equipped: { weapon: null, armor: null },
    };

    // Calculate derived stats
    this.characterSystem.recalculate(this.player);
    this.player.hp = this.player.maxHp;
    this.player.ap = this.player.maxAp;

    // Initialize inventory
    this.inventorySystem.init(this.player);

    // Give starting items
    this.inventorySystem.addItem('vault_suit');
    this.inventorySystem.addItem('stimpak');
    this.inventorySystem.addItem('stimpak');

    // Reset flags and quests
    this.flags = {};
    this.questSystem.reset();

    // Load starting map
    this.loadMap('vault42', 'start');

    // Start first quest
    this.questSystem.startQuest('wake_up_call');

    // Welcome message
    eventBus.emit(Events.UI_MESSAGE, 'system',
      'You slowly open your eyes. The cryo pod hisses, releasing 210 years of accumulated ice and regret.');
    eventBus.emit(Events.UI_MESSAGE, 'system',
      'A tinny voice echoes through the vault: "Good morning! Or afternoon. Or whatever passes for time when civilization has ended."');
    eventBus.emit(Events.UI_MESSAGE, 'humor',
      'CHRONOS, the vault AI, seems thrilled to have someone to talk to. You already want to go back to sleep.');

    this.state = GameState.PLAYING;
    eventBus.emit(Events.GAME_START);
  }

  /**
   * Load a map and place the player at a spawn point.
   */
  loadMap(mapId, spawnPoint) {
    const mapData = this.mapSystem.loadMap(mapId);
    if (!mapData) {
      console.error(`Map not found: ${mapId}`);
      return;
    }

    this.player.mapId = mapId;

    // Find spawn point
    const spawn = mapData.spawns[spawnPoint] || mapData.spawns['start'] || { x: 1, y: 1 };
    this.player.position.x = spawn.x;
    this.player.position.y = spawn.y;

    // Load entities for this map
    this.entities = this.mapSystem.getEntities(mapId);

    // Center camera immediately
    this.camera.follow(this.player.position.x, this.player.position.y,
      mapData.width, mapData.height, true);

    // Compute FOV
    this.updateFOV();

    // Clear path
    this.currentPath = [];

    eventBus.emit(Events.MAP_LOADED, mapId);
    eventBus.emit(Events.UI_MESSAGE, 'system', `Entered: ${mapData.name}`);
  }

  /**
   * Main game loop.
   */
  run() {
    const loop = (time) => {
      const dt = time - this.lastTime;
      this.lastTime = time;

      if (this.state === GameState.PLAYING || this.state === GameState.COMBAT) {
        this.update(dt);
        this.render();
      }

      this.input.endFrame();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame((time) => {
      this.lastTime = time;
      requestAnimationFrame(loop);
    });
  }

  /**
   * Update game logic.
   */
  update(dt) {
    // Update camera
    const mapData = this.mapSystem.getCurrentMap();
    if (mapData) {
      this.camera.follow(this.player.position.x, this.player.position.y,
        mapData.width, mapData.height);
    }
    this.camera.update();

    // Update hover tile
    const hoverTile = this.camera.screenToTile(this.input.mouseX, this.input.mouseY);
    this.hoverTile = hoverTile;

    if (this.state === GameState.PLAYING) {
      this._handlePlayingInput(dt);
    } else if (this.state === GameState.COMBAT) {
      this._handleCombatInput(dt);
    }

    // Check hotkeys for panels
    this._handlePanelHotkeys();
  }

  _handlePlayingInput(dt) {
    const mapData = this.mapSystem.getCurrentMap();
    if (!mapData) return;

    // Keyboard movement
    this.keyMoveTimer -= dt;
    const dir = this.input.getMovementDirection();
    if (dir && this.keyMoveTimer <= 0) {
      this.currentPath = [];
      this._tryMovePlayer(dir.x, dir.y);
      this.keyMoveTimer = this.keyMoveDelay;
    }

    // Click to move
    if (this.input.consumeClick()) {
      const target = this.camera.screenToTile(this.input.mouseX, this.input.mouseY);

      // Check if clicking on an entity
      const entity = this._getEntityAt(target.x, target.y);
      if (entity) {
        // Move adjacent and interact
        const adjPath = this._findPathAdjacentTo(target.x, target.y);
        if (adjPath.length > 0) {
          this.currentPath = adjPath;
          this.currentPath.interactTarget = entity;
        } else if (this._isAdjacent(this.player.position, target)) {
          this._interactWith(entity);
        }
      } else {
        // Move to tile
        const path = findPath(mapData.groundGrid, this.player.position, target);
        if (path.length > 0) {
          this.currentPath = path;
        }
      }
    }

    // Right click to examine
    if (this.input.consumeRightClick()) {
      const target = this.camera.screenToTile(this.input.mouseX, this.input.mouseY);
      this._examine(target.x, target.y);
    }

    // Follow path
    if (this.currentPath.length > 0) {
      this.moveTimer -= dt;
      if (this.moveTimer <= 0) {
        const next = this.currentPath.shift();
        const dx = next.x - this.player.position.x;
        const dy = next.y - this.player.position.y;
        this._tryMovePlayer(dx, dy);
        this.moveTimer = this.moveDelay;

        // If path complete and has interact target
        if (this.currentPath.length === 0 && this.currentPath.interactTarget) {
          this._interactWith(this.currentPath.interactTarget);
        }
      }
    }

    // Interact key (E or Space)
    if (this.input.isKeyJustPressed('e') || this.input.isKeyJustPressed(' ')) {
      this._interactNearby();
    }
  }

  _handleCombatInput(dt) {
    // Combat is handled through the CombatSystem and UI buttons
  }

  _handlePanelHotkeys() {
    if (this.input.isKeyJustPressed('i')) {
      eventBus.emit(Events.UI_PANEL_OPEN, 'inventory');
    }
    if (this.input.isKeyJustPressed('c')) {
      eventBus.emit(Events.UI_PANEL_OPEN, 'character');
    }
    if (this.input.isKeyJustPressed('q')) {
      eventBus.emit(Events.UI_PANEL_OPEN, 'quests');
    }
    if (this.input.isKeyJustPressed('escape')) {
      eventBus.emit(Events.UI_PANEL_CLOSE);
    }
  }

  /**
   * Try to move the player by dx, dy. Handles collisions and interactions.
   */
  _tryMovePlayer(dx, dy) {
    const newX = this.player.position.x + dx;
    const newY = this.player.position.y + dy;
    const mapData = this.mapSystem.getCurrentMap();

    if (!mapData) return false;
    if (newY < 0 || newY >= mapData.height || newX < 0 || newX >= mapData.width) return false;

    // Check ground tile
    const groundTile = mapData.groundGrid[newY][newX];
    const groundProps = this.mapSystem.getTileProps(groundTile);

    // Check object tile
    const objTile = mapData.objectGrid ? mapData.objectGrid[newY][newX] : 0;
    const objProps = objTile ? this.mapSystem.getTileProps(objTile) : null;

    // Handle doors
    if (objProps && objProps.interactable && !objProps.walkable) {
      this.mapSystem.interactTile(newX, newY);
      return false;
    }

    // Check walkability
    if (!groundProps.walkable) return false;
    if (objProps && !objProps.walkable) return false;

    // Check entity collision
    const blockingEntity = this._getBlockingEntityAt(newX, newY);
    if (blockingEntity) {
      if (blockingEntity.hostile) {
        this.combatSystem.startCombat(blockingEntity);
      } else {
        this._interactWith(blockingEntity);
      }
      return false;
    }

    // Check map exits
    this._checkMapExits(newX, newY);

    // Move player
    this.player.position.x = newX;
    this.player.position.y = newY;
    this.updateFOV();

    eventBus.emit(Events.PLAYER_MOVE, newX, newY);
    return true;
  }

  _checkMapExits(x, y) {
    const mapData = this.mapSystem.getCurrentMap();
    if (!mapData || !mapData.exits) return;

    for (const exit of mapData.exits) {
      if (exit.x === x && exit.y === y) {
        eventBus.emit(Events.MAP_CHANGE, exit.targetMap, exit.targetSpawn);
        return;
      }
    }
  }

  _getEntityAt(x, y) {
    return this.entities.find(e =>
      e.position && e.position.x === x && e.position.y === y && e.alive !== false
    );
  }

  _getBlockingEntityAt(x, y) {
    return this.entities.find(e =>
      e.position && e.position.x === x && e.position.y === y &&
      e.blocking && e.alive !== false
    );
  }

  _isAdjacent(a, b) {
    return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;
  }

  _findPathAdjacentTo(tx, ty) {
    const mapData = this.mapSystem.getCurrentMap();
    if (!mapData) return [];

    // Find nearest walkable adjacent tile
    const offsets = [
      {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0},
      {x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: 1, y: 1},
    ];

    let bestPath = null;
    for (const off of offsets) {
      const ax = tx + off.x;
      const ay = ty + off.y;
      if (ax === this.player.position.x && ay === this.player.position.y) return [];
      const path = findPath(mapData.groundGrid, this.player.position, { x: ax, y: ay });
      if (path.length > 0 && (!bestPath || path.length < bestPath.length)) {
        bestPath = path;
      }
    }

    return bestPath || [];
  }

  _interactWith(entity) {
    if (!entity) return;

    eventBus.emit(Events.ENTITY_INTERACT, entity);

    if (entity.dialogId) {
      this.dialogSystem.startDialog(entity.dialogId, entity);
    } else if (entity.type === 'container') {
      this._openContainer(entity);
    } else if (entity.type === 'item_pickup') {
      this._pickupItem(entity);
    }
  }

  _interactNearby() {
    const px = this.player.position.x;
    const py = this.player.position.y;

    // Check adjacent tiles for entities
    const offsets = [
      {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0},
    ];

    for (const off of offsets) {
      const entity = this._getEntityAt(px + off.x, py + off.y);
      if (entity) {
        this._interactWith(entity);
        return;
      }
    }

    // Check tile interactions
    const mapData = this.mapSystem.getCurrentMap();
    if (mapData && mapData.objectGrid) {
      for (const off of offsets) {
        const tx = px + off.x;
        const ty = py + off.y;
        if (ty >= 0 && ty < mapData.height && tx >= 0 && tx < mapData.width) {
          const tileId = mapData.objectGrid[ty][tx];
          const props = this.mapSystem.getTileProps(tileId);
          if (props && props.interactable) {
            this.mapSystem.interactTile(tx, ty);
            return;
          }
        }
      }
    }

    eventBus.emit(Events.UI_MESSAGE, 'system', 'Nothing interesting to interact with. Story of your life, really.');
  }

  _examine(x, y) {
    const mapData = this.mapSystem.getCurrentMap();
    if (!mapData) return;

    // Check entity
    const entity = this._getEntityAt(x, y);
    if (entity) {
      eventBus.emit(Events.UI_MESSAGE, 'system', entity.description || `You see ${entity.name}.`);
      return;
    }

    // Check tile
    if (y >= 0 && y < mapData.height && x >= 0 && x < mapData.width) {
      const objTile = mapData.objectGrid ? mapData.objectGrid[y][x] : 0;
      const groundTile = mapData.groundGrid[y][x];
      const tile = objTile || groundTile;
      const props = this.mapSystem.getTileProps(tile);
      if (props) {
        eventBus.emit(Events.UI_MESSAGE, 'system', `You see: ${props.name}`);
      }
    }
  }

  _openContainer(entity) {
    if (entity.items && entity.items.length > 0) {
      for (const itemId of entity.items) {
        this.inventorySystem.addItem(itemId);
      }
      entity.items = [];
      eventBus.emit(Events.UI_MESSAGE, 'loot', `You search the ${entity.name} and find some items.`);
    } else {
      eventBus.emit(Events.UI_MESSAGE, 'system', `The ${entity.name} is empty. Someone beat you to it.`);
    }
  }

  _pickupItem(entity) {
    if (entity.itemId) {
      this.inventorySystem.addItem(entity.itemId);
      entity.alive = false;
      this.entities = this.entities.filter(e => e !== entity);
    }
  }

  updateFOV() {
    const mapData = this.mapSystem.getCurrentMap();
    if (!mapData) return;
    this.fovSet = computeFOV(
      mapData.groundGrid,
      this.player.position.x,
      this.player.position.y,
      this.fovRadius
    );
  }

  /**
   * Render the game.
   */
  render() {
    this.renderer.clear();

    const mapData = this.mapSystem.getCurrentMap();
    if (!mapData) return;

    // Draw map
    this.renderer.drawMap(mapData, this.camera, this.fovSet, this.player.mapId);

    // Draw entities
    this.renderer.drawEntities(this.entities, this.camera, this.fovSet);

    // Draw player
    this.renderer.drawPlayer(this.player, this.camera);

    // Draw path preview
    if (this.currentPath.length > 0) {
      this.renderer.drawPath(this.currentPath, this.camera);
    }

    // Draw hover
    if (this.hoverTile) {
      this.renderer.drawHover(this.hoverTile.x, this.hoverTile.y, this.camera);
    }

    // Combat range
    if (this.state === GameState.COMBAT) {
      const weapon = this.player.equipped.weapon;
      const range = weapon ? weapon.range : 1;
      this.renderer.drawCombatRange(
        this.player.position.x, this.player.position.y,
        range, this.camera
      );
    }
  }

  /**
   * Get full game state for saving.
   */
  getState() {
    return {
      player: JSON.parse(JSON.stringify(this.player)),
      flags: { ...this.flags },
      quests: this.questSystem.getState(),
      inventory: this.inventorySystem.getState(),
      entities: this.mapSystem.getEntityStates(),
      explored: Array.from(this.renderer.explored.entries()).map(
        ([k, v]) => [k, Array.from(v)]
      ),
    };
  }

  /**
   * Restore game state from save data.
   */
  loadState(saveData) {
    this.player = saveData.player;
    this.flags = saveData.flags;
    this.questSystem.loadState(saveData.quests);
    this.inventorySystem.loadState(saveData.inventory);
    this.mapSystem.loadEntityStates(saveData.entities);

    // Restore explored maps
    if (saveData.explored) {
      this.renderer.explored = new Map(
        saveData.explored.map(([k, v]) => [k, new Set(v)])
      );
    }

    // Load current map
    this.loadMap(this.player.mapId, null);
    this.player.position = saveData.player.position;

    this.state = GameState.PLAYING;
    eventBus.emit(Events.UI_UPDATE);
  }

  hasFlag(key) {
    return !!this.flags[key];
  }

  setFlag(key, value = true) {
    this.flags[key] = value;
    eventBus.emit(Events.FLAG_SET, key, value);
  }
}
