import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import StarRating from '../components/StarRating'
import { formatINR } from '../utils/currency'

export default function Wishlist() {
  const { wishlist, loading, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()

  if (loading) return <div className="container">Loading...</div>

  return (
    <div className="container fade-in">
      <h2>My Wishlist</h2>

      {wishlist.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>♡</div>
          <p className="text-muted">You haven't saved anything yet.</p>
          <Link to="/" className="btn" style={{ display: 'inline-block', marginTop: 8 }}>Browse Products</Link>
        </div>
      ) : (
        <div className="grid">
          {wishlist.map(product => {
            const outOfStock = product.stock === 0
            return (
              <div key={product.id} className="card card-hover fade-in" style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Link to={`/products/${product.id}`}>
                    <img
                      src={product.image_url || 'https://placehold.co/400x400/666666/FFFFFF?text=No+Image'}
                      alt={product.name}
                      style={{ width: '100%', height: 170, objectFit: 'cover', borderRadius: 10 }}
                    />
                  </Link>
                  <button
                    className="heart-btn active"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={() => toggleWishlist(product)}
                    title="Remove from wishlist"
                  >
                    ♥
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <Link to={`/products/${product.id}`}>
                    <h4 style={{ margin: '4px 0 6px' }}>{product.name}</h4>
                  </Link>
                  <StarRating value={Number(product.avg_rating) || 0} count={Number(product.rating_count) || 0} size={13} showValue />
                  <div style={{ fontWeight: 800, fontSize: 18, margin: '8px 0', color: 'var(--primary-dark)' }}>
                    {formatINR(product.price)}
                  </div>

                  <button
                    className="btn"
                    style={{ width: '100%' }}
                    disabled={outOfStock}
                    onClick={() => addToCart(product, 1)}
                  >
                    {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
