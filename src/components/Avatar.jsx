const GRADIENTS = [
  ['#6366f1', '#8b5cf6'],
  ['#0ea5e9', '#6366f1'],
  ['#10b981', '#0d9488'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
  ['#14b8a6', '#0ea5e9'],
  ['#f97316', '#ec4899'],
]

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// Colourful initials avatar; the colour is stable for the same name.
export default function Avatar({ name, size = 40 }) {
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const [from, to] = GRADIENTS[hash % GRADIENTS.length]
  return (
    <span
      className="member-avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {initials(name)}
    </span>
  )
}
