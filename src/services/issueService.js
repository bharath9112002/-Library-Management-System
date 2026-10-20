// Issue / return records backed by localStorage.
//
// Each record keeps a snapshot of the member and book details, so the history
// still reads correctly if the member or book is later edited or deleted.
// Issuing/returning also updates the book's available copies.

import { adjustAvailability, getBooks } from './bookService'
import { getMembers } from './memberService'
import { addDays, daysBetween, todayISO } from '../utils/format'

const STORAGE_KEY = 'lms_issues'

export const LOAN_DAYS = 14 // default loan period
export const MAX_LOAN_DAYS = 60
export const MAX_ACTIVE_PER_MEMBER = 5

const formatIssueId = (n) => `ISS-${String(n).padStart(4, '0')}`

function readIssues() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeIssues(issues) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues))
}

function snapshot(member, book) {
  return {
    memberId: member.id,
    memberName: member.fullName,
    membershipId: member.membershipId,
    bookId: book.id,
    bookTitle: book.title,
    bookAuthor: book.author,
    bookIsbn: book.isbn,
    bookCover: book.coverImage,
  }
}

// Sample history so the module (and fines later) has data to show on first run.
// Active samples only use books that already have issued copies, so the
// generated availability numbers stay consistent.
function buildSeed(books, members) {
  const today = todayISO()
  const issuedBooks = books.filter((b) => b.totalCopies - b.availableCopies >= 1)
  if (!issuedBooks.length || !members.length) return []

  // [daysAgoIssued, loanDays, returnedAfterDays | null]
  const plan = [
    [3, 14, null], [6, 14, null], [9, 14, null], [12, 14, null], [2, 7, null],
    [18, 14, null], [24, 14, null], [30, 14, null], [16, 7, null],
    [45, 14, 10], [52, 14, 14], [60, 14, 20], [75, 14, 9], [90, 21, 25], [35, 14, 13], [28, 14, 15],
  ]
  return plan.map(([ago, loan, returnedAfter], i) => {
    const member = members[(i * 5) % members.length]
    const book = returnedAfter === null ? issuedBooks[i % issuedBooks.length] : books[(i * 11) % books.length]
    const issueDate = addDays(today, -ago)
    return {
      id: formatIssueId(i + 1),
      ...snapshot(member, book),
      issueDate,
      dueDate: addDays(issueDate, loan),
      returnDate: returnedAfter === null ? null : addDays(issueDate, returnedAfter),
      createdAt: new Date().toISOString(),
    }
  })
}

// ---------- status helpers ----------

export function getStatus(issue, today = todayISO()) {
  if (issue.returnDate) return issue.returnDate > issue.dueDate ? 'returned-late' : 'returned'
  return issue.dueDate < today ? 'overdue' : 'issued'
}

export function isActive(issue) {
  return !issue.returnDate
}

// Days late (0 if on time). Uses the return date, or today for books still out.
export function daysOverdue(issue, today = todayISO()) {
  return Math.max(0, daysBetween(issue.dueDate, issue.returnDate || today))
}

// ---------- public API ----------

export async function getIssues() {
  const stored = readIssues()
  if (stored) return stored
  const [books, members] = await Promise.all([getBooks(), getMembers()])
  const seed = buildSeed(books, members)
  writeIssues(seed)
  return seed
}

export function countActiveIssues({ memberId, bookId }) {
  return (readIssues() ?? []).filter(
    (i) =>
      isActive(i) &&
      (memberId === undefined || i.memberId === Number(memberId)) &&
      (bookId === undefined || i.bookId === Number(bookId)),
  ).length
}

export function validateIssue({ member, book, issueDate, dueDate }, issues) {
  const today = todayISO()
  const errors = {}
  if (!member) errors.member = 'Select a member.'
  if (!book) errors.book = 'Select a book.'
  else if (book.availableCopies < 1) errors.book = 'No copies of this book are available.'

  if (member && book && issues.some((i) => isActive(i) && i.memberId === member.id && i.bookId === book.id)) {
    errors.book = `${member.fullName} already has this book issued. Return it before issuing again.`
  }
  if (member && !errors.member) {
    const active = issues.filter((i) => isActive(i) && i.memberId === member.id).length
    if (active >= MAX_ACTIVE_PER_MEMBER) {
      errors.member = `${member.fullName} already has ${active} books issued (limit ${MAX_ACTIVE_PER_MEMBER}).`
    }
  }

  if (!issueDate) errors.issueDate = 'Issue date is required.'
  else if (issueDate > today) errors.issueDate = 'Issue date cannot be in the future.'
  else if (member && issueDate < member.membershipDate) errors.issueDate = 'Issue date is before the membership date.'

  if (!dueDate) errors.dueDate = 'Due date is required.'
  else if (issueDate && dueDate <= issueDate) errors.dueDate = 'Due date must be after the issue date.'
  else if (issueDate && daysBetween(issueDate, dueDate) > MAX_LOAN_DAYS)
    errors.dueDate = `Loan period cannot be longer than ${MAX_LOAN_DAYS} days.`

  return errors
}

export async function issueBook({ member, book, issueDate, dueDate }) {
  const issues = await getIssues()
  const errors = validateIssue({ member, book, issueDate, dueDate }, issues)
  const firstError = Object.values(errors)[0]
  if (firstError) throw new Error(firstError)

  const maxNumber = Math.max(0, ...issues.map((i) => Number(i.id.replace(/\D/g, '')) || 0))
  const issue = {
    id: formatIssueId(maxNumber + 1),
    ...snapshot(member, book),
    issueDate,
    dueDate,
    returnDate: null,
    createdAt: new Date().toISOString(),
  }
  await adjustAvailability(book.id, -1)
  writeIssues([issue, ...issues])
  return issue
}

export async function returnBook(issueId, returnDate) {
  const issues = await getIssues()
  const issue = issues.find((i) => i.id === issueId)
  if (!issue) throw new Error('Issue record not found.')
  if (issue.returnDate) throw new Error('This book has already been returned.')
  if (!returnDate) throw new Error('Return date is required.')
  if (returnDate > todayISO()) throw new Error('Return date cannot be in the future.')
  if (returnDate < issue.issueDate) throw new Error('Return date cannot be before the issue date.')

  const updated = { ...issue, returnDate }
  // The book may have been deleted since; the return is still recorded.
  await adjustAvailability(issue.bookId, +1).catch(() => {})
  writeIssues(issues.map((i) => (i.id === issueId ? updated : i)))
  return updated
}
