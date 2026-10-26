// Copies the files the browser fetches (name and state shards, yearly totals,
// state outlines)
// from data/processed to public/data. Runs before `npm run dev` and `npm run build`.
import { cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, processedPath } from './lib/paths.js';

const out = join(ROOT, 'public', 'data');
await rm(out, { recursive: true, force: true });
for (const name of ['years.json', 'state-totals.json', 'names', 'states']) {
  await cp(processedPath(name), join(out, name), { recursive: true });
}
// State outlines (unprojected, for Google Maps) for the state map.
await cp(join(ROOT, 'node_modules', 'us-atlas', 'states-10m.json'), join(out, 'states-10m.json'));
console.log(`Copied processed data to ${out}`);
