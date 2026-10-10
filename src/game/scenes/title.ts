import { ctx, W, H } from '../../engine/canvas';
import { input } from '../../engine/input';
import { audio } from '../../engine/audio';
import { Runner, type Co } from '../../engine/co';
import { fade, fadeIn, fadeOut, type Scene } from '../../engine/scene';
import { C, text, textCenter, win, hand, FONT } from '../../engine/gfx';
import { loadJSON, hasSave } from '../../engine/save';
import type { GameState } from '../types';
import { newGame, SAVE_VERSION } from '../state';
import { CHAPTERS } from '../data/chapters';
import { director } from '../director';
import { unitSprite } from '../sprites';
import { CHARACTERS } from '../data/characters';
import { image } from '../../engine/assets';

const OPENING = [
  'Long ago, the forces of Light and Darkness',
  'fought a war that shook the world of Rune.',
  '',
  'The Dark Dragon was sealed away by the',
  'Ancients, and peace returned to the land.',
  '',
  'A thousand years have passed.',
  '',
  'Now the kingdom of Runefaust marches',
  'across the land, seeking the Gate of',
  'the Ancients to awaken the Dark Dragon...',
  '',
  'In the small kingdom of Guardiana,',
  'a young swordsman is about to begin',
  'a journey that will decide the fate',
  'of Light and Darkness.',
];

export class TitleScene implements Scene {
  kind = 'title';
  runner = new Runner();
  index = 0;
  frame = 0;
  menuOn = false;
  canContinue = false;
  openingLines: string[] = [];
  mode: 'title' | 'opening' = 'title';

  enter(): void {
    this.canContinue = hasSave();
    this.index = this.canContinue ? 1 : 0;
    fade.alpha = 1;
    this.runner.start(this.flow());
  }

  *flow(): Co<void> {
    audio.play('title');
    yield* fadeIn(30);
    this.menuOn = true;
    for (;;) {
      const d = input.dir();
      if (d === 'up' || d === 'down') {
        this.index = this.index === 0 ? 1 : 0;
        audio.sfx('cursor');
      }
      if (input.ok() || input.pressed('start')) {
        if (this.index === 1 && !this.canContinue) {
          audio.sfx('error');
        } else {
          audio.sfx('ok');
          break;
        }
      }
      yield 1;
    }
    this.menuOn = false;
    if (this.index === 1) {
      const g = loadJSON<GameState>();
      if (g && g.version === SAVE_VERSION) {
        yield* fadeOut(20);
        director.enterLocation(g, g.location, g.px, g.py, g.pdir);
        return;
      }
    }
    yield* this.opening();
  }

  *opening(): Co<void> {
    yield* fadeOut(30);
    audio.play('opening');
    this.mode = 'opening';
    fade.alpha = 0;
    for (const line of OPENING) {
      this.openingLines.push(line);
      if (this.openingLines.length > 8) this.openingLines.shift();
      for (let i = 0; i < (line ? 50 : 20); i++) {
        if (input.ok() && i > 4) break;
        yield 1;
      }
    }
    yield 40;
    yield* fadeOut(30);
    const g = newGame();
    const ch = CHAPTERS[0];
    director.enterLocation(g, ch.start.location, ch.start.x, ch.start.y, 'up');
  }

  update(): void {
    this.frame++;
    this.runner.update();
  }

  draw(): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (this.mode === 'opening') {
      const art = image('title');
      if (art) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(art, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      let y = 70;
      for (const l of this.openingLines) {
        textCenter(l, W / 2, y, C.white);
        y += 14;
      }
      return;
    }
    const art = image('title');
    if (art) {
      ctx.drawImage(art, 0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 36, W, 64);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 196, W, 44);
    } else {
      // night sky gradient with stars
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgb(${8 + i * 2},${10 + i * 3},${40 + i * 6})`;
        ctx.fillRect(0, i * 20, W, 20);
      }
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + 13) % W, sy = (i * 53 + 7) % 150;
        const tw = (this.frame + i * 7) % 60 < 30;
        ctx.fillStyle = tw ? '#f8f8f8' : '#8090c0';
        ctx.fillRect(sx, sy, 1, 1);
      }
      // ground
      ctx.fillStyle = '#183018';
      ctx.fillRect(0, 196, W, 44);
      ctx.fillStyle = '#204020';
      ctx.fillRect(0, 196, W, 2);
    }
    // logo
    ctx.font = '16px "Press Start 2P", "Courier New", monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    const title = 'SHINING FORCE';
    for (let i = 3; i > 0; i--) {
      ctx.fillStyle = i === 1 ? '#a05010' : '#000';
      ctx.fillText(title, W / 2 + i, 44 + i);
    }
    const g = ctx.createLinearGradient(0, 44, 0, 60);
    g.addColorStop(0, '#fff8c0');
    g.addColorStop(0.5, '#f8d040');
    g.addColorStop(1, '#f09020');
    ctx.fillStyle = g;
    ctx.fillText(title, W / 2, 44);
    ctx.font = FONT;
    ctx.textAlign = 'left';
    textCenter('LIGHT AND DARKNESS', W / 2, 72, C.cyan);
    ctx.font = '12px "Press Start 2P", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = C.white;
    ctx.fillText('光 明 與 黑 暗', W / 2, 90);
    ctx.font = FONT;
    ctx.textAlign = 'left';
    // the force marching
    const ids = ['max', 'lowe', 'ken', 'tao', 'hans', 'luke', 'gong', 'mae', 'gort', 'anri', 'zylo', 'balbaroy'];
    const af = Math.floor(this.frame / 12) % 2;
    ids.forEach((id, i) => {
      const x = ((this.frame * 0.5 + i * 36) % (W + 40)) - 20;
      ctx.drawImage(unitSprite(CHARACTERS[id].sprite, 'right', af), Math.round(x), 174);
    });
    if (this.menuOn) {
      win(W / 2 - 60, 120, 120, 44);
      text('New Game', W / 2 - 40, 128, C.white);
      text('Continue', W / 2 - 40, 144, this.canContinue ? C.white : C.gray);
      if (Math.floor(this.frame / 8) % 2 === 0) hand(W / 2 - 52, 128 + this.index * 16);
    }
    textCenter('A fan remake - not affiliated with SEGA', W / 2, 226, '#607080', false);
  }
}
