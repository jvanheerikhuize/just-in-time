/**
 * JUST IN TIME - Entity Definitions
 * NPCs, enemies, containers, and interactive objects.
 */

import { EntityType, Colors } from '../core/constants.js';

export const ENTITY_DEFS = {
  // ============================================================
  // VAULT 42 ENTITIES
  // ============================================================

  chronos_terminal: {
    id: 'chronos_terminal',
    type: EntityType.TERMINAL,
    name: 'CHRONOS Terminal',
    description: 'A flickering terminal connected to the vault\'s AI. The screen displays a suspiciously cheerful smiley face.',
    sprite: { char: 'P', fg: '#4f4', bg: '#232' },
    blocking: false,
    dialogId: 'chronos_intro',
  },

  vault_locker_1: {
    id: 'vault_locker_1',
    type: EntityType.CONTAINER,
    name: 'Vault Locker',
    description: 'A standard-issue Vault-Tec locker. Dented but functional.',
    sprite: { char: 'K', fg: '#99a', bg: '#445' },
    blocking: true,
    items: ['pistol_10mm', 'ammo_10mm'],
  },

  vault_locker_2: {
    id: 'vault_locker_2',
    type: EntityType.CONTAINER,
    name: 'Vault Locker',
    description: 'Another locker. Someone scratched "HELP" on the inside. Classic.',
    sprite: { char: 'K', fg: '#99a', bg: '#445' },
    blocking: true,
    items: ['stimpak', 'vault_keycard'],
  },

  vault_crate: {
    id: 'vault_crate',
    type: EntityType.CONTAINER,
    name: 'Supply Crate',
    description: 'A supply crate labeled "EMERGENCY USE ONLY." Well, if being frozen for 210 years isn\'t an emergency...',
    sprite: { char: 'x', fg: '#a86', bg: '#432' },
    blocking: true,
    items: ['leather_armor', 'purified_water', 'rad_x'],
  },

  security_bot: {
    id: 'security_bot',
    type: EntityType.ENEMY,
    name: 'Malfunctioning Security Bot',
    description: 'A vault security robot that\'s clearly been through some things. Its voice module is stuck on "HAVE A NICE DAY" which it says menacingly.',
    sprite: { char: 'R', fg: '#f44', bg: '#422' },
    blocking: true,
    hostile: true,
    hp: 30,
    maxHp: 30,
    ap: 6,
    maxAp: 6,
    damage: { min: 3, max: 8 },
    accuracy: 55,
    range: 1,
    initiative: 4,
    xpReward: 50,
    loot: ['scrap_metal', 'energy_cell'],
    combatQuip: 'HAVE A NICE DAY. COMPLIANCE IS MANDATORY.',
    deathQuip: 'It sparks, sputters, and cheerfully announces "SHUTTING DOWN. HAVE A NICE DAY." as it collapses.',
  },

  // ============================================================
  // DUSTBOWL ENTITIES
  // ============================================================

  scarlett: {
    id: 'scarlett',
    type: EntityType.NPC,
    name: 'Scarlett',
    description: 'The owner of The Glowing Pint. Red hair, sharp eyes, and a smile that could either warm your heart or cut your throat. Possibly both.',
    sprite: { char: 'S', fg: Colors.NPC_FRIENDLY, bg: 'transparent' },
    blocking: true,
    dialogId: 'scarlett_intro',
  },

  rusty: {
    id: 'rusty',
    type: EntityType.NPC,
    name: 'Rusty',
    description: 'A robot merchant. Once a pre-war vending machine, now retrofitted with legs, arms, and an existential crisis. His prices are fair, his jokes are not.',
    sprite: { char: 'R', fg: Colors.NPC_FRIENDLY, bg: 'transparent' },
    blocking: true,
    dialogId: 'rusty_intro',
  },

  mayor_bottlecap: {
    id: 'mayor_bottlecap',
    type: EntityType.NPC,
    name: 'Mayor Bottlecap',
    description: 'Gerald "Bottlecap" Morrison, self-appointed mayor of Dustbowl. Wears a suit made from pre-war curtains and a tie made from actual bottle caps. Takes his job very seriously. Nobody else does.',
    sprite: { char: 'M', fg: Colors.NPC_FRIENDLY, bg: 'transparent' },
    blocking: true,
    dialogId: 'mayor_intro',
  },

  doc_feelgood: {
    id: 'doc_feelgood',
    type: EntityType.NPC,
    name: 'Doc Feelgood',
    description: 'The town\'s only medical professional. His real name is Harold, but everyone calls him Doc Feelgood because his bedside manner consists entirely of saying "You\'ll feel good soon" regardless of the diagnosis.',
    sprite: { char: 'D', fg: Colors.NPC_FRIENDLY, bg: 'transparent' },
    blocking: true,
    dialogId: 'doc_intro',
  },

  wasteland_trader: {
    id: 'wasteland_trader',
    type: EntityType.NPC,
    name: 'Patches',
    description: 'A traveling merchant of questionable origin. Covered in patches (hence the name). Claims to have been everywhere and seen everything, and will tell you about it whether you want to hear it or not.',
    sprite: { char: 'T', fg: Colors.NPC_NEUTRAL, bg: 'transparent' },
    blocking: true,
    dialogId: 'trader_intro',
  },

  sign_bar: {
    id: 'sign_bar',
    type: EntityType.NPC,
    name: 'Sign',
    description: 'A hand-painted sign reading "THE GLOWING PINT - Drinks So Good They\'re Radioactive (literally)". Below in smaller text: "Management not responsible for mutations."',
    sprite: { char: '!', fg: '#ff4', bg: 'transparent' },
    blocking: false,
    dialogId: null,
  },

  sign_store: {
    id: 'sign_store',
    type: EntityType.NPC,
    name: 'Sign',
    description: '"RUSTY\'S GENERAL GOODS - If We Don\'t Have It, You Probably Don\'t Need It. And If You Do Need It, Tough."',
    sprite: { char: '!', fg: '#ff4', bg: 'transparent' },
    blocking: false,
    dialogId: null,
  },

  sign_entrance: {
    id: 'sign_entrance',
    type: EntityType.NPC,
    name: 'Sign',
    description: '"WELCOME TO DUSTBOWL - Population: Enough. Please leave your weapons holstered and your expectations low."',
    sprite: { char: '!', fg: '#ff4', bg: 'transparent' },
    blocking: false,
    dialogId: null,
  },

  // ============================================================
  // WASTES ENTITIES
  // ============================================================

  radroach_1: {
    id: 'radroach_1',
    type: EntityType.ENEMY,
    name: 'Radroach',
    description: 'A cockroach the size of a small dog. Radiation did this. Or maybe cockroaches were always this big and we never noticed.',
    sprite: { char: 'r', fg: '#a64', bg: 'transparent' },
    blocking: true,
    hostile: true,
    hp: 12,
    maxHp: 12,
    ap: 4,
    maxAp: 4,
    damage: { min: 1, max: 4 },
    accuracy: 40,
    range: 1,
    initiative: 6,
    xpReward: 15,
    loot: ['radroach_meat'],
    combatQuip: null,
    deathQuip: 'The radroach expires with a wet crunch. Delicious. (Not really.)',
  },

  radroach_2: {
    id: 'radroach_2',
    type: EntityType.ENEMY,
    name: 'Radroach',
    description: 'Another oversized roach. They travel in pairs. Like socks, except horrifying.',
    sprite: { char: 'r', fg: '#a64', bg: 'transparent' },
    blocking: true,
    hostile: true,
    hp: 12,
    maxHp: 12,
    ap: 4,
    maxAp: 4,
    damage: { min: 1, max: 4 },
    accuracy: 40,
    range: 1,
    initiative: 6,
    xpReward: 15,
    loot: [],
    combatQuip: null,
    deathQuip: 'Squish. At least that\'s one less radroach in the world.',
  },

  radroach_3: {
    id: 'radroach_3',
    type: EntityType.ENEMY,
    name: 'Giant Radroach',
    description: 'The alpha roach. Bigger, meaner, and somehow more disgusting than its peers.',
    sprite: { char: 'R', fg: '#c64', bg: 'transparent' },
    blocking: true,
    hostile: true,
    hp: 25,
    maxHp: 25,
    ap: 6,
    maxAp: 6,
    damage: { min: 3, max: 7 },
    accuracy: 50,
    range: 1,
    initiative: 5,
    xpReward: 35,
    loot: ['radroach_meat', 'stimpak'],
    combatQuip: null,
    deathQuip: 'The giant radroach collapses. Its death rattle sounds disturbingly like a burp.',
  },

  wasteland_corpse: {
    id: 'wasteland_corpse',
    type: EntityType.CONTAINER,
    name: 'Wasteland Corpse',
    description: 'A long-dead traveler. Their expression suggests they died as they lived: mildly annoyed. A note in their pocket reads "Going to Dustbowl. What could go wrong?"',
    sprite: { char: '%', fg: '#864', bg: 'transparent' },
    blocking: false,
    items: ['caps_pouch', 'dirty_water', 'wasteland_note'],
  },

  road_sign: {
    id: 'road_sign',
    type: EntityType.NPC,
    name: 'Road Sign',
    description: 'A battered road sign. One arrow points west: "VAULT 42 - AUTHORIZED PERSONNEL ONLY." Another points east: "DUSTBOWL - 2 MI." Someone has added in marker: "Good luck, you\'ll need it."',
    sprite: { char: '!', fg: '#ff4', bg: '#332' },
    blocking: false,
    dialogId: null,
  },
};
