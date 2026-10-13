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
