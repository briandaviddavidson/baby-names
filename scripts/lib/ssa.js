// Readers for the unzipped SSA files in data/raw. Counts are kept as one
// Int32Array per name and sex, indexed by year - firstYear, with 0 where SSA
// reported nothing (fewer than 5 births, or no births at all).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const lines = (file) => readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);

// National: yobYYYY.txt files of "Name,Sex,Count". The year range comes from the
// file names, so a new SSA release needs no code change.
export function readNational(dir) {
  const files = readdirSync(dir).filter((f) => /^yob\d{4}\.txt$/.test(f));
  const years = files.map((f) => +f.slice(3, 7)).sort((a, b) => a - b);
  const firstYear = years[0];
  const lastYear = years.at(-1);
  if (years.length !== lastYear - firstYear + 1) throw new Error(`Missing years between ${firstYear} and ${lastYear}`);
  const length = lastYear - firstYear + 1;
  const counts = { F: new Map(), M: new Map() };
  for (const year of years) {
    for (const line of lines(join(dir, `yob${year}.txt`))) {
      const [name, sex, count] = line.split(',');
      const bySex = counts[sex];
      if (!bySex.has(name)) bySex.set(name, new Int32Array(length));
      bySex.get(name)[year - firstYear] = +count;
    }
  }
  return { firstYear, lastYear, counts };
}

// State: XX.TXT files of "State,Sex,Year,Name,Count". Returns the same shape as
// readNational, with one counts map per state.
export function readStates(dir) {
  const files = readdirSync(dir).filter((f) => /^[A-Z]{2}\.TXT$/.test(f));
  const rows = files.map((f) => lines(join(dir, f)).map((l) => l.split(',')));
  let firstYear = Infinity;
  let lastYear = -Infinity;
  for (const file of rows) {
    for (const r of file) {
      const y = +r[2];
      if (y < firstYear) firstYear = y;
      if (y > lastYear) lastYear = y;
    }
  }
  const length = lastYear - firstYear + 1;
  const states = {};
  for (const file of rows) {
    for (const [state, sex, year, name, count] of file) {
      states[state] ??= { F: new Map(), M: new Map() };
      const bySex = states[state][sex];
      if (!bySex.has(name)) bySex.set(name, new Int32Array(length));
      bySex.get(name)[year - firstYear] = +count;
    }
  }
  return { firstYear, lastYear, states };
}

// Births per year: the sum of every reported count, so slightly below true
// births because SSA leaves out names given fewer than 5 times.
export function totals(bySex, length) {
  const sum = new Int32Array(length);
  for (const arr of bySex.values()) for (let i = 0; i < length; i++) sum[i] += arr[i];
  return sum;
}

// Rank of each name within each year, by count; ties share the higher rank
// (1, 2, 2, 4). Names with no reported births that year get 0.
export function ranks(bySex, length) {
  const out = new Map([...bySex.keys()].map((name) => [name, new Int32Array(length)]));
  const entries = [...bySex.entries()];
  for (let i = 0; i < length; i++) {
    const year = entries.filter(([, c]) => c[i] > 0).sort((a, b) => b[1][i] - a[1][i]);
    let rank = 0;
    for (let j = 0; j < year.length; j++) {
      if (j === 0 || year[j][1][i] !== year[j - 1][1][i]) rank = j + 1;
      out.get(year[j][0])[i] = rank;
    }
  }
  return out;
}

// Trims leading and trailing zeros: [startIndex, values] or null if all zero.
export function trim(arr) {
  let a = 0;
  let b = arr.length - 1;
  while (a <= b && arr[a] === 0) a++;
  while (b >= a && arr[b] === 0) b--;
  return a > b ? null : [a, Array.from(arr.subarray(a, b + 1))];
}
