import { useEffect, useState } from 'react'
import api from '../api'
import { formatINR } from '../utils/currency'
import { formatISTDateTime } from '../utils/datetime'

const badgeClass = {
  Pending: 'badge-pending',
  Confirmed: 'badge-confirmed',
  Shipped: 'badge-shipped',
  Delivered: 'badge-delivered',
  Cancelled: 'badge-cancelled'
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/my')
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container">Loading...</div>

  return (
    <div className="container fade-in">
      <h2>My Orders</h2>

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="text-muted">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div key={order.id} className="card card-hover slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong>Order #{order.id}</strong>
                  <div style={{ color: '#888', fontSize: 13 }}>
                    {formatISTDateTime(order.ordered_at)}
                  </div>
                </div>
                <span className={`badge ${badgeClass[order.status]}`}>{order.status}</span>
              </div>

              <div style={{ marginTop: 12 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                    <span>{item.product_name} x {item.quantity}</span>
                    <span>{formatINR(item.quantity * Number(item.unit_price))}</span>
                  </div>
                ))}
              </div>

              <hr />

              {order.coupon_code && Number(order.discount_amount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span className="text-muted">Subtotal</span>
                  <span>{formatINR(order.subtotal_amount)}</span>
                </div>
              )}
              {order.coupon_code && Number(order.discount_amount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--success)' }}>
                  <span>🎟️ {order.coupon_code} discount</span>
                  <span>-{formatINR(order.discount_amount)}</span>
                </div>
              )}

              <div style={{ textAlign: 'right', fontWeight: 700 }}>
                Total: {formatINR(order.total_amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
