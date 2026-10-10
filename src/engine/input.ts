export type Btn = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'c' | 'start';

const KEYMAP: Record<string, Btn> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Enter: 'a', Space: 'a', KeyK: 'a',
  KeyX: 'b', Escape: 'b', Backspace: 'b', KeyJ: 'b',
  KeyC: 'c', ShiftLeft: 'c', ShiftRight: 'c', KeyL: 'c', Tab: 'c',
  KeyP: 'start',
};

const held = new Set<Btn>();
const pressed = new Set<Btn>();
const released = new Set<Btn>();
let repeatBtn: Btn | null = null;
let repeatTimer = 0;
const REPEAT_DELAY = 14; // frames
const REPEAT_RATE = 5;
export const hooks: { onKey?: (code: string) => void } = {};

function down(b: Btn): void {
  if (!held.has(b)) {
    held.add(b);
    pressed.add(b);
  }
}
function up(b: Btn): void {
  if (held.has(b)) {
    held.delete(b);
    released.add(b);
  }
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  hooks.onKey?.(e.code);
  const b = KEYMAP[e.code];
  if (b) {
    e.preventDefault();
    down(b);
  }
});
window.addEventListener('keyup', (e) => {
  const b = KEYMAP[e.code];
  if (b) {
    e.preventDefault();
    up(b);
  }
});
window.addEventListener('blur', () => {
  held.clear();
});

// Touch controls
const touchEl = document.getElementById('touch');
if (touchEl) {
  const enableTouch = () => document.body.classList.add('touch');
  window.addEventListener('touchstart', enableTouch, { once: true, passive: true });
  for (const el of Array.from(touchEl.querySelectorAll<HTMLElement>('.tb'))) {
    const b = el.dataset.btn as Btn;
    const start = (e: Event) => { e.preventDefault(); down(b); };
    const end = (e: Event) => { e.preventDefault(); up(b); };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
  }
}

const DIRS: Btn[] = ['up', 'down', 'left', 'right'];

export const input = {
  held: (b: Btn): boolean => held.has(b),
  pressed: (b: Btn): boolean => pressed.has(b),
  released: (b: Btn): boolean => released.has(b),
  /** Confirm button pressed this frame. */
  ok: (): boolean => pressed.has('a'),
  cancel: (): boolean => pressed.has('b'),
  /** Direction with auto-repeat (for cursors and menus). Returns null if none. */
  dir(): Btn | null {
    for (const d of DIRS) if (pressed.has(d)) return d;
    return repeatBtn && repeatTimer === 0 ? repeatBtn : null;
  },
  /** Direction currently held (for walking). */
  heldDir(): Btn | null {
    for (const d of DIRS) if (held.has(d)) return d;
    return null;
  },
  /** Programmatic input (touch, tests, demos). */
  inject(b: Btn, isDown = true): void {
    if (isDown) down(b); else up(b);
  },
  tap(b: Btn): void {
    down(b);
    queueMicrotask(() => { /* released next frame by endFrame */ });
    tapQueue.push(b);
  },
  endFrame(): void {
    pressed.clear();
    released.clear();
    for (const b of tapQueue) up(b);
    tapQueue.length = 0;
    // repeat handling
    const d = DIRS.find((x) => held.has(x)) ?? null;
    if (d !== repeatBtn) {
      repeatBtn = d;
      repeatTimer = REPEAT_DELAY;
    } else if (repeatBtn) {
      if (repeatTimer > 0) repeatTimer--;
      else repeatTimer = REPEAT_RATE;
    }
  },
  clear(): void {
    held.clear();
    pressed.clear();
    released.clear();
    repeatBtn = null;
  },
};
const tapQueue: Btn[] = [];
