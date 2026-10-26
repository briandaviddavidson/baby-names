'use client';

import { useEffect, useRef } from 'react';
import { attachKeyboard } from './plotKeyboard.js';

// Reads the chart tokens off :root so Plot gets real colors (SVG attributes can't
// take var()). Re-read on every render, so a theme change repaints correctly.
export function readTheme() {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  return {
    surface: v('--surface'),
    text: v('--text-primary'),
    textSecondary: v('--text-secondary'),
    muted: v('--text-muted'),
    grid: v('--grid'),
    axis: v('--axis'),
    highlight: v('--highlight'),
    accent: v('--accent'),
    sex: { F: v('--girls'), M: v('--boys') },
  };
}

// Renders an Observable Plot figure into a div, and re-renders when the container
// resizes or the color scheme changes. `build(width, theme)` returns the plot.
// `onSelect`, if given, gets the datum under the pointer (the mark with the tip) on click,
// or under the keyboard focus on Enter; marks with className 'kbd-target' are focusable.
// `layout` is the keyboard layout ('columns' or 'rows', see plotKeyboard.js).
export function usePlot(build, deps, onSelect, { layout } = {}) {
  const ref = useRef(null);
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastWidth = 0;
    let plot = null;
    const live = el.parentElement.querySelector('[data-live]');
    const keyboard = select.current
      ? attachKeyboard(el, () => plot, {
          layout,
          onSelect: (v) => select.current?.(v),
          announce: (text) => {
            if (live) live.textContent = text;
          },
        })
      : null;
    // A click selects, so don't let Plot pin ("stick") its tooltip too.
    const noSticky = (e) => e.stopPropagation();
    el.addEventListener('pointerdown', noSticky, true);
    const render = () => {
      const width = Math.floor(el.clientWidth);
      if (!width) return;
      lastWidth = width;
      plot = build(width, readTheme());
      keyboard?.reset();
      if (select.current) {
        plot.addEventListener('input', () => {
          plot.style.cursor = plot.value ? 'pointer' : '';
        });
        plot.addEventListener('click', () => {
          if (plot.value) select.current?.(plot.value);
        });
      }
      el.replaceChildren(plot);
    };
    render();

    const resize = new ResizeObserver(() => {
      if (Math.floor(el.clientWidth) !== lastWidth) render();
    });
    resize.observe(el);
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', render);
    return () => {
      keyboard?.detach();
      el.removeEventListener('pointerdown', noSticky, true);
      resize.disconnect();
      scheme.removeEventListener('change', render);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

// Shared Plot defaults: recessive axes and grid, text in text tokens.
export function baseOptions(width, theme) {
  return {
    width,
    style: { background: 'transparent', color: theme.textSecondary, fontFamily: 'inherit', fontSize: '12px', overflow: 'visible' },
    marginTop: 8,
  };
}

export function tipOptions(theme) {
  return { fill: theme.surface, stroke: theme.axis, textPadding: 8 };
}
