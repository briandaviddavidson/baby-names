// Legend: swatches carry the color; the label stays in text ink.
// Items are { key, label, color, shape? } with shape 'rect' (default), 'dot' or 'line'.
export const SEX_ITEMS = [
  { key: 'F', label: 'Girls', color: 'var(--girls)' },
  { key: 'M', label: 'Boys', color: 'var(--boys)' },
];

export default function Legend({ items, shape = 'rect' }) {
  return (
    <ul className="legend">
      {items.map((item) => (
        <li key={item.key}>
          <span className={`swatch ${(item.shape ?? shape) === 'rect' ? '' : item.shape ?? shape}`} style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
