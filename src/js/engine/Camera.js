/**
 * JUST IN TIME - Camera
 * Manages the viewport offset to follow the player and scroll the map.
 */

import { TILE_SIZE, VIEWPORT_COLS, VIEWPORT_ROWS } from '../core/constants.js';
import { clamp } from '../core/utils.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothing = 0.15;
  }

  /**
   * Center the camera on a tile position, clamped to map bounds.
   */
  follow(tileX, tileY, mapWidth, mapHeight, immediate = false) {
    this.targetX = clamp(
      tileX - Math.floor(VIEWPORT_COLS / 2),
      0,
      Math.max(0, mapWidth - VIEWPORT_COLS)
    );
    this.targetY = clamp(
      tileY - Math.floor(VIEWPORT_ROWS / 2),
      0,
      Math.max(0, mapHeight - VIEWPORT_ROWS)
    );

    if (immediate) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  update() {
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;

    // Snap when very close to prevent sub-pixel jitter
    if (Math.abs(this.x - this.targetX) < 0.01) this.x = this.targetX;
    if (Math.abs(this.y - this.targetY) < 0.01) this.y = this.targetY;
  }

  /**
   * Convert screen pixel coords to tile coords.
   */
  screenToTile(screenX, screenY) {
    return {
      x: Math.floor(screenX / TILE_SIZE + this.x),
      y: Math.floor(screenY / TILE_SIZE + this.y),
    };
  }

  /**
   * Convert tile coords to screen pixel coords.
   */
  tileToScreen(tileX, tileY) {
    return {
      x: (tileX - this.x) * TILE_SIZE,
      y: (tileY - this.y) * TILE_SIZE,
    };
  }

  /**
   * Check if a tile is within the viewport.
   */
  isVisible(tileX, tileY) {
    const sx = tileX - this.x;
    const sy = tileY - this.y;
    return sx >= -1 && sx <= VIEWPORT_COLS && sy >= -1 && sy <= VIEWPORT_ROWS;
  }
}
