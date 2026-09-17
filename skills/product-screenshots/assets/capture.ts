/**
 * Captures real product screenshots for the marketing site.
 *
 *   npx tsx capture.ts <outDir> [--base http://localhost:3000] [--only dashboard,settings]
 *
 * Drives a signed-in browser over the demo account, waits for each page to settle, and writes
 * one PNG per entry in SHOTS. Convert to WebP afterwards with to-webp.ts.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright-core";

const args = process.argv.slice(2);
const flag = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
// A flag in first position means the output directory was forgotten; do not create a folder called "--base".
const OUT = args[0] && !args[0].startsWith("--") ? args[0] : "public/marketing/app";
const BASE = flag("base") ?? "http://localhost:3000";
const ONLY = flag("only")?.split(",");

/**
 * Let playwright-core find its own browser. Never hardcode the cache path: the revision folder
 * (chromium-1243 today) changes with every Playwright release, and the layout differs per OS and
 * architecture. CHROME_PATH is only for a browser installed somewhere unusual.
 */
const launch = { headless: true, args: ["--hide-scrollbars"], ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) };

/** Full-window shots. 1440×900 at 2x gives a 2880px-wide file, which is retina-sharp on any site. */
const WINDOW = { width: 1440, height: 900 };
/** Feature shots: narrower window with the chrome hidden, so one feature fills the frame. */
const FOCUS = { width: 1200, height: 780 };

// --------------------------------------------------------------- SIGN-IN ----
/**
 * Replace with whatever your app supports, in this order of preference:
 *   1. A storageState JSON saved by a prior login  → browser.newContext({ storageState })
 *   2. A magic-link token read straight from the database (no inbox needed)
 *   3. Filling the login form once and reusing the context
 */
async function signIn(context: BrowserContext, to: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email/i).fill(process.env.DEMO_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/app/);
  await page.goto(`${BASE}${to}`, { waitUntil: "domcontentloaded" });
  return page;
}
// ----------------------------------------------------------------------------

/**
 * Anything that should never appear in a marketing shot.
 *
 * `animation: none` and `transition: none` snap every element to its FINAL state. Pausing instead
 * (`animation-play-state: paused`) freezes whatever arbitrary frame the element was in, which makes
 * each run produce a different file — a rotating spinner caught at 78°, and so on.
 */
const HIDE = `
  nextjs-portal, [data-nextjs-toast], [data-sonner-toaster], [data-vercel-toolbar],
  .grammarly-desktop-integration { display: none !important; }
  *, *::before, *::after {
    caret-color: transparent !important;
    animation: none !important;
    transition: none !important;
  }
  ::-webkit-scrollbar { display: none !important; }
`;

/** Text that must be swapped before the shutter: real inboxes, internal ids, anything private. */
const SWAP: [RegExp, string][] = [
  [/demo\+owner@yourcompany\.com/gi, "maya@northwind.example"],
];

async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => null);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: HIDE });
  // A RegExp cannot cross into the page, so send source AND flags. Dropping the flags silently
  // un-does case-insensitivity, and a capitalised variant of a real address ships in the shot.
  await page.evaluate((pairs: [string, string, string][]) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode())
      for (const [src, flags, to] of pairs) {
        const re = new RegExp(src, flags.includes("g") ? flags : `${flags}g`);
        n.nodeValue = (n.nodeValue ?? "").replace(re, to);
      }
  }, SWAP.map(([re, to]) => [re.source, re.flags, to] as [string, string, string]));
  // Let skeletons resolve and any entrance animation finish.
  await page.waitForTimeout(600);
}

/** Collapse the sidebar so a feature shot is not 20% navigation. */
async function hideChrome(page: Page) {
  const open = await page.locator("[data-slot=sidebar][data-state=expanded]").count();
  // ControlOrMeta maps to Cmd on macOS and Ctrl on Linux CI.
  if (open) await page.keyboard.press("ControlOrMeta+b");
  await page.waitForTimeout(400);
}

const clickTab = (label: string) => async (page: Page) => {
  await page.getByRole("tab", { name: label }).or(page.getByRole("button", { name: label })).first().click();
  await settle(page);
};

type Shot = {
  name: string;
  path: string;
  /** Feature shot: narrower window, navigation hidden. */
  focus?: boolean;
  /** Signed out, for public pages like a shared link. */
  anon?: boolean;
  viewport?: { width: number; height: number };
  /** CSS selector to shoot instead of the window — for one card or one panel. */
  clip?: string;
  fullPage?: boolean;
  before?: (page: Page) => Promise<void>;
};

const SHOTS: Shot[] = [
  { name: "dashboard", path: "/app/dashboard" },
  { name: "table", path: "/app/items", viewport: { width: 1680, height: 1000 } },
  { name: "detail", path: "/app/items/example" },
  { name: "settings", path: "/app/settings" },
  { name: "f-editor", path: "/app/items/example", focus: true },
  { name: "f-reports", path: "/app/reports", focus: true, before: clickTab("Summary") },
  { name: "public-share", path: "/share/example", anon: true, focus: true },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(launch);
  const context = () => browser.newContext({
    viewport: WINDOW,
    deviceScaleFactor: 2,          // retina; halves to a crisp 1x on the page
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    reducedMotion: "reduce",       // sets the media query; HIDE is what actually stops animations
  });

  const owner = await context();
  let page = await signIn(owner, "/app/dashboard");

  for (const shot of SHOTS) {
    if (ONLY && !ONLY.includes(shot.name)) continue;
    const target = shot.anon ? await (await context()).newPage() : page;
    const size = shot.viewport ?? (shot.focus ? FOCUS : WINDOW);
    await target.setViewportSize(size);
    await target.goto(`${BASE}${shot.path}`, { waitUntil: "domcontentloaded" });
    await settle(target);
    if (shot.focus) await hideChrome(target);
    if (shot.before) await shot.before(target);

    const file = join(OUT, `${shot.name}.png`);
    if (shot.clip) await target.locator(shot.clip).first().screenshot({ path: file });
    else await target.screenshot({ path: file, fullPage: shot.fullPage ?? false });
    console.log("captured", shot.name, target.url().replace(BASE, ""));

    if (!shot.anon) await target.setViewportSize(WINDOW);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
