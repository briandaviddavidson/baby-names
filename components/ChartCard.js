// Shared frame for every chart: title, subtitle, the chart, its computed takeaway,
// and a table view so no value depends on hovering.
export default function ChartCard({ id, eyebrow, title, subtitle, hint, takeaway, note, table, children }) {
  return (
    <section className="chart" id={id} aria-labelledby={`${id}-title`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={`${id}-title`}>{title}</h2>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {hint && <p className="hint">{hint}</p>}
      {children}
      {takeaway && (
        <p className="takeaway" aria-live="polite">
          {takeaway}
        </p>
      )}
      {note && <p className="note">{note}</p>}
      {table && (
        <details className="table-view">
          <summary>Show as table</summary>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) =>
                      j === 0 ? (
                        <th key={j} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={j}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
