import { useState } from 'react'

// Minimal form state + validation.
// `validate(values)` returns an object of { field: 'error message' } (empty string = valid).
export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})

  const allErrors = validate(values)
  // Only show an error once the user has interacted with the field (or tried to submit).
  const errors = Object.fromEntries(
    Object.entries(allErrors).map(([field, msg]) => [field, touched[field] ? msg : '']),
  )
  const isValid = Object.values(allErrors).every((msg) => !msg)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  const touchAll = () => {
    setTouched(Object.fromEntries(Object.keys(initialValues).map((key) => [key, true])))
  }

  const reset = () => {
    setValues(initialValues)
    setTouched({})
  }

  const setFields = (fields) => {
    setValues((prev) => ({ ...prev, ...fields }))
  }

  return { values, errors, isValid, handleChange, handleBlur, touchAll, reset, setFields }
}
