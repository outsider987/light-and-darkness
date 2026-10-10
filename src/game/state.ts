import type { ClassDef, GameState, Growth, ItemDef, Unit, SpellLearn } from './types';
import { CLASSES, classOf } from './data/classes';
import { CHARACTERS, CHAR_LEARN } from './data/characters';
import { ENEMIES } from './data/enemies';
import { item as itemDef } from './data/items';
import { rng } from '../engine/rng';

export const SAVE_VERSION = 1;
export const MAX_PARTY = 12;
export const MAX_ITEMS = 4;

export function newGame(): GameState {
  const g: GameState = {
    version: SAVE_VERSION,
    force: [],
    party: [],
    gold: 100,
    chapter: 1,
    flags: {},
    location: 'guardiana',
    px: 14,
    py: 20,
    pdir: 'up',
    // Guardiana church door: where Egress and defeats return before any church visit
    lastChurch: { location: 'guardiana', x: 22, y: 16 },
    openedChests: {},
    depot: [],
    playtime: 0,
    battlesWon: 0,
    nextUid: 1,
    seed: Date.now() & 0xffff,
  };
  for (const id of ['max', 'lowe', 'ken', 'tao', 'hans', 'luke']) joinForce(g, id);
  return g;
}

export function unitClass(u: Unit): ClassDef {
  return classOf(u.classId);
}

export function hasMember(g: GameState, id: string): boolean {
  return g.force.some((u) => u.id === id);
}

export function member(g: GameState, id: string): Unit | undefined {
  return g.force.find((u) => u.id === id);
}

export function hero(g: GameState): Unit {
  return g.force.find((u) => u.isHero)!;
}

/** Add a character to the force (and to the active party if there is room). */
export function joinForce(g: GameState, id: string): Unit | null {
  if (hasMember(g, id)) return null;
  const def = CHARACTERS[id];
  if (!def) throw new Error('Unknown character ' + id);
  const cls = classOf(def.classId);
  const u: Unit = {
    uid: g.nextUid++,
    id,
    name: def.name,
    classId: def.classId,
    level: def.level,
    exp: 0,
    hp: def.base.hp,
    maxHp: def.base.hp,
    mp: def.base.mp,
    maxMp: def.base.mp,
    att: def.base.att,
    def: def.base.def,
    agi: def.base.agi,
    mov: cls.mov,
    items: [...(def.items ?? [])],
    equipWeapon: -1,
    equipRing: -1,
    spells: [],
    sprite: def.sprite,
    team: 'force',
    alive: true,
    poison: false,
    promoted: cls.promoted,
    fixed: def.fixed,
    isHero: id === 'max',
    x: 0,
    y: 0,
    dir: 'down',
    acted: false,
    buffs: { att: 0, def: 0, agi: 0, mov: 0, turns: 0 },
    sleep: 0,
    muddle: 0,
  };
  // auto-equip first weapon
  const wi = u.items.findIndex((it) => canEquip(u, itemDef(it)));
  if (wi >= 0) u.equipWeapon = wi;
  // spells known at join
  learnSpells(u, true);
  g.force.push(u);
  if (g.party.length < MAX_PARTY) g.party.push(id);
  return u;
}

export function makeEnemy(g: GameState, defId: string, x: number, y: number, levelOverride?: number): Unit {
  const d = ENEMIES[defId];
  if (!d) throw new Error('Unknown enemy ' + defId);
  const lvl = levelOverride ?? d.level;
  const scale = lvl / d.level;
  const s = (v: number) => Math.round(v * (scale === 1 ? 1 : 0.5 + scale * 0.5));
  const u: Unit = {
    uid: g.nextUid++,
    id: defId,
    name: d.name,
    classId: 'ENMY',
    level: lvl,
    exp: 0,
    hp: s(d.stats.hp),
    maxHp: s(d.stats.hp),
    mp: d.stats.mp,
    maxMp: d.stats.mp,
    att: s(d.stats.att),
    def: s(d.stats.def),
    agi: d.stats.agi,
    mov: d.stats.mov,
    items: d.drop ? [d.drop] : [],
    equipWeapon: -1,
    equipRing: -1,
    spells: d.spells ? d.spells.map((sp) => ({ ...sp })) : [],
    sprite: d.sprite,
    team: 'enemy',
    alive: true,
    poison: false,
    promoted: false,
    x,
    y,
    dir: 'down',
    acted: false,
    buffs: { att: 0, def: 0, agi: 0, mov: 0, turns: 0 },
    sleep: 0,
    muddle: 0,
    ai: d.ai ?? 'wait',
    boss: d.boss,
    defId,
    goldReward: d.gold ?? 0,
    drop: d.drop,
    immuneStatus: d.immuneStatus,
  };
  return u;
}

// ---- Equipment & derived stats ---------------------------------------------

export function weaponOf(u: Unit): ItemDef | undefined {
  if (u.equipWeapon < 0 || u.equipWeapon >= u.items.length) return undefined;
  const it = itemDef(u.items[u.equipWeapon]);
  return it.kind === 'weapon' ? it : undefined;
}

export function ringOf(u: Unit): ItemDef | undefined {
  if (u.equipRing < 0 || u.equipRing >= u.items.length) return undefined;
  const it = itemDef(u.items[u.equipRing]);
  return it.kind === 'ring' ? it : undefined;
}

export function canEquip(u: Unit, it: ItemDef): boolean {
  if (it.kind === 'ring') return u.team === 'force' && !u.fixed;
  if (it.kind !== 'weapon' || !it.weapon) return false;
  return unitClass(u).weapons.includes(it.weapon);
}

export function effAtt(u: Unit): number {
  const w = weaponOf(u)?.att ?? 0;
  const r = ringOf(u)?.att ?? 0;
  return Math.max(0, u.att + w + r + u.buffs.att);
}
export function effDef(u: Unit): number {
  const w = weaponOf(u)?.def ?? 0;
  const r = ringOf(u)?.def ?? 0;
  return Math.max(0, u.def + w + r + u.buffs.def);
}
export function effAgi(u: Unit): number {
  const r = ringOf(u)?.agi ?? 0;
  return Math.max(0, u.agi + r + u.buffs.agi);
}
export function effMov(u: Unit): number {
  const r = ringOf(u)?.mov ?? 0;
  return Math.max(0, u.mov + r + u.buffs.mov);
}
export function attackRange(u: Unit): [number, number] {
  if (u.team === 'enemy') return ENEMIES[u.defId ?? u.id]?.range ?? [1, 1];
  return unitClass(u).range;
}
export function moveTypeOf(u: Unit): ClassDef['moveType'] {
  if (u.team === 'enemy') return ENEMIES[u.defId ?? u.id]?.moveType ?? 'walk';
  return unitClass(u).moveType;
}
export function hasCursed(u: Unit): boolean {
  return !!(weaponOf(u)?.cursed || ringOf(u)?.cursed);
}

// ---- Inventory ----------------------------------------------------------------

export function addItem(u: Unit, id: string): boolean {
  if (u.items.length >= MAX_ITEMS) return false;
  u.items.push(id);
  if (u.equipWeapon < 0 && canEquip(u, itemDef(id)) && itemDef(id).kind === 'weapon') u.equipWeapon = u.items.length - 1;
  return true;
}

export function removeItem(u: Unit, idx: number): string | undefined {
  if (idx < 0 || idx >= u.items.length) return undefined;
  const [id] = u.items.splice(idx, 1);
  if (u.equipWeapon === idx) u.equipWeapon = -1;
  else if (u.equipWeapon > idx) u.equipWeapon--;
  if (u.equipRing === idx) u.equipRing = -1;
  else if (u.equipRing > idx) u.equipRing--;
  return id;
}

/** Give an item to anyone in the force with room (hero first). */
export function giveToForce(g: GameState, id: string): Unit | null {
  const order = [hero(g), ...g.force.filter((u) => !u.isHero)];
  for (const u of order) if (addItem(u, id)) return u;
  return null;
}

export function forceHasItem(g: GameState, id: string): Unit | undefined {
  return g.force.find((u) => u.items.includes(id));
}

/** True if any member carries the item or it is in HQ storage (key items sent there when hands were full). */
export function hasItem(g: GameState, id: string): boolean {
  return !!forceHasItem(g, id) || g.depot.includes(id);
}

export function takeFromForce(g: GameState, id: string): boolean {
  const u = forceHasItem(g, id);
  if (!u) return false;
  removeItem(u, u.items.indexOf(id));
  return true;
}

// ---- EXP / level ---------------------------------------------------------------

export function virtualLevel(u: Unit): number {
  return (u.promoted && u.team === 'force' ? 10 : 0) + u.level;
}

/** EXP for an action. Kill vs hit; scales with level difference. */
export function expGain(attacker: Unit, target: Unit, kill: boolean): number {
  const diff = virtualLevel(target) - virtualLevel(attacker);
  const base = kill ? 34 : 10;
  const v = Math.round(base * Math.pow(2, diff / 5));
  return kill ? Math.max(5, Math.min(49, v)) : Math.max(1, Math.min(24, v));
}

export function supportExp(caster: Unit, amount: number): number {
  const v = Math.round(10 + amount / 4 - caster.level / 2);
  return Math.max(3, Math.min(25, v));
}

export interface LevelResult {
  level: number;
  gains: Growth;
  newSpells: { spell: string; level: number }[];
}

function gain(avg: number): number {
  if (avg <= 0) return 0;
  let v = Math.floor(avg) + (rng.chance(avg - Math.floor(avg)) ? 1 : 0);
  const roll = rng.next();
  if (roll < 0.2) v += 1;
  else if (roll > 0.85 && v > 0) v -= 1;
  return v;
}

export function learnList(u: Unit): SpellLearn[] {
  const custom = CHAR_LEARN[u.id];
  if (custom) return custom;
  return unitClass(u).spells ?? [];
}

/** Grants any spells the unit qualifies for. Returns the new ones. */
export function learnSpells(u: Unit, silent = false): { spell: string; level: number }[] {
  const out: { spell: string; level: number }[] = [];
  const custom = CHAR_LEARN[u.id];
  const lvl = custom ? virtualLevel(u) : u.level;
  for (const l of learnList(u)) {
    if (l.atLevel > lvl) continue;
    const have = u.spells.find((s) => s.spell === l.spell);
    if (have) {
      if (have.level < l.level) {
        have.level = l.level;
        out.push({ spell: l.spell, level: l.level });
      }
    } else {
      u.spells.push({ spell: l.spell, level: l.level });
      out.push({ spell: l.spell, level: l.level });
    }
  }
  if (silent) return [];
  return out;
}

export function addExp(u: Unit, amount: number): LevelResult | null {
  if (u.team !== 'force' || u.fixed) return null;
  if (u.level >= 20 && u.exp >= 99) return null;
  u.exp += amount;
  if (u.exp < 100) return null;
  if (u.level >= 20) {
    u.exp = 99;
    return null;
  }
  u.exp -= 100;
  u.level++;
  const gr = unitClass(u).growth;
  const gains: Growth = { hp: Math.max(1, gain(gr.hp)), mp: gain(gr.mp), att: gain(gr.att), def: gain(gr.def), agi: gain(gr.agi) };
  u.maxHp += gains.hp;
  u.hp += gains.hp;
  u.maxMp += gains.mp;
  u.mp += gains.mp;
  u.att += gains.att;
  u.def += gains.def;
  u.agi += gains.agi;
  const newSpells = learnSpells(u);
  return { level: u.level, gains, newSpells };
}

export function canPromote(u: Unit): boolean {
  return u.team === 'force' && !u.promoted && u.level >= 10 && !!unitClass(u).promo;
}

export function promote(u: Unit): string {
  const to = unitClass(u).promo!;
  const prev = unitClass(u);
  u.classId = to;
  u.promoted = true;
  u.level = 1;
  u.exp = 0;
  const cls = CLASSES[to];
  u.mov = cls.mov;
  u.att += 2;
  u.def += 2;
  u.maxHp += 3;
  u.hp = u.maxHp;
  // re-validate weapon
  const w = weaponOf(u);
  if (w && !cls.weapons.includes(w.weapon!)) u.equipWeapon = -1;
  learnSpells(u, true);
  return `${prev.name} -> ${cls.name}`;
}

export function heal(u: Unit, amount: number): number {
  const before = u.hp;
  u.hp = Math.min(u.maxHp, u.hp + amount);
  return u.hp - before;
}

export function fullHeal(u: Unit): void {
  u.hp = u.maxHp;
  u.mp = u.maxMp;
  u.poison = false;
  u.sleep = 0;
  u.muddle = 0;
  u.buffs = { att: 0, def: 0, agi: 0, mov: 0, turns: 0 };
}

export function partyUnits(g: GameState): Unit[] {
  return g.party.map((id) => member(g, id)!).filter(Boolean);
}

export function reviveCost(u: Unit): number {
  return 20 + virtualLevel(u) * 10;
}

export function spellName(sp: { spell: string; level: number }): string {
  return `${sp.spell[0].toUpperCase()}${sp.spell.slice(1)} ${sp.level}`;
}
