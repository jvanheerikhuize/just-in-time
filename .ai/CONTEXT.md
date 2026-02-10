# Project Context

> **For AI Assistants**: This is the master context file. Start here for a complete understanding of the project.

<!--
  AI PROCESSING INSTRUCTIONS:
  1. Read this file first to understand project scope
  2. Follow links to detailed documents as needed
  3. Check config.yaml for behavior preferences
  4. Respect patterns in architecture/PATTERNS.md
-->

## Quick Reference

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [SPEC.md](specs/SPEC.md) | Product requirements | Understanding WHAT to build |
| [ARCHITECTURE.md](architecture/ARCHITECTURE.md) | System design | Understanding HOW it's built |
| [PATTERNS.md](architecture/PATTERNS.md) | Code conventions | Writing or reviewing code |
| [decisions/](decisions/) | ADRs | Understanding WHY decisions were made |

---

## 1. Project Summary

### Identity
- **Name**: Just In Time
- **Type**: Browser-based RPG Game (Web App)
- **Stage**: MVP (v0.1.0 "Unfrozen")

### One-Liner
> A post-apocalyptic browser RPG in the style of Fallout II with Infocom-style dark humor, built with vanilla JavaScript and HTML5 Canvas.

### Tech Stack
| Layer | Technology |
|-------|------------|
| Language | Vanilla JavaScript (ES Modules) |
| Framework | None (no framework, no build step) |
| Rendering | HTML5 Canvas (isometric pixel-based) |
| Styling | CSS (single stylesheet) |
| Serving | `npx serve` (static file server) |
| Storage | LocalStorage (save games) |

---

## 2. Current State

### Active Work
- [x] v0.1.0 "Unfrozen" - First playable version
- [x] 3 maps: Vault 42, Dustbowl Settlement, The Wastes
- [x] Tutorial quest chain (Wake-Up Call, Fresh Air)
- [x] Core systems: movement, combat, dialog, quests, inventory, save/load
- [ ] Additional quests and content beyond starter areas
- [ ] Expanded wasteland map areas

### Recent Changes
- 2026-02-10: Player facing direction tracking with compass HUD and directional chevron on sprite
- 2026-02-10: Reputation UI display in character panel (RELATIONSHIPS section with color-coded tiers)
- 2026-02-10: Fixed map exit coordinates (Vault 42 and Wastes exits aligned with v/^ tiles)
- 2026-02-10: NPC reputation system with thresholds (Hostile/Unfriendly/Friendly/Allied/Romance)
- 2026-02-10: Reputation-gated dialog branches for Scarlett, Mayor, Doc Feelgood, Rusty
- 2026-02-10: Faction allies system (killing entity penalizes rep with allies)
- 2026-02-10: Entity persistence across map transitions (dead enemies stay dead, looted containers stay empty)
- 2026-02-10: Minimap entity colors based on reputation tier
- 2026-02-10: Isometric pixel-based renderer (replaced ASCII tile rendering)
- 2026-02-09: Initial commit with v0.1.0 "Unfrozen" first playable release
- 2026-02-09: Implemented W.A.S.T.E.D. attribute system, turn-based combat, branching dialog trees
- 2026-02-09: 6 quests (3 main, 3 side), 6 NPCs, 3 enemy types

### Known Issues

**Critical:**
- HUD HP color is red at >= 50% health (should be green) -- UIManager.js
- Buff consumable effects are permanent (message says "temporarily") -- InventorySystem.js
- FOV only checks ground layer (player can see through closed doors) -- Game.js
- Pathfinding only checks ground layer (routes through object-layer walls) -- Game.js
- Camera snaps on load (loadMap repositions before save data restores position) -- Game.js

**Moderate:**
- Enemies walk through walls during combat movement -- CombatSystem.js
- Settings button on main menu has no handler
- Doctor's Orders quest requires talking to Doc Feelgood again after starting
- Weapons have infinite ammo (ammoType property unused)
- Per-weapon AP costs ignored (global constants used instead)

**Minor:**
- MAX_SAVES constant unused, save slots unlimited
- Tab key prevented but unused
- Combat turn order calculated but not used (all enemies act simultaneously)

**Resolved:**
- ~~Save/load loses entity states across maps~~ - Fixed: entity persistence in Game.loadMap()
- ~~Map exit coordinates misaligned with v/^ tiles~~ - Fixed: coordinates updated in maps.js

---

## 3. Key Concepts

### Domain Model
```
[Game] ──owns── [Player] ──has── [Inventory]
  │                │                  │
  ├─[MapSystem]    ├─[Attributes]     └─[Items]
  ├─[CombatSystem] ├─[Skills]
  ├─[DialogSystem] ├─[Position]
  ├─[QuestSystem]  ├─[Facing]
  ├─[SaveSystem]   └─[Reputation{}] (npcId -> integer)
  └─[Reputation Thresholds: -50 Hostile, -25 Unfriendly, +25 Friendly, +50 Allied, +75 Romance]

[Map] ──contains── [Entities] (NPCs, Enemies, Containers)
  │                    │
  ├─[GroundGrid]       ├─[allies[]] (faction links)
  ├─[ObjectGrid]       └─[EntityStates] (persisted across map transitions)
  ├─[Spawns]
  └─[Exits] ──link to── [Other Maps]
```

### Game Systems
| System | Responsibility | Key Data |
|--------|---------------|----------|
| MapSystem | Map loading, tile lookups, entity placement, entity persistence | Maps, tile grids, exits, entityStates |
| CharacterSystem | Attributes, skills, level-up, derived stats | W.A.S.T.E.D. attributes |
| CombatSystem | Turn-based combat, hit/miss, damage | AP costs, accuracy, initiative |
| DialogSystem | Branching conversations, skill checks, reputation effects | Dialog trees, conditions, effects |
| QuestSystem | Quest tracking, objective completion | Quest stages, objectives, rewards |
| InventorySystem | Item management, equip/use | Items, weight, equipment slots |
| SaveSystem | Save/load to LocalStorage | Full game state serialization |

### Critical Paths
1. **New Game**: Main Menu -> Character Creation (W.A.S.T.E.D.) -> Vault 42 -> Tutorial Quest
2. **Exploration**: Move (click/WASD) -> FOV update -> Facing direction update -> Interact (entities/tiles) -> Map exits
3. **Combat**: Encounter hostile (or hostile reputation) -> Turn-based (attack/shoot/item/flee) -> XP/Loot -> Reputation penalty to allies -> Return to exploration
4. **Dialog**: Interact with NPC -> Dialog tree -> Skill checks -> Reputation conditions -> Effects (quests, flags, items, reputation changes)
5. **Reputation**: Dialog choices/combat kills -> Reputation changes -> Faction ally penalties -> NPC hostility/dialog gating -> UI display in character panel

---

## 4. Codebase Navigation

### Entry Points
| Purpose | Location |
|---------|----------|
| HTML shell | `src/index.html` |
| JS entry point | `src/js/main.js` |
| Game engine | `src/js/engine/Game.js` |
| Stylesheet | `src/css/game.css` |

### Key Files
```
src/
├── index.html                # HTML shell with all UI panels
├── css/
│   └── game.css              # All styles (retro terminal theme)
└── js/
    ├── main.js               # Entry: init, event wiring, game loop start
    ├── core/
    │   ├── constants.js      # All enums, tile defs, W.A.S.T.E.D. attributes
    │   ├── EventBus.js       # Singleton pub/sub event system
    │   └── utils.js          # Base64 codec, A* pathfinding, FOV, seeded RNG
    ├── engine/
    │   ├── Game.js           # Main game class: state, loop, input handling
    │   ├── Camera.js         # Viewport camera (follow player, screen-to-tile)
    │   ├── Renderer.js       # Isometric pixel renderer, fog of war, entity drawing
    │   ├── TileSprites.js    # Pre-rendered tile sprite cache for isometric tiles
    │   └── Input.js          # Keyboard + mouse input manager
    ├── systems/
    │   ├── MapSystem.js      # Map loading, tile lookup, entity management
    │   ├── CharacterSystem.js # Attributes, skills, derived stats, level-up
    │   ├── CombatSystem.js   # Turn-based combat logic
    │   ├── DialogSystem.js   # Branching dialog with skill checks
    │   ├── QuestSystem.js    # Quest state tracking, objectives
    │   ├── InventorySystem.js # Items, equipment, weight
    │   └── SaveSystem.js     # LocalStorage save/load
    ├── ui/
    │   └── UIManager.js      # DOM-based UI panels, HUD, menus
    └── data/
        ├── maps.js           # Map definitions (text -> base64 encoded)
        ├── entities.js       # NPC, enemy, container definitions
        ├── items.js          # Weapon, armor, consumable definitions
        ├── quests.js         # Quest stages, objectives, rewards
        └── dialogs.js        # Branching dialog trees
```

### Module Map
```
[index.html] loads [main.js]
        │
        ▼
[Game] ──creates──► [Camera, Renderer, Input]
  │
  ├──creates──► [MapSystem] ──reads──► [data/maps.js, data/entities.js]
  ├──creates──► [CharacterSystem] ──reads──► [core/constants.js]
  ├──creates──► [CombatSystem]
  ├──creates──► [DialogSystem] ──reads──► [data/dialogs.js]
  ├──creates──► [QuestSystem] ──reads──► [data/quests.js]
  ├──creates──► [InventorySystem] ──reads──► [data/items.js]
  └──creates──► [SaveSystem]

[UIManager] ──reads──► [Game] state
[EventBus] ◄──used by──► all systems (decoupled communication)
```

---

## 5. Development Rules

### Must Follow
1. **No build step** - Everything runs directly in the browser via ES modules
2. **No frameworks** - Vanilla JS only; no React, no jQuery, no bundlers
3. **Data-driven content** - Maps, entities, items, quests, dialogs are all JS data files
4. **Spec before code** - Features require approved specs
5. **Event-driven communication** - Systems communicate via EventBus, not direct calls

### Prefer
1. Composition over inheritance
2. Data files for content, code files for logic
3. Small, focused system classes
4. Constants defined in `constants.js`, not magic numbers
5. Humorous descriptions in Infocom style for all game content

### Avoid
1. External dependencies or npm packages at runtime
2. Direct DOM manipulation outside UIManager
3. Systems directly referencing each other (use EventBus)
4. Hardcoded tile IDs (use Tiles enum from constants.js)
5. Breaking the retro terminal aesthetic

---

## 6. Testing Requirements

### Coverage Expectations
| Type | Target | Focus |
|------|--------|-------|
| Manual | Primary | Play-through testing of quests and combat |
| Unit | Future | Core utilities (pathfinding, FOV, base64 codec) |
| E2E | Future | Automated browser testing of game flows |

### Test Approach
Currently tested manually via browser. The game can be inspected at runtime
via `window.game` and `window.eventBus` exposed in the console.

---

## 7. Environment Setup

### Prerequisites
```bash
# Required tools
Node.js >= 18  # Only needed for the static file server (npx serve)
A modern browser  # Chrome, Firefox, Edge, Safari
```

### Quick Start
```bash
# Clone and run
git clone <repo-url>
cd just-in-time
npm run dev
# Opens at http://localhost:8080
```

### Environment Variables
No environment variables required. The game is entirely client-side with no backend.

---

## 8. AI Assistant Guidelines

### When Generating Code
1. **Read before writing** - Understand existing patterns first
2. **Match style** - Follow PATTERNS.md conventions
3. **Minimal changes** - Don't refactor unrelated code
4. **Include tests** - Generate tests alongside implementation

### When Answering Questions
1. **Reference files** - Point to specific code locations
2. **Cite architecture** - Link to relevant ADRs
3. **Stay current** - Check "Recent Changes" above

### When Debugging
1. **Check known issues** - Review section above first
2. **Trace data flow** - Follow the module map
3. **Verify assumptions** - Read actual implementation

### Forbidden Actions
- Do not introduce build steps, transpilers, or bundlers
- Do not add npm runtime dependencies
- Do not break the ES module import/export structure
- Do not change tile IDs or map encoding without updating all references
- Do not modify save game format without migration support

---

## 9. Related Documentation

### Internal
- [specs/](specs/) - Product specifications
- [architecture/](architecture/) - Technical architecture
- [decisions/](decisions/) - Architecture Decision Records

### External
- Inspired by Fallout 1 & 2 (Interplay/Black Isle Studios)
- Infocom text adventure humor style
- Isometric pixel-based rendering with painter's algorithm depth sorting

---

## 10. Contacts

| Role | Contact | When to Escalate |
|------|---------|-----------------|
| Developer | Jerry | All decisions |

---

## Document Maintenance

| Field | Value |
|-------|-------|
| Last Updated | 2026-02-10 |
| Update Frequency | After each version release |
| Owner | Jerry |

### Update Checklist
When updating this document:
- [ ] Update "Current State" section
- [ ] Review "Key Files" for accuracy
- [ ] Check "Known Issues" is current
- [ ] Verify links are working
