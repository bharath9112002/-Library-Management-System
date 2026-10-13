import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TextInput from '../../components/TextInput'
import Avatar from '../../components/Avatar'
import useForm from '../../utils/useForm'
import useToast from '../../context/useToast'
import { validateMember } from '../../utils/validation'
import { formatDate, todayISO } from '../../utils/format'
import { createMember, findConflicts, getMemberById, nextMembershipId, updateMember } from '../../services/memberService'

const FIELDS = ['fullName', 'email', 'mobile', 'address', 'membershipDate']

// Wrapper: loads the member (edit mode) so the form starts with the right values.
export default function MemberFormPage() {
  const { id } = useParams()
  const [initial, setInitial] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = id
      ? getMemberById(id).then((m) => ({
          values: Object.fromEntries(FIELDS.map((f) => [f, m[f]])),
          membershipId: m.membershipId,
        }))
      : Promise.resolve({
          values: { fullName: '', email: '', mobile: '', address: '', membershipDate: todayISO() },
          membershipId: nextMembershipId(),
        })
    load
      .then((data) => !cancelled && setInitial(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">⚠️</div>
        <h2>{error}</h2>
        <Link to="/members" className="btn btn-primary">Back to members</Link>
      </div>
    )
  }

  if (!initial) {
    return (
      <div className="card state-card" aria-busy="true">
        <div className="spinner" />
      </div>
    )
  }

  return <MemberForm key={id ?? 'new'} memberId={id} initial={initial} />
}

function MemberForm({ memberId, initial }) {
  const isEdit = Boolean(memberId)
  const navigate = useNavigate()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validate = useMemo(
    () => (values) => {
      const errors = validateMember(values)
      const conflicts = findConflicts(values, memberId)
      if (!errors.email && conflicts.email) errors.email = 'Another member already uses this email.'
      if (!errors.mobile && conflicts.mobile) errors.mobile = 'Another member already uses this mobile number.'
      return errors
    },
    [memberId],
  )

  const { values, errors, isValid, handleChange, handleBlur, touchAll } = useForm(initial.values, validate)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    touchAll()
    if (!isValid) return

    setSaving(true)
    try {
      const saved = isEdit ? await updateMember(memberId, values) : await createMember(values)
      toast.success(isEdit ? 'Member updated successfully.' : `${saved.fullName} added as ${saved.membershipId}.`)
      navigate(`/members/${saved.id}`, { replace: true })
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

  const backTo = isEdit ? `/members/${memberId}` : '/members'

  return (
    <div className="members-page">
      <Link to={backTo} className="back-link">‹ Back</Link>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Member' : 'Add New Member'}</h1>
          <p className="muted">
            {isEdit ? 'Update the member’s details below.' : 'Register a new member to the library.'}
          </p>
        </div>
      </div>

      {submitError && <div className="alert alert-error" role="alert">Could not save: {submitError}</div>}

      <form className="member-form" onSubmit={handleSubmit} noValidate>
        <aside className="card member-preview">
          <Avatar name={values.fullName.trim() || '?'} size={88} />
          <h2>{values.fullName.trim() || 'New member'}</h2>
          <p className="muted">{values.email.trim() || 'email@example.com'}</p>
          <div className="preview-meta">
            <div>
              <span>Membership ID</span>
              <strong className="id-badge">{initial.membershipId}</strong>
            </div>
            <div>
              <span>Member since</span>
              <strong>{formatDate(values.membershipDate)}</strong>
            </div>
          </div>
          {!isEdit && <p className="muted form-hint">The membership ID is generated automatically.</p>}
        </aside>

        <section className="card">
          <h2 className="form-section-title">Personal details</h2>
          <div className="form-grid">
            <div className="span-2">
              <TextInput {...field('fullName')} label="Full name *" placeholder="e.g. Priya Sharma" autoComplete="name" />
            </div>
            <TextInput {...field('email')} type="email" label="Email *" placeholder="name@example.com" autoComplete="email" />
            <TextInput
              {...field('mobile')}
              type="tel"
              label="Mobile number *"
              placeholder="98765 43210"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={16}
            />
            <div className="span-2 form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                placeholder="House no., street, city, state - PIN"
                value={values.address}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.address ? 'has-error' : ''}
                aria-invalid={Boolean(errors.address)}
              />
              {errors.address && <p className="field-error">{errors.address}</p>}
            </div>
          </div>

          <h2 className="form-section-title">Membership</h2>
          <div className="form-grid">
            <TextInput id="membershipId" label="Membership ID" value={initial.membershipId} readOnly disabled />
            <TextInput {...field('membershipDate')} type="date" label="Membership date *" max={todayISO()} />
          </div>

          <div className="form-actions">
            <Link to={backTo} className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add member'}
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}
