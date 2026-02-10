/**
 * JUST IN TIME - Isometric Renderer
 * Draws the game world on a canvas using isometric tile-based rendering.
 * Tiles and entities are depth-sorted using the painter's algorithm.
 * Entity and player sprites are managed by EntitySprites with animation support.
 */

import { ISO_TILE_W, ISO_TILE_H, CANVAS_WIDTH, CANVAS_HEIGHT, Tiles } from '../core/constants.js';
import { TileSprites } from './TileSprites.js';
import { EntitySprites } from './EntitySprites.js';

const HW = ISO_TILE_W / 2;
const HH = ISO_TILE_H / 2;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.tileSprites = new TileSprites();
    this.entitySprites = new EntitySprites();

    // Explored tiles memory (fog of war)
    this.explored = new Map(); // mapId -> Set of "x,y"
  }

  /**
   * Clear the canvas.
   */
  clear() {
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /**
   * Draw the full scene: map tiles, entities, and player, all depth-sorted.
   * @param {Object} mapData
   * @param {Object} camera
   * @param {Set} fovSet
   * @param {string} mapId
   * @param {Array} entities
   * @param {Object} player
   * @param {number} gameTime - Total elapsed game time in ms (for animation)
   */
  drawScene(mapData, camera, fovSet, mapId, entities, player, gameTime) {
    if (!mapData || !mapData.groundGrid) return;

    // Fog of war tracking
    if (!this.explored.has(mapId)) this.explored.set(mapId, new Set());
    const exploredSet = this.explored.get(mapId);
    if (fovSet) {
      for (const key of fovSet) exploredSet.add(key);
    }

    // Build entity lookup by depth (tx + ty)
    const entityByDepth = new Map();
    for (const ent of entities) {
      if (!ent.position || ent.alive === false) continue;
      const d = ent.position.x + ent.position.y;
      if (!entityByDepth.has(d)) entityByDepth.set(d, []);
      entityByDepth.get(d).push(ent);
    }

    const playerDepth = player.position.x + player.position.y;
    const maxDepth = mapData.width + mapData.height - 2;

    // Iterate depth levels back-to-front (painter's algorithm)
    for (let depth = 0; depth <= maxDepth; depth++) {
      // Draw tiles at this depth
      const txMin = Math.max(0, depth - mapData.height + 1);
      const txMax = Math.min(depth, mapData.width - 1);

      for (let tx = txMin; tx <= txMax; tx++) {
        const ty = depth - tx;
        if (!camera.isVisible(tx, ty)) continue;

        const posKey = `${tx},${ty}`;
        const isVis = fovSet ? fovSet.has(posKey) : true;
        const isExp = exploredSet.has(posKey);
        if (!isVis && !isExp) continue;

        const screen = camera.tileToScreen(tx, ty);

        // Ground layer
        const groundTile = mapData.groundGrid[ty][tx];
        this._drawTileSprite(screen.x, screen.y, groundTile, isVis);

        // Object layer
        if (mapData.objectGrid) {
          const objTile = mapData.objectGrid[ty][tx];
          if (objTile !== Tiles.VOID) {
            this._drawTileSprite(screen.x, screen.y, objTile, isVis);
          }
        }
      }

      // Draw entities at this depth (via EntitySprites)
      const ents = entityByDepth.get(depth);
      if (ents) {
        for (const ent of ents) {
          const posKey = `${ent.position.x},${ent.position.y}`;
          const visible = fovSet ? fovSet.has(posKey) : true;
          if (!visible) continue;
          const screen = camera.tileToScreen(ent.position.x, ent.position.y);
          this.entitySprites.drawEntity(this.ctx, screen.x, screen.y, ent, gameTime);
        }
      }

      // Draw player at correct depth (via EntitySprites + ground effects)
      if (depth === playerDepth) {
        const screen = camera.tileToScreen(player.position.x, player.position.y);

        // Ground glow (before sprite for correct depth layering)
        this.ctx.fillStyle = 'rgba(51, 255, 51, 0.08)';
        this._fillDiamond(screen.x, screen.y, HW, HH);

        // Player sprite (with animation)
        this.entitySprites.drawPlayer(this.ctx, screen.x, screen.y, player, gameTime);

        // Facing direction chevron (after sprite)
        this._drawFacingChevron(screen.x, screen.y, player.facing);

        // Tile highlight ring (after sprite)
        this.ctx.strokeStyle = 'rgba(51, 255, 51, 0.25)';
        this.ctx.lineWidth = 1;
        this._strokeDiamond(screen.x, screen.y, HW + 2, HH + 1);
      }
    }
  }

  /**
   * Draw a cached tile sprite at isometric screen position.
   */
  _drawTileSprite(cx, cy, tileId, lit) {
    const sprite = this.tileSprites.get(tileId);
    if (!sprite) return;

    const dx = cx - HW;
    const dy = cy - HH - sprite.offsetY;

    if (!lit) this.ctx.globalAlpha = 0.65;
    this.ctx.drawImage(sprite.canvas, dx, dy);
    if (!lit) this.ctx.globalAlpha = 1;
  }

  /**
   * Draw the player's facing direction chevron on the ground plane.
   */
  _drawFacingChevron(cx, cy, facing) {
    if (!facing) return;

    // Map tile direction to isometric screen offset
    // N(0,-1)→upper-right, S(0,1)→lower-left, W(-1,0)→upper-left, E(1,0)→lower-right
    const isoX = (facing.x - facing.y) * 0.5;
    const isoY = (facing.x + facing.y) * 0.25;
    const dist = 16;
    const ax = cx + isoX * dist;
    const ay = cy + isoY * dist;

    this.ctx.fillStyle = 'rgba(51, 255, 51, 0.5)';
    this.ctx.beginPath();
    const perpX = -isoY;
    const perpY = isoX;
    this.ctx.moveTo(ax + isoX * 5, ay + isoY * 5);
    this.ctx.lineTo(ax - perpX * 3, ay - perpY * 3);
    this.ctx.lineTo(ax + perpX * 3, ay + perpY * 3);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Draw a path preview (for click-to-move).
   */
  drawPath(path, camera) {
    if (!path || path.length === 0) return;

    this.ctx.fillStyle = 'rgba(51, 255, 51, 0.2)';
    for (const pos of path) {
      if (!camera.isVisible(pos.x, pos.y)) continue;
      const s = camera.tileToScreen(pos.x, pos.y);
      this._fillDiamond(s.x, s.y, HW - 6, HH - 3);
    }
  }

  /**
   * Draw hover highlight on a tile.
   */
  drawHover(tileX, tileY, camera, color = 'rgba(255, 255, 255, 0.2)') {
    if (!camera.isVisible(tileX, tileY)) return;

    const s = camera.tileToScreen(tileX, tileY);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this._strokeDiamond(s.x, s.y, HW, HH);
  }

  /**
   * Draw combat range indicator.
   */
  drawCombatRange(centerX, centerY, range, camera, color = 'rgba(255, 51, 51, 0.1)') {
    this.ctx.fillStyle = color;
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > range) continue;
        const tx = centerX + dx;
        const ty = centerY + dy;
        if (!camera.isVisible(tx, ty)) continue;
        const s = camera.tileToScreen(tx, ty);
        this._fillDiamond(s.x, s.y, HW, HH);
      }
    }
  }

  // ---- Diamond drawing helpers (centered on cx, cy) ----

  _fillDiamond(cx, cy, hw, hh) {
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - hh);
    this.ctx.lineTo(cx + hw, cy);
    this.ctx.lineTo(cx, cy + hh);
    this.ctx.lineTo(cx - hw, cy);
    this.ctx.closePath();
    this.ctx.fill();
  }

  _strokeDiamond(cx, cy, hw, hh) {
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - hh);
    this.ctx.lineTo(cx + hw, cy);
    this.ctx.lineTo(cx, cy + hh);
    this.ctx.lineTo(cx - hw, cy);
    this.ctx.closePath();
    this.ctx.stroke();
  }
}
