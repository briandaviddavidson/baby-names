// Turns the raw SSA files in data/raw into the compact JSON the site loads, in
// data/processed:
//   years.json               year range and total births per year by sex
//   names/<xx>.json          per name and sex: [counts, ranks] (ranks top 1,000
//                            only), sharded by name prefix ("em" holds Emma, …)
//   names/index.json         the shard keys
//   state-totals.json        total births per state, year and sex
//   states/<xx>.json         per name and sex: yearly counts per state
//   states/index.json        the shard keys
//   insights/<chart>.json    precomputed numbers for the site-wide charts
// Arrays are [startYear, values…] with leading and trailing zeros trimmed.
// Names given fewer than MIN_TOTAL babies in all years combined are left out.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RAW_DIR, SOURCE_FILE, processedPath } from './lib/paths.js';
import { ranks, readNational, readStates, totals, trim } from './lib/ssa.js';
import { shard } from '../lib/shards.js';
import { spikes } from '../lib/charts/spikes.js';
import { flips } from '../lib/charts/flips.js';
import { longTail } from '../lib/charts/long-tail.js';

export const MIN_TOTAL = 100;
// Ranks are kept for the top 1,000 only, like SSA's own tables; deeper ranks
// on rare names would double the file size.
export const MAX_RANK = 1000;
// Shards above this are split further, so one lookup stays a small download.
const MAX_SHARD_BYTES = 150_000;
// State series only for names this common; rarer names are mostly suppressed
// at the state level (under 5 births in a state and year) anyway.
export const MIN_STATE_TOTAL = 1000;

const SEXES = ['F', 'M'];
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const series = (arr, firstYear) => {
  const t = trim(arr);
  return t && [firstYear + t[0], ...t[1]];
};

async function writeJson(path, data) {
  const text = JSON.stringify(data);
  await writeFile(path, text);
  return text.length;
}

// Writes one file per shard plus index.json, the sorted list of shard keys.
async function writeShards(dir, byName) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const shards = shard(byName, MAX_SHARD_BYTES);
  const keys = [...shards.keys()].sort();
  const sizes = [];
  for (const key of keys) sizes.push(await writeJson(join(dir, `${key}.json`), shards.get(key)));
  await writeJson(join(dir, 'index.json'), keys);
  return { shards: keys.length, bytes: sum(sizes), largest: Math.max(...sizes) };
}

const mb = (n) => `${(n / 1e6).toFixed(1)} MB`;

const source = JSON.parse(await readFile(SOURCE_FILE, 'utf8'));
const national = readNational(join(RAW_DIR, 'national'));
const { firstYear, lastYear, counts } = national;
const length = lastYear - firstYear + 1;
console.log(`National: ${firstYear}–${lastYear}`);

const nameTotals = new Map();
for (const sex of SEXES) {
  for (const [name, arr] of counts[sex]) nameTotals.set(name, (nameTotals.get(name) ?? 0) + sum(arr));
}
const kept = [...nameTotals].filter(([, t]) => t >= MIN_TOTAL).map(([n]) => n).sort();

await mkdir(processedPath(''), { recursive: true });
const yearTotals = Object.fromEntries(SEXES.map((s) => [s, Array.from(totals(counts[s], length))]));
await writeJson(processedPath('years.json'), {
  firstYear,
  lastYear,
  minTotal: MIN_TOTAL,
  minStateTotal: MIN_STATE_TOTAL,
  maxRank: MAX_RANK,
  names: { all: nameTotals.size, kept: kept.length },
  source: { national: source.national.source, state: source.state.source, fetchedAt: source.fetchedAt },
  births: yearTotals,
});

// Site-wide charts need every name, so their numbers are computed here.
const births = Object.fromEntries(SEXES.map((s) => [s, totals(counts[s], length)]));
await rm(processedPath('insights'), { recursive: true, force: true });
await mkdir(processedPath('insights'), { recursive: true });
await writeJson(processedPath('insights/spikes.json'), spikes(counts, births, national));
await writeJson(processedPath('insights/flips.json'), flips(counts, national));
await writeJson(processedPath('insights/long-tail.json'), longTail(counts, births, national));
console.log('Insights: spikes, flips, long-tail');

const rankBySex = Object.fromEntries(SEXES.map((s) => [s, ranks(counts[s], length)]));
const names = new Map();
for (const name of kept) {
  const entry = {};
  for (const sex of SEXES) {
    const c = counts[sex].get(name);
    if (!c) continue;
    if (!c.some((x) => x > 0)) continue;
    const r = rankBySex[sex].get(name).map((x) => (x <= MAX_RANK ? x : 0));
    entry[sex] = [series(c, firstYear), series(r, firstYear)].filter(Boolean);
  }
  names.set(name, entry);
}
const n = await writeShards(processedPath('names'), names);
console.log(`Names: ${kept.length} of ${nameTotals.size} (≥${MIN_TOTAL} births), ${n.shards} shards, ${mb(n.bytes)}, largest ${mb(n.largest)}`);

const state = readStates(join(RAW_DIR, 'state'));
const stateLength = state.lastYear - state.firstYear + 1;
if (state.lastYear !== lastYear) console.warn(`Warning: state data ends in ${state.lastYear}, national in ${lastYear}`);
const codes = Object.keys(state.states).sort();
await writeJson(processedPath('state-totals.json'), {
  firstYear: state.firstYear,
  lastYear: state.lastYear,
  births: Object.fromEntries(
    codes.map((code) => [code, Object.fromEntries(SEXES.map((s) => [s, Array.from(totals(state.states[code][s], stateLength))]))]),
  ),
});
const stateNames = new Map();
for (const name of kept) {
  if (nameTotals.get(name) < MIN_STATE_TOTAL) continue;
  const entry = {};
  for (const sex of SEXES) {
    const bySex = {};
    for (const code of codes) {
      const c = state.states[code][sex].get(name);
      const s = c && series(c, state.firstYear);
      if (s) bySex[code] = s;
    }
    if (Object.keys(bySex).length) entry[sex] = bySex;
  }
  if (Object.keys(entry).length) stateNames.set(name, entry);
}
const s = await writeShards(processedPath('states'), stateNames);
console.log(
  `States: ${state.firstYear}–${state.lastYear}, ${codes.length} states, ${stateNames.size} names (≥${MIN_STATE_TOTAL} births), ` +
    `${s.shards} shards, ${mb(s.bytes)}, largest ${mb(s.largest)}`,
);
