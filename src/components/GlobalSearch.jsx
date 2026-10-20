import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BookCover from './BookCover'
import Avatar from './Avatar'
import Icon from './Icon'
import Highlight from './Highlight'
import { getBooks } from '../services/bookService'
import { getMembers } from '../services/memberService'
import { getCategories } from '../services/categoryService'
import { matchBook, matchMember, matchScore } from '../utils/search'

const LIMITS = { book: 5, member: 3, category: 3 }
const SECTION_TITLES = { book: 'Books', member: 'Members', category: 'Categories' }
const FIELD_LABELS = { title: 'Title', author: 'Author', isbn: 'ISBN' }

// Topbar search across books (title / author / ISBN), members and categories.
// Enter with nothing highlighted opens the full results page.
export default function GlobalSearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [data, setData] = useState(null)

  // Reload on every focus so results reflect changes made elsewhere in the app.
  const load = () => {
    Promise.all([getBooks(), getMembers(), getCategories()])
      .then(([books, members, categories]) => setData({ books, members, categories }))
      .catch(() => setData((d) => d ?? { books: [], members: [], categories: [] }))
  }

  // "/" or Ctrl+K focuses the search from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close and clear after navigating somewhere.
  const [lastPath, setLastPath] = useState(location.pathname + location.search)
  const path = location.pathname + location.search
  if (path !== lastPath) {
    setLastPath(path)
    setOpen(false)
    if (location.pathname !== '/search') setQuery('')
  }

  const q = query.trim()
  const results = useMemo(() => {
    if (!data || !q) return []
    const books = data.books
      .map((b) => ({ book: b, field: matchBook(b, q) }))
      .filter((r) => r.field)
      .sort((a, b) => matchScore(a.book[a.field], q) - matchScore(b.book[b.field], q) || a.book.title.localeCompare(b.book.title))
    const members = data.members.filter((m) => matchMember(m, q))
    const categories = data.categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))

    return [
      ...books.slice(0, LIMITS.book).map(({ book, field }) => ({
        type: 'book',
        key: `b${book.id}`,
        to: `/books/${book.id}`,
        item: book,
        field,
        total: books.length,
      })),
      ...members.slice(0, LIMITS.member).map((m) => ({ type: 'member', key: `m${m.id}`, to: `/members/${m.id}`, item: m, total: members.length })),
      ...categories.slice(0, LIMITS.category).map((c) => ({
        type: 'category',
        key: `c${c.id}`,
        to: `/books?category=${encodeURIComponent(c.name)}`,
        item: c,
        total: categories.length,
      })),
    ]
  }, [data, q])

  const goToResults = () => {
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      // Options are the results plus the "See all results" row at index results.length.
      const count = results.length + 1
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i < 0 ? (step > 0 ? 0 : count - 1) : (i + step + count) % count))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const chosen = results[active]
      if (chosen) navigate(chosen.to)
      else goToResults()
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const showList = open && q

  return (
    <div className="global-search" role="search">
      <Icon name="search" size={18} />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={Boolean(showList)}
        aria-controls="global-search-list"
        aria-autocomplete="list"
        aria-label="Search books, members and categories"
        placeholder="Search title, author, ISBN, members…"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(-1)
          setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          load()
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      <kbd className="search-kbd" aria-hidden="true">/</kbd>

      {showList && (
        <ul id="global-search-list" className="global-search-list" role="listbox">
          {!data && <li className="combobox-empty">Loading…</li>}
          {data && results.length === 0 && <li className="combobox-empty">No results for &ldquo;{q}&rdquo;</li>}
          {results.map((r, index) => {
            const first = index === 0 || results[index - 1].type !== r.type
            return [
              first && (
                <li key={`h-${r.type}`} className="search-section" role="presentation">
                  {SECTION_TITLES[r.type]}
                  {r.total > LIMITS[r.type] && <span>{r.total} found</span>}
                </li>
              ),
              <li
                key={r.key}
                role="option"
                aria-selected={index === active}
                className={`combobox-option ${index === active ? 'active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  navigate(r.to)
                  inputRef.current?.blur()
                }}
                onMouseEnter={() => setActive(index)}
              >
                {r.type === 'book' && (
                  <>
                    <BookCover src={r.item.coverImage} title={r.item.title} className="option-cover" />
                    <span className="option-text">
                      <strong><Highlight text={r.item.title} query={r.field === 'title' ? q : ''} /></strong>
                      <span className="muted">
                        <Highlight text={r.item.author} query={r.field === 'author' ? q : ''} /> ·{' '}
                        <Highlight text={r.item.isbn} query={r.field === 'isbn' ? q : ''} />
                      </span>
                    </span>
                    <span className="option-tag">{FIELD_LABELS[r.field]}</span>
                  </>
                )}
                {r.type === 'member' && (
                  <>
                    <Avatar name={r.item.fullName} size={32} />
                    <span className="option-text">
                      <strong><Highlight text={r.item.fullName} query={q} /></strong>
                      <span className="muted">{r.item.membershipId} · {r.item.email}</span>
                    </span>
                  </>
                )}
                {r.type === 'category' && (
                  <>
                    <span className={`search-category-icon accent-${r.item.accent}`}>
                      <Icon name="tag" size={16} />
                    </span>
                    <span className="option-text">
                      <strong><Highlight text={r.item.name} query={q} /></strong>
                      <span className="muted">{r.item.bookCount} books</span>
                    </span>
                  </>
                )}
              </li>,
            ]
          })}
          {data && (
            <li
              role="option"
              aria-selected={active === results.length}
              className={`combobox-option search-all ${active === results.length ? 'active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                goToResults()
              }}
              onMouseEnter={() => setActive(results.length)}
            >
              See all results for &ldquo;{q}&rdquo; →
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
