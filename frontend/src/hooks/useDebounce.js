import { useEffect, useState } from 'react'

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const normalizedValue = typeof value === 'string' ? value.trim() : value
    const timer = setTimeout(() => {
      setDebounced(current => (current === normalizedValue ? current : normalizedValue))
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}