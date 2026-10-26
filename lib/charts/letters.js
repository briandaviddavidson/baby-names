// Chart 5: average name length and the last letter of names, by year and sex,
// weighted by babies. Computed in scripts/transform.js.
export const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

// counts: { F: Map(name → Int32Array), M: … }, births: { F: Int32Array, M: … }.
export function letters(counts, births, { firstYear, lastYear }) {
  const length = lastYear - firstYear + 1;
  const out = { firstYear, lastYear, length: {}, last: {} };
  for (const sex of ['F', 'M']) {
    const chars = new Float64Array(length);
    const last = Object.fromEntries(LETTERS.map((l) => [l, new Float64Array(length)]));
    for (const [name, c] of counts[sex]) {
      const end = name.at(-1).toLowerCase();
      for (let i = 0; i < length; i++) {
        if (!c[i]) continue;
        chars[i] += c[i] * name.length;
        last[end][i] += c[i];
      }
    }
    const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
    out.length[sex] = Array.from(chars, (x, i) => round(x / births[sex][i], 3));
    out.last[sex] = Object.fromEntries(LETTERS.map((l) => [l, Array.from(last[l], (x, i) => round(x / births[sex][i], 4))]));
  }
  return out;
}

const pct = (x) => `${Math.round(x * 100)}%`;
const avg = (arr, from, to) => arr.slice(from, to).reduce((a, b) => a + b, 0) / (to - from);

// Letters whose share grew or shrank the most between the first and last
// decade-long stretches of data, per sex.
export function letterShifts(data, sex) {
  const n = data.length[sex].length;
  return LETTERS.map((l) => {
    const series = data.last[sex][l];
    const then = avg(series, 0, 10);
    const now = avg(series, n - 10, n);
    const peakIndex = series.indexOf(Math.max(...series));
    return { letter: l, then, now, change: now - then, peakYear: data.firstYear + peakIndex, peak: series[peakIndex], latest: series[n - 1] };
  }).sort((a, b) => b.change - a.change);
}

export function lettersCaption(data) {
  const { firstYear, lastYear } = data;
  const boys = letterShifts(data, 'M');
  const girls = letterShifts(data, 'F');
  const [rise] = boys;
  const fall = boys.at(-1);
  const girlFall = girls.at(-1);
  const girlTop = [...girls].sort((a, b) => b.latest - a.latest)[0];
  const len = (sex) => {
    const s = data.length[sex];
    const peak = s.indexOf(Math.max(...s));
    return { first: s[0], peak: s[peak], peakYear: firstYear + peak, last: s.at(-1) };
  };
  const b = len('M');
  const g = len('F');
  const end = (l) => `“-${l}”`;
  let text =
    `Boys’ names ending in ${end(rise.letter)} went from ${pct(rise.then)} of boys in the ${firstYear}s to ${pct(rise.latest)} in ${lastYear}` +
    (rise.peakYear !== lastYear ? ` (peaking at ${pct(rise.peak)} in ${rise.peakYear})` : '') +
    `, while ${end(fall.letter)} fell from ${pct(fall.then)} to ${pct(fall.latest)}. ` +
    `For girls the big change is the fall of ${end(girlFall.letter)}, from ${pct(girlFall.then)} to ${pct(girlFall.latest)}; ` +
    `${end(girlTop.letter)} is now the most common ending, at ${pct(girlTop.latest)}. `;
  // Describe the length trend only as the data shows it.
  const rose = g.peak > g.first + 0.2 && b.peak > b.first + 0.2;
  const eased = g.last < g.peak - 0.2 && b.last < b.peak - 0.2;
  const fell = g.last < g.first - 0.2 && b.last < b.first - 0.2;
  const shape = rose && eased ? 'Names got longer, then shorter again' : rose ? 'Names got longer' : fell ? 'Names got shorter' : 'Name length has changed little';
  text += rose
    ? `${shape}: the average girl’s name peaked at ${g.peak.toFixed(1)} letters in ${g.peakYear} and the average boy’s at ` +
      `${b.peak.toFixed(1)} in ${b.peakYear}, up from ${g.first.toFixed(1)} and ${b.first.toFixed(1)} in ${firstYear}; ` +
      `in ${lastYear} they were ${g.last.toFixed(1)} and ${b.last.toFixed(1)}.`
    : `${shape}: the average girl’s name went from ${g.first.toFixed(1)} letters in ${firstYear} to ${g.last.toFixed(1)} in ${lastYear}, ` +
      `and the average boy’s from ${b.first.toFixed(1)} to ${b.last.toFixed(1)}.`;
  return text;
}

// Table view: every tenth year, length by sex and the top three endings by sex.
export function lettersTableRows(data) {
  const rows = [];
  for (let year = data.lastYear; year >= data.firstYear; year -= year === data.lastYear && year % 10 ? year % 10 : 10) {
    const i = year - data.firstYear;
    const top = (sex) =>
      LETTERS.map((l) => [l, data.last[sex][l][i]])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([l, v]) => `-${l} ${pct(v)}`)
        .join(', ');
    rows.push([year, data.length.F[i].toFixed(2), data.length.M[i].toFixed(2), top('F'), top('M')]);
  }
  return rows;
}
