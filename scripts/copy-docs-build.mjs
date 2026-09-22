#!/usr/bin/env node
/**
 * Copies the built package bundle into docs/assets/a11y-notify.js
 * for GitHub Pages consumption.
 *
 * Usage:
 *   node scripts/copy-docs-build.mjs           # copy
 *   node scripts/copy-docs-build.mjs --check   # verify no diff
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'dist', 'index.js');
const dest = resolve(root, 'docs', 'assets', 'a11y-notify.js');
const check = process.argv.includes('--check');

if (!existsSync(src)) {
  console.error('dist/index.js not found. Run npm run build first.');
  process.exit(1);
}

const content = readFileSync(src, 'utf8');

if (check) {
  if (!existsSync(dest)) {
    console.error('docs/assets/a11y-notify.js not found. Run npm run docs:build first.');
    process.exit(1);
  }
  const existing = readFileSync(dest, 'utf8');
  if (content !== existing) {
    console.error('docs/assets/a11y-notify.js is stale. Run npm run docs:build.');
    process.exit(1);
  }
  console.log('docs/assets/a11y-notify.js is up to date.');
} else {
  writeFileSync(dest, content, 'utf8');
  console.log('Copied dist/index.js → docs/assets/a11y-notify.js');
}
