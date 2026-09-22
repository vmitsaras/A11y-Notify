#!/usr/bin/env node
/**
 * Verifies the built package exports are accessible.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const {
  a11yNotify,
  destroyA11yNotify,
  createA11yNotifier,
  A11yNotifier,
  A11Y_NOTIFY_EVENTS,
} = await import(resolve(root, 'dist', 'index.js'));

const checks = [
  ['a11yNotify', typeof a11yNotify === 'function'],
  ['destroyA11yNotify', typeof destroyA11yNotify === 'function'],
  ['createA11yNotifier', typeof createA11yNotifier === 'function'],
  ['A11yNotifier', typeof A11yNotifier === 'function'],
  ['A11Y_NOTIFY_EVENTS.init', A11Y_NOTIFY_EVENTS.init === 'a11y-notify:init'],
];

let failed = false;
for (const [name, ok] of checks) {
  if (ok) {
    console.log(`✓ ${name}`);
  } else {
    console.error(`✗ ${name}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('Package exports verified.');
