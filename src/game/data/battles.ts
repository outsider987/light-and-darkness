import type { BattleDef } from '../types';
export const BATTLES: Record<string, BattleDef> = {};
export function registerBattles(list: BattleDef[]): void {
  for (const b of list) BATTLES[b.id] = b;
}
