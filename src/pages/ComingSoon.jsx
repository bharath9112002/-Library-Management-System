import { Link } from 'react-router-dom'

// Temporary page for modules that are not built yet.
export default function ComingSoon({ title }) {
  return (
    <div className="coming-soon card">
      <div className="coming-soon-icon" aria-hidden="true">🚧</div>
      <h1>{title}</h1>
      <p className="muted">This module is coming soon.</p>
      <Link to="/dashboard" className="btn btn-primary">Back to dashboard</Link>
    </div>
  )
}
