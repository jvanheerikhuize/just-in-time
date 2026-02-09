/**
 * JUST IN TIME - Renderer
 * Draws the game world on a canvas using tile-based rendering.
 * Each tile is drawn as a colored rectangle with an ASCII character.
 */

import { TILE_SIZE, VIEWPORT_COLS, VIEWPORT_ROWS, TILE_PROPS, Colors, Tiles } from '../core/constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = VIEWPORT_COLS * TILE_SIZE;
    this.canvas.height = VIEWPORT_ROWS * TILE_SIZE;

    // Font for tile characters
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Explored tiles memory (fog of war)
    this.explored = new Map(); // mapId -> Set of "x,y"
  }

  /**
   * Clear the canvas.
   */
  clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw the map tiles visible in the viewport.
   */
  drawMap(mapData, camera, fovSet, mapId) {
    if (!mapData || !mapData.groundGrid) return;

    // Ensure explored set exists for this map
    if (!this.explored.has(mapId)) {
      this.explored.set(mapId, new Set());
    }
    const exploredSet = this.explored.get(mapId);

    // Add currently visible tiles to explored
    if (fovSet) {
      for (const key of fovSet) {
        exploredSet.add(key);
      }
    }

    const startX = Math.floor(camera.x);
    const startY = Math.floor(camera.y);
    const offsetX = (camera.x - startX) * TILE_SIZE;
    const offsetY = (camera.y - startY) * TILE_SIZE;

    for (let vy = -1; vy <= VIEWPORT_ROWS; vy++) {
      for (let vx = -1; vx <= VIEWPORT_COLS; vx++) {
        const tx = startX + vx;
        const ty = startY + vy;

        if (ty < 0 || ty >= mapData.height || tx < 0 || tx >= mapData.width) continue;

        const posKey = `${tx},${ty}`;
        const isVisible = fovSet ? fovSet.has(posKey) : true;
        const isExplored = exploredSet.has(posKey);

        if (!isVisible && !isExplored) continue;

        const screenX = vx * TILE_SIZE - offsetX;
        const screenY = vy * TILE_SIZE - offsetY;

        // Draw ground layer
        const groundTile = mapData.groundGrid[ty][tx];
        this._drawTile(screenX, screenY, groundTile, isVisible);

        // Draw object layer
        if (mapData.objectGrid) {
          const objTile = mapData.objectGrid[ty][tx];
          if (objTile !== Tiles.VOID) {
            this._drawTile(screenX, screenY, objTile, isVisible);
          }
        }
      }
    }
  }

  /**
   * Draw a single tile.
   */
  _drawTile(screenX, screenY, tileId, lit) {
    const props = TILE_PROPS[tileId];
    if (!props || tileId === Tiles.VOID) return;

    const dimFactor = lit ? 1.0 : 0.4;

    // Draw background
    this.ctx.fillStyle = this._dimColor(props.bg, dimFactor);
    this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    // Draw character
    if (props.char && props.char !== ' ') {
      this.ctx.fillStyle = this._dimColor(props.fg, dimFactor);
      this.ctx.font = `${TILE_SIZE - 4}px monospace`;
      this.ctx.fillText(props.char, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 1);
    }
  }

  /**
   * Draw entities (player, NPCs, enemies, items).
   */
  drawEntities(entities, camera, fovSet) {
    for (const entity of entities) {
      if (!entity.position) continue;
      if (!camera.isVisible(entity.position.x, entity.position.y)) continue;

      const posKey = `${entity.position.x},${entity.position.y}`;
      if (fovSet && !fovSet.has(posKey)) continue;

      const screen = camera.tileToScreen(entity.position.x, entity.position.y);
      const offsetX = (camera.x - Math.floor(camera.x)) * TILE_SIZE;
      const offsetY = (camera.y - Math.floor(camera.y)) * TILE_SIZE;
      const sx = screen.x - offsetX;
      const sy = screen.y - offsetY;

      // Draw entity character
      this.ctx.fillStyle = entity.sprite?.bg || 'transparent';
      if (entity.sprite?.bg) {
        this.ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      }

      this.ctx.fillStyle = entity.sprite?.fg || Colors.WHITE;
      this.ctx.font = `bold ${TILE_SIZE - 2}px monospace`;
      this.ctx.fillText(
        entity.sprite?.char || '?',
        sx + TILE_SIZE / 2,
        sy + TILE_SIZE / 2 + 1
      );
    }
  }

  /**
   * Draw the player with a highlight.
   */
  drawPlayer(player, camera) {
    if (!player.position) return;

    const screen = camera.tileToScreen(player.position.x, player.position.y);
    const offsetX = (camera.x - Math.floor(camera.x)) * TILE_SIZE;
    const offsetY = (camera.y - Math.floor(camera.y)) * TILE_SIZE;
    const sx = screen.x - offsetX;
    const sy = screen.y - offsetY;

    // Player highlight/glow
    this.ctx.fillStyle = 'rgba(51, 255, 51, 0.15)';
    this.ctx.fillRect(sx - 2, sy - 2, TILE_SIZE + 4, TILE_SIZE + 4);

    // Player character
    this.ctx.fillStyle = Colors.PLAYER;
    this.ctx.font = `bold ${TILE_SIZE - 2}px monospace`;
    this.ctx.fillText('@', sx + TILE_SIZE / 2, sy + TILE_SIZE / 2 + 1);
  }

  /**
   * Draw a path preview (for click-to-move).
   */
  drawPath(path, camera) {
    if (!path || path.length === 0) return;

    const offsetX = (camera.x - Math.floor(camera.x)) * TILE_SIZE;
    const offsetY = (camera.y - Math.floor(camera.y)) * TILE_SIZE;

    this.ctx.fillStyle = 'rgba(51, 255, 51, 0.2)';
    for (const pos of path) {
      if (!camera.isVisible(pos.x, pos.y)) continue;
      const screen = camera.tileToScreen(pos.x, pos.y);
      this.ctx.fillRect(
        screen.x - offsetX + 4,
        screen.y - offsetY + 4,
        TILE_SIZE - 8,
        TILE_SIZE - 8
      );
    }
  }

  /**
   * Draw hover highlight on a tile.
   */
  drawHover(tileX, tileY, camera, color = 'rgba(255, 255, 255, 0.15)') {
    if (!camera.isVisible(tileX, tileY)) return;

    const screen = camera.tileToScreen(tileX, tileY);
    const offsetX = (camera.x - Math.floor(camera.x)) * TILE_SIZE;
    const offsetY = (camera.y - Math.floor(camera.y)) * TILE_SIZE;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      screen.x - offsetX + 0.5,
      screen.y - offsetY + 0.5,
      TILE_SIZE - 1,
      TILE_SIZE - 1
    );
  }

  /**
   * Draw combat range indicator.
   */
  drawCombatRange(centerX, centerY, range, camera, color = 'rgba(255, 51, 51, 0.1)') {
    const offsetX = (camera.x - Math.floor(camera.x)) * TILE_SIZE;
    const offsetY = (camera.y - Math.floor(camera.y)) * TILE_SIZE;

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > range) continue;
        const tx = centerX + dx;
        const ty = centerY + dy;
        if (!camera.isVisible(tx, ty)) continue;
        const screen = camera.tileToScreen(tx, ty);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(screen.x - offsetX, screen.y - offsetY, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  /**
   * Dim a hex color by a factor (0-1).
   */
  _dimColor(hex, factor) {
    if (factor >= 1) return hex;
    const r = parseInt(hex.slice(1, 2), 16) * 17;
    const g = parseInt(hex.slice(2, 3), 16) * 17;
    const b = parseInt(hex.slice(3, 4), 16) * 17;

    // Handle both 3 and 6 char hex
    let red, green, blue;
    if (hex.length === 4) {
      red = parseInt(hex[1], 16) * 17;
      green = parseInt(hex[2], 16) * 17;
      blue = parseInt(hex[3], 16) * 17;
    } else {
      red = parseInt(hex.slice(1, 3), 16);
      green = parseInt(hex.slice(3, 5), 16);
      blue = parseInt(hex.slice(5, 7), 16);
    }

    red = Math.floor(red * factor);
    green = Math.floor(green * factor);
    blue = Math.floor(blue * factor);

    return `rgb(${red},${green},${blue})`;
  }
}
