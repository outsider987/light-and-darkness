import type { BattleDef, LocationDef } from '../../types';
import { registerLocations } from '../locations';
import { registerBattles } from '../battles';
import { S, npc, shopkeeper, priest, nova, rows } from './common';

const tower: LocationDef = {
  id: 'tower',
  name: 'Tower of the Ancients',
  music: 'dark',
  rows: rows(`
MMMMMMMMMMMMMMMMMMMM
MMMMMM########MMMMMM
MMMMM#FFFFFFFF#MMMMM
MMMMM#FFFGGFFF#MMMMM
MMMM^^FFFFFFFF^^MMMM
MMM^..rrrrrrrr..^MMM
MM^...rrrrrrrr...^MM
M^....rr.rr.rr....^M
M^..x.rrrrrrrr.a..^M
M^....rrrrrrrr....^M
MM^...rrrrrrrr...^MM
MM^^..rrrrrrrr..^^MM
MMM^^.rrrrrrrr.^^MMM
MMMM^^rrrrrrrr^^MMMM
MMMMM^^^^,,^^^^MMMMM
MMMMMMMMM,,MMMMMMMMM
`),
  churchPos: { x: 15, y: 9 },
  onEnter: (g) => {
    if (g.flags['won:b23']) {
      if (g.flags.ending_done) return [];
      return [
        { flag: 'ending_done' },
        { music: 'ending' },
        'Lowe: It is over... The Dark Dragon is sealed again. Max, we did it!',
        'Anri: The light is returning to the land. Father would be proud. And Varios... and Kane.',
        'Nova: The Shining Force has fulfilled the prophecy. Light and Darkness are in balance once more.',
        'Max: We go home. To Guardiana.',
        { ending: true },
      ];
    }
    if (g.flags['won:b22']) {
      if (g.flags.tower_after) return [];
      return [
        { flag: 'tower_after' },
        'Nova: Darksol is dead, but with his last breath he broke the seal. The Dark Dragon stirs at the summit.',
        'Nova: This is the final battle, Max. The Sword of Light is the only blade that can pierce its heart. Rest, pray, and then climb.',
      ];
    }
    if (g.flags.tower_arrived) return [];
    return [
      { chapter: 8 },
      { flag: 'tower_arrived' },
      'Nova: The Tower of the Ancients. Beyond the gate at Guardiana, where it all began.',
      'Nova: Darksol is inside, performing the rite to wake the Dark Dragon. Our camp is here. The church and I will prepare you.',
      'Max: Thank you, Nova. Everyone... this is what we trained for. Rest, then we climb.',
    ];
  },
  npcs: [
    nova('nova_t', 3, 8),
    priest('priest_t', 16, 8, 'Priest: I followed you from Guardiana to pray at the end of the world. Let me record your deeds.'),
    npc('merchant_t', 7, 7, S.merchant('#404080'), ['Merchant: Last shop before the end of everything. I would not miss it.', { shop: ['broad_sword', 'chrome_lance', 'great_axe', 'holy_staff', 'assault_shell', 'healing_drop', 'antidote', 'angel_wing', 'bread_of_life', 'power_potion', 'protect_potion', 'turbo_pepper', 'legs_of_haste'] }], { facePlayer: true }),
    npc('soldier_t', 12, 12, S.soldier('#c0c8d8', '#3050a0'), ['Guardiana soldier: The king sent us to hold the camp. Go, Max. Guardiana stands behind you.'], { wander: true }),
  ],
  chests: [{ x: 2, y: 7, item: 'healing_drop' }, { x: 17, y: 7, item: 'mobility_ring' }],
  exits: [
    { x: 9, y: 15, w: 2, dest: () => ({ location: 'runefaust', x: 13, y: 7, dir: 'down' }) },
    { x: 9, y: 2, w: 2, dest: (g) => (g.flags['won:b22'] ? { battle: 'b23' } : { battle: 'b22' }) },
  ],
};

const b22: BattleDef = {
  id: 'b22',
  name: 'Sanctum of Darksol',
  chapter: 8,
  music: 'boss',
  rows: rows(`
__________________
__#############___
__#gggggggggggg#__
__#g+gggggggg+g#__
__#gggggggggggg#__
__#ggg++gg++ggg#__
__#gggggggggggg#__
__#g+gggggggg+g#__
__#gggggggggggg#__
__#gggFFFFFFggg#__
__#gggFFFFFFggg#__
__#g+gFFFFFFg+g#__
__#gggFFFFFFggg#__
__#gggggggggggg#__
__#gggggggggggg#__
__######FF######__
________FF________
`),
  spawns: [[8, 13], [9, 13], [7, 13], [10, 13], [8, 14], [9, 14], [7, 14], [10, 14], [6, 13], [11, 13], [6, 14], [11, 14]],
  enemies: [
    { type: 'dark_knight', x: 6, y: 10, ai: 'aggressive', level: 24 },
    { type: 'dark_knight', x: 11, y: 10, ai: 'aggressive', level: 24 },
    { type: 'demon', x: 4, y: 8, level: 22 },
    { type: 'demon', x: 13, y: 8, level: 22 },
    { type: 'demon', x: 8, y: 7, level: 22 },
    { type: 'dragon', x: 5, y: 4 },
    { type: 'dragon', x: 12, y: 4 },
    { type: 'demon_master', x: 7, y: 3, level: 23 },
    { type: 'demon_master', x: 10, y: 3, level: 23 },
    { type: 'high_priest', x: 4, y: 2, ai: 'healer', level: 23 },
    { type: 'darksol', x: 9, y: 2, boss: true, ai: 'boss' },
  ],
  winCondition: 'boss',
  chests: [{ x: 3, y: 2, item: 'healing_drop' }, { x: 14, y: 14, item: 'bread_of_life' }],
  intro: [
    'Darksol: Welcome, children of the light. You are just in time to witness the end of your age.',
    'Darksol: Your brother died for nothing, Max. In moments, the Dark Dragon will wake, and I will rule the ashes.',
    'Max: You took my home, my teacher, and my brother. You will take nothing else. Shining Force, attack!',
  ],
  outro: [
    'Darksol: Impossible... a mortal sword... in my flesh...',
    'Darksol: But hear me, swordsman... the rite is complete. Hah... hah... The Dragon... WAKES!',
    'Lowe: The whole tower is shaking! Max, the summit!',
  ],
  after: { location: 'tower', x: 9, y: 4, dir: 'down' },
};

const b23: BattleDef = {
  id: 'b23',
  name: 'The Dark Dragon',
  chapter: 8,
  music: 'boss',
  rows: rows(`
vvvvvvvvvvvvvvvvvvvv
vvvrrrrrrrrrrrrrrvvv
vvrrrrrrrrrrrrrrrrvv
vrrrr+rrrrrrrr+rrrrv
vrrrrrrrrrrrrrrrrrrv
vvrrrrrrvvvvrrrrrrvv
vvvrrrrrvvvvrrrrrvvv
vvrrrrrrrrrrrrrrrrvv
vrrrr+rrrrrrrr+rrrrv
vrrrrrrrrrrrrrrrrrrv
vvrrrrrrrrrrrrrrrrvv
vvvrrrrrrrrrrrrrrvvv
vvvvrrrrrrrrrrrrvvvv
vvvvvrrrrrrrrrrvvvvv
vvvvvvvrrrrrrvvvvvvv
vvvvvvvvvvvvvvvvvvvv
`),
  spawns: [[9, 13], [10, 13], [8, 13], [11, 13], [9, 12], [10, 12], [8, 12], [11, 12], [7, 12], [12, 12], [7, 13], [12, 13]],
  enemies: [
    { type: 'demon', x: 6, y: 10, ai: 'aggressive', level: 24 },
    { type: 'demon', x: 13, y: 10, ai: 'aggressive', level: 24 },
    { type: 'blue_dragon', x: 4, y: 8 },
    { type: 'blue_dragon', x: 15, y: 8 },
    { type: 'demon_master', x: 7, y: 7, level: 24 },
    { type: 'demon_master', x: 12, y: 7, level: 24 },
    { type: 'dragon', x: 9, y: 4, level: 25 },
    { type: 'dragon_head', x: 6, y: 2, ai: 'stationary' },
    { type: 'dragon_head', x: 13, y: 2, ai: 'stationary' },
    { type: 'dark_dragon', x: 9, y: 1, boss: true, ai: 'stationary' },
  ],
  winCondition: 'boss',
  intro: [
    'Dark Dragon: ...WHO... WAKES... ME...',
    'Nova: The Dark Dragon! Its heads breathe fire for miles. Stay out of their reach until the way is open!',
    'Max: For Guardiana. For Varios. For Kane. This is the last battle!',
  ],
  outro: [
    'Dark Dragon: ...THE LIGHT... AGAIN... I... SLEEP...',
    'Lowe: It is sinking into the earth! The seal is closing!',
    'Max: It is over. Let us go home.',
  ],
  after: { location: 'tower', x: 9, y: 4, dir: 'down' },
};

registerLocations([tower]);
registerBattles([b22, b23]);
