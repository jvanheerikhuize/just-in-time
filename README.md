# Just In Time

A post-apocalyptic browser RPG in the style of Fallout II with Infocom-style dark humor.

Built with vanilla JavaScript, HTML5 Canvas, and zero dependencies.

## Play

```bash
npm run dev
# Open http://localhost:8080
```

Requires Node.js 18+ (only for the static file server). Any static file server works:
```bash
python3 -m http.server 8080 --directory src
```

## Features (v0.1.0 "Unfrozen")

- **W.A.S.T.E.D. attributes** - Wits, Agility, Strength, Toughness, Eyes, Daring
- **Tile-based exploration** - Click-to-move with A* pathfinding, field-of-view, fog of war
- **Turn-based combat** - Action points, hit chance from skills, critical hits, loot drops
- **Branching dialogs** - Skill checks, conditions, quest triggers, multiple outcomes
- **Quest system** - Multi-stage quests with typed objectives (go, talk, kill, fetch)
- **Inventory & equipment** - Weapons, armor, consumables, weight limits
- **Save/Load** - LocalStorage persistence with auto-save on map transitions

## Content

| | Count | Details |
|---|---|---|
| Maps | 3 | Vault 42, Dustbowl settlement, The Wastes |
| Quests | 6 | Tutorial chain + main quest + side quests |
| NPCs | 6 | CHRONOS, Scarlett, Mayor Bottlecap, Doc Feelgood, Rusty, Patches |
| Enemy types | 3 | Radroach variants, Security Bot |

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| Click | Move to tile / interact |
| I | Inventory |
| C | Character sheet |
| Q | Quest log |
| M | Map (save/load) |
| E / Space | Interact |
| Escape | Close panel / cancel |

## Project Structure

```
src/
├── index.html           # HTML shell
├── css/game.css         # Retro terminal stylesheet
└── js/
    ├── main.js          # Entry point
    ├── core/            # Constants, EventBus, utilities
    ├── engine/          # Game loop, renderer, camera, input
    ├── systems/         # Map, character, combat, dialog, quest, inventory, save
    ├── ui/              # UIManager (all DOM interaction)
    └── data/            # Maps, entities, items, quests, dialogs
```

## Adding Content

New content is added via data files -- no code changes needed:

- **Maps**: `src/js/data/maps.js` (ASCII text art + `encodeMap()`)
- **NPCs/Enemies**: `src/js/data/entities.js`
- **Items**: `src/js/data/items.js`
- **Quests**: `src/js/data/quests.js`
- **Dialogs**: `src/js/data/dialogs.js`

For larger features, create a spec in `specs/features/` following the template.

## Architecture

See `.ai/architecture/ARCHITECTURE.md` for full system design.

The game uses an event-driven architecture with 7 systems coordinated by a central Game class. All inter-system communication flows through a singleton EventBus. Content is fully data-driven.

## License

MIT
