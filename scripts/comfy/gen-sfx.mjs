// Sound effects with Stable Audio 3 (small SFX checkpoint) via ComfyUI. Output: assets-src/sfx/<id>.mp3
import { submit, waitFor, download } from './client.mjs';
import fs from 'node:fs';
import path from 'node:path';

const sfx = {
  hit: 'retro 16-bit video game sword slash hit impact sound effect, short, punchy',
  crit: 'retro 16-bit video game heavy critical hit impact with metallic ring, short',
  miss: 'quick whoosh swing miss sound effect, retro video game, short',
  fire: 'retro video game fireball spell burst, whoosh and crackling flames, short',
  ice: 'retro video game ice spell, crystalline freezing shatter sound, short',
  bolt: 'retro video game lightning strike spell, electric crack and thunder, short',
  heal: 'retro video game healing spell chime, gentle magical sparkle, ascending, short',
  death: 'retro video game monster defeated sound, descending digital groan, short',
  door: 'wooden door opening creak, retro video game, short',
  gold: 'retro video game coins collected jingle, short bright chime',
  egress: 'retro video game magical teleport warp sound, rising shimmer, short',
  magic: 'retro video game generic magic spell cast sparkle, short',
};
const wf = (prompt, seconds, seed, prefix) => ({
  1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'stable_audio_3_small_sfx.safetensors' } },
  2: { class_type: 'CLIPLoader', inputs: { clip_name: 't5gemma_b_b_ul2.safetensors', type: 'stable_audio', device: 'default' } },
  3: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 0], text: prompt } },
  4: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 0], text: '' } },
  5: { class_type: 'EmptyLatentAudio', inputs: { seconds, batch_size: 1 } },
  6: { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['3', 0], negative: ['4', 0], latent_image: ['5', 0], seed, steps: 8, cfg: 1, sampler_name: 'lcm', scheduler: 'simple', denoise: 1 } },
  7: { class_type: 'VAEDecodeAudio', inputs: { samples: ['6', 0], vae: ['1', 2] } },
  8: { class_type: 'SaveAudioMP3', inputs: { audio: ['7', 0], filename_prefix: prefix, quality: '128k' } },
});
const out = 'assets-src/sfx';
fs.mkdirSync(out, { recursive: true });
let n = 0;
for (const [id, prompt] of Object.entries(sfx)) {
  const target = path.join(out, id + '.mp3');
  if (fs.existsSync(target) && !process.env.FORCE) continue;
  const t0 = Date.now();
  const pid = await submit(wf(prompt, 2.0, 500 + n++, 'sfx-' + id));
  const h = await waitFor(pid);
  const files = await download(h, out);
  fs.renameSync(files[0], target);
  console.log(id, ((Date.now() - t0) / 1000).toFixed(0) + 's', fs.statSync(target).size);
}
