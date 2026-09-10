import fs from 'fs';
import zlib from 'zlib';

function createPng(size, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data with scanline filter byte (0)
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(rowSize * size);

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter: none
    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Border / circular accent
      const dx = x - size / 2;
      const dy = y - size / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < size * 0.45 && dist > size * 0.42) {
        // Cyan border ring
        raw[pixelOffset] = 6;
        raw[pixelOffset + 1] = 182;
        raw[pixelOffset + 2] = 212;
      } else if (dist < size * 0.25) {
        // Center accent
        raw[pixelOffset] = 59;
        raw[pixelOffset + 1] = 130;
        raw[pixelOffset + 2] = 246;
      } else {
        // Dark background
        raw[pixelOffset] = 10;
        raw[pixelOffset + 1] = 15;
        raw[pixelOffset + 2] = 29;
      }
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);

  const crc = crc32(Buffer.concat([Buffer.from(type), data]));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

const png192 = createPng(192, 10, 15, 29);
fs.writeFileSync('./public/pwa-192x192.png', png192);
fs.writeFileSync('./public/apple-touch-icon.png', png192);

const png512 = createPng(512, 10, 15, 29);
fs.writeFileSync('./public/pwa-512x512.png', png512);

console.log('PNG Icons successfully generated!');
