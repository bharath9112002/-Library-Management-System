// Member service backed by localStorage.
// The first time it runs, the store is seeded with sample members.

const STORAGE_KEY = 'lms_members'
const SEQUENCE_KEY = 'lms_member_seq' // last membership number issued, so deleted IDs are never reused

const FIRST_NAMES = [
  'Priya', 'Rahul', 'Ananya', 'Karthik', 'Meera', 'Vikram', 'Sneha', 'Arjun', 'Divya', 'Rohan',
  'Kavya', 'Aditya', 'Nisha', 'Suresh', 'Pooja', 'Manoj', 'Lakshmi', 'Imran', 'Deepa', 'Harish',
  'Fatima', 'Gokul', 'Swathi', 'Naveen', 'Revathi', 'Ajay', 'Shalini', 'Vignesh', 'Asha', 'Rajesh',
  'Bhavana', 'Sanjay', 'Keerthi', 'Joseph', 'Nandini', 'Pranav',
]
const LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Raj', 'Nair', 'Singh', 'Reddy', 'Kumar', 'Menon', 'Gupta',
  'Pillai', 'Rao', 'Patel', 'Krishnan', 'Das', 'Joshi', 'Subramanian', 'Khan', 'Mathew', 'Bose',
]
const STREETS = ['MG Road', 'Anna Salai', 'Brigade Road', 'Park Street', 'Linking Road', 'Residency Road', 'Gandhi Nagar', 'Lake View Road']
const CITIES = [
  ['Chennai', 'Tamil Nadu', '600'],
  ['Bengaluru', 'Karnataka', '560'],
  ['Hyderabad', 'Telangana', '500'],
  ['Kochi', 'Kerala', '682'],
  ['Mumbai', 'Maharashtra', '400'],
  ['Coimbatore', 'Tamil Nadu', '641'],
  ['Pune', 'Maharashtra', '411'],
]

export const formatMembershipId = (n) => `LIB-${String(n).padStart(4, '0')}`

function buildSeed() {
  const start = new Date('2024-01-08').getTime()
  const day = 24 * 60 * 60 * 1000
  return FIRST_NAMES.map((first, i) => {
    const last = LAST_NAMES[(i * 7) % LAST_NAMES.length]
    const [city, state, pin] = CITIES[i % CITIES.length]
    const date = new Date(start + i * 18 * day + (i % 5) * day)
    return {
      id: i + 1,
      fullName: `${first} ${last}`,
      email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
      mobile: `9${String(840000000 + i * 1234567).slice(0, 9)}`,
      address: `${10 + ((i * 13) % 180)}, ${STREETS[i % STREETS.length]}, ${city}, ${state} - ${pin}${String(10 + i).padStart(3, '0')}`,
      membershipId: formatMembershipId(i + 1),
      membershipDate: date.toISOString().slice(0, 10),
      createdAt: date.toISOString(),
    }
  })
}

function readMembers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through to seeding
  }
  const seed = buildSeed()
  writeMembers(seed)
  return seed
}

function writeMembers(members) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members))
}

const normalizeEmail = (email) => email.trim().toLowerCase()
export const normalizeMobile = (mobile) => mobile.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '')

// ---------- public API (async so it can be swapped for a real backend later) ----------

export async function getMembers() {
  return readMembers()
}

export async function getMemberById(id) {
  const member = readMembers().find((m) => m.id === Number(id))
  if (!member) throw new Error('Member not found.')
  return member
}

function lastMembershipNumber() {
  const members = readMembers()
  const maxInUse = Math.max(0, ...members.map((m) => Number(m.membershipId.replace(/\D/g, '')) || 0))
  return Math.max(maxInUse, Number(localStorage.getItem(SEQUENCE_KEY)) || 0)
}

export function nextMembershipId() {
  return formatMembershipId(lastMembershipNumber() + 1)
}

// Returns which unique fields (email / mobile) are already used by another member.
export function findConflicts({ email, mobile }, excludeId) {
  const others = readMembers().filter((m) => m.id !== Number(excludeId))
  return {
    email: Boolean(email) && others.some((m) => m.email === normalizeEmail(email)),
    mobile: Boolean(mobile) && others.some((m) => m.mobile === normalizeMobile(mobile)),
  }
}

function clean(data) {
  return {
    fullName: data.fullName.trim().replace(/\s+/g, ' '),
    email: normalizeEmail(data.email),
    mobile: normalizeMobile(data.mobile),
    address: data.address.trim(),
    membershipDate: data.membershipDate,
  }
}

export async function createMember(data) {
  const members = readMembers()
  const conflicts = findConflicts(data)
  if (conflicts.email) throw new Error('A member with this email already exists.')
  if (conflicts.mobile) throw new Error('A member with this mobile number already exists.')
  const number = lastMembershipNumber() + 1
  const member = {
    ...clean(data),
    id: Math.max(number, ...members.map((m) => m.id + 1)),
    membershipId: formatMembershipId(number),
    createdAt: new Date().toISOString(),
  }
  writeMembers([member, ...members])
  localStorage.setItem(SEQUENCE_KEY, String(number))
  return member
}

export async function updateMember(id, data) {
  const members = readMembers()
  const existing = members.find((m) => m.id === Number(id))
  if (!existing) throw new Error('Member not found.')
  const conflicts = findConflicts(data, id)
  if (conflicts.email) throw new Error('A member with this email already exists.')
  if (conflicts.mobile) throw new Error('A member with this mobile number already exists.')
  const updated = { ...existing, ...clean(data) }
  writeMembers(members.map((m) => (m.id === existing.id ? updated : m)))
  return updated
}

export async function deleteMember(id) {
  const members = readMembers()
  if (!members.some((m) => m.id === Number(id))) throw new Error('Member not found.')
  writeMembers(members.filter((m) => m.id !== Number(id)))
}
