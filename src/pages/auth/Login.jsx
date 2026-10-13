import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import TextInput from '../../components/TextInput'
import PasswordInput from '../../components/PasswordInput'
import useAuth from '../../context/useAuth'
import useForm from '../../utils/useForm'
import { validateEmail } from '../../utils/validation'

const validate = (values) => ({
  email: validateEmail(values.email),
  password: values.password ? '' : 'Password is required.',
})

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const { values, errors, isValid, handleChange, handleBlur, touchAll, setFields } = useForm(
    { email: '', password: '' },
    validate,
  )

  const flashMessage = location.state?.message
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    touchAll()
    if (!isValid) return

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 400)) // simulate network
    try {
      login(values.email, values.password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setSubmitError(err.message)
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your library account">
      {flashMessage && !submitError && <div className="alert alert-success">{flashMessage}</div>}
      {submitError && <div className="alert alert-error" role="alert">{submitError}</div>}

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
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
        />

        <div className="form-row-end">
          <Link to="/forgot-password" className="link">Forgot password?</Link>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-footer">
        Don&apos;t have an account? <Link to="/register" className="link">Create one</Link>
      </p>
      <button
        type="button"
        className="demo-hint"
        onClick={() => {
          setSubmitError('')
          setFields({ email: 'admin@lms.com', password: 'Admin@123' })
        }}
        title="Click to fill the demo credentials"
      >
        <strong>Demo login:</strong> admin@lms.com / Admin@123
        <span className="demo-hint-action">Click to autofill</span>
      </button>
    </AuthLayout>
  )
}
