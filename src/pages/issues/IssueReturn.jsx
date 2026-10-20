import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import { getBooks } from '../../services/bookService'
import { getMembers } from '../../services/memberService'
import { getIssues, getStatus } from '../../services/issueService'
import { daysBetween, todayISO } from '../../utils/format'
import IssueForm from './IssueForm'
import ReturnList from './ReturnList'
import IssueHistory from './IssueHistory'

const TABS = [
  { key: 'issue', label: 'Issue Book', icon: 'issue' },
  { key: 'return', label: 'Return Book', icon: 'return' },
  { key: 'history', label: 'Issue History', icon: 'clock' },
]

async function loadAll() {
  const [books, members, issues] = await Promise.all([getBooks(), getMembers(), getIssues()])
  return { books, members, issues }
}

export default function IssueReturn() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'issue'
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [today] = useState(todayISO)

  useEffect(() => {
    let cancelled = false
    loadAll()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [])

  // Re-read everything after an issue/return so counts and availability stay in sync.
  const refresh = useCallback(async () => {
    setData(await loadAll())
  }, [])

  const stats = useMemo(() => {
    if (!data) return null
    const active = data.issues.filter((i) => !i.returnDate)
    return {
      active: active.length,
      overdue: active.filter((i) => getStatus(i, today) === 'overdue').length,
      dueSoon: active.filter((i) => {
        const left = daysBetween(today, i.dueDate)
        return left >= 0 && left <= 3
      }).length,
      returned30: data.issues.filter((i) => i.returnDate && daysBetween(i.returnDate, today) <= 30).length,
    }
  }, [data, today])

  const switchTab = (key) => {
    setSearchParams(key === 'issue' ? {} : { tab: key }, { replace: true })
  }

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">⚠️</div>
        <h2>Couldn&apos;t load issue data</h2>
        <p className="muted">{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="issues-page">
      <div className="page-header">
        <div>
          <h1>Issue / Return</h1>
          <p className="muted">Lend books to members, record returns and track history.</p>
        </div>
      </div>

      <div className="issue-stats">
        {[
          { label: 'Currently issued', value: stats?.active, icon: 'book', accent: 'indigo' },
          { label: 'Overdue', value: stats?.overdue, icon: 'alert', accent: 'rose' },
          { label: 'Due in 3 days', value: stats?.dueSoon, icon: 'clock', accent: 'amber' },
          { label: 'Returned (30 days)', value: stats?.returned30, icon: 'check', accent: 'emerald' },
        ].map((s) => (
          <div key={s.label} className={`mini-stat accent-${s.accent}`}>
            <span className="mini-stat-icon">
              <Icon name={s.icon} size={20} />
            </span>
            <div>
              <strong>{s.value ?? '–'}</strong>
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
            {t.key === 'return' && stats?.active ? <span className="tab-count">{stats.active}</span> : null}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="card state-card" aria-busy="true">
          <div className="spinner" />
          <p className="muted">Loading books and members…</p>
        </div>
      ) : (
        <>
          {tab === 'issue' && (
            <IssueForm
              books={data.books}
              members={data.members}
              issues={data.issues}
              today={today}
              initialMemberId={searchParams.get('member')}
              initialBookId={searchParams.get('book')}
              onIssued={refresh}
            />
          )}
          {tab === 'return' && <ReturnList issues={data.issues} today={today} onReturned={refresh} />}
          {tab === 'history' && <IssueHistory issues={data.issues} today={today} />}
        </>
      )}
    </div>
  )
}
