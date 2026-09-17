/**
 * Generates a complete brand asset set from one SVG path and a font.
 *
 *   npm i sharp png-to-ico opentype.js@1.3.4 geist
 *   node generate-brand.cjs                     # writes ./brand
 *   node generate-brand.cjs --out ../brand      # somewhere else
 *
 * Pin opentype.js to 1.x. Version 2.0.0 emits literal `NaN` into path data for some glyph and
 * offset combinations; rasterizers then stop parsing at the NaN and silently drop the rest of the
 * word. The NaN guard below turns that into a crash instead of a corrupted logo.
 *
 * Everything below the CONFIG block is derived. Edit CONFIG, run, commit the output.
 */
const fs = require("node:fs");
const path = require("node:path");
const opentype = require("opentype.js");
// png-to-ico v2 exports the function, v3 puts it on .default.
const pngToIcoModule = require("png-to-ico");
const pngToIco = pngToIcoModule.default ?? pngToIcoModule;
const sharp = require("sharp");

// ---------------------------------------------------------------- CONFIG ----
const CONFIG = {
  name: "Acme",
  tagline: "What the product does, in one line",
  /** Ink is the mark on light backgrounds; paper is the mark on dark ones. */
  ink: "#0a0a0a",
  paper: "#ffffff",
  /** Border drawn around the light app-icon tile so it stays visible on white. */
  tileBorder: "#e5e5e5",
  /**
   * The mark, drawn on a 32×32 grid. `fill` is substituted.
   * The script measures the drawn ink and centres it, so the mark need not fill the grid — but keep
   * it to one idea, two paths at most, and nothing thinner than 1.5 units.
   */
  mark: (fill) => `<path d="M14 18 L26 18 A12 12 0 1 1 14 6 Z" fill="${fill}"/><path d="M18 14 L18 2 A12 12 0 0 1 30 14 Z" fill="${fill}"/>`,
  /** TTF/OTF files, resolved from the working directory or from this script's folder. */
  fontBold: "node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf",
  fontRegular: "node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf",
  /** Letter-spacing for the wordmark, in em. Match the site's heading tracking. */
  tracking: -0.02,
  out: "brand",
};
// -------------------------------------------------------------------------- //

const argOut = process.argv.indexOf("--out");
if (argOut > -1 && !process.argv[argOut + 1]) { console.error("--out needs a directory"); process.exit(1); }
const OUT = path.resolve(argOut > -1 ? process.argv[argOut + 1] : CONFIG.out);
/** Dropped in the output folder so a re-run knows it owns the directory and may clear it. */
const MARKER = ".brand-kit";

const { name: NAME, ink: INK, paper: PAPER, mark: MARK } = CONFIG;
const slug = NAME.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand";

/** Fonts resolve from the working directory first, then from next to this script. */
const findFont = (p) => {
  for (const c of [path.resolve(p), path.resolve(__dirname, p)]) if (fs.existsSync(c)) return c;
  console.error(`Font not found: ${p}\nInstall it (npm i geist) or point CONFIG.fontBold / fontRegular at a .ttf you have.`);
  process.exit(1);
};
// A fresh Uint8Array copy, because a pooled Buffer's .buffer is the whole 8KB pool.
const loadFont = (p) => opentype.parse(new Uint8Array(fs.readFileSync(findFont(p))).buffer);
const bold = loadFont(CONFIG.fontBold);
const regular = loadFont(CONFIG.fontRegular);

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;
/** Strips the outer <svg> so one drawing can be nested inside another. */
const inner = (s) => s.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
/** density matters for sub-pixel detail such as the light tile's hairline border. */
const png = (svgStr, file, w, h) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return sharp(Buffer.from(svgStr), { density: 384 }).resize(w, h).png().toFile(file);
};

/**
 * Text as outlines, ONE <path> ELEMENT PER GLYPH.
 *
 * Never join glyphs into a single `d`: a rasterizer stops at the first malformed number, so one bad
 * coordinate silently swallows the rest of the line. Per-glyph elements contain the damage, and the
 * NaN guard turns a silent truncation into a loud failure.
 */
function textPath(text, size, font, tracking = 0) {
  let x = 0;
  const glyphs = [];
  for (const ch of [...text]) {
    const g = font.charToGlyph(ch);
    const d = g.getPath(x, 0, size).toPathData(3);
    if (/NaN/.test(d)) throw new Error(`The font produced NaN for "${ch}" at x=${x.toFixed(2)}. Pin opentype.js to 1.3.4.`);
    glyphs.push(d);
    x += (g.advanceWidth / font.unitsPerEm) * size + tracking * size;
  }
  const bb = font.getPath(text, 0, 0, size).getBoundingBox();
  const render = (fill, transform = "") =>
    glyphs.map((d) => `<path${transform ? ` transform="${transform}"` : ""} d="${d}" fill="${fill}"/>`).join("");
  return { render, width: x - tracking * size, capTop: -bb.y1, bottom: bb.y2 };
}

const wordPath = (text, size, font = bold) => textPath(text, size, font, CONFIG.tracking);

/** A line of body text, centred on `cx`, sitting on baseline `y`. */
const centered = (text, size, cx, y, fill) => {
  const t = textPath(text, size, regular);
  return t.render(fill, `translate(${cx - t.width / 2} ${y})`);
};

/**
 * Where the mark's ink actually sits on the 32-unit grid.
 *
 * Icons centre the ink, not the grid, so a mark that does not fill its viewBox still looks centred
 * in the tile. Measured by rasterizing once and reading the alpha channel.
 */
async function markBox() {
  const size = 256;
  const { data, info } = await sharp(Buffer.from(svg(32, 32, MARK("#000000"))), { density: 384 })
    .resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = size, minY = size, maxX = -1, maxY = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[(y * size + x) * info.channels + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) { console.error("CONFIG.mark drew nothing. Check the path data."); process.exit(1); }
  const u = 32 / size;
  return { x: minX * u, y: minY * u, w: (maxX - minX + 1) * u, h: (maxY - minY + 1) * u };
}

async function main() {
  // Refuse to wipe a directory this script did not create — `--out ./public` must not delete a site.
  if (fs.existsSync(OUT)) {
    const entries = fs.readdirSync(OUT);
    if (entries.length && !entries.includes(MARKER)) {
      console.error(`${OUT} is not empty and was not created by this script. Refusing to overwrite it.\nChoose an empty directory, or delete that one yourself first.`);
      process.exit(1);
    }
    fs.rmSync(OUT, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, MARKER), `${NAME}\n`);

  const box = await markBox();
  /** Places the mark's ink inside a square of `side`, filling `ratio` of it, centred. */
  const placeMark = (side, ratio, fill) => {
    const scale = (side * ratio) / Math.max(box.w, box.h);
    const dx = (side - box.w * scale) / 2 - box.x * scale;
    const dy = (side - box.h * scale) / 2 - box.y * scale;
    return `<g transform="translate(${dx.toFixed(3)} ${dy.toFixed(3)}) scale(${scale.toFixed(5)})">${MARK(fill)}</g>`;
  };

  // 1. The mark on its own, transparent, in both colours.
  const markInk = svg(32, 32, MARK(INK));
  const markPaper = svg(32, 32, MARK(PAPER));
  write(`${OUT}/mark/${slug}-mark-black.svg`, markInk);
  write(`${OUT}/mark/${slug}-mark-white.svg`, markPaper);
  for (const s of [256, 512, 1024]) {
    await png(markInk, `${OUT}/mark/${slug}-mark-black-${s}.png`, s, s);
    await png(markPaper, `${OUT}/mark/${slug}-mark-white-${s}.png`, s, s);
  }

  // 2. App icon: the mark on a rounded tile, in both polarities.
  const tile = (bg, fg, border) =>
    svg(32, 32, `<rect width="32" height="32" rx="7" fill="${bg}"/>${border ? `<rect x="0.25" y="0.25" width="31.5" height="31.5" rx="6.75" fill="none" stroke="${border}" stroke-width="0.5"/>` : ""}${placeMark(32, 0.62, fg)}`);
  const iconDark = tile(INK, PAPER);
  const iconLight = tile(PAPER, INK, CONFIG.tileBorder);
  write(`${OUT}/icon/${slug}-icon-dark.svg`, iconDark);
  write(`${OUT}/icon/${slug}-icon-light.svg`, iconLight);
  for (const s of [16, 32, 48, 64, 128, 256, 512, 1024]) {
    await png(iconDark, `${OUT}/icon/${slug}-icon-dark-${s}.png`, s, s);
    await png(iconLight, `${OUT}/icon/${slug}-icon-light-${s}.png`, s, s);
  }

  // 3. Favicons. `var()` carries a literal fallback so non-browser rasterizers still see the colour.
  write(`${OUT}/favicon/favicon.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>:root{--tile:${INK};--mark:${PAPER}}@media (prefers-color-scheme: dark){:root{--tile:${PAPER};--mark:${INK}}}</style><rect width="32" height="32" rx="7" fill="var(--tile, ${INK})"/>${placeMark(32, 0.62, `var(--mark, ${PAPER})`)}</svg>\n`);
  const icoParts = [];
  for (const s of [16, 32, 48]) {
    const f = `${OUT}/favicon/favicon-${s}.png`;
    await png(iconDark, f, s, s);
    icoParts.push(f);
  }
  write(`${OUT}/favicon/favicon.ico`, await pngToIco(icoParts));

  // Apple and Android want full-bleed squares; both platforms apply their own corner mask.
  const square = (size, bg, fg) => svg(size, size, `<rect width="${size}" height="${size}" fill="${bg}"/>${placeMark(size, 0.6, fg)}`);
  await png(square(180, INK, PAPER), `${OUT}/favicon/apple-touch-icon.png`, 180, 180);
  await png(square(192, INK, PAPER), `${OUT}/favicon/android-chrome-192.png`, 192, 192);
  await png(square(512, INK, PAPER), `${OUT}/favicon/android-chrome-512.png`, 512, 512);
  write(`${OUT}/favicon/site.webmanifest`, JSON.stringify({
    name: NAME, short_name: NAME,
    icons: [{ src: "/android-chrome-192.png", sizes: "192x192", type: "image/png" }, { src: "/android-chrome-512.png", sizes: "512x512", type: "image/png" }],
    theme_color: INK, background_color: PAPER, display: "standalone",
  }, null, 2) + "\n");

  // 4. Wordmark and lockup (mark + wordmark), both polarities, SVG plus @2x and @4x PNG.
  const size = 100;
  const word = wordPath(NAME, size);
  const pad = 4;
  const wordW = Math.ceil(word.width) + pad * 2;
  const wordH = Math.ceil(word.capTop + word.bottom) + pad * 2;
  const wordSvg = (fill) => svg(wordW, wordH, word.render(fill, `translate(${pad} ${pad + word.capTop})`));
  write(`${OUT}/wordmark/${slug}-wordmark-black.svg`, wordSvg(INK));
  write(`${OUT}/wordmark/${slug}-wordmark-white.svg`, wordSvg(PAPER));

  const markSize = Math.round(word.capTop * 1.18);       // cap height, slightly overshot
  const gap = Math.round(markSize * 0.42);
  // The box must clear the mark AND the word's descenders, or letters like "p" get cut off.
  const textH = word.capTop + word.bottom;
  const lockH = Math.ceil(Math.max(markSize, textH)) + pad * 2;
  const lockW = markSize + gap + Math.ceil(word.width) + pad * 2;
  const lockup = (fill) =>
    svg(lockW, lockH,
      `<g transform="translate(${pad} ${(lockH - markSize) / 2}) scale(${markSize / 32})">${MARK(fill)}</g>` +
      word.render(fill, `translate(${pad + markSize + gap} ${(lockH - textH) / 2 + word.capTop})`));
  write(`${OUT}/wordmark/${slug}-lockup-black.svg`, lockup(INK));
  write(`${OUT}/wordmark/${slug}-lockup-white.svg`, lockup(PAPER));
  for (const [scale, suffix] of [[2, "@2x"], [4, "@4x"]]) {
    await png(wordSvg(INK), `${OUT}/wordmark/${slug}-wordmark-black${suffix}.png`, wordW * scale, wordH * scale);
    await png(wordSvg(PAPER), `${OUT}/wordmark/${slug}-wordmark-white${suffix}.png`, wordW * scale, wordH * scale);
    await png(lockup(INK), `${OUT}/wordmark/${slug}-lockup-black${suffix}.png`, lockW * scale, lockH * scale);
    await png(lockup(PAPER), `${OUT}/wordmark/${slug}-lockup-white${suffix}.png`, lockW * scale, lockH * scale);
  }

  // 5. A static social card, for the root og:image fallback. Per-page cards belong to the og-images skill.
  const og = (bg, fg, sub) => {
    const s = Math.min(1.35, 900 / lockW);
    const lw = lockW * s, lh = lockH * s;
    return svg(1200, 630, `<rect width="1200" height="630" fill="${bg}"/><g transform="translate(${(1200 - lw) / 2} ${270 - lh / 2}) scale(${s})">${inner(lockup(fg))}</g>${centered(CONFIG.tagline, 44, 600, 420, sub)}`);
  };
  await png(og(PAPER, INK, "#525252"), `${OUT}/social/${slug}-og-light.png`, 1200, 630);
  await png(og(INK, PAPER, "#a3a3a3"), `${OUT}/social/${slug}-og-dark.png`, 1200, 630);

  // 6. One sheet showing every asset, so a human can check the whole set in a single look.
  // Every scale is clamped by width as well as height, so a long name cannot run off the canvas.
  const topScale = Math.min(110 / lockH, 620 / lockW);
  const panelScale = Math.min(62 / lockH, 300 / lockW);
  const panelW = Math.ceil(lockW * panelScale) + 48;
  const sheet = svg(1200, 620,
    `<rect width="1200" height="620" fill="${PAPER}"/>` +
    `<g transform="translate(80 70) scale(${topScale})">${inner(lockup(INK))}</g>` +
    `<g transform="translate(80 230)">${placeMark(110, 1, INK)}</g>` +
    `<g transform="translate(300 230) scale(3.4)">${inner(iconDark)}</g>` +
    `<g transform="translate(520 230) scale(3.4)">${inner(iconLight)}</g>` +
    `<g transform="translate(${1120 - panelW} 230)"><rect width="${panelW}" height="110" rx="10" fill="${INK}"/><g transform="translate(24 ${(110 - lockH * panelScale) / 2}) scale(${panelScale})">${inner(lockup(PAPER))}</g></g>` +
    [16, 32, 48, 64].map((s, i) => `<g transform="translate(${80 + i * 100} 420) scale(${s / 32})">${inner(iconDark)}</g>`).join("") +
    centered(`${NAME} — mark, app icon, favicon at 16 / 32 / 48 / 64, lockup`, 26, 600, 560, "#525252"));
  await png(sheet, `${OUT}/${slug}-brand-sheet.png`, 1200, 620);

  const files = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name)); })(OUT);
  console.log(`${files.length - 1} files in ${OUT}`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
