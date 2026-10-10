/** Optional generated assets (painted backdrops, streamed music). Everything degrades gracefully when a file is missing. */
const images = new Map<string, HTMLImageElement>();
const pending = new Set<string>();

export const BASE: string = (import.meta as unknown as { env: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

export function image(id: string): HTMLImageElement | null {
  const img = images.get(id);
  if (img) return img;
  if (!pending.has(id)) {
    pending.add(id);
    const el = new Image();
    el.onload = () => images.set(id, el);
    el.onerror = () => { /* keep procedural fallback */ };
    el.src = `${BASE}bg/${id}.png`;
  }
  return null;
}

const unitImages = new Map<string, HTMLImageElement>();
const unitPending = new Set<string>();

/** Large battle sprite for a unit (force member id or enemy type id); null until loaded / if missing. */
export function unitImage(id: string): HTMLImageElement | null {
  const img = unitImages.get(id);
  if (img) return img;
  if (!unitPending.has(id)) {
    unitPending.add(id);
    const el = new Image();
    el.onload = () => unitImages.set(id, el);
    el.src = `${BASE}sprites/${id}.png`;
  }
  return null;
}

export function preloadImages(ids: string[]): void {
  for (const id of ids) image(id);
}

export const BACKDROP_IDS = ['grass', 'forest', 'hills', 'water', 'sea', 'castle', 'cave', 'ruins', 'wasteland', 'lava', 'throne', 'tower', 'title', 'ending'];
export const MUSIC_IDS = ['title', 'opening', 'town', 'hq', 'church', 'dungeon', 'battle', 'boss', 'victory', 'levelup', 'gameover', 'sea', 'castle', 'dark', 'ending'];
