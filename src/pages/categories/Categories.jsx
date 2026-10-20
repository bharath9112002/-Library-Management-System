import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import useToast from '../../context/useToast'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../services/categoryService'
import { CategoryFormDialog, DeleteCategoryDialog } from './CategoryDialogs'

const SORTS = {
  name: { label: 'Name (A–Z)', fn: (a, b) => a.name.localeCompare(b.name) },
  books: { label: 'Most books', fn: (a, b) => b.bookCount - a.bookCount || a.name.localeCompare(b.name) },
  newest: { label: 'Recently added', fn: (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id },
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function Categories() {
  const toast = useToast()
  const [categories, setCategories] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('name')
  const [editing, setEditing] = useState(null) // null | 'new' | category
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    let cancelled = false
    getCategories()
      .then((c) => !cancelled && setCategories(c))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => setCategories(await getCategories()), [])

  const visible = useMemo(() => {
    if (!categories) return []
    const q = query.trim().toLowerCase()
    return categories
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      .sort(SORTS[sort].fn)
  }, [categories, query, sort])

  const totals = useMemo(
    () => ({
      books: categories?.reduce((sum, c) => sum + c.bookCount, 0) ?? 0,
      empty: categories?.filter((c) => c.bookCount === 0).length ?? 0,
    }),
    [categories],
  )

  const saveCategory = async (values) => {
    if (editing === 'new') {
      const created = await createCategory(values)
      toast.success(`Category "${created.name}" added.`)
    } else {
      const renamed = await updateCategory(editing.id, values)
      toast.success(renamed ? `Category renamed. ${plural(renamed, 'book')} updated.` : 'Category updated.')
    }
    setEditing(null)
    await refresh()
  }

  const removeCategory = async (moveToId) => {
    const moved = await deleteCategory(deleting.id, moveToId)
    const target = categories.find((c) => c.id === Number(moveToId))
    toast.success(
      moved ? `"${deleting.name}" deleted. ${plural(moved, 'book')} moved to ${target.name}.` : `"${deleting.name}" deleted.`,
    )
    setDeleting(null)
    await refresh()
  }

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">⚠️</div>
        <h2>Couldn&apos;t load categories</h2>
        <p className="muted">{error}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="muted">
            {categories
              ? `${plural(categories.length, 'category')} · ${plural(totals.books, 'book')}${totals.empty ? ` · ${totals.empty} empty` : ''}`
              : 'Organise the catalogue into categories'}
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')} disabled={!categories}>
            <Icon name="plus" size={18} /> Add Category
          </button>
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
            placeholder="Search categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search categories"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort categories">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
      </div>

      {!categories ? (
        <div className="card state-card" aria-busy="true">
          <div className="spinner" />
          <p className="muted">Loading categories…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">{query ? '🔍' : '🏷️'}</div>
          <h2>{query ? 'No matching categories' : 'No categories yet'}</h2>
          <p className="muted">{query ? 'Try a different search.' : 'Add a category to start organising books.'}</p>
        </div>
      ) : (
        <div className="category-grid">
          {visible.map((c) => (
            <article key={c.id} className={`card category-card accent-${c.accent}`}>
              <div className="category-head">
                <span className="category-icon" aria-hidden="true">
                  <Icon name="tag" size={20} />
                </span>
                <div className="category-actions">
                  <button type="button" className="btn-icon" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} title="Edit">
                    ✎
                  </button>
                  <button type="button" className="btn-icon danger" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`} title="Delete">
                    🗑
                  </button>
                </div>
              </div>
              <h3>{c.name}</h3>
              <p className="muted category-description">{c.description || 'No description'}</p>
              <div className="category-stats">
                <span>
                  <strong>{c.bookCount}</strong> {c.bookCount === 1 ? 'book' : 'books'}
                </span>
                <span>
                  <strong>{c.availableCopies}</strong>/{c.totalCopies} copies available
                </span>
              </div>
              {c.bookCount > 0 ? (
                <Link to={`/books?category=${encodeURIComponent(c.name)}`} className="category-link">
                  View books →
                </Link>
              ) : (
                <Link to={`/books/new?category=${encodeURIComponent(c.name)}`} className="category-link">
                  Add a book →
                </Link>
              )}
            </article>
          ))}
        </div>
      )}

      {editing && (
        <CategoryFormDialog
          category={editing === 'new' ? null : editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSave={saveCategory}
        />
      )}
      {deleting && (
        <DeleteCategoryDialog category={deleting} categories={categories} onCancel={() => setDeleting(null)} onDelete={removeCategory} />
      )}
    </div>
  )
}
