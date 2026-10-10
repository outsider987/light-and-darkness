// Exercises town UI flows end to end: church (save/revive/promote), HQ (party editor, storage), inn,
// field menu (item use, magic). Asserts state changes and reports page errors.
import { chromium } from 'playwright';
import fs from 'node:fs';
const url = process.env.URL ?? 'http://localhost:4173/';
const browser = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack ?? '').split('\n').slice(0, 3).join('\n')));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const ev = (fn, ...a) => page.evaluate(fn, ...a);
const tap = async (k, n = 1, d = 70) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(d); } };
const fails = [];
const check = (cond, msg) => { if (!cond) { fails.push(msg); console.log('FAIL:', msg); } else console.log('ok:', msg); };
const top = () => ev(() => { const w = window.lad.widgets; const t = w[w.length - 1]; return { kind: t?.kind, n: w.length, idx: t?.index, items: t?.items?.map((i) => i.label), waiting: window.lad.dialog.waiting, line: window.lad.dialog.lines?.join(' '), idle: window.lad.scenes.top?.runner?.done && w.length === 0 }; });
/** advance text until a menu is on top (or idle) */
const untilMenu = async (ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const t = await top(); if (t.kind === 'menu' || t.kind === 'radial') return t; if (t.waiting) await tap('KeyZ'); else if (t.idle) return t; else await page.waitForTimeout(40); } return await top(); };
const untilIdle = async (ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const t = await top(); if (t.idle) return; if (t.waiting) await tap('KeyZ'); else if (t.kind === 'menu' || t.kind === 'radial') await tap('KeyX'); else await page.waitForTimeout(40); } };
const pick = async (index) => { const t = await top(); const cur = t.idx ?? 0; const n = t.items?.length ?? 1; let steps = (index - cur + n) % n; await tap('ArrowDown', steps); await tap('KeyZ'); await page.waitForTimeout(120); };
const talk = async () => { await tap('KeyZ'); await page.waitForTimeout(150); };
const setup = (loc, x, y, dir, mutate) => ev(([loc, x, y, dir, mutate]) => {
  const lad = window.lad; const g = lad.newGame(); g.flags.ch1_started = true; g.flags.king_talked = true; g.flags.rindo_arrived = true; g.gold = 5000;
  // eslint-disable-next-line no-new-func
  new Function('g', mutate)(g);
  lad.director.enterLocation(g, loc, x, y, dir);
}, [loc, x, y, dir, mutate]);

await page.goto(url);
await page.waitForFunction(() => window.lad && window.lad.scenes.stack.length > 0);
await ev(() => { window.lad.speed.value = 4; window.lad.audio.muted = true; });

// ---- church: promote Lowe (level 10), revive Ken (dead), save
await setup('guardiana', 22, 15, 'up', "const lowe = g.force.find(u => u.id === 'lowe'); lowe.level = 10; const ken = g.force.find(u => u.id === 'ken'); ken.alive = false; ken.hp = 0;");
await page.waitForTimeout(300); await untilIdle();
await talk(); let t = await untilMenu(); check(t.kind === 'menu' && t.items?.[0] === 'Save', 'church menu opened: ' + JSON.stringify(t.items));
await pick(3); t = await untilMenu(); check(t.items?.some((l) => l.startsWith('Lowe')), 'promote list shows Lowe');
await pick(0); t = await untilMenu(); check(t.items?.[0] === 'Yes', 'promote confirmation'); await pick(0); await untilMenu();
check(await ev(() => { const l = window.lad.state.force.find((u) => u.id === 'lowe'); return l.promoted && l.classId === 'VICR' && l.level === 1; }), 'Lowe promoted to VICR L1');
await pick(1); t = await untilMenu(); check(t.items?.some((l) => l.startsWith('Ken')), 'revive list shows Ken');
await pick(0); t = await untilMenu(); await pick(0); await untilMenu();
check(await ev(() => window.lad.state.force.find((u) => u.id === 'ken').alive), 'Ken revived');
await pick(0); await untilMenu(); check(await ev(() => !!localStorage.getItem('light-and-darkness:save1')), 'saved at church');
await untilIdle();

// ---- HQ: party editor toggles Lowe out and back; storage deposit/withdraw
await setup('guardiana', 15, 21, 'up', "g.depot.push('healing_seed');");
await page.waitForTimeout(300); await untilIdle();
await talk(); t = await untilMenu(); check(t.items?.[0] === 'Members', 'HQ menu: ' + JSON.stringify(t.items));
await pick(0); t = await untilMenu(); check(t.items?.length === 6, 'party editor lists 6 members');
await pick(1); await page.waitForTimeout(150); check(await ev(() => !window.lad.state.party.includes('lowe')), 'Lowe removed from party');
await pick(1); await page.waitForTimeout(150); check(await ev(() => window.lad.state.party.includes('lowe')), 'Lowe added back');
await pick(0); await page.waitForTimeout(150); check(await ev(() => window.lad.state.party.includes('max')), 'Max cannot be removed');
await tap('KeyX'); t = await untilMenu();
await pick(1); t = await untilMenu(); check(t.items?.[0] === 'Withdraw', 'storage menu'); await pick(0); t = await untilMenu(); check(t.items?.[0] === 'Healing Seed', 'storage lists the seed');
await pick(0); t = await untilMenu(); await pick(0); await page.waitForTimeout(200);
check(await ev(() => window.lad.state.depot.length === 0 && window.lad.state.force[0].items.includes('healing_seed')), 'withdrew seed to Max');
t = await untilMenu(); await pick(1); t = await untilMenu(); await pick(0); t = await untilMenu(); const sel = t.items?.indexOf('Healing Seed') ?? 1; await pick(sel >= 0 ? sel : 1); await page.waitForTimeout(200);
check(await ev(() => window.lad.state.depot.length === 1), 'deposited an item');
await untilIdle();

// ---- inn at Rindo: pay, heal
await setup('rindo', 20, 19, 'up', "g.force[0].hp = 1;");
await page.waitForTimeout(300); await untilIdle();
await talk(); t = await untilMenu(); check(t.items?.[0] === 'Yes', 'inn asks to stay'); await pick(0); await untilIdle(12000);
check(await ev(() => window.lad.state.gold === 4970 && window.lad.state.force[0].hp === window.lad.state.force[0].maxHp), 'inn charged 30 and healed');

// ---- field menu: use a herb, cast Heal
await setup('guardiana', 10, 24, 'down', "g.force[0].hp = 2; g.force[0].items = ['short_sword', 'medical_herb'];");
await page.waitForTimeout(300); await untilIdle();
await tap('KeyC'); t = await untilMenu(); check(t.kind === 'radial', 'field radial opened');
await tap('ArrowRight'); await tap('KeyZ'); t = await untilMenu(); check(t.items?.[0]?.startsWith('Max'), 'item: member list');
await pick(0); t = await untilMenu(); await pick(1); t = await untilMenu(); check(t.items?.[0] === 'Use', 'item ops'); await pick(0); t = await untilMenu(); await pick(0); await untilIdle();
check(await ev(() => window.lad.state.force[0].hp === 12 && window.lad.state.force[0].items.length === 1), 'herb healed Max and was consumed');
await ev(() => { window.lad.state.force[0].hp = 3; });
await tap('KeyC'); t = await untilMenu(); await tap('ArrowDown'); await tap('KeyZ'); t = await untilMenu(); check(t.items?.[0]?.startsWith('Lowe'), 'magic: caster list ' + JSON.stringify(t.items));
await pick(0); t = await untilMenu(); check(t.items?.[0]?.startsWith('Heal'), 'Lowe spells'); await pick(0); t = await untilMenu(); await pick(0); await untilIdle();
check(await ev(() => window.lad.state.force[0].hp === 12), 'Heal restored Max');

// ---- shop sell
await setup('guardiana', 9, 15, 'up', "g.force[0].items = ['short_sword', 'medical_herb', 'healing_seed'];");
await page.waitForTimeout(300); await untilIdle();
await talk(); t = await untilMenu(); await pick(1); t = await untilMenu(); await pick(0); t = await untilMenu(); check(t.items?.includes('Healing Seed'), 'sell list'); await pick(2); t = await untilMenu(); await pick(0); await untilIdle();
check(await ev(() => window.lad.state.gold === 5025 && window.lad.state.force[0].items.length === 2), 'sold the seed for 25');

await browser.close();
console.log(fails.length ? `FLOWS: ${fails.length} failures` : 'FLOWS OK');
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
process.exit(fails.length || errors.length ? 1 : 0);
