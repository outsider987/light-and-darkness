// Generates the soundtrack with ACE-Step 1.5 via ComfyUI. Output: assets-src/music/<id>.mp3
import { aceStep, run } from './client.mjs';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'instrumental, 16-bit video game music, SEGA Genesis YM2612 FM synth and PSG chiptune, 1992 tactical JRPG soundtrack, no vocals, clean mix, loopable, ';
const tracks = {
  title: { tags: BASE + 'heroic fantasy title theme, triumphant brass-like FM leads, marching snare, soaring melody, hopeful', seconds: 64, bpm: 128, key: 'C major', seed: 101 },
  opening: { tags: BASE + 'mysterious slow prologue narration theme, ancient legend, soft arpeggios, deep bass drone, ominous but beautiful', seconds: 48, bpm: 84, key: 'A minor', seed: 102 },
  town: { tags: BASE + 'cheerful peaceful village theme, bouncy waltz feel, warm FM flute lead, gentle bass, cozy medieval town', seconds: 64, bpm: 116, key: 'F major', seed: 103 },
  hq: { tags: BASE + 'light playful headquarters theme, friendly, staccato leads, relaxed groove, preparing for adventure', seconds: 48, bpm: 120, key: 'G major', seed: 104 },
  church: { tags: BASE + 'calm sacred church hymn, organ-like FM chords, slow, reverent, peaceful sanctuary', seconds: 48, bpm: 76, key: 'C major', seed: 105 },
  dungeon: { tags: BASE + 'dark cave dungeon exploration theme, sparse echoing notes, tense low bass, dripping water mood, mysterious', seconds: 64, bpm: 104, key: 'D minor', seed: 106 },
  battle: { tags: BASE + 'intense tactical battle theme, driving fast drums, aggressive FM bass riff, urgent heroic melody, energetic', seconds: 80, bpm: 152, key: 'A minor', seed: 107 },
  boss: { tags: BASE + 'menacing boss battle theme, fast and dramatic, pounding drums, dissonant chromatic FM leads, dark and epic', seconds: 80, bpm: 160, key: 'D minor', seed: 108 },
  victory: { tags: BASE + 'short triumphant victory fanfare jingle, brass fanfare, celebratory, ends cleanly', seconds: 9, bpm: 140, key: 'C major', seed: 109 },
  levelup: { tags: BASE + 'very short bright level-up jingle, ascending arpeggio, sparkling, ends cleanly', seconds: 4, bpm: 150, key: 'C major', seed: 110 },
  gameover: { tags: BASE + 'short sad defeat jingle, descending melody, somber, slow, ends cleanly', seconds: 8, bpm: 90, key: 'C minor', seed: 111 },
  sea: { tags: BASE + 'sailing on the open sea theme, rolling waves rhythm, adventurous, breezy FM leads, bright and free', seconds: 64, bpm: 108, key: 'A minor', seed: 112 },
  castle: { tags: BASE + 'grand royal castle theme, stately march, regal brass-like FM chords, majestic and proud', seconds: 64, bpm: 100, key: 'C major', seed: 113 },
  dark: { tags: BASE + 'evil empire theme, slow ominous march, deep menacing bass, dark cathedral mood, villain motif', seconds: 64, bpm: 96, key: 'D minor', seed: 114 },
  ending: { tags: BASE + 'emotional ending credits theme, warm nostalgic melody, slow build to a hopeful finale, bittersweet, grand', seconds: 96, bpm: 100, key: 'C major', seed: 115 },
};
const only = process.argv.slice(2);
const out = 'assets-src/music';
fs.mkdirSync(out, { recursive: true });
for (const [id, t] of Object.entries(tracks)) {
  if (only.length && !only.includes(id)) continue;
  const target = path.join(out, id + '.mp3');
  if (fs.existsSync(target) && !process.env.FORCE) { console.log(id, 'exists'); continue; }
  const r = await run(aceStep({ tags: t.tags, lyrics: '[instrumental]', seconds: t.seconds, bpm: t.bpm, key: t.key, seed: t.seed, prefix: 'music-' + id }), out);
  fs.renameSync(r.files[0], target);
  console.log(id, (r.seconds).toFixed(0) + 's', fs.statSync(target).size);
}
