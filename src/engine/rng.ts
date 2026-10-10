/** Deterministic PRNG (mulberry32). Game uses one global instance seeded from time. */
export class RNG {
  private s: number;
  constructor(seed = (Date.now() ^ 0x9e3779b9) >>> 0) {
    this.s = seed >>> 0;
  }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** integer in [lo, hi] inclusive */
  int(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  seed(s: number): void {
    this.s = s >>> 0;
  }
}
export const rng = new RNG();
