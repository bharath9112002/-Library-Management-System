import { useState } from 'react'
import { compactNumber, niceTicks, useChartWidth } from './chartUtils'

const HEIGHT = 220
const AXIS_BAND = 28
const MARGIN = { top: 14, left: 36, right: 44 } // right margin holds the end labels

// Multi-series line chart with a hover crosshair and end-of-line value labels.
// series: [{ key, label, color, values: number[] }] aligned with `categories`.
export default function LineChart({ categories, series, format = String, ariaLabel }) {
  const [ref, width] = useChartWidth()
  const [active, setActive] = useState(null)

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right)
  const ticks = niceTicks(Math.max(0, ...series.flatMap((s) => s.values)))
  const top = ticks[ticks.length - 1]
  const last = categories.length - 1
  const x = (i) => MARGIN.left + (last > 0 ? (i / last) * plotW : plotW / 2)
  const y = (v) => MARGIN.top + HEIGHT - (v / top) * HEIGHT
  const labelEvery = Math.max(1, Math.ceil(categories.length / Math.max(1, Math.floor(plotW / 44))))

  // End labels: push apart when two lines finish within 14px of each other.
  const ends = series.map((s) => ({ key: s.key, value: s.values[last], y: y(s.values[last]) })).sort((a, b) => a.y - b.y)
  ends.forEach((e, i) => {
    if (i > 0 && e.y - ends[i - 1].y < 14) e.y = ends[i - 1].y + 14
  })

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    setActive(Math.min(last, Math.max(0, Math.round(ratio * last))))
  }

  const handleKey = (e) => {
    if (e.key === 'ArrowRight') setActive((i) => Math.min(last, (i ?? -1) + 1))
    else if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? last + 1) - 1))
  }

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg
          width={width}
          height={MARGIN.top + HEIGHT + AXIS_BAND}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={handleKey}
          onBlur={() => setActive(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={MARGIN.left} x2={MARGIN.left + plotW} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={MARGIN.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {compactNumber(t)}
              </text>
            </g>
          ))}
          <line className="chart-baseline" x1={MARGIN.left} x2={MARGIN.left + plotW} y1={y(0)} y2={y(0)} />

          {categories.map((cat, i) =>
            i % labelEvery === 0 || i === last ? (
              <text key={cat} className="chart-tick" x={x(i)} y={MARGIN.top + HEIGHT + 18} textAnchor="middle">
                {cat}
              </text>
            ) : null,
          )}

          {series.length === 1 && (
            <path
              d={`M${x(0)},${y(0)}${series[0].values.map((v, i) => `L${x(i)},${y(v)}`).join('')}L${x(last)},${y(0)}Z`}
              fill={series[0].color}
              opacity="0.1"
            />
          )}
          {series.map((s) => (
            <path
              key={s.key}
              d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('')}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {active !== null && <line className="chart-crosshair" x1={x(active)} x2={x(active)} y1={MARGIN.top} y2={y(0)} />}

          {series.map((s) => {
            const i = active ?? last
            return <circle key={s.key} cx={x(i)} cy={y(s.values[i])} r="4" fill={s.color} className="chart-dot" />
          })}

          {active === null &&
            ends.map((e) => (
              <text key={e.key} className="chart-end-label" x={x(last) + 8} y={e.y} dy="0.32em">
                {format(e.value)}
              </text>
            ))}

          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={plotW}
            height={HEIGHT}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setActive(null)}
          />
        </svg>
      )}

      {active !== null && (
        <div className="chart-tooltip" role="tooltip" style={{ left: Math.min(Math.max(x(active), 80), width - 80), top: MARGIN.top }}>
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
