#!/usr/bin/env node
/**
 * Browser test using Playwright.
 * Loads the GitHub Pages demo and checks for basic functionality.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const indexHtml = resolve(root, 'docs', 'index.html');

if (!existsSync(indexHtml)) {
  console.error('docs/index.html not found.');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await page.goto(`file://${indexHtml}`);
await page.waitForLoadState('networkidle');

if (errors.length > 0) {
  console.error('Page errors:', errors);
  await browser.close();
  process.exit(1);
}

const button = await page.$('[data-action="announce"]');
if (!button) {
  console.error('Announce button not found.');
  await browser.close();
  process.exit(1);
}

await button.click();

if (errors.length > 0) {
  console.error('Page errors after click:', errors);
  await browser.close();
  process.exit(1);
}

console.log('Browser tests passed.');
await browser.close();
