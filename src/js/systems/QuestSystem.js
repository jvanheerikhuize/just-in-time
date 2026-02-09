/**
 * JUST IN TIME - Quest System
 * Tracks quest progression, objectives, and rewards.
 */

import { QuestState } from '../core/constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { QUEST_DEFS } from '../data/quests.js';

export class QuestSystem {
  constructor(game) {
    this.game = game;
    this.quests = {}; // questId -> { state, currentStage, objectives }
  }

  reset() {
    this.quests = {};
  }

  /**
   * Start a quest by ID.
   */
  startQuest(questId) {
    if (this.quests[questId]) return; // Already started

    const def = QUEST_DEFS[questId];
    if (!def) {
      console.warn(`Quest not found: ${questId}`);
      return;
    }

    const startStage = def.stages[def.startStage];
    this.quests[questId] = {
      state: QuestState.ACTIVE,
      currentStage: def.startStage,
      objectives: startStage.objectives.map(obj => ({
        ...obj,
        current: 0,
      })),
    };

    eventBus.emit(Events.QUEST_START, questId, def);
    eventBus.emit(Events.UI_MESSAGE, 'quest',
      `New Quest: ${def.title} - ${def.description}`);
    eventBus.emit(Events.UI_UPDATE);
  }

  /**
   * Update a quest objective.
   */
  updateObjective(questId, objectiveType, target, count = 1) {
    const quest = this.quests[questId];
    if (!quest || quest.state !== QuestState.ACTIVE) return;

    for (const obj of quest.objectives) {
      if (obj.type === objectiveType && obj.target === target && obj.current < obj.count) {
        obj.current = Math.min(obj.current + count, obj.count);
        eventBus.emit(Events.QUEST_UPDATE, questId, obj);

        if (obj.description) {
          eventBus.emit(Events.UI_MESSAGE, 'quest',
            `Quest Updated: ${obj.description} (${obj.current}/${obj.count})`);
        }

        // Check if all objectives complete
        this._checkStageComplete(questId);
        break;
      }
    }
  }

  /**
   * Advance quest to a specific stage.
   */
  advanceQuest(questId, stageId) {
    const quest = this.quests[questId];
    if (!quest || quest.state !== QuestState.ACTIVE) return;

    const def = QUEST_DEFS[questId];
    if (!def) return;

    const stage = def.stages[stageId];
    if (!stage) return;

    quest.currentStage = stageId;
    quest.objectives = stage.objectives.map(obj => ({
      ...obj,
      current: 0,
    }));

    eventBus.emit(Events.QUEST_UPDATE, questId, quest);
    if (stage.description) {
      eventBus.emit(Events.UI_MESSAGE, 'quest',
        `Quest Updated: ${stage.description}`);
    }
    eventBus.emit(Events.UI_UPDATE);
  }

  /**
   * Complete a quest and grant rewards.
   */
  completeQuest(questId) {
    const quest = this.quests[questId];
    if (!quest || quest.state === QuestState.COMPLETED) return;

    const def = QUEST_DEFS[questId];
    quest.state = QuestState.COMPLETED;

    if (def.rewards) {
      if (def.rewards.xp) {
        this.game.characterSystem.addXP(def.rewards.xp);
      }
      if (def.rewards.caps) {
        this.game.player.caps += def.rewards.caps;
        eventBus.emit(Events.UI_MESSAGE, 'loot', `Received ${def.rewards.caps} caps.`);
      }
      if (def.rewards.items) {
        for (const itemId of def.rewards.items) {
          this.game.inventorySystem.addItem(itemId);
        }
      }
    }

    eventBus.emit(Events.QUEST_COMPLETE, questId, def);
    eventBus.emit(Events.UI_MESSAGE, 'quest',
      `Quest Complete: ${def.title}! ${def.completeMessage || ''}`);
    eventBus.emit(Events.UI_UPDATE);
  }

  /**
   * Fail a quest.
   */
  failQuest(questId) {
    const quest = this.quests[questId];
    if (!quest) return;

    quest.state = QuestState.FAILED;
    const def = QUEST_DEFS[questId];

    eventBus.emit(Events.QUEST_FAIL, questId);
    eventBus.emit(Events.UI_MESSAGE, 'warning',
      `Quest Failed: ${def?.title || questId}`);
    eventBus.emit(Events.UI_UPDATE);
  }

  _checkStageComplete(questId) {
    const quest = this.quests[questId];
    if (!quest) return;

    const allComplete = quest.objectives.every(obj => obj.current >= obj.count);
    if (!allComplete) return;

    const def = QUEST_DEFS[questId];
    if (!def) return;

    const stage = def.stages[quest.currentStage];
    if (!stage) return;

    // Apply stage completion effects
    if (stage.onComplete) {
      for (const effect of stage.onComplete) {
        this._processEffect(effect, questId);
      }
    }

    // Move to next stage or complete
    if (stage.nextStage) {
      this.advanceQuest(questId, stage.nextStage);
    } else {
      this.completeQuest(questId);
    }
  }

  _processEffect(effect, questId) {
    switch (effect.type) {
      case 'setFlag':
        this.game.setFlag(effect.flag, effect.value);
        break;
      case 'giveXP':
        this.game.characterSystem.addXP(effect.amount);
        break;
      case 'startQuest':
        this.startQuest(effect.quest);
        break;
      case 'message':
        eventBus.emit(Events.UI_MESSAGE, effect.msgType || 'quest', effect.text);
        break;
    }
  }

  isQuestActive(questId) {
    return this.quests[questId]?.state === QuestState.ACTIVE;
  }

  isQuestComplete(questId) {
    return this.quests[questId]?.state === QuestState.COMPLETED;
  }

  getActiveQuests() {
    return Object.entries(this.quests)
      .filter(([_, q]) => q.state === QuestState.ACTIVE)
      .map(([id, q]) => ({ id, ...q, def: QUEST_DEFS[id] }));
  }

  getCompletedQuests() {
    return Object.entries(this.quests)
      .filter(([_, q]) => q.state === QuestState.COMPLETED)
      .map(([id, q]) => ({ id, ...q, def: QUEST_DEFS[id] }));
  }

  getState() {
    return JSON.parse(JSON.stringify(this.quests));
  }

  loadState(state) {
    this.quests = state || {};
  }
}
