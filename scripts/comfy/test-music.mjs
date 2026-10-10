import { aceStep, run } from './client.mjs';
const r = await run(aceStep({
  tags: 'instrumental, 16-bit chiptune, SEGA Genesis FM synth, heroic fantasy JRPG title theme, triumphant brass-like leads, driving bass, retro video game music, loopable',
  lyrics: '[instrumental]', seconds: 48, bpm: 128, key: 'C major', seed: 11, prefix: 'lad-music-test',
}), 'assets-src/test');
console.log(JSON.stringify(r));
