import type { Dir, GameState } from './types';

/** Scene-switching hooks, wired up in main.ts to avoid circular imports. */
export const director = {
  enterLocation: (_g: GameState, _location: string, _x: number, _y: number, _dir?: Dir): void => {},
  startBattle: (_g: GameState, _battleId: string): void => {},
  title: (): void => {},
  ending: (_g: GameState): void => {},
  save: (_g: GameState): void => {},
};
