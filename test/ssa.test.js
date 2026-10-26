import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ranks, readNational, readStates, totals, trim } from '../scripts/lib/ssa.js';
import { shard, shardFor } from '../lib/shards.js';

const fixtures = fileURLToPath(new URL('fixtures/raw/', import.meta.url));

test('readNational takes the year range from the file names', () => {
  const { firstYear, lastYear, counts } = readNational(`${fixtures}national`);
  assert.equal(firstYear, 1880);
  assert.equal(lastYear, 1881);
  assert.deepEqual([...counts.F.get('Anna')], [2604, 2700]);
  assert.deepEqual([...counts.M.get('Anna')], [12, 0]);
});

test('readStates indexes each state from its first year', () => {
  const { firstYear, lastYear, states } = readStates(`${fixtures}state`);
  assert.deepEqual([firstYear, lastYear], [1910, 1911]);
  assert.deepEqual([...states.CA.F.get('Mary')], [295, 300]);
  assert.deepEqual([...states.AK.F.get('Mary')], [0, 14]);
});

test('totals sums every name per year', () => {
  const { counts } = readNational(`${fixtures}national`);
  assert.deepEqual([...totals(counts.F, 2)], [9669, 9619]);
});

test('ranks share a rank on ties and skip zero years', () => {
  const bySex = new Map([
    ['A', Int32Array.from([10, 0])],
    ['B', Int32Array.from([10, 5])],
    ['C', Int32Array.from([3, 6])],
  ]);
  const r = ranks(bySex, 2);
  assert.deepEqual([...r.get('A')], [1, 0]);
  assert.deepEqual([...r.get('B')], [1, 2]);
  assert.deepEqual([...r.get('C')], [3, 1]);
});

test('trim drops leading and trailing zeros only', () => {
  assert.deepEqual(trim(Int32Array.from([0, 4, 0, 5, 0])), [1, [4, 0, 5]]);
  assert.equal(trim(Int32Array.from([0, 0])), null);
});

test('shard splits oversized prefixes and shardFor finds them', () => {
  const big = 'x'.repeat(50);
  const byName = new Map([
    ['Al', 1],
    ['Alice', big],
    ['Alma', big],
    ['Bo', 2],
  ]);
  const shards = shard(byName, 70);
  const keys = [...shards.keys()].sort();
  assert.deepEqual(keys, ['al', 'ali', 'alm', 'bo']);
  assert.deepEqual(Object.keys(shards.get('al')), ['Al']);
  assert.equal(shardFor('ALICE', keys), 'ali');
  assert.equal(shardFor('Al', keys), 'al');
  assert.equal(shardFor('Zed', keys), null);
});
