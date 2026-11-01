#!/usr/bin/env node
import { installHook, uninstallHook, hookStatus, runTests } from '../src/guard.mjs'
const args = process.argv.slice(2)
const value = (name, fallback) => { const i = args.indexOf(name); return i === -1 ? fallback : args[i + 1] }
const command = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--root') || 'status'
const root = value('--root', process.cwd())
try {
  if (command === 'install') console.log(JSON.stringify(await installHook(root, { force: args.includes('--force') }), null, 2))
  else if (command === 'uninstall') console.log(JSON.stringify(await uninstallHook(root), null, 2))
  else if (command === 'status') console.log(JSON.stringify(await hookStatus(root), null, 2))
  else if (command === 'check') { const result = await runTests(root); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.ok ? 0 : 1 }
  else { console.error('usage: dsh-tdd-guard [install|uninstall|status|check] [--root DIR] [--force]'); process.exitCode = 2 }
} catch (error) { console.error(`dsh-tdd-guard: ${error.message}`); process.exitCode = 2 }
