import { ctx, canvas, toggleFullscreen } from './engine/canvas';
import { input, hooks } from './engine/input';
import { audio } from './engine/audio';
import { scenes, fade } from './engine/scene';
import { setFontReady } from './engine/gfx';
import { saveJSON } from './engine/save';
import { SONGS } from './game/data/music';
import { director } from './game/director';
import { FieldScene } from './game/field/fieldScene';
import { BattleScene } from './game/battle/battleScene';
import { TitleScene } from './game/scenes/title';
import { EndingScene } from './game/scenes/ending';
import { BATTLES } from './game/data/battles';
import './game/data/content';
import type { GameState } from './game/types';
import { newGame, joinForce } from './game/state';
import { LOCATIONS } from './game/data/locations';
import { CHARACTERS } from './game/data/characters';
import { ENEMIES } from './game/data/enemies';
import { SPELLS } from './game/data/spells';
import { unitSprite } from './game/sprites';
import type { SpriteSpec, Dir } from './game/types';
import { widgets, dialog } from './game/ui';
import { BASE, BACKDROP_IDS, MUSIC_IDS, preloadImages } from './engine/assets';

let current: GameState | null = null;

audio.register(SONGS);
audio.registerStreams(Object.fromEntries(MUSIC_IDS.map((id) => [id, `${BASE}music/${id}.mp3`])));
audio.init();
audio.preloadStreams(['title', 'opening', 'town', 'battle']);
preloadImages(BACKDROP_IDS);
director.enterLocation = (g, loc, x, y, dir) => {
  current = g;
  scenes.replace(new FieldScene(g, loc, x, y, dir));
};
director.startBattle = (g, id) => {
  current = g;
  const def = BATTLES[id];
  if (!def) throw new Error('Unknown battle ' + id);
  scenes.replace(new BattleScene(g, def));
};
director.title = () => {
  current = null;
  scenes.replace(new TitleScene());
};
director.ending = (g) => {
  current = g;
  scenes.replace(new EndingScene(g));
};
director.save = (g) => {
  saveJSON(g);
};

const unlock = () => audio.unlock();
window.addEventListener('keydown', unlock);
window.addEventListener('pointerdown', unlock);
window.addEventListener('touchstart', unlock, { passive: true });

hooks.onKey = (code) => {
  if (code === 'KeyM') audio.toggleMute();
  if (code === 'KeyF') toggleFullscreen();
};

let last = performance.now();
let acc = 0;
const STEP = 1000 / 60;
/** Simulation speed multiplier (used by automated tests; 1 = normal). */
export const speed = { value: 1 };
function loop(now: number): void {
  acc += Math.min(100, now - last);
  last = now;
  let steps = 0;
  const maxSteps = 3 * speed.value;
  input.poll();
  while (acc >= STEP && steps < maxSteps) {
    scenes.update();
    input.endFrame();
    acc -= STEP;
    steps++;
  }
  if (speed.value > 1) {
    // fast mode: run extra steps regardless of wall-clock time
    for (let i = 0; i < speed.value - 1; i++) {
      scenes.update();
      input.endFrame();
    }
  }
  scenes.draw();
  fade.draw();
  requestAnimationFrame(loop);
}

async function start(): Promise<void> {
  try {
    await Promise.race([
      document.fonts.load('8px "Press Start 2P"'),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    setFontReady(true);
  } catch { /* fallback font */ }
  ctx.imageSmoothingEnabled = false;
  director.title();
  requestAnimationFrame(loop);
}

// Debug / test hooks (used by the Playwright smoke test and handy in the console).
(window as unknown as { lad: unknown }).lad = {
  scenes,
  input,
  audio,
  director,
  get state() { return current; },
  newGame,
  joinForce,
  LOCATIONS,
  BATTLES,
  CHARACTERS,
  ENEMIES,
  SPELLS,
  /** Render a unit sprite to a data URL (used by the asset pipeline). */
  sprite(spec: SpriteSpec, dir: Dir = 'right', scale = 8): string {
    const src = unitSprite(spec, dir, 0);
    const c = document.createElement('canvas');
    c.width = src.width * scale;
    c.height = src.height * scale;
    const cx = c.getContext('2d')!;
    cx.imageSmoothingEnabled = false;
    cx.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  },
  widgets,
  dialog,
  speed,
  /** Jump straight into a location with a fresh game. */
  warp(loc: string, x: number, y: number) {
    const g = current ?? newGame();
    director.enterLocation(g, loc, x, y, 'down');
  },
  battle(id: string) {
    const g = current ?? newGame();
    director.startBattle(g, id);
  },
  canvas,
};

void start();
