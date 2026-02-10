/**
 * JUST IN TIME - Input Handler
 * Manages keyboard and mouse input, dispatches events.
 */

import { eventBus, Events } from '../core/EventBus.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.keysJustPressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseClicked = false;
    this.mouseRightClicked = false;
    this.mouseTileX = 0;
    this.mouseTileY = 0;
    this.enabled = true;

    this._bindEvents();
  }

  _bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (!this.keys.has(key)) {
        this.keysJustPressed.add(key);
      }
      this.keys.add(key);

      // Prevent default for game keys
      const gameKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright',
                        'w', 'a', 's', 'd', 'i', 'c', 'q', 'm', 'e', ' ', 'escape', 'tab'];
      if (gameKeys.includes(key)) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this._updateMouse(e);
    });

    this.canvas.addEventListener('click', (e) => {
      if (!this.enabled) return;
      this._updateMouse(e);
      this.mouseClicked = true;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!this.enabled) return;
      this._updateMouse(e);
      this.mouseRightClicked = true;
    });
  }

  /**
   * Update mouse coordinates, scaling for CSS vs canvas resolution.
   */
  _updateMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.mouseY = (e.clientY - rect.top) * scaleY;
  }

  isKeyDown(key) {
    return this.keys.has(key);
  }

  isKeyJustPressed(key) {
    return this.keysJustPressed.has(key);
  }

  consumeClick() {
    if (this.mouseClicked) {
      this.mouseClicked = false;
      return true;
    }
    return false;
  }

  consumeRightClick() {
    if (this.mouseRightClicked) {
      this.mouseRightClicked = false;
      return true;
    }
    return false;
  }

  /**
   * Get movement direction from keyboard input.
   * Returns {x, y} or null if no movement key pressed.
   */
  getMovementDirection() {
    let dx = 0, dy = 0;

    if (this.isKeyDown('arrowup') || this.isKeyDown('w')) dy = -1;
    if (this.isKeyDown('arrowdown') || this.isKeyDown('s')) dy = 1;
    if (this.isKeyDown('arrowleft') || this.isKeyDown('a')) dx = -1;
    if (this.isKeyDown('arrowright') || this.isKeyDown('d')) dx = 1;

    if (dx === 0 && dy === 0) return null;
    return { x: dx, y: dy };
  }

  /**
   * Clear per-frame state. Call at end of each frame.
   */
  endFrame() {
    this.keysJustPressed.clear();
    this.mouseClicked = false;
    this.mouseRightClicked = false;
  }
}
