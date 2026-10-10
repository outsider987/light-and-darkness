import { qwenImage, run } from './client.mjs';
const NEG = 'people, person, character, characters, soldier, hero, monster, creature, animal, sprite, figure, text, letters, watermark, logo, blurry, photo, 3d render';
const r = await run(qwenImage({
  prompt: 'Retro 16-bit pixel art illustration in the style of 1990s SEGA Genesis JRPG ending scenes: a peaceful medieval kingdom seen from a hill at sunrise, golden light over green fields, a small castle town by a river, soft clouds, birds far away, completely deserted and uninhabited, nobody present, no text, crisp pixels, limited palette, warm and hopeful',
  negative: NEG, width: 1024, height: 768, steps: 24, cfg: 2.5, seed: 4242, prefix: 'ending-art',
}), 'assets-src/bg');
console.log('ending', JSON.stringify(r));
