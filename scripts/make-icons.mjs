// Generates the app icons as PNGs with no dependencies. Flat design: a green board with a
// figure-eight of rope in two flat colors (a dark edge and a light core). Run with
// `npm run icons`.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const OUT = new URL('../public/icons/', import.meta.url);
const BG = [0x2a, 0x6a, 0x54];
const EDGE = [0x3b, 0x24, 0x10];
const ROPE = [0xe8, 0xb3, 0x5a];
const SAMPLES = 4; // supersampling per axis for clean edges

// Two rings stacked into an 8, kept inside the central 60% so they survive maskable cropping.
const RINGS = [
  [0.5, 0.375, 0.12],
  [0.5, 0.625, 0.12],
];
const CORE = 0.035;
const RIM = 0.05;

function colorAt(u, v) {
  // The top ring is drawn over the bottom one where they meet.
  let color = BG;
  for (const [cx, cy, r] of RINGS) {
    const d = Math.abs(Math.hypot(u - cx, v - cy) - r);
    if (d <= CORE) color = ROPE;
    else if (d <= RIM) color = EDGE;
  }
  return color;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const c = colorAt((x + (sx + 0.5) / SAMPLES) / size, (y + (sy + 0.5) / SAMPLES) / size);
          for (let ch = 0; ch < 3; ch++) sum[ch] += c[ch];
        }
      }
      const o = y * stride + 1 + x * 3;
      for (let ch = 0; ch < 3; ch++) raw[o + ch] = Math.round(sum[ch] / (SAMPLES * SAMPLES));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]) {
  writeFileSync(new URL(name, OUT), png(size));
  console.log(`wrote public/icons/${name}`);
}
