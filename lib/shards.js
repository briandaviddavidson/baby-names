// Name shards: data/processed/{names,states}/<key>.json, listed in index.json.
// Used by scripts/transform.js to write them and by the site to find a name's file.

// Shards group names by a lower-cased prefix ("em" holds Emma, Emmett, …): two
// letters, and a shard over maxBytes splits into one-letter-longer prefixes until
// it fits (a single name can still be over). Names shorter than the new prefix
// stay in the parent shard. shardFor() picks the longest key that prefixes the name.
export function shard(byName, maxBytes) {
  const out = new Map();
  const split = (key, entries) => {
    const tooBig = JSON.stringify(Object.fromEntries(entries)).length > maxBytes;
    const longer = entries.filter(([name]) => name.length > key.length);
    if (!tooBig || !longer.length) {
      out.set(key, Object.fromEntries(entries));
      return;
    }
    const rest = entries.filter(([name]) => name.length <= key.length);
    if (rest.length) out.set(key, Object.fromEntries(rest));
    for (const [k, group] of groupBy(longer, ([name]) => name.slice(0, key.length + 1).toLowerCase())) split(k, group);
  };
  for (const [k, group] of groupBy([...byName], ([name]) => name.slice(0, 2).toLowerCase())) split(k, group);
  return out;
}

function groupBy(list, keyOf) {
  const groups = new Map();
  for (const item of list) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

// The shard holding a name: the longest key that prefixes it. Shared with the client.
export function shardFor(name, keys) {
  const lower = name.toLowerCase();
  for (let len = lower.length; len >= 2; len--) if (keys.includes(lower.slice(0, len))) return lower.slice(0, len);
  return null;
}
