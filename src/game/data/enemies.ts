import type { EnemyDef, MoveType } from '../types';

const e = (
  id: string, name: string, abbr: string, level: number,
  hp: number, mp: number, att: number, def: number, agi: number, mov: number,
  moveType: MoveType, sprite: EnemyDef['sprite'], extra: Partial<EnemyDef> = {},
): EnemyDef => ({ id, name, abbr, level, stats: { hp, mp, att, def, agi, mov }, moveType, range: [1, 1], sprite, ...extra });

export const ENEMIES: Record<string, EnemyDef> = {};
const list: EnemyDef[] = [
  // --- Chapter 1-2 ---
  e('goblin', 'Goblin', 'GBLN', 1, 9, 0, 7, 3, 2, 4, 'walk', { body: 'goblin', pal: { skin: '#70b040', cloth: '#806030', extra: '#d02020' }, weapon: 'sword' }, { gold: 8 }),
  e('dwarf', 'Dwarf', 'DWRF', 2, 12, 0, 9, 5, 2, 4, 'walk', { body: 'dwarf', pal: { skin: '#e0b080', hair: '#705030', cloth: '#a04030', armor: '#706060' }, hair: 'beard', weapon: 'axe' }, { gold: 10 }),
  e('rune_knight', 'Rune Knight', 'RKNT', 3, 16, 0, 11, 6, 5, 6, 'mounted', { body: 'centaur', pal: { skin: '#e0b080', hair: '#303030', cloth: '#802020', armor: '#808090', mount: '#504040' }, hair: 'helmet', weapon: 'lance' }, { gold: 14 }),
  e('dark_dwarf', 'Dark Dwarf', 'DDWF', 4, 15, 0, 12, 7, 3, 4, 'walk', { body: 'dwarf', pal: { skin: '#c0a080', hair: '#303040', cloth: '#402060', armor: '#504060' }, hair: 'beard', weapon: 'axe' }, { gold: 14 }),
  e('zombie', 'Zombie', 'ZMBE', 3, 18, 0, 10, 4, 1, 4, 'walk', { body: 'zombie', pal: {} }, { gold: 10, immuneStatus: true }),
  e('skeleton', 'Skeleton', 'SKEL', 5, 20, 0, 13, 8, 4, 5, 'walk', { body: 'skeleton', pal: {}, weapon: 'sword' }, { gold: 16, immuneStatus: true }),
  e('dark_priest', 'Dark Priest', 'DPRT', 5, 16, 12, 9, 5, 5, 5, 'walk', { body: 'priest', pal: { skin: '#d0b090', cloth: '#302040', trim: '#806090' }, hair: 'hood', weapon: 'staff' }, { gold: 20, spells: [{ spell: 'heal', level: 1 }, { spell: 'blaze', level: 1 }], ai: 'healer' }),
  e('giant_bat', 'Giant Bat', 'GBAT', 4, 14, 0, 10, 4, 8, 6, 'fly', { body: 'bat', pal: { cloth: '#6040a0' } }, { gold: 12 }),
  e('mannequin', 'Mannequin', 'MNQN', 5, 18, 0, 12, 6, 5, 5, 'walk', { body: 'puppet', pal: { skin: '#e0c090', hair: '#e0c090', cloth: '#c0a070' }, hair: 'bald', weapon: 'sword' }, { gold: 15, immuneStatus: true }),
  e('evil_puppet', 'Evil Puppet', 'EPPT', 6, 20, 0, 14, 7, 6, 5, 'walk', { body: 'puppet', pal: { skin: '#e0c090', hair: '#c04040', cloth: '#4060c0' }, weapon: 'axe' }, { gold: 18, immuneStatus: true }),
  e('sniper', 'Sniper', 'SNPR', 4, 14, 0, 11, 5, 4, 5, 'walk', { body: 'goblin', pal: { skin: '#70b040', cloth: '#406030', extra: '#404040' }, hair: 'bandana', weapon: 'bow' }, { gold: 14, range: [2, 2] }),
  e('marionette', 'Marionette', 'MRNT', 7, 40, 0, 16, 9, 7, 5, 'walk', { body: 'puppet', pal: { skin: '#f0d0a0', hair: '#f0f0f0', cloth: '#c02060', trim: '#f0e0a0' }, hair: 'long', weapon: 'sword' }, { gold: 120, boss: true, immuneStatus: true }),
  e('ghoul', 'Ghoul', 'GHUL', 6, 24, 0, 14, 6, 3, 4, 'walk', { body: 'zombie', pal: { skin: '#a0a0a0', cloth: '#403030' } }, { gold: 16, immuneStatus: true }),
  e('zombie_priest', 'Zombie Priest', 'ZPRT', 7, 44, 8, 16, 8, 4, 4, 'walk', { body: 'priest', pal: { skin: '#90a888', cloth: '#403040', trim: '#806090' }, hair: 'hood', weapon: 'staff' }, { gold: 100, boss: true, spells: [{ spell: 'blaze', level: 1 }], immuneStatus: true }),
  // --- Chapter 3-4 ---
  e('lizardman', 'Lizardman', 'LZMN', 7, 26, 0, 16, 10, 5, 5, 'walk', { body: 'lizard', pal: { skin: '#50a050', cloth: '#806040', armor: '#607050' }, weapon: 'axe' }, { gold: 22 }),
  e('silver_knight', 'Silver Knight', 'SKNT', 8, 28, 0, 17, 12, 8, 6, 'mounted', { body: 'centaur', pal: { skin: '#e0b080', hair: '#303030', cloth: '#c0c8d8', armor: '#d0d8e8', mount: '#d8d8e0' }, hair: 'helmet', weapon: 'lance' }, { gold: 30 }),
  e('pegasus_knight', 'Pegasus Knight', 'PKNT', 8, 24, 0, 16, 9, 11, 7, 'fly', { body: 'centaur', pal: { skin: '#e0b080', hair: '#f0d040', cloth: '#6080d0', armor: '#7090e0', mount: '#f0f0f8' }, hair: 'helmet', weapon: 'lance', wings: true }, { gold: 30 }),
  e('dark_mage', 'Dark Mage', 'DMAG', 9, 22, 20, 12, 7, 8, 5, 'walk', { body: 'mage', pal: { skin: '#d0b090', hair: '#303040', cloth: '#602080', trim: '#a060c0', extra: '#f86020' }, hair: 'hat', weapon: 'staff' }, { gold: 35, spells: [{ spell: 'blaze', level: 2 }, { spell: 'sleep', level: 1 }], ai: 'caster' }),
  e('hellhound', 'Hellhound', 'HHND', 9, 28, 0, 18, 9, 12, 7, 'beast', { body: 'hound', pal: { cloth: '#a03020', trim: '#f8e030' } }, { gold: 28 }),
  e('wyvern', 'Wyvern', 'WYVN', 10, 30, 0, 19, 11, 9, 7, 'fly', { body: 'wyvern', pal: { cloth: '#50a050', extra: '#306030' } }, { gold: 34 }),
  e('torch_eye', 'Torch Eye', 'TEYE', 8, 22, 20, 13, 8, 3, 0, 'float', { body: 'eye', pal: { cloth: '#f08020', extra: '#806050' } }, { gold: 26, ai: 'stationary', spells: [{ spell: 'blaze', level: 2 }] }),
  e('laser_eye', 'Laser Eye', 'LEYE', 10, 26, 30, 14, 10, 3, 0, 'float', { body: 'eye', pal: { cloth: '#4080f0', extra: '#605070' } }, { gold: 32, ai: 'stationary', spells: [{ spell: 'blast', level: 1 }] }),
  e('jet', 'Jet', 'JET', 11, 30, 0, 20, 10, 13, 8, 'fly', { body: 'wyvern', pal: { cloth: '#4060c0', extra: '#203080', trim: '#a0c0f0' } }, { gold: 36 }),
  e('armed_skeleton', 'Armed Skeleton', 'ASKL', 11, 36, 0, 21, 14, 6, 5, 'walk', { body: 'skeleton', pal: { armor: '#606070' }, weapon: 'axe' }, { gold: 38, immuneStatus: true }),
  e('elliott', 'Elliott', 'GNRL', 10, 60, 0, 22, 14, 10, 6, 'mounted', { body: 'centaur', pal: { skin: '#e0b080', hair: '#303030', cloth: '#d0a030', armor: '#f0c040', mount: '#303030' }, hair: 'helmet', weapon: 'lance' }, { gold: 300, boss: true, immuneStatus: true }),
  e('balbazak', 'Balbazak', 'GNRL', 13, 90, 0, 28, 16, 9, 5, 'walk', { body: 'knightlord', pal: { skin: '#e0b080', hair: '#303030', cloth: '#604020', armor: '#806040', extra: '#a02020' }, hair: 'helmet', weapon: 'axe' }, { gold: 500, boss: true, immuneStatus: true }),
  // --- Chapter 5-6 ---
  e('dark_elf', 'Dark Elf', 'DELF', 13, 34, 8, 22, 13, 12, 5, 'walk', { body: 'elf', pal: { skin: '#705080', hair: '#f0f0f0', cloth: '#303050' }, hair: 'long', weapon: 'bow' }, { gold: 40, range: [2, 2] }),
  e('durahan', 'Durahan', 'DRHN', 14, 44, 0, 26, 18, 8, 6, 'walk', { body: 'skeleton', pal: { armor: '#303040' }, weapon: 'sword' }, { gold: 48, immuneStatus: true }),
  e('chimera', 'Chimera', 'CHMR', 15, 48, 14, 27, 16, 12, 7, 'fly', { body: 'hound', pal: { cloth: '#c08030', trim: '#f8e030', extra: '#604020', hair: '#e0a020' } }, { gold: 55, spells: [{ spell: 'breath', level: 1 }] }),
  e('minotaur', 'Minotaur', 'MNTR', 15, 52, 0, 30, 17, 7, 5, 'walk', { body: 'minotaur', pal: {}, weapon: 'axe' }, { gold: 55 }),
  e('golem', 'Golem', 'GOLM', 16, 60, 0, 28, 22, 4, 4, 'walk', { body: 'golem', pal: { cloth: '#808890', trim: '#f84020' } }, { gold: 60, immuneStatus: true }),
  e('mishaela', 'Mishaela', 'WTCH', 14, 80, 40, 22, 15, 14, 5, 'walk', { body: 'mage', pal: { skin: '#e0c0d0', hair: '#8020a0', cloth: '#401060', trim: '#c060c0', extra: '#f0f060' }, hair: 'long', weapon: 'staff' }, { gold: 600, boss: true, spells: [{ spell: 'bolt', level: 1 }, { spell: 'sleep', level: 1 }], ai: 'boss', immuneStatus: true }),
  e('kane', 'Kane', 'DKNT', 15, 100, 0, 32, 19, 12, 6, 'walk', { body: 'knightlord', pal: { skin: '#e0b080', hair: '#202030', cloth: '#303040', armor: '#404058', extra: '#202030', trim: '#f03030' }, hair: 'mask', weapon: 'sword' }, { gold: 800, boss: true, immuneStatus: true }),
  e('chaos', 'Chaos', 'MCHN', 18, 130, 0, 36, 24, 6, 4, 'mech', { body: 'robot', pal: { armor: '#a08060', cloth: '#806040', trim: '#f03030' }, weapon: 'none' }, { gold: 1000, boss: true, spells: [{ spell: 'blast', level: 2 }], immuneStatus: true }),
  e('demon', 'Demon', 'DEMN', 17, 54, 0, 30, 17, 13, 6, 'fly', { body: 'demon', pal: {} }, { gold: 58 }),
  // --- Chapter 7-8 ---
  e('demon_master', 'Demon Master', 'DMST', 19, 58, 30, 32, 18, 14, 6, 'fly', { body: 'demon', pal: { skin: '#c04040', hair: '#401010', cloth: '#401010' } }, { gold: 70, spells: [{ spell: 'blaze', level: 3 }], ai: 'caster' }),
  e('cerberus', 'Cerberus', 'CRBR', 19, 60, 0, 34, 19, 16, 7, 'beast', { body: 'hound', pal: { cloth: '#403040', trim: '#f84040' } }, { gold: 70 }),
  e('blue_dragon', 'Blue Dragon', 'BDRG', 20, 70, 24, 36, 22, 10, 6, 'fly', { body: 'bigdragon', pal: { cloth: '#3060d0', trim: '#a0c0f0', extra: '#203080' } }, { gold: 90, spells: [{ spell: 'breath', level: 2 }] }),
  e('dark_knight', 'Dark Knight', 'DKNT', 20, 64, 0, 35, 22, 11, 6, 'walk', { body: 'knightlord', pal: { skin: '#e0b080', hair: '#202030', cloth: '#202030', armor: '#303048', extra: '#601020' }, hair: 'helmet', weapon: 'sword' }, { gold: 80 }),
  e('high_priest', 'High Priest', 'HPRT', 21, 50, 40, 24, 16, 12, 5, 'walk', { body: 'priest', pal: { skin: '#d0b090', cloth: '#602020', trim: '#f0c040' }, hair: 'hood', weapon: 'staff' }, { gold: 80, spells: [{ spell: 'heal', level: 3 }, { spell: 'bolt', level: 1 }], ai: 'healer' }),
  e('colossus', 'Colossus', 'CLSS', 22, 160, 0, 40, 28, 5, 3, 'mech', { body: 'colossus', pal: { cloth: '#d0a030', trim: '#f84020' } }, { gold: 1500, boss: true, immuneStatus: true, spells: [{ spell: 'blast', level: 2 }] }),
  e('ramladu', 'Ramladu', 'KING', 23, 150, 40, 38, 24, 12, 5, 'walk', { body: 'king', pal: { skin: '#e0b080', hair: '#a0a0a0', cloth: '#402060', armor: '#603080', extra: '#801020' }, hair: 'crown', weapon: 'sword' }, { gold: 2000, boss: true, spells: [{ spell: 'bolt', level: 2 }], ai: 'boss', immuneStatus: true }),
  e('dragon', 'Dragon', 'DRGN', 24, 90, 30, 42, 26, 12, 6, 'fly', { body: 'bigdragon', pal: { cloth: '#c03020', trim: '#f0c080', extra: '#601010' } }, { gold: 120, spells: [{ spell: 'breath', level: 3 }] }),
  e('darksol', 'Darksol', 'DSOL', 26, 200, 90, 44, 26, 16, 5, 'float', { body: 'priest', pal: { skin: '#c0a0c0', cloth: '#201030', trim: '#8040a0' }, hair: 'hood', weapon: 'staff' }, { gold: 3000, boss: true, spells: [{ spell: 'bolt', level: 3 }, { spell: 'demonbreath', level: 1 }], ai: 'boss', immuneStatus: true }),
  e('dark_dragon', 'Dark Dragon', 'DDRG', 30, 300, 90, 50, 30, 8, 0, 'fly', { body: 'bigdragon', pal: { cloth: '#301040', trim: '#8060a0', extra: '#100818' }, big: true }, { gold: 0, boss: true, ai: 'stationary', spells: [{ spell: 'demonbreath', level: 2 }, { spell: 'bolt', level: 4 }], immuneStatus: true }),
  e('dragon_head', 'Dragon Head', 'DHED', 28, 160, 42, 46, 28, 8, 0, 'fly', { body: 'bigdragon', pal: { cloth: '#402050', trim: '#8060a0', extra: '#100818' } }, { gold: 0, ai: 'stationary', spells: [{ spell: 'breath', level: 3 }], immuneStatus: true }),
];
for (const en of list) ENEMIES[en.id] = en;

export function enemy(id: string): EnemyDef {
  const d = ENEMIES[id];
  if (!d) throw new Error('Unknown enemy ' + id);
  return d;
}
