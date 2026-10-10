export const W = 320;
export const H = 240;
export const TILE = 24;

export const canvas = document.getElementById('game') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d', { alpha: false })!;
ctx.imageSmoothingEnabled = false;

export function fitCanvas(): void {
  const sx = window.innerWidth / W;
  const sy = (window.innerHeight - (window.innerHeight > 600 ? 24 : 0)) / H;
  let scale = Math.min(sx, sy);
  // Integer scaling keeps pixels crisp; fall back to fractional on tiny screens.
  if (scale >= 1) scale = Math.floor(scale);
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}

window.addEventListener('resize', fitCanvas);
fitCanvas();

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cx = c.getContext('2d')!;
  cx.imageSmoothingEnabled = false;
  return [c, cx];
}

export function toggleFullscreen(): void {
  const el = document.getElementById('wrap')!;
  if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}
