import type { SpellDef } from '../types';

export const SPELLS: Record<string, SpellDef> = {
  blaze: {
    id: 'blaze', name: 'Blaze', kind: 'damage', element: 'fire', target: 'enemy', sfx: 'fire', color: '#f86020',
    desc: 'Fire magic.',
    levels: [
      { mp: 2, range: 2, area: 'single', power: 10 },
      { mp: 5, range: 2, area: 'cross', power: 13 },
      { mp: 8, range: 2, area: 'single', power: 26 },
      { mp: 11, range: 3, area: 'diamond', power: 26 },
    ],
  },
  freeze: {
    id: 'freeze', name: 'Freeze', kind: 'damage', element: 'ice', target: 'enemy', sfx: 'ice', color: '#80d8ff',
    desc: 'Ice magic.',
    levels: [
      { mp: 3, range: 2, area: 'single', power: 13 },
      { mp: 6, range: 2, area: 'cross', power: 17 },
      { mp: 9, range: 2, area: 'single', power: 32 },
      { mp: 13, range: 3, area: 'diamond', power: 32 },
    ],
  },
  bolt: {
    id: 'bolt', name: 'Bolt', kind: 'damage', element: 'bolt', target: 'enemy', sfx: 'bolt', color: '#f8f060',
    desc: 'Lightning magic.',
    levels: [
      { mp: 8, range: 2, area: 'cross', power: 20 },
      { mp: 14, range: 3, area: 'diamond', power: 26 },
      { mp: 20, range: 3, area: 'diamond', power: 34 },
      { mp: 30, range: 3, area: 'diamond', power: 44 },
    ],
  },
  blast: {
    id: 'blast', name: 'Blast', kind: 'damage', element: 'dark', target: 'enemy', sfx: 'bolt', color: '#c060f8',
    desc: 'Dark blast.',
    levels: [
      { mp: 6, range: 2, area: 'cross', power: 16 },
      { mp: 12, range: 3, area: 'diamond', power: 24 },
      { mp: 20, range: 3, area: 'diamond', power: 34 },
    ],
  },
  heal: {
    id: 'heal', name: 'Heal', kind: 'heal', target: 'ally', sfx: 'heal', color: '#60f080',
    desc: 'Restores HP.',
    levels: [
      { mp: 3, range: 1, area: 'single', power: 15 },
      { mp: 5, range: 2, area: 'single', power: 25 },
      { mp: 10, range: 2, area: 'single', power: 40 },
      { mp: 20, range: 3, area: 'single', power: 999 },
    ],
  },
  aura: {
    id: 'aura', name: 'Aura', kind: 'heal', target: 'ally', sfx: 'heal', color: '#f8f8a0',
    desc: 'Heals allies in an area.',
    levels: [
      { mp: 7, range: 0, area: 'cross', power: 15 },
      { mp: 11, range: 0, area: 'diamond', power: 25 },
      { mp: 17, range: 0, area: 'diamond', power: 40 },
      { mp: 25, range: 0, area: 'allies', power: 999 },
    ],
  },
  detox: {
    id: 'detox', name: 'Detox', kind: 'status', status: 'poison', target: 'ally', sfx: 'heal', color: '#a0f0a0',
    desc: 'Cures poison.',
    levels: [{ mp: 3, range: 1, area: 'single', power: 0 }],
  },
  egress: {
    id: 'egress', name: 'Egress', kind: 'special', target: 'ally', sfx: 'egress', color: '#ffffff',
    desc: 'Retreat from battle.',
    levels: [{ mp: 8, range: 0, area: 'self', power: 0 }],
  },
  quick: {
    id: 'quick', name: 'Quick', kind: 'buff', stat: 'agi', target: 'ally', sfx: 'magic', color: '#60c0ff',
    desc: 'Raises agility.',
    levels: [
      { mp: 4, range: 1, area: 'single', power: 6 },
      { mp: 8, range: 2, area: 'cross', power: 6 },
    ],
  },
  slow: {
    id: 'slow', name: 'Slow', kind: 'debuff', stat: 'agi', target: 'enemy', sfx: 'magic', color: '#a080ff',
    desc: 'Lowers enemy agility.',
    levels: [
      { mp: 3, range: 2, area: 'single', power: 6 },
      { mp: 6, range: 2, area: 'cross', power: 6 },
    ],
  },
  boost: {
    id: 'boost', name: 'Boost', kind: 'buff', stat: 'att', target: 'ally', sfx: 'magic', color: '#ff9060',
    desc: 'Raises attack.',
    levels: [
      { mp: 5, range: 1, area: 'single', power: 6 },
      { mp: 10, range: 2, area: 'cross', power: 6 },
    ],
  },
  muddle: {
    id: 'muddle', name: 'Muddle', kind: 'status', status: 'muddle', target: 'enemy', sfx: 'magic', color: '#f080f0',
    desc: 'Confuses the target.',
    levels: [
      { mp: 5, range: 2, area: 'single', power: 70 },
      { mp: 10, range: 2, area: 'cross', power: 60 },
    ],
  },
  sleep: {
    id: 'sleep', name: 'Sleep', kind: 'status', status: 'sleep', target: 'enemy', sfx: 'magic', color: '#8080f0',
    desc: 'Puts the target to sleep.',
    levels: [
      { mp: 6, range: 2, area: 'single', power: 75 },
      { mp: 11, range: 2, area: 'cross', power: 60 },
    ],
  },
  desoul: {
    id: 'desoul', name: 'Desoul', kind: 'status', status: 'desoul', target: 'enemy', sfx: 'death', color: '#404060',
    desc: 'May destroy the target instantly.',
    levels: [
      { mp: 10, range: 1, area: 'single', power: 55 },
      { mp: 20, range: 2, area: 'cross', power: 45 },
    ],
  },
  dispel: {
    id: 'dispel', name: 'Dispel', kind: 'status', status: 'dispel', target: 'enemy', sfx: 'magic', color: '#c0c0ff',
    desc: 'Drains the target MP.',
    levels: [{ mp: 8, range: 2, area: 'single', power: 100 }],
  },
  breath: {
    id: 'breath', name: 'Breath', kind: 'damage', element: 'fire', target: 'enemy', sfx: 'fire', color: '#ff8030',
    desc: 'Fiery breath.',
    levels: [
      { mp: 6, range: 2, area: 'cross', power: 15 },
      { mp: 10, range: 2, area: 'diamond', power: 22 },
      { mp: 14, range: 3, area: 'diamond', power: 30 },
    ],
  },
  demonbreath: {
    id: 'demonbreath', name: 'Demon Breath', kind: 'damage', element: 'dark', target: 'enemy', sfx: 'bolt', color: '#9040c0',
    desc: 'Breath of darkness.',
    levels: [
      { mp: 12, range: 2, area: 'diamond', power: 26 },
      { mp: 18, range: 3, area: 'diamond', power: 36 },
    ],
  },
};

export function spell(id: string): SpellDef {
  return SPELLS[id];
}
