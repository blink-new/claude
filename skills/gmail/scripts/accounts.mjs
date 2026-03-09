/**
 * Account management — list, link, and unlink Gmail accounts
 *
 * Usage:
 *   node accounts.mjs --list
 *   node accounts.mjs --link                        # links as "default"
 *   node accounts.mjs --link --account=work         # links as named account
 *   node accounts.mjs --unlink --account=work
 */
import { google } from 'googleapis'
import fs from 'fs'
import http from 'http'
import { URL } from 'url'
import { execSync } from 'child_process'
import { CREDS_PATH, ACCOUNTS_DIR, accountDir, tokenPath, profilePath, parseArgs } from './_client.mjs'

const REDIRECT_URI = 'http://localhost:3333/callback'
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
]

const args = parseArgs()

// ── list ──────────────────────────────────────────────────────────────────────
if ('list' in args) {
  if (!fs.existsSync(ACCOUNTS_DIR)) { console.log('No accounts linked.'); process.exit(0) }
  const accounts = fs.readdirSync(ACCOUNTS_DIR).filter(name => fs.existsSync(tokenPath(name)))
  if (!accounts.length) { console.log('No accounts linked.'); process.exit(0) }

  console.log('\nLinked accounts:\n')
  for (const name of accounts) {
    const pPath = profilePath(name)
    const profile = fs.existsSync(pPath) ? JSON.parse(fs.readFileSync(pPath)) : null
    const email = profile?.email || '(unknown)'
    console.log(`  ${name === 'default' ? '★' : ' '} ${name.padEnd(20)} ${email}`)
  }
  console.log()
  process.exit(0)
}

// ── unlink ────────────────────────────────────────────────────────────────────
if ('unlink' in args) {
  const name = args.account
  if (!name) { console.error('ERROR: --account=<name> is required for --unlink'); process.exit(1) }
  const dir = accountDir(name)
  if (!fs.existsSync(dir)) { console.error(`ERROR: Account "${name}" not found`); process.exit(1) }
  fs.rmSync(dir, { recursive: true })
  console.log(`\nAccount "${name}" unlinked.\n`)
  process.exit(0)
}

// ── link ──────────────────────────────────────────────────────────────────────
if ('link' in args) {
  const name = args.account || 'default'

  if (!fs.existsSync(CREDS_PATH)) {
    console.error(`\nERROR: credentials.json not found at ${CREDS_PATH}`)
    console.error('1. Go to https://console.cloud.google.com')
    console.error('2. Enable Gmail API > Credentials > OAuth Client ID > Desktop App')
    console.error(`3. Download JSON > save as ${CREDS_PATH}\n`)
    process.exit(1)
  }

  const creds = JSON.parse(fs.readFileSync(CREDS_PATH))
  const { client_id, client_secret } = creds.installed || creds.web
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI)

  const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' })

  console.log(`\nLinking account: "${name}"`)
  console.log(`Auth URL (open if browser does not launch):\n\n${authUrl}\n`)
  console.log("Opening browser...")

  // Auto-open browser — works on macOS (open), Linux (xdg-open), Windows (start)
  const opener = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start'
    : 'xdg-open'
  try {
    execSync(`${opener} "${authUrl}"`)
  } catch {
    console.log('Could not auto-open browser. Open this URL manually:\n')
  }

  console.log('Waiting for Google callback on http://localhost:3333 ...\n')

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost:3333')
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) {
      res.end(`<h1>Auth failed: ${error}</h1>`)
      server.close()
      console.error(`\nAuth failed: ${error}\n`)
      process.exit(1)
    }
    if (!code) { res.end('Waiting...'); return }

    res.end('<h1>Auth successful! You can close this tab.</h1>')
    server.close()

    const { tokens } = await oAuth2Client.getToken(code).catch(err => {
      console.error(`\nFailed to get tokens: ${err.message}\n`)
      process.exit(1)
    })

    // Save token
    const dir = accountDir(name)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(tokenPath(name), JSON.stringify(tokens, null, 2))

    // Cache email for --list display
    oAuth2Client.setCredentials(tokens)
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' })
    fs.writeFileSync(profilePath(name), JSON.stringify({ email: profile.emailAddress }, null, 2))

    console.log(`\n✅ Account "${name}" linked: ${profile.emailAddress}`)
    console.log(`\nUsage: node list.mjs --account=${name}\n`)
  })

  server.listen(3333)
} else {
  console.error('ERROR: specify --list, --link, or --unlink')
  process.exit(1)
}
