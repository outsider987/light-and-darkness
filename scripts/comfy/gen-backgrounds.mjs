// Generates painted battle backdrops and title art with Qwen Image 2.1 via ComfyUI.
import { qwenImage, run } from './client.mjs';
import fs from 'node:fs';

const STYLE = 'Retro 16-bit pixel art environment concept art in the style of 1992 SEGA Genesis JRPG scenery, a completely deserted and uninhabited landscape, nobody present, empty foreground, wide composition with a flat open ground area across the lower third, no text, crisp pixels, limited palette, ';
const NEG = 'people, person, man, woman, character, characters, soldier, warrior, hero, knight, monster, creature, animal, sprite, figure, silhouette, crowd, text, letters, watermark, logo, blurry, photo, 3d render';
const scenes = {
  grass: 'green grassland plains under a bright blue sky with soft clouds, distant rolling hills and a small castle town on the horizon',
  forest: 'inside a dense green forest, large tree trunks and leafy canopy, dappled sunlight, mossy clearing in the foreground',
  hills: 'rocky brown hills and grey mountains with snowy peaks under a clear sky, dry grass and boulders in the foreground',
  water: 'a riverbank with a wooden bridge over blue water, reeds, grass, distant trees and sky',
  sea: 'the wooden deck of a sailing ship at sea, wooden planks in the foreground, mast and rigging, deep blue ocean waves and sky',
  castle: 'the interior of a medieval stone castle hall, grey stone floor, tall pillars, red banners, torches on the walls',
  cave: 'inside a dark underground cavern, rough rock walls, stalactites, faint blue glowing crystals, rocky floor',
  ruins: 'ancient ruined temple of a lost civilization, cracked stone floor, broken pillars, overgrown vines, dusk sky',
  wasteland: 'a grey dead wasteland with withered trees and dark storm clouds, dry cracked earth in the foreground',
  lava: 'a volcanic summit with rivers of glowing orange lava, black rock ground, dark red sky with ash',
  throne: 'a dark royal throne room, purple carpet, gold ornaments, towering columns, candle light, ominous atmosphere',
  tower: 'the top of an ancient magical tower above the clouds, glowing glass floor, arcane runes, night sky with stars',
};
const only = process.argv.slice(2);
const out = 'assets-src/bg';
fs.mkdirSync(out, { recursive: true });
for (const [id, desc] of Object.entries(scenes)) {
  if (only.length && !only.includes(id)) continue;
  const r = await run(qwenImage({ prompt: STYLE + desc, negative: NEG, width: 1024, height: 448, steps: 22, cfg: 2.5, seed: 300 + id.length * 13, prefix: 'bg-' + id }), out);
  console.log(id, JSON.stringify(r));
}
if (!only.length || only.includes('title')) {
  const r = await run(qwenImage({
    prompt: 'Retro 16-bit pixel art illustration in the style of 1990s SEGA Genesis JRPG title screens: a dramatic view of a dark dragon silhouette rising behind an ancient stone gate on a hill at twilight, purple and orange sky, rays of golden light breaking through the clouds, no text, no letters, no people, crisp pixels, limited palette, epic fantasy mood',
    negative: NEG, width: 1024, height: 768, steps: 24, cfg: 2.5, seed: 777, prefix: 'title-art',
  }), out);
  console.log('title', JSON.stringify(r));
}
