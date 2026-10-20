import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import { FINE_PER_DAY, getFineStatus, getFines } from '../../services/fineService'
import { formatCurrency, todayISO } from '../../utils/format'
import FineHistory from './FineHistory'
import OverdueList from './OverdueList'

const TABS = [
  { key: 'history', label: 'Fine History', icon: 'wallet' },
  { key: 'overdue', label: 'Overdue Books', icon: 'alert' },
]

const sum = (fines) => fines.reduce((total, f) => total + f.amount, 0)

export default function Fines() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'history'
  const [fines, setFines] = useState(null)
  const [error, setError] = useState('')
  const [today] = useState(todayISO)

  useEffect(() => {
    let cancelled = false
    getFines(today)
      .then((f) => !cancelled && setFines(f))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [today])

  const refresh = useCallback(async () => {
    setFines(await getFines(today))
  }, [today])

  const stats = useMemo(() => {
    if (!fines) return null
    const byStatus = (s) => fines.filter((f) => getFineStatus(f) === s)
    const paid = byStatus('paid')
    return {
      unpaid: sum(byStatus('unpaid')),
      accruing: sum(byStatus('accruing')),
      overdueBooks: byStatus('accruing').length,
      // Paid amount is what was collected, which is fixed at payment time.
      collected: paid.reduce((total, f) => total + f.payment.amount, 0),
    }
  }, [fines])

  const switchTab = (key) => {
    setSearchParams(key === 'history' ? {} : { tab: key }, { replace: true })
  }

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">⚠️</div>
        <h2>Couldn&apos;t load fines</h2>
        <p className="muted">{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="fines-page">
      <div className="page-header">
        <div>
          <h1>Fines</h1>
          <p className="muted">
            Overdue books are charged {formatCurrency(FINE_PER_DAY)} per day after the due date.
          </p>
        </div>
      </div>

      <div className="issue-stats">
        {[
          { label: 'Unpaid fines', value: stats?.unpaid, icon: 'wallet', accent: 'rose' },
          { label: 'Accruing on overdue books', value: stats?.accruing, icon: 'clock', accent: 'amber' },
          { label: 'Books overdue', value: stats?.overdueBooks, icon: 'alert', accent: 'violet', count: true },
          { label: 'Collected', value: stats?.collected, icon: 'check', accent: 'emerald' },
        ].map((s) => (
          <div key={s.label} className={`mini-stat accent-${s.accent}`}>
            <span className="mini-stat-icon">
              <Icon name={s.icon} size={20} />
            </span>
            <div>
              <strong>{s.value === undefined ? '–' : s.count ? s.value : formatCurrency(s.value)}</strong>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            <Icon name={t.icon} size={18} />
            {t.label}
            {t.key === 'overdue' && stats?.overdueBooks ? <span className="tab-count">{stats.overdueBooks}</span> : null}
          </button>
        ))}
      </div>

      {!fines ? (
        <div className="card state-card" aria-busy="true">
          <div className="spinner" />
          <p className="muted">Calculating fines…</p>
        </div>
      ) : tab === 'history' ? (
        <FineHistory fines={fines} today={today} initialQuery={searchParams.get('member') ?? ''} onChange={refresh} />
      ) : (
        <OverdueList fines={fines.filter((f) => getFineStatus(f) === 'accruing')} today={today} />
      )}
    </div>
  )
}
