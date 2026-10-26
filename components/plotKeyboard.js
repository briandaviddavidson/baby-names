// Keyboard navigation for a rendered Plot chart. The chart is one Tab stop; arrow keys
// move a focus ring between the marks drawn with className 'kbd-target', and each move
// sends Plot a pointer event at that mark, so Plot's own tooltip (and plot.value) follow
// the keyboard exactly as they follow the mouse. Enter or Space selects.
//
// Layouts:
//   'columns' (default): Left/Right step between x positions (decades, years), Up/Down
//                        move within one (stacked segments, same-year dots).
//   'rows':              Up/Down step through marks top to bottom (one per row).
// Small multiples: Page Up/Page Down jump between panels.

const pointer = (type, x, y) => new PointerEvent(type, { clientX: x, clientY: y, pointerType: 'mouse', bubbles: true });
const center = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

// Groups marks by panel (Plot nests each facet in its own <g>), then into columns.
function buildIndex(plot, layout) {
  const els = [...plot.querySelectorAll('.kbd-target rect, .kbd-target circle')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  const byPanel = new Map();
  for (const el of els) {
    const panel = el.parentElement;
    if (!byPanel.has(panel)) byPanel.set(panel, []);
    byPanel.get(panel).push({ el, ...center(el) });
  }
  const panels = [...byPanel.entries()]
    .map(([panel, marks]) => {
      // The panel's own offset in the chart (Plot translates each facet), not the extent
      // of its marks, gives reading order.
      const { e: left, f: top } = panel.getCTM();
      let columns;
      if (layout === 'rows') {
        columns = [marks.sort((a, b) => a.y - b.y)];
      } else {
        const cols = new Map();
        for (const m of marks) {
          const key = Math.round(m.x);
          if (!cols.has(key)) cols.set(key, []);
          cols.get(key).push(m);
        }
        columns = [...cols.entries()].sort((a, b) => a[0] - b[0]).map(([, col]) => col.sort((a, b) => a.y - b.y));
      }
      return { top: Math.round(top), left: Math.round(left), columns };
    })
    .sort((a, b) => a.top - b.top || a.left - b.left);
  return panels;
}

const nearest = (list, value, pick) =>
  list.reduce((best, item, i) => (Math.abs(pick(item) - value) < Math.abs(pick(list[best]) - value) ? i : best), 0);

// Reads Plot's tooltip text, one line per <tspan>, for the live region.
function tipText(plot) {
  const tip = plot.querySelector('[aria-label="tip"]');
  if (!tip) return '';
  // Plot pads tooltip lines with zero-width spaces; screen readers don't need them.
  const clean = (t) => t.replace(/\u200b/g, '').trim();
  const lines = [...tip.querySelectorAll('tspan')].map((t) => clean(t.textContent)).filter(Boolean);
  return lines.length ? lines.join(', ') : clean(tip.textContent);
}

export function attachKeyboard(host, getPlot, { onSelect, announce, layout = 'columns' }) {
  let panels = [];
  let at = null; // { p, c, r }
  let focusedEl = null;

  const reset = () => {
    panels = [];
    at = null;
    focusedEl = null;
  };

  const show = () => {
    const plot = getPlot();
    const mark = panels[at.p].columns[at.c][at.r];
    focusedEl?.classList.remove('kbd-focus');
    focusedEl = mark.el;
    focusedEl.classList.add('kbd-focus');
    const { x, y } = center(mark.el);
    plot.dispatchEvent(pointer('pointermove', x, y));
    const position = panels.length > 1 ? `, panel ${at.p + 1} of ${panels.length}` : '';
    // The first tooltip is drawn a frame after the pointer event; read it after that.
    requestAnimationFrame(() => announce(`${tipText(plot)}${position}`));
  };

  const move = (key) => {
    const columns = panels[at.p].columns;
    const col = columns[at.c];
    const y = col[at.r].y;
    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        const step = key === 'ArrowLeft' ? -1 : 1;
        if (layout === 'rows') return move(step < 0 ? 'ArrowUp' : 'ArrowDown');
        const c = Math.min(Math.max(at.c + step, 0), columns.length - 1);
        at = { ...at, c, r: nearest(columns[c], y, (m) => m.y) };
        break;
      }
      case 'ArrowUp':
        at = { ...at, r: Math.max(at.r - 1, 0) };
        break;
      case 'ArrowDown':
        at = { ...at, r: Math.min(at.r + 1, col.length - 1) };
        break;
      case 'Home':
        at = { ...at, c: 0, r: layout === 'rows' ? 0 : columns[0].length - 1 };
        break;
      case 'End': {
        const c = columns.length - 1;
        at = { ...at, c, r: columns[c].length - 1 };
        break;
      }
      case 'PageUp':
      case 'PageDown': {
        const p = Math.min(Math.max(at.p + (key === 'PageUp' ? -1 : 1), 0), panels.length - 1);
        const x = col[at.r].x - panels[at.p].left;
        const c = nearest(panels[p].columns, x, (column) => column[0].x - panels[p].left);
        at = { p, c, r: panels[p].columns[c].length - 1 };
        break;
      }
      default:
        return false;
    }
    show();
    return true;
  };

  const onKeyDown = (e) => {
    if (!panels.length) return;
    if (e.key === 'Enter' || e.key === ' ') {
      const value = getPlot().value;
      if (value) {
        e.preventDefault();
        onSelect(value);
      }
      return;
    }
    if (e.key === 'Escape') {
      blur();
      return;
    }
    if (move(e.key)) e.preventDefault();
  };

  const focus = () => {
    if (!panels.length) panels = buildIndex(getPlot(), layout);
    if (!panels.length) return;
    // Start at the first mark: bottom of the first column, or the top row.
    at ??= { p: 0, c: 0, r: layout === 'rows' ? 0 : panels[0].columns[0].length - 1 };
    show();
  };

  const blur = () => {
    focusedEl?.classList.remove('kbd-focus');
    focusedEl = null;
    const plot = getPlot();
    plot?.dispatchEvent(pointer('pointerleave', 0, 0));
    announce('');
  };

  host.addEventListener('keydown', onKeyDown);
  host.addEventListener('focus', focus);
  host.addEventListener('blur', blur);
  return {
    // Call after each re-render: positions and elements have changed.
    reset,
    detach() {
      host.removeEventListener('keydown', onKeyDown);
      host.removeEventListener('focus', focus);
      host.removeEventListener('blur', blur);
    },
  };
}
