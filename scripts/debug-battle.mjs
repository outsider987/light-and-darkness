// Plays one battle with a boosted party and prints the battle narrative (every dialog line) plus HP snapshots.
import { chromium } from 'playwright';
import fs from 'node:fs';
const id = process.argv[2] ?? 'b23';
const url = process.env.URL ?? 'http://localhost:4173/';
const browser = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
const ev = (fn, ...a) => page.evaluate(fn, ...a);
const tap = async (k) => { await page.keyboard.press(k); await page.waitForTimeout(30); };
await page.goto(url);
await page.waitForFunction(() => window.lad && window.lad.scenes.stack.length > 0);
await ev(() => { window.lad.speed.value = 6; window.lad.audio.muted = true; });
await ev((id) => {
  const g = window.lad.newGame();
  const chapter = window.lad.BATTLES[id].chapter;
  for (const u of g.force) { u.maxHp = u.hp = 30 + chapter * 12; u.maxMp = u.mp = 10 + chapter * 5; u.att = 10 + chapter * 8; u.def = 6 + chapter * 5; u.agi = 10 + chapter * 3; }
  window.lad.director.startBattle(g, id);
}, id);
let lastLine = '';
const t0 = Date.now();
while (Date.now() - t0 < 180000) {
  const st = await ev(() => {
    const s = window.lad.scenes.top;
    if (!s || s.kind !== 'battle') return { gone: s?.kind };
    const top = window.lad.widgets[window.lad.widgets.length - 1];
    return { result: s.result, waiting: window.lad.dialog.waiting, line: window.lad.dialog.lines.join(' '), radial: top?.kind === 'radial' ? top.entries.map((e) => !!e.disabled) : null, menu: top?.kind === 'menu', hlAlt: s.hlAlt.size, hl: s.hl.size, cursorOn: s.cursorOn, team: s.activeUnit?.team, active: s.activeUnit?.name, round: s.round,
      force: s.units.filter((u) => u.team === 'force').map((u) => `${u.name}:${u.hp}`).join(' '), status: !!s.statusUnit };
  });
  if (st.gone) { console.log('left battle ->', st.gone); break; }
  if (st.waiting) {
    if (st.line !== lastLine) { console.log(`[r${st.round}] ${st.line}`); lastLine = st.line; }
    await tap('KeyZ'); continue;
  }
  if (st.status) { await tap('KeyX'); continue; }
  if (st.radial) { if (!st.radial[0]) await tap('KeyZ'); else { await tap('ArrowLeft'); await tap('KeyZ'); } continue; }
  if (st.menu) { await tap('KeyX'); continue; }
  if (st.hlAlt > 0) { await tap('KeyZ'); continue; }
  if (st.cursorOn && st.hl > 0 && st.team === 'force') {
    console.log(`  == ${st.active}'s turn (round ${st.round}) HP: ${st.force}`);
    await ev(() => { const s = window.lad.scenes.top; const en = s.units.filter((e) => e.alive && e.team === 'enemy'); let best = null, bd = 1e9; for (const k of s.hl.keys()) { const [x, y] = k.split(',').map(Number); for (const e of en) { const d = Math.abs(e.x - x) + Math.abs(e.y - y); if (d < bd) { bd = d; best = [x, y]; } } } if (best) s.cursor = { x: best[0], y: best[1] }; });
    await tap('KeyZ'); continue;
  }
  await page.waitForTimeout(30);
}
await browser.close();
