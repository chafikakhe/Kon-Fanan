import { brotliDecompressSync } from "node:zlib";
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  ResourceLimits,
} from "npm:@imagemagick/magick-wasm@0.0.45";
import { PDFDocument, PDFName } from "npm:pdf-lib@1.17.1";
import { AppError } from "./http.ts";

export function detectMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n))
    return "image/png";
  const ascii = new TextDecoder().decode(bytes.slice(0, 12));
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP")
    return "image/webp";
  if (ascii.startsWith("%PDF-")) return "application/pdf";
  return null;
}
let imageReady: Promise<void> | undefined;
async function initialize(): Promise<void> {
  imageReady ??= (async () => {
    // Keep the static deployment asset below the Management API upload limit.
    const compressed = await Deno.readFile(
      new URL("./magick.wasm.br", import.meta.url),
    );
    const wasm = new Uint8Array(brotliDecompressSync(compressed));
    await initializeImageMagick(wasm);
    ResourceLimits.memory = 96n * 1024n * 1024n;
    ResourceLimits.maxMemoryRequest = 64n * 1024n * 1024n;
    ResourceLimits.disk = 0n;
    ResourceLimits.width = 12000n;
    ResourceLimits.height = 12000n;
    // The decoder uses auxiliary images even for a single WebP. Bound the list without rejecting ordinary images.
    ResourceLimits.listLength = 4n;
    ResourceLimits.time = 15n;
  })();
  await imageReady;
}
export async function normalizeFile(
  bytes: Uint8Array,
  declaredMime: string,
): Promise<Uint8Array> {
  const mime = detectMime(bytes);
  if (!mime || mime !== declaredMime)
    throw new AppError(
      "FILE_INVALID",
      "Le contenu réel ne correspond pas au format du fichier.",
      422,
    );
  try {
    if (mime === "application/pdf") {
      const pdf = await PDFDocument.load(bytes, {
        ignoreEncryption: false,
        throwOnInvalidObject: true,
      });
      if (!pdf.getPageCount() || pdf.getPageCount() > 100)
        throw new Error("page limit");
      // Rebuild visual pages, dropping document scripts, attachments, forms and annotations/actions.
      const clean = await PDFDocument.create();
      for (const page of await clean.copyPages(pdf, pdf.getPageIndices())) {
        page.node.delete(PDFName.of("Annots"));
        page.node.delete(PDFName.of("AA"));
        clean.addPage(page);
      }
      clean.setProducer("Kon-fanan");
      clean.setCreator("Kon-fanan");
      return await clean.save();
    }
    await initialize();
    const format =
      mime === "image/jpeg"
        ? MagickFormat.Jpeg
        : mime === "image/png"
          ? MagickFormat.Png
          : MagickFormat.WebP;
    return ImageMagick.read(bytes, format, (image) => {
      if (image.width * image.height > 24_000_000)
        throw new Error("pixel limit");
      image.autoOrient();
      image.strip();
      image.quality = 88;
      return image.write(format, (output) => new Uint8Array(output));
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "FILE_INVALID",
      "Fichier illisible, protégé ou trop complexe. Choisissez une photo ou un PDF simple de 100 pages maximum.",
      422,
    );
  }
}
export { fileLimit } from "./file-rules.ts";
