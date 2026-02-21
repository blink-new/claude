---
name: website-llm-seo
description: Make any Next.js website fully indexable by Google (SEO) and AI engines like ChatGPT, Perplexity, Claude, and Gemini (GEO / Generative Engine Optimization). Diagnoses and fixes root causes of invisible content: auth-loading skeletons, Suspense/RSC streaming, missing structured data, and llms.txt signals. Use when building a new site, auditing SEO, setting up llms.txt, adding JSON-LD structured data, fixing pages that show no content to crawlers, or improving AI engine discoverability.
---

# SEO + GEO for Next.js Websites

Two goals:
- **SEO**: Google's crawler reads real HTML → content + structured data in initial response
- **GEO**: AI engines (ChatGPT, Perplexity, Gemini, Claude) follow `llms.txt` and read `<link rel="alternate">` signals

---

## Step 0 — Diagnose: What Do Bots Actually See?

Run against every key page with a real bot UA before touching code:

```bash
python3 << 'EOF'
import subprocess, re

UA = "Googlebot/2.1 (+http://www.google.com/bot.html)"
pages = ["https://yoursite.com", "https://yoursite.com/pricing", "https://yoursite.com/faq"]

for url in pages:
    r = subprocess.run(['/usr/bin/curl', '-s', '-A', UA, '--max-time', '10', url],
                      capture_output=True, text=True, timeout=12)
    html = r.stdout
    no_scripts = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    no_hidden = re.sub(r'<div hidden[^>]*>.*?</div>', '', no_scripts, flags=re.DOTALL)
    json_ld = re.findall(r'type="application/ld\+json"', html)
    h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', no_hidden, re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', no_hidden)
    text_len = len(re.sub(r'\s+', ' ', text).strip())
    h1_txt = re.sub(r'<[^>]+>', '', h1s[0])[:50] if h1s else 'NONE'
    print(f"{'PASS' if h1s and json_ld else 'FAIL'} {url.split('/')[-1] or '/':<15} h1='{h1_txt}' json_ld={len(json_ld)} text={text_len}")
EOF
```

**PASS criteria per page**: h1 in HTML ✅, JSON-LD schema ✅, meaningful text length ✅

**Important**: `sr-only` content IS indexed by Google (processes CSS), but **NOT** by WebFetch-style AI tools (Perplexity, ChatGPT raw fetchers). For auth-aware SaaS pages (homepage, pricing) this is accepted — lovable.dev has the same limitation. Only fix: full SSR, which requires eliminating auth-loading skeleton patterns.

---

## Root Cause 1 — Auth Loading Skeleton

**Pattern**: `'use client'` component calls `useAuth()` + `if (isLoading) return <Skeleton>` → SSR outputs only skeleton divs with no content.

**Fix A (sr-only — works for Google, not WebFetch)**: Add server-rendered `sr-only` block in `page.tsx` before the client wrapper. Use for auth-aware pages where full SSR isn't feasible:

```tsx
// pricing/page.tsx (server component)
export default function PricingPage() {
  return (
    <>
      <div className="sr-only">
        <h1>Simple, Transparent Pricing</h1>
        <p>Free plan, Starter $25/mo, Pro $50/mo. Credits-based.</p>
      </div>
      <PricingPageClient />
    </>
  )
}
```

**Fix B (seoFriendly — full content, works for all bots)**: For pSEO pages with `generateStaticParams` (statically generated), use a `seoFriendly` prop pattern so content is in static HTML:

```tsx
// ConditionalLayout.tsx — add seoFriendly prop
export function ConditionalLayout({ children, seoFriendly = false }) {
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { if (seoFriendly) setMounted(true) }, [seoFriendly])

  if (seoFriendly) {
    // After hydration: authenticated users get app layout
    if (mounted && !isLoading && user) return <AppLayout>{children}</AppLayout>
    return (
      <>
        <MarketingLayout>{children}</MarketingLayout>
        {/* Client-only skeleton — NEVER in SSR HTML */}
        {mounted && isLoading && <div className="fixed inset-0 z-50"><AppLoadingSkeleton /></div>}
      </>
    )
  }

  // Default: skeleton during loading (auth-aware pages)
  if (isLoading) return <AppLoadingSkeleton />
  if (user) return <AppLayout>{children}</AppLayout>
  return <MarketingLayout>{children}</MarketingLayout>
}
```

```tsx
// explore/[category]/page.tsx, explore/trending/page.tsx, templates/[category]/page.tsx
// Add seoFriendly to all pSEO pages that have generateStaticParams
<ConditionalLayout seoFriendly>
  {/* full page content */}
</ConditionalLayout>
```

**Why this works**: Pages with `generateStaticParams` are pre-rendered at build time. With `seoFriendly`, the static HTML includes the full content (not a skeleton). AI crawlers fetch the cached static HTML and read everything.

### Special case: `loading.tsx` creates a Suspense boundary

If a route has `loading.tsx`, page content is inside a Suspense boundary and streams after the fallback. Content in `page.tsx` won't be in synchronous HTML. Fix: create a `layout.tsx` for that route — layouts render **outside** the Suspense:

```tsx
// explore/layout.tsx — renders before loading.tsx's Suspense
export default function ExploreLayout({ children }) {
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

**Pattern**: `<Suspense fallback={null}>` wraps async RSC (e.g. `MDXRemote`). Content arrives as RSC JSON in `<script>` tags — not real HTML.

**Fix**: Remove Suspense; replace `useSearchParams()` with `window.location.search` in `useEffect`:

```tsx
// WRONG
<Suspense fallback={null}>
  <DocsContentWrapper>   {/* 'use client', uses useSearchParams() */}
    <MDXRemote source={doc.content} />
  </DocsContentWrapper>
</Suspense>

// CORRECT
<DocsContentWrapper>
  <MDXRemote source={doc.content} />
</DocsContentWrapper>
```

```tsx
// DocsContentWrapper.tsx — window.location.search removes Suspense requirement
'use client'
export function DocsContentWrapper({ children }) {
  const ref = useRef(null)
  const router = useRouter()
  useEffect(() => {
    const isEmbed = new URLSearchParams(window.location.search).get('embed') === 'true'
    if (!isEmbed || !ref.current) return
    // ... embed click handler
  }, [router])
  return <div ref={ref}>{children}</div>
}
```

---

## Step 1 — Structured Data (JSON-LD)

**Critical rule**: Always use plain `<script>` — **never `<Script>` from next/script** (that's client-only, bots won't see it).

```tsx
// ✅ CORRECT — in initial HTML for all bots
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

// ❌ WRONG — client-only, invisible to Wave 1 crawlers
import Script from 'next/script'
<Script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
```

### Homepage: 4 schemas in `page.tsx` (server component)

```tsx
// page.tsx
import { FAQ_ITEMS } from '@/constants/faq'

const faqSchema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(faq => ({
    '@type': 'Question', name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
}
const softwareSchema = {
  '@context': 'https://schema.org', '@type': 'SoftwareApplication',
  name: 'YourApp', applicationCategory: 'DeveloperApplication', operatingSystem: 'Web',
  url: 'https://yoursite.com',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '1000' },
}
const websiteSchema = {
  '@context': 'https://schema.org', '@type': 'WebSite',
  name: 'YourApp', url: 'https://yoursite.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://yoursite.com/search?q={q}' },
    'query-input': 'required name=q',
  },
}
const orgSchema = {
  '@context': 'https://schema.org', '@type': 'Organization',
  name: 'YourApp', url: 'https://yoursite.com', logo: 'https://yoursite.com/logo.png',
  sameAs: ['https://x.com/yourhandle'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: 'support@yoursite.com' },
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <YourClientComponent />
    </>
  )
}
```

### Root layout: Organization on every page

```tsx
// app/layout.tsx — <head> section
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Organization',
  name: 'YourApp', url: 'https://yoursite.com',
  logo: 'https://yoursite.com/logo.png',
}) }} />
```

### Schemas by page type

| Page type | Schema to add |
|-----------|--------------|
| Homepage | FAQPage + SoftwareApplication + WebSite + Organization |
| FAQ page | FAQPage |
| Blog/Docs article | Article or TechArticle |
| Product/SaaS category | FAQPage + HowTo + SoftwareApplication |
| Listing/Collection | CollectionPage or ItemList |
| Alternatives page | FAQPage + HowTo |
| Template detail | BreadcrumbList |

**Impact**: FAQPage → expandable FAQ boxes in SERP (CTR boost). SoftwareApplication → star ratings visible in search results.

---

## Step 2 — Set Up llms.txt (GEO)

```
/llms.txt          ← master index
/docs/llms.txt     ← all doc pages with .md links
/docs/slug.md      ← individual doc as raw markdown (middleware rewrite)
```

### Middleware rewrites — clean `.md` URLs

```ts
// middleware.ts — BEFORE other logic
const { pathname } = request.nextUrl

if (pathname.startsWith('/docs/') && pathname.endsWith('.md')) {
  return NextResponse.rewrite(new URL(`/api/md/docs/${pathname.slice('/docs/'.length)}`, request.url))
}
if (pathname.startsWith('/blog/') && pathname.endsWith('.md')) {
  return NextResponse.rewrite(new URL(`/api/md/blog/${pathname.slice('/blog/'.length)}`, request.url))
}
```

**Critical**: `/api/` is typically disallowed in `robots.txt`. Clean `.md` paths under `/docs/` are already allowed.

---

## Step 3 — AI Discovery Signals

Add to every docs page so AI crawlers find the index immediately:

```tsx
// docs/layout.tsx — OUTSIDE the Suspense (first thing in HTML)
return (
  <>
    <blockquote className="sr-only" aria-label="AI documentation index">
      <p>Fetch the complete documentation index at: https://yoursite.com/docs/llms.txt</p>
      <p>Use this file to discover all available pages before exploring further.</p>
    </blockquote>
    <Suspense fallback={...}>{children}</Suspense>
  </>
)
```

```ts
// docs page generateMetadata — <link rel="alternate"> in <head>
alternates: {
  canonical: url,
  types: { 'text/plain': 'https://yoursite.com/docs/llms.txt' },
}
```

---

## Step 4 — Sitemap & Robots

```ts
// sitemap.ts — include llms.txt files
{ path: '/llms.txt',       priority: 0.6, changeFrequency: 'daily' },
{ path: '/docs/llms.txt',  priority: 0.7, changeFrequency: 'daily' },

// robots.ts — allow AI bots
{ userAgent: 'GPTBot',       allow: ['/docs/', '/llms.txt', '/faq'], disallow: ['/api/'] },
{ userAgent: 'PerplexityBot', allow: ['/docs/', '/llms.txt', '/faq'], disallow: ['/api/'] },
{ userAgent: 'Claude-Web',    allow: ['/docs/', '/llms.txt', '/faq'], disallow: ['/api/'] },
```

---

## Verification Checklist

```bash
# 1. Full bot audit — run for all key pages
python3 -c "
import subprocess, re
UA = 'Googlebot/2.1 (+http://www.google.com/bot.html)'
for url in ['https://yoursite.com', 'https://yoursite.com/faq', 'https://yoursite.com/pricing']:
    r = subprocess.run(['/usr/bin/curl', '-s', '-A', UA, '--max-time', '10', url], capture_output=True, text=True, timeout=12)
    html = r.stdout
    no_s = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    no_h = re.sub(r'<div hidden[^>]*>.*?</div>', '', no_s, flags=re.DOTALL)
    h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', no_h, re.DOTALL)
    jld = re.findall(r'type=\"application/ld\+json\"', html)
    print(f'{'PASS' if h1s and jld else 'FAIL'} {url[-20:]:<22} h1={bool(h1s)} json_ld={len(jld)}')
"

# 2. Verify JSON-LD types on homepage
curl -s https://yoursite.com | grep -o '"@type":"[A-Za-z]*"' | sort | uniq

# 3. llms.txt uses /docs/*.md paths (not /api/md/...)
curl -s https://yoursite.com/docs/llms.txt | head -5

# 4. .md URLs serve raw markdown
curl -s https://yoursite.com/docs/quickstart.md | head -3

# 5. <link rel=alternate> in head
curl -s https://yoursite.com/docs | grep -o 'rel="alternate"[^>]*'

# 6. blockquote before article (docs pages)
curl -s https://yoursite.com/docs | python3 -c "
import sys; html = sys.stdin.read()
bq = html.find('llms.txt'); art = html.find('<article')
print('PASS' if 0 < bq < art else 'FAIL', f'bq@{bq} art@{art}')
"
```

---

## Quick Reference

| Problem | Location | Fix |
|---------|----------|-----|
| h1 missing (auth-aware page) | `page.tsx` server component | `<div className="sr-only"><h1>...</h1></div>` before client wrapper |
| h1 missing (pSEO page) | ConditionalLayout wrapper | `<ConditionalLayout seoFriendly>` — static generation puts content in HTML |
| loading.tsx blocks content | Route segment | Add `layout.tsx` with sr-only content — renders outside Suspense |
| MDX/CMS content in RSC only | Suspense around async RSC | Remove Suspense; replace `useSearchParams()` with `window.location.search` |
| Zero JSON-LD on homepage | `page.tsx` | Add FAQPage + SoftwareApplication + WebSite + Organization schemas |
| JSON-LD client-only (invisible to bots) | Any file using `<Script>` | Change to plain `<script>` tag |
| llms.txt URLs blocked by robots | Middleware + robots.txt | Rewrite to clean paths; allow `/docs/` not `/api/` |
| AI bots don't know index exists | `layout.tsx` | `<blockquote sr-only>` before Suspense + `alternates.types` in metadata |
