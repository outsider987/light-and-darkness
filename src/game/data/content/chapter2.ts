import type { BattleDef, LocationDef } from '../../types';
import { registerLocations } from '../locations';
import { registerBattles } from '../battles';
import { S, npc, shopkeeper, priest, nova, innkeeper, SHOP, rows } from './common';
import { forceHasItem } from '../../state';

const rindo: LocationDef = {
  id: 'rindo',
  name: 'Rindo',
  music: 'town',
  rows: rows(`
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
......,,,,,,,,,,,,,BBBBBBBB~~~
.T....,...........,BBBBBBBB~~~
......,.RRRRR.....,BBBBBBBB~~~
......,.#####.....,........~~~
......,.#kFk#.....,.RRRRR..~~~
......,.#ccc#.....,.#####..~~~
......,.#FFF#.....,.#aFa#..~~~
......,.##D##.....,.#FFF#..~~~
,,,,,,,,,,,,,,,,,,,,#FFF#..~~~
,.................,.##D##..~~~
,.RRRRR...RRRRR...,........~~~
,.#####...#####...,,,,,,,,,~~~
,.#FFF#...#xFF#.......T...~~~~
,.#ccc#...#FFF#...........~~~~
,.#FFF#...#FFF#....RRRRR..~~~~
,.##D##...##D##....#####..~~~~
,..................#FFF#..~~~~
,,,,,,,,,,,,,,,....#cFF#..~~~~
,.RRRRRRR.....,....#FFF#..~~~~
,.#######.....,....##D##..~~~~
,.#FFFFF#.....,...........~~~~
,.###D###.....,...........~~~~
,.............,...........~~~~
`),
  churchPos: { x: 22, y: 10 },
  onEnter: (g) => {
    if (g.flags.rindo_arrived) return [];
    return [
      { chapter: 2 },
      { flag: 'rindo_arrived' },
      'Mayor: Travelers from Alterone? Welcome to Rindo. I wish it were a better day.',
      'Mayor: Runefaust soldiers passed through last night and burned our only ship before sailing on.',
      'Mayor: If you are following them, you will need a ship... and time. Our shipwright will do his best.',
      'Mayor: Meanwhile, Otrant, the great wizard of Manarina, sent word asking for the swordsman of Guardiana. Manarina lies up the north road.',
    ];
  },
  npcs: [
    npc('mayor', 12, 14, S.old('#604080'), [
      { if: 'won:b6', then: ['Mayor: The ship is ready at the harbor. Go, and give Runefaust what they deserve!'], else: [
        { if: 'won:b7', then: ['Mayor: My daughter went to the circus by the south road. Some troupe arrived this morning... I have a bad feeling.'], else: [
          'Mayor: Otrant of Manarina asked for you. Take the north road. And watch out, the road is crawling with Runefaust scouts.',
        ] },
      ] },
    ], { name: 'Mayor' }),
    nova('nova_rindo', 11, 16),
    shopkeeper('weapons_rindo', 10, 6, SHOP.rindo),
    shopkeeper('items_rindo', 4, 14, ['medical_herb', 'healing_seed', 'antidote', 'angel_wing']),
    priest('priest_rindo', 22, 8, 'Priest: The sea is calm today. The spirits are watching over us.'),
    innkeeper('inn_rindo', 20, 18, 30),
    npc('diane', 22, 19, { body: 'centaur', pal: { skin: '#f0c090', hair: '#e04040', cloth: '#30a050', mount: '#a06030' }, hair: 'long', weapon: 'bow' }, [
      'Diane: You are the Shining Force, are you not? I am Diane, an archer. My village was burned by Runefaust.',
      { ask: 'Diane: I want to fight them. Will you take me with you?', yes: ['Diane: You will not regret it. My arrows never miss.', { join: 'diane' }], no: ['Diane: Then I will find my own way.'] },
    ], { name: 'Diane', member: 'diane' }),
    npc('shipwright', 23, 3, S.man('#806040', '#303030'), [
      { if: 'won:b6', then: ['Shipwright: She is seaworthy! Board whenever you are ready. Runefaust sailed for Bustoke.'], else: ['Shipwright: Look at her... burned to the waterline. Give me time, and I will build you a new one.'] },
    ], { dir: 'down' }),
    npc('sailor', 20, 3, S.man('#3050a0', '#c0a060'), ['Sailor: Runefaust ships sailed east, toward Bustoke. There is a mine there... and a quarry.'], { wander: true }),
    npc('girl', 15, 22, S.woman('#f0a0c0', '#f0d040'), [
      { if: 'won:b6', then: ['Girl: Thank you for saving me! That puppet lady was so creepy.'], else: ['Girl: A circus came to town! It is in the big tent. Come see the show!'] },
    ], { wander: true }),
    npc('barker', 6, 24, S.merchant('#c02060'), [
      { if: (g) => !!g.flags.orb_returned && !!g.flags['won:b7'] && !g.flags['won:b6'], then: ['Barker: Step right up! The Marionette Circus is about to begin, and the swordsman of Guardiana is our guest of honor!'],
        else: [{ if: 'won:b6', then: ['Barker: ...The show is over. Forever.'], else: ['Barker: The show starts when the moon is right. Come back later, swordsman.'] }] },
    ], { dir: 'up', facePlayer: false }),
    npc('fisher', 2, 5, S.old('#3060a0'), ['Fisherman: North of here the road climbs to Manarina, the city of mages. Strange folk, but kind.'], { wander: true }),
  ],
  chests: [{ x: 23, y: 14, item: 'healing_seed' }, { x: 25, y: 23, gold: 150 }],
  searches: [{ x: 21, y: 2, text: 'Max searched the deck of the burned ship... and found a sturdy spear beneath the ashes!', item: 'bronze_lance' }],
  exits: [
    { x: 0, y: 10, dest: () => ({ location: 'alterone', x: 11, y: 25, dir: 'down' }) },
    { x: 6, y: 2, dest: (g) => (g.flags['won:b4'] ? { location: 'manarina', x: 9, y: 22, dir: 'up' } : { battle: 'b4' }) },
    { x: 5, y: 22, cond: (g) => !!g.flags.orb_returned && !!g.flags['won:b7'], blockText: 'Barker: The show has not begun. Come back later!', dest: (g) => (g.flags['won:b6'] ? { location: 'rindo', x: 5, y: 24, dir: 'down' } : { battle: 'b6' }) },
    { x: 19, y: 2, w: 8, h: 3, cond: (g) => !!g.flags['won:b6'], blockText: 'Shipwright: She is not ready to sail yet!', dest: () => ({ location: 'bustoke', x: 3, y: 20, dir: 'right' }) },
  ],
};

const manarina: LocationDef = {
  id: 'manarina',
  name: 'Manarina',
  music: 'castle',
  rows: rows(`
##########################
#FFFFFFFFFFFFFFFFFFFFFFFF#
#F+FFFFFFFFCCCCFFFFFFFF+F#
#FFFFFFFFFFCCCCFFFFFFFFFF#
#F+FFFFFFFFCCCCFFFFFFFF+F#
#FFFFFFFFFFCCCCFFFFFFFFFF#
############DD############
.....,,,,,,,,,,,,,,,,.....
.T...,...........,..,...T.
.....,.RRRRR.....,..,.....
.....,.#####.....,..,,,,,,
.....,.#kFk#.....,........
.....,.#ccc#.wwww,.RRRRR..
.....,.#FFF#.wwww,.#####..
.....,.##D##.wwww,.#aFa#..
.....,.......wwww,.#FFF#..
,,,,,,,,,,,,,,,,,,,#FFF#..
.........,.........##D##..
.RRRRR...,...RRRRR........
.#####...,...#####........
.#xFF#...,...#FFF#........
.#FFF#...,...#cFF#........
.##D##...,...##D##........
.........,................
`),
  churchPos: { x: 21, y: 15 },
  npcs: [
    npc('otrant', 13, 3, S.mage('#602080', '#e0e0e0'), [
      { if: 'orb_returned', then: [
        'Otrant: The Orb of Light will guide you through the darkness ahead. Shade Abbey lies south, on the road to Rindo.',
        'Otrant: Darksol seeks the Dark Dragon. You must reach Runefaust before he awakens it.',
      ], else: [
        { if: (g) => !!forceHasItem(g, 'orb_of_light'), then: [
          'Otrant: You found the Orb of Light! Then you truly are the one the prophecy spoke of.',
          { takeItem: 'orb_of_light' },
          { flag: 'orb_returned' },
          'Otrant: Listen well. A thousand years ago, the Ancients sealed the Dark Dragon beyond the gate. Darksol, the dark priest of Runefaust, means to break that seal.',
          'Otrant: Light and Darkness will clash once more. You carry the light, Max. Anri, child... your father was gravely wounded in Guardiana.',
          'Anri: Father... I know. I will go with Max. I am done hiding in books.',
          { join: 'anri' },
          'Otrant: Arthur, too, has been waiting for a cause. Speak with him. And the merchant below sells a strange egg... keep it warm.',
        ], else: [
          'Otrant: So you are Max of Guardiana. Before I share what I know, prove your courage.',
          'Otrant: East of the city lies the Cavern of Darkness. Within rests the Orb of Light. Bring it to me.',
          { flag: 'otrant_quest' },
        ] },
      ] },
    ], { name: 'Otrant' }),
    npc('anri_m', 10, 3, { body: 'mage', pal: { skin: '#f0c090', hair: '#8060e0', cloth: '#3050c0', trim: '#f0f0f8', extra: '#80d8ff' }, hair: 'long', weapon: 'staff' }, [
      'Anri: Max! What are you doing in Manarina? ...Is something wrong at home?',
    ], { name: 'Anri', member: 'anri' }),
    npc('arthur', 18, 4, { body: 'centaur', pal: { skin: '#f0c090', hair: '#8040c0', cloth: '#6040c0', armor: '#7050d0', mount: '#8090a0' }, hair: 'short', weapon: 'lance' }, [
      { if: 'orb_returned', then: [
        'Arthur: Otrant says you are the one. I am not the strongest knight here... but I learn fast.',
        { ask: 'Arthur: Let me ride with you. Will you accept?', yes: ['Arthur: Thank you. I will not fail you.', { join: 'arthur' }], no: ['Arthur: I understand. Maybe another time.'] },
      ], else: ['Arthur: I guard the tower. Not very exciting. The real magic happens upstairs.'] },
    ], { name: 'Arthur', member: 'arthur' }),
    npc('apprentice', 4, 2, S.mage('#4040a0'), ['Apprentice: Otrant knows everything about the Ancients. He is waiting on the carpet.'], { wander: true }),
    shopkeeper('weapons_m', 9, 11, SHOP.manarina, ['domingo_egg']),
    priest('priest_m', 21, 14, 'Priest: The holy spring of Manarina heals the spirit. Stay a while.'),
    nova('nova_m', 3, 20),
    innkeeper('inn_m', 15, 20, 40),
    npc('mage_w', 20, 8, S.mage('#a04060', '#f0d040'), ['Mage: The Cavern of Darkness is east. Bats and worse live there. Take a priest with you.'], { wander: true }),
    npc('old_m', 4, 15, S.old(), ['Old man: Shade Abbey, south of here, went silent weeks ago. Nobody who visits comes back.'], { wander: true }),
  ],
  chests: [{ x: 23, y: 1, item: 'guardian_staff' }, { x: 1, y: 8, gold: 200 }],
  searches: [{ x: 14, y: 13, text: 'Max looked into the holy spring. The water sparkles... and a Healing Seed floats to the surface!', item: 'healing_seed' }],
  exits: [
    { x: 9, y: 23, dest: (g) => (g.flags['won:b7'] ? { location: 'rindo', x: 6, y: 3, dir: 'down' } : { location: 'shade_abbey', x: 8, y: 12, dir: 'up' }) },
    { x: 25, y: 10, cond: (g) => !!g.flags.otrant_quest || !!g.flags.orb_returned, blockText: 'Guard: The eastern road leads to the Cavern of Darkness. Speak with Otrant first.', dest: (g) => (g.flags['won:b5'] ? { location: 'manarina', x: 24, y: 10, dir: 'left' } : { battle: 'b5' }) },
  ],
};

const shadeAbbey: LocationDef = {
  id: 'shade_abbey',
  name: 'Shade Abbey',
  music: 'dark',
  rows: rows(`
##################
#FFFFFFFFFFFFFFFF#
#F+FFFFaaFFFFFF+F#
#FFFFFFFFFFFFFFFF#
#FxFxFFFFFFxFxFFF#
#FFFFFFFFFFFFFFFF#
#FxFxFFFFFFxFxFFF#
#FFFFFFFFFFFFFFFF#
#FxFxFFFFFFxFxFFF#
#FFFFFFFFFFFFFFFF#
#FFFFkFFFFFFkFFFF#
#FFFFFFFFFFFFFFFF#
########DD########
`),
  onEnter: (g) => {
    if (g.flags['won:b7']) {
      if (g.flags.abbey_freed) return [];
      return [
        { flag: 'abbey_freed' },
        { music: 'town' },
        'Balbaroy: The curse is broken... I can move again! Thank you, strangers.',
        'Balbaroy: I am Balbaroy of the birdmen, and this is my wife Amon. The dark priest turned us to stone when we refused to serve Runefaust.',
        'Amon: You fight Runefaust? Then our wings are yours. Let us fly with you.',
        { join: 'balbaroy' },
        { join: 'amon' },
      ];
    }
    return [
      'Lowe: This abbey... it is so quiet. Max, look at those statues. They look like birdmen!',
      'Zombie Priest: Welcome, children. The abbey always welcomes new... members.',
      'Khris: Those are not monks! They are the walking dead!',
      { battle: 'b7' },
    ];
  },
  npcs: [
    npc('balbaroy_stone', 6, 2, { body: 'bird', pal: { skin: '#a0a0a8', hair: '#808088', cloth: '#909098', trim: '#b0b0b8', extra: '#c0c0c8' }, hair: 'short' }, ['It is a statue of a birdman. His face is frozen in anger.'], { cond: (g) => !g.flags['won:b7'] }),
    npc('amon_stone', 10, 2, { body: 'bird', pal: { skin: '#a0a0a8', hair: '#808088', cloth: '#909098', trim: '#b0b0b8', extra: '#c0c0c8' }, hair: 'long' }, ['It is a statue of a birdwoman. Her eyes seem to follow you.'], { cond: (g) => !g.flags['won:b7'] }),
    npc('monk_a', 3, 10, S.priest('#604060'), ['Monk: We are free of the dark priest at last. The abbey will pray for your victory.'], { cond: (g) => !!g.flags['won:b7'], wander: true }),
  ],
  chests: [{ x: 1, y: 1, item: 'angel_wing' }, { x: 16, y: 1, gold: 180 }],
  searches: [{ x: 12, y: 10, text: 'Something is rustling inside the barrel... A hamster wearing a tiny helmet jumps out! It looks at Max with great determination.', join: 'jogurt' }],
  exits: [
    { x: 8, y: 12, w: 2, dest: (g) => (g.flags['won:b7'] ? { location: 'rindo', x: 6, y: 3, dir: 'down' } : { location: 'manarina', x: 9, y: 22, dir: 'up' }) },
  ],
};

const b4: BattleDef = {
  id: 'b4',
  name: 'Rindo Road',
  chapter: 2,
  rows: rows(`
TTT^^^^^^^TTTTT^^^^^^T
TT^^.....^T..T^.....^T
T^^...T...,,...T....^T
T.......,,,,,,.......T
.......,,....,,......T
......,,..^^..,,......
~~~~~=,...^^...,=~~~~~
~~~~~=,........,=~~~~~
......,,......,,......
.T.....,,,,,,,,.....T.
.TT......,,.........TT
..T..T...,,...T...T...
.........,,...........
....^....,,....^......
...^^....,,....^^.....
TTTTTTTT,,,,TTTTTTTTTT
`),
  spawns: [[9, 13], [10, 13], [9, 14], [10, 14], [8, 13], [11, 13], [8, 14], [11, 14], [7, 13], [12, 13], [8, 12], [11, 12]],
  enemies: [
    { type: 'goblin', x: 9, y: 9, ai: 'aggressive' },
    { type: 'goblin', x: 12, y: 10, ai: 'aggressive' },
    { type: 'sniper', x: 4, y: 8 },
    { type: 'sniper', x: 17, y: 8 },
    { type: 'giant_bat', x: 6, y: 5 },
    { type: 'giant_bat', x: 15, y: 5 },
    { type: 'dwarf', x: 10, y: 5 },
    { type: 'dwarf', x: 13, y: 4 },
    { type: 'rune_knight', x: 10, y: 2 },
    { type: 'rune_knight', x: 11, y: 1, boss: true, level: 5 },
  ],
  chests: [{ x: 3, y: 1, gold: 100 }, { x: 19, y: 1, item: 'turbo_pepper' }],
  intro: ['Ken: Runefaust scouts, on the hills ahead! And archers... Stay out of their range until we can reach them.'],
  after: { location: 'manarina', x: 9, y: 22, dir: 'up' },
};

const b5: BattleDef = {
  id: 'b5',
  name: 'Cavern of Darkness',
  chapter: 2,
  music: 'dungeon',
  rows: rows(`
####################
#rrrr######rrrrrrr##
#rr##~~~##rrr###rrr#
#rr#~~~~~#rr##rr#rr#
#rrr#~~~#rrr#rr##rr#
##rrrr#rrrrr#rrr#rr#
###rrr#rr####rrr#rr#
#rrrrr#rr#rrrrrr#rr#
#rr#rrrrr#rr##rrrrr#
#rr###rrr#rr###rrrr#
#rrr#rrr###rrr#rrr##
##rr#rr#rrrrrr#rrr##
#rrr#rr#rr##rr##rr##
#rrrrrrr#r##rrrrrr##
#rr####rrrrrrr######
#rrrrrrrrrrrrrrrrr##
####################
`),
  spawns: [[3, 15], [4, 15], [2, 15], [5, 15], [10, 15], [1, 15], [6, 15], [2, 14], [7, 15], [8, 15], [1, 14], [9, 15]],
  enemies: [
    { type: 'giant_bat', x: 7, y: 12, ai: 'aggressive' },
    { type: 'giant_bat', x: 10, y: 14, ai: 'aggressive' },
    { type: 'dark_dwarf', x: 2, y: 8 },
    { type: 'dark_dwarf', x: 7, y: 8 },
    { type: 'skeleton', x: 13, y: 10 },
    { type: 'giant_bat', x: 15, y: 13 },
    { type: 'dark_dwarf', x: 11, y: 4 },
    { type: 'skeleton', x: 14, y: 5 },
    { type: 'giant_bat', x: 3, y: 2 },
    { type: 'dark_priest', x: 17, y: 2, boss: true, ai: 'healer' },
  ],
  chests: [{ x: 1, y: 1, item: 'healing_seed' }, { x: 13, y: 1, item: 'iron_arrow' }],
  intro: ['Tao: It is so dark in here... Something is flapping above us!', 'Max: Keep the healers in the middle. We go deeper.'],
  outro: [
    'Lowe: Max, over here! Behind the altar... it is glowing!',
    { item: 'orb_of_light' },
    'Max: The Orb of Light. Let us take it back to Otrant.',
  ],
  after: { location: 'manarina', x: 24, y: 10, dir: 'left' },
};

const b6: BattleDef = {
  id: 'b6',
  name: 'The Circus',
  chapter: 2,
  music: 'boss',
  rows: rows(`
##################
#FFFFFFFFFFFFFFFF#
#FFxFFFFFFFFFFxFF#
#FFFFFFCCCCFFFFFF#
#FFFFFCCCCCCFFFFF#
#FxFFFCCCCCCFFFxF#
#FFFFFCCCCCCFFFFF#
#FFFFFFCCCCFFFFFF#
#FFxFFFFFFFFFFxFF#
#FFFFFFFFFFFFFFFF#
#FFFFFFFFFFFFFFFF#
########DD########
`),
  spawns: [[8, 10], [9, 10], [7, 10], [10, 10], [8, 9], [9, 9], [7, 9], [10, 9], [6, 10], [11, 10], [6, 9], [11, 9]],
  enemies: [
    { type: 'mannequin', x: 5, y: 8, ai: 'aggressive' },
    { type: 'mannequin', x: 12, y: 8, ai: 'aggressive' },
    { type: 'mannequin', x: 3, y: 5 },
    { type: 'mannequin', x: 14, y: 5 },
    { type: 'evil_puppet', x: 7, y: 5 },
    { type: 'evil_puppet', x: 10, y: 5 },
    { type: 'evil_puppet', x: 8, y: 2 },
    { type: 'marionette', x: 9, y: 3, boss: true, ai: 'boss' },
  ],
  winCondition: 'boss',
  intro: [
    'Marionette: Welcome, welcome, Shining Force! Tonight, you are the show!',
    'Marionette: Mishaela sends her regards. Dance for me, puppets!',
    'Max: A trap! Everyone, fight your way to that thing!',
  ],
  outro: [
    'Marionette: My strings... are cut... Mishaela... will...',
    'Girl: Is it over? Thank you! I thought I would never see Papa again.',
    'Max: Mishaela... another servant of Darksol. We need that ship.',
  ],
  after: { location: 'rindo', x: 5, y: 24, dir: 'down' },
};

const b7: BattleDef = {
  id: 'b7',
  name: 'Shade Abbey',
  chapter: 2,
  music: 'dark',
  rows: rows(`
##################
#FFFFFFFFFFFFFFFF#
#F+FFFFaaFFFFFF+F#
#FFFFFFFFFFFFFFFF#
#FxFxFFFFFFxFxFFF#
#FFFFFFFFFFFFFFFF#
#FxFxFFFFFFxFxFFF#
#FFFFFFFFFFFFFFFF#
#FxFxFFFFFFxFxFFF#
#FFFFFFFFFFFFFFFF#
#FFFFkFFFFFFkFFFF#
#FFFFFFFFFFFFFFFF#
########DD########
`),
  spawns: [[8, 11], [9, 11], [7, 11], [10, 11], [8, 10], [9, 10], [7, 10], [10, 10], [6, 11], [11, 11], [6, 10], [11, 10]],
  enemies: [
    { type: 'zombie', x: 6, y: 9, ai: 'aggressive' },
    { type: 'zombie', x: 11, y: 9, ai: 'aggressive' },
    { type: 'zombie', x: 3, y: 7 },
    { type: 'zombie', x: 14, y: 7 },
    { type: 'ghoul', x: 8, y: 7 },
    { type: 'ghoul', x: 9, y: 5 },
    { type: 'skeleton', x: 5, y: 3 },
    { type: 'skeleton', x: 12, y: 3 },
    { type: 'zombie', x: 8, y: 3 },
    { type: 'zombie_priest', x: 9, y: 2, boss: true, ai: 'boss' },
  ],
  winCondition: 'all',
  intro: ['Zombie Priest: Join the congregation! Rise, my flock, rise!'],
  outro: ['Zombie Priest: Darksol... forgive... your servant...', 'Gong: The dark magic fades. Look, the statues!'],
  after: { location: 'shade_abbey', x: 8, y: 4, dir: 'up' },
};

registerLocations([rindo, manarina, shadeAbbey]);
registerBattles([b4, b5, b6, b7]);
