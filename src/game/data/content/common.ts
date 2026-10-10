import type { SpriteSpec, Script, NpcDef, Dir } from '../../types';

/** NPC sprite presets. */
export const S = {
  man: (cloth = '#4060c0', hair = '#604020'): SpriteSpec => ({ body: 'human', pal: { skin: '#f0c090', hair, cloth }, hair: 'short' }),
  woman: (cloth = '#d04080', hair = '#a06030'): SpriteSpec => ({ body: 'human', pal: { skin: '#f0c090', hair, cloth }, hair: 'long' }),
  old: (cloth = '#806040'): SpriteSpec => ({ body: 'human', pal: { skin: '#e0c0a0', hair: '#d0d0d0', cloth }, hair: 'beard' }),
  kid: (cloth = '#40a060'): SpriteSpec => ({ body: 'goblin', pal: { skin: '#f0c090', hair: '#804020', cloth, extra: cloth }, hair: 'short' }),
  soldier: (armor = '#8090a0', cloth = '#3050a0'): SpriteSpec => ({ body: 'human', pal: { skin: '#f0c090', hair: '#604020', cloth, armor }, hair: 'helmet', weapon: 'lance' }),
  king: (cloth = '#802040'): SpriteSpec => ({ body: 'king', pal: { skin: '#f0c090', hair: '#d0d0d0', cloth, extra: '#c02020' }, hair: 'crown' }),
  priest: (cloth = '#f0f0f8'): SpriteSpec => ({ body: 'priest', pal: { skin: '#f0c090', hair: '#a0a0a0', cloth, trim: '#f0c040' }, hair: 'hood', weapon: 'staff' }),
  merchant: (cloth = '#a06030'): SpriteSpec => ({ body: 'human', pal: { skin: '#f0c090', hair: '#403020', cloth }, hair: 'bandana' }),
  mage: (cloth = '#4040a0', hair = '#a0a0a0'): SpriteSpec => ({ body: 'mage', pal: { skin: '#f0c090', hair, cloth, extra: '#80d8ff' }, hair: 'hat', weapon: 'staff' }),
  nova: (): SpriteSpec => ({ body: 'human', pal: { skin: '#e0c0a0', hair: '#e0e0e0', cloth: '#3050a0', trim: '#f0c040' }, hair: 'beard' }),
  dwarf: (cloth = '#a04030'): SpriteSpec => ({ body: 'dwarf', pal: { skin: '#f0c090', hair: '#705030', cloth }, hair: 'beard' }),
  elf: (cloth = '#30a050'): SpriteSpec => ({ body: 'elf', pal: { skin: '#f0d0a0', hair: '#f0d040', cloth }, hair: 'long' }),
  centaur: (cloth = '#3050c0'): SpriteSpec => ({ body: 'centaur', pal: { skin: '#f0c090', hair: '#604020', cloth, mount: '#a06030' }, hair: 'short', weapon: 'lance' }),
  bird: (cloth = '#3050c0'): SpriteSpec => ({ body: 'bird', pal: { skin: '#f0c090', hair: '#3050c0', cloth, extra: '#f0f0f8' }, hair: 'short' }),
  darkKnight: (): SpriteSpec => ({ body: 'knightlord', pal: { skin: '#e0b080', hair: '#202030', cloth: '#303040', armor: '#404058', extra: '#202030', trim: '#f03030' }, hair: 'mask', weapon: 'sword' }),
  darksol: (): SpriteSpec => ({ body: 'priest', pal: { skin: '#c0a0c0', cloth: '#201030', trim: '#8040a0' }, hair: 'hood', weapon: 'staff' }),
  robot: (armor = '#60a060'): SpriteSpec => ({ body: 'robot', pal: { armor, cloth: '#408040', trim: '#60f0ff' } }),
  lizard: (): SpriteSpec => ({ body: 'lizard', pal: {} }),
  hamster: (): SpriteSpec => ({ body: 'hamster', pal: { cloth: '#f0d060' } }),
};

export const npc = (id: string, x: number, y: number, sprite: SpriteSpec, script: Script, extra: Partial<NpcDef> = {}): NpcDef =>
  ({ id, x, y, sprite, script, ...extra });

export const shopkeeper = (id: string, x: number, y: number, items: string[], deals?: string[], dir: Dir = 'down'): NpcDef =>
  npc(id, x, y, S.merchant(), [{ shop: items, deals }], { dir, facePlayer: false });

export const priest = (id: string, x: number, y: number, greeting?: string): NpcDef =>
  npc(id, x, y, S.priest(), greeting ? [greeting, { church: true }] : [{ church: true }], { facePlayer: false });

export const nova = (id: string, x: number, y: number): NpcDef =>
  npc(id, x, y, S.nova(), [{ hq: true }], { name: 'Nova', facePlayer: false });

export const innkeeper = (id: string, x: number, y: number, price: number): NpcDef =>
  npc(id, x, y, S.woman('#806040'), ['Welcome to the inn, travelers.', { inn: price }], { facePlayer: false });

// Shop tiers
export const SHOP = {
  guardiana: ['short_sword', 'spear', 'short_axe', 'wooden_staff', 'wooden_arrow', 'medical_herb', 'antidote'],
  alterone: ['middle_sword', 'bronze_lance', 'hand_axe', 'power_staff', 'iron_arrow', 'medical_herb', 'healing_seed', 'antidote'],
  rindo: ['middle_sword', 'bronze_lance', 'hand_axe', 'power_staff', 'iron_arrow', 'medical_herb', 'healing_seed', 'antidote', 'angel_wing'],
  manarina: ['power_staff', 'guardian_staff', 'medical_herb', 'healing_seed', 'antidote', 'angel_wing'],
  bustoke: ['long_sword', 'steel_lance', 'middle_axe', 'guardian_staff', 'steel_arrow', 'medical_herb', 'healing_seed', 'antidote', 'angel_wing'],
  pao: ['long_sword', 'steel_lance', 'middle_axe', 'guardian_staff', 'steel_arrow', 'healing_seed', 'healing_drop', 'antidote', 'angel_wing', 'power_potion'],
  uranbatol: ['steel_sword', 'halberd', 'battle_axe', 'holy_staff', 'robin_arrow', 'healing_seed', 'healing_drop', 'antidote', 'angel_wing'],
  waral: ['steel_sword', 'halberd', 'battle_axe', 'holy_staff', 'robin_arrow', 'healing_seed', 'healing_drop', 'antidote', 'angel_wing', 'protect_potion'],
  rudo: ['broad_sword', 'chrome_lance', 'great_axe', 'holy_staff', 'assault_shell', 'healing_drop', 'antidote', 'angel_wing', 'power_ring', 'shield_ring', 'speed_ring'],
  prompt: ['broad_sword', 'chrome_lance', 'great_axe', 'holy_staff', 'assault_shell', 'healing_drop', 'antidote', 'angel_wing', 'mobility_ring', 'turbo_pepper', 'bread_of_life'],
};

/** Standard castle-interior strip used by many maps. */
export const rows = (s: string): string[] => s.trim().split('\n').map((r) => r.replace(/\s+$/, ''));
