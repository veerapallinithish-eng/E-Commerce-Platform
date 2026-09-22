import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import { useAuth } from './context/AuthContext'

import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import Wishlist from './pages/Wishlist'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import ProductForm from './pages/admin/ProductForm'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCoupons from './pages/admin/AdminCoupons'

export default function App() {
  const { loading: authLoading } = useAuth()

  return (
    <>
      <div className={`navbar-slot${authLoading ? ' is-loading' : ''}`}>
        <Navbar />
      </div>

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Customer-only routes */}
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/add"
          element={
            <AdminRoute>
              <ProductForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/edit/:id"
          element={
            <AdminRoute>
              <ProductForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <AdminRoute>
              <AdminCoupons />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  )
}
