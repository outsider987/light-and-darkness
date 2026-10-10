import type { Song } from '../../engine/audio';

const drums4 = 'C2 - C7 - C2 - C7 - C2 - C7 - C2 C2 C7 -';
const rep = (s: string, n: number): string => Array(n).fill(s).join(' ');

export const SONGS: Record<string, Song> = {
  title: {
    bpm: 128,
    tracks: [
      { wave: 'square', vol: 0.16, notes: `
        G4:2 G4:2 C5:4 E5:4 D5:2 C5:2   D5:8 G4:8
        G4:2 G4:2 C5:4 E5:4 G5:4        F5:8 E5:4 D5:4
        E5:2 F5:2 G5:4 E5:4 C5:4        D5:4 E5:4 D5:4 B4:4
        C5:4 E5:4 G5:4 C6:4             G5:8 -:8` },
      { wave: 'square', vol: 0.07, detune: 5, notes: `
        E4:4 E4:4 G4:4 G4:4            B4:8 D4:8
        E4:4 E4:4 G4:4 G4:4            A4:8 G4:4 F4:4
        C5:4 C5:4 A4:4 A4:4            B4:4 B4:4 G4:8
        E4:4 G4:4 C5:4 E5:4            D5:8 -:8` },
      { wave: 'triangle', vol: 0.22, notes: `
        C3:4 G3:4 C3:4 G3:4   G2:4 D3:4 G2:4 D3:4
        C3:4 G3:4 C3:4 G3:4   F3:4 C4:4 F3:4 C4:4
        A2:4 E3:4 A2:4 E3:4   G2:4 D3:4 G2:4 D3:4
        C3:4 E3:4 G3:4 E3:4   G2:4 B2:4 D3:4 G3:4` },
      { wave: 'noise', vol: 0.12, notes: rep(drums4, 8) },
    ],
  },
  opening: {
    bpm: 84,
    tracks: [
      { wave: 'triangle', vol: 0.2, notes: `A4:8 C5:8   E5:8 D5:8   C5:8 B4:8   A4:16   F4:8 A4:8   E5:8 D5:8   C5:8 B4:8   A4:16` },
      { wave: 'sine', vol: 0.15, notes: `A2:16 A2:16 F2:16 E2:16 F2:16 D2:16 E2:16 A2:16` },
    ],
  },
  town: {
    bpm: 116,
    tracks: [
      { wave: 'square', vol: 0.14, notes: `
        A4:2 C5:2 F5:4 E5:2 D5:2 C5:4   D5:2 E5:2 F5:4 C5:8
        A4:2 C5:2 F5:4 G5:2 A5:2 G5:4   F5:4 E5:4 D5:8
        Bb4:2 C5:2 D5:4 F5:4 E5:4       D5:4 C5:4 A4:8
        G4:2 A4:2 Bb4:4 C5:4 D5:4       C5:8 F4:8` },
      { wave: 'triangle', vol: 0.2, notes: `
        F2:4 C3:4 A2:4 C3:4   Bb2:4 F3:4 D3:4 F3:4
        F2:4 C3:4 A2:4 C3:4   C3:4 G3:4 E3:4 G3:4
        Bb2:4 F3:4 D3:4 F3:4  F2:4 C3:4 A2:4 C3:4
        G2:4 D3:4 Bb2:4 D3:4  C3:4 G3:4 F2:4 C3:4` },
      { wave: 'square', vol: 0.05, notes: `
        -:2 F4:2 -:2 A4:2 -:2 F4:2 -:2 A4:2   -:2 F4:2 -:2 Bb4:2 -:2 F4:2 -:2 Bb4:2
        -:2 F4:2 -:2 A4:2 -:2 F4:2 -:2 A4:2   -:2 E4:2 -:2 G4:2 -:2 E4:2 -:2 G4:2
        -:2 F4:2 -:2 Bb4:2 -:2 F4:2 -:2 Bb4:2 -:2 F4:2 -:2 A4:2 -:2 F4:2 -:2 A4:2
        -:2 G4:2 -:2 Bb4:2 -:2 G4:2 -:2 Bb4:2 -:2 E4:2 -:2 G4:2 -:2 F4:2 -:2 A4:2` },
    ],
  },
  hq: {
    bpm: 120,
    tracks: [
      { wave: 'square', vol: 0.13, notes: `
        E5:2 G5:2 E5:4 C5:2 D5:2 E5:4   D5:2 F5:2 D5:4 B4:2 C5:2 D5:4
        C5:2 E5:2 G5:4 A5:2 G5:2 E5:4   D5:4 B4:4 C5:8` },
      { wave: 'triangle', vol: 0.2, notes: `
        C3:4 G3:4 C3:4 G3:4   G2:4 D3:4 G2:4 D3:4
        C3:4 G3:4 A2:4 E3:4   G2:4 D3:4 C3:8` },
    ],
  },
  church: {
    bpm: 76,
    tracks: [
      { wave: 'triangle', vol: 0.2, notes: `C5:8 E5:8   D5:8 G5:8   E5:8 C5:8   D5:16   F5:8 E5:8   D5:8 C5:8   B4:8 D5:8   C5:16` },
      { wave: 'triangle', vol: 0.14, notes: `E4:16 B3:16 C4:16 G3:16 A3:16 F3:16 G3:16 C4:16` },
      { wave: 'sine', vol: 0.2, notes: `C3:16 G2:16 A2:16 G2:16 F2:16 D2:16 G2:16 C3:16` },
    ],
  },
  dungeon: {
    bpm: 104,
    tracks: [
      { wave: 'triangle', vol: 0.18, notes: `D4:4 -:4 F4:4 -:4   A4:4 -:4 G4:4 F4:4   E4:4 -:4 D4:4 -:4   A3:16   D4:4 -:4 F4:4 -:4   Bb4:4 -:4 A4:4 G4:4   F4:4 -:4 E4:4 -:4   D4:16` },
      { wave: 'sine', vol: 0.18, notes: `D2:16 D2:16 A1:16 A1:16 D2:16 Bb1:16 A1:16 D2:16` },
      { wave: 'noise', vol: 0.06, notes: rep('C2 - - - - - - - C2 - - - - - - -', 8) },
    ],
  },
  battle: {
    bpm: 152,
    tracks: [
      { wave: 'square', vol: 0.15, notes: `
        A4:2 A4:2 C5:2 A4:2 E5:4 D5:2 C5:2     B4:2 B4:2 D5:2 B4:2 G5:4 F5:2 E5:2
        A4:2 A4:2 C5:2 A4:2 E5:2 F5:2 E5:2 D5:2 C5:4 B4:4 A4:8
        E5:2 E5:2 G5:2 E5:2 A5:4 G5:2 F5:2     E5:2 E5:2 F5:2 E5:2 D5:4 C5:2 B4:2
        C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 G5:2 F5:2 E5:8 E5:4 -:4` },
      { wave: 'sawtooth', vol: 0.12, notes: `
        A2:2 A2:2 A3:2 A2:2 A2:2 A2:2 A3:2 A2:2   G2:2 G2:2 G3:2 G2:2 G2:2 G2:2 G3:2 G2:2
        A2:2 A2:2 A3:2 A2:2 A2:2 A2:2 A3:2 A2:2   E2:2 E2:2 E3:2 E2:2 E2:2 E2:2 E3:2 E2:2
        A2:2 A2:2 A3:2 A2:2 A2:2 A2:2 A3:2 A2:2   G2:2 G2:2 G3:2 G2:2 G2:2 G2:2 G3:2 G2:2
        F2:2 F2:2 F3:2 F2:2 F2:2 F2:2 F3:2 F2:2   E2:2 E2:2 E3:2 E2:2 E2:2 E2:2 E3:2 E2:2` },
      { wave: 'noise', vol: 0.13, notes: rep('C2 - C7 - C2 C2 C7 - C2 - C7 - C2 C2 C7 C7', 8) },
    ],
  },
  boss: {
    bpm: 160,
    tracks: [
      { wave: 'square', vol: 0.15, notes: `
        D5:2 D5:2 F5:2 D5:2 Ab5:4 G5:2 F5:2    E5:2 E5:2 G5:2 E5:2 Bb5:4 A5:2 G5:2
        D5:2 D5:2 F5:2 D5:2 A5:2 Bb5:2 A5:2 G5:2 F5:4 E5:4 D5:8
        A5:2 A5:2 C6:2 A5:2 D6:4 C6:2 Bb5:2    A5:2 A5:2 Bb5:2 A5:2 G5:4 F5:2 E5:2
        F5:2 G5:2 A5:2 Bb5:2 C6:2 D6:2 C6:2 Bb5:2 A5:8 A5:4 -:4` },
      { wave: 'sawtooth', vol: 0.13, notes: `
        D2:2 D2:2 D3:2 D2:2 D2:2 D2:2 D3:2 D2:2   Eb2:2 Eb2:2 Eb3:2 Eb2:2 Eb2:2 Eb2:2 Eb3:2 Eb2:2
        D2:2 D2:2 D3:2 D2:2 D2:2 D2:2 D3:2 D2:2   A2:2 A2:2 A3:2 A2:2 A2:2 A2:2 A3:2 A2:2
        D2:2 D2:2 D3:2 D2:2 D2:2 D2:2 D3:2 D2:2   G2:2 G2:2 G3:2 G2:2 G2:2 G2:2 G3:2 G2:2
        Bb2:2 Bb2:2 Bb3:2 Bb2:2 Bb2:2 Bb2:2 Bb3:2 Bb2:2 A2:2 A2:2 A3:2 A2:2 A2:2 A2:2 A3:2 A2:2` },
      { wave: 'noise', vol: 0.14, notes: rep('C2 C2 C7 - C2 - C7 C7 C2 C2 C7 - C2 - C7 C7', 8) },
    ],
  },
  victory: {
    bpm: 140,
    loop: false,
    tracks: [
      { wave: 'square', vol: 0.16, notes: `C5:2 E5:2 G5:2 C6:6 G5:2 C6:8   -:4 E5:2 G5:2 C6:8 -:4` },
      { wave: 'triangle', vol: 0.2, notes: `C3:8 C3:8 G2:8 C3:8` },
    ],
  },
  levelup: {
    bpm: 150,
    loop: false,
    tracks: [{ wave: 'square', vol: 0.15, notes: `G4:2 C5:2 E5:2 G5:4 E5:2 G5:6` }],
  },
  gameover: {
    bpm: 90,
    loop: false,
    tracks: [
      { wave: 'triangle', vol: 0.2, notes: `E4:4 Eb4:4 D4:4 C#4:8 -:4 C4:16` },
      { wave: 'sine', vol: 0.2, notes: `C3:16 -:4 C2:16` },
    ],
  },
  ending: {
    bpm: 100,
    tracks: [
      { wave: 'square', vol: 0.14, notes: `
        C5:4 D5:4 E5:8   G5:4 E5:4 D5:8   C5:4 D5:4 E5:4 G5:4   A5:16
        G5:4 E5:4 C5:8   D5:4 E5:4 D5:8   C5:4 E5:4 G5:4 C6:4   C6:16` },
      { wave: 'triangle', vol: 0.2, notes: `
        C3:8 G3:8   E3:8 G3:8   A2:8 E3:8   F3:8 A3:8
        C3:8 G3:8   G2:8 D3:8   A2:8 E3:8   C3:16` },
      { wave: 'square', vol: 0.05, detune: 8, notes: `
        E4:8 G4:8   G4:8 B4:8   C5:8 E5:8   F5:8 A5:8
        E4:8 G4:8   D4:8 G4:8   C5:8 E5:8   E5:16` },
    ],
  },
  sea: {
    bpm: 108,
    tracks: [
      { wave: 'square', vol: 0.13, notes: `
        E5:4 D5:2 C5:2 B4:4 C5:4   D5:4 C5:2 B4:2 A4:8
        E5:4 D5:2 C5:2 B4:4 G5:4   F5:4 E5:4 D5:8
        C5:4 D5:4 E5:4 F5:4        G5:4 E5:4 C5:8
        D5:4 E5:4 D5:4 B4:4        A4:16` },
      { wave: 'triangle', vol: 0.2, notes: `
        A2:4 E3:4 A2:4 E3:4   F2:4 C3:4 F2:4 C3:4
        A2:4 E3:4 A2:4 E3:4   G2:4 D3:4 G2:4 D3:4
        F2:4 C3:4 F2:4 C3:4   C3:4 G3:4 C3:4 G3:4
        G2:4 D3:4 G2:4 D3:4   A2:4 E3:4 A2:4 E3:4` },
    ],
  },
  castle: {
    bpm: 100,
    tracks: [
      { wave: 'square', vol: 0.13, notes: `
        G4:4 C5:4 E5:4 G5:4   F5:2 E5:2 D5:4 C5:8
        A4:4 D5:4 F5:4 A5:4   G5:2 F5:2 E5:4 D5:8
        E5:4 G5:4 C6:4 B5:4   A5:4 G5:4 F5:4 E5:4
        D5:4 F5:4 E5:4 D5:4   C5:16` },
      { wave: 'triangle', vol: 0.2, notes: `
        C3:8 E3:8   G2:8 C3:8   D3:8 F3:8   G2:8 B2:8
        C3:8 E3:8   A2:8 F2:8   G2:8 D3:8   C3:16` },
      { wave: 'noise', vol: 0.07, notes: rep('C2 - - - C7 - - - C2 - - - C7 - - -', 8) },
    ],
  },
  dark: {
    bpm: 96,
    tracks: [
      { wave: 'sawtooth', vol: 0.1, notes: `
        D4:8 Eb4:8   D4:8 A3:8   Bb3:8 A3:8   D4:16
        F4:8 Eb4:8   D4:8 C4:8   Bb3:8 C#4:8   D4:16` },
      { wave: 'sine', vol: 0.2, notes: `D2:16 D2:16 Bb1:16 D2:16 G1:16 A1:16 Bb1:16 D2:16` },
      { wave: 'noise', vol: 0.08, notes: rep('C2 - - - - - - - - - - - C2 - - -', 8) },
    ],
  },
};
