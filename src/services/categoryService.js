// Category management backed by localStorage.
//
// Books store their category by name. Renaming a category renames it on every
// book, and deleting one moves its books to another category first.
// Any category a book uses that isn't in the list yet (first run, or after
// "Reload from API") is added automatically.

import { getBooks, reassignCategory } from './bookService'

const STORAGE_KEY = 'lms_categories'

export const NAME_MAX = 40
export const DESCRIPTION_MAX = 200
export const CATEGORY_ACCENTS = ['indigo', 'sky', 'violet', 'emerald', 'rose', 'amber', 'teal']

const DEFAULT_DESCRIPTIONS = {
  Fantasy: 'Magic, myth and imagined worlds.',
  'Science Fiction': 'Space, future technology and speculative ideas.',
  Mystery: 'Detectives, puzzles and whodunits.',
  Thriller: 'High-stakes suspense and page-turners.',
  Romance: 'Love stories of every kind.',
  Horror: 'Ghosts, monsters and things that go bump in the night.',
  Classics: 'Timeless works of literature.',
  History: 'Events, eras and people that shaped the world.',
  Biography: 'Real lives, memoirs and autobiographies.',
  'Self-Help': 'Personal growth, habits and productivity.',
  Poetry: 'Verse and poetic collections.',
  Children: 'Picture books and stories for young readers.',
}

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

function readCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCategories(categories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
}

// Adds categories that books use but the list doesn't have yet.
function syncWithBooks(stored, books) {
  const categories = [...(stored ?? [])]
  const names = [...new Set(books.map((b) => b.category).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  let nextId = Math.max(0, ...categories.map((c) => c.id)) + 1
  let changed = !stored
  names.forEach((name) => {
    if (categories.some((c) => c.name === name)) return
    categories.push({ id: nextId++, name, description: DEFAULT_DESCRIPTIONS[name] ?? '', createdAt: new Date().toISOString() })
    changed = true
  })
  if (changed) writeCategories(categories)
  return categories
}

function withCounts(categories, books) {
  return categories
    .map((c) => {
      const inCategory = books.filter((b) => b.category === c.name)
      return {
        ...c,
        accent: CATEGORY_ACCENTS[c.id % CATEGORY_ACCENTS.length],
        bookCount: inCategory.length,
        totalCopies: inCategory.reduce((sum, b) => sum + b.totalCopies, 0),
        availableCopies: inCategory.reduce((sum, b) => sum + b.availableCopies, 0),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ---------- public API ----------

export async function getCategories() {
  const books = await getBooks()
  return withCounts(syncWithBooks(readCategories(), books), books)
}

export function validateCategory({ name, description }, categories, excludeId) {
  const errors = {}
  const trimmed = name.trim()
  if (!trimmed) errors.name = 'Category name is required.'
  else if (trimmed.length < 2) errors.name = 'Name must be at least 2 characters.'
  else if (trimmed.length > NAME_MAX) errors.name = `Name must be ${NAME_MAX} characters or less.`
  else if (categories.some((c) => c.id !== excludeId && sameName(c.name, trimmed)))
    errors.name = 'A category with this name already exists.'
  if (description.trim().length > DESCRIPTION_MAX)
    errors.description = `Description must be ${DESCRIPTION_MAX} characters or less.`
  return errors
}

function assertValid(data, categories, excludeId) {
  const firstError = Object.values(validateCategory(data, categories, excludeId))[0]
  if (firstError) throw new Error(firstError)
}

export async function createCategory(data) {
  const categories = syncWithBooks(readCategories(), await getBooks())
  assertValid(data, categories)
  const category = {
    id: Math.max(0, ...categories.map((c) => c.id)) + 1,
    name: data.name.trim(),
    description: data.description.trim(),
    createdAt: new Date().toISOString(),
  }
  writeCategories([...categories, category])
  return category
}

// Returns the number of books whose category was renamed.
export async function updateCategory(id, data) {
  const categories = syncWithBooks(readCategories(), await getBooks())
  const existing = categories.find((c) => c.id === id)
  if (!existing) throw new Error('Category not found.')
  assertValid(data, categories, id)

  const updated = { ...existing, name: data.name.trim(), description: data.description.trim() }
  const renamed = updated.name !== existing.name ? await reassignCategory(existing.name, updated.name) : 0
  writeCategories(categories.map((c) => (c.id === id ? updated : c)))
  return renamed
}

// A category that still has books needs `moveToId`: its books go there first.
export async function deleteCategory(id, moveToId) {
  const books = await getBooks()
  const categories = syncWithBooks(readCategories(), books)
  const category = categories.find((c) => c.id === id)
  if (!category) throw new Error('Category not found.')

  const bookCount = books.filter((b) => b.category === category.name).length
  if (bookCount) {
    const target = categories.find((c) => c.id === Number(moveToId))
    if (!target || target.id === id) throw new Error('Choose another category to move its books to.')
    await reassignCategory(category.name, target.name)
  }
  writeCategories(categories.filter((c) => c.id !== id))
  return bookCount
}
