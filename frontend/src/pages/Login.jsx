import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)
      navigate(user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to the server. Start Flask on port 5000 and try again.'
          : 'Login failed')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container fade-in" style={{ maxWidth: 400 }}>
      <h2>Welcome back</h2>
      <p className="text-muted" style={{ marginTop: -8 }}>Log in to continue shopping.</p>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-danger" style={{ margin: 0 }}>{error}</p>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register</Link>
      </p>
    </div>
  )
}
