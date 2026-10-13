// Static (client-only) auth service backed by localStorage.
// NOTE: passwords are stored as-is because this is a front-end demo with no backend.

const USERS_KEY = 'lms_users'
const SESSION_KEY = 'lms_auth_user'

const DEMO_USER = {
  id: 'demo-admin',
  fullName: 'Library Admin',
  email: 'admin@lms.com',
  password: 'Admin@123',
  role: 'Admin',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getUsers() {
  const users = readJSON(USERS_KEY, null)
  if (Array.isArray(users)) return users
  // First run: seed a demo account so the app can be tried right away.
  writeJSON(USERS_KEY, [DEMO_USER])
  return [DEMO_USER]
}

// Never expose the password outside this module.
function toPublicUser({ password: _password, ...user }) {
  return user
}

export function getCurrentUser() {
  return readJSON(SESSION_KEY, null)
}

export function login(email, password) {
  const normalized = email.trim().toLowerCase()
  const user = getUsers().find((u) => u.email === normalized)
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password.')
  }
  const publicUser = { ...toPublicUser(user), loggedInAt: new Date().toISOString() }
  writeJSON(SESSION_KEY, publicUser)
  return publicUser
}

export function register({ fullName, email, password }) {
  const users = getUsers()
  const normalized = email.trim().toLowerCase()
  if (users.some((u) => u.email === normalized)) {
    throw new Error('An account with this email already exists.')
  }
  const user = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    fullName: fullName.trim(),
    email: normalized,
    password,
    role: 'Librarian',
    createdAt: new Date().toISOString(),
  }
  writeJSON(USERS_KEY, [...users, user])
  return toPublicUser(user)
}

export function emailExists(email) {
  const normalized = email.trim().toLowerCase()
  return getUsers().some((u) => u.email === normalized)
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}
