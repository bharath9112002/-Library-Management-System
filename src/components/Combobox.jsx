import { useId, useRef, useState } from 'react'

const MAX_RESULTS = 50

// Searchable select. Type to filter, arrow keys to move, Enter to pick, Esc to close.
export default function Combobox({
  label,
  items,
  selected,
  onSelect,
  getLabel,
  matches,
  renderOption,
  isDisabled = () => false,
  placeholder,
  emptyText = 'No matches',
  error,
}) {
  const id = useId()
  const listId = `${id}-list`
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef(null)

  const q = query.trim().toLowerCase()
  const results = (q ? items.filter((item) => matches(item, q)) : items).slice(0, MAX_RESULTS)

  const choose = (item) => {
    if (!item || isDisabled(item)) return
    onSelect(item)
    setQuery('')
    setOpen(false)
  }

  const move = (step) => {
    if (!results.length) return
    const next = (active + step + results.length) % results.length
    setActive(next)
    listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else move(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="form-group combobox">
      <label htmlFor={id}>{label}</label>
      <div className={`combobox-field ${error ? 'has-error' : ''} ${open ? 'is-open' : ''}`}>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          autoComplete="off"
          placeholder={selected ? getLabel(selected) : placeholder}
          className={selected ? 'has-selection' : ''}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
        <span className="combobox-caret" aria-hidden="true">▾</span>
      </div>

      {open && (
        <ul id={listId} ref={listRef} className="combobox-list" role="listbox">
          {results.length === 0 && <li className="combobox-empty">{emptyText}</li>}
          {results.map((item, index) => {
            const disabled = isDisabled(item)
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={selected?.id === item.id}
                aria-disabled={disabled}
                className={`combobox-option ${index === active ? 'active' : ''} ${disabled ? 'disabled' : ''} ${selected?.id === item.id ? 'selected' : ''}`}
                // mousedown (not click) so it fires before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(item)
                }}
                onMouseEnter={() => setActive(index)}
              >
                {renderOption(item)}
              </li>
            )
          })}
          {results.length === MAX_RESULTS && (
            <li className="combobox-empty">Showing first {MAX_RESULTS} — type to narrow down</li>
          )}
        </ul>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
