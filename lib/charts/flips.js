// Chart 3: names that moved from mostly boys to mostly girls, or the reverse.
// Computed in scripts/transform.js from the full national data.
import { SEX_LABEL, fmt } from '../series.js';

export const FLIP = {
  // Share of girls is smoothed over 5 years, and only judged in years when the
  // name averaged at least this many babies, so tiny counts don't flip-flop.
  window: 5,
  minPerYear: 100,
  // "Mostly" one sex: under 30% or over 70% girls.
  low: 0.3,
  high: 0.7,
  // Babies of the old sex before the 50% crossing, and of the new sex after it.
  minSide: 10000,
};

// counts: { F: Map(name → Int32Array), M: … }, indexed by year - firstYear.
export function flips(counts, { firstYear, lastYear }) {
  const length = lastYear - firstYear + 1;
  const half = Math.floor(FLIP.window / 2);
  const out = [];
  for (const [name, f] of counts.F) {
    const m = counts.M.get(name);
    if (!m) continue;
    const share = [];
    for (let i = 0; i < length; i++) {
      let girls = 0;
      let all = 0;
      for (let j = Math.max(0, i - half); j <= Math.min(length - 1, i + half); j++) {
        girls += f[j];
        all += f[j] + m[j];
      }
      share.push(all / FLIP.window >= FLIP.minPerYear ? girls / all : null);
    }
    for (const to of ['F', 'M']) {
      const old = (s) => s !== null && (to === 'F' ? s < FLIP.low : s > FLIP.high);
      const now = (s) => s !== null && (to === 'F' ? s > FLIP.high : s < FLIP.low);
      const past = (s) => s !== null && (to === 'F' ? s >= 0.5 : s <= 0.5);
      // First year mostly the new sex after having been mostly the old one.
      const reached = share.findIndex((s, i) => now(s) && share.slice(0, i).some(old));
      if (reached < 0) continue;
      let left = reached;
      while (!old(share[left])) left--;
      let cross = left;
      while (!past(share[cross])) cross++;
      const [oldCounts, newCounts] = to === 'F' ? [m, f] : [f, m];
      let before = 0;
      let after = 0;
      for (let i = 0; i < length; i++) {
        if (i < cross) before += oldCounts[i];
        else after += newCounts[i];
      }
      if (Math.min(before, after) < FLIP.minSide) continue;
      const latest = share.findLast((s) => s !== null);
      out.push({
        name,
        to,
        left: firstYear + left,
        cross: firstYear + cross,
        reached: firstYear + reached,
        before,
        after,
        // Girls' share in the latest year with enough babies to judge, and that year.
        latestShare: Math.round(latest * 1000) / 1000,
        latestYear: firstYear + share.lastIndexOf(latest),
        series: share.map((s, i) => (s === null ? null : { year: firstYear + i, girls: Math.round(s * 1000) / 1000 })).filter(Boolean),
      });
    }
  }
  return out.sort((a, b) => a.cross - b.cross || a.name.localeCompare(b.name));
}

const pct = (x) => `${Math.round(x * 100)}%`;
const years = (n) => `${n} year${n === 1 ? '' : 's'}`;

export function flipsCaption(list, { lastYear }) {
  const toGirls = list.filter((d) => d.to === 'F');
  const toBoys = list.filter((d) => d.to === 'M');
  const fastest = [...list].sort((a, b) => a.reached - a.left - (b.reached - b.left) || a.cross - b.cross)[0];
  const durations = list.map((d) => d.reached - d.left).sort((a, b) => a - b);
  const median = durations[Math.floor(durations.length / 2)];
  const current = toGirls.filter((d) => d.latestYear === lastYear);
  const stillGirls = current.filter((d) => d.latestShare > 0.5);
  const lead = toGirls.length >= 2 * toBoys.length ? 'Names mostly move from boys to girls: of' : 'Of';
  let text =
    `${lead} the ${list.length} names that flipped with real numbers on both sides, ` +
    `${toGirls.length} went from boys to girls and ${toBoys.length} from girls to boys. ` +
    `A typical flip took ${years(median)} to go from mostly one to mostly the other; ` +
    `${fastest.name} took ${years(fastest.reached - fastest.left)} (${fastest.left}–${fastest.reached}). `;
  if (current.length) {
    text += `Of the ${current.length} boys-to-girls names still given widely in ${lastYear}, ${stillGirls.length} are still majority girls.`;
  }
  return text;
}

export function flipTableRows(list) {
  return list.map((d) => [
    d.name,
    `${SEX_LABEL[d.to === 'F' ? 'M' : 'F']} → ${SEX_LABEL[d.to]}`,
    d.left,
    d.cross,
    d.reached,
    fmt(d.before),
    fmt(d.after),
    `${pct(d.latestShare)} (${d.latestYear})`,
  ]);
}
