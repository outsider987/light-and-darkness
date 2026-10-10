// Visual tour: screenshot every location (at a walkable spawn) and every battle map (after intro),
// then assemble contact sheets in test-results/tour/.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const url = process.env.URL ?? 'http://localhost:4173/';
const out = 'test-results/tour';
fs.mkdirSync(out, { recursive: true });
const exe = fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined;
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
const ev = (fn, ...a) => page.evaluate(fn, ...a);
const tap = async (key, n = 1, delay = 40) => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(delay); } };
await page.goto(url);
await page.waitForFunction(() => window.lad && window.lad.scenes.stack.length > 0, null, { timeout: 20000 });
await page.waitForTimeout(400);
await ev(() => { window.lad.speed.value = 4; window.lad.audio.muted = true; });
const settle = async (ms = 1500) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const st = await ev(() => ({ waiting: window.lad.dialog.waiting, card: !!window.lad.scenes.top?.card, idle: window.lad.scenes.top?.runner?.done }));
    if (st.waiting || st.card) await tap('KeyZ');
    else if (st.idle) break;
    else await page.waitForTimeout(40);
  }
};
const locations = await ev(() => Object.keys(window.lad.LOCATIONS));
for (const loc of locations) {
  const spawn = await ev((loc) => { const l = window.lad.LOCATIONS[loc]; for (let y = 2; y < l.rows.length; y++) for (let x = 2; x < l.rows[y].length; x++) if ('.,sFr:d'.includes(l.rows[y][x]) && !l.npcs.some((n) => n.x === x && n.y === y)) return [x, y]; return [1, 1]; }, loc);
  await ev(([loc, x, y]) => { const g = window.lad.newGame(); for (const b of Object.keys(window.lad.BATTLES)) g.flags['won:' + b] = true; window.lad.director.enterLocation(g, loc, x, y, 'down'); }, [loc, spawn[0], spawn[1]]);
  await settle();
  await page.screenshot({ path: `${out}/loc-${loc}.png` });
}
const battles = await ev(() => Object.keys(window.lad.BATTLES));
for (const id of battles) {
  await ev((id) => {
    const g = window.lad.newGame();
    const chapter = window.lad.BATTLES[id].chapter;
    for (const u of g.force) { u.maxHp = u.hp = 30 + chapter * 12; u.att = 10 + chapter * 8; u.def = 6 + chapter * 5; u.agi = 10 + chapter * 3; }
    window.lad.director.startBattle(g, id);
  }, id);
  await page.waitForTimeout(300);
  // click through the intro, then wait for the first player's move highlight
  const t0 = Date.now();
  while (Date.now() - t0 < 6000) {
    const st = await ev(() => ({ waiting: window.lad.dialog.waiting, hl: window.lad.scenes.top?.hl?.size ?? 0 }));
    if (st.waiting) await tap('KeyZ');
    else if (st.hl > 0) break;
    else await page.waitForTimeout(40);
  }
  await page.screenshot({ path: `${out}/battle-${id}.png` });
}
await browser.close();
// contact sheets
const py = `
import glob, os, sys
from PIL import Image, ImageDraw
out = sys.argv[1]
for kind in ['loc', 'battle']:
    fs = sorted(glob.glob(os.path.join(out, kind + '-*.png')))
    if not fs: continue
    cols = 4
    w, h = 320, 240
    rows = (len(fs) + cols - 1) // cols
    sheet = Image.new('RGB', (w * cols, (h + 12) * rows), 'black')
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(fs):
        im = Image.open(f).resize((w, h))
        x, y = (i % cols) * w, (i // cols) * (h + 12)
        sheet.paste(im, (x, y + 12))
        d.text((x + 2, y), os.path.basename(f)[:-4], fill='white')
    sheet.save(os.path.join(out, 'sheet-' + kind + '.png'))
    print(kind, len(fs))
`;
execFileSync('python3', ['-c', py, out], { stdio: 'inherit' });
