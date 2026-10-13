// Returns page numbers with '…' gaps, e.g. [1, '…', 4, 5, 6, '…', 20]
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…')
    result.push(p)
  })
  return result
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalItems === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="pagination">
      <span className="muted">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{totalItems}</strong>
      </span>
      <nav className="pagination-pages" aria-label="Pagination">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
          ‹
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="pagination-gap">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={p === page ? 'active' : ''}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
          ›
        </button>
      </nav>
    </div>
  )
}
