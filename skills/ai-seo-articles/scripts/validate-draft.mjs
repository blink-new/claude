#!/usr/bin/env node
/**
 * validate-draft.mjs
 *
 * Validates a draft MDX file before publishing. Runs every check the publisher
 * would otherwise do manually — plus image counting, frontmatter audit, and
 * MDX safety checks.
 *
 * Usage:
 *   node .cursor/skills/ai-seo-articles/scripts/validate-draft.mjs <draft.mdx>
 *
 * Exit codes:
 *   0 — all checks PASS (safe to publish)
 *   1 — one or more FAIL checks (do NOT publish)
 *   2 — warnings only (review recommended, but can publish)
 */

import { readFileSync } from 'fs'

const VALID_CATEGORIES = new Set(['Tutorial','Guide','Comparison','Security','Use Cases','Product','Engineering'])
const REQUIRED_FRONTMATTER = ['title','description','category','tags','image_url','sort_order','status']
const BANNED_COMPONENTS = ['<FAQ','<FAQItem','<FAQGroup','<Tabs>','<Tab ']

const RESET = '\x1b[0m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'

const path = process.argv[2]
if (!path) { console.error('Usage: node validate-draft.mjs <draft.mdx>'); process.exit(1) }

let raw
try { raw = readFileSync(path, 'utf8') }
catch (e) { console.error(`Cannot read "${path}": ${e.message}`); process.exit(1) }

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Split raw content into frontmatter string and body string */
function splitFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/m)
  if (!match) return { fm: '', body: content }
  return { fm: match[1], body: match[2] }
}

/** Parse frontmatter key:value pairs (simple, not full YAML) */
function parseFrontmatter(fm) {
  const obj = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/)
    if (m) obj[m[1]] = m[2].trim().replace(/^"|"$/g, '')
  }
  return obj
}

/** Return positions of all triple-backtick fences in the body */
function codeFenceRanges(body) {
  const ranges = []
  const re = /```[\s\S]*?```/g
  let m
  while ((m = re.exec(body)) !== null)
    ranges.push([m.index, m.index + m[0].length])
  return ranges
}

/** True if pos is inside any of the fence ranges */
function inFence(pos, ranges) {
  return ranges.some(([s, e]) => pos >= s && pos < e)
}

/** Count occurrences of needle in haystack, excluding code fences */
function countOutsideFences(haystack, needle, fences) {
  let count = 0, idx = 0
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    if (!inFence(idx, fences)) count++
    idx += needle.length
  }
  return count
}

/** Rough word count (strips code blocks and MDX tags) */
function wordCount(body) {
  return body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/#{1,6}\s/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0).length
}

/** Count digit-containing tokens (rough statistic proxy) */
function statisticCount(body) {
  const clean = body.replace(/```[\s\S]*?```/g, '')
  const matches = clean.match(/\b\d[\d,.%+×x$£€]*\b/g) ?? []
  return new Set(matches).size  // dedupe
}

// ─── Run checks ──────────────────────────────────────────────────────────────

const { fm, body } = splitFrontmatter(raw)
const fmObj = parseFrontmatter(fm)
const fences = codeFenceRanges(body)

const results = []  // { status: 'PASS'|'WARN'|'FAIL', label, detail }

function pass(label, detail = '') { results.push({ status: 'PASS', label, detail }) }
function warn(label, detail = '') { results.push({ status: 'WARN', label, detail }) }
function fail(label, detail = '') { results.push({ status: 'FAIL', label, detail }) }

// 1. Frontmatter: all required fields present
const missingFm = REQUIRED_FRONTMATTER.filter(k => !(k in fmObj))
missingFm.length === 0
  ? pass('Frontmatter complete', REQUIRED_FRONTMATTER.join(', '))
  : fail('Frontmatter incomplete', `Missing: ${missingFm.join(', ')}`)

// 2. image_url not a placeholder and not ephemeral
if (fmObj.image_url === 'PENDING_CDN_UPLOAD') {
  fail('Hero image not generated', 'image_url is still PENDING_CDN_UPLOAD — generate before publishing')
} else if (fmObj.image_url?.includes('/ai-generated/')) {
  fail('Hero image uses ephemeral URL', 'image_url contains cdn.blink.new/ai-generated/ — this expires in days. Re-host via cms_upload_asset → use the cms/mcp-uploads/ URL instead.')
} else {
  pass('Hero image present', fmObj.image_url?.slice(0, 60) || '(set)')
}

// 3. sort_order is 0 (not missing)
'sort_order' in fmObj
  ? pass('sort_order present', fmObj.sort_order)
  : fail('sort_order missing', 'Add sort_order: 0 to frontmatter')

// 4. category is valid
VALID_CATEGORIES.has(fmObj.category)
  ? pass('Category valid', fmObj.category)
  : fail('Category invalid', `"${fmObj.category}" — must be one of: ${[...VALID_CATEGORIES].join(' | ')}`)

// 5. No # SCORE: line (editor approval marker must be stripped before publishing)
raw.includes('# SCORE:')
  ? fail('Score marker not stripped', 'Remove "# SCORE: N/110 — APPROVED" line before publishing')
  : pass('No score marker', '')

// 6. Unprocessed INLINE_IMAGE slots (process-inline-images.mjs not run yet)
const unprocessedSlots = countOutsideFences(body, '<!-- INLINE_IMAGE_', fences)
unprocessedSlots > 0
  ? fail('Unprocessed image slots', `${unprocessedSlots} INLINE_IMAGE comment(s) — run process-inline-images.mjs first`)
  : pass('Image slots processed', 'No unprocessed INLINE_IMAGE comments')

// 7. Inline image count (processed CDN images in body)
const inlineImageCount = (body.match(/!\[.*?\]\(https:\/\/cdn\.blink\.new\/cms\/mcp-uploads\//g) ?? []).length
if (inlineImageCount >= 2) pass(`Inline images: ${inlineImageCount}`, '2-3 is the target range ✅')
else if (inlineImageCount === 1) warn(`Inline images: ${inlineImageCount}`, 'Only 1 inline image — consider adding a 2nd for longer articles')
else warn(`Inline images: ${inlineImageCount}`, 'No inline images — will score 0/10 on Images rubric (max 100/110)')

// 7b. Detect ephemeral ai-generated/ URLs embedded in body images
const ephemeralInBody = (body.match(/!\[.*?\]\(https:\/\/cdn\.blink\.new\/ai-generated\//g) ?? []).length
if (ephemeralInBody > 0) {
  fail(`Ephemeral image URLs in body: ${ephemeralInBody}`,
    'Body contains cdn.blink.new/ai-generated/ URLs — these expire within days and will break. ' +
    'Re-generate each via generate_image then immediately re-host via cms_upload_asset → use cms/mcp-uploads/ URL.')
} else {
  pass('No ephemeral image URLs', 'All body images on cms/mcp-uploads/ (permanent)')
}

// 8. Stray HTML comments (outside code fences)
const strayComments = countOutsideFences(body, '<!--', fences)
strayComments > 0
  ? fail('Stray HTML comments', `${strayComments} HTML comment(s) outside code blocks — will crash the MDX page`)
  : pass('No stray HTML comments', '')

// 9. No {target= link attributes (MDX acorn crash)
const targetAttrs = (body.match(/\{target=/g) ?? []).length
targetAttrs > 0
  ? fail('{target= attributes found', `${targetAttrs} occurrence(s) — remove these; plain [text](url) is correct`)
  : pass('No {target= attributes', '')

// 10. No banned MDX components
const banned = BANNED_COMPONENTS.filter(comp => body.includes(comp))
banned.length > 0
  ? fail('Banned MDX components', `${banned.join(', ')} — use <AccordionGroup>/<Accordion> for FAQs`)
  : pass('MDX components safe', '')

// 11. No ## Conclusion section
new RegExp('^## conclusion$', 'im').test(body)
  ? fail('## Conclusion section found', 'Replace with a specific next action, command, or FAQ')
  : pass('No ## Conclusion', '')

// 12. Word count
const words = wordCount(body)
if (words >= 800)      pass(`Word count: ~${words}`, '')
else if (words >= 500) warn(`Word count: ~${words}`, 'Consider expanding — competitor bar is usually 800-2000 words')
else                   warn(`Word count: ~${words}`, 'Very short — ensure this fully answers the reader\'s question')

// 13. Statistics count (rough)
const stats = statisticCount(body)
if (stats >= 4)      pass(`Statistics: ~${stats} distinct numbers`, 'GEO signals look good')
else if (stats >= 2) warn(`Statistics: ~${stats} distinct numbers`, 'Aim for 3-5+ specific numbers for GEO signals')
else                 warn(`Statistics: ~${stats} distinct numbers`, 'Very few statistics — add specific numbers for E-E-A-T and GEO')

// 14. Internal links to blink.new
const internalLinks = (body.match(/\]\(https?:\/\/blink\.new\//g) ?? []).length
if (internalLinks >= 2) pass(`Internal links: ${internalLinks}`, 'Good (target: 2-4)')
else                    warn(`Internal links: ${internalLinks}`, `Low — add more links to blink.new/blog/* articles (target: 2-4)`)

// 15. External links count
const externalLinks = (body.match(/\]\(https?:\/\/(?!blink\.new)[a-z]/g) ?? []).length
if (externalLinks >= 2 && externalLinks <= 6) pass(`External links: ${externalLinks}`, 'Good (target: 2-4)')
else if (externalLinks === 1)                 warn(`External links: ${externalLinks}`, 'Add 1-3 more citations to authoritative sources')
else if (externalLinks === 0)                 warn(`External links: ${externalLinks}`, 'No external citations — add 2-4 links to authoritative sources')
else                                          warn(`External links: ${externalLinks}`, 'Many external links — keep to 2-4 high-quality citations')

// ─── Print results ───────────────────────────────────────────────────────────

const slug = path.replace(/^.*\//, '').replace(/\.mdx$/, '')
console.log(`\n${BOLD}validate-draft — ${slug}${RESET}\n`)

const maxLabel = Math.max(...results.map(r => r.label.length))
let failures = 0, warnings = 0

for (const { status, label, detail } of results) {
  let color, icon
  if (status === 'PASS')      { color = GREEN;  icon = '✅'; }
  else if (status === 'WARN') { color = YELLOW; icon = '⚠️ '; warnings++ }
  else                        { color = RED;    icon = '❌'; failures++ }

  const padded = label.padEnd(maxLabel)
  const det = detail ? `${DIM}  ${detail}${RESET}` : ''
  console.log(`  ${icon}  ${color}${padded}${RESET}${det}`)
}

console.log()
if (failures > 0) {
  console.log(`${RED}${BOLD}FAIL${RESET} — ${failures} issue(s) must be fixed before publishing`)
  process.exit(1)
} else if (warnings > 0) {
  console.log(`${YELLOW}${BOLD}WARN${RESET} — ${warnings} warning(s). Review before publishing. No blockers.`)
  process.exit(2)
} else {
  console.log(`${GREEN}${BOLD}PASS${RESET} — All checks passed. Safe to publish.`)
  process.exit(0)
}
