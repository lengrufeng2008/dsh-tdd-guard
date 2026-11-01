import { chmod, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { join, resolve } from 'node:path'

const MARKER = '# managed by dsh-tdd-guard'
const HOOK = `#!/bin/sh
${MARKER}
# Run the project's test script before committing. Disable with: dsh-tdd-guard uninstall
npm test
`

export async function projectRoot(input) {
  return resolve(input || process.cwd())
}
export async function hooksDir(root) {
  const dir = join(root, '.git', 'hooks')
  await mkdir(dir, { recursive: true })
  return dir
}
export async function installHook(root, { force = false } = {}) {
  const dir = await hooksDir(root)
  const file = join(dir, 'pre-commit')
  const existing = await readFile(file, 'utf8').catch(() => null)
  if (existing && !existing.includes(MARKER) && !force) throw new Error('a pre-commit hook already exists; pass --force to replace it')
  await writeFile(file, HOOK, { mode: 0o755 })
  await chmod(file, 0o755)
  return { root, file, installed: true }
}
export async function uninstallHook(root) {
  const file = join(await hooksDir(root), 'pre-commit')
  const existing = await readFile(file, 'utf8').catch(() => null)
  if (!existing) return { root, file, removed: false }
  if (!existing.includes(MARKER)) throw new Error('pre-commit was not installed by dsh-tdd-guard; refusing to remove it')
  await rm(file)
  return { root, file, removed: true }
}
export async function hookStatus(root) {
  const file = join(root, '.git', 'hooks', 'pre-commit')
  const existing = await readFile(file, 'utf8').catch(() => null)
  return { root, file, installed: Boolean(existing?.includes(MARKER)), exists: Boolean(existing) }
}
export async function testCommand(root) {
  const text = await readFile(join(root, 'package.json'), 'utf8').catch(() => null)
  if (!text) throw new Error('package.json not found')
  const pkg = JSON.parse(text)
  const script = pkg.scripts?.test
  if (!script) throw new Error('package.json has no test script')
  return script
}
export async function runTests(root, { timeoutMs = 120_000 } = {}) {
  await testCommand(root)
  return new Promise((resolvePromise) => {
    const child = spawn('npm', ['test'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    const timer = setTimeout(() => { child.kill('SIGTERM'); output += '\n[timeout]' }, timeoutMs)
    child.stdout.on('data', (chunk) => { output = (output + chunk.toString()).slice(-20_000) })
    child.stderr.on('data', (chunk) => { output = (output + chunk.toString()).slice(-20_000) })
    child.on('error', (error) => { clearTimeout(timer); resolvePromise({ ok: false, code: null, output: error.message }) })
    child.on('exit', (code) => { clearTimeout(timer); resolvePromise({ ok: code === 0, code, output }) })
  })
}
export function renderCheck(result) {
  return `${result.ok ? 'PASS' : 'FAIL'} — npm test${result.code === null ? '' : ` (exit ${result.code})`}\n\n\`\`\`\n${result.output.trim().slice(-4000) || '(no output)'}\n\`\`\``
}
