import { useEffect, useState } from 'react'
import api from '../api'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (category) params.category = category
    if (search) params.search = search
    if (sort) params.sort = sort

    api.get('/products', { params })
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false))
  }, [category, search, sort])

  return (
    <div className="container">
      <div
        className="fade-in"
        style={{
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          borderRadius: 20,
          padding: '36px 32px',
          color: 'white',
          marginBottom: 28,
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <h1 style={{ margin: '0 0 6px', fontSize: 30, letterSpacing: '-0.02em' }}>Shop smarter, live better ✨</h1>
        <p style={{ margin: 0, opacity: 0.9, maxWidth: 520 }}>
          Discover top-rated electronics, apparel, home goods, and gear — with fast checkout and easy returns.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Products</h2>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />

        <select value={category} onChange={e => setCategory(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select value={sort} onChange={e => setSort(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Sort by</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ width: '100%', height: 170, borderRadius: 10 }} />
              <div className="skeleton" style={{ width: '60%', height: 12, marginTop: 14, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: '85%', height: 16, marginTop: 8, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: '40%', height: 20, marginTop: 10, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="text-muted">No products found. Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
