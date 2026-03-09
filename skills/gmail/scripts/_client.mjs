/**
 * Shared Gmail auth client
 * Supports local files and cloud env vars (base64 JSON).
 *
 * Account resolution:
 *   credentials.json  → root (shared across all accounts)
 *   token.json        → accounts/<account>/token.json
 *   profile.json      → accounts/<account>/profile.json (email cache)
 *
 * Cloud env vars:
 *   GMAIL_CREDENTIALS  → base64-encoded credentials.json
 *   GMAIL_TOKEN        → base64-encoded token.json (always default account)
 */
import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

const SKILL_DIR = new URL('..', import.meta.url).pathname
export const CREDS_PATH = path.join(SKILL_DIR, 'credentials.json')
export const ACCOUNTS_DIR = path.join(SKILL_DIR, 'accounts')

export function accountDir(account) {
  return path.join(ACCOUNTS_DIR, account)
}

export function tokenPath(account) {
  return path.join(accountDir(account), 'token.json')
}

export function profilePath(account) {
  return path.join(accountDir(account), 'profile.json')
}

function loadJSON(filePath, envVar) {
  if (envVar && process.env[envVar]) {
    return JSON.parse(Buffer.from(process.env[envVar], 'base64').toString('utf-8'))
  }
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath))
  return null
}

export function getGmailClient(account = 'default') {
  const creds = loadJSON(CREDS_PATH, 'GMAIL_CREDENTIALS')
  if (!creds) {
    console.error(`ERROR: credentials.json not found at ${CREDS_PATH}`)
    console.error('Run: node ~/.cursor/skills/gmail/scripts/accounts.mjs --link')
    process.exit(1)
  }

  const tPath = tokenPath(account)
  const tokens = loadJSON(tPath, account === 'default' ? 'GMAIL_TOKEN' : null)
  if (!tokens) {
    console.error(`ERROR: Account "${account}" not linked.`)
    console.error(`Run: node ~/.cursor/skills/gmail/scripts/accounts.mjs --link --account=${account}`)
    process.exit(1)
  }

  const { client_id, client_secret } = creds.installed || creds.web
  const auth = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3333/callback')
  auth.setCredentials(tokens)

  auth.on('tokens', (newTokens) => {
    if (fs.existsSync(tPath)) {
      fs.writeFileSync(tPath, JSON.stringify({ ...tokens, ...newTokens }, null, 2))
    }
  })

  return google.gmail({ version: 'v1', auth })
}

export function decodeBody(part) {
  if (!part) return ''
  if (part.body?.data) return Buffer.from(part.body.data, 'base64').toString('utf-8')
  if (part.parts) {
    for (const p of part.parts) { const t = decodeBody(p); if (t) return t }
  }
  return ''
}

export function headerVal(headers, name) {
  return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
}

export function parseArgs(argv = process.argv.slice(2)) {
  return Object.fromEntries(
    argv.filter(a => a.startsWith('--'))
       .map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=')] })
  )
}
