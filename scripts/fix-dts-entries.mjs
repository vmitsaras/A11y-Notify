#!/usr/bin/env node
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

for (const entry of ['index', 'docs']) {
  const files = readdirSync(dist);
  const dtsName = files.find((file) => new RegExp(`^${entry}-.*\\.d\\.ts$`).test(file));
  if (!dtsName) {
    console.error(`Missing declaration output for ${entry}.`);
    process.exit(1);
  }

  const dtsPath = resolve(dist, dtsName);
  const stableDtsPath = resolve(dist, `${entry}.d.ts`);
  const dtsContent = readFileSync(dtsPath, 'utf8').replace(
    new RegExp(`//# sourceMappingURL=${entry}-.*\\.d\\.ts\\.map\\s*$`),
    `//# sourceMappingURL=${entry}.d.ts.map`,
  );
  writeFileSync(stableDtsPath, dtsContent, 'utf8');

  const mapName = `${dtsName}.map`;
  const mapPath = resolve(dist, mapName);
  if (existsSync(mapPath)) {
    copyFileSync(mapPath, resolve(dist, `${entry}.d.ts.map`));
  }
}
