import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api'

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    image_url: ''
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data))
  }, [])

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then(res => {
        const p = res.data
        setForm({
          name: p.name,
          description: p.description || '',
          price: p.price,
          stock: p.stock,
          category_id: p.category_id,
          image_url: p.image_url || ''
        })
      })
    }
  }, [id, isEdit])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        category_id: parseInt(form.category_id, 10)
      }

      if (isEdit) {
        await api.put(`/products/${id}`, payload)
      } else {
        await api.post('/products', payload)
      }

      navigate('/admin/products')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const stockPreviewLow = form.stock !== '' && Number(form.stock) > 0 && Number(form.stock) < 5
  const stockPreviewOut = form.stock !== '' && Number(form.stock) === 0

  return (
    <div className="container fade-in" style={{ maxWidth: 520 }}>
      <h2>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>

      <form onSubmit={handleSubmit} className="card slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Product Name</label>
          <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required style={{ marginTop: 4 }} />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
          <textarea name="description" placeholder="Description" rows={3} value={form.description} onChange={handleChange} style={{ marginTop: 4 }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Price (₹)</label>
            <input name="price" type="number" step="0.01" placeholder="0.00" value={form.price} onChange={handleChange} required style={{ marginTop: 4 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Stock</label>
            <input name="stock" type="number" placeholder="0" value={form.stock} onChange={handleChange} required style={{ marginTop: 4 }} />
            {stockPreviewOut && <span className="badge badge-outofstock" style={{ marginTop: 6, display: 'inline-flex' }}>Will show Out of Stock</span>}
            {stockPreviewLow && <span className="badge badge-lowstock" style={{ marginTop: 6, display: 'inline-flex' }}>Will show Low Stock</span>}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
          <select name="category_id" value={form.category_id} onChange={handleChange} required style={{ marginTop: 4 }}>
            <option value="">Select Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Image URL</label>
          <input name="image_url" placeholder="https://..." value={form.image_url} onChange={handleChange} style={{ marginTop: 4 }} />
        </div>

        {form.image_url && (
          <img
            src={form.image_url}
            alt="Preview"
            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}

        {error && <p className="text-danger" style={{ margin: 0 }}>{error}</p>}

        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
        </button>
      </form>
    </div>
  )
}
