/**
 * JUST IN TIME - Quest Definitions
 * All quest data: stages, objectives, and rewards.
 */

export const QUEST_DEFS = {
  // ============================================================
  // MAIN QUEST LINE
  // ============================================================

  wake_up_call: {
    id: 'wake_up_call',
    title: 'Wake-Up Call',
    description: 'You\'ve just been thawed out of cryogenic sleep after 210 years. CHRONOS, the vault AI, wants to chat. Find a terminal and figure out what\'s going on.',
    startStage: 'find_terminal',
    stages: {
      find_terminal: {
        description: 'Find a CHRONOS terminal in the vault.',
        objectives: [
          { type: 'talk', target: 'chronos_terminal', count: 1, description: 'Access CHRONOS terminal' },
        ],
        nextStage: 'get_equipped',
      },
      get_equipped: {
        description: 'CHRONOS says you should gear up before leaving. Search the vault for equipment.',
        objectives: [
          { type: 'fetch', target: 'pistol_10mm', count: 1, description: 'Find a weapon' },
        ],
        nextStage: 'exit_vault',
      },
      exit_vault: {
        description: 'Time to leave Vault 42. Head to the vault exit at the south end.',
        objectives: [
          { type: 'go', target: 'wastes', count: 1, description: 'Exit Vault 42' },
        ],
        onComplete: [
          { type: 'startQuest', quest: 'fresh_air' },
          { type: 'message', msgType: 'quest', text: 'The vault door groans open, flooding the corridor with blinding sunlight. You step outside for the first time in 210 years. The air tastes like freedom and fallout.' },
        ],
      },
    },
    rewards: {
      xp: 100,
      caps: 0,
    },
    completeMessage: 'You\'ve escaped Vault 42. CHRONOS seems disappointed to see you go, but wishes you well via the intercom. Twice. Then a third time.',
  },

  fresh_air: {
    id: 'fresh_air',
    title: 'Fresh Air',
    description: 'The wasteland stretches before you. A road sign points east toward "Dustbowl." Seems as good a destination as any. Survive the wastes and reach the settlement.',
    startStage: 'reach_dustbowl',
    stages: {
      reach_dustbowl: {
        description: 'Follow the road east to reach Dustbowl settlement.',
        objectives: [
          { type: 'go', target: 'dustbowl', count: 1, description: 'Reach Dustbowl' },
        ],
        onComplete: [
          { type: 'startQuest', quest: 'liquid_courage' },
          { type: 'startQuest', quest: 'water_we_gonna_do' },
        ],
      },
    },
    rewards: {
      xp: 75,
      caps: 25,
    },
    completeMessage: 'Welcome to Dustbowl. It\'s not much, but it\'s the first sign of civilization you\'ve seen in 210 years. The bar\'s open. You could use a drink.',
  },

  water_we_gonna_do: {
    id: 'water_we_gonna_do',
    title: 'Water We Gonna Do?',
    description: 'Dustbowl\'s water purifier is failing. Mayor Bottlecap is desperate for someone to find a replacement water chip. Apparently that someone is you.',
    startStage: 'talk_mayor',
    stages: {
      talk_mayor: {
        description: 'Talk to Mayor Bottlecap about the water situation.',
        objectives: [
          { type: 'talk', target: 'mayor_bottlecap', count: 1, description: 'Talk to Mayor Bottlecap' },
        ],
        nextStage: 'find_chip',
      },
      find_chip: {
        description: 'Find a water purification chip. The old pre-war water treatment plant might have one. For now, search the wasteland for leads.',
        objectives: [
          { type: 'fetch', target: 'water_chip', count: 1, description: 'Find a Water Purification Chip' },
        ],
      },
    },
    rewards: {
      xp: 300,
      caps: 200,
      items: ['metal_armor'],
    },
    completeMessage: 'The water purifier hums back to life. Dustbowl\'s future just got a little less dehydrated. Mayor Bottlecap is so grateful he\'s practically vibrating.',
  },

  // ============================================================
  // SIDE QUESTS
  // ============================================================

  liquid_courage: {
    id: 'liquid_courage',
    title: 'Liquid Courage',
    description: 'Visit The Glowing Pint and talk to Scarlett. Every good adventure starts in a bar. It\'s practically a rule.',
    startStage: 'visit_bar',
    stages: {
      visit_bar: {
        description: 'Visit The Glowing Pint and talk to Scarlett.',
        objectives: [
          { type: 'talk', target: 'scarlett', count: 1, description: 'Talk to Scarlett at The Glowing Pint' },
        ],
      },
    },
    rewards: {
      xp: 50,
      caps: 0,
      items: ['wasteland_whiskey'],
    },
    completeMessage: 'Scarlett pours you a drink on the house. "First one\'s free. Everything after that is gonna cost you." She winks. Or maybe something\'s in her eye. Hard to tell.',
  },

  pest_control: {
    id: 'pest_control',
    title: 'Pest Control',
    description: 'Radroaches have infested the wastes around Dustbowl. The town needs someone to thin the herd. Scarlett mentioned it pays in caps and bar tabs.',
    startStage: 'kill_roaches',
    stages: {
      kill_roaches: {
        description: 'Clear out the radroaches in the wastes.',
        objectives: [
          { type: 'kill', target: 'radroach', count: 3, description: 'Kill radroaches (0/3)' },
        ],
      },
    },
    rewards: {
      xp: 100,
      caps: 75,
      items: ['stimpak', 'stimpak'],
    },
    completeMessage: 'Three fewer radroaches in the world. The ecosystem probably won\'t notice, but your reputation in Dustbowl just went up.',
  },

  doctors_orders: {
    id: 'doctors_orders',
    title: 'Doctor\'s Orders',
    description: 'Doc Feelgood needs medical supplies. His current inventory consists of duct tape, hope, and a pamphlet about positive thinking.',
    startStage: 'talk_doc',
    stages: {
      talk_doc: {
        description: 'Talk to Doc Feelgood about his supply situation.',
        objectives: [
          { type: 'talk', target: 'doc_feelgood', count: 1, description: 'Talk to Doc Feelgood' },
        ],
        nextStage: 'find_supplies',
      },
      find_supplies: {
        description: 'Find medical supplies for Doc Feelgood. Check abandoned buildings or trade with merchants.',
        objectives: [
          { type: 'fetch', target: 'medical_supplies', count: 1, description: 'Find medical supplies' },
        ],
        nextStage: 'return_supplies',
      },
      return_supplies: {
        description: 'Return the medical supplies to Doc Feelgood.',
        objectives: [
          { type: 'talk', target: 'doc_feelgood', count: 1, description: 'Give supplies to Doc Feelgood' },
        ],
      },
    },
    rewards: {
      xp: 150,
      caps: 50,
      items: ['stimpak', 'stimpak', 'stimpak', 'rad_x'],
    },
    completeMessage: 'Doc Feelgood is overjoyed. He celebrates by actually reading one of the medical textbooks on his shelf. First time for everything.',
  },
};
