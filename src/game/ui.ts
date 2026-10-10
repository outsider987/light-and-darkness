import { ctx, W, H } from '../engine/canvas';
import { C, CH, text, win, wrap, hand, icon, blit, textCenter } from '../engine/gfx';
import { input } from '../engine/input';
import { audio } from '../engine/audio';
import type { Co } from '../engine/co';
import type { Unit } from './types';
import { unitClass, effAtt, effDef, effAgi, effMov } from './state';
import { ENEMIES } from './data/enemies';

export interface Widget {
  draw(): void;
}

export const widgets: Widget[] = [];
/** Text substitutions applied to every dialog line (the hero's chosen name replaces "Max"). */
export const textVars = { hero: 'Max' };
export function addWidget(w: Widget): void {
  widgets.push(w);
}
export function removeWidget(w: Widget): void {
  const i = widgets.indexOf(w);
  if (i >= 0) widgets.splice(i, 1);
}
export function drawWidgets(): void {
  for (const w of widgets) w.draw();
}
export function clearWidgets(): void {
  widgets.length = 0;
}

// ---- Dialog box ---------------------------------------------------------------

const DLG = { x: 8, y: H - 62, w: W - 16, h: 54, cols: 36, rows: 3 };

class DialogBox implements Widget {
  kind = 'dialog';
  lines: string[] = [];
  shown = 0; // characters revealed
  total = 0;
  waiting = false;
  blink = 0;
  active = false;
  page = 0;
  pages: string[][] = [];

  *say(txt: string): Co<void> {
    this.active = true;
    if (!widgets.includes(this)) addWidget(this);
    if (textVars.hero !== 'Max') txt = txt.replace(/\bMax\b/g, textVars.hero);
    const all = wrap(txt, DLG.cols);
    this.pages = [];
    for (let i = 0; i < all.length; i += DLG.rows) this.pages.push(all.slice(i, i + DLG.rows));
    if (this.pages.length === 0) this.pages.push(['']);
    for (let p = 0; p < this.pages.length; p++) {
      this.lines = this.pages[p];
      this.total = this.lines.reduce((a, l) => a + l.length, 0);
      this.shown = 0;
      this.waiting = false;
      // typewriter
      while (this.shown < this.total) {
        this.shown += input.held('a') || input.held('b') ? 6 : 2;
        if (this.shown % 6 < 2) audio.sfx('text');
        yield 1;
      }
      this.shown = this.total;
      this.waiting = true;
      // wait for confirm (must be a fresh press)
      yield 1;
      while (!(input.pressed('a') || input.pressed('b'))) yield 1;
      audio.sfx('ok');
      this.waiting = false;
    }
    yield 1;
  }

  close(): void {
    this.active = false;
    removeWidget(this);
  }

  draw(): void {
    win(DLG.x, DLG.y, DLG.w, DLG.h);
    let remaining = this.shown;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const n = Math.min(line.length, remaining);
      remaining -= n;
      const part = line.slice(0, n);
      const y = DLG.y + 9 + i * 13;
      // speaker name highlight on first line
      const m = i === 0 ? /^([A-Za-z][A-Za-z' .]{0,14}):\s/.exec(line) : null;
      if (m && n >= m[0].length) {
        text(m[1] + ':', DLG.x + 10, y, C.yellow);
        text(part.slice(m[0].length), DLG.x + 10 + m[0].length * CH, y);
      } else text(part, DLG.x + 10, y);
      if (n < line.length) break;
    }
    this.blink = (this.blink + 1) % 40;
    if (this.waiting && this.blink < 24) {
      ctx.fillStyle = C.white;
      const ax = DLG.x + DLG.w - 14, ay = DLG.y + DLG.h - 10;
      ctx.fillRect(ax, ay, 5, 1); ctx.fillRect(ax + 1, ay + 1, 3, 1); ctx.fillRect(ax + 2, ay + 2, 1, 1);
    }
  }
}

export const dialog = new DialogBox();

/** Show one or more messages, then close the box. */
export function* say(...msgs: string[]): Co<void> {
  for (const m of msgs) yield* dialog.say(m);
  dialog.close();
}
/** Show a message but keep the box open (for chained messages). */
export function* sayKeep(msg: string): Co<void> {
  yield* dialog.say(msg);
}
export function closeDialog(): void {
  dialog.close();
}

// ---- Menus ------------------------------------------------------------------------

export interface MenuItem {
  label: string;
  right?: string;
  color?: string;
  disabled?: boolean;
  desc?: string;
}

export interface MenuOpts {
  x: number;
  y: number;
  w?: number;
  title?: string;
  start?: number;
  cancelable?: boolean;
  /** called when the cursor moves */
  onMove?: (i: number) => void;
  showDesc?: boolean;
  maxRows?: number;
}

export class Menu implements Widget {
  kind = 'menu';
  index: number;
  scroll = 0;
  constructor(public items: MenuItem[], public o: MenuOpts) {
    this.index = Math.min(o.start ?? 0, Math.max(0, items.length - 1));
    o.w ??= Math.max(...items.map((i) => i.label.length + (i.right ? i.right.length + 1 : 0)), o.title?.length ?? 0) * CH + 28;
    o.cancelable ??= true;
    o.maxRows ??= 8;
  }
  get rows(): number {
    return Math.min(this.items.length, this.o.maxRows!);
  }
  get height(): number {
    return this.rows * 12 + 14 + (this.o.title ? 12 : 0);
  }
  *run(): Co<number> {
    addWidget(this);
    this.o.onMove?.(this.index);
    try {
      yield 1;
      for (;;) {
        const d = input.dir();
        if (d === 'up' && this.items.length > 1) {
          this.index = (this.index - 1 + this.items.length) % this.items.length;
          audio.sfx('cursor');
          this.o.onMove?.(this.index);
        } else if (d === 'down' && this.items.length > 1) {
          this.index = (this.index + 1) % this.items.length;
          audio.sfx('cursor');
          this.o.onMove?.(this.index);
        }
        if (this.index < this.scroll) this.scroll = this.index;
        if (this.index >= this.scroll + this.rows) this.scroll = this.index - this.rows + 1;
        if (input.ok()) {
          if (this.items[this.index]?.disabled) audio.sfx('error');
          else {
            audio.sfx('ok');
            return this.index;
          }
        }
        if (input.cancel() && this.o.cancelable) {
          audio.sfx('cancel');
          return -1;
        }
        yield 1;
      }
    } finally {
      removeWidget(this);
    }
  }
  draw(): void {
    const { x, y } = this.o;
    const w = this.o.w!;
    win(x, y, w, this.height);
    let ty = y + 8;
    if (this.o.title) {
      text(this.o.title, x + 10, ty, C.yellow);
      ty += 12;
    }
    for (let r = 0; r < this.rows; r++) {
      const i = this.scroll + r;
      const it = this.items[i];
      if (!it) break;
      const col = it.disabled ? C.gray : it.color ?? C.white;
      text(it.label, x + 18, ty, col);
      if (it.right) text(it.right, x + w - 8 - it.right.length * CH, ty, col);
      if (i === this.index) hand(x + 8, ty, C.white);
      ty += 12;
    }
    if (this.items.length > this.rows) {
      if (this.scroll > 0) text('^', x + w - 12, y + 2, C.yellow);
      if (this.scroll + this.rows < this.items.length) text('v', x + w - 12, y + this.height - 10, C.yellow);
    }
    const d = this.items[this.index]?.desc;
    if (this.o.showDesc && d) {
      win(8, H - 24, W - 16, 18);
      text(d, 16, H - 18);
    }
  }
}

/** Convenience: run a vertical menu and return the chosen index (-1 = cancel). */
export function* choose(items: (string | MenuItem)[], o: MenuOpts): Co<number> {
  const m = new Menu(items.map((i) => (typeof i === 'string' ? { label: i } : i)), o);
  return yield* m.run();
}

/** Yes/No prompt displayed above the dialog box. */
export function* ask(question: string, yes = 'Yes', no = 'No'): Co<boolean> {
  if (question) yield* dialog.say(question);
  const r = yield* choose([yes, no], { x: W - 80, y: H - 62 - 40, cancelable: true });
  dialog.close();
  return r === 0;
}

// ---- Radial (4-icon) menu ----------------------------------------------------------

export interface RadialEntry {
  icon: string;
  label: string;
  disabled?: boolean;
}

export class RadialMenu implements Widget {
  kind = 'radial';
  index = 0;
  constructor(public entries: RadialEntry[], public cx: number, public cy: number) {}
  *run(): Co<number> {
    addWidget(this);
    try {
      yield 1;
      for (;;) {
        const d = input.dir();
        // layout: 0 top, 1 right, 2 bottom, 3 left
        if (d === 'up') { this.index = 0; audio.sfx('cursor'); }
        if (d === 'right') { this.index = 1; audio.sfx('cursor'); }
        if (d === 'down') { this.index = 2; audio.sfx('cursor'); }
        if (d === 'left') { this.index = 3; audio.sfx('cursor'); }
        if (input.ok()) {
          if (this.entries[this.index]?.disabled) audio.sfx('error');
          else {
            audio.sfx('ok');
            return this.index;
          }
        }
        if (input.cancel()) {
          audio.sfx('cancel');
          return -1;
        }
        yield 1;
      }
    } finally {
      removeWidget(this);
    }
  }
  draw(): void {
    const { cx, cy } = this;
    const pos = [[cx - 8, cy - 32], [cx + 16, cy - 8], [cx - 8, cy + 16], [cx - 32, cy - 8]];
    win(cx - 44, cy - 44, 88, 88, C.winBg2);
    for (let i = 0; i < 4; i++) {
      const e = this.entries[i];
      if (!e) continue;
      const [x, y] = pos[i];
      if (i === this.index) {
        ctx.fillStyle = C.yellow;
        ctx.fillRect(x - 2, y - 2, 20, 20);
        ctx.fillStyle = C.winBg;
        ctx.fillRect(x - 1, y - 1, 18, 18);
      }
      ctx.globalAlpha = e.disabled ? 0.35 : 1;
      blit(icon(e.icon), x, y);
      ctx.globalAlpha = 1;
    }
    const lab = this.entries[this.index]?.label ?? '';
    const lw = lab.length * CH + 16;
    win(cx - lw / 2, cy + 48, lw, 20);
    textCenter(lab, cx, cy + 54, C.white);
  }
}

// ---- Unit panels -----------------------------------------------------------------

export function drawUnitPanel(u: Unit, x: number, y: number): void {
  const w = 128, h = 46;
  win(x, y, w, h);
  const cls = u.team === 'force' ? unitClass(u).abbr : (ENEMIES[u.defId ?? u.id]?.abbr ?? 'ENMY');
  text(u.name, x + 8, y + 7, u.team === 'force' ? C.white : C.orange);
  text(`${cls} L${u.level}`, x + w - 8 - (cls.length + 2 + String(u.level).length) * CH, y + 7, C.gray);
  text(`HP ${String(u.hp).padStart(3)}/${String(u.maxHp).padStart(3)}`, x + 8, y + 20, u.hp <= u.maxHp / 4 ? C.red : C.white);
  text(`MP ${String(u.mp).padStart(3)}/${String(u.maxMp).padStart(3)}`, x + 8, y + 32, C.white);
  if (u.poison) text('PSN', x + w - 32, y + 20, C.green);
  if (u.sleep > 0) text('ZZZ', x + w - 32, y + 32, C.cyan);
  if (u.muddle > 0) text('???', x + w - 32, y + 32, C.orange);
}

export function drawFullStatus(u: Unit, x: number, y: number): void {
  const w = 200, h = 150;
  win(x, y, w, h);
  const cls = unitClass(u);
  text(u.name, x + 10, y + 8, C.yellow);
  text(`${cls.abbr}  L${u.level}`, x + 110, y + 8);
  const rows: [string, string][] = [
    ['HP', `${u.hp}/${u.maxHp}`],
    ['MP', `${u.mp}/${u.maxMp}`],
    ['EXP', `${u.exp}`],
    ['ATT', `${effAtt(u)}`],
    ['DEF', `${effDef(u)}`],
    ['AGI', `${effAgi(u)}`],
    ['MOV', `${effMov(u)}`],
  ];
  rows.forEach(([k, v], i) => {
    text(k, x + 10, y + 24 + i * 12, C.gray);
    text(v, x + 50, y + 24 + i * 12);
  });
  text(cls.name, x + 110, y + 24, C.cyan);
  let sy = y + 40;
  text('MAGIC', x + 110, sy, C.gray);
  sy += 12;
  if (u.spells.length === 0) { text('-', x + 110, sy); sy += 12; }
  for (const sp of u.spells.slice(0, 5)) {
    text(`${sp.spell[0].toUpperCase()}${sp.spell.slice(1)} ${sp.level}`, x + 110, sy);
    sy += 12;
  }
  if (u.poison) text('Poisoned', x + 110, y + 118, C.green);
}

/** Small top-left window such as "Land effect 30%". */
export function drawInfoBox(txt: string, x = 8, y = 8): void {
  const w = txt.length * CH + 16;
  win(x, y, w, 20);
  text(txt, x + 8, y + 6);
}

// ---- Name entry (hero naming at the start, as in the original) ------------------

const NAME_ROWS = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', 'abcdefghijklm', 'nopqrstuvwxyz'];

export class NameEntry implements Widget {
  kind = 'name';
  cx = 0;
  cy = 0;
  constructor(public value: string, public maxLen = 8) {}
  *run(): Co<string> {
    addWidget(this);
    try {
      yield 1;
      for (;;) {
        const d = input.dir();
        const cols = NAME_ROWS[0].length;
        const rows = NAME_ROWS.length + 1; // last row: BACK / END
        if (d === 'left') { this.cx = (this.cx - 1 + cols) % cols; audio.sfx('cursor'); }
        if (d === 'right') { this.cx = (this.cx + 1) % cols; audio.sfx('cursor'); }
        if (d === 'up') { this.cy = (this.cy - 1 + rows) % rows; audio.sfx('cursor'); }
        if (d === 'down') { this.cy = (this.cy + 1) % rows; audio.sfx('cursor'); }
        if (input.ok()) {
          if (this.cy === NAME_ROWS.length) {
            if (this.cx < cols / 2) { this.value = this.value.slice(0, -1); audio.sfx('cancel'); }
            else if (this.value.length > 0) { audio.sfx('ok'); return this.value; }
            else audio.sfx('error');
          } else if (this.value.length < this.maxLen) {
            this.value += NAME_ROWS[this.cy][this.cx];
            audio.sfx('ok');
          } else audio.sfx('error');
        }
        if (input.cancel()) { this.value = this.value.slice(0, -1); audio.sfx('cancel'); }
        if (input.pressed('start') && this.value.length > 0) return this.value;
        yield 1;
      }
    } finally {
      removeWidget(this);
    }
  }
  draw(): void {
    const x = 36, y = 40, w = 248, h = 150;
    win(x, y, w, h);
    text('Enter the name of the hero.', x + 12, y + 8, C.yellow);
    const shown = this.value.padEnd(this.maxLen, '_');
    text(shown, x + 12 + 7 * CH, y + 26, C.white);
    const gx = x + 20, gy = y + 48;
    NAME_ROWS.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        const sel = this.cy === r && this.cx === c;
        if (sel) { ctx.fillStyle = C.yellow; ctx.fillRect(gx + c * 16 - 2, gy + r * 16 - 2, 12, 12); }
        text(row[c], gx + c * 16, gy + r * 16, sel ? C.black : C.white, !sel);
      }
    });
    const lr = NAME_ROWS.length;
    const back = this.cy === lr && this.cx < NAME_ROWS[0].length / 2;
    const end = this.cy === lr && !back;
    text('BACK', gx, gy + lr * 16 + 4, back ? C.yellow : C.white);
    text('END', gx + 7 * 16, gy + lr * 16 + 4, end ? C.yellow : C.white);
    if (this.cy === lr) hand(back ? gx - 10 : gx + 7 * 16 - 10, gy + lr * 16 + 4);
  }
}
