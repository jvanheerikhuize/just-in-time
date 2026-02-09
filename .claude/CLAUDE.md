# Just In Time - AI Coding Instructions

## Quick Start

Read these files for context:
1. `.ai/CONTEXT.md` - Project overview and current state
2. `.ai/architecture/PATTERNS.md` - Code patterns to follow
3. `.ai/config.yaml` - AI behavior preferences

## Project

Post-apocalyptic browser RPG. Vanilla JavaScript, HTML5 Canvas, no frameworks, no build step. Fallout II gameplay with Infocom humor.

## Rules

### Must Follow
- **No frameworks** - Vanilla JS with ES modules only
- **No build step** - Code runs directly in the browser
- **No npm runtime deps** - Only `npx serve` for dev server
- **Data-driven content** - Maps, entities, items, quests, dialogs are JS data files
- **Event-driven** - Systems communicate via EventBus, not direct calls
- **UIManager owns DOM** - No other file touches DOM elements

### Code Conventions
- Follow patterns in `.ai/architecture/PATTERNS.md`
- Match existing style in the codebase
- Use constants from `core/constants.js`, never magic numbers
- Private methods use `_` prefix
- Infocom-style humor for all game text

### Content Workflow
- Features require approved specs in `specs/features/`
- Specs use Gherkin-style acceptance criteria
- Check `specs.config.yaml` for pending work
- Only implement specs with status `approved`

## Key Files

| Purpose | Location |
|---------|----------|
| Entry point | `src/js/main.js` |
| Game engine | `src/js/engine/Game.js` |
| All constants | `src/js/core/constants.js` |
| EventBus | `src/js/core/EventBus.js` |
| UI controller | `src/js/ui/UIManager.js` |
| Game content | `src/js/data/*.js` |
| Feature specs | `specs/features/*.yaml` |

## Adding Content

- **Maps**: Add to `data/maps.js` as ASCII text + `encodeMap()`
- **NPCs**: Add to `data/entities.js` with `dialogId` pointing to `data/dialogs.js`
- **Quests**: Add to `data/quests.js` with stages and objectives
- **Items**: Add to `data/items.js`
- **Dialogs**: Add to `data/dialogs.js` with branching nodes

## Forbidden Actions
- Do not introduce build steps, transpilers, or bundlers
- Do not add npm runtime dependencies
- Do not break the ES module import/export structure
- Do not change tile IDs or map encoding without updating all references
- Do not modify save game format without migration support
