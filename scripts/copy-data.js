// Copies the files the browser fetches (name and state shards, yearly totals)
// from data/processed to public/data. Runs before `npm run dev` and `npm run build`.
import { cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, processedPath } from './lib/paths.js';

const out = join(ROOT, 'public', 'data');
await rm(out, { recursive: true, force: true });
for (const name of ['years.json', 'state-totals.json', 'names', 'states']) {
  await cp(processedPath(name), join(out, name), { recursive: true });
}
console.log(`Copied processed data to ${out}`);
