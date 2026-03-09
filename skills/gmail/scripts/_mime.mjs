/**
 * MIME builder — shared by send.mjs, reply.mjs, draft.mjs
 * Supports plain text, HTML, and attachments (multipart)
 */
import fs from 'fs'
import path from 'path'

const boundary = () => `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`

export function buildRaw({ from, to, cc, bcc, subject, body, html, attachments = [], extraHeaders = {} }) {
  const b = boundary()
  const hasAttachments = attachments.length > 0
  const isMultipart = html || hasAttachments

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    ...(bcc ? [`Bcc: ${bcc}`] : []),
    `Subject: ${subject}`,
    ...Object.entries(extraHeaders).map(([k, v]) => `${k}: ${v}`),
  ]

  let bodyContent

  if (!isMultipart) {
    // Simple plain text
    headers.push('Content-Type: text/plain; charset=utf-8')
    bodyContent = body || ''
  } else if (html && !hasAttachments) {
    // Multipart/alternative (plain + html)
    const altBoundary = boundary()
    headers.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`)
    bodyContent = [
      `--${altBoundary}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body || stripHtml(html),
      '',
      `--${altBoundary}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
      '',
      `--${altBoundary}--`,
    ].join('\r\n')
  } else {
    // Multipart/mixed (with attachments)
    headers.push(`Content-Type: multipart/mixed; boundary="${b}"`)
    const parts = []

    if (html) {
      const altBoundary = boundary()
      parts.push([
        `--${b}`,
        `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
        '',
        `--${altBoundary}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        body || stripHtml(html),
        '',
        `--${altBoundary}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        html,
        '',
        `--${altBoundary}--`,
      ].join('\r\n'))
    } else {
      parts.push([`--${b}`, 'Content-Type: text/plain; charset=utf-8', '', body || ''].join('\r\n'))
    }

    for (const filePath of attachments) {
      const filename = path.basename(filePath)
      const content = fs.readFileSync(filePath).toString('base64')
      const mime = guessMime(filename)
      parts.push([
        `--${b}`,
        `Content-Type: ${mime}; name="${filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${filename}"`,
        '',
        content,
      ].join('\r\n'))
    }

    bodyContent = parts.join('\r\n') + `\r\n--${b}--`
  }

  const raw = headers.join('\r\n') + '\r\n\r\n' + bodyContent
  return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function guessMime(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const map = {
    pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg',
    jpeg: 'image/jpeg', gif: 'image/gif', txt: 'text/plain',
    csv: 'text/csv', json: 'application/json', zip: 'application/zip',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  return map[ext] || 'application/octet-stream'
}
