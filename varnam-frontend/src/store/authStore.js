import { create } from 'zustand'
import { authAPI, adminAuthAPI } from '../services/api'

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
      set({
        user:            data.data,
        isAuthenticated: true,
        isAdmin:         data.data?.role === 'admin',
        loading:         false,
      })
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
      } catch {
        // No session at all
        set({ user: null, isAuthenticated: false, isAdmin: false, loading: false })
      }
    }
  },

  // ── Customer auth ─────────────────────────────────────────────────────

  login: async (credentials) => {
    const { data } = await authAPI.login(credentials)
    set({
      user:            data.data,
      isAuthenticated: true,
      isAdmin:         data.data?.role === 'admin',
      loading:         false,
    })
    return data
  },

  register: async (payload) => {
    const { data } = await authAPI.register(payload)
    set({
      user:            data.data,
      isAuthenticated: true,
      isAdmin:         false,
      loading:         false,
    })
    return data
  },

  logout: async () => {
    try { await authAPI.logout() } catch {}
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
    return data
  },

  adminLogout: async () => {
    try { await adminAuthAPI.logout() } catch {}
    set({ user: null, isAuthenticated: false, isAdmin: false, loading: false })
  },

  // ── Helpers ───────────────────────────────────────────────────────────

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isAdmin:         user?.role === 'admin',
    loading:         false,
  }),

  clearUser: () => set({
    user:            null,
    isAuthenticated: false,
    isAdmin:         false,
    loading:         false,
  }),
}))