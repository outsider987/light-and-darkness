import { cached } from '../engine/gfx';
import { TILE } from '../engine/canvas';
import type { Dir, Pal, SpriteSpec } from './types';

type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string): void => {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
};

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, v + amt));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

const INK = '#101018';

interface HOpts {
  y?: number;
  cape?: boolean;
  wings?: string | null;
  robe?: boolean;
  small?: boolean;
  wide?: boolean;
  skinOverride?: string;
  noEyes?: boolean;
  eyeColor?: string;
  armorFull?: boolean;
  scaleTail?: boolean;
  horns?: boolean;
  snout?: boolean;
  ears?: boolean;
  strings?: boolean;
  metal?: boolean;
}

function weaponDraw(c: Ctx, wp: SpriteSpec['weapon'], dir: Dir, yo: number, p: Pal, behind: boolean): void {
  if (!wp || wp === 'none' || wp === 'claw') return;
  const side = dir === 'right';
  // hand x position
  const hx = dir === 'up' ? 12 : side ? 19 : 18;
  const metal = '#d8d8e0', dark = '#707080', wood = '#7a5028';
  if (behind !== (dir === 'up')) return;
  switch (wp) {
    case 'sword':
      R(c, hx, 7 + yo, 1, 9, metal); R(c, hx + 1, 8 + yo, 1, 8, dark); R(c, hx - 1, 16 + yo, 4, 1, wood); R(c, hx, 17 + yo, 2, 2, wood);
      break;
    case 'katana':
      R(c, hx, 4 + yo, 1, 12, metal); R(c, hx + 1, 5 + yo, 1, 11, dark); R(c, hx - 1, 16 + yo, 4, 1, '#303030'); R(c, hx, 17 + yo, 2, 3, '#303030');
      break;
    case 'axe':
      R(c, hx, 8 + yo, 2, 11, wood); R(c, hx - 2, 7 + yo, 5, 4, metal); R(c, hx - 2, 10 + yo, 5, 1, dark); R(c, hx - 2, 7 + yo, 1, 4, dark);
      break;
    case 'lance':
      R(c, hx, 2 + yo, 2, 19, wood); R(c, hx, 0 + yo, 2, 3, metal); R(c, hx - 1, 2 + yo, 4, 1, metal);
      break;
    case 'staff':
      R(c, hx, 6 + yo, 2, 14, wood); R(c, hx - 1, 4 + yo, 4, 3, p.extra ?? '#60d0f8'); R(c, hx, 5 + yo, 1, 1, '#ffffff');
      break;
    case 'bow':
      R(c, hx + 1, 6 + yo, 1, 12, wood); R(c, hx, 5 + yo, 2, 1, wood); R(c, hx, 18 + yo, 2, 1, wood); R(c, hx - 1, 6 + yo, 1, 12, '#e8e8e8');
      break;
  }
}

function humanoid(c: Ctx, spec: SpriteSpec, dir: Dir, frame: number, o: HOpts = {}): void {
  const p = spec.pal;
  const bob = frame ? 1 : 0;
  const yo = (o.y ?? 0) - bob;
  const skin = o.skinOverride ?? p.skin ?? '#f0c090';
  const hair = p.hair ?? '#604020';
  const cloth = p.cloth ?? '#4060c0';
  const armor = p.armor;
  const trim = p.trim ?? '#e8e8f0';
  const back = dir === 'up';
  const side = dir === 'right';
  const legC = o.metal ? shade(cloth, -40) : shade(cloth, -40);
  const boot = '#503020';
  const wp = spec.weapon ?? 'none';

  // things behind the body
  weaponDraw(c, wp, dir, yo, p, true);
  if (o.wings) {
    const w = o.wings;
    R(c, 1, 8 + yo, 6, 7, w); R(c, 17, 8 + yo, 6, 7, w);
    R(c, 0, 10 + yo, 2, 6, w); R(c, 22, 10 + yo, 2, 6, w);
    R(c, 2, 9 + yo, 4, 1, shade(w, 40)); R(c, 18, 9 + yo, 4, 1, shade(w, 40));
  }
  if (o.cape && !back) R(c, 6, 11 + yo, 12, 9, p.extra ?? '#c02020');
  if (o.strings) { R(c, 9, 0, 1, 4 + yo, '#e0e0e0'); R(c, 14, 0, 1, 4 + yo, '#e0e0e0'); }

  // legs
  if (!o.robe) {
    const l1 = frame ? 1 : 0;
    R(c, 8, 17, 3, 4, legC); R(c, 13, 17, 3, 4, legC);
    R(c, 8, 21 - l1, 3, 1, boot); R(c, 13, 21, 3, 1, boot);
    if (o.scaleTail && !back) { R(c, 16, 17 + yo, 3, 2, skin); R(c, 18, 19 + yo, 3, 2, skin); }
  }

  // body
  if (o.robe) {
    R(c, 8, 11 + yo, 8, 6, cloth);
    R(c, 7, 15 + yo, 10, 7, cloth);
    R(c, 7, 21 + yo, 10, 1, shade(cloth, -40));
    R(c, 11, 11 + yo, 2, 11, trim);
  } else {
    R(c, 8, 11 + yo, 8, 6, cloth);
    if (armor) {
      R(c, 8, 11 + yo, 8, 4, armor);
      R(c, 9, 12 + yo, 2, 1, shade(armor, 50));
      if (o.armorFull) R(c, 8, 15 + yo, 8, 2, shade(armor, -30));
    } else {
      R(c, 11, 11 + yo, 2, 6, shade(cloth, -30));
    }
  }
  // arms
  const sleeve = armor ?? cloth;
  R(c, 6, 11 + yo, 2, 4, sleeve); R(c, 16, 11 + yo, 2, 4, sleeve);
  R(c, 6, 15 + yo, 2, 2, skin); R(c, 16, 15 + yo, 2, 2, skin);
  if (o.cape && back) R(c, 6, 11 + yo, 12, 9, p.extra ?? '#c02020');

  // head
  R(c, 8, 4 + yo, 8, 7, skin);
  if (o.snout && !back) { R(c, side ? 15 : 11, 8 + yo, side ? 3 : 2, 2, shade(skin, -30)); R(c, side ? 17 : 11, 8 + yo, 1, 1, INK); }
  if (o.ears) { R(c, 7, 1 + yo, 2, 3, hair); R(c, 15, 1 + yo, 2, 3, hair); }
  if (o.horns) { R(c, 6, 1 + yo, 2, 3, '#f0f0e0'); R(c, 16, 1 + yo, 2, 3, '#f0f0e0'); R(c, 6, 0 + yo, 1, 1, '#f0f0e0'); R(c, 17, 0 + yo, 1, 1, '#f0f0e0'); }
  const hs = spec.hair ?? 'short';
  switch (hs) {
    case 'short':
      R(c, 7, 2 + yo, 10, 3, hair); R(c, 7, 5 + yo, 1, 3, hair); R(c, 16, 5 + yo, 1, 3, hair);
      if (back) R(c, 8, 4 + yo, 8, 5, hair);
      break;
    case 'long':
      R(c, 7, 2 + yo, 10, 3, hair); R(c, 6, 4 + yo, 2, 9, hair); R(c, 16, 4 + yo, 2, 9, hair);
      if (back) R(c, 8, 4 + yo, 8, 9, hair);
      break;
    case 'ponytail':
      R(c, 7, 2 + yo, 10, 3, hair); R(c, 7, 5 + yo, 1, 3, hair); R(c, 16, 5 + yo, 1, 3, hair);
      if (back) R(c, 8, 4 + yo, 8, 5, hair);
      if (back || side) R(c, side ? 6 : 11, 5 + yo, 2, 9, hair);
      break;
    case 'helmet': {
      const h = armor ?? '#9098a8';
      R(c, 7, 2 + yo, 10, 4, h); R(c, 7, 6 + yo, 1, 4, h); R(c, 16, 6 + yo, 1, 4, h);
      R(c, 8, 2 + yo, 3, 1, shade(h, 50)); R(c, 11, 0 + yo, 2, 2, trim);
      if (back) R(c, 8, 4 + yo, 8, 6, h);
      break;
    }
    case 'mask': {
      const h = armor ?? '#303040';
      R(c, 7, 2 + yo, 10, 9, h); R(c, 8, 2 + yo, 3, 1, shade(h, 50)); R(c, 11, 0 + yo, 2, 2, p.extra ?? trim);
      break;
    }
    case 'hood':
      R(c, 7, 1 + yo, 10, 11, cloth); R(c, 9, 4 + yo, 6, 6, skin);
      R(c, 7, 1 + yo, 10, 1, shade(cloth, 40));
      if (back) R(c, 8, 3 + yo, 8, 8, cloth);
      break;
    case 'bald':
      R(c, 8, 3 + yo, 8, 1, skin);
      break;
    case 'hat':
      R(c, 11, 0 + yo, 2, 1, cloth); R(c, 10, 1 + yo, 4, 1, cloth); R(c, 9, 2 + yo, 6, 1, cloth); R(c, 8, 3 + yo, 8, 1, cloth);
      R(c, 6, 4 + yo, 12, 1, cloth); R(c, 7, 5 + yo, 10, 1, hair);
      if (back) R(c, 8, 5 + yo, 8, 6, hair);
      break;
    case 'crown':
      R(c, 7, 2 + yo, 10, 3, hair); R(c, 7, 5 + yo, 1, 3, hair); R(c, 16, 5 + yo, 1, 3, hair);
      R(c, 7, 1 + yo, 10, 2, '#f8d020'); R(c, 7, 0 + yo, 1, 1, '#f8d020'); R(c, 11, 0 + yo, 2, 1, '#f8d020'); R(c, 16, 0 + yo, 1, 1, '#f8d020');
      R(c, 9, 1 + yo, 1, 1, '#f04040'); R(c, 14, 1 + yo, 1, 1, '#4080f0');
      if (back) R(c, 8, 4 + yo, 8, 5, hair);
      break;
    case 'bandana':
      R(c, 7, 2 + yo, 10, 3, p.extra ?? '#d02020'); R(c, 16, 3 + yo, 3, 2, p.extra ?? '#d02020');
      if (back) R(c, 8, 4 + yo, 8, 5, hair);
      break;
    case 'beard':
      R(c, 7, 2 + yo, 10, 3, hair); R(c, 7, 5 + yo, 1, 3, hair); R(c, 16, 5 + yo, 1, 3, hair);
      R(c, 8, 9 + yo, 8, 4, hair); R(c, 9, 13 + yo, 6, 1, hair);
      if (back) R(c, 8, 4 + yo, 8, 5, hair);
      break;
    case 'propeller':
      R(c, 7, 2 + yo, 10, 4, armor ?? '#9098a8'); R(c, 7, 6 + yo, 1, 3, armor ?? '#9098a8'); R(c, 16, 6 + yo, 1, 3, armor ?? '#9098a8');
      R(c, 11, 1 + yo, 2, 1, '#808080'); R(c, frame ? 5 : 8, 0 + yo, frame ? 14 : 8, 1, '#d0d0d0');
      if (back) R(c, 8, 4 + yo, 8, 6, armor ?? '#9098a8');
      break;
  }
  // eyes
  if (!o.noEyes && !back) {
    const ec = o.eyeColor ?? INK;
    if (side) R(c, 13, 7 + yo, 1, 2, ec);
    else { R(c, 9, 7 + yo, 1, 2, ec); R(c, 14, 7 + yo, 1, 2, ec); }
  }
  weaponDraw(c, wp, dir, yo, p, false);
}

function centaur(c: Ctx, spec: SpriteSpec, frame: number, winged: boolean): void {
  const p = spec.pal;
  const mount = p.mount ?? '#a06030';
  const skin = p.skin ?? '#f0c090';
  const hair = p.hair ?? '#604020';
  const cloth = p.cloth ?? '#4060c0';
  const armor = p.armor;
  const bob = frame ? 1 : 0;
  const dk = shade(mount, -40);
  // wings behind
  if (winged) { R(c, 2, 4, 8, 8, '#f0f0f8'); R(c, 1, 6, 4, 3, '#d8d8e8'); R(c, 4, 3, 5, 2, '#f0f0f8'); }
  // tail
  R(c, 1, 12, 2, 6, dk);
  // horse body
  R(c, 3, 11, 15, 7, mount);
  R(c, 3, 11, 15, 1, shade(mount, 40));
  // legs (alternate on frame)
  const f = frame ? 1 : 0;
  R(c, 4, 18, 2, 5 - f, dk); R(c, 8, 18, 2, 5, dk); R(c, 12, 18, 2, 5, dk); R(c, 15, 18, 2, 5 - f, dk);
  // human torso front, rising
  const yo = -bob;
  R(c, 13, 9 + yo, 7, 4, cloth);
  if (armor) R(c, 13, 9 + yo, 7, 3, armor);
  R(c, 12, 10 + yo, 2, 3, cloth); R(c, 19, 10 + yo, 2, 3, cloth); R(c, 12, 13 + yo, 2, 1, skin); R(c, 19, 13 + yo, 2, 1, skin);
  // head
  R(c, 13, 3 + yo, 7, 6, skin);
  const hs = spec.hair ?? 'short';
  if (hs === 'helmet') { const h = armor ?? '#9098a8'; R(c, 12, 1 + yo, 9, 4, h); R(c, 12, 5 + yo, 1, 3, h); R(c, 16, 0 + yo, 2, 1, p.trim ?? '#f0f0f0'); }
  else if (hs === 'mask') { const h = armor ?? '#303040'; R(c, 12, 1 + yo, 9, 8, h); R(c, 17, 5 + yo, 1, 2, '#f03030'); }
  else { R(c, 12, 1 + yo, 9, 3, hair); R(c, 12, 4 + yo, 1, 3, hair); if (hs === 'long' || hs === 'ponytail') R(c, 11, 4 + yo, 2, 7, hair); }
  if (hs !== 'mask') R(c, 18, 6 + yo, 1, 2, INK);
  // weapon (held forward right)
  const wp = spec.weapon ?? 'lance';
  const metal = '#d8d8e0', wood = '#7a5028';
  if (wp === 'lance') { R(c, 21, 1 + yo, 2, 16, wood); R(c, 21, 0 + yo, 2, 2, metal); }
  else if (wp === 'bow') { R(c, 22, 4 + yo, 1, 11, wood); R(c, 21, 3 + yo, 2, 1, wood); R(c, 21, 15 + yo, 2, 1, wood); R(c, 20, 4 + yo, 1, 11, '#e8e8e8'); }
  else if (wp === 'sword') { R(c, 21, 4 + yo, 1, 10, metal); R(c, 22, 5 + yo, 1, 9, '#707080'); R(c, 20, 14 + yo, 3, 1, wood); }
  else if (wp === 'axe') { R(c, 21, 5 + yo, 2, 10, wood); R(c, 19, 4 + yo, 5, 3, metal); }
}

function quadruped(c: Ctx, spec: SpriteSpec, frame: number, o: { wings?: boolean; heads?: number; fire?: boolean; mane?: boolean }): void {
  const p = spec.pal;
  const body = p.cloth ?? '#a04020';
  const dk = shade(body, -40);
  const lt = shade(body, 40);
  const f = frame ? 1 : 0;
  if (o.wings) { R(c, 3, 2, 9, 7, p.extra ?? dk); R(c, 1, 4, 4, 4, p.extra ?? dk); }
  // tail
  R(c, 1, 9, 3, 2, dk); R(c, 0, 7, 2, 3, dk);
  // body
  R(c, 4, 10, 14, 7, body); R(c, 5, 10, 12, 1, lt);
  // legs
  R(c, 5, 17, 3, 5 - f, dk); R(c, 9, 17, 3, 5, dk); R(c, 13, 17, 3, 5 - f, dk); R(c, 16, 17, 3, 5, dk);
  // head(s)
  const heads = o.heads ?? 1;
  for (let i = 0; i < heads; i++) {
    const hx = 14 + (i - (heads - 1) / 2) * 0; const hy = 5 + (i % 2 === 1 ? -3 : 0) + (i === 2 ? 3 : 0);
    const ox = i === 0 ? 0 : i === 1 ? -4 : 4;
    R(c, hx + ox, hy, 7, 6, body); R(c, hx + ox + 5, hy + 3, 4, 3, body);
    R(c, hx + ox + 1, hy - 2, 2, 2, body); R(c, hx + ox + 4, hy - 2, 2, 2, body); // ears
    R(c, hx + ox + 5, hy + 2, 1, 1, p.trim ?? '#f8e030'); // eye
    R(c, hx + ox + 6, hy + 5, 3, 1, '#f8f8f8'); // teeth
    if (o.fire) { R(c, hx + ox + 9, hy + 3, 2, 2, '#f87020'); }
  }
  if (o.mane) { R(c, 12, 3, 4, 8, p.hair ?? '#e0a020'); }
}

function dragon(c: Ctx, spec: SpriteSpec, frame: number, big: boolean, heads = 1): void {
  const p = spec.pal;
  const body = p.cloth ?? '#40a040';
  const belly = p.trim ?? '#e0d070';
  const wing = p.extra ?? shade(body, -30);
  const dk = shade(body, -40);
  const f = frame ? 1 : 0;
  // wings
  R(c, 0, 2 + f, 9, 8, wing); R(c, 15, 2 + f, 9, 8, wing);
  R(c, 1, 3 + f, 7, 1, shade(wing, 40)); R(c, 16, 3 + f, 7, 1, shade(wing, 40));
  // tail
  R(c, 0, 16, 5, 2, body); R(c, 0, 18, 2, 3, dk);
  // body
  R(c, 5, 9, big ? 15 : 13, 10, body);
  R(c, 7, 13, big ? 11 : 9, 5, belly);
  // legs
  R(c, 6, 19, 3, 4 - f, dk); R(c, big ? 16 : 14, 19, 3, 4, dk);
  // head(s)
  const positions = heads === 3 ? [[14, 1], [8, 0], [19, 4]] : [[14, 2]];
  for (const [hx, hy] of positions) {
    R(c, hx, hy, 8, 6, body); R(c, hx + 5, hy + 3, 4, 3, body);
    R(c, hx + 1, hy - 1, 2, 1, '#e0e0d0'); R(c, hx + 5, hy - 1, 2, 1, '#e0e0d0'); // horns
    R(c, hx + 5, hy + 2, 1, 1, '#f84040'); // eye
    R(c, hx + 6, hy + 5, 3, 1, '#f8f8f8'); // teeth
  }
}

function blob(c: Ctx, spec: SpriteSpec, frame: number): void {
  const p = spec.pal;
  const body = p.cloth ?? '#60d0f0';
  const f = frame ? 1 : 0;
  // hat
  R(c, 9, 2 + f, 6, 2, p.extra ?? '#f0a020'); R(c, 10, 0 + f, 4, 2, p.extra ?? '#f0a020'); R(c, 7, 4 + f, 10, 1, p.extra ?? '#f0a020');
  // body
  R(c, 6, 6 + f, 12, 10, body); R(c, 5, 8 + f, 14, 6, body);
  R(c, 7, 7 + f, 4, 2, shade(body, 50));
  // eyes
  R(c, 9, 10 + f, 1, 2, INK); R(c, 14, 10 + f, 1, 2, INK);
  // tentacles
  for (let i = 0; i < 5; i++) R(c, 6 + i * 3, 16 + f + (i % 2), 2, 5 - (i % 2) * 2, shade(body, -20));
}

function eye(c: Ctx, spec: SpriteSpec, frame: number): void {
  const p = spec.pal;
  const iris = p.cloth ?? '#f08020';
  const f = frame ? 1 : 0;
  R(c, 7, 5 + f, 10, 10, '#f0f0f0'); R(c, 6, 7 + f, 12, 6, '#f0f0f0');
  R(c, 10, 8 + f, 4, 4, iris); R(c, 11, 9 + f, 2, 2, INK);
  R(c, 9, 7 + f, 1, 1, '#ffffff');
  // veins
  R(c, 7, 9 + f, 2, 1, '#e06060'); R(c, 15, 11 + f, 2, 1, '#e06060');
  // tentacles
  const t = p.extra ?? '#806050';
  for (let i = 0; i < 4; i++) R(c, 7 + i * 3, 15 + f + ((i + f) % 2), 2, 5 + (i % 2) * 2, t);
}

function bat(c: Ctx, spec: SpriteSpec, frame: number): void {
  const p = spec.pal;
  const body = p.cloth ?? '#6040a0';
  const w = shade(body, -30);
  const f = frame ? 2 : 0;
  R(c, 1, 8 - f, 9, 6, w); R(c, 14, 8 - f, 9, 6, w); R(c, 0, 10 - f, 3, 5, w); R(c, 21, 10 - f, 3, 5, w);
  R(c, 10, 8, 4, 8, body); R(c, 9, 10, 6, 4, body);
  R(c, 9, 6, 2, 2, body); R(c, 13, 6, 2, 2, body);
  R(c, 10, 10, 1, 1, '#f84040'); R(c, 13, 10, 1, 1, '#f84040');
  R(c, 11, 13, 1, 1, '#f8f8f8'); R(c, 12, 13, 1, 1, '#f8f8f8');
}

function skeleton(c: Ctx, spec: SpriteSpec, dir: Dir, frame: number, armed: boolean): void {
  const s: SpriteSpec = { ...spec, pal: { hair: '#e8e8e0', cloth: armed ? (spec.pal.armor ?? '#606070') : '#d8d8d0', armor: armed ? spec.pal.armor ?? '#606070' : undefined, trim: '#e8e8e0', ...spec.pal, skin: '#e8e8e0' }, hair: armed ? 'helmet' : 'bald' };
  humanoid(c, s, dir, frame, { eyeColor: '#101010', armorFull: armed });
  if (dir !== 'up') {
    const yo = frame ? -1 : 0;
    R(c, 9, 7 + yo, 2, 2, INK); R(c, 13, 7 + yo, 2, 2, INK);
    if (!armed) { R(c, 9, 12 + yo, 6, 1, '#a0a098'); R(c, 9, 14 + yo, 6, 1, '#a0a098'); }
  }
}

function robot(c: Ctx, spec: SpriteSpec, dir: Dir, frame: number): void {
  const p = spec.pal;
  const m = p.armor ?? '#90a0a8';
  const s: SpriteSpec = { ...spec, pal: { skin: m, hair: m, cloth: p.cloth ?? shade(m, -20), armor: m, trim: p.trim ?? '#60f0ff', extra: p.extra }, hair: 'helmet', weapon: spec.weapon ?? 'none' };
  humanoid(c, s, dir, frame, { noEyes: true, metal: true, armorFull: true });
  const yo = frame ? -1 : 0;
  if (dir !== 'up') {
    const ec = p.trim ?? '#60f0ff';
    if (dir === 'right') R(c, 13, 7 + yo, 2, 1, ec); else { R(c, 9, 7 + yo, 2, 1, ec); R(c, 13, 7 + yo, 2, 1, ec); }
    R(c, 10, 13 + yo, 4, 1, shade(m, -50)); R(c, 11, 15 + yo, 2, 1, '#f04040');
  }
  R(c, 11, 0 + yo, 1, 2, '#f0f0f0'); R(c, 10, 0 + yo, 3, 1, '#f04040');
}

function golem(c: Ctx, spec: SpriteSpec, frame: number, gold: boolean): void {
  const p = spec.pal;
  const body = p.cloth ?? (gold ? '#d0a030' : '#808890');
  const dk = shade(body, -40), lt = shade(body, 40);
  const f = frame ? 1 : 0;
  // legs
  R(c, 5, 17, 5, 7, dk); R(c, 14, 17, 5, 7, dk);
  // body
  R(c, 4, 7 - f, 16, 11, body); R(c, 5, 7 - f, 14, 1, lt);
  // arms
  R(c, 0, 8 - f, 4, 11, body); R(c, 20, 8 - f, 4, 11, body); R(c, 0, 17 - f, 4, 3, dk); R(c, 20, 17 - f, 4, 3, dk);
  // head
  R(c, 7, 1 - f, 10, 7, body); R(c, 8, 1 - f, 8, 1, lt);
  R(c, 9, 4 - f, 2, 2, p.trim ?? '#f84020'); R(c, 13, 4 - f, 2, 2, p.trim ?? '#f84020');
  // cracks / panel lines
  R(c, 8, 11 - f, 1, 4, dk); R(c, 15, 10 - f, 1, 5, dk); R(c, 10, 13 - f, 4, 1, dk);
  if (gold) { R(c, 11, 8 - f, 2, 2, '#f8f0c0'); R(c, 6, 5 - f, 2, 1, '#f8f0c0'); }
}

function wyvern(c: Ctx, spec: SpriteSpec, frame: number): void {
  const p = spec.pal;
  const body = p.cloth ?? '#50a050';
  const wing = p.extra ?? shade(body, -25);
  const f = frame ? 2 : 0;
  R(c, 0, 4 + f, 9, 7, wing); R(c, 15, 4 + f, 9, 7, wing); R(c, 2, 11 + f, 5, 2, wing); R(c, 17, 11 + f, 5, 2, wing);
  R(c, 1, 5 + f, 7, 1, shade(wing, 40)); R(c, 16, 5 + f, 7, 1, shade(wing, 40));
  R(c, 8, 9, 8, 9, body); R(c, 9, 12, 6, 4, p.trim ?? shade(body, 50));
  R(c, 12, 4, 7, 5, body); R(c, 17, 6, 4, 3, body); R(c, 17, 6, 1, 1, '#f84040'); R(c, 18, 8, 3, 1, '#f8f8f8');
  R(c, 4, 17, 5, 2, body); R(c, 2, 19, 3, 2, shade(body, -40));
  R(c, 9, 18, 2, 4 - (frame ? 1 : 0), shade(body, -40)); R(c, 13, 18, 2, 4, shade(body, -40));
}

function hamster(c: Ctx, spec: SpriteSpec, frame: number): void {
  const p = spec.pal;
  const body = p.cloth ?? '#f0d060';
  const f = frame ? 1 : 0;
  R(c, 7, 10 + f, 10, 10, body); R(c, 6, 12 + f, 12, 6, body);
  R(c, 8, 8 + f, 2, 2, body); R(c, 14, 8 + f, 2, 2, body); R(c, 8, 8 + f, 1, 1, '#f8a0a0'); R(c, 15, 8 + f, 1, 1, '#f8a0a0');
  R(c, 9, 12 + f, 1, 1, INK); R(c, 14, 12 + f, 1, 1, INK);
  R(c, 7, 14 + f, 2, 1, '#f8a0a0'); R(c, 15, 14 + f, 2, 1, '#f8a0a0');
  R(c, 8, 20 + f, 3, 1, shade(body, -40)); R(c, 13, 20 + f, 3, 1, shade(body, -40));
  R(c, 10, 16 + f, 4, 2, '#f8f8f8');
}

function ghost(c: Ctx, spec: SpriteSpec, frame: number): void {
  const p = spec.pal;
  const body = p.cloth ?? '#c0b8e8';
  const f = frame ? 1 : 0;
  R(c, 7, 3 + f, 10, 15, body); R(c, 6, 6 + f, 12, 10, body);
  for (let i = 0; i < 5; i++) R(c, 7 + i * 2, 18 + f + (i % 2) * 2, 2, 2, body);
  R(c, 9, 7 + f, 2, 3, INK); R(c, 13, 7 + f, 2, 3, INK);
  R(c, 10, 12 + f, 4, 2, INK);
}

function drawUnit(c: Ctx, spec: SpriteSpec, dir: Dir, frame: number): void {
  const flip = dir === 'left';
  const d: Dir = flip ? 'right' : dir;
  if (flip) {
    c.save();
    c.translate(TILE, 0);
    c.scale(-1, 1);
  }
  const p = spec.pal;
  switch (spec.body) {
    case 'human': humanoid(c, spec, d, frame, { cape: false }); break;
    case 'knightlord': humanoid(c, spec, d, frame, { cape: true, armorFull: true }); break;
    case 'king': humanoid(c, { ...spec, hair: spec.hair ?? 'crown' }, d, frame, { cape: true }); break;
    case 'elf': humanoid(c, spec, d, frame, { ears: false }); break;
    case 'dwarf': humanoid(c, { ...spec, hair: spec.hair ?? 'beard' }, d, frame, { y: 2 }); break;
    case 'goblin': humanoid(c, { ...spec, hair: spec.hair ?? 'bandana', pal: { skin: '#70b040', cloth: '#806030', ...p } }, d, frame, { y: 3, eyeColor: '#f8e030' }); break;
    case 'mage': humanoid(c, { ...spec, hair: spec.hair ?? 'hat' }, d, frame, { robe: true }); break;
    case 'priest': humanoid(c, { ...spec, hair: spec.hair ?? 'hood' }, d, frame, { robe: true }); break;
    case 'bird': humanoid(c, spec, d, frame, { wings: p.extra ?? '#f0f0f8' }); break;
    case 'wolf': humanoid(c, { ...spec, pal: { skin: p.skin ?? '#8890a0', hair: p.hair ?? '#8890a0', ...p } }, d, frame, { snout: true, ears: true, eyeColor: '#f8e030' }); break;
    case 'lizard': humanoid(c, { ...spec, hair: 'bald', pal: { skin: '#50a050', cloth: '#806040', ...p } }, d, frame, { snout: true, scaleTail: true, eyeColor: '#f8e030' }); break;
    case 'zombie': humanoid(c, { ...spec, pal: { skin: '#90a888', hair: '#404830', cloth: '#706048', ...p } }, d, frame, { eyeColor: '#f03030' }); break;
    case 'puppet': humanoid(c, { ...spec, pal: { skin: '#e0c090', hair: '#c04040', cloth: '#4060c0', ...p } }, d, frame, { strings: true }); break;
    case 'demon': humanoid(c, { ...spec, pal: { skin: '#9050c0', hair: '#301040', cloth: '#301040', ...p } }, d, frame, { horns: true, wings: '#301040', eyeColor: '#f8e030' }); break;
    case 'minotaur': humanoid(c, { ...spec, pal: { skin: '#a06830', hair: '#703820', cloth: '#604020', ...p } }, d, frame, { horns: true, snout: true, eyeColor: '#f03030' }); break;
    case 'centaur': centaur(c, spec, frame, false); break;
    case 'skeleton': skeleton(c, spec, d, frame, !!p.armor); break;
    case 'robot': robot(c, spec, d, frame); break;
    case 'hound': quadruped(c, spec, frame, { fire: true }); break;
    case 'dragon': dragon(c, spec, frame, false); break;
    case 'bigdragon': dragon(c, spec, frame, true, spec.big ? 3 : 1); break;
    case 'wyvern': wyvern(c, spec, frame); break;
    case 'bat': bat(c, spec, frame); break;
    case 'blob': blob(c, spec, frame); break;
    case 'eye': eye(c, spec, frame); break;
    case 'golem': golem(c, spec, frame, false); break;
    case 'colossus': golem(c, spec, frame, true); break;
    case 'hamster': hamster(c, spec, frame); break;
    case 'ghost': ghost(c, spec, frame); break;
  }
  if (spec.wings && spec.body === 'centaur') {
    // pegasus: wings drawn on top at left
    c.fillStyle = '#f0f0f8';
    c.fillRect(2, 3 + (frame ? 1 : 0), 8, 2);
    c.fillRect(1, 5 + (frame ? 1 : 0), 7, 4);
  }
  if (flip) c.restore();
}

export function unitSprite(spec: SpriteSpec, dir: Dir = 'down', frame = 0): HTMLCanvasElement {
  const key = 'u:' + JSON.stringify(spec) + ':' + dir + ':' + frame;
  return cached(key, TILE, TILE, (c) => drawUnit(c, spec, dir, frame));
}
