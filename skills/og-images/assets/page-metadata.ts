import type { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://acme.com";
const SITE_NAME = "Acme";

/** Section label drawn above the title on the card, picked from the path. */
const KICKERS: [RegExp, string][] = [
  [/^\/pricing/, "Pricing"],
  [/^\/blog/, "Guide"],
  [/^\/docs/, "Docs"],
  [/^\/(legal|terms|privacy)/, "Legal"],
];

function ogImage(path: string, title: string) {
  const kicker = KICKERS.find(([re]) => re.test(path))?.[1];
  const q = new URLSearchParams({ title, ...(kicker ? { kicker } : {}) });
  return { url: `${SITE_URL}/og?${q}`, width: 1200, height: 630, alt: title };
}

/**
 * Title, description, canonical, OpenGraph and Twitter in one call, so no page can ship without a
 * social image. Any page that sets `openGraph` itself must go through here, or it silently drops
 * the site-wide default.
 */
export function pageMetadata({
  path, title, description, absoluteTitle = false, type = "website",
}: { path: string; title: string; description: string; absoluteTitle?: boolean; type?: "website" | "article" }): Metadata {
  const image = ogImage(path, title);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: `${SITE_URL}${path === "/" ? "" : path}` },
    openGraph: { title, description, url: `${SITE_URL}${path === "/" ? "" : path}`, siteName: SITE_NAME, type, locale: "en_US", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
