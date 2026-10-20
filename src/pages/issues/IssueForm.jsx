import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Combobox from '../../components/Combobox'
import Avatar from '../../components/Avatar'
import BookCover from '../../components/BookCover'
import useToast from '../../context/useToast'
import { LOAN_DAYS, MAX_ACTIVE_PER_MEMBER, issueBook, validateIssue } from '../../services/issueService'
import { addDays, daysBetween, formatDate } from '../../utils/format'

const LOAN_PRESETS = [7, 14, 21, 30]

export default function IssueForm({ books, members, issues, today, initialMemberId, initialBookId, onIssued }) {
  const toast = useToast()
  const [member, setMember] = useState(() => members.find((m) => m.id === Number(initialMemberId)) ?? null)
  const [book, setBook] = useState(() => books.find((b) => b.id === Number(initialBookId)) ?? null)
  const [issueDate, setIssueDate] = useState(today)
  const [dueDate, setDueDate] = useState(() => addDays(today, LOAN_DAYS))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Active issues per member and the set of "memberId:bookId" pairs currently out.
  const { activeByMember, activePairs } = useMemo(() => {
    const byMember = {}
    const pairs = new Set()
    issues.forEach((i) => {
      if (i.returnDate) return
      byMember[i.memberId] = (byMember[i.memberId] || 0) + 1
      pairs.add(`${i.memberId}:${i.bookId}`)
    })
    return { activeByMember: byMember, activePairs: pairs }
  }, [issues])

  const sortedMembers = useMemo(() => [...members].sort((a, b) => a.fullName.localeCompare(b.fullName)), [members])
  const sortedBooks = useMemo(() => [...books].sort((a, b) => a.title.localeCompare(b.title)), [books])

  const errors = validateIssue({ member, book, issueDate, dueDate }, issues)
  // Selection problems (duplicate, no copies, limit) show immediately; "required" ones after submit.
  const visibleErrors = {
    member: member || submitted ? errors.member : '',
    book: book || submitted ? errors.book : '',
    issueDate: errors.issueDate,
    dueDate: errors.dueDate,
  }
  const loanDays = issueDate && dueDate ? daysBetween(issueDate, dueDate) : 0
  const memberActive = member ? activeByMember[member.id] || 0 : 0

  const changeIssueDate = (value) => {
    // Keep the same loan length when the issue date moves.
    if (value && issueDate && dueDate) setDueDate(addDays(value, daysBetween(issueDate, dueDate)))
    setIssueDate(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return

    setSaving(true)
    try {
      const issue = await issueBook({ member, book, issueDate, dueDate })
      toast.success(`"${book.title}" issued to ${member.fullName}. Due ${formatDate(issue.dueDate)}.`)
      setBook(null)
      setMember(null)
      setSubmitted(false)
      await onIssued()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="issue-layout" onSubmit={handleSubmit} noValidate>
      <section className="card">
        <h2 className="form-section-title">1. Select member</h2>
        <Combobox
          label="Member *"
          items={sortedMembers}
          selected={member}
          onSelect={setMember}
          getLabel={(m) => `${m.fullName} (${m.membershipId})`}
          matches={(m, q) =>
            m.fullName.toLowerCase().includes(q) || m.membershipId.toLowerCase().includes(q) || m.email.includes(q) || m.mobile.includes(q)
          }
          isDisabled={(m) => (activeByMember[m.id] || 0) >= MAX_ACTIVE_PER_MEMBER}
          renderOption={(m) => {
            const count = activeByMember[m.id] || 0
            return (
              <>
                <Avatar name={m.fullName} size={32} />
                <span className="option-text">
                  <strong>{m.fullName}</strong>
                  <span className="muted">{m.membershipId} · {m.email}</span>
                </span>
                <span className={`option-tag ${count >= MAX_ACTIVE_PER_MEMBER ? 'tag-danger' : ''}`}>
                  {count >= MAX_ACTIVE_PER_MEMBER ? 'Limit reached' : `${count}/${MAX_ACTIVE_PER_MEMBER} books`}
                </span>
              </>
            )
          }}
          placeholder="Search by name, ID, email or mobile…"
          emptyText="No members match your search"
          error={visibleErrors.member}
        />

        <h2 className="form-section-title">2. Select book</h2>
        <Combobox
          label="Book *"
          items={sortedBooks}
          selected={book}
          onSelect={setBook}
          getLabel={(b) => b.title}
          matches={(b, q) =>
            b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q.replace(/[-\s]/g, ''))
          }
          isDisabled={(b) => b.availableCopies < 1 || (member && activePairs.has(`${member.id}:${b.id}`))}
          renderOption={(b) => {
            const duplicate = member && activePairs.has(`${member.id}:${b.id}`)
            return (
              <>
                <BookCover src={b.coverImage} title={b.title} className="option-cover" />
                <span className="option-text">
                  <strong>{b.title}</strong>
                  <span className="muted">{b.author} · {b.isbn}</span>
                </span>
                <span className={`option-tag ${duplicate || b.availableCopies < 1 ? 'tag-danger' : 'tag-success'}`}>
                  {duplicate ? 'Already issued' : b.availableCopies < 1 ? 'Unavailable' : `${b.availableCopies} left`}
                </span>
              </>
            )
          }}
          placeholder="Search by title, author or ISBN…"
          emptyText="No books match your search"
          error={visibleErrors.book}
        />

        <h2 className="form-section-title">3. Loan period</h2>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="issueDate">Issue date *</label>
            <input
              id="issueDate"
              type="date"
              value={issueDate}
              max={today}
              onChange={(e) => changeIssueDate(e.target.value)}
              className={visibleErrors.issueDate ? 'has-error' : ''}
            />
            {visibleErrors.issueDate && <p className="field-error">{visibleErrors.issueDate}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="dueDate">Return due date *</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              min={issueDate ? addDays(issueDate, 1) : undefined}
              onChange={(e) => setDueDate(e.target.value)}
              className={visibleErrors.dueDate ? 'has-error' : ''}
            />
            {visibleErrors.dueDate && <p className="field-error">{visibleErrors.dueDate}</p>}
          </div>
        </div>
        <div className="loan-presets">
          <span className="muted">Quick loan:</span>
          {LOAN_PRESETS.map((days) => (
            <button
              key={days}
              type="button"
              className={`chip ${loanDays === days ? 'active' : ''}`}
              onClick={() => issueDate && setDueDate(addDays(issueDate, days))}
            >
              {days} days
            </button>
          ))}
        </div>
      </section>

      <aside className="card issue-summary">
        <h2 className="form-section-title">Summary</h2>

        <div className={`summary-block ${member ? '' : 'is-empty'}`}>
          {member ? (
            <>
              <Avatar name={member.fullName} size={44} />
              <div>
                <Link to={`/members/${member.id}`} className="summary-title">{member.fullName}</Link>
                <span className="muted">{member.membershipId}</span>
                <span className="muted">
                  {memberActive} of {MAX_ACTIVE_PER_MEMBER} books currently issued
                </span>
              </div>
              <button type="button" className="summary-clear" onClick={() => setMember(null)} aria-label="Clear member">×</button>
            </>
          ) : (
            <p className="muted">No member selected</p>
          )}
        </div>

        <div className={`summary-block ${book ? '' : 'is-empty'}`}>
          {book ? (
            <>
              <BookCover src={book.coverImage} title={book.title} className="summary-cover" />
              <div>
                <Link to={`/books/${book.id}`} className="summary-title">{book.title}</Link>
                <span className="muted">by {book.author}</span>
                <span className={`availability ${book.availableCopies > 0 ? 'is-available' : 'is-out'}`}>
                  {book.availableCopies} of {book.totalCopies} copies available
                </span>
              </div>
              <button type="button" className="summary-clear" onClick={() => setBook(null)} aria-label="Clear book">×</button>
            </>
          ) : (
            <p className="muted">No book selected</p>
          )}
        </div>

        <dl className="summary-dates">
          <div>
            <dt>Issue date</dt>
            <dd>{formatDate(issueDate)}</dd>
          </div>
          <div>
            <dt>Due date</dt>
            <dd>{formatDate(dueDate)}</dd>
          </div>
          <div>
            <dt>Loan period</dt>
            <dd>{loanDays > 0 ? `${loanDays} days` : '—'}</dd>
          </div>
        </dl>

        <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
          {saving ? 'Issuing…' : 'Issue Book'}
        </button>
      </aside>
    </form>
  )
}
