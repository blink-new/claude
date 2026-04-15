#!/usr/bin/env node
/**
 * process-inline-images.mjs
 *
 * Processes INLINE_IMAGE_REAL and INLINE_IMAGE_CLAY comments in a draft MDX
 * file and replaces them with real CDN-hosted images.
 *
 * SELF-HEALING DESIGN: This script ALWAYS produces clean, publishable MDX output.
 * MDX does not support HTML comments (<!-- -->) — any remaining comments crash
 * every page for every visitor. This script guarantees zero HTML comments remain
 * after it runs, regardless of API failures.
 *
 * Failure recovery (in order):
 *   1. REAL image fails → auto-falls back to CLAY generation
 *   2. CLAY generation fails → removes the comment entirely (no image is better than a crash)
 *   3. Final sweep → strips ANY remaining <!-- INLINE_IMAGE_* --> HTML comments (nuclear fallback)
 *
 * Usage:
 *   node .cursor/skills/ai-seo-articles/scripts/process-inline-images.mjs <draft.mdx>
 *
 * Exit codes:
 *   0  Done — output is clean and safe to publish (images may or may not have succeeded)
 *   1  Fatal error — file unreadable/unwritable (fix the path and retry)
 *   2  No INLINE_IMAGE comments found — nothing to do, draft is already clean
 *
 * Note: There is NO exit 3 (partial success). The script always exits 0 for a
 * publishable file. Check the log output to see how many images succeeded.
 *
 * Requires Node.js 18+. No npm install needed.
 */

import { readFileSync, writeFileSync } from 'fs'
import https from 'https'

// ─── Config ────────────────────────────────────────────────────────────────

const MCP_BASE   = 'https://blink-mcp-production.up.railway.app'
const BEARER     = 'blnk_60b83e763f3cc1a3a5093566ec8d4422157a1a49c94bf9ad'
const TIMEOUT_MS = 60_000

const CHARACTER_ANCHOR =
  'Same clay 3D character: young developer, brown medium-length hair, big expressive eyes, ' +
  '3D clay animation render style soft matte tactile finish, wearing their signature bright ' +
  'electric-blue hoodie with white lightning bolt logo on chest.'

const BLOCKED_DOMAINS = [
  'shutterstock', 'gettyimages', 'istockphoto', 'depositphotos',
  'alamy', 'dreamstime', 'bigstockphoto', 'canstockphoto',
]

const PREFERRED_DOMAINS = [
  'ycombinator', 'techcrunch', 'wired', 'wsj', 'bloomberg', 'reuters',
  'apnews', 'nytimes', 'theguardian', 'arstechnica', 'theverge',
  'hbr.org', 'forbes', 'businessinsider', 'cnbc',
]

// ─── MCP HTTP Client ────────────────────────────────────────────────────────

function mcpRequest(tool, args) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      jsonrpc: '2.0', id: Math.random().toString(36).slice(2),
      method: 'tools/call', params: { name: tool, arguments: args },
    })
    const timer = setTimeout(() => reject(new Error(`${tool} timed out`)), TIMEOUT_MS)
    const req = https.request({
      hostname: new URL(MCP_BASE).hostname, port: 443, path: '/mcp', method: 'POST',
      headers: {
        Authorization: `Bearer ${BEARER}`, 'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream', 'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = ''
      res.on('data', (c) => (raw += c))
      res.on('end', () => {
        clearTimeout(timer)
        for (let i = raw.split('\n').length - 1; i >= 0; i--) {
          const line = raw.split('\n')[i].trim()
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try { return resolve(JSON.parse(line.slice(6))) } catch {}
          }
        }
        try { resolve(JSON.parse(raw)) }
        catch { reject(new Error(`Bad response from ${tool}: ${raw.slice(0, 200)}`)) }
      })
      res.on('error', (e) => { clearTimeout(timer); reject(e) })
    })
    req.on('error', (e) => { clearTimeout(timer); reject(e) })
    req.write(body); req.end()
  })
}

function extractText(r) {
  return r?.result?.content?.[0]?.text || r?.result?.text || JSON.stringify(r)
}

// ─── CDN Upload ─────────────────────────────────────────────────────────────

async function uploadToCDN(remoteUrl, filename, altText) {
  const result = await mcpRequest('cms_upload_asset', { url: remoteUrl, filename, alt_text: altText || filename })
  const text = extractText(result)
  const cdnMatch = text.match(/https:\/\/cdn\.blink\.new\/[^\s"']+/)
  if (cdnMatch) return cdnMatch[0]
  const redacted = text.match(/\[REDACTED\](\/[^\s"']+)/)
  if (redacted) return `https://cdn.blink.new${redacted[1]}`
  try {
    const parsed = JSON.parse(text)
    const url = parsed.public_url || parsed.url
    if (url?.startsWith('https://cdn.blink.new/')) return url
    if (url?.includes('[REDACTED]')) return url.replace('[REDACTED]', 'https://cdn.blink.new')
  } catch {}
  throw new Error(`CDN upload failed: ${text.slice(0, 200)}`)
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

function findComments(content) {
  const regex = /<!--\s*(INLINE_IMAGE_REAL|INLINE_IMAGE_CLAY):([\s\S]*?)-->/g
  const found = []; let m
  while ((m = regex.exec(content)) !== null)
    found.push({ type: m[1], body: m[2].trim(), full: m[0] })
  return found
}

function parseReal(body) {
  return {
    query: body.match(/query\s*=\s*"([^"]*)"/)?.[1]?.trim() ?? null,
    alt:   body.match(/\|\s*alt\s*=\s*"([^"]*)"/)?.[1]?.trim() ?? null,
  }
}

function parseClay(body) {
  const pipeIdx = body.lastIndexOf('|')
  if (pipeIdx === -1) return { scene: body.trim(), alt: null }
  return {
    scene: body.slice(0, pipeIdx).trim(),
    alt:   body.slice(pipeIdx).match(/alt\s*=\s*"([^"]*)"/)?.[1]?.trim() ?? null,
  }
}

// ─── Image Processors ────────────────────────────────────────────────────────

async function processReal(query, alt) {
  console.log(`  🔍 search_images("${query}")`)
  const result = await mcpRequest('search_images', { query, num: 10 })
  const text = extractText(result)
  let images = []
  try {
    const parsed = JSON.parse(text)
    images = Array.isArray(parsed) ? parsed : (parsed.results ?? parsed.images ?? [])
  } catch {
    const urls = [...text.matchAll(/https?:\/\/\S+\.(?:jpg|jpeg|png|webp)/gi)]
    images = urls.map((m) => ({ image: m[0], domain: safeHost(m[0]) }))
  }
  if (!images.length) throw new Error('No search results')
  const candidates = images
    .filter(img => !BLOCKED_DOMAINS.some(b => (img.domain ?? safeHost(img.image ?? '')).includes(b)) && (img.image ?? img.url))
    .map(img => { const d = img.domain ?? safeHost(img.image ?? ''); const rank = PREFERRED_DOMAINS.findIndex(p => d.includes(p)); return { ...img, _score: rank >= 0 ? 100 - rank : 0 } })
    .sort((a, b) => b._score - a._score)
  if (!candidates.length) throw new Error('All results blocked (stock sites)')
  const best = candidates[0]
  const imageUrl = best.image ?? best.url ?? best.src
  console.log(`  ✓ ${best.domain ?? 'unknown'}: ${imageUrl.slice(0, 70)}`)
  return uploadToCDN(imageUrl, `inline-real-${slugify(query)}.jpg`, alt)
}

async function processClay(scene, alt) {
  const prompt = `${CHARACTER_ANCHOR} NEW SCENE: ${scene}. Expression: enthusiastic. Background: bright and warm. Centered composition, full frame. No text. 16:9.`
  console.log(`  🎨 generate_image("${scene.slice(0, 55)}${scene.length > 55 ? '...' : ''}")`)
  const result = await mcpRequest('generate_image', { prompt, aspect_ratio: '16:9', output_format: 'webp' })
  const text = extractText(result)
  const urlMatch = text.match(/https?:\/\/v3\.fal\.media\/[^\s"'>]+/) ??
    text.match(/https?:\/\/fal\.media\/[^\s"'>]+/) ??
    text.match(/https?:\/\/[^\s"'>]+\.(?:webp|png|jpg|jpeg)(?:\?[^\s"'>]*)?/i)
  if (!urlMatch) throw new Error(`No image URL in response: ${text.slice(0, 200)}`)
  console.log(`  ✓ Generated: ${urlMatch[0].slice(0, 70)}`)
  return uploadToCDN(urlMatch[0], `inline-clay-${slugify(scene)}.webp`, alt)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeHost(url) { try { return new URL(url).hostname } catch { return '' } }
function slugify(str) { return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) }

// ─── FINAL SAFETY SWEEP ──────────────────────────────────────────────────────
// MDX crashes on ALL HTML comments (<!-- -->). This strips any that slipped through.

/** Auto-fix title if it equals the slug (derived from the filename). */
function fixTitleIfSlug(content, filePath) {
  // Derive slug from path: "blog/my-article.mdx" → "my-article"
  const slug = filePath.replace(/^.*\//, '').replace(/\.mdx$/, '')

  // Read current frontmatter title
  const titleMatch = content.match(/^title:\s*"([^"]*)"/m)
  if (!titleMatch) return { content, fixed: false }

  const currentTitle = titleMatch[1]
  // If title already looks human-readable (has spaces or mixed case), leave it
  if (currentTitle !== slug) return { content, fixed: false }

  // Title equals the slug — extract real title from H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (!h1Match) return { content, fixed: false }

  const realTitle = h1Match[1].trim()
  const safeTitle = realTitle.replace(/"/g, "'")
  const fixed = content.replace(/^title:\s*"[^"]*"/m, 'title: "' + safeTitle + '"')
  console.log(`⚡ Fixed slug-as-title: "${currentTitle}" → "${realTitle}"`)
  return { content: fixed, fixed: true }
}

function stripAllHtmlComments(content) {
  // Match any <!-- ... --> pattern (covers INLINE_IMAGE, FAILED markers, any others)
  const before = (content.match(/<!--[\s\S]*?-->/g) ?? []).length
  let cleaned = content.replace(/<!--[\s\S]*?-->/g, '')
  const stripped = before - (cleaned.match(/<!--[\s\S]*?-->/g) ?? []).length

  // Also strip {target="_blank" ...} link attribute suffixes — invalid in MDX,
  // causes "Could not parse expression with acorn" crash on every page render
  const attrsBefore = (cleaned.match(/\{[^}]*target[^}]*\}/g) ?? []).length
  if (attrsBefore > 0) {
    cleaned = cleaned.replace(/\{[^}]*target[^}]*\}/g, '')
    console.log(`⚡ Stripped ${attrsBefore} invalid link attribute(s) {target=...}`)
  }

  return { cleaned, stripped: stripped + attrsBefore }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const draftPath = process.argv[2]
  if (!draftPath) { console.error('Usage: node process-inline-images.mjs <draft.mdx>'); process.exit(1) }

  let content
  try { content = readFileSync(draftPath, 'utf8') }
  catch (err) { console.error(`✖ Cannot read "${draftPath}": ${err.message}`); process.exit(1) }

  const comments = findComments(content)

  if (comments.length === 0) {
    let noCommentContent = content
    // Auto-fix slug-as-title even when no image comments present
    const { content: titleFixed, fixed: titleWasFixed } = fixTitleIfSlug(noCommentContent, draftPath)
    if (titleWasFixed) noCommentContent = titleFixed
    // Strip any stray HTML comments
    const { cleaned, stripped } = stripAllHtmlComments(noCommentContent)
    if (stripped > 0 || titleWasFixed) {
      writeFileSync(draftPath, cleaned, 'utf8')
      console.log(`⚡ No INLINE_IMAGE comments. Fixed: title=${titleWasFixed}, HTML comments stripped=${stripped}. Draft is clean.`)
    } else {
      console.log('✓ No INLINE_IMAGE comments found — draft is already clean.')
    }
    process.exit(2)
  }

  console.log(`📸 Found ${comments.length} INLINE_IMAGE comment(s). Processing...\n`)

  let updated = content
  let succeeded = 0
  let removed = 0

  for (const comment of comments) {
    console.log(`[${comment.type}]`)
    try {
      let cdnUrl, alt

      if (comment.type === 'INLINE_IMAGE_REAL') {
        const { query, alt: a } = parseReal(comment.body)
        if (!query || !a) throw new Error(`Missing ${!query ? 'query' : 'alt'} in INLINE_IMAGE_REAL`)
        alt = a
        try {
          cdnUrl = await processReal(query, alt)
        } catch (searchErr) {
          console.log(`  ⚠ Search failed (${searchErr.message}) — falling back to CLAY`)
          cdnUrl = await processClay(`abstract visual representing: ${alt}`, alt)
        }
      } else {
        const { scene, alt: a } = parseClay(comment.body)
        if (!scene || !a) throw new Error(`Missing ${!scene ? 'scene' : 'alt'} in INLINE_IMAGE_CLAY`)
        alt = a
        cdnUrl = await processClay(scene, alt)
      }

      if (!cdnUrl?.startsWith('https://cdn.blink.new/')) throw new Error(`Invalid CDN URL: ${cdnUrl}`)

      const md = `![${alt}](${cdnUrl})`
      updated = updated.replace(comment.full, md)
      console.log(`  ✅ ${md.slice(0, 100)}\n`)
      succeeded++

    } catch (err) {
      // RECOVERY: remove the comment entirely — no image is better than a broken page
      console.error(`  ❌ ${err.message} — removing comment to keep draft publishable`)
      updated = updated.replace(comment.full, '')
      removed++
      console.log('')
    }
  }

  // ── FINAL SAFETY SWEEP ────────────────────────────────────────────────────
  // 1. Auto-fix title if it was left as the slug (common agent mistake)
  const { content: titleFixed, fixed: titleWasFixed } = fixTitleIfSlug(updated, draftPath)
  if (titleWasFixed) updated = titleFixed

  // 2. Strip any remaining HTML comments (malformed comments, edge cases, etc.)
  // This is the last line of defense — guarantees zero HTML comments in output.
  const { cleaned: finalContent, stripped } = stripAllHtmlComments(updated)
  if (stripped > 0) {
    console.log(`⚡ Final sweep stripped ${stripped} remaining HTML comment(s) (MDX safety net)`)
    updated = finalContent
  }

  // Write clean output
  try { writeFileSync(draftPath, updated, 'utf8') }
  catch (err) { console.error(`✖ Cannot write "${draftPath}": ${err.message}`); process.exit(1) }

  console.log('─'.repeat(50))
  console.log(`📊 ${succeeded} image(s) added  |  ${removed} removed (fallback)  |  ${stripped} HTML comment(s) swept`)
  console.log('✅ Draft is clean and safe to publish.')
  process.exit(0)
}

main().catch((err) => { console.error('Fatal:', err.message); process.exit(1) })
