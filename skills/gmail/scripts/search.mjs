/**
 * Search emails with pagination
 * Usage:
 *   node search.mjs --query="from:stripe" [--account=work] [--max=20] [--next-page=<token>]
 */
import { getGmailClient, headerVal, parseArgs } from './_client.mjs'

const args = parseArgs()
const account = args.account || 'default'
const query = args.query
const max = parseInt(args.max) || 20
const pageToken = args['next-page']

if (!query) { console.error('ERROR: --query is required'); process.exit(1) }

const gmail = getGmailClient(account)
const { data } = await gmail.users.messages.list({
  userId: 'me', q: query, maxResults: max,
  ...(pageToken ? { pageToken } : {})
})

if (!data.messages?.length) { console.log('No messages found.'); process.exit(0) }
console.log(`Found ${data.messages.length} message(s) for: ${query}\n`)

for (const { id } of data.messages) {
  const { data: msg } = await gmail.users.messages.get({ userId: 'me', id, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] })
  const h = msg.payload.headers
  const unread = msg.labelIds?.includes('UNREAD') ? '● ' : '  '
  console.log(`${unread}[${id}] ${headerVal(h,'Date').slice(0,16)}  ${headerVal(h,'From').slice(0,38).padEnd(38)}  ${headerVal(h,'Subject')}`)
}

if (data.nextPageToken) {
  console.log(`\nMore results. Next page:`)
  console.log(`  node search.mjs --account=${account} --query="${query}" --max=${max} --next-page=${data.nextPageToken}`)
}
