import { useState } from 'react'

function EyeIcon({ open }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  )
}

export default function PasswordInput({ id, label, error, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className={`password-field ${error ? 'has-error' : ''}`}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        <button
          type="button"
          className="toggle-visibility"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={!visible} />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
