// Exit coverage: for every location exit (fresh game vs. everything-won flags), trigger the exit and
// verify the destination scene loads without errors.
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
await ev(() => { window.lad.speed.value = 8; window.lad.audio.muted = true; });
const locs = await ev(() => Object.entries(window.lad.LOCATIONS).map(([id, l]) => [id, l.exits.length]));
let checked = 0, problems = 0;
for (const [loc, n] of locs) {
  for (let i = 0; i < n; i++) {
    for (const variant of ['fresh', 'late']) {
      const r = await ev(async ([loc, i, variant]) => {
        const lad = window.lad;
        const g = lad.newGame();
        if (variant === 'late') { for (const b of Object.keys(lad.BATTLES)) g.flags['won:' + b] = true; for (const f of ['king_talked', 'alterone_freed', 'alterone_prison', 'orb_returned', 'otrant_quest', 'zylo_cured', 'quarry_quest', 'prompt_arrived', 'rindo_arrived', 'bustoke_arrived', 'pao_arrived', 'waral_arrived', 'rudo_arrived', 'rf_arrived', 'tower_arrived', 'ch1_started']) g.flags[f] = true; }
        const e = lad.LOCATIONS[loc].exits[i];
        lad.director.enterLocation(g, loc, e.x, e.y, 'down');
        const s = lad.scenes.top;
        // skip onEnter scripts: stop the runner, then trigger the exit
        s.runner.stop(); lad.dialog.close(); lad.widgets.length = 0;
        const blocked = e.cond && !e.cond(g);
        s.tryExit();
        const t0 = Date.now();
        while (Date.now() - t0 < 4000) {
          await new Promise((r) => setTimeout(r, 50));
          const top = lad.scenes.top;
          if (top !== s) return { to: top.kind, loc: lad.state?.location, blocked };
          if (blocked && lad.dialog.active) return { to: 'blocked', blocked };
          if (s.runner.done && (s.player.x !== e.x || s.player.y !== e.y)) return { to: 'moved', blocked };
        }
        return { to: 'none', blocked };
      }, [loc, i, variant]);
      checked++;
      const ok = r.to === 'battle' || r.to === 'field' || r.to === 'blocked' || r.to === 'moved' || (r.blocked && r.to === 'none');
      if (!ok) { problems++; console.log(`PROBLEM ${loc} exit#${i} (${variant}) -> ${JSON.stringify(r)}`); }
    }
  }
}
await browser.close();
console.log(`exits checked: ${checked}, problems: ${problems}`);
if (errors.length) console.log('ERRORS\n' + [...new Set(errors)].join('\n'));
process.exit(problems || errors.length ? 1 : 0);
