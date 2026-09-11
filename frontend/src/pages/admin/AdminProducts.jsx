import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { formatINR } from '../../utils/currency'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  function loadProducts() {
    setLoading(true)
    api.get('/products', { params: { page: 1, limit: 100 } })
      .then(res => setProducts(res.data.products))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    await api.delete(`/products/${id}`)
    loadProducts()
  }

  if (loading) return <div className="container">Loading...</div>

  const lowStockCount = products.filter(p => p.stock < 5).length

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Manage Products</h2>
          {lowStockCount > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--warning)' }}>
              ⚠️ {lowStockCount} product{lowStockCount > 1 ? 's' : ''} running low on stock
            </p>
          )}
        </div>
        <Link to="/admin/products/add" className="btn">+ Add New Product</Link>
      </div>

      <div className="card slide-up" style={{ marginTop: 16, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td className="text-muted">{p.category_name}</td>
                <td>{formatINR(p.price)}</td>
                <td>
                  {p.stock}
                  {p.stock === 0 ? (
                    <span className="badge badge-outofstock" style={{ marginLeft: 6 }}>Out</span>
                  ) : p.stock < 5 ? (
                    <span className="badge badge-lowstock" style={{ marginLeft: 6 }}>Low Stock</span>
                  ) : null}
                </td>
                <td className="text-muted">
                  {Number(p.rating_count) > 0 ? `★ ${Number(p.avg_rating).toFixed(1)} (${p.rating_count})` : '—'}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/admin/products/edit/${p.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
