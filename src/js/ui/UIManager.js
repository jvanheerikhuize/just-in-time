/**
 * JUST IN TIME - UI Manager
 * Coordinates all UI components, handles panel switching, message log.
 */

import { GameState, MsgType, Tiles, ATTRIBUTE_INFO, ATTR_MIN, ATTR_MAX,
         ATTR_DEFAULT, ATTR_BONUS_POINTS, SKILL_FORMULAS,
         BASE_HP, HP_PER_TOUGHNESS, BASE_AP, AP_PER_AGILITY,
         BASE_CARRY, CARRY_PER_STRENGTH,
         REP_HOSTILE, REP_UNFRIENDLY, REP_FRIENDLY, REP_ALLIED } from '../core/constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { ITEM_DEFS } from '../data/items.js';
import { ENTITY_DEFS } from '../data/entities.js';

export class UIManager {
  constructor(game) {
    this.game = game;
    this.activePanel = null;
    this.maxMessages = 100;

    // Cache DOM elements
    this.elements = {
      mainMenu: document.getElementById('main-menu'),
      charCreation: document.getElementById('char-creation'),
      gameScreen: document.getElementById('game-screen'),
      dialogOverlay: document.getElementById('dialog-overlay'),
      combatOverlay: document.getElementById('combat-overlay'),
      messageLog: document.getElementById('message-log-content'),
      statHp: document.getElementById('stat-hp'),
      statAp: document.getElementById('stat-ap'),
      statCaps: document.getElementById('stat-caps'),
      statLevel: document.getElementById('stat-level'),
      statXp: document.getElementById('stat-xp'),
      locationName: document.getElementById('location-name'),
      dialogSpeaker: document.getElementById('dialog-speaker'),
      dialogText: document.getElementById('dialog-text'),
      dialogResponses: document.getElementById('dialog-responses'),
      combatStatus: document.getElementById('combat-status'),
      inventoryPanel: document.getElementById('inventory-panel'),
      characterPanel: document.getElementById('character-panel'),
      questsPanel: document.getElementById('quests-panel'),
      savePanel: document.getElementById('save-panel'),
      carryWeight: document.getElementById('carry-weight'),
      statFacing: document.getElementById('stat-facing'),
    };

    this._bindEvents();
    this._bindButtons();
    this._loadSettings();
  }

  _bindEvents() {
    eventBus.on(Events.UI_MESSAGE, (type, text) => this.addMessage(type, text));
    eventBus.on(Events.UI_UPDATE, () => this.updateHUD());
    eventBus.on(Events.UI_PANEL_OPEN, (panel) => this.openPanel(panel));
    eventBus.on(Events.UI_PANEL_CLOSE, () => this.closePanel());
    eventBus.on(Events.DIALOG_ADVANCE, (node, speaker) => this.showDialog(node, speaker));
    eventBus.on(Events.DIALOG_END, () => this.hideDialog());
    eventBus.on(Events.COMBAT_START, () => this.showCombat());
    eventBus.on(Events.COMBAT_END, () => this.hideCombat());
    eventBus.on(Events.COMBAT_TURN, () => this.updateCombat());
    eventBus.on(Events.MAP_LOADED, (mapId) => this.updateLocation(mapId));
    eventBus.on(Events.GAME_START, () => this.showGameScreen());
    eventBus.on(Events.PLAYER_MOVE, () => { if (this.activePanel === 'map') this._renderMap(); });
    eventBus.on(Events.MAP_LOADED, () => { if (this.activePanel === 'map') this._renderMap(); });
  }

  _bindButtons() {
    // Main menu buttons
    document.getElementById('btn-new-game')?.addEventListener('click', () => {
      this.showScreen('char-creation');
      this.initCharCreation();
    });

    document.getElementById('btn-load-game')?.addEventListener('click', () => {
      if (this.game.saveSystem.hasSave('auto')) {
        this.game.saveSystem.load('auto');
        this.showScreen('game-screen');
      }
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this._loadSettings();
      this.showScreen('settings-screen');
    });

    document.getElementById('btn-settings-back')?.addEventListener('click', () => {
      this._saveSettings();
      this.showScreen('main-menu');
    });

    document.getElementById('setting-fov')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      document.getElementById('setting-fov-val').textContent = val;
      this.game.fovRadius = val;
    });

    document.getElementById('setting-speed')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      document.getElementById('setting-speed-val').textContent = val + 'ms';
      this.game.moveDelay = val;
    });

    // Character creation
    document.getElementById('btn-back-menu')?.addEventListener('click', () => {
      this.showScreen('main-menu');
    });

    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      this.startGame();
    });

    // Bottom bar action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        if (this.activePanel === panel) {
          this.closePanel();
        } else {
          this.openPanel(panel);
        }
      });
    });

    // Panel close buttons
    document.querySelectorAll('.panel-close').forEach(btn => {
      btn.addEventListener('click', () => this.closePanel());
    });

    // Combat buttons
    document.querySelectorAll('.combat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this._handleCombatAction(action);
      });
    });

    // Save/Load buttons
    document.getElementById('btn-save')?.addEventListener('click', () => {
      this.game.saveSystem.save('manual_' + Date.now());
      this.updateSaveSlots();
    });

    document.getElementById('btn-load')?.addEventListener('click', () => {
      const slots = this.game.saveSystem.getSaveSlots();
      if (slots.length > 0) {
        this.game.saveSystem.load(slots[0].slotName);
      }
    });

    document.getElementById('btn-quit')?.addEventListener('click', () => {
      this.game.saveSystem.autoSave();
      this.game.state = GameState.MENU;
      this.showScreen('main-menu');
      this.closePanel();
    });

    // Enable load button if save exists
    if (this.game.saveSystem.hasSave('auto')) {
      document.getElementById('btn-load-game').disabled = false;
    }
  }

  // ---- Screen Management ----

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
  }

  showGameScreen() {
    this.showScreen('game-screen');
    this.updateHUD();
  }

  // ---- Character Creation ----

  initCharCreation() {
    this.creationAttrs = {};
    for (const key of Object.keys(ATTRIBUTE_INFO)) {
      this.creationAttrs[key] = ATTR_DEFAULT;
    }
    this.creationPoints = ATTR_BONUS_POINTS;
    this._renderCharCreation();
  }

  _renderCharCreation() {
    const container = document.getElementById('attribute-sliders');
    container.innerHTML = '';

    for (const [key, info] of Object.entries(ATTRIBUTE_INFO)) {
      const row = document.createElement('div');
      row.className = 'attr-row';
      row.innerHTML = `
        <span class="attr-name">${info.name}</span>
        <button class="attr-btn" data-attr="${key}" data-dir="-1">-</button>
        <span class="attr-value" id="attr-val-${key}">${this.creationAttrs[key]}</span>
        <button class="attr-btn" data-attr="${key}" data-dir="1">+</button>
        <span class="attr-desc">${info.desc}</span>
      `;
      container.appendChild(row);
    }

    container.querySelectorAll('.attr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const attr = btn.dataset.attr;
        const dir = parseInt(btn.dataset.dir);
        this._adjustAttribute(attr, dir);
      });
    });

    this._updateCreationStats();
  }

  _adjustAttribute(attr, dir) {
    const current = this.creationAttrs[attr];
    const newVal = current + dir;

    if (newVal < ATTR_MIN || newVal > ATTR_MAX) return;
    if (dir > 0 && this.creationPoints <= 0) return;
    if (dir < 0 && current <= ATTR_DEFAULT) return;

    this.creationAttrs[attr] = newVal;
    this.creationPoints -= dir;

    document.getElementById(`attr-val-${attr}`).textContent = newVal;
    document.getElementById('points-left').textContent = this.creationPoints;
    this._updateCreationStats();
  }

  _updateCreationStats() {
    const a = this.creationAttrs;

    // Derived stats
    const derived = document.getElementById('derived-stats');
    derived.innerHTML = `
      <div class="derived-stat"><span>Max HP</span><span>${BASE_HP + a.toughness * HP_PER_TOUGHNESS}</span></div>
      <div class="derived-stat"><span>Action Points</span><span>${Math.floor(BASE_AP + a.agility * AP_PER_AGILITY)}</span></div>
      <div class="derived-stat"><span>Carry Weight</span><span>${BASE_CARRY + a.strength * CARRY_PER_STRENGTH}</span></div>
      <div class="derived-stat"><span>Crit Chance</span><span>${a.eyes + a.daring * 2}%</span></div>
      <div class="derived-stat"><span>Dodge</span><span>${a.agility * 2 + a.eyes}%</span></div>
      <div class="derived-stat"><span>Melee Bonus</span><span>+${Math.floor(a.strength / 2)}</span></div>
    `;

    // Skills
    const skills = document.getElementById('skill-list');
    skills.innerHTML = '';
    for (const [skillId, formula] of Object.entries(SKILL_FORMULAS)) {
      const val = formula.attrs.reduce((sum, attr) => sum + (a[attr] || 5), 0) * 5;
      const div = document.createElement('div');
      div.className = 'skill-item';
      div.innerHTML = `<span>${formula.name}</span><span>${val}</span>`;
      skills.appendChild(div);
    }
  }

  startGame() {
    const name = document.getElementById('char-name').value.trim() || 'Wanderer';
    this.game.startNewGame({
      name,
      attributes: { ...this.creationAttrs },
    });
    this.showScreen('game-screen');
  }

  // ---- HUD ----

  updateHUD() {
    if (!this.game.player) return;

    const p = this.game.player;
    this.elements.statHp.textContent = `HP: ${p.hp}/${p.maxHp}`;
    this.elements.statAp.textContent = `AP: ${p.ap}/${p.maxAp}`;
    this.elements.statCaps.textContent = `Caps: ${p.caps}`;
    this.elements.statLevel.textContent = `Lvl: ${p.level}`;
    this.elements.statXp.textContent = `XP: ${p.xp}`;

    // Color HP based on percentage
    const hpPercent = p.hp / p.maxHp;
    if (hpPercent < 0.25) {
      this.elements.statHp.style.color = '#ff3333';
    } else if (hpPercent < 0.5) {
      this.elements.statHp.style.color = '#ffaa00';
    } else {
      this.elements.statHp.style.color = '#ff3333';
    }

    // Compass facing direction
    if (p.facing && this.elements.statFacing) {
      const dir = this._facingToCardinal(p.facing);
      this.elements.statFacing.textContent = `Facing: ${dir}`;
    }
  }

  _facingToCardinal(facing) {
    const { x, y } = facing;
    if (x === 0 && y === -1) return 'N';
    if (x === 0 && y === 1) return 'S';
    if (x === -1 && y === 0) return 'W';
    if (x === 1 && y === 0) return 'E';
    if (x === 1 && y === -1) return 'NE';
    if (x === -1 && y === -1) return 'NW';
    if (x === 1 && y === 1) return 'SE';
    if (x === -1 && y === 1) return 'SW';
    return 'S';
  }

  updateLocation(mapId) {
    const mapData = this.game.mapSystem.getCurrentMap();
    if (mapData) {
      this.elements.locationName.textContent = mapData.name;
    }
  }

  // ---- Message Log ----

  addMessage(type, text) {
    const msgTypeClass = {
      system: MsgType.SYSTEM,
      action: MsgType.ACTION,
      combat: MsgType.COMBAT,
      dialog: MsgType.DIALOG,
      quest: MsgType.QUEST,
      loot: MsgType.LOOT,
      warning: MsgType.WARNING,
      humor: MsgType.HUMOR,
    }[type] || MsgType.SYSTEM;

    const div = document.createElement('div');
    div.className = msgTypeClass;
    div.textContent = `> ${text}`;
    this.elements.messageLog.appendChild(div);

    // Limit messages
    while (this.elements.messageLog.children.length > this.maxMessages) {
      this.elements.messageLog.removeChild(this.elements.messageLog.firstChild);
    }

    // Scroll to bottom
    this.elements.messageLog.parentElement.scrollTop =
      this.elements.messageLog.parentElement.scrollHeight;
  }

  // ---- Dialog UI ----

  showDialog(node, speaker) {
    this.elements.dialogOverlay.classList.remove('hidden');
    this.elements.dialogSpeaker.textContent = speaker?.name || node.speaker || 'Unknown';
    this.elements.dialogText.textContent = node.text;

    // Render responses
    this.elements.dialogResponses.innerHTML = '';
    for (let i = 0; i < (node.availableResponses || []).length; i++) {
      const response = node.availableResponses[i];
      const btn = document.createElement('button');
      btn.className = 'dialog-response' + (response.available ? '' : ' locked');

      let label = response.text;
      if (response.checkLabel) {
        label = `<span class="check-label">${response.checkLabel}</span> ${label}`;
      }
      btn.innerHTML = label;

      if (response.available) {
        btn.addEventListener('click', () => {
          this.game.dialogSystem.selectResponse(i);
        });
      }

      this.elements.dialogResponses.appendChild(btn);
    }
  }

  hideDialog() {
    this.elements.dialogOverlay.classList.add('hidden');
  }

  // ---- Combat UI ----

  showCombat() {
    this.elements.combatOverlay.classList.remove('hidden');
    this.updateCombat();
  }

  hideCombat() {
    this.elements.combatOverlay.classList.add('hidden');
  }

  updateCombat() {
    const combat = this.game.combatSystem;
    if (!combat.inCombat) return;

    let statusHtml = `<div>Your AP: ${this.game.player.ap}/${this.game.player.maxAp}</div>`;
    statusHtml += '<div>Enemies:</div>';
    for (const enemy of combat.enemies) {
      if (enemy.hp > 0) {
        const hpBar = this._makeHpBar(enemy.hp, enemy.maxHp || enemy.hp);
        statusHtml += `<div style="margin-left:10px">${enemy.name} ${hpBar}</div>`;
      }
    }
    this.elements.combatStatus.innerHTML = statusHtml;

    // Enable/disable buttons based on state
    const isPlayerTurn = combat.playerTurn;
    document.querySelectorAll('.combat-btn').forEach(btn => {
      btn.disabled = !isPlayerTurn;
    });
  }

  _makeHpBar(current, max) {
    const pct = Math.max(0, current / max);
    const filled = Math.round(pct * 10);
    const empty = 10 - filled;
    const color = pct > 0.5 ? '#33ff33' : pct > 0.25 ? '#ffaa00' : '#ff3333';
    return `<span style="color:${color}">${'|'.repeat(filled)}${'·'.repeat(empty)}</span> ${current}/${max}`;
  }

  _handleCombatAction(action) {
    const combat = this.game.combatSystem;
    if (!combat.playerTurn) return;

    switch (action) {
      case 'attack':
      case 'shoot': {
        const target = combat.getFirstEnemy();
        if (target) {
          combat.playerAttack(target);
          this.updateCombat();
        }
        break;
      }
      case 'item':
        this.openPanel('inventory');
        break;
      case 'flee':
        combat.playerFlee();
        break;
      case 'end-turn':
        combat.endPlayerTurn();
        break;
    }
  }

  // ---- Side Panels ----

  openPanel(panelName) {
    this.closePanel();

    const panelId = panelName + '-panel';
    const panel = document.getElementById(panelId);
    if (!panel) return;

    panel.classList.remove('hidden');
    this.activePanel = panelName;

    // Populate panel content
    switch (panelName) {
      case 'inventory':
        this._renderInventory();
        break;
      case 'character':
        this._renderCharacter();
        break;
      case 'quests':
        this._renderQuests();
        break;
      case 'map':
        this._renderMap();
        break;
      case 'save':
        this.updateSaveSlots();
        break;
    }

    // Highlight active button
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.panel === panelName);
    });
  }

  closePanel() {
    document.querySelectorAll('.side-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.action-btn').forEach(btn => btn.classList.remove('active'));
    this.activePanel = null;
  }

  _renderInventory() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';

    const items = this.game.inventorySystem.getItems();
    const player = this.game.player;

    // Update equipped display
    document.getElementById('equip-weapon').textContent =
      `Weapon: ${player.equipped.weapon?.name || 'Bare Fists'}`;
    document.getElementById('equip-armor').textContent =
      `Armor: ${player.equipped.armor?.name || 'None'}`;

    // Update carry weight
    const weight = this.game.inventorySystem.getTotalWeight();
    this.elements.carryWeight.textContent = `${weight}/${player.carryWeight} lbs`;

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'item-row';

      const nameClass = item.def.type || '';
      row.innerHTML = `
        <span class="item-name ${nameClass}">${item.def.name}${item.count > 1 ? ` (${item.count})` : ''}</span>
        <div class="item-actions">
          ${item.def.type === 'consumable' ? '<button class="item-action-btn" data-action="use">USE</button>' : ''}
          ${item.def.type === 'weapon' || item.def.type === 'armor' ? '<button class="item-action-btn" data-action="equip">EQP</button>' : ''}
          <button class="item-action-btn" data-action="drop">DROP</button>
        </div>
      `;

      row.querySelectorAll('.item-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'use') this.game.inventorySystem.useItem(item.id);
          if (action === 'equip') this.game.inventorySystem.equipItem(item.id);
          if (action === 'drop') this.game.inventorySystem.removeItem(item.id);
          this._renderInventory();
        });
      });

      // Tooltip on hover
      row.addEventListener('mouseenter', () => {
        this._showTooltip(row, item.def);
      });
      row.addEventListener('mouseleave', () => {
        this._hideTooltip();
      });

      list.appendChild(row);
    }

    if (items.length === 0) {
      list.innerHTML = '<div style="color: var(--color-text-dim); padding: 10px;">Inventory is empty. Like your soul.</div>';
    }
  }

  _renderCharacter() {
    const player = this.game.player;
    const info = document.getElementById('char-info');
    info.innerHTML = `
      <div class="char-stat-row"><span class="label">Name</span><span class="value">${player.name}</span></div>
      <div class="char-stat-row"><span class="label">Level</span><span class="value">${player.level}</span></div>
      <div class="char-stat-row"><span class="label">XP</span><span class="value">${player.xp}</span></div>
      <div class="char-stat-row"><span class="label">HP</span><span class="value">${player.hp}/${player.maxHp}</span></div>
      <div class="char-stat-row"><span class="label">AP</span><span class="value">${player.ap}/${player.maxAp}</span></div>
      <div class="char-stat-row"><span class="label">Caps</span><span class="value">${player.caps}</span></div>
    `;

    const attrs = document.getElementById('char-attributes');
    attrs.innerHTML = '<h3 class="section-label">W.A.S.T.E.D.</h3>';
    for (const [key, aInfo] of Object.entries(ATTRIBUTE_INFO)) {
      const val = player.attributes[key];
      attrs.innerHTML += `
        <div class="char-stat-row">
          <span class="label">${aInfo.name}</span>
          <span class="value">${val}</span>
        </div>
      `;
    }

    const skills = document.getElementById('char-skills');
    skills.innerHTML = '<h3 class="section-label">SKILLS</h3>';
    for (const [skillId, formula] of Object.entries(SKILL_FORMULAS)) {
      const val = player.skills[skillId] || 0;
      skills.innerHTML += `
        <div class="char-stat-row">
          <span class="label">${formula.name}</span>
          <span class="value">${val}</span>
        </div>
      `;
    }

    // Reputation / Relationships
    const repDiv = document.getElementById('char-reputation');
    repDiv.innerHTML = '<h3 class="section-label">RELATIONSHIPS</h3>';
    const repEntries = Object.entries(this.game.reputation).filter(([, v]) => v !== 0);
    if (repEntries.length === 0) {
      repDiv.innerHTML += '<div style="color: var(--color-text-dim); padding: 5px;">No notable relationships yet.</div>';
    } else {
      for (const [npcId, value] of repEntries) {
        const def = ENTITY_DEFS[npcId];
        const name = def ? def.name : npcId;
        const { label, color } = this._getRepTier(value);
        repDiv.innerHTML += `
          <div class="rep-row">
            <span class="rep-name">${name}</span>
            <span class="rep-tier" style="color: ${color};">${label} (${value})</span>
          </div>
        `;
      }
    }
  }

  _getRepTier(value) {
    if (value >= REP_ALLIED + 25) return { label: 'Devoted', color: '#f4f' };
    if (value >= REP_ALLIED) return { label: 'Allied', color: '#3f3' };
    if (value >= REP_FRIENDLY) return { label: 'Friendly', color: '#4af' };
    if (value <= REP_HOSTILE) return { label: 'Hostile', color: '#f44' };
    if (value <= REP_UNFRIENDLY) return { label: 'Unfriendly', color: '#a60' };
    return { label: 'Neutral', color: '#fa0' };
  }

  _renderQuests() {
    const activeContainer = document.getElementById('active-quests');
    const completedContainer = document.getElementById('completed-quests');
    activeContainer.innerHTML = '<h3 class="section-label">ACTIVE</h3>';
    completedContainer.innerHTML = '<h3 class="section-label">COMPLETED</h3>';

    const active = this.game.questSystem.getActiveQuests();
    const completed = this.game.questSystem.getCompletedQuests();

    for (const quest of active) {
      const div = document.createElement('div');
      div.className = 'quest-entry';
      let html = `<div class="quest-title">${quest.def.title}</div>`;
      html += `<div class="quest-desc">${quest.def.description}</div>`;
      for (const obj of quest.objectives) {
        const done = obj.current >= obj.count;
        html += `<div class="quest-objective ${done ? 'complete' : ''}">
          ${done ? '[X]' : '[ ]'} ${obj.description} (${obj.current}/${obj.count})
        </div>`;
      }
      div.innerHTML = html;
      activeContainer.appendChild(div);
    }

    if (active.length === 0) {
      activeContainer.innerHTML += '<div style="color: var(--color-text-dim); padding: 5px;">No active quests. The wasteland awaits.</div>';
    }

    for (const quest of completed) {
      const div = document.createElement('div');
      div.className = 'quest-entry';
      div.innerHTML = `<div class="quest-title" style="text-decoration: line-through;">${quest.def.title}</div>`;
      completedContainer.appendChild(div);
    }
  }

  updateSaveSlots() {
    const container = document.getElementById('save-slots');
    container.innerHTML = '';

    const slots = this.game.saveSystem.getSaveSlots();
    for (const slot of slots) {
      const div = document.createElement('div');
      div.className = 'save-slot';
      div.innerHTML = `
        <span class="save-slot-name">${slot.playerName} Lv${slot.level} - ${slot.location}</span>
        <span class="save-slot-date">${slot.date}</span>
      `;
      div.addEventListener('click', () => {
        this.game.saveSystem.load(slot.slotName);
        this.closePanel();
      });
      container.appendChild(div);
    }

    if (slots.length === 0) {
      container.innerHTML = '<div style="color: var(--color-text-dim); padding: 10px;">No saves found.</div>';
    }
  }

  _showTooltip(element, itemDef) {
    const tooltip = document.getElementById('tooltip');
    let html = `<div class="tooltip-title">${itemDef.name}</div>`;
    html += `<div class="tooltip-desc">${itemDef.description}</div>`;
    if (itemDef.damage) {
      html += `<div>Damage: ${itemDef.damage.min}-${itemDef.damage.max}</div>`;
    }
    if (itemDef.defense) {
      html += `<div>Defense: ${itemDef.defense}</div>`;
    }
    html += `<div>Weight: ${itemDef.weight} lbs | Value: ${itemDef.value} caps</div>`;

    tooltip.innerHTML = html;
    tooltip.classList.remove('hidden');

    const rect = element.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();
    tooltip.style.left = (rect.left - containerRect.left - 260) + 'px';
    tooltip.style.top = (rect.top - containerRect.top) + 'px';
  }

  _hideTooltip() {
    document.getElementById('tooltip').classList.add('hidden');
  }

  // ---- Minimap ----

  _renderMap() {
    const mapData = this.game.mapSystem.getCurrentMap();
    if (!mapData) return;

    const canvas = document.getElementById('minimap-canvas');
    const ctx = canvas.getContext('2d');

    // Scale tiles to fit panel
    const tileSize = Math.min(
      Math.floor(300 / mapData.width),
      Math.floor(300 / mapData.height),
      8
    );

    canvas.width = mapData.width * tileSize;
    canvas.height = mapData.height * tileSize;

    const exploredSet = this.game.renderer.explored.get(this.game.player.mapId) || new Set();
    const fovSet = this.game.fovSet;

    // Draw tiles
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const key = `${x},${y}`;
        const isVis = fovSet && fovSet.has(key);
        const isExp = exploredSet.has(key);
        if (!isVis && !isExp) continue;

        const tile = mapData.groundGrid[y][x];
        ctx.fillStyle = this._getMinimapColor(tile);
        if (!isVis) ctx.globalAlpha = 0.4;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        ctx.globalAlpha = 1;
      }
    }

    // Draw exits
    if (mapData.exits) {
      ctx.fillStyle = '#ff4';
      for (const exit of mapData.exits) {
        ctx.fillRect(exit.x * tileSize, exit.y * tileSize, tileSize, tileSize);
      }
    }

    // Draw entities in FOV
    for (const ent of this.game.entities) {
      if (!ent.position || ent.alive === false) continue;
      const key = `${ent.position.x},${ent.position.y}`;
      if (!fovSet || !fovSet.has(key)) continue;
      ctx.fillStyle = this._getEntityMinimapColor(ent);
      ctx.fillRect(ent.position.x * tileSize, ent.position.y * tileSize, tileSize, tileSize);
    }

    // Draw player
    ctx.fillStyle = '#3f3';
    ctx.fillRect(
      this.game.player.position.x * tileSize,
      this.game.player.position.y * tileSize,
      tileSize, tileSize
    );

    // Map name
    document.getElementById('map-name').textContent = mapData.name;
  }

  _getMinimapColor(tileId) {
    const colors = {
      [Tiles.STONE_FLOOR]: '#555',
      [Tiles.METAL_FLOOR]: '#667',
      [Tiles.DIRT]: '#865',
      [Tiles.GRASS]: '#595',
      [Tiles.SAND]: '#aa8',
      [Tiles.WOOD_FLOOR]: '#875',
      [Tiles.STONE_WALL]: '#333',
      [Tiles.METAL_WALL]: '#445',
      [Tiles.BRICK_WALL]: '#633',
      [Tiles.WOOD_WALL]: '#653',
      [Tiles.DOOR_CLOSED]: '#a70',
      [Tiles.DOOR_OPEN]: '#a70',
      [Tiles.DOOR_LOCKED]: '#a40',
      [Tiles.WATER]: '#35a',
      [Tiles.TOXIC]: '#5a3',
      [Tiles.ROAD]: '#776',
      [Tiles.CRACKED_ROAD]: '#665',
      [Tiles.RUBBLE]: '#654',
      [Tiles.DEBRIS]: '#543',
      [Tiles.FENCE]: '#776',
    };
    return colors[tileId] || '#222';
  }

  _getEntityMinimapColor(ent) {
    if (ent.hostile) return '#f33';
    const rep = this.game.getReputation(ent.id);
    if (rep <= REP_HOSTILE) return '#f33';
    if (rep <= REP_UNFRIENDLY) return '#a60';
    if (rep >= REP_ALLIED) return '#3f3';
    if (rep >= REP_FRIENDLY) return '#4af';
    return '#fa0';
  }

  // ---- Settings Persistence ----

  _loadSettings() {
    const saved = localStorage.getItem('jit_settings');
    if (saved) {
      const s = JSON.parse(saved);
      this.game.fovRadius = s.fovRadius ?? 10;
      this.game.moveDelay = s.moveDelay ?? 120;
    }
    const fovEl = document.getElementById('setting-fov');
    const speedEl = document.getElementById('setting-speed');
    if (fovEl) {
      fovEl.value = this.game.fovRadius;
      document.getElementById('setting-fov-val').textContent = this.game.fovRadius;
    }
    if (speedEl) {
      speedEl.value = this.game.moveDelay;
      document.getElementById('setting-speed-val').textContent = this.game.moveDelay + 'ms';
    }
  }

  _saveSettings() {
    localStorage.setItem('jit_settings', JSON.stringify({
      fovRadius: this.game.fovRadius,
      moveDelay: this.game.moveDelay,
    }));
  }
}
