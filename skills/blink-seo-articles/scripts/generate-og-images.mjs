/**
 * Blink Blog OG Image Generator
 *
 * Generates branded 1200×630 PNG hero images for blink.new blog posts.
 * Uses sharp + SVG compositing — no browser, no canvas, no external services.
 *
 * Usage:
 *   1. Install dependency (first time only):
 *        cd /tmp/og-gen && npm init -y && npm install sharp
 *   2. Copy/edit the POSTS array at the bottom of this file
 *   3. Run:
 *        node generate-og-images.mjs
 *   4. Images output to:
 *        <auto-engineer-repo>/public/images/blog/[slug].png
 *   5. Reference in blog frontmatter:
 *        image_url: "/images/blog/[slug].png"
 *   6. Commit the image files (push to prod whenever ready)
 *
 * Requirements:
 *   - Node.js 22+
 *   - sharp (npm install sharp)
 *
 * Output:
 *   - 1200×630px PNG
 *   - ~100–130KB per image
 *   - ~1500ms total for 20 images
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// ── Config ──────────────────────────────────────────────────────────────────

// Output directory — change to match your repo path
const OUT_DIR = path.resolve(process.env.OUT_DIR || './out');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Image dimensions (standard OG/Twitter card)
const W = 1200, H = 630;

// ── Color themes ─────────────────────────────────────────────────────────────
// Each theme = dark gradient bg + accent color for bar, glow, circles, pill, branding.
//
// | Key         | Accent        | Use for                          |
// |-------------|---------------|----------------------------------|
// | hosting     | Blue #3b82f6  | Deployment/hosting guides        |
// | agent       | Purple #8b5cf6| AI agent articles                |
// | security    | Red #ef4444   | Security/risk guides             |
// | sales       | Green #10b981 | Sales & business automation      |
// | developer   | Cyan #06b6d4  | Developer-focused content        |
// | comparison  | Amber #f59e0b | Comparison/ranked articles       |
// | email       | Indigo #6366f1| Email/Slack integrations         |
// | morning     | Orange #f97316| Routine/schedule articles        |
// | pricing     | Teal #14b8a6  | Pricing/cost guides              |
// | default     | Blue #3b82f6  | Anything else                    |

const THEMES = {
  hosting:    { bg1: '#0a0f1e', bg2: '#0d1a35', accent: '#3b82f6', accentGlow: '#1d4ed8' },
  agent:      { bg1: '#0a0e18', bg2: '#111827', accent: '#8b5cf6', accentGlow: '#7c3aed' },
  security:   { bg1: '#0c0a0a', bg2: '#1a0f0f', accent: '#ef4444', accentGlow: '#dc2626' },
  sales:      { bg1: '#0a0f0a', bg2: '#0d1a0f', accent: '#10b981', accentGlow: '#059669' },
  developer:  { bg1: '#080c14', bg2: '#0f1523', accent: '#06b6d4', accentGlow: '#0891b2' },
  comparison: { bg1: '#0d0d18', bg2: '#12122a', accent: '#f59e0b', accentGlow: '#d97706' },
  email:      { bg1: '#0a0d18', bg2: '#0e1525', accent: '#6366f1', accentGlow: '#4f46e5' },
  morning:    { bg1: '#0f0a08', bg2: '#1f1008', accent: '#f97316', accentGlow: '#ea580c' },
  pricing:    { bg1: '#080d10', bg2: '#0e1820', accent: '#14b8a6', accentGlow: '#0d9488' },
  default:    { bg1: '#080c14', bg2: '#0f1829', accent: '#3b82f6', accentGlow: '#1d4ed8' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Word-wrap title to ~maxChars per line */
function wrapText(text, maxChars = 26) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

/** Escape special XML chars for SVG text */
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── SVG builder ──────────────────────────────────────────────────────────────

function makeSVG({ title, subtitle, tag, theme: themeName }) {
  const t = THEMES[themeName] || THEMES.default;
  const titleLines = wrapText(title, 26);
  const fontSize = titleLines.length > 3 ? 56 : titleLines.length === 3 ? 62 : 70;
  const lineHeight = fontSize * 1.2;

  // Fixed vertical layout: tag pill at y=152, title starts at y=248
  const titleStartY = tag ? 248 : 210;

  const titleSvg = titleLines.map((line, i) =>
    `<text x="80" y="${titleStartY + i * lineHeight}"
      font-family="system-ui,-apple-system,sans-serif"
      font-size="${fontSize}" font-weight="800" fill="white"
      letter-spacing="-1">${esc(line)}</text>`
  ).join('\n');

  const subtitleSvg = subtitle
    ? `<text x="80" y="${titleStartY + titleLines.length * lineHeight + 28}"
        font-family="system-ui,-apple-system,sans-serif"
        font-size="22" font-weight="400" fill="rgba(255,255,255,0.55)">${esc(subtitle)}</text>`
    : '';

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${t.bg1}"/>
      <stop offset="100%" style="stop-color:${t.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="45%">
      <stop offset="0%" style="stop-color:${t.accentGlow};stop-opacity:0.35"/>
      <stop offset="100%" style="stop-color:${t.bg1};stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="15%" cy="85%" r="35%">
      <stop offset="0%" style="stop-color:${t.accent};stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:${t.bg1};stop-opacity:0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>

  <!-- Subtle grid -->
  <g opacity="0.04" stroke="white" stroke-width="0.5">
    ${Array.from({length: 20}, (_,i) => `<line x1="${i*70}" y1="0" x2="${i*70}" y2="${H}"/>`).join('')}
    ${Array.from({length: 12}, (_,i) => `<line x1="0" y1="${i*60}" x2="${W}" y2="${i*60}"/>`).join('')}
  </g>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="5" height="${H}" fill="${t.accent}"/>

  <!-- Decorative circles (bottom-right) -->
  <circle cx="${W-60}" cy="${H-60}" r="180" fill="none" stroke="${t.accent}" stroke-width="0.5" opacity="0.12"/>
  <circle cx="${W-60}" cy="${H-60}" r="280" fill="none" stroke="${t.accent}" stroke-width="0.5" opacity="0.07"/>
  <circle cx="${W-60}" cy="${H-60}" r="380" fill="none" stroke="${t.accent}" stroke-width="0.3" opacity="0.05"/>

  <!-- Dot cluster (top-right) -->
  ${Array.from({length: 12}, (_,i) => {
    const x = W - 120 + (i % 4) * 22;
    const y = 60 + Math.floor(i / 4) * 22;
    return `<circle cx="${x}" cy="${y}" r="2" fill="${t.accent}" opacity="0.3"/>`;
  }).join('\n  ')}

  <!-- Category pill (fixed y=152) -->
  ${tag ? `
  <rect x="80" y="152" width="${tag.length * 10 + 28}" height="32" rx="16" fill="${t.accent}" opacity="0.2"/>
  <text x="94" y="173" font-family="system-ui,-apple-system,sans-serif"
    font-size="13" font-weight="700" fill="${t.accent}" letter-spacing="1.5">${esc(tag.toUpperCase())}</text>
  ` : ''}

  <!-- Title text -->
  ${titleSvg}

  <!-- Subtitle text -->
  ${subtitleSvg}

  <!-- Footer bar -->
  <rect x="0" y="${H-60}" width="${W}" height="60" fill="rgba(0,0,0,0.4)"/>
  <text x="80" y="${H-26}" font-family="system-ui,-apple-system,sans-serif"
    font-size="16" font-weight="700" fill="${t.accent}" letter-spacing="1">BLINK.NEW</text>
  <text x="${W-80}" y="${H-26}" text-anchor="end"
    font-family="system-ui,-apple-system,sans-serif"
    font-size="14" font-weight="400" fill="rgba(255,255,255,0.4)">blink.new/claw</text>
  <rect x="80" y="${H-61}" width="120" height="1" fill="${t.accent}" opacity="0.6"/>
</svg>`;
}

// ── Main generator ────────────────────────────────────────────────────────────

async function makeOG({ slug, title, subtitle, tag, theme }) {
  const svg = makeSVG({ title, subtitle, tag, theme });
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(OUT_DIR, `${slug}.png`));
  console.log(`✓ ${slug}.png`);
}

// ── POSTS LIST ────────────────────────────────────────────────────────────────
// Add your blog posts here. Each entry generates one OG image.
//
// Fields:
//   slug     - matches your blog post slug (becomes [slug].png filename)
//   title    - shown large on the image (wrap ~26 chars/line automatically)
//   subtitle - smaller supporting line below title (optional)
//   tag      - pill label: "Guide" | "Tutorial" | "Comparison" | "Security" | etc.
//   theme    - one of the color theme keys listed above

const POSTS = [
  // ── Example entries (replace with your actual posts) ──────────────────────

  // { slug: 'how-to-run-openclaw-without-docker-cloud-2026',
  //   title: 'Run OpenClaw Without Docker', subtitle: 'Cloud, VPS, Mac — complete 2026 guide',
  //   tag: 'Guide', theme: 'hosting' },

  // { slug: 'what-is-an-ai-employee-2026',
  //   title: 'What Is an AI Employee?', subtitle: 'Always-on AI agents explained',
  //   tag: 'Guide', theme: 'agent' },

  // ── Add your post here ────────────────────────────────────────────────────
  // { slug: 'your-post-slug',
  //   title: 'Your Post Title',
  //   subtitle: 'Optional subtitle line',
  //   tag: 'Guide',
  //   theme: 'default' },
];

if (POSTS.length === 0) {
  console.log('⚠️  No posts defined. Add entries to the POSTS array in this script.');
  console.log('   See comments above for the format.');
  process.exit(0);
}

console.log(`Generating ${POSTS.length} OG image(s) → ${OUT_DIR}\n`);
await Promise.all(POSTS.map(makeOG));
console.log('\n✅ Done!');
