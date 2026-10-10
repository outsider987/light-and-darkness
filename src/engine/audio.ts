/**
 * Tiny chiptune engine on WebAudio: a step sequencer for songs plus synthesized SFX.
 */
export type Wave = 'square' | 'triangle' | 'sawtooth' | 'sine' | 'noise';
export interface Track { wave: Wave; vol: number; notes: string; detune?: number }
export interface Song { bpm: number; loop?: boolean; tracks: Track[] }

interface Ev { t: number; f: number; d: number }

const NOTE_IDX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parse(notes: string): { evs: Ev[]; len: number } {
  const evs: Ev[] = [];
  let t = 0;
  for (const tok of notes.trim().split(/\s+/)) {
    if (!tok) continue;
    const [body, lenStr] = tok.split(':');
    const d = lenStr ? parseInt(lenStr, 10) : 1;
    if (body === '-' || body === 'r') {
      t += d;
      continue;
    }
    const m = /^([A-G])([#b]?)(\d)$/.exec(body);
    if (!m) {
      t += d;
      continue;
    }
    let n = NOTE_IDX[m[1]];
    if (m[2] === '#') n++;
    if (m[2] === 'b') n--;
    const oct = parseInt(m[3], 10);
    const midi = 12 * (oct + 1) + n;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    evs.push({ t, f, d });
    t += d;
  }
  return { evs, len: t };
}

class AudioEngine {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;
  private songs: Record<string, Song> = {};
  private current: string | null = null;
  private pending: string | null = null;
  private timer: number | null = null;
  private parsed: { evs: Ev[]; len: number; track: Track }[] = [];
  private loopLen = 0;
  private stepSec = 0;
  private startAt = 0;
  private nextStep = 0;
  private loop = true;
  private active: AudioScheduledSourceNode[] = [];
  /** Streamed tracks: id -> url. When present (and decodable) they replace the sequencer song. */
  private streams: Record<string, string> = {};
  private buffers = new Map<string, AudioBuffer | null>();
  private streamToken = 0;
  private streamNodes: { src: AudioBufferSourceNode; gain: GainNode }[] = [];
  private streamTimer: number | null = null;

  register(songs: Record<string, Song>): void {
    Object.assign(this.songs, songs);
  }

  /** Register streamed music files (mp3/ogg). Missing files fall back to the sequencer automatically. */
  registerStreams(urls: Record<string, string>): void {
    Object.assign(this.streams, urls);
  }

  /** Create the context early (suspended) so decoding can start before the first gesture. */
  init(): void {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
    } catch {
      return;
    }
    this.setup();
  }

  private setup(): void {
    const c = this.ctx!;
    c.onstatechange = () => {
      if (c.state === 'running' && this.pending) {
        const p = this.pending;
        this.pending = null;
        this.play(p);
      }
    };
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : 0.35;
    this.master.connect(c.destination);
    this.musicGain = c.createGain();
    this.musicGain.gain.value = 0.55;
    this.musicGain.connect(this.master);
    const len = c.sampleRate * 0.5;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  private loading = new Map<string, Promise<AudioBuffer | null>>();

  private loadBuffer(id: string): Promise<AudioBuffer | null> {
    const have = this.buffers.get(id);
    if (have) return Promise.resolve(have);
    const inflight = this.loading.get(id);
    if (inflight) return inflight;
    const url = this.streams[id];
    if (!url || !this.ctx) return Promise.resolve(null);
    const ctx = this.ctx;
    const p = (async () => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const data = await r.arrayBuffer();
        const buf = await ctx.decodeAudioData(data);
        this.buffers.set(id, buf);
        return buf;
      } catch {
        return null;
      } finally {
        this.loading.delete(id);
      }
    })();
    this.loading.set(id, p);
    return p;
  }

  preloadStreams(ids: string[]): void {
    for (const id of ids) void this.loadBuffer(id);
  }

  private stopStream(): void {
    if (this.streamTimer !== null) {
      clearTimeout(this.streamTimer);
      this.streamTimer = null;
    }
    const now = this.ctx?.currentTime ?? 0;
    for (const n of this.streamNodes) {
      try {
        n.gain.gain.cancelScheduledValues(now);
        n.gain.gain.setValueAtTime(n.gain.gain.value, now);
        n.gain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
        n.src.stop(now + 0.2);
      } catch { /* already stopped */ }
    }
    this.streamNodes = [];
    this.streamToken++;
  }

  /** Play a decoded buffer, looping with a short crossfade so the seam is inaudible. */
  private playStream(id: string, buf: AudioBuffer, loop: boolean): void {
    if (!this.ctx || !this.musicGain) return;
    const token = ++this.streamToken;
    const FADE = 1.0;
    const startAt = (when: number) => {
      if (token !== this.streamToken || !this.ctx || !this.musicGain) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.linearRampToValueAtTime(1, when + (this.streamNodes.length ? FADE : 0.05));
      src.connect(gain);
      gain.connect(this.musicGain);
      src.start(when);
      this.streamNodes.push({ src, gain });
      if (this.streamNodes.length > 2) this.streamNodes.shift();
      const end = when + buf.duration;
      if (loop && buf.duration > FADE * 2) {
        gain.gain.setValueAtTime(1, end - FADE);
        gain.gain.linearRampToValueAtTime(0.0001, end);
        src.stop(end + 0.05);
        const nextStart = end - FADE;
        const delayMs = Math.max(0, (nextStart - this.ctx.currentTime) * 1000 - 300);
        this.streamTimer = window.setTimeout(() => startAt(nextStart), delayMs);
      } else {
        src.stop(end + 0.05);
        src.onended = () => { if (token === this.streamToken && !loop) this.current = null; };
      }
    };
    startAt(this.ctx.currentTime + 0.05);
  }

  /** Must be called from a user gesture. */
  unlock(): void {
    if (!this.ctx) this.init();
    const c = this.ctx as AudioContext | null;
    if (!c) return;
    const go = () => {
      if (this.pending) {
        const p = this.pending;
        this.pending = null;
        this.play(p);
      }
    };
    if (c.state === 'suspended') c.resume().then(go).catch(() => {});
    else go();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
    return this.muted;
  }

  get playing(): string | null {
    return this.current;
  }

  play(id: string): void {
    if (this.current === id && (this.timer !== null || this.streamNodes.length)) return;
    if (!this.ctx || this.ctx.state !== 'running' || (!this.songs[id] && !this.streams[id])) {
      this.pending = id;
      this.current = id;
      return;
    }
    this.stopMusic();
    this.current = id;
    if (this.streams[id]) {
      const buf = this.buffers.get(id);
      const loop = !['victory', 'levelup', 'gameover'].includes(id);
      if (buf) {
        this.playStream(id, buf, loop);
        return;
      }
      // decode in the background; play the sequencer meanwhile if available, then switch over
      void this.loadBuffer(id).then((b) => {
        if (b && this.current === id && this.streamNodes.length === 0) {
          this.stopSequencer();
          this.playStream(id, b, loop);
        }
      });
      if (!this.songs[id]) return;
    }
    const song = this.songs[id];
    this.current = id;
    this.loop = song.loop !== false;
    this.parsed = song.tracks.map((tr) => ({ ...parse(tr.notes), track: tr }));
    this.loopLen = Math.max(1, ...this.parsed.map((p) => p.len));
    this.stepSec = 60 / song.bpm / 4;
    this.startAt = this.ctx.currentTime + 0.05;
    this.nextStep = 0;
    this.timer = window.setInterval(() => this.schedule(), 40);
    this.schedule();
  }

  private stopSequencer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    for (const n of this.active) {
      try { n.stop(); } catch { /* already stopped */ }
    }
    this.active = [];
  }

  stopMusic(): void {
    this.stopSequencer();
    this.stopStream();
    this.current = null;
    this.pending = null;
  }

  private schedule(): void {
    if (!this.ctx) return;
    const horizon = this.ctx.currentTime + 0.2;
    while (this.startAt + this.nextStep * this.stepSec < horizon) {
      const step = this.nextStep;
      const inLoop = step % this.loopLen;
      if (!this.loop && step >= this.loopLen) {
        if (this.timer !== null) clearInterval(this.timer);
        this.timer = null;
        this.current = null;
        return;
      }
      const t = this.startAt + step * this.stepSec;
      for (const p of this.parsed) {
        for (const ev of p.evs) {
          if (ev.t === inLoop) this.voice(p.track, ev.f, t, ev.d * this.stepSec, this.musicGain!);
        }
      }
      this.nextStep++;
    }
    // prune finished nodes
    if (this.active.length > 200) this.active.splice(0, this.active.length - 120);
  }

  private voice(tr: Track, f: number, t: number, dur: number, dest: AudioNode): void {
    const c = this.ctx!;
    const g = c.createGain();
    const v = tr.vol;
    const sustain = Math.max(0.01, dur - 0.04);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.008);
    g.gain.setValueAtTime(v, t + sustain * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sustain);
    g.connect(dest);
    let src: AudioScheduledSourceNode;
    if (tr.wave === 'noise') {
      const s = c.createBufferSource();
      s.buffer = this.noiseBuf;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = f;
      filt.Q.value = 0.8;
      s.connect(filt);
      filt.connect(g);
      src = s;
    } else {
      const o = c.createOscillator();
      o.type = tr.wave;
      o.frequency.value = f;
      if (tr.detune) o.detune.value = tr.detune;
      o.connect(g);
      src = o;
    }
    src.start(t);
    src.stop(t + sustain + 0.02);
    this.active.push(src);
  }

  // ---- SFX ---------------------------------------------------------------
  private tone(f0: number, f1: number, dur: number, wave: OscillatorType, vol = 0.5, delay = 0): void {
    if (!this.ctx || !this.master) return;
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.01);
  }
  private noise(dur: number, freq: number, vol = 0.5, delay = 0): void {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const c = this.ctx;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    s.start(t);
    s.stop(t + dur);
  }

  /** Play a short streamed track (jingle) over the current music without stopping it. Falls back to a synth sfx. */
  oneShot(id: string, fallbackSfx: string): void {
    const play = (buf: AudioBuffer | null) => {
      if (!buf || !this.ctx || !this.musicGain || this.ctx.state !== 'running') { this.sfx(fallbackSfx); return; }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.musicGain);
      src.start();
    };
    const have = this.buffers.get(id);
    if (have) play(have);
    else if (this.streams[id]) void this.loadBuffer(id).then(play);
    else this.sfx(fallbackSfx);
  }

  sfx(name: string): void {
    const buf = this.buffers.get('sfx:' + name);
    if (buf && this.ctx && this.master && this.ctx.state === 'running') {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = 0.9;
      src.connect(g);
      g.connect(this.master);
      src.start();
      return;
    }
    switch (name) {
      case 'cursor': this.tone(1200, 1200, 0.04, 'square', 0.18); break;
      case 'ok': this.tone(900, 900, 0.05, 'square', 0.2); this.tone(1400, 1400, 0.07, 'square', 0.2, 0.05); break;
      case 'cancel': this.tone(500, 300, 0.08, 'square', 0.2); break;
      case 'text': this.tone(2000, 2000, 0.015, 'square', 0.06); break;
      case 'hit': this.noise(0.12, 1800, 0.6); this.tone(220, 60, 0.15, 'square', 0.4); break;
      case 'crit': this.noise(0.2, 2500, 0.7); this.tone(300, 50, 0.25, 'sawtooth', 0.5); break;
      case 'miss': this.noise(0.15, 900, 0.25); this.tone(600, 1200, 0.12, 'sine', 0.15); break;
      case 'magic': for (let i = 0; i < 6; i++) this.tone(400 + i * 180, 400 + i * 180, 0.08, 'square', 0.2, i * 0.05); break;
      case 'fire': this.noise(0.4, 1200, 0.5); this.tone(200, 80, 0.4, 'sawtooth', 0.3); break;
      case 'ice': for (let i = 0; i < 5; i++) this.tone(1800 - i * 200, 1500 - i * 200, 0.1, 'triangle', 0.25, i * 0.06); break;
      case 'bolt': this.noise(0.25, 4000, 0.6); this.tone(1500, 100, 0.3, 'square', 0.3); break;
      case 'heal': for (let i = 0; i < 4; i++) this.tone(600 + i * 150, 600 + i * 150, 0.12, 'triangle', 0.25, i * 0.08); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, f, 0.14, 'square', 0.25, i * 0.1)); break;
      case 'death': this.tone(400, 80, 0.5, 'sawtooth', 0.3); this.noise(0.3, 600, 0.3, 0.1); break;
      case 'door': this.tone(300, 500, 0.1, 'square', 0.2); break;
      case 'gold': this.tone(1500, 1500, 0.05, 'square', 0.2); this.tone(2000, 2000, 0.08, 'square', 0.2, 0.06); break;
      case 'step': this.noise(0.03, 500, 0.08); break;
      case 'move': this.tone(700, 900, 0.04, 'square', 0.12); break;
      case 'error': this.tone(200, 200, 0.12, 'square', 0.25); break;
      case 'egress': for (let i = 0; i < 8; i++) this.tone(300 + i * 120, 300 + i * 120, 0.06, 'sine', 0.3, i * 0.04); break;
      case 'warp': this.tone(200, 2000, 0.4, 'sine', 0.3); break;
      default: break;
    }
  }
}

export const audio = new AudioEngine();
