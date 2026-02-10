/**
 * JUST IN TIME - Tile Sprites
 * Procedural isometric tile art generator with caching.
 * Each tile type gets a pre-rendered canvas sprite at init time.
 */

import { ISO_TILE_W, ISO_TILE_H, ISO_TILE_DEPTH, Tiles, TILE_PROPS } from '../core/constants.js';

const HW = ISO_TILE_W / 2;
const HH = ISO_TILE_H / 2;

const WALL_TILES = new Set([
  Tiles.WALL_STONE, Tiles.WALL_METAL, Tiles.WALL_BRICK, Tiles.WALL_WOOD,
  Tiles.DOOR_CLOSED, Tiles.DOOR_LOCKED,
]);

const OBJECT_TILES = new Set([
  Tiles.TABLE, Tiles.BED, Tiles.SHELF, Tiles.COUNTER,
  Tiles.COMPUTER, Tiles.CRYOPOD, Tiles.GENERATOR,
  Tiles.BARREL, Tiles.CRATE, Tiles.LOCKER,
  Tiles.FENCE, Tiles.SIGN,
]);

export class TileSprites {
  constructor() {
    this.cache = new Map();
    this._init();
  }

  _init() {
    for (const [id, props] of Object.entries(TILE_PROPS)) {
      const tileId = parseInt(id);
      if (tileId === Tiles.VOID) continue;

      if (WALL_TILES.has(tileId)) {
        this._makeWall(tileId, props);
      } else if (OBJECT_TILES.has(tileId)) {
        this._makeObject(tileId, props);
      } else {
        this._makeFloor(tileId, props);
      }
    }
  }

  get(tileId) {
    return this.cache.get(tileId);
  }

  // ---- Floor sprites (flat diamond, 64x32) ----

  _makeFloor(tileId, props) {
    const c = this._canvas(ISO_TILE_W, ISO_TILE_H);
    const ctx = c.getContext('2d');

    this._diamond(ctx, 0, 0, props.bg);
    this._diamondEdge(ctx, 0, 0, this._lighten(props.bg, 0.1));
    this._addFloorTexture(ctx, tileId, props);

    this.cache.set(tileId, { canvas: c, offsetY: 0 });
  }

  // ---- Wall sprites (extruded block, 64x56) ----

  _makeWall(tileId, props) {
    const h = ISO_TILE_H + ISO_TILE_DEPTH;
    const c = this._canvas(ISO_TILE_W, h);
    const ctx = c.getContext('2d');

    const top = props.fg;
    const left = this._darken(top, 0.3);
    const right = this._darken(top, 0.5);

    // Left face
    ctx.fillStyle = left;
    ctx.beginPath();
    ctx.moveTo(0, HH);
    ctx.lineTo(HW, ISO_TILE_H);
    ctx.lineTo(HW, ISO_TILE_H + ISO_TILE_DEPTH);
    ctx.lineTo(0, HH + ISO_TILE_DEPTH);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = right;
    ctx.beginPath();
    ctx.moveTo(ISO_TILE_W, HH);
    ctx.lineTo(HW, ISO_TILE_H);
    ctx.lineTo(HW, ISO_TILE_H + ISO_TILE_DEPTH);
    ctx.lineTo(ISO_TILE_W, HH + ISO_TILE_DEPTH);
    ctx.closePath();
    ctx.fill();

    // Top face
    this._diamond(ctx, 0, 0, top);

    // Edge highlights
    ctx.strokeStyle = this._lighten(top, 0.2);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HW, 0.5);
    ctx.lineTo(ISO_TILE_W - 0.5, HH);
    ctx.moveTo(HW, 0.5);
    ctx.lineTo(0.5, HH);
    ctx.stroke();

    // Bottom edge
    ctx.strokeStyle = this._darken(right, 0.2);
    ctx.beginPath();
    ctx.moveTo(0, HH + ISO_TILE_DEPTH);
    ctx.lineTo(HW, ISO_TILE_H + ISO_TILE_DEPTH);
    ctx.lineTo(ISO_TILE_W, HH + ISO_TILE_DEPTH);
    ctx.stroke();

    this._addWallTexture(ctx, tileId, props);

    this.cache.set(tileId, { canvas: c, offsetY: ISO_TILE_DEPTH });
  }

  // ---- Object sprites (small block on base, 64x44) ----

  _makeObject(tileId, props) {
    const objDepth = Math.floor(ISO_TILE_DEPTH * 0.5);
    const h = ISO_TILE_H + objDepth;
    const c = this._canvas(ISO_TILE_W, h);
    const ctx = c.getContext('2d');

    // Floor base
    this._diamond(ctx, 0, objDepth, '#1a1a1a');

    // Small centered block
    const scale = 0.5;
    const sw = ISO_TILE_W * scale;
    const sh = ISO_TILE_H * scale;
    const ox = (ISO_TILE_W - sw) / 2;
    const oy = (ISO_TILE_H - sh) / 2;

    const top = props.fg;
    const left = this._darken(top, 0.3);
    const right = this._darken(top, 0.5);

    // Left face
    ctx.fillStyle = left;
    ctx.beginPath();
    ctx.moveTo(ox, oy + sh / 2);
    ctx.lineTo(ox + sw / 2, oy + sh);
    ctx.lineTo(ox + sw / 2, oy + sh + objDepth);
    ctx.lineTo(ox, oy + sh / 2 + objDepth);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = right;
    ctx.beginPath();
    ctx.moveTo(ox + sw, oy + sh / 2);
    ctx.lineTo(ox + sw / 2, oy + sh);
    ctx.lineTo(ox + sw / 2, oy + sh + objDepth);
    ctx.lineTo(ox + sw, oy + sh / 2 + objDepth);
    ctx.closePath();
    ctx.fill();

    // Top face
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.moveTo(ox + sw / 2, oy);
    ctx.lineTo(ox + sw, oy + sh / 2);
    ctx.lineTo(ox + sw / 2, oy + sh);
    ctx.lineTo(ox, oy + sh / 2);
    ctx.closePath();
    ctx.fill();

    // Edge highlight
    ctx.strokeStyle = this._lighten(top, 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox + sw / 2, oy + 0.5);
    ctx.lineTo(ox + sw - 0.5, oy + sh / 2);
    ctx.moveTo(ox + sw / 2, oy + 0.5);
    ctx.lineTo(ox + 0.5, oy + sh / 2);
    ctx.stroke();

    this.cache.set(tileId, { canvas: c, offsetY: objDepth });
  }

  // ---- Texture Details ----

  _addFloorTexture(ctx, tileId, props) {
    switch (tileId) {
      case Tiles.FLOOR_STONE:
        this._scatter(ctx, props.fg, 10, 0.3);
        this._crack(ctx, '#334');
        break;
      case Tiles.FLOOR_METAL:
        this._metalDots(ctx, '#88a', 5);
        break;
      case Tiles.FLOOR_DIRT:
        this._scatter(ctx, props.fg, 16, 0.4);
        this._scatter(ctx, '#654', 6, 0.3);
        break;
      case Tiles.FLOOR_GRASS:
        this._scatter(ctx, '#6c6', 14, 0.5);
        this._scatter(ctx, '#3a3', 8, 0.3);
        break;
      case Tiles.FLOOR_SAND:
        this._scatter(ctx, '#dca', 12, 0.3);
        break;
      case Tiles.FLOOR_WOOD:
        this._plankLines(ctx, this._darken(props.fg, 0.2));
        break;
      case Tiles.WATER:
        this._waves(ctx, '#5af');
        break;
      case Tiles.WATER_DEEP:
        this._waves(ctx, '#38c');
        break;
      case Tiles.WATER_TOXIC:
        this._waves(ctx, '#6f6');
        break;
      case Tiles.ROAD:
      case Tiles.ROAD_CRACKED:
        this._scatter(ctx, '#666', 6, 0.2);
        if (tileId === Tiles.ROAD_CRACKED) this._crack(ctx, '#444');
        break;
      case Tiles.RUBBLE:
      case Tiles.DEBRIS:
        this._scatter(ctx, props.fg, 12, 0.5);
        break;
      case Tiles.DOOR_OPEN:
        this._diamondEdge(ctx, 0, 0, '#aa6');
        break;
      case Tiles.STAIRS_UP:
      case Tiles.STAIRS_DOWN:
        this._arrowMarker(ctx, '#fff', tileId === Tiles.STAIRS_DOWN);
        break;
      case Tiles.EXIT_NORTH:
      case Tiles.EXIT_SOUTH:
      case Tiles.EXIT_EAST:
      case Tiles.EXIT_WEST:
        this._arrowMarker(ctx, props.fg, false);
        break;
    }
  }

  _addWallTexture(ctx, tileId, props) {
    if (tileId === Tiles.WALL_BRICK || tileId === Tiles.WALL_STONE) {
      this._mortarLines(ctx, props);
    }
    if (tileId === Tiles.DOOR_CLOSED || tileId === Tiles.DOOR_LOCKED) {
      const doorColor = tileId === Tiles.DOOR_LOCKED ? '#a44' : '#aa6';
      // Door panel indicator
      ctx.fillStyle = doorColor;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(HW - 6, ISO_TILE_H, 12, ISO_TILE_DEPTH - 4);
      ctx.globalAlpha = 1;
      // Handle
      ctx.fillStyle = '#ddd';
      ctx.fillRect(HW + 2, ISO_TILE_H + Math.floor(ISO_TILE_DEPTH / 2), 2, 2);
    }
  }

  // ---- Drawing Helpers ----

  _canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  _diamond(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + HW, y);
    ctx.lineTo(x + ISO_TILE_W, y + HH);
    ctx.lineTo(x + HW, y + ISO_TILE_H);
    ctx.lineTo(x, y + HH);
    ctx.closePath();
    ctx.fill();
  }

  _diamondEdge(ctx, x, y, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + HW, y + 0.5);
    ctx.lineTo(x + ISO_TILE_W - 0.5, y + HH);
    ctx.lineTo(x + HW, y + ISO_TILE_H - 0.5);
    ctx.lineTo(x + 0.5, y + HH);
    ctx.closePath();
    ctx.stroke();
  }

  _inDiamond(nx, ny) {
    return Math.abs(nx - 0.5) / 0.5 + Math.abs(ny - 0.5) / 0.5 <= 1;
  }

  _scatter(ctx, color, count, alpha) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    for (let i = 0; i < count; i++) {
      const px = Math.random();
      const py = Math.random();
      if (this._inDiamond(px, py)) {
        ctx.fillRect(px * ISO_TILE_W, py * ISO_TILE_H, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  _metalDots(ctx, color, count) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < count; i++) {
      const px = Math.random();
      const py = Math.random();
      if (this._inDiamond(px, py)) {
        ctx.beginPath();
        ctx.arc(px * ISO_TILE_W, py * ISO_TILE_H, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  _crack(ctx, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    const cx = HW + (Math.random() - 0.5) * 16;
    const cy = HH + (Math.random() - 0.5) * 8;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 2);
    ctx.lineTo(cx, cy + 1);
    ctx.lineTo(cx + 6, cy - 1);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  _plankLines(ctx, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    for (let i = 1; i < 4; i++) {
      const y = (ISO_TILE_H / 4) * i;
      const ratio = 1 - Math.abs(y / ISO_TILE_H - 0.5) * 2;
      const hw = HW * ratio;
      ctx.beginPath();
      ctx.moveTo(HW - hw, y);
      ctx.lineTo(HW + hw, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  _waves(ctx, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      const y = 8 + i * 8;
      ctx.beginPath();
      for (let x = HW - 18 + i * 3; x < HW + 14 - i * 3; x += 6) {
        if (this._inDiamond(x / ISO_TILE_W, y / ISO_TILE_H)) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + 4, y - 2);
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  _arrowMarker(ctx, color, down) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    const y = down ? 18 : 6;
    ctx.beginPath();
    ctx.moveTo(HW, y + (down ? 0 : 8));
    ctx.lineTo(HW + 5, y + (down ? 8 : 0));
    ctx.lineTo(HW - 5, y + (down ? 8 : 0));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  _mortarLines(ctx, props) {
    ctx.strokeStyle = this._darken(props.fg, 0.5);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.25;
    // Horizontal mortar on left face
    for (let i = 1; i <= 2; i++) {
      const y = HH + (ISO_TILE_DEPTH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(2, y);
      ctx.lineTo(HW - 2, y + i * 2);
      ctx.stroke();
    }
    // Horizontal mortar on right face
    for (let i = 1; i <= 2; i++) {
      const y = HH + (ISO_TILE_DEPTH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(ISO_TILE_W - 2, y);
      ctx.lineTo(HW + 2, y + i * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---- Color Utilities ----

  _parseHex(hex) {
    if (hex.length === 4) {
      return [
        parseInt(hex[1], 16) * 17,
        parseInt(hex[2], 16) * 17,
        parseInt(hex[3], 16) * 17,
      ];
    }
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }

  _lighten(hex, amount) {
    const [r, g, b] = this._parseHex(hex);
    const bump = Math.floor(255 * amount);
    return `rgb(${Math.min(255, r + bump)},${Math.min(255, g + bump)},${Math.min(255, b + bump)})`;
  }

  _darken(hex, amount) {
    const [r, g, b] = this._parseHex(hex);
    const f = 1 - amount;
    return `rgb(${Math.floor(r * f)},${Math.floor(g * f)},${Math.floor(b * f)})`;
  }
}
