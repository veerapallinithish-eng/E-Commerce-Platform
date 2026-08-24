import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useCart } from '../context/CartContext'
import { formatINR } from '../utils/currency'

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)

  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponChecking, setCouponChecking] = useState(false)

  if (cartItems.length === 0) {
    return (
      <div className="container">
        <h2>Checkout</h2>
        <p>Your cart is empty.</p>
      </div>
    )
  }

  const discountAmount = coupon ? coupon.discount_amount : 0
  const finalTotal = Math.max(0, cartTotal - discountAmount)

  async function handleApplyCoupon(e) {
    e.preventDefault()
    setCouponError('')

    if (!couponInput.trim()) return

    setCouponChecking(true)
    try {
      const res = await api.post('/coupons/validate', {
        code: couponInput.trim(),
        subtotal: cartTotal
      })
      setCoupon(res.data)
    } catch (err) {
      setCoupon(null)
      setCouponError(err.response?.data?.error || 'Invalid coupon code')
    } finally {
      setCouponChecking(false)
    }
  }

  function handleRemoveCoupon() {
    setCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  async function handlePlaceOrder(e) {
    e.preventDefault()
    setError('')

    if (!address.trim()) {
      setError('Please enter a delivery address.')
      return
    }

    setPlacing(true)

    try {
      const items = cartItems.map(i => ({ product_id: i.id, quantity: i.qty }))
      await api.post('/orders', {
        items,
        address,
        coupon_code: coupon ? coupon.code : undefined
      })

      clearCart()
      navigate('/orders')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="container fade-in">
      <h2>Checkout</h2>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <form onSubmit={handlePlaceOrder} className="card" style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginTop: 0 }}>Delivery Address</h3>
          <textarea
            rows={4}
            placeholder="Enter your full delivery address"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />

          {error && <p className="text-danger">{error}</p>}

          <button className="btn" type="submit" disabled={placing} style={{ marginTop: 12 }}>
            {placing ? 'Placing Order...' : `Place Order — ${formatINR(finalTotal)}`}
          </button>
        </form>

        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginTop: 0 }}>Order Summary</h3>
          {cartItems.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{item.name} x {item.qty}</span>
              <span>{formatINR(item.qty * Number(item.price))}</span>
            </div>
          ))}

          <hr />

          {coupon ? (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--success-light)', padding: '8px 12px', borderRadius: 8, marginBottom: 12
            }}>
              <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: 13 }}>
                🎟️ {coupon.code} applied (-{coupon.discount_percent}%)
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13 }}
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                placeholder="Coupon code"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value)}
                style={{ textTransform: 'uppercase' }}
              />
              <button className="btn btn-secondary btn-sm" type="submit" disabled={couponChecking} style={{ whiteSpace: 'nowrap' }}>
                {couponChecking ? 'Checking...' : 'Apply'}
              </button>
            </form>
          )}
          {couponError && <p className="text-danger" style={{ fontSize: 13, marginTop: -6 }}>{couponError}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="text-muted">Subtotal</span>
            <span>{formatINR(cartTotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--success)' }}>
              <span>Discount</span>
              <span>-{formatINR(discountAmount)}</span>
            </div>
          )}

          <hr />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18 }}>
            <span>Total</span>
            <span>{formatINR(finalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
