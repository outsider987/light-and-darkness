import type { BattleDef, LocationDef } from '../../types';
import { registerLocations } from '../locations';
import { registerBattles } from '../battles';
import { S, npc, shopkeeper, priest, nova, innkeeper, rows } from './common';

const runefaustGate: LocationDef = {
  id: 'runefaust_gate',
  name: 'Runefaust Border',
  music: 'dark',
  rows: rows(`
####################
#########GG#########
dddddddddFFddddddddd
ddYddddddFFddddddYdd
dddddd^^dFFd^^dddddd
dddddd^^dFFd^^dddddd
dYdddddddFFdddddddYd
dddddddddFFddddddddd
ddddY^^ddFFdd^^Ydddd
dddddddddFFddddddddd
dddddddddFFddddddddd
dddYddddd,,dddddYddd
ddddddddd,,ddddddddd
dddddddd,,,,dddddddd
YYYYYYYY,,,,YYYYYYYY
YYYYYYYYYYYYYYYYYYYY
`),
  onEnter: (g) => {
    if (g.flags.rf_arrived) return [];
    return [
      { chapter: 7 },
      { flag: 'rf_arrived' },
      'Vankar: Runefaust. My old home. Those walls are forty feet thick, and the king has every monster in his dungeons on them.',
      'Max: Darksol is inside, and Ramladu with him. We break the wall, we take the city, we end this.',
    ];
  },
  npcs: [
    npc('refugee', 4, 11, S.woman('#604040'), ['Refugee: They dragged everyone who would not kneel into the castle. My husband... please, stop them.'], { wander: true }),
  ],
  exits: [
    { x: 8, y: 14, w: 4, dest: () => ({ location: 'prompt', x: 24, y: 10, dir: 'left' }) },
    { x: 9, y: 2, w: 2, dest: (g) => (g.flags['won:b19'] ? { location: 'runefaust', x: 13, y: 22, dir: 'up' } : { battle: 'b19' }) },
  ],
};

const runefaust: LocationDef = {
  id: 'runefaust',
  name: 'Runefaust',
  music: 'castle',
  rows: rows(`
############################
#FFFFFFFFFFFFCCCCFFFFFFFFFF#
#F+FFFFFFFFFFCCCCFFFFFFFF+F#
#FFFFFFFFFFFFCCCCFFFFFFFFFF#
#F+FFFFFFFFFFCCCCFFFFFFFF+F#
#FFFFFFFFFFFFCCCCFFFFFFFFFF#
#############GG#############
ssssssssssssssssssssssssssss
s.RRRRR....ss....RRRRR.....s
s.#####....ss....#####.....s
s.#kFk#....ss....#aFa#.....s
s.#ccc#....ss....#FFF#.....s
s.#FFF#....ss....#FFF#.....s
s.##D##....ss....##D##.....s
ssssssssssssssssssssssssssss
s....RRRRR.ss.RRRRR........s
s....#####.ss.#####........s
s....#xFF#.ss.#FFF#........s
s....#FFF#.ss.#cFF#........s
s....#FFF#.ss.#FFF#........s
s....##D##.ss.##D##........s
s..........ss..............s
ssssssssssssssssssssssssssss
`),
  churchPos: { x: 19, y: 12 },
  onEnter: (g) => {
    if (g.flags['won:b21']) {
      if (g.flags.rf_after) return [];
      return [
        { flag: 'rf_after' },
        'Nova: Max... Kane gave his life for you. Ramladu is dead, but Darksol escaped to the Tower of the Ancients.',
        'Nova: The gate he opened in Guardiana leads there. He means to wake the Dark Dragon. We must follow at once.',
      ];
    }
    if (g.flags['won:b20']) return [];
    if (g.flags.rf_city) return [];
    return [
      { flag: 'rf_city' },
      'Citizen: You broke the wall? Quickly, inside! Ramladu\'s soldiers hunt anyone in the streets after dark.',
      'Citizen: The castle gate is guarded by the Colossus, a giant of gold that Darksol dug from the earth. Nothing has ever passed it.',
    ];
  },
  npcs: [
    npc('citizen', 8, 21, S.man('#504050', '#303030'), [
      { if: 'won:b20', then: ['Citizen: You broke the Colossus! Ramladu sits in his throne room with his guard. Go, finish it!'], else: ['Citizen: The Colossus never sleeps. It stands before the castle gate, waiting.'] },
    ], { wander: true }),
    shopkeeper('weapons_rf', 4, 10, ['broad_sword', 'chrome_lance', 'great_axe', 'holy_staff', 'assault_shell', 'healing_drop', 'antidote', 'angel_wing'], ['valkyrie', 'atlas', 'elven_arrow', 'great_rod']),
    priest('priest_rf', 19, 12, 'Priest: We worship in secret here. Ramladu banned the light. He could not ban prayer.'),
    nova('nova_rf', 7, 18),
    innkeeper('inn_rf', 16, 18, 80),
    npc('old_rf', 24, 8, S.old('#403040'), ['Old man: Ramladu was a good king once. Then the priest Darksol came, and the king changed.'], { wander: true }),
    npc('kid_rf', 24, 20, S.kid('#604060'), ['Girl: A ninja lives on the roofs! I saw him. Nobody believes me.'], { wander: true }),
  ],
  chests: [{ x: 1, y: 1, item: 'evil_ring' }, { x: 26, y: 1, item: 'healing_drop' }, { x: 26, y: 21, gold: 1000 }],
  searches: [{ x: 26, y: 15, text: 'A shadow drops silently from the roof. "You are the one Darksol fears. I am Hanzou. My blade has waited for this." The ninja kneels before Max.', join: 'hanzou' }],
  exits: [
    { x: 13, y: 22, w: 2, dest: () => ({ location: 'runefaust_gate', x: 10, y: 3, dir: 'down' }) },
    { x: 13, y: 6, w: 2, dest: (g) => (g.flags['won:b21'] ? { location: 'tower', x: 9, y: 13, dir: 'up' } : g.flags['won:b20'] ? { battle: 'b21' } : { battle: 'b20' }) },
  ],
};

const b19: BattleDef = {
  id: 'b19',
  name: 'The Outer Wall',
  chapter: 7,
  rows: rows(`
######################
#FFFFFFFFFFFFFFFFFFFF#
#FFFFFFFFFFFFFFFFFFFF#
#FFF####FFFFFF####FFF#
####F##F#FFFF#F##F####
#########FFFF#########
dddddddddFFFFddddddddd
ddYdddd^^FFFF^^ddddYdd
dddddddddFFFFddddddddd
dddd^^dddFFFFddd^^dddd
dddddddddFFFFddddddddd
dYddddddFFFFFFddddddYd
ddddddddFFFFFFdddddddd
dddddddddFFFFddddddddd
dddddddddFFFFddddddddd
YYYYYYYYY,,,,YYYYYYYYY
`),
  spawns: [[10, 13], [11, 13], [9, 13], [12, 13], [10, 14], [11, 14], [9, 14], [12, 14], [8, 13], [13, 13], [8, 12], [13, 12]],
  enemies: [
    { type: 'cerberus', x: 8, y: 10, ai: 'aggressive' },
    { type: 'cerberus', x: 13, y: 10, ai: 'aggressive' },
    { type: 'demon', x: 4, y: 8, level: 18 },
    { type: 'demon', x: 17, y: 8, level: 18 },
    { type: 'dark_knight', x: 10, y: 7 },
    { type: 'dark_knight', x: 11, y: 6 },
    { type: 'demon_master', x: 5, y: 4 },
    { type: 'demon_master', x: 16, y: 4 },
    { type: 'high_priest', x: 10, y: 2, ai: 'healer' },
    { type: 'blue_dragon', x: 11, y: 1, boss: true },
  ],
  chests: [{ x: 1, y: 1, item: 'great_rod' }, { x: 20, y: 1, gold: 900 }, { x: 1, y: 14, item: 'bread_of_life' }],
  intro: ['Earnest: Dark knights on the wall, and that blue shape above the gate... a dragon!', 'Max: Break the gate before the dragon breaks us!'],
  after: { location: 'runefaust', x: 13, y: 22, dir: 'up' },
};

const b20: BattleDef = {
  id: 'b20',
  name: 'Castle Gate - The Colossus',
  chapter: 7,
  music: 'boss',
  rows: rows(`
####################
#FFFFFFFFGGFFFFFFFF#
#F+FFFFFFFFFFFFFF+F#
#FFFFFFFFFFFFFFFFFF#
#FFF+FFFFFFFFFF+FFF#
#FFFFFFFFFFFFFFFFFF#
#FFFFFF+FFFF+FFFFFF#
#FFFFFFFFFFFFFFFFFF#
#FF+FFFFFFFFFFFF+FF#
#FFFFFFFFFFFFFFFFFF#
#FFFFFF+FFFF+FFFFFF#
#FFFFFFFFFFFFFFFFFF#
#FFF+FFFFFFFFFF+FFF#
#FFFFFFFFFFFFFFFFFF#
#FFFFFFFFFFFFFFFFFF#
########ssss########
`),
  spawns: [[9, 13], [10, 13], [8, 13], [11, 13], [9, 14], [10, 14], [8, 14], [11, 14], [7, 13], [12, 13], [7, 14], [12, 14]],
  enemies: [
    { type: 'cerberus', x: 9, y: 10, ai: 'aggressive' },
    { type: 'dark_knight', x: 5, y: 8, level: 21 },
    { type: 'dark_knight', x: 14, y: 8, level: 21 },
    { type: 'golem', x: 7, y: 5, level: 20 },
    { type: 'golem', x: 12, y: 5, level: 20 },
    { type: 'demon_master', x: 3, y: 3 },
    { type: 'demon_master', x: 16, y: 3 },
    { type: 'high_priest', x: 9, y: 2, ai: 'healer' },
    { type: 'colossus', x: 10, y: 3, boss: true, ai: 'boss', aggro: 5 },
  ],
  winCondition: 'boss',
  chests: [{ x: 1, y: 1, item: 'valkyrie' }, { x: 18, y: 1, item: 'atlas' }],
  intro: [
    'Lowe: The ground is shaking...',
    'Nova: There! A giant of gold and stone, stepping out of the castle gate. The Colossus of the royal capital!',
    'Colossus: ...INTRUDERS... CRUSH...',
    'Max: It is slow. Surround it, and do not stop hitting until it falls!',
  ],
  outro: [
    'Colossus: ...CRUSH... CR... ...',
    'Adam: The Colossus has shut down. Its core was older than mine. It was never meant to wake.',
    'Max: The castle gate is open. Ramladu is inside. Let us go.',
  ],
  after: { location: 'runefaust', x: 13, y: 7, dir: 'down' },
};

const b21: BattleDef = {
  id: 'b21',
  name: 'Throne Room of Ramladu',
  chapter: 7,
  music: 'boss',
  rows: rows(`
####################
#FFFFFFFFCCFFFFFFFF#
#F+FFFFFFCCFFFFFF+F#
#FFFFFFFFCCFFFFFFFF#
#F+FFFFFFCCFFFFFF+F#
#FFFFFFFFCCFFFFFFFF#
#F+FFFFFFCCFFFFFF+F#
#FFFFFFFFCCFFFFFFFF#
#F+FFFFFFCCFFFFFF+F#
#FFFFFFFFCCFFFFFFFF#
#FFF+FFFFCCFFFF+FFF#
#FFFFFFFFCCFFFFFFFF#
#FFFFFFFFCCFFFFFFFF#
#FFFFFFFFFFFFFFFFFF#
########FFFF########
`),
  spawns: [[9, 12], [10, 12], [8, 12], [11, 12], [9, 13], [10, 13], [8, 13], [11, 13], [7, 12], [12, 12], [7, 13], [12, 13]],
  enemies: [
    { type: 'dark_knight', x: 7, y: 9, ai: 'aggressive', level: 22 },
    { type: 'dark_knight', x: 12, y: 9, ai: 'aggressive', level: 22 },
    { type: 'cerberus', x: 9, y: 7, level: 21 },
    { type: 'demon_master', x: 4, y: 6 },
    { type: 'demon_master', x: 15, y: 6 },
    { type: 'dark_knight', x: 10, y: 5, level: 22 },
    { type: 'high_priest', x: 5, y: 2, ai: 'healer' },
    { type: 'high_priest', x: 14, y: 2, ai: 'healer' },
    { type: 'dragon', x: 8, y: 3 },
    { type: 'ramladu', x: 9, y: 1, boss: true, ai: 'boss' },
  ],
  winCondition: 'boss',
  chests: [{ x: 1, y: 1, item: 'sword_of_darkness' }, { x: 18, y: 1, item: 'devil_lance' }],
  intro: [
    'Ramladu: Max of Guardiana. You have cost me Elliott, Balbazak, Mishaela and my Colossus.',
    'Ramladu: Darksol promised me the world. I will give him your corpse as a down payment!',
    'Max: Darksol used you, Ramladu, as he used my brother. Stand down!',
    'Ramladu: Never! Kill them all!',
  ],
  outro: [
    { music: 'dark' },
    'Ramladu: Urgh... Darksol... you promised...',
    'Ramladu: Then take... this... with me!',
    'Kane: Max! Look out!',
    'Lowe: Kane threw himself in front of the blast... Max!',
    'Kane: Little brother... I told you... I would do what I can...',
    'Kane: Darksol has gone to the Tower of the Ancients... through the gate at Guardiana. The Dark Dragon... stop him...',
    'Max: Kane! KANE!',
    'Nova: ...He is gone, Max. He died as a knight of Guardiana. Look, in Ramladu\'s vault... a sword that shines like the sun.',
    { item: 'sword_of_light' },
    'Nova: The Sword of Light. The Ancients forged it to face the Dark Dragon. It was waiting for you.',
  ],
  after: { location: 'runefaust', x: 13, y: 5, dir: 'up' },
};

registerLocations([runefaustGate, runefaust]);
registerBattles([b19, b20, b21]);
