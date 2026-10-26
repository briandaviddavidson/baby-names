import { test } from 'node:test';
import assert from 'node:assert/strict';
import { letters, lettersCaption, letterShifts } from '../lib/charts/letters.js';

// 20 years. Boys move from "Thomas" to "Aiden"; girls from "Anne" to "Ava".
const firstYear = 2000;
const lastYear = 2019;
const length = 20;
const ramp = (from, to) => Int32Array.from({ length }, (_, i) => Math.round(from + ((to - from) * i) / (length - 1)));
const counts = {
  M: new Map([
    ['Thomas', ramp(100, 0)],
    ['Aiden', ramp(0, 100)],
  ]),
  F: new Map([
    ['Anne', ramp(100, 0)],
    ['Ava', ramp(0, 100)],
  ]),
};
const births = { M: new Int32Array(length).fill(100), F: new Int32Array(length).fill(100) };

test('letters weights length and endings by babies', () => {
  const d = letters(counts, births, { firstYear, lastYear });
  assert.equal(d.length.M[0], 6);
  assert.equal(d.length.M[19], 5);
  assert.equal(d.last.M.s[0], 1);
  assert.equal(d.last.M.n[19], 1);
  assert.equal(d.last.F.a[19], 1);
  assert.equal(letterShifts(d, 'M')[0].letter, 'n');
  assert.equal(letterShifts(d, 'M').at(-1).letter, 's');
});

test('caption reports the computed shifts', () => {
  const caption = lettersCaption(letters(counts, births, { firstYear, lastYear }));
  assert.match(caption, /^Boys’ names ending in “-n” went from 24% of boys in the 2000s to 100% in 2019, while “-s” fell from 76% to 0%\./);
  assert.match(caption, /For girls the big change is the fall of “-e”, from 76% to 0%; “-a” is now the most common ending, at 100%\./);
  assert.match(caption, /Names got shorter: the average girl’s name went from 4\.0 letters in 2000 to 3\.0 in 2019, and the average boy’s from 6\.0 to 5\.0\.$/);
});
