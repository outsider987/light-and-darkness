import { cached, paintPixels } from '../engine/gfx';
import { TILE } from '../engine/canvas';

type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string): void => {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
};
// deterministic pseudo-random per tile pixel
const h2 = (x: number, y: number, s: number): number => {
  let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

function grass(c: Ctx, base = '#78c050', dot = '#5ca840', seed = 1): void {
  R(c, 0, 0, TILE, TILE, base);
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(h2(i, 3, seed) * TILE);
    const y = Math.floor(h2(i, 7, seed) * TILE);
    R(c, x, y, 2, 1, dot);
  }
}
function floor(c: Ctx, base = '#c8c0b0', grout = '#a8a098'): void {
  R(c, 0, 0, TILE, TILE, base);
  R(c, 0, 11, TILE, 1, grout);
  R(c, 0, 23, TILE, 1, grout);
  R(c, 11, 0, 1, 12, grout);
  R(c, 5, 12, 1, 12, grout);
  R(c, 17, 12, 1, 12, grout);
  R(c, 23, 0, 1, 12, grout);
}
function water(c: Ctx, frame: number, base = '#3060d0', wave = '#70a8f8'): void {
  R(c, 0, 0, TILE, TILE, base);
  const off = frame ? 4 : 0;
  R(c, (2 + off) % 24, 5, 6, 1, wave);
  R(c, (14 + off) % 24, 12, 6, 1, wave);
  R(c, (6 + off) % 24, 19, 6, 1, wave);
  R(c, (18 + off) % 24, 2, 4, 1, '#2850b8');
}
function wall(c: Ctx, base = '#8c8c94', mortar = '#5c5c64'): void {
  R(c, 0, 0, TILE, TILE, base);
  for (let y = 0; y < TILE; y += 6) {
    R(c, 0, y + 5, TILE, 1, mortar);
    const off = (y / 6) % 2 ? 6 : 0;
    for (let x = off; x < TILE; x += 12) R(c, x, y, 1, 5, mortar);
  }
  R(c, 0, 0, TILE, 1, '#a8a8b0');
}

const painters: Record<string, (c: Ctx, frame: number) => void> = {
  '.': (c) => grass(c),
  '*': (c) => {
    grass(c, '#80c858', '#60a848', 5);
    R(c, 4, 6, 2, 2, '#f84848'); R(c, 14, 14, 2, 2, '#f8e048'); R(c, 18, 4, 2, 2, '#f8f8f8'); R(c, 8, 17, 2, 2, '#f890d0');
  },
  ',': (c) => {
    R(c, 0, 0, TILE, TILE, '#d8b878');
    for (let i = 0; i < 8; i++) R(c, Math.floor(h2(i, 1, 9) * 24), Math.floor(h2(i, 2, 9) * 24), 2, 1, '#c0a060');
  },
  's': (c) => {
    R(c, 0, 0, TILE, TILE, '#b8b0a0');
    for (let y = 0; y < 24; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 24; x += 8) R(c, x + 1, y + 1, 6, 6, '#c8c0b0');
  },
  ':': (c) => {
    R(c, 0, 0, TILE, TILE, '#e8d8a0');
    for (let i = 0; i < 10; i++) R(c, Math.floor(h2(i, 4, 3) * 24), Math.floor(h2(i, 5, 3) * 24), 1, 1, '#d0b878');
  },
  'd': (c) => {
    R(c, 0, 0, TILE, TILE, '#a89060');
    for (let i = 0; i < 8; i++) R(c, Math.floor(h2(i, 4, 8) * 24), Math.floor(h2(i, 5, 8) * 24), 3, 1, '#8c7848');
  },
  'T': (c) => {
    grass(c);
    R(c, 10, 15, 4, 7, '#6a4020');
    R(c, 4, 4, 16, 12, '#2c8030');
    R(c, 6, 2, 12, 2, '#2c8030');
    R(c, 2, 6, 2, 8, '#2c8030'); R(c, 20, 6, 2, 8, '#2c8030');
    R(c, 6, 4, 6, 3, '#48a840'); R(c, 8, 2, 4, 2, '#48a840');
    R(c, 6, 13, 12, 2, '#1c6020');
  },
  'Y': (c) => {
    R(c, 0, 0, TILE, TILE, '#8c7858');
    R(c, 11, 8, 3, 14, '#504038');
    R(c, 6, 6, 5, 2, '#504038'); R(c, 14, 4, 5, 2, '#504038'); R(c, 4, 4, 2, 2, '#504038'); R(c, 18, 2, 2, 2, '#504038');
    R(c, 11, 3, 2, 5, '#504038');
  },
  't': (c) => {
    grass(c);
    R(c, 5, 9, 14, 10, '#3c9038'); R(c, 7, 7, 10, 2, '#3c9038');
    R(c, 7, 9, 5, 3, '#58b848');
  },
  '^': (c) => {
    grass(c, '#88b858', '#70a048', 2);
    R(c, 1, 12, 14, 9, '#a08850'); R(c, 3, 10, 10, 2, '#a08850');
    R(c, 3, 11, 6, 2, '#c0a868');
    R(c, 12, 15, 11, 7, '#98804a'); R(c, 14, 13, 7, 2, '#98804a');
    R(c, 14, 14, 4, 2, '#b89c60');
  },
  'M': (c) => {
    R(c, 0, 0, TILE, TILE, '#787068');
    R(c, 2, 20, 20, 4, '#686058');
    for (let i = 0; i < 10; i++) R(c, 11 - i, 4 + i * 2, 2 + i * 2, 2, '#9c9488');
    for (let i = 0; i < 4; i++) R(c, 11 - i, 2 + i * 2, 2 + i * 2, 2, '#f0f0f8');
    for (let i = 0; i < 10; i++) R(c, 12 + i, 4 + i * 2, 1, 2, '#5c5450');
  },
  '~': (c, f) => water(c, f),
  'w': (c, f) => water(c, f, '#60a0e0', '#a0d0ff'),
  'v': (c, f) => {
    R(c, 0, 0, TILE, TILE, '#d83810');
    const o = f ? 3 : 0;
    R(c, 3 + o, 4, 6, 3, '#f8a020'); R(c, 13 - o, 12, 7, 3, '#f8c030'); R(c, 6 + o, 18, 5, 2, '#f8a020');
  },
  '=': (c, f) => {
    water(c, f);
    R(c, 2, 0, 20, TILE, '#a07040');
    for (let y = 0; y < 24; y += 4) R(c, 2, y + 3, 20, 1, '#704820');
    R(c, 2, 0, 2, TILE, '#c09060'); R(c, 20, 0, 2, TILE, '#c09060');
  },
  'B': (c) => {
    R(c, 0, 0, TILE, TILE, '#a07848');
    for (let y = 0; y < 24; y += 6) R(c, 0, y + 5, 24, 1, '#705030');
    R(c, 8, 0, 1, 5, '#705030'); R(c, 16, 6, 1, 5, '#705030'); R(c, 4, 12, 1, 5, '#705030'); R(c, 20, 18, 1, 5, '#705030');
  },
  '#': (c) => wall(c),
  'F': (c) => floor(c),
  'g': (c) => floor(c, '#a0c8d8', '#80a8b8'),
  'r': (c) => {
    floor(c, '#9a9488', '#78726a');
    R(c, 3, 4, 6, 1, '#605a52'); R(c, 8, 4, 1, 5, '#605a52'); R(c, 15, 15, 1, 6, '#605a52'); R(c, 15, 20, 5, 1, '#605a52');
    R(c, 18, 6, 3, 3, '#6a8858');
  },
  'C': (c) => {
    R(c, 0, 0, TILE, TILE, '#b02828');
    R(c, 0, 0, TILE, 2, '#e0b040'); R(c, 0, 22, TILE, 2, '#e0b040');
    R(c, 10, 10, 4, 4, '#d04040');
  },
  'D': (c) => {
    floor(c);
    R(c, 4, 0, 16, 22, '#6a4020');
    R(c, 6, 2, 12, 20, '#8a5a30');
    R(c, 11, 2, 2, 20, '#6a4020');
    R(c, 9, 11, 1, 2, '#f8d020'); R(c, 14, 11, 1, 2, '#f8d020');
  },
  'S': (c) => {
    floor(c);
    for (let y = 2; y < 24; y += 5) { R(c, 2, y, 20, 4, '#b0a898'); R(c, 2, y + 4, 20, 1, '#706860'); }
  },
  'R': (c) => {
    R(c, 0, 0, TILE, TILE, '#b04030');
    for (let y = 0; y < 24; y += 6) {
      R(c, 0, y + 5, 24, 1, '#7a2818');
      const off = (y / 6) % 2 ? 6 : 0;
      for (let x = off; x < 24; x += 12) R(c, x, y, 1, 5, '#7a2818');
      R(c, off + 2, y + 1, 4, 1, '#d06048');
    }
  },
  'c': (c) => {
    floor(c);
    R(c, 0, 4, TILE, 14, '#a07040');
    R(c, 0, 4, TILE, 2, '#c09060');
    R(c, 0, 16, TILE, 2, '#704820');
  },
  '+': (c) => {
    floor(c);
    R(c, 7, 0, 10, 24, '#d0d0d8'); R(c, 7, 0, 3, 24, '#f0f0f8'); R(c, 14, 0, 3, 24, '#a0a0a8');
    R(c, 5, 0, 14, 2, '#e8e8f0'); R(c, 5, 22, 14, 2, '#b0b0b8');
  },
  '|': (c) => {
    floor(c);
    R(c, 9, 0, 6, 24, '#c8c8d0'); R(c, 9, 0, 2, 24, '#e8e8f0'); R(c, 13, 0, 2, 24, '#909098');
  },
  '%': (c) => {
    grass(c);
    R(c, 0, 8, TILE, 2, '#a07848'); R(c, 0, 15, TILE, 2, '#a07848');
    R(c, 3, 5, 3, 14, '#8a6038'); R(c, 18, 5, 3, 14, '#8a6038');
  },
  'b': (c) => {
    floor(c);
    R(c, 3, 1, 18, 22, '#7a5030');
    R(c, 5, 3, 14, 18, '#e8e8f0');
    R(c, 5, 3, 14, 5, '#f8f8ff'); R(c, 7, 4, 10, 3, '#d8d8e8');
    R(c, 5, 9, 14, 12, '#5070d0');
  },
  'k': (c) => {
    R(c, 0, 0, TILE, TILE, '#8a5a30');
    R(c, 2, 2, 20, 20, '#6a4020');
    const cols = ['#d04040', '#4070d0', '#40b050', '#e0b040', '#c060c0'];
    for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) R(c, 3 + i * 4, 3 + row * 10, 3, 8, cols[(i + row) % 5]);
  },
  'x': (c) => {
    floor(c);
    R(c, 2, 4, 20, 14, '#a07040'); R(c, 2, 4, 20, 2, '#c09060');
    R(c, 3, 18, 3, 4, '#704820'); R(c, 18, 18, 3, 4, '#704820');
  },
  'o': (c) => {
    grass(c);
    R(c, 4, 8, 16, 12, '#808088'); R(c, 6, 6, 12, 2, '#808088');
    R(c, 6, 8, 6, 4, '#a8a8b0'); R(c, 6, 18, 14, 2, '#585860');
  },
  'W': (c) => {
    grass(c, '#6a9050', '#587840', 4);
    R(c, 7, 4, 10, 18, '#a0a0a8'); R(c, 8, 2, 8, 2, '#a0a0a8');
    R(c, 11, 6, 2, 10, '#606068'); R(c, 8, 9, 8, 2, '#606068');
  },
  'a': (c) => {
    floor(c);
    R(c, 2, 8, 20, 14, '#e0d8c0'); R(c, 2, 8, 20, 2, '#f8f0e0');
    R(c, 11, 1, 2, 7, '#f8d020'); R(c, 9, 3, 6, 2, '#f8d020');
    R(c, 4, 4, 2, 4, '#f8f8f8'); R(c, 18, 4, 2, 4, '#f8f8f8'); R(c, 4, 3, 2, 1, '#f8a020'); R(c, 18, 3, 2, 1, '#f8a020');
  },
  'G': (c) => {
    floor(c, '#9a9488', '#78726a');
    for (let x = 2; x < 24; x += 5) R(c, x, 0, 2, 24, '#404048');
    R(c, 0, 4, 24, 2, '#404048'); R(c, 0, 18, 24, 2, '#404048');
  },
  'h': (c) => {
    R(c, 0, 0, TILE, TILE, '#101010');
    R(c, 0, 0, TILE, 2, '#484040');
  },
  '_': (c) => R(c, 0, 0, TILE, TILE, '#000000'),
};

export function tile(ch: string, frame = 0): HTMLCanvasElement {
  const p = painters[ch] ?? painters['.'];
  return cached(`tile:${ch}:${frame}`, TILE, TILE, (c) => p(c, frame));
}

/** Treasure chest overlay */
export function chestSprite(open: boolean): HTMLCanvasElement {
  return cached(`chest:${open}`, TILE, TILE, (c) => {
    const rows = open
      ? [
        '........................', '........................', '........................', '........................',
        '........................', '....bbbbbbbbbbbbbbbb....', '...byyyyyyyyyyyyyyyyb...', '...byyyyyyyyyyyyyyyyb...',
        '...bbbbbbbbbbbbbbbbbb...', '...bhhhhhhhhhhhhhhhhb...', '...bhhhhhhhhhhhhhhhhb...', '...bbbbbbbbbbbbbbbbbb...',
        '...booooooooyyoooooob...', '...booooooooyyoooooob...', '...boooooooooooooooob...', '...boooooooooooooooob...',
        '...boooooooooooooooob...', '...boooooooooooooooob...', '...bbbbbbbbbbbbbbbbbb...', '........................',
        '........................', '........................', '........................', '........................',
      ]
      : [
        '........................', '........................', '........................', '........................',
        '........................', '........................', '........................', '....bbbbbbbbbbbbbbbb....',
        '...bllllllllllllllllb...', '...boooooooooooooooob...', '...boooooooooooooooob...', '...bbbbbbbbbbbbbbbbbb...',
        '...booooooooyyoooooob...', '...booooooooyyoooooob...', '...boooooooooooooooob...', '...boooooooooooooooob...',
        '...boooooooooooooooob...', '...boooooooooooooooob...', '...bbbbbbbbbbbbbbbbbb...', '........................',
        '........................', '........................', '........................', '........................',
      ];
    paintPixels(c, rows, { b: '#402810', o: '#a06828', l: '#c08840', y: '#f8d020', h: '#201810' });
  });
}
