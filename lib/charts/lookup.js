// Chart 1: one name's popularity over time, by sex, plus its callouts and caption.
// Runs in the browser on the name the reader searched for.
import { SEXES, SEX_LABEL, at, birthsLookup, fmt, total } from '../series.js';

// A sex is drawn only if it accounts for at least this share of the name's
// babies, so Mary doesn't get a flat line for the few boys named Mary.
export const MIN_SEX_SHARE = 0.02;

export function lookup(name, entry, years) {
  const births = birthsLookup(years);
  const grand = SEXES.reduce((s, sex) => s + total(entry[sex]?.[0]), 0);
  const bySex = [];
  for (const sex of SEXES) {
    const [counts, ranks] = entry[sex] ?? [];
    if (!counts) continue;
    const sum = total(counts);
    const rows = [];
    for (let year = counts[0]; year < counts[0] + counts.length - 1; year++) {
      const count = at(counts, year);
      rows.push({ sex, year, count, rank: at(ranks, year) || null, per1000: (count / births(sex, year)) * 1000 });
    }
    const peak = rows.reduce((a, b) => (b.per1000 > a.per1000 ? b : a));
    const ranked = rows.filter((r) => r.rank);
    const best = ranked.length ? ranked.reduce((a, b) => (b.rank < a.rank ? b : a)) : null;
    const latest = { year: years.lastYear, count: at(counts, years.lastYear), rank: at(ranks, years.lastYear) || null };
    const gaps = rows.filter((r) => r.count === 0).length;
    bySex.push({ sex, total: sum, share: sum / grand, first: counts[0], rows, peak, best, latest, gaps });
  }
  const shown = bySex.filter((s) => s.share >= MIN_SEX_SHARE).sort((a, b) => b.total - a.total);
  const hidden = bySex.filter((s) => s.share < MIN_SEX_SHARE);
  return { name, total: grand, first: Math.min(...bySex.map((s) => s.first)), firstYear: years.firstYear, shown, hidden, lastYear: years.lastYear };
}

const rankText = (rank) => (rank ? `#${fmt(rank)}` : 'outside the top 1,000');

function now(s, name, lastYear) {
  const { count, rank } = s.latest;
  if (!count) return `no ${SEX_LABEL[s.sex]} named ${name} were recorded in ${lastYear} (SSA leaves out fewer than 5)`;
  const vsPeak = s.rows.at(-1).per1000 / s.peak.per1000;
  const trend =
    s.peak.year === lastYear ? 'its peak so far' : vsPeak >= 0.9 ? 'close to its peak' : `${Math.round((1 - vsPeak) * 100)}% below its peak share`;
  return `${fmt(count)} ${SEX_LABEL[s.sex]} got it in ${lastYear} (${rankText(rank)}), ${trend}`;
}

// "1 in every 13 girls": easier to picture than a rate per 1,000.
export const oneIn = (per1000) => `1 in every ${fmt(Math.round(1000 / per1000))}`;

export function lookupCaption({ name, total: grand, first, firstYear, shown, lastYear }) {
  const [main, other] = shown;
  const split = main.share >= 0.98 ? `, almost all of them ${SEX_LABEL[main.sex]}` : `, ${Math.round(main.share * 100)}% of them ${SEX_LABEL[main.sex]}`;
  const peak = main.peak;
  const bestNote =
    main.best && (!peak.rank || main.best.rank < peak.rank) ? `; its best rank was #${fmt(main.best.rank)} in ${main.best.year}` : '';
  const since = first === firstYear ? `since records began in ${first}` : `since ${first}`;
  let text =
    `${fmt(grand)} babies have been named ${name} ${since}${split}. ` +
    `For ${SEX_LABEL[main.sex]} it peaked in ${peak.year}${peak.year === firstYear ? ' (the first year on record)' : ''}, when ${oneIn(peak.per1000)} ${SEX_LABEL[main.sex]} got it` +
    `${peak.rank ? ` (#${fmt(peak.rank)})` : ''}${bestNote}. ` +
    `${capitalize(now(main, name, lastYear))}.`;
  if (other && other.share >= 0.1) {
    text += ` For ${SEX_LABEL[other.sex]} it peaked in ${other.peak.year}${other.peak.rank ? ` (#${fmt(other.peak.rank)})` : ''}; ${now(other, name, lastYear)}.`;
  }
  return text;
}

const capitalize = (s) => s[0].toUpperCase() + s.slice(1);
