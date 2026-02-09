# Product Specification

> **For AI Assistants**: This document defines WHAT the product does. For HOW it's built, see `../architecture/ARCHITECTURE.md`.

## Document Info

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Status | Active |
| Last Updated | 2026-02-09 |
| Owner | Jerry |

---

## 1. Product Overview

### 1.1 Vision
Just In Time is a spec-driven, extensible browser RPG that delivers a post-apocalyptic adventure in the style of Fallout II, with Infocom-style dark humor, all running in a vanilla JavaScript web app with zero build steps.

### 1.2 Problem Statement
**Current State**: Classic isometric RPGs like Fallout II are no longer easily accessible, and modern RPGs have lost the witty, text-driven humor of Infocom adventures.

**Impact**: Players who enjoy narrative-driven, stat-heavy RPGs with dark comedy have few browser-native options.

**Root Cause**: Most browser games either require heavy frameworks or sacrifice depth for simplicity.

### 1.3 Solution Summary
Just In Time solves this by:
1. **Pure browser experience** - No install, no framework, no build step. Open and play.
2. **Deep RPG systems** - W.A.S.T.E.D. attributes, skills, turn-based combat, branching dialogs, quests
3. **Data-driven content** - All maps, entities, items, quests, and dialogs defined as JS data files for easy extension
4. **Spec-driven development** - New content is specified formally before implementation

---

## 2. Users & Personas

### 2.1 Target Users

| Persona | Description | Primary Goal |
|---------|-------------|--------------|
| Retro RPG Fan | Loves classic Fallout, Wasteland, Baldur's Gate | Experience a nostalgic RPG in the browser |
| Text Adventure Fan | Appreciates Infocom/Zork-style humor and writing | Enjoy clever, witty post-apocalyptic storytelling |
| Casual Browser Gamer | Wants a deep game with no install friction | Play an RPG directly from a URL |

### 2.2 User Journey
```
[Open URL] → [Main Menu] → [Create Character (W.A.S.T.E.D.)] → [Wake in Vault 42]
    → [Tutorial Quest: Wake-Up Call] → [Explore Vault] → [Exit to Wastes]
    → [Reach Dustbowl] → [Meet NPCs, Take Quests] → [Explore & Combat]
    → [Save Progress] → [Return Later]
```

---

## 3. Functional Requirements

### 3.1 Core Features

#### Feature: W.A.S.T.E.D. Attribute System
- **ID**: F-001
- **Priority**: Must Have
- **Description**: Character creation with 6 attributes (Wits, Agility, Strength, Toughness, Eyes, Daring) that drive 10 derived skills, HP, AP, carry weight, and skill checks throughout the game.
- **User Story**: As a player, I want to build a unique character so that my choices affect gameplay.
- **Acceptance Criteria**:
  - [x] Given character creation, when allocating points, then attributes range 1-10 with 5 bonus points
  - [x] Given attributes, when calculated, then skills (Firearms, Melee, Lockpick, etc.) derive from attribute pairs
  - [x] Given dialog, when a skill check appears, then it checks against the relevant attribute/skill

#### Feature: Tile-Based Map Exploration
- **ID**: F-002
- **Priority**: Must Have
- **Description**: Navigate tile-based maps via click-to-move (A* pathfinding) or WASD keyboard movement. Maps are defined as ASCII text, encoded to base64, and rendered on HTML5 Canvas with field-of-view and fog of war.
- **User Story**: As a player, I want to explore the wasteland so that I can discover locations, NPCs, and loot.
- **Acceptance Criteria**:
  - [x] Given a map, when the player moves, then FOV updates and unexplored areas remain hidden
  - [x] Given a walkable tile, when clicked, then the player pathfinds to it via A*
  - [x] Given map exits, when stepped on, then the player transitions to the linked map

#### Feature: Turn-Based Combat
- **ID**: F-003
- **Priority**: Must Have
- **Description**: Encounter hostile entities to enter combat. Players spend AP to attack (melee/ranged), use items, or flee. Hit chance based on skills and attributes. Initiative determines turn order.
- **User Story**: As a player, I want tactical combat so that encounters feel strategic.
- **Acceptance Criteria**:
  - [x] Given a hostile entity, when the player bumps into it, then combat starts
  - [x] Given combat, when attacking, then hit/miss is calculated from accuracy and skills
  - [x] Given combat, when an enemy dies, then XP and loot are awarded

#### Feature: Branching Dialog System
- **ID**: F-004
- **Priority**: Must Have
- **Description**: NPCs have dialog trees with multiple response options. Some options require skill checks (e.g., [Wits 7+]). Dialogs can trigger effects: start quests, set flags, give items.
- **User Story**: As a player, I want meaningful conversations so that my character build affects dialog outcomes.
- **Acceptance Criteria**:
  - [x] Given an NPC, when interacted with, then a dialog tree with branching responses appears
  - [x] Given a skill check option, when the player lacks the requirement, then the option is hidden or shown as unavailable
  - [x] Given dialog effects, when chosen, then quests start, flags set, or items are given

#### Feature: Quest System
- **ID**: F-005
- **Priority**: Must Have
- **Description**: Multi-stage quests with typed objectives (go, talk, kill, fetch). Quest completion awards XP, caps, and items. Quests can chain into new quests.
- **User Story**: As a player, I want quests to guide my adventure so that there is purpose to exploration.
- **Acceptance Criteria**:
  - [x] Given an active quest, when an objective is completed, then the quest advances to the next stage
  - [x] Given quest completion, when all stages are done, then rewards are granted and follow-up quests may start
  - [x] Given the quest log, when opened, then active and completed quests are displayed

#### Feature: Inventory & Equipment
- **ID**: F-006
- **Priority**: Must Have
- **Description**: Manage collected items with weight limits. Equip weapons and armor. Use consumables (stimpaks, food, drink). Items affect combat stats and character abilities.
- **User Story**: As a player, I want to manage gear so that I can prepare for challenges.
- **Acceptance Criteria**:
  - [x] Given items, when looted, then they appear in inventory with weight tracking
  - [x] Given a weapon, when equipped, then combat damage and range update
  - [x] Given a consumable, when used, then its effect (heal, buff) is applied

#### Feature: Save/Load System
- **ID**: F-007
- **Priority**: Must Have
- **Description**: Save full game state to LocalStorage. Load from save slots. Auto-save on map transitions.
- **User Story**: As a player, I want to save my progress so that I can return later.
- **Acceptance Criteria**:
  - [x] Given the save panel, when saving, then full state (player, quests, inventory, entities, explored) is persisted
  - [x] Given a save slot, when loading, then the game restores to the exact saved state
  - [x] Given a map change, when entering a new map, then an auto-save occurs

### 3.2 Content: Maps

| Map | Description | Key Features |
|-----|-------------|--------------|
| Vault 42 | Starting cryogenic vault | Cryo pods, CHRONOS terminal, lockers, security bot |
| The Wastes | Open wasteland between locations | Radroaches, road signs, corpse loot, map exits |
| Dustbowl | First settlement (ruined strip mall) | Bar, general store, clinic, town hall, NPCs |

### 3.3 Content: Quests

| Quest | Type | Description |
|-------|------|-------------|
| Wake-Up Call | Main | Tutorial: find terminal, get weapon, exit vault |
| Fresh Air | Main | Survive wastes, reach Dustbowl |
| Water We Gonna Do? | Main | Find water purification chip for Mayor Bottlecap |
| Liquid Courage | Side | Visit The Glowing Pint, meet Scarlett |
| Pest Control | Side | Kill 3 radroaches in the wastes |
| Doctor's Orders | Side | Find medical supplies for Doc Feelgood |

### 3.4 Content: NPCs

| NPC | Location | Role |
|-----|----------|------|
| CHRONOS | Vault 42 (terminal) | Vault AI, tutorial guide, exposition, comic relief |
| Scarlett | Dustbowl (The Glowing Pint) | Bar owner, quest giver, information source |
| Mayor Bottlecap | Dustbowl (Town Hall) | Self-appointed mayor, main quest giver |
| Doc Feelgood | Dustbowl (Clinic) | Town doctor, side quest giver |
| Rusty | Dustbowl (General Store) | Robot merchant, retrofitted vending machine |
| Patches | Dustbowl/Wastes | Traveling merchant trader |

### 3.5 Feature Roadmap

| Phase | Features | Target |
|-------|----------|--------|
| v0.1.0 "Unfrozen" | F-001 through F-007, 3 maps, 6 quests, 6 NPCs | Done |
| v0.2.0 | Additional maps, more quests, trading system, expanded combat | TBD |
| v0.3.0 | Crafting, companions, more enemy types, world map | TBD |
| v1.0.0 | Full story arc, multiple endings, balanced progression | TBD |

---

## 4. Non-Functional Requirements

### 4.1 Performance
| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame Rate | 60 fps | requestAnimationFrame loop |
| Map Load Time | < 100ms | Base64 decode + grid creation |
| Pathfinding | < 16ms | A* with 200-step limit |
| Initial Load | < 2s | All JS modules loaded via ES imports |

### 4.2 Security
- No server-side component; no authentication required
- Save data stored in browser LocalStorage only
- No personal data collected
- No external API calls

### 4.3 Scalability
- **Single-player** - No server infrastructure needed
- **Content scales** via data files (maps, entities, items, quests, dialogs)
- **No data volume concerns** - Client-side only

### 4.4 Compatibility
- **Browsers**: Chrome 90+, Firefox 90+, Edge 90+, Safari 15+
- **Devices**: Desktop primary (keyboard + mouse required for full experience)
- **Integrations**: None (fully self-contained)

---

## 5. Constraints & Assumptions

### 5.1 Constraints
- **No build step**: All code must run directly in the browser as ES modules
- **No runtime dependencies**: No npm packages loaded at runtime; only `npx serve` for development
- **Canvas rendering**: All game visuals rendered via HTML5 Canvas 2D context
- **LocalStorage limits**: Save data constrained by browser LocalStorage (~5-10MB typically)

### 5.2 Assumptions
- Players have a modern browser with ES module support
- Players have keyboard and mouse (touch/mobile is not primary target)
- Content creators can author maps as ASCII text art and dialogs as JS data

### 5.3 Dependencies
| Dependency | Type | Owner | Risk |
|------------|------|-------|------|
| `npx serve` | Dev server only | npm community | Low (dev only, easily replaced) |
| Browser ES Modules | Runtime | Browser vendors | Low (widely supported) |
| LocalStorage API | Save/Load | Browser vendors | Low (universal support) |

---

## 6. Out of Scope

- **Multiplayer**: This is a single-player experience; no networking or server-side logic
- **Mobile/touch support**: Desktop browser with keyboard/mouse is the target platform
- **3D graphics**: The game uses 2D tile-based ASCII art rendering
- **Procedural generation**: Maps are hand-authored; procedural content generation is not planned
- **Monetization**: No in-app purchases, ads, or premium content

---

## 7. Success Metrics

### 7.1 Key Performance Indicators (KPIs)
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Playable maps | 3 | 10+ | Count of authored maps |
| Quests | 6 | 20+ | Count of quest definitions |
| NPCs | 6 | 15+ | Count of NPC entities with dialog |
| Enemy types | 3 | 10+ | Count of distinct enemy definitions |
| Average play session | Unknown | 30+ min | Player feedback |

### 7.2 Definition of Done
The v1.0.0 product is considered complete when:
- [ ] Full main story arc with multiple endings
- [ ] 10+ explorable maps
- [ ] 20+ quests (main + side)
- [ ] Balanced progression from level 1 to 20
- [ ] All core systems polished and bug-free
- [ ] Documentation complete

---

## 8. Glossary

| Term | Definition |
|------|------------|
| W.A.S.T.E.D. | Wits, Agility, Strength, Toughness, Eyes, Daring - the 6 primary attributes |
| AP | Action Points - spent during combat for attacks, item use, and movement |
| HP | Hit Points - character health; zero means death |
| Caps | Bottle caps - the post-apocalyptic currency |
| FOV | Field of View - visible tiles computed via raycasting |
| Tile | A single cell in the map grid, rendered as a colored character |
| EventBus | Central publish/subscribe system for decoupled communication between game systems |
| Base64 map | Maps authored as ASCII text art, converted to base64-encoded byte arrays of tile IDs |
| Dialog tree | Branching conversation structure with nodes (NPC text) and responses (player choices) |
| Skill check | A dialog option gated by a minimum attribute or skill value |
| Story flag | A boolean key-value pair tracking world state changes (e.g., quest progress, NPC reactions) |

---

## Appendix

### A. References
- Fallout 1 & 2 (Interplay/Black Isle) - Primary gameplay inspiration
- Zork / Infocom text adventures - Humor and writing style inspiration
- Traditional roguelikes (ASCII rendering, tile-based maps, turn-based combat)

### B. Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | 2026-02-09 | Jerry | Initial version - "Unfrozen" first playable release |
