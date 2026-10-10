import type { BattleDef, LocationDef } from '../../types';
import { registerLocations } from '../locations';
import { registerBattles } from '../battles';
import { S, npc, shopkeeper, priest, nova, SHOP, rows } from './common';

const guardiana: LocationDef = {
  id: 'guardiana',
  name: 'Guardiana',
  music: 'town',
  churchPos: { x: 22, y: 15 },
  rows: rows(`
################################
#FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF#
#F+FFFFFFFFFFFCCCCFFFFFFFFFFF+F#
#FFFFFFFFFFFFFCCCCFFFFFFFFFFFFF#
#F+FFFFFFFFFFFCCCCFFFFFFFFFFF+F#
#FFFFFFFFFFFFFCCCCFFFFFFFFFFFFF#
#F+FFFFFFFFFFFCCCCFFFFFFFFFFF+F#
#FFFFFFFFFFFFFCCCCFFFFFFFFFFFFF#
###############DD###############
.....,,,,,,,,,,,,,,,,,,,,,......
.TT..,........,,,,........,..TT.
.TT..,.RRRRR..,,,,..RRRRR.,..TT.
.....,.#####..,,,,..#####.,.....
.....,.#kFk#..,,,,..#aFa#.,.....
.....,.#ccc#..,,,,..#FFF#.,.....
.....,.#FFF#..,,,,..#FFF#.,.....
.....,.##D##..,,,,..##D##.,.....
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
..RRRRR..,...RRRRR...,..RRRRR...
..#####..,...#####...,..#####...
..#FFF#..,...#xFF#...,..#FFF#...
..#ccc#..,...#FFF#...,..#cFF#...
..#FFF#..,...#FFF#...,..#FFF#...
..##D##..,...##D##...,..##D##...
.........,...........,..........
.T.......,,,,,,,,,,,,,..........
.TT......T....,.....T.......TT..
..T...........,..............T..
%%%%%%%%%%%%%.,.%%%%%%%%%%%%%%%%
..............,.................
`),
  onEnter: (g) => {
    if (g.flags.ch1_started) return [];
    return [
      { chapter: 1 },
      { flag: 'ch1_started' },
      'Lowe: Max! There you are. The king has summoned you to the castle at once.',
      'Lowe: Soldiers of Runefaust have been seen near the Gate of the Ancients. Varios wants us ready.',
      'Max: Then let us not keep the king waiting. The castle is to the north.',
    ];
  },
  npcs: [
    npc('king', 15, 3, S.king(), [
      { if: 'king_talked', then: ['King: Go, Max. Investigate the Gate of the Ancients, and may the light protect you.'], else: [
        'King: Max, apprentice of Varios. Runefaust marches on the Gate of the Ancients.',
        'King: Legend says the Dark Dragon sleeps behind that gate. If Runefaust opens it, all of Rune is doomed.',
        'King: Take the young warriors of Guardiana and see what Runefaust is doing there. Nova will advise you.',
        'Max: I will not fail you, Your Majesty.',
        { flag: 'king_talked' },
        { gold: 200 },
        'King: The gate guards have been told to let you pass. Prepare well before you go.',
      ] },
    ], { name: 'King', dir: 'down' }),
    npc('varios', 17, 4, S.soldier('#c0c8d8', '#802020'), [
      'Varios: Max, remember your training. Keep your friends close and strike where the enemy is weak.',
      'Varios: Mae is still too young to go with you. I will keep her here... though she will argue.',
    ], { name: 'Varios' }),
    npc('mae_castle', 9, 3, { body: 'centaur', pal: { skin: '#f0c090', hair: '#f8d840', cloth: '#f080a0', armor: '#f0a0c0', mount: '#f0f0f0' }, hair: 'long', weapon: 'lance' }, [
      'Mae: Father will not let me go with you. It is not fair! I can fight as well as Ken.',
    ], { name: 'Mae', member: 'mae' }),
    npc('guard_l', 12, 5, S.soldier(), ['Guard: Hail, Max. The king is expecting you.'], { dir: 'right' }),
    npc('guard_r', 18, 5, S.soldier(), ['Guard: Those Runefaust dogs will learn to fear Guardiana!'], { dir: 'left' }),
    npc('anri_castle', 20, 2, { body: 'mage', pal: { skin: '#f0c090', hair: '#8060e0', cloth: '#3050c0', trim: '#f0f0f8', extra: '#80d8ff' }, hair: 'long', weapon: 'staff' }, [
      'Anri: I am leaving for Manarina today to continue my studies. Take care of my father, Max.',
    ], { name: 'Anri', member: 'anri' }),
    priest('priest', 22, 14, 'Priest: May the light be with you, child.'),
    shopkeeper('weapons', 9, 13, SHOP.guardiana),
    shopkeeper('items', 4, 20, ['medical_herb', 'antidote', 'healing_seed']),
    nova('nova', 15, 20),
    npc('barkeep', 25, 20, S.merchant('#604020'), ['Barkeep: Gort has been in here every day since he retired. Maybe you can get him moving.'], { facePlayer: false }),
    npc('gort', 27, 21, { body: 'dwarf', pal: { skin: '#f0c090', hair: '#a0a0a0', cloth: '#a04030', armor: '#8090a0' }, hair: 'beard', weapon: 'axe' }, [
      { if: 'king_talked', then: [
        'Gort: You are going to fight Runefaust? Hah! I was swinging an axe before you were born.',
        { ask: 'Gort: Let an old dwarf come along. What do you say?', yes: ['Gort: Good lad! Let us crack some skulls.', { join: 'gort' }], no: ['Gort: Suit yourself. I will be right here.'] },
      ], else: ['Gort: Hic... Another ale, barkeep! What? Not until the king calls? Bah.'] },
    ], { name: 'Gort', member: 'gort' }),
    npc('gong', 3, 10, { body: 'human', pal: { skin: '#e0b080', hair: '#e0b080', cloth: '#f09030', trim: '#f8e0c0' }, hair: 'bald', weapon: 'none' }, [
      'Gong: I am a monk, wandering from the far east. I sense great darkness gathering beyond the gate.',
      { ask: 'Gong: My fists and my prayers are yours, if you will have them. Shall I join you?', yes: ['Gong: Then let us walk the path together.', { join: 'gong' }], no: ['Gong: I will wait here and meditate.'] },
    ], { name: 'Gong', member: 'gong' }),
    npc('woman', 10, 24, S.woman(), ['Woman: The soldiers say goblins have been seen on the south road. Be careful out there.'], { wander: true }),
    npc('kid', 20, 25, S.kid(), ['Boy: When I grow up I want to be a knight like Ken!'], { wander: true }),
    npc('oldman', 28, 9, S.old(), ['Old man: The Gate of the Ancients... They say a terrible dragon sleeps behind it. Just stories, I hope.'], { wander: true }),
    npc('gate_guard', 13, 27, S.soldier(), [
      { if: 'king_talked', then: ['Guard: The road south leads to the Gate of the Ancients. Good luck, Max.'], else: ['Guard: Nobody leaves until the king gives the order.'] },
    ], { dir: 'right' }),
    npc('gate_guard2', 15, 27, S.soldier(), ['Guard: Did you visit the shops? You will need more than a short sword out there.'], { dir: 'left' }),
    npc('scholar', 2, 14, S.mage('#604080'), ['Scholar: Press C to open the menu. Member, Item, Magic and Search. The church can save your progress.'], { wander: false }),
  ],
  chests: [{ x: 29, y: 22, item: 'medical_herb' }, { x: 3, y: 13, gold: 50 }],
  searches: [{ x: 27, y: 1, text: 'Max searched behind the throne... and found a hidden pouch!', gold: 100 }],
  exits: [
    { x: 14, y: 29, w: 2, cond: (g) => !!g.flags.king_talked, blockText: 'Guard: Nobody leaves until the king gives the order.', dest: (g) => (g.flags['won:b1'] ? { location: 'gate_road', x: 10, y: 17 } : { battle: 'b1' }) },
  ],
};

const gateRoad: LocationDef = {
  id: 'gate_road',
  name: 'Gate of the Ancients',
  music: 'dungeon',
  rows: rows(`
#########GG#########
#########FF#########
rrrrrrrr.FF.rrrrrrrr
rr....r..FF..r....rr
r......r.FF.r......r
.......r.FF.r.......
^^.....rrFFrr.....^^
^^.......FF.......^^
.........FF.........
..TT.....FF.....TT..
.TTT.....FF.....TTT.
.........FF.........
.......,,,,,,.......
.....,,,....,,,.....
T...,,........,,...T
TT..,..........,..TT
TTT.,..........,.TTT
TTTT,,,,,,,,,,,,,TTT
`),
  onEnter: (g) => {
    if (g.flags['won:b2']) return [];
    return ['Lowe: The Gate of the Ancients... I can feel something evil behind it. Runefaust soldiers are everywhere!'];
  },
  npcs: [],
  exits: [
    { x: 9, y: 2, w: 2, dest: (g) => (g.flags['won:b2'] ? { location: 'guardiana', x: 14, y: 28, dir: 'up' } : { battle: 'b2' }) },
    { x: 4, y: 17, w: 13, dest: (g) => (g.flags['won:b2'] ? { location: 'alterone', x: 14, y: 26, dir: 'up' } : { location: 'guardiana', x: 14, y: 28, dir: 'up' }) },
  ],
};

const alterone: LocationDef = {
  id: 'alterone',
  name: 'Alterone',
  music: 'castle',
  churchPos: { x: 24, y: 20 },
  rows: rows(`
##############################
#FFFFFFFFFFFFFFFFFFFFFFFFFFFF#
#F+FFFFFFFFFFCCCCFFFFFFFFF+FF#
#FFFFFFFFFFFFCCCCFFFFFFFFFFFF#
#F+FFFFFFFFFFCCCCFFFFFFFFF+FF#
#FFFFFFFFFFFFCCCCFFFFFFFFFFFF#
######FFF#####DD#####FFF######
#####GFFFG###FFFF###GFFFG#####
#####GFFFG###FFFF###GFFFG#####
#####GGGGG###FFFF###GGGGG#####
#####################FFFF#####
.....,,,,,,,,,,,,,,,,FFFF,....
.....,.RRRRR....,....RRRRR....
..T..,.#####....,....#####....
..T..,.#kFk#....,....#aFa#....
.....,.#ccc#....,....#FFF#....
.....,.#FFF#....,....#FFF#....
.....,.##D##....,....##D##....
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
..RRRRR...,.....RRRRR.........
..#####...,.....#####....T....
..#FFF#...,.....#xFF#...TT....
..#ccc#...,.....#FFF#....T....
..#FFF#...,.....#FFF#.........
..##D##...,.....##D##.........
..........,...................
.........,,,,.................
`),
  onEnter: (g) => {
    if (g.flags['won:b3']) return [];
    if (g.flags.alterone_prison) return [];
    return [
      'Soldier: Halt! You are the ones from Guardiana. King Alterone wishes to see you... immediately.',
      { warp: { location: 'alterone', x: 14, y: 5, dir: 'up' } },
      'King Alterone: So you are Max, the swordsman of Guardiana. Welcome.',
      'King Alterone: ...Forgive me. Runefaust has promised to spare my kingdom if I hand you over. Guards!',
      { fade: 'out' },
      { flag: 'alterone_prison' },
      { warp: { location: 'alterone', x: 7, y: 8, dir: 'down' } },
      { fade: 'in' },
      'Lowe: A dungeon! That treacherous king sold us to Runefaust!',
      'Khris: Psst... over here. I am Khris, a priestess of this castle. The king is terrified of Darksol, but what he did is wrong.',
      'Khris: I have the key. Runefaust soldiers are already in the throne room. If you can drive them out, the king may come to his senses.',
      { join: 'khris' },
      { flag: 'alterone_freed' },
      'Khris: Quickly! Through the gate and up the stairs!',
    ];
  },
  npcs: [
    npc('king_alt', 14, 3, S.king('#404080'), [
      { if: 'won:b3', then: [
        'King Alterone: You have saved my kingdom and shamed me. I was a coward.',
        { if: 'alterone_reward', then: ['King Alterone: Take the eastern road to Rindo. A ship there can carry you after Runefaust.'], else: [
          'King Alterone: Take this gold, and my apologies. Runefaust marches east toward Rindo. Go after them.',
          { gold: 300 },
          { item: 'healing_seed' },
          { flag: 'alterone_reward' },
          'King Alterone: Khris, go with them. Serve them as you served me.',
        ] },
      ], else: ['King Alterone: ...'] },
    ], { name: 'King Alterone' }),
    npc('alt_guard', 12, 5, S.soldier('#8090a0', '#404080'), ['Guard: The king has been strange since the Runefaust envoy came.'], { dir: 'right', cond: (g) => !!g.flags['won:b3'] }),
    npc('cell_guard', 4, 5, S.soldier('#8090a0', '#404080'), ['Guard: Zzz... huh? ...Zzz...'], { cond: (g) => !g.flags['won:b3'], dir: 'right' }),
    priest('priest_alt', 22, 15, 'Priest: Alterone is a small kingdom, but our faith is strong.'),
    shopkeeper('weapons_alt', 9, 14, SHOP.alterone),
    shopkeeper('items_alt', 4, 21, ['medical_herb', 'healing_seed', 'antidote', 'angel_wing']),
    nova('nova_alt', 18, 21),
    npc('villager_alt', 26, 25, S.man('#608040'), ['Man: East of here lies Rindo, the port town. Runefaust soldiers passed through this morning.'], { wander: true }),
    npc('villager_alt2', 5, 25, S.woman('#c08040'), ['Woman: The king locked up some travelers from Guardiana. Poor things.'], { wander: true, cond: (g) => !g.flags['won:b3'] }),
    npc('villager_alt3', 5, 25, S.woman('#c08040'), ['Woman: Thank you for saving the castle! The king is a good man... usually.'], { wander: true, cond: (g) => !!g.flags['won:b3'] }),
  ],
  chests: [{ x: 27, y: 1, item: 'power_potion' }, { x: 22, y: 8, gold: 120 }],
  exits: [
    { x: 14, y: 6, w: 2, cond: (g) => !!g.flags.alterone_freed, blockText: 'The doors are locked.', dest: (g) => (g.flags['won:b3'] ? { location: 'alterone', x: 14, y: 5, dir: 'up' } : { battle: 'b3' }) },
    { x: 9, y: 26, w: 4, cond: (g) => !!g.flags['won:b3'], blockText: 'Khris: We cannot leave with Runefaust in the castle!', dest: () => ({ location: 'rindo', x: 1, y: 10, dir: 'right' }) },
  ],
};

const b1: BattleDef = {
  id: 'b1',
  name: 'Guardiana Outskirts',
  chapter: 1,
  music: 'battle',
  rows: rows(`
TTTTTTTTT,,TTTTTTTTT
TT.......,,.......TT
T.....^^.,,...^^...T
T....^^..,,..^^....T
......T..,,..T......
~~~~~~~~~==~~~~~~~~~
~~~~~~~~~==~~~~~~~~~
.....TT..,,..TT.....
....T....,,....T....
.........,,.........
T..^.....,,.....^..T
T.^^.....,,.....^^.T
T........,,........T
TT.......,,.......TT
TTT......,,......TTT
TTTT....,,,,....TTTT
`),
  spawns: [[9, 13], [10, 13], [9, 14], [10, 14], [8, 13], [11, 13], [8, 14], [11, 14], [9, 15], [10, 15], [8, 15], [11, 15]],
  enemies: [
    { type: 'goblin', x: 8, y: 9, ai: 'aggressive' },
    { type: 'goblin', x: 12, y: 9, ai: 'aggressive' },
    { type: 'goblin', x: 4, y: 10 },
    { type: 'goblin', x: 15, y: 10 },
    { type: 'dwarf', x: 9, y: 4 },
    { type: 'dwarf', x: 11, y: 3 },
    { type: 'rune_knight', x: 10, y: 1, boss: true },
  ],
  chests: [{ x: 1, y: 8, item: 'medical_herb' }],
  intro: ['Lowe: Goblins on the road! They must be Runefaust scouts.', 'Max: Everyone, stay together. Let them come to us.'],
  after: { location: 'gate_road', x: 10, y: 16, dir: 'up' },
};

const b2: BattleDef = {
  id: 'b2',
  name: 'Gate of the Ancients',
  chapter: 1,
  music: 'battle',
  rows: rows(`
#########GG#########
#########FF#########
rrrrrrrr.FF.rrrrrrrr
rr....r..FF..r....rr
r......r.FF.r......r
.......r.FF.r.......
^^.....rrFFrr.....^^
^^.......FF.......^^
.........FF.........
..TT.....FF.....TT..
.TTT.....FF.....TTT.
.........FF.........
.......,,,,,,.......
.....,,,....,,,.....
T...,,........,,...T
TT..,..........,..TT
TTT.,..........,.TTT
TTTT,,,,,,,,,,,,,TTT
`),
  spawns: [[9, 15], [10, 15], [8, 15], [11, 15], [9, 16], [10, 16], [8, 16], [11, 16], [7, 15], [12, 15], [7, 16], [12, 16]],
  enemies: [
    { type: 'goblin', x: 5, y: 12, ai: 'aggressive' },
    { type: 'goblin', x: 14, y: 12, ai: 'aggressive' },
    { type: 'goblin', x: 9, y: 11 },
    { type: 'dwarf', x: 3, y: 8 },
    { type: 'dwarf', x: 16, y: 8 },
    { type: 'dwarf', x: 10, y: 8 },
    { type: 'dark_dwarf', x: 9, y: 5 },
    { type: 'rune_knight', x: 7, y: 4 },
    { type: 'rune_knight', x: 12, y: 4 },
    { type: 'rune_knight', x: 10, y: 2, boss: true, level: 4 },
  ],
  chests: [{ x: 1, y: 3, gold: 80 }, { x: 18, y: 3, item: 'healing_seed' }],
  intro: ['Max: Runefaust soldiers are guarding the gate. We have to break through!'],
  outro: [
    { music: 'dark' },
    'Kane: So this is the little force of Guardiana. You are too late, boy.',
    'Kane: The Gate of the Ancients is open. Darksol will have what he seeks.',
    'Max: Who are you?! Wait!',
    'Lowe: He vanished into the gate... Max, look! Someone is coming from the road!',
    'Mae: Max! Guardiana... Guardiana has fallen! Runefaust attacked after you left.',
    'Mae: My father... Varios... he fell defending the king. The king lives, but he told me to find you.',
    'Mae: He says you must follow Runefaust east, to Alterone. I am coming with you. Do not try to stop me.',
    { join: 'mae' },
    'Max: Varios... I swear we will avenge him. To Alterone!',
  ],
  after: { location: 'gate_road', x: 10, y: 4, dir: 'down' },
};

const b3: BattleDef = {
  id: 'b3',
  name: 'Alterone Castle',
  chapter: 1,
  music: 'battle',
  rows: rows(`
####################
#FFFFFFFFFFFFFFFFFF#
#F+FFFFFCCCCFFFFF+F#
#FFFFFFFCCCCFFFFFFF#
#F+FFFFFCCCCFFFFF+F#
#FFFFFFFCCCCFFFFFFF#
#F+FFFFFCCCCFFFFF+F#
#FFFFFFFCCCCFFFFFFF#
#F+FFFFFCCCCFFFFF+F#
#FFFF#FFCCCCFF#FFFF#
#FFFF#FFFFFFFF#FFFF#
###FF#######F#FFF###
#FFFF#FFFFFFF#FFFFF#
#FFFF#FFFFFFF#FFFFF#
####################
`),
  spawns: [[9, 12], [10, 12], [8, 12], [11, 12], [9, 13], [10, 13], [8, 13], [11, 13], [7, 12], [12, 12], [7, 13], [12, 13]],
  enemies: [
    { type: 'goblin', x: 7, y: 9, ai: 'aggressive' },
    { type: 'goblin', x: 12, y: 9, ai: 'aggressive' },
    { type: 'dark_dwarf', x: 4, y: 7 },
    { type: 'dark_dwarf', x: 15, y: 7 },
    { type: 'rune_knight', x: 6, y: 4 },
    { type: 'rune_knight', x: 13, y: 4 },
    { type: 'dark_priest', x: 9, y: 3, ai: 'healer' },
    { type: 'rune_knight', x: 10, y: 2, boss: true, level: 5 },
  ],
  winCondition: 'all',
  intro: ['Rune Knight: The prisoners have escaped! Kill them all, and the king of Alterone too!', 'Khris: They mean to kill everyone! We must stop them!'],
  outro: [
    'King Alterone: You... you saved us, even after what I did.',
    'Max: Runefaust spares no one, Your Majesty. Not even those who kneel to them.',
    'King Alterone: I see that now. Come to the throne room. I will give you what help I can.',
    { flag: 'alterone_freed' },
  ],
  after: { location: 'alterone', x: 14, y: 5, dir: 'up' },
};

registerLocations([guardiana, gateRoad, alterone]);
registerBattles([b1, b2, b3]);
