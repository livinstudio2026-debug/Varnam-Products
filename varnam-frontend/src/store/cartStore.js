import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { settingsAPI } from '../services/api'

function effectivePrice(product) {
  return product.discountPrice > 0 ? product.discountPrice : product.price
}

function computeTotals(items, freeShippingThreshold, flatShippingFee) {
  const subtotal = items.reduce(
    (sum, { product, quantity }) => sum + effectivePrice(product) * quantity,
    0
  )

  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold
  const shippingFee = subtotal === 0 ? 0 : qualifiesForFreeShipping ? 0 : flatShippingFee
  const grandTotal = subtotal + shippingFee

  const amountForFreeShipping = qualifiesForFreeShipping
    ? 0
    : freeShippingThreshold - subtotal

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  )

  return { subtotal, shippingFee, grandTotal, amountForFreeShipping, freeShippingProgress }
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      freeShippingThreshold: 499,
      flatShippingFee:       60,
      codLimit:              2000,
      codEnabled:            true,

      settingsFetched: false,

      fetchSettings: async () => {
        try {
          const { data } = await settingsAPI.getPublic()
          const { freeShippingThreshold, flatShippingFee, codLimit, codEnabled } = data.data
          set({
            freeShippingThreshold,
            flatShippingFee,
            codLimit,
            codEnabled,
            settingsFetched: true,
          })
        } catch {
          
        }
      },

      addItem: (product, quantity = 1) => {
        const { items } = get()
        const existingIndex = items.findIndex((item) => item.product._id === product._id)

        if (existingIndex !== -1) {
          const updatedItems = items.map((item, index) => {
            if (index !== existingIndex) return item
            const newQty = Math.min(item.quantity + quantity, product.stock)
            return { ...item, quantity: newQty }
          })
          set({ items: updatedItems })
        } else {
          const safeQty = Math.min(quantity, product.stock)
          set({ items: [...items, { product, quantity: safeQty }] })
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product._id !== productId),
        }))
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product._id === productId
              ? { ...item, quantity: Math.min(qty, item.product.stock) }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      itemCount: () =>
        get().items.reduce((sum, { quantity }) => sum + quantity, 0),

      isInCart: (productId) =>
        get().items.some((item) => item.product._id === productId),

      getItemQty: (productId) => {
        const item = get().items.find((i) => i.product._id === productId)
        return item ? item.quantity : 0
      },

      totals: () => {
        const { items, freeShippingThreshold, flatShippingFee } = get()
        return computeTotals(items, freeShippingThreshold, flatShippingFee)
      },

      subtotal: () => get().totals().subtotal,

      shippingFee: () => get().totals().shippingFee,

      grandTotal: () => get().totals().grandTotal,

      amountForFreeShipping: () => get().totals().amountForFreeShipping,

      freeShippingProgress: () => get().totals().freeShippingProgress,
    }),

    {
      name:    'varnam-cart',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        items:                 state.items,
        freeShippingThreshold: state.freeShippingThreshold,
        flatShippingFee:       state.flatShippingFee,
        codLimit:              state.codLimit,
        codEnabled:            state.codEnabled,
        settingsFetched:       state.settingsFetched,
      }),
    }
  )
)