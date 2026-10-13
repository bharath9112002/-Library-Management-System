import { Outlet, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return
    logout()
    navigate('/login', { replace: true, state: { message: 'You have been logged out.' } })
  }

  const initials = user.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">📚</span>
          <span className="brand-name">LibraryMS</span>
        </div>
        <div className="topbar-user">
          <div className="avatar" aria-hidden="true">{initials}</div>
          <div className="user-meta">
            <span className="user-name">{user.fullName}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button type="button" className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
