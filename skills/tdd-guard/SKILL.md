---
name: tdd-guard
description: A lightweight test-before-commit guard. Use tdd_check to run the project's npm test script, and the CLI to install or remove an opt-in pre-commit hook. This is not test-first edit enforcement.
whenToUse: "A project wants tests to gate commits, or an agent needs a bounded test run before claiming a change is ready."
---

# TDD guard

## Use

```text
Use tdd_check on this project.
```

CLI:

```bash
node bin/dsh-tdd-guard.mjs install --root .
node bin/dsh-tdd-guard.mjs status --root .
node bin/dsh-tdd-guard.mjs uninstall --root .
node bin/dsh-tdd-guard.mjs check --root .
```

`install` writes a managed `.git/hooks/pre-commit` that runs `npm test`. It refuses to replace an
existing hook unless `--force` is passed. `uninstall` only removes a hook with the managed marker.

## Boundaries

- This is a **commit gate**, not the original TDD Guard's edit-time enforcement. It cannot prove that
  a test was written before the code.
- It runs `npm test`, which may execute arbitrary project scripts. Only run it in a trusted checkout.
- No test framework detection, coverage analysis, mutation testing, or LLM judge.
- The hook is POSIX-oriented; Windows Git may need a different shell setup.
- A passing suite is evidence, not proof that the change is correct.
