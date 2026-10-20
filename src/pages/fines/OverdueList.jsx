import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BookCover from '../../components/BookCover'
import Pagination from '../../components/Pagination'
import { FINE_PER_DAY } from '../../services/fineService'
import { formatCurrency, formatDate } from '../../utils/format'

const PAGE_SIZE = 8

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Books still out past their due date, longest overdue first.
export default function OverdueList({ fines, today }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const overdue = useMemo(() => {
    const q = query.trim().toLowerCase()
    return fines
      .filter((f) => !q || f.memberName.toLowerCase().includes(q) || f.membershipId.toLowerCase().includes(q))
      .sort((a, b) => b.daysLate - a.daysLate)
  }, [fines, query])

  const totalPages = Math.max(1, Math.ceil(overdue.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = overdue.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <div className="card toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search by member name or membership ID…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            aria-label="Search overdue books by member"
          />
        </div>
      </div>

      {overdue.length === 0 ? (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">{query ? '🔍' : '✅'}</div>
          <h2>{query ? 'No matching overdue books' : 'No overdue books'}</h2>
          <p className="muted">{query ? 'Try a different member.' : 'Every issued book is within its due date.'}</p>
        </div>
      ) : (
        <>
          <div className="return-list">
            {visible.map((f) => (
              <article key={f.id} className="card return-card">
                <BookCover src={f.bookCover} title={f.bookTitle} className="return-cover" />
                <div className="return-main">
                  <div className="return-head">
                    <span className="id-badge">{f.id}</span>
                    <span className="status-badge status-danger">Overdue · {plural(f.daysLate, 'day')}</span>
                  </div>
                  <h3>{f.bookTitle}</h3>
                  <p className="muted">
                    Issued to <Link to={`/members/${f.memberId}`} className="link">{f.memberName}</Link> · {f.membershipId}
                  </p>
                  <div className="return-dates">
                    <span>Issued <strong>{formatDate(f.issueDate)}</strong></span>
                    <span>Due <strong>{formatDate(f.dueDate)}</strong></span>
                  </div>
                </div>
                <div className="overdue-fine">
                  <strong>{formatCurrency(f.amount)}</strong>
                  <span className="muted">
                    {f.daysLate} × {formatCurrency(FINE_PER_DAY)} as of {formatDate(today)}
                  </span>
                  <Link to="/issues?tab=return" className="btn btn-outline btn-sm">Return book</Link>
                </div>
              </article>
            ))}
          </div>
          <div className="list-footer">
            <Pagination page={currentPage} totalPages={totalPages} totalItems={overdue.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
