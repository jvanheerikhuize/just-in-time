# System Architecture

> **For AI Assistants**: This document defines HOW the system is built. For WHAT it does, see `../specs/SPEC.md`. For WHY decisions were made, see `../decisions/`.

## Document Info

| Field | Value |
|-------|-------|
| Version | 0.2.0-dev |
| Status | Active |
| Last Updated | 2026-02-10 |
| Owner | Jerry |

---

## 1. Architecture Overview

### 1.1 System Context
<!-- Highest level view: the system and its environment -->

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              JUST IN TIME (Client-Only)               │   │
│  │                                                        │   │
│  │  [index.html] ──loads──► [ES Module Bundle]           │   │
│  │       │                       │                        │   │
│  │  [game.css]             [main.js entry point]         │   │
│  │                               │                        │   │
│  │                    ┌──────────┼──────────┐            │   │
│  │                    ▼          ▼          ▼            │   │
│  │              [Game Engine] [Systems] [UI Manager]     │   │
│  │                    │          │          │            │   │
│  │                    ▼          ▼          ▼            │   │
│  │              [Canvas]  [EventBus]  [DOM Panels]      │   │
│  │                               │                        │   │
│  │                        [LocalStorage]                  │   │
│  │                        (Save/Load)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
                    [Player in Browser]

No external systems. No server. No API. Fully client-side.
```

### 1.2 Architecture Style

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Overall Style | Single-page client-side application | No server needed; runs entirely in browser |
| Module System | ES Modules (native browser imports) | No bundler/build step; direct browser support |
| Rendering | HTML5 Canvas 2D (Isometric) | Isometric pixel projection with depth-sorted painter's algorithm |
| Communication | Event-driven (pub/sub EventBus) | Decouples game systems; clean separation of concerns |
| Data Storage | Browser LocalStorage | Simple persistence for save games; no backend needed |
| Content Format | JS data files (objects/maps) | Easy to author; no parsing step; importable as modules |

---

## 2. Component Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌─────────────────────────────┐      │
│  │  HTML Shell       │  │  UIManager (DOM)             │      │
│  │  (index.html)     │  │  - Main Menu                 │      │
│  │  - Canvas element │  │  - Character Creation        │      │
│  │  - Overlay panels │  │  - HUD (HP/AP/Caps/XP)      │      │
│  │  - Message log    │  │  - Side Panels (Inv/Quest)   │      │
│  └────────┬─────────┘  │  - Dialog Overlay             │      │
│           │             │  - Combat Overlay             │      │
│           ▼             └──────────────┬────────────────┘      │
│  ┌──────────────────┐                 │                        │
│  │  Renderer         │                 │                        │
│  │  (Canvas 2D)      │◄────EventBus───┘                        │
│  │  - Tile drawing   │                                         │
│  │  - FOV/fog        │                                         │
│  │  - Entity sprites │                                         │
│  │  - Path preview   │                                         │
│  └──────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
                             │
                      ┌──────┴──────┐
                      ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Engine Layer                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌───────────┐  ┌───────────┐         │
│  │  Game             │  │  Camera   │  │  Input    │         │
│  │  - Game loop      │  │  - Follow │  │  - Keys   │         │
│  │  - State machine  │  │  - Scroll │  │  - Mouse  │         │
│  │  - System coord.  │  │  - Tile   │  │  - Click  │         │
│  │  - Player state   │  │    lookup │  │    queue  │         │
│  └────────┬─────────┘  └───────────┘  └───────────┘         │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Systems Layer                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐      │
│  │MapSystem │ │CharSystem │ │CombatSys │ │DialogSys │      │
│  │- Load    │ │- Attrs    │ │- Turns   │ │- Trees   │      │
│  │- Decode  │ │- Skills   │ │- Actions │ │- Checks  │      │
│  │- Tiles   │ │- Level up │ │- Hit/Miss│ │- Effects │      │
│  │- Exits   │ │- Derived  │ │- Damage  │ │- Conds   │      │
│  └──────────┘ └───────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐                    │
│  │QuestSys  │ │InvenSys   │ │SaveSys   │                    │
│  │- Stages  │ │- Items    │ │- Serial  │                    │
│  │- Objs    │ │- Equip    │ │- Local   │                    │
│  │- Rewards │ │- Weight   │ │  Storage │                    │
│  └──────────┘ └───────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  maps.js    │ │ entities.js │ │  items.js   │           │
│  │  (base64)   │ │ (NPCs/foes) │ │  (gear)     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  quests.js  │ │ dialogs.js  │ │constants.js │           │
│  │  (stages)   │ │ (trees)     │ │ (tiles/enum)│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘

   [EventBus] ◄──── singleton pub/sub connecting all layers ────►
```

### 2.2 Component Descriptions

| Component | Purpose | Technology | Location |
|-----------|---------|------------|----------|
| Game | Main game loop, state machine, system coordinator | Vanilla JS class | `engine/Game.js` |
| Camera | Viewport management, screen-to-tile conversion | Vanilla JS class | `engine/Camera.js` |
| Renderer | Canvas 2D tile rendering, fog of war, entity drawing | Canvas API | `engine/Renderer.js` |
| Input | Keyboard and mouse input with click queue | DOM events | `engine/Input.js` |
| MapSystem | Map loading, base64 decode, tile lookups, entity placement | Vanilla JS class | `systems/MapSystem.js` |
| CharacterSystem | W.A.S.T.E.D. attributes, skill calculation, level-up | Vanilla JS class | `systems/CharacterSystem.js` |
| CombatSystem | Turn-based combat, initiative, attack/defend, AP management | Vanilla JS class | `systems/CombatSystem.js` |
| DialogSystem | Branching dialog trees, skill checks, conditional responses | Vanilla JS class | `systems/DialogSystem.js` |
| QuestSystem | Multi-stage quest tracking, objective completion, rewards | Vanilla JS class | `systems/QuestSystem.js` |
| InventorySystem | Item management, equipment slots, weight tracking | Vanilla JS class | `systems/InventorySystem.js` |
| SaveSystem | Game state serialization to/from LocalStorage | Vanilla JS class | `systems/SaveSystem.js` |
| UIManager | All DOM-based UI: menus, HUD, panels, overlays | DOM manipulation | `ui/UIManager.js` |
| EventBus | Singleton pub/sub for decoupled system communication | Vanilla JS class | `core/EventBus.js` |

---

## 3. Data Architecture

### 3.1 Data Model Overview

```
┌────────────────┐       ┌────────────────┐
│    Player      │       │    Map         │
├────────────────┤       ├────────────────┤
│ name           │       │ id             │
│ attributes     │──on──▶│ name           │
│ skills         │       │ width, height  │
│ hp/maxHp       │       │ groundGrid[]   │ ◄── base64 decoded
│ ap/maxAp       │       │ objectGrid[]   │ ◄── base64 decoded
│ xp, level      │       │ spawns{}       │
│ caps           │       │ exits[]        │──links to──▶ [Other Maps]
│ position {x,y} │       │ entities[]     │──refs──▶ [Entity Defs]
│ facing {x,y}   │       └────────────────┘
│ mapId          │
│ equipped{}     │       ┌────────────────┐
│ reputation{}   │──per──▶│ NPC Reputation │ (npcId -> integer, -100 to 100)
└────────────────┘       │ Hostile: -50   │
                         │ Unfriendly: -25│
        │                │ Friendly: +25  │
        │                │ Allied: +50    │
        │                │ Romance: +75   │
        │                └────────────────┘
        │
        │                ┌────────────────┐
        │                │   Entity       │
        │                ├────────────────┤
        └──interacts──▶  │ id, type       │ (NPC, Enemy, Container)
                         │ name           │
                         │ position {x,y} │
                         │ hp, damage     │ (enemies)
                         │ dialogId       │──refs──▶ [Dialog Trees]
                         │ items[]        │──refs──▶ [Item Defs]
                         │ loot[]         │
                         │ allies[]       │ (faction ally entity IDs)
                         └────────────────┘

┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│    Quest       │       │   Item         │       │   Dialog       │
├────────────────┤       ├────────────────┤       ├────────────────┤
│ id, title      │       │ id, name       │       │ startNode      │
│ stages{}       │       │ type           │       │ nodes{}        │
│  └ objectives[]│       │ damage/defense │       │  └ speaker     │
│  └ nextStage   │       │ range, apCost  │       │  └ text        │
│ rewards{}      │       │ weight, value  │       │  └ responses[] │
│  └ xp, caps    │       └────────────────┘       │    └ conditions│
│  └ items[]     │                                │    └ effects   │
└────────────────┘                                │    └ skillCheck│
                                                  └────────────────┘
```

### 3.2 Data Storage Strategy

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| Game content (maps, entities, items, quests, dialogs) | JS data files (imported as ES modules) | Easy to author and extend; no parse step |
| Map tile grids | Base64-encoded Uint8Arrays | Compact storage of 2D tile ID arrays |
| Runtime game state | In-memory JS objects | Fast access during gameplay |
| Persistent saves | Browser LocalStorage (JSON) | Simple client-side persistence |
| Configuration constants | `core/constants.js` | Single source of truth for all enums and settings |

### 3.3 Data Flow

```
[Content Authoring]
  Maps: ASCII text art → encodeMap() → base64 string + dimensions
  Entities/Items/Quests/Dialogs: JS object literals in data files

[Runtime Loading]
  main.js imports → Game creates Systems → Systems import data files
       │
       ▼
  MapSystem.loadMap() → decodeMap(base64) → 2D tile grid arrays
       │
       ▼
  [Game Loop] ←── requestAnimationFrame
       │
       ├── Input.getMovement() → Game.update() → Player moves
       ├── Game._tryMovePlayer() → MapSystem tile lookup → collision check
       ├── EventBus.emit(PLAYER_MOVE) → UIManager.updateHUD()
       ├── Game.render() → Renderer.drawMap() + drawEntities() + drawPlayer()
       │
       ▼
  [Events flow through EventBus to all subscribers]

[Save/Load]
  SaveSystem.save() → Game.getState() → JSON.stringify() → LocalStorage
  SaveSystem.load() → LocalStorage → JSON.parse() → Game.loadState()
```

---

## 4. Event Architecture

### 4.1 External Integrations

None. Just In Time is fully self-contained with no external service dependencies.

### 4.2 Internal Event System (EventBus)

The EventBus is the central nervous system of the game. All inter-system communication
flows through a singleton pub/sub instance. Events are defined as string constants in
`core/EventBus.js`.

### 4.3 Event Catalog

| Event | Publisher(s) | Subscriber(s) | Purpose |
|-------|-------------|---------------|---------|
| `game:start` | Game | UIManager | New game initialized |
| `game:stateChange` | Various | Game | State machine transitions |
| `player:move` | Game | UIManager, main.js (quest tracking) | Player position changed |
| `player:levelUp` | CharacterSystem | UIManager | Level up occurred |
| `player:damage` | CombatSystem | UIManager | Player took damage |
| `map:change` | Game (exits) | Game.loadMap() | Map transition requested |
| `map:loaded` | Game | main.js (quest tracking) | Map finished loading |
| `entity:interact` | Game | main.js (quest tracking) | Player interacted with entity |
| `entity:destroy` | CombatSystem | main.js (quest tracking) | Entity killed/destroyed |
| `combat:start` | CombatSystem | UIManager | Combat begins |
| `combat:end` | CombatSystem | UIManager | Combat ends |
| `combat:hit` | CombatSystem | UIManager, main.js | Attack landed |
| `dialog:start` | DialogSystem | UIManager | Dialog opened |
| `dialog:end` | DialogSystem | UIManager | Dialog closed |
| `quest:start` | QuestSystem | UIManager | New quest started |
| `quest:complete` | QuestSystem | UIManager | Quest completed |
| `item:add` | InventorySystem | main.js (quest tracking) | Item added to inventory |
| `ui:message` | Various | UIManager | Message log entry |
| `ui:panelOpen` | Game (hotkeys) | UIManager | Open side panel |
| `ui:panelClose` | Game (hotkeys) | UIManager | Close side panel |
| `flag:set` | Game | Game (internal) | Story flag changed |
| `reputation:change` | Game | UIManager (minimap colors) | NPC reputation value changed |

---

## 5. Infrastructure Architecture

### 5.1 Deployment

Just In Time is a static site. Deployment is serving the `src/` directory.

```
┌─────────────────────────────────────────────────────────────┐
│  Deployment Options (any static file server)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Development: npx serve src -l 8080                          │
│  Production:  Any static host (GitHub Pages, Netlify, etc.)  │
│                                                               │
│  src/                                                         │
│  ├── index.html          ◄── Entry point                     │
│  ├── css/game.css        ◄── Stylesheet                      │
│  └── js/**/*.js          ◄── ES modules (loaded by browser)  │
│                                                               │
│  No server-side code. No API. No database.                   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Environment Strategy

| Environment | Purpose | How to Run |
|-------------|---------|------------|
| Development | Local development | `npm run dev` (serves on port 8080) |
| Production | Any static hosting | Copy `src/` to web server root |

### 5.3 Scaling Strategy

Not applicable. Single-player client-side game with no server infrastructure.

---

## 6. Security Considerations

### 6.1 Threat Model

Minimal attack surface as there is no server, no authentication, and no personal data.

| Concern | Status | Notes |
|---------|--------|-------|
| No server-side code | N/A | Nothing to exploit remotely |
| No user accounts | N/A | No credentials to protect |
| LocalStorage saves | Low risk | Save data is local to the browser; tamper = cheat |
| No external API calls | N/A | No data leaves the browser |
| No PII collected | N/A | No personal information stored |

### 6.2 Content Security

The game runs entirely from static files. If hosted, standard static-site security headers
(CSP, X-Frame-Options, etc.) should be configured by the hosting platform.

---

## 7. Debugging & Observability

### 7.1 Browser Console

The game exposes debugging globals:
- `window.game` - Full game object (inspect state, call methods)
- `window.eventBus` - EventBus singleton (subscribe to events, emit test events)

### 7.2 Message Log

In-game message log displays categorized messages with color coding:
| Message Type | CSS Class | Color | Purpose |
|-------------|-----------|-------|---------|
| system | msg-system | Green | System/navigation messages |
| action | msg-action | White | Player actions |
| combat | msg-combat | Red | Combat results |
| dialog | msg-dialog | Cyan | Dialog excerpts |
| quest | msg-quest | Yellow/Amber | Quest updates |
| loot | msg-loot | Gold | Item pickups |
| warning | msg-warning | Orange | Warnings |
| humor | msg-humor | Italic green | Humorous flavor text |

### 7.3 Game States

The game state machine tracks the current mode:
| State | Description |
|-------|-------------|
| `menu` | Main menu screen |
| `char_create` | Character creation |
| `playing` | Normal exploration |
| `dialog` | Dialog overlay active |
| `combat` | Turn-based combat active |
| `inventory` | Inventory panel (deprecated, uses panel system) |
| `paused` | Game paused |
| `game_over` | Player death |

---

## 8. Development Standards

### 8.1 Code Organization

```
src/
├── index.html         # HTML shell: all screens, panels, overlays
├── css/
│   └── game.css       # Complete stylesheet (retro terminal theme)
└── js/
    ├── main.js        # Entry: creates Game + UIManager, wires events
    ├── core/          # Shared foundation
    │   ├── constants.js   # All enums, tile defs, attribute config
    │   ├── EventBus.js    # Singleton pub/sub
    │   └── utils.js       # A* pathfinding, FOV, base64, seeded RNG
    ├── engine/        # Game loop and rendering
    │   ├── Game.js        # Main game class
    │   ├── Camera.js      # Viewport camera
    │   ├── Renderer.js    # Canvas tile renderer
    │   └── Input.js       # Keyboard + mouse
    ├── systems/       # Game logic systems
    │   ├── MapSystem.js
    │   ├── CharacterSystem.js
    │   ├── CombatSystem.js
    │   ├── DialogSystem.js
    │   ├── QuestSystem.js
    │   ├── InventorySystem.js
    │   └── SaveSystem.js
    ├── ui/            # DOM-based UI
    │   └── UIManager.js
    └── data/          # Content definitions (data-driven)
        ├── maps.js        # Map layouts (ASCII text → base64)
        ├── entities.js    # NPCs, enemies, containers
        ├── items.js       # Weapons, armor, consumables
        ├── quests.js      # Quest stages and objectives
        └── dialogs.js     # Branching dialog trees
```

### 8.2 Key Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| Event-driven | System communication | `eventBus.emit(Events.PLAYER_MOVE, x, y)` |
| Data-driven content | All game content as JS data | `QUEST_DEFS`, `ENTITY_DEFS`, `ITEM_DEFS` |
| Base64 tile encoding | Compact map storage | `encodeMap(asciiText)` / `decodeMap(base64, w, h)` |
| State machine | Game mode management | `GameState.PLAYING`, `GameState.COMBAT`, etc. |
| System composition | Game owns all systems | `this.mapSystem = new MapSystem(this)` |
| A* pathfinding | Click-to-move navigation | `findPath(grid, start, end, maxSteps)` |
| Raycasting FOV | Visibility computation | `computeFOV(grid, x, y, radius)` |
| Seeded random | Deterministic randomness | `rng.int(min, max)`, `rng.chance(percent)` |

### 8.3 Cross-Cutting Concerns

| Concern | Implementation |
|---------|----------------|
| Inter-system communication | EventBus singleton (pub/sub) |
| Constants & configuration | `core/constants.js` (tiles, attributes, combat, colors) |
| Map encoding | `core/utils.js` (encodeMap/decodeMap with base64) |
| Pathfinding | `core/utils.js` (A* with min-heap, diagonal support) |
| Field of view | `core/utils.js` (raycasting with configurable radius) |
| Random numbers | `core/utils.js` (SeededRandom class) |
| State persistence | SaveSystem serializes full game state to LocalStorage |

---

## 9. Appendix

### A. Technology Choices

| Technology | Status | Notes |
|------------|--------|-------|
| Vanilla JavaScript (ES Modules) | Adopt | No framework; direct browser execution |
| HTML5 Canvas 2D | Adopt | Tile-based ASCII rendering |
| CSS (single file) | Adopt | Retro terminal green-on-black theme |
| LocalStorage | Adopt | Client-side save game persistence |
| `npx serve` | Adopt (dev only) | Zero-config static file server for development |

### B. Architecture Decision Records

See `../decisions/` for detailed ADRs:
- ADR-001: Use vanilla JS with no framework or build step
- ADR-002: Event-driven architecture with centralized EventBus
- ADR-003: Base64-encoded tile maps from ASCII text art
- ADR-004: Data-driven content (all game content in JS data files)

### C. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | 2026-02-09 | Jerry | Initial version - "Unfrozen" architecture |
