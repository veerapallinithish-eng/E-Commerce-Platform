import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api'
import ProductCard from '../components/ProductCard'
import Pagination from '../components/Pagination'
import { useDebounce } from '../hooks/useDebounce'

const PAGE_SIZE_OPTIONS = [8, 16, 24]

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState(() => searchParams.get('category') || '')
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const debouncedSearch = useDebounce(search, 500)
  const [sort, setSort] = useState(() => searchParams.get('sort') || '')
  const [pageSize, setPageSize] = useState(() => {
    const value = Number(searchParams.get('limit'))
    return PAGE_SIZE_OPTIONS.includes(value) ? value : 8
  })
  const [currentPage, setCurrentPage] = useState(() => {
    const value = Number(searchParams.get('page'))
    return Number.isInteger(value) && value > 0 ? value : 1
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const normalizedInput = search.trim()
    const normalizedSearch = debouncedSearch.trim()

    if (normalizedInput !== normalizedSearch) return undefined

    setLoading(true)
    const params = { page: currentPage, limit: pageSize }
    if (category) params.category = category
    if (normalizedSearch) params.search = normalizedSearch
    if (sort) params.sort = sort

    api.get('/products', { params, signal: controller.signal })
      .then(res => {
        setProducts(res.data.products)
        setTotalPages(res.data.total_pages)
        setTotalProducts(res.data.total)
      })
      .catch(error => {
        if (error.code !== 'ERR_CANCELED') throw error
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [category, search, debouncedSearch, sort, currentPage, pageSize])

  useEffect(() => {
    const nextParams = {}
    if (search) nextParams.search = search
    if (category) nextParams.category = category
    if (sort) nextParams.sort = sort
    if (currentPage > 1) nextParams.page = currentPage
    if (pageSize !== 8) nextParams.limit = pageSize

    setSearchParams(nextParams, { replace: true })
  }, [search, category, sort, currentPage, pageSize, setSearchParams])

  function handlePageChange(page) {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value))
    setCurrentPage(1)
  }

  function handleSearchChange(event) {
    setSearch(event.target.value)
    setCurrentPage(1)
  }

  function handleCategoryChange(event) {
    setCategory(event.target.value)
    setCurrentPage(1)
  }

  function handleSortChange(event) {
    setSort(event.target.value)
    setCurrentPage(1)
  }

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
        <h1 style={{ margin: '0 0 6px', fontSize: 30, letterSpacing: '-0.02em' }}>Everything you need, all in one cart.</h1>
        <p style={{ margin: 0, opacity: 0.9, maxWidth: 520 }}>
          Explore great products, great prices, and a smoother shopping experience.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Products</h2>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          placeholder="Search products..."
          value={search}
          onChange={handleSearchChange}
          style={{ maxWidth: 260 }}
        />

        <select value={category} onChange={handleCategoryChange} style={{ maxWidth: 180 }}>
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select value={sort} onChange={handleSortChange} style={{ maxWidth: 180 }}>
          <option value="">Sort by</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>

        <select value={pageSize} onChange={handlePageSizeChange} style={{ maxWidth: 180 }} aria-label="Products per page">
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>
      </div>

      <p className="text-muted" style={{ margin: '0 0 16px' }}>
        Showing {products.length} of {totalProducts} products
      </p>

      <div style={{ minHeight: 420 }}>
        {loading ? (
          <div className="grid">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="card skeleton-card" aria-hidden="true">
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={loading}
      />
    </div>
  )
}
