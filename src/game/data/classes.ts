import type { ClassDef } from '../types';

const c = (
  id: string, name: string, abbr: string, moveType: ClassDef['moveType'], mov: number,
  range: [number, number], weapons: ClassDef['weapons'], growth: ClassDef['growth'],
  extra: Partial<ClassDef> = {},
): ClassDef => ({ id, name, abbr, moveType, mov, range, weapons, growth, promoted: false, ...extra });

export const CLASSES: Record<string, ClassDef> = {};
const list: ClassDef[] = [
  c('SDMN', 'Swordsman', 'SDMN', 'walk', 6, [1, 1], ['sword'], { hp: 2.4, mp: 0, att: 1.6, def: 1.3, agi: 1.3 }, { promo: 'HERO' }),
  c('HERO', 'Hero', 'HERO', 'walk', 6, [1, 1], ['sword'], { hp: 2.6, mp: 0.6, att: 1.9, def: 1.5, agi: 1.5 }, {
    promoted: true, spells: [{ spell: 'egress', level: 1, atLevel: 1 }],
  }),
  c('KNTE', 'Knight', 'KNTE', 'mounted', 7, [1, 1], ['lance'], { hp: 2.3, mp: 0, att: 1.6, def: 1.2, agi: 1.1 }, { promo: 'PLDN' }),
  c('PLDN', 'Paladin', 'PLDN', 'mounted', 7, [1, 1], ['lance'], { hp: 2.5, mp: 0, att: 1.9, def: 1.5, agi: 1.3 }, { promoted: true }),
  c('WARR', 'Warrior', 'WARR', 'walk', 5, [1, 1], ['axe'], { hp: 2.8, mp: 0, att: 1.8, def: 1.4, agi: 0.8 }, { promo: 'GLDT' }),
  c('GLDT', 'Gladiator', 'GLDT', 'walk', 5, [1, 1], ['axe'], { hp: 3.0, mp: 0, att: 2.1, def: 1.6, agi: 1.0 }, { promoted: true }),
  c('PRST', 'Priest', 'PRST', 'walk', 5, [1, 1], ['staff'], { hp: 1.7, mp: 1.6, att: 0.9, def: 0.9, agi: 1.0 }, {
    promo: 'VICR',
    spells: [
      { spell: 'heal', level: 1, atLevel: 1 }, { spell: 'detox', level: 1, atLevel: 4 },
      { spell: 'heal', level: 2, atLevel: 8 }, { spell: 'slow', level: 1, atLevel: 10 },
    ],
  }),
  c('VICR', 'Vicar', 'VICR', 'walk', 5, [1, 1], ['staff'], { hp: 2.0, mp: 1.8, att: 1.1, def: 1.1, agi: 1.1 }, {
    promoted: true,
    spells: [
      { spell: 'heal', level: 3, atLevel: 3 }, { spell: 'aura', level: 1, atLevel: 6 },
      { spell: 'quick', level: 1, atLevel: 9 }, { spell: 'heal', level: 4, atLevel: 12 }, { spell: 'aura', level: 2, atLevel: 16 },
    ],
  }),
  c('MAGE', 'Mage', 'MAGE', 'walk', 5, [1, 1], ['staff'], { hp: 1.6, mp: 1.8, att: 0.9, def: 0.8, agi: 1.2 }, {
    promo: 'WIZD',
    spells: [
      { spell: 'blaze', level: 1, atLevel: 1 }, { spell: 'blaze', level: 2, atLevel: 6 },
      { spell: 'sleep', level: 1, atLevel: 9 }, { spell: 'blaze', level: 3, atLevel: 12 },
    ],
  }),
  c('WIZD', 'Wizard', 'WIZD', 'walk', 5, [1, 1], ['staff'], { hp: 1.9, mp: 2.0, att: 1.1, def: 1.0, agi: 1.3 }, {
    promoted: true,
    spells: [
      { spell: 'freeze', level: 1, atLevel: 2 }, { spell: 'blaze', level: 4, atLevel: 5 },
      { spell: 'freeze', level: 2, atLevel: 8 }, { spell: 'bolt', level: 1, atLevel: 10 },
      { spell: 'freeze', level: 3, atLevel: 13 }, { spell: 'bolt', level: 2, atLevel: 16 }, { spell: 'bolt', level: 3, atLevel: 20 },
    ],
  }),
  c('ACHR', 'Archer', 'ACHR', 'walk', 5, [2, 2], ['arrow'], { hp: 2.0, mp: 0, att: 1.5, def: 1.1, agi: 1.2 }, { promo: 'BWMS' }),
  c('BWMS', 'Bowmaster', 'BWMS', 'walk', 5, [2, 3], ['arrow'], { hp: 2.2, mp: 0, att: 1.8, def: 1.3, agi: 1.4 }, { promoted: true }),
  c('MNK', 'Monk', 'MNK', 'walk', 5, [1, 1], ['claw'], { hp: 2.5, mp: 0.8, att: 1.7, def: 1.0, agi: 1.5 }, {
    promo: 'MMNK', spells: [{ spell: 'heal', level: 1, atLevel: 1 }, { spell: 'heal', level: 2, atLevel: 9 }],
  }),
  c('MMNK', 'Master Monk', 'MMNK', 'walk', 6, [1, 1], ['claw'], { hp: 2.8, mp: 1.0, att: 2.0, def: 1.2, agi: 1.7 }, {
    promoted: true, spells: [{ spell: 'heal', level: 3, atLevel: 5 }, { spell: 'aura', level: 1, atLevel: 10 }],
  }),
  c('BDMN', 'Birdman', 'BDMN', 'fly', 6, [1, 1], ['sword'], { hp: 2.1, mp: 0, att: 1.5, def: 1.1, agi: 1.5 }, { promo: 'SKYW' }),
  c('SKYW', 'Sky Warrior', 'SKYW', 'fly', 7, [1, 1], ['sword'], { hp: 2.3, mp: 0, att: 1.8, def: 1.3, agi: 1.7 }, { promoted: true }),
  c('WFMN', 'Wolfman', 'WFMN', 'beast', 7, [1, 1], ['claw'], { hp: 2.6, mp: 0, att: 2.0, def: 1.1, agi: 1.8 }, { promo: 'WFBR' }),
  c('WFBR', 'Wolf Baron', 'WFBR', 'beast', 7, [1, 1], ['claw'], { hp: 2.8, mp: 0, att: 2.3, def: 1.3, agi: 2.0 }, { promoted: true }),
  c('SMR', 'Samurai', 'SMR', 'walk', 6, [1, 1], ['sword'], { hp: 2.6, mp: 0, att: 2.0, def: 1.4, agi: 1.6 }, { promoted: true }),
  c('NINJ', 'Ninja', 'NINJ', 'walk', 6, [1, 1], ['sword'], { hp: 2.2, mp: 1.0, att: 1.8, def: 1.2, agi: 2.2 }, {
    promoted: true, spells: [{ spell: 'sleep', level: 1, atLevel: 1 }, { spell: 'desoul', level: 1, atLevel: 1 }],
  }),
  c('MGCR', 'Magical Creature', 'MGCR', 'float', 6, [1, 1], ['none'], { hp: 2.0, mp: 2.0, att: 1.2, def: 1.4, agi: 1.6 }, {
    promoted: true,
    spells: [
      { spell: 'freeze', level: 1, atLevel: 1 }, { spell: 'freeze', level: 2, atLevel: 5 },
      { spell: 'muddle', level: 1, atLevel: 8 }, { spell: 'freeze', level: 3, atLevel: 12 }, { spell: 'freeze', level: 4, atLevel: 18 },
    ],
  }),
  c('DRGN', 'Dragonewt', 'DRGN', 'fly', 6, [1, 1], ['claw'], { hp: 2.6, mp: 0, att: 1.9, def: 1.5, agi: 1.0 }, { promo: 'GRDR' }),
  c('GRDR', 'Great Dragon', 'GRDR', 'fly', 7, [1, 1], ['claw'], { hp: 3.0, mp: 0, att: 2.3, def: 1.8, agi: 1.2 }, { promoted: true }),
  c('WKNT', 'Wing Knight', 'WKNT', 'fly', 6, [1, 1], ['lance'], { hp: 2.2, mp: 0, att: 1.6, def: 1.2, agi: 1.5 }, { promo: 'SKYL' }),
  c('SKYL', 'Sky Lord', 'SKYL', 'fly', 7, [1, 1], ['lance'], { hp: 2.4, mp: 0, att: 1.9, def: 1.4, agi: 1.7 }, { promoted: true }),
  c('SKNT', 'Steam Knight', 'SKNT', 'mech', 4, [1, 1], ['lance'], { hp: 2.8, mp: 0, att: 1.7, def: 2.0, agi: 0.6 }, { promo: 'SBRN' }),
  c('SBRN', 'Steam Baron', 'SBRN', 'mech', 5, [1, 1], ['lance'], { hp: 3.0, mp: 0, att: 2.0, def: 2.3, agi: 0.8 }, { promoted: true }),
  c('CYBG', 'Cyborg', 'CYBG', 'mech', 5, [1, 1], ['none'], { hp: 2.8, mp: 0, att: 1.9, def: 1.9, agi: 0.9 }, { promo: 'ROBT' }),
  c('ROBT', 'Robot', 'ROBT', 'mech', 5, [1, 1], ['none'], { hp: 3.0, mp: 0, att: 2.2, def: 2.1, agi: 1.0 }, { promoted: true }),
  c('YGRT', 'Yogurt', 'YGRT', 'walk', 5, [1, 1], ['none'], { hp: 0, mp: 0, att: 0, def: 0, agi: 0 }, { promoted: true }),
  // enemy-only pseudo classes (for display)
  c('ENMY', 'Enemy', 'ENMY', 'walk', 5, [1, 1], ['none'], { hp: 0, mp: 0, att: 0, def: 0, agi: 0 }, { promoted: true }),
];
for (const cl of list) CLASSES[cl.id] = cl;

export function classOf(id: string): ClassDef {
  return CLASSES[id] ?? CLASSES.ENMY;
}
