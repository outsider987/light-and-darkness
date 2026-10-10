import type { ItemDef } from '../types';

const w = (id: string, name: string, weapon: ItemDef['weapon'], att: number, price: number, desc: string, extra: Partial<ItemDef> = {}): ItemDef =>
  ({ id, name, kind: 'weapon', weapon, att, price, desc, ...extra });
const u = (id: string, name: string, price: number, use: ItemDef['use'], desc: string): ItemDef =>
  ({ id, name, kind: 'use', price, use, desc });

export const ITEMS: Record<string, ItemDef> = {};
const list: ItemDef[] = [
  // swords (SDMN/HERO/BDMN/SKYW/SMR/NINJ)
  w('short_sword', 'Short Sword', 'sword', 5, 200, 'A plain short sword.'),
  w('middle_sword', 'Middle Sword', 'sword', 8, 450, 'A well-balanced sword.'),
  w('long_sword', 'Long Sword', 'sword', 12, 1200, 'A long steel blade.'),
  w('steel_sword', 'Steel Sword', 'sword', 16, 2400, 'Forged from fine steel.'),
  w('broad_sword', 'Broad Sword', 'sword', 20, 4000, 'A heavy, wide blade.'),
  w('katana', 'Katana', 'sword', 19, 5000, 'A samurai blade.'),
  w('chaos_breaker', 'Chaos Breaker', 'sword', 24, 0, 'Sword that can break the Chaos machine.', { use: { type: 'spell', spell: 'freeze', level: 2 } }),
  w('sword_of_darkness', 'Sword of Darkness', 'sword', 28, 0, 'A cursed blade of great power.', { cursed: true }),
  w('sword_of_light', 'Sword of Light', 'sword', 32, 0, 'The legendary blade of light.', { use: { type: 'spell', spell: 'bolt', level: 2 } }),
  // lances (KNTE/PLDN/WKNT/SKYL/SKNT/SBRN)
  w('spear', 'Spear', 'lance', 6, 250, 'A simple spear.'),
  w('bronze_lance', 'Bronze Lance', 'lance', 9, 600, 'A lance of bronze.'),
  w('steel_lance', 'Steel Lance', 'lance', 13, 1500, 'A lance of steel.'),
  w('halberd', 'Halberd', 'lance', 18, 3000, 'A long pole-axe.'),
  w('chrome_lance', 'Chrome Lance', 'lance', 23, 5000, 'A gleaming chrome lance.'),
  w('devil_lance', 'Devil Lance', 'lance', 27, 0, 'A cursed lance.', { cursed: true }),
  w('valkyrie', 'Valkyrie', 'lance', 30, 12000, 'The lance of the war goddess.'),
  // axes (WARR/GLDT)
  w('short_axe', 'Short Axe', 'axe', 6, 250, 'A small axe.'),
  w('hand_axe', 'Hand Axe', 'axe', 9, 600, 'A one-handed axe.'),
  w('middle_axe', 'Middle Axe', 'axe', 13, 1500, 'A sturdy axe.'),
  w('battle_axe', 'Battle Axe', 'axe', 18, 3000, 'An axe made for war.'),
  w('great_axe', 'Great Axe', 'axe', 23, 5000, 'A huge two-handed axe.'),
  w('heat_axe', 'Heat Axe', 'axe', 25, 0, 'An axe burning with fire.', { use: { type: 'spell', spell: 'blaze', level: 2 } }),
  w('atlas', 'Atlas', 'axe', 30, 12000, 'The axe of the titan.'),
  // staves (PRST/VICR/MAGE/WIZD)
  w('wooden_staff', 'Wooden Staff', 'staff', 3, 150, 'A wooden staff.'),
  w('power_staff', 'Power Staff', 'staff', 6, 500, 'A staff of power.'),
  w('guardian_staff', 'Guardian Staff', 'staff', 9, 1500, 'A protective staff.', { def: 2 }),
  w('holy_staff', 'Holy Staff', 'staff', 13, 3000, 'A staff blessed by the church.'),
  w('demon_rod', 'Demon Rod', 'staff', 16, 0, 'A cursed rod of demons.', { cursed: true }),
  w('great_rod', 'Great Rod', 'staff', 18, 9000, 'The rod of the archmage.'),
  // arrows (ACHR/BWMS)
  w('wooden_arrow', 'Wooden Arrow', 'arrow', 5, 200, 'Simple wooden arrows.'),
  w('iron_arrow', 'Iron Arrow', 'arrow', 8, 500, 'Iron-tipped arrows.'),
  w('steel_arrow', 'Steel Arrow', 'arrow', 12, 1200, 'Steel-tipped arrows.'),
  w('robin_arrow', 'Robin Arrow', 'arrow', 16, 3000, 'Arrows of a master.'),
  w('assault_shell', 'Assault Shell', 'arrow', 20, 5000, 'Explosive shells.'),
  w('elven_arrow', 'Elven Arrow', 'arrow', 24, 10000, 'Arrows of the elves.'),
  // rings
  { id: 'power_ring', name: 'Power Ring', kind: 'ring', price: 3000, att: 4, desc: 'Raises ATT. Casts Boost when used.', use: { type: 'spell', spell: 'boost', level: 1 } },
  { id: 'shield_ring', name: 'Shield Ring', kind: 'ring', price: 3000, def: 4, desc: 'Raises DEF.' },
  { id: 'speed_ring', name: 'Speed Ring', kind: 'ring', price: 3000, agi: 4, desc: 'Raises AGI. Casts Quick when used.', use: { type: 'spell', spell: 'quick', level: 1 } },
  { id: 'mobility_ring', name: 'Mobility Ring', kind: 'ring', price: 4000, mov: 2, desc: 'Raises MOV.' },
  { id: 'white_ring', name: 'White Ring', kind: 'ring', price: 5000, def: 2, desc: 'Casts Aura when used.', use: { type: 'spell', spell: 'aura', level: 1 } },
  { id: 'black_ring', name: 'Black Ring', kind: 'ring', price: 5000, att: 2, desc: 'Casts Blaze when used.', use: { type: 'spell', spell: 'blaze', level: 2 } },
  { id: 'evil_ring', name: 'Evil Ring', kind: 'ring', price: 0, att: 8, def: -2, cursed: true, desc: 'A cursed ring of dark power.' },
  // consumables
  u('medical_herb', 'Medical Herb', 10, { type: 'heal', amount: 10 }, 'Restores 10 HP.'),
  u('healing_seed', 'Healing Seed', 50, { type: 'heal', amount: 20 }, 'Restores 20 HP.'),
  u('healing_drop', 'Healing Drop', 200, { type: 'heal', amount: 40 }, 'Restores 40 HP.'),
  u('antidote', 'Antidote', 20, { type: 'cure' }, 'Cures poison.'),
  u('angel_wing', 'Angel Wing', 100, { type: 'egress' }, 'Retreat from battle.'),
  u('power_potion', 'Power Potion', 500, { type: 'stat', stat: 'att', amount: 2 }, 'ATT +2 permanently.'),
  u('protect_potion', 'Protect Potion', 500, { type: 'stat', stat: 'def', amount: 2 }, 'DEF +2 permanently.'),
  u('turbo_pepper', 'Turbo Pepper', 500, { type: 'stat', stat: 'agi', amount: 2 }, 'AGI +2 permanently.'),
  u('legs_of_haste', 'Legs of Haste', 1000, { type: 'stat', stat: 'mov', amount: 1 }, 'MOV +1 permanently.'),
  u('bread_of_life', 'Bread of Life', 500, { type: 'stat', stat: 'hp', amount: 4 }, 'Max HP +4 permanently.'),
  u('lunar_dew', 'Lunar Dew', 0, { type: 'none' }, 'Cures the werewolf curse.'),
  // key items
  { id: 'orb_of_light', name: 'Orb of Light', kind: 'key', price: 0, desc: 'A sphere glowing with holy light.' },
  { id: 'domingo_egg', name: 'Domingo Egg', kind: 'key', price: 2000, desc: 'A strange egg. It feels warm.' },
  { id: 'dragon_key', name: 'Dragon Key', kind: 'key', price: 0, desc: 'Opens the gate to Dragonia.' },
  { id: 'silver_key', name: 'Silver Key', kind: 'key', price: 0, desc: 'Opens the prison cells of Uranbatol.' },
];
for (const it of list) ITEMS[it.id] = it;

export function item(id: string): ItemDef {
  return ITEMS[id] ?? { id, name: '???', kind: 'key', price: 0, desc: 'Unknown item.' };
}
