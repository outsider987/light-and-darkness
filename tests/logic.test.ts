import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, joinForce, makeEnemy, addExp, effAtt, promote, canPromote, learnSpells, expGain, addItem, removeItem, weaponOf } from '../src/game/state';
import { reachable, pathTo, areaTiles, tilesInRange } from '../src/game/battle/pathfinding';
import { resolveAttack } from '../src/game/battle/combat';
import { rng } from '../src/engine/rng';
import type { Unit } from '../src/game/types';

test('new game has the six starting members with weapons equipped', () => {
  const g = newGame();
  assert.equal(g.force.length, 6);
  assert.equal(g.party.length, 6);
  const max = g.force[0];
  assert.equal(max.isHero, true);
  assert.equal(weaponOf(max)?.id, 'short_sword');
  assert.equal(effAtt(max), 6 + 5);
  assert.deepEqual(g.force.find((u) => u.id === 'tao')!.spells, [{ spell: 'blaze', level: 1 }]);
});

test('leveling raises stats and learns spells; promotion resets level', () => {
  rng.seed(42);
  const g = newGame();
  const lowe = g.force.find((u) => u.id === 'lowe')!;
  const hpBefore = lowe.maxHp;
  for (let i = 0; i < 9; i++) addExp(lowe, 100);
  assert.equal(lowe.level, 10);
  assert.ok(lowe.maxHp > hpBefore);
  assert.ok(lowe.spells.some((s) => s.spell === 'heal' && s.level === 2), 'learned Heal 2');
  assert.ok(lowe.spells.some((s) => s.spell === 'detox'), 'learned Detox');
  assert.equal(canPromote(lowe), true);
  promote(lowe);
  assert.equal(lowe.classId, 'VICR');
  assert.equal(lowe.level, 1);
  assert.equal(lowe.promoted, true);
  // promoted spells keep accumulating through the character table
  for (let i = 0; i < 5; i++) addExp(lowe, 100);
  learnSpells(lowe);
  assert.ok(lowe.spells.some((s) => s.spell === 'heal' && s.level >= 3), 'learned Heal 3 after promotion');
});

test('exp gain scales with level difference and is capped', () => {
  const g = newGame();
  const max = g.force[0];
  const weak = makeEnemy(g, 'goblin', 0, 0);
  const strong = makeEnemy(g, 'dragon', 0, 0);
  assert.ok(expGain(max, weak, true) < expGain(max, strong, true));
  assert.equal(expGain(max, strong, true), 49);
  assert.ok(expGain(max, weak, false) >= 1);
});

test('inventory keeps equipment indices consistent', () => {
  const g = newGame();
  const max = g.force[0];
  assert.equal(max.items.length, 2);
  assert.equal(addItem(max, 'medical_herb'), true);
  assert.equal(addItem(max, 'medical_herb'), true);
  assert.equal(addItem(max, 'medical_herb'), false, 'four slots max');
  // remove the herb before the sword: equipped index shifts
  max.items = ['medical_herb', 'short_sword', 'antidote'];
  max.equipWeapon = 1;
  removeItem(max, 0);
  assert.equal(max.equipWeapon, 0);
  assert.equal(weaponOf(max)?.id, 'short_sword');
  removeItem(max, 0);
  assert.equal(max.equipWeapon, -1);
});

test('reachable respects terrain cost and enemies block', () => {
  const rows = ['.....', '.TT..', '.T~..', '.....', '.....'];
  const grid = { w: 5, h: 5, at: (x: number, y: number) => rows[y][x] };
  const g = newGame();
  const max = g.force[0];
  max.x = 0; max.y = 0;
  const foe = makeEnemy(g, 'goblin', 1, 0);
  const r = reachable(grid, max, 'walk', 3, [max, foe]);
  assert.ok(!r.has('1,0'), 'enemy tile not reachable');
  assert.ok(!r.has('2,2'), 'water impassable');
  assert.ok(r.has('0,3'), 'straight down 3 tiles');
  assert.ok(!r.has('2,1'), 'forest costs 2: (0,0)->(0,1)->(1,1)=3 -> (2,1) would be 5');
  const path = pathTo(r, 0, 3);
  assert.deepEqual(path, [[0, 1], [0, 2], [0, 3]]);
  const fly = reachable(grid, max, 'fly', 4, [max, foe]);
  assert.ok(fly.has('2,2'), 'flyers cross water');
});

test('area shapes', () => {
  assert.equal(areaTiles(5, 5, 'single', 10, 10).length, 1);
  assert.equal(areaTiles(5, 5, 'cross', 10, 10).length, 5);
  assert.equal(areaTiles(5, 5, 'diamond', 10, 10).length, 13);
  assert.equal(tilesInRange(0, 0, 2, 2, 10, 10).length, 3);
});

test('attacks deal damage, respect land effect, and never go below zero HP', () => {
  rng.seed(7);
  const g = newGame();
  const max = g.force[0];
  max.x = 0; max.y = 0;
  max.att = 50;
  const foe = makeEnemy(g, 'goblin', 1, 0);
  const hits = resolveAttack(max, foe, () => ',', () => 'walk');
  assert.ok(hits.length >= 1);
  assert.equal(foe.hp, 0);
  assert.equal(foe.alive, false);
  assert.ok(hits.some((h) => h.killed));
  // land effect reduces damage on forest (same seed => same rolls, only the terrain differs)
  let road = 0, forest = 0;
  for (let seed = 1; seed < 50 && road === 0; seed++) {
    rng.seed(seed);
    const foe2 = makeEnemy(g, 'goblin', 1, 0);
    foe2.hp = foe2.maxHp = 1000;
    const h = resolveAttack(max, foe2, () => ',', () => 'walk')[0];
    if (h.miss) continue;
    road = h.dmg;
    rng.seed(seed);
    const foe3 = makeEnemy(g, 'goblin', 1, 0);
    foe3.hp = foe3.maxHp = 1000;
    forest = resolveAttack(max, foe3, () => 'T', () => 'walk')[0].dmg;
  }
  assert.ok(road > 0 && forest < road, `forest ${forest} should be less than road ${road}`);
});

test('every unit field survives JSON round trip (save compatibility)', () => {
  const g = newGame();
  joinForce(g, 'gort');
  const copy = JSON.parse(JSON.stringify(g));
  assert.equal(copy.force.length, 7);
  const u: Unit = copy.force[6];
  assert.equal(u.id, 'gort');
  assert.equal(typeof u.buffs.turns, 'number');
});
