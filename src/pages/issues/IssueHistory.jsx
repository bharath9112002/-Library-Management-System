import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BookCover from '../../components/BookCover'
import IssueStatus from '../../components/IssueStatus'
import Pagination from '../../components/Pagination'
import { getStatus } from '../../services/issueService'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 10
const STATUS_FILTERS = {
  all: 'All records',
  active: 'Currently issued',
  overdue: 'Overdue',
  returned: 'Returned',
  'returned-late': 'Returned late',
}

export default function IssueHistory({ issues, today }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return issues
      .filter((i) => {
        const s = getStatus(i, today)
        if (status === 'all') return true
        if (status === 'active') return s === 'issued' || s === 'overdue'
        if (status === 'returned') return s === 'returned' || s === 'returned-late'
        return s === status
      })
      .filter(
        (i) =>
          !q ||
          i.bookTitle.toLowerCase().includes(q) ||
          i.bookAuthor.toLowerCase().includes(q) ||
          i.memberName.toLowerCase().includes(q) ||
          i.membershipId.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q),
      )
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.id.localeCompare(a.id))
  }, [issues, query, status, today])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
            placeholder="Search by book, author, member or ID…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            aria-label="Search issue history"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by status"
        >
          {Object.entries(STATUS_FILTERS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">📭</div>
          <h2>No records found</h2>
          <p className="muted">Try a different search or status filter.</p>
        </div>
      ) : (
        <>
          <div className="card table-card">
            <table className="data-table history-table">
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Issue date</th>
                  <th>Due date</th>
                  <th>Return date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((i) => (
                  <tr key={i.id}>
                    <td data-label="Issue ID"><span className="id-badge">{i.id}</span></td>
                    <td data-label="Book">
                      <div className="history-book">
                        <BookCover src={i.bookCover} title={i.bookTitle} className="table-cover" />
                        <div>
                          <Link to={`/books/${i.bookId}`} className="member-name">{i.bookTitle}</Link>
                          <span className="muted">{i.bookAuthor}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Member">
                      <div className="history-member">
                        <Link to={`/members/${i.memberId}`} className="member-name">{i.memberName}</Link>
                        <span className="muted history-sub">{i.membershipId}</span>
                      </div>
                    </td>
                    <td data-label="Issue date">{formatDate(i.issueDate)}</td>
                    <td data-label="Due date">{formatDate(i.dueDate)}</td>
                    <td data-label="Return date">{i.returnDate ? formatDate(i.returnDate) : '—'}</td>
                    <td data-label="Status"><IssueStatus issue={i} today={today} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="list-footer">
            <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
