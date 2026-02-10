/**
 * JUST IN TIME - Isometric Renderer
 * Draws the game world on a canvas using isometric tile-based rendering.
 * Tiles and entities are depth-sorted using the painter's algorithm.
 */

import { ISO_TILE_W, ISO_TILE_H, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_PROPS, Colors, Tiles } from '../core/constants.js';
import { TileSprites } from './TileSprites.js';

const HW = ISO_TILE_W / 2;
const HH = ISO_TILE_H / 2;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.tileSprites = new TileSprites();

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
   */
  drawScene(mapData, camera, fovSet, mapId, entities, player) {
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

      // Draw entities at this depth
      const ents = entityByDepth.get(depth);
      if (ents) {
        for (const ent of ents) {
          const posKey = `${ent.position.x},${ent.position.y}`;
          const visible = fovSet ? fovSet.has(posKey) : true;
          if (!visible) continue; // entities only shown when in FOV
          const screen = camera.tileToScreen(ent.position.x, ent.position.y);
          this._drawEntity(screen.x, screen.y, ent);
        }
      }

      // Draw player at correct depth
      if (depth === playerDepth) {
        const screen = camera.tileToScreen(player.position.x, player.position.y);
        this._drawPlayer(screen.x, screen.y);
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
   * Draw an entity (NPC, enemy, container) as a simple figure.
   */
  _drawEntity(cx, cy, entity) {
    const color = entity.sprite?.fg || Colors.WHITE;

    // Ground shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this._fillDiamond(cx, cy + 2, 10, 5);

    if (entity.type === 'container' || entity.type === 'item_pickup') {
      // Draw as a circle indicator
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 6, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    } else {
      // Draw humanoid figure
      this.ctx.fillStyle = color;
      // Head
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 22, 4, 0, Math.PI * 2);
      this.ctx.fill();
      // Torso
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 5, cy - 17);
      this.ctx.lineTo(cx + 5, cy - 17);
      this.ctx.lineTo(cx + 3, cy - 4);
      this.ctx.lineTo(cx - 3, cy - 4);
      this.ctx.closePath();
      this.ctx.fill();
      // Legs
      this.ctx.fillRect(cx - 3, cy - 4, 2, 5);
      this.ctx.fillRect(cx + 1, cy - 4, 2, 5);
    }
  }

  /**
   * Draw the player character with a green glow.
   */
  _drawPlayer(cx, cy) {
    // Glow on ground
    this.ctx.fillStyle = 'rgba(51, 255, 51, 0.08)';
    this._fillDiamond(cx, cy, HW, HH);

    // Ground shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this._fillDiamond(cx, cy + 2, 12, 6);

    // Player figure (green, slightly larger)
    this.ctx.fillStyle = Colors.PLAYER;
    // Head
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - 24, 5, 0, Math.PI * 2);
    this.ctx.fill();
    // Torso
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 6, cy - 18);
    this.ctx.lineTo(cx + 6, cy - 18);
    this.ctx.lineTo(cx + 4, cy - 4);
    this.ctx.lineTo(cx - 4, cy - 4);
    this.ctx.closePath();
    this.ctx.fill();
    // Legs
    this.ctx.fillRect(cx - 4, cy - 4, 3, 5);
    this.ctx.fillRect(cx + 1, cy - 4, 3, 5);

    // Tile highlight ring
    this.ctx.strokeStyle = 'rgba(51, 255, 51, 0.25)';
    this.ctx.lineWidth = 1;
    this._strokeDiamond(cx, cy, HW + 2, HH + 1);
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
