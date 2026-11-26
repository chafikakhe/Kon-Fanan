import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = fileURLToPath(
  new URL(
    "../assets/branding/Students_celebrating_graduation_…_09a5f4b9.mp4",
    import.meta.url,
  ),
);
const output = (name) =>
  fileURLToPath(new URL(`../public/branding/${name}`, import.meta.url));
function ffmpeg(args, capture = false) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-y", ...args], {
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error("Hero media export failed.");
  return result.stdout;
}

// The supplied 1280 × 720 source has no visible Flow watermark. Preserve its
// full frame: faces, gown branding and the entire phone are already in shot.
// Encode directly from the original, with audio removal in the same export.
ffmpeg([
  "-i",
  source,
  "-map",
  "0:v:0",
  "-an",
  "-sn",
  "-dn",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "23",
  "-maxrate",
  "1800k",
  "-bufsize",
  "3600k",
  "-pix_fmt",
  "yuv420p",
  "-profile:v",
  "high",
  "-level:v",
  "3.1",
  "-map_metadata",
  "-1",
  "-movflags",
  "+faststart",
  output("hero-graduation.mp4"),
]);
// Use the clear, final logo reveal as the static fallback.
await sharp(
  ffmpeg(
    [
      "-ss",
      "5.5",
      "-i",
      source,
      "-frames:v",
      "1",
      "-f",
      "image2pipe",
      "-c:v",
      "png",
      "pipe:1",
    ],
    true,
  ),
)
  .webp({ quality: 75, effort: 6 })
  .toFile(output("hero-graduation-poster.webp"));
