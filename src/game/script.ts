import type { Co } from '../engine/co';
import { fadeIn, fadeOut } from '../engine/scene';
import { audio } from '../engine/audio';
import type { Dest, GameState, Script, ScriptStep } from './types';
import { ask, closeDialog, sayKeep } from './ui';
import { giveToForce, joinForce, takeFromForce, fullHeal, MAX_PARTY } from './state';
import { item as itemDef } from './data/items';

export interface ScriptEnv {
  shop?: (items: string[], deals?: string[]) => Co<void>;
  church?: () => Co<void>;
  hq?: () => Co<void>;
  inn?: (price: number) => Co<void>;
  warp?: (d: Dest) => Co<void>;
  battle?: (id: string) => Co<void>;
  removeNpc?: (id: string) => void;
  chapter?: (n: number) => Co<void>;
  ending?: () => Co<void>;
}

export function flagOn(g: GameState, f: string): boolean {
  return !!g.flags[f];
}

export function* runScript(g: GameState, script: Script, env: ScriptEnv): Co<void> {
  for (const step of script) {
    yield* runStep(g, step, env);
  }
  closeDialog();
}

function* runStep(g: GameState, step: ScriptStep, env: ScriptEnv): Co<void> {
  if (typeof step === 'string') {
    yield* sayKeep(step);
    return;
  }
  if ('ask' in step) {
    const yes = yield* ask(step.ask);
    yield* runScript(g, yes ? step.yes : step.no, env);
    return;
  }
  if ('if' in step) {
    const ok = typeof step.if === 'function' ? step.if(g) : flagOn(g, step.if);
    yield* runScript(g, ok ? step.then : step.else ?? [], env);
    return;
  }
  if ('flag' in step) {
    g.flags[step.flag] = step.value ?? true;
    return;
  }
  if ('join' in step) {
    const u = joinForce(g, step.join);
    if (u) {
      audio.sfx('levelup');
      yield* sayKeep(`${u.name} joined the Shining Force!`);
      if (!g.party.includes(u.id) && g.party.length >= MAX_PARTY) yield* sayKeep(`${u.name} will wait at headquarters.`);
    }
    return;
  }
  if ('gold' in step) {
    g.gold = Math.max(0, g.gold + step.gold);
    if (step.gold > 0) {
      audio.sfx('gold');
      yield* sayKeep(`Received ${step.gold} gold.`);
    }
    return;
  }
  if ('item' in step) {
    const it = itemDef(step.item);
    const u = giveToForce(g, step.item);
    audio.sfx('gold');
    if (u) yield* sayKeep(`${u.name} received the ${it.name}.`);
    else {
      g.depot.push(step.item);
      yield* sayKeep(`Everyone's hands are full. The ${it.name} was sent to headquarters.`);
    }
    return;
  }
  if ('takeItem' in step) {
    if (!takeFromForce(g, step.takeItem)) {
      const i = g.depot.indexOf(step.takeItem);
      if (i >= 0) g.depot.splice(i, 1);
    }
    return;
  }
  if ('music' in step) {
    audio.play(step.music);
    return;
  }
  if ('sfx' in step) {
    audio.sfx(step.sfx);
    return;
  }
  if ('warp' in step) {
    if (env.warp) yield* env.warp({ location: step.warp.location, x: step.warp.x, y: step.warp.y, dir: step.warp.dir });
    return;
  }
  if ('shop' in step) {
    closeDialog();
    if (env.shop) yield* env.shop(step.shop, step.deals);
    return;
  }
  if ('church' in step) {
    closeDialog();
    if (env.church) yield* env.church();
    return;
  }
  if ('hq' in step) {
    closeDialog();
    if (env.hq) yield* env.hq();
    return;
  }
  if ('inn' in step) {
    if (env.inn) yield* env.inn(step.inn);
    return;
  }
  if ('heal' in step) {
    for (const u of g.force) if (u.alive) fullHeal(u);
    audio.sfx('heal');
    return;
  }
  if ('battle' in step) {
    closeDialog();
    if (env.battle) yield* env.battle(step.battle);
    return;
  }
  if ('chapter' in step) {
    closeDialog();
    if (env.chapter) yield* env.chapter(step.chapter);
    return;
  }
  if ('ending' in step) {
    closeDialog();
    if (env.ending) yield* env.ending();
    return;
  }
  if ('removeNpc' in step) {
    env.removeNpc?.(step.removeNpc);
    return;
  }
  if ('wait' in step) {
    yield step.wait;
    return;
  }
  if ('fade' in step) {
    if (step.fade === 'out') yield* fadeOut(18);
    else yield* fadeIn(18);
    return;
  }
  if ('custom' in step) {
    const r = step.custom(g);
    if (r) yield* r;
    return;
  }
}
