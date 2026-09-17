/**
 * Converts captured PNGs to WebP using Chromium's own encoder.
 *
 *   npx tsx to-webp.ts <srcDir> <outDir> [name ...]     # names default to every PNG in srcDir
 *
 * Why Chromium rather than sharp: if sharp is already a dependency, use it instead — one line.
 * This script is the fallback for repos without it, since cwebp and ImageMagick are usually not
 * installed while Chromium already is, for the capture step. Output sizes are within a couple of
 * percent of each other. A 2880px screenshot lands well under 200KB either way.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const [src, outDir, ...only] = process.argv.slice(2);
if (!src || !outDir) { console.error("usage: to-webp.ts <srcDir> <outDir> [name ...]"); process.exit(1); }

/** playwright-core locates its own browser; CHROME_PATH is only for an unusual install. */
const launch = { headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) };
/** Cap the long edge. Beyond this nobody sees the extra pixels and the file doubles.
 *  Whatever you set here is the intrinsic width of the shipped image — use it in the registry. */
const MAX_WIDTH = 2400;
const QUALITY = 0.86;

async function main() {
  mkdirSync(outDir, { recursive: true });
  const names = (only.length ? only : readdirSync(src).filter((f) => f.endsWith(".png"))).map((f) => f.replace(/\.png$/, ""));
  const browser = await chromium.launch(launch);
  const page = await browser.newPage();

  for (const name of names) {
    const data = readFileSync(join(src, `${name}.png`)).toString("base64");
    const out = await page.evaluate(async ({ d, maxWidth, quality }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${d}`;
      await img.decode();
      const w = Math.min(maxWidth, img.width);
      const h = Math.round(img.height * (w / img.width));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      return { url: canvas.toDataURL("image/webp", quality), w, h };
    }, { d: data, maxWidth: MAX_WIDTH, quality: QUALITY });

    if (!out.url.startsWith("data:image/webp")) throw new Error("this Chromium did not encode WebP");
    writeFileSync(join(outDir, `${name}.webp`), Buffer.from(out.url.split(",")[1], "base64"));
    console.log(name, `${out.w}×${out.h}`);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
