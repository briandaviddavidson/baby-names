'use client';

import * as Plot from '@observablehq/plot';
import { useEffect, useState } from 'react';
import ChartCard from '../ChartCard.js';
import Legend, { SEX_ITEMS } from '../Legend.js';
import NameSearch from '../NameSearch.js';
import PlotHost from '../PlotHost.js';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';
import { loadName, loadYears } from '../../lib/data-client.js';
import { setName as setSharedName, watchName } from '../../lib/name-param.js';
import { lookup, lookupCaption, oneIn } from '../../lib/charts/lookup.js';
import { SEX_LABEL, fmt } from '../../lib/series.js';

const tipLine = (d) => {
  const sex = SEX_LABEL[d.sex][0].toUpperCase() + SEX_LABEL[d.sex].slice(1);
  if (!d.count) return `${sex}: fewer than 5 or none`;
  return `${sex}: ${fmt(d.count)} (${oneIn(d.per1000)})${d.rank ? `, #${fmt(d.rank)}` : ''}`;
};

function byYear(data) {
  const years = new Map();
  for (const s of data.shown) {
    for (const r of s.rows) {
      if (!years.has(r.year)) years.set(r.year, { year: r.year, per1000: 0, rows: [] });
      const y = years.get(r.year);
      y.rows.push(r);
      y.per1000 = Math.max(y.per1000, r.per1000);
    }
  }
  return [...years.values()];
}

const edge = (d, data) => (d.year < data.firstYear + 15 ? 'start' : d.year > data.lastYear - 15 ? 'end' : 'middle');

function edgeLabels(peaks, data, theme) {
  return ['start', 'end'].map((side) =>
    Plot.text(
      peaks.filter((d) => edge(d, data) === side),
      {
        x: 'year',
        y: 'per1000',
        text: (d) => `Peak ${d.year}`,
        fill: theme.textSecondary,
        fontWeight: 600,
        textAnchor: side,
        dx: side === 'start' ? 10 : -10,
      },
    ),
  );
}

function LookupChart({ data }) {
  const ref = usePlot(
    (width, theme) => {
      const rows = data.shown.flatMap((s) => s.rows);
      const peaks = data.shown.map((s) => s.peak);
      return Plot.plot({
        ...baseOptions(width, theme),
        height: width < 500 ? 280 : 340,
        marginLeft: 40,
        marginRight: 16,
        // Room above the highest peak for its label.
        marginTop: 28,
        x: { label: null, tickFormat: 'd', ticks: width < 500 ? 4 : 10, domain: [data.firstYear, data.lastYear] },
        // The subtitle names the unit, so the axis needs no label.
        y: { label: null, grid: true, ticks: 5, nice: true },
        color: { domain: ['F', 'M'], range: [theme.sex.F, theme.sex.M] },
        marks: [
          Plot.gridY({ stroke: theme.grid, strokeOpacity: 1 }),
          Plot.ruleY([0], { stroke: theme.axis }),
          Plot.lineY(rows, { x: 'year', y: 'per1000', z: 'sex', stroke: 'sex', strokeWidth: 2, curve: 'monotone-x' }),
          Plot.ruleX(rows, Plot.pointerX({ x: 'year', stroke: theme.axis })),
          Plot.dot(peaks, { x: 'year', y: 'per1000', fill: 'sex', r: 4.5, stroke: theme.surface, strokeWidth: 2 }),
          // Near the edges the label sits beside the dot, so it stays inside the plot.
          ...edgeLabels(peaks, data, theme),
          Plot.text(peaks.filter((d) => edge(d, data) === 'middle'), {
            x: 'year',
            y: 'per1000',
            text: (d) => `Peak ${d.year}`,
            fill: theme.textSecondary,
            fontWeight: 600,
            textAnchor: 'middle',
            dy: -12,
          }),
          // One tooltip per year with every drawn sex, anchored at the higher line.
          Plot.tip(
            byYear(data),
            Plot.pointerX({
              x: 'year',
              y: 'per1000',
              ...tipOptions(theme),
              title: (d) => [d.year, ...d.rows.map(tipLine)].join('\n'),
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
      label={`Line chart of babies named ${data.name} per 1,000 births, ${data.firstYear} to ${data.lastYear}`}
      help="Hover or touch the chart to read each year. The same numbers are in the table below."
    />
  );
}

function Stats({ data }) {
  const [main] = data.shown;
  const s = SEX_LABEL[main.sex];
  return (
    <ul className="stat-row">
      <li>
        <strong>{main.peak.year}</strong>
        <span>
          peak year for {s}, {oneIn(main.peak.per1000)}
        </span>
      </li>
      <li>
        <strong>{main.best ? `#${fmt(main.best.rank)}` : '–'}</strong>
        <span>{main.best ? `best rank for ${s}, ${main.best.year}` : `never in the top 1,000 for ${s}`}</span>
      </li>
      <li>
        <strong>{fmt(main.latest.count)}</strong>
        <span>
          {s} in {data.lastYear}
          {main.latest.rank ? `, #${fmt(main.latest.rank)}` : ''}
        </span>
      </li>
      <li>
        <strong>{fmt(data.total)}</strong>
        <span>babies in all, since {data.first}</span>
      </li>
    </ul>
  );
}

export default function NameLookup({ firstYear, lastYear, minTotal }) {
  const [name, setName] = useState(null);
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => watchName(setName), []);

  useEffect(() => {
    if (!name) return;
    let live = true;
    setState((s) => ({ ...s, status: 'loading' }));
    Promise.all([loadName(name), loadYears()])
      .then(([entry, years]) => {
        if (!live) return;
        setState(entry ? { status: 'ok', data: lookup(name, entry, years) } : { status: 'missing' });
      })
      .catch(() => live && setState({ status: 'error' }));
    return () => {
      live = false;
    };
  }, [name]);

  const data = state.data && { ...state.data, firstYear, lastYear };
  const ok = state.status === 'ok' || (state.status === 'loading' && data);

  return (
    <ChartCard
      id="lookup"
      eyebrow="01 · Any name"
      title={ok ? `${data.name}, ${firstYear}–${lastYear}` : 'Look up a name'}
      subtitle="Babies given the name per 1,000 babies of the same sex, by year"
      hint="Type a name and pick it from the list, or press Enter. Hover or touch the chart to read a year."
      takeaway={ok ? lookupCaption(data) : null}
      note={
        <>
          SSA leaves out a name in any year fewer than 5 babies of one sex got it, so rare names drop to zero in those
          years. Names with fewer than {fmt(minTotal)} babies in all aren't included.
          {ok &&
            data.hidden.map((h) => (
              <span key={h.sex}>
                {' '}
                Not drawn: the {fmt(h.total)} {SEX_LABEL[h.sex]} named {data.name} ({((h.total / data.total) * 100).toFixed(1)}%).
              </span>
            ))}
        </>
      }
      table={
        ok && {
          columns: ['Year', 'Girls', 'Girls rank', 'Boys', 'Boys rank'],
          rows: yearRows(data),
        }
      }
    >
      <NameSearch initial={name ?? ''} onSearch={setSharedName} />
      {state.status === 'missing' && (
        <p className="status">
          No “{name}” in the data. Either fewer than {fmt(minTotal)} babies have had it since {firstYear}, or SSA spells
          it differently: names are letters only, with no spaces, hyphens or accents.
        </p>
      )}
      {state.status === 'error' && <p className="status">Couldn’t load the name data. Check your connection and try again.</p>}
      {ok && (
        <>
          <Stats data={data} />
          <Legend items={SEX_ITEMS.filter((i) => data.shown.some((s) => s.sex === i.key))} shape="line" />
          <LookupChart data={data} />
        </>
      )}
    </ChartCard>
  );
}

function yearRows(data) {
  const bySex = Object.fromEntries(data.shown.concat(data.hidden).map((s) => [s.sex, new Map(s.rows.map((r) => [r.year, r]))]));
  const rows = [];
  for (let year = data.lastYear; year >= data.first; year--) {
    const cell = (sex, key) => {
      const r = bySex[sex]?.get(year);
      return r?.[key] ? fmt(r[key]) : '–';
    };
    rows.push([year, cell('F', 'count'), cell('F', 'rank'), cell('M', 'count'), cell('M', 'rank')]);
  }
  return rows;
}
