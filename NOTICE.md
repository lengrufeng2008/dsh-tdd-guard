# Notice

`dsh-tdd-guard` is a test-before-commit guard for DeepSeek Harness.

It is inspired by [nizos/tdd-guard](https://github.com/nizos/tdd-guard); no source code is copied.
This implementation is intentionally narrower: it runs `npm test` and manages a marked Git hook. It
does not enforce test-first editing.
