/**
 * List inbox emails with pagination
 * Usage:
 *   node list.mjs [--account=work] [--max=50] [--label=UNREAD] [--next-page=<token>]
 */
import { getGmailClient, headerVal, parseArgs } from './_client.mjs'

const args = parseArgs()
const account = args.account || 'default'
const max = parseInt(args.max) || 20
const label = args.label || 'INBOX'
const pageToken = args['next-page']

const gmail = getGmailClient(account)
const { data } = await gmail.users.messages.list({
  userId: 'me', labelIds: [label], maxResults: max,
  ...(pageToken ? { pageToken } : {})
})

if (!data.messages?.length) { console.log('No messages found.'); process.exit(0) }

for (const { id } of data.messages) {
  const { data: msg } = await gmail.users.messages.get({ userId: 'me', id, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] })
  const h = msg.payload.headers
  const unread = msg.labelIds?.includes('UNREAD') ? '● ' : '  '
  console.log(`${unread}[${id}] ${headerVal(h,'Date').slice(0,16)}  ${headerVal(h,'From').slice(0,38).padEnd(38)}  ${headerVal(h,'Subject')}`)
}

if (data.nextPageToken) {
  console.log(`\nMore results. Next page:`)
  console.log(`  node list.mjs --account=${account} --label=${label} --max=${max} --next-page=${data.nextPageToken}`)
}
