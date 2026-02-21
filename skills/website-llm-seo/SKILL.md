---
name: website-llm-seo
description: Make any Next.js website fully indexable by Google (SEO) and AI engines like ChatGPT, Perplexity, Claude, and Gemini (GEO / Generative Engine Optimization). Diagnoses and fixes the three root causes of invisible content: auth-loading skeletons, Suspense/RSC streaming, and missing llms.txt signals. Use when building a new site, auditing SEO, setting up llms.txt, fixing pages that show no content to crawlers, or improving AI engine discoverability.
---

# SEO + GEO for Websites

Two goals, one workflow:
- **SEO**: Google's crawler reads real HTML — not JavaScript-rendered content
- **GEO**: AI engines (ChatGPT, Perplexity, Gemini, Claude) follow `llms.txt` to discover and read content

**Reference implementation**: [openclaw.ai](https://openclaw.ai) (marketing) + [docs.openclaw.ai](https://docs.openclaw.ai) (docs with llms.txt)

---

## Step 0 — Diagnose First

Run this on every key page before touching code:

```bash
curl -s https://yoursite.com/pricing | python3 -c "
import sys, re
html = sys.stdin.read()
body = html.split('<body')[1] if '<body' in html else html
clean = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.DOTALL)
h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', clean, re.DOTALL)
print('h1 in HTML:', h1s[:2] or 'NONE ← broken')
print('HTML size:', len(html))
"
```

**PASS**: `h1` found as a real HTML tag  
**FAIL**: `NONE` → the page has one of the two root causes below

---

## Root Cause 1 — Auth Loading Skeleton

**Pattern**: `'use client'` component calls `useAuth()` → `if (isLoading) return <Skeleton>` → SSR outputs only skeleton divs

```tsx
// This causes the problem:
export function PricingPage() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <AppLoadingSkeleton />   // ← SSR always hits this
  return <PricingContent />
}
```

**Fix**: Add a `sr-only` server-rendered block in the **server component** `page.tsx` BEFORE the client wrapper:

```tsx
// pricing/page.tsx (server component — no 'use client')
export default function PricingPage() {
  return (
    <>
      {/* Server-rendered for SEO — visible to all crawlers in initial HTML */}
      <div className="sr-only">
        <h1>Pricing — Simple, Transparent Plans</h1>
        <p>Build unlimited apps with our credit-based system. Start free, upgrade as you grow.</p>
        <h2>Free Plan — $0/month</h2>
        <p>10 credits/month. No credit card required.</p>
        <h2>Pro Plan — $50/month</h2>
        <p>200 credits/month for power users.</p>
      </div>
      <PricingPageClient />   {/* 'use client', unchanged */}
    </>
  )
}
```

**Key rules:**
- Content goes in `page.tsx` (server), not the client component
- `sr-only` = Tailwind class (`position:absolute; width:1px; overflow:hidden`) — invisible to sighted users, always in DOM for crawlers. NOT `hidden` or `display:none` (those are skipped by some bots).
- Keep the `sr-only` text accurate. If it becomes stale it's worse than nothing.

### Special case: `loading.tsx` creates a Suspense boundary

If a route has a `loading.tsx` file, Next.js wraps the page in `<Suspense>`. The page content (including your `sr-only` fix) streams AFTER the initial HTML. The fix: create a `layout.tsx` for that route segment with the `sr-only` content — layouts render OUTSIDE the Suspense boundary.

```tsx
// explore/layout.tsx  ← renders before loading.tsx's Suspense
export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="sr-only">
        <h1>Explore Apps Built with AI</h1>
        <p>Browse production apps, find inspiration, remix and ship faster.</p>
      </div>
      {children}
    </>
  )
}
```

---

## Root Cause 2 — Suspense Around Async RSC Content

**Pattern**: Docs/CMS pages wrap async RSC (e.g. `MDXRemote`) in `<Suspense fallback={null}>`. The article content only arrives as RSC JSON in `<script>` tags — not real HTML.

```tsx
// WRONG — MDX content streams as RSC JSON, invisible to crawlers
<Suspense fallback={null}>
  <DocsContentWrapper>      {/* 'use client', uses useSearchParams() */}
    <MDXRemote source={doc.content} />
  </DocsContentWrapper>
</Suspense>
```

**Fix**: Remove the Suspense boundary and eliminate `useSearchParams()` from the wrapper:

```tsx
// CORRECT — MDXRemote awaited synchronously, full content in initial HTML
<DocsContentWrapper>
  <MDXRemote source={doc.content} />
</DocsContentWrapper>
```

```tsx
// DocsContentWrapper.tsx — use window.location.search instead of useSearchParams()
'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function DocsContentWrapper({ children }) {
  const ref = useRef(null)
  const router = useRouter()

  useEffect(() => {
    // Read search params client-side only — no Suspense requirement
    const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true'
    if (!isEmbed || !ref.current) return
    // ... embed click handler
  }, [router])

  return <div ref={ref}>{children}</div>
}
```

**Why it works**: `useSearchParams()` forces a Suspense boundary requirement in Next.js. Switching to `window.location.search` (client-side only, inside `useEffect`) removes this requirement. `MDXRemote` is then awaited before streaming begins, so its output is in the initial HTML.

**Verify**:
```bash
curl -s http://localhost:3000/docs/quickstart | python3 -c "
import sys; html = sys.stdin.read()
print('article in HTML:', '<article' in html)
print('h1 in HTML:', '<h1' in html)
print('HTML size (expect >500KB):', len(html))
"
```

---

## Step 1 — Set Up llms.txt (GEO)

`llms.txt` is the standard for AI engine discoverability. AI crawlers (GPTBot, PerplexityBot, Claude-Web) read this file to discover all pages. Reference: [llmstxt.org](https://llmstxt.org)

### Structure

```
/llms.txt                  ← master index (all sections)
/docs/llms.txt             ← all doc pages with .md links
/blog/llms.txt             ← all blog posts with .md links
/docs/quickstart.md        ← individual doc page as raw markdown
/blog/my-post.md           ← individual blog post as raw markdown
```

### `/docs/llms.txt` route handler

```ts
// src/app/docs/llms.txt/route.ts
export const dynamic = 'force-dynamic'

export async function GET() {
  const docs = await getAllDocs()  // fetch from CMS/DB
  
  let content = `# Site Name\n\n## Docs\n\n`
  for (const doc of docs) {
    const url = `https://yoursite.com/docs/${doc.slug.join('/')}.md`
    content += doc.description
      ? `- [${doc.title}](${url}): ${doc.description}\n`
      : `- [${doc.title}](${url})\n`
  }
  
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
```

### Middleware rewrites for clean `.md` URLs

Instead of `/api/md/docs/slug`, serve raw markdown at the natural path `/docs/slug.md`:

```ts
// middleware.ts — add BEFORE other middleware logic
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /docs/*.md → /api/md/docs/*.md (handler strips .md, fetches from CMS)
  if (pathname.startsWith('/docs/') && pathname.endsWith('.md')) {
    const slug = pathname.slice('/docs/'.length)
    return NextResponse.rewrite(new URL(`/api/md/docs/${slug}`, request.url))
  }

  // /blog/*.md → /api/md/blog/*.md
  if (pathname.startsWith('/blog/') && pathname.endsWith('.md')) {
    const slug = pathname.slice('/blog/'.length)
    return NextResponse.rewrite(new URL(`/api/md/blog/${slug}`, request.url))
  }
  // ... rest of middleware
}
```

**Critical**: Check `robots.txt`. If `/api/` is disallowed (common), AI bots cannot fetch `/api/md/...` URLs — that's why clean `/docs/*.md` URLs matter. They fall under the already-allowed `/docs/` path.

---

## Step 2 — AI Discovery Signals

Every page should declare llms.txt in two places so AI crawlers find it immediately.

### 1. `<link rel="alternate">` in `<head>` (semantic signal)

In the docs `layout.tsx` (and in each page's `generateMetadata`):

```ts
// Docs layout metadata
export const metadata: Metadata = {
  alternates: {
    types: { 'text/plain': 'https://yoursite.com/docs/llms.txt' },
  },
}

// Individual page generateMetadata — page-level wins, so add types here too
return {
  alternates: {
    canonical: url,
    types: { 'text/plain': 'https://yoursite.com/docs/llms.txt' },
  },
}
```

This generates: `<link rel="alternate" type="text/plain" href="https://yoursite.com/docs/llms.txt" />`

### 2. `<blockquote class="sr-only">` as first body element (content signal)

In `layout.tsx`, add BEFORE the main Suspense boundary so it's literally the first text any crawler reads:

```tsx
// docs/layout.tsx
return (
  <>
    {/* First thing crawlers see — references llms.txt for AI navigation */}
    <blockquote className="sr-only" aria-label="AI documentation index">
      <p>Fetch the complete documentation index at: https://yoursite.com/docs/llms.txt</p>
      <p>Use this file to discover all available pages before exploring further.</p>
    </blockquote>
    <Suspense fallback={...}>
      {children}
    </Suspense>
  </>
)
```

**Why `sr-only` not `hidden`**: `hidden`/`display:none` can be skipped by some parsers. `sr-only` uses `position:absolute; width:1px; clip:rect(0,0,0,0)` — always in DOM, readable by screen readers and all crawlers. Legitimate accessibility pattern, no SEO cloaking risk.

---

## Step 3 — Sitemap & Robots

### Add llms.txt files to sitemap

```ts
// sitemap.ts
const staticPages = [
  // ... other pages ...
  { path: '/llms.txt',       priority: 0.6, changeFrequency: 'daily' },
  { path: '/docs/llms.txt',  priority: 0.7, changeFrequency: 'daily' },
  { path: '/blog/llms.txt',  priority: 0.6, changeFrequency: 'daily' },
]
```

### Allow AI bots in robots.txt

```ts
// robots.ts
{
  userAgent: 'GPTBot',          // Also: Claude-Web, Anthropic-AI, Google-Extended, PerplexityBot
  allow: ['/docs/', '/llms.txt', '/blog/llms.txt', '/faq', '/pricing'],
  disallow: ['/api/', '/admin/', '/account/'],
}
```

---

## Verification Checklist

Run after every change:

```bash
# 1. h1 in real HTML (not RSC JSON)
curl -s http://localhost:3000/pricing | python3 -c "
import sys, re; html = sys.stdin.read()
body = html.split('<body')[1] if '<body' in html else html
clean = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.DOTALL)
h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', clean, re.DOTALL)
print('PASS' if h1s else 'FAIL', '| h1:', h1s[:1])
"

# 2. llms.txt uses /docs/*.md paths (not /api/md/...)
curl -s http://localhost:3000/docs/llms.txt | head -5
# ✓ Should show: - [Title](https://site.com/docs/slug.md)
# ✗ NOT: - [Title](https://site.com/api/md/docs/slug.md)

# 3. .md URLs work
curl -s http://localhost:3000/docs/quickstart.md | head -3
# ✓ Should return raw markdown starting with # Quickstart

# 4. <link rel=alternate> in head
curl -s http://localhost:3000/docs | grep -o 'rel="alternate"[^>]*'
# ✓ Should show: rel="alternate" type="text/plain" href="...llms.txt"

# 5. blockquote appears before article in HTML
curl -s http://localhost:3000/docs | python3 -c "
import sys; html = sys.stdin.read()
bq = html.find('llms.txt'); art = html.find('<article')
print('PASS' if 0 < bq < art else 'FAIL', f'| llms.txt@{bq} article@{art}')
"
```

---

## Quick Reference — What Goes Where

| Problem | Location | Fix |
|---------|----------|-----|
| Page h1 missing from HTML | `page.tsx` (server) | Add `<div className="sr-only"><h1>...</h1></div>` before client component |
| loading.tsx blocks sr-only | Create `layout.tsx` for route segment | Put sr-only in layout, not page |
| MDX/CMS content in RSC JSON only | Page's `<Suspense>` wrapping | Remove Suspense; replace `useSearchParams()` with `window.location.search` in `useEffect` |
| llms.txt URLs blocked by robots | Middleware + robots.txt | Rewrite `/docs/*.md` → API handler; allow `/docs/` path in robots |
| AI bots don't know index exists | `layout.tsx` | Add `<blockquote sr-only>` + `<link rel="alternate" type="text/plain">` metadata |
| llms.txt not in sitemap | `sitemap.ts` | Add all llms.txt files as static pages |
