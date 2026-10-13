import useAuth from '../context/useAuth'

// Placeholder protected page. The full dashboard is built in Module 2.
export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="page">
      <h1>Welcome, {user.fullName.split(' ')[0]} 👋</h1>
      <p className="muted">You are signed in. The dashboard will be added in the next module.</p>

      <div className="card profile-card">
        <h2>Your account</h2>
        <dl>
          <dt>Name</dt>
          <dd>{user.fullName}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Role</dt>
          <dd>{user.role}</dd>
          <dt>Last login</dt>
          <dd>{new Date(user.loggedInAt).toLocaleString()}</dd>
        </dl>
      </div>
    </div>
  )
}
