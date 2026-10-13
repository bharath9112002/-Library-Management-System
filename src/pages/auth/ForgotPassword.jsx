import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import TextInput from '../../components/TextInput'
import useForm from '../../utils/useForm'
import { validateEmail } from '../../utils/validation'

const validate = (values) => ({ email: validateEmail(values.email) })

// UI only: no email is actually sent.
export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState('')
  const [loading, setLoading] = useState(false)
  const { values, errors, isValid, handleChange, handleBlur, touchAll, reset } = useForm(
    { email: '' },
    validate,
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    touchAll()
    if (!isValid) return

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 600)) // simulate network
    setSentTo(values.email.trim())
    setLoading(false)
  }

  if (sentTo) {
    return (
      <AuthLayout title="Check your email">
        <div className="success-state">
          <div className="success-icon" aria-hidden="true">✉️</div>
          <p>
            If an account exists for <strong>{sentTo}</strong>, you will receive a password reset
            link shortly.
          </p>
          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={() => {
              setSentTo('')
              reset()
            }}
          >
            Try a different email
          </button>
          <Link to="/login" className="btn btn-primary btn-block">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your registered email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-footer">
        Remembered it? <Link to="/login" className="link">Back to sign in</Link>
      </p>
    </AuthLayout>
  )
}
