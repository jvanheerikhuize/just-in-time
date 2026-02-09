# Code Patterns & Conventions

> Follow these patterns when generating or modifying code.

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Last Updated | 2026-02-09 |

---

## 1. General Principles

1. **Vanilla JS only** - No frameworks, no TypeScript, no build tools
2. **ES Modules** - Native browser `import`/`export`, no bundler
3. **Data-driven content** - Game content lives in `data/*.js` as plain objects
4. **Event-driven communication** - Systems talk via EventBus, not direct references
5. **Composition over inheritance** - Game owns systems, systems don't inherit from a base

---

## 2. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | PascalCase (classes), camelCase (data) | `Game.js`, `maps.js` |
| Classes | PascalCase | `CombatSystem`, `UIManager` |
| Functions/methods | camelCase | `loadMap()`, `updateHUD()` |
| Constants/enums | SCREAMING_SNAKE | `MAX_HP`, `Tiles.WALL_STONE` |
| Private methods | underscore prefix | `_tryMovePlayer()`, `_dimColor()` |
| Event names | colon-separated | `'player:move'`, `'combat:hit'` |
| Data definitions | SCREAMING_SNAKE + `_DEFS` | `ENTITY_DEFS`, `ITEM_DEFS` |
| Tile IDs | `Tiles.CATEGORY_NAME` | `Tiles.FLOOR_STONE`, `Tiles.DOOR_CLOSED` |

---

## 3. File Organization

### Directory Structure
```
src/js/
├── main.js               # Entry: creates Game + UIManager, wires events
├── core/                  # Shared foundation (no game logic)
│   ├── constants.js       # All enums, tile defs, attribute config
│   ├── EventBus.js        # Singleton pub/sub
│   └── utils.js           # A* pathfinding, FOV, base64, seeded RNG
├── engine/                # Game loop and rendering
│   ├── Game.js            # Main game class, state machine, update/render
│   ├── Camera.js          # Viewport management
│   ├── Renderer.js        # Canvas tile renderer
│   └── Input.js           # Keyboard + mouse input
├── systems/               # Game logic (stateful)
│   ├── MapSystem.js       # Map loading, tile lookup, entity management
│   ├── CharacterSystem.js # Attributes, skills, derived stats, level-up
│   ├── CombatSystem.js    # Turn-based combat, initiative, damage
│   ├── DialogSystem.js    # Branching dialog with conditions/effects
│   ├── QuestSystem.js     # Quest stages, objectives, rewards
│   ├── InventorySystem.js # Items, equipment, weight
│   └── SaveSystem.js      # LocalStorage save/load
├── ui/                    # DOM-based UI
│   └── UIManager.js
└── data/                  # Content definitions (pure data, no logic)
    ├── maps.js
    ├── entities.js
    ├── items.js
    ├── quests.js
    └── dialogs.js
```

### File Contents Order
```javascript
// 1. Imports (core first, then data)
import { Tiles, WASTED_ATTRIBUTES } from '../core/constants.js';
import { eventBus, Events } from '../core/EventBus.js';

// 2. Module-level constants
const SOME_CONSTANT = 42;

// 3. Exported class
export class SystemName {
  constructor(game) {
    this.game = game;
  }
  // Public methods first, private (_prefixed) methods last
}
```

---

## 4. Code Patterns

### 4.1 System Pattern
Every game system receives the Game reference:
```javascript
export class FooSystem {
  constructor(game) {
    this.game = game;
  }
  doSomething() { ... }
  _internalHelper() { ... }
}
```
Systems are created in `Game.constructor()` and accessed via `this.game.fooSystem`.

### 4.2 EventBus Pattern
Systems communicate through events, never direct method calls between systems:
```javascript
// Publishing
eventBus.emit(Events.PLAYER_MOVE, x, y);

// Subscribing
eventBus.on(Events.PLAYER_MOVE, () => ui.updateHUD());
```
Events are string constants defined in `EventBus.js`.

### 4.3 Data-Driven Content
All game content is exported object literals:
```javascript
export const ITEM_DEFS = {
  stimpak: {
    id: 'stimpak',
    name: 'Stimpak',
    type: 'consumable',
    effect: { type: 'heal', value: 30 },
    weight: 0.5,
    value: 25,
    description: 'Heals 30 HP.',
  },
};
```
Content files have no logic, only data.

### 4.4 Map Encoding
Maps are authored as ASCII text, encoded to base64:
```javascript
const mapText = `
##########
#........#
#.@......#
##########
`;

export const MAP_DEFS = {
  map_id: {
    ...encodeMap(mapText),
    name: 'Map Name',
    spawns: { default: { x: 2, y: 2 } },
    exits: [...],
    entities: [...],
  },
};
```
`CHAR_TO_TILE` in `constants.js` maps ASCII chars to tile IDs.

### 4.5 Dialog Trees
```javascript
export const DIALOG_DEFS = {
  npc_name: {
    startNode: 'greeting',
    nodes: {
      greeting: {
        speaker: 'NPC Name',
        text: 'Dialog text.',
        responses: [
          { text: 'Response', nextNode: 'other_node' },
          { text: '[Wits 7+] Skill check',
            condition: { type: 'attribute', attr: 'wits', min: 7 },
            nextNode: 'smart_response' },
        ],
      },
    },
  },
};
```

### 4.6 Quest Definitions
```javascript
export const QUEST_DEFS = {
  quest_id: {
    id: 'quest_id',
    title: 'Quest Title',
    stages: {
      start: {
        objectives: [
          { type: 'talk', target: 'npc_id', description: 'Talk to NPC' },
        ],
        nextStage: 'stage_2',
      },
    },
    rewards: { xp: 100, caps: 50 },
  },
};
```
Objective types: `go`, `talk`, `kill`, `fetch`, `use`.

---

## 5. UI Pattern

All DOM interaction goes through `UIManager`. No other file touches the DOM.
```javascript
this.hpBar = document.getElementById('hp-bar');
eventBus.on(Events.COMBAT_HIT, () => this.updateHUD());
```

---

## 6. Anti-Patterns

| Don't | Do |
|-------|-----|
| Import frameworks or libraries | Use vanilla JS APIs |
| Call system methods across systems | Use EventBus |
| Put logic in data files | Keep data files pure data |
| Touch DOM outside UIManager | Route all UI through UIManager |
| Hardcode tile IDs or magic numbers | Use constants from `constants.js` |
| Add a build step or transpiler | ES modules run directly in browser |
| Create deep inheritance hierarchies | Use composition |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | 2026-02-09 | Jerry | Initial version for Just In Time v0.1.0 |
