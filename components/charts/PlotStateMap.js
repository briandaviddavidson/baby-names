'use client';

import * as Plot from '@observablehq/plot';
import PlotHost from '../PlotHost.js';
import { useEffect, useRef } from 'react';
import { baseOptions, usePlot } from '../usePlot.js';

// Outlines one state, moving its path last so the outline sits above neighbors.
function outline(svg, code) {
  for (const path of svg.querySelectorAll('.states path')) {
    const on = path.dataset.code === code;
    path.classList.toggle('state-focus', on);
    if (on) path.parentNode.appendChild(path);
  }
}

// The state map: states colored by the name's popularity, on the d3-geo Albers
// USA projection (Alaska and Hawaii inset). `fill(code)` gives each state's
// color; `restyleKey` changes whenever the fills do. `focus` is the state to
// outline, updated in place so hovering doesn't redraw the map.
export default function PlotStateMap({ geojson, fill, restyleKey, focus, onHover, onSelect }) {
  const ref = usePlot(
    (width, theme) => {
      const plot = Plot.plot({
        ...baseOptions(width, theme),
        height: Math.round(width * 0.62),
        projection: { type: 'albers-usa', domain: geojson },
        marks: [
          Plot.geo(geojson, { className: 'states', fill: (f) => fill(f.properties.code), stroke: theme.surface, strokeWidth: 0.8 }),
        ],
      });
      plot.addEventListener('pointerleave', () => onHover(null));
      // Plot draws one path per feature, in order, so wire events by index.
      plot.querySelectorAll('.states path').forEach((path, i) => {
        const { code } = geojson.features[i].properties;
        path.style.cursor = 'pointer';
        path.addEventListener('pointerenter', () => onHover(code));
        path.addEventListener('pointerleave', () => onHover(null));
        path.addEventListener('click', () => onSelect(code));
        path.dataset.code = code;
      });
      outline(plot, focusRef.current);
      return plot;
    },
    [geojson, restyleKey],
  );
  const focusRef = useRef(focus);
  focusRef.current = focus;
  useEffect(() => {
    const plot = ref.current?.querySelector('svg');
    if (plot) outline(plot, focus);
  }, [focus, ref]);
  return (
    <PlotHost
      hostRef={ref}
      className="plot-map"
      label="Map of U.S. states colored by how popular the name is"
      help="Hover over or tap a state to read its numbers. The same numbers are in the table below."
    />
  );
}
