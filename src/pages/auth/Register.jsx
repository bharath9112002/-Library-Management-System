import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import TextInput from '../../components/TextInput'
import PasswordInput from '../../components/PasswordInput'
import useAuth from '../../context/useAuth'
import useForm from '../../utils/useForm'
import {
  PASSWORD_RULES,
  passwordStrength,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../../utils/validation'

const validate = (values) => ({
  fullName: validateFullName(values.fullName),
  email: validateEmail(values.email),
  password: validatePassword(values.password),
  confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
  acceptTerms: values.acceptTerms ? '' : 'You must accept the terms to continue.',
})

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const { values, errors, isValid, handleChange, handleBlur, touchAll } = useForm(
    { fullName: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
    validate,
  )

  const strength = passwordStrength(values.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    touchAll()
    if (!isValid) return

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 400)) // simulate network
    try {
      register(values)
      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully. Please sign in.' },
      })
    } catch (err) {
      setSubmitError(err.message)
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Register to start managing your library">
      {submitError && <div className="alert alert-error" role="alert">{submitError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          id="fullName"
          name="fullName"
          label="Full name"
          placeholder="John Doe"
          autoComplete="name"
          value={values.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.fullName}
        />
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
          placeholder="Create a password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
        />

        {values.password && (
          <div className="password-strength">
            <div className="strength-bar">
              <span
                className={`strength-fill strength-${strength.label.toLowerCase()}`}
                style={{ width: `${(strength.score / PASSWORD_RULES.length) * 100}%` }}
              />
            </div>
            <span className="strength-label">{strength.label}</span>
            <ul className="password-rules">
              {PASSWORD_RULES.map((rule) => (
                <li key={rule.label} className={rule.test(values.password) ? 'ok' : ''}>
                  {rule.test(values.password) ? '✓' : '•'} {rule.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.confirmPassword}
        />

        <div className="form-group">
          <label className="checkbox">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={values.acceptTerms}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <span>I agree to the library&apos;s terms and conditions</span>
          </label>
          {errors.acceptTerms && <p className="field-error">{errors.acceptTerms}</p>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/login" className="link">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
