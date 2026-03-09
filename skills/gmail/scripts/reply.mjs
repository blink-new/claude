/**
 * Reply to an email thread
 * Usage:
 *   node reply.mjs --message-id=<id> --body="Text" [--account=work]
 *   node reply.mjs --message-id=<id> --html="<b>Hi</b>"
 *   node reply.mjs --message-id=<id> --body="Hi" --cc="c@d.com" --attachments="/path/file.pdf"
 */
import { getGmailClient, headerVal, parseArgs } from './_client.mjs'
import { buildRaw } from './_mime.mjs'

const args = parseArgs()
const account = args.account || 'default'
const messageId = args['message-id']
const { body, html, cc, bcc } = args
const attachments = args.attachments ? args.attachments.split(',').map(s => s.trim()) : []

if (!messageId || (!body && !html)) { console.error('ERROR: --message-id and --body or --html are required'); process.exit(1) }

const gmail = getGmailClient(account)

const { data: orig } = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'metadata', metadataHeaders: ['From','To','Subject','Message-ID','References','Reply-To'] })
const h = orig.payload.headers
const origMessageId = headerVal(h, 'Message-ID')
const references = [headerVal(h, 'References'), origMessageId].filter(Boolean).join(' ')
const subject = headerVal(h, 'Subject')
const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`
const replyTo = headerVal(h, 'Reply-To') || headerVal(h, 'From')

const { data: profile } = await gmail.users.getProfile({ userId: 'me' })

const raw = buildRaw({
  from: profile.emailAddress, to: replyTo, cc, bcc,
  subject: replySubject, body, html, attachments,
  extraHeaders: { 'In-Reply-To': origMessageId, 'References': references }
})

const { data: sent } = await gmail.users.messages.send({
  userId: 'me', requestBody: { raw, threadId: orig.threadId }
})

console.log(`\nReply sent.`)
console.log(`  From:    ${profile.emailAddress}`)
console.log(`  To:      ${replyTo}`)
console.log(`  Subject: ${replySubject}`)
console.log(`  ID:      ${sent.id}  Thread: ${sent.threadId}`)
if (attachments.length) console.log(`  Attachments: ${attachments.join(', ')}`)
console.log()
