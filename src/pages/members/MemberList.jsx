import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon'
import Avatar from '../../components/Avatar'
import Pagination from '../../components/Pagination'
import ConfirmDialog from '../../components/ConfirmDialog'
import useToast from '../../context/useToast'
import { deleteMember, getMembers } from '../../services/memberService'
import { formatDate, formatMobile } from '../../utils/format'

const SORTS = {
  newest: { label: 'Newest members', fn: (a, b) => b.membershipDate.localeCompare(a.membershipDate) },
  oldest: { label: 'Oldest members', fn: (a, b) => a.membershipDate.localeCompare(b.membershipDate) },
  'name-asc': { label: 'Name (A–Z)', fn: (a, b) => a.fullName.localeCompare(b.fullName) },
  'name-desc': { label: 'Name (Z–A)', fn: (a, b) => b.fullName.localeCompare(a.fullName) },
}
const PAGE_SIZES = [10, 20, 50]
const DEFAULTS = { q: '', sort: 'newest', page: '1', size: '10' }

export default function MemberList() {
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [members, setMembers] = useState(null)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const params = Object.fromEntries(
    Object.entries(DEFAULTS).map(([key, def]) => [key, searchParams.get(key) ?? def]),
  )

  const updateParams = (changes, { resetPage = true } = {}) => {
    const next = { ...params, ...changes }
    if (resetPage) next.page = '1'
    const cleaned = Object.fromEntries(Object.entries(next).filter(([k, v]) => v !== DEFAULTS[k]))
    setSearchParams(cleaned, { replace: true })
  }

  useEffect(() => {
    let cancelled = false
    getMembers()
      .then((data) => !cancelled && setMembers(data))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!members) return []
    const q = params.q.trim().toLowerCase()
    const qDigits = q.replace(/[\s+-]/g, '')
    return members
      .filter(
        (m) =>
          !q ||
          m.fullName.toLowerCase().includes(q) ||
          m.email.includes(q) ||
          m.membershipId.toLowerCase().includes(q) ||
          (/^\d+$/.test(qDigits) && m.mobile.includes(qDigits)),
      )
      .sort((SORTS[params.sort] ?? SORTS.newest).fn)
  }, [members, params.q, params.sort])

  const pageSize = Number(params.size) || 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages)
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteMember(toDelete.id)
      setMembers((list) => list.filter((m) => m.id !== toDelete.id))
      toast.success(`${toDelete.fullName} was removed.`)
      setToDelete(null)
    } catch (err) {
      toast.error(`Could not delete: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <div className="card state-card">
        <div className="state-icon" aria-hidden="true">⚠️</div>
        <h2>Couldn&apos;t load members</h2>
        <p className="muted">{error}</p>
      </div>
    )
  }

  return (
    <div className="members-page">
      <div className="page-header">
        <div>
          <h1>Members</h1>
          <p className="muted">{members ? `${members.length} registered members` : 'Loading members…'}</p>
        </div>
        <Link to="/members/new" className="btn btn-primary">
          <Icon name="userPlus" size={18} /> Add Member
        </Link>
      </div>

      <div className="card toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search by name, email, mobile or membership ID…"
            value={params.q}
            onChange={(e) => updateParams({ q: e.target.value })}
            aria-label="Search members"
          />
        </div>
        <select value={params.sort} onChange={(e) => updateParams({ sort: e.target.value })} aria-label="Sort members">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
      </div>

      {!members && (
        <div className="card state-card" aria-busy="true">
          <div className="spinner" />
        </div>
      )}

      {members && filtered.length === 0 && (
        <div className="card state-card">
          <div className="state-icon" aria-hidden="true">🔍</div>
          <h2>{members.length ? 'No members found' : 'No members yet'}</h2>
          <p className="muted">
            {members.length ? 'Try a different search term.' : 'Add your first library member to get started.'}
          </p>
          {params.q ? (
            <button type="button" className="btn btn-outline" onClick={() => updateParams({ q: '' })}>
              Clear search
            </button>
          ) : (
            <Link to="/members/new" className="btn btn-primary">Add Member</Link>
          )}
        </div>
      )}

      {members && filtered.length > 0 && (
        <>
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Membership ID</th>
                  <th>Mobile</th>
                  <th>Member since</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <tr key={m.id} onClick={() => navigate(`/members/${m.id}`)}>
                    <td data-label="Member">
                      <div className="member-cell">
                        <Avatar name={m.fullName} />
                        <div>
                          <Link to={`/members/${m.id}`} className="member-name" onClick={(e) => e.stopPropagation()}>
                            {m.fullName}
                          </Link>
                          <span className="muted member-email">{m.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Membership ID">
                      <span className="id-badge">{m.membershipId}</span>
                    </td>
                    <td data-label="Mobile">{formatMobile(m.mobile)}</td>
                    <td data-label="Member since">{formatDate(m.membershipDate)}</td>
                    <td className="actions-col" onClick={(e) => e.stopPropagation()}>
                      <div className="row-actions">
                        <Link to={`/members/${m.id}`} className="btn-icon" title="View profile" aria-label={`View ${m.fullName}`}>
                          👁
                        </Link>
                        <Link to={`/members/${m.id}/edit`} className="btn-icon" title="Edit" aria-label={`Edit ${m.fullName}`}>
                          ✎
                        </Link>
                        <button type="button" className="btn-icon danger" title="Delete" aria-label={`Delete ${m.fullName}`} onClick={() => setToDelete(m)}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="list-footer">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={(p) => updateParams({ page: String(p) }, { resetPage: false })}
            />
            <label className="page-size">
              Per page
              <select value={params.size} onChange={(e) => updateParams({ size: e.target.value })}>
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this member?"
        message={toDelete ? `${toDelete.fullName} (${toDelete.membershipId}) will be permanently removed.` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
