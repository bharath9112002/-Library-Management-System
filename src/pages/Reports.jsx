import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import BarList from '../components/charts/BarList'
import ChartCard from '../components/charts/ChartCard'
import ColumnChart from '../components/charts/ColumnChart'
import { SERIES_COLORS } from '../components/charts/chartUtils'
import { ACTIVE_MEMBER_DAYS, getReport, monthlyIssueReport } from '../services/reportService'
import { formatCurrency, todayISO } from '../utils/format'

const RANGES = [3, 6, 12]
const formatNumber = (n) => n.toLocaleString('en-IN')
const percent = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : '0%')

export default function Reports() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [months, setMonths] = useState(6)
  const [today] = useState(todayISO)

  useEffect(() => {
    let cancelled = false
    getReport(today)
      .then((r) => !cancelled && setReport(r))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [today])

  const monthly = useMemo(() => (report ? monthlyIssueReport(report.issues, months, today) : []), [report, months, today])
  const monthlyTotals = monthly.reduce(
    (t, m) => ({ issued: t.issued + m.issued, returned: t.returned + m.returned, returnedLate: t.returnedLate + m.returnedLate, fines: t.fines + m.fines }),
    { issued: 0, returned: 0, returnedLate: 0, fines: 0 },
  )
  const categories = useMemo(
    () => (report ? [...report.categories].sort((a, b) => b.books - a.books || a.name.localeCompare(b.name)) : []),
    [report],
  )

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">⚠️</div>
        <h2>Couldn&apos;t load reports</h2>
        <p className="muted">{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="card state-card" aria-busy="true">
        <div className="spinner" />
        <p className="muted">Building reports…</p>
      </div>
    )
  }

  const t = report.totals
  const tiles = [
    { label: 'Total books', value: t.titles, note: `${formatNumber(t.copies)} copies · ${formatNumber(t.availableCopies)} on shelf`, icon: 'book', accent: 'indigo', to: '/books' },
    { label: 'Books issued', value: t.issuedNow, note: `currently out · ${formatNumber(t.issuedAllTime)} all time`, icon: 'issue', accent: 'violet', to: '/issues?tab=return' },
    { label: 'Books returned', value: t.returned, note: `${t.returnedLate} returned late`, icon: 'return', accent: 'emerald', to: '/issues?tab=history' },
    { label: 'Active members', value: t.activeMembers, note: `${percent(t.activeMembers, t.totalMembers)} of ${t.totalMembers} · last ${ACTIVE_MEMBER_DAYS} days`, icon: 'users', accent: 'sky', to: '/members' },
    { label: 'Overdue books', value: t.overdue, note: `${percent(t.overdue, t.issuedNow)} of issued books`, icon: 'alert', accent: 'rose', to: '/fines?tab=overdue' },
  ]

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="muted">Live figures from the catalogue, members and issue records.</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div className="report-tiles">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.to} className={`report-tile accent-${tile.accent}`}>
            <span className="mini-stat-icon">
              <Icon name={tile.icon} size={20} />
            </span>
            <span className="report-tile-label">{tile.label}</span>
            <strong>{formatNumber(tile.value)}</strong>
            <span className="muted">{tile.note}</span>
          </Link>
        ))}
      </div>

      <div className="report-grid">
        <ChartCard
          title="Monthly issues & returns"
          subtitle={`Last ${months} months`}
          legend={[
            { label: 'Issued', color: SERIES_COLORS[0] },
            { label: 'Returned', color: SERIES_COLORS[1] },
          ]}
          actions={
            <div className="view-toggle" role="group" aria-label="Time range">
              {RANGES.map((r) => (
                <button key={r} type="button" className={months === r ? 'active' : ''} aria-pressed={months === r} onClick={() => setMonths(r)}>
                  {r}M
                </button>
              ))}
            </div>
          }
        >
          <ColumnChart
            categories={monthly.map((m) => m.label)}
            series={[
              { key: 'issued', label: 'Issued', color: SERIES_COLORS[0], values: monthly.map((m) => m.issued) },
              { key: 'returned', label: 'Returned', color: SERIES_COLORS[1], values: monthly.map((m) => m.returned) },
            ]}
            format={formatNumber}
            ariaLabel={`Books issued and returned per month, last ${months} months`}
          />
        </ChartCard>

        <ChartCard
          title="Books by category"
          subtitle={`${categories.length} categories · ${formatNumber(t.titles)} titles`}
          table={
            <table className="report-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Books</th>
                  <th className="num">Copies</th>
                  <th className="num">Available</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className="num">{c.books}</td>
                    <td className="num">{c.copies}</td>
                    <td className="num">{c.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <BarList
            data={categories.map((c) => ({
              label: c.name,
              value: c.books,
              detail: `${c.available} of ${c.copies} copies available`,
              to: `/books?category=${encodeURIComponent(c.name)}`,
            }))}
            unit="books"
          />
        </ChartCard>
      </div>

      <section className="card panel">
        <div className="chart-card-header">
          <div>
            <h2>Monthly issue report</h2>
            <p className="muted">Issues and returns recorded in each month · last {months} months</p>
          </div>
        </div>
        <div className="chart-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="num">Issued</th>
                <th className="num">Returned</th>
                <th className="num">Returned late</th>
                <th className="num">Fines</th>
              </tr>
            </thead>
            <tbody>
              {[...monthly].reverse().map((m) => (
                <tr key={m.key}>
                  <td>{m.fullLabel}</td>
                  <td className="num">{m.issued}</td>
                  <td className="num">{m.returned}</td>
                  <td className="num">{m.returnedLate}</td>
                  <td className="num">{formatCurrency(m.fines)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="num">{monthlyTotals.issued}</td>
                <td className="num">{monthlyTotals.returned}</td>
                <td className="num">{monthlyTotals.returnedLate}</td>
                <td className="num">{formatCurrency(monthlyTotals.fines)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  )
}
