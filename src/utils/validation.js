const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]*$/

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required.'
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address.'
  return ''
}

export function validateFullName(name) {
  const value = name.trim()
  if (!value) return 'Full name is required.'
  if (value.length < 3) return 'Full name must be at least 3 characters.'
  if (value.length > 50) return 'Full name must be under 50 characters.'
  if (!NAME_REGEX.test(value)) return 'Full name can only contain letters and spaces.'
  return ''
}

export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export function validatePassword(password) {
  if (!password) return 'Password is required.'
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password))
  return failed ? `Password needs: ${failed.label.toLowerCase()}.` : ''
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Please confirm your password.'
  if (password !== confirm) return 'Passwords do not match.'
  return ''
}

export function passwordStrength(password) {
  const score = PASSWORD_RULES.filter((rule) => rule.test(password)).length
  if (!password) return { score: 0, label: '' }
  if (score <= 2) return { score, label: 'Weak' }
  if (score <= 4) return { score, label: 'Medium' }
  return { score, label: 'Strong' }
}

// ---------- Books ----------

function validateIsbn(isbn) {
  const value = isbn.trim()
  if (!value) return 'ISBN is required.'
  const digits = value.replace(/[-\s]/g, '')
  if (!/^(\d{9}[\dXx]|\d{13})$/.test(digits)) return 'ISBN must be 10 or 13 digits (hyphens allowed).'
  return ''
}

const requiredText = (value, label, { min = 2, max = 120 } = {}) => {
  const v = value.trim()
  if (!v) return `${label} is required.`
  if (v.length < min) return `${label} must be at least ${min} characters.`
  if (v.length > max) return `${label} must be under ${max} characters.`
  return ''
}

const isWholeNumber = (value) => /^\d+$/.test(String(value).trim())

export function validateBook(values) {
  const currentYear = new Date().getFullYear()
  const year = Number(values.publishedYear)
  const total = Number(values.totalCopies)
  const available = Number(values.availableCopies)

  let yearError = ''
  if (!String(values.publishedYear).trim()) yearError = 'Published year is required.'
  else if (!isWholeNumber(values.publishedYear) || year < 1000 || year > currentYear)
    yearError = `Enter a year between 1000 and ${currentYear}.`

  let totalError = ''
  if (!isWholeNumber(values.totalCopies) || total < 1) totalError = 'Total copies must be at least 1.'
  else if (total > 1000) totalError = 'Total copies must be 1000 or less.'

  let availableError = ''
  if (!isWholeNumber(values.availableCopies)) availableError = 'Enter 0 or more copies.'
  else if (!totalError && available > total) availableError = 'Cannot exceed total copies.'

  let coverError = ''
  if (values.coverImage.trim()) {
    try {
      const url = new URL(values.coverImage.trim())
      if (!['http:', 'https:'].includes(url.protocol)) coverError = 'Use an http(s) image URL.'
    } catch {
      coverError = 'Enter a valid image URL.'
    }
  }

  return {
    title: requiredText(values.title, 'Title', { max: 150 }),
    author: requiredText(values.author, 'Author name', { max: 80 }),
    isbn: validateIsbn(values.isbn),
    publisher: requiredText(values.publisher, 'Publisher', { max: 100 }),
    category: requiredText(values.category, 'Category', { max: 40 }),
    publishedYear: yearError,
    totalCopies: totalError,
    availableCopies: availableError,
    coverImage: coverError,
    description: requiredText(values.description, 'Description', { min: 20, max: 1000 }),
  }
}
