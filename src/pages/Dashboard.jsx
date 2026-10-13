import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../context/useAuth'
import Icon from '../components/Icon'
import { dashboardStats as stats, recentActivities, statTrends } from '../data/dashboardData'

const formatNumber = (n) => n.toLocaleString('en-IN')
const formatCurrency = (n) => `₹${n.toLocaleString('en-IN')}`

const PRIMARY_STATS = [
  { key: 'totalBooks', label: 'Total Books', icon: 'book', accent: 'indigo' },
  { key: 'totalMembers', label: 'Total Members', icon: 'users', accent: 'sky' },
  { key: 'booksIssued', label: 'Books Issued', icon: 'issue', accent: 'violet' },
  { key: 'booksAvailable', label: 'Books Available', icon: 'check', accent: 'emerald' },
]

const SECONDARY_STATS = [
  { key: 'overdueBooks', label: 'Overdue Books', icon: 'alert', accent: 'rose' },
  { key: 'totalCategories', label: 'Total Categories', icon: 'tag', accent: 'amber' },
  { key: 'fineCollected', label: 'Fine Collected', icon: 'wallet', accent: 'teal', currency: true },
]

const QUICK_ACTIONS = [
  { to: '/books', label: 'Add Book', desc: 'Add a new title to the catalogue', icon: 'plus', accent: 'indigo' },
  { to: '/members', label: 'Add Member', desc: 'Register a new library member', icon: 'userPlus', accent: 'sky' },
  { to: '/issues', label: 'Issue Book', desc: 'Lend a book to a member', icon: 'issue', accent: 'violet' },
  { to: '/issues', label: 'Return Book', desc: 'Record a returned book', icon: 'return', accent: 'emerald' },
  { to: '/fines', label: 'Collect Fine', desc: 'Review overdue fines', icon: 'wallet', accent: 'rose' },
  { to: '/reports', label: 'View Reports', desc: 'Library insights & trends', icon: 'chart', accent: 'amber' },
]

const ACTIVITY_META = {
  issue: { icon: 'issue', accent: 'violet' },
  return: { icon: 'return', accent: 'emerald' },
  member: { icon: 'userPlus', accent: 'sky' },
  fine: { icon: 'wallet', accent: 'teal' },
  book: { icon: 'book', accent: 'indigo' },
  overdue: { icon: 'alert', accent: 'rose' },
}

function greeting(now) {
  const hour = new Date(now).getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(iso, now) {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function StatCard({ label, value, icon, accent, trend }) {
  const tone = trend.direction === 'neutral' ? 'neutral' : trend.good || trend.direction === 'up' ? 'good' : 'bad'
  return (
    <div className={`stat-card accent-${accent}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">
          <Icon name={icon} size={22} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-trend">
        <span className={`trend-badge trend-${tone}`}>
          {trend.direction !== 'neutral' && (
            <Icon name={trend.direction === 'up' ? 'trendUp' : 'trendDown'} size={14} />
          )}
          {trend.value}
        </span>
        <span className="muted">{trend.note}</span>
      </div>
    </div>
  )
}

function AvailabilityCard() {
  const onTime = stats.booksIssued - stats.overdueBooks
  const segments = [
    { label: 'Available', value: stats.booksAvailable, className: 'seg-available' },
    { label: 'Issued (on time)', value: onTime, className: 'seg-issued' },
    { label: 'Overdue', value: stats.overdueBooks, className: 'seg-overdue' },
  ]

  return (
    <section className="card panel">
      <div className="panel-header">
        <h2>Collection status</h2>
        <span className="muted">{formatNumber(stats.totalBooks)} books</span>
      </div>
      <div className="stack-bar" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
        {segments.map((s) => (
          <span
            key={s.label}
            className={`stack-seg ${s.className}`}
            style={{ flexGrow: s.value }}
            title={`${s.label}: ${formatNumber(s.value)} (${((s.value / stats.totalBooks) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
      <ul className="stack-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className={`legend-dot ${s.className}`} />
            <span className="legend-label">{s.label}</span>
            <strong>{formatNumber(s.value)}</strong>
            <span className="muted">{((s.value / stats.totalBooks) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  // Captured once per visit so render stays pure.
  const [now] = useState(() => Date.now())
  const today = new Date(now).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="dashboard">
      <section className="hero-banner">
        <div>
          <p className="hero-date">{today}</p>
          <h1>
            {greeting(now)}, {user.fullName.split(' ')[0]} 👋
          </h1>
          <p className="hero-sub">
            {stats.booksIssued} books are out right now and{' '}
            <strong>{stats.overdueBooks} are overdue</strong>. Here&apos;s what&apos;s happening in your library.
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/issues" className="btn btn-light">
            <Icon name="issue" size={18} /> Issue Book
          </Link>
          <Link to="/fines" className="btn btn-ghost-light">
            View Overdue
          </Link>
        </div>
      </section>

      <div className="stats-grid stats-primary">
        {PRIMARY_STATS.map((s) => (
          <StatCard key={s.key} {...s} value={formatNumber(stats[s.key])} trend={statTrends[s.key]} />
        ))}
      </div>
      <div className="stats-grid stats-secondary">
        {SECONDARY_STATS.map((s) => (
          <StatCard
            key={s.key}
            {...s}
            value={s.currency ? formatCurrency(stats[s.key]) : formatNumber(stats[s.key])}
            trend={statTrends[s.key]}
          />
        ))}
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-main">
          <AvailabilityCard />

          <section className="card panel">
            <div className="panel-header">
              <h2>Quick actions</h2>
            </div>
            <div className="quick-grid">
              {QUICK_ACTIONS.map((a) => (
                <Link key={a.label} to={a.to} className={`quick-card accent-${a.accent}`}>
                  <span className="quick-icon">
                    <Icon name={a.icon} size={22} />
                  </span>
                  <span className="quick-text">
                    <strong>{a.label}</strong>
                    <span className="muted">{a.desc}</span>
                  </span>
                  <Icon name="arrowRight" size={18} className="quick-arrow" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="card panel activity-panel">
          <div className="panel-header">
            <h2>Recent activities</h2>
            <span className="live-dot">Live</span>
          </div>
          <ul className="activity-list">
            {recentActivities.map((a) => {
              const meta = ACTIVITY_META[a.type]
              return (
                <li key={a.id} className={`activity-item accent-${meta.accent}`}>
                  <span className="activity-icon">
                    <Icon name={meta.icon} size={16} />
                  </span>
                  <div className="activity-body">
                    <strong>{a.title}</strong>
                    <span className="muted">{a.detail}</span>
                  </div>
                  <span className="activity-time">
                    <Icon name="clock" size={12} /> {timeAgo(a.time, now)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
