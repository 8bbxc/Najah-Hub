const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const pngPath = path.join(publicDir, 'najah-hub-icon.png');
const outPath = path.join(publicDir, 'favicon.ico');

if (!fs.existsSync(pngPath)) {
  console.error('Source PNG not found:', pngPath);
  process.exit(2);
}

const png = fs.readFileSync(pngPath);

// Read PNG width/height from IHDR (bytes 16..23 big-endian)
let width = 0, height = 0;
try {
  width = png.readUInt32BE(16);
  height = png.readUInt32BE(20);
} catch (e) {
  // fallback
  width = 32; height = 32;
}

const widthByte = width >= 256 ? 0 : width;
const heightByte = height >= 256 ? 0 : height;

// ICONDIR (6 bytes)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(1, 4); // count = 1

// ICONDIRENTRY (16 bytes)
const entry = Buffer.alloc(16);
entry.writeUInt8(widthByte, 0); // width
entry.writeUInt8(heightByte, 1); // height
entry.writeUInt8(0, 2); // color count
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // planes (set 1)
entry.writeUInt16LE(32, 6); // bit count (32 for PNG with alpha)
entry.writeUInt32LE(png.length, 8); // bytes in resource
entry.writeUInt32LE(header.length + entry.length, 12); // image offset

const out = Buffer.concat([header, entry, png]);
fs.writeFileSync(outPath, out);
console.log('Wrote', outPath, ' (', png.length, 'bytes PNG embedded)');
