import { ctx, W, H, TILE } from '../../engine/canvas';
import { input } from '../../engine/input';
import { audio } from '../../engine/audio';
import { Runner, type Co } from '../../engine/co';
import { fadeIn, fadeOut, flash, fade, type Scene } from '../../engine/scene';
import { C, CH, text, win, drawCursor, blit, blitScaled, textCenter, rect } from '../../engine/gfx';
import { rng } from '../../engine/rng';
import { tile, chestSprite } from '../tiles';
import { unitSprite, shade } from '../sprites';
import { terrain, landEffect } from '../terrain';
import type { BattleDef, GameState, Unit, SpellDef, SpellLevel, Dir, Area } from '../types';
import {
  effAgi, effAtt, effDef, effMov, attackRange, moveTypeOf, addExp, expGain, supportExp, heal, fullHeal,
  partyUnits, makeEnemy, hero, unitClass, weaponOf, ringOf, canEquip, removeItem, addItem, spellName, hasCursed,
} from '../state';
import { reachable, pathTo, tilesInRange, areaTiles, dist, key, type Reach } from './pathfinding';
import { resolveAttack, magicDamage, applyDamage, statusSucceeds, type Hit } from './combat';
import { dialog, sayKeep, closeDialog, choose, RadialMenu, drawUnitPanel, drawInfoBox, drawWidgets, clearWidgets, ask, drawFullStatus } from '../ui';
import { SPELLS } from '../data/spells';
import { item as itemDef } from '../data/items';
import { runScript } from '../script';
import { director } from '../director';
import { image, unitImage } from '../../engine/assets';

interface Cutscene {
  left: Unit;
  right: Unit;
  hpL: number;
  hpR: number;
  lungeL: number;
  lungeR: number;
  shakeL: number;
  shakeR: number;
  popup: { side: 'L' | 'R'; txt: string; t: number; color: string } | null;
  terrainL: string;
  terrainR: string;
  t: number;
  /** element effect playing over one side */
  effect: { kind: string; side: 'L' | 'R'; t: number; seed: number } | null;
  slash: { side: 'L' | 'R'; t: number } | null;
}

const HL_MOVE = 'rgba(80,140,255,0.45)';
const HL_ATTACK = 'rgba(255,80,60,0.5)';
const HL_HEAL = 'rgba(80,255,120,0.5)';
const HL_AREA = 'rgba(255,220,60,0.5)';

export class BattleScene implements Scene {
  kind = 'battle';
  w: number;
  h: number;
  rows: string[];
  units: Unit[] = [];
  runner = new Runner();
  cam = { x: 0, y: 0 };
  camTarget: { x: number; y: number } | null = null;
  cursor = { x: 0, y: 0 };
  cursorOn = false;
  hl = new Map<string, string>();
  hlAlt = new Map<string, string>();
  drawPos = new Map<number, { x: number; y: number }>();
  popups: { x: number; y: number; txt: string; color: string; t: number }[] = [];
  fx: { tiles: [number, number][]; color: string; t: number } | null = null;
  frame = 0;
  result: 'win' | 'lose' | 'egress' | null = null;
  goldEarned = 0;
  anim: Cutscene | null = null;
  statusUnit: Unit | null = null;
  chests: { x: number; y: number; item?: string; gold?: number; opened: boolean }[];
  round = 0;
  activeUnit: Unit | null = null;
  banner: { txt: string; t: number } | null = null;

  constructor(public g: GameState, public def: BattleDef) {
    this.rows = def.rows;
    this.h = def.rows.length;
    this.w = Math.max(...def.rows.map((r) => r.length));
    this.chests = (def.chests ?? []).map((c) => ({ ...c, opened: !!g.openedChests[`${def.id}:${c.x},${c.y}`] }));
  }

  at(x: number, y: number): string {
    if (x < 0 || y < 0 || y >= this.h) return '#';
    return this.rows[y][x] ?? '#';
  }
  unitAt(x: number, y: number): Unit | undefined {
    return this.units.find((u) => u.alive && u.x === x && u.y === y);
  }
  alive(team: Unit['team']): Unit[] {
    return this.units.filter((u) => u.alive && u.team === team);
  }
  grid() {
    return { w: this.w, h: this.h, at: (x: number, y: number) => this.at(x, y) };
  }

  enter(): void {
    clearWidgets();
    const g = this.g;
    // place force
    const party = partyUnits(g).filter((u) => u.alive);
    const ordered = [hero(g), ...party.filter((u) => !u.isHero)];
    ordered.forEach((u, i) => {
      const sp = this.def.spawns[i] ?? this.def.spawns[this.def.spawns.length - 1];
      u.x = sp[0];
      u.y = sp[1];
      u.dir = 'down';
      u.acted = false;
      u.buffs = { att: 0, def: 0, agi: 0, mov: 0, turns: 0 };
      u.sleep = 0;
      u.muddle = 0;
      u.team = 'force';
      this.units.push(u);
    });
    // enemies
    for (const e of this.def.enemies) {
      const u = makeEnemy(g, e.type, e.x, e.y, e.level);
      if (e.ai) u.ai = e.ai;
      if (e.boss) u.boss = true;
      if (e.aggro !== undefined) u.aggroRange = e.aggro;
      if (e.guard) u.guard = { x: e.x, y: e.y };
      this.units.push(u);
    }
    for (const u of this.units) unitImage(u.team === 'force' ? u.id : u.defId ?? u.id);
    const hx = hero(g).x, hy = hero(g).y;
    this.cursor = { x: hx, y: hy };
    this.cam = { x: hx * TILE - W / 2 + TILE / 2, y: hy * TILE - H / 2 + TILE / 2 };
    this.clampCam();
    audio.play(this.def.music ?? 'battle');
    fade.alpha = 1;
    this.runner.start(this.main());
  }

  exit(): void {
    clearWidgets();
  }

  // ---- main flow ---------------------------------------------------------------

  *main(): Co<void> {
    yield* fadeIn(20);
    if (this.def.intro) yield* runScript(this.g, this.def.intro, {});
    while (!this.result) {
      this.round++;
      const order = this.units
        .filter((u) => u.alive)
        .map((u) => ({ u, k: effAgi(u) * (0.8 + rng.next() * 0.4) + rng.next() }))
        .sort((a, b) => b.k - a.k)
        .map((o) => o.u);
      for (const u of order) {
        if (this.result) break;
        if (!u.alive) continue;
        yield* this.turn(u);
        this.checkEnd();
      }
    }
    if (this.result === 'win') yield* this.victory();
    else if (this.result === 'lose') yield* this.defeat();
    else yield* this.egressOut();
  }

  checkEnd(): void {
    if (this.result) return;
    const h = hero(this.g);
    if (!h.alive) {
      this.result = 'lose';
      return;
    }
    const enemies = this.alive('enemy');
    if (this.def.winCondition === 'boss') {
      if (!enemies.some((u) => u.boss)) this.result = 'win';
    } else if (enemies.length === 0) this.result = 'win';
  }

  *turn(u: Unit): Co<void> {
    this.activeUnit = u;
    if (u.buffs.turns > 0) {
      u.buffs.turns--;
      if (u.buffs.turns === 0) u.buffs = { att: 0, def: 0, agi: 0, mov: 0, turns: 0 };
    }
    if (u.poison) {
      yield* this.focus(u.x, u.y);
      const dmg = Math.max(1, Math.floor(u.maxHp / 10));
      u.hp = Math.max(1, u.hp - dmg);
      this.popup(u.x, u.y, `-${dmg}`, C.green);
      yield 20;
    }
    if (u.sleep > 0) {
      u.sleep--;
      yield* this.focus(u.x, u.y);
      this.popup(u.x, u.y, 'Zzz', C.cyan);
      yield 24;
      this.activeUnit = null;
      return;
    }
    if (u.muddle > 0) {
      u.muddle--;
      yield* this.muddledTurn(u);
      this.activeUnit = null;
      return;
    }
    if (u.team === 'force') yield* this.playerTurn(u);
    else yield* this.enemyTurn(u);
    this.activeUnit = null;
  }

  // ---- camera / cursor ---------------------------------------------------------

  clampCam(): void {
    const maxX = Math.max(0, this.w * TILE - W);
    const maxY = Math.max(0, this.h * TILE - H);
    this.cam.x = Math.max(0, Math.min(maxX, this.cam.x));
    this.cam.y = Math.max(0, Math.min(maxY, this.cam.y));
  }

  *focus(x: number, y: number, frames = 12): Co<void> {
    this.camTarget = { x, y };
    this.cursor = { x, y };
    for (let i = 0; i < frames; i++) yield 1;
  }

  updateCam(): void {
    const t = this.camTarget ?? this.cursor;
    const tx = t.x * TILE - W / 2 + TILE / 2;
    const ty = t.y * TILE - H / 2 + TILE / 2;
    const maxX = Math.max(0, this.w * TILE - W);
    const maxY = Math.max(0, this.h * TILE - H);
    const cx = Math.max(0, Math.min(maxX, tx));
    const cy = Math.max(0, Math.min(maxY, ty));
    const dx = cx - this.cam.x, dy = cy - this.cam.y;
    this.cam.x += Math.abs(dx) < 1 ? dx : dx * 0.25;
    this.cam.y += Math.abs(dy) < 1 ? dy : dy * 0.25;
  }

  popup(x: number, y: number, txt: string, color = C.white): void {
    this.popups.push({ x, y, txt, color, t: 40 });
  }

  /** Free cursor movement; resolves when A pressed on an acceptable tile, or null on cancel. */
  *moveCursor(accept: (x: number, y: number) => boolean, opts: { onB?: () => boolean } = {}): Co<[number, number] | null> {
    this.cursorOn = true;
    this.camTarget = null;
    yield 1;
    for (;;) {
      const d = input.dir();
      if (d) {
        const nx = this.cursor.x + (d === 'right' ? 1 : d === 'left' ? -1 : 0);
        const ny = this.cursor.y + (d === 'down' ? 1 : d === 'up' ? -1 : 0);
        if (nx >= 0 && ny >= 0 && nx < this.w && ny < this.h) {
          this.cursor = { x: nx, y: ny };
          audio.sfx('cursor');
        }
      }
      if (input.ok()) {
        if (accept(this.cursor.x, this.cursor.y)) {
          audio.sfx('ok');
          return [this.cursor.x, this.cursor.y];
        }
        const u = this.unitAt(this.cursor.x, this.cursor.y);
        if (u) {
          yield* this.showStatus(u);
        } else audio.sfx('error');
      }
      if (input.cancel()) {
        audio.sfx('cancel');
        return null;
      }
      if (input.pressed('c')) {
        const u = this.unitAt(this.cursor.x, this.cursor.y);
        if (u) yield* this.showStatus(u);
      }
      yield 1;
    }
  }

  *showStatus(u: Unit): Co<void> {
    this.statusUnit = u;
    yield 1;
    while (!(input.ok() || input.cancel() || input.pressed('c'))) yield 1;
    audio.sfx('cancel');
    this.statusUnit = null;
    yield 1;
  }

  /** Cycle through candidate tiles; returns chosen tile or null. */
  *pickTarget(cands: [number, number][], color: string, areaFn?: (x: number, y: number) => [number, number][]): Co<[number, number] | null> {
    if (cands.length === 0) return null;
    // start at the candidate nearest the cursor
    let i = 0;
    let best = Infinity;
    cands.forEach(([x, y], idx) => {
      const d = dist(x, y, this.cursor.x, this.cursor.y);
      if (d < best) { best = d; i = idx; }
    });
    this.cursorOn = true;
    this.camTarget = null;
    const refresh = () => {
      this.hlAlt.clear();
      for (const [x, y] of cands) this.hlAlt.set(key(x, y), color);
      const [cx, cy] = cands[i];
      this.cursor = { x: cx, y: cy };
      if (areaFn) for (const [x, y] of areaFn(cx, cy)) this.hlAlt.set(key(x, y), HL_AREA);
    };
    refresh();
    yield 1;
    for (;;) {
      const d = input.dir();
      if (d === 'right' || d === 'down') { i = (i + 1) % cands.length; audio.sfx('cursor'); refresh(); }
      else if (d === 'left' || d === 'up') { i = (i - 1 + cands.length) % cands.length; audio.sfx('cursor'); refresh(); }
      if (input.ok()) {
        audio.sfx('ok');
        this.hlAlt.clear();
        return cands[i];
      }
      if (input.cancel()) {
        audio.sfx('cancel');
        this.hlAlt.clear();
        return null;
      }
      if (input.pressed('c')) {
        const u = this.unitAt(this.cursor.x, this.cursor.y);
        if (u) yield* this.showStatus(u);
      }
      yield 1;
    }
  }

  // ---- movement ----------------------------------------------------------------

  *walk(u: Unit, path: [number, number][]): Co<void> {
    this.cursorOn = false;
    for (const [nx, ny] of path) {
      const dx = nx - u.x, dy = ny - u.y;
      u.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      const sx = u.x * TILE, sy = u.y * TILE;
      for (let i = 1; i <= 6; i++) {
        this.drawPos.set(u.uid, { x: sx + (dx * TILE * i) / 6, y: sy + (dy * TILE * i) / 6 });
        this.camTarget = { x: nx, y: ny };
        if (i === 3) audio.sfx('step');
        yield 1;
      }
      u.x = nx;
      u.y = ny;
      this.drawPos.delete(u.uid);
    }
    this.cursor = { x: u.x, y: u.y };
    yield* this.openChestUnder(u);
  }

  *openChestUnder(u: Unit): Co<void> {
    const c = this.chests.find((c) => !c.opened && c.x === u.x && c.y === u.y);
    if (!c) return;
    if (c.item) {
      if (u.team !== 'force') return;
      const it = itemDef(c.item);
      if (addItem(u, c.item)) {
        c.opened = true;
        this.g.openedChests[`${this.def.id}:${c.x},${c.y}`] = true;
        audio.sfx('gold');
        yield* sayKeep(`${u.name} found the ${it.name}!`);
      } else {
        yield* sayKeep(`${u.name} found the ${it.name}, but can't carry any more.`);
      }
      closeDialog();
    } else if (c.gold) {
      c.opened = true;
      this.g.openedChests[`${this.def.id}:${c.x},${c.y}`] = true;
      this.g.gold += c.gold;
      audio.sfx('gold');
      yield* sayKeep(`${u.name} found ${c.gold} gold!`);
      closeDialog();
    }
  }

  // ---- player turn -------------------------------------------------------------

  *playerTurn(u: Unit): Co<void> {
    const startX = u.x, startY = u.y, startDir = u.dir;
    yield* this.focus(u.x, u.y, 8);
    for (;;) {
      // movement phase
      const reach = reachable(this.grid(), u, moveTypeOf(u), effMov(u), this.units);
      this.hl.clear();
      for (const r of reach.values()) this.hl.set(key(r.x, r.y), HL_MOVE);
      this.cursor = { x: u.x, y: u.y };
      const dest = yield* this.moveCursor((x, y) => reach.has(key(x, y)), {});
      this.hl.clear();
      if (!dest) {
        // B during move: open the unit status
        yield* this.showStatus(u);
        continue;
      }
      const path = pathTo(reach, dest[0], dest[1]);
      yield* this.walk(u, path);
      // action phase
      const undo = yield* this.actionPhase(u);
      if (undo) {
        u.x = startX;
        u.y = startY;
        u.dir = startDir;
        this.cursor = { x: u.x, y: u.y };
        continue;
      }
      break;
    }
    u.acted = true;
    this.cursorOn = false;
    this.hl.clear();
  }

  attackTargets(u: Unit): [number, number][] {
    const [mn, mx] = attackRange(u);
    const foes = this.alive(u.team === 'force' ? 'enemy' : 'force');
    return foes.filter((f) => { const d = dist(u.x, u.y, f.x, f.y); return d >= mn && d <= mx; }).map((f) => [f.x, f.y]);
  }

  /** Returns true if the player cancelled back to the move phase. */
  *actionPhase(u: Unit): Co<boolean> {
    for (;;) {
      const targets = this.attackTargets(u);
      const usableSpells = u.spells.filter((s) => this.spellUsable(u, s.spell));
      const sx = u.x * TILE - this.cam.x + TILE / 2;
      const sy = u.y * TILE - this.cam.y + TILE / 2;
      const cx = Math.max(50, Math.min(W - 50, sx));
      const cy = Math.max(50, Math.min(H - 120, sy));
      const menu = new RadialMenu([
        { icon: 'attack', label: 'Attack', disabled: targets.length === 0 },
        { icon: 'magic', label: 'Magic', disabled: usableSpells.length === 0 },
        { icon: 'item', label: 'Item', disabled: u.items.length === 0 },
        { icon: 'stay', label: 'Stay' },
      ], cx, cy);
      menu.index = targets.length ? 0 : 2;
      const r = yield* menu.run();
      if (r === -1) return true;
      if (r === 0) {
        this.hl.clear();
        const t = yield* this.pickTarget(targets, HL_ATTACK);
        if (!t) continue;
        const target = this.unitAt(t[0], t[1])!;
        this.faceToward(u, target);
        yield* this.doAttack(u, target);
        return false;
      }
      if (r === 1) {
        const cast = yield* this.magicMenu(u);
        if (cast) return false;
        continue;
      }
      if (r === 2) {
        const used = yield* this.itemMenu(u);
        if (used) return false;
        continue;
      }
      return false;
    }
  }

  faceToward(u: Unit, t: { x: number; y: number }): void {
    const dx = t.x - u.x, dy = t.y - u.y;
    if (Math.abs(dx) >= Math.abs(dy)) u.dir = dx >= 0 ? 'right' : 'left';
    else u.dir = dy >= 0 ? 'down' : 'up';
  }

  spellUsable(u: Unit, id: string): boolean {
    const sp = SPELLS[id];
    if (!sp) return false;
    const known = u.spells.find((s) => s.spell === id);
    if (!known) return false;
    const lv = sp.levels[0];
    if (u.mp < lv.mp) return false;
    if (sp.id === 'egress') return u.team === 'force';
    return this.spellTargets(u, sp, lv).length > 0;
  }

  /** Candidate center tiles for a spell: tiles with a valid target unit in range. */
  spellTargets(u: Unit, sp: SpellDef, lv: SpellLevel): [number, number][] {
    if (lv.area === 'self' || lv.area === 'allies' || lv.area === 'all' || lv.range === 0) return [[u.x, u.y]];
    const team = sp.target === 'ally' ? u.team : u.team === 'force' ? 'enemy' : 'force';
    const out: [number, number][] = [];
    for (const t of this.alive(team)) {
      const d = dist(u.x, u.y, t.x, t.y);
      if (d <= lv.range) {
        if (sp.kind === 'heal' && t.hp >= t.maxHp) continue;
        if (sp.status === 'poison' && !t.poison) continue;
        out.push([t.x, t.y]);
      }
    }
    return out;
  }

  *magicMenu(u: Unit): Co<boolean> {
    for (;;) {
      const items = u.spells.map((s) => {
        const sp = SPELLS[s.spell];
        return { label: sp.name, right: `MP${String(sp.levels[0].mp).padStart(2)}`, disabled: !this.spellUsable(u, s.spell), desc: sp.desc };
      });
      const r = yield* choose(items, { x: 8, y: 8, title: `${u.name}  MP ${u.mp}`, showDesc: true });
      if (r === -1) return false;
      const known = u.spells[r];
      const sp = SPELLS[known.spell];
      let level = 1;
      if (known.level > 1) {
        const lv = sp.levels.slice(0, known.level).map((l, i) => ({
          label: `${sp.name} ${i + 1}`, right: `MP${String(l.mp).padStart(2)}`,
          disabled: u.mp < l.mp || this.spellTargets(u, sp, l).length === 0,
        }));
        const lr = yield* choose(lv, { x: 8, y: 8, title: sp.name });
        if (lr === -1) continue;
        level = lr + 1;
      }
      const L = sp.levels[level - 1];
      if (sp.id === 'egress') {
        const ok = yield* ask('Retreat from this battle?');
        if (!ok) continue;
        u.mp -= L.mp;
        yield* sayKeep(`${u.name} cast Egress!`);
        audio.sfx('egress');
        yield* flash(6, '#fff');
        this.result = 'egress';
        closeDialog();
        return true;
      }
      const cands = this.spellTargets(u, sp, L);
      const areaFn = (x: number, y: number) => this.areaFor(u, L, x, y);
      let center: [number, number] | null;
      if (L.range === 0 || L.area === 'self' || L.area === 'allies' || L.area === 'all') center = [u.x, u.y];
      else center = yield* this.pickTarget(cands, sp.target === 'ally' ? HL_HEAL : HL_ATTACK, areaFn);
      if (!center) continue;
      yield* this.castSpell(u, sp, level, center[0], center[1]);
      return true;
    }
  }

  areaFor(caster: Unit, L: SpellLevel, x: number, y: number): [number, number][] {
    if (L.area === 'allies') return this.alive(caster.team).map((t) => [t.x, t.y] as [number, number]);
    if (L.area === 'all') return this.alive(caster.team === 'force' ? 'enemy' : 'force').map((t) => [t.x, t.y] as [number, number]);
    return areaTiles(x, y, L.area as Area, this.w, this.h);
  }

  *castSpell(caster: Unit, sp: SpellDef, level: number, cx: number, cy: number): Co<void> {
    const L = sp.levels[level - 1];
    caster.mp = Math.max(0, caster.mp - L.mp);
    if (!this.anim) this.faceToward(caster, { x: cx, y: cy });
    this.camTarget = { x: cx, y: cy };
    const tiles = this.areaFor(caster, L, cx, cy);
    const team = sp.target === 'ally' ? caster.team : caster.team === 'force' ? 'enemy' : 'force';
    const targets = tiles.map(([x, y]) => this.unitAt(x, y)).filter((t): t is Unit => !!t && t.team === team);
    // battle-screen presentation: caster vs. first target with an element effect
    const primary = targets[0] ?? caster;
    const left = caster.team === 'force' ? caster : primary.team === 'force' ? primary : caster;
    const right = left === caster ? primary : caster;
    const cs: Cutscene = {
      left, right, hpL: left.hp, hpR: right.hp, lungeL: 0, lungeR: 0, shakeL: 0, shakeR: 0, popup: null,
      terrainL: this.at(left.x, left.y), terrainR: this.at(right.x, right.y), t: 0, effect: null, slash: null,
    };
    const targetSide: 'L' | 'R' = primary === left ? 'L' : 'R';
    yield* fadeOut(8, '#000');
    this.anim = cs;
    yield* fadeIn(8);
    yield 8;
    yield* sayKeep(`${caster.name} cast ${sp.name} ${level}!`);
    audio.sfx(sp.sfx);
    const kind = sp.kind === 'damage' ? (sp.element ?? 'fire') : sp.kind === 'heal' ? 'heal' : sp.kind === 'buff' ? 'buff' : sp.kind === 'debuff' ? 'debuff' : sp.status === 'desoul' ? 'dark' : 'status';
    cs.effect = { kind, side: targetSide, t: 0, seed: rng.int(1, 9999) };
    if (sp.kind === 'damage') yield* flash(3, sp.color);
    for (let i = 0; i < 44; i++) {
      cs.effect.t = i;
      if (i === 24 && sp.kind === 'damage') { if (targetSide === 'R') cs.shakeR = 10; else cs.shakeL = 10; }
      yield 1;
    }
    cs.effect = null;
    this.fx = { tiles, color: sp.color, t: 30 };
    let exp = 0;
    const killed: Unit[] = [];
    for (const t of targets) {
      const isPrimary = t === primary;
      const side: 'L' | 'R' = t === left ? 'L' : 'R';
      if (sp.kind === 'damage') {
        const dmg = magicDamage(L);
        const died = applyDamage(t, dmg);
        this.popup(t.x, t.y, `-${dmg}`, C.white);
        if (isPrimary) { cs.popup = { side, txt: `${dmg}`, t: 40, color: C.white }; if (side === 'L') cs.hpL = t.hp; else cs.hpR = t.hp; }
        yield* sayKeep(`${t.name} took ${dmg} damage.`);
        if (caster.team === 'force') exp += expGain(caster, t, died);
        if (died) { killed.push(t); if (isPrimary) { audio.sfx('death'); yield 16; yield* sayKeep(`${t.name} was defeated!`); } }
      } else if (sp.kind === 'heal') {
        const amt = heal(t, L.power >= 999 ? t.maxHp : L.power);
        this.popup(t.x, t.y, `+${amt}`, C.green);
        if (isPrimary) { cs.popup = { side, txt: `+${amt}`, t: 40, color: C.green }; if (side === 'L') cs.hpL = t.hp; else cs.hpR = t.hp; }
        yield* sayKeep(`${t.name} recovered ${amt} HP.`);
        if (caster.team === 'force') exp += supportExp(caster, amt);
      } else if (sp.kind === 'buff' && sp.stat) {
        t.buffs[sp.stat] += L.power;
        t.buffs.turns = 4;
        this.popup(t.x, t.y, `${sp.stat.toUpperCase()}+`, C.cyan);
        yield* sayKeep(`${t.name}'s ${sp.stat.toUpperCase()} rose!`);
        if (caster.team === 'force') exp += supportExp(caster, 20);
      } else if (sp.kind === 'debuff' && sp.stat) {
        if (t.immuneStatus) yield* sayKeep(`${t.name} was unaffected.`);
        else {
          t.buffs[sp.stat] -= L.power;
          t.buffs.turns = 4;
          this.popup(t.x, t.y, `${sp.stat.toUpperCase()}-`, C.orange);
          yield* sayKeep(`${t.name}'s ${sp.stat.toUpperCase()} fell!`);
          if (caster.team === 'force') exp += supportExp(caster, 20);
        }
      } else if (sp.kind === 'status') {
        if (sp.status === 'poison') {
          t.poison = false;
          yield* sayKeep(`${t.name} was cured of poison.`);
          if (caster.team === 'force') exp += supportExp(caster, 15);
        } else if (statusSucceeds(sp, L, t)) {
          if (sp.status === 'sleep') { t.sleep = 2 + rng.int(0, 1); yield* sayKeep(`${t.name} fell asleep!`); }
          else if (sp.status === 'muddle') { t.muddle = 2; yield* sayKeep(`${t.name} is confused!`); }
          else if (sp.status === 'desoul') { applyDamage(t, t.hp); killed.push(t); if (isPrimary) { if (side === 'L') cs.hpL = 0; else cs.hpR = 0; } yield* sayKeep(`${t.name}'s soul was torn away!`); if (caster.team === 'force') exp += expGain(caster, t, true); }
          else if (sp.status === 'dispel') { t.mp = 0; yield* sayKeep(`${t.name}'s MP was drained!`); }
          if (caster.team === 'force' && sp.status !== 'desoul') exp += supportExp(caster, 20);
        } else yield* sayKeep(`${t.name} resisted the spell.`);
      }
    }
    if (targets.length === 0) yield* sayKeep('But nothing happened.');
    if (caster.team === 'force' && exp > 0) yield* this.grantExp(caster, Math.min(49, exp));
    yield* fadeOut(8, '#000');
    this.anim = null;
    this.cursorOn = false;
    yield* fadeIn(8);
    this.fx = null;
    for (const k of killed) yield* this.unitDied(k);
    closeDialog();
  }

  *itemMenu(u: Unit): Co<boolean> {
    for (;;) {
      const items = u.items.map((id, i) => {
        const it = itemDef(id);
        const eq = i === u.equipWeapon || i === u.equipRing ? 'E' : '';
        return { label: it.name, right: eq, desc: it.desc, color: it.cursed ? C.orange : C.white };
      });
      const r = yield* choose(items, { x: 8, y: 8, title: `${u.name}'s items`, showDesc: true });
      if (r === -1) return false;
      const id = u.items[r];
      const it = itemDef(id);
      const equipped = r === u.equipWeapon || r === u.equipRing;
      const canUse = !!it.use && it.use.type !== 'none';
      const ops = [
        { label: 'Use', disabled: !canUse },
        { label: equipped ? 'Unequip' : 'Equip', disabled: !canEquip(u, it) || (equipped && it.cursed) },
        { label: 'Give' },
        { label: 'Drop', disabled: it.kind === 'key' || (equipped && it.cursed) },
      ];
      const op = yield* choose(ops, { x: 120, y: 8 + r * 12, title: it.name });
      if (op === -1) continue;
      if (op === 0) {
        const used = yield* this.useItem(u, r);
        if (used) return true;
        continue;
      }
      if (op === 1) {
        if (equipped) {
          if (it.kind === 'weapon') u.equipWeapon = -1; else u.equipRing = -1;
          yield* sayKeep(`${u.name} removed the ${it.name}.`);
        } else {
          if (it.kind === 'weapon') {
            if (u.equipWeapon >= 0 && weaponOf(u)?.cursed) { yield* sayKeep('The cursed weapon cannot be removed!'); closeDialog(); continue; }
            u.equipWeapon = r;
          } else {
            if (u.equipRing >= 0 && ringOf(u)?.cursed) { yield* sayKeep('The cursed ring cannot be removed!'); closeDialog(); continue; }
            u.equipRing = r;
          }
          audio.sfx('ok');
          yield* sayKeep(`${u.name} equipped the ${it.name}.${it.cursed ? ' ...It is cursed!' : ''}`);
        }
        closeDialog();
        continue;
      }
      if (op === 2) {
        const allies = this.alive(u.team).filter((a) => a !== u && dist(a.x, a.y, u.x, u.y) <= 1 && a.items.length < 4);
        if (allies.length === 0) { yield* sayKeep('No one nearby can take it.'); closeDialog(); continue; }
        const t = yield* this.pickTarget(allies.map((a) => [a.x, a.y] as [number, number]), HL_HEAL);
        if (!t) continue;
        const a = this.unitAt(t[0], t[1])!;
        removeItem(u, r);
        addItem(a, id);
        yield* sayKeep(`${u.name} gave the ${it.name} to ${a.name}.`);
        closeDialog();
        continue;
      }
      if (op === 3) {
        const ok = yield* ask(`Throw away the ${it.name}?`);
        if (ok) {
          removeItem(u, r);
          yield* sayKeep(`${u.name} threw away the ${it.name}.`);
          closeDialog();
        }
        continue;
      }
    }
  }

  *useItem(u: Unit, idx: number): Co<boolean> {
    const id = u.items[idx];
    const it = itemDef(id);
    const use = it.use!;
    if (use.type === 'spell') {
      const sp = SPELLS[use.spell];
      const L = sp.levels[use.level - 1];
      const cands = this.spellTargets(u, sp, L);
      if (cands.length === 0) { yield* sayKeep('There is no target in range.'); closeDialog(); return false; }
      const center = L.range === 0 ? [u.x, u.y] as [number, number] : yield* this.pickTarget(cands, sp.target === 'ally' ? HL_HEAL : HL_ATTACK, (x, y) => this.areaFor(u, L, x, y));
      if (!center) return false;
      const mpBackup = u.mp;
      u.mp += L.mp;
      yield* this.castSpell(u, sp, use.level, center[0], center[1]);
      u.mp = mpBackup;
      if (it.kind === 'use') removeItem(u, idx);
      return true;
    }
    if (use.type === 'egress') {
      const ok = yield* ask('Retreat from this battle?');
      if (!ok) return false;
      removeItem(u, idx);
      yield* sayKeep(`${u.name} used the ${it.name}!`);
      audio.sfx('egress');
      yield* flash(6, '#fff');
      this.result = 'egress';
      closeDialog();
      return true;
    }
    // heal / cure / stat: choose self or adjacent ally
    const allies = this.alive(u.team).filter((a) => dist(a.x, a.y, u.x, u.y) <= 1);
    const t = yield* this.pickTarget(allies.map((a) => [a.x, a.y] as [number, number]), HL_HEAL);
    if (!t) return false;
    const a = this.unitAt(t[0], t[1])!;
    removeItem(u, idx);
    audio.sfx('heal');
    if (use.type === 'heal') {
      const amt = heal(a, use.amount);
      this.popup(a.x, a.y, `+${amt}`, C.green);
      yield* sayKeep(`${a.name} recovered ${amt} HP.`);
    } else if (use.type === 'cure') {
      a.poison = false;
      yield* sayKeep(`${a.name} was cured.`);
    } else if (use.type === 'stat') {
      if (use.stat === 'hp') { a.maxHp += use.amount; a.hp += use.amount; }
      else if (use.stat === 'mp') { a.maxMp += use.amount; a.mp += use.amount; }
      else a[use.stat] += use.amount;
      yield* sayKeep(`${a.name}'s ${use.stat.toUpperCase()} rose by ${use.amount}!`);
    }
    closeDialog();
    return true;
  }

  // ---- attacks & cutscene ----------------------------------------------------------

  *doAttack(att: Unit, def: Unit): Co<void> {
    const hits = resolveAttack(att, def, (x, y) => this.at(x, y), (u) => moveTypeOf(u));
    yield* this.cutscene(att, def, hits);
    // EXP for force participants
    const killed: Unit[] = [];
    for (const u of [att, def]) {
      if (u.team !== 'force') continue;
      let exp = 0;
      for (const h of hits) {
        if (h.attacker !== u || h.miss) continue;
        exp += expGain(u, h.target, h.killed);
      }
      if (exp > 0 && u.alive) yield* this.grantExp(u, Math.min(49, exp));
    }
    for (const h of hits) if (h.killed && !killed.includes(h.target)) killed.push(h.target);
    for (const k of killed) yield* this.unitDied(k);
    closeDialog();
  }

  *cutscene(att: Unit, def: Unit, hits: Hit[]): Co<void> {
    const left = att.team === 'force' ? att : def.team === 'force' ? def : att;
    const right = left === att ? def : att;
    // reconstruct HP before the exchange for display
    let dmgL = 0, dmgR = 0;
    for (const h of hits) { if (h.target === left) dmgL += h.dmg; else dmgR += h.dmg; }
    const cs: Cutscene = {
      left, right, hpL: left.hp + dmgL, hpR: right.hp + dmgR,
      lungeL: 0, lungeR: 0, shakeL: 0, shakeR: 0, popup: null,
      terrainL: this.at(left.x, left.y), terrainR: this.at(right.x, right.y), t: 0, effect: null, slash: null,
    };
    yield* fadeOut(8, '#000');
    this.anim = cs;
    yield* fadeIn(8);
    yield 10;
    let first = true;
    for (const h of hits) {
      const aLeft = h.attacker === left;
      if (first) {
        yield* sayKeep(`${h.attacker.name} attacked ${h.target.name}!`);
        first = false;
      } else if (h.counter) {
        yield* sayKeep(`${h.attacker.name} counterattacked!`);
      } else {
        yield* sayKeep(`${h.attacker.name} attacked again!`);
      }
      // lunge
      for (let i = 0; i < 8; i++) {
        const v = i < 4 ? i * 6 : (8 - i) * 6;
        if (aLeft) cs.lungeL = v; else cs.lungeR = -v;
        if (i === 4) {
          if (h.miss) audio.sfx('miss');
          else {
            audio.sfx(h.crit ? 'crit' : 'hit');
            cs.slash = { side: aLeft ? 'R' : 'L', t: 8 };
            if (aLeft) cs.shakeR = 10; else cs.shakeL = 10;
            cs.popup = { side: aLeft ? 'R' : 'L', txt: h.crit ? `${h.dmg}!` : `${h.dmg}`, t: 40, color: h.crit ? C.yellow : C.white };
            if (aLeft) cs.hpR = Math.max(0, cs.hpR - h.dmg); else cs.hpL = Math.max(0, cs.hpL - h.dmg);
          }
          if (h.miss) cs.popup = { side: aLeft ? 'R' : 'L', txt: 'MISS', t: 40, color: C.gray };
        }
        yield 1;
      }
      cs.lungeL = 0;
      cs.lungeR = 0;
      if (h.miss) yield* sayKeep(`${h.attacker.name}'s attack missed!`);
      else {
        if (h.crit) yield* sayKeep('A critical hit!');
        yield* sayKeep(`${h.target.name} took ${h.dmg} damage.`);
      }
      if (h.killed) {
        audio.sfx('death');
        yield 20;
        yield* sayKeep(`${h.target.name} was defeated!`);
      }
    }
    yield* fadeOut(8, '#000');
    this.anim = null;
    this.cursorOn = false;
    yield* fadeIn(8);
  }

  *grantExp(u: Unit, exp: number): Co<void> {
    if (u.fixed) return;
    yield* sayKeep(`${u.name} gained ${exp} EXP.`);
    const lr = addExp(u, exp);
    if (lr) {
      audio.sfx('levelup');
      const g = lr.gains;
      const parts: string[] = [];
      if (g.hp) parts.push(`HP+${g.hp}`);
      if (g.mp) parts.push(`MP+${g.mp}`);
      if (g.att) parts.push(`ATT+${g.att}`);
      if (g.def) parts.push(`DEF+${g.def}`);
      if (g.agi) parts.push(`AGI+${g.agi}`);
      yield* sayKeep(`${u.name} reached level ${lr.level}! ${parts.join(' ')}`);
      for (const s of lr.newSpells) yield* sayKeep(`${u.name} learned ${spellName(s)}!`);
    }
  }

  *unitDied(u: Unit): Co<void> {
    u.alive = false;
    u.hp = 0;
    if (u.team === 'enemy') {
      this.goldEarned += u.goldReward ?? 0;
      if (u.drop) {
        const h = hero(this.g);
        const it = itemDef(u.drop);
        if (addItem(h, u.drop)) yield* sayKeep(`${u.name} dropped the ${it.name}! ${h.name} took it.`);
        else { this.g.depot.push(u.drop); yield* sayKeep(`${u.name} dropped the ${it.name}! It was sent to headquarters.`); }
      }
    } else if (u.isHero) {
      this.result = 'lose';
    }
    this.checkEnd();
  }

  // ---- enemy AI ------------------------------------------------------------------

  *enemyTurn(u: Unit): Co<void> {
    const force = this.alive('force');
    if (force.length === 0) return;
    const mt = moveTypeOf(u);
    const mov = effMov(u);
    const ai = u.ai ?? 'wait';
    const nearestD = Math.min(...force.map((f) => dist(u.x, u.y, f.x, f.y)));
    const [mn, mx] = attackRange(u);
    if (!u.triggered && (ai === 'wait' || ai === 'boss' || ai === 'healer' || ai === 'caster')) {
      const aggro = u.aggroRange ?? (ai === 'boss' ? Math.max(3, mx + 1) : mov + mx + 1);
      if (nearestD > aggro) return;
      u.triggered = true;
    }
    yield* this.focus(u.x, u.y, 10);
    const stationary = ai === 'stationary' || mov === 0;
    const reach = stationary ? new Map([[key(u.x, u.y), { x: u.x, y: u.y, cost: 0, px: -1, py: -1 }]]) : reachable(this.grid(), u, mt, mov, this.units);
    // healer: heal a damaged ally
    if (ai === 'healer') {
      const hs = u.spells.find((s) => s.spell === 'heal');
      if (hs) {
        const sp = SPELLS.heal;
        const L = sp.levels[hs.level - 1];
        if (u.mp >= L.mp) {
          const hurt = this.alive('enemy').filter((a) => a.hp < a.maxHp * 0.6 && a !== u);
          let best: { tile: Reach; t: Unit; score: number } | null = null;
          for (const r of reach.values()) for (const t of hurt) {
            const d = dist(r.x, r.y, t.x, t.y);
            if (d > L.range) continue;
            const score = (t.maxHp - t.hp) + (t.boss ? 30 : 0) - r.cost;
            if (!best || score > best.score) best = { tile: r, t, score };
          }
          if (best) {
            yield* this.walk(u, pathTo(reach, best.tile.x, best.tile.y));
            yield* this.castSpell(u, sp, hs.level, best.t.x, best.t.y);
            return;
          }
        }
      }
    }
    // evaluate best spell option
    let bestSpell: { tile: Reach; sp: SpellDef; level: number; cx: number; cy: number; score: number } | null = null;
    for (const s of u.spells) {
      const sp = SPELLS[s.spell];
      if (!sp || sp.target !== 'enemy' || sp.kind === 'special') continue;
      for (let lv = s.level; lv >= 1; lv--) {
        const L = sp.levels[lv - 1];
        if (u.mp < L.mp) continue;
        for (const r of reach.values()) {
          for (const f of force) {
            if (dist(r.x, r.y, f.x, f.y) > L.range) continue;
            const area = areaTiles(f.x, f.y, L.area as Area, this.w, this.h);
            let score = 0;
            for (const [ax, ay] of area) {
              const t = this.unitAt(ax, ay);
              if (!t || t.team !== 'force') continue;
              if (sp.kind === 'damage') {
                const d = Math.min(t.hp, L.power);
                score += d + (L.power >= t.hp ? 25 : 0) + (t.isHero ? 2 : 0);
              } else if (sp.kind === 'status') score += t.immuneStatus ? 0 : 12;
              else if (sp.kind === 'debuff') score += 8;
            }
            score -= r.cost * 0.3;
            if (score > 0 && (!bestSpell || score > bestSpell.score)) bestSpell = { tile: r, sp, level: lv, cx: f.x, cy: f.y, score };
          }
        }
        break; // only consider highest affordable level
      }
    }
    // evaluate best physical attack
    let bestAtk: { tile: Reach; t: Unit; score: number } | null = null;
    for (const r of reach.values()) {
      for (const f of force) {
        const d = dist(r.x, r.y, f.x, f.y);
        if (d < mn || d > mx) continue;
        const raw = Math.max(0, effAtt(u) - effDef(f));
        const le = landEffect(this.at(f.x, f.y), moveTypeOf(f));
        const dmg = Math.round(raw * (1 - le / 100));
        let score = Math.min(f.hp, dmg) * 1.2 + (dmg >= f.hp ? 30 : 0) + (f.isHero ? 2 : 0) + (f.spells.length > 0 ? 4 : 0);
        score += landEffect(this.at(r.x, r.y), mt) * 0.15 - r.cost * 0.3;
        if (!bestAtk || score > bestAtk.score) bestAtk = { tile: r, t: f, score };
      }
    }
    if (bestSpell && (!bestAtk || bestSpell.score > bestAtk.score)) {
      yield* this.walk(u, pathTo(reach, bestSpell.tile.x, bestSpell.tile.y));
      yield* this.castSpell(u, bestSpell.sp, bestSpell.level, bestSpell.cx, bestSpell.cy);
      return;
    }
    if (bestAtk) {
      yield* this.walk(u, pathTo(reach, bestAtk.tile.x, bestAtk.tile.y));
      this.faceToward(u, bestAtk.t);
      yield 6;
      yield* this.doAttack(u, bestAtk.t);
      return;
    }
    if (stationary || ai === 'boss') { yield 6; return; }
    // approach the nearest force unit
    let bestTile: Reach | null = null;
    let bestD = Infinity;
    for (const r of reach.values()) {
      let d = Infinity;
      for (const f of force) d = Math.min(d, dist(r.x, r.y, f.x, f.y));
      const score = d - landEffect(this.at(r.x, r.y), mt) * 0.02;
      if (score < bestD) { bestD = score; bestTile = r; }
    }
    if (bestTile && (bestTile.x !== u.x || bestTile.y !== u.y)) {
      yield* this.walk(u, pathTo(reach, bestTile.x, bestTile.y));
    } else yield 6;
  }

  *muddledTurn(u: Unit): Co<void> {
    yield* this.focus(u.x, u.y, 10);
    this.popup(u.x, u.y, '???', C.orange);
    yield 14;
    const reach = reachable(this.grid(), u, moveTypeOf(u), effMov(u), this.units);
    const tiles = [...reach.values()];
    const r = rng.pick(tiles);
    yield* this.walk(u, pathTo(reach, r.x, r.y));
    const [mn, mx] = attackRange(u);
    const adj = this.units.filter((t) => t.alive && t !== u && dist(t.x, t.y, u.x, u.y) >= mn && dist(t.x, t.y, u.x, u.y) <= mx);
    if (adj.length && rng.chance(0.6)) {
      const t = rng.pick(adj);
      this.faceToward(u, t);
      yield* this.doAttack(u, t);
    }
  }

  // ---- endings --------------------------------------------------------------------

  *victory(): Co<void> {
    this.cursorOn = false;
    this.hl.clear();
    yield 20;
    audio.play('victory');
    yield* sayKeep('The Shining Force won the battle!');
    if (this.goldEarned > 0) {
      this.g.gold += this.goldEarned;
      audio.sfx('gold');
      yield* sayKeep(`The force received ${this.goldEarned} gold.`);
    }
    closeDialog();
    this.g.flags['won:' + this.def.id] = true;
    this.g.battlesWon++;
    for (const u of this.g.force) if (u.alive) fullHeal(u);
    if (this.def.outro) yield* runScript(this.g, this.def.outro, {});
    yield* fadeOut(24);
    const a = this.def.after;
    director.enterLocation(this.g, a.location, a.x, a.y, a.dir);
  }

  *defeat(): Co<void> {
    this.cursorOn = false;
    this.hl.clear();
    audio.play('gameover');
    yield 20;
    yield* sayKeep('Max has fallen... The Shining Force retreats in defeat.');
    const lost = Math.floor(this.g.gold / 2);
    this.g.gold -= lost;
    yield* sayKeep(`Half of the gold (${lost}) was lost.`);
    closeDialog();
    const h = hero(this.g);
    h.alive = true;
    fullHeal(h);
    for (const u of this.g.force) if (u.alive) fullHeal(u);
    yield* fadeOut(30);
    const c = this.g.lastChurch;
    director.enterLocation(this.g, c.location, c.x, c.y, 'down');
  }

  *egressOut(): Co<void> {
    this.cursorOn = false;
    this.hl.clear();
    for (const u of this.g.force) if (u.alive) fullHeal(u);
    yield* fadeOut(20, '#fff');
    const c = this.g.lastChurch;
    director.enterLocation(this.g, c.location, c.x, c.y, 'down');
  }

  // ---- update / draw ---------------------------------------------------------------

  update(): void {
    this.frame++;
    this.runner.update();
    this.updateCam();
    for (const p of this.popups) p.t--;
    this.popups = this.popups.filter((p) => p.t > 0);
    if (this.fx) this.fx.t--;
    if (this.anim) {
      this.anim.t++;
      if (this.anim.shakeL > 0) this.anim.shakeL--;
      if (this.anim.shakeR > 0) this.anim.shakeR--;
      if (this.anim.popup) { this.anim.popup.t--; if (this.anim.popup.t <= 0) this.anim.popup = null; }
      if (this.anim.slash) { this.anim.slash.t--; if (this.anim.slash.t <= 0) this.anim.slash = null; }
    }
    if (this.banner) { this.banner.t--; if (this.banner.t <= 0) this.banner = null; }
  }

  draw(): void {
    if (this.anim) {
      this.drawCutscene(this.anim);
      drawWidgets();
      return;
    }
    const camX = Math.round(this.cam.x), camY = Math.round(this.cam.y);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const wf = Math.floor(this.frame / 30) % 2;
    const x0 = Math.floor(camX / TILE), y0 = Math.floor(camY / TILE);
    for (let y = y0; y <= y0 + H / TILE + 1; y++) {
      for (let x = x0; x <= x0 + W / TILE + 1; x++) {
        if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
        ctx.drawImage(tile(this.at(x, y), wf), x * TILE - camX, y * TILE - camY);
      }
    }
    // highlights
    const drawHl = (m: Map<string, string>) => {
      for (const [k, col] of m) {
        const [x, y] = k.split(',').map(Number);
        ctx.fillStyle = col;
        ctx.fillRect(x * TILE - camX + 1, y * TILE - camY + 1, TILE - 2, TILE - 2);
      }
    };
    drawHl(this.hl);
    drawHl(this.hlAlt);
    // chests
    for (const c of this.chests) ctx.drawImage(chestSprite(c.opened), c.x * TILE - camX, c.y * TILE - camY);
    // spell fx
    if (this.fx && this.fx.t > 0) {
      ctx.globalAlpha = 0.4 + 0.4 * Math.abs(Math.sin(this.fx.t / 3));
      for (const [x, y] of this.fx.tiles) {
        ctx.fillStyle = this.fx.color;
        ctx.fillRect(x * TILE - camX, y * TILE - camY, TILE, TILE);
      }
      ctx.globalAlpha = 1;
    }
    // units (sorted by y)
    const af = Math.floor(this.frame / 16) % 2;
    const sorted = this.units.filter((u) => u.alive).sort((a, b) => a.y - b.y);
    for (const u of sorted) {
      const p = this.drawPos.get(u.uid) ?? { x: u.x * TILE, y: u.y * TILE };
      const sx = Math.round(p.x - camX), sy = Math.round(p.y - camY);
      if (sx < -TILE || sy < -TILE || sx > W || sy > H) continue;
      if (u.team === 'enemy') {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(sx + 4, sy + 20, 16, 3);
      }
      ctx.drawImage(unitSprite(u.sprite, u.dir, af), sx, sy);
      if (u.sleep > 0) text('z', sx + 16, sy - 2, C.cyan, false);
    }
    // cursor
    if (this.cursorOn) {
      const blink = Math.floor(this.frame / 8) % 2 === 0;
      drawCursor(this.cursor.x * TILE - camX, this.cursor.y * TILE - camY, TILE, blink ? C.white : C.yellow);
    }
    // popups
    for (const p of this.popups) {
      const sx = p.x * TILE - camX + TILE / 2 - (p.txt.length * CH) / 2;
      const sy = p.y * TILE - camY - 6 - Math.max(0, 20 - p.t) * 0.3;
      text(p.txt, Math.round(sx), Math.round(sy), p.color);
    }
    // info panels
    if (this.cursorOn && !this.statusUnit) {
      const ch = this.at(this.cursor.x, this.cursor.y);
      const u = this.unitAt(this.cursor.x, this.cursor.y);
      const le = u ? landEffect(ch, moveTypeOf(u)) : terrain(ch).le;
      drawInfoBox(`${terrain(ch).name}  ${le}%`);
      if (u) {
        const screenY = this.cursor.y * TILE - camY;
        const py = screenY > H / 2 ? 8 : H - 62 - 50;
        drawUnitPanel(u, W - 136, py);
      }
    }
    if (this.statusUnit) drawFullStatus(this.statusUnit, 60, 40);
    if (this.banner) {
      win(W / 2 - 60, 8, 120, 22);
      textCenter(this.banner.txt, W / 2, 15, C.yellow);
    }
    drawWidgets();
  }

  backdropFor(ch: string): string {
    if (this.def.backdrop) return this.def.backdrop;
    const t = terrain(ch).name;
    if (t === 'Deck') return 'sea';
    if (t === 'Water' || t === 'Bridge' || t === 'Shallows') return 'water';
    if (t === 'Forest' || t === 'Bush') return 'forest';
    if (t === 'Hills' || t === 'Mountain' || t === 'Sand') return 'hills';
    if (t === 'Lava') return 'lava';
    if (t === 'Wasteland' || t === 'Dead Woods') return 'wasteland';
    if (t === 'Ruins') return 'ruins';
    if (t === 'Glass Floor' || t === 'Void') return 'tower';
    if (t === 'Floor' || t === 'Carpet' || t === 'Stone Road' || t === 'Door' || t === 'Stairs' || t === 'Wall') return 'castle';
    return 'grass';
  }

  drawCutscene(cs: Cutscene): void {
    // backdrop: painted image when available, procedural sky/ground otherwise
    const bg = image(this.backdropFor(cs.terrainL));
    const sky = ['#2040a0', '#3060c0', '#5090e0', '#80b8f0'];
    if (bg) {
      ctx.drawImage(bg, 0, 0, 320, 140);
      rect(0, 140, W, 40, '#000');
    } else for (let i = 0; i < 4; i++) rect(0, i * 30, W, 30, sky[i]);
    const groundFor = (ch: string): string => {
      const t = terrain(ch).name;
      if (t === 'Water' || t === 'Bridge' || t === 'Deck') return '#3060d0';
      if (t === 'Forest' || t === 'Bush') return '#2c8030';
      if (t === 'Hills' || t === 'Mountain') return '#a08850';
      if (t === 'Sand' || t === 'Wasteland') return '#e0d090';
      if (t === 'Floor' || t === 'Carpet' || t === 'Stone Road' || t === 'Ruins' || t === 'Stairs' || t === 'Door') return '#9a9488';
      if (t === 'Lava') return '#d83810';
      return '#78c050';
    };
    if (!bg) {
      rect(0, 120, W / 2, 60, groundFor(cs.terrainL));
      rect(W / 2, 120, W / 2, 60, groundFor(cs.terrainR));
      rect(0, 120, W, 2, 'rgba(0,0,0,0.25)');
      // far scenery
      for (let i = 0; i < 6; i++) rect(10 + i * 56, 104 - (i % 3) * 6, 30, 16 + (i % 3) * 6, shade(groundFor(cs.terrainL), -30));
    }
    const scale = 3;
    const BIG_H = 104;
    const groundY = 128;
    const imgL = unitImage(cs.left.team === 'force' ? cs.left.id : cs.left.defId ?? cs.left.id);
    const imgR = unitImage(cs.right.team === 'force' ? cs.right.id : cs.right.defId ?? cs.right.id);
    const wL = imgL ? Math.round(imgL.width * (BIG_H / imgL.height)) : TILE * scale;
    const wR = imgR ? Math.round(imgR.width * (BIG_H / imgR.height)) : TILE * scale;
    const lx = 70 + cs.lungeL + (cs.shakeL > 0 ? (cs.shakeL % 2 ? 3 : -3) : 0);
    const rx = W - 70 - wR + cs.lungeR + (cs.shakeR > 0 ? (cs.shakeR % 2 ? 3 : -3) : 0);
    const af = Math.floor(cs.t / 20) % 2;
    // shadows
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(lx + 6, groundY - 3, wL - 12, 4);
    ctx.fillRect(rx + 6, groundY - 3, wR - 12, 4);
    ctx.globalAlpha = cs.shakeL > 0 && cs.shakeL % 4 < 2 ? 0.4 : 1;
    if (imgL) ctx.drawImage(imgL, lx, groundY - BIG_H + (af ? 1 : 0), wL, BIG_H);
    else blitScaled(unitSprite(cs.left.sprite, 'right', af), lx, groundY - TILE * scale, scale);
    ctx.globalAlpha = cs.shakeR > 0 && cs.shakeR % 4 < 2 ? 0.4 : 1;
    if (imgR) {
      ctx.save();
      ctx.translate(rx + wR, groundY - BIG_H + (af ? 1 : 0));
      ctx.scale(-1, 1);
      ctx.drawImage(imgR, 0, 0, wR, BIG_H);
      ctx.restore();
    } else blitScaled(unitSprite(cs.right.sprite, 'left', af), rx, groundY - TILE * scale, scale);
    ctx.globalAlpha = 1;
    const centerOf = (side: 'L' | 'R') => (side === 'L' ? { x: lx + wL / 2, y: groundY - BIG_H / 2 } : { x: rx + wR / 2, y: groundY - BIG_H / 2 });
    if (cs.slash) {
      const c = centerOf(cs.slash.side);
      const p = (8 - cs.slash.t) / 8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x - 30 + p * 10, c.y - 40 + p * 10);
      ctx.lineTo(c.x + 10 + p * 10, c.y + 30 + p * 10);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    if (cs.effect) this.drawEffect(cs.effect, centerOf(cs.effect.side), groundY);
    // stat windows
    const sw = (u: Unit, hp: number, x: number) => {
      win(x, 134, 132, 40);
      text(u.name, x + 8, 141, u.team === 'force' ? C.white : C.orange);
      text(`HP ${hp}`, x + 8, 155, hp <= u.maxHp / 4 ? C.red : C.white);
      text(`MP ${u.mp}`, x + 72, 155);
    };
    sw(cs.left, cs.hpL, 8);
    sw(cs.right, cs.hpR, W - 140);
    if (cs.popup) {
      const px = cs.popup.side === 'L' ? lx + wL / 2 : rx + wR / 2;
      const py = groundY - BIG_H - 10 - Math.max(0, 30 - cs.popup.t) * 0.5;
      textCenter(cs.popup.txt, px, Math.round(py), cs.popup.color);
    }
  }

  /** Procedural spell effects for the battle screen. */
  drawEffect(e: { kind: string; t: number; seed: number }, c: { x: number; y: number }, groundY: number): void {
    const t = e.t;
    const r = (i: number) => { const v = Math.sin(e.seed * 12.9898 + i * 78.233) * 43758.5453; return v - Math.floor(v); };
    switch (e.kind) {
      case 'fire': {
        for (let i = 0; i < 26; i++) {
          const life = (t * 1.6 + i * 7) % 44;
          const x = c.x - 34 + r(i) * 68 + Math.sin((t + i) * 0.5) * 5;
          const y = groundY - 4 - life * 2.2;
          const size = 5 + Math.max(0, 12 - life / 3);
          ctx.fillStyle = life < 14 ? '#fff0a0' : life < 28 ? '#f8a020' : '#d03010';
          ctx.fillRect(Math.round(x - size / 2), Math.round(y), Math.round(size), Math.round(size * 1.4));
        }
        break;
      }
      case 'ice': {
        const grow = Math.min(1, t / 18);
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          const len = (18 + r(i) * 22) * grow;
          const x0 = c.x + Math.cos(ang) * 8, y0 = c.y + Math.sin(ang) * 8;
          ctx.strokeStyle = i % 2 ? '#c0f0ff' : '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
        if (t > 26) {
          for (let i = 0; i < 14; i++) {
            const dx = (r(i + 20) - 0.5) * 70, dy = (r(i + 40) - 0.5) * 70 + (t - 26) * 2;
            ctx.fillStyle = '#e0f8ff';
            ctx.fillRect(Math.round(c.x + dx), Math.round(c.y + dy), 2, 2);
          }
        }
        break;
      }
      case 'bolt': {
        if (t % 6 < 4) {
          for (let b = 0; b < 3; b++) {
            ctx.strokeStyle = b === 0 ? '#ffffff' : '#f8f060';
            ctx.lineWidth = b === 0 ? 3 : 2;
            ctx.beginPath();
            let x = c.x + (b - 1) * 12, y = 0;
            ctx.moveTo(x, y);
            while (y < c.y + 10) {
              y += 10 + r(b * 50 + y) * 8;
              x += (r(b * 70 + y) - 0.5) * 22;
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
          ctx.lineWidth = 1;
        }
        if (t > 20) {
          ctx.fillStyle = t % 2 ? '#ffffff' : '#f8f060';
          for (let i = 0; i < 10; i++) ctx.fillRect(Math.round(c.x + (r(i) - 0.5) * 60), Math.round(c.y + (r(i + 9) - 0.5) * 60), 2, 2);
        }
        break;
      }
      case 'heal':
      case 'holy': {
        for (let i = 0; i < 16; i++) {
          const life = (t * 1.4 + i * 6) % 44;
          const x = c.x - 30 + r(i) * 60;
          const y = groundY - life * 2.2;
          if (life > 40) continue;
          ctx.fillStyle = (i + Math.floor(t / 4)) % 2 ? '#80ff90' : '#f8f8a0';
          ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
          ctx.fillRect(Math.round(x) - 1, Math.round(y) + 1, 4, 1);
          ctx.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 4);
        }
        break;
      }
      case 'dark': {
        for (let i = 0; i < 3; i++) {
          const rad = 50 - ((t * 1.5 + i * 15) % 50);
          ctx.strokeStyle = i % 2 ? '#c060f8' : '#5020a0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c.x, c.y, Math.max(1, rad), t * 0.2, t * 0.2 + Math.PI * 1.5);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
        break;
      }
      case 'buff':
      case 'debuff': {
        const up = e.kind === 'buff';
        ctx.fillStyle = up ? '#60c0ff' : '#f0a040';
        for (let i = 0; i < 5; i++) {
          const life = (t * 1.5 + i * 9) % 44;
          const y = up ? groundY - 10 - life * 2 : groundY - 100 + life * 2;
          const x = c.x - 24 + i * 12;
          ctx.fillRect(Math.round(x), Math.round(y), 3, 8);
          ctx.fillRect(Math.round(x) - 2, Math.round(up ? y : y + 6), 7, 2);
        }
        break;
      }
      default: {
        ctx.fillStyle = '#e0e0ff';
        for (let i = 0; i < 8; i++) {
          const life = (t * 1.2 + i * 6) % 44;
          ctx.fillRect(Math.round(c.x - 20 + r(i) * 40), Math.round(groundY - 20 - life * 1.8), 3, 3);
        }
      }
    }
  }
}
