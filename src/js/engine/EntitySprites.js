/**
 * JUST IN TIME - Entity Sprites
 * Manages entity and player sprite rendering with animation support.
 * Builds procedural fallback sprites at init, supports external spritesheet override.
 */

import { Colors } from '../core/constants.js';
import { SPRITE_DEFS, FACING_TO_DIR, ENTITY_TYPE_TO_SPRITE, SPRITE_TYPE_OVERRIDES } from '../data/sprites.js';
import { SpriteSheet } from './SpriteSheet.js';

export class EntitySprites {
  constructor() {
    /** Per-entity animation state: instanceId → AnimState */
    this._animStates = new Map();

    /** Procedural frame cache: "spriteType:color:frameKey" → offscreen canvas */
    this._frameCache = new Map();

    /** External spritesheet overrides: spriteType → { sheet, frameMapping } */
    this._externalSheets = new Map();
  }

  // ---- Public API ----

  /**
   * Set the current animation for an entity.
   * @param {string} instanceId - Unique entity instance identifier
   * @param {string} animName - e.g. 'idle_south', 'walk_north', 'attack'
   * @param {boolean} [force=false] - Force restart even if same animation
   */
  setAnimation(instanceId, animName, force = false) {
    const state = this._animStates.get(instanceId);
    if (!state) return;
    if (!force && state.currentAnim === animName) return;
    state.currentAnim = animName;
    state.animStartTime = -1; // will be set on next getFrame call
  }

  /**
   * Draw an entity sprite at the given screen position.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx - Screen x (tile center)
   * @param {number} cy - Screen y (tile center)
   * @param {Object} entity - Entity object with type, sprite, position, etc.
   * @param {number} gameTime - Total elapsed game time in ms
   */
  drawEntity(ctx, cx, cy, entity, gameTime) {
    const instanceId = entity.instanceId || entity.id;
    const spriteType = this._getSpriteType(entity);
    const color = entity.sprite?.fg || Colors.WHITE;

    // Ensure animation state exists
    if (!this._animStates.has(instanceId)) {
      this._animStates.set(instanceId, {
        spriteType,
        currentAnim: 'idle_south',
        animStartTime: gameTime,
        color,
      });
    }

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Get and draw current frame
    const frame = this._resolveFrame(instanceId, spriteType, color, gameTime);
    if (frame) {
      ctx.drawImage(frame, cx - Math.floor(frame.width / 2), cy - frame.height + 4);
    }
  }

  /**
   * Draw the player sprite at the given screen position.
   * Ground glow, facing chevron, and tile ring are handled by Renderer.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx
   * @param {number} cy
   * @param {Object} player
   * @param {number} gameTime
   */
  drawPlayer(ctx, cx, cy, player, gameTime) {
    const instanceId = 'player';
    const spriteType = 'player';
    const facing = player.facing || { x: 0, y: 1 };
    const dir = FACING_TO_DIR[`${facing.x},${facing.y}`] || 'south';

    // Ensure animation state exists
    if (!this._animStates.has(instanceId)) {
      this._animStates.set(instanceId, {
        spriteType,
        currentAnim: `idle_${dir}`,
        animStartTime: gameTime,
        color: Colors.PLAYER,
      });
    }

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Get and draw current frame
    const frame = this._resolveFrame(instanceId, spriteType, Colors.PLAYER, gameTime);
    if (frame) {
      ctx.drawImage(frame, cx - Math.floor(frame.width / 2), cy - frame.height + 6);
    }
  }

  /**
   * Load an external spritesheet to override procedural sprites for a type.
   * @param {string} spriteType - e.g. 'player', 'humanoid'
   * @param {string} url - PNG spritesheet URL
   * @param {Object} frameMapping - frameKey → {col, row} in the spritesheet
   * @returns {Promise<void>}
   */
  async loadSheet(spriteType, url, frameMapping) {
    const def = SPRITE_DEFS[spriteType];
    if (!def) return;

    const sheet = new SpriteSheet({ cellWidth: def.width, cellHeight: def.height });
    await sheet.load(url);
    this._externalSheets.set(spriteType, { sheet, frameMapping });
  }

  /**
   * Remove animation state for entities no longer on the map.
   * @param {Set<string>} activeIds - IDs of entities still active
   */
  pruneAnimStates(activeIds) {
    for (const key of this._animStates.keys()) {
      if (!activeIds.has(key)) this._animStates.delete(key);
    }
  }

  // ---- Frame Resolution (Private) ----

  /**
   * Resolve the current animation frame canvas for an entity.
   */
  _resolveFrame(instanceId, spriteType, color, gameTime) {
    const state = this._animStates.get(instanceId);
    if (!state) return null;

    if (state.animStartTime < 0) state.animStartTime = gameTime;

    const def = SPRITE_DEFS[spriteType];
    if (!def) return null;

    const animDef = def.animations[state.currentAnim];
    if (!animDef || animDef.frames.length === 0) return null;

    // Pick current frame key based on elapsed time
    const elapsed = gameTime - state.animStartTime;
    const frameKey = this._pickFrameKey(animDef, elapsed);

    // Non-looping animation finished? Return to idle
    if (!animDef.loop && this._isAnimDone(animDef, elapsed)) {
      const dir = state.currentAnim.split('_')[1] || 'south';
      const idleAnim = `idle_${dir}`;
      if (def.animations[idleAnim]) {
        state.currentAnim = idleAnim;
        state.animStartTime = gameTime;
      }
    }

    // Check external spritesheet first
    const ext = this._externalSheets.get(spriteType);
    if (ext && ext.frameMapping[frameKey]) {
      const { col, row } = ext.frameMapping[frameKey];
      return ext.sheet.getCell(col, row).canvas;
    }

    // Procedural fallback
    return this._getProceduralFrame(spriteType, color, frameKey);
  }

  /**
   * Pick the frame key from an animation definition at a given elapsed time.
   */
  _pickFrameKey(animDef, elapsed) {
    const frames = animDef.frames;
    if (frames.length === 1) return frames[0].key;

    let totalDur = 0;
    for (const f of frames) totalDur += (f.dur || 150);

    let t = elapsed;
    if (animDef.loop) {
      t = totalDur > 0 ? (t % totalDur) : 0;
    } else if (t >= totalDur) {
      return frames[frames.length - 1].key;
    }

    let acc = 0;
    for (const f of frames) {
      acc += (f.dur || 150);
      if (t < acc) return f.key;
    }
    return frames[frames.length - 1].key;
  }

  /**
   * Check if a non-looping animation has finished.
   */
  _isAnimDone(animDef, elapsed) {
    let totalDur = 0;
    for (const f of animDef.frames) totalDur += (f.dur || 150);
    return elapsed >= totalDur;
  }

  /**
   * Get sprite type for an entity.
   */
  _getSpriteType(entity) {
    if (SPRITE_TYPE_OVERRIDES[entity.id]) return SPRITE_TYPE_OVERRIDES[entity.id];
    return ENTITY_TYPE_TO_SPRITE[entity.type] || 'humanoid';
  }

  // ---- Procedural Frame Generation (Private) ----

  /**
   * Get or create a procedural frame canvas.
   */
  _getProceduralFrame(spriteType, color, frameKey) {
    const cacheKey = `${spriteType}:${color}:${frameKey}`;
    if (this._frameCache.has(cacheKey)) return this._frameCache.get(cacheKey);

    let canvas;
    switch (spriteType) {
      case 'player':
        canvas = this._makePlayerFrame(frameKey);
        break;
      case 'humanoid':
        canvas = this._makeHumanoidFrame(color, frameKey);
        break;
      case 'container':
        canvas = this._makeContainerFrame(color, frameKey);
        break;
      case 'item_pickup':
        canvas = this._makeItemFrame(color, frameKey);
        break;
      default:
        canvas = this._makeHumanoidFrame(color, frameKey);
    }

    this._frameCache.set(cacheKey, canvas);
    return canvas;
  }

  /**
   * Generate a procedural humanoid figure frame.
   * Extracted from Renderer._drawEntity humanoid branch.
   */
  _makeHumanoidFrame(color, frameKey) {
    const w = 32, h = 40;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const cx = w / 2;
    const cy = h - 4; // feet near bottom

    const dark = this._shade(color, 0.6);
    const mid = this._shade(color, 0.8);

    // Walk frame: shift legs
    const isWalk1 = frameKey.includes('walk') && frameKey.endsWith('_1');
    const isAttack = frameKey.includes('atk');
    const isHurt = frameKey.includes('hurt');

    // Hurt tint: shift color toward red
    if (isHurt) {
      ctx.save();
      ctx.globalAlpha = 0.7;
    }

    // Head (skin tone base + colored hair/hat)
    ctx.fillStyle = '#dca';
    ctx.beginPath();
    ctx.arc(cx, cy - 22, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(cx, cy - 23, 4, Math.PI, 0);
    ctx.fill();

    // Torso
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 17);
    ctx.lineTo(cx + 5, cy - 17);
    ctx.lineTo(cx + 4, cy - 6);
    ctx.lineTo(cx - 4, cy - 6);
    ctx.closePath();
    ctx.fill();
    // Right-side shading
    ctx.fillStyle = dark;
    ctx.globalAlpha = isHurt ? 0.2 : 0.3;
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - 17);
    ctx.lineTo(cx + 5, cy - 17);
    ctx.lineTo(cx + 4, cy - 6);
    ctx.lineTo(cx + 1, cy - 6);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = isHurt ? 0.7 : 1;

    // Arms
    ctx.fillStyle = mid;
    if (isAttack) {
      // Attack: right arm raised
      ctx.fillRect(cx - 7, cy - 16, 2, 8);
      ctx.fillRect(cx + 5, cy - 20, 2, 8);
    } else {
      ctx.fillRect(cx - 7, cy - 16, 2, 8);
      ctx.fillRect(cx + 5, cy - 16, 2, 8);
    }

    // Belt
    ctx.fillStyle = this._shade(color, 0.5);
    ctx.fillRect(cx - 4, cy - 7, 8, 1);

    // Legs (alternate for walk frames)
    ctx.fillStyle = dark;
    if (isWalk1) {
      ctx.fillRect(cx - 4, cy - 6, 2, 6);
      ctx.fillRect(cx + 2, cy - 6, 2, 6);
    } else {
      ctx.fillRect(cx - 3, cy - 6, 2, 6);
      ctx.fillRect(cx + 1, cy - 6, 2, 6);
    }

    if (isHurt) ctx.restore();

    return canvas;
  }

  /**
   * Generate a procedural player figure frame.
   * Extracted from Renderer._drawPlayer body section.
   */
  _makePlayerFrame(frameKey) {
    const w = 32, h = 44;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const cx = w / 2;
    const cy = h - 6; // feet near bottom

    const green = Colors.PLAYER;
    const darkGreen = '#1a8a1a';
    const midGreen = '#28cc28';

    const isWalk1 = frameKey.includes('walk') && frameKey.endsWith('_1');
    const isAttack = frameKey.includes('atk');
    const isHurt = frameKey.includes('hurt');

    if (isHurt) {
      ctx.save();
      ctx.globalAlpha = 0.7;
    }

    // Head (skin tone + green helmet/hat)
    ctx.fillStyle = '#dca';
    ctx.beginPath();
    ctx.arc(cx, cy - 24, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkGreen;
    ctx.beginPath();
    ctx.arc(cx, cy - 25, 5, Math.PI, 0);
    ctx.fill();

    // Torso
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 18);
    ctx.lineTo(cx + 6, cy - 18);
    ctx.lineTo(cx + 5, cy - 5);
    ctx.lineTo(cx - 5, cy - 5);
    ctx.closePath();
    ctx.fill();
    // Right-side shading
    ctx.fillStyle = darkGreen;
    ctx.globalAlpha = isHurt ? 0.25 : 0.35;
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - 18);
    ctx.lineTo(cx + 6, cy - 18);
    ctx.lineTo(cx + 5, cy - 5);
    ctx.lineTo(cx + 1, cy - 5);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = isHurt ? 0.7 : 1;

    // Arms
    ctx.fillStyle = midGreen;
    if (isAttack) {
      ctx.fillRect(cx - 8, cy - 17, 2, 9);
      ctx.fillRect(cx + 6, cy - 21, 2, 9);
    } else {
      ctx.fillRect(cx - 8, cy - 17, 2, 9);
      ctx.fillRect(cx + 6, cy - 17, 2, 9);
    }

    // Belt
    ctx.fillStyle = '#654';
    ctx.fillRect(cx - 5, cy - 6, 10, 2);
    ctx.fillStyle = '#dd8';
    ctx.fillRect(cx - 1, cy - 6, 2, 2);

    // Legs (alternate for walk frames)
    ctx.fillStyle = darkGreen;
    if (isWalk1) {
      ctx.fillRect(cx - 5, cy - 4, 3, 6);
      ctx.fillRect(cx + 2, cy - 4, 3, 6);
    } else {
      ctx.fillRect(cx - 4, cy - 4, 3, 6);
      ctx.fillRect(cx + 1, cy - 4, 3, 6);
    }

    // Boots
    ctx.fillStyle = '#543';
    if (isWalk1) {
      ctx.fillRect(cx - 5, cy + 1, 3, 2);
      ctx.fillRect(cx + 2, cy + 1, 3, 2);
    } else {
      ctx.fillRect(cx - 4, cy + 1, 3, 2);
      ctx.fillRect(cx + 1, cy + 1, 3, 2);
    }

    if (isHurt) ctx.restore();

    return canvas;
  }

  /**
   * Generate a procedural container frame.
   */
  _makeContainerFrame(color, frameKey) {
    const w = 24, h = 20;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const cx = w / 2;
    const cy = h - 4;

    const isOpen = frameKey.includes('open');

    // Body
    ctx.fillStyle = this._shade(color, 0.8);
    ctx.fillRect(cx - 7, cy - 8, 14, 10);
    // Lid
    ctx.fillStyle = color;
    if (isOpen) {
      // Lid angled open
      ctx.fillRect(cx - 8, cy - 12, 16, 3);
    } else {
      ctx.fillRect(cx - 8, cy - 10, 16, 3);
    }
    // Clasp
    ctx.fillStyle = '#dd8';
    ctx.fillRect(cx - 1, cy - 6, 2, 2);

    return canvas;
  }

  /**
   * Generate a procedural item pickup frame (glowing orb).
   */
  _makeItemFrame(color, frameKey) {
    const w = 20, h = 18;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const cx = w / 2;
    const cy = h - 6;

    // Glow pulse: vary alpha based on frame
    let alpha = 0.6;
    if (frameKey === 'glow_1') alpha = 0.8;
    else if (frameKey === 'glow_2') alpha = 0.5;

    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Specular highlight
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    return canvas;
  }

  // ---- Color helper ----

  _shade(hex, factor) {
    const parse = hex.length === 4
      ? [parseInt(hex[1], 16) * 17, parseInt(hex[2], 16) * 17, parseInt(hex[3], 16) * 17]
      : [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    return `rgb(${Math.floor(parse[0] * factor)},${Math.floor(parse[1] * factor)},${Math.floor(parse[2] * factor)})`;
  }
}
