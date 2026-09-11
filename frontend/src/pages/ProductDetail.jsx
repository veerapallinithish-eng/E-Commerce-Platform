import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'
import { formatINR } from '../utils/currency'
import { formatISTDate } from '../utils/datetime'
import { getImageUrl } from '../api'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user, isAdmin } = useAuth()
  const { isWishlisted, toggleWishlist } = useWishlist()

  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const [ratingData, setRatingData] = useState(null)
  const [ratingLoading, setRatingLoading] = useState(true)
  const [myRating, setMyRating] = useState(0)
  const [myReview, setMyReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ratingError, setRatingError] = useState('')
  const [ratingSuccess, setRatingSuccess] = useState('')

  useEffect(() => {
    api.get(`/products/${id}`).then(res => setProduct(res.data))
  }, [id])

  useEffect(() => {
    setSelectedImage(null)
  }, [id])

  function loadRatings() {
    setRatingLoading(true)
    api.get(`/products/${id}/ratings`)
      .then(res => {
        setRatingData(res.data)
        if (res.data.my_rating) {
          setMyRating(res.data.my_rating.rating)
          setMyReview(res.data.my_rating.review || '')
        }
      })
      .finally(() => setRatingLoading(false))
  }

  useEffect(() => {
    loadRatings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!product) return <div className="container">Loading...</div>

  const outOfStock = product.stock === 0
  const lowStock = !outOfStock && product.stock < 5
  const wishlisted = isWishlisted(product.id)
  const galleryImages = product.gallery?.length ? product.gallery : (product.image_url ? [product.image_url] : [])
  const mainImage = selectedImage || galleryImages[0]

  function handleAddToCart() {
    addToCart(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  async function handleSubmitRating(e) {
    e.preventDefault()
    setRatingError('')
    setRatingSuccess('')

    if (!myRating) {
      setRatingError('Please select a star rating.')
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/products/${id}/ratings`, { rating: myRating, review: myReview })
      setRatingSuccess('Thanks for your feedback!')
      loadRatings()
    } catch (err) {
      setRatingError(err.response?.data?.error || 'Failed to submit rating.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container fade-in">
      <button className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        &larr; Back
      </button>

      <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={getImageUrl(mainImage)}
            alt={product.name}
            style={{
              width: 340,
              height: 340,
              objectFit: 'cover',
              borderRadius: 16,
              boxShadow: 'var(--shadow-md)',
              backgroundColor: '#f0f0f0'
            }}
            onError={e => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23e0e0e0" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3ENo image%3C/text%3E%3C/svg%3E'
            }}
          />
          {galleryImages.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {galleryImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(imageUrl)}
                  aria-label={`View image ${index + 1}`}
                  style={{ padding: 2, border: `2px solid ${mainImage === imageUrl ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, background: 'transparent' }}
                >
                  <img src={getImageUrl(imageUrl)} alt="" style={{ width: 58, height: 58, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                </button>
              ))}
            </div>
          )}
          {user && !isAdmin && (
            <button
              className={`heart-btn${wishlisted ? ' active' : ''}`}
              style={{ position: 'absolute', top: 12, right: 12, width: 42, height: 42, fontSize: 18 }}
              onClick={() => toggleWishlist(product)}
              title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              {wishlisted ? '♥' : '♡'}
            </button>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            {product.category_name}
          </div>
          <h2 style={{ margin: '4px 0' }}>{product.name}</h2>

          <StarRating
            value={Number(product.avg_rating) || 0}
            count={Number(product.rating_count) || 0}
            size={18}
            showValue
          />

          <p style={{ color: '#444', marginTop: 14, lineHeight: 1.6 }}>{product.description}</p>
          <div style={{ fontSize: 28, fontWeight: 800, margin: '12px 0', color: 'var(--primary-dark)' }}>
            {formatINR(product.price)}
          </div>

          {outOfStock ? (
            <span className="badge badge-outofstock">Out of Stock</span>
          ) : (
            <>
              <div style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
                {product.stock} in stock
                {lowStock && <span className="badge badge-lowstock" style={{ marginLeft: 8 }}>Low Stock</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button className="btn btn-secondary btn-icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{quantity}</span>
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                >
                  +
                </button>
              </div>

              <button className="btn" onClick={handleAddToCart}>
                {added ? '✓ Added!' : 'Add to Cart'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card slide-up" style={{ marginTop: 40, maxWidth: 700 }}>
        <h3 style={{ marginTop: 0 }}>Ratings &amp; Reviews</h3>

        {ratingLoading ? (
          <p className="text-muted">Loading reviews...</p>
        ) : (
          <>
            {user && !isAdmin && ratingData?.can_rate && (
              <form onSubmit={handleSubmitRating} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>
                  {ratingData.my_rating ? 'Update your review' : 'Rate this product'}
                </div>
                <StarRating value={myRating} size={24} interactive onChange={setMyRating} />
                <textarea
                  rows={3}
                  placeholder="Share your thoughts about this product (optional)"
                  value={myReview}
                  onChange={e => setMyReview(e.target.value)}
                  style={{ marginTop: 10 }}
                />
                {ratingError && <p className="text-danger" style={{ margin: '8px 0 0' }}>{ratingError}</p>}
                {ratingSuccess && <p className="text-success" style={{ margin: '8px 0 0' }}>{ratingSuccess}</p>}
                <button className="btn btn-sm" type="submit" disabled={submitting} style={{ marginTop: 10 }}>
                  {submitting ? 'Submitting...' : ratingData.my_rating ? 'Update Rating' : 'Submit Rating'}
                </button>
              </form>
            )}

            {user && !isAdmin && !ratingData?.can_rate && (
              <p className="text-muted" style={{ fontSize: 13 }}>
                Only customers who have purchased this product can leave a rating.
              </p>
            )}

            {ratingData?.ratings?.length === 0 ? (
              <p className="text-muted">No reviews yet — be the first to rate this product!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {ratingData?.ratings?.map(r => (
                  <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{r.user_name}</strong>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatISTDate(r.created_at)}
                      </span>
                    </div>
                    <StarRating value={r.rating} size={14} />
                    {r.review && <p style={{ margin: '6px 0 0', color: '#444' }}>{r.review}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
