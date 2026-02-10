/**
 * JUST IN TIME - Game Constants
 * All enumerations, configuration values, and tile definitions.
 */

// ---- Display ----
export const TILE_SIZE = 24;
export const VIEWPORT_COLS = 40;
export const VIEWPORT_ROWS = 24;
export const ISO_TILE_W = 64;
export const ISO_TILE_H = 32;
export const ISO_TILE_DEPTH = 24;
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;

// ---- Game States ----
export const GameState = {
  MENU: 'menu',
  CHAR_CREATE: 'char_create',
  PLAYING: 'playing',
  DIALOG: 'dialog',
  COMBAT: 'combat',
  INVENTORY: 'inventory',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
};

// ---- W.A.S.T.E.D. Attributes ----
export const Attributes = {
  WITS: 'wits',
  AGILITY: 'agility',
  STRENGTH: 'strength',
  TOUGHNESS: 'toughness',
  EYES: 'eyes',
  DARING: 'daring',
};

export const ATTRIBUTE_INFO = {
  wits:      { name: 'Wits',      abbr: 'W', desc: 'Intelligence, hacking, skill points' },
  agility:   { name: 'Agility',   abbr: 'A', desc: 'Speed, AP, dodge, stealth' },
  strength:  { name: 'Strength',  abbr: 'S', desc: 'Melee damage, carry weight' },
  toughness: { name: 'Toughness', abbr: 'T', desc: 'Max HP, resistance' },
  eyes:      { name: 'Eyes',      abbr: 'E', desc: 'Accuracy, detection, traps' },
  daring:    { name: 'Daring',    abbr: 'D', desc: 'Crits, luck, bold choices' },
};

export const ATTR_MIN = 1;
export const ATTR_MAX = 10;
export const ATTR_DEFAULT = 5;
export const ATTR_BONUS_POINTS = 5;

// ---- Skills ----
export const SKILL_FORMULAS = {
  firearms:  { attrs: ['eyes', 'agility'],    name: 'Firearms' },
  melee:     { attrs: ['strength', 'agility'], name: 'Melee' },
  lockpick:  { attrs: ['eyes', 'agility'],    name: 'Lockpick' },
  hacking:   { attrs: ['wits', 'eyes'],       name: 'Hacking' },
  medicine:  { attrs: ['wits', 'eyes'],       name: 'Medicine' },
  barter:    { attrs: ['wits', 'daring'],     name: 'Barter' },
  speech:    { attrs: ['wits', 'daring'],     name: 'Speech' },
  sneak:     { attrs: ['agility', 'eyes'],    name: 'Sneak' },
  repair:    { attrs: ['wits', 'strength'],   name: 'Repair' },
  survival:  { attrs: ['toughness', 'eyes'],  name: 'Survival' },
};

// ---- Character ----
export const BASE_HP = 20;
export const HP_PER_TOUGHNESS = 10;
export const BASE_AP = 6;
export const AP_PER_AGILITY = 0.5;
export const BASE_CARRY = 50;
export const CARRY_PER_STRENGTH = 10;
export const XP_PER_LEVEL = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000];
export const MAX_LEVEL = 20;
export const SKILL_POINTS_PER_LEVEL_BASE = 5;

// ---- Combat ----
export const AP_COST_MOVE = 1;
export const AP_COST_MELEE = 3;
export const AP_COST_SHOOT = 4;
export const AP_COST_RELOAD = 2;
export const AP_COST_USE_ITEM = 2;
export const COVER_DEFENSE_BONUS = 25;
export const FLANKING_ATTACK_BONUS = 15;
export const CRIT_MULTIPLIER_BASE = 1.5;

// ---- Entity Types ----
export const EntityType = {
  PLAYER: 'player',
  NPC: 'npc',
  ENEMY: 'enemy',
  CONTAINER: 'container',
  DOOR: 'door',
  TERMINAL: 'terminal',
  ITEM_PICKUP: 'item_pickup',
};

// ---- Item Types ----
export const ItemType = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  CONSUMABLE: 'consumable',
  AMMO: 'ammo',
  MISC: 'misc',
  QUEST: 'quest',
};

// ---- Weapon Subtypes ----
export const WeaponType = {
  MELEE: 'melee',
  PISTOL: 'pistol',
  RIFLE: 'rifle',
  SHOTGUN: 'shotgun',
  ENERGY: 'energy',
};

// ---- Tile IDs ----
export const Tiles = {
  VOID: 0,
  FLOOR_STONE: 1,
  FLOOR_METAL: 2,
  FLOOR_DIRT: 3,
  FLOOR_GRASS: 4,
  FLOOR_SAND: 5,
  FLOOR_WOOD: 6,
  WALL_STONE: 10,
  WALL_METAL: 11,
  WALL_BRICK: 12,
  WALL_WOOD: 13,
  DOOR_CLOSED: 20,
  DOOR_OPEN: 21,
  DOOR_LOCKED: 22,
  WATER: 30,
  WATER_DEEP: 31,
  WATER_TOXIC: 32,
  RUBBLE: 40,
  DEBRIS: 41,
  ROAD: 50,
  ROAD_CRACKED: 51,
  TABLE: 60,
  CHAIR: 61,
  BED: 62,
  SHELF: 63,
  COUNTER: 64,
  COMPUTER: 65,
  CRYOPOD: 66,
  GENERATOR: 67,
  STAIRS_DOWN: 70,
  STAIRS_UP: 71,
  EXIT_NORTH: 72,
  EXIT_SOUTH: 73,
  EXIT_EAST: 74,
  EXIT_WEST: 75,
  BARREL: 80,
  CRATE: 81,
  LOCKER: 82,
  FENCE: 90,
  FENCE_GATE: 91,
  SIGN: 92,
};

// ---- Tile Character Map (for text-based map authoring) ----
export const CHAR_TO_TILE = {
  ' ': Tiles.VOID,
  '.': Tiles.FLOOR_STONE,
  ',': Tiles.FLOOR_METAL,
  ':': Tiles.FLOOR_DIRT,
  ';': Tiles.FLOOR_GRASS,
  '~': Tiles.FLOOR_SAND,
  '_': Tiles.FLOOR_WOOD,
  '#': Tiles.WALL_STONE,
  'H': Tiles.WALL_METAL,
  'B': Tiles.WALL_BRICK,
  'W': Tiles.WALL_WOOD,
  '+': Tiles.DOOR_CLOSED,
  '-': Tiles.DOOR_OPEN,
  'L': Tiles.DOOR_LOCKED,
  'w': Tiles.WATER,
  'D': Tiles.WATER_DEEP,
  'T': Tiles.WATER_TOXIC,
  'r': Tiles.RUBBLE,
  'd': Tiles.DEBRIS,
  '=': Tiles.ROAD,
  '%': Tiles.ROAD_CRACKED,
  't': Tiles.TABLE,
  'c': Tiles.CHAIR,
  'b': Tiles.BED,
  's': Tiles.SHELF,
  'n': Tiles.COUNTER,
  'P': Tiles.COMPUTER,
  'C': Tiles.CRYOPOD,
  'G': Tiles.GENERATOR,
  '<': Tiles.STAIRS_UP,
  '>': Tiles.STAIRS_DOWN,
  '^': Tiles.EXIT_NORTH,
  'v': Tiles.EXIT_SOUTH,
  '}': Tiles.EXIT_EAST,
  '{': Tiles.EXIT_WEST,
  'o': Tiles.BARREL,
  'x': Tiles.CRATE,
  'K': Tiles.LOCKER,
  'f': Tiles.FENCE,
  'g': Tiles.FENCE_GATE,
  'S': Tiles.SIGN,
};

// ---- Tile Rendering Properties ----
export const TILE_PROPS = {
  [Tiles.VOID]:         { char: ' ', fg: '#000', bg: '#000', walkable: false, transparent: false, name: 'Nothing' },
  [Tiles.FLOOR_STONE]:  { char: '.', fg: '#556', bg: '#223', walkable: true,  transparent: true,  name: 'Stone Floor' },
  [Tiles.FLOOR_METAL]:  { char: '.', fg: '#668', bg: '#334', walkable: true,  transparent: true,  name: 'Metal Floor' },
  [Tiles.FLOOR_DIRT]:   { char: '.', fg: '#864', bg: '#321', walkable: true,  transparent: true,  name: 'Dirt' },
  [Tiles.FLOOR_GRASS]:  { char: '"', fg: '#4a4', bg: '#232', walkable: true,  transparent: true,  name: 'Grass' },
  [Tiles.FLOOR_SAND]:   { char: '.', fg: '#cb8', bg: '#543', walkable: true,  transparent: true,  name: 'Sand' },
  [Tiles.FLOOR_WOOD]:   { char: '=', fg: '#a86', bg: '#432', walkable: true,  transparent: true,  name: 'Wooden Floor' },
  [Tiles.WALL_STONE]:   { char: '#', fg: '#889', bg: '#445', walkable: false, transparent: false, name: 'Stone Wall' },
  [Tiles.WALL_METAL]:   { char: '#', fg: '#99a', bg: '#556', walkable: false, transparent: false, name: 'Metal Wall' },
  [Tiles.WALL_BRICK]:   { char: '#', fg: '#a65', bg: '#533', walkable: false, transparent: false, name: 'Brick Wall' },
  [Tiles.WALL_WOOD]:    { char: '#', fg: '#a86', bg: '#543', walkable: false, transparent: false, name: 'Wood Wall' },
  [Tiles.DOOR_CLOSED]:  { char: '+', fg: '#aa6', bg: '#443', walkable: false, transparent: false, name: 'Closed Door', interactable: true },
  [Tiles.DOOR_OPEN]:    { char: '-', fg: '#aa6', bg: '#332', walkable: true,  transparent: true,  name: 'Open Door', interactable: true },
  [Tiles.DOOR_LOCKED]:  { char: '+', fg: '#a44', bg: '#433', walkable: false, transparent: false, name: 'Locked Door', interactable: true },
  [Tiles.WATER]:        { char: '~', fg: '#48f', bg: '#124', walkable: false, transparent: true,  name: 'Water' },
  [Tiles.WATER_DEEP]:   { char: '~', fg: '#26a', bg: '#013', walkable: false, transparent: true,  name: 'Deep Water' },
  [Tiles.WATER_TOXIC]:  { char: '~', fg: '#4f4', bg: '#131', walkable: false, transparent: true,  name: 'Toxic Waste' },
  [Tiles.RUBBLE]:       { char: '%', fg: '#776', bg: '#332', walkable: true,  transparent: true,  name: 'Rubble' },
  [Tiles.DEBRIS]:       { char: '*', fg: '#665', bg: '#222', walkable: true,  transparent: true,  name: 'Debris' },
  [Tiles.ROAD]:         { char: '.', fg: '#888', bg: '#444', walkable: true,  transparent: true,  name: 'Road' },
  [Tiles.ROAD_CRACKED]: { char: '%', fg: '#777', bg: '#433', walkable: true,  transparent: true,  name: 'Cracked Road' },
  [Tiles.TABLE]:        { char: 'T', fg: '#a86', bg: '#432', walkable: false, transparent: true,  name: 'Table' },
  [Tiles.CHAIR]:        { char: 'h', fg: '#a86', bg: '#322', walkable: true,  transparent: true,  name: 'Chair' },
  [Tiles.BED]:          { char: '=', fg: '#668', bg: '#334', walkable: false, transparent: true,  name: 'Bed' },
  [Tiles.SHELF]:        { char: '[', fg: '#a86', bg: '#432', walkable: false, transparent: true,  name: 'Shelf' },
  [Tiles.COUNTER]:      { char: '=', fg: '#a86', bg: '#543', walkable: false, transparent: true,  name: 'Counter' },
  [Tiles.COMPUTER]:     { char: '@', fg: '#4f4', bg: '#232', walkable: false, transparent: true,  name: 'Computer Terminal', interactable: true },
  [Tiles.CRYOPOD]:      { char: 'O', fg: '#4af', bg: '#234', walkable: false, transparent: true,  name: 'Cryo Pod' },
  [Tiles.GENERATOR]:    { char: 'G', fg: '#fa4', bg: '#432', walkable: false, transparent: true,  name: 'Generator' },
  [Tiles.STAIRS_DOWN]:  { char: '>', fg: '#fff', bg: '#333', walkable: true,  transparent: true,  name: 'Stairs Down', interactable: true },
  [Tiles.STAIRS_UP]:    { char: '<', fg: '#fff', bg: '#333', walkable: true,  transparent: true,  name: 'Stairs Up', interactable: true },
  [Tiles.EXIT_NORTH]:   { char: '^', fg: '#ff4', bg: '#333', walkable: true,  transparent: true,  name: 'Exit North', interactable: true },
  [Tiles.EXIT_SOUTH]:   { char: 'v', fg: '#ff4', bg: '#333', walkable: true,  transparent: true,  name: 'Exit South', interactable: true },
  [Tiles.EXIT_EAST]:    { char: '>', fg: '#ff4', bg: '#333', walkable: true,  transparent: true,  name: 'Exit East', interactable: true },
  [Tiles.EXIT_WEST]:    { char: '<', fg: '#ff4', bg: '#333', walkable: true,  transparent: true,  name: 'Exit West', interactable: true },
  [Tiles.BARREL]:       { char: 'o', fg: '#886', bg: '#332', walkable: false, transparent: true,  name: 'Barrel', interactable: true },
  [Tiles.CRATE]:        { char: 'x', fg: '#a86', bg: '#432', walkable: false, transparent: true,  name: 'Crate', interactable: true },
  [Tiles.LOCKER]:       { char: 'K', fg: '#99a', bg: '#445', walkable: false, transparent: true,  name: 'Locker', interactable: true },
  [Tiles.FENCE]:        { char: '|', fg: '#886', bg: '#221', walkable: false, transparent: true,  name: 'Fence' },
  [Tiles.FENCE_GATE]:   { char: '.', fg: '#886', bg: '#331', walkable: true,  transparent: true,  name: 'Fence Gate', interactable: true },
  [Tiles.SIGN]:         { char: '!', fg: '#ff4', bg: '#332', walkable: false, transparent: true,  name: 'Sign', interactable: true },
};

// ---- Quest States ----
export const QuestState = {
  UNKNOWN: 'unknown',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// ---- Direction Vectors ----
export const DIRECTIONS = {
  N:  { x: 0,  y: -1 },
  S:  { x: 0,  y: 1 },
  E:  { x: 1,  y: 0 },
  W:  { x: -1, y: 0 },
  NE: { x: 1,  y: -1 },
  NW: { x: -1, y: -1 },
  SE: { x: 1,  y: 1 },
  SW: { x: -1, y: 1 },
};

// ---- Colors (reuse from CSS for canvas) ----
export const Colors = {
  BG: '#0a0a0f',
  GREEN: '#33ff33',
  GREEN_DIM: '#1a8a1a',
  AMBER: '#ffaa00',
  RED: '#ff3333',
  BLUE: '#4488ff',
  CYAN: '#00cccc',
  TEXT: '#ccddcc',
  TEXT_DIM: '#667766',
  WHITE: '#eeffee',
  BLACK: '#000000',
  PLAYER: '#33ff33',
  NPC_FRIENDLY: '#4488ff',
  NPC_HOSTILE: '#ff3333',
  NPC_NEUTRAL: '#ffaa00',
};

// ---- Message Types ----
export const MsgType = {
  SYSTEM: 'msg-system',
  ACTION: 'msg-action',
  COMBAT: 'msg-combat',
  DIALOG: 'msg-dialog',
  QUEST: 'msg-quest',
  LOOT: 'msg-loot',
  WARNING: 'msg-warning',
  HUMOR: 'msg-humor',
};
