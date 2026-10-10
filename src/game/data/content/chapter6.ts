import type { BattleDef, LocationDef } from '../../types';
import { registerLocations } from '../locations';
import { registerBattles } from '../battles';
import { S, npc, shopkeeper, priest, nova, innkeeper, SHOP, rows } from './common';

const rudo: LocationDef = {
  id: 'rudo',
  name: 'Rudo',
  music: 'dark',
  rows: rows(`
YYYYYYYYYYYYYYYYYYYYYYY
YdddddddddddddddddddddY
Yd.RRRRR....rrrr.....dY
Yd.#####....r##r.....dY
Yd.#kFk#....r#Fr.....dY
Yd.#ccc#....rrFr.....dY
Yd.#FFF#....r#r......dY
Yd.##D##....rrr......dY
Yd...................dY
,,,,,,,,,,,,,,,,,,,,,,d
Yd........,..........dY
Yd.rrrrr..,..RRRRR...dY
Yd.r#F#r..,..#####...dY
Yd.rFFFr..,..#aFF#...dY
Yd.r#FFr..,..#FFF#...dY
Yd.rrrrr..,..##D##...dY
Yd........,..........dY
Yd........,..RRRRR...dY
Yd........,..#####...dY
Yd.YY.....,..#xFF#...dY
Yd........,..#FFF#...dY
Yd........,..##D##...dY
YdddddddddddddddddddddY
YYYYYYYYYYYYYYYYYYYYYYY
`),
  churchPos: { x: 15, y: 14 },
  onEnter: (g) => {
    if (g.flags.rudo_arrived) return [];
    return [
      { chapter: 6 },
      { flag: 'rudo_arrived' },
      'Gong: Rudo... or what is left of it. Runefaust passed through here like a plague.',
      'Survivor: You... you are not Runefaust? Thank the light. They went east, to the ruins of Prompt. Something terrible is waking there.',
    ];
  },
  npcs: [
    npc('survivor', 6, 10, S.old('#604040'), [
      { if: 'won:b18', then: ['Survivor: The ground stopped shaking. Whatever woke in Prompt, you put it back to sleep. Thank you.'], else: ['Survivor: The plains east of here are crawling with monsters now. Chimeras, minotaurs... Prompt is beyond them.'] },
    ]),
    shopkeeper('weapons_r', 5, 4, SHOP.rudo),
    priest('priest_r', 15, 13, 'Priest: The chapel roof is gone, but the altar stands. That is enough.'),
    nova('nova_r', 15, 20),
    npc('woman_r', 18, 8, S.woman('#604040', '#303030'), ['Woman: A stranger in strange armor lives in the ruined house. He never speaks. He only sharpens his sword.'], { wander: true }),
    npc('child_r', 4, 18, S.kid('#806040'), ['Girl: I found a treasure chest in the dead woods but I was too scared to open it.'], { wander: true }),
    npc('merchant_r', 14, 5, S.merchant('#406040'), ['Merchant: Potions, salves, bandages. Half price for anyone fighting Runefaust.', { shop: ['healing_drop', 'antidote', 'angel_wing', 'bread_of_life', 'power_potion', 'protect_potion'] }], { facePlayer: false }),
  ],
  chests: [{ x: 3, y: 19, item: 'assault_shell' }, { x: 20, y: 1, gold: 700 }],
  searches: [
    { x: 5, y: 13, text: 'A man in strange armor sits in the shadows, sharpening a curved blade. He looks up. "You hunt the dark one? I am Musashi. I have waited long for a worthy fight." Musashi stands and bows.', join: 'musashi' },
    { x: 12, y: 3, text: 'Max searched the rubble... and found a Healing Drop!', item: 'healing_drop' },
  ],
  exits: [
    { x: 0, y: 9, dest: () => ({ location: 'dragonia', x: 9, y: 17, dir: 'up' }) },
    { x: 22, y: 9, dest: (g) => (g.flags['won:b16'] ? { location: 'prompt', x: 13, y: 20, dir: 'up' } : { battle: 'b16' }) },
  ],
};

const prompt_: LocationDef = {
  id: 'prompt',
  name: 'Prompt',
  music: 'castle',
  rows: rows(`
##########################
#FFFFFFFFFFCCCCFFFFFFFFFF#
#F+FFFFFFFFCCCCFFFFFFFF+F#
#FFFFFFFFFFCCCCFFFFFFFFFF#
#F+FFFFFFFFCCCCFFFFFFFF+F#
#FFFFFFFFFFCCCCFFFFFFFFFF#
#G#G########DD########G#G#
#F#F#rrrrrrrrrrrrrrrr#F#F#
#F#F#rrrrrrrrrrrrrrrr#F#F#
#G#G#rrr##rrrrrr##rrr#G#G#
#rrrrrrr##rrrrrr##rrrrrrr#
#rrrrrrrrrrrrrrrrrrrrrrrr#
#rr+rrrrrr+rrrr+rrrrrr+rr#
#rrrrrrrrrrrrrrrrrrrrrrrr#
#rrrr#####rrrrrr#####rrrr#
#rrrr#FaF#rrrrrr#FxF#rrrr#
#rrrr#FFF#rrrrrr#FFF#rrrr#
#rrrr##D##rrrrrr##D##rrrr#
#rrrrrrrrrrrrrrrrrrrrrrrr#
#rrrrrrrrrrrrrrrrrrrrrrrr#
############rr############
`),
  churchPos: { x: 7, y: 16 },
  onEnter: (g) => {
    if (g.flags['won:b18']) {
      if (g.flags.prompt_after) return [];
      return [
        { flag: 'prompt_after' },
        'Alef: The machine is silent! Someone, open these cells!',
        'Torasu: Patience, Alef. Our rescuers are coming.',
      ];
    }
    if (g.flags.prompt_arrived) return [];
    return [
      { flag: 'prompt_arrived' },
      'Lowe: Prompt, the fallen kingdom. The castle of the Ancients still stands... barely.',
      'Spirit: Who walks in my halls? ...A swordsman of the light. At last.',
      'Spirit: I was the last king of Prompt. Darksol has awakened Chaos, our war machine, and set it to guard the gate he seeks.',
      'Spirit: Only the Chaos Breaker can pierce its armor. Take it from my vault, swordsman, and silence the machine.',
      { item: 'chaos_breaker' },
      'Spirit: The courtyard is overrun. Beyond it, the great hall... and Chaos.',
    ];
  },
  npcs: [
    npc('spirit', 13, 3, { body: 'ghost', pal: { cloth: '#c0b8e8' } }, [
      { if: 'won:b18', then: ['Spirit: Chaos sleeps. My kingdom can rest. Runefaust lies east. Darksol has gone to his king... End this, swordsman.'], else: ['Spirit: Chaos waits in the great hall beyond the courtyard. The Chaos Breaker is your only hope against it.'] },
    ], { name: 'Spirit', cond: (g) => !!g.flags.prompt_arrived }),
    npc('alef', 1, 7, { body: 'mage', pal: { skin: '#f0d0a0', hair: '#f08030', cloth: '#802080', trim: '#f0f0f8', extra: '#f8f060' }, hair: 'long', weapon: 'staff' }, [
      { if: 'won:b18', then: [
        'Alef: You stopped the machine! I am Alef, a mage of the eastern elves. Runefaust locked me in here when I refused to serve.',
        'Alef: My magic is yours. Let us burn Runefaust to the ground!',
        { join: 'alef' },
      ], else: ['Alef: Help! The cell is locked and that machine is right outside!'] },
    ], { name: 'Alef', member: 'alef', facePlayer: false }),
    npc('torasu', 24, 7, { body: 'priest', pal: { skin: '#f0c090', hair: '#e0e0e0', cloth: '#e0e0f0', trim: '#f0c040' }, hair: 'beard', weapon: 'staff' }, [
      { if: 'won:b18', then: [
        'Torasu: Bless you, child. I am Torasu, vicar of Prompt. I have healed the wounded of this land for forty years.',
        'Torasu: My prayers go with you. And so do I.',
        { join: 'torasu' },
      ], else: ['Torasu: Do not worry about us, child. Deal with the machine first.'] },
    ], { name: 'Torasu', member: 'torasu', facePlayer: false }),
    priest('priest_p', 7, 16, 'Priest: I kept the chapel alive through the fall of Prompt. I will keep it alive through this.'),
    nova('nova_p', 18, 16),
    npc('merchant_p', 11, 13, S.merchant('#604080'), ['Merchant: I follow armies and sell to whoever is left standing. You look like you will be.', { shop: SHOP.prompt, deals: ['mobility_ring', 'black_ring'] }], { facePlayer: true }),
  ],
  chests: [{ x: 1, y: 1, item: 'great_axe' }, { x: 24, y: 1, item: 'holy_staff' }, { x: 1, y: 19, gold: 800 }],
  exits: [
    { x: 12, y: 20, w: 2, dest: () => ({ location: 'rudo', x: 21, y: 9, dir: 'left' }) },
    { x: 5, y: 10, w: 16, h: 2, cond: (g) => !g.flags['won:b17'], dest: () => ({ battle: 'b17' }) },
    { x: 12, y: 6, w: 2, cond: (g) => !!g.flags['won:b17'], blockText: 'The hall doors will not budge. Something is holding them from the inside.', dest: (g) => (g.flags['won:b18'] ? { location: 'prompt', x: 13, y: 5, dir: 'up' } : { battle: 'b18' }) },
    { x: 25, y: 10, h: 2, cond: (g) => !!g.flags['won:b18'], blockText: 'Max: Runefaust lies east... but first, Chaos.', dest: () => ({ location: 'runefaust_gate', x: 10, y: 15, dir: 'up' }) },
  ],
};

const b16: BattleDef = {
  id: 'b16',
  name: 'Rudo Plains',
  chapter: 6,
  rows: rows(`
YYYdddddYYYddddddYYYdd
YdddddddddYddddddYdddd
ddddY^^ddddddd^^ddddYd
dddd^^dddYdddd^^dddddd
dYddddddddddddddddYddd
ddddddYddd^^ddddddddYd
dddYddddd^^^ddddYddddd
dddddd^^dddddd^^dddddd
dYdddd^^dddddddddddddd
dddddddddddYddddddYddd
ddYdddddddddddddddddYd
ddddddddd,,,,ddddddddd
dddYddd,,,ddd,,ddYdddd
dddddd,,ddddddd,,ddddd
YYYYYY,YYYYYYYYY,YYYYY
`),
  spawns: [[10, 12], [11, 12], [12, 12], [9, 12], [10, 13], [11, 13], [9, 13], [12, 13], [8, 12], [13, 12], [10, 11], [11, 11]],
  enemies: [
    { type: 'hellhound', x: 8, y: 9, ai: 'aggressive', level: 14 },
    { type: 'hellhound', x: 14, y: 9, ai: 'aggressive', level: 14 },
    { type: 'dark_elf', x: 5, y: 7 },
    { type: 'dark_elf', x: 17, y: 7 },
    { type: 'minotaur', x: 10, y: 6 },
    { type: 'minotaur', x: 13, y: 6 },
    { type: 'chimera', x: 4, y: 3 },
    { type: 'chimera', x: 18, y: 3 },
    { type: 'dark_elf', x: 11, y: 3 },
    { type: 'durahan', x: 9, y: 1 },
    { type: 'durahan', x: 13, y: 1, boss: true, level: 15 },
  ],
  chests: [{ x: 1, y: 1, item: 'healing_drop' }, { x: 20, y: 1, gold: 600 }],
  intro: ['Zylo: Chimeras. And those bull-headed things... minotaurs. The plains have gone wild.', 'Max: Spread out so their breath cannot hit us all. Archers, take the fliers.'],
  after: { location: 'prompt', x: 13, y: 20, dir: 'up' },
};

const b17: BattleDef = {
  id: 'b17',
  name: 'Courtyard of Prompt',
  chapter: 6,
  music: 'dungeon',
  rows: rows(`
####################
#rrrrrrrrrrrrrrrrrr#
#rr##rrrrrrrrrr##rr#
#rr##rrr++rrrrr##rr#
#rrrrrrrrrrrrrrrrrr#
#r+rrrr#rrrr#rrrr+r#
#rrrrrr#rrrr#rrrrrr#
#rrrrrrrrrrrrrrrrrr#
#rr+rrrrrrrrrrrr+rr#
#rrrrr##rrrr##rrrrr#
#rrrrr##rrrr##rrrrr#
#r+rrrrrrrrrrrrrr+r#
#rrrrrrrrrrrrrrrrrr#
#rrrrrrrrrrrrrrrrrr#
#rrrrrrrrrrrrrrrrrr#
####################
`),
  spawns: [[9, 13], [10, 13], [8, 13], [11, 13], [9, 12], [10, 12], [8, 12], [11, 12], [7, 13], [12, 13], [7, 12], [12, 12]],
  enemies: [
    { type: 'armed_skeleton', x: 5, y: 11, ai: 'aggressive', level: 15 },
    { type: 'armed_skeleton', x: 14, y: 11, ai: 'aggressive', level: 15 },
    { type: 'dark_elf', x: 2, y: 8, level: 15 },
    { type: 'dark_elf', x: 17, y: 8, level: 15 },
    { type: 'durahan', x: 9, y: 7, level: 15 },
    { type: 'durahan', x: 10, y: 6, level: 15 },
    { type: 'golem', x: 4, y: 4 },
    { type: 'golem', x: 15, y: 4 },
    { type: 'armed_skeleton', x: 9, y: 4, level: 15 },
    { type: 'demon', x: 10, y: 2, boss: true },
  ],
  chests: [{ x: 1, y: 1, item: 'turbo_pepper' }, { x: 18, y: 1, item: 'legs_of_haste' }],
  intro: ['Anri: Golems... stone soldiers of the Ancients. Our swords will barely scratch them.', 'Max: Then we use magic. Mages to the front, under cover!'],
  after: { location: 'prompt', x: 13, y: 8, dir: 'up' },
};

const b18: BattleDef = {
  id: 'b18',
  name: 'The Great Hall - Chaos',
  chapter: 6,
  music: 'boss',
  rows: rows(`
####################
#FFFFFFFFFFFFFFFFFF#
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
    { type: 'durahan', x: 7, y: 9, ai: 'aggressive', level: 16 },
    { type: 'durahan', x: 12, y: 9, ai: 'aggressive', level: 16 },
    { type: 'demon', x: 4, y: 6 },
    { type: 'demon', x: 15, y: 6 },
    { type: 'golem', x: 8, y: 5 },
    { type: 'golem', x: 11, y: 5 },
    { type: 'dark_priest', x: 5, y: 2, level: 16, ai: 'healer' },
    { type: 'dark_priest', x: 14, y: 2, level: 16, ai: 'healer' },
    { type: 'chaos', x: 9, y: 2, boss: true, ai: 'boss' },
  ],
  winCondition: 'boss',
  chests: [{ x: 1, y: 1, item: 'bread_of_life' }, { x: 18, y: 1, item: 'protect_potion' }],
  intro: [
    'Chaos: INTRUDERS DETECTED. DARKSOL PROTOCOL ACTIVE. ELIMINATE.',
    'Lowe: It is enormous! Max, the Chaos Breaker!',
    'Max: Keep it busy. I am going for its core!',
  ],
  outro: [
    'Chaos: CORE... BREACHED... SHUTTING... DOWN...',
    'Adam: ...System reboot complete. Guardian unit Adam, online.',
    'Adam: Chaos was my brother unit. Darksol corrupted him. You have ended his suffering. I will serve the one who freed this hall.',
    { join: 'adam' },
    'Max: A robot of the Ancients... Welcome to the force, Adam. Now let us open those cells.',
  ],
  after: { location: 'prompt', x: 13, y: 5, dir: 'up' },
};

registerLocations([rudo, prompt_]);
registerBattles([b16, b17, b18]);
