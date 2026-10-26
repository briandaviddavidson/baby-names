// Chart 4: the share of babies given one of that year's 10 or 100 most popular
// names, by decade and sex. Computed in scripts/transform.js.

export const TIERS = [10, 100];

// counts: { F: Map(name → Int32Array), M: … }, births: { F: Int32Array, M: … }.
// Each year's top names are that year's own; a decade's share is the sum over its
// years of babies with a top name, over all babies born in those years.
export function longTail(counts, births, { firstYear, lastYear }) {
  const length = lastYear - firstYear + 1;
  const sums = new Map();
  for (const sex of ['F', 'M']) {
    const all = [...counts[sex].values()];
    for (let i = 0; i < length; i++) {
      const year = all.map((c) => c[i]).sort((a, b) => b - a);
      const decade = Math.floor((firstYear + i) / 10) * 10;
      const key = `${sex}:${decade}`;
      if (!sums.has(key)) sums.set(key, { sex, decade, births: 0, names: 0, years: 0, ...Object.fromEntries(TIERS.map((t) => [t, 0])) });
      const s = sums.get(key);
      s.births += births[sex][i];
      s.names += year.filter((c) => c > 0).length;
      s.years += 1;
      for (const t of TIERS) s[t] += year.slice(0, t).reduce((a, b) => a + b, 0);
    }
  }
  return [...sums.values()].flatMap((s) =>
    TIERS.map((top) => ({
      sex: s.sex,
      decade: s.decade,
      top,
      share: Math.round((s[top] / s.births) * 1000) / 1000,
      // Average number of different names given per year in the decade.
      namesPerYear: Math.round(s.names / s.years),
      years: s.years,
    })),
  );
}

const pct = (x) => `${Math.round(x * 100)}%`;
const at = (rows, sex, decade, top) => rows.find((r) => r.sex === sex && r.decade === decade && r.top === top);

export function longTailCaption(rows, { lastYear }) {
  const lastDecade = Math.floor(lastYear / 10) * 10;
  const decades = [...new Set(rows.map((r) => r.decade))].sort((a, b) => a - b);
  const sexes = ['M', 'F'].map((sex) => {
    const top10 = rows.filter((r) => r.sex === sex && r.top === 10);
    const peak = top10.reduce((a, b) => (b.share > a.share ? b : a));
    return { sex, peak, now: at(rows, sex, lastDecade, 10), now100: at(rows, sex, lastDecade, 100), first100: at(rows, sex, decades[0], 100) };
  });
  const [boys, girls] = sexes;
  const halved = sexes.every((s) => s.now.share < s.peak.share / 2);
  return (
    `${halved ? 'Yes.' : 'Somewhat.'} In the ${boys.peak.decade}s, ${pct(boys.peak.share)} of boys got one of that year’s 10 most popular names; ` +
    `in the ${lastDecade}s so far it’s ${pct(boys.now.share)}. For girls the top 10 peaked at ${pct(girls.peak.share)} in the ` +
    `${girls.peak.decade}s and is now ${pct(girls.now.share)}. Even the top 100 now covers only ${pct(boys.now100.share)} of boys and ` +
    `${pct(girls.now100.share)} of girls, down from ${pct(boys.first100.share)} and ${pct(girls.first100.share)} in the ${decades[0]}s.`
  );
}

export function longTailTableRows(rows, { lastYear }) {
  const lastDecade = Math.floor(lastYear / 10) * 10;
  const decades = [...new Set(rows.map((r) => r.decade))].sort((a, b) => a - b);
  return decades.map((d) => [
    d === lastDecade ? `${d}s*` : `${d}s`,
    ...['F', 'M'].flatMap((sex) => TIERS.map((t) => pct(at(rows, sex, d, t).share))),
    ...['F', 'M'].map((sex) => at(rows, sex, d, 10).namesPerYear.toLocaleString('en-US')),
  ]);
}
