import type { CharDef, SpellLearn } from '../types';

/** Force members, in roughly the order they can join. Stats are at their join level. */
export const CHARACTERS: Record<string, CharDef> = {};

/** Per-character spell lists that override the class list. */
export const CHAR_LEARN: Record<string, SpellLearn[]> = {
  anri: [
    { spell: 'freeze', level: 1, atLevel: 1 }, { spell: 'freeze', level: 2, atLevel: 7 }, { spell: 'muddle', level: 1, atLevel: 10 },
    { spell: 'freeze', level: 3, atLevel: 13 }, { spell: 'bolt', level: 1, atLevel: 16 }, { spell: 'freeze', level: 4, atLevel: 20 }, { spell: 'bolt', level: 2, atLevel: 24 },
  ],
  tao: [
    { spell: 'blaze', level: 1, atLevel: 1 }, { spell: 'blaze', level: 2, atLevel: 6 }, { spell: 'sleep', level: 1, atLevel: 9 },
    { spell: 'blaze', level: 3, atLevel: 12 }, { spell: 'blaze', level: 4, atLevel: 16 }, { spell: 'bolt', level: 1, atLevel: 20 }, { spell: 'bolt', level: 2, atLevel: 24 },
  ],
  arthur: [
    { spell: 'blaze', level: 1, atLevel: 8 }, { spell: 'blaze', level: 2, atLevel: 12 }, { spell: 'freeze', level: 2, atLevel: 16 }, { spell: 'bolt', level: 1, atLevel: 22 },
  ],
  alef: [
    { spell: 'blaze', level: 2, atLevel: 1 }, { spell: 'bolt', level: 1, atLevel: 1 }, { spell: 'blaze', level: 3, atLevel: 14 },
    { spell: 'bolt', level: 2, atLevel: 17 }, { spell: 'bolt', level: 3, atLevel: 22 }, { spell: 'bolt', level: 4, atLevel: 28 },
  ],
  torasu: [
    { spell: 'heal', level: 3, atLevel: 1 }, { spell: 'detox', level: 1, atLevel: 1 }, { spell: 'aura', level: 1, atLevel: 1 },
    { spell: 'quick', level: 1, atLevel: 15 }, { spell: 'heal', level: 4, atLevel: 18 }, { spell: 'aura', level: 2, atLevel: 20 }, { spell: 'aura', level: 3, atLevel: 26 },
  ],
  khris: [
    { spell: 'heal', level: 1, atLevel: 1 }, { spell: 'detox', level: 1, atLevel: 5 }, { spell: 'heal', level: 2, atLevel: 8 },
    { spell: 'quick', level: 1, atLevel: 11 }, { spell: 'heal', level: 3, atLevel: 14 }, { spell: 'aura', level: 1, atLevel: 18 }, { spell: 'aura', level: 2, atLevel: 24 },
  ],
  lowe: [
    { spell: 'heal', level: 1, atLevel: 1 }, { spell: 'detox', level: 1, atLevel: 4 }, { spell: 'heal', level: 2, atLevel: 7 },
    { spell: 'slow', level: 1, atLevel: 10 }, { spell: 'heal', level: 3, atLevel: 13 }, { spell: 'aura', level: 1, atLevel: 17 },
    { spell: 'quick', level: 1, atLevel: 20 }, { spell: 'heal', level: 4, atLevel: 24 }, { spell: 'aura', level: 2, atLevel: 28 },
  ],
  gong: [{ spell: 'heal', level: 1, atLevel: 1 }, { spell: 'heal', level: 2, atLevel: 9 }, { spell: 'heal', level: 3, atLevel: 16 }, { spell: 'aura', level: 1, atLevel: 22 }],
  domingo: [
    { spell: 'freeze', level: 1, atLevel: 1 }, { spell: 'freeze', level: 2, atLevel: 1 }, { spell: 'muddle', level: 1, atLevel: 10 },
    { spell: 'freeze', level: 3, atLevel: 13 }, { spell: 'freeze', level: 4, atLevel: 18 }, { spell: 'boost', level: 1, atLevel: 22 },
  ],
  hanzou: [{ spell: 'sleep', level: 1, atLevel: 1 }, { spell: 'desoul', level: 1, atLevel: 1 }, { spell: 'blaze', level: 2, atLevel: 18 }],
  max: [{ spell: 'egress', level: 1, atLevel: 1 }],
};

const d = (
  id: string, name: string, classId: string, level: number,
  hp: number, mp: number, att: number, def: number, agi: number,
  sprite: CharDef['sprite'], desc: string, items: string[] = [], extra: Partial<CharDef> = {},
): CharDef => ({ id, name, classId, level, base: { hp, mp, att, def, agi, mov: 0 }, sprite, desc, items, ...extra });

const list: CharDef[] = [
  d('max', 'Max', 'SDMN', 1, 12, 0, 6, 4, 4, { body: 'human', pal: { skin: '#f0c090', hair: '#4050d0', cloth: '#e8e8f0', armor: '#3050c8', trim: '#f8d020' }, hair: 'short', weapon: 'sword' },
    'The young swordsman of Guardiana, trained by Varios.', ['short_sword', 'medical_herb']),
  d('lowe', 'Lowe', 'PRST', 1, 10, 8, 3, 3, 3, { body: 'priest', pal: { skin: '#f0c090', hair: '#d08030', cloth: '#30a050', trim: '#f0f0d0' }, hair: 'hood', weapon: 'staff' },
    'A halfling priest and Max\'s oldest friend.', ['wooden_staff', 'medical_herb']),
  d('ken', 'Ken', 'KNTE', 1, 12, 0, 6, 4, 3, { body: 'centaur', pal: { skin: '#f0c090', hair: '#6040a0', cloth: '#3050c0', armor: '#4060d0', mount: '#c0a080' }, hair: 'short', weapon: 'lance' },
    'A centaur knight, brave and loyal.', ['spear']),
  d('tao', 'Tao', 'MAGE', 1, 9, 8, 2, 2, 4, { body: 'mage', pal: { skin: '#f0c090', hair: '#f06060', cloth: '#f0a030', trim: '#f8f0d0', extra: '#f86020' }, hair: 'hat', weapon: 'staff' },
    'A young mage who commands fire.', ['wooden_staff']),
  d('hans', 'Hans', 'ACHR', 1, 10, 0, 5, 3, 4, { body: 'elf', pal: { skin: '#f0d0a0', hair: '#f0d040', cloth: '#30a050', trim: '#e0e0e0' }, hair: 'short', weapon: 'bow' },
    'An elf archer with a steady hand.', ['wooden_arrow']),
  d('luke', 'Luke', 'WARR', 1, 13, 0, 7, 5, 2, { body: 'dwarf', pal: { skin: '#f0c090', hair: '#c05020', cloth: '#30a050', armor: '#8090a0' }, hair: 'beard', weapon: 'axe' },
    'A dwarf warrior, strong as an ox.', ['short_axe']),
  d('gong', 'Gong', 'MNK', 1, 13, 4, 6, 3, 5, { body: 'human', pal: { skin: '#e0b080', hair: '#e0b080', cloth: '#f09030', trim: '#f8e0c0' }, hair: 'bald', weapon: 'none' },
    'A wandering monk who heals with his hands.', []),
  d('gort', 'Gort', 'WARR', 2, 14, 0, 8, 5, 2, { body: 'dwarf', pal: { skin: '#f0c090', hair: '#a0a0a0', cloth: '#a04030', armor: '#8090a0' }, hair: 'beard', weapon: 'axe' },
    'An old dwarf veteran, fond of ale.', ['hand_axe']),
  d('mae', 'Mae', 'KNTE', 2, 13, 0, 7, 4, 4, { body: 'centaur', pal: { skin: '#f0c090', hair: '#f8d840', cloth: '#f080a0', armor: '#f0a0c0', mount: '#f0f0f0' }, hair: 'long', weapon: 'lance' },
    'Daughter of Varios, a knight of Guardiana.', ['spear']),
  d('khris', 'Khris', 'PRST', 3, 11, 10, 4, 3, 3, { body: 'priest', pal: { skin: '#f0c090', hair: '#f080c0', cloth: '#f0f0f8', trim: '#f0a0c0' }, hair: 'long', weapon: 'staff' },
    'A kind priestess from Alterone.', ['wooden_staff']),
  d('anri', 'Anri', 'MAGE', 4, 12, 14, 4, 3, 5, { body: 'mage', pal: { skin: '#f0c090', hair: '#8060e0', cloth: '#3050c0', trim: '#f0f0f8', extra: '#80d8ff' }, hair: 'long', weapon: 'staff' },
    'Princess of Guardiana, student of Manarina.', ['power_staff']),
  d('arthur', 'Arthur', 'KNTE', 4, 12, 4, 6, 4, 4, { body: 'centaur', pal: { skin: '#f0c090', hair: '#8040c0', cloth: '#6040c0', armor: '#7050d0', mount: '#8090a0' }, hair: 'short', weapon: 'lance' },
    'A knight of Manarina with hidden talent.', ['bronze_lance']),
  d('diane', 'Diane', 'ACHR', 4, 13, 0, 7, 4, 5, { body: 'centaur', pal: { skin: '#f0c090', hair: '#e04040', cloth: '#30a050', mount: '#a06030' }, hair: 'long', weapon: 'bow' },
    'A centaur archer with a sharp eye.', ['iron_arrow']),
  d('balbaroy', 'Balbaroy', 'BDMN', 5, 15, 0, 9, 6, 7, { body: 'bird', pal: { skin: '#f0c090', hair: '#3050c0', cloth: '#3050c0', trim: '#f0f0f8', extra: '#f0f0f8' }, hair: 'short', weapon: 'sword' },
    'A birdman warrior of Shade Abbey.', ['middle_sword']),
  d('amon', 'Amon', 'BDMN', 5, 13, 0, 8, 5, 8, { body: 'bird', pal: { skin: '#f0c090', hair: '#f06090', cloth: '#30a050', trim: '#f0f0f8', extra: '#f8f0d0' }, hair: 'long', weapon: 'sword' },
    'Balbaroy\'s wife, swift as the wind.', ['middle_sword']),
  d('jogurt', 'Jogurt', 'YGRT', 1, 8, 0, 1, 1, 1, { body: 'hamster', pal: { cloth: '#f0d060' } },
    'A hamster. It wears a tiny helmet.', [], { fixed: true }),
  d('zylo', 'Zylo', 'WFMN', 6, 18, 0, 12, 7, 10, { body: 'wolf', pal: { skin: '#8890a0', hair: '#8890a0', cloth: '#3050c0', trim: '#f0f0f0' }, hair: 'short', weapon: 'claw' },
    'A wolfman cured by Lunar Dew.', []),
  d('kokichi', 'Kokichi', 'WKNT', 6, 14, 0, 9, 6, 7, { body: 'human', pal: { skin: '#f0c090', hair: '#a0a0a0', cloth: '#d0a030', armor: '#8090a0' }, hair: 'propeller', weapon: 'lance' },
    'An inventor who flies with a propeller pack.', ['spear']),
  d('guntz', 'Guntz', 'SKNT', 6, 20, 0, 11, 12, 2, { body: 'dwarf', pal: { skin: '#f0c090', hair: '#705030', cloth: '#507050', armor: '#8898a0' }, hair: 'helmet', weapon: 'lance' },
    'An armored dwarf in steam-powered plate.', ['bronze_lance']),
  d('pelle', 'Pelle', 'KNTE', 7, 17, 0, 10, 7, 6, { body: 'centaur', pal: { skin: '#f0c090', hair: '#60a060', cloth: '#30a050', armor: '#40b060', mount: '#a06030' }, hair: 'helmet', weapon: 'lance' },
    'A knight from Bustoke, disciplined and calm.', ['bronze_lance']),
  d('vankar', 'Vankar', 'KNTE', 8, 18, 0, 11, 7, 6, { body: 'centaur', pal: { skin: '#f0c090', hair: '#c04040', cloth: '#c03030', armor: '#d04040', mount: '#604030' }, hair: 'short', weapon: 'lance' },
    'A former Runefaust knight seeking redemption.', ['steel_lance']),
  d('domingo', 'Domingo', 'MGCR', 8, 16, 20, 8, 10, 9, { body: 'blob', pal: { cloth: '#60d0f0', extra: '#f0a020' } },
    'A magical creature hatched from a strange egg.', []),
  d('earnest', 'Earnest', 'KNTE', 10, 22, 0, 13, 9, 8, { body: 'centaur', pal: { skin: '#f0c090', hair: '#3050c0', cloth: '#3050c0', armor: '#5070e0', mount: '#303030' }, hair: 'short', weapon: 'lance' },
    'A knight imprisoned in Uranbatol.', ['steel_lance']),
  d('lyle', 'Lyle', 'ACHR', 10, 20, 0, 12, 8, 8, { body: 'centaur', pal: { skin: '#f0c090', hair: '#f0e060', cloth: '#a04030', mount: '#c0a080' }, hair: 'short', weapon: 'bow' },
    'A centaur bowman from Waral.', ['steel_arrow']),
  d('bleu', 'Bleu', 'DRGN', 10, 24, 0, 14, 11, 5, { body: 'dragon', pal: { cloth: '#40a060', trim: '#e0d070', extra: '#2070a0' } },
    'A young dragon from Dragonia.', []),
  d('musashi', 'Musashi', 'SMR', 12, 32, 0, 22, 14, 14, { body: 'human', pal: { skin: '#f0c090', hair: '#202030', cloth: '#6040a0', trim: '#f0f0f0' }, hair: 'ponytail', weapon: 'katana' },
    'A samurai from a far land.', ['katana']),
  d('adam', 'Adam', 'CYBG', 12, 30, 0, 18, 18, 6, { body: 'robot', pal: { armor: '#60a060', cloth: '#408040', trim: '#60f0ff' }, weapon: 'none' },
    'An ancient robot of Prompt, reawakened.', []),
  d('alef', 'Alef', 'MAGE', 12, 18, 24, 8, 7, 10, { body: 'mage', pal: { skin: '#f0d0a0', hair: '#f08030', cloth: '#802080', trim: '#f0f0f8', extra: '#f8f060' }, hair: 'long', weapon: 'staff' },
    'An elf mage freed from the dungeons.', ['guardian_staff']),
  d('torasu', 'Torasu', 'VICR', 13, 24, 30, 10, 10, 9, { body: 'priest', pal: { skin: '#f0c090', hair: '#e0e0e0', cloth: '#e0e0f0', trim: '#f0c040' }, hair: 'beard', weapon: 'staff' },
    'An old vicar of great faith.', ['holy_staff']),
  d('hanzou', 'Hanzou', 'NINJ', 14, 28, 12, 20, 13, 20, { body: 'human', pal: { skin: '#f0c090', hair: '#202030', cloth: '#202030', armor: '#303040', trim: '#f03030' }, hair: 'mask', weapon: 'katana' },
    'A ninja who moves like a shadow.', ['katana']),
];
for (const ch of list) CHARACTERS[ch.id] = ch;

export const CHAR_ORDER = list.map((c) => c.id);
