/**
 * JUST IN TIME - Item Definitions
 * All items in the game: weapons, armor, consumables, quest items, etc.
 */

export const ITEM_DEFS = {
  // ============================================================
  // WEAPONS
  // ============================================================

  pistol_10mm: {
    id: 'pistol_10mm',
    name: '10mm Pistol',
    description: 'A classic sidearm. Pre-war, it was standard issue for security. Post-war, it\'s standard issue for everyone with a pulse and a grudge.',
    type: 'weapon',
    weaponType: 'pistol',
    damage: { min: 5, max: 12 },
    range: 8,
    apCost: 4,
    ammoType: 'ammo_10mm',
    weight: 3,
    value: 120,
  },

  pipe_rifle: {
    id: 'pipe_rifle',
    name: 'Pipe Rifle',
    description: 'Assembled from plumbing parts and optimism. It fires bullets, sometimes in the direction you intended.',
    type: 'weapon',
    weaponType: 'rifle',
    damage: { min: 8, max: 18 },
    range: 12,
    apCost: 5,
    ammoType: 'ammo_308',
    weight: 5,
    value: 80,
  },

  baseball_bat: {
    id: 'baseball_bat',
    name: 'Baseball Bat',
    description: 'America\'s pastime meets America\'s post-apocalypse. Batter up.',
    type: 'weapon',
    weaponType: 'melee',
    damage: { min: 6, max: 14 },
    range: 1,
    apCost: 3,
    weight: 3,
    value: 40,
  },

  combat_knife: {
    id: 'combat_knife',
    name: 'Combat Knife',
    description: 'Sharp, reliable, and doesn\'t need ammunition. The Swiss Army would be proud, if Switzerland still existed.',
    type: 'weapon',
    weaponType: 'melee',
    damage: { min: 4, max: 10 },
    range: 1,
    apCost: 2,
    weight: 1,
    value: 50,
  },

  wrench: {
    id: 'wrench',
    name: 'Pipe Wrench',
    description: 'For fixing pipes or fixing attitudes. Multi-purpose tool.',
    type: 'weapon',
    weaponType: 'melee',
    damage: { min: 3, max: 8 },
    range: 1,
    apCost: 3,
    weight: 3,
    value: 25,
  },

  // ============================================================
  // ARMOR
  // ============================================================

  vault_suit: {
    id: 'vault_suit',
    name: 'Vault 42 Jumpsuit',
    description: 'A blue and gold jumpsuit with "42" on the back. Comfortable, fire-retardant, and makes you look like a member of a very niche bowling team.',
    type: 'armor',
    defense: 2,
    weight: 2,
    value: 20,
  },

  leather_armor: {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Hardened leather plates stitched together. It won\'t stop a bullet, but it\'ll give the bullet something to think about.',
    type: 'armor',
    defense: 5,
    weight: 8,
    value: 100,
  },

  metal_armor: {
    id: 'metal_armor',
    name: 'Scrap Metal Armor',
    description: 'Armor hammered together from car parts and road signs. Heavy, loud, and surprisingly effective. You look ridiculous. You feel invincible.',
    type: 'armor',
    defense: 10,
    weight: 15,
    value: 250,
  },

  // ============================================================
  // CONSUMABLES
  // ============================================================

  stimpak: {
    id: 'stimpak',
    name: 'Stimpak',
    description: 'A pre-war medical injector. Heals wounds through the magic of science and military-grade painkillers. Side effects may include sudden health.',
    type: 'consumable',
    effects: [{ type: 'heal', amount: 30 }],
    useMessage: 'The familiar hiss of pre-war medicine. You feel better immediately.',
    weight: 0.5,
    value: 75,
    stackable: true,
  },

  purified_water: {
    id: 'purified_water',
    name: 'Purified Water',
    description: 'Water that won\'t give you a third arm. A luxury in the wasteland.',
    type: 'consumable',
    effects: [{ type: 'heal', amount: 15 }],
    useMessage: 'Clean water. Tastes like nothing. In the wasteland, that\'s a compliment.',
    weight: 0.5,
    value: 20,
    stackable: true,
  },

  dirty_water: {
    id: 'dirty_water',
    name: 'Dirty Water',
    description: 'Water of questionable origin and undeniable murkiness. Drink at your own risk, which is basically the wasteland\'s motto.',
    type: 'consumable',
    effects: [{ type: 'heal', amount: 5 }, { type: 'damage', amount: 2 }],
    useMessage: 'You drink the water. It tastes like regret with notes of irradiated mud.',
    weight: 0.5,
    value: 5,
    stackable: true,
  },

  rad_x: {
    id: 'rad_x',
    name: 'Rad-X',
    description: 'Anti-radiation medication. Take before exposure to radiation, not after. Reading the instructions would have been helpful 210 years ago.',
    type: 'consumable',
    effects: [{ type: 'buff', attribute: 'toughness', amount: 2 }],
    useMessage: 'You pop a Rad-X. Your cells feel cautiously optimistic.',
    weight: 0.1,
    value: 40,
    stackable: true,
  },

  nuka_cola: {
    id: 'nuka_cola',
    name: 'Nuka-Cola',
    description: 'The pre-war soft drink that survived the apocalypse better than civilization. Still fizzy after 200 years. That should probably concern you.',
    type: 'consumable',
    effects: [{ type: 'heal', amount: 10 }, { type: 'restoreAP', amount: 2 }],
    useMessage: 'Zap! That familiar radioactive tingle. Refreshing!',
    weight: 0.5,
    value: 15,
    stackable: true,
  },

  wasteland_whiskey: {
    id: 'wasteland_whiskey',
    name: 'Wasteland Whiskey',
    description: 'Homemade spirits distilled from... actually, you don\'t want to know. It\'ll put hair on your chest. And possibly your tongue.',
    type: 'consumable',
    effects: [
      { type: 'heal', amount: 5 },
      { type: 'buff', attribute: 'daring', amount: 2 },
      { type: 'buff', attribute: 'eyes', amount: -1 },
    ],
    useMessage: 'You take a swig. Your vision blurs but your confidence soars. The wasteland doesn\'t seem so bad anymore.',
    weight: 0.5,
    value: 25,
    stackable: true,
  },

  radroach_meat: {
    id: 'radroach_meat',
    name: 'Radroach Meat',
    description: 'It\'s exactly what it sounds like. Surprisingly protein-rich. Unsurprisingly disgusting.',
    type: 'consumable',
    effects: [{ type: 'heal', amount: 8 }],
    useMessage: 'You eat the radroach meat. It tastes like chicken. Chicken that died in a nuclear reactor.',
    weight: 0.3,
    value: 5,
    stackable: true,
  },

  // ============================================================
  // AMMO
  // ============================================================

  ammo_10mm: {
    id: 'ammo_10mm',
    name: '10mm Rounds',
    description: 'Standard 10mm ammunition. Each bullet is a tiny investment in someone\'s bad day.',
    type: 'ammo',
    weight: 0.1,
    value: 2,
    stackable: true,
  },

  ammo_308: {
    id: 'ammo_308',
    name: '.308 Rounds',
    description: 'Rifle ammunition. For when you want to make a point from a distance.',
    type: 'ammo',
    weight: 0.1,
    value: 4,
    stackable: true,
  },

  energy_cell: {
    id: 'energy_cell',
    name: 'Energy Cell',
    description: 'A small fusion cell. Powers energy weapons and the occasional desk lamp.',
    type: 'ammo',
    weight: 0.1,
    value: 10,
    stackable: true,
  },

  // ============================================================
  // MISC / CRAFTING
  // ============================================================

  scrap_metal: {
    id: 'scrap_metal',
    name: 'Scrap Metal',
    description: 'Salvaged metal. Useful for repairs, trading, or aggressive interior decorating.',
    type: 'misc',
    weight: 1,
    value: 5,
    stackable: true,
  },

  caps_pouch: {
    id: 'caps_pouch',
    name: 'Pouch of Caps',
    description: 'A small leather pouch containing bottle caps. The wasteland\'s currency, because why not.',
    type: 'misc',
    weight: 0.2,
    value: 25,
    stackable: true,
  },

  // ============================================================
  // QUEST ITEMS
  // ============================================================

  vault_keycard: {
    id: 'vault_keycard',
    name: 'Vault 42 Keycard',
    description: 'An access keycard for Vault 42\'s restricted areas. The photo on it shows someone who looks nothing like you, but that\'s never stopped anyone.',
    type: 'quest',
    weight: 0.1,
    value: 0,
    stackable: false,
  },

  wasteland_note: {
    id: 'wasteland_note',
    name: 'Traveler\'s Note',
    description: '"If you\'re reading this, I didn\'t make it. Head east to Dustbowl. Ask for the Mayor. Tell him Jenkins sent you. P.S. Don\'t eat the radroach meat. P.P.S. Okay, if you have to eat it, cook it first."',
    type: 'quest',
    weight: 0,
    value: 0,
    stackable: false,
  },

  water_chip: {
    id: 'water_chip',
    name: 'Water Purification Chip',
    description: 'A micro-processor designed to regulate water purification systems. Finding one of these in the wasteland is like finding a needle in a haystack, if the haystack was on fire and full of radroaches.',
    type: 'quest',
    weight: 0.5,
    value: 0,
    stackable: false,
  },

  medical_supplies: {
    id: 'medical_supplies',
    name: 'Medical Supplies',
    description: 'A box of pre-war medical supplies. Bandages, antiseptic, and a pamphlet titled "So You\'ve Survived a Nuclear War: Now What?"',
    type: 'quest',
    weight: 2,
    value: 0,
    stackable: false,
  },
};
