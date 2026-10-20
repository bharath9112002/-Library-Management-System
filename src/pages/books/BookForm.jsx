import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import TextInput from '../../components/TextInput'
import BookCover from '../../components/BookCover'
import useForm from '../../utils/useForm'
import useToast from '../../context/useToast'
import { validateBook } from '../../utils/validation'
import { createBook, getBookById, getBooks, isIsbnTaken, updateBook } from '../../services/bookService'
import { getCategories } from '../../services/categoryService'

const EMPTY_BOOK = {
  title: '',
  author: '',
  isbn: '',
  publisher: '',
  category: '',
  publishedYear: '',
  totalCopies: '1',
  availableCopies: '1',
  coverImage: '',
  description: '',
}

// Wrapper: loads the book (edit mode) before rendering the form,
// so the form can be initialised with the right values.
export default function BookFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const presetCategory = searchParams.get('category') ?? '' // from "Add a book" on the categories page
  const isEdit = Boolean(id)
  const [book, setBook] = useState(null)
  const [suggestions, setSuggestions] = useState({ categories: [], authors: [], publishers: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([isEdit ? getBookById(id) : Promise.resolve(null), getBooks(), getCategories()])
      .then(([found, all, categories]) => {
        if (cancelled) return
        const unique = (key) => [...new Set(all.map((b) => b[key]))].sort((a, b) => a.localeCompare(b))
        const categoryNames = categories.map((c) => c.name)
        setSuggestions({ categories: categoryNames, authors: unique('author'), publishers: unique('publisher') })
        setBook(
          found
            ? Object.fromEntries(Object.keys(EMPTY_BOOK).map((key) => [key, String(found[key] ?? '')]))
            : { ...EMPTY_BOOK, category: categoryNames.includes(presetCategory) ? presetCategory : '' },
        )
      })
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id, isEdit, presetCategory])

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">⚠️</div>
        <h2>{error}</h2>
        <Link to="/books" className="btn btn-primary">Back to books</Link>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="card state-card" aria-busy="true">
        <div className="spinner" />
        <p className="muted">Loading…</p>
      </div>
    )
  }

  return <BookForm key={id ?? 'new'} bookId={id} initialValues={book} suggestions={suggestions} />
}

function BookForm({ bookId, initialValues, suggestions }) {
  const isEdit = Boolean(bookId)
  const navigate = useNavigate()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validate = useMemo(
    () => (values) => {
      const errors = validateBook(values)
      if (!errors.isbn && isIsbnTaken(values.isbn, bookId)) errors.isbn = 'Another book already uses this ISBN.'
      return errors
    },
    [bookId],
  )

  const { values, errors, isValid, handleChange, handleBlur, touchAll } = useForm(initialValues, validate)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    touchAll()
    if (!isValid) return

    const payload = {
      ...values,
      title: values.title.trim(),
      author: values.author.trim(),
      isbn: values.isbn.trim(),
      publisher: values.publisher.trim(),
      category: values.category.trim(),
      description: values.description.trim(),
      coverImage: values.coverImage.trim(),
      publishedYear: Number(values.publishedYear),
      totalCopies: Number(values.totalCopies),
      availableCopies: Number(values.availableCopies),
    }

    setSaving(true)
    try {
      const saved = isEdit ? await updateBook(bookId, payload) : await createBook(payload)
      toast.success(isEdit ? 'Book updated successfully.' : 'Book added successfully.')
      navigate(`/books/${saved.id}`, { replace: true })
    } catch (err) {
      setSubmitError(err.message)
      setSaving(false)
    }
  }

  const field = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: errors[name],
  })

  return (
    <div className="books-page">
      <Link to={isEdit ? `/books/${bookId}` : '/books'} className="back-link">‹ Back</Link>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Book' : 'Add New Book'}</h1>
          <p className="muted">{isEdit ? 'Update the book details below.' : 'Fill in the details to add a book to the catalogue.'}</p>
        </div>
      </div>

      {submitError && <div className="alert alert-error" role="alert">Could not save: {submitError}</div>}

      <form className="book-form" onSubmit={handleSubmit} noValidate>
        <section className="card form-cover">
          <h2>Cover</h2>
          <BookCover src={values.coverImage} title={values.title || 'New Book'} className="form-cover-preview" />
          <TextInput {...field('coverImage')} label="Cover image URL (optional)" placeholder="https://…" />
          <p className="muted form-hint">Leave empty to use a generated cover with the book title.</p>
        </section>

        <section className="card form-fields">
          <h2>Book details</h2>
          <div className="form-grid">
            <div className="span-2">
              <TextInput {...field('title')} label="Book title *" placeholder="e.g. The Silent Library" />
            </div>
            <TextInput {...field('author')} label="Author name *" placeholder="e.g. Ruskin Bond" list="author-options" />
            <TextInput {...field('isbn')} label="ISBN number *" placeholder="9780140449136" />
            <TextInput {...field('publisher')} label="Publisher *" placeholder="e.g. Penguin India" list="publisher-options" />
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={values.category}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.category ? 'has-error' : ''}
                aria-invalid={Boolean(errors.category)}
              >
                <option value="">Select a category…</option>
                {/* Keep a category that was removed from the list selectable for books that still use it. */}
                {[...new Set([...suggestions.categories, ...(values.category ? [values.category] : [])])].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category ? (
                <p className="field-error">{errors.category}</p>
              ) : (
                <p className="muted form-hint">
                  Missing one? <Link to="/categories" className="link">Manage categories</Link>
                </p>
              )}
            </div>
            <TextInput {...field('publishedYear')} type="number" label="Published year *" placeholder="e.g. 2021" min="1000" />
            <div className="copies-inputs">
              <TextInput {...field('totalCopies')} type="number" label="Total copies *" min="1" />
              <TextInput {...field('availableCopies')} type="number" label="Available copies *" min="0" />
            </div>
            <div className="span-2 form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="A short summary of the book…"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.description ? 'has-error' : ''}
                aria-invalid={Boolean(errors.description)}
              />
              <div className="textarea-footer">
                {errors.description ? <p className="field-error">{errors.description}</p> : <span />}
                <span className="muted">{values.description.trim().length}/1000</span>
              </div>
            </div>
          </div>

          <datalist id="author-options">
            {suggestions.authors.map((a) => <option key={a} value={a} />)}
          </datalist>
          <datalist id="publisher-options">
            {suggestions.publishers.map((p) => <option key={p} value={p} />)}
          </datalist>

          <div className="form-actions">
            <Link to={isEdit ? `/books/${bookId}` : '/books'} className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add book'}
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}
