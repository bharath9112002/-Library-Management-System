import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import BookCover from '../../components/BookCover'
import ConfirmDialog from '../../components/ConfirmDialog'
import useToast from '../../context/useToast'
import { deleteBook, getBookById, largeCover } from '../../services/bookService'

export default function BookDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [book, setBook] = useState(null)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getBookById(id)
      .then((data) => !cancelled && setBook(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteBook(book.id)
      toast.success(`"${book.title}" was deleted.`)
      navigate('/books', { replace: true })
    } catch (err) {
      toast.error(`Could not delete: ${err.message}`)
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">📕</div>
        <h2>{error}</h2>
        <p className="muted">The book may have been deleted or the link is incorrect.</p>
        <Link to="/books" className="btn btn-primary">Back to books</Link>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="card book-details" aria-busy="true">
        <div className="skeleton skeleton-cover details-cover" />
        <div className="book-details-info">
          <div className="skeleton skeleton-line" style={{ height: 28, width: '70%' }} />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line" style={{ height: 100, marginTop: 24 }} />
        </div>
      </div>
    )
  }

  const issued = book.totalCopies - book.availableCopies
  const availablePct = book.totalCopies ? (book.availableCopies / book.totalCopies) * 100 : 0

  return (
    <div className="books-page">
      <Link to="/books" className="back-link">‹ Back to books</Link>

      <article className="card book-details">
        <BookCover src={largeCover(book.coverImage)} title={book.title} className="details-cover" />

        <div className="book-details-info">
          <span className="category-badge">{book.category}</span>
          <h1>{book.title}</h1>
          <p className="details-author">by <strong>{book.author}</strong></p>

          <dl className="details-grid">
            <div>
              <dt>ISBN</dt>
              <dd>{book.isbn}</dd>
            </div>
            <div>
              <dt>Publisher</dt>
              <dd>{book.publisher}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{book.publishedYear || '—'}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{book.category}</dd>
            </div>
          </dl>

          <div className="copies-box">
            <div className="copies-numbers">
              <div>
                <strong>{book.availableCopies}</strong>
                <span>Available</span>
              </div>
              <div>
                <strong>{issued}</strong>
                <span>Issued</span>
              </div>
              <div>
                <strong>{book.totalCopies}</strong>
                <span>Total copies</span>
              </div>
            </div>
            <div className="copies-bar" aria-hidden="true">
              <span style={{ width: `${availablePct}%` }} />
            </div>
            <p className={`availability ${book.availableCopies > 0 ? 'is-available' : 'is-out'}`}>
              {book.availableCopies > 0 ? 'Available to issue' : 'All copies are currently issued'}
            </p>
          </div>

          <h2 className="details-subheading">Description</h2>
          <p className="details-description">{book.description}</p>

          <div className="details-actions">
            <Link to={`/books/${book.id}/edit`} className="btn btn-primary">✎ Edit Book</Link>
            <button type="button" className="btn btn-danger-outline" onClick={() => setConfirmOpen(true)}>
              🗑 Delete
            </button>
          </div>
        </div>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this book?"
        message={`"${book.title}" will be permanently removed from the catalogue.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
