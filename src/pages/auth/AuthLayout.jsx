export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-hero" aria-hidden="true">
        <div className="auth-hero-inner">
          <span className="auth-hero-logo">📚</span>
          <h2>LibraryMS</h2>
          <p>Manage books, members, issues and fines — all in one place.</p>
        </div>
      </aside>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-mobile-logo">📚 LibraryMS</span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}
