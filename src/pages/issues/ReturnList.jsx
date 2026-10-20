import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BookCover from '../../components/BookCover'
import IssueStatus from '../../components/IssueStatus'
import Pagination from '../../components/Pagination'
import useToast from '../../context/useToast'
import { daysBetween, formatCurrency, formatDate } from '../../utils/format'
import { returnBook } from '../../services/issueService'
import { FINE_PER_DAY } from '../../services/fineService'

const PAGE_SIZE = 8

function ReturnDialog({ issue, today, onCancel, onConfirm }) {
  const [returnDate, setReturnDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const late = returnDate ? Math.max(0, daysBetween(issue.dueDate, returnDate)) : 0

  const submit = async () => {
    setError('')
    setSaving(true)
    try {
      await onConfirm(returnDate)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !saving && onCancel()}>
      <div className="modal modal-left" role="dialog" aria-modal="true" aria-labelledby="return-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="return-title">Return book</h2>
        <div className="return-book-info">
          <BookCover src={issue.bookCover} title={issue.bookTitle} className="option-cover" />
          <div>
            <strong>{issue.bookTitle}</strong>
            <span className="muted">
              {issue.memberName} · {issue.membershipId}
            </span>
          </div>
        </div>
        <dl className="summary-dates">
          <div>
            <dt>Issued</dt>
            <dd>{formatDate(issue.issueDate)}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{formatDate(issue.dueDate)}</dd>
          </div>
        </dl>
        <div className="form-group">
          <label htmlFor="returnDate">Return date *</label>
          <input
            id="returnDate"
            type="date"
            value={returnDate}
            min={issue.issueDate}
            max={today}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>
        {late > 0 ? (
          <div className="alert alert-warning">
            Returned {late} day{late > 1 ? 's' : ''} after the due date. A fine of{' '}
            <strong>{formatCurrency(late * FINE_PER_DAY)}</strong> will be added.
          </div>
        ) : (
          returnDate && <div className="alert alert-success">Returned on time.</div>
        )}
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving || !returnDate}>
            {saving ? 'Saving…' : 'Confirm return'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReturnList({ issues, today, onReturned }) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [returning, setReturning] = useState(null)

  // Active issues, most urgent (earliest due date) first.
  const active = useMemo(() => {
    const q = query.trim().toLowerCase()
    return issues
      .filter((i) => !i.returnDate)
      .filter(
        (i) =>
          !q ||
          i.bookTitle.toLowerCase().includes(q) ||
          i.memberName.toLowerCase().includes(q) ||
          i.membershipId.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q),
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [issues, query])

  const totalPages = Math.max(1, Math.ceil(active.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = active.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const confirmReturn = async (returnDate) => {
    await returnBook(returning.id, returnDate)
    toast.success(`"${returning.bookTitle}" returned by ${returning.memberName}.`)
    setReturning(null)
    await onReturned()
  }

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
            placeholder="Search by book, member, membership ID or issue ID…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            aria-label="Search issued books"
          />
        </div>
      </div>

      {active.length === 0 ? (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">{query ? '🔍' : '✅'}</div>
          <h2>{query ? 'No matching issued books' : 'No books are currently issued'}</h2>
          <p className="muted">{query ? 'Try a different search.' : 'Everything is back on the shelves.'}</p>
        </div>
      ) : (
        <>
          <div className="return-list">
            {visible.map((issue) => (
              <article key={issue.id} className="card return-card">
                <BookCover src={issue.bookCover} title={issue.bookTitle} className="return-cover" />
                <div className="return-main">
                  <div className="return-head">
                    <span className="id-badge">{issue.id}</span>
                    <IssueStatus issue={issue} today={today} />
                  </div>
                  <h3>{issue.bookTitle}</h3>
                  <p className="muted">
                    Issued to{' '}
                    <Link to={`/members/${issue.memberId}`} className="link">{issue.memberName}</Link> · {issue.membershipId}
                  </p>
                  <div className="return-dates">
                    <span>Issued <strong>{formatDate(issue.issueDate)}</strong></span>
                    <span>Due <strong>{formatDate(issue.dueDate)}</strong></span>
                  </div>
                </div>
                <button type="button" className="btn btn-primary return-btn" onClick={() => setReturning(issue)}>
                  Return
                </button>
              </article>
            ))}
          </div>
          <div className="list-footer">
            <Pagination page={currentPage} totalPages={totalPages} totalItems={active.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </>
      )}

      {returning && (
        <ReturnDialog issue={returning} today={today} onCancel={() => setReturning(null)} onConfirm={confirmReturn} />
      )}
    </div>
  )
}
