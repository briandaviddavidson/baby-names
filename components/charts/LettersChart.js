'use client';

import * as Plot from '@observablehq/plot';
import PlotHost from '../PlotHost.js';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';
import { LETTERS } from '../../lib/charts/letters.js';
import { SEX_LABEL } from '../../lib/series.js';

const pct = (x) => `${(x * 100).toFixed(1)}%`;
// Letters drawn in a heatmap: those that were ever this share of a sex's babies.
const MIN_LETTER_SHARE = 0.01;

function LengthChart({ data }) {
  const ref = usePlot(
    (width, theme) => {
      const rows = ['F', 'M'].flatMap((sex) => data.length[sex].map((v, i) => ({ sex, year: data.firstYear + i, letters: v })));
      return Plot.plot({
        ...baseOptions(width, theme),
        height: 240,
        marginLeft: 36,
        marginRight: 16,
        x: { label: null, tickFormat: 'd', ticks: width < 500 ? 4 : 10 },
        y: { label: null, grid: true, ticks: 4, domain: [5, 6.6] },
        color: { domain: ['F', 'M'], range: [theme.sex.F, theme.sex.M] },
        marks: [
          Plot.gridY({ stroke: theme.grid, strokeOpacity: 1 }),
          Plot.lineY(rows, { x: 'year', y: 'letters', stroke: 'sex', strokeWidth: 2 }),
          Plot.ruleX(rows, Plot.pointerX({ x: 'year', stroke: theme.axis })),
          Plot.tip(
            rows,
            Plot.pointerX({
              x: 'year',
              y: 'letters',
              ...tipOptions(theme),
              title: (d) => `${d.year}, ${SEX_LABEL[d.sex]}\n${d.letters.toFixed(2)} letters on average`,
            }),
          ),
        ],
      });
    },
    [data],
  );
  return (
    <PlotHost
      hostRef={ref}
      className="plot-short"
      label="Line chart of the average length of baby names by year, for girls and boys"
      help="Hover or touch the chart to read a year. The same numbers are in the table below."
    />
  );
}

function LetterHeatmap({ data, sex }) {
  const ref = usePlot(
    (width, theme) => {
      const shown = LETTERS.filter((l) => Math.max(...data.last[sex][l]) >= MIN_LETTER_SHARE);
      const cells = shown.flatMap((letter) => data.last[sex][letter].map((share, i) => ({ letter, year: data.firstYear + i, share })));
      const max = Math.max(...cells.map((c) => c.share));
      return Plot.plot({
        ...baseOptions(width, theme),
        height: shown.length * 16 + 70,
        marginLeft: 28,
        marginRight: 12,
        marginTop: 8,
        x: { label: null, tickFormat: 'd', ticks: width < 500 ? 4 : 10, domain: [data.firstYear, data.lastYear + 1] },
        y: { domain: shown, tickFormat: (l) => `-${l}`, label: null, tickSize: 0 },
        // One hue, light to dark; square-root so the many small shares stay visible.
        color: { type: 'sqrt', domain: [0, max], range: [theme.surface, theme.sex[sex]], legend: true, tickFormat: '.0%', label: `Share of ${SEX_LABEL[sex]}`, width: Math.min(width, 280) },
        marks: [
          // crispEdges avoids hairline seams between adjacent year cells.
          Plot.rect(cells, { x1: 'year', x2: (d) => d.year + 1, y: 'letter', fill: 'share', inset: 0, shapeRendering: 'crispEdges' }),
          Plot.tip(
            cells,
            Plot.pointer({
              x: (d) => d.year + 0.5,
              y: 'letter',
              ...tipOptions(theme),
              title: (d) => `${d.year}, ${SEX_LABEL[sex]}\n${pct(d.share)} of names end in “-${d.letter}”`,
            }),
          ),
        ],
      });
    },
    [data, sex],
  );
  return (
    <PlotHost
      hostRef={ref}
      label={`Heatmap of the last letter of ${SEX_LABEL[sex]}' names by year`}
      help="Hover or touch a cell to read its share. The same numbers are in the table below."
    />
  );
}

export default function LettersChart({ data }) {
  return (
    <div className="chart-stack">
      <h3>Average letters per name</h3>
      <LengthChart data={data} />
      <h3>Last letter of boys’ names</h3>
      <LetterHeatmap data={data} sex="M" />
      <h3>Last letter of girls’ names</h3>
      <LetterHeatmap data={data} sex="F" />
    </div>
  );
}
