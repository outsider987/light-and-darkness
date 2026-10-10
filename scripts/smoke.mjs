// Headless smoke test: drives the game through title, opening, town, menus, shop, church and a full battle.
// State-driven (polls window.lad) so it is robust to timing. Collects console/page errors and screenshots.
import { chromium } from 'playwright';
import fs from 'node:fs';

const url = process.env.URL ?? 'http://localhost:5173/';
const out = 'test-results';
fs.mkdirSync(out, { recursive: true });
const exe = fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined;
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 960, height: 760 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack ?? '')));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
const tap = async (key, n = 1, delay = 90) => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(delay); } };
const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };
const ev = (fn, ...args) => page.evaluate(fn, ...args);
const sceneName = () => ev(() => window.lad.scenes.top?.kind);
const waitFor = async (fn, timeout = 20000, label = '') => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await ev(fn)) return true;
    await page.waitForTimeout(60);
  }
  throw new Error('timeout waiting for ' + label);
};
/** Press Z through any open dialog until the field is idle (no script running, no widgets). */
const clickThrough = async (timeout = 30000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const st = await ev(() => {
      const s = window.lad.scenes.top;
      const top = window.lad.widgets[window.lad.widgets.length - 1];
      return { scene: s?.kind, idle: s?.runner?.done === true && window.lad.widgets.length === 0, waiting: window.lad.dialog.waiting, widgets: window.lad.widgets.length, top: top?.kind, card: !!s?.card };
    });
    if (st.scene === 'field' && st.idle && !st.card) return;
    if (st.waiting || st.card) await tap('KeyZ', 1, 60);
    else if (st.top === 'menu' || st.top === 'radial') await tap('KeyX', 1, 120);
    else await page.waitForTimeout(60);
  }
  throw new Error('clickThrough timeout');
};
/** Talk (Z) and advance text until a menu (2+ widgets) is open. */
const untilMenu = async (timeout = 10000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const st = await ev(() => ({ w: window.lad.widgets.length, waiting: window.lad.dialog.waiting }));
    if (st.w >= 2) return;
    if (st.waiting) await tap('KeyZ', 1, 80); else await page.waitForTimeout(60);
  }
  throw new Error('untilMenu timeout');
};
const teleport = (x, y, dir) => ev(([x, y, dir]) => { const s = window.lad.scenes.top; Object.assign(s.player, { x, y, tx: x, ty: y, px: x * 24, py: y * 24, dir, moving: false }); }, [x, y, dir]);

await page.goto(url);
await page.waitForFunction(() => window.lad && window.lad.scenes.stack.length > 0, null, { timeout: 20000 });
await page.waitForTimeout(1200);
await shot('01-title');
console.log('scene:', await sceneName());

// New game -> opening -> Guardiana
await tap('Enter');
await page.waitForTimeout(600);
for (let i = 0; i < 25; i++) await tap('KeyZ', 1, 120);
// hero name entry: type "Max" is the default; move to END and confirm
await waitFor(() => window.lad.widgets[window.lad.widgets.length - 1]?.kind === 'name', 20000, 'name entry');
await shot('01b-name-entry');
await ev(() => { const e = window.lad.widgets[window.lad.widgets.length - 1]; e.cy = 4; e.cx = 12; });
await tap('KeyZ');
await waitFor(() => window.lad.scenes.top?.kind === 'field', 20000, 'field');
await page.waitForTimeout(400);
await shot('02-chapter-card');
await clickThrough();
await shot('03-guardiana');
console.log('scene:', await sceneName(), 'loc:', await ev(() => window.lad.state?.location));

// walk + field menu + status
await hold('ArrowUp', 700);
await hold('ArrowLeft', 500);
await shot('04-walk');
await tap('KeyC');
await page.waitForTimeout(250);
await shot('05-field-menu');
await tap('KeyZ'); await page.waitForTimeout(250);
await tap('KeyZ'); await page.waitForTimeout(250);
await shot('06-status');
await tap('KeyX', 2, 200);
await tap('KeyX', 2, 200);
await clickThrough();

// king
await teleport(15, 4, 'up');
await tap('KeyZ');
await page.waitForTimeout(400);
await shot('07-king-dialog');
await clickThrough();
console.log('king_talked:', await ev(() => window.lad.state.flags.king_talked), 'gold:', await ev(() => window.lad.state.gold));

// recruit Gort
await teleport(27, 22, 'up');
await tap('KeyZ');
await waitFor(() => window.lad.widgets.length > 1 || window.lad.dialog.waiting, 5000, 'gort');
// click through until the Yes/No menu shows (2 widgets: dialog + menu)
for (let i = 0; i < 10; i++) {
  const st = await ev(() => ({ w: window.lad.widgets.length, waiting: window.lad.dialog.waiting }));
  if (st.w >= 2) break;
  await tap('KeyZ', 1, 150);
}
await shot('08-gort-ask');
await tap('KeyZ');
await clickThrough();
console.log('force:', await ev(() => window.lad.state.force.map((u) => u.id).join(',')));

// shop: buy a middle item
await teleport(9, 15, 'up');
await tap('KeyZ');
await untilMenu();
await tap('KeyZ'); // Buy
await page.waitForTimeout(300);
await shot('09-shop');
await tap('ArrowDown', 5, 80); // medical herb
await tap('KeyZ'); // choose
await untilMenu(); // "who will carry it?" -> member list
await tap('KeyZ'); // first member
await page.waitForTimeout(400);
await clickThrough();
console.log('gold after shop:', await ev(() => window.lad.state.gold), 'max items:', await ev(() => window.lad.state.force[0].items.join(',')));

// church save
await teleport(22, 15, 'up');
await tap('KeyZ');
await untilMenu();
await tap('KeyZ'); // Save
await page.waitForTimeout(400);
await shot('10-church');
await tap('KeyX', 3, 250);
await clickThrough();
console.log('saved:', await ev(() => !!localStorage.getItem('light-and-darkness:save1')));

// exit town through the south gate -> battle 1
await teleport(14, 27, 'down');
await hold('ArrowDown', 900);
await waitFor(() => window.lad.scenes.top?.kind === 'battle', 10000, 'battle');
await page.waitForTimeout(1000);
await shot('11-battle-start');
console.log('scene:', await sceneName());

// Battle policy, state-driven.
const deadline = Date.now() + 240000;
let shots = 0;
let turns = 0;
while (Date.now() < deadline) {
  const st = await ev(() => {
    const s = window.lad.scenes.top;
    if (!s || s.kind !== 'battle') return { scene: s?.kind };
    const top = window.lad.widgets[window.lad.widgets.length - 1];
    return {
      scene: 'battle', result: s.result, cursorOn: s.cursorOn, hl: s.hl.size, hlAlt: s.hlAlt.size,
      active: s.activeUnit?.name, team: s.activeUnit?.team, anim: !!s.anim, round: s.round,
      radial: top?.kind === 'radial' ? top.entries.map((e) => !!e.disabled) : null,
      menu: top?.kind === 'menu', dlgWaiting: window.lad.dialog.waiting, status: !!s.statusUnit,
      enemies: s.units.filter((u) => u.alive && u.team === 'enemy').length, force: s.units.filter((u) => u.alive && u.team === 'force').length,
    };
  });
  if (st.scene !== 'battle') { console.log('left battle ->', st.scene); break; }
  if (st.dlgWaiting) { await tap('KeyZ', 1, 40); continue; }
  if (st.status) { await tap('KeyX', 1, 100); continue; }
  if (st.radial) {
    if (!st.radial[0]) { await tap('KeyZ', 1, 150); } // attack
    else { await tap('ArrowLeft', 1, 60); await tap('KeyZ', 1, 150); } // stay (left icon)
    continue;
  }
  if (st.menu) { await tap('KeyX', 1, 100); continue; }
  if (st.hlAlt > 0) { await tap('KeyZ', 1, 150); continue; } // confirm target
  if (st.cursorOn && st.hl > 0 && st.team === 'force') {
    turns++;
    await ev(() => {
      const s = window.lad.scenes.top;
      const enemies = s.units.filter((e) => e.alive && e.team === 'enemy');
      let best = null, bd = Infinity;
      for (const k of s.hl.keys()) {
        const [x, y] = k.split(',').map(Number);
        for (const e of enemies) {
          const d = Math.abs(e.x - x) + Math.abs(e.y - y);
          if (d < bd) { bd = d; best = [x, y]; }
        }
      }
      if (best) s.cursor = { x: best[0], y: best[1] };
    });
    await tap('KeyZ', 1, 150);
    if (shots < 2) { await page.waitForTimeout(700); await shot(`12-battle-${shots}`); shots++; }
    continue;
  }
  await page.waitForTimeout(80);
}
console.log('turns taken:', turns);
await shot('13-after-battle');
await clickThrough(60000).catch(() => {});
await shot('14-after-battle-field');
console.log('final scene:', await sceneName(), 'loc:', await ev(() => window.lad.state?.location), 'flags:', await ev(() => JSON.stringify(window.lad.state?.flags)));
console.log('force levels:', await ev(() => window.lad.state.force.map((u) => `${u.name}:L${u.level}/${u.exp}xp hp${u.hp}/${u.maxHp}${u.alive ? '' : ' DEAD'}`).join(' ')));

await browser.close();
if (errors.length) {
  console.log('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('SMOKE OK');
