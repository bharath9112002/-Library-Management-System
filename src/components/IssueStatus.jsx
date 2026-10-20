import { daysOverdue, getStatus } from '../services/issueService'
import { daysBetween } from '../utils/format'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function IssueStatus({ issue, today }) {
  const status = getStatus(issue, today)

  if (status === 'issued') {
    const left = daysBetween(today, issue.dueDate)
    const soon = left <= 2
    return (
      <span className={`status-badge ${soon ? 'status-warning' : 'status-info'}`}>
        {left === 0 ? 'Due today' : `Due in ${plural(left, 'day')}`}
      </span>
    )
  }
  if (status === 'overdue') {
    return <span className="status-badge status-danger">Overdue · {plural(daysOverdue(issue, today), 'day')}</span>
  }
  if (status === 'returned-late') {
    return <span className="status-badge status-late">Returned late · {plural(daysOverdue(issue), 'day')}</span>
  }
  return <span className="status-badge status-success">Returned</span>
}
