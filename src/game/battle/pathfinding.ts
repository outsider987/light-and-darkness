import type { Area, MoveType, Unit } from '../types';
import { moveCost } from '../terrain';

export interface Grid {
  w: number;
  h: number;
  at(x: number, y: number): string;
}

export const key = (x: number, y: number): string => `${x},${y}`;
export const dist = (ax: number, ay: number, bx: number, by: number): number => Math.abs(ax - bx) + Math.abs(ay - by);

export interface Reach { x: number; y: number; cost: number; px: number; py: number }

/**
 * Dijkstra over terrain costs. Units may pass through allies but not enemies,
 * and may not stop on an occupied tile (the origin is always included).
 */
export function reachable(grid: Grid, unit: Unit, mt: MoveType, mov: number, units: Unit[]): Map<string, Reach> {
  const out = new Map<string, Reach>();
  const occ = new Map<string, Unit>();
  for (const u of units) if (u.alive && u !== unit) occ.set(key(u.x, u.y), u);
  const start: Reach = { x: unit.x, y: unit.y, cost: 0, px: -1, py: -1 };
  const open: Reach[] = [start];
  out.set(key(unit.x, unit.y), start);
  while (open.length) {
    open.sort((a, b) => a.cost - b.cost);
    const cur = open.shift()!;
    const here = out.get(key(cur.x, cur.y))!;
    if (here.cost < cur.cost) continue;
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= grid.w || ny >= grid.h) continue;
      const o = occ.get(key(nx, ny));
      if (o && o.team !== unit.team) continue;
      const c = moveCost(grid.at(nx, ny), mt);
      if (!isFinite(c)) continue;
      const nc = cur.cost + c;
      if (nc > mov) continue;
      const k = key(nx, ny);
      const prev = out.get(k);
      if (prev && prev.cost <= nc) continue;
      const r: Reach = { x: nx, y: ny, cost: nc, px: cur.x, py: cur.y };
      out.set(k, r);
      open.push(r);
    }
  }
  // remove tiles occupied by allies (can pass through, cannot stop)
  for (const [k, r] of out) {
    if (k === key(unit.x, unit.y)) continue;
    if (occ.has(k)) out.delete(k);
  }
  return out;
}

/** Path from origin to (x,y), using the parent links from `reachable`. */
export function pathTo(reach: Map<string, Reach>, x: number, y: number): [number, number][] {
  const path: [number, number][] = [];
  let cur = reach.get(key(x, y));
  while (cur && cur.px >= 0) {
    path.push([cur.x, cur.y]);
    cur = reach.get(key(cur.px, cur.py));
  }
  return path.reverse();
}

export function tilesInRange(x: number, y: number, minR: number, maxR: number, w: number, h: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dy = -maxR; dy <= maxR; dy++) {
    for (let dx = -maxR; dx <= maxR; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d < minR || d > maxR) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      out.push([nx, ny]);
    }
  }
  return out;
}

export function areaTiles(cx: number, cy: number, area: Area, w: number, h: number): [number, number][] {
  switch (area) {
    case 'single':
    case 'self':
      return [[cx, cy]];
    case 'cross':
      return tilesInRange(cx, cy, 0, 1, w, h);
    case 'diamond':
      return tilesInRange(cx, cy, 0, 2, w, h);
    case 'allies':
    case 'all':
      return [];
  }
}

/** Nearest unit of a team by manhattan distance. */
export function nearest(from: { x: number; y: number }, units: Unit[], team: Unit['team']): Unit | null {
  let best: Unit | null = null;
  let bd = Infinity;
  for (const u of units) {
    if (!u.alive || u.team !== team) continue;
    const d = dist(from.x, from.y, u.x, u.y);
    if (d < bd) {
      bd = d;
      best = u;
    }
  }
  return best;
}
