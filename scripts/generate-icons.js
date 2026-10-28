import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcPayload, crcBuf]);
}

function generateBrieflyPng(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Raw image data: height rows, each with 1 filter byte (0) + width * 4 (RGBA)
  const rawBytes = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  // Brand colors:
  // Background: Deep dark slate #0b0f17 (R: 11, G: 15, B: 23)
  // Accent badge: Royal Blue #2563eb (R: 37, G: 99, B: 235)
  // Foreground 'B': White #ffffff (R: 255, G: 255, B: 255)
  
  const bgR = 11, bgG = 15, bgB = 23;
  const badgeR = 37, badgeG = 99, badgeB = 235;

  const badgeRadius = isMaskable ? size * 0.35 : size * 0.38;
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      // Distance from center for rounded badge / icon
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const dist = Math.max(dx, dy);

      // Check if inside badge area
      const inBadge = isMaskable || dist < badgeRadius;

      // Draw stylized letter 'B'
      // Normalized coords inside badge: -1 to 1
      const nx = (x - cx) / (badgeRadius * 0.7);
      const ny = (y - cy) / (badgeRadius * 0.7);

      let isLetter = false;
      if (nx >= -0.5 && nx <= 0.5 && ny >= -0.7 && ny <= 0.7) {
        // Vertical stem of B
        if (nx >= -0.45 && nx <= -0.15 && ny >= -0.65 && ny <= 0.65) {
          isLetter = true;
        }
        // Top bar
        if (ny >= -0.65 && ny <= -0.45 && nx >= -0.45 && nx <= 0.25) {
          isLetter = true;
        }
        // Middle bar
        if (ny >= -0.12 && ny <= 0.08 && nx >= -0.45 && nx <= 0.25) {
          isLetter = true;
        }
        // Bottom bar
        if (ny >= 0.45 && ny <= 0.65 && nx >= -0.45 && nx <= 0.25) {
          isLetter = true;
        }
        // Top loop right curved edge
        const dLoop1 = Math.hypot(nx - 0.1, ny - (-0.38));
        if (dLoop1 <= 0.32 && dLoop1 >= 0.12 && nx >= -0.1) {
          isLetter = true;
        }
        // Bottom loop right curved edge
        const dLoop2 = Math.hypot(nx - 0.1, ny - 0.38);
        if (dLoop2 <= 0.34 && dLoop2 >= 0.14 && nx >= -0.1) {
          isLetter = true;
        }
      }

      if (isLetter) {
        rawBytes[offset++] = 255;
        rawBytes[offset++] = 255;
        rawBytes[offset++] = 255;
        rawBytes[offset++] = 255;
      } else if (inBadge) {
        rawBytes[offset++] = badgeR;
        rawBytes[offset++] = badgeG;
        rawBytes[offset++] = badgeB;
        rawBytes[offset++] = 255;
      } else {
        rawBytes[offset++] = bgR;
        rawBytes[offset++] = bgG;
        rawBytes[offset++] = bgB;
        rawBytes[offset++] = 255;
      }
    }
  }

  // Compress IDAT
  const compressedData = zlib.deflateSync(rawBytes);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateBrieflyPng(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateBrieflyPng(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateBrieflyPng(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateBrieflyPng(180));
console.log('Successfully generated PWA icon set!');
