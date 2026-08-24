import { useState } from 'react'

// Renders 5 stars. Pass `value` to show a rating (supports decimals for
// averages, e.g. 4.3). Pass `interactive` + `onChange` to let the user pick
// a rating by clicking a star.
export default function StarRating({
  value = 0,
  size = 16,
  interactive = false,
  onChange,
  showValue = false,
  count
}) {
  const [hovered, setHovered] = useState(0)

  const display = interactive && hovered ? hovered : value

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        className={`stars${interactive ? ' interactive' : ''}`}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map(n => {
          const filled = n <= Math.round(display)
          return (
            <span
              key={n}
              className={`star${filled ? '' : ' empty'}`}
              style={{ fontSize: size }}
              onMouseEnter={() => interactive && setHovered(n)}
              onClick={() => interactive && onChange && onChange(n)}
            >
              {filled ? '★' : '☆'}
            </span>
          )
        })}
      </span>
      {showValue && (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {value > 0 ? value.toFixed(1) : 'No ratings'}
          {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
        </span>
      )}
    </span>
  )
}
