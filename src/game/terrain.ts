import type { MoveType } from './types';

export interface Terrain {
  name: string;
  /** land effect percentage (damage reduction for ground units) */
  le: number;
  /** movement cost per move type; Infinity = impassable */
  cost: Record<MoveType, number>;
}

const X = Infinity;
const all = (n: number): Record<MoveType, number> => ({ walk: n, mounted: n, fly: 1, float: 1, mech: n, beast: n });

export const TERRAIN: Record<string, Terrain> = {
  '.': { name: 'Grass', le: 15, cost: all(1) },
  '*': { name: 'Meadow', le: 15, cost: all(1) },
  ',': { name: 'Road', le: 0, cost: all(1) },
  's': { name: 'Stone Road', le: 0, cost: all(1) },
  ':': { name: 'Sand', le: 15, cost: { walk: 1, mounted: 2, fly: 1, float: 1, mech: 2, beast: 1 } },
  'd': { name: 'Wasteland', le: 15, cost: { walk: 1, mounted: 2, fly: 1, float: 1, mech: 1, beast: 1 } },
  'T': { name: 'Forest', le: 30, cost: { walk: 2, mounted: 3, fly: 1, float: 1, mech: 3, beast: 1 } },
  'Y': { name: 'Dead Woods', le: 30, cost: { walk: 2, mounted: 3, fly: 1, float: 1, mech: 3, beast: 1 } },
  't': { name: 'Bush', le: 30, cost: { walk: 2, mounted: 2, fly: 1, float: 1, mech: 2, beast: 1 } },
  '^': { name: 'Hills', le: 30, cost: { walk: 2, mounted: 3, fly: 1, float: 1, mech: 3, beast: 1 } },
  'M': { name: 'Mountain', le: 45, cost: { walk: X, mounted: X, fly: 1, float: 1, mech: X, beast: X } },
  '~': { name: 'Water', le: 0, cost: { walk: X, mounted: X, fly: 1, float: 1, mech: X, beast: X } },
  'v': { name: 'Lava', le: 0, cost: { walk: X, mounted: X, fly: 1, float: 1, mech: X, beast: X } },
  '=': { name: 'Bridge', le: 0, cost: all(1) },
  'B': { name: 'Deck', le: 0, cost: all(1) },
  '#': { name: 'Wall', le: 0, cost: all(X) },
  'F': { name: 'Floor', le: 0, cost: all(1) },
  'r': { name: 'Ruins', le: 15, cost: all(1) },
  'C': { name: 'Carpet', le: 0, cost: all(1) },
  'D': { name: 'Door', le: 0, cost: all(1) },
  'S': { name: 'Stairs', le: 0, cost: all(1) },
  'R': { name: 'Roof', le: 0, cost: all(X) },
  'c': { name: 'Counter', le: 0, cost: all(X) },
  '+': { name: 'Pillar', le: 0, cost: all(X) },
  '|': { name: 'Column', le: 0, cost: all(X) },
  '%': { name: 'Fence', le: 0, cost: all(X) },
  'b': { name: 'Bed', le: 0, cost: all(X) },
  'k': { name: 'Shelf', le: 0, cost: all(X) },
  'x': { name: 'Table', le: 0, cost: all(X) },
  'o': { name: 'Rock', le: 0, cost: { walk: X, mounted: X, fly: 1, float: 1, mech: X, beast: X } },
  'W': { name: 'Grave', le: 0, cost: all(X) },
  'a': { name: 'Altar', le: 0, cost: all(X) },
  'G': { name: 'Gate', le: 0, cost: all(X) },
  'h': { name: 'Pit', le: 0, cost: { walk: X, mounted: X, fly: 1, float: 1, mech: X, beast: X } },
  '_': { name: 'Void', le: 0, cost: all(X) },
  'g': { name: 'Glass Floor', le: 0, cost: all(1) },
  'w': { name: 'Shallows', le: 0, cost: { walk: 2, mounted: 2, fly: 1, float: 1, mech: 3, beast: 2 } },
};

export function terrain(ch: string): Terrain {
  return TERRAIN[ch] ?? TERRAIN['.'];
}

export function moveCost(ch: string, mt: MoveType): number {
  return terrain(ch).cost[mt];
}

export function landEffect(ch: string, mt: MoveType): number {
  if (mt === 'fly' || mt === 'float') return 0;
  return terrain(ch).le;
}
