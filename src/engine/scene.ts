import { Runner, type Co } from './co';
import { W, H } from './canvas';
import { ctx } from './canvas';

export interface Scene {
  /** stable identifier (class names are minified in production) */
  kind?: string;
  /** When true the scene below is drawn first (for overlays). */
  transparent?: boolean;
  enter?(): void;
  exit?(): void;
  update(): void;
  draw(): void;
}

class SceneManager {
  stack: Scene[] = [];
  get top(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }
  push(s: Scene): void {
    this.stack.push(s);
    s.enter?.();
  }
  pop(): Scene | undefined {
    const s = this.stack.pop();
    s?.exit?.();
    return s;
  }
  replace(s: Scene): void {
    while (this.stack.length) this.pop();
    this.push(s);
  }
  update(): void {
    this.top?.update();
  }
  draw(): void {
    // find first non-transparent from top
    let i = this.stack.length - 1;
    while (i > 0 && this.stack[i].transparent) i--;
    for (; i < this.stack.length; i++) this.stack[i].draw();
  }
}

export const scenes = new SceneManager();

/** Screen fade overlay, drawn after all scenes. */
export const fade = {
  alpha: 0,
  color: '#000',
  runner: new Runner(),
  draw(): void {
    if (this.alpha <= 0) return;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.min(1, this.alpha);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  },
};

export function* fadeOut(frames = 20, color = '#000'): Co<void> {
  fade.color = color;
  for (let i = 1; i <= frames; i++) {
    fade.alpha = i / frames;
    yield 1;
  }
  fade.alpha = 1;
}

export function* fadeIn(frames = 20): Co<void> {
  for (let i = frames - 1; i >= 0; i--) {
    fade.alpha = i / frames;
    yield 1;
  }
  fade.alpha = 0;
}

/** Flash the screen white briefly (hits, spells). */
export function* flash(frames = 4, color = '#fff'): Co<void> {
  const prev = fade.color;
  fade.color = color;
  fade.alpha = 0.8;
  yield frames;
  fade.alpha = 0;
  fade.color = prev;
}
