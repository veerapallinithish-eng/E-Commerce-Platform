import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatINR } from '../utils/currency'

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart()
  const navigate = useNavigate()

  if (cartItems.length === 0) {
    return (
      <div className="container fade-in">
        <h2>Your Cart</h2>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🛒</div>
          <p className="text-muted">Your cart is empty.</p>
          <Link to="/" className="btn" style={{ display: 'inline-block', marginTop: 8 }}>Continue Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container fade-in">
      <h2>Your Cart</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cartItems.map(item => (
          <div key={item.id} className="card card-hover slide-up" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <img
              src={item.image_url || 'https://placehold.co/100x100/666666/FFFFFF?text=No+Image'}
              alt={item.name}
              style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10 }}
            />

            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div className="text-muted">{formatINR(item.price)} each</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-secondary btn-icon" onClick={() => updateQuantity(item.id, item.qty - 1)}>-</button>
              <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
              <button className="btn btn-secondary btn-icon" onClick={() => updateQuantity(item.id, item.qty + 1)}>+</button>
            </div>

            <div style={{ width: 100, textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)' }}>
              {formatINR(item.qty * Number(item.price))}
            </div>

            <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.id)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24, textAlign: 'right' }}>
        <h3 style={{ margin: '0 0 12px' }}>Total: <span style={{ color: 'var(--primary-dark)' }}>{formatINR(cartTotal)}</span></h3>
        <button className="btn" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
      </div>
    </div>
  )
}
