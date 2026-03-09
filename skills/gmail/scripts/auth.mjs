/**
 * Gmail Auth — shortcut for linking the default account
 * Equivalent to: node accounts.mjs --link
 *
 * For named accounts use:
 *   node accounts.mjs --link --account=work
 */
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const accountsScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'accounts.mjs')
const account = process.argv.find(a => a.startsWith('--account=')) || ''
execSync(`node "${accountsScript}" --link ${account}`, { stdio: 'inherit' })
