'use client';

import * as Plot from '@observablehq/plot';
import PlotHost from '../PlotHost.js';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';
import { SEX_LABEL, fmt } from '../../lib/series.js';

// Small multiples, one panel per spike in rank order: the name's popularity from
// 5 years before to 15 years after the jump, as a share of its peak (100%).
export default function SpikesChart({ list, before, after }) {
  const ref = usePlot(
    (width, theme) => {
      const cols = width < 480 ? 2 : width < 760 ? 4 : 5;
      const colorOf = { stuck: theme.accent, faded: theme.muted, 'too soon': theme.text };
      const rows = list.flatMap((s, i) =>
        s.window.map((w) => ({ ...w, name: s.name, sex: s.sex, spike: s, col: i % cols, row: Math.floor(i / cols), rank: i + 1 })),
      );
      const panels = list.map((s, i) => ({ ...s, col: i % cols, row: Math.floor(i / cols), rank: i + 1 }));
      const panelHeight = 96;
      return Plot.plot({
        ...baseOptions(width, theme),
        height: Math.ceil(list.length / cols) * (panelHeight + 34) + 24,
        marginLeft: 8,
        marginRight: 8,
        marginTop: 26,
        marginBottom: 24,
        fx: { axis: null, padding: 0.12 },
        fy: { axis: null, padding: 0.32 },
        x: { domain: [-before, after], ticks: [0, 10], tickFormat: (d) => (d === 0 ? 'jump' : `+${d} yrs`), label: null, tickSize: 3 },
        // Clip at 2.5× the peak so a name that kept growing doesn't flatten the rest.
        y: { domain: [0, 250], clamp: true, axis: null },
        marks: [
          Plot.ruleY(panels, { fx: 'col', fy: 'row', y: 0, stroke: theme.axis }),
          Plot.ruleY(panels, { fx: 'col', fy: 'row', y: 100, stroke: theme.grid }),
          Plot.ruleX(panels, { fx: 'col', fy: 'row', x: 0, stroke: theme.grid }),
          Plot.areaY(rows, {
            fx: 'col',
            fy: 'row',
            x: 'offset',
            y: 'index',
            fill: (d) => colorOf[d.spike.status],
            fillOpacity: 0.14,
            curve: 'monotone-x',
          }),
          Plot.lineY(rows, {
            fx: 'col',
            fy: 'row',
            x: 'offset',
            y: 'index',
            stroke: (d) => colorOf[d.spike.status],
            strokeWidth: 2,
            curve: 'monotone-x',
          }),
          // Ten years after the peak: the comparison that decides stuck or faded.
          Plot.dot(
            panels.filter((s) => s.retention !== null),
            {
              fx: 'col',
              fy: 'row',
              x: (s) => s.peakYear - s.year + 10,
              y: (s) => Math.min(s.retention * 100, 250),
              r: 3.5,
              fill: (s) => colorOf[s.status],
              stroke: theme.surface,
              strokeWidth: 1.5,
            },
          ),
          Plot.text(panels, {
            fx: 'col',
            fy: 'row',
            frameAnchor: 'top-left',
            dy: -20,
            text: (s) => `${s.name} · ${s.year}`,
            fill: theme.text,
            fontWeight: 600,
            fontSize: 13,
          }),
          Plot.text(panels, {
            fx: 'col',
            fy: 'row',
            frameAnchor: 'top-left',
            dy: -6,
            text: (s) => `×${fmt(Math.round(s.ratio))} · ${s.status}`,
            fill: theme.textSecondary,
            fontSize: 11,
          }),
          Plot.tip(
            rows,
            Plot.pointerX({
              fx: 'col',
              fy: 'row',
              x: 'offset',
              y: 'index',
              ...tipOptions(theme),
              title: (d) =>
                `${d.name} (${SEX_LABEL[d.sex]}), ${d.year}\n${d.count ? fmt(d.count) : 'Fewer than 5'} babies\n` +
                `${Math.round(d.index)}% of its ${d.spike.peakYear} peak`,
            }),
          ),
        ],
      });
    },
    [list, before, after],
  );
  return (
    <PlotHost
      hostRef={ref}
      label="Small multiples: the 20 sharpest one-year jumps in a baby name's popularity, each shown from 5 years before to 15 years after"
      help="Hover or touch a panel to read each year. The same numbers are in the table below."
    />
  );
}
