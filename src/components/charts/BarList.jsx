import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SERIES_COLORS } from './chartUtils'

// Horizontal bar chart for one series (e.g. books per category).
// Each row: label · bar · value at the tip. Rows can link somewhere.
export default function BarList({ data, format = String, unit = '', color = SERIES_COLORS[0] }) {
  const [active, setActive] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <ul className="bar-list">
      {data.map((d) => {
        const share = total ? ((d.value / total) * 100).toFixed(1) : '0.0'
        const content = (
          <>
            <span className="bar-label" title={d.label}>{d.label}</span>
            <span className="bar-track">
              {d.value > 0 && <span className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />}
              <span className="bar-value">{format(d.value)}</span>
            </span>
            {active === d.label && (
              <span className="chart-tooltip bar-tooltip" role="tooltip">
                <strong>{d.label}</strong>
                <span>
                  {format(d.value)}
                  {unit && ` ${unit}`} · {share}% of total
                </span>
                {d.detail && <span className="muted">{d.detail}</span>}
              </span>
            )}
          </>
        )
        const handlers = {
          onMouseEnter: () => setActive(d.label),
          onMouseLeave: () => setActive(null),
          onFocus: () => setActive(d.label),
          onBlur: () => setActive(null),
        }
        return (
          <li key={d.label}>
            {d.to ? (
              <Link to={d.to} className="bar-row" {...handlers}>
                {content}
              </Link>
            ) : (
              <div className="bar-row" tabIndex={0} {...handlers}>
                {content}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
