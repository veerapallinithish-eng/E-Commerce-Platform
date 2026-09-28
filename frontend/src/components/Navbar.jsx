import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useTheme } from '../context/ThemeContext'
import { getImageUrl } from '../api'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const initials = user?.name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" style={{
        fontWeight: 800,
        fontSize: 22,
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em'
      }}>
        🛍️ TrendzCart
      </Link>

      <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
        <Link to="/" className="nav-link">Home</Link>

        {user && !isAdmin && <Link to="/orders" className="nav-link">My Orders</Link>}

        {isAdmin && (
          <>
            <Link to="/admin" className="nav-link">Dashboard</Link>
            <Link to="/admin/products" className="nav-link">Manage Products</Link>
            <Link to="/admin/orders" className="nav-link">Manage Orders</Link>
            <Link to="/admin/coupons" className="nav-link">Coupons</Link>
          </>
        )}

        {user && !isAdmin && (
          <Link to="/wishlist" className="nav-link" style={{ position: 'relative' }}>
            Wishlist
            {wishlistCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -10,
                right: -16,
                background: 'var(--danger)',
                color: 'white',
                borderRadius: '50%',
                fontSize: 11,
                fontWeight: 700,
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {wishlistCount}
              </span>
            )}
          </Link>
        )}

        {!isAdmin && (
          <Link to="/cart" className="nav-link" style={{ position: 'relative' }}>
            Cart
            {cartCount > 0 && (
              <span className="pop-in" style={{
                position: 'absolute',
                top: -10,
                right: -16,
                background: 'var(--accent)',
                color: 'white',
                borderRadius: '50%',
                fontSize: 11,
                fontWeight: 700,
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartCount}
              </span>
            )}
          </Link>
        )}

        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch theme. Current theme: ${theme}`}
          title={`Theme: ${theme}`}
        >
          <span aria-hidden="true">{theme === 'light' ? '🌙' : theme === 'dark' ? '◐' : '☀️'}</span>
          <span className="theme-toggle-label">{theme}</span>
        </button>

        {user ? (
          <>
            <Link to="/profile" className="profile-nav-link" title="My Profile">
              {user.avatar_url ? (
                <img src={getImageUrl(user.avatar_url)} alt="Profile" className="avatar avatar-sm" />
              ) : (
                <span className="avatar avatar-sm avatar-placeholder">{initials}</span>
              )}
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Hi, {user.name.split(' ')[0]}</span>
            </Link>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-sm">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
