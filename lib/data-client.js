// Browser-side loading of the processed data in public/data. Each file is fetched
// once and cached for the session.
import { DATA_PATH } from './site.js';
import { shardFor } from './shards.js';
import { total } from './series.js';

const cache = new Map();
function getJson(path) {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(`${DATA_PATH}/${path}`).then((res) => {
        if (!res.ok) throw new Error(`${res.status} loading ${path}`);
        return res.json();
      }),
    );
    // A failed request shouldn't be cached forever.
    cache.get(path).catch(() => cache.delete(path));
  }
  return cache.get(path);
}

export const loadYears = () => getJson('years.json');
export const loadStateTotals = () => getJson('state-totals.json');

// SSA names are capitalized ("Emma"); accept any case from the search box.
export const normalizeName = (text) => {
  const t = text.trim().replace(/[^A-Za-z]/g, '');
  return t ? t[0].toUpperCase() + t.slice(1).toLowerCase() : '';
};

// The shard holding `name` in a dataset ('names' or 'states'), or null.
async function shardOf(dataset, name) {
  const keys = await getJson(`${dataset}/index.json`);
  const key = shardFor(name, keys);
  return key ? getJson(`${dataset}/${key}.json`) : null;
}

export async function loadName(name) {
  return (await shardOf('names', name))?.[name] ?? null;
}

export async function loadStates(name) {
  return (await shardOf('states', name))?.[name] ?? null;
}

// Up to `limit` names starting with `prefix` from the shard the prefix maps to,
// most common first. Fewer letters than the shard key gives no suggestions.
export async function suggest(prefix, limit = 8) {
  const name = normalizeName(prefix);
  if (name.length < 2) return [];
  const shard = await shardOf('names', name);
  if (!shard) return [];
  const sum = (entry) => total(entry.F?.[0]) + total(entry.M?.[0]);
  return Object.entries(shard)
    .filter(([n]) => n.startsWith(name))
    .map(([n, entry]) => [n, sum(entry)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([n]) => n);
}
