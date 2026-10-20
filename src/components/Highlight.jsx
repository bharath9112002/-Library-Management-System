import { splitMatch } from '../utils/search'

// Wraps the first match of `query` in <mark>.
export default function Highlight({ text, query }) {
  const [before, match, after] = splitMatch(String(text), query)
  return (
    <>
      {before}
      {match && <mark>{match}</mark>}
      {after}
    </>
  )
}
