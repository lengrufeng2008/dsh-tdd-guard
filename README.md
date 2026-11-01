# TDD Guard for DSH

> A lightweight **test-before-commit** guard. It runs the project's `npm test` script and can install
> an opt-in `.git/hooks/pre-commit`. It is not the original TDD Guard's edit-time enforcement.

## Use

```bash
node bin/dsh-tdd-guard.mjs status --root .
node bin/dsh-tdd-guard.mjs check --root .
node bin/dsh-tdd-guard.mjs install --root .
node bin/dsh-tdd-guard.mjs uninstall --root .
```

In DSH:

```text
Use tdd_check on this project.
```

## What it guarantees

- The managed hook runs `npm test`; a non-zero exit blocks the commit.
- `install` refuses to overwrite an unmarked hook unless `--force` is passed.
- `uninstall` only removes a hook carrying the `dsh-tdd-guard` marker.
- `check` returns pass/fail and the last 20 KB of output; timeout 120 s (150 s tool).

## What it does not guarantee

- It does not prove a test was written **before** the code. That is the original tool's job; this is
  a commit gate.
- It runs project scripts; use a trusted checkout.
- No coverage, mutation testing, LLM judge, or cross-language test detection.
- POSIX-oriented Git hook; Windows behavior varies.
- A passing suite is evidence, not a correctness proof.

## Tests

```bash
npm test
```

## Provenance

Inspired by [nizos/tdd-guard](https://github.com/nizos/tdd-guard); no source code copied. See `NOTICE.md`.
License: MIT.
