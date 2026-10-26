'use client';

import * as Plot from '@observablehq/plot';
import PlotHost from '../PlotHost.js';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';
import { SEX_LABEL } from '../../lib/series.js';

const pct = (x) => `${Math.round(x * 100)}%`;

// Two panels (top 10, top 100), each with a line per sex by decade, on one
// shared 0–100% axis so the panels compare directly.
export default function LongTailChart({ rows, lastYear }) {
  const ref = usePlot(
    (width, theme) => {
      const lastDecade = Math.floor(lastYear / 10) * 10;
      const narrow = width < 560;
      const label = (d) => (d === lastDecade ? `${d}s*` : `${d}s`);
      const data = rows.map((r) => ({ ...r, panel: `Top ${r.top} names` }));
      const ends = data.filter((r) => r.decade === lastDecade);
      // When the two end labels in a panel are close, push them apart.
      const nudge = (d) => {
        const other = ends.find((e) => e.top === d.top && e.sex !== d.sex);
        if (Math.abs(other.share - d.share) > 0.05) return 0;
        return d.share > other.share || (d.share === other.share && d.sex === 'M') ? -7 : 7;
      };
      const panels = [...new Set(data.map((d) => d.panel))].map((panel) => ({ panel }));
      // Side by side, or stacked on a phone.
      const f = narrow ? { fy: 'panel' } : { fx: 'panel' };
      return Plot.plot({
        ...baseOptions(width, theme),
        height: narrow ? 520 : 320,
        marginLeft: 44,
        marginRight: 44,
        marginTop: 28,
        // Panel titles are drawn inside each panel (below), not as facet axes.
        fx: narrow ? undefined : { axis: null, padding: 0.12 },
        fy: narrow ? { axis: null, padding: 0.2 } : undefined,
        x: { label: null, tickFormat: 'd', ticks: narrow ? 4 : 5 },
        y: { domain: [0, 1], tickFormat: '.0%', ticks: 5, grid: true, label: null },
        color: { domain: ['F', 'M'], range: [theme.sex.F, theme.sex.M] },
        marks: [
          Plot.gridY({ stroke: theme.grid, strokeOpacity: 1 }),
          Plot.ruleY([0], { stroke: theme.axis }),
          Plot.lineY(data, { ...f, x: 'decade', y: 'share', stroke: 'sex', strokeWidth: 2 }),
          Plot.dot(data, { ...f, x: 'decade', y: 'share', fill: 'sex', r: 3.5, stroke: theme.surface, strokeWidth: 1.5 }),
          // Direct labels at the latest decade.
          ...[-7, 0, 7].map((dy) =>
            Plot.text(
              ends.filter((d) => nudge(d) === dy),
              { ...f, x: 'decade', y: 'share', dy, text: (d) => pct(d.share), dx: 8, textAnchor: 'start', fill: theme.textSecondary, fontWeight: 600 },
            ),
          ),
          Plot.text(panels, { ...f, frameAnchor: 'top-left', dy: -18, text: 'panel', fill: theme.text, fontWeight: 600, fontSize: 13 }),
          Plot.tip(
            data,
            Plot.pointer({
              ...f,
              x: 'decade',
              y: 'share',
              ...tipOptions(theme),
              title: (d) => `${label(d.decade)}, ${SEX_LABEL[d.sex]}\n${pct(d.share)} got a top-${d.top} name`,
            }),
          ),
        ],
      });
    },
    [rows, lastYear],
  );
  return (
    <PlotHost
      hostRef={ref}
      label="Line charts of the share of babies given a top-10 and a top-100 name, by decade and sex"
      help="Hover or touch a point to read its value. The same numbers are in the table below."
    />
  );
}
