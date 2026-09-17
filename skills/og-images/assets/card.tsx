import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Every social network crops to this. Do not invent another size. */
export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Fonts and images are read from disk at request time. Next's tracer usually resolves these literal
 * `process.cwd()` paths on its own — a local standalone build on Next 16.3.5 ships them with no
 * config at all. List them in `outputFileTracingIncludes` for this route anyway: a Vercel
 * deployment on Next 16.3.5 returned 500 ENOENT on 2026-09-17 until that entry was added, so
 * Vercel's bundling and a local `next build` do not agree.
 */
const font = (file: string) => readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans", file));
const shot = () => readFile(join(process.cwd(), "public/marketing/og/product.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`);

/**
 * The card every page shares: mark, section label, title, one promise line, and a product image
 * bleeding off the right edge.
 */
export async function ogCard({ title, kicker }: { title: string; kicker?: string | null }) {
  const [regular, medium, semibold, image] = await Promise.all([
    font("Geist-Regular.ttf"), font("Geist-Medium.ttf"), font("Geist-SemiBold.ttf"), shot(),
  ]);
  // The left column is 700px wide, so 62px fits about 16 characters per line. The ladder has to
  // engage well inside cardTitle's truncation limit or the smaller steps are dead code.
  const size = title.length > 64 ? 40 : title.length > 48 ? 48 : title.length > 32 ? 54 : 62;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#fafafa", fontFamily: "Geist", color: "#0a0a0a", overflow: "hidden" }}>
        {/* Vertical hairlines, then a fade so text stays readable over them.
            Three Satori traps in one element: it ignores the `inset` shorthand (the box computes to
            0×0 and paints nothing, silently), it drops `radial-gradient` with `backgroundSize`, and
            1px at 5% opacity disappears the moment a preview downscales to ~500px. */}
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, display: "flex", backgroundImage: "linear-gradient(90deg, rgba(10,10,10,0.12) 2px, transparent 2px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 760, display: "flex", background: "linear-gradient(90deg, #fafafa 72%, rgba(250,250,250,0))" }} />

        {/* Product window, half off the canvas: it suggests depth without needing detail. */}
        <div style={{ position: "absolute", right: -40, top: 150, width: 560, height: 520, display: "flex", flexDirection: "column", borderRadius: 16, border: "1px solid #e5e5e5", background: "#ffffff", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.25)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, height: 34, padding: "0 14px", borderBottom: "1px solid #eeeeee", background: "#f5f5f5" }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: "#d4d4d4" }} />)}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} width={640} height={427} style={{ objectFit: "cover", objectPosition: "left top" }} alt="" />
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: 700, height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="40" height="40" viewBox="0 0 32 32">
              <path d="M14 18 L26 18 A12 12 0 1 1 14 6 Z" fill="#0a0a0a" />
              <path d="M18 14 L18 2 A12 12 0 0 1 30 14 Z" fill="#0a0a0a" />
            </svg>
            <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>Acme</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {kicker ? <span style={{ fontSize: 20, fontWeight: 500, color: "#737373", textTransform: "uppercase", letterSpacing: 2.5 }}>{kicker}</span> : null}
            <span style={{ fontSize: size, fontWeight: 600, lineHeight: 1.06, letterSpacing: -1.4 }}>{title}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 21, color: "#525252" }}>
            <span style={{ display: "flex", padding: "7px 14px", borderRadius: 999, border: "1px solid #e5e5e5", background: "#ffffff", color: "#0a0a0a", fontWeight: 500 }}>14-day free trial</span>
            <span>No credit card · acme.com</span>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: regular, weight: 400 },
        { name: "Geist", data: medium, weight: 500 },
        { name: "Geist", data: semibold, weight: 600 },
      ],
    },
  );
}

/** A page title written for search ("X: long explanation | Acme") shortened for a card headline. */
export function cardTitle(title: string) {
  const t = title.replace(/\s*[|·–—-]\s*Acme$/i, "").replace(/^Acme:\s*/i, "");
  // Long enough that different pages keep different cards; short enough to stay under three lines.
  const cut = t.length > 78 ? `${t.slice(0, 75).replace(/\s+\S*$/, "")}…` : t;
  return cut.charAt(0).toUpperCase() + cut.slice(1);
}
