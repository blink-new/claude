#!/usr/bin/env bash
# audit-seo-health.sh — blink.new SEO/GEO health checker
# Usage: bash .cursor/skills/ai-seo-articles/scripts/audit-seo-health.sh [base_url]
# Default base_url: https://blink.new

BASE="${1:-https://blink.new}"
PASS=0; FAIL=0; WARN=0

green() { printf "\033[32m✓ %s\033[0m\n" "$1"; ((PASS++)); }
red()   { printf "\033[31m✗ %s\033[0m\n" "$1"; ((FAIL++)); }
warn()  { printf "\033[33m⚠ %s\033[0m\n" "$1"; ((WARN++)); }

echo && echo "═══ blink.new SEO/GEO Health Audit — $BASE ═══" && echo

# 1. Blog indexing
echo "▶ Blog Indexing"
NOINDEX=$(curl -s "$BASE/blog" | grep -ci "noindex" 2>/dev/null || echo 0)
[ "$NOINDEX" -eq 0 ] && green "Blog index is indexable" || red "Blog index has noindex — fix src/app/blog/page.tsx"
SLUG="openclaw-getting-started-complete-guide-2026"
NOINDEX=$(curl -s "$BASE/blog/$SLUG" | grep -ci "noindex" 2>/dev/null || echo 0)
[ "$NOINDEX" -eq 0 ] && green "Blog posts are indexable" || red "Blog post has noindex — fix src/app/blog/[slug]/page.tsx + layout.tsx"
echo

# 2. robots.txt
echo "▶ robots.txt"
ROBOTS=$(curl -s "$BASE/robots.txt")
echo "$ROBOTS" | grep -qE "Allow: /blog/|Allow: /" && green "Allows /blog/" || red "Does NOT allow /blog/ — fix robots.ts"
for bot in OAI-SearchBot ClaudeBot PerplexityBot GPTBot Google-Extended; do
  echo "$ROBOTS" | grep -q "$bot" && green "Has $bot" || red "Missing $bot — add to robots.ts"
done
echo

# 3. Sitemap
echo "▶ Sitemap"
SITEMAP=$(curl -s "$BASE/sitemap.xml")
N=$(echo "$SITEMAP" | grep -c "/blog/" 2>/dev/null || echo 0)
[ "$N" -gt 10 ] && green "Sitemap: $N blog URLs" || { [ "$N" -gt 0 ] && warn "Sitemap: only $N blog URLs (expected 20+)" || red "Sitemap: ZERO blog URLs — fix sitemap.ts"; }
echo "$SITEMAP" | grep -q "/claw" && green "Sitemap includes /claw" || warn "Sitemap missing /claw"
echo "$SITEMAP" | grep -q "sign-up\|sign-in" && warn "Sitemap includes auth pages (remove them)" || green "Sitemap excludes auth pages"
echo

# 4. Schema markup
echo "▶ Schema Markup"
POST_HTML=$(curl -s "$BASE/blog/$SLUG")
echo "$POST_HTML" | grep -q '"FAQPage"'       && green "FAQPage schema (3.2× AI Overview boost)" || red "FAQPage schema MISSING — add extractFAQs() to blog/[slug]/page.tsx"
echo "$POST_HTML" | grep -q '"BreadcrumbList"' && green "BreadcrumbList schema" || warn "BreadcrumbList missing"
echo "$POST_HTML" | grep -q '"BlogPosting"'    && green "BlogPosting schema" || red "BlogPosting schema MISSING"
ROOT_HTML=$(curl -s "$BASE")
echo "$ROOT_HTML" | grep -q '"WebSite"'        && green "WebSite schema in root layout" || warn "WebSite schema missing — add to layout.tsx"
echo "$ROOT_HTML" | grep -q '"Organization"'   && green "Organization schema in root layout" || warn "Organization schema missing"
echo

# 5. llms.txt
echo "▶ llms.txt"
ROOT_LLMS=$(curl -s "$BASE/llms.txt")
[ -n "$ROOT_LLMS" ] && green "Root llms.txt exists" || red "Root llms.txt MISSING"
echo "$ROOT_LLMS" | grep -qi "blink claw" && green "llms.txt mentions Blink Claw" || warn "llms.txt missing Blink Claw section"
N=$(curl -s "$BASE/blog/llms.txt" | grep -c "blink.new/blog/" 2>/dev/null || echo 0)
[ "$N" -gt 10 ] && green "blog/llms.txt: $N post links" || red "blog/llms.txt: only $N links (expected 20+)"
echo

# 6. OG / RSS
echo "▶ Open Graph & RSS"
echo "$POST_HTML" | grep -q 'property="og:image"' && green "OG image on blog posts" || warn "OG image missing — check image_url frontmatter"
RSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/blog/feed.xml")
[ "$RSS_STATUS" = "200" ] && green "RSS feed at /blog/feed.xml (HTTP 200)" || warn "RSS feed: HTTP $RSS_STATUS"
echo "$POST_HTML" | grep -q 'application/rss+xml' && green "RSS auto-discovery in <head>" || warn "RSS auto-discovery missing — fix blog/layout.tsx"
echo

# Summary
echo "═══ $PASS passed  ·  $WARN warnings  ·  $FAIL failed ═══" && echo
[ "$FAIL" -gt 0 ] && { echo "❌ $FAIL critical issues. Fix before deploying."; exit 1; } || \
  { [ "$WARN" -gt 0 ] && echo "⚠  $WARN warnings." || echo "✅ All checks passed."; }
