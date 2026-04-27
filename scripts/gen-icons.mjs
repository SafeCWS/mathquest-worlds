// One-off icon generator. Reads public/icons/icon.svg, emits PNGs.
// Run via: node scripts/gen-icons.mjs
// Output is committed; this script does not run on every build.
import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/icons/icon.svg');
const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 32, name: 'favicon-32.png' },
];

for (const { size, name } of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`./public/icons/${name}`);
  console.log(`Generated ${name} (${size}x${size})`);
}
