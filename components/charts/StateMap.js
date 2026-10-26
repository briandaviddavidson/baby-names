'use client';

import { interpolateRgb } from 'd3';
import { useEffect, useMemo, useState } from 'react';
import { feature } from 'topojson-client';
import ChartCard from '../ChartCard.js';
import NameSearch from '../NameSearch.js';
import PlotStateMap from './PlotStateMap.js';
import { useTheme } from '../usePlot.js';
import { loadStateTotals, loadStates } from '../../lib/data-client.js';
import { MIN_RANK_COUNT, MIN_STATE_BIRTHS, mainSex, maxPer1000, ranked, stateMapCaption, stateValues } from '../../lib/charts/state-map.js';
import { oneIn } from '../../lib/charts/lookup.js';
import { setName as setSharedName, watchName } from '../../lib/name-param.js';
import { SEX_LABEL, fmt } from '../../lib/series.js';
import { DATA_PATH } from '../../lib/site.js';
import { STATE_BY_FIPS, STATE_NAME } from '../../lib/states.js';

let outlines = null;
function loadOutlines() {
  outlines ??= fetch(`${DATA_PATH}/states-10m.json`)
    .then((res) => res.json())
    .then((topo) => {
      const all = feature(topo, topo.objects.states);
      const features = all.features
        .filter((f) => STATE_BY_FIPS[f.id])
        .map((f) => ({ ...f, properties: { code: STATE_BY_FIPS[f.id].code, name: STATE_BY_FIPS[f.id].name } }));
      return { type: 'FeatureCollection', features };
    });
  return outlines;
}

// Sequential ramp in the sex's color, light to dark, on a square-root scale so
// mid-range states stay distinguishable. States with no reported count get the
// neutral "no data" fill instead.
function colorScale(theme, sex, max) {
  const low = interpolateRgb(theme.surface, theme.sex[sex])(0.1);
  const ramp = interpolateRgb(low, theme.sex[sex]);
  return (per1000) => (per1000 === null ? theme.grid : ramp(Math.min(1, Math.sqrt(per1000 / max))));
}

function Readout({ value, sex, year, name }) {
  if (!value) return <p className="map-readout muted">Hover over or tap a state to see its numbers.</p>;
  const s = SEX_LABEL[sex];
  return (
    <p className="map-readout">
      <strong>{value.name}</strong>, {year}:{' '}
      {value.count
        ? `${fmt(value.count)} ${s} named ${name}, ${oneIn(value.per1000)}${
            value.count < MIN_RANK_COUNT || value.births < MIN_STATE_BIRTHS ? ' (small numbers, so treat with care)' : ''
          }`
        : `fewer than 5 ${s} named ${name}, or none`}
    </p>
  );
}

export default function StateMap({ minStateTotal }) {
  const theme = useTheme();
  const [name, setName] = useState(null);
  const [data, setData] = useState({ status: 'loading' });
  const [sex, setSex] = useState('F');
  const [year, setYear] = useState(null);
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => watchName(setName), []);

  useEffect(() => {
    if (!name) return;
    let live = true;
    setData((d) => ({ ...d, status: 'loading' }));
    Promise.all([loadStates(name), loadStateTotals(), loadOutlines()])
      .then(([entry, totals, geojson]) => {
        if (!live) return;
        if (!entry) {
          setData({ status: 'missing', totals, geojson });
          return;
        }
        setSex(mainSex(entry));
        setYear(totals.lastYear);
        setSelected(null);
        setData({ status: 'ok', name, entry, totals, geojson });
      })
      .catch(() => live && setData({ status: 'error' }));
    return () => {
      live = false;
    };
  }, [name]);

  const ok = data.status === 'ok' || (data.status === 'loading' && data.entry);
  const sexes = ok ? ['F', 'M'].filter((s) => data.entry[s]) : [];
  const shownSex = sexes.includes(sex) ? sex : sexes[0];

  const view = useMemo(() => {
    if (!ok || !theme || year === null) return null;
    const values = stateValues(data.entry, data.totals, shownSex, year);
    const max = maxPer1000(values);
    return { values, byCode: Object.fromEntries(values.map((v) => [v.code, v])), max, color: colorScale(theme, shownSex, max || 1) };
  }, [ok, data, shownSex, year, theme]);

  const focus = hover ?? selected;
  const fill = (code) => view.color(view.byCode[code]?.per1000 ?? null);
  const restyleKey = view && `${data.name}:${shownSex}:${year}:${theme.surface}`;
  const top = view ? ranked(view.values).slice(0, 5) : [];

  return (
    <ChartCard
      id="map"
      eyebrow="06 · Where"
      title={ok ? `Where ${data.name} is most popular` : 'Where a name is most popular'}
      subtitle="Babies given the name per 1,000 babies of the same sex born in each state"
      hint="Search a name, pick a year, and hover over or tap a state."
      takeaway={ok && year !== null ? stateMapCaption(data.name, data.entry, data.totals, shownSex, year) : null}
      note={`State data starts in 1910 and covers names with at least ${fmt(minStateTotal)} babies nationally. SSA leaves out a name in any state and year with fewer than 5 babies (gray). That can leave out over half of a small state’s babies, so each state’s births are estimated from its babies with that year’s 100 most popular names nationally (accurate to roughly 15%). Rankings use only states with at least ${MIN_RANK_COUNT} babies given the name and an estimated ${fmt(MIN_STATE_BIRTHS)} babies of that sex. Colors are scaled to each year’s most popular state, so compare states within a year; for change over time, see the first chart.`}
      table={
        view && {
          columns: ['State', SEX_LABEL[shownSex][0].toUpperCase() + SEX_LABEL[shownSex].slice(1), 'Per 1,000', 'One in'],
          rows: [...view.values]
            .sort((a, b) => (b.per1000 ?? -1) - (a.per1000 ?? -1))
            .map((v) => [v.name, v.count ? fmt(v.count) : '<5', v.per1000 === null ? '–' : v.per1000.toFixed(2), v.per1000 === null ? '–' : fmt(Math.round(1000 / v.per1000))]),
        }
      }
    >
      <NameSearch initial={name ?? ''} onSearch={setSharedName} />
      {data.status === 'missing' && (
        <p className="status">
          No state data for “{name}”. The map covers names given to at least {fmt(minStateTotal)} babies nationally since 1880.
        </p>
      )}
      {data.status === 'error' && <p className="status">Couldn’t load the state data. Check your connection and try again.</p>}
      {ok && view && (
        <>
          <div className="map-controls-row">
            {sexes.length > 1 && (
              <div className="chips" role="group" aria-label="Sex">
                {sexes.map((s) => (
                  <button key={s} type="button" className="chip" aria-pressed={s === shownSex} onClick={() => setSex(s)}>
                    <span className="swatch" style={{ background: `var(--${s === 'F' ? 'girls' : 'boys'})` }} />
                    {SEX_LABEL[s][0].toUpperCase() + SEX_LABEL[s].slice(1)}
                  </button>
                ))}
              </div>
            )}
            <label className="year-slider">
              <span>
                Year <strong>{year}</strong>
              </span>
              <input
                type="range"
                min={data.totals.firstYear}
                max={data.totals.lastYear}
                value={year}
                onChange={(e) => setYear(+e.target.value)}
              />
            </label>
          </div>
          <MapLegend color={view.color} max={view.max} sex={shownSex} />
          <PlotStateMap geojson={data.geojson} fill={fill} restyleKey={restyleKey} focus={focus} onHover={setHover} onSelect={setSelected} />
          <Readout value={focus && view.byCode[focus]} sex={shownSex} year={year} name={data.name} />
          {top.length > 0 && (
            <ol className="top-states">
              {top.map((v) => (
                <li key={v.code}>
                  <button type="button" className="text-button" onClick={() => setSelected(v.code)}>
                    {STATE_NAME[v.code]}
                  </button>{' '}
                  <span>{oneIn(v.per1000)}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </ChartCard>
  );
}

function MapLegend({ color, max, sex }) {
  const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => color(max * t * t));
  return (
    <div className="map-legend" aria-hidden="true">
      <span className="ramp-block">
        <span className="ramp" style={{ background: `linear-gradient(to right, ${stops.join(', ')})` }} />
        <span className="ramp-labels">
          <span>Rarer</span>
          <span>{max ? `${oneIn(max)} ${SEX_LABEL[sex]}` : ''}</span>
        </span>
      </span>
      <span className="no-data">
        <span className="swatch" style={{ background: 'var(--grid)' }} /> Fewer than 5
      </span>
    </div>
  );
}
