import { chromium } from 'playwright';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const out = 'test-results/visual';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const ev = (fn, ...a) => page.evaluate(fn, ...a);
const tap = async (k, n = 1, d = 60) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(d); } };
await page.goto(process.env.URL ?? 'http://localhost:4173/');
await page.waitForFunction(() => window.lad && window.lad.scenes.stack.length > 0);
await page.waitForTimeout(2500);
await tap('ArrowDown'); // user gesture -> audio unlock
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/title.png` });
console.log('audio:', await ev(() => ({ state: window.lad.audio.ctx?.state, playing: window.lad.audio.playing, titleBuffer: !!window.lad.audio.buffers?.get('title'), streamNodes: window.lad.audio.streamNodes?.length })));
await tap('ArrowUp'); await tap('Enter');
await page.waitForTimeout(3500);
await page.screenshot({ path: `${out}/opening.png` });
// battle cutscene with backdrop
await ev(() => { const g = window.lad.newGame(); for (const u of g.force) { u.att = 30; u.maxHp = u.hp = 60; } window.lad.director.startBattle(g, 'b1'); });
await page.waitForTimeout(800);
for (let i = 0; i < 6; i++) await tap('KeyZ', 1, 300);
// deterministic cutscene: put Max next to a goblin and run the attack flow directly
await ev(() => { const s = window.lad.scenes.top; const max = s.units[0]; const e = s.units.find((u) => u.team === 'enemy' && u.alive); max.x = e.x; max.y = e.y + 1; s.runner.stop(); s.runner.start(s.doAttack(max, e)); });
let shot = false;
const t0 = Date.now();
while (Date.now() - t0 < 15000 && !shot) {
  const st = await ev(() => ({ anim: !!window.lad.scenes.top?.anim, waiting: window.lad.dialog.waiting }));
  if (st.anim && st.waiting) { await page.screenshot({ path: `${out}/cutscene.png` }); shot = true; break; }
  if (st.waiting) await tap('KeyZ');
  await page.waitForTimeout(40);
}
console.log('cutscene shot:', shot, 'music now:', await ev(() => ({ playing: window.lad.audio.playing, streamNodes: window.lad.audio.streamNodes?.length, seqTimer: window.lad.audio.timer !== null })));
// ending screen with art
await ev(() => { const g = window.lad.newGame(); window.lad.director.ending(g); });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/ending.png` });
await browser.close();
const py = `
from PIL import Image
import glob, os, sys
out = sys.argv[1]
fs = [os.path.join(out, n + '.png') for n in ['title', 'opening', 'cutscene', 'ending'] if os.path.exists(os.path.join(out, n + '.png'))]
ims = [Image.open(f).resize((480, 360)) for f in fs]
sheet = Image.new('RGB', (960, 720), 'black')
for i, im in enumerate(ims): sheet.paste(im, ((i % 2) * 480, (i // 2) * 360))
sheet.save(os.path.join(out, 'sheet.png')); print(len(ims))
`;
execFileSync('python3', ['-c', py, out], { stdio: 'inherit' });
if (errors.length) { console.log('ERRORS\n' + errors.join('\n')); process.exit(1); }
console.log('VISUAL OK');
