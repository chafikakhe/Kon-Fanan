import { cp, mkdir, copyFile, readFile, writeFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const root = dirname(require.resolve("pdfjs-dist/package.json"));
const version = JSON.parse(
  await readFile(join(root, "package.json"), "utf8"),
).version;
const target = new URL("../public/pdfjs/", import.meta.url);
const marker = new URL("VERSION", target);
const lock = new URL("../public/.pdfjs-assets.lock/", import.meta.url);
const prepared = async () => {
  try {
    return (await readFile(marker, "utf8")).trim() === version;
  } catch {
    return false;
  }
};
await mkdir(new URL("../public/", import.meta.url), { recursive: true });
if (!(await prepared())) {
  const deadline = Date.now() + 15000;
  let acquired = false;
  while (!acquired) {
    try {
      await mkdir(lock);
      acquired = true;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      if (await prepared()) break;
      if (Date.now() > deadline)
        throw Error(
          "Préparation des fichiers PDF déjà en cours. Réessayez dans quelques instants.",
        );
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  if (acquired) {
    try {
      if (!(await prepared())) {
        await mkdir(target, { recursive: true });
        for (const name of ["cmaps", "standard_fonts", "wasm", "iccs"])
          await cp(join(root, name), new URL(name, target), {
            recursive: true,
          });
        await copyFile(join(root, "LICENSE"), new URL("LICENSE", target));
        await writeFile(marker, version + "\n");
      }
    } finally {
      await rm(lock, { recursive: true, force: true });
    }
  }
}
