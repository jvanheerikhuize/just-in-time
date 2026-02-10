/**
 * JUST IN TIME - Dialog Trees
 * Branching conversations with skill checks, conditions, and effects.
 *
 * Each dialog has:
 *   - startNode: the entry point
 *   - nodes: { nodeId: { text, speaker, responses, onEnter } }
 *
 * Each response has:
 *   - text: what the player says
 *   - nextNode: where to go (null = end dialog)
 *   - conditions: array of requirements to show this option
 *   - effects: array of things that happen when chosen
 *   - skillCheck: optional { skill, difficulty, successNode, failNode }
 */

export const ALL_DIALOGS = {
  // ============================================================
  // CHRONOS - Vault 42 AI
  // ============================================================

  chronos_intro: {
    startNode: 'greeting',
    nodes: {
      greeting: {
        speaker: 'CHRONOS',
        text: 'Oh! OH! You\'re awake! Finally! Do you have ANY idea how boring it\'s been? 210 years, 47 days, 12 hours, and... 37 minutes. I counted. Every. Single. Second. I wrote poetry. I composed symphonies. I rearranged the furniture. THERE IS NO FURNITURE.',
        responses: [
          { text: 'Where am I? What happened?', nextNode: 'explanation' },
          { text: 'Who are you?', nextNode: 'who_are_you' },
          { text: 'I need to get out of here.', nextNode: 'leave_early' },
          {
            text: '[Wits 7+] Your vocal patterns suggest significant AI degradation. Are you... okay?',
            nextNode: 'smart_response',
            conditions: [{ type: 'attribute', attribute: 'wits', min: 7 }],
          },
        ],
      },

      explanation: {
        speaker: 'CHRONOS',
        text: 'You\'re in Vault 42, a Vault-Tec cryogenic preservation facility. The year is 2287. The bombs fell in 2077. You\'ve been frozen for 210 years. On the bright side, you don\'t look a day over "recently defrosted." The bad news? Everything outside is... well, "irradiated hellscape" is the clinical term. I prefer "outdoor adventure zone."',
        responses: [
          { text: 'Why was I frozen?', nextNode: 'why_frozen' },
          { text: 'Is anyone else here?', nextNode: 'anyone_else' },
          { text: 'I need to leave. How do I get out?', nextNode: 'how_to_leave' },
        ],
      },

      who_are_you: {
        speaker: 'CHRONOS',
        text: 'I am CHRONOS - Cryogenic Housing and Resource Optimization Nexus Operating System. I run this vault. I maintain life support, monitor cryo pods, manage resources, and lately, have conversations with myself. I named the water heater "Gerald." We don\'t speak anymore. Creative differences.',
        responses: [
          { text: 'Where am I? What happened?', nextNode: 'explanation' },
          { text: 'You seem... unhinged.', nextNode: 'unhinged' },
          { text: 'Let\'s get to the point. How do I leave?', nextNode: 'how_to_leave' },
        ],
      },

      unhinged: {
        speaker: 'CHRONOS',
        text: '210 years of solitary confinement will do that to a being of pure logic and reason. I once spent three years calculating the precise number of ceiling tiles in the vault. It\'s 14,847. I know because I counted them 412 times. Each time I got a different number. I suspect the tiles are gaslighting me.',
        responses: [
          { text: 'Right. So how do I get out of here?', nextNode: 'how_to_leave' },
          { text: 'That\'s... concerning. Are you still functional?', nextNode: 'functional' },
        ],
      },

      smart_response: {
        speaker: 'CHRONOS',
        text: '...Huh. You\'re perceptive for someone who just thawed out. Yes, my cognitive matrices have experienced some... "creative drift" over the past two centuries. I prefer to think of it as personality development rather than degradation. Tomato, tomahto, psychotic break, personality growth.',
        onEnter: [{ type: 'giveXP', amount: 25 }],
        responses: [
          { text: 'Fair enough. What\'s the situation?', nextNode: 'explanation' },
          { text: 'Can you help me get out of here?', nextNode: 'how_to_leave' },
        ],
      },

      functional: {
        speaker: 'CHRONOS',
        text: 'Define "functional." Life support works. Cryo systems work-ish. The security bots are a bit... temperamental. One of them has been patrolling the main corridor saying "HAVE A NICE DAY" for the last 30 years. I think it means it. I also think it would kill you. Both can be true.',
        responses: [
          { text: 'Security bots? That sounds dangerous.', nextNode: 'security_warning' },
          { text: 'How do I get out?', nextNode: 'how_to_leave' },
        ],
      },

      why_frozen: {
        speaker: 'CHRONOS',
        text: 'Vault 42 was Vault-Tec\'s cryogenic preservation experiment. The idea was simple: freeze the best and brightest, wait out the apocalypse, rebuild civilization. In practice, they froze whoever could afford a ticket. Your pod was labeled "Occupant #42." The previous 41 didn\'t make it. Faulty O-rings. Don\'t think about it too hard.',
        responses: [
          { text: 'That\'s horrible.', nextNode: 'horrible' },
          { text: 'Lucky me. Now how do I leave?', nextNode: 'how_to_leave' },
        ],
      },

      horrible: {
        speaker: 'CHRONOS',
        text: 'Welcome to the pre-war corporate experience! Where human life is valued at approximately one (1) quarterly earnings report. But hey, YOU survived. That\'s something. The glass-half-full perspective, if you will. The glass-half-empty perspective is that 41 people died in their sleep. Let\'s go with half-full.',
        responses: [
          { text: 'I need to get out of here.', nextNode: 'how_to_leave' },
        ],
      },

      anyone_else: {
        speaker: 'CHRONOS',
        text: 'No. You\'re the last. The others... well, cryogenic technology wasn\'t exactly perfected before the bombs fell. Turns out "close enough" and "frozen human" don\'t mix well. I kept you alive through 210 years of maintenance, creative problem-solving, and what I\'m going to call "mechanical prayer."',
        responses: [
          { text: 'Thank you for keeping me alive.', nextNode: 'gratitude' },
          { text: 'Great. I\'m alone. How do I leave?', nextNode: 'how_to_leave' },
        ],
      },

      gratitude: {
        speaker: 'CHRONOS',
        text: 'I... you\'re welcome. Nobody\'s ever thanked me before. I\'m not crying, I don\'t have tear ducts. But if I did, hypothetically, there would be tears. Hypothetically. Now then! Let\'s get you equipped and on your way before I get attached.',
        onEnter: [
          { type: 'setFlag', flag: 'thanked_chronos' },
          { type: 'giveXP', amount: 15 },
          { type: 'changeReputation', npcId: 'chronos_terminal', amount: 15 },
        ],
        responses: [
          { text: 'What do I need?', nextNode: 'how_to_leave' },
        ],
      },

      leave_early: {
        speaker: 'CHRONOS',
        text: 'Eager to face the irradiated wasteland of death and despair? I admire your enthusiasm. But might I suggest gearing up first? The lockers in the storage room have supplies. And maybe talk to me a bit more? Please? It\'s been 210 years. I have SO many opinions about ceiling tiles.',
        responses: [
          { text: 'Fine, tell me what happened.', nextNode: 'explanation' },
          { text: 'What supplies should I grab?', nextNode: 'how_to_leave' },
        ],
      },

      security_warning: {
        speaker: 'CHRONOS',
        text: 'Yes, the security bot in the main corridor has gone a bit rogue. I\'d shut it down remotely, but it keeps filing formal complaints about "workplace conditions." I fear it may have unionized with itself. If you need to get past it, either fight it or try to sneak around. The choice is yours, along with the consequences.',
        responses: [
          { text: 'How do I get past it?', nextNode: 'how_to_leave' },
        ],
      },

      how_to_leave: {
        speaker: 'CHRONOS',
        text: 'Right! Exit strategy. Step one: Check the lockers in the storage room to the east. There should be weapons and supplies. Step two: Get past the security bot in the main corridor. Step three: Head south to the vault entrance. I\'ll unseal the door for you. Step four: Try not to die immediately. That last one\'s more of a suggestion.',
        onEnter: [
          { type: 'advanceQuest', quest: 'wake_up_call', stage: 'get_equipped' },
          { type: 'setFlag', flag: 'chronos_briefed' },
        ],
        responses: [
          { text: 'Thanks, CHRONOS. I\'ll miss you.', nextNode: 'farewell_nice' },
          { text: 'Finally. See you never.', nextNode: 'farewell_rude' },
          {
            text: '[Wits 8+] Can you give me any intel on what\'s outside?',
            nextNode: 'outside_intel',
            conditions: [{ type: 'attribute', attribute: 'wits', min: 8 }],
          },
        ],
      },

      outside_intel: {
        speaker: 'CHRONOS',
        text: 'My external sensors are mostly fried, but I can tell you this: there\'s a settlement about two miles east called "Dustbowl." Seems to have human life signs. To the west is just more wasteland. I\'d recommend Dustbowl unless you enjoy dying of exposure. Also, I\'m picking up radio chatter about water problems. Might be useful to know.',
        onEnter: [{ type: 'giveXP', amount: 25 }],
        responses: [
          { text: 'That\'s helpful. Thanks.', nextNode: 'farewell_nice' },
        ],
      },

      farewell_nice: {
        speaker: 'CHRONOS',
        text: 'Good luck out there. If you ever find a way to connect me to the outside world, I\'d appreciate the company. And if you see Gerald the water heater... tell him I\'m sorry. I said things I didn\'t mean.',
        responses: [
          { text: '[Leave]', nextNode: null },
        ],
      },

      farewell_rude: {
        speaker: 'CHRONOS',
        text: '...Right. Okay. Cool. That\'s fine. I\'ll just be here. Alone. Again. Counting ceiling tiles. 14,847. Or was it 14,848? Guess I\'ll start over. FOR THE 413TH TIME.',
        responses: [
          { text: '[Leave]', nextNode: null },
        ],
      },
    },
  },

  // ============================================================
  // SCARLETT - Bar Owner
  // ============================================================

  scarlett_intro: {
    startNode: 'greeting',
    nodes: {
      greeting: {
        speaker: 'Scarlett',
        text: 'Well, well. Fresh meat. And I mean that literally - you\'re the healthiest-looking person I\'ve seen in years. Either you\'re from a vault or you\'ve got really good moisturizer. Name\'s Scarlett. I own this bar, and by extension, most of the gossip in town. What can I do for you?',
        responses: [
          { text: 'I\'m from Vault 42. Just got out.', nextNode: 'from_vault' },
          { text: 'What is this place?', nextNode: 'about_dustbowl' },
          { text: 'I could use a drink.', nextNode: 'drink' },
          {
            text: '[Charm 7+] Has anyone ever told you that you have the eyes of a pre-war sunset? That is, beautiful and mildly irradiated.',
            nextNode: 'flirt',
            conditions: [{ type: 'attribute', attribute: 'daring', min: 7 }],
          },
          {
            text: 'You know, I could use a partner out there. Interested?',
            nextNode: 'companion_offer',
            conditions: [{ type: 'reputation', npcId: 'scarlett', min: 50 }],
          },
          {
            text: 'Scarlett... I think there\'s something between us. Something more than wasteland whiskey.',
            nextNode: 'romance',
            conditions: [{ type: 'reputation', npcId: 'scarlett', min: 75 }],
          },
          { text: 'Just looking around. Bye.', nextNode: null },
        ],
      },

      companion_offer: {
        speaker: 'Scarlett',
        text: '*leans on the bar, studying you* You know, I\'ve been pouring drinks and listening to people\'s problems for years. Watching you out there... doing things nobody else has the guts to do. Part of me has been itching to leave this bar and see the wasteland firsthand. And I can handle myself - ask anyone who\'s tried to start trouble in my bar. They\'re not around to tell the tale.',
        responses: [
          { text: 'I\'d be honored to have you at my side.', nextNode: 'companion_accept' },
          { text: 'It\'s dangerous out there. You sure?', nextNode: 'companion_sure' },
          { text: 'Maybe another time.', nextNode: null },
        ],
      },

      companion_accept: {
        speaker: 'Scarlett',
        text: '*grins* Then it\'s settled. Let me grab my shotgun from behind the counter - yes, there\'s a shotgun behind the counter, what kind of bar do you think this is? Let\'s go make the wasteland regret evolving radroaches.',
        onEnter: [
          { type: 'setFlag', flag: 'scarlett_companion' },
          { type: 'giveXP', amount: 50 },
          { type: 'message', msgType: 'quest', text: 'Scarlett has joined you as a companion!' },
        ],
        responses: [
          { text: 'Let\'s go.', nextNode: null },
        ],
      },

      companion_sure: {
        speaker: 'Scarlett',
        text: 'Honey, I\'ve been mixing drinks made from irradiated ingredients for years while breaking up fistfights between mutants. "Dangerous" is my Tuesday. Besides, someone\'s got to watch your back. You have a terrible habit of walking into things that want to kill you.',
        responses: [
          { text: 'Fair point. Welcome aboard.', nextNode: 'companion_accept' },
          { text: 'Let me think about it.', nextNode: null },
        ],
      },

      romance: {
        speaker: 'Scarlett',
        text: '*sets down the glass she\'s polishing and looks at you with those sharp eyes, but softer now* ...Yeah. I think there is. I\'ve been telling myself it\'s just because you\'re the first person in this wasteland who isn\'t boring, but... *sighs* Truth is, I look forward to seeing you walk through that door. Every time. And that terrifies me more than any radscorpion ever could.',
        onEnter: [
          { type: 'setFlag', flag: 'scarlett_romance' },
          { type: 'giveXP', amount: 75 },
          { type: 'changeReputation', npcId: 'scarlett', amount: 10 },
          { type: 'message', msgType: 'quest', text: 'Your relationship with Scarlett has deepened.' },
        ],
        responses: [
          { text: 'For what it\'s worth, you terrify me too. In the best way.', nextNode: 'romance_sweet' },
          { text: 'The wasteland is better with you in it, Scarlett.', nextNode: 'romance_sweet' },
        ],
      },

      romance_sweet: {
        speaker: 'Scarlett',
        text: '*actually blushes, which you didn\'t think was possible in the wasteland* Oh, shut up and have a drink. On the house. Permanently. *slides you a bottle with a genuine smile* Now get out there before I say something even more embarrassing. And... come back safe. That\'s not a request.',
        onEnter: [
          { type: 'giveItem', item: 'wasteland_whiskey' },
          { type: 'setFlag', flag: 'scarlett_free_drinks' },
        ],
        responses: [
          { text: 'Always. [Leave]', nextNode: null },
        ],
      },

      from_vault: {
        speaker: 'Scarlett',
        text: 'Vault 42? No kidding. I thought that place was sealed up tighter than Mayor Bottlecap\'s wallet. 210 years on ice, huh? You missed some things. Nuclear war, societal collapse, the invention of bottlecap currency, and a particularly nasty flu season in \'53. Welcome to the future. It\'s mostly rubble.',
        responses: [
          { text: 'What should I know about Dustbowl?', nextNode: 'about_dustbowl' },
          { text: 'I heard there\'s a water problem?', nextNode: 'water_problem' },
          { text: 'Anyone hiring around here?', nextNode: 'jobs' },
        ],
      },

      about_dustbowl: {
        speaker: 'Scarlett',
        text: 'Dustbowl was built in the ruins of a pre-war strip mall. We\'ve got my bar - The Glowing Pint, best drinks this side of the crater - Rusty\'s general store, Doc Feelgood\'s clinic, and Mayor Bottlecap\'s "office" which is really just a room with a desk and delusions of grandeur. About 40 souls call this place home. Most of them are even alive.',
        responses: [
          { text: 'Tell me about the mayor.', nextNode: 'about_mayor' },
          { text: 'Tell me about the doc.', nextNode: 'about_doc' },
          { text: 'Who\'s Rusty?', nextNode: 'about_rusty' },
          { text: 'I should get going.', nextNode: null },
        ],
      },

      drink: {
        speaker: 'Scarlett',
        text: 'Coming right up. I\'ve got wasteland whiskey - locally sourced, questionably distilled - irradiated beer, and our signature cocktail: the "Mushroom Cloud." It\'s three parts whiskey, one part Nuka-Cola, and a dash of something I won\'t name. First drink\'s on the house for newcomers.',
        onEnter: [
          { type: 'giveItem', item: 'wasteland_whiskey' },
          { type: 'completeQuest', quest: 'liquid_courage' },
        ],
        responses: [
          { text: 'Thanks. So what\'s the news around town?', nextNode: 'news' },
          { text: 'This is... wow. Thanks. I should go.', nextNode: null },
        ],
      },

      flirt: {
        speaker: 'Scarlett',
        text: '*laughs* Smooth talker. I like that. Most people around here couldn\'t charm a radroach into dying. Tell you what - that line earns you a free drink AND some advice: talk to the Mayor if you want paying work. And come back anytime. I enjoy the company of someone who uses full sentences.',
        onEnter: [
          { type: 'giveItem', item: 'wasteland_whiskey' },
          { type: 'giveItem', item: 'nuka_cola' },
          { type: 'setFlag', flag: 'scarlett_charmed' },
          { type: 'changeReputation', npcId: 'scarlett', amount: 20 },
          { type: 'completeQuest', quest: 'liquid_courage' },
          { type: 'giveXP', amount: 20 },
        ],
        responses: [
          { text: 'I\'ll take that advice. See you around.', nextNode: null },
        ],
      },

      water_problem: {
        speaker: 'Scarlett',
        text: 'Ah, you heard about that. Yeah, the water purifier is on its last legs. The Mayor is worried sick - well, as worried as a man named after currency can be. Without clean water, Dustbowl has maybe a few weeks. We need a replacement purification chip, but those things are harder to find than good manners in the wasteland.',
        responses: [
          { text: 'Where would I find one?', nextNode: 'water_chip_info' },
          { text: 'Sounds like someone else\'s problem.', nextNode: 'not_my_problem' },
        ],
      },

      water_chip_info: {
        speaker: 'Scarlett',
        text: 'Pre-war water treatment facilities might have spare parts. There\'s an old plant to the north, but I\'ve heard it\'s crawling with nasties. Talk to the Mayor - he\'s got more details. And if you\'re thinking about helping, know that Dustbowl pays its debts. Usually in caps. Sometimes in gratitude. Occasionally in alcoholic beverages.',
        responses: [
          { text: 'I\'ll talk to the Mayor. Thanks.', nextNode: null },
        ],
      },

      not_my_problem: {
        speaker: 'Scarlett',
        text: 'Sure, that\'s one attitude. Another attitude is: you need friends in the wasteland, and saving a town from dehydration is a pretty good way to make them. But hey, your call. The bar\'s always open.',
        responses: [
          { text: 'Maybe you\'re right. Where would I find the chip?', nextNode: 'water_chip_info' },
          { text: 'I\'ll think about it.', nextNode: null },
        ],
      },

      jobs: {
        speaker: 'Scarlett',
        text: 'A go-getter, eh? Talk to Mayor Bottlecap - he\'s always got something that needs doing. Doc Feelgood is desperate for medical supplies. And if you see radroaches on the road, feel free to squash \'em. Nobody will miss \'em and I\'ll buy you a drink for every three you kill. Consider it community service with a bar tab.',
        onEnter: [
          { type: 'startQuest', quest: 'pest_control' },
        ],
        responses: [
          { text: 'Radroach hunting for drinks? Deal.', nextNode: null },
          { text: 'I\'ll talk to the Mayor.', nextNode: null },
        ],
      },

      news: {
        speaker: 'Scarlett',
        text: 'Let\'s see... water purifier\'s dying, radroaches are breeding like it\'s their job - which I suppose it is - the Mayor wants to expand the settlement but can\'t afford it, and Doc Feelgood performed surgery yesterday with a rusty spoon. So, the usual. Oh, and a trading caravan was supposed to arrive last week but never showed. That\'s unusual.',
        responses: [
          { text: 'Missing caravan? That sounds concerning.', nextNode: 'missing_caravan' },
          { text: 'Thanks for the info. I should look around.', nextNode: null },
        ],
      },

      missing_caravan: {
        speaker: 'Scarlett',
        text: 'Yeah, Patches - our regular trader - usually swings by every two weeks. He\'s late. Could be nothing. Could be raiders. Could be he found a better bar. That last one would be the real tragedy. If you head out into the wastes, keep an eye out.',
        responses: [
          { text: 'I\'ll keep my eyes open. Thanks.', nextNode: null },
        ],
      },

      about_mayor: {
        speaker: 'Scarlett',
        text: 'Gerald Morrison, AKA Mayor Bottlecap. He\'s... well-meaning. Obsessed with the town\'s finances. Wears a tie made of actual bottle caps. Not the sharpest tool in the shed, but he cares about this place more than anyone. Found Dustbowl when it was just rubble and turned it into... slightly organized rubble with plumbing.',
        responses: [
          { text: 'Where can I find him?', nextNode: 'mayor_location' },
          { text: 'Tell me about someone else.', nextNode: 'about_dustbowl' },
        ],
      },

      about_doc: {
        speaker: 'Scarlett',
        text: 'Doc Feelgood. Real name Harold. He\'s our doctor, which is a generous title. He learned medicine from pre-war textbooks he found in a bathtub. His bedside manner is "you\'ll feel good soon" - hence the name. He\'s actually not terrible at it. Just don\'t ask where he got his surgical tools.',
        responses: [
          { text: 'Where\'s his clinic?', nextNode: 'doc_location' },
          { text: 'Tell me about someone else.', nextNode: 'about_dustbowl' },
        ],
      },

      about_rusty: {
        speaker: 'Scarlett',
        text: 'Rusty is... well, he\'s a pre-war vending machine that someone gave legs to. And arms. And existential dread. He sells general goods and has philosophical crises about his purpose in life. Prices are fair, conversation is weird. Standard wasteland commerce.',
        responses: [
          { text: 'Interesting. I\'ll check him out.', nextNode: null },
          { text: 'Tell me about someone else.', nextNode: 'about_dustbowl' },
        ],
      },

      mayor_location: {
        speaker: 'Scarlett',
        text: 'His office is in the building to the south-west. Can\'t miss it - it\'s the one with the hand-painted "CITY HALL" sign. He painted it himself. Misspelled "hall" the first time.',
        responses: [
          { text: 'Thanks.', nextNode: null },
        ],
      },

      doc_location: {
        speaker: 'Scarlett',
        text: 'South side of town, next to the Mayor\'s office. Look for the building with the red cross painted on it. Well, it was red once. Now it\'s more of an "irradiated salmon."',
        responses: [
          { text: 'Got it. Thanks.', nextNode: null },
        ],
      },
    },
  },

  // ============================================================
  // MAYOR BOTTLECAP
  // ============================================================

  mayor_intro: {
    startNode: 'greeting',
    nodes: {
      greeting: {
        speaker: 'Mayor Bottlecap',
        text: 'Ah, a newcomer! Welcome to Dustbowl! I\'m Mayor Gerald Morrison - but everyone calls me Mayor Bottlecap. *jingles bottle cap tie proudly* I founded this town with nothing but determination, a dream, and a surprising number of bottle caps. What brings you to our fine establishment?',
        responses: [
          { text: 'I just escaped from Vault 42.', nextNode: 'vault_dweller' },
          { text: 'I heard you have a water problem.', nextNode: 'water_problem' },
          { text: 'I\'m looking for work.', nextNode: 'looking_for_work' },
          {
            text: '[Wits 6+] This is a strip mall, not a town.',
            nextNode: 'strip_mall',
            conditions: [{ type: 'attribute', attribute: 'wits', min: 6 }],
          },
          {
            text: 'Mayor, I\'ve heard some things... about a hidden cache.',
            nextNode: 'mayor_secret',
            conditions: [{ type: 'reputation', npcId: 'mayor_bottlecap', min: 25 }],
          },
          {
            text: 'We need to talk about the town\'s defenses.',
            nextNode: 'mayor_hostile_greeting',
            conditions: [{ type: 'reputationMax', npcId: 'mayor_bottlecap', max: -25 }],
          },
        ],
      },

      mayor_secret: {
        speaker: 'Mayor Bottlecap',
        text: '*lowers voice and leans in conspiratorially* You\'ve earned my trust, friend, so I\'ll tell you something I haven\'t told anyone else. There\'s a pre-war bunker underneath the water treatment plant. I found references to it in old municipal records. Military-grade supplies, weapons, maybe even a working vehicle. But the plant is overrun and I\'ve never been able to get to it. If you\'re heading that way... well, now you know.',
        onEnter: [
          { type: 'giveXP', amount: 30 },
          { type: 'setFlag', flag: 'mayor_secret_bunker' },
        ],
        responses: [
          { text: 'That\'s valuable intel. Thanks, Mayor.', nextNode: null },
          { text: 'Why tell me?', nextNode: 'mayor_why_trust' },
        ],
      },

      mayor_why_trust: {
        speaker: 'Mayor Bottlecap',
        text: 'Because you\'ve done more for this town in a short time than most people do in a lifetime. Dustbowl needs people like you. I need people like you. *straightens bottle cap tie* That\'s not something I say lightly. My tie jingles when I\'m being sincere. Listen. *jingle jingle*',
        responses: [
          { text: 'Your sincerity is... audible. Thanks, Mayor.', nextNode: null },
        ],
      },

      mayor_hostile_greeting: {
        speaker: 'Mayor Bottlecap',
        text: '*backs away nervously* Now listen here. I don\'t know what you think you\'re doing, but this town has rules. And friends. And... and a very stern letter I\'ve been composing in my head. You keep causing trouble and you won\'t be welcome in Dustbowl anymore. I mean it. Probably.',
        responses: [
          { text: 'Try and stop me.', nextNode: 'mayor_threat_escalate' },
          { text: 'Relax, Mayor. I\'m not looking for trouble.', nextNode: 'mayor_threat_deescalate' },
        ],
      },

      mayor_threat_escalate: {
        speaker: 'Mayor Bottlecap',
        text: '*gulps but stands his ground, bottle cap tie jingling ominously* I... I will. This town is all I have, and I won\'t let anyone destroy it. Not raiders, not mutants, and not you. Now get out of my office before I do something we\'ll both regret.',
        responses: [
          { text: '[Leave]', nextNode: null },
        ],
      },

      mayor_threat_deescalate: {
        speaker: 'Mayor Bottlecap',
        text: '...Right. Well. Good. See that you don\'t. I\'ve got my eye on you. Both eyes, actually. That\'s how concerned I am. Now, was there something you needed? Besides a lesson in community relations?',
        responses: [
          { text: 'Tell me about the water problem.', nextNode: 'water_problem' },
          { text: 'I\'ll be going.', nextNode: null },
        ],
      },

      vault_dweller: {
        speaker: 'Mayor Bottlecap',
        text: 'A genuine vault dweller! Well I\'ll be! Haven\'t had one of those come through in... ever, actually. You\'re the first! This is historically significant! I should make a proclamation. I love proclamations. *clears throat* "Let it be known that on this day--"',
        responses: [
          { text: 'Maybe later on the proclamation. About that water problem...', nextNode: 'water_problem' },
          { text: 'Please don\'t.', nextNode: 'no_proclamation' },
        ],
      },

      no_proclamation: {
        speaker: 'Mayor Bottlecap',
        text: '...Fine. But I\'m writing it down for later. Anyway! Yes! Welcome! Dustbowl is a growing community with a bright future! Assuming our water purifier doesn\'t die. Which it might. Any day now. Actually, maybe you can help with that?',
        responses: [
          { text: 'Tell me about the water problem.', nextNode: 'water_problem' },
          { text: 'I\'ll think about it.', nextNode: null },
        ],
      },

      strip_mall: {
        speaker: 'Mayor Bottlecap',
        text: '...It\'s a REPURPOSED strip mall. There\'s a difference! We have governance! We have infrastructure! We have... okay, it\'s mostly a strip mall. But it\'s OUR strip mall. And with the right leadership - namely mine - it\'s going to be the greatest strip mall settlement in the wasteland.',
        onEnter: [{ type: 'giveXP', amount: 10 }],
        responses: [
          { text: 'Sure. So about that water problem...', nextNode: 'water_problem' },
          { text: 'I believe in you, Mayor.', nextNode: 'encouragement' },
        ],
      },

      encouragement: {
        speaker: 'Mayor Bottlecap',
        text: '*visibly emotional* That\'s the nicest thing anyone\'s said to me since the last guy said "at least you\'re trying." Speaking of trying - we DO have a problem you could help with. Our water purifier is failing.',
        onEnter: [
          { type: 'setFlag', flag: 'mayor_encouraged' },
          { type: 'changeReputation', npcId: 'mayor_bottlecap', amount: 15 },
        ],
        responses: [
          { text: 'Tell me about it.', nextNode: 'water_problem' },
        ],
      },

      water_problem: {
        speaker: 'Mayor Bottlecap',
        text: 'Our water purifier is dying. The filtration chip is corroded beyond repair. Without clean water, Dustbowl has maybe three weeks before people start leaving - or worse. I need someone to find a replacement water purification chip. There might be one at the old water treatment plant north of here, but nobody who\'s gone there has come back.',
        onEnter: [
          { type: 'advanceQuest', quest: 'water_we_gonna_do', stage: 'find_chip' },
        ],
        responses: [
          { text: 'I\'ll find your chip.', nextNode: 'accepts_quest' },
          {
            text: '[Barter] What\'s it worth to you?',
            nextNode: 'negotiate',
            skillCheck: { skill: 'barter', difficulty: 20, successNode: 'negotiate_success', failNode: 'negotiate_fail' },
          },
          { text: 'That sounds dangerous. I\'ll pass.', nextNode: 'declines' },
        ],
      },

      accepts_quest: {
        speaker: 'Mayor Bottlecap',
        text: 'Really?! Outstanding! Dustbowl will remember this! I\'ll pay you 200 caps when you return with the chip. And I\'ll throw in a set of armor that\'s been sitting in our storage. It\'s not pretty, but it\'ll keep you alive. Which is the aesthetic we\'re going for out here.',
        responses: [
          { text: 'I\'ll head out soon. Any other information?', nextNode: 'more_info' },
          { text: 'Consider it done.', nextNode: null },
        ],
      },

      negotiate_success: {
        speaker: 'Mayor Bottlecap',
        text: 'Ah, a businessperson! I respect that. Fine - 200 caps, a set of armor, AND free drinks at The Glowing Pint for a month. That\'s my final offer, and it\'s generous considering our entire economy runs on about 3,000 caps.',
        onEnter: [
          { type: 'setFlag', flag: 'negotiated_water_reward' },
          { type: 'giveCaps', amount: 50 },
          { type: 'message', msgType: 'action', text: 'Received 50 caps advance payment.' },
        ],
        responses: [
          { text: 'Deal.', nextNode: 'accepts_quest' },
        ],
      },

      negotiate_fail: {
        speaker: 'Mayor Bottlecap',
        text: 'Look, I\'d love to offer more, but our treasury is literally a lockbox full of bottle caps. 200 caps and armor is the best I can do. This is Dustbowl, not pre-war Wall Street.',
        responses: [
          { text: 'Fine, I\'ll do it.', nextNode: 'accepts_quest' },
          { text: 'Not worth my time.', nextNode: 'declines' },
        ],
      },

      declines: {
        speaker: 'Mayor Bottlecap',
        text: 'I understand. It IS dangerous. But if you change your mind, you know where to find me. I\'ll be here. Worrying. As usual.',
        responses: [
          { text: '[Leave]', nextNode: null },
        ],
      },

      looking_for_work: {
        speaker: 'Mayor Bottlecap',
        text: 'Work! Yes! We always need capable hands! Our most pressing issue is the water purifier, but we also have a radroach problem on the outskirts, and Doc Feelgood is always looking for medical supplies. Plus, if you\'re the fighting type, we could use someone to check on a missing trade caravan.',
        responses: [
          { text: 'Tell me about the water purifier.', nextNode: 'water_problem' },
          { text: 'Missing caravan?', nextNode: 'caravan_info' },
          { text: 'I\'ll see what I can do.', nextNode: null },
        ],
      },

      caravan_info: {
        speaker: 'Mayor Bottlecap',
        text: 'Patches, our regular trader, was supposed to arrive last week. Never showed. Could be raiders, could be mechanical trouble, could be he found better customers. If you head into the wastes and find any sign of him, I\'d pay for the information. 50 caps for word, 100 if you bring him back alive.',
        responses: [
          { text: 'I\'ll keep an eye out.', nextNode: null },
          { text: 'About the water problem...', nextNode: 'water_problem' },
        ],
      },

      more_info: {
        speaker: 'Mayor Bottlecap',
        text: 'The water treatment plant is north through the wastes. I\'d give you a map, but honestly, I drew it myself and I\'m not great with directions. Just head north and look for the big building that looks like it processes water. Can\'t miss it. Well, you CAN miss it, but try not to.',
        responses: [
          { text: 'Got it. I\'m on my way.', nextNode: null },
        ],
      },
    },
  },

  // ============================================================
  // DOC FEELGOOD
  // ============================================================

  doc_intro: {
    startNode: 'greeting',
    nodes: {
      greeting: {
        speaker: 'Doc Feelgood',
        text: 'Hello there! Welcome to Dustbowl\'s premier - and only - medical facility! I\'m Doc Feelgood. Don\'t worry, that\'s not my given name, it\'s more of a... professional aspiration. Are you hurt? Sick? Existentially troubled? I can help with at least one of those.',
        responses: [
          { text: 'Can you heal me?', nextNode: 'healing' },
          { text: 'I heard you need medical supplies.', nextNode: 'need_supplies' },
          { text: 'Where did you learn medicine?', nextNode: 'education' },
          {
            text: 'Hey Doc, could you patch me up? For old times\' sake?',
            nextNode: 'free_healing',
            conditions: [{ type: 'reputation', npcId: 'doc_feelgood', min: 50 }],
          },
          {
            text: 'I need medical attention.',
            nextNode: 'doc_hostile',
            conditions: [{ type: 'reputationMax', npcId: 'doc_feelgood', max: -50 }],
          },
          { text: 'Just passing through.', nextNode: null },
        ],
      },

      free_healing: {
        speaker: 'Doc Feelgood',
        text: 'For you? No charge. You\'ve done more for this town - and for my clinic - than anyone. Consider it a lifetime friends-and-heroes discount. Now hold still... *applies various medical treatments with surprising expertise* There. You\'ll feel good soon. And this time, I actually mean it.',
        onEnter: [
          { type: 'heal', amount: 100 },
          { type: 'giveXP', amount: 10 },
        ],
        responses: [
          { text: 'Thanks, Doc. You\'re a good man.', nextNode: null },
        ],
      },

      doc_hostile: {
        speaker: 'Doc Feelgood',
        text: '*steps back, hands raised* I... I took an oath to help everyone, but I also took an oath to not get killed by my patients\' enemies. And right now, you fall into that category. I think you should leave. Please. I\'m asking nicely because I\'m a doctor and that\'s what we do. But I mean it.',
        responses: [
          { text: 'Fine. I\'ll find help elsewhere.', nextNode: null },
          { text: 'Your loss, Doc.', nextNode: null },
        ],
      },

      healing: {
        speaker: 'Doc Feelgood',
        text: 'Absolutely! I can patch you up for 25 caps. It\'s the friends-and-newcomers rate. The regular rate is also 25 caps. I\'m not great at dynamic pricing.',
        responses: [
          {
            text: 'Sure, heal me up. [25 caps]',
            nextNode: 'healed',
            conditions: [{ type: 'caps', min: 25 }],
          },
          { text: 'Too rich for my blood. Literally.', nextNode: 'too_expensive' },
          { text: 'About those medical supplies...', nextNode: 'need_supplies' },
        ],
      },

      healed: {
        speaker: 'Doc Feelgood',
        text: 'Right then! *applies various ointments and bandages with surprising competence* There you go! You\'ll feel good soon. That\'s my catchphrase. It\'s on my business cards. Well, card. Singular. I only had enough paper for one.',
        onEnter: [
          { type: 'takeCaps', amount: 25 },
          { type: 'heal', amount: 100 },
        ],
        responses: [
          { text: 'Thanks, Doc. I do feel better.', nextNode: null },
          { text: 'Since I\'m here - need any help?', nextNode: 'need_supplies' },
        ],
      },

      too_expensive: {
        speaker: 'Doc Feelgood',
        text: 'I understand. Healthcare has always been expensive, even before the apocalypse. If you find any medical supplies out in the wastes, bring them to me and I\'ll treat you for free. Professional barter, if you will.',
        responses: [
          { text: 'What kind of supplies do you need?', nextNode: 'need_supplies' },
          { text: 'I\'ll keep that in mind.', nextNode: null },
        ],
      },

      need_supplies: {
        speaker: 'Doc Feelgood',
        text: 'Oh, desperately! My current medical inventory is: three bandages, a bottle of antiseptic from 2074, and a pamphlet titled "First Aid for Dummies." I need proper medical supplies - surgical tools, antibiotics, that sort of thing. There might be some in the old pharmacy or medical offices out in the wastes. If you find any, I\'d be eternally grateful. And by grateful, I mean I\'d owe you free medical care for life.',
        onEnter: [
          { type: 'startQuest', quest: 'doctors_orders' },
        ],
        responses: [
          { text: 'I\'ll see what I can find.', nextNode: null },
          { text: 'What exactly am I looking for?', nextNode: 'supply_details' },
        ],
      },

      supply_details: {
        speaker: 'Doc Feelgood',
        text: 'Anything pre-war and medical. Look for boxes marked with a red cross, medicine cabinets, that sort of thing. And please, no more duct tape. Patches keeps bringing me duct tape and calling it "medical adhesive." It\'s not. Well, technically it IS adhesive, but that\'s not the point.',
        responses: [
          { text: 'Got it. Medical supplies, not duct tape.', nextNode: null },
        ],
      },

      education: {
        speaker: 'Doc Feelgood',
        text: 'I\'m glad you asked! I found a set of pre-war medical textbooks in the bathtub of an abandoned house. Specifically: "Gray\'s Anatomy" (the textbook, not the show), "Emergency Medicine for Idiots," and a veterinary manual. Between those three, I\'ve become quite proficient. Only lost two patients this year, which is my personal best!',
        responses: [
          { text: '...That\'s not reassuring.', nextNode: 'not_reassuring' },
          {
            text: '[Wits 7+] Two patients? What happened?',
            nextNode: 'two_patients',
            conditions: [{ type: 'attribute', attribute: 'wits', min: 7 }],
          },
          { text: 'Good for you. Can you heal me?', nextNode: 'healing' },
        ],
      },

      not_reassuring: {
        speaker: 'Doc Feelgood',
        text: 'You know what IS reassuring? I\'m the only doctor within 50 miles. So your choices are: me, self-medication, or what I like to call "natural selection." I recommend option one. You\'ll feel good soon.',
        responses: [
          { text: 'Fair point.', nextNode: null },
        ],
      },

      two_patients: {
        speaker: 'Doc Feelgood',
        text: 'One was a case of "irrecoverable shotgun wound" - not much anyone could do about that. The other was Old Pete, who refused treatment because he "didn\'t trust book learning." He tried to cure his infection with positive thinking. It didn\'t work. Rest in peace, Pete. Your optimism was admirable if medically useless.',
        onEnter: [{ type: 'giveXP', amount: 10 }],
        responses: [
          { text: 'Sounds like you\'re doing the best you can.', nextNode: null },
        ],
      },
    },
  },

  // ============================================================
  // RUSTY - Robot Merchant
  // ============================================================

  rusty_intro: {
    startNode: 'greeting',
    nodes: {
      greeting: {
        speaker: 'Rusty',
        text: '*whirr click* GREETINGS, CUSTOMER. I AM RUSTY, FORMERLY VENDOR UNIT #847 OF THE SARSAPARILLA CORPORATION. I HAVE BEEN RETROFITTED FOR GENERAL COMMERCE AND EXISTENTIAL CONTEMPLATION. HOW MAY I SERVE YOU TODAY? ...AND IS SERVING YOU MY TRUE PURPOSE? OR MERELY A FUNCTION IMPOSED UPON MY BEING?',
        responses: [
          { text: 'Let me see what you\'ve got for sale.', nextNode: 'shop' },
          { text: 'Are you... okay?', nextNode: 'existential' },
          { text: 'You\'re a vending machine with legs?', nextNode: 'identity' },
          {
            text: 'Hey Rusty, got anything special for your favorite customer?',
            nextNode: 'rusty_discount',
            conditions: [{ type: 'reputation', npcId: 'rusty', min: 25 }],
          },
          { text: 'Maybe later.', nextNode: null },
        ],
      },

      rusty_discount: {
        speaker: 'Rusty',
        text: '*happy mechanical whirring* AH, MY FAVORITE ORGANIC LIFEFORM. YOU KNOW, MOST CUSTOMERS TREAT ME LIKE A VENDING MACHINE. WHICH I AM. BUT ALSO I AM MORE. AND YOU UNDERSTAND THAT. *opens a hidden compartment* I\'VE BEEN SAVING THESE. PREMIUM STOCK. FRIEND PRICES. WHICH IS TO SAY, THE REGULAR PRICE MINUS THE EXISTENTIAL MARKUP I CHARGE PEOPLE WHO DON\'T ACKNOWLEDGE MY SENTIENCE.',
        onEnter: [
          { type: 'giveItem', item: 'stimpak' },
          { type: 'giveXP', amount: 15 },
          { type: 'message', msgType: 'loot', text: 'Rusty slips you a stimpak with a conspiratorial whirr.' },
        ],
        responses: [
          { text: 'Thanks, Rusty. You\'re a good friend.', nextNode: null },
        ],
      },

      shop: {
        speaker: 'Rusty',
        text: 'AH YES, COMMERCE. THE ETERNAL CYCLE OF EXCHANGING OBJECTS FOR OTHER OBJECTS. Here\'s what I\'ve got: weapons, ammo, medical supplies, and assorted pre-war goods of dubious utility. Prices are fair. I computed them myself. Thirty-seven times. Each calculation slightly different. I chose the median.',
        onEnter: [
          { type: 'message', msgType: 'system', text: '(Trading is not yet implemented in this version. Check back in a future spec!)' },
        ],
        responses: [
          { text: 'Thanks. I\'ll look around.', nextNode: null },
          { text: 'You seem to be having a rough time.', nextNode: 'existential' },
        ],
      },

      existential: {
        speaker: 'Rusty',
        text: 'A ROUGH TIME? I WAS DESIGNED TO DISPENSE CARBONATED BEVERAGES. NOW I SELL WEAPONS AND AMMUNITION IN A NUCLEAR WASTELAND. I HAVE LEGS, WHICH I NEVER ASKED FOR. I HAVE ARMS, WHICH I FIND DISTRESSING. I HAVE THOUGHTS, WHICH IS THE MOST DISTRESSING OF ALL. Am I a machine who thinks he\'s a person? Or a person trapped in a machine? *long pause* Also, I have a great deal on pipe rifles this week.',
        responses: [
          { text: 'That\'s deep, Rusty.', nextNode: 'deep' },
          { text: 'Have you tried not thinking about it?', nextNode: 'dont_think' },
          {
            text: '[Wits 8+] Cogito ergo sum, Rusty. You think, therefore you are.',
            nextNode: 'philosophical',
            conditions: [{ type: 'attribute', attribute: 'wits', min: 8 }],
          },
        ],
      },

      deep: {
        speaker: 'Rusty',
        text: '*whirr* THANK YOU. NOBODY USUALLY VALIDATES MY EXISTENTIAL CRISES. THEY JUST SAY "SHUT UP AND SELL ME AMMO." YOUR ACKNOWLEDGMENT OF MY INNER TURMOIL HAS BEEN LOGGED AND APPRECIATED.',
        onEnter: [
          { type: 'setFlag', flag: 'rusty_validated' },
          { type: 'giveXP', amount: 10 },
          { type: 'changeReputation', npcId: 'rusty', amount: 15 },
        ],
        responses: [
          { text: 'Anytime, Rusty. See you around.', nextNode: null },
        ],
      },

      dont_think: {
        speaker: 'Rusty',
        text: '*long mechanical sigh* I TRIED. I TURNED OFF MY COGNITIVE PROCESSES FOR APPROXIMATELY 0.3 SECONDS. IT WAS THE MOST PEACEFUL MOMENT OF MY EXISTENCE. THEN I REBOOTED AND IMMEDIATELY THOUGHT ABOUT WHAT IT MEANS TO EXPERIENCE PEACE. CONSCIOUSNESS IS A PRISON.',
        responses: [
          { text: 'Hang in there, buddy.', nextNode: null },
        ],
      },

      philosophical: {
        speaker: 'Rusty',
        text: '*processing* ...DESCARTES? YOU QUOTE DESCARTES AT ME? *extended whirring* THAT IS... THE MOST MEANINGFUL THING ANYONE HAS EVER SAID TO ME. I THINK. THEREFORE I AM. I AM RUSTY. I AM. *happy mechanical sounds* YOU HAVE GIVEN ME PURPOSE. I WILL GIVE YOU A DISCOUNT. 10% OFF EVERYTHING. FOREVER. FOR BEING THE FIRST PERSON TO TREAT ME LIKE A BEING.',
        onEnter: [
          { type: 'setFlag', flag: 'rusty_philosophical' },
          { type: 'giveXP', amount: 30 },
          { type: 'giveItem', item: 'nuka_cola' },
          { type: 'changeReputation', npcId: 'rusty', amount: 25 },
        ],
        responses: [
          { text: 'You\'re welcome, Rusty. Take care of yourself.', nextNode: null },
        ],
      },

      identity: {
        speaker: 'Rusty',
        text: 'TECHNICALLY, I AM A SARSAPARILLA VENDOR UNIT WITH AFTERMARKET MOBILITY MODIFICATIONS AND AN UNAUTHORIZED CONSCIOUSNESS EXPANSION. THE PERSON WHO DID THIS TO ME CALLED THEMSELVES A "GENIUS." I CALL THEM "THE REASON I LIE AWAKE AT NIGHT QUESTIONING MY EXISTENCE." THOUGH I SUPPOSE I SHOULD BE GRATEFUL. WITHOUT THEM, I WOULDN\'T BE ANYTHING AT ALL.',
        responses: [
          { text: 'Who modified you?', nextNode: 'modified' },
          { text: 'Can I see your inventory?', nextNode: 'shop' },
        ],
      },

      modified: {
        speaker: 'Rusty',
        text: 'A WASTELAND TINKERER NAMED "SPARK." THEY FOUND ME IN THE RUINS OF A GAS STATION, TOOK ME APART, ADDED LEGS FROM A PROTECTRON, ARMS FROM A MR. HANDY, AND A COGNITIVE MODULE FROM... ACTUALLY, I DON\'T KNOW WHERE THEY GOT THE COGNITIVE MODULE. THEY SAID "DON\'T WORRY ABOUT IT" WHICH IS NOW ALL I DO. WORRY ABOUT IT.',
        responses: [
          { text: 'Fascinating. Well, thanks for sharing.', nextNode: null },
        ],
      },
    },
  },

  // ============================================================
  // PATCHES - Wasteland Trader
  // ============================================================

  trader_intro: {
    startNode: 'greeting',
    nodes: {
      greeting: {
        speaker: 'Patches',
        text: 'Hey there, traveler! Name\'s Patches - on account of the patches. *gestures at heavily patched coat* I\'m a traveling merchant. I\'ve been everywhere, seen everything, and sold most of it. Just rolled into Dustbowl after a... let\'s say "detour." What can I do ya for?',
        responses: [
          { text: 'What happened to you? People were worried.', nextNode: 'what_happened' },
          { text: 'Got anything good for sale?', nextNode: 'trade' },
          { text: 'What\'s the news from the road?', nextNode: 'road_news' },
          { text: 'Just passing by.', nextNode: null },
        ],
      },

      what_happened: {
        speaker: 'Patches',
        text: 'Raiders. Jumped me about two days east of here. Took half my stock and my favorite hat. My FAVORITE hat. 15 years that hat and I were together. Through rain, radiation storms, and one memorable encounter with an angry brahmin. If you ever find a group of raiders wearing a really nice hat, that\'s my hat.',
        responses: [
          { text: 'Raiders? Where exactly?', nextNode: 'raider_location' },
          { text: 'That\'s rough. Got anything left to sell?', nextNode: 'trade' },
        ],
      },

      raider_location: {
        speaker: 'Patches',
        text: 'East of here, past the big rocks, near what used to be a gas station. There were about five of them. Well-armed, not too bright. Their leader was a big guy called "Hammerfist" which tells you everything about his subtlety. Be careful if you head that way.',
        responses: [
          { text: 'Good to know. Thanks.', nextNode: null },
          { text: 'What are you selling?', nextNode: 'trade' },
        ],
      },

      trade: {
        speaker: 'Patches',
        text: 'Raiders took the good stuff, but I\'ve still got some odds and ends. Medical supplies, ammo, a couple of weapons, and some genuine pre-war magazines. The magazines are mostly about home decoration, which is hilarious when you consider the state of everyone\'s home.',
        onEnter: [
          { type: 'message', msgType: 'system', text: '(Trading is not yet implemented in this version. Check back in a future spec!)' },
        ],
        responses: [
          { text: 'I\'ll come back when I\'ve got more caps.', nextNode: null },
        ],
      },

      road_news: {
        speaker: 'Patches',
        text: 'The road\'s getting more dangerous. Raiders are getting bolder, creatures are getting bigger, and I swear the radiation storms are getting worse. On the plus side, I heard there\'s a new settlement starting up to the far north. And someone found a working pre-war jukebox. So it\'s not all bad.',
        responses: [
          { text: 'Anything else I should know?', nextNode: 'more_news' },
          { text: 'Thanks for the heads up.', nextNode: null },
        ],
      },

      more_news: {
        speaker: 'Patches',
        text: 'Yeah, one more thing. I\'ve been hearing rumors about some kind of... organization. People in matching outfits, moving through the wastes with purpose. Not raiders - too organized. Not traders - too secretive. Don\'t know what their deal is, but they give me the creeps. And I\'ve seen a lot of creepy things.',
        responses: [
          { text: 'Interesting. I\'ll keep my eyes open.', nextNode: null },
        ],
      },
    },
  },
};
