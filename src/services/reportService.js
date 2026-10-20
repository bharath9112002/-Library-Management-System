// Library reports, computed from the stored books, members, issues and fines.

import { getBooks } from './bookService'
import { getMembers } from './memberService'
import { getIssues, getStatus } from './issueService'
import { getCategories } from './categoryService'
import { calculateFine } from './fineService'
import { addDays, parseDate, todayISO } from '../utils/format'

export const ACTIVE_MEMBER_DAYS = 90 // a member is "active" if they borrowed within this many days

const monthKey = (iso) => iso.slice(0, 7) // "2026-10"

// The last `count` months ending with the current one, oldest first.
function lastMonths(count, today) {
  const end = parseDate(today)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(end.getFullYear(), end.getMonth() - (count - 1 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
      fullLabel: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    }
  })
}

export function monthlyIssueReport(issues, months, today = todayISO()) {
  const rows = lastMonths(months, today).map((m) => ({ ...m, issued: 0, returned: 0, returnedLate: 0, fines: 0 }))
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]))
  issues.forEach((issue) => {
    const issuedIn = byKey[monthKey(issue.issueDate)]
    if (issuedIn) issuedIn.issued += 1
    const returnedIn = issue.returnDate && byKey[monthKey(issue.returnDate)]
    if (returnedIn) {
      returnedIn.returned += 1
      if (issue.returnDate > issue.dueDate) {
        returnedIn.returnedLate += 1
        returnedIn.fines += calculateFine(issue, today)
      }
    }
  })
  return rows
}

export async function getReport(today = todayISO()) {
  const [books, members, issues, categories] = await Promise.all([getBooks(), getMembers(), getIssues(), getCategories()])
  const active = issues.filter((i) => !i.returnDate)
  const activeSince = addDays(today, -ACTIVE_MEMBER_DAYS)
  const activeMemberIds = new Set(issues.filter((i) => !i.returnDate || i.issueDate >= activeSince).map((i) => i.memberId))

  return {
    totals: {
      titles: books.length,
      copies: books.reduce((sum, b) => sum + b.totalCopies, 0),
      availableCopies: books.reduce((sum, b) => sum + b.availableCopies, 0),
      issuedNow: active.length,
      issuedAllTime: issues.length,
      returned: issues.length - active.length,
      returnedLate: issues.filter((i) => i.returnDate && i.returnDate > i.dueDate).length,
      // Only members that still exist count.
      activeMembers: members.filter((m) => activeMemberIds.has(m.id)).length,
      totalMembers: members.length,
      overdue: active.filter((i) => getStatus(i, today) === 'overdue').length,
    },
    categories: categories.map((c) => ({
      name: c.name,
      books: c.bookCount,
      copies: c.totalCopies,
      available: c.availableCopies,
    })),
    issues,
  }
}
