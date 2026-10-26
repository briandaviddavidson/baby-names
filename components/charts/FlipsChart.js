'use client';

import * as Plot from '@observablehq/plot';
import PlotHost from '../PlotHost.js';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';
import { SEX_LABEL } from '../../lib/series.js';

const pct = (x) => `${Math.round(x * 100)}%`;

// One row per flip, in order of the year it crossed 50%: a bar from the last year
// the name was mostly the old sex to the first year it was mostly the new one,
// colored by the sex it became, with a dot at the crossing.
export default function FlipsChart({ list, firstYear, lastYear }) {
  const ref = usePlot(
    (width, theme) => {
      const rows = list.map((d) => ({ ...d, key: `${d.name} ${d.to}` }));
      const label = (key) => {
        const d = rows.find((r) => r.key === key);
        // Jaime flipped both ways; mark the second row so the labels differ.
        return rows.filter((r) => r.name === d.name).length > 1 ? `${d.name} (to ${SEX_LABEL[d.to]})` : d.name;
      };
      return Plot.plot({
        ...baseOptions(width, theme),
        height: rows.length * 26 + 40,
        marginLeft: width < 500 ? 96 : 120,
        marginRight: 12,
        x: { domain: [Math.floor(Math.min(...rows.map((d) => d.left)) / 10) * 10, lastYear], tickFormat: 'd', ticks: width < 500 ? 4 : 8, label: null, grid: true },
        y: { domain: rows.map((d) => d.key), tickFormat: label, label: null, tickSize: 0 },
        color: { domain: ['F', 'M'], range: [theme.sex.F, theme.sex.M] },
        marks: [
          Plot.gridX({ stroke: theme.grid, strokeOpacity: 1 }),
          Plot.ruleY(rows, { x1: 'left', x2: 'reached', y: 'key', stroke: 'to', strokeWidth: 6, strokeLinecap: 'round', strokeOpacity: 0.35 }),
          Plot.dot(rows, {
            x: 'cross',
            y: 'key',
            fill: 'to',
            r: 5,
            stroke: theme.surface,
            strokeWidth: 2,
            tip: tipOptions(theme),
            title: (d) =>
              `${d.name}: ${SEX_LABEL[d.to === 'F' ? 'M' : 'F']} → ${SEX_LABEL[d.to]}\n` +
              `Last mostly ${SEX_LABEL[d.to === 'F' ? 'M' : 'F']}: ${d.left}\nCrossed 50%: ${d.cross}\nFirst mostly ${SEX_LABEL[d.to]}: ${d.reached}\n` +
              `${pct(d.latestShare)} girls in ${d.latestYear}`,
          }),
        ],
      });
    },
    [list, firstYear, lastYear],
  );
  return (
    <PlotHost
      hostRef={ref}
      label="Timeline of baby names that flipped between boys and girls, one row per name"
      help="Hover or touch a dot to read a name's flip. The same numbers are in the table below."
    />
  );
}
