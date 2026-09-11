import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import StarRating from './StarRating'
import { formatINR } from '../utils/currency'
import { getImageUrl } from '../api'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { user, isAdmin } = useAuth()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [justAdded, setJustAdded] = useState(false)
  const [heartAnimating, setHeartAnimating] = useState(false)

  const outOfStock = product.stock === 0
  const lowStock = !outOfStock && product.stock < 5
  const wishlisted = isWishlisted(product.id)

  function handleAdd() {
    addToCart(product, 1)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  function handleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
    setHeartAnimating(true)
    setTimeout(() => setHeartAnimating(false), 500)
  }

  return (
    <div className="card card-hover fade-in" style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Link to={`/products/${product.id}`}>
          <img
            src={getImageUrl(product.image_url)}
            alt={product.name}
            style={{
              width: '100%',
              height: 170,
              objectFit: 'cover',
              borderRadius: 10,
              display: 'block',
              backgroundColor: '#f0f0f0'
            }}
            onError={e => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e0e0e0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%23999"%3ENo image%3C/text%3E%3C/svg%3E'
            }}
          />
        </Link>

        {user && !isAdmin && (
          <button
            className={`heart-btn${wishlisted ? ' active' : ''}${heartAnimating ? ' animate' : ''}`}
            style={{ position: 'absolute', top: 8, right: 8 }}
            onClick={handleWishlist}
            title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label="Toggle wishlist"
          >
            {wishlisted ? '♥' : '♡'}
          </button>
        )}

        {lowStock && (
          <span className="badge badge-lowstock" style={{ position: 'absolute', bottom: 8, left: 8 }}>
            Only {product.stock} left
          </span>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {product.category_name}
        </div>
        <Link to={`/products/${product.id}`}>
          <h4 style={{ margin: '4px 0 6px' }}>{product.name}</h4>
        </Link>

        <StarRating
          value={Number(product.avg_rating) || 0}
          count={Number(product.rating_count) || 0}
          size={13}
          showValue
        />

        <div style={{ fontWeight: 800, fontSize: 18, margin: '8px 0', color: 'var(--primary-dark)' }}>
          {formatINR(product.price)}
        </div>

        {outOfStock && (
          <span className="badge badge-outofstock" style={{ marginBottom: 8 }}>Out of Stock</span>
        )}

        <button
          className="btn"
          style={{ width: '100%', marginTop: 8 }}
          disabled={outOfStock}
          onClick={handleAdd}
        >
          {outOfStock ? 'Out of Stock' : justAdded ? '✓ Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
