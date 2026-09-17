---
name: product-screenshots
description: Capture real screenshots of your own running app for the marketing site — seeded demo data, signed-in pages, retina capture, zoomed feature crops and WebP output. Use when a landing page needs product images, when the user says the mockups look fake or wants to replace placeholder UI, or asks to screenshot or re-capture the app after a design change.
---

# Real product screenshots

Fake browser mockups read as fake. A landing page converts better with the actual product in it, and a screenshot pipeline costs one afternoon and then re-runs forever.

The method: seed a believable demo account, drive your own app in headless Chromium, shoot full windows and zoomed feature crops, convert to WebP, and register the files in one component so pages reference a name instead of a path.

## When to use

- A landing page, blog post, docs page or app store listing needs product imagery
- Mockup components need replacing with the real thing
- The UI changed and last release's screenshots are stale

## The five steps

1. **Seed a demo account** with data you would be happy to show a stranger.
2. **Copy [assets/capture.ts](assets/capture.ts)**, point `SHOTS` at your routes, fix the `signIn` function for your auth.
3. **Run it** against production or a local dev server.
4. **Convert with [assets/to-webp.ts](assets/to-webp.ts).**
5. **Register the files** in one `SHOTS` map and use it everywhere.

```bash
npm i -D playwright-core tsx             # once, in the repo
npx playwright install chromium          # once, downloads the browser
npx tsx capture.ts /tmp/shots --base https://yourapp.com
npx tsx to-webp.ts /tmp/shots public/marketing/app
```

**Never hardcode the Chromium path.** `playwright-core` finds its own browser; the cache folder carries a revision number (`chromium-1243` today) that changes with every release and differs per OS and architecture, so a pinned path fails on the next install. Both scripts launch with no `executablePath` and fall back to `CHROME_PATH` only if you set it. If the repo pins `playwright-core`, install the matching browser with `npx playwright@<same-version> install chromium`.

## Step 1 — the demo data decides the quality

The screenshot is only as good as the data behind it. Rules that make a shot look real:

- **Invent one company and stay inside it.** A named fictional company with a plausible story beats "Test Co 1".
- **Use `.example` domains** (`maya@northwind.example`). They are reserved by RFC 2606 and can never receive mail, so a leaked address in a shot is harmless.
- **Fill it through the real code paths** — your importer, your API, your services — not raw SQL inserts. Data written around the app is subtly wrong, and the wrongness always shows up in the shot.
- **Numbers must be plausible and consistent.** Percentages total 100. Dates fall in a sensible order. Currency is round but not suspiciously round.
- **Include enough rows to look used.** Three rows looks like a prototype; 15–40 looks like a business.
- **Realistic variety:** a couple of pending items, one overdue, a mix of statuses. All-green dashboards look staged.
- **Keep the seed script in the repo** so anyone can rebuild the demo when the schema changes.

## Step 2 — signing in without an inbox

Whatever your auth, the capture script must get a session with no human involved. In order of preference:

1. **Reuse a saved session.** Log in once by hand, `context.storageState({ path: "demo-auth.json" })`, then `browser.newContext({ storageState: "demo-auth.json" })`. Simplest, and it works with SSO.
2. **Read the magic-link token straight from the database.** Request the link through the API, poll the verification table, and open the verify URL. No email is ever sent or opened:

   ```ts
   await context.request.post(`${BASE}/api/auth/sign-in/magic-link`, { data: { email, callbackURL: to } });
   const row = await db("select identifier from verification where value like ? order by created_at desc limit 1", [`%${email}%`]);
   await page.goto(`${BASE}/api/auth/magic-link/verify?token=${row.identifier}&callbackURL=${encodeURIComponent(to)}`);
   ```
3. **Fill the login form** with credentials from the environment. Fine for password auth, never hardcode them.

## Step 3 — settle the page before the shutter

Most bad screenshots are timing bugs. Every shot waits for all of this:

```ts
await page.waitForLoadState("networkidle");
await page.evaluate(() => document.fonts.ready);   // otherwise the first paint uses a fallback font
await page.addStyleTag({ content: HIDE });          // dev overlays, toasts, carets, animations
await page.waitForTimeout(600);                     // skeletons resolve
```

What to hide, every time: the Next.js dev indicator (`nextjs-portal`), toast containers, the Vercel toolbar, browser extensions, the text caret (`caret-color: transparent`) and scrollbars.

**Kill animations with `animation: none` and `transition: none`, not by pausing them.** `animation-play-state: paused` freezes an element at whatever frame it happened to reach, so a spinner is caught at some arbitrary angle and every re-run produces a different file. `animation: none` snaps everything to its final state, which is what you want to photograph, and makes runs byte-identical. `reducedMotion: "reduce"` on the context only sets the `prefers-reduced-motion` media query — useful if the app honours it, but it stops nothing on its own.

**Scrub anything real.** The demo signs in with a real inbox, so swap those strings in the DOM before shooting. Walk the text nodes and replace; do not rely on the data being clean.

## Step 4 — two kinds of shot

| Kind | Viewport | Use |
|---|---|---|
| **Window** | 1440×900 at `deviceScaleFactor: 2` | Hero images, "here is the product" |
| **Feature** | 1200×780, navigation collapsed | Feature rows, where one idea must be readable |

A full screenshot of a dense app shrunk into a feature row is unreadable — the reason mockups often beat real shots. Fix it by **shrinking the window, not the image**: a narrower viewport reflows the app to show less, so the remaining content is bigger. Collapse the sidebar, then capture. For a single card, `locator(selector).screenshot()` crops to that element with no scaling loss.

Always capture at `deviceScaleFactor: 2`. A 2880px-wide file displayed at 1440 CSS pixels is sharp on retina; a 1x file looks blurry on every modern laptop.

## Step 5 — WebP, then one registry

If **sharp** is already a dependency, one line does it: `sharp(png).resize({ width: 2400 }).webp({ quality: 86 }).toFile(out)`.

Otherwise use **Chromium's canvas encoder** (see [assets/to-webp.ts](assets/to-webp.ts)) — Chromium is already installed for the capture step, while `cwebp` and ImageMagick usually are not, and sharp's prebuilt binary lacks WebP support on some platforms. Output sizes are within a couple of percent of each other. Either way a 2880px PNG drops from about 1.5MB to well under 200KB at quality 0.86.

The converter caps the long edge at `MAX_WIDTH` (2400), so **the shipped file is 2400px wide, not the 2880 you captured**. Whatever `MAX_WIDTH` says is the intrinsic width you must put in the registry below.

Then register every shot once so pages never hardcode paths, sizes or alt text:

```tsx
// components/product-shot.tsx
export const SHOTS = {
  // Widths are the WebP's own width (MAX_WIDTH), not the captured PNG's.
  dashboard: { src: "/marketing/app/dashboard.webp", w: 2400, h: 1500, alt: "Dashboard showing this quarter's summary" },
  table:     { src: "/marketing/app/table.webp",     w: 2400, h: 1429, alt: "Every item in one table" },
} as const;

export function ProductShot({ name, priority }: { name: keyof typeof SHOTS; priority?: boolean }) {
  const s = SHOTS[name];
  return <Image src={s.src} width={s.w} height={s.h} alt={s.alt} priority={priority} className="rounded-lg border shadow-sm" />;
}
```

One `<ProductShot name="dashboard" />` per page section. Re-capturing then updates every page at once.

## Gotchas

- **Capture after deploying, not before.** Shots taken against a local build will not match what visitors see, and the mismatch is obvious when a release changes spacing.
- **Real width, then compress.** Never capture small and upscale.
- **Scrollbars show up on Linux.** macOS uses overlay scrollbars so you will not see the problem locally. Both are handled: the browser launches with `--hide-scrollbars` and `HIDE` carries a `::-webkit-scrollbar` rule.
- **Keyboard shortcuts must be cross-platform.** `Meta+b` is Cmd on macOS and the wrong key on Linux CI; Playwright's `ControlOrMeta+b` maps correctly on both.
- **Scrub with the flags intact.** A `RegExp` cannot be passed into `page.evaluate`, so send `source` *and* `flags`. Rebuilding with a hardcoded `"g"` quietly drops the `i`, and `DEMO+OWNER@COMPANY.COM` survives into the shot while the lowercase version is replaced.
- **A `scripts/` tsconfig needs the DOM lib.** Both scripts run browser code inside `page.evaluate`, so `lib` must include `DOM`, or `document`, `NodeFilter` and `Image` fail to type-check. Next.js tsconfigs already include it.
- **Charts and canvases need extra settle time.** If a chart animates on mount, wait for the animation or disable it in the capture run.
- **Chats and logs stick to the bottom.** Scroll the container to the top before shooting, or the shot starts mid-conversation.
- **Never ship a shot with real customer data.** Demo account only, and read every shot before it goes live.
- **Keep the PNGs out of git.** Capture to a temp folder, commit only the WebP files.
- **Re-run the whole set** after any visual change to shared chrome; mixing old and new screenshots on one page looks broken.

## Checklist

- [ ] Demo data looks like a real business, with `.example` addresses
- [ ] No dev overlay, toast, caret or extension artefact in any shot
- [ ] Every shot captured at 2x against the deployed app
- [ ] Feature shots use a narrower viewport, not a downscaled window shot
- [ ] WebP conversion done, each file under about 200KB
- [ ] All files registered in one `SHOTS` map with real alt text
- [ ] Capture script committed so the next person re-runs it in one command
