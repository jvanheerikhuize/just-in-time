/**
 * JUST IN TIME - Isometric Camera
 * Manages the viewport in isometric world space, following the player.
 */

import { ISO_TILE_W, ISO_TILE_H, CANVAS_WIDTH, CANVAS_HEIGHT } from '../core/constants.js';

const HALF_W = ISO_TILE_W / 2;
const HALF_H = ISO_TILE_H / 2;

export class Camera {
  constructor() {
    // Camera position in world pixel space (center of viewport)
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothing = 0.15;
  }

  /**
   * Center the camera on a tile position.
   */
  follow(tileX, tileY, mapWidth, mapHeight, immediate = false) {
    this.targetX = (tileX - tileY) * HALF_W;
    this.targetY = (tileX + tileY) * HALF_H;

    if (immediate) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  update() {
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;

    if (Math.abs(this.x - this.targetX) < 0.5) this.x = this.targetX;
    if (Math.abs(this.y - this.targetY) < 0.5) this.y = this.targetY;
  }

  /**
   * Convert tile coordinates to screen pixel coordinates (center of tile diamond).
   */
  tileToScreen(tx, ty) {
    return {
      x: (tx - ty) * HALF_W - this.x + CANVAS_WIDTH / 2,
      y: (tx + ty) * HALF_H - this.y + CANVAS_HEIGHT / 2,
    };
  }

  /**
   * Convert screen pixel coordinates to tile coordinates (mouse picking).
   */
  screenToTile(sx, sy) {
    const wx = sx + this.x - CANVAS_WIDTH / 2;
    const wy = sy + this.y - CANVAS_HEIGHT / 2;
    return {
      x: Math.round((wx / HALF_W + wy / HALF_H) / 2),
      y: Math.round((wy / HALF_H - wx / HALF_W) / 2),
    };
  }

  /**
   * Check if a tile is potentially visible on screen.
   */
  isVisible(tx, ty) {
    const screen = this.tileToScreen(tx, ty);
    return (
      screen.x > -ISO_TILE_W &&
      screen.x < CANVAS_WIDTH + ISO_TILE_W &&
      screen.y > -ISO_TILE_H * 3 &&
      screen.y < CANVAS_HEIGHT + ISO_TILE_H * 2
    );
  }
}
