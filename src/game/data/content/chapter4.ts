import type { BattleDef, LocationDef } from '../../types';
import { registerLocations } from '../locations';
import { registerBattles } from '../battles';
import { S, npc, shopkeeper, priest, nova, innkeeper, SHOP, rows } from './common';
import { hasItem } from '../../state';

const pao: LocationDef = {
  id: 'pao',
  name: 'Pao',
  music: 'town',
  rows: rows(`
TTTTTTTTTTTTTTTTTTTTTTTTTT
T........................T
T..RRRR....RRRR....RRRR..T
T..####....####....####..T
T..#FF#....#FF#....#Fa#..T
T..#cc#....#cc#....#FF#..T
T..#FF#....#FF#....#FF#..T
T..#D##....#D##....#D##..T
T........................T
,,,,,,,,,,,,,,,,,,,,,,,,,,
T........................T
T..RRRR....RRRR....RRRR..T
T..####....####....####..T
T..#xF#....#cF#....#bF#..T
T..#FF#....#FF#....#FF#..T
T..#FF#....#FF#....#FF#..T
T..#D##....#D##....#D##..T
T.....*....,,.....*......T
TTTTTTTTTTT,,TTTTTTTTTTTTT
`),
  churchPos: { x: 20, y: 6 },
  onEnter: (g) => {
    if (g.flags.pao_arrived) return [];
    return [
      { chapter: 4 },
      { flag: 'pao_arrived' },
      'Chief: Welcome to Pao, the town that never stays! You beat Elliott? Then you are friends of ours.',
      'Chief: Beyond the bridge to the east stands Uranbatol, the great fortress. Balbazak rules it for Runefaust now. The harbor there is the only way across the sea.',
    ];
  },
  npcs: [
    npc('chief', 8, 10, S.old('#a06030'), [
      { if: 'won:b13', then: ['Chief: Uranbatol is free! Our wagons will roll east again. Safe travels, Shining Force.'], else: ['Chief: Balbazak burned three of our wagons last month. If you take Uranbatol, Pao will never forget it.'] },
    ], { name: 'Chief' }),
    npc('egg_keeper', 16, 10, S.woman('#806040', '#d0d0d0'), [
      { if: (g) => !!hasItem(g, 'domingo_egg'), then: [
        'Old woman: What a strange egg! Here, let me warm it by the fire... Oh! It is moving!',
        { takeItem: 'domingo_egg' },
        'Old woman: It hatched! What IS that thing? It is... floating. And it seems to like you.',
        { join: 'domingo' },
      ], else: ['Old woman: I have hatched every kind of egg on this prairie. Bring me a strange one and I will show you.'] },
    ], { facePlayer: true }),
    shopkeeper('weapons_pao', 4, 4, SHOP.pao),
    shopkeeper('items_pao', 12, 4, ['medical_herb', 'healing_seed', 'healing_drop', 'antidote', 'angel_wing']),
    priest('priest_pao', 20, 4, 'Priest: Our chapel has wheels, but faith needs no foundation.'),
    nova('nova_pao', 4, 14),
    npc('barkeep_pao', 13, 13, S.merchant('#604020'), ['Barkeep: That knight in the corner used to ride for Runefaust. Deserted after Guardiana, he says.'], { facePlayer: false }),
    npc('vankar', 13, 15, { body: 'centaur', pal: { skin: '#f0c090', hair: '#c04040', cloth: '#c03030', armor: '#d04040', mount: '#604030' }, hair: 'short', weapon: 'lance' }, [
      'Vankar: I was a knight of Runefaust. I watched Kane burn Guardiana and I could not stomach it. So I left.',
      { ask: 'Vankar: I know how Runefaust fights. Let me make amends. Will you have a deserter?', yes: ['Vankar: You will not regret this. I swear it on my lance.', { join: 'vankar' }], no: ['Vankar: ...I understand. I would not trust me either.'] },
    ], { name: 'Vankar', member: 'vankar' }),
    innkeeper('inn_pao', 21, 14, 50),
    npc('kid_pao', 6, 17, S.kid('#4080c0'), ['Boy: The bridge east of town is where the wyverns nest. Scary!'], { wander: true }),
    npc('woman_pao', 18, 1, S.woman('#c0a040'), ['Woman: Uranbatol used to be a free city. Balbazak threw its knights into the dungeon.'], { wander: true }),
  ],
  chests: [{ x: 1, y: 1, item: 'healing_drop' }, { x: 24, y: 17, gold: 300 }],
  searches: [{ x: 24, y: 1, text: 'Max searched the wagon wheel... and found a Speed Ring wedged in the spokes!', item: 'speed_ring' }],
  exits: [
    { x: 0, y: 9, dest: () => ({ location: 'pao_prairie', x: 10, y: 1, dir: 'down' }) },
    { x: 25, y: 9, dest: (g) => (g.flags['won:b11'] ? { location: 'uranbatol_gate', x: 9, y: 10, dir: 'up' } : { battle: 'b11' }) },
  ],
};

const uranbatolGate: LocationDef = {
  id: 'uranbatol_gate',
  name: 'Uranbatol',
  music: 'dark',
  rows: rows(`
####################
#########GG#########
#########FF#########
.........FF.........
.....^...FF...^.....
.........FF.........
..T......FF......T..
.........FF.........
....^....FF....^....
.........FF.........
.........FF.........
TTTT.....,,.....TTTT
`),
  onEnter: (g) => {
    if (g.flags['won:b13']) return [];
    if (g.flags['won:b12']) return ['Mae: The outer gate is ours. Balbazak waits inside. Let us finish this.'];
    return ['Vankar: Uranbatol. Those walls have never been taken by force. Laser eyes on the battlements... We go straight for the gate.'];
  },
  npcs: [],
  exits: [
    { x: 9, y: 11, w: 2, dest: () => ({ location: 'pao', x: 24, y: 9, dir: 'left' }) },
    { x: 9, y: 2, w: 2, dest: (g) => (g.flags['won:b13'] ? { location: 'uranbatol', x: 12, y: 17, dir: 'up' } : g.flags['won:b12'] ? { battle: 'b13' } : { battle: 'b12' }) },
  ],
};

const uranbatol: LocationDef = {
  id: 'uranbatol',
  name: 'Uranbatol',
  music: 'castle',
  rows: rows(`
~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~BBBBBBBBBB~~~~~~~~
~~~~~~BBBBBBBBBB~~~~~~~~
######BBBBBBBBBB########
#FFFFFFFFFFFFFFFFFFFFFF#
#F+FFFFFFFFFFFFFFFFFF+F#
#FFFF##########FFFFFFFF#
#FFFF#kFk#aFFF#FFFFFFFF#
#FFFF#ccc#FFFF#FFFFFFFF#
#FFFF#FFF#FFFF#FFFFFFFF#
#FFFF##D###DD##FFFFFFFF#
#FFFFFFFFFFFFFFFFFFFFFF#
#FFFF##########FFFFFFFF#
#FFFF#FxF#FFFF#FFFFFFFF#
#FFFF#FFF#cFFF#FFFFFFFF#
#FFFF#FFF#FFFF#FFFFFFFF#
#FFFF##D###DD##FFFFFFFF#
#FFFFFFFFFFFFFFFFFFFFFF#
###########DD###########
`),
  churchPos: { x: 11, y: 9 },
  onEnter: (g) => {
    if (g.flags.uranbatol_free) return [];
    return [
      { flag: 'uranbatol_free' },
      { music: 'castle' },
      'Knight: Uranbatol is free! The people of this city thank you, Shining Force.',
      'Knight: Runefaust ships sailed from our harbor toward Waral and the dragon country beyond. Our ship is yours.',
    ];
  },
  npcs: [
    nova('nova_u', 7, 14),
    shopkeeper('weapons_u', 7, 7, SHOP.uranbatol),
    shopkeeper('items_u', 11, 13, ['healing_seed', 'healing_drop', 'antidote', 'angel_wing', 'power_potion', 'protect_potion']),
    priest('priest_u', 11, 8, 'Priest: We prayed in secret under Balbazak. Now we pray in the light.'),
    npc('knight_u', 18, 6, S.soldier('#c0c8d8', '#3050a0'), ['Knight: Earnest was our captain. Thank you for freeing him. He speaks only of revenge now.'], { wander: true }),
    npc('citizen_u', 18, 14, S.woman('#4080a0'), ['Woman: The ship at the harbor can carry your whole force. Waral is three days by sea.'], { wander: true }),
    npc('sailor_u', 9, 2, S.man('#3050a0', '#c0a060'), ['Captain: Ready to sail when you are. Step onto the deck and we cast off.'], { dir: 'down' }),
    npc('old_u', 3, 10, S.old(), ['Old man: Beyond the sea lies Waral, and past Waral, Dragonia, where the last dragons live.'], { wander: true }),
  ],
  chests: [{ x: 22, y: 4, item: 'halberd' }, { x: 1, y: 17, gold: 500 }, { x: 22, y: 17, item: 'bread_of_life' }],
  exits: [
    { x: 11, y: 18, w: 2, dest: () => ({ location: 'uranbatol_gate', x: 9, y: 3, dir: 'down' }) },
    { x: 6, y: 1, w: 10, h: 2, dest: () => ({ location: 'waral', x: 12, y: 2, dir: 'down' }) },
  ],
};

const b11: BattleDef = {
  id: 'b11',
  name: 'Pao Bridge',
  chapter: 4,
  rows: rows(`
TT....^^.......^^.....TT
T.....^.........^......T
......T.........T.......
........................
~~~~~~~~~~~===~~~~~~~~~~
~~~~~~~~~~~===~~~~~~~~~~
~~~~~~~~~~~===~~~~~~~~~~
~~~~~~~~~~~===~~~~~~~~~~
........................
...T..........T.........
.......*...........*....
..^^....................
..^^......T.......^^....
TTTT......,,......TTTTTT
`),
  spawns: [[11, 12], [12, 12], [11, 11], [12, 11], [10, 12], [13, 12], [10, 11], [13, 11], [11, 10], [12, 10], [10, 10], [13, 10]],
  enemies: [
    { type: 'hellhound', x: 11, y: 8, ai: 'aggressive' },
    { type: 'hellhound', x: 13, y: 8, ai: 'aggressive' },
    { type: 'wyvern', x: 6, y: 6 },
    { type: 'wyvern', x: 17, y: 6 },
    { type: 'hellhound', x: 12, y: 4 },
    { type: 'sniper', x: 9, y: 2, level: 9 },
    { type: 'sniper', x: 14, y: 2, level: 9 },
    { type: 'sniper', x: 12, y: 1, level: 9 },
    { type: 'lizardman', x: 6, y: 2, level: 9 },
    { type: 'lizardman', x: 17, y: 2, level: 9 },
    { type: 'dark_mage', x: 12, y: 0, boss: true, ai: 'caster', level: 11 },
  ],
  chests: [{ x: 1, y: 1, item: 'protect_potion' }, { x: 22, y: 1, gold: 350 }],
  intro: ['Kokichi: The bridge! And wyverns over the river. This is going to be a bottleneck.', 'Max: Fliers over the water, everyone else across the bridge. Go!'],
  after: { location: 'uranbatol_gate', x: 9, y: 10, dir: 'up' },
};

const b12: BattleDef = {
  id: 'b12',
  name: 'Uranbatol Gate',
  chapter: 4,
  music: 'battle',
  rows: rows(`
####################
#FFFFFFFFFFFFFFFFFF#
#FFFFFFFFFFFFFFFFFF#
#FFF####FFFF####FFF#
####F#F##FF##F#F####
#########FF#########
.........FF.........
.....^...FF...^.....
.........FF.........
..T......FF......T..
.........FF.........
....^....FF....^....
.........FF.........
.........FF.........
TTTT.....,,.....TTTT
`),
  spawns: [[9, 12], [10, 12], [9, 13], [10, 13], [8, 12], [11, 12], [8, 13], [11, 13], [7, 12], [12, 12], [7, 13], [12, 13]],
  enemies: [
    { type: 'jet', x: 7, y: 9, ai: 'aggressive' },
    { type: 'jet', x: 12, y: 9, ai: 'aggressive' },
    { type: 'lizardman', x: 9, y: 7, level: 10 },
    { type: 'lizardman', x: 10, y: 6, level: 10 },
    { type: 'laser_eye', x: 4, y: 4, ai: 'stationary' },
    { type: 'laser_eye', x: 15, y: 4, ai: 'stationary' },
    { type: 'armed_skeleton', x: 9, y: 4 },
    { type: 'armed_skeleton', x: 10, y: 3 },
    { type: 'sniper', x: 6, y: 2, level: 10 },
    { type: 'sniper', x: 13, y: 2, level: 10 },
    { type: 'lizardman', x: 9, y: 1, level: 11, boss: true },
  ],
  chests: [{ x: 1, y: 1, item: 'steel_sword' }, { x: 18, y: 2, gold: 300 }],
  intro: ['Guntz: Laser eyes on the walls! They will cut us down on the open ground.', 'Earnest?: ...Is someone shouting from inside the walls? Later. Charge the gate!'],
  after: { location: 'uranbatol_gate', x: 9, y: 3, dir: 'up' },
};

const b13: BattleDef = {
  id: 'b13',
  name: 'Fortress of Balbazak',
  chapter: 4,
  music: 'boss',
  rows: rows(`
######################
#FFFFFFFFFCCFFFFFFFFF#
#F+FFFFFFFCCFFFFFFF+F#
#FFFFFFFFFCCFFFFFFFFF#
#FFFF###FFCCFF###FFFF#
#FFFF#GFFFCCFFFG#FFFF#
#FFFF###FFCCFF###FFFF#
#F+FFFFFFFCCFFFFFFF+F#
#FFFFFFFFFCCFFFFFFFFF#
#FF+FFF+FFCCFF+FFF+FF#
#FFFFFFFFFCCFFFFFFFFF#
#FFFFFFFFFCCFFFFFFFFF#
#FFF####FFCCFF####FFF#
#FFF#FF#FFCCFF#FF#FFF#
#FFFFFFFFFCCFFFFFFFFF#
#########FFFF#########
`),
  spawns: [[10, 14], [11, 14], [9, 14], [12, 14], [10, 13], [11, 13], [9, 13], [12, 13], [8, 14], [13, 14], [8, 13], [13, 13]],
  enemies: [
    { type: 'lizardman', x: 9, y: 10, ai: 'aggressive', level: 11 },
    { type: 'lizardman', x: 12, y: 10, ai: 'aggressive', level: 11 },
    { type: 'armed_skeleton', x: 5, y: 8 },
    { type: 'armed_skeleton', x: 16, y: 8 },
    { type: 'silver_knight', x: 8, y: 6, level: 11 },
    { type: 'silver_knight', x: 13, y: 6, level: 11 },
    { type: 'dark_mage', x: 4, y: 3, level: 11 },
    { type: 'dark_mage', x: 17, y: 3, level: 11 },
    { type: 'laser_eye', x: 10, y: 4, ai: 'stationary' },
    { type: 'dark_priest', x: 12, y: 2, level: 11, ai: 'healer' },
    { type: 'balbazak', x: 10, y: 1, boss: true, ai: 'boss' },
  ],
  winCondition: 'boss',
  chests: [{ x: 1, y: 1, item: 'battle_axe' }, { x: 20, y: 1, item: 'power_ring' }, { x: 1, y: 14, gold: 600 }],
  intro: [
    'Balbazak: So the little force crawled over my wall. Elliott was soft. I am not.',
    'Balbazak: I will hang your heads from the gate as a gift for Darksol!',
    'Max: Your gate is already ours, Balbazak. Now we take the fortress!',
  ],
  outro: [
    'Balbazak: Impossible... I am... Balbazak... of Runefaust...',
    'Earnest: Open the cells! Thank the light, we are free!',
    'Earnest: I am Earnest, captain of the knights of Uranbatol. Balbazak threw us in chains when the city fell.',
    'Earnest: My lance is yours, Max. Runefaust will answer for Uranbatol.',
    { join: 'earnest' },
  ],
  after: { location: 'uranbatol', x: 12, y: 17, dir: 'up' },
};

registerLocations([pao, uranbatolGate, uranbatol]);
registerBattles([b11, b12, b13]);
