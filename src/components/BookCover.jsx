import { useState } from 'react'

// Shows the cover image, or a generated placeholder if it's missing / fails to load.
export default function BookCover({ src, title, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const showImage = src && failedSrc !== src

  if (showImage) {
    return (
      <img
        className={`book-cover ${className}`}
        src={src}
        alt={`Cover of ${title}`}
        loading="lazy"
        onError={() => setFailedSrc(src)}
      />
    )
  }

  return (
    <div className={`book-cover book-cover-fallback ${className}`} role="img" aria-label={`Cover of ${title}`}>
      <span>{title}</span>
    </div>
  )
}
