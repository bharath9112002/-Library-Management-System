import { useEffect, useRef, useState } from 'react'

// Categorical series colours, assigned in this fixed order (validated for
// colour-blind separation and 3:1 contrast on the white card surface).
export const SERIES_COLORS = ['#2a78d6', '#eb6834']

// Tracks an element's width so charts can lay out in real pixels (text stays crisp).
export function useChartWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

// Round axis ticks (steps of 1, 2 or 5 × 10^n) covering 0..max.
export function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1]
  const raw = max / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)
  const ticks = []
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1e6) / 1e6)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

// 1,284 / 12.9K / 4.2M
export function compactNumber(n) {
  if (Math.abs(n) >= 1e6) return `${+(n / 1e6).toFixed(1)}M`
  if (Math.abs(n) >= 1e3) return `${+(n / 1e3).toFixed(1)}K`
  return String(n)
}

// Column with a 4px rounded top and a square base.
export function columnPath(x, y, width, height) {
  const r = Math.min(4, width / 2, height)
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`
}
