// Book service backed by the Open Library API (https://openlibrary.org/developers/api).
//
//   /search.json?subject=...  -> title, author, ISBN, publisher, year, cover id
//   /works/{id}.json          -> description (fetched lazily on the details page)
//   covers.openlibrary.org    -> real cover images
//
// Open Library doesn't track library copies, so total/available copies are
// generated deterministically from the book's position so they stay stable.
//
// Open Library is read-only, so add/edit/delete are saved to localStorage.

import { countActiveIssues } from './issueService'

const API_URL = 'https://openlibrary.org'
const COVERS_URL = 'https://covers.openlibrary.org/b/id'
const STORAGE_KEY = 'lms_books_v2'
const LEGACY_KEYS = ['lms_books'] // old DummyJSON cache
const REQUEST_TIMEOUT = 15000
const BOOKS_PER_SUBJECT = 30
const NO_DESCRIPTION = 'No description is available for this book.'

// Open Library subject -> category name shown in the app
const SUBJECTS = {
  fantasy: 'Fantasy',
  science_fiction: 'Science Fiction',
  mystery: 'Mystery',
  thriller: 'Thriller',
  romance: 'Romance',
  horror: 'Horror',
  classic_literature: 'Classics',
  history: 'History',
  biography: 'Biography',
  'self-help': 'Self-Help',
  poetry: 'Poetry',
  children: 'Children',
}

const SEARCH_FIELDS = 'key,title,author_name,isbn,publisher,first_publish_year,cover_i'

// ---------- helpers ----------

async function request(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`Server responded with ${res.status}`)
    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The request timed out. Please try again.')
    if (err instanceof TypeError) throw new Error('Network error. Check your internet connection.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

function readCache() {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(books) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
}

// Simple deterministic pseudo-random number from a seed (0..1).
function seeded(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Skip titles in non-Latin scripts so the catalogue reads consistently.
const isLatin = (text) => /^[\u0020-\u024F\u2000-\u206F]+$/.test(text)

// Open Library lists every edition's publisher; prefer a well-known English one.
const ENGLISH_PUBLISHERS =
  /penguin|random house|harper|macmillan|\btor\b|gollancz|scholastic|simon|bloomsbury|hachette|orion|vintage|bantam|doubleday|knopf|little, brown|del rey|ballantine|puffin|faber|picador|crown|anchor|berkley|signet|dover|oxford|cambridge|disney|hyperion|st\. martin|viking|putnam|dutton|atria|scribner|houghton|norton|grand central|\bace\b|\bdaw\b|baen|orbit/i
const pickPublisher = (publishers = []) =>
  publishers.find((p) => ENGLISH_PUBLISHERS.test(p)) || publishers.find(isLatin) || 'Unknown Publisher'

// Prefer English-language editions (978-0 / 978-1), then any ISBN-13, then ISBN-10.
const pickIsbn = (isbns) =>
  isbns.find((i) => /^97[89][01]\d{9}$/.test(i)) ||
  isbns.find((i) => /^97[89]\d{10}$/.test(i)) ||
  isbns.find((i) => /^\d{9}[\dX]$/.test(i))

export const coverFromId = (coverId, size = 'M') => `${COVERS_URL}/${coverId}-${size}.jpg`

// Use the large image on the details page when the cover comes from Open Library.
export const largeCover = (url) => (url?.startsWith(COVERS_URL) ? url.replace(/-M\.jpg$/, '-L.jpg') : url)

function mapDocToBook(doc, category, id) {
  const totalCopies = 1 + Math.floor(seeded(id + 1) * 10)
  const issued = Math.floor(seeded(id + 2) * (totalCopies + 1))
  return {
    id,
    workKey: doc.key, // e.g. "/works/OL82563W" - used to fetch the description
    title: doc.title,
    author: doc.author_name.slice(0, 2).join(', '),
    isbn: pickIsbn(doc.isbn),
    publisher: pickPublisher(doc.publisher),
    category,
    publishedYear: doc.first_publish_year || '',
    totalCopies,
    availableCopies: totalCopies - issued,
    coverImage: coverFromId(doc.cover_i),
    description: null, // loaded on demand
    source: 'api',
  }
}

async function fetchDescription(workKey) {
  const work = await request(`${API_URL}${workKey}.json`)
  const raw = typeof work.description === 'string' ? work.description : work.description?.value
  // Strip Open Library's markdown-style source links and trailing separators.
  const text = raw
    ?.split(/\n-{3,}|\n\s*\(\[source\]|\[source\]/i)[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
  return text || NO_DESCRIPTION
}

// ---------- public API ----------

export async function fetchBooksFromApi() {
  const entries = Object.entries(SUBJECTS)
  const results = await Promise.allSettled(
    entries.map(([subject]) =>
      request(`${API_URL}/search.json?subject=${encodeURIComponent(subject)}&fields=${SEARCH_FIELDS}&limit=${BOOKS_PER_SUBJECT}&sort=rating`),
    ),
  )
  if (results.every((r) => r.status === 'rejected')) throw results[0].reason

  const seen = new Set()
  const books = []
  results.forEach((result, i) => {
    if (result.status !== 'fulfilled') return
    const category = entries[i][1]
    result.value.docs.forEach((doc) => {
      // Only keep complete records, and each work once (it can match several subjects).
      if (seen.has(doc.key) || !doc.cover_i || !doc.author_name?.length || !doc.isbn?.length) return
      if (!isLatin(doc.title) || !pickIsbn(doc.isbn)) return
      seen.add(doc.key)
      books.push(mapDocToBook(doc, category, books.length + 1))
    })
  })
  writeCache(books)
  return books
}

export async function getBooks() {
  return readCache() ?? fetchBooksFromApi()
}

// Returns the book with its description (fetched from Open Library the first time).
export async function getBookById(id) {
  const books = await getBooks()
  const book = books.find((b) => b.id === Number(id))
  if (!book) throw new Error('Book not found.')
  if (book.description !== null && book.description !== undefined) return book

  let description = NO_DESCRIPTION
  try {
    description = book.workKey ? await fetchDescription(book.workKey) : NO_DESCRIPTION
  } catch {
    return { ...book, description: NO_DESCRIPTION } // don't cache, try again next time
  }
  const enriched = { ...book, description }
  writeCache(books.map((b) => (b.id === book.id ? enriched : b)))
  return enriched
}

export function isIsbnTaken(isbn, excludeId) {
  const normalize = (v) => String(v).replace(/[-\s]/g, '')
  return (readCache() ?? []).some(
    (b) => normalize(b.isbn) === normalize(isbn) && b.id !== Number(excludeId),
  )
}

export async function createBook(data) {
  const books = await getBooks()
  const id = Math.max(0, ...books.map((b) => b.id)) + 1
  const book = { ...data, id, workKey: null, source: 'local' }
  writeCache([book, ...books])
  return book
}

export async function updateBook(id, data) {
  const books = await getBooks()
  const existing = books.find((b) => b.id === Number(id))
  if (!existing) throw new Error('Book not found.')
  const updated = { ...existing, ...data, id: existing.id }
  writeCache(books.map((b) => (b.id === existing.id ? updated : b)))
  return updated
}

export async function deleteBook(id) {
  const books = await getBooks()
  if (!books.some((b) => b.id === Number(id))) throw new Error('Book not found.')
  const active = countActiveIssues({ bookId: id })
  if (active) throw new Error(`${active} cop${active > 1 ? 'ies are' : 'y is'} still issued. Return ${active > 1 ? 'them' : 'it'} before deleting.`)
  writeCache(books.filter((b) => b.id !== Number(id)))
}

// Called by the issue/return module: -1 when issued, +1 when returned.
export async function adjustAvailability(id, delta) {
  const books = await getBooks()
  const book = books.find((b) => b.id === Number(id))
  if (!book) throw new Error('Book not found.')
  const availableCopies = Math.min(book.totalCopies, Math.max(0, book.availableCopies + delta))
  if (delta < 0 && book.availableCopies < 1) throw new Error('No copies of this book are available.')
  const updated = { ...book, availableCopies }
  writeCache(books.map((b) => (b.id === book.id ? updated : b)))
  return updated
}

// Called by category management: renames a category on every book that uses it
// (also used to move books out of a deleted category). Returns how many changed.
export async function reassignCategory(from, to) {
  const books = await getBooks()
  let changed = 0
  const updated = books.map((b) => {
    if (b.category !== from) return b
    changed += 1
    return { ...b, category: to }
  })
  writeCache(updated)
  return changed
}

// Throws away local changes and reloads the catalogue from Open Library.
export async function resetBooks() {
  localStorage.removeItem(STORAGE_KEY)
  return fetchBooksFromApi()
}
