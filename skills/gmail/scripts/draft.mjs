/**
 * Draft management
 * Usage:
 *   node draft.mjs --list [--account=work]
 *   node draft.mjs --create --to="a@b.com" --subject="Hi" --body="Text" [--account=work]
 *   node draft.mjs --create --reply-to=<messageId> --body="Reply text"
 *   node draft.mjs --read --id=<draftId>
 *   node draft.mjs --send --id=<draftId>
 *   node draft.mjs --delete --id=<draftId>
 */
import { getGmailClient, headerVal, decodeBody, parseArgs } from './_client.mjs'
import { buildRaw, stripHtml } from './_mime.mjs'

const args = parseArgs()
const account = args.account || 'default'
const gmail = getGmailClient(account)

if ('list' in args) {
  const { data } = await gmail.users.drafts.list({ userId: 'me', maxResults: 20 })
  if (!data.drafts?.length) { console.log('No drafts.'); process.exit(0) }
  for (const { id } of data.drafts) {
    const { data: d } = await gmail.users.drafts.get({ userId: 'me', id, format: 'metadata' })
    const h = d.message.payload.headers
    console.log(`[${id}]  To: ${headerVal(h,'To').slice(0,35).padEnd(35)}  ${headerVal(h,'Subject')}`)
  }
  process.exit(0)
}

if ('read' in args) {
  if (!args.id) { console.error('ERROR: --id is required'); process.exit(1) }
  const { data } = await gmail.users.drafts.get({ userId: 'me', id: args.id, format: 'full' })
  const h = data.message.payload.headers
  console.log(`Draft ID: ${data.id}`)
  console.log(`To:       ${headerVal(h,'To')}`)
  console.log(`Subject:  ${headerVal(h,'Subject')}`)
  console.log('─'.repeat(60))
  const bodyText = decodeBody(data.message.payload)
  console.log(bodyText.trimStart().startsWith('<') ? stripHtml(bodyText) : bodyText.trim())
  process.exit(0)
}

if ('send' in args) {
  if (!args.id) { console.error('ERROR: --id is required'); process.exit(1) }
  const { data } = await gmail.users.drafts.send({ userId: 'me', requestBody: { id: args.id } })
  console.log(`\nDraft sent. Message ID: ${data.id}\n`)
  process.exit(0)
}

if ('delete' in args) {
  if (!args.id) { console.error('ERROR: --id is required'); process.exit(1) }
  await gmail.users.drafts.delete({ userId: 'me', id: args.id })
  console.log(`\nDraft ${args.id} deleted.\n`)
  process.exit(0)
}

if ('create' in args) {
  const { to, subject, body, html, cc, bcc } = args
  const attachments = args.attachments ? args.attachments.split(',').map(s => s.trim()) : []
  const replyToId = args['reply-to']

  const { data: profile } = await gmail.users.getProfile({ userId: 'me' })
  let extraHeaders = {}
  let threadId
  let resolvedTo = to

  if (replyToId) {
    const { data: orig } = await gmail.users.messages.get({
      userId: 'me', id: replyToId, format: 'metadata',
      metadataHeaders: ['From', 'Reply-To', 'Subject', 'Message-ID', 'References']
    })
    const h = orig.payload.headers
    const origMessageId = headerVal(h, 'Message-ID')
    extraHeaders = {
      'In-Reply-To': origMessageId,
      'References': [headerVal(h, 'References'), origMessageId].filter(Boolean).join(' ')
    }
    threadId = orig.threadId
    if (!resolvedTo) resolvedTo = headerVal(h, 'Reply-To') || headerVal(h, 'From')
  }

  if (!resolvedTo) { console.error('ERROR: --to is required (or use --reply-to to auto-fill from original)'); process.exit(1) }
  if (!subject && !replyToId) { console.error('ERROR: --subject is required for new drafts'); process.exit(1) }

  const raw = buildRaw({ from: profile.emailAddress, to: resolvedTo, cc, bcc, subject, body, html, attachments, extraHeaders })
  const { data } = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw, ...(threadId ? { threadId } : {}) } }
  })

  console.log(`\nDraft created.`)
  console.log(`  ID:      ${data.id}`)
  console.log(`  To:      ${resolvedTo}`)
  console.log(`  Subject: ${subject || '(reply)'}`)
  console.log(`Send with: node draft.mjs --send --id=${data.id}\n`)
  process.exit(0)
}

console.error('ERROR: specify --list, --create, --read, --send, or --delete')
process.exit(1)
