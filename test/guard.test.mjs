import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installHook, uninstallHook, hookStatus, runTests } from '../src/guard.mjs'
import { apply } from '../plugin/index.js'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
async function project(exitCode = 0) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-tdd-'))
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: '0.0.1', scripts: { test: `node -e "process.exit(${exitCode})"` } }, null, 2))
  await mkdir(join(root, '.git/hooks'), { recursive: true })
  return root
}

test('install, status, and uninstall manage only the marked hook', async () => {
  const root = await project()
  try {
    const installed = await installHook(root)
    assert.equal(installed.installed, true)
    const status = await hookStatus(root)
    assert.equal(status.installed, true)
    assert.match(await readFile(join(root, '.git/hooks/pre-commit'), 'utf8'), /dsh-tdd-guard/)
    const removed = await uninstallHook(root)
    assert.equal(removed.removed, true)
    assert.equal((await hookStatus(root)).installed, false)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('runTests reports pass and fail', async () => {
  const ok = await project(0)
  const bad = await project(1)
  try {
    assert.equal((await runTests(ok)).ok, true)
    const failed = await runTests(bad)
    assert.equal(failed.ok, false)
    assert.equal(failed.code, 1)
  } finally { await rm(ok, { recursive: true, force: true }); await rm(bad, { recursive: true, force: true }) }
})

test('the plugin registers tdd_check and refuses to remove an unmarked hook', async () => {
  const root = await project(0)
  try {
    const tools = []
    let factory
    apply({ tools: { register: (tool) => tools.push(tool) }, skills: { registerProvider: (fn) => { factory = fn } } })
    assert.equal(tools[0].name, 'tdd_check')
    const result = await tools[0].execute({ root })
    assert.equal(result.ok, true)
    const provider = factory()
    assert.equal((await provider.list())[0].name, 'tdd-guard')
    assert.match((await provider.get({ name: 'tdd-guard' })).content, /commit gate/)
    await writeFile(join(root, '.git/hooks/pre-commit'), '#!/bin/sh\necho custom\n', { mode: 0o755 })
    await assert.rejects(() => installHook(root), /already exists/)
    await assert.rejects(() => uninstallHook(root), /not installed by dsh-tdd-guard/)
  } finally { await rm(root, { recursive: true, force: true }) }
})
