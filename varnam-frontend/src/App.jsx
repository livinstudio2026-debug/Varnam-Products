import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense, useEffect } from 'react'

import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute     from './components/layout/AdminRoute'
import MainLayout     from './components/layout/MainLayout'
import AdminLayout    from './components/layout/AdminLayout'
import { useAuthStore } from './store/authStore'

// ── Customer pages ──
const Home          = lazy(() => import('./pages/Home'))
const Shop          = lazy(() => import('./pages/Shop'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart          = lazy(() => import('./pages/Cart'))
const Checkout      = lazy(() => import('./pages/Checkout'))
const Orders        = lazy(() => import('./pages/Orders'))
const OrderDetail   = lazy(() => import('./pages/OrderDetail'))
const TrackOrder    = lazy(() => import('./pages/TrackOrder'))
const Search        = lazy(() => import('./pages/Search'))
const Login         = lazy(() => import('./pages/Login'))
const Register      = lazy(() => import('./pages/Register'))
const Account       = lazy(() => import('./pages/Account'))
const NotFound      = lazy(() => import('./pages/NotFound'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))

// ── Admin pages ──
const AdminLogin      = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts   = lazy(() => import('./pages/admin/AdminProducts'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminOrders     = lazy(() => import('./pages/admin/AdminOrders'))
const AdminCustomers  = lazy(() => import('./pages/admin/AdminCustomers'))
const AdminBanners    = lazy(() => import('./pages/admin/AdminBanners'))
const AdminSettings   = lazy(() => import('./pages/admin/AdminSettings'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
    </div>
  )
}

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily:   'var(--font-body)',
            fontSize:     '14px',
            background:   '#fff',
            color:        '#26221C',
            border:       '1px solid #E8E0D0',
            borderRadius: '12px',
            boxShadow:    '0 4px 24px rgba(45,106,79,0.12)',
          },
          success: { iconTheme: { primary: '#2D6A4F', secondary: '#FDF6EC' } },
          error:   { iconTheme: { primary: '#C0392B', secondary: '#FDF6EC' } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── Customer pages — share MainLayout (Navbar + Footer) ── */}
          <Route element={<MainLayout><Outlet /></MainLayout>}>
            <Route path="/"               element={<Home />} />
            <Route path="/shop"           element={<Shop />} />
            <Route path="/category/:slug" element={<Shop />} />
            <Route path="/shop/:slug"     element={<ProductDetail />} />
            <Route path="/search"         element={<Search />} />
            <Route path="/cart"           element={<Cart />} />
            <Route path="/track-order"    element={<TrackOrder />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Checkout: guests allowed — server uses optionalProtect */}
            <Route path="/checkout"   element={<Checkout />} />

            {/* Require login */}
            <Route path="/orders"     element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/account"    element={<ProtectedRoute><Account /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* ── Admin login — no layout ── */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ── Admin pages — share AdminLayout (sidebar + topbar) ── */}
          <Route element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route path="/admin"            element={<AdminDashboard />} />
            <Route path="/admin/products"   element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/orders"     element={<AdminOrders />} />
            <Route path="/admin/customers"  element={<AdminCustomers />} />
            <Route path="/admin/banners"    element={<AdminBanners />} />
            <Route path="/admin/settings"   element={<AdminSettings />} />
          </Route>

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}