import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import BookCover from '../../components/BookCover'
import Pagination from '../../components/Pagination'
import ConfirmDialog from '../../components/ConfirmDialog'
import useToast from '../../context/useToast'
import { deleteBook, getBooks, resetBooks } from '../../services/bookService'

const SORTS = {
  'title-asc': { label: 'Title (A–Z)', fn: (a, b) => a.title.localeCompare(b.title) },
  'title-desc': { label: 'Title (Z–A)', fn: (a, b) => b.title.localeCompare(a.title) },
  'year-desc': { label: 'Newest first', fn: (a, b) => b.publishedYear - a.publishedYear },
  'year-asc': { label: 'Oldest first', fn: (a, b) => a.publishedYear - b.publishedYear },
}
const PAGE_SIZES = [8, 12, 24, 48]
const DEFAULTS = { q: '', category: '', author: '', sort: 'title-asc', page: '1', size: '12' }

const uniqueSorted = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b))

function SkeletonGrid({ count }) {
  return (
    <div className="book-grid" aria-busy="true" aria-label="Loading books">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="book-card skeleton-card">
          <div className="skeleton skeleton-cover" />
          <div className="book-card-body">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function BookList() {
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const params = Object.fromEntries(
    Object.entries(DEFAULTS).map(([key, def]) => [key, searchParams.get(key) ?? def]),
  )

  const updateParams = (changes, { resetPage = true } = {}) => {
    const next = { ...params, ...changes }
    if (resetPage) next.page = '1'
    // Keep the URL clean: drop values that equal the defaults.
    const cleaned = Object.fromEntries(Object.entries(next).filter(([k, v]) => v !== DEFAULTS[k]))
    setSearchParams(cleaned, { replace: true })
  }

  const load = useCallback(async (loader) => {
    try {
      const data = await loader()
      setBooks(data)
      setStatus('ready')
      return true
    } catch (err) {
      setError(err.message)
      setStatus('error')
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getBooks()
      .then((data) => {
        if (cancelled) return
        setBooks(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const retry = () => {
    setStatus('loading')
    load(getBooks)
  }

  const handleReset = async () => {
    if (!window.confirm('Reload all books from the API? Your local additions and edits will be lost.')) return
    setStatus('loading')
    if (await load(resetBooks)) toast.success('Books reloaded from Open Library.')
  }

  const categories = useMemo(() => uniqueSorted(books.map((b) => b.category)), [books])
  const authors = useMemo(() => uniqueSorted(books.map((b) => b.author)), [books])

  const filtered = useMemo(() => {
    const q = params.q.trim().toLowerCase()
    const qDigits = q.replace(/[-\s]/g, '')
    return books
      .filter((b) => !params.category || b.category === params.category)
      .filter((b) => !params.author || b.author === params.author)
      .filter(
        (b) =>
          !q ||
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (qDigits && b.isbn.replace(/-/g, '').includes(qDigits)),
      )
      .sort((SORTS[params.sort] ?? SORTS['title-asc']).fn)
  }, [books, params.q, params.category, params.author, params.sort])

  const pageSize = Number(params.size) || 12
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages)
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const hasFilters = params.q || params.category || params.author

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteBook(toDelete.id)
      setBooks((list) => list.filter((b) => b.id !== toDelete.id))
      toast.success(`"${toDelete.title}" was deleted.`)
      setToDelete(null)
    } catch (err) {
      toast.error(`Could not delete: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="books-page">
      <div className="page-header">
        <div>
          <h1>Books</h1>
          <p className="muted">
            {status === 'ready' ? `${books.length} titles in the catalogue` : 'Manage your library catalogue'}
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-outline" onClick={handleReset} disabled={status === 'loading'}>
            Reload from API
          </button>
          <Link to="/books/new" className="btn btn-primary">
            <Icon name="plus" size={18} /> Add Book
          </Link>
        </div>
      </div>

      <div className="card toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search by title, author or ISBN…"
            value={params.q}
            onChange={(e) => updateParams({ q: e.target.value })}
            aria-label="Search books"
          />
        </div>
        <select value={params.category} onChange={(e) => updateParams({ category: e.target.value })} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={params.author} onChange={(e) => updateParams({ author: e.target.value })} aria-label="Filter by author">
          <option value="">All authors</option>
          {authors.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={params.sort} onChange={(e) => updateParams({ sort: e.target.value })} aria-label="Sort books">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
        {hasFilters && (
          <button type="button" className="btn btn-link" onClick={() => updateParams({ q: '', category: '', author: '' })}>
            Clear filters
          </button>
        )}
      </div>

      {status === 'loading' && <SkeletonGrid count={pageSize > 12 ? 12 : pageSize} />}

      {status === 'error' && (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">⚠️</div>
          <h2>Couldn&apos;t load books</h2>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn-primary" onClick={retry}>Try again</button>
        </div>
      )}

      {status === 'ready' && filtered.length === 0 && (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">🔍</div>
          <h2>No books found</h2>
          <p className="muted">Try a different search or clear the filters.</p>
          {hasFilters && (
            <button type="button" className="btn btn-outline" onClick={() => updateParams({ q: '', category: '', author: '' })}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <>
          <div className="book-grid">
            {visible.map((book) => {
              const available = book.availableCopies > 0
              return (
                <article key={book.id} className="book-card">
                  <Link to={`/books/${book.id}`} className="book-card-link" aria-label={`View ${book.title}`}>
                    <div className="book-cover-wrap">
                      <BookCover src={book.coverImage} title={book.title} />
                      <span className="book-category-chip">{book.category}</span>
                    </div>
                    <div className="book-card-body">
                      <h3 className="book-title" title={book.title}>{book.title}</h3>
                      <p className="book-author">by {book.author}</p>
                      <div className="book-meta">
                        <span className={`availability ${available ? 'is-available' : 'is-out'}`}>
                          {available ? `${book.availableCopies}/${book.totalCopies} available` : 'Not available'}
                        </span>
                        <span className="muted">{book.publishedYear || ''}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="book-card-actions">
                    <button type="button" className="btn-icon" onClick={() => navigate(`/books/${book.id}/edit`)} aria-label={`Edit ${book.title}`} title="Edit">
                      ✎
                    </button>
                    <button type="button" className="btn-icon danger" onClick={() => setToDelete(book)} aria-label={`Delete ${book.title}`} title="Delete">
                      🗑
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="list-footer">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={(p) => {
                updateParams({ page: String(p) }, { resetPage: false })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
            <label className="page-size">
              Per page
              <select value={params.size} onChange={(e) => updateParams({ size: e.target.value })}>
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this book?"
        message={toDelete ? `"${toDelete.title}" will be permanently removed from the catalogue.` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
