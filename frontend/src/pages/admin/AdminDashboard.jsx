import { useEffect, useState } from 'react'
import api from '../../api'
import { formatINR } from '../../utils/currency'

const STATUS_ORDER = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']
const STATUS_BADGE = {
  Pending: 'badge-pending',
  Confirmed: 'badge-confirmed',
  Shipped: 'badge-shipped',
  Delivered: 'badge-delivered',
  Cancelled: 'badge-cancelled'
}

function TokenExpiryCountdown() {
  const [secondsRemaining, setSecondsRemaining] = useState(null)

  useEffect(() => {
    function updateCountdown() {
      const token = localStorage.getItem('access_token')
      if (!token) return setSecondsRemaining(null)

      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setSecondsRemaining(Math.max(0, payload.exp - Math.floor(Date.now() / 1000)))
      } catch {
        setSecondsRemaining(null)
      }
    }

    updateCountdown()
    const interval = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(interval)
  }, [])

  if (secondsRemaining === null) return null

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = String(secondsRemaining % 60).padStart(2, '0')
  return <p className="text-muted" style={{ marginTop: -8 }}>Access token expires in {minutes}:{seconds}</p>
}

function StatCard({ label, value, accent, icon }) {
  return (
    <div className="card card-hover slide-up" style={{ flex: '1 1 200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, background: accent
        }}>
          {icon}
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {label}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/summary')
      .then(res => setSummary(res.data))
      .catch(() => setError('Could not load dashboard data. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container">Loading dashboard...</div>
  if (error) return <div className="container"><p className="error-text">{error}</p></div>
  if (!summary) return <div className="container">Could not load dashboard.</div>

  const maxUnits = Math.max(1, ...summary.top_products.map(p => Number(p.units_sold)))

  return (
    <div className="container fade-in">
      <h2>Sales Dashboard</h2>
      <p className="text-muted" style={{ marginTop: -8 }}>A live snapshot of store performance.</p>
      <TokenExpiryCountdown />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Total Revenue" value={formatINR(summary.total_revenue)} accent="var(--success-light)" icon="💰" />
        <StatCard label="Total Orders" value={summary.total_orders} accent="var(--info-light)" icon="📦" />
        <StatCard label="Avg Order Value" value={formatINR(summary.avg_order_value)} accent="var(--primary-light)" icon="📊" />
        <StatCard label="Customers" value={summary.total_customers} accent="#ffe9f0" icon="👥" />
        {summary.low_stock_count > 0 && (
          <StatCard label="Low Stock Items" value={summary.low_stock_count} accent="var(--warning-light)" icon="⚠️" />
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div className="card slide-up" style={{ flex: '2 1 360px' }}>
          <h3 style={{ marginTop: 0 }}>Top Selling Products</h3>
          {summary.top_products.length === 0 ? (
            <p className="text-muted">No sales yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {summary.top_products.map((p, i) => (
                <div key={p.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>{i + 1}. {p.name}</span>
                    <span className="text-muted">{p.units_sold} sold · {formatINR(p.revenue)}</span>
                  </div>
                  <div style={{ background: 'var(--primary-light)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(Number(p.units_sold) / maxUnits) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                        borderRadius: 999,
                        transition: 'width 0.6s var(--ease)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card slide-up" style={{ flex: '1 1 240px' }}>
          <h3 style={{ marginTop: 0 }}>Orders by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STATUS_ORDER.map(status => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${STATUS_BADGE[status]}`}>{status}</span>
                <span style={{ fontWeight: 700 }}>{summary.orders_by_status[status] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
