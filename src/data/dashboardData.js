// Dummy dashboard data. Later modules (Books, Members, Issue/Return, Fines)
// can replace these numbers with values computed from real data.

export const dashboardStats = {
  totalBooks: 1248,
  totalMembers: 342,
  booksIssued: 186,
  booksAvailable: 1062,
  overdueBooks: 23,
  totalCategories: 18,
  fineCollected: 4850,
}

// Change compared with last month, shown under each stat card.
export const statTrends = {
  totalBooks: { value: '+48', direction: 'up', note: 'this month' },
  totalMembers: { value: '+21', direction: 'up', note: 'new members' },
  booksIssued: { value: '+12%', direction: 'up', note: 'vs last month' },
  booksAvailable: { value: '85%', direction: 'neutral', note: 'of collection' },
  overdueBooks: { value: '-4', direction: 'down', note: 'vs last week', good: true },
  totalCategories: { value: '+2', direction: 'up', note: 'added recently' },
  fineCollected: { value: '+₹620', direction: 'up', note: 'this month' },
}

const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000).toISOString()

export const recentActivities = [
  { id: 1, type: 'issue', title: 'Book issued', detail: '"Atomic Habits" to Priya Sharma', time: minutesAgo(8) },
  { id: 2, type: 'return', title: 'Book returned', detail: '"The Alchemist" by Rahul Verma', time: minutesAgo(34) },
  { id: 3, type: 'member', title: 'New member joined', detail: 'Ananya Iyer · LIB-0342', time: minutesAgo(75) },
  { id: 4, type: 'fine', title: 'Fine paid', detail: '₹120 by Karthik Raj', time: minutesAgo(140) },
  { id: 5, type: 'book', title: 'New book added', detail: '"Clean Code" · 5 copies', time: minutesAgo(260) },
  { id: 6, type: 'overdue', title: 'Book overdue', detail: '"Sapiens" with Vikram Singh · 6 days', time: minutesAgo(420) },
  { id: 7, type: 'issue', title: 'Book issued', detail: '"Wings of Fire" to Meera Nair', time: minutesAgo(1500) },
]

// Dummy chart data for the dashboard. Month labels are generated so the
// last point is always the current month.
const ISSUED_PER_MONTH = [142, 158, 171, 149, 163, 188, 205, 196, 174, 181, 199, 186]
const RETURNED_PER_MONTH = [131, 150, 160, 152, 155, 176, 192, 201, 170, 175, 188, 172]

export const monthlyCirculation = ISSUED_PER_MONTH.map((issued, i) => {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth() - (ISSUED_PER_MONTH.length - 1 - i), 1)
  return {
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
    fullMonth: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    issued,
    returned: RETURNED_PER_MONTH[i],
  }
})

export const categoryDistribution = [
  { category: 'Fiction', books: 312 },
  { category: 'Science & Technology', books: 186 },
  { category: 'History', books: 154 },
  { category: 'Children', books: 141 },
  { category: 'Biography', books: 118 },
  { category: 'Self-Help', books: 97 },
  { category: 'Poetry', books: 64 },
  { category: 'Other', books: 176 },
]
