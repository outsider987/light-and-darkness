import { ctx, W, H } from '../../engine/canvas';
import { input } from '../../engine/input';
import { audio } from '../../engine/audio';
import { Runner, type Co } from '../../engine/co';
import { fade, fadeIn, fadeOut, type Scene } from '../../engine/scene';
import { C, textCenter } from '../../engine/gfx';
import type { GameState } from '../types';
import { unitSprite } from '../sprites';
import { unitClass } from '../state';
import { director } from '../director';

export class EndingScene implements Scene {
  kind = 'ending';
  runner = new Runner();
  frame = 0;
  scroll = 0;
  lines: { txt: string; color?: string }[] = [];
  done = false;

  constructor(public g: GameState) {}

  enter(): void {
    const g = this.g;
    const L = this.lines;
    L.push({ txt: 'The Dark Dragon has been sealed', color: C.yellow });
    L.push({ txt: 'once more, and light returns', color: C.yellow });
    L.push({ txt: 'to the land of Rune.', color: C.yellow });
    L.push({ txt: '' });
    L.push({ txt: 'The Shining Force disbands,' });
    L.push({ txt: 'each hero returning home,' });
    L.push({ txt: 'their names remembered forever.' });
    L.push({ txt: '' });
    L.push({ txt: '' });
    for (const u of g.force) {
      L.push({ txt: `${u.name}  the ${unitClass(u).name}`, color: u.alive ? C.white : C.gray });
      L.push({ txt: `  Level ${u.level}${u.promoted ? ' (promoted)' : ''}` , color: C.gray });
      L.push({ txt: '' });
    }
    L.push({ txt: '' });
    L.push({ txt: `Battles won: ${g.battlesWon}`, color: C.cyan });
    L.push({ txt: `Gold remaining: ${g.gold}`, color: C.cyan });
    L.push({ txt: '' });
    L.push({ txt: '' });
    L.push({ txt: 'LIGHT AND DARKNESS', color: C.yellow });
    L.push({ txt: 'a fan remake of Shining Force' });
    L.push({ txt: '' });
    L.push({ txt: 'Original game (c) SEGA 1992' });
    L.push({ txt: 'This remake uses no original assets.' });
    L.push({ txt: '' });
    L.push({ txt: '' });
    L.push({ txt: 'THE END', color: C.yellow });
    fade.alpha = 1;
    this.runner.start(this.flow());
  }

  *flow(): Co<void> {
    audio.play('ending');
    yield* fadeIn(40);
    const total = this.lines.length * 14 + H;
    while (this.scroll < total - H + 40) {
      this.scroll += input.held('a') ? 2 : 0.5;
      yield 1;
    }
    this.done = true;
    yield 60;
    while (!input.ok()) yield 1;
    yield* fadeOut(40);
    director.title();
  }

  update(): void {
    this.frame++;
    this.runner.update();
  }

  draw(): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) {
      const sx = (i * 101 + 17) % W, sy = (i * 61 + 11 + Math.floor(this.frame / 4)) % H;
      ctx.fillStyle = (this.frame + i) % 50 < 25 ? '#f8f8f8' : '#607090';
      ctx.fillRect(sx, sy, 1, 1);
    }
    let y = H - Math.floor(this.scroll);
    for (const l of this.lines) {
      if (y > -14 && y < H) textCenter(l.txt, W / 2, y, l.color ?? C.white);
      y += 14;
    }
    const ids = this.g.force.filter((u) => u.alive).slice(0, 12);
    const af = Math.floor(this.frame / 12) % 2;
    ids.forEach((u, i) => {
      const x = ((this.frame * 0.4 + i * 30) % (W + 40)) - 20;
      ctx.drawImage(unitSprite(u.sprite, 'right', af), Math.round(x), H - 30);
    });
  }
}
