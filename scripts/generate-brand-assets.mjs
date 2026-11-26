import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const source = fileURLToPath(new URL("assets/branding/logo-source.png", root));
const output = fileURLToPath(new URL("public/branding/", root));
await mkdir(output, { recursive: true });

// Crop transparent margins only. Both parts retain the supplied artwork's ratio.
const symbol = await sharp(source)
  .extract({ left: 331, top: 115, width: 658, height: 805 })
  .png()
  .toBuffer();
const wordmark = await sharp(source)
  .extract({ left: 87, top: 938, width: 1138, height: 172 })
  .resize({ width: 516 })
  .png()
  .toBuffer();
await sharp(source)
  .extract({ left: 87, top: 114, width: 1138, height: 997 })
  .resize({ width: 570 })
  .png()
  .toFile(`${output}/logo.png`);
await sharp(symbol)
  .resize({ height: 192 })
  .png()
  .toFile(`${output}/symbol.png`);
await sharp({
  create: { width: 720, height: 192, channels: 4, background: "#0000" },
})
  .composite([
    {
      input: await sharp(symbol).resize({ height: 192 }).toBuffer(),
      left: 0,
      top: 0,
    },
    { input: wordmark, left: 192, top: 57 },
  ])
  .png()
  .toFile(`${output}/logo-horizontal.png`);

async function icon(size, fraction = 0.88) {
  const artwork = await sharp(symbol)
    .resize({
      width: Math.round(size * fraction),
      height: Math.round(size * fraction),
      fit: "inside",
    })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: artwork, gravity: "centre" }])
    .png()
    .toBuffer();
}

for (const size of [16, 32, 48]) {
  await writeFile(`${output}/favicon-${size}.png`, await icon(size));
}
await writeFile(`${output}/apple-touch-icon.png`, await icon(180));
for (const size of [192, 512]) {
  await writeFile(`${output}/icon-${size}.png`, await icon(size));
}
// The entire symbol sits inside the maskable icon's central safe circle.
await writeFile(`${output}/icon-maskable-512.png`, await icon(512, 0.6));

// Multi-resolution ICO, using PNG entries without another build dependency.
const frames = await Promise.all([16, 32, 48].map((size) => icon(size)));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((frame, index) => {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = [16, 32, 48][index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await writeFile(
  new URL("public/favicon.ico", root),
  Buffer.concat([header, ...frames]),
);
console.log("Generated motafawiq.ma logos, favicons, and app icons.");
