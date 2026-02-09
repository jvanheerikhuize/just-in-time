/**
 * JUST IN TIME - Combat System
 * Turn-based combat with action points, cover, and flanking.
 */

import { GameState, AP_COST_MOVE, AP_COST_MELEE, AP_COST_SHOOT, AP_COST_USE_ITEM,
         COVER_DEFENSE_BONUS, FLANKING_ATTACK_BONUS } from '../core/constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { distance, rng } from '../core/utils.js';

export class CombatSystem {
  constructor(game) {
    this.game = game;
    this.inCombat = false;
    this.enemies = [];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.playerTurn = true;
  }

  /**
   * Initiate combat with one or more enemies.
   */
  startCombat(enemy) {
    if (this.inCombat) {
      // Add enemy to existing combat
      if (!this.enemies.includes(enemy)) {
        this.enemies.push(enemy);
      }
      return;
    }

    this.inCombat = true;
    this.enemies = Array.isArray(enemy) ? [...enemy] : [enemy];

    // Reset player AP
    this.game.player.ap = this.game.player.maxAp;

    // Reset enemy AP
    for (const e of this.enemies) {
      e.ap = e.maxAp || 8;
    }

    // Determine turn order by initiative
    this.turnOrder = this._calculateTurnOrder();
    this.currentTurnIndex = 0;
    this.playerTurn = this.turnOrder[0] === 'player';

    this.game.state = GameState.COMBAT;
    eventBus.emit(Events.COMBAT_START, this.enemies);

    const enemyNames = this.enemies.map(e => e.name).join(', ');
    eventBus.emit(Events.UI_MESSAGE, 'combat',
      `Combat begins! You face: ${enemyNames}`);

    if (this.enemies.length === 1 && this.enemies[0].combatQuip) {
      eventBus.emit(Events.UI_MESSAGE, 'dialog',
        `${this.enemies[0].name}: "${this.enemies[0].combatQuip}"`);
    }

    if (!this.playerTurn) {
      setTimeout(() => this._doEnemyTurn(), 500);
    }

    eventBus.emit(Events.UI_UPDATE);
  }

  /**
   * Player attacks with equipped weapon or fists.
   */
  playerAttack(targetEnemy) {
    if (!this.playerTurn || !this.inCombat) return;

    const player = this.game.player;
    const weapon = player.equipped.weapon;
    const isRanged = weapon && weapon.weaponType !== 'melee';
    const apCost = isRanged ? AP_COST_SHOOT : AP_COST_MELEE;

    if (player.ap < apCost) {
      eventBus.emit(Events.UI_MESSAGE, 'warning', 'Not enough AP for that attack.');
      return;
    }

    // Check range
    const dist = distance(
      player.position.x, player.position.y,
      targetEnemy.position.x, targetEnemy.position.y
    );
    const range = weapon ? (weapon.range || 1) : 1;

    if (dist > range + 0.5) {
      eventBus.emit(Events.UI_MESSAGE, 'warning', 'Target is out of range. Move closer or find a bigger gun.');
      return;
    }

    player.ap -= apCost;

    // Calculate hit chance
    const skill = isRanged ?
      (player.skills.firearms || 50) :
      (player.skills.melee || 50);

    let hitChance = skill - (dist * 5);
    hitChance = Math.min(95, Math.max(5, hitChance));

    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll <= hitChance) {
      // Hit!
      let damage = weapon ?
        rng.int(weapon.damage.min, weapon.damage.max) :
        rng.int(1, 3) + player.meleeDamageBonus;

      // Critical hit check
      const critRoll = Math.floor(Math.random() * 100) + 1;
      let isCrit = false;
      if (critRoll <= player.critChance) {
        damage = Math.floor(damage * player.critMultiplier);
        isCrit = true;
      }

      // Apply damage to enemy
      targetEnemy.hp = Math.max(0, targetEnemy.hp - damage);

      const weaponName = weapon ? weapon.name : 'bare fists';
      const critText = isCrit ? ' CRITICAL HIT!' : '';
      eventBus.emit(Events.UI_MESSAGE, 'combat',
        `You hit ${targetEnemy.name} with ${weaponName} for ${damage} damage!${critText}`);
      eventBus.emit(Events.COMBAT_HIT, { attacker: 'player', target: targetEnemy, damage, isCrit });

      // Check if enemy is dead
      if (targetEnemy.hp <= 0) {
        this._enemyDeath(targetEnemy);
      }
    } else {
      eventBus.emit(Events.UI_MESSAGE, 'combat',
        `You miss ${targetEnemy.name}. ${this._getMissQuip()}`);
      eventBus.emit(Events.COMBAT_MISS, { attacker: 'player', target: targetEnemy });
    }

    eventBus.emit(Events.UI_UPDATE);
  }

  /**
   * Player uses an item in combat.
   */
  playerUseItem(itemId) {
    if (!this.playerTurn || !this.inCombat) return;

    const player = this.game.player;
    if (player.ap < AP_COST_USE_ITEM) {
      eventBus.emit(Events.UI_MESSAGE, 'warning', 'Not enough AP to use an item.');
      return;
    }

    const used = this.game.inventorySystem.useItem(itemId);
    if (used) {
      player.ap -= AP_COST_USE_ITEM;
    }

    eventBus.emit(Events.UI_UPDATE);
  }

  /**
   * Player ends their turn.
   */
  endPlayerTurn() {
    if (!this.playerTurn || !this.inCombat) return;

    this.playerTurn = false;
    this.currentTurnIndex++;
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
    }

    // Process enemy turns
    setTimeout(() => this._doEnemyTurn(), 300);
  }

  /**
   * Player attempts to flee.
   */
  playerFlee() {
    if (!this.playerTurn || !this.inCombat) return;

    const player = this.game.player;
    const fleeChance = 30 + (player.attributes.agility * 5) + (player.attributes.daring * 3);
    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll <= fleeChance) {
      eventBus.emit(Events.UI_MESSAGE, 'action',
        'You bravely run away! Sir Robin would be proud.');
      this.endCombat(false);
    } else {
      eventBus.emit(Events.UI_MESSAGE, 'combat',
        'You try to flee but can\'t escape! Turns out running from your problems doesn\'t work in combat either.');
      this.endPlayerTurn();
    }
  }

  /**
   * Process enemy AI turns.
   */
  _doEnemyTurn() {
    if (!this.inCombat) return;

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;

      enemy.ap = enemy.maxAp || 8;

      // Simple AI: move toward player and attack
      const player = this.game.player;
      const dist = distance(
        enemy.position.x, enemy.position.y,
        player.position.x, player.position.y
      );

      const attackRange = enemy.range || 1;

      if (dist <= attackRange + 0.5) {
        // Attack
        this._enemyAttack(enemy);
      } else {
        // Move toward player
        const dx = Math.sign(player.position.x - enemy.position.x);
        const dy = Math.sign(player.position.y - enemy.position.y);
        enemy.position.x += dx;
        enemy.position.y += dy;

        eventBus.emit(Events.UI_MESSAGE, 'combat',
          `${enemy.name} moves closer.`);

        // Try to attack after moving
        const newDist = distance(
          enemy.position.x, enemy.position.y,
          player.position.x, player.position.y
        );
        if (newDist <= attackRange + 0.5) {
          this._enemyAttack(enemy);
        }
      }
    }

    // Back to player turn
    this.game.player.ap = this.game.player.maxAp;
    this.playerTurn = true;
    eventBus.emit(Events.COMBAT_TURN, 'player');
    eventBus.emit(Events.UI_UPDATE);
  }

  _enemyAttack(enemy) {
    const player = this.game.player;
    const hitChance = (enemy.accuracy || 50) - player.dodgeChance;
    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll <= Math.max(5, hitChance)) {
      const damage = rng.int(enemy.damage?.min || 1, enemy.damage?.max || 5);
      const actualDamage = this.game.characterSystem.damagePlayer(damage);

      eventBus.emit(Events.UI_MESSAGE, 'combat',
        `${enemy.name} hits you for ${actualDamage} damage!`);
      eventBus.emit(Events.COMBAT_HIT, { attacker: enemy, target: 'player', damage: actualDamage });

      if (player.hp <= 0) {
        this.endCombat(false);
        this.game.state = GameState.GAME_OVER;
      }
    } else {
      eventBus.emit(Events.UI_MESSAGE, 'combat',
        `${enemy.name} misses you. ${this._getEnemyMissQuip(enemy)}`);
    }
  }

  _enemyDeath(enemy) {
    enemy.alive = false;
    enemy.hp = 0;

    eventBus.emit(Events.UI_MESSAGE, 'combat',
      `${enemy.name} is defeated! ${enemy.deathQuip || 'They won\'t be bothering anyone else.'}`);
    eventBus.emit(Events.ENTITY_DESTROY, enemy);

    // Drop loot
    if (enemy.loot) {
      for (const itemId of enemy.loot) {
        this.game.inventorySystem.addItem(itemId);
        eventBus.emit(Events.UI_MESSAGE, 'loot', `Found: ${itemId}`);
      }
    }

    // XP reward
    if (enemy.xpReward) {
      this.game.characterSystem.addXP(enemy.xpReward);
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.game.entities = this.game.entities.filter(e => e !== enemy || e.hp > 0);

    // Check if combat is over
    if (this.enemies.length === 0) {
      eventBus.emit(Events.UI_MESSAGE, 'combat', 'All enemies defeated!');
      this.endCombat(true);
    }
  }

  endCombat(victory) {
    this.inCombat = false;
    this.enemies = [];
    this.turnOrder = [];
    this.game.state = GameState.PLAYING;

    // Restore AP
    this.game.player.ap = this.game.player.maxAp;

    eventBus.emit(Events.COMBAT_END, victory);
    eventBus.emit(Events.UI_UPDATE);
  }

  _calculateTurnOrder() {
    const player = this.game.player;
    const combatants = [
      { id: 'player', initiative: player.initiative },
      ...this.enemies.map(e => ({
        id: e.instanceId,
        initiative: e.initiative || 5,
        entity: e,
      })),
    ];

    combatants.sort((a, b) => b.initiative - a.initiative);
    return combatants.map(c => c.id === 'player' ? 'player' : c.entity);
  }

  _getMissQuip() {
    const quips = [
      'The wasteland dust gets in your eyes.',
      'You swing with the confidence of someone who clearly can\'t aim.',
      'Close, but no mutfruit cigar.',
      'Your attack hits nothing but air and regret.',
      'That was embarrassing. Let\'s pretend it didn\'t happen.',
    ];
    return rng.pick(quips);
  }

  _getEnemyMissQuip(enemy) {
    const quips = [
      'Their aim is worse than yours, which is saying something.',
      'You dodge with unexpected grace.',
      'They clearly didn\'t attend wasteland combat school.',
      'Lucky you.',
    ];
    return rng.pick(quips);
  }

  /**
   * Get the first alive enemy (for auto-targeting).
   */
  getFirstEnemy() {
    return this.enemies.find(e => e.hp > 0) || null;
  }
}
