// generate-icons.js
// Generates valid PNG/ICO/ICNS placeholder icons for Tauri using pure Node.js (no deps).
// Each icon is a gradient square: deep purple (#2d1b69) to electric blue (#00d4ff),
// with a play-triangle overlay.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ICONS_DIR = path.join(__dirname, "src-tauri", "icons");

// ── PNG generation ──────────────────────────────────────────────────────────

function createPixelData(size) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      const r = Math.round(0x2d * (1 - t) + 0x00 * t);
      const g = Math.round(0x1b * (1 - t) + 0xd4 * t);
      const b = Math.round(0x69 * (1 - t) + 0xff * t);

      let pr = r, pg = g, pb = b, a = 255;

      // Draw a play triangle in the center
      const cx = size / 2;
      const cy = size / 2;
      const s = size * 0.25;
      if (isInsideTriangle(x, y,
        cx - s * 0.5, cy - s * 0.7,
        cx - s * 0.5, cy + s * 0.7,
        cx + s * 0.7, cy)) {
        pr = 255; pg = 255; pb = 255; a = 220;
      }

      const off = 1 + x * 4;
      row[off]     = pr;
      row[off + 1] = pg;
      row[off + 2] = pb;
      row[off + 3] = a;
    }
    rows.push(row);
  }
  return Buffer.concat(rows);
}

function isInsideTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const d1 = sign(px, py, x1, y1, x2, y2);
  const d2 = sign(px, py, x2, y2, x3, y3);
  const d3 = sign(px, py, x3, y3, x1, y1);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function sign(px, py, x1, y1, x2, y2) {
  return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePNGChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function generatePNG(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace
  const ihdrChunk = makePNGChunk("IHDR", ihdr);

  const rawPixels = createPixelData(size);
  const compressed = zlib.deflateSync(rawPixels, { level: 9 });
  const idatChunk = makePNGChunk("IDAT", compressed);

  const iendChunk = makePNGChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// ── ICO generation (PNG-embedded, valid since Windows Vista) ────────────────

function generateICO(pngBuffers) {
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffset = headerSize + dirEntrySize * numImages;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(numImages, 4);

  const dirEntries = [];
  const imageDataParts = [];
  let currentOffset = dataOffset;

  for (const { size, png } of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry[0] = size < 256 ? size : 0;
    entry[1] = size < 256 ? size : 0;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(currentOffset, 12);
    dirEntries.push(entry);
    imageDataParts.push(png);
    currentOffset += png.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageDataParts]);
}

// ── ICNS generation (minimal valid with ic07 = 128x128 PNG) ─────────────────

function generateICNS(png128) {
  const type = Buffer.from("icns", "ascii");
  const entryType = Buffer.from("ic07", "ascii");
  const entrySize = Buffer.alloc(4);
  entrySize.writeUInt32BE(8 + png128.length);

  const fileSize = Buffer.alloc(4);
  fileSize.writeUInt32BE(8 + 8 + png128.length);

  return Buffer.concat([type, fileSize, entryType, entrySize, png128]);
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("Generating placeholder icons...\n");

  const png32  = generatePNG(32);
  const png128 = generatePNG(128);
  const png256 = generatePNG(256);

  const files = [
    { name: "32x32.png",       data: png32  },
    { name: "128x128.png",     data: png128 },
    { name: "128x128@2x.png",  data: png256 },
    { name: "icon.png",        data: png32  },
  ];

  for (const { name, data } of files) {
    const filePath = path.join(ICONS_DIR, name);
    fs.writeFileSync(filePath, data);
    console.log("  " + name + " (" + data.length + " bytes)");
  }

  const ico = generateICO([
    { size: 32,  png: png32  },
    { size: 256, png: png256 },
  ]);
  const icoPath = path.join(ICONS_DIR, "icon.ico");
  fs.writeFileSync(icoPath, ico);
  console.log("  icon.ico (" + ico.length + " bytes)");

  const icns = generateICNS(png128);
  const icnsPath = path.join(ICONS_DIR, "icon.icns");
  fs.writeFileSync(icnsPath, icns);
  console.log("  icon.icns (" + icns.length + " bytes)");

  console.log("\nAll icons generated successfully.");
}

main();
