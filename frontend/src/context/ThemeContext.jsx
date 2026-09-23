import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const THEMES = ['light', 'dark', 'contrast']

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem('theme')
  return THEMES.includes(savedTheme) ? savedTheme : getSystemTheme()
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (localStorage.getItem('theme')) return undefined

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = event => setTheme(event.matches ? 'dark' : 'light')
    mediaQuery.addEventListener?.('change', handleSystemThemeChange)

    return () => mediaQuery.removeEventListener?.('change', handleSystemThemeChange)
  }, [])

  function cycleTheme() {
    setTheme(currentTheme => {
      const nextIndex = (THEMES.indexOf(currentTheme) + 1) % THEMES.length
      return THEMES[nextIndex]
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
