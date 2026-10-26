import { test } from 'node:test';
import assert from 'node:assert/strict';
import { longTail, longTailCaption } from '../lib/charts/long-tail.js';

// Two years, 1990 and 2000. In 1990, the top 10 boys' names cover everyone;
// in 2000, 200 names share births evenly, so the top 10 cover 5%.
const firstYear = 1990;
const lastYear = 2000;
const length = 11;
const make = (n1990, n2000) => {
  const m = new Map();
  for (let k = 0; k < Math.max(n1990, n2000); k++) {
    const c = new Int32Array(length);
    if (k < n1990) c[0] = 100;
    if (k < n2000) c[10] = 50;
    m.set(`N${k}`, c);
  }
  return m;
};
const counts = { F: make(20, 200), M: make(10, 200) };
const sum = (m) => Int32Array.from({ length }, (_, i) => [...m.values()].reduce((s, c) => s + c[i], 0));
const births = { F: sum(counts.F), M: sum(counts.M) };

test('longTail shares are top-N babies over all babies in the decade', () => {
  const rows = longTail(counts, births, { firstYear, lastYear });
  const at = (sex, decade, top) => rows.find((r) => r.sex === sex && r.decade === decade && r.top === top).share;
  assert.equal(at('M', 1990, 10), 1);
  assert.equal(at('F', 1990, 10), 0.5);
  assert.equal(at('M', 2000, 10), 0.05);
  assert.equal(at('M', 2000, 100), 0.5);
});

test('caption compares the peak decade with the latest', () => {
  const caption = longTailCaption(longTail(counts, births, { firstYear, lastYear }), { lastYear });
  assert.match(caption, /^Yes\. In the 1990s, 100% of boys got one of that year’s 10 most popular names; in the 2000s so far it’s 5%\./);
  assert.match(caption, /down from 100% and 100% in the 1990s\.$/);
});
