import { useState } from 'react'
import { columnPath, compactNumber, niceTicks, useChartWidth } from './chartUtils'

const HEIGHT = 220 // plot area
const AXIS_BAND = 28 // room for x labels below the plot
const MARGIN = { top: 12, left: 36, right: 8 }
const MAX_BAR = 24
const GAP = 2

// Grouped columns: one group per category, one column per series.
// series: [{ key, label, color, values: number[] }] aligned with `categories`.
export default function ColumnChart({ categories, series, format = String, ariaLabel }) {
  const [ref, width] = useChartWidth()
  const [active, setActive] = useState(null)

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right)
  const max = Math.max(0, ...series.flatMap((s) => s.values))
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]
  const y = (v) => MARGIN.top + HEIGHT - (v / top) * HEIGHT

  const band = categories.length ? plotW / categories.length : 0
  const n = series.length
  const barW = Math.max(2, Math.min(MAX_BAR, (band * 0.7 - GAP * (n - 1)) / n))
  const groupW = barW * n + GAP * (n - 1)
  const labelEvery = Math.max(1, Math.ceil(categories.length / Math.max(1, Math.floor(plotW / 44))))

  const tooltipX = active === null ? 0 : MARGIN.left + band * active + band / 2

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg width={width} height={MARGIN.top + HEIGHT + AXIS_BAND} role="img" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={MARGIN.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {compactNumber(t)}
              </text>
            </g>
          ))}
          <line className="chart-baseline" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(0)} y2={y(0)} />

          {categories.map((cat, i) => {
            const groupX = MARGIN.left + band * i + (band - groupW) / 2
            return (
              <g
                key={cat}
                tabIndex={0}
                className="chart-band"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${cat}: ${series.map((s) => `${s.label} ${format(s.values[i])}`).join(', ')}`}
              >
                {/* Hit area spans the whole band, larger than the columns. */}
                <rect x={MARGIN.left + band * i} y={MARGIN.top} width={band} height={HEIGHT} className={`band-hit ${active === i ? 'is-active' : ''}`} />
                {series.map((s, si) => {
                  const v = s.values[i]
                  if (!v) return null
                  return <path key={s.key} d={columnPath(groupX + si * (barW + GAP), y(v), barW, y(0) - y(v))} fill={s.color} />
                })}
                {i % labelEvery === 0 && (
                  <text className="chart-tick" x={MARGIN.left + band * i + band / 2} y={MARGIN.top + HEIGHT + 18} textAnchor="middle">
                    {cat}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      )}

      {active !== null && (
        <div
          className="chart-tooltip"
          role="tooltip"
          style={{ left: Math.min(Math.max(tooltipX, 80), width - 80), top: MARGIN.top }}
        >
          <strong>{categories[active]}</strong>
          {series.map((s) => (
            <span key={s.key} className="tooltip-row">
              <span className="legend-swatch" style={{ background: s.color }} />
              {s.label}
              <b>{format(s.values[active])}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
