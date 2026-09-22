# A11y Notify — Agent Guide

This repository implements `a11y-notify`, a tiny accessibility announcement utility.

## Key conventions

- TypeScript + ESM only
- Zero runtime dependencies
- No import side effects
- Live-region fallback uses scheduled DOM writes (50 ms delay)
- Priority: `normal` → `role="status"`, `high` → `role="alert"`
- Default notifier stored in `WeakMap<Document, A11yNotifier>`

## Build

```bash
npm ci
npm run build
npm run typecheck
```

## Test

```bash
npm test
```

## Docs build

```bash
npm run docs:build
```
