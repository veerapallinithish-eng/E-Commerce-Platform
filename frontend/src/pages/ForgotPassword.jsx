import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/forgot-password', { email })
      setMessage(response.data.message)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not request a password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container fade-in" style={{ maxWidth: 400 }}>
      <h2>Forgot password</h2>
      <p className="text-muted" style={{ marginTop: -8 }}>We will email you a secure reset link.</p>
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
        />
        {message && <p style={{ color: 'var(--success)', margin: 0 }}>{message}</p>}
        {error && <p className="text-danger" style={{ margin: 0 }}>{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p style={{ marginTop: 12 }}><Link to="/login">Back to login</Link></p>
    </div>
  )
}
