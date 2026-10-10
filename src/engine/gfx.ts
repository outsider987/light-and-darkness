import { ctx, makeCanvas, W, H } from './canvas';

export const FONT = '8px "Press Start 2P", "Courier New", monospace';
export const CH = 8; // glyph width/height

export const C = {
  white: '#f8f8f8',
  black: '#000000',
  winBg: '#18288c',
  winBg2: '#0c1460',
  yellow: '#f8e048',
  gray: '#a0a0a0',
  dark: '#404040',
  red: '#f84848',
  green: '#48e068',
  cyan: '#60d8f8',
  orange: '#f8a030',
  blue: '#5070f0',
};

let fontReady = false;
export function setFontReady(v: boolean): void {
  fontReady = v;
}

export function text(str: string, x: number, y: number, color = C.white, shadow = true): void {
  ctx.font = FONT;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  if (shadow) {
    ctx.fillStyle = C.black;
    ctx.fillText(str, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function textCenter(str: string, cx: number, y: number, color = C.white, shadow = true): void {
  text(str, Math.round(cx - (str.length * CH) / 2), y, color, shadow);
}

export function textRight(str: string, rx: number, y: number, color = C.white, shadow = true): void {
  text(str, rx - str.length * CH, y, color, shadow);
}

/** Classic double-bordered blue window. */
export function win(x: number, y: number, w: number, h: number, bg = C.winBg): void {
  ctx.fillStyle = C.white;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.black;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = bg;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
}

export function rect(x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function px(x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

export function clear(color = C.black): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

/** Word-wrap text to a column count. Respects explicit \n. */
export function wrap(str: string, cols: number): string[] {
  const out: string[] = [];
  for (const para of str.split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      if (line.length === 0) line = w;
      else if (line.length + 1 + w.length <= cols) line += ' ' + w;
      else {
        out.push(line);
        line = w;
      }
      while (line.length > cols) {
        out.push(line.slice(0, cols));
        line = line.slice(cols);
      }
    }
    out.push(line);
  }
  return out;
}

// ---- Sprite / tile cache -------------------------------------------------

const cache = new Map<string, HTMLCanvasElement>();

export type Painter = (c: CanvasRenderingContext2D, w: number, h: number) => void;

export function cached(key: string, w: number, h: number, paint: Painter): HTMLCanvasElement {
  let c = cache.get(key);
  if (!c) {
    const [cv, cx] = makeCanvas(w, h);
    paint(cx, w, h);
    c = cv;
    cache.set(key, c);
  }
  return c;
}

export function blit(img: HTMLCanvasElement, x: number, y: number): void {
  ctx.drawImage(img, x, y);
}

export function blitScaled(img: HTMLCanvasElement, x: number, y: number, scale: number, flip = false): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(x + img.width * scale, y);
    ctx.scale(-scale, scale);
    ctx.drawImage(img, 0, 0);
  } else {
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
  }
  ctx.restore();
}

/** Draw a 2-color pixel-art string into a context. '.' transparent, letters map to palette. */
export function paintPixels(c: CanvasRenderingContext2D, rows: string[], pal: Record<string, string>, ox = 0, oy = 0): void {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

// ---- Icons (16x16) -------------------------------------------------------

const ICONS: Record<string, string[]> = {
  attack: [
    '..............bb',
    '.............bwb',
    '............bwb.',
    '...........bwb..',
    '..........bwb...',
    '.........bwb....',
    '..b.....bwb.....',
    '..bb...bwb......',
    '...bb.bwb.......',
    '....bbwb........',
    '....bbb.........',
    '...bbbb.........',
    '..bb.bbb........',
    '.bb...bbb.......',
    'bb.....bb.......',
    '................',
  ],
  magic: [
    '.......yy.......',
    '.......yy.......',
    '......yyyy......',
    '..y...yyyy...y..',
    '..yy.yyyyyy.yy..',
    '...yyyyyyyyyy...',
    '....yyyyyyyy....',
    '.....yyyyyy.....',
    'yyyyyyyyyyyyyyyy',
    '.....yyyyyy.....',
    '....yyyyyyyy....',
    '...yyyyyyyyyy...',
    '..yy.yyyyyy.yy..',
    '..y...yyyy...y..',
    '.......yy.......',
    '.......yy.......',
  ],
  item: [
    '......bbbb......',
    '.....b....b.....',
    '.....b....b.....',
    '..bbbbbbbbbbbb..',
    '..boooooooooob..',
    '..boooooooooob..',
    '..bbbbbbbbbbbb..',
    '..boooooooooob..',
    '..boooooooooob..',
    '..booobbbboooob.',
    '..boooooooooob..',
    '..boooooooooob..',
    '..boooooooooob..',
    '..boooooooooob..',
    '..bbbbbbbbbbbb..',
    '................',
  ],
  stay: [
    '................',
    '.....wwww.......',
    '....wwwwww......',
    '....wwwwww......',
    '.....wwww.......',
    '....bbbbbb......',
    '...bbbbbbbb.....',
    '..bb.bbbb.bb....',
    '..bb.bbbb.bb....',
    '.....bbbb.......',
    '.....bbbb.......',
    '.....bb.bb......',
    '.....bb.bb......',
    '....bbb.bbb.....',
    '................',
    '................',
  ],
  member: [
    '................',
    '.....gggggg.....',
    '....gggggggg....',
    '....gwwwwwwg....',
    '....gwbwwbwg....',
    '....gwwwwwwg....',
    '.....wwwwww.....',
    '......wwww......',
    '....rrrrrrrr....',
    '...rrrrrrrrrr...',
    '..rrrrrrrrrrrr..',
    '..rrrrrrrrrrrr..',
    '..rrrrrrrrrrrr..',
    '..rrrrrrrrrrrr..',
    '................',
    '................',
  ],
  search: [
    '....bbbbb.......',
    '...bwwwwwb......',
    '..bwwwwwwwb.....',
    '.bwwbbbbbwwb....',
    '.bwwb...bwwb....',
    '.bwwb...bwwb....',
    '.bwwb...bwwb....',
    '.bwwbbbbbwwb....',
    '..bwwwwwwwb.....',
    '...bwwwwwbbb....',
    '....bbbbbbbbb...',
    '..........bbbb..',
    '...........bbbb.',
    '............bbbb',
    '.............bbb',
    '................',
  ],
  map: [
    'bbbbbbbbbbbbbbbb',
    'bggggggggggggggb',
    'bgggttggggggggg.',
    'bggttttggg~~gggb',
    'bgggttgggg~~~ggb',
    'bggggggg~~~~~ggb',
    'bgggggg~~~gggggb',
    'bgg^^gggggggggg.',
    'bg^^^^ggggttgggb',
    'bgg^^gggggttgggb',
    'bggggggggggggggb',
    'bgggoooooooggggb',
    'bgggggggggooogg.',
    'bggggggggggggggb',
    'bggggggggggggggb',
    'bbbbbbbbbbbbbbbb',
  ],
};
const ICON_PAL: Record<string, string> = {
  b: '#101010', w: '#f8f8f8', y: '#f8e048', o: '#c88040', g: '#48c058', r: '#d04040', '^': '#a08060', '~': '#4070e0',
};

export function icon(name: string): HTMLCanvasElement {
  return cached('icon:' + name, 16, 16, (c) => paintPixels(c, ICONS[name] ?? ICONS.stay, ICON_PAL));
}

/** Bracket-corner map cursor. */
export function drawCursor(x: number, y: number, size: number, color = C.white): void {
  const s = 5;
  ctx.fillStyle = color;
  // top-left
  ctx.fillRect(x, y, s, 1); ctx.fillRect(x, y, 1, s);
  // top-right
  ctx.fillRect(x + size - s, y, s, 1); ctx.fillRect(x + size - 1, y, 1, s);
  // bottom-left
  ctx.fillRect(x, y + size - 1, s, 1); ctx.fillRect(x, y + size - s, 1, s);
  // bottom-right
  ctx.fillRect(x + size - s, y + size - 1, s, 1); ctx.fillRect(x + size - 1, y + size - s, 1, s);
}

export function hand(x: number, y: number, color = C.white): void {
  // small right-pointing arrow used as menu cursor
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 1, 1, 5);
  ctx.fillRect(x + 1, y + 2, 1, 3);
  ctx.fillRect(x + 2, y + 3, 1, 1);
  ctx.fillStyle = C.black;
  ctx.fillRect(x + 3, y + 4, 1, 1);
}
