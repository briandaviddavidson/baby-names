import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flips, flipsCaption } from '../lib/charts/flips.js';

const firstYear = 1950;
const lastYear = 2000;
const length = lastYear - firstYear + 1;
const series = (fn) => Int32Array.from({ length }, (_, i) => fn(firstYear + i));

const counts = {
  F: new Map([
    // Boys until 1970, girls from 1976.
    ['Flip', series((y) => (y < 1970 ? 50 : y < 1976 ? 500 : 2000))],
    // Always about half and half: no flip.
    ['Even', series(() => 1000)],
    // Flips, but with too few babies on the old side.
    ['Small', series((y) => (y < 1970 ? 10 : 2000))],
  ]),
  M: new Map([
    ['Flip', series((y) => (y < 1970 ? 1000 : y < 1976 ? 500 : 50))],
    ['Even', series(() => 1000)],
    ['Small', series((y) => (y < 1970 ? 200 : 20))],
  ]),
};

test('flips finds a boys-to-girls flip with enough babies on both sides', () => {
  const list = flips(counts, { firstYear, lastYear });
  assert.deepEqual(list.map((d) => d.name), ['Flip']);
  const [d] = list;
  assert.equal(d.to, 'F');
  assert.ok(d.left < d.cross && d.cross <= d.reached);
  // 1,000 boys a year before 1970, then 500 a year until the crossing.
  assert.equal(d.before, 20 * 1000 + (d.cross - 1970) * 500);
  assert.equal(d.latestYear, lastYear);
});

test('caption counts directions and how long flips took', () => {
  const caption = flipsCaption(flips(counts, { firstYear, lastYear }), { lastYear });
  assert.match(caption, /^Names mostly move from boys to girls: of the 1 names that flipped with real numbers on both sides, 1 went from boys to girls and 0 from girls to boys\./);
  assert.match(caption, /Of the 1 boys-to-girls names still given widely in 2000, 1 are still majority girls\./);
});
