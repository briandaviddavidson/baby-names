// Chart 6: where a name is most popular, by state and year. Runs in the browser
// on the searched name's state shard and state-totals.json.
import { at, fmt, SEX_LABEL } from '../series.js';
import { STATES, STATE_NAME } from '../states.js';
import { oneIn } from './lookup.js';

// Rankings and the color scale use only states with at least this many babies
// given the name, so a state where 6 babies got it can't top the list on noise,
// and at least this many estimated births of that sex, since early small-state
// data is very thin (Nevada reported 26 girls in 1910).
export const MIN_RANK_COUNT = 20;
export const MIN_STATE_BIRTHS = 1000;

// The sex to show first: the one with more babies across all states.
export function mainSex(entry) {
  const sum = (sex) => Object.values(entry[sex] ?? {}).reduce((s, series) => s + series.slice(1).reduce((a, b) => a + b, 0), 0);
  return sum('M') > sum('F') ? 'M' : 'F';
}

// The names whose babies estimate a state's births (see estimatedBirths).
export const BASKET_SIZE = 100;

// SSA leaves out every name given to fewer than 5 babies in a state, which in a
// small state can be over half its babies (Wyoming reported 811 girls in 2025,
// about 43% of them), so dividing by the reported total inflates small states'
// shares. Instead, each state's births are estimated from the babies given that
// year's 100 most popular names nationally, which are almost never suppressed:
// births ≈ state basket ÷ the basket's national share of births.
// counts and states are the transform's national and state data.
export function baskets(national, state, sexes = ['F', 'M']) {
  const out = { size: BASKET_SIZE, share: {}, births: {} };
  for (const sex of sexes) {
    out.share[sex] = [];
    for (let year = state.firstYear; year <= state.lastYear; year++) {
      const i = year - national.firstYear;
      const j = year - state.firstYear;
      const ranked = [...national.counts[sex]].sort((a, b) => b[1][i] - a[1][i]).slice(0, BASKET_SIZE);
      const total = [...national.counts[sex].values()].reduce((s, c) => s + c[i], 0);
      const share = ranked.reduce((s, [, c]) => s + c[i], 0) / total;
      out.share[sex].push(Math.round(share * 10000) / 10000);
      for (const [code, bySex] of Object.entries(state.states)) {
        out.births[code] ??= {};
        out.births[code][sex] ??= [];
        const basket = ranked.reduce((s, [name]) => s + (bySex[sex].get(name)?.[j] ?? 0), 0);
        out.births[code][sex].push(Math.round(basket / share));
      }
    }
  }
  return out;
}

// Babies per 1,000 of the same sex in each state for one year, against the
// estimated births. A state with no reported count gets count 0 and per1000
// null (fewer than 5, or none).
export function stateValues(entry, totals, sex, year) {
  const i = year - totals.firstYear;
  return STATES.map(({ code, name }) => {
    const count = at(entry[sex]?.[code], year);
    const births = totals.estimated[code]?.[sex][i] ?? 0;
    return { code, name, count, births, per1000: count && births ? (count / births) * 1000 : null };
  });
}

// The color domain for one year: the highest share among states that count
// for rankings. Scaled per year, since early state data is too thin to compare
// across decades; smaller states above it are clamped.
export function maxPer1000(values) {
  return Math.max(0, ...ranked(values).map((v) => v.per1000));
}

// States that count for rankings, most popular first.
export const ranked = (values) =>
  values.filter((v) => v.per1000 !== null && v.count >= MIN_RANK_COUNT && v.births >= MIN_STATE_BIRTHS).sort((a, b) => b.per1000 - a.per1000);

// The year a name was most popular nationally among the state data's years,
// measured as babies over births summed across the states.
export function peakYear(entry, totals, sex) {
  let best = null;
  for (let year = totals.firstYear; year <= totals.lastYear; year++) {
    const values = stateValues(entry, totals, sex, year);
    const count = values.reduce((s, v) => s + v.count, 0);
    const births = STATES.reduce((s, { code }) => s + (totals.estimated[code]?.[sex][year - totals.firstYear] ?? 0), 0);
    const share = births ? count / births : 0;
    if (!best || share > best.share) best = { year, share };
  }
  return best.year;
}

export function stateMapCaption(name, entry, totals, sex, year) {
  const s = SEX_LABEL[sex];
  const values = stateValues(entry, totals, sex, year);
  const list = ranked(values);
  const reported = values.filter((v) => v.count).length;
  if (!list.length) {
    return reported
      ? `In ${year}, no state had ${MIN_RANK_COUNT} or more ${s} named ${name} (and ${fmt(MIN_STATE_BIRTHS)} or more ${s} born), too few to compare states reliably.`
      : `No state reported 5 or more ${s} named ${name} in ${year}.`;
  }
  const [top] = list;
  const low = list.at(-1);
  let text =
    `In ${year}, among the ${list.length} state${list.length === 1 ? '' : 's'} with at least ${MIN_RANK_COUNT} ${s} named ${name}, ` +
    `it was most popular in ${top.name} (${oneIn(top.per1000)} ${s}, ${fmt(top.count)} babies)` +
    (list.length > 1 ? ` and least popular in ${low.name} (${oneIn(low.per1000)}), a ${(top.per1000 / low.per1000).toFixed(1)}-fold gap.` : '.');
  const peak = peakYear(entry, totals, sex);
  if (peak !== year) {
    const [then] = ranked(stateValues(entry, totals, sex, peak));
    if (then) {
      text +=
        then.code === top.code
          ? ` ${top.name} also led in ${peak}, the name’s peak year for ${s} in the state data.`
          : ` In ${peak}, the name’s peak year for ${s} in the state data, ${STATE_NAME[then.code]} led.`;
    }
  }
  return text;
}
