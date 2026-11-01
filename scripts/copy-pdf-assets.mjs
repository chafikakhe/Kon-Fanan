import { cp, mkdir, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const root = dirname(require.resolve("pdfjs-dist/package.json"));
const target = new URL("../public/pdfjs/", import.meta.url);
await mkdir(target, { recursive: true });
for (const name of ["cmaps", "standard_fonts", "wasm", "iccs"])
  await cp(join(root, name), new URL(name, target), { recursive: true });
await copyFile(join(root, "LICENSE"), new URL("LICENSE", target));
