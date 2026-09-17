import { cardTitle, ogCard } from "@/lib/og/card";

/** ImageResponse needs Node APIs here (readFile), so do not switch this to the edge runtime. */
export const runtime = "nodejs";

/** `/og?title=…&kicker=…` renders the social card for any page, cached at the edge for a day. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = cardTitle((url.searchParams.get("title") ?? "The default title for the site").slice(0, 160));
  const kicker = url.searchParams.get("kicker")?.slice(0, 40) ?? null;
  const res = await ogCard({ title, kicker });
  res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800");
  return res;
}
