/**
 * JUST IN TIME - Character System
 * Manages W.A.S.T.E.D. attributes, skills, leveling, and derived stats.
 */

import {
  SKILL_FORMULAS, BASE_HP, HP_PER_TOUGHNESS, BASE_AP, AP_PER_AGILITY,
  BASE_CARRY, CARRY_PER_STRENGTH, XP_PER_LEVEL, MAX_LEVEL,
  SKILL_POINTS_PER_LEVEL_BASE, CRIT_MULTIPLIER_BASE
} from '../core/constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class CharacterSystem {
  constructor(game) {
    this.game = game;
  }

  /**
   * Recalculate all derived stats and skills from attributes.
   */
  recalculate(player) {
    const a = player.attributes;

    // Derived stats
    player.maxHp = BASE_HP + (a.toughness * HP_PER_TOUGHNESS);
    player.maxAp = Math.floor(BASE_AP + (a.agility * AP_PER_AGILITY));
    player.carryWeight = BASE_CARRY + (a.strength * CARRY_PER_STRENGTH);
    player.critChance = a.eyes + (a.daring * 2);
    player.critMultiplier = CRIT_MULTIPLIER_BASE + (a.daring * 0.1);
    player.dodgeChance = a.agility * 2 + a.eyes;
    player.meleeDamageBonus = Math.floor(a.strength / 2);
    player.initiative = a.agility + a.eyes;

    // Skills: base = (attr1 + attr2) * 5
    player.skills = {};
    for (const [skillId, formula] of Object.entries(SKILL_FORMULAS)) {
      const attrSum = formula.attrs.reduce((sum, attr) => sum + (a[attr] || 5), 0);
      player.skills[skillId] = attrSum * 5;
    }

    // Add skill points from leveling (simplified: 2 points per skill per level)
    if (player.skillPoints) {
      for (const [skill, bonus] of Object.entries(player.skillPoints)) {
        if (player.skills[skill] !== undefined) {
          player.skills[skill] += bonus;
        }
      }
    }
  }

  /**
   * Add XP and check for level up.
   */
  addXP(amount) {
    const player = this.game.player;
    player.xp += amount;
    eventBus.emit(Events.UI_MESSAGE, 'system', `Gained ${amount} XP.`);

    while (player.level < MAX_LEVEL &&
           player.xp >= XP_PER_LEVEL[player.level]) {
      this.levelUp();
    }

    eventBus.emit(Events.UI_UPDATE);
  }

  /**
   * Level up the player.
   */
  levelUp() {
    const player = this.game.player;
    player.level++;

    // Skill points to distribute
    const skillPointsGained = SKILL_POINTS_PER_LEVEL_BASE + Math.floor(player.attributes.wits / 2);

    if (!player.pendingSkillPoints) player.pendingSkillPoints = 0;
    player.pendingSkillPoints += skillPointsGained;

    // Recalculate derived stats
    this.recalculate(player);

    // Heal to full on level up
    player.hp = player.maxHp;
    player.ap = player.maxAp;

    eventBus.emit(Events.PLAYER_LEVEL_UP, player.level);
    eventBus.emit(Events.UI_MESSAGE, 'quest',
      `LEVEL UP! You are now level ${player.level}. You gained ${skillPointsGained} skill points. ` +
      'The wasteland trembles. Or maybe that\'s just indigestion.');
  }

  /**
   * Apply damage to player.
   */
  damagePlayer(amount) {
    const player = this.game.player;
    const actualDamage = Math.max(1, amount - this.getArmorReduction());
    player.hp = Math.max(0, player.hp - actualDamage);

    eventBus.emit(Events.PLAYER_DAMAGE, actualDamage);

    if (player.hp <= 0) {
      eventBus.emit(Events.PLAYER_DEATH);
      eventBus.emit(Events.UI_MESSAGE, 'combat',
        'You have died. The wasteland claims another. On the bright side, at least the rent is free now.');
    }

    eventBus.emit(Events.UI_UPDATE);
    return actualDamage;
  }

  /**
   * Heal the player.
   */
  healPlayer(amount) {
    const player = this.game.player;
    const healed = Math.min(amount, player.maxHp - player.hp);
    player.hp += healed;
    eventBus.emit(Events.PLAYER_HEAL, healed);
    eventBus.emit(Events.UI_UPDATE);
    return healed;
  }

  /**
   * Get armor damage reduction.
   */
  getArmorReduction() {
    const armor = this.game.player.equipped.armor;
    return armor ? (armor.defense || 0) : 0;
  }

  /**
   * Perform a skill check.
   * Returns { success, roll, target, margin }
   */
  skillCheck(skillId, difficulty) {
    const player = this.game.player;
    const skillValue = player.skills[skillId] || 0;
    const roll = Math.floor(Math.random() * 100) + 1;
    const target = Math.min(95, Math.max(5, skillValue - difficulty));

    return {
      success: roll <= target,
      roll,
      target,
      margin: target - roll,
      skillName: SKILL_FORMULAS[skillId]?.name || skillId,
    };
  }

  /**
   * Check if an attribute meets a threshold.
   */
  attributeCheck(attrId, threshold) {
    const value = this.game.player.attributes[attrId] || 0;
    return value >= threshold;
  }
}
