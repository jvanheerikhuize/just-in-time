/**
 * JUST IN TIME - Tile Sprites
 * Procedural isometric tile art generator with caching.
 * Rich pixel-art style with per-pixel lighting, material textures,
 * and unique object silhouettes. NW directional light source.
 */

import { ISO_TILE_W, ISO_TILE_H, ISO_TILE_DEPTH, Tiles, TILE_PROPS } from '../core/constants.js';

const HW = ISO_TILE_W / 2;   // 32
const HH = ISO_TILE_H / 2;   // 16
const D  = ISO_TILE_DEPTH;    // 24

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

const WATER_TILES = new Set([
  Tiles.WATER, Tiles.WATER_DEEP, Tiles.WATER_TOXIC,
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
      } else if (WATER_TILES.has(tileId)) {
        this._makeWater(tileId, props);
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

  // ================================================================
  // SEEDED RNG
  // ================================================================

  _rng(seed) {
    return ((seed * 16807) % 2147483647 + 2147483647) % 2147483647;
  }

  _rngFloat(seed) {
    return (seed % 2147483647) / 2147483647;
  }

  // ================================================================
  // FLOOR TILES — Per-pixel diamond with noise + NW directional light
  // ================================================================

  _makeFloor(tileId, props) {
    const c = this._canvas(ISO_TILE_W, ISO_TILE_H);
    const ctx = c.getContext('2d');

    const imgData = ctx.createImageData(ISO_TILE_W, ISO_TILE_H);
    const [br, bg, bb] = this._parseHex(props.bg);
    const [fr, fg, fb] = this._parseHex(props.fg);
    let seed = tileId * 7919 + 42;

    for (let py = 0; py < ISO_TILE_H; py++) {
      for (let px = 0; px < ISO_TILE_W; px++) {
        const nx = px / (ISO_TILE_W - 1);
        const ny = py / (ISO_TILE_H - 1);
        if (!this._inDiamond(nx, ny)) continue;

        // NW directional lighting (top-left bright, bottom-right dark)
        const light = 0.78 + 0.22 * (1.0 - nx * 0.55 - ny * 0.45);

        // Deterministic per-pixel noise
        seed = this._rng(seed + px * 31 + py * 97);
        const noise = (this._rngFloat(seed) - 0.5) * 0.2;

        const t = 0.35 + noise;
        const r = (br * (1 - t) + fr * t) * light;
        const g = (bg * (1 - t) + fg * t) * light;
        const b = (bb * (1 - t) + fb * t) * light;

        const i = (py * ISO_TILE_W + px) * 4;
        imgData.data[i]     = this._clamp(Math.floor(r));
        imgData.data[i + 1] = this._clamp(Math.floor(g));
        imgData.data[i + 2] = this._clamp(Math.floor(b));
        imgData.data[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this._diamondBevel(ctx);
    this._addFloorDetail(ctx, tileId, props, tileId * 7919 + 42);

    this.cache.set(tileId, { canvas: c, offsetY: 0 });
  }

  _diamondBevel(ctx) {
    // NW edge highlight (lit side)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HW, 1);
    ctx.lineTo(1, HH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(HW, 1);
    ctx.lineTo(ISO_TILE_W - 1, HH);
    ctx.stroke();
    // SE edge shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.moveTo(1, HH);
    ctx.lineTo(HW, ISO_TILE_H - 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ISO_TILE_W - 1, HH);
    ctx.lineTo(HW, ISO_TILE_H - 1);
    ctx.stroke();
  }

  _addFloorDetail(ctx, tileId, props, baseSeed) {
    switch (tileId) {
      case Tiles.FLOOR_STONE:  this._stoneFloorDetail(ctx, baseSeed); break;
      case Tiles.FLOOR_METAL:  this._metalFloorDetail(ctx); break;
      case Tiles.FLOOR_DIRT:   this._dirtFloorDetail(ctx, baseSeed); break;
      case Tiles.FLOOR_GRASS:  this._grassFloorDetail(ctx, baseSeed); break;
      case Tiles.FLOOR_SAND:   this._sandFloorDetail(ctx); break;
      case Tiles.FLOOR_WOOD:   this._woodFloorDetail(ctx, props); break;
      case Tiles.ROAD:         this._roadDetail(ctx, false); break;
      case Tiles.ROAD_CRACKED: this._roadDetail(ctx, true); break;
      case Tiles.RUBBLE:       this._rubbleDetail(ctx, baseSeed); break;
      case Tiles.DEBRIS:       this._debrisDetail(ctx, baseSeed); break;
      case Tiles.DOOR_OPEN:    this._doorOpenDetail(ctx); break;
      case Tiles.STAIRS_UP:
      case Tiles.STAIRS_DOWN:  this._stairsDetail(ctx, tileId === Tiles.STAIRS_DOWN); break;
      case Tiles.EXIT_NORTH:
      case Tiles.EXIT_SOUTH:
      case Tiles.EXIT_EAST:
      case Tiles.EXIT_WEST:    this._exitDetail(ctx, tileId); break;
      case Tiles.CHAIR:        this._chairOnFloor(ctx, props); break;
    }
  }

  _stoneFloorDetail(ctx, seed) {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    // Horizontal seams
    for (let i = 1; i < 3; i++) {
      const y = (ISO_TILE_H / 3) * i;
      const ratio = 1 - Math.abs(y / ISO_TILE_H - 0.5) * 2;
      const hw = HW * ratio * 0.9;
      ctx.beginPath();
      ctx.moveTo(HW - hw, y);
      ctx.lineTo(HW + hw, y);
      ctx.stroke();
    }
    // Vertical seam segments
    let s = seed;
    s = this._rng(s);
    ctx.beginPath();
    ctx.moveTo(HW - 4, 8);
    ctx.lineTo(HW - 2, 13);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(HW + 8, 12);
    ctx.lineTo(HW + 6, 20);
    ctx.stroke();
  }

  _metalFloorDetail(ctx) {
    // Panel seams (cross)
    ctx.strokeStyle = 'rgba(100,120,140,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HW, 2);
    ctx.lineTo(HW, ISO_TILE_H - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, HH);
    ctx.lineTo(ISO_TILE_W - 6, HH);
    ctx.stroke();
    // Rivet dots
    ctx.fillStyle = 'rgba(160,180,200,0.3)';
    const rivets = [[HW, 5], [HW, HH], [HW, ISO_TILE_H - 5], [10, HH], [ISO_TILE_W - 10, HH]];
    for (const [rx, ry] of rivets) {
      if (this._inDiamond(rx / ISO_TILE_W, ry / ISO_TILE_H)) {
        ctx.beginPath();
        ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _dirtFloorDetail(ctx, seed) {
    let s = seed;
    // Pebbles
    ctx.fillStyle = 'rgba(120,80,40,0.3)';
    for (let i = 0; i < 8; i++) {
      s = this._rng(s);
      const px = this._rngFloat(s);
      s = this._rng(s);
      const py = this._rngFloat(s);
      if (this._inDiamond(px, py)) {
        s = this._rng(s);
        const sz = 1 + this._rngFloat(s) * 2;
        ctx.fillRect(px * ISO_TILE_W, py * ISO_TILE_H, sz, sz);
      }
    }
    // Darker spots
    ctx.fillStyle = 'rgba(40,20,10,0.2)';
    for (let i = 0; i < 4; i++) {
      s = this._rng(s);
      const px = this._rngFloat(s);
      s = this._rng(s);
      const py = this._rngFloat(s);
      if (this._inDiamond(px, py)) {
        ctx.beginPath();
        ctx.arc(px * ISO_TILE_W, py * ISO_TILE_H, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _grassFloorDetail(ctx, seed) {
    let s = seed;
    for (let i = 0; i < 20; i++) {
      s = this._rng(s);
      const px = this._rngFloat(s);
      s = this._rng(s);
      const py = this._rngFloat(s);
      if (!this._inDiamond(px, py)) continue;
      s = this._rng(s);
      const shade = this._rngFloat(s);
      const g = Math.floor(120 + shade * 80);
      ctx.strokeStyle = `rgba(${Math.floor(30 + shade * 40)},${g},${Math.floor(20 + shade * 30)},0.6)`;
      ctx.lineWidth = 1;
      const bx = px * ISO_TILE_W;
      const by = py * ISO_TILE_H;
      s = this._rng(s);
      const lean = (this._rngFloat(s) - 0.5) * 4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + lean, by - 3 - shade * 3);
      ctx.stroke();
    }
  }

  _sandFloorDetail(ctx) {
    // Wind ripple lines
    ctx.strokeStyle = 'rgba(180,160,120,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = 6 + i * 6;
      const ratio = 1 - Math.abs(y / ISO_TILE_H - 0.5) * 2;
      if (ratio <= 0) continue;
      const hw = HW * ratio * 0.7;
      ctx.beginPath();
      ctx.moveTo(HW - hw, y);
      ctx.quadraticCurveTo(HW, y + 1, HW + hw, y);
      ctx.stroke();
    }
  }

  _woodFloorDetail(ctx, props) {
    const dark = this._darken(props.fg, 0.25);
    ctx.strokeStyle = dark;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = (ISO_TILE_H / 5) * i;
      const ratio = 1 - Math.abs(y / ISO_TILE_H - 0.5) * 2;
      if (ratio <= 0) continue;
      const hw = HW * ratio * 0.9;
      ctx.beginPath();
      ctx.moveTo(HW - hw, y);
      ctx.lineTo(HW + hw, y);
      ctx.stroke();
    }
    // Wood knots
    ctx.fillStyle = this._darken(props.fg, 0.15);
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(HW - 6, HH + 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(HW + 10, HH - 4, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  _roadDetail(ctx, cracked) {
    // Center line dashes
    ctx.strokeStyle = 'rgba(200,200,100,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(HW, 4);
    ctx.lineTo(HW, ISO_TILE_H - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    if (cracked) {
      ctx.strokeStyle = 'rgba(60,50,40,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(HW - 8, 6);
      ctx.lineTo(HW - 2, HH);
      ctx.lineTo(HW + 5, HH + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(HW + 10, 10);
      ctx.lineTo(HW + 6, 18);
      ctx.stroke();
    }
  }

  _rubbleDetail(ctx, seed) {
    let s = seed;
    ctx.fillStyle = 'rgba(120,110,90,0.4)';
    for (let i = 0; i < 6; i++) {
      s = this._rng(s);
      const px = this._rngFloat(s);
      s = this._rng(s);
      const py = this._rngFloat(s);
      if (!this._inDiamond(px, py)) continue;
      s = this._rng(s);
      const sz = 2 + this._rngFloat(s) * 3;
      ctx.beginPath();
      ctx.arc(px * ISO_TILE_W, py * ISO_TILE_H, sz, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _debrisDetail(ctx, seed) {
    let s = seed;
    for (let i = 0; i < 5; i++) {
      s = this._rng(s);
      const px = this._rngFloat(s);
      s = this._rng(s);
      const py = this._rngFloat(s);
      if (!this._inDiamond(px, py)) continue;
      s = this._rng(s);
      const shade = Math.floor(80 + this._rngFloat(s) * 60);
      ctx.fillStyle = `rgba(${shade},${shade - 10},${shade - 20},0.5)`;
      ctx.fillRect(px * ISO_TILE_W - 2, py * ISO_TILE_H - 1, 4, 2);
    }
  }

  _doorOpenDetail(ctx) {
    ctx.strokeStyle = 'rgba(170,170,100,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(HW - 12, HH - 3);
    ctx.lineTo(HW + 12, HH + 3);
    ctx.stroke();
  }

  _stairsDetail(ctx, down) {
    // Arrow
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    const y = down ? HH + 2 : HH - 6;
    const dir = down ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(HW, y + dir * 6);
    ctx.lineTo(HW - 5, y);
    ctx.lineTo(HW + 5, y);
    ctx.closePath();
    ctx.fill();
    // Step lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const sy = HH - 4 + i * 4;
      ctx.beginPath();
      ctx.moveTo(HW - 8 + i * 2, sy);
      ctx.lineTo(HW + 8 - i * 2, sy);
      ctx.stroke();
    }
  }

  _exitDetail(ctx, tileId) {
    ctx.fillStyle = 'rgba(255,255,60,0.35)';
    let pts;
    switch (tileId) {
      case Tiles.EXIT_NORTH:
        pts = [[HW, 4], [HW - 6, 12], [HW + 6, 12]]; break;
      case Tiles.EXIT_SOUTH:
        pts = [[HW, ISO_TILE_H - 4], [HW - 6, ISO_TILE_H - 12], [HW + 6, ISO_TILE_H - 12]]; break;
      case Tiles.EXIT_EAST:
        pts = [[ISO_TILE_W - 8, HH], [ISO_TILE_W - 16, HH - 5], [ISO_TILE_W - 16, HH + 5]]; break;
      case Tiles.EXIT_WEST:
        pts = [[8, HH], [16, HH - 5], [16, HH + 5]]; break;
    }
    if (pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.closePath();
      ctx.fill();
    }
    // Pulsing border glow
    ctx.strokeStyle = 'rgba(255,255,60,0.2)';
    ctx.lineWidth = 2;
    this._strokeDiamondFull(ctx);
  }

  _chairOnFloor(ctx, props) {
    // Small seat shape drawn on the walkable floor tile
    const cx = HW, cy = HH;
    // Seat
    ctx.fillStyle = this._darken(props.fg, 0.1);
    ctx.fillRect(cx - 4, cy - 3, 8, 5);
    // Back
    ctx.fillStyle = props.fg;
    ctx.fillRect(cx - 4, cy - 6, 8, 3);
    // Legs
    ctx.strokeStyle = this._darken(props.fg, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + 2);
    ctx.lineTo(cx - 4, cy + 4);
    ctx.moveTo(cx + 3, cy + 2);
    ctx.lineTo(cx + 4, cy + 4);
    ctx.stroke();
  }

  // ================================================================
  // WATER TILES — Per-pixel sine-wave blending
  // ================================================================

  _makeWater(tileId, props) {
    const c = this._canvas(ISO_TILE_W, ISO_TILE_H);
    const ctx = c.getContext('2d');

    const imgData = ctx.createImageData(ISO_TILE_W, ISO_TILE_H);
    const [br, bg, bb] = this._parseHex(props.bg);
    const [fr, fg, fb] = this._parseHex(props.fg);
    const mr = (br + fr) >> 1;
    const mmg = (bg + fg) >> 1;
    const mb = (bb + fb) >> 1;

    for (let py = 0; py < ISO_TILE_H; py++) {
      for (let px = 0; px < ISO_TILE_W; px++) {
        const nx = px / (ISO_TILE_W - 1);
        const ny = py / (ISO_TILE_H - 1);
        if (!this._inDiamond(nx, ny)) continue;

        // Sine ripple pattern
        const wave1 = Math.sin(px * 0.3 + py * 0.5) * 0.5 + 0.5;
        const wave2 = Math.sin(px * 0.15 - py * 0.4 + 2) * 0.5 + 0.5;
        const wave = wave1 * 0.6 + wave2 * 0.4;

        let r, g, b;
        if (wave < 0.5) {
          const t = wave * 2;
          r = br + (mr - br) * t;
          g = bg + (mmg - bg) * t;
          b = bb + (mb - bb) * t;
        } else {
          const t = (wave - 0.5) * 2;
          r = mr + (fr - mr) * t;
          g = mmg + (fg - mmg) * t;
          b = mb + (fb - mb) * t;
        }

        // Specular highlights on wave crests
        if (wave > 0.85) {
          const spec = (wave - 0.85) / 0.15;
          r += spec * 60;
          g += spec * 60;
          b += spec * 80;
        }

        const i = (py * ISO_TILE_W + px) * 4;
        imgData.data[i]     = this._clamp(Math.floor(r));
        imgData.data[i + 1] = this._clamp(Math.floor(g));
        imgData.data[i + 2] = this._clamp(Math.floor(b));
        imgData.data[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this._diamondBevel(ctx);
    this.cache.set(tileId, { canvas: c, offsetY: 0 });
  }

  // ================================================================
  // WALL TILES — Extruded block with gradient faces + material texture
  // ================================================================

  _makeWall(tileId, props) {
    const h = ISO_TILE_H + D;
    const c = this._canvas(ISO_TILE_W, h);
    const ctx = c.getContext('2d');

    const [cr, cg, cb] = this._parseHex(props.fg);

    // — Left face (NW lit, medium brightness) —
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, HH);
    ctx.lineTo(HW, ISO_TILE_H);
    ctx.lineTo(HW, ISO_TILE_H + D);
    ctx.lineTo(0, HH + D);
    ctx.closePath();
    ctx.clip();
    const lgr = ctx.createLinearGradient(0, HH, HW, ISO_TILE_H);
    lgr.addColorStop(0, this._rgb(cr * 0.82, cg * 0.82, cb * 0.82));
    lgr.addColorStop(1, this._rgb(cr * 0.65, cg * 0.65, cb * 0.65));
    ctx.fillStyle = lgr;
    ctx.fillRect(0, HH, HW, D + HH);
    this._wallFaceTexture(ctx, tileId, 'left');
    ctx.restore();

    // — Right face (shadow side, darker) —
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ISO_TILE_W, HH);
    ctx.lineTo(HW, ISO_TILE_H);
    ctx.lineTo(HW, ISO_TILE_H + D);
    ctx.lineTo(ISO_TILE_W, HH + D);
    ctx.closePath();
    ctx.clip();
    const rgr = ctx.createLinearGradient(HW, ISO_TILE_H, ISO_TILE_W, HH);
    rgr.addColorStop(0, this._rgb(cr * 0.55, cg * 0.55, cb * 0.55));
    rgr.addColorStop(1, this._rgb(cr * 0.45, cg * 0.45, cb * 0.45));
    ctx.fillStyle = rgr;
    ctx.fillRect(HW, HH, HW, D + HH);
    this._wallFaceTexture(ctx, tileId, 'right');
    ctx.restore();

    // — Top face (brightest, NW gradient) —
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(HW, 0);
    ctx.lineTo(ISO_TILE_W, HH);
    ctx.lineTo(HW, ISO_TILE_H);
    ctx.lineTo(0, HH);
    ctx.closePath();
    ctx.clip();
    const tgr = ctx.createLinearGradient(0, HH, ISO_TILE_W, HH);
    tgr.addColorStop(0, this._rgb(cr, cg, cb));
    tgr.addColorStop(1, this._rgb(cr * 0.85, cg * 0.85, cb * 0.85));
    ctx.fillStyle = tgr;
    ctx.fillRect(0, 0, ISO_TILE_W, ISO_TILE_H);
    ctx.restore();

    // Edge highlights (top)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HH);
    ctx.lineTo(HW, 0.5);
    ctx.lineTo(ISO_TILE_W, HH);
    ctx.stroke();

    // Bottom edge shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.moveTo(0, HH + D);
    ctx.lineTo(HW, ISO_TILE_H + D);
    ctx.lineTo(ISO_TILE_W, HH + D);
    ctx.stroke();

    // Left vertical highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(0.5, HH);
    ctx.lineTo(0.5, HH + D);
    ctx.stroke();

    // Door overlay
    if (tileId === Tiles.DOOR_CLOSED || tileId === Tiles.DOOR_LOCKED) {
      this._doorOverlay(ctx, tileId);
    }

    this.cache.set(tileId, { canvas: c, offsetY: D });
  }

  _wallFaceTexture(ctx, tileId, face) {
    switch (tileId) {
      case Tiles.WALL_BRICK:  this._brickTexture(ctx, face); break;
      case Tiles.WALL_STONE:  this._stoneWallTexture(ctx, face); break;
      case Tiles.WALL_METAL:  this._metalWallTexture(ctx, face); break;
      case Tiles.WALL_WOOD:   this._woodWallTexture(ctx, face); break;
      case Tiles.DOOR_CLOSED:
      case Tiles.DOOR_LOCKED: this._metalWallTexture(ctx, face); break;
    }
  }

  _brickTexture(ctx, face) {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    const rows = 4;
    const rowH = D / rows;
    const baseY = HH;

    for (let r = 0; r <= rows; r++) {
      const y = baseY + r * rowH;
      if (face === 'left') {
        const xStart = (r / rows) * HW * 0.5;
        const xEnd = HW - (1 - r / rows) * HW * 0.3;
        ctx.beginPath();
        ctx.moveTo(xStart, y + (r / rows) * HH * 0.5);
        ctx.lineTo(xEnd, y + (r / rows) * HH * 0.5 + 2);
        ctx.stroke();
        if (r < rows) {
          const stagger = (r % 2 === 0) ? 0.33 : 0.66;
          const vx = xStart + (xEnd - xStart) * stagger;
          const vy = y + (r / rows) * HH * 0.5;
          ctx.beginPath();
          ctx.moveTo(vx, vy);
          ctx.lineTo(vx, vy + rowH);
          ctx.stroke();
        }
      } else {
        const xStart = HW + (1 - r / rows) * HW * 0.3;
        const xEnd = ISO_TILE_W - (r / rows) * HW * 0.5;
        ctx.beginPath();
        ctx.moveTo(xStart, y + (r / rows) * HH * 0.5 + 2);
        ctx.lineTo(xEnd, y + (r / rows) * HH * 0.5);
        ctx.stroke();
        if (r < rows) {
          const stagger = (r % 2 === 0) ? 0.4 : 0.7;
          const vx = xStart + (xEnd - xStart) * stagger;
          const vy = y + (r / rows) * HH * 0.5;
          ctx.beginPath();
          ctx.moveTo(vx, vy + 1);
          ctx.lineTo(vx, vy + rowH);
          ctx.stroke();
        }
      }
    }
  }

  _stoneWallTexture(ctx, face) {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    const baseY = HH;
    const blocks = face === 'left'
      ? [[4, baseY + 4, 12, 8], [8, baseY + 14, 16, 10], [2, baseY + 24, 20, 7]]
      : [[HW + 4, baseY + 6, 14, 9], [HW + 2, baseY + 16, 18, 8], [HW + 6, baseY + 26, 12, 7]];
    for (const [bx, by, bw, bh] of blocks) {
      ctx.strokeRect(bx, by, bw, bh);
    }
  }

  _metalWallTexture(ctx, face) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    const baseY = HH;
    const midY = baseY + D / 2;
    if (face === 'left') {
      ctx.beginPath();
      ctx.moveTo(2, midY);
      ctx.lineTo(HW - 2, midY + 4);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(HW + 2, midY + 4);
      ctx.lineTo(ISO_TILE_W - 2, midY);
      ctx.stroke();
    }
    // Rivet dots
    ctx.fillStyle = 'rgba(200,210,220,0.2)';
    const rivets = face === 'left'
      ? [[6, baseY + 4], [6, baseY + D - 4], [HW - 6, baseY + 8], [HW - 6, baseY + D - 2]]
      : [[HW + 6, baseY + 8], [HW + 6, baseY + D - 2], [ISO_TILE_W - 6, baseY + 4], [ISO_TILE_W - 6, baseY + D - 4]];
    for (const [rx, ry] of rivets) {
      ctx.beginPath();
      ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _woodWallTexture(ctx, face) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    const baseY = HH;
    const count = 4;
    for (let i = 1; i < count; i++) {
      const t = i / count;
      if (face === 'left') {
        const x = t * HW;
        ctx.beginPath();
        ctx.moveTo(x, baseY + t * HH);
        ctx.lineTo(x, baseY + t * HH + D);
        ctx.stroke();
      } else {
        const x = HW + t * HW;
        ctx.beginPath();
        ctx.moveTo(x, baseY + (1 - t) * HH + HH);
        ctx.lineTo(x, baseY + (1 - t) * HH + HH + D);
        ctx.stroke();
      }
    }
    // Knot
    ctx.fillStyle = 'rgba(80,50,20,0.2)';
    if (face === 'left') {
      ctx.beginPath();
      ctx.arc(12, baseY + D / 2 + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(ISO_TILE_W - 12, baseY + D / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _doorOverlay(ctx, tileId) {
    const isLocked = tileId === Tiles.DOOR_LOCKED;
    const doorColor = isLocked ? 'rgba(180,60,60,0.35)' : 'rgba(170,170,100,0.3)';

    // Door panel on right face
    ctx.fillStyle = doorColor;
    ctx.beginPath();
    ctx.moveTo(HW + 8, ISO_TILE_H + 2);
    ctx.lineTo(ISO_TILE_W - 8, HH + D / 2);
    ctx.lineTo(ISO_TILE_W - 8, HH + D - 2);
    ctx.lineTo(HW + 8, ISO_TILE_H + D - 2);
    ctx.closePath();
    ctx.fill();

    // Handle
    ctx.fillStyle = isLocked ? '#c44' : '#dd8';
    ctx.beginPath();
    ctx.arc(HW + 14, ISO_TILE_H + D / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Lock icon
    if (isLocked) {
      ctx.strokeStyle = '#c44';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(HW + 14, ISO_TILE_H + D / 2 - 4, 3, Math.PI, 0);
      ctx.stroke();
    }
  }

  // ================================================================
  // OBJECT TILES — Unique recognizable shapes per type
  // ================================================================

  _makeObject(tileId, props) {
    switch (tileId) {
      case Tiles.TABLE:     this._makeTable(props); return;
      case Tiles.BED:       this._makeBed(props); return;
      case Tiles.SHELF:     this._makeShelf(props); return;
      case Tiles.COUNTER:   this._makeCounter(props); return;
      case Tiles.COMPUTER:  this._makeComputer(props); return;
      case Tiles.CRYOPOD:   this._makeCryoPod(props); return;
      case Tiles.GENERATOR: this._makeGenerator(props); return;
      case Tiles.BARREL:    this._makeBarrel(props); return;
      case Tiles.CRATE:     this._makeCrate(props); return;
      case Tiles.LOCKER:    this._makeLocker(props); return;
      case Tiles.FENCE:     this._makeFence(props); return;
      case Tiles.SIGN:      this._makeSign(props); return;
      default: this._makeGenericObject(tileId, props); return;
    }
  }

  _objectCanvas(extraH) {
    return {
      canvas: this._canvas(ISO_TILE_W, ISO_TILE_H + extraH),
      offsetY: extraH,
    };
  }

  _makeTable(props) {
    const { canvas: c, offsetY } = this._objectCanvas(10);
    const ctx = c.getContext('2d');
    const by = offsetY;

    // Shadow
    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    // Legs
    ctx.strokeStyle = this._darken(props.fg, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(HW - 10, by + HH - 2); ctx.lineTo(HW - 12, by + HH + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(HW + 10, by + HH - 2); ctx.lineTo(HW + 12, by + HH + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(HW - 8, by + HH - 8); ctx.lineTo(HW - 10, by + HH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(HW + 8, by + HH - 8); ctx.lineTo(HW + 10, by + HH); ctx.stroke();

    // Table top (flat iso diamond)
    ctx.fillStyle = props.fg;
    ctx.beginPath();
    ctx.moveTo(HW, by + HH - 12);
    ctx.lineTo(HW + 14, by + HH - 4);
    ctx.lineTo(HW, by + HH + 2);
    ctx.lineTo(HW - 14, by + HH - 4);
    ctx.closePath();
    ctx.fill();

    // Top highlight
    ctx.strokeStyle = this._lighten(props.fg, 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HW, by + HH - 12);
    ctx.lineTo(HW + 14, by + HH - 4);
    ctx.moveTo(HW, by + HH - 12);
    ctx.lineTo(HW - 14, by + HH - 4);
    ctx.stroke();

    // Front-left edge thickness
    ctx.fillStyle = this._darken(props.fg, 0.3);
    ctx.beginPath();
    ctx.moveTo(HW - 14, by + HH - 4);
    ctx.lineTo(HW, by + HH + 2);
    ctx.lineTo(HW, by + HH + 4);
    ctx.lineTo(HW - 14, by + HH - 2);
    ctx.closePath();
    ctx.fill();
    // Front-right edge thickness
    ctx.fillStyle = this._darken(props.fg, 0.45);
    ctx.beginPath();
    ctx.moveTo(HW + 14, by + HH - 4);
    ctx.lineTo(HW, by + HH + 2);
    ctx.lineTo(HW, by + HH + 4);
    ctx.lineTo(HW + 14, by + HH - 2);
    ctx.closePath();
    ctx.fill();

    this.cache.set(Tiles.TABLE, { canvas: c, offsetY });
  }

  _makeBed(props) {
    const { canvas: c, offsetY } = this._objectCanvas(12);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    // Frame
    ctx.fillStyle = this._darken(props.fg, 0.4);
    ctx.beginPath();
    ctx.moveTo(HW, by + 2);
    ctx.lineTo(HW + 16, by + HH - 2);
    ctx.lineTo(HW, by + ISO_TILE_H - 4);
    ctx.lineTo(HW - 16, by + HH - 2);
    ctx.closePath();
    ctx.fill();

    // Mattress
    ctx.fillStyle = props.fg;
    ctx.beginPath();
    ctx.moveTo(HW, by + 4);
    ctx.lineTo(HW + 13, by + HH - 2);
    ctx.lineTo(HW, by + ISO_TILE_H - 6);
    ctx.lineTo(HW - 13, by + HH - 2);
    ctx.closePath();
    ctx.fill();

    // Pillow
    ctx.fillStyle = this._lighten(props.fg, 0.2);
    ctx.beginPath();
    ctx.moveTo(HW, by + 5);
    ctx.lineTo(HW + 6, by + HH - 5);
    ctx.lineTo(HW, by + HH - 1);
    ctx.lineTo(HW - 6, by + HH - 5);
    ctx.closePath();
    ctx.fill();

    // Blanket fold line
    ctx.strokeStyle = this._darken(props.fg, 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HW - 8, by + HH + 2);
    ctx.lineTo(HW + 8, by + HH + 2);
    ctx.stroke();

    this.cache.set(Tiles.BED, { canvas: c, offsetY });
  }

  _makeShelf(props) {
    const { canvas: c, offsetY } = this._objectCanvas(18);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    // Back panel
    ctx.fillStyle = this._darken(props.fg, 0.3);
    ctx.fillRect(HW - 12, by + HH - 16, 24, 20);

    // Shelves
    ctx.fillStyle = props.fg;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(HW - 12, by + HH - 14 + i * 7, 24, 2);
    }

    // Items on shelves
    const colors = ['#a64', '#4a6', '#66a', '#aa4'];
    for (let i = 0; i < 3; i++) {
      const sy = by + HH - 12 + i * 7;
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = colors[(i + j) % colors.length];
        ctx.fillRect(HW - 8 + j * 12, sy - 4, 4, 4);
      }
    }

    // Edge
    ctx.strokeStyle = this._lighten(props.fg, 0.1);
    ctx.lineWidth = 1;
    ctx.strokeRect(HW - 12, by + HH - 16, 24, 20);

    this.cache.set(Tiles.SHELF, { canvas: c, offsetY });
  }

  _makeCounter(props) {
    const { canvas: c, offsetY } = this._objectCanvas(10);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    // Base
    ctx.fillStyle = this._darken(props.fg, 0.35);
    ctx.beginPath();
    ctx.moveTo(HW - 16, by + HH - 4);
    ctx.lineTo(HW + 16, by + HH - 4);
    ctx.lineTo(HW + 16, by + HH + 6);
    ctx.lineTo(HW - 16, by + HH + 6);
    ctx.closePath();
    ctx.fill();

    // Counter top (wide diamond)
    ctx.fillStyle = props.fg;
    ctx.beginPath();
    ctx.moveTo(HW, by + HH - 10);
    ctx.lineTo(HW + 18, by + HH - 2);
    ctx.lineTo(HW, by + HH + 4);
    ctx.lineTo(HW - 18, by + HH - 2);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.strokeStyle = this._lighten(props.fg, 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HW, by + HH - 10);
    ctx.lineTo(HW + 18, by + HH - 2);
    ctx.moveTo(HW, by + HH - 10);
    ctx.lineTo(HW - 18, by + HH - 2);
    ctx.stroke();

    this.cache.set(Tiles.COUNTER, { canvas: c, offsetY });
  }

  _makeComputer(props) {
    const { canvas: c, offsetY } = this._objectCanvas(20);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    // Desk surface
    ctx.fillStyle = '#443';
    ctx.beginPath();
    ctx.moveTo(HW, by + HH + 2);
    ctx.lineTo(HW + 14, by + HH + 8);
    ctx.lineTo(HW, by + HH + 14);
    ctx.lineTo(HW - 14, by + HH + 8);
    ctx.closePath();
    ctx.fill();

    // Monitor body
    ctx.fillStyle = '#333';
    ctx.fillRect(HW - 8, by + HH - 16, 16, 14);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(HW - 8, by + HH - 16, 16, 14);

    // Screen (dark backing)
    ctx.fillStyle = '#0a2a0a';
    ctx.fillRect(HW - 6, by + HH - 14, 12, 10);
    // Screen glow
    ctx.fillStyle = props.fg;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(HW - 6, by + HH - 14, 12, 10);
    ctx.globalAlpha = 1;

    // Text lines on screen
    ctx.fillStyle = '#0f0';
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 4; i++) {
      const w = 4 + (i % 3) * 2;
      ctx.fillRect(HW - 4, by + HH - 12 + i * 2.5, w, 1);
    }
    ctx.globalAlpha = 1;

    // Stand
    ctx.fillStyle = '#444';
    ctx.fillRect(HW - 2, by + HH - 2, 4, 4);

    // Keyboard
    ctx.fillStyle = '#555';
    ctx.fillRect(HW - 6, by + HH + 4, 12, 4);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(HW - 6, by + HH + 4, 12, 4);

    // Screen glow halo
    ctx.fillStyle = 'rgba(51,255,51,0.05)';
    ctx.beginPath();
    ctx.arc(HW, by + HH - 8, 16, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set(Tiles.COMPUTER, { canvas: c, offsetY });
  }

  _makeCryoPod(props) {
    const { canvas: c, offsetY } = this._objectCanvas(26);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    // Base ellipse
    ctx.fillStyle = '#334';
    ctx.beginPath();
    ctx.ellipse(HW, by + HH + 6, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pod body (capsule)
    const podL = HW - 8;
    const podR = HW + 8;
    const podT = by + HH - 24;
    const podB = by + HH + 4;

    const pgr = ctx.createLinearGradient(podL, 0, podR, 0);
    pgr.addColorStop(0, '#556');
    pgr.addColorStop(0.3, '#778');
    pgr.addColorStop(0.7, '#556');
    pgr.addColorStop(1, '#334');
    ctx.fillStyle = pgr;
    ctx.beginPath();
    ctx.moveTo(podL, podB);
    ctx.lineTo(podL, podT + 6);
    ctx.quadraticCurveTo(podL, podT, HW, podT);
    ctx.quadraticCurveTo(podR, podT, podR, podT + 6);
    ctx.lineTo(podR, podB);
    ctx.closePath();
    ctx.fill();

    // Glass window (blue glow)
    ctx.fillStyle = 'rgba(68,136,255,0.3)';
    ctx.fillRect(HW - 4, podT + 6, 8, podB - podT - 12);

    // Glass highlight
    ctx.strokeStyle = 'rgba(100,180,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HW - 2, podT + 8);
    ctx.lineTo(HW - 2, podB - 8);
    ctx.stroke();

    // Frost dots
    ctx.fillStyle = 'rgba(200,220,255,0.4)';
    const frost = [[HW - 3, podT + 10], [HW + 2, podT + 14], [HW - 1, podB - 10], [HW + 3, podB - 14]];
    for (const [fx, fy] of frost) {
      ctx.fillRect(fx, fy, 2, 2);
    }

    // Outline
    ctx.strokeStyle = 'rgba(100,120,140,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(podL, podB);
    ctx.lineTo(podL, podT + 6);
    ctx.quadraticCurveTo(podL, podT, HW, podT);
    ctx.quadraticCurveTo(podR, podT, podR, podT + 6);
    ctx.lineTo(podR, podB);
    ctx.stroke();

    // Blue floor glow
    ctx.fillStyle = 'rgba(68,136,255,0.06)';
    ctx.beginPath();
    ctx.ellipse(HW, by + HH + 6, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set(Tiles.CRYOPOD, { canvas: c, offsetY });
  }

  _makeGenerator(props) {
    const { canvas: c, offsetY } = this._objectCanvas(18);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    const bx = HW - 12;
    const bt = by + HH - 14;
    const bw = 24;
    const bh = 20;

    // Left face
    ctx.fillStyle = '#665';
    ctx.fillRect(bx, bt, bw / 2, bh);
    // Right face
    ctx.fillStyle = '#554';
    ctx.fillRect(bx + bw / 2, bt, bw / 2, bh);
    // Top
    ctx.fillStyle = '#776';
    ctx.fillRect(bx, bt, bw, 3);

    // Hazard stripes
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#cc0' : '#333';
      ctx.fillRect(bx + 2, bt + 5 + i * 2, bw - 4, 2);
    }

    // Gauge
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(bx + 6, bt + bh - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + 6, bt + bh - 5);
    ctx.lineTo(bx + 8, bt + bh - 7);
    ctx.stroke();

    // Warning light
    ctx.fillStyle = '#f80';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(bx + bw - 5, bt + 6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Exhaust pipe
    ctx.fillStyle = '#555';
    ctx.fillRect(bx + bw - 4, bt - 6, 3, 8);
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(bx + bw - 2.5, bt - 6, 2, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set(Tiles.GENERATOR, { canvas: c, offsetY });
  }

  _makeBarrel(props) {
    const { canvas: c, offsetY } = this._objectCanvas(16);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    const top = by + HH - 14;
    const bottom = by + HH + 4;
    const rx = 10;
    const ry = 4;
    const [r, g, b] = this._parseHex(props.fg);

    // Body with cylindrical gradient
    const bgr = ctx.createLinearGradient(HW - rx, 0, HW + rx, 0);
    bgr.addColorStop(0, this._rgb(r * 0.6, g * 0.6, b * 0.6));
    bgr.addColorStop(0.3, this._rgb(r * 0.9, g * 0.9, b * 0.9));
    bgr.addColorStop(0.6, this._rgb(r * 0.7, g * 0.7, b * 0.7));
    bgr.addColorStop(1, this._rgb(r * 0.4, g * 0.4, b * 0.4));
    ctx.fillStyle = bgr;
    ctx.beginPath();
    ctx.ellipse(HW, bottom, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(HW - rx, top);
    ctx.ellipse(HW, top, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();

    // Top ellipse
    ctx.fillStyle = this._lighten(props.fg, 0.1);
    ctx.beginPath();
    ctx.ellipse(HW, top, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Metal bands
    ctx.strokeStyle = 'rgba(180,180,160,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(HW, top + 4, rx + 0.5, ry * 0.4, 0, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(HW, bottom - 4, rx + 0.5, ry * 0.4, 0, 0, Math.PI);
    ctx.stroke();

    // Top rim
    ctx.strokeStyle = this._lighten(props.fg, 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(HW, top, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    this.cache.set(Tiles.BARREL, { canvas: c, offsetY });
  }

  _makeCrate(props) {
    const { canvas: c, offsetY } = this._objectCanvas(14);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    const bx = HW - 10;
    const bt = by + HH - 10;
    const bw = 20;
    const bh = 16;

    // Left face
    ctx.fillStyle = this._darken(props.fg, 0.2);
    ctx.fillRect(bx, bt, bw / 2, bh);
    // Right face
    ctx.fillStyle = this._darken(props.fg, 0.4);
    ctx.fillRect(bx + bw / 2, bt, bw / 2, bh);
    // Top
    ctx.fillStyle = props.fg;
    ctx.fillRect(bx, bt, bw, 3);

    // Cross planks
    ctx.strokeStyle = this._darken(props.fg, 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + 2, bt + 3);
    ctx.lineTo(bx + bw - 2, bt + bh - 2);
    ctx.moveTo(bx + bw - 2, bt + 3);
    ctx.lineTo(bx + 2, bt + bh - 2);
    ctx.stroke();

    // Nails
    ctx.fillStyle = 'rgba(180,180,180,0.4)';
    const nails = [[bx + 2, bt + 3], [bx + bw - 2, bt + 3], [bx + 2, bt + bh - 2], [bx + bw - 2, bt + bh - 2]];
    for (const [nx, ny] of nails) {
      ctx.beginPath();
      ctx.arc(nx, ny, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top edge highlight
    ctx.strokeStyle = this._lighten(props.fg, 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, bt);
    ctx.lineTo(bx + bw, bt);
    ctx.stroke();

    this.cache.set(Tiles.CRATE, { canvas: c, offsetY });
  }

  _makeLocker(props) {
    const { canvas: c, offsetY } = this._objectCanvas(22);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.15)');

    const bx = HW - 7;
    const bt = by + HH - 20;
    const bw = 14;
    const bh = 26;

    // Metallic gradient body
    const [r, g, b] = this._parseHex(props.fg);
    const lgr = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    lgr.addColorStop(0, this._rgb(r * 0.7, g * 0.7, b * 0.7));
    lgr.addColorStop(0.4, this._rgb(r * 0.9, g * 0.9, b * 0.9));
    lgr.addColorStop(1, this._rgb(r * 0.5, g * 0.5, b * 0.5));
    ctx.fillStyle = lgr;
    ctx.fillRect(bx, bt, bw, bh);

    // Door seam
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, bt + 2);
    ctx.lineTo(bx + bw / 2, bt + bh - 2);
    ctx.stroke();

    // Handle
    ctx.fillStyle = '#bbb';
    ctx.fillRect(bx + bw / 2 + 2, bt + bh / 2 - 2, 2, 4);

    // Vent slots
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(bx + 3, bt + 4 + i * 3);
      ctx.lineTo(bx + bw - 3, bt + 4 + i * 3);
      ctx.stroke();
    }

    // Top highlight
    ctx.strokeStyle = this._lighten(props.fg, 0.15);
    ctx.beginPath();
    ctx.moveTo(bx, bt);
    ctx.lineTo(bx + bw, bt);
    ctx.stroke();

    this.cache.set(Tiles.LOCKER, { canvas: c, offsetY });
  }

  _makeFence(props) {
    const { canvas: c, offsetY } = this._objectCanvas(14);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.1)');

    // Posts
    ctx.fillStyle = this._darken(props.fg, 0.2);
    for (let i = 0; i < 3; i++) {
      const px = HW - 14 + i * 14;
      ctx.fillRect(px - 1, by + HH - 12, 2, 16);
    }

    // Wires
    ctx.strokeStyle = this._lighten(props.fg, 0.1);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      const wy = by + HH - 10 + i * 5;
      ctx.beginPath();
      ctx.moveTo(HW - 14, wy);
      ctx.lineTo(HW + 14, wy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    this.cache.set(Tiles.FENCE, { canvas: c, offsetY });
  }

  _makeSign(props) {
    const { canvas: c, offsetY } = this._objectCanvas(18);
    const ctx = c.getContext('2d');
    const by = offsetY;

    this._diamond(ctx, 0, by, 'rgba(0,0,0,0.1)');

    // Post
    ctx.fillStyle = '#654';
    ctx.fillRect(HW - 1, by + HH - 6, 3, 14);

    // Board
    ctx.fillStyle = '#543';
    ctx.fillRect(HW - 10, by + HH - 16, 20, 12);
    ctx.strokeStyle = '#765';
    ctx.lineWidth = 1;
    ctx.strokeRect(HW - 10, by + HH - 16, 20, 12);

    // Text squiggles
    ctx.fillStyle = props.fg;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(HW - 6, by + HH - 13, 12, 1);
    ctx.fillRect(HW - 4, by + HH - 10, 8, 1);
    ctx.fillRect(HW - 5, by + HH - 7, 10, 1);
    ctx.globalAlpha = 1;

    this.cache.set(Tiles.SIGN, { canvas: c, offsetY });
  }

  _makeGenericObject(tileId, props) {
    const objDepth = Math.floor(D * 0.5);
    const { canvas: c, offsetY } = this._objectCanvas(objDepth);
    const ctx = c.getContext('2d');

    this._diamond(ctx, 0, objDepth, '#1a1a1a');

    const scale = 0.5;
    const sw = ISO_TILE_W * scale;
    const sh = ISO_TILE_H * scale;
    const ox = (ISO_TILE_W - sw) / 2;
    const oy = (ISO_TILE_H - sh) / 2;
    const top = props.fg;
    const left = this._darken(top, 0.3);
    const right = this._darken(top, 0.5);

    ctx.fillStyle = left;
    ctx.beginPath();
    ctx.moveTo(ox, oy + sh / 2);
    ctx.lineTo(ox + sw / 2, oy + sh);
    ctx.lineTo(ox + sw / 2, oy + sh + objDepth);
    ctx.lineTo(ox, oy + sh / 2 + objDepth);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = right;
    ctx.beginPath();
    ctx.moveTo(ox + sw, oy + sh / 2);
    ctx.lineTo(ox + sw / 2, oy + sh);
    ctx.lineTo(ox + sw / 2, oy + sh + objDepth);
    ctx.lineTo(ox + sw, oy + sh / 2 + objDepth);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.moveTo(ox + sw / 2, oy);
    ctx.lineTo(ox + sw, oy + sh / 2);
    ctx.lineTo(ox + sw / 2, oy + sh);
    ctx.lineTo(ox, oy + sh / 2);
    ctx.closePath();
    ctx.fill();

    this.cache.set(tileId, { canvas: c, offsetY });
  }

  // ================================================================
  // DRAWING HELPERS
  // ================================================================

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

  _strokeDiamondFull(ctx) {
    ctx.beginPath();
    ctx.moveTo(HW, 0.5);
    ctx.lineTo(ISO_TILE_W - 0.5, HH);
    ctx.lineTo(HW, ISO_TILE_H - 0.5);
    ctx.lineTo(0.5, HH);
    ctx.closePath();
    ctx.stroke();
  }

  _inDiamond(nx, ny) {
    return Math.abs(nx - 0.5) / 0.5 + Math.abs(ny - 0.5) / 0.5 <= 1;
  }

  _clamp(v) {
    return Math.max(0, Math.min(255, v));
  }

  // ================================================================
  // COLOR UTILITIES
  // ================================================================

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

  _rgb(r, g, b) {
    return `rgb(${this._clamp(Math.floor(r))},${this._clamp(Math.floor(g))},${this._clamp(Math.floor(b))})`;
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
