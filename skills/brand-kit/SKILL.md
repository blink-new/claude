---
name: brand-kit
description: Generate a whole brand asset set from one SVG path — logo mark, wordmark, lockup, app icons, favicon.ico, apple-touch-icon, Android icons, webmanifest and a social card — with code, no designer and no image model. Use when the user asks for a logo, favicon, app icon, wordmark, brand assets, icon.svg, apple-touch-icon, or says their site has no icon in the browser tab.
---

# Brand kit from one SVG path

A startup needs about 50 image files to look real in a browser tab, on a phone home screen, and in a link preview. All of them come from one mark. Draw the mark once as an SVG path, then derive everything with a script that anyone can re-run when the brand changes.

Do not generate logos with an image model. They produce raster blobs at one size, with soft edges and no transparency, and they cannot be re-coloured. A path is 200 bytes, scales forever, and can be recoloured in one variable.

## When to use

- "Make us a logo", "we need a favicon", "the browser tab shows a blank page icon"
- Wiring icons into a Next.js, Vite or static site
- Rebranding: new colour, new name, same geometry

## Do this

1. **Draw the mark on a 32×32 grid.** One idea, two paths at most, no gradients, no text inside the mark. It does not have to fill the grid: the script measures the ink and centres it in every tile.
2. **Copy [assets/generate-brand.cjs](assets/generate-brand.cjs)** into a scratch folder.
3. **Edit the `CONFIG` block**: name, tagline, ink and paper colours, the mark path, the font files.
4. **Install the packages and run it.**
5. **Wire the output into the app** (table below).
6. **Look at `brand/<slug>-brand-sheet.png`.** It shows the mark, both app icons, the favicon at 16/32/48/64 and the lockup on one canvas. If it reads at 16px, you are done.

```bash
npm i sharp png-to-ico opentype.js@1.3.4 geist
node generate-brand.cjs --out ./brand
```

**Pin `opentype.js` to 1.x.** Version 2.0.0 emits literal `NaN` into path data for some glyph and offset combinations — about 8% of five-letter names hit it. Rasterizers stop at the `NaN` and drop the rest of the word, with no error, so you ship a logo that reads "Jump" instead of "Jumpy". The script also asserts on `NaN` and crashes rather than writing a corrupted file. `geist` is only the default font; point `CONFIG.fontBold` and `fontRegular` at any TTF you have.

**`--out` clears its target directory.** It refuses to touch a non-empty folder it did not create, so `--out ./public` cannot wipe your site — but keep the output in its own folder anyway.

## Designing the mark

The constraint is 16×16 pixels. That is the size that decides whether the mark works.

- **One idea.** A pie with a slice pulled out. A folded corner. A bracket. Not a scene.
- **Geometry, not illustration.** Circles, arcs and rectangles on the 32-unit grid, so coordinates stay whole numbers.
- **Say what the product does.** A cap table product uses a pie slice. A mail product uses an envelope corner. Draw the noun the product is about.
- **Two fills maximum**, and both are the same colour. Colour comes from the tile behind the mark, not from the mark.
- **No thin strokes.** Anything under 1.5 units disappears at 16px. Prefer filled shapes to outlines.
- **Check the negative space.** The gap between shapes has to survive being 1 pixel wide.
- **Position does not matter, proportion does.** Icons are centred on the mark's measured ink, not on the grid, so a mark drawn in one corner still lands in the middle of the tile. What matters is the aspect ratio: something very wide or very tall will be scaled down to fit a square.

The default mark in the script is a pie with one slice separated:

```js
mark: (fill) => `<path d="M14 18 L26 18 A12 12 0 1 1 14 6 Z" fill="${fill}"/><path d="M18 14 L18 2 A12 12 0 0 1 30 14 Z" fill="${fill}"/>`
```

Two arcs, one grid, works at any size. Start from it and change the geometry, not the structure.

## What the script produces

| Folder | Files | Used by |
|---|---|---|
| `mark/` | SVG plus 256/512/1024 PNG, black and white, transparent | Slides, README, press |
| `icon/` | Rounded tile, dark and light, SVG plus 16→1024 PNG | In-app avatars, docs, marketplace listings |
| `favicon/` | `favicon.svg`, `favicon.ico` (16+32+48), the three source `favicon-16/32/48.png`, `apple-touch-icon.png`, `android-chrome-192/512.png`, `site.webmanifest` | Browsers, iOS home screen, Android install |
| `wordmark/` | Name alone and mark+name lockup, SVG plus @2x and @4x PNG, both polarities | Site header, emails, invoices, PDFs |
| `social/` | 1200×630 card, light and dark | Root `og:image` fallback |
| root | `<slug>-brand-sheet.png` | The one image a human reviews |

The wordmark is converted to **outlines**, so nobody needs the font installed to render it, and the letter-spacing matches the site's headings.

## Wiring it into a Next.js app

The App Router picks these up by file name. No `<link>` tags needed:

| Copy to | From |
|---|---|
| `src/app/icon.svg` | `brand/favicon/favicon.svg` |
| `src/app/favicon.ico` | `brand/favicon/favicon.ico` |
| `src/app/apple-icon.png` | `brand/favicon/apple-touch-icon.png` |
| `public/android-chrome-192.png`, `public/android-chrome-512.png`, `public/site.webmanifest` | same names in `brand/favicon/` |
| `public/brand/*` | whichever lockup and mark PNGs the site and emails use |

Then add `manifest: "/site.webmanifest"` to the root `metadata` export.

**Use the mark in the UI as a component, not an `<img>`,** so it inherits `currentColor` and never flashes:

```tsx
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M14 18 L26 18 A12 12 0 1 1 14 6 Z" fill="currentColor" />
      <path d="M18 14 L18 2 A12 12 0 0 1 30 14 Z" fill="currentColor" />
    </svg>
  );
}
```

Emails and PDFs cannot use `currentColor`, so they get the black or white PNG from `brand/`.

## Gotchas that cost real time

- **Never join a line of text into one `d` attribute.** A rasterizer stops at the first malformed number and drops everything after it, so one bad coordinate eats the rest of the sentence with no error. `textPath()` emits **one `<path>` element per glyph**, which contains the damage to a single letter, and throws if the font hands back `NaN`. Symptom of getting this wrong: the last few words of a caption are missing and the build says nothing.
- **`png-to-ico` v3 exports on `.default`, v2 exports the function.** Use `mod.default ?? mod` or you get "pngToIco is not a function".
- **Load fonts with `opentype.parse`, not `loadSync`.** In opentype.js 2.x `loadSync` is a dead stub that prints a deprecation notice and returns `undefined`. Pass a fresh copy of the bytes — `opentype.parse(new Uint8Array(fs.readFileSync(file)).buffer)` — because a small pooled Buffer's `.buffer` is the whole 8KB pool, not just your file.
- **Set `density` when sharp rasterizes an SVG.** libvips re-renders the vector at the resize target, so most output is identical either way — but sub-pixel details such as the light tile's 0.5-unit hairline border are visibly cleaner at a higher density. The script uses 384; it costs nothing.
- **`favicon.ico` still matters.** Safari and older Windows browsers ask for it before they look at `icon.svg`.
- **Apple and Android want full-bleed squares.** Do not round the corners yourself; both platforms apply their own mask, and a pre-rounded icon ends up with a visible double corner.
- **The light app icon needs a hairline border.** A white tile on a white page is invisible without it.
- **An SVG favicon can follow the colour scheme.** The generated `favicon.svg` carries a `prefers-color-scheme` block, so the tile flips in dark mode.
- **Give every `var()` in that favicon a literal fallback.** Browsers resolve the custom properties; Satori, PDF renderers, email clients and design tools do not, and a `fill="var(--mark)"` with no fallback renders as a black square. The script writes `fill="var(--mark, #ffffff)"`.
- **Run the script from the folder holding `node_modules`**, or point the font paths somewhere absolute. It resolves fonts from the working directory first, then from next to the script.

## Checklist

- [ ] The mark is legible at 16px (look at the brand sheet, do not assume)
- [ ] `favicon.ico` reports 3 icons (`file brand/favicon/favicon.ico`)
- [ ] The wordmark renders the **whole** name — check the brand sheet, not just the SVG source
- [ ] Letters with descenders (p, g, y) are not clipped at the bottom of the lockup
- [ ] Both polarities exist and each is tested on its opposite background
- [ ] The wordmark PNG is at least @2x, and the SVG has outlines, not `<text>`
- [ ] Icons are wired into the app's file-name conventions and the tab shows the mark
- [ ] `site.webmanifest` parses and the icon paths resolve from the site root
- [ ] The brand sheet is committed so future changes have a reference to match
