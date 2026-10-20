// Fines are calculated from the issue records, never stored:
//   fine = days late × FINE_PER_DAY
// For books still out the fine keeps growing until the book is returned.
// Only the payment status (UI only — no real payment) is saved to localStorage.

import { daysOverdue, getIssues } from './issueService'
import { todayISO } from '../utils/format'

const STORAGE_KEY = 'lms_fine_payments'

export const FINE_PER_DAY = 5 // ₹ per day late
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Card']

function readPayments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writePayments(payments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payments))
}

export function calculateFine(issue, today = todayISO()) {
  return daysOverdue(issue, today) * FINE_PER_DAY
}

// 'accruing' = book still out and overdue; it can be paid once the book is returned.
export function getFineStatus(fine) {
  if (fine.payment) return 'paid'
  return fine.returnDate ? 'unpaid' : 'accruing'
}

// One fine per overdue/late issue, newest first.
function buildFines(issues, payments, today) {
  return issues
    .map((issue) => {
      const daysLate = daysOverdue(issue, today)
      return { ...issue, issueId: issue.id, daysLate, amount: daysLate * FINE_PER_DAY, payment: payments[issue.id] ?? null }
    })
    .filter((f) => f.daysLate > 0)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
}

// First run: mark the oldest late return as paid so both states have sample data.
function seedPayments(issues, today) {
  const late = buildFines(issues, {}, today).filter((f) => f.returnDate)
  const oldest = late[late.length - 1]
  const payments = oldest ? { [oldest.id]: { amount: oldest.amount, method: 'Cash', paidOn: oldest.returnDate } } : {}
  writePayments(payments)
  return payments
}

export async function getFines(today = todayISO()) {
  const issues = await getIssues()
  const payments = readPayments() ?? seedPayments(issues, today)
  return buildFines(issues, payments, today)
}

export async function payFine(issueId, { method, paidOn = todayISO() }) {
  const fine = (await getFines()).find((f) => f.id === issueId)
  if (!fine) throw new Error('Fine not found.')
  if (fine.payment) throw new Error('This fine has already been paid.')
  if (!fine.returnDate) throw new Error('The book is still out. Return it before collecting the fine.')
  if (!PAYMENT_METHODS.includes(method)) throw new Error('Select a payment method.')

  const payments = readPayments() ?? {}
  payments[issueId] = { amount: fine.amount, method, paidOn }
  writePayments(payments)
  return payments[issueId]
}

// Undo a payment recorded by mistake.
export async function markUnpaid(issueId) {
  const payments = readPayments() ?? {}
  if (!payments[issueId]) throw new Error('This fine is not marked as paid.')
  delete payments[issueId]
  writePayments(payments)
}
