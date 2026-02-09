/**
 * JUST IN TIME - Utility Functions
 * Base64 encoding/decoding for maps, A* pathfinding, seeded random, etc.
 */

import { CHAR_TO_TILE, TILE_PROPS, DIRECTIONS } from './constants.js';

// ============================================================
// BASE64 TILE MAP ENCODING/DECODING
// ============================================================

/**
 * Encode a text-based map string into base64.
 * Each character is converted to a tile ID (uint8), then the byte array is base64 encoded.
 */
export function encodeMap(textMap) {
  const lines = textMap.split('\n').filter(l => l.length > 0);
  const height = lines.length;
  const width = Math.max(...lines.map(l => l.length));
  const bytes = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = y < lines.length && x < lines[y].length ? lines[y][x] : ' ';
      bytes[y * width + x] = CHAR_TO_TILE[ch] !== undefined ? CHAR_TO_TILE[ch] : 0;
    }
  }

  return { data: uint8ToBase64(bytes), width, height };
}

/**
 * Decode a base64 encoded map back to a 2D tile ID array.
 */
export function decodeMap(base64, width, height) {
  const bytes = base64ToUint8(base64);
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(bytes[y * width + x] || 0);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Convert Uint8Array to base64 string.
 */
export function uint8ToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array.
 */
export function base64ToUint8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ============================================================
// A* PATHFINDING
// ============================================================

/**
 * Find a path from start to end on a tile grid.
 * Returns array of {x, y} positions, or empty array if no path.
 */
export function findPath(grid, start, end, maxSteps = 200) {
  const width = grid[0].length;
  const height = grid.length;

  if (!isWalkable(grid, end.x, end.y)) return [];
  if (start.x === end.x && start.y === end.y) return [];

  const key = (x, y) => `${x},${y}`;
  const open = new MinHeap();
  const closed = new Set();
  const gScore = new Map();
  const parent = new Map();

  const h = (x, y) => Math.abs(x - end.x) + Math.abs(y - end.y);

  gScore.set(key(start.x, start.y), 0);
  open.push({ x: start.x, y: start.y, f: h(start.x, start.y) });

  let steps = 0;
  while (open.size() > 0 && steps < maxSteps) {
    steps++;
    const current = open.pop();
    const ck = key(current.x, current.y);

    if (current.x === end.x && current.y === end.y) {
      // Reconstruct path
      const path = [];
      let k = ck;
      while (parent.has(k)) {
        const [px, py] = k.split(',').map(Number);
        path.unshift({ x: px, y: py });
        k = parent.get(k);
      }
      return path;
    }

    closed.add(ck);

    for (const dir of Object.values(DIRECTIONS)) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const nk = key(nx, ny);

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (closed.has(nk)) continue;
      if (!isWalkable(grid, nx, ny)) continue;

      // Diagonal movement costs more
      const isDiag = dir.x !== 0 && dir.y !== 0;
      // Don't allow diagonal movement through walls
      if (isDiag) {
        if (!isWalkable(grid, current.x + dir.x, current.y) ||
            !isWalkable(grid, current.x, current.y + dir.y)) continue;
      }

      const tentG = gScore.get(ck) + (isDiag ? 1.414 : 1);

      if (!gScore.has(nk) || tentG < gScore.get(nk)) {
        gScore.set(nk, tentG);
        parent.set(nk, ck);
        open.push({ x: nx, y: ny, f: tentG + h(nx, ny) });
      }
    }
  }

  return []; // No path found
}

function isWalkable(grid, x, y) {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return false;
  const tileId = grid[y][x];
  const props = TILE_PROPS[tileId];
  return props ? props.walkable : false;
}

/** Min-heap for A* open set */
class MinHeap {
  constructor() { this.data = []; }
  size() { return this.data.length; }
  push(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }
  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  _bubbleUp(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[i].f >= this.data[p].f) break;
      [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
      i = p;
    }
  }
  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l].f < this.data[min].f) min = l;
      if (r < n && this.data[r].f < this.data[min].f) min = r;
      if (min === i) break;
      [this.data[i], this.data[min]] = [this.data[min], this.data[i]];
      i = min;
    }
  }
}

// ============================================================
// FIELD OF VIEW (Simple raycasting)
// ============================================================

/**
 * Compute visible tiles from origin within radius.
 * Returns Set of "x,y" strings for visible positions.
 */
export function computeFOV(grid, originX, originY, radius) {
  const visible = new Set();
  visible.add(`${originX},${originY}`);

  const steps = 72; // Number of rays
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    for (let dist = 1; dist <= radius; dist++) {
      const x = Math.round(originX + dx * dist);
      const y = Math.round(originY + dy * dist);

      if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) break;

      visible.add(`${x},${y}`);

      const tileId = grid[y][x];
      const props = TILE_PROPS[tileId];
      if (!props || !props.transparent) break;
    }
  }

  return visible;
}

// ============================================================
// SEEDED RANDOM
// ============================================================

export class SeededRandom {
  constructor(seed = Date.now()) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick(array) {
    return array[this.int(0, array.length - 1)];
  }

  chance(percent) {
    return this.next() * 100 < percent;
  }
}

// Global random with random seed
export const rng = new SeededRandom();

// ============================================================
// DISTANCE / GEOMETRY
// ============================================================

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function manhattanDist(x1, y1, x2, y2) {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ============================================================
// STRING HELPERS
// ============================================================

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function padRight(str, len) {
  return str.padEnd(len, ' ');
}
