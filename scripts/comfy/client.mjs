// Minimal ComfyUI API client: submit a workflow (API format), wait for completion, download outputs.
import fs from 'node:fs';
import path from 'node:path';

const HOST = process.env.COMFY ?? 'http://localhost:8188';

export async function submit(workflow) {
  const r = await fetch(`${HOST}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: workflow, client_id: 'lad-' + Date.now() }) });
  const j = await r.json();
  if (!j.prompt_id) throw new Error('submit failed: ' + JSON.stringify(j).slice(0, 800));
  return j.prompt_id;
}

export async function waitFor(id, { timeoutMs = 30 * 60 * 1000, pollMs = 2000 } = {}) {
  const t0 = Date.now();
  for (;;) {
    const r = await fetch(`${HOST}/history/${id}`);
    const j = await r.json();
    const h = j[id];
    if (h && h.status && (h.status.completed || h.status.status_str === 'error')) {
      if (h.status.status_str === 'error') {
        const msgs = (h.status.messages ?? []).filter((m) => m[0] === 'execution_error').map((m) => JSON.stringify(m[1]).slice(0, 600));
        throw new Error('execution error: ' + msgs.join('\n'));
      }
      return h;
    }
    if (Date.now() - t0 > timeoutMs) throw new Error('timeout');
    await new Promise((res) => setTimeout(res, pollMs));
  }
}

export async function download(history, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  for (const node of Object.values(history.outputs ?? {})) {
    for (const key of ['images', 'audio', 'gifs']) {
      for (const f of node[key] ?? []) {
        const url = `${HOST}/view?filename=${encodeURIComponent(f.filename)}&subfolder=${encodeURIComponent(f.subfolder ?? '')}&type=${f.type ?? 'output'}`;
        const r = await fetch(url);
        const buf = Buffer.from(await r.arrayBuffer());
        const p = path.join(outDir, path.basename(f.filename));
        fs.writeFileSync(p, buf);
        files.push(p);
      }
    }
  }
  return files;
}

export function qwenImage({ prompt, negative = '', width = 1024, height = 512, steps = 20, cfg = 1, seed = 1, prefix = 'lad' }) {
  return {
    1: { class_type: 'UNETLoader', inputs: { unet_name: 'qwen_image_2.1_int8_convrot.safetensors', weight_dtype: 'default' } },
    2: { class_type: 'CLIPLoader', inputs: { clip_name: 'qwen3vl_8b_w4a8.safetensors', type: 'qwen_image', device: 'default' } },
    3: { class_type: 'VAELoader', inputs: { vae_name: 'qwen_image_2.1_vae_bf16.safetensors' } },
    4: { class_type: 'TextEncodeQwenImage21', inputs: { clip: ['2', 0], prompt, negative_prompt: negative, resolution: 1024 } },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    6: { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['4', 0], negative: ['4', 1], latent_image: ['5', 0], seed, steps, cfg, sampler_name: 'euler', scheduler: 'simple', denoise: 1 } },
    7: { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['3', 0] } },
    8: { class_type: 'SaveImage', inputs: { images: ['7', 0], filename_prefix: prefix } },
  };
}

export function aceStep({ tags, lyrics = '[instrumental]', seconds = 60, bpm = 120, key = 'C major', seed = 1, steps = 8, prefix = 'lad-music', timesig = '4' }) {
  return {
    1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'ace_step_1.5_turbo_aio.safetensors' } },
    2: { class_type: 'TextEncodeAceStepAudio1.5', inputs: { clip: ['1', 1], tags, lyrics, seed, bpm, duration: seconds, timesignature: timesig, language: 'en', keyscale: key, generate_audio_codes: true, cfg_scale: 2, temperature: 0.85, top_p: 0.9, top_k: 0, min_p: 0 } },
    3: { class_type: 'ConditioningZeroOut', inputs: { conditioning: ['2', 0] } },
    4: { class_type: 'ModelSamplingAuraFlow', inputs: { model: ['1', 0], shift: 3 } },
    5: { class_type: 'EmptyAceStep1.5LatentAudio', inputs: { seconds, batch_size: 1 } },
    6: { class_type: 'KSampler', inputs: { model: ['4', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['5', 0], seed, steps, cfg: 1, sampler_name: 'euler', scheduler: 'simple', denoise: 1 } },
    7: { class_type: 'VAEDecodeAudio', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    8: { class_type: 'SaveAudioMP3', inputs: { audio: ['7', 0], filename_prefix: prefix, quality: '128k' } },
  };
}

export async function run(workflow, outDir) {
  const id = await submit(workflow);
  const t0 = Date.now();
  const h = await waitFor(id);
  const files = await download(h, outDir);
  return { files, seconds: (Date.now() - t0) / 1000 };
}
