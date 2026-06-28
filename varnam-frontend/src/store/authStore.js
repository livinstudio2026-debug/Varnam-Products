import { create } from 'zustand'
import { authAPI, adminAuthAPI } from '../services/api'
import { useCartStore } from './cartStore'

export const useAuthStore = create((set) => ({
  user:            null,
  isAuthenticated: false,
  isAdmin:         false,
  loading:         true,

  // Fix: try customer session first, then admin session if that fails.
  // This is why admin dashboard was inaccessible after refresh — init()
  // only called /auth/me which returns 401 for admin-only cookies.
  init: async () => {
    set({ loading: true })
    try {
      const { data } = await authAPI.getMe()
      const user = data.data
      set({
        user,
        isAuthenticated: true,
        isAdmin:         user?.role === 'admin',
        loading:         false,
      })
      // Mirror auth state into cartStore, then hydrate cart from DB
      useCartStore.getState()._setAuthState(true)
      await useCartStore.getState().hydrateFromDB()
    } catch {
      // Customer session failed — try admin session
      try {
        const { data } = await adminAuthAPI.getMe()
        set({
          user:            data.data,
          isAuthenticated: true,
          isAdmin:         true,
          loading:         false,
        })
        // Admins don't have a shopping cart — no hydration needed
        useCartStore.getState()._setAuthState(false)
      } catch {
        // No session at all
        set({ user: null, isAuthenticated: false, isAdmin: false, loading: false })
        useCartStore.getState()._setAuthState(false)
      }
    }
  },

  // ── Customer auth ─────────────────────────────────────────────────────

  login: async (credentials) => {
    const { data } = await authAPI.login(credentials)
    const user = data.data
    set({
      user,
      isAuthenticated: true,
      isAdmin:         user?.role === 'admin',
      loading:         false,
    })
    // Mirror auth state then hydrate — any local cart items get pushed to DB
    useCartStore.getState()._setAuthState(true)
    await useCartStore.getState().hydrateFromDB()
    return data
  },

  register: async (payload) => {
    const { data } = await authAPI.register(payload)
    const user = data.data
    set({
      user,
      isAuthenticated: true,
      isAdmin:         false,
      loading:         false,
    })
    useCartStore.getState()._setAuthState(true)
    await useCartStore.getState().hydrateFromDB()
    return data
  },

  logout: async () => {
    try { await authAPI.logout() } catch {}
    // Clear DB cart flag before wiping local state
    useCartStore.getState()._setAuthState(false)
    useCartStore.getState().clearCart(false)  // false = skip DB call (session gone)
    set({ user: null, isAuthenticated: false, isAdmin: false, loading: false })
  },

  // ── Admin auth ────────────────────────────────────────────────────────

  adminLogin: async (credentials) => {
    const { data } = await adminAuthAPI.login(credentials)
    set({
      user:            data.data,
      isAuthenticated: true,
      isAdmin:         true,
      loading:         false,
    })
    // Admins don't have a cart
    useCartStore.getState()._setAuthState(false)
    return data
  },

  adminLogout: async () => {
    try { await adminAuthAPI.logout() } catch {}
    useCartStore.getState()._setAuthState(false)
    set({ user: null, isAuthenticated: false, isAdmin: false, loading: false })
  },

  // ── Helpers ───────────────────────────────────────────────────────────

  setUser: (user) => {
    const isAuthenticated = !!user
    set({
      user,
      isAuthenticated,
      isAdmin:  user?.role === 'admin',
      loading:  false,
    })
    useCartStore.getState()._setAuthState(isAuthenticated && user?.role !== 'admin')
  },

  clearUser: () => {
    useCartStore.getState()._setAuthState(false)
    set({
      user:            null,
      isAuthenticated: false,
      isAdmin:         false,
      loading:         false,
    })
  },
}))