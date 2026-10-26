import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_RANK_COUNT, baskets, mainSex, maxPer1000, ranked, stateMapCaption, stateValues } from '../lib/charts/state-map.js';

const counts = (pairs) => new Map(pairs.map(([n, c]) => [n, Int32Array.from([c])]));

test('baskets estimate births from the national top names, ignoring suppressed ones', () => {
  // 1,000 girls nationally; 13 rare names with 2 each fall outside the top 100.
  const national = { firstYear: 2020, counts: { F: counts([['Ava', 100], ['Mia', 90], ...Array.from({ length: 98 }, (_, i) => [`N${i}`, 8]), ...Array.from({ length: 13 }, (_, i) => [`Rare${i}`, 2])]) } };
  // A small state reports only Ava; its other babies fell under 5 each.
  const state = { firstYear: 2020, lastYear: 2020, states: { WY: { F: counts([['Ava', 10]]) } } };
  const out = baskets(national, state, ['F']);
  const share = (100 + 90 + 98 * 8) / 1000;
  assert.equal(out.share.F[0], share);
  assert.equal(out.births.WY.F[0], Math.round(10 / share));
});

const totals = {
  firstYear: 2020,
  lastYear: 2021,
  estimated: { CA: { F: [10000, 10000], M: [10000, 10000] }, WY: { F: [500, 500], M: [500, 500] }, TX: { F: [8000, 8000], M: [8000, 8000] } },
};
const entry = { F: { CA: [2020, 100, 50], WY: [2020, 30], TX: [2020, 160, 160] }, M: { CA: [2020, 5] } };

test('stateValues divides by estimated births and marks missing states', () => {
  const values = stateValues(entry, totals, 'F', 2020);
  const by = Object.fromEntries(values.map((v) => [v.code, v]));
  assert.equal(by.CA.per1000, 10);
  assert.equal(by.TX.per1000, 20);
  assert.equal(by.AL.per1000, null);
  assert.equal(values.length, 51);
});

test('rankings skip small counts and thin states; the color scale follows them', () => {
  const values = stateValues(entry, totals, 'F', 2020);
  // WY has the highest share (60 per 1,000) but under 1,000 estimated births.
  assert.deepEqual(ranked(values).map((v) => v.code), ['TX', 'CA']);
  assert.equal(maxPer1000(values), 20);
  assert.ok(ranked(stateValues(entry, totals, 'M', 2020)).every((v) => v.count >= MIN_RANK_COUNT));
});

test('mainSex and the caption use the computed values', () => {
  assert.equal(mainSex(entry), 'F');
  const caption = stateMapCaption('Ada', entry, totals, 'F', 2021);
  assert.match(caption, /^In 2021, among the 2 states with at least 20 girls named Ada, it was most popular in Texas \(1 in every 50 girls, 160 babies\) and least popular in California \(1 in every 200\), a 4\.0-fold gap\./);
  assert.match(caption, /Texas also led in 2020/);
});
