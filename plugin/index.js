// DSH host plugin: a read-only test gate and a commit-hook installer helper.
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runTests, hookStatus } from '../src/guard.mjs'
import { renderCheck } from '../src/guard.mjs'

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))
const SKILL_PATH = join(PLUGIN_DIR, '..', 'skills', 'tdd-guard', 'SKILL.md')
const PROVIDER = 'dsh-tdd-guard'
export const name = 'tdd-guard'
export const inject = ['tools', 'skills']

function stripFrontmatter(text) {
  if (!text.startsWith('---\n')) return text
  const end = text.indexOf('\n---\n', 4)
  return end === -1 ? text : text.slice(end + 5)
}
const summary = {
  name: 'tdd-guard',
  description: 'Run the project test script before a commit and install an opt-in pre-commit hook. This is a commit gate, not test-first edit enforcement.',
  whenToUse: 'A project wants a lightweight test-before-commit guard or a quick test run from DSH.',
  invocation: { modelInvocable: true, userInvocable: true },
  source: 'bundled', provider: PROVIDER,
  resourceBase: { kind: 'directory', path: join(PLUGIN_DIR, '..', 'skills', 'tdd-guard') },
  rank: 600, locator: 'tdd-guard', metadata: { domain: 'testing', version: '0.1.0' },
}

export function apply(ctx) {
  ctx.tools.register({
    name: 'tdd_check',
    description: 'Run the project\'s package.json test script and report pass/fail plus output. Read-only aside from whatever the test script does; use a timeout. This is a commit gate, not a full TDD enforcement system.',
    parameters: {
      type: 'object', additionalProperties: false,
      properties: { root: { type: 'string', description: 'Project directory. Defaults to the workspace.' } },
    },
    output: {
      schema: {
        type: 'object', additionalProperties: false,
        properties: { markdown: { type: 'string' }, ok: { type: 'boolean' }, code: { type: ['integer', 'null'] }, hook: { type: 'boolean' } },
        required: ['markdown', 'ok', 'code', 'hook'],
      },
      render: (_args, value) => [{ type: 'text', text: value.markdown }],
    },
    timeoutMs: 150_000,
    async execute(args = {}) {
      const result = await runTests(args.root || process.cwd())
      const status = await hookStatus(args.root || process.cwd())
      return { markdown: renderCheck(result) + `\n\npre-commit hook installed: ${status.installed}`, ok: result.ok, code: result.code, hook: status.installed }
    },
  })
  ctx.skills.registerProvider(() => ({
    name: PROVIDER,
    async list() { return [summary] },
    async get(candidate) {
      if (candidate?.name !== 'tdd-guard') return undefined
      return { ...summary, content: stripFrontmatter(await readFile(SKILL_PATH, 'utf8')) }
    },
  }))
}
