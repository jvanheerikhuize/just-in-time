# Contributing to Just In Time

## Quick Start

1. Clone the repo
2. Run `npm run dev` (serves on port 8080)
3. Open `http://localhost:8080` in a browser

No build step, no dependencies to install.

## Adding Content

Most contributions are content additions. No code changes required:

### Maps
Add to `src/js/data/maps.js`:
1. Write the map as ASCII text art (see existing maps for character reference)
2. Call `encodeMap()` on the text
3. Define spawns, exits, and entity placements

### NPCs & Enemies
Add to `src/js/data/entities.js` with sprite character, stats, and optional `dialogId`.

### Items
Add to `src/js/data/items.js` with type, stats, weight, value, and a witty description.

### Quests
Add to `src/js/data/quests.js` with stages, objectives (go/talk/kill/fetch), and rewards.

### Dialogs
Add to `src/js/data/dialogs.js` with branching nodes, skill checks, and effects.

## Feature Development

For new systems or mechanics:

1. Create a spec in `specs/features/FEAT-XXXX-name.yaml` (copy from `_template.yaml`)
2. Get spec approved
3. Implement following patterns in `.ai/architecture/PATTERNS.md`
4. Submit PR

## Code Rules

- Vanilla JavaScript only (no frameworks, no TypeScript, no build tools)
- ES modules with native browser imports
- Systems communicate via EventBus, not direct calls
- Only UIManager touches the DOM
- Use constants from `core/constants.js`, never magic numbers
- Write Infocom-style humor for all game text

## Commit Messages

```
feat(FEAT-XXXX): Brief description
fix: Brief description of bug fix
content: Add new quest/map/NPC description
```
