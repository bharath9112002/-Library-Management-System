import { useEffect, useState } from 'react'
import { DESCRIPTION_MAX, NAME_MAX, validateCategory } from '../../services/categoryService'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function useEscape(onCancel, disabled) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !disabled) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, disabled])
}

// Add (category = null) or edit a category.
export function CategoryFormDialog({ category, categories, onCancel, onSave }) {
  const [values, setValues] = useState({ name: category?.name ?? '', description: category?.description ?? '' })
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEscape(onCancel, saving)

  const errors = validateCategory(values, categories, category?.id)
  const renaming = category && values.name.trim() && values.name.trim() !== category.name

  const change = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const submit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, description: true })
    if (Object.keys(errors).length) return
    setError('')
    setSaving(true)
    try {
      await onSave(values)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !saving && onCancel()}>
      <form
        className="modal modal-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
      >
        <h2 id="category-title">{category ? 'Edit category' : 'Add category'}</h2>

        <div className="form-group">
          <label htmlFor="category-name">Name *</label>
          <input
            id="category-name"
            name="name"
            value={values.name}
            onChange={change}
            onBlur={blur}
            maxLength={NAME_MAX + 10}
            placeholder="e.g. Graphic Novels"
            className={touched.name && errors.name ? 'has-error' : ''}
            aria-invalid={Boolean(touched.name && errors.name)}
            autoFocus
          />
          {touched.name && errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="category-description">Description</label>
          <textarea
            id="category-description"
            name="description"
            rows={3}
            value={values.description}
            onChange={change}
            onBlur={blur}
            placeholder="What kind of books belong here? (optional)"
            className={touched.description && errors.description ? 'has-error' : ''}
          />
          <div className="textarea-footer">
            {touched.description && errors.description ? <p className="field-error">{errors.description}</p> : <span />}
            <span className="muted">{values.description.trim().length}/{DESCRIPTION_MAX}</span>
          </div>
        </div>

        {renaming && category.bookCount > 0 && (
          <div className="alert alert-warning">
            {plural(category.bookCount, 'book')} will move from &ldquo;{category.name}&rdquo; to &ldquo;{values.name.trim()}&rdquo;.
          </div>
        )}
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : category ? 'Save changes' : 'Add category'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Delete; a category that still has books asks where to move them.
export function DeleteCategoryDialog({ category, categories, onCancel, onDelete }) {
  const others = categories.filter((c) => c.id !== category.id)
  const [moveTo, setMoveTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEscape(onCancel, saving)

  const needsMove = category.bookCount > 0
  const blocked = needsMove && others.length === 0

  const submit = async () => {
    setError('')
    setSaving(true)
    try {
      await onDelete(moveTo)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !saving && onCancel()}>
      <div className="modal modal-left" role="alertdialog" aria-modal="true" aria-labelledby="delete-category-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="delete-category-title">Delete &ldquo;{category.name}&rdquo;?</h2>
        {needsMove ? (
          <>
            <p className="muted">
              {plural(category.bookCount, 'book')} {category.bookCount === 1 ? 'is' : 'are'} in this category. Choose where to move{' '}
              {category.bookCount === 1 ? 'it' : 'them'} before deleting.
            </p>
            {blocked ? (
              <div className="alert alert-warning">Add another category first so these books have somewhere to go.</div>
            ) : (
              <div className="form-group">
                <label htmlFor="move-to">Move books to *</label>
                <select id="move-to" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                  <option value="">Select a category…</option>
                  {others.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({plural(c.bookCount, 'book')})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : (
          <p className="muted">This category has no books. It will be permanently removed.</p>
        )}
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={submit} disabled={saving || blocked || (needsMove && !moveTo)}>
            {saving ? 'Deleting…' : needsMove ? 'Move books & delete' : 'Delete category'}
          </button>
        </div>
      </div>
    </div>
  )
}
