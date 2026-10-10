import { chromium } from 'playwright';
import fs from 'node:fs';
const browser = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const ev = (fn, ...a) => page.evaluate(fn, ...a);
await page.goto(process.env.URL ?? 'http://localhost:4173/');
await page.waitForFunction(() => window.lad && window.lad.scenes.stack.length > 0);
await ev(() => { window.lad.speed.value = 8; window.lad.audio.muted = true; const g = window.lad.newGame(); for (const b of Object.keys(window.lad.BATTLES)) g.flags['won:' + b] = true; g.flags.tower_arrived = true; g.flags.tower_after = true; window.lad.director.enterLocation(g, 'tower', 9, 10, 'down'); });
const t0 = Date.now();
let seen = new Set();
while (Date.now() - t0 < 120000) {
  const st = await ev(() => ({ kind: window.lad.scenes.top?.kind, waiting: window.lad.dialog.waiting, done: window.lad.scenes.top?.done }));
  seen.add(st.kind);
  if (st.kind === 'title') break;
  if (st.waiting || (st.kind === 'ending' && st.done)) await page.keyboard.press('KeyZ');
  else if (st.kind === 'ending') { await page.keyboard.down('KeyZ'); await page.waitForTimeout(200); await page.keyboard.up('KeyZ'); }
  await page.waitForTimeout(60);
}
if (seen.has('ending')) await page.screenshot({ path: 'test-results/ending.png' });
console.log('scenes seen:', [...seen].join(' -> '), 'elapsed', ((Date.now() - t0) / 1000).toFixed(0) + 's');
await browser.close();
if (errors.length) { console.log('ERRORS\n' + errors.join('\n')); process.exit(1); }
console.log('ENDING OK');
