/**
 * JUST IN TIME - Dialog System
 * Branching conversation trees with skill checks and consequences.
 */

import { GameState } from '../core/constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { ALL_DIALOGS } from '../data/dialogs.js';

export class DialogSystem {
  constructor(game) {
    this.game = game;
    this.activeDialog = null;
    this.currentNode = null;
    this.speaker = null;
  }

  /**
   * Start a dialog by ID.
   */
  startDialog(dialogId, speaker = null) {
    const dialog = ALL_DIALOGS[dialogId];
    if (!dialog) {
      console.warn(`Dialog not found: ${dialogId}`);
      return;
    }

    this.activeDialog = dialog;
    this.speaker = speaker;
    this.game.state = GameState.DIALOG;

    // Find the start node
    this.goToNode(dialog.startNode);

    eventBus.emit(Events.DIALOG_START, dialogId, speaker);
  }

  /**
   * Navigate to a dialog node.
   */
  goToNode(nodeId) {
    if (!this.activeDialog) return;

    const node = this.activeDialog.nodes[nodeId];
    if (!node) {
      console.warn(`Dialog node not found: ${nodeId}`);
      this.endDialog();
      return;
    }

    this.currentNode = { ...node, id: nodeId };

    // Apply any effects the node has on display
    if (node.onEnter) {
      this._processEffects(node.onEnter);
    }

    // Filter responses based on conditions
    const availableResponses = (node.responses || []).map(response => {
      const available = this._checkConditions(response.conditions);
      const checkLabel = this._getCheckLabel(response);
      return { ...response, available, checkLabel };
    });

    this.currentNode.availableResponses = availableResponses;

    eventBus.emit(Events.DIALOG_ADVANCE, this.currentNode, this.speaker);
  }

  /**
   * Select a dialog response.
   */
  selectResponse(responseIndex) {
    if (!this.currentNode || !this.currentNode.availableResponses) return;

    const response = this.currentNode.availableResponses[responseIndex];
    if (!response || !response.available) return;

    // Process skill check if present
    if (response.skillCheck) {
      const result = this.game.characterSystem.skillCheck(
        response.skillCheck.skill,
        response.skillCheck.difficulty
      );

      if (result.success) {
        eventBus.emit(Events.UI_MESSAGE, 'action',
          `[${result.skillName} check passed: ${result.roll}/${result.target}]`);

        if (response.skillCheck.successNode) {
          this._processEffects(response.effects);
          this.goToNode(response.skillCheck.successNode);
          return;
        }
      } else {
        eventBus.emit(Events.UI_MESSAGE, 'warning',
          `[${result.skillName} check failed: ${result.roll}/${result.target}]`);

        if (response.skillCheck.failNode) {
          this.goToNode(response.skillCheck.failNode);
          return;
        }
      }
    }

    // Process response effects
    if (response.effects) {
      this._processEffects(response.effects);
    }

    // Navigate to next node
    if (response.nextNode) {
      this.goToNode(response.nextNode);
    } else {
      this.endDialog();
    }

    eventBus.emit(Events.DIALOG_CHOICE, response);
  }

  /**
   * End the current dialog.
   */
  endDialog() {
    const wasDialog = this.activeDialog;
    this.activeDialog = null;
    this.currentNode = null;
    this.speaker = null;
    this.game.state = GameState.PLAYING;

    eventBus.emit(Events.DIALOG_END, wasDialog);
    eventBus.emit(Events.UI_UPDATE);
  }

  /**
   * Check if conditions are met for a dialog option.
   */
  _checkConditions(conditions) {
    if (!conditions || conditions.length === 0) return true;

    for (const cond of conditions) {
      switch (cond.type) {
        case 'flag':
          if (cond.value !== undefined) {
            if (this.game.flags[cond.flag] !== cond.value) return false;
          } else {
            if (!this.game.flags[cond.flag]) return false;
          }
          break;

        case 'noFlag':
          if (this.game.flags[cond.flag]) return false;
          break;

        case 'attribute':
          if ((this.game.player.attributes[cond.attribute] || 0) < cond.min) return false;
          break;

        case 'skill':
          if ((this.game.player.skills[cond.skill] || 0) < cond.min) return false;
          break;

        case 'item':
          if (!this.game.inventorySystem.hasItem(cond.item)) return false;
          break;

        case 'quest':
          if (!this.game.questSystem.isQuestActive(cond.quest)) return false;
          break;

        case 'questComplete':
          if (!this.game.questSystem.isQuestComplete(cond.quest)) return false;
          break;

        case 'caps':
          if (this.game.player.caps < cond.min) return false;
          break;

        case 'reputation':
          if (this.game.getReputation(cond.npcId) < cond.min) return false;
          break;

        case 'reputationMax':
          if (this.game.getReputation(cond.npcId) > cond.max) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Get a label for skill/attribute checks on a response.
   */
  _getCheckLabel(response) {
    if (response.skillCheck) {
      const skillName = response.skillCheck.skill;
      const diff = response.skillCheck.difficulty;
      return `[${skillName} ${diff}]`;
    }
    if (response.conditions) {
      for (const cond of response.conditions) {
        if (cond.type === 'attribute') {
          return `[${cond.attribute} ${cond.min}+]`;
        }
        if (cond.type === 'skill') {
          return `[${cond.skill} ${cond.min}+]`;
        }
      }
    }
    return null;
  }

  /**
   * Process dialog effects (set flags, give items, start quests, etc.).
   */
  _processEffects(effects) {
    if (!effects) return;

    for (const effect of effects) {
      switch (effect.type) {
        case 'setFlag':
          this.game.setFlag(effect.flag, effect.value !== undefined ? effect.value : true);
          break;

        case 'giveItem':
          this.game.inventorySystem.addItem(effect.item, effect.count || 1);
          eventBus.emit(Events.UI_MESSAGE, 'loot', `Received: ${effect.item}`);
          break;

        case 'removeItem':
          this.game.inventorySystem.removeItem(effect.item, effect.count || 1);
          break;

        case 'giveCaps':
          this.game.player.caps += effect.amount;
          eventBus.emit(Events.UI_MESSAGE, 'loot', `Received ${effect.amount} caps.`);
          break;

        case 'takeCaps':
          this.game.player.caps = Math.max(0, this.game.player.caps - effect.amount);
          eventBus.emit(Events.UI_MESSAGE, 'system', `Lost ${effect.amount} caps.`);
          break;

        case 'giveXP':
          this.game.characterSystem.addXP(effect.amount);
          break;

        case 'startQuest':
          this.game.questSystem.startQuest(effect.quest);
          break;

        case 'advanceQuest':
          this.game.questSystem.advanceQuest(effect.quest, effect.stage);
          break;

        case 'completeQuest':
          this.game.questSystem.completeQuest(effect.quest);
          break;

        case 'heal':
          this.game.characterSystem.healPlayer(effect.amount);
          break;

        case 'damage':
          this.game.characterSystem.damagePlayer(effect.amount);
          break;

        case 'message':
          eventBus.emit(Events.UI_MESSAGE, effect.msgType || 'system', effect.text);
          break;

        case 'startCombat':
          // Find entity by ID
          const enemy = this.game.entities.find(e => e.id === effect.enemyId);
          if (enemy) {
            this.endDialog();
            this.game.combatSystem.startCombat(enemy);
          }
          break;

        case 'teleport':
          if (effect.map) {
            eventBus.emit(Events.MAP_CHANGE, effect.map, effect.spawn || 'start');
          }
          break;

        case 'changeReputation':
          this.game.changeReputation(effect.npcId, effect.amount);
          break;

        case 'setReputation':
          this.game.setReputation(effect.npcId, effect.value);
          break;
      }
    }

    eventBus.emit(Events.UI_UPDATE);
  }
}
