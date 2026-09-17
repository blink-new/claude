---
name: og-images
description: Give every page a real social preview image with next/og — one card route, per-page titles, metadataBase, and the deploy settings that keep the card working in production. Use when links look bare when shared on Slack, X, LinkedIn or iMessage, or the user mentions og:image, social preview, link preview, share image, Twitter card, or opengraph-image.
---

# Social preview images that actually render

A link with no image is a grey rectangle in Slack. A link with a real card gets clicked. `next/og` renders one at request time from JSX, so every page gets a card with its own title and nothing has to be designed by hand.

## When to use

- Shared links look bare or show the wrong image
- A new marketing site, blog or docs site is going up
- `og:image` is missing on some pages but not others

## The shape of it

| File | Job |
|---|---|
| `src/lib/og/card.tsx` | The card itself: one `ogCard({ title, kicker })` function returning an `ImageResponse` ([assets/card.tsx](assets/card.tsx)) |
| `src/app/og/route.tsx` | `/og?title=…&kicker=…`, so any page can ask for its own card ([assets/og-route.tsx](assets/og-route.tsx)) |
| `src/lib/page-metadata.ts` | `pageMetadata()` — the only way pages set metadata, so none can forget the image ([assets/page-metadata.ts](assets/page-metadata.ts)) |
| `src/app/opengraph-image.tsx` + `twitter-image.tsx` | The site-wide default, for the root URL and anything that slips through |
| `next.config.ts` | `outputFileTracingIncludes` for `/og` — insurance for the files the card reads at request time |
| root `layout.tsx` | `metadataBase` — **without it the root card's URL is `http://localhost:3000` in production** |

Paths assume a `src/` directory. `create-next-app` omits it unless you pass `--src-dir`; drop the prefix if your app has no `src/`.

```tsx
// src/app/opengraph-image.tsx  (twitter-image.tsx is the same file with the same export)
import { OG_SIZE, ogCard } from "@/lib/og/card";
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Acme — what the product does";
export default async function Image() { return ogCard({ title: "What the product does" }); }
```

## The three failures that actually happen

### 1. The root card points at localhost

Next.js resolves the file-based `opengraph-image` against `metadataBase`, and **the default is `http://localhost:3000`**. The build prints a warning that is easy to miss, and production ships `<meta property="og:image" content="http://localhost:3000/opengraph-image">` — a dead image everywhere it is scraped. Pages that go through `pageMetadata()` are safe, because that helper writes an absolute URL, so this hits exactly the pages the fallback exists to cover.

```ts
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://acme.com"),
  // …
};
```

Check the deployed HTML, not the build: `curl -s https://yoursite.com | grep og:image` must show your domain.

### 2. Fonts and images missing from the deployment

`ogCard` reads its font and product image from disk with `readFile` at request time. Whether those files reach the deployment depends on what the tracer can work out statically.

`@vercel/nft` **does** resolve a literal path rooted at `process.cwd()`, including `join(process.cwd(), "…/geist-sans", file)` where only the last segment varies — it ships the whole directory. So on a plain `next build` this often works with no configuration at all. It stops working as soon as the path is assembled from something the tracer cannot evaluate: an environment variable, a config lookup, a value from a database.

Declare the files anyway. It is one line, it costs nothing, and a real Vercel deployment of this exact card did return 500 `ENOENT` until it was added:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  // The card reads these at request time. Name the three weights you actually use — the folder
  // holds 20 files and a glob drags 2.6MB into the function to use 380KB.
  outputFileTracingIncludes: {
    "/og": [
      "./node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf",
      "./node_modules/geist/dist/fonts/geist-sans/Geist-Medium.ttf",
      "./node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf",
      "./public/marketing/og/product.png",
    ],
  },
};
```

Verify what actually shipped rather than trusting either claim:

```bash
node -p "JSON.parse(require('fs').readFileSync('.next/server/app/og/route.js.nft.json')).files.filter(f => /ttf|png/.test(f))"
```

Root `opengraph-image.tsx` and `twitter-image.tsx` are prerendered at build time, so they read their files during the build and need no tracing entry — unless the segment takes dynamic params.

### 3. A page sets `openGraph` itself and loses the default

Next.js merges metadata shallowly. A page that exports its own `openGraph` object **replaces** the parent's, image included, so pages that look fine locally ship with no card. Force every page through one helper that always fills `images`, and never write a bare `openGraph` object in a page file.

## Writing the card

`next/og` uses Satori, which is not a browser. What it supports:

- **Flexbox only.** No grid, no float. Any `div` with an *element* child needs an explicit `display: "flex"` — one child is already enough, and `display: "block"` is accepted as a value but still throws. A single string child is fine.
- **No external CSS, no Tailwind classes.** Inline styles only.
- **Fonts must be passed in** as buffers with the weights you actually use. Text renders in a fallback otherwise, or not at all.
- **Images must be data URIs or absolute URLs.** A local path does not resolve. Base64 is the reliable route.
- **`position: absolute` works**, and is how you layer a background, a gradient mask and a product window.
- **No `gap` on non-flex parents**, no `aspect-ratio`, no CSS variables.
- **`inset: 0` is ignored.** The box computes to 0×0 and paints nothing, with no error — a full-bleed background layer simply never appears. Write `left: 0, top: 0, right: 0, bottom: 0`. A solid red test fill proves it in seconds: with `inset` you get nothing, with the four properties you get a red canvas.
- **`radial-gradient` does not tile.** With `backgroundSize` it renders nothing at all, silently — a dot-grid background just disappears. `linear-gradient` tiles correctly, so build patterns from that or from an inline SVG data URI.
- **Faint texture dies in the thumbnail.** Previews are resampled to about 500px wide. A 1px line at 5% opacity measures 12/255 at full size and 4/255 in the thumbnail, which is nothing; 2px at 12% survives at 22/255 and still reads as quiet texture.

Design rules that hold up at thumbnail size:

- One line of large text. The title is the message; everything else is decoration.
- Scale the font down for long titles — and check the ladder engages *below* your truncation limit, or the small steps are dead code the renderer can never reach.
- Do not truncate so hard that different pages produce the same card. At 60 characters, three unrelated 80-, 100- and 160-character titles collapse into one identical string, which defeats the point of per-page cards. About 78 is the balance.
- Put the product logo top-left, where people look first.
- Strip the SEO suffix from the title. `"Pricing: plans and costs | Acme"` becomes `"Pricing: plans and costs"`.
- Keep the same card for every page. Recognition beats novelty.
- Do not put small text anywhere: previews render at about 500px wide, and anything under 20px is mush.

## Verify it, every time

Localhost proves nothing about production, because the failure is a deployment failure.

```bash
# 1. The route renders where it counts
curl -o /dev/null -w "%{http_code}\n" "https://yoursite.com/og?title=Pricing&kicker=Pricing"

# 2. The page actually points at it
curl -s https://yoursite.com/pricing | grep -o '<meta property="og:image"[^>]*>'

# 3. Every page has one (catch the page that sets openGraph itself)
for p in / /pricing /blog /docs; do
  printf "%s " "$p"; curl -s "https://yoursite.com$p" | grep -c 'og:image'
done
```

Then paste a URL into the [Facebook debugger](https://developers.facebook.com/tools/debug/), [X card validator](https://cards-dev.twitter.com/validator) or a Slack DM to yourself, and look at the picture.

## Checklist

- [ ] `metadataBase` is set in the root layout, and the deployed HTML shows your domain, not localhost
- [ ] `/og` returns 200 **on the deployed site**, not just locally
- [ ] `outputFileTracingIncludes` lists every font and image the card reads
- [ ] Every background layer actually rendered — sample the PNG's pixels, do not trust the JSX
- [ ] Every page's metadata goes through one helper that always sets `images`
- [ ] Root `opengraph-image` and `twitter-image` exist as a fallback
- [ ] Titles are trimmed of the site suffix, stay within three lines, and two different long titles still produce two different cards
- [ ] Cache-Control is set, so the image is not re-rendered on every scrape
- [ ] A real link preview was checked in Slack or iMessage before calling it done
