// Helpers for the processed series format: [startYear, value, value, …].

export const SEXES = ['F', 'M'];
export const SEX_LABEL = { F: 'girls', M: 'boys' };

// Value for one year, 0 outside the series.
export function at(series, year) {
  if (!series) return 0;
  const i = year - series[0] + 1;
  return i >= 1 && i < series.length ? series[i] : 0;
}

// [{ year, value }] for every year in the series, zeros included.
export function points(series) {
  if (!series) return [];
  return series.slice(1).map((value, i) => ({ year: series[0] + i, value }));
}

export const total = (series) => (series ? series.slice(1).reduce((a, b) => a + b, 0) : 0);

// Yearly totals from years.json, as a lookup: births(sex, year).
export function birthsLookup({ firstYear, births }) {
  return (sex, year) => births[sex][year - firstYear] ?? 0;
}

export const fmt = (n) => n.toLocaleString('en-US');
export const fmt1 = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
