/**
 * JUST IN TIME - Map Data
 * All maps defined as text, encoded to base64 tile grids.
 * Character mapping is defined in constants.js CHAR_TO_TILE.
 *
 * Legend:
 *   ' ' = void       '.' = stone floor  ',' = metal floor   ':' = dirt
 *   ';' = grass       '~' = sand         '_' = wood floor    '#' = stone wall
 *   'H' = metal wall  'B' = brick wall   'W' = wood wall     '+' = closed door
 *   '-' = open door   'L' = locked door  'w' = water         'T' = toxic waste
 *   'r' = rubble      'd' = debris       '=' = road          '%' = cracked road
 *   't' = table       'c' = chair        'b' = bed           's' = shelf
 *   'n' = counter     'P' = computer     'C' = cryo pod      'G' = generator
 *   '<' = stairs up   '>' = stairs down  '^' = exit north    'v' = exit south
 *   '}' = exit east   '{' = exit west    'o' = barrel        'x' = crate
 *   'K' = locker      'f' = fence        'g' = fence gate    'S' = sign
 */

import { encodeMap } from '../core/utils.js';

// ============================================================
// VAULT 42 - Starting Location
// The player's cryogenic vault. Partially flooded, mostly broken.
// ============================================================
const VAULT_42_GROUND = `
HHHHHHHHHHHHHHHHHHHHHHHHHHHHHH
H,,,,,,,,,,H,,,,,,,,,,,,,,,,H
H,,,,,,,,,,H,,,,,,,,,,,,,,,,H
H,,C,,C,,C,H,,,,,,,,,,,,,,,,H
H,,,,,,,,,,H,,,,t,c,,,,,,c,,H
H,,C,,C,,C,+,,,,,,,,,,,,,,,,H
H,,,,,,,,,,H,,,,,,c,,t,,,,,,H
H,,,,,,,,,,H,,,,,,,,,,,,,,,,H
HHHHHH+HHHHHHHHHHH+HHHHHHHHHH
H,,,,,,,,,,H,,,,,,,,H,,,,,,,H
H,,b,,,,,,,H,,,,,,,,H,,s,s,,H
H,,,,,,,,,,H,,P,,P,,H,,,,,,,H
H,,b,,,,,,,H,,,,,,,,H,,K,K,,H
H,,,,,,,,,,+,,,,,,,,+,,,,,,,H
H,,b,,,,,,,H,,,,,,,,H,,x,x,,H
H,,,,,,,,,,H,,G,,,,,H,,,,,,,H
HHHHHHHHHHHHHHHH+HHHHHHHHHHHHH
H,,,,,,,,,,,,,,,,,,,,,,,,,,,H
H,,,,,,,,,,,,,,,,,,,,,,,,,,,H
H,,,,,,,,,,,,,,,,,,,,,,,,,,,H
H,,,,,,,,,,,,,,,,,,,,,,,,,,,H
HHHHHHHHHHHHHH+HHHHHHHHHHHHHH
              :::::::
              :::::::
              ::v::::
              :::::::
`;

const VAULT_42_OBJECTS = `


























`;

const vault42Ground = encodeMap(VAULT_42_GROUND);
const vault42Objects = encodeMap(VAULT_42_OBJECTS);

// ============================================================
// DUSTBOWL - First Settlement
// A ramshackle town in a ruined strip mall.
// ============================================================
const DUSTBOWL_GROUND = `
::::::::::::::::::::::::::::::::::::::::::::::
:::::::::::::::::::::::::::::::::::::::;:;::::
::BBBBBBBBBBBBB::BBBBBBBBBBB::BBBBBBB::;::::
::B___________B::B_________B::B_____B::;::::
::B___________B::B_________B::B_____B:::::::
::B___t___n___B::B__t___t__B::B__b__B:::::::
::B___c___n___B::B__c___c__B::B_____B:::::::
::B___________B::B_________B::B__b__B:::::::
::B___c___c___B::B___n_n___B::B_____B:::::::
::B___________B::B_________B::BBBBB+B:::::::
::BBBBB+BBBBBB::BBBBB+BBBBB::::::::::::::::
::::::::::::::::::::::::::::::::::::::::::::::
::::::::::S:::::::::::::::::::::::::::::::::S:
:::::::::::::::::::::::::::::::::::::::::::::::
==============================================================
:::::::::::::::::::::::::::::::::::::::::::::::
::::::::::S:::::::::::::::::S:::::::::::::::::
::::::::::::::::::::::::::::::::::::::::::::::
::BBBBBBBBBBBB::BBBBBBBBBBBBB:::::::::::::::
::B__________B::B___________B::fffffffg:::::::
::B__P____P__B::B___t__c____B::f:::::::f::::::
::B__________B::B___________B::f:::::::f::::::
::B__t____s__B::B___s__s____B::f:::::::f::::::
::B__________B::B___________B::f:::::::f::::::
::BBBBBB+BBBB::BBBBBB+BBBBB::fffffffgf::::::
:::::::::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::::::::
::::::::::::::::::::::::::::^:::::::::::::::::
`;

const dustbowlGround = encodeMap(DUSTBOWL_GROUND);

// ============================================================
// THE WASTES - Wilderness between locations
// ============================================================
const WASTES_GROUND = `
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~::::::::::::::::::::::::::::::::::~~~::
~~:::::::::::;;;;;:::::::::::::::::::~~:::
~::::::::;;;;;;;;;;;;;;::::::::::::::~::::
::::::;;;;;;;;;;;;;;;;;;;::::::::::::::::~
:::;;;;;;;;;;;;;;;::::::::::::::::::::::~~
:::;;;::::::;;::::::::::::::r:r:::::::::~~
:::::::::::::::::::::::::r:::::r:::::::~~~
::::::::::::::::::::wwwwww:::::::::::::~~~
::::::::::r::::::::wwwwwwww::::::::::::~~:
::::::::::::::::::wwwwwwwww:::::::::::::~:
:::::::::::::::::wwwwwwwww:::::::::::::::~
::::::::::::::::::::wwwww:::::::::::::::::
::::::::::::::::::::::::::::::::::::::::~:
==============================================
::::::::::::::::::::::::::::::::::::::::~:
::::::::::::::::::::::::r:::::::::::::::~:
:::::r::::::::::::::::::::::::::::::::::::
:::::::::::::::::::;;;;;::::::::::::::::::
::::::::::::::::::;;;;;;;:::::::::::::::::
:::::::::::::::::;;;;;;;;;::::::::::::::::
:::::r::::::::::::;;;;;;;:::::::::::::::::
:::::::::::::::::::;;;;;::::::::::::::::::
::::::::::::::::::::::::::::::::::::::::::
:::::::::::::v:::::::::::::::::::::^::::::
::::::::::::::::::::::::::::::::::::::::::
`;

const wastesGround = encodeMap(WASTES_GROUND);

// ============================================================
// MAP REGISTRY
// ============================================================

export const ALL_MAPS = {
  vault42: {
    id: 'vault42',
    name: 'Vault 42 - Cryogenic Wing',
    width: vault42Ground.width,
    height: vault42Ground.height,
    layers: {
      ground: vault42Ground.data,
      objects: vault42Objects.data,
    },
    spawns: {
      start: { x: 4, y: 3 },   // Starting cryo pod
      entrance: { x: 14, y: 23 }, // From outside (one tile north of exit)
    },
    exits: [
      { x: 14, y: 24, targetMap: 'wastes', targetSpawn: 'from_vault' },
    ],
    entities: [
      { id: 'chronos_terminal', x: 11, y: 11 },
      { id: 'vault_locker_1', x: 23, y: 12 },
      { id: 'vault_locker_2', x: 25, y: 12 },
      { id: 'vault_crate', x: 23, y: 14 },
      { id: 'security_bot', x: 14, y: 19 },
    ],
    ambient: 'The vault hums with the tired persistence of two-century-old machinery. Everything smells faintly of recycled air and broken dreams.',
  },

  dustbowl: {
    id: 'dustbowl',
    name: 'Dustbowl Settlement',
    width: dustbowlGround.width,
    height: dustbowlGround.height,
    layers: {
      ground: dustbowlGround.data,
    },
    spawns: {
      start: { x: 28, y: 26 },    // South entrance (one tile north of exit)
      from_wastes: { x: 28, y: 26 },
    },
    exits: [
      { x: 28, y: 27, targetMap: 'wastes', targetSpawn: 'from_dustbowl' },
    ],
    entities: [
      // The Glowing Pint (top-left building)
      { id: 'scarlett', x: 8, y: 5 },
      // General Store (top-middle building)
      { id: 'rusty', x: 19, y: 7 },
      // Sleeping quarters (top-right building)
      // Mayor's Office (bottom-left building)
      { id: 'mayor_bottlecap', x: 6, y: 22 },
      // Doc's Office (bottom-middle building)
      { id: 'doc_feelgood', x: 19, y: 22 },
      // Corral (bottom-right)
      { id: 'wasteland_trader', x: 33, y: 22 },
      // Signs
      { id: 'sign_bar', x: 10, y: 12 },
      { id: 'sign_store', x: 16, y: 16 },
      { id: 'sign_entrance', x: 41, y: 12 },
    ],
    ambient: 'Dustbowl: population "enough." Built from the bones of a pre-war strip mall, it\'s the kind of place where everyone knows your name and most of your secrets.',
  },

  wastes: {
    id: 'wastes',
    name: 'The Wastes',
    width: wastesGround.width,
    height: wastesGround.height,
    layers: {
      ground: wastesGround.data,
    },
    spawns: {
      start: { x: 13, y: 23 },
      from_vault: { x: 13, y: 23 },
      from_dustbowl: { x: 33, y: 23 },
    },
    exits: [
      { x: 13, y: 24, targetMap: 'vault42', targetSpawn: 'entrance' },
      { x: 33, y: 24, targetMap: 'dustbowl', targetSpawn: 'from_wastes' },
    ],
    entities: [
      { id: 'radroach_1', x: 10, y: 6 },
      { id: 'radroach_2', x: 12, y: 7 },
      { id: 'radroach_3', x: 25, y: 16 },
      { id: 'wasteland_corpse', x: 20, y: 5 },
      { id: 'road_sign', x: 22, y: 14 },
    ],
    ambient: 'The wasteland stretches in every direction, a monument to humanity\'s talent for self-destruction. At least the sunsets are nice.',
  },
};
