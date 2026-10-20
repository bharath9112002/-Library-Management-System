import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BookCover from '../../components/BookCover'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import useToast from '../../context/useToast'
import { FINE_PER_DAY, PAYMENT_METHODS, getFineStatus, markUnpaid, payFine } from '../../services/fineService'
import { formatCurrency, formatDate } from '../../utils/format'
import FineStatus from './FineStatus'

const PAGE_SIZE = 10
const FILTERS = { all: 'All', unpaid: 'Unpaid', paid: 'Paid' }

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function PayDialog({ fine, today, onCancel, onConfirm }) {
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    setSaving(true)
    try {
      await onConfirm({ method, paidOn: today })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !saving && onCancel()}>
      <div className="modal modal-left" role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="pay-title">Collect fine</h2>
        <div className="return-book-info">
          <BookCover src={fine.bookCover} title={fine.bookTitle} className="option-cover" />
          <div>
            <strong>{fine.bookTitle}</strong>
            <span className="muted">
              {fine.memberName} · {fine.membershipId}
            </span>
          </div>
        </div>

        <dl className="fine-breakdown">
          <div>
            <dt>Due date</dt>
            <dd>{formatDate(fine.dueDate)}</dd>
          </div>
          <div>
            <dt>Returned</dt>
            <dd>{formatDate(fine.returnDate)}</dd>
          </div>
          <div>
            <dt>Days late</dt>
            <dd>
              {fine.daysLate} × {formatCurrency(FINE_PER_DAY)}
            </dd>
          </div>
          <div className="fine-total">
            <dt>Amount due</dt>
            <dd>{formatCurrency(fine.amount)}</dd>
          </div>
        </dl>

        <fieldset className="pay-methods">
          <legend>Payment method</legend>
          {PAYMENT_METHODS.map((m) => (
            <label key={m} className={`chip ${method === m ? 'active' : ''}`}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} />
              {m}
            </label>
          ))}
        </fieldset>
        <p className="muted fine-note">This only records the payment — no money is charged.</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : `Mark ${formatCurrency(fine.amount)} as paid`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FineHistory({ fines, today, initialQuery, onChange }) {
  const toast = useToast()
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [paying, setPaying] = useState(null)
  const [undoing, setUndoing] = useState(null)
  const [undoSaving, setUndoSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return fines
      .filter((f) => {
        if (filter === 'all') return true
        const paid = getFineStatus(f) === 'paid'
        return filter === 'paid' ? paid : !paid
      })
      .filter((f) => !q || f.memberName.toLowerCase().includes(q) || f.membershipId.toLowerCase().includes(q))
  }, [fines, query, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const filteredTotal = filtered.reduce((total, f) => total + (f.payment?.amount ?? f.amount), 0)

  const confirmPay = async (details) => {
    await payFine(paying.id, details)
    toast.success(`${formatCurrency(paying.amount)} fine from ${paying.memberName} marked as paid.`)
    setPaying(null)
    await onChange()
  }

  const confirmUndo = async () => {
    setUndoSaving(true)
    try {
      await markUnpaid(undoing.id)
      toast.success(`Fine for "${undoing.bookTitle}" marked as unpaid.`)
      setUndoing(null)
      await onChange()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUndoSaving(false)
    }
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
            placeholder="Search by member name or membership ID…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            aria-label="Search by member"
          />
        </div>
        <div className="filter-chips" role="group" aria-label="Filter by payment status">
          {Object.entries(FILTERS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`chip ${filter === key ? 'active' : ''}`}
              aria-pressed={filter === key}
              onClick={() => {
                setFilter(key)
                setPage(1)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">{fines.length ? '🔍' : '🎉'}</div>
          <h2>{fines.length ? 'No fines found' : 'No fines yet'}</h2>
          <p className="muted">
            {fines.length ? 'Try a different member or status filter.' : 'Every book has been returned on time.'}
          </p>
        </div>
      ) : (
        <>
          <p className="muted fine-count">
            {plural(filtered.length, 'fine')} · {formatCurrency(filteredTotal)}
          </p>
          <div className="card table-card">
            <table className="data-table history-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book</th>
                  <th>Due date</th>
                  <th>Returned</th>
                  <th>Days late</th>
                  <th>Fine</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((f) => {
                  const status = getFineStatus(f)
                  return (
                    <tr key={f.id}>
                      <td data-label="Member">
                        <div className="history-member">
                          <Link to={`/members/${f.memberId}`} className="member-name">{f.memberName}</Link>
                          <span className="muted history-sub">{f.membershipId}</span>
                        </div>
                      </td>
                      <td data-label="Book">
                        <div className="history-book">
                          <BookCover src={f.bookCover} title={f.bookTitle} className="table-cover" />
                          <div>
                            <Link to={`/books/${f.bookId}`} className="member-name">{f.bookTitle}</Link>
                            <span className="muted">{f.id}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Due date">{formatDate(f.dueDate)}</td>
                      <td data-label="Returned">{f.returnDate ? formatDate(f.returnDate) : 'Not yet'}</td>
                      <td data-label="Days late">{f.daysLate}</td>
                      <td data-label="Fine" className="fine-amount">{formatCurrency(f.payment?.amount ?? f.amount)}</td>
                      <td data-label="Status">
                        <FineStatus fine={f} />
                      </td>
                      <td data-label="Action" className="fine-action">
                        {status === 'unpaid' && (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => setPaying(f)}>
                            Collect
                          </button>
                        )}
                        {status === 'paid' && (
                          <button type="button" className="btn btn-link" onClick={() => setUndoing(f)}>
                            Undo
                          </button>
                        )}
                        {status === 'accruing' && (
                          <Link to="/issues?tab=return" className="btn btn-link" title="Return the book to finalise the fine">
                            Return book
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="list-footer">
            <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </>
      )}

      {paying && <PayDialog fine={paying} today={today} onCancel={() => setPaying(null)} onConfirm={confirmPay} />}
      <ConfirmDialog
        open={Boolean(undoing)}
        icon="↩️"
        title="Mark fine as unpaid?"
        message={undoing ? `The ${formatCurrency(undoing.payment.amount)} payment from ${undoing.memberName} will be removed.` : ''}
        confirmLabel="Mark unpaid"
        loadingLabel="Saving…"
        loading={undoSaving}
        onConfirm={confirmUndo}
        onCancel={() => setUndoing(null)}
      />
    </div>
  )
}
