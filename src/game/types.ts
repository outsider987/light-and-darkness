import type { Co } from '../engine/co';

export type MoveType = 'walk' | 'mounted' | 'fly' | 'float' | 'mech' | 'beast';
export type WeaponType = 'sword' | 'lance' | 'axe' | 'staff' | 'arrow' | 'claw' | 'none';
export type Team = 'force' | 'enemy';
export type Dir = 'up' | 'down' | 'left' | 'right';
export type AiKind = 'aggressive' | 'wait' | 'stationary' | 'healer' | 'caster' | 'boss';

export interface Growth { hp: number; mp: number; att: number; def: number; agi: number }

export interface SpellLearn { spell: string; level: number; atLevel: number }

export interface ClassDef {
  id: string;
  name: string;
  abbr: string;
  moveType: MoveType;
  mov: number;
  range: [number, number];
  weapons: WeaponType[];
  promo?: string;
  promoted: boolean;
  growth: Growth;
  spells?: SpellLearn[];
}

export type BodyKind =
  | 'human' | 'dwarf' | 'elf' | 'centaur' | 'bird' | 'wolf' | 'dragon' | 'goblin' | 'skeleton' | 'zombie'
  | 'bat' | 'mage' | 'priest' | 'robot' | 'blob' | 'eye' | 'hound' | 'golem' | 'puppet' | 'demon'
  | 'hamster' | 'wyvern' | 'colossus' | 'bigdragon' | 'lizard' | 'minotaur' | 'king' | 'ghost' | 'knightlord';

export interface Pal {
  skin?: string;
  hair?: string;
  cloth?: string;
  armor?: string;
  trim?: string;
  mount?: string;
  extra?: string;
}

export interface SpriteSpec {
  body: BodyKind;
  pal: Pal;
  hair?: 'short' | 'long' | 'helmet' | 'hood' | 'bald' | 'hat' | 'crown' | 'ponytail' | 'bandana' | 'mask' | 'beard' | 'propeller';
  weapon?: 'sword' | 'axe' | 'lance' | 'staff' | 'bow' | 'none' | 'katana' | 'claw';
  wings?: boolean;
  big?: boolean;
}

export interface Stats { hp: number; mp: number; att: number; def: number; agi: number; mov: number }

export interface CharDef {
  id: string;
  name: string;
  classId: string;
  level: number;
  base: Stats;
  sprite: SpriteSpec;
  spells?: { spell: string; level: number }[];
  items?: string[];
  fixed?: boolean;
  desc: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  abbr: string;
  level: number;
  stats: Stats;
  moveType: MoveType;
  range: [number, number];
  sprite: SpriteSpec;
  spells?: { spell: string; level: number }[];
  ai?: AiKind;
  exp?: number;
  gold?: number;
  drop?: string;
  boss?: boolean;
  immuneStatus?: boolean;
}

export type Area = 'single' | 'cross' | 'diamond' | 'self' | 'allies' | 'all';

export interface SpellLevel { mp: number; range: number; area: Area; power: number }

export interface SpellDef {
  id: string;
  name: string;
  kind: 'damage' | 'heal' | 'buff' | 'debuff' | 'status' | 'special';
  stat?: 'att' | 'def' | 'agi' | 'mov';
  status?: 'sleep' | 'muddle' | 'poison' | 'desoul' | 'dispel';
  element?: 'fire' | 'ice' | 'bolt' | 'holy' | 'dark';
  target: 'enemy' | 'ally';
  levels: SpellLevel[];
  sfx: string;
  color: string;
  desc: string;
}

export type UseEffect =
  | { type: 'heal'; amount: number }
  | { type: 'cure' }
  | { type: 'egress' }
  | { type: 'stat'; stat: 'hp' | 'mp' | 'att' | 'def' | 'agi' | 'mov'; amount: number }
  | { type: 'spell'; spell: string; level: number }
  | { type: 'none' };

export interface ItemDef {
  id: string;
  name: string;
  kind: 'weapon' | 'ring' | 'use' | 'key';
  price: number;
  att?: number;
  def?: number;
  agi?: number;
  mov?: number;
  weapon?: WeaponType;
  cursed?: boolean;
  use?: UseEffect;
  desc: string;
}

export interface Buffs { att: number; def: number; agi: number; mov: number; turns: number }

/** Runtime unit: both force members (persisted) and enemy instances (battle only). */
export interface Unit {
  uid: number;
  id: string;
  name: string;
  classId: string;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  att: number;
  def: number;
  agi: number;
  mov: number;
  items: string[];
  equipWeapon: number;
  equipRing: number;
  spells: { spell: string; level: number }[];
  sprite: SpriteSpec;
  team: Team;
  alive: boolean;
  poison: boolean;
  promoted: boolean;
  fixed?: boolean;
  isHero?: boolean;
  // battle only
  x: number;
  y: number;
  dir: Dir;
  acted: boolean;
  buffs: Buffs;
  sleep: number;
  muddle: number;
  ai?: AiKind;
  boss?: boolean;
  defId?: string;
  expReward?: number;
  goldReward?: number;
  drop?: string;
  immuneStatus?: boolean;
  /** enemy stays put until a force unit comes within this many tiles */
  aggroRange?: number;
  triggered?: boolean;
  guard?: { x: number; y: number };
}

export interface ItemSlot { x: number; y: number; item?: string; gold?: number }

// ---- Field / story data -----------------------------------------------------

export type Line = string;
export type ScriptStep =
  | Line
  | { ask: string; yes: Script; no: Script }
  | { if: string | ((g: GameState) => boolean); then: Script; else?: Script }
  | { flag: string; value?: boolean | number }
  | { join: string }
  | { gold: number }
  | { item: string }
  | { takeItem: string }
  | { music: string }
  | { sfx: string }
  | { warp: { location: string; x: number; y: number; dir?: Dir } }
  | { shop: string[]; deals?: string[] }
  | { church: true }
  | { hq: true }
  | { inn: number }
  | { heal: true }
  | { battle: string }
  | { chapter: number }
  | { ending: true }
  | { removeNpc: string }
  | { wait: number }
  | { fade: 'out' | 'in' }
  | { custom: (g: GameState) => Co<void> | void };
export type Script = ScriptStep[];

export interface NpcDef {
  id: string;
  x: number;
  y: number;
  sprite: SpriteSpec;
  name?: string;
  dir?: Dir;
  script: Script;
  wander?: boolean;
  cond?: (g: GameState) => boolean;
  /** force member id: NPC hidden once that member joined */
  member?: string;
  facePlayer?: boolean;
}

export interface ExitDef {
  x: number;
  y: number;
  w?: number;
  h?: number;
  /** condition to leave; failing shows `blockText` */
  cond?: (g: GameState) => boolean;
  blockText?: string;
  dest: (g: GameState) => Dest;
}

export type Dest =
  | { location: string; x: number; y: number; dir?: Dir }
  | { battle: string };

export interface LocationDef {
  id: string;
  name: string;
  rows: string[];
  music: string;
  npcs: NpcDef[];
  exits: ExitDef[];
  chests?: ItemSlot[];
  searches?: { x: number; y: number; text: string; item?: string; gold?: number; flag?: string; join?: string }[];
  onEnter?: Script | ((g: GameState) => Script);
  /** location acts as a church save point for Egress */
  churchPos?: { x: number; y: number };
  indoor?: boolean;
}

export interface EnemyPlacement {
  type: string;
  x: number;
  y: number;
  ai?: AiKind;
  boss?: boolean;
  level?: number;
  aggro?: number;
  guard?: boolean;
}

export interface BattleDef {
  id: string;
  name: string;
  chapter: number;
  rows: string[];
  music?: string;
  /** spawn tiles for force units (in order) */
  spawns: [number, number][];
  enemies: EnemyPlacement[];
  chests?: ItemSlot[];
  winCondition?: 'all' | 'boss';
  intro?: Script;
  outro?: Script;
  /** where to go after victory */
  after: { location: string; x: number; y: number; dir?: Dir };
  /** where to return on egress/defeat (defaults to last church) */
  maxFixedSpawn?: boolean;
  bossTalk?: Line[];
}

export interface ChapterDef {
  num: number;
  title: string;
  start: { location: string; x: number; y: number };
  intro: Script;
}

export interface GameState {
  version: number;
  force: Unit[];
  /** ids in battle party order (max 12) */
  party: string[];
  gold: number;
  chapter: number;
  flags: Record<string, boolean | number>;
  location: string;
  px: number;
  py: number;
  pdir: Dir;
  lastChurch: { location: string; x: number; y: number };
  openedChests: Record<string, boolean>;
  depot: string[];
  playtime: number;
  battlesWon: number;
  nextUid: number;
  seed: number;
}
