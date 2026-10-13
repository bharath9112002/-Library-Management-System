// Parses "YYYY-MM-DD" as a local date (new Date('2024-01-08') would be UTC midnight).
export function parseDate(value) {
  if (!value) return null
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(value) {
  const date = parseDate(value)
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function formatMobile(mobile) {
  return mobile.length === 10 ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile
}

// "1 year 3 months", "5 months", "12 days"
export function durationSince(value, now = new Date()) {
  const start = parseDate(value)
  if (!start) return ''
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth()
  if (now.getDate() < start.getDate()) months -= 1
  if (months < 1) {
    const days = Math.max(0, Math.floor((now - start) / 86400000))
    return `${days} day${days === 1 ? '' : 's'}`
  }
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = []
  if (years) parts.push(`${years} year${years > 1 ? 's' : ''}`)
  if (rest) parts.push(`${rest} month${rest > 1 ? 's' : ''}`)
  return parts.join(' ')
}
