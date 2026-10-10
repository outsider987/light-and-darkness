// Full-campaign automation: plays every battle with a boosted party and runs every NPC script
// in every location, against a running server (URL env, default preview on :4173).
// Reports errors (console/page), battles that could not be won, and timing.
import { chromium } from 'playwright';
import fs from 'node:fs';

const url = process.env.URL ?? 'http://localhost:4173/';
const only = process.env.ONLY; // e.g. "b5" or "loc:rindo"
const out = 'test-results/playthrough';
fs.mkdirSync(out, { recursive: true });
const exe = fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined;
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 960, height: 760 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack ?? '').split('\n').slice(0, 4).join('\n')));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const ev = (fn, ...args) => page.evaluate(fn, ...args);
const tap = async (key, n = 1, delay = 40) => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(delay); } };

await page.goto(url);
await page.waitForFunction(() => window.lad && window.lad.scenes.stack.length > 0, null, { timeout: 20000 });
await page.waitForTimeout(500);
await ev(([full, god]) => { window.lad.speed.value = 6; window.lad.audio.muted = true; window.__full = full; window.__god = god; }, [!!process.env.FULL, !!process.env.GOD]);

const battles = await ev(() => Object.keys(window.lad.BATTLES));
const locations = await ev(() => Object.keys(window.lad.LOCATIONS));

/** Build a strong party suited to a chapter and start the battle. */
const startBattle = (id) => ev((id) => {
  const lad = window.lad;
  const g = lad.newGame();
  const chapter = lad.BATTLES[id].chapter;
  if (window.__full) for (const id of ['gong', 'gort', 'mae', 'khris', 'anri', 'zylo']) lad.joinForce(g, id);
  g.party = g.party.slice(0, 12);
  for (const u of g.force) {
    u.level = Math.min(20, 2 + chapter * 2);
    u.maxHp = u.hp = 30 + chapter * 12;
    u.maxMp = u.mp = 10 + chapter * 5;
    u.att = 10 + chapter * 8;
    u.def = 6 + chapter * 5;
    u.agi = 10 + chapter * 3;
    u.mov += 1;
    if (window.__god) { u.maxHp = u.hp = 400; u.def += 20; }
    if (u.spells.length) u.spells = u.spells.map((s) => ({ ...s, level: Math.min(4, 1 + Math.floor(chapter / 2)) }));
  }
  g.lastChurch = { location: 'guardiana', x: 22, y: 15 };
  lad.director.startBattle(g, id);
}, id);

async function playBattle(id) {
  const t0 = Date.now();
  await startBattle(id);
  await page.waitForTimeout(300);
  let turns = 0, stalls = 0, lastSig = '', lastResult = null;
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    const st = await ev(() => {
      const s = window.lad.scenes.top;
      if (!s || s.kind !== 'battle') return { scene: s?.kind };
      const top = window.lad.widgets[window.lad.widgets.length - 1];
      return {
        scene: 'battle', result: s.result, cursorOn: s.cursorOn, hl: s.hl.size, hlAlt: s.hlAlt.size, round: s.round,
        active: s.activeUnit?.name, team: s.activeUnit?.team, anim: !!s.anim,
        radial: top?.kind === 'radial' ? top.entries.map((e) => !!e.disabled) : null,
        menu: top?.kind === 'menu', dlgWaiting: window.lad.dialog.waiting, status: !!s.statusUnit, runnerDone: s.runner.done,
        enemies: s.units.filter((u) => u.alive && u.team === 'enemy').length, force: s.units.filter((u) => u.alive && u.team === 'force').length,
      };
    });
    if (st.scene !== 'battle') return { id, ok: true, turns, ms: Date.now() - t0, left: st.scene, result: lastResult };
    if (st.result) lastResult = st.result;
    const sig = JSON.stringify(st);
    if (sig === lastSig) { stalls++; if (stalls > 400) return { id, ok: false, turns, ms: Date.now() - t0, stuck: st }; } else stalls = 0;
    lastSig = sig;
    if (st.dlgWaiting) { await tap('KeyZ'); continue; }
    if (st.status) { await tap('KeyX'); continue; }
    if (st.radial) {
      if (!st.radial[0]) await tap('KeyZ'); // attack
      else if (!st.radial[1] && st.active !== 'Max' && Math.random() < 0.5) { await tap('ArrowRight'); await tap('KeyZ'); } // magic sometimes (never Max: his spell is Egress)
      else { await tap('ArrowLeft'); await tap('KeyZ'); } // stay
      continue;
    }
    if (st.menu) { await tap('KeyZ'); await page.waitForTimeout(60); continue; } // pick first spell/level
    if (st.hlAlt > 0) { await tap('KeyZ'); continue; }
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
      await tap('KeyZ');
      continue;
    }
    await page.waitForTimeout(40);
  }
  return { id, ok: false, turns, ms: Date.now() - t0, timeout: true };
}

const results = [];
if (!only || !only.startsWith('loc:')) {
  for (const id of battles) {
    if (only && only !== id) continue;
    const r = await playBattle(id);
    const won = await ev((id) => !!window.lad.state?.flags['won:' + id], id);
    r.won = won;
    results.push(r);
    console.log(`${id}: ${r.ok ? 'finished' : 'FAILED'} result=${r.result} won=${won} turns=${r.turns} ${(r.ms / 1000).toFixed(0)}s${r.stuck ? ' stuck=' + JSON.stringify(r.stuck) : ''}`);
    await page.screenshot({ path: `${out}/${id}.png` });
    if (errors.length) console.log('errors so far:', errors.length);
  }
}

// Run every NPC script and onEnter in every location.
const clickThrough = async (timeout = 20000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const st = await ev(() => {
      const s = window.lad.scenes.top;
      const top = window.lad.widgets[window.lad.widgets.length - 1];
      return { kind: s?.kind, idle: s?.runner?.done === true && window.lad.widgets.length === 0 && !s?.card, waiting: window.lad.dialog.waiting, top: top?.kind, card: !!s?.card };
    });
    if (st.kind !== 'field') return st.kind; // left the field (battle / ending)
    if (st.idle) return 'idle';
    if (st.waiting || st.card) await tap('KeyZ');
    else if (st.top === 'menu' || st.top === 'radial') await tap('KeyX', 1, 80);
    else await page.waitForTimeout(30);
  }
  return 'timeout';
};
const locResults = [];
if (!only || only.startsWith('loc:')) {
  for (const loc of locations) {
    if (only && only !== 'loc:' + loc) continue;
    const npcs = await ev((loc) => window.lad.LOCATIONS[loc].npcs.map((n) => n.id), loc);
    const spawn = await ev((loc) => { const l = window.lad.LOCATIONS[loc]; const rows = l.rows; for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) if ('.,sFCr:d'.includes(rows[y][x]) && !l.npcs.some((n) => n.x === x && n.y === y) && !l.exits.some((e) => x >= e.x && x < e.x + (e.w ?? 1) && y >= e.y && y < e.y + (e.h ?? 1))) return [x, y]; return [1, 1]; }, loc);
    let bad = 0;
    for (const variant of ['fresh', 'late']) {
      await ev(([loc, x, y, variant]) => {
        const lad = window.lad;
        const g = lad.newGame();
        if (variant === 'late') { for (const b of Object.keys(lad.BATTLES)) g.flags['won:' + b] = true; g.gold = 99999; }
        lad.director.enterLocation(g, loc, x, y, 'down');
      }, [loc, spawn[0], spawn[1], variant]);
      await page.waitForTimeout(100);
      let r = await clickThrough();
      if (r !== 'idle') { bad++; console.log(`  ${loc}/onEnter(${variant}) -> ${r}`); continue; }
      for (const id of npcs) {
        const started = await ev(([id]) => { const s = window.lad.scenes.top; const n = s.npcs.find((n) => n.def.id === id); if (!n) return false; s.runner.start(s.run(n.def.script)); return true; }, [id]);
        if (!started) continue;
        await page.waitForTimeout(50);
        r = await clickThrough();
        if (r !== 'idle') {
          bad++;
          console.log(`  ${loc}/${id}(${variant}) -> ${r}`);
          if (r !== 'field') { await ev(([loc, x, y]) => window.lad.director.enterLocation(window.lad.newGame(), loc, x, y, 'down'), [loc, spawn[0], spawn[1]]); await page.waitForTimeout(100); }
        }
      }
    }
    locResults.push({ loc, bad });
    console.log(`${loc}: ${npcs.length} npcs, ${bad} issues`);
  }
}

await browser.close();
const failed = results.filter((r) => !r.won);
console.log('\nBattles:', results.length, 'won:', results.filter((r) => r.won).length, 'failed:', failed.map((r) => r.id).join(',') || 'none');
console.log('Locations with issues:', locResults.filter((l) => l.bad).map((l) => l.loc).join(',') || 'none');
if (errors.length) console.log('ERRORS (' + errors.length + '):\n' + [...new Set(errors)].slice(0, 20).join('\n'));
process.exit(errors.length || failed.length ? 1 : 0);
