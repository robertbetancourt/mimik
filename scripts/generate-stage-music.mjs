// Generates assets/sounds/music/stage-loop.wav — the seamless background
// loop that plays during a turn (useStageMusic speeds it up as time runs
// out). Fully procedural, so there are no licensing questions: a four-bar
// groove at 124 BPM (kick, clap, hats, bass, plucked arpeggio).
//
// Usage: node scripts/generate-stage-music.mjs
// Replace the output file with any loopable track to change the music.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const BPM = 124;
const BARS = 4;
const BEAT = 60 / BPM;
const LENGTH = Math.round(BARS * 4 * BEAT * SAMPLE_RATE);
const out = new Float32Array(LENGTH);

// Deterministic noise so the file is reproducible.
let seed = 1234567;
function noise() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x7fffffff) * 2 - 1;
}

// Adds a sample at time t (seconds), wrapping around the loop end so tails
// of the last notes bleed into the start — that's what makes it seamless.
function add(t, value) {
  const i = Math.round(t * SAMPLE_RATE) % LENGTH;
  out[i] += value;
}

function kick(start) {
  const dur = 0.32;
  let phase = 0;
  for (let n = 0; n < dur * SAMPLE_RATE; n++) {
    const t = n / SAMPLE_RATE;
    const freq = 45 + 95 * Math.exp(-t * 28);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    add(start + t, Math.sin(phase) * Math.exp(-t * 9) * 0.9);
  }
}

function clap(start) {
  const dur = 0.18;
  let prev = 0;
  for (let n = 0; n < dur * SAMPLE_RATE; n++) {
    const t = n / SAMPLE_RATE;
    const raw = noise();
    const hp = raw - prev * 0.6; // crude high-pass for a brighter clap
    prev = raw;
    // three quick re-triggers give the "clap" smear
    const env = Math.exp(-t * 22) + (t > 0.012 ? 0.6 * Math.exp(-(t - 0.012) * 30) : 0);
    add(start + t, hp * env * 0.28);
  }
}

function hat(start, open = false) {
  const dur = open ? 0.12 : 0.045;
  let prev = 0;
  for (let n = 0; n < dur * SAMPLE_RATE; n++) {
    const t = n / SAMPLE_RATE;
    const raw = noise();
    const hp = raw - prev;
    prev = raw;
    add(start + t, hp * Math.exp(-t * (open ? 30 : 90)) * 0.12);
  }
}

function bass(start, freq, dur) {
  let lp = 0;
  for (let n = 0; n < dur * SAMPLE_RATE; n++) {
    const t = n / SAMPLE_RATE;
    const saw = 2 * ((t * freq) % 1) - 1;
    const square = Math.sign(Math.sin(2 * Math.PI * freq * t));
    const raw = saw * 0.6 + square * 0.4;
    const cutoff = 0.06 + 0.12 * Math.exp(-t * 14); // filter "pluck"
    lp += cutoff * (raw - lp);
    const env = Math.min(1, t * 200) * Math.exp(-t * 3.5);
    add(start + t, lp * env * 0.42);
  }
}

function pluck(start, freq) {
  const dur = 0.28;
  for (let n = 0; n < dur * SAMPLE_RATE; n++) {
    const t = n / SAMPLE_RATE;
    const tri = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t));
    const sine2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
    add(start + t, (tri + sine2) * Math.exp(-t * 14) * 0.11);
  }
}

const note = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Am – F – C – G, one chord per bar.
const chords = [
  { root: 45, tones: [69, 72, 76, 81] },
  { root: 41, tones: [65, 69, 72, 77] },
  { root: 48, tones: [67, 72, 76, 79] },
  { root: 43, tones: [67, 71, 74, 79] },
];

for (let bar = 0; bar < BARS; bar++) {
  const barStart = bar * 4 * BEAT;
  const chord = chords[bar];
  for (let beat = 0; beat < 4; beat++) {
    const t = barStart + beat * BEAT;
    kick(t);
    if (beat === 1 || beat === 3) clap(t);
    hat(t + BEAT / 2, beat === 3);
    hat(t + BEAT * 0.75);
  }
  // Bass: syncopated eighths on the root, octave jump on the "and" of 4.
  const pattern = [0, 0.75, 1.5, 2, 2.75, 3.5];
  pattern.forEach((pos, i) => {
    const midi = i === pattern.length - 1 ? chord.root + 12 : chord.root;
    bass(barStart + pos * BEAT, note(midi), BEAT * 0.45);
  });
  // Arpeggio: sixteenths, skipping some for groove.
  for (let step = 0; step < 16; step++) {
    if (step % 4 === 3 || step === 6) continue;
    const tone = chord.tones[(step * 3) % chord.tones.length];
    pluck(barStart + step * (BEAT / 4), note(tone));
  }
}

// Gentle saturation + normalization.
let peak = 0;
for (let i = 0; i < LENGTH; i++) {
  out[i] = Math.tanh(out[i] * 1.2);
  peak = Math.max(peak, Math.abs(out[i]));
}
const gain = 0.89 / peak;

const data = Buffer.alloc(LENGTH * 2);
for (let i = 0; i < LENGTH; i++) {
  data.writeInt16LE(Math.round(out[i] * gain * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "assets/sounds/music/stage-loop.wav");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, Buffer.concat([header, data]));
console.log(`wrote ${target} (${((44 + data.length) / 1024).toFixed(0)} KB, ${(LENGTH / SAMPLE_RATE).toFixed(2)} s)`);
