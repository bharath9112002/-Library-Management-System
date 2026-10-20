import { useState } from 'react'

// Card shell for a chart: title, legend (2+ series), and a chart/table toggle so
// every value is readable without hovering.
export default function ChartCard({ title, subtitle, legend, table, actions, children, className = '' }) {
  const [view, setView] = useState('chart')

  return (
    <section className={`card panel chart-card ${className}`}>
      <div className="chart-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="chart-card-actions">
          {actions}
          {table && (
            <div className="view-toggle" role="group" aria-label="View as">
              {['chart', 'table'].map((v) => (
                <button key={v} type="button" className={view === v ? 'active' : ''} aria-pressed={view === v} onClick={() => setView(v)}>
                  {v === 'chart' ? 'Chart' : 'Table'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {legend?.length > 1 && view === 'chart' && (
        <ul className="chart-legend">
          {legend.map((item) => (
            <li key={item.label}>
              <span className="legend-swatch" style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {view === 'chart' ? children : <div className="chart-table-wrap">{table}</div>}
    </section>
  )
}
