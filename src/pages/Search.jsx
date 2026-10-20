import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import BookCover from '../components/BookCover'
import Pagination from '../components/Pagination'
import Highlight from '../components/Highlight'
import { getBooks } from '../services/bookService'
import { getMembers } from '../services/memberService'
import { getCategories } from '../services/categoryService'
import { BOOK_SEARCH_FIELDS, matchBook, matchMember, matchScore } from '../utils/search'

const PAGE_SIZE = 10
const FIELD_LABELS = { title: 'Title match', author: 'Author match', isbn: 'ISBN match' }

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const by = BOOK_SEARCH_FIELDS[searchParams.get('by')] ? searchParams.get('by') : 'all'
  const category = searchParams.get('category') ?? ''
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getBooks(), getMembers(), getCategories()])
      .then(([books, members, categories]) => !cancelled && setData({ books, members, categories }))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [])

  const update = (changes) => {
    const next = { q, by, category, ...changes }
    setSearchParams(
      Object.fromEntries(Object.entries(next).filter(([k, v]) => v && !(k === 'by' && v === 'all'))),
      { replace: true },
    )
    setPage(1)
  }

  const results = useMemo(() => {
    if (!data || !q.trim()) return null
    const books = data.books
      .filter((b) => !category || b.category === category)
      .map((b) => ({ book: b, field: matchBook(b, q, by) }))
      .filter((r) => r.field)
      .sort((a, b) => matchScore(a.book[a.field], q) - matchScore(b.book[b.field], q) || a.book.title.localeCompare(b.book.title))
    // Members and categories only make sense for an "all fields" search without a category filter.
    const broad = by === 'all' && !category
    return {
      books,
      members: broad ? data.members.filter((m) => matchMember(m, q)) : [],
      categories: broad ? data.categories.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())) : [],
    }
  }, [data, q, by, category])

  const totalPages = results ? Math.max(1, Math.ceil(results.books.length / PAGE_SIZE)) : 1
  const currentPage = Math.min(page, totalPages)
  const visibleBooks = results?.books.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) ?? []
  const nothingFound = results && !results.books.length && !results.members.length && !results.categories.length

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">⚠️</div>
        <h2>Couldn&apos;t load search data</h2>
        <p className="muted">{error}</p>
      </div>
    )
  }

  return (
    <div className="search-page">
      <div className="page-header">
        <div>
          <h1>Search</h1>
          <p className="muted">
            {results
              ? `${results.books.length} book${results.books.length === 1 ? '' : 's'}${
                  by === 'all' && !category ? `, ${results.members.length} members, ${results.categories.length} categories` : ''
                } for “${q.trim()}”`
              : 'Find books by title, author or ISBN — or look up members and categories.'}
          </p>
        </div>
      </div>

      <div className="card toolbar search-toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder={by === 'all' ? 'Search title, author, ISBN, members…' : `Search by ${BOOK_SEARCH_FIELDS[by].toLowerCase()}…`}
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            aria-label="Search"
            autoFocus
          />
        </div>
        <select value={category} onChange={(e) => update({ category: e.target.value })} aria-label="Filter by category">
          <option value="">All categories</option>
          {data?.categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name} ({c.bookCount})</option>
          ))}
        </select>
        <div className="filter-chips search-fields" role="group" aria-label="Search in">
          <span className="muted">Search in:</span>
          {Object.entries(BOOK_SEARCH_FIELDS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`chip ${by === key ? 'active' : ''}`}
              aria-pressed={by === key}
              onClick={() => update({ by: key })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!data && (
        <div className="card state-card" aria-busy="true">
          <div className="spinner" />
          <p className="muted">Loading…</p>
        </div>
      )}

      {data && !results && (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">🔎</div>
          <h2>Start typing to search</h2>
          <p className="muted">
            Tip: press <kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd> anywhere to jump to the search box.
          </p>
        </div>
      )}

      {nothingFound && (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">🔍</div>
          <h2>No results for &ldquo;{q.trim()}&rdquo;</h2>
          <p className="muted">
            {by !== 'all' || category ? 'Try searching all fields or all categories.' : 'Check the spelling or try fewer words.'}
          </p>
          {(by !== 'all' || category) && (
            <button type="button" className="btn btn-outline" onClick={() => update({ by: 'all', category: '' })}>
              Search everywhere
            </button>
          )}
        </div>
      )}

      {results && !nothingFound && (
        <div className="search-results">
          {results.books.length > 0 && (
            <section>
              <h2 className="search-heading">Books <span>{results.books.length}</span></h2>
              <div className="card search-list">
                {visibleBooks.map(({ book, field }) => (
                  <Link key={book.id} to={`/books/${book.id}`} className="search-row">
                    <BookCover src={book.coverImage} title={book.title} className="table-cover" />
                    <div className="search-row-main">
                      <strong><Highlight text={book.title} query={field === 'title' ? q : ''} /></strong>
                      <span className="muted">
                        by <Highlight text={book.author} query={field === 'author' ? q : ''} />
                      </span>
                      <span className="muted search-row-meta">
                        ISBN <Highlight text={book.isbn} query={field === 'isbn' ? q : ''} /> · {book.category}
                      </span>
                    </div>
                    <div className="search-row-side">
                      <span className="option-tag">{FIELD_LABELS[field]}</span>
                      <span className={`availability ${book.availableCopies > 0 ? 'is-available' : 'is-out'}`}>
                        {book.availableCopies > 0 ? `${book.availableCopies}/${book.totalCopies} available` : 'Not available'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="list-footer">
                <Pagination page={currentPage} totalPages={totalPages} totalItems={results.books.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
              </div>
            </section>
          )}

          {results.members.length > 0 && (
            <section>
              <h2 className="search-heading">Members <span>{results.members.length}</span></h2>
              <div className="card search-list">
                {results.members.slice(0, 10).map((m) => (
                  <Link key={m.id} to={`/members/${m.id}`} className="search-row">
                    <Avatar name={m.fullName} size={40} />
                    <div className="search-row-main">
                      <strong><Highlight text={m.fullName} query={q} /></strong>
                      <span className="muted">{m.membershipId} · {m.email}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {results.members.length > 10 && (
                <p className="muted search-more">
                  Showing 10 of {results.members.length}. <Link to="/members" className="link">Open the member list</Link> to see all.
                </p>
              )}
            </section>
          )}

          {results.categories.length > 0 && (
            <section>
              <h2 className="search-heading">Categories <span>{results.categories.length}</span></h2>
              <div className="search-category-chips">
                {results.categories.map((c) => (
                  <Link key={c.id} to={`/books?category=${encodeURIComponent(c.name)}`} className={`search-category accent-${c.accent}`}>
                    <Highlight text={c.name} query={q} /> <span>{c.bookCount}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
