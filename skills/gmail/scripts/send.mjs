/**
 * Send a new email
 * Usage:
 *   node send.mjs --to="a@b.com" --subject="Hi" --body="Text" [--account=work]
 *   node send.mjs --to="a@b.com" --subject="Hi" --html="<b>Bold</b>"
 *   node send.mjs --to="a@b.com" --subject="Hi" --body="Hi" --cc="c@d.com" --bcc="e@f.com"
 *   node send.mjs --to="a@b.com" --subject="Hi" --body="See attached" --attachments="/path/a.pdf,/path/b.png"
 */
import { getGmailClient, parseArgs } from './_client.mjs'
import { buildRaw } from './_mime.mjs'

const args = parseArgs()
const account = args.account || 'default'
const { to, subject, body, html, cc, bcc } = args
const attachments = args.attachments ? args.attachments.split(',').map(s => s.trim()) : []

if (!to || !subject || (!body && !html)) { console.error('ERROR: --to, --subject, and --body or --html are required'); process.exit(1) }

const gmail = getGmailClient(account)
const { data: profile } = await gmail.users.getProfile({ userId: 'me' })

const raw = buildRaw({ from: profile.emailAddress, to, cc, bcc, subject, body, html, attachments })
const { data: sent } = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } })

console.log(`\nEmail sent.`)
console.log(`  From:    ${profile.emailAddress}`)
console.log(`  To:      ${to}${cc ? `\n  Cc:      ${cc}` : ''}`)
console.log(`  Subject: ${subject}`)
console.log(`  ID:      ${sent.id}`)
if (attachments.length) console.log(`  Attachments: ${attachments.join(', ')}`)
console.log()
