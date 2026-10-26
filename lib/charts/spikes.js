// Chart 2: the sharpest one-year jumps in a name's popularity, and whether the
// name kept its new popularity ten years later. Computed in scripts/transform.js
// from the full national data; the page reads the result from insights/spikes.json.
import { SEX_LABEL, fmt } from '../series.js';
import { spikeNote } from './spike-notes.js';

export const SPIKE = {
  // Babies in the spike year, so tiny names jumping from 5 to 50 don't dominate.
  minCount: 1000,
  // At least doubling its share, so a steady name never counts as a spike.
  minRatio: 2,
  // Years with any data, which rules out one-off artifacts like "Christop" (1989
  // only, alongside 53,000 Christophers).
  minYears: 5,
  top: 20,
  // Years before and after the spike shown in each panel.
  before: 5,
  after: 15,
  // Stuck vs faded: the share 10 years on, compared with the peak in the spike
  // year or the 3 years after it.
  laterYears: 10,
  stuckAt: 0.5,
};

// counts: { F: Map(name → Int32Array), M: … }, births: { F: Int32Array, M: … },
// both indexed by year - firstYear.
export function spikes(counts, births, { firstYear, lastYear }) {
  const length = lastYear - firstYear + 1;
  const best = [];
  for (const sex of ['F', 'M']) {
    const total = births[sex];
    for (const [name, c] of counts[sex]) {
      if (c.filter((x) => x > 0).length < SPIKE.minYears) continue;
      let top = null;
      for (let i = 1; i < length; i++) {
        if (c[i] < SPIKE.minCount) continue;
        // A suppressed previous year counts as 5, the most it could have been.
        const prev = Math.max(c[i - 1], 5);
        const ratio = c[i] / total[i] / (prev / total[i - 1]);
        if (ratio >= SPIKE.minRatio && (!top || ratio > top.ratio)) top = { i, ratio };
      }
      if (top) best.push({ name, sex, ...top });
    }
  }
  best.sort((a, b) => b.ratio - a.ratio);
  return best.slice(0, SPIKE.top).map(({ name, sex, i, ratio }) => {
    const c = counts[sex].get(name);
    const share = (j) => (c[j] / births[sex][j]) * 1000;
    let peak = i;
    for (let j = i + 1; j <= Math.min(i + 3, length - 1); j++) if (share(j) > share(peak)) peak = j;
    const later = peak + SPIKE.laterYears;
    const retention = later < length ? share(later) / share(peak) : null;
    const window = [];
    for (let j = Math.max(0, i - SPIKE.before); j <= Math.min(length - 1, i + SPIKE.after); j++) {
      window.push({ offset: j - i, year: firstYear + j, count: c[j], index: Math.round((share(j) / share(peak)) * 1000) / 10 });
    }
    return {
      name,
      sex,
      year: firstYear + i,
      before: c[i - 1],
      count: c[i],
      ratio: Math.round(ratio * 10) / 10,
      peakYear: firstYear + peak,
      peakCount: c[peak],
      retention: retention === null ? null : Math.round(retention * 1000) / 1000,
      status: retention === null ? 'too soon' : retention >= SPIKE.stuckAt ? 'stuck' : 'faded',
      window,
    };
  });
}

const beforeText = (n) => (n ? fmt(n) : 'fewer than 5');
const pct = (x) => `${Math.round(x * 100)}%`;

export function spikesCaption(list) {
  const judged = list.filter((s) => s.status !== 'too soon');
  const faded = judged.filter((s) => s.status === 'faded');
  const top = list[0];
  const kept = [...judged].sort((a, b) => b.retention - a.retention)[0];
  const lead = faded.length > judged.length / 2 ? 'Most spikes don’t last.' : 'Many spikes last.';
  let text =
    `${lead} Of the ${list.length} sharpest one-year jumps, ${judged.length} happened at least ${SPIKE.laterYears} years ago, ` +
    `and ${faded.length} of those had faded to under half their peak popularity a decade later. ` +
    `The sharpest: ${top.name} went from ${beforeText(top.before)} ` +
    `${SEX_LABEL[top.sex]} in ${top.year - 1} to ${fmt(top.count)} in ${top.year}`;
  text += top.retention !== null ? `, and ${SPIKE.laterYears} years later it was given at ${pct(top.retention)} of that rate.` : '.';
  if (kept?.status === 'stuck') {
    const times = kept.retention >= 1.1 ? `${kept.retention.toFixed(1)} times as popular as` : `${pct(kept.retention)} as popular as`;
    text += ` ${kept.name} held on best: in ${kept.peakYear + SPIKE.laterYears} it was ${times} in ${kept.peakYear}.`;
  }
  return text;
}

// Legend colors, matching the chart's theme tokens.
export const STATUS_COLOR = { stuck: 'var(--accent)', faded: 'var(--text-muted)', 'too soon': 'var(--text-primary)' };

export function spikeTableRows(list) {
  return list.map((s, i) => [
    `${i + 1}. ${s.name}`,
    SEX_LABEL[s.sex],
    s.year,
    `${s.before ? fmt(s.before) : '<5'} → ${fmt(s.count)}`,
    `×${fmt(Math.round(s.ratio))}`,
    s.retention === null ? '–' : `${Math.round(s.retention * 100)}%`,
    s.status,
    spikeNote(s) ?? '',
  ]);
}
