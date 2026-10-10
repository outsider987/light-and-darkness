import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/game/data/content/index';
import { LOCATIONS } from '../src/game/data/locations';
import { BATTLES } from '../src/game/data/battles';
import { ENEMIES } from '../src/game/data/enemies';
import { ITEMS } from '../src/game/data/items';
import { CHARACTERS } from '../src/game/data/characters';
import { SPELLS } from '../src/game/data/spells';
import { CLASSES } from '../src/game/data/classes';
import { TERRAIN, moveCost } from '../src/game/terrain';
import { newGame } from '../src/game/state';
import type { Script, ScriptStep, Dest } from '../src/game/types';

const at = (rows: string[], x: number, y: number) => rows[y]?.[x] ?? '#';

function walkScript(s: Script, visit: (st: ScriptStep) => void): void {
  for (const st of s) {
    visit(st);
    if (typeof st === 'string') continue;
    if ('ask' in st) { walkScript(st.yes, visit); walkScript(st.no, visit); }
    if ('if' in st) { walkScript(st.then, visit); if (st.else) walkScript(st.else, visit); }
  }
}

function checkScript(where: string, s: Script): void {
  walkScript(s, (st) => {
    if (typeof st === 'string') { assert.ok(st.length > 0, `${where}: empty line`); return; }
    if ('join' in st) assert.ok(CHARACTERS[st.join], `${where}: unknown character ${st.join}`);
    if ('item' in st) assert.ok(ITEMS[st.item], `${where}: unknown item ${st.item}`);
    if ('takeItem' in st) assert.ok(ITEMS[st.takeItem], `${where}: unknown item ${st.takeItem}`);
    if ('battle' in st) assert.ok(BATTLES[st.battle], `${where}: unknown battle ${st.battle}`);
    if ('warp' in st) assert.ok(LOCATIONS[st.warp.location], `${where}: unknown location ${st.warp.location}`);
    if ('shop' in st) for (const id of [...st.shop, ...(st.deals ?? [])]) assert.ok(ITEMS[id], `${where}: unknown shop item ${id}`);
  });
}

function checkDest(where: string, d: Dest): void {
  if ('battle' in d) assert.ok(BATTLES[d.battle], `${where}: unknown battle ${d.battle}`);
  else {
    const loc = LOCATIONS[d.location];
    assert.ok(loc, `${where}: unknown location ${d.location}`);
    const ch = at(loc.rows, d.x, d.y);
    assert.ok(isFinite(moveCost(ch, 'walk')), `${where}: destination ${d.location} (${d.x},${d.y}) is not walkable ('${ch}')`);
  }
}

/** Evaluate an exit's destination under a few flag combinations. */
function flagVariants(): Record<string, boolean>[] {
  const all: Record<string, boolean> = {};
  for (const b of Object.keys(BATTLES)) all['won:' + b] = true;
  for (const f of ['king_talked', 'alterone_freed', 'orb_returned', 'otrant_quest', 'zylo_cured', 'quarry_quest', 'prompt_arrived']) all[f] = true;
  return [{}, all];
}

test('terrain table covers every map character', () => {
  const chars = new Set<string>();
  for (const l of Object.values(LOCATIONS)) for (const r of l.rows) for (const c of r) chars.add(c);
  for (const b of Object.values(BATTLES)) for (const r of b.rows) for (const c of r) chars.add(c);
  for (const c of chars) assert.ok(TERRAIN[c], `unknown map character '${c}'`);
});

test('all 8 chapters have content', () => {
  const chapters = new Set(Object.values(BATTLES).map((b) => b.chapter));
  for (let i = 1; i <= 8; i++) assert.ok(chapters.has(i), `no battles for chapter ${i}`);
  assert.ok(Object.keys(BATTLES).length >= 23, 'expected at least 23 battles');
  assert.ok(Object.keys(LOCATIONS).length >= 15, 'expected at least 15 locations');
});

test('locations are well-formed', () => {
  const errs: string[] = [];
  const assert = { ok: (c: unknown, m: string) => { if (!c) errs.push(m); }, equal: (a: unknown, b: unknown, m: string) => { if (a !== b) errs.push(m); } };
  for (const loc of Object.values(LOCATIONS)) {
    const w = Math.max(...loc.rows.map((r) => r.length));
    for (const r of loc.rows) assert.equal(r.length, w, `${loc.id}: ragged row '${r}'`);
    for (const n of loc.npcs) {
      const ch = at(loc.rows, n.x, n.y);
      assert.ok(isFinite(moveCost(ch, 'walk')), `${loc.id}: npc ${n.id} at (${n.x},${n.y}) on '${ch}'`);
      checkScript(`${loc.id}/${n.id}`, n.script);
      if (n.member) assert.ok(CHARACTERS[n.member], `${loc.id}: npc ${n.id} member ${n.member}`);
    }
    const ids = loc.npcs.map((n) => n.id);
    assert.equal(new Set(ids).size, ids.length, `${loc.id}: duplicate npc ids`);
    for (const c of loc.chests ?? []) {
      assert.ok(c.x >= 0 && c.y >= 0 && c.y < loc.rows.length && c.x < w, `${loc.id}: chest out of bounds`);
      if (c.item) assert.ok(ITEMS[c.item], `${loc.id}: chest item ${c.item}`);
    }
    for (const s of loc.searches ?? []) {
      if (s.item) assert.ok(ITEMS[s.item], `${loc.id}: search item ${s.item}`);
      if (s.join) assert.ok(CHARACTERS[s.join], `${loc.id}: search join ${s.join}`);
    }
    for (const e of loc.exits) {
      assert.ok(e.x >= 0 && e.y >= 0 && e.y < loc.rows.length && e.x < w, `${loc.id}: exit out of bounds`);
      for (const flags of flagVariants()) {
        const g = newGame();
        g.flags = { ...flags };
        checkDest(`${loc.id}/exit(${e.x},${e.y})`, e.dest(g));
      }
    }
    if (loc.onEnter) {
      for (const flags of flagVariants()) {
        const g = newGame();
        g.flags = { ...flags };
        const s = typeof loc.onEnter === 'function' ? loc.onEnter(g) : loc.onEnter;
        checkScript(`${loc.id}/onEnter`, s);
      }
    }
  }
  if (errs.length) throw new Error('\n' + errs.join('\n'));
});

test('battles are well-formed', () => {
  const errs: string[] = [];
  const assert = { ok: (c: unknown, m: string) => { if (!c) errs.push(m); }, equal: (a: unknown, b: unknown, m: string) => { if (a !== b) errs.push(m); } };
  for (const b of Object.values(BATTLES)) {
    const w = Math.max(...b.rows.map((r) => r.length));
    for (const r of b.rows) assert.equal(r.length, w, `${b.id}: ragged row`);
    assert.ok(b.spawns.length >= 12, `${b.id}: need 12 spawn tiles`);
    const used = new Set<string>();
    for (const [x, y] of b.spawns) {
      const ch = at(b.rows, x, y);
      assert.ok(isFinite(moveCost(ch, 'walk')), `${b.id}: spawn (${x},${y}) on '${ch}'`);
      assert.ok(!used.has(`${x},${y}`), `${b.id}: duplicate spawn (${x},${y})`);
      used.add(`${x},${y}`);
    }
    for (const e of b.enemies) {
      const def = ENEMIES[e.type];
      assert.ok(def, `${b.id}: unknown enemy ${e.type}`);
      const ch = at(b.rows, e.x, e.y);
      assert.ok(isFinite(moveCost(ch, def.moveType)), `${b.id}: ${e.type} at (${e.x},${e.y}) on '${ch}'`);
      assert.ok(!used.has(`${e.x},${e.y}`), `${b.id}: ${e.type} overlaps another unit at (${e.x},${e.y})`);
      used.add(`${e.x},${e.y}`);
      for (const sp of def.spells ?? []) assert.ok(SPELLS[sp.spell], `${b.id}: ${e.type} spell ${sp.spell}`);
    }
    if (b.winCondition === 'boss') assert.ok(b.enemies.some((e) => e.boss), `${b.id}: boss win condition without a boss`);
    for (const c of b.chests ?? []) {
      assert.ok(isFinite(moveCost(at(b.rows, c.x, c.y), 'walk')), `${b.id}: chest (${c.x},${c.y}) unreachable`);
      if (c.item) assert.ok(ITEMS[c.item], `${b.id}: chest item ${c.item}`);
    }
    checkDest(`${b.id}/after`, b.after);
    if (b.intro) checkScript(`${b.id}/intro`, b.intro);
    if (b.outro) checkScript(`${b.id}/outro`, b.outro);
  }
  if (errs.length) throw new Error('\n' + errs.join('\n'));
});

test('characters, classes and spells are consistent', () => {
  for (const c of Object.values(CHARACTERS)) {
    assert.ok(CLASSES[c.classId], `${c.id}: class ${c.classId}`);
    for (const it of c.items ?? []) assert.ok(ITEMS[it], `${c.id}: item ${it}`);
  }
  for (const cl of Object.values(CLASSES)) {
    if (cl.promo) assert.ok(CLASSES[cl.promo], `${cl.id}: promo ${cl.promo}`);
    for (const s of cl.spells ?? []) {
      assert.ok(SPELLS[s.spell], `${cl.id}: spell ${s.spell}`);
      assert.ok(SPELLS[s.spell].levels.length >= s.level, `${cl.id}: ${s.spell} level ${s.level}`);
    }
  }
  for (const it of Object.values(ITEMS)) {
    if (it.use?.type === 'spell') assert.ok(SPELLS[it.use.spell], `${it.id}: use spell`);
  }
  // every recruitable character is reachable from some script or search
  const joined = new Set<string>();
  const visit = (s: Script) => walkScript(s, (st) => { if (typeof st !== 'string' && 'join' in st) joined.add(st.join); });
  for (const l of Object.values(LOCATIONS)) {
    for (const n of l.npcs) visit(n.script);
    for (const s of l.searches ?? []) if (s.join) joined.add(s.join);
    if (l.onEnter) for (const flags of flagVariants()) { const g = newGame(); g.flags = { ...flags }; visit(typeof l.onEnter === 'function' ? l.onEnter(g) : l.onEnter); }
  }
  for (const b of Object.values(BATTLES)) { if (b.intro) visit(b.intro); if (b.outro) visit(b.outro); }
  const starting = new Set(['max', 'lowe', 'ken', 'tao', 'hans', 'luke']);
  for (const id of Object.keys(CHARACTERS)) if (!starting.has(id)) assert.ok(joined.has(id), `${id} can never join`);
});
