import { ctx, W, H, TILE } from '../../engine/canvas';
import { input } from '../../engine/input';
import { audio } from '../../engine/audio';
import { Runner, type Co } from '../../engine/co';
import { fadeIn, fadeOut, fade, type Scene } from '../../engine/scene';
import { C, CH, text, win, textCenter, textRight } from '../../engine/gfx';
import { rng } from '../../engine/rng';
import { tile, chestSprite } from '../tiles';
import { unitSprite } from '../sprites';
import { moveCost } from '../terrain';
import type { Dest, Dir, GameState, LocationDef, NpcDef, Script, Unit } from '../types';
import { LOCATIONS } from '../data/locations';
import { CHAPTERS } from '../data/chapters';
import { item as itemDef } from '../data/items';
import { SPELLS } from '../data/spells';
import {
  hero, member, addItem, removeItem, canEquip, weaponOf, ringOf, heal, fullHeal, canPromote, promote,
  reviveCost, unitClass, MAX_PARTY, MAX_ITEMS, spellName, effAtt, effDef,
} from '../state';
import { sayKeep, closeDialog, choose, ask, RadialMenu, drawFullStatus, drawWidgets, clearWidgets, addWidget, removeWidget, type MenuItem } from '../ui';
import { runScript, type ScriptEnv } from '../script';
import { director } from '../director';

interface Mover {
  x: number;
  y: number;
  px: number;
  py: number;
  dir: Dir;
  moving: boolean;
  tx: number;
  ty: number;
}

interface Npc {
  def: NpcDef;
  m: Mover;
  wanderT: number;
}

const SPEED = 3; // px per frame (24px tile = 8 frames)

export class FieldScene implements Scene {
  kind = 'field';
  loc: LocationDef;
  w: number;
  h: number;
  npcs: Npc[] = [];
  player: Mover;
  cam = { x: 0, y: 0 };
  runner = new Runner();
  frame = 0;
  removed = new Set<string>();
  card: { title: string; sub: string; t: number } | null = null;
  menuOpen = false;
  showGold = false;

  constructor(public g: GameState, locId: string, x: number, y: number, dir: Dir = 'down') {
    const loc = LOCATIONS[locId];
    if (!loc) throw new Error('Unknown location ' + locId);
    this.loc = loc;
    this.h = loc.rows.length;
    this.w = Math.max(...loc.rows.map((r) => r.length));
    this.player = { x, y, px: x * TILE, py: y * TILE, dir, moving: false, tx: x, ty: y };
    g.location = locId;
    g.px = x;
    g.py = y;
    g.pdir = dir;
    this.rebuildNpcs();
  }

  at(x: number, y: number): string {
    if (x < 0 || y < 0 || y >= this.h) return '#';
    return this.loc.rows[y][x] ?? '#';
  }

  rebuildNpcs(): void {
    this.npcs = this.loc.npcs
      .filter((n) => !this.removed.has(n.id))
      .filter((n) => !n.member || !this.g.force.some((u) => u.id === n.member))
      .filter((n) => !n.cond || n.cond(this.g))
      .map((n) => ({ def: n, m: { x: n.x, y: n.y, px: n.x * TILE, py: n.y * TILE, dir: n.dir ?? 'down', moving: false, tx: n.x, ty: n.y }, wanderT: rng.int(30, 150) }));
  }

  npcAt(x: number, y: number): Npc | undefined {
    return this.npcs.find((n) => (n.m.x === x && n.m.y === y) || (n.m.moving && n.m.tx === x && n.m.ty === y));
  }

  walkable(x: number, y: number, who: 'player' | 'npc'): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    if (!isFinite(moveCost(this.at(x, y), 'walk'))) return false;
    if (this.chestAt(x, y)) return false;
    if (this.npcAt(x, y)) return false;
    if (who === 'npc') {
      if ((this.player.x === x && this.player.y === y) || (this.player.moving && this.player.tx === x && this.player.ty === y)) return false;
      if (this.loc.exits.some((e) => x >= e.x && x < e.x + (e.w ?? 1) && y >= e.y && y < e.y + (e.h ?? 1))) return false;
    }
    return true;
  }

  chestAt(x: number, y: number) {
    return this.loc.chests?.find((c) => c.x === x && c.y === y && !this.g.openedChests[`${this.loc.id}:${c.x},${c.y}`]);
  }

  enter(): void {
    clearWidgets();
    audio.play(this.loc.music);
    this.updateCam(true);
    fade.alpha = 1;
    this.runner.start(this.onEnter());
  }

  exit(): void {
    clearWidgets();
  }

  *onEnter(): Co<void> {
    yield* fadeIn(16);
    const s = this.loc.onEnter;
    if (s) {
      const script = typeof s === 'function' ? s(this.g) : s;
      if (script.length) yield* this.run(script);
    }
  }

  env(): ScriptEnv {
    return {
      shop: (items, deals) => this.shop(items, deals),
      church: () => this.church(),
      hq: () => this.hq(),
      inn: (p) => this.inn(p),
      warp: (d) => this.goTo(d),
      battle: (id) => this.goTo({ battle: id }),
      removeNpc: (id) => { this.removed.add(id); this.rebuildNpcs(); },
      chapter: (n) => this.chapterCard(n),
      ending: () => this.ending(),
    };
  }

  *run(script: Script): Co<void> {
    yield* runScript(this.g, script, this.env());
    this.rebuildNpcs();
  }

  *goTo(d: Dest): Co<void> {
    yield* fadeOut(16);
    if ('battle' in d) {
      director.startBattle(this.g, d.battle);
      return;
    }
    if (d.location === this.loc.id) {
      // same map: just move the player so a running script can continue
      const p = this.player;
      p.x = p.tx = d.x;
      p.y = p.ty = d.y;
      p.px = d.x * TILE;
      p.py = d.y * TILE;
      p.dir = d.dir ?? p.dir;
      p.moving = false;
      this.g.px = p.x;
      this.g.py = p.y;
      this.g.pdir = p.dir;
      this.updateCam(true);
      this.rebuildNpcs();
      yield* fadeIn(16);
      return;
    }
    director.enterLocation(this.g, d.location, d.x, d.y, d.dir ?? this.player.dir);
  }

  *chapterCard(n: number): Co<void> {
    const ch = CHAPTERS[n - 1];
    if (!ch) return;
    this.g.chapter = n;
    audio.stopMusic();
    yield* fadeOut(20);
    this.card = { title: `Chapter ${n}`, sub: ch.title, t: 0 };
    fade.alpha = 0;
    for (let i = 0; i < 150; i++) {
      this.card.t = i;
      if (i > 40 && input.ok()) break;
      yield 1;
    }
    yield* fadeOut(16);
    this.card = null;
    audio.play(this.loc.music);
    yield* fadeIn(16);
  }

  *ending(): Co<void> {
    yield* fadeOut(30);
    director.ending(this.g);
  }

  // ---- interaction ---------------------------------------------------------------

  facing(): [number, number] {
    const p = this.player;
    return [p.x + (p.dir === 'right' ? 1 : p.dir === 'left' ? -1 : 0), p.y + (p.dir === 'down' ? 1 : p.dir === 'up' ? -1 : 0)];
  }

  *interact(): Co<void> {
    let [fx, fy] = this.facing();
    let npc = this.npcAt(fx, fy);
    // shopkeepers and priests stand behind counters/altars: look one tile further
    if (!npc && (this.at(fx, fy) === 'c' || this.at(fx, fy) === 'a' || this.at(fx, fy) === 'x')) {
      const p = this.player;
      const bx = fx + (p.dir === 'right' ? 1 : p.dir === 'left' ? -1 : 0);
      const by = fy + (p.dir === 'down' ? 1 : p.dir === 'up' ? -1 : 0);
      npc = this.npcAt(bx, by);
      if (npc) { fx = bx; fy = by; }
    }
    if (npc) {
      if (npc.def.facePlayer !== false) {
        const d = this.player.dir;
        npc.m.dir = d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';
        npc.m.moving = false;
        npc.m.px = npc.m.x * TILE;
        npc.m.py = npc.m.y * TILE;
      }
      yield* this.run(npc.def.script);
      return;
    }
    yield* this.search(fx, fy, true);
  }

  *search(fx: number, fy: number, viaButton: boolean): Co<void> {
    const chest = this.chestAt(fx, fy);
    if (chest) {
      this.g.openedChests[`${this.loc.id}:${chest.x},${chest.y}`] = true;
      audio.sfx('gold');
      if (chest.item) {
        yield* this.run([{ item: chest.item }]);
      } else if (chest.gold) {
        yield* this.run([{ gold: chest.gold }]);
      }
      return;
    }
    const sp = this.loc.searches?.find((s) => s.x === fx && s.y === fy);
    if (sp) {
      const k = `${this.loc.id}:s${sp.x},${sp.y}`;
      if (this.g.openedChests[k]) {
        yield* this.run([`${hero(this.g).name} searched... Nothing else here.`]);
        return;
      }
      const script: Script = [sp.text];
      if (sp.item || sp.gold || sp.flag || sp.join) this.g.openedChests[k] = true;
      if (sp.item) script.push({ item: sp.item });
      if (sp.gold) script.push({ gold: sp.gold });
      if (sp.flag) script.push({ flag: sp.flag });
      if (sp.join) script.push({ join: sp.join });
      yield* this.run(script);
      return;
    }
    if (!viaButton) yield* this.run([`${hero(this.g).name} searched, but found nothing.`]);
  }

  // ---- field menu ------------------------------------------------------------------

  *fieldMenu(): Co<void> {
    const menu = new RadialMenu([
      { icon: 'member', label: 'Member' },
      { icon: 'item', label: 'Item' },
      { icon: 'magic', label: 'Magic' },
      { icon: 'search', label: 'Search' },
    ], W / 2, H / 2 - 20);
    this.showGold = true;
    const r = yield* menu.run();
    this.showGold = false;
    if (r === 0) yield* this.memberMenu();
    else if (r === 1) yield* this.itemMenu();
    else if (r === 2) yield* this.magicMenu();
    else if (r === 3) {
      const [fx, fy] = this.facing();
      yield* this.search(fx, fy, false);
    }
  }

  memberItems(filter?: (u: Unit) => boolean): { items: MenuItem[]; units: Unit[] } {
    const units = this.g.force.filter((u) => !filter || filter(u));
    return {
      units,
      items: units.map((u) => ({ label: `${u.name.padEnd(9)}${unitClass(u).abbr.padEnd(5)}L${u.level}`, color: u.alive ? (this.g.party.includes(u.id) ? C.white : C.gray) : C.red })),
    };
  }

  *memberMenu(): Co<void> {
    for (;;) {
      const { items, units } = this.memberItems();
      const r = yield* choose(items, { x: 8, y: 8, title: 'Members', maxRows: 10 });
      if (r === -1) return;
      const u = units[r];
      const win_ = { draw: () => drawFullStatus(u, 60, 40) };
      addWidget(win_);
      yield 1;
      while (!(input.ok() || input.cancel())) yield 1;
      audio.sfx('cancel');
      removeWidget(win_);
      yield 1;
    }
  }

  *itemMenu(): Co<void> {
    for (;;) {
      const { items, units } = this.memberItems();
      const r = yield* choose(items, { x: 8, y: 8, title: 'Whose items?', maxRows: 10 });
      if (r === -1) return;
      yield* this.unitItems(units[r]);
    }
  }

  *unitItems(u: Unit): Co<void> {
    for (;;) {
      if (u.items.length === 0) {
        yield* this.run([`${u.name} has nothing.`]);
        return;
      }
      const items = u.items.map((id, i) => {
        const it = itemDef(id);
        return { label: it.name, right: i === u.equipWeapon || i === u.equipRing ? 'E' : '', desc: it.desc, color: it.cursed ? C.orange : C.white };
      });
      const r = yield* choose(items, { x: 8, y: 8, title: `${u.name}'s items`, showDesc: true });
      if (r === -1) return;
      const id = u.items[r];
      const it = itemDef(id);
      const equipped = r === u.equipWeapon || r === u.equipRing;
      const usable = !!it.use && (it.use.type === 'heal' || it.use.type === 'cure' || it.use.type === 'stat' || (it.use.type === 'spell' && SPELLS[it.use.spell].target === 'ally'));
      const op = yield* choose([
        { label: 'Use', disabled: !usable },
        { label: equipped ? 'Unequip' : 'Equip', disabled: !canEquip(u, it) || (equipped && !!it.cursed) },
        { label: 'Give' },
        { label: 'Drop', disabled: it.kind === 'key' || (equipped && !!it.cursed) },
      ], { x: 120, y: 8 + r * 12, title: it.name });
      if (op === -1) continue;
      if (op === 0) {
        const { items: mi, units } = this.memberItems((m) => m.alive);
        const t = yield* choose(mi, { x: 120, y: 8, title: 'Use on whom?', maxRows: 10 });
        if (t === -1) continue;
        const a = units[t];
        const use = it.use!;
        if (use.type === 'heal') {
          const amt = heal(a, use.amount);
          audio.sfx('heal');
          removeItem(u, r);
          yield* this.run([`${a.name} recovered ${amt} HP.`]);
        } else if (use.type === 'cure') {
          a.poison = false;
          audio.sfx('heal');
          removeItem(u, r);
          yield* this.run([`${a.name} was cured.`]);
        } else if (use.type === 'stat') {
          if (use.stat === 'hp') { a.maxHp += use.amount; a.hp += use.amount; }
          else if (use.stat === 'mp') { a.maxMp += use.amount; a.mp += use.amount; }
          else a[use.stat] += use.amount;
          audio.sfx('levelup');
          removeItem(u, r);
          yield* this.run([`${a.name}'s ${use.stat.toUpperCase()} rose by ${use.amount}!`]);
        } else if (use.type === 'spell') {
          const sp = SPELLS[use.spell];
          const L = sp.levels[use.level - 1];
          if (sp.kind === 'heal') {
            const amt = heal(a, L.power >= 999 ? a.maxHp : L.power);
            audio.sfx('heal');
            yield* this.run([`${u.name} used the ${it.name}. ${a.name} recovered ${amt} HP.`]);
          } else yield* this.run(['Nothing happened.']);
        }
        continue;
      }
      if (op === 1) {
        if (equipped) {
          if (it.kind === 'weapon') u.equipWeapon = -1; else u.equipRing = -1;
          yield* this.run([`${u.name} removed the ${it.name}.`]);
        } else {
          if (it.kind === 'weapon' && weaponOf(u)?.cursed) { yield* this.run(['The cursed weapon cannot be removed!']); continue; }
          if (it.kind === 'ring' && ringOf(u)?.cursed) { yield* this.run(['The cursed ring cannot be removed!']); continue; }
          if (it.kind === 'weapon') u.equipWeapon = r; else u.equipRing = r;
          audio.sfx('ok');
          yield* this.run([`${u.name} equipped the ${it.name}.${it.cursed ? ' ...It is cursed!' : ''}`]);
        }
        continue;
      }
      if (op === 2) {
        const { items: mi, units } = this.memberItems((m) => m !== u && m.items.length < MAX_ITEMS);
        if (units.length === 0) { yield* this.run(['Nobody can carry any more.']); continue; }
        const t = yield* choose(mi, { x: 120, y: 8, title: 'Give to whom?', maxRows: 10 });
        if (t === -1) continue;
        removeItem(u, r);
        addItem(units[t], id);
        yield* this.run([`${u.name} gave the ${it.name} to ${units[t].name}.`]);
        continue;
      }
      if (op === 3) {
        const ok = yield* ask(`Throw away the ${it.name}?`);
        if (ok) { removeItem(u, r); yield* this.run([`${u.name} threw away the ${it.name}.`]); }
        continue;
      }
    }
  }

  *magicMenu(): Co<void> {
    for (;;) {
      const { items, units } = this.memberItems((u) => u.alive && u.spells.some((s) => SPELLS[s.spell].target === 'ally' && s.spell !== 'egress'));
      if (units.length === 0) { yield* this.run(['Nobody can use magic here.']); return; }
      const r = yield* choose(items, { x: 8, y: 8, title: 'Whose magic?', maxRows: 10 });
      if (r === -1) return;
      const u = units[r];
      const spells = u.spells.filter((s) => SPELLS[s.spell].target === 'ally' && s.spell !== 'egress');
      const sr = yield* choose(spells.map((s) => ({ label: spellName(s), right: `MP${SPELLS[s.spell].levels[s.level - 1].mp}` })), { x: 120, y: 8, title: `${u.name}  MP ${u.mp}` });
      if (sr === -1) continue;
      const s = spells[sr];
      const sp = SPELLS[s.spell];
      // pick level
      let level = s.level;
      if (s.level > 1) {
        const lr = yield* choose(sp.levels.slice(0, s.level).map((l, i) => ({ label: `${sp.name} ${i + 1}`, right: `MP${l.mp}`, disabled: u.mp < l.mp })), { x: 120, y: 8, title: sp.name });
        if (lr === -1) continue;
        level = lr + 1;
      }
      const L = sp.levels[level - 1];
      if (u.mp < L.mp) { yield* this.run(['Not enough MP.']); continue; }
      if (sp.kind === 'heal' && L.area !== 'single') {
        u.mp -= L.mp;
        audio.sfx('heal');
        for (const m of this.g.force) if (m.alive) heal(m, L.power >= 999 ? m.maxHp : L.power);
        yield* this.run([`${u.name} cast ${sp.name} ${level}. Everyone feels better.`]);
        continue;
      }
      const { items: mi, units: targets } = this.memberItems((m) => m.alive);
      const t = yield* choose(mi, { x: 120, y: 8, title: 'On whom?', maxRows: 10 });
      if (t === -1) continue;
      const a = targets[t];
      u.mp -= L.mp;
      audio.sfx(sp.sfx);
      if (sp.kind === 'heal') {
        const amt = heal(a, L.power >= 999 ? a.maxHp : L.power);
        yield* this.run([`${u.name} cast ${sp.name} ${level}. ${a.name} recovered ${amt} HP.`]);
      } else if (sp.status === 'poison') {
        a.poison = false;
        yield* this.run([`${a.name} was cured of poison.`]);
      } else yield* this.run(['Nothing happened.']);
    }
  }

  // ---- shop / church / hq / inn ------------------------------------------------------

  *shop(stock: string[], deals?: string[]): Co<void> {
    const dealKey = (id: string) => `bought:${this.loc.id}:${id}`;
    const availableDeals = () => (deals ?? []).filter((d) => !this.g.flags[dealKey(d)]);
    this.showGold = true;
    try {
      yield* sayKeep('Welcome! What can I do for you?');
      for (;;) {
        const opts = [{ label: 'Buy' }, { label: 'Sell' }, { label: 'Deals', disabled: availableDeals().length === 0 }, { label: 'Leave' }];
        const r = yield* choose(opts, { x: W - 90, y: H - 62 - 64 });
        if (r === -1 || r === 3) break;
        if (r === 0 || r === 2) {
          const list = r === 0 ? stock : availableDeals();
          for (;;) {
            const items = list.map((id) => ({ label: itemDef(id).name, right: `${itemDef(id).price}`, desc: itemDef(id).desc, disabled: itemDef(id).price > this.g.gold }));
            if (items.length === 0) break;
            const ir = yield* choose(items, { x: 8, y: 8, title: r === 0 ? 'Buy what?' : 'Special deals', showDesc: true, w: 190 });
            if (ir === -1) break;
            const id = list[ir];
            const it = itemDef(id);
            if (it.price > this.g.gold) { yield* sayKeep("You don't have enough gold."); continue; }
            const { items: mi, units } = this.memberItems((m) => m.items.length < MAX_ITEMS);
            if (units.length === 0) { yield* sayKeep('Everyone is carrying as much as they can.'); continue; }
            yield* sayKeep(`The ${it.name}? Who will carry it?`);
            const mr = yield* choose(mi.map((m, i) => ({ ...m, right: canEquip(units[i], it) && (it.kind === 'weapon' || it.kind === 'ring') ? 'ok' : '' })), { x: 120, y: 8, title: 'Who?', maxRows: 10 });
            if (mr === -1) continue;
            const u = units[mr];
            this.g.gold -= it.price;
            addItem(u, id);
            audio.sfx('gold');
            if (r === 2) {
              this.g.flags[dealKey(id)] = true;
              list.splice(ir, 1);
            }
            yield* sayKeep(`${u.name} received the ${it.name}. Thank you!`);
            if ((it.kind === 'weapon' || it.kind === 'ring') && canEquip(u, it)) {
              const eq = yield* ask('Equip it now?');
              if (eq) {
                if (it.kind === 'weapon') { if (!weaponOf(u)?.cursed) u.equipWeapon = u.items.length - 1; }
                else if (!ringOf(u)?.cursed) u.equipRing = u.items.length - 1;
                yield* sayKeep(`${u.name} equipped the ${it.name}.`);
              }
            }
          }
          yield* sayKeep('Anything else?');
        } else if (r === 1) {
          for (;;) {
            const { items: mi, units } = this.memberItems((m) => m.items.length > 0);
            if (units.length === 0) { yield* sayKeep('You have nothing to sell.'); break; }
            const mr = yield* choose(mi, { x: 8, y: 8, title: 'Whose items?', maxRows: 10 });
            if (mr === -1) break;
            const u = units[mr];
            const items = u.items.map((id, i) => {
              const it = itemDef(id);
              const locked = it.kind === 'key' || it.price === 0 || ((i === u.equipWeapon || i === u.equipRing) && !!it.cursed);
              return { label: it.name, right: `${Math.floor(it.price / 2)}`, disabled: locked, desc: it.desc };
            });
            const ir = yield* choose(items, { x: 120, y: 8, title: 'Sell what?', showDesc: true });
            if (ir === -1) continue;
            const it = itemDef(u.items[ir]);
            const price = Math.floor(it.price / 2);
            const ok = yield* ask(`Sell the ${it.name} for ${price} gold?`);
            if (!ok) continue;
            removeItem(u, ir);
            this.g.gold += price;
            audio.sfx('gold');
            yield* sayKeep(`Sold the ${it.name} for ${price} gold.`);
          }
          yield* sayKeep('Anything else?');
        }
      }
      yield* sayKeep('Come again!');
    } finally {
      this.showGold = false;
      closeDialog();
    }
  }

  *church(): Co<void> {
    this.g.lastChurch = { location: this.loc.id, x: this.player.x, y: this.player.y };
    this.showGold = true;
    try {
      yield* sayKeep('Welcome to the church. What do you seek?');
      for (;;) {
        const dead = this.g.force.filter((u) => !u.alive);
        const cursed = this.g.force.filter((u) => u.poison || (weaponOf(u)?.cursed ?? false) || (ringOf(u)?.cursed ?? false));
        const promo = this.g.force.filter((u) => canPromote(u));
        const r = yield* choose([
          { label: 'Save' },
          { label: 'Revive', disabled: dead.length === 0 },
          { label: 'Cure', disabled: cursed.length === 0 },
          { label: 'Promote', disabled: promo.length === 0 },
          { label: 'Leave' },
        ], { x: W - 100, y: H - 62 - 76 });
        if (r === -1 || r === 4) break;
        if (r === 0) {
          director.save(this.g);
          audio.sfx('heal');
          yield* sayKeep('Your deeds have been recorded. May the light guide you.');
        } else if (r === 1) {
          const items = dead.map((u) => ({ label: `${u.name.padEnd(9)}L${u.level}`, right: `${reviveCost(u)}`, disabled: reviveCost(u) > this.g.gold }));
          const dr = yield* choose(items, { x: 8, y: 8, title: 'Revive whom?' });
          if (dr === -1) continue;
          const u = dead[dr];
          const cost = reviveCost(u);
          if (cost > this.g.gold) { yield* sayKeep('You cannot afford the offering.'); continue; }
          const ok = yield* ask(`Revive ${u.name} for ${cost} gold?`);
          if (!ok) continue;
          this.g.gold -= cost;
          u.alive = true;
          fullHeal(u);
          audio.sfx('levelup');
          yield* sayKeep(`${u.name} has returned to the living!`);
        } else if (r === 2) {
          const items = cursed.map((u) => ({ label: u.name, right: u.poison ? 'PSN 20' : 'CRS 50' }));
          const cr = yield* choose(items, { x: 8, y: 8, title: 'Cure whom?' });
          if (cr === -1) continue;
          const u = cursed[cr];
          const cost = u.poison ? 20 : 50;
          if (cost > this.g.gold) { yield* sayKeep('You cannot afford the offering.'); continue; }
          this.g.gold -= cost;
          if (u.poison) { u.poison = false; yield* sayKeep(`${u.name} was cured of poison.`); }
          else {
            if (weaponOf(u)?.cursed) u.equipWeapon = -1;
            if (ringOf(u)?.cursed) u.equipRing = -1;
            audio.sfx('heal');
            yield* sayKeep(`The curse upon ${u.name} has been lifted.`);
          }
        } else if (r === 3) {
          const items = promo.map((u) => ({ label: `${u.name.padEnd(9)}${unitClass(u).abbr} L${u.level}` }));
          const pr = yield* choose(items, { x: 8, y: 8, title: 'Promote whom?' });
          if (pr === -1) continue;
          const u = promo[pr];
          const ok = yield* ask(`${u.name} will become a ${unitClass(u).promo ? (unitClass(u).promo as string) : ''}. Promote?`);
          if (!ok) continue;
          const msg = promote(u);
          audio.sfx('levelup');
          yield* sayKeep(`${u.name} was promoted! ${msg}`);
        }
      }
      yield* sayKeep('Go in peace.');
    } finally {
      this.showGold = false;
      closeDialog();
    }
  }

  *hq(): Co<void> {
    try {
      yield* sayKeep(`Nova: Welcome back, ${hero(this.g).name}. The force awaits your orders.`);
      for (;;) {
        const r = yield* choose(['Members', 'Items', 'Status', 'Leave'], { x: W - 100, y: H - 62 - 64 });
        if (r === -1 || r === 3) break;
        if (r === 0) yield* this.partyEditor();
        else if (r === 1) yield* this.depot();
        else if (r === 2) {
          const { items, units } = this.memberItems();
          const mr = yield* choose(items, { x: 8, y: 8, title: 'Members', maxRows: 10 });
          if (mr === -1) continue;
          const u = units[mr];
          const w_ = { draw: () => drawFullStatus(u, 60, 40) };
          addWidget(w_);
          yield 1;
          while (!(input.ok() || input.cancel())) yield 1;
          removeWidget(w_);
          yield 1;
        }
      }
      yield* sayKeep('Nova: Take care out there.');
    } finally {
      closeDialog();
    }
  }

  *partyEditor(): Co<void> {
    closeDialog();
    let idx = 0;
    for (;;) {
      const units = this.g.force;
      const items = units.map((u) => {
        const inParty = this.g.party.includes(u.id);
        return { label: `${inParty ? '*' : ' '}${u.name.padEnd(9)}${unitClass(u).abbr.padEnd(5)}L${u.level}`, color: !u.alive ? C.red : inParty ? C.white : C.gray };
      });
      const r = yield* choose(items, { x: 8, y: 8, title: `Party ${this.g.party.length}/${MAX_PARTY}  (* = fights)`, maxRows: 12, start: idx, w: 230 });
      if (r === -1) return;
      idx = r;
      const u = units[r];
      if (u.isHero) { audio.sfx('error'); continue; }
      const i = this.g.party.indexOf(u.id);
      if (i >= 0) this.g.party.splice(i, 1);
      else if (this.g.party.length >= MAX_PARTY) { audio.sfx('error'); yield* this.run(['Nova: Only twelve may fight at once.']); }
      else this.g.party.push(u.id);
    }
  }

  *depot(): Co<void> {
    closeDialog();
    for (;;) {
      const r = yield* choose([{ label: 'Withdraw', disabled: this.g.depot.length === 0 }, { label: 'Deposit' }, { label: 'Back' }], { x: 8, y: 8, title: `Storage (${this.g.depot.length})` });
      if (r === -1 || r === 2) return;
      if (r === 0) {
        const ir = yield* choose(this.g.depot.map((id) => ({ label: itemDef(id).name, desc: itemDef(id).desc })), { x: 8, y: 8, title: 'Withdraw what?', showDesc: true, maxRows: 10 });
        if (ir === -1) continue;
        const { items: mi, units } = this.memberItems((m) => m.items.length < MAX_ITEMS);
        if (units.length === 0) { yield* this.run(['Everyone is carrying as much as they can.']); continue; }
        const mr = yield* choose(mi, { x: 120, y: 8, title: 'Give to whom?', maxRows: 10 });
        if (mr === -1) continue;
        const [id] = this.g.depot.splice(ir, 1);
        addItem(units[mr], id);
        audio.sfx('gold');
      } else {
        const { items: mi, units } = this.memberItems((m) => m.items.length > 0);
        if (units.length === 0) continue;
        const mr = yield* choose(mi, { x: 8, y: 8, title: 'Whose items?', maxRows: 10 });
        if (mr === -1) continue;
        const u = units[mr];
        const ir = yield* choose(u.items.map((id, i) => ({ label: itemDef(id).name, right: i === u.equipWeapon || i === u.equipRing ? 'E' : '', disabled: (i === u.equipWeapon || i === u.equipRing) && !!itemDef(id).cursed })), { x: 120, y: 8, title: 'Store what?' });
        if (ir === -1) continue;
        const id = removeItem(u, ir)!;
        this.g.depot.push(id);
        audio.sfx('gold');
      }
    }
  }

  *inn(price: number): Co<void> {
    const ok = yield* ask(`A room is ${price} gold. Will you stay?`);
    if (!ok) { yield* sayKeep('Come back any time.'); return; }
    if (this.g.gold < price) { yield* sayKeep("You don't have enough gold."); return; }
    this.g.gold -= price;
    closeDialog();
    yield* fadeOut(20);
    for (const u of this.g.force) if (u.alive) fullHeal(u);
    audio.sfx('heal');
    yield 30;
    yield* fadeIn(20);
    yield* sayKeep('Good morning! You look well rested.');
  }

  // ---- update ------------------------------------------------------------------------

  tryExit(): void {
    const p = this.player;
    for (const e of this.loc.exits) {
      if (p.x >= e.x && p.x < e.x + (e.w ?? 1) && p.y >= e.y && p.y < e.y + (e.h ?? 1)) {
        if (e.cond && !e.cond(this.g)) {
          const back = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[p.dir];
          this.runner.start(this.blockedExit(e.blockText ?? 'You cannot go this way yet.', back[0], back[1]));
          return;
        }
        this.runner.start(this.goTo(e.dest(this.g)));
        return;
      }
    }
  }

  *blockedExit(txt: string, dx: number, dy: number): Co<void> {
    yield* this.run([txt]);
    const p = this.player;
    if (this.walkable(p.x + dx, p.y + dy, 'player')) {
      p.tx = p.x + dx;
      p.ty = p.y + dy;
      p.moving = true;
      p.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      while (p.moving) yield 1;
    }
  }

  stepMover(m: Mover): boolean {
    if (!m.moving) return false;
    const tx = m.tx * TILE, ty = m.ty * TILE;
    if (m.px < tx) m.px = Math.min(tx, m.px + SPEED);
    if (m.px > tx) m.px = Math.max(tx, m.px - SPEED);
    if (m.py < ty) m.py = Math.min(ty, m.py + SPEED);
    if (m.py > ty) m.py = Math.max(ty, m.py - SPEED);
    if (m.px === tx && m.py === ty) {
      m.x = m.tx;
      m.y = m.ty;
      m.moving = false;
      return true;
    }
    return false;
  }

  update(): void {
    this.frame++;
    const busy = !this.runner.done;
    if (busy) this.runner.update();
    const p = this.player;
    // player movement
    const arrived = this.stepMover(p);
    if (arrived) {
      this.g.px = p.x;
      this.g.py = p.y;
      this.g.pdir = p.dir;
      if (!busy) this.tryExit();
    }
    if (!busy && this.runner.done && !p.moving) {
      const d = input.heldDir() as Dir | null;
      if (d) {
        p.dir = d;
        const nx = p.x + (d === 'right' ? 1 : d === 'left' ? -1 : 0);
        const ny = p.y + (d === 'down' ? 1 : d === 'up' ? -1 : 0);
        if (this.walkable(nx, ny, 'player')) {
          p.tx = nx;
          p.ty = ny;
          p.moving = true;
        }
      } else if (input.ok()) {
        this.runner.start(this.interact());
      } else if (input.pressed('c') || input.cancel()) {
        this.runner.start(this.fieldMenu());
      }
    }
    // npc wander
    for (const n of this.npcs) {
      this.stepMover(n.m);
      if (!n.def.wander || n.m.moving) continue;
      if (--n.wanderT > 0) continue;
      n.wanderT = rng.int(60, 180);
      const dirs: Dir[] = ['up', 'down', 'left', 'right'];
      const d = rng.pick(dirs);
      const nx = n.m.x + (d === 'right' ? 1 : d === 'left' ? -1 : 0);
      const ny = n.m.y + (d === 'down' ? 1 : d === 'up' ? -1 : 0);
      n.m.dir = d;
      if (Math.abs(nx - n.def.x) > 2 || Math.abs(ny - n.def.y) > 2) continue;
      if (busy && Math.abs(nx - p.x) + Math.abs(ny - p.y) <= 1) continue;
      if (this.walkable(nx, ny, 'npc')) {
        n.m.tx = nx;
        n.m.ty = ny;
        n.m.moving = true;
      }
    }
    this.updateCam(false);
  }

  updateCam(snap: boolean): void {
    const p = this.player;
    const mw = this.w * TILE, mh = this.h * TILE;
    let tx = p.px + TILE / 2 - W / 2;
    let ty = p.py + TILE / 2 - H / 2;
    if (mw <= W) tx = (mw - W) / 2; else tx = Math.max(0, Math.min(mw - W, tx));
    if (mh <= H) ty = (mh - H) / 2; else ty = Math.max(0, Math.min(mh - H, ty));
    if (snap) { this.cam.x = tx; this.cam.y = ty; return; }
    this.cam.x += (tx - this.cam.x) * 0.3;
    this.cam.y += (ty - this.cam.y) * 0.3;
    if (Math.abs(tx - this.cam.x) < 0.5) this.cam.x = tx;
    if (Math.abs(ty - this.cam.y) < 0.5) this.cam.y = ty;
  }

  draw(): void {
    if (this.card) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const a = Math.min(1, this.card.t / 30);
      ctx.globalAlpha = a;
      textCenter(this.card.title, W / 2, 96, C.yellow);
      textCenter(this.card.sub, W / 2, 120, C.white);
      ctx.globalAlpha = 1;
      return;
    }
    const camX = Math.round(this.cam.x), camY = Math.round(this.cam.y);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const wf = Math.floor(this.frame / 30) % 2;
    const x0 = Math.max(0, Math.floor(camX / TILE)), y0 = Math.max(0, Math.floor(camY / TILE));
    for (let y = y0; y <= Math.min(this.h - 1, y0 + H / TILE + 1); y++) {
      for (let x = x0; x <= Math.min(this.w - 1, x0 + W / TILE + 1); x++) {
        ctx.drawImage(tile(this.at(x, y), wf), x * TILE - camX, y * TILE - camY);
      }
    }
    for (const c of this.loc.chests ?? []) {
      ctx.drawImage(chestSprite(!!this.g.openedChests[`${this.loc.id}:${c.x},${c.y}`]), c.x * TILE - camX, c.y * TILE - camY);
    }
    const af = Math.floor(this.frame / 16) % 2;
    const drawables: { y: number; draw: () => void }[] = [];
    for (const n of this.npcs) {
      const m = n.m;
      const f = m.moving ? Math.floor(this.frame / 6) % 2 : af;
      drawables.push({ y: m.py, draw: () => ctx.drawImage(unitSprite(n.def.sprite, m.dir, f), Math.round(m.px - camX), Math.round(m.py - camY)) });
    }
    const p = this.player;
    const pf = p.moving ? Math.floor(this.frame / 6) % 2 : af;
    drawables.push({ y: p.py, draw: () => ctx.drawImage(unitSprite(hero(this.g).sprite, p.dir, pf), Math.round(p.px - camX), Math.round(p.py - camY)) });
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();
    if (this.showGold) {
      const s = `${this.g.gold} G`;
      win(W - 16 - s.length * CH - 16, 8, s.length * CH + 16, 20);
      textRight(s, W - 24, 14, C.yellow);
    }
    drawWidgets();
  }
}

