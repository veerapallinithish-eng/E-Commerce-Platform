import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PASSWORD_RULES, isPasswordValid } from '../utils/validatePassword'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordValid = isPasswordValid(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!passwordValid) {
      setPasswordTouched(true)
      setError('Please choose a password that meets all the requirements below.')
      return
    }

    setLoading(true)

    try {
      const newUser = await register(name, email, password, role)
      navigate(newUser.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      const data = err.response?.data
      // Backend may return { error, details: [...] } for password issues
      const message = data?.details ? `${data.error} ${data.details.join(' ')}` : data?.error
      setError(message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container pop-in" style={{ maxWidth: 400 }}>
      <h2>Create your account</h2>
      <p className="text-muted" style={{ marginTop: -8 }}>Join Trend cart in seconds.</p>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
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
          onFocus={() => setPasswordTouched(true)}
          required
        />

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Account Type</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              type="button"
              className={role === 'customer' ? 'btn' : 'btn btn-secondary'}
              style={{ flex: 1 }}
              onClick={() => setRole('customer')}
            >
              Customer
            </button>
            <button
              type="button"
              className={role === 'admin' ? 'btn' : 'btn btn-secondary'}
              style={{ flex: 1 }}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
          </div>
          {role === 'admin' && (
            <p className="text-muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
              Admin accounts can manage products, orders, and coupons, and view the sales dashboard.
            </p>
          )}
        </div>

        {passwordTouched && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {PASSWORD_RULES.map(rule => {
              const met = rule.test(password)
              return (
                <li key={rule.message} style={{ color: met ? '#188038' : '#666' }}>
                  {met ? '✓' : '○'} {rule.message}
                </li>
              )
            })}
          </ul>
        )}

        {error && <p className="text-danger" style={{ margin: 0 }}>{error}</p>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
      </p>
    </div>
  )
}
