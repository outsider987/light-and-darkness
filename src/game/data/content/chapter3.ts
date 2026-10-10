import type { BattleDef, LocationDef } from '../../types';
import { registerLocations } from '../locations';
import { registerBattles } from '../battles';
import { S, npc, shopkeeper, priest, nova, innkeeper, SHOP, rows } from './common';
import { hasItem } from '../../state';

const bustoke: LocationDef = {
  id: 'bustoke',
  name: 'Bustoke',
  music: 'town',
  rows: rows(`
MMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMM^^^^^^^^^^^^^^^^^^^^^^MMM
MM^^.....,...^^^^......^^^MM
M^.......,.....^^.......^^^M
M^...RRRRR.....,........^^^M
M....#####.....,.RRRRR...^^M
M....#kFk#.....,.#####...^^M
.....#ccc#.....,.#aFa#....^M
.....#FFF#.....,.#FFF#....^M
.....##D##.....,.#FFF#.....M
,,,,,,,,,,,,,,,,,##D##....,,
,........,.......,.........,
,.RRRRR..,.RRRRR.,.##G##...,
,.#####..,.#####.,.#FFF#...,
,.#FFF#..,.#xFF#.,.#FFF#...,
,.#ccc#..,.#FFF#.,.#####...,
,.#FFF#..,.#FFF#.,.........,
,.##D##..,.##D##.,.........,
,........,.......,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,.........,
,.........T........T.......,
~~~.......TT......TT......^^
~~~~......T.......T......^^^
~~~~~....................^^^
`),
  churchPos: { x: 19, y: 9 },
  onEnter: (g) => {
    if (g.flags.bustoke_arrived) return [];
    return [
      { chapter: 3 },
      { flag: 'bustoke_arrived' },
      'Lowe: Bustoke, the mining town. Runefaust ships were here... but the soldiers have moved on into the mountains.',
      'Elder: Travelers! Please, we need help. Runefaust took the mountain pass, and a werewolf has been caged in our square.',
    ];
  },
  npcs: [
    npc('elder', 24, 13, S.old('#406080'), [
      { if: 'zylo_cured', then: [
        { if: 'won:b9', then: ['Elder: The pass is open. Beyond the mountains lies the prairie where Pao, the wandering town, roams.'], else: ['Elder: Runefaust holds the mountain pass to the north. With Zylo at your side, you may break through.'] },
      ], else: [
        { if: (g) => !!hasItem(g, 'lunar_dew'), then: [
          'Elder: Lunar Dew! You found it in the quarry! Quickly, give it to the poor creature.',
          { takeItem: 'lunar_dew' },
          { flag: 'zylo_cured' },
          'Zylo: ...The rage is gone. I can think clearly again. I am Zylo of the wolf clan. Runefaust cursed me and threw me in this cage.',
          'Zylo: You freed me. My claws are yours until Runefaust pays for what they did.',
          { join: 'zylo' },
        ], else: [
          'Elder: The wolfman in the cage is no monster. Runefaust cursed him. Only Lunar Dew can cure him, and it grows deep in our quarry, east of town.',
          'Elder: But the quarry is full of lizardmen now. Please, if you can reach the dew...',
          { flag: 'quarry_quest' },
        ] },
      ] },
    ], { name: 'Elder' }),
    npc('zylo_cage', 21, 13, { body: 'wolf', pal: { skin: '#8890a0', hair: '#8890a0', cloth: '#3050c0', trim: '#f0f0f0' }, hair: 'short', weapon: 'claw' }, ['Zylo: GRRRR...!'], { name: 'Zylo', member: 'zylo', facePlayer: false }),
    npc('kokichi', 20, 3, { body: 'human', pal: { skin: '#f0c090', hair: '#a0a0a0', cloth: '#d0a030', armor: '#8090a0' }, hair: 'propeller', weapon: 'lance' }, [
      'Kokichi: Behold! My flying machine! One pull of this cord and I shall soar like a bird!',
      { ask: 'Kokichi: I need a test flight... Say, you fight Runefaust? Take me along!', yes: ['Kokichi: Splendid! Watch the skies, Runefaust!', { join: 'kokichi' }], no: ['Kokichi: Your loss! The sky is the future!'] },
    ], { name: 'Kokichi', member: 'kokichi' }),
    npc('guntz', 25, 17, { body: 'dwarf', pal: { skin: '#f0c090', hair: '#705030', cloth: '#507050', armor: '#8898a0' }, hair: 'helmet', weapon: 'lance' }, [
      'Guntz: This steam armor took me ten years to build. Nobody in Bustoke takes it seriously.',
      { ask: 'Guntz: You look like people who could use a walking wall. Shall I come?', yes: ['Guntz: Ha! Stand behind me, little ones.', { join: 'guntz' }], no: ['Guntz: Fine. More time to polish the pistons.'] },
    ], { name: 'Guntz', member: 'guntz' }),
    shopkeeper('weapons_b', 7, 6, SHOP.bustoke),
    shopkeeper('items_b', 3, 14, ['medical_herb', 'healing_seed', 'antidote', 'angel_wing']),
    priest('priest_b', 19, 8, 'Priest: Even in the mines, the light finds a way.'),
    nova('nova_b', 13, 14),
    innkeeper('inn_b', 13, 16, 40),
    npc('miner', 6, 20, S.man('#806040', '#303030'), ['Miner: The quarry east of town is where we dug up the old machines. Eyes made of metal that shoot fire...'], { wander: true }),
    npc('miner2', 22, 20, S.dwarf('#604030'), ['Miner: Pao, the town on wheels, is somewhere on the prairie beyond the pass. It never stays put.'], { wander: true }),
    npc('child_b', 15, 11, S.kid('#d04040'), ['Girl: The wolfman howls every night. The elder says he is sad, not angry.'], { wander: true }),
  ],
  chests: [{ x: 26, y: 2, item: 'legs_of_haste' }, { x: 1, y: 20, gold: 250 }],
  searches: [{ x: 2, y: 2, text: 'Max searched the rocks... and found a Healing Drop hidden by a miner!', item: 'healing_drop' }],
  exits: [
    { x: 0, y: 7, h: 3, dest: () => ({ location: 'rindo', x: 20, y: 5, dir: 'down' }) },
    { x: 27, y: 10, h: 2, cond: (g) => !!g.flags.quarry_quest || !!g.flags.zylo_cured, blockText: 'Miner: The quarry is dangerous. Talk to the elder first.', dest: (g) => (g.flags['won:b8'] ? { location: 'bustoke', x: 26, y: 11, dir: 'left' } : { battle: 'b8' }) },
    { x: 9, y: 2, cond: (g) => !!g.flags.zylo_cured, blockText: 'Soldier: Runefaust holds the pass! Nobody gets through... not without help.', dest: (g) => (g.flags['won:b9'] ? { location: 'pao_prairie', x: 10, y: 10, dir: 'up' } : { battle: 'b9' }) },
  ],
};

const paoPrairie: LocationDef = {
  id: 'pao_prairie',
  name: 'Pao Prairie',
  music: 'sea',
  rows: rows(`
....................
..*...T.......*.....
.........*..........
...T.........T......
.....*..........*...
..........T.........
.*......*......T....
......T.......*.....
...*......*.........
.........,,.........
.........,,...T.....
TTTT.....,,.....TTTT
`),
  onEnter: (g) => {
    if (g.flags['won:b10'] || g.flags.prairie_seen) return [];
    return [
      { flag: 'prairie_seen' },
      'Hans: The prairie! And look, those wagons on the horizon... the moving town of Pao!',
      'Ken: Not so fast. Silver knights, in formation. That is a Runefaust army, and its general is waiting for us.',
    ];
  },
  npcs: [
    npc('nomad', 14, 6, S.man('#c0a060', '#303030'), [
      { if: 'won:b10', then: ['Nomad: Pao waits for you to the north. The general you defeated was Elliott, the most honorable man in Runefaust.'], else: ['Nomad: General Elliott is camped north of here. He gave us food and let us go. A strange enemy...'] },
    ], { wander: true }),
  ],
  exits: [
    { x: 9, y: 11, w: 2, dest: () => ({ location: 'bustoke', x: 9, y: 3, dir: 'down' }) },
    { x: 0, y: 0, w: 20, dest: (g) => (g.flags['won:b10'] ? { location: 'pao', x: 12, y: 17, dir: 'up' } : { battle: 'b10' }) },
  ],
};

const b8: BattleDef = {
  id: 'b8',
  name: 'Bustoke Quarry',
  chapter: 3,
  music: 'dungeon',
  rows: rows(`
MMMMMMMMMMMMMMMMMMMMMM
Mdddd^^MMMddddMMddddMM
Mdd^^^ddddddd^^ddooddM
Md^^ddddoodddd^^ddddoM
Mdddddddddddddddddd^^M
M^^dddo^^dddd^^ddddddM
Mddddd^^ddooddddd^^ddM
MddooddddddddddddddddM
Mdddddd^^ddddddo^^dddM
Mdd^^ddddddd^^ddddddoM
Mdddddddddddddddddd^^M
MModdddodddddddoddddMM
MMMddddddddddddddddMMM
MMMMdddddddddddddMMMMM
MMMMMMddddddddddMMMMMM
MMMMMMMMMMMMMMMMMMMMMM
`),
  spawns: [[10, 13], [11, 13], [9, 13], [12, 13], [10, 12], [11, 12], [9, 12], [12, 12], [8, 13], [13, 13], [8, 12], [13, 12]],
  enemies: [
    { type: 'lizardman', x: 7, y: 9, ai: 'aggressive' },
    { type: 'lizardman', x: 14, y: 9, ai: 'aggressive' },
    { type: 'giant_bat', x: 4, y: 7 },
    { type: 'giant_bat', x: 17, y: 7 },
    { type: 'dwarf', x: 10, y: 7, level: 6 },
    { type: 'dwarf', x: 12, y: 6, level: 6 },
    { type: 'torch_eye', x: 5, y: 3, ai: 'stationary' },
    { type: 'torch_eye', x: 16, y: 3, ai: 'stationary' },
    { type: 'lizardman', x: 10, y: 3 },
    { type: 'dark_mage', x: 11, y: 1, boss: true, ai: 'caster' },
  ],
  chests: [{ x: 1, y: 1, item: 'middle_axe' }, { x: 20, y: 4, gold: 200 }],
  intro: ['Gort: Lizardmen! Big ugly ones. And what are those eyes in the rocks?', 'Luke: Machines of the Ancients. Stay out of their sight!'],
  outro: ['Tao: Look, by the spring! The silver flowers... that must be the Lunar Dew.', { item: 'lunar_dew' }, 'Max: Let us hurry back to Bustoke.'],
  after: { location: 'bustoke', x: 26, y: 11, dir: 'left' },
};

const b9: BattleDef = {
  id: 'b9',
  name: 'Mountain Pass',
  chapter: 3,
  rows: rows(`
MMMMMM^^,,^^MMMMM
MMMM^^^.,,.^^^MMM
MMM^^...,,...^^MM
MM^^....,,....^MM
MM^.....,,.....^M
M^^.T...,,...T.^M
M^.....,,,....^^M
M^....,,......^MM
MM^...,,.....^^MM
MM^^..,,....^^MMM
MMM^..,,,...^MMMM
MM^....,,....^^MM
M^^....,,.....^^M
M^..T..,,..T...^M
M^.....,,......^M
MM^....,,.....^MM
MM^^...,,....^^MM
MMM^...,,...^^MMM
MMM^^..,,..^^MMMM
MMMM^..,,..^MMMMM
MMMM^^,,,,^^MMMMM
MMMMMMMMMMMMMMMMM
`),
  spawns: [[7, 19], [8, 19], [7, 18], [8, 18], [6, 19], [9, 19], [6, 18], [9, 18], [7, 17], [8, 17], [6, 17], [9, 17]],
  enemies: [
    { type: 'hellhound', x: 7, y: 13, ai: 'aggressive' },
    { type: 'hellhound', x: 9, y: 12, ai: 'aggressive' },
    { type: 'sniper', x: 3, y: 13, level: 7 },
    { type: 'sniper', x: 12, y: 13, level: 7 },
    { type: 'pegasus_knight', x: 4, y: 8 },
    { type: 'pegasus_knight', x: 12, y: 8 },
    { type: 'silver_knight', x: 7, y: 6 },
    { type: 'silver_knight', x: 9, y: 5 },
    { type: 'pegasus_knight', x: 8, y: 3 },
    { type: 'dark_mage', x: 8, y: 1, boss: true, ai: 'caster' },
  ],
  chests: [{ x: 3, y: 5, item: 'healing_drop' }, { x: 14, y: 13, item: 'steel_arrow' }],
  intro: ['Zylo: I smell horses... and wings. Pegasus knights above the pass!', 'Max: Keep moving. Archers, watch the sky.'],
  outro: [
    'Pelle: Hold! I am Pelle, a knight of Bustoke. I was tracking this patrol when you arrived. You fight well.',
    { ask: 'Pelle: My lance would serve your cause better than it serves these rocks. May I join you?', yes: ['Pelle: Then forward, to the prairie!', { join: 'pelle' }], no: ['Pelle: As you wish. I will guard the pass.'] },
  ],
  after: { location: 'pao_prairie', x: 10, y: 10, dir: 'up' },
};

const b10: BattleDef = {
  id: 'b10',
  name: "Elliott's Army",
  chapter: 3,
  music: 'boss',
  rows: rows(`
........................
..^^..........T......^^.
..^^....*..........^^^..
.....T.........T........
~~~~~~~~~~~~=~~~~~~~~~~~
~~~~~~~~~~~~=~~~~~~~~~~~
.....*.........*........
..T.......^^.......T....
.........^^^............
....T............*......
.*..........T...........
..........^.........T...
.....T...^^^........^^..
............*...........
...*..........T.........
.T......................
.........,,,,...........
TTTTTTTTT,,,,TTTTTTTTTTT
`),
  spawns: [[10, 15], [11, 15], [12, 15], [10, 16], [11, 16], [12, 16], [9, 15], [13, 15], [9, 16], [13, 16], [10, 14], [12, 14]],
  enemies: [
    { type: 'hellhound', x: 8, y: 11, ai: 'aggressive' },
    { type: 'hellhound', x: 15, y: 11, ai: 'aggressive' },
    { type: 'lizardman', x: 5, y: 9, level: 9 },
    { type: 'lizardman', x: 18, y: 9, level: 9 },
    { type: 'silver_knight', x: 9, y: 7 },
    { type: 'silver_knight', x: 14, y: 7 },
    { type: 'pegasus_knight', x: 3, y: 6, level: 9 },
    { type: 'pegasus_knight', x: 20, y: 6, level: 9 },
    { type: 'dark_mage', x: 10, y: 2, level: 10 },
    { type: 'dark_mage', x: 14, y: 2, level: 10 },
    { type: 'silver_knight', x: 12, y: 3, level: 9 },
    { type: 'elliott', x: 12, y: 1, boss: true, ai: 'boss' },
  ],
  winCondition: 'boss',
  chests: [{ x: 1, y: 1, item: 'shield_ring' }, { x: 22, y: 2, gold: 400 }],
  intro: [
    'Elliott: So you are the Shining Force. I am Elliott, general of Runefaust.',
    'Elliott: I take no joy in this, but I serve my king. Come, let us see whose cause is just.',
    'Max: Your king serves Darksol, Elliott! Open your eyes!',
    'Elliott: ...Perhaps. But a soldier does not choose his orders. Attack!',
  ],
  outro: [
    'Elliott: Well fought... Max of Guardiana. Perhaps you are right about Darksol.',
    'Elliott: Balbazak holds the fortress of Uranbatol beyond Pao. He is nothing like me. Beware him... Urgh.',
    'Max: Rest, Elliott. You were a true knight.',
  ],
  after: { location: 'pao', x: 12, y: 17, dir: 'up' },
};

registerLocations([bustoke, paoPrairie]);
registerBattles([b8, b9, b10]);
