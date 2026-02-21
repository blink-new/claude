---
name: website-llm-seo
description: Make any Next.js website fully indexable by Google (SEO) and AI engines like ChatGPT, Perplexity, Claude, and Gemini (GEO / Generative Engine Optimization). Diagnoses and fixes root causes: auth-loading skeletons, Suspense/RSC streaming, thin body text, missing structured data, and llms.txt signals. Use when building a new site, auditing SEO, setting up llms.txt, fixing invisible content, comparing against competitors, or improving AI engine discoverability.
---

# SEO + GEO for Next.js Websites

Two goals:
- **SEO**: Google reads real HTML — content depth + structured data in initial response
- **GEO**: AI engines follow `llms.txt` and `<link rel="alternate">` signals

---

## Step 0 — Competitive Bot Audit

Always compare against a competitor first. Run with real bot UAs:

```python
import subprocess, re

def audit(url, ua="Googlebot/2.1 (+http://www.google.com/bot.html)"):
    r = subprocess.run(['/usr/bin/curl', '-s', '-A', ua, '--max-time', '10', '-L', url],
                      capture_output=True, text=True, timeout=12)
    html = r.stdout
    no_s = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    no_h = re.sub(r'<div hidden[^>]*>.*?</div>', '', no_s, flags=re.DOTALL)
    jld = re.findall(r'type="application/ld\+json"[^>]*>(.*?)</script>', html, re.DOTALL)
    h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', no_h, re.DOTALL)
    text = len(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', no_h)).strip())
    types = list(set(t for j in jld for t in re.findall(r'"@type":"([A-Za-z]+)"', j[:300])))
    h1 = re.sub(r'<[^>]+>', '', h1s[0])[:60] if h1s else 'NONE'
    return {"h1": h1, "jld": len(jld), "types": types, "text": text}

sites = {
    "yoursite.com": ["https://yoursite.com", "https://yoursite.com/faq"],
    "competitor.com": ["https://competitor.com", "https://competitor.com/faq"],
}
for site, pages in sites.items():
    print(f"\n--- {site} ---")
    for url in pages:
        d = audit(url)
        print(f"  {url.split('/')[-1] or '/':<20} h1={bool(d['h1']!='NONE')} jld={d['jld']} text={d['text']} types={d['types'][:3]}")
```

**PASS per page**: h1 ✅, JSON-LD ✅, text > 5,000 chars ✅

### Text length benchmarks

| Page | Target | Why |
|------|--------|-----|
| Homepage | 10,000+ chars | Testimonials + FAQ answers + stats create long-tail keyword coverage |
| FAQ page | 20,000+ chars | Full Q&A text for featured snippets |
| Category/pSEO | 5,000+ chars | Enough context for topic authority |
| Docs page | 3,000+ chars | Article depth signal |

**Real example**: openclaw.ai homepage = 36,015 chars (fully SSR'd testimonials + features). blink.new homepage after fix = 10,849 chars via expanded sr-only. Both get Google indexed; openclaw wins on long-tail text volume.

---

## Root Cause 1 — Auth Loading Skeleton

**Pattern**: `'use client'` → `useAuth()` → `if (isLoading) return <Skeleton>` → SSR outputs empty skeleton.

**Fix A — sr-only block** (works for Google, not WebFetch-style AI fetchers): Place in server component `page.tsx` **before** the client wrapper. Make it **substantive** — thin sr-only is almost as bad as none:

```tsx
// page.tsx — server component, no 'use client'
import { FAQ_ITEMS, ALL_FAQ_ITEMS } from '@/constants/faq'

export default function Home() {
  return (
    <>
      <div className="sr-only">
        {/* === CRITICAL: Aim for 10k+ chars total === */}

        <h1>Your App — Clear Value Proposition</h1>
        <p>One sentence describing who this is for and what it does.</p>

        {/* Stats — social proof as text */}
        <p>50,000+ users. $2M+ saved. Used by teams at [Company A], [Company B].</p>

        {/* What you can build — specific, keyword-rich */}
        <h2>What you can build</h2>
        <ul>
          <li>CRM systems with contact management, deal tracking, and email integration</li>
          <li>SaaS apps with Stripe billing, user authentication, multi-tenant workspaces</li>
          {/* 8–12 items with specific details, not just category names */}
        </ul>

        {/* Pricing — bots can't read client-rendered pricing */}
        <h2>Pricing</h2>
        <ul>
          <li>Free plan — 10 credits/month, no credit card required</li>
          <li>Pro — $50/month — 200 credits + daily credits that reset</li>
        </ul>

        {/* Tech stack — names drive long-tail keyword coverage */}
        <h2>Built with</h2>
        <p>React, TypeScript, Tailwind CSS, shadcn/ui, Turso SQLite, Deno Edge Functions, Cloudflare Workers.</p>

        {/* FAQ as body text — in ADDITION to JSON-LD */}
        <h2>Frequently asked questions</h2>
        {ALL_FAQ_ITEMS.slice(0, 20).map(faq => (
          <div key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        {/* Testimonials — authentic user language = long-tail keywords */}
        <h2>What users say</h2>
        <blockquote><p>"I built a complete SaaS with Stripe and auth in 45 minutes."</p></blockquote>
        <blockquote><p>"Saved $15,000 in dev costs. My CRM was live in under an hour."</p></blockquote>
        {/* Add 6–10 testimonials */}
      </div>
      <ClientComponent />
    </>
  )
}
```

**sr-only note**: Google processes CSS so sr-only IS indexed. WebFetch/Perplexity/ChatGPT raw fetchers skip it — this is an accepted limitation for auth-aware SaaS pages (lovable.dev has the same issue). If you can fully SSR the page, do that instead.

**Fix B — seoFriendly ConditionalLayout** (full content, all bots): For pSEO pages with `generateStaticParams`:

```tsx
// ConditionalLayout.tsx
export function ConditionalLayout({ children, seoFriendly = false }) {
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { if (seoFriendly) setMounted(true) }, [seoFriendly])

  if (seoFriendly) {
    if (mounted && !isLoading && user) return <AppLayout>{children}</AppLayout>
    return (
      <>
        <MarketingLayout>{children}</MarketingLayout>
        {mounted && isLoading && <div className="fixed inset-0 z-50"><AppLoadingSkeleton /></div>}
      </>
    )
  }
  if (isLoading) return <AppLoadingSkeleton />
  if (user) return <AppLayout>{children}</AppLayout>
  return <MarketingLayout>{children}</MarketingLayout>
}

// Apply to all pSEO pages (explore/[category], templates/[category], etc.)
<ConditionalLayout seoFriendly>{/* full content */}</ConditionalLayout>
```

### loading.tsx creates a Suspense boundary

Route has `loading.tsx` → page content streams after fallback → sr-only in page.tsx is inside streaming fragment → not in synchronous HTML. Fix: `layout.tsx` renders **outside** the Suspense:

```tsx
// explore/layout.tsx — outside Suspense from loading.tsx
export default function ExploreLayout({ children }) {
  return (
    <>
      <div className="sr-only">
        <h1>Explore Apps Built with AI</h1>
        <p>Browse production-ready apps by category...</p>
      </div>
      {children}
    </>
  )
}
```

---

## Root Cause 2 — Suspense Around Async RSC

`<Suspense fallback={null}>` wraps async RSC → content arrives as RSC JSON only.

```tsx
// WRONG — MDX content invisible to crawlers
<Suspense fallback={null}>
  <DocsContentWrapper>  {/* 'use client', uses useSearchParams() */}
    <MDXRemote source={doc.content} />
  </DocsContentWrapper>
</Suspense>

// CORRECT — full content in initial HTML
<DocsContentWrapper>
  <MDXRemote source={doc.content} />
</DocsContentWrapper>
```

```tsx
// DocsContentWrapper.tsx — replace useSearchParams() with window.location.search
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

**Critical**: Always plain `<script>` — **never `<Script>` from next/script** (client-only, invisible to Wave 1).

```tsx
// ✅ In initial HTML for all bots
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

// ❌ Client-only — Wave 1 bots miss it
import Script from 'next/script'
<Script type="application/ld+json" ... />
```

### 4 schemas for homepage (`page.tsx`, server component)

```tsx
import { ALL_FAQ_ITEMS } from '@/constants/faq'

// FAQPage — unlocks expandable FAQ boxes in SERP
const faqSchema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: ALL_FAQ_ITEMS.map(faq => ({
    '@type': 'Question', name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
}
// SoftwareApplication — unlocks star ratings in SERP
const softwareSchema = {
  '@context': 'https://schema.org', '@type': 'SoftwareApplication',
  name: 'YourApp', applicationCategory: 'DeveloperApplication', operatingSystem: 'Web',
  url: 'https://yoursite.com',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '1000' },
}
// WebSite — sitelinks search box
const websiteSchema = {
  '@context': 'https://schema.org', '@type': 'WebSite',
  name: 'YourApp', url: 'https://yoursite.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://yoursite.com/search?q={q}' },
    'query-input': 'required name=q',
  },
}
// Organization — knowledge panel
const orgSchema = {
  '@context': 'https://schema.org', '@type': 'Organization',
  name: 'YourApp', url: 'https://yoursite.com', logo: 'https://yoursite.com/logo.png',
  sameAs: ['https://x.com/yourhandle'], contactPoint: { '@type': 'ContactPoint', email: 'support@yoursite.com' },
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

### Root layout — Organization on every page

```tsx
// app/layout.tsx <head>
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Organization',
  name: 'YourApp', url: 'https://yoursite.com', logo: 'https://yoursite.com/logo.png',
}) }} />
```

### Schemas by page type

| Page | Schemas |
|------|---------|
| Homepage | FAQPage + SoftwareApplication + WebSite + Organization |
| FAQ/Affiliates | FAQPage + Organization |
| Docs article | TechArticle (plain `<script>`, not `<Script>`) |
| Alternatives/[slug] | FAQPage + HowTo + SoftwareApplication |
| Category pSEO | FAQPage + HowTo + BreadcrumbList |
| Listing page | CollectionPage |

---

## Step 2 — llms.txt (GEO)

```
/llms.txt          ← master index
/docs/llms.txt     ← all docs with .md links (auto-generated from CMS)
/docs/slug.md      ← individual doc as raw markdown (middleware rewrite)
```

```ts
// middleware.ts — BEFORE all other logic
if (pathname.startsWith('/docs/') && pathname.endsWith('.md')) {
  return NextResponse.rewrite(new URL(`/api/md/docs/${pathname.slice('/docs/'.length)}`, request.url))
}
```

**robots.txt must allow `/docs/` (not just `/api/`)**. AI bots check robots.txt — if `/api/` is disallowed, your `/api/md/...` URLs are blocked. Clean `.md` paths under `/docs/` bypass this.

---

## Step 3 — AI Discovery Signals (Docs)

```tsx
// docs/layout.tsx — OUTSIDE the Suspense (first thing bots see)
return (
  <>
    <blockquote className="sr-only" aria-label="AI documentation index">
      <p>Fetch the complete documentation index at: https://yoursite.com/docs/llms.txt</p>
    </blockquote>
    <Suspense fallback={...}>{children}</Suspense>
  </>
)

// docs page generateMetadata
alternates: {
  canonical: url,
  types: { 'text/plain': 'https://yoursite.com/docs/llms.txt' },
}
```

---

## Step 4 — Sitemap & Robots

```ts
// sitemap.ts
{ path: '/llms.txt',      priority: 0.6, changeFrequency: 'daily' },
{ path: '/docs/llms.txt', priority: 0.7, changeFrequency: 'daily' },

// robots.ts — explicit per-bot rules
{ userAgent: 'GPTBot',        allow: ['/docs/', '/llms.txt', '/faq'], disallow: ['/api/'] },
{ userAgent: 'PerplexityBot', allow: ['/docs/', '/llms.txt', '/faq'], disallow: ['/api/'] },
{ userAgent: 'Claude-Web',    allow: ['/docs/', '/llms.txt', '/faq'], disallow: ['/api/'] },
{ userAgent: 'Google-Extended', allow: ['/docs/', '/llms.txt', '/faq'], disallow: ['/api/'] },
```

---

## Verification Checklist

```bash
# Full competitive bot audit
python3 << 'EOF'
import subprocess, re
UA = "Googlebot/2.1 (+http://www.google.com/bot.html)"
for url in ["https://yoursite.com", "https://competitor.com"]:
    r = subprocess.run(['/usr/bin/curl', '-s', '-A', UA, '--max-time', '10', '-L', url],
                      capture_output=True, text=True, timeout=12)
    html = r.stdout
    no_s = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    no_h = re.sub(r'<div hidden[^>]*>.*?</div>', '', no_s, flags=re.DOTALL)
    jld = re.findall(r'type="application/ld\+json"', html)
    h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', no_h, re.DOTALL)
    text = len(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', no_h)).strip())
    types = re.findall(r'"@type":"([A-Za-z]+)"', html)
    print(f"{url.split('/')[2]:<25} h1={bool(h1s)} jld={len(jld)} text={text} types={list(set(types))[:4]}")
EOF

# JSON-LD types present on homepage
curl -s https://yoursite.com | grep -o '"@type":"[A-Za-z]*"' | sort | uniq

# llms.txt using clean /docs/*.md paths
curl -s https://yoursite.com/docs/llms.txt | head -3

# Docs TechArticle in initial HTML (not client-rendered)
curl -s https://yoursite.com/docs/quickstart | grep -c 'TechArticle'
```

---

## Quick Reference

| Problem | Location | Fix |
|---------|----------|-----|
| Homepage text < 5k chars | `page.tsx` sr-only | Add stats, FAQ Q&As, testimonials, pricing, tech stack — target 10k+ |
| h1 missing (auth page) | `page.tsx` server component | `<div className="sr-only"><h1>...</h1>` before client wrapper |
| h1 missing (pSEO page) | ConditionalLayout | `<ConditionalLayout seoFriendly>` + `generateStaticParams` |
| loading.tsx blocks content | Route segment | `layout.tsx` with sr-only renders outside Suspense |
| MDX in RSC JSON only | Suspense around async RSC | Remove Suspense; replace `useSearchParams()` with `window.location.search` |
| Zero JSON-LD on homepage | `page.tsx` | FAQPage + SoftwareApplication + WebSite + Organization |
| JSON-LD invisible to bots | `<Script>` from next/script | Change to plain `<script>` tag |
| llms.txt blocked by robots | Middleware + robots.txt | Clean `/docs/*.md` paths; allow `/docs/` not `/api/` |
| AI bots don't discover docs | `layout.tsx` | `<blockquote sr-only>` before Suspense + `alternates.types` |
