/**
 * JUST IN TIME - Sprite Configuration
 * Data-driven definitions for entity sprites and animations.
 * Pure data file — no logic, no imports beyond constants.
 *
 * Each sprite type defines:
 *   - width/height: cell size for the spritesheet
 *   - offsetY: vertical offset above tile center for drawing
 *   - animations: named animation states, each with frame keys and timing
 *
 * Frame keys reference procedural frame generators or external spritesheet cells.
 * Durations are in milliseconds.
 */

// ---- Sprite type definitions ----

export const SPRITE_DEFS = {
  player: {
    width: 32,
    height: 44,
    offsetY: 20,
    animations: {
      idle_south:  { frames: [{ key: 'idle_s_0' }], loop: false },
      idle_north:  { frames: [{ key: 'idle_n_0' }], loop: false },
      idle_east:   { frames: [{ key: 'idle_e_0' }], loop: false },
      idle_west:   { frames: [{ key: 'idle_w_0' }], loop: false },
      walk_south:  { frames: [
        { key: 'walk_s_0', dur: 150 },
        { key: 'walk_s_1', dur: 150 },
      ], loop: true },
      walk_north:  { frames: [
        { key: 'walk_n_0', dur: 150 },
        { key: 'walk_n_1', dur: 150 },
      ], loop: true },
      walk_east:   { frames: [
        { key: 'walk_e_0', dur: 150 },
        { key: 'walk_e_1', dur: 150 },
      ], loop: true },
      walk_west:   { frames: [
        { key: 'walk_w_0', dur: 150 },
        { key: 'walk_w_1', dur: 150 },
      ], loop: true },
      attack: { frames: [
        { key: 'atk_0', dur: 150 },
        { key: 'atk_1', dur: 250 },
      ], loop: false },
      hurt: { frames: [
        { key: 'hurt_0', dur: 400 },
      ], loop: false },
    },
  },

  humanoid: {
    width: 32,
    height: 40,
    offsetY: 16,
    animations: {
      idle_south:  { frames: [{ key: 'idle_s_0' }], loop: false },
      idle_north:  { frames: [{ key: 'idle_n_0' }], loop: false },
      idle_east:   { frames: [{ key: 'idle_e_0' }], loop: false },
      idle_west:   { frames: [{ key: 'idle_w_0' }], loop: false },
      walk_south:  { frames: [
        { key: 'walk_s_0', dur: 150 },
        { key: 'walk_s_1', dur: 150 },
      ], loop: true },
      walk_north:  { frames: [
        { key: 'walk_n_0', dur: 150 },
        { key: 'walk_n_1', dur: 150 },
      ], loop: true },
      walk_east:   { frames: [
        { key: 'walk_e_0', dur: 150 },
        { key: 'walk_e_1', dur: 150 },
      ], loop: true },
      walk_west:   { frames: [
        { key: 'walk_w_0', dur: 150 },
        { key: 'walk_w_1', dur: 150 },
      ], loop: true },
      attack: { frames: [
        { key: 'atk_0', dur: 150 },
        { key: 'atk_1', dur: 250 },
      ], loop: false },
      hurt: { frames: [
        { key: 'hurt_0', dur: 400 },
      ], loop: false },
    },
  },

  container: {
    width: 24,
    height: 20,
    offsetY: 4,
    animations: {
      idle_south: { frames: [{ key: 'closed' }], loop: false },
      open:       { frames: [
        { key: 'open_0', dur: 150 },
        { key: 'open_1', dur: 0 },
      ], loop: false },
    },
  },

  item_pickup: {
    width: 20,
    height: 18,
    offsetY: 6,
    animations: {
      idle_south: { frames: [
        { key: 'glow_0', dur: 400 },
        { key: 'glow_1', dur: 400 },
        { key: 'glow_2', dur: 400 },
      ], loop: true },
    },
  },
};

// ---- Direction mapping ----

/** Maps facing vector "x,y" to cardinal direction suffix for animation names. */
export const FACING_TO_DIR = {
  '0,-1':  'north',
  '0,1':   'south',
  '1,0':   'east',
  '-1,0':  'west',
  '1,-1':  'north', // NE → north
  '-1,-1': 'west',  // NW → west
  '1,1':   'east',  // SE → east
  '-1,1':  'south', // SW → south
};

// ---- Entity type → sprite type mapping ----

/** Override default entity-type-to-sprite-type mapping for specific entity IDs. */
export const SPRITE_TYPE_OVERRIDES = {
  // 'security_bot': 'robot',
  // 'rusty': 'robot',
};

/** Default mapping from entity type string to sprite type. */
export const ENTITY_TYPE_TO_SPRITE = {
  npc: 'humanoid',
  enemy: 'humanoid',
  container: 'container',
  item_pickup: 'item_pickup',
  terminal: 'container',
};
