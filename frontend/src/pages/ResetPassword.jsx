import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api'

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = new URLSearchParams(location.search).get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!token) return setError('This password reset link is missing its token.')
    if (password !== confirmPassword) return setError('Passwords do not match.')

    setLoading(true)
    try {
      await api.post('/reset-password', { password }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      navigate('/login', { replace: true, state: { message: 'Password reset successfully. Please log in.' } })
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not reset your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container fade-in" style={{ maxWidth: 400 }}>
      <h2>Reset password</h2>
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={event => setConfirmPassword(event.target.value)}
          required
        />
        {error && <p className="text-danger" style={{ margin: 0 }}>{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
      <p style={{ marginTop: 12 }}><Link to="/login">Back to login</Link></p>
    </div>
  )
}
