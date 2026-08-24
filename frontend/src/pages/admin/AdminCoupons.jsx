import { useEffect, useState } from 'react'
import api from '../../api'
import { formatINR } from '../../utils/currency'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    code: '',
    discount_percent: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: ''
  })

  function loadCoupons() {
    setLoading(true)
    api.get('/admin/coupons').then(res => setCoupons(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await api.post('/admin/coupons', {
        code: form.code,
        discount_percent: parseFloat(form.discount_percent),
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
        max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
        expires_at: form.expires_at || null
      })
      setForm({ code: '', discount_percent: '', min_order_amount: '', max_uses: '', expires_at: '' })
      loadCoupons()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this coupon?')) return
    await api.delete(`/admin/coupons/${id}`)
    loadCoupons()
  }

  if (loading) return <div className="container">Loading...</div>

  return (
    <div className="container fade-in">
      <h2>Manage Coupons</h2>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <form onSubmit={handleCreate} className="card slide-up" style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ marginTop: 0 }}>New Coupon</h3>
          <input
            name="code"
            placeholder="Coupon code (e.g. SUMMER15)"
            value={form.code}
            onChange={handleChange}
            style={{ textTransform: 'uppercase' }}
            required
          />
          <input
            name="discount_percent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="Discount %"
            value={form.discount_percent}
            onChange={handleChange}
            required
          />
          <input
            name="min_order_amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Minimum order amount in ₹ (optional)"
            value={form.min_order_amount}
            onChange={handleChange}
          />
          <input
            name="max_uses"
            type="number"
            min="1"
            placeholder="Max uses (optional)"
            value={form.max_uses}
            onChange={handleChange}
          />
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Expires (optional)</label>
            <input name="expires_at" type="date" value={form.expires_at} onChange={handleChange} style={{ marginTop: 4 }} />
          </div>

          {error && <p className="text-danger" style={{ margin: 0 }}>{error}</p>}

          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Coupon'}
          </button>
        </form>

        <div className="card slide-up" style={{ flex: '2 1 380px', overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>Active Coupons</h3>
          {coupons.length === 0 ? (
            <p className="text-muted">No coupons yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Uses</th>
                  <th>Expires</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>🎟️ {c.code}</td>
                    <td>{Number(c.discount_percent)}%</td>
                    <td className="text-muted">{Number(c.min_order_amount) > 0 ? formatINR(c.min_order_amount) : '—'}</td>
                    <td className="text-muted">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                    <td className="text-muted">{c.expires_at || 'Never'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
