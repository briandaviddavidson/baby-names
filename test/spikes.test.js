import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPIKE, spikes, spikesCaption } from '../lib/charts/spikes.js';

// 1990–2025 with 100,000 births a year for each sex.
const firstYear = 1990;
const lastYear = 2025;
const length = lastYear - firstYear + 1;
const births = { F: new Int32Array(length).fill(100_000), M: new Int32Array(length).fill(100_000) };
const series = (fn) => Int32Array.from({ length }, (_, i) => fn(firstYear + i));

const counts = {
  F: new Map([
    // Jumps 100× in 1995 and fades to 1% of that.
    ['Fad', series((y) => (y < 1995 ? 20 : y === 1995 ? 2000 : 20))],
    // Jumps 10× in 2000 and keeps growing.
    ['Keeper', series((y) => (y < 2000 ? 200 : 2000 + (y - 2000) * 100))],
    // A one-year artifact: too few years of data.
    ['Blip', series((y) => (y === 2001 ? 5000 : 0))],
    // Jumps in 2020: too soon to judge.
    ['Recent', series((y) => (y < 2020 ? 50 : 1500))],
  ]),
  M: new Map([['Steady', series(() => 3000)]]),
};

test('spikes ranks the sharpest jumps and judges them ten years on', () => {
  const list = spikes(counts, births, { firstYear, lastYear });
  assert.deepEqual(
    list.map((s) => [s.name, s.year, s.status]),
    [
      ['Fad', 1995, 'faded'],
      ['Recent', 2020, 'too soon'],
      ['Keeper', 2000, 'stuck'],
    ],
  );
  const [fad, , keeper] = list;
  assert.equal(fad.ratio, 100);
  assert.equal(fad.retention, 0.01);
  assert.equal(keeper.peakYear, 2003);
  assert.equal(keeper.window[0].offset, -SPIKE.before);
});

test('caption is built from the computed spikes', () => {
  const caption = spikesCaption(spikes(counts, births, { firstYear, lastYear }));
  assert.match(caption, /^Many spikes last\. Of the 3 sharpest one-year jumps, 2 happened at least 10 years ago, and 1 of those had faded/);
  assert.match(caption, /Fad went from 20 girls in 1994 to 2,000 in 1995, and 10 years later it was given at 1% of that rate\./);
  assert.match(caption, /Keeper held on best: in 2013 it was 1\.4 times as popular as in 2003\./);
});
