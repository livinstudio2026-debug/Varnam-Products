import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Only redirect to login on 401 for routes that genuinely require auth.
// Public pages (/, /shop, /product/*, /track, etc.) are accessible to guests
// and must never trigger a redirect on a 401.
const PROTECTED_PATHS = ['/account', '/orders', '/checkout']

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      const isAdminPath = path.startsWith('/admin')
      const isProtectedPath = PROTECTED_PATHS.some(p => path.startsWith(p))
      if (isAdminPath && path !== '/admin/login') {
        window.location.href = '/admin/login'
      } else if (!isAdminPath && isProtectedPath) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  )
}

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
  sendRegisterOtp: (email) => api.post('/auth/send-register-otp', { email }),
  verifyRegisterOtp: (email, otp) => api.post('/auth/verify-register-otp', { email, otp }),
  sendGuestCheckoutOtp: (email) => api.post('/auth/send-guest-checkout-otp', { email }),
  verifyGuestCheckoutOtp: (email, otp) => api.post('/auth/verify-guest-checkout-otp', { email, otp }),
}

export const adminAuthAPI = {
  login: (data) => api.post('/admin/login', data),
  logout: () => api.post('/admin/logout'),
  getMe: () => api.get('/admin/me'),
}

export const productAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getByCategory: (slug, params = {}) => api.get(`/products/category/${slug}`, { params }),
  getFeatured: () => api.get('/products/featured'),
  getBestSellers: () => api.get('/products/best-sellers'),
  search: (q) => api.get('/products/search', { params: { q } }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  toggleStatus: (id) => api.patch(`/products/status/${id}`),
  updateStock: (id, stock) => api.patch(`/products/stock/${id}`, { stock }),
  toggleFeatured: (id) => api.patch(`/products/featured/${id}`),
  toggleBestSeller: (id) => api.patch(`/products/best-seller/${id}`),
}

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params = {}) => api.get('/orders/my-orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  trackByOrderNumber: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
  submitCancelRequest: (id, reason) => api.post(`/orders/${id}/cancel-request`, { reason }),
  getCancelRequestStatus: (id) => api.get(`/orders/${id}/cancel-request`),
  getAll: (params = {}) => api.get('/orders', { params }),
  getByUser: (userId) => api.get(`/orders/user/${userId}`),
  getByStatus: (status) => api.get(`/orders/status/${status}`),
  updateStatus: (id, status) => api.put(`/orders/status/${id}`, { orderStatus: status }),
  cancelOrder: (id, skipRefund = false) => api.put(`/orders/cancel/${id}`, { skipRefund }),
}

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getSalesAnalytics: (days = 30) => api.get('/admin/sales', { params: { days } }),
  getLowStock: () => api.get('/admin/low-stock'),
  getCustomers: (params = {}) => api.get('/admin/customers', { params }),
  getCustomerById: (id) => api.get(`/admin/customers/${id}`),
  toggleBlockCustomer: (id) => api.patch(`/admin/customers/block/${id}`),
  getCancelRequests: (status = 'Pending') => api.get('/admin/cancel-requests', { params: { status } }),
  approveCancelRequest: (id) => api.put(`/orders/${id}/cancel-request`, { resolution: 'Approved' }),
  rejectCancelRequest: (id, note = '') => api.put(`/orders/${id}/cancel-request`, { resolution: 'Rejected', adminNote: note }),
}

export const reportAPI = {
  generateOrderReport: (period = 'all') => api.get('/admin/reports/orders', { params: { period } }),
}

export const settingsAPI = {
  getPublic: () => api.get('/settings'),
  getAdmin: () => api.get('/settings/admin'),
  update: (data) => api.put('/settings', data),
}

export const bannerAPI = {
  getActive: () => api.get('/banners'),
  getAll: () => api.get('/banners/all'),
  create: (data) => api.post('/banners', data),
  update: (id, data) => api.put(`/banners/${id}`, data),
  toggleStatus: (id) => api.patch(`/banners/status/${id}`),
  delete: (id) => api.delete(`/banners/${id}`),
}

export const uploadAPI = {
  uploadProductImage: (file) => {
    const form = new FormData()
    form.append('image', file)
    return api.post('/upload/product', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadProductImages: (files) => {
    const form = new FormData()
    files.forEach((file) => form.append('images', file))
    return api.post('/upload/products/multiple', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadCategoryImage: (file) => {
    const form = new FormData()
    form.append('image', file)
    return api.post('/upload/category', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadBannerImage: (file) => {
    const form = new FormData()
    form.append('image', file)
    return api.post('/upload/banner', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deleteAsset: (publicId) => api.delete('/upload', { data: { publicId } }),
}

export const paymentAPI = {
  createRazorpayOrder: (payload) => api.post('/payment/create-order', payload),
}

export const cartAPI = {
  // Fetch the user's persisted cart from MongoDB
  get: () => api.get('/cart'),
  // Sync the full items array to MongoDB (called after every mutation)
  sync: (items) => api.put('/cart', { items }),
  // Clear the cart in MongoDB (after order placement)
  clear: () => api.delete('/cart'),
}

export default api