/**
 * Read a message or full thread
 * Usage:
 *   node read.mjs --id=<messageId> [--account=work]
 *   node read.mjs --id=<threadId> --thread [--account=work]
 *   node read.mjs --id=<messageId> --raw
 */
import { getGmailClient, decodeBody, headerVal, parseArgs } from './_client.mjs'
import { stripHtml } from './_mime.mjs'

const args = parseArgs()
const account = args.account || 'default'
const id = args.id
const isThread = 'thread' in args
const rawMode = 'raw' in args

if (!id) { console.error('ERROR: --id is required'); process.exit(1) }

const gmail = getGmailClient(account)

function extractBody(payload) {
  const findPart = (part, mimeType) => {
    if (part.mimeType === mimeType && part.body?.data) return part
    if (part.parts) { for (const p of part.parts) { const f = findPart(p, mimeType); if (f) return f } }
    return null
  }
  const plain = findPart(payload, 'text/plain')
  if (plain) return Buffer.from(plain.body.data, 'base64').toString('utf-8')
  const html = findPart(payload, 'text/html')
  if (html) {
    const decoded = Buffer.from(html.body.data, 'base64').toString('utf-8')
    return rawMode ? decoded : stripHtml(decoded)
  }
  return decodeBody(payload)
}

function listAttachments(payload, parts = []) {
  if (payload.filename && payload.body?.attachmentId) parts.push(`  📎 ${payload.filename} (${payload.mimeType})`)
  if (payload.parts) payload.parts.forEach(p => listAttachments(p, parts))
  return parts
}

function printMessage(msg) {
  const h = msg.payload.headers
  const labels = msg.labelIds?.filter(l => !['INBOX','UNREAD','IMPORTANT','CATEGORY_PERSONAL'].includes(l)) || []
  console.log(`From:    ${headerVal(h,'From')}`)
  console.log(`To:      ${headerVal(h,'To')}`)
  if (headerVal(h,'Cc')) console.log(`Cc:      ${headerVal(h,'Cc')}`)
  console.log(`Date:    ${headerVal(h,'Date')}`)
  console.log(`Subject: ${headerVal(h,'Subject')}`)
  if (labels.length) console.log(`Labels:  ${labels.join(', ')}`)
  const attachments = listAttachments(msg.payload)
  if (attachments.length) { console.log('Attachments:'); attachments.forEach(a => console.log(a)) }
  console.log('─'.repeat(60))
  console.log(extractBody(msg.payload).trim())
}

if (isThread) {
  const { data } = await gmail.users.threads.get({ userId: 'me', id, format: 'full' })
  console.log(`Thread: ${id}  (${data.messages.length} messages)\n${'─'.repeat(60)}`)
  for (const msg of data.messages) { console.log(); printMessage(msg) }
} else {
  const { data: msg } = await gmail.users.messages.get({ userId: 'me', id, format: 'full' })
  console.log(`Thread ID: ${msg.threadId}`)
  printMessage(msg)
}
