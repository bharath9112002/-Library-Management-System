import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import Icon from './Icon'
import GlobalSearch from './GlobalSearch'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/books', label: 'Books', icon: 'book' },
  { to: '/members', label: 'Members', icon: 'users' },
  { to: '/issues', label: 'Issue / Return', icon: 'issue' },
  { to: '/fines', label: 'Fines', icon: 'wallet' },
  { to: '/categories', label: 'Categories', icon: 'tag' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo">📚</span>
          <span className="brand-name">LibraryMS</span>
          <button type="button" className="icon-btn sidebar-close" onClick={closeSidebar} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="nav-link nav-logout" onClick={handleLogout}>
          <Icon name="logout" />
          <span>Logout</span>
        </button>
      </aside>

      <div className="sidebar-backdrop" onClick={closeSidebar} aria-hidden="true" />

      <div className="main-area">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <GlobalSearch />
          <div className="topbar-spacer" />
          <div className="topbar-user">
            <div className="avatar" aria-hidden="true">{initials}</div>
            <div className="user-meta">
              <span className="user-name">{user.fullName}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
