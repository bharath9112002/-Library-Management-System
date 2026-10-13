import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import ConfirmDialog from '../../components/ConfirmDialog'
import useToast from '../../context/useToast'
import { deleteMember, getMemberById } from '../../services/memberService'
import { durationSince, formatDate, formatMobile } from '../../utils/format'

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [member, setMember] = useState(null)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMemberById(id)
      .then((data) => !cancelled && setMember(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteMember(member.id)
      toast.success(`${member.fullName} was removed.`)
      navigate('/members', { replace: true })
    } catch (err) {
      toast.error(`Could not delete: ${err.message}`)
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">👤</div>
        <h2>{error}</h2>
        <p className="muted">The member may have been deleted or the link is incorrect.</p>
        <Link to="/members" className="btn btn-primary">Back to members</Link>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="card state-card" aria-busy="true">
        <div className="spinner" />
      </div>
    )
  }

  const details = [
    { label: 'Full name', value: member.fullName, icon: '👤' },
    { label: 'Email', value: <a href={`mailto:${member.email}`} className="link">{member.email}</a>, icon: '✉️' },
    { label: 'Mobile number', value: <a href={`tel:+91${member.mobile}`} className="link">{formatMobile(member.mobile)}</a>, icon: '📱' },
    { label: 'Address', value: member.address, icon: '📍' },
    { label: 'Membership ID', value: member.membershipId, icon: '🪪' },
    { label: 'Membership date', value: formatDate(member.membershipDate), icon: '📅' },
  ]

  return (
    <div className="members-page">
      <Link to="/members" className="back-link">‹ Back to members</Link>

      <section className="profile-hero">
        <Avatar name={member.fullName} size={96} />
        <div className="profile-hero-text">
          <span className="id-badge id-badge-light">{member.membershipId}</span>
          <h1>{member.fullName}</h1>
          <p>
            Member since {formatDate(member.membershipDate)} · {durationSince(member.membershipDate)}
          </p>
        </div>
        <div className="profile-hero-actions">
          <Link to={`/members/${member.id}/edit`} className="btn btn-light">✎ Edit</Link>
          <button type="button" className="btn btn-ghost-light" onClick={() => setConfirmOpen(true)}>
            🗑 Delete
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="form-section-title">Member information</h2>
        <dl className="profile-details">
          {details.map((d) => (
            <div key={d.label} className="profile-detail">
              <span className="profile-detail-icon" aria-hidden="true">{d.icon}</span>
              <div>
                <dt>{d.label}</dt>
                <dd>{d.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this member?"
        message={`${member.fullName} (${member.membershipId}) will be permanently removed.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
