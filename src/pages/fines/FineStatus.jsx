import { getFineStatus } from '../../services/fineService'
import { formatDate } from '../../utils/format'

export default function FineStatus({ fine }) {
  const status = getFineStatus(fine)
  if (status === 'paid') {
    return (
      <span className="status-badge status-success" title={`Paid by ${fine.payment.method} on ${formatDate(fine.payment.paidOn)}`}>
        Paid · {fine.payment.method}
      </span>
    )
  }
  if (status === 'accruing') return <span className="status-badge status-warning">Accruing</span>
  return <span className="status-badge status-danger">Unpaid</span>
}
