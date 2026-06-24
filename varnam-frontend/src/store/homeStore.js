import { create } from 'zustand'
import { bannerAPI, productAPI, categoryAPI } from '../services/api'

export const useHomeStore = create((set, get) => ({
  banners:      null,
  featured:     null,
  bestSellers:  null,
  categories:   null,
  fetched:      false,
  loading:      false,

  fetch: async () => {
    // Already fetched — do nothing. This is the key guard.
    if (get().fetched || get().loading) return
    set({ loading: true })

    try {
      const [bannerRes, featuredRes, bestSellerRes, categoryRes] = await Promise.allSettled([
        bannerAPI.getActive(),
        productAPI.getFeatured(),
        productAPI.getBestSellers(),
        categoryAPI.getAll(),
      ])

      set({
        banners:     bannerRes.status     === 'fulfilled' ? bannerRes.value.data.data     : [],
        featured:    featuredRes.status   === 'fulfilled' ? featuredRes.value.data.data   : [],
        bestSellers: bestSellerRes.status === 'fulfilled' ? bestSellerRes.value.data.data : [],
        categories:  categoryRes.status   === 'fulfilled' ? categoryRes.value.data.data   : [],
        fetched:  true,
        loading:  false,
      })
    } catch {
      set({ loading: false })
    }
  },

  // Call this only when you explicitly want fresh data
  // (e.g. admin just updated products)
  invalidate: () => set({ fetched: false }),
}))