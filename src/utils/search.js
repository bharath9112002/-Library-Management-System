// Shared matching rules for the book list, the topbar search and the search page.

export const BOOK_SEARCH_FIELDS = {
  all: 'All fields',
  title: 'Title',
  author: 'Author',
  isbn: 'ISBN',
}

export const normalizeIsbn = (value) => String(value).replace(/[-\s]/g, '').toLowerCase()

// Which field of the book matches `query` ('title' | 'author' | 'isbn'), or null.
// `field` limits the search to one field; 'all' tries them in that order.
export function matchBook(book, query, field = 'all') {
  const q = query.trim().toLowerCase()
  if (!q) return null
  const isbnQuery = normalizeIsbn(q)
  const tests = {
    title: () => book.title.toLowerCase().includes(q),
    author: () => book.author.toLowerCase().includes(q),
    isbn: () => Boolean(isbnQuery) && normalizeIsbn(book.isbn).includes(isbnQuery),
  }
  const fields = field === 'all' ? Object.keys(tests) : [field]
  return fields.find((f) => tests[f]?.()) ?? null
}

// Ranks exact and prefix matches above matches in the middle of the text.
export function matchScore(text, query) {
  const t = text.toLowerCase()
  const q = query.trim().toLowerCase()
  if (t === q) return 0
  if (t.startsWith(q)) return 1
  if (t.split(/\s+/).some((word) => word.startsWith(q))) return 2
  return 3
}

export function matchMember(member, query) {
  const q = query.trim().toLowerCase()
  if (!q) return false
  return (
    member.fullName.toLowerCase().includes(q) ||
    member.membershipId.toLowerCase().includes(q) ||
    member.email.toLowerCase().includes(q) ||
    member.mobile.includes(q.replace(/[\s-]/g, ''))
  )
}

// Splits `text` around the first match of `query` so it can be wrapped in <mark>.
export function splitMatch(text, query) {
  const q = query.trim()
  const index = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (index < 0) return [text, '', '']
  return [text.slice(0, index), text.slice(index, index + q.length), text.slice(index + q.length)]
}
