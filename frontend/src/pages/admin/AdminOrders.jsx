import { useEffect, useState } from 'react'
import api from '../../api'
import { formatINR } from '../../utils/currency'
import { formatISTDate } from '../../utils/datetime'
import Pagination from '../../components/Pagination'

const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

const badgeClass = {
  Pending: 'badge-pending',
  Confirmed: 'badge-confirmed',
  Shipped: 'badge-shipped',
  Delivered: 'badge-delivered',
  Cancelled: 'badge-cancelled'
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  function loadOrders() {
    setLoading(true)
    api.get('/orders', { params: { page: currentPage, limit: 10 } })
      .then(res => {
        setOrders(res.data.orders)
        setTotalPages(res.data.total_pages)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [currentPage])

  async function handleStatusChange(orderId, status) {
    await api.put(`/orders/${orderId}/status`, { status })
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)))
  }

  if (loading) return <div className="container">Loading...</div>

  return (
    <div className="container fade-in">
      <h2>Manage Orders</h2>

      <div className="card slide-up" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td style={{ fontWeight: 600 }}>#{order.id}</td>
                <td>
                  {order.customer_name}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.customer_email}</div>
                </td>
                <td className="text-muted">{formatISTDate(order.ordered_at)}</td>
                <td style={{ fontWeight: 600 }}>
                  {formatINR(order.total_amount)}
                  {order.coupon_code && (
                    <div style={{ fontSize: 11, color: 'var(--success)' }}>🎟️ {order.coupon_code}</div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${badgeClass[order.status]}`}>{order.status}</span>
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      style={{ width: 130 }}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
