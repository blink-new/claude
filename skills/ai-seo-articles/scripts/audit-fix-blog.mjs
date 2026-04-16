#!/usr/bin/env node
/**
 * audit-fix-blog.mjs — Bulk audit and auto-fix all published blog articles
 *
 * Scans every blog article in the CMS for MDX-breaking patterns:
 *   1. <!-- INLINE_IMAGE_* --> HTML comments (crash entire page)
 *   2. <!-- any HTML comment --> (MDX v2+ does not support them)
 *   3. PENDING_CDN_UPLOAD in image_url (broken hero image)
 *   4. {target="_blank"} link attributes (MDX expression parse error)
 *
 * Modes:
 *   --audit       (default) List all broken articles with issue counts
 *   --fix         Auto-fix: generate images for INLINE_IMAGE comments, strip
 *                 remaining HTML comments, replace PENDING_CDN_UPLOAD, publish
 *   --fix-strip   Fast fix: strip all HTML comments without generating images
 *
 * Usage:
 *   node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs
 *   node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs --fix
 *   node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs --fix-strip
 *
 * Exit codes: 0 = clean/fixed, 1 = fatal, 2 = issues found (audit mode)
 */

import https from 'https'

const MCP_BASE = 'https://blink-mcp-production.up.railway.app'
const BEARER   = 'blnk_60b83e763f3cc1a3a5093566ec8d4422157a1a49c94bf9ad'
const TIMEOUT  = 90_000

const CHARACTER_ANCHOR =
  'Same clay 3D character: young developer, brown medium-length hair, big expressive eyes, ' +
  '3D clay animation render style soft matte tactile finish, wearing their signature bright ' +
  'electric-blue hoodie with white lightning bolt logo on chest.'

// ─── MCP HTTP Client ────────────────────────────────────────────────────────

function mcpRequest(tool, args) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      jsonrpc: '2.0', id: Math.random().toString(36).slice(2),
      method: 'tools/call', params: { name: tool, arguments: args },
    })
    const timer = setTimeout(() => reject(new Error(`${tool} timed out`)), TIMEOUT)
    const req = https.request({
      hostname: new URL(MCP_BASE).hostname, port: 443, path: '/mcp', method: 'POST',
      headers: {
        Authorization: `Bearer ${BEARER}`, 'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream', 'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = ''
      res.on('data', c => (raw += c))
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
      res.on('error', e => { clearTimeout(timer); reject(e) })
    })
    req.on('error', e => { clearTimeout(timer); reject(e) })
    req.write(body); req.end()
  })
}

function extractText(r) {
  return r?.result?.content?.[0]?.text || r?.result?.text || JSON.stringify(r)
}

// ─── Detection ──────────────────────────────────────────────────────────────

function detectIssues(content) {
  const issues = []
  const inlineImages = content.match(/<!--\s*INLINE_IMAGE_(REAL|CLAY):/g)
  if (inlineImages) issues.push({ id: 'inline_image', count: inlineImages.length, severity: 'critical', label: 'INLINE_IMAGE comment' })

  const htmlComments = content.match(/<!--[\s\S]*?-->/g)
  const nonInlineComments = (htmlComments?.length || 0) - (inlineImages?.length || 0)
  if (nonInlineComments > 0) issues.push({ id: 'html_comment', count: nonInlineComments, severity: 'critical', label: 'Other HTML comment' })

  if (/PENDING_CDN_UPLOAD/.test(content)) issues.push({ id: 'pending_cdn', count: 1, severity: 'high', label: 'PENDING_CDN_UPLOAD' })

  const targetAttrs = content.match(/\{[^}]*target[^}]*\}/g)
  if (targetAttrs) issues.push({ id: 'target_blank', count: targetAttrs.length, severity: 'critical', label: '{target=...} attribute' })

  // Check if any inline image duplicates the hero image
  const heroMatch = content.match(/^image_url:\s*"([^"]+)"/m)
  if (heroMatch?.[1] && heroMatch[1] !== '' && heroMatch[1] !== 'PENDING_CDN_UPLOAD') {
    const heroUrl = heroMatch[1]
    const inlineImages = [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)]
    const dupes = inlineImages.filter(m => m[1] === heroUrl)
    if (dupes.length > 0) issues.push({ id: 'hero_dupe', count: dupes.length, severity: 'high', label: 'Inline image duplicates hero' })
  }

  return issues
}

// ─── Image Generation + CDN ─────────────────────────────────────────────────

async function uploadToCDN(remoteUrl, filename, altText) {
  const result = await mcpRequest('cms_upload_asset', { url: remoteUrl, filename, alt_text: altText })
  const text = extractText(result)
  const cdnMatch = text.match(/https:\/\/cdn\.blink\.new\/[^\s"']+/)
  if (cdnMatch) return cdnMatch[0]
  try {
    const parsed = JSON.parse(text)
    if (parsed.public_url?.startsWith('https://cdn.blink.new/')) return parsed.public_url
  } catch {}
  throw new Error(`CDN upload failed`)
}

async function generateClayImage(scene, alt) {
  const prompt = `${CHARACTER_ANCHOR} NEW SCENE: ${scene}. Expression: enthusiastic. Background: bright and warm. Centered composition, full frame. No text. 16:9.`
  const result = await mcpRequest('generate_image', { prompt, aspect_ratio: '16:9', output_format: 'webp' })
  const text = extractText(result)
  const urlMatch = text.match(/https?:\/\/[^\s"'>]+\.(?:webp|png|jpg|jpeg)(?:\?[^\s"'>]*)?/i)
  if (!urlMatch) throw new Error('No image URL in response')
  const slug = scene.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  return uploadToCDN(urlMatch[0], `inline-clay-${slug}.webp`, alt)
}

// ─── Fix Logic ──────────────────────────────────────────────────────────────

async function fixContent(content, mode) {
  let updated = content
  let fixes = 0

  if (mode === 'fix') {
    // Process INLINE_IMAGE comments — generate real images
    const regex = /<!--\s*(INLINE_IMAGE_REAL|INLINE_IMAGE_CLAY):([\s\S]*?)-->/g
    let match
    const replacements = []
    while ((match = regex.exec(content)) !== null) {
      const full = match[0]
      const body = match[2].trim()
      const pipeIdx = body.lastIndexOf('|')
      const scene = pipeIdx >= 0 ? body.slice(0, pipeIdx).trim() : body.trim()
      const alt = body.match(/alt\s*=\s*"([^"]*)"/)?.[1]?.trim() || scene.slice(0, 80)
      replacements.push({ full, scene, alt })
    }

    for (const r of replacements) {
      try {
        console.log(`    🎨 ${r.scene.slice(0, 55)}...`)
        const cdnUrl = await generateClayImage(r.scene, r.alt)
        updated = updated.replace(r.full, `![${r.alt}](${cdnUrl})`)
        fixes++
        console.log(`    ✅ Image generated`)
      } catch (err) {
        console.log(`    ❌ Failed — stripping: ${err.message}`)
        updated = updated.replace(r.full, '')
        fixes++
      }
    }
  }

  // Strip ALL remaining HTML comments
  const commentsBefore = (updated.match(/<!--[\s\S]*?-->/g) || []).length
  updated = updated.replace(/<!--[\s\S]*?-->/g, '')
  fixes += commentsBefore

  // Strip {target="_blank"} attributes
  const attrsBefore = (updated.match(/\{[^}]*target[^}]*\}/g) || []).length
  updated = updated.replace(/\{[^}]*target[^}]*\}/g, '')
  fixes += attrsBefore

  // Fix PENDING_CDN_UPLOAD
  if (updated.includes('PENDING_CDN_UPLOAD')) {
    const title = updated.match(/^title:\s*"([^"]*)"/m)?.[1] || 'Blog article'
    if (mode === 'fix') {
      try {
        console.log(`    🎨 Generating hero for: ${title.slice(0, 50)}`)
        const cdnUrl = await generateClayImage(`character related to: ${title}`, title)
        updated = updated.replace(/PENDING_CDN_UPLOAD/g, cdnUrl)
        fixes++
      } catch {
        updated = updated.replace(/image_url:\s*"PENDING_CDN_UPLOAD"/, 'image_url: ""')
        fixes++
      }
    } else {
      updated = updated.replace(/image_url:\s*"PENDING_CDN_UPLOAD"/, 'image_url: ""')
      fixes++
    }
  }

  return { updated, fixes }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const mode = process.argv.includes('--fix') ? 'fix'
             : process.argv.includes('--fix-strip') ? 'fix-strip'
             : 'audit'

  console.log(`\n🔍 Blog Health Audit (mode: ${mode})\n${'─'.repeat(50)}`)

  // List all blog files
  const listResult = await mcpRequest('cms_list_dir', { path: 'blog', recursive: false })
  const listText = extractText(listResult)

  let files = []
  try {
    const parsed = JSON.parse(listText)
    const items = parsed.files || parsed.entries || parsed.children || parsed
    if (Array.isArray(items)) {
      files = items
        .map(f => typeof f === 'string' ? f : (f.path || f.name))
        .filter(f => f?.endsWith('.mdx'))
        .map(f => f.startsWith('blog/') ? f : `blog/${f}`)
    }
  } catch {
    const mdxFiles = listText.match(/[\w-]+\.mdx/g)
    files = (mdxFiles || []).map(f => `blog/${f}`)
  }

  if (!files.length) {
    console.log('⚠ No blog files found. Trying cms_grep fallback...')
    // Fallback: use grep to find articles with issues
    for (const query of ['INLINE_IMAGE', 'PENDING_CDN_UPLOAD', 'target="_blank"']) {
      const grepResult = await mcpRequest('cms_grep', { query, type: 'blog' })
      const grepText = extractText(grepResult)
      const paths = grepText.match(/blog\/[\w-]+\.mdx/g) || []
      for (const p of paths) if (!files.includes(p)) files.push(p)
    }
    if (!files.length) { console.log('✅ No issues found via grep.'); process.exit(0) }
    console.log(`Found ${files.length} files via grep.\n`)
  } else {
    console.log(`📂 Found ${files.length} blog articles\n`)
  }

  const broken = []
  const fixed = []
  const errors = []
  let clean = 0

  for (const filePath of files) {
    const readResult = await mcpRequest('cms_read_file', { path: filePath })
    const content = extractText(readResult)
    if (!content || content.length < 50) continue

    const issues = detectIssues(content)
    if (issues.length === 0) { clean++; continue }

    const title = content.match(/^title:\s*"([^"]*)"/m)?.[1] || filePath
    broken.push({ path: filePath, title, issues })

    if (mode === 'audit') {
      console.log(`❌ ${filePath}`)
      console.log(`   "${title}"`)
      for (const i of issues) console.log(`   ${i.severity === 'critical' ? '🔴' : '🟡'} ${i.count}× ${i.label}`)
      console.log()
      continue
    }

    console.log(`🔧 ${filePath}`)
    console.log(`   "${title}"`)
    try {
      const { updated, fixes: fixCount } = await fixContent(content, mode)
      if (fixCount > 0 && updated !== content) {
        const writeResult = await mcpRequest('cms_write_file', { path: filePath, content: updated, publish: true })
        const writeText = extractText(writeResult)
        if (writeText.includes('published') || writeText.includes('success')) {
          fixed.push({ path: filePath, fixCount })
          console.log(`   ✅ Published (${fixCount} fixes)\n`)
        } else {
          errors.push({ path: filePath, error: 'Publish may have failed' })
          console.log(`   ⚠ Written but publish status unclear\n`)
        }
      }
    } catch (err) {
      errors.push({ path: filePath, error: err.message })
      console.log(`   ❌ ${err.message}\n`)
    }
  }

  console.log('─'.repeat(50))
  console.log(`\n📊 RESULTS`)
  console.log(`   Scanned: ${files.length}`)
  console.log(`   Clean: ${clean}`)
  console.log(`   Broken: ${broken.length}`)
  if (mode !== 'audit') {
    console.log(`   Fixed: ${fixed.length}`)
    if (errors.length) console.log(`   Errors: ${errors.length}`)
  }

  if (broken.length > 0 && mode === 'audit') {
    console.log(`\n🚨 ${broken.length} broken article(s). Fix with:`)
    console.log(`   node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs --fix-strip  # fast: strip comments`)
    console.log(`   node .cursor/skills/ai-seo-articles/scripts/audit-fix-blog.mjs --fix        # full: generate images + strip\n`)
    process.exit(2)
  }

  console.log()
  process.exit(0)
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
