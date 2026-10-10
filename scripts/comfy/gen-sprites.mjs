// Battle sprites: renders each unit's procedural sprite, sends it to Qwen Image 2.1 as a reference image,
// and asks for a detailed SEGA-style battle sprite on a flat magenta background (keyed out in postprocess).
// Usage: node scripts/comfy/gen-sprites.mjs [ids...]   (ids = character or enemy ids; default all)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { submit, waitFor, download } from './client.mjs';

const HOST = process.env.COMFY ?? 'http://localhost:8188';
const url = process.env.URL ?? 'http://localhost:4173/';
const out = 'assets-src/sprites';
fs.mkdirSync(out, { recursive: true });
const only = process.argv.slice(2);

const colorName = (hex) => {
  if (!hex) return '';
  const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const names = [['white', 240, 240, 240], ['black', 25, 25, 35], ['gray', 140, 140, 150], ['red', 200, 50, 50], ['dark red', 120, 30, 30], ['orange', 240, 150, 40], ['yellow', 240, 220, 60], ['green', 60, 160, 80], ['dark green', 40, 90, 50], ['blue', 60, 90, 200], ['light blue', 120, 200, 240], ['purple', 120, 60, 180], ['pink', 240, 130, 180], ['brown', 150, 100, 50], ['tan', 230, 200, 150], ['gold', 220, 170, 50], ['silver', 200, 205, 220]];
  let best = names[0], bd = 1e9;
  for (const nm of names) { const d = (nm[1] - r) ** 2 + (nm[2] - g) ** 2 + (nm[3] - b) ** 2; if (d < bd) { bd = d; best = nm; } }
  return best[0];
};
const BODY = { human: 'human warrior', knightlord: 'armored knight lord with a cape', king: 'king wearing a crown and cape', elf: 'elf', dwarf: 'stout bearded dwarf', goblin: 'small goblin', mage: 'mage in a robe and pointed hat', priest: 'hooded priest in robes', bird: 'birdman warrior with feathered wings', wolf: 'wolfman beast warrior', lizard: 'lizardman', zombie: 'rotting zombie', puppet: 'wooden marionette puppet', demon: 'horned demon with bat wings', minotaur: 'minotaur bull-man', centaur: 'centaur knight (horse body, human torso)', skeleton: 'skeleton warrior', robot: 'ancient robot', hound: 'hellhound beast', dragon: 'small young dragon', bigdragon: 'large dragon', wyvern: 'wyvern', bat: 'giant bat', blob: 'floating jellyfish-like magical creature with a hat', eye: 'floating eyeball monster', golem: 'stone golem', colossus: 'giant golden colossus war machine', hamster: 'tiny hamster wearing a helmet', ghost: 'ghost spirit' };
const WEAPON = { sword: 'holding a sword', axe: 'holding an axe', lance: 'holding a lance', staff: 'holding a staff', bow: 'holding a bow', katana: 'holding a katana', claw: '', none: '' };

function describe(name, spec) {
  const p = spec.pal ?? {};
  const parts = [BODY[spec.body] ?? spec.body];
  if (p.hair && !['skeleton', 'robot', 'golem', 'colossus', 'eye', 'blob', 'bat', 'hound', 'dragon', 'bigdragon', 'wyvern', 'hamster', 'ghost'].includes(spec.body)) parts.push(`${colorName(p.hair)} hair`);
  if (spec.hair === 'helmet') parts.push('wearing a helmet'); if (spec.hair === 'hood') parts.push('wearing a hood'); if (spec.hair === 'mask') parts.push('wearing a dark face mask'); if (spec.hair === 'crown') parts.push('wearing a crown'); if (spec.hair === 'propeller') parts.push('wearing a helmet with a propeller');
  if (p.armor) parts.push(`${colorName(p.armor)} armor`);
  if (p.cloth) parts.push(`${colorName(p.cloth)} clothes`);
  if (p.mount) parts.push(`${colorName(p.mount)} horse body`);
  if (spec.wings) parts.push('with white wings');
  const w = WEAPON[spec.weapon ?? 'none']; if (w) parts.push(w);
  return `${name}: ${parts.join(', ')}`;
}

async function uploadImage(name, buf) {
  const form = new FormData();
  form.append('image', new Blob([buf], { type: 'image/png' }), name);
  form.append('overwrite', 'true');
  const r = await fetch(`${HOST}/upload/image`, { method: 'POST', body: form });
  const j = await r.json();
  return j.name;
}

function workflow({ refName, prompt, seed, prefix }) {
  const NEG = 'blurry, photo, 3d render, text, letters, watermark, multiple characters, cropped, background scenery, shadow';
  return {
    1: { class_type: 'UNETLoader', inputs: { unet_name: 'qwen_image_2.1_int8_convrot.safetensors', weight_dtype: 'default' } },
    2: { class_type: 'CLIPLoader', inputs: { clip_name: 'qwen3vl_8b_w4a8.safetensors', type: 'qwen_image', device: 'default' } },
    3: { class_type: 'VAELoader', inputs: { vae_name: 'qwen_image_2.1_vae_bf16.safetensors' } },
    9: { class_type: 'LoadImage', inputs: { image: refName } },
    4: { class_type: 'TextEncodeQwenImage21', inputs: { clip: ['2', 0], vae: ['3', 0], prompt, negative_prompt: NEG, resolution: 512, 'images.image_1': ['9', 0] } },
    5: { class_type: 'EmptyLatentImage', inputs: { width: 512, height: 512, batch_size: 1 } },
    6: { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['4', 0], negative: ['4', 1], latent_image: ['5', 0], seed, steps: 22, cfg: 2.5, sampler_name: 'euler', scheduler: 'simple', denoise: 1 } },
    7: { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['3', 0] } },
    8: { class_type: 'SaveImage', inputs: { images: ['7', 0], filename_prefix: prefix } },
  };
}

const browser = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined });
const page = await browser.newPage();
await page.goto(url);
await page.waitForFunction(() => window.lad && window.lad.scenes.stack.length > 0);
const units = await page.evaluate(() => {
  const out = [];
  for (const [id, c] of Object.entries(window.lad.CHARACTERS)) out.push({ id, name: c.name, spec: c.sprite, team: 'force' });
  for (const [id, e] of Object.entries(window.lad.ENEMIES)) out.push({ id, name: e.name, spec: e.sprite, team: 'enemy' });
  return out;
});
// Bulk mode: upload all references and queue every job first (FIFO fairness on a shared ComfyUI), then collect.
const jobs = [];
let n = 0;
for (const u of units) {
  if (only.length && !only.includes(u.id)) continue;
  const target = path.join(out, `${u.id}.png`);
  if (fs.existsSync(target) && !process.env.FORCE) { console.log(u.id, 'exists'); continue; }
  const dataUrl = await page.evaluate(([spec]) => window.lad.sprite(spec, 'right', 10), [u.spec]);
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  fs.writeFileSync(path.join(out, `${u.id}.ref.png`), buf);
  const refName = await uploadImage(`lad-ref-${u.id}.png`, buf);
  const desc = describe(u.name, u.spec);
  const prompt = `Redraw the character shown in the reference image as a detailed 16-bit SEGA Genesis JRPG battle sprite, keeping the same character design and colors. ${desc}. Full body, side view facing right, standing battle-ready pose, centered, chunky pixel art with clean dark outlines, the whole figure visible with margin, isolated on a solid flat bright magenta background (#FF00FF), no scenery, no text.`;
  const id = await submit(workflow({ refName, prompt, seed: 1000 + n, prefix: `sprite-${u.id}` }));
  jobs.push({ u, id, desc, target });
  n++;
}
console.log('queued', jobs.length, 'sprite jobs at', new Date().toISOString());
for (const j of jobs) {
  const t0 = Date.now();
  const h = await waitFor(j.id, { timeoutMs: 6 * 60 * 60 * 1000, pollMs: 4000 });
  const files = await download(h, out);
  fs.renameSync(files[0], j.target);
  console.log(j.u.id, ((Date.now() - t0) / 1000).toFixed(0) + 's', j.desc);
}
await browser.close();
