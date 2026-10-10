/**
 * Minimal coroutine runner. Game flows (dialog, battles, cutscenes) are written
 * as generator functions that yield:
 *   - a number: wait that many frames
 *   - a function: wait until it returns true
 *   - null/undefined: wait one frame
 * Sub-flows are composed with `yield*`.
 */
export type CoYield = number | (() => boolean) | null | undefined;
export type Co<T = void> = Generator<CoYield, T, unknown>;

export class Runner {
  private co: Co<unknown> | null = null;
  private waitFrames = 0;
  private until: (() => boolean) | null = null;
  done = true;

  start<T>(co: Co<T>): void {
    this.co = co as Co<unknown>;
    this.waitFrames = 0;
    this.until = null;
    this.done = false;
  }

  stop(): void {
    this.co = null;
    this.done = true;
  }

  update(): void {
    if (!this.co) return;
    if (this.waitFrames > 0) {
      this.waitFrames--;
      return;
    }
    if (this.until) {
      if (!this.until()) return;
      this.until = null;
    }
    // Advance until the coroutine asks to wait.
    for (let guard = 0; guard < 10000; guard++) {
      const r = this.co.next();
      if (r.done) {
        this.co = null;
        this.done = true;
        return;
      }
      const y = r.value;
      if (typeof y === 'number') {
        if (y > 0) {
          this.waitFrames = y - 1;
          return;
        }
        continue;
      }
      if (typeof y === 'function') {
        if (!y()) {
          this.until = y;
          return;
        }
        continue;
      }
      return; // null/undefined: one frame
    }
  }
}

export function* wait(frames: number): Co<void> {
  yield frames;
}
export function* waitUntil(fn: () => boolean): Co<void> {
  yield fn;
}
