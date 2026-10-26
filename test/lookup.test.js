import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookup, lookupCaption, oneIn } from '../lib/charts/lookup.js';

// 2000–2003, 1,000 girls and 1,000 boys born each year.
const years = { firstYear: 2000, lastYear: 2003, births: { F: [1000, 1000, 1000, 1000], M: [1000, 1000, 1000, 1000] } };

test('lookup finds peak share, best rank and the latest year per sex', () => {
  const entry = {
    F: [
      [2000, 10, 40, 0, 20],
      [2000, 900, 30, 0, 0],
    ],
    M: [[2001, 1]],
  };
  const data = lookup('Robin', entry, years);
  assert.equal(data.total, 71);
  assert.deepEqual(data.shown.map((s) => s.sex), ['F']);
  assert.deepEqual(data.hidden.map((s) => s.sex), ['M']);
  const [f] = data.shown;
  assert.equal(f.peak.year, 2001);
  assert.equal(f.peak.per1000, 40);
  assert.deepEqual([f.best.rank, f.best.year], [30, 2001]);
  assert.deepEqual(f.latest, { year: 2003, count: 20, rank: null });
  assert.equal(f.gaps, 1);
});

test('caption names the peak, the latest year and both sexes when shared', () => {
  const entry = {
    F: [[2000, 30, 30, 30, 30], [2000, 5, 5, 5, 5]],
    M: [[2002, 10, 20], [2002, 50, 40]],
  };
  const caption = lookupCaption(lookup('Avery', entry, years));
  assert.match(caption, /^150 babies have been named Avery since records began in 2000, 80% of them girls\./);
  assert.match(caption, /For girls it peaked in 2000 \(the first year on record\), when 1 in every 33 girls got it \(#5\)\./);
  assert.match(caption, /30 girls got it in 2003 \(#5\), close to its peak\./);
  assert.match(caption, /For boys it peaked in 2003 \(#40\); 20 boys got it in 2003 \(#40\), its peak so far\./);
});

test('oneIn rounds to a whole number of babies', () => {
  assert.equal(oneIn(77.6), '1 in every 13');
  assert.equal(oneIn(0.33), '1 in every 3,030');
});
