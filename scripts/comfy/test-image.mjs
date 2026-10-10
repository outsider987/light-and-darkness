import { qwenImage, run } from './client.mjs';
const prompt = process.argv[2] ?? 'Retro 16-bit pixel art JRPG battle background, SEGA Genesis style, wide landscape of green grassland plains under a bright blue sky with a few clouds, distant hills and a small castle on the horizon, flat ground in the lower third for characters to stand on, no people, no text, crisp pixels, limited palette';
const r = await run(qwenImage({ prompt, negative: 'blurry, text, watermark, people, characters, photo', width: 1024, height: 448, steps: 20, seed: 7, prefix: 'lad-test' }), 'assets-src/test');
console.log(JSON.stringify(r));
