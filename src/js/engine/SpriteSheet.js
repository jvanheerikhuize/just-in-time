/**
 * JUST IN TIME - SpriteSheet
 * Generic spritesheet loader with animation frame management.
 * Loads PNG spritesheet images organized as grids of fixed-size cells,
 * or can be built from an existing canvas. Supports named animation
 * sequences with per-frame durations.
 */

import { ANIM_DEFAULT_FRAME_MS } from '../core/constants.js';

export class SpriteSheet {
  /**
   * @param {Object} options
   * @param {number} options.cellWidth - Width of each cell in pixels
   * @param {number} options.cellHeight - Height of each cell in pixels
   */
  constructor({ cellWidth, cellHeight }) {
    this.cellW = cellWidth;
    this.cellH = cellHeight;
    this.image = null;
    this.columns = 0;
    this.rows = 0;
    this.loaded = false;
    this._animations = new Map(); // name → { frames, loop, totalDuration }
    this._cellCache = new Map();  // "col,row" → offscreen canvas
  }

  /**
   * Load a spritesheet from a PNG image URL.
   * @param {string} url
   * @returns {Promise<SpriteSheet>}
   */
  load(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.columns = Math.floor(img.width / this.cellW);
        this.rows = Math.floor(img.height / this.cellH);
        this.loaded = true;
        this._cellCache.clear();
        resolve(this);
      };
      img.onerror = () => reject(new Error(`Failed to load spritesheet: ${url}`));
      img.src = url;
    });
  }

  /**
   * Build a spritesheet from an existing canvas (for procedural fallback).
   * The canvas is treated as a grid of cells.
   * @param {HTMLCanvasElement} canvas
   * @param {number} columns
   */
  fromCanvas(canvas, columns) {
    this.image = canvas;
    this.columns = columns;
    this.rows = Math.floor(canvas.height / this.cellH);
    this.loaded = true;
    this._cellCache.clear();
  }

  /**
   * Define a named animation sequence.
   * @param {string} name - e.g. 'idle_south', 'walk_north'
   * @param {Array<{col: number, row: number, duration?: number}>} frames
   * @param {boolean} [loop=true]
   */
  defineAnimation(name, frames, loop = true) {
    let totalDuration = 0;
    const resolved = frames.map(f => {
      const dur = f.duration || ANIM_DEFAULT_FRAME_MS;
      totalDuration += dur;
      return { col: f.col, row: f.row, duration: dur };
    });
    this._animations.set(name, { frames: resolved, loop, totalDuration });
  }

  /**
   * Get animation definition by name.
   * @param {string} name
   * @returns {Object|null}
   */
  getAnimation(name) {
    return this._animations.get(name) || null;
  }

  /**
   * Get the frame cell coordinates for a given animation at elapsed time.
   * @param {string} animName
   * @param {number} elapsedMs - Time since animation started
   * @returns {{col: number, row: number, done: boolean}|null}
   */
  getFrameAt(animName, elapsedMs) {
    const anim = this._animations.get(animName);
    if (!anim || anim.frames.length === 0) return null;

    if (anim.frames.length === 1) {
      const f = anim.frames[0];
      return { col: f.col, row: f.row, done: true };
    }

    let t = elapsedMs;
    if (anim.loop) {
      t = t % anim.totalDuration;
    } else if (t >= anim.totalDuration) {
      const last = anim.frames[anim.frames.length - 1];
      return { col: last.col, row: last.row, done: true };
    }

    let acc = 0;
    for (const frame of anim.frames) {
      acc += frame.duration;
      if (t < acc) {
        return { col: frame.col, row: frame.row, done: false };
      }
    }

    const last = anim.frames[anim.frames.length - 1];
    return { col: last.col, row: last.row, done: true };
  }

  /**
   * Draw a specific cell directly to a target canvas context.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} col
   * @param {number} row
   * @param {number} dx - Destination x
   * @param {number} dy - Destination y
   */
  drawCell(ctx, col, row, dx, dy) {
    if (!this.image) return;
    const sx = col * this.cellW;
    const sy = row * this.cellH;
    ctx.drawImage(this.image, sx, sy, this.cellW, this.cellH, dx, dy, this.cellW, this.cellH);
  }

  /**
   * Extract a cell into a cached offscreen canvas.
   * @param {number} col
   * @param {number} row
   * @returns {{canvas: HTMLCanvasElement, width: number, height: number}}
   */
  getCell(col, row) {
    const key = `${col},${row}`;
    if (this._cellCache.has(key)) return this._cellCache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = this.cellW;
    canvas.height = this.cellH;

    if (this.image) {
      const ctx = canvas.getContext('2d');
      const sx = col * this.cellW;
      const sy = row * this.cellH;
      ctx.drawImage(this.image, sx, sy, this.cellW, this.cellH, 0, 0, this.cellW, this.cellH);
    }

    const entry = { canvas, width: this.cellW, height: this.cellH };
    this._cellCache.set(key, entry);
    return entry;
  }
}
