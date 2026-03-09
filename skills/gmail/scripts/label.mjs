/**
 * Manage email labels
 * Usage:
 *   node label.mjs --list [--account=work]
 *   node label.mjs --id=<messageId> --mark-read [--account=work]
 *   node label.mjs --id=<messageId> --mark-unread
 *   node label.mjs --id=<messageId> --archive
 *   node label.mjs --id=<messageId> --trash
 *   node label.mjs --id=<messageId> --star
 *   node label.mjs --id=<messageId> --unstar
 *   node label.mjs --id=<messageId> --add-label=IMPORTANT
 *   node label.mjs --id=<messageId> --remove-label=SPAM
 */
import { getGmailClient, parseArgs } from './_client.mjs'

const args = parseArgs()
const account = args.account || 'default'
const gmail = getGmailClient(account)

if ('list' in args) {
  const { data } = await gmail.users.labels.list({ userId: 'me' })
  console.log('\nAvailable labels:')
  data.labels.sort((a, b) => a.name.localeCompare(b.name)).forEach(l => console.log(`  ${l.id.padEnd(30)} ${l.name}`))
  console.log()
  process.exit(0)
}

const id = args.id
if (!id) { console.error('ERROR: --id is required'); process.exit(1) }

const addLabels = []
const removeLabels = []

if ('mark-read' in args)   removeLabels.push('UNREAD')
if ('mark-unread' in args) addLabels.push('UNREAD')
if ('archive' in args)     removeLabels.push('INBOX')
if ('trash' in args)       { addLabels.push('TRASH'); removeLabels.push('INBOX') }
if ('star' in args)        addLabels.push('STARRED')
if ('unstar' in args)      removeLabels.push('STARRED')
if (args['add-label'])     addLabels.push(args['add-label'])
if (args['remove-label'])  removeLabels.push(args['remove-label'])

if (!addLabels.length && !removeLabels.length) {
  console.error('ERROR: specify --mark-read, --mark-unread, --archive, --trash, --star, --unstar, --add-label, or --remove-label')
  process.exit(1)
}

await gmail.users.messages.modify({ userId: 'me', id, requestBody: { addLabelIds: addLabels, removeLabelIds: removeLabels } })

const actions = [...addLabels.map(l => `+${l}`), ...removeLabels.map(l => `-${l}`)]
console.log(`\nUpdated ${id}: ${actions.join(', ')}\n`)
