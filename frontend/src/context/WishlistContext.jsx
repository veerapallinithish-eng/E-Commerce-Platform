import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api'
import { useAuth } from './AuthContext'

const WishlistContext = createContext()

export function WishlistProvider({ children }) {
  const { user, isAdmin } = useAuth()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(() => {
    if (!user || isAdmin) {
      setWishlist([])
      return
    }
    setLoading(true)
    api.get('/wishlist')
      .then(res => setWishlist(res.data))
      .catch(() => setWishlist([]))
      .finally(() => setLoading(false))
  }, [user, isAdmin])

  useEffect(() => {
    refresh()
  }, [refresh])

  function isWishlisted(productId) {
    return wishlist.some(p => p.id === productId)
  }

  async function toggleWishlist(product) {
    if (isWishlisted(product.id)) {
      setWishlist(prev => prev.filter(p => p.id !== product.id))
      try {
        await api.delete(`/wishlist/${product.id}`)
      } catch {
        refresh()
      }
    } else {
      setWishlist(prev => [{ ...product, added_at: new Date().toISOString() }, ...prev])
      try {
        await api.post('/wishlist', { product_id: product.id })
      } catch {
        refresh()
      }
    }
  }

  return (
    <WishlistContext.Provider value={{
      wishlist, loading, isWishlisted, toggleWishlist, refresh,
      wishlistCount: wishlist.length
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
