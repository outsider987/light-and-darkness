import type { BattleDef, LocationDef } from '../../types';
import { registerLocations } from '../locations';
import { registerBattles } from '../battles';
import { S, npc, shopkeeper, priest, nova, innkeeper, SHOP, rows } from './common';

const waral: LocationDef = {
  id: 'waral',
  name: 'Waral',
  music: 'sea',
  rows: rows(`
~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~BBBBBBBB~~~~~~~~~~
~~~~~~~~BBBBBBBB~~~~~~~~~~
::::::::BBBBBBBB::::::::::
::::::::::::::::::::::::::
..,,,,,,,,,,,,,,,,,,,,,,..
..,.RRRRR....RRRRR....,...
..,.#####....#####....,...
..,.#kFk#....#aFa#....,...
..,.#ccc#....#FFF#....,...
..,.#FFF#....#FFF#....,...
..,.##D##....##D##....,...
..,,,,,,,,,,,,,,,,,,,,,...
..,.RRRRR....RRRRR....,...
..,.#####....#####....,...
..,.#xFF#....#FFF#....,...
..,.#FFF#....#cFF#....,...
..,.#FFF#....#FFF#....,...
..,.##D##....##D##....,...
..,,,,,,,,,,,,,,,,,,,,,...
`),
  churchPos: { x: 15, y: 10 },
  onEnter: (g) => {
    if (g.flags.waral_arrived) return [];
    return [
      { chapter: 5 },
      { flag: 'waral_arrived' },
      'Harbormaster: Welcome to Waral, the last port before the dragon country. You are chasing Runefaust? Their fleet is anchored off the coast.',
      'Harbormaster: A witch commands it. Mishaela, they call her. No ship leaves this harbor while she is out there.',
    ];
  },
  npcs: [
    npc('harbormaster', 10, 4, S.old('#3060a0'), [
      { if: 'won:b14', then: ['Harbormaster: Mishaela is gone and the sea is open. Dragonia lies to the east, past the strait. Your captain knows the way.'], else: ['Harbormaster: Mishaela\'s flagship blocks the strait. If you sail, you sail into her.'] },
    ], { name: 'Harbormaster' }),
    shopkeeper('weapons_w', 6, 8, SHOP.waral),
    shopkeeper('items_w', 15, 16, ['healing_seed', 'healing_drop', 'antidote', 'angel_wing', 'power_potion', 'protect_potion', 'turbo_pepper']),
    priest('priest_w', 15, 9, 'Priest: Dragons are not evil, child. They simply remember more than we do.'),
    nova('nova_w', 6, 16),
    innkeeper('inn_w', 7, 15, 60),
    npc('lyle', 20, 15, { body: 'centaur', pal: { skin: '#f0c090', hair: '#f0e060', cloth: '#a04030', mount: '#c0a080' }, hair: 'short', weapon: 'bow' }, [
      'Lyle: You are the force that took Uranbatol? I am Lyle, bowman of Waral. The witch sank my brother\'s boat.',
      { ask: 'Lyle: I want a shot at her. Take me with you?', yes: ['Lyle: Then let us go hunting.', { join: 'lyle' }], no: ['Lyle: Then I will wait for another chance.'] },
    ], { name: 'Lyle', member: 'lyle' }),
    npc('sailor_w', 12, 4, S.man('#3050a0', '#c0a060'), ['Captain: When you are ready, board the ship. I will take you through the strait... witch or no witch.'], { dir: 'down' }),
    npc('woman_w', 20, 6, S.woman('#60a0c0'), ['Woman: They say a man in a black mask leads the Runefaust army in Dragonia. Kane, they call him.'], { wander: true }),
    npc('kid_w', 8, 19, S.kid('#c0a040'), ['Boy: I saw a baby dragon once! It was green and it sneezed fire.'], { wander: true }),
  ],
  chests: [{ x: 24, y: 5, item: 'robin_arrow' }, { x: 1, y: 19, gold: 400 }],
  searches: [{ x: 0, y: 3, text: 'Max searched the tide pools... and found a White Ring glinting in the sand!', item: 'white_ring' }],
  exits: [
    { x: 8, y: 1, w: 8, h: 2, dest: (g) => (g.flags['won:b14'] ? { location: 'dragonia', x: 11, y: 18, dir: 'up' } : { battle: 'b14' }) },
  ],
};

const dragonia: LocationDef = {
  id: 'dragonia',
  name: 'Dragonia',
  music: 'dungeon',
  rows: rows(`
MMMMMMMMMMMMMMMMMMMMMMMM
MMMM^^^^^^^^^^^^^^^^MMMM
MM^^^......,,.....^^^^MM
M^^.......,,,......^^^^M
M^..vv....,,....vv...^^M
M^..vv....,,....vv....^M
M^.......,,,..........^M
M^..###..,,....###....^M
M^..#F#..,,....#F#....^M
M^..#D#..,,....#D#....^M
M^.......,,...........^M
M^^......,,..........^^M
MM^......,,..vvv.....^MM
MM^^....,,,..vvv....^^MM
MMM^....,,...........^MM
MMM^^...,,.........^^MMM
MMMM^^..,,........^^MMMM
MMMMM^^.,,.......^^MMMMM
MMMMMM^^,,^^^^^^^MMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMM
`),
  onEnter: (g) => {
    if (g.flags['won:b15']) {
      if (g.flags.dragonia_after) return [];
      return [{ flag: 'dragonia_after' }, 'Dragon Elder: Kane\'s army is broken. Come to my cave, young swordsman. There is one here who wishes to go with you.'];
    }
    if (g.flags.dragonia_arrived) return [];
    return [
      { flag: 'dragonia_arrived' },
      'Lowe: Dragonia... the valley of the last dragons. Even the air feels old.',
      'Dragon Elder: Humans. More humans. The masked one brought an army here to dig for the dragon key. He camps at the head of the valley.',
      'Max: Kane. This time he will not escape.',
    ];
  },
  npcs: [
    npc('dragon_elder', 5, 8, { body: 'bigdragon', pal: { cloth: '#60a070', trim: '#e0d0a0', extra: '#305040' } }, [
      { if: 'won:b15', then: [
        { if: 'bleu_joined', then: ['Dragon Elder: Bleu is young, but dragons grow quickly. Take care of him, and he will take care of you.'], else: [
          'Dragon Elder: Bleu, my youngest, has decided to follow you. He is small now. He will not stay small.',
          'Bleu: Kyu! Kyu!',
          { join: 'bleu' },
          { flag: 'bleu_joined' },
          'Dragon Elder: The road east leads to Rudo, and beyond it the fallen kingdom of Prompt. Darksol digs there for the machines of the Ancients.',
        ] },
      ], else: ['Dragon Elder: The masked one waits at the head of the valley. Dragons do not fight the wars of men... but I will not weep for Runefaust.'] },
    ], { name: 'Dragon Elder', facePlayer: false }),
    npc('bleu_npc', 16, 8, { body: 'dragon', pal: { cloth: '#40a060', trim: '#e0d070', extra: '#2070a0' } }, ['Bleu: Kyu? Kyu!'], { name: 'Bleu', member: 'bleu', wander: true }),
    npc('dragon_kid', 14, 15, { body: 'dragon', pal: { cloth: '#c08040', trim: '#f0e0a0', extra: '#804020' } }, ['Young dragon: The masked human shouts in his sleep. "Brother", he says. Strange.'], { wander: true }),
    nova('nova_d', 5, 14),
    priest('priest_d', 16, 13, 'Hermit: I came to Dragonia to pray among the ancients. I can save your journey here.'),
  ],
  chests: [{ x: 2, y: 3, item: 'chrome_lance' }, { x: 21, y: 3, item: 'healing_drop' }, { x: 20, y: 16, gold: 500 }],
  exits: [
    { x: 11, y: 2, w: 2, dest: (g) => (g.flags['won:b15'] ? { location: 'dragonia', x: 11, y: 3, dir: 'down' } : { battle: 'b15' }) },
    { x: 8, y: 18, w: 2, cond: (g) => !!g.flags['won:b15'], blockText: 'Max: We cannot leave with Kane still here.', dest: () => ({ location: 'rudo', x: 2, y: 9, dir: 'right' }) },
  ],
};

const b14: BattleDef = {
  id: 'b14',
  name: 'The Strait of Waral',
  chapter: 5,
  music: 'boss',
  rows: rows(`
~~~~~~~~~~~~~~~~~~~~~~
~~~BBBBBBBBBBBBBBBB~~~
~~~BBBBBBBBBBBBBBBB~~~
~~~BBBBBBBBBBBBBBBB~~~
~~~BBBBBBBBBBBBBBBB~~~
~~~~~~~~~==~~~~~~~~~~~
~~~~~~~~~==~~~~~~~~~~~
~~~BBBBBBBBBBBBBBBB~~~
~~~BBBBBBBBBBBBBBBB~~~
~~~BBBBBBBBBBBBBBBB~~~
~~~BBBBBBBBBBBBBBBB~~~
~~~BBBBBBBBBBBBBBBB~~~
~~~~~~~~~~~~~~~~~~~~~~
`),
  spawns: [[9, 10], [10, 10], [8, 10], [11, 10], [9, 11], [10, 11], [8, 11], [11, 11], [7, 10], [12, 10], [7, 11], [12, 11]],
  enemies: [
    { type: 'jet', x: 5, y: 8, ai: 'aggressive', level: 12 },
    { type: 'jet', x: 15, y: 8, ai: 'aggressive', level: 12 },
    { type: 'lizardman', x: 9, y: 7, level: 12 },
    { type: 'lizardman', x: 11, y: 7, level: 12 },
    { type: 'jet', x: 10, y: 5 },
    { type: 'dark_elf', x: 6, y: 3 },
    { type: 'dark_elf', x: 14, y: 3 },
    { type: 'durahan', x: 9, y: 3 },
    { type: 'durahan', x: 12, y: 3 },
    { type: 'dark_priest', x: 8, y: 1, level: 13, ai: 'healer' },
    { type: 'mishaela', x: 11, y: 1, boss: true, ai: 'boss' },
  ],
  winCondition: 'boss',
  chests: [{ x: 3, y: 1, item: 'turbo_pepper' }, { x: 18, y: 1, gold: 500 }],
  intro: [
    'Mishaela: So the swordsman comes to me at last. My Marionette told me so much about you.',
    'Mishaela: Darksol wants you dead, but I think I will keep your pretty head as a puppet. Board them!',
    'Max: Across the plank! Take her ship!',
  ],
  outro: [
    'Mishaela: No... Darksol, my master... forgive your... servant...',
    'Lyle: The witch is finished! The strait is ours.',
    'Captain: Set sail for Dragonia!',
  ],
  after: { location: 'dragonia', x: 11, y: 18, dir: 'up' },
};

const b15: BattleDef = {
  id: 'b15',
  name: 'Head of the Valley',
  chapter: 5,
  music: 'boss',
  rows: rows(`
MMMMMMMMMMMMMMMMMMMMMM
MMM^^^......^^^.vv^MMM
MM^^.........^^..vv^MM
M^^...vv.........^^^^M
M^....vv..^^.......^^M
M^........^^........^M
M^.vv............vv.^M
M^.vv.....^^.....vv.^M
M^........^^........^M
M^..................^M
M^^......vvv.......^^M
MM^......vvv......^^MM
MM^^.............^^MMM
MMM^..^^.....^^..^MMMM
MMM^^............^MMMM
MMMM^^.........^^MMMMM
MMMMM^^.......^^MMMMMM
MMMMMMMMMMMMMMMMMMMMMM
`),
  spawns: [[9, 15], [10, 15], [11, 15], [9, 14], [10, 14], [11, 14], [8, 15], [12, 15], [8, 14], [12, 14], [10, 13], [9, 13]],
  enemies: [
    { type: 'hellhound', x: 7, y: 11, ai: 'aggressive', level: 13 },
    { type: 'hellhound', x: 14, y: 11, ai: 'aggressive', level: 13 },
    { type: 'wyvern', x: 4, y: 9, level: 13 },
    { type: 'wyvern', x: 17, y: 9, level: 13 },
    { type: 'dark_elf', x: 6, y: 6 },
    { type: 'dark_elf', x: 15, y: 6 },
    { type: 'durahan', x: 9, y: 5 },
    { type: 'durahan', x: 12, y: 5 },
    { type: 'wyvern', x: 10, y: 3, level: 14 },
    { type: 'dark_mage', x: 7, y: 2, level: 14 },
    { type: 'dark_mage', x: 13, y: 2, level: 14 },
    { type: 'kane', x: 10, y: 1, boss: true, ai: 'boss' },
  ],
  winCondition: 'boss',
  chests: [{ x: 3, y: 2, item: 'broad_sword' }, { x: 19, y: 5, gold: 600 }],
  intro: [
    'Kane: You again, boy. You have grown since Guardiana.',
    'Kane: Darksol has what he wanted from this valley. You are only here to die.',
    'Max: Varios died by your hand. Guardiana burned by your order. This ends here, Kane!',
  ],
  outro: [
    { music: 'dark' },
    'Kane: Urgh... the mask... it is cracking...',
    'Kane: ...Where am I? Max? Is that... you? ...Little brother?',
    'Max: What?! What are you saying?',
    'Kane: Darksol put this mask on me years ago. It made me his puppet. I remember everything now... Guardiana... Varios... Forgive me.',
    'Kane: Darksol has gone to Prompt, the fallen kingdom, to wake the machines of the Ancients. Then Runefaust... and the Dark Dragon.',
    'Kane: I will go ahead and do what I can. Stop him, Max. Stop him for both of us.',
    'Lowe: He is gone... Max, are you all right?',
    'Max: ...I have a brother. And Darksol took him from me. Let us go. To Prompt.',
  ],
  after: { location: 'dragonia', x: 11, y: 3, dir: 'down' },
};

registerLocations([waral, dragonia]);
registerBattles([b14, b15]);
