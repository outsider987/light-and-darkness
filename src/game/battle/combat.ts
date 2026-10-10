import type { SpellDef, SpellLevel, Unit } from '../types';
import { effAgi, effAtt, effDef, attackRange } from '../state';
import { landEffect } from '../terrain';
import { dist } from './pathfinding';
import { rng } from '../../engine/rng';

export interface Hit {
  attacker: Unit;
  target: Unit;
  dmg: number;
  miss: boolean;
  crit: boolean;
  killed: boolean;
  counter: boolean;
}

function physicalDamage(att: Unit, def: Unit, defTerrain: string, defMt: Parameters<typeof landEffect>[1]): { dmg: number; crit: boolean } {
  const raw = effAtt(att) - effDef(def);
  let dmg: number;
  if (raw <= 0) dmg = rng.int(0, 1);
  else {
    dmg = Math.round(raw * (0.88 + rng.next() * 0.24));
    const le = landEffect(defTerrain, defMt);
    dmg = Math.round(dmg * (1 - le / 100));
    dmg = Math.max(1, dmg);
  }
  const crit = rng.chance(1 / 12);
  if (crit) dmg = Math.max(dmg + 1, Math.round(dmg * 1.5));
  return { dmg, crit };
}

function dodgeChance(att: Unit, def: Unit): number {
  const d = effAgi(def) - effAgi(att);
  return Math.max(0.02, Math.min(0.3, 0.05 + d * 0.015));
}

function doubleChance(att: Unit, def: Unit): number {
  const d = effAgi(att) - effAgi(def);
  if (d <= 0) return 0.04;
  return Math.min(0.4, 0.08 + d * 0.02);
}

/**
 * Resolve a full physical exchange: first strike, possible double attack, possible counter.
 * Terrain lookup gives the terrain char under a unit for land effect.
 */
export function resolveAttack(att: Unit, def: Unit, terrainAt: (x: number, y: number) => string, mtOf: (u: Unit) => Parameters<typeof landEffect>[1]): Hit[] {
  const hits: Hit[] = [];
  const strike = (a: Unit, d: Unit, counter: boolean): Hit => {
    if (d.sleep <= 0 && rng.chance(dodgeChance(a, d))) {
      return { attacker: a, target: d, dmg: 0, miss: true, crit: false, killed: false, counter };
    }
    const { dmg, crit } = physicalDamage(a, d, terrainAt(d.x, d.y), mtOf(d));
    d.hp = Math.max(0, d.hp - dmg);
    const killed = d.hp === 0;
    if (killed) d.alive = false;
    if (dmg > 0 && d.sleep > 0) d.sleep = 0;
    return { attacker: a, target: d, dmg, miss: false, crit, killed, counter };
  };
  hits.push(strike(att, def, false));
  if (def.alive && rng.chance(doubleChance(att, def))) hits.push(strike(att, def, false));
  if (def.alive && def.sleep <= 0 && def.muddle <= 0) {
    const [mn, mx] = attackRange(def);
    const d = dist(att.x, att.y, def.x, def.y);
    if (d >= mn && d <= mx && rng.chance(0.25)) hits.push(strike(def, att, true));
  }
  return hits;
}

export function magicDamage(lv: SpellLevel): number {
  return Math.max(1, Math.round(lv.power * (0.9 + rng.next() * 0.2)));
}

export function applyDamage(u: Unit, dmg: number): boolean {
  u.hp = Math.max(0, u.hp - dmg);
  if (u.hp === 0) u.alive = false;
  if (dmg > 0) u.sleep = 0;
  return !u.alive;
}

export function statusSucceeds(sp: SpellDef, lv: SpellLevel, target: Unit): boolean {
  if (target.immuneStatus || target.boss) return false;
  return rng.chance(lv.power / 100);
}
