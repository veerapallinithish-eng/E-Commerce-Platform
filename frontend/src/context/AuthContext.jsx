import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    api.get('/me')
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const res = await api.post('/login', { email, password })
    localStorage.setItem('access_token', res.data.access_token)
    localStorage.setItem('refresh_token', res.data.refresh_token)
    setUser(res.data.user)
    return res.data.user
  }

  async function register(name, email, password, role = 'customer') {
    const res = await api.post('/register', { name, email, password, role })
    localStorage.setItem('access_token', res.data.access_token)
    localStorage.setItem('refresh_token', res.data.refresh_token)
    setUser(res.data.user)
    return res.data.user
  }

  async function logout() {
    try {
      await api.get('/logout', {
        headers: { 'X-Refresh-Token': localStorage.getItem('refresh_token') || '' }
      })
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
